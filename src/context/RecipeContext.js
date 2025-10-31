"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { supabase } from "../lib/supabaseClient";

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
  const [preferences, setPreferences] = useState({
    spice: "Medium",
    servings: 1,
  });

  // Initialize from Supabase session, then hydrate local fallback state
  useEffect(() => {
    // Supabase session
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const s = data?.session;
      if (s?.user) {
        setUser({ id: s.user.id, name: s.user.user_metadata?.name || s.user.email, email: s.user.email });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, name: session.user.user_metadata?.name || session.user.email, email: session.user.email });
      } else {
        setUser(null);
      }
    });
    // Local fallback
    try {
      const raw = localStorage.getItem("zaika-state");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.savedRecipes)) setSavedRecipes(parsed.savedRecipes);
        if (Array.isArray(parsed.communityRecipes))
          setCommunityRecipes((prev) => {
            const byId = new Map([...prev, ...parsed.communityRecipes].map((r) => [r.id, r]));
            return Array.from(byId.values());
          });
      }
    } catch {}
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Persist to localStorage (throttled by React batching)
  useEffect(() => {
    try {
      const payload = JSON.stringify({
        user,
        savedRecipes,
        communityRecipes,
        preferences,
      });
      localStorage.setItem("zaika-state", payload);
    } catch {}
  }, [user, savedRecipes, communityRecipes, preferences]);

  // Auth via Supabase
  const signIn = useCallback(async (arg) => {
    if (typeof arg === "string") {
      // Magic link sign-in if only email is provided
      const { error } = await supabase.auth.signInWithOtp({ email: arg, options: { emailRedirectTo: window.location.origin } });
      if (error) return false;
      return true;
    }
    const { email, password } = arg || {};
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false;
    const u = data.user;
    setUser({ id: u.id, name: u.user_metadata?.name || u.email, email: u.email });
    // Ensure profile row exists now that we have a session
    try {
      await supabase.from("profiles").upsert({ id: u.id, name: u.user_metadata?.name || u.email, email: u.email });
    } catch {}
    return true;
  }, []);

  const signUp = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: password || Math.random().toString(36).slice(2, 10),
      options: { data: { name } },
    });
    if (error) throw error;
    const u = data.user;
    // Create/update profile row for the user
    if (u) {
      try {
        await supabase.from("profiles").upsert({ id: u.id, name: name || u.email, email: u.email });
      } catch {}
    }
    // Do not set local user here; require explicit sign-in as requested
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);
  const updateProfile = useCallback((name, email) => {
    setUser((u) =>
      u ? { ...u, name: name ?? u.name, email: email ?? u.email } : u
    );
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
          const id =
            d.id || String(Date.now()) + Math.random().toString(36).slice(2, 7);
          byId.set(id, {
            ...d,
            id,
            authorId: user?.id || null,
            tags: d.tags || buildTags(form),
          });
        }
        return Array.from(byId.values());
      });
      // Persist to Supabase if signed in
      try {
        if (user?.id && dishes.length) {
          const payload = dishes.map((d) => ({
            title: d.title,
            image: d.image || d.fallbackImage || null,
            tags: d.tags || buildTags(form),
            ingredients: d.ingredients || [],
            steps: d.steps || [],
            nutrition: d.nutrition || null,
            calories: d?.nutrition?.calories || d?.calories || null,
            user_id: user.id,
          }));
          await supabase.from("recipes").insert(payload);
        }
      } catch {}
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

  const saveGenerated = useCallback(
    (recipe) => {
      const item = recipe || generatedRecipe;
      if (!item) return;
      setSavedRecipes((r) =>
        r.some((x) => x.id === item.id) ? r : [...r, item]
      );
      setCommunityRecipes((r) =>
        r.some((x) => x.id === item.id) ? r : [...r, item]
      );
    },
    [generatedRecipe]
  );

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
        (r) =>
          filterTags.length === 0 || filterTags.every((t) => r.tags.includes(t))
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
      generatedBatch,
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
    <RecipeContext.Provider value={contextValue}>
      {children}
    </RecipeContext.Provider>
  );
}

export const useRecipes = () => {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error("useRecipes must be used within RecipeProvider");
  return ctx;
};
