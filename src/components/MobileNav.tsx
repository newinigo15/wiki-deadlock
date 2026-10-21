"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
        className="rounded border border-line px-3 py-1 text-sm"
      >
        Menú
      </button>
      {open && (
        <nav id="mobile-nav" aria-label="Móvil" className="glass absolute inset-x-0 top-14 flex flex-col p-4">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="py-2 text-parchment">
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
