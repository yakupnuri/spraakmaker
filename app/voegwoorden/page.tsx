"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress } from "@/lib/hooks";
import { VOEGWOORDEN_SECTIONS, type VoegwoordSection, type VoegwoordItem } from "@/lib/voegwoordenData";
import { IconArrowRight, IconCheck, IconX } from "@/components/Icons";

type PageMode = "LEER" | "OEFEN";

const COLOR_MAP = {
  blue: {
    bg: "bg-[var(--ds-blue)]",
    text: "text-[var(--ds-white)]",
    border: "border-[var(--ds-blue)]",
    badge: "bg-[var(--ds-blue)] text-[var(--ds-white)]",
  },
  red: {
    bg: "bg-[var(--ds-red)]",
    text: "text-[var(--ds-white)]",
    border: "border-[var(--ds-red)]",
    badge: "bg-[var(--ds-red)] text-[var(--ds-white)]",
  },
  yellow: {
    bg: "bg-[var(--ds-yellow)]",
    text: "text-[var(--ds-black)]",
    border: "border-[var(--ds-yellow)]",
    badge: "bg-[var(--ds-yellow)] text-[var(--ds-black)]",
  },
  black: {
    bg: "bg-[var(--ds-black)]",
    text: "text-[var(--ds-white)]",
    border: "border-[var(--ds-black)]",
    badge: "bg-[var(--ds-black)] text-[var(--ds-white)]",
  },
};

// ─── Learn card for one item ──────────────────────────────────────────────────

function LearnCard({ item, color }: { item: VoegwoordItem; color: keyof typeof COLOR_MAP }) {
  const [showExample, setShowExample] = useState(false);
  const c = COLOR_MAP[color];

  return (
    <div className="border-[3px] border-[var(--ds-black)] flex flex-col">
      {/* NL + TR */}
      <div className="flex items-stretch">
        <div className={`${c.bg} ${c.text} px-4 py-4 min-w-[120px] flex flex-col justify-center border-r-[3px] border-[var(--ds-black)]`}>
          <span className="font-bold text-base">{item.nl}</span>
          {item.note && (
            <span className={`text-[10px] mt-1 ${c.text} opacity-60 font-bold uppercase tracking-wide`}>
              {item.note}
            </span>
          )}
        </div>
        <div className="flex-1 bg-[var(--ds-white)] px-4 py-4 flex flex-col justify-center">
          <span className="font-medium text-[var(--ds-black)]">{item.tr}</span>
        </div>
      </div>

      {/* Example (toggle) */}
      <div className="border-t-[3px] border-[var(--ds-black)]">
        <button
          onClick={() => setShowExample((s) => !s)}
          className="w-full px-4 py-2 bg-[var(--ds-gray)] text-left text-xs font-bold uppercase tracking-widest flex items-center justify-between cursor-pointer border-none hover:bg-[var(--ds-white)] transition-colors"
        >
          <span>Voorbeeld</span>
          <span>{showExample ? "−" : "+"}</span>
        </button>
        {showExample && (
          <div className="px-4 py-3 bg-[var(--ds-white)] border-t-[2px] border-[var(--ds-black)]">
            <p className="font-medium text-[var(--ds-black)] text-sm">{item.example_nl}</p>
            <p className="text-xs text-[var(--ds-black)] opacity-50 mt-1">{item.example_tr}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section learn view ───────────────────────────────────────────────────────

function SectionLearn({
  section,
  onStartOefenen,
}: {
  section: VoegwoordSection;
  onStartOefenen: () => void;
}) {
  const c = COLOR_MAP[section.color];

  return (
    <div className="flex flex-col gap-[3px]">
      {/* Header */}
      <div className={`${c.bg} ${c.text} border-[3px] border-[var(--ds-black)] p-5`}>
        <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">UITLEG</p>
        <p className="text-sm leading-relaxed">{section.explanation}</p>
        {section.structureNote && (
          <div className="mt-3 px-3 py-2 bg-black bg-opacity-20">
            <p className="text-xs font-bold font-mono">{section.structureNote}</p>
          </div>
        )}
      </div>

      {/* Items */}
      {section.items.map((item, i) => (
        <LearnCard key={i} item={item} color={section.color} />
      ))}

      {/* Oefenen button */}
      <button
        onClick={onStartOefenen}
        className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-5 font-bold uppercase tracking-widest border-none cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center gap-3"
      >
        Oefen nu
        <IconArrowRight size={20} />
      </button>
    </div>
  );
}

// ─── Practice quiz ────────────────────────────────────────────────────────────

function buildQuizItems(section: VoegwoordSection) {
  // For each example sentence, create a gap-fill question
  return section.items
    .filter((item) => item.example_nl.includes(item.nl.split(" ")[0]))
    .map((item) => {
      const target = item.nl.split(" ")[0]; // first word
      const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const gapped = item.example_nl.replace(new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "i"), "___");
      if (!gapped.includes("___")) return null;

      // Distractors: other items in section
      const others = section.items
        .map((x) => x.nl.split(" ")[0])
        .filter((w) => w.toLowerCase() !== target.toLowerCase());

      const distractors = shuffle(others).slice(0, 3);
      if (distractors.length < 3) return null;

      return {
        gapped,
        hint: item.example_tr,
        answer: target,
        options: shuffle([target, ...distractors]),
        tr: item.tr,
      };
    })
    .filter(Boolean) as Array<{
    gapped: string;
    hint: string;
    answer: string;
    options: string[];
    tr: string;
  }>;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function SectionOefenen({
  section,
  onBack,
}: {
  section: VoegwoordSection;
  onBack: () => void;
}) {
  const { updateProgress } = useProgress();
  const [items] = useState(() => shuffle(buildQuizItems(section)));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [scores, setScores] = useState({ goed: 0, fout: 0 });
  const c = COLOR_MAP[section.color];

  if (!items.length) {
    return (
      <div className="p-6">
        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Geen oefeningen beschikbaar</p>
        <button onClick={onBack} className="mt-4 text-xs font-bold uppercase tracking-widest underline cursor-pointer bg-transparent border-none">
          Terug
        </button>
      </div>
    );
  }

  const current = items[index % items.length];

  function handleSelect(opt: string) {
    if (feedback) return;
    setSelected(opt);
    const correct = opt === current.answer;
    setFeedback(correct ? "correct" : "wrong");
    setScores((s) => ({ goed: s.goed + (correct ? 1 : 0), fout: s.fout + (correct ? 0 : 1) }));
    if (correct) {
      updateProgress((p) => ({
        ...p,
        games: {
          ...p.games,
          totalPoints: p.games.totalPoints + 10,
          lastPlayDate: new Date().toISOString(),
        },
      }));
    }
    setTimeout(() => {
      setIndex((i) => i + 1);
      setSelected(null);
      setFeedback(null);
    }, 1000);
  }

  const progress_pct = Math.min((index / items.length) * 100, 100);

  return (
    <div className="flex flex-col">
      {/* Progress */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-widest opacity-50">{section.title}</span>
          <span className="text-xs font-bold opacity-40">{Math.min(index + 1, items.length)}/{items.length}</span>
        </div>
        <div className="w-full h-[6px] bg-[var(--ds-gray)]">
          <div
            className={`h-full transition-all duration-300 ${c.bg}`}
            style={{ width: `${progress_pct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col p-4 gap-4">
        {/* Translation hint */}
        <div className="bg-[var(--ds-gray)] border-[3px] border-[var(--ds-black)] p-3">
          <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">VERTALING</p>
          <p className="text-sm font-medium">{current.hint}</p>
        </div>

        {/* Sentence with gap */}
        <div className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] p-5">
          <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-3">KIES HET JUISTE WOORD</p>
          <p className="text-base font-medium leading-relaxed">
            {current.gapped.split("___").map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span
                    className={`inline-block border-b-[3px] px-2 font-bold min-w-[60px] text-center transition-colors ${
                      feedback === "correct"
                        ? "border-[var(--ds-blue)] text-[var(--ds-blue)]"
                        : feedback === "wrong"
                        ? "border-[var(--ds-red)] text-[var(--ds-red)]"
                        : "border-[var(--ds-black)]"
                    }`}
                  >
                    {selected ?? "___"}
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>

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
              {feedback === "correct" ? "Goed!" : `Fout — het antwoord is: ${current.answer}`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options */}
        <div className="grid grid-cols-2 gap-[3px] bg-[var(--ds-black)]">
          {current.options.map((opt) => {
            const isSelected = selected === opt;
            const isCorrect = opt === current.answer;
            let bg = "bg-[var(--ds-white)] hover:bg-[var(--ds-gray)]";
            if (isSelected && feedback === "correct") bg = "bg-[var(--ds-blue)]";
            if (isSelected && feedback === "wrong") bg = "bg-[var(--ds-red)]";
            if (!isSelected && feedback && isCorrect) bg = "bg-[var(--ds-blue)]";
            const textWhite = (isSelected || (!!feedback && isCorrect)) && feedback !== null;

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={!!feedback}
                className={`py-5 font-bold text-sm border-none cursor-pointer transition-colors disabled:cursor-default ${bg} ${
                  textWhite ? "text-[var(--ds-white)]" : "text-[var(--ds-black)]"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Score strip */}
      <div className="flex border-t-[3px] border-[var(--ds-black)] mt-2">
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-blue)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-xl font-bold text-[var(--ds-white)]">{scores.goed}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">GOED</span>
        </div>
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-red)]">
          <span className="text-xl font-bold text-[var(--ds-white)]">{scores.fout}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">FOUT</span>
        </div>
        <button
          onClick={onBack}
          className="px-5 bg-[var(--ds-gray)] border-l-[3px] border-[var(--ds-black)] text-xs font-bold uppercase tracking-widest cursor-pointer border-t-0 border-b-0 border-r-0 hover:bg-[var(--ds-white)] transition-colors"
        >
          ← Terug
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VoegwoordenPage() {
  const [activeSection, setActiveSection] = useState<string>(VOEGWOORDEN_SECTIONS[0].id);
  const [mode, setMode] = useState<PageMode>("LEER");

  const section = VOEGWOORDEN_SECTIONS.find((s) => s.id === activeSection)!;
  const c = COLOR_MAP[section.color];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header */}
      <div className={`${c.bg} ${c.text} border-b-[3px] border-[var(--ds-black)] px-5 py-5`}>
        <span className="text-xs font-bold uppercase tracking-widest opacity-70">GRAMMATICA</span>
        <h1 className="text-2xl font-bold mt-0.5">Voegwoorden & Voorzetsels</h1>
      </div>

      {/* Section tabs — horizontal scroll */}
      <div className="flex border-b-[3px] border-[var(--ds-black)] overflow-x-auto">
        {VOEGWOORDEN_SECTIONS.map((s, i) => {
          const sc = COLOR_MAP[s.color];
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); setMode("LEER"); }}
              className={[
                "flex-shrink-0 px-4 py-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer border-none transition-colors whitespace-nowrap",
                i > 0 ? "border-l-[3px] border-[var(--ds-black)]" : "",
                active ? `${sc.bg} ${sc.text}` : "bg-[var(--ds-white)] text-[var(--ds-black)] hover:bg-[var(--ds-gray)]",
              ].join(" ")}
            >
              {s.title.split("(")[0].split("—")[0].trim()}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {mode === "LEER" ? (
          <SectionLearn
            section={section}
            onStartOefenen={() => setMode("OEFEN")}
          />
        ) : (
          <SectionOefenen
            section={section}
            onBack={() => setMode("LEER")}
          />
        )}
      </div>
    </div>
  );
}
