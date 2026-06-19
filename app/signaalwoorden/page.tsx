"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useProgress } from "@/lib/hooks";
import type { SignaalwoordCategory } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────
type Screen = "home" | "kesfet" | "oefen" | "test" | "result";
type Lang = "nl" | "tr";

interface WordCard {
  word: { nl: string; tr: string };
  example: { nl: string; tr: string } | null;
}

interface QuizItem {
  sentence: string;
  answer: string;
  options: string[];
  hint: string;
  categoryName: string;
  wordTr: string;
}

// ─── Helpers ──────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseCategory(cat: SignaalwoordCategory): WordCard[] {
  const cards: WordCard[] = [];
  for (let i = 0; i < cat.words.length - 1; i += 2) {
    const word = cat.words[i];
    const example = cat.words[i + 1];
    if (!word || word.nl.length > 40) continue;
    cards.push({
      word,
      example: example && example.nl.length >= 15 ? example : null,
    });
  }
  return cards;
}

// ─── Level map ────────────────────────────────────────────
const LEVEL_MAP: Record<string, string[]> = {
  A1: ["Opsomming", "Tijd"],
  A2: ["Opsomming", "Tijd", "Tegenstelling", "reden / verklaring", "Conclusie"],
  B1: [
    "Opsomming",
    "Tijd",
    "Tegenstelling",
    "Toelichting/ voorbeeld",
    "Voorwaarde",
    "doel / middel",
    "Samenvatting",
    "Conclusie",
    "reden / verklaring",
  ],
  B2: [], // all
};

// ─── Category soft palette ───────────────────────────────
interface CatPalette { bg: string; text: string; accent: string; buttonHover: string }

const CAT_PALETTE: Record<string, CatPalette> = {
  Opsomming:              { bg: "rgba(56,189,248,0.1)", text: "var(--primary)", accent: "var(--primary)", buttonHover: "rgba(56,189,248,0.2)" },
  Tijd:                   { bg: "rgba(168,85,247,0.1)", text: "#6b21a8", accent: "#7b2fbe", buttonHover: "rgba(168,85,247,0.2)" },
  Tegenstelling:          { bg: "rgba(244,63,94,0.1)", text: "var(--danger)", accent: "var(--danger)", buttonHover: "rgba(244,63,94,0.2)" },
  "Toelichting/ voorbeeld": { bg: "rgba(245,158,11,0.1)", text: "#78600a", accent: "#b8860a", buttonHover: "rgba(245,158,11,0.2)" },
  Voorwaarde:             { bg: "rgba(234,88,12,0.1)", text: "#92430a", accent: "#e8860a", buttonHover: "rgba(234,88,12,0.2)" },
  "doel / middel":        { bg: "rgba(13,148,136,0.1)", text: "var(--success)", accent: "var(--success)", buttonHover: "rgba(13,148,136,0.2)" },
  Samenvatting:           { bg: "rgba(100,116,139,0.1)", text: "var(--text)", accent: "var(--text-muted)", buttonHover: "rgba(100,116,139,0.2)" },
  Conclusie:              { bg: "rgba(2,132,199,0.1)", text: "#0a4875", accent: "#1b6fab", buttonHover: "rgba(2,132,199,0.2)" },
  "reden / verklaring":   { bg: "rgba(236,72,153,0.1)", text: "#8b1a4a", accent: "#be2d6b", buttonHover: "rgba(236,72,153,0.2)" },
};

const DEFAULT_PALETTE: CatPalette = { bg: "var(--surface-2)", text: "var(--text)", accent: "var(--text-muted)", buttonHover: "rgba(0,0,0,0.05)" };

function catPalette(name: string): CatPalette {
  return CAT_PALETTE[name] ?? DEFAULT_PALETTE;
}

function catColor(name: string): string {
  return catPalette(name).accent;
}

// ─── Build quiz items ─────────────────────────────────────
function buildQuizItems(
  questionCats: SignaalwoordCategory[],
  allCats: SignaalwoordCategory[]
): QuizItem[] {
  const allWords = allCats
    .flatMap((c) =>
      c.words.filter((_, j) => j % 2 === 0).map((w) => w.nl.split("/")[0].trim())
    )
    .filter(Boolean);

  const items: QuizItem[] = [];

  for (const cat of questionCats) {
    const catWords = cat.words
      .filter((_, j) => j % 2 === 0)
      .map((w) => w.nl.split("/")[0].trim())
      .filter(Boolean);

    for (let i = 0; i < cat.words.length - 1; i += 2) {
      const word = cat.words[i];
      const example = cat.words[i + 1];
      if (!example || !word || word.nl.length > 40) continue;

      const target = word.nl.split("/")[0].trim();
      const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const gapped = example.nl.replace(
        new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "i"),
        "___"
      );
      if (!gapped.includes("___")) continue;

      const sameCatDistractors = shuffle(
        catWords.filter((w) => w.toLowerCase() !== target.toLowerCase())
      );
      const otherDistractors = shuffle(
        allWords.filter(
          (w) =>
            w.toLowerCase() !== target.toLowerCase() &&
            !sameCatDistractors.includes(w)
        )
      );
      const distractors = [...sameCatDistractors, ...otherDistractors].slice(0, 3);
      if (distractors.length < 3) continue;

      items.push({
        sentence: gapped,
        answer: target,
        options: shuffle([target, ...distractors]),
        hint: example.tr,
        categoryName: cat.category,
        wordTr: word.tr,
      });
    }
  }

  return shuffle(items);
}

// ─── Highlight signal word in example sentence ────────────
function HighlightSentence({
  sentence,
  word,
  color,
}: {
  sentence: string;
  word: string;
  color: string;
}) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = sentence.split(new RegExp(`(${escaped})`, "i"));
  return (
    <span>
      {parts.map((p, i) =>
        p.toLowerCase() === word.toLowerCase() ? (
          <strong key={i} style={{ color }}>
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function SignaalwoordenPage() {
  const { updateProgress } = useProgress();

  const [categories, setCategories] = useState<SignaalwoordCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [screen, setScreen] = useState<Screen>("home");
  const [activeCat, setActiveCat] = useState<string>("");
  const [level, setLevel] = useState<string>("A2");
  const [lang, setLang] = useState<Lang>("nl");

  const [cards, setCards] = useState<WordCard[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [nlRevealed, setNlRevealed] = useState(false);

  const handleCardClick = () => {
    setFlipped((f) => {
      const nextFlipped = !f;
      if (!nextFlipped) {
        setNlRevealed(false);
      }
      return nextFlipped;
    });
  };

  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [shaking, setShaking] = useState(false);

  const [timer, setTimer] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("spraakmaker-niveau");
    if (saved && ["A1", "A2", "B1", "B2"].includes(saved)) {
      setLevel(saved);
    }
  }, []);

  useEffect(() => {
    fetch("/data/signaalwoorden.json")
      .then((r) => r.json())
      .then((data: SignaalwoordCategory[]) => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  }, []);

  const levelCats = categories.filter((c) => {
    if (level === "B2") return true;
    return LEVEL_MAP[level]?.some(
      (name) => c.category.toLowerCase() === name.toLowerCase()
    );
  });

  const handleLevelChange = (lvl: string) => {
    setLevel(lvl);
    localStorage.setItem("spraakmaker-niveau", lvl);
    setScreen("home");
  };

  const handleLangChange = (l: Lang) => {
    setLang(l);
    setScreen("home");
  };

  const startKesfet = (catName: string) => {
    const cat = categories.find((c) => c.category === catName);
    if (!cat) return;
    setActiveCat(catName);
    setCards(parseCategory(cat));
    setCardIdx(0);
    setFlipped(false);
    setNlRevealed(false);
    setScreen("kesfet");
  };

  const startOefen = useCallback(
    (catName: string) => {
      const cat = categories.find((c) => c.category === catName);
      if (!cat) return;
      setActiveCat(catName);
      const items = buildQuizItems([cat], categories);
      setQuizItems(items);
      setQuizIdx(0);
      setSelected(null);
      setFeedback(null);
      setScore({ correct: 0, total: 0 });
      setScreen("oefen");
    },
    [categories]
  );

  const startTest = useCallback(
    (catName: string | "KARISIK") => {
      const pool =
        catName === "KARISIK" ? levelCats : categories.filter((c) => c.category === catName);
      const items = buildQuizItems(pool, categories);
      setActiveCat(catName === "KARISIK" ? "KARISIK TEST" : catName);
      setQuizItems(items);
      setQuizIdx(0);
      setSelected(null);
      setFeedback(null);
      setScore({ correct: 0, total: 0 });
      setTimer(30);
      setScreen("test");
    },
    [categories, levelCats]
  );

  useEffect(() => {
    if (screen !== "test") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (feedback) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setFeedback("wrong");
          setScore((s) => ({ correct: s.correct, total: s.total + 1 }));
          setShaking(true);
          setTimeout(() => setShaking(false), 500);
          setTimeout(() => advanceQuiz(), 1200);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, quizIdx, feedback]);

  const advanceQuiz = useCallback(() => {
    setQuizIdx((prev) => {
      const next = prev + 1;
      if (next >= quizItems.length) {
        setScreen("result");
        return prev;
      }
      setSelected(null);
      setFeedback(null);
      setTimer(30);
      return next;
    });
  }, [quizItems.length]);

  const handleSelect = (opt: string) => {
    if (feedback) return;
    const current = quizItems[quizIdx];
    if (!current) return;
    const isCorrect = opt === current.answer;
    setSelected(opt);
    setFeedback(isCorrect ? "correct" : "wrong");
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
    if (!isCorrect) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
    if (isCorrect) {
      updateProgress((p) => ({
        ...p,
        games: {
          ...p.games,
          totalPoints: p.games.totalPoints + 10,
          lastPlayDate: new Date().toISOString(),
        },
      }));
    }
    setTimeout(() => advanceQuiz(), 1100);
  };

  useEffect(() => {
    if (screen === "result" && score.total > 0) {
      updateProgress((p) => ({
        ...p,
        games: {
          ...p.games,
          totalPoints: p.games.totalPoints + score.correct * 10,
          lastPlayDate: new Date().toISOString(),
        },
      }));
    }
  }, [screen]);

  const isNL = lang === "nl";
  const T = {
    discover:          isNL ? "Ontdek →"   : "Keşfet →",
    practise:          isNL ? "Oefenen"     : "Alıştırma",
    test:              isNL ? "Toets"       : "Test",
    words:             (n: number) => isNL ? `${n} woorden` : `${n} kelime`,
    mixedTest:         (lvl: string) => isNL
      ? `🎯 Gemengde toets — alle ${lvl}-categorieën`
      : `🎯 Karışık test — tüm ${lvl} kategorileri`,
    noCategories:      isNL ? "Geen categorieën" : "Kategori yok",
    exampleSentence:   isNL ? "Voorbeeldzin ↓" : "Örnek cümle ↓",
    showDutch:         isNL ? "Toon Nederlands"  : "Hollandacayı göster",
    meaning:           isNL ? "Turkse betekenis" : "Türkçe anlam",
    next:              isNL ? "Volgende →"       : "Sonraki →",
    finish:            isNL ? "Klaar ✓"          : "Bitir ✓",
    back:              isNL ? "← Terug"          : "← Geri",
    backToCategories:  isNL ? "← Terug naar categorieën" : "← Kategorilere Dön",
    allWordsSeen:      isNL ? "Alle woorden gezien!"    : "Tüm kelimeler görüldü!",
    wordsDone:         (n: number) => isNL ? `${n} woorden afgerond` : `${n} kelime tamamlandı`,
    goToPractise:      isNL ? "Naar Oefenen →"  : "Oefen'e Geç →",
    chooseWord:        isNL ? "Kies het goede woord" : "Doğru kelimeyi seç",
    hint:              isNL ? "💡 Vertaling"  : "💡 İpucu",
    correct:           (w: string, tr: string) => isNL ? `✓ Goed! — ${w} = ${tr}` : `✓ Doğru! — ${w} = ${tr}`,
    wrong:             (w: string, tr: string) => isNL ? `✗ Fout — juiste antwoord: ${w} (${tr})` : `✗ Yanlış — doğrusu: ${w} (${tr})`,
    correctLabel:      isNL ? "goed"  : "doğru",
    wrongLabel:        isNL ? "fout"  : "yanlış",
    timeLabel:         isNL ? "tijd"  : "süre",
    resultTitle:       isNL ? "resultaat" : "sonuç",
    tryAgain:          isNL ? "↺ Opnieuw"     : "↺ Tekrar Dene",
    msg90:             isNL ? "Uitstekend! Je kent alle signaalwoorden! 🏆" : "Mükemmel! Tüm sinyal kelimeleri ezberledin! 🏆",
    msg70:             isNL ? "Heel goed! Een kleine herhaling volstaat. 👍" : "Çok iyi! Küçük bir tekrar yeter. 👍",
    msg50:             isNL ? "Goed begin. Probeer Ontdek nog eens. 📖" : "İyi başlangıç. KEŞF'i bir kez daha dene. 📖",
    msg0:              isNL ? "Doe Ontdek eerst opnieuw. 💪" : "Önce KEŞF aşamasını tekrar yap. 💪",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40 animate-pulse">
          Laden…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">
          Gegevens niet beschikbaar
        </p>
      </div>
    );
  }

  const Header = ({
    title,
    right,
    onBack,
  }: {
    title: string;
    right?: React.ReactNode;
    onBack?: () => void;
  }) => (
    <header className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3.5 flex items-center gap-3 flex-shrink-0 select-none shadow-sm">
      {onBack && (
        <button
          onClick={onBack}
          className="text-[var(--text)] text-sm font-bold w-8 h-8 rounded-full hover:bg-[var(--surface-2)] flex items-center justify-center cursor-pointer transition-all border-none bg-transparent"
        >
          ←
        </button>
      )}
      <span className="text-sm font-black uppercase tracking-wider text-[var(--text)] flex-1">
        {title}
      </span>
      {right}
    </header>
  );

  const LangToggle = () => (
    <div className="flex rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
      {(["nl", "tr"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => handleLangChange(l)}
          className={`px-3 py-1 text-xs font-black uppercase cursor-pointer transition-all border-none rounded-md ${
            lang === l 
              ? "bg-[var(--accent)] text-white shadow-sm" 
              : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );

  const LevelTabs = () => (
    <div className="flex bg-[var(--surface)] border-b border-[var(--border)] select-none">
      {["A1", "A2", "B1", "B2"].map((lvl) => (
        <button
          key={lvl}
          onClick={() => handleLevelChange(lvl)}
          className={`flex-grow py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-t-0 border-b-2 border-x-0 transition-all ${
            level === lvl
              ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)]"
              : "border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
          }`}
        >
          {lvl}
        </button>
      ))}
    </div>
  );

  // Screen Home
  if (screen === "home") {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
        <Header title="signaalwoorden" right={<LangToggle />} />
        <LevelTabs />

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 w-full max-w-lg mx-auto">
          {levelCats.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] opacity-40 text-center mt-8 font-bold uppercase tracking-widest">
              {T.noCategories}
            </p>
          )}

          {levelCats.map((cat) => {
            const parsed = parseCategory(cat);
            const pal = catPalette(cat.category);
            return (
              <div
                key={cat.category}
                className="border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: "var(--surface)" }}
              >
                {/* Card header */}
                <div className="px-5 pt-5 pb-4 flex-1" style={{ backgroundColor: pal.bg }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">
                        SIGNAALWOORDEN
                      </span>
                      <h3
                        className="text-base font-extrabold mt-0.5"
                        style={{ color: "var(--text)" }}
                      >
                        {cat.category}
                      </h3>
                      <p className="text-xs font-semibold mt-1 text-[var(--text-muted)]">
                        {cat.category_tr}
                      </p>
                    </div>
                    <span
                      className="text-[9px] font-black uppercase whitespace-nowrap px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/15"
                    >
                      {T.words(parsed.length)}
                    </span>
                  </div>
                </div>

                <div
                  className="flex border-t border-[var(--border)] bg-[var(--surface)]"
                >
                  {[
                    { label: T.discover, action: () => startKesfet(cat.category) },
                    { label: T.practise,   action: () => startOefen(cat.category) },
                    { label: T.test,    action: () => startTest(cat.category) },
                  ].map((btn, i, arr) => (
                    <button
                      key={btn.label}
                      onClick={btn.action}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider border-none cursor-pointer transition-all bg-transparent hover:bg-[var(--surface-2)] text-[var(--text)] ${
                        i < arr.length - 1 ? "border-r border-[var(--border)]" : ""
                      }`}
                      style={{ minHeight: 48 }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Mixed test button */}
          {levelCats.length > 1 && (
            <button
              onClick={() => startTest("KARISIK")}
              className="w-full bg-[var(--primary)] text-white py-4 font-bold uppercase tracking-widest text-sm border-none cursor-pointer hover:opacity-95 transition-all rounded-xl shadow-sm mt-2 active:scale-[0.98]"
              style={{ minHeight: 56 }}
            >
              {T.mixedTest(level)}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Screen Keşfet
  if (screen === "kesfet") {
    const color = catColor(activeCat);
    const finished = cardIdx >= cards.length;
    const card = cards[cardIdx] ?? null;
    const progressPercent = finished ? 100 : ((cardIdx + 1) / cards.length) * 100;

    return (
      <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24 select-none">
        <Header
          title={`keşfet — ${activeCat}`}
          onBack={() => setScreen("home")}
          right={
            !finished ? (
              <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full">
                {cardIdx + 1} / {cards.length}
              </span>
            ) : undefined
          }
        />

        {/* Progress bar */}
        <div className="w-full h-1 bg-[var(--surface-2)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {finished ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 max-w-sm mx-auto w-full my-auto text-center">
            <span className="w-16 h-16 rounded-full bg-[var(--success-soft)] border border-[var(--success)]/10 text-[var(--success)] flex items-center justify-center font-bold text-3xl shadow-sm">
              ✓
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-[var(--text)]">
                {T.allWordsSeen}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 font-semibold">
                {T.wordsDone(cards.length)}
              </p>
            </div>
            <button
              onClick={() => startOefen(activeCat)}
              className="w-full bg-[var(--primary)] text-white py-4 font-bold uppercase tracking-widest text-sm border-none cursor-pointer hover:opacity-95 transition-all rounded-xl shadow-sm"
              style={{ minHeight: 56 }}
            >
              {T.goToPractise}
            </button>
            <button
              onClick={() => setScreen("home")}
              className="text-xs font-black text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer border-none bg-transparent uppercase tracking-wider mt-1"
            >
              {T.backToCategories}
            </button>
          </div>
        ) : card ? (
          <div className="flex-grow flex flex-col p-4 gap-4 w-full max-w-lg mx-auto justify-center">

            {/* 3D Flippable card */}
            <div
              onClick={handleCardClick}
              className="cursor-pointer card-3d h-72 w-full"
            >
              <div className={`card-inner ${flipped ? "flipped" : ""}`}>
                {/* Front Side: Dutch Word */}
                <div 
                  className="card-front rounded-2xl bg-[var(--primary)] text-white border border-[var(--border)] flex flex-col items-center justify-center p-6 shadow-md"
                >
                  <p className="text-[10px] font-black uppercase tracking-[2px] opacity-60 mb-2">
                    {lang === "nl" ? activeCat.toUpperCase() : "TÜRKÇE ANLAMI"}
                  </p>
                  <p className="text-3xl font-bold text-center leading-normal max-w-full break-words">
                    {lang === "nl" ? card.word.nl : card.word.tr}
                  </p>
                  {lang === "nl" ? (
                    <p className="text-sm font-semibold opacity-75 mt-3 text-center bg-white/10 px-3 py-1 rounded-full">
                      {card.word.tr}
                    </p>
                  ) : (
                    <div className="mt-3">
                      {nlRevealed ? (
                        <p className="text-xl font-black text-[var(--accent)] bg-white/10 px-4 py-1.5 rounded-full">
                          {card.word.nl}
                        </p>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setNlRevealed(true); }}
                          className="px-4 py-2 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer hover:bg-white/30 border-none transition-all"
                        >
                          {T.showDutch}
                        </button>
                      )}
                    </div>
                  )}
                  {card.example && (
                    <p className="text-[9px] opacity-40 uppercase tracking-wider mt-6 select-none font-bold">
                      {T.exampleSentence} (örneği gör)
                    </p>
                  )}
                </div>

                {/* Back Side: Example sentence */}
                <div className="card-back rounded-2xl bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] flex flex-col justify-between p-6 shadow-md">
                  <div className="flex-grow flex flex-col justify-center text-center gap-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--accent)] mb-1">
                      VOORBEELDZIN (Örnek Cümle)
                    </p>
                    <p className="text-base font-bold leading-relaxed">
                      {card.example && (
                        <HighlightSentence
                          sentence={card.example.nl}
                          word={card.word.nl.split("/")[0].trim()}
                          color="var(--accent)"
                        />
                      )}
                    </p>
                    <p className="text-sm text-[var(--text-muted)] italic font-semibold border-t border-[var(--border)] pt-3">
                      {card.example?.tr}
                    </p>
                  </div>
                  <p className="text-[9px] opacity-40 uppercase tracking-wider mt-3 select-none text-center font-bold">
                    tik om terug te draaien
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 w-full">
              {flipped && (
                <button
                  onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
                  className="flex-1 py-4 bg-[var(--surface-2)] text-[var(--text)] font-extrabold text-xs uppercase tracking-wider cursor-pointer transition-all rounded-xl border border-[var(--border)] active:scale-98"
                >
                  {T.back}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCardIdx((i) => i + 1);
                  setFlipped(false);
                  setNlRevealed(false);
                }}
                className="flex-grow py-4 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer hover:opacity-95 active:scale-98 transition-all rounded-xl border-none shadow-sm"
                style={{ backgroundColor: "var(--primary)" }}
              >
                {cardIdx + 1 < cards.length ? T.next : T.finish}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // Screen Oefen / Test
  if (screen === "oefen" || screen === "test") {
    const isTest = screen === "test";
    const current = quizItems[quizIdx] ?? null;
    const color = current ? catColor(current.categoryName) : "var(--primary)";

    if (!current) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-40">
            Geen vragen beschikbaar
          </p>
        </div>
      );
    }

    const timerPct = (timer / 30) * 100;
    const timerColor = timer <= 10 ? "var(--danger)" : "var(--accent)";

    return (
      <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24 select-none">
        <Header
          title={`${isTest ? "test" : "oefen"} — ${activeCat}`}
          onBack={() => setScreen("home")}
          right={
            <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full">
              {quizIdx + 1} / {quizItems.length}
            </span>
          }
        />

        {/* Progress bar */}
        <div className="w-full h-1 bg-[var(--surface-2)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${((quizIdx + 1) / quizItems.length) * 100}%` }}
          />
        </div>

        {/* Timer bar (test only) */}
        {isTest && (
          <div className="w-full h-1 bg-[var(--surface-2)]">
            <div
              className="h-full transition-all duration-1000"
              style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
            />
          </div>
        )}

        <div className={`flex-grow flex flex-col p-4 gap-4 w-full max-w-lg mx-auto justify-center ${shaking ? "animate-shake" : ""}`}>
          {/* Category badge (test only) */}
          {isTest && (
            <div
              className="self-start px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/15"
            >
              {current.categoryName}
            </div>
          )}

          {/* Sentence card */}
          <div
            className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm p-6 transition-colors duration-300 ${
              feedback === "correct"
                ? "bg-[var(--success-soft)] border-[var(--success)]/20"
                : feedback === "wrong"
                ? "bg-[var(--danger-soft)] border-[var(--danger)]/20"
                : ""
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">
              {T.chooseWord}
            </p>
            <p className="text-lg font-bold leading-relaxed text-[var(--text)]">
              {current.sentence.split("___").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span
                      className={`inline-block px-1 border-b-2 min-w-[70px] text-center font-black transition-all ${
                        feedback === "correct"
                          ? "text-[var(--success)] border-[var(--success)]"
                          : feedback === "wrong"
                          ? "text-[var(--danger)] border-[var(--danger)]"
                          : "text-[var(--accent)] border-[var(--accent)]"
                      }`}
                    >
                      {selected ?? "___"}
                    </span>
                  )}
                </span>
              ))}
            </p>
          </div>

          {/* Hint Card */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-1">
              {T.hint} (İpucu)
            </p>
            <p className="text-sm font-semibold text-[var(--text)] leading-relaxed">{current.hint}</p>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`border p-4 rounded-xl font-bold text-sm shadow-sm ${
                feedback === "correct" 
                  ? "bg-[var(--success-soft)] border-[var(--success)]/10 text-[var(--success)]" 
                  : "bg-[var(--danger-soft)] border-[var(--danger)]/10 text-[var(--danger)]"
              }`}
            >
              {feedback === "correct"
                ? T.correct(current.answer, current.wordTr)
                : T.wrong(current.answer, current.wordTr)}
            </div>
          )}

          {/* Options grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {current.options.map((opt) => {
              const isSelected = selected === opt;
              const isAnswer = opt === current.answer;
              
              let btnClass = "bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-2)]";
              if (isSelected && feedback === "correct") {
                btnClass = "bg-[var(--success)] text-white border-transparent shadow-sm";
              } else if (isSelected && feedback === "wrong") {
                btnClass = "bg-[var(--danger)] text-white border-transparent shadow-sm";
              } else if (!isSelected && feedback && isAnswer) {
                btnClass = "bg-[var(--success)] text-white border-transparent shadow-sm";
              }
              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={!!feedback}
                  className={`py-4 font-bold text-sm border rounded-xl cursor-pointer transition-all active:scale-98 disabled:pointer-events-none ${btnClass}`}
                  style={{ minHeight: 56 }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Stats Bar */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 py-2 flex flex-col items-center bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/10 rounded-xl">
              <span className="text-lg font-black font-mono leading-tight">
                {score.correct}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
                {T.correctLabel}
              </span>
            </div>
            <div className="flex-1 py-2 flex flex-col items-center bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/10 rounded-xl">
              <span className="text-lg font-black font-mono leading-tight">
                {score.total - score.correct}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
                {T.wrongLabel}
              </span>
            </div>
            {isTest && (
              <div
                className={`flex-1 py-2 flex flex-col items-center border rounded-xl ${
                  timer <= 10 ? "bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]/15" : "bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)]"
                }`}
              >
                <span
                  className="text-lg font-black font-mono leading-tight"
                >
                  {timer}s
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
                  {T.timeLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Screen Result
  if (screen === "result") {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    
    let barColor = "var(--danger)";
    if (pct >= 90) barColor = "var(--success)";
    else if (pct >= 70) barColor = "var(--accent)";
    else if (pct >= 50) barColor = "var(--warning)";

    return (
      <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24 select-none">
        <Header title={T.resultTitle} />

        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 max-w-sm mx-auto w-full my-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            {activeCat}
          </span>

          <div className="text-center font-mono">
            <span className="text-7xl font-black text-[var(--text)]">
              {score.correct}
            </span>
            <span className="text-3xl font-bold text-[var(--text-muted)] opacity-55">
              /{score.total}
            </span>
          </div>

          {/* Result bar */}
          <div className="w-full">
            <div className="h-3.5 bg-[var(--surface-2)] rounded-full overflow-hidden border border-[var(--border)] shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
            <p className="text-center text-lg font-black mt-2 font-mono" style={{ color: barColor }}>
              {pct}%
            </p>
          </div>

          <p className="text-sm font-bold text-center text-[var(--text)] max-w-xs leading-relaxed">
            {pct >= 90 ? T.msg90 : pct >= 70 ? T.msg70 : pct >= 50 ? T.msg50 : T.msg0}
          </p>

          <div className="flex flex-col gap-3 w-full mt-2">
            <button
              onClick={() => setScreen("home")}
              className="w-full py-4 border border-[var(--border)] font-bold uppercase tracking-widest text-xs cursor-pointer bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-all rounded-xl shadow-sm active:scale-98"
              style={{ minHeight: 56 }}
            >
              {T.backToCategories}
            </button>
            <button
              onClick={() => {
                if (activeCat === "KARISIK TEST") {
                  startTest("KARISIK");
                } else {
                  startTest(activeCat);
                }
              }}
              className="w-full py-4 bg-[var(--primary)] text-white font-bold uppercase tracking-widest text-xs cursor-pointer border-none hover:opacity-95 transition-all rounded-xl shadow-sm active:scale-98"
              style={{ minHeight: 56 }}
            >
              {T.tryAgain}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
