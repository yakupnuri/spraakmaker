# Spraakmaker — UI Modernizasyon ve Çözüm Önerileri Raporu

**Tarih:** 12 Haziran 2026
**Bağlam:** `OYUN-HATA-RAPORU.md`'de tespit edilen hataların çözümleri + oyun ve ders sayfalarının modern UI'a taşınması için tasarım önerisi.

---

# BÖLÜM A — UI STRATEJİSİ

## A1. Sorunun özü: iki tema, tek tasarım

Bugünkü mimari şöyle çalışıyor:

- Tüm oyun ve ders sayfaları **De Stijl/Mondrian** diliyle yazılmış (`bg-[var(--ds-black)]`, 3px siyah çerçeveler, köşesiz bloklar).
- "Modern" tema, bu sayfaları **yeniden tasarlamadan**, `globals.css`'teki ~95 satırlık `!important` geçersiz kılma katmanıyla (çerçeve inceltme, radius zorlama, arka plan silme, renk değişkeni remap'i) modern göstermeye çalışıyor.
- Bu hack katmanı kontrol edilemiyor: arka plan silme kuralı oyun başlıklarını/kontrollerini görünmez yaptı, `--ds-red`'in laciverte remap'lenmesi yüzünden **hata geri bildirimleri kırmızı değil mavi** görünüyor, `--ds-white` ile `--ds-gray` neredeyse aynı renk olduğu için kartlar zeminden ayrışmıyor.

**Temel teşhis: sorun tek tek CSS kuralları değil, "eski tasarımı CSS ile modern göster" yaklaşımının kendisi.** Bu katman kaldıkça her yeni sayfa/özellik aynı tuzaklara düşecek.

## A2. Önerilen strateji: **Tek tema — Modern** (destijl'i emekliye ayır)

| Seçenek | Açıklama | Değerlendirme |
|---|---|---|
| **A) Modern'e tam geçiş (ÖNERİLEN)** | Oyun + ders sayfalarının JSX'i doğrudan modern sınıflarla yeniden yazılır; globals.css'teki override katmanı tamamen silinir; destijl seçeneği kaldırılır. | Kalıcı çözüm. Bakım maliyeti tek temaya iner. Hack katmanından doğan tüm hata sınıfı yok olur. |
| B) İki temayı da düzgün desteklemek | Her sayfa için iki ayrı yerleşim (spel menüsündeki gibi `isModern ? ... : ...`). | Her ekran ×2 iş. 6 oyun + 5 fazlı ders akışı için sürdürülemez. |
| C) Hack katmanını yamamak | Satır 175'i kapsamlandırmak, renkleri ayarlamak. | En hızlısı ama kırılgan; "görünmez düğme" sınıfı hatalar geri gelir. Sadece acil yama olarak anlamlı (bkz. B4). |

Kullanıcıların tamamı telefonda ve varsayılan tema zaten modern — destijl'i gören kullanıcı yok denecek kadar az. İki temayı taşımanın getirisi yok.

## A3. Modern tasarım dili önerisi (somut tasarım sistemi)

### A3.1 Renk paleti — **anlamsal (semantic) tokenlara geçiş**

Mevcut `--ds-black/--ds-white` adlandırması, koyu modda "black = beyaz" gibi anlamsızlıklar üretiyor. Yeni adlandırma rol bazlı olmalı:

```css
:root, html[data-theme="light"] {
  --bg:        #f8fafc;   /* sayfa zemini (slate-50) */
  --surface:   #ffffff;   /* kartlar */
  --surface-2: #f1f5f9;   /* ikincil zemin, chip'ler (slate-100) */
  --text:      #0f172a;   /* ana metin (slate-900) */
  --text-muted:#64748b;   /* ikincil metin (slate-500) */
  --border:    rgba(15,23,42,.08);

  --primary:   #0f2d4a;   /* lacivert — ana CTA, başlıklar */
  --accent:    #00adb5;   /* turkuaz — vurgu, aktif durum, puan */
  --success:   #0d9488;   /* teal — doğru cevap */
  --danger:    #e11d48;   /* GERÇEK kırmızı (rose-600) — yanlış cevap */
  --warning:   #f59e0b;   /* amber — uyarı, ipucu, streak */
}
html[data-theme="dark"] {
  --bg: #0f172a; --surface: #1e293b; --surface-2: #334155;
  --text: #f8fafc; --text-muted: #94a3b8; --border: rgba(255,255,255,.1);
  --primary: #38bdf8; --accent: #22d3ee; --success: #34d399;
  --danger: #fb7185; --warning: #fbbf24;
}
```

**Kritik karar:** Mevcut modern temada "hata rengi" `--ds-red = #1b4965` (lacivert!). Bir dil öğrenme uygulamasında doğru/yanlış geri bildirimi saniyede algılanmalı — **yanlış = gerçek kırmızı, doğru = yeşil/teal** evrensel kodu korunmalı. Bu tek başına oyunların "anlaşılırlığını" ciddi artırır.

### A3.2 Tipografi ve yüzeyler

- Font: DM Sans (mevcut, korunur). Ölçek: başlık 22/28 bold, kart başlığı 16 bold, gövde 15, etiketler 11 uppercase tracking-wide.
- Kartlar: `rounded-2xl`, `border: 1px solid var(--border)`, gölge `0 4px 12px rgba(15,23,42,.05)`.
- Soru/oyun alanı: tek büyük "sahne kartı" (surface), sayfa zemininden net ayrışır.
- Butonlar: birincil CTA `rounded-xl`, `--primary` dolgu, tam genişlik, `py-4`; ikincil butonlar `surface-2` zemin.
- `!important` içeren tüm global override'lar yasak — stiller bileşenin kendi sınıflarında yaşar.

### A3.3 Paylaşılan oyun bileşenleri (bir kez yaz, 6 oyunda kullan)

Modernizasyonun asıl iş gücü tasarrufu burada. `components/game/` altında:

| Bileşen | İçerik | Çözdüğü mevcut sorun |
|---|---|---|
| **`GameShell`** | Sticky üst bar (oyun adı, puan chip'i, kapat ✕), içerik alanı, alt aksiyon barı. Alt bar `bottom: calc(64px + env(safe-area-inset-bottom))` ile **alt navigasyonun üstünde** durur. | Görünmez başlıklar (madde 1) + K1 tipi nav çakışmaları bir daha asla yaşanmaz. |
| **`ScoreBar`** | Puan / combo / doğru / yanlış / % — chip'ler halinde tek satır. | 5 oyunda kopyalanan 5-blok Mondrian skor barının yerine geçer. |
| **`FeedbackToast`** | Doğru (yeşil ✓) / yanlış (kırmızı ✗ + doğru cevap) toast'u; `framer-motion` ile alttan kayar, otomatik kapanır; yanlışta hafif shake. | zin-bouwen'deki "1.2 sn'de kaybolan, fark edilmeyen" banner sorunu. Konum sabit → kullanıcı nereye bakacağını öğrenir. |
| **`SourcePicker`** | Kaynak seçimi (tc1/tc2/az/delftse/lessen) — bottom sheet, yuvarlak checkbox kartları. | vertaal/vul-in/snelronde'deki 3 kopya kaynak ekranı tekilleşir. |
| **`GameProgress`** | Üstte ince ilerleme çubuğu + "Soru 3/20" etiketi. | Her oyunda farklı gösterilen ilerleme tutarlılaşır. |
| **`HistoryPanel`** | Doğru/yanlış geçmişi — varsayılan **kapalı akordeon** ("Geçmiş (3✓ 1✗)" başlığıyla). | Şu an iki dev kart soru alanını aşağı itiyor; mobilde oyun alanı ekrandan taşıyor. |

### A3.4 Oyun bazında modern ekran önerileri

**Zin Bouwen (cümle kurma)**
- Üstte çeviri kartı (surface, küçük "MAAK DE ZIN" etiketi).
- Kelime taşları: `rounded-full` chip'ler, `surface-2` zemin, basılı tutunca hafif büyüme (`scale: 1.05`); hedef alan kesikli çerçeveli boş kart.
- **Sürükleme yerine/yanında "tıkla-yerleştir" modu:** chip'e dokun → cümle satırına eklenir, cümledekine dokun → geri döner. Mobilde drag&drop'tan çok daha güvenilir (dnd-kit dokunma sorunları riskini de devre dışı bırakır). dnd-kit istenirse masaüstünde kalabilir.
- Kontrol → FeedbackToast; 3 hakta deneme sayısı üstte nokta göstergesi (●●○).

**Vul In (boşluk doldurma)**
- Cümle sahne kartında, boşluk **satır içi input** olarak (alt ayrı input yerine) — kullanıcı boşluğun kendisine yazar; otomatik odak.
- İpucu çevirisi kartın altında `text-muted`.

**Vertaal (çeviri yazma)**
- Soru kartı + altında otomatik büyüyen textarea kartı; Enter = kontrol.
- Yanlışta toast içinde doğru cevap + **fark vurgusu** (yanlış kelimeler kırmızı altı çizili).

**Snelronde (60 sn)**
- Üstte **dairesel geri sayım halkası** (SVG ring, son 10 sn'de `--danger`'a döner) — şu anki dev kırmızı blok yerine.
- Combo: halka yanında 🔥 + "x2/x3" chip'i; doğru cevapta `+10` uçan mikro animasyon (zin-motor'daki mevcut +10 animasyonu buraya da taşınır).
- Sonuç ekranı: tek kart — büyük puan, altında goed/fout chip'leri, "Opnieuw" CTA.

**Zin Motor (çarklar)**
- Çarklar: `surface` kart içinde, seçili satır `--accent` dolgulu `rounded-xl` pencere; scroll-snap ile kaydırma.
- **Seviye seçici: segmented control** (`surface-2` zemin üstünde hap görünümü) — şu anki görünmezlik sorunu kökten biter.
- **"DRAAI 🎰" butonu eklenir** (CONTROLEER'in soluna, ikincil stil) → mevcut ölü `handleSpinAll` + animasyon kodu canlanır. Slot makinesi hissi bu oyunun kimliği.
- Yanlış çark: çerçevesi `--danger`, hafif shake.

**Flitsen (hızlı tekrar)**
- Oyun ekranı **müzik çalar metaforu**: ortada büyük flashcard, üstünde ilerleme ("Zin 3/20") ve süre halkası; altta ⏮ ▶/⏸ ⏭ kontrol barı (GameShell aksiyon barında — artık her temada görünür).
- **TTS eklenir** (bkz. B10): kart açılınca cümle `nl-NL` sesiyle okunur; 🔊 ikonuna basınca tekrar okur. "Luister" vaadi gerçek olur.
- Dashboard: paket kartları `rounded-2xl` + **dairesel ilerleme halkası** (3/7 tur); aktif rotasyon yatay kaydırmalı şerit.

**Ders akışı (lessen/[lesId])**
- 5 faz için üstte **stepper** (① Bekijk ② Lees ③ Oefen ④ Herhaal ⑤ Klaar).
- Fase 2 alt paneli GameShell aksiyon barına taşınır → K1 nav çakışması biter.
- Kelime popup'ı: balon yerine **bottom sheet** (kelime + çeviri + "kaydet" butonu); çeviri yoksa "Sözlükte yok — kaydedildi, sonra çevrilecek" mesajı (K3'ün UX tarafı).

### A3.5 Geçiş planı (Antigravity için iş sırası)

1. **Faz 0 — Acil yamalar (UI'a dokunmadan, ~yarım gün):** B1, B2, B4, B5 düzeltmeleri. Kullanıcı şikayetleri durur.
2. **Faz 1 — Tasarım sistemi (1 gün):** Anlamsal tokenlar (`globals.css` yeniden yazımı), `components/game/` bileşenleri (GameShell, ScoreBar, FeedbackToast, SourcePicker, GameProgress, HistoryPanel).
3. **Faz 2 — Oyun sayfaları (oyun başına ~yarım gün):** Sıra: flitsen (en bozuk) → zin-motor → zin-bouwen → vul-in → vertaal → snelronde.
4. **Faz 3 — Ders akışı (1 gün):** Stepper + Fase ekranlarının modern bileşenlere taşınması.
5. **Faz 4 — Temizlik:** globals.css override katmanının (satır 90–185) silinmesi, `ui-destijl` kodunun kaldırılması, destijl ayarının settings'ten çıkarılması (mevcut kullanıcı ayarı migration: `uiStyle` her durumda "modern"a çekilir).

---

# BÖLÜM B — PROGRAM DÜZELTMELERİ (kod önerileri)

## B1. KRİTİK — Ders zin-bouwen alıştırmaları çözülemez (K2)

`app/lessen/[lesId]/page.tsx` — hem zinBouwen hem vulIn kontrolünde normalize kullan:

```ts
function normalizeAnswer(s: string): string {
  return s
    .toLocaleLowerCase("nl")
    .replace(/[.,!?;:'"„""]/g, "")  // noktalama
    .replace(/\s+/g, " ")            // çoklu boşluk
    .trim();
}

// zinBouwen onCheck (satır ~773):
const correct = normalizeAnswer(builtWords.join(" ")) ===
                normalizeAnswer(verhaal.oefeningen.zinBouwen[exIndex].antwoord);

// vulIn onCheck (satır ~750) aynı şekilde normalizeAnswer ile.
```

Bu tek fonksiyon, 80 çözülemez alıştırmanın tamamını ve "momentje ?" tipi ayrık noktalama taşlarını düzeltir. (`toLocaleLowerCase("nl")` Türkçe locale'in I→ı dönüşüm tuzağından da korur.)

## B2. KRİTİK — "Oefeningen beginnen" alt navigasyonun altında (K1)

Kısa vadeli yama, `app/lessen/[lesId]/page.tsx` satır 553:

```tsx
<div className="fixed bottom-16 md:bottom-0 left-0 right-0 ... z-40"
     style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
```

(`bottom-16` = 64px ≈ BottomNav yüksekliği; iPhone home-indicator için safe-area.) Kalıcı çözüm: A3.3'teki GameShell aksiyon barı.

## B3. YÜKSEK — İşaretlenen kelimenin çevirisi çıkmıyor (K3)

İki katmanlı çözüm, `app/lessen/[lesId]/page.tsx`:

```ts
// 1) "doos/dozen" tipi anahtarları da eşleştir + tüm derslerin sözlüklerinde ara
function lookupTranslation(word: string, all: Record<string,string>[]): string {
  const lower = word.toLowerCase();
  for (const dict of all) {
    for (const [k, v] of Object.entries(dict)) {
      if (k.toLowerCase().split("/").some(part => part.trim() === lower)) return v;
    }
  }
  return "";
}
// Çağıran taraf: lookupTranslation(norm, [verhaal.woordenschat, ...digerDersSozlukleri])
```

```ts
// 2) Yedek havuz: public/data/words-*.json dosyalarından tek seferlik birleşik
// sözlük yükle (ör. words-tc12, words-code12 ≈ 10k+ kelime) ve orada da ara.
// Yine yoksa popup'ta sessiz kalma:
setPopup({ word: norm, meaning: meaning || "(sözlükte yok — kaydedildi)" , ... });
```

UX kuralı: **işaretleme her zaman görsel onay üretmeli** — çeviri bulunamasa bile.

## B4. KRİTİK — Modern temanın oyunları görünmez yapması (acil yama)

Tam çözüm Faz 2'deki yeniden yazım; o gelene kadar `app/globals.css` satır 175'i kapsamla:

```css
/* ÖNCE (her bg-ds-black div'ini siler): */
html.ui-modern .bg-\[var\(--ds-black\)\]:not(button):not(a)... { background-color: transparent !important; }

/* SONRA (sadece Mondrian grid sarmalayıcıları): */
html.ui-modern .mondrian-gap.bg-\[var\(--ds-black\)\] { background-color: transparent !important; }
```

ve ana sayfadaki grid sarmalayıcı div'lere `mondrian-gap` sınıfı ekle. Böylece oyun başlıkları/flitsen kontrolleri anında geri gelir.

## B5. YÜKSEK — High score'a toplam puan yazılıyor

Üç dosyada oturum skorunu kullan:

```ts
// zin-bouwen (satır ~284): zinBouwen: Math.max(p.games.highScores.zinBouwen, scores.score + points)
// vul-in   (satır ~268): vulIn:   Math.max(p.games.highScores.vulIn,   scores.score + 15)
// vertaal  (satır ~101): vertaal: Math.max(p.games.highScores.vertaal, scores.score + 20)
```

Not: mevcut kullanıcıların localStorage'ındaki şişmiş high score'lar kalır; istenirse tek seferlik migration ile `highScores` sıfırlanabilir.

## B6. ORTA — Veri temizliği merkezileştirilsin (`lib/gameData.ts`)

Numara önekleri ve kirli kayıtlar yükleme katmanında temizlenmeli (oyunlara dağıtmak yerine):

```ts
function cleanSentence(s: Sentence): Sentence {
  const strip = (t: string) => t.replace(/^\*?\s*\d+\.\s*/, "").replace(/\s+/g, " ").trim();
  return { ...s, nl: strip(s.nl), tr: strip(s.tr) };
}
// loadSentences / loadSentencesFromSources dönüşlerinde .map(cleanSentence)
```

Veri dosyaları için tek seferlik script önerisi (`scripts/fix-data.mjs`):
- `sentences-az.json`: 270 kayıttaki numara öneklerini kalıcı sil.
- `sentences-tc1.json`: 5 ters/kaymış nl–tr kaydını elle düzelt (script raporlasın, insan onaylasın).
- `sentences-tc2.json`: 31 kayıtta `İk` → `Ik` (regex: `/\bİk\b/g`).

## B7. ORTA — Vertaal/Snelronde: kelime sırası denetimi

%70 "herhangi bir kelimeyle eşleş" yerine **sıra duyarlı hizalama**:

```ts
function checkTranslation(user: string, target: string): boolean {
  const u = normalizeAnswer(user).split(" ");
  const t = normalizeAnswer(target).split(" ");
  if (Math.abs(u.length - t.length) > 1) return false;
  let i = 0, j = 0, errors = 0;
  while (i < u.length && j < t.length) {
    if (levenshtein(u[i], t[j]) <= 1) { i++; j++; }
    else { errors++; if (u.length > t.length) i++; else if (t.length > u.length) j++; else { i++; j++; } }
    if (errors > Math.max(1, Math.floor(t.length * 0.15))) return false;
  }
  return true;
}
```

Mantık: kelime başına 1 harf toleransı + cümle başına ~%15 kelime hatası toleransı, **sıra korunarak**. "Word salad" artık geçemez; ufak yazım hataları yine affedilir.

## B8. KÜÇÜK — Vul-in boşluğu hep aynı kelimede

`buildGap` (vul-in satır ~15, snelronde satır ~15):

```ts
const pick = candidates.length
  ? candidates[Math.floor(Math.random() * candidates.length)]
  : { w: words[0], i: 0 };
```

## B9. ORTA — Zin Motor'a SPIN butonu

Ölü `handleSpinAll` (satır 641) için CONTROLEER'in yanına buton (modern UI'da ikincil stil):

```tsx
<button onClick={handleSpinAll} disabled={isSpinning || feedback !== null}
        className="px-6 bg-[var(--surface-2)] text-[var(--text)] font-bold ...">
  🎰 DRAAI
</button>
```

Davranış notu: spin rastgele dizilim getirir (cevap değil) — "karıştır ve kendin düzelt" mini meydan okuması olarak sunulmalı; istenmiyorsa kod tamamen silinmeli.

## B10. ORTA — Flitsen'e gerçek ses (TTS)

```ts
function speakDutch(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "nl-NL";
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}
// Cümle değişince: useEffect(() => { if (gameMode === "playing" && sentence) speakDutch(sentence.nl); }, [currentSentenceIndex, gameMode]);
// 🔊 ikonuna onClick={() => speakDutch(sentence.nl)}
```

Sıfır bağımlılık, iOS/Android/masaüstü tarayıcılarda yerleşik `nl-NL` sesleri mevcut. (iOS'ta ilk konuşma kullanıcı etkileşimi gerektirir — "START" tıklaması bunu zaten karşılıyor.)

## B11. KÜÇÜK kalemler

- **Zin-bouwen feedback süresi:** yanlışta 1200 ms çok kısa; FeedbackToast ile 2500 ms + kalan hak göstergesi (●●○).
- **`next.config.ts`:** `turbopack: { root: __dirname }` ekle → çift lockfile uyarısı biter (veya üst dizindeki gereksiz `package-lock.json`/`node_modules` kaldırılır).
- **Onboarding'e tema sorusu eklenmeyecekse** `uiStyle` ayarını settings UI'ından da kaldır (Faz 4 ile birlikte).
- **K4 (adverbia):** `lib/voegwoordenData.ts` yapısı kopyalanarak `bijwoordenData.ts` + `/bijwoorden` sayfası — mevcut voegwoorden sayfası şablon olarak birebir kullanılabilir. Backlog.

---

# BÖLÜM C — ÖNCELİKLİ YOL HARİTASI (özet)

| Sıra | İş | Etki | Tahmini efor |
|---|---|---|---|
| 1 | B1 (ders normalize) + B2 (nav çakışması) + B4 (CSS acil yaması) | Kullanıcı şikayetlerinin tamamı durur | ~yarım gün |
| 2 | B5 (high score) + B8 (rastgele boşluk) + B11 lockfile | Küçük ama görünür düzeltmeler | ~1-2 saat |
| 3 | Faz 1: tasarım tokenları + paylaşılan oyun bileşenleri | Modernizasyonun temeli | ~1 gün |
| 4 | Faz 2: oyun sayfaları modern yeniden yazım (flitsen → zin-motor → diğerleri) + B9, B10 | "Karışık UI" sorunu kökten biter | ~3 gün |
| 5 | Faz 3: ders akışı modern + B3 (sözlük fallback) | Ders deneyimi tamamlanır | ~1 gün |
| 6 | B6 (veri scripti) + B7 (çeviri denetimi) + Faz 4 temizlik | Kalite ve pedagoji | ~1 gün |

**Toplam: ~1 hafta yoğun çalışmayla uygulama hem hatasız hem tek ve tutarlı bir modern UI'a kavuşur.**
