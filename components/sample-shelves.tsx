"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import type { StatusStage } from "@/components/status-line";
import { PipelinePanel } from "@/components/pipeline-panel";

export type Sample = {
  key: "easy" | "medium" | "hard";
  difficulty: string;
  caption: string;
  imageUrl: string;
};

export const SAMPLES: Sample[] = [
  {
    key: "easy",
    difficulty: "Easy",
    caption: "Front-facing labels",
    imageUrl: "/samples/humble-grape-easy-b.webp",
  },
  {
    key: "medium",
    difficulty: "Medium",
    caption: "Mixed angles",
    imageUrl: "/samples/humble-grape-medium.jpg",
  },
  {
    key: "hard",
    difficulty: "Hard",
    caption: "Cellar lighting",
    imageUrl: "/samples/humble-grape-hard.webp",
  },
];

export function SampleShelves({
  onPick,
  active,
  disabled,
  stage,
  onViewResults,
}: {
  onPick: (sample: Sample) => void;
  active?: Sample["key"] | null;
  disabled?: boolean;
  stage?: StatusStage | null;
  onViewResults?: () => void;
}) {
  const isRunning = stage === "detecting" || stage === "identifying";
  const isDone = stage === "done";
  const isError = stage === "error";

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-rule border border-rule">
        {SAMPLES.map((s) => {
          const isActive = active === s.key;
          const showOverlay = isActive && (isRunning || isDone || isError);

          return (
            <div key={s.key} className="relative bg-bone">
              <button
                onClick={() => onPick(s)}
                disabled={disabled}
                className={cn(
                  "group w-full text-left p-4 sm:p-5 transition-colors",
                  "hover:bg-ink/[0.03] disabled:opacity-60 disabled:cursor-not-allowed",
                  isActive && "bg-ink/[0.04]",
                  isActive && "ring-1 ring-inset ring-oxblood"
                )}
              >
                {/* Image — dims when overlay is shown */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-rule/40 border border-rule mb-3">
                  <Image
                    src={s.imageUrl}
                    alt={`${s.difficulty} sample shelf`}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className={cn(
                      "object-cover transition-all duration-500 group-hover:scale-[1.02]",
                      showOverlay && "opacity-25"
                    )}
                  />
                </div>

                {/* Card label row */}
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-[18px] tracking-tightish text-ink">
                    {s.difficulty}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    0{["easy", "medium", "hard"].indexOf(s.key) + 1}
                  </span>
                </div>

                {/* Caption row */}
                {isActive && isDone ? (
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-moss">
                    ✓ Complete
                  </div>
                ) : isActive && isError ? (
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-oxblood">
                    Error
                  </div>
                ) : (
                  <>
                    <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted mt-1">
                      {s.caption}
                    </div>
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-oxblood opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition-opacity duration-200">
                      Analyse shelf →
                    </div>
                  </>
                )}
              </button>

              {/* Pipeline overlay — sibling of button so PipelinePanel's nested <button> is valid */}
              {showOverlay && (
                <div className="absolute inset-0 pointer-events-none p-4 sm:p-5">
                  <div className="relative w-full aspect-[4/3] flex items-center justify-center">
                    <div className="pointer-events-auto">
                      <PipelinePanel stage={stage} onViewResults={onViewResults} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(isDone || isError) && active && onViewResults && (
        <button
          onClick={onViewResults}
          className="w-full mt-px py-3 bg-bone border border-rule font-mono text-[10px] uppercase tracking-[0.2em] text-muted hover:text-ink hover:border-ink transition-colors"
        >
          {isError ? "↓ View error" : "↓ Results ready"}
        </button>
      )}
    </div>
  );
}
