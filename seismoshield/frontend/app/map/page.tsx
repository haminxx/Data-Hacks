"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

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

type BuildingSearchItem = SearchableItem & BuildingIndexEntry;

export default function MapPage() {
  const [selected, setSelected] = useState<StreetViewTarget | null>(null);
  const [buildings, setBuildings] = useState<BuildingIndexEntry[]>([]);

  const handleSelect = useCallback((target: StreetViewTarget | null) => {
    setSelected(target);
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  const handleBuildingsLoaded = useCallback((list: BuildingIndexEntry[]) => {
    setBuildings(list);
  }, []);

  // Map raw building index into the SearchableItem shape the bar expects,
  // stamping the category as the trailing meta label so each result row
  // has a quick classifier (education, residential, athletic, …).
  const searchItems = useMemo<BuildingSearchItem[]>(
    () =>
      buildings.map((b) => ({
        ...b,
        id: b.id,
        label: b.name,
        meta: b.category,
      })),
    [buildings],
  );

  const handleSearchPick = useCallback((item: BuildingSearchItem) => {
    setSelected({
      name: item.name,
      height: item.height,
      category: item.category,
      lng: item.lng,
      lat: item.lat,
    });
  }, []);

  const hasPanel = selected !== null;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0F172A] text-white">
      <div className="flex h-full w-full">
        <section
          className={`relative h-full transition-[width] duration-500 ease-out ${
            hasPanel ? "w-[60%]" : "w-full"
          }`}
        >
          <Map25D
            onBuildingSelect={handleSelect}
            selectedName={selected?.name ?? null}
            onBuildingsLoaded={handleBuildingsLoaded}
          />

          {/* Top-centered search bar. pointer-events-none on the positioning
              shell lets map drags / hovers pass through except where the bar
              actually lives. */}
          <div className="pointer-events-none absolute inset-x-0 top-5 z-20 flex justify-center">
            <div className="pointer-events-auto">
              <GooeySearchBar<BuildingSearchItem>
                items={searchItems}
                onSelect={handleSearchPick}
                collapsedLabel="Search UCSD"
                placeholder="e.g. Geisel, Price Center, RIMAC…"
                maxResults={6}
              />
            </div>
          </div>

          <Link
            href="/"
            className="group absolute left-4 bottom-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/80"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Globe
          </Link>

          {!hasPanel && (
            <Link
              href="/exterior"
              className="absolute right-4 bottom-6 z-20 inline-flex items-center gap-2 rounded-full bg-[#1A56DB] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1A56DB]/30 transition hover:bg-[#1647b3]"
            >
              Enter Rec Gym Analysis
            </Link>
          )}
        </section>

        <aside
          className={`h-full overflow-hidden transition-[width] duration-500 ease-out ${
            hasPanel ? "w-[40%]" : "w-0"
          }`}
          aria-hidden={!hasPanel}
        >
          {hasPanel && <StreetView target={selected} onClose={handleClose} />}
        </aside>
      </div>
    </main>
  );
}
