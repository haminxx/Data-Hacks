"use client";

import SurvivalPieChart from "@/components/SurvivalPieChart";
import type { DirectionZone, SimulatorQuestion } from "@/lib/simulatorData";

type QuestionCardProps = {
  question: SimulatorQuestion;
  zone: DirectionZone;
  onAnswer: (index: number) => void;
  answered: boolean;
  selectedIndex: number | null;
  survivalRate: number;
  isAnimating: boolean;
  animationDirection: "up" | "down" | null;
  questionNumber: number;
  totalQuestions: number;
  showContinue: boolean;
  onContinue: () => void;
  answeredZones?: Set<number>;
  continueLabel?: string;
};

const LETTERS = ["A", "B", "C", "D", "E"];

function shortZoneLabel(label: string): string {
  return label.replace(/^Facing\s+/i, "");
}

export default function QuestionCard({
  question,
  zone,
  onAnswer,
  answered,
  selectedIndex,
  survivalRate,
  isAnimating,
  animationDirection,
  questionNumber,
  totalQuestions,
  showContinue,
  onContinue,
  answeredZones,
  continueLabel = "Look Around to Continue →",
}: QuestionCardProps) {
  const isCorrect = answered && selectedIndex === question.correctIndex;

  return (
    <aside
      className="fixed z-30 overflow-y-auto text-white md:right-4 md:top-20 md:bottom-4 md:w-[340px] md:max-h-[calc(100vh-96px)] md:p-6 right-2 left-2 bottom-2 w-auto max-h-[56vh] p-3.5 md:left-auto md:bottom-auto"
      style={{
        background: "rgba(10,15,30,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 18,
      }}
    >
      {/* Mobile shrinks the survival pie so it doesn't dominate the
          sheet. Desktop keeps the 140px proportion from the mock. */}
      <div className="flex justify-center [&>div>div]:h-[96px] [&>div>div]:w-[96px] md:[&>div>div]:h-[140px] md:[&>div>div]:w-[140px]">
        <SurvivalPieChart
          survivalRate={survivalRate}
          isAnimating={isAnimating}
          animationDirection={animationDirection}
        />
      </div>

      <div className="my-3 border-t border-white/10 md:my-4" />

      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span>🧭</span>
        <span className="uppercase tracking-wider text-slate-500">
          You are facing:
        </span>
        <span className="font-semibold text-blue-400">
          {shortZoneLabel(zone.label)}
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
          ❓ Question {questionNumber} of {totalQuestions}
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: totalQuestions }).map((_, i) => {
            const isReached = i + 1 <= questionNumber;
            return (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                style={{
                  background: isReached ? "#1A56DB" : "rgba(51,65,85,0.8)",
                }}
              />
            );
          })}
        </div>
      </div>

      <p
        className="mb-3 text-[13px] font-medium text-white md:mb-4 md:text-[15px]"
        style={{ lineHeight: 1.55 }}
      >
        {question.text}
      </p>

      <div className="flex flex-col gap-1.5 md:gap-2">
        {question.options.map((option, index) => {
          const correct = answered && index === question.correctIndex;
          const wrongPicked =
            answered && selectedIndex === index && !correct;
          const baseStyle: React.CSSProperties = {
            background: "rgba(30,41,59,0.8)",
            border: "1px solid rgba(148,163,184,0.15)",
            transition: "all 0.2s ease",
          };
          if (correct) {
            baseStyle.background = "rgba(22,163,74,0.2)";
            baseStyle.border = "1px solid rgba(22,163,74,0.6)";
            baseStyle.borderLeft = "3px solid #16A34A";
          } else if (wrongPicked) {
            baseStyle.background = "rgba(220,38,38,0.2)";
            baseStyle.border = "1px solid rgba(220,38,38,0.6)";
            baseStyle.borderLeft = "3px solid #DC2626";
          }
          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              onClick={() => onAnswer(index)}
              className={`group w-full rounded-[12px] px-3 py-2.5 text-left transition-all duration-200 md:px-4 md:py-[14px] ${
                answered
                  ? "cursor-not-allowed"
                  : "cursor-pointer hover:!bg-slate-700/80"
              }`}
              style={baseStyle}
            >
              <div
                className="flex items-start gap-2 text-[14px]"
                style={{ lineHeight: 1.4 }}
              >
                <span className="font-semibold text-slate-500">
                  {LETTERS[index]})
                </span>
                <span
                  className={`flex-1 ${
                    wrongPicked ? "text-slate-300" : "text-white"
                  }`}
                >
                  {option}
                </span>
                {correct && (
                  <span className="font-bold text-emerald-400">✓</span>
                )}
                {wrongPicked && (
                  <span className="font-bold text-red-400">✗</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-3 flex flex-col gap-2 animate-[fadeIn_0.4s_ease]">
          <div
            className="text-[13px] text-slate-300"
            style={{
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(51,65,85,0.5)",
              borderLeft: `3px solid ${isCorrect ? "#16A34A" : "#DC2626"}`,
              borderRadius: 10,
              padding: 12,
            }}
          >
            {isCorrect
              ? question.correctExplanation
              : question.wrongExplanation}
          </div>

          <div
            style={{
              background: "rgba(234,88,12,0.1)",
              border: "1px solid rgba(154,52,18,0.4)",
              borderRadius: 10,
              padding: 12,
            }}
          >
            <div className="text-[12px] font-semibold text-orange-400">
              ⚠️ Real Hazard:
            </div>
            <div className="mt-1 text-[12px] italic text-orange-300">
              {question.realHazardNote}
            </div>
          </div>

          {showContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="sim-continue-btn w-full text-sm font-semibold text-white transition-colors"
              style={{
                background: "#1A56DB",
                borderRadius: 10,
                padding: 12,
              }}
            >
              {continueLabel}
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
