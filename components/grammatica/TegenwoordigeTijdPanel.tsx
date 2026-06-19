"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LangToggle from "./LangToggle";

const IRREGULAR_VERBS: Record<string, any> = {
  zijn: { stam: null, ik: "ben", jij: "bent", hij: "is", wij: "zijn" },
  hebben: { stam: null, ik: "heb", jij: "hebt", hij: "heeft", wij: "hebben" },
  gaan: { stam: "ga", ik: "ga", jij: "gaat", hij: "gaat", wij: "gaan" },
  doen: { stam: "doe", ik: "doe", jij: "doet", hij: "doet", wij: "doen" },
  staan: { stam: "sta", ik: "sta", jij: "staat", hij: "staat", wij: "staan" },
  zien: { stam: "zie", ik: "zie", jij: "ziet", hij: "ziet", wij: "zien" },
  weten: { stam: "weet", ik: "weet", jij: "weet", hij: "weet", wij: "weten" },
  slaan: { stam: "sla", ik: "sla", jij: "slaat", hij: "slaat", wij: "slaan" },
};

const KNOWN_STEMS: Record<string, string> = {
  werken: "werk", maken: "maak", lopen: "loop", lezen: "lees",
  leven: "leef", reizen: "reis", zetten: "zet", bidden: "bid",
  rennen: "ren", geven: "geef", rijden: "rijd", schrijven: "schrijf",
  kopen: "koop", hopen: "hoop", sturen: "stuur", buren: "buur",
  huren: "huur", spelen: "speel", leren: "leer", horen: "hoor",
  vragen: "vraag", dragen: "draag", praten: "praat",
  wonen: "woon", koken: "kook", werpen: "werp",
  pakken: "pak", bakken: "bak", tikken: "tik",
  slopen: "sloop", kloppen: "klop",
  treffen: "tref", griffen: "grif", snuiven: "snuif",
  blijven: "blijf", rijven: "rijf", kijken: "kijk",
  rijken: "rijk", wijken: "wijk", bijten: "bijt",
  rijten: "rijt", grijpen: "grijp", snijden: "snijd",
  leiden: "leid", beelden: "beeld", bieden: "bied",
  gieten: "giet", schieten: "schiet", vliegen: "vlieg",
  liegen: "lieg", kiezen: "kies", vriezen: "vries",
  blazen: "blaas", razen: "raas", grazen: "graas",
  wijzen: "wijs", prijzen: "prijs",
  muren: "muur", vuren: "vuur",
  roeren: "roer", groeien: "groei", bloeien: "bloei",
  zingen: "zing", springen: "spring", brengen: "breng",
  hangen: "hang", vangen: "vang", zwijgen: "zwijg",
  rijgen: "rijg", vegen: "veeg", legen: "leeg",
  zwegen: "zweeg", wegen: "weeg"
};

function isVowel(c: string) {
  return "aeiouáéíóú".indexOf(c) >= 0;
}

function getStem(v: string): string {
  v = v.trim().toLowerCase();
  if (KNOWN_STEMS[v]) return KNOWN_STEMS[v];
  if (IRREGULAR_VERBS[v]) return IRREGULAR_VERBS[v].stam || "";
  if (!v.endsWith("en")) return v;
  
  let base = v.slice(0, -2);
  
  if (base.endsWith("v")) base = base.slice(0, -1) + "f";
  if (base.endsWith("z")) base = base.slice(0, -1) + "s";
  
  const last = base[base.length - 1];
  const secondLast = base[base.length - 2];
  if (last && secondLast && last === secondLast && !isVowel(last)) {
    base = base.slice(0, -1);
  }
  
  if (base.length >= 2) {
    const sLast = base[base.length - 1];
    const sVowel = base[base.length - 2];
    const sBefore = base[base.length - 3];
    if (!isVowel(sLast) && isVowel(sVowel) && sVowel !== "e") {
      if (!sBefore || !isVowel(sBefore)) {
        const doubled = base.slice(0, -1) + sVowel + sLast;
        const alreadyDouble = base.length >= 3 && isVowel(base[base.length - 2]) && isVowel(base[base.length - 3]);
        if (!alreadyDouble && base.length >= 3 && !isVowel(sBefore || "")) {
          base = doubled;
        }
      }
    }
  }
  
  return base;
}

const TEGENWOORDIGE_QUESTIONS: Record<string, any[]> = {
  a1: [
    {
      q: { nl: "Wij ___ morgen vroeg. (werken)", tr: "Biz yarın erken ___ . (werken = çalışmak)" },
      opts: ["werkt", "werken", "werk", "werkten"],
      a: 1,
      tr: { nl: "wij = meervoud → infinitief (werken)", tr: "wij = çoğul → infinitief / mastar hali (werken)" },
    },
    {
      q: { nl: "Vandaag ___ jij? (werken — inversie)", tr: "Bugün sen ___ mi? (werken — inversie/devrik)" },
      opts: ["werkt", "werk", "werken", "gewerkt"],
      a: 1,
      tr: { nl: "inversie + jij → -t vervalt (werk jij)", tr: "inversie + jij → fiilden sonra jij geldiği için -t düşer (werk jij)" },
    },
    {
      q: { nl: "Hij ___ in Leiden. (wonen)", tr: "O, Leiden'da ___ . (wonen = ikamet etmek)" },
      opts: ["woon", "woont", "wonen", "woonde"],
      a: 1,
      tr: { nl: "hij = stam + t → woont", tr: "hij = gövde + t → woont" },
    },
    {
      q: { nl: "Stam van 'maken'?", tr: "'maken' fiilinin stam (gövde) hali hangisidir?" },
      opts: ["mak", "maak", "maken", "maakt"],
      a: 1,
      tr: { nl: "lange klinker behouden → maak", tr: "uzun sesli harfi koruma kuralı → maak" },
    },
    {
      q: { nl: "Stam van 'reizen'?", tr: "'reizen' fiilinin stam (gövde) hali hangisidir?" },
      opts: ["reiz", "reizen", "reis", "reist"],
      a: 2,
      tr: { nl: "z verandert in s aan het einde → reis", tr: "kelime sonunda z harfi s harfine dönüşür → reis" },
    },
    {
      q: { nl: "Ik ___ Nederlands. (leren)", tr: "Ben Hollandaca ___ . (leren = öğrenmek)" },
      opts: ["leer", "leert", "leren", "geleerd"],
      a: 0,
      tr: { nl: "ik = stam → leer", tr: "ik = gövde → leer" },
    },
    {
      q: { nl: "Stam van 'leven'?", tr: "'leven' fiilinin stam (gövde) hali hangisidir?" },
      opts: ["lev", "leven", "leef", "leeft"],
      a: 2,
      tr: { nl: "v verandert in f aan het einde → leef", tr: "kelime sonunda v harfi f harfine dönüşür → leef" },
    },
    {
      q: { nl: "Jullie ___ morgen. (werken)", tr: "Siz yarın ___ . (werken = çalışmak)" },
      opts: ["werkt", "werk", "werken", "werkende"],
      a: 2,
      tr: { nl: "jullie = meervoud → infinitief (werken)", tr: "jullie = çoğul → infinitief / mastar hali (werken)" },
    },
  ],
  a2: [
    {
      q: { nl: "De stam van 'zetten' is ___ .", tr: "'zetten' fiilinin stam (gövde) hali hangisidir?" },
      opts: ["zet", "zett", "zette", "gezet"],
      a: 0,
      tr: { nl: "dubbele medeklinker wordt enkel aan het einde → zet", tr: "çift sessiz harf kelime sonunda teke düşer → zet" },
    },
    {
      q: { nl: "Wat is de stam van 'schrijven'?", tr: "'schrijven' fiilinin gövdesi nedir?" },
      opts: ["schrijv", "schrijf", "schrijft", "geschreven"],
      a: 1,
      tr: { nl: "v verandert in f aan het einde → schrijf", tr: "sondaki v harfi f olur → schrijf" },
    },
    {
      q: { nl: "Hij ___ (lezen) elke dag een krant.", tr: "O her gün bir gazete ___ (lezen = okumak)." },
      opts: ["leest", "leestt", "lees", "lezen"],
      a: 0,
      tr: { nl: "lezen → stam lees + t = leest", tr: "lezen gövdesi lees + t takısı = leest" },
    },
  ],
  b1: [
    {
      q: { nl: "'Ik ga niet, ___ ik ziek ben.' — welke conjunctie?", tr: "'Gitmiyorum, ___ hastayım.' — hangi bağlaç gelmeli?" },
      opts: ["want", "omdat", "maar", "dus"],
      a: 1,
      tr: { nl: "persoonsvorm aan het einde → omdat", tr: "fiil cümlenin en sonunda olduğu için yan cümle bağlacı 'omdat' kullanılmalıdır" },
    },
    {
      q: { nl: "'Hij zegt ___ hij morgen komt.'", tr: "'Yarın geleceğini (___) söylüyor.'" },
      opts: ["want", "maar", "dat", "als"],
      a: 2,
      tr: { nl: "dat + persoonsvorm aan het einde", tr: "dat bağlacı yan cümle kurar ve fiili sona iter" },
    },
    {
      q: { nl: "'___ ik thuis ben, werk ik beter.'", tr: "'Evde ___ , daha iyi çalışırım.'" },
      opts: ["Omdat", "Als", "Want", "Maar"],
      a: 1,
      tr: { nl: "als = indien/wanneer (voorwaarde)", tr: "als = -dığı zaman / eğer (koşul belirtir)" },
    },
    {
      q: { nl: "Verschil tussen 'want' en 'omdat'?", tr: "'want' ile 'omdat' arasındaki temel fark nedir?" },
      opts: [
        "Ze zijn hetzelfde / İkisi tamamen aynıdır",
        "want: verb 2e pos; omdat: verb aan het einde / want: fiil 2. sırada; omdat: fiil en sonda",
        "omdat: verb 2e pos; want: verb aan het einde / omdat: fiil 2. sırada; want: fiil en sonda",
        "Beide sturen het verb naar het einde / Her ikisinde de fiil en sona gider",
      ],
      a: 1,
      tr: { nl: "want = normale volgorde, omdat = bijzin (verb aan het einde)", tr: "want normal düz cümle kurar, omdat ise fiili en sona atar" },
    },
  ],
  b2: [
    {
      q: { nl: "'Morgen werk ik thuis.' — Welk gebruik van de tegenwoordige tijd?", tr: "'Morgen werk ik thuis.' — Bu cümledeki şimdiki zaman kullanımı hangisidir?" },
      opts: ["Nu gebeurend / Şu an gerçekleşen", "Gewoonte / Alışkanlık", "Nabije toekomst / Yakın gelecek", "Historisch / Tarihsel anlatım"],
      a: 2,
      tr: { nl: "tijdsaanduiding van de toekomst + tegenwoordige tijd = nabije toekomst", tr: "gelecek zaman zarfı + şimdiki zaman kullanımı yakın geleceği ifade eder" },
    },
    {
      q: { nl: "Hoe vraag je dit formeel?", tr: "Bunu resmi olarak nasıl sorarsınız?" },
      opts: ["Werk jij hier?", "Werkt u hier?", "Jij werkt hier?", "Werk u hier?"],
      a: 1,
      tr: { nl: "u-vorm (formeel): stam + t → Werkt u", tr: "u (siz) formu resmi çekimdir: stam + t → Werkt u" },
    },
  ],
};

interface QuizState {
  current: number;
  score: number;
  answered: (number | null)[];
  feedback: string;
}

interface TegenwoordigeTijdPanelProps {
  accentColor: string;
}

export default function TegenwoordigeTijdPanel({ accentColor }: TegenwoordigeTijdPanelProps) {
  const [langNL, setLangNL] = useState(true);
  const [activeLevel, setActiveLevel] = useState<"a1" | "a2" | "b1" | "b2">("a1");
  const [activeTab, setActiveTab] = useState("rule1");

  // Converter States
  const [verbInput1, setVerbInput1] = useState("werken");
  const [conjResult1, setConjResult1] = useState<any>(null);

  // Quiz States
  const [quizStates, setQuizStates] = useState<Record<string, QuizState>>({
    a1: { current: 0, score: 0, answered: Array(8).fill(null), feedback: "" },
    a2: { current: 0, score: 0, answered: Array(3).fill(null), feedback: "" },
    b1: { current: 0, score: 0, answered: Array(4).fill(null), feedback: "" },
    b2: { current: 0, score: 0, answered: Array(2).fill(null), feedback: "" },
  });

  const handleConjugate1 = () => {
    const v = verbInput1.trim().toLowerCase();
    if (!v) return;
    if (IRREGULAR_VERBS[v]) {
      const ir = IRREGULAR_VERBS[v];
      setConjResult1({
        verb: v,
        irregular: true,
        ik: ir.ik,
        jij: ir.jij,
        hij: ir.hij,
        wij: ir.wij,
      });
      return;
    }
    const s = getStem(v);
    const t = s.endsWith("t") ? s : s + "t";
    setConjResult1({
      verb: v,
      irregular: false,
      stam: s,
      ik: s,
      jij: t,
      hij: t,
      wij: v,
      inversie: `${s} jij?`,
    });
  };

  const handleQuizSelect = (optIndex: number) => {
    const state = quizStates[activeLevel];
    if (state.answered[state.current] !== null) return;

    const questions = TEGENWOORDIGE_QUESTIONS[activeLevel];
    const q = questions[state.current];
    const isCorrect = optIndex === q.a;

    const newAnswered = [...state.answered];
    newAnswered[state.current] = optIndex;

    const newScore = isCorrect ? state.score + 1 : state.score;
    const feedbackText = isCorrect
      ? langNL
        ? `✅ Correct! ${q.tr.nl}`
        : `✅ Doğru! ${q.tr.tr}`
      : langNL
      ? `❌ Fout. ${q.tr.nl}`
      : `❌ Yanlış. ${q.tr.tr}`;

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
    const total = TEGENWOORDIGE_QUESTIONS[activeLevel].length;
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
    const total = TEGENWOORDIGE_QUESTIONS[activeLevel].length;
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
    handleConjugate1();
  }, []);

  const renderQuizContent = (lvl: string) => {
    const state = quizStates[lvl];
    const questions = TEGENWOORDIGE_QUESTIONS[lvl];
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
                : langNL ? "Je bent goed op weg! Bekijk je fouten." : "İyi gidiyorsun! Yanlışları gözden geçir."}
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

      {/* Hero-like Info */}
      <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <span className="tag mb-2">🔤 Tegenwoordige tijd — {langNL ? "onvoltooid tegenwoordige tijd" : "şimdiki / geniş zaman"}</span>
          <h2 className="font-black text-xl uppercase tracking-tight mt-2 mb-1">
            {langNL ? "Nederlandse tegenwoordige tijd" : "Hollandaca şimdiki zaman"}
          </h2>
          <p className="text-sm font-medium leading-relaxed max-w-[720px] mb-4">
            {langNL
              ? "Dit onderwerp is de basis van alle tijden. Eerst zoek je de stam (het grondwoord), daarna voeg je de persoonsuitgang toe. Net als 'çalış-' in het Turks; in het Nederlands is 'werk' de stam en daar begint alles."
              : "Bu konu bütün zamanların temelidir. Önce stam (kök) bulursun, sonra kişi ekini takarsın. Türkçe'de 'çalış-' gibi; Hollandaca'da 'werk-' köküdür ve her şey buradan başlar."}
          </p>

          {/* Level Switcher bar */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "a1", label: langNL ? "A1 — Basis" : "A1 — Temel" },
              { key: "a2", label: langNL ? "A2 — Regels" : "A2 — Kurallar" },
              { key: "b1", label: langNL ? "B1 — Bijzin" : "B1 — Yan cümle" },
              { key: "b2", label: langNL ? "B2 — Stijl" : "B2 — Stil" },
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
            {/* STAM + KURALLAR */}
            <div className="md:col-span-7 border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
              <span className="lbadge lbadge-a1">A1</span>
              <h2 className="font-black text-sm uppercase tracking-wide mb-3">
                {langNL ? "1. Hoe vind je de stam?" : "1. Stam nasıl bulunur?"}
              </h2>
              <p className="text-sm mb-4">
                {langNL
                  ? "Stam = infinitief − en. Denk aan 'çalış-' in het Turks: eerst de stam, dan de uitgang."
                  : "Stam = infinitief − en. Türkçe'deki 'çalış-' gibi düşün: önce kök (stam), sonra ek."}
              </p>
              
              {/* Stam formülü — renkli yazı */}
              <div className="text-center mb-4">
                <p className="text-2xl font-black tracking-tight">
                  <span className="text-[var(--text)]">maken</span>
                  <span className="text-[var(--danger)]"> − en</span>
                  <span className="text-[var(--text-muted)] font-normal"> → </span>
                  <span className="text-[var(--success)]">maak ✓</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5">
                  <span className="text-[var(--text-muted)]">{langNL ? "mastar" : "mastar"}</span>
                  <span className="text-[var(--text-muted)] opacity-50"> − </span>
                  <span className="text-[var(--danger)]">{langNL ? "verwijder" : "çıkarılan"}</span>
                  <span className="text-[var(--text-muted)] opacity-50"> → </span>
                  <span className="text-[var(--success)]">{langNL ? "stam" : "gövde"}</span>
                </p>
              </div>

              <p className="text-xs text-[var(--text)] opacity-50 italic mb-4">
                {langNL
                  ? "Maar let op: de spelling brengt 4 speciale regels met zich mee →"
                  : "Ama dikkat: yazım kuralları nedeniyle 4 özel durum oluşur →"}
              </p>

              {/* Tabs */}
              <div className="flex gap-2 flex-wrap border-b border-[var(--border)] pb-2 mb-4">
                {["rule1", "rule2", "rule3", "rule4"].map((r) => {
                  const label =
                    r === "rule1"
                      ? langNL ? "Lange klinker" : "Uzun ses"
                      : r === "rule2"
                      ? langNL ? "Dubbele medeklinker" : "Çift sessiz"
                      : r === "rule3"
                      ? langNL ? "v / z verandering" : "v / z değişimi"
                      : langNL ? "Persoonsuitgangen" : "Kişi ekleri";
                  return (
                    <button
                      key={r}
                      onClick={() => setActiveTab(r)}
                      className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border-none cursor-pointer rounded-lg transition-colors ${
                        activeTab === r
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-2)]/85"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Tab panels */}
              {activeTab === "rule1" && (
                <div className="text-sm">
                  <h4 className="font-bold text-[var(--primary)] mb-2">
                    {langNL ? "Regel 1 — Lange klinker blijft behouden" : "Kural 1 — Uzun sesli harf korunur"}
                  </h4>
                  <p className="mb-3">
                    {langNL 
                      ? "Een lange klinker in een open lettergreep wordt dubbel geschreven in de stam." 
                      : "Açık hecede kalan uzun sesli harf, gövdede (stam) çift yazılarak korunur."}
                  </p>
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-[var(--surface-2)] px-2.5 py-1 border border-[var(--border)] rounded-lg text-xs font-bold">maken</span>
                      <span>→</span>
                      <span className="bg-[var(--accent)] px-2.5 py-1 border border-[var(--border)] rounded-lg text-xs font-bold">maak</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold">{langNL ? "(lange a → aa)" : "(uzun a → aa)"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[var(--surface-2)] px-2.5 py-1 border border-[var(--border)] rounded-lg text-xs font-bold">lopen</span>
                      <span>→</span>
                      <span className="bg-[var(--accent)] px-2.5 py-1 border border-[var(--border)] rounded-lg text-xs font-bold">loop</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold">{langNL ? "(lange o → oo)" : "(uzun o → oo)"}</span>
                    </div>
                  </div>
                  <div className="bg-[var(--accent)]/20 border-l-4 border-[var(--accent)] p-3 rounded-r-lg text-xs leading-relaxed">
                    {langNL
                      ? "Voor de klank: \"mak\" klinkt kort, \"maak\" klinkt lang. De spelling behoudt de lange klank."
                      : "Türkçe kulağı için: \"mak\" dersen ses kısa, \"maak\" dersen uzun. Hollandaca yazı, sesi korumak için uzar."}
                  </div>
                </div>
              )}

              {activeTab === "rule2" && (
                <div className="text-sm">
                  <h4 className="font-bold text-[var(--primary)] mb-2">
                    {langNL ? "Regel 2 — Çift sessiz teke düşer" : "Kural 2 — Çift sessiz harf teke düşer"}
                  </h4>
                  <p className="mb-3">
                    {langNL 
                      ? "Er staat nooit een dubbele medeklinker aan het einde van een woord. Eén medeklinker vervalt." 
                      : "Hollandaca kelimelerin sonunda çift sessiz harf bulunmaz. Bu yüzden gövde sonundaki çift harf teke düşürülür."}
                  </p>
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-[var(--surface-2)] px-2.5 py-1 border border-[var(--border)] rounded-lg text-xs font-bold">zetten</span>
                      <span>→</span>
                      <span className="bg-[var(--accent)] px-2.5 py-1 border border-[var(--border)] rounded-lg text-xs font-bold">zet</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold">{langNL ? "(tt → t)" : "(tt → t)"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[var(--surface-2)] px-2.5 py-1 border border-[var(--border)] rounded-lg text-xs font-bold">bidden</span>
                      <span>→</span>
                      <span className="bg-[var(--accent)] px-2.5 py-1 border border-[var(--border)] rounded-lg text-xs font-bold">bid</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold">{langNL ? "(dd → d)" : "(dd → d)"}</span>
                    </div>
                  </div>
                  <div className="bg-[var(--accent)]/20 border-l-4 border-[var(--accent)] p-3 rounded-r-lg text-xs leading-relaxed">
                    {langNL
                      ? "Stam aan het einde van een woord heeft geen nut voor dubbele letters, dus één letter valt weg."
                      : "Stam sonunda çift sessiz bulunması gereksizdir, fazla olan harf atılır."}
                  </div>
                </div>
              )}

              {activeTab === "rule3" && (
                <div className="text-sm">
                  <h4 className="font-bold text-[var(--primary)] mb-2">
                    {langNL ? "Regel 3 — Sonda v ve z yaşayamaz" : "Kural 3 — Sonda v veya z harfi bulunamaz"}
                  </h4>
                  <p className="mb-3">
                    {langNL 
                      ? "De stam van een werkwoord mag nooit eindigen op v veya z. Dit verandert in f veya s." 
                      : "Hollandaca'da bir gövde asla v veya z ile bitemez. Bunlar en yakın sert sessizleri olan f veya s harflerine dönüşür."}
                  </p>
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-[var(--surface-2)] px-2.5 py-1 border border-[var(--border)] rounded-lg text-xs font-bold">leven</span>
                      <span>→</span>
                      <span className="bg-[var(--accent)] px-2.5 py-1 border border-[var(--border)] rounded-lg text-xs font-bold">leef</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold">{langNL ? "(v → f)" : "(v → f)"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[var(--surface-2)] px-2.5 py-1 border border-[var(--border)] rounded-lg text-xs font-bold">reizen</span>
                      <span>→</span>
                      <span className="bg-[var(--accent)] px-2.5 py-1 border border-[var(--border)] rounded-lg text-xs font-bold">reis</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold">{langNL ? "(z → s)" : "(z → s)"}</span>
                    </div>
                  </div>
                  <div className="bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)] p-3 rounded-xl text-xs font-bold mb-3">
                    ❌ Ik lev / Ik reiz &nbsp;&nbsp;→&nbsp;&nbsp; ✅ Ik leef / Ik reis
                  </div>
                  <div className="bg-[var(--accent)]/20 border-l-4 border-[var(--accent)] p-3 rounded-r-lg text-xs leading-relaxed">
                    {langNL
                      ? "Maar let op: in de wij/jullie/zij vormen (meervoud) gebruiken we het hele werkwoord (infinitief), dus de v en z komen terug!"
                      : "Unutmayın: Çoğul (wij/jullie/zij) çekiminde mastar hal kullanıldığı için v ve z harfleri geri gelir (wij leven, wij reizen)."}
                  </div>
                </div>
              )}

              {activeTab === "rule4" && (
                <div className="text-sm">
                  <h4 className="font-bold text-[var(--primary)] mb-2.5">
                    {langNL ? "Regel 4 — Persoonsuitgangen" : "Kural 4 — Şahıs ekleri (Kişi Çekimleri)"}
                  </h4>
                  <div className="overflow-x-auto border border-[var(--border)] rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                          <th className="px-3 py-2 font-bold text-left">{langNL ? "Persoon" : "Kişi"}</th>
                          <th className="px-3 py-2 font-bold text-left">{langNL ? "Formule" : "Formül"}</th>
                          <th className="px-3 py-2 font-bold text-left">werken</th>
                          <th className="px-3 py-2 font-bold text-left">{langNL ? "Betekenis" : "Anlamı"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] font-semibold">
                        <tr>
                          <td className="px-3 py-2 font-black">ik</td>
                          <td className="px-3 py-2">stam</td>
                          <td className="px-3 py-2 text-[var(--primary)]">ik werk</td>
                          <td className="px-3 py-2">{langNL ? "Ik werk" : "Çalışıyorum"}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-black">jij / je</td>
                          <td className="px-3 py-2">stam + t</td>
                          <td className="px-3 py-2 text-[var(--primary)]">jij werkt</td>
                          <td className="px-3 py-2">{langNL ? "Jij werkt" : "Çalışıyorsun"}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-black">hij / zij / het</td>
                          <td className="px-3 py-2">stam + t</td>
                          <td className="px-3 py-2 text-[var(--primary)]">hij werkt</td>
                          <td className="px-3 py-2">{langNL ? "Hij werkt" : "Çalışıyor (erkek/kadın)"}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-black">wij / jullie / zij</td>
                          <td className="px-3 py-2">infinitief</td>
                          <td className="px-3 py-2 text-[var(--primary)]">wij werken</td>
                          <td className="px-3 py-2">{langNL ? "Wij werken" : "Çalışıyoruz / Çalışıyorsunuz / Çalışıyorlar"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)] p-3 rounded-xl text-xs font-bold mt-3">
                    {langNL
                      ? "Als de stam al op een 't' eindigt, voeg dan geen extra 't' toe: zetten → stam = zet → hij zet (nooit zett!)."
                      : "Eğer gövde zaten 't' harfi ile bitiyorsa, ekstra bir -t eklenmez: zetten → gövde = zet → hij zet (asla 'zett' yazılmaz)."}
                  </div>
                </div>
              )}
            </div>

            {/* FİİL DÖNÜŞTÜRÜCÜ */}
            <div className="md:col-span-5 border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className="lbadge lbadge-a1">A1</span>
                <h2 className="font-black text-sm uppercase tracking-wide mb-2">
                  {langNL ? "2. Werkwoordomzetter" : "2. Fiil dönüştürücü"}
                </h2>
                <p className="text-xs mb-4 text-[var(--text)] opacity-65">
                  {langNL
                    ? "Typ een werkwoord om de stam en de tegenwoordige tijd te zien."
                    : "Bir fiil yazın; gövdesini ve şimdiki zaman çekimlerini görün."}
                </p>
                <div className="flex flex-col gap-2 mb-4">
                  <input
                    type="text"
                    value={verbInput1}
                    onChange={(e) => setVerbInput1(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConjugate1()}
                    placeholder="werken, maken, leven..."
                    className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl text-sm font-black bg-[var(--surface)]"
                  />
                  <button
                    onClick={handleConjugate1}
                    className="w-full px-4 py-2.5 bg-[var(--primary)] text-white font-bold rounded-xl border-none hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer"
                  >
                    {langNL ? "Vervoeg" : "Çekimle"}
                  </button>
                </div>
              </div>

              {conjResult1 && (
                <div className="bg-[var(--surface-2)] border border-[var(--border)] p-4 rounded-xl">
                  <p className="text-xs font-black uppercase tracking-wider mb-2 text-[var(--primary)]">
                    {conjResult1.verb} {conjResult1.irregular ? (langNL ? "— onregelmatig" : "— düzensiz") : ""}
                  </p>
                  {conjResult1.irregular ? (
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                      <div>ik: <b>{conjResult1.ik}</b></div>
                      <div>jij: <b>{conjResult1.jij}</b></div>
                      <div>hij: <b>{conjResult1.hij}</b></div>
                      <div>wij: <b>{conjResult1.wij}</b></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                      <div className="col-span-2">
                        Stam ({langNL ? "Gövde" : "Gövde"}): <span className="text-[var(--danger)]">{conjResult1.stam}</span>
                      </div>
                      <div>ik: <b>{conjResult1.ik}</b></div>
                      <div>jij: <b>{conjResult1.jij}</b></div>
                      <div>hij: <b>{conjResult1.hij}</b></div>
                      <div>wij: <b>{conjResult1.wij}</b></div>
                      <div className="col-span-2 border-t border-[var(--border)] pt-1.5 mt-1 text-[10px] text-[var(--text-muted)]">
                        {langNL ? "Inversie" : "İnversie (Soru/Devrik)"}: <span className="italic">{conjResult1.inversie}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <p className="text-[10px] text-[var(--text)] opacity-50 mt-3 font-semibold">
                {langNL ? "Probeer:" : "Dene:"} maken · lopen · lezen · leven · reizen · zetten · zijn · hebben · geven
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* İNVERSİE */}
            <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
              <span className="lbadge lbadge-a1">A1</span>
              <h2 className="font-black text-sm uppercase tracking-wide mb-2">
                {langNL ? "3. Inversie — de omgekeerde volgorde" : "3. İnversie — küçük tuzak"}
              </h2>
              <p className="text-sm mb-4 leading-relaxed">
                {langNL
                  ? "In het Nederlands staat het werkwoord altijd op de 2e positie. Als de zin met iets anders begint (zoals tijd of plaats), wisselen het werkwoord en het onderwerp van plaats."
                  : "Hollandaca'da fiil her zaman cümlenin 2. pozisyonunda durur. Cümle başka bir kelimeyle (zaman, yer) başlarsa fiil ile özne yer değiştirir."}
              </p>
              <div className="overflow-x-auto border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full text-xs font-bold">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      <th className="px-3 py-2 text-left">{langNL ? "Normale volgorde" : "Normal cümle sırası"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "Inversie" : "İnversie (Devrik)"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    <tr>
                      <td className="px-3 py-2">Jij werkt vandaag.</td>
                      <td className="px-3 py-2 text-[var(--primary)]">Vandaag werk jij.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">Hij werkt vandaag.</td>
                      <td className="px-3 py-2 text-[var(--danger)]">Vandaag werkt hij.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Ladder A1 -> B2 */}
          <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
            <h3 className="font-black text-sm uppercase tracking-wide mb-4">
              {langNL ? "Stapsgewijze uitleg A1 → B2" : "A1 → B2 aşamalı anlatım"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  level: "A1",
                  textNL: "Leer de formule: ik = stam, jij/hij = stam+t, wij = infinitief.",
                  textTR: "Formülü öğren: ik = stam, jij/hij = stam+t, wij = infinitief.",
                },
                {
                  level: "A2",
                  textNL: "Beheers de spellingregels: maak, loop, leef, reis.",
                  textTR: "Yazım kurallarını oturt: maak, loop, leef, reis.",
                },
                {
                  level: "B1",
                  textNL: "Controleer inversie en woordvolgorde in bijzinnen: Morgen werk ik. Omdat ik morgen werk...",
                  textTR: "İnversie ve yan cümlede fiil yerini kontrol et: Morgen werk ik. Omdat ik morgen werk...",
                },
                {
                  level: "B2",
                  textNL: "Stijlverschil: je/jij gebruik in spreektaal, nadruk, formele u-vorm en context.",
                  textTR: "Stil farkını öğren: konuşma dilinde je/jij kullanımı, vurgu, resmi u-formu ve bağlam.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="border border-[var(--border)] rounded-xl p-4 bg-[var(--surface-2)]/50"
                >
                  <span className="font-black text-lg text-[var(--primary)] block mb-1">{item.level}</span>
                  <p className="text-xs leading-relaxed font-semibold">{langNL ? item.textNL : item.textTR}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Grid: Quiz & Common Mistakes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quiz */}
            {renderQuizContent("a1")}

            {/* Common Mistakes */}
            <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
              <h3 className="font-black text-sm uppercase tracking-wide mb-3 text-[var(--danger)]">
                {langNL ? "5. Veelgemaakte fouten" : "5. Türklerin en sık yaptığı hatalar"}
              </h3>
              <div className="flex flex-col gap-3.5">
                <div className="border border-[var(--danger)] bg-[var(--danger-soft)]/5 rounded-xl p-3 text-xs leading-relaxed">
                  <p className="font-bold text-[var(--danger)]">❌ {langNL ? "Fout" : "Fout / Yanlış"}:</p>
                  <p className="italic opacity-85 mb-2">Wij werkt. • Werk jijt? • Ik mak.</p>
                  <p className="font-bold text-[var(--success)]">✅ {langNL ? "Goed" : "Goed / Doğru"}:</p>
                  <p className="font-black">Wij werken. • Werk jij? • Ik maak.</p>
                </div>
                <p className="text-[10px] text-[var(--text)] opacity-55 leading-relaxed font-bold">
                  {langNL
                    ? "Onthoud: meervoud gebruikt altijd de infinitief. Bij inversie met 'jij' achter het werkwoord vervalt de -t."
                    : "Kural sade: çoğul öznelerde her zaman mastar (infinitief) kullanılır. İnversie'de 'jij' fiilden sonra gelirse -t eki düşer."}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════════ A2 PANELİ ══════════ */}
      {activeLevel === "a2" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-12 border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
              <span className="lbadge lbadge-a2">A2</span>
              <h2 className="font-black text-sm uppercase tracking-wide mb-3">
                {langNL ? "Stam → Basis voor andere tijden" : "Stam → Diğer zamanların temeli"}
              </h2>
              <p className="text-sm mb-4">
                {langNL
                  ? "Wat je in A2 leert is cruciaal: de stam die je leert in de tegenwoordige tijd is ook de basis voor het perfectum ve imperfectum."
                  : "A2'de öğreneceğiniz en önemli şey şudur: şimdiki zamanda (tegenwoordige tijd) bulduğumuz stam (gövde), geçmiş zaman (perfectum) ve hikaye zamanının (imperfectum) da temelidir."}
              </p>
              <div className="overflow-x-auto border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full text-xs font-semibold">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      <th className="px-3 py-2 text-left">{langNL ? "Tijd" : "Zaman"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "Formule" : "Formül"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "Voorbeeld werken" : "werken örneği"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "Vertaling" : "Türkçesi"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    <tr>
                      <td className="px-3 py-2 font-bold">Tegenwoordige tijd</td>
                      <td className="px-3 py-2">stam / stam + t</td>
                      <td className="px-3 py-2">ik <b className="text-[var(--primary)]">werk</b></td>
                      <td className="px-3 py-2">{langNL ? "Ik werk" : "çalışıyorum"}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold">Perfectum</td>
                      <td className="px-3 py-2">hebben + ge + stam + t/d</td>
                      <td className="px-3 py-2">ik heb ge<b className="text-[var(--danger)]">werkt</b></td>
                      <td className="px-3 py-2">{langNL ? "Ik heb gewerkt" : "çalıştım (günlük konuşma)"}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold">Imperfectum</td>
                      <td className="px-3 py-2">stam + te/de</td>
                      <td className="px-3 py-2">ik <b className="text-[var(--accent)]">werk</b>te</td>
                      <td className="px-3 py-2">{langNL ? "Ik werkte" : "çalışıyordum (hikaye anlatımı)"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-[var(--accent)]/20 border-l-4 border-[var(--accent)] p-3 rounded-r-lg text-xs leading-relaxed mt-4">
                {langNL
                  ? "🔑 Conclusie: Als je de stam eenmaal goed leert, kun je alle drie de tijden correct vormen. Daarom zijn de stamregels in A1 zo belangrijk."
                  : "🔑 Sonuç: Gövdeyi (stam) bir kez doğru öğrenirseniz, diğer tüm zamanları da hatasız kurabilirsiniz. Bu yüzden A1'deki gövde kuralları çok önemlidir."}
              </div>
            </div>

            {/* A2 Quiz */}
            <div className="md:col-span-12 flex flex-col justify-between">
              {renderQuizContent("a2")}
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════════ B1 PANELİ ══════════ */}
      {activeLevel === "b1" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
              <span className="lbadge lbadge-b1">B1</span>
              <h2 className="font-black text-sm uppercase tracking-wide mb-3">
                {langNL ? "In de bijzin gaat het werkwoord naar het einde" : "Yan cümlede fiil sona gider"}
              </h2>
              <p className="text-sm mb-4">
                {langNL
                  ? "Een kritieke regel voor B1: in bijzinnen die beginnen met voegwoorden zoals omdat, dat, als, terwijl, toen gaat het werkwoord helemaal naar het einde."
                  : "B1 seviyesinin en kritik kuralı: 'omdat, dat, als, terwijl, toen' gibi bağlaçlarla başlayan yan cümlelerde (bijzin) çekimli fiil en sona gider."}
              </p>

              <div className="flex flex-col gap-3 mb-4">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-sm">
                  <div className="font-black text-sm mb-1">
                    Ik ga niet, <span className="bg-[var(--accent)] px-1.5 py-0.5 rounded border border-[var(--border)]">omdat</span> ik ziek <b className="text-[var(--danger)]">ben</b>.
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-semibold">
                    {langNL ? "Ik ga niet, omdat ik ziek ben." : "Gitmiyorum, çünkü hastayım."}
                  </div>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 shadow-sm">
                  <div className="font-black text-sm mb-1">
                    Ik denk <span className="bg-[var(--accent)] px-1.5 py-0.5 rounded border border-[var(--border)]">dat</span> hij morgen <b className="text-[var(--danger)]">werkt</b>.
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-semibold">
                    {langNL ? "Ik denk dat hij morgen werkt." : "Yarın çalışacağını düşünüyorum."}
                  </div>
                </div>
              </div>

              <div className="bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)] p-3 rounded-xl text-xs font-bold mb-4">
                {langNL
                  ? "⚠️ want ≠ omdat: na 'want' volgt de normale woordvolgorde, na 'omdat' gaat het werkwoord naar het einde. Veelgemaakte fout!"
                  : "⚠️ want ≠ omdat: 'want' sonrasında normal cümle sırası gelirken, 'omdat' sonrasında fiil en sona gider. Sık yapılan bir hatadır!"}
              </div>

              <div className="overflow-x-auto border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full text-xs font-semibold">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      <th className="px-3 py-2 text-left">{langNL ? "Voegwoord" : "Bağlaç"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "Positie werkwoord" : "Fiil pozisyonu"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "Voorbeeld" : "Örnek"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    <tr>
                      <td className="px-3 py-2 font-bold">want</td>
                      <td className="px-3 py-2 text-[var(--success)]">{langNL ? "2e positie (normaal)" : "2. pozisyon (normal)"}</td>
                      <td className="px-3 py-2">…want hij <b className="text-[var(--primary)]">werkt</b> hard.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold">omdat</td>
                      <td className="px-3 py-2 text-[var(--danger)]">{langNL ? "Einde!" : "Sona!"}</td>
                      <td className="px-3 py-2">…omdat hij hard <b className="text-[var(--danger)]">werkt</b>.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* B1 Quiz */}
            <div className="md:col-span-5 flex flex-col justify-between">
              {renderQuizContent("b1")}
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════════ B2 PANELİ ══════════ */}
      {activeLevel === "b2" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-12 border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
              <span className="lbadge lbadge-b2">B2</span>
              <h2 className="font-black text-sm uppercase tracking-wide mb-3">
                {langNL ? "Tegenwoordige tijd — 5 toepassingen" : "Tegenwoordige Tijd — 5 farklı kullanım alanı"}
              </h2>
              <div className="overflow-x-auto border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full text-xs font-semibold">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      <th className="px-3 py-2 text-left">{langNL ? "Toepassing" : "Kullanım Alanı"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "Voorbeeld" : "Örnek"}</th>
                      <th className="px-3 py-2 text-left">{langNL ? "Betekenis" : "Türkçe Karşılığı"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    <tr>
                      <td className="px-3 py-2 font-bold">{langNL ? "Nu gebeurend" : "Şu an olan eylemler"}</td>
                      <td className="px-3 py-2">Ik werk nu aan een project.</td>
                      <td className="px-3 py-2">Şu an bir proje üzerinde çalışıyorum.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold">{langNL ? "Gewoonte / routine" : "Alışkanlık / rutin"}</td>
                      <td className="px-3 py-2">Ik werk elke dag van 9 tot 5.</td>
                      <td className="px-3 py-2">Her gün 9'dan 5'e kadar çalışırım.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold">{langNL ? "Algemeen feit" : "Genel doğrular"}</td>
                      <td className="px-3 py-2">Water kookt op 100 graden.</td>
                      <td className="px-3 py-2">Su 100 derecede kaynar.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold">{langNL ? "Nabije toekomst" : "Yakın gelecek"}</td>
                      <td className="px-3 py-2">Morgen werk ik thuis.</td>
                      <td className="px-3 py-2">Yarın evden çalışacağım.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold">{langNL ? "Historische vertelling" : "Tarihsel anlatım"}</td>
                      <td className="px-3 py-2">Napoleon verliest de slag bij Waterloo.</td>
                      <td className="px-3 py-2">Napolyon Waterloo savaşını kaybeder (anlatı).</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:col-span-7 border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-4 shadow-sm">
              <span className="lbadge lbadge-b2">B2</span>
              <h2 className="font-black text-sm uppercase tracking-wide mb-3">
                {langNL ? "Formeel vs. informeel" : "Resmi ve Samimi hitap (u vs. jij)"}
              </h2>
              <p className="text-sm mb-4">
                {langNL
                  ? "In het Nederlands is het verschil in aanspreekvorm belangrijk voor de sociale context:"
                  : "Hollandaca'da hitap şekli seçimi sosyal bağlam açısından büyük önem taşır:"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="border border-[var(--border)] bg-[var(--surface-2)]/50 rounded-xl p-4">
                  <h4 className="font-black text-xs uppercase tracking-wider mb-2 text-[var(--primary)]">
                    {langNL ? "Formeel — u" : "Resmi — u (Siz)"}
                  </h4>
                  <div className="text-sm font-bold mb-1">Werkt <span className="text-[var(--primary)]">u</span> hier?</div>
                  <div className="text-xs text-[var(--text-muted)] mb-3">{langNL ? "Werkt u hier?" : "Burada çalışıyor musunuz? (resmi)"}</div>
                  
                  <div className="text-sm font-bold mb-1">Kunt <span className="text-[var(--primary)]">u</span> mij helpen?</div>
                  <div className="text-xs text-[var(--text-muted)]">{langNL ? "Kunt u mij helpen?" : "Bana yardımcı olabilir misiniz?"}</div>
                </div>

                <div className="border border-[var(--border)] bg-[var(--surface)] rounded-xl p-4">
                  <h4 className="font-black text-xs uppercase tracking-wider mb-2 text-[var(--danger)]">
                    {langNL ? "Informeel — jij / je" : "Samimi — jij / je (Sen)"}
                  </h4>
                  <div className="text-sm font-bold mb-1">Werk <span className="text-[var(--danger)]">jij</span> hier?</div>
                  <div className="text-xs text-[var(--text-muted)] mb-3">{langNL ? "Werk jij hier?" : "Burada çalışıyor musun? (samimi)"}</div>
                  
                  <div className="text-sm font-bold mb-1">Kun <span className="text-[var(--danger)]">jij</span> me helpen?</div>
                  <div className="text-xs text-[var(--text-muted)]">{langNL ? "Kun jij me helpen?" : "Bana yardım edebilir misin?"}</div>
                </div>
              </div>

              <div className="bg-[var(--accent)]/20 border-l-4 border-[var(--accent)] p-3 rounded-r-lg text-xs leading-relaxed">
                {langNL
                  ? "💡 In Nederland wordt op de werkvloer ook steeds vaker 'jij/je' gebruikt. 'u' is gereserveerd voor ouderen, klanten en officiële documenten."
                  : "💡 Hollanda'da iş yerinde de giderek daha çok 'jij/je' tercih ediliyor. 'u' ise yaşlılara, müşterilere ve resmi yazışmalara ayrılmıştır."}
              </div>
            </div>

            {/* B2 Quiz */}
            <div className="md:col-span-5 flex flex-col justify-between">
              {renderQuizContent("b2")}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
