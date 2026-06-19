"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/hooks";
import { loadEtappes, checkLesUnlocked } from "@/lib/curriculum";
import type { Etappe } from "@/lib/types";

interface NextLesson {
  id: string;
  title: string;
  etappeId: string;
  nr: number;
}

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="4" y1="10" x2="16" y2="10" />
    <polyline points="10,4 16,10 10,16" />
  </svg>
);

export default function Dashboard() {
  const { progress } = useProgress();
  const [nextLesson, setNextLesson] = useState<NextLesson | null>(null);
  const [totalLessons, setTotalLessons] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [verbCount, setVerbCount] = useState(0);

  const streak = progress.games.streak ?? 0;
  const totalPoints = progress.games.totalPoints ?? 0;
  const wordenCount = Object.keys(progress.flashcard).length + Object.keys(progress.verbs ?? {}).length;
  const zinnenCount = Object.values(progress.lessons).filter((l) => l.completed).length;

  const dailyGoal = progress.settings.dailyGoal ?? 15;
  const todayStr = new Date().toISOString().slice(0, 10);
  const dailyCount = progress.games.daily?.date === todayStr ? progress.games.daily.count : 0;
  const isGoalReached = dailyCount >= dailyGoal;
  const goalProgressPct = Math.min((dailyCount / dailyGoal) * 100, 100);

  useEffect(() => {
    loadEtappes().then((etappesList) => {
      const total = etappesList.reduce((sum, e) => sum + e.lessen.length, 0);
      setTotalLessons(total);

      let done = 0;
      if (progress.curriculum) {
        Object.values(progress.curriculum.etappes).forEach((ep) => {
          done += ep.lessenDone.length;
        });
      }
      setCompletedLessons(done);

      let foundNext = false;
      for (const etappe of etappesList) {
        for (const les of etappe.lessen) {
          const lesId = les.verhaalId || `${etappe.id}-${les.nr}`;
          const isCompleted = progress.curriculum?.etappes[etappe.id]?.lessenDone.includes(lesId);
          if (!isCompleted) {
            const isUnlocked = checkLesUnlocked(etappe.id, les.nr, progress, etappesList);
            if (isUnlocked) {
              setNextLesson({
                id: lesId,
                title: les.titel,
                etappeId: etappe.id,
                nr: les.nr,
              });
              foundNext = true;
              break;
            }
          }
        }
        if (foundNext) break;
      }
      
      if (!foundNext) setNextLesson(null);
    });

    setVerbCount(Object.keys(progress.verbs ?? {}).length);
  }, [progress.curriculum, progress.verbs]);

  const lessenPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24 pt-6 px-4 md:px-8 max-w-4xl mx-auto flex flex-col gap-6">
      {/* Karşılama ve Başlık */}
      <div className="flex flex-col gap-1 select-none">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          Hoi! Laten we vandaag Nederlands leren.
        </h1>
        <p className="text-sm opacity-60 text-[var(--text-muted)]">
          Kies een module of ga door met je volgende les.
        </p>
      </div>

      {/* Dagelijks Doel (Günlük Hedef) İlerleme Kartı */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 shadow-[0_4px_12px_rgba(15,23,42,0.02)] flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className={`relative w-14 h-14 shrink-0 rounded-full flex items-center justify-center border-4 ${isGoalReached ? "border-[var(--success)] bg-[var(--success-soft)]" : "border-[var(--accent)]/20"}`}>
            {isGoalReached ? (
              <span className="text-xl">✅</span>
            ) : (
              <span className="text-xs font-black text-[var(--accent)]">{Math.round(goalProgressPct)}%</span>
            )}
            {!isGoalReached && goalProgressPct > 0 && (
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                <path
                  className="text-[var(--accent)]"
                  strokeWidth="4"
                  strokeDasharray={`${goalProgressPct}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">DAGELIJKS DOEL (Günlük Hedef)</span>
            <h3 className="text-sm font-black text-[var(--text)]">
              {isGoalReached ? "Gefeliciteerd! Dagelijks doel bereikt! 🎉" : "Goed op weg! Blijf oefenen."}
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-semibold">
              Vandaag: <span className="font-bold text-[var(--text)]">{dailyCount}</span> van de <span className="font-bold text-[var(--text)]">{dailyGoal}</span> oefeningen voltooid
            </p>
          </div>
        </div>
        <div className="w-full sm:w-32 bg-[var(--surface-2)] h-2 rounded-full overflow-hidden shrink-0">
          <div className={`h-full rounded-full transition-all duration-500 ${isGoalReached ? "bg-[var(--success)]" : "bg-[var(--accent)]"}`} style={{ width: `${goalProgressPct}%` }} />
        </div>
      </div>

      {/* Grid İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3 shadow-[0_4px_12px_rgba(15,23,42,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center text-lg">🔥</div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">STREAK</span>
            <span className="text-xl font-bold text-[var(--text)] leading-none">{streak}</span>
          </div>
        </div>

        {/* Toplam Puan */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3 shadow-[0_4px_12px_rgba(15,23,42,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-950/30 text-yellow-500 flex items-center justify-center text-lg">💎</div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">PUNTEN</span>
            <span className="text-xl font-bold text-[var(--text)] leading-none">{totalPoints.toLocaleString("nl")}</span>
          </div>
        </div>

        {/* Öğrenilen Kelimeler */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3 shadow-[0_4px_12px_rgba(15,23,42,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center text-lg">📚</div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">WOORDEN</span>
            <span className="text-xl font-bold text-[var(--text)] leading-none">{wordenCount.toLocaleString("nl")}</span>
          </div>
        </div>

        {/* Yapılan Cümleler */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3 shadow-[0_4px_12px_rgba(15,23,42,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/30 text-sky-500 flex items-center justify-center text-lg">💬</div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">ZINNEN</span>
            <span className="text-xl font-bold text-[var(--text)] leading-none">{zinnenCount.toLocaleString("nl")}</span>
          </div>
        </div>
      </div>

      {/* Ana Eylem Kartları (Ders Durumu) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sol 2 Kolon: Sıradaki Ders Kartı */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-gradient-to-r from-[var(--primary)] to-[#1d4ed8] text-white rounded-3xl p-6 shadow-md border border-[var(--border)] relative overflow-hidden flex flex-col gap-4">
            <div className="absolute right-4 top-4 text-white/10 text-9xl font-black pointer-events-none select-none">
              {completedLessons + 1}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] bg-white/10 px-2.5 py-1 rounded-full self-start">
              VOLGENDE STAP (Sıradaki Adım)
            </span>
            <div className="flex flex-col gap-1 select-none">
              <h2 className="text-xl font-bold">{nextLesson ? nextLesson.title : "Alle lessen voltooid!"}</h2>
              <p className="text-xs text-white/70">
                {nextLesson ? "Begin direct met deze les om je streak te behouden." : "Gefeliciteerd! Je hebt alle lessen afgerond."}
              </p>
            </div>
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-[var(--accent)] h-full rounded-full" style={{ width: `${lessenPct}%` }} />
            </div>
            <div className="flex justify-between items-center text-xs text-white/80 font-bold select-none">
              <span>Voortgang (İlerleme)</span>
              <span>{lessenPct}%</span>
            </div>
            {nextLesson && (
              <Link
                href={`/lessen/${nextLesson.id}?etappe=${nextLesson.etappeId}&nr=${nextLesson.nr}`}
                className="bg-[var(--accent)] text-white font-bold py-3.5 px-6 rounded-2xl text-center hover:opacity-95 transition-opacity z-10 flex items-center justify-center gap-2 mt-2 shadow-[0_4px_12px_rgba(0,173,181,0.2)]"
              >
                Start de les (Dersi Başlat) <ArrowRight />
              </Link>
            )}
          </div>
        </div>

        {/* Sağ 1 Kolon: Hızlı İstatistik veya Motivasyon */}
        <div className="bg-gradient-to-r from-[var(--primary)] to-[#115e59] text-white rounded-3xl p-6 shadow-md border border-[var(--border)] text-center flex flex-col items-center gap-2">
          <div className="text-4xl">🏆</div>
          <h3 className="font-bold text-lg">Je bent goed bezig!</h3>
          <p className="text-xs text-white/80 max-w-[200px]">
            Je hebt al {completedLessons} lessen en {verbCount} werkwoorden geoefend. Blijf zo doorgaan!
          </p>
        </div>
      </div>

      {/* Grid: Diğer Modüller */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Temel Çalışmalar */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">MODULEN (Modüller)</span>
          <div className="flex flex-col gap-2.5">
            {/* Lessen */}
            <Link
              href="/lessen"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center font-bold text-lg">📖</div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[var(--text)]">Lessen</span>
                  <span className="text-xs text-slate-400 mt-0.5">Alle lessen en verhalen</span>
                </div>
              </div>
              <ArrowRight />
            </Link>

            {/* Woordkaarten */}
            <Link
              href="/kaarten"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center font-bold text-lg">🗂️</div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[var(--text)]">Woordkaarten</span>
                  <span className="text-xs text-slate-400 mt-0.5">Interactief woordjes leren</span>
                </div>
              </div>
              <ArrowRight />
            </Link>

            {/* Grammatica */}
            <Link
              href="/grammatica"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/30 text-violet-600 flex items-center justify-center font-bold text-lg">💡</div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[var(--text)]">Grammatica</span>
                  <span className="text-xs text-slate-400 mt-0.5">Regels en structuur</span>
                </div>
              </div>
              <ArrowRight />
            </Link>

            {/* Signaalwoorden */}
            <Link
              href="/signaalwoorden"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950/30 text-pink-600 flex items-center justify-center font-bold text-lg">🔗</div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[var(--text)]">Signaalwoorden</span>
                  <span className="text-xs text-slate-400 mt-0.5">Tekstverbanden begrijpen</span>
                </div>
              </div>
              <ArrowRight />
            </Link>

            {/* Voegwoorden */}
            <Link
              href="/voegwoorden"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/30 text-teal-600 flex items-center justify-center font-bold text-lg">🤝</div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[var(--text)]">Voegwoorden</span>
                  <span className="text-xs text-slate-400 mt-0.5">Zinnen verbinden</span>
                </div>
              </div>
              <ArrowRight />
            </Link>

            {/* Video Lessen */}
            <Link
              href="/videos"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 text-red-600 flex items-center justify-center font-bold text-lg">🎥</div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[var(--text)]">Video Lessen</span>
                  <span className="text-xs text-slate-400 mt-0.5">Videolessen en shadowing</span>
                </div>
              </div>
              <ArrowRight />
            </Link>

            {/* AI Chatbot */}
            <Link
              href="/chat"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm border-l-4 border-l-blue-500"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center p-1 shrink-0">
                  <img src="/ai-maskot.png" alt="AI Mascot" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-[var(--text)]">AI Chatbot</span>
                    <span className="text-[9px] bg-blue-500 text-white font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider scale-90">AI</span>
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5">Praat en schrijf met AI (Yapay Zeka Sohbeti)</span>
                </div>
              </div>
              <ArrowRight />
            </Link>
          </div>
        </div>

        {/* Oyun Modülleri */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">SPELLEN (Oyunlar)</span>
          <div className="flex flex-col gap-2.5">
            {/* Zin Motor */}
            <Link
              href="/spel/zin-motor"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm border-l-4 border-l-[var(--accent)]"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/30 text-cyan-600 flex items-center justify-center font-bold text-lg">🎰</div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[var(--text)]">Zin Motor</span>
                  <span className="text-xs text-slate-400 mt-0.5">Roterende wielen zinsbouw</span>
                </div>
              </div>
              <ArrowRight />
            </Link>

            {/* Flitsen */}
            <Link
              href="/spel/flitsen"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center font-bold text-lg">⚡</div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[var(--text)]">Flitsen</span>
                  <span className="text-xs text-slate-400 mt-0.5">Snelheid flitskaarten</span>
                </div>
              </div>
              <ArrowRight />
            </Link>

            {/* Zin Bouwen */}
            <Link
              href="/spel/zin-bouwen"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/30 text-orange-600 flex items-center justify-center font-bold text-lg">🧩</div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[var(--text)]">Zin Bouwen</span>
                  <span className="text-xs text-slate-400 mt-0.5">Slepende zinsopbouw</span>
                </div>
              </div>
              <ArrowRight />
            </Link>

            {/* Vul In */}
            <Link
              href="/spel/vul-in"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600 flex items-center justify-center font-bold text-lg">✏️</div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[var(--text)]">Vul In</span>
                  <span className="text-xs text-slate-400 mt-0.5">Ontbrekende woorden</span>
                </div>
              </div>
              <ArrowRight />
            </Link>

            {/* Vertaal */}
            <Link
              href="/spel/vertaal"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center font-bold text-lg">🗣️</div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[var(--text)]">Vertaal</span>
                  <span className="text-xs text-slate-400 mt-0.5">Vrije vertalingen</span>
                </div>
              </div>
              <ArrowRight />
            </Link>

            {/* Snelronde */}
            <Link
              href="/spel/snelronde"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center font-bold text-lg">⏱️</div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[var(--text)]">Snelronde</span>
                  <span className="text-xs text-slate-400 mt-0.5">Race tegen de klok (60s)</span>
                </div>
              </div>
              <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
