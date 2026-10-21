import type { Metadata } from "next";
import { BuildGenerator } from "@/components/builder/BuildGenerator";

export const metadata: Metadata = {
  title: "Generador de Builds (Theorycrafting)",
  description: "Arrastra objetos de Arma, Vitalidad y Espíritu a tus espacios y calcula al instante el DPS, la salud y el poder espiritual.",
  alternates: { canonical: "/builds" },
};

type Search = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function BuildsPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const items = first(params.items).split(",").filter(Boolean).slice(0, 16);
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="font-display text-4xl uppercase tracking-wider">Generador de Builds</h1>
      <p className="mb-6 mt-2 text-muted">
        Arrastra objetos (o pulsa sobre ellos) a los 4 espacios de cada categoría. Marca los objetivos destruidos para desbloquear los Flex Slots.
      </p>
      <BuildGenerator initialHero={first(params.hero)} initialItems={items} initialFlex={Number(first(params.flex)) || 0} />
    </main>
  );
}
