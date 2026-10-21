"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Detecta si un <video> no tiene fuente disponible. Cubre también el caso en que el error
 * ocurre antes de la hidratación (cuando React aún no ha registrado onError).
 */
export function useVideoFallback() {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el && (el.error || el.networkState === HTMLMediaElement.NETWORK_NO_SOURCE)) setFailed(true);
  }, []);

  return { ref, failed, onError: () => setFailed(true) };
}
