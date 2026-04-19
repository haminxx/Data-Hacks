"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import { Globe, type GlobeHandle } from "@/components/Globe";

// Single source of truth for the globe's square edge length. Using `min(…)`
// keeps the globe large on wide desktops while still clamping inside the
// viewport on phones. The button's vertical offset is computed off of this
// same value so it sits a fixed gap above the globe's top edge at every
// breakpoint.
const GLOBE_SIZE = "min(92vh, 95vw)";
const BUTTON_GAP_PX = 56;

export default function HomePage() {
  const router = useRouter();
  const globeRef = useRef<GlobeHandle>(null);
  const [flying, setFlying] = useState<boolean>(false);
  const [fadeOut, setFadeOut] = useState<boolean>(false);

  useEffect(() => {
    router.prefetch("/map");
  }, [router]);

  const handleLaunchDemo = async () => {
    if (flying) return;
    setFlying(true);
    try {
      // Cobe globe cinematic — rotates to California, tightens onto San
      // Diego, then resolves. We immediately start the route cross-fade so
      // the navigation feels like one continuous camera move.
      await globeRef.current?.flyToSanDiego();
    } finally {
      setFadeOut(true);
      window.setTimeout(() => {
        router.push("/map");
      }, 750);
    }
  };

  // Exposed as a CSS variable so both the globe wrapper and the button
  // container read the exact same size — keeps their positions in lock-step
  // across resizes.
  const pageStyle = { "--globe-size": GLOBE_SIZE } as CSSProperties;

  return (
    <div
      className="relative min-h-[155vh] overflow-x-hidden bg-[#050814] text-white"
      style={pageStyle}
    >
      {/* Ambient cyan/blue glow behind the globe's equator so the dome reads
          as "lit from within" against the near-black background. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[100vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(26,86,219,0.38)_0%,rgba(5,8,20,0)_70%)]"
        style={{ width: "var(--globe-size)", height: "var(--globe-size)" }}
      />

      {/* Launch Demo — centered horizontally, anchored a fixed pixel gap
          above the globe's top edge regardless of viewport size. */}
      <div
        className="absolute left-1/2 z-20 -translate-x-1/2"
        style={{
          top: `calc(100vh - (var(--globe-size) / 2) - ${BUTTON_GAP_PX}px)`,
        }}
      >
        <button
          type="button"
          onClick={handleLaunchDemo}
          disabled={flying}
          aria-label="Launch SeismoShield demo"
          className="group inline-flex min-h-[60px] items-center justify-center gap-2 rounded-full bg-[#1A56DB] px-10 py-4 text-base font-semibold text-white shadow-2xl shadow-[#1A56DB]/40 ring-1 ring-white/10 transition hover:bg-[#1647b3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A56DB] disabled:cursor-not-allowed disabled:opacity-80"
        >
          {flying ? "Flying over California…" : "Launch Demo"}
          <ArrowRight
            className={`h-5 w-5 transition-transform ${
              flying ? "translate-x-1" : "group-hover:translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Globe — absolutely centered so its vertical midline sits exactly
          at 100vh from the top of the document. That means the initial
          viewport renders the entire upper hemisphere, and scrolling
          downward reveals the lower hemisphere + any room below. */}
      <div
        className="absolute left-1/2 top-[100vh] z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ width: "var(--globe-size)" }}
      >
        <div className="relative aspect-square w-full">
          <Globe ref={globeRef} className="h-full w-full" />
        </div>
      </div>

      {/* Subtle scroll cue just above the initial fold so users understand
          there's more globe below. Pure icon + chevron, no copy. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute bottom-[2vh] left-1/2 z-20 -translate-x-1/2 transition-opacity duration-500 ${
          flying ? "opacity-0" : "opacity-60"
        }`}
      >
        <div className="flex flex-col items-center gap-1 text-white/55">
          <div className="h-6 w-[2px] animate-pulse rounded-full bg-white/40" />
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Cross-fade overlay — fades to navy while we route to /map so the
          handoff from globe → 2.5D campus feels like a single camera move. */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-40 bg-[#0F172A] transition-opacity duration-700 ${
          fadeOut ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
