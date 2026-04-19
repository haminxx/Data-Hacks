"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type {
  BuildingHazard,
  DirectionZone,
  ScenarioCondition,
} from "@/lib/simulatorData";

type ScenarioCardProps = {
  magnitude: number;
  condition: ScenarioCondition;
  onMagnitudeChange: (magnitude: number) => void;
  onConditionChange: (condition: ScenarioCondition) => void;
  currentZone: DirectionZone | null;
  answeredZones: Set<number>;
  buildingHazards: BuildingHazard[];
  currentYaw: number;
};

const CONDITIONS: Array<{ value: ScenarioCondition; label: string; emoji: string }> = [
  { value: "earthquake", emoji: "🌍", label: "Earthquake Only" },
  { value: "earthquake_fire", emoji: "🔥", label: "+ Fire" },
  { value: "earthquake_dark", emoji: "🌑", label: "+ Blackout" },
  { value: "earthquake_fire_dark", emoji: "🔥🌑", label: "Fire + Blackout" },
];

function hazardBadge(risk: BuildingHazard["risk"]): string {
  if (risk === "SEVERE")
    return "bg-red-950 text-red-400 border-red-800";
  if (risk === "HIGH")
    return "bg-orange-950 text-orange-400 border-orange-800";
  return "bg-yellow-950 text-yellow-500 border-yellow-800";
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="my-4 border-t border-slate-800" />;
}

export default function ScenarioCard({
  magnitude,
  condition,
  onMagnitudeChange,
  onConditionChange,
  currentZone,
  answeredZones,
  buildingHazards,
}: ScenarioCardProps) {
  // Phones: default collapsed so the 360° view has breathing room.
  // Desktop: always expanded — the sidebar has room for the full rail.
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside
      className={`fixed z-30 overflow-y-auto text-white scrollbar-hide md:left-4 md:top-20 md:bottom-4 md:w-[280px] md:max-h-none md:p-5 ${
        collapsed
          ? "left-2 top-2 w-[min(58vw,220px)] max-h-[60vh] p-2.5"
          : "left-2 right-2 top-2 max-h-[62vh] p-3"
      }`}
      style={{
        background: "rgba(10,15,30,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        scrollbarWidth: "none",
      }}
    >
      {/* Mobile-only collapse toggle. Tap the header area to fold the
          whole scenario rail down to a single-row pill showing the
          magnitude so the 360° panorama stays the hero of the view. */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="mb-2 flex w-full items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-left text-[11px] uppercase tracking-[0.18em] text-slate-400 transition hover:text-white md:hidden"
        aria-expanded={!collapsed}
      >
        <span className="flex items-center gap-2">
          <span className="font-semibold text-[#93c5fd]">
            M {magnitude.toFixed(1)}
          </span>
          <span className="text-slate-500">· Scenario</span>
        </span>
        {collapsed ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
      </button>

      {/* On mobile, when collapsed, hide everything below — the card
          becomes a tiny floating magnitude chip. `hidden md:block`
          keeps it visible on desktop regardless of state. */}
      <div className={collapsed ? "hidden md:block" : "block"}>
      <section>
        <SectionTitle>Scenario Settings</SectionTitle>
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 md:text-xs">
            Magnitude
          </p>
          <p className="text-[26px] font-black leading-none text-[#1A56DB] md:text-[32px]">
            {magnitude.toFixed(1)}
          </p>
        </div>
        <input
          type="range"
          min={4}
          max={8}
          step={0.5}
          value={magnitude}
          onChange={(e) => onMagnitudeChange(Number(e.target.value))}
          className="w-full accent-blue-500"
          style={{ height: 4 }}
        />
        <div className="mt-1 mb-3 flex justify-between text-xs text-slate-600">
          <span>4.0</span>
          <span>8.0</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {CONDITIONS.map((item) => {
            const active = condition === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onConditionChange(item.value)}
                className="w-full rounded-[10px] px-[14px] py-[10px] text-left text-[13px] transition-all duration-200"
                style={{
                  background: active
                    ? "rgba(26,86,219,0.2)"
                    : "rgba(30,41,59,0.6)",
                  border: `1px solid ${
                    active
                      ? "rgba(59,130,246,0.6)"
                      : "rgba(51,65,85,0.5)"
                  }`,
                  color: active ? "#93c5fd" : "#cbd5e1",
                }}
              >
                <span className="mr-2">{item.emoji}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>
          <span className="text-orange-400">⚠</span> Room Hazards
        </SectionTitle>
        <ul className="flex flex-col gap-2">
          {buildingHazards.map((hazard) => (
            <li
              key={hazard.label}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2 text-xs text-slate-300">
                <span>{hazard.icon}</span>
                <span>{hazard.label}</span>
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${hazardBadge(
                  hazard.risk,
                )}`}
              >
                {hazard.risk}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      <section>
        <SectionTitle>Building Info</SectionTitle>
        <p className="text-[15px] font-bold text-white">HSS Room 1345</p>
        <p className="mt-1 text-xs text-slate-400">
          Built 1970 — Brutalist Concrete
        </p>
        <p className="text-xs text-slate-500">8-story concrete structure</p>
        <div
          className="mt-2 rounded-lg py-[6px] text-center text-sm font-semibold text-red-400"
          style={{
            background: "rgba(220,38,38,0.15)",
            border: "1px solid rgba(153,27,27,0.5)",
          }}
        >
          🔴 SEVERE RISK
        </div>
        <p className="mt-2 text-xs text-slate-500">
          PGV: 8.4 cm/s at M{magnitude.toFixed(1)}
        </p>
      </section>

      <Divider />

      <section>
        <SectionTitle>Progress</SectionTitle>
        <div className="flex items-center justify-between">
          {[1, 4, 3, 2].map((zone, idx) => {
            const answered = answeredZones.has(zone);
            const isCurrent = currentZone?.id === zone && !answered;
            const questionNumber = idx + 1;
            return (
              <div key={zone} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                      answered
                        ? "bg-[#1A56DB] text-white"
                        : isCurrent
                          ? "border-2 border-blue-500 bg-transparent text-blue-400"
                          : "border-2 border-slate-700 bg-transparent text-slate-500"
                    }`}
                  >
                    {answered ? (
                      "✓"
                    ) : isCurrent ? (
                      <span className="block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                    ) : (
                      questionNumber
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Q{questionNumber}
                  </span>
                </div>
                {idx < 3 && (
                  <div
                    className="mx-1 h-[2px] flex-1"
                    style={{
                      background: answered
                        ? "#1A56DB"
                        : "rgba(51,65,85,0.6)",
                      marginBottom: 18,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>
      </div>
    </aside>
  );
}
