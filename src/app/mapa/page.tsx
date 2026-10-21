import type { Metadata } from "next";
import { HeatMap } from "@/components/HeatMap";

export const metadata: Metadata = {
  title: "Mapa interactivo y mapa de calor",
  description: "Rutas de gankeo más comunes, cajas de almas, estatuas doradas y el rango de visión de los Caminantes en Deadlock.",
  alternates: { canonical: "/mapa" },
};

export default function MapPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="font-display text-4xl uppercase tracking-wider">Mapa de Calor</h1>
      <p className="mb-6 mt-2 text-muted">Activa capas para ver por dónde llegan los gankeos, dónde farmear cajas y estatuas, y qué cubre la visión de los Caminantes.</p>
      <HeatMap />
    </main>
  );
}
