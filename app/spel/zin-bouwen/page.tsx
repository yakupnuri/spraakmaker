"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { loadSentences, shuffle, pickRandom, loadVerhaalZinnen } from "@/lib/gameData";
import { useMoedertaal, useProgress } from "@/lib/hooks";
import type { Sentence } from "@/lib/types";
import GameShell from "@/components/game/GameShell";
import ScoreBar from "@/components/game/ScoreBar";
import FeedbackToast from "@/components/game/FeedbackToast";
import HistoryPanel from "@/components/game/HistoryPanel";
import LesContextChip from "@/components/game/LesContextChip";

interface SortableWordProps {
  id: string;
  word: string;
  onClick: () => void;
}

function SortableWord({ id, word, onClick }: SortableWordProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="px-3 py-1.5 bg-[var(--primary)] text-white font-bold text-xs rounded-full select-none flex items-center gap-1.5 shadow-sm border border-transparent"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-xs opacity-50 px-1 hover:opacity-100 touch-none select-none"
      >
        ⋮⋮
      </span>
      <span className="cursor-pointer active:scale-95" onClick={onClick}>{word}</span>
    </div>
  );
}

const ZIN_BOUWEN_EXPLANATIONS: Record<string, {
  wordOrder: string;
  missing: string;
  extra: string;
  errorStart: string;
  defaultError: string;
}> = {
  tr: {
    wordOrder: "Tüm kelimeler doğru, ancak sıralaması yanlış. Hollandaca'da fiil pozisyonuna (ikinci sırada veya sonda olmasına) dikkat edin.",
    missing: "Eksik kelimeler: ",
    extra: "Fazla veya yanlış kelimeler: ",
    errorStart: "Hata {index}. kelimede başladı: \"{user}\" yerine \"{correct}\" olmalıydı.",
    defaultError: "Kelimelerin seçimi veya sıralaması hatalı.",
  },
  en: {
    wordOrder: "All words are correct, but the order is wrong. In Dutch, pay attention to the verb position (second position or at the end).",
    missing: "Missing words: ",
    extra: "Extra or incorrect words: ",
    errorStart: "Error started at word {index}: expected \"{correct}\" instead of \"{user}\".",
    defaultError: "Word choice or word order is incorrect.",
  }
};

function explainDifference(userAnswer: string, correctAnswer: string, lang: string): string {
  const userWords = userAnswer.split(" ");
  const correctWords = correctAnswer.split(" ");
  const expl = ZIN_BOUWEN_EXPLANATIONS[lang] || ZIN_BOUWEN_EXPLANATIONS["en"];

  const userSorted = [...userWords].sort().join(" ").toLowerCase();
  const correctSorted = [...correctWords].sort().join(" ").toLowerCase();

  if (userSorted === correctSorted) {
    return expl.wordOrder;
  }

  const missing = correctWords.filter((w) => !userWords.includes(w));
  const extra = userWords.filter((w) => !correctWords.includes(w));

  let explanation = "";
  if (missing.length > 0) {
    explanation += `${expl.missing}"${missing.join(", ")}". `;
  }
  if (extra.length > 0) {
    explanation += `${expl.extra}"${extra.join(", ")}". `;
  }

  for (let i = 0; i < Math.min(userWords.length, correctWords.length); i++) {
    if (userWords[i].toLowerCase() !== correctWords[i].toLowerCase()) {
      explanation += expl.errorStart
        .replace("{index}", String(i + 1))
        .replace("{user}", userWords[i])
        .replace("{correct}", correctWords[i]);
      break;
    }
  }

  return explanation || expl.defaultError;
}

function ZinBouwenGame() {
  const searchParams = useSearchParams();
  const lesId = searchParams.get("les");
  const bron = searchParams.get("bron");
  const { moedertaal } = useMoedertaal();
  const { progress, updateProgress } = useProgress();

  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [current, setCurrent] = useState<Sentence | null>(null);
  const [wordIds, setWordIds] = useState<string[]>([]);
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [scores, setScores] = useState({ goed: 0, fout: 0, combo: 1, score: 0 });
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);

  const [correctHistory, setCorrectHistory] = useState<Array<{ tr: string; nl: string }>>([]);
  const [wrongHistory, setWrongHistory] = useState<Array<{ tr: string; nl: string; userAnswer: string; explanation: string }>>([]);

  const [isAdvanced, setIsAdvanced] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  useEffect(() => {
    const level = localStorage.getItem("spraakmaker-niveau");
    if (level === "B1" || level === "B2") {
      setIsAdvanced(true);
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  async function init() {
    setLoading(true);
    setCorrectHistory([]);
    setWrongHistory([]);
    const data = (bron === "verhaal" && lesId)
      ? await loadVerhaalZinnen([lesId])
      : await loadSentences(lesId);
    setSentences(shuffle(data));
    setLoading(false);
  }

  useEffect(() => { init(); }, [lesId, bron]);

  function loadNext(pool: Sentence[]) {
    if (!pool.length) return;
    const zin = pickRandom(pool);
    setCurrent(zin);
    const words = zin.nl.split(" ").map((w, i) => `${w}__${i}`);
    setWordIds(shuffle(words));
    setPlacedIds([]);
    setFeedback(null);
    setAttempts(0);
    setHintRevealed(false);
  }

  useEffect(() => {
    if (sentences.length) loadNext(sentences);
  }, [sentences]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPlacedIds((ids) => {
        const oldIndex = ids.indexOf(active.id as string);
        const newIndex = ids.indexOf(over.id as string);
        return arrayMove(ids, oldIndex, newIndex);
      });
    }
  }

  function handleAddWord(id: string) {
    if (feedback !== null) return;
    if (!placedIds.includes(id)) {
      setPlacedIds((prev) => [...prev, id]);
    }
  }

  function handleRemoveWord(id: string) {
    if (feedback !== null) return;
    setPlacedIds((prev) => prev.filter((item) => item !== id));
  }

  function checkAnswer() {
    if (!current) return;
    const answer = placedIds.map((id) => id.split("__")[0]).join(" ");
    const correct = answer === current.nl;

    if (correct) {
      setFeedback("correct");
      const newCombo = scores.combo + 1;
      const multiplier = newCombo >= 6 ? 3 : newCombo >= 3 ? 2 : 1;
      const points = 20 * multiplier;

      setScores((s) => ({
        goed: s.goed + 1,
        fout: s.fout,
        combo: newCombo,
        score: s.score + points,
      }));

      setCorrectHistory((prev) => [...prev, { tr: current.tr, nl: current.nl }]);
      
      updateProgress((p) => {
        const currentStats = p.games.stats?.zinBouwen || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
        const updatedHistory = [
          {
            sentence: current.nl,
            translation: current.tr,
            correct: true,
            timestamp: new Date().toISOString()
          },
          ...currentStats.history
        ].slice(0, 50);

        return {
          ...p,
          games: {
            ...p.games,
            totalPoints: p.games.totalPoints + points,
            highScores: {
              ...p.games.highScores,
              zinBouwen: Math.max(p.games.highScores.zinBouwen || 0, scores.score + points),
            },
            lastPlayDate: new Date().toISOString(),
            stats: {
              ...p.games.stats,
              zinBouwen: {
                playCount: currentStats.playCount + 1,
                correctCount: currentStats.correctCount + 1,
                wrongCount: currentStats.wrongCount,
                history: updatedHistory
              }
            }
          },
        };
      });

      setTimeout(() => loadNext(sentences), 1200);
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (nextAttempts >= 3) {
        setFeedback("wrong");
        const explanation = explainDifference(answer, current.nl, moedertaal);
        setWrongHistory((prev) => [
          ...prev,
          { tr: current.tr, nl: current.nl, userAnswer: answer, explanation },
        ]);

        setScores((s) => ({
          goed: s.goed,
          fout: s.fout + 1,
          combo: 1,
          score: s.score,
        }));

        updateProgress((p) => {
          const currentStats = p.games.stats?.zinBouwen || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
          const updatedHistory = [
            {
              sentence: current.nl,
              translation: current.tr,
              correct: false,
              timestamp: new Date().toISOString(),
              userAnswer: answer,
              explanation: explanation
            },
            ...currentStats.history
          ].slice(0, 50);

          return {
            ...p,
            games: {
              ...p.games,
              stats: {
                ...p.games.stats,
                zinBouwen: {
                  playCount: currentStats.playCount + 1,
                  correctCount: currentStats.correctCount,
                  wrongCount: currentStats.wrongCount + 1,
                  history: updatedHistory
                }
              }
            },
          };
        });

        setTimeout(() => loadNext(sentences), 3000);
      } else {
        setFeedback("wrong");
        setTimeout(() => {
          setFeedback(null);
        }, 1500);
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <p className="text-sm font-bold uppercase tracking-widest opacity-40 animate-pulse">Laden…</p>
      </div>
    );
  }

  const comboMultiplier = scores.combo >= 6 ? "x3" : scores.combo >= 3 ? "x2" : "x1";

  const controleerButton = (
    <button
      onClick={checkAnswer}
      disabled={placedIds.length === 0 || feedback !== null}
      className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none disabled:opacity-40"
    >
      {feedback === "correct" ? "Goed!" : feedback === "wrong" && attempts >= 3 ? "Volgende..." : "Controleer"}
    </button>
  );

  const feedbackMessage = feedback === "correct"
    ? "Goed!"
    : attempts >= 3
    ? `Fout!`
    : `Fout! Probeer het opnieuw`;

  const feedbackDetail = feedback === "wrong" && attempts >= 3
    ? `Juist antwoord: ${current?.nl}`
    : feedback === "wrong"
    ? `Resterende pogingen: ${3 - attempts}`
    : undefined;

  return (
    <GameShell title="Zin Bouwen" icon="🧩">
      <LesContextChip />
      <ScoreBar
        items={[
          { label: "PUNTEN", value: scores.score, tone: "success" },
          { label: "COMBO", value: comboMultiplier, tone: "warning" },
          {
            label: "HAKLAR",
            value: (
              <div className="flex items-center gap-1.5 inline-flex ml-1 text-sm leading-none">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={i < 3 - attempts ? "text-[var(--danger)]" : "text-[var(--text-muted)] opacity-30"}>
                    ●
                  </span>
                ))}
              </div>
            ) as any,
            tone: "muted",
          },
        ]}
      />

      {/* Target translation question */}
      <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm text-center flex flex-col items-center justify-center min-h-[110px] mb-4 select-none">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] block mb-1">
          MAAK DE ZIN (Cümleyi Kurun)
        </span>
        {isAdvanced && !hintRevealed ? (
          <button
            onClick={() => setHintRevealed(true)}
            className="text-xs bg-[var(--surface-2)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text)] font-bold px-4 py-2 border border-[var(--border)] rounded-xl cursor-pointer transition-colors"
          >
            [toon vertaling]
          </button>
        ) : (
          <h2 className="text-base font-bold tracking-wide leading-normal text-[var(--text)] px-4">
            "{current?.tr}"
          </h2>
        )}
      </div>

      {/* Target Area (Built words) */}
      <div className="w-full">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={placedIds} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-2.5 min-h-[84px] p-4 border-2 border-dashed border-[var(--text-muted)] bg-[var(--surface-2)] rounded-3xl items-center">
              {placedIds.map((id) => (
                <SortableWord
                  key={id}
                  id={id}
                  word={id.split("__")[0]}
                  onClick={() => handleRemoveWord(id)}
                />
              ))}
              {placedIds.length === 0 && (
                <span className="text-xs text-[var(--text-muted)] m-auto select-none opacity-60">
                  Sleep of tik op de woorden hieronder
                </span>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Word Pool Area */}
      <div className="mt-6">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 block select-none">
          WOORDEN (Kelimeler)
        </span>
        <div className="flex flex-wrap gap-2.5 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-3xl min-h-[84px] items-center">
          {wordIds
            .filter((id) => !placedIds.includes(id))
            .map((id) => {
              const word = id.split("__")[0];
              return (
                <button
                  key={id}
                  onClick={() => handleAddWord(id)}
                  disabled={feedback !== null}
                  className="px-4 py-2 bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] rounded-full font-bold text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {word}
                </button>
              );
            })}
        </div>
      </div>

      {/* Controleer button */}
      <div className="mt-6">{controleerButton}</div>

      {/* Shared History Accordion */}
      <HistoryPanel correct={correctHistory} wrong={wrongHistory} />

      {/* Feedback Toast */}
      <FeedbackToast state={feedback} message={feedbackMessage} detail={feedbackDetail} />
    </GameShell>
  );
}

export default function ZinBouwenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <p className="text-sm font-bold uppercase tracking-widest opacity-40 animate-pulse">Laden…</p>
        </div>
      }
    >
      <ZinBouwenGame />
    </Suspense>
  );
}
