"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { RiskSpeedometer } from "@/components/risk/RiskSpeedometer";
import {
  getFinancialProjection,
  getRiskScore,
  type FinancialProjectionResponse,
  type RiskCriterionBlock,
  type RiskScoreResponse,
} from "@/lib/api";

const BAR_DATA = [
  { year: 2000, count: 45 },
  { year: 2001, count: 38 },
  { year: 2002, count: 42 },
  { year: 2003, count: 51 },
  { year: 2004, count: 39 },
  { year: 2005, count: 44 },
  { year: 2006, count: 37 },
  { year: 2007, count: 48 },
  { year: 2008, count: 53 },
  { year: 2009, count: 41 },
  { year: 2010, count: 89 },
  { year: 2011, count: 46 },
  { year: 2012, count: 43 },
  { year: 2013, count: 52 },
  { year: 2014, count: 47 },
  { year: 2015, count: 39 },
  { year: 2016, count: 44 },
  { year: 2017, count: 38 },
  { year: 2018, count: 55 },
  { year: 2019, count: 142 },
  { year: 2020, count: 48 },
  { year: 2021, count: 44 },
  { year: 2022, count: 41 },
  { year: 2023, count: 39 },
];

function hazardSource(name: string): string {
  if (name.includes("PGV")) return "Scripps Rekoske ML Model";
  if (name.includes("Fault")) return "USGS Fault Database";
  if (name.includes("Soil")) return "USGS National Seismic Hazard Map";
  if (name.includes("Historical M5")) return "USGS Earthquake Catalog 2000-2023";
  return "—";
}

function vulnSource(name: string): string {
  if (name.includes("Year")) return "UCSD Facilities Records";
  if (name.includes("Construction")) return "Visual Assessment + Historical Records";
  if (name.includes("Height")) return "Building Survey";
  if (name.includes("Ceiling") || name.includes("Hazards"))
    return "SeismoShield Photo Analysis — HSS 1345";
  return "—";
}

function riskBadge(risk: string): string {
  const u = risk.toUpperCase();
  if (u === "SEVERE") return "bg-[#DC2626]/25 text-red-200";
  if (u === "HIGH") return "bg-[#EA580C]/25 text-orange-200";
  return "bg-[#CA8A04]/25 text-yellow-100";
}

export default function EnterpriseHSSPage() {
  const router = useRouter();
  const [fp, setFp] = useState<FinancialProjectionResponse | null>(null);
  const [rs, setRs] = useState<RiskScoreResponse | null>(null);
  const [horizon, setHorizon] = useState<1 | 3 | 5 | 10>(10);
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
        if (!c) setErr(e instanceof Error ? e.message : "Load failed");
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const chartData = useMemo(() => fp?.yearly_projections ?? [], [fp]);

  const horizonRow = useMemo(() => {
    if (!chartData.length) return null;
    const idx = Math.min(horizon, chartData.length) - 1;
    return chartData[idx];
  }, [chartData, horizon]);

  const toast = (msg: string) => window.alert(msg);

  if (err) {
    return (
      <div className="min-h-screen bg-[#0F172A] px-4 pt-24 text-red-300">
        {err}
      </div>
    );
  }

  if (!fp || !rs) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A] text-white/60">
        Loading…
      </div>
    );
  }

  const totalRetrofit = fp.interior_hazards.reduce((s, h) => s + h.cost, 0);

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] bg-[#0F172A] px-4 py-4 md:px-8">
        <span className="text-sm font-semibold text-[#1A56DB]">
          SeismoShield Enterprise
        </span>
        <span className="text-sm text-white/70">Portfolio → HSS Building</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline text-white/50">demo@seismoshield.com</span>
          <button
            type="button"
            onClick={() => router.push("/enterprise/login")}
            className="rounded-lg border border-white/15 px-3 py-1 text-white/80"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Link
          href="/enterprise/dashboard"
          className="mb-6 inline-flex text-sm text-white/60 hover:text-white"
        >
          ← Back to Portfolio
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0F172A] p-6">
            <h1 className="text-2xl font-bold">HSS Building — Room 1345</h1>
            <p className="mt-1 text-white/70">
              Muir College, UC San Diego, La Jolla CA 92093
            </p>
            <p className="mt-2 text-sm text-white/50">
              8-story Brutalist Concrete Structure — Built 1970
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-red-200">
                🔴 Tier 1 Specialist
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5">
                📅 Last Assessed: Today
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-200">
                ⚠️ Active Policy
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-white/70">
              <p>Year Built: 1970</p>
              <p>Stories: 8</p>
              <p>Construction: Brutalist Concrete</p>
              <p>Floor Area: ~16,000 sqft</p>
              <p>Vs30 Soil: 280 m/s</p>
              <p>Nearest Fault: Rose Canyon 8km</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0F172A] p-6">
            <RiskSpeedometer score={rs.overall} size={160} />
            <div className="mt-4 w-full max-w-xs space-y-2">
              <div>
                <div className="flex justify-between text-[11px] text-white/50">
                  <span>Seismic Hazard</span>
                  <span>{rs.seismic_hazard.score}/100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#EA580C]"
                    style={{ width: `${rs.seismic_hazard.score}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-white/50">
                  <span>Building Vulnerability</span>
                  <span>{rs.building_vulnerability.score}/100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#DC2626]"
                    style={{ width: `${rs.building_vulnerability.score}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-white/50">
                  <span>Historical Record</span>
                  <span>{rs.historical_record.score}/100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#EA580C]"
                    style={{ width: `${rs.historical_record.score}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk criteria tables */}
        <section className="mt-12 space-y-6">
          <h2 className="text-lg font-semibold">Risk criteria</h2>
          <CriteriaTable
            title="Seismic Hazard (40%)"
            block={rs.seismic_hazard}
            sourceFn={hazardSource}
            footer="Seismic hazard stable — no significant change in fault activity"
          />
          <CriteriaTable
            title="Building Vulnerability (35%)"
            block={rs.building_vulnerability}
            sourceFn={vulnSource}
            footer="⚠️ Vulnerability INCREASING — ceiling water damage identified in recent assessment"
          />
          <CriteriaTable
            title="Historical Record (25%)"
            block={rs.historical_record}
            sourceFn={() => "USGS Earthquake Hazards Program"}
            footer="Historical risk elevated — 3,500+ seismic events recorded near site since 2000"
          />
        </section>

        {/* Interior hazards */}
        <section className="mt-12">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">Interior Hazard Analysis</h2>
            <span className="rounded-full bg-[#1A56DB]/20 px-2 py-0.5 text-[11px] text-[#93c5fd]">
              SeismoShield Photo Assessment
            </span>
          </div>
          <p className="mt-1 text-sm text-white/50">
            Based on visual inspection of HSS Room 1345 — April 2026
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white/[0.04] text-[11px] uppercase text-white/45">
                <tr>
                  <th className="px-3 py-2">Hazard</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Risk</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Est. cost</th>
                </tr>
              </thead>
              <tbody>
                {fp.interior_hazards.map((h) => (
                  <tr key={h.hazard} className="border-t border-white/[0.06]">
                    <td className="px-3 py-2">{h.hazard}</td>
                    <td className="px-3 py-2 text-white/70">{h.location}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 text-[11px] ${riskBadge(h.risk)}`}>
                        {h.risk}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-white/75">{h.action}</td>
                    <td className="px-3 py-2 tabular-nums">${h.cost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm font-medium text-white/80">
            Total Estimated Retrofit Cost: ${totalRetrofit.toLocaleString()}
          </p>
          <div className="mt-4 rounded-xl border border-[#1A56DB]/30 bg-[#1A56DB]/10 p-4 text-sm text-[#bfdbfe]">
            Completing all recommended retrofits would reduce Building Vulnerability score
            from 96/100 to an estimated 68/100, reducing annual premium by approximately
            $31,000.
          </div>
        </section>

        {/* Financial chart */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Financial Projections</h2>
          <p className="text-sm text-white/55">
            Based on {fp.events_analyzed} USGS earthquake events analyzed within 50km of
            property (2000-2023)
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {([1, 3, 5, 10] as const).map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setHorizon(y)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  horizon === y
                    ? "bg-[#1A56DB] text-white"
                    : "border border-white/15 bg-white/5 text-white/70"
                }`}
              >
                {y} YR
              </button>
            ))}
          </div>
          <div className="mt-4 h-[320px] w-full rounded-xl bg-[#0F172A] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" label={{ value: "Year", fill: "#94a3b8", position: "bottom" }} />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(v) =>
                    `$${(v / 1_000_000).toFixed(1)}M`
                  }
                />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155" }}
                  formatter={(value: number) => `$${Number(value).toLocaleString()}`}
                />
                <Legend />
                <ReferenceLine y={0} stroke="#f87171" strokeDasharray="4 4" label="Break Even" />
                <ReferenceLine
                  x={horizon}
                  stroke="#1A56DB"
                  strokeDasharray="3 3"
                />
                <Line type="monotone" dataKey="cumulative_premium" name="Premium Revenue" stroke="#1A56DB" strokeWidth={2} dot={false} isAnimationActive />
                <Line type="monotone" dataKey="cumulative_claims" name="Expected Claims" stroke="#DC2626" strokeWidth={2} dot={false} isAnimationActive />
                <Line type="monotone" dataKey="net_position" name="Net Position" stroke="#16A34A" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {horizonRow && (
            <div className="mt-6 overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["Total Premium Revenue", `$${horizonRow.cumulative_premium.toLocaleString()}`],
                    ["Expected Total Claims", `$${horizonRow.cumulative_claims.toLocaleString()}`],
                    ["Net Position", `$${horizonRow.net_position.toLocaleString()}`],
                    ["Probability M5.0+", `${horizonRow.p_m5_plus}%`],
                    ["Probability M6.0+", `${horizonRow.p_m6_plus}%`],
                    ["Probability M7.0+", `${horizonRow.p_m7_plus}%`],
                    ["Worst Case Scenario", `$${horizonRow.worst_case.toLocaleString()}`],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-t border-white/[0.06]">
                      <td className="px-3 py-2 text-white/60">{k}</td>
                      <td className="px-3 py-2 text-right font-medium">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-xs text-white/65">
            <p className="font-semibold text-white/80">Based on USGS data analysis:</p>
            <p>M4.0+ events per year: {fp.annual_rates.m4_plus}</p>
            <p>M5.0+ events per year: {fp.annual_rates.m5_plus}</p>
            <p>M6.0+ events per year: {fp.annual_rates.m6_plus}</p>
            <p>M7.0+ events per year: {fp.annual_rates.m7_plus}</p>
          </div>
        </section>

        {/* Bar chart historical */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold">
            Historical Seismic Activity — 50km radius from HSS
          </h2>
          <p className="text-sm text-white/50">
            Source: USGS Earthquake Hazards Program 2000-2023
          </p>
          <div className="mt-4 h-[200px] rounded-xl bg-[#0F172A] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BAR_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
                <Bar dataKey="count" fill="#1A56DB" radius={[2, 2, 0, 0]} />
                <ReferenceLine x={2010} stroke="#EA580C" label={{ value: "2010 Baja M7.2", fill: "#EA580C", fontSize: 10 }} />
                <ReferenceLine x={2019} stroke="#DC2626" label={{ value: "2019 Ridgecrest M7.1", fill: "#DC2626", fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Policy actions */}
        <section className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-4">
            <h3 className="font-semibold text-white">Current Policy</h3>
            <p className="mt-2 text-sm text-white/70">Policy Type: Earthquake Specialist</p>
            <p className="text-sm text-white/70">Coverage: $2,000,000</p>
            <p className="text-sm text-white/70">Annual Premium: $142,000</p>
            <p className="text-sm text-white/70">Renewal: Dec 31, 2026</p>
            <span className="mt-2 inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-200">
              Active
            </span>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-4">
            <h3 className="font-semibold text-white">Risk Alerts</h3>
            <ul className="mt-2 space-y-2 text-sm text-orange-200">
              <li>⚠️ Water damage detected in ceiling — immediate inspection recommended</li>
              <li>⚠️ Projector mounting not anchored to structural concrete</li>
              <li>⚠️ Mobile furniture increases injury risk — retrofit recommended</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-[#0F172A] p-4">
            <h3 className="font-semibold text-white">Actions</h3>
            <button
              type="button"
              onClick={() => toast("Request submitted. Our team will contact you within 24 hours.")}
              className="rounded-lg bg-[#1A56DB] py-2 text-sm font-medium text-white"
            >
              Request Structural Assessment
            </button>
            <button
              type="button"
              onClick={() => toast("Redirecting to coverage adjustment portal...")}
              className="rounded-lg border border-white/15 py-2 text-sm text-white/85"
            >
              Adjust Coverage Limits
            </button>
            <button
              type="button"
              onClick={() => {
                window.setTimeout(() => {
                  toast("✓ Report ready — check your email at demo@seismoshield.com");
                }, 1500);
              }}
              className="rounded-lg border border-white/15 py-2 text-sm text-white/85"
            >
              Download Full Report
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function CriteriaTable({
  title,
  block,
  sourceFn,
  footer,
}: {
  title: string;
  block: RiskCriterionBlock;
  sourceFn: (name: string) => string;
  footer: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0F172A] p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-lg font-semibold tabular-nums">{block.score}/100</span>
      </div>
      <div className="mt-2 h-2 max-w-xs overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#EA580C]"
          style={{ width: `${block.score}%` }}
        />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="text-white/45">
            <tr>
              <th className="py-2">Factor</th>
              <th className="py-2">Value</th>
              <th className="py-2">Score</th>
              <th className="py-2">Level</th>
              <th className="py-2">Data Source</th>
            </tr>
          </thead>
          <tbody>
            {block.sub_factors.map((sf) => (
              <tr key={sf.name} className="border-t border-white/[0.06]">
                <td className="py-2 pr-2 text-white/90">{sf.name}</td>
                <td className="py-2 text-white/65">{sf.value}</td>
                <td className="py-2 tabular-nums">{sf.score}</td>
                <td className="py-2">{sf.level}</td>
                <td className="py-2 text-white/50">{sourceFn(sf.name)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-white/55">{footer}</p>
    </div>
  );
}
