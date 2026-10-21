import type { Hero } from "@/data/types";
import { formatNumber, SITE_URL } from "./site";

/** FAQ estructurada para que Google muestre los valores exactos ("Salud base de Abrams"). */
export function heroFaqSchema(hero: Hero) {
  const qa = (q: string, a: string) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } });
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${SITE_URL}/heroes/${hero.slug}`,
    mainEntity: [
      qa(`¿Cuál es la salud base de ${hero.name} en Deadlock?`, `${hero.name} tiene ${formatNumber(hero.base.health)} de salud base.`),
      qa(`¿Cuánto DPS base tiene ${hero.name}?`, `Aproximadamente ${formatNumber(hero.base.bulletDamage * hero.base.fireRate, 1)} de daño por segundo con su arma, con un cargador de ${hero.base.magazine} balas.`),
      qa(`¿Qué objetos comprar con ${hero.name}?`, `Objetos core: ${hero.coreItems.join(", ")}.`),
      qa(`¿Qué rol tiene ${hero.name}?`, `${hero.title}: ${hero.roles.join(", ")}.`),
    ],
  };
}
