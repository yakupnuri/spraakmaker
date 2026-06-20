"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/hooks";

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

const SCENARIOS = [
  {
    id: "vrij_praten",
    title: "Vrij Praten",
    desc: "İstediğin konuda Hollandaca serbest sohbet et.",
    icon: "🌐",
    color: "from-blue-500 to-indigo-600",
    initialMsg: "Hoi! Hoe gaat het met je vandaag? Waar wil je over praten?",
  },
  {
    id: "supermarkt",
    title: "In de Supermarkt",
    desc: "Alışveriş yaparken karşılaşabileceğin diyaloglar.",
    icon: "🛒",
    color: "from-emerald-500 to-teal-600",
    initialMsg: "Hallo! Welkom in de supermarkt. Kan ik u helpen met het vinden van producten?",
  },
  {
    id: "restaurant",
    title: "In het Restaurant",
    desc: "Yemek siparişi ve masa rezervasyonu pratiği.",
    icon: "🍽️",
    color: "from-orange-500 to-amber-600",
    initialMsg: "Goedenavond! Welkom in ons restaurant. Heeft u gereserveerd?",
  },
  {
    id: "voorstellen",
    title: "Jezelf Voorstellen",
    desc: "Adın, yaşın, işin ve hobilerin hakkında tanışma sohbeti.",
    icon: "👋",
    color: "from-pink-500 to-rose-600",
    initialMsg: "Hoi! Ik ben Spraakmaker AI. Laten we kennis maken! Hoe heet je en waar kom je vandaan?",
  },
];

export default function AIChatPage() {
  const { progress, updateProgress, recordActivity } = useProgress();
  const [selectedScenario, setSelectedScenario] = useState<typeof SCENARIOS[0] | null>(null);
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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

  // Senaryo seçildiğinde konuşmayı başlat
  const handleSelectScenario = (scenario: typeof SCENARIOS[0]) => {
    setSelectedScenario(scenario);
    setMessages([
      {
        id: "initial",
        role: "assistant",
        content: scenario.initialMsg,
      },
    ]);
    setInputValue("");
    setOpenAnalysisId(null);
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

  // Sesli Okuma (TTS - Text to Speech)
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

  // Mesaj Gönder
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading || !selectedScenario) return;

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
          scenario: selectedScenario.title,
        }),
      });

      if (!response.ok) {
        throw new Error("API hatası oluştu.");
      }

      const data = await response.json();

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

      // Oyunlaştırma mantığı: Hata yoksa veya az hatayla pratik yapınca puan kazandır
      if (data.analysis && !data.analysis.hasError) {
        // Puan ekle ve animasyon tetikle
        updateProgress((prev) => ({
          ...prev,
          games: {
            ...prev.games,
            totalPoints: (prev.games.totalPoints ?? 0) + 10,
          },
        }));
        recordActivity(); // Günlük hedefe de kaydet
        setDiamondsWon(10);
        setTimeout(() => setDiamondsWon(null), 2500);
      } else {
        // Hatalı olsa bile katılım puanı ver (5 puan)
        updateProgress((prev) => ({
          ...prev,
          games: {
            ...prev.games,
            totalPoints: (prev.games.totalPoints ?? 0) + 5,
          },
        }));
        recordActivity();
        setDiamondsWon(5);
        setTimeout(() => setDiamondsWon(null), 2500);
        // Hatalıysa analizi otomatik aç
        setOpenAnalysisId(userMessageId);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          content: "Sorry, er is iets misgegaan. Probeer het opnieuw. (Üzgünüm, bir şeyler ters gitti. Lütfen tekrar deneyin.)",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24 pt-6 px-4 md:px-8 max-w-4xl mx-auto flex flex-col gap-6 relative">
      
      {/* Elmas Puan Animasyonu */}
      {diamondsWon !== null && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white font-black px-6 py-3 rounded-full flex items-center gap-2 shadow-[0_8px_24px_rgba(37,99,235,0.4)] animate-bounce z-50">
          <span className="text-xl">💎</span>
          <span>+{diamondsWon} PUNTEN!</span>
        </div>
      )}

      {/* ÜST BAŞLIK */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 select-none">
        <div className="flex items-center gap-3">
          {selectedScenario ? (
            <button
              onClick={() => {
                if (confirm("Sohbetten çıkıp senaryo seçimine dönmek istiyor musunuz?")) {
                  setSelectedScenario(null);
                  setMessages([]);
                }
              }}
              className="p-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors border border-[var(--border)]"
              title="Senaryolara Dön"
            >
              ←
            </button>
          ) : (
            <Link
              href="/"
              className="p-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors border border-[var(--border)]"
            >
              ←
            </Link>
          )}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)] flex items-center gap-2">
              AI Chatbot
              <img src="/ai-maskot.png" alt="Mascot" className="w-6 h-6 object-contain inline-block" />
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-semibold">
              {selectedScenario ? `Senaryo: ${selectedScenario.title}` : "Yapay Zeka ile Hollandaca Konuşma Pratiği"}
            </p>
          </div>
        </div>

        {selectedScenario && (
          <button
            onClick={() => {
              if (confirm("Bu sohbeti sıfırlamak istiyor musunuz?")) {
                handleSelectScenario(selectedScenario);
              }
            }}
            className="text-xs font-bold text-[var(--accent)] hover:underline px-3 py-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors"
          >
            Sohbeti Sıfırla
          </button>
        )}
      </div>

      {/* SENARYO SEÇİM EKRANI */}
      {!selectedScenario ? (
        <div className="flex-1 flex flex-col gap-6 animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1 md:max-w-md">
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-100 dark:bg-blue-950/30 px-2.5 py-1 rounded-full self-start">
                YAPAY ZEKA PRATİĞİ
              </span>
              <h2 className="text-lg font-bold text-[var(--text)] mt-2">Neden AI Chatbot?</h2>
              <p className="text-xs text-[var(--text-muted)] font-semibold leading-relaxed">
                Bu modülde yapay zeka seninle Hollandaca konuşur. Yazdığın veya sesli olarak söylediğin her cümle anında yapay zeka tarafından analiz edilir ve dil bilgisi ya da kelime sırası (woordvolgorde) hataların Türkçe olarak sana gösterilir.
              </p>
            </div>
            <div className="w-24 h-24 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-3xl flex items-center justify-center shrink-0">
              <img src="/ai-maskot.png" alt="Spraakmaker AI Mascot" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Bir Senaryo Seçin</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleSelectScenario(scenario)}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 hover:border-blue-500 hover:shadow-md transition-all text-left flex items-start gap-4 group"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${scenario.color} text-white flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform`}>
                    {scenario.icon}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm text-[var(--text)] group-hover:text-blue-600 transition-colors">{scenario.title}</span>
                    <span className="text-xs text-[var(--text-muted)] font-medium leading-normal">{scenario.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* SOHBET EKRANI */
        <div className="flex-1 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-3xl overflow-hidden min-h-[500px] shadow-sm">
          {/* Mesaj Listesi */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-h-[500px] min-h-[400px]">
            {messages.map((msg) => {
              const isAI = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-2 max-w-[85%] ${isAI ? "self-start mr-auto" : "self-end ml-auto"}`}
                >
                  {/* Mesaj Balonu */}
                  <div className="flex items-start gap-2">
                    {isAI && (
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1 border border-blue-200 dark:border-blue-950/40">
                        <img src="/ai-maskot.png" alt="AI Mascot" className="w-full h-full object-contain" />
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1 w-full">
                      <div
                        className={`p-4 rounded-3xl text-sm font-medium shadow-sm relative group ${
                          isAI
                            ? "bg-[var(--surface-2)] text-[var(--text)] rounded-tl-none border border-[var(--border)]"
                            : "bg-blue-600 text-white rounded-tr-none"
                        }`}
                      >
                        {msg.content}

                        {/* AI Seslendirme Butonu */}
                        {isAI && (
                          <button
                            onClick={() => handleSpeak(msg.content, msg.id)}
                            className={`absolute right-2 bottom-2 p-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] transition-opacity scale-90 ${
                              ttsPlayingId === msg.id ? "opacity-100 text-red-500" : "opacity-0 group-hover:opacity-100 text-[var(--text)]"
                            }`}
                            title="Sesli Dinle (TTS)"
                          >
                            {ttsPlayingId === msg.id ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <rect x="4" y="4" width="16" height="16" rx="2" />
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Analiz & Başarı Durumu Paneli */}
                      {!isAI && msg.analysis && (
                        <div className="mt-1.5 flex flex-col gap-1.5 self-end w-full">
                          {msg.analysis.hasError ? (
                            <div className="border border-amber-300/50 dark:border-amber-900/30 bg-amber-50/80 dark:bg-amber-950/20 rounded-2xl overflow-hidden transition-all duration-300">
                              <button
                                onClick={() => setOpenAnalysisId(openAnalysisId === msg.id ? null : msg.id)}
                                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-amber-800 dark:text-amber-400 hover:bg-amber-100/30 transition-colors"
                              >
                                <span className="flex items-center gap-1.5">
                                  ⚠️ Dil Bilgisi & Anlam İpucu
                                </span>
                                <span>{openAnalysisId === msg.id ? "▲" : "▼"}</span>
                              </button>
                              
                              {openAnalysisId === msg.id && (
                                <div className="px-3 pb-3.5 pt-1.5 text-xs text-amber-900 dark:text-amber-200 border-t border-amber-200/50 dark:border-amber-900/20 flex flex-col gap-2.5 leading-relaxed animate-fadeIn font-semibold">
                                  <p className="whitespace-pre-line">{msg.analysis.explanation}</p>
                                  <div className="bg-amber-100/80 dark:bg-amber-950/50 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
                                    <span className="font-black block text-[9px] text-amber-900 dark:text-amber-400 uppercase tracking-widest mb-0.5">Doğru Sürüm:</span>
                                    <span className="italic font-extrabold text-[13px] text-amber-950 dark:text-amber-100">{msg.analysis.corrected}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-2xl text-xs font-black self-end">
                              ✅ Hatasız Harika Cümle! (+10💎)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Yazıyor Animasyonu */}
            {isLoading && (
              <div className="self-start mr-auto flex items-start gap-2 max-w-[80%]">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1 border border-blue-200 dark:border-blue-950/40">
                  <img src="/ai-maskot.png" alt="AI Mascot" className="w-full h-full object-contain" />
                </div>
                <div className="bg-[var(--surface-2)] text-[var(--text)] p-4 rounded-3xl rounded-tl-none border border-[var(--border)] flex items-center gap-1.5 py-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Giriş Alanı */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center gap-3">
            {/* Mikrofon Butonu */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-2xl transition-all border shrink-0 flex items-center justify-center ${
                isListening
                  ? "bg-red-500 text-white border-red-600 animate-pulse scale-105"
                  : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-2)]"
              }`}
              title={isListening ? "Dinlemeyi Durdur" : "Konuşarak Yaz"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>

            {/* Metin Giriş Kutusu */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              placeholder={isListening ? "Dinleniyor, konuşun..." : "Hollandaca bir şeyler yazın..."}
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors font-medium"
            />

            {/* Gönder Butonu */}
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={`p-3 rounded-2xl shrink-0 transition-all ${
                inputValue.trim() && !isLoading
                  ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:opacity-95"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="2" y1="10" x2="18" y2="10" />
                <polyline points="11,3 18,10 11,17" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
