import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import type {
  LibraryWishlistItem,
  LibraryWishlistStatus,
} from "../../../database/db";
import type { WishlistItemInput } from "../services/wishlistService";

type JournalWishlistProps = {
  items: LibraryWishlistItem[];
  onSave: (item: LibraryWishlistItem | null, input: WishlistItemInput) => Promise<void>;
  onDelete: (item: LibraryWishlistItem) => Promise<void>;
  onStatusChange: (item: LibraryWishlistItem, status: LibraryWishlistStatus) => Promise<void>;
};

function displayHost(url?: string) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Open link";
  }
}

function WishlistModal({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: LibraryWishlistItem | null;
  onClose: () => void;
  onSave: JournalWishlistProps["onSave"];
  onDelete: JournalWishlistProps["onDelete"];
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [status, setStatus] = useState<LibraryWishlistStatus>(item?.status ?? "considering");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave(item, { name, url, notes, status });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This wish could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const target = document.querySelector(".experience-root") ?? document.body;
  return createPortal(
    <div className="journal-modal-layer">
      <button type="button" className="journal-modal-backdrop" onClick={onClose} aria-label="Close wish" />
      <form className="journal-entry-modal journal-wishlist-modal" onSubmit={handleSubmit}>
        <header>
          <div><span className="text-label">Something for later</span><h2>{item ? "Edit wish" : "Add a wish"}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="journal-entry-modal-body">
          <label><span>Item</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="What are you considering?" /></label>
          <label><span>Link · optional</span><input inputMode="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="store.com/item" /></label>
          <label><span>Note · optional</span><textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Why it caught your eye, size, color…" /></label>
          <fieldset className="journal-wishlist-status">
            <legend>Status</legend>
            <button type="button" className={status === "considering" ? "is-selected" : ""} onClick={() => setStatus("considering")}>Considering</button>
            <button type="button" className={status === "acquired" ? "is-selected" : ""} onClick={() => setStatus("acquired")}>Acquired</button>
          </fieldset>
          {error && <p className="journal-wishlist-error" role="alert">{error}</p>}
        </div>
        <footer>
          {item ? <button type="button" className={confirmingDelete ? "is-confirming" : ""} onClick={async () => {
            if (!confirmingDelete) { setConfirmingDelete(true); return; }
            await onDelete(item);
            onClose();
          }}>{confirmingDelete ? "Confirm remove" : "Remove"}</button> : <span />}
          <span />
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={!name.trim() || saving}>{saving ? "Saving…" : "Save wish"}</button>
        </footer>
      </form>
    </div>,
    target,
  );
}

export default function JournalWishlist({ items, onSave, onDelete, onStatusChange }: JournalWishlistProps) {
  const [selectedItem, setSelectedItem] = useState<LibraryWishlistItem | null | undefined>(undefined);
  const [showAcquired, setShowAcquired] = useState(false);
  const considering = useMemo(() => items.filter((item) => item.status === "considering"), [items]);
  const acquired = useMemo(() => items.filter((item) => item.status === "acquired"), [items]);

  return (
    <div className="journal-wishlist">
      <header className="journal-wishlist-header">
        <div><span className="text-label">Consider slowly</span><h2 className="font-pixel">Wish List</h2><p>A quiet place for things you may want—without turning every thought into a purchase.</p></div>
        <button type="button" onClick={() => setSelectedItem(null)}>＋ Add item</button>
      </header>

      {considering.length > 0 ? (
        <div className="journal-wishlist-grid">
          {considering.map((item) => (
            <article key={item.id}>
              <button type="button" className="journal-wishlist-open" onClick={() => setSelectedItem(item)}>
                <span className="journal-wishlist-mark" aria-hidden="true">◇</span>
                <span><strong>{item.name}</strong>{item.notes && <small>{item.notes}</small>}</span>
                <b>•••</b>
              </button>
              <footer>
                {item.url ? <a href={item.url} target="_blank" rel="noreferrer">{displayHost(item.url)} ↗</a> : <span>No link needed</span>}
                <button type="button" onClick={() => onStatusChange(item, "acquired")}>Mark acquired</button>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <button type="button" className="journal-wishlist-empty" onClick={() => setSelectedItem(null)}>
          <span aria-hidden="true">◇</span><strong>Nothing waiting right now.</strong><small>Add an idea when something is worth remembering.</small>
        </button>
      )}

      {acquired.length > 0 && (
        <section className="journal-wishlist-acquired">
          <button type="button" onClick={() => setShowAcquired((visible) => !visible)} aria-expanded={showAcquired}>
            <span>Acquired · {acquired.length}</span><b>{showAcquired ? "−" : "+"}</b>
          </button>
          {showAcquired && <div>{acquired.map((item) => (
            <article key={item.id}>
              <button type="button" onClick={() => setSelectedItem(item)}><span>✓</span><strong>{item.name}</strong><small>{item.acquiredAt ? new Date(item.acquiredAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Acquired"}</small></button>
              <button type="button" onClick={() => onStatusChange(item, "considering")}>Return to list</button>
            </article>
          ))}</div>}
        </section>
      )}

      {selectedItem !== undefined && <WishlistModal item={selectedItem} onClose={() => setSelectedItem(undefined)} onSave={onSave} onDelete={onDelete} />}
    </div>
  );
}
