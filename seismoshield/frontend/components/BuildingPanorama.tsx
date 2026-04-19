"use client";

import dynamic from "next/dynamic";
import { X } from "lucide-react";
import type { StreetViewTarget } from "./StreetView";

// Panorama360 touches `window` on import (Three.js bundles) so load it
// client-side only. Fallback is a quiet loading shell.
const Panorama360 = dynamic(() => import("./Panorama360"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0B1324]/95 text-sm text-white/60">
      Loading 360° environment…
    </div>
  ),
});

interface BuildingPanoramaProps {
  target: StreetViewTarget;
  onClose: () => void;
}

/**
 * In-map 360° panorama for buildings that we have our own interior
 * capture of (e.g. UCSD HSS). Visually mirrors the Street View chrome —
 * same header with name, coordinates, and close affordance — so the
 * interaction feels continuous with the Google-powered panes used for
 * the rest of campus.
 */
export default function BuildingPanorama({
  target,
  onClose,
}: BuildingPanoramaProps) {
  const textureUrl = target.panoramaTextureUrl ?? "/pano/hss-360.png";
  const glbUrl = target.glbUrl ?? null;

  return (
    <aside className="relative flex h-full w-full flex-col border-l border-white/10 bg-[#0B1324] text-white">
      <header className="flex items-start justify-between gap-3 border-b border-white/10 bg-[#0F172A]/80 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            Indoor 360° · Interior capture
          </p>
          <h2 className="mt-0.5 truncate text-base font-semibold text-white">
            {target.name}
          </h2>
          <p className="mt-0.5 text-xs text-white/50">
            {target.lat.toFixed(4)}°, {target.lng.toFixed(4)}°
            {typeof target.height === "number" && (
              <> · {target.height} m · SanGIS footprint</>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full border border-white/15 bg-white/5 p-1.5 text-white/80 transition hover:bg-white/10"
          aria-label="Close 360 view"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="relative flex-1">
        <Panorama360
          modelUrl={glbUrl}
          textureUrl={textureUrl}
          hotspots={[]}
        />
      </div>

      <footer className="border-t border-white/10 bg-[#0F172A]/80 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/40 backdrop-blur">
        SeismoShield · 360° site capture · Drag to look around
      </footer>
    </aside>
  );
}
