import type { Metadata } from "next";
import Link from "next/link";
import { heroesBySlug } from "@/data/heroes";
import { LogoutButton } from "@/components/AuthForm";
import { VoteButtons } from "@/components/VoteButtons";
import { fetchGuides } from "@/lib/server/community";

export const metadata: Metadata = {
  title: "Guías de la comunidad",
  description: "Guías escritas por jugadores y votadas por la comunidad según el parche actual.",
  alternates: { canonical: "/comunidad" },
};
export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const result = await fetchGuides();
  return (
    <main className="mx-auto max-w-4xl px-4 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wider">Comunidad</h1>
          <p className="mt-2 text-muted">Las mejores guías suben a la cima con los votos de los jugadores.</p>
        </div>
        {result && (result.user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm">Hola, <span className="text-brass">{result.user.username}</span></span>
            <LogoutButton />
            <Link href="/comunidad/nueva" className="rounded-md bg-brass px-4 py-2 text-sm font-medium text-ink">Escribir guía</Link>
          </div>
        ) : (
          <Link href="/entrar" className="rounded-md bg-brass px-4 py-2 text-sm font-medium text-ink">Entrar para publicar</Link>
        ))}
      </div>

      {!result ? (
        <p className="glass mt-8 rounded-xl p-6 text-muted">La comunidad no está disponible: configura DATABASE_URL y ejecuta las migraciones.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {result.guides.length === 0 && <li className="text-muted">Todavía no hay guías. ¡Sé el primero!</li>}
          {result.guides.map((g) => (
            <li key={g.id} className="glass flex gap-4 rounded-xl p-4">
              <VoteButtons endpoint={`/api/guides/${g.id}/vote`} initialScore={g.score} initialVote={g.votes?.[0]?.value ?? 0} signedIn={Boolean(result.user)} />
              <div className="min-w-0">
                <Link href={`/comunidad/${g.id}`} className="font-medium hover:text-brass">{g.title}</Link>
                <p className="text-xs text-muted">
                  por {g.author.username} · {g.patch.name}{g.heroSlug && ` · ${heroesBySlug[g.heroSlug]?.name ?? g.heroSlug}`}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{g.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
