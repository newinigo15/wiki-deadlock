import type { BuildStats } from "@/lib/buildCalc";
import { formatNumber, formatPct } from "@/lib/site";

function Delta({ value, base, digits = 0 }: { value: number; base: number; digits?: number }) {
  const diff = value - base;
  if (Math.abs(diff) < 0.05) return null;
  return <span className={`ml-2 text-xs ${diff > 0 ? "text-vitality" : "text-danger"}`}>{diff > 0 ? "+" : ""}{formatNumber(diff, digits)}</span>;
}

export function BuildStatsPanel({ stats, base }: { stats: BuildStats; base: BuildStats }) {
  const big = [
    { label: "DPS", value: stats.dps, base: base.dps, color: "var(--weapon)" },
    { label: "Salud", value: stats.health, base: base.health, color: "var(--vitality)" },
    { label: "Poder Espiritual", value: stats.spiritPower, base: base.spiritPower, color: "var(--spirit)" },
  ];
  const small: [string, string][] = [
    ["Salud efectiva vs balas", formatNumber(stats.effectiveHealthVsBullets)],
    ["Resistencia a balas", formatPct(stats.bulletResist)],
    ["Resistencia espiritual", formatPct(stats.spiritResist)],
    ["Reducción de enfriamiento", formatPct(stats.cooldownReduction)],
    ["Cargador", String(stats.magazine)],
    ["Robo de vida (balas / espíritu)", `${formatPct(stats.bulletLifesteal)} / ${formatPct(stats.spiritLifesteal)}`],
    ["Cargas de estamina extra", `+${stats.bonusStamina}`],
    ["Coste total", `${formatNumber(stats.cost)} almas`],
  ];
  return (
    <section aria-label="Estadísticas resultantes" aria-live="polite" className="glass rounded-xl p-4">
      <div className="grid grid-cols-3 gap-2">
        {big.map((s) => (
          <div key={s.label} className="rounded-lg bg-ink-2 p-3">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="font-display text-2xl tabular-nums" style={{ color: s.color }}>
              {formatNumber(s.value)}
              <Delta value={s.value} base={s.base} />
            </p>
          </div>
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
        {small.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-line py-1">
            <dt className="text-muted">{k}</dt>
            <dd className="tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted">DPS teórico máximo con todas las condiciones de los objetos activas. Valores aproximados del parche actual.</p>
    </section>
  );
}
