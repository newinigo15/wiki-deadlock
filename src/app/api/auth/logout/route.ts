import { destroySession } from "@/lib/server/auth";
import { isDbConfigured } from "@/lib/server/db";
import { fail, logServerError, ok, sameOrigin } from "@/lib/server/http";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Origen no permitido.", 403);
  if (!isDbConfigured) return ok(null);
  try {
    await destroySession();
    return ok(null);
  } catch (error) {
    logServerError("logout", error);
    return fail("No se pudo cerrar la sesión.", 500);
  }
}
