"use client";

import { motion, AnimatePresence } from "framer-motion";

export type StatusStage = "idle" | "detecting" | "identifying" | "done" | "error";

const labels: Record<Exclude<StatusStage, "idle">, string> = {
  detecting: "Detecting bottles",
  identifying: "Identifying labels",
  done: "Complete",
  error: "Error",
};

export function StatusLine({ stage }: { stage: StatusStage }) {
  if (stage === "idle") return null;
  const text = labels[stage];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted"
      >
        {(stage === "detecting" || stage === "identifying") && (
          <motion.span
            aria-hidden
            className="inline-block w-2 h-2 bg-oxblood rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
        {stage === "done" && (
          <span aria-hidden className="inline-block w-2 h-2 bg-moss rounded-full" />
        )}
        {stage === "error" && (
          <span aria-hidden className="inline-block w-2 h-2 bg-oxblood rounded-full" />
        )}
        <span>{text}</span>
        {(stage === "detecting" || stage === "identifying") && (
          <span className="inline-flex gap-0.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block w-1 h-1 bg-muted rounded-full"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
