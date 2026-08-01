type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  className?: string;
};

export default function ProgressBar({
  value,
  max = 100,
  label,
  className = "",
}: ProgressBarProps) {
  const safeValue = Math.min(Math.max(value, 0), max);

  return (
    <div className={`progress ${className}`.trim()}>
      {label && <span className="sr-only">{label}</span>}

      <progress
        className="progress-element"
        value={safeValue}
        max={max}
        aria-label={label}
      />
    </div>
  );
}