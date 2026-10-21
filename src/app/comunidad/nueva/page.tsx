import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GuideForm } from "@/components/GuideForm";
import { getCurrentUser } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Nueva guía", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewGuidePage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/entrar");
  return (
    <main className="mx-auto max-w-3xl px-4 pt-10">
      <h1 className="mb-6 font-display text-3xl uppercase tracking-wider">Nueva guía</h1>
      <GuideForm />
    </main>
  );
}
