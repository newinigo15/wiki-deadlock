/** Sobre JSON que devuelven todas las rutas de /api (ver src/lib/server/http.ts). */
interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Lee el sobre `{success,data,error}` de una respuesta de la API y devuelve `data`.
 * Acepta la promesa de `fetch` para cubrir también los fallos de red.
 * Lanza siempre un `Error` con un mensaje en español: el `error` del servidor si lo hay
 * o `fallback` si la respuesta no es un sobre válido (cuerpo vacío, HTML, red caída…).
 */
export async function readEnvelope<T>(response: Response | Promise<Response>, fallback: string): Promise<T> {
  let res: Response;
  try {
    res = await response;
  } catch (cause) {
    throw new Error(fallback, { cause });
  }
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !json?.success) {
    throw new Error(typeof json?.error === "string" && json.error ? json.error : fallback);
  }
  return json.data as T;
}
