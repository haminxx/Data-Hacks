"use client";

import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { Loader } from "@googlemaps/js-api-loader";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { getDemo, getHeatmap, type DemoResponse } from "@/lib/api";

const INITIAL = {
  lat: 32.7157,
  lng: -117.1611,
  zoom: 10,
  pitch: 45,
  heading: 0,
};

const TARGET = {
  lat: 32.8801,
  lng: -117.234,
  zoom: 16,
  pitch: 60,
  heading: 30,
};

const SALTON_EPICENTER = { lon: -115.54, lat: 33.19 };
const REC_GYM = { lon: -117.2364, lat: 32.8786 };

type GeoFeature = {
  type: "Feature";
  properties: { name?: string };
  geometry: { type: "Polygon"; coordinates: number[][][] };
};

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerpCamera(
  a: typeof INITIAL,
  b: typeof TARGET,
  t: number,
): google.maps.CameraOptions {
  const e = easeInOutCubic(t);
  return {
    center: {
      lat: a.lat + (b.lat - a.lat) * e,
      lng: a.lng + (b.lng - a.lng) * e,
    },
    zoom: a.zoom + (b.zoom - a.zoom) * e,
    tilt: a.pitch + (b.pitch - a.pitch) * e,
    heading: a.heading + (b.heading - a.heading) * e,
  };
}

type SeismoMapProps = {
  /** When true, play intro fly (e.g. section just expanded). */
  active?: boolean;
};

export default function SeismoMap({ active = true }: SeismoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);
  const introDoneRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [heatmapPoints, setHeatmapPoints] = useState<
    { lat: number; lon: number; pgv: number }[]
  >([]);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0);
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [hoverName, setHoverName] = useState<string | null>(null);
  const [demo, setDemo] = useState<DemoResponse | null>(null);
  const [showRecCard, setShowRecCard] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/ucsd_buildings.geojson")
      .then((r) => r.json())
      .then((gj) => {
        if (!cancelled) setFeatures(gj.features ?? []);
      })
      .catch(() => {});
    getDemo()
      .then((d) => {
        if (!cancelled) setDemo(d);
      })
      .catch(() => {});
    getHeatmap(6.5, SALTON_EPICENTER.lat, SALTON_EPICENTER.lon)
      .then((h) => {
        if (!cancelled) setHeatmapPoints(h.points ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 120);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1500;
    const tickFade = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setHeatmapOpacity(t);
      if (t < 1) raf = requestAnimationFrame(tickFade);
    };
    raf = requestAnimationFrame(tickFade);
    return () => cancelAnimationFrame(raf);
  }, []);

  const runIntroFly = useCallback(() => {
    const map = mapRef.current;
    if (!map || introDoneRef.current) return;
    introDoneRef.current = true;
    window.setTimeout(() => {
      const start = performance.now();
      const dur = 3000;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        map.moveCamera(lerpCamera(INITIAL, TARGET, t));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 500);
  }, []);

  useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!el || !apiKey) {
      setError(
        apiKey ? "Map container missing" : "Add NEXT_PUBLIC_GOOGLE_MAPS_KEY",
      );
      return;
    }

    let cancelled = false;
    const loader = new Loader({ apiKey, version: "weekly" });
    (async () => {
      await loader.importLibrary("maps");
      if (cancelled || !el) return;
      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;
      const map = new google.maps.Map(el, {
        center: { lat: INITIAL.lat, lng: INITIAL.lng },
        zoom: INITIAL.zoom,
        mapId: mapId || undefined,
        tilt: INITIAL.pitch,
        heading: INITIAL.heading,
        disableDefaultUI: true,
        gestureHandling: "greedy",
      });
      mapRef.current = map;
      const overlay = new GoogleMapsOverlay({ interleaved: true, layers: [] });
      overlay.setMap(map);
      overlayRef.current = overlay;
      runIntroFly();
    })().catch(() => setError("Failed to load Google Maps"));

    return () => {
      cancelled = true;
      overlayRef.current?.setMap(null);
      overlayRef.current?.finalize();
      overlayRef.current = null;
      mapRef.current = null;
    };
  }, [active, runIntroFly]);

  const maxPgv = Math.max(1, ...heatmapPoints.map((p) => p.pgv));

  const buildLayers = useCallback(() => {
    const pulse =
      400 + 350 * Math.sin((typeof performance !== "undefined" ? performance.now() : 0) / 600);

    const heatmap = new HeatmapLayer({
      id: "seismic-heatmap",
      data: heatmapPoints,
      getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat],
      getWeight: (d: { pgv: number }) => d.pgv / maxPgv,
      radiusPixels: 60,
      intensity: 1,
      threshold: 0.05,
      opacity: heatmapOpacity,
      colorRange: [
        [22, 163, 74, 0],
        [22, 163, 74, 140],
        [202, 138, 4, 180],
        [234, 88, 12, 210],
        [220, 38, 38, 240],
      ],
    });

    const buildings = new PolygonLayer<GeoFeature>({
      id: "ucsd-buildings",
      data: features,
      extruded: true,
      getPolygon: (d) => d.geometry.coordinates[0] as unknown as number[][],
      getElevation: (d) =>
        /recreation/i.test(d.properties?.name ?? "") ? 28 : 20,
      getFillColor: [30, 41, 59, 180],
      lineWidthMinPixels: 1.5,
      material: {
        ambient: 0.4,
        diffuse: 0.6,
        shininess: 32,
      },
      pickable: true,
      onHover: (info) => {
        const n = info.object?.properties?.name ?? null;
        setHoverName(info.object ? String(n) : null);
      },
      updateTriggers: {
        getLineColor: [hoverName],
      },
      getLineColor: (d: GeoFeature) =>
        hoverName && d.properties?.name === hoverName
          ? [59, 130, 246, 255]
          : [26, 86, 219, 255],
    });

    const epicenter = new ScatterplotLayer({
      id: "epicenter-pulse",
      data: [
        {
          position: [SALTON_EPICENTER.lon, SALTON_EPICENTER.lat] as [
            number,
            number,
          ],
          r: pulse,
        },
        {
          position: [SALTON_EPICENTER.lon, SALTON_EPICENTER.lat] as [
            number,
            number,
          ],
          r: pulse * 0.65,
        },
        {
          position: [SALTON_EPICENTER.lon, SALTON_EPICENTER.lat] as [
            number,
            number,
          ],
          r: pulse * 0.35,
        },
      ],
      getPosition: (d: { position: [number, number] }) => d.position,
      getRadius: (d: { r: number }) => d.r,
      getFillColor: [220, 38, 38, 120],
      getLineColor: [220, 38, 38, 200],
      stroked: true,
      lineWidthMinPixels: 1,
      radiusUnits: "meters",
    });

    const recMarker = new ScatterplotLayer({
      id: "rec-gym",
      data: [
        {
          position: [REC_GYM.lon, REC_GYM.lat] as [number, number],
        },
      ],
      getPosition: (d: { position: [number, number] }) => d.position,
      getRadius: () => 45,
      getFillColor: [26, 86, 219, 220],
      getLineColor: [255, 255, 255, 255],
      stroked: true,
      lineWidthMinPixels: 2,
      radiusUnits: "meters",
      pickable: true,
      onClick: () => setShowRecCard((v) => !v),
    });

    return [heatmap, buildings, epicenter, recMarker];
  }, [features, heatmapPoints, heatmapOpacity, maxPgv, hoverName, tick]);

  useEffect(() => {
    const ov = overlayRef.current;
    if (!ov) return;
    ov.setProps({
      layers: buildLayers(),
    });
  }, [buildLayers]);

  const resetView = () => {
    const map = mapRef.current;
    if (!map) return;
    introDoneRef.current = false;
    const start = performance.now();
    const cur = {
      lat: map.getCenter()!.lat(),
      lng: map.getCenter()!.lng(),
      zoom: map.getZoom() ?? 10,
      pitch: map.getTilt() ?? 45,
      heading: map.getHeading() ?? 0,
    };
    const dur = 2000;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = easeInOutCubic(t);
      map.moveCamera({
        center: {
          lat: cur.lat + (INITIAL.lat - cur.lat) * e,
          lng: cur.lng + (INITIAL.lng - cur.lng) * e,
        },
        zoom: cur.zoom + (INITIAL.zoom - cur.zoom) * e,
        tilt: cur.pitch + (INITIAL.pitch - cur.pitch) * e,
        heading: cur.heading + (INITIAL.heading - cur.heading) * e,
      });
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const analyzeUcsd = () => {
    introDoneRef.current = false;
    runIntroFly();
  };

  if (error) {
    return (
      <div className="flex h-[min(70vh,520px)] w-full items-center justify-center rounded-xl border border-white/10 bg-[#0b1224] p-4 text-center text-sm text-white/70">
        {error}
      </div>
    );
  }

  return (
    <div className="relative h-[min(70vh,560px)] w-full overflow-hidden rounded-xl border border-white/10">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[min(90%,16rem)] rounded-lg bg-black/55 px-3 py-2 text-xs text-white backdrop-blur-sm">
        {hoverName ? (
          <span className="font-medium text-[#93c5fd]">{hoverName}</span>
        ) : (
          <span className="text-white/60">Hover a building</span>
        )}
      </div>
      {showRecCard && demo && (
        <div className="absolute bottom-4 left-4 z-10 max-w-xs rounded-lg border border-[#1A56DB]/40 bg-[#0F172A]/95 p-3 text-xs shadow-xl backdrop-blur pointer-events-auto">
          <p className="font-semibold text-[#1A56DB]">UCSD Recreation Center</p>
          <p className="mt-1 text-white/80">
            Tier: {String(demo.tier ?? "—")}
          </p>
          <p className="text-white/80">
            PGV: {demo.pgv != null ? `${Number(demo.pgv).toFixed(1)} cm/s` : "—"}
          </p>
          <button
            type="button"
            className="mt-2 text-[10px] text-white/50 underline"
            onClick={() => setShowRecCard(false)}
          >
            Close
          </button>
        </div>
      )}
      <div className="pointer-events-auto absolute right-3 top-3 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={analyzeUcsd}
          className="rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/80"
        >
          Analyze UCSD
        </button>
        <button
          type="button"
          onClick={resetView}
          className="rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/80"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}
