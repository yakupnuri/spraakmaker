"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress, useMoedertaal } from "@/lib/hooks";

interface SentenceComponent {
  type: string;
  correct: string;
}

interface Sentence {
  tr: string;
  nl: string;
  components: SentenceComponent[];
}

interface GameData {
  sentences: Sentence[];
  pools: Record<string, string[]>;
  feedback_phrases: string[];
}

interface SlotState {
  label: string;
  type: string;
  words: Array<{ nl: string; tr: string }>;
  correctWord: string;
  selectedIndex: number;
}

interface DrumSelectorProps {
  label: string;
  words: Array<{ nl: string; tr: string }>;
  selectedIndex: number;
  onChange: (index: number) => void;
  disabled?: boolean;
  activeBgClass: string;
  activeTextClass: string;
  isCorrect?: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getSlotLabel(type: string): string {
  switch (type) {
    case "onderwerp":
      return "Onderwerp";
    case "werkwoord":
      return "Persoonsvorm";
    case "tijd":
      return "Tijd";
    case "bijwoord":
      return "Bijwoord";
    case "object":
      return "Object/Plaats";
    case "scheidbaar":
      return "Deelwoord";
    default:
      return "Deel";
  }
}

function DrumSelector({
  label,
  words,
  selectedIndex,
  onChange,
  disabled,
  activeBgClass,
  activeTextClass,
  isCorrect,
}: DrumSelectorProps) {
  const touchStartY = useRef<number>(0);
  const lastWheelTime = useRef<number>(0);

  const handlePrev = () => {
    if (disabled) return;
    onChange((selectedIndex - 1 + words.length) % words.length);
  };

  const handleNext = () => {
    if (disabled) return;
    onChange((selectedIndex + 1) % words.length);
  };

  const handleClick = () => {
    handleNext();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    const now = Date.now();
    if (now - lastWheelTime.current < 150) return;
    lastWheelTime.current = now;

    if (e.deltaY > 0) {
      handleNext();
    } else if (e.deltaY < 0) {
      handlePrev();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
  };

  const prevIndex = (selectedIndex - 1 + words.length) % words.length;
  const nextIndex = (selectedIndex + 1) % words.length;

  const prevItem = words[prevIndex];
  const activeItem = words[selectedIndex];
  const nextItem = words[nextIndex];

  if (!activeItem) return null;

  return (
    <div className="flex-1 flex flex-col items-center min-w-0">
      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-black)] opacity-60 mb-2 truncate w-full text-center">
        {label}
      </span>

      <div
        onClick={handleClick}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-full h-[140px] md:h-[200px] border-[3px] border-[var(--ds-black)] bg-[var(--ds-white)] relative overflow-hidden flex flex-col justify-between py-2 cursor-pointer select-none transition-colors"
      >
        {/* Top Fade overlay */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[var(--ds-white)] to-transparent pointer-events-none z-10 opacity-80" />

        {/* Previous Item */}
        <div className="h-[30px] md:h-[40px] flex items-center justify-center opacity-25 scale-90 transition-all duration-200 overflow-hidden text-center px-1">
          <span className="text-[10px] md:text-sm font-bold text-[var(--ds-black)] truncate w-full">{prevItem?.nl}</span>
        </div>

        {/* Active Item */}
        <motion.div
          animate={isCorrect ? {
            backgroundColor: "var(--ds-green)",
            color: "var(--ds-white)",
            borderColor: "var(--ds-black)",
          } : {}}
          className={`h-[50px] md:h-[60px] flex flex-col items-center justify-center border-y-[3px] border-[var(--ds-black)] transition-all duration-200 text-center px-1 w-full z-0 ${
            isCorrect ? "bg-[var(--ds-green)] text-[var(--ds-white)]" : `${activeBgClass} ${activeTextClass}`
          }`}
        >
          <span className="text-xs md:text-base font-black truncate w-full">{activeItem.nl}</span>
        </motion.div>

        {/* Next Item */}
        <div className="h-[30px] md:h-[40px] flex items-center justify-center opacity-25 scale-90 transition-all duration-200 overflow-hidden text-center px-1">
          <span className="text-[10px] md:text-sm font-bold text-[var(--ds-black)] truncate w-full">{nextItem?.nl}</span>
        </div>

        {/* Bottom Fade overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--ds-white)] to-transparent pointer-events-none z-10 opacity-80" />
      </div>
    </div>
  );
}

const ZIN_MOTOR_EXPLANATIONS: Record<string, string> = {
  tr: "Fiil (yüklem) özneye uymuyor veya cümle yapısı yanlış.",
  en: "The finite verb does not match the subject or the sentence structure is incorrect.",
  ar: "الفعل المصرف لا يتطابق مع الفاعل أو تركيب الجملة غير صحيح.",
  uk: "Особова форма дієслова не узгоджується з підметом або структура речення невірна.",
  fa: "فعل با نهاد مطابقت ندارد یا ساختار جمله نادرست است.",
  pl: "Forma osobowa czasownika nie pasuje do podmiotu lub struktura zdania jest niepoprawna.",
  es: "El verbo conjugado no concuerda con el sujeto o la estructura de la oración es incorrecta.",
  fr: "Le verbe conjugué ne s'accorde pas avec le sujet ou la structure de la phrase est incorrecte.",
  so: "Falka la leexiyay kuma habboona maadada ama dhismaha weedhu waa khalad.",
};

function ZinMotorGame() {
  const { progress, updateProgress } = useProgress();
  const { moedertaal } = useMoedertaal();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GameData | null>(null);
  
  // Game session states
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [sessionSentences, setSessionSentences] = useState<Sentence[]>([]);
  const [correctSentences, setCorrectSentences] = useState<Array<{ tr: string; nl: string }>>([]);
  
  // Dynamic slot states
  const [slots, setSlots] = useState<SlotState[]>([]);
  
  // Feedback states
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [showPoints, setShowPoints] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Setup a sentence with dynamic slots
  const setupSentence = (sentence: Sentence, pools: Record<string, string[]>) => {
    if (!sentence) return;

    const newSlots: SlotState[] = sentence.components.map((comp) => {
      const correctWord = comp.correct;
      const type = comp.type;

      // Filter alternatives from the pool
      const pool = pools[type] || [];
      const alternatives = pool.filter((w) => w !== correctWord);

      // Select 4 random alternatives
      const selectedAlts = shuffleArray(alternatives).slice(0, 4);

      // Combine and shuffle correct word and alternatives
      const finalWords = shuffleArray([correctWord, ...selectedAlts]).map((w) => ({
        nl: w,
        tr: "",
      }));

      // Find initial index (must not be the correct word index to avoid auto-correct starting)
      let initialIdx = Math.floor(Math.random() * finalWords.length);
      const correctIdx = finalWords.findIndex((fw) => fw.nl === correctWord);

      // If by chance it is correct, shift it
      if (initialIdx === correctIdx) {
        initialIdx = (initialIdx + 1) % finalWords.length;
      }

      return {
        label: getSlotLabel(type),
        type: type,
        words: finalWords,
        correctWord: correctWord,
        selectedIndex: initialIdx,
      };
    });

    setSlots(newSlots);
    setFeedback(null);
  };

  useEffect(() => {
    fetch("/data/zin-motor.json")
      .then((r) => r.json())
      .then((jsonData: GameData) => {
        setData(jsonData);
        
        // Select 20 random sentences for this session (or all if less than 20)
        const shuffled = shuffleArray(jsonData.sentences);
        const selected = shuffled.slice(0, 20);
        setSessionSentences(selected);
        
        // Setup the first sentence
        if (selected.length > 0) {
          setupSentence(selected[0], jsonData.pools);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Zin Motor verisi yüklenirken hata oluştu:", err);
      });
  }, []);

  const handleSlotChange = (slotIndex: number, newSelectedIndex: number) => {
    setSlots((prevSlots) =>
      prevSlots.map((slot, idx) =>
        idx === slotIndex ? { ...slot, selectedIndex: newSelectedIndex } : slot
      )
    );
  };

  const checkAnswer = () => {
    if (!data || slots.length === 0 || feedback || gameOver) return;

    const isCorrect = slots.every(
      (slot) => slot.words[slot.selectedIndex].nl === slot.correctWord
    );

    if (isCorrect) {
      setFeedback("correct");
      setShowPoints(true);
      setPoints((prev) => prev + 10);
      
      setCorrectSentences((prev) => [
        ...prev,
        { tr: currentSentence.tr, nl: currentSentence.nl },
      ]);

      const phrases = data.feedback_phrases || ["Goed bezig!"];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setFeedbackText(randomPhrase);

      // Save highscore and update progress with stats
      updateProgress((p) => {
        const currentHighScore = p.games.highScores.zinMotor || 0;
        const newScore = points + 10;
        const currentStats = p.games.stats?.zinMotor || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
        
        const updatedHistory = [
          {
            sentence: currentSentence.nl,
            translation: currentSentence.tr,
            correct: true,
            timestamp: new Date().toISOString()
          },
          ...currentStats.history
        ].slice(0, 50);

        return {
          ...p,
          games: {
            ...p.games,
            totalPoints: p.games.totalPoints + 10,
            highScores: {
              ...p.games.highScores,
              zinMotor: Math.max(currentHighScore, newScore),
            },
            lastPlayDate: new Date().toISOString(),
            stats: {
              ...p.games.stats,
              zinMotor: {
                playCount: currentStats.playCount + 1,
                correctCount: currentStats.correctCount + 1,
                wrongCount: currentStats.wrongCount,
                history: updatedHistory
              }
            }
          },
        };
      });

      setTimeout(() => {
        const nextIndex = currentSentenceIndex + 1;
        if (nextIndex >= sessionSentences.length) {
          setGameOver(true);
        } else {
          setCurrentSentenceIndex(nextIndex);
          setupSentence(sessionSentences[nextIndex], data.pools);
        }
        setShowPoints(false);
      }, 1200);
    } else {
      setFeedback("wrong");

      // Save wrong answer stats
      updateProgress((p) => {
        const currentStats = p.games.stats?.zinMotor || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
        const currentNlSentence = slots.map((s) => s.words[s.selectedIndex].nl).join(" ");
        const targetNlSentence = slots.map((s) => s.correctWord).join(" ");

        const updatedHistory = [
          {
            sentence: targetNlSentence,
            translation: currentSentence.tr,
            correct: false,
            timestamp: new Date().toISOString(),
            userAnswer: currentNlSentence,
            explanation: ZIN_MOTOR_EXPLANATIONS[moedertaal] || ZIN_MOTOR_EXPLANATIONS["en"]
          },
          ...currentStats.history
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
                history: updatedHistory
              }
            }
          },
        };
      });

      setTimeout(() => {
        setFeedback(null);
      }, 500);
    }
  };

  const restartGame = () => {
    if (!data) return;
    setLoading(true);
    setGameOver(false);
    setPoints(0);
    setCurrentSentenceIndex(0);
    setCorrectSentences([]);
    
    const shuffled = shuffleArray(data.sentences);
    const selected = shuffled.slice(0, 20);
    setSessionSentences(selected);
    
    if (selected.length > 0) {
      setupSentence(selected[0], data.pools);
    }
    setLoading(false);
  };

  if (loading || sessionSentences.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ds-white)]">
        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Laden…</p>
      </div>
    );
  }

  const currentSentence = sessionSentences[currentSentenceIndex];

  // Game Colors for Slots in De Stijl
  const slotColorClasses = [
    { bg: "bg-[var(--ds-red)]", text: "text-[var(--ds-white)]" },
    { bg: "bg-[var(--ds-blue)]", text: "text-[var(--ds-white)]" },
    { bg: "bg-[var(--ds-yellow)]", text: "text-[var(--ds-black)]" },
    { bg: "bg-[var(--ds-white)]", text: "text-[var(--ds-black)]" },
    { bg: "bg-[var(--ds-black)]", text: "text-[var(--ds-white)]" },
    { bg: "bg-[var(--ds-gray)]", text: "text-[var(--ds-black)]" },
  ];

  if (gameOver) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--ds-white)] select-none">
        {/* Header */}
        <div className="bg-[var(--ds-black)] px-5 py-4">
          <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">zin motor</span>
        </div>

        {/* Results layout in Mondrian blocks */}
        <div className="p-[3px] bg-[var(--ds-black)] flex-1 flex flex-col">
          {/* Top Yellow Panel: Total Score */}
          <div className="bg-[var(--ds-yellow)] p-8 flex flex-col justify-center items-center flex-1 border-b-[3px] border-[var(--ds-black)]">
            <span className="text-sm font-black uppercase tracking-widest text-[var(--ds-black)] opacity-60">GAME OVER!</span>
            <span className="text-7xl font-black mt-2 text-[var(--ds-black)]">{points}</span>
            <span className="text-xs font-black uppercase tracking-widest text-[var(--ds-black)] opacity-60 mt-1">TOTALE SCORE</span>
          </div>

          <div className="grid grid-cols-2 gap-[3px] flex-1">
            {/* Left Red Panel: Completed sentences */}
            <div className="bg-[var(--ds-red)] p-6 flex flex-col justify-center items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-white)] opacity-70">ZINNEN GESPEELD</span>
              <span className="text-4xl font-black text-[var(--ds-white)] mt-1">{sessionSentences.length}</span>
            </div>

            {/* Right Blue Panel: High Score */}
            <div className="bg-[var(--ds-blue)] p-6 flex flex-col justify-center items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-white)] opacity-70">HIGHSCORE</span>
              <span className="text-4xl font-black text-[var(--ds-white)] mt-1">
                {Math.max(progress.games.highScores.zinMotor || 0, points)}
              </span>
            </div>
          </div>

          {/* Bottom Play Again Button */}
          <div className="bg-[var(--ds-white)] p-4 border-t-[3px] border-[var(--ds-black)]">
            <button
              onClick={restartGame}
              className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-5 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity border-none cursor-pointer"
            >
              OPNIEUW SPELEN
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCorrect = feedback === "correct";
  const isWrong = feedback === "wrong";

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)] select-none">
      {/* Header — bg-ds-black */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">zin motor</span>
        <span className="text-sm font-bold text-[var(--ds-yellow)]">{points} pts</span>
      </div>

      {/* Üst Bilgi Barı */}
      <div className="bg-[var(--ds-yellow)] border-b-[3px] border-[var(--ds-black)] py-3 px-5 flex items-center justify-between font-black text-sm">
        <span className="text-[var(--ds-black)]">
          Zin: {currentSentenceIndex + 1} / {sessionSentences.length}
        </span>
        <span className="text-[var(--ds-black)] opacity-60">
          Score: {points} Punten
        </span>
      </div>

      {/* Türkçe Cümle Sorusu */}
      <div className="bg-[var(--ds-red)] border-b-[3px] border-[var(--ds-black)] px-5 py-6 text-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-white)] opacity-70 block mb-2">
          BOUW DE NEDERLANDSE ZIN:
        </span>
        <h1 className="text-lg md:text-2xl font-black text-[var(--ds-white)]">
          "{currentSentence.tr}"
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-5xl w-full mx-auto relative">
        {/* Flying +10 point animation */}
        <AnimatePresence>
          {showPoints && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.6 }}
              animate={{ opacity: 1, y: -120, scale: 1.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 text-[var(--ds-yellow)] font-black text-7xl select-none"
              style={{
                textShadow: "4px 4px 0px var(--ds-black)",
                WebkitTextStroke: "2px var(--ds-black)",
              }}
            >
              +10
            </motion.div>
          )}
        </AnimatePresence>

        {/* Motivating phrases on correct */}
        <AnimatePresence>
          {isCorrect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 bg-[var(--ds-green)] text-[var(--ds-white)] border-[3px] border-[var(--ds-black)] px-5 py-2 font-black text-sm uppercase tracking-widest z-30"
            >
              {feedbackText}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dinamik Çark Alanı */}
        <motion.div
          animate={isWrong ? { x: [-12, 12, -12, 12, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`w-full border-[3px] p-3 md:p-5 flex gap-1.5 md:gap-3 transition-colors duration-200 bg-[var(--ds-white)] ${
            isCorrect ? "border-[var(--ds-green)] bg-green-50/5" : "border-[var(--ds-black)]"
          }`}
        >
          {slots.map((slot, index) => {
            const colorClass = slotColorClasses[index % slotColorClasses.length];
            return (
              <DrumSelector
                key={`${currentSentenceIndex}-${index}`}
                label={slot.label}
                words={slot.words}
                selectedIndex={slot.selectedIndex}
                onChange={(newIdx) => handleSlotChange(index, newIdx)}
                disabled={!!feedback}
                activeBgClass={colorClass.bg}
                activeTextClass={colorClass.text}
                isCorrect={isCorrect}
              />
            );
          })}
        </motion.div>

        {/* Yönlendirme Notu */}
        <p className="mt-4 text-[10px] md:text-xs text-[var(--ds-black)] opacity-50 uppercase font-black tracking-widest text-center">
          Scroll, klik of gebruik het muiswiel om de wielen te draaien
        </p>

        {/* Doğru Kurulan Cümleler Kartı (Mondrian/De Stijl stili) */}
        <div className="w-full mt-6 border-[3px] border-[var(--ds-black)] bg-[var(--ds-white)] p-4 flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-black)] opacity-60 mb-3 block">
            Correct gebouwde zinnen ({correctSentences.length})
          </span>
          {correctSentences.length === 0 ? (
            <p className="text-xs text-[var(--ds-black)] opacity-40 italic py-2 text-center">
              Nog geen correcte zin gebouwd. Draai aan de wielen en controleer!
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
              {correctSentences.map((sentence, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 border-b-[2px] border-[var(--ds-gray)] pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="w-4 h-4 bg-[var(--ds-green)] flex items-center justify-center text-[var(--ds-white)] text-[9px] font-bold mt-0.5 select-none">
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-black text-[var(--ds-black)] truncate">
                      {sentence.nl}
                    </p>
                    <p className="text-[10px] md:text-xs text-[var(--ds-black)] opacity-60 truncate">
                      {sentence.tr}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kontrol Et Butonu */}
      <div className="border-t-[3px] border-[var(--ds-black)]">
        <button
          onClick={checkAnswer}
          disabled={!!feedback}
          className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-5 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-40"
        >
          {isCorrect ? "GEWELDIG!" : isWrong ? "PROBEER OPNIEUW!" : "CONTROLEER"}
        </button>
      </div>

      {/* Alt Bilgi Bandı */}
      <div className="flex border-t-[3px] border-[var(--ds-black)] text-center">
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-white)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-lg font-black text-[var(--ds-black)]">
            {progress.games.highScores.zinMotor || 0}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-60">HIGHSCORE</span>
        </div>
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-blue)]">
          <span className="text-lg font-black text-[var(--ds-white)]">20</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">TOTAAL AANTAL ZINNEN</span>
        </div>
      </div>
    </div>
  );
}

export default function ZinMotorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--ds-white)]">
          <p className="text-sm font-bold uppercase tracking-widest opacity-40">Laden…</p>
        </div>
      }
    >
      <ZinMotorGame />
    </Suspense>
  );
}
