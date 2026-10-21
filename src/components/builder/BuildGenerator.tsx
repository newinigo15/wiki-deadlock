"use client";

import { useEffect, useMemo, useState } from "react";
import { heroes, heroesBySlug } from "@/data/heroes";
import { itemsBySlug } from "@/data/items";
import type { Item, ItemCategory } from "@/data/types";
import { computeBuildStats } from "@/lib/buildCalc";
import { addItem, addItemToFlex, allSlugs, clampFlex, loadoutFromSlugs, removeItem, trimFlex } from "@/lib/slots";
import { BuildShop } from "./BuildShop";
import { BuildSlots, FlexObjectives } from "./BuildSlots";
import { BuildStatsPanel } from "./BuildStatsPanel";
import { SaveBuild } from "./SaveBuild";

interface Props {
  initialHero: string;
  initialItems: string[];
  initialFlex: number;
}

export function BuildGenerator({ initialHero, initialItems, initialFlex }: Props) {
  const [heroSlug, setHeroSlug] = useState(heroesBySlug[initialHero] ? initialHero : heroes[0].slug);
  const [flexUnlocked, setFlexUnlocked] = useState(clampFlex(initialFlex));
  const [loadout, setLoadout] = useState(() => loadoutFromSlugs(initialItems, itemsBySlug, clampFlex(initialFlex)));
  const [message, setMessage] = useState<string | null>(null);

  const hero = heroesBySlug[heroSlug];
  const slugs = useMemo(() => allSlugs(loadout), [loadout]);
  const equipped = useMemo(() => new Set(slugs), [slugs]);
  const stats = useMemo(() => computeBuildStats(hero.base, slugs.map((s) => itemsBySlug[s])), [hero, slugs]);
  const baseStats = useMemo(() => computeBuildStats(hero.base, []), [hero]);

  // Mantiene la URL compartible sin recargar la página.
  useEffect(() => {
    const params = new URLSearchParams({ hero: heroSlug });
    if (slugs.length) params.set("items", slugs.join(","));
    if (flexUnlocked) params.set("flex", String(flexUnlocked));
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [heroSlug, slugs, flexUnlocked]);

  function place(item: Item, toFlex: boolean) {
    const result = toFlex ? addItemToFlex(loadout, item, flexUnlocked) : addItem(loadout, item, flexUnlocked);
    if (result.ok) {
      setLoadout(result.loadout);
      setMessage(null);
    } else {
      setMessage(result.error);
    }
  }

  function handleDrop(slug: string, row: ItemCategory | "flex") {
    const item = itemsBySlug[slug];
    if (item) place(item, row === "flex" || row !== item.category);
  }

  function changeFlex(n: number) {
    setFlexUnlocked(n);
    setLoadout((prev) => trimFlex(prev, n));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        <div className="glass flex flex-wrap items-center gap-3 rounded-xl p-4">
          <label htmlFor="hero-select" className="text-sm text-muted">Héroe</label>
          <select id="hero-select" value={heroSlug} onChange={(e) => setHeroSlug(e.target.value)}
            className="rounded-md border border-line bg-ink px-3 py-2">
            {heroes.map((h) => <option key={h.slug} value={h.slug}>{h.name}</option>)}
          </select>
          <button type="button" onClick={() => setLoadout(loadoutFromSlugs(hero.coreItems, itemsBySlug, flexUnlocked))}
            className="rounded-md border border-line px-3 py-2 text-sm hover:border-brass">Cargar objetos core</button>
          <button type="button" onClick={() => setLoadout(loadoutFromSlugs([], itemsBySlug, 0))}
            className="rounded-md border border-line px-3 py-2 text-sm hover:border-danger">Vaciar</button>
        </div>
        <BuildShop equipped={equipped} onAdd={(item) => place(item, false)} />
      </div>
      <div className="space-y-4">
        <BuildSlots loadout={loadout} flexUnlocked={flexUnlocked} onDrop={handleDrop} onRemove={(s) => setLoadout(removeItem(loadout, s))} />
        {message && <p role="alert" className="rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">{message}</p>}
        <BuildStatsPanel stats={stats} base={baseStats} />
        <FlexObjectives unlocked={flexUnlocked} onChange={changeFlex} />
        <SaveBuild heroSlug={heroSlug} heroName={hero.name} items={slugs} flexSlots={flexUnlocked} />
      </div>
    </div>
  );
}
