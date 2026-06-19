# PART 3 (Gemini/ajan): "Videolar" menü bölümü (YouTube embed)

Spraakmaker'a, ana menüye **"Videolar"** adında yeni bir bölüm ekle. Harici YouTube video içeriklerini embed ile sunar. İki kategori içerir; ikisi de **serbest/destekleyici** (omurganın zorunlu parçası DEĞİL — videolar başka kanalların; kaldırılırsa müfredat bozulmamalı):

- **A) Videolu Dersler** — anlatımlı, izlenir ders videoları.
- **B) Shadowing** — gölgeleme (dinle → taklit et → tekrarla) konuşma pratiği.

> Ana referans: `docs/MUFREDAT.md`. Mevcut tasarım tokenlarıyla, mobil öncelikli, light+dark uyumlu yaz.

---

## TELİF (zorunlu)
- Tüm videolar **başka kanalların** içeriği. **YALNIZCA resmi YouTube embed (IFrame Player API)** kullan — indirme/yeniden barındırma/ses çıkarma YOK. Embed, herkese açık videolar için YouTube ToS'a göre yasaldır.
- "Videolu Dersler" kullanıcının arkadaşlarının (Oranje: Taal & Tech) → ideal olarak embed izni alınmalı (nezaket + hukuki netlik; teknik engel değil).
- Videolar omurgaya **gömülmez** — destekleyici/önerilen kalır.

## KAYNAKLAR — `public/data/videos.json` (yeni)
```json
{
  "categorieën": [
    {
      "id": "videolessen",
      "titel": "Videolu Dersler",
      "playlists": [
        { "playlistId": "PLuo07btZxHLtS3uZY3-DSntmTUKXLU0gX", "kanaal": "Oranje: Taal & Tech" },
        { "playlistId": "PLuo07btZxHLuSguon0q2COFGHrOMV8bO1", "kanaal": "Oranje: Taal & Tech" },
        { "playlistId": "PLuo07btZxHLs1DYOiS6zDZRRXDqn-0OIs", "kanaal": "Oranje: Taal & Tech" },
        { "playlistId": "PLXt14hMCM9FQlkRFO_jC5aNNbjjS9oowv", "kanaal": "Learn Dutch with Frederika", "titel": "Learn Dutch for Free — NT2", "let_op": "~756 video, büyük ve kısmen karışık (alakasız öğeler olabilir)" }
      ]
    },
    {
      "id": "shadowing",
      "titel": "Shadowing",
      "playlists": [
        { "playlistId": "PLC_TXjwWZOqrI5ffyBHAj-ZfQUw0GIjNL", "kanaal": "Dutch Shadowing", "titel": "Dutch Shadowing Practice" }
      ]
    }
  ]
}
```
- Playlist başlıkları/video listeleri embed oynatıcıda YouTube'dan otomatik gelir. (Oranje'nin 3 playlist'i: Inburgering A2, Adapel B1, Grammatica — başlıkları embed'de görünür.)
- Veri koda gömülmez; playlist eklemek = bu dosyaya satır eklemek.

## SAYFA / NAVİGASYON
- **Menüye "Videolar" sekmesi** ekle (`components/Navigation.tsx` — hem mobil bottom nav hem masaüstü). Yeni sayfa: `app/videos/page.tsx`.
- Videolar sayfası: üstte iki kategori sekmesi/bölümü ("Videolu Dersler" · "Shadowing").
- Her kategori altında playlist'ler; playlist seçilince video listesi + gömülü oynatıcı.

## OYNATICI — kategoriye göre
- **Videolu Dersler:** standart gömülü oynatıcı + playlist listesi (başlık, süre). Amaç izlemek/öğrenmek. (Basit yeterli.)
- **Shadowing:** **gelişmiş oynatıcı** (YouTube IFrame API):
  - Yavaşlatma 0.5x · 0.75x · 1x (`setPlaybackRate`) — shadowing'in en kritik aracı.
  - A-B loop (A ve B işaretle, aralığı tekrarla: `getCurrentTime` izle + B'de `seekTo(A)`).
  - Tekrar (son 5 sn / baştan: `seekTo`).
  - Kullanım ipucu: "Dinle → durdur → yüksek sesle taklit et → tekrarla."

## MÜFREDATA İLİŞKİ (opsiyonel, zorunlu değil)
- Seviyeli/konulu videolar (Oranje Inburgering A2→A2, B1→B1, Grammatica→gramer; shadowing'de doktor/iş/market→ilgili tema) ilgili Etappe'ye **"önerilen video" kısayolu** olarak bağlanabilir. Ama bu bağ destekleyicidir; Etappe akışı videoya bağımlı olmaz.

## FALLBACK & KABUL KRİTERLERİ
- Embed kapalı videoda oynatıcı hata verirse "YouTube'da aç" linki göster.
- `/videos` açılıyor; iki kategori ve playlist'ler listeleniyor; seçilince gömülü oynatıcıda oynuyor.
- Shadowing oynatıcısında yavaşlatma + A-B loop + tekrar çalışıyor.
- Menüde "Videolar" girişi var (mobil + masaüstü).
- `npx tsc --noEmit` + `npm run build` temiz; mobil + dark mode uyumlu; **sadece embed (indirme yok).**

## NOT
- İnternet gerektirir (stream) — çevrimdışı çalışmaz, beklenen.
- Frederika playlist'i çok büyük (~756) ve karışık olabilir; gerekirse sayfada arama/filtre ekle, ama önce playlist'i olduğu gibi embed et.
