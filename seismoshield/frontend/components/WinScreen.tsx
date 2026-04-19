"use client";

import type { ScenarioCondition } from "@/lib/simulatorData";
import { useMemo } from "react";

type WinScreenProps = {
  survivalRate: number;
  magnitude: number;
  condition: ScenarioCondition;
  correctCount: number;
  onPlayAgain: () => void;
  onSeeRiskScore: () => void;
};

const CONDITION_LABEL: Record<ScenarioCondition, string> = {
  earthquake: "Earthquake Only",
  earthquake_fire: "Earthquake + Fire",
  earthquake_dark: "Earthquake + Blackout",
  earthquake_fire_dark: "Earthquake + Fire + Blackout",
};

type WinTier = {
  title: string;
  subtitle: string;
  titleColor: string;
  bgGradient: string;
  showConfetti: boolean;
  confettiColors: string[];
  message: string;
  subMessage: string;
};

function getWinTier(rate: number): WinTier {
  if (rate >= 100)
    return {
      title: "✨ YOU ESCAPED! ✨",
      subtitle: "🏆 PERFECT SURVIVAL",
      titleColor: "#F59E0B",
      bgGradient: "from-yellow-950 via-slate-950 to-slate-950",
      showConfetti: true,
      confettiColors: ["#F59E0B", "#1A56DB"],
      message: "You knew exactly what to do.",
      subMessage: "HSS 1345 could not stop you.",
    };
  if (rate >= 70)
    return {
      title: "✨ YOU ESCAPED! ✨",
      subtitle: "😤 CLOSE CALL — BUT YOU MADE IT",
      titleColor: "#60A5FA",
      bgGradient: "from-blue-950 via-slate-950 to-slate-950",
      showConfetti: true,
      confettiColors: ["#1A56DB", "#3B82F6"],
      message: "You made the right calls when it mattered.",
      subMessage: "A few better choices and you walk out unscathed.",
    };
  if (rate >= 40)
    return {
      title: "⚠️ YOU BARELY ESCAPED",
      subtitle: "🩹 SURVIVED — WITH INJURIES",
      titleColor: "#EA580C",
      bgGradient: "from-orange-950 via-slate-950 to-slate-950",
      showConfetti: false,
      confettiColors: [],
      message: "You got out — but wrong decisions cost you.",
      subMessage:
        "Review the hazards you missed before the next earthquake.",
    };
  return {
    title: "😰 YOU ESCAPED — BARELY ALIVE",
    subtitle: "🚑 CRITICAL CONDITION",
    titleColor: "#DC2626",
    bgGradient: "from-red-950 via-slate-950 to-slate-950",
    showConfetti: false,
    confettiColors: [],
    message: "You survived by luck, not knowledge.",
    subMessage:
      "One more wrong answer and you would not have made it.",
  };
}

function rateColor(rate: number): string {
  if (rate >= 70) return "#16A34A";
  if (rate >= 40) return "#CA8A04";
  if (rate >= 20) return "#EA580C";
  return "#DC2626";
}

type ConfettiPiece = {
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotation: number;
};

function buildConfetti(colors: string[]): ConfettiPiece[] {
  if (colors.length === 0) return [];
  return Array.from({ length: 50 }).map((_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 3 + Math.random() * 2,
    size: 6 + Math.random() * 8,
    color: colors[i % colors.length],
    rotation: Math.random() * 360,
  }));
}

export default function WinScreen({
  survivalRate,
  magnitude,
  condition,
  correctCount,
  onPlayAgain,
  onSeeRiskScore,
}: WinScreenProps) {
  const tier = useMemo(() => getWinTier(survivalRate), [survivalRate]);
  const confetti = useMemo(
    () => buildConfetti(tier.confettiColors),
    [tier.confettiColors],
  );
  const rateClr = rateColor(survivalRate);
  const correctTextColor = correctCount === 4 ? "text-emerald-400" : "text-yellow-400";
  const allCorrect = correctCount === 4;
  const conditionLabel = CONDITION_LABEL[condition] ?? condition;

  return (
    <div
      className={`fixed inset-0 z-[110] overflow-hidden bg-gradient-to-b ${tier.bgGradient} px-4 py-10 text-white`}
    >
      {tier.showConfetti && confetti.length > 0 && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confetti.map((piece, i) => (
            <span
              key={i}
              className="absolute"
              style={{
                left: `${piece.left}%`,
                top: "-20px",
                width: piece.size,
                height: piece.size * 0.4,
                background: piece.color,
                transform: `rotate(${piece.rotation}deg)`,
                animation: `confettiFall ${piece.duration}s linear ${piece.delay}s infinite`,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
        <h2
          className="animate-[simGlowPulse_2s_ease-in-out_infinite] text-5xl font-black"
          style={{
            color: tier.titleColor,
            textShadow: `0 0 30px ${tier.titleColor}cc`,
          }}
        >
          {tier.title}
        </h2>
        <p
          className="mt-5 text-xl font-semibold"
          style={{ color: tier.titleColor }}
        >
          {tier.subtitle}
        </p>

        <div className="my-6 h-px w-2/3 bg-slate-700/50" />

        <p className="text-sm text-slate-400">Final Survival Rate:</p>
        <p
          className="text-6xl font-black leading-none"
          style={{ color: rateClr, textShadow: `0 0 24px ${rateClr}66` }}
        >
          {Math.max(0, survivalRate)}%
        </p>
        <p className="mt-4 text-sm text-slate-300">
          Magnitude Survived: {magnitude.toFixed(1)}
        </p>
        <p className="text-sm text-slate-300">Condition: {conditionLabel}</p>
        <p className={`mt-1 text-sm font-semibold ${correctTextColor}`}>
          Questions Correct: {correctCount} of 4
        </p>

        <div className="my-6 h-px w-2/3 bg-slate-700/50" />

        <p className="text-base italic text-white">{tier.message}</p>
        <p className="mt-1 text-sm italic text-slate-300">
          {tier.subMessage}
        </p>

        <div className="my-6 h-px w-2/3 bg-slate-700/50" />

        <p className="text-sm text-slate-400">
          Real talk: This room has a water-damaged ceiling tile,
        </p>
        <p className="text-sm text-slate-400">
          a projector on a single bracket, and chairs on wheels.
        </p>
        {allCorrect && (
          <p className="mt-2 text-sm font-semibold text-emerald-400">
            You identified every hazard correctly. 🎯
          </p>
        )}
        <p className="mt-1 text-sm text-slate-300">
          Your awareness could save lives in a real earthquake. 🌍
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 rounded-xl bg-[#1A56DB] px-4 py-3 font-semibold transition-colors hover:bg-[#1647b3]"
          >
            🔄 Play Again — Try M{Math.min(8, magnitude + 0.5).toFixed(1)}
          </button>
          <button
            type="button"
            onClick={onSeeRiskScore}
            className="flex-1 rounded-xl border border-white/20 bg-slate-900/80 px-4 py-3 font-semibold transition-colors hover:bg-slate-800"
          >
            📊 See Your Risk Score
          </button>
        </div>
      </div>
    </div>
  );
}
