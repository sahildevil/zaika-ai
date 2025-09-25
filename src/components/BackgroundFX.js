"use client";
import { motion } from "framer-motion";

export default function BackgroundFX() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 star-layer" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 0.7, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] md:w-[1100px] md:h-[1100px] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(61,220,145,0.14), transparent 60%)",
        }}
      />
      <motion.div
        className="absolute top-1/3 left-[15%] w-56 h-56 md:w-72 md:h-72 rounded-full blur-3xl opacity-35"
        animate={{ y: [0, -18, 0], opacity: [0.35, 0.48, 0.35] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(140deg,#16bfa6 0%, #0d6dd9 90%)",
          willChange: "transform, opacity",
          animationPlayState: "var(--motion-state, running)",
        }}
      />
      <motion.div
        className="absolute bottom-[-120px] right-[10%] w-[380px] h-[380px] md:w-[460px] md:h-[460px] rounded-full blur-[120px] opacity-25"
        animate={{ y: [0, 34, 0], opacity: [0.25, 0.42, 0.25] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "linear-gradient(160deg,#3ddc91 0%, #16bfa6 40%, #0d6dd9 95%)",
          willChange: "transform, opacity",
          animationPlayState: "var(--motion-state, running)",
        }}
      />
      {/* Respect reduced motion */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          :root { --motion-state: paused; }
        }
      `}</style>
    </div>
  );
}
