"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { memo, useMemo, useState } from "react";
import { useRecipes } from "../context/RecipeContext";

function RecipeCard({ recipe, onSave, onView }) {
  const { isSaved, toggleSave } = useRecipes();
  const saved = isSaved?.(recipe.id);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const title = recipe?.title || "Dish";

  // Generate a consistent color-based placeholder as primary fallback
  const hashCode = [...title].reduce((a, c) => a + c.charCodeAt(0), 0);
  const idx = Math.abs(hashCode) % 7;

  // Use placehold.co with different colors for variety
  const colors = [
    { bg: "1a1a2e", fg: "16bfa6" },
    { bg: "2d1b3d", fg: "e94560" },
    { bg: "1f4068", fg: "f9c74f" },
    { bg: "2c3e50", fg: "e67e22" },
    { bg: "34495e", fg: "3498db" },
    { bg: "16213e", fg: "f39c12" },
    { bg: "0f3460", fg: "e43f5a" },
  ];

  const { bg, fg } = colors[idx];
  const placeholderUrl = `https://placehold.co/800x450/${bg}/${fg}/png?text=${encodeURIComponent(
    title.substring(0, 30)
  )}`;

  // Alternative: Use a food emoji-based placeholder
  const foodEmojis = ["🍛", "🍲", "🥘", "🍜", "🍝", "🥗", "🍱"];
  const emojiPlaceholder = `https://placehold.co/800x450/${bg}/${fg}/png?text=${
    foodEmojis[idx]
  }+${encodeURIComponent(title.substring(0, 20))}`;

  const imageSources = [
    recipe?.image,
    recipe?.imageUrl,
    recipe?.fallbackImage,
    placeholderUrl,
    emojiPlaceholder,
  ].filter(Boolean);

  const currentSrc =
    imageSources[Math.min(retryCount, imageSources.length - 1)];

  const handleError = () => {
    if (retryCount < imageSources.length - 1) {
      setRetryCount((prev) => prev + 1);
      setImgError(false);
    } else {
      setImgError(true);
    }
  };

  const handleLoad = () => {
    setImgLoaded(true);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl zaika-card overflow-hidden group"
    >
      <div className="relative aspect-[16/9] bg-white/5">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/10 to-white/5" />
        )}
        <Image
          src={currentSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          priority={false}
          onError={handleError}
          onLoad={handleLoad}
          className={`object-cover transition-opacity duration-300 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className="font-semibold text-sm md:text-base leading-snug text-white/90 group-hover:text-white transition line-clamp-2 flex-1">
            {recipe.title}
          </h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onView && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onView();
                }}
                type="button"
                aria-label={`View ${title}`}
                className="text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full border border-white/15 text-white/80 hover:text-white/95 hover:bg-white/5 transition cursor-pointer"
              >
                View
              </button>
            )}
            {(onSave || toggleSave) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSave ? onSave() : toggleSave?.(recipe.id);
                }}
                type="button"
                aria-label={saved ? `Unsave ${title}` : `Save ${title}`}
                className={`text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full border transition cursor-pointer ${
                  saved
                    ? "border-[rgba(var(--accent-rgb)/0.7)] text-white/95 bg-[rgba(var(--accent-rgb)/0.2)]"
                    : "border-[rgba(var(--accent-rgb)/0.5)] text-white/80 hover:text-white/95 hover:bg-[rgba(var(--accent-rgb)/0.15)]"
                }`}
              >
                {saved ? "Saved" : "Save"}
              </button>
            )}
          </div>
        </div>

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {recipe.tags.slice(0, 4).map((t, i) => (
              <span
                key={`${t}-${i}`}
                className="tag-pill text-[9px] tracking-wide !leading-none"
              >
                {t}
              </span>
            ))}
            {recipe.tags.length > 4 && (
              <span className="tag-pill text-[9px] tracking-wide !leading-none">
                +{recipe.tags.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-[10px] text-white/55 mb-2">
          <p>
            <span className="text-white/40">Cal:</span>{" "}
            <span className="text-white/80">
              {recipe?.nutrition?.calories ?? recipe?.calories ?? "—"}
            </span>
          </p>
          <p>
            <span className="text-white/40">Macros:</span>{" "}
            <span className="text-white/80">
              {recipe?.nutrition
                ? `P${recipe.nutrition.protein} C${recipe.nutrition.carbs} F${recipe.nutrition.fat}`
                : "—"}
            </span>
          </p>
        </div>

        {recipe.steps && recipe.steps.length > 0 && (
          <ul className="text-[11px] text-white/65 list-disc ml-4 space-y-1 marker:text-white/25">
            {recipe.steps.slice(0, 2).map((s, i) => (
              <li key={i} className="line-clamp-1">
                {s}
              </li>
            ))}
          </ul>
        )}

        {recipe.youtube && (
          <a
            href={recipe.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[rgba(var(--accent-rgb)/0.9)] hover:underline inline-flex items-center gap-1 mt-2"
          >
            <span>YouTube tutorial</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              aria-hidden
            >
              <path d="M7 17L17 7M8 7h9v9" />
            </svg>
          </a>
        )}
      </div>
    </motion.article>
  );
}

export default memo(RecipeCard);
