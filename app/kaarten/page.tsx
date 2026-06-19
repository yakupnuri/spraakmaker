"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress, useMoedertaal, useSpacedRepetition } from "@/lib/hooks";
import { IconCheck, IconX, IconMinus, IconArrowLeft, IconArrowRight } from "@/components/Icons";
import type { Word } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import LesContextChip from "@/components/game/LesContextChip";

type Filter = "ALLE" | "TC1-2" | "CODE+" | "INZICHT" | "WW";

const FILTERS: Filter[] = ["ALLE", "TC1-2", "CODE+", "INZICHT", "WW"];

const FILTER_FILES: Record<Filter, string[]> = {
  ALLE: [
    "/data/words-tc12.json",
    "/data/words-code12.json",
    "/data/words-code3.json",
    "/data/words-code4.json",
    "/data/words-inzicht.json",
    "/data/words-ww.json",
  ],
  "TC1-2": ["/data/words-tc12.json"],
  "CODE+": [
    "/data/words-code12.json",
    "/data/words-code3.json",
    "/data/words-code4.json",
  ],
  INZICHT: ["/data/words-inzicht.json"],
  WW: ["/data/words-ww.json"],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function KaartenGame() {
  const { progress, updateProgress, recordActivity } = useProgress();
  const { moedertaal } = useMoedertaal();
  const { sm2 } = useSpacedRepetition();
  const searchParams = useSearchParams();
  const les = searchParams.get("les");

  const [filter, setFilter] = useState<Filter>("ALLE");
  const [deck, setDeck] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [scores, setScores] = useState({ fout: 0, bijna: 0, goed: 0 });
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [translationRevealed, setTranslationRevealed] = useState(false);

  const hasFallback = moedertaal !== "tr";

  useEffect(() => {
    const niveau = localStorage.getItem("spraakmaker-niveau");
    if (niveau === "B1" || niveau === "B2") {
      setIsAdvanced(true);
    }
  }, []);

  async function loadDeck(f: Filter) {
    setLoading(true);
    try {
      if (les) {
        const res = await fetch("/data/lessen-verhalen.json");
        const data = await res.json();
        const story = data.find((l: any) => l.lesId === les);
        if (story) {
          const deckFromWoordenschat = Object.entries(story.woordenschat || {}).map(([nl, tr]) => ({
            nl,
            tr: String(tr),
            chapter: story.verhaalTitel
          }));

          const stored = localStorage.getItem("spraakmaker-les-woorden");
          const dict = stored ? JSON.parse(stored) : {};
          const markedWords: string[] = dict[les] || [];

          const markedWordObjects = markedWords
            .filter((word) => !story.woordenschat || !story.woordenschat[word])
            .map((word) => ({
              nl: word,
              tr: "—",
              chapter: story.verhaalTitel
            }));

          setDeck(shuffle([...deckFromWoordenschat, ...markedWordObjects]));
        } else {
          setDeck([]);
        }
        setIndex(0);
        setFlipped(false);
        setTranslationRevealed(false);
        setLoading(false);
        return;
      }

      const files = FILTER_FILES[f];
      const results = await Promise.all(files.map((url) => fetch(url).then((r) => r.json())));
      const all: Word[] = results.flat().filter((w: Word) => w.nl && w.tr);
      const now = new Date().toISOString();
      const due = all.filter((w) => {
        const p = progress.flashcard[w.nl];
        return !p || p.nextReview <= now;
      });
      const rest = all.filter((w) => {
        const p = progress.flashcard[w.nl];
        return p && p.nextReview > now;
      });
      setDeck(shuffle([...due, ...rest]));
      setIndex(0);
      setFlipped(false);
      setTranslationRevealed(false);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadDeck(filter);
  }, [filter, les]);

  const card = deck[index] ?? null;

  const nextCard = useCallback(() => {
    if (deck.length === 0) return;
    setDirection(1);
    setFlipped(false);
    setTranslationRevealed(false);
    setIndex((prev) => (prev + 1) % deck.length);
  }, [deck.length]);

  const prevCard = useCallback(() => {
    if (deck.length === 0) return;
    setDirection(-1);
    setFlipped(false);
    setTranslationRevealed(false);
    setIndex((prev) => (prev - 1 + deck.length) % deck.length);
  }, [deck.length]);

  function answer(quality: 0 | 1 | 2 | 3 | 4 | 5, type: "fout" | "bijna" | "goed") {
    if (!card) return;
    const prev = progress.flashcard[card.nl] ?? { ease: 2.5, interval: 1, nextReview: "", correct: 0, wrong: 0 };
    const result = sm2(prev.ease, prev.interval, quality);
    updateProgress((p) => ({
      ...p,
      flashcard: {
        ...p.flashcard,
        [card.nl]: {
          ...result,
          correct: prev.correct + (quality >= 3 ? 1 : 0),
          wrong: prev.wrong + (quality < 3 ? 1 : 0),
        },
      },
      games: {
        ...p.games,
        totalPoints: p.games.totalPoints + (quality >= 3 ? 10 : 0),
      },
    }));

    recordActivity();

    setScores((s) => ({ ...s, [type]: s[type] + 1 }));
    setDirection(quality >= 3 ? 1 : -1);
    setTimeout(() => {
      setFlipped(false);
      setTranslationRevealed(false);
      setIndex((i) => (i + 1) % deck.length);
      setDirection(0);
    }, 150);
  }

  const handleCardClick = () => {
    setFlipped((f) => {
      const nextFlipped = !f;
      if (!nextFlipped) {
        setTranslationRevealed(false);
      }
      return nextFlipped;
    });
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[var(--bg)] text-[var(--text)] overflow-hidden pb-24 md:pb-6">
      {/* Top Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3.5 shadow-sm flex items-center justify-between shrink-0 select-none">
        <h1 className="text-base font-black tracking-wider uppercase text-[var(--text)]">Woordkaarten</h1>
        <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full">
          {deck.length > 0 ? index + 1 : 0} / {deck.length}
        </span>
      </header>

      {/* Filter Tabs / LesContextChip */}
      {!les ? (
        <div className="bg-[var(--surface)] px-4 py-3 flex gap-2 border-b border-[var(--border)] overflow-x-auto shrink-0 scrollbar-none select-none">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full border transition-all cursor-pointer ${
                filter === f
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/20"
                  : "bg-[var(--surface-2)] text-[var(--text-muted)] border-transparent hover:bg-slate-200/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)] shrink-0 select-none">
          <LesContextChip />
        </div>
      )}

      {hasFallback && (
        <div className="mx-4 mt-3 bg-[var(--warning)]/10 border border-[var(--warning)]/20 px-4 py-2 rounded-xl shrink-0 select-none">
          <p className="text-xs font-semibold text-[var(--warning)]">Vertaling in jouw taal komt binnenkort</p>
        </div>
      )}

      {/* Main Flashcard Workspace */}
      <div className="flex-grow flex flex-col items-center justify-center p-4 gap-6 overflow-hidden">
        {/* Scores Panel */}
        <div className="flex justify-between items-center w-full max-w-sm px-2 shrink-0 select-none">
          <div className="flex items-center gap-2 bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/15 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm">
            <span>✗ FOOUT:</span>
            <span>{scores.fout}</span>
          </div>

          <div className="flex items-center gap-2 bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/15 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm">
            <span>✓ GOED:</span>
            <span>{scores.goed}</span>
          </div>
        </div>

        {/* Card Navigator */}
        <div className="flex items-center justify-center w-full max-w-md gap-4 shrink-0">
          <button
            onClick={prevCard}
            disabled={loading || deck.length === 0}
            className="p-3 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] rounded-xl cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center shadow-sm shrink-0"
            aria-label="Vorige kaart"
          >
            <IconArrowLeft size={16} />
          </button>

          <div className="flex-1 max-w-[280px] xs:max-w-[310px] sm:max-w-xs card-3d h-[220px]">
            {loading ? (
              <div className="w-full h-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex items-center justify-center shadow-sm">
                <div className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest animate-pulse">Laden…</div>
              </div>
            ) : !card ? (
              <div className="w-full h-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex items-center justify-center shadow-sm">
                <div className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">Geen kaarten</div>
              </div>
            ) : (
              <div className="relative w-full h-full select-none" onClick={handleCardClick}>
                <div className={`card-inner ${flipped ? "flipped" : ""}`}>
                  {/* Front Side — Dutch */}
                  <div className="card-front rounded-2xl bg-[var(--primary)] text-white border border-[var(--border)] flex flex-col items-center justify-center p-6 shadow-md">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">
                      NEDERLANDS
                    </p>
                    <p className="text-2xl font-bold text-center leading-normal max-w-full break-words">
                      {card.nl}
                    </p>
                    <p className="text-[10px] opacity-40 italic mt-4">
                      tik om te draaien (çevir)
                    </p>
                  </div>

                  {/* Back Side — Turkish */}
                  <div className="card-back rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/10 flex flex-col items-center justify-center p-6 shadow-md">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">
                      MOEDERTAAL
                    </p>
                    
                    {isAdvanced && !translationRevealed ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTranslationRevealed(true);
                        }}
                        className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer hover:opacity-90 transition-opacity border-none"
                      >
                        [toon vertaling]
                      </button>
                    ) : (
                      <p className="text-2xl font-bold text-center leading-normal max-w-full break-words text-[var(--text)]">
                        {card.tr}
                      </p>
                    )}

                    {card.en && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-2 text-center opacity-70">
                        {card.en}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={nextCard}
            disabled={loading || deck.length === 0}
            className="p-3 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] rounded-xl cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center shadow-sm shrink-0"
            aria-label="Volgende kaart"
          >
            <IconArrowRight size={16} />
          </button>
        </div>

        {/* Answer Ratings Buttons */}
        <div className="flex gap-2 w-full max-w-xs mt-2 px-1 shrink-0">
          <button
            onClick={() => answer(1, "fout")}
            disabled={!card}
            className="flex-1 py-3.5 px-2 bg-[var(--danger)] text-white font-bold rounded-xl border-none cursor-pointer disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <IconX size={14} />
            <span className="text-[10px] uppercase tracking-wider">Faut</span>
          </button>

          <button
            onClick={() => answer(3, "bijna")}
            disabled={!card}
            className="flex-1 py-3.5 px-2 bg-[var(--warning)] text-white font-bold rounded-xl border-none cursor-pointer disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <IconMinus size={14} />
            <span className="text-[10px] uppercase tracking-wider">Bijna</span>
          </button>

          <button
            onClick={() => answer(5, "goed")}
            disabled={!card}
            className="flex-1 py-3.5 px-2 bg-[var(--success)] text-white font-bold rounded-xl border-none cursor-pointer disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <IconCheck size={14} />
            <span className="text-[10px] uppercase tracking-wider">Goed</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KaartenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <p className="text-sm font-bold uppercase tracking-widest opacity-40 animate-pulse">Laden…</p>
        </div>
      }
    >
      <KaartenGame />
    </Suspense>
  );
}
