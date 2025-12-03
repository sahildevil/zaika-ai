import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

//
// Simple in-memory counters / cache (per server instance)
const IMAGE_GEN_QUEUE_LIMIT = parseInt(
  process.env.IMAGE_GEN_QUEUE_LIMIT || "2",
  10
);
let activeImageGen = 0;
const promptCache = new Map(); // key -> url
// Batch mode: generate only ONE image per group of dishes (reduces external requests & 429s)
const BATCH_MODE = process.env.IMAGE_GEN_BATCH_MODE !== "false"; // Default to true for faster demos

async function generateAndUploadImage(imagePrompt, dishTitle) {
  const cacheKey = imagePrompt.trim().toLowerCase();
  if (promptCache.has(cacheKey)) {
    console.log(`[image-gen] cache hit for "${dishTitle}"`);
    return promptCache.get(cacheKey);
  }

  // If explicitly disabled, use fallback immediately
  if (process.env.POLLINATIONS_ENABLED === "false") {
    return buildPlaceholder(dishTitle);
  }

  // Check queue limit
  if (activeImageGen >= IMAGE_GEN_QUEUE_LIMIT) {
    console.log(
      `[image-gen] queue limit reached (${activeImageGen}/${IMAGE_GEN_QUEUE_LIMIT}); using fast text placeholder`
    );
    const ph = buildPlaceholder(dishTitle);
    promptCache.set(cacheKey, ph);
    return ph;
  }

  activeImageGen++;
  try {
    // Demo requirement: aim for ~25s max waiting time for AI image
    // Single attempt default (can be overridden via env)
    const baseTimeout = parseInt(process.env.IMAGE_GEN_TIMEOUT || "25000", 10);
    const attempts = parseInt(process.env.IMAGE_GEN_ATTEMPTS || "1", 10);

    // Use a single size (smaller) to reduce server strain
    const width = 800;
    const height = 450;
    let imageBuffer = null;
    let lastError = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      // Use constant timeout (e.g., 25s) unless overridden by env
      const timeoutMs = baseTimeout;
      const seed = Math.floor(Math.random() * 1_000_000);
      const cb = Date.now();
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        imagePrompt
      )}?width=${width}&height=${height}&nologo=true&enhance=true&seed=${seed}&cb=${cb}`;
      const controller = new AbortController();
      let timedOut = false;
      const to = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);

      const startTime = Date.now();
      try {
        console.log(
          `[image-gen] attempt ${attempt}/${attempts} (timeout: ${timeoutMs}ms) for "${dishTitle}"`
        );
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "image/*",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Safari/537.36",
          },
        });
        clearTimeout(to);
        const elapsed = Date.now() - startTime;

        if (res.status === 429) {
          console.log(
            `[image-gen] received 429 Too Many Requests after ${elapsed}ms; will retry with backoff`
          );
          lastError = "rate_limit";
          // Don't break immediately, allow retry with backoff
        } else if (!res.ok) {
          console.log(
            `[image-gen] non-ok status ${res.status} after ${elapsed}ms`
          );
          lastError = `http_${res.status}`;
        } else {
          const ct = res.headers.get("content-type") || "";
          if (!ct.startsWith("image/")) {
            console.log(
              `[image-gen] invalid content-type ${ct} after ${elapsed}ms`
            );
            lastError = "invalid_content_type";
          } else {
            imageBuffer = await res.arrayBuffer();
            console.log(
              `[image-gen] ✓ success on attempt ${attempt} after ${elapsed}ms (${(
                imageBuffer.byteLength / 1024
              ).toFixed(1)}KB)`
            );
            break;
          }
        }
      } catch (e) {
        clearTimeout(to);
        const elapsed = Date.now() - startTime;
        if (e.name === "AbortError") {
          if (timedOut) {
            console.log(
              `[image-gen] attempt ${attempt} timed out after ${timeoutMs}ms for "${dishTitle}"`
            );
            lastError = "timeout";
          } else {
            console.log(
              `[image-gen] attempt ${attempt} aborted (non-timeout) after ${elapsed}ms`
            );
            lastError = "abort";
          }
        } else {
          console.log(
            `[image-gen] attempt ${attempt} error: ${e.name} ${e.message} after ${elapsed}ms`
          );
          lastError = e.name;
        }
      }

      // Quick backoff before retry
      if (!imageBuffer && attempt < attempts) {
        const backoffMs = 250;
        console.log(`[image-gen] waiting ${backoffMs}ms before retry...`);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }

    // If AI failed or timed out, fallback to a search-based image URL
    if (!imageBuffer) {
      console.log(
        `[image-gen] image generation failed (${lastError}), using text placeholder for "${dishTitle}"`
      );
      const ph = buildPlaceholder(dishTitle);
      promptCache.set(cacheKey, ph);
      return ph;
    }

    // upload only with service role key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const ph = buildPlaceholder(dishTitle);
      promptCache.set(cacheKey, ph);
      return ph;
    }

    try {
      const blob = new Blob([imageBuffer], { type: "image/jpeg" });
      const ts = Date.now();
      const sanitized = dishTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .substring(0, 50);
      const filename = `${sanitized}-${ts}.jpg`;
      const { error } = await supabase.storage
        .from("recipe-images")
        .upload(filename, blob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });
      if (error) {
        console.log(
          "[image-gen] upload error, using placeholder:",
          error.message
        );
        const ph = buildPlaceholder(dishTitle);
        promptCache.set(cacheKey, ph);
        return ph;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("recipe-images").getPublicUrl(filename);
      promptCache.set(cacheKey, publicUrl);
      return publicUrl;
    } catch (e) {
      console.log("[image-gen] unexpected upload failure:", e.message);
      const ph = buildPlaceholder(dishTitle);
      promptCache.set(cacheKey, ph);
      return ph;
    }
  } finally {
    activeImageGen = Math.max(0, activeImageGen - 1);
  }
}

// Build placeholder utility (detached so early returns can call it)
function buildPlaceholder(title) {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "+")
    .substring(0, 30);
  const colors = [
    { bg: "1a1a2e", fg: "16bfa6" },
    { bg: "2d1b3d", fg: "e94560" },
    { bg: "1f4068", fg: "f9c74f" },
    { bg: "2c3e50", fg: "e67e22" },
    { bg: "34495e", fg: "3498db" },
    { bg: "16213e", fg: "f39c12" },
    { bg: "0f3460", fg: "e43f5a" },
  ];
  const foodEmojis = ["🍛", "🍲", "🥘", "🍜", "🍝", "🥗", "🍱"];
  const hash = [...title].reduce((a, c) => a + c.charCodeAt(0), 0);
  const idx = Math.abs(hash) % colors.length;
  const { bg, fg } = colors[idx];
  const emoji = foodEmojis[idx];
  return `https://placehold.co/1200x675/${bg}/${fg}/png?text=${emoji}+${encodeURIComponent(
    sanitized
  )}`;
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

  const safePick = (i) => ingredients[Math.abs(i) % ingredients.length];
  const asQty = (name, i) => ({
    name,
    quantity: i % 3 === 0 ? "to taste" : i % 3 === 1 ? "1 cup" : "200 g",
  });

  // Generate unique, recipe-specific steps for each dish
  const makeSteps = (idx, title, ingredients) => {
    const hot = spiceLevel === "Hot";
    const mild = spiceLevel === "Mild";
    const heat = hot ? "medium-high" : mild ? "low-medium" : "medium";

    // Get specific ingredients for this recipe
    const ing1 = ingredients[0]?.name || "ingredients";
    const ing2 = ingredients[1]?.name || "spices";
    const ing3 = ingredients[2]?.name || "vegetables";

    // Create recipe-specific steps based on meal type and ingredients
    const prepTime = 5 + idx * 2;
    const cookTime1 = 3 + idx;
    const cookTime2 = 5 + idx * 2;
    const cookTime3 = 4 + idx;

    const oil = fasting ? "ghee" : "oil";
    const spiceVariation = hot
      ? "red chili powder and garam masala"
      : mild
      ? "turmeric and coriander powder"
      : "cumin powder and mixed spices";

    // Different cooking methods based on index
    const cookingMethods = [
      {
        method: "sauté and simmer",
        steps: [
          `Prepare all ingredients: wash and finely chop ${ing1}, ${ing2}, and ${ing3}. This should take about ${prepTime} minutes.`,
          `Heat 2 tablespoons of ${oil} in a heavy-bottomed kadhai or pan over ${heat} heat for 1-2 minutes.`,
          `Add cumin seeds and let them splutter for 30 seconds. If using whole spices, add them now and bloom until aromatic.`,
          `Add finely chopped onions ${
            fasting ? "(or skip for fasting)" : ""
          } and sauté for ${cookTime1} minutes until translucent and golden.`,
          `Stir in ${ing1} and cook for ${cookTime2} minutes, stirring occasionally to prevent sticking. Add a splash of water if needed.`,
          `Add ${ing2} and ${spiceVariation}. Mix well and cook for ${cookTime3} minutes on ${heat} heat until well combined.`,
          `Finally fold in ${ing3}, season with salt to taste, and cook for 2-3 minutes. The consistency should be thick and well-blended.`,
          `Garnish with fresh coriander leaves and a squeeze of lemon juice. Let it rest for 2 minutes before serving.`,
        ],
      },
      {
        method: "stir-fry style",
        steps: [
          `Begin by prepping your ingredients: dice ${ing1} into small cubes, julienne ${ing2}, and roughly chop ${ing3}. Takes approximately ${prepTime} minutes.`,
          `Preheat a wok or large kadhai with 2 tablespoons ${oil} on high heat for 2 minutes until shimmering.`,
          `Toss in mustard seeds and curry leaves, letting them crackle and release their aroma for about 20 seconds.`,
          `Quickly add ${ing1} and stir-fry on high heat for ${cookTime1} minutes, keeping ingredients moving to avoid burning.`,
          `Lower heat to medium, add ${ing2} along with ${spiceVariation}, and toss everything together for ${cookTime2} minutes.`,
          `Incorporate ${ing3} and continue stir-frying for another ${cookTime3} minutes. Add salt and adjust ${spiceLevel.toLowerCase()} level to preference.`,
          `For finishing touch, add a teaspoon of ${
            fasting ? "ghee" : "sesame oil"
          } and mix well for 1 minute.`,
          `Transfer to serving dish, garnish with roasted peanuts ${
            fasting ? "(if allowed)" : ""
          } and fresh herbs. Serve hot.`,
        ],
      },
      {
        method: "slow cook method",
        steps: [
          `Start with ingredient prep: soak ${ing1} if needed, finely mince ${ing2}, and cut ${ing3} into medium pieces. Prep time: ${prepTime} minutes.`,
          `In a thick-bottomed pot, heat 2 tablespoons of ${oil} over medium heat for about 90 seconds.`,
          `Add asafoetida (hing) ${
            fasting ? "for fasting flavor" : ""
          } followed by ginger-garlic paste ${
            fasting ? "(skip for fasting)" : ""
          }. Sauté for 1 minute.`,
          `Add ${ing1} and cook gently for ${cookTime1} minutes, stirring occasionally to coat with aromatic base.`,
          `Mix in ${ing2}, ${spiceVariation}, and a pinch of turmeric. Cook on low-medium heat for ${cookTime2} minutes, letting flavors meld.`,
          `Add ${ing3} along with 1/2 cup water, cover partially, and simmer for ${
            cookTime3 + 3
          } minutes until tender and cooked through.`,
          `Uncover, increase heat slightly, and reduce any excess liquid for 2-3 minutes while stirring. Season with salt.`,
          `Finish with a tadka of ${oil} infused with dried red chilies ${
            hot ? "(extra for heat)" : ""
          }. Rest 3 minutes and serve warm.`,
        ],
      },
    ];

    return cookingMethods[idx % 3].steps;
  };

  const mk = (i, title) => {
    const recipeIngredients = [
      asQty(safePick(i), i),
      asQty(safePick(i + 1), i + 1),
      asQty(safePick(i + 2), i + 2),
    ];

    return {
      id: `${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}-${i}`,
      title,
      summary: `A delicious ${mealType.toLowerCase()} dish featuring ${safePick(
        i
      )}, ${safePick(i + 1)}, and ${safePick(
        i + 2
      )}. ${spiceLevel} spice level, serves ${servings}.`,
      servings,
      prepTime: `${8 + i * 2} min`,
      cookTime: `${14 + i * 3} min`,
      totalTime: `${22 + i * 5} min`,
      difficulty: i % 3 === 0 ? "Easy" : i % 3 === 1 ? "Medium" : "Easy",
      utensils:
        i % 3 === 0
          ? ["Kadhai (wok)", "Spatula", "Measuring cups"]
          : i % 3 === 1
          ? ["Large pan", "Wooden spoon", "Chopping board"]
          : ["Heavy-bottomed pot", "Ladle", "Mixing bowl"],
      ingredients: recipeIngredients,
      steps: makeSteps(i, title, recipeIngredients),
      nutrition: {
        calories: calorieTarget + i * 10,
        protein: 12 + i * 3,
        carbs: 40 + i * 5,
        fat: 10 + i * 2,
      },
      allergens: [diet === "Vegan" ? "" : "Dairy"].filter(Boolean),
      tips: [
        `For ${title}, ensure all ingredients are fresh for best flavor.`,
        `Adjust ${spiceLevel.toLowerCase()} spice level by varying the amount of chili powder used.`,
        `This dish pairs wonderfully with ${
          mealType === "Breakfast"
            ? "masala chai"
            : mealType === "Lunch"
            ? "rice or roti"
            : mealType === "Dinner"
            ? "naan or quinoa"
            : "mint chutney"
        }.`,
      ],
      variations: [
        `Make it ${
          diet === "Vegan" ? "gluten-free" : "vegan"
        } by substituting ${
          diet === "Vegan"
            ? "regular flour with chickpea flour"
            : "ghee with coconut oil"
        }.`,
        fasting
          ? `For regular version, add garlic and onions for enhanced flavor.`
          : `For fasting version, skip onions and garlic, use rock salt instead.`,
        `Add ${
          i % 2 === 0 ? "roasted cashews" : "fried curry leaves"
        } on top for extra richness.`,
      ],
      tags: [...baseTags, diet, mealType],
      imagePrompt: `${title}, authentic Indian ${mealType}, beautifully plated on traditional serveware, garnished, professional food photography, soft natural lighting, appetizing, 16:9`,
    };
  };

  const names = [
    `${fasting ? "Fasting " : ""}${diet} ${safePick(0)} ${mealType} Bowl`,
    `Spiced ${safePick(1)} with ${safePick(2)} Medley`,
    `${mealType} Special: ${safePick(0)} & ${safePick(1)} Delight`,
  ];

  return { dishes: names.map((n, i) => mk(i, n)) };
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

    const prompt = `You are an expert Indian chef AI specializing in authentic Indian cuisine. Propose exactly THREE completely DISTINCT and UNIQUE dish ideas as a JSON array named "dishes".

CRITICAL REQUIREMENTS:
1. Each dish MUST be completely different from the others
2. Each dish MUST have its own UNIQUE cooking steps tailored specifically to that dish
3. Steps MUST be detailed, specific, and practical - NOT generic templates
4. Each step should include timing, temperatures, and specific techniques for THAT PARTICULAR DISH

Each dish object MUST include ALL of the following fields:

BASIC INFO:
- id: short slug (e.g., "paneer-tikka-masala-xyz")
- title: Authentic Indian dish name
- summary: 2-3 sentences describing the dish's flavor profile and uniqueness

COOKING DETAILS:
- servings: ${servings}
- prepTime: realistic prep time (e.g., "15 min")
- cookTime: realistic cooking time (e.g., "25 min")  
- totalTime: total time needed
- difficulty: "Easy", "Medium", or "Hard"
- utensils: array of specific cookware needed (e.g., ["Kadhai", "Pressure cooker", "Grinding stone"])

INGREDIENTS:
- ingredients: array of objects with { name: "ingredient name", quantity: "specific amount with units" }
  * MUST use the available ingredients: ${ingredients.join(", ")}
  * Add complementary Indian spices and staples as needed
  * Be specific with quantities (e.g., "2 cups", "1 tsp", "250g")

COOKING STEPS (MOST IMPORTANT - MAKE EACH RECIPE UNIQUE):
- steps: 8-12 clear, detailed, imperative steps that are SPECIFIC to this exact dish
  * Step 1: Always start with prep work specific to this dish
  * Include exact timing for each step (e.g., "sauté for 3-4 minutes until golden")
  * Specify heat levels (high/medium/low) and when to adjust
  * Include visual and sensory cues (e.g., "until fragrant", "until mixture thickens", "golden brown")
  * Mention consistency checks and what to look for
  * Include resting time if applicable
  * MAKE SURE EACH DISH HAS DIFFERENT COOKING TECHNIQUES (e.g., one uses tempering, one uses slow cooking, one uses high-heat stir-frying)

NUTRITION & DIETARY:
- nutrition: { calories: ~${calorieTarget}, protein: "Xg", carbs: "Xg", fat: "Xg" }
- allergens: array of allergens if any (e.g., ["Dairy", "Nuts"])

EXTRA DETAILS:
- tips: array of 3-4 helpful cooking tips specific to this dish
- variations: array of 2-3 variations (e.g., regional, dietary adaptations)
- tags: array including dietary tags
- imagePrompt: concise prompt for photorealistic food photography (e.g., "Paneer Tikka Masala in copper kadhai, garnished with cream and coriander, restaurant style, professional food photography, warm lighting")

STRICT CONSTRAINTS:
- Diet: ${diet} ${
      diet === "Non-Veg" ? "(can include meat, eggs)" : "(vegetarian only)"
    }
- Meal Type: ${mealType}
- Fasting Mode: ${
      fasting ? "YES - NO onion, NO garlic, NO meat, use rock salt" : "NO"
    }
- Spice Level: ${spiceLevel}
- Servings: ${servings}
- Target Calories: approximately ${calorieTarget} per serving
- Available Ingredients: MUST primarily use ${ingredients.join(", ")}

IMPORTANT: Make each of the THREE dishes completely different:
- Different cooking methods (e.g., gravy-based, dry sauté, one-pot rice dish)
- Different flavor profiles (e.g., tangy, creamy, spicy-aromatic)
- Different textures (e.g., crispy, soft, mixed textures)
- COMPLETELY different cooking steps - do NOT reuse the same step templates!

Output STRICTLY valid JSON in this exact format with NO additional text:
{
  "dishes": [
    { /* dish 1 with all fields */ },
    { /* dish 2 with all fields */ },
    { /* dish 3 with all fields */ }
  ]
}`;

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

      let withImages;
      if (BATCH_MODE && mocked.dishes.length) {
        // Use first dish's prompt as representative to cut request volume.
        const representative = mocked.dishes[0];
        const batchPrompt =
          representative.imagePrompt ||
          `${representative.title}, high quality food photography, studio lighting, 16:9`;
        const sharedImage = await generateAndUploadImage(
          batchPrompt,
          representative.title
        );
        console.log(
          `[image-gen] batch mode enabled (mock) - reused single image for ${mocked.dishes.length} dishes`
        );
        withImages = mocked.dishes.map((d) => ({
          ...d,
          image: sharedImage,
          createdAt: new Date().toISOString(),
          _batch: true,
        }));
      } else {
        withImages = await Promise.all(
          mocked.dishes.map(async (d) => {
            const imagePrompt =
              d.imagePrompt ||
              `${d.title}, high quality food photography, studio lighting, 16:9`;
            const imageUrl = await generateAndUploadImage(imagePrompt, d.title);
            return {
              ...d,
              image: imageUrl,
              createdAt: new Date().toISOString(),
            };
          })
        );
      }

      return NextResponse.json({ dishes: withImages, source: "mock" });
    }
    // Robust JSON parsing with multiple strategies
    function tryParse(str) {
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    }
    function stripCodeFences(str) {
      return str
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "");
    }
    function extractCodeFence(str) {
      const fence =
        str.match(/```json\s*[\s\S]*?```/i) || str.match(/```\s*[\s\S]*?```/i);
      return fence ? fence[0] : null;
    }
    function extractCurlyBlock(str) {
      const start = str.indexOf("{");
      const end = str.lastIndexOf("}");
      if (start === -1 || end === -1 || end <= start) return null;
      return str.slice(start, end + 1);
    }
    function removeDanglingCommas(str) {
      // remove trailing commas before } or ]
      return str.replace(/,(\s*[}\]])/g, "$1");
    }

    let parsed = null;
    // 1) direct
    parsed = parsed || tryParse(text);
    // 2) code fence
    if (!parsed) {
      const fence = extractCodeFence(text);
      if (fence) parsed = tryParse(stripCodeFences(fence));
    }
    // 3) balanced curly slice
    if (!parsed) {
      const block = extractCurlyBlock(text);
      if (block)
        parsed = tryParse(block) || tryParse(removeDanglingCommas(block));
    }
    // 4) final sanitization attempt
    if (!parsed) parsed = tryParse(removeDanglingCommas(text));

    if (!parsed || !Array.isArray(parsed.dishes)) {
      // Fall back to mock instead of 500, include raw for debugging
      const mocked = mockDishes({
        diet,
        mealType,
        fasting,
        spiceLevel,
        servings,
        calorieTarget,
        ingredients,
      });

      let withImages;
      if (BATCH_MODE && mocked.dishes.length) {
        const representative = mocked.dishes[0];
        const batchPrompt =
          representative.imagePrompt ||
          `${representative.title}, high quality food photography, studio lighting, 16:9`;
        const sharedImage = await generateAndUploadImage(
          batchPrompt,
          representative.title
        );
        console.log(
          `[image-gen] batch mode enabled (fallback) - reused single image for ${mocked.dishes.length} dishes`
        );
        withImages = mocked.dishes.map((d) => ({
          ...d,
          image: sharedImage,
          createdAt: new Date().toISOString(),
          _source: "fallback-parse",
          _batch: true,
        }));
      } else {
        withImages = await Promise.all(
          mocked.dishes.map(async (d) => {
            const imagePrompt =
              d.imagePrompt ||
              `${d.title}, high quality food photography, studio lighting, 16:9`;
            const imageUrl = await generateAndUploadImage(imagePrompt, d.title);
            return {
              ...d,
              image: imageUrl,
              createdAt: new Date().toISOString(),
              _source: "fallback-parse",
            };
          })
        );
      }

      return NextResponse.json({
        dishes: withImages,
        source: "gemini-fallback",
        raw: text,
      });
    }

    let withImages;
    if (BATCH_MODE && parsed.dishes.length) {
      const representative = parsed.dishes[0];
      const batchPrompt =
        representative.imagePrompt ||
        `${representative.title}, high quality food photography, studio lighting, 16:9`;
      const sharedImage = await generateAndUploadImage(
        batchPrompt,
        representative.title
      );
      console.log(
        `[image-gen] batch mode enabled (gemini) - reused single image for ${parsed.dishes.length} dishes`
      );
      withImages = parsed.dishes.map((d) => ({
        ...d,
        image: sharedImage,
        createdAt: new Date().toISOString(),
        _batch: true,
      }));
    } else {
      withImages = await Promise.all(
        parsed.dishes.map(async (d) => {
          const imagePrompt =
            d.imagePrompt ||
            `${d.title}, high quality food photography, studio lighting, 16:9`;
          const imageUrl = await generateAndUploadImage(imagePrompt, d.title);
          return {
            ...d,
            image: imageUrl,
            createdAt: new Date().toISOString(),
          };
        })
      );
    }

    return NextResponse.json({ dishes: withImages, source: "gemini" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
