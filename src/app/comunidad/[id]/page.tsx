import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { heroesBySlug } from "@/data/heroes";
import { VoteButtons } from "@/components/VoteButtons";
import { fetchGuide } from "@/lib/server/community";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const result = await fetchGuide((await params).id);
  if (!result?.guide) return {};
  return { title: result.guide.title, description: result.guide.body.slice(0, 155) };
}

export default async function CommunityGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const result = await fetchGuide((await params).id);
  if (!result?.guide) notFound();
  const { guide, user } = result;
  return (
    <main className="mx-auto max-w-3xl px-4 pt-10">
      <Link href="/comunidad" className="text-sm text-muted hover:text-parchment">← Comunidad</Link>
      <div className="mt-4 flex gap-4">
        <VoteButtons endpoint={`/api/guides/${guide.id}/vote`} initialScore={guide.score} initialVote={guide.votes?.[0]?.value ?? 0} signedIn={Boolean(user)} />
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider">{guide.title}</h1>
          <p className="text-sm text-muted">
            por {guide.author.username} · {guide.patch.name}
            {guide.heroSlug && heroesBySlug[guide.heroSlug] && <> · <Link href={`/heroes/${guide.heroSlug}`} className="underline">{heroesBySlug[guide.heroSlug].name}</Link></>}
          </p>
        </div>
      </div>
      {/* Texto de usuario renderizado como texto plano (React escapa el contenido). */}
      <article className="mt-8 whitespace-pre-wrap leading-relaxed">{guide.body}</article>
    </main>
  );
}
