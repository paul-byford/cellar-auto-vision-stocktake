import type Anthropic from "@anthropic-ai/sdk";
import type {
  AnalysisResult,
  DetectedBottle,
  DetectionResult,
  IdentifiedBottle,
  WineRow,
} from "./types";
import { getAnthropic, VISION_MODEL } from "./anthropic";
import { DETECTION_SYSTEM, IDENTIFICATION_SYSTEM, NARRATIVE_SYSTEM } from "./prompts";
import { priceFor } from "./wine-prices";

type ImageInput = {
  type: "base64";
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  data: string;
};

/** Pull the first balanced JSON object from a string. */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  // Strip markdown fences if model wrapped it
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : trimmed;

  const start = body.indexOf("{");
  if (start < 0) throw new Error("No JSON object found in model output");
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < body.length; i++) {
    const ch = body[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const slice = body.slice(start, i + 1);
        return JSON.parse(slice);
      }
    }
  }
  throw new Error("Unbalanced JSON in model output");
}

function clamp01(n: number): number {
  if (typeof n !== "number" || !isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function normaliseDetection(parsed: unknown): DetectionResult {
  const obj = parsed as {
    bottles?: Array<{
      id?: unknown;
      position_description?: unknown;
      bbox_normalised?: { x?: unknown; y?: unknown; w?: unknown; h?: unknown };
    }>;
    total_count?: unknown;
    image_quality_notes?: unknown;
  };
  const bottles: DetectedBottle[] = (obj.bottles ?? [])
    .map((b, i) => {
      const bb = b.bbox_normalised ?? {};
      const id =
        typeof b.id === "string" && b.id.length > 0 ? b.id : `bottle_${i + 1}`;
      return {
        id,
        positionDescription:
          typeof b.position_description === "string"
            ? b.position_description
            : "",
        bbox: {
          x: clamp01(Number(bb.x)),
          y: clamp01(Number(bb.y)),
          w: clamp01(Number(bb.w)),
          h: clamp01(Number(bb.h)),
        },
      };
    })
    .filter((b) => b.bbox.w > 0 && b.bbox.h > 0);
  return {
    bottles,
    totalCount:
      typeof obj.total_count === "number" ? obj.total_count : bottles.length,
    imageQualityNotes:
      typeof obj.image_quality_notes === "string" ? obj.image_quality_notes : "",
  };
}

function normaliseIdentification(parsed: unknown): IdentifiedBottle[] {
  const obj = parsed as {
    wines?: Array<{
      bottle_id?: unknown;
      producer?: unknown;
      wine?: unknown;
      vintage?: unknown;
      region?: unknown;
      size_ml?: unknown;
      confidence_0_100?: unknown;
      reasoning?: unknown;
    }>;
  };
  return (obj.wines ?? []).map((w, i) => ({
    bottleId:
      typeof w.bottle_id === "string" && w.bottle_id.length > 0
        ? w.bottle_id
        : `bottle_${i + 1}`,
    producer: typeof w.producer === "string" ? w.producer : null,
    wine: typeof w.wine === "string" ? w.wine : null,
    vintage:
      typeof w.vintage === "number" && w.vintage > 1800 && w.vintage < 2100
        ? Math.round(w.vintage)
        : null,
    region: typeof w.region === "string" ? w.region : null,
    sizeMl: typeof w.size_ml === "number" ? w.size_ml : 750,
    confidence:
      typeof w.confidence_0_100 === "number"
        ? Math.max(0, Math.min(100, Math.round(w.confidence_0_100)))
        : 0,
    reasoning: typeof w.reasoning === "string" ? w.reasoning : "",
  }));
}

export async function runDetection(
  image: ImageInput,
  signal?: AbortSignal
): Promise<DetectionResult> {
  const client = getAnthropic();
  const resp = await client.messages.create(
    {
      model: VISION_MODEL,
      max_tokens: 2000,
      system: DETECTION_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.mediaType,
                data: image.data,
              },
            },
            {
              type: "text",
              text: "Detect all wine bottles in this image and return their positions as JSON only.",
            },
          ],
        },
      ],
    },
    { signal }
  );
  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const parsed = extractJson(text);
  return normaliseDetection(parsed);
}

export async function runIdentification(
  image: ImageInput,
  bottles: DetectedBottle[],
  signal?: AbortSignal
): Promise<IdentifiedBottle[]> {
  if (bottles.length === 0) return [];
  const client = getAnthropic();
  const positionList = bottles
    .map(
      (b) =>
        `- ${b.id}: ${b.positionDescription || "no description"} (bbox x=${b.bbox.x.toFixed(3)}, y=${b.bbox.y.toFixed(3)}, w=${b.bbox.w.toFixed(3)}, h=${b.bbox.h.toFixed(3)})`
    )
    .join("\n");

  const resp = await client.messages.create(
    {
      model: VISION_MODEL,
      max_tokens: 4000,
      system: IDENTIFICATION_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.mediaType,
                data: image.data,
              },
            },
            {
              type: "text",
              text: `The previous pass detected ${bottles.length} bottles at these positions:\n\n${positionList}\n\nFor each bottle id above, identify what you can see on the label and return JSON only matching the schema in your instructions. Include exactly one entry per bottle id, in the same order.`,
            },
          ],
        },
      ],
    },
    { signal }
  );
  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const parsed = extractJson(text);
  return normaliseIdentification(parsed);
}

/** Group identical wines, retaining bottle ids for hover highlighting. */
export function aggregate(
  detection: DetectionResult,
  identified: IdentifiedBottle[]
): WineRow[] {
  const byBottleId = new Map(identified.map((w) => [w.bottleId, w]));
  const groups = new Map<string, WineRow>();

  for (const bottle of detection.bottles) {
    const ident = byBottleId.get(bottle.id);
    if (!ident) continue;
    const groupKey = [
      (ident.producer ?? "").toLowerCase().trim(),
      (ident.wine ?? "").toLowerCase().trim(),
      ident.vintage ?? "",
      ident.sizeMl,
    ].join("|");

    const existing = groups.get(groupKey);
    if (existing) {
      existing.bottleIds.push(bottle.id);
      existing.count += 1;
      // Keep the lowest confidence — conservative for review flagging
      existing.confidence = Math.min(existing.confidence, ident.confidence);
      // Keep first non-empty reasoning
      if (!existing.reasoning && ident.reasoning) {
        existing.reasoning = ident.reasoning;
      }
    } else {
      const row: WineRow = {
        bottleIds: [bottle.id],
        producer: ident.producer,
        wine: ident.wine,
        vintage: ident.vintage,
        region: ident.region,
        sizeMl: ident.sizeMl,
        count: 1,
        confidence: ident.confidence,
        reasoning: ident.reasoning,
        estimatedPriceGbp: 0,
      };
      groups.set(groupKey, row);
    }
  }

  const rows = Array.from(groups.values());
  for (const r of rows) {
    r.estimatedPriceGbp = priceFor({
      producer: r.producer,
      wine: r.wine,
      sizeMl: r.sizeMl,
    });
  }
  // Sort: high-confidence first, then by count desc
  rows.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.count - a.count;
  });
  return rows;
}

const NARRATIVE_MODEL = "claude-haiku-4-5-20251001";

async function runNarrative(
  detection: DetectionResult,
  wines: WineRow[],
  signal?: AbortSignal
): Promise<string> {
  try {
    const client = getAnthropic();
    const context = {
      bottles_detected: detection.totalCount,
      image_quality_notes: detection.imageQualityNotes,
      unique_wines: wines.length,
      total_bottle_count: wines.reduce((s, w) => s + w.count, 0),
      low_confidence_count: wines.filter((w) => w.confidence < 70).length,
      wines: wines.map((w) => ({
        producer: w.producer,
        wine: w.wine,
        vintage: w.vintage,
        count: w.count,
        confidence: w.confidence,
        reasoning: w.reasoning,
      })),
    };
    const resp = await client.messages.create(
      {
        model: NARRATIVE_MODEL,
        max_tokens: 250,
        system: NARRATIVE_SYSTEM,
        messages: [
          {
            role: "user",
            content: `Results:\n\n${JSON.stringify(context, null, 2)}`,
          },
        ],
      },
      { signal }
    );
    return resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();
  } catch {
    return "";
  }
}

export async function runPipeline(
  image: ImageInput,
  imageWidth: number,
  imageHeight: number,
  signal?: AbortSignal
): Promise<AnalysisResult> {
  const detection = await runDetection(image, signal);
  const identified = await runIdentification(image, detection.bottles, signal);
  const wines = aggregate(detection, identified);
  const narrative = await runNarrative(detection, wines, signal);
  return {
    bottles: detection.bottles.map((b) => ({ id: b.id, bbox: b.bbox })),
    wines,
    imageQualityNotes: detection.imageQualityNotes,
    narrative,
    imageWidth,
    imageHeight,
  };
}

