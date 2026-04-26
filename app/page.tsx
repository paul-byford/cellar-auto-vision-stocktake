"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, RotateCcw } from "lucide-react";
import { GithubMark } from "@/components/icons";
import { HeroAnimation } from "@/components/hero-animation";
import { SAMPLES, SampleShelves, type Sample } from "@/components/sample-shelves";
import { UploadZone } from "@/components/upload-zone";
import { StatusLine, type StatusStage } from "@/components/status-line";
import { PipelinePanel } from "@/components/pipeline-panel";
import { SummaryStrip } from "@/components/summary-strip";
import { ResultsTable, exportCsv } from "@/components/results-table";
import { ErrorBanner, AllLowConfidenceBanner } from "@/components/error-states";
import type { AnalysisResult, ApiErrorBody, WineRow } from "@/lib/types";

const REPO_URL = "https://github.com/paul-byford/cellar-auto-vision-stocktake";

type LoadedImage = { src: string; label: string; sampleKey?: Sample["key"] };

export default function Page() {
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [stage, setStage] = useState<StatusStage>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [rows, setRows] = useState<WineRow[]>([]);
  const [error, setError] = useState<ApiErrorBody | null>(null);
  const [activeSample, setActiveSample] = useState<Sample["key"] | null>(null);

  const demoRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const reset = useCallback(() => {
    setLoaded(null);
    setStage("idle");
    setResult(null);
    setRows([]);
    setError(null);
    setActiveSample(null);
  }, []);

  const analyseSample = useCallback(async (sample: Sample) => {
    setError(null);
    setResult(null);
    setRows([]);
    setActiveSample(sample.key);
    setLoaded({
      src: sample.imageUrl,
      label: `${sample.difficulty} — ${sample.caption}`,
      sampleKey: sample.key,
    });
    setStage("detecting");
    try {
      const resp = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: sample.imageUrl }),
      });
      // Flip the status line to "identifying" once detection should be done.
      // The pipeline runs both passes server-side, so this is a UX cue, not a true milestone.
      setStage("identifying");
      if (!resp.ok) {
        const body = (await resp.json().catch(() => null)) as ApiErrorBody | null;
        setError(
          body ?? {
            error: "server_error",
            message: "Something broke",
          }
        );
        setStage("error");
        return;
      }
      const data = (await resp.json()) as AnalysisResult;
      setResult(data);
      setRows(data.wines);
      setStage("done");
    } catch (e) {
      console.error(e);
      setError({ error: "server_error", message: "Network error" });
      setStage("error");
    }
  }, []);

  const analyseFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setRows([]);
    setActiveSample(null);
    const objectUrl = URL.createObjectURL(file);
    setLoaded({ src: objectUrl, label: "Your photo" });
    setStage("detecting");
    try {
      const form = new FormData();
      form.append("image", file);
      const resp = await fetch("/api/analyse", {
        method: "POST",
        body: form,
      });
      setStage("identifying");
      if (!resp.ok) {
        const body = (await resp.json().catch(() => null)) as ApiErrorBody | null;
        setError(
          body ?? {
            error: "server_error",
            message: "Something broke",
          }
        );
        setStage("error");
        return;
      }
      const data = (await resp.json()) as AnalysisResult;
      setResult(data);
      setRows(data.wines);
      setStage("done");
    } catch (e) {
      console.error(e);
      setError({ error: "server_error", message: "Network error" });
      setStage("error");
    }
  }, []);

  const trySample = useCallback(() => {
    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const downloadCsv = useCallback(() => {
    const csv = exportCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cellar-stocktake.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  useEffect(() => {
    return () => {
      if (loaded?.src.startsWith("blob:")) URL.revokeObjectURL(loaded.src);
    };
  }, [loaded]);

  const allLow =
    rows.length > 0 && rows.every((r) => r.confidence < 70);

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="hairline-b">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[18px] tracking-tightish">
              Cellar
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted hidden sm:inline">
              Vision stock-take
            </span>
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink transition-colors"
          >
            <GithubMark className="h-3.5 w-3.5" />
            Source
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="hairline-b">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-oxblood mb-5">
              <span className="inline-block w-2 h-2 bg-oxblood rounded-full mr-2 align-middle" />
              <span className="align-middle">Vision pipeline · Live demo</span>
            </div>
            <h1 className="font-display text-[42px] sm:text-[56px] lg:text-[64px] leading-[0.96] tracking-tighter">
              Photograph the cellar.
              <br />
              <span className="text-muted">Read the inventory.</span>
            </h1>
            <p className="mt-6 max-w-[44ch] text-[15px] sm:text-[16px] text-muted">
              A vision pipeline for hospitality stock-take.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={trySample}
                className="bg-ink text-bone px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-oxblood transition-colors"
              >
                Try a sample
              </button>
              <button
                onClick={() => {
                  uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  fileInputRef.current?.click();
                }}
                className="border border-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-ink hover:text-bone transition-colors"
              >
                Upload your own
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    demoRef.current?.scrollIntoView({ behavior: "smooth" });
                    analyseFile(f);
                  }
                  e.currentTarget.value = "";
                }}
              />
            </div>
            <div className="mt-10 hairline-t pt-5 grid grid-cols-3 gap-4 max-w-[420px]">
              <Stat label="Passes" value="2" suffix="" />
              <Stat label="Model" value="Sonnet 4.5" />
              <Stat label="Median" value="12s" />
            </div>
          </div>
          <div className="lg:col-span-6">
            <HeroAnimation />
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section ref={demoRef} className="hairline-b">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
          <SectionLabel num="01" title="Pick a shelf" />
          <SampleShelves
            onPick={analyseSample}
            active={activeSample}
            disabled={stage === "detecting" || stage === "identifying"}
            stage={stage}
            onViewResults={scrollToResults}
          />
          <div ref={uploadRef} className="mt-8 relative">
            <UploadZone
              onFile={analyseFile}
              disabled={stage === "detecting" || stage === "identifying"}
            />
            {loaded && !activeSample && (stage === "detecting" || stage === "identifying" || stage === "done" || stage === "error") && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-bone/70">
                <div className="pointer-events-auto">
                  <PipelinePanel stage={stage} onViewResults={scrollToResults} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      {(loaded || error) && (
        <section ref={resultsRef} className="hairline-b">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
            <SectionLabel num="02" title="Inventory" />

            {loaded && (
              <div className="mb-6 flex items-baseline justify-between gap-4 flex-wrap">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {loaded.label}
                </div>
                <StatusLine stage={stage} />
              </div>
            )}

            {error && (
              <div className="mb-6">
                <ErrorBanner code={error.error} onDismiss={reset} />
              </div>
            )}

            {stage === "done" && rows.length > 0 && loaded && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <SummaryStrip
                  wines={rows}
                  imageSrc={loaded.src}
                  imageLabel={loaded.label}
                  unoptimized={loaded.src.startsWith("blob:")}
                />

                {allLow && <AllLowConfidenceBanner />}

                {result?.narrative && (
                  <div className="border border-rule bg-bone px-6 py-5 sm:px-8 sm:py-6">
                    <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted mb-3">
                      Analysis notes
                    </div>
                    <p className="text-[15px] sm:text-[16px] text-ink leading-relaxed">
                      {result.narrative}
                    </p>
                  </div>
                )}

                <ResultsTable
                  rows={rows}
                  onChange={setRows}
                />

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={downloadCsv}
                    className="inline-flex items-center gap-2 border border-ink px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] hover:bg-ink hover:text-bone transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 border border-rule px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink hover:border-ink transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Try another shelf
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="mt-auto">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-8 flex items-baseline justify-between gap-4 flex-wrap">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Paul Byford — built for Humble Group
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted hover:text-ink transition-colors"
          >
            <GithubMark className="h-3 w-3" />
            paul-byford / cellar-auto-vision-stocktake
          </a>
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-6 hairline-b pb-3">
      <span className="font-mono text-[11px] tnum text-muted">{num}</span>
      <span className="font-display text-[20px] sm:text-[22px] tracking-tightish">
        {title}
      </span>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
      <div className="font-display tnum text-[20px] tracking-tightish">
        {value}
        {suffix}
      </div>
    </div>
  );
}

