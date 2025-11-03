# Supabase Storage Setup for Recipe Images

## Step 1: Create the Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create Bucket** (or **New Bucket**)
4. Configure the bucket:
   - **Bucket Name:** `recipe-images`
   - **Public Bucket:** ✅ Enable (so images can be accessed via public URLs)
   - Click **Create Bucket**

## Step 2: Set Up Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies:

### SQL Script for Storage Policies

Run the following SQL in the Supabase SQL Editor:

```sql
-- Allow public read access to recipe images
CREATE POLICY "Public read access for recipe images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload recipe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recipe-images');

-- Allow service role to upload images (for API generation)
CREATE POLICY "Service role can upload recipe images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'recipe-images');

-- Allow users to update their own uploads
CREATE POLICY "Users can update own recipe images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own recipe images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 3: Configure Environment Variables

Add the following to your `.env.local` file if you want to use the service role key for better upload permissions:

```env
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Add service role key for server-side operations (more permissions)
# You can find this in Supabase Dashboard > Settings > API
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key
```

## Step 4: Verify Setup

After setting up:

1. Generate a recipe using your app
2. Check the Supabase Storage dashboard
3. You should see new images uploaded to the `recipe-images` bucket
4. Click on an image to verify it's publicly accessible

## Bucket Configuration Details

- **Bucket Name:** `recipe-images`
- **Public:** Yes
- **File Size Limit:** 5MB (default, can be increased)
- **Allowed MIME types:** image/jpeg, image/png, image/webp

## Troubleshooting

### Images not uploading?
- Check that the bucket name is exactly `recipe-images`
- Verify the RLS policies are created
- Make sure the service role key is correct (or anon key has sufficient permissions)

### Images not displaying?
- Ensure the bucket is set to **Public**
- Check the public URL format: `https://[project-ref].supabase.co/storage/v1/object/public/recipe-images/[filename]`

### Permission errors?
- If using anon key, ensure policies allow public/authenticated uploads
- If using service role key, ensure it's correctly set in environment variables

## Image Format

All images are:
- Stored as JPEG format
- Generated with 16:9 aspect ratio (1200x675px)
- Named with pattern: `[dish-name]-[timestamp].jpg`
- Optimized for web viewing
