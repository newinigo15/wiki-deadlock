import type { MetadataRoute } from "next";
import { CURRENT_PATCH, heroes } from "@/data/heroes";
import { guides } from "@/data/guides";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/heroes", "/builds", "/objetos", "/guias", "/mapa", "/comunidad"];
  return [
    ...staticPaths.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...heroes.flatMap((h) => [
      { url: `${SITE_URL}/heroes/${h.slug}` },
      { url: `${SITE_URL}/heroes/${h.slug}/build-${CURRENT_PATCH.slug}` },
    ]),
    ...guides.map((g) => ({ url: `${SITE_URL}/guias/${g.slug}` })),
  ];
}
