"use client";

import { useState } from "react";

interface CommentView {
  id: string;
  body: string;
  user: { username: string };
}

export function CommentBox({ buildId, initial, signedIn }: { buildId: string; initial: CommentView[]; signedIn: boolean }) {
  const [comments, setComments] = useState(initial);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`/api/builds/${buildId}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "No se pudo comentar.");
      setComments((prev) => [...prev, json.data]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo comentar.");
    }
  }

  return (
    <div className="mt-3 border-t border-line pt-3 text-sm">
      <ul className="space-y-1">
        {comments.map((c) => (
          <li key={c.id}><span className="text-brass">{c.user.username}:</span> <span className="whitespace-pre-wrap">{c.body}</span></li>
        ))}
      </ul>
      {signedIn ? (
        <form onSubmit={submit} className="mt-2 flex gap-2">
          <label className="sr-only" htmlFor={`c-${buildId}`}>Comentario</label>
          <input id={`c-${buildId}`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} required
            placeholder="¿Funciona en este parche?" className="flex-1 rounded border border-line bg-ink px-2 py-1" />
          <button className="rounded bg-brass px-3 py-1 text-ink">Enviar</button>
        </form>
      ) : (
        <p className="mt-2 text-muted"><a href="/entrar" className="underline">Inicia sesión</a> para comentar.</p>
      )}
      {error && <p role="alert" className="mt-1 text-danger">{error}</p>}
    </div>
  );
}
