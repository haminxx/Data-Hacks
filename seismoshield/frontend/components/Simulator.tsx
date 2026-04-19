"use client";

import { useCallback, useMemo, useState } from "react";

import { GeminiTips } from "@/components/GeminiTips";
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
      <header className="relative z-20 flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-white/[0.08] bg-surface-raised/95 px-3 py-2.5 text-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:text-sm">
        <span className="max-w-[40%] truncate font-semibold text-white sm:max-w-none">
          {wp.label}
        </span>
        <span className="rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-white/85">
          Stop {index + 1}/{total}
        </span>
        <span className="rounded-full border border-brand/35 bg-brand/15 px-2.5 py-0.5 text-[11px] font-medium text-brand-bright">
          {riskTier}
        </span>
        <span className="ml-auto font-mono tabular-nums text-white/60">
          M {magnitude.toFixed(1)}
        </span>
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
          <p className="rounded-full border border-emerald-500/25 bg-emerald-950/40 px-3 py-1.5 text-[11px] font-medium text-emerald-100/95 shadow-lg backdrop-blur-sm">
            EXIT · {wp.exitDistance}
          </p>
        </div>

        <aside className="pointer-events-auto absolute right-0 top-12 z-20 max-h-[min(78vh,520px)] w-[min(100%,20rem)] overflow-y-auto rounded-l-2xl border border-white/[0.08] bg-surface-raised/95 p-3 text-xs shadow-card backdrop-blur-md sm:top-14 sm:p-4 sm:text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-bright">
            Waypoint tips
          </p>
          <GeminiTips
            waypointLabel={wp.label}
            waypointDescription={wp.description}
            magnitude={magnitude}
            riskTier={riskTier}
          />
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-white/45">
            Scene guidance
          </p>
          <dl className="mt-2 space-y-3 text-white/85">
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-white/40">
                General
              </dt>
              <dd>{wp.tips.general}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-white/40">
                Hazard
              </dt>
              <dd>{wp.tips.hazard}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-white/40">
                Action
              </dt>
              <dd>{wp.tips.action}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-white/40">
                Exit
              </dt>
              <dd>{wp.tips.exit}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <footer className="relative z-20 flex flex-shrink-0 flex-col gap-3 border-t border-white/[0.08] bg-surface-raised/98 px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-white/35">
          <span>Route progress</span>
          <span className="font-mono tabular-nums text-white/50">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-dim to-brand transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={goBack}
            disabled={index === 0}
            className="min-h-[44px] min-w-[88px] rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Back
          </button>
          <button
            type="button"
            onClick={triggerShake}
            className="min-h-[44px] flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#1647b3] sm:max-w-[200px] sm:flex-none"
          >
            Simulate shake
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={index >= total - 1}
            className="min-h-[44px] min-w-[88px] rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}
