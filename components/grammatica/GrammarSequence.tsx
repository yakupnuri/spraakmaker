"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GRAMMAR_STEPS } from "@/lib/grammarData";
import TegenwoordigeTijdPanel from "./TegenwoordigeTijdPanel";
import PerfectumPanel from "./PerfectumPanel";
import ImperfectumPanel from "./ImperfectumPanel";
import ModaleWerkwoordenPanel from "./ModaleWerkwoordenPanel";
import ScheidbareWerkwoordenPanel from "./ScheidbareWerkwoordenPanel";
import BijzinnenPanel from "./BijzinnenPanel";
import GrammarPanel from "./GrammarPanel";
const TOPIC_ACCENT_COLORS = [
  "var(--primary)",    // 1 Tegenwoordige tijd
  "var(--danger)",     // 2 Perfectum
  "var(--accent)",  // 3 Imperfectum
  "var(--text)",   // 4 Modaal
  "var(--primary)",    // 5 Scheidbaar
  "var(--danger)",     // 6 Bijzinnen
];



const TOPIC_ICONS = ["🔤", "✅", "⏪", "🔑", "✂️", "🔗"];

function IconChevron({ open, size = 18 }: { open: boolean; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.25 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </motion.svg>
  );
}

function IconPen({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function IconArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

interface GrammarSequenceProps {
  onStartOefen: () => void;
}

export default function GrammarSequence({ onStartOefen }: GrammarSequenceProps) {
  const [openTopic, setOpenTopic] = useState(-1);

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col gap-2 p-4">
        {/* Section intro */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-3 mb-1"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text)] opacity-90">
            6 stappen naar vloeiend Nederlands / Akıcı Hollandaca için 6 adım
          </p>
        </motion.div>

        {GRAMMAR_STEPS.map((rule, i) => {
          const accent = TOPIC_ACCENT_COLORS[i];
          const icon = TOPIC_ICONS[i];
          const isOpen = openTopic === i;
          const isYellow = accent === "var(--accent)";

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="border border-[var(--border)] rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenTopic(isOpen ? -1 : i)}
                className="w-full flex items-center gap-3 px-4 py-4 text-left cursor-pointer border-none transition-all duration-200 text-[var(--text)] bg-[var(--surface-2)]"
                style={{
                  backgroundColor: isOpen ? 'var(--primary)' : 'var(--surface-2)',
                  color: isOpen ? '#fff' : 'var(--text)',
                }}
              >
                <span
                  className="text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{
                    backgroundColor: isOpen ? "rgba(255,255,255,0.15)" : accent,
                    color: isOpen ? '#fff' : isYellow ? "var(--text)" : '#fff',
                  }}
                >
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-sm uppercase tracking-wide block" style={{ color: isOpen ? '#fff' : 'var(--text)' }}>{rule.title}</span>
                  {!isOpen && (
                    <span className="text-[10px] block mt-0.5 truncate text-[var(--text-muted)]">
                      {rule.steps.length} stappen · {rule.examples.length} voorbeelden
                    </span>
                  )}
                </div>
                <span style={{ color: isOpen ? '#fff' : 'var(--text)' }}>
                  <IconChevron open={isOpen} size={18} />
                </span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden border-t border-[var(--border)]"
                  >
                    {i === 0 ? (
                      <TegenwoordigeTijdPanel accentColor={accent} />
                    ) : i === 1 ? (
                      <PerfectumPanel accentColor={accent} />
                    ) : i === 2 ? (
                      <ImperfectumPanel accentColor={accent} />
                    ) : i === 3 ? (
                      <ModaleWerkwoordenPanel accentColor={accent} />
                    ) : i === 4 ? (
                      <ScheidbareWerkwoordenPanel accentColor={accent} />
                    ) : i === 5 ? (
                      <BijzinnenPanel accentColor={accent} />
                    ) : (
                      <GrammarPanel rule={rule} accentColor={accent} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* CTA Button */}
      <div className="p-4 pt-0 mt-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartOefen}
          className="w-full py-5 font-bold uppercase tracking-widest border-none cursor-pointer flex items-center justify-center gap-3 rounded-xl text-sm bg-[var(--primary)]"
          style={{ color: '#fff' }}
        >
          <IconPen size={18} />
          Begin met oefenen / Alıştırmalara Başla
          <IconArrowRight size={18} />
        </motion.button>
      </div>
    </div>
  );
}
