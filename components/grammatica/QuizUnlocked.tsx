"use client";

import { motion } from "framer-motion";
import StarBurst from "./StarBurst";
import { IconArrowRight } from "@/components/Icons";

function IconTrophy({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

interface QuizUnlockedProps {
  onStart: () => void;
}

export default function QuizUnlocked({ onStart }: QuizUnlockedProps) {
  return (
    <div className="p-4 flex flex-col gap-4 flex-1 items-center justify-center">
      <StarBurst />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-90 mb-2">GOED GEDAAN!</p>
        <p className="text-2xl font-bold mb-1">10 oefeningen voltooid!</p>
        <p className="text-sm opacity-50">Je kunt nu de quiz starten. Succes!</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="w-full max-w-sm py-5 font-bold uppercase tracking-widest border-none cursor-pointer flex items-center justify-center gap-3 rounded-xl text-sm mt-4 bg-[var(--accent)]"
        style={{ color: 'var(--text)' }}
      >
        <IconTrophy size={18} />
        Start quiz
        <IconArrowRight size={18} />
      </motion.button>
    </div>
  );
}
