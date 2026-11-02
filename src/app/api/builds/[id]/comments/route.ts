import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { fail, guardMutation, serverError, ok } from "@/lib/server/http";
import { commentSchema } from "@/lib/server/schemas";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardMutation(request, commentSchema, { requireUser: true });
  if (guard.response) return guard.response;
  try {
    const { id } = await params;
    const exists = await prisma.build.count({ where: { id } });
    if (!exists) return fail("Build no encontrada.", 404);
    const comment = await prisma.comment.create({
      data: { body: guard.body.body, buildId: id, userId: guard.user!.id },
      select: { id: true, body: true, createdAt: true, user: { select: { username: true } } },
    });
    return ok(comment, 201);
  } catch (error) {
    // La build pudo borrarse entre el count y el insert: la FK falla (P2003) y es un 404, no un 500.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return fail("Build no encontrada.", 404);
    }
    return serverError("comment", error, "No se pudo publicar el comentario.");
  }
}
