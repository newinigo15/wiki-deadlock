"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { search } from "@/lib/search";

export function SmartSearch() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => search(query), [query]);
  const listId = useId();

  return (
    <div className="relative w-full max-w-xl">
      <label htmlFor={`${listId}-input`} className="sr-only">Buscar en la wiki</label>
      <input
        id={`${listId}-input`}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Busca un héroe, objeto o mecánica… (ej. «parry», «toxic», «Seven»)"
        autoComplete="off"
        aria-controls={listId}
        className="glass w-full rounded-full px-5 py-3 text-base text-parchment placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-brass"
      />
      {query.trim().length > 1 && (
        <ul id={listId} role="listbox" className="glass absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-auto rounded-xl p-1">
          {results.length === 0 && <li className="px-4 py-3 text-sm text-muted">Sin resultados.</li>}
          {results.map((r) => (
            <li key={r.href} role="option" aria-selected={false}>
              <Link href={r.href} className="block rounded-lg px-4 py-2 hover:bg-white/5">
                <span className="mr-2 text-[10px] uppercase tracking-widest text-brass">{r.kind}</span>
                <span className="text-parchment">{r.title}</span>
                <span className="block truncate text-xs text-muted">{r.subtitle}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
