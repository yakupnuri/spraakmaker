"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModaleWerkwoordenPanelProps {
  accentColor: string;
}

export default function ModaleWerkwoordenPanel({ accentColor }: ModaleWerkwoordenPanelProps) {
  const [langNL, setLangNL] = useState(true);
  
  // Alıştırma state'leri
  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
  });
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState({
    q1: false,
    q2: false,
    q3: false,
    q4: false,
  });

  const correctAnswers = {
    q1: "moet",
    q2: "zitten",
    q3: "konden",
    q4: "hoeft",
  };

  const handleCheck = () => {
    const res = {
      q1: answers.q1.trim().toLowerCase() === correctAnswers.q1,
      q2: answers.q2.trim().toLowerCase() === correctAnswers.q2,
      q3: answers.q3.trim().toLowerCase() === correctAnswers.q3,
      q4: answers.q4.trim().toLowerCase() === correctAnswers.q4,
    };
    setResults(res);
    setChecked(true);
  };

  const handleReset = () => {
    setAnswers({ q1: "", q2: "", q3: "", q4: "" });
    setChecked(false);
  };

  return (
    <div className="bg-[var(--surface)] text-[var(--text)] select-none">
      {/* Hero Header */}
      <div
        className="relative overflow-hidden p-4 md:p-8"
        style={{
          background: "var(--surface)",
          borderBottom: "2px dashed #eadfcd",
        }}
      >
        <div className="absolute -right-6 -top-6 w-48 h-48 rounded-full bg-[var(--accent-soft)]0/10 pointer-events-none" 
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
          Modale werkwoorden
        </h2>
        <p className="text-base text-[var(--text-muted)] max-w-2xl leading-relaxed">
          {langNL ? (
            "Modale werkwoorden vertellen wat iemand kan, mag, moet, wil of zal doen. Ze geven dus extra betekenis aan het gewone werkwoord."
          ) : (
            "Modal fiiller (tarz fiiller) birinin ne yapabileceğini, neye izni olduğunu, neyi yapmak zorunda olduğunu, neyi istediğini veya yapacağını belirtir. Yani esas fiile ekstra bir anlam katarlar."
          )}
        </p>

        {/* Belangrijkste regel kartı */}
        <div className="mt-6 flex items-start gap-4 p-4 bg-[var(--surface)] border-2 border-dashed border-[var(--border)] rounded-2xl max-w-2xl">
          <div className="text-3xl p-3 bg-[var(--accent-soft)] text-[var(--accent)] rounded-xl flex-shrink-0">🧲</div>
          <div>
            <h4 className="font-extrabold text-lg text-[var(--text)]">
              {langNL ? "Belangrijkste regel" : "En Önemli Kural"}
            </h4>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {langNL ? (
                <>Het modale werkwoord staat op <b>plaats 2</b>. Het tweede werkwoord (de infinitief) gaat naar het <b>einde van de zin</b>.</>
              ) : (
                <>Modal fiil cümlede <b>2. sırada</b> yer alır. İkinci fiil (mastar/infinitief) ise cümlenin <b>en sonuna</b> gider.</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-4 space-y-6">
        {/* Step 1: De 6 modale werkwoorden */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
          <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
            1 · De 6 modale werkwoorden
          </div>
          <h3 className="text-xl md:text-2xl font-black mb-4">
            {langNL ? "Wat betekenen ze?" : "Anlamları nelerdir?"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { emoji: "💪", nl: "kunnen", desc: langNL ? "mogelijkheid / vermogen" : "olasılık / yetenek", tr: "yapabilmek" },
              { emoji: "✅", nl: "mogen", desc: langNL ? "toestemming / mogelijkheid" : "izin / olasılık (-ebilmek)", tr: "izin / -ebilmek" },
              { emoji: "⚠️", nl: "moeten", desc: langNL ? "verplichting / noodzaak" : "zorunluluk / gereklilik", tr: "zorunda olmak" },
              { emoji: "🎯", nl: "willen", desc: langNL ? "wens / intentie" : "istek / niyet", tr: "istemek" },
              { emoji: "🔮", nl: "zullen", desc: langNL ? "toekomst / belofte" : "gelecek zaman / söz", tr: "gelecek / vaat" },
              { emoji: "🧘", nl: "hoeven", desc: langNL ? "niet nodig zijn" : "gerekli olmamak", tr: "gerekmemek" },
            ].map((m, idx) => (
              <div key={idx} className="border-2 border-[var(--border)] rounded-xl p-4 bg-[var(--surface)] hover:shadow-md transition-shadow relative min-h-[120px] flex flex-col justify-between">
                <div>
                  <div className="text-3xl mb-2">{m.emoji}</div>
                  <h4 className="text-lg font-bold text-[var(--text)]">{m.nl}</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{m.desc}</p>
                </div>
                <div className="mt-3">
                  <span className="inline-block text-xs font-bold px-2 py-1 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full">
                    {m.tr}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid 2: Tegenwoordige Tijd & Zinsbouw */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tegenwoordige tijd */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm lg:col-span-7">
            <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
              2 · Tegenwoordige tijd
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-4">
              {langNL ? "Vervoeging" : "Çekimler (Şimdiki Zaman)"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { inf: "kunnen", ik: "kan", jij: "kunt / kan", hij: "kan", wij: "kunnen" },
                { inf: "mogen", ik: "mag", jij: "mag", hij: "mag", wij: "mogen" },
                { inf: "moeten", ik: "moet", jij: "moet", hij: "moet", wij: "moeten" },
                { inf: "willen", ik: "wil", jij: "wilt / wil", hij: "wil", wij: "willen" },
                { inf: "zullen", ik: "zal", jij: "zult / zal", hij: "zal", wij: "zullen" },
                { inf: "hoeven", ik: "hoef", jij: "hoeft", hij: "hoeft", wij: "hoeven" },
              ].map((row, i) => (
                <div key={i} className="border border-[var(--border)] rounded-2xl p-4 bg-[var(--surface)] shadow-sm hover:shadow-md transition-all">
                  <h4 className="text-lg font-black text-[var(--accent)] mb-3">{row.inf}</h4>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] block">ik</span>
                      <span className="font-extrabold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-md text-sm inline-block">{row.ik}</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] block">jij / u</span>
                      <span className="font-bold text-[var(--text)]">{row.jij}</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] block">hij / zij</span>
                      <span className="font-bold text-[var(--text)]">{row.hij}</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] block">wij / jul / zij</span>
                      <span className="font-bold text-[var(--success)]">{row.wij}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-[var(--warning)]/10 border border-[var(--warning)]/30 text-[var(--warning)] rounded-xl text-xs">
              💡 <b>{langNL ? "Let op:" : "Dikkat:"}</b> {langNL ? "Geen extra -t bij 'ik' en 'hij/zij' (ik kan, hij kan, ik wil, hij wil)." : "ik ve hij/zij için fiil çekimine ekstra -t eklenmez (ik kan, hij kan, ik wil, hij wil)."}
            </div>
          </div>

          {/* Zinsbouw */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
                3 · Zinsbouw
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-4">
                {langNL ? "Infinitief naar het einde" : "Mastar Cümlenin Sonuna"}
              </h3>
              
              {/* Zinsbouw formülü */}
              <div className="flex flex-wrap items-center justify-center gap-2 p-4 rounded-xl bg-[var(--surface-2)] border-2 border-[var(--border)] my-3">
                <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 font-bold text-sm">Ik</span>
                <span className="bg-[var(--surface)] border border-[var(--accent)] text-[var(--accent)] rounded-lg px-3 py-1.5 font-bold text-sm">moet</span>
                <span className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 font-medium text-xs text-[var(--text-muted)]">vandaag</span>
                <span className="text-lg text-[var(--warning)] font-black">→</span>
                <span className="bg-[var(--warning)]/10 border-2 border-[var(--warning)]/30 text-[var(--warning)] rounded-lg px-3 py-1.5 font-bold text-sm">werken</span>
              </div>

              <p className="text-xs text-[var(--text-muted)] mb-4">
                {langNL ? (
                  <>Türkçe mantık: <i>“Ben bugün çalışmak zorundayım.”</i> In het Nederlands gaat het tweede werkwoord (werken) naar het einde.</>
                ) : (
                  <>Türkçe mantığı: <i>“Ben bugün çalışmak zorundayım.”</i> Hollandacada ikinci fiil (mastar haliyle) cümlenin en sonuna gider.</>
                )}
              </p>

              <div className="space-y-2">
                {[
                  { nl: "Ik kan goed koken.", tr: "Ben iyi yemek yapabilirim." },
                  { nl: "Jij mag hier zitten.", tr: "Sen burada oturabilirsin (izin var)." },
                  { nl: "Wij moeten vroeg vertrekken.", tr: "Biz erken ayrılmak zorundayız." },
                ].map((ex, i) => (
                  <div key={i} className="border-l-4 border-[var(--accent)] bg-[var(--accent-soft)] rounded-r-xl p-3">
                    <b className="text-sm block text-[var(--text)]">{ex.nl}</b>
                    <span className="text-xs text-[var(--text-muted)]">{ex.tr}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grid 3: Imperfectum & Mini-tijdlijn */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Imperfectum */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm lg:col-span-7">
            <div className="inline-flex items-center gap-2 font-black text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
              4 · Imperfectum
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-4">
              {langNL ? "Verleden tijd" : "Geçmiş Zaman"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { inf: "kunnen", nu: "kan", vroeger: "kon", ex: "Ik kon niet slapen." },
                { inf: "moeten", nu: "moet", vroeger: "moest", ex: "Ik moest werken." },
                { inf: "willen", nu: "wil", vroeger: "wilde", ex: "Ik wilde naar huis." },
                { inf: "mogen", nu: "mag", vroeger: "mocht", ex: "Ik mocht gaan." },
                { inf: "zullen", nu: "zal", vroeger: "zou", ex: "Ik zou bellen." },
                { inf: "hoeven", nu: "hoef", vroeger: "hoefde", ex: "Ik hoefde niet te komen." },
              ].map((row, i) => (
                <div key={i} className="border border-[var(--border)] rounded-2xl p-4 bg-[var(--surface)] shadow-sm hover:shadow-md transition-all">
                  <h4 className="text-lg font-black text-[var(--accent)] mb-3">{row.inf}</h4>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm mb-3">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] block">ik nu</span>
                      <span className="font-semibold text-[var(--text-muted)]">{row.nu}</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] block">ik vroeger</span>
                      <span className="font-extrabold text-[var(--danger)] bg-[var(--danger-soft)] px-2 py-0.5 rounded-md text-sm inline-block">{row.vroeger}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[var(--border)]">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">Voorbeeld</span>
                    <span className="text-xs font-medium text-[var(--text)] italic">"{row.ex}"</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini tijdlijn */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm lg:col-span-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-black mb-3">
                {langNL ? "Mini tijdlijn" : "Zaman Tüneli"}
              </h3>
              <div className="space-y-4 my-2">
                <div className="p-4 rounded-xl bg-[var(--warning)]/10 border-2 border-[var(--border)]">
                  <strong className="text-lg text-[var(--text)] block">Nu (Şimdi)</strong>
                  <div className="h-2 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full my-2 relative">
                    <div className="absolute -top-1.5 left-0 w-5 h-5 rounded-full bg-[var(--surface)] border-4 border-[var(--success)]" />
                  </div>
                  <p className="text-sm font-semibold mt-1">Ik moet vandaag werken.</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--warning)]/10 border-2 border-[var(--border)]">
                  <strong className="text-lg text-[var(--text)] block">Vroeger (Geçmiş)</strong>
                  <div className="h-2 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full my-2 relative">
                    <div className="absolute -top-1.5 right-0 w-5 h-5 rounded-full bg-[var(--surface)] border-4 border-[var(--warning)]" />
                  </div>
                  <p className="text-sm font-semibold mt-1">Ik moest gisteren werken.</p>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                {langNL ? (
                  <>Kort gezegd: <b>nu = moet</b>, <b>vroeger = moest</b>. Dit patroon werkt voor alle modale werkwoorden.</>
                ) : (
                  <>Kısacası: <b>nu = moet</b>, <b>vroeger = moest</b>. Bu kural diğer tarz fiillerde de aynı şekilde çalışır.</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Hoeven is speciaal uyarı paneli */}
        <div className="bg-[var(--primary)] text-white rounded-3xl p-4 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-8xl font-black opacity-[0.03] select-none pointer-events-none">
            hoeven
          </div>
          <h3 className="text-xl md:text-2xl font-black mb-2 flex items-center gap-2 text-white">
            💡 {langNL ? "Hoeven is speciaal" : "Hoeven Özel Bir Fiildir"}
          </h3>
          <p className="text-sm text-white/80 leading-relaxed max-w-3xl">
            {langNL ? (
              <><b>Hoeven</b> wordt bijna altijd gecombineerd met <b>niet</b> of <b>geen</b>. Het geeft aan dat iets <i>niet verplicht of nodig</i> is, in tegenstelling tot <b>moeten</b> dat verplichting uitdrukt.</>
            ) : (
              <><b>Hoeven</b> neredeyse her zaman <b>niet</b> veya <b>geen</b> olumsuzluk kelimeleriyle birlikte kullanılır. Bir şeyin <i>gerekli olmadığını/zorunlu olmadığını</i> belirtir. (Yasak değildir, sadece yapılmasına gerek yoktur).</>
            )}
          </p>
          <div className="inline-block bg-[var(--surface)] text-[var(--text)] font-extrabold text-sm px-4 py-2 rounded-full mt-4 shadow-sm">
            Je hoeft niet ≠ Je mag niet
          </div>
        </div>

        {/* Vergelijking & Kleine oefening */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Karşılaştırmalı örnekler */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
            <h3 className="text-xl font-black mb-3">
              {langNL ? "Vergelijk goed" : "Karşılaştırmayı İnceleyin"}
            </h3>
            <div className="space-y-3">
              {[
                { nl: "Je hoeft dat niet te doen.", tr: "Bunu yapman gerekmiyor. (Zorunda değilsin, istersen yapabilirsin.)", border: "border-[var(--accent)]", bg: "bg-[var(--accent-soft)]" },
                { nl: "Je mag dat niet doen.", tr: "Bunu yapamazsın. (İzin yok, yasak.)", border: "border-[var(--success)]", bg: "bg-[var(--success-soft)]" },
                { nl: "Je moet dat niet doen.", tr: "Bunu yapmamalısın. (Daha çok bir uyarı veya tavsiye niteliğindedir.)", border: "border-[var(--warning)]", bg: "bg-[var(--warning-soft)]" },
              ].map((ex, i) => (
                <div key={i} className={`border-l-4 ${ex.border} ${ex.bg} rounded-r-xl p-3.5`}>
                  <b className="text-base block text-[var(--text)] mb-0.5">{ex.nl}</b>
                  <span className="text-xs text-[var(--text-muted)] leading-relaxed">{ex.tr}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alıştırma (Practice) */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-black mb-3">
                {langNL ? "Kleine oefening" : "Küçük Alıştırma"}
              </h3>
              
              <div className="space-y-4 my-2">
                {/* Q1 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-7 h-7 bg-[var(--warning)]/10 text-[var(--warning)] font-extrabold flex items-center justify-center rounded-lg text-sm">1</span>
                  <span className="text-sm">Ik</span>
                  <input
                    type="text"
                    disabled={checked}
                    value={answers.q1}
                    onChange={(e) => setAnswers({ ...answers, q1: e.target.value })}
                    className={`w-20 px-2 py-1 text-sm border-b-2 text-center bg-transparent focus:outline-none ${
                      checked
                        ? results.q1
                          ? "border-[var(--success)] text-[var(--success)] font-bold"
                          : "border-[var(--danger)] text-[var(--danger)] font-bold"
                        : "border-[var(--border)] focus:border-[var(--accent)]"
                    }`}
                    placeholder="......"
                  />
                  <span className="text-sm">morgen vroeg opstaan.</span>
                  <span className="text-xs text-[var(--text-muted)] font-medium">(zorundayım)</span>
                </div>

                {/* Q2 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-7 h-7 bg-[var(--warning)]/10 text-[var(--warning)] font-extrabold flex items-center justify-center rounded-lg text-sm">2</span>
                  <span className="text-sm">Mag ik hier</span>
                  <input
                    type="text"
                    disabled={checked}
                    value={answers.q2}
                    onChange={(e) => setAnswers({ ...answers, q2: e.target.value })}
                    className={`w-24 px-2 py-1 text-sm border-b-2 text-center bg-transparent focus:outline-none ${
                      checked
                        ? results.q2
                          ? "border-[var(--success)] text-[var(--success)] font-bold"
                          : "border-[var(--danger)] text-[var(--danger)] font-bold"
                        : "border-[var(--border)] focus:border-[var(--accent)]"
                    }`}
                    placeholder="......"
                  />
                  <span className="text-sm">?</span>
                  <span className="text-xs text-[var(--text-muted)] font-medium">(oturmak)</span>
                </div>

                {/* Q3 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-7 h-7 bg-[var(--warning)]/10 text-[var(--warning)] font-extrabold flex items-center justify-center rounded-lg text-sm">3</span>
                  <span className="text-sm">Wij</span>
                  <input
                    type="text"
                    disabled={checked}
                    value={answers.q3}
                    onChange={(e) => setAnswers({ ...answers, q3: e.target.value })}
                    className={`w-24 px-2 py-1 text-sm border-b-2 text-center bg-transparent focus:outline-none ${
                      checked
                        ? results.q3
                          ? "border-[var(--success)] text-[var(--success)] font-bold"
                          : "border-[var(--danger)] text-[var(--danger)] font-bold"
                        : "border-[var(--border)] focus:border-[var(--accent)]"
                    }`}
                    placeholder="......"
                  />
                  <span className="text-sm">gisteren niet komen.</span>
                  <span className="text-xs text-[var(--text-muted)] font-medium">(gelemedik)</span>
                </div>

                {/* Q4 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-7 h-7 bg-[var(--warning)]/10 text-[var(--warning)] font-extrabold flex items-center justify-center rounded-lg text-sm">4</span>
                  <span className="text-sm">Je</span>
                  <input
                    type="text"
                    disabled={checked}
                    value={answers.q4}
                    onChange={(e) => setAnswers({ ...answers, q4: e.target.value })}
                    className={`w-20 px-2 py-1 text-sm border-b-2 text-center bg-transparent focus:outline-none ${
                      checked
                        ? results.q4
                          ? "border-[var(--success)] text-[var(--success)] font-bold"
                          : "border-[var(--danger)] text-[var(--danger)] font-bold"
                        : "border-[var(--border)] focus:border-[var(--accent)]"
                    }`}
                    placeholder="......"
                  />
                  <span className="text-sm">geen geld mee te nemen.</span>
                  <span className="text-xs text-[var(--text-muted)] font-medium">(gerek yok)</span>
                </div>
              </div>

              {/* Kontrol / Tekrar dene butonları */}
              <div className="mt-6 flex gap-2">
                {!checked ? (
                  <button
                    onClick={handleCheck}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-bold text-sm hover:bg-[var(--primary)] transition-colors border-none cursor-pointer"
                  >
                    {langNL ? "Controleer antwoorden" : "Cevapları Kontrol Et"}
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-bold text-sm hover:opacity-90 transition-colors border-none cursor-pointer"
                  >
                    🔄 {langNL ? "Probeer opnieuw" : "Tekrar Dene"}
                  </button>
                )}
              </div>
            </div>

            {/* Accordion / Answers display */}
            <div className="mt-4 border border-[var(--border)] rounded-xl overflow-hidden">
              <details className="group">
                <summary className="flex justify-between items-center p-3 font-bold text-sm bg-[var(--accent-soft)] cursor-pointer select-none">
                  <span>{langNL ? "Antwoorden bekijken" : "Cevapları Gör"}</span>
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="p-3 bg-[var(--surface)] text-xs space-y-1 text-[var(--text-muted)] border-t border-[var(--border)]">
                  <div><b>1. moet</b> (zorundayım - ik moet)</div>
                  <div><b>2. zitten</b> (oturmak - mastar)</div>
                  <div><b>3. konden</b> (gelemedik - geçmiş zaman çoğul / wij konden)</div>
                  <div><b>4. hoeft</b> (gerek yok - je hoeft niet)</div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)] text-center text-xs text-[var(--text-muted)]">
        Modale werkwoorden · A2 webles · Nederlands + korte Turkse uitleg
      </div>
    </div>
  );
}
