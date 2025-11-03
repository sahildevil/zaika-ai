# Zaika AI - Intelligent Indian Recipe Generator

An AI-powered recipe generation platform focused on Indian cuisine with support for dietary preferences, fasting requirements, and personalized nutrition.

## Features

✨ **AI Recipe Generation** - Generate personalized Indian recipes using Google Gemini AI
🍽️ **Dietary Preferences** - Support for Vegan, Vegetarian, Non-Veg, Keto, Jain, and Gluten-Free diets
🌙 **Fasting Mode** - Generate fasting-compliant recipes (no onion, garlic, meat)
📊 **Nutrition Tracking** - Detailed calorie and macro information for each recipe
🏷️ **Tag Filtering** - Browse recipes by categories and dietary tags
👥 **Community Sharing** - Share and discover recipes from other users
💾 **Save Recipes** - Bookmark your favorite generated recipes
🔍 **Search** - Find recipes by ingredients, tags, or dish names
🎨 **Beautiful UI** - Modern, responsive design with dark/light theme support

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Google Gemini API key (optional - app works with mock data without it)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd zaikaai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up Supabase**

   - Create a new Supabase project
   - Run the SQL schema from `supabase_schema.sql` in the Supabase SQL Editor
   - Enable email authentication in Supabase Auth settings
   - **REQUIRED:** Create a storage bucket named `recipe-images` for AI-generated recipe images
     - See `SUPABASE_STORAGE_SETUP.md` for detailed instructions
     - This is required for the recipe generation feature to work properly

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the app.

### Demo Credentials

For testing, you can use these demo credentials:
- Email: `demo@zaika.ai`
- Password: `zaika123`

Or create a new account via the Sign Up page.

## Project Structure

```
zaikaai/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   ├── community/    # Community recipes page
│   │   ├── generate/     # Recipe generator page
│   │   ├── profile/      # User profile page
│   │   └── layout.js     # Root layout
│   ├── components/       # Reusable components
│   ├── context/          # React Context providers
│   └── lib/              # Utilities and configurations
├── supabase_schema.sql   # Database schema
└── package.json
```

## Key Technologies

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **Supabase** - Backend, authentication, and database
- **Google Gemini AI** - Recipe generation
- **Framer Motion** - Animations
- **Tailwind CSS 4** - Styling

## API Routes

### `/api/generate` (POST)
Generates recipes using Google Gemini AI or mock data.

**Request body:**
```json
{
  "diet": "Veg",
  "mealType": "Lunch",
  "calorieRange": "Medium",
  "fasting": false,
  "ingredients": ["Tomato", "Paneer", "Spinach"],
  "servings": 2,
  "spiceLevel": "Medium"
}
```

### `/api/recipes` (GET)
Fetches community recipes from Supabase.

**Query params:**
- `userId` - Filter by user ID

### `/api/recipes` (POST)
Saves new recipes to Supabase (requires authentication).

## Features in Detail

### Recipe Generation
- Uses Google Gemini AI for intelligent recipe creation
- Falls back to mock data if API key is not configured
- Generates 3 variations per request
- Includes detailed cooking instructions, nutrition info, and tips

### Authentication
- Email/password authentication via Supabase
- Magic link sign-in support
- Automatic profile creation on signup
- Persistent sessions

### Recipe Management
- Save generated recipes
- View saved recipes on profile page
- Share recipes with the community
- Filter by dietary tags and search terms

### Theme Support
- Dark mode (default)
- Light mode
- Automatic persistence of preference

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- AWS Amplify
- Railway
- Your own server with Node.js

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous key |
| `GEMINI_API_KEY` | No | Google Gemini API key (uses mock data if not provided) |

## Troubleshooting

**Images not loading:**
- Check that image domains are configured in `next.config.mjs`
- Verify network requests in browser DevTools

**Authentication errors:**
- Verify Supabase credentials in `.env.local`
- Check Supabase Auth settings
- Ensure email confirmations are disabled for development

**Recipe generation fails:**
- If using Gemini API, check API key validity
- App will fall back to mock data automatically
- Check browser console for detailed errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)