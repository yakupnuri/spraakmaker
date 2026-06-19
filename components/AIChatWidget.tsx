"use client";

import { useState, useEffect, useRef } from "react";
import { useProgress } from "@/lib/hooks";

interface TargetSentence {
  nl: string;
  tr: string;
  lessonTitle: string;
  completed: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  analysis?: {
    hasError: boolean;
    explanation: string;
    corrected: string;
  };
}

export function AIChatWidget() {
  const { progress, updateProgress, recordActivity } = useProgress();
  const [isOpen, setIsOpen] = useState(false);
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2" | null>(null);
  const [targetSentences, setTargetSentences] = useState<TargetSentence[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [diamondsWon, setDiamondsWon] = useState<number | null>(null);
  const [openAnalysisId, setOpenAnalysisId] = useState<string | null>(null);
  const [ttsPlayingId, setTtsPlayingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Otomatik aşağı kaydır
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // Web Speech API (Speech Recognition) Kurulumu
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "nl-NL"; // Hollandaca algılama

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputValue((prev) => (prev ? prev + " " + transcript : transcript));
          }
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // Hedef cümleleri Zinnenbank dosyasından çek
  const loadTargetSentences = async (selectedLevel: "A1" | "A2" | "B1" | "B2") => {
    try {
      const response = await fetch(`/data/zinnenbank-${selectedLevel.toLowerCase()}.json`);
      if (!response.ok) throw new Error("Dosya yüklenemedi");
      
      const data = await response.json();
      
      // Tüm cümleleri düzleştirip bir listeye topla
      const allSentences: { nl: string; tr: string; lessonTitle: string }[] = [];
      data.forEach((les: any) => {
        if (les.sentences && les.sentences.length > 0) {
          les.sentences.forEach((s: any) => {
            allSentences.push({
              nl: s.nl,
              tr: s.tr,
              lessonTitle: les.title,
            });
          });
        }
      });

      if (allSentences.length === 0) return;

      // Rastgele 3 cümle seç
      const shuffled = [...allSentences].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3).map((s) => ({
        ...s,
        completed: false,
      }));

      setTargetSentences(selected);
      
      // Sohbeti başlat
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hoi! Ben je klaar om Nederlands te oefenen? 😊\n\nBu sohbette senin için **${selectedLevel}** seviyesinden 3 adet hedef cümle seçtim. Sohbet ederken bu cümleleri kurmaya veya cevaplarımda onları anlamaya çalış!\n\nİlk hedef cümlelerimizden biriyle başlayalım. Hazırsan bir şeyler yaz!`,
        },
      ]);
    } catch (error) {
      console.error("Zinnenbank sentences could not be loaded:", error);
      // Fallback
      setTargetSentences([
        { nl: "Hoe gaat het met jou?", tr: "Nasıl gidiyor?", lessonTitle: "Intro", completed: false },
        { nl: "Ik woon in Nederland.", tr: "Hollanda'da yaşıyorum.", lessonTitle: "Intro", completed: false },
        { nl: "Wat wil je drinken?", tr: "Ne içmek istersin?", lessonTitle: "Intro", completed: false },
      ]);
    }
  };

  // Seviye seçilip sohbet başlatıldığında
  const handleStartSession = (selectedLevel: "A1" | "A2" | "B1" | "B2") => {
    setLevel(selectedLevel);
    setMessages([]);
    loadTargetSentences(selectedLevel);
  };

  // Sesle Konuşma Başlat/Durdur
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Tarayıcınız ses tanıma özelliğini desteklemiyor. Lütfen Google Chrome kullanın.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Sesli Okuma (TTS)
  const handleSpeak = (text: string, messageId: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (ttsPlayingId === messageId) {
      window.speechSynthesis.cancel();
      setTtsPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "nl-NL";

    utterance.onend = () => {
      setTtsPlayingId(null);
    };

    utterance.onerror = () => {
      setTtsPlayingId(null);
    };

    setTtsPlayingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Cümle temizleme yardımcısı (Noktalama işaretlerini ve boşlukları atarak eşleştirme)
  const cleanString = (s: string) => 
    s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").replace(/\s+/g, " ").trim();

  // Mesaj Gönder
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading || !level) return;

    const userText = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    const userMessageId = Math.random().toString(36).substring(7);
    const newMessages: Message[] = [
      ...messages,
      {
        id: userMessageId,
        role: "user",
        content: userText,
      },
    ];

    setMessages(newMessages);

    try {
      // Hedef cümle tamamlandı mı kontrol et
      const cleanedUser = cleanString(userText);
      let targetCompleted = false;
      let completedIdx = -1;

      targetSentences.forEach((target, idx) => {
        if (!target.completed && cleanString(target.nl) === cleanedUser) {
          targetCompleted = true;
          completedIdx = idx;
        }
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          scenario: `Zinnenbank Pratiği (${level} Seviyesi)`,
          targetSentences: targetSentences.filter((t) => !t.completed),
        }),
      });

      if (!response.ok) {
        throw new Error("API hatası.");
      }

      const data = await response.json();

      // Gemini analizine bakarak eğer kullanıcı cümleyi hatalı yazdıysa ama düzeltilmiş hali hedefle eşleşiyorsa da kabul edelim!
      if (!targetCompleted && data.analysis && data.analysis.corrected) {
        const cleanedCorrected = cleanString(data.analysis.corrected);
        targetSentences.forEach((target, idx) => {
          if (!target.completed && cleanString(target.nl) === cleanedCorrected) {
            targetCompleted = true;
            completedIdx = idx;
          }
        });
      }

      // Kullanıcı mesajına Gemini analizini ekle
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId
            ? { ...msg, analysis: data.analysis }
            : msg
        )
      );

      // AI cevabını ekle
      const aiMessageId = Math.random().toString(36).substring(7);
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "assistant",
          content: data.reply,
        },
      ]);

      // Eğer hedef cümle tamamlandıysa güncelle ve ekstra elmas ver
      if (targetCompleted && completedIdx !== -1) {
        setTargetSentences((prev) =>
          prev.map((t, idx) => (idx === completedIdx ? { ...t, completed: true } : t))
        );

        // Ekstra 25 elmas!
        updateProgress((prev) => ({
          ...prev,
          games: {
            ...prev.games,
            totalPoints: (prev.games.totalPoints ?? 0) + 25,
          },
        }));
        recordActivity();
        setDiamondsWon(25);
        setTimeout(() => setDiamondsWon(null), 3000);
      } else {
        // Normal sohbet katılım puanı (5 puan)
        updateProgress((prev) => ({
          ...prev,
          games: {
            ...prev.games,
            totalPoints: (prev.games.totalPoints ?? 0) + 5,
          },
        }));
        recordActivity();
        setDiamondsWon(5);
        setTimeout(() => setDiamondsWon(null), 2000);
      }

      // Hata varsa Türkçe analizi otomatik aç
      if (data.analysis && data.analysis.hasError) {
        setOpenAnalysisId(userMessageId);
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          content: "Sorry, er is iets misgegaan. Probeer het opnieuw.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* SAĞ ALTTAKİ YÜZEN BUTON */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-[0_8px_32px_rgba(37,99,235,0.4)] border border-blue-500/20 transition-all duration-300 active:scale-95 relative group ${
            isOpen 
              ? "bg-red-500 hover:bg-red-600 rotate-90 text-white" 
              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95"
          }`}
        >
          {isOpen ? (
            <span className="text-xl font-bold">✕</span>
          ) : (
            <div className="flex flex-col items-center justify-center select-none pt-1">
              <img
                src="/ai-maskot.png"
                alt="AI Mascot"
                className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-[9px] font-black tracking-widest uppercase text-white/90 -mt-0.5 leading-none">EA</span>
            </div>
          )}
          
          {/* Bildirim Balonu / Pırıltı Efekti */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* SOHBET PENCERESİ WIDGET */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 w-full sm:w-[380px] h-full sm:h-[550px] bg-[var(--surface)] border-0 sm:border border-[var(--border)] rounded-none sm:rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden animate-fadeIn backdrop-blur-xl">
          
          {/* Elmas Puan Animasyonu */}
          {diamondsWon !== null && (
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white font-black px-4 py-2 rounded-full flex items-center gap-1.5 shadow-[0_4px_12px_rgba(37,99,235,0.3)] animate-bounce z-50 text-xs">
              <span>💎</span>
              <span>+{diamondsWon} Puan!</span>
            </div>
          )}

          {/* ÜST BAR */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-4 py-3 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center p-0.5">
                <img src="/ai-maskot.png" alt="AI Mascot" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-widest uppercase leading-none">spraakmaker AI</span>
                <span className="text-[10px] text-blue-200 mt-0.5 font-semibold">Zinnenbank Egzersizi</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm("Bu sohbeti sıfırlamak istiyor musunuz?")) {
                    setLevel(null);
                    setMessages([]);
                    setTargetSentences([]);
                  }
                }}
                className="text-[10px] font-bold bg-white/10 hover:bg-white/20 transition-colors px-2.5 py-1 rounded-lg"
                title="Seviyeyi Sıfırla"
              >
                Reset
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="sm:hidden text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors px-2.5 py-1 rounded-lg"
                title="Kapat"
              >
                Sluiten
              </button>
            </div>
          </div>

          {/* İÇERİK */}
          {!level ? (
            /* SEVİYE SEÇİMİ */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
              <img src="/ai-maskot.png" alt="AI Mascot" className="w-16 h-16 object-contain animate-pulse" />
              <div className="flex flex-col gap-1">
                <h4 className="font-bold text-sm text-[var(--text)]">Cümle Pratiği Yap</h4>
                <p className="text-xs text-[var(--text-muted)] font-medium max-w-[240px]">
                  Zinnenbank içindeki cümleleri sohbete yedirerek öğren. Bir zorluk seviyesi seçin:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-[260px] mt-2">
                {(["A1", "A2", "B1", "B2"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleStartSession(lvl)}
                    className="bg-[var(--surface-2)] border border-[var(--border)] hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-500 font-black text-sm py-3 rounded-2xl transition-all active:scale-95 text-[var(--text)]"
                  >
                    {lvl} Egzersizi
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* AKTİF SOHBET VE HEDEFLER */
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* DOELEN (HEDEFLER) AKORDİYONU */}
              <div className="bg-[var(--surface-2)] border-b border-[var(--border)] px-4 py-2.5 flex flex-col gap-1.5 select-none shrink-0">
                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">HEDEF CÜMLELER (Doelen)</span>
                <div className="flex flex-col gap-1">
                  {targetSentences.map((target, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl border transition-all ${
                        target.completed
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold"
                          : "bg-[var(--surface)] border-[var(--border)] text-[var(--text)]"
                      }`}
                      title={`Ders: ${target.lessonTitle}`}
                    >
                      <div className="flex flex-col leading-tight max-w-[85%]">
                        <span className="font-semibold">{target.nl}</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">{target.tr}</span>
                      </div>
                      <span className="text-sm shrink-0">
                        {target.completed ? "✅" : "🎯"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MESAJ AKIŞI */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.map((msg) => {
                  const isAI = msg.role === "assistant";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-1 max-w-[85%] ${isAI ? "self-start mr-auto" : "self-end ml-auto"}`}
                    >
                      <div className="flex items-start gap-1.5">
                        {isAI && (
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center p-0.5 shrink-0 border border-blue-200 dark:border-blue-950/40">
                            <img src="/ai-maskot.png" alt="Mascot" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5 w-full">
                          <div
                            className={`p-3 rounded-2xl text-xs font-semibold shadow-sm relative group ${
                              isAI
                                ? "bg-[var(--surface-2)] text-[var(--text)] rounded-tl-none border border-[var(--border)]"
                                : "bg-blue-600 text-white rounded-tr-none"
                            }`}
                          >
                            {msg.content}

                            {isAI && (
                              <button
                                onClick={() => handleSpeak(msg.content, msg.id)}
                                className={`absolute right-1 bottom-1 p-1 rounded bg-[var(--surface)] border border-[var(--border)] opacity-0 group-hover:opacity-100 transition-opacity scale-75 text-[var(--text)]`}
                              >
                                🔊
                              </button>
                            )}
                          </div>

                          {/* DİL BİLGİSİ GERİ BİLDİRİMİ */}
                          {!isAI && msg.analysis && (
                            <div className="mt-0.5 flex flex-col gap-1 w-full">
                              {msg.analysis.hasError ? (
                                <div className="border border-amber-200 dark:border-amber-950/40 bg-amber-50 dark:bg-amber-950/10 rounded-xl overflow-hidden">
                                  <button
                                    onClick={() => setOpenAnalysisId(openAnalysisId === msg.id ? null : msg.id)}
                                    className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400"
                                  >
                                    <span>⚠️ Kelime Sırası / Dil Bilgisi İpucu</span>
                                    <span>{openAnalysisId === msg.id ? "▲" : "▼"}</span>
                                  </button>
                                  {openAnalysisId === msg.id && (
                                    <div className="px-2 pb-2 pt-0.5 text-[10px] text-amber-800 dark:text-amber-300 border-t border-amber-100 dark:border-amber-950/30 flex flex-col gap-1">
                                      <p>{msg.analysis.explanation}</p>
                                      <p className="bg-amber-100/50 dark:bg-amber-950/30 p-1.5 rounded-lg italic font-bold">
                                        Doğru: {msg.analysis.corrected}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 self-end">
                                  ✅ Hatasız Harika Cümle!
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="self-start mr-auto flex items-start gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center p-0.5 shrink-0 border border-blue-200 dark:border-blue-950/40">
                      <img src="/ai-maskot.png" alt="Mascot" className="w-full h-full object-contain" />
                    </div>
                    <div className="bg-[var(--surface-2)] text-[var(--text)] p-3 rounded-2xl rounded-tl-none border border-[var(--border)] flex items-center gap-1 py-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* GİRİŞ ALANI */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl transition-all border shrink-0 flex items-center justify-center ${
                    isListening
                      ? "bg-red-500 text-white border-red-600 animate-pulse scale-105"
                      : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)]"
                  }`}
                  title="Konuşarak Yaz"
                >
                  🎤
                </button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  placeholder={isListening ? "Dinleniyor..." : "Hollandaca yazın..."}
                  className="flex-1 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold"
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className={`p-2.5 rounded-xl shrink-0 transition-all ${
                    inputValue.trim() && !isLoading
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  ➜
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}
