"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { loadSentences, shuffle, pickRandom } from "@/lib/gameData";
import { useMoedertaal, useProgress } from "@/lib/hooks";
import type { Sentence } from "@/lib/types";

interface SortableWordProps {
  id: string;
  word: string;
}

function SortableWord({ id, word }: SortableWordProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="px-3 py-2 bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] font-bold text-sm cursor-grab active:cursor-grabbing select-none touch-none"
    >
      {word}
    </div>
  );
}

const ZIN_BOUWEN_EXPLANATIONS: Record<string, {
  wordOrder: string;
  missing: string;
  extra: string;
  errorStart: string;
  defaultError: string;
}> = {
  tr: {
    wordOrder: "Tüm kelimeler doğru, ancak sıralaması yanlış. Hollandaca'da fiil pozisyonuna (ikinci sırada veya sonda olmasına) dikkat edin.",
    missing: "Eksik kelimeler: ",
    extra: "Fazla veya yanlış kelimeler: ",
    errorStart: "Hata {index}. kelimede başladı: \"{user}\" yerine \"{correct}\" olmalıydı.",
    defaultError: "Kelimelerin seçimi veya sıralaması hatalı.",
  },
  en: {
    wordOrder: "All words are correct, but the order is wrong. In Dutch, pay attention to the verb position (second position or at the end).",
    missing: "Missing words: ",
    extra: "Extra or incorrect words: ",
    errorStart: "Error started at word {index}: expected \"{correct}\" instead of \"{user}\".",
    defaultError: "Word choice or word order is incorrect.",
  },
  ar: {
    wordOrder: "جميع الكلمات صحيحة، لكن الترتيب خاطئ. في اللغة الهولندية، انتبه لمكان الفعل (الموقع الثاني أو في النهاية).",
    missing: "الكلمات المفقودة: ",
    extra: "كلمات زائدة أو خاطئة: ",
    errorStart: "بدأ الخطأ عند الكلمة {index}: يجب أن تكون \"{correct}\" بدلاً من \"{user}\".",
    defaultError: "اختيار الكلمات أو ترتيبها غير صحيح.",
  },
  uk: {
    wordOrder: "Всі слова правильні, але порядок невірний. У нідерландській мові зверніть увагу на позицію дієслова (друге місце або в кінці).",
    missing: "Пропущені слова: ",
    extra: "Зайві або неправильні слова: ",
    errorStart: "Помилка почалася на слові {index}: очікувалося \"{correct}\" замість \"{user}\".",
    defaultError: "Неправильний вибір слів або їх порядок.",
  },
  fa: {
    wordOrder: "همه کلمات درست هستند، اما ترتیب آنها اشتباه است. در زبان هلندی، به جایگاه فعل (موقعیت دوم یا در انتها) توجه کنید.",
    missing: "کلمات جاافتاده: ",
    extra: "کلمات اضافی یا نادرست: ",
    errorStart: "خطا از کلمه {index} شروع شد: باید \"{correct}\" قرار می‌گرفت به جای \"{user}\".",
    defaultError: "انتخاب کلمات یا ترتیب آن‌ها نادرست است.",
  },
  pl: {
    wordOrder: "Wszystkie słowa są poprawne, ale kolejność jest błędna. W języku niderlandzkim zwróć uwagę na pozycję czasownika (druga pozycja lub na końcu).",
    missing: "Brakujące słowa: ",
    extra: "Nadmiarowe lub błędne słowa: ",
    errorStart: "Błąd zaczął się przy słowie {index}: powinno być \"{correct}\" zamiast \"{user}\".",
    defaultError: "Wybór słów lub kolejność jest niepoprawna.",
  },
  es: {
    wordOrder: "Todas las palabras son correctas, pero el orden es incorrecto. En neerlandés, presta atención a la posición del verbo (segunda posición o al final).",
    missing: "Palabras que faltan: ",
    extra: "Palabras sobrantes o incorrectas: ",
    errorStart: "El error comenzó en la palabra {index}: se esperaba \"{correct}\" en lugar de \"{user}\".",
    defaultError: "La elección o el orden de las palabras es incorrecto.",
  },
  fr: {
    wordOrder: "Tous les mots sont corrects, mais l'ordre est incorrect. En néerlandais, faites attention à la position du verbe (deuxième position ou à la fin).",
    missing: "Mots manquants : ",
    extra: "Mots superflus ou incorrects : ",
    errorStart: "L'erreur a commencé au mot {index} : \"{correct}\" était attendu au lieu de \"{user}\".",
    defaultError: "Le choix ou l'ordre des mots est incorrect.",
  },
  so: {
    wordOrder: "Dhammaan ereyadu waa sax, laakiin kala horreyntooda ayaa qaldan. Af-Hollandeeska, u fiirso meesha uu falka kaga jiro (booska labaad ama dhammaadka).",
    missing: "Erayada ka maqan: ",
    extra: "Erayo dheeraad ah ama qaldan: ",
    errorStart: "Khaladku wuxuu ka bilaabmay erayga {index}: waxaa la rabay \"{correct}\" bedelkii \"{user}\".",
    defaultError: "Doorashada ama kala horreynta ereyada ayaa qaldan.",
  }
};

function explainDifference(userAnswer: string, correctAnswer: string, lang: string): string {
  const userWords = userAnswer.split(" ");
  const correctWords = correctAnswer.split(" ");
  const expl = ZIN_BOUWEN_EXPLANATIONS[lang] || ZIN_BOUWEN_EXPLANATIONS["en"];

  // Tüm kelimeler aynı ama sadece sıra farklıysa
  const userSorted = [...userWords].sort().join(" ").toLowerCase();
  const correctSorted = [...correctWords].sort().join(" ").toLowerCase();

  if (userSorted === correctSorted) {
    return expl.wordOrder;
  }

  // Eksik ve fazla kelimeleri kontrol edelim
  const missing = correctWords.filter((w) => !userWords.includes(w));
  const extra = userWords.filter((w) => !correctWords.includes(w));

  let explanation = "";
  if (missing.length > 0) {
    explanation += `${expl.missing}"${missing.join(", ")}". `;
  }
  if (extra.length > 0) {
    explanation += `${expl.extra}"${extra.join(", ")}". `;
  }

  // Kelimeleri tek tek karşılaştırıp ilk uyuşmazlığın konumunu belirtelim
  for (let i = 0; i < Math.min(userWords.length, correctWords.length); i++) {
    if (userWords[i].toLowerCase() !== correctWords[i].toLowerCase()) {
      explanation += expl.errorStart
        .replace("{index}", String(i + 1))
        .replace("{user}", userWords[i])
        .replace("{correct}", correctWords[i]);
      break;
    }
  }

  return explanation || expl.defaultError;
}

function RevealableText({ text, isAdvanced }: { text: string; isAdvanced: boolean }) {
  const [revealed, setRevealed] = useState(false);
  if (!isAdvanced) return <>{text}</>;
  if (revealed) return <>{text}</>;
  return (
    <button
      onClick={() => setRevealed(true)}
      className="text-[10px] font-bold text-[var(--ds-blue)] hover:underline border-none bg-none p-0 cursor-pointer inline-block"
      style={{ background: 'none', border: 'none', padding: 0 }}
    >
      [toon vertaling]
    </button>
  );
}

function ZinBouwenGame() {
  const searchParams = useSearchParams();
  const lesId = searchParams.get("les");
  const { moedertaal } = useMoedertaal();
  const { progress, updateProgress } = useProgress();

  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [current, setCurrent] = useState<Sentence | null>(null);
  const [wordIds, setWordIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [scores, setScores] = useState({ goed: 0, fout: 0, combo: 1, score: 0 });
  const [loading, setLoading] = useState(true);

  // Kalan Hak/Deneme takibi
  const [attempts, setAttempts] = useState(0);

  // History tracking states
  const [correctHistory, setCorrectHistory] = useState<Array<{ tr: string; nl: string }>>([]);
  const [wrongHistory, setWrongHistory] = useState<Array<{ tr: string; nl: string; userAnswer: string; explanation: string }>>([]);

  const [isAdvanced, setIsAdvanced] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  useEffect(() => {
    const level = localStorage.getItem("spraakmaker-niveau");
    if (level === "B1" || level === "B2") {
      setIsAdvanced(true);
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  async function init() {
    setLoading(true);
    setCorrectHistory([]);
    setWrongHistory([]);
    const data = await loadSentences(lesId);
    setSentences(shuffle(data));
    setLoading(false);
  }

  useEffect(() => { init(); }, [lesId]);

  function loadNext(pool: Sentence[]) {
    if (!pool.length) return;
    const zin = pickRandom(pool);
    setCurrent(zin);
    const words = zin.nl.split(" ").map((w, i) => `${w}__${i}`);
    setWordIds(shuffle(words));
    setFeedback(null);
    setAttempts(0); // Hakları sıfırla
    setHintRevealed(false);
  }

  useEffect(() => {
    if (sentences.length) loadNext(sentences);
  }, [sentences]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWordIds((ids) => {
        const oldIndex = ids.indexOf(active.id as string);
        const newIndex = ids.indexOf(over.id as string);
        return arrayMove(ids, oldIndex, newIndex);
      });
    }
  }

  function checkAnswer() {
    if (!current) return;
    const answer = wordIds.map((id) => id.split("__")[0]).join(" ");
    const correct = answer === current.nl;

    if (correct) {
      setFeedback("correct");
      const newCombo = scores.combo + 1;
      const multiplier = newCombo >= 6 ? 3 : newCombo >= 3 ? 2 : 1;
      const points = 20 * multiplier;

      setScores((s) => ({
        goed: s.goed + 1,
        fout: s.fout,
        combo: newCombo,
        score: s.score + points,
      }));

      setCorrectHistory((prev) => [...prev, { tr: current.tr, nl: current.nl }]);
      
      updateProgress((p) => {
        const currentStats = p.games.stats?.zinBouwen || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
        const updatedHistory = [
          {
            sentence: current.nl,
            translation: current.tr,
            correct: true,
            timestamp: new Date().toISOString()
          },
          ...currentStats.history
        ].slice(0, 50);

        return {
          ...p,
          games: {
            ...p.games,
            totalPoints: p.games.totalPoints + points,
            highScores: {
              ...p.games.highScores,
              zinBouwen: Math.max(p.games.highScores.zinBouwen, p.games.totalPoints + points),
            },
            lastPlayDate: new Date().toISOString(),
            stats: {
              ...p.games.stats,
              zinBouwen: {
                playCount: currentStats.playCount + 1,
                correctCount: currentStats.correctCount + 1,
                wrongCount: currentStats.wrongCount,
                history: updatedHistory
              }
            }
          },
        };
      });

      setTimeout(() => loadNext(sentences), 800);
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (nextAttempts >= 3) {
        setFeedback("wrong");
        const explanation = explainDifference(answer, current.nl, moedertaal);
        setWrongHistory((prev) => [
          ...prev,
          { tr: current.tr, nl: current.nl, userAnswer: answer, explanation },
        ]);

        setScores((s) => ({
          goed: s.goed,
          fout: s.fout + 1,
          combo: 1,
          score: s.score,
        }));

        updateProgress((p) => {
          const currentStats = p.games.stats?.zinBouwen || { playCount: 0, correctCount: 0, wrongCount: 0, history: [] };
          const updatedHistory = [
            {
              sentence: current.nl,
              translation: current.tr,
              correct: false,
              timestamp: new Date().toISOString(),
              userAnswer: answer,
              explanation: explanation
            },
            ...currentStats.history
          ].slice(0, 50);

          return {
            ...p,
            games: {
              ...p.games,
              stats: {
                ...p.games.stats,
                zinBouwen: {
                  playCount: currentStats.playCount + 1,
                  correctCount: currentStats.correctCount,
                  wrongCount: currentStats.wrongCount + 1,
                  history: updatedHistory
                }
              }
            },
          };
        });

        setTimeout(() => loadNext(sentences), 1600);
      } else {
        setFeedback("wrong");
        setTimeout(() => {
          setFeedback(null);
        }, 1200);
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ds-white)]">
        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Laden…</p>
      </div>
    );
  }

  const comboMultiplier = scores.combo >= 6 ? "x3" : scores.combo >= 3 ? "x2" : "x1";

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header — bg-ds-black */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">zin bouwen</span>
        <span className="text-sm font-bold text-[var(--ds-yellow)]">{scores.score} pts</span>
      </div>

      {/* Üst bar: KIRMIZI blok + zamanlayıcı + combo badge */}
      <div className="flex border-b-[3px] border-[var(--ds-black)]">
        <div className="flex-1 bg-[var(--ds-red)] px-5 py-3 flex items-center">
          <span className="text-sm font-medium text-[var(--ds-white)]">Zin bouwen</span>
        </div>
        {/* Combo badge — BEYAZ bg, KIRMIZI text */}
        <div className="bg-[var(--ds-white)] border-l-[3px] border-[var(--ds-black)] px-4 py-3 flex items-center">
          <span className="text-lg font-bold text-[var(--ds-red)]">{comboMultiplier}</span>
        </div>
      </div>

      {/* Hint: moedertaal sentence */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">MAAK DE ZIN</p>
        {isAdvanced && !hintRevealed ? (
          <button
            onClick={() => setHintRevealed(true)}
            className="text-xs font-bold text-[var(--ds-blue)] hover:underline border-none bg-none p-0 cursor-pointer block text-left"
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            [toon vertaling]
          </button>
        ) : (
          <p className="text-sm text-[var(--ds-black)] opacity-60">{current?.tr}</p>
        )}
      </div>

      {/* Target area: current word order */}
      <div className="px-4 py-4">
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-3 px-4 py-3 border-[3px] border-[var(--ds-black)] font-bold text-sm uppercase tracking-widest ${
                feedback === "correct"
                  ? "bg-[var(--ds-green)] text-[var(--ds-white)]"
                  : "bg-[var(--ds-red)] text-[var(--ds-white)]"
              }`}
            >
              {feedback === "correct" ? (
                "Goed!"
              ) : attempts >= 3 ? (
                `Fout! Het juiste antwoord is: ${current?.nl}`
              ) : (
                `Fout! Probeer het opnieuw (Resterende pogingen: ${3 - attempts})`
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={wordIds} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-2 min-h-[80px] p-3 border-[3px] border-[var(--ds-black)] bg-[var(--ds-gray)]">
              {wordIds.map((id) => (
                <SortableWord key={id} id={id} word={id.split("__")[0]} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Doğru ve Yanlış Cümlelerin Listelendiği Kartlar */}
      <div className="px-4 pb-4 flex flex-col gap-4">
        {/* DOĞRU CÜMLELER KARTI (Yeşil Çerçeveli) */}
        <div className="border-[3px] border-[var(--ds-green)] bg-[var(--ds-white)] p-4 flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ds-green)] mb-3 block">
            Correct gebouwde zinnen ({correctHistory.length})
          </span>
          {correctHistory.length === 0 ? (
            <p className="text-xs text-[var(--ds-black)] opacity-40 italic py-2 text-center">
              Er is nog geen correcte zin gebouwd.
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
                      {item.nl}
                    </p>
                    <p className="text-[10px] md:text-xs text-[var(--ds-black)] opacity-60">
                      <RevealableText text={item.tr} isAdvanced={isAdvanced} />
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
                  className="flex flex-col border-b-[2px] border-[var(--ds-gray)] pb-2 last:border-b-0 last:pb-0 gap-1"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-[var(--ds-red)] flex items-center justify-center text-[var(--ds-white)] text-[9px] font-bold mt-0.5 select-none">
                      ✗
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-black text-[var(--ds-red)]">
                        {item.userAnswer}
                      </p>
                      <p className="text-[10px] md:text-xs text-[var(--ds-black)] opacity-50 italic">
                        Hedef: {item.nl} (<RevealableText text={item.tr} isAdvanced={isAdvanced} />)
                      </p>
                    </div>
                  </div>
                  {/* Neden yanlış olduğunun izahı */}
                  <div className="ml-6 bg-[rgba(194,59,34,0.06)] border-l-[3px] border-[var(--ds-red)] p-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-red)] opacity-80">
                      OORZAAK FOUT:
                    </p>
                    <p className="text-[10px] md:text-xs font-medium text-[var(--ds-black)] mt-0.5">
                      {item.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Check button */}
      <div className="border-t-[3px] border-[var(--ds-black)]">
        <button
          onClick={checkAnswer}
          disabled={!wordIds.length || !!feedback}
          className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-5 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-40"
        >
          Controleer
        </button>
      </div>

      {/* Skor barı: 5 eşit blok (sarı, kırmızı, mavi, beyaz, yeşil) */}
      <div className="flex border-t-[3px] border-[var(--ds-black)]">
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-yellow)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-lg font-bold text-[var(--ds-black)]">{scores.score}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-black)] opacity-70">SCORE</span>
        </div>
        <div className="flex-1 py-3 flex flex-col items-center bg-[var(--ds-red)] border-r-[3px] border-[var(--ds-black)]">
          <span className="text-lg font-bold text-[var(--ds-white)]">{comboMultiplier}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ds-white)] opacity-70">COMBO</span>
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

export default function ZinBouwenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-sm font-bold uppercase tracking-widest opacity-40">Laden…</p></div>}>
      <ZinBouwenGame />
    </Suspense>
  );
}
