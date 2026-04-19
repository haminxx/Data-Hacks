"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Globe, type GlobeHandle } from "@/components/Globe";

// Timings for the click → /map cinematic. The flyTo inside <Globe/> runs
// 900ms + 800ms, so by ~1700ms the camera is locked on the San Diego
// beacon. We start the cross-fade a hair before that and hard-navigate at
// 1700ms so the whole handoff lands in under 2 seconds.
const EXPAND_MS = 1300;
const FADE_IN_AT_MS = 1100;
const ROUTE_AT_MS = 1700;

export default function HomePage() {
  const router = useRouter();
  const globeRef = useRef<GlobeHandle>(null);
  const [flying, setFlying] = useState<boolean>(false);
  const [fadeOut, setFadeOut] = useState<boolean>(false);

  // Prefetch /map on mount so the 2.5D campus is in the RSC cache by the
  // time the cinematic finishes — the transition is effectively instant.
  useEffect(() => {
    router.prefetch("/map");
  }, [router]);

  const handleLaunchDemo = () => {
    if (flying) return;
    setFlying(true);
    // Kick off the globe's two-stage rotate-to-San-Diego in parallel with
    // the container's CSS expand. We don't await it — the timers below
    // orchestrate the hand-off to /map deterministically.
    void globeRef.current?.flyToSanDiego();

    window.setTimeout(() => setFadeOut(true), FADE_IN_AT_MS);
    window.setTimeout(() => router.push("/map"), ROUTE_AT_MS);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050814] text-white">
      {/* Ambient top glow so the dark page doesn't feel flat. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(26,86,219,0.22)_0%,rgba(5,8,20,0)_70%)]"
      />

      {/* ── Hero card: Ruixen-style, tagline + small Demo on the left. The
           globe lives in the fixed container below and visually overflows
           into the card's bottom-right corner. */}
      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-28 pb-16 md:px-12 md:pt-32">
        <div
          className={`relative w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1224] via-[#080e1e] to-[#050814] px-8 py-14 shadow-[0_40px_120px_-40px_rgba(26,86,219,0.5)] transition-opacity duration-500 md:px-16 md:py-20 ${
            flying ? "opacity-90" : "opacity-100"
          }`}
        >
          {/* Subtle fine grid backdrop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          <div className="relative flex flex-col-reverse items-start justify-between gap-12 md:flex-row md:items-center">
            {/* LEFT — tagline + small Demo button */}
            <div
              className={`relative z-10 max-w-xl transition-all duration-500 ${
                flying ? "-translate-x-3 opacity-60" : ""
              }`}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur">
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1A56DB]/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1A56DB]" />
                </span>
                Real-time seismic intelligence
              </div>

              <h1 className="text-[28px] font-normal leading-[1.35] tracking-tight md:text-[32px]">
                <span className="text-white">Quarte</span>{" "}
                <span className="text-white/60">
                  bridges disaster preparedness and insurance tech by using
                  3D spatial mapping to guide residents to safety during an
                  earthquake and helping insurers dynamically price
                  property risk.
                </span>
              </h1>

              <button
                type="button"
                onClick={handleLaunchDemo}
                disabled={flying}
                aria-label="Launch SeismoShield demo"
                className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#050814] shadow-lg shadow-black/25 transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-75"
              >
                {flying ? "Flying to San Diego…" : "Demo"}
                <ArrowRight
                  className={`h-4 w-4 transition-transform ${
                    flying ? "translate-x-1" : "group-hover:translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* RIGHT — layout spacer. The actual globe lives in the fixed
                container below so it can smoothly morph from the card
                corner out to full-screen on launch. */}
            <div className="relative h-[220px] w-full max-w-xl md:h-[260px]" />
          </div>
        </div>
      </section>

      {/* ── Globe container. Always `fixed` so the morph between its
           resting "bottom-right overflow" pose and the full-screen pose
           animates cleanly via transform + width/height only. */}
      <div
        className="pointer-events-none fixed z-30 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          transition: `left ${EXPAND_MS}ms, top ${EXPAND_MS}ms, right ${EXPAND_MS}ms, bottom ${EXPAND_MS}ms, width ${EXPAND_MS}ms, height ${EXPAND_MS}ms, transform ${EXPAND_MS}ms`,
          ...(flying
            ? {
                left: "50%",
                top: "50%",
                width: "130vmax",
                height: "130vmax",
                transform: "translate(-50%, -50%) scale(1)",
              }
            : {
                // Parked at the bottom-right of the viewport (which
                // visually sits inside the hero card's bottom-right
                // overflow zone) at a comfortable desktop size.
                right: "-14rem",
                bottom: "-10rem",
                width: "620px",
                height: "620px",
                transform: "scale(1.1)",
              }),
        }}
      >
        <div className="pointer-events-auto h-full w-full">
          <Globe ref={globeRef} className="h-full w-full" />
        </div>
      </div>

      {/* Cross-fade overlay — starts ~FADE_IN_AT_MS after click so the
          camera has time to land on San Diego before the dissolve. */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-40 bg-[#0F172A] transition-opacity duration-500 ${
          fadeOut ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
