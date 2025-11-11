/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.pollinations.ai" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      // Supabase Storage (use your project subdomain)
      { protocol: "https", hostname: "zxebcwlaaotxiapbqrco.supabase.co" },
      // Optional: allow any Supabase project (wildcard). If your Next.js version
      // supports wildcard hostnames you can uncomment the following:
      // { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};
export default nextConfig;
