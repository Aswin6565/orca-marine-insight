import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { MarineMap } from "@/components/orca/MarineMap";
import { ForecastChart, RainChart, TideChart } from "@/components/orca/Charts";
import {
  AgentPipeline,
  AlertsPanel,
  ConditionsPanel,
  EvidencePanel,
  PfzPanel,
  RiskChip,
  type AgentStatus,
} from "@/components/orca/Panels";
import { OrcaChat } from "@/components/orca/OrcaChat";
import { PORTS, buildDossier } from "@/lib/orca-data";
import type { OrcaAnswer } from "@/lib/orca.functions";
import { LANGUAGES, makeT, languageName, type LangCode } from "@/lib/orca-i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Poseidon Atlas · ORCA — Marine Ecosystem Reasoning with Collaborative Agents" },
      {
        name: "description",
        content:
          "ORCA fuses ISRO, INCOIS and IMD style marine data through collaborative AI agents to deliver potential fishing zones, cyclone and wave alerts, safe routes and explainable risk advice for Indian fishers.",
      },
      { property: "og:title", content: "Poseidon Atlas · ORCA marine advisory" },
      {
        property: "og:description",
        content:
          "Multi-agent marine intelligence: PFZ analysis, SST and chlorophyll, cyclone alerts, safe-route optimisation and explainable recommendations in Indian languages.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [portId, setPortId] = useState(PORTS[0].id);
  const [lang, setLang] = useState<LangCode>("en");
  const [answer, setAnswer] = useState<OrcaAnswer | null>(null);
  const [agentStep, setAgentStep] = useState(0);
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [nonce, setNonce] = useState(0);

  const dossier = useMemo(() => buildDossier(portId), [portId, nonce]);
  const [activePfz, setActivePfz] = useState<string | undefined>(dossier.pfz[0]?.id);
  const t = useMemo(() => makeT(lang), [lang]);

  function handleStep(i: number) {
    setStatus(i >= 7 ? "done" : "running");
    setAgentStep(i);
  }

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-5 lg:px-8">
      <header className="panel mb-5 flex flex-wrap items-center gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌊</span>
          <div>
            <h1 className="font-display text-xl font-bold leading-tight">{t("appName")}</h1>
            <p className="text-[11.5px] text-muted-foreground">
              {t("tagline")} · SIH 26176
            </p>
          </div>
        </div>

        <span className="mono-num rounded-full border border-caution/60 bg-caution/15 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-caution">
          ⚠️ {t("mockBadge")}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            🚩 {t("port")}
            <select
              value={portId}
              onChange={(e) => {
                setPortId(e.target.value);
                setAnswer(null);
                setStatus("idle");
                setActivePfz(buildDossier(e.target.value).pfz[0]?.id);
              }}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-[12.5px] text-foreground"
            >
              {PORTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.state}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            🌐 {t("language")}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as LangCode)}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-[12.5px] text-foreground"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={() => setNonce((n) => n + 1)}
            className="rounded-lg border border-primary/50 bg-primary/12 px-3 py-1.5 text-[12px] font-medium text-primary"
          >
            ♻️ {t("runAgents")}
          </button>
        </div>
      </header>

      <section className="panel mb-5 flex flex-wrap items-center gap-3 px-5 py-4">
        <RiskChip level={answer?.riskLevel ?? dossier.risk.level} t={t} />
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {t("risk")} — {dossier.risk.score}/100
          </p>
          <p className="text-[13px] font-semibold">
            {t("window")}: {dossier.risk.window}
          </p>
        </div>
        <div className="ml-auto max-w-xl text-[12px] text-muted-foreground">
          <span className="font-semibold text-foreground">🔍 {t("why")} </span>
          {(answer?.why ?? dossier.risk.drivers).join(" · ")}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5">
          <MarineMap dossier={dossier} t={t} activePfzId={activePfz} onSelectPfz={setActivePfz} />
          <ConditionsPanel dossier={dossier} t={t} />
          <PfzPanel dossier={dossier} t={t} activeId={activePfz} onSelect={setActivePfz} />
          <div className="grid gap-5 lg:grid-cols-2">
            <ForecastChart dossier={dossier} title={`📊 ${t("forecast")}`} />
            <TideChart dossier={dossier} title={`🌊 ${t("tide")}`} />
          </div>
          <RainChart dossier={dossier} title={`🌦️ ${t("rain")} — 7 days`} />
        </div>

        <div className="space-y-5">
          <OrcaChat
            dossier={dossier}
            lang={lang}
            languageName={languageName(lang)}
            t={t}
            onAnswer={setAnswer}
            onAgentStep={handleStep}
          />
          <AgentPipeline t={t} status={status} activeAgent={agentStep} log={answer?.agentLog} />
          <AlertsPanel dossier={dossier} t={t} />
          <EvidencePanel dossier={dossier} t={t} evidence={answer?.evidence} />
        </div>
      </div>

      <footer className="mono-num mt-6 pb-6 text-center text-[11px] text-muted-foreground">
        User Query → AI Planning → Multi-Agent Execution → Data Correlation → Risk Analysis → Recommendation → Map +
        Evidence + Alerts · all figures are labelled demo data
      </footer>
    </main>
  );
}
