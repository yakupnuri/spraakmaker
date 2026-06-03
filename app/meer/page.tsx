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

  function handleTheme(theme: "light" | "dark" | "system") {
    updateProgress((prev) => ({
      ...prev,
      settings: { ...prev.settings, theme },
    }));
  }

  function handleLangSelect(code: MoedertaalCode) {
    setMoedertaal(code);
    setShowLangModal(false);
  }

  const currentLang = MOEDERTALEN.find((l) => l.code === moedertaal);

  const MENU_ITEMS = [
    { color: "bg-[var(--ds-blue)]", label: "Moedertaal wijzigen", sub: currentLang?.label, action: () => setShowLangModal(true) },
    { color: "bg-[var(--ds-yellow)]", label: "Voortgang bekijken", sub: undefined, href: "/meer/voortgang" },
    { color: "bg-[var(--ds-red)]", label: "Dagelijks doel instellen", sub: `${progress.settings.dailyGoal ?? 15} minuten`, action: undefined },
    { color: "bg-[var(--ds-gray)]", label: "Thema", sub: { light: "Licht", dark: "Donker", system: "Systeem" }[progress.settings.theme ?? "system"], action: undefined },
    { color: "bg-[var(--ds-black)]", label: "Over Spraakmaker", sub: undefined, action: undefined },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header — bg-ds-black */}
      <div className="bg-[var(--ds-black)] px-5 py-4">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">instellingen</span>
      </div>

      {/* Menu items */}
      <div className="flex flex-col">
        {/* Moedertaal */}
        <button
          onClick={() => setShowLangModal(true)}
          className="w-full bg-[var(--ds-white)] border-b-[3px] border-[var(--ds-black)] p-5 flex items-center gap-4 hover:bg-[var(--ds-gray)] transition-colors cursor-pointer text-left border-l-0 border-r-0 border-t-0"
        >
          <div className="w-2 h-2 bg-[var(--ds-blue)] flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-[var(--ds-black)] text-sm">Moedertaal wijzigen</p>
            <p className="text-xs opacity-50 mt-0.5">{currentLang?.label}</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-40">
            <polyline points="7,3 14,10 7,17" />
          </svg>
        </button>

        {/* Voortgang */}
        <Link
          href="/meer/voortgang"
          className="bg-[var(--ds-white)] border-b-[3px] border-[var(--ds-black)] p-5 flex items-center gap-4 hover:bg-[var(--ds-gray)] transition-colors"
        >
          <div className="w-2 h-2 bg-[var(--ds-yellow)] flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-[var(--ds-black)] text-sm">Voortgang bekijken</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-40">
            <polyline points="7,3 14,10 7,17" />
          </svg>
        </Link>

        {/* Onbekende woorden */}
        <Link
          href="/meer/onbekende-woorden"
          className="bg-[var(--ds-white)] border-b-[3px] border-[var(--ds-black)] p-5 flex items-center gap-4 hover:bg-[var(--ds-gray)] transition-colors"
        >
          <div className="w-2 h-2 bg-[var(--ds-red)] flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-[var(--ds-black)] text-sm">Mijn onbekende woorden</p>
            <p className="text-xs opacity-50 mt-0.5">Oefen en herhaal gemaakte fouten</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-40">
            <polyline points="7,3 14,10 7,17" />
          </svg>
        </Link>

        {/* Geri Bildirim Gönder */}
        <Link
          href="/meer/feedback"
          className="bg-[var(--ds-white)] border-b-[3px] border-[var(--ds-black)] p-5 flex items-center gap-4 hover:bg-[var(--ds-gray)] transition-colors"
        >
          <div className="w-2 h-2 bg-[var(--ds-blue)] flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-[var(--ds-black)] text-sm">Feedback & Hata Bildirimi</p>
            <p className="text-xs opacity-50 mt-0.5">Hata bildirin veya yeni özellik önerin</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-40">
            <polyline points="7,3 14,10 7,17" />
          </svg>
        </Link>

        {/* Dagelijks doel */}
        <div className="bg-[var(--ds-white)] border-b-[3px] border-[var(--ds-black)] p-5">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-2 h-2 bg-[var(--ds-red)] flex-shrink-0" />
            <p className="font-bold text-[var(--ds-black)] text-sm">Dagelijks doel instellen</p>
          </div>
          <div className="flex gap-[3px]">
            {[5, 10, 15, 20, 30].map((min) => {
              const active = (progress.settings.dailyGoal ?? 15) === min;
              return (
                <button
                  key={min}
                  onClick={() =>
                    updateProgress((p) => ({
                      ...p,
                      settings: { ...p.settings, dailyGoal: min },
                    }))
                  }
                  className={`flex-1 py-3 text-sm font-bold border-[3px] border-[var(--ds-black)] cursor-pointer transition-colors ${
                    active
                      ? "bg-[var(--ds-black)] text-[var(--ds-white)]"
                      : "bg-[var(--ds-white)] text-[var(--ds-black)] hover:bg-[var(--ds-gray)]"
                  }`}
                >
                  {min}m
                </button>
              );
            })}
          </div>
        </div>

        {/* Thema */}
        <div className="bg-[var(--ds-white)] border-b-[3px] border-[var(--ds-black)] p-5">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-2 h-2 bg-[var(--ds-gray)] flex-shrink-0" />
            <p className="font-bold text-[var(--ds-black)] text-sm">Thema</p>
          </div>
          <div className="flex gap-[3px]">
            {(["light", "dark", "system"] as const).map((t) => {
              const active = (progress.settings.theme ?? "system") === t;
              const labels = { light: "Licht", dark: "Donker", system: "Systeem" };
              return (
                <button
                  key={t}
                  onClick={() => handleTheme(t)}
                  className={`flex-1 py-3 text-sm font-bold border-[3px] border-[var(--ds-black)] cursor-pointer transition-colors ${
                    active
                      ? "bg-[var(--ds-black)] text-[var(--ds-white)]"
                      : "bg-[var(--ds-white)] text-[var(--ds-black)] hover:bg-[var(--ds-gray)]"
                  }`}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* About */}
        <div className="bg-[var(--ds-white)] border-b-[3px] border-[var(--ds-black)] p-5">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-[var(--ds-black)] flex-shrink-0" />
            <div>
              <p className="font-bold text-[var(--ds-black)] text-sm">Over Spraakmaker</p>
              <p className="text-xs opacity-50 mt-0.5">Leer Nederlands op jouw manier.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Language modal */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 bg-[var(--ds-black)] bg-opacity-80 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)]">
            <div className="p-5 border-b-[3px] border-[var(--ds-black)] flex items-center justify-between">
              <h2 className="font-bold uppercase tracking-widest text-sm">Moedertaal wijzigen</h2>
              <button
                onClick={() => setShowLangModal(false)}
                className="font-bold text-lg leading-none cursor-pointer bg-transparent border-none"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-3 gap-[3px] bg-[var(--ds-black)] p-[3px]">
              {MOEDERTALEN.map(({ code, label }) => {
                const isRtl = rtlCodes.includes(code);
                const active = moedertaal === code;
                return (
                  <button
                    key={code}
                    onClick={() => handleLangSelect(code)}
                    dir={isRtl ? "rtl" : "ltr"}
                    className={`py-5 text-sm font-bold cursor-pointer border-none transition-colors ${
                      active
                        ? "bg-[var(--ds-black)] text-[var(--ds-white)]"
                        : "bg-[var(--ds-white)] text-[var(--ds-black)] hover:bg-[var(--ds-yellow)]"
                    }`}
                  >
                    {label}
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
