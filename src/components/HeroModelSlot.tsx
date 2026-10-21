"use client";

import dynamic from "next/dynamic";

const HeroModelViewer = dynamic(() => import("./HeroModelViewer"), {
  ssr: false,
  loading: () => <div className="glass h-80 animate-pulse rounded-xl" />,
});

export function HeroModelSlot(props: { accent: string; name: string }) {
  return <HeroModelViewer {...props} />;
}
