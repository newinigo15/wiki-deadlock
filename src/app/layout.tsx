import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const body = Inter({ variable: "--font-body", subsets: ["latin"] });
const display = Oswald({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Deadlock Wiki — Héroes, builds y guías", template: "%s · Deadlock Wiki" },
  description: "La wiki de Deadlock rápida y sin anuncios: héroes, generador de builds, objetos, mecánicas avanzadas y mapa interactivo.",
  openGraph: { type: "website", siteName: "Deadlock Wiki", locale: "es_ES" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${body.variable} ${display.variable} grain min-h-dvh antialiased`}>
        <SiteHeader />
        {children}
        <footer className="mx-auto mt-24 max-w-6xl border-t border-line px-4 py-8 text-sm text-muted">
          Wiki de fans no oficial. Deadlock es una marca de Valve Corporation. Las estadísticas son aproximadas y se revisan en cada parche.
        </footer>
      </body>
    </html>
  );
}
