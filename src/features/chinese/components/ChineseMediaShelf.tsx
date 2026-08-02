import { useMemo, useState, type FormEvent } from "react";

import type {
  ChineseMediaResource,
  ChineseMediaType,
} from "../../../database/db";
import type { ChineseMediaInput } from "../services/chineseMediaService";

const mediaTypes: { type: ChineseMediaType; label: string; mark: string }[] = [
  { type: "video", label: "Video", mark: "影" },
  { type: "podcast", label: "Podcast", mark: "播" },
  { type: "music", label: "Music", mark: "樂" },
  { type: "reading", label: "Reading", mark: "讀" },
];

type ChineseMediaShelfProps = {
  resources: ChineseMediaResource[];
  onAdd: (input: ChineseMediaInput) => Promise<void>;
  onRemove: (resource: ChineseMediaResource) => Promise<void>;
};

export default function ChineseMediaShelf({
  resources,
  onAdd,
  onRemove,
}: ChineseMediaShelfProps) {
  const [type, setType] = useState<ChineseMediaType>("video");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const visibleResources = useMemo(
    () => resources.filter((resource) => resource.type === type),
    [resources, type]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim() || saving) return;

    setSaving(true);
    setError("");
    try {
      await onAdd({ type, title, url });
      setTitle("");
      setUrl("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That link could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="chinese-media-shelf">
      <header>
        <div>
          <span className="text-label">Practice shelf</span>
          <h2>Keep something ready</h2>
          <p>Save media you actually want to return to.</p>
        </div>
        <small>{resources.length} saved</small>
      </header>

      <nav aria-label="Practice media type">
        {mediaTypes.map((option) => (
          <button
            type="button"
            key={option.type}
            className={type === option.type ? "is-selected" : ""}
            onClick={() => setType(option.type)}
          >
            <span>{option.mark}</span>{option.label}
            {resources.filter((resource) => resource.type === option.type).length > 0 && (
              <b>{resources.filter((resource) => resource.type === option.type).length}</b>
            )}
          </button>
        ))}
      </nav>

      <form onSubmit={handleSubmit}>
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={type === "video" ? "Paste a YouTube or video link" : `Paste a ${type} link`}
          aria-label={`${type} link`}
        />
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Optional title"
          aria-label="Media title"
        />
        <button type="submit" disabled={!url.trim() || saving}>
          {saving ? "Saving…" : "Save link"}
        </button>
      </form>
      {error && <p className="chinese-media-error" role="alert">{error}</p>}

      {visibleResources.length === 0 ? (
        <div className="chinese-media-empty">
          <strong>No {type} links yet.</strong>
          <span>Save one good option so starting takes less effort.</span>
        </div>
      ) : (
        <div className="chinese-media-list">
          {visibleResources.map((resource) => (
            <article key={resource.id}>
              <span>{mediaTypes.find((option) => option.type === resource.type)?.mark}</span>
              <div>
                <strong>{resource.title}</strong>
                <small>{new URL(resource.url).hostname.replace(/^www\./, "")}</small>
              </div>
              <a href={resource.url} target="_blank" rel="noreferrer">Open <span>↗</span></a>
              <button type="button" onClick={() => onRemove(resource)} aria-label={`Remove ${resource.title}`}>×</button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
