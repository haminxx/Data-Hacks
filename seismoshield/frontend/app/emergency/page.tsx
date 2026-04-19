"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

// GSAP + ScrollTrigger touch `window` on import. Keep the whole
// cinematic client-only so Next's static export doesn't blow up.
const CinematicEmergency = dynamic(
  () =>
    import("@/components/CinematicEmergency").then((m) => m.CinematicEmergency),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-[#07070c] text-sm text-white/60">
        Loading emergency console…
      </div>
    ),
  },
);

export default function EmergencyPage() {
  // While /emergency is mounted, hide the native scrollbars globally so
  // the cinematic stays flush edge-to-edge. We keep scrolling itself
  // enabled — ScrollTrigger still needs the scroll distance, we just
  // don't want the visible bar overlapping the AR view.
  useEffect(() => {
    const cls = "emergency-hide-scrollbars";
    document.documentElement.classList.add(cls);
    return () => {
      document.documentElement.classList.remove(cls);
    };
  }, []);

  return (
    <>
      {/* Scoped style tag — only applied while this page is mounted. */}
      <style>{`
        html.emergency-hide-scrollbars,
        html.emergency-hide-scrollbars body {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge legacy */
          overflow-x: hidden;
        }
        html.emergency-hide-scrollbars::-webkit-scrollbar,
        html.emergency-hide-scrollbars body::-webkit-scrollbar {
          display: none; /* Chromium + WebKit */
          width: 0;
          height: 0;
        }
      `}</style>
      {/* Offset by the 64px fixed header so Act 1 / the phone mockup
          never sit BEHIND the nav. The cinematic's own section sizes
          itself to (100vh - 4rem) via the component internals. */}
      <div className="mt-16">
        <CinematicEmergency />
      </div>
    </>
  );
}
