import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const theme = pillarThemes[value as PillarKey];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) setOpen(false);
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

  useLayoutEffect(() => {
    if (!open) return;

    function positionMenu() {
      const trigger = rootRef.current?.getBoundingClientRect();
      if (!trigger) return;
      const menuWidth = 174;
      const estimatedMenuHeight = 230;
      const spaceBelow = window.innerHeight - trigger.bottom;
      setMenuPosition({
        left: Math.min(
          Math.max(8, trigger.left),
          window.innerWidth - menuWidth - 8
        ),
        top: spaceBelow >= estimatedMenuHeight + 8
          ? trigger.bottom + 6
          : Math.max(8, trigger.top - estimatedMenuHeight - 6),
      });
    }

    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
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

      {open && createPortal(
        <div
          ref={menuRef}
          className="pillar-quick-select-menu pillar-quick-select-floating-menu"
          role="listbox"
          aria-label="Choose pillar"
          style={menuPosition}
        >
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
        </div>,
        document.body
      )}
    </div>
  );
}
