"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

export function UploadZone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) onFile(file);
      }}
      className={cn(
        "border border-dashed transition-colors p-8 sm:p-12 text-center",
        dragging ? "border-oxblood bg-oxblood/[0.04]" : "border-rule",
        disabled && "opacity-60"
      )}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        Or
      </div>
      <div className="font-display text-[20px] sm:text-[22px] tracking-tightish mt-2">
        Drop a photo, or take one with your camera.
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="border border-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] hover:bg-ink hover:text-bone transition-colors disabled:opacity-60"
        >
          Upload a file
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={disabled}
          className="border border-rule px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink hover:border-ink transition-colors disabled:opacity-60"
        >
          Use camera
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
