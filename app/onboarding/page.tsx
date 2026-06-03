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
  color: string;
  textColor: string;
}> = [
  {
    code: "A1",
    title: "A1 — Beginner",
    desc: "Ik ken geen Nederlands. Ik begin bij het begin.",
    color: "bg-[var(--ds-white)]",
    textColor: "text-[var(--ds-black)]",
  },
  {
    code: "A2",
    title: "A2 — Basis",
    desc: "Ik ken eenvoudige woorden en kan korte zinnen maken.",
    color: "bg-[var(--ds-yellow)]",
    textColor: "text-[var(--ds-black)]",
  },
  {
    code: "B1",
    title: "B1 — Gemiddeld",
    desc: "Ik begrijp de hoofdpunten en kan me redden in alledaagse situaties.",
    color: "bg-[var(--ds-blue)]",
    textColor: "text-[var(--ds-white)]",
  },
  {
    code: "B2",
    title: "B2 — Gevorderd",
    desc: "Ik begrijp complexe teksten en spreek vrij vloeiend.",
    color: "bg-[var(--ds-black)]",
    textColor: "text-[var(--ds-white)]",
  },
];

const rtlCodes = ["ar", "fa"];

// Language block colors per spec — Mondrian pattern
const LANG_COLORS: Record<string, { bg: string; text: string; border?: boolean }> = {
  tr: { bg: "bg-[var(--ds-red)]", text: "text-[var(--ds-white)]" },
  ar: { bg: "bg-[var(--ds-blue)]", text: "text-[var(--ds-white)]" },
  uk: { bg: "bg-[var(--ds-yellow)]", text: "text-[var(--ds-black)]" },
  en: { bg: "bg-[var(--ds-white)]", text: "text-[var(--ds-black)]", border: true },
  fa: { bg: "bg-[var(--ds-blue)]", text: "text-[var(--ds-white)]" },
  pl: { bg: "bg-[var(--ds-red)]", text: "text-[var(--ds-white)]" },
  es: { bg: "bg-[var(--ds-yellow)]", text: "text-[var(--ds-black)]" },
  fr: { bg: "bg-[var(--ds-white)]", text: "text-[var(--ds-black)]", border: true },
  so: { bg: "bg-[var(--ds-blue)]", text: "text-[var(--ds-white)]" },
};

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
    <div className="min-h-screen bg-[var(--ds-white)] flex flex-col">
      {/* Top half — branding */}
      <div className="px-6 py-12 md:py-16 flex flex-col justify-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-wide text-[var(--ds-black)] lowercase">
          spraakmaker
        </h1>
        <p className="mt-3 text-[var(--ds-black)] text-base md:text-lg font-medium opacity-60">
          Leer Nederlands op jouw manier
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === "moedertaal" ? (
            <motion.div
              key="moedertaal"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-bold text-[var(--ds-black)] mb-6">
                Wat is je moedertaal?
              </h2>

              {/* 3x3 grid, 3px gap, Mondrian tarzı */}
              <div className="grid grid-cols-3 gap-[3px] bg-[var(--ds-black)] border-[3px] border-[var(--ds-black)] max-w-lg">
                {MOEDERTALEN.map(({ code, label }) => {
                  const isRtl = rtlCodes.includes(code);
                  const colors = LANG_COLORS[code] ?? { bg: "bg-[var(--ds-white)]", text: "text-[var(--ds-black)]", border: true };
                  return (
                    <button
                      key={code}
                      onClick={() => handleLangSelect(code)}
                      dir={isRtl ? "rtl" : "ltr"}
                      className={`${colors.bg} ${colors.text} px-4 py-6 md:py-8 font-bold text-sm md:text-base border-none hover:opacity-80 active:opacity-70 transition-opacity cursor-pointer flex items-center justify-center text-center ${
                        colors.border ? "border-[3px] border-[var(--ds-black)]" : ""
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="niveau"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => setStep("moedertaal")}
                className="text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-70 mb-4 flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
              >
                ← Terug
              </button>

              <h2 className="text-xl font-bold text-[var(--ds-black)] mb-6">
                Wat is je niveau?
              </h2>

              <div className="flex flex-col gap-[3px] bg-[var(--ds-black)] border-[3px] border-[var(--ds-black)] max-w-lg">
                {NIVEAUS.map(({ code, title, desc, color, textColor }) => (
                  <button
                    key={code}
                    onClick={() => handleNiveauSelect(code)}
                    className={`${color} ${textColor} p-5 text-left border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-between gap-4`}
                  >
                    <div>
                      <p className="font-bold text-base">{title}</p>
                      <p className={`text-sm mt-0.5 ${textColor === "text-[var(--ds-white)]" ? "opacity-70" : "opacity-60"}`}>
                        {desc}
                      </p>
                    </div>
                    <IconArrowRight size={20} />
                  </button>
                ))}
              </div>

              <p className="text-xs opacity-40 mt-4 max-w-sm">
                Geen zorgen — je kunt dit later wijzigen via Instellingen.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Mondrian accent strip */}
      <div className="flex border-t-[3px] border-[var(--ds-black)] h-6">
        <div className="flex-1 bg-[var(--ds-red)] border-r-[3px] border-[var(--ds-black)]" />
        <div className="flex-1 bg-[var(--ds-yellow)] border-r-[3px] border-[var(--ds-black)]" />
        <div className="flex-1 bg-[var(--ds-blue)]" />
      </div>
    </div>
  );
}
