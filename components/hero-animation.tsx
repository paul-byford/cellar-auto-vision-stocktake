"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

const WINES = [
  { producer: "Alégorse", vintage: "Pessac-Léognan", count: 2 },
  { producer: "La Conseillante", vintage: "Pomerol 1998", count: 1 },
  { producer: "Le Garage", vintage: "Vin de France", count: 3 },
  { producer: "Maréchaux", vintage: "Bordeaux 2012", count: 2 },
  { producer: "Château Gigon", vintage: "Châteauneuf 2017", count: 1 },
];

const STEPS = ["Detecting bottles", "Reading labels", "Generating inventory"];

const LOOP_MS = 9000;
const STEP_MS = 1500;
const RESULTS_DELAY_MS = 5200;
const HOLD_MS = 2000;

export function HeroAnimation() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), LOOP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full aspect-[7/4] border border-rule overflow-hidden bg-ink/5">
      <Image
        src="/humble-grape-hero.jpg"
        alt="Wine shelf"
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={tick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <Overlay />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Overlay() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setStep(i + 1), (i + 1) * STEP_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const allDone = step >= STEPS.length;

  return (
    <>
      {/* Pipeline status panel — bottom-left, sits over the cork board area */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-3 bottom-3 sm:left-5 sm:bottom-5 bg-bone border border-rule shadow-md w-[190px]"
      >
        <div className="px-3 py-2 hairline-b flex items-baseline justify-between gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            Pipeline
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-oxblood">
            {allDone ? "Complete" : "Running"}
          </span>
        </div>
        <ul className="px-3 py-2.5 space-y-2">
          {STEPS.map((label, i) => {
            const isActive = step === i;
            const isDone = step > i;
            return (
              <li
                key={label}
                className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em]"
              >
                <span className="w-3 shrink-0 flex items-center justify-center">
                  {isDone ? (
                    <span className="text-oxblood">✓</span>
                  ) : isActive ? (
                    <BlinkingDot />
                  ) : (
                    <span className="text-muted">·</span>
                  )}
                </span>
                <span className={isDone || isActive ? "text-ink" : "text-muted"}>
                  {label}
                  {isActive && <span className="text-muted">…</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </motion.div>

      {/* Inventory card — top-right */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.5,
          delay: RESULTS_DELAY_MS / 1000,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="absolute right-3 top-3 sm:right-5 sm:top-5 bg-bone border border-rule shadow-md w-[60%] max-w-[300px]"
      >
        <div className="px-3 py-2 hairline-b flex items-baseline justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            Inventory
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-oxblood tnum">
            8 wines
          </span>
        </div>
        <ul className="text-[11px]">
          {WINES.map((w) => (
            <li
              key={w.producer}
              className="px-3 py-1.5 hairline-b last:border-0 flex items-baseline justify-between gap-2"
            >
              <span className="font-display tracking-tightish truncate">
                {w.producer}
              </span>
              <span className="font-mono text-[9px] tnum text-muted whitespace-nowrap">
                ×{w.count}
              </span>
            </li>
          ))}
          <li className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
            + 3 more
          </li>
        </ul>
      </motion.div>

      {/* End-of-loop fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{
          duration: (HOLD_MS + 600) / 1000,
          delay: (RESULTS_DELAY_MS + 800) / 1000,
          times: [0, 0.85, 1],
        }}
        className="absolute inset-0 bg-bone pointer-events-none"
      />
    </>
  );
}

function BlinkingDot() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 530);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-oxblood transition-opacity duration-100"
      style={{ opacity: on ? 1 : 0.15 }}
    />
  );
}
