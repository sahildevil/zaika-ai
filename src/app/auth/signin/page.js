"use client";
import { useState } from "react";
import { useRecipes } from "../../../context/RecipeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const { signIn } = useRecipes();
  const [email, setEmail] = useState("");
  const router = useRouter();
  function submit(e) {
    e.preventDefault();
    if (!email) return;
    signIn(email);
    router.push("/profile");
  }
  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Sign In</h1>
        <p className="text-xs text-neutral-500">Temporary local auth only.</p>
      </div>
      <form
        onSubmit={submit}
        className="space-y-4 bg-white border rounded-xl p-5"
      >
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
          Sign In
        </button>
        <p className="text-[11px] text-neutral-500 text-center">
          Need an account?{" "}
          <Link href="/auth/signup" className="text-emerald-600 underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
