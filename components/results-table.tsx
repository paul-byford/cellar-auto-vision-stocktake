"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, AlertTriangle, Flag, PencilLine } from "lucide-react";
import { useState } from "react";
import type { WineRow } from "@/lib/types";
import { formatGbp } from "@/lib/wine-prices";
import { cn } from "@/lib/cn";

type Props = {
  rows: WineRow[];
  onChange: (rows: WineRow[]) => void;
  onHoverRow?: (bottleIds: string[] | null) => void;
};

function ConfidenceCell({ row }: { row: WineRow }) {
  if (row.confidence >= 85) {
    return (
      <span
        title={`${row.confidence} — ${row.reasoning}`}
        className="inline-flex items-center gap-2"
      >
        <Check className="h-4 w-4 text-moss" strokeWidth={2.25} />
        <span className="font-mono text-[11px] tnum text-muted">
          {row.confidence}
        </span>
      </span>
    );
  }
  if (row.confidence >= 70) {
    return (
      <span className="inline-flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber" strokeWidth={2} />
        <span className="font-mono text-[11px] uppercase tracking-wider text-amber">
          {row.reasoning || "Review"}
        </span>
        <span className="font-mono text-[11px] tnum text-muted">
          {row.confidence}
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <Flag className="h-4 w-4 text-oxblood" strokeWidth={2} />
      <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border border-oxblood text-oxblood">
        Review
      </span>
      <span className="font-mono text-[11px] tnum text-muted">
        {row.confidence}
      </span>
    </span>
  );
}

function EditableCell({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <span
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange(e.currentTarget.textContent ?? "")}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
      className={cn(
        "block min-w-[2ch] cursor-text px-1 -mx-1",
        "border-b border-dashed border-transparent",
        "hover:border-rule transition-colors duration-150",
        "focus:border-oxblood focus:outline-none",
        !value && "text-muted/60",
        className
      )}
      data-placeholder={placeholder}
    >
      {value || placeholder || ""}
    </span>
  );
}

export function ResultsTable({ rows, onChange, onHoverRow }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const updateRow = (i: number, patch: Partial<WineRow>) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next);
  };

  return (
    <div className="border border-rule bg-bone overflow-hidden">
      <div className="px-4 py-2 hairline-b flex items-center gap-1.5">
        <PencilLine className="h-3 w-3 text-muted shrink-0" strokeWidth={1.75} />
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
          Tap producer, wine or vintage to edit
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="hairline-b">
              <th className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted px-4 py-3 font-normal">
                Producer
              </th>
              <th className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted px-4 py-3 font-normal">
                Wine
              </th>
              <th className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted px-4 py-3 font-normal">
                Vintage
              </th>
              <th className="text-right font-mono text-[10px] uppercase tracking-[0.18em] text-muted px-4 py-3 font-normal">
                Count
              </th>
              <th className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted px-4 py-3 font-normal">
                Confidence
              </th>
              <th className="text-right font-mono text-[10px] uppercase tracking-[0.18em] text-muted px-4 py-3 font-normal">
                Est. value
              </th>
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
          >
            <AnimatePresence initial={false}>
              {rows.map((row, i) => {
                const flagged = row.confidence < 70;
                return (
                  <motion.tr
                    key={row.bottleIds.join("-") + i}
                    variants={{
                      hidden: { opacity: 0, y: 4 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    onMouseEnter={() => {
                      setHoverIdx(i);
                      onHoverRow?.(row.bottleIds);
                    }}
                    onMouseLeave={() => {
                      setHoverIdx(null);
                      onHoverRow?.(null);
                    }}
                    className={cn(
                      "hairline-b transition-colors",
                      flagged && "bg-oxblood/[0.04]",
                      hoverIdx === i && "bg-ink/[0.03]"
                    )}
                  >
                    <td className="px-4 py-3 align-top">
                      <EditableCell
                        value={row.producer ?? ""}
                        placeholder="Unknown"
                        className="font-display text-[15px] tracking-tightish"
                        onChange={(v) =>
                          updateRow(i, { producer: v || null })
                        }
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <EditableCell
                        value={row.wine ?? ""}
                        placeholder="Unknown"
                        className="text-[14px]"
                        onChange={(v) => updateRow(i, { wine: v || null })}
                      />
                      {row.region ? (
                        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted mt-0.5">
                          {row.region}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top font-mono tnum text-[13px]">
                      <EditableCell
                        value={row.vintage?.toString() ?? ""}
                        placeholder="—"
                        onChange={(v) => {
                          const n = parseInt(v, 10);
                          updateRow(i, {
                            vintage: Number.isFinite(n) ? n : null,
                          });
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 align-top text-right font-mono tnum text-[14px]">
                      {row.count}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ConfidenceCell row={row} />
                    </td>
                    <td className="px-4 py-3 align-top text-right font-mono tnum text-[13px]">
                      {formatGbp(row.estimatedPriceGbp * row.count)}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}

export function exportCsv(rows: WineRow[]): string {
  const header = [
    "Producer",
    "Wine",
    "Vintage",
    "Region",
    "Size (ml)",
    "Count",
    "Confidence",
    "Notes",
    "Estimated unit price (GBP)",
    "Estimated line value (GBP)",
  ];
  const escape = (s: string) =>
    /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        escape(r.producer ?? ""),
        escape(r.wine ?? ""),
        r.vintage?.toString() ?? "",
        escape(r.region ?? ""),
        r.sizeMl.toString(),
        r.count.toString(),
        r.confidence.toString(),
        escape(r.reasoning),
        r.estimatedPriceGbp.toFixed(2),
        (r.estimatedPriceGbp * r.count).toFixed(2),
      ].join(",")
    );
  }
  return lines.join("\n");
}
