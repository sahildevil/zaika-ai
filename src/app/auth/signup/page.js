"use client";
import { useState } from "react";
import { useRecipes } from "../../../context/RecipeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const { signUp } = useRecipes();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();
  function submit(e) {
    e.preventDefault();
    if (!name || !email) return;
    signUp(name, email);
    router.push("/profile");
  }
  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Create Account</h1>
        <p className="text-xs text-neutral-500">
          Local only — will reset on refresh.
        </p>
      </div>
      <form
        onSubmit={submit}
        className="space-y-4 bg-white border rounded-xl p-5"
      >
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-2 py-2 text-sm"
            placeholder="Your Name"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-2 py-2 text-sm"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-700"
        >
          Sign Up
        </button>
        <p className="text-[11px] text-neutral-500 text-center">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-emerald-600 underline">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
