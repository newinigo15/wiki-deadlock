import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
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
/** Límite fino por cliente identificado (IP de confianza o usuario con sesión). */
export const MAX_REQUESTS_PER_WINDOW = 30;
/**
 * Tope anti-flood para la clave común `sin-proxy`: la comparten todos los clientes, así que
 * debe ser alto para que uno solo no deje sin servicio al resto con unas pocas decenas de peticiones.
 */
export const MAX_SHARED_REQUESTS_PER_WINDOW = 600;
const MAX_TRACKED_KEYS = 10_000;
const MAX_BODY_BYTES = 64 * 1024;
const hits = new Map<string, { count: number; resetAt: number }>();

function pruneExpired(now: number) {
  for (const [key, entry] of hits) if (entry.resetAt < now) hits.delete(key);
}

/** Limitador en memoria de ventana fija (suficiente para una sola instancia). Cuenta la petición. */
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

/** Devuelve una unidad reservada con `rateLimited` (p.ej. un intento de login que no debe contar). */
export function releaseRateLimit(key: string): void {
  const entry = hits.get(key);
  if (entry && entry.count > 0) entry.count -= 1;
}

/** Olvida los intentos de una clave (p.ej. tras un login correcto). */
export function clearRateLimit(key: string): void {
  hits.delete(key);
}

if (process.env.NODE_ENV === "production" && process.env.TRUST_PROXY === undefined) {
  console.warn("[api] TRUST_PROXY no está definido: el rate limit usa un cubo común y es más fácil de saturar. Define TRUST_PROXY=1 tras un proxy de confianza.");
}

/** Clave común de rate limit cuando no hay un proxy de confianza que identifique al cliente. */
export const UNTRUSTED_CLIENT_KEY = "sin-proxy";

/**
 * IP del cliente. `x-forwarded-for` lo puede poner cualquiera, así que solo se usa si se declara
 * un proxy de confianza (`TRUST_PROXY=1`), y solo su último salto: el que añade ese proxy.
 * `x-real-ip` se ignora siempre: muchos proxies (Caddy, Traefik, Cloudflare) la reenvían tal cual
 * llega del cliente, que podría elegir su IP. Sin proxy se devuelve una clave común: el límite
 * pasa a ser global en vez de evadible.
 */
export function clientIp(request: Request): string {
  if (process.env.TRUST_PROXY !== "1") return UNTRUSTED_CLIENT_KEY;
  const hops = request.headers.get("x-forwarded-for")?.split(",").map((h) => h.trim()).filter(Boolean) ?? [];
  return hops.at(-1) ?? UNTRUSTED_CLIENT_KEY;
}

const LOGIN_FAILURES_PER_CLIENT = 5;
const LOGIN_FAILURES_PER_USERNAME = 50;
/** Sin proxy de confianza solo hay clave por usuario: más holgura para que no sea trivial bloquear una cuenta ajena. */
const LOGIN_FAILURES_PER_USERNAME_UNTRUSTED = 20;
export const LOGIN_WINDOW_MS = 15 * 60_000;

/**
 * Claves de intentos fallidos de login. Con proxy de confianza se limita por usuario + IP
 * (un atacante desde otra IP no bloquea al dueño) y, más holgado, por usuario solo para frenar
 * la fuerza bruta distribuida. Sin proxy solo queda la clave por usuario.
 */
export function loginLimitKeys(request: Request, username: string): { key: string; max: number }[] {
  const ip = clientIp(request);
  if (ip === UNTRUSTED_CLIENT_KEY) return [{ key: `login:${username}`, max: LOGIN_FAILURES_PER_USERNAME_UNTRUSTED }];
  return [
    { key: `login:${username}:${ip}`, max: LOGIN_FAILURES_PER_CLIENT },
    { key: `login:${username}`, max: LOGIN_FAILURES_PER_USERNAME },
  ];
}

type BodyResult = { tooLarge: true } | { tooLarge: false; json: unknown };

/**
 * Lee el cuerpo en streaming y corta en cuanto supera `maxBytes`, venga o no `content-length`
 * (con `Transfer-Encoding: chunked` no llega). Un JSON inválido se devuelve como `null`.
 */
export async function readJsonLimited(request: Request, maxBytes = MAX_BODY_BYTES): Promise<BodyResult> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return { tooLarge: true };
  if (!request.body) return { tooLarge: false, json: null };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return { tooLarge: true };
      }
      chunks.push(value);
    }
  } catch {
    return { tooLarge: false, json: null };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { tooLarge: false, json: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { tooLarge: false, json: null };
  }
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

function tooManyRequests() {
  return fail("Demasiadas peticiones, espera un minuto.", 429);
}

type Guarded<T> =
  | { response: NextResponse; body?: undefined; user?: undefined }
  | { response?: undefined; body: T; user: SessionUser | null };

/** Comprobaciones comunes de las rutas de escritura: BD, origen, límite, sesión y validación. */
export async function guardMutation<T>(
  request: Request,
  schema: ZodType<T>,
  { requireUser }: { requireUser: boolean },
): Promise<Guarded<T>> {
  if (!isDbConfigured) return { response: fail("La comunidad no está disponible: falta DATABASE_URL.", 503) };
  if (!sameOrigin(request)) return { response: fail("Origen no permitido.", 403) };
  const ip = clientIp(request);
  const untrusted = ip === UNTRUSTED_CLIENT_KEY;
  // Sin proxy de confianza el cubo es común: las peticiones sin Origin (no vienen de un navegador)
  // no lo consumen, para que un script de peticiones basura no deje sin escrituras a todos.
  const countsInBucket = !untrusted || request.headers.has("origin");
  const ipMax = untrusted ? MAX_SHARED_REQUESTS_PER_WINDOW : MAX_REQUESTS_PER_WINDOW;
  if (countsInBucket && rateLimited(`ip:${ip}`, ipMax)) return { response: tooManyRequests() };
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return { response: fail("Petición demasiado grande.", 413) };

  let user: SessionUser | null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    logServerError("guardMutation getCurrentUser", error);
    return { response: fail(COMMUNITY_UNAVAILABLE, 503) };
  }
  if (requireUser && !user) return { response: fail("Necesitas iniciar sesión.", 401) };
  // Límite fino por cuenta: no depende de la IP, así que funciona también sin proxy de confianza.
  if (user && rateLimited(`user:${user.id}`)) return { response: tooManyRequests() };

  const body = await readJsonLimited(request);
  if (body.tooLarge) return { response: fail("Petición demasiado grande.", 413) };
  const parsed = schema.safeParse(body.json);
  if (!parsed.success) {
    return { response: fail(parsed.error.issues[0]?.message ?? "Datos inválidos.", 400) };
  }
  return { body: parsed.data, user };
}

export function logServerError(context: string, error: unknown) {
  console.error(`[api] ${context}`, error);
}

export const COMMUNITY_UNAVAILABLE = "La comunidad no está disponible en este momento. Inténtalo más tarde.";

/** Códigos de Prisma que indican que la BD no responde (no un fallo de la petición). */
const DB_UNAVAILABLE_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

/** Indica si el error se debe a que la base de datos no está accesible. */
export function isDbUnavailable(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError && DB_UNAVAILABLE_CODES.has(error.code))
  );
}

/** Registra el error y responde 503 si la BD no está accesible o 500 con `message` en otro caso. */
export function serverError(context: string, error: unknown, message: string) {
  logServerError(context, error);
  return isDbUnavailable(error) ? fail(COMMUNITY_UNAVAILABLE, 503) : fail(message, 500);
}
