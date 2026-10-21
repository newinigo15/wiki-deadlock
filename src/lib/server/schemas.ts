import { z } from "zod";
import { heroesBySlug } from "@/data/heroes";
import { itemsBySlug } from "@/data/items";
import { allSlugs, loadoutFromSlugs, MAX_FLEX_SLOTS, SLOTS_PER_CATEGORY } from "@/lib/slots";

const MAX_ITEMS = SLOTS_PER_CATEGORY * 3 + MAX_FLEX_SLOTS;

export const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,24}$/, "Usuario: 3-24 caracteres (letras, números o _).")
    .transform((u) => u.toLowerCase()),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres.").max(128),
});

const heroSlug = z.string().refine((s) => s in heroesBySlug, "Héroe desconocido.");

export const buildSchema = z
  .object({
  heroSlug,
  title: z.string().trim().min(3, "Título demasiado corto.").max(80),
  items: z
    .array(z.string().refine((s) => s in itemsBySlug, "Objeto desconocido."))
    .min(1, "Añade al menos un objeto.")
    .max(MAX_ITEMS)
    .refine((list) => new Set(list).size === list.length, "Objetos repetidos."),
  flexSlots: z.number().int().min(0).max(MAX_FLEX_SLOTS),
  })
  // Mismas reglas que el generador: 4 espacios por categoría + Flex Slots desbloqueados.
  .refine(
    (b) => allSlugs(loadoutFromSlugs(b.items, itemsBySlug, b.flexSlots)).length === b.items.length,
    "La build no cabe en los espacios disponibles.",
  );

export const guideSchema = z.object({
  heroSlug: heroSlug.nullable(),
  title: z.string().trim().min(5, "Título demasiado corto.").max(100),
  body: z.string().trim().min(50, "La guía necesita al menos 50 caracteres.").max(20_000),
});

export const voteSchema = z.object({ value: z.union([z.literal(1), z.literal(-1), z.literal(0)]) });

export const commentSchema = z.object({ body: z.string().trim().min(1).max(1000) });
