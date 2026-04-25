export type BBox = { x: number; y: number; w: number; h: number };

export type DetectedBottle = {
  id: string;
  positionDescription: string;
  bbox: BBox;
};

export type DetectionResult = {
  bottles: DetectedBottle[];
  totalCount: number;
  imageQualityNotes: string;
};

export type IdentifiedBottle = {
  bottleId: string;
  producer: string | null;
  wine: string | null;
  vintage: number | null;
  region: string | null;
  sizeMl: number;
  confidence: number;
  reasoning: string;
};

export type WineRow = {
  bottleIds: string[];
  producer: string | null;
  wine: string | null;
  vintage: number | null;
  region: string | null;
  sizeMl: number;
  count: number;
  confidence: number;
  reasoning: string;
  estimatedPriceGbp: number;
};

export type AnalysisResult = {
  bottles: { id: string; bbox: BBox }[];
  wines: WineRow[];
  imageQualityNotes: string;
  imageWidth: number;
  imageHeight: number;
};

export type ApiErrorCode =
  | "timeout"
  | "no_bottles"
  | "rate_limited"
  | "bad_image"
  | "server_error";

export type ApiErrorBody = {
  error: ApiErrorCode;
  message: string;
};
