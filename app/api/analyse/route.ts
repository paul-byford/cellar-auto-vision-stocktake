import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import type { ApiErrorBody, ApiErrorCode } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 65;

const TIMEOUT_MS = 60_000;

type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function inferMediaType(name: string, fallback: ImageMediaType = "image/jpeg"): ImageMediaType {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return fallback;
}

async function loadImageFromRequest(req: Request): Promise<{
  data: string;
  mediaType: ImageMediaType;
}> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      throw httpError("bad_image", "No image file uploaded");
    }
    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_BYTES) {
      throw httpError("bad_image", "Image too large — please use an image under 10 MB", 413);
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const mediaType = inferMediaType(
      file.name,
      (file.type as ImageMediaType) || "image/jpeg"
    );
    return { data: buf.toString("base64"), mediaType };
  }

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as { imageUrl?: string };
    if (!body.imageUrl || typeof body.imageUrl !== "string") {
      throw httpError("bad_image", "imageUrl missing");
    }
    // Only allow same-origin relative paths to prevent SSRF
    if (!body.imageUrl.startsWith("/")) {
      throw httpError("bad_image", "Invalid image URL", 400);
    }
    const url = new URL(body.imageUrl, req.url).toString();
    const resp = await fetch(url);
    if (!resp.ok) {
      throw httpError("bad_image", `Could not load sample image (${resp.status})`);
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    const mediaType = inferMediaType(
      body.imageUrl,
      (resp.headers.get("content-type") as ImageMediaType) || "image/jpeg"
    );
    return { data: buf.toString("base64"), mediaType };
  }

  throw httpError("bad_image", "Unsupported content type");
}

class HttpError extends Error {
  constructor(public code: ApiErrorCode, public userMessage: string, public status = 400) {
    super(userMessage);
  }
}

function httpError(code: ApiErrorCode, message: string, status = 400): HttpError {
  return new HttpError(code, message, status);
}

function errorBody(code: ApiErrorCode, message: string): ApiErrorBody {
  return { error: code, message };
}

export async function POST(req: Request) {
  try {
    const { data, mediaType } = await loadImageFromRequest(req);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let result;
    try {
      result = await runPipeline(
        { type: "base64", mediaType, data },
        0,
        0,
        controller.signal
      );
    } finally {
      clearTimeout(timer);
    }

    if (result.bottles.length === 0) {
      return NextResponse.json(
        errorBody(
          "no_bottles",
          "We couldn't see any bottles in this image. Try better lighting or a closer angle."
        ),
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return mapError(err);
  }
}

function mapError(err: unknown): NextResponse<ApiErrorBody> {
  if (err instanceof HttpError) {
    return NextResponse.json(errorBody(err.code, err.userMessage), {
      status: err.status,
    });
  }

  // AbortError from the timeout
  if (
    err instanceof Error &&
    (err.name === "AbortError" || /aborted/i.test(err.message))
  ) {
    return NextResponse.json(
      errorBody(
        "timeout",
        "The cellar's complicated — try a clearer photo."
      ),
      { status: 504 }
    );
  }

  // Anthropic rate-limit / quota
  const status = (err as { status?: number })?.status;
  if (status === 429) {
    return NextResponse.json(
      errorBody(
        "rate_limited",
        "Demo over capacity — try again in a minute."
      ),
      { status: 429 }
    );
  }

  // eslint-disable-next-line no-console
  console.error("[/api/analyse] error:", err);
  return NextResponse.json(
    errorBody("server_error", "Something broke on our end."),
    { status: 500 }
  );
}
