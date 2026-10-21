import { castVote } from "@/lib/server/votes";
import { fail, guardMutation, logServerError, ok } from "@/lib/server/http";
import { voteSchema } from "@/lib/server/schemas";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardMutation(request, voteSchema, { requireUser: true });
  if (guard.response) return guard.response;
  try {
    const score = await castVote("guide", (await params).id, guard.user!.id, guard.body.value);
    return score === null ? fail("Guía no encontrada.", 404) : ok({ score, myVote: guard.body.value });
  } catch (error) {
    logServerError("vote guide", error);
    return fail("No se pudo registrar el voto.", 500);
  }
}
