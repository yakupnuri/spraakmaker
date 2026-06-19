"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/hooks";

interface UnknownWord {
  word: string;
  target: string;
  sentence: string;
  translation: string;
  timestamp: string;
}

export default function OnbekendeWoordenPage() {
  const [wordList, setWordList] = useState<UnknownWord[]>([]);
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("spraakmaker-unknown-words");
      if (stored) {
        setWordList(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const deleteWord = (wordToDelete: string) => {
    const updated = wordList.filter((w) => w.word !== wordToDelete);
    setWordList(updated);
    localStorage.setItem("spraakmaker-unknown-words", JSON.stringify(updated));
  };

  const startPractice = () => {
    if (wordList.length === 0) return;
    setPracticeMode(true);
    setCurrentIndex(0);
    setInputValue("");
    setFeedback(null);
    setShowAnswer(false);
  };

  const checkPracticeAnswer = () => {
    const currentItem = wordList[currentIndex];
    const cleanIn = inputValue.trim().toLowerCase().replace(/[.,!?;:]/g, "");
    const cleanTar = currentItem.target.toLowerCase().replace(/[.,!?;:]/g, "");
    const isCorrect = cleanIn === cleanTar;

    setFeedback(isCorrect ? "correct" : "wrong");
    setShowAnswer(true);
  };

  const nextPracticeWord = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= wordList.length) {
      setPracticeMode(false);
    } else {
      setCurrentIndex(nextIdx);
      setInputValue("");
      setFeedback(null);
      setShowAnswer(false);
    }
  };

  if (practiceMode && wordList.length > 0) {
    const currentItem = wordList[currentIndex];
    const targetClean = currentItem.target.toLowerCase().replace(/[.,!?;:]/g, "");
    const gapSentence = currentItem.sentence.replace(new RegExp(`\\b${targetClean}\\b`, "i"), "_____");

    return (
      <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24 select-none">
        {/* Header */}
        <header className="bg-[var(--surface)] border-b border-[var(--border)] px-5 py-4 shadow-sm flex items-center justify-between shrink-0">
          <span className="text-sm font-black uppercase tracking-wider text-[var(--text)]">herhaling</span>
          <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full">
            {currentIndex + 1} / {wordList.length}
          </span>
        </header>

        {/* Banner */}
        <div className="bg-[var(--primary)] p-5 text-white">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">WOORDTRAINING</p>
          <h1 className="text-xl font-extrabold">Vul het juiste woord in</h1>
        </div>

        <div className="flex-grow p-4 flex flex-col gap-4 w-full max-w-lg mx-auto justify-center">
          {/* Context sentence */}
          <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-2xl shadow-sm flex flex-col gap-2.5">
            <div>
              <span className="text-[9px] font-black text-[var(--accent)] uppercase tracking-widest block">VERTALING (Çeviri)</span>
              <p className="font-bold text-sm text-[var(--text)] mt-1">"{currentItem.translation}"</p>
            </div>
            <div className="border-t border-[var(--border)] pt-3.5">
              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block">CONTEXT ZIN (Bağlam)</span>
              <p className="font-semibold text-base text-[var(--text)] mt-1">{gapSentence}</p>
            </div>
          </div>

          {/* User entry */}
          <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-2xl shadow-sm flex flex-col gap-3">
            <label htmlFor="attempt" className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block">JOUW POGING (Senin Cevabın)</label>
            <input
              id="attempt"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={showAnswer}
              placeholder="Typ het correcte woord..."
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none font-semibold text-sm placeholder:opacity-30 text-[var(--text)] transition-all focus:border-[var(--accent)]"
            />
            {showAnswer && (
              <div className="mt-2 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
                <div>
                  <span className="font-black opacity-60 uppercase tracking-widest block text-[8px] text-[var(--text-muted)]">CORRECTE ANTWOORD</span>
                  <span className="text-base font-extrabold text-[var(--success)]">"{currentItem.target}"</span>
                </div>
                <div>
                  <span className="font-black opacity-60 uppercase tracking-widest block text-[8px] text-[var(--danger)]">JE VORIGE FOUT (Önceki Hatan)</span>
                  <span className="text-sm line-through text-[var(--danger)] font-bold">"{currentItem.word}"</span>
                </div>
              </div>
            )}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`border p-4 rounded-xl font-bold text-sm shadow-sm ${
              feedback === "correct" 
                ? "bg-[var(--success-soft)] border-[var(--success)]/10 text-[var(--success)]" 
                : "bg-[var(--danger-soft)] border-[var(--danger)]/10 text-[var(--danger)]"
            }`}>
              {feedback === "correct" ? (
                <div className="flex flex-col gap-2.5">
                  <p>Goed zo! (Tebrikler!)</p>
                  <button
                    onClick={() => {
                      deleteWord(currentItem.word);
                      nextPracticeWord();
                    }}
                    className="self-start bg-[var(--success)] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all border-none cursor-pointer"
                  >
                    Verwijder uit foutenlijst (Listeden Çıkar)
                  </button>
                </div>
              ) : (
                "Niet helemaal juist. Blijf oefenen! (Tekrar dene!)"
              )}
            </div>
          )}
        </div>

        {/* Fixed footer actions aligned securely */}
        <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] z-40 p-3 shadow-md pb-[env(safe-area-inset-bottom)]">
          <div className="w-full max-w-lg mx-auto flex flex-col gap-2">
            {!showAnswer ? (
              <button
                onClick={checkPracticeAnswer}
                disabled={!inputValue.trim()}
                className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer border-none shadow-sm active:scale-98"
              >
                CONTROLEER
              </button>
            ) : (
              <button
                onClick={nextPracticeWord}
                className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 transition-all cursor-pointer border-none shadow-sm active:scale-98"
              >
                VOLGENDE
              </button>
            )}
            <button
              onClick={() => setPracticeMode(false)}
              className="w-full bg-[var(--surface-2)] text-[var(--text-muted)] py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-95 transition-all cursor-pointer border border-[var(--border)] active:scale-98"
            >
              STOP TRAINING
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24 select-none">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] px-5 py-4 shadow-sm flex justify-between items-center shrink-0">
        <span className="text-sm font-black uppercase tracking-wider text-[var(--text)]">onbekende woorden</span>
        <Link href="/meer" className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-0.5 rounded-full border border-[var(--accent)]/15">
          SLUITEN
        </Link>
      </header>

      {/* Banner */}
      <div className="bg-[var(--warning)]/10 border-b border-[var(--border)] p-5 text-[var(--text)] flex flex-col gap-0.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--warning)] block">
          PERSOONLIJKE LIJST (Hata Defteri)
        </span>
        <h1 className="text-xl font-extrabold">Fouten & Woordenlijst</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1 font-semibold leading-normal">
          Woorden die je verkeerd hebt ingevuld in 'Vul in' worden hier bewaard om te herhalen.
        </p>
      </div>

      {/* Control bar */}
      {wordList.length > 0 && (
        <div className="p-4 bg-[var(--surface)] border-b border-[var(--border)] sticky top-[53px] z-30 shadow-sm shrink-0">
          <button
            onClick={startPractice}
            className="w-full max-w-lg mx-auto bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 transition-all cursor-pointer border-none shadow-sm active:scale-98 flex items-center justify-center gap-2"
          >
            START HERHALING (Tekrar Başlat)
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-mono">{wordList.length}</span>
          </button>
        </div>
      )}

      {/* List content */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto w-full max-w-lg mx-auto">
        {wordList.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-16 gap-3">
            <span className="text-5xl animate-bounce">🎉</span>
            <div>
              <p className="font-extrabold text-sm text-[var(--text)]">Geen onbekende woorden!</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 font-semibold">Je hebt in 'Vul in' nog geen onjuiste woorden ingetypt.</p>
            </div>
          </div>
        ) : (
          wordList.map((item, index) => (
            <div
              key={index}
              className="border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-4 flex flex-col gap-2 relative shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start gap-4 pr-8">
                <div>
                  <h3 className="font-bold text-xs text-[var(--text-muted)] uppercase tracking-wide">
                    Ingevuld: <span className="text-[var(--danger)] font-black">"{item.word}"</span>
                  </h3>
                  <h4 className="font-bold text-xs text-[var(--success)] uppercase tracking-wide mt-1">
                    Correct: <span className="font-black">"{item.target}"</span>
                  </h4>
                </div>
                <button
                  onClick={() => deleteWord(item.word)}
                  className="absolute right-3 top-3 w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors cursor-pointer border-none"
                  title="Verwijder dit woord"
                >
                  ✕
                </button>
              </div>

              <div className="bg-[var(--surface-2)] p-3 rounded-xl border-l-2 border-[var(--primary)] mt-1 flex flex-col gap-1">
                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">CONTEXT ZIN (Bağlam)</span>
                <p className="text-xs font-bold text-[var(--text)]">"{item.sentence}"</p>
                <p className="text-[10px] text-[var(--text-muted)] font-semibold italic">"{item.translation}"</p>
              </div>

              <div className="flex justify-between items-center text-[9px] text-[var(--text-muted)] font-mono mt-1 pt-1 border-t border-[var(--border)]/40">
                <span>VERKEERD INGEVULD</span>
                <span>{new Date(item.timestamp).toLocaleDateString("nl-NL")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
