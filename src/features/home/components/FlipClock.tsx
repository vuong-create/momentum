import {
  useEffect,
  useState,
} from "react";

import "./flip-clock.css";

type FlipDigitProps = {
  value: string;
  previousValue: string;
};

function FlipDigit({
  value,
  previousValue,
}: FlipDigitProps) {
  const isFlipping = value !== previousValue;

  return (
    <span
      className={[
        "flip-digit",
        isFlipping
          ? "flip-digit-animating"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      <span className="flip-digit-static flip-digit-top">
        <span>{value}</span>
      </span>

      <span className="flip-digit-static flip-digit-bottom">
        <span>{value}</span>
      </span>

      {isFlipping && (
        <>
          <span className="flip-digit-flap flip-digit-flap-front">
            <span>{previousValue}</span>
          </span>

          <span className="flip-digit-flap flip-digit-flap-back">
            <span>{value}</span>
          </span>
        </>
      )}

      <span className="flip-digit-seam" />
    </span>
  );
}

function getClockParts(date: Date) {
  const hours = date.getHours();
  const twelveHour = hours % 12 || 12;

  return {
    hour: String(twelveHour).padStart(
      2,
      "0"
    ),
    minute: String(
      date.getMinutes()
    ).padStart(2, "0"),
    period: hours >= 12 ? "PM" : "AM",
  };
}

export default function FlipClock() {
  const [clock, setClock] = useState(() => {
    const initial = new Date();

    return {
      current: initial,
      previous: initial,
      tick: 0,
    };
  });

  useEffect(() => {
    let intervalId: number | undefined;

    const millisecondsUntilNextMinute =
      60_000 -
      (Date.now() % 60_000) +
      50;

    const timeoutId = window.setTimeout(
      () => {
        setClock((current) => ({
          current: new Date(),
          previous: current.current,
          tick: current.tick + 1,
        }));

        intervalId = window.setInterval(
          () => {
            setClock((current) => ({
              current: new Date(),
              previous: current.current,
              tick: current.tick + 1,
            }));
          },
          60_000
        );
      },
      millisecondsUntilNextMinute
    );

    return () => {
      window.clearTimeout(timeoutId);

      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  const current = getClockParts(clock.current);
  const previous = getClockParts(clock.previous);

  return (
    <div
      className="flip-clock"
      aria-label={`Current time ${current.hour}:${current.minute} ${current.period}`}
    >
      <div className="flip-clock-digits">
        <FlipDigit
          key={`hour-tens-${clock.tick}`}
          value={current.hour[0]}
          previousValue={previous.hour[0]}
        />
        <FlipDigit
          key={`hour-ones-${clock.tick}`}
          value={current.hour[1]}
          previousValue={previous.hour[1]}
        />

        <span className="flip-clock-colon">
          <i />
          <i />
        </span>

        <FlipDigit
          key={`minute-tens-${clock.tick}`}
          value={current.minute[0]}
          previousValue={previous.minute[0]}
        />
        <FlipDigit
          key={`minute-ones-${clock.tick}`}
          value={current.minute[1]}
          previousValue={previous.minute[1]}
        />
      </div>

      <span className="flip-clock-period">
        {current.period}
      </span>
    </div>
  );
}
