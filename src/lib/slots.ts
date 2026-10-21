import type { Item, ItemCategory } from "@/data/types";

export const SLOTS_PER_CATEGORY = 4;

export const FLEX_OBJECTIVES = [
  { id: "first-walker", label: "Primer Caminante (Walker) destruido" },
  { id: "all-walkers", label: "Todos los Caminantes destruidos" },
  { id: "first-guardian", label: "Primer Guardián de Base destruido" },
  { id: "all-shrines", label: "Todos los Santuarios destruidos" },
] as const;

export const MAX_FLEX_SLOTS = FLEX_OBJECTIVES.length;

export interface Loadout {
  weapon: string[];
  vitality: string[];
  spirit: string[];
  flex: string[];
}

export const EMPTY_LOADOUT: Loadout = { weapon: [], vitality: [], spirit: [], flex: [] };

export type AddResult = { ok: true; loadout: Loadout } | { ok: false; error: string };

export function allSlugs(loadout: Loadout): string[] {
  return [...loadout.weapon, ...loadout.vitality, ...loadout.spirit, ...loadout.flex];
}

/** Coloca el objeto en su categoría o, si está llena, en un Flex Slot desbloqueado. */
export function addItem(loadout: Loadout, item: Item, flexUnlocked: number): AddResult {
  if (allSlugs(loadout).includes(item.slug)) {
    return { ok: false, error: `${item.name} ya está equipado.` };
  }
  const category: ItemCategory = item.category;
  if (loadout[category].length < SLOTS_PER_CATEGORY) {
    return { ok: true, loadout: { ...loadout, [category]: [...loadout[category], item.slug] } };
  }
  if (loadout.flex.length < clampFlex(flexUnlocked)) {
    return { ok: true, loadout: { ...loadout, flex: [...loadout.flex, item.slug] } };
  }
  return { ok: false, error: "No quedan espacios libres: desbloquea Flex Slots destruyendo objetivos." };
}

export function removeItem(loadout: Loadout, slug: string): Loadout {
  return {
    weapon: loadout.weapon.filter((s) => s !== slug),
    vitality: loadout.vitality.filter((s) => s !== slug),
    spirit: loadout.spirit.filter((s) => s !== slug),
    flex: loadout.flex.filter((s) => s !== slug),
  };
}

/** Al bloquear Flex Slots, los objetos sobrantes se retiran. */
export function trimFlex(loadout: Loadout, flexUnlocked: number): Loadout {
  return { ...loadout, flex: loadout.flex.slice(0, clampFlex(flexUnlocked)) };
}

export function clampFlex(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(MAX_FLEX_SLOTS, Math.trunc(n)));
}

/** Reconstruye un loadout desde una lista de slugs (p. ej. de la URL), ignorando inválidos. */
export function loadoutFromSlugs(slugs: string[], catalog: Record<string, Item>, flexUnlocked: number): Loadout {
  return slugs.reduce<Loadout>((acc, slug) => {
    const item = catalog[slug];
    if (!item) return acc;
    const result = addItem(acc, item, flexUnlocked);
    return result.ok ? result.loadout : acc;
  }, EMPTY_LOADOUT);
}

/** Coloca el objeto directamente en un Flex Slot (al soltarlo sobre la fila flexible). */
export function addItemToFlex(loadout: Loadout, item: Item, flexUnlocked: number): AddResult {
  if (allSlugs(loadout).includes(item.slug)) {
    return { ok: false, error: `${item.name} ya está equipado.` };
  }
  if (loadout.flex.length >= clampFlex(flexUnlocked)) {
    return { ok: false, error: "No hay Flex Slots libres desbloqueados." };
  }
  return { ok: true, loadout: { ...loadout, flex: [...loadout.flex, item.slug] } };
}
