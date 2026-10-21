import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CURRENT_PATCH, heroes, heroesBySlug } from "@/data/heroes";
import { itemsBySlug } from "@/data/items";
import { ItemChip } from "@/components/ItemChip";
import { computeBuildStats } from "@/lib/buildCalc";
import { formatNumber } from "@/lib/site";

type Params = Promise<{ slug: string; build: string }>;

function resolve(slug: string, build: string) {
  const hero = heroesBySlug[slug];
  if (!hero || build !== `build-${CURRENT_PATCH.slug}`) return null;
  return hero;
}

export function generateStaticParams() {
  return heroes.map((h) => ({ slug: h.slug, build: `build-${CURRENT_PATCH.slug}` }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, build } = await params;
  const hero = resolve(slug, build);
  if (!hero) return {};
  return {
    title: `Build de ${hero.name} · ${CURRENT_PATCH.label}`,
    description: `Mejores objetos para ${hero.name} en el ${CURRENT_PATCH.label}: ${hero.coreItems.map((s) => itemsBySlug[s].name).join(", ")}.`,
    alternates: { canonical: `/heroes/${hero.slug}/${build}` },
  };
}

export default async function HeroBuildPage({ params }: { params: Params }) {
  const { slug, build } = await params;
  const hero = resolve(slug, build);
  if (!hero) notFound();
  const items = hero.coreItems.map((s) => itemsBySlug[s]);
  const stats = computeBuildStats(hero.base, items);

  return (
    <main className="mx-auto max-w-3xl px-4 pt-12">
      <p className="text-xs uppercase tracking-[0.4em] text-brass">{CURRENT_PATCH.label}</p>
      <h1 className="font-display text-4xl uppercase tracking-wider">Build de {hero.name}</h1>
      <p className="mt-3 text-muted">{hero.howToPlay}</p>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item.slug} className="glass rounded-lg p-3">
            <ItemChip item={item} />
            <p className="mt-2 text-sm text-muted">{item.description}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm">
        Resultado: <strong>{formatNumber(stats.dps, 0)} DPS</strong> · <strong>{formatNumber(stats.health)} salud</strong> ·{" "}
        <strong>{formatNumber(stats.spiritPower)} poder espiritual</strong> · {formatNumber(stats.cost)} almas.
      </p>
      <div className="mt-6 flex gap-4 text-sm">
        <Link href={`/builds?hero=${hero.slug}&items=${hero.coreItems.join(",")}`} className="text-brass underline">Personalizar en el generador</Link>
        <Link href={`/heroes/${hero.slug}`} className="text-muted underline">Volver a {hero.name}</Link>
      </div>
    </main>
  );
}
