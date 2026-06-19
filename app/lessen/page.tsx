"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/hooks";
import { loadEtappes, checkLesUnlocked } from "@/lib/curriculum";
import type { Etappe, CurriculumLes } from "@/lib/types";

// Helper components
function LockIcon() {
  return (
    <div className="flex items-center justify-center w-5 h-5 text-[var(--text-muted)] opacity-50">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2.5" y="6" width="9" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4.5 6V4a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="flex items-center justify-center w-5 h-5 text-[var(--success)]">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function LeerpadPage() {
  const { progress, updateProgress } = useProgress();
  const [etappes, setEtappes] = useState<Etappe[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEtappeId, setExpandedEtappeId] = useState<string | null>("etappe-a1-01");

  useEffect(() => {
    loadEtappes().then((data) => {
      setEtappes(data);
      setLoading(false);
    });
  }, []);

  // İlerleme başlangıç değerlerini ata (eğer yoksa)
  useEffect(() => {
    if (!loading && etappes.length > 0 && !progress.curriculum) {
      updateProgress((prev) => ({
        ...prev,
        curriculum: {
          activeEtappeId: "etappe-a1-01",
          etappes: {
            "etappe-a1-01": {
              lessenDone: [],
              quizPassed: false,
            },
          },
        },
      }));
    }
  }, [loading, etappes, progress.curriculum, updateProgress]);

  // Seviyelere göre grupla (A1, A2, B1, B2)
  const levels = ["A1", "A2", "B1", "B2"];
  
  const getEtappeStatus = (etappe: Etappe) => {
    const curr = progress.curriculum;
    if (!curr) return etappe.id === "etappe-a1-01" ? "active" : "locked";

    const activeId = curr.activeEtappeId || "etappe-a1-01";
    const activeEtappeObj = etappes.find(e => e.id === activeId);
    
    if (activeEtappeObj) {
      if (etappe.volgorde < activeEtappeObj.volgorde) return "completed";
      if (etappe.volgorde > activeEtappeObj.volgorde) return "locked";
    }
    
    return "active";
  };

  const getLesStatus = (etappeId: string, les: CurriculumLes) => {
    const lesId = les.verhaalId || `${etappeId}-${les.nr}`;
    const curr = progress.curriculum;
    
    // Ders tamamlandı mı?
    if (curr?.etappes[etappeId]?.lessenDone.includes(lesId)) {
      return "completed";
    }

    // Ders kilitsiz mi?
    const isUnlocked = checkLesUnlocked(etappeId, les.nr, progress, etappes);
    return isUnlocked ? "unlocked" : "locked";
  };

  const totalLessonsCount = etappes.reduce((sum, e) => sum + e.lessen.length, 0);
  let completedLessonsCount = 0;
  if (progress.curriculum) {
    Object.values(progress.curriculum.etappes).forEach((ep) => {
      completedLessonsCount += ep.lessenDone.length;
    });
  }
  const overallPct = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3.5 shadow-sm flex items-center justify-between">
        <h1 className="text-base font-black tracking-wider uppercase text-[var(--text)]">
          Leerpad
        </h1>
        <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full">
          {completedLessonsCount} / {totalLessonsCount} lessen
        </span>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-[var(--surface-2)]">
        <div className="h-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${overallPct}%` }} />
      </div>

      {loading && (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-sm font-bold text-[var(--text-muted)] opacity-50 uppercase tracking-widest animate-pulse">
            Laden…
          </p>
        </div>
      )}

      {!loading && (
        <main className="w-full max-w-lg mx-auto px-4 py-6 flex flex-col gap-8">
          {levels.map((level) => {
            const levelEtappes = etappes.filter((e) => e.niveau === level);
            if (levelEtappes.length === 0 && level !== "A1") return null;

            return (
              <section key={level} className="flex flex-col gap-4">
                {/* Seviye Başlığı */}
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-[var(--primary)] text-white font-black text-sm px-3 py-1 rounded-lg">
                      {level}
                    </div>
                    <h2 className="text-base font-extrabold text-[var(--text)] uppercase tracking-wider">
                      {level === "A1" ? "Eerste Stappen & Basis" : level === "A2" ? "Alledaagse Communicatie" : level === "B1" ? "Zelfstandige Interactie" : "Vloeiend & Professioneel"}
                    </h2>
                  </div>
                  <Link
                    href="/videos"
                    className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline"
                  >
                    Videos →
                  </Link>
                </div>

                {levelEtappes.length === 0 ? (
                  <div className="border border-dashed border-[var(--border)] rounded-2xl p-6 text-center text-xs text-[var(--text-muted)] select-none">
                    Etappes voor dit niveau zijn nog in voorbereiding.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {levelEtappes.map((etappe) => {
                      const status = getEtappeStatus(etappe);
                      const isLocked = status === "locked";
                      const isExpanded = expandedEtappeId === etappe.id;
                      
                      // Etappe tamamlanma yüzdesi
                      const etappeLessenDone = progress.curriculum?.etappes[etappe.id]?.lessenDone.length || 0;
                      const etappePct = Math.round((etappeLessenDone / etappe.lessen.length) * 100);

                      return (
                        <div key={etappe.id} className={`border border-[var(--border)] rounded-2xl bg-[var(--surface)] shadow-xs transition-all overflow-hidden ${isLocked ? "opacity-50" : ""}`}>
                          {/* Etappe Başlık Kartı */}
                          <div
                            onClick={() => !isLocked && setExpandedEtappeId(isExpanded ? null : etappe.id)}
                            className={`p-4 flex items-center justify-between select-none ${!isLocked ? "cursor-pointer hover:bg-slate-50/40 dark:hover:bg-slate-800/40" : ""}`}
                          >
                            <div className="flex-grow min-w-0">
                              <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest block mb-0.5">
                                Etappe {etappe.volgorde}
                              </span>
                              <h3 className="font-extrabold text-sm text-[var(--text)] truncate">
                                {etappe.titel}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-16 bg-[var(--surface-2)] h-1 rounded-full overflow-hidden">
                                  <div className="h-full bg-[var(--success)]" style={{ width: `${etappePct}%` }} />
                                </div>
                                <span className="text-[9px] font-bold text-[var(--text-muted)]">{etappePct}% voltooid</span>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {isLocked ? (
                                <LockIcon />
                              ) : etappePct === 100 ? (
                                <CheckIcon />
                              ) : (
                                <span className="text-xs text-[var(--text-muted)]">{isExpanded ? "▲" : "▼"}</span>
                              )}
                            </div>
                          </div>

                          {/* Ders Listesi */}
                          {isExpanded && !isLocked && (
                            <div className="border-t border-[var(--border)] bg-slate-50/30 dark:bg-slate-800/10 p-3 flex flex-col gap-2">
                              {etappe.lessen.map((les) => {
                                const lesStatus = getLesStatus(etappe.id, les);
                                const isLesLocked = lesStatus === "locked";
                                const isCompleted = lesStatus === "completed";
                                const lesId = les.verhaalId || `${etappe.id}-${les.nr}`;
                                
                                const href = isLesLocked ? "#" : `/lessen/${lesId}?etappe=${etappe.id}&nr=${les.nr}`;

                                return (
                                  <Link
                                    key={les.nr}
                                    href={href}
                                    className={`flex items-center gap-3 border border-[var(--border)]/70 rounded-xl p-3 bg-[var(--surface)] transition-all select-none ${
                                      isLesLocked 
                                        ? "opacity-50 cursor-not-allowed" 
                                        : "hover:border-[var(--accent)]/30 hover:shadow-xs active:scale-99"
                                    }`}
                                  >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                      isCompleted 
                                        ? "bg-[var(--success-soft)] text-[var(--success)]" 
                                        : isLesLocked 
                                          ? "bg-[var(--surface-2)] text-[var(--text-muted)]"
                                          : "bg-[var(--accent-soft)] text-[var(--accent)]"
                                    }`}>
                                      {les.nr}
                                    </div>

                                    <div className="flex-grow min-w-0">
                                      <h4 className="font-bold text-xs text-[var(--text)] truncate">
                                        {les.titel}
                                      </h4>
                                      <span className="text-[8px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                                        {les.type === "verhaal" ? "Verhaalles" : "Grammatica & Spreken"}
                                      </span>
                                    </div>

                                    <div className="shrink-0">
                                      {isCompleted ? (
                                        <CheckIcon />
                                      ) : isLesLocked ? (
                                        <LockIcon />
                                      ) : (
                                        <span className="text-[10px] text-[var(--accent)] font-bold">START →</span>
                                      )}
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </main>
      )}
    </div>
  );
}
