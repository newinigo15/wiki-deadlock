import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { createSession, hashPassword } from "@/lib/server/auth";
import { fail, guardMutation, logServerError, ok } from "@/lib/server/http";
import { credentialsSchema } from "@/lib/server/schemas";

export async function POST(request: Request) {
  const guard = await guardMutation(request, credentialsSchema, { requireUser: false });
  if (guard.response) return guard.response;
  try {
    const user = await prisma.user.create({
      data: { username: guard.body.username, passwordHash: await hashPassword(guard.body.password) },
      select: { id: true, username: true },
    });
    await createSession(user.id);
    return ok(user, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("Ese nombre de usuario ya existe.", 409);
    }
    logServerError("register", error);
    return fail("No se pudo crear la cuenta.", 500);
  }
}
