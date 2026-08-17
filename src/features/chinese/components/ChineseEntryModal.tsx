import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import type { ChineseEntry, ChineseEntryType } from "../../../database/db";
import type { ChineseEntryInput } from "../services/chineseEntryService";
import { generatePinyin } from "../services/pinyinService";
import { speakTraditionalChinese } from "../services/pronunciationService";
import { translateTraditionalToEnglish } from "../services/translationService";

type ChineseEntryModalProps = {
  entry: ChineseEntry | null;
  onClose: () => void;
  onSave: (input: ChineseEntryInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export default function ChineseEntryModal({
  entry,
  onClose,
  onSave,
  onDelete,
}: ChineseEntryModalProps) {
  const [traditional, setTraditional] = useState(entry?.traditional ?? "");
  const [pinyin, setPinyin] = useState(entry?.pinyin ?? "");
  const [pinyinEdited, setPinyinEdited] = useState(Boolean(entry?.pinyin));
  const [meaning, setMeaning] = useState(entry?.meaning ?? "");
  const [entryType, setEntryType] = useState<ChineseEntryType>(entry?.entryType ?? "word");
  const [source, setSource] = useState(entry?.source ?? "");
  const [tags, setTags] = useState(entry?.tags.join(", ") ?? "");
  const [collections, setCollections] = useState(entry?.collections?.join(", ") ?? "");
  const [favorite, setFavorite] = useState(Boolean(entry?.favorite));
  const [example, setExample] = useState(entry?.example ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translationNotice, setTranslationNotice] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!traditional.trim() || !meaning.trim() || saving) return;

    setSaving(true);
    try {
      await onSave({
        traditional,
        pinyin,
        meaning,
        entryType,
        source,
        tags: tags.split(","),
        collections: collections.split(","),
        favorite,
        example,
        notes,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleTranslate() {
    if (!traditional.trim() || translating) return;
    setTranslating(true);
    setTranslationNotice("");
    try {
      const result = await translateTraditionalToEnglish(traditional);
      if (result.status === "translated") {
        setMeaning(result.text);
        setTranslationNotice("Draft added. Review it before saving.");
      } else {
        setTranslationNotice(result.reason);
      }
    } finally {
      setTranslating(false);
    }
  }

  const target = document.querySelector(".experience-root") ?? document.body;

  return createPortal(
    <div className="chinese-modal-layer">
      <button type="button" className="chinese-modal-backdrop" onClick={onClose} aria-label="Close Chinese entry" />
      <form
        className="chinese-entry-modal"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chinese-entry-modal-title"
      >
        <header>
          <div>
            <span className="text-label">{entry ? "Language entry" : "Add to your collection"}</span>
            <h2 id="chinese-entry-modal-title">{entry ? "Edit this phrase" : "Keep something useful"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="chinese-entry-modal-body">
          <label className="chinese-entry-traditional-field">
            <span>Traditional Chinese</span>
            <div>
              <input
                autoFocus
                value={traditional}
                onChange={(event) => {
                  const value = event.target.value;
                  setTraditional(value);
                  if (!pinyinEdited) setPinyin(generatePinyin(value));
                }}
                placeholder="例如：隨便"
              />
              <button type="button" onClick={() => speakTraditionalChinese(traditional)} disabled={!traditional.trim()} aria-label="Hear pronunciation">♪</button>
            </div>
          </label>

          <label className="chinese-entry-meaning-field">
            <span>Meaning · reviewed before save</span>
            <div><input value={meaning} onChange={(event) => setMeaning(event.target.value)} placeholder="whatever / as you like" /><button type="button" onClick={handleTranslate} disabled={!traditional.trim() || translating}>{translating ? "Translating…" : "Translate"}</button></div>
            {translationNotice && <small>{translationNotice}</small>}
          </label>

          <label>
            <span>Pinyin · generated, but editable</span>
            <input value={pinyin} onChange={(event) => { setPinyin(event.target.value); setPinyinEdited(true); }} placeholder="suí biàn" />
          </label>

          <fieldset className="chinese-entry-type-field">
            <legend>Type</legend>
            <button type="button" className={entryType === "word" ? "is-selected" : ""} onClick={() => setEntryType("word")}>Word</button>
            <button type="button" className={entryType === "phrase" ? "is-selected" : ""} onClick={() => setEntryType("phrase")}>Phrase</button>
            <button type="button" className={favorite ? "is-selected chinese-entry-favorite-toggle" : "chinese-entry-favorite-toggle"} onClick={() => setFavorite((current) => !current)}>★ {favorite ? "Favorite" : "Add favorite"}</button>
          </fieldset>

          <div className="chinese-entry-modal-grid">
            <label><span>Source</span><input value={source} onChange={(event) => setSource(event.target.value)} placeholder="Tutor, song, conversation…" /></label>
            <label><span>Tags · comma separated</span><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Taiwan, casual speech" /></label>
          </div>

          <label><span>Collections · comma separated</span><input value={collections} onChange={(event) => setCollections(event.target.value)} placeholder="Tutor lessons, Daily life, Restaurant" /></label>

          <label><span>Example</span><textarea value={example} onChange={(event) => setExample(event.target.value)} rows={2} placeholder="Optional example sentence" /></label>
          <label><span>Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Anything worth remembering" /></label>
        </div>

        <footer>
          {entry && onDelete ? (
            <button type="button" className={confirmingDelete ? "is-confirming" : ""} onClick={async () => {
              if (!confirmingDelete) { setConfirmingDelete(true); return; }
              await onDelete();
              onClose();
            }}>{confirmingDelete ? "Confirm remove" : "Remove"}</button>
          ) : <span />}
          <i />
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={!traditional.trim() || !meaning.trim() || saving}>{saving ? "Saving…" : entry ? "Save changes" : "Add entry"}</button>
        </footer>
      </form>
    </div>,
    target
  );
}
