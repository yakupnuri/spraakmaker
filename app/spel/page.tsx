"use client";

import Link from "next/link";
import { useProgress } from "@/lib/hooks";
import { IconArrowRight } from "@/components/Icons";

export default function SpelPage() {
  const { progress } = useProgress();

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
