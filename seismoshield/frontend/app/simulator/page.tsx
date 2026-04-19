"use client";

import { useCallback, useEffect, useState } from "react";

import { Simulator, type SimulatorScenario } from "@/components/Simulator";
import { predict } from "@/lib/api";

const SALTON_EPICENTER = { lat: 33.19, lon: -115.54 };

const SCENARIOS: { id: SimulatorScenario; label: string; hint: string }[] = [
  { id: "earthquake", label: "🌍 Earthquake only", hint: "Base shaking" },
  { id: "earthquake_fire", label: "🔥 + Fire", hint: "Smoke & heat tint" },
  { id: "earthquake_dark", label: "🌑 + Blackout", hint: "Limited visibility" },
];

export default function SimulatorPage() {
  const [mag, setMag] = useState(6.5);
  const [scenario, setScenario] = useState<SimulatorScenario>("earthquake");
  const [riskTier, setRiskTier] = useState("…");
  const [riskLoading, setRiskLoading] = useState(true);

  const runPredict = useCallback(async (m: number) => {
    setRiskLoading(true);
    try {
      const r = await predict(m, SALTON_EPICENTER.lat, SALTON_EPICENTER.lon);
      setRiskTier(r.tier);
    } catch {
      setRiskTier("Moderate");
    } finally {
      setRiskLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void runPredict(mag);
    }, 300);
    return () => window.clearTimeout(id);
  }, [mag, runPredict]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <div className="flex flex-shrink-0 flex-col gap-4 border-b border-white/[0.08] bg-surface-raised/95 px-4 py-4 shadow-card backdrop-blur-md sm:flex-row sm:flex-wrap sm:items-end sm:gap-6 sm:px-5">
        <div className="min-w-0 flex-1 sm:max-w-xl">
          <div className="flex items-baseline justify-between gap-2">
            <label
              htmlFor="mag-slider"
              className="text-[11px] font-semibold uppercase tracking-wider text-white/45"
            >
              Magnitude (Salton Sea epicenter)
            </label>
            <span className="font-mono text-sm tabular-nums text-brand-bright">
              M {mag.toFixed(1)}
            </span>
          </div>
          <input
            id="mag-slider"
            type="range"
            min={4}
            max={8}
            step={0.1}
            value={mag}
            onChange={(e) => setMag(Number(e.target.value))}
            className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#1A56DB] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
          />
          <p className="mt-2 text-[11px] text-white/40">
            Epicenter 33.19°N, 115.54°W · Risk updates as you drag (debounced
            300ms)
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-2 sm:min-w-[280px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
            Scenario overlay
          </span>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                title={s.hint}
                onClick={() => setScenario(s.id)}
                className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition sm:text-sm ${
                  scenario === s.id
                    ? "border-brand/50 bg-brand/15 text-white shadow-inner ring-1 ring-brand/20"
                    : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.07]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 sm:ml-auto ${
            riskLoading
              ? "border-white/10 bg-white/[0.03] text-white/50"
              : "border-brand/25 bg-brand/10 text-white"
          }`}
        >
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">
            Live tier
          </span>
          <span
            className={`text-sm font-semibold ${riskLoading ? "animate-pulse" : ""}`}
          >
            {riskLoading ? "…" : riskTier}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Simulator magnitude={mag} scenario={scenario} riskTier={riskTier} />
      </div>
    </div>
  );
}
