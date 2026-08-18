import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";

import type { CookingRecipe } from "../../../database/db";
import type { CookingRecipeInput, RecipeIngredientInput } from "../services/recipeService";
import { processRecipeCoverImage } from "../services/recipeImageService";
import type { RecipeCookingHistory } from "../services/recipeHistoryService";

type RecipeModalProps = {
  recipe: CookingRecipe | null;
  open: boolean;
  onClose: () => void;
  onSave: (input: CookingRecipeInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  history?: RecipeCookingHistory;
  menuSections: string[];
};

const knownUnits = new Set(["tsp", "tbsp", "cup", "cups", "oz", "lb", "lbs", "g", "kg", "ml", "l", "clove", "cloves", "can", "cans"]);

function ingredientToLine(ingredient: CookingRecipe["ingredients"][number]) {
  return [ingredient.quantity, ingredient.unit, ingredient.name].filter(Boolean).join(" ");
}

function parseIngredient(line: string): RecipeIngredientInput {
  const parts = line.trim().split(/\s+/);
  const quantity = Number(parts[0]);
  const hasQuantity = Number.isFinite(quantity) && quantity > 0;
  const unitCandidate = parts[hasQuantity ? 1 : 0]?.toLowerCase();
  const hasUnit = Boolean(unitCandidate && knownUnits.has(unitCandidate));
  const nameStart = (hasQuantity ? 1 : 0) + (hasUnit ? 1 : 0);
  return {
    name: parts.slice(nameStart).join(" ") || line.trim(),
    quantity: hasQuantity ? quantity : undefined,
    unit: hasUnit ? parts[nameStart - 1] : undefined,
  };
}

export default function RecipeModal({ recipe, open, onClose, onSave, onDelete, history, menuSections }: RecipeModalProps) {
  const [name, setName] = useState(recipe?.name ?? "");
  const [coverImageDataUrl, setCoverImageDataUrl] = useState(recipe?.coverImageDataUrl);
  const [menuSection, setMenuSection] = useState(recipe?.menuSection ?? "");
  const [servings, setServings] = useState(recipe?.defaultServings ?? 2);
  const [prepMinutes, setPrepMinutes] = useState(recipe?.prepMinutes ?? 30);
  const [tags, setTags] = useState(recipe?.tags.join(", ") ?? "");
  const [ingredients, setIngredients] = useState(recipe?.ingredients.map(ingredientToLine).join("\n") ?? "");
  const [instructions, setInstructions] = useState(recipe?.instructions.join("\n") ?? "");
  const [notes, setNotes] = useState(recipe?.notes ?? "");
  const [favorite, setFavorite] = useState(recipe?.favorite ?? false);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose, open]);

  if (!open) return null;

  async function acceptImage(file?: File) {
    if (!file || processingImage) return;
    setProcessingImage(true);
    setImageError("");
    try {
      setCoverImageDataUrl(await processRecipeCoverImage(file));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Momentum could not use that image.");
    } finally {
      setProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void acceptImage(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void acceptImage(event.dataTransfer.files?.[0]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({
        name,
        coverImageDataUrl,
        menuSection,
        defaultServings: servings,
        prepMinutes,
        tags: tags.split(","),
        ingredients: ingredients.split("\n").map(parseIngredient),
        instructions: instructions.split("\n"),
        notes,
        favorite,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const target = document.querySelector(".experience-root") ?? document.body;
  return createPortal(
    <div className="cooking-modal-layer">
      <button type="button" className="cooking-modal-backdrop" onClick={onClose} aria-label="Close recipe" />
      <form className="cooking-recipe-modal" onSubmit={submit}>
        <header>
          <div><span className="text-label">{recipe ? "Personal cookbook" : "New recipe"}</span><h2>{recipe ? recipe.name : "Remember a meal"}</h2></div>
          {recipe && <div className="cooking-recipe-history"><span><strong>{history?.timesMade ?? 0}</strong><small>{history?.timesMade === 1 ? "time made" : "times made"}</small></span><span><strong>{history?.lastMadeDate ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${history.lastMadeDate}T00:00:00`)) : "—"}</strong><small>last made</small></span></div>}
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="cooking-recipe-fields">
          <div className="cooking-cover-field cooking-field-wide" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} tabIndex={-1} aria-hidden="true" />
            {coverImageDataUrl
              ? <div className="cooking-cover-preview"><img src={coverImageDataUrl} alt={`${name || "Recipe"} cover`} /><span><button type="button" onClick={() => fileInputRef.current?.click()} disabled={processingImage}>Replace photo</button><button type="button" onClick={() => setCoverImageDataUrl(undefined)}>Remove</button></span></div>
              : <button type="button" className="cooking-cover-upload" onClick={() => fileInputRef.current?.click()} disabled={processingImage}><span>＋</span><strong>{processingImage ? "Preparing image…" : "Add a cover photo"}</strong><small>Choose or drop an image · Momentum resizes it for you</small></button>}
            {imageError && <p role="alert">{imageError}</p>}
          </div>
          <label className="cooking-field-wide"><span>Recipe name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Japanese curry" autoFocus /></label>
          <label className="cooking-field-wide"><span>Menu section · optional</span><input value={menuSection} onChange={(event) => setMenuSection(event.target.value)} list="cooking-menu-sections" placeholder="Weeknight dinners" /><datalist id="cooking-menu-sections">{menuSections.map((section) => <option key={section} value={section} />)}</datalist></label>
          <label><span>Servings</span><input type="number" min="1" max="30" value={servings} onChange={(event) => setServings(Number(event.target.value))} /></label>
          <label><span>Prep + cook</span><span className="cooking-input-unit"><input type="number" min="1" value={prepMinutes} onChange={(event) => setPrepMinutes(Number(event.target.value))} /><small>min</small></span></label>
          <label className="cooking-field-wide"><span>Tags</span><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Japanese, Comfort, Easy" /></label>
          <label className="cooking-field-wide"><span>Ingredients · one per line</span><textarea value={ingredients} onChange={(event) => setIngredients(event.target.value)} rows={7} placeholder={"1 lb chicken thighs\n2 potatoes\n1 onion\nCurry blocks"} /></label>
          <label className="cooking-field-wide"><span>Instructions · one step per line</span><textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={7} placeholder={"Brown the chicken\nAdd vegetables and water\nSimmer until tender"} /></label>
          <label className="cooking-field-wide"><span>Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Anything worth remembering next time…" /></label>
          <button type="button" className={`cooking-favorite-toggle ${favorite ? "is-selected" : ""}`} onClick={() => setFavorite((current) => !current)}>{favorite ? "★ Favorite" : "☆ Add to favorites"}</button>
        </div>
        <footer>
          {recipe && onDelete && <button type="button" className={confirmingDelete ? "is-danger" : ""} onClick={async () => {
            if (!confirmingDelete) { setConfirmingDelete(true); return; }
            await onDelete(); onClose();
          }}>{confirmingDelete ? "Confirm delete" : "Delete"}</button>}
          <span />
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={!name.trim() || saving}>{saving ? "Saving…" : recipe ? "Save changes" : "Save recipe"}</button>
        </footer>
      </form>
    </div>,
    target
  );
}
