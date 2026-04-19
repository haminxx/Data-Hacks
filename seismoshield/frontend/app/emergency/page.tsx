"use client";

import dynamic from "next/dynamic";

// GSAP + ScrollTrigger touch `window` on import. Keep the whole
// cinematic client-only so Next's static export doesn't blow up.
const CinematicEmergency = dynamic(
  () =>
    import("@/components/CinematicEmergency").then((m) => m.CinematicEmergency),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-[#07070c] text-sm text-white/60">
        Loading emergency console…
      </div>
    ),
  },
);

export default function EmergencyPage() {
  return (
    <div className="mt-16">
      <CinematicEmergency />
    </div>
  );
}
