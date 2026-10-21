"use client";

import { motion } from "framer-motion";
import type { Hero } from "@/data/types";
import { ARCHETYPE_META } from "@/data/heroes";
import { HeroClip } from "./HeroClip";
import { Stars } from "./Stars";

export function HeroHeader({ hero }: { hero: Hero }) {
  return (
    <header
      className="relative h-[340px] overflow-hidden border-b border-line"
      style={{ background: `linear-gradient(120deg, ${hero.accent}55, #0c0a08 65%)` }}
    >
      <HeroClip hero={hero} className="absolute right-0 top-0 h-full w-auto opacity-80 [mask-image:linear-gradient(to_left,black_40%,transparent)]" />
      <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-8">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs uppercase tracking-[0.4em] text-brass">
          {ARCHETYPE_META[hero.archetype].label}
        </motion.p>
        <h1 className="font-display text-5xl uppercase tracking-[0.12em]">{hero.name}</h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-parchment">{hero.title}</span>
          <Stars value={hero.difficulty} />
          {hero.roles.map((role) => (
            <span key={role} className="rounded-full border border-line bg-ink/60 px-3 py-0.5 text-xs text-muted">{role}</span>
          ))}
        </motion.div>
      </div>
    </header>
  );
}

/** Las secciones de contenido se deslizan desde abajo tras la transición. */
export function SlideIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay }}>
      {children}
    </motion.div>
  );
}
