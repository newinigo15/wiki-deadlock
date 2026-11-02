import { describe, expect, it } from "vitest";
import { readEnvelope } from "@/lib/apiClient";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("readEnvelope", () => {
  it("devuelve data cuando success es true", async () => {
    await expect(readEnvelope(json({ success: true, data: { id: "g1" }, error: null }), "x")).resolves.toEqual({ id: "g1" });
  });

  it("propaga el error del servidor", async () => {
    await expect(readEnvelope(json({ success: false, data: null, error: "Necesitas iniciar sesión." }, 401), "x"))
      .rejects.toThrow("Necesitas iniciar sesión.");
  });

  it("usa el fallback con un 500 de cuerpo vacío", async () => {
    await expect(readEnvelope(new Response(null, { status: 500 }), "No se pudo publicar.")).rejects.toThrow("No se pudo publicar.");
  });

  it("usa el fallback si la respuesta no es OK aunque traiga success", async () => {
    await expect(readEnvelope(json({ success: true, data: null, error: null }, 502), "Fallo.")).rejects.toThrow("Fallo.");
  });

  it("usa el fallback si fetch falla por red", async () => {
    await expect(readEnvelope(Promise.reject(new TypeError("Failed to fetch")), "Sin conexión.")).rejects.toThrow("Sin conexión.");
  });
});
