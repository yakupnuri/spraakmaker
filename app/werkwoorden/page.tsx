"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress, useMoedertaal } from "@/lib/hooks";
import { levenshtein } from "@/lib/hooks";
import type { Verb } from "@/lib/types";
import {
  GRAMMAR_STEPS,
  FREQ_ORDER_REGELMATIG,
  FREQ_ORDER_ONREGELMATIG,
  type GrammarRule,
} from "@/lib/grammarData";
import { IconArrowRight, IconCheck, IconX } from "@/components/Icons";

type Filter = "REGELMATIG" | "ONREGELMATIG" | "SCHEIDBAAR";
type PageMode = "GRAMMATICA" | "OEFEN" | "QUIZ";
type FormTarget = "imperfectum_s" | "imperfectum_p" | "perfectum";

const FILTERS: Filter[] = ["REGELMATIG", "ONREGELMATIG", "SCHEIDBAAR"];
const PRACTICE_REQUIRED = 10;


function sortByFrequency(verbs: Verb[], freqList: string[]): Verb[] {
  return [
    ...freqList.map((name) => verbs.find((v) => v.infinitief === name)).filter(Boolean) as Verb[],
    ...verbs.filter((v) => !freqList.includes(v.infinitief)),
  ];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── SoftKetchup helpers ─────────────────────────────────────────────────────

const RULE_LETTERS = ["ch", "s", "f", "t", "k", "p"]; // ch first — longer match wins

function isRuleLetter(s: string) {
  return RULE_LETTERS.includes(s.toLowerCase());
}

// "SoFTKeTCHuP" — big letters red, fillers gray
function SoftKetchupWord() {
  const chars: [string, boolean][] = [
    ["S", true], ["o", false], ["F", true], ["T", true],
    ["K", true], ["e", false], ["T", true], ["CH", true],
    ["u", false], ["P", true],
  ];
  return (
    <div className="flex items-baseline gap-0 my-4">
      {chars.map(([ch, isRule], i) => (
        <span
          key={i}
          className={
            isRule
              ? "text-4xl font-bold text-[var(--ds-red)] leading-none"
              : "text-xl font-medium text-[var(--ds-black)] opacity-20 leading-none"
          }
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

// "S · F · T · K · CH · P" — each letter red, dots gray
function RuleLetterList({ line }: { line: string }) {
  const parts = line.trim().split(" · ");
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i}>
          <span className="font-bold text-[var(--ds-red)]">{part}</span>
          {i < parts.length - 1 && (
            <span className="opacity-30 mx-1">·</span>
          )}
        </span>
      ))}
    </span>
  );
}

// Color only the last letter(s) of a word if it's a rule letter
function ColoredWord({ word }: { word: string }) {
  const lower = word.toLowerCase();
  // Check digraph at end first, then single letter
  const lastTwo = lower.slice(-2);
  const lastOne = lower.slice(-1);

  let body: string;
  let tail: string;
  let ruleMatch: boolean;

  if (isRuleLetter(lastTwo) && lastTwo.length === 2) {
    body = word.slice(0, -2);
    tail = word.slice(-2);
    ruleMatch = true;
  } else if (isRuleLetter(lastOne)) {
    body = word.slice(0, -1);
    tail = word.slice(-1);
    ruleMatch = true;
  } else {
    body = word;
    tail = "";
    ruleMatch = false;
  }

  return (
    <span>
      {body}
      {ruleMatch && (
        <span className="font-bold text-[var(--ds-red)]">{tail}</span>
      )}
    </span>
  );
}

// Render one line with smart coloring:
// - "S · F · T · K · CH · P" style → RuleLetterList
// - verb example lines → color stems + parens
// - anything else → plain
function SmartLine({ line }: { line: string }) {
  // Dot-separated rule letter list: "S · F · T · K · CH · P"
  if (/^[SFTKCHP](\s·\s[SFTKCHP]+)+$/.test(line.trim())) {
    return (
      <span>
        {"  "}
        <RuleLetterList line={line.trim()} />
      </span>
    );
  }

  // Verb example lines: "  werk  (k)  → werkte"
  // Pattern: leading spaces, word, spaces, (letter), spaces, →, spaces, conjugated
  const verbMatch = line.match(/^(\s*)(\w+)(\s+)\((\w+)\)(\s+→\s+)(\w+)(.*)$/);
  if (verbMatch) {
    const [, indent, stem, sp1, parenLetter, arrow, conj, rest] = verbMatch;
    const parenIsRule = isRuleLetter(parenLetter);
    return (
      <span>
        {indent}
        <ColoredWord word={stem} />
        {sp1}
        {"("}
        <span className={parenIsRule ? "font-bold text-[var(--ds-red)]" : "opacity-50"}>
          {parenLetter}
        </span>
        {")"}
        {arrow}
        <ColoredWord word={conj} />
        {rest}
      </span>
    );
  }

  return <span>{line}</span>;
}

// Full step text renderer
function StepText({ text }: { text: string }) {
  if (!text.startsWith("SoFTKeTCHuP")) {
    return (
      <div className="text-sm text-[var(--ds-black)] font-sans leading-relaxed">
        {text.split("\n").map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            <SmartLine line={line} />
          </div>
        ))}
      </div>
    );
  }

  const lines = text.split("\n");
  const rest = lines.slice(1); // skip first line "SoFTKeTCHuP"

  return (
    <div>
      <SoftKetchupWord />
      <div className="text-sm text-[var(--ds-black)] font-sans leading-relaxed">
        {rest.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            <SmartLine line={line} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Grammar explanation component ───────────────────────────────────────────

function LangToggle({
  langNL,
  moedertaal,
  hasTranslation,
  onToggle,
}: {
  langNL: boolean;
  moedertaal: string;
  hasTranslation: boolean;
  onToggle: () => void;
}) {
  if (!hasTranslation) return null;
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          e.preventDefault();
          onToggle();
        }
      }}
      title={langNL ? "Lees in jouw taal" : "Lees in het Nederlands"}
      className={`flex items-center gap-[3px] px-2 py-1 border-[2px] text-[9px] font-bold uppercase tracking-widest cursor-pointer transition-colors border-none inline-flex ${
        langNL
          ? "bg-[var(--ds-gray)] text-[var(--ds-black)] border-[var(--ds-black)] hover:bg-[var(--ds-yellow)]"
          : "bg-[var(--ds-yellow)] text-[var(--ds-black)] border-[var(--ds-black)]"
      }`}
    >
      <span className={langNL ? "opacity-40" : "font-bold"}>NL</span>
      <span className="opacity-30">/</span>
      <span className={!langNL ? "opacity-40" : "font-bold"}>{moedertaal.toUpperCase()}</span>
    </span>
  );
}

function GrammarPanel({ rule }: { rule: GrammarRule }) {
  const [openStep, setOpenStep] = useState(0);
  const [langNL, setLangNL] = useState(true);
  const { moedertaal } = useMoedertaal();

  // Check if moedertaal translations exist for this rule
  const hasExplanationTr = !!rule.explanationTranslations?.[moedertaal];
  const hasTipTr = !!rule.tipTranslations?.[moedertaal];

  const explanationText =
    !langNL && hasExplanationTr
      ? rule.explanationTranslations[moedertaal]
      : rule.explanation;

  const tipText =
    !langNL && hasTipTr
      ? rule.tipTranslations![moedertaal]
      : rule.tip;

  return (
    <div className="flex flex-col gap-[3px]">
      {/* Intro */}
      <div className="bg-[var(--ds-blue)] border-[3px] border-[var(--ds-black)] p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">
            UITLEG
          </p>
          {hasExplanationTr && (
            <button
              onClick={() => setLangNL((v) => !v)}
              title={langNL ? "Lees in jouw taal" : "Lees in het Nederlands"}
              className={`flex items-center gap-[3px] px-2 py-1 text-[9px] font-bold uppercase tracking-widest cursor-pointer border-none transition-colors ${
                langNL
                  ? "bg-[rgba(255,255,255,0.15)] text-[var(--ds-white)] hover:bg-[rgba(255,255,255,0.3)]"
                  : "bg-[var(--ds-yellow)] text-[var(--ds-black)]"
              }`}
            >
              <span className={langNL ? "opacity-60" : "font-bold"}>NL</span>
              <span className="opacity-40 mx-0.5">/</span>
              <span className={!langNL ? "opacity-60" : "font-bold"}>{moedertaal.toUpperCase()}</span>
            </button>
          )}
        </div>
        <p className="text-[var(--ds-white)] text-sm leading-relaxed">{explanationText}</p>
      </div>

      {/* Steps accordion */}
      {rule.steps.map((step, i) => {
        const stepHasTr = !!step.translations?.[moedertaal];
        const stepText =
          !langNL && stepHasTr ? step.translations[moedertaal] : step.text;

        return (
          <div key={i} className="border-[3px] border-[var(--ds-black)]">
            <button
              onClick={() => setOpenStep(openStep === i ? -1 : i)}
              className={`w-full flex items-center justify-between px-4 py-4 text-left font-bold text-sm cursor-pointer border-none transition-colors ${
                openStep === i
                  ? "bg-[var(--ds-black)] text-[var(--ds-white)]"
                  : "bg-[var(--ds-white)] text-[var(--ds-black)] hover:bg-[var(--ds-gray)]"
              }`}
            >
              <span className="uppercase tracking-wide flex-1">{step.label}</span>
              <div className="flex items-center gap-2">
                {stepHasTr && openStep === i && (
                  <LangToggle
                    langNL={langNL}
                    moedertaal={moedertaal}
                    hasTranslation={stepHasTr}
                    onToggle={() => setLangNL((v) => !v)}
                  />
                )}
                <span className="text-lg leading-none w-5 text-center">
                  {openStep === i ? "−" : "+"}
                </span>
              </div>
            </button>
            {openStep === i && (
              <div className="bg-[var(--ds-white)] px-4 py-4 border-t-[3px] border-[var(--ds-black)]">
                {stepHasTr && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">
                      {langNL ? "NEDERLANDS" : moedertaal.toUpperCase()}
                    </span>
                    <button
                      onClick={() => setLangNL((v) => !v)}
                      className={`flex items-center gap-[3px] px-2 py-1 text-[9px] font-bold uppercase tracking-widest cursor-pointer border-[2px] border-[var(--ds-black)] transition-colors ${
                        langNL
                          ? "bg-[var(--ds-white)] text-[var(--ds-black)] hover:bg-[var(--ds-gray)]"
                          : "bg-[var(--ds-yellow)] text-[var(--ds-black)]"
                      }`}
                    >
                      <span className={langNL ? "opacity-40" : "font-bold"}>NL</span>
                      <span className="opacity-30 mx-0.5">/</span>
                      <span className={!langNL ? "opacity-40" : "font-bold"}>
                        {moedertaal.toUpperCase()}
                      </span>
                    </button>
                  </div>
                )}
                <StepText text={stepText} />
              </div>
            )}
          </div>
        );
      })}

      {/* Conjugation table */}
      <div className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] overflow-x-auto">
        <div className="p-4 border-b-[3px] border-[var(--ds-black)]">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60">VOORBEELDTABEL</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--ds-gray)]">
              {[
                rule.exampleHeaders?.col1 ?? "INFINITIEF",
                rule.exampleHeaders?.col2 ?? "STAM",
                rule.exampleHeaders?.col3 ?? "IMPERF. ENK.",
                rule.exampleHeaders?.col4 ?? "IMPERF. MV.",
                rule.exampleHeaders?.col5 ?? "PERFECTUM",
              ].map((h, idx, arr) => (
                <th
                  key={idx}
                  className={`text-left px-3 py-2 font-bold border-b-[3px] text-xs uppercase tracking-widest ${
                    idx < arr.length - 1 ? "border-r-[3px]" : ""
                  } border-[var(--ds-black)]`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rule.examples.map((ex, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-[var(--ds-white)]" : "bg-[var(--ds-gray)]"}>
                <td className="px-3 py-2 font-bold border-r-[3px] border-[var(--ds-black)] border-b-[2px]">
                  {ex.infinitief}
                </td>
                <td className="px-3 py-2 border-r-[3px] border-[var(--ds-black)] border-b-[2px] opacity-70">
                  {ex.stam}
                </td>
                <td className="px-3 py-2 border-r-[3px] border-[var(--ds-black)] border-b-[2px]">
                  {ex.imperf_s}
                </td>
                <td className="px-3 py-2 border-r-[3px] border-[var(--ds-black)] border-b-[2px]">
                  {ex.imperf_p}
                </td>
                <td className="px-3 py-2 border-b-[2px]">{ex.perfectum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tip */}
      {rule.tip && (
        <div className="bg-[var(--ds-yellow)] border-[3px] border-[var(--ds-black)] p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-60">
              TIP
            </p>
            {hasTipTr && (
              <button
                onClick={() => setLangNL((v) => !v)}
                className={`flex items-center gap-[3px] px-2 py-1 text-[9px] font-bold uppercase tracking-widest cursor-pointer border-[2px] border-[var(--ds-black)] transition-colors ${
                  langNL
                    ? "bg-[rgba(0,0,0,0.08)] text-[var(--ds-black)] hover:bg-[rgba(0,0,0,0.15)]"
                    : "bg-[var(--ds-black)] text-[var(--ds-white)]"
                }`}
              >
                <span className={langNL ? "opacity-40" : "font-bold"}>NL</span>
                <span className="opacity-30 mx-0.5">/</span>
                <span className={!langNL ? "opacity-40" : "font-bold"}>
                  {moedertaal.toUpperCase()}
                </span>
              </button>
            )}
          </div>
          <p className="text-sm font-medium text-[var(--ds-black)]">{tipText}</p>
        </div>
      )}
    </div>
  );
}

// ─── Grammar sequence (6 pedagogische stappen) ───────────────────────────────

const TOPIC_ACCENT_COLORS = [
  "var(--ds-blue)",    // 1 Tegenwoordige tijd
  "var(--ds-red)",     // 2 Perfectum
  "var(--ds-yellow)",  // 3 Imperfectum
  "var(--ds-black)",   // 4 Modaal
  "var(--ds-blue)",    // 5 Scheidbaar
  "var(--ds-red)",     // 6 Bijzinnen
];

function GrammarSequence({ onStartOefen }: { onStartOefen: () => void }) {
  const [openTopic, setOpenTopic] = useState(0);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-[3px] p-4">
        {GRAMMAR_STEPS.map((rule, i) => {
          const accent = TOPIC_ACCENT_COLORS[i];
          const isOpen = openTopic === i;
          const isYellow = accent === "var(--ds-yellow)";
          return (
            <div key={i} className="border-[3px] border-[var(--ds-black)]">
              <button
                onClick={() => setOpenTopic(isOpen ? -1 : i)}
                className={`w-full flex items-center gap-3 px-4 py-4 text-left cursor-pointer border-none transition-colors ${
                  isOpen
                    ? "bg-[var(--ds-black)] text-[var(--ds-white)]"
                    : "bg-[var(--ds-white)] text-[var(--ds-black)] hover:bg-[var(--ds-gray)]"
                }`}
              >
                <span
                  className="text-xs font-bold w-6 h-6 flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isOpen ? "rgba(255,255,255,0.15)" : accent,
                    color: isOpen ? "var(--ds-white)" : isYellow ? "var(--ds-black)" : "var(--ds-white)",
                  }}
                >
                  {i + 1}
                </span>
                <span className="font-bold text-sm uppercase tracking-wide flex-1">{rule.title}</span>
                <span className="text-lg leading-none w-5 text-center">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="border-t-[3px] border-[var(--ds-black)]">
                  <GrammarPanel rule={rule} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t-[3px] border-[var(--ds-black)] mx-4 mb-4">
        <button
          onClick={onStartOefen}
          className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-5 font-bold uppercase tracking-widest border-none cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center gap-3 mt-[3px]"
        >
          Begin met oefenen
          <IconArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

// ─── Practice / Quiz component ────────────────────────────────────────────────

function PracticeQuiz({
  verbs,
  isQuiz,
  practiceCount,
  onPracticeComplete,
}: {
  verbs: Verb[];
  isQuiz: boolean;
  practiceCount: number;
  onPracticeComplete: () => void;
}) {
  const { progress, updateProgress } = useProgress();
  const [queue, setQueue] = useState<Verb[]>([]);
  const [current, setCurrent] = useState<Verb | null>(null);
  const [formTarget, setFormTarget] = useState<FormTarget>("imperfectum_s");
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [scores, setScores] = useState({ goed: 0, fout: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = shuffle([...verbs]);
    setQueue(q);
    setSessionCount(0);
    setScores({ goed: 0, fout: 0 });
  }, [verbs, isQuiz]);

  useEffect(() => {
    if (queue.length) nextVerb(queue, 0);
  }, [queue]);

  function nextVerb(q: Verb[], count: number) {
    const v = q[count % q.length];
    setCurrent(v);
    const forms: FormTarget[] = ["imperfectum_s", "imperfectum_p", "perfectum"];
    const weak = progress.verbs[v?.infinitief]?.weakForm;
    // weakForm stores "imperfectum" or "perfectum" from older saves — map to FormTarget
    const resolvedWeak: FormTarget | null =
      weak === "perfectum" ? "perfectum" : null;
    setFormTarget(resolvedWeak ?? forms[Math.floor(Math.random() * forms.length)]);
    setInput("");
    setFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function check() {
    if (!current || feedback) return;
    const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
    const target = norm(current[formTarget] ?? "");
    const correct = target.length > 0 && levenshtein(norm(input), target) <= 1;

    setFeedback(correct ? "correct" : "wrong");
    const newCount = sessionCount + 1;
    setSessionCount(newCount);
    setScores((s) => ({ goed: s.goed + (correct ? 1 : 0), fout: s.fout + (correct ? 0 : 1) }));

    const prev = progress.verbs[current.infinitief] ?? {
      correct: 0, wrong: 0, lastAttempt: "", weakForm: null,
    };
    updateProgress((p) => ({
      ...p,
      verbs: {
        ...p.verbs,
        [current.infinitief]: {
          correct: prev.correct + (correct ? 1 : 0),
          wrong: prev.wrong + (correct ? 0 : 1),
          lastAttempt: new Date().toISOString(),
          weakForm: (correct ? null : formTarget) as "imperfectum" | "perfectum" | null,
        },
      },
      games: {
        ...p.games,
        totalPoints: p.games.totalPoints + (correct ? 10 : 0),
        lastPlayDate: new Date().toISOString(),
      },
    }));

    setTimeout(() => {
      if (!isQuiz && newCount >= PRACTICE_REQUIRED) {
        onPracticeComplete();
        return;
      }
      nextVerb(queue, newCount);
    }, correct ? 700 : 1300);
  }

  const FORM_LABELS: Record<FormTarget, string> = {
    imperfectum_s: "imperfectum (enkelvoud)",
    imperfectum_p: "imperfectum (meervoud)",
    perfectum: "perfectum",
  };

  if (!current) return null;

  const progress_pct = isQuiz ? 0 : Math.min((sessionCount / PRACTICE_REQUIRED) * 100, 100);

  return (
    <div className="flex flex-col">
      {/* Practice progress bar */}
      {!isQuiz && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-widest opacity-50">
              OEFENEN
            </span>
            <span className="text-xs font-bold opacity-40">
              {sessionCount}/{PRACTICE_REQUIRED}
            </span>
          </div>
          <div className="w-full h-[6px] bg-[var(--ds-gray)]">
            <div
              className="h-full bg-[var(--ds-blue)] transition-all duration-300"
              style={{ width: `${progress_pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col p-4 gap-4">
        {/* Verb card */}
        <div className="bg-[var(--ds-blue)] border-[3px] border-[var(--ds-black)] p-6 text-center">
          <p className="text-4xl font-bold text-[var(--ds-white)]">{current.infinitief}</p>
          <p className="text-sm text-[var(--ds-white)] opacity-50 mt-2">{current.tr}</p>
        </div>

        {/* Form to fill */}
        <div className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] p-5">
          <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-3">
            SCHRIJF DE {FORM_LABELS[formTarget].toUpperCase()}:
          </p>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            disabled={!!feedback}
            placeholder={`${current.infinitief} → ?`}
            className="w-full bg-transparent outline-none font-bold text-xl border-b-[3px] border-[var(--ds-black)] pb-2 placeholder:opacity-20"
          />
        </div>

        {/* Conjugation reference (show all when feedback) */}
        {feedback && (
          <div className="grid grid-cols-3 gap-[3px] bg-[var(--ds-black)]">
            {(["imperfectum_s", "imperfectum_p", "perfectum"] as FormTarget[]).map((f) => (
              <div
                key={f}
                className={`p-3 text-center ${
                  formTarget === f
                    ? feedback === "correct"
                      ? "bg-[var(--ds-blue)]"
                      : "bg-[var(--ds-red)]"
                    : "bg-[var(--ds-white)]"
                }`}
              >
                <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${
                  formTarget === f ? "text-[var(--ds-white)] opacity-70" : "opacity-40"
                }`}>
                  {f === "imperfectum_s" ? "IMPERF. ENK." : f === "imperfectum_p" ? "IMPERF. MV." : "PERFECTUM"}
                </p>
                <p className={`text-sm font-bold ${formTarget === f ? "text-[var(--ds-white)]" : ""}`}>
                  {current[f]}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`border-[3px] border-[var(--ds-black)] px-4 py-3 font-bold text-sm ${
                feedback === "correct"
                  ? "bg-[var(--ds-blue)] text-[var(--ds-white)]"
                  : "bg-[var(--ds-red)] text-[var(--ds-white)]"
              }`}
            >
              {feedback === "correct"
                ? "Goed!"
                : `Fout — ${FORM_LABELS[formTarget]}: ${current[formTarget]}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controleer button */}
      <div className="border-t-[3px] border-[var(--ds-black)]">
        <button
          onClick={check}
          disabled={!input.trim() || !!feedback}
          className="w-full bg-[var(--ds-blue)] text-[var(--ds-white)] py-5 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-40"
        >
          Controleer
        </button>
      </div>

      {/* Score strip */}
      <div className="flex border-t-[3px] border-[var(--ds-black)]">
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-blue)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-xl font-bold text-[var(--ds-white)]">{scores.goed}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">GOED</span>
        </div>
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-red)]">
          <span className="text-xl font-bold text-[var(--ds-white)]">{scores.fout}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">FOUT</span>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz unlocked screen ─────────────────────────────────────────────────────

function QuizUnlocked({ onStart }: { onStart: () => void }) {
  return (
    <div className="p-4 flex flex-col gap-[3px]">
      <div className="bg-[var(--ds-yellow)] border-[3px] border-[var(--ds-black)] p-6">
        <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">GOED GEDAAN</p>
        <p className="text-2xl font-bold">10 oefeningen voltooid!</p>
        <p className="text-sm opacity-60 mt-2">Je kunt nu de quiz starten. Succes!</p>
      </div>
      <button
        onClick={onStart}
        className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-5 font-bold uppercase tracking-widest border-none cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center gap-3"
      >
        Start quiz
        <IconArrowRight size={20} />
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WerkwoordenPage() {
  const [filter, setFilter] = useState<Filter>("REGELMATIG");
  const [pageMode, setPageMode] = useState<PageMode>("GRAMMATICA");
  const [verbs, setVerbs] = useState<Verb[]>([]);
  const [practiceUnlocked, setPracticeUnlocked] = useState(false);
  const [quizUnlocked, setQuizUnlocked] = useState(false);
  const [showQuizReady, setShowQuizReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const FILE_MAP: Record<Filter, string> = {
    REGELMATIG: "/data/verbs-regelmatig.json",
    ONREGELMATIG: "/data/verbs-onregelmatig.json",
    SCHEIDBAAR: "/data/verbs-scheidbaar.json",
  };

  useEffect(() => {
    setLoading(true);
    setPageMode("GRAMMATICA");
    setPracticeUnlocked(false);
    setQuizUnlocked(false);
    setShowQuizReady(false);

    fetch(FILE_MAP[filter])
      .then((r) => r.json())
      .then((data: any[]) => {
        let processed: Verb[] = data;
        if (filter === "SCHEIDBAAR") {
          processed = data.map((v) => ({
            infinitief: v.verb ?? v.infinitief ?? "",
            tr: v.tr ?? "",
            en: "",
            imperfectum_s: "",
            imperfectum_p: "",
            perfectum: "",
          }));
        }
        const freqList =
          filter === "REGELMATIG"
            ? FREQ_ORDER_REGELMATIG
            : filter === "ONREGELMATIG"
            ? FREQ_ORDER_ONREGELMATIG
            : [];
        setVerbs(sortByFrequency(processed.filter((v) => v.infinitief), freqList));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  const TABS: { key: PageMode; label: string; locked: boolean }[] = [
    { key: "GRAMMATICA", label: "Grammatica", locked: false },
    { key: "OEFEN", label: "Oefen", locked: false },
    { key: "QUIZ", label: "Quiz", locked: !quizUnlocked },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header — bg-ds-black */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">werkwoorden</span>
        <span className="text-sm font-bold text-[var(--ds-white)] opacity-60">{verbs.length} werkwoorden</span>
      </div>

      {/* Mode tabs */}
      <div className="flex border-b-[3px] border-[var(--ds-black)]">
        {TABS.map(({ key, label, locked }, i) => (
          <button
            key={key}
            onClick={() => !locked && setPageMode(key)}
            disabled={locked}
            className={[
              "flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors border-none",
              i > 0 ? "border-l-[3px] border-[var(--ds-black)]" : "",
              locked ? "opacity-30 cursor-not-allowed bg-[var(--ds-gray)]" : "cursor-pointer",
              !locked && pageMode === key
                ? "bg-[var(--ds-blue)] text-[var(--ds-white)]"
                : !locked
                ? "bg-[var(--ds-white)] hover:bg-[var(--ds-gray)]"
                : "",
            ].join(" ")}
          >
            {label} {locked ? "🔒" : ""}
          </button>
        ))}
      </div>

      {/* Category filter — only for Oefen & Quiz */}
      {pageMode !== "GRAMMATICA" && (
        <div className="flex border-b-[3px] border-[var(--ds-black)]">
          {FILTERS.map((f, i) => {
            // Active color per category type
            const activeColor =
              f === "SCHEIDBAAR" ? "bg-[var(--ds-red)] text-[var(--ds-white)]" :
              "bg-[var(--ds-blue)] text-[var(--ds-white)]";
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer border-none transition-colors",
                  i > 0 ? "border-l-[3px] border-[var(--ds-black)]" : "",
                  filter === f
                    ? activeColor
                    : "bg-[var(--ds-white)] text-[var(--ds-black)] hover:bg-[var(--ds-gray)]",
                ].join(" ")}
              >
                {f}
              </button>
            );
          })}
        </div>
      )}

      {pageMode === "GRAMMATICA" ? (
        <GrammarSequence onStartOefen={() => setPageMode("OEFEN")} />
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm font-bold uppercase tracking-widest opacity-40">Laden…</p>
        </div>
      ) : pageMode === "OEFEN" ? (
        showQuizReady ? (
          <QuizUnlocked
            onStart={() => {
              setQuizUnlocked(true);
              setShowQuizReady(false);
              setPageMode("QUIZ");
            }}
          />
        ) : (
          <PracticeQuiz
            verbs={verbs}
            isQuiz={false}
            practiceCount={0}
            onPracticeComplete={() => setShowQuizReady(true)}
          />
        )
      ) : (
        <PracticeQuiz
          verbs={verbs}
          isQuiz={true}
          practiceCount={0}
          onPracticeComplete={() => {}}
        />
      )}
    </div>
  );
}
