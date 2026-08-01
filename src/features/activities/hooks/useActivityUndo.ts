import { useEffect, useRef, useState } from "react";

import useExperience from "../../../experience/useExperience";
import type { ActivityUndoNotice } from "../components/ActivityUndoToast";

export default function useActivityUndo() {
  const experience = useExperience();
  const [notice, setNotice] = useState<ActivityUndoNotice | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function dismiss() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setNotice(null);
  }

  function show(nextNotice: ActivityUndoNotice) {
    if (timer.current) window.clearTimeout(timer.current);

    setNotice(nextNotice);
    timer.current = window.setTimeout(() => {
      setNotice(null);
      timer.current = null;
    }, 6_000);
  }

  async function undo() {
    if (!notice) return;

    const action = notice.undo;
    dismiss();
    await action();
    experience.playFeedback("task-restored");
  }

  return {
    notice,
    show,
    dismiss,
    undo,
  };
}
