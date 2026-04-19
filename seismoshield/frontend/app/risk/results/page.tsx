"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronDown,
  Droplets,
  Gauge,
  MapPin,
  Mountain,
  Shield,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { HSSBuildingPreview } from "@/components/risk/HSSBuildingPreview";
import {
  RiskSpeedometer,
  useAnimatedRiskScore,
} from "@/components/risk/RiskSpeedometer";
import { Reveal } from "@/components/ui/Reveal";
import {
  getFinancialProjection,
  getRiskScore,
  type FinancialProjectionResponse,
  type RiskCriterionBlock,
  type RiskScoreResponse,
} from "@/lib/api";

function levelTone(level: string): string {
  const l = level.toLowerCase();
  if (l.includes("severe")) return "bg-[#DC2626]/20 text-[#fca5a5] ring-1 ring-[#DC2626]/40";
  if (l.includes("high")) return "bg-[#EA580C]/20 text-[#fdba74] ring-1 ring-[#EA580C]/40";
  if (l.includes("moderate"))
    return "bg-[#CA8A04]/20 text-[#fde047] ring-1 ring-[#CA8A04]/40";
  return "bg-[#16A34A]/20 text-[#86efac] ring-1 ring-[#16A34A]/40";
}

function barColor(criterion: "hazard" | "vuln" | "hist"): string {
  if (criterion === "vuln") return "bg-[#DC2626]";
  return "bg-[#EA580C]";
}

function riskTierTextClass(overall: number): string {
  if (overall >= 75) return "text-[#fca5a5]";
  if (overall >= 50) return "text-[#fdba74]";
  if (overall >= 35) return "text-[#fde047]";
  return "text-[#86efac]";
}

/** Equal-height horizontal strip (wireframe right column). */
function CriterionStrip({
  title,
  block,
  criterionKey,
  className,
}: {
  title: string;
  block: RiskCriterionBlock;
  criterionKey: "hazard" | "vuln" | "hist";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`flex shrink-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.035] shadow-sm ring-1 ring-white/[0.03] ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-2.5 pb-1.5 pt-2 text-left transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1A56DB]/45"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold leading-tight text-white">
            {title}
          </p>
          <p className="mt-0.5 text-[9px] text-white/38">
            {block.weight}% of composite
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-sm font-semibold tabular-nums text-white">
            {block.score}
            <span className="text-[11px] font-normal text-white/35">/100</span>
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-white/35 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </div>
      </button>
      <div className="px-2.5 pb-2 pt-0">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.09]">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor(criterionKey)}`}
            style={{ width: `${block.score}%` }}
          />
        </div>
      </div>
      {open && (
        <ul className="max-h-[min(50vh,220px)] space-y-1.5 overflow-y-auto border-t border-white/[0.06] bg-black/20 px-2.5 py-2">
          {block.sub_factors.map((sf) => (
            <li
              key={sf.name}
              className="rounded-lg border border-white/[0.05] bg-[#0b1224]/90 px-2.5 py-2 text-xs text-white/80"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-white/95">{sf.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${levelTone(sf.level)}`}
                >
                  {sf.level}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-snug text-white/55">
                {sf.value}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-white/25 to-white/50"
                  style={{ width: `${sf.score}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function RiskResultsPage() {
  const [fp, setFp] = useState<FinancialProjectionResponse | null>(null);
  const [rs, setRs] = useState<RiskScoreResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const animatedOverall = useAnimatedRiskScore(rs?.overall ?? 0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, b] = await Promise.all([
          getFinancialProjection(),
          getRiskScore(),
        ]);
        if (!cancelled) {
          setFp(a);
          setRs(b);
        }
      } catch (e) {
        if (!cancelled)
          setErr(e instanceof Error ? e.message : "Could not load risk data.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = (msg: string) => {
    window.alert(msg);
  };

  if (err) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center hero-gradient-mesh px-4 pt-24 text-white">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-6 py-8 text-center shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]">
          <p className="text-sm font-medium text-red-200/95">{err}</p>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            Start the API with{" "}
            <code className="rounded-md bg-black/30 px-1.5 py-0.5 text-[13px] text-[#93c5fd]">
              uvicorn main:app --reload
            </code>{" "}
            in{" "}
            <code className="rounded-md bg-black/30 px-1.5 py-0.5 text-[13px]">
              seismoshield/backend
            </code>
            .
          </p>
          <Link
            href="/risk"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to address
          </Link>
        </div>
      </div>
    );
  }

  if (!fp || !rs) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center hero-gradient-mesh pt-20 text-white">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-[#1A56DB]/30 border-t-[#1A56DB]"
            aria-hidden
          />
          <p className="text-sm text-white/55">Loading assessment…</p>
          <p className="text-[11px] text-white/35">Fetching risk score &amp; projections</p>
        </div>
      </div>
    );
  }

  const ins = fp.insurance_recommendation;
  const label =
    rs.overall >= 75
      ? "SEVERE RISK"
      : rs.overall >= 50
        ? "HIGH RISK"
        : "ELEVATED RISK";

  return (
    <div className="min-h-screen hero-gradient-mesh pb-20 pt-20 text-white">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
          <div>
            <div className="q-blur-reveal mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#93c5fd]/90">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Assessment report
            </div>
            <h1 className="q-blur-reveal q-blur-reveal-delay-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              HSS · Seismic risk
            </h1>
            <div
              aria-hidden
              className="q-rule mt-2 h-px w-28 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              style={{ animationDelay: "0.55s" }}
            />
            <p className="q-blur-reveal q-blur-reveal-delay-2 mt-1 text-sm text-white/50">
              Composite score and criteria from USGS catalog + model factors
            </p>
          </div>
          <Link
            href="/risk"
            className="q-blur-reveal q-blur-reveal-delay-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-sm text-white/75 backdrop-blur-sm transition hover:border-white/15 hover:bg-white/[0.07] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 opacity-80" />
            Edit address
          </Link>
        </div>
      </div>

      {/* Row 1: 3D + risk stack. Row 2: building + insurance (shared grid for alignment). */}
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <div className="flex flex-col gap-5 lg:gap-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch lg:gap-x-8">
            <Reveal
              index={0}
              inView={false}
              className="flex min-h-[20rem] flex-col lg:h-full lg:min-h-0"
            >
              <HSSBuildingPreview
                fillGridCell
                className="min-h-0 flex-1"
              />
            </Reveal>

            <Reveal index={1} inView={false} className="flex h-full min-h-0 flex-col">
            <section
              aria-label="Risk breakdown"
              className="flex h-full min-h-0 flex-col rounded-2xl border border-white/[0.1] bg-[#0b1224]/90 p-2.5 ring-1 ring-white/[0.05] q-shadow-lux lg:overflow-y-auto"
            >
            <p className="mb-1.5 shrink-0 px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Risk index
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="shrink-0 rounded-xl border border-[#1A56DB]/30 bg-gradient-to-br from-[#1A56DB]/[0.12] via-[#0b1224]/55 to-[#050814]/85 px-2.5 py-2 ring-1 ring-[#1A56DB]/20 sm:px-3 sm:py-2.5">
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div className="shrink-0">
                    <RiskSpeedometer
                      score={rs.overall}
                      label=""
                      size={112}
                      showFooter={false}
                      className="!max-w-none !items-start"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center border-l border-white/[0.08] pl-2.5 sm:pl-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">
                      Overall risk index
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums leading-none tracking-tight text-white sm:text-[1.75rem]">
                      {animatedOverall}
                      <span className="text-sm font-medium text-white/35">
                        {" "}
                        / 100
                      </span>
                    </p>
                    <p
                      className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${riskTierTextClass(rs.overall)}`}
                    >
                      {label}
                    </p>
                  </div>
                </div>
              </div>

              <CriterionStrip
                title="Seismic Hazard"
                block={rs.seismic_hazard}
                criterionKey="hazard"
              />
              <CriterionStrip
                title="Building Vulnerability"
                block={rs.building_vulnerability}
                criterionKey="vuln"
              />
              <CriterionStrip
                title="Historical Record"
                block={rs.historical_record}
                criterionKey="hist"
              />
            </div>
          </section>
            </Reveal>
          </div>

          <Reveal index={2} className="rounded-2xl border border-white/[0.09] bg-[#0b1224]/70 p-5 q-shadow-soft backdrop-blur-sm lg:flex lg:min-h-0 lg:flex-col">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4">
              <Building2 className="h-5 w-5 text-[#1A56DB]" aria-hidden />
              <div>
                <p className="text-[15px] font-semibold text-white">
                  HSS Room 1345
                </p>
                <p className="mt-0.5 flex items-start gap-1.5 text-[13px] text-white/55">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/35" />
                  Muir College, UC San Diego, La Jolla CA 92093
                </p>
              </div>
            </div>
            <dl className="mt-4 grid flex-1 gap-3 text-[13px] sm:grid-cols-2">
              <div className="flex gap-2 rounded-lg bg-white/[0.03] px-3 py-2.5">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-white/40">
                    Built
                  </dt>
                  <dd className="text-white/85">1970</dd>
                </div>
              </div>
              <div className="flex gap-2 rounded-lg bg-white/[0.03] px-3 py-2.5">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-white/40">
                    Type
                  </dt>
                  <dd className="text-white/85">Brutalist concrete · 8 stories</dd>
                </div>
              </div>
              <div className="flex gap-2 rounded-lg bg-white/[0.03] px-3 py-2.5 sm:col-span-2">
                <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-white/40">
                    Condition
                  </dt>
                  <dd className="text-white/75">
                    Pre-existing ceiling water damage documented
                  </dd>
                </div>
              </div>
              <div className="flex gap-2 rounded-lg bg-white/[0.03] px-3 py-2.5">
                <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-white/40">
                    Vs30 soil
                  </dt>
                  <dd className="text-white/85">280 m/s (medium stiff)</dd>
                </div>
              </div>
              <div className="flex gap-2 rounded-lg bg-white/[0.03] px-3 py-2.5">
                <Mountain className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-white/40">
                    Faults
                  </dt>
                  <dd className="text-white/85">
                    Rose Canyon ~8 km · Salton Sea ~185 km
                  </dd>
                </div>
              </div>
            </dl>
          </Reveal>

          <Reveal index={3} className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1A56DB]/25 bg-[#0b1224] p-5 q-shadow-accent lg:h-full">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#1A56DB]/10 blur-3xl"
            />
            <div className="relative flex flex-1 flex-col">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A56DB]/15 ring-1 ring-[#1A56DB]/25">
                  <Shield className="h-5 w-5 text-[#93c5fd]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                    Insurance guidance
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#fca5a5]">
                    {ins.tier}
                  </p>
                  <p className="mt-1 text-sm text-white/75">{ins.policy_type}</p>
                </div>
              </div>
              <div className="relative mt-5 grid gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-white/50">Minimum coverage</span>
                  <span className="font-semibold tabular-nums text-white">
                    ${ins.minimum_coverage.toLocaleString()}+
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-t border-white/[0.06] pt-3">
                  <span className="text-white/50">Est. premium</span>
                  <span className="text-right font-semibold tabular-nums text-white">
                    {ins.premium_multiplier}× base (~$
                    {ins.annual_premium.toLocaleString()}
                    /yr)
                  </span>
                </div>
              </div>
              <div className="relative mt-5 flex min-h-0 flex-1 flex-col">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                  Recommended actions
                </p>
                <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto">
                  {ins.action_items.map((a) => (
                    <li
                      key={a}
                      className="flex gap-2 rounded-lg border border-[#EA580C]/15 bg-[#EA580C]/[0.06] px-3 py-2 text-[13px] leading-snug text-[#fdba74]"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#EA580C]" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="relative mt-4 text-[11px] leading-relaxed text-white/40">
                Share this Quarte summary with your insurance provider when
                requesting a quote.
              </p>
              <button
                type="button"
                onClick={() => showToast("Connecting you to a specialist...")}
                className="relative mt-4 w-full rounded-xl bg-[#1A56DB] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1A56DB]/20 transition hover:bg-[#1647b3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A56DB]"
              >
                Get insurance quote
              </button>
            </div>
          </Reveal>
        </div>
      </div>

      <p className="mx-auto mt-14 max-w-2xl px-4 text-center text-[11px] leading-relaxed text-slate-500">
        Analysis based on {fp.events_analyzed.toLocaleString()} USGS earthquake
        records (2000–2023) and Scripps Rekoske physics-based simulations.
      </p>
    </div>
  );
}
