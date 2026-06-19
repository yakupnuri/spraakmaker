"use client";

import { useProgress } from "@/lib/hooks";
import Link from "next/link";

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

  const dailyGoal = progress.settings.dailyGoal ?? 15;
  const todayStr = new Date().toISOString().slice(0, 10);
  const dailyCount = progress.games.daily?.date === todayStr ? progress.games.daily.count : 0;

  // Last 7 days dot indicator
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const active = !!progress.games.lastPlayDate?.startsWith(key);
    const dayLabel = ["Z", "M", "D", "W", "D", "V", "Z"][d.getDay()];
    return { label: dayLabel, active };
  });

  const stats = progress.games.stats || {
    zinBouwen: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
    zinMotor: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
    vertaal: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
    snelronde: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
    vulIn: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
    flitsen: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
    grammatica: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
  };

  const getSuccessRate = (correct: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  const zinBouwenRate = getSuccessRate(stats.zinBouwen?.correctCount || 0, stats.zinBouwen?.playCount || 0);
  const zinMotorRate = getSuccessRate(stats.zinMotor?.correctCount || 0, stats.zinMotor?.playCount || 0);
  const vertaalRate = getSuccessRate(stats.vertaal?.correctCount || 0, stats.vertaal?.playCount || 0);
  const snelrondeRate = getSuccessRate(stats.snelronde?.correctCount || 0, stats.snelronde?.playCount || 0);
  const vulInRate = getSuccessRate(stats.vulIn?.correctCount || 0, stats.vulIn?.playCount || 0);
  const flitsenRate = getSuccessRate(stats.flitsen?.correctCount || 0, stats.flitsen?.playCount || 0);
  const grammaticaRate = getSuccessRate(stats.grammatica?.correctCount || 0, stats.grammatica?.playCount || 0);

  const totalCorrect =
    (stats.zinBouwen?.correctCount || 0) +
    (stats.zinMotor?.correctCount || 0) +
    (stats.vertaal?.correctCount || 0) +
    (stats.snelronde?.correctCount || 0) +
    (stats.vulIn?.correctCount || 0) +
    (stats.flitsen?.correctCount || 0) +
    (stats.grammatica?.correctCount || 0);

  const totalPlay =
    (stats.zinBouwen?.playCount || 0) +
    (stats.zinMotor?.playCount || 0) +
    (stats.vertaal?.playCount || 0) +
    (stats.snelronde?.playCount || 0) +
    (stats.vulIn?.playCount || 0) +
    (stats.flitsen?.playCount || 0) +
    (stats.grammatica?.playCount || 0);

  const generalSuccessRate = getSuccessRate(totalCorrect, totalPlay);

  const allHistory: Array<GameHistoryItem & { gameLabel: string }> = [];
  if (stats.zinBouwen?.history) {
    allHistory.push(...stats.zinBouwen.history.map(h => ({ ...h, gameLabel: "Zin Bouwen" })));
  }
  if (stats.zinMotor?.history) {
    allHistory.push(...stats.zinMotor.history.map(h => ({ ...h, gameLabel: "Zin Motor" })));
  }
  if (stats.vertaal?.history) {
    allHistory.push(...stats.vertaal.history.map(h => ({ ...h, gameLabel: "Vertaal" })));
  }
  if (stats.snelronde?.history) {
    allHistory.push(...stats.snelronde.history.map(h => ({ ...h, gameLabel: "Snelronde" })));
  }
  if (stats.vulIn?.history) {
    allHistory.push(...stats.vulIn.history.map(h => ({ ...h, gameLabel: "Vul In" })));
  }
  if (stats.flitsen?.history) {
    allHistory.push(...stats.flitsen.history.map(h => ({ ...h, gameLabel: "Flitsen" })));
  }
  if (stats.grammatica?.history) {
    allHistory.push(...stats.grammatica.history.map(h => ({ ...h, gameLabel: "Grammatica" })));
  }

  const recentErrors = allHistory
    .filter(h => !h.correct)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const getPedagogicalAdvice = () => {
    if (totalPlay === 0) {
      return "Er zijn nog geen spellen gespeeld. Speel een van de spellen of lees een les om je voortgangsrapport en persoonlijk advies te bekijken!";
    }
    if (generalSuccessRate >= 85) {
      return "Je bent geweldig bezig! Je zinsbouw en vertalingen zijn erg sterk. Om jezelf meer uit te dagen, kun je naar de Quiz-module op de 'Grammatica'-pagina gaan of moeilijke zinnen met bijzinnen blijven oefenen.";
    }
    if (generalSuccessRate >= 50) {
      return "Je bent op de goede weg. Soms loop je echter vast op de woordvolgorde, bijzinnen of de vervoeging van het werkwoord. Bekijk de feedback in de foutenanalyse.";
    }
    return "Het is nuttig om de basis te versterken. Neem de grammaticaregels door onder 'Grammatica' voordat je begint te spelen, en oefen de zinnen aandachtig.";
  };

  const adviceText = getPedagogicalAdvice();

  // Ders istatistikleri detayları
  const lessonList = Object.values(progress.lessons);
  const totalStars = lessonList.reduce((acc, curr) => acc + (curr.stars || 0), 0);
  const avgStars = lessonDone > 0 ? (totalStars / lessonDone).toFixed(1) : "0.0";

  const modules = [
    { label: "Kaarten", color: "var(--primary)", current: flashcardTotal, max: 1000 },
    { label: "Spel", color: "var(--accent)", current: highScores.zinBouwen + highScores.vulIn + highScores.vertaal + (highScores.zinMotor || 0) + (highScores.flitsen || 0), max: 500 },
    { label: "Lessen", color: "var(--success)", current: lessonDone, max: 108 },
    { label: "Grammatica", color: "var(--warning)", current: verbTotal, max: 6 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24 select-none">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] px-5 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/meer"
            className="text-[var(--text)] text-sm font-bold opacity-75 hover:opacity-100 transition-opacity"
          >
            ←
          </Link>
          <h1 className="text-sm font-black uppercase tracking-wider text-[var(--text)]">Voortgang & Analiz</h1>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-0.5 rounded-full border border-[var(--accent)]/15">
          DASHBOARD
        </span>
      </header>

      {/* Main Container */}
      <main className="flex-grow p-4 w-full max-w-lg mx-auto flex flex-col gap-4">
        
        {/* Streak, Genel Başarı & Günlük Hedef */}
        <div className="grid grid-cols-3 gap-3">
          {/* Streak */}
          <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">STREAK</span>
            <div className="flex items-baseline gap-0.5 mt-2">
              <span className="text-3xl font-black font-mono leading-none text-[var(--warning)]">{streak}</span>
              <span className="text-[10px] font-bold text-[var(--text-muted)]">dgn</span>
            </div>
          </div>

          {/* Günlük Hedef */}
          <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">AKTİVİTE</span>
            <div className="flex items-baseline justify-between mt-2 flex-wrap gap-x-1">
              <span className="text-3xl font-black font-mono leading-none text-[var(--accent)]">{dailyCount}</span>
              <span className="text-[10px] font-bold text-[var(--text-muted)]">/ {dailyGoal}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-[var(--surface-2)] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${Math.min((dailyCount / dailyGoal) * 100, 100)}%` }} />
            </div>
          </div>

          {/* Genel Başarı Oranı */}
          <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">BAŞARI</span>
            <div className="flex items-baseline justify-between mt-2 flex-wrap gap-x-1">
              <span className="text-3xl font-black font-mono leading-none text-[var(--success)]">{generalSuccessRate}%</span>
              <span className="text-[9px] font-bold text-[var(--text-muted)]">
                {totalCorrect}/{totalPlay}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-[var(--surface-2)] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[var(--success)] rounded-full transition-all duration-500" style={{ width: `${generalSuccessRate}%` }} />
            </div>
          </div>
        </div>

        {/* Oyun Detay İstatistikleri */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "ZIN BOUWEN", rate: zinBouwenRate, play: stats.zinBouwen?.playCount || 0, correct: stats.zinBouwen?.correctCount || 0, desc: "Cümle yapısı başarısı" },
            { label: "ZIN MOTOR", rate: zinMotorRate, play: stats.zinMotor?.playCount || 0, correct: stats.zinMotor?.correctCount || 0, desc: "Öge-yuva başarısı" },
            { label: "VERTAAL", rate: vertaalRate, play: stats.vertaal?.playCount || 0, correct: stats.vertaal?.correctCount || 0, desc: "Serbest çeviri başarısı" },
            { label: "SNELRONDE", rate: snelrondeRate, play: stats.snelronde?.playCount || 0, correct: stats.snelronde?.correctCount || 0, desc: "Zamana karşı başarı" },
            { label: "VUL IN", rate: vulInRate, play: stats.vulIn?.playCount || 0, correct: stats.vulIn?.correctCount || 0, desc: "Boşluk doldurma başarısı" },
            { label: "FLITSEN", rate: flitsenRate, play: stats.flitsen?.playCount || 0, correct: stats.flitsen?.correctCount || 0, desc: "Hızlı tekrar başarısı" },
          ].map((game) => (
            <div key={game.label} className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{game.label}</span>
                <p className="text-2xl font-black mt-2 text-[var(--text)] font-mono">{game.rate}%</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-semibold">{game.desc}</p>
              </div>
              <div className="mt-3 text-[9px] border-t border-[var(--border)] pt-2 flex justify-between font-bold text-[var(--text-muted)] uppercase tracking-wide">
                <span>Oynama: {game.play}</span>
                <span>Doğru: {game.correct}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Lessen (Dersler) İstatistik Kartı */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-2xl flex flex-col shadow-sm">
          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 block">
            LESSTATISTIEKEN (DERS İSTATİSTİKLERİ)
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[var(--surface-2)] p-4 rounded-xl shadow-sm text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Tamamlanan</p>
              <p className="text-2xl font-black mt-1 text-[var(--success)] font-mono">{lessonDone} <span className="text-xs font-bold text-[var(--text-muted)]">/ 108</span></p>
            </div>
            <div className="bg-[var(--surface-2)] p-4 rounded-xl shadow-sm text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Toplam Yıldız</p>
              <p className="text-2xl font-black mt-1 text-[var(--warning)] font-mono">⭐{totalStars}</p>
            </div>
            <div className="bg-[var(--surface-2)] p-4 rounded-xl shadow-sm text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Ort. Yıldız</p>
              <p className="text-2xl font-black mt-1 text-[var(--accent)] font-mono">{avgStars}</p>
            </div>
          </div>
        </div>

        {/* Pedagojik Gelişim Tavsiyesi */}
        <div className="bg-[var(--accent-soft)] border border-[var(--accent)]/15 p-4 rounded-2xl text-[var(--text)] flex flex-col gap-1.5 shadow-sm">
          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">
            PERSOONLIJK ONTWIKKELINGSADVIES (Kişisel Gelişim Tavsiyesi)
          </span>
          <p className="text-xs font-semibold leading-relaxed">
            "{adviceText}"
          </p>
        </div>

        {/* Akıllı Hata Analizi Paneli */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-2xl flex flex-col shadow-sm">
          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">
            SLIMME FOUTENANALYSE (Son 5 Hatanın Analizi)
          </span>
          {recentErrors.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic py-4 text-center">
              Harika! Son dönemde hiçbir hata kaydı bulunmuyor.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {recentErrors.map((error, idx) => (
                <div key={idx} className="flex flex-col border-b border-[var(--border)] pb-3.5 last:border-b-0 last:pb-0 gap-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-[var(--danger-soft)] text-[var(--danger)] rounded border border-[var(--danger)]/10">
                      {error.gameLabel}
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)] font-mono">
                      {new Date(error.timestamp).toLocaleDateString("nl-NL")}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--danger)]">
                      Hatalı Cümle: "{error.userAnswer || error.sentence}"
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] font-semibold mt-0.5">
                      Doğru Cümle: "{error.sentence}" ({error.translation})
                    </p>
                  </div>
                  {/* Hata İzahı */}
                  <div className="bg-[var(--danger-soft)]/20 border-l-2 border-[var(--danger)] p-2 rounded-r-xl">
                    <span className="text-[8px] font-black text-[var(--danger)] uppercase tracking-wider block">
                      Analiz / Uitleg:
                    </span>
                    <p className="text-xs font-medium text-[var(--text)] mt-0.5">
                      {error.explanation || "Onjuiste persoonsvorm of woordvolgorde."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modül İlerleme Grafik Barları */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-2xl flex flex-col shadow-sm">
          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4 block">
            GENEL MODÜL İLERLEMESİ
          </span>
          <div className="flex flex-col gap-4">
            {modules.map(({ label, color, current, max }) => {
              const pct = Math.min((current / max) * 100, 100);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[var(--text)]">{label}</span>
                    <span className="text-xs font-bold text-[var(--text-muted)] font-mono">{current}/{max}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* En Yüksek Skorlar Paneli */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-2xl flex flex-col shadow-sm">
          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 block">
            TOPSCORE SPELEN (EN YÜKSEK SKORLAR)
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "Zin bouwen", val: highScores.zinBouwen },
              { label: "Vul in", val: highScores.vulIn },
              { label: "Vertaal", val: highScores.vertaal },
              { label: "Snelronde", val: highScores.snelronde },
              { label: "Zin motor", val: highScores.zinMotor || 0 },
              { label: "Flitsen", val: highScores.flitsen || 0 },
            ].map(({ label, val }) => (
              <div key={label} className="bg-[var(--surface-2)] p-4 rounded-xl shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
                <p className="text-2xl font-black mt-1 text-[var(--text)] font-mono">{val}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
