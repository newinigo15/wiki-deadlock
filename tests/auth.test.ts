import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Tests de `src/lib/server/auth.ts` real, con cookies y Prisma falsos. */

const jar = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    get: vi.fn((name: string) => (values.has(name) ? { value: values.get(name)! } : undefined)),
    set: vi.fn((name: string, value: string) => void values.set(name, value)),
    delete: vi.fn((name: string) => void values.delete(name)),
  };
});

const prismaMock = vi.hoisted(() => ({
  session: {
    create: vi.fn<(args: unknown) => Promise<object>>(async () => ({})),
    deleteMany: vi.fn<(args: unknown) => Promise<{ count: number }>>(async () => ({ count: 1 })),
    findUnique: vi.fn<(args: unknown) => Promise<unknown>>(async () => null),
  },
}));

vi.mock("next/headers", () => ({ cookies: async () => jar }));
vi.mock("@/lib/server/db", () => ({ isDbConfigured: true, prisma: prismaMock }));

import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/server/auth";

const sha256 = (t: string) => createHash("sha256").update(t).digest("hex");

beforeEach(() => {
  vi.clearAllMocks();
  jar.values.clear();
});

describe("hashPassword / verifyPassword", () => {
  it("verifica la contraseña correcta y rechaza la incorrecta", async () => {
    const stored = await hashPassword("secreto-123");
    expect(stored).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    expect(await verifyPassword("secreto-123", stored)).toBe(true);
    expect(await verifyPassword("secreto-124", stored)).toBe(false);
  });

  it("usa sal aleatoria: dos hashes de la misma contraseña difieren", async () => {
    expect(await hashPassword("x".repeat(8))).not.toBe(await hashPassword("x".repeat(8)));
  });

  it("rechaza hashes guardados corruptos en vez de aceptarlos", async () => {
    for (const stored of ["", "sinseparador", "00:", ":00", "00:zz", "00:abc", "00:" + "ab".repeat(10)]) {
      expect(await verifyPassword("cualquiera", stored)).toBe(false);
    }
  });
});

describe("sesiones", () => {
  it("createSession guarda solo el hash del token y pone la cookie httpOnly", async () => {
    await createSession("u1");
    const token = jar.values.get(SESSION_COOKIE)!;
    expect(token).toBeTruthy();
    const { data } = prismaMock.session.create.mock.calls[0][0] as { data: { id: string; userId: string; expiresAt: Date } };
    expect(data.id).toBe(sha256(token));
    expect(data.id).not.toBe(token);
    expect(data.userId).toBe("u1");
    expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(jar.set).toHaveBeenCalledWith(SESSION_COOKIE, token, expect.objectContaining({ httpOnly: true, sameSite: "lax" }));
  });

  it("getCurrentUser devuelve null sin cookie, sin sesión o con sesión caducada", async () => {
    expect(await getCurrentUser()).toBeNull();
    expect(prismaMock.session.findUnique).not.toHaveBeenCalled();

    jar.values.set(SESSION_COOKIE, "tok");
    expect(await getCurrentUser()).toBeNull();

    prismaMock.session.findUnique.mockResolvedValueOnce({
      expiresAt: new Date(Date.now() - 1000),
      user: { id: "u1", username: "alice" },
    });
    expect(await getCurrentUser()).toBeNull();
  });

  it("getCurrentUser devuelve el usuario con una sesión válida buscada por hash", async () => {
    jar.values.set(SESSION_COOKIE, "tok");
    prismaMock.session.findUnique.mockResolvedValueOnce({
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: "u1", username: "alice" },
    });
    expect(await getCurrentUser()).toEqual({ id: "u1", username: "alice" });
    expect(prismaMock.session.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: sha256("tok") } }));
  });

  it("destroySession borra la sesión por hash y la cookie", async () => {
    jar.values.set(SESSION_COOKIE, "tok");
    await destroySession();
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { id: sha256("tok") } });
    expect(jar.values.has(SESSION_COOKIE)).toBe(false);
  });

  it("destroySession borra la cookie aunque la BD falle", async () => {
    jar.values.set(SESSION_COOKIE, "tok");
    prismaMock.session.deleteMany.mockRejectedValueOnce(new Error("db down"));
    await expect(destroySession()).rejects.toThrow("db down");
    expect(jar.values.has(SESSION_COOKIE)).toBe(false);
  });

  it("destroySession sin cookie no toca la BD", async () => {
    await destroySession();
    expect(prismaMock.session.deleteMany).not.toHaveBeenCalled();
  });
});
