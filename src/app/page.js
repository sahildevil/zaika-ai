"use client";
import OptionCard from "../components/OptionCard";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/community?search=${encodeURIComponent(searchQuery.trim())}`
      );
    }
  };

  return (
    <div className="space-y-14">
      <section className="relative pt-4 text-center space-y-6">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-40 blur-3xl bg-[radial-gradient(circle_at_50%_50%,rgba(var(--accent-rgb)/0.35),transparent_60%)]" />
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mx-auto max-w-3xl gradient-text">
          Intelligent Indian Recipes & Fasting-Friendly Meal Creation
        </h1>
        <p className="max-w-2xl mx-auto text-white/60 text-sm sm:text-[15px] leading-relaxed">
          Personalize meals by diet type, calories, cultural fasting rules &
          available ingredients. Generate, refine & share with the community.
        </p>
        <Suspense>
          <div className="mx-auto max-w-xl">
            <form
              onSubmit={handleSearch}
              role="search"
              className="relative group"
            >
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for ingredients or dishes..."
                className="w-full h-12 rounded-2xl glass px-5 pr-12 text-sm placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.5)] text-white/90"
              />
              <button
                type="submit"
                className="absolute top-1/2 -translate-y-1/2 right-4 text-[11px] text-white/40 group-focus-within:text-white/70 hover:text-white transition"
                aria-label="Search"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </form>
          </div>
        </Suspense>
      </section>
      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <OptionCard
            href="/generate"
            title="Create Recipe"
            icon={<span>🍲</span>}
            desc="AI powered generator based on diet, calories, fasting & chosen ingredients."
            accent="emerald"
          />
          <OptionCard
            href="/generate?fasting=true"
            title="Fasting Foods"
            icon={<span>🌙</span>}
            desc="Generate fasting-compliant meals without onion, garlic, meat."
            accent="violet"
          />
          <OptionCard
            href="/generate?calorie=low"
            title="Low-Calorie Meals"
            icon={<span>⚖️</span>}
            desc="Balance nutrition & flavor within your calorie goals."
            accent="sky"
          />
          <OptionCard
            href="/community"
            title="Community Recipes"
            icon={<span>👥</span>}
            desc="Browse & learn from shared recipes across India."
            accent="rose"
          />
          <OptionCard
            href="/community?tags=Fasting"
            title="Tag Filtering"
            icon={<span>🏷️</span>}
            desc="Filter recipes by fasting, low calorie, plant-based & more."
            accent="amber"
          />
          <OptionCard
            href="/profile"
            title="Saved Recipes"
            icon={<span>💾</span>}
            desc="Access the recipes you've generated & saved."
            accent="teal"
          />
          <OptionCard
            href="/generate?diet=Keto"
            title="Keto Focus"
            icon={<span>🥑</span>}
            desc="Low-carb, high-fat Indian-friendly keto meal ideas."
            accent="emerald"
          />
          <OptionCard
            href="/generate?diet=Vegan"
            title="Plant Based"
            icon={<span>🌿</span>}
            desc="Wholesome vegan Indian bowls & thalis."
            accent="sky"
          />
        </div>
      </section>
    </div>
  );
}
