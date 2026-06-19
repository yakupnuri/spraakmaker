"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LangToggle from "./LangToggle";

const PERFECTUM_QUESTIONS: Record<string, { q: { nl: string; tr: string }; opts: string[]; a: number; tr: string }[]> = {
  a1: [
    {
      q: { nl: "Ik ___ gisteren veel gewerkt.", tr: "Ben dün çok ___ ." },
      opts: ["ben", "heb", "had", "was"],
      a: 1,
      tr: "werken → hareketsiz eylem → hebben yardımcı fiili kullanılır"
    },
    {
      q: { nl: "Wij ___ naar Amsterdam gegaan.", tr: "Biz Amsterdam'a ___ ." },
      opts: ["hebben", "zijn", "hadden", "waren"],
      a: 1,
      tr: "gaan → A'dan B'ye hareket → zijn yardımcı fiili kullanılır"
    },
    {
      q: { nl: "Hij ___ ziek geworden.", tr: "O hasta ___ ." },
      opts: ["heeft", "is", "had", "was"],
      a: 1,
      tr: "worden → durum değişimi → zijn yardımcı fiili kullanılır"
    },
    {
      q: { nl: "Jullie ___ thuis gebleven.", tr: "Siz evde ___ ." },
      opts: ["hebben", "zijn", "hadden", "waren"],
      a: 1,
      tr: "blijven → kalmak eylemi her zaman zijn yardımcı fiili alır"
    },
    {
      q: { nl: "Zij ___ een boek gelezen.", tr: "O (kadın) bir kitap ___ ." },
      opts: ["is", "zijn", "heeft", "hebben"],
      a: 2,
      tr: "lezen → hareketsiz eylem → hebben yardımcı fiili kullanılır"
    },
  ],
  a2: [
    {
      q: { nl: "Voltooid deelwoord van 'werken'?", tr: "'werken' fiilinin ortaç (voltooid deelwoord) hali hangisidir?" },
      opts: ["gewerkt", "gewerked", "geworkt", "gewerk"],
      a: 0,
      tr: "k ∈ kofschip → +t takısı gelir → gewerkt"
    },
    {
      q: { nl: "Voltooid deelwoord van 'leven'?", tr: "'leven' fiilinin ortaç (voltooid deelwoord) hali hangisidir?" },
      opts: ["geleefd", "geleeft", "gelevt", "geleved"],
      a: 0,
      tr: "v→f değişimi olur ama v harfi kofschip dışında olduğu için → +d → geleefd"
    },
    {
      q: { nl: "Voltooid deelwoord van 'reizen'?", tr: "'reizen' fiilinin ortaç (voltooid deelwoord) hali hangisidir?" },
      opts: ["gereist", "gereisd", "gereizt", "gereis"],
      a: 1,
      tr: "z→s değişimi olur ama z harfi kofschip dışında olduğu için → +d → gereisd"
    },
    {
      q: { nl: "Voltooid deelwoord van 'verhuizen'?", tr: "'verhuizen' fiilinin ortaç hali hangisidir?" },
      opts: ["geverhuisd", "verhuisd", "verhuist", "geverhuist"],
      a: 1,
      tr: "ver- ön eki olduğundan ge- eklenmez → verhuisd"
    },
  ],
  b1: [
    {
      q: { nl: "Perfectum van 'schrijven'?", tr: "'schrijven' fiilinin perfectum çekimi hangisidir?" },
      opts: ["Ik heb geschreven.", "Ik ben geschreven.", "Ik heb schrijft.", "Ik heb geschrijfd."],
      a: 0,
      tr: "schrijven düzensiz fiildir → haben + geschreven"
    },
    {
      q: { nl: "Perfectum van 'vallen'?", tr: "'vallen' fiilinin perfectum çekimi hangisidir?" },
      opts: ["Ik heb fallen.", "Ik ben gevallen.", "Ik heb gevallend.", "Ik ben gevallend."],
      a: 1,
      tr: "vallen → düşmek (hareket/durum değişimi) → zijn + gevallen"
    },
  ],
  b2: [
    {
      q: { nl: "'Gisteren ___ ik veel ___.' (werken) — correcte volgorde?", tr: "'Dün çok ___ .' (werken = çalışmak) — doğru kelime sırası hangisidir?" },
      opts: ["heb / gewerkt", "gewerkt / heb", "ben / gewerkt", "gewerkt / ben"],
      a: 0,
      tr: "Yardımcı fiil 2. sırada, ortaç (deelwoord) ise cümlenin en sonunda yer alır"
    },
    {
      q: { nl: "Bijzin: 'Hij zegt dat hij gisteren ___.' (werken)", tr: "Yan cümle: 'Dün çalıştığını (___) söylüyor.'" },
      opts: ["heeft gewerkt", "gewerkt heeft", "heb gewerkt", "gewerkt heb"],
      a: 1,
      tr: "Yan cümlede (bijzin) fiiller en sona gider. Sıralama: deelwoord + hulpwerkwoord (gewerkt heeft)"
    },
  ]
};

const ZIJN_VERBS = [
  "gaan", "komen", "rijden", "lopen", "fietsen", "vliegen", "vallen",
  "blijven", "worden", "zijn", "sterven", "trouwen", "vertrekken", "arriveren",
  "beginnen", "stijgen", "dalen", "vluchten", "reizen", "rijzen"
];

const IRREGULAR_PERF: Record<string, { hulp: string; deel: string }> = {
  zijn: { hulp: "zijn", deel: "geweest" },
  hebben: { hulp: "hebben", deel: "gehad" },
  gaan: { hulp: "zijn", deel: "gegaan" },
  komen: { hulp: "zijn", deel: "gekomen" },
  doen: { hulp: "hebben", deel: "gedaan" },
  zien: { hulp: "hebben", deel: "gezien" },
  staan: { hulp: "hebben", deel: "gestaan" },
  slaan: { hulp: "hebben", deel: "geslagen" },
  schrijven: { hulp: "hebben", deel: "geschreven" },
  rijden: { hulp: "hebben", deel: "gereden" },
  blijven: { hulp: "zijn", deel: "gebleven" },
  worden: { hulp: "zijn", deel: "geworden" },
  kijken: { hulp: "hebben", deel: "gekeken" },
  krijgen: { hulp: "hebben", deel: "gekregen" },
  liggen: { hulp: "hebben", deel: "gelegen" },
  zitten: { hulp: "hebben", deel: "gezeten" },
  lezen: { hulp: "hebben", deel: "gelezen" },
  lopen: { hulp: "hebben", deel: "gelopen" },
  vallen: { hulp: "zijn", deel: "gevallen" },
  rijzen: { hulp: "zijn", deel: "gerezen" },
  spreken: { hulp: "hebben", deel: "gesproken" },
  breken: { hulp: "hebben", deel: "gebroken" },
  treffen: { hulp: "hebben", deel: "getroffen" },
  bieden: { hulp: "hebben", deel: "geboden" },
  kiezen: { hulp: "hebben", deel: "gekozen" },
  gieten: { hulp: "hebben", deel: "gegoten" },
  vliegen: { hulp: "zijn", deel: "gevlogen" },
  vertrekken: { hulp: "zijn", deel: "vertrokken" },
  helpen: { hulp: "hebben", deel: "geholpen" },
  vinden: { hulp: "hebben", deel: "gevonden" },
  binden: { hulp: "hebben", deel: "gebonden" },
  zingen: { hulp: "hebben", deel: "gezongen" },
  drinken: { hulp: "hebben", deel: "gedronken" },
  winnen: { hulp: "hebben", deel: "gewonnen" },
  beginnen: { hulp: "zijn", deel: "begonnen" },
  nemen: { hulp: "hebben", deel: "genomen" },
  geven: { hulp: "hebben", deel: "gegeven" },
  eten: { hulp: "hebben", deel: "gegeten" },
  vergeten: { hulp: "hebben", deel: "vergeten" },
  treden: { hulp: "zijn", deel: "getreden" },
  weten: { hulp: "hebben", deel: "geweten" },
  snijden: { hulp: "hebben", deel: "gesneden" },
  rijten: { hulp: "hebben", deel: "gereten" }
};

const IRREG_LIST = [
  { inf: "gaan", tr: "gitmek", hulp: "zijn", deel: "gegaan" },
  { inf: "komen", tr: "gelmek", hulp: "zijn", deel: "gekomen" },
  { inf: "zijn", tr: "olmak", hulp: "zijn", deel: "geweest" },
  { inf: "hebben", tr: "sahip olmak", hulp: "hebben", deel: "gehad" },
  { inf: "doen", tr: "yapmak", hulp: "hebben", deel: "gedaan" },
  { inf: "zien", tr: "görmek", hulp: "hebben", deel: "gezien" },
  { inf: "schrijven", tr: "yazmak", hulp: "hebben", deel: "geschreven" },
  { inf: "rijden", tr: "araba sürmek", hulp: "hebben", deel: "gereden" },
  { inf: "blijven", tr: "kalmak", hulp: "zijn", deel: "gebleven" },
  { inf: "worden", tr: "olmak/dönüşmek", hulp: "zijn", deel: "geworden" },
  { inf: "kijken", tr: "bakmak", hulp: "hebben", deel: "gekeken" },
  { inf: "krijgen", tr: "almak", hulp: "hebben", deel: "gekregen" },
  { inf: "lopen", tr: "yürümek", hulp: "hebben", deel: "gelopen" },
  { inf: "vallen", tr: "düşmek", hulp: "zijn", deel: "gevallen" },
  { inf: "spreken", tr: "konuşmak", hulp: "hebben", deel: "gesproken" },
  { inf: "kiezen", tr: "seçmek", hulp: "hebben", deel: "gekozen" },
];

const KOFSCHIP = ["t", "k", "f", "s", "ch", "p"];
const ORIG_V = ["leven", "geven", "rijven", "blijven", "schrijven", "drijven", "wrijven"];
const ORIG_Z = ["reizen", "prijzen", "wijzen", "blazen", "razen", "vriezen", "kiezen"];

const KNOWN_STEMS_LOCAL: Record<string, string> = {
  werken: "werk", maken: "maak", lopen: "loop", lezen: "lees",
  leven: "leef", reizen: "reis", zetten: "zet", bidden: "bid"
};

function isVowel(c: string) { return "aeiou".includes(c); }

function getStemLocal(v: string): string {
  v = v.trim().toLowerCase();
  if (KNOWN_STEMS_LOCAL[v]) return KNOWN_STEMS_LOCAL[v];
  if (!v.endsWith("en")) return v;
  
  let base = v.slice(0, -2);
  if (base.endsWith("v")) base = base.slice(0, -1) + "f";
  if (base.endsWith("z")) base = base.slice(0, -1) + "s";
  
  const last = base[base.length - 1];
  const secondLast = base[base.length - 2];
  if (last && secondLast && last === secondLast && !isVowel(last)) {
    base = base.slice(0, -1);
  }
  return base;
}

function isKofschip(origVerb: string, stam: string) {
  const last = stam[stam.length - 1];
  if (last === "f") {
    if (ORIG_V.includes(origVerb)) return false;
    if (origVerb.slice(0, -2).endsWith("v")) return false;
  }
  if (last === "s") {
    if (ORIG_Z.includes(origVerb)) return false;
    if (origVerb.slice(0, -2).endsWith("z")) return false;
  }
  return KOFSCHIP.includes(last) || last === "h";
}

function hasGePrefix(verb: string) {
  const noge = ["ver", "be", "ge", "er", "her", "ont"];
  for (const prefix of noge) {
    if (verb.startsWith(prefix)) return false;
  }
  return true;
}

function getHulp(verb: string) {
  verb = verb.trim().toLowerCase();
  if (ZIJN_VERBS.includes(verb)) return "zijn";
  if (IRREGULAR_PERF[verb]) return IRREGULAR_PERF[verb].hulp;
  return "hebben";
}

function getDeel(verb: string) {
  verb = verb.trim().toLowerCase();
  if (IRREGULAR_PERF[verb]) return IRREGULAR_PERF[verb].deel;
  const stam = getStemLocal(verb);
  const suffix = isKofschip(verb, stam) ? "t" : "d";
  const prefix = hasGePrefix(verb) ? "ge" : "";
  return prefix + stam + suffix;
}

interface QuizState {
  current: number;
  score: number;
  answered: (number | null)[];
  feedback: string;
}

interface PerfectumPanelProps {
  accentColor: string;
}

export default function PerfectumPanel({ accentColor }: PerfectumPanelProps) {
  const [langNL, setLangNL] = useState(true);
  const [activeLevel, setActiveLevel] = useState<"a1" | "a2" | "b1" | "b2">("a1");

  // Converter States
  const [verbInputA2, setVerbInputA2] = useState("werken");
  const [resultA2, setResultA2] = useState<any>(null);

  // Card Flip State for B1
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  // Quiz States
  const [quizStates, setQuizStates] = useState<Record<string, QuizState>>({
    a1: { current: 0, score: 0, answered: Array(5).fill(null), feedback: "" },
    a2: { current: 0, score: 0, answered: Array(4).fill(null), feedback: "" },
    b1: { current: 0, score: 0, answered: Array(2).fill(null), feedback: "" },
    b2: { current: 0, score: 0, answered: Array(2).fill(null), feedback: "" },
  });

  const handleConjugateA2 = () => {
    const v = verbInputA2.trim().toLowerCase();
    if (!v) return;
    const deel = getDeel(v);
    const hulp = getHulp(v);
    const stam = getStemLocal(v);
    const isIrreg = !!IRREGULAR_PERF[v];
    const suffix = isKofschip(v, stam) 
      ? langNL ? "t (kofschip)" : "t (kofschip içinde)" 
      : langNL ? "d (buiten kofschip)" : "d (kofschip dışı)";
    const geNote = hasGePrefix(v) 
      ? langNL ? "ge- toegevoegd" : "ge- eklendi" 
      : langNL ? "ge- niet toegevoegd (heeft prefix)" : "ge- eklenmedi (ön ek var)";

    setResultA2({
      verb: v,
      deel,
      hulp,
      stam,
      isIrreg,
      suffix,
      geNote,
      sentence: hulp === "zijn" ? `Ik ben ${deel}.` : `Ik heb ${deel}.`
    });
  };

  const handleQuizSelect = (optIndex: number) => {
    const state = quizStates[activeLevel];
    if (state.answered[state.current] !== null) return;

    const questions = PERFECTUM_QUESTIONS[activeLevel];
    const q = questions[state.current];
    const isCorrect = optIndex === q.a;

    const newAnswered = [...state.answered];
    newAnswered[state.current] = optIndex;

    const newScore = isCorrect ? state.score + 1 : state.score;
    const feedbackText = isCorrect
      ? langNL ? `✅ Correct! ${q.tr}` : `✅ Doğru! ${q.tr}`
      : langNL ? `❌ Fout. ${q.tr}` : `❌ Yanlış. ${q.tr}`;

    setQuizStates((prev) => ({
      ...prev,
      [activeLevel]: {
        ...state,
        score: newScore,
        answered: newAnswered,
        feedback: feedbackText,
      },
    }));
  };

  const handleQuizNext = () => {
    const state = quizStates[activeLevel];
    const total = PERFECTUM_QUESTIONS[activeLevel].length;
    if (state.current >= total - 1) return;

    setQuizStates((prev) => ({
      ...prev,
      [activeLevel]: {
        ...state,
        current: state.current + 1,
        feedback: "",
      },
    }));
  };

  const handleQuizPrev = () => {
    const state = quizStates[activeLevel];
    if (state.current <= 0) return;

    setQuizStates((prev) => ({
      ...prev,
      [activeLevel]: {
        ...state,
        current: state.current - 1,
        feedback: "",
      },
    }));
  };

  const handleQuizRestart = () => {
    const total = PERFECTUM_QUESTIONS[activeLevel].length;
    setQuizStates((prev) => ({
      ...prev,
      [activeLevel]: {
        current: 0,
        score: 0,
        answered: Array(total).fill(null),
        feedback: "",
      },
    }));
  };

  useEffect(() => {
    handleConjugateA2();
  }, []);

  const toggleCard = (idx: number) => {
    setFlippedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const renderQuizContent = (lvl: string) => {
    const state = quizStates[lvl];
    const questions = PERFECTUM_QUESTIONS[lvl];
    const q = questions[state.current];
    const total = questions.length;
    const pct = Math.round((state.current / total) * 100);
    const allDone = state.answered.every((a) => a !== null);

    return (
      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
        <span className={`lbadge lbadge-${lvl}`}>
          {lvl.toUpperCase()}
        </span>
        <h3 className="font-black text-sm uppercase tracking-wide mb-3">
          {langNL ? "Oefeningen" : "Alıştırmalar"}
        </h3>

        {/* Progress Bar */}
        <div className="q-progress mb-4 bg-[var(--surface-2)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
          <div className="h-full bg-[var(--primary)] rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
        </div>

        {/* Counter */}
        <div className="flex justify-between items-center mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text)] opacity-90">
          <span>{langNL ? `Vraag ${state.current + 1} / ${total}` : `Soru ${state.current + 1} / ${total}`}</span>
          <span className="bg-[var(--accent)] text-[var(--text)] border border-[var(--border)] px-3 py-1 rounded-full text-[10px]">
            {langNL ? `Score: ${state.score} / ${total}` : `Puan: ${state.score} / ${total}`}
          </span>
        </div>

        {/* Question text */}
        <p className="text-sm font-black mb-3">{langNL ? q.q.nl : q.q.tr}</p>

        {/* Choice buttons */}
        <div className="flex flex-col gap-2 mb-4">
          {q.opts.map((opt: string, idx: number) => {
            const ans = state.answered[state.current];
            const isSelected = ans === idx;
            let optClass = "border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]";
            if (ans !== null) {
              if (idx === q.a) {
                optClass = "border border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)] font-bold";
              } else if (isSelected) {
                optClass = "border border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)] font-bold";
              } else {
                optClass = "border border-[var(--border)] opacity-50";
              }
            }
            return (
              <button
                key={idx}
                disabled={ans !== null}
                onClick={() => handleQuizSelect(idx)}
                className={`w-full px-4 py-2.5 rounded-xl text-xs text-left cursor-pointer transition-all ${optClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Feedback message */}
        {state.feedback && (
          <div className={`p-3 border border-[var(--border)] rounded-xl text-xs font-bold leading-relaxed mb-4 bg-[var(--accent)]/10 text-[var(--text)] border-[var(--accent)]`}>
            {state.feedback}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-2">
          {state.current > 0 && (
            <button
              onClick={handleQuizPrev}
              className="px-4 py-2.5 border border-[var(--border)] rounded-xl font-bold bg-[var(--surface)] text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
            >
              ← {langNL ? "Terug" : "Geri"}
            </button>
          )}
          {state.answered[state.current] !== null && state.current < total - 1 && (
            <button
              onClick={handleQuizNext}
              className="px-4 py-2.5 border border-[var(--border)] rounded-xl font-bold bg-[var(--primary)] text-white text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
            >
              {langNL ? "Volgende" : "İleri"} →
            </button>
          )}
        </div>

        {/* Results summary block */}
        {allDone && (
          <div className="mt-4 p-4 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-center">
            <h4 className="font-black text-xl mb-1">{state.score} / {total}</h4>
            <p className="text-xs font-semibold mb-3">
              {state.score === total
                ? langNL ? "Perfect! Alle antwoorden zijn correct." : "Mükemmel! Tüm sorular doğru."
                : state.score >= Math.round(total * 0.8)
                ? langNL ? "Zeer goed! Bijna perfect." : "Çok iyi! Neredeyse mükemmel."
                : langNL ? "Je bent goed op weg!" : "İyi gidiyorsun! Yanlışları gözden geçir."}
            </p>
            <button
              onClick={handleQuizRestart}
              className="px-4 py-2 bg-[var(--primary)] text-white font-bold rounded-xl border-none hover:opacity-90 active:scale-95 text-xs uppercase tracking-wider cursor-pointer"
            >
              🔄 {langNL ? "Opnieuw proberen" : "Tekrar dene"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-[var(--text)]">
      {/* Language Toggle Button */}
      <div className="flex justify-end">
        <div className="flex border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)] shadow-sm">
          <button
            onClick={() => setLangNL(true)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-none cursor-pointer transition-colors ${
              langNL
                ? "bg-[var(--primary)] text-[var(--surface)]"
                : "bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]"
            }`}
          >
            Nederlands
          </button>
          <button
            onClick={() => setLangNL(false)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-l border-[var(--border)] border-none cursor-pointer transition-colors ${
              !langNL
                ? "bg-[var(--primary)] text-[var(--surface)]"
                : "bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]"
            }`}
          >
            Türkçe
          </button>
        </div>
      </div>

      {/* Hero Info */}
      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <span className="tag mb-2">⏪ Perfectum — voltooide tegenwoordige tijd</span>
          <h2 className="font-black text-xl uppercase tracking-tight mt-2 mb-1">
            {langNL ? "Nederlandse voltooide tijd" : "Hollandaca geçmiş zaman"}
          </h2>
          <p className="text-sm font-medium leading-relaxed max-w-[720px] mb-4">
            {langNL
              ? "Nederlanders gebruiken in de spreektaal bijna altijd de voltooide tijd om het verleden te beschrijven. Formule: hebben / zijn + voltooid deelwoord."
              : "Hollandalılar günlük konuşmada geçmişi anlatmak için neredeyse her zaman perfectum (yakın geçmiş zaman) kullanır. Formül: hebben / zijn + voltooid deelwoord."}
          </p>

          {/* Level Switcher bar */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "a1", label: langNL ? "A1 — Basisstructuur" : "A1 — Temel yapı" },
              { key: "a2", label: langNL ? "A2 — Deelwoord regels" : "A2 — Deelwoord kuralları" },
              { key: "b1", label: langNL ? "B1 — Onregelmatig" : "B1 — Düzensiz fiiller" },
              { key: "b2", label: langNL ? "B2 — Positie & Stijl" : "B2 — Pozisyon & stil" },
            ].map((lvl) => (
              <button
                key={lvl.key}
                onClick={() => setActiveLevel(lvl.key as any)}
                className={`px-4 py-2 border border-[var(--border)] rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-all ${
                  activeLevel === lvl.key
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ A1 PANELİ ══════════ */}
      {activeLevel === "a1" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* FORMÜL */}
            <div className="md:col-span-7 border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
              <span className="lbadge lbadge-a1">A1</span>
              <h2 className="font-black text-sm uppercase tracking-wide mb-3">
                {langNL ? "1. Perfectum formule" : "1. Perfectum formülü"}
              </h2>
              <p className="text-sm mb-4">
                {langNL
                  ? "Het perfectum bestaat altijd uit twee werkwoorden: een hulpwerkwoord (hebben of zijn) en het voltooid deelwoord."
                  : "Hollandaca'da geçmiş zaman iki parçalıdır: Yardımcı fiil (hebben / zijn) ve ortaç (voltooid deelwoord)."}
              </p>
              
              {/* Perfectum formülü — renkli yazı */}
              <div className="text-center mb-4">
                <p className="text-xl font-black tracking-tight">
                  <span className="text-[var(--accent)]">hebben / zijn</span>
                  <span className="text-[var(--text-muted)] font-normal"> + </span>
                  <span className="text-[var(--danger)]">ge- + stam + t/d</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5">
                  <span className="text-[var(--accent)]">{langNL ? "hulpwerkwoord" : "yardımcı fiil"}</span>
                  <span className="text-[var(--text-muted)] opacity-50"> + </span>
                  <span className="text-[var(--danger)]">{langNL ? "voltooid deelwoord" : "ortaç"}</span>
                  <span className="text-[var(--text-muted)] opacity-50"> = </span>
                  <span className="text-[var(--success)]">Perfectum ✓</span>
                </p>
              </div>

              <div className="bg-[var(--accent)]/20 border-l-4 border-[var(--accent)] p-3 rounded-r-lg text-xs leading-relaxed mb-4">
                {langNL
                  ? "Vergelijking: \"Ik heb gewerkt\" = \"Çalıştım\". Twee woorden in het Nederlands, één woord in het Turks."
                  : "Türkçe karşılaştırması: \"Ik heb gewerkt\" = \"Çalıştım\". İki kelime ama tek bir geçmiş zaman anlamı taşır."}
              </div>

              <h3 className="font-bold text-xs uppercase tracking-wider mb-2">{langNL ? "Voorbeelden" : "Örnekler"}</h3>
              <div className="overflow-x-auto border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      <th className="px-3 py-2 text-left">{langNL ? "Nederlands" : "Hollandaca"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "Turks" : "Türkçe"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "Hulpwerkwoord" : "Yardımcı Fiil"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-semibold">
                    <tr>
                      <td className="px-3 py-2"><b>Ik heb</b> gewerkt.</td>
                      <td className="px-3 py-2">Çalıştım.</td>
                      <td className="px-3 py-2 text-[var(--primary)] font-bold">hebben</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2"><b>Ik ben</b> gegaan.</td>
                      <td className="px-3 py-2">Gittim.</td>
                      <td className="px-3 py-2 text-[var(--success)] font-bold">zijn</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* HEBBEN OF ZIJN */}
            <div className="md:col-span-5 border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className="lbadge lbadge-a1">A1</span>
                <h2 className="font-black text-sm uppercase tracking-wide mb-2">
                  {langNL ? "2. Hebben of zijn?" : "2. Hebben mı yoksa zijn mı?"}
                </h2>
                <p className="text-xs mb-4 opacity-60">
                  {langNL ? "Hoe kies je het juiste hulpwerkwoord?" : "Doğru yardımcı fiili nasıl seçeriz? Basit karar ağacı:"}
                </p>

                {/* BESLISSINGSBOOM DIYAGRAMI (Mondrian) */}
                <div className="flex flex-col gap-2.5 mb-4 text-xs">
                  <div className="border border-[var(--border)] rounded-xl p-2.5 bg-[var(--surface-2)]/30">
                    <p className="font-bold mb-1">
                      {langNL ? "1. Fysieke verandering van A naar B?" : "1. Fiziksel olarak A noktasından B noktasına hareket var mı?"}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)] px-2 py-0.5 rounded text-[10px] font-bold">
                        {langNL ? "Ja → zijn" : "Evet → zijn"}
                      </span>
                      <span className="bg-[var(--warning-soft)] text-[var(--accent)] border border-[var(--accent)] px-2 py-0.5 rounded text-[10px] font-bold">
                        {langNL ? "Nee → ga door" : "Hayır → devam"}
                      </span>
                    </div>
                  </div>

                  <div className="border border-[var(--border)] rounded-xl p-2.5 bg-[var(--surface-2)]/30">
                    <p className="font-bold mb-1">
                      {langNL ? "2. Toestandsverandering (bijv. sterven, worden)?" : "2. Bir durum veya hal değişimi söz konusu mu?"}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)] px-2 py-0.5 rounded text-[10px] font-bold">
                        {langNL ? "Ja → zijn" : "Evet → zijn"}
                      </span>
                      <span className="bg-[var(--warning-soft)] text-[var(--accent)] border border-[var(--accent)] px-2 py-0.5 rounded text-[10px] font-bold">
                        {langNL ? "Nee → ga door" : "Hayır → devam"}
                      </span>
                    </div>
                  </div>

                  <div className="border border-[var(--border)] rounded-xl p-2.5 bg-[var(--surface-2)]/30">
                    <p className="font-bold mb-1">
                      {langNL ? "3. Is het zijn, blijven of worden?" : "3. Fiil zijn, blijven veya worden fiillerinden biri mi?"}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)] px-2 py-0.5 rounded text-[10px] font-bold">
                        {langNL ? "Ja → zijn" : "Evet → zijn"}
                      </span>
                      <span className="bg-[var(--accent-soft)] text-[var(--primary)] border border-[var(--primary)] px-2 py-0.5 rounded text-[10px] font-bold">
                        {langNL ? "Nee → hebben" : "Hayır → hebben"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--accent)]/20 border-l-4 border-[var(--accent)] p-2 rounded-r text-[10px] leading-relaxed mb-3">
                  {langNL
                    ? "💡 Regel: Bij twijfel gebruik je hebben. 80% van de werkwoorden gebruikt hebben."
                    : "💡 Kural: Şüphe duyarsanız 'hebben' seçin. Hollandaca'daki fiillerin %80'i hebben ile çekimlenir."}
                </div>
              </div>

              <div className="bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)] p-3 rounded-xl text-xs font-bold">
                <b>{langNL ? "Belangrijke ZIJN-werkwoorden:" : "zijn alan temel fiiller (ezberleyin):"}</b>
                <span className="font-mono text-[10px] block mt-1 leading-relaxed">
                  gaan · komen · rijden · lopen · fietsen · vliegen · vallen ·
                  blijven · worden · zijn · sterven · vertrekken
                </span>
              </div>
            </div>
          </div>

          {/* Hatalar */}
          <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
            <span className="lbadge lbadge-a1">A1</span>
            <h2 className="font-black text-sm uppercase tracking-wide mb-3">
              {langNL ? "3. Veelgemaakte fouten" : "3. Türklerin en sık yaptığı hatalar"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-[var(--border)] bg-[var(--danger-soft)]/5 rounded-xl p-3 text-xs leading-relaxed flex flex-col justify-between">
                <div>
                  <p className="font-bold text-[var(--danger)]">❌ Fout:</p>
                  <p className="italic mb-2">Ik ben gewerkt.</p>
                  <p className="font-bold text-[var(--success)]">✅ Goed:</p>
                  <p className="font-black">Ik heb gewerkt.</p>
                </div>
                <p className="text-[10px] opacity-60 mt-2">
                  {langNL ? "werken → statisch → hebben." : "werken → hareketsiz eylem → hebben kullanılır."}
                </p>
              </div>

              <div className="border border-[var(--border)] bg-[var(--danger-soft)]/5 rounded-xl p-3 text-xs leading-relaxed flex flex-col justify-between">
                <div>
                  <p className="font-bold text-[var(--danger)]">❌ Fout:</p>
                  <p className="italic mb-2">Ik heb gegaan.</p>
                  <p className="font-bold text-[var(--success)]">✅ Goed:</p>
                  <p className="font-black">Ik ben gegaan.</p>
                </div>
                <p className="text-[10px] opacity-60 mt-2">
                  {langNL ? "gaan → beweging A→B → zijn." : "gaan → A'dan B'ye hareket → zijn kullanılır."}
                </p>
              </div>

              <div className="border border-[var(--border)] bg-[var(--danger-soft)]/5 rounded-xl p-3 text-xs leading-relaxed flex flex-col justify-between">
                <div>
                  <p className="font-bold text-[var(--danger)]">❌ Fout:</p>
                  <p className="italic mb-2">Wij zijn gewandeld (geen richting).</p>
                  <p className="font-bold text-[var(--success)]">✅ Goed:</p>
                  <p className="font-black">Wij hebben gewandeld.</p>
                </div>
                <p className="text-[10px] opacity-60 mt-2">
                  {langNL 
                    ? "Wandelen zonder richting → hebben. Met richting (naar het bos) → zijn." 
                    : "Yön belirtmeden yürümek (wandelen) → hebben. Yön belirtildiğinde (naar het bos) → zijn."}
                </p>
              </div>

              <div className="border border-[var(--border)] bg-[var(--danger-soft)]/5 rounded-xl p-3 text-xs leading-relaxed flex flex-col justify-between">
                <div>
                  <p className="font-bold text-[var(--danger)]">❌ Fout:</p>
                  <p className="italic mb-2">Hij heeft gebleven.</p>
                  <p className="font-bold text-[var(--success)]">✅ Goed:</p>
                  <p className="font-black">Hij is gebleven.</p>
                </div>
                <p className="text-[10px] opacity-60 mt-2">
                  {langNL ? "blijven gebruikt altijd zijn." : "blijven fiili her zaman zijn alır (istisna durum)."}
                </p>
              </div>
            </div>
          </div>

          {/* A1 Quiz */}
          {renderQuizContent("a1")}
        </motion.div>
      )}

      {/* ══════════ A2 PANELİ ══════════ */}
      {activeLevel === "a2" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
              <span className="lbadge lbadge-a2">A2</span>
              <h2 className="font-black text-sm uppercase tracking-wide mb-3">
                {langNL ? "1. Voltooid deelwoord: +t of +d?" : "1. Ortaç (Deelwoord): +t mi yoksa +d mi?"}
              </h2>
              <p className="text-sm mb-4">
                {langNL
                  ? "Formule: ge- + stam + t/d. Om te kiezen gebruiken we de regel van 't kofschip:"
                  : "Düzenli fiiller için formül: ge- + stam + t/d. Ek seçimini 't kofschip kuralı ile yaparız:"}
              </p>

              {/* 'T KOFSCHIP DIYAGRAMI */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4 text-center">
                <div className="bg-[var(--accent)]/30 border border-[var(--border)] rounded-xl p-2 flex flex-col justify-center font-black">
                  <span className="text-sm text-[var(--primary)]">'T</span>
                  <span className="text-[8px] opacity-90 uppercase">kofschip</span>
                </div>
                {["k", "f", "s", "ch", "p"].map((l) => (
                  <div key={l} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-2 flex flex-col justify-center font-black">
                    <span className="text-sm">{l.toUpperCase()}</span>
                    <span className="text-[8px] opacity-40">
                      {l === "k" ? "werk" : l === "f" ? "leef" : l === "s" ? "reis" : l === "ch" ? "lach" : "stop"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-[var(--accent)]/20 border-l-4 border-[var(--accent)] p-3 rounded-r-lg text-xs leading-relaxed mb-4">
                {langNL ? (
                  <>
                    📌 Zit de laatste letter van de stam in <b>'t kofschip</b>? Dan voegen we <b>+t</b> toe. Anders <b>+d</b>.<br />
                    Let op: v→f en z→s veranderingen krijgen toch een <b>d</b>, omdat de originele letter (v of z) telt.
                  </>
                ) : (
                  <>
                    📌 Gövdenin (stam) son harfi <b>'t kofschip (t, k, f, s, ch, p)</b> harflerinden biriyse <b>+t</b>, değilse <b>+d</b> eklenir.<br />
                    Dikkat: v→f ve z→s dönüşümlerinden gelen f ve s harfleri <b>d takısı alır</b> (aslen v ve z oldukları için).
                  </>
                )}
              </div>

              <div className="overflow-x-auto border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full text-xs font-semibold">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      <th className="px-3 py-2 text-left">{langNL ? "Stam" : "Gövde"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "Laatste letter" : "Son Harf"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "In kofschip?" : "Kofschip?"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "Deelwoord" : "Ortaç"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "Betekenis" : "Anlamı"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    <tr>
                      <td className="px-3 py-2">werk</td>
                      <td className="px-3 py-2">k</td>
                      <td className="px-3 py-2 text-[var(--primary)] font-bold">{langNL ? "✓ Ja" : "✓ İçinde"}</td>
                      <td className="px-3 py-2 font-black">ge-werk-t</td>
                      <td className="px-3 py-2">{langNL ? "werken" : "çalışmak"}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">hoor</td>
                      <td className="px-3 py-2">r</td>
                      <td className="px-3 py-2 text-[var(--danger)]">{langNL ? "✗ Nee" : "✗ Dışında"}</td>
                      <td className="px-3 py-2 font-black">ge-hoor-d</td>
                      <td className="px-3 py-2">{langNL ? "horen" : "duymak"}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">leef</td>
                      <td className="px-3 py-2">f (← v)</td>
                      <td className="px-3 py-2 text-[var(--danger)]">{langNL ? "✗ Origineel v" : "✗ Orijinali v"}</td>
                      <td className="px-3 py-2 font-black">ge-leef-d</td>
                      <td className="px-3 py-2">{langNL ? "leven" : "yaşamak"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ön Ekler ve Dönüştürücü */}
            <div className="md:col-span-5 border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className="lbadge lbadge-a2">A2</span>
                <h2 className="font-black text-sm uppercase tracking-wide mb-2">
                  {langNL ? "2. Geen ge- toevoegen" : "2. ge- ön eki ne zaman eklenmez?"}
                </h2>
                <div className="overflow-x-auto border border-[var(--border)] rounded-lg overflow-hidden mb-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                        <th className="px-3 py-2 text-left">{langNL ? "Prefix" : "Ön Ek"}</th>
                        <th className="px-3 py-2 text-left">{langNL ? "Voorbeeld" : "Örnek"}</th>
                        <th className="px-3 py-2 text-left">{langNL ? "Deelwoord" : "Ortaç"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] font-semibold">
                      <tr>
                        <td className="px-3 py-2">ver-, be-, ge-, er-, her-</td>
                        <td className="px-3 py-2">verhuizen</td>
                        <td className="px-3 py-2 text-[var(--danger)]">verhuisd</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">be-</td>
                        <td className="px-3 py-2">betalen</td>
                        <td className="px-3 py-2 text-[var(--danger)]">betaald</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)] p-2 rounded-xl text-[10px] font-bold mb-4">
                  ⚠️ verhuizen → verhuisd ({langNL ? "niet geverhuisd" : "geverhuisd değil!"})
                </div>

                <h3 className="font-bold text-xs uppercase tracking-wider mb-2">
                  {langNL ? "Deelwoordomzetter" : "Ortaç (Deelwoord) Dönüştürücü"}
                </h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={verbInputA2}
                    onChange={(e) => setVerbInputA2(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConjugateA2()}
                    placeholder="werken, maken, leven..."
                    className="flex-1 px-3 py-2 border border-[var(--border)] rounded-xl text-xs font-black bg-[var(--surface)]"
                  />
                  <button
                    onClick={handleConjugateA2}
                    className="px-4 py-2 bg-[var(--primary)] text-white font-bold rounded-xl border border-[var(--border)] hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer"
                  >
                    {langNL ? "Omzetten" : "Çevir"}
                  </button>
                </div>
              </div>

              {resultA2 && (
                <div className="bg-[var(--surface-2)] border border-[var(--border)] p-3.5 rounded-xl text-xs font-bold leading-normal">
                  <p className="font-black text-sm uppercase tracking-wider mb-1 text-[var(--primary)]">{resultA2.verb}</p>
                  <div>{langNL ? "Hulpwerkwoord" : "Yardımcı fiil"}: <span className={resultA2.hulp === "zijn" ? "text-[var(--success)]" : "text-[var(--primary)]"}>{resultA2.hulp}</span></div>
                  <div>{langNL ? "Deelwoord" : "Ortaç (Deelwoord)"}: <b>{resultA2.deel}</b> {resultA2.isIrreg && <span className="text-[var(--danger)]">({langNL ? "onregelmatig" : "düzensiz!"})</span>}</div>
                  {!resultA2.isIrreg && <div className="text-[10px] opacity-60 mt-1">Stam: {resultA2.stam} · {resultA2.geNote} · +{resultA2.suffix}</div>}
                  <div className="mt-2 pt-1.5 border-t border-[var(--border)] text-[13px] font-black">
                    Perfectum: {resultA2.sentence}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* A2 Quiz */}
          {renderQuizContent("a2")}
        </motion.div>
      )}

      {/* ══════════ B1 PANELİ ══════════ */}
      {activeLevel === "b1" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
            <span className="lbadge lbadge-b1">B1</span>
            <h2 className="font-black text-sm uppercase tracking-wide mb-2">
              {langNL ? "Onregelmatige werkwoorden — Klik op de kaarten" : "Düzensiz fiiller — Kartlara tıklayın"}
            </h2>
            <p className="text-xs mb-4 opacity-75">
              {langNL
                ? "Düzensiz fiillerde deelwoord tamamen farklıdır, kuraldan çıkarılamaz. Kartlara tıklayarak yardımcı fiillerini ve deelwoord hallerini gör."
                : "Düzensiz fiillerde ortaç (deelwoord) yapısı kural dışıdır, ezberlenmesi gerekir. Kartların üzerine tıklayarak ortaç halini ve yardımcı fiilini görebilirsiniz."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {IRREG_LIST.map((item, idx) => {
                const isFlipped = !!flippedCards[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleCard(idx)}
                    className={`border border-[var(--border)] rounded-xl p-3.5 cursor-pointer text-center select-none min-h-[90px] flex flex-col justify-center items-center transition-all ${
                      isFlipped ? "bg-[var(--surface-2)]" : "bg-[var(--surface)] hover:bg-[var(--surface-2)]/30"
                    }`}
                  >
                    {!isFlipped ? (
                      <>
                        <span className="font-black text-sm text-[var(--text)]">{item.inf}</span>
                        <span className="text-[10px] opacity-50 block mt-1">{item.tr}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-black text-sm text-[var(--primary)]">{item.deel}</span>
                        <span className={`text-[10px] font-bold block mt-1 uppercase tracking-wider ${
                          item.hulp === "zijn" ? "text-[var(--success)]" : "text-[var(--primary)]"
                        }`}>{item.hulp}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="bg-[var(--accent)]/20 border-l-4 border-[var(--accent)] p-3 rounded-r-lg text-xs leading-relaxed mt-4">
              {langNL
                ? "💡 Tip: Leer de combinaties als een set: infinitief — hulpww — deelwoord. Bijvoorbeeld: 'schrijven — hebben — geschreven'."
                : "💡 İpucu: Düzensiz fiilleri ezberlerken üçlü grup halinde öğrenmek en kolay yöntemdir: mastar — yardımcı fiil — deelwoord. Örnek: 'schrijven — hebben — geschreven'."}
            </div>
          </div>

          {/* B1 Quiz */}
          {renderQuizContent("b1")}
        </motion.div>
      )}

      {/* ══════════ B2 PANELİ ══════════ */}
      {activeLevel === "b2" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
              <span className="lbadge lbadge-b2">B2</span>
              <h2 className="font-black text-sm uppercase tracking-wide mb-3">
                {langNL ? "1. Woordvolgorde in het perfectum" : "1. Perfectum'da kelime sırası"}
              </h2>
              <p className="text-sm mb-4">
                {langNL
                  ? "In een hoofdzin staat het hulpwerkwoord op de 2e positie, het voltooid deelwoord helemaal achteraan."
                  : "Temel cümle yapısında yardımcı fiil (hebben/zijn) cümlenin 2. sırasında yer alırken, ortaç (deelwoord) cümlenin en sonuna gider."}
              </p>

              <div className="flex flex-col gap-3 mb-4">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-sm text-xs font-bold leading-normal">
                  <div className="mb-1 text-sm">
                    <span className="bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)] px-1.5 py-0.5 rounded mr-1">Ik</span>
                    <span className="bg-[var(--accent-soft)] text-[var(--primary)] border border-[var(--primary)] px-1.5 py-0.5 rounded mr-1">heb</span>
                    <span className="bg-[var(--warning-soft)] text-[var(--accent)] border border-[var(--accent)] px-1.5 py-0.5 rounded mr-1">gisteren</span>
                    <span className="bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)] px-1.5 py-0.5 rounded">gewerkt</span>.
                  </div>
                  <div className="opacity-60">{langNL ? "Ik heb gisteren gewerkt." : "Dün çalıştım."}</div>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-sm text-xs font-bold leading-normal">
                  <div className="mb-1 text-sm">
                    <span className="bg-[var(--warning-soft)] text-[var(--accent)] border border-[var(--accent)] px-1.5 py-0.5 rounded mr-1">Gisteren</span>
                    <span className="bg-[var(--accent-soft)] text-[var(--primary)] border border-[var(--primary)] px-1.5 py-0.5 rounded mr-1">heb</span>
                    <span className="bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)] px-1.5 py-0.5 rounded mr-1">ik</span>
                    <span className="bg-[var(--warning-soft)] text-[var(--accent)] border border-[var(--accent)] px-1.5 py-0.5 rounded mr-1">hard</span>
                    <span className="bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)] px-1.5 py-0.5 rounded">gewerkt</span>.
                  </div>
                  <div className="opacity-60">{langNL ? "Gisteren heb ik hard gewerkt." : "Dün çok çalıştım. (inversie — yardım fiil yine 2. sırada)"}</div>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-sm text-xs font-bold leading-normal">
                  <div className="mb-1 text-sm">
                    Hij zegt dat hij gisteren <span className="bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)] px-1.5 py-0.5 rounded mr-1">gewerkt</span>
                    <span className="bg-[var(--accent-soft)] text-[var(--primary)] border border-[var(--primary)] px-1.5 py-0.5 rounded">heeft</span>.
                  </div>
                  <div className="opacity-60">{langNL ? "Hij zegt dat hij gisteren gewerkt heeft." : "Dün çalıştığını söylüyor. (bijzin/yan cümle → fiiller en sona gider!)"}</div>
                </div>
              </div>

              <div className="bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)] p-3 rounded-xl text-xs font-bold mb-4">
                {langNL
                  ? "⚠️ In een bijzin verandert de volgorde: deelwoord eerst, daarna het hulpwerkwoord."
                  : "⚠️ Yan cümlede (bijzin) kelime sırası ters döner: Önce ortaç (deelwoord), sonra yardımcı fiil gelir."}
              </div>

              <h3 className="font-bold text-xs uppercase tracking-wider mb-2">{langNL ? "Perfectum vs. Imperfectum" : "Perfectum ile Imperfectum arasındaki fark"}</h3>
              <div className="overflow-x-auto border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full text-xs font-semibold">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      <th className="px-3 py-2 text-left">{langNL ? "Kenmerk" : "Özellik"}</th>
                      <th className="px-3 py-2 text-left">Perfectum</th>
                      <th className="px-3 py-2 text-left">Imperfectum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    <tr>
                      <td className="px-3 py-2 font-bold">{langNL ? "Gebruik" : "Kullanım"}</td>
                      <td className="px-3 py-2">{langNL ? "Gesproken taal" : "Günlük konuşma dili"}</td>
                      <td className="px-3 py-2">{langNL ? "Geschreven taal, verhalen" : "Yazı dili, hikaye, haber"}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold">{langNL ? "Frequentie" : "Sıklık"}</td>
                      <td className="px-3 py-2 text-[var(--primary)]">{langNL ? "Heel vaak" : "Çok sık"}</td>
                      <td className="px-3 py-2 text-[var(--danger)]">{langNL ? "In boeken" : "Yazılı metinlerde"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* B2 Tam Tablo */}
            <div className="md:col-span-5 border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm overflow-hidden flex flex-col">
              <span className="lbadge lbadge-b2">B2</span>
              <h2 className="font-black text-sm uppercase tracking-wide mb-3">
                {langNL ? "2. Voorbeeldtabel" : "2. Örnek Tablo"}
              </h2>
              <div className="overflow-x-auto border border-[var(--border)] rounded-lg overflow-hidden flex-1">
                <table className="w-full text-xs font-semibold">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      <th className="px-3 py-2 text-left">Infinitief</th>
                      <th className="px-3 py-2 text-left">Hulpww</th>
                      <th className="px-3 py-2 text-left">Deelwoord</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {[
                      { inf: "werken", hulp: "hebben", deel: "gewerkt" },
                      { inf: "leven", hulp: "hebben", deel: "geleefd" },
                      { inf: "reizen", hulp: "hebben", deel: "gereisd" },
                      { inf: "gaan", hulp: "zijn", deel: "gegaan" },
                      { inf: "komen", hulp: "zijn", deel: "gekomen" },
                    ].map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]"}>
                        <td className="px-3 py-2 font-bold text-[var(--primary)]">{row.inf}</td>
                        <td className={`px-3 py-2 font-bold ${row.hulp === "zijn" ? "text-[var(--success)]" : "text-[var(--primary)]"}`}>{row.hulp}</td>
                        <td className="px-3 py-2 font-black">{row.deel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* B2 Quiz */}
          {renderQuizContent("b2")}
        </motion.div>
      )}
    </div>
  );
}
