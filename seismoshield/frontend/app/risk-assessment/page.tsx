"use client";

export default function RiskAssessmentPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0F172A] px-6 pt-24 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,86,219,0.12)_0%,rgba(15,23,42,0)_60%)]"
      />

      <div className="relative z-10 max-w-xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#93c5fd]/80">
          Risk Assessment
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Coming soon.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          This page is intentionally empty for now. Building-level PGV tiers,
          fragility curves, and per-address risk reports will live here.
        </p>
      </div>
    </div>
  );
}
