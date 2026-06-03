"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadSentences, loadSentencesFromSources, shuffle, pickRandom } from "@/lib/gameData";
import { useProgress } from "@/lib/hooks";
import { levenshtein } from "@/lib/hooks";
import type { Sentence } from "@/lib/types";

type Mode = "vul-in" | "vertaal";

function buildGap(s: string) {
  const words = s.split(" ");
  const candidates = words.map((w, i) => ({ w: w.replace(/[.,!?]/g, ""), i })).filter(({ w }) => w.length > 3);
  const pick = candidates.length ? candidates[Math.floor(candidates.length / 2)] : { w: words[0], i: 0 };
  return { before: words.slice(0, pick.i).join(" "), target: pick.w, after: words.slice(pick.i + 1).join(" ") };
}

const AVAILABLE_SOURCES = [
  { id: "tc1", label: "Taalcompleet A1", level: "A1", desc: "Basiszinnen voor beginners", color: "var(--ds-blue)", textColor: "var(--ds-white)" },
  { id: "tc2", label: "Taalcompleet A2", level: "A2", desc: "Alledaagse communicatie & grammatica", color: "var(--ds-red)", textColor: "var(--ds-white)" },
  { id: "az", label: "Taalcompleet B1/B2 (AZ)", level: "B1-B2", desc: "Geavanceerde uitdrukkingen & idiomen", color: "var(--ds-yellow)", textColor: "var(--ds-black)" },
  { id: "delftse", label: "Delftse Methode", level: "B1", desc: "Conversatie & teksten voor gevorderden", color: "var(--ds-white)", textColor: "var(--ds-black)" },
  { id: "lessen", label: "Spraakmaker Lessen", level: "A1-B1", desc: "Zinnen uit de cursushofdstukken", color: "var(--ds-gray)", textColor: "var(--ds-black)" },
];

export default function SnelrondePage() {
  const { updateProgress } = useProgress();

  const [selectedSources, setSelectedSources] = useState<string[]>(["tc1", "tc2"]);
  const [gameStarted, setGameStarted] = useState(false);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [current, setCurrent] = useState<Sentence | null>(null);
  const [mode, setMode] = useState<Mode>("vul-in");
  const [gap, setGap] = useState({ before: "", target: "", after: "" });
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [scores, setScores] = useState({ goed: 0, fout: 0, combo: 0, points: 0 });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isAdvanced, setIsAdvanced] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  useEffect(() => {
    const level = localStorage.getItem("spraakmaker-niveau");
    if (level === "B1" || level === "B2") {
      setIsAdvanced(true);
    }
  }, []);

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

  function fetchAndInitGame() {
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

  function nextQuestion(pool: Sentence[]) {
    const zin = pickRandom(pool);
    const m: Mode = Math.random() < 0.5 ? "vul-in" : "vertaal";
    setCurrent(zin);
    setMode(m);
    if (m === "vul-in") setGap(buildGap(zin.nl));
    setInput("");
    setFeedback(null);
    setHintRevealed(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function startGame() {
    setTimeLeft(60);
    setDone(false);
    setScores({ goed: 0, fout: 0, combo: 0, points: 0 });
    setRunning(true);
    nextQuestion(sentences);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function checkAnswer() {
    if (!current || feedback || !running) return;
    const normalize = (s: string) => s.toLowerCase().replace(/[.,!?;:]/g, "").trim();

    let correct = false;
    if (mode === "vul-in") {
      correct = levenshtein(normalize(input), normalize(gap.target)) <= 1;
    } else {
      const aw = normalize(input).split(" ");
      const tw = normalize(current.nl).split(" ");
      const matches = aw.filter((w) => tw.some((t) => levenshtein(w, t) <= 1)).length;
      correct = matches / tw.length >= 0.7;
    }

    setFeedback(correct ? "correct" : "wrong");

    setScores((s) => {
      const newCombo = correct ? s.combo + 1 : 0;
      const multiplier = newCombo >= 6 ? 3 : newCombo >= 3 ? 2 : 1;
      const pts = correct ? 10 * multiplier : 0;
      return {
        goed: s.goed + (correct ? 1 : 0),
        fout: s.fout + (correct ? 0 : 1),
        combo: newCombo,
        points: s.points + pts,
      };
    });

    setTimeout(() => nextQuestion(sentences), correct ? 400 : 800);
  }

  // Save highscore when done
  useEffect(() => {
    if (done && scores.points > 0) {
      updateProgress((p) => ({
        ...p,
        games: {
          ...p.games,
          totalPoints: p.games.totalPoints + scores.points,
          highScores: {
            ...p.games.highScores,
            snelronde: Math.max(p.games.highScores.snelronde, scores.points),
          },
          lastPlayDate: new Date().toISOString(),
        },
      }));
    }
  }, [done]);

  const comboMultiplier = scores.combo >= 6 ? "x3" : scores.combo >= 3 ? "x2" : "x1";

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
          <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">snelronde</span>
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
            onClick={fetchAndInitGame}
            disabled={selectedSources.length === 0}
            className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-40 transition-opacity border-none cursor-pointer"
          >
            START SPEL
          </button>
        </div>
      </div>
    );
  }

  // Start screen
  if (!running && !done) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--ds-white)]">
        {/* Header — bg-ds-black */}
        <div className="bg-[var(--ds-black)] px-5 py-4">
          <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">snelronde</span>
        </div>
        {/* Zamanlayıcı — KIRMIZI blok, çok büyük */}
        <div className="bg-[var(--ds-red)] border-b-[3px] border-[var(--ds-black)] py-12 flex flex-col items-center justify-center">
          <span className="text-7xl font-bold text-[var(--ds-white)] font-mono">60</span>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-60 mt-2">SECONDEN</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
          <p className="text-center text-[var(--ds-black)] opacity-60 text-sm">
            Beantwoord zoveel mogelijk vragen in 60 seconden. 3 goede antwoorden = x2, 6 = x3!
          </p>
          <button
            onClick={startGame}
            className="w-full max-w-xs bg-[var(--ds-black)] text-[var(--ds-white)] py-5 font-bold uppercase tracking-widest border-none cursor-pointer hover:opacity-80 transition-opacity"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  // End screen — Sonuç ekranı
  if (done) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--ds-white)]">
        <div className="bg-[var(--ds-black)] px-5 py-4">
          <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">snelronde</span>
        </div>
        <div className="p-[3px] bg-[var(--ds-black)] flex-1">
          <div className="grid grid-cols-2 gap-[3px]">
            {/* Büyük SARI blok: Toplam puan */}
            <div className="bg-[var(--ds-yellow)] p-6 col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">TOTAAL PUNTEN</p>
              <p className="text-6xl font-bold mt-1">{scores.points}</p>
            </div>
            {/* YEŞİL blok: Doğru sayısı */}
            <div className="bg-[var(--ds-green)] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">GOED</p>
              <p className="text-4xl font-bold text-[var(--ds-white)] mt-1">{scores.goed}</p>
            </div>
            {/* KIRMIZI blok: Yanlış sayısı */}
            <div className="bg-[var(--ds-red)] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">FOUT</p>
              <p className="text-4xl font-bold text-[var(--ds-white)] mt-1">{scores.fout}</p>
            </div>
            {/* BEYAZ blok: Opnieuw spelen */}
            <div className="bg-[var(--ds-white)] p-5 col-span-2">
              <button
                onClick={startGame}
                className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest border-none cursor-pointer hover:opacity-80 transition-opacity"
              >
                Opnieuw spelen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header — bg-ds-black */}
      <div className="bg-[var(--ds-black)] px-5 py-4">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">snelronde</span>
      </div>

      {/* Zamanlayıcı — KIRMIZI blok */}
      <div className={`${timeLeft <= 10 ? "bg-[var(--ds-red)]" : "bg-[var(--ds-red)]"} px-6 py-4 flex items-center justify-center border-b-[3px] border-[var(--ds-black)]`}>
        <span className="text-5xl font-bold text-[var(--ds-white)] font-mono tabular-nums">
          0:{String(timeLeft).padStart(2, "0")}
        </span>
      </div>
      {/* Progress bar */}
      <div className="w-full h-2 bg-[var(--ds-white)]">
        <div
          className="h-full bg-[var(--ds-red)] transition-all duration-1000"
          style={{ width: `${(timeLeft / 60) * 100}%` }}
        />
      </div>

      {/* Timer + combo + pts strip */}
      <div className="flex border-b-[3px] border-[var(--ds-black)]">
        <div className="flex-1 bg-[var(--ds-yellow)] px-4 py-2 flex flex-col items-center">
          <span className="text-lg font-bold text-[var(--ds-black)]">{comboMultiplier}</span>
          <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">COMBO</span>
        </div>
        <div className="flex-1 bg-[var(--ds-blue)] border-l-[3px] border-[var(--ds-black)] px-4 py-2 flex flex-col items-center">
          <span className="text-lg font-bold text-[var(--ds-white)]">{scores.points}</span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">PTS</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-3">
        {/* Mode badge */}
        <span className={`self-start px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-[3px] border-[var(--ds-black)] ${
          mode === "vul-in" ? "bg-[var(--ds-blue)] text-[var(--ds-white)]" : "bg-[var(--ds-yellow)] text-[var(--ds-black)]"
        }`}>
          {mode === "vul-in" ? "Vul in" : "Vertaal"}
        </span>

        {/* Question */}
        <div className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] p-4">
          {mode === "vertaal" ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">VERTAAL</p>
              <p className="text-lg font-bold">{current?.tr}</p>
            </>
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">VUL IN</p>
              {isAdvanced && !hintRevealed ? (
                <button
                  onClick={() => setHintRevealed(true)}
                  className="text-xs font-bold text-[var(--ds-blue)] hover:underline border-none bg-none p-0 cursor-pointer block text-left mb-2"
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  [toon vertaling]
                </button>
              ) : (
                <p className="text-sm opacity-50 mb-2">{current?.tr}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-medium">
                {gap.before && <span>{gap.before}</span>}
                <span className="border-b-[3px] border-[var(--ds-black)] px-1 min-w-[64px] text-center opacity-40">___</span>
                {gap.after && <span>{gap.after}</span>}
              </div>
            </>
          )}
        </div>

        {/* Feedback flash */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`border-[3px] border-[var(--ds-black)] px-4 py-2 text-sm font-bold ${
                feedback === "correct"
                  ? "bg-[var(--ds-green)] text-[var(--ds-white)]"
                  : "bg-[var(--ds-red)] text-[var(--ds-white)]"
              }`}
            >
              {feedback === "correct" ? "Goed!" : mode === "vul-in" ? `→ ${gap.target}` : `→ ${current?.nl}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input + submit */}
      <div className="border-t-[3px] border-[var(--ds-black)]">
        <div className="flex">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
            disabled={!!feedback}
            placeholder="Antwoord…"
            className="flex-1 px-4 py-4 bg-[var(--ds-white)] border-none outline-none font-medium text-[var(--ds-black)] placeholder:opacity-30 border-r-[3px] border-[var(--ds-black)]"
          />
          <button
            onClick={checkAnswer}
            disabled={!input.trim() || !!feedback}
            className="px-6 bg-[var(--ds-black)] text-[var(--ds-white)] font-bold text-sm uppercase tracking-widest border-none cursor-pointer disabled:opacity-40 hover:opacity-80 transition-opacity"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
