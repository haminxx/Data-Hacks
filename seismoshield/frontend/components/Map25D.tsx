"use client";

import {
  AmbientLight,
  DirectionalLight,
  FlyToInterpolator,
  LightingEffect,
} from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer, PolygonLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StreetViewTarget } from "./StreetView";

type SanGisFeature = {
  type: "Feature";
  properties: {
    name: string;
    height: number;
    category?: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
};

type SanGisCollection = {
  type: "FeatureCollection";
  features: SanGisFeature[];
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

const WIDE_SD_VIEW: ViewState = {
  longitude: -117.08,
  latitude: 32.87,
  zoom: 9.3,
  pitch: 35,
  bearing: 0,
  minZoom: 7,
  maxZoom: 19,
};

const DOWNTOWN_VIEW: ViewState = {
  longitude: -117.161,
  latitude: 32.714,
  zoom: 14.8,
  pitch: 60,
  bearing: 24,
  minZoom: 7,
  maxZoom: 19,
};

const UCSD_VIEW: ViewState = {
  longitude: -117.2364,
  latitude: 32.8801,
  zoom: 15.6,
  pitch: 60,
  bearing: 30,
  minZoom: 7,
  maxZoom: 19,
};

const CATEGORY_COLORS: Record<string, [number, number, number]> = {
  commercial: [96, 165, 250],
  residential: [192, 132, 252],
  hotel: [244, 114, 182],
  civic: [250, 204, 21],
  education: [74, 222, 128],
};

const HEIGHT_EXAGGERATION = 3.2;

function colorFor(
  feature: SanGisFeature,
  hovered: string | null,
  selected: string | null,
): [number, number, number, number] {
  const base =
    CATEGORY_COLORS[feature.properties.category ?? "commercial"] ?? [
      96, 165, 250,
    ];
  const isHover = hovered === feature.properties.name;
  const isSelected = selected === feature.properties.name;
  const alpha = isSelected ? 255 : isHover ? 240 : 210;
  const boost = isSelected ? 55 : isHover ? 30 : 0;
  return [
    Math.min(255, base[0] + boost),
    Math.min(255, base[1] + boost),
    Math.min(255, base[2] + boost),
    alpha,
  ];
}

function polygonCentroid(ring: number[][]): [number, number] {
  let sumLng = 0;
  let sumLat = 0;
  const uniq = ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
    ? ring.slice(0, -1)
    : ring;
  for (const [lng, lat] of uniq) {
    sumLng += lng;
    sumLat += lat;
  }
  return [sumLng / uniq.length, sumLat / uniq.length];
}

interface Map25DProps {
  onBuildingSelect?: (target: StreetViewTarget | null) => void;
  selectedName?: string | null;
}

export default function Map25D({
  onBuildingSelect,
  selectedName = null,
}: Map25DProps) {
  const [features, setFeatures] = useState<SanGisFeature[]>([]);
  const [viewState, setViewState] = useState<ViewState>(WIDE_SD_VIEW);
  const [hoverName, setHoverName] = useState<string | null>(null);
  const onSelectRef = useRef(onBuildingSelect);

  useEffect(() => {
    onSelectRef.current = onBuildingSelect;
  }, [onBuildingSelect]);

  useEffect(() => {
    let cancelled = false;
    fetch("/sangis_san_diego.geojson", { cache: "force-cache" })
      .then((r) => r.json() as Promise<SanGisCollection>)
      .then((gj) => {
        if (!cancelled) setFeatures(gj.features ?? []);
      })
      .catch(() => {
        if (!cancelled) setFeatures([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const goTo = useCallback((target: ViewState) => {
    setViewState({
      ...target,
      transitionDuration: 2200,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.8 }),
    });
  }, []);

  const lightingEffect = useMemo(() => {
    const ambient = new AmbientLight({
      color: [255, 255, 255],
      intensity: 1.2,
    });
    const sun = new DirectionalLight({
      color: [255, 245, 225],
      intensity: 2.6,
      direction: [-3, -9, -3],
    });
    const fill = new DirectionalLight({
      color: [160, 180, 255],
      intensity: 1.1,
      direction: [4, -2, -5],
    });
    return new LightingEffect({ ambient, sun, fill });
  }, []);

  const layers = useMemo(() => {
    const basemap = new TileLayer({
      id: "carto-dark-tiles",
      data: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
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

    const buildings = new PolygonLayer<SanGisFeature>({
      id: "sangis-buildings",
      data: features,
      extruded: true,
      wireframe: false,
      getPolygon: (f) => f.geometry.coordinates[0] as unknown as number[][],
      getElevation: (f) => f.properties.height * HEIGHT_EXAGGERATION,
      getFillColor: (f) => colorFor(f, hoverName, selectedName),
      getLineColor: (f) =>
        selectedName === f.properties.name
          ? [255, 255, 255, 255]
          : hoverName === f.properties.name
            ? [219, 234, 254, 240]
            : [26, 86, 219, 150],
      lineWidthMinPixels: 1.2,
      material: {
        ambient: 0.35,
        diffuse: 0.85,
        shininess: 64,
        specularColor: [120, 160, 220],
      },
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 90],
      onHover: (info) => {
        setHoverName(info.object ? info.object.properties.name : null);
      },
      onClick: (info) => {
        if (!info.object) return;
        const feature = info.object as SanGisFeature;
        const ring = feature.geometry.coordinates[0] as unknown as number[][];
        const [lng, lat] = polygonCentroid(ring);
        onSelectRef.current?.({
          name: feature.properties.name,
          height: feature.properties.height,
          category: feature.properties.category,
          lng,
          lat,
        });
      },
      updateTriggers: {
        getFillColor: [hoverName, selectedName],
        getLineColor: [hoverName, selectedName],
      },
    });

    return [basemap, buildings];
  }, [features, hoverName, selectedName]);

  const hoveredFeature = hoverName
    ? features.find((f) => f.properties.name === hoverName)
    : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0F172A]">
      <DeckGL
        initialViewState={WIDE_SD_VIEW}
        viewState={viewState}
        controller={{ dragRotate: true, inertia: 500 }}
        onViewStateChange={(evt) => setViewState(evt.viewState as ViewState)}
        layers={layers}
        effects={[lightingEffect]}
        getCursor={({ isDragging, isHovering }) =>
          isDragging ? "grabbing" : isHovering ? "pointer" : "grab"
        }
      />

      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-xs rounded-xl border border-white/10 bg-black/60 p-4 text-white backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-white/50">
          SeismoShield · 2.5D Map
        </p>
        <p className="mt-1 text-lg font-semibold text-white">
          San Diego Urban Model
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/70">
          Click a building to open Google Street View 360°. Drag to pan, scroll
          to zoom, hold <kbd className="rounded bg-white/10 px-1">Ctrl</kbd> +
          drag to tilt & rotate.
        </p>
        <div className="pointer-events-auto mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => goTo(WIDE_SD_VIEW)}
            className="rounded-full bg-[#1A56DB] px-3 py-1 text-xs font-semibold hover:bg-[#1647b3]"
          >
            San Diego
          </button>
          <button
            type="button"
            onClick={() => goTo(DOWNTOWN_VIEW)}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold hover:bg-white/10"
          >
            Downtown
          </button>
          <button
            type="button"
            onClick={() => goTo(UCSD_VIEW)}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold hover:bg-white/10"
          >
            UCSD Campus
          </button>
        </div>
      </div>

      {hoveredFeature && (
        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-lg border border-[#1A56DB]/50 bg-[#0F172A]/95 px-3 py-2 text-sm text-white shadow-lg backdrop-blur">
          <p className="font-semibold text-[#93c5fd]">
            {hoveredFeature.properties.name}
          </p>
          <p className="text-xs text-white/60">
            {hoveredFeature.properties.height} m ·{" "}
            {hoveredFeature.properties.category ?? "building"}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
            Click to view 360°
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 right-4 z-10 text-[10px] uppercase tracking-[0.15em] text-white/40">
        © OpenStreetMap · CARTO · SanGIS
      </div>
    </div>
  );
}
