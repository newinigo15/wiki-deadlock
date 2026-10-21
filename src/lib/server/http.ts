import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { isDbConfigured } from "./db";
import { getCurrentUser, type SessionUser } from "./auth";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiEnvelope<T>>({ success: true, data, error: null }, { status });
}

export function fail(error: string, status: number) {
  return NextResponse.json<ApiEnvelope<null>>({ success: false, data: null, error }, { status });
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_TRACKED_KEYS = 10_000;
const MAX_BODY_BYTES = 64 * 1024;
const hits = new Map<string, { count: number; resetAt: number }>();

function pruneExpired(now: number) {
  for (const [key, entry] of hits) if (entry.resetAt < now) hits.delete(key);
}

/** Limitador en memoria de ventana fija (suficiente para una sola instancia). */
export function rateLimited(key: string, max = MAX_REQUESTS_PER_WINDOW, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  if (hits.size > MAX_TRACKED_KEYS) pruneExpired(now);
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

/**
 * IP del cliente. `x-real-ip` lo fija el proxy; si no existe se usa el último salto de
 * `x-forwarded-for`, que añade nuestro proxy y el cliente no puede falsear.
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const hops = request.headers.get("x-forwarded-for")?.split(",").map((h) => h.trim()).filter(Boolean) ?? [];
  return hops.at(-1) ?? "local";
}

/** Rechaza peticiones de escritura enviadas desde otro origen (defensa CSRF). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type Guarded<T> =
  | { response: NextResponse; body?: undefined; user?: undefined }
  | { response?: undefined; body: T; user: SessionUser | null };

/** Comprobaciones comunes de las rutas de escritura: BD, origen, límite, sesión y validación. */
export async function guardMutation<T>(
  request: Request,
  schema: ZodSchema<T>,
  { requireUser }: { requireUser: boolean },
): Promise<Guarded<T>> {
  if (!isDbConfigured) return { response: fail("La comunidad no está disponible: falta DATABASE_URL.", 503) };
  if (!sameOrigin(request)) return { response: fail("Origen no permitido.", 403) };
  if (rateLimited(`ip:${clientIp(request)}`)) return { response: fail("Demasiadas peticiones, espera un minuto.", 429) };
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return { response: fail("Petición demasiado grande.", 413) };

  const user = await getCurrentUser();
  if (requireUser && !user) return { response: fail("Necesitas iniciar sesión.", 401) };

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { response: fail(parsed.error.issues[0]?.message ?? "Datos inválidos.", 400) };
  }
  return { body: parsed.data, user };
}

export function logServerError(context: string, error: unknown) {
  console.error(`[api] ${context}`, error);
}
