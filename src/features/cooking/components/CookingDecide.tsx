import { useMemo, useState } from "react";

import type { CookingRecipe } from "../../../database/db";

type CookingDecideProps = {
  recipes: CookingRecipe[];
  todayKey: string;
  onPlan: (recipe: CookingRecipe, date: string) => Promise<void>;
  onOpenRecipes: () => void;
};

function pickRecipes(recipes: CookingRecipe[], offset: number) {
  if (recipes.length <= 3) return recipes;
  return [...recipes]
    .sort((a, b) => {
      const aScore = ((a.id ?? 0) * 17 + offset * 31) % 101 + (a.favorite ? 20 : 0);
      const bScore = ((b.id ?? 0) * 17 + offset * 31) % 101 + (b.favorite ? 20 : 0);
      return bScore - aScore;
    })
    .slice(0, 3);
}

export default function CookingDecide({ recipes, todayKey, onPlan, onOpenRecipes }: CookingDecideProps) {
  const [shuffle, setShuffle] = useState(0);
  const [date, setDate] = useState(todayKey);
  const suggestions = useMemo(() => pickRecipes(recipes, shuffle), [recipes, shuffle]);

  return (
    <div className="cooking-decide-view">
      <header><span className="text-label">Decision helper</span><h2 className="font-quote">What should I make?</h2><p>Three ideas from meals you already know you like.</p></header>
      {suggestions.length ? <>
        <div className="cooking-suggestion-grid">{suggestions.map((recipe, index) => <article key={recipe.id} className={`cooking-suggestion cooking-tone-${["saffron", "sage", "plum"][index]}`}>
          <span>0{index + 1}</span><div><small>{recipe.tags[0] ?? "From your cookbook"}</small><h3 className="font-quote">{recipe.name}</h3><p>{recipe.ingredients.slice(0, 3).map((item) => item.name).join(" · ") || "A familiar favorite"}</p></div><button type="button" onClick={() => onPlan(recipe, date)}>Add to week →</button>
        </article>)}</div>
        <footer><label><span>Plan for</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><button type="button" onClick={() => setShuffle((value) => value + 1)}>↻ Shuffle again</button></footer>
      </> : <div className="cooking-decide-empty cooking-card"><span>3</span><h3>Add three meals to unlock suggestions.</h3><p>Momentum only recommends food from your own cookbook.</p><button type="button" onClick={onOpenRecipes}>Build cookbook →</button></div>}
    </div>
  );
}
