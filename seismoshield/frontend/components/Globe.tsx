"use client";

import createGlobe, { type COBEOptions } from "cobe";
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

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.28,
  dark: 1,
  diffuse: 1.1,
  mapSamples: 16000,
  mapBrightness: 5.5,
  baseColor: [0.18, 0.22, 0.38],
  markerColor: [251 / 255, 100 / 255, 21 / 255],
  glowColor: [0.1, 0.34, 0.86],
  markers: [
    { location: [32.7157, -117.1611], size: 0.12 },
    { location: [33.19, -115.54], size: 0.08 },
    { location: [35.6762, 139.6503], size: 0.07 },
    { location: [61.2181, -149.9003], size: 0.06 },
    { location: [-41.2865, 174.7762], size: 0.06 },
    { location: [-33.4489, -70.6693], size: 0.07 },
    { location: [41.0082, 28.9784], size: 0.06 },
    { location: [27.7172, 85.324], size: 0.06 },
    { location: [14.5995, 120.9842], size: 0.05 },
    { location: [19.4326, -99.1332], size: 0.06 },
  ],
};

const AUTO_PHI_SPEED = 0.0018;
const SAN_DIEGO_LAT = 32.7157;
const SAN_DIEGO_LON = -117.1611;

interface GlobeProps {
  className?: string;
  config?: COBEOptions;
  onFlyComplete?: () => void;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Normalise an angle delta into the [-PI, PI] range so that a flyTo
 * animation always rotates along the shortest arc.
 */
function shortestDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export const Globe = forwardRef<GlobeHandle, GlobeProps>(function Globe(
  { className, config = GLOBE_CONFIG, onFlyComplete },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const phiRef = useRef<number>(0);
  const thetaRef = useRef<number>(config.theta ?? 0.28);
  const widthRef = useRef<number>(0);

  const pointerStartX = useRef<number | null>(null);
  const lastPointerX = useRef<number | null>(null);
  const dragVelocity = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const dragOffset = useRef<number>(0);

  const autoPausedRef = useRef<boolean>(false);
  const flyingRef = useRef<boolean>(false);
  const onFlyCompleteRef = useRef<typeof onFlyComplete>(onFlyComplete);
  onFlyCompleteRef.current = onFlyComplete;

  const setCursor = (cursor: "grab" | "grabbing") => {
    if (canvasRef.current) canvasRef.current.style.cursor = cursor;
  };

  const onPointerDown = (clientX: number) => {
    isDragging.current = true;
    pointerStartX.current = clientX;
    lastPointerX.current = clientX;
    dragVelocity.current = 0;
    dragOffset.current = 0;
    autoPausedRef.current = true;
    setCursor("grabbing");
  };

  const onPointerMove = (clientX: number) => {
    if (!isDragging.current || lastPointerX.current === null) return;
    const instantDelta = clientX - lastPointerX.current;
    lastPointerX.current = clientX;
    dragVelocity.current = instantDelta;
    dragOffset.current += instantDelta / 220;
  };

  const onPointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    pointerStartX.current = null;
    lastPointerX.current = null;
    setCursor("grab");
  };

  const onRender = useCallback((state: Record<string, number>) => {
    if (flyingRef.current) {
      state.phi = phiRef.current;
      state.theta = thetaRef.current;
    } else {
      if (isDragging.current) {
        phiRef.current += dragOffset.current * 0.12;
        dragOffset.current *= 0.88;
      } else if (autoPausedRef.current) {
        if (Math.abs(dragVelocity.current) > 0.02) {
          phiRef.current += (dragVelocity.current / 220) * 0.12;
          dragVelocity.current *= 0.94;
        } else {
          dragVelocity.current = 0;
          autoPausedRef.current = false;
        }
      } else {
        phiRef.current += AUTO_PHI_SPEED;
      }
      state.phi = phiRef.current;
      state.theta = thetaRef.current;
    }
    state.width = widthRef.current * 2;
    state.height = widthRef.current * 2;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onResize = () => {
      if (canvas) widthRef.current = canvas.offsetWidth;
    };

    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvas, {
      ...config,
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      onRender,
    });

    const fadeIn = window.setTimeout(() => {
      if (canvas) canvas.style.opacity = "1";
    }, 0);

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(fadeIn);
      globe.destroy();
    };
  }, [config, onRender]);

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
          autoPausedRef.current = true;

          const startPhi = phiRef.current;
          const startTheta = thetaRef.current;

          const targetPhi =
            phiRef.current + shortestDelta(
              phiRef.current % (Math.PI * 2),
              -((SAN_DIEGO_LON * Math.PI) / 180),
            );
          const targetTheta = (SAN_DIEGO_LAT * Math.PI) / 180;

          const el = containerRef.current;
          if (el) {
            el.style.transition =
              "transform 2200ms cubic-bezier(0.65, 0, 0.35, 1), filter 2200ms cubic-bezier(0.65, 0, 0.35, 1)";
            el.style.transform = "scale(2.4)";
            el.style.filter = "brightness(1.15) saturate(1.1)";
          }

          const start = performance.now();
          const duration = 2200;
          const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const e = easeInOutCubic(t);
            phiRef.current = startPhi + (targetPhi - startPhi) * e;
            thetaRef.current = startTheta + (targetTheta - startTheta) * e;
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
          el.style.transition =
            "transform 900ms ease, filter 900ms ease";
          el.style.transform = "";
          el.style.filter = "";
        }
        flyingRef.current = false;
        autoPausedRef.current = false;
        dragVelocity.current = 0;
        dragOffset.current = 0;
      },
    }),
    [],
  );

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 mx-auto aspect-square w-full max-w-[640px] transition-transform duration-700 ease-out ${className ?? ""}`}
    >
      <canvas
        ref={canvasRef}
        className="size-full cursor-grab opacity-0 transition-opacity duration-700 [contain:layout_paint_size]"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLCanvasElement).setPointerCapture(
            e.pointerId,
          );
          onPointerDown(e.clientX);
        }}
        onPointerMove={(e) => onPointerMove(e.clientX)}
        onPointerUp={() => onPointerUp()}
        onPointerCancel={() => onPointerUp()}
        onPointerLeave={() => onPointerUp()}
        onTouchMove={(e) => {
          if (e.touches[0]) onPointerMove(e.touches[0].clientX);
        }}
      />
    </div>
  );
});

export default Globe;
