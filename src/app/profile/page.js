"use client";
import { useRecipes } from "../../context/RecipeContext";
import RecipeCard from "../../components/RecipeCard";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ProfilePage() {
  const { user, savedRecipes, updateProfile, signOut, preferences, updatePreferences } = useRecipes();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [spice, setSpice] = useState(preferences?.spice || "Medium");
  const [servings, setServings] = useState(preferences?.servings || 1);
  const [createdRecipes, setCreatedRecipes] = useState([]);

  // Sync local form state when user changes (fixes empty fields on refresh)
  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user?.name, user?.email]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) { setCreatedRecipes([]); return; }
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`/api/recipes?userId=${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!active) return;
      if (res.ok) {
        const json = await res.json();
        setCreatedRecipes(Array.isArray(json.recipes) ? json.recipes : []);
      }
    }
    load();
    return () => { active = false; };
  }, [user?.id]);
  if (!user)
    return (
      <div className="space-y-4">
        <p className="text-sm">
          You need to{" "}
          <Link href="/auth/signin" className="text-emerald-600 underline">
            sign in
          </Link>{" "}
          to view your profile.
        </p>
      </div>
    );
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Profile</h2>
          <button onClick={signOut} className="text-xs underline text-white/70 hover:text-white">Sign out</button>
        </div>
        <div className="glass p-5 rounded-2xl border border-white/10 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-white/50">Name</label>
            <input disabled={!editing} value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-white/50">Email</label>
            <input disabled={!editing} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-white/50">Preferred Spice</label>
            <select disabled={!editing} value={spice} onChange={(e) => setSpice(e.target.value)} className="mt-1 w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]">
              {["Mild","Medium","Hot"].map((s) => (
                <option key={s} className="bg-[var(--background-alt)]">{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-white/50">Default Servings</label>
            <input disabled={!editing} type="number" min={1} max={8} value={servings} onChange={(e) => setServings(Number(e.target.value))} className="mt-1 w-full h-10 glass rounded-xl px-3 text-sm text-white/90 bg-transparent border border-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb)/0.45)]" />
          </div>
          <div className="sm:col-span-2 flex gap-3">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-xs px-3 py-2 rounded-md border border-white/15 hover:border-[rgba(var(--accent-rgb)/0.5)]">Edit</button>
            ) : (
              <>
                <button onClick={() => { updateProfile(name, email); updatePreferences({ spice, servings }); setEditing(false); }} className="text-xs px-3 py-2 rounded-md border border-[rgba(var(--accent-rgb)/0.5)] bg-[rgba(var(--accent-rgb)/0.15)]">Save</button>
                <button onClick={() => { setName(user.name); setEmail(user.email); setSpice(preferences.spice); setServings(preferences.servings); setEditing(false); }} className="text-xs px-3 py-2 rounded-md border border-white/15">Cancel</button>
              </>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white/90">Saved Recipes</h3>
          <p className="text-sm text-white/55">Saved generative outputs appear here.</p>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {savedRecipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
        {savedRecipes.length === 0 && (
          <p className="text-sm text-neutral-500">
            No saved recipes yet. Generate one!
          </p>
        )}
      </div>
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white/90">Your Created Recipes</h3>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {createdRecipes.map((r) => (
            <RecipeCard key={r.id} recipe={{
              id: r.id,
              title: r.title,
              image: r.image || undefined,
              tags: r.tags || [],
              steps: r.steps || [],
              nutrition: r.nutrition || null,
              calories: r.calories || null,
            }} />
          ))}
          {createdRecipes.length === 0 && (
            <p className="text-sm text-neutral-500">No created recipes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
