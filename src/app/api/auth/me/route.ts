import { getCurrentUser } from "@/lib/server/auth";
import { isDbConfigured } from "@/lib/server/db";
import { serverError, ok } from "@/lib/server/http";

export async function GET() {
  try {
    return ok({ user: await getCurrentUser(), communityEnabled: isDbConfigured });
  } catch (error) {
    return serverError("me", error, "No se pudo leer la sesión.");
  }
}
