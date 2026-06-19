"use client";

import Link from "next/link";
import { IconArrowRight } from "@/components/Icons";

export default function SpelPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24 pt-6 px-4 md:px-8 max-w-4xl mx-auto flex flex-col gap-6">
      {/* Page title & sub */}
      <div className="flex flex-col gap-1 select-none">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          Kies een spel
        </h1>
        <p className="text-sm opacity-60 text-[var(--text-muted)]">
          Daag jezelf uit en verbeter je grammatica en woordenschat.
        </p>
      </div>

      {/* Modern games grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Card 1: Zin Bouwen */}
        <Link
          href="/spel/zin-bouwen"
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-row items-center gap-4 hover:border-[var(--accent)] hover:shadow-md transition-all group relative overflow-hidden text-left"
        >
          {/* Left: Large Icon */}
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl flex-shrink-0 select-none">
            🧩
          </div>
          
          {/* Right: Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[var(--text)]">Zin Bouwen</h2>
              <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/45 text-blue-600 dark:text-blue-400 rounded-full flex-shrink-0">
                Drag & Drop
              </span>
            </div>
            <p className="text-xs opacity-60 mt-1 line-clamp-2 text-[var(--text-muted)]">
              Sleep en plaats de words in de juiste volgorde om de zin te bouwen.
            </p>
          </div>

          {/* Arrow */}
          <IconArrowRight size={18} className="text-slate-400 group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all flex-shrink-0 ml-1" />
        </Link>

        {/* Card 2: Vul In */}
        <Link
          href="/spel/vul-in"
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-row items-center gap-4 hover:border-[var(--accent)] hover:shadow-md transition-all group relative overflow-hidden text-left"
        >
          {/* Left: Large Icon */}
          <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 dark:text-orange-400 text-2xl flex-shrink-0 select-none">
            ✏️
          </div>
          
          {/* Right: Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[var(--text)]">Vul In</h2>
              <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/45 text-orange-600 dark:text-orange-400 rounded-full flex-shrink-0">
                Vul in
              </span>
            </div>
            <p className="text-xs opacity-60 mt-1 line-clamp-2 text-[var(--text-muted)]">
              Vul het ontbrekende woord in om de zin compleet te maken.
            </p>
          </div>

          {/* Arrow */}
          <IconArrowRight size={18} className="text-slate-400 group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all flex-shrink-0 ml-1" />
        </Link>

        {/* Card 3: Vertaal */}
        <Link
          href="/spel/vertaal"
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-row items-center gap-4 hover:border-[var(--accent)] hover:shadow-md transition-all group relative overflow-hidden text-left"
        >
          {/* Left: Large Icon */}
          <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/30 flex items-center justify-center text-teal-600 dark:text-teal-400 text-2xl flex-shrink-0 select-none">
            🔄
          </div>
          
          {/* Right: Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[var(--text)]">Vertaal</h2>
              <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/45 text-teal-600 dark:text-teal-400 rounded-full flex-shrink-0">
                TR → NL
              </span>
            </div>
            <p className="text-xs opacity-60 mt-1 line-clamp-2 text-[var(--text-muted)]">
              Kies de juiste vertaling van de getoonde zin.
            </p>
          </div>

          {/* Arrow */}
          <IconArrowRight size={18} className="text-slate-400 group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all flex-shrink-0 ml-1" />
        </Link>

        {/* Card 4: Snelronde */}
        <Link
          href="/spel/snelronde"
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-row items-center gap-4 hover:border-[var(--accent)] hover:shadow-md transition-all group relative overflow-hidden text-left"
        >
          {/* Left: Large Icon */}
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400 text-2xl flex-shrink-0 select-none">
            ⚡
          </div>
          
          {/* Right: Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[var(--text)]">Snelronde</h2>
              <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-950/45 text-red-600 dark:text-red-400 rounded-full flex-shrink-0">
                60 sec
              </span>
            </div>
            <p className="text-xs opacity-60 mt-1 line-clamp-2 text-[var(--text-muted)]">
              Beantwoord zoveel mogelijk vragen binnen 60 seconden.
            </p>
          </div>

          {/* Arrow */}
          <IconArrowRight size={18} className="text-slate-400 group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all flex-shrink-0 ml-1" />
        </Link>

        {/* Card 5: Zin Motor */}
        <Link
          href="/spel/zin-motor"
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-row items-center gap-4 hover:border-[var(--accent)] hover:shadow-md transition-all group relative overflow-hidden text-left"
        >
          {/* Left: Large Icon */}
          <div className="w-14 h-14 rounded-2xl bg-yellow-100 dark:bg-yellow-950/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 text-2xl flex-shrink-0 select-none">
            ⚙️
          </div>
          
          {/* Right: Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[var(--text)]">Zin Motor</h2>
              <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-yellow-50 dark:bg-yellow-950/45 text-yellow-600 dark:text-yellow-400 rounded-full flex-shrink-0">
                Zinnenmachine
              </span>
            </div>
            <p className="text-xs opacity-60 mt-1 line-clamp-2 text-[var(--text-muted)]">
              Draai de wielen en match het onderwerp met de persoonsvorm.
            </p>
          </div>

          {/* Arrow */}
          <IconArrowRight size={18} className="text-slate-400 group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all flex-shrink-0 ml-1" />
        </Link>

        {/* Card 6: Flitsen */}
        <Link
          href="/spel/flitsen"
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-row items-center gap-4 hover:border-[var(--accent)] hover:shadow-md transition-all group relative overflow-hidden text-left"
        >
          {/* Left: Large Icon */}
          <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-2xl flex-shrink-0 select-none">
            📣
          </div>
          
          {/* Right: Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[var(--text)]">Flitsen</h2>
              <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/45 text-purple-600 dark:text-purple-400 rounded-full flex-shrink-0">
                Spaced Rep
              </span>
            </div>
            <p className="text-xs opacity-60 mt-1 line-clamp-2 text-[var(--text-muted)]">
              Luister, lees en spreek de zinnen hardop na binnen de tijdslimiet.
            </p>
          </div>

          {/* Arrow */}
          <IconArrowRight size={18} className="text-slate-400 group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all flex-shrink-0 ml-1" />
        </Link>
      </div>
    </div>
  );
}
