import {
  cookingMealSlots,
  type CookingActivityIdentity,
  type CookingMealSlot,
} from "../cookingCatalog";

import "./cooking-identity-picker.css";

type CookingIdentityPickerProps = {
  identity: CookingActivityIdentity;
  mealSlot: CookingMealSlot;
  onIdentityChange: (identity: Exclude<CookingActivityIdentity, "unclassified">) => void;
  onMealSlotChange: (slot: CookingMealSlot) => void;
  compact?: boolean;
  showUnclassifiedNote?: boolean;
};

export default function CookingIdentityPicker({
  identity,
  mealSlot,
  onIdentityChange,
  onMealSlotChange,
  compact = false,
  showUnclassifiedNote = false,
}: CookingIdentityPickerProps) {
  return (
    <div className={`cooking-identity-picker ${compact ? "is-compact" : ""}`}>
      {showUnclassifiedNote && identity === "unclassified" && (
        <p>This older Cooking task has not been classified yet. Nothing changes until you choose.</p>
      )}
      <div className="cooking-identity-kind" role="group" aria-label="Cooking activity type">
        <button
          type="button"
          className={identity === "meal" ? "is-selected" : ""}
          aria-pressed={identity === "meal"}
          onClick={() => onIdentityChange("meal")}
        >
          Meal
        </button>
        <button
          type="button"
          className={identity === "task" ? "is-selected" : ""}
          aria-pressed={identity === "task"}
          onClick={() => onIdentityChange("task")}
        >
          Prep / kitchen task
        </button>
      </div>
      {identity === "meal" && (
        <div className="cooking-identity-slots" role="group" aria-label="Meal slot">
          {cookingMealSlots.map((slot) => (
            <button
              type="button"
              key={slot.id}
              className={mealSlot === slot.id ? "is-selected" : ""}
              aria-pressed={mealSlot === slot.id}
              onClick={() => onMealSlotChange(slot.id)}
            >
              {slot.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
