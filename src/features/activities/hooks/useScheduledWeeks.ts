import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../database/db";
import { toDateKey } from "../services/activityLifecycle";
import { materializeOccurrencesForWeek } from "../services/recurrenceService";

// Dexie live queries must be read-only. Generate missing occurrences in a
// separate transaction when the visible range or the scheduling rules change.
export default function useScheduledWeeks(first: string, last = first) {
  const rules = useLiveQuery(() => db.recurrenceRules.toArray());
  useEffect(() => {
    if (!rules?.some(r => r.active)) return;
    let cancelled = false;
    async function fill() {
      const date = new Date(first + "T12:00:00");
      while (!cancelled && toDateKey(date) <= last) {
        await materializeOccurrencesForWeek(toDateKey(date));
        date.setDate(date.getDate() + 7);
      }
    }
    void fill().catch(error => console.error("Could not schedule Planner occurrences", error));
    return () => { cancelled = true; };
  }, [first, last, rules]);
}
