"use client";

import { useProgress } from "@/lib/hooks";

interface GameHistoryItem {
  sentence: string;
  translation: string;
  correct: boolean;
  timestamp: string;
  userAnswer?: string;
  explanation?: string;
}

export default function VoortgangPage() {
  const { progress } = useProgress();

  const flashcardTotal = Object.keys(progress.flashcard).length;
  const verbTotal = Object.keys(progress.verbs).length;
  const lessonDone = Object.values(progress.lessons).filter((l) => l.completed).length;
  const streak = progress.games.streak ?? 0;
  const highScores = progress.games.highScores;

  // Son 7 gün mini dot göstergesi
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const active = !!progress.games.lastPlayDate?.startsWith(key);
    const dayLabel = ["Z", "M", "D", "W", "D", "V", "Z"][d.getDay()];
    return { label: dayLabel, active };
  });

  // LocalStorage üzerinden oyun istatistiklerini alalım
  const stats = progress.games.stats || {
    zinBouwen: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
    zinMotor: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
    vertaal: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
    snelronde: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
    vulIn: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
  };

  // Oyun bazlı başarı hesaplamaları
  const getSuccessRate = (correct: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  const zinBouwenRate = getSuccessRate(stats.zinBouwen?.correctCount || 0, stats.zinBouwen?.playCount || 0);
  const zinMotorRate = getSuccessRate(stats.zinMotor?.correctCount || 0, stats.zinMotor?.playCount || 0);

  // Tüm oyunlar genel toplamı
  const totalCorrect = (stats.zinBouwen?.correctCount || 0) + (stats.zinMotor?.correctCount || 0);
  const totalPlay = (stats.zinBouwen?.playCount || 0) + (stats.zinMotor?.playCount || 0);
  const generalSuccessRate = getSuccessRate(totalCorrect, totalPlay);

  // En son hatalı yapılan cümleleri tüm oyun geçmişlerinden toplayalım
  const allHistory: Array<GameHistoryItem & { gameLabel: string }> = [];
  if (stats.zinBouwen?.history) {
    allHistory.push(...stats.zinBouwen.history.map(h => ({ ...h, gameLabel: "Zin Bouwen" })));
  }
  if (stats.zinMotor?.history) {
    allHistory.push(...stats.zinMotor.history.map(h => ({ ...h, gameLabel: "Zin Motor" })));
  }

  // Tarihe göre en yeni hataları sıralayıp ilk 5 tanesini alalım
  const recentErrors = allHistory
    .filter(h => !h.correct)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Başarı oranına göre pedagojik tavsiye üretelim
  const getPedagogicalAdvice = () => {
    if (totalPlay === 0) {
      return "Er zijn nog geen spellen gespeeld. Speel 'Zin Motor' of 'Zin Bouwen' om je voortgangsrapport en persoonlijk advies te bekijken!";
    }
    if (generalSuccessRate >= 85) {
      return "Je bent geweldig bezig! Je zinsbouw is erg sterk. Om jezelf meer uit te dagen, kun je naar de Quiz-module op de 'Werkwoorden'-pagina gaan of moeilijke zinnen met voorzetsels en scheidbare werkwoorden blijven oefenen.";
    }
    if (generalSuccessRate >= 50) {
      return "Je bent op de goede weg. Soms loop je echter vast op de woordvolgorde of de vervoeging van het werkwoord. Bekijk de feedback in de foutenanalyse en let extra op het gebruik van voorzetsels.";
    }
    return "Het is nuttig om de basis te versterken. Neem de grammaticaregels door onder 'Werkwoorden > Grammatica' voordat je begint te spelen, en draai de wielen aandachtig zonder te haasten.";
  };

  const adviceText = getPedagogicalAdvice();

  // Modül ilerleme barları
  const modules = [
    { label: "Kaarten", color: "var(--ds-blue)", current: flashcardTotal, max: 1000 },
    { label: "Spel", color: "var(--ds-red)", current: highScores.zinBouwen + highScores.vulIn + highScores.vertaal + (highScores.zinMotor || 0), max: 500 },
    { label: "Lessen", color: "var(--ds-yellow)", current: lessonDone, max: 111 },
    { label: "Werkwoorden", color: "var(--ds-blue)", current: verbTotal, max: 676 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header — bg-ds-black */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex justify-between items-center">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">analiz & voortgang</span>
        <span className="text-xs font-black uppercase tracking-widest text-[var(--ds-yellow)]">DASHBOARD</span>
      </div>

      <div className="p-[3px] bg-[var(--ds-black)] flex-1 flex flex-col gap-[3px]">
        
        {/* Streak & Genel Başarı Oranı (Asimetrik Mondrian) */}
        <div className="grid grid-cols-3 gap-[3px]">
          {/* Streak - Sarı */}
          <div className="bg-[var(--ds-yellow)] p-5 col-span-1 flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-black)] opacity-60">STREAK</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-black leading-none">{streak}</span>
              <span className="text-xs font-bold opacity-75">dagen</span>
            </div>
          </div>

          {/* Genel Başarı Oranı - Mavi */}
          <div className="bg-[var(--ds-blue)] p-5 col-span-2 flex flex-col justify-between text-[var(--ds-white)]">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-white)] opacity-70">GENEL BAŞARI</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-4xl font-black leading-none">{generalSuccessRate}%</span>
              <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">
                {totalCorrect} Goed / {totalPlay} Totaal
              </span>
            </div>
            {/* Küçük De Stijl bar */}
            <div className="w-full h-2 bg-blue-900 mt-2">
              <div className="h-full bg-[var(--ds-yellow)]" style={{ width: `${generalSuccessRate}%` }} />
            </div>
          </div>
        </div>

        {/* Oyun Detay İstatistikleri (Zin Bouwen & Zin Motor) */}
        <div className="grid grid-cols-2 gap-[3px]">
          {/* Zin Bouwen Stats - Kırmızı */}
          <div className="bg-[var(--ds-red)] p-5 text-[var(--ds-white)] flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--ds-white)] opacity-70">ZIN BOUWEN</span>
              <p className="text-3xl font-black mt-2">{zinBouwenRate}%</p>
              <p className="text-[10px] opacity-75 mt-0.5">Zinsbouw succes</p>
            </div>
            <div className="mt-3 text-[10px] border-t border-red-500 pt-2 flex justify-between opacity-80 font-bold">
              <span>Gespeeld: {stats.zinBouwen?.playCount || 0}</span>
              <span>Goed: {stats.zinBouwen?.correctCount || 0}</span>
            </div>
          </div>

          {/* Zin Motor Stats - Beyaz & Kalın Çerçeve */}
          <div className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] p-5 text-[var(--ds-black)] flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--ds-black)] opacity-60">ZIN MOTOR</span>
              <p className="text-3xl font-black mt-2 text-[var(--ds-black)]">{zinMotorRate}%</p>
              <p className="text-[10px] opacity-70 mt-0.5">Zinmotor succes</p>
            </div>
            <div className="mt-3 text-[10px] border-t border-[var(--ds-gray)] pt-2 flex justify-between opacity-80 font-bold">
              <span>Gespeeld: {stats.zinMotor?.playCount || 0}</span>
              <span>Goed: {stats.zinMotor?.correctCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Pedagojik Gelişim Tavsiyesi - Sarı */}
        <div className="bg-[var(--ds-yellow)] p-5 text-[var(--ds-black)] flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-black)] opacity-60">
            PERSOONLIJK ONTWIKKELINGSADVIES
          </span>
          <p className="text-xs md:text-sm font-bold leading-relaxed">
            "{adviceText}"
          </p>
        </div>

        {/* Akıllı Hata Analizi Paneli (Wrong Sentence Explanations) - Beyaz */}
        <div className="bg-[var(--ds-white)] p-5 flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-black)] opacity-60 mb-4">
            SLIMME FOUTENANALYSE (OORZAAK VAN DE LAATSTE 5 FOUTEN)
          </span>
          {recentErrors.length === 0 ? (
            <p className="text-xs text-[var(--ds-black)] opacity-40 italic py-4 text-center border-t border-[var(--ds-gray)]">
              Uitstekend! Er zijn recent geen fouten geregistreerd.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {recentErrors.map((error, idx) => (
                <div key={idx} className="flex flex-col border-b border-[var(--ds-gray)] pb-3 last:border-b-0 last:pb-0 gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-[var(--ds-red)] text-[var(--ds-white)]">
                      {error.gameLabel}
                    </span>
                    <span className="text-[9px] text-[var(--ds-black)] opacity-40">
                      {new Date(error.timestamp).toLocaleDateString("nl-NL")}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-[var(--ds-red)]">
                      Foutieve zinsopbouw: "{error.userAnswer || error.sentence}"
                    </p>
                    <p className="text-[10px] text-[var(--ds-black)] opacity-60 italic mt-0.5">
                      Correcte versie: "{error.sentence}" ({error.translation})
                    </p>
                  </div>
                  {/* Hata İzahı */}
                  <div className="bg-red-50/50 border-l-[3px] border-[var(--ds-red)] p-2">
                    <span className="text-[9px] font-black text-[var(--ds-red)] uppercase tracking-widest block">
                      Analyse / Uitleg:
                    </span>
                    <p className="text-xs font-medium text-[var(--ds-black)] mt-0.5">
                      {error.explanation || "Onjuiste persoonsvorm of woordvolgorde."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modül İlerleme Grafik Barları */}
        <div className="bg-[var(--ds-white)] p-5">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-black)] opacity-60 mb-4 block">
            GENEL MODÜL İLERLEMESİ
          </span>
          <div className="flex flex-col gap-3">
            {modules.map(({ label, color, current, max }) => {
              const pct = Math.min((current / max) * 100, 100);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[var(--ds-black)]">{label}</span>
                    <span className="text-xs font-bold opacity-45">{current}/{max}</span>
                  </div>
                  <div className="w-full h-3 bg-[var(--ds-gray)]">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topsör En Yüksek Skorlar Paneli */}
        <div className="bg-[var(--ds-black)] p-5">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-white)] opacity-70 mb-3 block">
            TOPSCORE SPELEN (EN YÜKSEK SKORLAR)
          </span>
          <div className="grid grid-cols-2 gap-[3px]">
            {[
              { label: "Zin bouwen", val: highScores.zinBouwen, span: false },
              { label: "Vul in", val: highScores.vulIn, span: false },
              { label: "Vertaal", val: highScores.vertaal, span: false },
              { label: "Snelronde", val: highScores.snelronde, span: false },
              { label: "Zin motor", val: highScores.zinMotor || 0, span: true },
            ].map(({ label, val, span }) => (
              <div key={label} className={`bg-[var(--ds-white)] p-4 ${span ? "col-span-2" : ""}`}>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</p>
                <p className="text-2xl font-black mt-1 text-[var(--ds-black)]">{val}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
