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

const defaultUser = null;

const initialCommunity = [
  {
    id: "r1",
    title: "Sabudana Khichdi",
    diet: "Veg",
    fasting: true,
    calories: 320,
    tags: ["Fasting", "Low Calorie", "Regional"],
    ingredients: [
      { name: "Sabudana", quantity: "200g" },
      { name: "Peanuts", quantity: "50g" },
      { name: "Potato", quantity: "1 medium" },
      { name: "Ghee", quantity: "2 tbsp" },
      { name: "Cumin", quantity: "1 tsp" },
    ],
    steps: [
      "Soak sabudana 4-5 hours",
      "Roast peanuts & crush",
      "Temper cumin, green chili, potatoes",
      "Add sabudana, peanuts, salt, cook till translucent",
    ],
    nutrition: { protein: 6, carbs: 54, fat: 10, calories: 320 },
  },
];

const RecipeContext = createContext(null);

export function RecipeProvider({ children }) {
  const [user, setUser] = useState(defaultUser);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [generatedBatch, setGeneratedBatch] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [communityRecipes, setCommunityRecipes] = useState(initialCommunity);
  const [filterTags, setFilterTags] = useState([]);
  const [preferences, setPreferences] = useState({
    spice: "Medium",
    servings: 1,
  });
  const [loading, setLoading] = useState(true);

  // Initialize from Supabase session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          const userData = {
            id: session.user.id,
            name:
              session.user.user_metadata?.name ||
              session.user.email?.split("@")[0] ||
              "User",
            email: session.user.email,
          };
          setUser(userData);

          // Ensure profile exists
          await supabase.from("profiles").upsert(
            {
              id: session.user.id,
              name: userData.name,
              email: userData.email,
            },
            { onConflict: "id" }
          );

          // Load user preferences
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile?.preferences) {
            setPreferences((prev) => ({ ...prev, ...profile.preferences }));
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userData = {
          id: session.user.id,
          name:
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "User",
          email: session.user.email,
        };
        setUser(userData);
      } else {
        setUser(null);
      }
    });

    // Load from localStorage
    try {
      const raw = localStorage.getItem("zaika-state");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.savedRecipes))
          setSavedRecipes(parsed.savedRecipes);
        if (parsed.preferences)
          setPreferences((prev) => ({ ...prev, ...parsed.preferences }));
      }
    } catch (error) {
      console.error("LocalStorage load error:", error);
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (loading) return;
    try {
      const payload = JSON.stringify({
        savedRecipes,
        preferences,
      });
      localStorage.setItem("zaika-state", payload);
    } catch (error) {
      console.error("LocalStorage save error:", error);
    }
  }, [savedRecipes, preferences, loading]);

  const signIn = useCallback(async (arg) => {
    try {
      if (typeof arg === "string") {
        const { error } = await supabase.auth.signInWithOtp({
          email: arg,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        return true;
      }

      const { email, password } = arg || {};
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const u = data.user;
      const userData = {
        id: u.id,
        name: u.user_metadata?.name || u.email?.split("@")[0] || "User",
        email: u.email,
      };
      setUser(userData);

      await supabase.from("profiles").upsert(
        {
          id: u.id,
          name: userData.name,
          email: userData.email,
        },
        { onConflict: "id" }
      );

      return true;
    } catch (error) {
      console.error("Sign in error:", error);
      return false;
    }
  }, []);

  const signUp = useCallback(async (name, email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || Math.random().toString(36).slice(2, 10),
        options: {
          data: { name },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      if (data.user) {
        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            name: name || email.split("@")[0],
            email: email,
          },
          { onConflict: "id" }
        );
      }

      return true;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSavedRecipes([]);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, []);

  const updateProfile = useCallback(
    async (name, email) => {
      if (!user?.id) return;

      try {
        setUser((u) =>
          u ? { ...u, name: name ?? u.name, email: email ?? u.email } : u
        );

        await supabase.from("profiles").upsert(
          {
            id: user.id,
            name,
            email,
          },
          { onConflict: "id" }
        );

        await supabase.auth.updateUser({
          data: { name },
        });
      } catch (error) {
        console.error("Update profile error:", error);
      }
    },
    [user?.id]
  );

  const updatePreferences = useCallback(
    async (next) => {
      setPreferences((p) => {
        const updated = { ...p, ...next };

        if (user?.id) {
          supabase
            .from("profiles")
            .update({
              preferences: updated,
            })
            .eq("id", user.id)
            .then(() => {})
            .catch(console.error);
        }

        return updated;
      });
    },
    [user?.id]
  );

  const generateRecipe = useCallback(
    async (form) => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Generation failed");
        }

        const data = await res.json();
        const dishes = Array.isArray(data?.dishes) ? data.dishes : [];

        if (dishes.length === 0) {
          throw new Error("No recipes generated");
        }

        setGeneratedBatch(dishes);
        setGeneratedRecipe(dishes[0] || null);

        // Add to community
        setCommunityRecipes((prev) => {
          const byId = new Map(prev.map((r) => [r.id, r]));
          for (const d of dishes) {
            const id =
              d.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
        if (user?.id && dishes.length) {
          try {
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
          } catch (error) {
            console.error("Failed to save to Supabase:", error);
          }
        }

        return dishes;
      } catch (error) {
        console.error("Generate recipe error:", error);
        throw error;
      }
    },
    [user]
  );

  function buildTags(form) {
    const tags = [];
    if (form.fasting) tags.push("Fasting");
    if (form.calorieRange === "Low") tags.push("Low Calorie");
    if (["Vegan", "Veg", "Jain"].includes(form.diet)) tags.push("Plant Based");
    if (form.diet === "Keto") tags.push("High Fat");
    if (form.diet) tags.push(form.diet);
    if (form.mealType) tags.push(form.mealType);
    return [...new Set(tags)];
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
          filterTags.length === 0 || filterTags.some((t) => r.tags?.includes(t))
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
      loading,
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
      loading,
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
