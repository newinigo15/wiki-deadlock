import { CURRENT_PATCH } from "@/data/heroes";
import { prisma } from "./db";

/** Devuelve el parche actual, creándolo si la base de datos aún no se ha sembrado. */
export function ensureCurrentPatch() {
  return prisma.patch.upsert({
    where: { slug: CURRENT_PATCH.slug },
    update: {},
    create: { slug: CURRENT_PATCH.slug, name: CURRENT_PATCH.label },
  });
}
