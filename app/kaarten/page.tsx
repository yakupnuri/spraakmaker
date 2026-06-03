"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress, useMoedertaal, useSpacedRepetition } from "@/lib/hooks";
import { IconCheck, IconX, IconMinus } from "@/components/Icons";
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

  const hasFallback = moedertaal !== "tr";

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
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    loadDeck(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const card = deck[index] ?? null;

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
      setIndex((i) => (i + 1) % deck.length);
      setDirection(0);
    }, 150);
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header — bg-ds-black */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">woordkaarten</span>
        <span className="text-sm font-bold text-[var(--ds-white)] opacity-60">
          {index + 1}/{deck.length}
        </span>
      </div>

      {/* Filter bar — BEYAZ blok */}
      <div className="bg-[var(--ds-white)] px-4 py-3 flex gap-2 border-b-[3px] border-[var(--ds-black)] overflow-x-auto">
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

      {/* Fallback notice */}
      {hasFallback && (
        <div className="mx-[3px] mt-[3px] bg-[var(--ds-yellow)] border-[3px] border-[var(--ds-black)] px-4 py-2">
          <p className="text-xs font-bold">Vertaling in jouw taal komt binnenkort</p>
        </div>
      )}

      {/* Card area — MAVİ blok */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        {loading ? (
          <div className="text-sm opacity-40 font-bold uppercase tracking-widest">Laden…</div>
        ) : !card ? (
          <div className="text-sm opacity-40 font-bold uppercase tracking-widest">Geen kaarten</div>
        ) : (
          <div className="w-full max-w-sm" style={{ perspective: "1000px" }}>
            <motion.div
              key={`${index}-${filter}`}
              initial={{ x: direction * 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -direction * 60, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setFlipped((f) => !f)}
              className="cursor-pointer"
              style={{ transformStyle: "preserve-3d", minHeight: "240px" }}
            >
              {/* Front — MAVİ */}
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full min-h-[240px] bg-[var(--ds-blue)] border-[3px] border-[var(--ds-black)] flex flex-col items-center justify-center p-8 select-none"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  position: flipped ? "absolute" : "relative",
                  top: 0, left: 0, right: 0,
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--ds-white)] opacity-50 mb-4">
                  NEDERLANDS
                </p>
                <p className="text-3xl font-bold text-[var(--ds-white)] text-center leading-tight">
                  {card.nl}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-30 mt-6">
                  tik om te draaien
                </p>
              </motion.div>

              {/* Back — BEYAZ */}
              <motion.div
                animate={{ rotateY: flipped ? 0 : -180 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full min-h-[240px] bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] flex flex-col items-center justify-center p-8 select-none"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  position: flipped ? "relative" : "absolute",
                  top: 0, left: 0, right: 0,
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--ds-black)] opacity-50 mb-4">
                  MOEDERTAAL
                </p>
                <p className="text-2xl font-bold text-[var(--ds-black)] text-center leading-tight">
                  {card.tr}
                </p>
                {card.en && (
                  <p className="text-sm text-[var(--ds-black)] opacity-40 mt-3 text-center">
                    {card.en}
                  </p>
                )}
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Answer buttons — 3 eşit blok, 3px border ile ayrılmış, TAM GENİŞLİK */}
      <div className="border-t-[3px] border-[var(--ds-black)]">
        <div className="flex">
          {/* KIRMIZI — X ikonu — fout */}
          <button
            onClick={() => answer(1, "fout")}
            disabled={!card}
            className="flex-1 py-5 bg-[var(--ds-red)] flex flex-col items-center gap-1 cursor-pointer border-none border-r-[3px] border-[var(--ds-black)] disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="3" y1="3" x2="17" y2="17" />
              <line x1="17" y1="3" x2="3" y2="17" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-white)]">fout</span>
          </button>
          {/* SARI — çizgi ikonu — bijna */}
          <button
            onClick={() => answer(3, "bijna")}
            disabled={!card}
            className="flex-1 py-5 bg-[var(--ds-yellow)] flex flex-col items-center gap-1 cursor-pointer border-none border-r-[3px] border-[var(--ds-black)] disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#1A1A1A" strokeWidth="2.5">
              <line x1="3" y1="10" x2="17" y2="10" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-black)]">bijna</span>
          </button>
          {/* MAVİ — check ikonu — goed */}
          <button
            onClick={() => answer(5, "goed")}
            disabled={!card}
            className="flex-1 py-5 bg-[var(--ds-blue)] flex flex-col items-center gap-1 cursor-pointer border-none disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="3,10 8,16 17,4" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-white)]">goed</span>
          </button>
        </div>

        {/* Skor satırı — BEYAZ blok, 3 mini gösterge */}
        <div className="flex items-center justify-center gap-6 py-3 bg-[var(--ds-white)] border-t-[3px] border-[var(--ds-black)]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[var(--ds-red)]" />
            <span className="text-sm font-bold text-[var(--ds-black)]">{scores.fout}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[var(--ds-yellow)]" />
            <span className="text-sm font-bold text-[var(--ds-black)]">{scores.bijna}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[var(--ds-blue)]" />
            <span className="text-sm font-bold text-[var(--ds-black)]">{scores.goed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
