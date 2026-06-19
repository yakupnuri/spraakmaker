"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMoedertaal } from "@/lib/hooks";
import type { GrammarRule } from "@/lib/grammarData";
import LangToggle from "./LangToggle";

const RULE_LETTERS = ["ch", "s", "f", "t", "k", "p"];

function isRuleLetter(s: string) {
  return RULE_LETTERS.includes(s.toLowerCase());
}

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
              ? "text-4xl font-bold text-[var(--danger)] leading-none"
              : "text-xl font-medium text-[var(--text)] opacity-20 leading-none"
          }
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

function RuleLetterList({ line }: { line: string }) {
  const parts = line.trim().split(" · ");
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i}>
          <span className="font-bold text-[var(--danger)]">{part}</span>
          {i < parts.length - 1 && (
            <span className="opacity-30 mx-1">·</span>
          )}
        </span>
      ))}
    </span>
  );
}

function ColoredWord({ word }: { word: string }) {
  const lower = word.toLowerCase();
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
        <span className="font-bold text-[var(--danger)]">{tail}</span>
      )}
    </span>
  );
}

function SmartLine({ line }: { line: string }) {
  if (/^[SFTKCHP](\s·\s[SFTKCHP]+)+$/.test(line.trim())) {
    return (
      <span>
        {"  "}
        <RuleLetterList line={line.trim()} />
      </span>
    );
  }

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
        <span className={parenIsRule ? "font-bold text-[var(--danger)]" : "opacity-50"}>
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

function StepText({ text }: { text: string }) {
  if (!text.startsWith("SoFTKeTCHuP")) {
    return (
      <div className="text-sm text-[var(--text)] font-sans leading-relaxed">
        {text.split("\n").map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            <SmartLine line={line} />
          </div>
        ))}
      </div>
    );
  }

  const lines = text.split("\n");
  const rest = lines.slice(1);

  return (
    <div>
      <SoftKetchupWord />
      <div className="text-sm text-[var(--text)] font-sans leading-relaxed">
        {rest.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            <SmartLine line={line} />
          </div>
        ))}
      </div>
    </div>
  );
}

function IconBook({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconChevron({ open, size = 18 }: { open: boolean; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.25 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </motion.svg>
  );
}

interface GrammarPanelProps {
  rule: GrammarRule;
  accentColor: string;
}

export default function GrammarPanel({ rule, accentColor }: GrammarPanelProps) {
  const [openStep, setOpenStep] = useState(0);
  const [langNL, setLangNL] = useState(true);
  const { moedertaal } = useMoedertaal();

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
    <div className="flex flex-col gap-3 p-4">
      {/* Intro Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl overflow-hidden bg-[var(--primary)]"
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                <IconBook size={13} />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
                UITLEG / AÇIKLAMA
              </p>
            </div>
            {hasExplanationTr && (
              <LangToggle
                langNL={langNL}
                moedertaal={moedertaal}
                hasTranslation={hasExplanationTr}
                onToggle={() => setLangNL((v) => !v)}
              />
            )}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#fff' }}>{explanationText}</p>
        </div>
      </motion.div>

      {/* Steps accordion */}
      <div className="flex flex-col gap-2">
        {rule.steps.map((step, i) => {
          const stepHasTr = !!step.translations?.[moedertaal];
          const stepText =
            !langNL && stepHasTr ? step.translations[moedertaal] : step.text;
          const isOpen = openStep === i;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-[var(--border)] rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenStep(isOpen ? -1 : i)}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-left font-bold text-sm cursor-pointer border-none transition-all duration-200 ${
                  isOpen
                    ? "bg-[var(--primary)] text-[var(--surface)]"
                    : "bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span
                    className="text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      backgroundColor: isOpen ? "rgba(255,255,255,0.15)" : accentColor,
                      color: isOpen ? "var(--surface)" : accentColor === "var(--accent)" ? "var(--text)" : "white",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="uppercase tracking-wide text-xs">{step.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconChevron open={isOpen} size={16} />
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[var(--surface)] px-4 py-4 border-t border-[var(--border)]">
                      {stepHasTr && (
                        <div className="flex justify-end mb-3">
                          <LangToggle
                            langNL={langNL}
                            moedertaal={moedertaal}
                            hasTranslation={stepHasTr}
                            onToggle={() => setLangNL((v) => !v)}
                          />
                        </div>
                      )}
                      <StepText text={stepText} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Conjugation table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-[var(--surface)] flex items-center justify-center text-[9px] font-bold">
              ≡
            </span>
            <p className="text-xs font-bold uppercase tracking-widest opacity-90">
              {langNL ? "VOORBEELDTABEL" : "ÖRNEK TABLO"}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface-2)]">
                {[
                  rule.exampleHeaders?.col1 ?? "INFINITIEF",
                  rule.exampleHeaders?.col2 ?? "STAM",
                  rule.exampleHeaders?.col3 ?? "IMPERF. ENK.",
                  rule.exampleHeaders?.col4 ?? "IMPERF. MV.",
                  rule.exampleHeaders?.col5 ?? "PERFECTUM",
                ].map((h, idx, arr) => (
                  <th
                    key={idx}
                    className={`text-left px-3 py-2.5 font-bold border-b text-[10px] uppercase tracking-widest ${
                      idx < arr.length - 1 ? "border-r" : ""
                    } border-[var(--border)]`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rule.examples.map((ex, i) => (
                <tr
                  key={i}
                  className={`transition-colors ${i % 2 === 0 ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]"} hover:bg-[var(--accent)]/10`}
                >
                  <td className="px-3 py-2.5 font-bold border-r border-[var(--border)] border-b">
                    {ex.infinitief}
                  </td>
                  <td className="px-3 py-2.5 border-r border-[var(--border)] border-b opacity-70">
                    {ex.stam}
                  </td>
                  <td className="px-3 py-2.5 border-r border-[var(--border)] border-b">
                    {ex.imperf_s}
                  </td>
                  <td className="px-3 py-2.5 border-r border-[var(--border)] border-b">
                    {ex.imperf_p}
                  </td>
                  <td className="px-3 py-2.5 border-b">{ex.perfectum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Tip */}
      {rule.tip && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl overflow-hidden border border-[var(--border)]"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent)ee)" }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">💡</span>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text)] opacity-90">
                  TIP
                </p>
              </div>
              {hasTipTr && (
                <LangToggle
                  langNL={langNL}
                  moedertaal={moedertaal}
                  hasTranslation={hasTipTr}
                  onToggle={() => setLangNL((v) => !v)}
                />
              )}
            </div>
            <p className="text-sm font-medium text-[var(--text)]">{tipText}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
