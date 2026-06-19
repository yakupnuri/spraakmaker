"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FeedbackToastProps {
  state: "correct" | "wrong" | null;
  message: string;
  detail?: string;
}

export default function FeedbackToast({ state, message, detail }: FeedbackToastProps) {
  if (!state) return null;

  const isCorrect = state === "correct";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={
          isCorrect
            ? { opacity: 1, y: 0, scale: 1 }
            : {
                opacity: 1,
                y: 0,
                scale: 1,
                x: [-8, 8, -8, 8, -4, 4, 0],
              }
        }
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={
          isCorrect
            ? { duration: 0.25 }
            : {
                x: { duration: 0.4 },
                default: { duration: 0.25 },
              }
        }
        className={`fixed left-4 right-4 z-40 p-4 rounded-2xl border shadow-lg max-w-lg mx-auto flex items-start gap-3 select-none
          bottom-[148px] md:bottom-[80px]
          ${
            isCorrect
              ? "bg-[var(--success-soft)] border-[var(--success)] text-[var(--success)]"
              : "bg-[var(--danger-soft)] border-[var(--danger)] text-[var(--danger)]"
          }`}
      >
        <span className="text-xl shrink-0 mt-0.5">{isCorrect ? "✓" : "✗"}</span>
        <div className="flex-1">
          <p className="font-black text-sm uppercase tracking-wide leading-tight">{message}</p>
          {detail && (
            <p className="text-xs mt-1 text-[var(--text)] font-medium opacity-90 leading-normal bg-white/40 dark:bg-black/10 p-2 rounded-xl">
              {detail}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
