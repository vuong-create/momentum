import { useEffect, useRef, useState, type DragEvent } from "react";

import type { ChineseEntry } from "../../../database/db";
import { speakTraditionalChinese } from "../services/pronunciationService";

type Props = {
  entries: ChineseEntry[];
  selectedEntryId: number | null;
  onSelectEntry: (id: number | null) => void;
};

export default function ChinesePronunciationStudio({ entries, selectedEntryId, onSelectEntry }: Props) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rate, setRate] = useState(0.82);
  const [repeat, setRepeat] = useState(1);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingNotice, setRecordingNotice] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const entry = entries.find(({ id }) => id === selectedEntryId) ?? entries[0];

  useEffect(() => () => {
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => () => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  }, [recordingUrl]);

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    const id = Number(event.dataTransfer.getData("application/x-momentum-chinese-entry"));
    if (entries.some((candidate) => candidate.id === id)) onSelectEntry(id);
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordingNotice("Recording is not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      });
      recorder.addEventListener("stop", () => {
        const nextUrl = URL.createObjectURL(new Blob(chunksRef.current, { type: recorder.mimeType }));
        setRecordingUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return nextUrl;
        });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        setRecordingNotice("Temporary take ready. It will disappear when you leave this page.");
      });
      recorder.start();
      setRecording(true);
      setRecordingNotice("Listening… say the phrase naturally.");
    } catch {
      setRecordingNotice("Microphone permission was not granted.");
    }
  }

  return (
    <section
      className={`chinese-pronunciation-workspace${isDraggingOver ? " is-dragging-over" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); setIsDraggingOver(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDraggingOver(false);
      }}
      onDrop={handleDrop}
      aria-label="Pronunciation workspace"
    >
      <div className="chinese-pronunciation-intro">
        <span className="text-label">Pronunciation studio</span>
        <p>Drag in an entry, hear Taiwanese Mandarin, then record a private temporary take.</p>
      </div>
      {entry ? (
        <div className="chinese-pronunciation-session">
          <div className="chinese-pronunciation-phrase">
            <span><strong>{entry.traditional}</strong><i>{entry.pinyin || "Pinyin not added"}</i><small>{entry.meaning}</small></span>
            <button type="button" onClick={() => speakTraditionalChinese(entry.traditional, { rate, repeat })} aria-label={`Hear ${entry.traditional}`}>♪ Hear</button>
          </div>
          <div className="chinese-pronunciation-controls">
            <fieldset><legend>Speed</legend>{[[0.65, "Slow"], [0.82, "Natural"], [1, "Fast"]].map(([value, label]) => <button key={value} type="button" className={rate === value ? "is-selected" : ""} onClick={() => setRate(Number(value))}>{label}</button>)}</fieldset>
            <fieldset><legend>Repeat</legend>{[1, 3].map((value) => <button key={value} type="button" className={repeat === value ? "is-selected" : ""} onClick={() => setRepeat(value)}>×{value}</button>)}</fieldset>
            <button type="button" className={`chinese-record-button${recording ? " is-recording" : ""}`} onClick={toggleRecording}>{recording ? "■ Stop" : "● Record"}</button>
          </div>
          {(recordingNotice || recordingUrl) && <div className="chinese-recording-result"><small>{recordingNotice}</small>{recordingUrl && <audio controls src={recordingUrl} />}</div>}
        </div>
      ) : (
        <div className="chinese-pronunciation-workspace-empty"><strong>拖到這裡</strong><span>Add an entry, then drop it here to hear it.</span></div>
      )}
    </section>
  );
}
