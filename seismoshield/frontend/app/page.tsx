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
//
// The globe's outer "parked → centred + zoomed" motion is driven
// entirely by the `.hero-globe` CSS class (see globals.css):
//   • 1400ms delay → rotate in place first
//   • 2200ms transform transition → glide to card centre + scale up
// Those numbers are deliberately slower and zoomier than before so
// the viewer gets an extra beat to register the plunge.
//
// ROUTE_AT_MS must stay >= 1400 + 2200 = 3600 so the hero transform
// finishes before we unmount the page. FADE_IN_AT_MS lines up the
// crossfade with the tail end of that transform.
const FADE_DURATION_MS = 1300;
const FADE_IN_AT_MS = 2500;
const ROUTE_AT_MS = 3800;

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
        <div className="relative w-full min-h-[560px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1224] via-[#080e1e] to-[#050814] px-5 py-10 shadow-[0_40px_120px_-40px_rgba(26,86,219,0.5)] sm:px-8 sm:py-14 md:px-16 md:py-20 md:min-h-[620px]">
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
                don't collide. On mobile, space is reserved below the
                Demo button so the larger bottom-centred globe has a
                clean runway before the card edge clips it. */}
            <div className="relative h-[min(46vh,320px)] w-full shrink-0 md:h-[340px] md:max-w-xl md:flex-1" />
          </div>

          {/* Globe stage. Full-card flex container keeps the square
              wrapper centred; the wrapper itself stays perfectly
              square (aspect-[1/1]) at ALL times so the globe never
              stretches into an "orb". Position + zoom are animated
              purely via `transform` (translate + scale) on the
              `.hero-globe` class — see globals.css for the
              responsive parked / flying positions and the cubic
              easing. During the demo cinematic the translate eases
              back to (0,0) and scale grows, so the globe glides
              from its parked position into the exact card centre
              (both axes) while rotating — no shape distortion.

              Layout anchor: on mobile the wrapper sits centred so
              the globe ends up bottom-centred via its parked
              transform. On ≥md the same centre anchor + a positive
              X-translate parks the globe slightly right-of-centre.

              `pointer-events-none` on the outer layer keeps the Demo
              button clickable; the inner square re-enables events
              so the globe remains draggable when idle. */}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div
              className="hero-globe pointer-events-auto aspect-[1/1]"
              data-flying={flying ? "true" : "false"}
            >
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
