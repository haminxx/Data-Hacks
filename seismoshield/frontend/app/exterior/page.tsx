"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { RiskCard } from "@/components/RiskCard";
import {
  getDemo,
  getInsurance,
  type DemoResponse,
  type InsuranceResponse,
} from "@/lib/api";

const BUILDING_NAME = "UCSD Recreation Center";
const ADDRESS = "9500 Gilman Dr, La Jolla, CA 92093";
const STREET_VIEW_LOC = "32.8786,-117.2364";

const SeismoMap = dynamic(() => import("@/components/SeismoMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[min(70vh,560px)] w-full items-center justify-center rounded-xl border border-white/10 bg-[#0b1224] text-sm text-white/50"
      aria-hidden
    >
      Loading map…
    </div>
  ),
});

function RiskCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-xl border border-white/10 bg-[#0b1224] p-5"
      aria-hidden
    >
      <div className="h-8 w-40 rounded bg-white/10" />
      <div className="mt-4 h-4 w-full max-w-xs rounded bg-white/10" />
      <div className="mt-3 h-3 w-full rounded bg-white/5" />
      <div className="mt-2 h-3 w-5/6 rounded bg-white/5" />
      <div className="mt-6 h-3 w-48 rounded bg-white/10" />
      <div className="mt-2 space-y-2">
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-4/5 rounded bg-white/5" />
      </div>
      <div className="mt-6 h-8 w-56 rounded-full bg-white/10" />
    </div>
  );
}

export default function ExteriorPage() {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
  const streetViewSrc = mapsKey
    ? `https://www.google.com/maps/embed/v1/streetview?key=${encodeURIComponent(mapsKey)}&location=${STREET_VIEW_LOC}&heading=210&pitch=0&fov=90`
    : null;

  const [demo, setDemo] = useState<DemoResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [insurance, setInsurance] = useState<InsuranceResponse | null>(null);
  const [insuranceError, setInsuranceError] = useState<string | null>(null);
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDemo()
      .then((data) => {
        if (!cancelled) setDemo(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message ?? "Could not load demo scenario.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openInsurance = useCallback(async () => {
    if (
      demo?.magnitude == null ||
      demo.epicenter_lat == null ||
      demo.epicenter_lon == null
    ) {
      setInsuranceError("Demo scenario is missing epicenter or magnitude.");
      setInsuranceOpen(true);
      return;
    }
    setInsuranceOpen(true);
    setInsuranceLoading(true);
    setInsuranceError(null);
    setInsurance(null);
    try {
      const data = await getInsurance(
        Number(demo.magnitude),
        Number(demo.epicenter_lat),
        Number(demo.epicenter_lon),
      );
      setInsurance(data);
    } catch (e) {
      setInsuranceError(
        e instanceof Error ? e.message : "Insurance request failed.",
      );
    } finally {
      setInsuranceLoading(false);
    }
  }, [demo]);

  const closeInsurance = useCallback(() => {
    setInsuranceOpen(false);
  }, []);

  const riskProps =
    demo &&
    typeof demo.pgv === "number" &&
    demo.tier &&
    demo.color &&
    demo.description &&
    Array.isArray(demo.building_tips) ? (
      <RiskCard
        pgv={demo.pgv}
        tier={String(demo.tier)}
        color={String(demo.color)}
        description={String(demo.description)}
        building_tips={demo.building_tips as string[]}
      />
    ) : null;

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl flex-1">
        <PageHeader
          eyebrow="Building intelligence"
          title={BUILDING_NAME}
          description="Street-level view and live demo risk for the Salton Sea scenario. Next: simulator or insurance detail."
          breadcrumbs={[
            { href: "/", label: "Home" },
            { href: "/exterior", label: "Building" },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-start">
        <div className="group min-h-[240px] overflow-hidden rounded-2xl border border-white/[0.08] bg-black/25 shadow-card ring-1 ring-white/[0.04] transition hover:ring-brand/20 sm:min-h-[320px] lg:min-h-[420px]">
          {streetViewSrc ? (
            <iframe
              title="Street View — UCSD Recreation Center"
              src={streetViewSrc}
              className="h-[min(50vh,420px)] w-full border-0 lg:h-full lg:min-h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="flex h-[min(50vh,420px)] w-full flex-col items-center justify-center gap-3 bg-[#0b1224] p-6 text-center lg:min-h-[420px]">
              <p className="text-sm text-white/70">
                Set{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                  NEXT_PUBLIC_GOOGLE_MAPS_KEY
                </code>{" "}
                to enable Street View.
              </p>
              <a
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${STREET_VIEW_LOC}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#1A56DB] hover:underline"
              >
                Open location in Google Maps
              </a>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-white/[0.06] bg-surface-raised/40 px-4 py-3 backdrop-blur-sm">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
              Address
            </p>
            <p className="mt-1 text-sm text-white/90">{ADDRESS}</p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Scenario risk
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Data from <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">GET /demo</code>{" "}
              (M6.5 Salton Sea)
            </p>
          </div>

          {loading && <RiskCardSkeleton />}
          {!loading && loadError && (
            <p className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              {loadError}
            </p>
          )}
          {!loading && !loadError && riskProps}
          {!loading && !loadError && !riskProps && (
            <p className="text-sm text-white/60">No risk data returned from /demo.</p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/simulator"
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#1A56DB] px-5 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:bg-[#1647b3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A56DB] sm:min-w-[200px]"
            >
              Enter Earthquake Simulator
            </Link>
            <button
              type="button"
              onClick={openInsurance}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 sm:min-w-[200px]"
            >
              View Insurance Score
            </button>
          </div>

          <p className="text-center text-[11px] text-white/35 sm:text-left">
            Powered by Scripps Institution of Oceanography data
          </p>
        </div>
      </div>

      <section className="mt-12 border-t border-white/[0.08] pt-10">
        <h2 className="text-sm font-semibold text-white">Regional map</h2>
        <p className="mt-1 text-xs text-white/45">
          2.5D campus context and seismic heatmap (requires Maps API key).
        </p>
        <button
          type="button"
          onClick={() => setMapOpen((o) => !o)}
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-4 text-left transition hover:border-brand/25 hover:bg-white/[0.06]"
        >
          <span className="text-sm font-medium text-white">
            {mapOpen ? "Hide" : "Show"} 2.5D building &amp; seismic map
          </span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg text-white/70 transition ${
              mapOpen ? "bg-brand/20 text-brand-bright" : "bg-white/5"
            }`}
            aria-hidden
          >
            {mapOpen ? "−" : "+"}
          </span>
        </button>
        {mapOpen && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.06] shadow-card">
            <SeismoMap active={mapOpen} />
          </div>
        )}
      </section>
      </div>

      {insuranceOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="insurance-modal-title"
          onClick={closeInsurance}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="insurance-modal-title"
                className="text-lg font-semibold text-white"
              >
                Insurance score — {BUILDING_NAME}
              </h2>
              <button
                type="button"
                onClick={closeInsurance}
                className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {insuranceLoading && (
              <div className="mt-6 space-y-3 animate-pulse">
                <div className="h-4 rounded bg-white/10" />
                <div className="h-4 w-4/5 rounded bg-white/10" />
                <div className="h-4 w-3/5 rounded bg-white/10" />
              </div>
            )}

            {!insuranceLoading && insuranceError && (
              <p className="mt-6 text-sm text-red-300">{insuranceError}</p>
            )}

            {!insuranceLoading && insurance && !insuranceError && (
              <div className="mt-6 space-y-4 text-sm text-white/90">
                <p>
                  <span className="text-white/60">Insurance band: </span>
                  <span className="font-medium text-[#1A56DB]">
                    {insurance.insurance_tier}
                  </span>
                </p>
                <p>
                  <span className="text-white/60">Premium multiplier: </span>
                  <span className="font-semibold tabular-nums">
                    {insurance.premium_multiplier.toFixed(2)}×
                  </span>
                </p>
                <p>
                  <span className="text-white/60">Baseline PGV: </span>
                  {insurance.pgv.toFixed(1)} cm/s
                </p>
                {insurance.adjusted_pgv != null && (
                  <p>
                    <span className="text-white/60">
                      Adjusted PGV (building vulnerability):{" "}
                    </span>
                    {insurance.adjusted_pgv.toFixed(1)} cm/s
                  </p>
                )}
                {insurance.vulnerability_multiplier != null && (
                  <p className="text-xs text-white/50">
                    Vulnerability factor:{" "}
                    {insurance.vulnerability_multiplier.toFixed(2)}× (large public
                    building, ~1980s)
                  </p>
                )}
                <p className="text-white/80">{insurance.description}</p>
              </div>
            )}

            <button
              type="button"
              onClick={closeInsurance}
              className="mt-8 w-full rounded-lg border border-white/15 py-2.5 text-sm font-medium text-white/90 hover:bg-white/5"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
