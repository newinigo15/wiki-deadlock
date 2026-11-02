import { prisma } from "@/lib/server/db";
import { createSession, verifyPassword } from "@/lib/server/auth";
import {
  clearRateLimit,
  fail,
  guardMutation,
  LOGIN_WINDOW_MS,
  loginLimitKeys,
  serverError,
  ok,
  rateLimited,
  releaseRateLimit,
} from "@/lib/server/http";
import { credentialsSchema } from "@/lib/server/schemas";

// Hash válido de una contraseña aleatoria: igualar el tiempo de respuesta cuando el usuario no existe.
const DUMMY_HASH = "00000000000000000000000000000000:" + "0".repeat(128);

export async function POST(request: Request) {
  const guard = await guardMutation(request, credentialsSchema, { requireUser: false });
  if (guard.response) return guard.response;
  // El intento se reserva ANTES de verificar (síncrono, sin await de por medio): así las peticiones
  // concurrentes no pueden colarse todas antes de que se registre el primer fallo. Solo los fallos
  // conservan la reserva; un 429, un acierto o un error de servidor la devuelven.
  const limits = loginLimitKeys(request, guard.body.username);
  const releaseAll = () => limits.forEach(({ key }) => releaseRateLimit(key));
  const blocked = limits.map(({ key, max }) => rateLimited(key, max, LOGIN_WINDOW_MS));
  if (blocked.some(Boolean)) {
    releaseAll();
    return fail("Demasiados intentos con este usuario. Prueba en 15 minutos.", 429);
  }
  try {
    const user = await prisma.user.findUnique({ where: { username: guard.body.username } });
    const valid = await verifyPassword(guard.body.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) return fail("Usuario o contraseña incorrectos.", 401);
    await createSession(user.id);
    // El acierto limpia solo el contador de este cliente; el global por usuario conserva los fallos
    // previos (frena ataques distribuidos) y solo se le devuelve la reserva de este intento.
    // Va tras createSession para que, si esta falla, el catch no devuelva la reserva dos veces.
    clearRateLimit(limits[0].key);
    for (const { key } of limits.slice(1)) releaseRateLimit(key);
    return ok({ id: user.id, username: user.username });
  } catch (error) {
    releaseAll();
    return serverError("login", error, "No se pudo iniciar sesión.");
  }
}
