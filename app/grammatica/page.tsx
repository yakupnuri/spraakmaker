"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Verb } from "@/lib/types";
import {
  FREQ_ORDER_REGELMATIG,
  FREQ_ORDER_ONREGELMATIG,
} from "@/lib/grammarData";
import GrammarSequence from "@/components/grammatica/GrammarSequence";
import PracticeQuiz from "@/components/grammatica/PracticeQuiz";
import QuizUnlocked from "@/components/grammatica/QuizUnlocked";

type Filter = "REGELMATIG" | "ONREGELMATIG" | "SCHEIDBAAR";
type PageMode = "GRAMMATICA" | "OEFEN" | "QUIZ";

const FILTERS: Filter[] = ["REGELMATIG", "ONREGELMATIG", "SCHEIDBAAR"];

function sortByFrequency(verbs: Verb[], freqList: string[]): Verb[] {
  return [
    ...freqList.map((name) => verbs.find((v) => v.infinitief === name)).filter(Boolean) as Verb[],
    ...verbs.filter((v) => !freqList.includes(v.infinitief)),
  ];
}

function IconBook({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconPen({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

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

function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function GrammaticaPage() {
  const [filter, setFilter] = useState<Filter>("REGELMATIG");
  const [pageMode, setPageMode] = useState<PageMode>("GRAMMATICA");
  const [verbs, setVerbs] = useState<Verb[]>([]);
  const [quizUnlocked, setQuizUnlocked] = useState(false);
  const [showQuizReady, setShowQuizReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const FILE_MAP: Record<Filter, string> = {
    REGELMATIG: "/data/verbs-regelmatig.json",
    ONREGELMATIG: "/data/verbs-onregelmatig.json",
    SCHEIDBAAR: "/data/verbs-scheidbaar.json",
  };

  useEffect(() => {
    setLoading(true);
    setQuizUnlocked(false);
    setShowQuizReady(false);

    fetch(FILE_MAP[filter])
      .then((r) => r.json())
      .then((data: any[]) => {
        let processed: Verb[] = data;
        if (filter === "SCHEIDBAAR") {
          processed = data.map((v) => ({
            infinitief: v.verb ?? v.infinitief ?? "",
            tr: v.tr ?? "",
            en: "",
            imperfectum_s: "",
            imperfectum_p: "",
            perfectum: "",
          }));
        }
        const freqList =
          filter === "REGELMATIG"
            ? FREQ_ORDER_REGELMATIG
            : filter === "ONREGELMATIG"
            ? FREQ_ORDER_ONREGELMATIG
            : [];
        setVerbs(sortByFrequency(processed.filter((v) => v.infinitief), freqList));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  const MODE_CONFIG: { key: PageMode; label: string; icon: React.ReactNode; locked: boolean }[] = [
    { key: "GRAMMATICA", label: "Grammatica", icon: <IconBook size={14} />, locked: false },
    { key: "OEFEN", label: "Oefen", icon: <IconPen size={14} />, locked: false },
    { key: "QUIZ", label: "Quiz", icon: quizUnlocked ? <IconTrophy size={14} /> : <LockIcon size={12} />, locked: !quizUnlocked },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      {/* Header bar */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-4 flex items-center justify-between bg-[var(--surface)] border-b border-[var(--border)] shadow-sm select-none"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📝</span>
          <span className="text-sm font-black uppercase tracking-wider text-[var(--text)]">grammatica</span>
        </div>
        <span className="text-xs font-bold px-3 py-0.5 bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] rounded-full">
          {verbs.length} {verbs.length === 1 ? "werkwoord" : "werkwoorden"}
        </span>
      </motion.header>

      {/* Mode tabs — segment control */}
      <div className="px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] select-none">
        <div className="flex gap-1 bg-[var(--surface-2)] rounded-2xl p-1 border border-[var(--border)] max-w-lg mx-auto">
          {MODE_CONFIG.map(({ key, label, icon, locked }) => {
            const isActive = pageMode === key;
            return (
              <button
                key={key}
                onClick={() => !locked && setPageMode(key)}
                disabled={locked}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all duration-200 border-none rounded-xl cursor-pointer ${
                  locked
                    ? "opacity-30 cursor-not-allowed bg-transparent text-[var(--text-muted)]"
                    : isActive
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category filter — only for Oefen & Quiz */}
      <AnimatePresence>
        {pageMode !== "GRAMMATICA" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden select-none bg-[var(--surface)] border-b border-[var(--border)]"
          >
            <div className="flex gap-2.5 px-4 py-3 max-w-lg mx-auto">
              {FILTERS.map((f) => {
                const isActive = filter === f;
                return (
                  <motion.button
                    key={f}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFilter(f)}
                    className={`flex-grow py-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer border rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/20"
                        : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    {f}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="flex-1 px-3 py-4 w-full max-w-lg mx-auto">
        {pageMode === "GRAMMATICA" ? (
          <GrammarSequence onStartOefen={() => setPageMode("OEFEN")} />
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-full border-[3px] border-[var(--surface-2)] border-t-[var(--accent)]"
            />
          </div>
        ) : pageMode === "OEFEN" ? (
          showQuizReady ? (
            <QuizUnlocked
              onStart={() => {
                setQuizUnlocked(true);
                setShowQuizReady(false);
                setPageMode("QUIZ");
              }}
            />
          ) : (
            <PracticeQuiz
              verbs={verbs}
              isQuiz={false}
              practiceCount={0}
              onPracticeComplete={() => setShowQuizReady(true)}
            />
          )
        ) : (
          <PracticeQuiz
            verbs={verbs}
            isQuiz={true}
            practiceCount={0}
            onPracticeComplete={() => {}}
          />
        )}
      </main>
    </div>
  );
}
