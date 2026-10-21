import Link from "next/link";
import { NAV_LINKS } from "@/lib/site";
import { MobileNav } from "./MobileNav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-display text-lg uppercase tracking-[0.2em] text-parchment">
          Dead<span className="text-brass">lock</span> Wiki
        </Link>
        <nav aria-label="Principal" className="hidden gap-5 text-sm text-muted md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-parchment">
              {link.label}
            </Link>
          ))}
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
