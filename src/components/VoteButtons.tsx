"use client";

import { useState } from "react";
import { readEnvelope } from "@/lib/apiClient";

interface Props {
  endpoint: string;
  initialScore: number;
  initialVote: number;
  signedIn: boolean;
}

/** Votos estilo Reddit. Pulsar de nuevo el mismo voto lo retira. */
export function VoteButtons({ endpoint, initialScore, initialVote, signedIn }: Props) {
  const [score, setScore] = useState(initialScore);
  const [vote, setVote] = useState(initialVote);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Los props vienen del servidor: tras un router.refresh() (login/logout, nuevos votos)
  // llegan valores nuevos y el estado local debe volver a reflejarlos.
  const [synced, setSynced] = useState({ initialScore, initialVote, signedIn });
  if (synced.initialScore !== initialScore || synced.initialVote !== initialVote || synced.signedIn !== signedIn) {
    setSynced({ initialScore, initialVote, signedIn });
    setScore(initialScore);
    setVote(initialVote);
    setError(null);
  }

  async function cast(value: 1 | -1) {
    if (!signedIn) {
      setError("Inicia sesión para votar.");
      return;
    }
    const next = vote === value ? 0 : value;
    setPending(true);
    setError(null);
    try {
      const data = await readEnvelope<{ score: number }>(
        fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: next }) }),
        "Error al votar.",
      );
      setScore(data.score);
      setVote(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al votar.");
    } finally {
      setPending(false);
    }
  }

  const btn = (value: 1 | -1, label: string, symbol: string) => (
    <button type="button" disabled={pending} onClick={() => cast(value)} aria-label={label} aria-pressed={vote === value}
      className={`px-1 text-lg leading-none ${vote === value ? (value === 1 ? "text-vitality" : "text-danger") : "text-muted hover:text-parchment"}`}>
      {symbol}
    </button>
  );

  return (
    <div className="flex flex-col items-center">
      {btn(1, "Votar a favor", "▲")}
      <span className="font-display text-sm tabular-nums">{score}</span>
      {btn(-1, "Votar en contra", "▼")}
      {error && <span role="alert" className="mt-1 max-w-24 text-center text-[10px] text-danger">{error}</span>}
    </div>
  );
}
