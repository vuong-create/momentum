import { useMemo, useState } from "react";

import type { CookingRecipe } from "../../../database/db";
import RecipeModal from "./RecipeModal";
import type { CookingRecipeInput } from "../services/recipeService";
import type { RecipeCookingHistory } from "../services/recipeHistoryService";

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
  historyByRecipeId: Map<number, RecipeCookingHistory>;
};

export default function CookingRecipes({ recipes, todayKey, onCreate, onUpdate, onDelete, onToggleFavorite, onPlan, onCookToday, onAddGroceries, historyByRecipeId }: CookingRecipesProps) {
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [groupBySection, setGroupBySection] = useState(false);
  const [selected, setSelected] = useState<CookingRecipe | null | undefined>(undefined);
  const [planningId, setPlanningId] = useState<number | null>(null);
  const [planDate, setPlanDate] = useState(todayKey);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return recipes.filter((recipe) =>
      (!favoritesOnly || recipe.favorite) &&
      (!normalized || `${recipe.name} ${recipe.menuSection ?? ""} ${recipe.tags.join(" ")} ${recipe.ingredients.map((item) => item.name).join(" ")}`.toLowerCase().includes(normalized))
    );
  }, [favoritesOnly, query, recipes]);
  const menuSections = useMemo(() => [...new Set(recipes.map(({ menuSection }) => menuSection?.trim()).filter((section): section is string => Boolean(section)))].sort((a, b) => a.localeCompare(b)), [recipes]);
  const grouped = useMemo(() => {
    const groups = new Map<string, CookingRecipe[]>();
    for (const recipe of filtered) {
      const section = recipe.menuSection?.trim() || "Unsorted";
      groups.set(section, [...(groups.get(section) ?? []), recipe]);
    }
    return [...groups.entries()].sort(([a], [b]) => a === "Unsorted" ? 1 : b === "Unsorted" ? -1 : a.localeCompare(b));
  }, [filtered]);

  function renderRecipeCard(recipe: CookingRecipe) {
    return (
      <article key={recipe.id} className="cooking-recipe-card">
        <button type="button" className={`cooking-recipe-cover ${recipe.coverImageDataUrl ? "has-image" : ""}`} onClick={() => setSelected(recipe)} aria-label={`Open ${recipe.name}`}>
          {recipe.coverImageDataUrl
            ? <img src={recipe.coverImageDataUrl} alt="" />
            : <span className="cooking-cover-placeholder" aria-hidden="true"><i /><b>＋ Add cover</b></span>}
        </button>
        <div className="cooking-recipe-caption">
          <button type="button" className="cooking-recipe-open" onClick={() => setSelected(recipe)}>
            <strong>{recipe.name}</strong>
            <small>{recipe.menuSection || `${recipe.prepMinutes ? `${recipe.prepMinutes} min · ` : ""}${recipe.defaultServings} servings`}</small>
          </button>
          <button type="button" className={`cooking-card-favorite ${recipe.favorite ? "is-favorite" : ""}`} onClick={() => onToggleFavorite(recipe)} aria-label={`${recipe.favorite ? "Remove" : "Add"} ${recipe.name} ${recipe.favorite ? "from" : "to"} favorites`}>{recipe.favorite ? "★" : "☆"}</button>
        </div>
        <div className="cooking-card-actions">
          <button type="button" onClick={() => onCookToday(recipe)}>Made</button>
          <button type="button" onClick={() => onAddGroceries(recipe, recipe.defaultServings)}>Groceries</button>
          <button type="button" onClick={() => { setPlanningId(planningId === recipe.id ? null : recipe.id!); setPlanDate(todayKey); }}>Plan</button>
        </div>
        {planningId === recipe.id && <div className="cooking-card-plan"><input type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)} /><button type="button" onClick={async () => { await onPlan(recipe, planDate); setPlanningId(null); }}>Add</button></div>}
      </article>
    );
  }

  return (
    <div className="cooking-recipes-view">
      <header className="cooking-section-header">
        <div><span className="text-label">Meals worth repeating</span><h2 className="font-pixel">Cookbook</h2><p>A small collection that grows naturally.</p></div>
        <div><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search meals or ingredients…" aria-label="Search recipes" /><button type="button" className={favoritesOnly ? "is-selected" : ""} onClick={() => setFavoritesOnly((current) => !current)}>★ Favorites</button><button type="button" className={groupBySection ? "is-selected" : ""} onClick={() => setGroupBySection((current) => !current)} disabled={!menuSections.length}>Group sections</button><button type="button" className="cooking-primary-button" onClick={() => setSelected(null)}>＋ New recipe</button></div>
      </header>

      <div className="cooking-cookbook-paper">
        <div className="cooking-menu-heading"><span>The Momentum cookbook</span><strong>Evan’s Kitchen</strong><p>Meals worth making again.</p><small>{filtered.length} {filtered.length === 1 ? "recipe" : "recipes"}</small></div>
        {groupBySection && grouped.length
          ? <div className="cooking-menu-groups">{grouped.map(([section, sectionRecipes]) => <section key={section}><header><strong>{section}</strong><small>{sectionRecipes.length}</small></header><div className="cooking-recipe-grid">{sectionRecipes.map(renderRecipeCard)}</div></section>)}</div>
          : <div className="cooking-recipe-grid">{filtered.map(renderRecipeCard)}{!filtered.length && <button type="button" className="cooking-empty-recipes" onClick={() => setSelected(null)}><span>＋</span><strong>{recipes.length ? "No meals match that search." : "Remember your first meal."}</strong><small>{recipes.length ? "Try a different ingredient or filter." : "Start with something you already cook and love."}</small></button>}</div>}
      </div>

      <RecipeModal
        key={selected === undefined ? "closed" : selected?.id ?? "new"}
        open={selected !== undefined}
        recipe={selected ?? null}
        onClose={() => setSelected(undefined)}
        onSave={(input) => selected ? onUpdate(selected, input) : onCreate(input)}
        onDelete={selected ? () => onDelete(selected) : undefined}
        history={selected?.id ? historyByRecipeId.get(selected.id) : undefined}
        menuSections={menuSections}
      />
    </div>
  );
}
