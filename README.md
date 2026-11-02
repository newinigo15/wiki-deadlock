# Deadlock Wiki

Wiki de fans de **Deadlock** rápida, sin anuncios e interactiva: héroes, generador de builds, objetos, mecánicas avanzadas, mapa de calor y guías de la comunidad con votos.

## Stack

- **Next.js 15** (App Router, SSR/SSG para SEO) + **React 19** + TypeScript
- **Tailwind CSS 4** + **Framer Motion** (transiciones sin pantallas de carga)
- **React Three Fiber / Three.js** (fondo 3D del núcleo «Patron» y visor de modelos con hitboxes)
- **PostgreSQL + Prisma** (parches de balance, builds, guías, votos, comentarios, usuarios)
- **Vitest** (lógica de slots, calculadora de builds, búsqueda e integridad de datos)

## Funcionalidades

| Sección | Ruta | Qué incluye |
|---|---|---|
| Inicio | `/` | Fondo 3D con parallax, interfaz glassmorphism, buscador inteligente, rejilla de héroes con hover (desenfoque + clip) y expansión animada de la tarjeta |
| Héroes | `/heroes`, `/heroes/[slug]` | Cabecera con clip, dificultad y roles; spider chart; habilidades con clip PiP e «Imbuir»; ruta de progresión; objetos core; matchups; visor 3D con hitboxes y animaciones (parry, melee, recarga); builds de la comunidad con votos y comentarios |
| Build por parche | `/heroes/[slug]/build-parche-1` | URL amigable para SEO con la build recomendada y sus estadísticas |
| Generador de builds | `/builds` | Tienda Arma / Vitalidad / Espíritu, arrastrar y soltar (o pulsar), 4 espacios por categoría + 4 Flex Slots desbloqueables por objetivos, cálculo en vivo de DPS, salud, poder espiritual, resistencias y coste; enlace compartible; publicar en la comunidad |
| Objetos | `/objetos` | Catálogo por categoría con coste, efecto y counters |
| Guías | `/guias/[slug]` | Almas y deny, Dash-Jump y slide, parry, Flex Slots, Urna, Jefe Central, estatuas, counters, mejores objetos para Seven |
| Mapa | `/mapa` | Mapa de calor de gankeos, rutas, cajas, estatuas doradas y visión de los Caminantes (capas activables) |
| Comunidad | `/comunidad`, `/entrar` | Cuentas, guías de usuarios y votos estilo Reddit |

SEO: metadatos por página, `canonical`, `sitemap.xml`, `robots.txt` y datos estructurados (FAQPage con la salud base de cada héroe, Article para guías).

## Puesta en marcha

```bash
npm install
cp .env.example .env
docker compose up -d          # PostgreSQL local en el puerto 5433
npm run db:migrate            # aplica las migraciones
npm run db:seed               # crea el parche actual
npm run dev                   # http://localhost:3000
```

Sin `DATABASE_URL` la wiki funciona igual; solo se desactivan las secciones de comunidad.

```bash
npm test        # tests unitarios
npm run lint
npm run build
```

## Contenido y recursos

- Datos editables en `src/data/` (`heroes.ts`, `items.ts`, `guides.ts`, `map.ts`). Las estadísticas son **aproximadas** y deben revisarse con cada parche.
- Clips en bucle: añade `.webm` (con canal alfa) en `public/clips/` — `<heroe>.webm` para la tarjeta/cabecera, `<heroe>-<n>.webm` para cada habilidad y los nombres indicados en `guides.ts` (`dash-jump`, `slide`, `parry`, …). Si falta un clip se muestra un marcador.
- Modelos 3D: el visor usa una figura de referencia; los `.glb` irán en `public/models/`.

## Seguridad

Contraseñas con scrypt, sesiones en base de datos (solo se guarda el hash del token), cookie `httpOnly` + `SameSite=Lax`, comprobación de origen en escrituras, limitación de peticiones por IP y validación con Zod. El contenido de usuarios se renderiza como texto. Los cuerpos de escritura se leen en streaming y se cortan a 64 KB (413), aunque no venga `content-length`.

**Rate limit e IP del cliente.** Cualquier cliente puede falsear las cabeceras `X-Real-IP` y `X-Forwarded-For`, así que por defecto se ignoran y todas las peticiones comparten un tope anti-flood alto (600 escrituras/min en total); además, cada usuario con sesión tiene su propio límite de 30 escrituras/min. El login solo cuenta intentos **fallidos** (5 por usuario cada 15 min; con `TRUST_PROXY=1`, 5 por usuario + IP y 50 por usuario en total). Si despliegas detrás de un proxy inverso que **añade** la IP real al final de `X-Forwarded-For` (nginx con `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`, Vercel, Caddy, Traefik, etc.), define `TRUST_PROXY=1` para limitar por IP: se usa solo el último salto de esa cabecera. `X-Real-IP` se ignora siempre, porque muchos proxies la reenvían tal cual la manda el cliente. No lo actives si la app queda expuesta directamente (`next start` sin proxy).

Wiki de fans no oficial. Deadlock es una marca de Valve Corporation.
