# Plan: Hikâye Cümleleri (Verhaal-zinnen) — Ders ↔ Oyun Entegrasyonu

**Amaç:** Kullanıcı bir dersi (hikâyeyi) bitirince, o hikâyeden çıkarılmış ~20 cümle ve hikâyenin kelime listesiyle tüm oyunları oynayabilsin. Ders bitiminde "Oyunlara git / Quiz ol / Kelimeleri tekrar et" seçenekleri çıksın; oyunlarda da "Spraakmaker Verhalen" kategorisi olsun.

## Mevcut durum (tespitler)

- `lessen-verhalen.json`: 20 ders/hikâye (`les_1`…), her hikâyede ~80-90 çıkarılabilir cümle var ama **sadece NL** — Türkçe çevirisi yok. Hazır nl+tr çifti olarak yalnızca oefeningen.vertaal* (~8/ders) var.
- `lessen.json`: 108 ayrı gramer dersi, cümleleri nl+tr'li. **DİKKAT: ID çakışması** — buradaki `les_1` (Introductie) ile hikâyelerin `les_1`'i (Een nieuwe buur) farklı içerik. Oyunlardaki mevcut `?les=` parametresi `lessen.json`'dan okuyor, yani bugün "ders cümleleriyle oyna" denilse yanlış havuz gelir.
- Ders akışında işaretlenen bilinmeyen kelimeler (`unknownWords`) oturumluk state — ders bitince kayboluyor. "Hikâyenin kelime listesi açılsın" için kalıcılaştırma gerekiyor.
- Oyun ilerlemesi `progress.lessons[lesId].completed` ile zaten tutuluyor → kilit/kilit açma mekanizması için altyapı hazır.

## Mimari kurgu

### 1. Veri: `public/data/verhaal-zinnen.json` (yeni dosya)

Format:
```json
[
  {
    "lesId": "les_1",
    "titel": "Een nieuwe buur",
    "zinnen": [ { "nl": "Bahar woont in Amsterdam.", "tr": "Bahar Amsterdam'da yaşıyor." }, ... ]
  }
]
```

Üretim: `scripts/extract-verhaal-zinnen.mjs`
1. Her hikâyeyi cümlelere böl (`.!?` sınırları), 3–12 kelimelik olanları al, tekrarları çıkar.
2. Çeşitlilik için seçim: kısa/orta/uzun karışımı sabit 25 cümle/ders (zorluk filtresi ve oplopend modla uyumlu).
3. `tr` alanları boş taslak üretir → çeviriler AI ile doldurulur (≈500 cümle, tek seferlik) → **Hamit gözden geçirir** → dosya commit'lenir. Çalışma zamanında çeviri YOK; her şey statik.

> ID çakışması çözümü: hikâye kaynağı için ayrı kaynak kimliği kullanılır: `bron=verhaal` + `les=les_X`. `lessen.json` tabanlı mevcut davranış (`bron=les`) ayrı kalır.

### 2. Yükleme katmanı: `lib/gameData.ts`

```ts
loadVerhaalZinnen(lesId?: string): Promise<Sentence[]>
// lesId verilirse o hikâyenin 20 cümlesi; verilmezse tamamlanan derslerin tümü
```
- `loadSentencesFromSources`'a yeni kaynak: `"verhalen"` (tamamlanmış derslerin hikâye cümleleri birleşik havuz).
- Kilit kuralı tek yerde: `getUnlockedVerhaalLessen(progress)` → `progress.lessons[lesId].completed === true` olanlar.

### 3. Oyunlara standart giriş: `?les=les_X&bron=verhaal`

6 oyunun hepsi (vertaal, vul-in, zin-bouwen, snelronde, zin-motor, flitsen) aynı kalıbı uygular:
- Parametre varsa **SourcePicker atlanır**, doğrudan o hikâyenin havuzuyla başlar.
- GameShell başlığının altında bağlam chip'i: `📖 Les 1 · Een nieuwe buur` (oyuncu hangi dersle oynadığını hep görür).
- Havuz 25 cümle olduğu için snelronde/flitsen gibi oyunlarda tekrar etmesi sorun değil; zin-motor'da mevcut 3–8 kelime filtresi uygulanmaya devam eder.

### 4. Ders bitiş ekranı: Fase 5 "Wat nu?" bölümü

`app/lessen/[lesId]/page.tsx` Fase5'e, mevcut sonuç kartının altına 2×2 aksiyon ızgarası:

| Kart | Hedef |
|---|---|
| 🎮 **Speel met deze zinnen** | Mini oyun seçici (6 oyunun kartları) → `/spel/<oyun>?les=les_X&bron=verhaal` |
| 🧠 **Quiz** | Mevcut `oefeningen.begrip` sorularıyla hızlı quiz (Fase3'ün begrip bileşeni yeniden kullanılır, ayrı sayfa gerekmez) |
| 🃏 **Woorden herhalen** | Hikâyenin kelime destesi → `/kaarten?les=les_X` (woordenschat + kullanıcının o derste işaretlediği kelimeler) |
| ➡️ **Volgende les** | Mevcut nextLesId davranışı |

### 5. Lessen liste sayfası

Tamamlanmış ders kartlarında küçük aksiyon satırı: `▶ Speel · 🧠 Quiz · 🃏 Woorden`. Tamamlanmamışlarda görünmez (önce hikâyeyi oku → motivasyon döngüsü).

### 6. Oyun tarafında kategori: "Spraakmaker Verhalen"

`SourcePicker`'a yeni kart: **"Spraakmaker Verhalen"** (📖, "Okuduğun hikâyelerin cümleleri").
- Seçilince altında ders chip'leri açılır: tamamlanmışlar seçilebilir, diğerleri 🔒 + "Eerst de les lezen".
- Hiç ders tamamlanmamışsa kart soluk + "Nog geen verhalen voltooid" notu.
- Birden çok ders seçilebilir (havuzlar birleşir) — mevcut çoklu kaynak mantığıyla aynı.

### 7. Kelime listesinin kalıcılaşması

Yeni localStorage anahtarı: `spraakmaker-les-woorden` → `{ "les_1": ["buurman", "vrachtwagen", ...] }`
- Fase2'de işaretlenen kelimeler ders bazında buraya yazılır (mevcut oturumluk state'e ek).
- Kelime destesi = `woordenschat` anahtarları ∪ işaretlenen kelimeler; kaarten sayfası `?les=` parametresiyle bu desteyi açar.

### 8. (v2 — opsiyonel) Ustalık takibi

`progress.lessons[lesId]`'e `gamePlays: { vertaal: {goed, fout}, ... }` eklenir; lessen kartında küçük rozet: "🎮 Les 1 cümleleri: %85". Flitsen'deki 7-tur mantığının hafif versiyonu. İlk sürüme alma — önce çekirdek döngü otursun.

## Uygulama sırası (Antigravity iş listesi)

1. **Veri scripti + çeviri taslağı** (`scripts/extract-verhaal-zinnen.mjs` → `verhaal-zinnen.json`). Çeviriler doldurulup onaylanmadan UI işine başlama. (~yarım gün + çeviri turu)
2. **`gameData.ts`**: `loadVerhaalZinnen`, `"verhalen"` kaynağı, kilit yardımcıları. (~1-2 saat)
3. **`?les=&bron=verhaal` standardı** 6 oyuna + bağlam chip'i. (~yarım gün)
4. **Fase5 "Wat nu?"** ızgarası + quiz yeniden kullanımı. (~yarım gün)
5. **SourcePicker "Verhalen" kategorisi** + kilit UI. (~2-3 saat)
6. **Kelime kalıcılığı + kaarten entegrasyonu.** (~2-3 saat)
7. Lessen kartı aksiyonları + cila. (~1-2 saat)

**Toplam: ~2,5 gün** (çeviri gözden geçirme hariç).

## Alınan kararlar (Hamit onayladı — 12 Haziran 2026)

1. **Cümle sayısı: hikâye başına sabit 25.** Script her hikâyeden kısa/orta/uzun karışımı 25 cümle seçer → toplam ≈500 çeviri, tek tur gözden geçirme.
2. **Quiz: begrip tekrarı.** Fase3'teki `oefeningen.begrip` soruları Fase5 quiz seçeneğinde yeniden kullanılır; yeni soru üretimi yok.
3. **Kilit: görünsün ama kilitli.** "Spraakmaker Verhalen" kaynağında 20 dersin tamamı listelenir; bitmeyenler 🔒 + "Eerst de les lezen" ile seçilemez.
