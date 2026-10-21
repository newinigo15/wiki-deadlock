"use client";

import { useVideoFallback } from "./useVideoFallback";
import type { Hero } from "@/data/types";
import { HeroPortrait } from "./HeroPortrait";

/**
 * Clip .webm en bucle (con canal alfa) desde /public/clips/<slug>.webm.
 * Si el archivo no existe, se muestra el retrato estilizado.
 */
export function HeroClip({ hero, playing = true, className = "" }: { hero: Hero; playing?: boolean; className?: string }) {
  const { ref, failed, onError } = useVideoFallback();
  if (failed || !playing) return <HeroPortrait hero={hero} className={className} />;
  return (
    <video
      ref={ref}
      className={className}
      src={`/clips/${hero.slug}.webm`}
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      onError={onError}
      aria-label={`Animación de ${hero.name}`}
    />
  );
}
