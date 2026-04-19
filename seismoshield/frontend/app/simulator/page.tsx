"use client";

import dynamic from "next/dynamic";

// Three.js touches `window` on import, so this component is client-only.
const Walkthrough = dynamic(() => import("@/components/Walkthrough"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#050814] text-sm text-white/60">
      Preparing 3D walkthrough…
    </div>
  ),
});

export default function SimulatorPage() {
  return (
    <div className="relative mt-16 h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#050814]">
      <Walkthrough />

      <div className="pointer-events-none absolute left-4 top-4 z-20 max-w-xs rounded-2xl border border-white/10 bg-black/55 p-4 text-white backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
          SeismoShield · Simulator
        </p>
        <p className="mt-1 text-lg font-semibold">Building Walkthrough</p>
        <p className="mt-2 text-xs leading-relaxed text-white/70">
          Explore the 3D building model in first-person. Click to lock the
          cursor, then use WASD to walk and the mouse to look around.
        </p>
      </div>
    </div>
  );
}
