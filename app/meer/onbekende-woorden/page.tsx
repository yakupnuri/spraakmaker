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
      <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
        {/* Header */}
        <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">herhaling</span>
          <span className="text-xs font-black text-[var(--ds-yellow)] uppercase tracking-widest">
            {currentIndex + 1} / {wordList.length}
          </span>
        </div>

        {/* Banner */}
        <div className="bg-[var(--ds-blue)] border-b-[3px] border-[var(--ds-black)] p-5 text-[var(--ds-white)]">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">WOORDTRAINING</p>
          <h1 className="text-lg font-black">Vul het juiste woord in</h1>
        </div>

        <div className="flex-1 p-4 flex flex-col gap-4">
          {/* Context sentence */}
          <div className="bg-[var(--ds-gray)] border-[3px] border-[var(--ds-black)] p-4 flex flex-col">
            <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest mb-1">VERTALING</span>
            <p className="font-bold text-sm text-[var(--ds-black)]">"{currentItem.translation}"</p>
            <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest mt-3 mb-1">CONTEXT ZIN</span>
            <p className="font-medium text-base text-[var(--ds-black)] mt-0.5">{gapSentence}</p>
          </div>

          {/* User entry */}
          <div className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] p-4">
            <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest block mb-2">JOUW POGING</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={showAnswer}
              placeholder="Typ het correcte woord..."
              className="w-full bg-transparent border-[3px] border-[var(--ds-black)] px-3 py-2 outline-none font-bold text-lg placeholder:opacity-30"
            />
            {showAnswer && (
              <div className="mt-3 pt-2 border-t border-[var(--ds-gray)]">
                <p className="text-xs">
                  <span className="font-bold opacity-50 uppercase tracking-widest block text-[9px]">CORRECTE ANTWOORD</span>
                  <span className="text-lg font-black text-[var(--ds-black)]">{currentItem.target}</span>
                </p>
                <p className="text-xs mt-1">
                  <span className="font-bold opacity-50 uppercase tracking-widest block text-[9px] text-[var(--ds-red)]">JE VORIGE FOUT</span>
                  <span className="text-xs line-through text-[var(--ds-red)]">{currentItem.word}</span>
                </p>
              </div>
            )}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`border-[3px] border-[var(--ds-black)] p-4 font-bold text-sm ${
              feedback === "correct" ? "bg-[var(--ds-green)] text-[var(--ds-white)]" : "bg-[var(--ds-red)] text-[var(--ds-white)]"
            }`}>
              {feedback === "correct" ? (
                <div>
                  <p>Goed zo!</p>
                  <button
                    onClick={() => {
                      deleteWord(currentItem.word);
                      nextPracticeWord();
                    }}
                    className="mt-2 bg-[var(--ds-black)] text-[var(--ds-white)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity cursor-pointer border-none"
                  >
                    Verwijder uit foutenlijst
                  </button>
                </div>
              ) : (
                "Niet helemaal juist. Blijf oefenen!"
              )}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="border-t-[3px] border-[var(--ds-black)] p-4 flex flex-col gap-2 bg-[var(--ds-white)]">
          {!showAnswer ? (
            <button
              onClick={checkPracticeAnswer}
              disabled={!inputValue.trim()}
              className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer border-none"
            >
              CONTROLEER
            </button>
          ) : (
            <button
              onClick={nextPracticeWord}
              className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none"
            >
              VOLGENDE
            </button>
          )}
          <button
            onClick={() => setPracticeMode(false)}
            className="w-full bg-[var(--ds-white)] text-[var(--ds-black)] border-[3px] border-[var(--ds-black)] py-3 font-bold uppercase tracking-widest text-xs hover:bg-[var(--ds-gray)] cursor-pointer"
          >
            STOP TRAINING
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex justify-between items-center">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">onbekende woorden</span>
        <Link href="/meer" className="text-xs font-bold uppercase tracking-widest text-[var(--ds-yellow)]">
          SLUITEN
        </Link>
      </div>

      {/* Banner */}
      <div className="bg-[var(--ds-yellow)] border-b-[3px] border-[var(--ds-black)] p-5 text-[var(--ds-black)]">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">
          PERSOONLIJKE LIJST
        </span>
        <h1 className="text-xl font-black">Fouten & Woordenlijst</h1>
        <p className="text-xs opacity-70 mt-1">
          Woorden die je verkeerd hebt ingevuld in 'Vul in' worden hier bewaard om te herhalen.
        </p>
      </div>

      {/* Control bar */}
      {wordList.length > 0 && (
        <div className="p-4 bg-[var(--ds-white)] border-b-[3px] border-[var(--ds-black)]">
          <button
            onClick={startPractice}
            className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none"
          >
            START HERHALING ({wordList.length})
          </button>
        </div>
      )}

      {/* List content */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
        {wordList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <span className="text-4xl animate-bounce">🎉</span>
            <p className="font-bold text-sm mt-3 text-[var(--ds-black)]">Geen onbekende woorden!</p>
            <p className="text-xs opacity-50 mt-1">Je hebt in 'Vul in' nog geen onjuiste woorden ingetypt.</p>
          </div>
        ) : (
          wordList.map((item, index) => (
            <div
              key={index}
              className="border-[3px] border-[var(--ds-black)] bg-[var(--ds-white)] p-4 flex flex-col gap-2 relative"
            >
              <div className="flex justify-between items-start gap-4 pr-8">
                <div>
                  <h3 className="font-black text-sm text-[var(--ds-black)]">
                    Ingevuld: <span className="text-[var(--ds-red)] font-bold">"{item.word}"</span>
                  </h3>
                  <h4 className="font-black text-sm text-[var(--ds-green)] mt-0.5">
                    Correct: <span className="font-bold">"{item.target}"</span>
                  </h4>
                </div>
                <button
                  onClick={() => deleteWord(item.word)}
                  className="absolute right-3 top-3 text-[var(--ds-red)] font-bold text-lg hover:scale-110 transition-transform cursor-pointer bg-transparent border-none"
                  title="Verwijder dit woord"
                >
                  ×
                </button>
              </div>

              <div className="bg-[var(--ds-gray)] p-2.5 border-l-[3px] border-[var(--ds-black)] mt-1">
                <span className="text-[8px] font-bold opacity-50 uppercase tracking-widest block">CONTEXT ZIN</span>
                <p className="text-xs font-semibold text-[var(--ds-black)] mt-0.5">"{item.sentence}"</p>
                <p className="text-[10px] text-[var(--ds-black)] opacity-60 italic mt-0.5">"{item.translation}"</p>
              </div>

              <div className="flex justify-between items-center text-[9px] text-[var(--ds-black)] opacity-40 mt-1">
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
