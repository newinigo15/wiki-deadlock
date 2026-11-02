import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests de los handlers de `src/app/api/**` con un Prisma falso en memoria.
 * `http.ts`, `schemas.ts`, `votes.ts` y `community.ts` son los reales; solo se sustituyen
 * la BD (`db.ts`) y la sesión/criptografía (`auth.ts`).
 */

type User = { id: string; username: string; passwordHash: string };
type Scored = { id: string; score: number; [k: string]: unknown };

const state = vi.hoisted(() => ({
  dbConfigured: true,
  currentUser: null as { id: string; username: string } | null,
}));

const store = vi.hoisted(() => ({
  users: new Map<string, User>(),
  builds: new Map<string, Scored>(),
  guides: new Map<string, Scored>(),
  buildVotes: new Map<string, number>(),
  guideVotes: new Map<string, number>(),
  comments: [] as { id: string; body: string; buildId: string; userId: string }[],
  seq: 0,
}));

const auth = vi.hoisted(() => ({
  getCurrentUser: vi.fn(async () => state.currentUser),
  createSession: vi.fn<(userId: string) => Promise<void>>(async () => {}),
  destroySession: vi.fn(async () => {}),
  hashPassword: vi.fn(async (pw: string) => `h:${pw}`),
  verifyPassword: vi.fn(async (pw: string, stored: string) => stored === `h:${pw}`),
}));

const prismaMock = vi.hoisted(() => {
  const nextId = (prefix: string) => `${prefix}${++store.seq}`;

  /** Error con la misma forma que lanza Prisma (`instanceof` real de @prisma/client). */
  const knownError = async (code: string) => {
    const { Prisma } = await import("@prisma/client");
    return new Prisma.PrismaClientKnownRequestError(`fake ${code}`, { code, clientVersion: "test" });
  };

  function voteTable(votes: Map<string, number>, targetKey: "buildId" | "guideId", compound: string) {
    const keyOf = (userId: string, targetId: string) => `${userId}:${targetId}`;
    const fromWhere = (where: Record<string, Record<string, string>>) => {
      const k = where[compound];
      return keyOf(k.userId, k[targetKey]);
    };
    return {
      findUnique: vi.fn(async ({ where }: { where: Record<string, Record<string, string>> }) => {
        const value = votes.get(fromWhere(where));
        return value === undefined ? null : { value };
      }),
      upsert: vi.fn(
        async ({ where, update, create }: { where: Record<string, Record<string, string>>; update: { value: number }; create: { value: number } }) => {
          const k = fromWhere(where);
          votes.set(k, votes.has(k) ? update.value : create.value);
          return { value: votes.get(k) };
        },
      ),
      deleteMany: vi.fn(async ({ where }: { where: Record<string, string> }) => {
        const deleted = votes.delete(keyOf(where.userId, where[targetKey]));
        return { count: deleted ? 1 : 0 };
      }),
    };
  }

  function scoredTable(rows: Map<string, Scored>, prefix: string) {
    return {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: nextId(prefix), score: 0, ...data };
        rows.set(row.id, row);
        return row;
      }),
      count: vi.fn(async ({ where }: { where: { id: string } }) => (rows.has(where.id) ? 1 : 0)),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: { score: { increment: number } } }) => {
        const row = rows.get(where.id);
        if (!row) throw await knownError("P2025");
        row.score += data.score.increment;
        return { ...row };
      }),
      findMany: vi.fn(async () => [] as unknown[]),
    };
  }

  const client = {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { username: string } }) => store.users.get(where.username) ?? null),
      create: vi.fn(async ({ data }: { data: { username: string; passwordHash: string } }) => {
        if (store.users.has(data.username)) throw await knownError("P2002");
        const user = { id: nextId("u"), ...data };
        store.users.set(user.username, user);
        return { id: user.id, username: user.username };
      }),
    },
    patch: { upsert: vi.fn(async () => ({ id: "patch-1", slug: "parche-1", name: "Parche 1" })) },
    build: scoredTable(store.builds, "b"),
    guide: scoredTable(store.guides, "g"),
    buildVote: voteTable(store.buildVotes, "buildId", "userId_buildId"),
    guideVote: voteTable(store.guideVotes, "guideId", "userId_guideId"),
    comment: {
      create: vi.fn(async ({ data }: { data: { body: string; buildId: string; userId: string } }) => {
        // Igual que la FK real: si la build ya no existe, Prisma lanza P2003.
        if (!store.builds.has(data.buildId)) throw await knownError("P2003");
        const comment = { id: nextId("c"), ...data };
        store.comments.push(comment);
        return { id: comment.id, body: comment.body, createdAt: new Date(), user: { username: "autor" } };
      }),
    },
    $queryRaw: vi.fn(async (strings: TemplateStringsArray, id: string) => {
      const sql = strings.join("?");
      const rows = sql.includes('"Build"') ? store.builds : store.guides;
      return rows.has(id) ? [{ id }] : [];
    }),
    $transaction: vi.fn(async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => fn(client)),
  };
  return client;
});

vi.mock("@/lib/server/db", () => ({
  get isDbConfigured() {
    return state.dbConfigured;
  },
  prisma: prismaMock,
}));
vi.mock("@/lib/server/auth", () => auth);

const BASE = "http://localhost";
const ALICE = { id: "u-alice", username: "alice" };
const BOB = { id: "u-bob", username: "bob" };
const LONG_BODY = "Una guía con contenido suficiente para pasar la validación mínima de 50 caracteres.";

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

// Los tests leen campos distintos de `data` según el endpoint; tiparlo uno a uno no aporta nada.
async function json(res: Response) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await res.json()) as { success: boolean; data: any; error: string | null };
}

function seed(kind: "build" | "guide", id: string, score = 0) {
  (kind === "build" ? store.builds : store.guides).set(id, { id, score });
}

beforeEach(() => {
  vi.resetModules(); // reinicia el limitador en memoria de http.ts
  vi.clearAllMocks();
  state.dbConfigured = true;
  state.currentUser = ALICE;
  store.users.clear();
  store.builds.clear();
  store.guides.clear();
  store.buildVotes.clear();
  store.guideVotes.clear();
  store.comments.length = 0;
  store.seq = 0;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/builds", () => {
  const valid = { heroSlug: "haze", title: "Haze balas", items: ["basic-magazine", "silencer"], flexSlots: 0 };
  const route = () => import("@/app/api/builds/route");

  it("crea la build con el autor y el parche actual (201)", async () => {
    const res = await (await route()).POST(post("/api/builds", valid));
    expect(res.status).toBe(201);
    const { data } = await json(res);
    expect(data.heroSlug).toBe("haze");
    expect(prismaMock.build.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ authorId: ALICE.id, patchId: "patch-1", title: "Haze balas" }) }),
    );
  });

  it("400 si el payload no pasa zod (héroe desconocido)", async () => {
    const res = await (await route()).POST(post("/api/builds", { ...valid, heroSlug: "no-existe" }));
    expect(res.status).toBe(400);
    expect((await json(res)).error).toBe("Héroe desconocido.");
    expect(prismaMock.build.create).not.toHaveBeenCalled();
  });

  it("400 si la build no cabe en los espacios", async () => {
    const items = ["basic-magazine", "rapid-rounds", "kinetic-dash", "long-range", "silencer"];
    const res = await (await route()).POST(post("/api/builds", { ...valid, items }));
    expect(res.status).toBe(400);
  });

  it("400 con JSON mal formado", async () => {
    const res = await (await route()).POST(post("/api/builds", "{no es json"));
    expect(res.status).toBe(400);
  });

  it("401 sin sesión", async () => {
    state.currentUser = null;
    const res = await (await route()).POST(post("/api/builds", valid));
    expect(res.status).toBe(401);
    expect(prismaMock.build.create).not.toHaveBeenCalled();
  });

  it("403 desde otro origen", async () => {
    const res = await (await route()).POST(post("/api/builds", valid, { origin: "https://evil.example", host: "localhost" }));
    expect(res.status).toBe(403);
  });

  it("503 si no hay base de datos configurada", async () => {
    state.dbConfigured = false;
    const res = await (await route()).POST(post("/api/builds", valid));
    expect(res.status).toBe(503);
  });

  it("500 sin filtrar detalles si Prisma falla", async () => {
    prismaMock.build.create.mockRejectedValueOnce(new Error("conexión perdida"));
    const res = await (await route()).POST(post("/api/builds", valid));
    expect(res.status).toBe(500);
    expect((await json(res)).error).toBe("No se pudo guardar la build.");
  });
});

describe("GET /api/builds", () => {
  const route = () => import("@/app/api/builds/route");

  it("400 con héroe desconocido o clave de prototipo", async () => {
    for (const hero of ["", "no-existe", "constructor"]) {
      const res = await (await route()).GET(new Request(`${BASE}/api/builds?hero=${hero}`));
      expect(res.status).toBe(400);
    }
  });

  it("503 si la comunidad no está disponible", async () => {
    state.dbConfigured = false;
    const res = await (await route()).GET(new Request(`${BASE}/api/builds?hero=haze`));
    expect(res.status).toBe(503);
  });

  it("500 si falla por un bug y 503 si la BD es inaccesible", async () => {
    prismaMock.build.findMany.mockRejectedValueOnce(new TypeError("bug"));
    const bug = await (await route()).GET(new Request(`${BASE}/api/builds?hero=haze`));
    expect(bug.status).toBe(500);

    prismaMock.build.findMany.mockRejectedValueOnce(await (async () => {
      const { Prisma } = await import("@prisma/client");
      return new Prisma.PrismaClientInitializationError("Can't reach database server", "test");
    })());
    const down = await (await route()).GET(new Request(`${BASE}/api/builds?hero=haze`));
    expect(down.status).toBe(503);
  });

  it("devuelve las builds con el voto propio y los comentarios", async () => {
    prismaMock.build.findMany.mockResolvedValueOnce([
      {
        id: "b1",
        title: "T",
        items: ["silencer"],
        flexSlots: 0,
        score: 3,
        votes: [{ value: -1 }],
        author: { username: "bob" },
        patch: { name: "Parche 1" },
        comments: [{ id: "c1", body: "hola", user: { username: "alice" } }],
      },
    ]);
    const res = await (await route()).GET(new Request(`${BASE}/api/builds?hero=haze`));
    expect(res.status).toBe(200);
    const { data } = await json(res);
    expect(data.signedIn).toBe(true);
    expect(data.builds[0]).toMatchObject({ id: "b1", score: 3, myVote: -1, author: "bob", patch: "Parche 1" });
    expect(data.builds[0].comments).toEqual([{ id: "c1", body: "hola", user: { username: "alice" } }]);
    expect(prismaMock.build.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { heroSlug: "haze" } }));
  });

  it("sin sesión myVote es 0 y no pide los votos", async () => {
    state.currentUser = null;
    prismaMock.build.findMany.mockResolvedValueOnce([
      { id: "b1", title: "T", items: [], flexSlots: 0, score: 0, author: { username: "bob" }, patch: { name: "P" }, comments: [] },
    ]);
    const { data } = await json(await (await route()).GET(new Request(`${BASE}/api/builds?hero=haze`)));
    expect(data.signedIn).toBe(false);
    expect(data.builds[0].myVote).toBe(0);
    const args = prismaMock.build.findMany.mock.calls[0] as unknown as [{ include: { votes: unknown } }];
    expect(args[0].include.votes).toBe(false);
  });
});

describe.each([
  { kind: "build" as const, path: "builds", notFound: "Build no encontrada." },
  { kind: "guide" as const, path: "guides", notFound: "Guía no encontrada." },
])("POST /api/$path/[id]/vote", ({ kind, path, notFound }) => {
  const route = () =>
    kind === "build" ? import("@/app/api/builds/[id]/vote/route") : import("@/app/api/guides/[id]/vote/route");
  const vote = async (id: string, value: unknown) =>
    (await route()).POST(post(`/api/${path}/${id}/vote`, { value }), params(id));
  const scoreOf = (id: string) => (kind === "build" ? store.builds : store.guides).get(id)!.score;

  it("caso feliz: un voto positivo suma 1", async () => {
    seed(kind, "t1");
    const res = await vote("t1", 1);
    expect(res.status).toBe(200);
    expect((await json(res)).data).toEqual({ score: 1, myVote: 1 });
    expect(scoreOf("t1")).toBe(1);
  });

  it("repetir el mismo voto no cuenta doble", async () => {
    seed(kind, "t1");
    await vote("t1", 1);
    const res = await vote("t1", 1);
    expect((await json(res)).data.score).toBe(1);
    expect(scoreOf("t1")).toBe(1);
  });

  it("cambiar de +1 a -1 resta 2 (no deja el +1 anterior)", async () => {
    seed(kind, "t1");
    await vote("t1", 1);
    const res = await vote("t1", -1);
    expect((await json(res)).data).toEqual({ score: -1, myVote: -1 });
  });

  it("retirar el voto (0) devuelve la puntuación a su valor y retirarlo dos veces no resta más", async () => {
    seed(kind, "t1", 5);
    await vote("t1", -1);
    expect(scoreOf("t1")).toBe(4);
    await vote("t1", 0);
    expect(scoreOf("t1")).toBe(5);
    const res = await vote("t1", 0);
    expect((await json(res)).data.score).toBe(5);
  });

  it("los votos de usuarios distintos se suman por separado", async () => {
    seed(kind, "t1");
    await vote("t1", 1);
    state.currentUser = BOB;
    const res = await vote("t1", 1);
    expect((await json(res)).data.score).toBe(2);
  });

  it("400 si el valor no es 1, -1 ni 0", async () => {
    seed(kind, "t1");
    for (const value of [2, "1", null]) expect((await vote("t1", value)).status).toBe(400);
    expect(scoreOf("t1")).toBe(0);
  });

  it("401 sin sesión", async () => {
    seed(kind, "t1");
    state.currentUser = null;
    expect((await vote("t1", 1)).status).toBe(401);
    expect(scoreOf("t1")).toBe(0);
  });

  it("404 si el recurso no existe", async () => {
    const res = await vote("fantasma", 1);
    expect(res.status).toBe(404);
    expect((await json(res)).error).toBe(notFound);
  });

  it("500 si la transacción falla", async () => {
    seed(kind, "t1");
    prismaMock.$transaction.mockRejectedValueOnce(new Error("deadlock"));
    expect((await vote("t1", 1)).status).toBe(500);
  });
});

describe("POST /api/builds/[id]/comments", () => {
  const route = () => import("@/app/api/builds/[id]/comments/route");
  const comment = async (id: string, body: unknown) =>
    (await route()).POST(post(`/api/builds/${id}/comments`, body), params(id));

  it("caso feliz: publica el comentario (201)", async () => {
    seed("build", "b1");
    const res = await comment("b1", { body: "  buena build  " });
    expect(res.status).toBe(201);
    expect(store.comments).toEqual([expect.objectContaining({ body: "buena build", buildId: "b1", userId: ALICE.id })]);
  });

  it("400 con comentario vacío o demasiado largo", async () => {
    seed("build", "b1");
    expect((await comment("b1", { body: "   " })).status).toBe(400);
    expect((await comment("b1", { body: "x".repeat(1001) })).status).toBe(400);
    expect(store.comments).toHaveLength(0);
  });

  it("401 sin sesión", async () => {
    seed("build", "b1");
    state.currentUser = null;
    expect((await comment("b1", { body: "hola" })).status).toBe(401);
  });

  it("404 si la build no existe", async () => {
    const res = await comment("fantasma", { body: "hola" });
    expect(res.status).toBe(404);
    expect(prismaMock.comment.create).not.toHaveBeenCalled();
  });

  it("404 (no 500) si la build se borra entre la comprobación y el insert", async () => {
    prismaMock.build.count.mockResolvedValueOnce(1); // existía al comprobar…
    const res = await comment("borrada", { body: "hola" }); // …pero la FK falla al insertar
    expect(res.status).toBe(404);
    expect((await json(res)).error).toBe("Build no encontrada.");
  });
});

describe("POST /api/guides", () => {
  const route = () => import("@/app/api/guides/route");
  const valid = { heroSlug: "haze", title: "Guía de Haze", body: LONG_BODY };

  it("caso feliz: publica la guía (201), también sin héroe", async () => {
    const res = await (await route()).POST(post("/api/guides", valid));
    expect(res.status).toBe(201);
    expect((await json(res)).data.id).toMatch(/^g/);
    const general = await (await route()).POST(post("/api/guides", { ...valid, heroSlug: null }));
    expect(general.status).toBe(201);
    expect(prismaMock.guide.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ heroSlug: null, authorId: ALICE.id, patchId: "patch-1" }) }),
    );
  });

  it("400 con cuerpo corto, título corto o héroe desconocido", async () => {
    for (const bad of [
      { ...valid, body: "corto" },
      { ...valid, title: "abc" },
      { ...valid, heroSlug: "toString" },
      { title: valid.title, body: valid.body },
    ]) {
      expect((await (await route()).POST(post("/api/guides", bad))).status).toBe(400);
    }
    expect(prismaMock.guide.create).not.toHaveBeenCalled();
  });

  it("401 sin sesión", async () => {
    state.currentUser = null;
    expect((await (await route()).POST(post("/api/guides", valid))).status).toBe(401);
  });

  it("500 si Prisma falla", async () => {
    prismaMock.guide.create.mockRejectedValueOnce(new Error("boom"));
    expect((await (await route()).POST(post("/api/guides", valid))).status).toBe(500);
  });
});

describe("POST /api/auth/register", () => {
  const route = () => import("@/app/api/auth/register/route");
  const creds = { username: "  NuevoUser ", password: "contraseña-larga" };

  beforeEach(() => {
    state.currentUser = null;
  });

  it("caso feliz: crea el usuario normalizado, guarda el hash y abre sesión (201)", async () => {
    const res = await (await route()).POST(post("/api/auth/register", creds));
    expect(res.status).toBe(201);
    const { data } = await json(res);
    expect(data.username).toBe("nuevouser");
    expect(store.users.get("nuevouser")?.passwordHash).toBe("h:contraseña-larga");
    expect(auth.createSession).toHaveBeenCalledWith(data.id);
  });

  it("400 con usuario o contraseña inválidos", async () => {
    for (const bad of [{ ...creds, username: "a" }, { ...creds, username: "con espacio" }, { ...creds, password: "corta" }]) {
      expect((await (await route()).POST(post("/api/auth/register", bad))).status).toBe(400);
    }
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("409 si el usuario ya existe (sin distinguir mayúsculas)", async () => {
    await (await route()).POST(post("/api/auth/register", creds));
    const res = await (await route()).POST(post("/api/auth/register", { ...creds, username: "NUEVOUSER" }));
    expect(res.status).toBe(409);
    expect(auth.createSession).toHaveBeenCalledTimes(1);
  });

  it("500 si falla la BD por otro motivo", async () => {
    prismaMock.user.create.mockRejectedValueOnce(new Error("boom"));
    expect((await (await route()).POST(post("/api/auth/register", creds))).status).toBe(500);
  });
});

describe("POST /api/auth/login", () => {
  const route = () => import("@/app/api/auth/login/route");

  beforeEach(() => {
    state.currentUser = null;
    store.users.set("alice", { id: ALICE.id, username: "alice", passwordHash: "h:secreto-123" });
  });

  it("caso feliz: abre sesión (200)", async () => {
    const res = await (await route()).POST(post("/api/auth/login", { username: "Alice", password: "secreto-123" }));
    expect(res.status).toBe(200);
    expect((await json(res)).data).toEqual({ id: ALICE.id, username: "alice" });
    expect(auth.createSession).toHaveBeenCalledWith(ALICE.id);
  });

  it("400 con payload inválido", async () => {
    expect((await (await route()).POST(post("/api/auth/login", { username: "alice" }))).status).toBe(400);
  });

  it("401 con contraseña incorrecta o usuario inexistente, con el mismo mensaje", async () => {
    const wrong = await (await route()).POST(post("/api/auth/login", { username: "alice", password: "otra-cosa" }));
    const missing = await (await route()).POST(post("/api/auth/login", { username: "nadie", password: "secreto-123" }));
    expect(wrong.status).toBe(401);
    expect(missing.status).toBe(401);
    expect((await json(wrong)).error).toBe((await json(missing)).error);
    expect(auth.createSession).not.toHaveBeenCalled();
  });

  it("peticiones concurrentes no saltan el límite: como mucho 20 verificaciones, el resto 429", async () => {
    const original = auth.verifyPassword.getMockImplementation()!;
    auth.verifyPassword.mockImplementation(
      () => new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 20)),
    );
    const { POST } = await route();
    const responses = await Promise.all(
      Array.from({ length: 200 }, (_, i) => POST(post("/api/auth/login", { username: "alice", password: `guess-${i}-xxxx` }))),
    ).finally(() => auth.verifyPassword.mockImplementation(original));
    const statuses = responses.map((r) => r.status);
    expect(auth.verifyPassword).toHaveBeenCalledTimes(20);
    expect(statuses.filter((s) => s === 401)).toHaveLength(20);
    expect(statuses.filter((s) => s === 429)).toHaveLength(180);
  });

  it("un error de servidor no gasta el cupo de intentos", async () => {
    const { POST } = await route();
    for (let i = 0; i < 6; i++) {
      prismaMock.user.findUnique.mockRejectedValueOnce(new Error("boom"));
      expect((await POST(post("/api/auth/login", { username: "alice", password: "secreto-123" }))).status).toBe(500);
    }
    expect((await POST(post("/api/auth/login", { username: "alice", password: "secreto-123" }))).status).toBe(200);
  });
});

describe("POST /api/auth/logout", () => {
  const route = () => import("@/app/api/auth/logout/route");

  it("caso feliz: destruye la sesión", async () => {
    const res = await (await route()).POST(post("/api/auth/logout", {}));
    expect(res.status).toBe(200);
    expect(auth.destroySession).toHaveBeenCalledTimes(1);
  });

  it("403 desde otro origen (CSRF) sin tocar la sesión", async () => {
    const res = await (await route()).POST(post("/api/auth/logout", {}, { origin: "https://evil.example", host: "localhost" }));
    expect(res.status).toBe(403);
    expect(auth.destroySession).not.toHaveBeenCalled();
  });

  it("sin base de datos responde 200 sin hacer nada", async () => {
    state.dbConfigured = false;
    expect((await (await route()).POST(post("/api/auth/logout", {}))).status).toBe(200);
    expect(auth.destroySession).not.toHaveBeenCalled();
  });

  it("500 si falla al borrar la sesión", async () => {
    auth.destroySession.mockRejectedValueOnce(new Error("boom"));
    expect((await (await route()).POST(post("/api/auth/logout", {}))).status).toBe(500);
  });
});

describe("GET /api/auth/me", () => {
  const route = () => import("@/app/api/auth/me/route");

  it("devuelve el usuario con sesión", async () => {
    const { data } = await json(await (await route()).GET());
    expect(data).toEqual({ user: ALICE, communityEnabled: true });
  });

  it("sin sesión devuelve user null (no 401: es una consulta de estado)", async () => {
    state.currentUser = null;
    const res = await (await route()).GET();
    expect(res.status).toBe(200);
    expect((await json(res)).data.user).toBeNull();
  });

  it("500 si falla la lectura de la sesión", async () => {
    auth.getCurrentUser.mockRejectedValueOnce(new Error("boom"));
    expect((await (await route()).GET()).status).toBe(500);
  });
});

describe("BD configurada pero inaccesible", () => {
  const dbDown = async () => {
    const { Prisma } = await import("@prisma/client");
    return new Prisma.PrismaClientInitializationError("Can't reach database server", "test");
  };
  const unavailable = "La comunidad no está disponible en este momento. Inténtalo más tarde.";
  const creds = { username: "alice", password: "contraseña-larga" };

  it("register, login, logout y me responden 503 (no 500) con mensaje claro", async () => {
    state.currentUser = null;
    prismaMock.user.create.mockRejectedValueOnce(await dbDown());
    prismaMock.user.findUnique.mockRejectedValueOnce(await dbDown());
    auth.destroySession.mockRejectedValueOnce(await dbDown());
    const responses = [
      await (await import("@/app/api/auth/register/route")).POST(post("/api/auth/register", creds)),
      await (await import("@/app/api/auth/login/route")).POST(post("/api/auth/login", creds)),
      await (await import("@/app/api/auth/logout/route")).POST(post("/api/auth/logout", {})),
    ];
    auth.getCurrentUser.mockRejectedValueOnce(await dbDown());
    responses.push(await (await import("@/app/api/auth/me/route")).GET());
    for (const res of responses) {
      expect(res.status).toBe(503);
      expect((await json(res)).error).toBe(unavailable);
    }
  });

  it("crear guía o votar responde 503 si la BD cae tras validar la sesión", async () => {
    prismaMock.guide.create.mockRejectedValueOnce(await dbDown());
    const guide = await (await import("@/app/api/guides/route")).POST(
      post("/api/guides", { heroSlug: null, title: "Guía de prueba", body: "x".repeat(60) }),
    );
    expect(guide.status).toBe(503);

    prismaMock.$transaction.mockRejectedValueOnce(await dbDown());
    const { POST } = await import("@/app/api/builds/[id]/vote/route");
    const vote = await POST(post("/api/builds/b1/vote", { value: 1 }), { params: Promise.resolve({ id: "b1" }) });
    expect(vote.status).toBe(503);
  });
});
