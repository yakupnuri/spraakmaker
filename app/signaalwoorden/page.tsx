"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMoedertaal, useProgress } from "@/lib/hooks";
import type { SignaalwoordCategory } from "@/lib/types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface QuizItem {
  sentence: string;
  answer: string;
  options: string[];
  hint: string;
}

// allCategories is always the full list — used to source distractors
function buildQuizItems(
  questionCategories: SignaalwoordCategory[],
  allCategories: SignaalwoordCategory[]
): QuizItem[] {
  const items: QuizItem[] = [];

  const allWords = allCategories
    .flatMap((c) =>
      c.words.filter((_, j) => j % 2 === 0).map((w) => w.nl.split("/")[0].trim())
    )
    .filter(Boolean);

  for (const cat of questionCategories) {
    for (let i = 0; i < cat.words.length - 1; i += 2) {
      const word = cat.words[i];
      const example = cat.words[i + 1];
      if (!example || !word) continue;

      const nl = example.nl;
      const target = word.nl.split("/")[0].trim();

      const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const gapped = nl.replace(new RegExp(`(?<![\w])${escaped}(?![\w])`, "i"), "___");

      if (!gapped.includes("___")) continue;

      const distractorPool = [...new Set(allWords.filter((w) => w.toLowerCase() !== target.toLowerCase()))];
      const distractors = shuffle(distractorPool).slice(0, 3);

      if (distractors.length < 3) continue;

      items.push({
        sentence: gapped,
        answer: target,
        options: shuffle([target, ...distractors]),
        hint: example.tr,
      });
    }
  }

  return shuffle(items);
}

export default function SignaalwoordenPage() {
  const { moedertaal } = useMoedertaal();
  const { updateProgress } = useProgress();

  const [categories, setCategories] = useState<SignaalwoordCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALLE");
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [scores, setScores] = useState({ goed: 0, fout: 0 });
  const [loading, setLoading] = useState(true);

  const hasFallback = moedertaal !== "tr";

  useEffect(() => {
    fetch("/data/signaalwoorden.json")
      .then((r) => r.json())
      .then((data: SignaalwoordCategory[]) => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!categories.length) return;
    const pool =
      activeCategory === "ALLE"
        ? categories
        : categories.filter((c) => c.category === activeCategory);
    setQuizItems(buildQuizItems(pool, categories));
    setIndex(0);
    setSelected(null);
    setFeedback(null);
  }, [categories, activeCategory]);

  const current = quizItems[index] ?? null;

  function handleSelect(opt: string) {
    if (feedback) return;
    setSelected(opt);
    const correct = opt === current.answer;
    setFeedback(correct ? "correct" : "wrong");
    setScores((s) => ({
      goed: s.goed + (correct ? 1 : 0),
      fout: s.fout + (correct ? 0 : 1),
    }));
    if (correct) {
      updateProgress((p) => ({
        ...p,
        games: {
          ...p.games,
          totalPoints: p.games.totalPoints + 10,
          lastPlayDate: new Date().toISOString(),
        },
      }));
    }
    setTimeout(() => {
      setIndex((i) => (i + 1) % quizItems.length);
      setSelected(null);
      setFeedback(null);
    }, 1000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Laden…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header — bg-ds-black */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">signaalwoorden</span>
        <span className="text-sm font-bold text-[var(--ds-white)] opacity-60">
          {quizItems.length} vragen
        </span>
      </div>

      {/* Category selector */}
      <div className="flex border-b-[3px] border-[var(--ds-black)] overflow-x-auto">
        {["ALLE", ...categories.map((c) => c.category)].map((cat, i) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={[
              "flex-shrink-0 px-4 py-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer border-none transition-colors whitespace-nowrap",
              i > 0 ? "border-l-[3px] border-[var(--ds-black)]" : "",
              activeCategory === cat
                ? "bg-[var(--ds-yellow)] text-[var(--ds-black)]"
                : "bg-[var(--ds-white)] text-[var(--ds-black)] hover:bg-[var(--ds-gray)]",
            ].join(" ")}
          >
            {cat}
          </button>
        ))}
      </div>

      {hasFallback && (
        <div className="mx-[3px] mt-[3px] bg-[var(--ds-yellow)] border-[3px] border-[var(--ds-black)] px-4 py-2">
          <p className="text-xs font-bold">Vertaling in jouw taal komt binnenkort</p>
        </div>
      )}

      {!current ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm font-bold uppercase tracking-widest opacity-40">Geen vragen beschikbaar</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 gap-4">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[6px] bg-[var(--ds-gray)]">
              <div
                className="h-full bg-[var(--ds-yellow)] transition-all duration-300"
                style={{ width: `${((index + 1) / quizItems.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold opacity-40">{index + 1}/{quizItems.length}</span>
          </div>

          {/* Sentence with gap — BEYAZ blok */}
          <div className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3">KIES HET GOEDE WOORD</p>
            <p className="text-lg font-medium leading-relaxed">
              {current.sentence.split("___").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span
                      className={`inline-block px-2 py-0.5 font-bold min-w-[60px] text-center ${
                        feedback === "correct"
                          ? "bg-[var(--ds-blue)] text-[var(--ds-white)]"
                          : feedback === "wrong"
                          ? "bg-[var(--ds-red)] text-[var(--ds-white)]"
                          : "bg-[var(--ds-yellow)] text-[var(--ds-black)]"
                      }`}
                    >
                      {selected ?? "___"}
                    </span>
                  )}
                </span>
              ))}
            </p>
          </div>

          {/* Hint */}
          <div className="bg-[var(--ds-gray)] border-[3px] border-[var(--ds-black)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">VERTALING</p>
            <p className="text-sm font-medium">{current.hint}</p>
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`border-[3px] border-[var(--ds-black)] px-4 py-3 font-bold text-sm ${
                  feedback === "correct"
                    ? "bg-[var(--ds-blue)] text-[var(--ds-white)]"
                    : "bg-[var(--ds-red)] text-[var(--ds-white)]"
                }`}
              >
                {feedback === "correct" ? "Goed!" : `Fout — het antwoord is: ${current.answer}`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Options grid — 2x2, 3px gap */}
          <div className="grid grid-cols-2 gap-[3px] bg-[var(--ds-black)]">
            {current.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrect = opt === current.answer;
              let bg = "bg-[var(--ds-white)] hover:bg-[var(--ds-gray)]";
              if (isSelected && feedback === "correct") bg = "bg-[var(--ds-blue)]";
              if (isSelected && feedback === "wrong") bg = "bg-[var(--ds-red)]";
              if (!isSelected && feedback && isCorrect) bg = "bg-[var(--ds-blue)]";

              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={!!feedback}
                  className={`py-5 font-bold text-sm border-none cursor-pointer transition-colors disabled:cursor-default ${bg} ${
                    isSelected || (feedback && isCorrect) ? "text-[var(--ds-white)]" : "text-[var(--ds-black)]"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Score strip */}
      <div className="flex border-t-[3px] border-[var(--ds-black)]">
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-blue)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-xl font-bold text-[var(--ds-white)]">{scores.goed}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">GOED</span>
        </div>
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-red)]">
          <span className="text-xl font-bold text-[var(--ds-white)]">{scores.fout}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">FOUT</span>
        </div>
      </div>
    </div>
  );
}
