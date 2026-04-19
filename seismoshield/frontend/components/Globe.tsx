"use client";

import createGlobe, { type COBEOptions } from "cobe";
import { useCallback, useEffect, useRef, useState } from "react";

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

interface GlobeProps {
  className?: string;
  config?: COBEOptions;
}

export function Globe({ className, config = GLOBE_CONFIG }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef<number>(0);
  const widthRef = useRef<number>(0);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef<number>(0);
  const [r, setR] = useState<number>(0);

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      setR(delta / 220);
    }
  };

  const onRender = useCallback(
    (state: Record<string, number>) => {
      if (pointerInteracting.current === null) {
        phiRef.current += 0.0018;
      }
      state.phi = phiRef.current + r;
      state.width = widthRef.current * 2;
      state.height = widthRef.current * 2;
    },
    [r],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onResize = () => {
      if (canvas) {
        widthRef.current = canvas.offsetWidth;
      }
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

  return (
    <div
      className={`absolute inset-0 mx-auto aspect-square w-full max-w-[640px] ${className ?? ""}`}
    >
      <canvas
        ref={canvasRef}
        className="size-full cursor-grab opacity-0 transition-opacity duration-700 [contain:layout_paint_size]"
        onPointerDown={(e) =>
          updatePointerInteraction(
            e.clientX - pointerInteractionMovement.current,
          )
        }
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) => {
          if (e.touches[0]) updateMovement(e.touches[0].clientX);
        }}
      />
    </div>
  );
}

export default Globe;
