"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Hero } from "@/data/types";
import { ARCHETYPE_META } from "@/data/heroes";
import { HeroClip } from "./HeroClip";
import { SceneBackground } from "./SceneBackground";
import { SmartSearch } from "./SmartSearch";

export function HomeHub({ heroes }: { heroes: Hero[] }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [expanding, setExpanding] = useState<Hero | null>(null);

  function openHero(hero: Hero) {
    router.prefetch(`/heroes/${hero.slug}`);
    setExpanding(hero);
  }

  return (
    <>
      <SceneBackground blurred={hovered !== null || expanding !== null} />
      <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-20 text-center sm:pt-28">
        <p className="font-display text-xs uppercase tracking-[0.5em] text-brass">La ciudad nunca duerme</p>
        <h1 className="mt-3 font-display text-5xl uppercase tracking-[0.12em] sm:text-7xl">
          Deadlock <span className="text-brass">Wiki</span>
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          Héroes, builds, objetos y mecánicas avanzadas. Rápida, sin anuncios y hecha para consultarla en mitad de una partida.
        </p>
        <div className="mt-8 flex w-full justify-center">
          <SmartSearch />
        </div>
      </section>

      <section aria-labelledby="heroes-title" className="mx-auto mt-16 max-w-6xl px-4">
        <h2 id="heroes-title" className="mb-4 font-display text-xl uppercase tracking-[0.2em] text-parchment">Héroes</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {heroes.map((hero) => (
            <li key={hero.slug}>
              <motion.button
                layoutId={`hero-${hero.slug}`}
                type="button"
                onClick={() => openHero(hero)}
                onMouseEnter={() => setHovered(hero.slug)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(hero.slug)}
                onBlur={() => setHovered(null)}
                whileHover={{ y: -6, scale: 1.03 }}
                className="glass group relative block w-full overflow-hidden rounded-xl text-left"
                style={{ boxShadow: hovered === hero.slug ? `0 0 0 1px ${hero.accent}, 0 18px 40px -12px ${hero.accent}` : undefined }}
              >
                <HeroClip hero={hero} playing={hovered === hero.slug} className="aspect-[4/5] w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/70 to-transparent p-3">
                  <span className="block font-display text-lg uppercase tracking-wider">{hero.name}</span>
                  <span className="block text-xs text-muted">{ARCHETYPE_META[hero.archetype].label}</span>
                </span>
              </motion.button>
            </li>
          ))}
        </ul>
      </section>

      {/* Transición sin carga: la tarjeta se expande hasta la cabecera antes de navegar. */}
      <AnimatePresence>
        {expanding && (
          <motion.div
            layoutId={`hero-${expanding.slug}`}
            className="fixed inset-x-0 top-14 z-50 h-[340px] overflow-hidden"
            style={{ background: `linear-gradient(120deg, ${expanding.accent}55, #0c0a08 65%)` }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            onLayoutAnimationComplete={() => router.push(`/heroes/${expanding.slug}`)}
          >
            <div className="mx-auto flex h-full max-w-6xl items-end px-4 pb-8">
              <span className="font-display text-5xl uppercase tracking-[0.12em]">{expanding.name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
