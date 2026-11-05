"use client";

import { Component, type ReactNode } from "react";

export const FALLBACK_CLASS = "h-full w-full bg-[radial-gradient(circle_at_50%_40%,#2a1d10,#0c0a08_60%)]";

/** Si la escena lanza un error, se muestra el gradiente en vez de tumbar la página. */
export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("[SceneBackground] escena desactivada:", error);
  }
  render() {
    return this.state.failed ? <div className={FALLBACK_CLASS} /> : this.props.children;
  }
}
