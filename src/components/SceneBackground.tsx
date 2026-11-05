"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { FALLBACK_CLASS, SceneBoundary } from "./SceneBoundary";
import { hasWebGL, resolveSceneMode, type SceneMode } from "@/lib/sceneMode";

const CityMapScene = dynamic(() => import("./CityMapScene"), {
  ssr: false,
  loading: () => <div className={FALLBACK_CLASS} />,
});

export function SceneBackground({ blurred }: { blurred: boolean }) {
  const [mode, setMode] = useState<SceneMode>("checking");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMode(resolveSceneMode(hasWebGL(), mq.matches));
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 transition-[filter] duration-500"
      style={{ filter: blurred ? "blur(10px) brightness(0.6)" : "none" }}
    >
      {mode === "animated" ? (
        <SceneBoundary>
          <CityMapScene animate onContextLost={() => setMode("static")} />
        </SceneBoundary>
      ) : (
        <div className={FALLBACK_CLASS} />
      )}
    </div>
  );
}
