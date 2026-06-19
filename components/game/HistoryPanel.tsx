"use client";

import React, { useState } from "react";

interface CorrectItem {
  nl: string;
  tr: string;
}

interface WrongItem {
  nl: string;
  tr: string;
  userAnswer?: string;
  explanation?: string;
}

interface HistoryPanelProps {
  correct: CorrectItem[];
  wrong: WrongItem[];
}

export default function HistoryPanel({ correct, wrong }: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalCorrect = correct.length;
  const totalWrong = wrong.length;

  if (totalCorrect === 0 && totalWrong === 0) return null;

  return (
    <div className="w-full border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden mt-4 shadow-sm select-none">
      {/* Başlık / Akordeon Butonu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 flex items-center justify-between font-bold text-sm bg-[var(--surface-2)] text-[var(--text)] hover:opacity-95 transition-opacity cursor-pointer border-none"
      >
        <span>
          Geçmiş ({totalCorrect} ✓ · {totalWrong} ✗)
        </span>
        <span className="text-xs transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
          ▼
        </span>
      </button>

      {/* Akordeon İçeriği */}
      {isOpen && (
        <div className="p-3 flex flex-col gap-2 max-h-72 overflow-y-auto bg-[var(--surface)]">
          {/* Yanlışlar */}
          {wrong.map((item, idx) => (
            <div
              key={`wrong-${idx}`}
              className="p-3 rounded-xl bg-[var(--danger-soft)] border border-[var(--danger)]/10 text-xs flex flex-col gap-1"
            >
              <div className="flex items-center justify-between text-[10px] font-black text-[var(--danger)]">
                <span>YANLIŞ CEVAP ✗</span>
              </div>
              <p className="font-bold text-[var(--text)]">{item.nl}</p>
              <p className="text-[var(--text-muted)] italic">{item.tr}</p>
              {item.userAnswer && (
                <div className="mt-1.5 pt-1.5 border-t border-[var(--danger)]/10 flex flex-col gap-1">
                  <div>
                    <span className="font-bold text-[var(--text-muted)]">Cevabınız: </span>
                    <span className="line-through text-[var(--danger)] font-bold">{item.userAnswer}</span>
                  </div>
                  {item.explanation && (
                    <p className="text-[10px] font-medium text-red-700 bg-red-100/40 p-1.5 rounded-lg">
                      💡 {item.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Doğrular */}
          {correct.map((item, idx) => (
            <div
              key={`correct-${idx}`}
              className="p-3 rounded-xl bg-[var(--success-soft)] border border-[var(--success)]/10 text-xs flex flex-col gap-1"
            >
              <div className="text-[10px] font-black text-[var(--success)]">
                DOĞRU CEVAP ✓
              </div>
              <p className="font-bold text-[var(--text)]">{item.nl}</p>
              <p className="text-[var(--text-muted)] italic">{item.tr}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
