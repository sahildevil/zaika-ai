"use client";
import { createContext, useContext, useState, useCallback } from "react";

/*
  RecipeContext provides temporary in-memory state for:
  - auth (mock user)
  - generated recipes
  - community recipes (shared)
  - tag filtering
  This is a frontend-only scaffold; replace with real API calls later.
*/

const defaultUser = { id: "u1", name: "Demo User", email: "demo@zaika.ai" };

const initialCommunity = [
  {
    id: "r1",
    title: "Sabudana Khichdi",
    diet: "Veg",
    fasting: true,
    calories: 320,
    tags: ["Fasting", "Low Calorie", "Regional"],
    ingredients: ["Sabudana", "Peanuts", "Potato", "Ghee", "Cumin"],
    steps: [
      "Soak sabudana 4-5 hours",
      "Roast peanuts & crush",
      "Temper cumin, green chili, potatoes",
      "Add sabudana, peanuts, salt, cook till translucent",
    ],
    nutrition: { protein: 6, carbs: 54, fat: 10 },
  },
];

const RecipeContext = createContext(null);

export function RecipeProvider({ children }) {
  const [user, setUser] = useState(defaultUser); // null means signed out
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [communityRecipes, setCommunityRecipes] = useState(initialCommunity);
  const [filterTags, setFilterTags] = useState([]);

  const signIn = (email) => {
    setUser({ id: "u1", name: "Demo User", email });
  };
  const signUp = (name, email) => {
    setUser({ id: Date.now().toString(), name, email });
  };
  const signOut = () => setUser(null);

  const generateRecipe = useCallback(
    (form) => {
      // Mock AI generation logic
      const id = Date.now().toString();
      const baseTitle = `${form.fasting ? "Fasting " : ""}${form.diet} ${
        form.mealType
      } Bowl`;
      const ingredients = form.ingredients.map((i) => ({
        name: i,
        quantity: "1 unit",
      }));
      const recipe = {
        id,
        title: baseTitle,
        diet: form.diet,
        mealType: form.mealType,
        fasting: form.fasting,
        calories:
          form.calorieRange === "Custom"
            ? form.customCalories
            : form.calorieRange === "Low"
            ? 300
            : form.calorieRange === "Medium"
            ? 500
            : 750,
        ingredients,
        steps: [
          "Prep all ingredients.",
          "Combine in pan / bowl as appropriate.",
          "Season to taste.",
          "Serve warm.",
        ],
        nutrition: { protein: 20, carbs: 45, fat: 15 },
        youtube:
          "https://www.youtube.com/results?search_query=" +
          encodeURIComponent(baseTitle + " recipe"),
        tags: buildTags(form),
        createdAt: new Date().toISOString(),
        authorId: user?.id || null,
      };
      setGeneratedRecipe(recipe);
      return recipe;
    },
    [user]
  );

  function buildTags(form) {
    const tags = [];
    if (form.fasting) tags.push("Fasting");
    if (form.calorieRange === "Low") tags.push("Low Calorie");
    if (["Vegan", "Veg", "Jain"].includes(form.diet)) tags.push("Plant Based");
    if (form.diet === "Keto") tags.push("High Fat");
    return tags;
  }

  const saveGenerated = () => {
    if (!generatedRecipe) return;
    setSavedRecipes((r) => [...r, generatedRecipe]);
    setCommunityRecipes((r) => [...r, generatedRecipe]);
  };

  const toggleTag = (tag) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredCommunity = communityRecipes.filter(
    (r) =>
      filterTags.length === 0 || filterTags.every((t) => r.tags.includes(t))
  );

  return (
    <RecipeContext.Provider
      value={{
        user,
        signIn,
        signUp,
        signOut,
        generateRecipe,
        generatedRecipe,
        saveGenerated,
        savedRecipes,
        communityRecipes: filteredCommunity,
        allCommunity: communityRecipes,
        filterTags,
        toggleTag,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export const useRecipes = () => {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error("useRecipes must be used within RecipeProvider");
  return ctx;
};
