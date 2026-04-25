#!/usr/bin/env tsx
/**
 * Local pipeline test. Reads an image from disk, runs both passes, prints results.
 *
 *   ANTHROPIC_API_KEY=... npx tsx scripts/test-pipeline.ts ./path/to/shelf.jpg
 */
import fs from "node:fs";
import path from "node:path";
import { runPipeline } from "../lib/pipeline";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: tsx scripts/test-pipeline.ts <image-path>");
    process.exit(1);
  }
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }
  const ext = path.extname(abs).toLowerCase();
  const mediaType =
    ext === ".png"
      ? ("image/png" as const)
      : ext === ".webp"
        ? ("image/webp" as const)
        : ext === ".gif"
          ? ("image/gif" as const)
          : ("image/jpeg" as const);
  const data = fs.readFileSync(abs).toString("base64");

  console.log(`Running pipeline on ${abs} (${mediaType}, ${data.length} b64 chars)…`);
  const start = Date.now();
  const result = await runPipeline({ type: "base64", mediaType, data }, 0, 0);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\nDone in ${elapsed}s. ${result.bottles.length} bottles, ${result.wines.length} unique wines.`);
  console.log(`Image quality: ${result.imageQualityNotes}\n`);
  for (const w of result.wines) {
    const flag = w.confidence >= 85 ? "✓" : w.confidence >= 70 ? "?" : "!";
    console.log(
      `  ${flag} [${String(w.confidence).padStart(3)}] ${w.count}× ${w.producer ?? "?"} — ${w.wine ?? "?"} ${w.vintage ?? ""}  £${w.estimatedPriceGbp}  (${w.reasoning})`
    );
  }
}

main().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
