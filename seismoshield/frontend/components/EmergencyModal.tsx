"use client";

import { useCallback, useEffect, useState } from "react";

import { checkForEarthquake } from "@/lib/usgs";

type Step = {
  emoji: string;
  title: string;
  detail: string;
};

const STEPS: Step[] = [
  {
    emoji: "🧎",
    title: "DROP to hands and knees",
    detail:
      "Protect yourself from being knocked down. Crawl only if moving to shelter a few steps away.",
  },
  {
    emoji: "🛡️",
    title: "COVER head — use gym bench as shelter if nearby",
    detail:
      "Use your arms to cover your neck and head. If a sturdy bench or table is close, get under it.",
  },
  {
    emoji: "✊",
    title: "HOLD ON until shaking stops",
    detail:
      "Be ready to move with your shelter if it shifts. Stay in position until the shaking fully stops.",
  },
  {
    emoji: "🚶",
    title: "Walk (don't run) to nearest exit when shaking stops",
    detail:
      "Calmly follow lit exit signs toward stairs or ground-level doors. Avoid rushing or pushing.",
  },
  {
    emoji: "🛗",
    title: "Do NOT use the elevator — use stairs or ground level exits",
    detail:
      "Power may fail and shafts can be damaged. Take the nearest stairwell or walk-out exit.",
  },
  {
    emoji: "🌳",
    title: "Proceed to open field SOUTH of Rec Gym, 50m from building",
    detail:
      "Move to the designated open assembly area away from façades, glass, and overhead hazards.",
  },
];

export function EmergencyModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [magnitude, setMagnitude] = useState(6.5);
  const [location, setLocation] = useState("Salton Sea region, CA");
  const [distance, setDistance] = useState(142);

  const openWith = useCallback(
    (mag: number, loc: string, dist: number) => {
      setMagnitude(mag);
      setLocation(loc);
      setDistance(dist);
      setStep(0);
      setOpen(true);
    },
    [],
  );

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "d" && e.key !== "D") return;
      const t = e.target as HTMLElement | null;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t?.isContentEditable)
        return;
      e.preventDefault();
      openWith(6.5, "Salton Sea region, CA", 142);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openWith]);

  useEffect(() => {
    const id = window.setInterval(async () => {
      const r = await checkForEarthquake();
      if (r.triggered) {
        openWith(r.magnitude, r.location, Math.round(r.distance));
      }
    }, 30_000);
    return () => window.clearInterval(id);
  }, [openWith]);

  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <>
      <p className="pointer-events-none fixed bottom-3 right-3 z-40 hidden max-w-xs text-right text-[11px] text-white/40 md:block">
        Press D to demo emergency mode
      </p>
      {open && (
      <div
        className="fixed inset-0 z-[100] flex flex-col bg-[#450A0A] text-white"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="emergency-title"
      >
        <div className="flex items-center gap-3 border-b border-red-900/80 bg-red-950/60 px-4 py-3">
          <span className="animate-pulse text-2xl" aria-hidden>
            ⚠️
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="emergency-title" className="text-lg font-bold text-red-100">
              Earthquake detected
            </h2>
            <p className="truncate text-sm text-red-200/90">
              M{magnitude.toFixed(1)} · {location} · ~{distance} km away
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center">
            <div className="mb-6 text-center">
              <div className="text-6xl" aria-hidden>
                {s.emoji}
              </div>
              <p className="mt-4 text-xl font-bold text-white">{s.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-red-100/85">
                {s.detail}
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    i === step ? "bg-white" : "bg-white/25"
                  }`}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep((x) => Math.max(0, x - 1))}
                disabled={step === 0}
                className="rounded-lg border border-white/20 px-5 py-2 text-sm disabled:opacity-40"
              >
                Back
              </button>
              {!last ? (
                <button
                  type="button"
                  onClick={() => setStep((x) => x + 1)}
                  className="rounded-lg bg-white/15 px-5 py-2 text-sm font-medium hover:bg-white/25"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  I Am Safe
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
}
