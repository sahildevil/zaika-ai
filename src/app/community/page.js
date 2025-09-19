"use client";
import { useRecipes } from "../../context/RecipeContext";
import TagFilter from "../../components/TagFilter";
import RecipeCard from "../../components/RecipeCard";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function CommunityPage() {
  const { communityRecipes, toggleTag } = useRecipes();
  const params = useSearchParams();
  const tagQuery = params.get("tags");

  useEffect(() => {
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
          <RecipeCard key={r.id} recipe={r} />
        ))}
        {communityRecipes.length === 0 && (
          <p className="text-sm text-white/50">
            No recipes match selected tags.
          </p>
        )}
      </div>
    </div>
  );
}
