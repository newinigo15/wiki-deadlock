import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(async (): Promise<{ id: string; username: string } | null> => null),
  findUnique: vi.fn(async ({ where }: { where: { username: string } }) =>
    where.username === "victima" ? { id: "u1", username: "victima", passwordHash: "hash" } : null,
  ),
  verifyPassword: vi.fn(async (password: string) => password === "correcta123"),
  createSession: vi.fn(async () => {}),
}));

vi.mock("@/lib/server/db", () => ({ isDbConfigured: true, prisma: { user: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/server/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
  verifyPassword: mocks.verifyPassword,
  createSession: mocks.createSession,
}));

type HttpModule = typeof import("@/lib/server/http");
let http: HttpModule;

const schema = z.object({ username: z.string(), password: z.string() });
const URL_LOGIN = "http://localhost/api/auth/login";

function post(body: BodyInit, headers: Record<string, string> = {}) {
  return new Request(URL_LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
    // Necesario en Node para cuerpos en streaming (equivale a Transfer-Encoding: chunked).
    duplex: "half",
  } as RequestInit);
}

/** Cuerpo en streaming sin content-length, enviado en trozos de 16 KB. */
function chunkedBody(totalBytes: number, onPull?: () => void) {
  const chunk = new Uint8Array(16 * 1024).fill(0x61);
  let sent = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      onPull?.();
      if (sent >= totalBytes) return controller.close();
      sent += chunk.byteLength;
      controller.enqueue(chunk);
    },
  });
}

beforeEach(async () => {
  vi.resetModules(); // reinicia el mapa de rate limit entre tests
  delete process.env.TRUST_PROXY;
  mocks.getCurrentUser.mockResolvedValue(null);
  http = await import("@/lib/server/http");
});

afterEach(() => {
  delete process.env.TRUST_PROXY;
});

describe("clientIp", () => {
  it("ignora X-Real-IP y X-Forwarded-For sin TRUST_PROXY", () => {
    const req = new Request(URL_LOGIN, { headers: { "x-real-ip": "10.0.0.1", "x-forwarded-for": "1.1.1.1, 2.2.2.2" } });
    expect(http.clientIp(req)).toBe(http.UNTRUSTED_CLIENT_KEY);
  });

  it("ignora X-Real-IP incluso con TRUST_PROXY=1 (el cliente podría elegir su IP)", () => {
    process.env.TRUST_PROXY = "1";
    const req = new Request(URL_LOGIN, { headers: { "x-real-ip": "10.0.0.1", "x-forwarded-for": "6.6.6.6, 2.2.2.2" } });
    expect(http.clientIp(req)).toBe("2.2.2.2");
    expect(http.clientIp(new Request(URL_LOGIN, { headers: { "x-real-ip": "10.0.0.1" } }))).toBe(http.UNTRUSTED_CLIENT_KEY);
  });

  it("usa el último salto de X-Forwarded-For con TRUST_PROXY=1", () => {
    process.env.TRUST_PROXY = "1";
    expect(http.clientIp(new Request(URL_LOGIN, { headers: { "x-forwarded-for": "6.6.6.6, 2.2.2.2" } }))).toBe("2.2.2.2");
  });

  it("vuelve a la clave común con TRUST_PROXY=1 pero sin cabeceras", () => {
    process.env.TRUST_PROXY = "1";
    expect(http.clientIp(new Request(URL_LOGIN))).toBe(http.UNTRUSTED_CLIENT_KEY);
  });
});

describe("guardMutation: límite de cuerpo", () => {
  it("acepta un cuerpo válido", async () => {
    const guard = await http.guardMutation(post(JSON.stringify({ username: "aaa", password: "b" })), schema, { requireUser: false });
    expect(guard.response).toBeUndefined();
    expect(guard.body).toEqual({ username: "aaa", password: "b" });
  });

  it("devuelve 413 si content-length supera el límite", async () => {
    const req = post("{}", { "content-length": String(65 * 1024) });
    const guard = await http.guardMutation(req, schema, { requireUser: false });
    expect(guard.response?.status).toBe(413);
  });

  it("devuelve 413 con un cuerpo chunked sin content-length y deja de leer", async () => {
    let pulls = 0;
    const req = post(chunkedBody(5 * 1024 * 1024, () => pulls++));
    expect(req.headers.get("content-length")).toBeNull();
    const guard = await http.guardMutation(req, schema, { requireUser: false });
    expect(guard.response?.status).toBe(413);
    // 64 KB / 16 KB = 4 trozos + el que cruza el límite; nunca los 320 trozos de 5 MB.
    expect(pulls).toBeLessThan(10);
  });

  it("devuelve 400 con JSON inválido", async () => {
    const guard = await http.guardMutation(post("{no json"), schema, { requireUser: false });
    expect(guard.response?.status).toBe(400);
  });
});

describe("guardMutation: rate limit", () => {
  async function send(ip: string, headers: Record<string, string> = { origin: "http://localhost", "x-forwarded-host": "localhost" }) {
    const req = post(JSON.stringify({ username: "aaa", password: "b" }), { "x-forwarded-for": ip, ...headers });
    return (await http.guardMutation(req, schema, { requireUser: false })).response?.status;
  }

  it("sin TRUST_PROXY un cliente no agota el cupo de los demás con 31 peticiones", async () => {
    for (let i = 0; i < 31; i++) await send("6.6.6.6");
    expect(await send("10.0.0.2")).toBeUndefined();
  });

  it("sin TRUST_PROXY rotar X-Forwarded-For no evade el tope anti-flood común", async () => {
    const statuses: (number | undefined)[] = [];
    for (let i = 0; i < http.MAX_SHARED_REQUESTS_PER_WINDOW + 5; i++) statuses.push(await send(`10.0.${i % 250}.${i % 7}`));
    expect(statuses.filter((s) => s === 429)).toHaveLength(5);
  });

  it("sin TRUST_PROXY las peticiones sin Origin no consumen el cubo común", async () => {
    for (let i = 0; i < http.MAX_SHARED_REQUESTS_PER_WINDOW + 5; i++) await send("6.6.6.6", {});
    expect(await send("10.0.0.2")).toBeUndefined();
  });

  it("con TRUST_PROXY=1 limita por IP", async () => {
    process.env.TRUST_PROXY = "1";
    for (let i = 0; i < 30; i++) expect(await send("10.0.0.1")).toBeUndefined();
    expect(await send("10.0.0.1")).toBe(429);
    expect(await send("10.0.0.2")).toBeUndefined();
  });

  it("limita por usuario con sesión aunque no haya proxy, sin afectar a otros usuarios", async () => {
    const asUser = async (id: string) => {
      mocks.getCurrentUser.mockResolvedValue({ id, username: id });
      const req = post(JSON.stringify({ username: "aaa", password: "b" }));
      return (await http.guardMutation(req, schema, { requireUser: true })).response?.status;
    };
    for (let i = 0; i < 30; i++) expect(await asUser("spammer")).toBeUndefined();
    expect(await asUser("spammer")).toBe(429);
    expect(await asUser("otro")).toBeUndefined();
  });
});

describe("POST /api/auth/login: bloqueo por intentos fallidos", () => {
  let login: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    ({ POST: login } = await import("@/app/api/auth/login/route"));
  });

  const attempt = (password: string, ip?: string) =>
    login(post(JSON.stringify({ username: "victima", password }), ip ? { "x-forwarded-for": ip } : {})).then((r) => r.status);

  it("los inicios de sesión correctos no gastan el cupo", async () => {
    for (let i = 0; i < 10; i++) expect(await attempt("correcta123")).toBe(200);
  });

  it("solo cuenta fallos: tras 20 fallos sin proxy responde 429 sin verificar la contraseña", async () => {
    for (let i = 0; i < 20; i++) expect(await attempt("falsa12345")).toBe(401);
    mocks.verifyPassword.mockClear();
    expect(await attempt("correcta123")).toBe(429);
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
  });

  it("un acierto reinicia los fallos previos del cliente", async () => {
    for (let i = 0; i < 4; i++) expect(await attempt("falsa12345")).toBe(401);
    expect(await attempt("correcta123")).toBe(200);
    for (let i = 0; i < 4; i++) expect(await attempt("falsa12345")).toBe(401);
    expect(await attempt("correcta123")).toBe(200);
  });

  it("con TRUST_PROXY=1 un atacante desde otra IP no bloquea al dueño", async () => {
    process.env.TRUST_PROXY = "1";
    for (let i = 0; i < 6; i++) await attempt("falsa12345", "6.6.6.6");
    expect(await attempt("correcta123", "6.6.6.6")).toBe(429);
    expect(await attempt("correcta123", "10.0.0.2")).toBe(200);
  });

  it("con TRUST_PROXY=1 frena la fuerza bruta distribuida sobre un mismo usuario", async () => {
    process.env.TRUST_PROXY = "1";
    for (let i = 0; i < 50; i++) expect(await attempt("falsa12345", `10.1.0.${i}`)).toBe(401);
    expect(await attempt("falsa12345", "10.2.0.1")).toBe(429);
  });

  it("con TRUST_PROXY=1 los 429 de una IP bloqueada no gastan el cupo global del usuario", async () => {
    process.env.TRUST_PROXY = "1";
    for (let i = 0; i < 100; i++) await attempt("falsa12345", "6.6.6.6");
    for (let i = 0; i < 5; i++) expect(await attempt("falsa12345", `10.1.0.${i}`)).toBe(401);
  });
});
