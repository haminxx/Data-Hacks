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

const PRICE_CENTER_VIEW: ViewState = {
  longitude: -117.2366,
  latitude: 32.8799,
  zoom: 17.2,
  pitch: 60,
  bearing: 25,
  minZoom: 13.5,
  maxZoom: 19,
};

const GEISEL_VIEW: ViewState = {
  longitude: -117.2374,
  latitude: 32.8811,
  zoom: 17.6,
  pitch: 62,
  bearing: -10,
  minZoom: 13.5,
  maxZoom: 19,
};

const RIMAC_VIEW: ViewState = {
  longitude: -117.239,
  latitude: 32.8866,
  zoom: 17.2,
  pitch: 60,
  bearing: 30,
  minZoom: 13.5,
  maxZoom: 19,
};

const REC_GYM_VIEW: ViewState = {
  longitude: -117.2365,
  latitude: 32.8786,
  zoom: 17.8,
  pitch: 62,
  bearing: 18,
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

interface Map25DProps {
  onBuildingSelect?: (target: StreetViewTarget | null) => void;
  selectedName?: string | null;
}

export default function Map25D({
  onBuildingSelect,
  selectedName = null,
}: Map25DProps) {
  const [features, setFeatures] = useState<BuildingFeature[]>([]);
  const [viewState, setViewState] = useState<ViewState>(CAMPUS_VIEW);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const onSelectRef = useRef(onBuildingSelect);
  onSelectRef.current = onBuildingSelect;

  useEffect(() => {
    let cancelled = false;
    fetch("/ucsd_buildings_full.geojson", { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<BuildingCollection>;
      })
      .then((gj) => {
        if (cancelled) return;
        setFeatures(gj.features ?? []);
        setReady(true);
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

  const goTo = useCallback((target: ViewState) => {
    setViewState({
      ...target,
      transitionDuration: 2200,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.6 }),
    });
  }, []);

  const lightingEffect = useMemo(() => {
    const ambient = new AmbientLight({
      color: [255, 255, 255],
      intensity: 1.25,
    });
    const sun = new DirectionalLight({
      color: [255, 245, 220],
      intensity: 2.4,
      direction: [-2, -8, -3],
    });
    const fill = new DirectionalLight({
      color: [200, 220, 255],
      intensity: 1.0,
      direction: [5, -1, -4],
    });
    return new LightingEffect({ ambient, sun, fill });
  }, []);

  const selectedId = useMemo(() => {
    if (!selectedName) return null;
    const hit = features.find((f) => f.properties.name === selectedName);
    return hit?.properties.id ?? null;
  }, [features, selectedName]);

  const layers = useMemo(() => {
    const basemap = new TileLayer({
      id: "carto-dark-matter",
      // Dark Matter = graphic dark basemap with visible street grid + labels.
      // Non-satellite, reads as a stylized map rather than imagery.
      data: [
        "https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png",
      ],
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
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
    });

    const buildings = new PolygonLayer<BuildingFeature>({
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
      material: {
        ambient: 0.35,
        diffuse: 0.85,
        shininess: 56,
        specularColor: [180, 200, 230],
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

    return [basemap, buildings];
  }, [features, hoveredId, selectedId]);

  const hoveredFeature = hoveredId
    ? features.find((f) => f.properties.id === hoveredId)
    : null;

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
        getCursor={({ isDragging, isHovering }) =>
          isDragging ? "grabbing" : isHovering ? "pointer" : "grab"
        }
      />

      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-xs rounded-xl border border-white/10 bg-black/60 p-4 text-white backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-white/55">
          SeismoShield · UCSD Campus
        </p>
        <p className="mt-1 text-lg font-semibold text-white">
          La Jolla Urban Model
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/75">
          {features.length > 0
            ? `${features.length.toLocaleString()} buildings extruded from OSM footprints, locked to the UCSD campus.`
            : "Loading UCSD building footprints…"}
          {" "}Click any building to open Street View 360°.
        </p>
        <div className="pointer-events-auto mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => goTo(CAMPUS_VIEW)}
            className="rounded-full bg-[#1A56DB] px-3 py-1 text-xs font-semibold hover:bg-[#1647b3]"
          >
            Campus
          </button>
          <button
            type="button"
            onClick={() => goTo(PRICE_CENTER_VIEW)}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold hover:bg-white/10"
          >
            Price Center
          </button>
          <button
            type="button"
            onClick={() => goTo(GEISEL_VIEW)}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold hover:bg-white/10"
          >
            Geisel Library
          </button>
          <button
            type="button"
            onClick={() => goTo(RIMAC_VIEW)}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold hover:bg-white/10"
          >
            RIMAC Arena
          </button>
          <button
            type="button"
            onClick={() => goTo(REC_GYM_VIEW)}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold hover:bg-white/10"
          >
            Rec Gym
          </button>
        </div>
      </div>

      {hoveredFeature && (
        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-lg border border-[#1A56DB]/50 bg-[#0F172A]/95 px-3 py-2 text-sm text-white shadow-lg backdrop-blur">
          <p className="font-semibold text-[#93c5fd]">
            {hoveredFeature.properties.name}
          </p>
          <p className="text-xs text-white/65">
            {Math.round(hoveredFeature.properties.height)} m ·{" "}
            {hoveredFeature.properties.category}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
            Click to view 360°
          </p>
        </div>
      )}

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
        © OpenStreetMap · CARTO · SeismoShield
      </div>
    </div>
  );
}
