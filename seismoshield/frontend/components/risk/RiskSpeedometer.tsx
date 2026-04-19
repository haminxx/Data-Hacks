"use client";

import { useEffect, useId, useState } from "react";

/** Eased count-up; use beside the gauge so the score stays in sync with the needle. */
export function useAnimatedRiskScore(score: number, durationMs = 1500) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Math.min(100, Math.max(0, score));
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, durationMs]);

  return display;
}

type Props = {
  score: number;
  label?: string;
  size?: number;
  className?: string;
  /** When false, only the arc is shown (for compact strip layouts). */
  showFooter?: boolean;
  /** Smaller score typography when embedded in dense layouts. */
  footerSize?: "default" | "compact";
};

export function RiskSpeedometer({
  score,
  label = "SEVERE RISK",
  size = 180,
  className = "",
  showFooter = true,
  footerSize = "default",
}: Props) {
  const display = useAnimatedRiskScore(score);
  const uid = useId().replace(/:/g, "");

  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const needleAngle = Math.PI - (display / 100) * Math.PI;

  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  /** Arc + ticks (zone labels are rendered in HTML below). */
  const svgH = size * 0.62;

  const labelClass =
    display >= 75
      ? "text-[#fca5a5]"
      : display >= 50
        ? "text-[#fdba74]"
        : display >= 35
          ? "text-[#fde047]"
          : "text-[#86efac]";

  const gradId = `arc-risk-${uid}`;
  const glowId = `gauge-glow-${uid}`;

  return (
    <div
      className={`flex w-full flex-col items-center ${showFooter ? "max-w-[min(100%,280px)]" : "max-w-none shrink-0"} ${className}`}
    >
      <svg
        width={size}
        height={svgH}
        viewBox={`0 0 ${size} ${svgH}`}
        className="mx-auto shrink-0 overflow-visible drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="33%" stopColor="#ca8a04" />
            <stop offset="66%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={arcPath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={10}
          strokeLinecap="round"
          filter={`url(#${glowId})`}
        />
        {[25, 50, 75, 100].map((tick, i) => {
          const ang = Math.PI - (tick / 100) * Math.PI;
          const x1 = cx + (r - 4) * Math.cos(ang);
          const y1 = cy - (r - 4) * Math.sin(ang);
          const x2 = cx + r * Math.cos(ang);
          const y2 = cy - r * Math.sin(ang);
          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={2}
            />
          );
        })}
        <line
          x1={cx}
          y1={cy}
          x2={cx + (r - 18) * Math.cos(needleAngle)}
          y2={cy - (r - 18) * Math.sin(needleAngle)}
          stroke="#f8fafc"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={6} fill="#0f172a" stroke="#fff" strokeWidth={2} />
      </svg>
      {/* Zone labels in one aligned row (avoids inconsistent in-arc SVG placement). */}
      <div
        className="mt-1 flex w-full justify-between gap-1 px-0.5 text-[9px] font-medium tabular-nums tracking-tight text-white/35"
        style={{ width: size, maxWidth: "100%" }}
      >
        <span className="text-left">Low</span>
        <span className="text-center">Mod</span>
        <span className="text-center">High</span>
        <span className="text-right">Severe</span>
      </div>
      {showFooter && (
        <div className="mt-3 flex w-full flex-col items-center text-center">
          <p
            className={
              footerSize === "compact"
                ? "text-2xl font-bold tabular-nums leading-none tracking-tight text-white sm:text-3xl"
                : "text-4xl font-bold tabular-nums leading-none tracking-tight text-white"
            }
          >
            {display}
            <span
              className={
                footerSize === "compact"
                  ? "text-base font-medium text-slate-500"
                  : "text-lg font-medium text-slate-500"
              }
            >
              {" "}
              / 100
            </span>
          </p>
          {label ? (
            <p
              className={`mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-500 ${labelClass}`}
            >
              {label}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
