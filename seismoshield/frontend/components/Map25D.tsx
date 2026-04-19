"use client";

import { FlyToInterpolator } from "@deck.gl/core";
import { Tile3DLayer } from "@deck.gl/geo-layers";
import DeckGL from "@deck.gl/react";
import type { PickingInfo } from "@deck.gl/core";
import { Tiles3DLoader } from "@loaders.gl/3d-tiles";
import { useCallback, useMemo, useRef, useState } from "react";
import type { StreetViewTarget } from "./StreetView";

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
  longitude: -117.13,
  latitude: 32.82,
  zoom: 11.2,
  pitch: 55,
  bearing: 0,
  minZoom: 7,
  maxZoom: 20,
};

const DOWNTOWN_VIEW: ViewState = {
  longitude: -117.161,
  latitude: 32.714,
  zoom: 16.5,
  pitch: 62,
  bearing: 25,
  minZoom: 7,
  maxZoom: 20,
};

const UCSD_VIEW: ViewState = {
  longitude: -117.2364,
  latitude: 32.8801,
  zoom: 16.8,
  pitch: 60,
  bearing: 30,
  minZoom: 7,
  maxZoom: 20,
};

const BALBOA_VIEW: ViewState = {
  longitude: -117.1446,
  latitude: 32.7341,
  zoom: 16.2,
  pitch: 60,
  bearing: -15,
  minZoom: 7,
  maxZoom: 20,
};

interface CreditAttribution {
  html: string;
}

interface TilesetCredits {
  attributions?: CreditAttribution[];
}

interface TilesetLike {
  credits?: TilesetCredits;
}

interface Map25DProps {
  onBuildingSelect?: (target: StreetViewTarget | null) => void;
  selectedName?: string | null;
}

export default function Map25D({ onBuildingSelect }: Map25DProps) {
  const [viewState, setViewState] = useState<ViewState>(WIDE_SD_VIEW);
  const [attribution, setAttribution] = useState<string>(
    "© Google · Photorealistic 3D Tiles",
  );
  const [status, setStatus] = useState<
    "loading" | "ready" | "missing-key" | "error"
  >("loading");
  const onSelectRef = useRef(onBuildingSelect);
  onSelectRef.current = onBuildingSelect;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  const goTo = useCallback((target: ViewState) => {
    setViewState({
      ...target,
      transitionDuration: 2400,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.6 }),
    });
  }, []);

  const layers = useMemo(() => {
    if (!apiKey) return [];
    return [
      new Tile3DLayer({
        id: "google-photoreal-3d-tiles",
        data: `https://tile.googleapis.com/v1/3dtiles/root.json?key=${apiKey}`,
        loader: Tiles3DLoader,
        loadOptions: {
          fetch: { mode: "cors" as const },
        },
        pickable: true,
        onTilesetLoad: (tileset: TilesetLike) => {
          setStatus("ready");
          const credits = tileset?.credits?.attributions
            ?.map((a) => a.html)
            .join(" · ");
          if (credits && credits.length > 0) {
            setAttribution(credits);
          }
        },
        onTileError: (_tile: unknown, _url: string, message: string) => {
          console.error("[Tile3DLayer] tile error:", message);
          setStatus("error");
        },
      }),
    ];
  }, [apiKey]);

  const onClickMap = useCallback((info: PickingInfo) => {
    if (!info || !info.coordinate) return;
    const [lng, lat] = info.coordinate as [number, number, number?];
    onSelectRef.current?.({
      name: "Selected location",
      lng,
      lat,
    });
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0B1324]">
      <DeckGL
        initialViewState={WIDE_SD_VIEW}
        viewState={viewState}
        controller={{ dragRotate: true, inertia: 500 }}
        onViewStateChange={(evt) => setViewState(evt.viewState as ViewState)}
        layers={layers}
        onClick={onClickMap}
        getCursor={({ isDragging, isHovering }) =>
          isDragging ? "grabbing" : isHovering ? "pointer" : "grab"
        }
      />

      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-xs rounded-xl border border-white/10 bg-black/60 p-4 text-white backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-white/50">
          SeismoShield · Photorealistic 3D
        </p>
        <p className="mt-1 text-lg font-semibold text-white">
          San Diego Urban Model
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/70">
          Real 3D buildings streamed from Google Maps Platform Photorealistic 3D
          Tiles. Click any building to open Street View 360°. Hold{" "}
          <kbd className="rounded bg-white/10 px-1">Ctrl</kbd> + drag to tilt.
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
          <button
            type="button"
            onClick={() => goTo(BALBOA_VIEW)}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold hover:bg-white/10"
          >
            Balboa Park
          </button>
        </div>
      </div>

      {!apiKey && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-white/10 bg-black/70 p-6 text-center backdrop-blur">
            <p className="text-base font-semibold text-white">
              Google Maps API key missing
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/65">
              Add{" "}
              <code className="rounded bg-white/10 px-1">
                NEXT_PUBLIC_GOOGLE_MAPS_KEY
              </code>{" "}
              to{" "}
              <code className="rounded bg-white/10 px-1">.env.local</code> and
              enable the <strong>Map Tiles API</strong> in Google Cloud.
            </p>
          </div>
        </div>
      )}

      {apiKey && status === "loading" && (
        <div className="pointer-events-none absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white/75 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1A56DB]/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1A56DB]" />
          </span>
          Streaming Google 3D Tiles…
        </div>
      )}

      {apiKey && status === "error" && (
        <div className="pointer-events-none absolute right-4 top-4 z-10 max-w-xs rounded-lg border border-amber-500/40 bg-amber-900/40 px-3 py-2 text-[11px] text-amber-100 backdrop-blur">
          Some tiles failed. Verify the <strong>Map Tiles API</strong> and
          billing are enabled for this key.
        </div>
      )}

      <div
        className="pointer-events-none absolute bottom-3 left-1/2 z-10 max-w-[80%] -translate-x-1/2 truncate rounded bg-black/55 px-3 py-1 text-[10px] text-white/75 backdrop-blur"
        dangerouslySetInnerHTML={{ __html: attribution }}
      />
    </div>
  );
}
