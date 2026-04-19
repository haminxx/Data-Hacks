"use client";

import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import {
  Html,
  OrbitControls,
  useGLTF,
  useProgress,
  useTexture,
} from "@react-three/drei";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  onReady?: (info: SceneInfo) => void;
}

type SceneInfo = {
  diagonal: number;
  center: THREE.Vector3;
  meshCount: number;
  hasTextures: boolean;
};

function SceneModel({ url, onPointerDown, onReady }: SceneModelProps) {
  const { scene } = useGLTF(url);
  const { camera, gl } = useThree();

  // Clone once so multiple instances don't share mutated material/mesh flags.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    // 1. Re-center the scene so its bbox midpoint sits at the world origin.
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const diagonal = size.length();
    cloned.position.sub(center);

    // 2. Walk the scene. For every textured mesh, swap its material for an
    //    unlit MeshBasicMaterial so the baked 360° texture renders exactly
    //    as captured (photospheres must not receive shading). Double-side
    //    everything so interior-facing faces render regardless of winding.
    let meshCount = 0;
    let hasTextures = false;
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      meshCount += 1;
      mesh.frustumCulled = false;

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const upgraded = mats.map((m) => {
        if (!m) return m;
        const std = m as THREE.MeshStandardMaterial;
        const map = std.map ?? null;
        if (map) {
          hasTextures = true;
          map.colorSpace = THREE.SRGBColorSpace;
          map.anisotropy = gl.capabilities.getMaxAnisotropy?.() ?? 4;
          const basic = new THREE.MeshBasicMaterial({
            map,
            side: THREE.DoubleSide,
            toneMapped: false,
          });
          return basic;
        }
        // No texture — keep original but force DoubleSide so interior
        // walls still render if the mesh is a hollow room.
        (std as THREE.Material & { side?: THREE.Side }).side = THREE.DoubleSide;
        std.needsUpdate = true;
        return std;
      });

      mesh.material = upgraded.length === 1 ? upgraded[0]! : (upgraded as THREE.Material[]);
    });

    // 3. Camera at the bbox center so the user is *inside* whatever the
    //    GLB is — a 360 sphere, a room scan, or a photogrammetry capsule.
    //    Near/far are scaled to the scene so we never clip.
    const near = Math.max(0.001, diagonal * 0.0005);
    const far = Math.max(2000, diagonal * 20);
    if ("fov" in camera) {
      (camera as THREE.PerspectiveCamera).near = near;
      (camera as THREE.PerspectiveCamera).far = far;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -1);

    onReady?.({ diagonal, center, meshCount, hasTextures });
  }, [cloned, camera, gl, onReady]);

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
      <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
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
  /** Optional debug flag — logs bbox + mesh counts once on load. */
  debug?: boolean;
}

export default function Panorama360({
  modelUrl = "/models/room-360.glb",
  textureUrl = "/room-360.jpg",
  hotspots = DEFAULT_HOTSPOTS,
  debug = true,
}: Panorama360Props) {
  const loggedRef = useRef(false);

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

  const handleReady = (info: SceneInfo) => {
    if (!debug) return;
    // eslint-disable-next-line no-console
    console.info(
      `[Panorama360] GLB ready — meshes=${info.meshCount}, textures=${info.hasTextures}, bboxDiagonal=${info.diagonal.toFixed(3)}`,
    );
    if (!info.meshCount) {
      // eslint-disable-next-line no-console
      console.warn(
        "[Panorama360] GLB contains no meshes — falling back would be needed.",
      );
    }
  };

  return (
    <div className="relative h-full w-full">
      <Canvas
        // Initial camera pose is overwritten once the scene mounts (we
        // recompute near/far + position against the GLB bbox). The large
        // default `far` and small `near` prevent accidental clipping on
        // scenes whose authoring units we don't know yet.
        camera={{ position: [0, 0, 0.01], fov: 75, near: 0.001, far: 10000 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.NoToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        className="h-full w-full"
      >
        {/* Scene background is dark so any missing geometry still reads
            as a solid void rather than transparent (which would show the
            page bg through the canvas). */}
        <color attach="background" args={["#050814"]} />

        {/* Ambient + hemisphere fill so unlit materials that aren't our
            MeshBasicMaterial swap-in (there shouldn't be any, but be
            defensive) still get some light. */}
        <ambientLight intensity={1} />
        <hemisphereLight
          color="#d8e3ff"
          groundColor="#0b1020"
          intensity={0.8}
        />

        <Suspense fallback={null}>
          {modelUrl ? (
            <SceneModel
              url={modelUrl}
              onPointerDown={handleLog}
              onReady={handleReady}
            />
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
