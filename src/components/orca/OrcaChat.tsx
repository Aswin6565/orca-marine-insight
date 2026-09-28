import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askOrca, type OrcaAnswer } from "@/lib/orca.functions";
import type { PortDossier } from "@/lib/orca-data";
import type { LangCode } from "@/lib/orca-i18n";
import { RiskChip } from "./Panels";
import { cn } from "@/lib/utils";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  answer?: OrcaAnswer;
}

interface Props {
  dossier: PortDossier;
  lang: LangCode;
  languageName: string;
  t: (k: string) => string;
  onAnswer: (a: OrcaAnswer) => void;
  onAgentStep: (i: number) => void;
}

export function OrcaChat({ dossier, lang, languageName, t, onAnswer, onAgentStep }: Props) {
  const run = useServerFn(askOrca);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openWhy, setOpenWhy] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    setError(null);
    const history = [...turns.map((x) => ({ role: x.role, content: x.content })), { role: "user" as const, content: question }];
    setTurns((p) => [...p, { role: "user", content: question }]);
    setBusy(true);

    let step = 0;
    onAgentStep(0);
    const ticker = setInterval(() => {
      step = Math.min(6, step + 1);
      onAgentStep(step);
    }, 550);

    try {
      const res = await run({
        data: { portId: dossier.port.id, lang, languageName, history },
      });
      setTurns((p) => [...p, { role: "assistant", content: res.answer, answer: res }]);
      onAnswer(res);
      setOpenWhy(history.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ORCA could not complete the reasoning run.");
    } finally {
      clearInterval(ticker);
      onAgentStep(7);
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const quick = [t("quick1"), t("quick2"), t("quick3"), t("quick4")];

  return (
    <div className="panel flex h-[640px] flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="text-lg">🤖</span>
        <div>
          <h3 className="font-display text-sm font-semibold">{t("askOrca")}</h3>
          <p className="text-[11px] text-muted-foreground">
            {dossier.port.name} · {languageName}
          </p>
        </div>
        <RiskChip level={dossier.risk.level} t={t} className="ml-auto" />
      </div>

      <div ref={boxRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {turns.length === 0 && (
          <div className="rounded-lg border border-border bg-muted/25 p-3 text-[12.5px] text-muted-foreground">
            {t("chatIntro")}
          </div>
        )}

        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-[13px] text-primary-foreground">
                {turn.content}
              </div>
            </div>
          ) : (
            <div key={i} className="space-y-2">
              <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-foreground">{turn.content}</p>
              {turn.answer && (
                <>
                  <div className="rounded-lg border border-accent/45 bg-accent/10 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                      ✅ {t("recommendation")}
                    </p>
                    <p className="mt-1 text-[12.5px]">{turn.answer.recommendation}</p>
                    <RiskChip level={turn.answer.riskLevel} t={t} className="mt-2" />
                  </div>

                  <button
                    onClick={() => setOpenWhy(openWhy === i ? null : i)}
                    className="rounded-full border border-primary/50 bg-primary/12 px-3 py-1 text-[11.5px] font-medium text-primary"
                  >
                    🔍 {t("why")}
                  </button>

                  {openWhy === i && (
                    <div className="space-y-2 rounded-lg border border-border bg-muted/25 p-3">
                      <ul className="space-y-1 text-[12px]">
                        {turn.answer.why.map((w, k) => (
                          <li key={k}>• {w}</li>
                        ))}
                      </ul>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Evidence
                        </p>
                        <ul className="mono-num mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                          {turn.answer.evidence.map((e, k) => (
                            <li key={k}>↳ {e}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {turn.answer.followUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {turn.answer.followUps.map((q, k) => (
                        <button
                          key={k}
                          onClick={() => send(q)}
                          disabled={busy}
                          className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground disabled:opacity-50"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ),
        )}

        {busy && <p className="animate-pulse text-[12.5px] text-primary">{t("thinking")}</p>}
        {error && (
          <p className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-[12px] text-danger">{error}</p>
        )}
      </div>

      {turns.length === 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {quick.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={2}
          placeholder={t("chatIntro")}
          className="min-h-[46px] flex-1 resize-none rounded-lg border border-input bg-background/60 px-3 py-2 text-[13px] outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className={cn(
            "h-10 rounded-lg bg-primary px-4 text-[12.5px] font-semibold text-primary-foreground transition-opacity",
            (busy || !input.trim()) && "opacity-50",
          )}
        >
          {t("send")}
        </button>
      </form>
    </div>
  );
}
