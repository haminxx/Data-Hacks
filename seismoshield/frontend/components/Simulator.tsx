"use client";

import { useCallback, useMemo, useState } from "react";

import { WAYPOINTS, type EscapeDirection } from "@/lib/waypoints";

export type SimulatorScenario =
  | "earthquake"
  | "earthquake_fire"
  | "earthquake_dark";

type SimulatorProps = {
  magnitude: number;
  scenario: SimulatorScenario;
  riskTier: string;
};

function shakeClassForMagnitude(magnitude: number): string {
  if (magnitude < 5) return "shake-low";
  if (magnitude < 6.5) return "shake-medium";
  return "shake-high";
}

function arrowRotation(dir: EscapeDirection): string {
  switch (dir) {
    case "forward":
      return "rotate(0deg)";
    case "right":
      return "rotate(90deg)";
    case "behind":
      return "rotate(180deg)";
    case "left":
      return "rotate(-90deg)";
    default:
      return "rotate(0deg)";
  }
}

export function Simulator({ magnitude, scenario, riskTier }: SimulatorProps) {
  const [index, setIndex] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);

  const wp = WAYPOINTS[index];
  const total = WAYPOINTS.length;
  const progress = ((index + 1) / total) * 100;

  const shakeClass = useMemo(
    () => shakeClassForMagnitude(magnitude),
    [magnitude],
  );

  const fireLayer = scenario === "earthquake_fire";
  const darkLayer = scenario === "earthquake_dark";

  const triggerShake = useCallback(() => {
    setShakeKey((k) => k + 1);
  }, []);

  const goBack = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-[#0F172A]">
      <header className="relative z-20 flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-white/10 bg-[#0b1224]/95 px-3 py-2 text-xs sm:text-sm">
        <span className="font-semibold text-white">{wp.label}</span>
        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-white/80">
          Stop {index + 1}/{total}
        </span>
        <span className="rounded-full border border-[#1A56DB]/40 bg-[#1A56DB]/20 px-2 py-0.5 text-[#93c5fd]">
          {riskTier}
        </span>
        <span className="text-white/70">M {magnitude.toFixed(1)}</span>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          key={shakeKey}
          className={`relative h-full w-full ${shakeClass}`}
        >
          <div className="relative h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- local waypoint photos may be placeholders */}
            <img
              src={wp.photo}
              alt={wp.label}
              className="h-full w-full object-cover"
            />
            {fireLayer && (
              <>
                <div
                  className="fire-overlay pointer-events-none absolute inset-0"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.25),transparent_65%)]"
                  aria-hidden
                />
              </>
            )}
            {darkLayer && (
              <div
                className="dark-overlay pointer-events-none absolute inset-0"
                aria-hidden
              />
            )}
            {scenario === "earthquake_dark" && (
              <div
                className="debris-overlay pointer-events-none absolute inset-0 opacity-40"
                aria-hidden
              />
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-28 flex flex-col items-center justify-end gap-1 md:bottom-32">
          <div
            className="animate-bounce text-5xl text-green-400 drop-shadow-lg md:text-6xl"
            style={{ transform: arrowRotation(wp.escapeDirection) }}
            aria-hidden
          >
            ↑
          </div>
          <p className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
            EXIT · {wp.exitDistance}
          </p>
        </div>

        <aside className="absolute right-0 top-12 z-10 max-h-[55%] w-[min(100%,20rem)] overflow-y-auto rounded-l-lg border border-white/10 bg-[#0b1224]/90 p-3 text-xs shadow-xl backdrop-blur-md sm:top-14 sm:max-h-[60%] sm:p-4 sm:text-sm">
          <p className="font-semibold text-[#1A56DB]">Tips</p>
          <dl className="mt-2 space-y-2 text-white/85">
            <div>
              <dt className="text-[10px] uppercase text-white/45">General</dt>
              <dd>{wp.tips.general}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase text-white/45">Hazard</dt>
              <dd>{wp.tips.hazard}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase text-white/45">Action</dt>
              <dd>{wp.tips.action}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase text-white/45">Exit</dt>
              <dd>{wp.tips.exit}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <footer className="relative z-20 flex flex-shrink-0 flex-col gap-2 border-t border-white/10 bg-[#0b1224]/95 px-3 py-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#1A56DB] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={goBack}
            disabled={index === 0}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/5 disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={triggerShake}
            className="rounded-lg bg-[#1A56DB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1647b3]"
          >
            Simulate Shake
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={index >= total - 1}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}
