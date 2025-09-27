"use client";
import { useRecipes } from "../../context/RecipeContext";
import TagFilter from "../../components/TagFilter";
import RecipeCard from "../../components/RecipeCard";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import RecipeModal from "../../components/RecipeModal";

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="text-white/60 text-sm">Loading…</div>}>
      <CommunityPageContent />
    </Suspense>
  );
}

function CommunityPageContent() {
  const { communityRecipes, toggleTag } = useRecipes();
  const params = useSearchParams();
  const tagQuery = params.get("tags");
  const didInit = useRef(false);
  const [activeRecipe, setActiveRecipe] = useState(null);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (tagQuery) tagQuery.split(",").forEach((t) => toggleTag(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <TagFilter />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {communityRecipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} onView={() => setActiveRecipe(r)} />
        ))}
        {communityRecipes.length === 0 && (
          <div className="text-sm text-white/60">
            <p>No recipes match selected tags.</p>
            <p className="mt-1 text-white/45">Try clearing some filters.</p>
          </div>
        )}
      </div>
      <RecipeModal
        recipe={activeRecipe}
        onClose={() => setActiveRecipe(null)}
      />
    </div>
  );
}
