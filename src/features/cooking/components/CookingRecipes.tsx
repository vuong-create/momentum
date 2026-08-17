import { useMemo, useState } from "react";

import type { CookingRecipe } from "../../../database/db";
import RecipeModal from "./RecipeModal";
import type { CookingRecipeInput } from "../services/recipeService";

type CookingRecipesProps = {
  recipes: CookingRecipe[];
  todayKey: string;
  onCreate: (input: CookingRecipeInput) => Promise<void>;
  onUpdate: (recipe: CookingRecipe, input: CookingRecipeInput) => Promise<void>;
  onDelete: (recipe: CookingRecipe) => Promise<void>;
  onToggleFavorite: (recipe: CookingRecipe) => Promise<void>;
  onPlan: (recipe: CookingRecipe, date: string) => Promise<void>;
  onCookToday: (recipe: CookingRecipe) => Promise<void>;
  onAddGroceries: (recipe: CookingRecipe, servings: number) => Promise<void>;
};

export default function CookingRecipes({ recipes, todayKey, onCreate, onUpdate, onDelete, onToggleFavorite, onPlan, onCookToday, onAddGroceries }: CookingRecipesProps) {
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selected, setSelected] = useState<CookingRecipe | null | undefined>(undefined);
  const [planningId, setPlanningId] = useState<number | null>(null);
  const [planDate, setPlanDate] = useState(todayKey);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return recipes.filter((recipe) =>
      (!favoritesOnly || recipe.favorite) &&
      (!normalized || `${recipe.name} ${recipe.tags.join(" ")} ${recipe.ingredients.map((item) => item.name).join(" ")}`.toLowerCase().includes(normalized))
    );
  }, [favoritesOnly, query, recipes]);

  return (
    <div className="cooking-recipes-view">
      <header className="cooking-section-header">
        <div><span className="text-label">Meals worth repeating</span><h2 className="font-pixel">Cookbook</h2><p>A small collection that grows naturally.</p></div>
        <div><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search meals or ingredients…" aria-label="Search recipes" /><button type="button" className={favoritesOnly ? "is-selected" : ""} onClick={() => setFavoritesOnly((current) => !current)}>★ Favorites</button><button type="button" className="cooking-primary-button" onClick={() => setSelected(null)}>＋ New recipe</button></div>
      </header>

      <div className="cooking-cookbook-paper">
        <div className="cooking-menu-heading"><span>Momentum kitchen · personal collection</span><strong>Meals at Home</strong><small>{filtered.length} {filtered.length === 1 ? "recipe" : "recipes"}</small></div>
        <div className="cooking-recipe-grid">
          {filtered.map((recipe, index) => (
            <article key={recipe.id} className={`cooking-recipe-card ${index === 0 ? "is-featured" : ""}`}>
              <button type="button" className={`cooking-recipe-cover ${recipe.coverImageDataUrl ? "has-image" : ""}`} onClick={() => setSelected(recipe)} aria-label={`Open ${recipe.name}`}>
                {recipe.coverImageDataUrl
                  ? <img src={recipe.coverImageDataUrl} alt="" />
                  : <span className="cooking-cover-placeholder" aria-hidden="true"><i /><b>＋ Add cover</b></span>}
                <em>{String(index + 1).padStart(2, "0")}</em>
              </button>
              <div>
                <header><button type="button" onClick={() => setSelected(recipe)}><strong>{recipe.name}</strong><small>{recipe.prepMinutes ? `${recipe.prepMinutes} min · ` : ""}{recipe.defaultServings} servings</small></button><button type="button" className={recipe.favorite ? "is-favorite" : ""} onClick={() => onToggleFavorite(recipe)} aria-label={`${recipe.favorite ? "Remove" : "Add"} ${recipe.name} ${recipe.favorite ? "from" : "to"} favorites`}>{recipe.favorite ? "★" : "☆"}</button></header>
                <div className="cooking-recipe-tags">{recipe.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
                <footer>
                  <button type="button" onClick={() => onCookToday(recipe)}>Cooked today</button>
                  <button type="button" onClick={() => onAddGroceries(recipe, recipe.defaultServings)}>＋ Groceries</button>
                  <button type="button" onClick={() => { setPlanningId(planningId === recipe.id ? null : recipe.id!); setPlanDate(todayKey); }}>Plan</button>
                </footer>
                {planningId === recipe.id && <div className="cooking-card-plan"><input type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)} /><button type="button" onClick={async () => { await onPlan(recipe, planDate); setPlanningId(null); }}>Add to week</button></div>}
              </div>
            </article>
          ))}
          {!filtered.length && <button type="button" className="cooking-empty-recipes" onClick={() => setSelected(null)}><span>＋</span><strong>{recipes.length ? "No meals match that search." : "Remember your first meal."}</strong><small>{recipes.length ? "Try a different ingredient or filter." : "Start with something you already cook and love."}</small></button>}
        </div>
      </div>

      <RecipeModal
        key={selected === undefined ? "closed" : selected?.id ?? "new"}
        open={selected !== undefined}
        recipe={selected ?? null}
        onClose={() => setSelected(undefined)}
        onSave={(input) => selected ? onUpdate(selected, input) : onCreate(input)}
        onDelete={selected ? () => onDelete(selected) : undefined}
      />
    </div>
  );
}
