"use client";

import { useState, useCallback } from "react";

// ─── Quiz data ────────────────────────────────────────────────────────────────
interface QuizQuestion {
  q: string;
  opts: string[];
  a: number;
  tr: string;
}

const ALL_Q: Record<string, QuizQuestion[]> = {
  a1: [
    { q: "Ik ___ gisteren thuis. (zijn)", opts: ["ben", "was", "is", "werd"], a: 1, tr: "zijn → was (imperfectum enk.)" },
    { q: "Vroeger ___ wij in Rotterdam. (wonen)", opts: ["woonden", "woonte", "woont", "wonen"], a: 0, tr: "wonen → woon + de → woonde (enk.) / woonden (mv.)" },
    { q: "Imperfectum nerede kullanılır?", opts: ["Günlük konuşmada her zaman", "Yazıda, hikayelerde ve haberlerde", "Sadece gelecek zaman için", "Perfectum ile aynı"], a: 1, tr: "Imperfectum = yazılı anlatı zamanı" },
    { q: "Welke zin is correct?", opts: ["Hij was gisteren ziek.", "Hij is geweest ziek.", "Hij heeft ziek.", "Hij werd ziek geweest."], a: 0, tr: "zijn → was (imperfectum, günlük konuşmada da kullanılır)" },
    { q: "Zij ___ heel hard. (werken)", opts: ["werkten", "werkende", "werkte", "heeft gewerkt"], a: 2, tr: "werken → stam werk + te = werkte (enkelvoud)" },
    { q: "Wij ___ naar school. (lopen)", opts: ["liepen", "loopten", "lopen", "lieepen"], a: 0, tr: "lopen → düzensiz → liep / liepen" },
  ],
  a2: [
    { q: 'Imperfectum van "werken" (enkelvoud)?', opts: ["werkde", "werkte", "werkted", "werkde"], a: 1, tr: "k ∈ SoFT KeTCHuP → +te → werkte" },
    { q: 'Imperfectum van "horen" (enkelvoud)?', opts: ["hoorte", "hoorde", "hoorded", "hooret"], a: 1, tr: "r ∉ SoFT KeTCHuP → +de → hoorde" },
    { q: 'Imperfectum van "leven" (enkelvoud)?', opts: ["leefde", "leefted", "leevde", "lefd"], a: 0, tr: "v→f ama v ∉ SoFT KeTCHuP → +de → leefde" },
    { q: 'Imperfectum van "reizen" (meervoud)?', opts: ["reisten", "reisden", "reizden", "reizten"], a: 1, tr: "z→s ama z ∉ SoFT KeTCHuP → +de → reisden (mv.)" },
    { q: 'Imperfectum van "stoppen" (enkelvoud)?', opts: ["stopde", "stopte", "stoppede", "stoppte"], a: 1, tr: "p ∈ SoFT KeTCHuP → +te → stopte" },
    { q: 'Imperfectum van "spelen" (meervoud)?', opts: ["speelten", "speelden", "speeldes", "gespeeld"], a: 1, tr: "l ∉ SoFT KeTCHuP → +de → speelden (mv.)" },
    { q: 'Imperfectum van "praten" (enkelvoud)?', opts: ["praatte", "praatde", "prate", "praatten"], a: 0, tr: "t ∈ SoFT KeTCHuP → +te → praatte (dubbel tt!)" },
    { q: 'Imperfectum van "lachen" (enkelvoud)?', opts: ["lachde", "lachte", "lachede", "gelachen"], a: 1, tr: "ch ∈ SoFT KeTCHuP → +te → lachte" },
  ],
  b1: [
    { q: 'Imperfectum van "gaan" (enkelvoud)?', opts: ["gaande", "gaate", "ging", "geging"], a: 2, tr: "gaan → düzensiz → ging" },
    { q: 'Imperfectum van "zijn" (meervoud)?', opts: ["zijnden", "waren", "wassen", "zijn"], a: 1, tr: "zijn → düzensiz → was / waren" },
    { q: 'Imperfectum van "schrijven" (enkelvoud)?', opts: ["schrijfde", "schreef", "geschreven", "schreefde"], a: 1, tr: "schrijven → düzensiz → schreef" },
    { q: 'Imperfectum van "kunnen" (enkelvoud)?', opts: ["kunnde", "konde", "kon", "gekunnen"], a: 2, tr: "kunnen → düzensiz → kon" },
    { q: 'Imperfectum van "komen" (meervoud)?', opts: ["kwamen", "komden", "kwamden", "gekomen"], a: 0, tr: "komen → düzensiz → kwam / kwamen" },
    { q: 'Imperfectum van "vallen" (enkelvoud)?', opts: ["valde", "viel", "gevallen", "vallde"], a: 1, tr: "vallen → düzensiz → viel" },
    { q: 'Imperfectum van "denken" (enkelvoud)?', opts: ["denkde", "denkte", "dacht", "gedacht"], a: 2, tr: "denken → düzensiz → dacht" },
    { q: 'Imperfectum van "krijgen" (meervoud)?', opts: ["kreegden", "kregen", "krijgden", "gekregen"], a: 1, tr: "krijgen → düzensiz → kreeg / kregen" },
  ],
  b2: [
    { q: '"Gisteren ___ ik hard." — imperfectum (werken)', opts: ["werkte", "heeft gewerkt", "werkend", "gewerkt"], a: 0, tr: "Imperfectum = tek kelime, 2. pozisyon" },
    { q: '"Hij zei dat hij hard ___." (werken)', opts: ["werkte", "heeft gewerkt", "werkend", "aan het werken"], a: 0, tr: "Bijzin: imperfectum sona gider" },
    { q: "Welke zin gebruikt imperfectum correct?", opts: ["Ik was gewerkt gisteren.", "Gisteren werkte ik hard.", "Ik ben werkte gisteren.", "Gisteren ik werkte hard."], a: 1, tr: "Imperfectum 2. pozisyon, inversie doğru" },
    { q: '"___ jullie erg moe?" — zijn, imperfectum', opts: ["Hebben", "Zijn", "Waren", "Was"], a: 2, tr: "zijn mv. imperfectum = waren" },
    { q: "Perfectum vs. imperfectum: hangisi konuşmada tercih edilir?", opts: ["Imperfectum", "Perfectum", "İkisi de eşit", "Bağlama göre değişmez"], a: 1, tr: "Günlük konuşmada perfectum tercih edilir" },
    { q: '"Toen ik klein ___, woonde ik in Ankara." — zijn', opts: ["ben", "was", "werd", "had"], a: 1, tr: "Toen + geçmiş durum → imperfectum → was" },
  ],
};

// ─── Irregular verb data ──────────────────────────────────────────────────────
interface IrregVerb {
  inf: string;
  tr: string;
  enk: string;
  mv: string;
  perf: string;
}

const IRREG_LIST: IrregVerb[] = [
  { inf: "zijn", tr: "olmak", enk: "was", mv: "waren", perf: "is geweest" },
  { inf: "hebben", tr: "sahip olmak", enk: "had", mv: "hadden", perf: "heeft gehad" },
  { inf: "gaan", tr: "gitmek", enk: "ging", mv: "gingen", perf: "is gegaan" },
  { inf: "komen", tr: "gelmek", enk: "kwam", mv: "kwamen", perf: "is gekomen" },
  { inf: "doen", tr: "yapmak", enk: "deed", mv: "deden", perf: "heeft gedaan" },
  { inf: "zien", tr: "görmek", enk: "zag", mv: "zagen", perf: "heeft gezien" },
  { inf: "geven", tr: "vermek", enk: "gaf", mv: "gaven", perf: "heeft gegeven" },
  { inf: "nemen", tr: "almak", enk: "nam", mv: "namen", perf: "heeft genomen" },
  { inf: "rijden", tr: "araba sürmek", enk: "reed", mv: "reden", perf: "heeft gereden" },
  { inf: "schrijven", tr: "yazmak", enk: "schreef", mv: "schreven", perf: "heeft geschreven" },
  { inf: "lopen", tr: "yürümek", enk: "liep", mv: "liepen", perf: "heeft gelopen" },
  { inf: "vallen", tr: "düşmek", enk: "viel", mv: "vielen", perf: "is gevallen" },
  { inf: "blijven", tr: "kalmak", enk: "bleef", mv: "bleven", perf: "is gebleven" },
  { inf: "worden", tr: "olmak/dönüşmek", enk: "werd", mv: "werden", perf: "is geworden" },
  { inf: "kijken", tr: "bakmak", enk: "keek", mv: "keken", perf: "heeft gekeken" },
  { inf: "krijgen", tr: "almak", enk: "kreeg", mv: "kregen", perf: "heeft gekregen" },
  { inf: "kunnen", tr: "-ebilmek", enk: "kon", mv: "konden", perf: "heeft gekund" },
  { inf: "moeten", tr: "zorunda olmak", enk: "moest", mv: "moesten", perf: "heeft gemoeten" },
  { inf: "willen", tr: "istemek", enk: "wilde", mv: "wilden", perf: "heeft gewild" },
  { inf: "mogen", tr: "izin verilmek", enk: "mocht", mv: "mochten", perf: "heeft gemogen" },
  { inf: "denken", tr: "düşünmek", enk: "dacht", mv: "dachten", perf: "heeft gedacht" },
  { inf: "brengen", tr: "getirmek", enk: "bracht", mv: "brachten", perf: "heeft gebracht" },
  { inf: "eten", tr: "yemek yemek", enk: "at", mv: "aten", perf: "heeft gegeten" },
  { inf: "vliegen", tr: "uçmak", enk: "vloog", mv: "vlogen", perf: "is gevlogen" },
];

// ─── Imperfectum verb converter logic ─────────────────────────────────────────
const KNOWN: Record<string, string> = {
  werken: "werk", maken: "maak", lopen: "loop", lezen: "lees", leven: "leef",
  reizen: "reis", zetten: "zet", horen: "hoor", spelen: "speel", wonen: "woon",
  leren: "leer", kopen: "koop", stoppen: "stop", praten: "praat", pakken: "pak",
  lachen: "lach", betalen: "betaal", vertellen: "vertel", sturen: "stuur",
  bellen: "bel", werpen: "werp", vragen: "vraag", bakken: "bak", tikken: "tik",
};

const ORIG_V = ["leven", "geven", "rijven", "blijven", "schrijven", "drijven"];
const ORIG_Z = ["reizen", "prijzen", "wijzen", "blazen", "vriezen", "kiezen"];
const KOF = ["t", "k", "f", "s", "ch", "p"];

const IRREG_IMP: Record<string, { enk: string; mv: string }> = {
  zijn: { enk: "was", mv: "waren" }, hebben: { enk: "had", mv: "hadden" },
  gaan: { enk: "ging", mv: "gingen" }, komen: { enk: "kwam", mv: "kwamen" },
  doen: { enk: "deed", mv: "deden" }, zien: { enk: "zag", mv: "zagen" },
  staan: { enk: "stond", mv: "stonden" }, geven: { enk: "gaf", mv: "gaven" },
  nemen: { enk: "nam", mv: "namen" }, rijden: { enk: "reed", mv: "reden" },
  schrijven: { enk: "schreef", mv: "schreven" }, lopen: { enk: "liep", mv: "liepen" },
  vallen: { enk: "viel", mv: "vielen" }, lezen: { enk: "las", mv: "lazen" },
  beginnen: { enk: "begon", mv: "begonnen" }, helpen: { enk: "hielp", mv: "hielpen" },
  vinden: { enk: "vond", mv: "vonden" }, spreken: { enk: "sprak", mv: "spraken" },
  drinken: { enk: "dronk", mv: "dronken" }, zingen: { enk: "zong", mv: "zongen" },
  blijven: { enk: "bleef", mv: "bleven" }, worden: { enk: "werd", mv: "werden" },
  kijken: { enk: "keek", mv: "keken" }, krijgen: { enk: "kreeg", mv: "kregen" },
  brengen: { enk: "bracht", mv: "brachten" }, denken: { enk: "dacht", mv: "dachten" },
  kunnen: { enk: "kon", mv: "konden" }, moeten: { enk: "moest", mv: "moesten" },
  willen: { enk: "wilde", mv: "wilden" }, mogen: { enk: "mocht", mv: "mochten" },
  zullen: { enk: "zou", mv: "zouden" }, eten: { enk: "at", mv: "aten" },
  zitten: { enk: "zat", mv: "zaten" }, liggen: { enk: "lag", mv: "lagen" },
  vliegen: { enk: "vloog", mv: "vlogen" }, kiezen: { enk: "koos", mv: "kozen" },
  snijden: { enk: "sneed", mv: "sneden" }, vertrekken: { enk: "vertrok", mv: "vertrokken" },
};

function isVowel(c: string) { return "aeiou".includes(c); }

function getStem(v: string): string {
  v = v.trim().toLowerCase();
  if (KNOWN[v]) return KNOWN[v];
  if (!v.endsWith("en")) return v;
  let b = v.slice(0, -2);
  if (b.endsWith("v")) b = b.slice(0, -1) + "f";
  if (b.endsWith("z")) b = b.slice(0, -1) + "s";
  const l = b[b.length - 1];
  const s = b[b.length - 2];
  if (l && s && l === s && !isVowel(l)) b = b.slice(0, -1);
  return b;
}

function isKof(orig: string, stam: string): boolean {
  const l = stam[stam.length - 1];
  if (l === "f") {
    if (ORIG_V.includes(orig) || orig.slice(0, -2).endsWith("v")) return false;
  }
  if (l === "s") {
    if (ORIG_Z.includes(orig) || orig.slice(0, -2).endsWith("z")) return false;
  }
  return KOF.includes(l) || l === "h";
}

// ─── Styles (inspired by the provided HTML) ───────────────────────────────────
const S = {
  card: "bg-[var(--surface)] border border-[var(--border)]/15 rounded-2xl p-4 shadow-sm",
  badge: (c: string) => ({
    display: "inline-block" as const,
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 700 as const,
    backgroundColor: c + "22",
    color: c,
  }),
  note: "bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-xl p-3 text-sm mt-3",
  danger: "bg-[var(--danger-soft)] border border-[var(--danger)] rounded-xl p-3 text-sm mt-3 text-[var(--danger)]",
  ok: "bg-[var(--success-soft)] border border-[var(--success)] rounded-xl p-3 text-sm mt-3 text-[var(--success)]",
  flow: "flex items-center gap-2 flex-wrap my-3",
  box: "bg-[var(--accent-soft)] border border-[var(--accent)] rounded-xl px-3 py-2 font-extrabold text-base",
  boxG: "bg-[var(--success-soft)] border border-[var(--success)] rounded-xl px-3 py-2 font-extrabold text-base text-[var(--success)]",
  boxO: "bg-[var(--warning-soft)] border border-[var(--warning)]/30 rounded-xl px-3 py-2 font-extrabold text-base text-[var(--warning)]",
  arrow: "text-xl text-[var(--warning)] font-bold",
  tblWrap: "border border-[var(--border)]/15 rounded-xl overflow-hidden my-2",
  th: "px-3 py-2.5 text-left text-xs font-bold bg-[var(--accent-soft)] border-b border-[var(--border)]/10",
  td: "px-3 py-2.5 text-left text-sm border-b border-[var(--border)]/10",
  kofBox: "rounded-xl p-3 text-center bg-[var(--warning)]/10 border-2 border-[var(--warning)]/30",
  kofLetter: "text-2xl font-black text-[var(--warning)] block mb-0.5",
  kofEx: "text-[11px] text-[var(--text)] opacity-50 leading-tight",
  posDemo: "bg-[var(--surface)] border border-[var(--border)]/15 rounded-xl p-4 my-2",
  posZin: "text-base font-bold mb-1 leading-loose",
  posTr: "text-xs text-[var(--text)] opacity-50 mb-1",
  posNote: "text-xs text-[var(--accent)] font-medium",
  ppSub: "inline-block rounded-lg px-2 py-0.5 text-xs font-bold bg-[var(--danger-soft)] text-[var(--danger)] mx-0.5",
  ppPv: "inline-block rounded-lg px-2 py-0.5 text-xs font-bold bg-[var(--accent-soft)] text-[var(--accent)] mx-0.5",
  ppRest: "inline-block rounded-lg px-2 py-0.5 text-xs font-bold bg-[var(--warning-soft)] text-[var(--text)] opacity-70 mx-0.5",
  ppEnd: "inline-block rounded-lg px-2 py-0.5 text-xs font-bold bg-[var(--warning)]/10 text-[var(--warning)] mx-0.5",
  hataItem: "bg-[var(--surface)] border border-[var(--border)]/15 rounded-xl p-3",
  hataY: "text-[var(--danger)] text-sm font-bold mb-1",
  hataD: "text-[var(--success)] text-sm font-bold mb-1",
  hataN: "text-xs text-[var(--text)] opacity-50 mt-1",
  choiceBase: "p-3 border-2 rounded-xl cursor-pointer text-sm font-semibold text-left transition-all text-[var(--text)]",
  choiceNormal: "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]",
  choiceCorrect: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)] pointer-events-none",
  choiceWrong: "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)] pointer-events-none",
  choiceDisabled: "pointer-events-none opacity-50",
};

// ─── Level badge colors ───────────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  a1: "#3a8f6f",
  a2: "#2e5d88",
  b1: "#c8811a",
  b2: "#d95f59",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function QuizSection({ level, langNL }: { level: string; langNL: boolean }) {
  const questions = ALL_Q[level];
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [score, setScore] = useState(0);

  const q = questions[cur];
  const ans = answers[cur];
  const allDone = answers.every((a) => a !== null);
  const pct = Math.round((cur / questions.length) * 100);

  const answer = (idx: number) => {
    if (ans !== null) return;
    const next = [...answers];
    next[cur] = idx;
    setAnswers(next);
    if (idx === q.a) setScore((s) => s + 1);
  };

  const restart = () => {
    setCur(0);
    setAnswers(new Array(questions.length).fill(null));
    setScore(0);
  };

  return (
    <div>
      {/* Progress */}
      <div className="h-1.5 bg-[var(--surface-2)] rounded-full mb-3 overflow-hidden">
        <div className="h-full bg-[var(--primary)] rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs font-semibold text-[var(--text)] opacity-50 mb-2">
        {langNL ? "Vraag" : "Soru"} {cur + 1} / {questions.length}
        <span className="inline-block bg-[var(--surface-2)] rounded-full px-2 py-0.5 text-[11px] font-bold ml-2">
          {langNL ? "Score" : "Puan"}: {score}/{questions.length}
        </span>
      </div>

      {/* Question */}
      <p className="text-base font-bold mb-2 text-[var(--text)]">{q.q}</p>

      {/* Options */}
      <div className="grid gap-2 mb-1">
        {q.opts.map((opt, i) => {
          let cls = `${S.choiceBase} ${S.choiceNormal}`;
          if (ans !== null) {
            if (i === q.a) cls = `${S.choiceBase} ${S.choiceCorrect}`;
            else if (i === ans) cls = `${S.choiceBase} ${S.choiceWrong}`;
            else cls = `${S.choiceBase} ${S.choiceDisabled}`;
          }
          return (
            <button key={i} className={cls} onClick={() => answer(i)}>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {ans !== null && (
        <div className={`mt-2 p-3 rounded-xl text-sm font-semibold ${ans === q.a ? "bg-[var(--success-soft)] border border-[var(--success)] text-[var(--success)]" : "bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)]"}`}>
          {ans === q.a ? (langNL ? "✅ Goed! " : "✅ Doğru! ") : (langNL ? "❌ Fout. " : "❌ Yanlış. ")}{q.tr}
        </div>
      )}

      {/* Nav */}
      <div className="flex gap-2 mt-3">
        {cur > 0 && (
          <button
            onClick={() => setCur(cur - 1)}
            className="px-4 py-2 rounded-xl border-none bg-[var(--primary)] text-white text-sm font-bold cursor-pointer hover:opacity-90"
          >
            ← {langNL ? "Terug" : "Geri"}
          </button>
        )}
        {ans !== null && cur < questions.length - 1 && (
          <button
            onClick={() => setCur(cur + 1)}
            className="px-4 py-2 rounded-xl border-none bg-[var(--primary)] text-white text-sm font-bold cursor-pointer hover:opacity-90"
          >
            {langNL ? "Volgende" : "İleri"} →
          </button>
        )}
      </div>

      {/* Result */}
      {allDone && (
        <div className="bg-gradient-to-br from-[var(--success-soft)] to-[var(--success-soft)] border border-[var(--success)] rounded-2xl p-4 text-center mt-4">
          <div className="text-4xl font-black text-[var(--accent)] mb-1">{score}/{questions.length}</div>
          <p className="text-sm text-[var(--text)] opacity-50 mb-3">
            {score === questions.length
              ? (langNL ? "Perfect! Alle vragen zijn goed." : "Mükemmel! Tüm sorular doğru.")
              : score >= questions.length * 0.8
              ? (langNL ? "Heel goed!" : "Çok iyi!")
              : score >= questions.length * 0.6
              ? (langNL ? "Je bent goed op weg, oefen nog eens." : "İyi gidiyorsun, tekrar et.")
              : (langNL ? "Kijk de regels nog eens na." : "Kuralları bir daha gözden geçir.")}
          </p>
          <button
            onClick={restart}
            className="px-4 py-2 rounded-xl border-none bg-[var(--primary)] text-white text-sm font-bold cursor-pointer hover:opacity-90"
          >
            🔄 {langNL ? "Probeer opnieuw" : "Tekrar dene"}
          </button>
        </div>
      )}
    </div>
  );
}

function IrregGrid({ langNL }: { langNL: boolean }) {
  const [flippedSet, setFlippedSet] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setFlippedSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-2 mt-3">
      {IRREG_LIST.map((item, idx) => {
        const flipped = flippedSet.has(idx);
        return (
          <div
            key={idx}
            onClick={() => toggle(idx)}
            className={`rounded-xl p-3 cursor-pointer transition-all select-none border ${
              flipped
                ? "bg-[var(--accent-soft)] border-[var(--accent)]"
                : "bg-[var(--surface)] border-[var(--border)]/15 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
            }`}
          >
            {!flipped ? (
              <>
                <div className="text-base font-extrabold text-[var(--text)]">{item.inf}</div>
                <div className="text-xs text-[var(--text)] opacity-50 mb-2">{item.tr}</div>
                <div className="text-xs text-[var(--text)] opacity-40">{langNL ? "Klik → imperfectum zien" : "Tıkla → imperfectum gör"}</div>
              </>
            ) : (
              <>
                <div className="text-lg font-extrabold text-[var(--accent)] mb-0.5">{item.enk}</div>
                <div className="text-sm text-[var(--text)] opacity-50 mb-1">mv: {item.mv}</div>
                <div className="text-xs text-[var(--success)] font-semibold">perf: {item.perf}</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VerbConverter({ langNL }: { langNL: boolean }) {
  const [input, setInput] = useState("werken");
  const [result, setResult] = useState<string>("");

  const convert = useCallback(() => {
    const v = input.trim().toLowerCase();
    if (!v) { setResult(langNL ? "Typ een werkwoord." : "Bir fiil gir."); return; }
    if (IRREG_IMP[v]) {
      const ir = IRREG_IMP[v];
      setResult(`<b>${v}</b> — ${langNL ? "onregelmatig werkwoord" : "düzensiz fiil"}<br/>Enkelvoud: <b>${ir.enk}</b><br/>Meervoud: <b>${ir.mv}</b><br/><span style="font-size:13px;opacity:0.5">${langNL ? "Regel geldt niet, leer het uit je hoofd!" : "Kural geçersiz, ezberle!"}</span>`);
      return;
    }
    const s = getStem(v);
    const kof = isKof(v, s);
    const suf = kof ? "te" : "de";
    setResult(
      `<b>${v}</b><br/>Stam: <b>${s}</b> → ${langNL ? "laatste letter" : "son harf"}: <b>${s[s.length - 1]}</b> → SoFT KeTCHuP: ${kof ? (langNL ? "✓ erin" : "✓ içinde") : (langNL ? "✗ erbuiten" : "✗ dışında")}<br/>Enkelvoud: <b>${s}${suf}</b><br/>Meervoud: <b>${s}${suf}n</b><br/>Perfectum: <b>${kof ? "ge" + s + "t" : "ge" + s + "d"}</b>`
    );
  }, [input, langNL]);

  return (
    <div>
      <p className="text-xs text-[var(--text)] opacity-50 mb-2">
        {langNL ? "Typ een infinitief → zie de imperfectum vormen." : "Bir infinitief yaz → imperfectum formlarını gör."}
      </p>
      <div className="flex gap-2 flex-wrap">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && convert()}
          className="px-3 py-2.5 border border-[var(--border)]/15 rounded-xl text-base bg-[var(--surface)] flex-1 min-w-[160px] text-[var(--text)]"
          placeholder="werken, leven, horen..."
        />
        <button
          onClick={convert}
          className="px-4 py-2.5 rounded-xl border-none bg-[var(--primary)] text-white text-sm font-bold cursor-pointer hover:opacity-90"
        >
          {langNL ? "Zet om" : "Çevir"}
        </button>
      </div>
      {result && (
        <div
          className="mt-3 p-4 rounded-xl bg-[var(--accent-soft)] text-sm leading-relaxed text-[var(--text)]"
          dangerouslySetInnerHTML={{ __html: result }}
        />
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
interface ImperfectumPanelProps {
  accentColor: string;
}

export default function ImperfectumPanel({ accentColor }: ImperfectumPanelProps) {
  const [activeLevel, setActiveLevel] = useState("a1");
  const [langNL, setLangNL] = useState(true);

  const levels = [
    { key: "a1", label: langNL ? "A1 — Basis" : "A1 — Temel" },
    { key: "a2", label: langNL ? "A2 — SoFT KeTCHuP regel" : "A2 — SoFT KeTCHuP kuralı" },
    { key: "b1", label: langNL ? "B1 — Onregelmatige werkwoorden" : "B1 — Düzensiz fiiller" },
    { key: "b2", label: langNL ? "B2 — Gebruik & Stijl" : "B2 — Kullanım & stil" },
  ];

  return (
    <div className="bg-[var(--surface)]">
      {/* Hero header */}
      <div
        className="relative overflow-hidden p-4"
        style={{
          background: "var(--surface)",
          borderBottom: "2px solid rgba(0,0,0,0.08)",
        }}
      >
        <div className="absolute -right-2 -bottom-7 text-7xl font-black opacity-[0.05] whitespace-nowrap text-[var(--success)] select-none pointer-events-none">
          werkte · ging · was
        </div>
        
        {/* Language Toggle Button - Same style as PerfectumPanel */}
        <div className="flex justify-end mb-4">
          <div className="flex border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)] shadow-sm relative z-10">
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

        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block bg-[var(--primary)] text-white rounded-full px-3 py-1 text-xs font-bold">
            📖 Imperfectum — onvoltooid verleden tijd
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-[var(--text)] mb-2 leading-tight">
          {langNL ? "Het imperfectum" : "Hollandaca hikaye geçmişi"}
        </h2>
        <p className="text-sm text-[var(--text)] opacity-70 max-w-2xl leading-relaxed">
          {langNL
            ? "Wordt gebruikt in schrijven, nieuwsberichten en verhalen. In dagelijks gesprek worden alleen was, had, kon, moest, wilde, mocht veel gebruikt. Formule: stam + te / de (regelmatig) of een geheel andere vorm (onregelmatig)."
            : <>Yazıda, haberlerde ve hikayelerde kullanılır. Günlük konuşmada sadece <b>was, had, kon, moest, wilde, mocht</b> sık duyulur. Formül: <b>stam + te / de</b> (düzenli) veya tamamen farklı bir form (düzensiz).</>}
        </p>
      </div>

      {/* Level tabs */}
      <div className="flex gap-2 flex-wrap p-4 pb-0">
        {levels.map((lvl) => (
          <button
            key={lvl.key}
            onClick={() => setActiveLevel(lvl.key)}
            className={`px-4 py-2 rounded-xl border-2 font-bold text-sm cursor-pointer transition-all ${
              activeLevel === lvl.key
                ? "bg-[var(--primary)] text-white border-[var(--accent)]"
                : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]"
            }`}
          >
            {lvl.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* ── A1 ── */}
        {activeLevel === "a1" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className={`${S.card} lg:col-span-7`}>
              <span style={S.badge(LEVEL_COLORS.a1)}>{langNL ? "A1 — Basisstructuur" : "A1 — Temel yapı"}</span>
              <h3 className="text-lg font-bold mt-3 mb-2 text-[var(--text)]">{langNL ? "1. Formule van het imperfectum" : "1. Imperfectum formülü"}</h3>
              <p className="text-sm text-[var(--text)] opacity-80 mb-2">
                {langNL ? (
                  <>Komt overeen met de verhalende verleden tijd in het Turks. Je gebruikt één van de twee uitgangen:</>
                ) : (
                  <>Türkçe&apos;deki <b>&quot;-ıyordu / -mıştı&quot;</b> anlatı geçmişine karşılık gelir. İki ekten biri kullanılır:</>
                )}
              </p>
              <div className={S.flow}>
                <span className={S.box}>stam</span>
                <span className={S.arrow}>+</span>
                <span className={S.boxO}>te / ten</span>
                <span className={S.arrow}>{langNL ? "of" : "veya"}</span>
                <span className={S.boxG}>de / den</span>
              </div>
              <div className={S.note}>
                {langNL ? (
                  <>🇹🇷 <b>te</b> of <b>de</b>? Kijk naar de laatste letter van de stam. Je leert dit in A2. Begrijp voor nu alleen de formule.</>
                ) : (
                  <>🇹🇷 <b>te</b> mi, <b>de</b> mi? Stam&apos;ın son harfine bakılır. Bunu A2&apos;de öğreneceksin. Şimdilik sadece formülü kavra.</>
                )}
              </div>
              <h4 className="font-bold text-sm mt-4 mb-2 text-[var(--text)]">
                {langNL ? "Enkelvoud vs. meervoud" : "Tekil (enkelvoud) vs. çoğul (meervoud)"}
              </h4>
              <div className={S.tblWrap}>
                <table className="w-full border-collapse text-sm">
                  <thead><tr><th className={S.th}>{langNL ? "Persoon" : "Kişi"}</th><th className={S.th}>{langNL ? "Uitgang" : "Ek"}</th><th className={S.th}>werken</th><th className={S.th}>{langNL ? "Turks" : "Türkçe"}</th></tr></thead>
                  <tbody>
                    <tr><td className={S.td}>ik / jij / hij / zij</td><td className={S.td}><b>+ te</b></td><td className={S.td}><b>werkte</b></td><td className={S.td}>çalışıyordu</td></tr>
                    <tr><td className={S.td}>wij / jullie / zij</td><td className={S.td}><b>+ ten</b></td><td className={S.td}><b>werkten</b></td><td className={S.td}>çalışıyorlardı</td></tr>
                    <tr><td className={S.td}>ik / jij / hij</td><td className={S.td}><b>+ de</b></td><td className={S.td}><b>hoorde</b></td><td className={S.td}>duyuyordu</td></tr>
                    <tr><td className={S.td}>wij / jullie / zij</td><td className={S.td}><b>+ den</b></td><td className={S.td}><b>hoorden</b></td><td className={S.td}>duyuyorlardı</td></tr>
                  </tbody>
                </table>
              </div>
              <h4 className="font-bold text-sm mt-4 mb-2 text-[var(--text)]">{langNL ? "Voorbeelden" : "Örnekler"}</h4>
              <div className={S.tblWrap}>
                <table className="w-full border-collapse text-sm">
                  <thead><tr><th className={S.th}>{langNL ? "Nederlands" : "Hollandaca"}</th><th className={S.th}>{langNL ? "Turks" : "Türkçe"}</th></tr></thead>
                  <tbody>
                    <tr><td className={S.td}>Ik <b>werkte</b> gisteren hard.</td><td className={S.td}>Dün çok çalıştım.</td></tr>
                    <tr><td className={S.td}>Hij <b>woonde</b> in Amsterdam.</td><td className={S.td}>Amsterdam&apos;da yaşıyordu.</td></tr>
                    <tr><td className={S.td}>Wij <b>speelden</b> buiten.</td><td className={S.td}>Dışarıda oynuyorduk.</td></tr>
                    <tr><td className={S.td}>Vroeger <b>reisde</b> zij veel.</td><td className={S.td}>Eskiden çok seyahat ederdi.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className={`${S.card} lg:col-span-5`}>
              <span style={S.badge(LEVEL_COLORS.a1)}>A1</span>
              <h3 className="text-lg font-bold mt-3 mb-2 text-[var(--text)]">{langNL ? "2. Wanneer gebruik je het imperfectum?" : "2. Imperfectum nerede kullanılır?"}</h3>
              <div className={S.tblWrap}>
                <table className="w-full border-collapse text-sm">
                  <thead><tr><th className={S.th}>{langNL ? "Situatie" : "Durum"}</th><th className={S.th}>{langNL ? "Voorbeeld" : "Örnek"}</th></tr></thead>
                  <tbody>
                    <tr><td className={S.td}>{langNL ? "Geschreven verhalen" : "Yazılı hikaye / anlatı"}</td><td className={S.td}>Er <b>was</b> eens een koning…</td></tr>
                    <tr><td className={S.td}>{langNL ? "Krant / nieuws" : "Gazete / haber"}</td><td className={S.td}>De minister <b>sprak</b> gisteren.</td></tr>
                    <tr><td className={S.td}>{langNL ? "Voortdurende situatie in het verleden" : "Geçmişte süren durum"}</td><td className={S.td}>Toen ik kind <b>was</b>…</td></tr>
                    <tr><td className={S.td}>{langNL ? "Dagelijks gesprek (alleen deze!)" : "Günlük konuşma (sadece bunlar!)"}</td><td className={S.td}>was · had · kon · moest · wilde · mocht</td></tr>
                  </tbody>
                </table>
              </div>
              <div className={S.note}>
                💡 <b>{langNL ? "Turkse vergelijking:" : "Türkçe karşılaştırma:"}</b><br />
                {langNL ? "Perfectum = in dagelijks gesprek" : "Perfectum = günlük \"-di'li geçmiş\" konuşmada"}<br />
                {langNL ? "Imperfectum = in geschreven verhalen" : "Imperfectum = yazılı \"-iyordu / -mıştı\" anlatı geçmişi"}
              </div>
              <div className={S.ok}>
                <b>{langNL ? "Veelgehoord imperfectum in dagelijks gesprek:" : "Günlük konuşmada sık duyulan imperfectum:"}</b><br />
                <span className="text-sm leading-loose">
                  zijn → <b>was / waren</b><br />
                  hebben → <b>had / hadden</b><br />
                  kunnen → <b>kon / konden</b><br />
                  moeten → <b>moest / moesten</b><br />
                  willen → <b>wilde / wilden</b><br />
                  mogen → <b>mocht / mochten</b>
                </span>
              </div>
            </div>
            <div className={`${S.card} lg:col-span-12`}>
              <span style={S.badge(LEVEL_COLORS.a1)}>{langNL ? "A1 — Oefeningen" : "A1 — Alıştırmalar"}</span>
              <h3 className="text-lg font-bold mt-3 mb-3 text-[var(--text)]">{langNL ? "Basis imperfectum — Oefening" : "Temel imperfectum — Alıştırma"}</h3>
              <QuizSection level="a1" langNL={langNL} />
            </div>
          </div>
        )}

        {/* ── A2 ── */}
        {activeLevel === "a2" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className={`${S.card} lg:col-span-7`}>
              <span style={S.badge(LEVEL_COLORS.a2)}>{langNL ? "A2 — De SoFT KeTCHuP regel" : "A2 — SoFT KeTCHuP kuralı"}</span>
              <h3 className="text-lg font-bold mt-3 mb-2 text-[var(--text)]">{langNL ? "1. te of de? — SoFT KeTCHuP" : "1. te mi, de mi? — SoFT KeTCHuP"}</h3>
              <p className="text-sm text-[var(--text)] opacity-80 mb-2">
                {langNL ? "Als de laatste letter van de stam in één van de onderstaande vakken staat → +te / +ten. Zo niet → +de / +den." : "Stam'ın son harfi aşağıdaki kutulardan birindeyse → +te / +ten. Değilse → +de / +den."}
              </p>
              <div className="grid grid-cols-6 gap-2 my-3">
                {[
                  { letter: "s", ex: "fiets→fietste" },
                  { letter: "f", ex: "straf→strafte" },
                  { letter: "t", ex: "praat→praatte" },
                  { letter: "k", ex: "werk→werkte" },
                  { letter: "ch", ex: "lach→lachte" },
                  { letter: "p", ex: "stop→stopte" },
                ].map((k) => (
                  <div key={k.letter} className={S.kofBox}>
                    <span className={S.kofLetter}>{k.letter.toUpperCase()}</span>
                    <span className={S.kofEx}>{k.ex}</span>
                  </div>
                ))}
              </div>
              <div className={S.danger}>
                ⚠️ <b>{langNL ? "De valkuil van v→f en z→s verandering:" : "v→f ve z→s dönüşümü tuzağı:"}</b><br />
                <b>leven</b> → stam = <b>leef</b> ({langNL ? "eindigt op f maar is origineel v!" : "f ile bitiyor ama orijinal v!"}) → <b>leefde</b> (+de!)<br />
                <b>reizen</b> → stam = <b>reis</b> ({langNL ? "eindigt op s maar is origineel z!" : "s ile bitiyor ama orijinal z!"}) → <b>reisde</b> (+de!)
              </div>
              <div className={`${S.tblWrap} mt-4`}>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={S.th}>Infinitief</th><th className={S.th}>Stam</th><th className={S.th}>{langNL ? "Laatste letter" : "Son harf"}</th>
                      <th className={S.th}>SoFT KeTCHuP?</th><th className={S.th}>Imperfectum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["werken", "werk", "k", true, "werkte / werkten"],
                      ["maken", "maak", "k", true, "maakte / maakten"],
                      ["horen", "hoor", "r", false, "hoorde / hoorden"],
                      ["spelen", "speel", "l", false, "speelde / speelden"],
                      ["leven", "leef", "f (←v)", false, "leefde / leefden"],
                      ["reizen", "reis", "s (←z)", false, "reisde / reisden"],
                      ["praten", "praat", "t", true, "praatte / praatten"],
                      ["stoppen", "stop", "p", true, "stopte / stopten"],
                    ].map(([inf, stam, letter, kof, imp], i) => (
                      <tr key={i}>
                        <td className={S.td}>{inf as string}</td>
                        <td className={S.td}>{stam as string}</td>
                        <td className={S.td}>{letter as string}</td>
                        <td className={S.td} style={{ color: kof ? "var(--warning)" : "var(--success)", fontWeight: 700 }}>
                          {kof ? (langNL ? "✓ erin" : "✓ içinde") : (langNL ? "✗ erbuiten" : "✗ dışında")}
                        </td>
                        <td className={S.td}><b>{imp as string}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={`${S.card} lg:col-span-5`}>
              <span style={S.badge(LEVEL_COLORS.a2)}>A2</span>
              <h3 className="text-lg font-bold mt-3 mb-2 text-[var(--text)]">{langNL ? "2. Imperfectum omzetter" : "2. Imperfectum dönüştürücü"}</h3>
              <VerbConverter langNL={langNL} />
              <div className="mt-5">
                <h4 className="font-bold text-sm mb-2 text-[var(--text)]">{langNL ? "Vergelijking met het perfectum" : "Perfectum ile karşılaştırma"}</h4>
                <div className={S.note}>
                  🔑 <b>{langNL ? "Eén regel, twee tijden:" : "Tek kural, iki zaman:"}</b><br />
                  {langNL ? "SoFT KeTCHuP einde" : "SoFT KeTCHuP sonu"} → Imperfectum: <b>+te</b> / Perfectum: <b>+t</b><br />
                  {langNL ? "Buiten SoFT KeTCHuP" : "SoFT KeTCHuP dışı"} → Imperfectum: <b>+de</b> / Perfectum: <b>+d</b><br /><br />
                  <span className="text-xs opacity-70">
                    werken (k): <b>werkte</b> / <b>gewerkt</b><br />
                    horen (r): <b>hoorde</b> / <b>gehoord</b><br />
                    leven (v→f): <b>leefde</b> / <b>geleefd</b>
                  </span>
                </div>
              </div>
            </div>
            <div className={`${S.card} lg:col-span-12`}>
              <span style={S.badge(LEVEL_COLORS.a2)}>{langNL ? "A2 — Oefeningen" : "A2 — Alıştırmalar"}</span>
              <h3 className="text-lg font-bold mt-3 mb-3 text-[var(--text)]">{langNL ? "SoFT KeTCHuP regel — Oefening" : "SoFT KeTCHuP kuralı — Alıştırma"}</h3>
              <QuizSection level="a2" langNL={langNL} />
            </div>
          </div>
        )}

        {/* ── B1 ── */}
        {activeLevel === "b1" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className={`${S.card} lg:col-span-12`}>
              <span style={S.badge(LEVEL_COLORS.b1)}>{langNL ? "B1 — Onregelmatige werkwoorden" : "B1 — Düzensiz fiiller"}</span>
              <h3 className="text-lg font-bold mt-3 mb-2 text-[var(--text)]">{langNL ? "Onregelmatig imperfectum — Klik op de kaarten" : "Onregelmatig imperfectum — Kartlara tıkla"}</h3>
              <p className="text-sm text-[var(--text)] opacity-70 mb-1">
                {langNL ? "Het imperfectum van deze werkwoorden is onregelmatig en moet je uit je hoofd leren. Klik om het enkelvoud, meervoud en perfectum te zien." : "Bu fiillerin imperfectumu kuraldan çıkarılamaz, ezberlenmelidir. Tıklayarak enkelvoud, meervoud ve perfectum'u gör."}
              </p>
              <IrregGrid langNL={langNL} />
              <div className={S.note}>
                💡 {langNL ? "De beste manier om te leren:" : "En iyi ezber yöntemi:"} <b>infinitief → imperfectum enk. → perfectum</b> {langNL ? "trio. Voorbeeld:" : "üçlüsü. Örnek:"} &quot;gaan → ging → gegaan&quot;
              </div>
            </div>
            <div className={`${S.card} lg:col-span-12`}>
              <span style={S.badge(LEVEL_COLORS.b1)}>{langNL ? "B1 — Oefeningen" : "B1 — Alıştırmalar"}</span>
              <h3 className="text-lg font-bold mt-3 mb-3 text-[var(--text)]">{langNL ? "Onregelmatig imperfectum — Oefening" : "Düzensiz imperfectum — Alıştırma"}</h3>
              <QuizSection level="b1" langNL={langNL} />
            </div>
          </div>
        )}

        {/* ── B2 ── */}
        {activeLevel === "b2" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className={`${S.card} lg:col-span-7`}>
              <span style={S.badge(LEVEL_COLORS.b2)}>{langNL ? "B2 — Gebruik & Stijl" : "B2 — Kullanım & stil"}</span>
              <h3 className="text-lg font-bold mt-3 mb-2 text-[var(--text)]">{langNL ? "1. Woordvolgorde" : "1. Kelime sırası"}</h3>
              <p className="text-sm text-[var(--text)] opacity-80 mb-2">
                {langNL ? "Het imperfectum bestaat uit één woord — niet twee zoals het perfectum. Daarom is de woordvolgorde makkelijker." : "Imperfectum tek kelimedir — perfectum gibi iki parçalı değil. Bu yüzden sırası daha basittir."}
              </p>
              <div className={S.posDemo}>
                <div className={S.posZin}>
                  <span className={S.ppSub}>Ik</span>
                  <span className={S.ppPv}>werkte</span>
                  <span className={S.ppRest}>gisteren</span>
                  <span className={S.ppRest}>hard</span>.
                </div>
                <div className={S.posTr}>Ik werkte gisteren hard.</div>
                <div className={S.posNote}>{langNL ? "Het werkwoord is één woord → altijd op de 2e positie" : "Fiil tek parça → her zaman 2. pozisyon"}</div>
              </div>
              <div className={S.posDemo}>
                <div className={S.posZin}>
                  <span className={S.ppRest}>Gisteren</span>
                  <span className={S.ppPv}>werkte</span>
                  <span className={S.ppSub}>ik</span>
                  <span className={S.ppRest}>hard</span>.
                </div>
                <div className={S.posTr}>Ik werkte gisteren hard. (inversie)</div>
                <div className={S.posNote}>{langNL ? "Ook bij inversie blijft het werkwoord op de 2e positie" : "Inversie'de de fiil 2. pozisyonda kalır"}</div>
              </div>
              <div className={S.posDemo}>
                <div className={S.posZin}>
                  Hij zei dat hij gisteren <span className={S.ppEnd}>hard werkte</span>.
                </div>
                <div className={S.posTr}>Hij zei dat hij gisteren hard werkte.</div>
                <div className={S.posNote}>{langNL ? "In een bijzin gaat het werkwoord naar het einde (dezelfde regel als het perfectum)" : "Bijzin'de fiil sona gider (perfectum ile aynı kural)"}</div>
              </div>
              <h4 className="font-bold text-sm mt-5 mb-2 text-[var(--text)]">{langNL ? "Volledige vergelijkingstabel" : "Tam karşılaştırma tablosu"}</h4>
              <div className={S.tblWrap}>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={S.th}>Infinitief</th><th className={S.th}>Stam</th><th className={S.th}>Imperf. enk.</th>
                      <th className={S.th}>Imperf. mv.</th><th className={S.th}>Perfectum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["werken", "werk", "werkte", "werkten", "heeft gewerkt"],
                      ["horen", "hoor", "hoorde", "hoorden", "heeft gehoord"],
                      ["leven", "leef", "leefde", "leefden", "heeft geleefd"],
                      ["reizen", "reis", "reisde", "reisden", "heeft gereisd"],
                      ["zijn", "—", "was", "waren", "is geweest"],
                      ["gaan", "—", "ging", "gingen", "is gegaan"],
                      ["hebben", "—", "had", "hadden", "heeft gehad"],
                      ["komen", "—", "kwam", "kwamen", "is gekomen"],
                    ].map(([inf, stam, ie, im, perf], i) => (
                      <tr key={i}>
                        <td className={S.td}>{inf}</td><td className={S.td}>{stam}</td>
                        <td className={S.td}><b>{ie}</b></td><td className={S.td}><b>{im}</b></td>
                        <td className={S.td}>{perf}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={`${S.card} lg:col-span-5`}>
              <span style={S.badge(LEVEL_COLORS.b2)}>B2</span>
              <h3 className="text-lg font-bold mt-3 mb-2 text-[var(--text)]">{langNL ? "2. Fouten van Turkse studenten" : "2. Türk öğrencilerin hataları"}</h3>
              <div className="flex flex-col gap-2">
                {[
                  { y: "❌ Ik werkde gisteren.", d: "✅ Ik werkte gisteren.", n: langNL ? "werk → k ∈ SoFT KeTCHuP → +te" : "werk → k ∈ SoFT KeTCHuP → +te" },
                  { y: "❌ Zij leefde niet in Amsterdam. (SoFT KeTCHuP yanılgısı)", d: "✅ Zij leefde niet in Amsterdam. ✓ (" + (langNL ? "dit is al goed!" : "bu zaten doğru!") + ")", n: langNL ? "leef → f maar is origineel v → +de. leefde is goed." : "leef de → f ama orijinal v → +de. leefde doğrudur." },
                  { y: "❌ Wij gingen naar Amsterdam. (× heeft)", d: "✅ Wij gingen naar Amsterdam. ✓", n: langNL ? "gaan → ging/gingen (onregelmatig). Perfectum: zijn gegaan." : "gaan → ging/gingen (düzensiz). Perfectum: zijn gegaan." },
                  { y: "❌ Ik was gewerkt. (imperfectum + deelwoord karıştırma)", d: "✅ Ik werkte. (imperfectum) / Ik heb gewerkt. (perfectum)", n: langNL ? 'Imperfectum is één woord. "Was gewerkt" = passieve (edilgen) vorm.' : 'İmperfectum tek kelimedir. "Was gewerkt" = passief (edilgen) yapıdır.' },
                ].map((h, i) => (
                  <div key={i} className={S.hataItem}>
                    <div className={S.hataY}>{h.y}</div>
                    <div className={S.hataD}>{h.d}</div>
                    <div className={S.hataN}>{h.n}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`${S.card} lg:col-span-12`}>
              <span style={S.badge(LEVEL_COLORS.b2)}>{langNL ? "B2 — Oefeningen" : "B2 — Alıştırmalar"}</span>
              <h3 className="text-lg font-bold mt-3 mb-3 text-[var(--text)]">{langNL ? "Gebruik & positie — Oefening" : "Kullanım & pozisyon — Alıştırma"}</h3>
              <QuizSection level="b2" langNL={langNL} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
