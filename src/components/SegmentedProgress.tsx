import type { CSSProperties } from "react";

import "./segmented-progress.css";

type SegmentedProgressProps = {
  value: number;
  segments?: number;
  label: string;
  className?: string;
};

export default function SegmentedProgress({
  value,
  segments = 10,
  label,
  className = "",
}: SegmentedProgressProps) {
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={`segmented-progress ${className}`.trim()}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      style={
        {
          "--segmented-progress-count": segments,
        } as CSSProperties
      }
    >
      {Array.from({ length: segments }, (_, index) => {
        const threshold = ((index + 1) / segments) * 100;

        return (
          <span
            key={index}
            className={safeValue >= threshold ? "is-complete" : ""}
          />
        );
      })}
    </div>
  );
}
