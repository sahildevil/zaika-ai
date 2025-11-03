"use client";
import { useEffect } from "react";
import Image from "next/image";

export default function RecipeModal({ recipe, onClose }) {
  useEffect(() => {
    if (!recipe) return;
    
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [recipe, onClose]);

  if (!recipe) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-up" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Close modal" />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl border border-white/10 glass p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/10 transition"
          aria-label="Close"
        >
          ✕ Close
        </button>
        
        {recipe.image ? (
          <div className="relative aspect-[21/9] rounded-xl overflow-hidden mb-6 -mx-6 -mt-6">
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <h3 className="absolute bottom-4 left-6 text-2xl font-semibold text-white">
              {recipe.title}
            </h3>
          </div>
        ) : (
          <h3 className="text-2xl font-semibold text-white/90 mb-4">
            {recipe.title}
          </h3>
        )}
        
        {recipe.summary && (
          <p className="text-white/70 text-sm mb-6 leading-relaxed">{recipe.summary}</p>
        )}
        
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2 space-y-6">
            {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
              <div>
                <h4 className="text-white/80 text-sm font-semibold mb-3 flex items-center gap-2">
                  <span>📝</span> Ingredients ({recipe.ingredients.length})
                </h4>
                <ul className="text-white/70 text-sm space-y-2">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[rgba(var(--accent-rgb)/0.7)] mt-1">•</span>
                      <span>
                        {typeof ing === "string" ? (
                          ing
                        ) : (
                          <>
                            <span className="font-medium">{ing.name}</span>
                            {ing.quantity && <span className="text-white/50"> — {ing.quantity}</span>}
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {Array.isArray(recipe.steps) && recipe.steps.length > 0 && (
              <div>
                <h4 className="text-white/80 text-sm font-semibold mb-3 flex items-center gap-2">
                  <span>👨‍🍳</span> Cooking Steps ({recipe.steps.length})
                </h4>
                <ol className="text-white/75 text-sm space-y-3">
                  {recipe.steps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[rgba(var(--accent-rgb)/0.2)] text-[rgba(var(--accent-rgb)/0.9)] text-xs font-semibold">
                        {i + 1}
                      </span>
                      <span className="flex-1 pt-0.5">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="glass-solid p-4 rounded-xl space-y-3">
              <h4 className="text-white/80 text-sm font-semibold">Recipe Info</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-white/50 block">Servings</span>
                  <span className="text-white/90">{recipe.servings ?? "—"}</span>
                </div>
                <div>
                  <span className="text-white/50 block">Difficulty</span>
                  <span className="text-white/90">{recipe.difficulty ?? "—"}</span>
                </div>
                <div>
                  <span className="text-white/50 block">Prep Time</span>
                  <span className="text-white/90">{recipe.prepTime ?? "—"}</span>
                </div>
                <div>
                  <span className="text-white/50 block">Cook Time</span>
                  <span className="text-white/90">{recipe.cookTime ?? "—"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-white/50 block">Total Time</span>
                  <span className="text-white/90">{recipe.totalTime ?? "—"}</span>
                </div>
              </div>
            </div>
            
            {recipe.nutrition && (
              <div className="glass-solid p-4 rounded-xl space-y-3">
                <h4 className="text-white/80 text-sm font-semibold">Nutrition</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">Calories</span>
                    <span className="text-white/90 font-medium">{recipe.nutrition.calories || recipe.calories || "—"}</span>
                  </div>
                  {recipe.nutrition.protein && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Protein</span>
                      <span className="text-white/90">{recipe.nutrition.protein}g</span>
                    </div>
                  )}
                  {recipe.nutrition.carbs && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Carbs</span>
                      <span className="text-white/90">{recipe.nutrition.carbs}g</span>
                    </div>
                  )}
                  {recipe.nutrition.fat && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Fat</span>
                      <span className="text-white/90">{recipe.nutrition.fat}g</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {(recipe.allergens?.length > 0 || recipe.utensils?.length > 0) && (
              <div className="glass-solid p-4 rounded-xl space-y-3">
                {recipe.allergens?.length > 0 && (
                  <div>
                    <h4 className="text-white/80 text-xs font-semibold mb-1.5">Allergens</h4>
                    <p className="text-white/70 text-xs">{recipe.allergens.join(", ")}</p>
                  </div>
                )}
                {recipe.utensils?.length > 0 && (
                  <div>
                    <h4 className="text-white/80 text-xs font-semibold mb-1.5">Utensils Needed</h4>
                    <p className="text-white/70 text-xs">{recipe.utensils.join(", ")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {(recipe.tips?.length > 0 || recipe.variations?.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
            {recipe.tips?.length > 0 && (
              <div>
                <h4 className="text-white/80 text-sm font-semibold mb-2 flex items-center gap-2">
                  <span>💡</span> Tips
                </h4>
                <ul className="text-white/70 text-sm space-y-1.5">
                  {recipe.tips.map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[rgba(var(--accent-rgb)/0.7)]">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recipe.variations?.length > 0 && (
              <div>
                <h4 className="text-white/80 text-sm font-semibold mb-2 flex items-center gap-2">
                  <span>🔄</span> Variations
                </h4>
                <ul className="text-white/70 text-sm space-y-1.5">
                  {recipe.variations.map((v, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[rgba(var(--accent-rgb)/0.7)]">•</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
