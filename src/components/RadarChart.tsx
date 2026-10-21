import type { Hero } from "@/data/types";

const AXES: { key: keyof Hero["radar"]; label: string }[] = [
  { key: "damage", label: "Daño" },
  { key: "mobility", label: "Movilidad" },
  { key: "utility", label: "Utilidad" },
  { key: "durability", label: "Resistencia" },
];
const MAX = 10;
const R = 80;
const C = 110;

function point(index: number, value: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;
  const r = (value / MAX) * R;
  return [C + r * Math.cos(angle), C + r * Math.sin(angle)];
}

/** Rueda de estadísticas (spider chart) de 0 a 10. */
export function RadarChart({ hero }: { hero: Hero }) {
  const polygon = AXES.map((a, i) => point(i, hero.radar[a.key]).join(",")).join(" ");
  return (
    <figure>
      <svg viewBox="-40 0 300 220" className="mx-auto w-full max-w-[300px]" role="img"
        aria-label={AXES.map((a) => `${a.label} ${hero.radar[a.key]} de 10`).join(", ")}>
        {[2.5, 5, 7.5, 10].map((v) => (
          <polygon key={v} points={AXES.map((_, i) => point(i, v).join(",")).join(" ")} fill="none" stroke="var(--line)" />
        ))}
        {AXES.map((a, i) => {
          const [x, y] = point(i, MAX);
          const [lx, ly] = point(i, MAX + 2.4);
          return (
            <g key={a.key}>
              <line x1={C} y1={C} x2={x} y2={y} stroke="var(--line)" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="var(--muted)">
                {a.label} · {hero.radar[a.key]}
              </text>
            </g>
          );
        })}
        <polygon points={polygon} fill={hero.accent} fillOpacity="0.28" stroke={hero.accent} strokeWidth="2" />
      </svg>
    </figure>
  );
}
