"use client";
import { useRecipes } from "../context/RecipeContext";

const TAGS = ["Fasting", "Low Calorie", "Regional", "Plant Based", "High Fat"];

export default function TagFilter() {
  const { filterTags, toggleTag } = useRecipes();
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {TAGS.map((tag) => {
        const active = filterTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`tag-pill text-[10px] ${active ? "active" : ""}`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
