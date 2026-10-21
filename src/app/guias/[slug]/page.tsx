import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guides, guidesBySlug } from "@/data/guides";
import { heroesBySlug } from "@/data/heroes";
import { JsonLd } from "@/components/JsonLd";
import { PipClip } from "@/components/PipClip";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = guidesBySlug[(await params).slug];
  if (!guide) return {};
  return { title: guide.title, description: guide.excerpt, alternates: { canonical: `/guias/${guide.slug}` } };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = guidesBySlug[(await params).slug];
  if (!guide) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 pt-10">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Article", headline: guide.title, description: guide.excerpt,
        inLanguage: "es", url: `${SITE_URL}/guias/${guide.slug}`, about: { "@type": "VideoGame", name: "Deadlock" },
      }} />
      <nav aria-label="Migas" className="text-sm text-muted"><Link href="/guias" className="hover:text-parchment">Guías</Link> / {guide.category}</nav>
      <h1 className="mt-2 font-display text-4xl uppercase tracking-wider">{guide.title}</h1>
      <p className="mt-2 text-lg text-muted">{guide.excerpt}</p>
      {guide.sections.map((section) => (
        <section key={section.heading} className="mt-10">
          <h2 className="mb-3 font-display text-xl uppercase tracking-[0.15em] text-brass">{section.heading}</h2>
          <div className="flex flex-col gap-4 sm:flex-row-reverse sm:items-start">
            {section.clip && <PipClip name={section.clip} label={section.heading} />}
            <div className="prose-wiki flex-1">
              {section.paragraphs.map((p) => <p key={p}>{p}</p>)}
              {section.bullets && (
                <ul className="mt-3 list-disc space-y-1 pl-5">{section.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
              )}
            </div>
          </div>
        </section>
      ))}
      {guide.relatedHeroes && (
        <p className="mt-10 text-sm">Héroes relacionados:{" "}
          {guide.relatedHeroes.map((s) => <Link key={s} href={`/heroes/${s}`} className="mr-2 text-brass underline">{heroesBySlug[s]?.name ?? s}</Link>)}
        </p>
      )}
    </main>
  );
}
