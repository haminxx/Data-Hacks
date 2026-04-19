"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Globe, type GlobeHandle } from "@/components/Globe";

// Timings for the click → /map cinematic. <Globe/> runs 1400ms
// (rotate to California + gentle zoom) + 1800ms (rotate onto San
// Diego + aggressive zoom-in) = 3200ms total. The cross-fade
// overlaps the tail of the zoom so the planet appears to dive into
// the map screen.
const FADE_DURATION_MS = 1400;
const FADE_IN_AT_MS = 2000;
const ROUTE_AT_MS = 3200;

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
    // the card's CSS expand. We don't await it — the timers below
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

      {/* Hero card. `overflow-hidden` is the key: any part of the globe
          that hangs past the card corner gets clipped so the globe reads
          as a rounded element *inside* the card, not a free-floating
          planet. On Demo, the inner globe expands to `inset-0` and fills
          ONLY this card — the cross-fade then hands off to /map. */}
      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 pt-24 pb-28 sm:px-6 sm:pt-28 md:px-12 md:pb-16 md:pt-32">
        <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1224] via-[#080e1e] to-[#050814] px-5 py-10 shadow-[0_40px_120px_-40px_rgba(26,86,219,0.5)] sm:px-8 sm:py-14 md:px-16 md:py-20">
          {/* Tagline + Demo stack. Fades out as the globe takes over. */}
          <div
            className={`relative z-20 flex flex-col items-start justify-between gap-8 transition-opacity duration-700 md:flex-row md:items-center md:gap-12 ${
              flying ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <div className="relative z-10 w-full max-w-xl md:flex-1">
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
                aria-label="Launch Quarte demo"
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

            {/* Reserves right-column space on desktop so the copy + globe
                don't collide. On mobile, space is reserved below by the
                card's padding + min-height so the globe sits under the
                tagline, clipped by the card corner. */}
            <div className="relative h-[min(38vh,240px)] w-full shrink-0 md:h-[320px] md:max-w-xl md:flex-1" />
          </div>

          {/* Globe — absolute inside the card so `overflow-hidden` on the
              parent clips anything that would otherwise spill past the
              card edge. `inset` transitions drive the idle → flying grow.
              pointer-events-none on the shell keeps the Demo button
              clickable; the inner div re-enables pointer events just
              on the globe so it stays interactive. */}
          <div
            className="pointer-events-none absolute z-10 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              transition: `inset ${ROUTE_AT_MS}ms, width ${ROUTE_AT_MS}ms, height ${ROUTE_AT_MS}ms, right ${ROUTE_AT_MS}ms, bottom ${ROUTE_AT_MS}ms, transform ${ROUTE_AT_MS}ms`,
              ...(flying
                ? {
                    inset: "0",
                    right: "0",
                    bottom: "0",
                    width: "auto",
                    height: "auto",
                    transform: "scale(1.02)",
                  }
                : {
                    // Parked: bottom-right of the card, partially
                    // clipped by the card corner. Size is responsive to
                    // the card, not the viewport.
                    right: "clamp(-10rem, -6vw, -4rem)",
                    bottom: "clamp(-10rem, -6vw, -4rem)",
                    width: "clamp(320px, 52vw, 620px)",
                    height: "clamp(320px, 52vw, 620px)",
                    transform: "scale(1.04)",
                  }),
            }}
          >
            <div className="pointer-events-auto h-full w-full">
              <Globe ref={globeRef} className="h-full w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Slow cross-fade. Starts while the globe is still rotating, so
          the map screen gradually reveals as if the camera is pulling
          back through the atmosphere. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 bg-[#0F172A]"
        style={{
          opacity: fadeOut ? 1 : 0,
          transition: `opacity ${FADE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      />
    </div>
  );
}
