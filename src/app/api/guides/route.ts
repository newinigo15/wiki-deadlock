import { prisma } from "@/lib/server/db";
import { fail, guardMutation, logServerError, ok } from "@/lib/server/http";
import { ensureCurrentPatch } from "@/lib/server/patch";
import { guideSchema } from "@/lib/server/schemas";

export async function POST(request: Request) {
  const guard = await guardMutation(request, guideSchema, { requireUser: true });
  if (guard.response) return guard.response;
  try {
    const patch = await ensureCurrentPatch();
    const guide = await prisma.guide.create({
      data: { ...guard.body, patchId: patch.id, authorId: guard.user!.id },
      select: { id: true },
    });
    return ok(guide, 201);
  } catch (error) {
    logServerError("create guide", error);
    return fail("No se pudo publicar la guía.", 500);
  }
}
