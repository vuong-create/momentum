import { useEffect, useRef, useState } from "react";

import type {
  PlannerActivity,
  PlannerDay,
} from "../types";
import PlannerDayCard from "./PlannerDayCard";

type PlannerDayCarouselProps = {
  days: PlannerDay[];
  onOpenDay: (dateKey: string) => void;
  onRequestAdd: (dateKey: string) => void;
  onOpenDetails: (activityId: number, dateKey: string) => void;
  onComplete: (activity: PlannerActivity) => Promise<void>;
  onMove: (
    activity: PlannerActivity,
    scheduledDate: string
  ) => Promise<void>;
};

export default function PlannerDayCarousel({
  days,
  onOpenDay,
  onRequestAdd,
  onOpenDetails,
  onComplete,
  onMove,
}: PlannerDayCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canMoveBackward, setCanMoveBackward] = useState(false);
  const [canMoveForward, setCanMoveForward] = useState(true);
  const [position, setPosition] = useState(0);
  const weekStartKey = days[0]?.dateKey;
  const todayIndex = days.findIndex((day) => day.isToday);

  useEffect(() => {
    const track = trackRef.current;

    if (!track) return;

    const saved = sessionStorage.getItem(
      `momentum.planner.carousel.${weekStartKey}`
    );
    const savedPosition = saved === null ? null : Number(saved);
    const initialPosition = savedPosition !== null && Number.isFinite(savedPosition) && savedPosition >= 0
      ? savedPosition
      : todayIndex >= 5
        ? todayIndex - 4
        : 0;

    requestAnimationFrame(() => {
      const card = track.querySelector<HTMLElement>(".planner-day-card");
      const distance = (card?.offsetWidth ?? track.clientWidth * 0.8) + 10;
      track.scrollTo({ left: distance * initialPosition, behavior: "auto" });
    });

    function updateControls() {
      if (!track) return;

      setCanMoveBackward(track.scrollLeft > 2);
      setCanMoveForward(
        track.scrollLeft + track.clientWidth < track.scrollWidth - 2
      );
      const card = track.querySelector<HTMLElement>(".planner-day-card");
      const distance = (card?.offsetWidth ?? track.clientWidth * 0.8) + 10;
      const nextPosition = Math.max(0, Math.min(6, Math.round(track.scrollLeft / distance)));
      setPosition(nextPosition);
      sessionStorage.setItem(
        `momentum.planner.carousel.${weekStartKey}`,
        String(nextPosition)
      );
    }

    updateControls();
    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);

    return () => {
      track.removeEventListener("scroll", updateControls);
      window.removeEventListener("resize", updateControls);
    };
  }, [weekStartKey, todayIndex]);

  function moveToPosition(nextPosition: number, behavior: ScrollBehavior = "smooth") {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".planner-day-card");
    const distance = (card?.offsetWidth ?? track.clientWidth * 0.8) + 10;
    track.scrollTo({ left: distance * nextPosition, behavior });
  }

  function moveViewport(direction: -1 | 1, jumpToEnd = false) {
    const track = trackRef.current;

    if (!track) return;

    const card = track.querySelector<HTMLElement>(".planner-day-card");
    const distance = (card?.offsetWidth ?? track.clientWidth * 0.8) + 10;

    if (jumpToEnd) {
      track.scrollTo({ left: direction < 0 ? 0 : track.scrollWidth, behavior: "smooth" });
    } else {
      track.scrollBy({ left: distance * direction, behavior: "smooth" });
    }
  }

  return (
    <section className="planner-day-carousel" aria-label="Days this week">
      <button
        type="button"
        className="planner-day-carousel-arrow planner-day-carousel-previous"
        onClick={(event) => moveViewport(-1, event.shiftKey)}
        disabled={!canMoveBackward}
        aria-label="Show earlier days"
      >
        ←
      </button>

      <div className="planner-day-track" ref={trackRef}>
        {days.map((day) => (
          <PlannerDayCard
            key={day.dateKey}
            day={day}
            onOpenDay={onOpenDay}
            onRequestAdd={onRequestAdd}
            onOpenDetails={onOpenDetails}
            onComplete={onComplete}
            onMove={onMove}
          />
        ))}
      </div>

      <button
        type="button"
        className="planner-day-carousel-arrow planner-day-carousel-next"
        onClick={(event) => moveViewport(1, event.shiftKey)}
        disabled={!canMoveForward}
        aria-label="Show later days"
      >
        →
      </button>

      <div className="planner-day-carousel-dots" aria-label={`Day viewport position ${position + 1} of 7`}>
        {days.map((day, index) => (
          <button key={day.dateKey} type="button" className={index === position ? "is-active" : ""} onClick={() => moveToPosition(index)} aria-label={`Show ${day.dayName}`} />
        ))}
      </div>
    </section>
  );
}
