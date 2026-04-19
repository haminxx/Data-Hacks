"use client";

import {
  AmbientLight,
  DirectionalLight,
  FlyToInterpolator,
  LightingEffect,
} from "@deck.gl/core";
import type { PickingInfo } from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer, PolygonLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StreetViewTarget } from "./StreetView";

type BuildingFeature = {
  type: "Feature";
  properties: {
    id: string;
    name: string;
    category: string;
    height: number;
    osm_building?: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
};

type BuildingCollection = {
  type: "FeatureCollection";
  features: BuildingFeature[];
};

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  minZoom: number;
  maxZoom: number;
  transitionDuration?: number;
  transitionInterpolator?: FlyToInterpolator;
};

// Generous but UCSD-scoped bounding box so users can't pan away from campus.
const UCSD_BOUNDS = {
  west: -117.253,
  east: -117.214,
  south: 32.866,
  north: 32.9,
};

// Default entry — zoomed OUT so the whole UCSD campus reads at a glance.
const CAMPUS_VIEW: ViewState = {
  longitude: -117.2335,
  latitude: 32.8815,
  zoom: 14.2,
  pitch: 48,
  bearing: 12,
  minZoom: 13.5,
  maxZoom: 19,
};

const HEIGHT_EXAGGERATION = 1.6;

const CATEGORY_COLORS: Record<string, [number, number, number]> = {
  education: [59, 130, 246],
  residential: [168, 85, 247],
  athletic: [249, 115, 22],
  medical: [239, 68, 68],
  commercial: [6, 182, 212],
  parking: [148, 163, 184],
  generic: [125, 211, 252],
};

function polygonCentroid(ring: number[][]): [number, number] {
  const uniq =
    ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring;
  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of uniq) {
    sumLng += lng;
    sumLat += lat;
  }
  return [sumLng / uniq.length, sumLat / uniq.length];
}

function colorFor(
  feature: BuildingFeature,
  hoveredId: string | null,
  selectedId: string | null,
): [number, number, number, number] {
  const base =
    CATEGORY_COLORS[feature.properties.category] ?? CATEGORY_COLORS.generic;
  const isHover = hoveredId === feature.properties.id;
  const isSelected = selectedId === feature.properties.id;
  const alpha = isSelected ? 255 : isHover ? 240 : 215;
  const boost = isSelected ? 45 : isHover ? 25 : 0;
  return [
    Math.min(255, base[0] + boost),
    Math.min(255, base[1] + boost),
    Math.min(255, base[2] + boost),
    alpha,
  ];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export type BuildingIndexEntry = {
  id: string;
  name: string;
  category: string;
  height: number;
  lng: number;
  lat: number;
};

interface Map25DProps {
  onBuildingSelect?: (target: StreetViewTarget | null) => void;
  selectedName?: string | null;
  onBuildingsLoaded?: (buildings: BuildingIndexEntry[]) => void;
}

export default function Map25D({
  onBuildingSelect,
  selectedName = null,
  onBuildingsLoaded,
}: Map25DProps) {
  const [features, setFeatures] = useState<BuildingFeature[]>([]);
  const [viewState, setViewState] = useState<ViewState>(CAMPUS_VIEW);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const onSelectRef = useRef(onBuildingSelect);
  onSelectRef.current = onBuildingSelect;
  const onBuildingsLoadedRef = useRef(onBuildingsLoaded);
  onBuildingsLoadedRef.current = onBuildingsLoaded;

  useEffect(() => {
    let cancelled = false;
    fetch("/ucsd_buildings_full.geojson", { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<BuildingCollection>;
      })
      .then((gj) => {
        if (cancelled) return;
        const feats = gj.features ?? [];
        setFeatures(feats);
        setReady(true);
        // Publish a lightweight index of named buildings so consumers can
        // drive a search bar without re-fetching the GeoJSON themselves.
        const index: BuildingIndexEntry[] = [];
        const seenNames = new Set<string>();
        for (const f of feats) {
          const name = f.properties.name;
          if (!name || name === "Building" || seenNames.has(name)) continue;
          seenNames.add(name);
          const ring = f.geometry.coordinates[0] as unknown as number[][];
          const [lng, lat] = polygonCentroid(ring);
          index.push({
            id: f.properties.id,
            name,
            category: f.properties.category,
            height: f.properties.height,
            lng,
            lat,
          });
        }
        index.sort((a, b) => a.name.localeCompare(b.name));
        onBuildingsLoadedRef.current?.(index);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err));
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // When the parent sets a new `selectedName` (either via the search bar or
  // by clicking a building on the map), fly the camera in close with a steep
  // tilt so the building fills the frame. The parent uses this animation
  // window to cross-fade into Street View.
  const lastFlownNameRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedName) {
      lastFlownNameRef.current = null;
      return;
    }
    if (features.length === 0) return;
    if (lastFlownNameRef.current === selectedName) return;
    const hit = features.find((f) => f.properties.name === selectedName);
    if (!hit) return;
    const ring = hit.geometry.coordinates[0] as unknown as number[][];
    const [lng, lat] = polygonCentroid(ring);
    lastFlownNameRef.current = selectedName;
    setViewState((prev) => ({
      ...prev,
      longitude: clamp(lng, UCSD_BOUNDS.west, UCSD_BOUNDS.east),
      latitude: clamp(lat, UCSD_BOUNDS.south, UCSD_BOUNDS.north),
      zoom: 18.2,
      pitch: 62,
      bearing: (prev.bearing + 18) % 360,
      minZoom: prev.minZoom,
      maxZoom: prev.maxZoom,
      transitionDuration: 1700,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.9 }),
    }));
  }, [selectedName, features]);

  // Lighting stays cinematic but trimmed — each DirectionalLight costs a
  // per-fragment dot product across every extruded polygon, so softening
  // the intensities gives a visibly smoother frame-rate on integrated
  // GPUs without washing out the building silhouettes.
  const lightingEffect = useMemo(() => {
    const ambient = new AmbientLight({
      color: [255, 255, 255],
      intensity: 1.1,
    });
    const sun = new DirectionalLight({
      color: [255, 245, 220],
      intensity: 2.0,
      direction: [-2, -8, -3],
    });
    const fill = new DirectionalLight({
      color: [200, 220, 255],
      intensity: 0.7,
      direction: [5, -1, -4],
    });
    return new LightingEffect({ ambient, sun, fill });
  }, []);

  // Basemap is completely independent of hover / selection state, so we
  // keep it in its own memo with no deps. That way the deck.gl diff for
  // hover events only has to touch the PolygonLayer, not re-instantiate
  // the TileLayer + BitmapLayer sublayers on every mousemove.
  const basemapLayer = useMemo(
    () =>
      new TileLayer({
        id: "carto-dark-matter",
        // Dark Matter = graphic dark basemap with visible street grid +
        // labels. Non-satellite, reads as a stylized map rather than
        // imagery.
        data: [
          "https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png",
        ],
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        // Keep a bounded pool so panning around campus doesn't keep
        // piling texture memory forever on long sessions.
        maxCacheSize: 200,
        renderSubLayers: (props) => {
          const tile = props.tile as unknown as {
            boundingBox: [[number, number], [number, number]];
          };
          const [[west, south], [east, north]] = tile.boundingBox;
          return new BitmapLayer(props, {
            id: `${props.id}-bitmap`,
            data: undefined,
            image: props.data as string,
            bounds: [west, south, east, north],
          });
        },
      }),
    [],
  );

  const selectedId = useMemo(() => {
    if (!selectedName) return null;
    const hit = features.find((f) => f.properties.name === selectedName);
    return hit?.properties.id ?? null;
  }, [features, selectedName]);

  const buildingsLayer = useMemo(() => {
    return new PolygonLayer<BuildingFeature>({
      id: "ucsd-buildings-3d",
      data: features,
      extruded: true,
      wireframe: false,
      getPolygon: (f) => f.geometry.coordinates[0] as unknown as number[][],
      getElevation: (f) => f.properties.height * HEIGHT_EXAGGERATION,
      getFillColor: (f) => colorFor(f, hoveredId, selectedId),
      getLineColor: (f) =>
        selectedId === f.properties.id
          ? [255, 255, 255, 255]
          : hoveredId === f.properties.id
            ? [255, 255, 255, 230]
            : [255, 255, 255, 55],
      lineWidthMinPixels: 0.6,
      // Trimmed specular keeps the buildings readable without the
      // expensive high-shininess Blinn-Phong term on every fragment.
      material: {
        ambient: 0.35,
        diffuse: 0.8,
        shininess: 28,
        specularColor: [170, 190, 220],
      },
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 80],
      onHover: (info) => {
        const f = info.object as BuildingFeature | undefined;
        setHoveredId(f ? f.properties.id : null);
      },
      onClick: (info) => {
        const f = info.object as BuildingFeature | undefined;
        if (!f) return;
        const ring = f.geometry.coordinates[0] as unknown as number[][];
        const [lng, lat] = polygonCentroid(ring);
        onSelectRef.current?.({
          name: f.properties.name,
          height: f.properties.height,
          category: f.properties.category,
          lng,
          lat,
        });
      },
      updateTriggers: {
        getFillColor: [hoveredId, selectedId],
        getLineColor: [hoveredId, selectedId],
      },
    });
  }, [features, hoveredId, selectedId]);

  const layers = useMemo(
    () => [basemapLayer, buildingsLayer],
    [basemapLayer, buildingsLayer],
  );

  const clampView = useCallback((next: ViewState): ViewState => {
    return {
      ...next,
      longitude: clamp(next.longitude, UCSD_BOUNDS.west, UCSD_BOUNDS.east),
      latitude: clamp(next.latitude, UCSD_BOUNDS.south, UCSD_BOUNDS.north),
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050814]">
      <DeckGL
        initialViewState={CAMPUS_VIEW}
        viewState={viewState}
        controller={{ dragRotate: true, inertia: 500 }}
        onViewStateChange={(evt) =>
          setViewState(clampView(evt.viewState as ViewState))
        }
        layers={layers}
        effects={[lightingEffect]}
        // Cap the render DPR at 1.5 even on 3x retina displays. The
        // visual delta between 1.5x and 3x is imperceptible on a
        // stylized basemap, but the fragment cost doubles. This alone
        // gives the biggest single FPS win on high-density laptops.
        useDevicePixels={1.5}
        getCursor={({ isDragging, isHovering }) =>
          isDragging ? "grabbing" : isHovering ? "pointer" : "grab"
        }
      />

      {/* The top-left info card and the hover tooltip were intentionally
          removed — /map has only the search bar and the map surface. The
          loading + error badges below are still useful and sit top-right. */}

      {!ready && (
        <div className="pointer-events-none absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1A56DB]/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1A56DB]" />
          </span>
          Loading UCSD campus…
        </div>
      )}

      {loadError && (
        <div className="pointer-events-none absolute right-4 top-4 z-10 max-w-xs rounded-lg border border-amber-500/40 bg-amber-900/40 px-3 py-2 text-[11px] text-amber-100 backdrop-blur">
          Failed to load building data: {loadError}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 right-4 z-10 text-[10px] uppercase tracking-[0.15em] text-white/55">
        © OpenStreetMap · CARTO · Quarte
      </div>
    </div>
  );
}
