"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Globe, type GlobeHandle } from "@/components/Globe";

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
      await globeRef.current?.flyToSanDiego();
    } finally {
      setFadeOut(true);
      window.setTimeout(() => {
        router.push("/map");
      }, 750);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0F172A] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_at_top,rgba(26,86,219,0.22)_0%,rgba(15,23,42,0)_70%)]"
      />

      {/* ── Top masthead: big headline on the left, description on the right.
           Mirrors the reference "AI research and products…" layout. */}
      <section className="relative mx-auto max-w-7xl px-6 pb-8 pt-28 md:grid md:grid-cols-[1.35fr_1fr] md:gap-14 md:px-12 md:pb-12 md:pt-32">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1A56DB]/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1A56DB]" />
            </span>
            Real-time seismic intelligence
          </div>

          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-[64px]">
            Seismic{" "}
            <span className="italic font-light text-white/75">
              intelligence
            </span>{" "}
            and tools that{" "}
            <span className="underline decoration-[#1A56DB] decoration-[3px] underline-offset-[8px]">
              put safety
            </span>{" "}
            at the frontier
          </h1>
        </div>

        <div className="mt-8 max-w-md md:mt-3 md:self-end">
          <p className="text-base leading-relaxed text-white/75 md:text-lg">
            Earthquakes are inevitable. Building damage isn&apos;t.
            SeismoShield fuses live USGS feeds with per-building physics so
            every person on campus knows exactly when to move — and where
            to go.
          </p>
        </div>
      </section>

      {/* ── Bottom showcase card: holds the globe (rising from the bottom
           edge) with problem / solution copy on the left and product
           description on the right. */}
      <section
        className={`relative mx-auto max-w-7xl px-6 pb-12 md:px-12 transition-opacity duration-500 ${
          flying ? "opacity-[0.92]" : ""
        }`}
      >
        <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-gradient-to-b from-[#0b1224] via-[#070c1b] to-[#050814] shadow-[0_40px_120px_-40px_rgba(26,86,219,0.55)] min-h-[640px] md:min-h-[720px]">
          {/* Ambient glow that sells the "globe rising" feeling. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_110%,rgba(26,86,219,0.35)_0%,rgba(5,8,20,0)_55%)]"
          />

          {/* Fine-grid backdrop, very subtle. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          {/* Text row: problem/solution on the left, product description on
              the right. Lives in the top third of the card; globe fills
              the bottom. */}
          <div className="relative z-10 grid gap-10 p-8 md:grid-cols-2 md:gap-16 md:p-14">
            <div className={`transition-all duration-700 ${flying ? "-translate-x-4 opacity-60" : ""}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#93c5fd]/80">
                Problem · Solution
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-snug text-white md:text-[28px]">
                Most buildings don&apos;t know they&apos;re about to shake.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/65 md:text-base">
                When an earthquake hits, every building responds differently
                — and most occupants have no idea where the safest egress
                is. SeismoShield resolves both at once: live ground-motion
                physics meets building-scale structural data to give
                second-by-second guidance.
              </p>
            </div>

            <div className={`transition-all duration-700 ${flying ? "translate-x-4 opacity-60" : ""}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#93c5fd]/80">
                What it is
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-snug text-white md:text-[28px]">
                A live seismic copilot for every building on campus.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/65 md:text-base">
                Launch the demo to fly from the globe down into San Diego,
                walk a Scripps-backed 3D building in first person, and see
                the escape routes the system lights up the instant the
                ground starts to move.
              </p>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleLaunchDemo}
                  disabled={flying}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#1A56DB] px-8 py-3 text-base font-semibold text-white shadow-lg shadow-[#1A56DB]/30 transition hover:bg-[#1647b3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A56DB] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {flying ? "Flying over California…" : "Launch Demo"}
                  <ArrowRight
                    className={`h-4 w-4 transition-transform ${
                      flying ? "translate-x-1" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Globe anchored at the card's bottom edge, translated down by 50%
              of its own height so only its upper hemisphere is visible —
              "earth rising" out of the card. `overflow-hidden` on the card
              crops the lower hemisphere cleanly. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
            <div
              className="pointer-events-auto relative aspect-square w-[min(90vw,640px)] translate-y-1/2"
              aria-label="Interactive earthquake globe"
            >
              <Globe ref={globeRef} className="h-full w-full" />
            </div>
          </div>

          {/* Small caption pinned to the card's bottom-left, Anthropic-style. */}
          <div className="pointer-events-none absolute bottom-6 left-8 z-20 text-[11px] uppercase tracking-[0.22em] text-white/35">
            Live · USGS + Scripps
          </div>
          <div className="pointer-events-none absolute bottom-6 right-8 z-20 text-[11px] uppercase tracking-[0.22em] text-white/35">
            UCSD · San Diego
          </div>
        </div>
      </section>

      {/* Cross-fade overlay: fades to navy as we route to /map */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-40 bg-[#0F172A] transition-opacity duration-700 ${
          fadeOut ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
