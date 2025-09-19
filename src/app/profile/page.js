"use client";
import { useRecipes } from "../../context/RecipeContext";
import RecipeCard from "../../components/RecipeCard";
import Link from "next/link";

export default function ProfilePage() {
  const { user, savedRecipes } = useRecipes();
  if (!user)
    return (
      <div className="space-y-4">
        <p className="text-sm">
          You need to{" "}
          <Link href="/auth/signin" className="text-emerald-600 underline">
            sign in
          </Link>{" "}
          to view your profile.
        </p>
      </div>
    );
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold">{user.name}&apos;s Recipes</h2>
        <p className="text-sm text-neutral-600">
          Saved generative outputs appear here.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {savedRecipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
        {savedRecipes.length === 0 && (
          <p className="text-sm text-neutral-500">
            No saved recipes yet. Generate one!
          </p>
        )}
      </div>
    </div>
  );
}
