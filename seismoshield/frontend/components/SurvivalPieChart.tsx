"use client";

type SurvivalPieChartProps = {
  survivalRate: number;
  isAnimating: boolean;
  animationDirection: "up" | "down" | null;
  size?: number;
};

const RADIUS = 52.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function arcColor(rate: number): string {
  if (rate >= 70) return "#16A34A";
  if (rate >= 40) return "#CA8A04";
  if (rate >= 20) return "#EA580C";
  return "#DC2626";
}

function statusText(rate: number): { text: string; cls: string } {
  if (rate >= 70)
    return { text: "✓ Safe Zone", cls: "text-emerald-400" };
  if (rate >= 40)
    return { text: "⚠ Moderate Risk", cls: "text-yellow-400" };
  if (rate >= 20)
    return { text: "⚠ High Risk", cls: "text-orange-400" };
  return { text: "🚨 Critical", cls: "text-red-400 animate-pulse" };
}

export default function SurvivalPieChart({
  survivalRate,
  isAnimating,
  animationDirection,
  size = 140,
}: SurvivalPieChartProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(survivalRate)));
  const dashOffset = CIRCUMFERENCE * (1 - clamped / 100);
  const color = arcColor(clamped);
  const status = statusText(clamped);
  const percentFontSize = Math.round(size * 0.2);
  const labelFontSize = Math.max(9, Math.round(size * 0.075));
  const statusFontSize = Math.max(12, Math.round(size * 0.1));

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <svg viewBox="0 0 140 140" className="h-full w-full">
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke="#1E293B"
            strokeWidth="10"
          />
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 70 70)"
            style={{
              transition:
                "stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease",
            }}
            className={clamped < 20 ? "sim-survival-pulse" : ""}
          />
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-black leading-none text-white"
            style={{ fontSize: `${percentFontSize}px` }}
          >
            {clamped}%
          </span>
          <span
            className="mt-1 tracking-[0.2em] text-slate-400"
            style={{ fontSize: `${labelFontSize}px` }}
          >
            SURVIVAL
          </span>
        </div>

        {isAnimating && animationDirection === "up" && (
          <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 animate-[simFloatUp_1s_ease-out] text-base font-bold text-emerald-400">
            +15%
          </div>
        )}
        {isAnimating && animationDirection === "down" && (
          <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 animate-[simFloatDown_1s_ease-out] text-base font-bold text-red-400">
            -25%
          </div>
        )}
      </div>

      <div
        className={`mt-3 font-semibold ${status.cls}`}
        style={{ fontSize: `${statusFontSize}px` }}
      >
        {status.text}
      </div>
    </div>
  );
}
