"use client";

import Link from "next/link";
import { useProgress } from "@/lib/hooks";
import { IconArrowRight } from "@/components/Icons";

export default function SpelPage() {
  const { progress } = useProgress();
  const uiStyle = progress.settings.uiStyle ?? "modern";
  const isModern = uiStyle === "modern";

  if (isModern) {
    return (
      <div className="min-h-screen bg-[var(--ds-white)] pb-24 pt-6 px-4 md:px-8 max-w-4xl mx-auto flex flex-col gap-6">
        {/* Page title & sub */}
        <div className="flex flex-col gap-1 select-none">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ds-black)]">
            Kies een spel
          </h1>
          <p className="text-sm opacity-60">
            Daag jezelf uit en verbeter je grammatica en woordenschat.
          </p>
        </div>

        {/* Modern games grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Card 1: Zin Bouwen */}
          <Link
            href="/spel/zin-bouwen"
            className="bg-[var(--ds-gray)] border border-[var(--border-color-modern)] rounded-2xl p-4 flex flex-row items-center gap-4 hover:border-[var(--ds-blue)] hover:shadow-md transition-all group relative overflow-hidden text-left"
          >
            {/* Left: Large Icon */}
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl flex-shrink-0 select-none">
              🧩
            </div>
            
            {/* Right: Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[var(--ds-black)]">Zin Bouwen</h2>
                <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 rounded-full flex-shrink-0">
                  Drag & Drop
                </span>
              </div>
              <p className="text-xs opacity-60 mt-1 line-clamp-2">
                Sleep en plaats de words in de juiste volgorde om de zin te bouwen.
              </p>
            </div>

            {/* Arrow */}
            <IconArrowRight size={18} className="text-slate-400 group-hover:text-[var(--ds-blue)] group-hover:translate-x-1 transition-all flex-shrink-0 ml-1" />
          </Link>

          {/* Card 2: Vul In */}
          <Link
            href="/spel/vul-in"
            className="bg-[var(--ds-gray)] border border-[var(--border-color-modern)] rounded-2xl p-4 flex flex-row items-center gap-4 hover:border-[var(--ds-blue)] hover:shadow-md transition-all group relative overflow-hidden text-left"
          >
            {/* Left: Large Icon */}
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 text-2xl flex-shrink-0 select-none">
              ✏️
            </div>
            
            {/* Right: Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[var(--ds-black)]">Vul In</h2>
                <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 rounded-full flex-shrink-0">
                  Vul in
                </span>
              </div>
              <p className="text-xs opacity-60 mt-1 line-clamp-2">
                Vul het ontbrekende woord in om de zin compleet te maken.
              </p>
            </div>

            {/* Arrow */}
            <IconArrowRight size={18} className="text-slate-400 group-hover:text-[var(--ds-blue)] group-hover:translate-x-1 transition-all flex-shrink-0 ml-1" />
          </Link>

          {/* Card 3: Vertaal */}
          <Link
            href="/spel/vertaal"
            className="bg-[var(--ds-gray)] border border-[var(--border-color-modern)] rounded-2xl p-4 flex flex-row items-center gap-4 hover:border-[var(--ds-blue)] hover:shadow-md transition-all group relative overflow-hidden text-left"
          >
            {/* Left: Large Icon */}
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 text-2xl flex-shrink-0 select-none">
              🔄
            </div>
            
            {/* Right: Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[var(--ds-black)]">Vertaal</h2>
                <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-teal-50 text-teal-600 rounded-full flex-shrink-0">
                  TR → NL
                </span>
              </div>
              <p className="text-xs opacity-60 mt-1 line-clamp-2">
                Kies de juiste vertaling van de getoonde zin.
              </p>
            </div>

            {/* Arrow */}
            <IconArrowRight size={18} className="text-slate-400 group-hover:text-[var(--ds-blue)] group-hover:translate-x-1 transition-all flex-shrink-0 ml-1" />
          </Link>

          {/* Card 4: Snelronde */}
          <Link
            href="/spel/snelronde"
            className="bg-[var(--ds-gray)] border border-[var(--border-color-modern)] rounded-2xl p-4 flex flex-row items-center gap-4 hover:border-[var(--ds-blue)] hover:shadow-md transition-all group relative overflow-hidden text-left"
          >
            {/* Left: Large Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 text-2xl flex-shrink-0 select-none">
              ⚡
            </div>
            
            {/* Right: Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[var(--ds-black)]">Snelronde</h2>
                <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-red-50 text-red-600 rounded-full flex-shrink-0">
                  60 sec
                </span>
              </div>
              <p className="text-xs opacity-60 mt-1 line-clamp-2">
                Beantwoord zoveel mogelijk vragen binnen 60 seconden.
              </p>
            </div>

            {/* Arrow */}
            <IconArrowRight size={18} className="text-slate-400 group-hover:text-[var(--ds-blue)] group-hover:translate-x-1 transition-all flex-shrink-0 ml-1" />
          </Link>

          {/* Card 5: Zin Motor */}
          <Link
            href="/spel/zin-motor"
            className="bg-[var(--ds-gray)] border border-[var(--border-color-modern)] rounded-2xl p-4 flex flex-row items-center gap-4 hover:border-[var(--ds-blue)] hover:shadow-md transition-all group relative overflow-hidden text-left"
          >
            {/* Left: Large Icon */}
            <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-600 text-2xl flex-shrink-0 select-none">
              ⚙️
            </div>
            
            {/* Right: Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[var(--ds-black)]">Zin Motor</h2>
                <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-yellow-50 text-yellow-600 rounded-full flex-shrink-0">
                  Zinnenmachine
                </span>
              </div>
              <p className="text-xs opacity-60 mt-1 line-clamp-2">
                Draai de wielen en match het onderwerp met de persoonsvorm.
              </p>
            </div>

            {/* Arrow */}
            <IconArrowRight size={18} className="text-slate-400 group-hover:text-[var(--ds-blue)] group-hover:translate-x-1 transition-all flex-shrink-0 ml-1" />
          </Link>

          {/* Card 6: Flitsen */}
          <Link
            href="/spel/flitsen"
            className="bg-[var(--ds-gray)] border border-[var(--border-color-modern)] rounded-2xl p-4 flex flex-row items-center gap-4 hover:border-[var(--ds-blue)] hover:shadow-md transition-all group relative overflow-hidden text-left"
          >
            {/* Left: Large Icon */}
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 text-2xl flex-shrink-0 select-none">
              📣
            </div>
            
            {/* Right: Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[var(--ds-black)]">Flitsen</h2>
                <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 rounded-full flex-shrink-0">
                  Spaced Rep
                </span>
              </div>
              <p className="text-xs opacity-60 mt-1 line-clamp-2">
                Luister, lees en spreek de zinnen hardop na binnen de tijdslimiet.
              </p>
            </div>

            {/* Arrow */}
            <IconArrowRight size={18} className="text-slate-400 group-hover:text-[var(--ds-blue)] group-hover:translate-x-1 transition-all flex-shrink-0 ml-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header — bg-ds-black */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">spelkeuze</span>
        <span className="text-sm font-bold text-[var(--ds-white)] opacity-60">6 spellen</span>
      </div>

      {/* Asimetrik Mondrian grid */}
      <div
        className="flex-1 p-[3px] bg-[var(--ds-black)]"
      >
        <div
          className="grid gap-[3px] h-full"
          style={{
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "140px 140px 140px 140px",
          }}
        >
          {/* KIRMIZI (row-span-2, sol tam sütun): Zin bouwen */}
          <Link
            href="/spel/zin-bouwen"
            className="bg-[var(--ds-red)] p-6 flex flex-col justify-between hover:opacity-90 transition-opacity group"
            style={{ gridRow: "span 2" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">
              ZIN BOUWEN
            </span>
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-xl font-bold text-[var(--ds-white)]">Maak de zin</h2>
              <p className="text-xs text-[var(--ds-white)] opacity-50 mt-1">drag & drop</p>
            </div>
            <div className="flex justify-end">
              <IconArrowRight size={20} />
            </div>
          </Link>

          {/* MAVİ (sağ üst): Vul in */}
          <Link
            href="/spel/vul-in"
            className="bg-[var(--ds-blue)] p-5 flex flex-col justify-between hover:opacity-90 transition-opacity group"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">
              VUL IN
            </span>
            <h2 className="font-bold text-[var(--ds-white)]">Vul het woord in</h2>
          </Link>

          {/* İç grid (sağ alt, 2 küçük blok) */}
          <div className="grid grid-cols-2 gap-[3px]">
            {/* SARI — Vertaal */}
            <Link
              href="/spel/vertaal"
              className="bg-[var(--ds-yellow)] p-4 flex flex-col justify-between hover:opacity-90 transition-opacity"
            >
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-60">
                VERTAAL
              </span>
              <span className="text-sm font-bold text-[var(--ds-black)]">TR→NL</span>
            </Link>

            {/* BEYAZ (kalın border) — Snelronde */}
            <Link
              href="/spel/snelronde"
              className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] p-4 flex flex-col justify-between hover:bg-[var(--ds-gray)] transition-colors"
            >
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-60">
                SNELRONDE
              </span>
              <span className="text-sm font-bold text-[var(--ds-black)]">60 sec</span>
            </Link>
          </div>

          {/* SARI & KALIN SİYAH BORDER — Zin Motor (Nieuw Spel - 3. Satırda col-span-2) */}
          <Link
            href="/spel/zin-motor"
            className="bg-[var(--ds-yellow)] border-[3px] border-[var(--ds-black)] p-5 flex flex-col justify-between hover:bg-[var(--ds-white)] hover:text-[var(--ds-black)] transition-colors col-span-2 group"
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-black)]">
                ZIN MOTOR (NIEUW)
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-50">
                zinnenmachine
              </span>
            </div>
            <div className="flex items-end justify-between mt-2">
              <div>
                <h2 className="text-lg font-black text-[var(--ds-black)]">Draai de wielen en bouw de zin</h2>
                <p className="text-xs text-[var(--ds-black)] opacity-60 mt-0.5">match het onderwerp en de persoonsvorm</p>
              </div>
              <IconArrowRight size={22} className="text-[var(--ds-black)] group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* MAVİ & BEYAZ KONTRAST — Flitsen (Nieuw Spel - 4. Satırda col-span-2) */}
          <Link
            href="/spel/flitsen"
            className="bg-[var(--ds-blue)] border-[3px] border-[var(--ds-black)] p-5 flex flex-col justify-between hover:bg-[var(--ds-white)] hover:text-[var(--ds-black)] transition-colors col-span-2 group"
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
                <h2 className="text-lg font-black text-[var(--ds-white)] group-hover:text-[var(--ds-black)]">Herhaal en prent de zinnen in</h2>
                <p className="text-xs text-[var(--ds-white)] group-hover:text-[var(--ds-black)] opacity-60 mt-0.5">luister, lees en spreek hardop binnen de tijd</p>
              </div>
              <IconArrowRight size={22} className="text-[var(--ds-white)] group-hover:text-[var(--ds-black)] group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
