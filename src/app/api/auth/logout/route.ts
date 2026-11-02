import { destroySession } from "@/lib/server/auth";
import { isDbConfigured } from "@/lib/server/db";
import { fail, serverError, ok, sameOrigin } from "@/lib/server/http";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Origen no permitido.", 403);
  if (!isDbConfigured) return ok(null);
  try {
    await destroySession();
    return ok(null);
  } catch (error) {
    return serverError("logout", error, "No se pudo cerrar la sesión.");
  }
}
