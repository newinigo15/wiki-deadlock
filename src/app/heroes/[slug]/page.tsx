import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CURRENT_PATCH, heroDisplayName, heroes, heroesBySlug } from "@/data/heroes";
import { itemsBySlug } from "@/data/items";
import { CommunityBuilds } from "@/components/CommunityBuilds";
import { HeroHeader, SlideIn } from "@/components/HeroHeader";
import { HeroModelSlot } from "@/components/HeroModelSlot";
import { ItemChip } from "@/components/ItemChip";
import { JsonLd } from "@/components/JsonLd";
import { PipClip } from "@/components/PipClip";
import { RadarChart } from "@/components/RadarChart";
import { heroFaqSchema } from "@/lib/heroSchema";
import { formatNumber } from "@/lib/site";
import type { Matchup } from "@/data/types";

export function generateStaticParams() {
  return heroes.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const hero = heroesBySlug[(await params).slug];
  if (!hero) return {};
  return {
    title: `${hero.name} — Guía, build y counters`,
    description: `${hero.name}, ${hero.title}. ${hero.summary} Salud base ${hero.base.health}.`,
    alternates: { canonical: `/heroes/${hero.slug}` },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 font-display text-xl uppercase tracking-[0.2em] text-brass">{title}</h2>
      {children}
    </section>
  );
}

function MatchupList({ list, tone }: { list: Matchup[]; tone: "good" | "bad" }) {
  return (
    <ul className="space-y-2">
      {list.map((m) => (
        <li key={m.hero} className="glass rounded-lg p-3 text-sm">
          {heroesBySlug[m.hero] ? (
            <Link href={`/heroes/${m.hero}`} className={tone === "good" ? "text-vitality" : "text-danger"}>{heroDisplayName(m.hero)}</Link>
          ) : (
            <span className={tone === "good" ? "text-vitality" : "text-danger"}>{heroDisplayName(m.hero)}</span>
          )}
          <span className="text-muted"> — {m.reason}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function HeroPage({ params }: { params: Promise<{ slug: string }> }) {
  const hero = heroesBySlug[(await params).slug];
  if (!hero) notFound();

  const stats = [
    ["Salud base", formatNumber(hero.base.health)],
    ["Daño por bala", formatNumber(hero.base.bulletDamage, 1)],
    ["Cadencia (disparos/s)", formatNumber(hero.base.fireRate, 2)],
    ["DPS base", formatNumber(hero.base.bulletDamage * hero.base.fireRate, 1)],
    ["Cargador", String(hero.base.magazine)],
    ["Velocidad (m/s)", formatNumber(hero.base.moveSpeed, 1)],
  ];

  return (
    <main>
      <JsonLd data={heroFaqSchema(hero)} />
      <HeroHeader hero={hero} />
      <div className="mx-auto max-w-6xl px-4">
        <SlideIn delay={0.1}>
          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
            <div>
              <p className="text-lg">{hero.summary}</p>
              <p className="mt-3 text-muted">{hero.howToPlay}</p>
              <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {stats.map(([label, value]) => (
                  <div key={label} className="glass rounded-lg p-3">
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="font-display text-xl">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <RadarChart hero={hero} />
          </div>
        </SlideIn>

        <SlideIn delay={0.2}>
          <Section title="Habilidades">
            <ol className="space-y-4">
              {hero.abilities.map((ability, index) => (
                <li key={ability.name} className="glass flex flex-col gap-4 rounded-xl p-4 sm:flex-row">
                  <div className="flex-1">
                    <h3 className="font-display text-lg uppercase tracking-wider">
                      <span className="mr-2 text-brass">{index + 1}</span>{ability.name}
                    </h3>
                    <p className="mt-1 text-muted">{ability.description}</p>
                    {ability.imbue && (
                      <p className="mt-2 text-sm"><span className="text-spirit">Imbuir:</span> {ability.imbue}</p>
                    )}
                  </div>
                  <PipClip name={`${hero.slug}-${index + 1}`} label={`${ability.name} en acción`} />
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Ruta de progresión">
            <p className="mb-3 text-sm text-muted">Orden en el que maximizar las habilidades:</p>
            <ol className="flex flex-wrap gap-2">
              {hero.skillPath.map((abilityIndex, step) => (
                <li key={abilityIndex} className="glass rounded-lg px-4 py-2">
                  <span className="mr-2 text-brass">{step + 1}º</span>{hero.abilities[abilityIndex - 1].name}
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Objetos core">
            <div className="flex flex-wrap gap-2">
              {hero.coreItems.map((slug) => <ItemChip key={slug} item={itemsBySlug[slug]} />)}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link href={`/builds?hero=${hero.slug}&items=${hero.coreItems.join(",")}`} className="text-brass underline">
                Abrir en el generador de builds →
              </Link>
              <Link href={`/heroes/${hero.slug}/build-${CURRENT_PATCH.slug}`} className="text-muted underline">
                Build recomendada · {CURRENT_PATCH.label}
              </Link>
            </div>
          </Section>

          <Section title="Matchups">
            <div className="grid gap-6 md:grid-cols-2">
              <div><h3 className="mb-2 text-sm uppercase tracking-widest text-vitality">Fuerte contra</h3><MatchupList list={hero.strongAgainst} tone="good" /></div>
              <div><h3 className="mb-2 text-sm uppercase tracking-widest text-danger">Débil contra</h3><MatchupList list={hero.weakAgainst} tone="bad" /></div>
            </div>
          </Section>

          <Section title="Modelo e hitboxes">
            <HeroModelSlot accent={hero.accent} name={hero.name} />
          </Section>

          <Section title="Builds de la comunidad">
            <CommunityBuilds heroSlug={hero.slug} />
          </Section>
        </SlideIn>
      </div>
    </main>
  );
}
