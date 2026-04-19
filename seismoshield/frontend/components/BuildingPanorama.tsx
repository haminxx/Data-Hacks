"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, DoorOpen, Sparkles, X } from "lucide-react";
import { useCallback, useState } from "react";
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

// The interior experience is the full emergency-prep simulator. It
// ships its own Pannellum viewer + question flow, so we lazy-load it
// (keeps the initial /map bundle smaller) and let it paint over the
// street-view panel when the user "walks inside".
const SimulatorGame = dynamic(() => import("./SimulatorGame"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0B1324]/95 text-sm text-white/60">
      Loading interior simulation…
    </div>
  ),
});

interface BuildingPanoramaProps {
  target: StreetViewTarget;
  onClose: () => void;
}

/**
 * In-map 360° panorama for buildings that we have our own interior
 * capture of (e.g. UCSD HSS). Mirrors the Street View chrome —
 * same header, same close affordance — so the interaction feels
 * continuous with the Google-powered panes used for the rest of
 * campus.
 *
 * When the viewer clicks the "Enter the building" CTA the panel
 * cross-fades into the full SimulatorGame experience (HSS Room
 * 1345) without leaving the /map route, so they can run the
 * earthquake scenarios, answer the zone questions, and then step
 * back out to the exterior pano or close the overlay entirely.
 */
export default function BuildingPanorama({
  target,
  onClose,
}: BuildingPanoramaProps) {
  const textureUrl = target.panoramaTextureUrl ?? "/pano/hss-360.png";
  const glbUrl = target.glbUrl ?? null;

  const [entered, setEntered] = useState(false);

  const handleEnter = useCallback(() => setEntered(true), []);
  const handleExit = useCallback(() => setEntered(false), []);

  return (
    <aside className="relative flex h-full w-full flex-col border-l border-white/10 bg-[#0B1324] text-white">
      {/* Chrome is hidden once the user walks inside — the simulator
          renders its own HUD and we don't want competing affordances. */}
      <AnimatePresence initial={false}>
        {!entered && (
          <motion.header
            key="exterior-header"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start justify-between gap-3 border-b border-white/10 bg-[#0F172A]/80 px-4 py-3 backdrop-blur"
          >
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                Street View 360°
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
              className="shrink-0 rounded-full border border-white/15 bg-white/5 p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Close Street View"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.header>
        )}
      </AnimatePresence>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {!entered ? (
            <motion.div
              key="exterior"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Panorama360
                modelUrl={glbUrl}
                textureUrl={textureUrl}
                hotspots={[]}
              />

              {/* "Enter the building" CTA — sits low-centre so it never
                  covers the framed subject in the equirectangular photo.
                  On mobile we lift it well above iOS Safari's bottom
                  chrome (URL bar + tabs) so the button never slips under
                  the browser UI; desktop keeps the tighter `bottom-12`.
                  The aura ring and shimmer are pure CSS so the button
                  reads as a premium call-to-action even against a
                  high-contrast outdoor scene. */}
              <motion.div
                className="pointer-events-none absolute inset-x-0 bottom-[max(6rem,calc(env(safe-area-inset-bottom)+5.5rem))] z-10 flex justify-center px-6 sm:bottom-12"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.button
                  type="button"
                  onClick={handleEnter}
                  whileHover={{ scale: 1.035, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="pointer-events-auto group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_50px_-12px_rgba(26,86,219,0.6)] backdrop-blur-xl"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-[1px] rounded-full bg-[conic-gradient(from_0deg,rgba(26,86,219,0.0),rgba(26,86,219,0.55),rgba(147,197,253,0.4),rgba(26,86,219,0.0))] opacity-60 blur-[2px] transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.22)_50%,transparent_70%)] bg-[length:220%_100%] bg-[position:-100%_0] transition-[background-position] duration-700 group-hover:bg-[position:200%_0]"
                  />
                  <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#1A56DB]/90 text-white shadow-[0_0_20px_rgba(26,86,219,0.65)] ring-1 ring-white/20">
                    <DoorOpen className="h-3.5 w-3.5" />
                  </span>
                  <span className="relative tracking-tight">Enter the building</span>
                  <Sparkles className="relative h-3.5 w-3.5 text-[#93c5fd] opacity-80" />
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="interior"
              initial={{ opacity: 0, scale: 1.01 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {/* SimulatorGame uses `position: fixed` on its Pannellum
                  viewer + overlays, so it paints over the full viewport
                  automatically. The floating "Exit building" pill below
                  sits on a higher z-index than any simulator HUD. */}
              <SimulatorGame />

              <motion.button
                type="button"
                onClick={handleExit}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.96 }}
                className="group fixed left-4 top-4 z-[9999] inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/65 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-xl transition hover:bg-black/80 hover:text-white"
                aria-label="Exit building and return to exterior 360°"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                Exit building
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {!entered && (
          <motion.footer
            key="exterior-footer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-white/10 bg-[#0F172A]/80 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/40 backdrop-blur"
          >
            Quarte · Campus 360° capture · Drag to look around · Step inside to simulate
          </motion.footer>
        )}
      </AnimatePresence>
    </aside>
  );
}
