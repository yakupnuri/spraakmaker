"use client";

import React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

interface GameChooserSheetProps {
  lesId: string;
  isOpen: boolean;
  onClose: () => void;
}

const GAMES = [
  {
    id: "zin-bouwen",
    title: "Zin Bouwen",
    icon: "🧩",
    tag: "Drag & Drop",
    colorBg: "bg-blue-100 dark:bg-blue-950/35",
    colorText: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "vul-in",
    title: "Vul In",
    icon: "✏️",
    tag: "Vul in",
    colorBg: "bg-orange-100 dark:bg-orange-950/35",
    colorText: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "vertaal",
    title: "Vertaal",
    icon: "🔄",
    tag: "TR → NL",
    colorBg: "bg-teal-100 dark:bg-teal-950/35",
    colorText: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "snelronde",
    title: "Snelronde",
    icon: "⚡",
    tag: "60 sec",
    colorBg: "bg-red-100 dark:bg-red-950/35",
    colorText: "text-red-600 dark:text-red-400",
  },
  {
    id: "zin-motor",
    title: "Zin Motor",
    icon: "⚙️",
    tag: "Zinnen",
    colorBg: "bg-yellow-100 dark:bg-yellow-950/35",
    colorText: "text-yellow-600 dark:text-yellow-400",
  },
  {
    id: "flitsen",
    title: "Flitsen",
    icon: "📣",
    tag: "Spaced Rep",
    colorBg: "bg-purple-100 dark:bg-purple-950/35",
    colorText: "text-purple-600 dark:text-purple-400",
  },
];

export default function GameChooserSheet({ lesId, isOpen, onClose }: GameChooserSheetProps) {
  const displayNum = lesId.replace("les_", "");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 z-55 bg-[var(--surface)] border-t border-[var(--border)] rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.15)] max-w-lg mx-auto overflow-hidden pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          >
            {/* Grabber handle */}
            <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto my-3 opacity-60" />

            {/* Title / Header */}
            <div className="px-5 pb-3 flex justify-between items-center select-none border-b border-[var(--border)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">🎮 Kies een spel</h3>
                <p className="text-xs text-[var(--text-muted)] opacity-75">
                  Les {displayNum} hikâye cümleleriyle oyna
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-[var(--surface-2)] flex items-center justify-center font-bold text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Games list/grid */}
            <div className="p-4 grid grid-cols-2 gap-2 overflow-y-auto max-h-[60vh]">
              {GAMES.map((game) => (
                <Link
                  key={game.id}
                  href={`/spel/${game.id}?les=${lesId}&bron=verhaal`}
                  onClick={onClose}
                  className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center text-center gap-2 hover:border-[var(--accent)] hover:shadow-xs transition-all active:scale-[0.98] select-none"
                >
                  <div className={`w-10 h-10 rounded-xl ${game.colorBg} flex items-center justify-center text-xl`}>
                    {game.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-[var(--text)]">{game.title}</h4>
                    <span className={`inline-block mt-0.5 px-1.5 py-0.25 text-[7px] font-bold uppercase tracking-wider rounded-md ${game.colorBg} ${game.colorText}`}>
                      {game.tag}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
