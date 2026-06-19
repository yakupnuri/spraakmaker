"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress } from "@/lib/hooks";
import { VOEGWOORDEN_SECTIONS, type VoegwoordSection, type VoegwoordItem } from "@/lib/voegwoordenData";
import { IconArrowRight, IconCheck, IconX } from "@/components/Icons";

type PageMode = "LEER" | "OEFEN";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const COLOR_MAP = {
  blue: {
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    gradient: "from-blue-600 to-indigo-600",
    accent: "text-blue-600 dark:text-blue-400",
    lightBg: "bg-blue-500/5 dark:bg-blue-500/10",
    border: "border-blue-100 dark:border-blue-900/30",
  },
  red: {
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    gradient: "from-rose-600 to-pink-600",
    accent: "text-rose-600 dark:text-rose-400",
    lightBg: "bg-rose-500/5 dark:bg-rose-500/10",
    border: "border-rose-100 dark:border-rose-900/30",
  },
  yellow: {
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    gradient: "from-amber-500 to-orange-600",
    accent: "text-amber-600 dark:text-amber-400",
    lightBg: "bg-amber-500/5 dark:bg-amber-500/10",
    border: "border-amber-100 dark:border-amber-900/30",
  },
  black: {
    badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
    gradient: "from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950",
    accent: "text-slate-700 dark:text-slate-300",
    lightBg: "bg-slate-500/5 dark:bg-slate-500/10",
    border: "border-slate-200 dark:border-slate-800",
  },
};

function RevealableText({ text, isAdvanced }: { text: string; isAdvanced: boolean }) {
  const [revealed, setRevealed] = useState(false);
  if (!isAdvanced) return <>{text}</>;
  if (revealed) return <>{text}</>;
  return (
    <button
      onClick={() => setRevealed(true)}
      className="text-xs font-bold text-[var(--accent)] hover:underline border-none bg-none p-0 cursor-pointer text-left inline-block"
      style={{ background: 'none', border: 'none', padding: 0 }}
    >
      [toon vertaling]
    </button>
  );
}

// ─── Learn card for one item ──────────────────────────────────────────────────

function LearnCard({
  item,
  color,
  isAdvanced,
  displayMode,
}: {
  item: VoegwoordItem;
  color: keyof typeof COLOR_MAP;
  isAdvanced: boolean;
  displayMode: "NL_TR" | "TR_NL";
}) {
  const c = COLOR_MAP[color];
  const isNlFirst = displayMode === "NL_TR";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="border border-[var(--border)] rounded-3xl bg-[var(--surface)] p-5 flex flex-col gap-4 shadow-[0_4px_12px_rgba(15,23,42,0.01)] hover:shadow-md transition-all select-none"
    >
      {/* Kelime ve Çeviri Üst Alanı */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-black text-xl text-[var(--text)] tracking-tight">
              {isNlFirst ? item.nl : item.tr}
            </span>
            {item.note && isNlFirst && (
              <span className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${c.badge}`}>
                {item.note}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-[var(--text-muted)]">
            <RevealableText text={isNlFirst ? item.tr : item.nl} isAdvanced={isAdvanced} />
          </p>
        </div>
      </div>

      {/* Örnek Cümle Kutusu (Görsel ve pedagojik olarak doğrudan açık ve net) */}
      <div className={`pl-4 border-l-4 ${color === "blue" ? "border-blue-500" : color === "red" ? "border-rose-500" : color === "yellow" ? "border-amber-500" : "border-slate-500"} py-2 flex flex-col gap-1 bg-[var(--surface-2)]/30 rounded-r-2xl pr-3`}>
        <span className="text-[9px] font-black tracking-widest text-[var(--text-muted)] uppercase">Voorbeeld (Örnek)</span>
        <p className="font-extrabold text-[var(--text)] text-sm leading-snug">
          {isNlFirst ? item.example_nl : item.example_tr}
        </p>
        <p className="text-xs text-[var(--text-muted)] font-medium leading-snug">
          <RevealableText text={isNlFirst ? item.example_tr : item.example_nl} isAdvanced={isAdvanced} />
        </p>
      </div>
    </motion.div>
  );
}

// ─── Section learn view ───────────────────────────────────────────────────────

function SectionLearn({
  section,
  onStartOefenen,
  isAdvanced,
  displayMode,
}: {
  section: VoegwoordSection;
  onStartOefenen: () => void;
  isAdvanced: boolean;
  displayMode: "NL_TR" | "TR_NL";
}) {
  const c = COLOR_MAP[section.color];

  return (
    <div className="flex flex-col gap-5">
      {/* Açıklama ve Kural Kartı */}
      <div className={`rounded-3xl border ${c.border} ${c.lightBg} p-6 shadow-sm text-sm leading-relaxed relative overflow-hidden flex flex-col gap-3.5`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${c.accent}`}>UITLEG (Açıklama)</span>
        </div>
        <p className="font-bold text-[var(--text)] leading-relaxed">{section.explanation}</p>
        {section.structureNote && (
          <div className="mt-1 px-4 py-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
            <span className="text-[9px] font-black tracking-widest text-[var(--text-muted)] uppercase block mb-1">Cümle Yapısı Formülü</span>
            <p className="text-xs font-mono font-bold leading-normal text-[var(--text)]">{section.structureNote}</p>
          </div>
        )}
      </div>

      {/* Diller/Kartlar Listesi */}
      <div className="flex flex-col gap-4">
        {section.items.map((item, i) => (
          <LearnCard key={i} item={item} color={section.color} isAdvanced={isAdvanced} displayMode={displayMode} />
        ))}
      </div>

      {/* Pratik Yap Butonu */}
      <button
        onClick={onStartOefenen}
        className="w-full bg-[var(--primary)] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:opacity-95 active:scale-95 transition-all border-none cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-[0_4px_12px_rgba(0,173,181,0.2)]"
      >
        Oefen nu (Pratik Yap)
        <IconArrowRight size={14} />
      </button>
    </div>
  );
}

// ─── Practice quiz ────────────────────────────────────────────────────────────

function buildQuizItems(section: VoegwoordSection) {
  return section.items
    .filter((item) => item.example_nl.includes(item.nl.split(" ")[0]))
    .map((item) => {
      const target = item.nl.split(" ")[0]; // first word
      const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const gapped = item.example_nl.replace(new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "i"), "___");
      if (!gapped.includes("___")) return null;

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

function SectionOefenen({
  section,
  onBack,
  isAdvanced,
}: {
  section: VoegwoordSection;
  onBack: () => void;
  isAdvanced: boolean;
}) {
  const { updateProgress } = useProgress();
  const [items] = useState(() => shuffle(buildQuizItems(section)));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [scores, setScores] = useState({ goed: 0, fout: 0 });
  const [hintRevealed, setHintRevealed] = useState(false);

  if (!items.length) {
    return (
      <div className="p-8 text-center select-none bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-sm flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Geen oefeningen beschikbaar</p>
        <button onClick={onBack} className="text-xs font-bold uppercase tracking-widest underline cursor-pointer bg-transparent border-none text-[var(--primary)] hover:opacity-80 transition-opacity">
          Terug naar overzicht
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
      setHintRevealed(false);
    }, 1000);
  }

  const progress_pct = Math.min((index / items.length) * 100, 100);

  return (
    <div className="flex flex-col gap-4">
      {/* İlerleme Kartı */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm select-none">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">{section.title}</span>
          <span className="text-xs font-bold text-[var(--text-muted)]">{Math.min(index + 1, items.length)} / {items.length}</span>
        </div>
        <div className="w-full h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progress_pct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Çeviri İpucu Kartı */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-1.5">VERTALING (Çeviri)</p>
          {isAdvanced && !hintRevealed ? (
            <button
              onClick={() => setHintRevealed(true)}
              className="text-xs font-bold text-[var(--primary)] hover:underline border-none bg-none p-0 cursor-pointer block text-left"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              [göster]
            </button>
          ) : (
            <p className="text-sm font-extrabold text-[var(--text)] leading-relaxed">{current.hint}</p>
          )}
        </div>

        {/* Boşluklu Cümle Sorusu Kartı */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-7 rounded-3xl shadow-sm min-h-[140px] flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4 select-none">KIES HET JUISTE WOORD (Doğru Kelimeyi Seçin)</p>
          <p className="text-lg font-black leading-relaxed text-[var(--text)]">
            {current.gapped.split("___").map((part: string, i: number, arr: string[]) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span
                    className={`inline-block border-b-2 px-2 pb-0.5 mx-1 font-black min-w-[80px] text-center transition-colors ${
                      feedback === "correct"
                        ? "border-[var(--success)] text-[var(--success)]"
                        : feedback === "wrong"
                        ? "border-[var(--danger)] text-[var(--danger)]"
                        : "border-[var(--text)] text-[var(--accent)]"
                    }`}
                  >
                    {selected ?? "___"}
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>

        {/* Geri Bildirim Mesajı */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`border p-4 rounded-2xl font-black text-xs uppercase tracking-wider text-center select-none ${
                feedback === "correct"
                  ? "bg-[var(--success-soft)] border-[var(--success)]/10 text-[var(--success)]"
                  : "bg-[var(--danger-soft)] border-[var(--danger)]/10 text-[var(--danger)]"
              }`}
            >
              {feedback === "correct" ? "Goed gedaan! ✓" : `Fout ✗ — Cevap: ${current.answer}`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Seçenekler Grid'i */}
        <div className="grid grid-cols-2 gap-3">
          {current.options.map((opt: string) => {
            const isSelected = selected === opt;
            const isCorrect = opt === current.answer;
            
            let btnClass = "bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent)] hover:shadow-sm";
            if (isSelected && feedback === "correct") {
              btnClass = "bg-[var(--success)] text-white border-transparent shadow-[0_4px_12px_rgba(34,197,94,0.3)]";
            } else if (isSelected && feedback === "wrong") {
              btnClass = "bg-[var(--danger)] text-white border-transparent shadow-[0_4px_12px_rgba(239,68,68,0.3)]";
            } else if (!isSelected && feedback && isCorrect) {
              btnClass = "bg-[var(--success)] text-white border-transparent shadow-[0_4px_12px_rgba(34,197,94,0.3)]";
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={!!feedback}
                className={`py-4 px-4 font-black text-sm border rounded-2xl cursor-pointer transition-all active:scale-98 disabled:pointer-events-none shadow-[0_4px_10px_rgba(0,0,0,0.01)] ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Skor ve Geri Dönüş Şeridi */}
      <div className="flex gap-3 border border-[var(--border)] rounded-3xl overflow-hidden bg-[var(--surface)] p-2.5 shadow-sm select-none items-center mt-2">
        <div className="flex-grow flex gap-2">
          <div className="flex-1 py-2.5 rounded-2xl flex flex-col items-center bg-[var(--success-soft)] text-[var(--success)]">
            <span className="text-base font-black font-mono leading-none">{scores.goed}</span>
            <span className="text-[7px] font-black uppercase tracking-widest opacity-80 mt-1">DOĞRU</span>
          </div>
          <div className="flex-1 py-2.5 rounded-2xl flex flex-col items-center bg-[var(--danger-soft)] text-[var(--danger)]">
            <span className="text-base font-black font-mono leading-none">{scores.fout}</span>
            <span className="text-[7px] font-black uppercase tracking-widest opacity-80 mt-1">YANLIŞ</span>
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-4 rounded-2xl bg-[var(--surface-2)] text-[var(--text)] hover:opacity-90 transition-opacity border-none font-black text-xs uppercase tracking-wider cursor-pointer"
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
  const [displayMode, setDisplayMode] = useState<"NL_TR" | "TR_NL">("NL_TR");
  const [isAdvanced, setIsAdvanced] = useState(false);

  useEffect(() => {
    const level = localStorage.getItem("spraakmaker-niveau");
    if (level === "B1" || level === "B2") {
      setIsAdvanced(true);
    }
  }, []);

  const section = VOEGWOORDEN_SECTIONS.find((s) => s.id === activeSection)!;
  const c = COLOR_MAP[section.color];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      {/* Premium Header */}
      <div className={`mx-4 mt-6 p-6 rounded-3xl bg-gradient-to-r ${c.gradient} text-white shadow-md relative overflow-hidden select-none`}>
        <div className="absolute right-4 bottom-0 opacity-10 text-8xl pointer-events-none font-black">
          🔗
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full self-start">
          Grammatica (Dil Bilgisi)
        </span>
        <h1 className="text-2xl font-black tracking-tight mt-3">Voegwoorden & Voorzetsels</h1>
        <p className="text-xs text-white/80 mt-1 font-semibold leading-relaxed">
          Bağlaçlar ve edatları öğrenin, cümle yapılarını ve kelime sıralamasını pratik yapın.
        </p>
      </div>

      {/* Pill Tabs — Horizontal Scroll */}
      <div className="flex bg-transparent overflow-x-auto select-none scrollbar-none px-4 py-3 mt-3 gap-2">
        {VOEGWOORDEN_SECTIONS.map((s) => {
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); setMode("LEER"); }}
              className={`flex-shrink-0 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all border whitespace-nowrap ${
                active 
                  ? "bg-[var(--primary)] text-white border-transparent shadow-md" 
                  : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {s.title.split("(")[0].split("—")[0].trim()}
            </button>
          );
        })}
      </div>

      {/* Switcher Bar (Tasarımı premium, dili tersyüz eden buton) */}
      {mode === "LEER" && (
        <div className="flex justify-end px-4 py-1 select-none">
          <button
            onClick={() => setDisplayMode((prev) => (prev === "NL_TR" ? "TR_NL" : "NL_TR"))}
            className="flex items-center gap-2 bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all shadow-[0_4px_10px_rgba(0,0,0,0.01)] active:scale-95 cursor-pointer"
          >
            <span>🔄 Yön:</span>
            <span className="text-[var(--primary)]">
              {displayMode === "NL_TR" ? "NL ➔ TR" : "TR ➔ NL"}
            </span>
          </button>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-4 py-2 w-full max-w-lg mx-auto">
        {mode === "LEER" ? (
          <SectionLearn
            section={section}
            onStartOefenen={() => setMode("OEFEN")}
            isAdvanced={isAdvanced}
            displayMode={displayMode}
          />
        ) : (
          <SectionOefenen
            section={section}
            onBack={() => setMode("LEER")}
            isAdvanced={isAdvanced}
          />
        )}
      </main>
    </div>
  );
}
