"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress, useMoedertaal, useSpacedRepetition } from "@/lib/hooks";
import { IconCheck, IconX, IconMinus, IconArrowLeft, IconArrowRight } from "@/components/Icons";
import type { Word } from "@/lib/types";

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

export default function KaartenPage() {
  const { progress, updateProgress } = useProgress();
  const { moedertaal } = useMoedertaal();
  const { sm2 } = useSpacedRepetition();

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
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    loadDeck(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

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
    <div className="flex flex-col h-screen max-h-screen bg-[var(--ds-white)] overflow-hidden pb-24 md:pb-6">
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between shrink-0">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">woordkaarten</span>
        <span className="text-sm font-bold text-[var(--ds-white)] opacity-60">
          {deck.length > 0 ? index + 1 : 0}/{deck.length}
        </span>
      </div>

      <div className="bg-[var(--ds-white)] px-4 py-3 flex gap-2 border-b-[3px] border-[var(--ds-black)] overflow-x-auto shrink-0 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              "flex-shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors",
              filter === f
                ? "bg-[var(--ds-black)] text-[var(--ds-white)] border-[2px] border-[var(--ds-black)]"
                : "bg-transparent text-[var(--ds-black)] border-[2px] border-[var(--ds-black)]",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      {hasFallback && (
        <div className="mx-[3px] mt-[3px] bg-[var(--ds-yellow)] border-[3px] border-[var(--ds-black)] px-4 py-2 shrink-0">
          <p className="text-xs font-bold text-[var(--ds-black)]">Vertaling in jouw taal komt binnenkort</p>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 overflow-hidden">
        <div className="flex justify-between items-center w-full max-w-sm px-2 shrink-0">
          <div className="flex flex-col items-center">
            <div className="bg-[var(--ds-red)] text-white text-[10px] font-bold px-3 py-1 rounded-t-md uppercase tracking-wider">
              FAUT
            </div>
            <div className="bg-[var(--ds-gray)] text-[var(--ds-black)] font-bold text-sm px-4 py-1.5 border border-[var(--ds-black)] rounded-b-md shadow-sm min-w-[50px] text-center">
              {scores.fout}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-[var(--ds-green)] text-white text-[10px] font-bold px-3 py-1 rounded-t-md uppercase tracking-wider">
              GOED
            </div>
            <div className="bg-[var(--ds-gray)] text-[var(--ds-black)] font-bold text-sm px-4 py-1.5 border border-[var(--ds-black)] rounded-b-md shadow-sm min-w-[50px] text-center">
              {scores.goed}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center w-full max-w-md gap-3 shrink-0">
          <button
            onClick={prevCard}
            disabled={loading || deck.length === 0}
            className="p-3 bg-[var(--ds-gray)] border border-[var(--ds-black)] hover:bg-[var(--ds-yellow)] text-[var(--ds-black)] cursor-pointer disabled:opacity-40 disabled:hover:bg-[var(--ds-gray)] transition-all flex items-center justify-center shadow-sm shrink-0"
            aria-label="Vorige kaart"
          >
            <IconArrowLeft size={18} />
          </button>

          <div className="flex-1 max-w-[280px] xs:max-w-[310px] sm:max-w-xs" style={{ perspective: "1000px" }}>
            {loading ? (
              <div className="w-full min-h-[220px] bg-[var(--ds-gray)] border-[3px] border-[var(--ds-black)] flex items-center justify-center">
                <div className="text-sm opacity-40 font-bold uppercase tracking-widest">Laden…</div>
              </div>
            ) : !card ? (
              <div className="w-full min-h-[220px] bg-[var(--ds-gray)] border-[3px] border-[var(--ds-black)] flex items-center justify-center">
                <div className="text-sm opacity-40 font-bold uppercase tracking-widest">Geen kaarten</div>
              </div>
            ) : (
              <motion.div
                key={`${index}-${filter}`}
                initial={{ x: direction * 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -direction * 50, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleCardClick}
                className="cursor-pointer relative w-full h-[220px]"
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="w-full h-full bg-[var(--ds-blue)] border-[3px] border-[var(--ds-black)] flex flex-col items-center justify-center p-6 select-none"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                  }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-[2px] text-[var(--ds-white)] opacity-50 mb-3">
                    NEDERLANDS
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-[var(--ds-white)] text-center leading-tight break-words max-w-full">
                    {card.nl}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-35 mt-5">
                    tik om te draaien
                  </p>
                </motion.div>

                <motion.div
                  animate={{ rotateY: flipped ? 0 : -180 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="w-full h-full bg-[var(--ds-gray)] border-[3px] border-[var(--ds-black)] flex flex-col items-center justify-center p-6 select-none"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                  }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-[2px] text-[var(--ds-black)] opacity-50 mb-3">
                    MOEDERTAAL
                  </p>
                  
                  {isAdvanced && !translationRevealed ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTranslationRevealed(true);
                      }}
                      className="px-4 py-2 bg-[var(--ds-blue)] text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-[var(--ds-black)] cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      [toon vertaling]
                    </button>
                  ) : (
                    <p className="text-lg md:text-xl font-bold text-[var(--ds-black)] text-center leading-tight break-words max-w-full">
                      {card.tr}
                    </p>
                  )}

                  {card.en && (
                    <p className="text-xs text-[var(--ds-black)] opacity-40 mt-3 text-center">
                      {card.en}
                    </p>
                  )}
                </motion.div>
              </motion.div>
            )}
          </div>

          <button
            onClick={nextCard}
            disabled={loading || deck.length === 0}
            className="p-3 bg-[var(--ds-gray)] border border-[var(--ds-black)] hover:bg-[var(--ds-yellow)] text-[var(--ds-black)] cursor-pointer disabled:opacity-40 disabled:hover:bg-[var(--ds-gray)] transition-all flex items-center justify-center shadow-sm shrink-0"
            aria-label="Volgende kaart"
          >
            <IconArrowRight size={18} />
          </button>
        </div>

        <div className="flex gap-2 w-full max-w-xs mt-2 px-1 shrink-0">
          <button
            onClick={() => answer(1, "fout")}
            disabled={!card}
            className="flex-1 py-3 px-2 bg-[var(--ds-red)] text-white font-bold rounded-lg border border-[var(--ds-black)] cursor-pointer disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
          >
            <IconX size={15} />
            <span className="text-[10px] md:text-xs uppercase tracking-wider">Faut</span>
          </button>

          <button
            onClick={() => answer(3, "bijna")}
            disabled={!card}
            className="flex-1 py-3 px-2 bg-[var(--ds-yellow)] text-[var(--ds-black)] font-bold rounded-lg border border-[var(--ds-black)] cursor-pointer disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
          >
            <IconMinus size={15} />
            <span className="text-[10px] md:text-xs uppercase tracking-wider">Bijna</span>
          </button>

          <button
            onClick={() => answer(5, "goed")}
            disabled={!card}
            className="flex-1 py-3 px-2 bg-[var(--ds-green)] text-white font-bold rounded-lg border border-[var(--ds-black)] cursor-pointer disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
          >
            <IconCheck size={15} />
            <span className="text-[10px] md:text-xs uppercase tracking-wider">Goed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
