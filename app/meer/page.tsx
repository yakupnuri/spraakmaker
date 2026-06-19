"use client";

import { useState } from "react";
import Link from "next/link";
import { useProgress, useMoedertaal } from "@/lib/hooks";
import { MOEDERTALEN, type MoedertaalCode } from "@/lib/types";

export default function MeerPage() {
  const { progress, updateProgress } = useProgress();
  const { moedertaal, setMoedertaal } = useMoedertaal();
  const [showLangModal, setShowLangModal] = useState(false);

  const rtlCodes = ["ar", "fa"];

  function applyTheme(theme: "light" | "dark" | "system") {
    const root = document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
    window.dispatchEvent(new CustomEvent("spraakmaker-theme-change", { detail: theme }));
  }

  function handleTheme(theme: "light" | "dark" | "system") {
    updateProgress((prev) => ({
      ...prev,
      settings: { ...prev.settings, theme },
    }));
    applyTheme(theme);
  }

  function handleLangSelect(code: MoedertaalCode) {
    setMoedertaal(code);
    setShowLangModal(false);
  }

  const currentLang = MOEDERTALEN.find((l) => l.code === moedertaal);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] px-5 py-4 shadow-sm select-none">
        <h1 className="text-sm font-black uppercase tracking-wider text-[var(--text)]">instellingen</h1>
      </header>

      {/* Menu items */}
      <div className="flex flex-col w-full max-w-lg mx-auto p-4 gap-3">
        {/* Moedertaal */}
        <button
          onClick={() => setShowLangModal(true)}
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:bg-[var(--surface-2)] transition-all cursor-pointer text-left shadow-sm group select-none"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shrink-0" />
          <div className="flex-grow">
            <h3 className="font-extrabold text-sm text-[var(--text)]">Moedertaal wijzigen (Ana Dil Değiştir)</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-semibold">{currentLang?.label}</p>
          </div>
          <span className="text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-50">
              <polyline points="7,3 14,10 7,17" />
            </svg>
          </span>
        </button>

        {/* Voortgang */}
        <Link
          href="/meer/voortgang"
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:bg-[var(--surface-2)] transition-all shadow-sm group select-none"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--warning)] shrink-0" />
          <div className="flex-grow">
            <h3 className="font-extrabold text-sm text-[var(--text)]">Voortgang bekijken (Gelişimi Gör)</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-semibold">Bekijk je statistieken en scores</p>
          </div>
          <span className="text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-50">
              <polyline points="7,3 14,10 7,17" />
            </svg>
          </span>
        </Link>

        {/* Onbekende woorden */}
        <Link
          href="/meer/onbekende-woorden"
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:bg-[var(--surface-2)] transition-all shadow-sm group select-none"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] shrink-0" />
          <div className="flex-grow">
            <h3 className="font-extrabold text-sm text-[var(--text)]">Mijn onbekende woorden (Kelimelerim)</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-semibold">Oefen ve herhaal gemaakte fouten</p>
          </div>
          <span className="text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-50">
              <polyline points="7,3 14,10 7,17" />
            </svg>
          </span>
        </Link>

        {/* Geri Bildirim Gönder */}
        <Link
          href="/meer/feedback"
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:bg-[var(--surface-2)] transition-all shadow-sm group select-none"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shrink-0" />
          <div className="flex-grow">
            <h3 className="font-extrabold text-sm text-[var(--text)]">Feedback & Hata Bildirimi</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-semibold">Hata bildirin veya yeni özellik önerin</p>
          </div>
          <span className="text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-50">
              <polyline points="7,3 14,10 7,17" />
            </svg>
          </span>
        </Link>

        {/* Dagelijks doel */}
        <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm select-none">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shrink-0" />
            <h3 className="font-extrabold text-sm text-[var(--text)]">Dagelijks doel instellen</h3>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mb-3 font-semibold">Aantal oefeningen per dag (Günlük alıştırma hedefi)</p>
          <div className="flex gap-2">
            {[5, 10, 15, 20, 30].map((count) => {
              const active = (progress.settings.dailyGoal ?? 15) === count;
              return (
                <button
                  key={count}
                  onClick={() =>
                    updateProgress((p) => ({
                      ...p,
                      settings: { ...p.settings, dailyGoal: count },
                    }))
                  }
                  className={`flex-1 py-3 text-xs font-bold border rounded-xl cursor-pointer transition-all active:scale-95 ${
                    active
                      ? "bg-[var(--primary)] text-white border-transparent shadow-sm"
                      : "bg-[var(--surface-2)] text-[var(--text-muted)] border-transparent hover:bg-slate-200/50"
                  }`}
                >
                  {count} oef.
                </button>
              );
            })}
          </div>
        </div>

        {/* Thema */}
        <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm select-none">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--text-muted)] shrink-0" />
            <h3 className="font-extrabold text-sm text-[var(--text)]">Thema (Tema)</h3>
          </div>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => {
              const active = (progress.settings.theme ?? "system") === t;
              const labels = { light: "Licht", dark: "Donker", system: "Systeem" };
              return (
                <button
                  key={t}
                  onClick={() => handleTheme(t)}
                  className={`flex-1 py-3 text-xs font-bold border rounded-xl cursor-pointer transition-all active:scale-95 ${
                    active
                      ? "bg-[var(--primary)] text-white border-transparent shadow-sm"
                      : "bg-[var(--surface-2)] text-[var(--text-muted)] border-transparent hover:bg-slate-200/50"
                  }`}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* About */}
        <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm select-none">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shrink-0 opacity-40" />
            <div>
              <h3 className="font-extrabold text-sm text-[var(--text)]">Over Spraakmaker</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 font-semibold">Leer Nederlands op jouw manier.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Language modal */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 select-none">
          <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-black uppercase tracking-wider text-xs text-[var(--text)]">Moedertaal wijzigen</h2>
              <button
                onClick={() => setShowLangModal(false)}
                className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-3 grid grid-cols-3 gap-2">
              {MOEDERTALEN.map(({ code, label, available }) => {
                const isRtl = rtlCodes.includes(code);
                const active = moedertaal === code;
                return (
                  <button
                    key={code}
                    disabled={!available}
                    onClick={() => available && handleLangSelect(code)}
                    dir={isRtl ? "rtl" : "ltr"}
                    className={`py-4 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center text-center ${
                      active
                        ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/20 shadow-sm cursor-pointer"
                        : available
                        ? "bg-[var(--surface-2)] text-[var(--text)] border-transparent hover:bg-slate-200/50 cursor-pointer active:scale-95"
                        : "bg-[var(--surface-2)] text-[var(--text-muted)] border-transparent opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span>{label}</span>
                    {!available && (
                      <span className="text-[8px] font-black uppercase tracking-wider text-[var(--accent)] mt-1">
                        Yakında
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
