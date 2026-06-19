"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress, useMoedertaal } from "@/lib/hooks";
import type { Sentence } from "@/lib/types";
import GameShell from "@/components/game/GameShell";
import ScoreBar from "@/components/game/ScoreBar";
import FeedbackToast from "@/components/game/FeedbackToast";
import { useSearchParams } from "next/navigation";
import { loadVerhaalZinnen } from "@/lib/gameData";
import LesContextChip from "@/components/game/LesContextChip";
import { OGE_RENKLERI } from "@/lib/zinsbouwTypes";
import HistoryPanel from "@/components/game/HistoryPanel";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface ZinsbouwComponent {
  type: string;
  correct: string;
}

interface TrPart {
  text: string;
  type: string;
}

interface ZinsbouwSentence {
  tr: string;
  nl: string;
  tr_parts: TrPart[];
  components: ZinsbouwComponent[];
}

interface PoolWord {
  id: string; // Unique ID to distinguish duplicate words in the pool
  word: string;
  type: string;
}

interface UserSlotState {
  type: string;
  correct: string;
  placedWord: PoolWord | null;
  status: "empty" | "correct" | "wrong" | "neutral";
}

// ─── Audio Helpers ────────────────────────────────────────────────────────────

function playErrorBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

function playSuccessBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

function playWinSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.3); // C6

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

function playLoseSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

function explainDifference(userAnswer: string, correctAnswer: string): string {
  const userWords = userAnswer.replace(/[.,!?;:]/g, "").split(/\s+/).filter(Boolean);
  const correctWords = correctAnswer.replace(/[.,!?;:]/g, "").split(/\s+/).filter(Boolean);

  const userSorted = [...userWords].map(w => w.toLowerCase()).sort().join(" ");
  const correctSorted = [...correctWords].map(w => w.toLowerCase()).sort().join(" ");

  if (userSorted === correctSorted) {
    return "Tüm kelimeler doğru, ancak sıralaması yanlış. Hollandaca zinsbouw kurallarına (özne + fiil + zaman + zarf + nesne sıralamasına) dikkat edin.";
  }

  const missing = correctWords.filter((w) => !userWords.some(uw => uw.toLowerCase() === w.toLowerCase()));
  if (missing.length > 0) {
    return `Eksik veya yanlış ögeler var. Bulunması gereken kelime(ler): ${missing.join(", ")}`;
  }

  const extra = userWords.filter((w) => !correctWords.some(cw => cw.toLowerCase() === w.toLowerCase()));
  if (extra.length > 0) {
    return `Fazla veya hatalı kelimeler yerleştirdiniz: ${extra.join(", ")}`;
  }

  for (let i = 0; i < Math.min(userWords.length, correctWords.length); i++) {
    if (userWords[i].toLowerCase() !== correctWords[i].toLowerCase()) {
      return `Hata ${i + 1}. yuvada başladı: "${userWords[i]}" yerine "${correctWords[i]}" bekleniyordu.`;
    }
  }

  return "Kelimelerin seçimi veya yuvalardaki sıralaması hatalı.";
}

// ─── Component ────────────────────────────────────────────────────────────────

function ZinsbouwerGame() {
  const { progress, updateProgress } = useProgress();
  const searchParams = useSearchParams();
  const bron = searchParams.get("bron");
  const les = searchParams.get("les");

  // Game data states
  const [sentences, setSentences] = useState<ZinsbouwSentence[]>([]);
  const [pools, setPools] = useState<Record<string, string[]>>({});
  const [sessionSentences, setSessionSentences] = useState<ZinsbouwSentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  // Flow states
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [points, setPoints] = useState(0);
  const [showPointsToast, setShowPointsToast] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // Active sentence interactive states
  const [slots, setSlots] = useState<UserSlotState[]>([]);
  const [wordPool, setWordPool] = useState<PoolWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<PoolWord | null>(null);

  // Feedback states
  const [attempts, setAttempts] = useState(0);
  const [feedbackState, setFeedbackState] = useState<"correct" | "wrong" | "failed" | null>(null);
  const [shakeSlotIndex, setShakeSlotIndex] = useState<number | null>(null);

  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [correctHistory, setCorrectHistory] = useState<{ nl: string; tr: string }[]>([]);
  const [wrongHistory, setWrongHistory] = useState<{ nl: string; tr: string; userAnswer?: string; explanation?: string }[]>([]);

  const slotsContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollLimits = () => {
    const el = slotsContainerRef.current;
    if (el) {
      const canScrollLeft = el.scrollLeft > 2;
      const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 5;
      setShowLeftArrow(canScrollLeft);
      setShowRightArrow(canScrollRight);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScrollLimits, 150);
    return () => clearTimeout(timer);
  }, [slots, currentSentenceIndex]);

  useEffect(() => {
    window.addEventListener("resize", checkScrollLimits);
    return () => window.removeEventListener("resize", checkScrollLimits);
  }, []);

  // 1. Initial Load
  useEffect(() => {
    setLoading(true);

    const loadPromise = (bron === "verhaal" && les)
      ? loadVerhaalZinnen([les])
      : fetch("/data/zin-motor.json").then((res) => res.json());

    loadPromise
      .then((data: any) => {
        let rawSentences: ZinsbouwSentence[] = [];
        let rawPools: Record<string, string[]> = {};

        if (bron === "verhaal" && les) {
          // If stories, load Story sentences. Since verhaal-zinnen.json might not have tr_parts/components,
          // we parse it on the fly or filter. But wait, Verhaal lessons might not have structured "components"!
          // Let's create fallback components if they are missing, mapping each word as 'onderwerp', 'werkwoord' etc.
          // Or let's use a standard template.
          // Wait! The prompt says: "public/data/zin-motor.json contains 20 sentences.
          // The story sentences may not have structured tr_parts/components, so if we load story sentences,
          // we should dynamically build standard components?
          // Let's check: "Oyun yalnızca public/data/zin-motor.json verisini kullanır. Seviyeye göre sentences-tc1/tc2 gibi düz cümle dosyalarını çekmek kaldırılır."
          // Wait! Prompt says: "7. sentences-tc1/tc2 gibi düz cümle dosyaları bu oyunda HİÇ yüklenmiyor; içerik yalnızca zin-motor.json'dan."
          // But wait, what if bron === "verhaal"?
          // In the compaction summary Adım 3: "zin-motor: verhaal modunda seviye gizlenir, kelime-bazlı slot filtresi (3-8 veya 3-10 toleranslı) ve LesContextChip eklendi."
          // But wait, the new prompt says: "Oyun yalnızca public/data/zin-motor.json verisini kullanır."
          // Ah! If we are in story mode (bron === "verhaal" && les === "les_X"), we should load the story sentences from `loadVerhaalZinnen([les])`.
          // If story sentences don't have components, we must build them dynamically or filter them!
          // Let's design a robust fallback parser that converts standard sentences (nl/tr) into components
          // using a simple heuristic if they lack components/tr_parts.
          // Let's check how many words are in story sentences: 3-8 words.
          // Let's write a parser that tokenizes the NL sentence and maps words to default slots (onderwerp, werkwoord, etc.)
          // so that the Zinsbouwer engine can still play them!
          
          const storyData = data as Sentence[];
          rawSentences = storyData.map((s) => {
            const nlWords = s.nl.replace(/[.,!?;:]/g, "").split(/\s+/).filter(Boolean);
            const trWords = s.tr.replace(/[.,!?;:]/g, "").split(/\s+/).filter(Boolean);

            // Simple heuristic to build components dynamically for story sentences
            const types = ["onderwerp", "werkwoord", "tijd", "bijwoord", "object", "scheidbaar"];
            const components = nlWords.map((word, idx) => ({
              type: types[Math.min(idx, types.length - 1)],
              correct: word,
            }));

            const tr_parts = trWords.map((word, idx) => ({
              text: word,
              type: types[Math.min(idx, types.length - 1)],
            }));

            return {
              tr: s.tr,
              nl: s.nl,
              tr_parts,
              components,
            };
          });

          // Fetch the main pools as fallback for distractors
          fetch("/data/zin-motor.json")
            .then((r) => r.json())
            .then((mainJson) => {
              setPools(mainJson.pools || {});
            })
            .catch(() => {});
        } else {
          // Normal mode: Load structured sentences and pools from public/data/zin-motor.json
          rawSentences = data.sentences || [];
          rawPools = data.pools || {};
          setPools(rawPools);
        }

        setSentences(rawSentences);

        // Shuffle and choose session sentences (max 10 for a tight, high-quality session)
        const shuffled = [...rawSentences].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);
        setSessionSentences(selected);

        setCurrentSentenceIndex(0);
        setPoints(0);
        setCorrectCount(0);
        setGameOver(false);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load sentence data in Zinsbouwer:", err);
        setLoading(false);
      });
  }, [bron, les]);

  // 2. Setup Current Sentence
  const currentSentence = sessionSentences[currentSentenceIndex];

  useEffect(() => {
    if (!currentSentence || loading) return;

    // Build empty slots matching sentence components
    const initialSlots: UserSlotState[] = currentSentence.components.map((comp) => ({
      type: comp.type,
      correct: comp.correct,
      placedWord: null,
      status: "neutral",
    }));
    setSlots(initialSlots);

    // Build Word Pool containing correct words + distractors
    const correctWords: PoolWord[] = currentSentence.components.map((comp, idx) => ({
      id: `correct-${idx}-${comp.correct}`,
      word: comp.correct,
      type: comp.type,
    }));

    const distractorWords: PoolWord[] = [];
    currentSentence.components.forEach((comp, idx) => {
      const typePool = pools[comp.type] || [];
      const cleanCorrect = comp.correct.replace(/[.,!?;:]/g, "").toLowerCase();

      // Find pool items not matching the correct word or existing distractors
      const eligible = typePool.filter(
        (w) =>
          w.toLowerCase() !== cleanCorrect &&
          !distractorWords.some((d) => d.word.toLowerCase() === w.toLowerCase())
      );

      // Take 1-2 random distractors for each slot type to keep it challenging but fair
      const count = 1;
      const chosen = [...eligible].sort(() => 0.5 - Math.random()).slice(0, count);

      chosen.forEach((dist, dIdx) => {
        distractorWords.push({
          id: `dist-${idx}-${dIdx}-${dist}`,
          word: dist,
          type: comp.type,
        });
      });
    });

    // Shuffle the combined pool of correct words + distractors
    const combinedPool = [...correctWords, ...distractorWords].sort(() => 0.5 - Math.random());
    setWordPool(combinedPool);

    setSelectedWord(null);
    setAttempts(0);
    setFeedbackState(null);
    setShakeSlotIndex(null);
  }, [currentSentenceIndex, sessionSentences, pools, loading]);

  // 3. User Actions

  // Clicking a word in the pool
  const handleSelectWord = (wordObj: PoolWord) => {
    if (feedbackState === "correct" || feedbackState === "failed") return;
    
    // Toggle selection
    if (selectedWord?.id === wordObj.id) {
      setSelectedWord(null);
    } else {
      setSelectedWord(wordObj);
    }
  };

  // Clicking a slot
  const handleSlotClick = (slotIdx: number) => {
    if (feedbackState === "correct" || feedbackState === "failed") return;

    const slot = slots[slotIdx];

    // Case A: Slot is occupied -> Return word to pool
    if (slot.placedWord) {
      const wordToReturn = slot.placedWord;
      setSlots((prev) =>
        prev.map((s, idx) =>
          idx === slotIdx ? { ...s, placedWord: null, status: "neutral" } : s
        )
      );
      setWordPool((prev) => [...prev, wordToReturn].sort(() => 0.5 - Math.random()));
      setSelectedWord(null);
      
      if (feedbackState === "wrong") {
        setFeedbackState(null);
      }
      return;
    }

    // Case B: Slot is empty and a word is selected -> Try to place it
    if (selectedWord) {
      // Rule: Category match check (Type constraints block wrong category placements immediately)
      if (selectedWord.type !== slot.type) {
        // Trigger shake & red flash feedback on wrong type placement attempt
        setShakeSlotIndex(slotIdx);
        playErrorBeep();
        setTimeout(() => setShakeSlotIndex(null), 500);
        return;
      }

      // Success category match -> Place word in slot
      const wordToPlace = selectedWord;
      setSlots((prev) =>
        prev.map((s, idx) =>
          idx === slotIdx ? { ...s, placedWord: wordToPlace, status: "neutral" } : s
        )
      );
      setWordPool((prev) => prev.filter((w) => w.id !== wordToPlace.id));
      setSelectedWord(null);
      playSuccessBeep();

      if (feedbackState === "wrong") {
        setFeedbackState(null);
      }
    }
  };

  // 4. Checking the Answer
  const checkAnswer = () => {
    if (feedbackState === "correct" || feedbackState === "failed") return;

    // Ensure all slots are filled
    const allFilled = slots.every((s) => s.placedWord !== null);
    if (!allFilled) return;

    // Check individual slots for correct values
    let sentenceIsCorrect = true;
    const checkedSlots = slots.map((s) => {
      const isWordCorrect = s.placedWord?.word === s.correct;
      if (!isWordCorrect) {
        sentenceIsCorrect = false;
      }
      return {
        ...s,
        status: (isWordCorrect ? "correct" : "wrong") as "correct" | "wrong",
      };
    });

    setSlots(checkedSlots);

    if (sentenceIsCorrect) {
      playWinSound();
      setFeedbackState("correct");
      setPoints((p) => p + 10);
      setCorrectCount((c) => c + 1);
      setShowPointsToast(true);
      setCorrectHistory((prev) => [{ nl: currentSentence.nl, tr: currentSentence.tr }, ...prev]);

      // Save highscore and statistics
      updateProgress((p) => {
        const currentScore = p.games.highScores.zinMotor || 0;
        const currentStats = p.games.stats?.zinMotor || {
          playCount: 0,
          correctCount: 0,
          wrongCount: 0,
          history: [],
        };
        const updatedHistory = [
          {
            sentence: currentSentence.nl,
            translation: currentSentence.tr,
            correct: true,
            timestamp: new Date().toISOString(),
          },
          ...currentStats.history,
        ].slice(0, 50);

        return {
          ...p,
          games: {
            ...p.games,
            totalPoints: p.games.totalPoints + 10,
            highScores: {
              ...p.games.highScores,
              zinMotor: Math.max(currentScore, points + 10),
            },
            stats: {
              ...p.games.stats,
              zinMotor: {
                playCount: currentStats.playCount + 1,
                correctCount: currentStats.correctCount + 1,
                wrongCount: currentStats.wrongCount,
                history: updatedHistory,
              },
            },
          },
        };
      });

      setTimeout(() => setShowPointsToast(false), 800);

      // Auto-advance after delay
      activeTimerRef.current = setTimeout(() => {
        advanceSentence();
      }, 3500);
    } else {
      playLoseSound();
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (nextAttempts >= 3) {
        setFeedbackState("failed");
        const userSentence = slots.map((s) => s.placedWord?.word || "").join(" ");
        const expl = explainDifference(userSentence, currentSentence.nl);
        setWrongHistory((prev) => [
          {
            nl: currentSentence.nl,
            tr: currentSentence.tr,
            userAnswer: userSentence,
            explanation: expl,
          },
          ...prev,
        ]);
        updateProgress((p) => {
          const currentStats = p.games.stats?.zinMotor || {
            playCount: 0,
            correctCount: 0,
            wrongCount: 0,
            history: [],
          };
          const updatedHistory = [
            {
              sentence: currentSentence.nl,
              translation: currentSentence.tr,
              correct: false,
              timestamp: new Date().toISOString(),
              userAnswer: userSentence,
              explanation: expl,
            },
            ...currentStats.history,
          ].slice(0, 50);

          return {
            ...p,
            games: {
              ...p.games,
              stats: {
                ...p.games.stats,
                zinMotor: {
                  playCount: currentStats.playCount + 1,
                  correctCount: currentStats.correctCount,
                  wrongCount: currentStats.wrongCount + 1,
                  history: updatedHistory,
                },
              },
            },
          };
        });
      } else {
        setFeedbackState("wrong");
      }
    }
  };

  const advanceSentence = () => {
    if (activeTimerRef.current) clearTimeout(activeTimerRef.current);

    if (currentSentenceIndex >= sessionSentences.length - 1) {
      setGameOver(true);
    } else {
      setCurrentSentenceIndex((prev) => prev + 1);
    }
  };

  const restartGame = () => {
    const shuffled = [...sentences].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    setSessionSentences(selected);
    setCurrentSentenceIndex(0);
    setPoints(0);
    setCorrectCount(0);
    setGameOver(false);
    setFeedbackState(null);
    setAttempts(0);
    setSelectedWord(null);
    setCorrectHistory([]);
    setWrongHistory([]);
  };

  // Drag and Drop Handlers
  const handleDragStartFromPool = (e: React.DragEvent, wordObj: PoolWord) => {
    if (feedbackState === "correct" || feedbackState === "failed") {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", `pool-${wordObj.id}`);
    setSelectedWord(wordObj);
  };

  const handleDragStartFromSlot = (e: React.DragEvent, slotIdx: number) => {
    if (feedbackState === "correct" || feedbackState === "failed") {
      e.preventDefault();
      return;
    }
    const slot = slots[slotIdx];
    if (slot && slot.placedWord) {
      e.dataTransfer.setData("text/plain", `slot-${slotIdx}-${slot.placedWord.id}`);
    }
  };

  const handleDropOnSlot = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    if (feedbackState === "correct" || feedbackState === "failed") return;

    const data = e.dataTransfer.getData("text/plain");
    const slot = slots[slotIdx];

    // Case A: Dropping a word from the pool into the slot
    if (data.startsWith("pool-")) {
      const wordId = data.replace("pool-", "");
      const wordToPlace = wordPool.find((w) => w.id === wordId);

      if (wordToPlace) {
        // Category check constraint
        if (wordToPlace.type !== slot.type) {
          setShakeSlotIndex(slotIdx);
          playErrorBeep();
          setTimeout(() => setShakeSlotIndex(null), 500);
          return;
        }

        // Return current placed word to pool if already occupied
        let updatedPool = wordPool.filter((w) => w.id !== wordToPlace.id);
        if (slot.placedWord) {
          updatedPool.push(slot.placedWord);
        }

        setSlots((prev) =>
          prev.map((s, sIdx) =>
            sIdx === slotIdx ? { ...s, placedWord: wordToPlace, status: "neutral" } : s
          )
        );
        setWordPool(updatedPool.sort(() => 0.5 - Math.random()));
        setSelectedWord(null);
        playSuccessBeep();

        if (feedbackState === "wrong") {
          setFeedbackState(null);
        }
      }
    }
    // Case B: Dropping a word from one slot to another slot
    else if (data.startsWith("slot-")) {
      const parts = data.split("-");
      const fromSlotIdx = parseInt(parts[1], 10);
      const fromSlot = slots[fromSlotIdx];

      if (fromSlot && fromSlot.placedWord && fromSlotIdx !== slotIdx) {
        const wordToPlace = fromSlot.placedWord;

        // Category check
        if (wordToPlace.type !== slot.type) {
          setShakeSlotIndex(slotIdx);
          playErrorBeep();
          setTimeout(() => setShakeSlotIndex(null), 500);
          return;
        }

        // Swapping or moving word
        const targetPlacedWord = slot.placedWord;

        setSlots((prev) =>
          prev.map((s, sIdx) => {
            if (sIdx === slotIdx) {
              return { ...s, placedWord: wordToPlace, status: "neutral" };
            }
            if (sIdx === fromSlotIdx) {
              return { ...s, placedWord: targetPlacedWord, status: "neutral" };
            }
            return s;
          })
        );
        playSuccessBeep();

        if (feedbackState === "wrong") {
          setFeedbackState(null);
        }
      }
    }
  };

  const handleDropOnPool = (e: React.DragEvent) => {
    e.preventDefault();
    if (feedbackState === "correct" || feedbackState === "failed") return;

    const data = e.dataTransfer.getData("text/plain");
    if (data.startsWith("slot-")) {
      const parts = data.split("-");
      const slotIdx = parseInt(parts[1], 10);
      const slot = slots[slotIdx];

      if (slot && slot.placedWord) {
        const wordToReturn = slot.placedWord;
        setSlots((prev) =>
          prev.map((s, sIdx) =>
            sIdx === slotIdx ? { ...s, placedWord: null, status: "neutral" } : s
          )
        );
        setWordPool((prev) => [...prev, wordToReturn].sort(() => 0.5 - Math.random()));
        setSelectedWord(null);

        if (feedbackState === "wrong") {
          setFeedbackState(null);
        }
      }
    }
  };

  if (loading || sessionSentences.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <p className="text-sm font-bold uppercase tracking-widest opacity-40 animate-pulse">
          Laden…
        </p>
      </div>
    );
  }

  // Render Game Over Screen
  if (gameOver) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-md text-center flex flex-col items-center gap-6">
          <span className="text-4xl">🏁</span>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-black text-[var(--text)] uppercase tracking-tight">
              SPEL AFGELOPEN!
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Je hebt de Zinsbouwer sessie succesvol afgerond!
            </p>
          </div>

          <div className="bg-[var(--accent-soft)] text-[var(--accent)] px-5 py-3.5 rounded-2xl w-full border border-[var(--accent)]/10 flex flex-col items-center">
            <span className="text-[9px] font-black tracking-wider uppercase opacity-85">TOTALE SCORE</span>
            <span className="text-3xl font-extrabold mt-0.5">+{points}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <div className="bg-[var(--surface-2)] p-3 rounded-xl flex flex-col items-center">
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">CORRECT</span>
              <span className="text-base font-black text-[var(--text)] mt-0.5">
                {correctCount} / {sessionSentences.length}
              </span>
            </div>
            <div className="bg-[var(--surface-2)] p-3 rounded-xl flex flex-col items-center">
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">HIGHSCORE</span>
              <span className="text-base font-black text-[var(--text)] mt-0.5">
                {progress.games.highScores.zinMotor || 0}
              </span>
            </div>
          </div>

          <button
            onClick={restartGame}
            className="w-full bg-[var(--primary)] text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
          >
            OPNIEUW SPELEN
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameShell title="Zinsbouwer" icon="🧩">
      <LesContextChip />

      <ScoreBar
        items={[
          {
            label: "ZIN",
            value: `${currentSentenceIndex + 1} / ${sessionSentences.length}`,
            tone: "accent",
          },
          { label: "PUNTEN", value: points, tone: "success" },
          { label: "HIGHSCORE", value: progress.games.highScores.zinMotor || 0, tone: "muted" },
        ]}
      />

      {/* 1. Türkçe Hedef Cümle Kartı */}
      <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs flex flex-col gap-2.5 mb-4 select-none">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          BOUW DEZE ZIN
        </span>
        <div className="flex flex-wrap gap-2 items-center">
          {currentSentence.tr_parts.map((part, idx) => {
            const oge = OGE_RENKLERI[part.type] || OGE_RENKLERI.onderwerp;
            return (
              <span
                key={idx}
                style={{
                  backgroundColor: oge.soft,
                  color: oge.text,
                  border: `1px solid ${oge.border}25`,
                }}
                className="px-2.5 py-1 text-xs font-bold rounded-lg leading-none"
                title={`${oge.nl} (${oge.tr})`}
              >
                {part.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* 2. Yuva Şeridi (Slots Strip) */}
      <div className="w-full relative mb-4">
        {showLeftArrow && (
          <button
            onClick={() => {
              slotsContainerRef.current?.scrollBy({ left: -130, behavior: "smooth" });
            }}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-md flex items-center justify-center font-bold text-xs text-[var(--text)] hover:bg-[var(--surface-2)] active:scale-95 transition-all select-none"
          >
            ◀
          </button>
        )}
        {showRightArrow && (
          <button
            onClick={() => {
              slotsContainerRef.current?.scrollBy({ left: 130, behavior: "smooth" });
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-md flex items-center justify-center font-bold text-xs text-[var(--text)] hover:bg-[var(--surface-2)] active:scale-95 transition-all select-none"
          >
            ▶
          </button>
        )}
        <div
          ref={slotsContainerRef}
          onScroll={checkScrollLimits}
          className="w-full overflow-x-auto pb-2 scrollbar-none"
        >
          <div className="flex gap-3 min-w-max px-2">
          {slots.map((slot, idx) => {
            const oge = OGE_RENKLERI[slot.type] || OGE_RENKLERI.onderwerp;
            const isShaking = shakeSlotIndex === idx;

            let borderStyle = "border-dashed border-[var(--border)]";
            let slotBg = "bg-[var(--surface-2)]/30 hover:bg-[var(--surface-2)]/60";

            if (slot.status === "correct") {
              borderStyle = "border-[var(--success)]";
              slotBg = "bg-[var(--success-soft)]/20";
            } else if (slot.status === "wrong") {
              borderStyle = "border-[var(--danger)] animate-shake";
              slotBg = "bg-[var(--danger-soft)]/20";
            } else if (slot.placedWord) {
              borderStyle = `border-[2px]`;
              slotBg = "bg-[var(--surface)]";
            }

            return (
              <motion.div
                key={idx}
                animate={isShaking ? { x: [-8, 8, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                onClick={() => handleSlotClick(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnSlot(e, idx)}
                style={{
                  borderColor: slot.placedWord && slot.status === "neutral" ? oge.bg : undefined,
                }}
                className={`w-[120px] shrink-0 border-[2px] rounded-2xl overflow-hidden shadow-xs cursor-pointer select-none transition-all duration-200 ${borderStyle} ${slotBg}`}
              >
                {/* Header label area */}
                <div
                  style={{ backgroundColor: isShaking ? "var(--danger)" : oge.bg }}
                  className="w-full py-1 text-[9px] font-black uppercase text-white tracking-wider text-center"
                >
                  {oge.nl}
                </div>

                {/* Slot body area */}
                <div
                  draggable={slot.placedWord !== null}
                  onDragStart={(e) => handleDragStartFromSlot(e, idx)}
                  className="h-16 flex flex-col items-center justify-center px-2 text-center relative"
                >
                  {slot.placedWord ? (
                    <span
                      style={{ color: slot.status === "neutral" ? oge.text : undefined }}
                      className={`text-sm font-extrabold break-all ${
                        slot.status === "correct"
                          ? "text-[var(--success)]"
                          : slot.status === "wrong"
                          ? "text-[var(--danger)]"
                          : ""
                      }`}
                    >
                      {slot.placedWord.word}
                    </span>
                  ) : (
                    <span className="text-lg opacity-25 font-bold">＿</span>
                  )}

                  {/* Subtext translated info label */}
                  <span className="absolute bottom-1 text-[8px] opacity-40 font-bold uppercase tracking-wider">
                    {oge.tr}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>

      {/* 3. Karışık Kelime Havuzu Kartı */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDropOnPool(e)}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs flex flex-col gap-3 mb-6 select-none"
      >
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            WOORDEN — plaats in het juiste vak
          </span>
          {feedbackState === "wrong" && (
            <span className="text-[10px] font-bold text-[var(--danger)] bg-red-100 dark:bg-red-950/40 px-2.5 py-0.5 rounded-full shrink-0">
              Poging {attempts}/3
            </span>
          )}
        </div>

        {wordPool.length === 0 && !slots.every((s) => s.placedWord !== null) ? (
          <p className="text-xs text-[var(--text-muted)] italic text-center py-4">
            Tüm kelimeler yerleştirildi.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5 justify-center py-1">
            {wordPool.map((wordObj) => {
              const oge = OGE_RENKLERI[wordObj.type] || OGE_RENKLERI.onderwerp;
              const isSelected = selectedWord?.id === wordObj.id;

              return (
                <button
                  key={wordObj.id}
                  draggable
                  onDragStart={(e) => handleDragStartFromPool(e, wordObj)}
                  onClick={() => handleSelectWord(wordObj)}
                  style={{
                    backgroundColor: isSelected ? oge.bg : oge.soft,
                    color: isSelected ? "white" : oge.text,
                    borderColor: oge.bg,
                  }}
                  className={`px-3.5 py-2.5 text-xs font-extrabold rounded-xl border transition-all active:scale-95 cursor-pointer shadow-xs select-none ${
                    isSelected ? "ring-2 ring-offset-2 ring-[var(--accent)]" : "hover:brightness-95"
                  }`}
                >
                  {wordObj.word}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Kontrol / Sonraki Cümle Butonu (Inline) */}
      <div className="w-full mb-4 shrink-0">
        {feedbackState === "failed" || feedbackState === "correct" ? (
          <button
            onClick={advanceSentence}
            className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
          >
            VOLGENDE ZIN →
          </button>
        ) : (
          <button
            onClick={checkAnswer}
            disabled={!slots.every((s) => s.placedWord !== null)}
            className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none disabled:opacity-40 disabled:pointer-events-none"
          >
            CONTROLEER
          </button>
        )}
      </div>

      {/* 4. Points float indicator */}
      <AnimatePresence>
        {showPointsToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.7 }}
            animate={{ opacity: 1, y: -90, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 text-[var(--success)] font-black text-6xl select-none"
          >
            +10
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Cümle Analiz Kartı (Geri Bildirim) */}
      <AnimatePresence>
        {(feedbackState === "wrong" || feedbackState === "failed") && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full border border-[var(--danger)] bg-[var(--danger-soft)]/20 rounded-2xl p-4 flex flex-col gap-3 mb-4 text-xs select-none shrink-0"
          >
            <div className="flex items-center justify-between text-[10px] font-black text-[var(--danger)]">
              <span>ONJUISTE CEVAP ✗</span>
              {feedbackState === "wrong" && (
                <span className="bg-red-100 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                  Poging {attempts}/3
                </span>
              )}
            </div>
            <div>
              <span className="font-bold text-[var(--text-muted)] block mb-1">Correcte zin:</span>
              <p className="font-bold text-sm text-[var(--text)]">{currentSentence.nl}</p>
            </div>
            <div className="mt-1 pt-2 border-t border-[var(--danger)]/15">
              <span className="font-bold text-[var(--text-muted)] block mb-1">Cevabınız:</span>
              <p className="line-through text-[var(--danger)] font-bold text-sm">
                {slots.map((s) => s.placedWord?.word || "＿").join(" ")}
              </p>
            </div>
            <div className="mt-1.5 p-2 bg-red-100/40 dark:bg-red-950/20 rounded-lg text-[var(--text)] border border-[var(--danger)]/10">
              <span className="font-bold text-[var(--danger)] block mb-0.5">💡 Grammaticale uitleg:</span>
              <p className="font-medium text-[11px] leading-relaxed text-[var(--text)]">
                {explainDifference(
                  slots.map((s) => s.placedWord?.word || "").join(" "),
                  currentSentence.nl
                )}
              </p>
            </div>
          </motion.div>
        )}

        {feedbackState === "correct" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full border border-[var(--success)] bg-[var(--success-soft)]/20 rounded-2xl p-4 flex flex-col gap-2.5 mb-4 text-xs select-none shrink-0"
          >
            <div className="text-[10px] font-black text-[var(--success)]">
              CORRECT ✓
            </div>
            <p className="font-bold text-sm text-[var(--text)]">{currentSentence.nl}</p>
            <p className="text-[var(--text-muted)] italic">{currentSentence.tr}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Geçmiş / Akordeon Panel */}
      <HistoryPanel correct={correctHistory} wrong={wrongHistory} />

      <FeedbackToast
        state={feedbackState === "failed" ? "wrong" : feedbackState}
        message={feedbackState === "correct" ? "Goed!" : "Fout!"}
      />
    </GameShell>
  );
}

export default function ZinsbouwerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <p className="text-sm font-bold uppercase tracking-widest opacity-40 animate-pulse">
            Laden…
          </p>
        </div>
      }
    >
      <ZinsbouwerGame />
    </Suspense>
  );
}
