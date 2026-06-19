"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MOEDERTALEN, type MoedertaalCode } from "@/lib/types";
import { IconArrowRight } from "@/components/Icons";

type Niveau = "A1" | "A2" | "B1" | "B2";

const NIVEAUS: Array<{
  code: Niveau;
  title: string;
  desc: string;
}> = [
  {
    code: "A1",
    title: "A1 — Beginner",
    desc: "Ik ken geen Nederlands. Ik begin bij het begin.",
  },
  {
    code: "A2",
    title: "A2 — Basis",
    desc: "Ik ken eenvoudige woorden en kan korte zinnen maken.",
  },
  {
    code: "B1",
    title: "B1 — Gemiddeld",
    desc: "Ik begrijp de hoofdpunten en kan me redden in alledaagse situaties.",
  },
  {
    code: "B2",
    title: "B2 — Gevorderd",
    desc: "Ik begrijp complexe teksten en spreek vrij vloeiend.",
  },
];

const rtlCodes = ["ar", "fa"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"moedertaal" | "niveau">("moedertaal");
  const [selectedLang, setSelectedLang] = useState<MoedertaalCode | null>(null);

  function handleLangSelect(code: MoedertaalCode) {
    setSelectedLang(code);
    setStep("niveau");
  }

  function handleNiveauSelect(niveau: Niveau) {
    localStorage.setItem("spraakmaker-moedertaal", selectedLang!);
    localStorage.setItem("spraakmaker-niveau", niveau);
    localStorage.setItem("spraakmaker-onboarding", "done");
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col justify-between">
      {/* Top logo & branding */}
      <header className="px-6 pt-12 pb-6 text-center select-none">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--primary)] lowercase">
          spraakmaker
        </h1>
        <p className="mt-2 text-sm font-semibold text-[var(--text-muted)] max-w-xs mx-auto">
          Leer Nederlands op jouw manier (Hollandaca'yı kendi tarzınla öğren)
        </p>
      </header>

      {/* Content wrapper */}
      <main className="flex-1 flex flex-col justify-center px-6 pb-12 w-full max-w-md mx-auto overflow-hidden">
        <AnimatePresence mode="wait">
          {step === "moedertaal" ? (
            <motion.div
              key="moedertaal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-xl font-extrabold text-[var(--text)] mb-5 text-center">
                Wat is je moedertaal?
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {MOEDERTALEN.map(({ code, label, available }) => {
                  const isRtl = rtlCodes.includes(code);
                  return (
                    <button
                      key={code}
                      disabled={!available}
                      onClick={() => available && handleLangSelect(code)}
                      dir={isRtl ? "rtl" : "ltr"}
                      className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl py-4 font-bold text-xs transition-all shadow-[0_4px_10px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center ${
                        available 
                          ? "text-[var(--text)] hover:border-[var(--accent)] hover:shadow-sm active:scale-95 cursor-pointer" 
                          : "text-[var(--text-muted)] opacity-50 cursor-not-allowed"
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
            </motion.div>
          ) : (
            <motion.div
              key="niveau"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4"
            >
              <button
                onClick={() => setStep("moedertaal")}
                className="self-start text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 transition-colors"
              >
                ← Terug
              </button>

              <h2 className="text-xl font-extrabold text-[var(--text)] mb-3 text-center">
                Wat is je niveau?
              </h2>

              <div className="flex flex-col gap-3">
                {NIVEAUS.map(({ code, title, desc }) => (
                  <button
                    key={code}
                    onClick={() => handleNiveauSelect(code)}
                    className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-left cursor-pointer hover:border-[var(--accent)] hover:shadow-md transition-all flex items-center justify-between gap-4 select-none group shadow-[0_4px_10px_rgba(0,0,0,0.02)]"
                  >
                    <div className="flex-1">
                      <p className="font-extrabold text-sm text-[var(--text)]">{title}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 font-semibold leading-normal">
                        {desc}
                      </p>
                    </div>
                    <span className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                      <IconArrowRight size={18} />
                    </span>
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-[var(--text-muted)] text-center font-bold tracking-wide mt-2 select-none">
                Geen zorgen — je kunt dit later wijzigen via Instellingen.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer padding */}
      <footer className="h-6" />
    </div>
  );
}
