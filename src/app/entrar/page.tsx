import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 pt-16">
      <h1 className="mb-6 font-display text-3xl uppercase tracking-wider">Tu cuenta</h1>
      <AuthForm />
    </main>
  );
}
