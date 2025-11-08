# Supabase Storage Setup for Recipe Images

## ⚠️ IMPORTANT: Current Status

The recipe generation currently uses **placeholder images** because Supabase Storage policies need to be configured. Once you complete the setup below, uncomment the code in `src/app/api/generate/route.js` to enable real AI-generated images.

## Step 1: Create the Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create Bucket** (or **New Bucket**)
4. Configure the bucket:
   - **Bucket Name:** `recipe-images`
   - **Public Bucket:** ✅ Enable (so images can be accessed via public URLs)
   - Click **Create Bucket**

## Step 2: Set Up Storage Policies (CRITICAL - Fixes 403 Error)

The **403 RLS policy error** happens because unauthenticated requests can't upload files. You need to allow public uploads.

### Option A - Using Supabase SQL Editor (RECOMMENDED)

Run this SQL in the **SQL Editor**:

```sql
-- Allow anyone to upload images (for API route generation)
CREATE POLICY "Allow public uploads to recipe-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'recipe-images');

-- Allow public read access to recipe images
CREATE POLICY "Public read access for recipe images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-images');

-- Allow anyone to update images
CREATE POLICY "Public update access for recipe images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'recipe-images');

-- Allow anyone to delete (optional - remove if you don't want this)
CREATE POLICY "Public delete access for recipe images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'recipe-images');
```

### Option B - Using Supabase Dashboard UI

1. Go to **Storage** → **Policies**
2. Select `recipe-images` bucket
3. Click **New Policy**
4. Choose **"For full customization"**

**Policy 1: Allow Public Uploads** ⭐ THIS FIXES THE 403 ERROR
```
Name: Allow public uploads
Allowed operation: INSERT
Target roles: public
Policy definition: bucket_id = 'recipe-images'
```

**Policy 2: Public Read**
```
Name: Public read access  
Allowed operation: SELECT
Target roles: public
Policy definition: bucket_id = 'recipe-images'
```

**Policy 3: Public Update (Optional)**
```
Name: Public update access
Allowed operation: UPDATE
Target roles: public  
Policy definition: bucket_id = 'recipe-images'
```

## Step 3: Enable Supabase Storage in Code

After setting up policies, uncomment the code in `src/app/api/generate/route.js`:

1. Open `src/app/api/generate/route.js`
2. Find the `generateAndUploadImage` function (around line 29)
3. **Comment out** the placeholder return statement
4. **Uncomment** the TODO section with the Supabase upload code

## Step 4: Add Supabase Domain to Next.js Config

Update `next.config.mjs` to allow Supabase images:

```javascript
const nextConfig = {
  images: {
    remotePatterns: [
      // ... existing domains
      { 
        protocol: "https", 
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/recipe-images/**"
      },
    ],
  },
};
```

## Step 5: Configure Environment Variables (Optional)

For better upload permissions, add service role key:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Better permissions for server-side uploads
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 6: Test the Setup

1. Restart your dev server: `npm run dev`
2. Generate a new recipe
3. Check the console - should see NO errors
4. Verify images in Supabase Dashboard → Storage → recipe-images

## Troubleshooting

### Still Getting 403 Errors?

**Problem:** `new row violates row-level security policy`

**Solutions:**
1. ✅ Make sure the bucket is **PUBLIC**
2. ✅ Verify the INSERT policy allows `public` role
3. ✅ Check policy is for `bucket_id = 'recipe-images'`
4. ✅ Try deleting and recreating all policies
5. ✅ Restart your Next.js dev server

### Images Not Appearing?

1. Check bucket is public
2. Verify the public URL format
3. Check Next.js config allows Supabase domain
4. Clear browser cache

### Upload Speed Issues?

- Use service role key instead of anon key
- Check your internet connection
- Pollinations AI might be slow - normal to take 5-10 seconds per image

## Current Setup (Without Supabase)

Right now, the app uses **colorful placeholder images** from placehold.co:
- ✅ No errors
- ✅ Fast generation  
- ✅ Unique colors per recipe
- ✅ Works offline
- ❌ Not real food images

## After Supabase Setup

Once configured, you'll get:
- ✅ Real AI-generated food images
- ✅ Permanently stored in your Supabase
- ✅ No broken links
- ✅ Professional looking recipes

---

## Quick Command Summary

```sql
-- Run in Supabase SQL Editor to fix 403 error:
CREATE POLICY "Allow public uploads to recipe-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'recipe-images');
```

That's it! Once this policy is created, the 403 error will be fixed. 🎉
