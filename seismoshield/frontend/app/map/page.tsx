"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GooeySearchBar, type SearchableItem } from "@/components/GooeySearchBar";
import type { BuildingIndexEntry } from "@/components/Map25D";
import type { StreetViewTarget } from "@/components/StreetView";

const Map25D = dynamic(() => import("@/components/Map25D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0F172A] text-sm text-white/70">
      Initialising 2.5D map…
    </div>
  ),
});

const StreetView = dynamic(() => import("@/components/StreetView"), {
  ssr: false,
});

const BuildingPanorama = dynamic(
  () => import("@/components/BuildingPanorama"),
  { ssr: false },
);

type BuildingSearchItem = SearchableItem &
  BuildingIndexEntry & {
    /** Marks a synthetic row that opens an in-map 360° overlay instead
     *  of Google Street View (e.g. the hard-wired HSS hotkey). */
    panoramaMode?: "street" | "pano";
    panoramaTextureUrl?: string;
  };
type Phase = "idle" | "flying" | "street";

// Hard-wired entry: typing any substring of "HSS" or "Humanities"
// surfaces this as a search result. Picking it flies the map to the
// building's centroid, then opens the in-map 360° overlay instead of
// Google Street View. Coordinates are approximate UCSD HSS.
// `name` MUST match `properties.name` in `public/ucsd_buildings_full.geojson`
// so Map25D can find the polygon and fly the camera to the real centroid.
// Replace `panoramaTextureUrl` with your final HSS equirectangular asset when ready.
const HSS_HOTKEY: BuildingSearchItem = {
  id: "hss-pano",
  name: "Humanities & Social Sciences",
  label: "Humanities & Social Sciences (HSS)",
  meta: "HSS · 360° · campus capture",
  category: "education",
  height: 18,
  lng: -117.24169,
  lat: 32.87825,
  panoramaMode: "pano",
  panoramaTextureUrl: "/pano/hss-360.png",
};

// Keep this in sync with the flyToBuilding transition inside <Map25D/>.
// The pane waits this long before cross-fading into the Street View panel
// so the cinematic zoom-in completes before the perspective switch.
const FLY_IN_MS = 1700;

export default function MapPage() {
  const [selected, setSelected] = useState<StreetViewTarget | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [buildings, setBuildings] = useState<BuildingIndexEntry[]>([]);
  const flyTimerRef = useRef<number | null>(null);

  const clearFlyTimer = () => {
    if (flyTimerRef.current !== null) {
      window.clearTimeout(flyTimerRef.current);
      flyTimerRef.current = null;
    }
  };

  // Orchestrate the idle → flying → street pipeline. The map's FlyToInterpolator
  // is kicked off by setting `selectedName`; once the 1.7s camera move lands on
  // the building we reveal the Street View overlay.
  useEffect(() => {
    clearFlyTimer();
    if (!selected) {
      setPhase("idle");
      return;
    }
    setPhase("flying");
    flyTimerRef.current = window.setTimeout(() => {
      setPhase("street");
      flyTimerRef.current = null;
    }, FLY_IN_MS);
    return clearFlyTimer;
  }, [selected]);

  const handleSelect = useCallback((target: StreetViewTarget | null) => {
    setSelected(target);
  }, []);

  const handleClose = useCallback(() => {
    setSelected(null);
    setPhase("idle");
  }, []);

  const handleBuildingsLoaded = useCallback((list: BuildingIndexEntry[]) => {
    setBuildings(list);
  }, []);

  const searchItems = useMemo<BuildingSearchItem[]>(() => {
    const fromMap = buildings
      .filter((b) => b.name !== HSS_HOTKEY.name)
      .map<BuildingSearchItem>((b) => ({
        ...b,
        id: b.id,
        label: b.name,
        meta: b.category,
      }));
    // Prepend the HSS hotkey so it surfaces instantly when the user
    // starts typing "HSS" or "Humanities".
    return [HSS_HOTKEY, ...fromMap];
  }, [buildings]);

  const handleSearchPick = useCallback((item: BuildingSearchItem) => {
    setSelected({
      name: item.name,
      height: item.height,
      category: item.category,
      lng: item.lng,
      lat: item.lat,
      panoramaMode: item.panoramaMode,
      panoramaTextureUrl: item.panoramaTextureUrl,
    });
  }, []);

  const isStreet = phase === "street";
  const isFlying = phase === "flying";

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0F172A] text-white">
      {/* Full-screen map layer. Scales up slightly and blurs during the
          Street View hand-off to sell the "punching through the roof" effect. */}
      <div
        className={`absolute inset-0 transition-[transform,filter,opacity] duration-700 ease-out ${
          isStreet
            ? "scale-[1.04] blur-[6px] opacity-60"
            : "scale-100 blur-0 opacity-100"
        }`}
      >
        <Map25D
          onBuildingSelect={handleSelect}
          selectedName={selected?.name ?? null}
          onBuildingsLoaded={handleBuildingsLoaded}
        />
      </div>

      {/* Subtle radial vignette that deepens during the zoom to focus the
          user's eye on the target building before the pano takes over. */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          isFlying || isStreet ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(5,8,20,0) 35%, rgba(5,8,20,0.72) 100%)",
        }}
      />

      {/* Top-centered search bar. pointer-events-none on the positioning
          shell lets map drags / hovers pass through except where the bar
          actually lives. Hidden during the street-view phase. */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-5 z-20 flex justify-center transition-opacity duration-500 ${
          isStreet ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="pointer-events-auto">
          <GooeySearchBar<BuildingSearchItem>
            items={searchItems}
            onSelect={handleSearchPick}
            placeholder="Search buildings…"
            maxResults={6}
          />
        </div>
      </div>

      {/* Back-to-globe pill. Always visible in idle / flying. Hidden during
          the full-screen pano because the Street View close button sits in
          the same quadrant. */}
      <Link
        href="/"
        className={`group absolute left-4 bottom-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/80 ${
          isStreet ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Globe
      </Link>

      {/* During the cinematic fly-in, surface a slim status chip so the user
          has a confirmation that the map is responding to their click. */}
      {isFlying && selected && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/85 backdrop-blur">
          Flying to {selected.name}…
        </div>
      )}

      {/* Full-screen panorama overlay. Mounted as soon as a building is
          selected so the pano (either Google Street View or a bundled
          GLB capture) starts fetching during the fly-in, then fades in
          once the camera has locked onto the target. Route switches
          based on `panoramaMode` carried on the target. */}
      <div
        className={`absolute inset-0 z-30 transition-opacity duration-700 ease-out ${
          isStreet
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isStreet}
      >
        {selected && selected.panoramaMode === "pano" ? (
          <BuildingPanorama target={selected} onClose={handleClose} />
        ) : selected ? (
          <StreetView target={selected} onClose={handleClose} />
        ) : null}
      </div>
    </main>
  );
}
