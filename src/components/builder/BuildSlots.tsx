"use client";

import { useState } from "react";
import type { ItemCategory } from "@/data/types";
import { CATEGORIES, CATEGORY_META, itemsBySlug } from "@/data/items";
import { FLEX_OBJECTIVES, MAX_FLEX_SLOTS, SLOTS_PER_CATEGORY, type Loadout } from "@/lib/slots";
import { readDraggedSlug } from "./dnd";

type Row = ItemCategory | "flex";

interface Props {
  loadout: Loadout;
  flexUnlocked: number;
  onDrop: (slug: string, row: Row) => void;
  onRemove: (slug: string) => void;
}

function SlotRow({ row, slugs, capacity, total, onDrop, onRemove }: {
  row: Row; slugs: string[]; capacity: number; total: number; onDrop: Props["onDrop"]; onRemove: Props["onRemove"];
}) {
  const [over, setOver] = useState(false);
  const color = row === "flex" ? "var(--brass)" : CATEGORY_META[row].color;
  const label = row === "flex" ? "Flex" : CATEGORY_META[row].label;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const slug = readDraggedSlug(e);
        if (slug) onDrop(slug, row);
      }}
      className="rounded-lg p-2 transition-colors"
      style={{ background: over ? "rgba(200,162,90,0.08)" : undefined }}
    >
      <p className="mb-1 text-xs uppercase tracking-widest" style={{ color }}>{label}</p>
      <ul className="grid grid-cols-4 gap-2">
        {Array.from({ length: total }, (_, i) => {
          const slug = slugs[i];
          const locked = i >= capacity;
          const item = slug ? itemsBySlug[slug] : undefined;
          return (
            <li key={i} className="h-16">
              {item ? (
                <button type="button" onClick={() => onRemove(item.slug)} title={`Quitar ${item.name}`}
                  className="flex h-full w-full items-center justify-center rounded-md border-2 bg-ink-2 p-1 text-center text-[11px] leading-tight hover:border-danger"
                  style={{ borderColor: CATEGORY_META[item.category].color }}>
                  {item.name}
                </button>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed text-[10px] text-muted"
                  style={{ borderColor: locked ? "var(--line)" : color, opacity: locked ? 0.4 : 1 }}>
                  {locked ? "🔒" : "Vacío"}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BuildSlots({ loadout, flexUnlocked, onDrop, onRemove }: Props) {
  return (
    <section aria-label="Espacios de objetos" className="glass rounded-xl p-2">
      {CATEGORIES.map((c) => (
        <SlotRow key={c} row={c} slugs={loadout[c]} capacity={SLOTS_PER_CATEGORY} total={SLOTS_PER_CATEGORY} onDrop={onDrop} onRemove={onRemove} />
      ))}
      <SlotRow row="flex" slugs={loadout.flex} capacity={flexUnlocked} total={MAX_FLEX_SLOTS} onDrop={onDrop} onRemove={onRemove} />
    </section>
  );
}

export function FlexObjectives({ unlocked, onChange }: { unlocked: number; onChange: (n: number) => void }) {
  return (
    <fieldset className="glass rounded-xl p-4">
      <legend className="px-1 text-xs uppercase tracking-widest text-brass">Objetivos destruidos (Flex Slots)</legend>
      <ul className="space-y-1 text-sm">
        {FLEX_OBJECTIVES.map((o, i) => (
          <li key={o.id}>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={i < unlocked} onChange={(e) => onChange(e.target.checked ? i + 1 : i)} />
              {o.label}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
