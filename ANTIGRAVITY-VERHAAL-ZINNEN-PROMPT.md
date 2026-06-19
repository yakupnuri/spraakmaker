# GÖREV: Hikâye Cümleleri (Verhaal-zinnen) — Ders ↔ Oyun Entegrasyonu

## Bağlam

Bu proje bir Hollandaca öğrenme uygulaması (Next.js 16 App Router + Tailwind 4 + framer-motion, TypeScript). Kullanıcılar mobil kullanıyor. Uygulamada 20 hikâyeli ders (`app/lessen/[lesId]`, veri: `public/data/lessen-verhalen.json`) ve 6 oyun var (`app/spel/`: vertaal, vul-in, zin-bouwen, snelronde, zin-motor, flitsen). Oyunlar `components/game/` altındaki paylaşılan bileşenleri kullanıyor: `GameShell` (üst bar + içerik + aksiyon barı), `SourcePicker` (kaynak seçimi, `extraContent` prop'u destekler), `ScoreBar`, `FeedbackToast`, `HistoryPanel`.

**Hedef:** Kullanıcı bir dersi bitirince o hikâyeden seçilmiş 25 cümleyle tüm oyunları oynayabilsin; ders sonunda "oyna / quiz / kelimeleri tekrar et" seçenekleri çıksın; oyunlardaki kaynak ekranında "Spraakmaker Verhalen" kategorisi olsun (bitmemiş dersler kilitli görünür).

## ÖN KOŞUL (başlamadan kontrol et)

`public/data/verhaal-zinnen.json` dosyası mevcut ve dolu olmalı. Format:

```json
[
  { "lesId": "les_1", "titel": "Een nieuwe buur",
    "zinnen": [ { "nl": "Bahar woont in Amsterdam.", "tr": "Bahar Amsterdam'da yaşıyor." }, ... ] }
]
```

20 ders, ders başına ~25 cümle, tüm `tr` alanları dolu. **Dosya yoksa veya `tr` alanları boşsa DUR ve bunu raporla** — dosya ayrı bir süreçte üretiliyor.

## KRİTİK UYARI: ID çakışması

`lessen.json` (108 gramer dersi) ile `lessen-verhalen.json`/`verhaal-zinnen.json` (20 hikâye) **aynı ID uzayını kullanır** (`les_1` ikisinde de var ama farklı içerik). Oyunlardaki mevcut `?les=` davranışı `lessen.json`'dan okur — ona dokunma. Hikâye kaynağı her yerde **`bron=verhaal` + `les=les_X`** çifti ile ayrışır.

## Kesin kurallar

1. Mevcut oyun mantığına (puanlama, kontrol algoritmaları, localStorage anahtarları) dokunma; yalnızca veri kaynağı seçimi ve listelenen yeni UI eklenir.
2. Vertaal'deki zorluk seçici (Oplopend/Kort/Middel/Lang) bozulmayacak; verhaal modunda zorluk seçici ve kaynak ekranı ATLANIR (25 cümlelik havuz doğrudan oynanır).
3. Tüm yeni UI mevcut tasarım tokenlarıyla (`--bg, --surface, --surface-2, --text, --text-muted, --border, --primary, --accent, --accent-soft, --success, --danger`) ve mevcut bileşenlerle yazılır; `!important` yasak; mobil öncelikli (375px).
4. Her ana adımdan sonra `npx tsc --noEmit` ve `npm run build` temiz geçmeli.

## ADIM 1 — Veri katmanı: `lib/gameData.ts`

```ts
export interface VerhaalLes { lesId: string; titel: string; zinnen: Sentence[]; }
export async function loadVerhaalLessen(): Promise<VerhaalLes[]>          // dosyayı fetch eder (modül içi cache'le)
export async function loadVerhaalZinnen(lesIds: string[]): Promise<Sentence[]>  // seçili derslerin cümleleri birleşik
```

`loadSentencesFromSources`'a yeni kaynak kimliği: `"verhalen"` → tamamlanmış TÜM derslerin cümleleri. (Tamamlanma bilgisi çağırandan gelir; aşağıda.)

Kilit yardımcıları `lib/hooks.ts`'e değil ayrı küçük modüle: `lib/verhaalUnlock.ts`:
```ts
export function getUnlockedLesIds(lessons: Progress["lessons"]): string[]  // completed === true olanlar
```

## ADIM 2 — Oyunlara standart giriş: `?les=les_X&bron=verhaal`

6 oyunun TAMAMINA aynı kalıp (her sayfa zaten Suspense + searchParams kullanabilir durumda):

- `bron === "verhaal"` ve `les` parametresi varsa: SourcePicker/zorluk ekranı atlanır; `loadVerhaalZinnen([les])` ile havuz yüklenir; oyun direkt başlar.
- GameShell başlığının hemen altına bağlam chip'i (yeni küçük bileşen `components/game/LesContextChip.tsx`): `📖 Les {n} · {titel}` — `bg-[var(--accent-soft)] text-[var(--accent)] rounded-full px-3 py-1 text-xs font-bold`, yanında ✕ (çıkar → parametresiz oyuna döner).
- Oyun bazlı notlar:
  - **vertaal:** verhaal modunda difficulty uygulanmaz (havuz 25).
  - **zin-motor:** verhaal modunda seviye sekmesi gizlenir; kelime-bazlı slot modu kullanılır; mevcut 3–8 kelime filtresi havuza uygulanır (filtre sonrası <5 cümle kalırsa filtre gevşetilir: 3–10).
  - **flitsen:** verhaal modunda dashboard atlanır; 25 cümle tek "pakket" olarak baştan sona oynatılır, bitince mevcut "ronde voltooid" ekranı yerine basit tamamlama kartı + "Terug naar les" (→ `/lessen/{lesId}`) ve "Opnieuw" butonları. Flitsen'in normal paket/rotasyon ilerlemesine (localStorage `spraakmaker-flitsen-progress`) verhaal modunda YAZILMAZ.
  - **snelronde / vul-in / zin-bouwen:** havuz değişimi dışında davranış aynı.

## ADIM 3 — Ders bitiş ekranı: Fase 5 "Wat nu?"

`app/lessen/[lesId]/page.tsx` Fase5'e, mevcut sonuç içeriğinin altına 2×2 kart ızgarası (surface kart, rounded-2xl, ikon + başlık + tek satır açıklama):

1. **🎮 Speel met deze zinnen** → tıklayınca aynı ekranda açılan mini oyun seçici (6 oyunun yatay kaydırmalı/2 sütun kart listesi); her kart `/spel/<oyun>?les={lesId}&bron=verhaal` linki.
2. **🧠 Quiz** → Fase5 içinde inline quiz modu: dersin `oefeningen.begrip` soruları mevcut `BegripExercise` bileşeniyle sırayla oynatılır, sonunda "X/Y goed" özeti ve "Terug" butonu. Yeni sayfa/route YOK; Fase5 state'iyle çözülür.
3. **🃏 Woorden herhalen** → `/kaarten?les={lesId}` (Adım 5).
4. **➡️ Volgende les** → mevcut `nextLesId` davranışı (yoksa kart gizlenir).

## ADIM 4 — SourcePicker'a "Spraakmaker Verhalen" kategorisi

`components/game/SourcePicker.tsx`'e opsiyonel props:

```ts
verhalenLessen?: { lesId: string; titel: string; unlocked: boolean }[];
selectedLesIds?: string[];
onToggleLes?: (lesId: string) => void;
```

Verildiğinde kaynak listesinin ÜSTÜNE özel kart: **📖 Spraakmaker Verhalen** ("Okuduğun hikâyelerin cümleleri"). Karta tıklayınca altında ders chip'leri açılır (flex-wrap):
- unlocked: seçilebilir chip (seçili: accent dolgu) → `onToggleLes`.
- kilitli: soluk chip + 🔒, tıklanamaz, `title="Eerst de les lezen"`.
- Hiç unlocked ders yoksa kart içinde muted not: "Nog geen verhalen voltooid — lees eerst een les."

Oyun sayfaları (vertaal, vul-in, snelronde) bu props'ları doldurur: `loadVerhaalLessen()` + `getUnlockedLesIds(progress.lessons)`; start'ta seçilen ders cümleleri diğer seçili kaynaklarla birleştirilir.

## ADIM 5 — Kelime kalıcılığı + kaarten entegrasyonu

1. Yeni localStorage anahtarı: `spraakmaker-les-woorden` → `{ "les_1": ["buurman", ...] }`. Fase2'de kelime işaretlendiğinde/çıkarıldığında ders bazında buraya da yazılır (mevcut oturumluk `unknownWords` state'i aynen kalır).
2. `app/kaarten/page.tsx`'e `?les=les_X` desteği: deste = dersin `woordenschat` girdileri (kelime→çeviri) ∪ `spraakmaker-les-woorden[les_X]` (çevirisi `woordenschat`'ta bulunamayanlar "—" ile gösterilir). Sayfanın mevcut deste mekanizmasına yeni bir kaynak olarak eklenir; üstte LesContextChip gösterilir. Kaarten'in mevcut yapısını önce oku, en az invaziv biçimde ekle.

## ADIM 6 — Lessen liste sayfası

`app/lessen/page.tsx`: `progress.lessons[lesId].completed` olan ders kartlarına küçük aksiyon satırı: `▶ Speel` (→ Fase5'teki mini seçicinin basit hali: doğrudan `/spel/vertaal?les=...&bron=verhaal` yerine bir alt menü karmaşıksa tek "Speel" butonu mini seçici sayfası yerine en çok oynanan oyuna değil, `/lessen/{lesId}?fase=5` gibi hack'lere de girme — en basit çözüm: Speel butonu kullanıcıyı Fase5 "Wat nu?" ekranı yerine doğrudan 6'lı oyun seçici içeren hafif bir bottom sheet'e açar; bu sheet Fase5'tekiyle AYNI bileşen olmalı: `components/game/GameChooserSheet.tsx`). Tamamlanmamış kartlarda aksiyon yok.

## Kabul kriterleri (mobil 375×812'de doğrula)

1. `tsc` + `build` temiz; mevcut oyunların parametresiz akışları regresyonsuz (her oyunda 1 doğru + 1 yanlış cevap elle test).
2. Bir dersi tamamla → Fase5'te 4 kart görünür; "Speel" → seçilen oyun o dersin cümleleriyle açılır ve LesContextChip görünür.
3. Quiz begrip sorularını oynatır, skor özeti verir, sayfadan çıkmadan kapanır.
4. Vertaal kaynak ekranında "Spraakmaker Verhalen" kartı: tamamlanan ders seçilebilir, diğerleri 🔒; seçilen dersle oyun, o hikâyenin cümlelerini getirir.
5. `/kaarten?les=les_1` dersin kelime destesini açar; Fase2'de işaretlenen kelime kalıcıdır (sayfa yenilense de destede görünür).
6. Flitsen verhaal modu `spraakmaker-flitsen-progress`'e yazmaz; normal flitsen ilerlemesi etkilenmez.
7. `lessen.json` tabanlı eski `?les=` davranışı (bron parametresi olmadan) hâlâ çalışır.
