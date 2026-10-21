import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 pt-24 text-center">
      <h1 className="font-display text-5xl uppercase tracking-wider">404</h1>
      <p className="mt-3 text-muted">Esta calle no lleva a ninguna parte.</p>
      <Link href="/" className="mt-6 inline-block text-brass underline">Volver al inicio</Link>
    </main>
  );
}
