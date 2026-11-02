"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { heroes } from "@/data/heroes";
import { readEnvelope } from "@/lib/apiClient";

export function GuideForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [heroSlug, setHeroSlug] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const guide = await readEnvelope<{ id: string }>(fetch("/api/guides", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, heroSlug: heroSlug || null }),
      }), "No se pudo publicar.");
      router.push(`/comunidad/${guide.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass space-y-4 rounded-xl p-6">
      <label className="block text-sm">Título
        <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={5} maxLength={100}
          className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2" />
      </label>
      <label className="block text-sm">Héroe (opcional)
        <select value={heroSlug} onChange={(e) => setHeroSlug(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2">
          <option value="">General</option>
          {heroes.map((h) => <option key={h.slug} value={h.slug}>{h.name}</option>)}
        </select>
      </label>
      <label className="block text-sm">Guía
        <textarea value={body} onChange={(e) => setBody(e.target.value)} required minLength={50} maxLength={20000} rows={14}
          placeholder="Explica tu estrategia: fase de líneas, objetos, rotaciones…" className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2" />
      </label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button disabled={pending} className="rounded-md bg-brass px-5 py-2 font-medium text-ink disabled:opacity-50">
        {pending ? "Publicando…" : "Publicar guía"}
      </button>
    </form>
  );
}
