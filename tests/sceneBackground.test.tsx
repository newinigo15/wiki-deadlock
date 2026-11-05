import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SceneBoundary, FALLBACK_CLASS } from "@/components/SceneBoundary";
import { hasWebGL, resolveFrameloop, resolveSceneMode } from "@/lib/sceneMode";

const doc = (ctx: Record<string, unknown>) =>
  ({ createElement: () => ({ getContext: (k: string) => ctx[k] ?? null }) }) as unknown as Document;

describe("fondo: sin WebGL", () => {
  it("detecta ausencia de WebGL y usa modo estático", () => {
    expect(hasWebGL(doc({}))).toBe(false);
    expect(hasWebGL(doc({ webgl: {} }))).toBe(true);
    expect(hasWebGL({ createElement: () => { throw new Error("x"); } } as unknown as Document)).toBe(false);
    expect(resolveSceneMode(false, false)).toBe("static");
  });
});

describe("fondo: error boundary", () => {
  it("convierte un error en fallback sin propagar", () => {
    expect(SceneBoundary.getDerivedStateFromError()).toEqual({ failed: true });
    const b = new SceneBoundary({ children: null });
    b.state = { failed: true };
    expect(renderToStaticMarkup(b.render() as React.ReactElement)).toContain(FALLBACK_CLASS.split(" ")[0]);
  });
  it("registra el error con warn, no lo relanza", () => {
    const w = vi.spyOn(console, "warn").mockImplementation(() => {});
    new SceneBoundary({ children: null }).componentDidCatch(new Error("boom"));
    expect(w).toHaveBeenCalled();
    w.mockRestore();
  });
});

describe("fondo: prefers-reduced-motion", () => {
  it("reduced-motion → estático y sin animación continua", () => {
    expect(resolveSceneMode(true, true)).toBe("static");
    expect(resolveSceneMode(true, false)).toBe("animated");
    expect(resolveFrameloop(false, true)).toBe("demand");
    expect(resolveFrameloop(true, true)).toBe("always");
    expect(resolveFrameloop(true, false)).toBe("never");
  });
});

describe("fondo: integración del mapa", () => {
  it("SceneBackground renderiza CityMapScene (no PatronScene)", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/components/SceneBackground.tsx", "utf8");
    expect(src).toContain('import("./CityMapScene")');
    expect(src).not.toContain("PatronScene");
    expect(src).toMatch(/<SceneBoundary>\s*<CityMapScene[^>]*onContextLost/);
  });
});
