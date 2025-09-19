"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRecipes } from "../context/RecipeContext";
import { motion } from "framer-motion";

export default function Navbar() {
  const { user, signOut } = useRecipes();
  const pathname = usePathname();
  const links = [
    { href: "/generate", label: "Create Recipe" },
    { href: "/community", label: "Community" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <nav className="sticky top-0 z-40 py-3">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="glass border border-[--panel-border] rounded-2xl h-14 flex items-center px-4 sm:px-6 gap-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.10),transparent_60%)] pointer-events-none" />
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-9 w-9 rounded-xl bg-[linear-gradient(135deg,#0d6dd9,#16bfa6_55%,#3ddc91)] p-[1px]">
              <div className="h-full w-full rounded-[11px] bg-[#0c121b] flex items-center justify-center text-[15px] font-bold tracking-tight text-white/90 group-hover:text-white transition">
                Z
              </div>
            </div>
            <span className="text-sm font-semibold tracking-wide gradient-text hidden sm:inline">
              Zaika AI
            </span>
          </Link>

          <ul className="flex-1 flex items-center gap-2 text-[13px] font-medium text-[--muted]">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href} className="relative">
                  <Link
                    href={l.href}
                    className={`px-3 py-2 rounded-md transition-colors hover:text-white ${
                      active ? "text-white" : ""
                    }`}
                  >
                    {l.label}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute left-2 right-2 -bottom-[2px] h-[2px] rounded-full"
                        style={{ background: "var(--accent-gradient)" }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={signOut}
                className="relative group text-[12px] font-medium px-4 py-2 rounded-xl bg-[linear-gradient(120deg,rgba(var(--accent-rgb)/0.15),rgba(var(--accent-rgb)/0.05))] border border-[rgba(var(--accent-rgb)/0.4)] text-white hover:bg-[linear-gradient(120deg,rgba(var(--accent-rgb)/0.35),rgba(var(--accent-rgb)/0.08))] transition"
              >
                <span className="relative z-10">Sign Out</span>
                <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition shadow-[0_0_0_1px_rgba(var(--accent-rgb)/0.4),0_0_18px_-2px_rgba(var(--accent-rgb)/0.5)]" />
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="relative group text-[12px] font-medium px-4 py-2 rounded-xl bg-[linear-gradient(120deg,rgba(var(--accent-rgb)/0.15),rgba(var(--accent-rgb)/0.05))] border border-[rgba(var(--accent-rgb)/0.4)] text-white hover:bg-[linear-gradient(120deg,rgba(var(--accent-rgb)/0.35),rgba(var(--accent-rgb)/0.08))] transition"
              >
                <span className="relative z-10">Sign In</span>
                <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition shadow-[0_0_0_1px_rgba(var(--accent-rgb)/0.4),0_0_18px_-2px_rgba(var(--accent-rgb)/0.5)]" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
