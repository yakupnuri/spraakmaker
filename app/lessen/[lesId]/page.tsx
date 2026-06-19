"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProgress } from "@/lib/hooks";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import GameChooserSheet from "@/components/game/GameChooserSheet";
import { loadEtappes, loadGrammarLessonData } from "@/lib/curriculum";
import type { Sentence, Etappe } from "@/lib/types";

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

function inflectionCandidates(w: string): string[] {
  const out = [w];
  if (w.endsWith("t") && w.length > 3) out.push(w.slice(0, -1), w.slice(0, -1) + "en");
  if (w.endsWith("en") && w.length > 4) out.push(w.slice(0, -2), w.slice(0, -1));
  if (w.length > 3) out.push(w + "en");
  const base = w.endsWith("t") ? w.slice(0, -1) : w;
  const m = base.match(/^(.+?)([aeou])\2([^aeiou])$/);
  if (m) out.push(m[1] + m[2] + m[3] + "en");
  return out;
}

function lookupTranslation(
  word: string,
  currentDict: Record<string, string>,
  allStories: LesVerhaal[] = [],
  extraDict: Record<string, string> = {}
): string {
  const lower = word.toLowerCase();
  const cands = inflectionCandidates(lower);

  const lookupInRecord = (lowerWord: string, record: Record<string, string>) => {
    if (!record) return "";
    if (record[lowerWord]) return record[lowerWord];
    for (const [k, v] of Object.entries(record)) {
      const parts = k.toLowerCase().split("/").map((p) => p.trim());
      if (parts.some((p) => p === lowerWord || p.replace(/[.,!?;:'"()—–\-]+$/, "") === lowerWord)) {
        return v;
      }
    }
    return "";
  };

  for (const c of cands) {
    const hit = lookupInRecord(c, currentDict);
    if (hit) return hit;
  }

  for (const story of allStories) {
    const hit = lookupInRecord(lower, story.woordenschat);
    if (hit) return hit;
  }

  for (const c of cands) {
    if (extraDict[c]) return extraDict[c];
  }

  return "";
}

function normalizeAnswer(s: string): string {
  return s
    .toLocaleLowerCase("nl")
    .replace(/[.,!?;:'"„"“’]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Reusable Header Stepper ──────────────────────────────────────────────────

function LessenHeader({
  currentStep,
  onBack,
  backText = "Terug",
}: {
  currentStep: 1 | 2 | 3 | 4 | 5;
  onBack: () => void;
  backText?: string;
}) {
  const steps = [
    { num: 1, label: "Bekijk" },
    { num: 2, label: "Lees" },
    { num: 3, label: "Oefen" },
    { num: 4, label: "Herhaal" },
    { num: 5, label: "Klaar" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-[var(--text)] text-sm font-bold opacity-75 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none flex items-center gap-1.5"
        >
          <span>←</span> <span>{backText}</span>
        </button>
        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full">
          Fase {currentStep}/5
        </span>
      </div>

      <div className="flex items-center justify-between w-full max-w-md mx-auto px-1 select-none">
        {steps.map((step, index) => {
          const isActive = step.num === currentStep;
          const isCompleted = step.num < currentStep;

          let badgeStyle = "bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]";
          if (isActive) {
            badgeStyle = "bg-[var(--accent)] text-white border-[var(--accent)]";
          } else if (isCompleted) {
            badgeStyle = "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/20";
          }

          return (
            <div key={step.num} className="flex items-center gap-1.5 flex-1 justify-center last:flex-none">
              <div className="flex items-center gap-1">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${badgeStyle}`}>
                  {step.num}
                </span>
                <span className={`text-[10px] font-bold tracking-tight hidden xs:inline transition-colors ${
                  isActive ? "text-[var(--accent)] font-black" : isCompleted ? "text-[var(--success)]" : "text-[var(--text-muted)]"
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-[1px] flex-1 mx-2 hidden sm:block ${
                  isCompleted ? "bg-[var(--success)]" : "bg-[var(--border)]"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LesDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const lesId = params.lesId as string;
  const router = useRouter();
  const { progress, updateProgress, recordActivity } = useProgress();

  const [verhalen, setVerhalen] = useState<LesVerhaal[]>([]);
  const [verhaal, setVerhaal] = useState<LesVerhaal | null>(null);
  const [loading, setLoading] = useState(true);

  const [fase, setFase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [unknownWords, setUnknownWords] = useState<string[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);

  // New curriculum fields
  const [lesType, setLesType] = useState<"verhaal" | "grammatica_spreken" | null>(null);
  const [grammarData, setGrammarData] = useState<any>(null); // rule, sentences
  const [etappeId, setEtappeId] = useState<string>("");
  const [lesNr, setLesNr] = useState<number>(1);
  const [nextLesId, setNextLesId] = useState<string | null>(null);

  // Load from localStorage when lesId changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem("spraakmaker-les-woorden");
      if (stored) {
        const dict = JSON.parse(stored);
        setUnknownWords(dict[lesId] || []);
      } else {
        setUnknownWords([]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [lesId]);

  // Save to localStorage when unknownWords changes
  useEffect(() => {
    if (loading) return;
    try {
      const stored = localStorage.getItem("spraakmaker-les-woorden");
      const dict = stored ? JSON.parse(stored) : {};
      dict[lesId] = unknownWords;
      localStorage.setItem("spraakmaker-les-woorden", JSON.stringify(dict));
    } catch (e) {
      console.error(e);
    }
  }, [unknownWords, lesId, loading]);
  
  const [extraDictionary, setExtraDictionary] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/data/woordenboek.json")
      .then((r) => r.json())
      .then((dict: Record<string, string>) => setExtraDictionary(dict))
      .catch((err) => console.error("Error loading woordenboek:", err));
  }, []);

  useEffect(() => {
    setLoading(true);
    
    // URL'den etappeId ve lesNr çekmeyi dene
    const queryEtappeId = searchParams.get("etappe") || "etappe-a1-01";
    const queryLesNr = parseInt(searchParams.get("nr") || "1", 10);
    setEtappeId(queryEtappeId);
    setLesNr(queryLesNr);

    loadEtappes().then(async (etappesList) => {
      const currentEtappe = etappesList.find(e => e.id === queryEtappeId);
      if (currentEtappe) {
        const currentLes = currentEtappe.lessen.find(l => l.nr === queryLesNr);
        
        // Sonraki ders var mı?
        const nextLesObj = currentEtappe.lessen.find(l => l.nr === queryLesNr + 1);
        if (nextLesObj) {
          setNextLesId(nextLesObj.verhaalId || `${queryEtappeId}-${nextLesObj.nr}`);
        } else {
          setNextLesId(null);
        }

        if (currentLes) {
          setLesType(currentLes.type);
          if (currentLes.type === "grammatica_spreken") {
            const data = await loadGrammarLessonData(
              currentLes.grammarTopic || "tegenwoordige-tijd",
              currentLes.niveau || "A1",
              currentLes.zinnenbankLesId
            );
            setGrammarData(data);
            setLoading(false);
          } else {
            fetch("/data/lessen-verhalen.json?t=" + Date.now(), { cache: "no-store" })
              .then((r) => r.json())
              .then((data: LesVerhaal[]) => {
                setVerhalen(data);
                const found = data.find((l) => l.lesId === lesId);
                setVerhaal(found ?? null);
                setLoading(false);
              })
              .catch(() => setLoading(false));
          }
        } else {
          setLoading(false);
        }
      } else {
        fetch("/data/lessen-verhalen.json?t=" + Date.now(), { cache: "no-store" })
          .then((r) => r.json())
          .then((data: LesVerhaal[]) => {
            setVerhalen(data);
            const found = data.find((l) => l.lesId === lesId);
            setVerhaal(found ?? null);
            setLesType("verhaal");
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    });
  }, [lesId, searchParams]);

  const handleLessonCompleted = (score: number, total: number) => {
    updateProgress((prev) => {
      const next = { ...prev };
      const pct = total > 0 ? score / total : 0;
      const stars = pct > 0.8 ? 3 : pct >= 0.5 ? 2 : 1;
      
      next.lessons = {
        ...next.lessons,
        [lesId]: {
          completed: true,
          score,
          stars,
          lastPractice: new Date().toISOString(),
        }
      };

      if (etappeId) {
        if (!next.curriculum) {
          next.curriculum = {
            activeEtappeId: "etappe-a1-01",
            etappes: {}
          };
        }
        
        const etappeProg = next.curriculum.etappes[etappeId] || { lessenDone: [], quizPassed: false };
        if (!etappeProg.lessenDone.includes(lesId)) {
          etappeProg.lessenDone.push(lesId);
        }
        next.curriculum.etappes[etappeId] = etappeProg;

        if (lesNr === 5) {
          etappeProg.quizPassed = true;
        }
      }

      return next;
    });

    recordActivity();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-sm font-bold text-[var(--text)] opacity-40 uppercase tracking-widest animate-pulse">
          Laden…
        </p>
      </div>
    );
  }

  if (lesType === "grammatica_spreken") {
    if (!grammarData) {
      return (
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
          <p className="text-sm font-bold text-[var(--text)] opacity-40">
            Grammatica les data niet gevonden.
          </p>
        </div>
      );
    }

    if (fase === 1) {
      return <GrammarFase1 rule={grammarData.rule} onNext={() => setFase(2)} onBack={() => router.push("/lessen")} />;
    }
    if (fase === 2) {
      return <GrammarFase2 sentences={grammarData.sentences} onBack={() => setFase(1)} onNext={() => setFase(3)} />;
    }
    if (fase === 3) {
      return <GrammarFase3 sentences={grammarData.sentences} onBack={() => setFase(2)} onNext={() => setFase(4)} />;
    }
    if (fase === 4) {
      return <GrammarFase4 sentences={grammarData.sentences} onBack={() => setFase(3)} onNext={() => setFase(5)} />;
    }
    return (
      <GrammarFase5 
        sentences={grammarData.sentences} 
        nextLesId={nextLesId} 
        etappeId={etappeId} 
        onComplete={(score, total) => {
          handleLessonCompleted(score, total);
        }}
      />
    );
  }

  if (!verhaal) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-sm font-bold text-[var(--text)] opacity-40">
          Les niet gevonden.
        </p>
      </div>
    );
  }

  function goToFase(n: 1 | 2 | 3 | 4 | 5) {
    setFase(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleOefeningenDone(score: number, total: number) {
    setCorrectAnswers(score);
    setTotalAnswers(total);
    handleLessonCompleted(score, total);
    if (unknownWords.length > 0) {
      goToFase(4);
    } else {
      goToFase(5);
    }
  }

  if (fase === 1) {
    return <Fase1 verhaal={verhaal} onNext={() => goToFase(2)} onBack={() => router.push("/lessen")} />;
  }

  if (fase === 2) {
    return (
      <Fase2
        verhaal={verhaal}
        unknownWords={unknownWords}
        setUnknownWords={setUnknownWords}
        onBack={() => goToFase(1)}
        onNext={() => goToFase(3)}
        verhalen={verhalen}
        extraDictionary={extraDictionary}
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
        verhalen={verhalen}
        extraDictionary={extraDictionary}
      />
    );
  }

  return (
    <Fase5
      verhaal={verhaal}
      correctAnswers={correctAnswers}
      totalAnswers={totalAnswers}
      unknownWords={unknownWords}
      nextLesId={nextLesId}
      verhalen={verhalen}
      extraDictionary={extraDictionary}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 1: Bekijken
// ─────────────────────────────────────────────────────────────────────────────

function Fase1({
  verhaal,
  onNext,
  onBack,
}: {
  verhaal: LesVerhaal;
  onNext: () => void;
  onBack: () => void;
}) {
  const previewWords = Object.entries(verhaal.woordenschat).slice(0, 6);
  const [isAdvanced, setIsAdvanced] = useState(false);

  useEffect(() => {
    const level = localStorage.getItem("spraakmaker-niveau");
    if (level === "B1" || level === "B2") {
      setIsAdvanced(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <LessenHeader currentStep={1} onBack={onBack} backText="Lessen" />

      {/* Thema banner */}
      <div className="bg-[var(--primary)] px-5 py-5 text-white select-none">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
          Thema {verhaal.thema} — {verhaal.themaTitel}
        </p>
        <h2 className="text-lg font-extrabold mt-0.5">
          {verhaal.hoofdstukNummer}
        </h2>
      </div>

      {/* Title block */}
      <div className="px-5 py-8 bg-[var(--surface)] border-b border-[var(--border)]">
        <h1 className="text-2xl font-black text-[var(--text)] leading-tight">
          {verhaal.verhaalTitel}
        </h1>
        <p className="text-[10px] text-[var(--text-muted)] font-black mt-2 uppercase tracking-widest">
          Verhaal · Oefeningen · Herhaling
        </p>
      </div>

      {/* Vocabulary preview */}
      <div className="px-5 py-6 flex-1 max-w-lg mx-auto w-full">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">
          Nieuwe woorden (Yeni Kelimeler)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {previewWords.map(([nl, tr]) => (
            <div
              key={nl}
              className="border border-[var(--border)] rounded-2xl p-4 bg-[var(--surface)] shadow-sm"
            >
              <p className="font-bold text-sm text-[var(--text)]">{nl}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {isAdvanced ? (
                  <span
                    className="cursor-pointer hover:underline text-slate-400 select-none font-bold"
                    onClick={(e) => {
                      e.currentTarget.textContent = tr;
                    }}
                  >
                    [toon vertaling]
                  </span>
                ) : (
                  tr
                )}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)] opacity-60 mt-4 text-center">
          +{Math.max(0, Object.keys(verhaal.woordenschat).length - 6)} meer woorden in dit verhaal
        </p>
      </div>

      {/* CTA */}
      <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] sticky bottom-0">
        <button
          id="fase1-begin-btn"
          onClick={onNext}
          className="w-full max-w-lg mx-auto bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none flex items-center justify-center gap-2"
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
  verhalen = [],
  extraDictionary = {},
}: {
  verhaal: LesVerhaal;
  unknownWords: string[];
  setUnknownWords: React.Dispatch<React.SetStateAction<string[]>>;
  onBack: () => void;
  onNext: () => void;
  verhalen?: LesVerhaal[];
  extraDictionary?: Record<string, string>;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [activeWordInfo, setActiveWordInfo] = useState<{ word: string; meaning: string } | null>(null);
  const [bottomSheetRevealed, setBottomSheetRevealed] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const level = localStorage.getItem("spraakmaker-niveau");
    if (level === "B1" || level === "B2") {
      setIsAdvanced(true);
    }
  }, []);

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
      
      const meaning = lookupTranslation(norm, verhaal.woordenschat, verhalen, extraDictionary) || "Sözlükte yok — kelime kaydedildi";
      
      setActiveWordInfo({ word: norm, meaning });
      setBottomSheetRevealed(false);
    },
    [verhaal.woordenschat, verhalen, extraDictionary]
  );

  function getWordStyle(word: string): React.CSSProperties {
    const norm = normalizeWord(word);
    const isVerb = verbSet.has(norm);
    const isConj = conjSet.has(norm);
    const isUnknown = unknownWords.includes(norm);
    const style: React.CSSProperties = { cursor: "pointer" };
    if (isVerb) {
      style.color = "var(--danger)";
      style.fontWeight = "bold";
    } else if (isConj) {
      style.color = "var(--primary)";
      style.fontWeight = "bold";
    }
    if (isUnknown) {
      style.backgroundColor = "var(--warning)";
      style.color = "black";
      style.padding = "0 4px";
      style.borderRadius = "4px";
    }
    return style;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col pb-48">
      <LessenHeader currentStep={2} onBack={onBack} />

      {/* Legend */}
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex gap-4 flex-wrap text-xs font-bold justify-center select-none shadow-sm">
        <span className="text-[var(--danger)]">● werkwoorden</span>
        <span className="text-[var(--primary)]">● voegwoorden</span>
        <span className="bg-[var(--warning)]/20 px-2 py-0.5 text-[var(--warning)] rounded">
          onbekend
        </span>
        <span className="text-[var(--text-muted)] opacity-60">
          tik om te vertalen / markeren
        </span>
      </div>

      {/* Story */}
      <div
        className="px-6 py-8 text-base leading-relaxed text-[var(--text)] max-w-2xl mx-auto w-full select-none"
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
          return (
            <span
              key={i}
              style={getWordStyle(token.value)}
              className="select-none transition-all hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded px-0.5"
              onClick={(e) => handleWordTap(token.value, e)}
            >
              {token.value}
            </span>
          );
        })}
      </div>

      {/* Dictionary Detail Bottom Sheet */}
      <AnimatePresence>
        {activeWordInfo && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed left-0 right-0 z-50 bottom-[64px] md:bottom-0 bg-[var(--surface)] border-t border-[var(--border)] rounded-t-2xl p-4 shadow-2xl max-w-lg mx-auto select-none"
          >
            <div className="w-12 h-1 bg-[var(--surface-2)] rounded-full mx-auto mb-3" />
            
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">
                  WOORDENBOEK (Sözlük)
                </span>
                <h3 className="text-xl font-extrabold text-[var(--text)]">{activeWordInfo.word}</h3>
              </div>
              <button
                onClick={() => setActiveWordInfo(null)}
                className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[var(--surface-2)] p-3 rounded-xl mb-3 text-sm text-[var(--text)] font-semibold">
              {isAdvanced && !bottomSheetRevealed ? (
                <button
                  onClick={() => setBottomSheetRevealed(true)}
                  className="text-xs font-bold text-[var(--primary)] hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  [toon vertaling — çeviriyi göster]
                </button>
              ) : (
                <span>{activeWordInfo.meaning}</span>
              )}
            </div>

            <button
              onClick={() => {
                const norm = activeWordInfo.word;
                const alreadyUnknown = unknownWords.includes(norm);
                if (alreadyUnknown) {
                  setUnknownWords((prev) => prev.filter((w) => w !== norm));
                  showToast(`"${norm}" çıkarıldı`);
                } else {
                  setUnknownWords((prev) => [...prev, norm]);
                  showToast("✓ Eklendi");
                }
              }}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                unknownWords.includes(activeWordInfo.word)
                  ? "bg-[var(--accent)] text-white hover:opacity-95"
                  : "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {unknownWords.includes(activeWordInfo.word)
                ? "✓ Kelime İşaretlendi (Gemarkeerd)"
                : "+ Bilinmeyen Olarak İşaretle"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-48 left-1/2 -translate-x-1/2 z-50 bg-[var(--primary)] text-white px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {/* Fixed bottom panel */}
      <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="w-full max-w-lg mx-auto flex flex-col">
          {unknownWords.length > 0 && (
            <div className="border-b border-[var(--border)]">
              {/* Collapsed header */}
              <button
                id="fase2-panel-toggle"
                onClick={() => setPanelExpanded((e) => !e)}
                className="w-full px-4 py-2.5 flex items-center justify-between cursor-pointer bg-[var(--accent-soft)] hover:opacity-95 transition-opacity border-none text-[var(--accent)] font-black text-xs uppercase tracking-wider"
              >
                <span>{unknownWords.length} {unknownWords.length === 1 ? "woord" : "woorden"} gemarkeerd</span>
                <span>{panelExpanded ? "▲" : "▼"}</span>
              </button>

              {/* Word chips */}
              {panelExpanded && (
                <div className="px-4 py-3 flex items-center gap-2 flex-wrap max-h-32 overflow-y-auto bg-[var(--surface)]">
                  {unknownWords.map((w) => (
                    <button
                      key={w}
                      onClick={() => {
                        setUnknownWords((prev) => prev.filter((x) => x !== w));
                        showToast(`"${w}" çıkarıldı`);
                      }}
                      className="bg-[var(--accent-soft)] border border-[var(--accent)]/20 px-3 py-1 rounded-full text-xs font-bold text-[var(--accent)] cursor-pointer hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] hover:border-[var(--danger)]/20 transition-all"
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
            className="w-full bg-[var(--primary)] text-white py-4 font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none flex items-center justify-center gap-2 shadow-sm"
          >
            Oefeningen beginnen →
          </button>
        </div>
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
  const [isAdvanced, setIsAdvanced] = useState(false);

  useEffect(() => {
    const level = localStorage.getItem("spraakmaker-niveau");
    if (level === "B1" || level === "B2") {
      setIsAdvanced(true);
    }
  }, []);

  const ORDER: ExType[] = [
    "vulIn",
    "zinBouwen",
    "vertaalNlTr",
    "vertaalTrNl",
    "begrip",
  ];

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
  }, [exType, exIndex, verhaal.oefeningen.zinBouwen]);

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
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <LessenHeader currentStep={3} onBack={onBack} backText={exTypeLabel[exType]} />

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[var(--surface-2)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Exercise content */}
      <div className="flex-1 px-5 py-7 max-w-lg mx-auto w-full">
        {exType === "vulIn" && verhaal.oefeningen.vulIn[exIndex] && (
          <VulInExercise
            ex={verhaal.oefeningen.vulIn[exIndex]}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            checked={checked}
            isCorrect={isCorrect}
            onCheck={() => {
              const correct =
                normalizeAnswer(userAnswer) ===
                normalizeAnswer(verhaal.oefeningen.vulIn[exIndex].antwoord);
              setIsCorrect(correct);
              setChecked(true);
            }}
            onNext={() => nextExercise(isCorrect)}
            isAdvanced={isAdvanced}
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
                  normalizeAnswer(built) ===
                  normalizeAnswer(verhaal.oefeningen.zinBouwen[exIndex].antwoord);
                setIsCorrect(correct);
                setChecked(true);
              }}
              onNext={() => nextExercise(isCorrect)}
              isAdvanced={isAdvanced}
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
              isAdvanced={isAdvanced}
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
              isAdvanced={isAdvanced}
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
  isAdvanced,
}: {
  ex: { zin: string; antwoord: string; hint: string };
  userAnswer: string;
  setUserAnswer: (v: string) => void;
  checked: boolean;
  isCorrect: boolean;
  onCheck: () => void;
  onNext: () => void;
  isAdvanced: boolean;
}) {
  const [revealHint, setRevealHint] = useState(false);

  useEffect(() => {
    setRevealHint(false);
  }, [ex]);

  const hasGap = ex.zin.includes("___");
  const parts = ex.zin.split("___");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-3">
          VUL IN (Boşluğu doldur)
        </p>
        <div className="border border-[var(--border)] rounded-2xl p-5 bg-[var(--surface)] shadow-sm">
          {hasGap ? (
            <p className="text-lg font-bold text-[var(--text)] leading-relaxed font-sans">
              <span>{parts[0]}</span>
              <input
                id="vulin-input"
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !checked && userAnswer.trim()) onCheck();
                }}
                disabled={checked}
                className="inline-block border-b-2 border-[var(--accent)] bg-transparent text-center outline-none text-[var(--accent)] font-bold px-1 py-0.5 focus:border-[var(--accent)] focus:ring-0 focus:outline-none"
                style={{
                  width: `${Math.max(80, userAnswer.length * 11)}px`,
                  borderColor: checked
                    ? isCorrect
                      ? "var(--success)"
                      : "var(--danger)"
                    : undefined,
                }}
                placeholder="..."
                autoFocus
              />
              <span>{parts[1]}</span>
            </p>
          ) : (
            <p className="text-lg font-bold text-[var(--text)] leading-relaxed">
              {ex.zin}
            </p>
          )}
        </div>
        {ex.hint && (
          <div className="text-xs mt-2 select-none">
            {isAdvanced && !revealHint ? (
              <button
                onClick={() => setRevealHint(true)}
                className="text-[10px] bg-[var(--surface-2)] text-[var(--text-muted)] font-black px-2.5 py-1 border border-[var(--border)] rounded-lg cursor-pointer transition-colors"
              >
                Toon ipucu/hint (İpucunu göster)
              </button>
            ) : (
              <span className="text-[var(--text-muted)]">
                İpucu / Hint: {ex.hint}
              </span>
            )}
          </div>
        )}
      </div>

      {!hasGap && (
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
          className="w-full border border-[var(--border)] rounded-xl px-4 py-3 text-base font-semibold bg-[var(--surface)] text-[var(--text)] outline-none transition-all focus:border-[var(--accent)]"
          style={{
            borderColor: checked
              ? isCorrect
                ? "var(--success)"
                : "var(--danger)"
              : undefined,
          }}
          autoFocus
        />
      )}

      {checked && (
        <div
          className={`border p-4 rounded-xl ${
            isCorrect
              ? "bg-[var(--success-soft)] border-[var(--success)]/10 text-[var(--success)]"
              : "bg-[var(--danger-soft)] border-[var(--danger)]/10 text-[var(--danger)]"
          }`}
        >
          <p className="font-bold text-sm">
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
          className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none disabled:opacity-30 disabled:pointer-events-none"
        >
          Controleer
        </button>
      ) : (
        <button
          id="vulin-next-btn"
          onClick={onNext}
          className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none flex items-center justify-center gap-2"
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
  isAdvanced,
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
  isAdvanced: boolean;
}) {
  const [revealTr, setRevealTr] = useState(false);

  useEffect(() => {
    setRevealTr(false);
  }, [ex]);

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
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-3">
          MAAK EEN ZIN (Cümle yap)
        </p>
      </div>

      {/* Built sentence area */}
      <div className="min-h-[72px] border-2 border-dashed border-[var(--text-muted)]/30 rounded-2xl p-4 flex flex-wrap gap-2 bg-[var(--surface-2)] items-center">
        {builtWords.length === 0 ? (
          <span className="text-xs text-[var(--text-muted)] opacity-60 w-full text-center">
            Klik op de woorden om een zin te maken…
          </span>
        ) : (
          builtWords.map((w, i) => (
            <button
              key={i}
              onClick={() => removeWord(w, i)}
              disabled={checked}
              className="bg-[var(--primary)] text-white rounded-xl px-3.5 py-1.5 text-sm font-bold cursor-pointer hover:opacity-90 disabled:cursor-default transition-all"
            >
              {w}
            </button>
          ))
        )}
      </div>

      {/* Available words */}
      <div className="flex flex-wrap gap-2 justify-center py-2">
        {availableWords.map((w, i) => (
          <button
            key={i}
            onClick={() => addWord(w, i)}
            disabled={checked}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-sm font-bold text-[var(--text)] cursor-pointer hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-all shadow-sm disabled:opacity-40 disabled:pointer-events-none"
          >
            {w}
          </button>
        ))}
      </div>

      {checked && (
        <div
          className={`border p-4 rounded-xl ${
            isCorrect
              ? "bg-[var(--success-soft)] border-[var(--success)]/10 text-[var(--success)]"
              : "bg-[var(--danger-soft)] border-[var(--danger)]/10 text-[var(--danger)]"
          }`}
        >
          <p className="font-bold text-sm">
            {isCorrect ? "✓ Goed!" : `✗ Fout. Juiste volgorde: ${ex.antwoord}`}
          </p>
          {isAdvanced && !revealTr ? (
            <button
              onClick={() => setRevealTr(true)}
              className="mt-2 text-[10px] bg-white/10 hover:bg-white/20 text-white font-black px-2.5 py-1 border border-white/20 rounded-md cursor-pointer transition-colors"
            >
              Toon vertaling (Çeviriyi göster)
            </button>
          ) : (
            <p className="text-xs opacity-90 mt-1">
              Betekenis: {ex.tr}
            </p>
          )}
        </div>
      )}

      {!checked ? (
        <button
          id="zinbouwen-check-btn"
          onClick={onCheck}
          disabled={builtWords.length === 0}
          className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none disabled:opacity-30 disabled:pointer-events-none"
        >
          Controleer
        </button>
      ) : (
        <button
          id="zinbouwen-next-btn"
          onClick={onNext}
          className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none flex items-center justify-center gap-2"
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
  isAdvanced,
}: {
  question: string;
  answer: string;
  direction: "nl→tr" | "tr→nl";
  showAnswer: boolean;
  setShowAnswer: (v: boolean) => void;
  onGoed: () => void;
  onFout: () => void;
  isAdvanced: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-3">
          {isAdvanced
            ? direction === "nl→tr"
              ? "Vertaal naar het Turks"
              : "Vertaal naar het Nederlands"
            : direction === "nl→tr"
            ? "TÜRKÇEYE ÇEVİR (NL→TR)"
            : "HOLLANDACAYA ÇEVİR (TR→NL)"}
        </p>
        <div className="border border-[var(--border)] rounded-2xl p-5 bg-[var(--surface)] shadow-sm">
          <p className="text-lg font-bold text-[var(--text)] leading-relaxed">
            {question}
          </p>
        </div>
      </div>

      {!showAnswer ? (
        <button
          id="vertaal-show-btn"
          onClick={() => setShowAnswer(true)}
          className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
        >
          Toon antwoord
        </button>
      ) : (
        <>
          <div className="border border-[var(--warning)]/20 p-4 bg-[var(--warning)]/10 text-[var(--warning)] rounded-2xl shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
              Correct antwoord (Doğru Cevap):
            </p>
            <p className="font-bold text-[var(--text)] text-base">
              {answer}
            </p>
          </div>
          <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest text-center select-none mt-2">
            Was je antwoord goed?
          </p>
          <div className="flex gap-3">
            <button
              id="vertaal-goed-btn"
              onClick={onGoed}
              className="flex-1 bg-[var(--success)] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none"
            >
              Goed ✓
            </button>
            <button
              id="vertaal-fout-btn"
              onClick={onFout}
              className="flex-1 bg-[var(--danger)] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none"
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
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-3">
          BEGRIP (Anlama Sorusu)
        </p>
        <div className="border border-[var(--border)] rounded-2xl p-5 bg-[var(--surface)] shadow-sm">
          <p className="font-bold text-[var(--text)] text-base leading-relaxed">
            {ex.vraagTr}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {ex.opties.map((opt, i) => {
          const isSelected = selectedOption === i;
          const isCorrect = i === ex.antwoord;
          const showResult = selectedOption !== null;

          let bgClass = "bg-[var(--surface)]";
          if (showResult && isCorrect) bgClass = "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]";
          else if (showResult && isSelected && !isCorrect)
            bgClass = "bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]";

          return (
            <button
              key={i}
              id={`begrip-opt-${i}`}
              onClick={() => {
                if (selectedOption === null) setSelectedOption(i);
              }}
              disabled={selectedOption !== null}
              className={`flex items-center gap-3 border border-[var(--border)] rounded-2xl px-4 py-3.5 ${bgClass} cursor-pointer hover:opacity-90 active:scale-98 transition-all text-left w-full shadow-sm`}
            >
              <span className={`w-6 h-6 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-xs font-black shrink-0 ${
                showResult && (isCorrect || (isSelected && !isCorrect)) ? "text-inherit" : "text-[var(--text-muted)]"
              }`}>
                {letters[i]}
              </span>
              <span className="text-sm font-semibold">{opt}</span>
            </button>
          );
        })}
      </div>

      {selectedOption !== null && (
        <button
          id="begrip-next-btn"
          onClick={() => onNext(selectedOption === ex.antwoord)}
          className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none flex items-center justify-center gap-2"
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
  verhalen = [],
  extraDictionary = {},
}: {
  verhaal: LesVerhaal;
  unknownWords: string[];
  setUnknownWords: React.Dispatch<React.SetStateAction<string[]>>;
  onDone: () => void;
  verhalen?: LesVerhaal[];
  extraDictionary?: Record<string, string>;
}) {
  const [herhIndex, setHerhIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stillUnknown, setStillUnknown] = useState<string[]>([]);
  const [isAdvanced, setIsAdvanced] = useState(false);

  useEffect(() => {
    const level = localStorage.getItem("spraakmaker-niveau");
    if (level === "B1" || level === "B2") {
      setIsAdvanced(true);
    }
  }, []);

  const word = unknownWords[herhIndex] ?? "";
  const translation =
    lookupTranslation(word, verhaal.woordenschat, verhalen, extraDictionary) ||
    "Geen vertaling gevonden — sözlükte yok";

  function handleNext(knew: boolean) {
    if (!knew) {
      setStillUnknown((prev) => [...prev, word]);
    }
    if (herhIndex + 1 < unknownWords.length) {
      setHerhIndex(herhIndex + 1);
      setRevealed(false);
    } else {
      setUnknownWords(knew ? stillUnknown : [...stillUnknown, word]);
      onDone();
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <LessenHeader currentStep={4} onBack={() => {}} backText="Herhaling" />

      {/* Progress */}
      <div className="w-full h-1.5 bg-[var(--surface-2)]">
        <div
          className="h-full bg-[var(--warning)] transition-all duration-300"
          style={{
            width: `${((herhIndex) / unknownWords.length) * 100}%`,
          }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-8 max-w-lg mx-auto w-full">
        <div className="w-full select-none">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4 text-center">
            {unknownWords.length} {unknownWords.length === 1 ? "woord" : "woorden"} &nbsp;·&nbsp; {herhIndex + 1}/{unknownWords.length}
          </p>

          {/* Word card */}
          <div className="bg-[var(--primary)] text-white rounded-t-2xl p-10 text-center font-bold text-3xl shadow-md border border-[var(--border)]">
            {word}
          </div>

          {/* Translation reveal */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--accent-soft)] border-x border-b border-[var(--accent)]/10 text-[var(--accent)] rounded-b-2xl p-6 text-center font-extrabold text-xl shadow-sm"
              >
                {translation}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!revealed ? (
          <button
            id="herh-toon-btn"
            onClick={() => setRevealed(true)}
            className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
          >
            {isAdvanced ? "Toon vertaling" : "Toon vertaling — Çeviriyi göster"}
          </button>
        ) : (
          <div className="w-full flex gap-3">
            <button
              id="herh-kende-btn"
              onClick={() => handleNext(true)}
              className="flex-1 bg-[var(--success)] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none shadow-sm"
            >
              Kende ik ✓
            </button>
            <button
              id="herh-kende-niet-btn"
              onClick={() => handleNext(false)}
              className="flex-1 bg-[var(--danger)] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none shadow-sm"
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
  verhalen = [],
  extraDictionary = {},
}: {
  verhaal: LesVerhaal;
  correctAnswers: number;
  totalAnswers: number;
  unknownWords: string[];
  nextLesId: string | null;
  verhalen?: LesVerhaal[];
  extraDictionary?: Record<string, string>;
}) {
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learnedAll, setLearnedAll] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);

  const [chooserOpen, setChooserOpen] = useState(false);

  // Quiz states
  const [quizMode, setQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const pct = totalAnswers > 0 ? correctAnswers / totalAnswers : 0;
  const pctInt = Math.round(pct * 100);
  const stars = pct > 0.8 ? 3 : pct >= 0.5 ? 2 : 1;

  useEffect(() => {
    const level = localStorage.getItem("spraakmaker-niveau");
    if (level === "B1" || level === "B2") {
      setIsAdvanced(true);
    }
  }, []);

  const message = isAdvanced
    ? stars === 3
      ? "Uitstekend! Geweldig gedaan! 🎉"
      : stars === 2
      ? "Goed gedaan! Je kunt nog wat meer oefenen. 💪"
      : "Probeer het nog eens! Je wordt elke keer beter. 📚"
    : stars === 3
    ? "Mükemmel! Harika iş çıkardın! 🎉"
    : stars === 2
    ? "İyi iş! Biraz daha pratik yapabilirsin. 💪"
    : "Tekrar dene! Her seferinde daha iyi olacaksın. 📚";

  const currentWord = unknownWords[cardIndex] ?? "";
  const currentTranslation = currentWord
    ? lookupTranslation(currentWord, verhaal.woordenschat, verhalen, extraDictionary) ||
      "Geen vertaling gevonden — sözlükte yok"
    : "";

  if (quizMode) {
    if (!quizCompleted) {
      const ex = verhaal.oefeningen.begrip[quizIndex];
      return (
        <div className="min-h-screen bg-[var(--bg)] flex flex-col pb-48">
          <LessenHeader currentStep={5} onBack={() => setQuizMode(false)} backText="Terug" />
          <div className="px-5 py-7 max-w-lg mx-auto w-full flex-1">
            <BegripExercise
              ex={ex}
              selectedOption={quizSelectedOption}
              setSelectedOption={setQuizSelectedOption}
              onNext={(correct) => {
                if (correct) setQuizScore((s) => s + 1);
                if (quizIndex + 1 < verhaal.oefeningen.begrip.length) {
                  setQuizIndex((idx) => idx + 1);
                  setQuizSelectedOption(null);
                } else {
                  setQuizCompleted(true);
                }
              }}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen bg-[var(--bg)] flex flex-col pb-48">
          <LessenHeader currentStep={5} onBack={() => setQuizMode(false)} backText="Terug" />
          <div className="px-5 py-7 max-w-lg mx-auto w-full flex flex-col items-center justify-center text-center gap-6">
            <span className="text-4xl">🧠</span>
            <h3 className="text-lg font-black text-[var(--text)] uppercase tracking-tight">QUIZ AFGEROND!</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-xs">
              Anlama sorularını tamamladın.
            </p>
            <div className="bg-[var(--accent-soft)] text-[var(--accent)] px-5 py-3 rounded-2xl w-full border border-[var(--accent)]/10 text-center">
              <span className="text-2xl font-black">{quizScore} / {verhaal.oefeningen.begrip.length} doğru</span>
            </div>
            <button
              onClick={() => {
                setQuizMode(false);
                setQuizIndex(0);
                setQuizScore(0);
                setQuizSelectedOption(null);
                setQuizCompleted(false);
              }}
              className="w-full bg-[var(--primary)] text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
            >
              Terug
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col pb-48">
      <LessenHeader currentStep={5} onBack={() => {}} backText="Resultaat" />

      {/* Score section */}
      <div className="border-b border-[var(--border)] px-5 py-8 bg-[var(--surface)] flex flex-col items-center gap-5 select-none">
        {/* Score display circle */}
        <div className="rounded-full bg-[var(--primary)] text-white w-36 h-36 flex flex-col items-center justify-center shadow-md border border-[var(--border)]">
          <p className="text-3xl font-black font-mono">
            {correctAnswers}/{totalAnswers}
          </p>
          <p className="text-sm font-bold opacity-75 mt-1 font-mono">
            {pctInt}%
          </p>
        </div>

        {/* Percentage bar */}
        <div className="w-full max-w-xs">
          <div className="h-3 rounded-full bg-[var(--surface-2)] overflow-hidden border border-[var(--border)]">
            <div
              className="h-full transition-all duration-700 rounded-full"
              style={{
                width: `${pctInt}%`,
                backgroundColor:
                  pct > 0.8
                    ? "var(--success)"
                    : pct >= 0.5
                    ? "var(--warning)"
                    : "var(--danger)",
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
                color: s < stars ? "var(--warning)" : "var(--text-muted)",
                opacity: s < stars ? 1 : 0.2,
              }}
            >
              {s < stars ? "★" : "☆"}
            </span>
          ))}
        </div>

        <p className="text-sm font-bold text-[var(--text)] text-center max-w-xs leading-relaxed">
          {message}
        </p>
      </div>

      {/* 2x2 Action Grid */}
      <div className="px-5 pt-6 pb-2 max-w-lg mx-auto w-full select-none">
        <p className="font-black text-[var(--text)] mb-3 text-sm uppercase tracking-wide">
          Wat nu? (Şimdi ne yapalım?)
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Speel */}
          <button
            onClick={() => setChooserOpen(true)}
            className="flex flex-col items-start gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent)] hover:shadow-xs transition-all active:scale-[0.98] cursor-pointer text-left w-full"
          >
            <span className="text-2xl">🎮</span>
            <div>
              <h4 className="text-sm font-bold text-[var(--text)]">Speel</h4>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">
                Hikâye cümleleriyle oyunlar oyna
              </p>
            </div>
          </button>

          {/* Card 2: Quiz */}
          {verhaal.oefeningen.begrip && verhaal.oefeningen.begrip.length > 0 ? (
            <button
              onClick={() => {
                setQuizMode(true);
                setQuizIndex(0);
                setQuizScore(0);
                setQuizSelectedOption(null);
                setQuizCompleted(false);
              }}
              className="flex flex-col items-start gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent)] hover:shadow-xs transition-all active:scale-[0.98] cursor-pointer text-left w-full"
            >
              <span className="text-2xl">🧠</span>
              <div>
                <h4 className="text-sm font-bold text-[var(--text)]">Quiz</h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">
                  Anlama düzeyini test et
                </p>
              </div>
            </button>
          ) : (
            <div className="opacity-40 flex flex-col items-start gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-left w-full cursor-not-allowed">
              <span className="text-2xl">🧠</span>
              <div>
                <h4 className="text-sm font-bold text-[var(--text)]">Quiz</h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">
                  Bu ders için quiz bulunmuyor
                </p>
              </div>
            </div>
          )}

          {/* Card 3: Woorden herhalen */}
          <Link
            href={`/kaarten?les=${verhaal.lesId}`}
            className="flex flex-col items-start gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent)] hover:shadow-xs transition-all active:scale-[0.98] cursor-pointer text-left block"
          >
            <span className="text-2xl">🃏</span>
            <div>
              <h4 className="text-sm font-bold text-[var(--text)]">Woorden</h4>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">
                Ders kelimelerini kartlarla çalış
              </p>
            </div>
          </Link>

          {/* Card 4: Volgende les */}
          {nextLesId ? (
            <Link
              href={`/lessen/${nextLesId}`}
              className="flex flex-col items-start gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent)] hover:shadow-xs transition-all active:scale-[0.98] cursor-pointer text-left block"
            >
              <span className="text-2xl">➡️</span>
              <div>
                <h4 className="text-sm font-bold text-[var(--text)]">Volgende</h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">
                  Bir sonraki hikâyeli derse geç
                </p>
              </div>
            </Link>
          ) : (
            <div className="opacity-40 flex flex-col items-start gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-left w-full cursor-not-allowed">
              <span className="text-2xl">➡️</span>
              <div>
                <h4 className="text-sm font-bold text-[var(--text)]">Volgende</h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">
                  Tüm hikâyeler tamamlandı
                </p>
              </div>
            </div>
          )}
        </div>

        <GameChooserSheet
          lesId={verhaal.lesId}
          isOpen={chooserOpen}
          onClose={() => setChooserOpen(false)}
        />
      </div>

      {/* Flashcard section */}
      <div className="px-5 py-7 flex flex-col gap-6 max-w-lg mx-auto w-full">
        {unknownWords.length === 0 ? (
          <div className="border border-[var(--success)]/10 bg-[var(--success-soft)] text-[var(--success)] p-6 rounded-2xl text-center shadow-sm font-bold">
            <p className="text-lg">
              {isAdvanced ? "Gefeliciteerd! Je kent alle woorden 🎉" : "Tebrikler! Tüm kelimeleri biliyorsun 🎉"}
            </p>
          </div>
        ) : !learnedAll ? (
          <>
            <div className="select-none">
              <p className="font-black text-[var(--text)] text-center mb-1 text-sm uppercase tracking-wide">
                {isAdvanced ? "Review je gemarkeerde woorden 📚" : "Gözden Geçirilecek Kelimelerin 📚"}
              </p>
              <p className="text-xs text-[var(--text-muted)] text-center">
                {unknownWords.length} {unknownWords.length === 1 ? "woord" : "woorden"}
              </p>
            </div>

            {/* Flashcard 3D flip card */}
            <div
              id="flashcard-area"
              onClick={() => setFlipped((f) => !f)}
              className="cursor-pointer select-none card-3d h-44 w-full"
            >
              <div className={`card-inner ${flipped ? "flipped" : ""}`}>
                {/* Front — Dutch */}
                <div className="card-front rounded-2xl bg-[var(--primary)] text-white border border-[var(--border)] flex flex-col items-center justify-center gap-2 p-6 shadow-md">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    Nederlands
                  </p>
                  <p className="text-2xl font-bold px-4 text-center leading-normal">
                    {currentWord}
                  </p>
                  <p className="text-[10px] opacity-40 italic mt-2">
                    tik om te draaien (çevir)
                  </p>
                </div>

                {/* Back — Turkish */}
                <div className="card-back rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/10 flex flex-col items-center justify-center gap-2 p-6 shadow-md">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    {isAdvanced ? "Turks" : "Türkçe"}
                  </p>
                  <p className="text-2xl font-bold px-4 text-center leading-normal">
                    {currentTranslation}
                  </p>
                  <p className="text-[10px] opacity-40 italic mt-2 text-[var(--text-muted)]">
                    tik om te draaien
                  </p>
                </div>
              </div>
            </div>

            {/* Card counter */}
            <p className="text-center text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest select-none">
              {cardIndex + 1} / {unknownWords.length}
            </p>

            {/* Navigation controls */}
            <div className="flex gap-3">
              <button
                id="card-prev-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setCardIndex((i) => Math.max(0, i - 1));
                  setFlipped(false);
                }}
                disabled={cardIndex === 0}
                className="flex-1 bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] rounded-xl py-3 font-bold text-sm hover:opacity-90 disabled:opacity-30 transition-all cursor-pointer"
              >
                ← {isAdvanced ? "Vorige" : "Önceki"}
              </button>
              {cardIndex < unknownWords.length - 1 ? (
                <button
                  id="card-next-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardIndex((i) => i + 1);
                    setFlipped(false);
                  }}
                  className="flex-1 bg-[var(--primary)] text-white rounded-xl py-3 font-bold text-sm hover:opacity-90 transition-all cursor-pointer border-none"
                >
                  {isAdvanced ? "Volgende" : "Sonraki"} →
                </button>
              ) : (
                <button
                  id="card-learned-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLearnedAll(true);
                  }}
                  className="flex-1 bg-[var(--success)] text-white rounded-xl py-3 font-bold text-sm hover:opacity-90 transition-all cursor-pointer border-none"
                >
                  {isAdvanced ? "Alles geleerd! ✓" : "Tamamdır! ✓"}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="border border-[var(--success)]/10 bg-[var(--success-soft)] text-[var(--success)] p-6 rounded-2xl text-center shadow-sm font-bold">
            <p className="text-lg">
              {isAdvanced ? "Geweldig! Alle woorden zijn beoordeeld. 🎉" : "Harika! Tüm kelimeler gözden geçirildi. 🎉"}
            </p>
          </div>
        )}
      </div>

      {/* Bottom links panel securely aligned over mobile navigation bar */}
      <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] z-40 p-3 shadow-md pb-[env(safe-area-inset-bottom)] flex gap-3 select-none">
        <div className="w-full max-w-lg mx-auto flex gap-3">
          <Link
            id="result-back-btn"
            href="/lessen"
            className="flex-1 bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] py-4 rounded-xl font-bold uppercase tracking-wider text-xs hover:opacity-90 active:scale-95 transition-all text-center block"
          >
            ← Lessen (Dersler)
          </Link>
          {nextLesId && (
            <Link
              id="result-next-les-btn"
              href={`/lessen/${nextLesId}`}
              className="flex-1 bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-xs hover:opacity-95 active:scale-95 transition-all text-center block"
            >
              Volgende les →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GRAMMAR + SPEAKING LESSON STAGES (Les 4-5) ───────────────────────────────

interface GrammarFaseProps {
  sentences: Sentence[];
  onBack: () => void;
  onNext: () => void;
}

function GrammarFase1({ rule, onBack, onNext }: { rule: any; onBack: () => void; onNext: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col pb-24">
      <LessenHeader currentStep={1} onBack={onBack} backText="Lessen" />
      <div className="bg-[var(--primary)] px-5 py-5 text-white select-none">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">GRAMMATICA (Gramer Dersi)</p>
        <h2 className="text-lg font-extrabold mt-0.5">{rule.title}</h2>
      </div>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <h3 className="font-extrabold text-sm text-[var(--accent)] mb-2 uppercase tracking-wider">Uitleg (Açıklama)</h3>
          <p className="text-sm font-semibold text-[var(--text)] leading-relaxed mb-3">{rule.explanation}</p>
          <p className="text-xs text-[var(--text-muted)] italic leading-relaxed border-t border-[var(--border)] pt-3">
            {rule.explanationTranslations?.tr}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-black text-xs uppercase tracking-widest text-[var(--text-muted)]">Stappen (Adımlar)</h3>
          {rule.steps.map((step: any, idx: number) => (
            <div key={idx} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
              <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-wider block mb-1">
                {step.label}
              </span>
              <pre className="text-xs font-mono text-[var(--text)] whitespace-pre-wrap leading-relaxed mb-3 bg-[var(--surface-2)] p-3 rounded-xl border border-[var(--border)]/50">
                {step.text}
              </pre>
              <pre className="text-[11px] font-mono text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed">
                {step.translations?.tr}
              </pre>
            </div>
          ))}
        </div>
      </main>

      <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] sticky bottom-0 z-40">
        <button
          onClick={onNext}
          className="w-full max-w-lg mx-auto bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none flex items-center justify-center gap-2"
        >
          Spreekpratiğe Başla →
        </button>
      </div>
    </div>
  );
}

function GrammarFase2({ sentences, onBack, onNext }: GrammarFaseProps) {
  const [index, setIndex] = useState(0);
  const currentSentence = sentences[index];

  const playTTS = () => {
    if (!currentSentence) return;
    const utterance = new SpeechSynthesisUtterance(currentSentence.nl);
    utterance.lang = "nl-NL";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (currentSentence) {
      setTimeout(playTTS, 300);
    }
  }, [index, sentences]);

  const handleNext = () => {
    if (index < sentences.length - 1) {
      setIndex(index + 1);
    } else {
      onNext?.();
    }
  };

  if (!currentSentence) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col pb-24">
      <LessenHeader currentStep={2} onBack={onBack} />
      
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col justify-center items-center gap-8">
        <div className="text-center select-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1 rounded-full">
            Luister & Spreek (Dinle ve Konuş)
          </span>
          <p className="text-xs text-[var(--text-muted)] mt-3">Cümleyi dinleyin ve yüksek sesle tekrar edin.</p>
        </div>

        <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-md flex flex-col items-center gap-6">
          <button
            onClick={playTTS}
            className="w-16 h-16 rounded-full bg-[var(--primary)] text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center shadow-lg border-none cursor-pointer"
          >
            <span className="text-2xl">🔊</span>
          </button>

          <div className="text-center flex flex-col gap-2">
            <h3 className="text-xl font-bold text-[var(--text)] tracking-tight px-4 leading-normal">
              {currentSentence.nl}
            </h3>
            <p className="text-sm text-[var(--text-muted)] font-semibold mt-2 px-4 leading-relaxed">
              {currentSentence.tr}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-black tracking-widest text-[var(--text-muted)] uppercase">
          {index + 1} / {sentences.length}
        </span>
      </main>

      <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] sticky bottom-0 z-40">
        <button
          onClick={handleNext}
          className="w-full max-w-lg mx-auto bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none flex items-center justify-center gap-2"
        >
          Tekrar Ettim (İleri) →
        </button>
      </div>
    </div>
  );
}

function GrammarFase3({ sentences, onBack, onNext }: GrammarFaseProps) {
  const [index, setIndex] = useState(0);
  const currentSentence = sentences[index % sentences.length];
  
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const initChallenge = () => {
    if (!currentSentence) return;
    const cleanNl = currentSentence.nl.replace(/[.,!?;:]/g, "");
    const words = cleanNl.split(/\s+/).filter(Boolean);
    setSelectedWords([]);
    setAvailableWords(shuffleArray(words));
    setChecked(false);
  };

  useEffect(() => {
    initChallenge();
  }, [index, sentences]);

  const handleWordClick = (word: string, isFromSelected: boolean) => {
    if (checked) return;
    if (isFromSelected) {
      setSelectedWords((prev) => prev.filter((w) => w !== word));
      setAvailableWords((prev) => [...prev, word]);
    } else {
      setAvailableWords((prev) => prev.filter((w) => w !== word));
      setSelectedWords((prev) => [...prev, word]);
    }
  };

  const handleCheck = () => {
    if (!currentSentence) return;
    const cleanTarget = normalizeAnswer(currentSentence.nl);
    const cleanUser = normalizeAnswer(selectedWords.join(" "));
    const correct = cleanUser === cleanTarget;
    setIsCorrect(correct);
    setChecked(true);
  };

  const handleNext = () => {
    if (index < Math.min(sentences.length - 1, 4)) {
      setIndex(index + 1);
    } else {
      onNext?.();
    }
  };

  if (!currentSentence) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col pb-24">
      <LessenHeader currentStep={3} onBack={onBack} />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col justify-between gap-6">
        <div className="text-center select-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1 rounded-full">
            Zin Bouwen (Cümle Kurma)
          </span>
          <p className="text-xs text-[var(--text-muted)] mt-3">Kelimeleri doğru sırayla yerleştirerek cümleyi kurun.</p>
        </div>

        <div className="bg-[var(--surface-2)] border border-[var(--border)]/70 rounded-2xl p-5 text-center font-bold text-sm text-[var(--text)] select-none leading-relaxed">
          {currentSentence.tr}
        </div>

        <div className="min-h-[70px] border-2 border-dashed border-[var(--border)] rounded-2xl p-4 flex flex-wrap gap-2 items-center bg-[var(--surface)] shadow-xs">
          {selectedWords.map((word, idx) => (
            <button
              key={idx}
              onClick={() => handleWordClick(word, true)}
              className="bg-[var(--primary)] text-white border-none rounded-xl px-3.5 py-2 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              {word}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 justify-center p-4 min-h-[80px]">
          {availableWords.map((word, idx) => (
            <button
              key={idx}
              onClick={() => handleWordClick(word, false)}
              className="bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs font-bold shadow-xs hover:border-[var(--accent)]/30 active:scale-95 transition-all cursor-pointer"
            >
              {word}
            </button>
          ))}
        </div>

        {checked && (
          <div className={`p-4 rounded-2xl text-center text-xs font-bold border ${
            isCorrect 
              ? "bg-[var(--success-soft)] border-[var(--success)]/20 text-[var(--success)]" 
              : "bg-[var(--danger-soft)] border-[var(--danger)]/20 text-[var(--danger)]"
          }`}>
            {isCorrect ? "✓ Harika! Doğru cümle." : `✗ Yanlış. Doğru cevap: ${currentSentence.nl}`}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {!checked ? (
            <button
              onClick={handleCheck}
              disabled={selectedWords.length === 0}
              className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 disabled:opacity-50 active:scale-95 transition-all cursor-pointer border-none"
            >
              Kontrol Et
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full bg-[var(--success)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
            >
              Sıradaki →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function GrammarFase4({ sentences, onBack, onNext }: GrammarFaseProps) {
  const [index, setIndex] = useState(0);
  const currentSentence = sentences[index % sentences.length];
  const [revealed, setRevealed] = useState(false);

  const handleNext = () => {
    setRevealed(false);
    if (index < Math.min(sentences.length - 1, 4)) {
      setIndex(index + 1);
    } else {
      onNext?.();
    }
  };

  if (!currentSentence) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col pb-24">
      <LessenHeader currentStep={4} onBack={onBack} />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col justify-between gap-6">
        <div className="text-center select-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1 rounded-full">
            Snelronde (Hız Pratiği)
          </span>
          <p className="text-xs text-[var(--text-muted)] mt-3">Hollandaca cümlenin anlamını tahmin edin ve kartı çevirin.</p>
        </div>

        <div
          onClick={() => setRevealed(!revealed)}
          className="cursor-pointer select-none relative h-52 w-full border border-[var(--border)] rounded-3xl overflow-hidden bg-[var(--surface)] shadow-md flex items-center justify-center p-6 text-center"
        >
          {revealed ? (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-wider block">Anlamı:</span>
              <p className="text-lg font-bold text-[var(--text)] leading-relaxed">{currentSentence.tr}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wider block">Nederlands:</span>
              <p className="text-xl font-bold text-[var(--text)] leading-normal">{currentSentence.nl}</p>
              <span className="text-[9px] text-[var(--text-muted)] opacity-50 italic mt-4 block">Çevirisini görmek için dokunun</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {revealed ? (
            <div className="flex gap-3">
              <button
                onClick={handleNext}
                className="flex-1 bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/15 py-4 rounded-xl font-bold uppercase text-xs hover:bg-[var(--danger-soft)]/80 active:scale-95 transition-all cursor-pointer"
              >
                Yanlış Bildim
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-[var(--success)] text-white border-none py-4 rounded-xl font-bold uppercase text-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              >
                Doğru Bildim ✓
              </button>
            </div>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
            >
              Kartı Çevir
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function GrammarFase5({ 
  sentences, 
  nextLesId, 
  etappeId, 
  onComplete 
}: { 
  sentences: Sentence[]; 
  nextLesId: string | null; 
  etappeId: string; 
  onComplete: (score: number, total: number) => void;
}) {
  const router = useRouter();
  
  const [questions, setQuestions] = useState<Array<{ question: string; answer: string; options: string[]; tr: string }>>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [checked, setChecked] = useState(false);
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    const selected = shuffleArray(sentences).slice(0, 3);
    const generated = selected.map(s => {
      const words = s.nl.split(/\s+/).filter(Boolean);
      let targetIndex = Math.floor(words.length / 2);
      if (words.length > 2) {
        let maxLen = 0;
        words.forEach((w, i) => {
          const cleanW = w.replace(/[.,!?;:]/g, "");
          if (cleanW.length > maxLen) {
            maxLen = cleanW.length;
            targetIndex = i;
          }
        });
      }

      const answer = words[targetIndex].replace(/[.,!?;:]/g, "");
      words[targetIndex] = "_______";
      const question = words.join(" ");

      const options = [answer];
      const otherWords: string[] = [];
      sentences.forEach(oth => {
        oth.nl.split(/\s+/).forEach(w => {
          const clean = w.replace(/[.,!?;:]/g, "");
          if (clean.length > 2 && clean.toLowerCase() !== answer.toLowerCase() && !options.includes(clean)) {
            otherWords.push(clean);
          }
        });
      });

      const shuffledOthers = shuffleArray(otherWords).slice(0, 3);
      shuffledOthers.forEach(w => options.push(w));
      
      while (options.length < 4) {
        options.push("niet", "goed", "huis", "werk");
      }

      return {
        question,
        answer,
        options: shuffleArray(options),
        tr: s.tr
      };
    });
    setQuestions(generated);
  }, [sentences]);

  const handleOptionClick = (opt: string) => {
    if (checked) return;
    setSelectedOption(opt);
  };

  const handleCheck = () => {
    if (selectedOption === questions[qIndex].answer) {
      setQuizScore(prev => prev + 1);
    }
    setChecked(true);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setChecked(false);
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      setQuizDone(true);
      onComplete(quizScore, questions.length);
    }
  };

  if (questions.length === 0) return null;

  if (quizDone) {
    const stars = quizScore >= 3 ? 3 : quizScore >= 2 ? 2 : 1;
    
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col pb-24 select-none">
        <header className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3.5 shadow-sm text-center">
          <h1 className="text-base font-black tracking-wider uppercase text-[var(--text)]">Ders Tamamlandı!</h1>
        </header>

        <main className="flex-grow max-w-lg mx-auto w-full px-5 py-8 flex flex-col items-center justify-center gap-6">
          <div className="text-5xl animate-bounce">🏆</div>
          
          <div className="text-center">
            <h2 className="text-2xl font-black text-[var(--text)]">Gefeliciteerd! (Tebrikler!)</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1 font-semibold">Gramer ve Konuşma dersini başarıyla tamamladınız.</p>
          </div>

          <div className="flex gap-2">
            {[0, 1, 2].map((s) => (
              <span
                key={s}
                className="text-3xl"
                style={{
                  color: s < stars ? "var(--warning)" : "var(--text-muted)",
                  opacity: s < stars ? 1 : 0.2,
                }}
              >
                ★
              </span>
            ))}
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 w-full text-center">
            <p className="text-xs text-[var(--text-muted)] font-black uppercase">Skorunuz</p>
            <p className="text-xl font-bold text-[var(--text)] mt-1">{quizScore} / {questions.length} Doğru</p>
          </div>
        </main>

        <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] z-40 p-3 shadow-md pb-[env(safe-area-inset-bottom)] flex gap-3 select-none">
          <div className="w-full max-w-lg mx-auto flex gap-3">
            <Link
              href="/lessen"
              className="flex-1 bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] py-4 rounded-xl font-bold uppercase tracking-wider text-xs hover:opacity-90 active:scale-95 transition-all text-center block"
            >
              ← Leerpad (Müfredat)
            </Link>
            {nextLesId ? (
              <Link
                href={`/lessen/${nextLesId}?etappe=${etappeId}&nr=${parseInt(nextLesId.slice(-1), 10)}`}
                className="flex-1 bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-xs hover:opacity-95 active:scale-95 transition-all text-center block"
              >
                Sıradaki Ders →
              </Link>
            ) : (
              <button
                onClick={() => router.push("/")}
                className="flex-1 bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-xs hover:opacity-95 active:scale-95 transition-all text-center border-none cursor-pointer"
              >
                Ana Sayfa
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[qIndex];

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col pb-24">
      <LessenHeader currentStep={5} onBack={() => {}} />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col justify-between gap-6">
        <div className="text-center select-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1 rounded-full">
            Les Quiz (Ders Testi)
          </span>
          <p className="text-xs text-[var(--text-muted)] mt-3">Boşluğu doğru kelimeyle doldurun.</p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <p className="text-sm font-semibold text-[var(--text-muted)] italic leading-relaxed text-center">
            "{currentQ.tr}"
          </p>
          <h3 className="text-base font-bold text-[var(--text)] text-center leading-normal mt-2">
            {currentQ.question}
          </h3>
        </div>

        <div className="flex flex-col gap-2.5">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const isAnswer = opt === currentQ.answer;
            
            let btnClass = "bg-[var(--surface)] text-[var(--text)] border-[var(--border)]";
            if (isSelected) {
              btnClass = "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary)]/30";
            }
            if (checked) {
              if (isAnswer) {
                btnClass = "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/30 font-bold";
              } else if (isSelected) {
                btnClass = "bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]/30";
              } else {
                btnClass = "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] opacity-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(opt)}
                disabled={checked}
                className={`w-full text-left p-4 rounded-xl text-xs font-bold border transition-all active:scale-99 cursor-pointer ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {checked && (
          <div className={`p-4 rounded-2xl text-center text-xs font-bold border ${
            selectedOption === currentQ.answer 
              ? "bg-[var(--success-soft)] border-[var(--success)]/20 text-[var(--success)]" 
              : "bg-[var(--danger-soft)] border-[var(--danger)]/20 text-[var(--danger)]"
          }`}>
            {selectedOption === currentQ.answer 
              ? "✓ Doğru cevap!" 
              : `✗ Yanlış. Doğru cevap: ${currentQ.answer}`}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {!checked ? (
            <button
              onClick={handleCheck}
              disabled={!selectedOption}
              className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 disabled:opacity-50 active:scale-95 transition-all cursor-pointer border-none"
            >
              Kontrol Et
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full bg-[var(--success)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none"
            >
              {qIndex < questions.length - 1 ? "Sıradaki Soru →" : "Dersi Bitir 🏁"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
