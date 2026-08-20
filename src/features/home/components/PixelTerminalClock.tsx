import { useEffect, useState } from "react";

import "./pixel-terminal-clock.css";

function clockParts(date: Date) {
  return {
    hour: String(date.getHours()).padStart(2, "0"),
    minute: String(date.getMinutes()).padStart(2, "0"),
    metadata: new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(date).replace(",", "").toUpperCase(),
  };
}

export default function PixelTerminalClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const { hour, minute, metadata } = clockParts(now);

  return (
    <div className="pixel-terminal-clock" aria-label={`Current time ${hour}:${minute}`}>
      <div className="pixel-terminal-time" aria-hidden="true">
        <span>{hour}</span>
        <i>:</i>
        <span>{minute}</span>
        <b />
      </div>
      <div className="pixel-terminal-rule" aria-hidden="true" />
      <div className="pixel-terminal-meta">
        <i aria-hidden="true" />
        <span>Local time · {metadata}</span>
      </div>
    </div>
  );
}
