"use client";
import { useEffect } from "react";

export default function RecipeModal({ recipe, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!recipe) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl border border-white/10 glass p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white text-sm px-2 py-1 rounded-lg border border-white/15"
        >
          Close
        </button>
        <h3 className="text-xl font-semibold text-white/90 mb-2">
          {recipe.title}
        </h3>
        {recipe.summary && (
          <p className="text-white/70 text-sm mb-4">{recipe.summary}</p>
        )}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-white/80 text-sm font-semibold mb-2">
              Ingredients
            </h4>
            <ul className="text-white/70 text-sm list-disc ml-5 space-y-1">
              {recipe.ingredients?.map((ing, i) => (
                <li key={i}>
                  {ing.quantity ? `${ing.name} — ${ing.quantity}` : ing.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-white/70">
            <div>
              <span className="text-white/50">Servings:</span>{" "}
              {recipe.servings ?? "—"}
            </div>
            <div>
              <span className="text-white/50">Difficulty:</span>{" "}
              {recipe.difficulty ?? "—"}
            </div>
            <div>
              <span className="text-white/50">Prep:</span>{" "}
              {recipe.prepTime ?? "—"}
            </div>
            <div>
              <span className="text-white/50">Cook:</span>{" "}
              {recipe.cookTime ?? "—"}
            </div>
            <div>
              <span className="text-white/50">Total:</span>{" "}
              {recipe.totalTime ?? "—"}
            </div>
            <div>
              <span className="text-white/50">Allergens:</span>{" "}
              {recipe.allergens?.join(", ") || "—"}
            </div>
            <div className="col-span-2">
              <span className="text-white/50">Utensils:</span>{" "}
              {recipe.utensils?.join(", ") || "—"}
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h4 className="text-white/80 text-sm font-semibold mb-2">Steps</h4>
          <ol className="text-white/75 text-sm list-decimal ml-5 space-y-2">
            {recipe.steps?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
        {(recipe.tips?.length || recipe.variations?.length) && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white/80 text-sm font-semibold mb-2">Tips</h4>
              <ul className="text-white/70 text-sm list-disc ml-5 space-y-1">
                {recipe.tips?.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white/80 text-sm font-semibold mb-2">
                Variations
              </h4>
              <ul className="text-white/70 text-sm list-disc ml-5 space-y-1">
                {recipe.variations?.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
