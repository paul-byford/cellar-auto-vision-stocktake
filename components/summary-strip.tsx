"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { WineRow } from "@/lib/types";
import { formatGbp } from "@/lib/wine-prices";

function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
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
    <div className="flex flex-col gap-2 p-5 md:p-7 flex-1">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
      <div
        className={
          "font-display tnum text-[2.25rem] md:text-[3rem] leading-none tracking-tighter " +
          (emphasise ? "text-oxblood" : "text-ink")
        }
      >
        {format(animated)}
      </div>
      {caption && (
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {caption}
        </div>
      )}
    </div>
  );
}

function Lightbox({
  src,
  label,
  onClose,
}: {
  src: string;
  label: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/75 p-6 sm:p-10"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={label}
          className="max-h-[85vh] max-w-full w-auto mx-auto block"
        />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-bone border border-rule px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink hover:bg-ink hover:text-bone transition-colors"
        >
          Close ×
        </button>
      </div>
    </div>
  );
}

export function SummaryStrip({
  wines,
  imageSrc,
  imageLabel,
  unoptimized = false,
}: {
  wines: WineRow[];
  imageSrc: string;
  imageLabel: string;
  unoptimized?: boolean;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const totalBottles = wines.reduce((s, w) => s + w.count, 0);
  const totalValue = wines.reduce(
    (s, w) => s + w.estimatedPriceGbp * w.count,
    0
  );
  const needsReview = wines.filter((w) => w.confidence < 70).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border border-rule bg-bone"
      >
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-rule">
          {/* Thumbnail — full-width on mobile/tablet, fixed-width column on desktop */}
          <button
            onClick={() => setLightboxOpen(true)}
            aria-label="View full image"
            className="group relative overflow-hidden lg:w-56 xl:w-64 shrink-0"
          >
            <div className="relative w-full aspect-[16/9] lg:aspect-auto lg:h-full min-h-[140px]">
              <Image
                src={imageSrc}
                alt={imageLabel}
                fill
                sizes="(max-width: 1024px) 100vw, 256px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                unoptimized={unoptimized}
              />
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-200 flex items-center justify-center">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-ink/60 px-2 py-1">
                  View full ↗
                </span>
              </div>
            </div>
          </button>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-rule lg:flex-1">
            <Figure
              label="Bottles identified"
              value={totalBottles}
              format={(n) => Math.round(n).toString()}
            />
            <Figure
              label="Estimated cellar value"
              value={totalValue}
              format={(n) => formatGbp(n)}
              caption="Indicative retail value"
            />
            <Figure
              label="Needs review"
              value={needsReview}
              format={(n) => Math.round(n).toString()}
              emphasise={needsReview > 0}
            />
          </div>
        </div>
      </motion.div>

      {lightboxOpen && (
        <Lightbox
          src={imageSrc}
          label={imageLabel}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
