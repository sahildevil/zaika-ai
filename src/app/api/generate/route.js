import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

function readEnv() {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing. Add it to .env.local");
  return key;
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
      return NextResponse.json({ error: "Select at least 3 ingredients" }, { status: 400 });
    }

    const apiKey = readEnv();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const calorieTarget =
      calorieRange === "Custom" ? customCalories : calorieRange === "Low" ? 300 : calorieRange === "Medium" ? 500 : 750;

    const prompt = `You are an expert Indian chef AI. Propose exactly THREE distinct dish ideas as JSON array named dishes.
Each dish must include fields: id (short slug), title, summary (1-2 lines), ingredients (array of {name, quantity}), steps (5-7 steps),
nutrition { calories, protein, carbs, fat }, tags (array), and imagePrompt (concise yet vivid prompt for photorealistic food photography).
Dietary constraints to respect strictly: Diet=${diet} (allow meat for Non-Veg), MealType=${mealType}, Fasting=${fasting}, Spice=${spiceLevel}, Servings=${servings}, CalorieTarget≈${calorieTarget}, AvailableIngredients=${ingredients.join(", ")}.
IMPORTANT: Ensure Non-Veg is allowed to include chicken/meat/eggs if selected. If fasting=true, avoid onion, garlic, and meat.
Respond ONLY with valid JSON for { "dishes": [ ...3 items... ] } and nothing else.`;

    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const text = result.response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // try to extract JSON block
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }
    if (!parsed || !Array.isArray(parsed.dishes)) {
      return NextResponse.json({ error: "Model response parse error", raw: text }, { status: 502 });
    }

    // Image generation via external image service using Gemini-created prompt
    const withImages = parsed.dishes.map((d) => {
      const q = (d.imagePrompt || `${d.title}, high quality food photography, studio lighting, 16:9`).trim();
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(q)}?aspect=16:9&nologo=true`;
      return {
        ...d,
        image: imageUrl,
        createdAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({ dishes: withImages });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}


