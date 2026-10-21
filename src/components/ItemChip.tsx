import type { Item } from "@/data/types";
import { CATEGORY_META } from "@/data/items";

export function ItemChip({ item }: { item: Item }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-md border bg-ink/60 px-2.5 py-1 text-sm"
      style={{ borderColor: CATEGORY_META[item.category].color }}
      title={item.description}
    >
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[item.category].color }} />
      {item.name}
      {item.active && <span className="text-[10px] uppercase text-muted">activo</span>}
    </span>
  );
}
