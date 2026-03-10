"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex cursor-pointer items-center gap-2.5 rounded-md py-1 text-sm font-bold tracking-tight text-zinc-900"
    >
      <motion.div 
        className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative size-full p-1.5"
        >
          <Image
            src="/logo.png"
            alt="Protected Assets Logo"
            fill
            className="object-contain"
          />
        </motion.div>
      </motion.div>
      {!compact ? <span className="uppercase tracking-[0.1em]">Protected Assets</span> : null}
    </Link>
  );
}
