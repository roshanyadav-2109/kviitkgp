"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Official Kendriya Vidyalaya Sangathan emblem (public/brand/kv-logo.png).
// Falls back to a typographic monogram if the asset is missing.
export function KVEmblem({ size = 40, className }: { size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/kv-logo.png"
        alt="Kendriya Vidyalaya emblem"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={cn("object-contain", className)}
      />
    );
  }
  return (
    <div
      aria-label="KV emblem placeholder"
      title="Official KV emblem slot"
      style={{ width: size, height: size }}
      className={cn(
        "flex items-center justify-center rounded-md border border-gold-500/50 bg-gold-100 text-gold-700",
        className,
      )}
    >
      <span className="font-bold tracking-tight" style={{ fontSize: size * 0.42 }}>
        KV
      </span>
    </div>
  );
}

export function BrandLockup({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <KVEmblem size={40} />
      <div className="leading-tight">
        <div className="text-[15px] font-bold text-ink-900">Kendriya Vidyalaya No 1</div>
        <div className="text-[12px] text-ink-500">{subtitle ?? "IIT Kharagpur"}</div>
      </div>
    </div>
  );
}
