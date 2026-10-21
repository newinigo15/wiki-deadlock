"use client";

import { useVideoFallback } from "./useVideoFallback";

/** Clip corto en bucle junto al texto (Picture-in-Picture). Sin archivo, muestra un marcador. */
export function PipClip({ name, label }: { name: string; label: string }) {
  const { ref, failed, onError } = useVideoFallback();
  return (
    <figure className="glass w-full overflow-hidden rounded-lg sm:w-56 sm:shrink-0">
      {failed ? (
        <div className="flex aspect-video items-center justify-center bg-[repeating-linear-gradient(45deg,#15120e,#15120e_8px,#1c1712_8px,#1c1712_16px)] text-xs text-muted">
          Clip «{name}.webm» pendiente
        </div>
      ) : (
        <video
          ref={ref}
          className="aspect-video w-full object-cover"
          src={`/clips/${name}.webm`}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onError={onError}
        />
      )}
      <figcaption className="px-3 py-2 text-xs text-muted">{label}</figcaption>
    </figure>
  );
}
