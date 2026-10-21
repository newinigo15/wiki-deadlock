"use client";

import { useState } from "react";
import { BASES, GANK_HOTSPOTS, GANK_ROUTES, GOLDEN_STATUES, LANES, MID_BOSS, SOUL_BOXES, WALKERS, type Point } from "@/data/map";

const LAYERS = [
  { id: "heat", label: "Mapa de calor de gankeos", color: "#e25b4b" },
  { id: "routes", label: "Rutas de gankeo", color: "#e0892f" },
  { id: "boxes", label: "Cajas de almas", color: "#7fd1c7" },
  { id: "statues", label: "Estatuas doradas", color: "#c8a25a" },
  { id: "vision", label: "Visión de Caminantes", color: "#5cc8ff" },
] as const;
type LayerId = (typeof LAYERS)[number]["id"];

const toPath = (pts: Point[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");

export function HeatMap() {
  const [active, setActive] = useState<Record<LayerId, boolean>>({ heat: true, routes: true, boxes: true, statues: true, vision: false });
  const [hint, setHint] = useState("Pasa el cursor (o enfoca) un marcador para ver detalles.");

  const marker = (key: string, p: Point, label: string, node: React.ReactNode) => (
    <g key={key} tabIndex={0} role="img" aria-label={label} onMouseEnter={() => setHint(label)} onFocus={() => setHint(label)} className="cursor-help outline-none">
      {node}
    </g>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="glass overflow-hidden rounded-xl p-2">
        <svg viewBox="0 0 100 100" className="mx-auto aspect-square max-h-[75vh] w-full" role="group" aria-label="Mapa interactivo">
          <defs>
            <radialGradient id="heat">
              <stop offset="0%" stopColor="#e25b4b" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#e0892f" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#e0892f" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="#15120e" />
          {LANES.map((lane) => (
            <path key={lane.id} d={toPath(lane.path)} fill="none" stroke="#3a3128" strokeWidth="4" strokeLinecap="round" />
          ))}
          {BASES.map((b) => <circle key={b.team} cx={b.point.x} cy={b.point.y} r="4" fill="#2a241c" stroke="#a89c86" strokeWidth="0.5" />)}
          {active.heat && GANK_HOTSPOTS.map((h, i) => (
            <circle key={i} cx={h.x} cy={h.y} r={8 + h.intensity * 8} fill="url(#heat)" opacity={0.4 + h.intensity * 0.6} style={{ mixBlendMode: "screen" }} />
          ))}
          {active.routes && GANK_ROUTES.map((r, i) => (
            <path key={i} d={toPath(r)} fill="none" stroke="#e0892f" strokeWidth="0.8" strokeDasharray="2 1.5" markerEnd="" />
          ))}
          {active.vision && WALKERS.map((w, i) =>
            marker(`w${i}`, w, w.label, <>
              <circle cx={w.x} cy={w.y} r={w.radius} fill="#5cc8ff" fillOpacity="0.1" stroke="#5cc8ff" strokeWidth="0.4" strokeDasharray="1 1" />
              <rect x={w.x - 1.5} y={w.y - 1.5} width="3" height="3" fill="#5cc8ff" />
            </>),
          )}
          {active.boxes && SOUL_BOXES.map((b, i) => marker(`b${i}`, b, b.label, <rect x={b.x - 1.4} y={b.y - 1.4} width="2.8" height="2.8" fill="#7fd1c7" transform={`rotate(45 ${b.x} ${b.y})`} />))}
          {active.statues && GOLDEN_STATUES.map((s, i) => marker(`s${i}`, s, s.label, <circle cx={s.x} cy={s.y} r="1.8" fill="#c8a25a" stroke="#0c0a08" strokeWidth="0.4" />))}
          {marker("boss", MID_BOSS, MID_BOSS.label, <circle cx={MID_BOSS.x} cy={MID_BOSS.y} r="2.6" fill="#9b6cf0" stroke="#e8dcc4" strokeWidth="0.4" />)}
          {active.heat && GANK_HOTSPOTS.map((h, i) => marker(`h${i}`, h, `Zona de gankeo: ${h.label}`, <circle cx={h.x} cy={h.y} r="3" fill="transparent" />))}
        </svg>
      </div>
      <aside className="space-y-3">
        <fieldset className="glass rounded-xl p-4">
          <legend className="px-1 text-xs uppercase tracking-widest text-brass">Capas</legend>
          {LAYERS.map((l) => (
            <label key={l.id} className="flex items-center gap-2 py-1 text-sm">
              <input type="checkbox" checked={active[l.id]} onChange={(e) => setActive((prev) => ({ ...prev, [l.id]: e.target.checked }))} />
              <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
              {l.label}
            </label>
          ))}
        </fieldset>
        <p aria-live="polite" className="glass rounded-xl p-4 text-sm">{hint}</p>
        <p className="text-xs text-muted">Esquema ilustrativo: las posiciones son aproximadas y se actualizan con los datos de cada parche.</p>
      </aside>
    </div>
  );
}
