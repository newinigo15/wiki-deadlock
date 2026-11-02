"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readEnvelope } from "@/lib/apiClient";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await readEnvelope(fetch(`/api/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }),
      }), "Error de autenticación.");
      router.push("/comunidad");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de autenticación.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass space-y-4 rounded-xl p-6">
      <div role="tablist" className="flex gap-2">
        {(["login", "register"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
            className={`flex-1 rounded-md px-3 py-2 text-sm ${mode === m ? "bg-brass text-ink" : "border border-line"}`}>
            {m === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        ))}
      </div>
      <label className="block text-sm">Usuario
        <input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username"
          className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2" />
      </label>
      <label className="block text-sm">Contraseña
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2" />
      </label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button disabled={pending} className="w-full rounded-md bg-brass py-2 font-medium text-ink disabled:opacity-50">
        {pending ? "…" : mode === "login" ? "Entrar" : "Crear cuenta"}
      </button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    setError(null);
    try {
      await readEnvelope(fetch("/api/auth/logout", { method: "POST" }), "No se pudo cerrar la sesión.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar la sesión.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button type="button" disabled={pending} onClick={logout} className="text-sm text-muted underline disabled:opacity-50">
        Cerrar sesión
      </button>
      {error && <span role="alert" className="text-sm text-danger">{error}</span>}
    </span>
  );
}
