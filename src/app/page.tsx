import Link from "next/link";
import { heroes } from "@/data/heroes";
import { guides } from "@/data/guides";
import { HomeHub } from "@/components/HomeHub";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";

const TOOLS = [
  { href: "/builds", title: "Generador de Builds", text: "Arrastra objetos a tus espacios y mira tu DPS, salud y poder espiritual al instante." },
  { href: "/mapa", title: "Mapa de Calor", text: "Rutas de gankeo, cajas y estatuas doradas, y la visión de los Caminantes." },
  { href: "/objetos", title: "Objetos y Counters", text: "Qué comprar contra cada amenaza: curación, magos, CC y héroes aéreos." },
];

export default function Home() {
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Deadlock Wiki",
          url: SITE_URL,
          inLanguage: "es",
        }}
      />
      <HomeHub heroes={heroes} />

      <section className="mx-auto mt-16 grid max-w-6xl gap-4 px-4 md:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="glass rounded-xl p-5 transition-colors hover:border-brass/50">
            <h2 className="font-display text-lg uppercase tracking-wider text-brass">{tool.title}</h2>
            <p className="mt-2 text-sm text-muted">{tool.text}</p>
          </Link>
        ))}
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <h2 className="mb-4 font-display text-xl uppercase tracking-[0.2em]">Guías esenciales</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guides.slice(0, 6).map((g) => (
            <li key={g.slug}>
              <Link href={`/guias/${g.slug}`} className="glass block h-full rounded-xl p-4 hover:border-brass/50">
                <span className="text-[10px] uppercase tracking-widest text-brass">{g.category}</span>
                <span className="mt-1 block font-medium">{g.title}</span>
                <span className="mt-1 block text-sm text-muted">{g.excerpt}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
