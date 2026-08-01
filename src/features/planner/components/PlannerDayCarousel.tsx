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
  const weekStartKey = days[0]?.dateKey;

  useEffect(() => {
    const track = trackRef.current;

    if (!track) return;

    track.scrollLeft = 0;

    function updateControls() {
      if (!track) return;

      setCanMoveBackward(track.scrollLeft > 2);
      setCanMoveForward(
        track.scrollLeft + track.clientWidth < track.scrollWidth - 2
      );
    }

    updateControls();
    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);

    return () => {
      track.removeEventListener("scroll", updateControls);
      window.removeEventListener("resize", updateControls);
    };
  }, [weekStartKey]);

  function moveViewport(direction: -1 | 1) {
    const track = trackRef.current;

    if (!track) return;

    const card = track.querySelector<HTMLElement>(".planner-day-card");
    const distance = (card?.offsetWidth ?? track.clientWidth * 0.8) + 10;

    track.scrollBy({
      left: distance * direction,
      behavior: "smooth",
    });
  }

  return (
    <section className="planner-day-carousel" aria-label="Days this week">
      <button
        type="button"
        className="planner-day-carousel-arrow planner-day-carousel-previous"
        onClick={() => moveViewport(-1)}
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
        onClick={() => moveViewport(1)}
        disabled={!canMoveForward}
        aria-label="Show later days"
      >
        →
      </button>
    </section>
  );
}
