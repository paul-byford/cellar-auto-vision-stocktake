"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

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
    imageUrl: "/samples/easy.jpg",
  },
  {
    key: "medium",
    difficulty: "Medium",
    caption: "Mixed angles",
    imageUrl: "/samples/medium.jpg",
  },
  {
    key: "hard",
    difficulty: "Hard",
    caption: "Cellar lighting",
    imageUrl: "/samples/hard.jpg",
  },
];

export function SampleShelves({
  onPick,
  active,
  disabled,
}: {
  onPick: (sample: Sample) => void;
  active?: Sample["key"] | null;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-rule border border-rule">
      {SAMPLES.map((s) => (
        <button
          key={s.key}
          onClick={() => onPick(s)}
          disabled={disabled}
          className={cn(
            "group relative bg-bone text-left p-4 sm:p-5 transition-colors",
            "hover:bg-ink/[0.03] disabled:opacity-60 disabled:cursor-not-allowed",
            active === s.key && "bg-ink/[0.04]"
          )}
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-rule/40 border border-rule mb-3">
            <Image
              src={s.imageUrl}
              alt={`${s.difficulty} sample shelf`}
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-[18px] tracking-tightish text-ink">
              {s.difficulty}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              0{["easy", "medium", "hard"].indexOf(s.key) + 1}
            </span>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted mt-1">
            {s.caption}
          </div>
        </button>
      ))}
    </div>
  );
}
