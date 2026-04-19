"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

/**
 * Reveal — drop-in blur/translate/fade entrance animation.
 *
 * The motion language here is deliberately aligned with the
 * AnimatedAIChat + PricingSection6 reference snippets the user
 * shared: a soft translateY, a 10→0px blur, staggered via
 * `delay` or `index * step`, and a cubic-bezier close to
 * easeOutQuint so items "settle" rather than snap.
 *
 * Kept tiny on purpose — we only use framer-motion for the
 * opt-in reveal, everything else in the codebase stays on pure
 * CSS (see .q-blur-reveal / .q-fade-up in globals.css).
 *
 *   <Reveal index={0}>                      — fade-in block
 *   <Reveal index={1} as="h1">              — staggered heading
 *   <RevealGroup>…</RevealGroup>            — auto-stagger children
 */
const EASE = [0.22, 1, 0.36, 1] as const;

export const revealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
    filter: "blur(10px)",
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.75,
      delay: i * 0.14,
      ease: EASE,
    },
  }),
};

type RevealProps = {
  /** Stagger index — convenient when several siblings share the component. */
  index?: number;
  /** Custom absolute delay in seconds (takes precedence over `index`). */
  delay?: number;
  /** Override the default 0.75s duration. */
  duration?: number;
  /** Only animate when scrolled into view (default true). */
  inView?: boolean;
  className?: string;
  children: ReactNode;
};

export function Reveal({
  index = 0,
  delay,
  duration = 0.75,
  inView = true,
  className,
  children,
}: RevealProps) {
  const transition = {
    duration,
    delay: delay ?? index * 0.14,
    ease: EASE,
  } as const;

  const initial = { opacity: 0, y: 22, filter: "blur(10px)" };
  const animate = { opacity: 1, y: 0, filter: "blur(0px)" };

  if (inView) {
    return (
      <motion.div
        className={className}
        initial={initial}
        whileInView={animate}
        viewport={{ once: true, margin: "-60px 0px" }}
        transition={transition}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={animate}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

type RevealGroupProps = {
  /** Delay between siblings in seconds. Default 0.12s. */
  step?: number;
  /** Delay before the first child animates in. */
  delayChildren?: number;
  className?: string;
  children: ReactNode;
};

/**
 * RevealGroup — wraps a flat list of children and auto-staggers
 * their entrance. Children inherit the same blur+translate
 * language; Framer Motion handles the stagger scheduling so the
 * children don't need to know their own index.
 */
export function RevealGroup({
  step = 0.12,
  delayChildren = 0,
  className,
  children,
}: RevealGroupProps) {
  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: step,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px 0px" }}
    >
      {children}
    </motion.div>
  );
}

/** Use inside <RevealGroup> for each staggered child. */
export function RevealItem({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div className={className} variants={revealVariants}>
      {children}
    </motion.div>
  );
}
