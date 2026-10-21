export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const NAV_LINKS = [
  { href: "/heroes", label: "Héroes" },
  { href: "/builds", label: "Generador de Builds" },
  { href: "/objetos", label: "Objetos" },
  { href: "/guias", label: "Guías" },
  { href: "/mapa", label: "Mapa" },
  { href: "/comunidad", label: "Comunidad" },
] as const;

export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString("es-ES", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function formatPct(n: number): string {
  return `${formatNumber(n * 100, 0)}%`;
}
