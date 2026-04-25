"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { WineRow } from "@/lib/types";
import { formatGbp } from "@/lib/wine-prices";

function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

function Figure({
  label,
  value,
  format,
  caption,
  emphasise,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  caption?: string;
  emphasise?: boolean;
}) {
  const animated = useCountUp(value);
  return (
    <div className="flex flex-col gap-2 p-6 md:p-8">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
      <div
        className={
          "font-display tnum text-[2.5rem] md:text-[3.25rem] leading-none tracking-tighter " +
          (emphasise ? "text-oxblood" : "text-ink")
        }
      >
        {format(animated)}
      </div>
      {caption ? (
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {caption}
        </div>
      ) : null}
    </div>
  );
}

export function SummaryStrip({ wines }: { wines: WineRow[] }) {
  const totalBottles = wines.reduce((s, w) => s + w.count, 0);
  const totalValue = wines.reduce(
    (s, w) => s + w.estimatedPriceGbp * w.count,
    0
  );
  const needsReview = wines.filter((w) => w.confidence < 70).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 sm:grid-cols-3 hairline border border-rule bg-bone divide-y sm:divide-y-0 sm:divide-x divide-rule"
    >
      <Figure
        label="Bottles identified"
        value={totalBottles}
        format={(n) => Math.round(n).toString()}
      />
      <Figure
        label="Estimated cellar value"
        value={totalValue}
        format={(n) => formatGbp(n)}
        caption="Indicative retail value, not for stocktake purposes"
      />
      <Figure
        label="Needs review"
        value={needsReview}
        format={(n) => Math.round(n).toString()}
        emphasise={needsReview > 0}
      />
    </motion.div>
  );
}
