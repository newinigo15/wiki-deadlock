import { heroes } from "@/data/heroes";
import { items, CATEGORY_META } from "@/data/items";
import { guides } from "@/data/guides";

export interface SearchResult {
  kind: "Héroe" | "Objeto" | "Guía";
  title: string;
  subtitle: string;
  href: string;
  score: number;
}

interface Entry extends Omit<SearchResult, "score"> {
  haystack: string;
}

export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const INDEX: Entry[] = [
  ...heroes.map((h) => ({
    kind: "Héroe" as const, title: h.name, subtitle: `${h.title} · ${h.roles.join(", ")}`, href: `/heroes/${h.slug}`,
    haystack: normalize([h.name, h.title, ...h.roles, h.summary, ...h.abilities.map((a) => a.name)].join(" ")),
  })),
  ...items.map((i) => ({
    kind: "Objeto" as const, title: i.name, subtitle: `${CATEGORY_META[i.category].label} · ${i.cost} almas`, href: `/objetos#${i.slug}`,
    haystack: normalize([i.name, i.description, i.counters ?? ""].join(" ")),
  })),
  ...guides.map((g) => ({
    kind: "Guía" as const, title: g.title, subtitle: g.excerpt, href: `/guias/${g.slug}`,
    haystack: normalize([g.title, g.excerpt, ...g.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])])].join(" ")),
  })),
];

/** Búsqueda por palabras: todas deben aparecer; puntúa más las coincidencias en el título. */
export function search(query: string, limit = 8): SearchResult[] {
  const terms = normalize(query).split(/\s+/).filter((t) => t.length > 1);
  if (terms.length === 0) return [];
  return INDEX.flatMap((entry) => {
    if (!terms.every((t) => entry.haystack.includes(t))) return [];
    const title = normalize(entry.title);
    const score = terms.reduce((acc, t) => acc + (title.startsWith(t) ? 5 : title.includes(t) ? 3 : 1), 0);
    return [{ kind: entry.kind, title: entry.title, subtitle: entry.subtitle, href: entry.href, score }];
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
