"use client";

import { motion } from "framer-motion";

export function AmbientOrbits() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.svg
        viewBox="0 0 600 600"
        className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 opacity-80"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <circle cx="300" cy="300" r="180" fill="none" stroke="rgba(148,163,184,0.18)" />
        <circle cx="300" cy="300" r="230" fill="none" stroke="rgba(125,211,252,0.16)" />
        <circle cx="300" cy="300" r="110" fill="none" stroke="rgba(249,115,22,0.18)" />
        <motion.circle
          cx="300"
          cy="120"
          r="12"
          fill="#0f172a"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.circle
          cx="124"
          cy="300"
          r="8"
          fill="#7dd3fc"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
        />
        <motion.circle
          cx="460"
          cy="300"
          r="9"
          fill="#f97316"
          animate={{ scale: [1, 1.35, 1] }}
          transition={{ duration: 3.1, repeat: Number.POSITIVE_INFINITY, delay: 0.8 }}
        />
      </motion.svg>
    </div>
  );
}
