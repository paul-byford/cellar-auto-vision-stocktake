"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import type { ApiErrorCode } from "@/lib/types";

const REPO_URL = "https://github.com/paul-byford/cellar-auto-vision-stocktake";

const COPY: Record<ApiErrorCode, { title: string; body: string }> = {
  timeout: {
    title: "Analysis timed out",
    body: "Your image took longer than 60 seconds to process. Shelves with fewer bottles and good front-facing lighting analyse fastest — or try one of the sample shelves below.",
  },
  no_bottles: {
    title: "We couldn't see any bottles",
    body: "Try better lighting or a closer angle. The samples below are a good starting point.",
  },
  rate_limited: {
    title: "Demo over capacity",
    body: "Try again in a minute. Or run it locally with your own API key — repo link below.",
  },
  bad_image: {
    title: "Couldn't read that image",
    body: "Make sure it's a JPG, PNG, or WebP under a few megabytes.",
  },
  server_error: {
    title: "Something went wrong",
    body: "An unexpected error occurred on our end — please try again. If it keeps happening, the samples below are a good way to check the demo is working.",
  },
};

export function ErrorBanner({
  code,
  onDismiss,
}: {
  code: ApiErrorCode;
  onDismiss?: () => void;
}) {
  const c = COPY[code];
  return (
    <div className="border border-oxblood bg-oxblood/[0.05] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="h-5 w-5 text-oxblood mt-0.5 flex-shrink-0"
          strokeWidth={2}
        />
        <div className="flex-1 min-w-0">
          <div className="font-display text-[18px] tracking-tightish text-ink">
            {c.title}
          </div>
          <div className="text-[14px] text-muted mt-1">{c.body}</div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink hover:text-oxblood transition-colors"
            >
              Repo on GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
            {onDismiss ? (
              <button
                onClick={onDismiss}
                className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink"
              >
                Dismiss
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AllLowConfidenceBanner() {
  return (
    <div className="border border-amber/60 bg-amber/[0.06] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber mt-0.5 flex-shrink-0" strokeWidth={2} />
        <div className="flex-1">
          <div className="font-display text-[16px] tracking-tightish text-ink">
            This was a hard image — every row is flagged for review.
          </div>
          <div className="text-[13px] text-muted mt-1">
            That&apos;s the system working correctly, not failing. Edit any cell
            inline to correct it.
          </div>
        </div>
      </div>
    </div>
  );
}
