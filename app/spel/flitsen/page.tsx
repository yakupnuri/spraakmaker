"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress, useMoedertaal } from "@/lib/hooks";
import type { Sentence } from "@/lib/types";
import GameShell from "@/components/game/GameShell";
import { useSearchParams } from "next/navigation";
import LesContextChip from "@/components/game/LesContextChip";
import Link from "next/link";

interface FlitsenProgress {
  completedRounds: Record<number, number>; // packIndex -> Mastered level (0-7)
  lastPlayed: Record<number, string>;      // packIndex -> ISO Date
  activePacks: number[];                   // Current active queue (max 4)
}

function playBeepTone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.error("Audio beep error:", e);
  }
}

function getSentenceTimeLimit(sentence?: Sentence): number {
  if (!sentence || !sentence.nl) return 5;
  const wordCount = sentence.nl.trim().split(/\s+/).length;
  if (wordCount <= 4) return 5;
  if (wordCount <= 8) return 7;
  return 8;
}

function speakDutch(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "nl-NL";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch (e) {
    console.error("TTS Speech error:", e);
  }
}

function FlitsenGame() {
  const { progress, updateProgress, recordActivity } = useProgress();
  const { translate } = useMoedertaal();
  const searchParams = useSearchParams();
  const bron = searchParams.get("bron");
  const les = searchParams.get("les");

  const [flatSentences, setFlatSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);

  const [flitsenProgress, setFlitsenProgress] = useState<FlitsenProgress>({
    completedRounds: {},
    lastPlayed: {},
    activePacks: [],
  });

  const [activePackIndex, setActivePackIndex] = useState<number | null>(null);
  const [gameMode, setGameMode] = useState<"dashboard" | "playing" | "completed">("dashboard");
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isAdvanced, setIsAdvanced] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  useEffect(() => {
    const level = localStorage.getItem("spraakmaker-niveau");
    if (level === "B1" || level === "B2") {
      setIsAdvanced(true);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    if (bron === "verhaal" && les) {
      import("@/lib/gameData").then(({ loadVerhaalZinnen }) => {
        loadVerhaalZinnen([les]).then((data) => {
          setFlatSentences(data);
          setLoading(false);
          // start the game immediately as a single pack
          setActivePackIndex(0);
          setCurrentSentenceIndex(0);
          const firstSentence = data[0];
          const initialTime = getSentenceTimeLimit(firstSentence);
          setTimeLeft(initialTime);
          setIsPaused(false);
          setGameMode("playing");
        });
      });
    } else {
      fetch("/data/zinnenbank.json")
        .then((r) => r.json())
        .then((data: Array<{ sentences: Sentence[] }>) => {
          const flattened = data
            .flatMap((l) => l.sentences || [])
            .filter((s) => s && s.nl && s.tr);
          setFlatSentences(flattened);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading lessons in flitsen:", err);
          setLoading(false);
        });
    }
  }, [bron, les]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("spraakmaker-flitsen-progress");
      if (stored) {
        setFlitsenProgress(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load flitsen progress:", e);
    }
  }, []);

  const saveFlitsenProgress = (newProg: FlitsenProgress) => {
    setFlitsenProgress(newProg);
    try {
      localStorage.setItem("spraakmaker-flitsen-progress", JSON.stringify(newProg));
    } catch (e) {
      console.error("Failed to save flitsen progress:", e);
    }
  };

  const PACK_SIZE = 20;
  const totalPacks = Math.ceil(flatSentences.length / PACK_SIZE);

  const getPackSentences = () => {
    if (bron === "verhaal") {
      return flatSentences;
    }
    if (activePackIndex === null) return [];
    return flatSentences.slice(
      activePackIndex * PACK_SIZE,
      (activePackIndex + 1) * PACK_SIZE
    );
  };

  useEffect(() => {
    if (activePackIndex !== null && gameMode === "playing") {
      const packSentences = getPackSentences();
      const sentence = packSentences[currentSentenceIndex];
      if (sentence) {
        setTimeLeft(getSentenceTimeLimit(sentence));
      }
    }
  }, [currentSentenceIndex, activePackIndex, gameMode, flatSentences, bron]);

  useEffect(() => {
    if (activePackIndex !== null && gameMode === "playing" && !isPaused) {
      const packSentences = getPackSentences();
      const sentence = packSentences[currentSentenceIndex];
      if (sentence && sentence.nl) {
        speakDutch(sentence.nl);
      }
    }
  }, [currentSentenceIndex, activePackIndex, gameMode, flatSentences, isPaused, bron]);

  useEffect(() => {
    if (gameMode !== "playing" || isPaused || activePackIndex === null) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameMode, isPaused, currentSentenceIndex, activePackIndex]);

  useEffect(() => {
    if (timeLeft === 0 && gameMode === "playing" && !isPaused && activePackIndex !== null) {
      playBeepTone();
      handleNextSentence();
    }
  }, [timeLeft, gameMode, isPaused, activePackIndex]);

  const handleNextSentence = () => {
    if (activePackIndex === null) return;
    const packSentences = getPackSentences();
    const sentence = packSentences[currentSentenceIndex];

    if (sentence) {
      updateProgress((prev) => {
        const currentStats = prev.games.stats?.flitsen || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
        const newHistory = [
          ...currentStats.history,
          {
            sentence: sentence.nl,
            translation: sentence.tr,
            correct: true,
            timestamp: new Date().toISOString(),
          }
        ].slice(-50);

        return {
          ...prev,
          games: {
            ...prev.games,
            stats: {
              ...prev.games.stats,
              flitsen: {
                playCount: currentStats.playCount + 1,
                correctCount: currentStats.correctCount + 1,
                wrongCount: currentStats.wrongCount,
                history: newHistory,
              }
            }
          }
        };
      });
      recordActivity();
    }

    if (currentSentenceIndex >= packSentences.length - 1) {
      handlePackCompletion();
    } else {
      const nextIndex = currentSentenceIndex + 1;
      const nextSentence = packSentences[nextIndex];
      setCurrentSentenceIndex(nextIndex);
      setHintRevealed(false);
      if (nextSentence) {
        setTimeLeft(getSentenceTimeLimit(nextSentence));
      }
    }
  };

  const handlePrevSentence = () => {
    if (currentSentenceIndex > 0) {
      if (activePackIndex === null) return;
      const packSentences = getPackSentences();
      const prevIndex = currentSentenceIndex - 1;
      const prevSentence = packSentences[prevIndex];
      setCurrentSentenceIndex(prevIndex);
      setHintRevealed(false);
      if (prevSentence) {
        setTimeLeft(getSentenceTimeLimit(prevSentence));
      }
    }
  };

  const handleResetSentenceTimer = () => {
    if (activePackIndex === null) return;
    const packSentences = getPackSentences();
    const currentSentence = packSentences[currentSentenceIndex];
    if (currentSentence) {
      setTimeLeft(getSentenceTimeLimit(currentSentence));
    }
  };

  const handlePackCompletion = () => {
    if (activePackIndex === null) return;

    if (timerRef.current) clearInterval(timerRef.current);

    if (bron === "verhaal") {
      setGameMode("completed");
      return;
    }

    const prevRounds = flitsenProgress.completedRounds[activePackIndex] || 0;
    const newRounds = Math.min(prevRounds + 1, 7);

    const updatedRounds = {
      ...flitsenProgress.completedRounds,
      [activePackIndex]: newRounds,
    };

    const updatedLastPlayed = {
      ...flitsenProgress.lastPlayed,
      [activePackIndex]: new Date().toISOString(),
    };

    let updatedActive = [...flitsenProgress.activePacks];
    if (newRounds >= 7) {
      updatedActive = updatedActive.filter((id) => id !== activePackIndex);
    } else if (!updatedActive.includes(activePackIndex)) {
      updatedActive.push(activePackIndex);
    }

    if (newRounds < 7) {
      updatedActive = updatedActive.filter((id) => id !== activePackIndex);
      updatedActive.push(activePackIndex);
    }

    saveFlitsenProgress({
      completedRounds: updatedRounds,
      lastPlayed: updatedLastPlayed,
      activePacks: updatedActive,
    });

    updateProgress((p) => {
      const currentFlitsenHighScore = p.games.highScores.flitsen ?? 0;
      return {
        ...p,
        games: {
          ...p.games,
          totalPoints: p.games.totalPoints + 50,
          highScores: {
            ...p.games.highScores,
            flitsen: Math.max(currentFlitsenHighScore, 50),
          },
          lastPlayDate: new Date().toISOString(),
        },
      };
    });

    setGameMode("completed");
  };

  const startPack = (packId: number) => {
    let updatedActive = [...flitsenProgress.activePacks];
    if (!updatedActive.includes(packId) && (flitsenProgress.completedRounds[packId] || 0) < 7) {
      if (updatedActive.length >= 4) {
        updatedActive.shift();
      }
      updatedActive.push(packId);
      saveFlitsenProgress({
        ...flitsenProgress,
        activePacks: updatedActive,
      });
    }

    const packSentences = flatSentences.slice(
      packId * PACK_SIZE,
      (packId + 1) * PACK_SIZE
    );
    const firstSentence = packSentences[0];
    const initialTime = getSentenceTimeLimit(firstSentence);

    setActivePackIndex(packId);
    setCurrentSentenceIndex(0);
    setTimeLeft(initialTime);
    setIsPaused(false);
    setGameMode("playing");
  };

  const getRecommendation = () => {
    if (totalPacks === 0) return null;

    const active = flitsenProgress.activePacks.filter(
      (id) => (flitsenProgress.completedRounds[id] || 0) < 7
    );

    if (active.length < 4) {
      let nextUnstarted = -1;
      for (let i = 0; i < totalPacks; i++) {
        const rounds = flitsenProgress.completedRounds[i] || 0;
        if (rounds === 0 && !active.includes(i)) {
          nextUnstarted = i;
          break;
        }
      }

      if (nextUnstarted !== -1) {
        return {
          type: "start_new",
          packIndex: nextUnstarted,
          label: `Start nieuw pakket: Pakket ${nextUnstarted + 1}`,
          desc: "Voeg een nieuw pakket toe aan je dagelijkse rotatie om nieuwe zinnen te leren.",
        };
      }
    }

    if (active.length > 0) {
      const oldestActive = [...active].sort((a, b) => {
        const timeA = new Date(flitsenProgress.lastPlayed[a] || 0).getTime();
        const timeB = new Date(flitsenProgress.lastPlayed[b] || 0).getTime();
        return timeA - timeB;
      })[0];

      const currentRound = (flitsenProgress.completedRounds[oldestActive] || 0) + 1;
      return {
        type: "review",
        packIndex: oldestActive,
        label: `Herhaal pakket ${oldestActive + 1} (Ronde ${currentRound}/7)`,
        desc: "Het is tijd om dit pakket te herhalen om de zinnen in je langetermijngeheugen te prenten.",
      };
    }

    return {
      type: "finished",
      packIndex: -1,
      label: "Alle pakketten voltooid!",
      desc: "Geweldig! Je hebt alle beschikbare zinnen 7 keer herhaald en succesvol opgeslagen.",
    };
  };

  if (loading || flatSentences.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <p className="text-sm font-bold uppercase tracking-widest opacity-40 animate-pulse">Laden…</p>
      </div>
    );
  }

  const rec = getRecommendation();

  // Rendering dashboard
  if (gameMode === "dashboard") {
    const active = flitsenProgress.activePacks.filter(
      (id) => (flitsenProgress.completedRounds[id] || 0) < 7
    );

    return (
      <div className="min-h-screen bg-[var(--bg)] pb-24 pt-6 px-4 md:px-8 max-w-4xl mx-auto flex flex-col gap-6 select-none">
        {/* Header Title */}
        <div className="flex justify-between items-center select-none">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] uppercase">
              Flitsen
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Dynamic Spaced Repetition (⚡ +50 pts per ronde)
            </p>
          </div>
        </div>

        {/* Smart recommendation block */}
        {rec && rec.packIndex !== -1 && (
          <div
            className={`p-6 rounded-3xl border border-[var(--border)] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              rec.type === "start_new"
                ? "bg-[var(--accent-soft)] border-[var(--accent)]/20"
                : "bg-[var(--danger-soft)] border-[var(--danger)]/20"
            }`}
          >
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-1 text-[var(--text)]">
                AANBEVOLEN ACTIE (SLIMME ROTATIE)
              </span>
              <h2 className="text-lg font-black text-[var(--text)]">{rec.label}</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl leading-relaxed">{rec.desc}</p>
            </div>
            <button
              onClick={() => startPack(rec.packIndex)}
              className="px-6 py-3.5 font-bold uppercase tracking-widest text-xs rounded-xl bg-[var(--primary)] text-white hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
            >
              START NU
            </button>
          </div>
        )}

        {/* Layout sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active queue */}
          <div className="lg:col-span-1 border border-[var(--border)] bg-[var(--surface)] rounded-3xl p-5 flex flex-col shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4 block">
              ACTIEVE ROTATIE ({active.length} / 4)
            </span>
            {active.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] opacity-70 italic py-8 text-center bg-[var(--surface-2)] rounded-2xl border border-dashed border-[var(--border)]">
                Geen actieve pakketten. Start een nieuw pakket!
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {active.map((packId) => {
                  const rounds = flitsenProgress.completedRounds[packId] || 0;
                  const lastPlayedStr = flitsenProgress.lastPlayed[packId];
                  const timeStr = lastPlayedStr
                    ? new Date(lastPlayedStr).toLocaleDateString("nl-NL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Nooit";

                  return (
                    <div
                      key={packId}
                      className="border border-[var(--border)] p-4 bg-[var(--surface-2)] rounded-2xl flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-sm text-[var(--text)]">Pakket {packId + 1}</h3>
                          <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">
                            Laatst: {timeStr}
                          </span>
                        </div>
                        <button
                          onClick={() => startPack(packId)}
                          className="bg-[var(--accent)] text-white px-3 py-1.5 font-bold uppercase tracking-widest text-[9px] border-none rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                        >
                          SPELEN
                        </button>
                      </div>

                      {/* Progress dots */}
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 block mb-1.5 text-[var(--text-muted)]">
                          Herhalingen: {rounds} / 7
                        </span>
                        <div className="flex gap-1.5">
                          {Array.from({ length: 7 }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-2 flex-1 rounded-full border border-[var(--border)] ${
                                idx < rounds ? "bg-[var(--accent)]" : "bg-transparent"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* All packages list */}
          <div className="lg:col-span-2 border border-[var(--border)] bg-[var(--surface)] rounded-3xl p-5 flex flex-col shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4 block">
              ALLE PAKKETTEN (SPACED REPETITION)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[420px] pr-1">
              {Array.from({ length: totalPacks }).map((_, idx) => {
                const rounds = flitsenProgress.completedRounds[idx] || 0;
                const isActivePack = active.includes(idx);
                const isMastered = rounds >= 7;

                let cardBg = "bg-[var(--surface)]";
                let textClass = "text-[var(--text)] border-[var(--border)]";
                if (isActivePack) {
                  cardBg = "bg-[var(--accent-soft)] border-[var(--accent)]/30";
                } else if (isMastered) {
                  cardBg = "bg-[var(--success-soft)] border-[var(--success)]/30";
                }

                return (
                  <div
                    key={idx}
                    onClick={() => !isMastered && startPack(idx)}
                    className={`border p-3 flex flex-col justify-between h-[110px] rounded-2xl cursor-pointer hover:border-[var(--accent)] hover:shadow-sm transition-all ${cardBg} ${textClass}`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs">Pakket {idx + 1}</span>
                        {isMastered && (
                          <span className="text-[8px] bg-[var(--success)] text-white px-1.5 py-0.5 font-bold uppercase rounded">
                            ✓ Mastered
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-[var(--text-muted)] block mt-1">
                        Zinnen: {idx * PACK_SIZE + 1} - {Math.min((idx + 1) * PACK_SIZE, flatSentences.length)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-1.5 mt-2">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                        Ronde: {rounds} / 7
                      </span>
                      {!isMastered && (
                        <span className="text-[10px] font-black text-[var(--accent)]">→</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active game playing layout
  if (gameMode === "playing" && activePackIndex !== null) {
    const packSentences = flatSentences.slice(
      activePackIndex * PACK_SIZE,
      (activePackIndex + 1) * PACK_SIZE
    );
    const sentence = packSentences[currentSentenceIndex];

    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const currentLimit = getSentenceTimeLimit(sentence);
    const strokeDashoffset = circumference - (timeLeft / currentLimit) * circumference;

    const scoreChip = (
      <div className="flex items-center gap-3">
        {/* Countdown Circle */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg width="32" height="32" className="transform -rotate-90">
            <circle cx="16" cy="16" r={radius} stroke="var(--surface-2)" strokeWidth="2.5" fill="none" />
            <circle
              cx="16"
              cy="16"
              r={radius}
              stroke="var(--accent)"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="absolute text-[10px] font-bold text-[var(--text)]">{timeLeft}</span>
        </div>
        <span className="text-xs font-bold text-[var(--text-muted)]">
          {currentSentenceIndex + 1}/{packSentences.length}
        </span>
      </div>
    );

    const actionBar = (
      <div className="flex justify-between items-center gap-3 w-full">
        {/* Prev */}
        <button
          onClick={handlePrevSentence}
          disabled={currentSentenceIndex === 0 || isPaused}
          className="flex-1 py-3 bg-[var(--surface-2)] text-[var(--text)] rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-90 disabled:opacity-30 transition-all border border-[var(--border)] cursor-pointer"
        >
          ← Vorige
        </button>

        {/* Pause / Play */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs cursor-pointer transition-colors ${
            isPaused
              ? "bg-[var(--accent)] text-white border-none"
              : "bg-[var(--primary)] text-white border-none"
          }`}
        >
          {isPaused ? "▶ Doorgaan" : "⏸ Pauze"}
        </button>

        {/* Reset */}
        <button
          onClick={handleResetSentenceTimer}
          disabled={isPaused}
          className="w-12 h-12 border border-[var(--border)] bg-[var(--surface-2)] rounded-xl text-lg flex items-center justify-center cursor-pointer transition-all hover:bg-[var(--surface-2)]/80 disabled:opacity-30"
          title="Reset timer"
        >
          ⟳
        </button>

        {/* Sla Over / Next */}
        <button
          onClick={handleNextSentence}
          className="flex-1 py-3 bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/10 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all cursor-pointer"
        >
          Sla over →
        </button>
      </div>
    );

    return (
      <GameShell
        title={bron === "verhaal" ? "Flitsen" : `Pakket ${activePackIndex + 1} — Ronde ${(flitsenProgress.completedRounds[activePackIndex] || 0) + 1}/7`}
        icon="⚡"
        scoreChip={scoreChip}
        onClose={() => {
          if (bron === "verhaal") {
            window.location.href = `/lessen/${les}`;
          } else {
            setGameMode("dashboard");
          }
        }}
        actionBar={actionBar}
      >
        <LesContextChip />
        <div className="flex-1 flex flex-col justify-center items-center py-6 w-full max-w-md mx-auto">
          {/* Card */}
          <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 min-h-[220px] flex flex-col justify-between shadow-sm relative overflow-hidden">
            {/* Dutch Text */}
            <div className="my-auto text-center">
              <h2 className="text-xl md:text-2xl font-bold leading-normal tracking-wide text-[var(--text)] font-sans">
                {sentence?.nl}
              </h2>
            </div>

            {/* Translation / Hint */}
            <div className="mt-6 border-t border-[var(--border)] pt-4 text-center">
              {isAdvanced && !hintRevealed ? (
                <button
                  onClick={() => setHintRevealed(true)}
                  className="text-xs font-bold text-[var(--accent)] hover:underline border-none bg-none p-0 cursor-pointer inline-block bg-transparent"
                >
                  [toon vertaling]
                </button>
              ) : (
                <p className="text-xs font-bold text-[var(--text-muted)] italic">
                  {translate(sentence)}
                </p>
              )}
            </div>
          </div>

          {/* Speak Button */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <motion.button
              onClick={() => sentence?.nl && speakDutch(sentence.nl)}
              animate={isPaused ? {} : { scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-12 h-12 rounded-full bg-[var(--accent)] text-white flex items-center justify-center cursor-pointer active:scale-95 shadow-sm border-none text-xl"
            >
              🔊
            </motion.button>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              {isPaused ? "Gepauzeerd" : "Spreek hardop na"}
            </p>
          </div>
        </div>
      </GameShell>
    );
  }

  // Completion round screen
  if (gameMode === "completed" && activePackIndex !== null) {
    if (bron === "verhaal") {
      return (
        <div className="min-h-screen bg-[var(--bg)] py-12 px-4 flex items-center justify-center select-none">
          <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-md text-center flex flex-col items-center gap-5">
            <span className="text-4xl">🎉</span>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-black text-[var(--text)] uppercase tracking-tight">
                HİKÂYE CÜMLELERİ TAMAMLANDI!
              </h2>
              <p className="text-xs text-[var(--text-muted)] max-w-[280px] leading-relaxed mt-1">
                Harika! Bu derse ait tüm hikâye cümlelerini başarıyla flitsen yaptınız.
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full mt-4">
              <button
                onClick={() => {
                  setCurrentSentenceIndex(0);
                  const firstSentence = flatSentences[0];
                  const initialTime = getSentenceTimeLimit(firstSentence);
                  setTimeLeft(initialTime);
                  setIsPaused(false);
                  setGameMode("playing");
                }}
                className="w-full bg-[var(--primary)] text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
              >
                Opnieuw
              </button>
              <Link
                href={`/lessen/${les}`}
                className="w-full bg-[var(--surface-2)] text-[var(--text)] py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-90 active:scale-95 transition-all text-center border border-[var(--border)] block"
              >
                Terug naar de les
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const rounds = flitsenProgress.completedRounds[activePackIndex] || 0;
    const isMastered = rounds >= 7;

    return (
      <div className="min-h-screen bg-[var(--bg)] py-12 px-4 flex items-center justify-center select-none">
        <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-md text-center flex flex-col items-center gap-5">
          <span className="text-4xl">🎉</span>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-black text-[var(--text)] uppercase tracking-tight">
              {isMastered ? "PAKKET GEMASTERD!" : "RONDE VOLTOOID!"}
            </h2>
            <p className="text-xs text-[var(--text-muted)] max-w-[280px] leading-relaxed mt-1">
              {isMastered
                ? "Gefeliciteerd! Dit pakket is nu 7 keer herhaald en permanent opgeslagen."
                : `Nog ${7 - rounds} herhalingen te gaan voor opslag in het langetermijngeheugen.`}
            </p>
          </div>
          
          <div className="bg-[var(--success-soft)] text-[var(--success)] px-5 py-3.5 rounded-2xl w-full border border-[var(--success)]/10 flex flex-col items-center">
            <span className="text-[9px] font-black tracking-wider uppercase opacity-85">VERDIENDE PUNTEN</span>
            <span className="text-3xl font-extrabold mt-0.5">+50</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <div className="bg-[var(--surface-2)] p-3 rounded-xl flex flex-col items-center">
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">PAKKET</span>
              <span className="text-base font-black text-[var(--text)] mt-0.5">#{activePackIndex + 1}</span>
            </div>
            <div className="bg-[var(--surface-2)] p-3 rounded-xl flex flex-col items-center">
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">RONDE</span>
              <span className="text-base font-black text-[var(--text)] mt-0.5">{rounds}/7</span>
            </div>
          </div>

          <button
            onClick={() => setGameMode("dashboard")}
            className="w-full bg-[var(--primary)] text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
          >
            TERUG NAAR DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function FlitsenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <p className="text-sm font-bold uppercase tracking-widest opacity-40 animate-pulse">Laden…</p>
        </div>
      }
    >
      <FlitsenGame />
    </Suspense>
  );
}
