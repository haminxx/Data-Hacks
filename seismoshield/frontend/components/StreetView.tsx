"use client";

import { Loader } from "@googlemaps/js-api-loader";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type StreetViewTarget = {
  name: string;
  lng: number;
  lat: number;
  height?: number;
  category?: string;
};

interface StreetViewProps {
  target: StreetViewTarget | null;
  onClose: () => void;
}

const DEFAULT_HEADING = 210;
const DEFAULT_PITCH = 8;

let loaderSingleton: Loader | null = null;

function getLoader(apiKey: string): Loader {
  if (!loaderSingleton) {
    loaderSingleton = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["streetView"],
    });
  }
  return loaderSingleton;
}

export default function StreetView({ target, onClose }: StreetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      setError(
        "Add NEXT_PUBLIC_GOOGLE_MAPS_KEY to .env.local to enable Street View",
      );
      return;
    }
    if (!target || !containerRef.current) return;

    let cancelled = false;
    setReady(false);
    setError(null);

    const loader = getLoader(apiKey);

    (async () => {
      try {
        await loader.importLibrary("streetView");
        if (cancelled || !containerRef.current) return;

        const svService = new google.maps.StreetViewService();
        svService.getPanorama(
          {
            location: { lat: target.lat, lng: target.lng },
            radius: 120,
            source: google.maps.StreetViewSource.OUTDOOR,
          },
          (data, status) => {
            if (cancelled || !containerRef.current) return;
            if (status !== google.maps.StreetViewStatus.OK || !data?.location) {
              setError("No Street View coverage for this building");
              return;
            }

            const pano = new google.maps.StreetViewPanorama(
              containerRef.current,
              {
                pano: data.location.pano,
                pov: { heading: DEFAULT_HEADING, pitch: DEFAULT_PITCH },
                zoom: 1,
                addressControl: false,
                linksControl: true,
                panControl: true,
                zoomControl: true,
                enableCloseButton: false,
                motionTracking: false,
                motionTrackingControl: false,
                fullscreenControl: true,
                showRoadLabels: false,
              },
            );
            panoramaRef.current = pano;
            setReady(true);
          },
        );
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load Google Street View",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      panoramaRef.current = null;
    };
  }, [target]);

  if (!target) return null;

  return (
    <aside className="relative flex h-full w-full flex-col border-l border-white/10 bg-[#0B1324] text-white">
      <header className="flex items-start justify-between gap-3 border-b border-white/10 bg-[#0F172A]/80 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            Google Street View 360°
          </p>
          <h2 className="mt-0.5 truncate text-base font-semibold text-white">
            {target.name}
          </h2>
          <p className="mt-0.5 text-xs text-white/50">
            {target.lat.toFixed(4)}°, {target.lng.toFixed(4)}°
            {typeof target.height === "number" && (
              <> · {target.height} m · SanGIS footprint</>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full border border-white/15 bg-white/5 p-1.5 text-white/80 transition hover:bg-white/10"
          aria-label="Close Street View"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="relative flex-1">
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B1324]/90 text-sm text-white/60">
            Loading Street View…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B1324]/95 px-6 text-center text-sm text-red-200">
            {error}
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 bg-[#0F172A]/80 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/40 backdrop-blur">
        © Google · Imagery by Street View
      </footer>
    </aside>
  );
}
