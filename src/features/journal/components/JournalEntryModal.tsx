import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import type { JournalEntry, JournalEntryCategory } from "../../../database/db";
import JournalCategorySelect from "./JournalCategorySelect";

type JournalEntryModalProps = {
  entry: JournalEntry | null;
  onClose: () => void;
  onSave: (entry: JournalEntry, patch: { title?: string; text: string; entryDate: string; category?: JournalEntryCategory; promptId?: string }) => Promise<void>;
  onDelete: (entry: JournalEntry) => Promise<void>;
};

export default function JournalEntryModal({
  entry,
  onClose,
  onSave,
  onDelete,
}: JournalEntryModalProps) {
  if (!entry) return null;

  return (
    <JournalEntryEditor
      key={entry.id ?? `${entry.entryDate}-${entry.createdAt}`}
      entry={entry}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}

type JournalEntryEditorProps = Omit<JournalEntryModalProps, "entry"> & {
  entry: JournalEntry;
};

function JournalEntryEditor({
  entry,
  onClose,
  onSave,
  onDelete,
}: JournalEntryEditorProps) {
  const [title, setTitle] = useState(entry.title ?? "");
  const [text, setText] = useState(entry.text);
  const [entryDate, setEntryDate] = useState(entry.entryDate);
  const [category, setCategory] = useState<JournalEntryCategory | undefined>(entry.category);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [entry, onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(entry, {
        title: title.trim() || undefined,
        text: text.trim(),
        entryDate,
        category,
        promptId: entry.promptId,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function copyEntryText() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
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
          <div className="journal-entry-category-field"><span>Category</span><JournalCategorySelect value={category} onChange={setCategory} /></div>
          <label className="journal-entry-modal-text"><span>Entry</span><textarea value={text} onChange={(event) => setText(event.target.value)} rows={13} /></label>
        </div>
        <footer>
          <button type="button" className={confirmingDelete ? "is-confirming" : ""} onClick={async () => {
            if (!confirmingDelete) { setConfirmingDelete(true); return; }
            await onDelete(entry);
            onClose();
          }}>{confirmingDelete ? "Confirm delete" : "Delete entry"}</button>
          <button type="button" onClick={copyEntryText}>{copied ? "✓ Copied" : "Copy text"}</button>
          <span />
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={!text.trim() || saving}>{saving ? "Saving…" : "Save changes"}</button>
        </footer>
      </form>
    </div>,
    target
  );
}
