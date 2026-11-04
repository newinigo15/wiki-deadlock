/** Generación procedural y determinista de la ciudad (sin dependencias de three/React). */

export type BuildingType = "tower" | "block" | "slab";
export const BUILDING_TYPES: readonly BuildingType[] = ["tower", "block", "slab"];

export interface CityBuilding {
  type: BuildingType;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  accent: boolean;
}

export interface CityOptions {
  seed?: number;
  grid?: number; // manzanas por lado
  spacing?: number;
  /** 0..1: probabilidad de que una celda no-calle tenga edificio. */
  density?: number;
}

export const DEFAULT_SEED = 1337;

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Misma semilla y opciones → misma ciudad. */
export function generateCity({
  seed = DEFAULT_SEED,
  grid = 21,
  spacing = 1.1,
  density = 0.9,
}: CityOptions = {}): CityBuilding[] {
  const rnd = mulberry32(seed);
  const out: CityBuilding[] = [];
  const half = (grid - 1) / 2;
  for (let i = 0; i < grid; i++) {
    for (let j = 0; j < grid; j++) {
      if (i % 4 === 3 || j % 4 === 3) continue; // calles
      // Se consumen siempre los mismos números aleatorios por celda para estabilidad.
      const r = [rnd(), rnd(), rnd(), rnd(), rnd(), rnd()];
      if (r[0] > density) continue;
      const dist = Math.min(Math.hypot(i - half, j - half) / half, 1);
      const h = 0.3 + r[1] * 1.6 * (1.3 - dist) + (r[2] > 0.93 ? 1.5 : 0);
      const type: BuildingType = h > 1.6 ? "tower" : h > 0.9 ? "block" : "slab";
      const wBase = type === "tower" ? 0.45 : type === "block" ? 0.55 : 0.7;
      out.push({
        type,
        x: (i - half) * spacing,
        z: (j - half) * spacing,
        w: wBase + r[3] * 0.25,
        d: wBase + r[4] * 0.25,
        h,
        accent: r[5] > 0.9,
      });
    }
  }
  return out;
}

export function groupByType(buildings: CityBuilding[]): Record<BuildingType, CityBuilding[]> {
  const g: Record<BuildingType, CityBuilding[]> = { tower: [], block: [], slab: [] };
  for (const b of buildings) g[b.type].push(b);
  return g;
}
