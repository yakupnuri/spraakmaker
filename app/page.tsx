"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/hooks";

interface NextLesson {
  id: string;
  title: string;
}

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="4" y1="10" x2="16" y2="10" />
    <polyline points="10,4 16,10 10,16" />
  </svg>
);

// Mondrian tile met optioneel accent-balkje links
function Tile({
  href,
  bg,
  textColor = "var(--ds-white)",
  label,
  value,
  sub,
  accent,
  arrow = false,
  colSpan = 1,
  rowSpan = 1,
  children,
}: {
  href?: string;
  bg: string;
  textColor?: string;
  label: string;
  value?: string | number;
  sub?: string;
  accent?: string;
  arrow?: boolean;
  colSpan?: number;
  rowSpan?: number;
  children?: React.ReactNode;
}) {
  const style: React.CSSProperties = {
    backgroundColor: bg,
    gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined,
    gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
  };

  const inner = (
    <div className="relative flex flex-col justify-between h-full p-4 overflow-hidden">
      {/* accent balk links */}
      {accent && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[5px]"
          style={{ backgroundColor: accent }}
        />
      )}
      <div className={accent ? "pl-3" : ""}>
        <span
          className="text-[9px] font-bold uppercase tracking-widest block mb-1"
          style={{ color: textColor, opacity: 0.65 }}
        >
          {label}
        </span>
        {value !== undefined && (
          <span className="text-2xl font-bold leading-none block" style={{ color: textColor }}>
            {typeof value === "number" ? value.toLocaleString("nl") : value}
          </span>
        )}
        {sub && (
          <span className="text-xs mt-0.5 block" style={{ color: textColor, opacity: 0.55 }}>
            {sub}
          </span>
        )}
        {children}
      </div>
      {arrow && href && (
        <div
          className="absolute right-3 bottom-3 w-7 h-7 flex items-center justify-center"
          style={{ backgroundColor: textColor === "var(--ds-white)" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }}
        >
          <span style={{ color: textColor }}>
            <ArrowRight />
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90 transition-opacity" style={style}>
        {inner}
      </Link>
    );
  }
  return <div style={style}>{inner}</div>;
}

export default function Dashboard() {
  const { progress } = useProgress();
  const [nextLesson, setNextLesson] = useState<NextLesson | null>(null);
  const [totalLessons, setTotalLessons] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [verbCount, setVerbCount] = useState(0);

  const streak = progress.games.streak ?? 0;
  const totalPoints = progress.games.totalPoints ?? 0;
  const wordenCount = Object.keys(progress.flashcard).length;
  const zinnenCount = Object.values(progress.lessons).filter((l) => l.completed).length;

  useEffect(() => {
    fetch("/data/lessen.json")
      .then((r) => r.json())
      .then((data: { id: string; title: string; sentences: unknown[] }[]) => {
        setTotalLessons(data.length);
        const done = Object.values(progress.lessons).filter((l) => l.completed).length;
        setCompletedLessons(done);
        const next = data.find((l) => !progress.lessons[l.id]?.completed);
        if (next) setNextLesson({ id: next.id, title: next.title });
      })
      .catch(() => {});

    // tel hoeveel werkwoorden geoefend
    setVerbCount(Object.keys(progress.verbs ?? {}).length);
  }, [progress.lessons, progress.verbs]);

  const lessenPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="p-[3px] bg-[var(--ds-black)] min-h-screen pb-20 md:pb-3">
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >

        {/* ── ROW 1: Streak (vol breedte, geel) ─────────────────────── */}
        <div
          className="bg-[var(--ds-yellow)] p-5 flex items-end justify-between"
          style={{ gridColumn: "span 2", minHeight: "90px" }}
        >
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-65 block mb-1">
              STREAK
            </span>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold leading-none text-[var(--ds-black)]">{streak}</span>
              <span className="text-xs text-[var(--ds-black)] opacity-55 pb-1">dagen op rij</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-65 block mb-1">
              PUNTEN
            </span>
            <span className="text-2xl font-bold text-[var(--ds-black)]">{totalPoints.toLocaleString("nl")}</span>
          </div>
        </div>

        {/* ── ROW 2: Woorden · Zinnen ────────────────────────────────── */}
        <div className="bg-[var(--ds-red)] p-4 flex flex-col justify-between" style={{ minHeight: "75px" }}>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-65">WOORDEN</span>
          <span className="text-2xl font-bold text-[var(--ds-white)]">{wordenCount.toLocaleString("nl")}</span>
        </div>
        <div className="bg-[var(--ds-white)] p-4 flex flex-col justify-between" style={{ minHeight: "75px" }}>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-55">ZINNEN KLAAR</span>
          <span className="text-2xl font-bold text-[var(--ds-black)]">{zinnenCount.toLocaleString("nl")}</span>
        </div>

        {/* ── SECTIE HEADER: Modules ─────────────────────────────────── */}
        <div
          className="bg-[var(--ds-black)] px-4 py-2 flex items-center"
          style={{ gridColumn: "span 2" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-40">
            MODULES
          </span>
        </div>

        {/* ── Werkwoorden (blauw, vol breedte) ──────────────────────── */}
        <Link
          href="/werkwoorden"
          className="bg-[var(--ds-blue)] p-4 flex items-center justify-between hover:opacity-90 transition-opacity"
          style={{ gridColumn: "span 2", minHeight: "72px" }}
        >
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-65 block mb-1">
              WERKWOORDEN
            </span>
            <span className="text-sm font-bold text-[var(--ds-white)]">
              Tegenw. tijd · Perfectum · Imperfectum · Modaal · Scheidbaar · Bijzinnen
            </span>
          </div>
          <div className="w-8 h-8 bg-[rgba(255,255,255,0.15)] flex items-center justify-center flex-shrink-0 ml-3">
            <span className="text-[var(--ds-white)]"><ArrowRight /></span>
          </div>
        </Link>

        {/* ── Signaalwoorden · Voegwoorden ─────────────────────────── */}
        <Link
          href="/signaalwoorden"
          className="bg-[var(--ds-black)] p-4 flex flex-col justify-between hover:opacity-80 transition-opacity"
          style={{ minHeight: "80px" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-65">SIGNAALWOORDEN</span>
          <div className="flex items-end justify-between">
            <span className="text-xs text-[var(--ds-white)] opacity-50">515 woorden</span>
            <span className="text-[var(--ds-white)] opacity-60"><ArrowRight /></span>
          </div>
        </Link>
        <Link
          href="/voegwoorden"
          className="bg-[var(--ds-yellow)] p-4 flex flex-col justify-between hover:opacity-90 transition-opacity"
          style={{ minHeight: "80px" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-65">VOEGWOORDEN</span>
          <div className="flex items-end justify-between">
            <span className="text-xs text-[var(--ds-black)] opacity-50">omdat · want · als…</span>
            <span className="text-[var(--ds-black)] opacity-60"><ArrowRight /></span>
          </div>
        </Link>

        {/* ── Kaarten (flashcards, rood, vol breedte) ───────────────── */}
        <Link
          href="/kaarten"
          className="bg-[var(--ds-red)] p-4 flex items-center justify-between hover:opacity-90 transition-opacity"
          style={{ gridColumn: "span 2", minHeight: "72px" }}
        >
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-65 block mb-1">
              WOORDKAARTEN
            </span>
            <span className="text-sm font-bold text-[var(--ds-white)]">
              {wordenCount > 0 ? `${wordenCount} woorden geoefend` : "Flashcards & spaced repetition"}
            </span>
          </div>
          <div className="w-8 h-8 bg-[rgba(255,255,255,0.15)] flex items-center justify-center flex-shrink-0 ml-3">
            <span className="text-[var(--ds-white)]"><ArrowRight /></span>
          </div>
        </Link>

        {/* ── SECTIE HEADER: Oefenen ────────────────────────────────── */}
        <div
          className="bg-[var(--ds-black)] px-4 py-2 flex items-center"
          style={{ gridColumn: "span 2" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-40">
            OEFENEN
          </span>
        </div>

        {/* ── Lessen (blauw, row-span-2) + Volgende les ─────────────── */}
        <Link
          href="/lessen"
          className="bg-[var(--ds-blue)] p-4 flex flex-col justify-between hover:opacity-90 transition-opacity"
          style={{ gridRow: "span 2", minHeight: "140px" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-65">LESSEN</span>
          <div className="flex flex-col items-center justify-center flex-1 gap-1 my-2">
            <span className="text-4xl font-bold text-[var(--ds-white)] leading-none">{completedLessons}</span>
            <span className="text-xs text-[var(--ds-white)] opacity-50">/{totalLessons} klaar</span>
          </div>
          <div className="w-full h-1.5 bg-[rgba(255,255,255,0.2)]">
            <div className="h-full bg-[var(--ds-yellow)]" style={{ width: `${lessenPct}%` }} />
          </div>
        </Link>

        {/* Volgende les */}
        {nextLesson ? (
          <Link
            href={`/lessen/${nextLesson.id}`}
            className="bg-[var(--ds-white)] p-4 flex flex-col justify-between hover:bg-[var(--ds-gray)] transition-colors"
            style={{ minHeight: "66px" }}
          >
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-55">
              VOLGENDE LES
            </span>
            <div className="flex items-end justify-between gap-2">
              <span className="text-xs font-bold text-[var(--ds-black)] line-clamp-2 leading-tight">
                {nextLesson.title}
              </span>
              <span className="text-[var(--ds-black)] opacity-50 flex-shrink-0"><ArrowRight /></span>
            </div>
          </Link>
        ) : (
          <div
            className="bg-[var(--ds-yellow)] p-4 flex flex-col justify-center"
            style={{ minHeight: "66px" }}
          >
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-55 block mb-1">KLAAR!</span>
            <span className="text-xs font-bold text-[var(--ds-black)]">Alle lessen voltooid</span>
          </div>
        )}

        {/* Werkwoorden geoefend */}
        <div className="bg-[var(--ds-gray)] p-4 flex flex-col justify-between" style={{ minHeight: "66px" }}>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-55">WERKWOORDEN</span>
          <span className="text-xl font-bold text-[var(--ds-black)]">{verbCount} <span className="text-xs font-normal opacity-50">geoefend</span></span>
        </div>

        {/* ── Spel sectie ───────────────────────────────────────────── */}
        <div
          className="bg-[var(--ds-black)] px-4 py-2 flex items-center justify-between"
          style={{ gridColumn: "span 2" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-40">
            SPELLEN
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-yellow)]">
            NIEUW SPEL
          </span>
        </div>

        {/* Zin Motor Banner */}
        <Link
          href="/spel/zin-motor"
          className="bg-[var(--ds-yellow)] border-[3px] border-[var(--ds-black)] p-5 flex flex-col justify-between hover:bg-[var(--ds-white)] transition-colors group"
          style={{ gridColumn: "span 2", minHeight: "100px" }}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-black)]">
              ZIN MOTOR (NIEUW)
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-50">
              DE ZINNENMACHINE
            </span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <h2 className="text-lg font-black text-[var(--ds-black)] leading-tight">
                Draai de wielen en bouw de zin
              </h2>
              <p className="text-xs text-[var(--ds-black)] opacity-60 mt-0.5">
                Match het onderwerp en de persoonsvorm
              </p>
            </div>
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:text-black group-hover:border-black border-[3px] border-black transition-colors">
              <ArrowRight />
            </div>
          </div>
        </Link>

        {/* Zin bouwen */}
        <Link
          href="/spel/zin-bouwen"
          className="bg-[var(--ds-blue)] p-4 flex flex-col justify-between hover:opacity-90 transition-opacity"
          style={{ minHeight: "75px" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-65">ZIN BOUWEN</span>
          <div className="flex items-end justify-between">
            <span className="text-xs text-[var(--ds-white)] opacity-50">Drag & drop</span>
            <span className="text-[var(--ds-white)] opacity-60"><ArrowRight /></span>
          </div>
        </Link>

        {/* Vul in */}
        <Link
          href="/spel/vul-in"
          className="bg-[var(--ds-white)] p-4 flex flex-col justify-between hover:bg-[var(--ds-gray)] transition-colors"
          style={{ minHeight: "75px" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-55">VUL IN</span>
          <div className="flex items-end justify-between">
            <span className="text-xs text-[var(--ds-black)] opacity-50">Vul het woord in</span>
            <span className="text-[var(--ds-black)] opacity-50"><ArrowRight /></span>
          </div>
        </Link>

        {/* Vertaal */}
        <Link
          href="/spel/vertaal"
          className="bg-[var(--ds-red)] p-4 flex flex-col justify-between hover:opacity-90 transition-opacity"
          style={{ minHeight: "75px" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-65">VERTAAL</span>
          <div className="flex items-end justify-between">
            <span className="text-xs text-[var(--ds-white)] opacity-50">TR → NL</span>
            <span className="text-[var(--ds-white)] opacity-60"><ArrowRight /></span>
          </div>
        </Link>

        {/* Snelronde */}
        <Link
          href="/spel/snelronde"
          className="bg-[var(--ds-yellow)] p-4 flex flex-col justify-between hover:opacity-90 transition-opacity"
          style={{ minHeight: "75px" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-65">SNELRONDE</span>
          <div className="flex items-end justify-between">
            <span className="text-xs text-[var(--ds-black)] opacity-50">Race tegen de klok</span>
            <span className="text-[var(--ds-black)] opacity-60"><ArrowRight /></span>
          </div>
        </Link>

        {/* Flitsen */}
        <Link
          href="/spel/flitsen"
          className="bg-[var(--ds-blue)] border-[3px] border-[var(--ds-black)] p-5 flex flex-col justify-between hover:bg-[var(--ds-white)] transition-colors group"
          style={{ gridColumn: "span 2", minHeight: "90px" }}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-white)] group-hover:text-[var(--ds-black)]">
              FLITSEN (NIEUW)
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] group-hover:text-[var(--ds-black)] opacity-50">
              5s-8s spaced repetition
            </span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <h2 className="text-sm font-black text-[var(--ds-white)] group-hover:text-[var(--ds-black)] leading-tight">
                Herhaal en prent de zinnen in
              </h2>
              <p className="text-[10px] text-[var(--ds-white)] group-hover:text-[var(--ds-black)] opacity-60 mt-0.5">
                Spreek de zinnen hardop na binnen de tijd
              </p>
            </div>
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center flex-shrink-0 group-hover:bg-black group-hover:text-white group-hover:border-white border-[3px] border-white transition-colors">
              <ArrowRight />
            </div>
          </div>
        </Link>


        {/* ── SECTIE HEADER: Meer ───────────────────────────────────── */}
        <div
          className="bg-[var(--ds-black)] px-4 py-2 flex items-center"
          style={{ gridColumn: "span 2" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-40">
            MEER
          </span>
        </div>

        {/* Voortgang */}
        <Link
          href="/meer/voortgang"
          className="bg-[var(--ds-white)] p-4 flex flex-col justify-between hover:bg-[var(--ds-gray)] transition-colors"
          style={{ minHeight: "75px" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-55">VOORTGANG</span>
          <div className="flex items-end justify-between">
            <span className="text-xs text-[var(--ds-black)] opacity-50">Statistieken & rapport</span>
            <span className="text-[var(--ds-black)] opacity-50"><ArrowRight /></span>
          </div>
        </Link>

        {/* Instellingen */}
        <Link
          href="/meer"
          className="bg-[var(--ds-gray)] p-4 flex flex-col justify-between hover:opacity-80 transition-opacity"
          style={{ minHeight: "75px" }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-55">INSTELLINGEN</span>
          <div className="flex items-end justify-between">
            <span className="text-xs text-[var(--ds-black)] opacity-50">Taal & niveau</span>
            <span className="text-[var(--ds-black)] opacity-50"><ArrowRight /></span>
          </div>
        </Link>

      </div>
    </div>
  );
}
