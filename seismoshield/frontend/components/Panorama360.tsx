"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls, useTexture } from "@react-three/drei";
import { Suspense, useState } from "react";
import * as THREE from "three";
import { X } from "lucide-react";

/**
 * Describes a single clickable point-of-interest inside the panorama. The
 * `position` is in world coordinates and should sit on (or just inside of)
 * the sphere's surface — use the Coordinate Logger in <Environment360/> to
 * harvest exact values by clicking the 360° image.
 */
export type HotspotData = {
  id: string;
  position: [number, number, number];
  title: string;
  description: string;
};

const DEFAULT_HOTSPOTS: HotspotData[] = [
  {
    id: "sample",
    // Sits on the sphere's "front" (along +Z). Drop your own by clicking
    // the image — the console will log the exact [x, y, z] you need.
    position: [0, 0, 45],
    title: "Sample Hotspot",
    description:
      "Click any point on the 360° image to print its [x, y, z] to the console, then paste that into the `hotspots` prop to pin a card here.",
  },
];

// ---------------------------------------------------------------------------
// Environment sphere
// ---------------------------------------------------------------------------

interface Environment360Props {
  textureUrl: string;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

function Environment360({ textureUrl, onPointerDown }: Environment360Props) {
  // `useTexture` suspends until the image resolves. Three's default color
  // space for imported textures is linear — we nudge it to sRGB so the
  // panorama reads with the same gamma as the source JPG.
  const texture = useTexture(textureUrl);
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh onPointerDown={onPointerDown}>
      <sphereGeometry args={[50, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Hotspot (pulsating dot → glassmorphism popover)
// ---------------------------------------------------------------------------

interface HotspotProps {
  data: HotspotData;
}

function Hotspot({ data }: HotspotProps) {
  const [open, setOpen] = useState(false);

  return (
    <Html
      position={data.position}
      center
      distanceFactor={16}
      zIndexRange={[40, 100]}
      // `occlude` hides the hotspot when it rotates behind the camera; we
      // disable it here because OrbitControls keeps the camera at origin
      // and the sphere is BackSide, so occlusion would read inverted.
      occlude={false}
    >
      <div className="relative flex items-center justify-center">
        {open ? (
          <div
            role="dialog"
            aria-label={data.title}
            className="w-[280px] origin-center animate-[panorama-pop_200ms_ease-out] rounded-2xl border border-white/20 bg-white/10 p-4 text-white shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold leading-tight tracking-tight">
                {data.title}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close hotspot"
                className="-m-1 shrink-0 rounded-full p-1 text-white/70 transition hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/80">
              {data.description}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Open hotspot: ${data.title}`}
            className="group relative flex h-5 w-5 items-center justify-center"
          >
            <span className="absolute h-5 w-5 animate-ping rounded-full bg-white/40" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] ring-2 ring-white/30 transition-transform group-hover:scale-125" />
          </button>
        )}
      </div>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Top-level viewer
// ---------------------------------------------------------------------------

export interface Panorama360Props {
  textureUrl?: string;
  hotspots?: HotspotData[];
}

export default function Panorama360({
  textureUrl = "/room-360.jpg",
  hotspots = DEFAULT_HOTSPOTS,
}: Panorama360Props) {
  // Coordinate logger — every click on the sphere prints the exact
  // intersection point, rounded to 2 decimals, ready to drop into a
  // <Hotspot/> position.
  const handleLog = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const { x, y, z } = event.point;
    const rounded: [number, number, number] = [
      Math.round(x * 100) / 100,
      Math.round(y * 100) / 100,
      Math.round(z * 100) / 100,
    ];
    // eslint-disable-next-line no-console
    console.log(
      "[Panorama360] hotspot position →",
      rounded,
      `  // paste as: position: [${rounded[0]}, ${rounded[1]}, ${rounded[2]}]`,
    );
  };

  return (
    <Canvas
      // Camera at (near-)origin with a slight +Z nudge so OrbitControls has
      // a stable rotation pivot against the target at [0, 0, 0].
      camera={{ position: [0, 0, 0.01], fov: 75, near: 0.1, far: 1000 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="h-full w-full"
    >
      <Suspense fallback={null}>
        <Environment360 textureUrl={textureUrl} onPointerDown={handleLog} />
        {hotspots.map((h) => (
          <Hotspot key={h.id} data={h} />
        ))}
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        // Inverted rotate speed makes dragging feel like you're turning your
        // head inside the sphere rather than spinning it around you.
        rotateSpeed={-0.35}
        // Lock rolls — look left/right and up/down only.
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI - 0.1}
      />
    </Canvas>
  );
}
