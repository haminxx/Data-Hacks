"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Globe, type GlobeHandle } from "@/components/Globe";

const FEATURE_PILLS = [
  { emoji: "🌍", label: "Risk Assessment" },
  { emoji: "🏗️", label: "3D Simulation" },
  { emoji: "🚨", label: "Emergency Guidance" },
];

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
      }, 650);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0F172A] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,86,219,0.18)_0%,rgba(15,23,42,0)_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(ellipse_at_top,rgba(26,86,219,0.25)_0%,rgba(15,23,42,0)_70%)]"
      />

      <section
        className={`relative mx-auto flex min-h-screen max-w-7xl flex-col-reverse items-center justify-between gap-12 px-6 py-16 transition-opacity duration-500 md:flex-row md:px-12 md:py-24 ${
          flying ? "opacity-[0.92]" : ""
        }`}
      >
        <div
          className={`z-10 max-w-xl text-left transition-all duration-700 ${
            flying ? "-translate-x-6 opacity-0" : ""
          }`}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1A56DB]/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1A56DB]" />
            </span>
            Real-time seismic intelligence
          </div>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Seismo<span className="text-[#1A56DB]">Shield</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-white/80 md:text-xl">
            We know your building. We know your risk. We get you out safely.
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/50">
            AI-driven earthquake risk assessment, 3D building simulation, and
            step-by-step emergency guidance — powered by Scripps Institution of
            Oceanography data.
          </p>

          <button
            type="button"
            onClick={handleLaunchDemo}
            disabled={flying}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1A56DB] px-7 py-3 text-base font-semibold text-white shadow-lg shadow-[#1A56DB]/25 transition hover:bg-[#1647b3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A56DB] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {flying ? "Flying to San Diego…" : "Launch Demo"}
            <ArrowRight
              className={`h-4 w-4 transition-transform ${flying ? "translate-x-1" : ""}`}
            />
          </button>

          <div className="mt-8 flex flex-wrap gap-2">
            {FEATURE_PILLS.map((pill) => (
              <span
                key={pill.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur sm:text-sm"
              >
                <span aria-hidden>{pill.emoji}</span>
                {pill.label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative h-[320px] w-full max-w-xl md:h-[520px]">
          <Globe
            ref={globeRef}
            className="absolute -bottom-24 -right-24 scale-125 md:-bottom-32 md:-right-40 md:scale-150"
          />
        </div>
      </section>

      <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
          DataHacks @ UCSD · SeismoShield
        </p>
      </div>

      {/* Cross-fade overlay: fades to navy as we route to /map so the transition feels seamless */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-40 bg-[#0F172A] transition-opacity duration-700 ${
          fadeOut ? "opacity-100" : "opacity-0"
        }`}
      />
    </main>
  );
}
