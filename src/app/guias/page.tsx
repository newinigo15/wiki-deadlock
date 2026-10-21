import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "@/data/guides";

export const metadata: Metadata = {
  title: "Guías y mecánicas avanzadas",
  description: "Sistema de almas y deny, Dash-Jump, slide, parry, Flex Slots, Urna de Almas, Jefe Central y más.",
  alternates: { canonical: "/guias" },
};

export default function GuidesPage() {
  const categories = [...new Set(guides.map((g) => g.category))];
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="font-display text-4xl uppercase tracking-wider">Guías</h1>
      <p className="mt-2 text-muted">Lo que separa a los novatos de los jugadores de alto nivel. También puedes leer las <Link href="/comunidad" className="underline">guías de la comunidad</Link>.</p>
      {categories.map((category) => (
        <section key={category} className="mt-8">
          <h2 className="mb-3 font-display text-xl uppercase tracking-[0.2em] text-brass">{category}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guides.filter((g) => g.category === category).map((g) => (
              <li key={g.slug}>
                <Link href={`/guias/${g.slug}`} className="glass block h-full rounded-xl p-4 hover:border-brass/50">
                  <span className="font-medium">{g.title}</span>
                  <span className="mt-1 block text-sm text-muted">{g.excerpt}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
