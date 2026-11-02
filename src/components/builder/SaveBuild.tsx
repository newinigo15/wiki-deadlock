"use client";

import Link from "next/link";
import { useState } from "react";
import { readEnvelope } from "@/lib/apiClient";

interface Props {
  heroSlug: string;
  heroName: string;
  items: string[];
  flexSlots: number;
}

export function SaveBuild({ heroSlug, heroName, items, flexSlots }: Props) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setStatus(null);
    try {
      await readEnvelope(fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroSlug, title, items, flexSlots }),
      }), "No se pudo guardar.");
      setStatus({ kind: "ok", text: "Build publicada." });
      setTitle("");
    } catch (err) {
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "No se pudo guardar." });
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setStatus({ kind: "error", text: "No se pudo copiar el enlace." });
    }
  }

  return (
    <form onSubmit={save} className="glass space-y-2 rounded-xl p-4">
      <p className="text-xs uppercase tracking-widest text-brass">Publicar en la comunidad</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="build-title" className="sr-only">Título</label>
        <input id="build-title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={80}
          placeholder={`Mi build de ${heroName}`} className="flex-1 rounded-md border border-line bg-ink px-3 py-2 text-sm" />
        <button disabled={pending || items.length === 0} className="rounded-md bg-brass px-4 py-2 text-sm font-medium text-ink disabled:opacity-40">
          {pending ? "Publicando…" : "Publicar"}
        </button>
        <button type="button" onClick={copyLink} className="rounded-md border border-line px-4 py-2 text-sm">
          {copied ? "¡Copiado!" : "Copiar enlace"}
        </button>
      </div>
      {status && (
        <p role="status" className={`text-sm ${status.kind === "ok" ? "text-vitality" : "text-danger"}`}>
          {status.text}{" "}
          {status.kind === "ok" && <Link href={`/heroes/${heroSlug}`} className="underline">Ver en la página del héroe</Link>}
          {status.text.includes("sesión") && <Link href="/entrar" className="underline">Entrar</Link>}
        </p>
      )}
    </form>
  );
}
