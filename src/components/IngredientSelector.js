"use client";
import { useState } from "react";

const MASTER_INGREDIENTS = [
  "Tomato",
  "Onion",
  "Garlic",
  "Potato",
  "Paneer",
  "Spinach",
  "Chicken",
  "Rice",
  "Lentils",
  "Sabudana",
  "Peanuts",
  "Cumin",
  "Ghee",
  "Coconut",
  "Almonds",
  "Broccoli",
  "Quinoa",
  "Oats",
  "Carrot",
  "Beans",
];

export default function IngredientSelector({ value, onChange, fasting }) {
  const [query, setQuery] = useState("");
  const filtered = MASTER_INGREDIENTS.filter((i) =>
    i.toLowerCase().includes(query.toLowerCase())
  ).filter((i) => !fasting || !["Onion", "Garlic", "Chicken"].includes(i));

  function toggle(ing) {
    if (value.includes(ing)) onChange(value.filter((v) => v !== ing));
    else onChange([...value, ing]);
  }

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search ingredients"
        className="w-full h-10 rounded-xl glass px-3 text-sm placeholder:text-white/35 text-white/90 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-auto pr-1">
        {filtered.map((i) => {
          const active = value.includes(i);
          return (
            <button
              type="button"
              key={i}
              onClick={() => toggle(i)}
              className={`text-[11px] px-3 py-1 rounded-full transition border ${
                active
                  ? "text-white bg-[rgba(var(--accent-rgb)/0.18)] border-[rgba(var(--accent-rgb)/0.5)]"
                  : "text-white/75 hover:text-white border-white/15 hover:border-[rgba(var(--accent-rgb)/0.5)]"
              }`}
            >
              {i}
            </button>
          );
        })}
      </div>
    </div>
  );
}
