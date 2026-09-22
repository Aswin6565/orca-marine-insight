import { useMemo, useState } from "react";
import type { PortDossier, LatLng } from "@/lib/orca-data";
import { cn } from "@/lib/utils";

interface Props {
  dossier: PortDossier;
  t: (k: string) => string;
  activePfzId?: string | undefined;
  onSelectPfz?: ((id: string) => void) | undefined;
}

const W = 760;
const H = 520;

export function MarineMap({ dossier, t, activePfzId, onSelectPfz }: Props) {
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const [layers, setLayers] = useState({ pfz: true, hazards: true, zones: true, route: true });

  const pts = useMemo(() => {
    const all: LatLng[] = [
      dossier.port.position,
      ...dossier.pfz.map((p) => p.center),
      ...dossier.hazards.map((h) => h.center),
      ...dossier.restricted.flatMap((r) => r.polygon),
      ...dossier.route,
    ];
    const lats = all.map((p) => p.lat);
    const lngs = all.map((p) => p.lng);
    const pad = 0.55;
    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLng: Math.min(...lngs) - pad,
      maxLng: Math.max(...lngs) + pad,
    };
  }, [dossier]);

  const project = (p: LatLng) => ({
    x: ((p.lng - pts.minLng) / (pts.maxLng - pts.minLng)) * W,
    y: H - ((p.lat - pts.minLat) / (pts.maxLat - pts.minLat)) * H,
  });

  const nmToPx = (nm: number) => (nm / 60 / (pts.maxLat - pts.minLat)) * H;
  const harbour = project(dossier.port.position);
  const routePath = dossier.route.map(project).map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const coastX = dossier.port.coast === "east" ? harbour.x : harbour.x;

  const severityFill = (s: string) =>
    s === "red" ? "var(--color-danger)" : s === "amber" ? "var(--color-caution)" : "var(--color-safe)";

  const toggle = (k: keyof typeof layers) => setLayers((l) => ({ ...l, [k]: !l[k] }));

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h3 className="font-display text-sm font-semibold">🗺️ {t("map")}</h3>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["pfz", "🎣 PFZ"],
              ["hazards", "⚠️ Hazards"],
              ["zones", "⛔ Zones"],
              ["route", "🚢 Route"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => toggle(k)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                layers[k]
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Marine situational map">
          <defs>
            <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-ocean-shelf)" />
              <stop offset="60%" stopColor="var(--color-ocean-mid)" />
              <stop offset="100%" stopColor="var(--color-ocean-deep)" />
            </linearGradient>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="var(--color-border)" strokeWidth="0.6" opacity="0.5" />
            </pattern>
            <pattern id="hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="var(--color-destructive)" strokeWidth="2.5" opacity="0.55" />
            </pattern>
          </defs>

          <rect width={W} height={H} fill="url(#sea)" />
          <rect width={W} height={H} fill="url(#grid)" />

          {/* Coastline + land mass on the landward side */}
          <path
            d={
              dossier.port.coast === "east"
                ? `M0,0 L${coastX - 40},0 C${coastX + 10},${H * 0.3} ${coastX - 30},${H * 0.7} ${coastX - 5},${H} L0,${H} Z`
                : `M${W},0 L${coastX + 40},0 C${coastX - 10},${H * 0.3} ${coastX + 30},${H * 0.7} ${coastX + 5},${H} L${W},${H} Z`
            }
            fill="var(--color-land)"
            opacity="0.9"
          />

          {/* Restricted zones */}
          {layers.zones &&
            dossier.restricted.map((z) => {
              const poly = z.polygon.map(project);
              const anchor = poly[0] ?? { x: 0, y: 0 };
              return (
                <g key={z.id}>
                  <polygon
                    points={poly.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill={z.kind === "shipping-lane" ? "var(--color-chart-5)" : "url(#hatch)"}
                    opacity={z.kind === "shipping-lane" ? 0.25 : 0.9}
                    stroke="var(--color-destructive)"
                    strokeDasharray="6 4"
                    strokeWidth="1.5"
                    onMouseEnter={(e) =>
                      setHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, text: `⛔ ${z.name} — ${z.note}` })
                    }
                    onMouseLeave={() => setHover(null)}
                  />
                  <text x={anchor.x + 4} y={anchor.y - 6} fontSize="10" fill="var(--color-foreground)" opacity="0.85">
                    {z.name}
                  </text>
                </g>
              );
            })}

          {/* Hazards */}
          {layers.hazards &&
            dossier.hazards.map((h) => {
              const c = project(h.center);
              return (
                <g key={h.id}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={Math.max(14, nmToPx(h.radiusNm))}
                    fill={severityFill(h.severity)}
                    opacity="0.16"
                    stroke={severityFill(h.severity)}
                    strokeWidth="1.5"
                  />
                  <circle cx={c.x} cy={c.y} r="5" fill={severityFill(h.severity)} />
                  <text
                    x={c.x + 9}
                    y={c.y + 4}
                    fontSize="11"
                    fill="var(--color-foreground)"
                    onMouseEnter={(e) =>
                      setHover({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, text: `${h.title} — ${h.detail}` })
                    }
                    onMouseLeave={() => setHover(null)}
                  >
                    {h.kind === "cyclone" ? "🌀" : h.kind === "lightning" ? "⚡" : h.kind === "fog" ? "🌫" : "🌊"}{" "}
                    {h.title.slice(0, 34)}
                  </text>
                </g>
              );
            })}

          {/* Route */}
          {layers.route && (
            <>
              <path d={routePath} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeDasharray="8 5" />
              {dossier.route.map((wp, i) => {
                const p = project(wp);
                return (
                  <g key={`${wp.label}-${i}`}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="var(--color-primary)"
                      onMouseEnter={(e) =>
                        setHover({
                          x: e.nativeEvent.offsetX,
                          y: e.nativeEvent.offsetY,
                          text: `${wp.label}${wp.note ? ` — ${wp.note}` : ""}`,
                        })
                      }
                      onMouseLeave={() => setHover(null)}
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* PFZ */}
          {layers.pfz &&
            dossier.pfz.map((z) => {
              const c = project(z.center);
              const active = z.id === activePfzId;
              return (
                <g key={z.id} onClick={() => onSelectPfz?.(z.id)} className="cursor-pointer">
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={active ? 26 : 20}
                    fill="var(--color-accent)"
                    opacity={active ? 0.32 : 0.18}
                    stroke="var(--color-accent)"
                    strokeWidth={active ? 2.5 : 1.2}
                  />
                  <text x={c.x - 7} y={c.y + 5} fontSize="14">
                    🎣
                  </text>
                  <text x={c.x + 14} y={c.y - 14} fontSize="10.5" fill="var(--color-foreground)">
                    {z.name.split(" — ")[0]} · {z.distanceNm} nm · {(z.confidence * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}

          {/* Vessel */}
          <g>
            <circle cx={harbour.x} cy={harbour.y} r="16" fill="var(--color-primary)" opacity="0.18" />
            <circle cx={harbour.x} cy={harbour.y} r="6" fill="var(--color-primary)" />
            <text x={harbour.x + 11} y={harbour.y + 16} fontSize="11" fill="var(--color-foreground)">
              🚤 {t("vessel")} · {dossier.port.name}
            </text>
          </g>

          {/* Scale bar */}
          <g transform={`translate(24, ${H - 28})`}>
            <line x1="0" y1="0" x2={nmToPx(20)} y2="0" stroke="var(--color-foreground)" strokeWidth="2" />
            <text x="0" y="-6" fontSize="10" fill="var(--color-foreground)">
              20 nm
            </text>
          </g>
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 max-w-[260px] rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] text-popover-foreground shadow-lg"
            style={{ left: Math.min(hover.x + 12, 520), top: hover.y + 12 }}
          >
            {hover.text}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        <span>🎣 {t("pfz")}</span>
        <span>⚠️ {t("hazard")}</span>
        <span>⛔ {t("restricted")}</span>
        <span>🚢 {t("route")}</span>
        <span className="ml-auto uppercase tracking-wide">{t("mockBadge")}</span>
      </div>
    </div>
  );
}
