"use client";

import { EnterpriseHeader } from "@/components/enterprise/EnterpriseHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import {
  getFinancialProjection,
  getRiskScore,
  type FinancialProjectionResponse,
  type RiskScoreResponse,
} from "@/lib/api";
import {
  ArrowRight,
  BarChart3,
  Building2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function EnterpriseRiskAssessmentPage() {
  const [fp, setFp] = useState<FinancialProjectionResponse | null>(null);
  const [rs, setRs] = useState<RiskScoreResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const [a, b] = await Promise.all([
          getFinancialProjection(),
          getRiskScore(),
        ]);
        if (!c) {
          setFp(a);
          setRs(b);
        }
      } catch (e) {
        if (!c)
          setErr(e instanceof Error ? e.message : "Could not load portfolio data.");
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const y10 = fp?.yearly_projections?.[9];
  const ins = fp?.insurance_recommendation;

  return (
    <div className="text-white">
      <EnterpriseHeader
        center={<span>Enterprise · Risk intelligence</span>}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="mb-8 max-w-2xl">
          <div className="q-blur-reveal mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur">
            <Building2 className="h-3.5 w-3.5 text-[#93c5fd]" />
            Underwriting console
          </div>
          <h1 className="q-blur-reveal q-blur-reveal-delay-1 text-3xl font-semibold tracking-tight md:text-4xl">
            Portfolio risk overview
          </h1>
          <div
            aria-hidden
            className="q-rule mt-3 h-px w-40 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            style={{ animationDelay: "0.6s" }}
          />
          <p className="q-blur-reveal q-blur-reveal-delay-2 mt-3 text-sm leading-relaxed text-white/55">
            Live scores and financial exposure from USGS catalog data (2000–2023)
            and Scripps Rekoske physics-based factors — same model as the public
            risk assessment flow.
          </p>
        </div>

        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {!err && (!fp || !rs) && (
          <p className="text-sm text-white/45">Loading assessment data…</p>
        )}

        {fp && rs && (
          <>
            <RevealGroup
              step={0.11}
              delayChildren={0.1}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <RevealItem>
                <div className="q-shadow-soft q-pressable group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0F172A] p-5 transition-colors hover:border-white/[0.15] hover:bg-[#111e33]">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#1A56DB]/0 blur-2xl transition-colors duration-500 group-hover:bg-[#1A56DB]/20"
                  />
                  <p className="relative text-[11px] font-semibold uppercase tracking-wide text-white/40">
                    Flagship asset risk index
                  </p>
                  <p className="relative mt-2 text-3xl font-bold tabular-nums text-white">
                    {rs.overall}
                    <span className="text-lg font-medium text-white/35">/100</span>
                  </p>
                  <p className="relative mt-1 text-xs text-white/45">HSS · demo deep-dive available</p>
                </div>
              </RevealItem>
              <RevealItem>
                <div className="q-shadow-soft q-pressable group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0F172A] p-5 transition-colors hover:border-white/[0.15] hover:bg-[#111e33]">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#1A56DB]/0 blur-2xl transition-colors duration-500 group-hover:bg-[#1A56DB]/20"
                  />
                  <p className="relative text-[11px] font-semibold uppercase tracking-wide text-white/40">
                    Catalog events (50 km)
                  </p>
                  <p className="relative mt-2 text-3xl font-bold text-[#1A56DB]">
                    {fp.events_analyzed.toLocaleString()}
                  </p>
                  <p className="relative mt-1 text-xs text-white/45">{fp.years_of_data} years of USGS records</p>
                </div>
              </RevealItem>
              <RevealItem>
                <div className="q-shadow-soft q-pressable group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0F172A] p-5 transition-colors hover:border-white/[0.15] hover:bg-[#111e33]">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#1A56DB]/0 blur-2xl transition-colors duration-500 group-hover:bg-[#1A56DB]/20"
                  />
                  <p className="relative text-[11px] font-semibold uppercase tracking-wide text-white/40">
                    Est. annual premium (HSS)
                  </p>
                  <p className="relative mt-2 text-3xl font-bold tabular-nums text-white">
                    ${ins?.annual_premium.toLocaleString() ?? "—"}
                  </p>
                  <p className="relative mt-1 text-xs text-white/45">{ins?.tier ?? "—"}</p>
                </div>
              </RevealItem>
              <RevealItem>
                <div className="q-shadow-soft q-pressable group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0F172A] p-5 transition-colors hover:border-white/[0.15] hover:bg-[#111e33]">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#1A56DB]/0 blur-2xl transition-colors duration-500 group-hover:bg-[#1A56DB]/20"
                  />
                  <p className="relative text-[11px] font-semibold uppercase tracking-wide text-white/40">
                    10-yr net position (model)
                  </p>
                  <p
                    className={`relative mt-2 text-3xl font-bold tabular-nums ${
                      y10 && y10.net_position >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {y10 != null
                      ? `$${y10.net_position.toLocaleString()}`
                      : "—"}
                  </p>
                  <p className="relative mt-1 text-xs text-white/45">Cumulative premium − expected claims</p>
                </div>
              </RevealItem>
            </RevealGroup>

            <Reveal index={1} className="mt-10 grid gap-4 md:grid-cols-3">
              <Link
                href="/enterprise/dashboard"
                className="q-shadow-accent q-pressable group flex flex-col justify-between rounded-2xl border border-[#1A56DB]/35 bg-[#1A56DB]/10 p-6 transition-colors hover:border-[#1A56DB]/55 hover:bg-[#1A56DB]/15"
              >
                <div>
                  <div className="flex items-center gap-2 text-[#93c5fd]">
                    <BarChart3 className="h-5 w-5" aria-hidden />
                    <span className="text-sm font-semibold">Portfolio dashboard</span>
                  </div>
                  <p className="mt-2 text-sm text-white/55">
                    Four insured UCSD properties, tiers, premiums, and drill-down
                    into HSS.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#93c5fd]">
                  Open portfolio
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                href="/enterprise/building/hss"
                className="q-shadow-soft q-pressable group flex flex-col justify-between rounded-2xl border border-white/[0.1] bg-[#0F172A] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div>
                  <div className="flex items-center gap-2 text-white">
                    <Building2 className="h-5 w-5 text-[#1A56DB]" aria-hidden />
                    <span className="text-sm font-semibold">HSS building detail</span>
                  </div>
                  <p className="mt-2 text-sm text-white/55">
                    Criteria tables, interior hazards, financial projections, and
                    historical seismic chart — fed by the API.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#1A56DB]">
                  View HSS report
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                href="/risk/results"
                className="q-shadow-soft q-pressable group flex flex-col justify-between rounded-2xl border border-white/[0.1] bg-[#0F172A] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div>
                  <span className="text-sm font-semibold text-white/90">
                    Consumer parity view
                  </span>
                  <p className="mt-2 text-sm text-white/55">
                    Same risk score UI as public B2C flow for side-by-side demos.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white/70">
                  Open B2C results
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>

            <p className="mx-auto mt-14 max-w-2xl text-center text-[11px] leading-relaxed text-slate-500">
              Analysis based on {fp.events_analyzed.toLocaleString()} USGS earthquake
              records (2000–2023) and Scripps Rekoske physics-based simulations.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
