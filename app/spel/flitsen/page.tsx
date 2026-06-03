"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress, useMoedertaal } from "@/lib/hooks";
import type { Sentence } from "@/lib/types";

// Standard De Stijl palette
const SLOT_COLORS = [
  "bg-[var(--ds-red)] text-[var(--ds-white)]",
  "bg-[var(--ds-blue)] text-[var(--ds-white)]",
  "bg-[var(--ds-yellow)] text-[var(--ds-black)]",
  "bg-[var(--ds-white)] text-[var(--ds-black)] border-[3px] border-[var(--ds-black)]",
];

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
  return 8; // Büyük cümlelerde 7-8 saniye olsun
}

function FlitsenGame() {
  const { progress, updateProgress } = useProgress();
  const { translate } = useMoedertaal();

  // Sentences data
  const [flatSentences, setFlatSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);

  // Local game session storage/progress
  const [flitsenProgress, setFlitsenProgress] = useState<FlitsenProgress>({
    completedRounds: {},
    lastPlayed: {},
    activePacks: [],
  });

  // Active game play state
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

  // Load sentences from lessen.json
  useEffect(() => {
    fetch("/data/lessen.json")
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
  }, []);

  // Load flitsen-specific progress from localStorage
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

  // Save flitsen progress
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

  // Sync time limit when current sentence changes
  useEffect(() => {
    if (activePackIndex !== null && gameMode === "playing") {
      const packSentences = flatSentences.slice(
        activePackIndex * PACK_SIZE,
        (activePackIndex + 1) * PACK_SIZE
      );
      const sentence = packSentences[currentSentenceIndex];
      if (sentence) {
        setTimeLeft(getSentenceTimeLimit(sentence));
      }
    }
  }, [currentSentenceIndex, activePackIndex, gameMode, flatSentences]);

  // Timer logic for countdown
  useEffect(() => {
    if (gameMode !== "playing" || isPaused || activePackIndex === null) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          return 0; // Trigger auto-advance in a separate effect
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameMode, isPaused, currentSentenceIndex, activePackIndex]);

  // Auto-advance when time hits 0
  useEffect(() => {
    if (timeLeft === 0 && gameMode === "playing" && !isPaused && activePackIndex !== null) {
      playBeepTone();
      handleNextSentence();
    }
  }, [timeLeft, gameMode, isPaused, activePackIndex]);

  const handleNextSentence = () => {
    if (activePackIndex === null) return;
    const packSentences = flatSentences.slice(
      activePackIndex * PACK_SIZE,
      (activePackIndex + 1) * PACK_SIZE
    );

    if (currentSentenceIndex >= packSentences.length - 1) {
      // Completed the pack!
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
      const packSentences = flatSentences.slice(
        activePackIndex * PACK_SIZE,
        (activePackIndex + 1) * PACK_SIZE
      );
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
    const packSentences = flatSentences.slice(
      activePackIndex * PACK_SIZE,
      (activePackIndex + 1) * PACK_SIZE
    );
    const currentSentence = packSentences[currentSentenceIndex];
    if (currentSentence) {
      setTimeLeft(getSentenceTimeLimit(currentSentence));
    }
  };

  const handlePackCompletion = () => {
    if (activePackIndex === null) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const prevRounds = flitsenProgress.completedRounds[activePackIndex] || 0;
    const newRounds = Math.min(prevRounds + 1, 7);

    // Update completed rounds & lastPlayed timestamps
    const updatedRounds = {
      ...flitsenProgress.completedRounds,
      [activePackIndex]: newRounds,
    };

    const updatedLastPlayed = {
      ...flitsenProgress.lastPlayed,
      [activePackIndex]: new Date().toISOString(),
    };

    // Update active packs queue:
    // If pack is newly completed (reached 7 rounds), remove it from active queue
    let updatedActive = [...flitsenProgress.activePacks];
    if (newRounds >= 7) {
      updatedActive = updatedActive.filter((id) => id !== activePackIndex);
    } else if (!updatedActive.includes(activePackIndex)) {
      // Ensure it is in active queue if it's in progress
      updatedActive.push(activePackIndex);
    }

    // Move completed pack to end of active queue to rotate it
    if (newRounds < 7) {
      updatedActive = updatedActive.filter((id) => id !== activePackIndex);
      updatedActive.push(activePackIndex);
    }

    saveFlitsenProgress({
      completedRounds: updatedRounds,
      lastPlayed: updatedLastPlayed,
      activePacks: updatedActive,
    });

    // Update global app stats (points)
    updateProgress((p) => ({
      ...p,
      games: {
        ...p.games,
        totalPoints: p.games.totalPoints + 50, // 50 points per completed pack/round
        lastPlayDate: new Date().toISOString(),
      },
    }));

    setGameMode("completed");
  };

  const startPack = (packId: number) => {
    // Add to active queue if it's not already there and space permits
    let updatedActive = [...flitsenProgress.activePacks];
    if (!updatedActive.includes(packId) && (flitsenProgress.completedRounds[packId] || 0) < 7) {
      if (updatedActive.length >= 4) {
        // If active queue is full, remove the oldest one (first item) to fit the new one
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

  // Rotation Recommendation Engine (4 active queue size)
  const getRecommendation = () => {
    if (totalPacks === 0) return null;

    // Filter out mastered packs from active queue
    const active = flitsenProgress.activePacks.filter(
      (id) => (flitsenProgress.completedRounds[id] || 0) < 7
    );

    // If active queue has less than 4 packs, find first unstarted/incomplete pack not in active queue
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

    // Otherwise, recommend reviewing the oldest played active pack
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

    // Check if there's any active pack at all (if all packs completed)
    return {
      type: "finished",
      packIndex: -1,
      label: "Alle pakketten voltooid!",
      desc: "Geweldig! Je hebt alle beschikbare zinnen 7 keer herhaald en succesvol opgeslagen.",
    };
  };

  if (loading || flatSentences.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ds-white)]">
        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Laden…</p>
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
      <div className="flex flex-col min-h-screen bg-[var(--ds-white)] select-none pb-24 md:pb-4">
        {/* Header */}
        <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">flitsen</span>
          <span className="text-xs font-bold text-[var(--ds-yellow)]">
            +50 pts per ronde
          </span>
        </div>

        {/* Info Banner */}
        <div className="bg-[var(--ds-white)] border-b-[3px] border-[var(--ds-black)] p-5 text-[var(--ds-black)]">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">
            FLITSEN METHODE
          </span>
          <h1 className="text-xl font-black">Dynamic Spaced Repetition</h1>
          <p className="text-xs opacity-75 mt-1 leading-relaxed">
            Herhaal elke zin hardop binnen de tijd (korte zinnen 5s, langere zinnen 7-8s). We trainen je hersenen door maximaal 4 pakketten tegelijk aktif tutarak 7 kez tekrar ettiriyoruz.
          </p>
        </div>

        {/* Smart recommendation block */}
        {rec && (
          <div className="p-3 bg-[var(--ds-black)]">
            <div
              className={`p-6 flex flex-col md:flex-row md:items-center md:justify-between border-[3px] border-[var(--ds-black)] ${
                rec.type === "start_new" ? "bg-[var(--ds-yellow)]" : rec.type === "review" ? "bg-[var(--ds-red)] text-white" : "bg-[var(--ds-blue)] text-white"
              }`}
            >
              <div className="mb-4 md:mb-0">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-1">
                  AANBEVOLEN ACTIE (SLIMME ROTATIE)
                </span>
                <h2 className="text-xl font-black">{rec.label}</h2>
                <p className="text-xs opacity-80 mt-1 max-w-xl">{rec.desc}</p>
              </div>
              {rec.packIndex !== -1 && (
                <button
                  onClick={() => startPack(rec.packIndex)}
                  className={`px-6 py-4 font-black uppercase tracking-widest text-sm border-[3px] border-[var(--ds-black)] hover:opacity-90 active:scale-95 transition-all cursor-pointer ${
                    rec.type === "start_new" ? "bg-[var(--ds-black)] text-[var(--ds-white)]" : "bg-[var(--ds-white)] text-[var(--ds-black)]"
                  }`}
                >
                  START NU
                </button>
              )}
            </div>
          </div>
        )}

        {/* Two-Column Layout for Active and All Packs */}
        <div className="p-3 grid gap-3 grid-cols-1 lg:grid-cols-3">
          {/* Column 1: Active Packs queue */}
          <div className="lg:col-span-1 border-[3px] border-[var(--ds-black)] bg-[var(--ds-white)] p-4 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-black)] opacity-60 mb-4 block">
              ACTIEVE ROTATIE ({active.length} / 4)
            </span>
            {active.length === 0 ? (
              <p className="text-xs text-[var(--ds-black)] opacity-40 italic py-6 text-center">
                Geen actieve pakketten. Start hierboven een nieuw pakket!
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
                      className="border-[3px] border-[var(--ds-black)] p-4 bg-[var(--ds-white)] flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-black text-sm">Pakket {packId + 1}</h3>
                          <span className="text-[9px] text-[var(--ds-black)] opacity-50 block mt-0.5">
                            Laatst: {timeStr}
                          </span>
                        </div>
                        <button
                          onClick={() => startPack(packId)}
                          className="bg-[var(--ds-black)] text-[var(--ds-white)] px-3 py-1.5 font-bold uppercase tracking-widest text-[9px] border-none hover:opacity-90 cursor-pointer"
                        >
                          SPELEN
                        </button>
                      </div>

                      {/* Repetition Block indicators */}
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 block mb-1">
                          Herhalingen: {rounds} / 7
                        </span>
                        <div className="flex gap-1">
                          {Array.from({ length: 7 }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-3 flex-1 border border-[var(--ds-black)] ${
                                idx < rounds ? "bg-[var(--ds-blue)]" : "bg-transparent"
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

          {/* Column 2 & 3: All packs grid */}
          <div className="lg:col-span-2 border-[3px] border-[var(--ds-black)] bg-[var(--ds-white)] p-4 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-black)] opacity-60 mb-4 block">
              ALLE PAKKETTEN (SPACED REPETITION KAARTEN)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[500px] pr-1">
              {Array.from({ length: totalPacks }).map((_, idx) => {
                const rounds = flitsenProgress.completedRounds[idx] || 0;
                const isActivePack = active.includes(idx);
                const isMastered = rounds >= 7;

                let cardBg = "bg-[var(--ds-white)]";
                let textClass = "text-[var(--ds-black)]";
                if (isActivePack) {
                  cardBg = "bg-[var(--ds-gray)]";
                } else if (isMastered) {
                  cardBg = "bg-[var(--ds-green)] text-white";
                }

                return (
                  <div
                    key={idx}
                    onClick={() => !isMastered && startPack(idx)}
                    className={`border-[3px] border-[var(--ds-black)] p-3 flex flex-col justify-between h-[110px] cursor-pointer hover:bg-[var(--ds-yellow)] hover:text-black transition-colors ${cardBg} ${textClass}`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-black text-xs">Pakket {idx + 1}</span>
                        {isMastered && (
                          <span className="text-[8px] bg-white text-[var(--ds-green)] px-1.5 py-0.5 font-bold uppercase">
                            Voltooid
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] opacity-60 block mt-1">
                        Zinnen: {idx * PACK_SIZE + 1} - {Math.min((idx + 1) * PACK_SIZE, flatSentences.length)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--ds-black)] pt-1.5 mt-2">
                      <span className="text-[9px] font-bold uppercase tracking-wide">
                        Ronde: {rounds} / 7
                      </span>
                      {!isMastered && (
                        <span className="text-[10px] font-black">→</span>
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

    return (
      <div className="flex flex-col min-h-screen bg-[var(--ds-black)] text-[var(--ds-white)] select-none">
        {/* Header */}
        <div className="bg-[var(--ds-black)] border-b-[3px] border-[var(--ds-white)] px-5 py-4 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-[var(--ds-white)]">
            Pakket {activePackIndex + 1} — Ronde {(flitsenProgress.completedRounds[activePackIndex] || 0) + 1}/7
          </span>
          <button
            onClick={() => setGameMode("dashboard")}
            className="bg-transparent border border-white text-white px-3 py-1 font-bold text-xs uppercase tracking-wide hover:bg-white hover:text-black cursor-pointer"
          >
            Dashboard
          </button>
        </div>

        {/* Main Flashcard Container */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 max-w-4xl w-full mx-auto">
          {/* Progress bar info */}
          <div className="w-full flex justify-between items-center mb-3 max-w-2xl px-1">
            <span className="text-xs font-bold uppercase tracking-widest opacity-60">
              Zin {currentSentenceIndex + 1} van {packSentences.length}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest opacity-60">
              {timeLeft} seconden over
            </span>
          </div>

          {/* Flashcard Block */}
          <div className="w-full max-w-2xl bg-[var(--ds-white)] text-[var(--ds-black)] border-[4px] border-[var(--ds-black)] shadow-[8px_8px_0px_rgba(0,0,0,1)] p-8 md:p-12 min-h-[260px] flex flex-col justify-between relative overflow-hidden">
            {/* Visual timer countdown bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[var(--ds-gray)]">
              <motion.div
                key={currentSentenceIndex}
                initial={{ width: "100%" }}
                animate={isPaused ? {} : { width: "0%" }}
                transition={{ duration: timeLeft, ease: "linear" }}
                className="h-full bg-[var(--ds-red)]"
              />
            </div>

            {/* Dutch sentence (IMMERSION - BIG) */}
            <div className="my-auto text-center px-2">
              <h2 className="text-2xl md:text-4xl font-black leading-tight tracking-wide font-sans">
                {sentence?.nl}
              </h2>
            </div>

            {/* Local translation (NATIVE LANGUAGE - SMALL, MUTED) */}
            <div className="mt-8 border-t border-[rgba(0,0,0,0.1)] pt-4 text-center">
              {isAdvanced && !hintRevealed ? (
                <button
                  onClick={() => setHintRevealed(true)}
                  className="text-xs font-bold text-[var(--ds-blue)] hover:underline border-none bg-none p-0 cursor-pointer inline-block"
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  [toon vertaling]
                </button>
              ) : (
                <p className="text-xs md:text-sm font-bold text-[var(--ds-black)] opacity-50 italic">
                  {translate(sentence)}
                </p>
              )}
            </div>
          </div>

          {/* Audio Wave / Speak Icon Indicator */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <motion.div
              animate={isPaused ? {} : { scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-10 h-10 rounded-full bg-[var(--ds-blue)] border-[3px] border-white flex items-center justify-center text-white"
            >
              🔊
            </motion.div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">
              {isPaused ? "Gepauzeerd" : "Spreek hardop na"}
            </p>
          </div>
        </div>

        {/* Bottom Playback Navigation Panel */}
        <div className="border-t-[3px] border-[var(--ds-white)] bg-[var(--ds-black)] p-4 flex justify-between items-center gap-3">
          {/* Previous sentence button */}
          <button
            onClick={handlePrevSentence}
            disabled={currentSentenceIndex === 0}
            className="flex-1 max-w-[120px] bg-transparent border-[3px] border-white text-white py-3 font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-black cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
          >
            ← Vorige
          </button>

          {/* Pause / Play central toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex-1 max-w-[160px] py-3.5 border-[3px] border-white font-black uppercase tracking-widest text-xs cursor-pointer transition-colors ${
              isPaused
                ? "bg-[var(--ds-yellow)] text-black border-[var(--ds-yellow)]"
                : "bg-white text-black hover:bg-transparent hover:text-white"
            }`}
          >
            {isPaused ? "▶ Doorgaan" : "❚❚ Pauze"}
          </button>

          {/* Restart sentence timer */}
          <button
            onClick={handleResetSentenceTimer}
            className="w-12 h-12 border-[3px] border-white text-white hover:bg-white hover:text-black font-bold text-lg flex items-center justify-center cursor-pointer transition-colors"
            title="Reset timer"
          >
            ⟳
          </button>

          {/* Next sentence button */}
          <button
            onClick={handleNextSentence}
            className="flex-1 max-w-[120px] bg-[var(--ds-red)] border-[3px] border-[var(--ds-red)] text-white py-3 font-bold uppercase tracking-widest text-xs hover:opacity-90 cursor-pointer"
          >
            Sla over →
          </button>
        </div>
      </div>
    );
  }

  // Mastered / Completed round screen
  if (gameMode === "completed" && activePackIndex !== null) {
    const rounds = flitsenProgress.completedRounds[activePackIndex] || 0;
    const isMastered = rounds >= 7;

    return (
      <div className="min-h-screen flex flex-col bg-[var(--ds-white)] select-none">
        {/* Header */}
        <div className="bg-[var(--ds-black)] px-5 py-4">
          <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">ronde voltooid</span>
        </div>

        {/* Celebration mondrian layout */}
        <div className="p-[3px] bg-[var(--ds-black)] flex-1 flex flex-col">
          {/* Top Yellow Panel: points awarded */}
          <div className="bg-[var(--ds-yellow)] p-8 flex flex-col justify-center items-center flex-1 border-b-[3px] border-[var(--ds-black)]">
            <span className="text-sm font-black uppercase tracking-widest text-[var(--ds-black)] opacity-60">
              {isMastered ? "PAKKET VOLLEDIG GEMASTERD!" : "RONDE VOLTOOID!"}
            </span>
            <span className="text-7xl font-black mt-2 text-[var(--ds-black)]">+50</span>
            <span className="text-xs font-black uppercase tracking-widest text-[var(--ds-black)] opacity-60 mt-1">
              SPRAAKMAKER PUNTEN VERDIEND
            </span>
          </div>

          <div className="grid grid-cols-2 gap-[3px] flex-1">
            {/* Left Red Panel: pack details */}
            <div className="bg-[var(--ds-red)] p-6 flex flex-col justify-center items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-white)] opacity-70">PAKKET</span>
              <span className="text-4xl font-black text-[var(--ds-white)] mt-1">#{activePackIndex + 1}</span>
            </div>

            {/* Right Blue Panel: rounds completed */}
            <div className="bg-[var(--ds-blue)] p-6 flex flex-col justify-center items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-white)] opacity-70">HERHALING</span>
              <span className="text-4xl font-black text-[var(--ds-white)] mt-1">{rounds}/7</span>
            </div>
          </div>

          {/* Bottom CTA to return */}
          <div className="bg-[var(--ds-white)] p-4 border-t-[3px] border-[var(--ds-black)] flex flex-col gap-2">
            {isMastered ? (
              <p className="text-xs font-black text-center text-[var(--ds-green)] uppercase tracking-wider mb-2">
                ✓ Geweldig! Dit pakket is nu 7 keer herhaald en permanent opgeslagen.
              </p>
            ) : (
              <p className="text-xs font-bold text-center text-[var(--ds-black)] opacity-60 mb-2">
                Nog {7 - rounds} herhalingen te gaan voor volledige opslag in het langetermijngeheugen.
              </p>
            )}
            <button
              onClick={() => setGameMode("dashboard")}
              className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-5 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity border-none cursor-pointer"
            >
              TERUG NAAR DASHBOARD
            </button>
          </div>
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
        <div className="min-h-screen flex items-center justify-center bg-[var(--ds-white)]">
          <p className="text-sm font-bold uppercase tracking-widest opacity-40">Laden…</p>
        </div>
      }
    >
      <FlitsenGame />
    </Suspense>
  );
}
