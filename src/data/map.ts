// Esquema ilustrativo del mapa (coordenadas 0-100). Ajustar con datos reales del parche.
export type Point = { x: number; y: number };

export const LANES: { id: string; label: string; path: Point[] }[] = [
  { id: "left", label: "Línea izquierda", path: [{ x: 22, y: 92 }, { x: 14, y: 70 }, { x: 14, y: 30 }, { x: 22, y: 8 }] },
  { id: "center", label: "Línea central", path: [{ x: 50, y: 92 }, { x: 50, y: 8 }] },
  { id: "right", label: "Línea derecha", path: [{ x: 78, y: 92 }, { x: 86, y: 70 }, { x: 86, y: 30 }, { x: 78, y: 8 }] },
];

export const BASES = [
  { team: "Amber Hand", point: { x: 50, y: 96 } },
  { team: "Sapphire Flame", point: { x: 50, y: 4 } },
];

/** Intensidad 0-1 de zonas donde se producen más gankeos. */
export const GANK_HOTSPOTS: (Point & { intensity: number; label: string })[] = [
  { x: 32, y: 50, intensity: 1, label: "Pasillo entre línea izquierda y central" },
  { x: 68, y: 50, intensity: 1, label: "Pasillo entre línea central y derecha" },
  { x: 50, y: 50, intensity: 0.8, label: "Foso del Jefe Central" },
  { x: 24, y: 36, intensity: 0.6, label: "Tejados del flanco izquierdo" },
  { x: 76, y: 64, intensity: 0.6, label: "Tejados del flanco derecho" },
  { x: 40, y: 70, intensity: 0.5, label: "Callejón sur" },
  { x: 60, y: 30, intensity: 0.5, label: "Callejón norte" },
];

export const GANK_ROUTES: Point[][] = [
  [{ x: 50, y: 78 }, { x: 36, y: 62 }, { x: 18, y: 52 }],
  [{ x: 50, y: 22 }, { x: 64, y: 38 }, { x: 82, y: 48 }],
  [{ x: 14, y: 40 }, { x: 32, y: 50 }, { x: 50, y: 50 }],
  [{ x: 86, y: 60 }, { x: 68, y: 50 }, { x: 50, y: 50 }],
];

export const SOUL_BOXES: (Point & { label: string })[] = [
  { x: 30, y: 78, label: "Cajas del almacén sur" },
  { x: 70, y: 22, label: "Cajas del almacén norte" },
  { x: 8, y: 50, label: "Cajas tras la línea izquierda" },
  { x: 92, y: 50, label: "Cajas tras la línea derecha" },
  { x: 40, y: 40, label: "Cajas del edificio central" },
  { x: 60, y: 60, label: "Cajas del edificio central" },
];

export const GOLDEN_STATUES: (Point & { label: string })[] = [
  { x: 26, y: 62, label: "Estatua del patio oeste" },
  { x: 74, y: 38, label: "Estatua del patio este" },
  { x: 44, y: 84, label: "Estatua cerca de la base sur" },
  { x: 56, y: 16, label: "Estatua cerca de la base norte" },
];

/** Caminantes (Walkers): radio de visión aproximado. */
export const WALKERS: (Point & { radius: number; label: string })[] = [
  { x: 14, y: 74, radius: 9, label: "Caminante izquierdo (sur)" },
  { x: 50, y: 74, radius: 9, label: "Caminante central (sur)" },
  { x: 86, y: 74, radius: 9, label: "Caminante derecho (sur)" },
  { x: 14, y: 26, radius: 9, label: "Caminante izquierdo (norte)" },
  { x: 50, y: 26, radius: 9, label: "Caminante central (norte)" },
  { x: 86, y: 26, radius: 9, label: "Caminante derecho (norte)" },
];

export const MID_BOSS: Point & { label: string } = { x: 50, y: 50, label: "Jefe Central (min. 10)" };
