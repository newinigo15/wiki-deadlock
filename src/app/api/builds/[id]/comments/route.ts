import { prisma } from "@/lib/server/db";
import { fail, guardMutation, logServerError, ok } from "@/lib/server/http";
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
    logServerError("comment", error);
    return fail("No se pudo publicar el comentario.", 500);
  }
}
