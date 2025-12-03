"use client";
import { useState } from "react";
import { useRecipes } from "../../../context/RecipeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  const { signUp } = useRecipes();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!name) {
      setError("Please enter your name");
      return;
    }
    // Minimal validation: must contain one @ and one .
    const basicEmail = /.+@.+\..+/;
    if (!basicEmail.test(email)) {
      setError("Enter a valid email (must include @ and .)");
      return;
    }
    try {
      await signUp(name, email, password);
      // Redirect to sign-in after signup as requested
      router.push("/auth/signin");
    } catch (err) {
      setError(err?.message || "Sign up failed");
    }
  }
  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-white/95">Create Account</h1>
        <p className="text-xs text-white/50">Create account (Supabase)</p>
      </div>
      <form
        onSubmit={submit}
        className="space-y-4 glass border border-white/10 rounded-2xl p-5"
      >
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]"
            placeholder="Your Name"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]"
            placeholder="••••••••"
          />
        </div>
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
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white bg-[linear-gradient(120deg,rgba(var(--accent-rgb)/0.25),rgba(var(--accent-rgb)/0.1))] border border-[rgba(var(--accent-rgb)/0.5)] hover:bg-[linear-gradient(120deg,rgba(var(--accent-rgb)/0.4),rgba(var(--accent-rgb)/0.15))]"
        >
          Sign Up
        </button>
        <p className="text-[11px] text-white/55 text-center">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="text-[rgba(var(--accent-rgb)/0.9)] underline"
          >
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
