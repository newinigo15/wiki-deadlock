import { getCurrentUser } from "@/lib/server/auth";
import { isDbConfigured } from "@/lib/server/db";
import { fail, logServerError, ok } from "@/lib/server/http";

export async function GET() {
  try {
    return ok({ user: await getCurrentUser(), communityEnabled: isDbConfigured });
  } catch (error) {
    logServerError("me", error);
    return fail("No se pudo leer la sesión.", 500);
  }
}
