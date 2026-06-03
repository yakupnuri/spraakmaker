"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadSentences, loadSentencesFromSources, shuffle, pickRandom } from "@/lib/gameData";
import { useProgress } from "@/lib/hooks";
import { levenshtein } from "@/lib/hooks";
import type { Sentence } from "@/lib/types";

const AVAILABLE_SOURCES = [
  { id: "tc1", label: "Taalcompleet A1", level: "A1", desc: "Basiszinnen voor beginners", color: "var(--ds-blue)", textColor: "var(--ds-white)" },
  { id: "tc2", label: "Taalcompleet A2", level: "A2", desc: "Alledaagse communicatie & grammatica", color: "var(--ds-red)", textColor: "var(--ds-white)" },
  { id: "az", label: "Taalcompleet B1/B2 (AZ)", level: "B1-B2", desc: "Geavanceerde uitdrukkingen & idiomen", color: "var(--ds-yellow)", textColor: "var(--ds-black)" },
  { id: "delftse", label: "Delftse Methode", level: "B1", desc: "Conversatie & teksten voor gevorderden", color: "var(--ds-white)", textColor: "var(--ds-black)" },
  { id: "lessen", label: "Spraakmaker Lessen", level: "A1-B1", desc: "Zinnen uit de cursushofdstukken", color: "var(--ds-gray)", textColor: "var(--ds-black)" },
];

export default function VertaalPage() {
  const { updateProgress } = useProgress();

  const [selectedSources, setSelectedSources] = useState<string[]>(["tc1", "tc2"]);
  const [gameStarted, setGameStarted] = useState(false);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [current, setCurrent] = useState<Sentence | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [scores, setScores] = useState({ goed: 0, fout: 0, score: 0 });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const toggleSource = (id: string) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedSources.length === AVAILABLE_SOURCES.length) {
      setSelectedSources([]);
    } else {
      setSelectedSources(AVAILABLE_SOURCES.map((s) => s.id));
    }
  };

  function startGame() {
    if (selectedSources.length === 0) return;
    setLoading(true);
    loadSentencesFromSources(selectedSources).then((data) => {
      if (data.length === 0) {
        setLoading(false);
        alert("Geen zinnen gevonden voor de geselecteerde bronnen.");
        return;
      }
      setSentences(shuffle(data));
      setGameStarted(true);
      setLoading(false);
    });
  }

  function loadNext(pool: Sentence[]) {
    setCurrent(pickRandom(pool));
    setInput("");
    setFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  useEffect(() => {
    if (sentences.length && gameStarted) loadNext(sentences);
  }, [sentences, gameStarted]);

  function checkAnswer() {
    if (!current || feedback) return;
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[.,!?;:]/g, "").replace(/\s+/g, " ").trim();

    const answerWords = normalize(input).split(" ");
    const targetWords = normalize(current.nl).split(" ");

    let matches = 0;
    for (const aw of answerWords) {
      if (targetWords.some((tw) => levenshtein(aw, tw) <= 1)) matches++;
    }
    const correct = matches / targetWords.length >= 0.7;
    const points = correct ? 20 : 0;

    setFeedback(correct ? "correct" : "wrong");
    setScores((s) => ({
      goed: s.goed + (correct ? 1 : 0),
      fout: s.fout + (correct ? 0 : 1),
      score: s.score + points,
    }));

    if (correct) {
      updateProgress((p) => ({
        ...p,
        games: {
          ...p.games,
          totalPoints: p.games.totalPoints + 20,
          highScores: {
            ...p.games.highScores,
            vertaal: Math.max(p.games.highScores.vertaal, p.games.totalPoints + 20),
          },
          lastPlayDate: new Date().toISOString(),
        },
      }));
    }

    setTimeout(() => loadNext(sentences), correct ? 1000 : 1600);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ds-white)]">
        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Laden…</p>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--ds-white)] select-none">
        {/* Header — bg-ds-black */}
        <div className="bg-[var(--ds-black)] px-5 py-4">
          <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">vertaal</span>
        </div>

        {/* Banner / Title */}
        <div className="bg-[var(--ds-yellow)] border-b-[3px] border-[var(--ds-black)] p-6 text-[var(--ds-black)]">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">
            BRONSELECTIE
          </span>
          <h1 className="text-xl font-black">Kies je bronnen</h1>
          <p className="text-xs opacity-70 mt-1">
            Selecteer de zinsbronnen waarmee je wilt oefenen.
          </p>
        </div>

        {/* Source List */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
          {AVAILABLE_SOURCES.map((src) => {
            const isSelected = selectedSources.includes(src.id);
            return (
              <div
                key={src.id}
                onClick={() => toggleSource(src.id)}
                className={`border-[3px] border-[var(--ds-black)] p-4 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? "bg-[var(--ds-gray)]" : "bg-[var(--ds-white)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Custom Checkbox */}
                  <div
                    className={`w-6 h-6 border-[3px] border-[var(--ds-black)] flex items-center justify-center text-sm font-black transition-colors ${
                      isSelected ? "bg-[var(--ds-black)] text-[var(--ds-white)]" : "bg-[var(--ds-white)]"
                    }`}
                  >
                    {isSelected && "✓"}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-[var(--ds-black)]">{src.label}</h3>
                    <p className="text-[10px] text-[var(--ds-black)] opacity-60 mt-0.5">{src.desc}</p>
                  </div>
                </div>
                {/* Level badge */}
                <span
                  className="px-2 py-0.5 text-[9px] font-black border-[2px] border-[var(--ds-black)]"
                  style={{ backgroundColor: src.color, color: src.textColor }}
                >
                  {src.level}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="border-t-[3px] border-[var(--ds-black)] p-4 bg-[var(--ds-white)] flex flex-col gap-2">
          <button
            onClick={toggleAll}
            className="w-full bg-[var(--ds-white)] text-[var(--ds-black)] border-[3px] border-[var(--ds-black)] py-3 font-bold uppercase tracking-widest text-xs hover:bg-[var(--ds-gray)] cursor-pointer"
          >
            {selectedSources.length === AVAILABLE_SOURCES.length ? "Deselecteer alles" : "Selecteer alles"}
          </button>
          <button
            onClick={startGame}
            disabled={selectedSources.length === 0}
            className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-40 transition-opacity border-none cursor-pointer"
          >
            START SPEL
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header — bg-ds-black */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">vertaal</span>
        <span className="text-sm font-bold text-[var(--ds-yellow)]">{scores.score} pts</span>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4">
        {/* Kaynak cümle — SARI blok (tam genişlik) */}
        <div className="bg-[var(--ds-yellow)] border-[3px] border-[var(--ds-black)] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">VERTAAL DEZE ZIN</p>
          <p className="text-xl font-bold text-[var(--ds-black)]">{current?.tr}</p>
        </div>

        {/* Yazma alanı — BEYAZ blok */}
        <div className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">SCHRIJF IN HET NEDERLANDS:</p>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!!feedback}
            rows={3}
            placeholder="Schrijf hier je antwoord…"
            className="w-full bg-transparent outline-none resize-none font-medium text-[var(--ds-black)] placeholder:opacity-30 border-[3px] border-[var(--ds-black)] px-3 py-2"
          />
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`border-[3px] border-[var(--ds-black)] px-4 py-3 text-sm ${
                feedback === "correct"
                  ? "bg-[var(--ds-green)] text-[var(--ds-white)]"
                  : "bg-[var(--ds-red)] text-[var(--ds-white)]"
              }`}
            >
              <p className="font-bold">{feedback === "correct" ? "Goed!" : "Niet helemaal…"}</p>
              {feedback === "wrong" && (
                <p className="opacity-80 mt-1">{current?.nl}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controleer */}
      <div className="border-t-[3px] border-[var(--ds-black)]">
        <button
          onClick={checkAnswer}
          disabled={!input.trim() || !!feedback}
          className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-5 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-40"
        >
          Controleer
        </button>
      </div>

      {/* 5-blok skor barı */}
      <div className="flex border-t-[3px] border-[var(--ds-black)]">
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-yellow)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-lg font-bold text-[var(--ds-black)]">{scores.score}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-70">SCORE</span>
        </div>
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-red)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-lg font-bold text-[var(--ds-white)]">{scores.goed + scores.fout}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">TOTAAL</span>
        </div>
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-blue)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-lg font-bold text-[var(--ds-white)]">{scores.goed}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">GOED</span>
        </div>
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-white)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-lg font-bold text-[var(--ds-red)]">{scores.fout}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-70">FOUT</span>
        </div>
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-green)]">
          <span className="text-lg font-bold text-[var(--ds-white)]">{Math.round((scores.goed / (scores.goed + scores.fout || 1)) * 100)}%</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">JUIST</span>
        </div>
      </div>
    </div>
  );
}
