import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./flip-clock.css";

type FlipDigitProps = {
  value: string;
};

function FlipDigit({
  value,
}: FlipDigitProps) {
  const [currentValue, setCurrentValue] =
    useState(value);

  const [previousValue, setPreviousValue] =
    useState(value);

  const [isFlipping, setIsFlipping] =
    useState(false);

  const animationTimer =
    useRef<number | null>(null);

  useEffect(() => {
    if (value === currentValue) {
      return;
    }

    setPreviousValue(currentValue);
    setCurrentValue(value);
    setIsFlipping(true);

    if (animationTimer.current) {
      window.clearTimeout(
        animationTimer.current
      );
    }

    animationTimer.current =
      window.setTimeout(() => {
        setIsFlipping(false);
      }, 620);

    return () => {
      if (animationTimer.current) {
        window.clearTimeout(
          animationTimer.current
        );
      }
    };
  }, [value, currentValue]);

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
        <span>{currentValue}</span>
      </span>

      <span className="flip-digit-static flip-digit-bottom">
        <span>{currentValue}</span>
      </span>

      {isFlipping && (
        <>
          <span className="flip-digit-flap flip-digit-flap-front">
            <span>{previousValue}</span>
          </span>

          <span className="flip-digit-flap flip-digit-flap-back">
            <span>{currentValue}</span>
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
  const [now, setNow] = useState(
    () => new Date()
  );

  useEffect(() => {
    let intervalId: number | undefined;

    const millisecondsUntilNextMinute =
      60_000 -
      (Date.now() % 60_000) +
      50;

    const timeoutId = window.setTimeout(
      () => {
        setNow(new Date());

        intervalId = window.setInterval(
          () => {
            setNow(new Date());
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

  const { hour, minute, period } =
    getClockParts(now);

  return (
    <div
      className="flip-clock"
      aria-label={`Current time ${hour}:${minute} ${period}`}
    >
      <div className="flip-clock-digits">
        <FlipDigit value={hour[0]} />
        <FlipDigit value={hour[1]} />

        <span className="flip-clock-colon">
          <i />
          <i />
        </span>

        <FlipDigit value={minute[0]} />
        <FlipDigit value={minute[1]} />
      </div>

      <span className="flip-clock-period">
        {period}
      </span>
    </div>
  );
}