"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const ROWS = [
  {
    id: "hss",
    building: "HSS Building — Room 1345",
    address: "Muir College, UCSD, La Jolla CA",
    score: 78,
    tier: "Tier 1 — Specialist",
    tierClass: "bg-[#DC2626]/20 text-red-200 ring-1 ring-red-500/40",
    premium: "$142,000",
    active: true,
  },
  {
    id: "geisel",
    building: "Geisel Library",
    address: "UC San Diego, La Jolla CA",
    score: 71,
    tier: "Tier 2 — High Risk",
    tierClass: "bg-[#EA580C]/20 text-orange-200 ring-1 ring-orange-500/40",
    premium: "$98,000",
    active: false,
  },
  {
    id: "price",
    building: "Price Center",
    address: "UC San Diego, La Jolla CA",
    score: 65,
    tier: "Tier 2 — High Risk",
    tierClass: "bg-[#EA580C]/20 text-orange-200 ring-1 ring-orange-500/40",
    premium: "$76,000",
    active: false,
  },
  {
    id: "torrey",
    building: "Torrey Pines Residence Hall",
    address: "La Jolla, CA 92037",
    score: 42,
    tier: "Tier 3 — Standard",
    tierClass: "bg-[#CA8A04]/20 text-yellow-100 ring-1 ring-yellow-500/40",
    premium: "$31,000",
    active: false,
  },
];

function barColor(score: number): string {
  if (score >= 75) return "bg-[#DC2626]";
  if (score >= 60) return "bg-[#EA580C]";
  return "bg-[#CA8A04]";
}

export default function EnterpriseDashboardPage() {
  const router = useRouter();

  const toast = (msg: string) => window.alert(msg);

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] bg-[#0F172A] px-4 py-4 md:px-8">
        <span className="text-sm font-semibold text-[#1A56DB] md:text-base">
          SeismoShield Enterprise
        </span>
        <span className="text-sm text-white/80">Portfolio Overview</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-white/60 sm:inline">demo@seismoshield.com</span>
          <button
            type="button"
            onClick={() => router.push("/enterprise/login")}
            className="rounded-lg border border-white/15 px-3 py-1 text-white/80 hover:bg-white/5"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Properties", value: "4", icon: "🏢", color: "text-[#1A56DB]" },
            { label: "High/Severe Risk", value: "3", icon: "⚠️", color: "text-red-400" },
            { label: "Portfolio Value", value: "$48M", icon: "💰", color: "text-slate-300" },
            { label: "Annual Claims Exposure", value: "$2.1M", icon: "📊", color: "text-orange-300" },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-4"
            >
              <span className="text-2xl">{c.icon}</span>
              <p className={`mt-2 text-2xl font-bold ${c.color}`}>{c.value}</p>
              <p className="mt-1 text-xs text-white/45">{c.label}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-lg font-semibold text-white">Insured Properties</h2>
        <input
          type="search"
          placeholder="Search properties..."
          className="mt-3 w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35"
        />

        <div className="mt-6 overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-white/[0.08] bg-white/[0.04] text-[11px] uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-4 py-3">Building</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Risk Score</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Annual Premium</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr
                  key={r.id}
                  className={`border-b border-white/[0.06] ${
                    r.id === "hss" ? "border-l-4 border-l-[#1A56DB] bg-[#1A56DB]/5" : ""
                  } ${r.active ? "cursor-pointer hover:bg-white/[0.03]" : ""}`}
                  onClick={() => {
                    if (r.active) router.push("/enterprise/building/hss");
                  }}
                >
                  <td className="px-4 py-4 font-medium text-white">{r.building}</td>
                  <td className="px-4 py-4 text-white/65">{r.address}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums">{r.score}/100</span>
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${barColor(r.score)}`}
                          style={{ width: `${r.score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${r.tierClass}`}>
                      {r.tier}
                    </span>
                  </td>
                  <td className="px-4 py-4 tabular-nums text-white/85">{r.premium}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-200">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {r.active ? (
                      <Link
                        href="/enterprise/building/hss"
                        className="text-[#1A56DB] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Details →
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="text-slate-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast("Available in full version");
                        }}
                      >
                        View Details →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
