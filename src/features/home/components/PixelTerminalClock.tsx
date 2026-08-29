import { useEffect, useState } from "react";

import { clockParts } from "../services/clockService";
import "./pixel-terminal-clock.css";

export default function PixelTerminalClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const { hour, minute, period, metadata } = clockParts(now);

  return (
    <div className="pixel-terminal-clock" aria-label={`Current time ${hour}:${minute} ${period}`}>
      <div className="pixel-terminal-time" aria-hidden="true">
        <span>{hour}</span>
        <i>:</i>
        <span>{minute}</span>
        <small>{period}</small>
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
