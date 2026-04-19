"use client";

import { FlyToInterpolator } from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer, PolygonLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { useCallback, useEffect, useMemo, useState } from "react";

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

const INITIAL_VIEW = {
  longitude: -117.16,
  latitude: 32.78,
  zoom: 10.8,
  pitch: 45,
  bearing: 0,
  minZoom: 8,
  maxZoom: 19,
};

const FOCUS_VIEW = {
  longitude: -117.161,
  latitude: 32.714,
  zoom: 14.6,
  pitch: 58,
  bearing: 24,
  minZoom: 8,
  maxZoom: 19,
};

const UCSD_VIEW = {
  longitude: -117.2364,
  latitude: 32.8801,
  zoom: 15.4,
  pitch: 60,
  bearing: 30,
  minZoom: 8,
  maxZoom: 19,
};

const CATEGORY_COLORS: Record<string, [number, number, number]> = {
  commercial: [59, 130, 246],
  residential: [168, 85, 247],
  hotel: [236, 72, 153],
  civic: [234, 179, 8],
  education: [34, 197, 94],
};

function colorFor(
  feature: SanGisFeature,
  hovered: string | null,
): [number, number, number, number] {
  const base =
    CATEGORY_COLORS[feature.properties.category ?? "commercial"] ?? [
      59, 130, 246,
    ];
  const isHover = hovered === feature.properties.name;
  const alpha = isHover ? 235 : 190;
  const boost = isHover ? 35 : 0;
  return [
    Math.min(255, base[0] + boost),
    Math.min(255, base[1] + boost),
    Math.min(255, base[2] + boost),
    alpha,
  ];
}

export default function Map25D() {
  const [features, setFeatures] = useState<SanGisFeature[]>([]);
  const [viewState, setViewState] = useState<typeof INITIAL_VIEW>(INITIAL_VIEW);
  const [hoverName, setHoverName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/sangis_san_diego.geojson")
      .then((r) => r.json() as Promise<SanGisCollection>)
      .then((gj) => {
        if (!cancelled) setFeatures(gj.features ?? []);
      })
      .catch(() => {
        if (!cancelled) setFeatures([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setViewState((vs) => ({
        ...vs,
        ...FOCUS_VIEW,
        transitionDuration: 2800,
        transitionInterpolator: new FlyToInterpolator({ speed: 1.6 }),
      }) as typeof INITIAL_VIEW);
    }, 600);
    return () => window.clearTimeout(timer);
  }, []);

  const goTo = useCallback(
    (target: typeof INITIAL_VIEW) => {
      setViewState({
        ...target,
        transitionDuration: 2200,
        transitionInterpolator: new FlyToInterpolator({ speed: 1.8 }),
      } as typeof INITIAL_VIEW);
    },
    [],
  );

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
      getElevation: (f) => f.properties.height,
      getFillColor: (f) => colorFor(f, hoverName),
      getLineColor: (f) =>
        hoverName === f.properties.name
          ? [219, 234, 254, 255]
          : [26, 86, 219, 210],
      lineWidthMinPixels: 1.2,
      material: {
        ambient: 0.5,
        diffuse: 0.7,
        shininess: 48,
        specularColor: [80, 120, 200],
      },
      pickable: true,
      autoHighlight: true,
      highlightColor: [26, 86, 219, 90],
      onHover: (info) => {
        setHoverName(info.object ? info.object.properties.name : null);
      },
      updateTriggers: {
        getFillColor: [hoverName],
        getLineColor: [hoverName],
      },
    });

    return [basemap, buildings];
  }, [features, hoverName]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0F172A]">
      <DeckGL
        initialViewState={INITIAL_VIEW}
        viewState={viewState}
        controller={{ dragRotate: true, inertia: 500 }}
        onViewStateChange={(evt) =>
          setViewState(evt.viewState as typeof INITIAL_VIEW)
        }
        layers={layers}
      />

      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-xs rounded-xl border border-white/10 bg-black/60 p-4 text-white backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-white/50">
          SeismoShield · 2.5D Map
        </p>
        <p className="mt-1 text-lg font-semibold text-white">
          San Diego Urban Model
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/70">
          Interactive deck.gl view powered by SanGIS building footprints.
          Drag to pan, scroll to zoom, hold <kbd className="rounded bg-white/10 px-1">Ctrl</kbd> + drag to tilt & rotate.
        </p>
        <div className="pointer-events-auto mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => goTo(FOCUS_VIEW)}
            className="rounded-full bg-[#1A56DB] px-3 py-1 text-xs font-semibold hover:bg-[#1647b3]"
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
          <button
            type="button"
            onClick={() => goTo(INITIAL_VIEW)}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold hover:bg-white/10"
          >
            Wide View
          </button>
        </div>
      </div>

      {hoverName && (
        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-lg border border-[#1A56DB]/50 bg-[#0F172A]/95 px-3 py-2 text-sm text-white shadow-lg backdrop-blur">
          <p className="font-semibold text-[#93c5fd]">{hoverName}</p>
          <p className="text-xs text-white/60">
            {
              features.find((f) => f.properties.name === hoverName)?.properties
                .height
            }
            m · SanGIS footprint
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 right-4 z-10 text-[10px] uppercase tracking-[0.15em] text-white/40">
        © OpenStreetMap · CARTO · SanGIS
      </div>

      {!loaded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0F172A]/80 text-sm text-white/70">
          Loading SanGIS model…
        </div>
      )}
    </div>
  );
}
