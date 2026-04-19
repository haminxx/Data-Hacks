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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,86,219,0.18)_0%,rgba(15,23,42,0)_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(ellipse_at_top,rgba(26,86,219,0.25)_0%,rgba(15,23,42,0)_70%)]"
      />

      <section
        className={`relative mx-auto flex min-h-screen max-w-7xl flex-col-reverse items-center justify-center gap-12 px-6 pb-16 pt-28 transition-opacity duration-500 md:flex-row md:px-12 md:pb-24 md:pt-32 ${
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
          <p className="mt-5 text-lg leading-relaxed text-white/80 md:text-xl">
            We know your building. We know your risk. We get you out safely.
          </p>

          <div className="mt-9">
            <button
              type="button"
              onClick={handleLaunchDemo}
              disabled={flying}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#1A56DB] px-8 py-3 text-base font-semibold text-white shadow-lg shadow-[#1A56DB]/25 transition hover:bg-[#1647b3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A56DB] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {flying ? "Flying over California…" : "Launch Demo"}
              <ArrowRight
                className={`h-4 w-4 transition-transform ${flying ? "translate-x-1" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="relative flex w-full max-w-2xl items-center justify-center">
          <Globe
            ref={globeRef}
            className="w-full max-w-[680px] md:max-w-[720px]"
          />
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
