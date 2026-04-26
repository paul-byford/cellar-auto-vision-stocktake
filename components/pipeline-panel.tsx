"use client";

import { useEffect, useState } from "react";
import type { StatusStage } from "@/components/status-line";

const PIPELINE_STEPS = [
  { label: "Detecting bottles" },
  { label: "Reading labels" },
  { label: "Generating inventory" },
];

function stageIndex(stage: StatusStage | null | undefined): number {
  if (stage === "detecting") return 0;
  if (stage === "identifying") return 1;
  if (stage === "error") return -1; // all steps show as pending
  return 3; // done — past all steps
}

export function PipelinePanel({
  stage,
  onViewResults,
}: {
  stage: StatusStage | null | undefined;
  onViewResults?: () => void;
}) {
  const isDone = stage === "done";
  const isError = stage === "error";
  const stageIdx = stageIndex(stage);

  const headerStatus = isDone ? "Complete" : isError ? "Error" : "Running";

  return (
    <div className="bg-bone border border-rule shadow-lg w-[172px]">
      <div className="px-3 py-2 hairline-b flex items-baseline justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
          Pipeline
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-oxblood">
          {headerStatus}
        </span>
      </div>
      <ul className="px-3 py-2.5 space-y-2">
        {PIPELINE_STEPS.map((step, i) => {
          const stepDone = stageIdx > i;
          const stepActive = !stepDone && stageIdx === i;
          return (
            <li
              key={step.label}
              className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em]"
            >
              <span className="w-3 shrink-0 flex items-center justify-center">
                {stepDone ? (
                  <span className="text-oxblood">✓</span>
                ) : stepActive ? (
                  <BlinkingDot />
                ) : (
                  <span className="text-muted">·</span>
                )}
              </span>
              <span className={stepDone || stepActive ? "text-ink" : "text-muted"}>
                {step.label}
                {stepActive && <span className="text-muted">…</span>}
              </span>
            </li>
          );
        })}
      </ul>
      {(isDone || isError) && onViewResults && (
        <div className="px-3 pb-3">
          <button
            onClick={onViewResults}
            className="w-full py-1.5 border border-oxblood font-mono text-[9px] uppercase tracking-[0.18em] text-oxblood hover:bg-oxblood hover:text-bone transition-colors"
          >
            {isError ? "View error →" : "View results →"}
          </button>
        </div>
      )}
    </div>
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
