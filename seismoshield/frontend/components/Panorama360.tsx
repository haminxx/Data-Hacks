"use client";

import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import {
  Html,
  OrbitControls,
  useGLTF,
  useProgress,
  useTexture,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { X } from "lucide-react";

/**
 * Clickable point-of-interest inside the panorama. `position` is in world
 * coordinates; use the Coordinate Logger (onPointerDown on the environment
 * scene) to harvest exact values by clicking the 3D surface.
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
    position: [0, 0, 2.5],
    title: "Sample Hotspot",
    description:
      "Click any point on the scene to print its [x, y, z] to the console, then paste that into the `hotspots` prop to pin a card here.",
  },
];

// ---------------------------------------------------------------------------
// GLB environment (primary)
// ---------------------------------------------------------------------------

interface SceneModelProps {
  url: string;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

function SceneModel({ url, onPointerDown }: SceneModelProps) {
  const { scene } = useGLTF(url);
  const { camera } = useThree();

  // Clone once so multiple instances don't share mutated material/mesh flags.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Re-center the scene so its bounding-box midpoint sits at the world
  // origin, then drop the camera inside it. For a photogrammetry capture
  // exported as a GLB, this puts the viewer "inside" the scan regardless
  // of the file's authoring origin. We also harden materials so interior
  // walls render from both sides.
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    cloned.position.sub(center);

    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        if (!m) return;
        const mm = m as THREE.MeshStandardMaterial;
        mm.side = THREE.DoubleSide;
        if (mm.map) mm.map.colorSpace = THREE.SRGBColorSpace;
        mm.needsUpdate = true;
      });
    });

    // Anchor the camera slightly above world origin so orbiting feels
    // natural inside a room-scale capture.
    camera.position.set(0, 0.05, 0.01);
    camera.lookAt(0, 0, 0);
  }, [cloned, camera]);

  return <primitive object={cloned} onPointerDown={onPointerDown} />;
}

// ---------------------------------------------------------------------------
// Sphere + JPG fallback (kept for drop-in equirectangular photos)
// ---------------------------------------------------------------------------

interface SphereEnvironmentProps {
  textureUrl: string;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

function SphereEnvironment({ textureUrl, onPointerDown }: SphereEnvironmentProps) {
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

function Hotspot({ data }: { data: HotspotData }) {
  const [open, setOpen] = useState(false);

  return (
    <Html
      position={data.position}
      center
      distanceFactor={2.5}
      zIndexRange={[40, 100]}
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
// Progress HUD (shown while the GLB streams in)
// ---------------------------------------------------------------------------

function LoadingBadge() {
  const { active, progress } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/85 backdrop-blur">
      Loading 360° environment · {Math.round(progress)}%
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top-level viewer
// ---------------------------------------------------------------------------

export interface Panorama360Props {
  /** GLB URL. When set, renders the 3D scene captured in the file. */
  modelUrl?: string;
  /** Equirectangular JPG fallback. Used when `modelUrl` is not provided. */
  textureUrl?: string;
  hotspots?: HotspotData[];
}

export default function Panorama360({
  modelUrl = "/models/room-360.glb",
  textureUrl = "/room-360.jpg",
  hotspots = DEFAULT_HOTSPOTS,
}: Panorama360Props) {
  const loggedRef = useRef(false);

  // Coordinate logger — every click on the environment prints the exact
  // intersection point, rounded to 3 decimals and pre-formatted so it
  // drops straight into a <Hotspot/> position.
  const handleLog = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const { x, y, z } = event.point;
    const rounded: [number, number, number] = [
      Math.round(x * 1000) / 1000,
      Math.round(y * 1000) / 1000,
      Math.round(z * 1000) / 1000,
    ];
    if (!loggedRef.current) {
      loggedRef.current = true;
      // eslint-disable-next-line no-console
      console.info(
        "[Panorama360] Click anywhere on the 3D scene to log a hotspot position.",
      );
    }
    // eslint-disable-next-line no-console
    console.log(
      "[Panorama360] hotspot position →",
      rounded,
      `  // paste as: position: [${rounded[0]}, ${rounded[1]}, ${rounded[2]}]`,
    );
  };

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 0.05, 0.01], fov: 75, near: 0.01, far: 1000 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        className="h-full w-full"
      >
        {/* Soft scene lighting so the GLB's materials read with some volume
            even when the capture lacks baked lighting. */}
        <ambientLight intensity={0.85} />
        <hemisphereLight
          color="#d8e3ff"
          groundColor="#2a2f3a"
          intensity={0.55}
        />

        <Suspense fallback={null}>
          {modelUrl ? (
            <SceneModel url={modelUrl} onPointerDown={handleLog} />
          ) : (
            <SphereEnvironment
              textureUrl={textureUrl}
              onPointerDown={handleLog}
            />
          )}
          {hotspots.map((h) => (
            <Hotspot key={h.id} data={h} />
          ))}
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={-0.35}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI - 0.15}
        />
      </Canvas>

      <LoadingBadge />
    </div>
  );
}

// Pre-warm the GLTF loader so the cached version is available when the
// component mounts.
useGLTF.preload("/models/room-360.glb");
