"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  PointerLockControls,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const MODEL_URL = "/models/walkthrough.glb";

// Start preloading as soon as this module is imported.
useGLTF.preload(MODEL_URL);

function Model() {
  const gltf = useGLTF(MODEL_URL);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Harden materials so the GLB looks good under scene lighting.
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mat = mesh.material as THREE.Material | THREE.Material[];
      const fix = (m: THREE.Material) => {
        // Ensure both sides render so interior walls never vanish when
        // the camera is inside the envelope.
        (m as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
        m.needsUpdate = true;
      };
      if (Array.isArray(mat)) mat.forEach(fix);
      else if (mat) fix(mat);
    });

    // Frame the camera to a sensible starting pose based on the model's
    // bounding box so we don't spawn inside geometry or floating in the void.
    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const diag = size.length();
    const eyeHeight = Math.max(1.6, size.y * 0.08);
    camera.position.set(
      center.x + diag * 0.18,
      box.min.y + eyeHeight,
      center.z + diag * 0.18,
    );
    camera.lookAt(center.x, center.y, center.z);
    camera.updateProjectionMatrix();
  }, [camera, gltf.scene]);

  return <primitive ref={groupRef} object={gltf.scene} />;
}

type Keys = Record<string, boolean>;

function FirstPersonController({
  enabled,
  baseSpeed = 3.2,
  sprintSpeed = 8,
}: {
  enabled: boolean;
  baseSpeed?: number;
  sprintSpeed?: number;
}) {
  const { camera } = useThree();
  const keysRef = useRef<Keys>({});
  const velocityRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    const blur = () => {
      keysRef.current = {};
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const desired = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const k = keysRef.current;
    const dt = Math.min(delta, 0.05);
    const sprint = k["ShiftLeft"] || k["ShiftRight"];
    const speed = sprint ? sprintSpeed : baseSpeed;

    // Horizontal forward direction (ignore pitch so looking up/down
    // doesn't push the camera into the ceiling).
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();
    right.crossVectors(forward, up).normalize();

    desired.set(0, 0, 0);
    if (enabled) {
      if (k["KeyW"] || k["ArrowUp"]) desired.add(forward);
      if (k["KeyS"] || k["ArrowDown"]) desired.sub(forward);
      if (k["KeyD"] || k["ArrowRight"]) desired.add(right);
      if (k["KeyA"] || k["ArrowLeft"]) desired.sub(right);
      if (k["Space"]) desired.y += 1;
      if (k["ControlLeft"] || k["ControlRight"] || k["KeyC"])
        desired.y -= 1;
      if (desired.lengthSq() > 0) desired.normalize().multiplyScalar(speed);
    }

    // Exponential smoothing toward the desired velocity for glide-in/out feel.
    const lerp = 1 - Math.pow(0.001, dt);
    velocityRef.current.lerp(desired, lerp);
    camera.position.addScaledVector(velocityRef.current, dt);
  });

  return null;
}

function LoadingBadge() {
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#050814]/75 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#1A56DB]/40 bg-[#1A56DB]/10">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1A56DB]/70" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#1A56DB]" />
          </span>
        </div>
        <div className="text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
            Loading walkthrough
          </div>
          <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-white">
            {progress.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}

function StartOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/45">
      <div className="rounded-2xl border border-white/10 bg-[#0F172A]/85 px-8 py-6 text-center shadow-2xl backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#93c5fd]">
          Click anywhere to enter
        </p>
        <p className="mt-2 text-xl font-semibold text-white">
          First-person walkthrough
        </p>
        <ul className="mt-4 space-y-1.5 text-left text-[13px] text-white/75">
          <li>
            <Kbd>Mouse</Kbd> look around
          </li>
          <li>
            <Kbd>W A S D</Kbd> walk
          </li>
          <li>
            <Kbd>Space</Kbd> up · <Kbd>Ctrl</Kbd> / <Kbd>C</Kbd> down
          </li>
          <li>
            <Kbd>Shift</Kbd> sprint
          </li>
          <li>
            <Kbd>Esc</Kbd> release pointer
          </li>
        </ul>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[28px] justify-center rounded-md border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[11px] font-semibold text-white/90">
      {children}
    </kbd>
  );
}

export default function Walkthrough() {
  const [locked, setLocked] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050814]">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 72, near: 0.05, far: 500, position: [3, 1.6, 5] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#070b18"]} />
        <fog attach="fog" args={["#070b18", 40, 180]} />

        <ambientLight intensity={0.55} />
        <hemisphereLight
          color="#cfe2ff"
          groundColor="#1a2540"
          intensity={0.7}
        />
        <directionalLight
          position={[15, 25, 10]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={120}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
        />

        <Suspense fallback={null}>
          <Model />
        </Suspense>

        <PointerLockControls
          onLock={() => setLocked(true)}
          onUnlock={() => setLocked(false)}
        />
        <FirstPersonController enabled={locked} />
      </Canvas>

      <LoadingBadge />
      <StartOverlay visible={!locked} />

      {locked && (
        <>
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <div
              className="h-1.5 w-1.5 rounded-full bg-white/85"
              style={{ boxShadow: "0 0 0 2px rgba(0,0,0,0.6)" }}
            />
          </div>
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-[11px] font-medium tracking-wide text-white/85 backdrop-blur">
            WASD move · Shift sprint · Space/Ctrl elevate · Esc to release
          </div>
        </>
      )}
    </div>
  );
}
