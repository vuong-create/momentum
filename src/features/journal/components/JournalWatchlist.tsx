import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import type { LibraryMediaType, LibraryWatchItem, LibraryWatchStatus } from "../../../database/db";
import { formatPlaybackTimestamp, type WatchItemInput } from "../services/watchlistService";

type JournalWatchlistProps = {
  items: LibraryWatchItem[];
  onSave: (item: LibraryWatchItem | null, input: WatchItemInput) => Promise<void>;
  onDelete: (item: LibraryWatchItem) => Promise<void>;
  onStatusChange: (item: LibraryWatchItem, status: LibraryWatchStatus) => Promise<void>;
};

function displayHost(url?: string) {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "Open link"; }
}

function progressLabel(item: LibraryWatchItem) {
  const episode = item.mediaType === "show" && (item.seasonNumber || item.episodeNumber)
    ? `S${item.seasonNumber ?? 1} · E${item.episodeNumber ?? 1}` : "";
  const timestamp = formatPlaybackTimestamp(item.playbackPositionSeconds);
  return [episode, timestamp ? `at ${timestamp}` : ""].filter(Boolean).join(" · ");
}

function WatchItemModal({ item, onClose, onSave, onDelete }: {
  item: LibraryWatchItem | null; onClose: () => void;
  onSave: JournalWatchlistProps["onSave"]; onDelete: JournalWatchlistProps["onDelete"];
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [mediaType, setMediaType] = useState<LibraryMediaType>(item?.mediaType ?? "show");
  const [status, setStatus] = useState<LibraryWatchStatus>(item?.status ?? "want-to-watch");
  const [releaseYear, setReleaseYear] = useState(item?.releaseYear?.toString() ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [platform, setPlatform] = useState(item?.platform ?? "");
  const [seasonNumber, setSeasonNumber] = useState(item?.seasonNumber?.toString() ?? "");
  const [episodeNumber, setEpisodeNumber] = useState(item?.episodeNumber?.toString() ?? "");
  const [playbackPosition, setPlaybackPosition] = useState(formatPlaybackTimestamp(item?.playbackPositionSeconds));
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) { if (event.key === "Escape") onClose(); }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true); setError("");
    try {
      await onSave(item, {
        title, mediaType, status, releaseYear: releaseYear ? Number(releaseYear) : undefined,
        url, platform, seasonNumber: seasonNumber ? Number(seasonNumber) : undefined,
        episodeNumber: episodeNumber ? Number(episodeNumber) : undefined, playbackPosition, notes,
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This title could not be saved.");
    } finally { setSaving(false); }
  }

  const target = document.querySelector(".experience-root") ?? document.body;
  return createPortal(
    <div className="journal-modal-layer">
      <button type="button" className="journal-modal-backdrop" onClick={onClose} aria-label="Close media editor" />
      <form className="journal-entry-modal journal-watch-modal" onSubmit={handleSubmit}>
        <header><div><span className="text-label">Movies · Shows</span><h2>{item ? "Edit title" : "Add to Watchlist"}</h2></div><button type="button" onClick={onClose} aria-label="Close">×</button></header>
        <div className="journal-entry-modal-body journal-watch-fields">
          <label className="journal-watch-wide"><span>Title</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What do you want to watch?" /></label>
          <fieldset className="journal-watch-choice journal-watch-wide"><legend>Type</legend><button type="button" className={mediaType === "show" ? "is-selected" : ""} onClick={() => setMediaType("show")}>Show</button><button type="button" className={mediaType === "movie" ? "is-selected" : ""} onClick={() => setMediaType("movie")}>Movie</button></fieldset>
          <fieldset className="journal-watch-choice journal-watch-wide"><legend>Status</legend><button type="button" className={status === "want-to-watch" ? "is-selected" : ""} onClick={() => setStatus("want-to-watch")}>Want to Watch</button><button type="button" className={status === "watching" ? "is-selected" : ""} onClick={() => setStatus("watching")}>Watching</button><button type="button" className={status === "finished" ? "is-selected" : ""} onClick={() => setStatus("finished")}>Finished</button></fieldset>
          <label><span>Release year · optional</span><input inputMode="numeric" value={releaseYear} onChange={(event) => setReleaseYear(event.target.value)} placeholder="2026" /></label>
          <label><span>Platform · optional</span><input value={platform} onChange={(event) => setPlatform(event.target.value)} placeholder="Netflix, Criterion, YouTube…" /></label>
          <label className="journal-watch-wide"><span>Link · optional</span><input inputMode="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="netflix.com/title…" /></label>
          {mediaType === "show" && <><label><span>Season</span><input type="number" min="1" value={seasonNumber} onChange={(event) => setSeasonNumber(event.target.value)} placeholder="1" /></label><label><span>Episode</span><input type="number" min="1" value={episodeNumber} onChange={(event) => setEpisodeNumber(event.target.value)} placeholder="1" /></label></>}
          <label className="journal-watch-wide"><span>Resume timestamp · optional</span><input inputMode="numeric" value={playbackPosition} onChange={(event) => setPlaybackPosition(event.target.value)} placeholder="42:15 or 1:08:30" /></label>
          <label className="journal-watch-wide"><span>Notes · optional</span><textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Why you saved it, who recommended it, what to remember…" /></label>
          {error && <p className="journal-wishlist-error journal-watch-wide" role="alert">{error}</p>}
        </div>
        <footer>
          {item ? <button type="button" className={confirmingDelete ? "is-confirming" : ""} onClick={async () => { if (!confirmingDelete) { setConfirmingDelete(true); return; } await onDelete(item); onClose(); }}>{confirmingDelete ? "Confirm remove" : "Remove"}</button> : <span />}
          <span /><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={!title.trim() || saving}>{saving ? "Saving…" : "Save title"}</button>
        </footer>
      </form>
    </div>, target,
  );
}

function WatchCard({ item, onOpen, onStatusChange }: { item: LibraryWatchItem; onOpen: () => void; onStatusChange: JournalWatchlistProps["onStatusChange"] }) {
  const progress = progressLabel(item);
  const nextStatus: LibraryWatchStatus = item.status === "watching" ? "finished" : "watching";
  return <article className={`journal-watch-card is-${item.status}`}>
    <button type="button" className="journal-watch-open" onClick={onOpen}><span className="journal-watch-mark" aria-hidden="true">{item.mediaType === "show" ? "▤" : "●"}</span><span><small>{item.mediaType === "show" ? "Series" : "Film"}{item.releaseYear ? ` · ${item.releaseYear}` : ""}</small><strong>{item.title}</strong>{(progress || item.notes) && <p>{progress || item.notes}</p>}</span><b>•••</b></button>
    <footer><span>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.platform || displayHost(item.url)} ↗</a> : item.platform || "No link needed"}</span><button type="button" onClick={() => onStatusChange(item, nextStatus)}>{item.status === "watching" ? "Mark finished" : "Start watching"}</button></footer>
  </article>;
}

export default function JournalWatchlist({ items, onSave, onDelete, onStatusChange }: JournalWatchlistProps) {
  const [selectedItem, setSelectedItem] = useState<LibraryWatchItem | null | undefined>(undefined);
  const [showFinished, setShowFinished] = useState(false);
  const watching = useMemo(() => items.filter((item) => item.status === "watching"), [items]);
  const queued = useMemo(() => items.filter((item) => item.status === "want-to-watch"), [items]);
  const finished = useMemo(() => items.filter((item) => item.status === "finished"), [items]);
  return <div className="journal-watchlist">
    <header className="journal-watchlist-header"><div><span className="text-label">Watch intentionally</span><h2 className="font-pixel">Watchlist</h2><p>Keep films and shows close, remember where you stopped, and return when the time feels right.</p></div><div><span><strong>{watching.length}</strong> watching</span><span><strong>{queued.length}</strong> saved</span><button type="button" onClick={() => setSelectedItem(null)}>＋ Add title</button></div></header>
    {watching.length > 0 && <section className="journal-watch-section"><header><span className="text-label">Continue watching</span><small>{watching.length}</small></header><div className="journal-watch-grid">{watching.map((item) => <WatchCard key={item.id} item={item} onOpen={() => setSelectedItem(item)} onStatusChange={onStatusChange} />)}</div></section>}
    <section className="journal-watch-section"><header><span className="text-label">Up next</span><small>{queued.length}</small></header>{queued.length > 0 ? <div className="journal-watch-grid">{queued.map((item) => <WatchCard key={item.id} item={item} onOpen={() => setSelectedItem(item)} onStatusChange={onStatusChange} />)}</div> : <button type="button" className="journal-watch-empty" onClick={() => setSelectedItem(null)}><span aria-hidden="true">▷</span><strong>Your queue is open.</strong><small>Save a film or show for later.</small></button>}</section>
    {finished.length > 0 && <section className="journal-watch-finished"><button type="button" onClick={() => setShowFinished((visible) => !visible)} aria-expanded={showFinished}><span>Finished · {finished.length}</span><b>{showFinished ? "−" : "+"}</b></button>{showFinished && <div>{finished.map((item) => <article key={item.id}><button type="button" onClick={() => setSelectedItem(item)}><span>✓</span><strong>{item.title}</strong><small>{item.finishedAt ? new Date(item.finishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Finished"}</small></button><button type="button" onClick={() => onStatusChange(item, "watching")}>Watch again</button></article>)}</div>}</section>}
    {selectedItem !== undefined && <WatchItemModal item={selectedItem} onClose={() => setSelectedItem(undefined)} onSave={onSave} onDelete={onDelete} />}
  </div>;
}
