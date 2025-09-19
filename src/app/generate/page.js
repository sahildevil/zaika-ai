"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRecipes } from "../../context/RecipeContext";
import IngredientSelector from "../../components/IngredientSelector";
import RecipeCard from "../../components/RecipeCard";
import LoadingSpinner from "../../components/LoadingSpinner";

const DIETS = ["Vegan", "Veg", "Non-Veg", "Keto", "Jain", "Gluten-Free"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
const CALORIE_RANGES = ["Low", "Medium", "High", "Custom"];

export default function GeneratePage() {
  const params = useSearchParams();
  const preFasting = params.get("fasting") === "true";
  const preCalorie = params.get("calorie");

  const { generateRecipe, generatedRecipe, saveGenerated, user } = useRecipes();
  const [diet, setDiet] = useState("Veg");
  const [mealType, setMealType] = useState("Lunch");
  const [calorieRange, setCalorieRange] = useState(
    preCalorie
      ? preCalorie.charAt(0).toUpperCase() + preCalorie.slice(1)
      : "Medium"
  );
  const [customCalories, setCustomCalories] = useState(500);
  const [fasting, setFasting] = useState(preFasting);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    if (ingredients.length < 3) return alert("Select at least 3 ingredients");
    setLoading(true);
    setTimeout(() => {
      // simulate latency
      generateRecipe({
        diet,
        mealType,
        calorieRange,
        customCalories,
        fasting,
        ingredients,
      });
      setLoading(false);
    }, 600);
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold tracking-tight text-white/90">
        AI Recipe Generator
      </h2>
      <form
        onSubmit={onSubmit}
        className="space-y-6 glass p-6 rounded-2xl border border-white/10"
      >
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Diet Type
            </label>
            <select
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className="w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]"
            >
              {DIETS.map((d) => (
                <option key={d} className="bg-[var(--background-alt)]">
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Meal Type
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]"
            >
              {MEAL_TYPES.map((m) => (
                <option key={m} className="bg-[var(--background-alt)]">
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Calorie Range
            </label>
            <select
              value={calorieRange}
              onChange={(e) => setCalorieRange(e.target.value)}
              className="w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]"
            >
              {CALORIE_RANGES.map((c) => (
                <option key={c} className="bg-[var(--background-alt)]">
                  {c}
                </option>
              ))}
            </select>
            {calorieRange === "Custom" && (
              <input
                type="number"
                value={customCalories}
                onChange={(e) => setCustomCalories(Number(e.target.value))}
                className="mt-2 w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]"
              />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Fasting Mode
            </label>
            <div className="flex gap-4 items-center text-sm text-white/80">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={fasting}
                  onChange={(e) => setFasting(e.target.checked)}
                  className="accent-[rgb(var(--accent-rgb))] h-4 w-4"
                />{" "}
                Enable Fasting Restrictions
              </label>
            </div>
            {fasting && (
              <p className="text-[10px] text-white/45">
                Removes onion, garlic, meat automatically.
              </p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Ingredients (pick ≥ 3)
          </label>
          <IngredientSelector
            value={ingredients}
            onChange={setIngredients}
            fasting={fasting}
          />
        </div>
        <button
          disabled={loading}
          type="submit"
          className="relative group rounded-xl px-5 py-2.5 text-sm font-medium text-white bg-[linear-gradient(120deg,rgba(var(--accent-rgb)/0.25),rgba(var(--accent-rgb)/0.1))] border border-[rgba(var(--accent-rgb)/0.5)] hover:bg-[linear-gradient(120deg,rgba(var(--accent-rgb)/0.4),rgba(var(--accent-rgb)/0.15))] disabled:opacity-50"
        >
          <span className="relative z-10">Generate Recipe</span>
          <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition shadow-[0_0_0_1px_rgba(var(--accent-rgb)/0.4),0_0_18px_-2px_rgba(var(--accent-rgb)/0.5)]" />
        </button>
      </form>

      {loading && <LoadingSpinner />}

      {generatedRecipe && !loading && (
        <div className="space-y-4">
          <h3 className="font-semibold text-white/85">Generated Recipe</h3>
          <RecipeCard
            recipe={generatedRecipe}
            onSave={user ? saveGenerated : undefined}
          />
          {!user && <p className="text-xs text-white/45">Sign in to save.</p>}
        </div>
      )}
    </div>
  );
}
