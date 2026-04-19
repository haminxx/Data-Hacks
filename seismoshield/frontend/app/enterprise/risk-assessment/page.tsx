"use client";

import { Building2 } from "lucide-react";

export default function EnterpriseRiskAssessmentPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0F172A] px-6 pt-24 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,86,219,0.12)_0%,rgba(15,23,42,0)_60%)]"
      />

      <div className="relative z-10 max-w-xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur">
          <Building2 className="h-3.5 w-3.5 text-[#93c5fd]" />
          Enterprise · Risk Assessment
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
          Welcome to the console.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          This page is intentionally empty for now. Portfolio-level risk
          scoring, dynamic insurance pricing, and per-asset fragility curves
          will live here.
        </p>
      </div>
    </div>
  );
}
