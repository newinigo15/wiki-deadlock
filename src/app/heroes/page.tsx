import type { Metadata } from "next";
import Link from "next/link";
import { ARCHETYPE_META, heroes } from "@/data/heroes";
import type { Archetype } from "@/data/types";
import { HeroPortrait } from "@/components/HeroPortrait";
import { Stars } from "@/components/Stars";

export const metadata: Metadata = {
  title: "Todos los héroes",
  description: "Lista de héroes de Deadlock por arquetipo: carries de arma, magos espirituales, tanques y soportes.",
  alternates: { canonical: "/heroes" },
};

export default function HeroesPage() {
  const groups = Object.keys(ARCHETYPE_META) as Archetype[];
  return (
    <main className="mx-auto max-w-6xl px-4 pt-12">
      <h1 className="font-display text-4xl uppercase tracking-wider">Enciclopedia de Héroes</h1>
      {groups.map((archetype) => (
        <section key={archetype} className="mt-10">
          <h2 className="font-display text-xl uppercase tracking-[0.2em] text-brass">{ARCHETYPE_META[archetype].label}</h2>
          <p className="mb-4 text-sm text-muted">{ARCHETYPE_META[archetype].blurb}</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {heroes.filter((h) => h.archetype === archetype).map((hero) => (
              <li key={hero.slug}>
                <Link href={`/heroes/${hero.slug}`} className="glass flex gap-3 overflow-hidden rounded-xl hover:border-brass/50">
                  <HeroPortrait hero={hero} className="h-28 w-24 shrink-0" />
                  <span className="py-3 pr-3">
                    <span className="block font-display text-lg uppercase tracking-wider">{hero.name}</span>
                    <span className="block text-sm text-muted">{hero.title}</span>
                    <Stars value={hero.difficulty} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
