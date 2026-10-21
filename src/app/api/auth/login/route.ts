import { prisma } from "@/lib/server/db";
import { createSession, verifyPassword } from "@/lib/server/auth";
import { fail, guardMutation, logServerError, ok, rateLimited } from "@/lib/server/http";
import { credentialsSchema } from "@/lib/server/schemas";

const LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60_000;
// Hash válido de una contraseña aleatoria: igualar el tiempo de respuesta cuando el usuario no existe.
const DUMMY_HASH = "00000000000000000000000000000000:" + "0".repeat(128);

export async function POST(request: Request) {
  const guard = await guardMutation(request, credentialsSchema, { requireUser: false });
  if (guard.response) return guard.response;
  if (rateLimited(`login:${guard.body.username}`, LOGIN_ATTEMPTS, LOGIN_WINDOW_MS)) {
    return fail("Demasiados intentos con este usuario. Prueba en 15 minutos.", 429);
  }
  try {
    const user = await prisma.user.findUnique({ where: { username: guard.body.username } });
    const valid = await verifyPassword(guard.body.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) return fail("Usuario o contraseña incorrectos.", 401);
    await createSession(user.id);
    return ok({ id: user.id, username: user.username });
  } catch (error) {
    logServerError("login", error);
    return fail("No se pudo iniciar sesión.", 500);
  }
}
