import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, CATEGORY_META, items } from "@/data/items";

export const metadata: Metadata = {
  title: "Objetos: Arma, Vitalidad y Espíritu",
  description: "Todos los objetos de Deadlock con su coste, efecto y a quién hacen counter: Toxic Bullets, Debuff Remover, Knockdown, Curse y más.",
  alternates: { canonical: "/objetos" },
};

const BLURB = {
  weapon: "Mejoran el daño primario y la munición.",
  vitality: "Escalado de salud, estamina y resistencia.",
  spirit: "Reducción de enfriamientos, rango de habilidades y robo de vida de hechizos.",
} as const;

export default function ItemsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="font-display text-4xl uppercase tracking-wider">Sistema de Objetos</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Las builds no son estáticas: adapta tu compra al equipo enemigo. Lee la <Link href="/guias/objetos-counter" className="underline">guía de counters</Link>.
      </p>
      {CATEGORIES.map((category) => (
        <section key={category} className="mt-10">
          <h2 className="font-display text-xl uppercase tracking-[0.2em]" style={{ color: CATEGORY_META[category].color }}>
            {CATEGORY_META[category].label}
          </h2>
          <p className="mb-4 text-sm text-muted">{BLURB[category]}</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.filter((i) => i.category === category).sort((a, b) => a.cost - b.cost).map((item) => (
              <li key={item.slug} id={item.slug} className="glass scroll-mt-20 rounded-xl p-4" style={{ borderLeft: `3px solid ${CATEGORY_META[category].color}` }}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-medium">{item.name}</h3>
                  <span className="text-xs tabular-nums text-brass">{item.cost.toLocaleString("es-ES")} almas</span>
                </div>
                {item.active && <span className="text-[10px] uppercase tracking-widest text-muted">Objeto activo</span>}
                <p className="mt-1 text-sm text-muted">{item.description}</p>
                {item.counters && <p className="mt-2 text-sm"><span className="text-danger">Counter:</span> {item.counters}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
