"use client";

import { useState } from "react";

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

  async function cast(value: 1 | -1) {
    if (!signedIn) {
      setError("Inicia sesión para votar.");
      return;
    }
    const next = vote === value ? 0 : value;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: next }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Error al votar.");
      setScore(json.data.score);
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
