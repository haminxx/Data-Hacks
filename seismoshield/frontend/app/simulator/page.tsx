"use client";

import { useCallback, useEffect, useState } from "react";

import { Simulator, type SimulatorScenario } from "@/components/Simulator";
import { predict } from "@/lib/api";

const SALTON_EPICENTER = { lat: 33.19, lon: -115.54 };

export default function SimulatorPage() {
  const [mag, setMag] = useState(6.5);
  const [scenario, setScenario] = useState<SimulatorScenario>("earthquake");
  const [riskTier, setRiskTier] = useState("…");

  const runPredict = useCallback(async (m: number) => {
    try {
      const r = await predict(m, SALTON_EPICENTER.lat, SALTON_EPICENTER.lon);
      setRiskTier(r.tier);
    } catch {
      setRiskTier("Moderate");
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void runPredict(mag);
    }, 300);
    return () => window.clearTimeout(id);
  }, [mag, runPredict]);

  return (
    <div className="flex h-[100dvh] flex-col bg-[#0F172A]">
      <div className="flex flex-shrink-0 flex-col gap-3 border-b border-white/10 bg-[#0b1224] px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-4">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs text-white/80 sm:max-w-md">
          <span className="font-semibold tracking-wide">
            MAGNITUDE: {mag.toFixed(1)}
          </span>
          <input
            type="range"
            min={4}
            max={8}
            step={0.1}
            value={mag}
            onChange={(e) => setMag(Number(e.target.value))}
            className="accent-[#1A56DB]"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setScenario("earthquake")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
              scenario === "earthquake"
                ? "border-[#1A56DB] bg-[#1A56DB]/25 text-white"
                : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
            }`}
          >
            🌍 Earthquake Only
          </button>
          <button
            type="button"
            onClick={() => setScenario("earthquake_fire")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
              scenario === "earthquake_fire"
                ? "border-[#1A56DB] bg-[#1A56DB]/25 text-white"
                : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
            }`}
          >
            🔥 + Fire
          </button>
          <button
            type="button"
            onClick={() => setScenario("earthquake_dark")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
              scenario === "earthquake_dark"
                ? "border-[#1A56DB] bg-[#1A56DB]/25 text-white"
                : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
            }`}
          >
            🌑 + Blackout
          </button>
        </div>
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/90 sm:ml-auto">
          Risk: <span className="font-semibold text-[#93c5fd]">{riskTier}</span>
        </span>
      </div>

      <div className="min-h-0 flex-1">
        <Simulator magnitude={mag} scenario={scenario} riskTier={riskTier} />
      </div>
    </div>
  );
}
