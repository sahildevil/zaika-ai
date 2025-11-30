"use client";
import { useRecipes } from "../../context/RecipeContext";
import TagFilter from "../../components/TagFilter";
import RecipeCard from "../../components/RecipeCard";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import RecipeModal from "../../components/RecipeModal";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="text-white/60 text-sm">Loading…</div>}>
      <CommunityPageContent />
    </Suspense>
  );
}

function CommunityPageContent() {
  const { communityRecipes, toggleTag, filterTags } = useRecipes();
  const params = useSearchParams();
  const tagQuery = params.get("tags");
  const searchQuery = params.get("search");
  const didInit = useRef(false);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [dbRecipes, setDbRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchQuery || "");

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (tagQuery) {
      tagQuery.split(",").forEach((t) => toggleTag(t.trim()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let on = true;
    async function load() {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch("/api/recipes", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!on) return;
        if (res.ok) {
          const json = await res.json();
          setDbRecipes(Array.isArray(json.recipes) ? json.recipes : []);
        } else {
          setDbRecipes([]);
        }
      } catch (error) {
        console.error("Failed to load recipes:", error);
        setDbRecipes([]);
      } finally {
        if (on) setLoading(false);
      }
    }
    load();
    return () => {
      on = false;
    };
  }, []);

  const allRecipes = useMemo(() => {
    const combined = [
      ...dbRecipes.map((r) => ({
        id: r.id,
        title: r.title,
        image: r.image || undefined,
        tags: r.tags || [],
        ingredients: r.ingredients || [],
        steps: r.steps || [],
        nutrition: r.nutrition || null,
        calories: r.calories || null,
        // Add missing fields for modal
        servings: r.servings,
        difficulty: r.difficulty,
        prepTime: r.prepTime,
        cookTime: r.cookTime,
        totalTime: r.totalTime,
        allergens: r.allergens,
        utensils: r.utensils,
        tips: r.tips,
        variations: r.variations,
        summary: r.summary,
      })),
      ...communityRecipes,
    ];

    // Remove duplicates by id
    const byId = new Map();
    combined.forEach((r) => {
      if (!byId.has(r.id)) byId.set(r.id, r);
    });

    return Array.from(byId.values());
  }, [dbRecipes, communityRecipes]);

  const filteredRecipes = useMemo(() => {
    let results = allRecipes;

    // Filter by tags
    if (filterTags.length > 0) {
      results = results.filter((r) =>
        filterTags.some((t) => r.tags?.includes(t))
      );
    }

    // Filter by search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter((r) => {
        const matchTitle = r.title?.toLowerCase().includes(term);
        const matchTags = r.tags?.some((tag) =>
          tag.toLowerCase().includes(term)
        );
        const matchIngredients = r.ingredients?.some((ing) =>
          (typeof ing === "string" ? ing : ing.name)
            ?.toLowerCase()
            .includes(term)
        );
        return matchTitle || matchTags || matchIngredients;
      });
    }

    return results;
  }, [allRecipes, filterTags, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-white/90">
          Community Recipes
        </h2>
        <p className="text-sm text-white/55">
          Browse & filter recipes contributed by users.
        </p>
      </div>

      <div className="space-y-4">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search recipes, ingredients, or tags..."
          className="w-full h-11 rounded-xl glass px-4 text-sm placeholder:text-white/35 text-white/90 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]"
        />
        <TagFilter />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-[rgba(var(--accent-rgb)/0.5)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onView={() => setActiveRecipe(r)}
              />
            ))}
          </div>

          {filteredRecipes.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <p className="text-sm text-white/60">
                {searchTerm || filterTags.length > 0
                  ? "No recipes match your search criteria."
                  : "No recipes available yet."}
              </p>
              <p className="text-white/45 text-xs">
                {searchTerm || filterTags.length > 0
                  ? "Try adjusting your filters or search terms."
                  : "Generate some recipes to get started!"}
              </p>
            </div>
          )}
        </>
      )}

      <RecipeModal
        recipe={activeRecipe}
        onClose={() => setActiveRecipe(null)}
      />
    </div>
  );
}
