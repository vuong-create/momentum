import { useMemo, useState } from "react";

import type { CookingMealLog, CookingRecipe, PlannedActivity } from "../../../database/db";
import { getActivityStatus } from "../../activities/services/activityLifecycle";
import { parseRecipeActivityKind } from "../cookingCatalog";

type CookingJournalProps = {
  logs: CookingMealLog[];
  plans: PlannedActivity[];
  recipes: CookingRecipe[];
  onOpenRecipe: (recipeId: number) => void;
  onSaveNote: (logId: number, notes?: string) => Promise<void>;
};

type JournalMeal = {
  key: string;
  logId?: number;
  title: string;
  date: string;
  completedAt: string;
  notes?: string;
  recipe?: CookingRecipe;
};

function readableDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(`${value}T12:00:00`));
}

export default function CookingJournal({ logs, plans, recipes, onOpenRecipe, onSaveNote }: CookingJournalProps) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const meals = useMemo<JournalMeal[]>(() => {
    const planById = new Map(plans.filter(({ id }) => id).map((plan) => [plan.id!, plan]));
    const recipeById = new Map(recipes.filter(({ id }) => id).map((recipe) => [recipe.id!, recipe]));
    const loggedPlanIds = new Set(logs.map(({ plannedActivityId }) => plannedActivityId).filter(Boolean));
    const fromLogs = logs.map((log) => {
      const plan = log.plannedActivityId ? planById.get(log.plannedActivityId) : undefined;
      const recipeId = log.recipeId ?? parseRecipeActivityKind(plan?.activityKind);
      return {
        key: `log-${log.id}`,
        logId: log.id,
        title: log.title,
        date: log.date || log.completedAt.slice(0, 10),
        completedAt: log.completedAt,
        notes: log.notes,
        recipe: recipeId ? recipeById.get(recipeId) : undefined,
      };
    });
    const legacy = plans
      .filter((plan) => plan.id && !plan.deletedAt && getActivityStatus(plan) === "completed" && parseRecipeActivityKind(plan.activityKind) && !loggedPlanIds.has(plan.id))
      .map((plan) => {
        const recipeId = parseRecipeActivityKind(plan.activityKind)!;
        const date = plan.completedAt?.slice(0, 10) ?? plan.scheduledDate ?? plan.date.slice(0, 10);
        return { key: `plan-${plan.id}`, title: plan.title, date, completedAt: plan.completedAt ?? `${date}T12:00:00`, recipe: recipeById.get(recipeId) };
      });
    return [...fromLogs, ...legacy].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  }, [logs, plans, recipes]);

  const months = useMemo(() => [...new Set(meals.map(({ date }) => date.slice(0, 7)))].sort().reverse(), [meals]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return meals.filter((meal) => (period === "all" || meal.date.startsWith(period)) && (!normalized || `${meal.title} ${meal.notes ?? ""}`.toLowerCase().includes(normalized)));
  }, [meals, period, query]);
  const recipeCounts = new Map<number, number>();
  for (const meal of filtered) if (meal.recipe?.id) recipeCounts.set(meal.recipe.id, (recipeCounts.get(meal.recipe.id) ?? 0) + 1);
  const mostReturned = [...recipeCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostReturnedRecipe = mostReturned ? recipes.find(({ id }) => id === mostReturned[0]) : undefined;

  return (
    <div className="cooking-journal-view">
      <header className="cooking-section-header">
        <div><span className="text-label">Meals become memories</span><h2 className="font-pixel">Kitchen Journal</h2><p>A visual record of what actually made it to the table.</p></div>
        <div>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cooked meals…" aria-label="Search cooking history" />
          <select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Cooking history month">
            <option value="all">All history</option>
            {months.map((month) => <option key={month} value={month}>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(`${month}-15T12:00:00`))}</option>)}
          </select>
        </div>
      </header>

      <section className="cooking-journal-summary">
        <article><span>Meals recorded</span><strong>{filtered.length}</strong><small>{period === "all" ? "All time" : "Selected month"}</small></article>
        <article><span>Different recipes</span><strong>{recipeCounts.size}</strong><small>Meals worth returning to</small></article>
        <article className="cooking-journal-return"><span>Most returned to</span><strong>{mostReturnedRecipe?.name ?? "Still becoming"}</strong><small>{mostReturned ? `${mostReturned[1]} ${mostReturned[1] === 1 ? "time" : "times"}` : "Complete a meal to begin"}</small></article>
      </section>

      {filtered.length ? <section className="cooking-journal-grid" aria-label="Cooking history">
        {filtered.map((meal) => <article key={meal.key} className="cooking-journal-card">
          <button type="button" className="cooking-journal-cover" disabled={!meal.recipe?.id} onClick={() => meal.recipe?.id && onOpenRecipe(meal.recipe.id)} aria-label={meal.recipe ? `Open ${meal.recipe.name}` : meal.title}>
            {meal.recipe?.coverImageDataUrl ? <img src={meal.recipe.coverImageDataUrl} alt="" /> : <span aria-hidden="true"><i>⌁</i><small>Kitchen record</small></span>}
          </button>
          <div className="cooking-journal-caption">
            <span>{readableDate(meal.date)}</span>
            <strong>{meal.title}</strong>
            {meal.notes && editingId !== meal.logId && <p>{meal.notes}</p>}
            {meal.logId && editingId !== meal.logId && <button type="button" onClick={() => { setEditingId(meal.logId!); setNoteDraft(meal.notes ?? ""); }}>{meal.notes ? "Edit note" : "＋ Add a note"}</button>}
            {meal.logId && editingId === meal.logId && <div className="cooking-journal-note"><textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="What would you remember or change next time?" autoFocus /><span><button type="button" onClick={() => setEditingId(null)}>Cancel</button><button type="button" onClick={async () => { await onSaveNote(meal.logId!, noteDraft); setEditingId(null); }}>Save note</button></span></div>}
          </div>
        </article>)}
      </section> : <section className="cooking-journal-empty"><span>○</span><strong>{meals.length ? "No meals match this view." : "Your kitchen journal begins with the next meal."}</strong><small>{meals.length ? "Try all history or a different search." : "Complete a planned meal or mark a cookbook recipe as made."}</small></section>}
    </div>
  );
}
