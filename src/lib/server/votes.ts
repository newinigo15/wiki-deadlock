import { prisma } from "./db";

/**
 * Registra (o retira, con value = 0) el voto de un usuario y actualiza la puntuación
 * desnormalizada en la misma transacción. Devuelve la nueva puntuación o null si no existe.
 */
export async function castVote(
  kind: "build" | "guide",
  targetId: string,
  userId: string,
  value: 1 | -1 | 0,
): Promise<number | null> {
  return prisma.$transaction(async (tx) => {
    if (kind === "build") {
      // Bloquea la fila para serializar votos concurrentes del mismo objetivo.
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Build" WHERE id = ${targetId} FOR UPDATE`;
      if (locked.length === 0) return null;
      const key = { userId_buildId: { userId, buildId: targetId } };
      const previous = (await tx.buildVote.findUnique({ where: key }))?.value ?? 0;
      if (value === 0) await tx.buildVote.deleteMany({ where: { userId, buildId: targetId } });
      else await tx.buildVote.upsert({ where: key, update: { value }, create: { userId, buildId: targetId, value } });
      const updated = await tx.build.update({ where: { id: targetId }, data: { score: { increment: value - previous } } });
      return updated.score;
    }
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Guide" WHERE id = ${targetId} FOR UPDATE`;
    if (locked.length === 0) return null;
    const key = { userId_guideId: { userId, guideId: targetId } };
    const previous = (await tx.guideVote.findUnique({ where: key }))?.value ?? 0;
    if (value === 0) await tx.guideVote.deleteMany({ where: { userId, guideId: targetId } });
    else await tx.guideVote.upsert({ where: key, update: { value }, create: { userId, guideId: targetId, value } });
    const updated = await tx.guide.update({ where: { id: targetId }, data: { score: { increment: value - previous } } });
    return updated.score;
  });
}
