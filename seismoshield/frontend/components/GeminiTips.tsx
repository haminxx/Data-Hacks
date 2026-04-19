"use client";

import { useEffect, useState } from "react";

import { getGeminiSafetyTips } from "@/lib/gemini";

const STATIC_TIPS = [
  "Drop, cover, and hold on immediately.",
  "Move away from windows and exterior walls.",
  "Stay low until shaking completely stops.",
  "Walk calmly to the nearest marked exit.",
] as const;

/** Avoid repeat API calls when revisiting the same stop at the same intensity. */
const tipsCache = new Map<string, string[]>();

function cacheKey(
  waypointLabel: string,
  magnitude: number,
  riskTier: string,
): string {
  return `${waypointLabel}|${magnitude}|${riskTier}`;
}

export type GeminiTipsProps = {
  waypointLabel: string;
  waypointDescription: string;
  magnitude: number;
  riskTier: string;
};

export function GeminiTips({
  waypointLabel,
  waypointDescription,
  magnitude,
  riskTier,
}: GeminiTipsProps) {
  const [tips, setTips] = useState<string[]>(() => [...STATIC_TIPS]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = cacheKey(waypointLabel, magnitude, riskTier);
    const cached = tipsCache.get(key);
    if (cached) {
      setTips(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const next = await getGeminiSafetyTips(
        waypointLabel,
        waypointDescription,
        magnitude,
        riskTier,
      );
      if (cancelled) return;
      tipsCache.set(key, next);
      setTips(next);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [waypointLabel, waypointDescription, magnitude, riskTier]);

  return (
    <div className="mt-3 rounded-xl border border-violet-500/25 bg-violet-950/25 p-3 ring-1 ring-white/5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-200">
        AI safety tips · Gemini
      </p>

      {loading ? (
        <div
          className="mt-2 flex items-center gap-2 text-[11px] text-violet-100/70"
          aria-live="polite"
          aria-busy="true"
        >
          <span
            className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-200"
            aria-hidden
          />
          <span>Generating tips…</span>
        </div>
      ) : (
        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[13px] leading-snug text-white/90 marker:text-violet-300">
          {tips.map((tip, i) => (
            <li key={`${tip.slice(0, 24)}-${i}`}>{tip}</li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[10px] text-violet-200/60">
        ✨ Powered by Gemini
      </p>
    </div>
  );
}
