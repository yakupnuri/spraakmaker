"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useProgress } from "@/lib/hooks";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LesVerhaal {
  lesId: string;
  thema: number;
  themaTitel: string;
  hoofdstuk: number;
  hoofdstukNummer: string;
  verhaalTitel: string;
  verhaal: string;
  highlights: {
    verbs: string[];
    conjunctions: string[];
    scheidbaar: string[];
    tussenwoorden: string[];
  };
  woordenschat: Record<string, string>;
  oefeningen: {
    vulIn: Array<{ zin: string; antwoord: string; hint: string }>;
    zinBouwen: Array<{ woorden: string[]; antwoord: string; tr: string }>;
    vertaalNlTr: Array<{ nl: string; tr: string }>;
    vertaalTrNl: Array<{ tr: string; nl: string }>;
    begrip: Array<{ vraagTr: string; opties: string[]; antwoord: number }>;
  };
}

type ExType = "vulIn" | "zinBouwen" | "vertaalNlTr" | "vertaalTrNl" | "begrip";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tokenizeStory(
  text: string
): Array<{ type: "word" | "space" | "newline" | "punct"; value: string }> {
  const tokens: Array<{
    type: "word" | "space" | "newline" | "punct";
    value: string;
  }> = [];
  const paragraphs = text.split("\n\n");
  paragraphs.forEach((para, pIdx) => {
    if (pIdx > 0) tokens.push({ type: "newline", value: "" });
    const matches =
      para.match(
        /[A-Za-zÀ-ÿ\u00C0-\u024F]+(?:['''\-][A-Za-zÀ-ÿ]+)*|[^\s\w]|\s+/g
      ) || [];
    matches.forEach((m) => {
      if (/\s+/.test(m)) tokens.push({ type: "space", value: m });
      else if (/[A-Za-zÀ-ÿ]/.test(m)) tokens.push({ type: "word", value: m });
      else tokens.push({ type: "punct", value: m });
    });
  });
  return tokens;
}

function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[.,!?;:'"()—–\-]+$/, "");
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function lookupTranslation(
  word: string,
  woordenschat: Record<string, string>
): string {
  if (woordenschat[word]) return woordenschat[word];
  const lower = word.toLowerCase();
  for (const k of Object.keys(woordenschat)) {
    if (k.toLowerCase() === lower) return woordenschat[k];
  }
  const stripped = word.replace(/[.,!?;:'"]+$/, "");
  if (woordenschat[stripped]) return woordenschat[stripped];
  return "";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LesDetailPage() {
  const params = useParams();
  const lesId = params.lesId as string;
  const { progress, updateProgress } = useProgress();

  const [verhalen, setVerhalen] = useState<LesVerhaal[]>([]);
  const [verhaal, setVerhaal] = useState<LesVerhaal | null>(null);
  const [loading, setLoading] = useState(true);

  const [fase, setFase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [unknownWords, setUnknownWords] = useState<string[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/data/lessen-verhalen.json")
      .then((r) => r.json())
      .then((data: LesVerhaal[]) => {
        setVerhalen(data);
        const found = data.find((l) => l.lesId === lesId);
        setVerhaal(found ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lesId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ds-white)] flex items-center justify-center">
        <p className="text-sm font-bold text-[var(--ds-black)] opacity-40 uppercase tracking-widest">
          Laden…
        </p>
      </div>
    );
  }

  if (!verhaal) {
    return (
      <div className="min-h-screen bg-[var(--ds-white)] flex items-center justify-center">
        <p className="text-sm font-bold text-[var(--ds-black)] opacity-40">
          Les niet gevonden.
        </p>
      </div>
    );
  }

  // Compute next les id from real data (handles gaps like les_4 → les_6)
  const currentIndex = verhalen.findIndex((v) => v.lesId === lesId);
  const nextLesId =
    currentIndex >= 0 && currentIndex < verhalen.length - 1
      ? verhalen[currentIndex + 1].lesId
      : null;

  function goToFase(n: 1 | 2 | 3 | 4 | 5) {
    setFase(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleOefeningenDone(score: number, total: number) {
    setCorrectAnswers(score);
    setTotalAnswers(total);
    const pct = total > 0 ? score / total : 0;
    const stars = pct > 0.8 ? 3 : pct >= 0.5 ? 2 : 1;
    updateProgress((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons,
        [lesId]: {
          completed: true,
          score,
          stars,
          lastPractice: new Date().toISOString(),
        },
      },
    }));
    if (unknownWords.length > 0) {
      goToFase(4);
    } else {
      goToFase(5);
    }
  }

  if (fase === 1) {
    return <Fase1 verhaal={verhaal} onNext={() => goToFase(2)} />;
  }

  if (fase === 2) {
    return (
      <Fase2
        verhaal={verhaal}
        unknownWords={unknownWords}
        setUnknownWords={setUnknownWords}
        onBack={() => goToFase(1)}
        onNext={() => goToFase(3)}
      />
    );
  }

  if (fase === 3) {
    return (
      <Fase3
        verhaal={verhaal}
        onDone={handleOefeningenDone}
        onBack={() => goToFase(2)}
      />
    );
  }

  if (fase === 4) {
    return (
      <Fase4
        verhaal={verhaal}
        unknownWords={unknownWords}
        setUnknownWords={setUnknownWords}
        onDone={() => goToFase(5)}
      />
    );
  }

  // fase === 5
  return (
    <Fase5
      verhaal={verhaal}
      correctAnswers={correctAnswers}
      totalAnswers={totalAnswers}
      unknownWords={unknownWords}
      nextLesId={nextLesId}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 1: Bekijken
// ─────────────────────────────────────────────────────────────────────────────

function Fase1({
  verhaal,
  onNext,
}: {
  verhaal: LesVerhaal;
  onNext: () => void;
}) {
  const previewWords = Object.entries(verhaal.woordenschat).slice(0, 6);

  return (
    <div className="min-h-screen bg-[var(--ds-white)] flex flex-col">
      {/* Header */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between">
        <Link
          href="/lessen"
          className="text-[var(--ds-white)] text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
        >
          ← Lessen
        </Link>
        <span className="text-xs font-bold text-[var(--ds-white)] opacity-40 uppercase tracking-widest">
          1/5
        </span>
      </div>

      {/* Thema banner */}
      <div className="bg-[var(--ds-black)] border-b-[3px] border-[var(--ds-black)] px-5 py-4">
        <p className="text-[10px] font-bold text-[var(--ds-white)] uppercase tracking-widest opacity-50">
          Thema {verhaal.thema} — {verhaal.themaTitel.toUpperCase()}
        </p>
        <p className="text-xs font-bold text-[var(--ds-white)] opacity-70 mt-0.5">
          {verhaal.hoofdstukNummer}
        </p>
      </div>

      {/* Title block */}
      <div
        className="px-5 py-10 border-b-[3px] border-[var(--ds-black)]"
        style={{ background: "var(--ds-white)" }}
      >
        <h1 className="text-3xl font-bold text-[var(--ds-black)] leading-tight">
          {verhaal.verhaalTitel}
        </h1>
        <p className="text-xs text-[var(--ds-black)] opacity-40 mt-3 uppercase tracking-widest">
          Verhaal · Oefeningen · Herhaling
        </p>
      </div>

      {/* Vocabulary preview */}
      <div className="px-5 py-6 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-40 mb-4">
          Nieuwe woorden — yeni kelimeler
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[3px]">
          {previewWords.map(([nl, tr]) => (
            <div
              key={nl}
              className="border-[3px] border-[var(--ds-black)] p-3 bg-[var(--ds-white)]"
            >
              <p className="font-bold text-sm text-[var(--ds-black)]">{nl}</p>
              <p className="text-xs text-[var(--ds-black)] opacity-50 mt-0.5">
                {tr}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--ds-black)] opacity-30 mt-3">
          +{Math.max(0, Object.keys(verhaal.woordenschat).length - 6)} meer woorden in dit verhaal
        </p>
      </div>

      {/* CTA */}
      <div className="border-t-[3px] border-[var(--ds-black)]">
        <button
          id="fase1-begin-btn"
          onClick={onNext}
          className="w-full bg-[var(--ds-blue)] text-[var(--ds-white)] py-5 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none flex items-center justify-center gap-3"
        >
          Begin met lezen
          <span className="text-base">→</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 2: Lezen
// ─────────────────────────────────────────────────────────────────────────────

function Fase2({
  verhaal,
  unknownWords,
  setUnknownWords,
  onBack,
  onNext,
}: {
  verhaal: LesVerhaal;
  unknownWords: string[];
  setUnknownWords: React.Dispatch<React.SetStateAction<string[]>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ word: string; meaning: string; x: number; y: number } | null>(null);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tokens = tokenizeStory(verhaal.verhaal);
  const verbSet = new Set(verhaal.highlights.verbs.map((v) => v.toLowerCase()));
  const conjSet = new Set(verhaal.highlights.conjunctions.map((c) => c.toLowerCase()));

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 1500);
  }, []);

  const handleWordTap = useCallback(
    (word: string, e: React.MouseEvent | null) => {
      const norm = normalizeWord(word);
      // Check current state BEFORE any setState call
      const alreadyUnknown = unknownWords.includes(norm);
      // Update the list — pure updater, no side effects inside
      if (alreadyUnknown) {
        setUnknownWords((prev) => prev.filter((w) => w !== norm));
        showToast(`"${norm}" çıkarıldı`);
      } else {
        setUnknownWords((prev) => [...prev, norm]);
        showToast("✓ Eklendi");
      }

      // Show popup if in woordenschat
      const meaning = lookupTranslation(norm, verhaal.woordenschat);
      if (meaning) {
        if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
        const rect = e?.currentTarget
          ? (e.currentTarget as HTMLElement).getBoundingClientRect()
          : null;
        setPopup({
          word: norm,
          meaning,
          x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
          y: rect ? rect.top : 200,
        });
        popupTimerRef.current = setTimeout(() => setPopup(null), 2000);
      }
    },
    [unknownWords, setUnknownWords, verhaal.woordenschat, showToast]
  );

  function getWordStyle(word: string): React.CSSProperties {
    const norm = normalizeWord(word);
    const isVerb = verbSet.has(norm);
    const isConj = conjSet.has(norm);
    const isUnknown = unknownWords.includes(norm);
    const style: React.CSSProperties = { cursor: "pointer" };
    if (isVerb) {
      style.color = "var(--ds-red)";
      style.fontWeight = "bold";
    } else if (isConj) {
      style.color = "var(--ds-blue)";
      style.fontWeight = "bold";
    }
    if (isUnknown) {
      style.backgroundColor = "var(--ds-yellow)";
      style.padding = "0 2px";
    }
    return style;
  }

  return (
    <div className="min-h-screen bg-[var(--ds-white)] flex flex-col pb-40">
      {/* Header */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between sticky top-0 z-40">
        <button
          id="fase2-back-btn"
          onClick={onBack}
          className="text-[var(--ds-white)] text-sm font-bold opacity-60 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none"
        >
          ← Terug
        </button>
        <span className="text-xs font-bold text-[var(--ds-white)] opacity-50 uppercase tracking-widest">
          2/5
        </span>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-b-[3px] border-[var(--ds-black)] flex gap-4 flex-wrap text-xs font-bold">
        <span style={{ color: "var(--ds-red)" }}>● werkwoorden</span>
        <span style={{ color: "var(--ds-blue)" }}>● voegwoorden</span>
        <span
          style={{
            backgroundColor: "var(--ds-yellow)",
            padding: "0 4px",
            color: "var(--ds-black)",
          }}
        >
          onbekend
        </span>
        <span className="text-[var(--ds-black)] opacity-40">
          tik om te markeren
        </span>
      </div>

      {/* Popup */}
      {popup && (
        <div
          className="fixed z-50 bg-[var(--ds-black)] text-[var(--ds-white)] px-3 py-2 text-sm font-bold pointer-events-none"
          style={{
            left: Math.max(8, Math.min(popup.x - 80, window.innerWidth - 176)),
            top: Math.max(64, popup.y - 48),
          }}
        >
          {popup.word} = {popup.meaning}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-[var(--ds-black)] text-[var(--ds-white)] px-4 py-2 text-sm font-bold">
          {toast}
        </div>
      )}

      {/* Story */}
      <div
        className="px-5 py-7 text-base leading-9 text-[var(--ds-black)] max-w-2xl mx-auto w-full"
        style={{ fontFamily: "DM Sans, sans-serif" }}
      >
        {tokens.map((token, i) => {
          if (token.type === "newline") {
            return (
              <span key={i}>
                <br />
                <br />
              </span>
            );
          }
          if (token.type === "space") {
            return (
              <span key={i} style={{ whiteSpace: "pre-wrap" }}>
                {token.value}
              </span>
            );
          }
          if (token.type === "punct") {
            return (
              <span key={i} style={{ whiteSpace: "pre-wrap" }}>
                {token.value}
              </span>
            );
          }
          // word
          return (
            <span
              key={i}
              style={getWordStyle(token.value)}
              className="select-none transition-colors"
              onClick={(e) => handleWordTap(token.value, e)}
              onTouchStart={() => {
                longPressTimerRef.current = setTimeout(() => {
                  handleWordTap(token.value, null);
                }, 400);
              }}
              onTouchEnd={() => {
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                }
              }}
              onTouchMove={() => {
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                }
              }}
            >
              {token.value}
            </span>
          );
        })}
      </div>

      {/* Fixed bottom panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--ds-white)] border-t-[3px] border-[var(--ds-black)] z-40">
        {unknownWords.length > 0 && (
          <div className="border-b-[3px] border-[var(--ds-black)]">
            {/* Collapsed header */}
            <button
              id="fase2-panel-toggle"
              onClick={() => setPanelExpanded((e) => !e)}
              className="w-full px-4 py-2.5 flex items-center justify-between cursor-pointer bg-[var(--ds-yellow)] border-none"
            >
              <span className="text-xs font-bold text-[var(--ds-black)] uppercase tracking-widest">
                {unknownWords.length} kelime işaretlendi
              </span>
              <span className="text-xs font-bold text-[var(--ds-black)]">
                {panelExpanded ? "▲" : "▼"}
              </span>
            </button>

            {/* Word chips */}
            {panelExpanded && (
              <div className="px-4 py-2 flex items-center gap-2 flex-wrap max-h-32 overflow-y-auto">
                {unknownWords.map((w) => (
                  <button
                    key={w}
                    onClick={() =>
                      setUnknownWords((prev) => prev.filter((x) => x !== w))
                    }
                    className="bg-[var(--ds-yellow)] border-[2px] border-[var(--ds-black)] px-2 py-0.5 text-xs font-bold text-[var(--ds-black)] cursor-pointer hover:opacity-70"
                  >
                    {w} ×
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          id="fase2-next-btn"
          onClick={onNext}
          className="w-full bg-[var(--ds-blue)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none flex items-center justify-center gap-2"
        >
          Oefeningen beginnen →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 3: Oefeningen
// ─────────────────────────────────────────────────────────────────────────────

function Fase3({
  verhaal,
  onDone,
  onBack,
}: {
  verhaal: LesVerhaal;
  onDone: (score: number, total: number) => void;
  onBack: () => void;
}) {
  const [exType, setExType] = useState<ExType>("vulIn");
  const [exIndex, setExIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [builtWords, setBuiltWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const ORDER: ExType[] = [
    "vulIn",
    "zinBouwen",
    "vertaalNlTr",
    "vertaalTrNl",
    "begrip",
  ];

  // Actual counts from data
  const counts = {
    vulIn: verhaal.oefeningen.vulIn.length,
    zinBouwen: verhaal.oefeningen.zinBouwen.length,
    vertaalNlTr: verhaal.oefeningen.vertaalNlTr.length,
    vertaalTrNl: verhaal.oefeningen.vertaalTrNl.length,
    begrip: verhaal.oefeningen.begrip.length,
  };
  const totalQuestions = ORDER.reduce((s, k) => s + counts[k], 0);

  let currentQuestion = 0;
  for (const k of ORDER) {
    if (k === exType) break;
    currentQuestion += counts[k];
  }
  currentQuestion += exIndex + 1;

  const progressPct =
    totalQuestions > 0
      ? Math.round(((currentQuestion - 1) / totalQuestions) * 100)
      : 0;

  useEffect(() => {
    if (exType === "zinBouwen") {
      const ex = verhaal.oefeningen.zinBouwen[exIndex];
      if (ex) {
        setAvailableWords(shuffleArray(ex.woorden));
        setBuiltWords([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exType, exIndex]);

  function resetExercise() {
    setUserAnswer("");
    setChecked(false);
    setIsCorrect(false);
    setBuiltWords([]);
    setSelectedOption(null);
    setShowAnswer(false);
  }

  function nextExercise(wasCorrect: boolean) {
    const newScore = wasCorrect ? score + 1 : score;
    setScore(newScore);

    if (exIndex + 1 < counts[exType]) {
      setExIndex(exIndex + 1);
      resetExercise();
    } else {
      const typeIndex = ORDER.indexOf(exType);
      if (typeIndex + 1 < ORDER.length) {
        setExType(ORDER[typeIndex + 1]);
        setExIndex(0);
        resetExercise();
      } else {
        onDone(newScore, totalQuestions);
      }
    }
  }

  const exTypeLabel: Record<ExType, string> = {
    vulIn: "Vul in",
    zinBouwen: "Zin bouwen",
    vertaalNlTr: "Vertaal NL→TR",
    vertaalTrNl: "Vertaal TR→NL",
    begrip: "Begrip",
  };

  return (
    <div className="min-h-screen bg-[var(--ds-white)] flex flex-col">
      {/* Header */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center gap-3 sticky top-0 z-40">
        <button
          id="fase3-back-btn"
          onClick={onBack}
          className="text-[var(--ds-white)] text-sm font-bold opacity-60 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none"
        >
          ← Terug
        </button>
        <span className="text-sm font-bold text-[var(--ds-white)] flex-1">
          {exTypeLabel[exType]}
        </span>
        <span className="text-xs text-[var(--ds-white)] opacity-50 uppercase tracking-widest">
          3/5
        </span>
        <span className="text-xs text-[var(--ds-white)] opacity-60 font-bold">
          {currentQuestion}/{totalQuestions}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-[5px] bg-[var(--ds-black)] opacity-10 relative">
        <div
          className="h-full bg-[var(--ds-blue)] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Exercise content */}
      <div className="flex-1 px-5 py-7 max-w-2xl mx-auto w-full">
        {exType === "vulIn" && verhaal.oefeningen.vulIn[exIndex] && (
          <VulInExercise
            ex={verhaal.oefeningen.vulIn[exIndex]}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            checked={checked}
            isCorrect={isCorrect}
            onCheck={() => {
              const correct =
                userAnswer.trim().toLowerCase() ===
                verhaal.oefeningen.vulIn[exIndex].antwoord
                  .trim()
                  .toLowerCase();
              setIsCorrect(correct);
              setChecked(true);
            }}
            onNext={() => nextExercise(isCorrect)}
          />
        )}

        {exType === "zinBouwen" &&
          verhaal.oefeningen.zinBouwen[exIndex] && (
            <ZinBouwenExercise
              ex={verhaal.oefeningen.zinBouwen[exIndex]}
              builtWords={builtWords}
              setBuiltWords={setBuiltWords}
              availableWords={availableWords}
              setAvailableWords={setAvailableWords}
              checked={checked}
              isCorrect={isCorrect}
              onCheck={() => {
                const built = builtWords.join(" ");
                const correct =
                  built.trim().toLowerCase() ===
                  verhaal.oefeningen.zinBouwen[exIndex].antwoord
                    .trim()
                    .toLowerCase();
                setIsCorrect(correct);
                setChecked(true);
              }}
              onNext={() => nextExercise(isCorrect)}
            />
          )}

        {exType === "vertaalNlTr" &&
          verhaal.oefeningen.vertaalNlTr[exIndex] && (
            <VertaalExercise
              question={verhaal.oefeningen.vertaalNlTr[exIndex].nl}
              answer={verhaal.oefeningen.vertaalNlTr[exIndex].tr}
              direction="nl→tr"
              showAnswer={showAnswer}
              setShowAnswer={setShowAnswer}
              onGoed={() => nextExercise(true)}
              onFout={() => nextExercise(false)}
            />
          )}

        {exType === "vertaalTrNl" &&
          verhaal.oefeningen.vertaalTrNl[exIndex] && (
            <VertaalExercise
              question={verhaal.oefeningen.vertaalTrNl[exIndex].tr}
              answer={verhaal.oefeningen.vertaalTrNl[exIndex].nl}
              direction="tr→nl"
              showAnswer={showAnswer}
              setShowAnswer={setShowAnswer}
              onGoed={() => nextExercise(true)}
              onFout={() => nextExercise(false)}
            />
          )}

        {exType === "begrip" && verhaal.oefeningen.begrip[exIndex] && (
          <BegripExercise
            ex={verhaal.oefeningen.begrip[exIndex]}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            onNext={(correct) => nextExercise(correct)}
          />
        )}
      </div>
    </div>
  );
}

// ── VulIn ─────────────────────────────────────────────────────────────────────

function VulInExercise({
  ex,
  userAnswer,
  setUserAnswer,
  checked,
  isCorrect,
  onCheck,
  onNext,
}: {
  ex: { zin: string; antwoord: string; hint: string };
  userAnswer: string;
  setUserAnswer: (v: string) => void;
  checked: boolean;
  isCorrect: boolean;
  onCheck: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-40 mb-3">
          Vul het juiste woord in
        </p>
        <div className="border-[3px] border-[var(--ds-black)] p-5 bg-[var(--ds-white)]">
          <p className="text-lg font-bold text-[var(--ds-black)] leading-relaxed">
            {ex.zin}
          </p>
        </div>
        {ex.hint && (
          <p className="text-xs text-[var(--ds-black)] opacity-40 mt-2">
            İpucu / Hint: {ex.hint}
          </p>
        )}
      </div>

      <input
        id="vulin-input"
        type="text"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !checked && userAnswer.trim()) onCheck();
        }}
        disabled={checked}
        placeholder="Jouw antwoord…"
        className="w-full border-[3px] border-[var(--ds-black)] px-4 py-3 text-base font-bold bg-[var(--ds-white)] text-[var(--ds-black)] outline-none"
        style={{
          borderColor: checked
            ? isCorrect
              ? "var(--ds-blue)"
              : "var(--ds-red)"
            : "var(--ds-black)",
        }}
        autoFocus
      />

      {checked && (
        <div
          className={`border-[3px] border-[var(--ds-black)] p-4 ${
            isCorrect ? "bg-[var(--ds-blue)]" : "bg-[var(--ds-red)]"
          }`}
        >
          <p className="font-bold text-[var(--ds-white)] text-sm">
            {isCorrect
              ? "✓ Goed! Bravo!"
              : `✗ Fout. Antwoord: ${ex.antwoord}`}
          </p>
        </div>
      )}

      {!checked ? (
        <button
          id="vulin-check-btn"
          onClick={onCheck}
          disabled={!userAnswer.trim()}
          className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-30"
        >
          Controleer
        </button>
      ) : (
        <button
          id="vulin-next-btn"
          onClick={onNext}
          className="w-full bg-[var(--ds-blue)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none flex items-center justify-center gap-2"
        >
          Volgende →
        </button>
      )}
    </div>
  );
}

// ── ZinBouwen ─────────────────────────────────────────────────────────────────

function ZinBouwenExercise({
  ex,
  builtWords,
  setBuiltWords,
  availableWords,
  setAvailableWords,
  checked,
  isCorrect,
  onCheck,
  onNext,
}: {
  ex: { woorden: string[]; antwoord: string; tr: string };
  builtWords: string[];
  setBuiltWords: React.Dispatch<React.SetStateAction<string[]>>;
  availableWords: string[];
  setAvailableWords: React.Dispatch<React.SetStateAction<string[]>>;
  checked: boolean;
  isCorrect: boolean;
  onCheck: () => void;
  onNext: () => void;
}) {
  function addWord(word: string, idx: number) {
    if (checked) return;
    setBuiltWords((prev) => [...prev, word]);
    setAvailableWords((prev) => prev.filter((_, i) => i !== idx));
  }

  function removeWord(word: string, idx: number) {
    if (checked) return;
    setBuiltWords((prev) => prev.filter((_, i) => i !== idx));
    setAvailableWords((prev) => [...prev, word]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-40 mb-3">
          Maak een zin — Bir cümle kur
        </p>
      </div>

      {/* Built sentence area */}
      <div className="min-h-[56px] border-[3px] border-[var(--ds-black)] p-3 flex flex-wrap gap-2 bg-[var(--ds-white)]">
        {builtWords.length === 0 ? (
          <span className="text-sm text-[var(--ds-black)] opacity-30 self-center">
            Klik op de woorden om een zin te maken…
          </span>
        ) : (
          builtWords.map((w, i) => (
            <button
              key={i}
              onClick={() => removeWord(w, i)}
              disabled={checked}
              className="bg-[var(--ds-blue)] text-[var(--ds-white)] border-[2px] border-[var(--ds-black)] px-3 py-1 text-sm font-bold cursor-pointer hover:opacity-80 disabled:cursor-default"
            >
              {w}
            </button>
          ))
        )}
      </div>

      {/* Available words */}
      <div className="flex flex-wrap gap-2">
        {availableWords.map((w, i) => (
          <button
            key={i}
            onClick={() => addWord(w, i)}
            disabled={checked}
            className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] px-3 py-1.5 text-sm font-bold text-[var(--ds-black)] cursor-pointer hover:bg-[var(--ds-yellow)] disabled:opacity-40"
          >
            {w}
          </button>
        ))}
      </div>

      {checked && (
        <div
          className={`border-[3px] border-[var(--ds-black)] p-4 ${
            isCorrect ? "bg-[var(--ds-blue)]" : "bg-[var(--ds-red)]"
          }`}
        >
          <p className="font-bold text-[var(--ds-white)] text-sm">
            {isCorrect ? "✓ Goed!" : `✗ Fout. Juiste volgorde: ${ex.antwoord}`}
          </p>
          <p className="text-xs text-[var(--ds-white)] opacity-80 mt-1">
            Betekenis: {ex.tr}
          </p>
        </div>
      )}

      {!checked ? (
        <button
          id="zinbouwen-check-btn"
          onClick={onCheck}
          disabled={builtWords.length === 0}
          className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-30"
        >
          Controleer
        </button>
      ) : (
        <button
          id="zinbouwen-next-btn"
          onClick={onNext}
          className="w-full bg-[var(--ds-blue)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none flex items-center justify-center gap-2"
        >
          Volgende →
        </button>
      )}
    </div>
  );
}

// ── Vertaal ───────────────────────────────────────────────────────────────────

function VertaalExercise({
  question,
  answer,
  direction,
  showAnswer,
  setShowAnswer,
  onGoed,
  onFout,
}: {
  question: string;
  answer: string;
  direction: "nl→tr" | "tr→nl";
  showAnswer: boolean;
  setShowAnswer: (v: boolean) => void;
  onGoed: () => void;
  onFout: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-40 mb-3">
          {direction === "nl→tr"
            ? "Türkçeye çevir — Vertaal naar Turks"
            : "Nederlandsce çevir — Vertaal naar Nederlands"}
        </p>
        <div className="border-[3px] border-[var(--ds-black)] p-5 bg-[var(--ds-white)]">
          <p className="text-lg font-bold text-[var(--ds-black)] leading-relaxed">
            {question}
          </p>
        </div>
      </div>

      {!showAnswer ? (
        <button
          id="vertaal-show-btn"
          onClick={() => setShowAnswer(true)}
          className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none"
        >
          Toon antwoord — Cevabı göster
        </button>
      ) : (
        <>
          <div className="border-[3px] border-[var(--ds-black)] p-4 bg-[var(--ds-yellow)]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-50 mb-1">
              Correct antwoord:
            </p>
            <p className="font-bold text-[var(--ds-black)] text-base">
              {answer}
            </p>
          </div>
          <p className="text-xs font-bold text-[var(--ds-black)] opacity-50 uppercase tracking-widest text-center">
            Doğru muydu? — Was je antwoord goed?
          </p>
          <div className="flex gap-[3px]">
            <button
              id="vertaal-goed-btn"
              onClick={onGoed}
              className="flex-1 bg-[var(--ds-blue)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-[3px] border-[var(--ds-black)]"
            >
              Goed ✓
            </button>
            <button
              id="vertaal-fout-btn"
              onClick={onFout}
              className="flex-1 bg-[var(--ds-red)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-[3px] border-[var(--ds-black)]"
            >
              Fout ✗
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Begrip ────────────────────────────────────────────────────────────────────

function BegripExercise({
  ex,
  selectedOption,
  setSelectedOption,
  onNext,
}: {
  ex: { vraagTr: string; opties: string[]; antwoord: number };
  selectedOption: number | null;
  setSelectedOption: (v: number) => void;
  onNext: (correct: boolean) => void;
}) {
  const letters = ["A", "B", "C", "D"];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-40 mb-3">
          Begrip — Anlama sorusu
        </p>
        <div className="border-[3px] border-[var(--ds-black)] p-5 bg-[var(--ds-white)]">
          <p className="font-bold text-[var(--ds-black)] text-base leading-relaxed">
            {ex.vraagTr}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-[3px]">
        {ex.opties.map((opt, i) => {
          const isSelected = selectedOption === i;
          const isCorrect = i === ex.antwoord;
          const showResult = selectedOption !== null;

          let bgClass = "bg-[var(--ds-white)]";
          if (showResult && isCorrect) bgClass = "bg-[var(--ds-blue)]";
          else if (showResult && isSelected && !isCorrect)
            bgClass = "bg-[var(--ds-red)]";

          const textClass =
            showResult && (isCorrect || (isSelected && !isCorrect))
              ? "text-[var(--ds-white)]"
              : "text-[var(--ds-black)]";

          return (
            <button
              key={i}
              id={`begrip-opt-${i}`}
              onClick={() => {
                if (selectedOption === null) setSelectedOption(i);
              }}
              disabled={selectedOption !== null}
              className={`flex items-center gap-3 border-[3px] border-[var(--ds-black)] px-4 py-3 ${bgClass} cursor-pointer hover:opacity-80 disabled:cursor-default text-left transition-colors`}
            >
              <span className={`font-bold text-sm flex-shrink-0 ${textClass}`}>
                {letters[i]}
              </span>
              <span className={`text-sm font-medium ${textClass}`}>{opt}</span>
            </button>
          );
        })}
      </div>

      {selectedOption !== null && (
        <button
          id="begrip-next-btn"
          onClick={() => onNext(selectedOption === ex.antwoord)}
          className="w-full bg-[var(--ds-blue)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none flex items-center justify-center gap-2"
        >
          Volgende →
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 4: Herhaling
// ─────────────────────────────────────────────────────────────────────────────

function Fase4({
  verhaal,
  unknownWords,
  setUnknownWords,
  onDone,
}: {
  verhaal: LesVerhaal;
  unknownWords: string[];
  setUnknownWords: React.Dispatch<React.SetStateAction<string[]>>;
  onDone: () => void;
}) {
  const [herhIndex, setHerhIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stillUnknown, setStillUnknown] = useState<string[]>([]);

  const word = unknownWords[herhIndex] ?? "";
  const translation = lookupTranslation(word, verhaal.woordenschat) || "—";

  function handleNext(knew: boolean) {
    if (!knew) {
      setStillUnknown((prev) => [...prev, word]);
    }
    if (herhIndex + 1 < unknownWords.length) {
      setHerhIndex(herhIndex + 1);
      setRevealed(false);
    } else {
      // Done — update unknownWords to only the still-unknown ones
      setUnknownWords(knew ? stillUnknown : [...stillUnknown, word]);
      onDone();
    }
  }

  return (
    <div className="min-h-screen bg-[var(--ds-white)] flex flex-col">
      {/* Header */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--ds-white)]">
          Herhaling
        </span>
        <span className="text-xs font-bold text-[var(--ds-white)] opacity-50 uppercase tracking-widest">
          4/5
        </span>
      </div>

      {/* Progress */}
      <div className="h-[5px] bg-[var(--ds-black)] opacity-10">
        <div
          className="h-full bg-[var(--ds-yellow)] transition-all duration-300"
          style={{
            width: `${((herhIndex) / unknownWords.length) * 100}%`,
          }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-8">
        <div className="w-full max-w-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-40 mb-4 text-center">
            Herhaling — {unknownWords.length} kelime &nbsp;·&nbsp; {herhIndex + 1}/{unknownWords.length}
          </p>

          {/* Word card front */}
          <div className="border-[3px] border-[var(--ds-black)] bg-[var(--ds-blue)] p-10 text-center">
            <p className="text-3xl font-bold text-[var(--ds-white)]">{word}</p>
          </div>

          {/* Translation reveal */}
          {revealed && (
            <div className="border-[3px] border-t-0 border-[var(--ds-black)] bg-[var(--ds-yellow)] p-6 text-center">
              <p className="text-xl font-bold text-[var(--ds-black)]">
                {translation}
              </p>
            </div>
          )}
        </div>

        {!revealed ? (
          <button
            id="herh-toon-btn"
            onClick={() => setRevealed(true)}
            className="w-full max-w-sm bg-[var(--ds-black)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none"
          >
            Toon vertaling — Çeviriyi göster
          </button>
        ) : (
          <div className="w-full max-w-sm flex gap-[3px]">
            <button
              id="herh-kende-btn"
              onClick={() => handleNext(true)}
              className="flex-1 bg-[var(--ds-blue)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-[3px] border-[var(--ds-black)]"
            >
              Kende ik ✓
            </button>
            <button
              id="herh-kende-niet-btn"
              onClick={() => handleNext(false)}
              className="flex-1 bg-[var(--ds-red)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-[3px] border-[var(--ds-black)]"
            >
              Kende ik niet ✗
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 5: Resultaat
// ─────────────────────────────────────────────────────────────────────────────

function Fase5({
  verhaal,
  correctAnswers,
  totalAnswers,
  unknownWords,
  nextLesId,
}: {
  verhaal: LesVerhaal;
  correctAnswers: number;
  totalAnswers: number;
  unknownWords: string[];
  nextLesId: string | null;
}) {
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learnedAll, setLearnedAll] = useState(false);

  const pct = totalAnswers > 0 ? correctAnswers / totalAnswers : 0;
  const pctInt = Math.round(pct * 100);
  const stars = pct > 0.8 ? 3 : pct >= 0.5 ? 2 : 1;

  const trMessage =
    stars === 3
      ? "Mükemmel! Harika iş çıkardın! 🎉"
      : stars === 2
      ? "İyi iş! Biraz daha pratik yapabilirsin. 💪"
      : "Tekrar dene! Her seferinde daha iyi olacaksın. 📚";

  const currentWord = unknownWords[cardIndex] ?? "";
  const currentTranslation = currentWord
    ? lookupTranslation(currentWord, verhaal.woordenschat) || "—"
    : "";

  return (
    <div className="min-h-screen bg-[var(--ds-white)] flex flex-col pb-10">
      {/* Header */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--ds-white)]">
          Resultaat
        </span>
        <span className="text-xs font-bold text-[var(--ds-white)] opacity-40 uppercase tracking-widest">
          5/5
        </span>
      </div>

      {/* Score section */}
      <div className="border-b-[3px] border-[var(--ds-black)] px-5 py-8 flex flex-col items-center gap-5">
        {/* Score display */}
        <div className="border-[3px] border-[var(--ds-black)] bg-[var(--ds-blue)] w-36 h-36 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-[var(--ds-white)]">
            {correctAnswers}/{totalAnswers}
          </p>
          <p className="text-sm font-bold text-[var(--ds-white)] opacity-70 mt-1">
            {pctInt}%
          </p>
        </div>

        {/* Percentage bar */}
        <div className="w-full max-w-xs">
          <div className="h-[8px] border-[2px] border-[var(--ds-black)] bg-[var(--ds-white)]">
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${pctInt}%`,
                backgroundColor:
                  pct > 0.8
                    ? "var(--ds-blue)"
                    : pct >= 0.5
                    ? "var(--ds-yellow)"
                    : "var(--ds-red)",
              }}
            />
          </div>
        </div>

        {/* Stars */}
        <div className="flex gap-2">
          {[0, 1, 2].map((s) => (
            <span
              key={s}
              className="text-2xl"
              style={{
                color: s < stars ? "var(--ds-yellow)" : "var(--ds-black)",
                opacity: s < stars ? 1 : 0.2,
                filter: s < stars ? "drop-shadow(0 0 2px rgba(0,0,0,0.2))" : "none",
              }}
            >
              {s < stars ? "★" : "☆"}
            </span>
          ))}
        </div>

        {/* Turkish motivational message */}
        <p className="text-sm font-bold text-[var(--ds-black)] text-center max-w-xs">
          {trMessage}
        </p>
      </div>

      {/* Flashcard section */}
      <div className="px-5 py-7 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {unknownWords.length === 0 ? (
          <div className="border-[3px] border-[var(--ds-black)] bg-[var(--ds-yellow)] p-6 text-center">
            <p className="font-bold text-[var(--ds-black)] text-lg">
              Tebrikler! Tüm kelimeleri biliyorsun 🎉
            </p>
          </div>
        ) : !learnedAll ? (
          <>
            <div>
              <p className="font-bold text-[var(--ds-black)] mb-1 text-sm uppercase tracking-wide">
                Bu kelimeleri bilmiyorsun — bu hafta ezberle! 📚
              </p>
              <p className="text-xs text-[var(--ds-black)] opacity-50">
                {unknownWords.length} kelime ödev
              </p>
            </div>

            {/* Flashcard */}
            <div
              id="flashcard-area"
              onClick={() => setFlipped((f) => !f)}
              className="cursor-pointer"
              style={{ perspective: "1000px" }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "180px",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.4s ease",
                  transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front — Dutch */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                  className="border-[3px] border-[var(--ds-black)] bg-[var(--ds-blue)] flex flex-col items-center justify-center gap-2"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-50">
                    Nederlands
                  </p>
                  <p className="text-2xl font-bold text-[var(--ds-white)] px-4 text-center">
                    {currentWord}
                  </p>
                  <p className="text-[10px] text-[var(--ds-white)] opacity-40">
                    tik om te draaien
                  </p>
                </div>

                {/* Back — Turkish */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                  className="border-[3px] border-[var(--ds-black)] bg-[var(--ds-yellow)] flex flex-col items-center justify-center gap-2"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-50">
                    Türkçe
                  </p>
                  <p className="text-2xl font-bold text-[var(--ds-black)] px-4 text-center">
                    {currentTranslation}
                  </p>
                </div>
              </div>
            </div>

            {/* Card counter */}
            <p className="text-center text-xs font-bold text-[var(--ds-black)] opacity-40 uppercase tracking-widest">
              {cardIndex + 1} / {unknownWords.length}
            </p>

            {/* Navigation */}
            <div className="flex gap-[3px]">
              <button
                id="card-prev-btn"
                onClick={() => {
                  setCardIndex((i) => Math.max(0, i - 1));
                  setFlipped(false);
                }}
                disabled={cardIndex === 0}
                className="flex-1 border-[3px] border-[var(--ds-black)] bg-[var(--ds-white)] py-3 font-bold text-sm text-[var(--ds-black)] cursor-pointer hover:bg-[var(--ds-yellow)] disabled:opacity-30 transition-colors"
              >
                ← Önceki
              </button>
              {cardIndex < unknownWords.length - 1 ? (
                <button
                  id="card-next-btn"
                  onClick={() => {
                    setCardIndex((i) => i + 1);
                    setFlipped(false);
                  }}
                  className="flex-1 border-[3px] border-[var(--ds-black)] bg-[var(--ds-black)] text-[var(--ds-white)] py-3 font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity"
                >
                  Sonraki →
                </button>
              ) : (
                <button
                  id="card-learned-btn"
                  onClick={() => setLearnedAll(true)}
                  className="flex-1 border-[3px] border-[var(--ds-black)] bg-[var(--ds-blue)] text-[var(--ds-white)] py-3 font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity"
                >
                  Tümünü öğrendim! ✓
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="border-[3px] border-[var(--ds-black)] bg-[var(--ds-blue)] p-6 text-center">
            <p className="font-bold text-[var(--ds-white)] text-lg">
              Harika! Tüm kelimeler gözden geçirildi. 🎉
            </p>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="px-5 flex flex-col gap-[3px] mt-4 max-w-2xl mx-auto w-full">
        <Link
          id="result-back-btn"
          href="/lessen"
          className="w-full border-[3px] border-[var(--ds-black)] bg-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm text-[var(--ds-black)] hover:bg-[var(--ds-yellow)] transition-colors text-center block"
        >
          ← Lessen
        </Link>
        {nextLesId && (
          <Link
            id="result-next-les-btn"
            href={`/lessen/${nextLesId}`}
            className="w-full border-[3px] border-[var(--ds-black)] bg-[var(--ds-black)] py-4 font-bold uppercase tracking-widest text-sm text-[var(--ds-white)] hover:opacity-80 transition-opacity text-center block"
          >
            Volgende les →
          </Link>
        )}
      </div>
    </div>
  );
}
