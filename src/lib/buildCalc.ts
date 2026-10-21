import type { BaseStats, Item } from "@/data/types";

export interface BuildStats {
  dps: number;
  baseDps: number;
  health: number;
  effectiveHealthVsBullets: number;
  spiritPower: number;
  bulletResist: number;
  spiritResist: number;
  cooldownReduction: number;
  magazine: number;
  bulletLifesteal: number;
  spiritLifesteal: number;
  bonusStamina: number;
  cost: number;
}

/** Combina porcentajes de reducción con rendimientos decrecientes: 1 - Π(1 - r). */
export function stackMultiplicative(values: number[]): number {
  return 1 - values.reduce((acc, v) => acc * (1 - v), 1);
}

function sum(items: Item[], pick: (i: Item) => number | undefined): number {
  return items.reduce((acc, i) => acc + (pick(i) ?? 0), 0);
}

/**
 * Calcula el impacto de una build sobre las estadísticas base de un héroe.
 * El DPS es el máximo teórico (todas las condiciones de los objetos cumplidas).
 */
export function computeBuildStats(base: BaseStats, items: Item[]): BuildStats {
  const weaponDamagePct = sum(items, (i) => i.effects.weaponDamagePct);
  const fireRatePct = sum(items, (i) => i.effects.fireRatePct);
  const healthPct = sum(items, (i) => i.effects.healthPct);
  const bulletResist = stackMultiplicative(items.map((i) => i.effects.bulletResist ?? 0));

  const baseDps = base.bulletDamage * base.fireRate;
  const dps = base.bulletDamage * (1 + weaponDamagePct) * base.fireRate * (1 + fireRatePct);
  const health = Math.max(1, (base.health + sum(items, (i) => i.effects.bonusHealth)) * (1 + healthPct));

  return {
    dps,
    baseDps,
    health,
    effectiveHealthVsBullets: health / (1 - bulletResist),
    spiritPower: sum(items, (i) => i.effects.spiritPower),
    bulletResist,
    spiritResist: stackMultiplicative(items.map((i) => i.effects.spiritResist ?? 0)),
    cooldownReduction: stackMultiplicative(items.map((i) => i.effects.cooldownReduction ?? 0)),
    magazine: Math.round(base.magazine * (1 + sum(items, (i) => i.effects.ammoPct))),
    bulletLifesteal: sum(items, (i) => i.effects.bulletLifesteal),
    spiritLifesteal: sum(items, (i) => i.effects.spiritLifesteal),
    bonusStamina: sum(items, (i) => i.effects.stamina),
    cost: sum(items, (i) => i.cost),
  };
}
