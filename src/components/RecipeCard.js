import { motion } from "framer-motion";
import { memo } from "react";
import { useRecipes } from "../context/RecipeContext";

function RecipeCard({ recipe, onSave }) {
  const { isSaved, toggleSave } = useRecipes();
  const saved = isSaved?.(recipe.id);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="relative group rounded-2xl p-5 flex flex-col gap-3 overflow-hidden zaika-card backdrop-blur-md"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle_at_80%_-10%,rgba(var(--accent-rgb)/0.25),transparent_65%)]" />
      <div className="flex items-start justify-between gap-3 relative z-10">
        <h4 className="font-semibold text-sm md:text-base leading-snug text-white/90 group-hover:text-white transition">
          {recipe.title}
        </h4>
        {(onSave || toggleSave) && (
          <button
            onClick={() => (onSave ? onSave() : toggleSave?.(recipe.id))}
            className={`text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full border transition ${
              saved
                ? "border-[rgba(var(--accent-rgb)/0.7)] text-white/95 bg-[rgba(var(--accent-rgb)/0.2)]"
                : "border-[rgba(var(--accent-rgb)/0.5)] text-white/80 hover:text-white/95 hover:bg-[rgba(var(--accent-rgb)/0.15)]"
            }`}
          >
            {saved ? "Saved" : "Save"}
          </button>
        )}
      </div>
      {recipe.image && (
        <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video">
          <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 relative z-10">
        {recipe.tags?.map((t) => (
          <span
            key={t}
            className="tag-pill text-[9px] tracking-wide !leading-none animate-fade-up"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] text-white/55 relative z-10">
        <p>
          Calories: <span className="text-white/80">{recipe.calories}</span>
        </p>
        <p>
          Macros:{" "}
          <span className="text-white/80">
            P {recipe.nutrition?.protein} / C {recipe.nutrition?.carbs} / F{" "}
            {recipe.nutrition?.fat}
          </span>
        </p>
      </div>
      <ul className="text-[11px] list-disc ml-4 space-y-1 marker:text-white/25 relative z-10 text-white/70">
        {recipe.steps?.slice(0, 3).map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      <a
        href={recipe.youtube}
        target="_blank"
        className="text-[11px] relative z-10 text-[rgba(var(--accent-rgb)/0.9)] hover:underline inline-flex items-center gap-1"
      >
        <span>YouTube suggestions</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="opacity-70 group-hover:translate-x-[2px] transition"
          aria-hidden
        >
          <path d="M7 17L17 7M8 7h9v9" />
        </svg>
      </a>
    </motion.div>
  );
}

export default memo(RecipeCard);
