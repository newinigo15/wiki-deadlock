import type { Hero } from "@/data/types";

/** Retrato estilizado generado (sustituible por arte oficial en /public/portraits/<slug>.webp). */
export function HeroPortrait({ hero, className = "" }: { hero: Hero; className?: string }) {
  const initials = hero.name.replace(/&/g, "").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2);
  const id = `g-${hero.slug}`;
  return (
    <svg viewBox="0 0 120 150" role="img" aria-label={`Retrato de ${hero.name}`} className={className}>
      <defs>
        <radialGradient id={id} cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor={hero.accent} stopOpacity="0.85" />
          <stop offset="70%" stopColor="#15120e" />
        </radialGradient>
      </defs>
      <rect width="120" height="150" fill={`url(#${id})`} />
      <g fill="none" stroke={hero.accent} strokeOpacity="0.35">
        <path d="M60 18 L100 75 L60 132 L20 75 Z" />
        <circle cx="60" cy="75" r="30" />
      </g>
      <text x="60" y="88" textAnchor="middle" fontFamily="var(--font-display)" fontSize="34" fill="#e8dcc4" letterSpacing="2">
        {initials}
      </text>
    </svg>
  );
}
