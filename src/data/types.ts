export type ItemCategory = "weapon" | "vitality" | "spirit";

export interface ItemEffects {
  weaponDamagePct?: number;
  fireRatePct?: number;
  ammoPct?: number;
  bonusHealth?: number;
  healthPct?: number;
  spiritPower?: number;
  bulletResist?: number;
  spiritResist?: number;
  cooldownReduction?: number;
  bulletLifesteal?: number;
  spiritLifesteal?: number;
  stamina?: number;
}

export interface Item {
  slug: string;
  name: string;
  category: ItemCategory;
  cost: number;
  active: boolean;
  description: string;
  effects: ItemEffects;
  counters?: string;
}

export type Archetype = "weapon-carry" | "spirit-caster" | "tank" | "support";

export interface BaseStats {
  health: number;
  bulletDamage: number;
  fireRate: number;
  magazine: number;
  moveSpeed: number;
}

export interface Ability {
  name: string;
  description: string;
  imbue?: string;
}

export interface Matchup {
  hero: string;
  reason: string;
}

export interface Hero {
  slug: string;
  name: string;
  title: string;
  archetype: Archetype;
  roles: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  accent: string;
  radar: { damage: number; mobility: number; utility: number; durability: number };
  base: BaseStats;
  summary: string;
  howToPlay: string;
  abilities: [Ability, Ability, Ability, Ability];
  skillPath: number[];
  coreItems: string[];
  strongAgainst: Matchup[];
  weakAgainst: Matchup[];
}
