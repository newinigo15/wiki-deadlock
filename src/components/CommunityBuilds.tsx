"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { itemsBySlug } from "@/data/items";
import { readEnvelope } from "@/lib/apiClient";
import { CommentBox } from "./CommentBox";
import { ItemChip } from "./ItemChip";
import { VoteButtons } from "./VoteButtons";

interface BuildView {
  id: string;
  title: string;
  items: string[];
  flexSlots: number;
  score: number;
  myVote: number;
  author: string;
  patch: string;
  comments: { id: string; body: string; user: { username: string } }[];
}

type State =
  | { status: "loading" }
  | { status: "unavailable"; message: string }
  | { status: "ready"; signedIn: boolean; builds: BuildView[] };

/** Se carga en el cliente para que la página del héroe siga siendo estática (rápida y cacheable). */
export function CommunityBuilds({ heroSlug }: { heroSlug: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    readEnvelope<{ signedIn: boolean; builds: BuildView[] }>(
      fetch(`/api/builds?hero=${encodeURIComponent(heroSlug)}`, { signal: controller.signal }),
      "La comunidad no está disponible.",
    )
      .then((data) => setState({ status: "ready", ...data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: "unavailable", message: error instanceof Error ? error.message : "No disponible." });
      });
    return () => controller.abort();
  }, [heroSlug]);

  if (state.status === "loading") return <p className="text-sm text-muted">Cargando builds…</p>;
  if (state.status === "unavailable") return <p className="text-sm text-muted">{state.message}</p>;

  return (
    <div className="space-y-3">
      {state.builds.length === 0 && (
        <p className="text-sm text-muted">
          Aún no hay builds. <Link href={`/builds?hero=${heroSlug}`} className="underline">Crea la primera</Link>.
        </p>
      )}
      {state.builds.map((build) => (
        <article key={build.id} className="glass flex gap-4 rounded-xl p-4">
          <VoteButtons endpoint={`/api/builds/${build.id}/vote`} initialScore={build.score} initialVote={build.myVote} signedIn={state.signedIn} />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium">
              <Link href={`/builds?hero=${heroSlug}&items=${build.items.join(",")}&flex=${build.flexSlots}`} className="hover:text-brass">
                {build.title}
              </Link>
            </h3>
            <p className="text-xs text-muted">por {build.author} · {build.patch}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {build.items.map((slug) => itemsBySlug[slug] && <ItemChip key={slug} item={itemsBySlug[slug]} />)}
            </div>
            <CommentBox buildId={build.id} initial={build.comments} signedIn={state.signedIn} />
          </div>
        </article>
      ))}
    </div>
  );
}
