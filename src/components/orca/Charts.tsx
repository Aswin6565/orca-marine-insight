import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PortDossier } from "@/lib/orca-data";

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
} as const;

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  color: "var(--color-popover-foreground)",
  fontSize: 12,
};

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-4">
      <h3 className="mb-3 font-display text-sm font-semibold">{title}</h3>
      <div className="h-56">{children}</div>
    </div>
  );
}

export function ForecastChart({ dossier, title }: { dossier: PortDossier; title: string }) {
  const mounted = useMounted();
  return (
    <Frame title={title}>
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dossier.forecast}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="day" {...axis} />
            <YAxis yAxisId="l" {...axis} />
            <YAxis yAxisId="r" orientation="right" {...axis} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line yAxisId="l" name="SST °C" dataKey="sst" stroke="var(--color-chart-4)" strokeWidth={2} dot={false} />
            <Line
              yAxisId="r"
              name="Wave m"
              dataKey="waveHeight"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="l"
              name="Wind kt"
              dataKey="windSpeed"
              stroke="var(--color-chart-5)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="r"
              name="Chl mg/m³"
              dataKey="chlorophyll"
              stroke="var(--color-chart-2)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Frame>
  );
}

export function TideChart({ dossier, title }: { dossier: PortDossier; title: string }) {
  const mounted = useMounted();
  return (
    <Frame title={title}>
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dossier.tide}>
            <defs>
              <linearGradient id="tideFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="t" {...axis} />
            <YAxis {...axis} unit="m" />
            <Tooltip contentStyle={tooltipStyle} />
            <Area dataKey="height" name="Tide m" stroke="var(--color-chart-1)" fill="url(#tideFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Frame>
  );
}

export function RainChart({ dossier, title }: { dossier: PortDossier; title: string }) {
  const mounted = useMounted();
  return (
    <Frame title={title}>
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dossier.forecast}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="day" {...axis} />
            <YAxis {...axis} unit="%" />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="rainChance" name="Rain %" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Frame>
  );
}
