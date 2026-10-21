"use client";

import dynamic from "next/dynamic";

const PatronScene = dynamic(() => import("./PatronScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[radial-gradient(circle_at_50%_40%,#2a1d10,#0c0a08_60%)]" />,
});

export function SceneBackground({ blurred }: { blurred: boolean }) {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 transition-[filter] duration-500"
      style={{ filter: blurred ? "blur(10px) brightness(0.6)" : "none" }}
    >
      <PatronScene />
    </div>
  );
}
