"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { loadSentencesFromSources, shuffle, pickRandom, loadVerhaalLessen, loadVerhaalZinnen } from "@/lib/gameData";
import { useMoedertaal, useProgress, levenshtein } from "@/lib/hooks";
import type { Sentence } from "@/lib/types";
import GameShell from "@/components/game/GameShell";
import ScoreBar from "@/components/game/ScoreBar";
import FeedbackToast from "@/components/game/FeedbackToast";
import HistoryPanel from "@/components/game/HistoryPanel";
import SourcePicker from "@/components/game/SourcePicker";
import LesContextChip from "@/components/game/LesContextChip";
import { useSearchParams } from "next/navigation";
import { getUnlockedLesIds } from "@/lib/verhaalUnlock";

const AVAILABLE_SOURCES = [
  { id: "tc1", label: "Temel Cümleler 1", level: "A1", desc: "Temel konuşma kalıpları ve günlük ifadeler" },
  { id: "tc2", label: "Temel Cümleler 2", level: "A2", desc: "Orta düzey dil bilgisi içeren zengin cümleler" },
  { id: "az", label: "A-Z Cümleleri", level: "A1-B1", desc: "A'dan Z'ye kelime haznesi örnekleri" },
  { id: "delftse", label: "Delftse Methode", level: "A2-B1", desc: "Akademik ve pratik Hollandaca kalıpları" },
  { id: "lessen", label: "Ders Cümleleri", level: "A1-A2", desc: "Ders kitaplarındaki tüm hikaye cümleleri" },
];

type Difficulty = "oplopend" | "kort" | "middel" | "lang";

const DIFFICULTY_OPTIONS: { id: Difficulty; label: string; desc: string }[] = [
  { id: "oplopend", label: "Oplopend", desc: "Aşamalı: kısa başlar, her 3 doğruda uzar" },
  { id: "kort", label: "Kort", desc: "Kısa cümleler (≤5 kelime)" },
  { id: "middel", label: "Middel", desc: "Orta uzunluk (6–8 kelime)" },
  { id: "lang", label: "Lang", desc: "Uzun cümleler (9+ kelime)" },
];

const wordCount = (nl: string) => nl.trim().split(/\s+/).length;

// Oplopend modunda izin verilen en fazla kelime sayısı: 4'ten başlar, her 3 doğruda +1
const progressiveCap = (goed: number) => 4 + Math.floor(goed / 3);

function VertaalGame() {
  const { progress, updateProgress, recordActivity } = useProgress();
  const { moedertaal } = useMoedertaal();
  const searchParams = useSearchParams();

  const bron = searchParams.get("bron");
  const les = searchParams.get("les");

  const [selectedSources, setSelectedSources] = useState<string[]>(["lessen"]);
  const [verhalenLessen, setVerhalenLessen] = useState<{ lesId: string; titel: string; unlocked: boolean }[]>([]);
  const [selectedLesIds, setSelectedLesIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("oplopend");
  const goedRef = useRef(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [current, setCurrent] = useState<Sentence | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [scores, setScores] = useState({ goed: 0, fout: 0, score: 0 });
  const [loading, setLoading] = useState(false);

  const [correctHistory, setCorrectHistory] = useState<{ nl: string; tr: string }[]>([]);
  const [wrongHistory, setWrongHistory] = useState<{ nl: string; tr: string; userAnswer?: string }[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);

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
          alert("Geen zinnen gevonden voor dit verhaal.");
          return;
        }
        goedRef.current = 0;
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
    if (selectedSources.includes(id)) {
      setSelectedSources(selectedSources.filter((s) => s !== id));
    } else {
      setSelectedSources([...selectedSources, id]);
    }
  };

  const toggleAll = () => {
    if (selectedSources.length === AVAILABLE_SOURCES.length) {
      setSelectedSources([]);
    } else {
      setSelectedSources(AVAILABLE_SOURCES.map((s) => s.id));
    }
  };

  function startGame() {
    if (selectedSources.length === 0 && selectedLesIds.length === 0) return;
    setLoading(true);

    const loadStandard = loadSentencesFromSources(selectedSources);
    const loadStories = selectedLesIds.length > 0 ? loadVerhaalZinnen(selectedLesIds) : Promise.resolve([]);

    Promise.all([loadStandard, loadStories]).then(([standardData, storyData]) => {
      const data = [...standardData, ...storyData];
      let pool = data;

      if (bron !== "verhaal") {
        if (difficulty === "kort") {
          pool = data.filter((s) => wordCount(s.nl) <= 5);
        } else if (difficulty === "middel") {
          pool = data.filter((s) => wordCount(s.nl) >= 6 && wordCount(s.nl) <= 8);
        } else if (difficulty === "lang") {
          pool = data.filter((s) => wordCount(s.nl) >= 9);
        }
      }
      if (pool.length === 0) pool = data;

      if (pool.length === 0) {
        setLoading(false);
        alert("Geen zinnen gevonden voor de geselecteerde bronnen.");
        return;
      }
      goedRef.current = 0;
      setSentences(shuffle(pool));
      setGameStarted(true);
      setLoading(false);
    });
  }

  function loadNext(pool: Sentence[]) {
    let eligible = pool;
    if (difficulty === "oplopend") {
      const cap = progressiveCap(goedRef.current);
      eligible = pool.filter((s) => wordCount(s.nl) <= cap);
      if (eligible.length === 0) eligible = pool;
    }
    const zin = pickRandom(eligible);
    setCurrent(zin);
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

    const correct = checkCorrect();
    const points = correct ? 20 : 0;

    setFeedback(correct ? "correct" : "wrong");
    setScores((s) => ({
      goed: s.goed + (correct ? 1 : 0),
      fout: s.fout + (correct ? 0 : 1),
      score: s.score + points,
    }));

    updateProgress((p) => {
      const currentStats = p.games.stats?.vertaal || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
      const newHistory = [
        ...currentStats.history,
        {
          sentence: current.nl,
          translation: current.tr,
          correct: correct,
          timestamp: new Date().toISOString(),
          userAnswer: input,
          explanation: `Doğru cevap: ${current.nl}`,
        }
      ].slice(-50);

      const currentScore = p.games.highScores.vertaal || 0;
      const pointsEarned = correct ? 20 : 0;

      return {
        ...p,
        games: {
          ...p.games,
          totalPoints: p.games.totalPoints + pointsEarned,
          highScores: {
            ...p.games.highScores,
            vertaal: Math.max(currentScore, scores.score + pointsEarned),
          },
          lastPlayDate: new Date().toISOString(),
          stats: {
            ...p.games.stats,
            vertaal: {
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
      goedRef.current += 1;
      setCorrectHistory((prev) => [{ nl: current.nl, tr: current.tr }, ...prev]);
    } else {
      setWrongHistory((prev) => [
        { nl: current.nl, tr: current.tr, userAnswer: input },
        ...prev,
      ]);
    }

    setTimeout(() => loadNext(sentences), correct ? 1200 : 3500);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <p className="text-sm font-bold uppercase tracking-widest opacity-40 animate-pulse">Laden…</p>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <SourcePicker
        title="vertaal"
        selectedSources={selectedSources}
        onToggle={toggleSource}
        onToggleAll={toggleAll}
        onStart={startGame}
        verhalenLessen={verhalenLessen}
        selectedLesIds={selectedLesIds}
        onToggleLes={(lesId) => {
          if (selectedLesIds.includes(lesId)) {
            setSelectedLesIds(selectedLesIds.filter((id) => id !== lesId));
          } else {
            setSelectedLesIds([...selectedLesIds, lesId]);
          }
        }}
        extraContent={
          <div className="mb-5 select-none">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] block mb-2">
              MOEILIJKHEID (Zorluk)
            </span>
            <div className="flex bg-[var(--surface-2)] border border-[var(--border)] rounded-full p-1 gap-1">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const isSelected = difficulty === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setDifficulty(opt.id)}
                    className={`flex-1 py-2 px-1 rounded-full text-xs font-bold cursor-pointer transition-all border-none ${
                      isSelected
                        ? "bg-[var(--accent)] text-white shadow-sm"
                        : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5 px-1 leading-snug">
              {DIFFICULTY_OPTIONS.find((o) => o.id === difficulty)?.desc}
            </p>
          </div>
        }
      />
    );
  }

  const feedbackMessage = feedback === "correct" ? "Goed!" : "Fout!";
  const feedbackDetail = feedback === "wrong"
    ? `Correct antwoord: ${current?.nl}`
    : undefined;

  return (
    <GameShell title="Vertaal" icon="🗣️">
      <LesContextChip />
      <ScoreBar
        items={[
          { label: "PUNTEN", value: scores.score, tone: "success" },
          { label: "GOED", value: scores.goed, tone: "accent" },
          { label: "FOUT", value: scores.fout, tone: "danger" },
          ...(difficulty === "oplopend"
            ? [{ label: "NIVEAU", value: `≤${progressiveCap(scores.goed)} wrd`, tone: "muted" as const }]
            : []),
        ]}
      />

      {/* Target Question */}
      <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm text-center flex flex-col justify-center items-center gap-1 select-none mb-4 min-h-[100px]">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] block mb-1">
          VERTAAL DEZE ZIN
        </span>
        <h2 className="text-base font-bold text-[var(--text)] leading-normal">
          "{current?.tr}"
        </h2>
      </div>

      {/* Textarea Input Card */}
      <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm flex flex-col gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] select-none">
          SCHRIJF IN HET NEDERLANDS:
        </span>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!!feedback}
          rows={3}
          placeholder="Schrijf hier je antwoord…"
          className="w-full bg-transparent outline-none resize-none font-bold text-base text-[var(--text)] placeholder:opacity-40 border border-[var(--border)] rounded-xl px-4 py-3 focus:border-[var(--accent)] focus:ring-0 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (input.trim() && !feedback) {
                checkAnswer();
              }
            }
          }}
          autoFocus
        />
      </div>

      {/* Control Button (moved inline) */}
      <button
        onClick={checkAnswer}
        disabled={!input.trim() || !!feedback}
        className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none mt-4"
      >
        {feedback === "correct" ? "Goed!" : feedback === "wrong" ? "Volgende..." : "Controleer"}
      </button>

      {/* Accordion History */}
      <HistoryPanel correct={correctHistory} wrong={wrongHistory} />

      {/* Toast */}
      <FeedbackToast state={feedback} message={feedbackMessage} detail={feedbackDetail} />
    </GameShell>
  );
}

export default function VertaalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <p className="text-sm font-bold uppercase tracking-widest opacity-40 animate-pulse">Laden…</p>
        </div>
      }
    >
      <VertaalGame />
    </Suspense>
  );
}
