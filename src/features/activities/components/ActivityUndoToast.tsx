import { useState } from "react";
import { createPortal } from "react-dom";

export type ActivityUndoNotice = {
  message: string;
  undo: () => Promise<void>;
};

type ActivityUndoToastProps = {
  notice: ActivityUndoNotice | null;
  onDismiss: () => void;
  onUndo: () => Promise<void>;
};

export default function ActivityUndoToast({
  notice,
  onDismiss,
  onUndo,
}: ActivityUndoToastProps) {
  const [undoing, setUndoing] = useState(false);

  if (!notice) return null;

  async function handleUndo() {
    if (undoing) return;

    setUndoing(true);

    try {
      await onUndo();
    } finally {
      setUndoing(false);
    }
  }

  const portalTarget =
    document.querySelector(".experience-root") ?? document.body;

  return createPortal(
    <div className="activity-undo-toast" role="status" aria-live="polite">
      <span>{notice.message}</span>
      <button type="button" onClick={handleUndo} disabled={undoing}>
        {undoing ? "Restoring…" : "Undo"}
      </button>
      <button
        type="button"
        className="activity-undo-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>,
    portalTarget
  );
}
