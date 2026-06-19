"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress, levenshtein } from "@/lib/hooks";
import type { Verb } from "@/lib/types";
import { IconArrowRight, IconCheck, IconX } from "@/components/Icons";

type FormTarget = "imperfectum_s" | "imperfectum_p" | "perfectum";

const PRACTICE_REQUIRED = 10;

const FORM_LABELS: Record<FormTarget, string> = {
  imperfectum_s: "imperfectum (enkelvoud)",
  imperfectum_p: "imperfectum (meervoud)",
  perfectum: "perfectum",
};

interface WrongItem {
  infinitief: string;
  tr: string;
  formLabel: string;
  userAnswer: string;
  correctAnswer: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function IconPen({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

interface PracticeQuizProps {
  verbs: Verb[];
  isQuiz: boolean;
  practiceCount: number;
  onPracticeComplete: () => void;
}

export default function PracticeQuiz({
  verbs,
  isQuiz,
  practiceCount,
  onPracticeComplete,
}: PracticeQuizProps) {
  const { progress, updateProgress, recordActivity } = useProgress();
  const [queue, setQueue] = useState<Verb[]>([]);
  const [current, setCurrent] = useState<Verb | null>(null);
  const [formTarget, setFormTarget] = useState<FormTarget>("imperfectum_s");
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [scores, setScores] = useState({ goed: 0, fout: 0 });
  const [wrongHistory, setWrongHistory] = useState<WrongItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isAdvanced, setIsAdvanced] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  useEffect(() => {
    const level = localStorage.getItem("spraakmaker-niveau");
    if (level === "B1" || level === "B2") {
      setIsAdvanced(true);
    }
  }, []);

  useEffect(() => {
    const q = shuffle([...verbs]);
    setQueue(q);
    setSessionCount(0);
    setScores({ goed: 0, fout: 0 });
    setWrongHistory([]);
  }, [verbs, isQuiz]);

  useEffect(() => {
    if (queue.length) nextVerb(queue, 0);
  }, [queue]);

  function nextVerb(q: Verb[], count: number) {
    const v = q[count % q.length];
    setCurrent(v);
    const forms: FormTarget[] = ["imperfectum_s", "imperfectum_p", "perfectum"];
    const weak = progress.verbs[v?.infinitief]?.weakForm;
    const resolvedWeak: FormTarget | null =
      weak === "perfectum" ? "perfectum" : null;
    setFormTarget(resolvedWeak ?? forms[Math.floor(Math.random() * forms.length)]);
    setInput("");
    setFeedback(null);
    setHintRevealed(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function check() {
    if (!current || feedback) return;
    const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
    const target = norm(current[formTarget] ?? "");
    const correct = target.length > 0 && levenshtein(norm(input), target) <= 1;

    setFeedback(correct ? "correct" : "wrong");
    const newCount = sessionCount + 1;
    setSessionCount(newCount);
    setScores((s) => ({ goed: s.goed + (correct ? 1 : 0), fout: s.fout + (correct ? 0 : 1) }));

    if (!correct) {
      setWrongHistory((prev) => [
        {
          infinitief: current.infinitief,
          tr: current.tr,
          formLabel: FORM_LABELS[formTarget],
          userAnswer: input.trim(),
          correctAnswer: current[formTarget] ?? "",
        },
        ...prev,
      ]);
    }

    const prevVerb = progress.verbs[current.infinitief] ?? {
      correct: 0, wrong: 0, lastAttempt: "", weakForm: null,
    };
    updateProgress((p) => {
      const currentStats = p.games.stats?.grammatica || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
      const newHistory = [
        ...currentStats.history,
        {
          sentence: `${current.infinitief} (${FORM_LABELS[formTarget]})`,
          translation: current.tr,
          correct: correct,
          timestamp: new Date().toISOString(),
          userAnswer: input,
          explanation: `Doğru cevap: ${current[formTarget]}`,
        }
      ].slice(-50);

      return {
        ...p,
        verbs: {
          ...p.verbs,
          [current.infinitief]: {
            correct: prevVerb.correct + (correct ? 1 : 0),
            wrong: prevVerb.wrong + (correct ? 0 : 1),
            lastAttempt: new Date().toISOString(),
            weakForm: (correct ? null : formTarget) as "imperfectum" | "perfectum" | null,
          },
        },
        games: {
          ...p.games,
          totalPoints: p.games.totalPoints + (correct ? 10 : 0),
          lastPlayDate: new Date().toISOString(),
          stats: {
            ...p.games.stats,
            grammatica: {
              playCount: currentStats.playCount + 1,
              correctCount: currentStats.correctCount + (correct ? 1 : 0),
              wrongCount: currentStats.wrongCount + (correct ? 0 : 1),
              history: newHistory,
            }
          }
        }
      };
    });

    recordActivity();

    setTimeout(() => {
      if (!isQuiz && newCount >= PRACTICE_REQUIRED) {
        onPracticeComplete();
        return;
      }
      nextVerb(queue, newCount);
    }, correct ? 700 : 1300);
  }

  if (!current) return null;

  const progress_pct = isQuiz ? 0 : Math.min((sessionCount / PRACTICE_REQUIRED) * 100, 100);

  return (
    <div className="flex flex-col flex-1">
      {/* Practice progress bar */}
      {!isQuiz && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-widest opacity-90">
              OEFENEN
            </span>
            <span className="text-xs font-bold tabular-nums" style={{ color: "var(--primary)" }}>
              {sessionCount}/{PRACTICE_REQUIRED}
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--primary)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress_pct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          {/* Segment dots */}
          <div className="flex justify-between mt-1.5 px-[1px]">
            {Array.from({ length: PRACTICE_REQUIRED }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i < sessionCount ? "var(--primary)" : "var(--surface-2)",
                  transform: i === sessionCount ? "scale(1.4)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col p-4 gap-4 flex-1">
        {/* Verb card */}
        <motion.div
          key={current.infinitief + formTarget}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl overflow-hidden text-center relative bg-[var(--primary)]"
        >
          <div className="p-8 relative">
            {/* Decorative circles */}
            <div className="absolute top-2 right-2 w-20 h-20 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
            <div className="absolute bottom-1 left-3 w-12 h-12 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />

            <motion.p
              key={current.infinitief}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl font-bold relative z-10"
              style={{ color: '#fff' }}
            >
              {current.infinitief}
            </motion.p>
            {isAdvanced && !hintRevealed ? (
              <button
                onClick={() => setHintRevealed(true)}
                className="text-xs font-bold border-none bg-transparent p-0 cursor-pointer block mx-auto mt-3 transition-colors relative z-10"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                [toon vertaling]
              </button>
            ) : (
              <p className="text-sm mt-3 relative z-10" style={{ color: 'rgba(255,255,255,0.5)' }}>{current.tr}</p>
            )}
          </div>
        </motion.div>

        {/* Form to fill */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center" style={{ color: '#fff' }}>
              <IconPen size={10} />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">
              SCHRIJF DE {FORM_LABELS[formTarget].toUpperCase()}:
            </p>
          </div>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            disabled={!!feedback}
            placeholder={`${current.infinitief} → ?`}
            className="w-full bg-transparent outline-none font-bold text-xl border-b border-[var(--border)] pb-2 placeholder:opacity-20 focus:border-[var(--primary)] transition-colors"
          />
        </motion.div>

        {/* Conjugation reference (show all when feedback) */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl overflow-hidden border border-[var(--border)]"
            >
              <div className="grid grid-cols-3 gap-[1px] bg-[var(--primary)]">
                {(["imperfectum_s", "imperfectum_p", "perfectum"] as FormTarget[]).map((f) => (
                  <div
                    key={f}
                    className={`p-3 text-center transition-colors ${
                      formTarget === f
                        ? feedback === "correct"
                          ? "bg-[var(--primary)]"
                          : "bg-[var(--danger)]"
                        : "bg-[var(--surface)]"
                    }`}
                  >
                    <p
                      className="text-[9px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: formTarget === f ? 'rgba(255,255,255,0.7)' : undefined, opacity: formTarget === f ? 1 : 0.4 }}
                    >
                      {f === "imperfectum_s" ? "IMPERF. ENK." : f === "imperfectum_p" ? "IMPERF. MV." : "PERFECTUM"}
                    </p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: formTarget === f ? '#fff' : undefined }}
                    >
                      {current[f]}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5 }}
              className={`rounded-xl px-4 py-3 font-bold text-sm flex items-center gap-3 ${
                feedback === "correct"
                  ? "bg-[var(--primary)]"
                  : "bg-[var(--danger)]"
              }`}
              style={{ color: '#fff' }}
            >
              <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                {feedback === "correct" ? <IconCheck size={14} /> : <IconX size={14} />}
              </span>
              <span>
                {feedback === "correct"
                  ? "Goed!"
                  : `Fout — ${FORM_LABELS[formTarget]}: ${current[formTarget]}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controleer button */}
      <div className="p-4 pt-0">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={check}
          disabled={!input.trim() || !!feedback}
          className="w-full py-4 font-bold uppercase tracking-widest text-sm cursor-pointer border-none rounded-xl bg-[var(--primary)] disabled:opacity-30 transition-opacity"
          style={{ color: '#fff' }}
        >
          Controleer
        </motion.button>
      </div>

      {/* Onjuiste pogingen — geçmiş listesi (yanlışları sonradan kontrol etmek için) */}
      {wrongHistory.length > 0 && (
        <div className="mx-4 mb-4 border border-[var(--danger)] rounded-2xl bg-[var(--surface)] p-4 flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--danger)] mb-3 block">
            Onjuiste pogingen ({wrongHistory.length})
          </span>
          <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {wrongHistory.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 border-b border-[var(--border)] pb-2.5 last:border-b-0 last:pb-0"
              >
                <span className="w-4 h-4 rounded-full bg-[var(--danger)] flex items-center justify-center flex-shrink-0 mt-0.5" style={{ color: '#fff' }}>
                  <IconX size={9} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-bold text-[var(--text)]">
                    {item.infinitief}{" "}
                    <span className="text-[var(--text-muted)] font-normal">· {item.formLabel}</span>
                  </p>
                  <p className="text-[11px] md:text-xs mt-0.5">
                    <span className="text-[var(--danger)] line-through">{item.userAnswer || "—"}</span>
                    <span className="text-[var(--text-muted)]"> → </span>
                    <span className="text-[var(--success)] font-bold">{item.correctAnswer}</span>
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{item.tr}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score strip */}
      <div className="flex mx-4 mb-4 gap-2">
        <motion.div
          animate={feedback === "correct" ? { scale: [1, 1.05, 1] } : {}}
          className="flex-1 py-3 flex flex-col items-center rounded-xl bg-[var(--primary)]"
        >
          <span className="text-xl font-bold tabular-nums" style={{ color: '#fff' }}>{scores.goed}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>GOED</span>
        </motion.div>
        <motion.div
          animate={feedback === "wrong" ? { scale: [1, 1.05, 1] } : {}}
          className="flex-1 py-3 flex flex-col items-center rounded-xl bg-[var(--danger)]"
        >
          <span className="text-xl font-bold tabular-nums" style={{ color: '#fff' }}>{scores.fout}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>FOUT</span>
        </motion.div>
      </div>
    </div>
  );
}
