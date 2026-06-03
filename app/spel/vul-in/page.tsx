"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadSentences, loadSentencesFromSources, shuffle, pickRandom } from "@/lib/gameData";
import { useMoedertaal, useProgress } from "@/lib/hooks";
import { levenshtein } from "@/lib/hooks";
import type { Sentence } from "@/lib/types";

function buildGap(sentence: string): { before: string; target: string; after: string } {
  const words = sentence.split(" ");
  const candidates = words
    .map((w, i) => ({ w: w.replace(/[.,!?;:]$/, ""), i }))
    .filter(({ w }) => w.length > 3);
  const pick = candidates.length
    ? candidates[Math.floor(candidates.length / 2)]
    : { w: words[0], i: 0 };
  const before = words.slice(0, pick.i).join(" ");
  const after = words.slice(pick.i + 1).join(" ");
  return { before, target: pick.w, after };
}

const AVAILABLE_SOURCES = [
  { id: "tc1", label: "Taalcompleet A1", level: "A1", desc: "Basiszinnen voor beginners", color: "var(--ds-blue)", textColor: "var(--ds-white)" },
  { id: "tc2", label: "Taalcompleet A2", level: "A2", desc: "Alledaagse communicatie & grammatica", color: "var(--ds-red)", textColor: "var(--ds-white)" },
  { id: "az", label: "Taalcompleet B1/B2 (AZ)", level: "B1-B2", desc: "Geavanceerde uitdrukkingen & idiomen", color: "var(--ds-yellow)", textColor: "var(--ds-black)" },
  { id: "delftse", label: "Delftse Methode", level: "B1", desc: "Conversatie & teksten voor gevorderden", color: "var(--ds-white)", textColor: "var(--ds-black)" },
  { id: "lessen", label: "Spraakmaker Lessen", level: "A1-B1", desc: "Zinnen uit de cursushofdstukken", color: "var(--ds-gray)", textColor: "var(--ds-black)" },
];

const VUL_IN_EXPLANATIONS: Record<string, {
  empty: string;
  typo: string;
  grammar: string;
  wrongWord: string;
}> = {
  tr: {
    empty: "Hiçbir şey yazmadınız.",
    typo: 'Neredeyse doğru! Bir yazım veya harf hatası yaptınız: "{user}" yerine "{correct}" yazmalıydınız.',
    grammar: 'Dilbilgisi hatası. Muhtemelen fiilin yanlış şahıs veya zaman çekimini kullandınız: "{user}" yerine "{correct}" olmalıydı.',
    wrongWord: 'Yanlış kelime. "{user}" kelimesi bu cümleye uygun değil. Doğrusu "{correct}" olmalıdır.',
  },
  en: {
    empty: "You did not write anything.",
    typo: 'Almost correct! You made a typo: you wrote "{user}" instead of "{correct}".',
    grammar: 'Grammar error. You likely used the wrong conjugation or word form: expected "{correct}" instead of "{user}".',
    wrongWord: 'Incorrect word. The word "{user}" does not fit in this sentence. The correct word is "{correct}".',
  },
  ar: {
    empty: "لم تكتب أي شيء.",
    typo: 'قريب جداً! لقد ارتكبت خطأً إملائياً: كتبت "{user}" بدلاً من "{correct}".',
    grammar: 'خطأ قواعدي. من المحتمل أنك استخدمت تصريفاً خاطئاً للفعل: يجب أن يكون "{correct}" بدلاً من "{user}".',
    wrongWord: 'كلمة خاطئة. كلمة "{user}" لا تناسب هذه الجملة. الكلمة الصحيحة هي "{correct}".',
  },
  uk: {
    empty: "Ви нічого не написали.",
    typo: 'Майже правильно! Ви припустилися друкарської помилки: написали "{user}" замість "{correct}".',
    grammar: 'Граматична помилка. Ймовірно, ви використали неправильне відмінювання або форму слова: очікувалося "{correct}" замість "{user}".',
    wrongWord: 'Неправильне слово. Слово "{user}" не підходить до цього речення. Правильне слово — "{correct}".',
  },
  fa: {
    empty: "چیزی ننوشتید.",
    typo: 'تقریباً درست است! اشتباه تایپی دارید: به جای "{correct}" نوشتید "{user}".',
    grammar: 'خطای گرامری. احتمالاً از شکل یا تصریف اشتباه فعل استفاده کرده‌اید: باید "{correct}" نوشته می‌شد به جای "{user}".',
    wrongWord: 'کلمه نادرست. کلمه "{user}" با این جمله همخوانی ندارد. شکل صحیح آن "{correct}" است.',
  },
  pl: {
    empty: "Nic nie wpisałeś.",
    typo: 'Prawie dobrze! Zrobiłeś literówkę: wpisałeś "{user}" zamiast "{correct}".',
    grammar: 'Błąd gramatyczny. Prawdopodobnie użyłeś złej odmiany czasownika lub formy słowa: oczekiwano "{correct}" zamiast "{user}".',
    wrongWord: 'Błędne słowo. Słowo "{user}" nie pasuje do tego zdania. Poprawne słowo to "{correct}".',
  },
  es: {
    empty: "No escribiste nada.",
    typo: '¡Casi correcto! Cometiste un error de ortografía: escribiste "{user}" en lugar de "{correct}".',
    grammar: 'Error gramatical. Es probable que hayas usado la conjugación o forma de palabra incorrecta: se esperaba "{correct}" en lugar de "{user}".',
    wrongWord: 'Palabra incorrecta. La palabra "{user}" no encaja en esta frase. La palabra correcta es "{correct}".',
  },
  fr: {
    empty: "Vous n'avez rien écrit.",
    typo: 'Presque correct ! Vous avez fait une faute de frappe : vous avez écrit "{user}" au lieu de "{correct}".',
    grammar: 'Erreur de grammaire. Vous avez probablement utilisé la mauvaise conjugaison ou forme de mot : "{correct}" était attendu au lieu de "{user}".',
    wrongWord: 'Mot incorrect. Le mot "{user}" ne convient pas dans cette phrase. Le mot correct est "{correct}".',
  },
  so: {
    empty: "Waxba ma aadan qorin.",
    typo: 'Wax yar baa kuu dhiman! Khalad xagga higaada ah ayaa kaa dhacay: waxaad qortay "{user}" halkii laga rabay "{correct}".',
    grammar: 'Khalad naxwaha ah. Waxaad u sheegtay falka qaab aan sax ahayn: waxaa la rabay "{correct}" bedelkii "{user}".',
    wrongWord: 'Eray qaldan. Erayga "{user}" kuma habboona caddayntan. Erayga saxda ah waa "{correct}".',
  }
};

export default function VulInPage() {
  const { moedertaal } = useMoedertaal();
  const { updateProgress } = useProgress();

  const [selectedSources, setSelectedSources] = useState<string[]>(["tc1", "tc2"]);
  const [gameStarted, setGameStarted] = useState(false);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [current, setCurrent] = useState<Sentence | null>(null);
  const [gap, setGap] = useState({ before: "", target: "", after: "" });
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [scores, setScores] = useState({ goed: 0, fout: 0, score: 0 });
  const [questionNum, setQuestionNum] = useState(0);
  const [loading, setLoading] = useState(false);
  const [correctHistory, setCorrectHistory] = useState<Array<{ tr: string; nl: string; word: string }>>([]);
  const [wrongHistory, setWrongHistory] = useState<Array<{ tr: string; nl: string; userAnswer: string; targetWord: string; explanation: string; unknownWord?: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleSource = (id: string) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedSources.length === AVAILABLE_SOURCES.length) {
      setSelectedSources([]);
    } else {
      setSelectedSources(AVAILABLE_SOURCES.map((s) => s.id));
    }
  };

  function startGame() {
    if (selectedSources.length === 0) return;
    setLoading(true);
    loadSentencesFromSources(selectedSources).then((data) => {
      if (data.length === 0) {
        setLoading(false);
        alert("Geen zinnen gevonden voor de geselecteerde bronnen.");
        return;
      }
      setSentences(shuffle(data));
      setGameStarted(true);
      setLoading(false);
    });
  }

  function loadNext(pool: Sentence[]) {
    const zin = pickRandom(pool);
    setCurrent(zin);
    setGap(buildGap(zin.nl));
    setInput("");
    setFeedback(null);
    setQuestionNum((n) => n + 1);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  useEffect(() => {
    if (sentences.length && gameStarted) loadNext(sentences);
  }, [sentences, gameStarted]);

  function getCommonPrefixLength(a: string, b: string): number {
    let len = 0;
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
      if (a[i] === b[i]) {
        len++;
      } else {
        break;
      }
    }
    return len;
  }

  function explainVulInError(userIn: string, targetWord: string): { explanation: string; unknownWord?: string } {
    const cleanInput = userIn.trim().toLowerCase().replace(/[.,!?;:]/g, "");
    const cleanTarget = targetWord.trim().toLowerCase().replace(/[.,!?;:]/g, "");
    const expl = VUL_IN_EXPLANATIONS[moedertaal] || VUL_IN_EXPLANATIONS["en"];

    if (cleanInput === "") {
      return { explanation: expl.empty };
    }

    const dist = levenshtein(cleanInput, cleanTarget);

    // 1. Typo Check (distance <= 2)
    if (dist <= 2) {
      return {
        explanation: expl.typo.replace("{user}", userIn).replace("{correct}", targetWord),
      };
    }

    // 2. Conjugation/Grammar Check (starts with same prefix of length >= 3)
    const commonPrefixLen = getCommonPrefixLength(cleanInput, cleanTarget);
    if (commonPrefixLen >= 3 && Math.abs(cleanInput.length - cleanTarget.length) <= 3) {
      return {
        explanation: expl.grammar.replace("{user}", userIn).replace("{correct}", targetWord),
      };
    }

    // 3. Completely wrong/unknown word
    return {
      explanation: expl.wrongWord.replace("{user}", userIn).replace("{correct}", targetWord),
      unknownWord: userIn
    };
  }

  function checkAnswer() {
    if (!current || feedback) return;
    const clean = (s: string) => s.toLowerCase().replace(/[.,!?;:]/g, "").trim();
    const cleanInput = clean(input);
    const cleanTarget = clean(gap.target);
    const correct = levenshtein(cleanInput, cleanTarget) <= 1;

    setFeedback(correct ? "correct" : "wrong");
    const points = correct ? 15 : 0;

    setScores((s) => ({
      goed: s.goed + (correct ? 1 : 0),
      fout: s.fout + (correct ? 0 : 1),
      score: s.score + points,
    }));

    if (correct) {
      setCorrectHistory((prev) => [
        { tr: current.tr, nl: current.nl, word: gap.target },
        ...prev
      ]);

      updateProgress((p) => {
        const currentStats = p.games.stats?.vulIn || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
        const updatedHistory = [
          {
            sentence: current.nl,
            translation: current.tr,
            correct: true,
            timestamp: new Date().toISOString(),
            userAnswer: input
          },
          ...currentStats.history
        ].slice(0, 50);

        return {
          ...p,
          games: {
            ...p.games,
            totalPoints: p.games.totalPoints + 15,
            highScores: {
              ...p.games.highScores,
              vulIn: Math.max(p.games.highScores.vulIn, p.games.totalPoints + 15),
            },
            lastPlayDate: new Date().toISOString(),
            stats: {
              ...p.games.stats,
              vulIn: {
                playCount: currentStats.playCount + 1,
                correctCount: currentStats.correctCount + 1,
                wrongCount: currentStats.wrongCount,
                history: updatedHistory
              }
            }
          },
        };
      });
    } else {
      const errAnalysis = explainVulInError(input, gap.target);

      setWrongHistory((prev) => [
        {
          tr: current.tr,
          nl: current.nl,
          userAnswer: input,
          targetWord: gap.target,
          explanation: errAnalysis.explanation,
          unknownWord: errAnalysis.unknownWord
        },
        ...prev
      ]);

      if (errAnalysis.unknownWord) {
        try {
          const stored = localStorage.getItem("spraakmaker-unknown-words");
          const list = stored ? JSON.parse(stored) : [];
          if (!list.some((w: any) => w.word.toLowerCase() === cleanInput)) {
            list.push({
              word: cleanInput,
              target: cleanTarget,
              sentence: current.nl,
              translation: current.tr,
              timestamp: new Date().toISOString()
            });
            localStorage.setItem("spraakmaker-unknown-words", JSON.stringify(list));
          }
        } catch (e) {}
      }

      updateProgress((p) => {
        const currentStats = p.games.stats?.vulIn || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
        const updatedHistory = [
          {
            sentence: current.nl,
            translation: current.tr,
            correct: false,
            timestamp: new Date().toISOString(),
            userAnswer: input,
            explanation: errAnalysis.explanation
          },
          ...currentStats.history
        ].slice(0, 50);

        return {
          ...p,
          games: {
            ...p.games,
            stats: {
              ...p.games.stats,
              vulIn: {
                playCount: currentStats.playCount + 1,
                correctCount: currentStats.correctCount,
                wrongCount: currentStats.wrongCount + 1,
                history: updatedHistory
              }
            }
          },
        };
      });
    }

    setTimeout(() => loadNext(sentences), correct ? 800 : 1600);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ds-white)]">
        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Laden…</p>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--ds-white)] select-none">
        {/* Header — bg-ds-black */}
        <div className="bg-[var(--ds-black)] px-5 py-4">
          <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">vul in</span>
        </div>

        {/* Banner / Title */}
        <div className="bg-[var(--ds-yellow)] border-b-[3px] border-[var(--ds-black)] p-6 text-[var(--ds-black)]">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">
            BRONSELECTIE
          </span>
          <h1 className="text-xl font-black">Kies je bronnen</h1>
          <p className="text-xs opacity-70 mt-1">
            Selecteer de zinsbronnen waarmee je wilt oefenen.
          </p>
        </div>

        {/* Source List */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
          {AVAILABLE_SOURCES.map((src) => {
            const isSelected = selectedSources.includes(src.id);
            return (
              <div
                key={src.id}
                onClick={() => toggleSource(src.id)}
                className={`border-[3px] border-[var(--ds-black)] p-4 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? "bg-[var(--ds-gray)]" : "bg-[var(--ds-white)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Custom Checkbox */}
                  <div
                    className={`w-6 h-6 border-[3px] border-[var(--ds-black)] flex items-center justify-center text-sm font-black transition-colors ${
                      isSelected ? "bg-[var(--ds-black)] text-[var(--ds-white)]" : "bg-[var(--ds-white)]"
                    }`}
                  >
                    {isSelected && "✓"}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-[var(--ds-black)]">{src.label}</h3>
                    <p className="text-[10px] text-[var(--ds-black)] opacity-60 mt-0.5">{src.desc}</p>
                  </div>
                </div>
                {/* Level badge */}
                <span
                  className="px-2 py-0.5 text-[9px] font-black border-[2px] border-[var(--ds-black)]"
                  style={{ backgroundColor: src.color, color: src.textColor }}
                >
                  {src.level}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="border-t-[3px] border-[var(--ds-black)] p-4 bg-[var(--ds-white)] flex flex-col gap-2">
          <button
            onClick={toggleAll}
            className="w-full bg-[var(--ds-white)] text-[var(--ds-black)] border-[3px] border-[var(--ds-black)] py-3 font-bold uppercase tracking-widest text-xs hover:bg-[var(--ds-gray)] cursor-pointer"
          >
            {selectedSources.length === AVAILABLE_SOURCES.length ? "Deselecteer alles" : "Selecteer alles"}
          </button>
          <button
            onClick={startGame}
            disabled={selectedSources.length === 0}
            className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-40 transition-opacity border-none cursor-pointer"
          >
            START SPEL
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header — bg-ds-black */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">vul in</span>
        <span className="text-sm font-bold text-[var(--ds-white)] opacity-60">#{questionNum}</span>
      </div>

      {/* Üst bar — MAVİ blok */}
      <div className="bg-[var(--ds-blue)] px-5 py-3 flex items-center justify-between border-b-[3px] border-[var(--ds-black)]">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">VRAAG {questionNum}</span>
        <span className="text-sm font-bold text-[var(--ds-white)]">{scores.score} pts</span>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4">
        {/* Translation hint */}
        <div className="bg-[var(--ds-gray)] border-[3px] border-[var(--ds-black)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">VERTALING</p>
          <p className="font-medium text-[var(--ds-black)]">{current?.tr}</p>
        </div>

        {/* Sentence with gap */}
        <div className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3">VUL HET WOORD IN</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-medium leading-relaxed">
            {gap.before && <span>{gap.before}</span>}
            <span className="inline-block border-b-[3px] border-dashed border-[var(--ds-black)] px-2 min-w-[60px] text-center">
              {feedback ? (
                <span className={feedback === "correct" ? "text-[var(--ds-green)] font-bold" : "text-[var(--ds-red)] font-bold"}>
                  {gap.target}
                </span>
              ) : (
                <span className="opacity-30">___</span>
              )}
            </span>
            {gap.after && <span>{gap.after}</span>}
          </div>
          {/* Text input */}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
            disabled={!!feedback}
            placeholder="Typ je antwoord…"
            className="w-full mt-4 bg-transparent outline-none font-bold text-lg border-[3px] border-[var(--ds-black)] px-3 py-2 placeholder:opacity-20"
          />
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`border-[3px] border-[var(--ds-black)] px-4 py-3 font-bold text-sm ${
                feedback === "correct"
                  ? "bg-[var(--ds-green)] text-[var(--ds-white)]"
                  : "bg-[var(--ds-red)] text-[var(--ds-white)]"
              }`}
            >
              {feedback === "correct" ? "Goed!" : `Fout — het antwoord is: ${gap.target}`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* DOĞRU VE YANLIŞ CÜMLELERİN LİSTELENDİĞİ KARTLAR */}
        <div className="flex flex-col gap-4 mt-2">
          {/* DOĞRU CÜMLELER KARTI (Yeşil Çerçeveli) */}
          <div className="border-[3px] border-[var(--ds-green)] bg-[var(--ds-white)] p-4 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-green)] mb-3 block">
              Correct ingevulde zinnen ({correctHistory.length})
            </span>
            {correctHistory.length === 0 ? (
              <p className="text-xs text-[var(--ds-black)] opacity-40 italic py-2 text-center">
                Er is nog geen woord correct ingevuld.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                {correctHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 border-b-[2px] border-[var(--ds-gray)] pb-2 last:border-b-0 last:pb-0"
                  >
                    <div className="w-4 h-4 bg-[var(--ds-green)] flex items-center justify-center text-[var(--ds-white)] text-[9px] font-bold mt-0.5 select-none">
                      ✓
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-black text-[var(--ds-black)]">
                        {item.nl} <span className="text-[var(--ds-green)]">({item.word})</span>
                      </p>
                      <p className="text-[10px] md:text-xs text-[var(--ds-black)] opacity-60">
                        {item.tr}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* YANLIŞ CÜMLELER KARTI (Kırmızı Çerçeveli) */}
          <div className="border-[3px] border-[var(--ds-red)] bg-[var(--ds-white)] p-4 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-red)] mb-3 block">
              Onjuiste pogingen ({wrongHistory.length})
            </span>
            {wrongHistory.length === 0 ? (
              <p className="text-xs text-[var(--ds-black)] opacity-40 italic py-2 text-center">
                Geweldig! Nog geen fouten gemaakt.
              </p>
            ) : (
              <div className="flex flex-col gap-3 max-h-[180px] overflow-y-auto pr-1">
                {wrongHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col border-b-[2px] border-[var(--ds-gray)] pb-2 last:border-b-0 last:pb-0 gap-1.5"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-[var(--ds-red)] flex items-center justify-center text-[var(--ds-white)] text-[9px] font-bold mt-0.5 select-none">
                        ✗
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-black text-[var(--ds-red)]">
                          Ingevuld: "{item.userAnswer || "?"}" (Moest zijn: "{item.targetWord}")
                        </p>
                        <p className="text-[10px] md:text-xs text-[var(--ds-black)] opacity-50 italic">
                          Zin: {item.nl} ({item.tr})
                        </p>
                      </div>
                    </div>
                    {/* Hata Nedeni */}
                    <div className="ml-6 bg-[rgba(194,59,34,0.06)] border-l-[3px] border-[var(--ds-red)] p-2 flex flex-col gap-1">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-red)] opacity-80">
                          OORZAAK FOUT:
                        </p>
                        <p className="text-[10px] md:text-xs font-medium text-[var(--ds-black)] mt-0.5">
                          {item.explanation}
                        </p>
                      </div>
                      {item.unknownWord && (
                        <div className="mt-1 pt-1 border-t border-red-200/50">
                          <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest bg-[var(--ds-black)] text-[var(--ds-yellow)] font-sans">
                            Nieuw onbekend woord opgeslagen: "{item.unknownWord}"
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controleer button */}
      <div className="border-t-[3px] border-[var(--ds-black)]">
        <button
          onClick={checkAnswer}
          disabled={!input.trim() || !!feedback}
          className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-5 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-40"
        >
          Controleer
        </button>
      </div>

      {/* 5-blok skor barı */}
      <div className="flex border-t-[3px] border-[var(--ds-black)]">
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-yellow)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-lg font-bold text-[var(--ds-black)]">{scores.score}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-70">SCORE</span>
        </div>
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-red)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-lg font-bold text-[var(--ds-white)]">#{questionNum}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">VRAAG</span>
        </div>
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-blue)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-lg font-bold text-[var(--ds-white)]">{scores.goed}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">GOED</span>
        </div>
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-white)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-lg font-bold text-[var(--ds-red)]">{scores.fout}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-70">FOUT</span>
        </div>
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-green)]">
          <span className="text-lg font-bold text-[var(--ds-white)]">{Math.round((scores.goed / (scores.goed + scores.fout || 1)) * 100)}%</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">JUIST</span>
        </div>
      </div>
    </div>
  );
}
