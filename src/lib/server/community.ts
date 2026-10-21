import { isDbConfigured, prisma } from "./db";
import { getCurrentUser } from "./auth";

/** Lecturas de comunidad para páginas de servidor; devuelven null si la BD no está disponible. */
export async function fetchHeroBuilds(heroSlug: string) {
  if (!isDbConfigured) return null;
  try {
    const user = await getCurrentUser();
    const builds = await prisma.build.findMany({
      where: { heroSlug },
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: 10,
      include: {
        author: { select: { username: true } },
        patch: { select: { name: true } },
        votes: user ? { where: { userId: user.id }, select: { value: true } } : false,
        comments: { orderBy: { createdAt: "asc" }, take: 20, include: { user: { select: { username: true } } } },
      },
    });
    return { user, builds };
  } catch (error) {
    console.error("[community] fetchHeroBuilds", error);
    return null;
  }
}

export async function fetchGuides() {
  if (!isDbConfigured) return null;
  try {
    const user = await getCurrentUser();
    const guides = await prisma.guide.findMany({
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: 50,
      include: {
        author: { select: { username: true } },
        patch: { select: { name: true } },
        votes: user ? { where: { userId: user.id }, select: { value: true } } : false,
      },
    });
    return { user, guides };
  } catch (error) {
    console.error("[community] fetchGuides", error);
    return null;
  }
}

export async function fetchGuide(id: string) {
  if (!isDbConfigured) return null;
  try {
    const user = await getCurrentUser();
    const guide = await prisma.guide.findUnique({
      where: { id },
      include: {
        author: { select: { username: true } },
        patch: { select: { name: true } },
        votes: user ? { where: { userId: user.id }, select: { value: true } } : false,
      },
    });
    return { user, guide };
  } catch (error) {
    console.error("[community] fetchGuide", error);
    return null;
  }
}
