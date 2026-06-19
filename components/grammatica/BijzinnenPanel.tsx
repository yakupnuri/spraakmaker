"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BijzinnenPanelProps {
  accentColor: string;
}

// 1. Bağlaç Veritabanı
const CONJUNCTION_DATABASE = [
  { 
    infinitive: "omdat", 
    translation: "çünkü (gerekçe)", 
    translationEn: "because",
    stem: "S + ... + V (einde)", 
    perfectum: "bijzinsvolgorde", 
    bijzin: "... omdat hij ziek is." 
  },
  { 
    infinitive: "dat", 
    translation: "-diği / ki (açıklama)", 
    translationEn: "that",
    stem: "S + ... + V (einde)", 
    perfectum: "bijzinsvolgorde", 
    bijzin: "... dat ze morgen komt." 
  },
  { 
    infinitive: "als", 
    translation: "eğer / -ince (şart)", 
    translationEn: "if / when",
    stem: "S + ... + V (einde)", 
    perfectum: "bijzinsvolgorde", 
    bijzin: "... als ik tijd heb." 
  },
  { 
    infinitive: "toen", 
    translation: "-diği zaman (geçmiş)", 
    translationEn: "when (past events)",
    stem: "S + ... + V (einde)", 
    perfectum: "bijzinsvolgorde", 
    bijzin: "... toen hij belde." 
  },
  { 
    infinitive: "terwijl", 
    translation: "-iken (eş zamanlılık)", 
    translationEn: "while",
    stem: "S + ... + V (einde)", 
    perfectum: "bijzinsvolgorde", 
    bijzin: "... terwijl zij slaapt." 
  },
  { 
    infinitive: "hoewel", 
    translation: "-e rağmen (zıtlık)", 
    translationEn: "although",
    stem: "S + ... + V (einde)", 
    perfectum: "bijzinsvolgorde", 
    bijzin: "... hoewel het regent." 
  },
  { 
    infinitive: "zodat", 
    translation: "böylelikle / -sin diye", 
    translationEn: "so that",
    stem: "S + ... + V (einde)", 
    perfectum: "bijzinsvolgorde", 
    bijzin: "... zodat we kunnen slagen." 
  },
  { 
    infinitive: "want", 
    translation: "zira / çünkü", 
    translationEn: "because (coordinating)",
    stem: "normale volgorde!", 
    perfectum: "hoofdzin (geen verandering)", 
    bijzin: "... want hij is ziek." 
  }
];

// 2. Quiz Soruları
const QUIZ_QUESTIONS = [
  {
    level: "A1/A2",
    questionNl: "Kies het juiste voegwoord voor de zin.",
    questionTr: "Cümle için doğru bağlacı seçin.",
    context: "Ik ga niet naar buiten ... het regent.",
    options: [
      { text: "want", correct: false },
      { text: "omdat", correct: true },
      { text: "hoewel", correct: false },
      { text: "maar", correct: false }
    ],
    explanationNl: "De zin eindigt met het werkwoord 'regent'. Dit betekent dat we een bijzinsvoegwoord nodig hebben: 'omdat'.",
    explanationTr: "Cümle 'regent' fiili ile bitmektedir. Bu durum, fiili sona atan bir yan cümle bağlacı (bijzinsvoegwoord) olan 'omdat' kullanmamız gerektiğini gösterir."
  },
  {
    level: "A1/A2",
    questionNl: "Correcte woordvolgorde: Hoe vul je deze zin aan met 'ik ben moe'?",
    questionTr: "Doğru kelime sırası: 'ik ben moe' ifadesini bu cümleye nasıl yerleştirirsiniz?",
    context: "Ik ga vroeg naar bed omdat ...",
    options: [
      { text: "ik ben moe", correct: false },
      { text: "ik moe ben", correct: true },
      { text: "moe ik ben", correct: false },
      { text: "ben ik moe", correct: false }
    ],
    explanationNl: "Na 'omdat' volgt een bijzin, dus het werkwoord 'ben' verhuist verplicht naar het einde: 'ik moe ben'.",
    explanationTr: "'omdat' kelimesinden sonra yan cümle gelir, bu yüzden 'ben' fiili zorunlu olarak cümlenin en sonuna taşınır: 'ik moe ben'."
  },
  {
    level: "B1",
    questionNl: "Bijzin met modalen: Vul de juiste dubbele werkwoordsvorm in.",
    questionTr: "Tarz fiilli yan cümle: Doğru çift fiil çekimini yerleştirin.",
    context: "Hij komt niet, omdat hij vandaag ...",
    options: [
      { text: "moet werken", correct: true },
      { text: "werken moet", correct: false },
      { text: "werkt moeten", correct: false },
      { text: "moest werk", correct: false }
    ],
    explanationNl: "In de bijzin met een hulpwerkwoord (moeten) en een infinitief (werken), staat het hulpwerkwoord meestal direct voor de infinitief aan het einde: 'moet werken'.",
    explanationTr: "Yan cümlede yardımcı fiil (moeten) ve mastar (werken) bulunduğunda, yardımcı fiil genellikle sondaki mastardan hemen önce yer alır: 'moet werken'."
  },
  {
    level: "B2",
    questionNl: "Inversie (Bijzin voorop): Wat is de juiste volgorde voor het second deel?",
    questionTr: "Ters çevrim (Yan cümle başta): İkinci kısım için doğru sıralama hangisidir?",
    context: "Als het morgen mooi weer is, ...",
    options: [
      { text: "wij gaan fietsen", correct: false },
      { text: "gaan wij fietsen", correct: true },
      { text: "wij fietsen gaan", correct: false },
      { text: "gaan fietsen wij", correct: false }
    ],
    explanationNl: "Wanneer de bijzin op de eerste plaats staat, start de hoofdzin met inversie (Persoonsvorm + Onderwerp): 'gaan wij fietsen'.",
    explanationTr: "Yan cümle en başta yer aldığında, ana cümle devrik yapıyla (Persoonsvorm + Özne) başlar: 'gaan wij fietsen'."
  }
];

export default function BijzinnenPanel({ accentColor }: BijzinnenPanelProps) {
  const [langNL, setLangNL] = useState(false); // İki dilli / Türkçe varsayılan
  const [activeLevel, setActiveLevel] = useState("all");

  // Zinsbouwer State
  const [builderVoegwoord, setBuilderVoegwoord] = useState("omdat");
  const [builderOnderwerp, setBuilderOnderwerp] = useState("hij");
  const [builderWerkwoord, setBuilderWerkwoord] = useState("werkt");

  const buildResult = useMemo(() => {
    let verbForm = builderWerkwoord;
    if (builderOnderwerp === "wij") {
      if (builderWerkwoord === "werkt") verbForm = "werken";
      if (builderWerkwoord === "leest") verbForm = "lezen";
      if (builderWerkwoord === "slaapt") verbForm = "slapen";
    } else if (builderOnderwerp === "ik") {
      if (builderWerkwoord === "werkt") verbForm = "werk";
      if (builderWerkwoord === "leest") verbForm = "lees";
      if (builderWerkwoord === "slaapt") verbForm = "slaap";
    }

    let sentence = "";
    let translation = "";

    if (builderVoegwoord === "want") {
      sentence = `Ik kan niet komen, want ${builderOnderwerp} ${verbForm} thuis.`;
      translation = `(Gelemem, çünkü ${builderOnderwerp === 'hij' ? 'o' : builderOnderwerp === 'wij' ? 'biz' : 'ben'} evde ${builderOnderwerp === 'wij' ? 'çalışıyoruz' : 'çalışıyor/çalışıyorum'} - Düz cümle sırası).`;
    } else {
      sentence = `Ik kan niet komen, ${builderVoegwoord} ${builderOnderwerp} thuis ${verbForm}.`;
      translation = `(Gelemem, çünkü ${builderOnderwerp === 'hij' ? 'o' : builderOnderwerp === 'wij' ? 'biz' : 'ben'} evde ${builderOnderwerp === 'wij' ? 'çalıştığımız için' : 'çalıştığı/çalıştığım için'} - Yan cümle sırası, fiil sonda!).`;
    }

    return { sentence, translation };
  }, [builderVoegwoord, builderOnderwerp, builderWerkwoord]);

  // Arama & Filtreleme State
  const [tableSearch, setTableSearch] = useState("");
  const filteredConjunctions = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();
    if (!query) return CONJUNCTION_DATABASE;
    return CONJUNCTION_DATABASE.filter(item =>
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

  const shouldShow = (lvl: string) => {
    if (activeLevel === "all") return true;
    if (lvl === "a1" && activeLevel === "a1") return true;
    if (lvl === "b1" && activeLevel === "b1") return true;
    if (lvl === "b2" && activeLevel === "b2") return true;
    return false;
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
          Bijzinnen & Woordvolgorde
        </h2>
        <p className="text-base text-[var(--text-muted)] max-w-2xl leading-relaxed">
          {langNL ? (
            "In een bijzin staat het werkwoord aan het einde. Dit is een van de bekendste struikelblokken voor leerders — maar de regel is eigenlijk heel simpel."
          ) : (
            "Bir yan cümlede fiil her zaman cümlenin en sonuna gider. Bu, Hollandaca öğrenenlerin en çok takıldığı yerlerden biridir; ancak kural oldukça basittir."
          )}
        </p>

        {/* Belangrijkste Regel Kartı */}
        <div className="mt-6 flex items-start gap-4 p-4 bg-[var(--surface)] border-2 border-dashed border-[var(--border)] rounded-2xl max-w-2xl">
          <div className="text-3xl p-3 bg-[var(--accent-soft)] text-[var(--accent)] rounded-xl flex-shrink-0">🔗</div>
          <div>
            <h4 className="font-extrabold text-lg text-[var(--text)]">
              {langNL ? "Belangrijkste regel" : "En Önemli Kural"}
            </h4>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {langNL ? (
                <>Een bijzin (subordinate clause) begint met een voegwoord (omdat, dat, als...). Alle werkwoorden verhuizen verplicht naar het einde.</>
              ) : (
                <>Bir yan cümle (bijzin) bağlaçla (omdat, dat, als...) başlar. Cümledeki tüm fiiller zorunlu olarak cümlenin en sonuna taşınır.</>
              )}
            </p>
          </div>
        </div>

        {/* Seviye Sekmeleri (Level Tabs) */}
        <div className="flex gap-2 overflow-x-auto pb-2 mt-6 max-w-lg custom-scrollbar">
          {[
            { key: "all", label: langNL ? "Alles tonen" : "Hepsini Göster" },
            { key: "a1", label: langNL ? "A1/A2 · Hoofdzin vs. Bijzin" : "A1/A2 · Ana Cümle vs. Yan Cümle" },
            { key: "b1", label: langNL ? "B1 · Modale Bijzin" : "B1 · Tarz Fiilli Yan Cümle" },
            { key: "b2", label: langNL ? "B2 · Inversie (Bijzin Voorop)" : "B2 · Ters Çevrim (Yan Cümle Başta)" }
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

        {/* LEVEL A1/A2: HOOFDZIN VS BIJZIN */}
        {shouldShow("a1") && (
          <motion.article 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm"
          >
            <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
              1 · Hoofdzin vs. Bijzin (A1/A2)
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-2">
              {langNL ? "Wat is het verschil?" : "Farkı Nedir?"}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              {langNL ? (
                <>Een <b>hoofdzin</b> (main clause) staat op zichzelf. Een <b>bijzin</b> (subordinate clause) begint met een voegwoord en kan niet alleen staan.</>
              ) : (
                <>Ana cümle (<b>hoofdzin</b>) tek başına anlam ifade eder. Yan cümle (<b>bijzin</b>) ise bir bağlaçla başlar ve tek başına eksik kalır.</>
              )}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: "omdat", tr: "çünkü", type: "sub" },
                { label: "dat", tr: "-diği / ki", type: "sub" },
                { label: "als", tr: "eğer / -ince", type: "sub" },
                { label: "toen", tr: "-diği zaman", type: "sub" },
                { label: "terwijl", tr: "-iken", type: "sub" },
                { label: "hoewel", tr: "-e rağmen", type: "sub" },
                { label: "want", tr: "zira / çünkü", type: "coor" }
              ].map((c, idx) => (
                <div key={idx} className="border-2 border-[var(--border)] rounded-xl p-3 bg-[var(--surface)] text-center flex flex-col justify-between">
                  <div>
                    <span className="text-2xl">💬</span>
                    <h4 className="text-base font-extrabold text-[var(--text)] mt-1">{c.label}</h4>
                    <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-1">{c.tr}</p>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      c.type === "sub" 
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]" 
                        : "bg-[var(--danger-soft)] text-[var(--danger)]"
                    }`}>
                      {c.type === "sub" 
                        ? "bijzin" 
                        : (langNL ? "normaal / 2" : "düz sıra")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.article>
        )}

        {/* WANT VS OMDAT CARD */}
        {shouldShow("a1") && (
          <motion.article 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm"
          >
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2 text-[var(--danger)]">
              <span>🚨</span> {langNL ? "Cruciaal Verschil: Omdat vs. Want" : "Çok Önemli Fark: Omdat vs. Want"}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              {langNL ? (
                "Beide betekenen 'çünkü' in het Turks, maar ze hebben een totaal andere grammatica!"
              ) : (
                "İkisi de Türkçe'de 'çünkü' anlamına gelir, ancak dil bilgisi kuralları tamamen farklıdır!"
              )}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)]/20">
                <span className="text-xs font-bold text-[var(--accent)] uppercase">
                  Omdat (Bijzinsvolgorde - Fiil sonda!)
                </span>
                <p className="font-serif italic text-sm mt-1">
                  &quot;Ik blijf thuis, <b>omdat</b> ik ziek <b>ben</b>.&quot;
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  (Fiil &apos;ben&apos; cümlenin en sonuna gitti.)
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)]/20">
                <span className="text-xs font-bold text-[var(--danger)] uppercase">
                  Want (Normale volgorde - Fiil yerinde!)
                </span>
                <p className="font-serif italic text-sm mt-1">
                  &quot;Ik blijf thuis, <b>want</b> ik <b>ben</b> ziek.&quot;
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  (Düz cümle sırası ve fiil konumu değişmedi.)
                </p>
              </div>
            </div>
          </motion.article>
        )}

        {/* INTERACTIVE WIDGET: Zinsbouwer */}
        <div className="bg-[var(--surface)] border-2 border-dashed border-[var(--border)] rounded-2xl p-4 shadow-sm">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
            <span>⚙️</span> Interactive Zinsbouwer (Cümle Kurucu)
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            {langNL ? (
              "Kendi cümleni tasarla! Bir voegwoord selecteren en de verandering in zinsbouw bekijken."
            ) : (
              "Kendi cümlenizi kurun! Bir bağlaç seçin ve kelimelerin nasıl sıralandığını canlı görün."
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1">1. Voegwoord (Bağlaç)</label>
              <select 
                value={builderVoegwoord}
                onChange={(e) => setBuilderVoegwoord(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)] text-[var(--text)] font-semibold"
              >
                <option value="omdat">omdat (bijzin - çünkü)</option>
                <option value="want">want (nevenschikkend - çünkü)</option>
                <option value="als">als (bijzin - eğer)</option>
                <option value="terwijl">terwijl (bijzin - iken)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1">2. Onderwerp (Özne)</label>
              <select 
                value={builderOnderwerp}
                onChange={(e) => setBuilderOnderwerp(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)] text-[var(--text)] font-semibold"
              >
                <option value="hij">hij (o)</option>
                <option value="wij">wij (biz)</option>
                <option value="ik">ik (ben)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1">3. Werkwoord (Fiil)</label>
              <select 
                value={builderWerkwoord}
                onChange={(e) => setBuilderWerkwoord(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)] text-[var(--text)] font-semibold"
              >
                <option value="werkt">werken (werkt / werken / werk)</option>
                <option value="leest">lezen (leest / lezen / lees)</option>
                <option value="slaapt">slapen (slaapt / slapen / slaap)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">
              Resultaat (Sonuç)
            </span>
            <div 
              className="font-serif text-base font-bold text-[var(--text)]"
              dangerouslySetInnerHTML={{ __html: buildResult.sentence }}
            />
            <p className="text-xs text-[var(--text-muted)] mt-1 italic">
              {buildResult.translation}
            </p>
          </div>
        </div>

        {/* Grid: A1/A2 Word Order & B1 Modals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEVEL A1/A2: Present Tense Structure */}
          {shouldShow("a1") && (
            <motion.article 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm lg:col-span-7 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
                  2 · Werkwoord naar het einde (A1/A2)
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-2">
                  {langNL ? "Hoe verschuift het werkwoord?" : "Fiil Sona Nasıl Gider?"}
                </h3>
                
                <div className="flex flex-wrap items-center justify-center gap-2 p-4 rounded-xl bg-[var(--surface-2)] border-2 border-[var(--border)] my-3">
                  <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 font-bold text-sm">... omdat</span>
                  <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 font-bold text-sm">hij</span>
                  <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 font-medium text-xs text-[var(--text-muted)]">vandaag</span>
                  <span className="text-lg text-[var(--warning)] font-black">→</span>
                  <span className="bg-[var(--warning)]/10 border-2 border-[var(--warning)]/30 text-[var(--warning)] rounded-lg px-3 py-1.5 font-bold text-sm">werkt</span>
                </div>
                
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  {langNL ? (
                    <>Türkçe mantık: <i>“... bugün çalıştığı için.”</i> Fiil &apos;werkt&apos; cümlenin en sonuna gider.</>
                  ) : (
                    <>Türkçe mantığı: <i>“... bugün çalıştığı için.”</i> Fiil &apos;werkt&apos; cümlenin en sonuna itilir.</>
                  )}
                </p>
                
                <div className="space-y-2">
                  {[
                    { nl: "Ik kan niet komen, omdat ik geen tijd heb.", tr: "Gelemem çünkü vaktim yok. (heb)" },
                    { nl: "Hij vraagt of je morgen ook komt.", tr: "Yarın senin de gelip gelmeyeceğini soruyor. (komt)" },
                    { nl: "Laat me weten wanneer je aankomt.", tr: "Ne zaman varacağını bana bildir. (aankomt - scheidbaar!)" },
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

          {/* LEVEL B1: Modale Bijzin */}
          {shouldShow("b1") && (
            <motion.article 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm lg:col-span-5 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
                  3 · Bijzin met Modaal (B1)
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-2">
                  {langNL ? "Twee werkwoorden? (Çift Fiil)" : "İki Fiil Varsa? (Çift Fiil)"}
                </h3>
                
                <div className="flex flex-wrap items-center justify-center gap-1.5 p-4 rounded-xl bg-[var(--accent-soft)] border-2 border-[var(--accent)] my-3">
                  <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 font-bold text-sm">... omdat</span>
                  <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 font-bold text-sm">ik</span>
                  <span className="text-sm font-black text-[var(--accent)]">→</span>
                  <span className="bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)] rounded-lg px-2.5 py-1.5 font-black text-sm">moet</span>
                  <span className="bg-[var(--warning)]/10 border-2 border-[var(--warning)]/30 text-[var(--warning)] rounded-lg px-2.5 py-1.5 font-bold text-sm">werken</span>
                </div>
                
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  {langNL ? (
                    <>Als er ook een hulpwerkwoord is, gaan beide naar het einde (meestal: hulpwerkwoord + infinitief).</>
                  ) : (
                    <>Cümlede yardımcı fiil (moeten, kunnen vb.) ve mastar varsa, ikisi birden sona gider (genellikle: yardımcı fiil + mastar).</>
                  )}
                </p>
                
                <div className="space-y-2">
                  {[
                    { nl: "... omdat ik vandaag moet werken.", tr: "... çünkü bugün çalışmak zorundayım." },
                    { nl: "... dat zij heel goed kan zingen.", tr: "... onun çok iyi şarkı söyleyebildiğini." },
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

        {/* Grid: B2 Inversie & B2 Diğer Bağlaçlar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEVEL B2: Inversie (Bijzin Voorop) */}
          {shouldShow("b2") && (
            <motion.article 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm lg:col-span-7 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
                  4 · Bijzin voorop (B2)
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-2">
                  {langNL ? "Inversie in de hoofdzin" : "Ana Cümlede Devrik Yapı (Inversie)"}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  {langNL ? (
                    <>Als de bijzin op de eerste plaats staat, begint de hoofdzin direct met de persoonsvorm (V + S).</>
                  ) : (
                    <>Eğer yan cümle ana cümleden önce gelirse, ana cümle fiille (devrik olarak) başlar (Fiil + Özne).</>
                  )}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--accent-soft)]/20 border border-[var(--accent)]">
                    <strong className="text-base text-[var(--text)] block mb-1">1. Bijzin (Eğer...)</strong>
                    <div className="h-1.5 bg-[var(--accent-soft)]0 rounded-full my-2" />
                    <p className="font-bold text-sm text-[var(--accent)]">Als ik tijd heb,</p>
                    <span className="text-[10px] text-[var(--text-muted)]">(Bijzin staat eerst / Yan cümle başta)</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--success-soft)]/20 border border-[var(--success)]">
                    <strong className="text-base text-[var(--text)] block mb-1">2. Hoofdzin (Inversie!)</strong>
                    <div className="h-1.5 bg-[var(--success-soft)]0 rounded-full my-2" />
                    <p className="font-bold text-sm text-[var(--success)]">help ik je.</p>
                    <span className="text-[10px] text-[var(--text-muted)]">(Niet: ik help je / Devrik yapı)</span>
                  </div>
                </div>
              </div>
            </motion.article>
          )}

          {/* LEVEL B2: Complexe structuren */}
          {shouldShow("b2") && (
            <motion.article 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm lg:col-span-5 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
                  5 · Andere voegwoorden (B2)
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-2">
                  Hoewel & Zodat
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  {langNL ? (
                    <>Ook geavanceerde voegwoorden volgen de bijzinsregel (werkwoord helemaal aan het einde).</>
                  ) : (
                    <>Daha ileri düzeydeki bu bağlaçlar da aynı sona atma kuralına tabidir:</>
                  )}
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-1.5 p-4 rounded-xl bg-[var(--accent-soft)] border-2 border-[var(--accent)] my-3">
                  <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 font-bold text-sm">Hoewel</span>
                  <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 font-bold text-sm">het</span>
                  <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 font-medium text-xs text-[var(--text-muted)]">koud</span>
                  <span className="text-sm font-black text-[var(--accent)]">→</span>
                  <span className="bg-[var(--warning)]/10 border-2 border-[var(--warning)]/30 text-[var(--warning)] rounded-lg px-2.5 py-1.5 font-bold text-sm">is</span>
                </div>

                <div className="border-l-4 border-[var(--accent)] bg-[var(--accent-soft)] rounded-r-xl p-3">
                  <b className="text-sm block text-[var(--text)]">Hoewel het koud is, ga ik wandelen.</b>
                  <span className="text-xs text-[var(--text-muted)]">Hava soğuk olmasına rağmen yürüyüşe çıkıyorum.</span>
                </div>
              </div>
            </motion.article>
          )}
        </div>

        {/* NEVENSCHIKKEND PANEL */}
        {shouldShow("a1") && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="bg-[var(--primary)] text-white rounded-3xl p-4 relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 text-8xl font-black opacity-[0.03] select-none pointer-events-none">
              voegwoord
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-2 flex items-center gap-2 text-white">
              💡 {langNL ? "Let op met nevenschikkende voegwoorden" : "Sıralayıcı Bağlaçlara (Nevenschikkend) Dikkat"}
            </h3>
            <p className="text-sm text-white/80 leading-relaxed max-w-3xl">
              {langNL ? (
                <>Er zijn een paar voegwoorden die <b>geen</b> invloed hebben op de woordvolgorde. Dit zijn: <b>want, en, maar, of</b>. Hier blijft de normale volgorde gelden!</>
              ) : (
                <>Söz dizimini (kelime sırasını) **değiştirmeyen** birkaç bağlaç vardır. Bunlar: <b>want, en, maar, of</b> bağlaçlarıdır. Bunlardan sonra normal cümle sırası korunur.</>
              )}
            </p>
            <div className="inline-block bg-[var(--surface)] text-[var(--text)] font-extrabold text-sm px-4 py-2 rounded-full mt-4 shadow-sm">
              {langNL ? "Want is de belangrijkste uitzondering! (Çünkü)" : "Want en önemli istisnadır! (Çünkü)"}
            </div>
          </motion.div>
        )}

        {/* DYNAMIC INTERACTIVE TABLE */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl md:text-2xl font-black">
                {langNL ? "Interactieve Tabel (Voegwoorden)" : "Etkileşimli Tablo (Bağlaçlar)"}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {langNL ? "Filtreer en zoek naar voegwoorden en hun effect op de zinsbouw." : "Bağlaçlar ve bunların kelime sırasına etkilerini arayın."}
              </p>
            </div>
            <input 
              type="text" 
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder={langNL ? "Zoek een voegwoord..." : "Bağlaç ara..."} 
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text)] max-w-xs"
            />
          </div>

          <div className="overflow-x-auto custom-scrollbar border border-[var(--border)] rounded-xl bg-[var(--surface)]">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-[var(--primary)] text-white">
                  <th className="p-3 font-bold">Voegwoord</th>
                  <th className="p-3 font-bold">{langNL ? "Betekenis" : "Anlamı (TR)"}</th>
                  <th className="p-3 font-bold">Zinsvolgorde</th>
                  <th className="p-3 font-bold">Type</th>
                  <th className="p-3 font-bold">Voorbeeld</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee5d7]">
                {filteredConjunctions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center italic text-[var(--text-muted)]">
                      {langNL ? "Geen voegwoorden gevonden." : "Bağlaç bulunamadı."}
                    </td>
                  </tr>
                ) : (
                  filteredConjunctions.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-[var(--warning)]/10" : ""}>
                      <td className="p-3 font-extrabold text-[var(--text)]">{item.infinitive}</td>
                      <td className="p-3 text-[var(--text-muted)] text-xs">
                        {langNL ? item.translationEn : item.translation}
                      </td>
                      <td className="p-3 font-mono text-xs text-[var(--warning)]">{item.stem}</td>
                      <td className="p-3 font-semibold text-xs text-[var(--success)]">{item.perfectum}</td>
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
                      className={`w-full text-left p-3.5 rounded-xl text-sm transition-all focus:outline-none flex justify-between items-center text-[var(--text)] border-2 cursor-pointer ${borderCls}`}
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
        Bijzinnen & Woordvolgorde · Interactieve webles · Nederlands + korte Turkse uitleg
      </div>
    </div>
  );
}
