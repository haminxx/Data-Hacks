"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";

const Map25D = dynamic(() => import("@/components/Map25D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#0F172A] text-sm text-white/70">
      Initialising 2.5D map…
    </div>
  ),
});

export default function MapPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0F172A] text-white">
      <Map25D />

      <Link
        href="/"
        className="group absolute left-4 bottom-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/80"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Globe
      </Link>

      <Link
        href="/exterior"
        className="absolute right-4 bottom-6 z-20 inline-flex items-center gap-2 rounded-full bg-[#1A56DB] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1A56DB]/30 transition hover:bg-[#1647b3]"
      >
        Enter Rec Gym Analysis
      </Link>
    </main>
  );
}
