"use client";

import type { ScenarioCondition } from "@/lib/simulatorData";

type GameOverProps = {
  magnitude: number;
  condition: ScenarioCondition;
  lastWrongAnswer: string;
  lastWrongExplanation: string;
  lastWrongRealHazard: string;
  onTryAgain: () => void;
};

export default function GameOver({
  magnitude,
  condition,
  lastWrongAnswer,
  lastWrongExplanation,
  lastWrongRealHazard,
  onTryAgain,
}: GameOverProps) {
  return (
    <div className="fixed inset-0 z-[100] animate-[fadeIn_2s_ease] bg-black/95 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center text-white">
        <div className="mb-4 text-7xl">💀</div>
        <h2 className="text-4xl font-black">YOU DID NOT SURVIVE</h2>
        <p className="mt-2 text-slate-300">HSS Room 1345 claimed your life.</p>

        <div className="mt-6 w-full space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
          <p className="text-slate-400">Magnitude: {magnitude.toFixed(1)}</p>
          <p className="text-slate-400">Condition: {condition}</p>
          <p className="font-semibold text-red-300">Final Survival Rate: 0%</p>
          <hr className="border-white/10" />
          <p className="text-xs text-slate-400">What got you:</p>
          <p className="italic text-red-200">{lastWrongAnswer}</p>
          <hr className="border-white/10" />
          <p className="text-xs text-slate-400">What you should have done:</p>
          <p className="text-sm text-emerald-200">{lastWrongExplanation}</p>
          <hr className="border-white/10" />
          <p className="text-xs text-orange-300">Real hazard in this room:</p>
          <p className="text-sm italic text-orange-200">{lastWrongRealHazard}</p>
          <hr className="border-white/10" />
          <p className="italic text-slate-400">Your awareness saved 0 lives today.</p>
        </div>

        <div className="mt-6 flex w-full justify-center">
          <button
            type="button"
            onClick={onTryAgain}
            className="w-full max-w-xs rounded-xl bg-[#1A56DB] px-4 py-3 font-semibold text-white hover:bg-[#1647b3] sm:w-auto sm:px-10"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

