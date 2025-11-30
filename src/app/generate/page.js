"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useTransition } from "react";
import { useRecipes } from "../../context/RecipeContext";
import IngredientSelector from "../../components/IngredientSelector";
import RecipeCard from "../../components/RecipeCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import RecipeModal from "../../components/RecipeModal";

const DIETS = ["Vegan", "Veg", "Non-Veg", "Keto", "Jain", "Gluten-Free"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
const CALORIE_RANGES = ["Low", "Medium", "High", "Custom"];

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="text-white/60 text-sm">Loading…</div>}>
      <GeneratePageContent />
    </Suspense>
  );
}

function GeneratePageContent() {
  const params = useSearchParams();
  const preFasting = params.get("fasting") === "true";
  const preCalorie = params.get("calorie");

  const {
    generateRecipe,
    generatedRecipe,
    generatedBatch,
    saveGenerated,
    user,
  } = useRecipes();
  const [activeRecipe, setActiveRecipe] = useState(null);
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
  const [servings, setServings] = useState(1);
  const [spiceLevel, setSpiceLevel] = useState("Medium");
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canSubmit = useMemo(
    () => ingredients.length >= 3 && !loading && !isPending,
    [ingredients.length, loading, isPending]
  );

  function onSubmit(e) {
    e.preventDefault();
    if (ingredients.length < 3) {
      setError("Select at least 3 ingredients");
      return;
    }
    setError("");
    setSuccessMessage("");
    setLoading(true);
    startTransition(async () => {
      try {
        const dishes = await generateRecipe({
          diet,
          mealType,
          calorieRange,
          customCalories,
          fasting,
          ingredients,
          servings,
          spiceLevel,
        });
        setSuccessMessage(
          `Successfully generated ${dishes.length} recipe${
            dishes.length > 1 ? "s" : ""
          }!`
        );
      } catch (e) {
        setError(e?.message || "Failed to generate recipe. Please try again.");
      } finally {
        setLoading(false);
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-white/90">
          AI Recipe Generator
        </h2>
        <p className="text-sm text-white/55">
          Customize your preferences and generate personalized recipes.
        </p>
      </div>

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
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Servings
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Spice Level
            </label>
            <select
              value={spiceLevel}
              onChange={(e) => setSpiceLevel(e.target.value)}
              className="w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]"
            >
              {["Mild", "Medium", "Hot"].map((lvl) => (
                <option key={lvl} className="bg-[var(--background-alt)]">
                  {lvl}
                </option>
              ))}
            </select>
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

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
            {successMessage}
          </div>
        )}

        <button
          disabled={!canSubmit}
          type="submit"
          className="relative group rounded-xl px-5 py-2.5 text-sm font-medium text-white bg-[linear-gradient(120deg,rgba(var(--accent-rgb)/0.25),rgba(var(--accent-rgb)/0.1))] border border-[rgba(var(--accent-rgb)/0.5)] hover:bg-[linear-gradient(120deg,rgba(var(--accent-rgb)/0.4),rgba(var(--accent-rgb)/0.15))] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <span className="relative z-10">
            {loading || isPending ? "Generating..." : "Generate Recipe"}
          </span>
          <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition shadow-[0_0_0_1px_rgba(var(--accent-rgb)/0.4),0_0_18px_-2px_rgba(var(--accent-rgb)/0.5)]" />
        </button>
      </form>

      {loading && <LoadingSpinner text="Cooking up something delicious..." />}

      {generatedBatch?.length > 0 && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white/85">
              AI Suggestions ({generatedBatch.length})
            </h3>
            {user && (
              <button
                onClick={() =>
                  generatedBatch.forEach((dish) => saveGenerated(dish))
                }
                className="text-xs px-3 py-1.5 rounded-lg border border-[rgba(var(--accent-rgb)/0.5)] hover:bg-[rgba(var(--accent-rgb)/0.15)] transition"
              >
                Save All
              </button>
            )}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {generatedBatch.map((dish) => (
              <RecipeCard
                key={dish.id || dish.title}
                recipe={dish}
                onSave={user ? () => saveGenerated(dish) : undefined}
                onView={() => setActiveRecipe(dish)}
              />
            ))}
          </div>
          {!user && (
            <p className="text-xs text-white/45 text-center">
              <a
                href="/auth/signin"
                className="text-[rgba(var(--accent-rgb)/0.9)] hover:underline"
              >
                Sign in
              </a>{" "}
              to save your generated recipes.
            </p>
          )}
        </div>
      )}
      <RecipeModal
        recipe={activeRecipe}
        onClose={() => setActiveRecipe(null)}
      />
    </div>
  );
}
