"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Info,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useCallback, useState } from "react";

const DEMO_HINTS = [
  "HSS",
  "1345",
  "Humanities",
  "Social Sciences",
  "UCSD",
  "32.8785",
];

const DEFAULT_ADDR =
  "HSS Room 1345, Humanities & Social Sciences Building, UCSD";

function isDemoAddress(value: string): boolean {
  const v = value.trim().toLowerCase();
  return DEMO_HINTS.some((h) => v.includes(h.toLowerCase()));
}

export default function RiskAddressPage() {
  const router = useRouter();
  const [address, setAddress] = useState(DEFAULT_ADDR);
  const [showLimit, setShowLimit] = useState(false);

  const submit = useCallback(() => {
    if (isDemoAddress(address)) {
      router.push("/risk/results");
      return;
    }
    setShowLimit(true);
  }, [address, router]);

  const useDemo = useCallback(() => {
    setAddress(DEFAULT_ADDR);
    setShowLimit(false);
    router.push("/risk/results");
  }, [router]);

  return (
    <div className="relative flex min-h-screen flex-col hero-gradient-mesh pt-20 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(55vh,420px)] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(26,86,219,0.18),transparent_65%)]"
      />

      <Link
        href="/exterior"
        className="absolute left-4 top-20 z-10 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-white/75 backdrop-blur-sm transition hover:border-white/15 hover:bg-white/[0.07] hover:text-white md:left-8 md:top-24"
      >
        <ArrowLeft className="h-4 w-4 shrink-0 opacity-80" />
        Back
      </Link>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 pb-20 pt-8 md:pt-12">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#1A56DB]/25 bg-[#1A56DB]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#93c5fd]">
          <Sparkles className="h-3 w-3" aria-hidden />
          Property intelligence
        </div>

        <h1 className="text-center text-3xl font-semibold tracking-tight md:text-[2.25rem] md:leading-tight">
          <span className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
            Risk assessment
          </span>
        </h1>
        <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-white/55 md:text-[15px]">
          Enter a Southern California address. For this demo, use keywords like{" "}
          <span className="text-white/75">HSS</span>,{" "}
          <span className="text-white/75">UCSD</span>, or{" "}
          <span className="text-white/75">Humanities</span> to unlock the full
          report.
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {["HSS", "UCSD", "1345"].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setAddress((prev) =>
                  prev.toLowerCase().includes(chip.toLowerCase())
                    ? prev
                    : `${prev.trim()} ${chip}`.trim()
                );
                setShowLimit(false);
              }}
              className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/60 transition hover:border-[#1A56DB]/35 hover:bg-[#1A56DB]/10 hover:text-[#93c5fd]"
            >
              + {chip}
            </button>
          ))}
        </div>

        <div className="mt-10 w-full max-w-xl">
          <div className="rounded-2xl border border-white/[0.09] bg-[#0b1224]/80 p-1 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.65)] backdrop-blur-md">
            <div className="rounded-[14px] border border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-transparent p-5 md:p-6">
              <label
                htmlFor="risk-address"
                className="flex items-center gap-2 text-[13px] font-medium text-white/80"
              >
                <MapPin className="h-4 w-4 text-[#1A56DB]" aria-hidden />
                Building address
              </label>
              <div className="relative mt-3">
                <Building2
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25"
                  aria-hidden
                />
                <input
                  id="risk-address"
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setShowLimit(false);
                  }}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#050814]/60 py-3.5 pl-11 pr-4 text-[15px] leading-snug text-white shadow-inner placeholder:text-white/25 focus:border-[#1A56DB]/45 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/25"
                  placeholder="Street, city, or campus building"
                  autoComplete="street-address"
                />
              </div>

              <button
                type="button"
                onClick={submit}
                className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A56DB] py-3.5 text-center text-[15px] font-semibold text-white shadow-lg shadow-[#1A56DB]/22 transition hover:bg-[#1647b3] hover:shadow-[#1A56DB]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A56DB]"
              >
                Assess this building
                <ChevronRight className="h-4 w-4 opacity-80 transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 text-left">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1A56DB]/80" aria-hidden />
            <p className="text-[11px] leading-relaxed text-slate-500">
              Powered by Scripps Institution of Oceanography data and USGS
              earthquake records. Results reflect demo coverage for UCSD HSS.
            </p>
          </div>

          {showLimit && (
            <div
              role="status"
              className="mt-6 overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] to-transparent p-5 text-center shadow-[0_0_0_1px_rgba(251,191,36,0.06)_inset]"
            >
              <p className="text-sm font-medium text-amber-100/95">
                This demo is scoped to one building
              </p>
              <p className="mt-2 text-sm text-white/55">
                SeismoShield currently supports the HSS Building at UC San Diego.
                Broader Southern California coverage is planned for Q3 2026.
              </p>
              <button
                type="button"
                onClick={useDemo}
                className="mt-5 w-full rounded-xl border border-[#1A56DB]/35 bg-[#1A56DB]/15 py-3 text-sm font-semibold text-[#bfdbfe] transition hover:bg-[#1A56DB]/25"
              >
                Open HSS assessment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
