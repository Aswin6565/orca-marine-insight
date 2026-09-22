import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

import { createLovableAiGatewayRunIdFetch } from "./ai-gateway.server";
import { agentFindings, buildDossier, AGENTS } from "./orca-data";

const Input = z.object({
  portId: z.string().min(1),
  lang: z.string().min(2),
  languageName: z.string().min(2),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(40),
});

const AnswerSchema = z.object({
  answer: z.string(),
  recommendation: z.string(),
  riskLevel: z.enum(["green", "amber", "red"]),
  why: z.array(z.string()),
  evidence: z.array(z.string()),
  followUps: z.array(z.string()),
});

export type OrcaAnswer = z.infer<typeof AnswerSchema> & {
  agentLog: { agent: string; name: string; findings: string[] }[];
  mock: true;
};

function fallback(portId: string): OrcaAnswer {
  const d = buildDossier(portId);
  const f = agentFindings(d);
  const best = d.pfz[0]!;
  return {
    answer:
      `ORCA fused ISRO ocean-colour, INCOIS ocean-state and IMD weather layers for ${d.port.name}. ` +
      `Best potential fishing zone is ${best.name}, ${best.distanceNm} nm ${best.bearing} of harbour ` +
      `(SST ${best.sst} °C, chlorophyll ${best.chlorophyll} mg/m³). Overall marine risk is ${d.risk.level.toUpperCase()} (${d.risk.score}/100).`,
    recommendation:
      d.risk.level === "red"
        ? `Do not venture out. ${d.risk.window}.`
        : d.risk.level === "amber"
          ? `Proceed with caution to ${best.name} using the plotted safe route. ${d.risk.window}.`
          : `Conditions are favourable for ${best.name} via the plotted route. ${d.risk.window}.`,
    riskLevel: d.risk.level,
    why: d.risk.drivers,
    evidence: [...f.ocean, ...f.weather, ...f.satellite, ...f.gis],
    followUps: [
      "What if I go out after midnight?",
      "Show me the second-best fishing zone",
      "How far is the nearest restricted boundary?",
    ],
    agentLog: AGENTS.map((a) => ({ agent: a.id, name: a.name, findings: f[a.id] })),
    mock: true,
  };
}

export const askOrca = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<OrcaAnswer> => {
    const dossier = buildDossier(data.portId);
    const findings = agentFindings(dossier);
    const agentLog = AGENTS.map((a) => ({ agent: a.id, name: a.name, findings: findings[a.id] }));

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ...fallback(data.portId), agentLog };

    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const context = [
      `Fishing base: ${dossier.port.name}, ${dossier.port.state} (${dossier.port.coast} coast)`,
      `Ocean agent: ${findings.ocean.join(" | ")}`,
      `Weather agent: ${findings.weather.join(" | ")}`,
      `Satellite/PFZ agent: ${findings.satellite.join(" | ")}`,
      `GIS agent: ${findings.gis.join(" | ")}`,
      `Risk agent: ${findings.risk.join(" | ")}`,
      `Route agent: ${findings.route.join(" | ")}`,
      `Tide today: ${dossier.tide.map((t) => `${t.t} ${t.height}m`).join(", ")}`,
      `Active hazards: ${dossier.hazards.map((h) => `${h.title} (${h.severity})`).join("; ") || "none"}`,
      `Restricted: ${dossier.restricted.map((r) => `${r.name} — ${r.note}`).join("; ")}`,
      `Operating window: ${dossier.risk.window}`,
    ].join("\n");

    const system = [
      "You are ORCA, a multi-agent marine advisory assistant for Indian fishers and coastal authorities.",
      "You receive findings already produced by the Planner, Ocean, Weather, Satellite/PFZ, GIS, Risk and Route agents.",
      "Answer using ONLY those findings. Never invent numbers. All data is clearly-labelled demo/mock data standing in for ISRO, INCOIS and IMD feeds.",
      "Be practical and short (max 120 words in 'answer'). Safety of life at sea always outranks catch.",
      `Write every field in ${data.languageName}. Keep units and place names readable.`,
      "why: 2-4 plain-language reasons. evidence: 3-6 short data citations with source names. followUps: 3 short questions the user may ask next.",
      "Context:",
      context,
    ].join("\n");

    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        system,
        messages: data.history.map((m) => ({ role: m.role, content: m.content })),
        output: Output.object({ schema: AnswerSchema }),
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            store: false,
          },
        },
      });
      const out = await result.output;
      return { ...out, agentLog, mock: true };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return { ...fallback(data.portId), agentLog };
      }
      console.error("ORCA gateway error", error);
      throw error;
    }
  });
