"use client";

import dynamic from "next/dynamic";

// Three.js touches `window` on import, so the panorama viewer is client-only.
const Panorama360 = dynamic(() => import("@/components/Panorama360"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#050814] text-sm text-white/60">
      Loading 360° environment…
    </div>
  ),
});

export default function SimulatorPage() {
  return (
    <div className="relative mt-16 h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#050814]">
      {/* Equirectangular panorama on an inverted sphere — lightweight
          drop-in texture instead of a streamed GLB. */}
      <Panorama360 modelUrl={null} textureUrl="/pano/classroom-360.png" />

      <div className="pointer-events-none absolute left-4 top-4 z-20 max-w-xs rounded-2xl border border-white/10 bg-black/55 p-4 text-white backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
          Quarte · Simulator
        </p>
        <p className="mt-1 text-lg font-semibold">360° Environment</p>
        <p className="mt-2 text-xs leading-relaxed text-white/70">
          Click-drag to look around. Tap any hotspot to open its card. Click
          anywhere on the image — the exact{" "}
          <span className="font-mono text-white/85">[x, y, z]</span>{" "}
          coordinates print to the console so you can place more hotspots.
        </p>
      </div>
    </div>
  );
}
