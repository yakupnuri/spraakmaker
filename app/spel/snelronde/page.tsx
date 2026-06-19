"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadSentencesFromSources, shuffle, pickRandom, loadVerhaalLessen, loadVerhaalZinnen } from "@/lib/gameData";
import { useProgress, levenshtein } from "@/lib/hooks";
import type { Sentence } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { getUnlockedLesIds } from "@/lib/verhaalUnlock";
import LesContextChip from "@/components/game/LesContextChip";

import GameShell from "@/components/game/GameShell";
import FeedbackToast from "@/components/game/FeedbackToast";
import SourcePicker from "@/components/game/SourcePicker";

type Mode = "vul-in" | "vertaal";

function buildGap(s: string) {
  const words = s.split(" ");
  const candidates = words.map((w, i) => ({ w: w.replace(/[.,!?]/g, ""), i })).filter(({ w }) => w.length > 3);
  const pick = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : { w: words[0], i: 0 };
  return { before: words.slice(0, pick.i).join(" "), target: pick.w, after: words.slice(pick.i + 1).join(" ") };
}

function SnelrondeGame() {
  const { progress, updateProgress, recordActivity } = useProgress();
  const searchParams = useSearchParams();
  const bron = searchParams.get("bron");
  const les = searchParams.get("les");

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

  const [showPoints, setShowPoints] = useState(false);
  const [pointsGained, setPointsGained] = useState(10);

  const [verhalenLessen, setVerhalenLessen] = useState<{ lesId: string; titel: string; unlocked: boolean }[]>([]);
  const [selectedLesIds, setSelectedLesIds] = useState<string[]>([]);

  useEffect(() => {
    const level = localStorage.getItem("spraakmaker-niveau");
    if (level === "B1" || level === "B2") {
      setIsAdvanced(true);
    }
  }, []);

  // Load verhalen lessons list
  useEffect(() => {
    loadVerhaalLessen().then((lessen) => {
      const unlockedIds = getUnlockedLesIds(progress?.lessons);
      const mapped = lessen.map((l) => ({
        lesId: l.lesId,
        titel: l.titel,
        unlocked: unlockedIds.includes(l.lesId),
      }));
      setVerhalenLessen(mapped);
    });
  }, [progress]);

  // Load URL direct verhaal parameter
  useEffect(() => {
    if (bron === "verhaal" && les) {
      setLoading(true);
      loadVerhaalZinnen([les]).then((data) => {
        if (data.length === 0) {
          setLoading(false);
          alert("Geen zinnen gevonden için dit hikaye.");
          return;
        }
        setSentences(shuffle(data));
        setGameStarted(true);
        setLoading(false);
      });
    } else if (gameStarted && !les) {
      setGameStarted(false);
      setSentences([]);
      setCurrent(null);
    }
  }, [bron, les]);

  const toggleSource = (id: string) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    const allIds = ["tc1", "tc2", "az", "delftse", "lessen"];
    if (selectedSources.length === allIds.length) {
      setSelectedSources([]);
    } else {
      setSelectedSources(allIds);
    }
  };

  function fetchAndInitGame() {
    if (selectedSources.length === 0 && selectedLesIds.length === 0) return;
    setLoading(true);

    const loadStandard = loadSentencesFromSources(selectedSources);
    const loadStories = selectedLesIds.length > 0 ? loadVerhaalZinnen(selectedLesIds) : Promise.resolve([]);

    Promise.all([loadStandard, loadStories]).then(([standardData, storyData]) => {
      const data = [...standardData, ...storyData];
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
      const u = normalize(input).split(" ");
      const t = normalize(current.nl).split(" ");
      const checkCorrect = () => {
        if (Math.abs(u.length - t.length) > 2) return false;
        let i = 0, j = 0, errors = 0;
        while (i < u.length && j < t.length) {
          if (levenshtein(u[i], t[j]) <= 1) {
            i++;
            j++;
          } else {
            errors++;
            if (u.length > t.length) {
              i++;
            } else if (t.length > u.length) {
              j++;
            } else {
              i++;
              j++;
            }
          }
          if (errors > Math.max(1, Math.floor(t.length * 0.2))) return false;
        }
        const leftover = Math.abs((u.length - i) - (t.length - j));
        if (errors + leftover > Math.max(1, Math.floor(t.length * 0.2))) return false;
        return true;
      };
      correct = checkCorrect();
    }

    setFeedback(correct ? "correct" : "wrong");

    const newCombo = correct ? scores.combo + 1 : 0;
    const multiplier = newCombo >= 6 ? 3 : newCombo >= 3 ? 2 : 1;
    const pts = correct ? 10 * multiplier : 0;

    setScores((s) => ({
      goed: s.goed + (correct ? 1 : 0),
      fout: s.fout + (correct ? 0 : 1),
      combo: newCombo,
      points: s.points + pts,
    }));

    updateProgress((prev) => {
      const currentStats = prev.games.stats?.snelronde || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
      const newHistory = [
        ...currentStats.history,
        {
          sentence: mode === "vul-in" ? `${gap.before} [${gap.target}] ${gap.after}` : (current?.nl || ""),
          translation: current?.tr || "",
          correct: correct,
          timestamp: new Date().toISOString(),
          userAnswer: input,
          explanation: mode === "vul-in" ? `Doğru kelime: ${gap.target}` : `Doğru cevap: ${current?.nl}`,
        }
      ].slice(-50);

      return {
        ...prev,
        games: {
          ...prev.games,
          stats: {
            ...prev.games.stats,
            snelronde: {
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

    if (correct) {
      setPointsGained(pts);
      setShowPoints(true);
      setTimeout(() => setShowPoints(false), 800);
    }

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
  }, [done, scores.points, updateProgress]);

  const comboMultiplier = scores.combo >= 6 ? "x3" : scores.combo >= 3 ? "x2" : "x1";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <p className="text-sm font-bold uppercase tracking-widest opacity-40 animate-pulse text-[var(--text)]">Laden…</p>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <SourcePicker
        title="Snelronde"
        selectedSources={selectedSources}
        onToggle={toggleSource}
        onToggleAll={toggleAll}
        onStart={fetchAndInitGame}
        verhalenLessen={verhalenLessen}
        selectedLesIds={selectedLesIds}
        onToggleLes={(lesId) => {
          setSelectedLesIds((prev) =>
            prev.includes(lesId) ? prev.filter((x) => x !== lesId) : [...prev, lesId]
          );
        }}
      />
    );
  }

  // Start screen (Intro)
  if (!running && !done) {
    const startActionBar = (
      <button
        onClick={startGame}
        className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
      >
        Start
      </button>
    );

    const radius = 60;
    const circumference = 2 * Math.PI * radius;

    return (
      <GameShell
        title="Snelronde"
        icon="⚡"
        onClose={() => setGameStarted(false)}
        actionBar={startActionBar}
      >
        <LesContextChip />
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6 text-center select-none my-auto">
          {/* SVG Circular Ring for 60s */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg width="160" height="160" className="transform -rotate-90">
              <circle cx="80" cy="80" r={radius} stroke="var(--surface-2)" strokeWidth="6" fill="none" />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="var(--accent)"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={0}
              />
            </svg>
            <span className="absolute text-5xl font-black text-[var(--text)] font-mono">60</span>
          </div>
          <div>
            <h2 className="text-xl font-extrabold mb-2 text-[var(--text)]">Snelronde'ye Hazır mısın?</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-sm">
              Beantwoord zoveel mogelijk vragen in 60 seconden. 3 goede antwoorden = x2, 6 = x3!
            </p>
          </div>
        </div>
      </GameShell>
    );
  }

  // End screen
  if (done) {
    const endActionBar = (
      <button
        onClick={startGame}
        className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
      >
        Opnieuw spelen
      </button>
    );

    return (
      <GameShell
        title="Resultaat"
        icon="🏆"
        onClose={() => setGameStarted(false)}
        actionBar={endActionBar}
      >
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full gap-6 select-none my-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1">
              TOTAAL PUNTEN
            </span>
            <h2 className="text-6xl font-black text-[var(--accent)] font-mono tracking-tight">
              {scores.points}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--success-soft)] border border-[var(--success)]/10 p-4 rounded-2xl text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--success)] block mb-1">
                GOED
              </span>
              <span className="text-2xl font-bold text-[var(--success)]">{scores.goed}</span>
            </div>

            <div className="bg-[var(--danger-soft)] border border-[var(--danger)]/10 p-4 rounded-2xl text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--danger)] block mb-1">
                FOUT
              </span>
              <span className="text-2xl font-bold text-[var(--danger)]">{scores.fout}</span>
            </div>
          </div>
        </div>
      </GameShell>
    );
  }

  // Game screen components
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 60) * circumference;
  const isDanger = timeLeft <= 10;
  const strokeColor = isDanger ? "var(--danger)" : "var(--accent)";

  const gameActionBar = (
    <div className="flex gap-2 w-full">
      {mode === "vertaal" ? (
        <>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
            disabled={!!feedback}
            placeholder="Antwoord…"
            className="flex-1 px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none font-medium text-[var(--text)] placeholder:opacity-40"
          />
          <button
            onClick={checkAnswer}
            disabled={!input.trim() || !!feedback}
            className="px-6 bg-[var(--primary)] text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 cursor-pointer border-none"
          >
            OK
          </button>
        </>
      ) : (
        <button
          onClick={checkAnswer}
          disabled={!input.trim() || !!feedback}
          className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 cursor-pointer border-none"
        >
          OK
        </button>
      )}
    </div>
  );

  return (
    <GameShell
      title="Snelronde"
      icon="⚡"
      onClose={() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setRunning(false);
        setGameStarted(false);
      }}
      actionBar={gameActionBar}
    >
      <LesContextChip />
      <div className="flex-1 flex flex-col relative w-full justify-center">
        {/* Floating points animation */}
        <AnimatePresence>
          {showPoints && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.6 }}
              animate={{ opacity: 1, y: -120, scale: 1.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 text-[var(--success)] font-black text-6xl select-none"
            >
              +{pointsGained}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer + Stats Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between shadow-sm mb-4 select-none">
          {/* Combo Chip */}
          <div className="flex flex-col items-center">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              scores.combo >= 3 ? "bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20 animate-pulse" : "bg-[var(--surface-2)] text-[var(--text-muted)]"
            }`}>
              {comboMultiplier}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">COMBO</span>
          </div>

          {/* Timer Ring */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg width="64" height="64" className="transform -rotate-90">
              <circle cx="32" cy="32" r={radius} stroke="var(--surface-2)" strokeWidth="3" fill="none" />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke={strokeColor}
                strokeWidth="3"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className={`absolute text-base font-bold font-mono ${isDanger ? "text-[var(--danger)] font-black" : "text-[var(--text)]"}`}>
              {timeLeft}
            </span>
          </div>

          {/* Points Chip */}
          <div className="flex flex-col items-center">
            <span className="px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/10 text-xs font-black">
              {scores.points}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">PUNTEN</span>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-center min-h-[220px]">
          {mode === "vertaal" ? (
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-2">VERTAAL (Çevir)</p>
              <h3 className="text-2xl font-bold leading-normal text-[var(--text)]">{current?.tr}</h3>
            </div>
          ) : (
            <div className="text-center flex flex-col items-center justify-center gap-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-1">VUL IN (Boşluğu Doldur)</p>
              {isAdvanced && !hintRevealed ? (
                <button
                  onClick={() => setHintRevealed(true)}
                  className="text-xs font-bold text-[var(--primary)] hover:underline border-none bg-transparent p-0 cursor-pointer"
                >
                  [toon vertaling — çeviriyi göster]
                </button>
              ) : (
                <p className="text-sm text-[var(--text-muted)] italic">{current?.tr}</p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xl font-bold text-[var(--text)] font-sans">
                {gap.before && <span>{gap.before}</span>}
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={feedback !== null}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && input.trim() && !feedback) {
                      checkAnswer();
                    }
                  }}
                  className="inline-block border-b-2 border-[var(--accent)] bg-transparent text-center outline-none text-[var(--accent)] font-bold px-1 py-0.5 focus:border-[var(--accent)] focus:ring-0 focus:outline-none"
                  style={{ width: `${Math.max(80, input.length * 12)}px` }}
                  placeholder="..."
                  autoFocus
                />
                {gap.after && <span>{gap.after}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Feedback Toast wrapper */}
        <FeedbackToast
          state={feedback}
          message={feedback === "correct" ? "Goed!" : "Hata!"}
          detail={feedback === "correct" ? "" : mode === "vul-in" ? `→ ${gap.target}` : `→ ${current?.nl}`}
        />
      </div>
    </GameShell>
  );
}

export default function SnelrondePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <p className="text-sm font-bold uppercase tracking-widest opacity-40 animate-pulse text-[var(--text)]">Laden…</p>
        </div>
      }
    >
      <SnelrondeGame />
    </Suspense>
  );
}
