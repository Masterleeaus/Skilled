"use client";

import { useState } from "react";

interface BrandImageProps {
  /** Image paths to try in order. Empty or null entries are skipped. */
  sources: (string | null | undefined)[];
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * Plain <img> that moves to the next source when a file fails to load,
 * and renders nothing once every source has failed.
 */
export function BrandImage({ sources, alt, width, height, className }: BrandImageProps) {
  const candidates = sources.filter((s): s is string => !!s);
  const [index, setIndex] = useState(0);

  if (index >= candidates.length) return null;

  return (
    // A plain <img> is intentional: sources are tried in order on error, and next/image needs fixed
    // dimensions and loader config that would change this fallback behaviour.
    // eslint-disable-next-line @next/next/no-img-element -- see comment above
    <img
      src={candidates[index]}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      className={className}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
