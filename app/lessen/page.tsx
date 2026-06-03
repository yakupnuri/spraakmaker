"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/hooks";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LesVerhaal {
  lesId: string;
  thema: number;
  themaTitel: string;
  hoofdstuk: number;
  hoofdstukNummer: string;
  verhaalTitel: string;
  verhaal: string;
  highlights: {
    verbs: string[];
    conjunctions: string[];
    scheidbaar: string[];
    tussenwoorden: string[];
  };
  woordenschat: Record<string, string>;
  oefeningen: {
    vulIn: Array<{ zin: string; antwoord: string; hint: string }>;
    zinBouwen: Array<{ woorden: string[]; antwoord: string; tr: string }>;
    vertaalNlTr: Array<{ nl: string; tr: string }>;
    vertaalTrNl: Array<{ tr: string; nl: string }>;
    begrip: Array<{ vraagTr: string; opties: string[]; antwoord: number }>;
  };
}

interface ThemaGroup {
  thema: number;
  themaTitel: string;
  lessen: LesVerhaal[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LessenPage() {
  const { progress } = useProgress();
  const [verhalen, setVerhalen] = useState<LesVerhaal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/lessen-verhalen.json")
      .then((r) => r.json())
      .then((data: LesVerhaal[]) => {
        setVerhalen(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Group by thema
  const themaGroups: ThemaGroup[] = [];
  for (const v of verhalen) {
    const existing = themaGroups.find((g) => g.thema === v.thema);
    if (existing) {
      existing.lessen.push(v);
    } else {
      themaGroups.push({
        thema: v.thema,
        themaTitel: v.themaTitel,
        lessen: [v],
      });
    }
  }

  const completedCount = Object.values(progress.lessons).filter(
    (l) => l.completed
  ).length;
  const total = verhalen.length;
  const overallPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // First uncompleted index in the flat verhalen list
  const firstUncompletedIndex = verhalen.findIndex(
    (v) => !progress.lessons[v.lesId]?.completed
  );

  function getLessonStatus(
    lesId: string,
    globalIndex: number
  ): "completed" | "current" | "next" | "locked" {
    if (progress.lessons[lesId]?.completed) return "completed";
    if (globalIndex === firstUncompletedIndex) return "current";
    if (globalIndex === firstUncompletedIndex + 1) return "next";
    return "locked";
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header bar */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between sticky top-0 z-40">
        <span className="text-sm font-bold text-[var(--ds-white)] uppercase tracking-widest">
          LESSEN
        </span>
        <span className="text-sm font-bold text-[var(--ds-white)] opacity-60">
          {completedCount}/{total}
        </span>
      </div>

      {/* Total progress bar */}
      <div className="h-[5px] bg-[var(--ds-black)] opacity-10 relative">
        <div
          className="h-full bg-[var(--ds-yellow)] transition-all duration-500"
          style={{ width: `${overallPct}%` }}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm font-bold text-[var(--ds-black)] opacity-40 uppercase tracking-widest">
            Laden…
          </p>
        </div>
      )}

      {/* Thema sections */}
      {!loading && (
        <div className="flex flex-col">
          {themaGroups.map((group) => (
            <div key={group.thema}>
              {/* Thema header */}
              <div className="bg-[var(--ds-black)] px-5 py-3 border-b-[3px] border-[var(--ds-black)]">
                <p className="text-xs font-bold text-[var(--ds-white)] uppercase tracking-widest">
                  THEMA {group.thema} — {group.themaTitel.toUpperCase()}
                </p>
              </div>

              {/* Lessons */}
              {group.lessen.map((les) => {
                const globalIndex = verhalen.findIndex(
                  (v) => v.lesId === les.lesId
                );
                const status = getLessonStatus(les.lesId, globalIndex);
                const lesProgress = progress.lessons[les.lesId];
                const stars = lesProgress?.stars ?? 0;
                const isLocked = status === "locked";

                const numBg =
                  status === "completed"
                    ? "bg-[var(--ds-blue)]"
                    : status === "current"
                    ? "bg-[var(--ds-yellow)]"
                    : status === "next"
                    ? "bg-[var(--ds-red)]"
                    : "bg-transparent";

                const numText =
                  status === "completed"
                    ? "text-[var(--ds-white)]"
                    : status === "current"
                    ? "text-[var(--ds-black)]"
                    : status === "next"
                    ? "text-[var(--ds-white)]"
                    : "text-[var(--ds-black)] opacity-30";

                const rowContent = (
                  <div
                    className={`flex items-stretch border-b-[3px] border-[var(--ds-black)] bg-[var(--ds-white)] ${
                      isLocked
                        ? "opacity-50"
                        : "hover:bg-[rgba(0,0,0,0.03)] transition-colors"
                    }`}
                  >
                    {/* Left: hoofdstukNummer block */}
                    <div
                      className={`flex items-center justify-center border-r-[3px] border-[var(--ds-black)] ${numBg} flex-shrink-0`}
                      style={{ width: "56px" }}
                    >
                      <span className={`text-xs font-bold ${numText}`}>
                        {les.hoofdstukNummer}
                      </span>
                    </div>

                    {/* Center: title + subtitle */}
                    <div className="flex-1 flex items-center justify-between px-4 py-3 gap-3 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-bold text-sm text-[var(--ds-black)] truncate">
                            {les.verhaalTitel}
                          </h2>
                          {status === "current" && (
                            <span className="text-[9px] font-bold uppercase tracking-widest bg-[var(--ds-yellow)] text-[var(--ds-black)] px-1.5 py-0.5 flex-shrink-0">
                              ▶ Devam et
                            </span>
                          )}
                          {status === "next" && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-red)] flex-shrink-0">
                              NIEUW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--ds-black)] opacity-40 mt-0.5">
                          {Object.keys(les.woordenschat).length} woorden
                        </p>
                      </div>

                      {/* Right: status icon */}
                      <div className="flex-shrink-0">
                        {isLocked ? (
                          <LockIcon />
                        ) : status === "completed" ? (
                          <StarBlocks stars={stars} />
                        ) : (
                          <ArrowIcon />
                        )}
                      </div>
                    </div>
                  </div>
                );

                if (isLocked) {
                  return <div key={les.lesId}>{rowContent}</div>;
                }

                return (
                  <Link
                    key={les.lesId}
                    href={`/lessen/${les.lesId}`}
                    id={`les-${les.lesId}`}
                  >
                    {rowContent}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Bottom padding */}
          {!loading && verhalen.length > 0 && (
            <div className="h-8" />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <div className="flex items-center justify-center w-6 h-6 opacity-30">
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2"
          y="6"
          width="10"
          height="8"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M4 6V4a3 3 0 016 0v2"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    </div>
  );
}

function StarBlocks({ stars }: { stars: number }) {
  return (
    <div className="flex gap-[3px]">
      {[0, 1, 2].map((s) => (
        <div
          key={s}
          className={`border-[2px] border-[var(--ds-black)] ${
            s < stars ? "bg-[var(--ds-blue)]" : "bg-transparent opacity-20"
          }`}
          style={{ width: "10px", height: "10px" }}
        />
      ))}
    </div>
  );
}

function ArrowIcon() {
  return (
    <span className="text-[var(--ds-black)] opacity-40 text-sm font-bold">
      →
    </span>
  );
}
