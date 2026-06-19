"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loadSentencesFromSources, shuffle, pickRandom, loadVerhaalLessen, loadVerhaalZinnen } from "@/lib/gameData";
import { useMoedertaal, useProgress, levenshtein } from "@/lib/hooks";
import type { Sentence } from "@/lib/types";
import GameShell from "@/components/game/GameShell";
import ScoreBar from "@/components/game/ScoreBar";
import FeedbackToast from "@/components/game/FeedbackToast";
import HistoryPanel from "@/components/game/HistoryPanel";
import SourcePicker from "@/components/game/SourcePicker";
import LesContextChip from "@/components/game/LesContextChip";
import { getUnlockedLesIds } from "@/lib/verhaalUnlock";

const AVAILABLE_SOURCES = [
  { id: "tc1", label: "Temel Cümleler 1", level: "A1", desc: "Temel konuşma kalıpları ve günlük ifadeler" },
  { id: "tc2", label: "Temel Cümleler 2", level: "A2", desc: "Orta düzey dil bilgisi içeren zengin cümleler" },
  { id: "az", label: "A-Z Cümleleri", level: "A1-B1", desc: "A'dan Z'ye kelime haznesi örnekleri" },
  { id: "delftse", label: "Delftse Methode", level: "A2-B1", desc: "Akademik ve pratik Hollandaca kalıpları" },
  { id: "lessen", label: "Ders Cümleleri", level: "A1-A2", desc: "Ders kitaplarındaki tüm hikaye cümleleri" },
];

const VUL_IN_EXPLANATIONS: Record<string, {
  empty: string;
  typo: string;
  grammar: string;
  wrongWord: string;
}> = {
  tr: {
    empty: "Lütfen bir cevap yazın.",
    typo: "\"{user}\" yazdınız. Küçük bir yazım hatası var gibi görünüyor. Doğru kelime: \"{correct}\"",
    grammar: "\"{user}\" yazdınız. Kelimenin kökü doğru ancak eki/çekimi hatalı. Beklenen: \"{correct}\"",
    wrongWord: "\"{user}\" yazdınız. Yanlış kelimeyi seçtiniz veya harf sıralaması tamamen farklı. Doğru cevap: \"{correct}\"",
  },
  en: {
    empty: "Please type an answer.",
    typo: "You wrote \"{user}\". Looks like a minor typo. Correct word: \"{correct}\"",
    grammar: "You wrote \"{user}\". Word root is correct but inflection/conjugation is wrong. Expected: \"{correct}\"",
    wrongWord: "You wrote \"{user}\". Wrong word choice or completely different spelling. Correct answer: \"{correct}\"",
  }
};

function buildGap(sentence: string): { before: string; target: string; after: string } {
  const words = sentence.split(" ");
  const candidates = words
    .map((w, i) => ({ w: w.replace(/[.,!?;:]$/, ""), i }))
    .filter(({ w }) => w.length > 3);
  const pick = candidates.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : { w: words[0], i: 0 };
  const before = words.slice(0, pick.i).join(" ");
  const after = words.slice(pick.i + 1).join(" ");
  return { before, target: pick.w, after };
}

function VulInGame() {
  const searchParams = useSearchParams();
  const initialLesId = searchParams.get("les");
  const bron = searchParams.get("bron");
  const les = searchParams.get("les");

  const { moedertaal } = useMoedertaal();
  const { progress, updateProgress } = useProgress();

  const [selectedSources, setSelectedSources] = useState<string[]>(
    initialLesId && bron !== "verhaal" ? ["lessen"] : ["tc1"]
  );
  const [verhalenLessen, setVerhalenLessen] = useState<{ lesId: string; titel: string; unlocked: boolean }[]>([]);
  const [selectedLesIds, setSelectedLesIds] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [current, setCurrent] = useState<Sentence | null>(null);
  const [gap, setGap] = useState({ before: "", target: "", after: "" });
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [scores, setScores] = useState({ goed: 0, fout: 0, score: 0 });
  const [loading, setLoading] = useState(false);
  const [questionNum, setQuestionNum] = useState(0);

  const [correctHistory, setCorrectHistory] = useState<Array<{ tr: string; nl: string; word: string }>>([]);
  const [wrongHistory, setWrongHistory] = useState<Array<{ tr: string; nl: string; userAnswer: string; explanation: string }>>([]);

  const [isAdvanced, setIsAdvanced] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

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
          alert("Geen zinnen gevonden voor dit verhaal.");
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
      if (data.length === 0) {
        setLoading(false);
        alert("Geen zinnen gevonden voor de geselecteerde kaynaklar.");
        return;
      }
      setSentences(shuffle(data));
      setGameStarted(true);
      setLoading(false);
    });
  }

  function loadNext(pool: Sentence[]) {
    const zin = pickRandom(pool);
    setCurrent(zin);
    setGap(buildGap(zin.nl));
    setInput("");
    setFeedback(null);
    setHintRevealed(false);
    setQuestionNum((n) => n + 1);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  useEffect(() => {
    if (sentences.length && gameStarted) loadNext(sentences);
  }, [sentences, gameStarted]);

  function getCommonPrefixLength(a: string, b: string): number {
    let len = 0;
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
      if (a[i] === b[i]) {
        len++;
      } else {
        break;
      }
    }
    return len;
  }

  function explainVulInError(userIn: string, targetWord: string): { explanation: string; unknownWord?: string } {
    const cleanInput = userIn.trim().toLowerCase().replace(/[.,!?;:]/g, "");
    const cleanTarget = targetWord.trim().toLowerCase().replace(/[.,!?;:]/g, "");
    const expl = VUL_IN_EXPLANATIONS[moedertaal] || VUL_IN_EXPLANATIONS["en"];

    if (cleanInput === "") {
      return { explanation: expl.empty };
    }

    const dist = levenshtein(cleanInput, cleanTarget);

    if (dist <= 2) {
      return {
        explanation: expl.typo.replace("{user}", userIn).replace("{correct}", targetWord),
      };
    }

    const commonPrefixLen = getCommonPrefixLength(cleanInput, cleanTarget);
    if (commonPrefixLen >= 3 && Math.abs(cleanInput.length - cleanTarget.length) <= 3) {
      return {
        explanation: expl.grammar.replace("{user}", userIn).replace("{correct}", targetWord),
      };
    }

    return {
      explanation: expl.wrongWord.replace("{user}", userIn).replace("{correct}", targetWord),
      unknownWord: userIn
    };
  }

  function checkAnswer() {
    if (!current || feedback) return;
    const clean = (s: string) => s.toLowerCase().replace(/[.,!?;:]/g, "").trim();
    const cleanInput = clean(input);
    const cleanTarget = clean(gap.target);
    const correct = levenshtein(cleanInput, cleanTarget) <= 1;

    setFeedback(correct ? "correct" : "wrong");
    const points = correct ? 15 : 0;

    setScores((s) => ({
      goed: s.goed + (correct ? 1 : 0),
      fout: s.fout + (correct ? 0 : 1),
      score: s.score + points,
    }));

    if (correct) {
      setCorrectHistory((prev) => [
        { tr: current.tr, nl: current.nl, word: gap.target },
        ...prev
      ]);

      updateProgress((p) => {
        const currentStats = p.games.stats?.vulIn || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
        const updatedHistory = [
          {
            sentence: current.nl,
            translation: current.tr,
            correct: true,
            timestamp: new Date().toISOString(),
            userAnswer: input
          },
          ...currentStats.history
        ].slice(0, 50);

        return {
          ...p,
          games: {
            ...p.games,
            totalPoints: p.games.totalPoints + 15,
            highScores: {
              ...p.games.highScores,
              vulIn: Math.max(p.games.highScores.vulIn || 0, scores.score + 15),
            },
            lastPlayDate: new Date().toISOString(),
            stats: {
              ...p.games.stats,
              vulIn: {
                playCount: currentStats.playCount + 1,
                correctCount: currentStats.correctCount + 1,
                wrongCount: currentStats.wrongCount,
                history: updatedHistory
              }
            }
          },
        };
      });
    } else {
      const errAnalysis = explainVulInError(input, gap.target);
      setWrongHistory((prev) => [
        {
          tr: current.tr,
          nl: current.nl,
          userAnswer: input,
          targetWord: gap.target,
          explanation: errAnalysis.explanation,
          unknownWord: errAnalysis.unknownWord
        },
        ...prev
      ]);

      if (errAnalysis.unknownWord) {
        try {
          const stored = localStorage.getItem("spraakmaker-unknown-words");
          const list = stored ? JSON.parse(stored) : [];
          if (!list.some((w: any) => w.word.toLowerCase() === cleanInput)) {
            list.push({
              word: cleanInput,
              target: cleanTarget,
              sentence: current.nl,
              translation: current.tr,
              timestamp: new Date().toISOString()
            });
            localStorage.setItem("spraakmaker-unknown-words", JSON.stringify(list));
          }
        } catch (e) {}
      }

      updateProgress((p) => {
        const currentStats = p.games.stats?.vulIn || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
        const updatedHistory = [
          {
            sentence: current.nl,
            translation: current.tr,
            correct: false,
            timestamp: new Date().toISOString(),
            userAnswer: input,
            explanation: errAnalysis.explanation
          },
          ...currentStats.history
        ].slice(0, 50);

        return {
          ...p,
          games: {
            ...p.games,
            stats: {
              ...p.games.stats,
              vulIn: {
                playCount: currentStats.playCount + 1,
                correctCount: currentStats.correctCount,
                wrongCount: currentStats.wrongCount + 1,
                history: updatedHistory
              }
            }
          },
        };
      });
    }

    setTimeout(() => loadNext(sentences), correct ? 1200 : 3000);
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
        title="vul in"
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
      />
    );
  }

  const actionBar = (
    <button
      onClick={checkAnswer}
      disabled={!input.trim() || feedback !== null}
      className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
    >
      {feedback === "correct" ? "Goed!" : feedback === "wrong" ? "Volgende..." : "Controleer"}
    </button>
  );

  const feedbackMessage = feedback === "correct" ? "Goed!" : "Fout!";
  const feedbackDetail = feedback === "wrong"
    ? explainVulInError(input, gap.target).explanation
    : undefined;

  return (
    <GameShell title="Vul In" icon="✏️" actionBar={actionBar}>
      <LesContextChip />
      <ScoreBar
        items={[
          { label: "VRAAG", value: `#${questionNum}`, tone: "accent" },
          { label: "PUNTEN", value: scores.score, tone: "success" },
          { label: "HIGHSCORE", value: progress.games.highScores.vulIn || 0, tone: "muted" },
        ]}
      />

      {/* Inline Input Card */}
      <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm text-center min-h-[160px] flex flex-col justify-center items-center gap-4 relative select-none">
        <div className="text-base md:text-lg font-bold leading-relaxed text-[var(--text)] font-sans">
          <span>{gap.before} </span>
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
          <span> {gap.after}</span>
        </div>

        {/* Translation Hint below */}
        <div className="mt-4 border-t border-[var(--border)] pt-4 w-full">
          {isAdvanced && !hintRevealed ? (
            <button
              onClick={() => setHintRevealed(true)}
              className="text-xs font-bold text-[var(--accent)] hover:underline border-none bg-none p-0 cursor-pointer bg-transparent"
            >
              [toon vertaling]
            </button>
          ) : (
            <p className="text-xs font-bold text-[var(--text-muted)] italic">
              {current?.tr}
            </p>
          )}
        </div>
      </div>

      {/* Accordion History */}
      <HistoryPanel correct={correctHistory.map(h => ({ nl: h.nl, tr: h.tr }))} wrong={wrongHistory} />

      {/* Toast */}
      <FeedbackToast state={feedback} message={feedbackMessage} detail={feedbackDetail} />
    </GameShell>
  );
}

export default function VulInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <p className="text-sm font-bold uppercase tracking-widest opacity-40 animate-pulse">Laden…</p>
        </div>
      }
    >
      <VulInGame />
    </Suspense>
  );
}
