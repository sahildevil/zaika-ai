import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Read Gemini API key from multiple possible env names.
// Accepted: GEMINI_API_KEY, NEXT_PUBLIC_GEMINI_API_KEY, GEMINI_API
function getApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API ||
    null
  );
}

async function callGeminiSDK(prompt, apiKey) {
  // Prefer SDK first; some older SDKs hit v1beta. If model is not found, let caller handle.
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelIds = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-pro",
    "gemini-1.5-pro",
  ];
  for (const id of modelIds) {
    try {
      const model = genAI.getGenerativeModel({ model: id });
      const res = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      });
      return res.response.text();
    } catch (e) {
      // try next id
    }
  }
  throw new Error("SDK models not available");
}

async function callGeminiHTTP(prompt, apiKey) {
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };
  const modelIds = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-pro",
    "gemini-1.5-pro",
  ];
  for (const id of modelIds) {
    const url = `https://generativelanguage.googleapis.com/v1/models/${id}:generateContent?key=${apiKey}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });
    if (!r.ok) continue;
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
  }
  throw new Error("HTTP models not available");
}

function mockDishes({
  diet,
  mealType,
  fasting,
  spiceLevel,
  servings,
  calorieTarget,
  ingredients,
}) {
  const baseTags = [];
  if (fasting) baseTags.push("Fasting");
  if (diet === "Vegan" || diet === "Veg" || diet === "Jain")
    baseTags.push("Plant Based");
  if (calorieTarget <= 350) baseTags.push("Low Calorie");
  const pick = (i) => ingredients[i % ingredients.length];
  const mk = (i, title) => ({
    id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`,
    title,
    summary: `${mealType} friendly, ${spiceLevel.toLowerCase()} spice, serves ${servings}.`,
    servings,
    prepTime: "10 min",
    cookTime: "20 min",
    totalTime: "30 min",
    difficulty: "Easy",
    utensils: ["Kadhai (wok)", "Spatula", "Measuring cups"],
    ingredients: [
      { name: pick(i), quantity: "200 g" },
      { name: pick(i + 1), quantity: "120 g" },
      { name: pick(i + 2), quantity: "to taste" },
    ],
    steps: [
      "Rinse and prep all ingredients; chop uniformly for even cooking.",
      "Heat 1 tbsp ghee/oil in a kadhai on medium heat for 1 minute.",
      "Add cumin/whole spices; let them crackle for 20–30 seconds.",
      `Add ${pick(i)} and sauté 2–3 minutes until aromatic.`,
      `Stir in ${pick(
        i + 1
      )}; cook on medium 4–6 minutes, stirring occasionally.`,
      "Season with salt and spices; sprinkle 1–2 tbsp water if sticking.",
      `Fold in ${pick(i + 2)}; cook 1–2 minutes to combine.`,
      "Taste, adjust seasoning, rest 1 minute off heat, and serve warm.",
    ],
    nutrition: {
      calories: calorieTarget,
      protein: 18 + i,
      carbs: 45 + i * 2,
      fat: 12 + i,
    },
    allergens: [diet === "Vegan" ? "" : "Dairy"].filter(Boolean),
    tips: [
      "Cut evenly to avoid under/overcooking.",
      "Add a squeeze of lemon before serving for brightness.",
    ],
    variations: [
      "Swap ghee for oil to keep it vegan.",
      "Add roasted peanuts for crunch if not fasting.",
    ],
    tags: [...baseTags, diet, mealType],
    imagePrompt: `${title}, Indian ${mealType}, plated, soft studio lighting, appetizing, 16:9`,
  });
  const names = [
    `${fasting ? "Fasting " : ""}${diet} ${mealType} Bowl`,
    `${diet} Spiced ${pick(0)} Medley`,
    `${mealType} ${pick(1)} & ${pick(2)} Delight`,
  ];
  return { dishes: names.map((n, i) => mk(i + 1, n)) };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      diet,
      mealType,
      calorieRange,
      customCalories,
      fasting,
      ingredients,
      servings = 1,
      spiceLevel = "Medium",
    } = body || {};

    if (!Array.isArray(ingredients) || ingredients.length < 3) {
      return NextResponse.json(
        { error: "Select at least 3 ingredients" },
        { status: 400 }
      );
    }

    const apiKey = getApiKey();

    const calorieTarget =
      calorieRange === "Custom"
        ? customCalories
        : calorieRange === "Low"
        ? 300
        : calorieRange === "Medium"
        ? 500
        : 750;

    const prompt = `You are an expert Indian chef AI. Propose exactly THREE distinct dish ideas as JSON array named dishes.
Each dish object MUST include the following fields, with rich and practical cooking guidance:
- id (short slug), title, summary (1-2 lines)
- servings, prepTime (e.g., "10 min"), cookTime (e.g., "20 min"), totalTime
- difficulty (Easy/Medium/Hard)
- utensils (array of cookware names)
- ingredients (array of { name, quantity })
- steps (7-10 clear, numbered, imperative steps; include timing cues like "sauté 2–3 min", heat level, and consistency cues)
- nutrition { calories, protein, carbs, fat }
- allergens (array if any), tips (array), variations (array)
- tags (array) and imagePrompt (concise prompt for photorealistic food photography)
Constraints to respect strictly:
Diet=${diet} (allow meat/eggs for Non-Veg), MealType=${mealType}, Fasting=${fasting} (avoid onion, garlic, meat), Spice=${spiceLevel}, Servings=${servings}, CalorieTarget≈${calorieTarget}, AvailableIngredients=${ingredients.join(
      ", "
    )}. 
Output STRICTLY valid JSON for { "dishes": [ ...3 items... ] } with no extra text.`;

    let text = null;
    if (apiKey) {
      try {
        // Try SDK first, then HTTP v1 as fallback
        text = await callGeminiSDK(prompt, apiKey);
      } catch {
        try {
          text = await callGeminiHTTP(prompt, apiKey);
        } catch {
          // fall through to mock
        }
      }
    }
    if (!text) {
      const mocked = mockDishes({
        diet,
        mealType,
        fasting,
        spiceLevel,
        servings,
        calorieTarget,
        ingredients,
      });
      const withImages = mocked.dishes.map((d) => {
        const q = (
          d.imagePrompt ||
          `${d.title}, high quality food photography, studio lighting, 16:9`
        ).trim();
        const pollinations = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          q
        )}?aspect=16:9&nologo=true`;
        const fallback = `https://picsum.photos/seed/${encodeURIComponent(
          d.title
        )}/800/450`;
        return {
          ...d,
          image: pollinations,
          fallbackImage: fallback,
          createdAt: new Date().toISOString(),
        };
      });
      return NextResponse.json({ dishes: withImages, source: "mock" });
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // try to extract JSON block
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }
    if (!parsed || !Array.isArray(parsed.dishes)) {
      return NextResponse.json(
        { error: "Model response parse error", raw: text },
        { status: 502 }
      );
    }

    // Image generation via external image service using Gemini-created prompt
    const withImages = parsed.dishes.map((d) => {
      const q = (
        d.imagePrompt ||
        `${d.title}, high quality food photography, studio lighting, 16:9`
      ).trim();
      const pollinations = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        q
      )}?aspect=16:9&nologo=true`;
      const fallback = `https://picsum.photos/seed/${encodeURIComponent(
        d.title
      )}/800/450`;
      return {
        ...d,
        image: pollinations,
        fallbackImage: fallback,
        createdAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({ dishes: withImages, source: "gemini" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
