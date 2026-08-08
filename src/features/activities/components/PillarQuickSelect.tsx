import { useEffect, useRef, useState } from "react";

import {
  homePillars,
  pillarThemes,
  type PillarKey,
} from "../../../app/theme";
import type { Pillar } from "../../../database/db";
import PillarIcon from "./PillarIcon";

import "./pillar-quick-select.css";

type PillarQuickSelectProps = {
  value: Pillar;
  onChange: (pillar: Pillar) => void | Promise<void>;
  iconOnly?: boolean;
  disabled?: boolean;
  label?: string;
};

const selectablePillars: PillarKey[] = ["core", ...homePillars];

export default function PillarQuickSelect({
  value,
  onChange,
  iconOnly = false,
  disabled = false,
  label,
}: PillarQuickSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const theme = pillarThemes[value as PillarKey];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`pillar-quick-select ${theme.className}`}>
      <button
        type="button"
        className={`pillar-quick-select-trigger ${iconOnly ? "is-icon-only" : ""}`}
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-expanded={open}
        aria-label={label ?? `Change pillar from ${theme.shortLabel}`}
      >
        <span className="pillar-quick-select-icon"><PillarIcon pillar={value as PillarKey} /></span>
        {!iconOnly && <span>{theme.shortLabel}</span>}
        {!iconOnly && <small>⌄</small>}
      </button>

      {open && (
        <div className="pillar-quick-select-menu" role="listbox" aria-label="Choose pillar">
          {selectablePillars.map((pillar) => {
            const option = pillarThemes[pillar];
            return (
              <button
                key={pillar}
                type="button"
                role="option"
                aria-selected={pillar === value}
                className={`${option.className} ${pillar === value ? "is-selected" : ""}`}
                onClick={async () => {
                  setOpen(false);
                  if (pillar !== value) await onChange(pillar);
                }}
              >
                <span><PillarIcon pillar={pillar} /></span>
                <strong>{option.shortLabel}</strong>
                {pillar === value && <small>✓</small>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
