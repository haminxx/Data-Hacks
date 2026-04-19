"use client";

import GameOver from "@/components/GameOver";
import QuestionCard from "@/components/QuestionCard";
import ScenarioCard from "@/components/ScenarioCard";
import WinScreen from "@/components/WinScreen";
import {
  BUILDING_HAZARDS,
  CONDITION_MODIFIERS,
  DIRECTION_ZONES,
  MAGNITUDE_START_RATES,
  QUESTIONS,
  type DirectionZone,
  type HighlightType,
  type ScenarioCondition,
} from "@/lib/simulatorData";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactPannellum from "react-pannellum";
import "pannellum/build/pannellum.css";

type GameState = "idle" | "playing" | "gameOver" | "win";

const ZONE_CENTER_YAW: Record<number, number> = {
  1: 0,
  2: 270,
  3: 180,
  4: 90,
};

const CLOCKWISE_ZONE_ORDER: number[] = [1, 4, 3, 2];

const QUESTION_FOCUS: Record<number, { x: number; y: number }> = {
  1: { x: 50, y: 52 },
  2: { x: 50, y: 55 },
  3: { x: 38, y: 60 },
  4: { x: 36, y: 42 },
};

const HIGHLIGHT_STYLE: Record<
  HighlightType,
  { border: string; text: string; label: string }
> = {
  danger: {
    border: "rgba(239,68,68,0.6)",
    text: "text-red-400",
    label: "Interior Corridor",
  },
  warning: {
    border: "rgba(249,115,22,0.6)",
    text: "text-orange-400",
    label: "Emergency Exit",
  },
  temptation: {
    border: "rgba(234,179,8,0.6)",
    text: "text-yellow-400",
    label: "Unlimited Claude Credits",
  },
  mixed: {
    border: "rgba(239,68,68,0.6)",
    text: "text-red-400",
    label: "Project Screen",
  },
};

function nextClockwiseUnanswered(
  currentZoneId: number,
  answered: Set<number>,
): number | null {
  const startIdx = CLOCKWISE_ZONE_ORDER.indexOf(currentZoneId);
  if (startIdx === -1) {
    return CLOCKWISE_ZONE_ORDER.find((id) => !answered.has(id)) ?? null;
  }
  for (let i = 1; i <= CLOCKWISE_ZONE_ORDER.length; i++) {
    const candidate =
      CLOCKWISE_ZONE_ORDER[(startIdx + i) % CLOCKWISE_ZONE_ORDER.length];
    if (!answered.has(candidate)) return candidate;
  }
  return null;
}

function normalizeYaw(yaw: number): number {
  return ((yaw % 360) + 360) % 360;
}

function getCurrentZone(yaw: number): DirectionZone | null {
  const y = normalizeYaw(yaw);
  return (
    DIRECTION_ZONES.find((z) => {
      if (z.id === 1) return y >= z.yawMin || y <= z.yawMax;
      return y >= z.yawMin && y <= z.yawMax;
    }) ?? null
  );
}

function getStartRate(magnitude: number, condition: ScenarioCondition): number {
  const base = MAGNITUDE_START_RATES[magnitude] ?? 65;
  return Math.max(5, Math.min(100, base + CONDITION_MODIFIERS[condition]));
}

function ZoneHighlight({ zone }: { zone: DirectionZone }) {
  const common =
    "pointer-events-none fixed left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border px-4 py-3 text-sm font-semibold backdrop-blur";
  if (zone.id === 1) {
    return (
      <div className={`${common} animate-pulse border-red-400/70 bg-red-500/15 text-red-100`}>
        Interior Corridor
      </div>
    );
  }
  if (zone.id === 2) {
    return (
      <div className={`${common} animate-pulse border-orange-300/70 bg-orange-500/15 text-orange-100`}>
        Emergency Exit
      </div>
    );
  }
  if (zone.id === 3) {
    return (
      <>
        <div className="pointer-events-none fixed inset-x-0 top-0 z-10 h-28 animate-pulse bg-red-600/20 text-center text-xs font-semibold tracking-[0.12em] text-red-200">
          <div className="pt-4">WATER DAMAGE — PRE-WEAKENED</div>
        </div>
        <div className={`${common} animate-pulse border-yellow-300/80 bg-yellow-500/20 text-yellow-100`}>
          Unlimited Claude Credits & Tokens
        </div>
      </>
    );
  }
  return (
    <div className={`${common} animate-[simSwing_1.6s_ease-in-out_infinite] border-red-300/70 bg-red-500/15 text-red-100`}>
      Project Screen
    </div>
  );
}

function DirectionArrowHint({ text }: { text: string }) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full border border-blue-300/40 bg-[#1A56DB]/20 px-4 py-2 text-sm font-medium text-blue-100 backdrop-blur">
      <span className="mr-2 inline-block animate-bounce">➜</span>
      {text}
    </div>
  );
}

export default function SimulatorGame() {
  const Pannellum = ReactPannellum as any;
  const [magnitude, setMagnitude] = useState<number>(6.5);
  const [condition, setCondition] = useState<ScenarioCondition>("earthquake");
  const [currentYaw, setCurrentYaw] = useState<number>(0);
  const [answeredZones, setAnsweredZones] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number>>(
    new Map(),
  );
  const [survivalRate, setSurvivalRate] = useState<number>(
    getStartRate(6.5, "earthquake"),
  );
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [shakeClass, setShakeClass] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationDirection, setAnimationDirection] = useState<"up" | "down" | null>(
    null,
  );
  const [gameState, setGameState] = useState<GameState>("idle");
  const [lastWrongAnswer, setLastWrongAnswer] = useState<string>("");
  const [lastWrongExplanation, setLastWrongExplanation] = useState<string>("");
  const [lastWrongRealHazard, setLastWrongRealHazard] = useState<string>("");
  const [activeQuestionZoneId, setActiveQuestionZoneId] = useState<number | null>(null);
  const [showContinue, setShowContinue] = useState<boolean>(false);
  const [nextZoneHint, setNextZoneHint] = useState<string | null>(null);
  const [pendingEndState, setPendingEndState] = useState<
    "gameOver" | "win" | null
  >(null);

  const currentZone = useMemo(
    () => getCurrentZone(currentYaw),
    [currentYaw],
  );
  const activeQuestion = useMemo(
    () =>
      QUESTIONS.find((q) => q.zoneId === (activeQuestionZoneId ?? -1)) ?? null,
    [activeQuestionZoneId],
  );
  const activeZone = useMemo(
    () =>
      DIRECTION_ZONES.find((z) => z.id === (activeQuestionZoneId ?? -1)) ?? null,
    [activeQuestionZoneId],
  );
  const correctCount = useMemo(() => {
    let count = 0;
    selectedAnswers.forEach((answerIdx, zoneId) => {
      const q = QUESTIONS.find((qu) => qu.zoneId === zoneId);
      if (q && q.correctIndex === answerIdx) count += 1;
    });
    return count;
  }, [selectedAnswers]);
  const answeredCurrent = activeZone
    ? answeredZones.has(activeZone.id)
    : false;
  const selectedIndex =
    activeZone && selectedAnswers.has(activeZone.id)
      ? selectedAnswers.get(activeZone.id) ?? null
      : null;

  const getShakeConfig = (mag: number) => {
    if (mag < 5.0)
      return { cls: "shake-low", dur: 600, overlay: "rgba(255,255,255,0.03)" };
    if (mag < 6.0)
      return { cls: "shake-medium", dur: 800, overlay: "rgba(255,200,100,0.06)" };
    if (mag < 6.5)
      return { cls: "shake-strong", dur: 900, overlay: "rgba(255,150,50,0.10)" };
    if (mag < 7.5)
      return { cls: "shake-severe", dur: 1000, overlay: "rgba(220,50,50,0.15)" };
    return { cls: "shake-extreme", dur: 1200, overlay: "rgba(180,0,0,0.22)" };
  };

  const triggerShake = useCallback(() => {
    if (isShaking) return;
    const config = getShakeConfig(magnitude);
    setShakeClass(config.cls);
    setIsShaking(true);
    window.setTimeout(() => {
      setIsShaking(false);
      setShakeClass("");
    }, config.dur);
  }, [isShaking, magnitude]);

  useEffect(() => {
    if (gameState === "playing") {
      triggerShake();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  useEffect(() => {
    if (gameState === "playing") {
      triggerShake();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magnitude]);

  const tryOpenQuestionForCurrentZone = (yaw: number) => {
    if (gameState !== "playing") return;
    if (showContinue || activeQuestionZoneId != null) return;
    const zone = getCurrentZone(yaw);
    if (!zone || answeredZones.has(zone.id)) return;
    setActiveQuestionZoneId(zone.id);
  };

  const handleYaw = useCallback(() => {
    const viewer = (ReactPannellum as unknown as { getViewer?: () => any }).getViewer?.();
    const yaw = typeof viewer?.getYaw === "function" ? viewer.getYaw() : 0;
    setCurrentYaw(yaw);
    if (nextZoneHint) {
      const zone = getCurrentZone(yaw);
      if (zone && !answeredZones.has(zone.id)) {
        setNextZoneHint(null);
      }
    }
    tryOpenQuestionForCurrentZone(yaw);
  }, [nextZoneHint, answeredZones, gameState, showContinue, activeQuestionZoneId]);

  const handleMouseDown = useCallback(() => {
    const viewer = (ReactPannellum as unknown as { getViewer?: () => any }).getViewer?.();
    if (typeof viewer?.setAutoRotate === "function") {
      viewer.setAutoRotate(0);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(handleYaw, 200);
    return () => window.clearInterval(id);
  }, [handleYaw]);

  useEffect(() => {
    if (activeQuestionZoneId == null) return;
    const targetYaw = ZONE_CENTER_YAW[activeQuestionZoneId] ?? 0;
    let rafId = 0;
    let initialApplied = false;
    let startTime = 0;

    const tick = () => {
      const viewer = (ReactPannellum as unknown as { getViewer?: () => any }).getViewer?.();
      if (viewer) {
        if (typeof viewer.setAutoRotate === "function") viewer.setAutoRotate(0);

        if (!initialApplied) {
          initialApplied = true;
          startTime = performance.now();
          try {
            if (typeof viewer.setYaw === "function") viewer.setYaw(targetYaw, 500);
            if (typeof viewer.setPitch === "function") viewer.setPitch(0, 500);
          } catch {
            if (typeof viewer.setYaw === "function") viewer.setYaw(targetYaw);
            if (typeof viewer.setPitch === "function") viewer.setPitch(0);
          }
        } else {
          const elapsed = performance.now() - startTime;
          if (elapsed > 650) {
            const t = (elapsed - 650) / 1000;
            const yawSway = Math.sin(t * 0.9) * 1.6;
            const pitchSway = Math.sin(t * 0.6) * 0.8;
            if (typeof viewer.setYaw === "function") viewer.setYaw(targetYaw + yawSway);
            if (typeof viewer.setPitch === "function") viewer.setPitch(pitchSway);
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [activeQuestionZoneId]);

  const handleAnswer = (index: number) => {
    if (!activeQuestion || !activeZone || answeredZones.has(activeZone.id)) return;

    setSelectedAnswers((prev) => new Map(prev).set(activeZone.id, index));
    const nextAnswered = new Set(answeredZones);
    nextAnswered.add(activeZone.id);
    setAnsweredZones(nextAnswered);

    const correct = index === activeQuestion.correctIndex;
    const nextRate = correct
      ? Math.min(100, survivalRate + 15)
      : Math.max(0, survivalRate - 25);

    setSurvivalRate(nextRate);
    setAnimationDirection(correct ? "up" : "down");
    setIsAnimating(true);

    window.setTimeout(() => setIsAnimating(false), 800);
    window.setTimeout(() => setShowContinue(true), 2500);

    if (!correct) {
      setLastWrongAnswer(activeQuestion.options[index] ?? "");
      setLastWrongExplanation(activeQuestion.wrongExplanation);
      setLastWrongRealHazard(activeQuestion.realHazardNote);
      window.setTimeout(() => triggerShake(), 200);
    }

    if (nextRate <= 0) {
      setPendingEndState("gameOver");
    } else if (nextAnswered.size === 4) {
      setPendingEndState("win");
    }
  };

  const handleContinue = () => {
    if (pendingEndState) {
      const target = pendingEndState;
      setPendingEndState(null);
      setShowContinue(false);
      setGameState(target);
      return;
    }
    if (!activeZone) return;
    const nextId = nextClockwiseUnanswered(activeZone.id, answeredZones);
    if (nextId != null) {
      setNextZoneHint("Turn right to continue");
    }
    setShowContinue(false);
    setActiveQuestionZoneId(null);
  };

  const resetGame = (nextMagnitude = magnitude, nextCondition = condition) => {
    setAnsweredZones(new Set());
    setSelectedAnswers(new Map());
    setSurvivalRate(getStartRate(nextMagnitude, nextCondition));
    setGameState("playing");
    setIsShaking(false);
    setIsAnimating(false);
    setAnimationDirection(null);
    setLastWrongAnswer("");
    setLastWrongExplanation("");
    setLastWrongRealHazard("");
    setActiveQuestionZoneId(null);
    setShowContinue(false);
    setNextZoneHint(null);
    setPendingEndState(null);
  };

  const restartFromQ1 = (
    nextMagnitude = magnitude,
    nextCondition = condition,
  ) => {
    resetGame(nextMagnitude, nextCondition);
    window.setTimeout(() => setActiveQuestionZoneId(1), 60);
  };

  const changeMagnitude = (m: number) => {
    setMagnitude(m);
    resetGame(m, condition);
  };

  const changeCondition = (c: ScenarioCondition) => {
    setCondition(c);
    resetGame(magnitude, c);
  };

  return (
    <div
      className={`relative h-screen w-screen overflow-hidden bg-slate-950 ${
        isShaking ? shakeClass : ""
      }`}
    >
      <Pannellum
        id="hss-panorama"
        sceneId="hss-scene"
        imageSource="/waypoints/panorama_hss1.jpg"
        config={{
          autoLoad: true,
          autoRotate: -2,
          compass: false,
          showZoomCtrl: false,
          showFullscreenCtrl: false,
          mouseZoom: false,
          minPitch: -20,
          maxPitch: 25,
          pitch: 0,
          yaw: 0,
          hfov: 100,
        }}
        style={{
          width: "100vw",
          height: "100vh",
          position: "fixed",
          inset: 0,
          zIndex: 0,
        }}
        onLoad={() => {
          handleYaw();
        }}
        onMousedown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onAnimatefinished={handleYaw}
      />

      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(5,10,20,0.4) 100%)",
        }}
      />

      {(condition === "earthquake_fire" || condition === "earthquake_fire_dark") && (
        <div className="fire-overlay pointer-events-none fixed inset-0 z-[2] animate-pulse bg-[rgba(234,88,12,0.25)]" />
      )}
      {(condition === "earthquake_dark" || condition === "earthquake_fire_dark") && (
        <div className="dark-overlay pointer-events-none fixed inset-0 z-[2] bg-[rgba(0,0,0,0.7)]" />
      )}

      {gameState === "playing" && currentZone && activeQuestionZoneId == null && (
        <ZoneHighlight zone={currentZone} />
      )}
      {gameState === "playing" && nextZoneHint && <DirectionArrowHint text={nextZoneHint} />}

      {gameState === "playing" &&
        activeQuestion &&
        activeZone &&
        (() => {
          const focus =
            QUESTION_FOCUS[activeQuestion.zoneId] ?? { x: 50, y: 50 };
          const style = HIGHLIGHT_STYLE[activeZone.highlightType];
          const mask = `radial-gradient(ellipse 280px 220px at ${focus.x}% ${focus.y}%, transparent 0%, transparent 40%, black 80%)`;
          return (
            <>
              <div
                className="pointer-events-none fixed inset-0 z-10"
                style={{
                  background: "rgba(5,10,20,0.55)",
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                  maskImage: mask,
                  WebkitMaskImage: mask,
                  opacity: answeredCurrent ? 0 : 1,
                  transition:
                    "opacity 0.5s ease, mask-image 0.4s ease, -webkit-mask-image 0.4s ease",
                }}
              />
              {!answeredCurrent && (
                <>
                  <div
                    className="pointer-events-none fixed z-[11]"
                    style={{
                      left: `${focus.x}%`,
                      top: `${focus.y}%`,
                      width: 200,
                      height: 200,
                      marginLeft: -100,
                      marginTop: -100,
                      borderRadius: "9999px",
                      border: `2px solid ${style.border}`,
                      animation: "ringPulse 1.5s ease-out infinite",
                    }}
                  />
                  <div
                    className="pointer-events-none fixed z-[11]"
                    style={{
                      left: `${focus.x}%`,
                      top: `${focus.y}%`,
                      width: 200,
                      height: 200,
                      marginLeft: -100,
                      marginTop: -100,
                      borderRadius: "9999px",
                      border: `2px solid ${style.border}`,
                      animation: "ringPulse 1.5s ease-out 0.75s infinite",
                    }}
                  />
                  <div
                    className={`pointer-events-none fixed z-[12] rounded-full border px-[14px] py-[6px] text-[13px] font-semibold ${style.text}`}
                    style={{
                      left: `${focus.x}%`,
                      top: `${focus.y}%`,
                      transform: "translate(-50%, -50%)",
                      background: "rgba(10,15,30,0.9)",
                      borderColor: style.border,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {style.label}
                  </div>
                </>
              )}
            </>
          );
        })()}

      {gameState === "playing" && activeQuestionZoneId != null && (
        <div
          className="fixed inset-0 z-[15]"
          style={{ pointerEvents: "auto", background: "transparent" }}
          aria-hidden
        />
      )}

      {gameState !== "idle" && (
        <ScenarioCard
          magnitude={magnitude}
          condition={condition}
          onMagnitudeChange={changeMagnitude}
          onConditionChange={changeCondition}
          currentZone={currentZone}
          answeredZones={answeredZones}
          buildingHazards={BUILDING_HAZARDS}
          currentYaw={currentYaw}
          gameState={gameState}
          isShaking={isShaking}
          onSimulateShake={triggerShake}
        />
      )}

      {gameState !== "idle" && activeQuestion && activeZone && (
        <QuestionCard
          question={activeQuestion}
          zone={activeZone}
          onAnswer={handleAnswer}
          answered={answeredCurrent}
          selectedIndex={selectedIndex}
          survivalRate={survivalRate}
          isAnimating={isAnimating}
          animationDirection={animationDirection}
          questionNumber={
            answeredZones.has(activeQuestion.zoneId)
              ? answeredZones.size
              : answeredZones.size + 1
          }
          totalQuestions={4}
          showContinue={showContinue}
          onContinue={handleContinue}
          answeredZones={answeredZones}
          continueLabel={
            pendingEndState
              ? pendingEndState === "win"
                ? "✨ See Result →"
                : "💀 See Result →"
              : "Look Around to Continue →"
          }
        />
      )}

      {gameState === "idle" && (
        <div
          className="pointer-events-none fixed left-0 right-0 z-30 flex flex-col items-center gap-3"
          style={{ bottom: 60 }}
        >
          <div className="text-center">
            <div className="text-sm font-medium text-white/70">
              HSS Room 1345 — UCSD
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Drag to look around
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setGameState("playing");
              const firstZone =
                DIRECTION_ZONES.find((z) => !answeredZones.has(z.id))?.id ?? null;
              if (firstZone != null) setActiveQuestionZoneId(firstZone);
            }}
            className="pointer-events-auto sim-start-button rounded-xl font-bold text-white"
            style={{
              padding: "16px 48px",
              fontSize: 20,
              background: "#1A56DB",
              boxShadow: "0 0 30px rgba(26,86,219,0.6)",
            }}
          >
            ▶ Start Simulating
          </button>
        </div>
      )}

      {gameState === "gameOver" && (
        <GameOver
          magnitude={magnitude}
          condition={condition}
          lastWrongAnswer={lastWrongAnswer}
          lastWrongExplanation={lastWrongExplanation}
          lastWrongRealHazard={lastWrongRealHazard}
          onTryAgain={() => restartFromQ1()}
        />
      )}

      {gameState === "win" && (
        <WinScreen
          survivalRate={survivalRate}
          magnitude={magnitude}
          condition={condition}
          correctCount={correctCount}
          onPlayAgain={() => {
            const bumped = Math.min(8, magnitude + 0.5);
            setMagnitude(bumped);
            restartFromQ1(bumped, condition);
          }}
          onSeeRiskScore={() => {
            window.location.href = "/risk";
          }}
        />
      )}

      {isShaking &&
        (() => {
          const config = getShakeConfig(magnitude);
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                pointerEvents: "none",
                backgroundColor: config.overlay,
                animation: `shakeFlash ${config.dur}ms ease-out forwards`,
              }}
            />
          );
        })()}
    </div>
  );
}

