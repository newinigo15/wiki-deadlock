import { beforeEach, describe, expect, it, vi } from "vitest";

/** Tests de las lecturas de comunidad (`community.ts`) con Prisma y sesión simulados. */

type Comment = { id: string; createdAt: Date; user: { username: string } };
type FindManyArgs = {
  include: { comments: { orderBy: { createdAt: "asc" | "desc" }; take: number } };
};

const state = vi.hoisted(() => ({
  dbConfigured: true,
  currentUser: null as { id: string; username: string } | null,
  comments: [] as Comment[],
}));

const prismaMock = vi.hoisted(() => ({
  build: {
    /** Aplica `orderBy`/`take` de `include.comments` como lo haría Prisma. */
    findMany: vi.fn(async (args: FindManyArgs) => {
      const { orderBy, take } = args.include.comments;
      const sign = orderBy.createdAt === "asc" ? 1 : -1;
      const comments = [...state.comments]
        .sort((a, b) => sign * (a.createdAt.getTime() - b.createdAt.getTime()))
        .slice(0, take);
      return [{ id: "b1", heroSlug: "haze", comments }];
    }),
  },
  guide: {
    findMany: vi.fn(async () => [{ id: "g1" }]),
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => (where.id === "g1" ? { id: "g1" } : null)),
  },
}));

vi.mock("@/lib/server/db", () => ({
  get isDbConfigured() {
    return state.dbConfigured;
  },
  prisma: prismaMock,
}));
vi.mock("@/lib/server/auth", () => ({ getCurrentUser: vi.fn(async () => state.currentUser) }));

import { fetchGuide, fetchGuides, fetchHeroBuilds } from "@/lib/server/community";

const dbDown = async () => {
  const { Prisma } = await import("@prisma/client");
  return new Prisma.PrismaClientInitializationError("Can't reach database server", "test");
};

const makeComments = (n: number): Comment[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `c${i + 1}`,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, i + 1)),
    user: { username: "alice" },
  }));

beforeEach(() => {
  state.dbConfigured = true;
  state.currentUser = null;
  state.comments = [];
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("fetchHeroBuilds", () => {
  it("devuelve los 20 comentarios más recientes en orden cronológico (issue #12)", async () => {
    state.comments = makeComments(25);
    const result = await fetchHeroBuilds("haze");
    const ids = result!.builds[0].comments.map((c) => c.id);
    expect(ids).toHaveLength(20);
    expect(ids[0]).toBe("c6");
    expect(ids.at(-1)).toBe("c25");
    expect(ids).toEqual(makeComments(25).slice(5).map((c) => c.id));
  });

  it("con menos de 20 comentarios los devuelve todos en orden cronológico", async () => {
    state.comments = makeComments(3).reverse();
    const result = await fetchHeroBuilds("haze");
    expect(result!.builds[0].comments.map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
  });

  it("filtra por héroe y solo pide los votos del usuario si hay sesión", async () => {
    await fetchHeroBuilds("haze");
    const args = prismaMock.build.findMany.mock.calls[0][0] as unknown as {
      where: unknown;
      include: { votes: unknown };
    };
    expect(args.where).toEqual({ heroSlug: "haze" });
    expect(args.include.votes).toBe(false);

    state.currentUser = { id: "u1", username: "alice" };
    const result = await fetchHeroBuilds("haze");
    const args2 = prismaMock.build.findMany.mock.calls[1][0] as unknown as { include: { votes: unknown } };
    expect(args2.include.votes).toEqual({ where: { userId: "u1" }, select: { value: true } });
    expect(result!.user).toEqual(state.currentUser);
  });

  it("devuelve null sin BD o si la BD es inaccesible, y relanza otros errores", async () => {
    state.dbConfigured = false;
    expect(await fetchHeroBuilds("haze")).toBeNull();

    state.dbConfigured = true;
    prismaMock.build.findMany.mockRejectedValueOnce(await dbDown());
    expect(await fetchHeroBuilds("haze")).toBeNull();

    prismaMock.build.findMany.mockRejectedValueOnce(new TypeError("bug"));
    await expect(fetchHeroBuilds("haze")).rejects.toThrow("bug");
  });
});

describe("fetchGuides / fetchGuide", () => {
  it("devuelven las guías y el usuario", async () => {
    expect(await fetchGuides()).toEqual({ user: null, guides: [{ id: "g1" }] });
    expect(await fetchGuide("g1")).toEqual({ user: null, guide: { id: "g1" } });
    expect(await fetchGuide("nope")).toEqual({ user: null, guide: null });
  });

  it("devuelven null sin BD o si la BD es inaccesible", async () => {
    state.dbConfigured = false;
    expect(await fetchGuides()).toBeNull();
    expect(await fetchGuide("g1")).toBeNull();

    state.dbConfigured = true;
    prismaMock.guide.findMany.mockRejectedValueOnce(await dbDown());
    prismaMock.guide.findUnique.mockRejectedValueOnce(await dbDown());
    expect(await fetchGuides()).toBeNull();
    expect(await fetchGuide("g1")).toBeNull();
  });

  it("relanzan los errores que no son de BD inaccesible", async () => {
    prismaMock.guide.findMany.mockRejectedValueOnce(new TypeError("bug"));
    prismaMock.guide.findUnique.mockRejectedValueOnce(new TypeError("bug"));
    await expect(fetchGuides()).rejects.toThrow("bug");
    await expect(fetchGuide("g1")).rejects.toThrow("bug");
  });
});
