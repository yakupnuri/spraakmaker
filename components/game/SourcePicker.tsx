"use client";

import React, { useState } from "react";
import GameShell from "./GameShell";

export interface SourceMetadata {
  id: string;
  label: string;
  desc: string;
  level: string;
}

const AVAILABLE_SOURCES: SourceMetadata[] = [
  { id: "tc1", label: "Temel Cümleler 1", level: "A1", desc: "Temel konuşma kalıpları ve günlük ifadeler" },
  { id: "tc2", label: "Temel Cümleler 2", level: "A2", desc: "Orta düzey dil bilgisi içeren zengin cümleler" },
  { id: "az", label: "A-Z Cümleleri", level: "A1-B1", desc: "A'dan Z'ye kelime haznesi örnekleri" },
  { id: "delftse", label: "Delftse Methode", level: "A2-B1", desc: "Akademik ve pratik Hollandaca kalıpları" },
  { id: "lessen", label: "Ders Cümleleri", level: "A1-A2", desc: "Ders kitaplarındaki tüm hikaye cümleleri" },
];

interface SourcePickerProps {
  title: string;
  selectedSources: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onStart: () => void;
  extraContent?: React.ReactNode;
  verhalenLessen?: { lesId: string; titel: string; unlocked: boolean }[];
  selectedLesIds?: string[];
  onToggleLes?: (lesId: string) => void;
}

export default function SourcePicker({
  title,
  selectedSources,
  onToggle,
  onToggleAll,
  onStart,
  extraContent,
  verhalenLessen,
  selectedLesIds = [],
  onToggleLes,
}: SourcePickerProps) {
  const [verhalenExpanded, setVerhalenExpanded] = useState(false);
  const allSelected = selectedSources.length === AVAILABLE_SOURCES.length;
  const totalSelectedCount = selectedSources.length + selectedLesIds.length;

  const hasUnlocked = verhalenLessen?.some((l) => l.unlocked) ?? false;

  const actionBar = (
    <div className="flex flex-col gap-2 w-full">
      <button
        onClick={onToggleAll}
        className="w-full bg-[var(--surface-2)] text-[var(--text)] py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-[var(--border)]"
      >
        {allSelected ? "Deselecteer alles" : "Selecteer alles"}
      </button>
      <button
        onClick={onStart}
        disabled={totalSelectedCount === 0}
        className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-none disabled:opacity-40 disabled:pointer-events-none"
      >
        START SPEL
      </button>
    </div>
  );

  return (
    <GameShell title={title} icon="🎲" actionBar={actionBar}>
      {/* Banner */}
      <div className="mb-6 select-none">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] block mb-1">
          BRONSELECTIE (Kaynak Seçimi)
        </span>
        <h2 className="text-xl font-extrabold text-[var(--text)]">Kies je bronnen</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Selecteer de zinsbronnen waarmee je wilt oefenen.
        </p>
      </div>

      {extraContent}

      {/* Spraakmaker Verhalen Section */}
      {verhalenLessen && verhalenLessen.length > 0 && (
        <div className="mb-4 border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
          <div
            onClick={() => setVerhalenExpanded(!verhalenExpanded)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-2)] select-none transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📖</span>
              <div>
                <h3 className="font-bold text-sm text-[var(--text)]">Spraakmaker Verhalen</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  Okuduğun hikâyelerin cümleleri
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedLesIds.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--accent)] text-white rounded-full">
                  {selectedLesIds.length}
                </span>
              )}
              <span className="text-xs text-[var(--text-muted)]">
                {verhalenExpanded ? "▲" : "▼"}
              </span>
            </div>
          </div>

          {verhalenExpanded && (
            <div className="p-4 pt-0 border-t border-[var(--border)] bg-[var(--surface-2)]/30">
              {!hasUnlocked ? (
                <p className="text-[11px] text-[var(--text-muted)] italic text-center py-2 select-none">
                  Nog geen verhalen voltooid — lees eerst een les.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-3">
                  {verhalenLessen.map((les) => {
                    const isSelected = selectedLesIds.includes(les.lesId);
                    const num = les.lesId.replace("les_", "");

                    if (!les.unlocked) {
                      return (
                        <div
                          key={les.lesId}
                          title="Eerst de les lezen"
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--surface)] text-[var(--text-muted)] opacity-50 border border-[var(--border)] cursor-not-allowed flex items-center gap-1 select-none"
                        >
                          <span>Les {num}</span>
                          <span>🔒</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={les.lesId}
                        onClick={() => onToggleLes?.(les.lesId)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 select-none ${
                          isSelected
                            ? "bg-[var(--accent)] text-white shadow-xs"
                            : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-2)]"
                        }`}
                      >
                        <span>Les {num}</span>
                        <span className="opacity-60 font-normal">({les.titel})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Source List */}
      <div className="flex flex-col gap-3">
        {AVAILABLE_SOURCES.map((src) => {
          const isSelected = selectedSources.includes(src.id);
          return (
            <div
              key={src.id}
              onClick={() => onToggle(src.id)}
              className={`border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-200 hover:shadow-sm select-none ${
                isSelected
                  ? "bg-[var(--accent-soft)] border-[var(--accent)]"
                  : "bg-[var(--surface)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Custom Checkbox */}
                <div
                  className={`w-6 h-6 rounded-full border-[2px] flex items-center justify-center text-xs font-black transition-all ${
                    isSelected
                      ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                      : "border-[var(--text-muted)] bg-[var(--surface)]"
                  }`}
                >
                  {isSelected && "✓"}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--text)]">{src.label}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{src.desc}</p>
                </div>
              </div>

              {/* Level Badge */}
              <span className="px-2 py-0.5 text-[9px] font-black bg-[var(--accent-soft)] text-[var(--accent)] rounded-md border border-[var(--accent)]/10">
                {src.level}
              </span>
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}
