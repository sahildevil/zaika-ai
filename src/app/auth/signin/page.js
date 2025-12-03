"use client";
import { useState } from "react";
import { useRecipes } from "../../../context/RecipeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

export default function SignInPage() {
  const { signIn } = useRecipes();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email");
      return;
    }
    const ok = await (password ? signIn({ email, password }) : signIn(email));
    if (!ok) {
      setError("Invalid credentials. Try demo: demo@zaika.ai / zaika123");
      return;
    }
    router.push("/profile");
  }
  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-white/95">Sign In</h1>
        <p className="text-xs text-white/50">Sign in with Supabase</p>
      </div>
      <form
        onSubmit={submit}
        className="space-y-4 glass border border-white/10 rounded-2xl p-5"
      >
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
            Password (optional)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]"
            placeholder="••••••••"
          />
          <p className="text-[10px] text-white/45">
            Demo: demo@zaika.ai / zaika123
          </p>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white bg-[linear-gradient(120deg,rgba(var(--accent-rgb)/0.25),rgba(var(--accent-rgb)/0.1))] border border-[rgba(var(--accent-rgb)/0.5)] hover:bg-[linear-gradient(120deg,rgba(var(--accent-rgb)/0.4),rgba(var(--accent-rgb)/0.15))]"
        >
          Sign In
        </button>
        <p className="text-[11px] text-white/55 text-center">
          Need an account?{" "}
          <Link
            href="/auth/signup"
            className="text-[rgba(var(--accent-rgb)/0.9)] underline"
          >
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
