import { heroesBySlug } from "@/data/heroes";
import { prisma } from "@/lib/server/db";
import { fetchHeroBuilds } from "@/lib/server/community";
import { fail, guardMutation, logServerError, ok } from "@/lib/server/http";
import { ensureCurrentPatch } from "@/lib/server/patch";
import { buildSchema } from "@/lib/server/schemas";

export async function GET(request: Request) {
  const hero = new URL(request.url).searchParams.get("hero") ?? "";
  if (!heroesBySlug[hero]) return fail("Héroe desconocido.", 400);
  const result = await fetchHeroBuilds(hero);
  if (!result) return fail("La comunidad no está disponible.", 503);
  return ok({
    signedIn: Boolean(result.user),
    builds: result.builds.map((b) => ({
      id: b.id,
      title: b.title,
      items: b.items,
      flexSlots: b.flexSlots,
      score: b.score,
      myVote: b.votes?.[0]?.value ?? 0,
      author: b.author.username,
      patch: b.patch.name,
      comments: b.comments.map((c) => ({ id: c.id, body: c.body, user: { username: c.user.username } })),
    })),
  });
}

export async function POST(request: Request) {
  const guard = await guardMutation(request, buildSchema, { requireUser: true });
  if (guard.response) return guard.response;
  try {
    const patch = await ensureCurrentPatch();
    const build = await prisma.build.create({
      data: { ...guard.body, patchId: patch.id, authorId: guard.user!.id },
      select: { id: true, heroSlug: true },
    });
    return ok(build, 201);
  } catch (error) {
    logServerError("create build", error);
    return fail("No se pudo guardar la build.", 500);
  }
}
