"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ACCENTS = {
  emerald: "16 185 129",
  rose: "244 63 94",
  sky: "14 165 233",
  amber: "245 158 11",
  violet: "139 92 246",
  teal: "20 184 166",
};

export default function OptionCard({
  href,
  title,
  desc,
  icon,
  accent = "emerald",
}) {
  const accentRgb = ACCENTS[accent] ?? ACCENTS.emerald;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      style={{ "--accent-rgb": accentRgb }}
    >
      <Link href={href} className="relative group block focus-ring">
        <div className="zaika-card h-full p-5 flex flex-col gap-3 rounded-2xl transition-transform duration-300 will-change-transform group-hover:-translate-y-1 group-active:translate-y-[1px] border-gradient">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 rounded-xl flex items-center justify-center text-xl font-semibold text-white bg-[linear-gradient(140deg,rgba(var(--accent-rgb)/0.9),rgba(var(--accent-rgb)/0.4)_60%,rgba(13,109,217,0.6))] shadow-[0_0_0_1px_rgba(var(--accent-rgb)/0.4),0_4px_18px_-4px_rgba(var(--accent-rgb)/0.6)] group-hover:shadow-[0_0_0_1px_rgba(var(--accent-rgb)/0.5),0_6px_28px_-6px_rgba(var(--accent-rgb)/0.75)] transition">
                {icon || <span className="text-[15px]">★</span>}
              </div>
              <h3 className="font-semibold text-base tracking-tight leading-snug text-white/90 group-hover:text-white transition">
                {title}
              </h3>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition duration-500 text-[10px] px-2 py-1 rounded-full border border-[rgba(var(--accent-rgb)/0.5)] text-white/80 bg-[rgba(var(--accent-rgb)/0.15)]">
              Go →
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-white/60 group-hover:text-white/75 transition line-clamp-3">
            {desc}
          </p>
          <div className="absolute inset-0 rounded-2xl pointer-events-none [mask:linear-gradient(#000,transparent_180%)]">
            <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-500 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(var(--accent-rgb)/0.35),transparent_60%)]" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
