"use client";

import clsx from "clsx";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function BuildingMesh() {
  return (
    <group rotation={[0, 0.45, 0]} scale={1.08}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[1.4, 2.2, 1.1]} />
        <meshStandardMaterial
          color="#64748b"
          metalness={0.15}
          roughness={0.75}
        />
      </mesh>
      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[1.5, 0.35, 1.2]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
    </group>
  );
}

type HSSBuildingPreviewProps = {
  /** When set, fills the grid cell on large screens (wireframe top-left). */
  fillGridCell?: boolean;
  className?: string;
};

/** Portrait frame so the building reads taller and fills the viewport better. */
export function HSSBuildingPreview({
  fillGridCell = false,
  className,
}: HSSBuildingPreviewProps) {
  return (
    <div
      className={clsx(
        "group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-b from-[#0f172a] via-[#0a0f1a] to-[#020617] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.75)] ring-1 ring-white/[0.04]",
        "mx-auto aspect-[3/4] w-full max-w-[360px]",
        fillGridCell &&
          "lg:mx-0 lg:h-full lg:min-h-0 lg:w-full lg:max-w-none lg:aspect-auto",
        !fillGridCell && "lg:mx-0",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0b1224]/95 via-[#0b1224]/20 to-[#1A56DB]/[0.07]"
      />
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-between gap-2 px-4 pb-3 pt-12">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd]/90">
            3D preview
          </p>
          <p className="mt-0.5 text-sm font-medium leading-snug text-white/95">
            HSS · Humanities &amp; Social Sciences
          </p>
        </div>
        <p className="hidden shrink-0 text-[10px] text-white/35 sm:block">
          Drag to orbit
        </p>
      </div>
      <Canvas
        className="!h-full !w-full min-h-0"
        camera={{ position: [2.6, 1.35, 5.2], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#0b1224"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 12, 6]} intensity={1.15} />
        <directionalLight position={[-4, 6, -3]} intensity={0.35} color="#93c5fd" />
        <BuildingMesh />
        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.55}
          minPolarAngle={0.55}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 1.15, 0]}
        />
      </Canvas>
    </div>
  );
}
