"use client";

import { useMemo, useState } from "react";
import type { Item, ItemCategory } from "@/data/types";
import { CATEGORIES, CATEGORY_META, items } from "@/data/items";
import { normalize } from "@/lib/search";
import { DND_MIME } from "./dnd";

interface Props {
  equipped: Set<string>;
  onAdd: (item: Item) => void;
}

/** Tienda: tres pestañas (Arma, Vitalidad, Espíritu). Arrastra o pulsa para equipar. */
export function BuildShop({ equipped, onAdd }: Props) {
  const [tab, setTab] = useState<ItemCategory>("weapon");
  const [filter, setFilter] = useState("");

  const visible = useMemo(() => {
    const q = normalize(filter.trim());
    return items
      .filter((i) => i.category === tab && (!q || normalize(`${i.name} ${i.description}`).includes(q)))
      .sort((a, b) => a.cost - b.cost);
  }, [tab, filter]);

  return (
    <section aria-label="Tienda" className="glass rounded-xl p-4">
      <div role="tablist" className="flex gap-1">
        {CATEGORIES.map((c) => (
          <button key={c} role="tab" type="button" aria-selected={tab === c} onClick={() => setTab(c)}
            className="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            style={tab === c ? { background: CATEGORY_META[c].color, color: "#0c0a08" } : { color: CATEGORY_META[c].color }}>
            {CATEGORY_META[c].label}
          </button>
        ))}
      </div>
      <label className="sr-only" htmlFor="shop-filter">Filtrar objetos</label>
      <input id="shop-filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrar…"
        className="mt-3 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm" />
      <ul className="mt-3 grid max-h-[520px] grid-cols-1 gap-2 overflow-auto pr-1 sm:grid-cols-2">
        {visible.map((item) => {
          const isEquipped = equipped.has(item.slug);
          return (
            <li key={item.slug}>
              <button
                type="button"
                draggable={!isEquipped}
                disabled={isEquipped}
                onDragStart={(e) => {
                  e.dataTransfer.setData(DND_MIME, item.slug);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => onAdd(item)}
                title={item.description}
                className="w-full cursor-grab rounded-lg border border-line bg-ink-2 p-2 text-left transition-colors hover:border-brass/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm">{item.name}</span>
                  <span className="text-xs tabular-nums text-brass">{item.cost.toLocaleString("es-ES")}</span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{item.description}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
