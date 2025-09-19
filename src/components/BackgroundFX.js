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
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 0.9, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(61,220,145,0.18), transparent 60%)",
        }}
      />
      <motion.div
        className="absolute top-1/3 left-[15%] w-72 h-72 rounded-full blur-3xl opacity-40"
        animate={{ y: [0, -25, 0], opacity: [0.4, 0.55, 0.4] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(140deg,#16bfa6 0%, #0d6dd9 90%)",
        }}
      />
      <motion.div
        className="absolute bottom-[-120px] right-[10%] w-[480px] h-[480px] rounded-full blur-[140px] opacity-30"
        animate={{ y: [0, 40, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "linear-gradient(160deg,#3ddc91 0%, #16bfa6 40%, #0d6dd9 95%)",
        }}
      />
    </div>
  );
}
