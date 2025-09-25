"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";

/*
  RecipeContext provides temporary in-memory state for:
  - auth (mock user)
  - generated recipes
  - community recipes (shared)
  - tag filtering
  This is a frontend-only scaffold; replace with real API calls later.
*/

const defaultUser = null;

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
  const [generatedBatch, setGeneratedBatch] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [communityRecipes, setCommunityRecipes] = useState(initialCommunity);
  const [filterTags, setFilterTags] = useState([]);
  const [preferences, setPreferences] = useState({ spice: "Medium", servings: 1 });

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("zaika-state");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.user !== undefined) setUser(parsed.user);
      if (Array.isArray(parsed.savedRecipes)) setSavedRecipes(parsed.savedRecipes);
      if (Array.isArray(parsed.communityRecipes))
        setCommunityRecipes((prev) => {
          // Merge by id to keep seed items while allowing user-created additions
          const byId = new Map([...prev, ...parsed.communityRecipes].map((r) => [r.id, r]));
          return Array.from(byId.values());
        });
    } catch {}
  }, []);

  // Persist to localStorage (throttled by React batching)
  useEffect(() => {
    try {
      const payload = JSON.stringify({ user, savedRecipes, communityRecipes, preferences });
      localStorage.setItem("zaika-state", payload);
    } catch {}
  }, [user, savedRecipes, communityRecipes, preferences]);

  // Hardcoded demo users
  const demoUsers = useMemo(
    () => [
      { id: "u1", name: "Demo User", email: "demo@zaika.ai", password: "zaika123" },
      { id: "u2", name: "Chef Asha", email: "asha@zaika.ai", password: "tastebud" },
    ],
    []
  );

  const signIn = useCallback((email) => {
    // Backward compatibility if only email is provided (older UI)
    if (typeof email === "string") {
      const match = demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (match) {
        setUser({ id: match.id, name: match.name, email: match.email });
        return true;
      }
      setUser({ id: "u1", name: "Demo User", email });
      return true;
    }
    // If called with object { email, password }
    const creds = email;
    const match = demoUsers.find(
      (u) =>
        u.email.toLowerCase() === String(creds?.email || "").toLowerCase() &&
        u.password === creds?.password
    );
    if (match) {
      setUser({ id: match.id, name: match.name, email: match.email });
      return true;
    }
    return false;
  }, [demoUsers]);
  const signUp = useCallback((name, email) => {
    setUser({ id: Date.now().toString(), name, email });
  }, []);
  const signOut = useCallback(() => setUser(null), []);
  const updateProfile = useCallback((name, email) => {
    setUser((u) => (u ? { ...u, name: name ?? u.name, email: email ?? u.email } : u));
  }, []);
  const updatePreferences = useCallback((next) => {
    setPreferences((p) => ({ ...p, ...next }));
  }, []);

  const generateRecipe = useCallback(
    async (form) => {
      // Call server API (Gemini)
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      const dishes = Array.isArray(data?.dishes) ? data.dishes : [];
      setGeneratedBatch(dishes);
      const first = dishes[0] || null;
      setGeneratedRecipe(first);
      // Share all to community with unique ids
      setCommunityRecipes((prev) => {
        const byId = new Map(prev.map((r) => [r.id, r]));
        for (const d of dishes) {
          const id = d.id || String(Date.now()) + Math.random().toString(36).slice(2, 7);
          byId.set(id, { ...d, id, authorId: user?.id || null, tags: d.tags || buildTags(form) });
        }
        return Array.from(byId.values());
      });
      return dishes;
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

  const isSaved = useCallback(
    (id) => savedRecipes.some((r) => r.id === id),
    [savedRecipes]
  );

  const saveGenerated = useCallback((recipe) => {
    const item = recipe || generatedRecipe;
    if (!item) return;
    setSavedRecipes((r) => (r.some((x) => x.id === item.id) ? r : [...r, item]));
    setCommunityRecipes((r) => (r.some((x) => x.id === item.id) ? r : [...r, item]));
  }, [generatedRecipe]);

  const removeSaved = useCallback((id) => {
    setSavedRecipes((r) => r.filter((x) => x.id !== id));
  }, []);

  const saveById = useCallback(
    (id) => {
      setSavedRecipes((r) => {
        if (r.some((x) => x.id === id)) return r;
        const item = communityRecipes.find((x) => x.id === id);
        return item ? [...r, item] : r;
      });
    },
    [communityRecipes]
  );

  const toggleSave = useCallback(
    (id) => {
      setSavedRecipes((r) =>
        r.some((x) => x.id === id)
          ? r.filter((x) => x.id !== id)
          : (() => {
              const item = communityRecipes.find((x) => x.id === id);
              return item ? [...r, item] : r;
            })()
      );
    },
    [communityRecipes]
  );

  const toggleTag = useCallback((tag) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const filteredCommunity = useMemo(
    () =>
      communityRecipes.filter(
        (r) => filterTags.length === 0 || filterTags.every((t) => r.tags.includes(t))
      ),
    [communityRecipes, filterTags]
  );

  const contextValue = useMemo(
    () => ({
      user,
      signIn,
      signUp,
      signOut,
      updateProfile,
      preferences,
      updatePreferences,
      generateRecipe,
      generatedRecipe,
      generatedBatch,
      saveGenerated,
      removeSaved,
      isSaved,
      saveById,
      toggleSave,
      savedRecipes,
      communityRecipes: filteredCommunity,
      allCommunity: communityRecipes,
      filterTags,
      toggleTag,
    }),
    [
      user,
      signIn,
      signUp,
      signOut,
      updateProfile,
      preferences,
      updatePreferences,
      generateRecipe,
      generatedRecipe,
      saveGenerated,
      removeSaved,
      isSaved,
      saveById,
      toggleSave,
      savedRecipes,
      filteredCommunity,
      communityRecipes,
      filterTags,
      toggleTag,
    ]
  );

  return (
    <RecipeContext.Provider value={contextValue}>{children}</RecipeContext.Provider>
  );
}

export const useRecipes = () => {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error("useRecipes must be used within RecipeProvider");
  return ctx;
};
