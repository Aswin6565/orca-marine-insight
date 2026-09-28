import {
  Bot,
  BrainCircuit,
  ChevronDown,
  CloudCog,
  Code2,
  Database,
  FlaskConical,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";

type ArchitectureStage = {
  title: string;
  description: string;
  technologies: string[];
  icon: LucideIcon;
  step: string;
};

const stages: ArchitectureStage[] = [
  {
    step: "01",
    title: "User / Operator",
    description: "Marine teams, field operators and decision-makers",
    technologies: ["Human input", "Operational queries"],
    icon: UserRoundCog,
  },
  {
    step: "02",
    title: "Frontend / UI",
    description: "Responsive engineering dashboard and control interface",
    technologies: ["React", "HTML", "CSS"],
    icon: Code2,
  },
  {
    step: "03",
    title: "Backend",
    description: "Secure application services and data orchestration",
    technologies: ["Python", "FastAPI"],
    icon: Bot,
  },
  {
    step: "04",
    title: "AI / ML Engine",
    description: "Prediction, anomaly detection and intelligent recommendations",
    technologies: ["Python", "Scikit-learn", "TensorFlow / PyTorch"],
    icon: BrainCircuit,
  },
  {
    step: "05",
    title: "Digital Twin / Simulation Layer",
    description: "Virtual scenario modelling and operational simulation",
    technologies: ["MATLAB", "Python"],
    icon: FlaskConical,
  },
  {
    step: "06",
    title: "Data Layer",
    description: "Unified historical records and live operational streams",
    technologies: ["MySQL / PostgreSQL", "Historical + Live Data"],
    icon: Database,
  },
  {
    step: "07",
    title: "Cloud / Deployment",
    description: "Scalable, containerised production infrastructure",
    technologies: ["AWS / Azure", "Docker"],
    icon: CloudCog,
  },
];

export function SystemArchitecture() {
  return (
    <section aria-labelledby="architecture-title" className="panel mt-5 overflow-hidden">
      <div className="border-b border-border bg-primary/5 px-5 py-5 sm:px-7">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
            <BrainCircuit aria-hidden="true" size={21} />
          </div>
          <div className="min-w-0">
            <p className="mono-num text-[10px] font-semibold uppercase tracking-wide text-primary">System blueprint</p>
            <h2 id="architecture-title" className="mt-1 font-display text-xl font-bold sm:text-2xl">
              Technical Stack &amp; System Architecture
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              End-to-end engineering flow from operator input to production cloud infrastructure.
            </p>
          </div>
        </div>
      </div>

      <div className="relative px-4 py-6 sm:px-7 sm:py-8">
        <div aria-hidden="true" className="absolute bottom-8 left-1/2 top-8 hidden w-px -translate-x-1/2 bg-primary/25 sm:block" />
        <ol className="relative mx-auto max-w-3xl">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isLast = index === stages.length - 1;

            return (
              <li key={stage.step} className="relative">
                <article className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border border-border bg-card px-4 py-4 shadow-sm transition-colors hover:border-primary/55 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-primary/35 bg-primary/10 text-primary sm:h-14 sm:w-14">
                    <Icon aria-hidden="true" size={24} strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="mono-num shrink-0 text-[10px] font-semibold text-primary">{stage.step}</span>
                      <h3 className="truncate font-display text-sm font-semibold sm:text-base">{stage.title}</h3>
                    </div>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground sm:text-xs">
                      {stage.description}
                    </p>
                  </div>

                  <div className="col-span-2 flex min-w-0 flex-wrap gap-1.5 sm:col-span-1 sm:max-w-[280px] sm:justify-end">
                    {stage.technologies.map((technology) => (
                      <span
                        key={technology}
                        className="mono-num rounded-md border border-primary/25 bg-primary/8 px-2 py-1 text-[10px] font-medium text-primary"
                      >
                        {technology}
                      </span>
                    ))}
                  </div>
                </article>

                {!isLast && (
                  <div aria-hidden="true" className="relative z-10 flex h-10 items-center justify-center">
                    <span className="grid h-7 w-7 place-items-center rounded-full border border-primary/40 bg-background text-primary shadow-sm">
                      <ChevronDown size={16} strokeWidth={2.4} />
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}