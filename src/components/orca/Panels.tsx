import { AGENTS, DATA_SOURCES, type PortDossier, type RiskLevel } from "@/lib/orca-data";
import { cn } from "@/lib/utils";

export function RiskChip({ level, t, className }: { level: RiskLevel; t: (k: string) => string; className?: string }) {
  const map = {
    green: { cls: "bg-safe/20 text-safe border-safe/50", dot: "🟢", key: "levelGreen" },
    amber: { cls: "bg-caution/20 text-caution border-caution/50", dot: "🟡", key: "levelAmber" },
    red: { cls: "bg-danger/20 text-danger border-danger/50", dot: "🔴", key: "levelRed" },
  }[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        map.cls,
        className,
      )}
    >
      {map.dot} {t(map.key)}
    </span>
  );
}

export function ConditionsPanel({ dossier, t }: { dossier: PortDossier; t: (k: string) => string }) {
  const c = dossier.conditions;
  const items = [
    { icon: "🌡️", label: t("sst"), value: `${c.sst} °C`, sub: `anomaly ${c.sstAnomaly > 0 ? "+" : ""}${c.sstAnomaly}` },
    { icon: "🌿", label: t("chl"), value: `${c.chlorophyll} mg/m³`, sub: "Oceansat-3 OCM" },
    { icon: "🌊", label: t("waves"), value: `${c.waveHeight} m`, sub: `${c.swellPeriod} s swell` },
    { icon: "💨", label: t("wind"), value: `${c.windSpeed} kt ${c.windDir}`, sub: `gust ${c.gust} kt` },
    { icon: "🌦️", label: t("rain"), value: `${c.rainChance} %`, sub: `lightning ${c.lightningRisk}` },
    { icon: "👁️", label: t("visibility"), value: `${c.visibility} km`, sub: "surface obs" },
    { icon: "🧭", label: t("current"), value: `${c.currentSpeed} kt`, sub: c.currentDir },
    {
      icon: "🌀",
      label: "Cyclone",
      value: c.cycloneWatch ? "Watch" : "None",
      sub: c.cycloneName ?? "IMD bulletin clear",
    },
  ];
  return (
    <div className="panel p-4">
      <h3 className="mb-3 font-display text-sm font-semibold">🌡️ {t("conditions")}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((i) => (
          <div key={i.label} className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="text-[11px] text-muted-foreground">
              {i.icon} {i.label}
            </div>
            <div className="mono-num mt-1 text-lg font-semibold">{i.value}</div>
            <div className="truncate text-[10.5px] text-muted-foreground">{i.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PfzPanel({
  dossier,
  t,
  activeId,
  onSelect,
}: {
  dossier: PortDossier;
  t: (k: string) => string;
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="panel p-4">
      <h3 className="mb-3 font-display text-sm font-semibold">🎣 {t("pfz")}</h3>
      <div className="space-y-2">
        {dossier.pfz.map((z) => (
          <button
            key={z.id}
            onClick={() => onSelect(z.id)}
            className={cn(
              "w-full rounded-lg border p-3 text-left transition-colors",
              z.id === activeId ? "border-accent bg-accent/12" : "border-border bg-muted/25 hover:border-accent/50",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{z.name}</span>
              <span className="mono-num rounded-full bg-accent/20 px-2 py-0.5 text-[11px] text-accent">
                {(z.confidence * 100).toFixed(0)}% {t("confidence")}
              </span>
            </div>
            <div className="mono-num mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground sm:grid-cols-4">
              <span>
                {t("distance")}: {z.distanceNm} nm {z.bearing}
              </span>
              <span>
                {t("depth")}: {z.depthM} m
              </span>
              <span>SST: {z.sst} °C</span>
              <span>Chl: {z.chlorophyll} mg/m³</span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-muted-foreground">
              {t("species")}: {z.species.join(", ")} · {z.frontStrength} front — {z.note}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AlertsPanel({ dossier, t }: { dossier: PortDossier; t: (k: string) => string }) {
  return (
    <div className="panel p-4">
      <h3 className="mb-3 font-display text-sm font-semibold">⚠️ {t("alerts")}</h3>
      {dossier.hazards.length === 0 ? (
        <p className="rounded-lg border border-safe/40 bg-safe/10 p-3 text-xs text-safe">🟢 {t("noAlerts")}</p>
      ) : (
        <ul className="space-y-2">
          {dossier.hazards.map((h) => (
            <li
              key={h.id}
              className={cn(
                "rounded-lg border p-3",
                h.severity === "red"
                  ? "border-danger/50 bg-danger/10"
                  : h.severity === "amber"
                    ? "border-caution/50 bg-caution/10"
                    : "border-safe/40 bg-safe/10",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold">
                  {h.kind === "cyclone" ? "🌀" : h.kind === "lightning" ? "⚡" : h.kind === "fog" ? "🌫️" : "🌊"}{" "}
                  {h.title}
                </span>
                <RiskChip level={h.severity} t={t} />
              </div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">{h.detail}</p>
              <p className="mono-num mt-1 text-[11px] text-muted-foreground">
                {h.radiusNm} nm radius · valid {h.validTill}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 space-y-1.5">
        {dossier.restricted.map((r) => (
          <p key={r.id} className="rounded-md border border-border bg-muted/25 p-2 text-[11.5px] text-muted-foreground">
            ⛔ <span className="text-foreground">{r.name}</span> — {r.note}
          </p>
        ))}
      </div>
    </div>
  );
}

export function EvidencePanel({
  dossier,
  t,
  evidence,
}: {
  dossier: PortDossier;
  t: (k: string) => string;
  evidence?: string[];
}) {
  return (
    <div className="panel p-4">
      <h3 className="mb-3 font-display text-sm font-semibold">📚 {t("evidence")}</h3>
      <ul className="space-y-2">
        {DATA_SOURCES.map((s) => (
          <li key={s.id} className="rounded-lg border border-border bg-muted/25 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-semibold">{s.name}</span>
              <span className="mono-num rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
                {s.latency}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] text-muted-foreground">{s.provides}</p>
          </li>
        ))}
      </ul>
      {evidence && evidence.length > 0 && (
        <div className="mt-3 rounded-lg border border-primary/40 bg-primary/8 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Supporting evidence</p>
          <ul className="mt-1.5 space-y-1 text-[11.5px] text-muted-foreground">
            {evidence.map((e, i) => (
              <li key={i}>• {e}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="mono-num mt-3 text-[10.5px] uppercase tracking-wide text-caution">
        ⚠️ {t("mockBadge")} — values are realistic simulations of the feeds above, not live readings. Last sync{" "}
        {new Date(dossier.conditions.updatedAt).toLocaleTimeString()}
      </p>
    </div>
  );
}

export type AgentStatus = "idle" | "running" | "done";

export function AgentPipeline({
  t,
  status,
  activeAgent,
  log,
}: {
  t: (k: string) => string;
  status: AgentStatus;
  activeAgent: number;
  log?: { agent: string; name: string; findings: string[] }[];
}) {
  return (
    <div className="panel p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold">🧠 {t("workflow")}</h3>
        <span className="mono-num text-[10.5px] text-muted-foreground">{t("workflowSteps")}</span>
      </div>
      <ol className="mt-3 space-y-2">
        {AGENTS.map((a, i) => {
          const state = status === "idle" ? "idle" : i < activeAgent ? "done" : i === activeAgent ? "running" : "idle";
          const found = log?.find((l) => l.agent === a.id)?.findings;
          return (
            <li
              key={a.id}
              className={cn(
                "rounded-lg border p-2.5 transition-colors",
                state === "running"
                  ? "border-primary bg-primary/10"
                  : state === "done"
                    ? "border-accent/40 bg-accent/8"
                    : "border-border bg-muted/20",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="mono-num w-5 text-[11px] text-muted-foreground">{i + 1}</span>
                <span className="text-[12.5px] font-semibold">{a.name}</span>
                <span className="ml-auto text-[11px]">
                  {state === "done" ? "✅" : state === "running" ? "⏳" : "•"}
                </span>
              </div>
              <p className="mt-0.5 pl-7 text-[11px] text-muted-foreground">{a.task}</p>
              {state === "done" && found && (
                <ul className="mono-num mt-1.5 space-y-0.5 pl-7 text-[11px] text-foreground/85">
                  {found.map((f, k) => (
                    <li key={k}>↳ {f}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
