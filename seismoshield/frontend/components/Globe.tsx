"use client";

import createGlobe from "cobe";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export type GlobeHandle = {
  flyToSanDiego: () => Promise<void>;
  reset: () => void;
};

type PulseMarker = {
  id: string;
  location: [number, number];
  size: number;
  delay?: number;
  big?: boolean;
  label?: string;
};

const MARKERS: PulseMarker[] = [
  {
    id: "san-diego",
    location: [32.7157, -117.1611],
    size: 0.1,
    delay: 0,
    big: true,
    label: "San Diego",
  },
  { id: "tokyo", location: [35.6762, 139.6503], size: 0.03, delay: 0.7 },
  { id: "sydney", location: [-33.8688, 151.2093], size: 0.03, delay: 1.2 },
  { id: "london", location: [51.5074, -0.1278], size: 0.03, delay: 0.3 },
  { id: "mexico-city", location: [19.4326, -99.1332], size: 0.03, delay: 1.8 },
];

const SAN_DIEGO_LAT_RAD = (32.7157 * Math.PI) / 180;
const SAN_DIEGO_LON_RAD = (-117.1611 * Math.PI) / 180;
// Intermediate waypoint — centered over California so the camera "arrives" at
// the west coast before tightening onto San Diego specifically.
const CALIFORNIA_LAT_RAD = (36.7783 * Math.PI) / 180;
const CALIFORNIA_LON_RAD = (-119.4179 * Math.PI) / 180;
const BASE_THETA = 0.28;

interface GlobeProps {
  className?: string;
  speed?: number;
  onFlyComplete?: () => void;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function shortestDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export const Globe = forwardRef<GlobeHandle, GlobeProps>(function Globe(
  { className, speed = 0.0025, onFlyComplete },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffsetRef = useRef<{ phi: number; theta: number }>({
    phi: 0,
    theta: 0,
  });
  const phiOffsetRef = useRef<number>(0);
  const thetaOffsetRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const flyingRef = useRef<boolean>(false);
  const phiRef = useRef<number>(0);

  const onFlyCompleteRef = useRef<typeof onFlyComplete>(onFlyComplete);
  onFlyCompleteRef.current = onFlyComplete;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (flyingRef.current) return;
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffsetRef.current.phi;
      thetaOffsetRef.current += dragOffsetRef.current.theta;
      dragOffsetRef.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    if (!flyingRef.current) isPausedRef.current = false;
  }, []);

  useEffect(() => {
    // Sensitivity tuning: 180 / 450 gives a snappier grab than the old
    // 300 / 1000 defaults. Theta is deliberately less sensitive than phi
    // so accidental vertical drags don't flip the globe upside-down.
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffsetRef.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 180,
          theta: (e.clientY - pointerInteracting.current.y) / 450,
        };
      }
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let globe: ReturnType<typeof createGlobe> | null = null;

    const init = () => {
      const width = canvas.offsetWidth;
      if (width === 0 || globe) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width: width * 2,
        height: width * 2,
        phi: 0,
        theta: BASE_THETA,
        dark: 1,
        diffuse: 1.4,
        mapSamples: 16000,
        mapBrightness: 7,
        baseColor: [0.25, 0.3, 0.45],
        markerColor: [51 / 255, 204 / 255, 221 / 255],
        glowColor: [0.08, 0.28, 0.7],
        markers: MARKERS.map((m) => ({
          location: m.location,
          size: m.size,
        })),
        onRender: (state: Record<string, number>) => {
          if (!flyingRef.current && !isPausedRef.current) {
            phiRef.current += speed;
          }
          state.phi =
            phiRef.current +
            phiOffsetRef.current +
            dragOffsetRef.current.phi;
          state.theta =
            BASE_THETA + thetaOffsetRef.current + dragOffsetRef.current.theta;
          state.width = width * 2;
          state.height = width * 2;
        },
      });

      window.setTimeout(() => {
        if (canvas) canvas.style.opacity = "1";
      }, 0);
    };

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width && entries[0].contentRect.width > 0) {
          ro.disconnect();
          init();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      if (globe) globe.destroy();
    };
  }, [speed]);

  useImperativeHandle(
    ref,
    () => ({
      flyToSanDiego: () =>
        new Promise<void>((resolve) => {
          if (flyingRef.current) {
            resolve();
            return;
          }
          flyingRef.current = true;
          isPausedRef.current = true;

          phiOffsetRef.current += dragOffsetRef.current.phi;
          thetaOffsetRef.current += dragOffsetRef.current.theta;
          dragOffsetRef.current = { phi: 0, theta: 0 };

          // Two-stage cinematic flight:
          // Stage 1 (0 .. 55%): rotate so California sits front-center,
          //   gentle scale(1.35) so the continent reads first.
          // Stage 2 (55 .. 100%): tighten onto San Diego exactly and
          //   accelerate the zoom into the beacon.
          const startPhiOffset = phiOffsetRef.current;
          const startThetaOffset = thetaOffsetRef.current;

          // Cobe's phi convention: a marker at longitude L sits at the front
          // of the globe when phi ≡ L (in radians). San Diego / California are
          // negative longitudes, so we target negative phi values. Flipping
          // the sign here is the fix for the "fly-to lands in Asia" bug.
          const currentTotalPhi = phiRef.current + phiOffsetRef.current;
          const toCaliforniaDelta = shortestDelta(
            currentTotalPhi % (Math.PI * 2),
            CALIFORNIA_LON_RAD,
          );
          const caliPhiOffset = startPhiOffset + toCaliforniaDelta;
          const caliThetaOffset = CALIFORNIA_LAT_RAD - BASE_THETA;

          const caliTotalPhi = phiRef.current + caliPhiOffset;
          const toSanDiegoDelta = shortestDelta(
            caliTotalPhi % (Math.PI * 2),
            SAN_DIEGO_LON_RAD,
          );
          const sdPhiOffset = caliPhiOffset + toSanDiegoDelta;
          const sdThetaOffset = SAN_DIEGO_LAT_RAD - BASE_THETA;

          const el = containerRef.current;
          // Cinematic is now rotation-only: rotate the planet toward
          // California (stage 1), drift onto the San Diego beacon
          // (stage 2). No dramatic zoom — the container stays put and
          // the transition to /map is handled by a slow cross-fade in
          // the parent page while these rotations run.
          const stage1Duration = 1400;
          const stage2Duration = 1800;

          if (el) {
            el.style.transition = `filter ${stage1Duration}ms cubic-bezier(0.33, 0, 0.2, 1)`;
            el.style.transform = "";
            el.style.filter = "brightness(1.06) saturate(1.08)";
          }

          const start = performance.now();
          const totalDuration = stage1Duration + stage2Duration;
          let stage2Triggered = false;

          const step = (now: number) => {
            const elapsed = now - start;
            const t = Math.min(1, elapsed / totalDuration);

            if (elapsed < stage1Duration) {
              const s1 = elapsed / stage1Duration;
              const e1 = easeInOutCubic(s1);
              phiOffsetRef.current =
                startPhiOffset + (caliPhiOffset - startPhiOffset) * e1;
              thetaOffsetRef.current =
                startThetaOffset + (caliThetaOffset - startThetaOffset) * e1;
            } else {
              if (!stage2Triggered && el) {
                stage2Triggered = true;
                // Stage 2: rotate into San Diego while the globe stays
                // in place. We lift the brightness slightly so the fly-by
                // still feels "approach-y" without any scale change.
                el.style.transition = `filter ${stage2Duration}ms cubic-bezier(0.22, 0.08, 0.25, 1)`;
                el.style.filter = "brightness(1.15) saturate(1.18)";
              }
              const s2 = Math.min(1, (elapsed - stage1Duration) / stage2Duration);
              const e2 = easeOutQuart(s2);
              phiOffsetRef.current =
                caliPhiOffset + (sdPhiOffset - caliPhiOffset) * e2;
              thetaOffsetRef.current =
                caliThetaOffset + (sdThetaOffset - caliThetaOffset) * e2;
            }

            if (t < 1) {
              requestAnimationFrame(step);
            } else {
              flyingRef.current = false;
              onFlyCompleteRef.current?.();
              resolve();
            }
          };
          requestAnimationFrame(step);
        }),
      reset: () => {
        const el = containerRef.current;
        if (el) {
          el.style.transition = "transform 900ms ease, filter 900ms ease";
          el.style.transform = "";
          el.style.filter = "";
        }
        flyingRef.current = false;
        isPausedRef.current = false;
        phiOffsetRef.current = 0;
        thetaOffsetRef.current = 0;
        dragOffsetRef.current = { phi: 0, theta: 0 };
      },
    }),
    [],
  );

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square select-none transition-transform duration-700 ease-out ${className ?? ""}`}
    >
      <style>{`
        @keyframes pulse-expand {
          0% { transform: scale(0.3); opacity: 0.85; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes pulse-expand-big {
          0% { transform: scale(0.35); opacity: 1; }
          100% { transform: scale(2.6); opacity: 0; }
        }
      `}</style>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
      {MARKERS.map((m) => {
        const ringCount = m.big ? 3 : 2;
        const coreSize = m.big ? 14 : 8;
        const ringColor = m.big ? "#33ccdd" : "#67e8f9";
        const frameSize = m.big ? 60 : 32;
        const markerStyle: React.CSSProperties = {
          position: "absolute",
          positionAnchor: `--cobe-${m.id}`,
          bottom: "anchor(center)",
          left: "anchor(center)",
          translate: "-50% 50%",
          width: frameSize,
          height: frameSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          opacity: `var(--cobe-visible-${m.id}, 0)` as unknown as number,
          filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 6px))`,
          transition: "opacity 0.4s, filter 0.4s",
        };
        return (
          <div key={m.id} style={markerStyle}>
            {Array.from({ length: ringCount }).map((_, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  border: `2px solid ${ringColor}`,
                  borderRadius: "50%",
                  opacity: 0,
                  animation: `${
                    m.big ? "pulse-expand-big" : "pulse-expand"
                  } 2.2s ease-out infinite ${(m.delay ?? 0) + i * 0.55}s`,
                }}
              />
            ))}
            <span
              style={{
                width: coreSize,
                height: coreSize,
                background: ringColor,
                borderRadius: "50%",
                boxShadow: m.big
                  ? "0 0 0 3px #0F172A, 0 0 0 6px rgba(51,204,221,0.75), 0 0 20px rgba(51,204,221,0.7)"
                  : "0 0 0 2px #0F172A, 0 0 0 4px rgba(103,232,249,0.55)",
              }}
            />
            {m.big && m.label && (
              <span
                style={{
                  position: "absolute",
                  top: "calc(50% + 22px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "2px 8px",
                  background: "rgba(15, 23, 42, 0.85)",
                  border: "1px solid rgba(51, 204, 221, 0.4)",
                  borderRadius: 9999,
                  color: "#e0fbff",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  backdropFilter: "blur(6px)",
                }}
              >
                {m.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default Globe;
