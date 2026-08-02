import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import type { JournalEntry } from "../../../database/db";

type JournalEntryModalProps = {
  entry: JournalEntry | null;
  onClose: () => void;
  onSave: (entry: JournalEntry, patch: { title?: string; text: string; entryDate: string }) => Promise<void>;
  onDelete: (entry: JournalEntry) => Promise<void>;
};

export default function JournalEntryModal({
  entry,
  onClose,
  onSave,
  onDelete,
}: JournalEntryModalProps) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [text, setText] = useState(entry?.text ?? "");
  const [entryDate, setEntryDate] = useState(entry?.entryDate ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!entry) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [entry, onClose]);

  if (!entry) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!entry || !text.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(entry, {
        title: title.trim() || undefined,
        text: text.trim(),
        entryDate,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const target = document.querySelector(".experience-root") ?? document.body;

  return createPortal(
    <div className="journal-modal-layer">
      <button type="button" className="journal-modal-backdrop" onClick={onClose} aria-label="Close journal entry" />
      <form className="journal-entry-modal" onSubmit={handleSubmit}>
        <header>
          <div><span className="text-label">Journal entry</span><h2>Edit this page</h2></div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="journal-entry-modal-body">
          <label><span>Date</span><input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} /></label>
          <label><span>Optional title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give this memory a name" /></label>
          <label className="journal-entry-modal-text"><span>Entry</span><textarea value={text} onChange={(event) => setText(event.target.value)} rows={13} /></label>
        </div>
        <footer>
          <button type="button" className={confirmingDelete ? "is-confirming" : ""} onClick={async () => {
            if (!confirmingDelete) { setConfirmingDelete(true); return; }
            await onDelete(entry);
            onClose();
          }}>{confirmingDelete ? "Confirm delete" : "Delete entry"}</button>
          <span />
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={!text.trim() || saving}>{saving ? "Saving…" : "Save changes"}</button>
        </footer>
      </form>
    </div>,
    target
  );
}
