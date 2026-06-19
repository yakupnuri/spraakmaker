"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScheidbareWerkwoordenPanelProps {
  accentColor: string;
}

// 1. Fiil Veritabanı
const VERB_DATABASE = [
  { 
    infinitive: "afspreken", 
    translation: "sözleşmek / randevulaşmak", 
    translationEn: "to make an appointment",
    stem: "spreek af", 
    imperfectum: "sprak af", 
    perfectum: "heeft afgesproken", 
    bijzin: "omdat ik afspreek" 
  },
  { 
    infinitive: "opstaan", 
    translation: "uyanmak / ayağa kalkmak", 
    translationEn: "to stand up / get up",
    stem: "sta op", 
    imperfectum: "stond op", 
    perfectum: "is opgestaan", 
    bijzin: "als ik opsta" 
  },
  { 
    infinitive: "meenemen", 
    translation: "yanına almak", 
    translationEn: "to take along",
    stem: "neem mee", 
    imperfectum: "nam mee", 
    perfectum: "heeft meegenomen", 
    bijzin: "dat hij meeneemt" 
  },
  { 
    infinitive: "aankomen", 
    translation: "varmak / ulaşmak / kilo almak", 
    translationEn: "to arrive / gain weight",
    stem: "kom aan", 
    imperfectum: "kwam aan", 
    perfectum: "is aangekomen", 
    bijzin: "toen wij aankwamen" 
  },
  { 
    infinitive: "opbellen", 
    translation: "telefonla aramak", 
    translationEn: "to call up",
    stem: "bel op", 
    imperfectum: "belde op", 
    perfectum: "heeft opgebeld", 
    bijzin: "omdat je opbelt" 
  },
  { 
    infinitive: "uitnodigen", 
    translation: "davet etmek", 
    translationEn: "to invite",
    stem: "nodig uit", 
    imperfectum: "nodigde uit", 
    perfectum: "heeft uitgenodigd", 
    bijzin: "hoewel ze uitnodigt" 
  },
  { 
    infinitive: "terugkomen", 
    translation: "geri dönmek", 
    translationEn: "to come back",
    stem: "kom terug", 
    imperfectum: "kwam terug", 
    perfectum: "is teruggekomen", 
    bijzin: "zodra ik terugkom" 
  },
  { 
    infinitive: "schoonmaken", 
    translation: "temizlik yapmak", 
    translationEn: "to clean",
    stem: "maak schoon", 
    imperfectum: "maakte schoon", 
    perfectum: "heeft schoongemaakt", 
    bijzin: "omdat we schoonmaken" 
  },
  { 
    infinitive: "klaarmaken", 
    translation: "hazırlamak", 
    translationEn: "to prepare / make ready",
    stem: "maak klaar", 
    imperfectum: "maakte klaar", 
    perfectum: "heeft klaargemaakt", 
    bijzin: "als je klaarmaakt" 
  },
  { 
    infinitive: "deelnemen", 
    translation: "katılmak (iştirak etmek)", 
    translationEn: "to participate",
    stem: "neem deel", 
    imperfectum: "nam deel", 
    perfectum: "heeft deelgenomen", 
    bijzin: "dat u deelneemt" 
  }
];

// 2. Quiz Soruları
const QUIZ_QUESTIONS = [
  {
    level: "A1",
    questionNl: "Tegenwoordige Tijd: Vul de juiste vorm van 'opbellen' in.",
    questionTr: "Şimdiki Zaman: 'opbellen' fiilinin doğru formunu yerleştirin.",
    context: "Ik ... morgen mijn moeder ...",
    options: [
      { text: "bel op / (geen)", correct: false },
      { text: "bel / op", correct: true },
      { text: "opbel / (geen)", correct: false },
      { text: "belt / op", correct: false }
    ],
    explanationNl: "In de tegenwoordige tijd splitst het werkwoord 'opbellen': de stam 'bel' staat op plaats 2, de prefix 'op' gaat helemaal naar het einde.",
    explanationTr: "Şimdiki zamanda 'opbellen' fiili ayrılır: 'bel' gövdesi 2. sırada yer alır, 'op' ön eki ise cümlenin en sonuna gider."
  },
  {
    level: "A2",
    questionNl: "Perfectum: Wat is de juiste perfectum-vorm van 'meenemen'?",
    questionTr: "Perfectum: 'meenemen' fiilinin doğru perfectum formu hangisidir?",
    context: "Ik heb mijn boeken ...",
    options: [
      { text: "meegenomen", correct: true },
      { text: "gemeenomen", correct: false },
      { text: "meegeneemt", correct: false },
      { text: "meegewonnen", correct: false }
    ],
    explanationNl: "Bij perfectum van scheidbare werkwoorden komt '-ge-' tussen de prefix (mee) en het voltooid deelwoord (genomen): 'meegenomen'.",
    explanationTr: "Ayrılabilir fiillerin perfectum halinde '-ge-' eki, ön ek (mee) ile geçmiş zaman ortacı (genomen) arasına girer: 'meegenomen'."
  },
  {
    level: "B1",
    questionNl: "Bijzin (Yan Cümle): Welke vorm is correct na 'omdat'?",
    questionTr: "Yan Cümle: 'omdat' bağlacından sonra hangi form doğrudur?",
    context: "Ik ben moe omdat ik vroeg ...",
    options: [
      { text: "sta op", correct: false },
      { text: "opsta", correct: true },
      { text: "opstaat", correct: false },
      { text: "opgestaan ben", correct: false }
    ],
    explanationNl: "In een bijzin plakt het werkwoord weer terug aan elkaar vast aan het einde van de zin: 'opsta'.",
    explanationTr: "Yan cümlede (omdat'tan sonra) ayrılabilir fiil tekrar birleşir ve cümlenin sonunda yer alır: 'opsta'."
  },
  {
    level: "B2",
    questionNl: "Complexe structuren: Wat is de juiste vorm met 'te'?",
    questionTr: "Karmaşık yapılar: 'te' ile doğru kullanım hangisidir?",
    context: "Het is belangrijk om je vrienden ...",
    options: [
      { text: "te uitnodigen", correct: false },
      { text: "uit te nodigen", correct: true },
      { text: "uitnodigen te", correct: false },
      { text: "te uitgenodigd", correct: false }
    ],
    explanationNl: "In een 'te + infinitief' constructie komt 'te' tussen de prefix (uit) en het hele werkwoord (nodigen): 'uit te nodigen'.",
    explanationTr: "'te + mastar' yapısında, 'te' kelimesi ön ek (uit) ile temel fiil (nodigen) arasına girer: 'uit te nodigen'."
  }
];

export default function ScheidbareWerkwoordenPanel({ accentColor }: ScheidbareWerkwoordenPanelProps) {
  const [langNL, setLangNL] = useState(false); // Varsayılan olarak Türkçe destekli/iki dilli açalım.
  const [activeLevel, setActiveLevel] = useState("all");
  
  // Prefix Detector State
  const [verbInput, setVerbInput] = useState("");
  const detectorResult = useMemo(() => {
    const input = verbInput.trim().toLowerCase();
    if (!input) return null;

    const sepPrefixes = ['op', 'af', 'mee', 'aan', 'uit', 'in', 'neer', 'terug', 'samen', 'open', 'dicht', 'door', 'voor', 'bij', 'weg', 'tegen'];
    const insepPrefixes = ['be', 'ver', 'her', 'ont', 'ge'];

    let detectedSep = sepPrefixes.find(p => input.startsWith(p) && input.length > p.length);
    let detectedInsep = insepPrefixes.find(p => input.startsWith(p) && input.length > p.length);

    if (detectedSep) {
      return {
        type: "sep",
        prefix: detectedSep,
        messageNl: `Scheidbaar (Ayrılabilir)! Prefix: ${detectedSep}-`,
        messageTr: `Ayrılabilir fiil! Ön ek: ${detectedSep}-`
      };
    } else if (detectedInsep) {
      return {
        type: "insep",
        prefix: detectedInsep,
        messageNl: `Niet scheidbaar (Ayrılamaz / Vaste prefix)! Prefix: ${detectedInsep}-. Dit prefix splitst nooit.`,
        messageTr: `Ayrılamayan fiil (Sabit ön ek)! Ön ek: ${detectedInsep}-. Bu ön ek asla ayrılmaz.`
      };
    } else {
      return {
        type: "unknown",
        messageNl: "Gewoon werkwoord / Onbekend: Geen speciale prefix gedetecteerd.",
        messageTr: "Standart fiil / Bilinmeyen: Özel bir ayrılabilir ön ek tespit edilmedi."
      };
    }
  }, [verbInput]);

  // Fiil Tablosu Arama State
  const [tableSearch, setTableSearch] = useState("");
  const filteredVerbs = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();
    if (!query) return VERB_DATABASE;
    return VERB_DATABASE.filter(item => 
      item.infinitive.toLowerCase().includes(query) || 
      item.translation.toLowerCase().includes(query) ||
      item.translationEn.toLowerCase().includes(query)
    );
  }, [tableSearch]);

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion = QUIZ_QUESTIONS[quizIndex];

  const handleAnswerSelect = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    if (currentQuestion.options[idx].correct) {
      setQuizScore(s => s + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOpt(null);
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex(i => i + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    setQuizIndex(0);
    setSelectedOpt(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  // Kart görünürlük kontrolü helper'ı
  const shouldShow = (cardLevel: string) => {
    if (activeLevel === "all") return true;
    return activeLevel === cardLevel;
  };

  return (
    <div className="bg-[var(--surface)] text-[var(--text)] select-none">
      {/* Hero Banner */}
      <section 
        className="relative overflow-hidden p-4 md:p-8"
        style={{
          background: "var(--surface)",
          borderBottom: "2px solid #eadfcd"
        }}
      >
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[var(--accent-soft)]0/10 pointer-events-none" 
             style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(45,108,223,0.1) 0px, rgba(45,108,223,0.1) 8px, transparent 8px, transparent 16px)" }} />
        
        {/* Dil Seçici */}
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
          <span className="inline-block bg-[var(--primary)] text-white rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
            UITLEG / AÇIKLAMA
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2 leading-none">
          Scheidbare werkwoorden
        </h2>
        <p className="text-base text-[var(--text-muted)] max-w-2xl leading-relaxed">
          {langNL ? (
            "Scheidbare werkwoorden hebben een prefix (op-, af-, mee-, aan-...) dat loskomt in de zin. Dit prefix verhuist meestal naar het einde van de zin."
          ) : (
            "Ayrılabilir fiillerin bir ön eki (op-, af-, mee-, aan-...) vardır ve bu ön ek cümlede ayrılır. Ön ek genellikle cümlenin en sonuna gider."
          )}
        </p>

        {/* Belangrijkste Regel Kartı */}
        <div className="mt-6 flex items-start gap-4 p-4 bg-[var(--surface)] border-2 border-dashed border-[var(--border)] rounded-2xl max-w-2xl">
          <div className="text-3xl p-3 bg-[var(--accent-soft)] text-[var(--accent)] rounded-xl flex-shrink-0">✂️</div>
          <div>
            <h4 className="font-extrabold text-lg text-[var(--text)]">
              {langNL ? "Belangrijkste regel" : "En Önemli Kural"}
            </h4>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {langNL ? (
                <>In een gewone hoofdzin splitsen we het werkwoord. Het prefix gaat helemaal naar het <b>einde van de zin</b>.</>
              ) : (
                <>Normal bir ana cümlede fiili ikiye ayırırız. Ön ek cümlenin en <b>sonuna</b> gider.</>
              )}
            </p>
          </div>
        </div>

        {/* Seviye Sekmeleri (Level Tabs) */}
        <div className="flex gap-2 overflow-x-auto pb-2 mt-6 max-w-lg custom-scrollbar">
          {[
            { key: "all", label: langNL ? "Alles tonen" : "Hepsini Göster" },
            { key: "a1", label: "A1 · De Basis" },
            { key: "a2", label: "A2 · Perfectum" },
            { key: "b1", label: "B1 · Bijzin" },
            { key: "b2", label: "B2 · Te + Infinitief" }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveLevel(tab.key)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full border-2 transition-all cursor-pointer whitespace-nowrap ${
                activeLevel === tab.key
                  ? "bg-[var(--primary)] text-[var(--surface)] border-[var(--border)]"
                  : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--surface)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid Layout */}
      <div className="p-4 md:p-4 space-y-6">
        
        {/* LEVEL A1: PREFIX CHECK */}
        {shouldShow("a1") && (
          <motion.article 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm"
          >
            <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
              1 · De Prefix-check (A1)
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-2">
              {langNL ? "Hoe herken je een scheidbaar werkwoord?" : "Ayrılabilir fiili nasıl tanırsınız?"}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              {langNL ? (
                <>Als het prefix loskomt, is het werkwoord <b>scheidbaar</b>. Vaste prefixen zijn <b>niet-scheidbaar</b>.</>
              ) : (
                <>Eğer ön ek ayrılıyorsa, fiil <b>ayrılabilir (scheidbaar)</b> bir fiildir. Sabit önekler ise <b>ayrılamaz</b>.</>
              )}
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: "op-", ex: "opbellen, opstaan", type: "sep", tr: "ayrılabilir" },
                { label: "af-", ex: "afspreken, afmaken", type: "sep", tr: "ayrılabilir" },
                { label: "mee-", ex: "meenemen, meedoen", type: "sep", tr: "ayrılabilir" },
                { label: "aan-", ex: "aankomen, aanzetten", type: "sep", tr: "ayrılabilir" },
                { label: "uit-", ex: "uitnodigen, uitgaan", type: "sep", tr: "ayrılabilir" },
                { label: "be-", ex: "begrijpen, betalen", type: "insep", tr: "sabit / ayrılamaz" },
                { label: "ver-", ex: "vergeten, verkopen", type: "insep", tr: "sabit / ayrılamaz" },
              ].map((prefix, idx) => (
                <div key={idx} className="border-2 border-[var(--border)] rounded-xl p-3 bg-[var(--surface)] text-center flex flex-col justify-between">
                  <div>
                    <span className="text-2xl">{prefix.type === "sep" ? "🟢" : "🔴"}</span>
                    <h4 className="text-base font-extrabold text-[var(--text)] mt-1">{prefix.label}</h4>
                    <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-1">{prefix.ex}</p>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      prefix.type === "sep" 
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]" 
                        : "bg-[var(--danger-soft)] text-[var(--danger)]"
                    }`}>
                      {prefix.type === "sep" 
                        ? (langNL ? "scheidbaar" : prefix.tr) 
                        : (langNL ? "vast" : prefix.tr)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.article>
        )}

        {/* PREFIX DETECTOR WIDGET */}
        <div className="bg-[var(--surface)] border-2 border-dashed border-[var(--border)] rounded-2xl p-4 shadow-sm">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
            <span>🔍</span> Prefix Detector (Sanal Ek Kontrolü)
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            {langNL ? (
              "Typ een werkwoord (bijv. opbellen, vergeten, meenemen, begrijpen) om de prefix-status te testen."
            ) : (
              "Önek durumunu test etmek için bir fiil yazın (örn: opbellen, vergeten, meenemen, begrijpen)."
            )}
          </p>
          
          <div className="flex gap-2 flex-wrap max-w-xl">
            <input 
              type="text" 
              value={verbInput}
              onChange={(e) => setVerbInput(e.target.value)}
              placeholder="opbellen, vergeten..." 
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text)]"
            />
            {verbInput && (
              <button 
                onClick={() => setVerbInput("")} 
                className="px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface-2)] rounded-xl text-xs font-semibold border-none cursor-pointer"
              >
                {langNL ? "Wissen" : "Temizle"}
              </button>
            )}
          </div>

          <AnimatePresence>
            {detectorResult && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`mt-4 p-3 rounded-xl text-xs font-semibold ${
                  detectorResult.type === "sep"
                    ? "bg-[var(--success-soft)] border border-[var(--success)] text-[var(--success)]"
                    : detectorResult.type === "insep"
                    ? "bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)]"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
                }`}
              >
                {langNL ? detectorResult.messageNl : detectorResult.messageTr}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Grid: A1 Present & A2 Perfectum */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEVEL A1: Present Tense Structure */}
          {shouldShow("a1") && (
            <motion.article 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm lg:col-span-7 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
                  2 · Tegenwoordige tijd (A1)
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-2">
                  {langNL ? "Zinsbouw in de praktijk" : "Pratikte Cümle Yapısı"}
                </h3>
                
                <div className="flex flex-wrap items-center justify-center gap-2 p-4 rounded-xl bg-[var(--surface-2)] border-2 border-[var(--border)] my-3">
                  <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 font-bold text-sm">Ik</span>
                  <span className="bg-[var(--surface)] border border-[var(--accent)] text-[var(--accent)] rounded-lg px-3 py-1.5 font-bold text-sm">spreek</span>
                  <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 font-medium text-xs text-[var(--text-muted)]">morgen</span>
                  <span className="text-lg text-[var(--warning)] font-black">→</span>
                  <span className="bg-[var(--warning)]/10 border-2 border-[var(--warning)]/30 text-[var(--warning)] rounded-lg px-3 py-1.5 font-bold text-sm">af</span>
                </div>
                
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  {langNL ? (
                    <>Türkçe mantık: <i>“Ben yarın sözleşiyorum.”</i> (afspreken). De prefix &apos;af&apos; gaat naar het einde.</>
                  ) : (
                    <>Türkçe mantığı: <i>“Ben yarın sözleşiyorum.”</i> (afspreken). &apos;af&apos; ön eki cümlenin en sonuna gider.</>
                  )}
                </p>
                
                <div className="space-y-2">
                  {[
                    { nl: "Ik sta elke dag om zeven uur op.", tr: "Ben her gün saat yedide kalkarım. (opstaan)" },
                    { nl: "Neem je die boeken ook mee?", tr: "Bu kitapları sen de yanına alıyor musun? (meenemen)" },
                    { nl: "De trein komt om tien uur aankomen → komt om tien uur aan.", tr: "Tren saat onda varıyor. (aankomen)" },
                  ].map((ex, i) => (
                    <div key={i} className="border-l-4 border-[var(--accent)] bg-[var(--accent-soft)] rounded-r-xl p-3">
                      <b className="text-sm block text-[var(--text)]">{ex.nl}</b>
                      <span className="text-xs text-[var(--text-muted)]">{ex.tr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.article>
          )}

          {/* LEVEL A2: Verleden Tijd (Perfectum) */}
          {shouldShow("a2") && (
            <motion.article 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm lg:col-span-5 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
                  3 · Perfectum (A2)
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-2">
                  {langNL ? '"ge-" tussen prefix en stam' : 'Ön Ek ile Gövde Arasına "ge-"'}
                </h3>
                
                <div className="flex flex-wrap items-center justify-center gap-1.5 p-4 rounded-xl bg-[var(--accent-soft)] border-2 border-[var(--accent)] my-3">
                  <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 font-bold text-sm">af</span>
                  <span className="text-sm font-black text-[var(--accent)]">+</span>
                  <span className="bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)] rounded-lg px-2.5 py-1.5 font-black text-sm">ge</span>
                  <span className="text-sm font-black text-[var(--accent)]">+</span>
                  <span className="bg-[var(--warning)]/10 border-2 border-[var(--warning)]/30 text-[var(--warning)] rounded-lg px-2.5 py-1.5 font-bold text-sm">sproken</span>
                </div>
                
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  {langNL ? (
                    <>De prefix en stam vormen in het perfectum één woord met &apos;ge-&apos; in het midden.</>
                  ) : (
                    <>Perfectum (geçmiş zaman) yaparken &apos;ge-&apos; eki önek ile fiilin arasına girer ve kelime birleşik yazılır.</>
                  )}
                </p>
                
                <div className="space-y-2">
                  {[
                    { nl: "Ik heb haar opgebeld.", tr: "Onu telefonla aradım. (op + ge + beld)" },
                    { nl: "Hij is vroeg opgestaan.", tr: "O erken kalktı. (op + ge + staan)" },
                  ].map((ex, i) => (
                    <div key={i} className="border-l-4 border-[var(--accent)] bg-[var(--accent-soft)] rounded-r-xl p-3">
                      <b className="text-sm block text-[var(--text)]">{ex.nl}</b>
                      <span className="text-xs text-[var(--text-muted)]">{ex.tr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.article>
          )}
        </div>

        {/* Grid: B1 Bijzin & B2 Te + Infinitief */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEVEL B1: Bijzin Rules */}
          {shouldShow("b1") && (
            <motion.article 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm lg:col-span-7 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
                  4 · In de bijzin (B1)
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-2">
                  {langNL ? "Prefix plakt terug!" : "Ön Ek Geri Yapışır!"}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  {langNL ? (
                    <>In een bijzin (na <i>omdat, dat, als...</i>) gaat het werkwoord naar het einde. De prefix plakt dan weer vast.</>
                  ) : (
                    <>Bir yan cümlede (<i>omdat, dat, als...</i> sonrasında) fiil sona gider. Ön ek ise temel fiile geri yapışır.</>
                  )}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--accent-soft)]/20 border border-[var(--accent)]">
                    <strong className="text-base text-[var(--text)] block mb-1">Hoofdzin (Ana Cümle)</strong>
                    <div className="h-1.5 bg-[var(--accent-soft)]0 rounded-full my-2" />
                    <p className="font-bold text-sm text-[var(--accent)]">Ik sta vroeg op.</p>
                    <span className="text-[10px] text-[var(--text-muted)]">(Zin is gesplitst / Cümle ayrılmıştır)</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--success-soft)]/20 border border-[var(--success)]">
                    <strong className="text-base text-[var(--text)] block mb-1">Bijzin (Yan Cümle)</strong>
                    <div className="h-1.5 bg-[var(--success-soft)]0 rounded-full my-2" />
                    <p className="font-bold text-sm text-[var(--success)]">... omdat ik vroeg opsta.</p>
                    <span className="text-[10px] text-[var(--text-muted)]">(Alles plakt weer vast! / Tekrar birleşir)</span>
                  </div>
                </div>
              </div>
            </motion.article>
          )}

          {/* LEVEL B2: Complexe structuren (Te + Infinitief) */}
          {shouldShow("b2") && (
            <motion.article 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm lg:col-span-5 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
                  5 · Te + Infinitief (B2)
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-2">
                  {langNL ? '"te" tussen prefix en infinitief' : 'Araya "te" Yerleştirme'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  {langNL ? (
                    <>Bij een &apos;te + infinitief&apos; komt het woord &apos;te&apos; tussen de prefix en de infinitief.</>
                  ) : (
                    <>Eğer ayrılabilen fiil bir &apos;te + mastar&apos; kalıbıyla kullanılırsa, &apos;te&apos; kelimesi de araya yerleşir:</>
                  )}
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-1.5 p-4 rounded-xl bg-[var(--accent-soft)] border-2 border-[var(--accent)] my-3">
                  <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 font-bold text-sm">mee</span>
                  <span className="text-sm font-black text-[var(--accent)]">→</span>
                  <span className="bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)] rounded-lg px-2.5 py-1.5 font-black text-sm">te</span>
                  <span className="text-sm font-black text-[var(--accent)]">→</span>
                  <span className="bg-[var(--warning)]/10 border-2 border-[var(--warning)]/30 text-[var(--warning)] rounded-lg px-2.5 py-1.5 font-bold text-sm">doen</span>
                </div>

                <div className="border-l-4 border-[var(--accent)] bg-[var(--accent-soft)] rounded-r-xl p-3">
                  <b className="text-sm block text-[var(--text)]">Het is leuk om mee te doen.</b>
                  <span className="text-xs text-[var(--text-muted)]">Katılmak eğlencelidir. (meedoen)</span>
                </div>
              </div>
            </motion.article>
          )}
        </div>

        {/* LET OP PANEL (MODALS) */}
        {shouldShow("b2") && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="bg-[var(--primary)] text-white rounded-3xl p-4 relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 text-8xl font-black opacity-[0.03] select-none pointer-events-none">
              splitsen
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-2 flex items-center gap-2 text-white">
              💡 {langNL ? "Let op met hulpwerkwoorden (Modals)" : "Yardımcı Fiillere (Modals) Dikkat"}
            </h3>
            <p className="text-sm text-white/80 leading-relaxed max-w-3xl">
              {langNL ? (
                <>Als er een modaal werkwoord (kunnen, willen, moeten...) in de zin staat, splitsen we het scheidbare werkwoord <b>niet</b>. Het hele werkwoord gaat als infinitief naar het einde.</>
              ) : (
                <>Eğer cümlede bir tarz fiil (kunnen, willen, moeten...) varsa, ayrılabilir fiili <b>ayırmayız</b>. Fiil mastar haliyle cümlenin en sonuna gider.</>
              )}
            </p>
            <div className="inline-block bg-[var(--surface)] text-[var(--text)] font-extrabold text-sm px-4 py-2 rounded-full mt-4 shadow-sm">
              Ik wil morgen vroeg opstaan. (Niet splitsen! / Ayrılmaz!)
            </div>
          </motion.div>
        )}

        {/* DYNAMIC INTERACTIVE TABLE */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl md:text-2xl font-black">
                {langNL ? "Interactieve Tabel (Fiil Çekimleri)" : "Etkileşimli Tablo (Fiil Çekimleri)"}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {langNL ? "Zoek en filter door de meest gebruikte scheidbare werkwoorden." : "En sık kullanılan ayrılabilir fiiller arasında arama yapın."}
              </p>
            </div>
            <input 
              type="text" 
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder={langNL ? "Zoek een werkwoord..." : "Fiil ara..."} 
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text)] max-w-xs"
            />
          </div>

          <div className="overflow-x-auto custom-scrollbar border border-[var(--border)] rounded-xl bg-[var(--surface)]">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-[var(--primary)] text-white">
                  <th className="p-3 font-bold">Infinitief</th>
                  <th className="p-3 font-bold">{langNL ? "Betekenis" : "Anlamı"}</th>
                  <th className="p-3 font-bold">Stam</th>
                  <th className="p-3 font-bold">Imperfectum</th>
                  <th className="p-3 font-bold">Perfectum</th>
                  <th className="p-3 font-bold">Bijzin voorbeeld</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee5d7]">
                {filteredVerbs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center italic text-[var(--text-muted)]">
                      {langNL ? "Geen werkwoorden gevonden." : "Fiil bulunamadı."}
                    </td>
                  </tr>
                ) : (
                  filteredVerbs.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-[var(--warning)]/10" : ""}>
                      <td className="p-3 font-extrabold text-[var(--text)]">{item.infinitive}</td>
                      <td className="p-3 text-[var(--text-muted)] text-xs">
                        {langNL ? item.translationEn : item.translation}
                      </td>
                      <td className="p-3 font-mono text-xs text-[var(--accent)]">{item.stem}</td>
                      <td className="p-3 font-mono text-xs text-[var(--warning)]">{item.imperfectum}</td>
                      <td className="p-3 font-mono text-xs text-[var(--success)] font-bold">{item.perfectum}</td>
                      <td className="p-3 font-mono text-xs text-[var(--accent)]">{item.bijzin}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* QUIZ PRACTICE AREA */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
          {!quizFinished ? (
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
                <span className="step">
                  {currentQuestion.level} {langNL ? "Niveau" : "Seviyesi"}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-bold font-mono">
                  {langNL ? "Vraag" : "Soru"} {quizIndex + 1} / {QUIZ_QUESTIONS.length}
                </span>
              </div>

              <div className="mb-6">
                <h4 className="text-base font-bold leading-relaxed text-[var(--text)]">
                  {langNL ? currentQuestion.questionNl : currentQuestion.questionTr}
                </h4>
                {currentQuestion.context && (
                  <p className="text-sm text-[var(--text-muted)] mt-2 bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)] inline-block font-mono">
                    Zin: <span className="font-serif italic font-bold text-[var(--text)]">&quot;{currentQuestion.context}&quot;</span>
                  </p>
                )}
              </div>

              {/* Seçenekler */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt, idx) => {
                  let borderCls = "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border)]";
                  let bgCls = "";
                  
                  if (selectedOpt !== null) {
                    if (opt.correct) {
                      borderCls = "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)] font-bold pointer-events-none";
                    } else if (idx === selectedOpt) {
                      borderCls = "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)] font-bold pointer-events-none";
                    } else {
                      borderCls = "border-[var(--border)] bg-[var(--surface)] opacity-40 pointer-events-none";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedOpt !== null}
                      onClick={() => handleAnswerSelect(idx)}
                      className={`w-full text-left p-3.5 rounded-xl text-sm transition-all focus:outline-none flex justify-between items-center text-[var(--text)] border-2 cursor-pointer ${borderCls} ${bgCls}`}
                    >
                      <span>{opt.text}</span>
                      <span className="w-6 h-6 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[10px] font-mono text-[var(--text-muted)]">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-between items-center">
                <div className="text-xs font-semibold max-w-md">
                  {selectedOpt !== null && (
                    <div className={currentQuestion.options[selectedOpt].correct ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                      {currentQuestion.options[selectedOpt].correct 
                        ? (langNL ? "🎉 Goed! " : "🎉 Doğru! ") 
                        : (langNL ? "❌ Fout. " : "❌ Yanlış. ")}
                      <span className="text-xs text-[var(--text-muted)] font-normal">
                        {langNL ? currentQuestion.explanationNl : currentQuestion.explanationTr}
                      </span>
                    </div>
                  )}
                </div>
                {selectedOpt !== null && (
                  <button 
                    onClick={handleNextQuestion} 
                    className="px-5 py-2.5 bg-[var(--success)] hover:bg-[var(--success)] text-white rounded-xl text-xs font-bold transition-all shadow-md border-none cursor-pointer"
                  >
                    {langNL ? "Volgende Vraag →" : "Sonraki Soru →"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Sonuç Paneli
            <div className="bg-[var(--warning)]/10 text-[var(--text)] rounded-2xl p-4 text-center border border-[var(--warning)]/30">
              <span className="text-4xl">🎉</span>
              <h3 className="text-xl font-bold text-[var(--text)] mt-2">
                {langNL ? "Goed gedaan!" : "Tebrikler! İyi İş Çıkardınız!"}
              </h3>
              <p className="text-sm text-[var(--text)] mt-2">
                {langNL ? (
                  <>Jouw score: <strong>{quizScore} / {QUIZ_QUESTIONS.length}</strong> ({Math.round((quizScore / QUIZ_QUESTIONS.length) * 100)}%)</>
                ) : (
                  <>Skorunuz: <strong>{quizScore} / {QUIZ_QUESTIONS.length}</strong> (%{Math.round((quizScore / QUIZ_QUESTIONS.length) * 100)})</>
                )}
              </p>
              <button 
                onClick={restartQuiz} 
                className="mt-4 px-5 py-2.5 bg-[var(--primary)] text-white hover:opacity-90 rounded-xl text-xs font-bold transition-all border-none cursor-pointer"
              >
                {langNL ? "Opnieuw Proberen" : "Tekrar Dene"}
              </button>
            </div>
          )}
        </div>

      </div>

      <div className="footer p-4 border-t border-[var(--border)] text-center text-xs text-[var(--text-muted)]">
        Scheidbare werkwoorden · Interactieve webles · Nederlands + korte Turkse uitleg
      </div>
    </div>
  );
}
