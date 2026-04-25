"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

type HeroBottle = {
  id: string;
  bbox: { x: number; y: number; w: number; h: number };
  producer: string;
  vintage: string;
};

const BOTTLES: HeroBottle[] = [
  { id: "h1", bbox: { x: 0.07, y: 0.18, w: 0.085, h: 0.62 }, producer: "Vacheron", vintage: "Sancerre 2022" },
  { id: "h2", bbox: { x: 0.18, y: 0.17, w: 0.085, h: 0.63 }, producer: "Drouhin", vintage: "Chablis 2021" },
  { id: "h3", bbox: { x: 0.29, y: 0.18, w: 0.085, h: 0.62 }, producer: "Guigal", vintage: "Côtes du Rhône 2020" },
  { id: "h4", bbox: { x: 0.40, y: 0.16, w: 0.085, h: 0.64 }, producer: "Antinori", vintage: "Tignanello 2019" },
  { id: "h5", bbox: { x: 0.52, y: 0.18, w: 0.085, h: 0.62 }, producer: "Pol Roger", vintage: "Brut Réserve" },
  { id: "h6", bbox: { x: 0.63, y: 0.18, w: 0.085, h: 0.62 }, producer: "Krug", vintage: "Grande Cuvée" },
  { id: "h7", bbox: { x: 0.74, y: 0.19, w: 0.085, h: 0.61 }, producer: "Penfolds", vintage: "Bin 389 2018" },
  { id: "h8", bbox: { x: 0.85, y: 0.19, w: 0.08, h: 0.61 }, producer: "Nyetimber", vintage: "Classic Cuvée" },
];

const LOOP_MS = 8000;
const DRAW_MS = 200; // per-bottle draw duration
const DRAW_STAGGER_MS = 200;
const LABEL_DELAY_MS = 200;
const RESULTS_DELAY_MS = 4200;
const HOLD_MS = 2000;

export function HeroAnimation() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), LOOP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full aspect-[4/3] border border-rule overflow-hidden bg-ink/5">
      <Image
        src="/hero-shelf.jpg"
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
  return (
    <>
      <svg
        viewBox="0 0 1000 750"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        {BOTTLES.map((b, i) => {
          const x = b.bbox.x * 1000;
          const y = b.bbox.y * 750;
          const w = b.bbox.w * 1000;
          const h = b.bbox.h * 750;
          const perimeter = 2 * (w + h);
          const delay = (i * DRAW_STAGGER_MS) / 1000;
          return (
            <motion.rect
              key={b.id}
              x={x}
              y={y}
              width={w}
              height={h}
              fill="none"
              stroke="#5c1a1f"
              strokeWidth={2.5}
              strokeDasharray={perimeter}
              strokeDashoffset={perimeter}
              initial={{ strokeDashoffset: perimeter, opacity: 0.9 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{
                duration: DRAW_MS / 1000,
                delay,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </svg>

      {/* Labels */}
      <div className="absolute inset-0 pointer-events-none">
        {BOTTLES.map((b, i) => {
          const labelDelay = (i * DRAW_STAGGER_MS + LABEL_DELAY_MS) / 1000;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: labelDelay }}
              className="absolute"
              style={{
                left: `${(b.bbox.x + b.bbox.w / 2) * 100}%`,
                top: `${(b.bbox.y + b.bbox.h + 0.01) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="bg-bone border border-rule px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] whitespace-nowrap shadow-sm">
                <span className="text-ink">{b.producer}</span>
                <span className="text-muted ml-1.5">{b.vintage}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Results card */}
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
            8 bottles
          </span>
        </div>
        <ul className="text-[11px]">
          {BOTTLES.slice(0, 5).map((b) => (
            <li
              key={b.id}
              className="px-3 py-1.5 hairline-b last:border-0 flex items-baseline justify-between gap-2"
            >
              <span className="font-display tracking-tightish truncate">
                {b.producer}
              </span>
              <span className="font-mono text-[9px] tnum text-muted whitespace-nowrap">
                {b.vintage.split(" ").pop()}
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
