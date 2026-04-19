"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Globe, type GlobeHandle } from "@/components/Globe";
import { SiteHeader } from "@/components/SiteHeader";

const DEFAULT_ADDRESS = "9500 Gilman Dr, La Jolla, CA 92093";

const FEATURE_PILLS = [
  { emoji: "🌍", label: "Risk Assessment" },
  { emoji: "🏗️", label: "3D Simulation" },
  { emoji: "🚨", label: "Emergency Guidance" },
];

const FEATURES = [
  {
    icon: "🌍",
    title: "Risk assessment",
    body: "PGV-based tiers and building-specific guidance for your site.",
  },
  {
    icon: "🏗️",
    title: "Walkthrough simulator",
    body: "Photo-based escape route with shake intensity tied to magnitude.",
  },
  {
    icon: "🚨",
    title: "Emergency mode",
    body: "USGS-aware alerts and step-by-step Rec Gym safety (press D to demo).",
  },
] as const;

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
    <div className="relative min-h-screen overflow-hidden bg-[#0F172A] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,86,219,0.18)_0%,rgba(15,23,42,0)_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(ellipse_at_top,rgba(26,86,219,0.25)_0%,rgba(15,23,42,0)_70%)]"
      />

      <SiteHeader transparent />

      <section
        className={`relative mx-auto flex min-h-screen max-w-7xl flex-col-reverse items-center justify-between gap-12 px-6 pb-16 pt-28 transition-opacity duration-500 md:flex-row md:px-12 md:pb-24 md:pt-32 ${
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

          <div className="mt-8 w-full max-w-md">
            <label
              htmlFor="building-address"
              className="mb-2 block text-left text-xs font-medium text-white/50"
            >
              Target building
            </label>
            <input
              id="building-address"
              name="address"
              type="text"
              defaultValue={DEFAULT_ADDRESS}
              className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-left text-sm text-white shadow-inner backdrop-blur-sm placeholder:text-white/35 transition-colors focus:border-[#1A56DB]/50 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/35 sm:text-[15px]"
              autoComplete="street-address"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleLaunchDemo}
              disabled={flying}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-[#1A56DB] px-7 py-3 text-base font-semibold text-white shadow-lg shadow-[#1A56DB]/25 transition hover:bg-[#1647b3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A56DB] disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
            >
              {flying ? "Flying to San Diego…" : "Launch Demo"}
              <ArrowRight
                className={`h-4 w-4 transition-transform ${flying ? "translate-x-1" : ""}`}
              />
            </button>
            <Link
              href="/exterior"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-center text-base font-semibold text-white/90 transition hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30 sm:flex-none"
            >
              Building analysis
            </Link>
            <Link
              href="/simulator"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-center text-base font-semibold text-white/90 transition hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30 sm:flex-none"
            >
              Open simulator
            </Link>
          </div>

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

        <div className="relative flex w-full max-w-xl items-center justify-center">
          <Globe
            ref={globeRef}
            className="w-full max-w-[520px]"
          />
        </div>
      </section>

      <section className="relative border-t border-white/[0.06] bg-[#0B1220]/80 px-6 py-14 md:px-12">
        <ul className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-center shadow-lg shadow-black/20 backdrop-blur-sm transition hover:border-[#1A56DB]/25 hover:bg-white/[0.06]"
            >
              <span className="text-2xl" aria-hidden>
                {f.icon}
              </span>
              <h2 className="mt-2 text-sm font-semibold text-white">{f.title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-white/55">
                {f.body}
              </p>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-10 max-w-md text-center text-[11px] leading-relaxed text-white/35">
          Salton Sea M6.5 scenario · FastAPI + Next.js · Press{" "}
          <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50">
            D
          </kbd>{" "}
          anywhere for emergency drill
        </p>
      </section>

      <div className="pointer-events-none flex justify-center pb-6 pt-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
          DataHacks @ UCSD · SeismoShield
        </p>
      </div>

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
