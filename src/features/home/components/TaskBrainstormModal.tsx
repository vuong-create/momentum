import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import {
  parseBrainstormTasks,
  taskBrainstormPrompts,
} from "../services/taskBrainstormService";

type TaskBrainstormModalProps = {
  open: boolean;
  onClose: () => void;
  onAddTasks: (tasks: string[]) => Promise<void>;
};

export default function TaskBrainstormModal({
  open,
  onClose,
  onAddTasks,
}: TaskBrainstormModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const tasks = useMemo(() => parseBrainstormTasks(draft), [draft]);

  useEffect(() => {
    if (!open) return;
    textareaRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (tasks.length === 0 || adding) return;
    setAdding(true);
    try {
      await onAddTasks(tasks);
      setDraft("");
      onClose();
    } finally {
      setAdding(false);
    }
  }

  const target = document.querySelector(".experience-root") ?? document.body;

  return createPortal(
    <div className="task-brainstorm-layer">
      <button
        type="button"
        className="task-brainstorm-backdrop"
        onClick={onClose}
        aria-label="Close brainstorm"
      />
      <form className="task-brainstorm-modal" onSubmit={handleSubmit}>
        <header>
          <div>
            <span className="text-label">Clear some space</span>
            <h2 className="font-pixel">Brainstorm</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="task-brainstorm-body">
          <div className="task-brainstorm-prompt">
            <span>Prompt</span>
            <p>{taskBrainstormPrompts[promptIndex]}</p>
            <button
              type="button"
              onClick={() => setPromptIndex((current) => (current + 1) % taskBrainstormPrompts.length)}
            >
              Another prompt →
            </button>
          </div>

          <label>
            <span>One idea per line</span>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={9}
              placeholder={"Call the dentist\nPlan Sunday meal prep\nReview this month’s spending"}
              aria-label="Brainstorm task ideas"
            />
          </label>
        </div>

        <footer>
          <span>{tasks.length === 0 ? "Nothing is committed yet." : `${tasks.length} ${tasks.length === 1 ? "idea" : "ideas"} ready`}</span>
          <button type="button" onClick={onClose}>Keep for later</button>
          <button type="submit" disabled={tasks.length === 0 || adding}>
            {adding ? "Adding…" : `Add ${tasks.length || ""} to Today`}
          </button>
        </footer>
      </form>
    </div>,
    target
  );
}
