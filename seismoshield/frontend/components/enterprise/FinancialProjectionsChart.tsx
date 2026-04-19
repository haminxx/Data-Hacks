"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/line-charts-5";
import type { YearlyProjectionRow } from "@/lib/api";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

const financialChartConfig = {
  cumulative_premium: {
    label: "Premium Revenue",
    color: "hsl(221, 83%, 53%)",
  },
  cumulative_claims: {
    label: "Expected Claims",
    color: "hsl(0, 84%, 60%)",
  },
  net_position: {
    label: "Net Position",
    color: "hsl(142, 71%, 45%)",
  },
} satisfies ChartConfig;

type FinancialProjectionsChartProps = {
  data: YearlyProjectionRow[];
  horizonYear: number;
};

export function FinancialProjectionsChart({
  data,
  horizonYear,
}: FinancialProjectionsChartProps) {
  return (
    <ChartContainer
      config={financialChartConfig}
      className="aspect-auto h-[320px] w-full max-w-full [&_.recharts-curve.recharts-tooltip-cursor]:stroke-muted-foreground/50"
    >
      <LineChart
        data={data}
        margin={{ top: 12, right: 12, left: 4, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="year"
          stroke="#94a3b8"
          tick={{ fill: "var(--muted-foreground, #94a3b8)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          label={{
            value: "Year",
            fill: "#94a3b8",
            position: "bottom",
            offset: -4,
          }}
        />
        <YAxis
          stroke="#94a3b8"
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const y = Number(label);
            const row = data.find((d) => d.year === y);
            return (
              <div className="rounded-lg border border-border/60 bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-xl">
                <p className="mb-2 font-semibold text-foreground">Year {label}</p>
                <ul className="space-y-1.5">
                  {payload.map((p) => (
                    <li
                      key={String(p.dataKey)}
                      className="flex justify-between gap-6 text-[11px]"
                    >
                      <span style={{ color: p.color }}>{p.name}</span>
                      <span className="tabular-nums font-medium text-foreground">
                        ${Number(p.value).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
                {row != null && (
                  <p className="mt-2 border-t border-border/50 pt-2 text-[11px] text-red-300/95">
                    Worst case stress: ${row.worst_case.toLocaleString()}
                  </p>
                )}
              </div>
            );
          }}
        />
        <Legend
          content={<ChartLegendContent nameKey="dataKey" />}
          verticalAlign="bottom"
        />
        <ReferenceLine
          y={0}
          stroke="#f87171"
          strokeDasharray="4 4"
          label={{ value: "Break Even", fill: "#f87171", fontSize: 10 }}
        />
        <ReferenceLine
          x={horizonYear}
          stroke="hsl(221, 83%, 53%)"
          strokeDasharray="3 3"
        />
        <Line
          type="monotone"
          dataKey="cumulative_premium"
          name="Premium Revenue"
          stroke="var(--color-cumulative_premium)"
          strokeWidth={2}
          dot={false}
          isAnimationActive
        />
        <Line
          type="monotone"
          dataKey="cumulative_claims"
          name="Expected Claims"
          stroke="var(--color-cumulative_claims)"
          strokeWidth={2}
          dot={false}
          isAnimationActive
        />
        <Line
          type="monotone"
          dataKey="net_position"
          name="Net Position"
          stroke="var(--color-net_position)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          isAnimationActive
        />
      </LineChart>
    </ChartContainer>
  );
}
