"use client";

import { useEffect, useState, useRef } from "react";
import { useProgress } from "@/lib/hooks";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Playlist {
  playlistId: string;
  kanaal: string;
  titel: string;
}

interface Categorie {
  id: string;
  titel: string;
  playlists: Playlist[];
}

interface VideosData {
  categorieën: Categorie[];
}

export default function VideosPage() {
  const { progress } = useProgress();
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [activeTab, setActiveTab] = useState<string>("videolessen");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // YouTube Player States
  const [player, setPlayer] = useState<any>(null);
  const [apiReady, setApiReady] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playerState, setPlayerState] = useState<number>(-1); // -1: unstarted, 1: playing, 2: paused, vb.
  
  // A-B Loop States
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [loopActive, setLoopActive] = useState<boolean>(false);

  // Playlist Videos States
  const [playlistVideos, setPlaylistVideos] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>("");

  const playerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Playlist bilgilerini güncelle
  const updatePlaylistInfo = (targetPlayer: any) => {
    try {
      if (targetPlayer && typeof targetPlayer.getPlaylist === "function") {
        const list = targetPlayer.getPlaylist() || [];
        setPlaylistVideos(list);
        
        const index = targetPlayer.getPlaylistIndex() || 0;
        setCurrentVideoIndex(index);
      }
      if (targetPlayer && typeof targetPlayer.getVideoData === "function") {
        const data = targetPlayer.getVideoData();
        if (data && data.title) {
          setCurrentVideoTitle(data.title);
        }
      }
    } catch (e) {}
  };

  // 1. Veri yükleme
  useEffect(() => {
    fetch("/data/videos.json")
      .then((res) => res.json())
      .then((data: VideosData) => {
        setCategories(data.categorieën);
        if (data.categorieën.length > 0) {
          // İlk kategoriyi aktif et ve ilk playlist'i seç
          const firstCat = data.categorieën[0];
          setActiveTab(firstCat.id);
          if (firstCat.playlists.length > 0) {
            setSelectedPlaylist(firstCat.playlists[0]);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load videos data", err);
        setLoading(false);
      });
  }, []);

  // 2. YouTube IFrame API Yükleme
  useEffect(() => {
    if (typeof window === "undefined") return;

    // API zaten yüklüyse
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    // API Ready callback'ini tanımlayalım
    window.onYouTubeIframeAPIReady = () => {
      setApiReady(true);
    };

    // Script tagını ekle
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Kategori değiştiğinde o kategorinin ilk çalma listesini seç
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const cat = categories.find((c) => c.id === tabId);
    if (cat && cat.playlists.length > 0) {
      setSelectedPlaylist(cat.playlists[0]);
      // A-B Loop'u sıfırla
      setLoopA(null);
      setLoopB(null);
      setLoopActive(false);
      // Playlist verilerini sıfırla
      setPlaylistVideos([]);
      setCurrentVideoIndex(0);
      setCurrentVideoTitle("");
    }
  };

  // 3. Player oluşturma veya Playlist yükleme
  useEffect(() => {
    if (!apiReady || !selectedPlaylist) return;

    // Eski player varsa yok et
    if (player) {
      try {
        player.destroy();
      } catch (e) {}
      setPlayer(null);
    }

    // Interval temizliği
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Yeni player oluştur
    const newPlayer = new window.YT.Player("youtube-player-placeholder", {
      height: "100%",
      width: "100%",
      playerVars: {
        listType: "playlist",
        list: selectedPlaylist.playlistId,
        autoplay: 0,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event: any) => {
          setPlaybackRate(1);
          updatePlaylistInfo(event.target);
          // Shadowing modunda zamanı izlemek için interval kur
          if (activeTab === "shadowing") {
            intervalRef.current = setInterval(() => {
              if (event.target && typeof event.target.getCurrentTime === "function") {
                const time = event.target.getCurrentTime();
                setCurrentTime(time);
                
                // A-B Loop kontrolü
                if (loopActive && loopA !== null && loopB !== null && time >= loopB) {
                  event.target.seekTo(loopA, true);
                }
              }
            }, 250);
          }
        },
        onStateChange: (event: any) => {
          setPlayerState(event.data);
          updatePlaylistInfo(event.target);
        },
      },
    });

    setPlayer(newPlayer);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [apiReady, selectedPlaylist]);

  // A-B Loop durumu değiştiğinde veya loop limitleri güncellendiğinde interval'i güncelle
  useEffect(() => {
    if (!player || activeTab !== "shadowing") return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      try {
        if (player && typeof player.getCurrentTime === "function") {
          const time = player.getCurrentTime();
          setCurrentTime(time);
          
          if (loopActive && loopA !== null && loopB !== null) {
            if (time >= loopB || time < loopA) {
              player.seekTo(loopA, true);
            }
          }
        }
      } catch (e) {}
    }, 200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [player, loopA, loopB, loopActive, activeTab]);

  // 4. Shadowing Kontrolleri Fonksiyonları
  const handleSpeedChange = (speed: number) => {
    if (player && typeof player.setPlaybackRate === "function") {
      player.setPlaybackRate(speed);
      setPlaybackRate(speed);
    }
  };

  const handleSetA = () => {
    if (player && typeof player.getCurrentTime === "function") {
      const time = player.getCurrentTime();
      setLoopA(time);
      // Eğer mevcut B noktası A'dan küçükse B'yi sıfırla
      if (loopB !== null && loopB <= time) {
        setLoopB(null);
        setLoopActive(false);
      }
    }
  };

  const handleSetB = () => {
    if (player && typeof player.getCurrentTime === "function") {
      const time = player.getCurrentTime();
      if (loopA !== null && time > loopA) {
        setLoopB(time);
        setLoopActive(true); // Otomatik aktif et
      }
    }
  };

  const handleToggleLoop = () => {
    if (loopA !== null && loopB !== null) {
      setLoopActive(!loopActive);
    }
  };

  const handleClearLoop = () => {
    setLoopA(null);
    setLoopB(null);
    setLoopActive(false);
  };

  const handleRewind = () => {
    if (player && typeof player.getCurrentTime === "function") {
      const time = player.getCurrentTime();
      player.seekTo(Math.max(0, time - 5), true);
    }
  };

  // Zaman formatlama (ss.ss -> mm:ss)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3.5 shadow-sm flex items-center justify-between">
        <h1 className="text-base font-black tracking-wider uppercase text-[var(--text)]">
          Videos
        </h1>
        <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full">
          Extra Oefening
        </span>
      </header>

      {loading && (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-sm font-bold text-[var(--text-muted)] opacity-50 uppercase tracking-widest animate-pulse">
            Laden…
          </p>
        </div>
      )}

      {!loading && categories.length > 0 && (
        <main className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
          
          {/* Kategori Sekmeleri */}
          <div className="flex bg-[var(--surface-2)] p-1 rounded-2xl border border-[var(--border)]">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleTabChange(cat.id)}
                className={`flex-1 py-3 text-xs font-black tracking-wider uppercase rounded-xl transition-all duration-200 ${
                  activeTab === cat.id
                    ? "bg-[var(--surface)] text-[var(--accent)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {cat.titel === "Videolessen" ? "Videolessen (Dersler)" : cat.titel}
              </button>
            ))}
          </div>

          {/* İki Sütunlu Düzen (Desktop'ta yan yana, Mobil'de alt alta) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sol Sütun: Playlist Seçimi */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">
                Playlists
              </h2>
              <div className="flex flex-col gap-2">
                {categories
                  .find((c) => c.id === activeTab)
                  ?.playlists.map((pl) => (
                    <button
                      key={pl.playlistId}
                      onClick={() => {
                        setSelectedPlaylist(pl);
                        setLoopA(null);
                        setLoopB(null);
                        setLoopActive(false);
                      }}
                      className={`flex flex-col text-left border rounded-2xl p-4 transition-all duration-200 ${
                        selectedPlaylist?.playlistId === pl.playlistId
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]/20"
                          : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-1">
                        {pl.kanaal}
                      </span>
                      <span className="text-xs font-extrabold text-[var(--text)] leading-snug">
                        {pl.titel}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Sağ Sütun: Oynatıcı & Kontroller */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">
                Speler
              </h2>

              {/* Video Yerleştirme Kutusu (16:9 Oranında) */}
              <div className="relative w-full aspect-video rounded-3xl border border-[var(--border)] bg-black overflow-hidden shadow-sm">
                <div id="youtube-player-placeholder" className="w-full h-full" />
              </div>

              {/* YouTube Fallback Linki */}
              {selectedPlaylist && (
                <div className="flex justify-end">
                  <a
                    href={`https://www.youtube.com/playlist?list=${selectedPlaylist.playlistId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
                  >
                    Bekijk op YouTube ↗
                  </a>
                </div>
              )}

              {/* Çalma Listesi Videoları */}
              {playlistVideos.length > 0 && (
                <div className="border border-[var(--border)] bg-[var(--surface)] rounded-3xl p-5 flex flex-col gap-4 shadow-xs">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text)] border-b border-[var(--border)] pb-2 flex justify-between items-center">
                    <span>Lessen in deze playlist ({playlistVideos.length} ders)</span>
                    <span className="text-[9px] text-[var(--text-muted)] font-normal">Tıkla ve Başlat</span>
                  </h3>
                  
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {playlistVideos.map((videoId, idx) => {
                      const isActive = currentVideoIndex === idx;
                      return (
                        <button
                          key={videoId + "-" + idx}
                          onClick={() => {
                            if (player && typeof player.playVideoAt === "function") {
                              player.playVideoAt(idx);
                              setCurrentVideoIndex(idx);
                            }
                          }}
                          className={`flex items-center gap-3 border rounded-xl p-3 text-left transition-all duration-200 ${
                            isActive
                              ? "border-[var(--accent)] bg-[var(--accent-soft)]/20 text-[var(--accent)] font-extrabold"
                              : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isActive
                              ? "bg-[var(--accent)] text-white"
                              : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="text-xs truncate flex-grow">
                            {isActive && currentVideoTitle ? currentVideoTitle : `Les ${idx + 1}`}
                          </span>
                          {isActive && <span className="text-[9px] uppercase font-black tracking-widest text-[var(--accent)] shrink-0 animate-pulse">Nu bezig (Şu an)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Shadowing Modu İçin Gelişmiş Kontrol Paneli */}
              {activeTab === "shadowing" && selectedPlaylist && (
                <div className="border border-[var(--border)] bg-[var(--surface)] rounded-3xl p-5 flex flex-col gap-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text)]">
                      Shadowing Toolkit (Konuşma Gölgeleme)
                    </h3>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full">
                      Tijd: {formatTime(currentTime)}
                    </span>
                  </div>

                  {/* 1. Hız Ayarları */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                      Afspeelsnelheid (Hız): {playbackRate}x
                    </span>
                    <div className="flex gap-2">
                      {[0.5, 0.75, 1.0].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 border ${
                            playbackRate === speed
                              ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                              : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
                          }`}
                        >
                          {speed}x {speed < 1 ? "Slow" : "Normal"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Tekrar & Geri Sarma */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                      Herhaal (Tekrar)
                    </span>
                    <button
                      onClick={handleRewind}
                      className="py-2.5 text-xs font-black uppercase tracking-wider rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] flex items-center justify-center gap-2 active:scale-98 transition-all"
                    >
                      <span>↩</span> Herhaal laatste 5 seconden (Son 5 Saniye Tekrar)
                    </button>
                  </div>

                  {/* 3. A-B Loop Kontrolü */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                      A-B Loop (Aralık Tekrarlama)
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleSetA}
                        className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                          loopA !== null
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
                        }`}
                      >
                        Set A {loopA !== null && `(${formatTime(loopA)})`}
                      </button>
                      
                      <button
                        onClick={handleSetB}
                        disabled={loopA === null}
                        className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                          loopB !== null
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : loopA === null
                              ? "opacity-40 cursor-not-allowed border-[var(--border)]"
                              : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
                        }`}
                      >
                        Set B {loopB !== null && `(${formatTime(loopB)})`}
                      </button>
                    </div>

                    {loopA !== null && loopB !== null && (
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={handleToggleLoop}
                          className={`flex-grow py-2 text-xs font-extrabold rounded-xl border transition-all ${
                            loopActive
                              ? "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/30"
                              : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)]"
                          }`}
                        >
                          {loopActive ? "Loop Active (Tekrarlama Açık)" : "Loop Paused (Tekrarlama Kapalı)"}
                        </button>
                        <button
                          onClick={handleClearLoop}
                          className="px-4 py-2 text-xs font-extrabold rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 4. Kullanım İpucu */}
                  <div className="border-t border-[var(--border)] pt-3 text-[10px] text-[var(--text-muted)] italic leading-relaxed text-center">
                    💡 <b>Tip:</b> Luister naar de zin, zet de video op pauze, spreek na en herhaal.
                    <br />(Dinle, durdur, yüksek sesle taklit et ve tekrarla.)
                  </div>
                </div>
              )}

            </div>

          </div>

        </main>
      )}
    </div>
  );
}
