import { useEffect, useState } from "react";

import { clockParts } from "../services/clockService";
import "./pixel-terminal-clock.css";

export default function PixelTerminalClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const { hour, minute, period } = clockParts(now);

  return (
    <time className="pixel-terminal-clock" dateTime={now.toISOString()} aria-label={`Current time ${hour}:${minute} ${period}`}>
      <span className="pixel-terminal-time" aria-hidden="true">
        <span>{hour}</span>
        <i>:</i>
        <span key={`${hour}:${minute}`} className="pixel-terminal-minute">{minute}</span>
        <small>{period}</small>
      </span>
    </time>
  );
}
