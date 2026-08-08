import { useMemo, useState, type FormEvent } from "react";

import type { CookingMealLog, CookingRecipe, PlannedActivity } from "../../../database/db";
import { getActivityStatus } from "../../activities/services/activityLifecycle";
import { quickMealOptions } from "../cookingCatalog";

type CookingWeekProps = {
  now: Date;
  recipes: CookingRecipe[];
  plans: PlannedActivity[];
  recentMeals: CookingMealLog[];
  onPlanRecipe: (recipeId: number, date: string) => Promise<void>;
  onPlanQuick: (type: "leftovers" | "eating-out" | "open", label: string, date: string) => Promise<void>;
  onComplete: (activity: PlannedActivity) => Promise<void>;
  onRemove: (activity: PlannedActivity) => Promise<void>;
  onOpenRecipes: () => void;
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeek(now: Date) {
  const sunday = new Date(now);
  sunday.setHours(0, 0, 0, 0);
  sunday.setDate(now.getDate() - now.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    return { date, key: dateKey(date) };
  });
}

export default function CookingWeek({ now, recipes, plans, recentMeals, onPlanRecipe, onPlanQuick, onComplete, onRemove, onOpenRecipes }: CookingWeekProps) {
  const week = useMemo(() => getWeek(now), [now]);
  const todayKey = dateKey(now);
  const [date, setDate] = useState(todayKey);
  const [selection, setSelection] = useState("");
  const [planning, setPlanning] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selection || planning) return;
    setPlanning(true);
    try {
      if (selection.startsWith("recipe:")) {
        await onPlanRecipe(Number(selection.slice("recipe:".length)), date);
      } else {
        const type = selection.slice("quick:".length) as "leftovers" | "eating-out" | "open";
        const option = quickMealOptions.find((item) => item.id === type)!;
        await onPlanQuick(type, option.label, date);
      }
      setSelection("");
    } finally {
      setPlanning(false);
    }
  }

  return (
    <div className="cooking-week-view">
      <section className="cooking-week-hero cooking-card">
        <div><span className="text-label">This week</span><h2>What are we eating?</h2><p>Plan once. It appears here, on Home, and in your weekly Planner.</p></div>
        <form onSubmit={submit}>
          <select value={selection} onChange={(event) => setSelection(event.target.value)} aria-label="Choose meal">
            <option value="">Choose a meal…</option>
            {recipes.map((recipe) => <option key={recipe.id} value={`recipe:${recipe.id}`}>{recipe.favorite ? "★ " : ""}{recipe.name}</option>)}
            <optgroup label="Quick options">
              {quickMealOptions.map((option) => <option key={option.id} value={`quick:${option.id}`}>{option.label}</option>)}
            </optgroup>
          </select>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Meal date" />
          <button type="submit" disabled={!selection || planning}>{planning ? "Planning…" : "Plan meal"}</button>
        </form>
      </section>

      <section className="cooking-week-grid" aria-label="This week's meals">
        {week.map((day) => {
          const dayPlans = plans.filter((plan) => plan.scheduledDate === day.key);
          const isToday = day.key === todayKey;
          return (
            <article key={day.key} className={`cooking-day-card ${isToday ? "is-today" : ""}`}>
              <header><span>{new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day.date)}</span><strong>{day.date.getDate()}</strong>{isToday && <small>Today</small>}</header>
              <div>
                {dayPlans.length ? dayPlans.map((plan) => {
                  const complete = getActivityStatus(plan) === "completed";
                  return <div key={plan.id} className={complete ? "is-complete" : ""}>
                    <span className="cooking-meal-mark" aria-hidden="true">{complete ? "✓" : "火"}</span>
                    <span><strong>{plan.title}</strong><small>{complete ? "Cooked" : plan.notes ?? "Dinner"}</small></span>
                    {!complete && <button type="button" onClick={() => onComplete(plan)}>Cooked</button>}
                    <button type="button" className="cooking-remove-plan" onClick={() => onRemove(plan)} aria-label={`Remove ${plan.title}`}>×</button>
                  </div>;
                }) : <button type="button" className="cooking-empty-day" onClick={() => { setDate(day.key); document.querySelector<HTMLSelectElement>('.cooking-week-hero select')?.focus(); }}>Open<span>＋</span></button>}
              </div>
            </article>
          );
        })}
      </section>

      <section className="cooking-week-lower">
        <article className="cooking-card cooking-recent-card">
          <header><div><span className="text-label">Recently cooked</span><h3>Return to favorites.</h3></div><button type="button" onClick={onOpenRecipes}>View meals</button></header>
          <div>{recentMeals.slice(0, 5).map((meal) => <span key={meal.id ?? `${meal.title}-${meal.completedAt}`}><i>火</i><span><strong>{meal.title}</strong><small>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${meal.date}T00:00:00`))}</small></span></span>)}</div>
          {!recentMeals.length && <p>Meals you complete will gather here automatically.</p>}
        </article>
        <article className="cooking-card cooking-cookbook-callout">
          <span className="cooking-steam" aria-hidden="true"><i /><i /><i /></span>
          <div><span className="text-label">Personal cookbook</span><h3>{recipes.length ? `${recipes.length} meals worth repeating.` : "Start with one meal you love."}</h3><p>No giant recipe archive—only food you actually want to cook again.</p></div>
          <button type="button" onClick={onOpenRecipes}>{recipes.length ? "Open cookbook" : "Add first recipe"} →</button>
        </article>
      </section>
    </div>
  );
}
