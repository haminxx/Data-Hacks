"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/cn";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Scoped styles for the cinematic emergency hero. Injected as a single
 * <style> block so we don't have to touch the global Tailwind layer with
 * highly specific skeuomorphic rules. Mostly ported from the upstream
 * Sobers hero with an emergency / AR-specific paint job.
 */
const INJECTED_STYLES = `
  .ce-gsap-reveal { visibility: hidden; }

  .ce-film-grain {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 50; opacity: 0.05; mix-blend-mode: overlay;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>');
  }

  .ce-bg-grid {
    background-size: 60px 60px;
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  .ce-card-silver {
    background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter:
      drop-shadow(0px 12px 24px rgba(0,0,0,0.8))
      drop-shadow(0px 4px 8px rgba(0,0,0,0.6));
  }

  .ce-premium-card {
    background: linear-gradient(145deg, #1a1026 0%, #0a0712 100%);
    box-shadow:
      0 40px 100px -20px rgba(0, 0, 0, 0.9),
      0 20px 40px -20px rgba(0, 0, 0, 0.8),
      inset 0 1px 2px rgba(255, 255, 255, 0.2),
      inset 0 -2px 4px rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.04);
    position: relative;
  }
  .ce-card-sheen {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
    background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(239, 68, 68, 0.08) 0%, transparent 40%);
    mix-blend-mode: screen;
  }

  .ce-iphone-bezel {
    background-color: #111;
    box-shadow:
      inset 0 0 0 2px #52525B,
      inset 0 0 0 7px #000,
      0 40px 80px -15px rgba(0,0,0,0.9),
      0 15px 25px -5px rgba(0,0,0,0.7);
    transform-style: preserve-3d;
  }
  .ce-hardware-btn {
    background: linear-gradient(90deg, #404040 0%, #171717 100%);
    box-shadow:
      -2px 0 5px rgba(0,0,0,0.8),
      inset -1px 0 1px rgba(255,255,255,0.15),
      inset 1px 0 2px rgba(0,0,0,0.8);
    border-left: 1px solid rgba(255,255,255,0.05);
  }
  .ce-screen-glare {
    background: linear-gradient(110deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%);
  }
  .ce-widget-depth {
    background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
    box-shadow:
      0 10px 20px rgba(0,0,0,0.3),
      inset 0 1px 1px rgba(255,255,255,0.05),
      inset 0 -1px 1px rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.03);
  }
  .ce-floating-ui {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.1),
      0 25px 50px -12px rgba(0, 0, 0, 0.8),
      inset 0 1px 1px rgba(255,255,255,0.2),
      inset 0 -1px 1px rgba(0,0,0,0.5);
  }

  /* iOS-style notification banner (acts 1). Mirrors the reference screenshot:
     dark translucent pill, warning glyph, title/meta row, 2-line body. */
  .ce-ios-notif {
    background: rgba(28, 28, 30, 0.78);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow:
      0 24px 48px -12px rgba(0, 0, 0, 0.55),
      0 8px 16px -4px rgba(0, 0, 0, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  /* Subtle conic sweep for the AR viewfinder — reads as a live sensor. */
  @keyframes ce-radar-sweep {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .ce-radar {
    background: conic-gradient(from 0deg, transparent 0deg, rgba(34,197,94,0.35) 20deg, transparent 40deg);
    animation: ce-radar-sweep 3.6s linear infinite;
  }

  @keyframes ce-scan {
    0% { transform: translateY(-100%); opacity: 0; }
    10% { opacity: 0.7; }
    90% { opacity: 0.7; }
    100% { transform: translateY(100%); opacity: 0; }
  }
  .ce-scanline {
    background: linear-gradient(180deg, transparent 0%, rgba(34, 197, 94, 0.25) 45%, rgba(34, 197, 94, 0.6) 50%, rgba(34, 197, 94, 0.25) 55%, transparent 100%);
    animation: ce-scan 4s ease-in-out infinite;
  }

  @keyframes ce-chevron-pulse {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0.9; }
    50% { transform: translateY(-6px) scale(1.04); opacity: 1; }
  }
  .ce-chevron-stack > * {
    animation: ce-chevron-pulse 2.1s ease-in-out infinite;
  }
  .ce-chevron-stack > *:nth-child(2) { animation-delay: 0.3s; }
  .ce-chevron-stack > *:nth-child(3) { animation-delay: 0.6s; }

  .ce-progress-ring {
    transform: rotate(-90deg);
    transform-origin: center;
    stroke-dasharray: 402;
    stroke-dashoffset: 402;
    stroke-linecap: round;
  }

  /* "LIVE" pulse dot for the AR HUD / notification */
  @keyframes ce-live-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.35); opacity: 0.6; }
  }
  .ce-live-dot { animation: ce-live-pulse 1.4s ease-in-out infinite; }
`;

export interface CinematicEmergencyProps
  extends React.HTMLAttributes<HTMLDivElement> {
  brandName?: string;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
  arHeading?: string;
  arSubtitle?: string;
}

/**
 * 3-act scroll cinematic used on /emergency.
 *
 *   Act 1: iOS-style emergency alert banner floats in at the top of the
 *          viewport (mirrors the reference screenshot the user shared).
 *   Act 2: Deep card slides up and unfolds into a full-bleed hero with a
 *          phone mockup showing the SeismoShield "Drop · Cover · Hold On"
 *          interface, orbiting floating-glass badges, and a timer ring.
 *   Act 3: The camera zooms INTO the phone's black screen, which opens
 *          into a live AR evacuation-guidance viewfinder with scan line,
 *          waypoint chevrons, radar sweep, and HUD telemetry.
 */
export function CinematicEmergency({
  brandName = "SeismoShield",
  cardHeading = "Guidance, the moment it shakes.",
  cardDescription = (
    <>
      <span className="font-semibold text-white">SeismoShield</span> turns the
      USGS ShakeAlert feed into a real-time drop-cover-hold response, then
      hands you off to an AR evacuation layer the instant the shaking stops.
    </>
  ),
  arHeading = "AR evacuation guidance",
  arSubtitle = "Follow the markers to the nearest rally point. Green chevrons are safe egress. Red bands mark blocked routes.",
  className,
  ...props
}: CinematicEmergencyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  // Parallax tilt on the phone mockup + radial sheen on the deep card.
  // Uses rAF to avoid piling up gsap.to calls on every mousemove tick.
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 2) return;
      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        if (!mainCardRef.current || !mockupRef.current) return;
        const rect = mainCardRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        mainCardRef.current.style.setProperty("--mouse-x", `${mouseX}px`);
        mainCardRef.current.style.setProperty("--mouse-y", `${mouseY}px`);
        const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
        const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to(mockupRef.current, {
          rotationY: xVal * 10,
          rotationX: -yVal * 10,
          ease: "power3.out",
          duration: 1.2,
        });
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // The three-act scroll timeline.
  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      // Starting state. Everything the scroll will touch is hidden /
      // displaced so we can reveal it deterministically.
      gsap.set(".ce-notif", {
        autoAlpha: 0,
        y: -120,
        scale: 0.9,
        filter: "blur(14px)",
      });
      gsap.set(".ce-main-card", {
        y: window.innerHeight + 200,
        autoAlpha: 1,
      });
      gsap.set(
        [
          ".ce-card-left-text",
          ".ce-card-right-text",
          ".ce-mockup-wrapper",
          ".ce-floating-badge",
          ".ce-phone-widget",
        ],
        { autoAlpha: 0 },
      );
      gsap.set(".ce-ar-wrapper", {
        autoAlpha: 0,
        scale: 1.3,
        filter: "blur(24px)",
      });
      gsap.set(".ce-ar-hud", { autoAlpha: 0, y: 12 });

      const introTl = gsap.timeline({ delay: 0.25 });
      introTl.to(".ce-notif", {
        duration: 1.1,
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        ease: "expo.out",
      });

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=7200",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      scrollTl
        // Notification drifts back and out while the deep card slides in.
        .to(
          [".ce-hero-wrapper", ".ce-bg-grid"],
          {
            scale: 1.15,
            filter: "blur(20px)",
            opacity: 0.15,
            ease: "power2.inOut",
            duration: 2,
          },
          0,
        )
        .to(".ce-main-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".ce-main-card", {
          width: "100%",
          height: "100%",
          borderRadius: "0px",
          ease: "power3.inOut",
          duration: 1.5,
        })
        // Phone mockup lands from below/behind.
        .fromTo(
          ".ce-mockup-wrapper",
          {
            y: 300,
            z: -500,
            rotationX: 50,
            rotationY: -25,
            autoAlpha: 0,
            scale: 0.6,
          },
          {
            y: 0,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            autoAlpha: 1,
            scale: 1,
            ease: "expo.out",
            duration: 2.5,
          },
          "-=0.8",
        )
        .fromTo(
          ".ce-phone-widget",
          { y: 40, autoAlpha: 0, scale: 0.95 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            stagger: 0.12,
            ease: "back.out(1.2)",
            duration: 1.4,
          },
          "-=1.5",
        )
        .to(
          ".ce-progress-ring",
          { strokeDashoffset: 120, duration: 2, ease: "power3.inOut" },
          "-=1.2",
        )
        .to(
          ".ce-counter-val",
          {
            innerHTML: 4.2,
            snap: { innerHTML: 0.1 },
            duration: 2,
            ease: "expo.out",
          },
          "-=2.0",
        )
        .fromTo(
          ".ce-floating-badge",
          { y: 100, autoAlpha: 0, scale: 0.7, rotationZ: -8 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            rotationZ: 0,
            ease: "back.out(1.5)",
            duration: 1.5,
            stagger: 0.2,
          },
          "-=2.0",
        )
        .fromTo(
          ".ce-card-left-text",
          { x: -50, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.5 },
          "-=1.5",
        )
        .fromTo(
          ".ce-card-right-text",
          { x: 50, autoAlpha: 0, scale: 0.8 },
          { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.5 },
          "<",
        )
        .to({}, { duration: 2 })
        // ACT 3 — zoom INTO the phone screen. Bezel inflates past the
        // viewport while widgets, badges, and the card text dissolve,
        // then the AR wrapper fades in from scale 1.3 → 1.0 so it feels
        // like emerging OUT of the phone rather than a hard cut.
        .to(
          [".ce-card-left-text", ".ce-card-right-text", ".ce-floating-badge"],
          {
            autoAlpha: 0,
            y: -30,
            ease: "power2.in",
            duration: 0.9,
            stagger: 0.04,
          },
          "zoomin",
        )
        .to(
          ".ce-phone-widget",
          {
            autoAlpha: 0,
            scale: 0.6,
            ease: "power2.in",
            duration: 1.0,
            stagger: 0.04,
          },
          "zoomin+=0.1",
        )
        .to(
          ".ce-mockup-wrapper",
          {
            scale: isMobile ? 7 : 9,
            autoAlpha: 0,
            filter: "blur(8px)",
            ease: "power3.in",
            duration: 1.8,
          },
          "zoomin+=0.3",
        )
        .to(
          ".ce-main-card",
          {
            autoAlpha: 0,
            ease: "power2.inOut",
            duration: 1.2,
          },
          "zoomin+=0.9",
        )
        .to(
          ".ce-ar-wrapper",
          {
            autoAlpha: 1,
            scale: 1,
            filter: "blur(0px)",
            ease: "expo.out",
            duration: 1.6,
          },
          "zoomin+=0.9",
        )
        .to(
          ".ce-ar-hud",
          {
            autoAlpha: 1,
            y: 0,
            ease: "power3.out",
            duration: 1.1,
            stagger: 0.08,
          },
          "zoomin+=1.4",
        )
        // Hold on the AR view so the user can actually read it.
        .to({}, { duration: 2 });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-screen w-screen overflow-hidden bg-[#07070c] font-sans antialiased text-white",
        className,
      )}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="ce-film-grain" aria-hidden="true" />
      <div
        className="ce-bg-grid pointer-events-none absolute inset-0 z-0 opacity-60"
        aria-hidden="true"
      />

      {/* ── ACT 1 — floating iOS emergency alert banner ─────────── */}
      <div className="ce-hero-wrapper absolute inset-x-0 top-0 z-10 flex h-full w-full items-start justify-center px-4 pt-20 md:pt-28">
        <div
          className="ce-notif ce-gsap-reveal w-full max-w-md will-change-transform"
          role="alert"
        >
          <div className="ce-ios-notif flex items-start gap-3 rounded-[22px] px-4 py-3.5">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#fbbf24]/15 ring-1 ring-[#fbbf24]/35">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-[#fbbf24]"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2.5 1.5 21.5h21L12 2.5Zm0 5.4 7.4 13.3H4.6L12 7.9ZM11 11h2v5h-2v-5Zm0 6.2h2v2h-2v-2Z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-white">
                  <span className="ce-live-dot h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                  Emergency Alert
                </span>
                <span className="shrink-0 text-[11px] font-medium text-white/55">
                  now
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-[1.35] text-white/90">
                Earthquake Detected! Drop, Cover, Hold On. Protect Yourself.
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-white/50">
                — USGS ShakeAlert
              </p>
            </div>
          </div>
          <p className="mt-6 text-center text-[11px] uppercase tracking-[0.28em] text-white/40">
            Scroll to see the response
          </p>
        </div>
      </div>

      {/* ── ACT 2 — Deep premium card with iPhone mockup ───────── */}
      <div
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
        style={{ perspective: "1500px" }}
      >
        <div
          ref={mainCardRef}
          className="ce-main-card ce-premium-card ce-gsap-reveal pointer-events-auto relative flex h-[92vh] w-[92vw] items-center justify-center overflow-hidden rounded-[32px] md:h-[85vh] md:w-[85vw] md:rounded-[40px]"
        >
          <div className="ce-card-sheen" aria-hidden="true" />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-evenly px-4 py-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:px-12 lg:py-0">
            {/* TOP (mobile) / RIGHT (desktop): BRAND */}
            <div className="ce-card-right-text ce-gsap-reveal order-1 z-20 flex w-full justify-center lg:order-3 lg:justify-end">
              <h2 className="ce-card-silver text-[3rem] font-black uppercase tracking-tighter sm:text-6xl md:text-[6rem] lg:text-[7rem]">
                {brandName}
              </h2>
            </div>

            {/* CENTER: iPhone mockup */}
            <div
              className="ce-mockup-wrapper order-2 relative z-10 flex h-[380px] w-full items-center justify-center lg:order-2 lg:h-[600px]"
              style={{ perspective: "1000px" }}
            >
              <div className="relative flex h-full w-full scale-[0.65] items-center justify-center md:scale-[0.85] lg:scale-100">
                <div
                  ref={mockupRef}
                  className="ce-iphone-bezel relative flex h-[580px] w-[280px] flex-col rounded-[3rem] will-change-transform"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div
                    className="ce-hardware-btn absolute -left-[3px] top-[120px] z-0 h-[25px] w-[3px] rounded-l-md"
                    aria-hidden="true"
                  />
                  <div
                    className="ce-hardware-btn absolute -left-[3px] top-[160px] z-0 h-[45px] w-[3px] rounded-l-md"
                    aria-hidden="true"
                  />
                  <div
                    className="ce-hardware-btn absolute -left-[3px] top-[220px] z-0 h-[45px] w-[3px] rounded-l-md"
                    aria-hidden="true"
                  />
                  <div
                    className="ce-hardware-btn absolute -right-[3px] top-[170px] z-0 h-[70px] w-[3px] scale-x-[-1] rounded-r-md"
                    aria-hidden="true"
                  />

                  {/* Inner screen */}
                  <div className="absolute inset-[7px] z-10 overflow-hidden rounded-[2.5rem] bg-[#050914] text-white shadow-[inset_0_0_15px_rgba(0,0,0,1)]">
                    <div
                      className="ce-screen-glare pointer-events-none absolute inset-0 z-40"
                      aria-hidden="true"
                    />

                    <div className="absolute left-1/2 top-[5px] z-50 flex h-[28px] w-[100px] -translate-x-1/2 items-center justify-end rounded-full bg-black px-3 shadow-[inset_0_-1px_2px_rgba(255,255,255,0.1)]">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    </div>

                    <div className="relative flex h-full w-full flex-col px-5 pb-8 pt-12">
                      <div className="ce-phone-widget mb-6 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-red-300">
                            ShakeAlert · Live
                          </span>
                          <span className="text-xl font-bold tracking-tight text-white drop-shadow-md">
                            Drop · Cover · Hold
                          </span>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-bold text-neutral-200 shadow-lg shadow-black/50">
                          !
                        </div>
                      </div>

                      {/* Magnitude ring */}
                      <div className="ce-phone-widget relative mx-auto mb-6 flex h-44 w-44 items-center justify-center drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]">
                        <svg
                          className="absolute inset-0 h-full w-full"
                          aria-hidden="true"
                        >
                          <circle
                            cx="88"
                            cy="88"
                            r="64"
                            fill="none"
                            stroke="rgba(255,255,255,0.04)"
                            strokeWidth="12"
                          />
                          <circle
                            className="ce-progress-ring"
                            cx="88"
                            cy="88"
                            r="64"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="12"
                          />
                        </svg>
                        <div className="z-10 flex flex-col items-center text-center">
                          <span className="ce-counter-val text-4xl font-extrabold tracking-tighter text-white">
                            0.0
                          </span>
                          <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-red-200/60">
                            Magnitude · Salton Sea
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="ce-phone-widget ce-widget-depth flex items-center rounded-2xl p-3">
                          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-gradient-to-br from-red-500/20 to-red-600/5 shadow-inner">
                            <svg
                              className="h-4 w-4 text-red-400 drop-shadow-md"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v3.75m0-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.59 3.824 10.29 9 11.623 5.176-1.332 9-6.033 9-11.623 0-1.31-.21-2.571-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-[11px] font-semibold text-white">
                              Drop to your hands & knees
                            </div>
                            <div className="text-[9px] text-white/45">
                              Protect your neck · 2 sec
                            </div>
                          </div>
                        </div>
                        <div className="ce-phone-widget ce-widget-depth flex items-center rounded-2xl p-3">
                          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-500/20 to-amber-600/5 shadow-inner">
                            <svg
                              className="h-4 w-4 text-amber-300 drop-shadow-md"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 12 12 3l9 9M5 10v10h14V10"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-[11px] font-semibold text-white">
                              Cover — get under sturdy desk
                            </div>
                            <div className="text-[9px] text-white/45">
                              Stay clear of glass & shelves
                            </div>
                          </div>
                        </div>
                        <div className="ce-phone-widget ce-widget-depth flex items-center rounded-2xl p-3">
                          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 shadow-inner">
                            <svg
                              className="h-4 w-4 text-emerald-400 drop-shadow-md"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-[11px] font-semibold text-white">
                              Hold on — AR egress armed
                            </div>
                            <div className="text-[9px] text-white/45">
                              Ready to guide on shaking-stop
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-1/2 h-[4px] w-[120px] -translate-x-1/2 rounded-full bg-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                    </div>
                  </div>
                </div>

                {/* Floating glass badges */}
                <div className="ce-floating-badge ce-floating-ui absolute left-[-15px] top-6 z-30 flex items-center gap-3 rounded-xl p-3 lg:left-[-80px] lg:top-12 lg:gap-4 lg:rounded-2xl lg:p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-red-400/30 bg-gradient-to-b from-red-500/25 to-red-900/10 shadow-inner lg:h-10 lg:w-10">
                    <span
                      className="text-base drop-shadow-lg lg:text-xl"
                      aria-hidden="true"
                    >
                      ⚠️
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-tight text-white lg:text-sm">
                      P-wave detected
                    </p>
                    <p className="text-[10px] font-medium text-red-200/60 lg:text-xs">
                      9.4 s until S-wave
                    </p>
                  </div>
                </div>

                <div className="ce-floating-badge ce-floating-ui absolute bottom-12 right-[-15px] z-30 flex items-center gap-3 rounded-xl p-3 lg:bottom-20 lg:right-[-80px] lg:gap-4 lg:rounded-2xl lg:p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/30 bg-gradient-to-b from-emerald-500/20 to-emerald-900/10 shadow-inner lg:h-10 lg:w-10">
                    <span
                      className="text-base drop-shadow-lg lg:text-lg"
                      aria-hidden="true"
                    >
                      🧭
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-tight text-white lg:text-sm">
                      AR egress ready
                    </p>
                    <p className="text-[10px] font-medium text-emerald-200/60 lg:text-xs">
                      Path: Stairwell A
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM (mobile) / LEFT (desktop): HEADING */}
            <div className="ce-card-left-text ce-gsap-reveal order-3 z-20 flex w-full flex-col justify-center px-4 text-center lg:order-1 lg:max-w-none lg:px-0 lg:text-left">
              <h3 className="mb-0 text-2xl font-bold tracking-tight text-white md:text-3xl lg:mb-5 lg:text-4xl">
                {cardHeading}
              </h3>
              <p className="mx-auto hidden max-w-sm text-sm font-normal leading-relaxed text-red-100/60 md:block md:text-base lg:mx-0 lg:max-w-none lg:text-lg">
                {cardDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACT 3 — AR camera viewfinder ─────────────────────────── */}
      <div className="ce-ar-wrapper ce-gsap-reveal pointer-events-none absolute inset-0 z-30 overflow-hidden">
        {/* Dark "camera feed" — layered gradients fake a dim hallway with
            a vanishing point down the center, so the chevrons and HUD
            have somewhere to point. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 55%, #0d1b2a 0%, #050914 60%, #000 100%), linear-gradient(180deg, rgba(10,10,20,0) 0%, rgba(10,10,20,0.55) 100%)",
          }}
          aria-hidden="true"
        />
        {/* Perspective floor grid to sell the "you're walking a hallway" read */}
        <div
          className="absolute inset-x-0 bottom-0 h-[55%] opacity-50"
          style={{
            background:
              "linear-gradient(to top, rgba(34,197,94,0.12) 0%, transparent 70%), repeating-linear-gradient(0deg, rgba(34,197,94,0.18) 0 1px, transparent 1px 48px), repeating-linear-gradient(90deg, rgba(34,197,94,0.12) 0 1px, transparent 1px 48px)",
            transform: "perspective(600px) rotateX(62deg)",
            transformOrigin: "bottom center",
            maskImage:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 95%)",
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 95%)",
          }}
          aria-hidden="true"
        />
        {/* Moving scan line */}
        <div
          className="ce-scanline pointer-events-none absolute inset-0"
          aria-hidden="true"
        />

        {/* Viewfinder corner brackets */}
        <div className="absolute inset-6 md:inset-12">
          <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-emerald-400/70" />
          <div className="absolute right-0 top-0 h-10 w-10 border-r-2 border-t-2 border-emerald-400/70" />
          <div className="absolute bottom-0 left-0 h-10 w-10 border-b-2 border-l-2 border-emerald-400/70" />
          <div className="absolute bottom-0 right-0 h-10 w-10 border-b-2 border-r-2 border-emerald-400/70" />
        </div>

        {/* Center reticle + waypoint chevrons pointing to exit */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="ce-ar-hud ce-gsap-reveal relative flex flex-col items-center">
            <div className="ce-chevron-stack flex flex-col items-center gap-1.5 drop-shadow-[0_0_18px_rgba(34,197,94,0.55)]">
              <svg
                className="h-10 w-14 text-emerald-400"
                viewBox="0 0 48 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <polygon points="24,0 48,20 36,20 24,8 12,20 0,20" />
              </svg>
              <svg
                className="h-8 w-12 text-emerald-400/90"
                viewBox="0 0 48 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <polygon points="24,0 48,20 36,20 24,8 12,20 0,20" />
              </svg>
              <svg
                className="h-6 w-10 text-emerald-400/70"
                viewBox="0 0 48 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <polygon points="24,0 48,20 36,20 24,8 12,20 0,20" />
              </svg>
            </div>
            <div className="mt-5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200 backdrop-blur">
              Exit · 23 m
            </div>
          </div>
        </div>

        {/* Radar mini-map top-right */}
        <div className="ce-ar-hud ce-gsap-reveal absolute right-6 top-6 md:right-12 md:top-12">
          <div className="relative h-28 w-28 rounded-full border border-emerald-400/40 bg-black/40 backdrop-blur-md">
            <div className="ce-radar absolute inset-0 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(34,197,94,0.9)]" />
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-200/80">
              Scan
            </div>
          </div>
        </div>

        {/* Top-left: LIVE AR GUIDANCE pill */}
        <div className="ce-ar-hud ce-gsap-reveal absolute left-6 top-6 md:left-12 md:top-12">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur-md">
            <span className="ce-live-dot h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            Live AR guidance
          </div>
        </div>

        {/* Bottom center: HUD telemetry bar */}
        <div className="ce-ar-hud ce-gsap-reveal absolute inset-x-0 bottom-10 flex justify-center px-4 md:bottom-16">
          <div className="grid w-full max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-black/55 text-center backdrop-blur-md">
            <div className="px-5 py-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/50">
                Route
              </div>
              <div className="mt-0.5 text-sm font-semibold text-emerald-300">
                Stairwell A · Left 12 m
              </div>
            </div>
            <div className="px-5 py-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/50">
                Rally point
              </div>
              <div className="mt-0.5 text-sm font-semibold text-white">
                Revelle Plaza
              </div>
            </div>
            <div className="px-5 py-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/50">
                People ahead
              </div>
              <div className="mt-0.5 text-sm font-semibold text-white">
                3 · clear
              </div>
            </div>
          </div>
        </div>

        {/* Top center heading */}
        <div className="ce-ar-hud ce-gsap-reveal absolute inset-x-0 top-24 flex flex-col items-center text-center md:top-32">
          <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_4px_20px_rgba(34,197,94,0.25)] md:text-4xl">
            {arHeading}
          </h2>
          <p className="mt-2 max-w-xl px-6 text-xs text-white/55 md:text-sm">
            {arSubtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
