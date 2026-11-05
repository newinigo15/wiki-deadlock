export type SceneMode = "checking" | "static" | "animated";

/** Decide el modo del fondo: sin WebGL o con reduced-motion → fallback estático. */
export function resolveSceneMode(webgl: boolean, reducedMotion: boolean): SceneMode {
  return !webgl || reducedMotion ? "static" : "animated";
}

/** Frameloop de R3F: sin animación se renderiza un único frame bajo demanda. */
export function resolveFrameloop(animate: boolean, visible: boolean): "always" | "demand" | "never" {
  if (!visible) return "never";
  return animate ? "always" : "demand";
}

export function hasWebGL(doc: Pick<Document, "createElement"> = document): boolean {
  try {
    const canvas = doc.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
