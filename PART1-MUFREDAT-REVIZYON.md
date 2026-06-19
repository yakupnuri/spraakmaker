# PART 1 (Gemini/ajan): Projeyi Etappe müfredatına göre yeniden düzenle

Spraakmaker (Next.js 16 App Router + Tailwind 4 + TypeScript, mobil öncelikli, tüm veri `localStorage`). Veri ve içerik katmanı hazır; şimdi **dağınık modülleri tek bir müfredat yapısına (Etappe modeli) oturt.**

> Ana referans: `docs/MUFREDAT.md` — bu görevden önce MUTLAKA oku. İçerik kuralı: `HIKAYE-ICERIK-KURALLARI.md`.
> **Yaklaşım: hepsini birden kurma. A1'de tek pilot Etappe'yi uçtan uca çalıştır (dikey dilim), sonra aynı yapı diğer seviyelere veriyle doldurulur.**

---

## Mevcut durum (bozMA)
- Çalışan sayfalar: dashboard (`app/page.tsx`), dersler (`app/lessen/` + `[lesId]` — 5 fazlı hikâye akışı), `kaarten`, `grammatica`, 6 oyun (`app/spel/*`), `meer/*`. Bunlar çalışıyor — **serbest pratik ve oyunlar korunacak.**
- Veri hazır: `public/data/cefr/` (seviyeli kelime+cümle, id-tabanlı), `zinnenbank.json` (108 konu-dersi = omurga), `lessen-verhalen.json` (20 hikâye, 5 fazlı), `uitdrukkingen.json` (deyimler), `verhaal-zinnen.json`.
- Veri yükleme: `lib/gameData.ts`; ilerleme/state: `lib/hooks.ts` (`useProgress`, localStorage `spraakmaker-progress`); tipler: `lib/types.ts`.

## Hedef yapı (docs/MUFREDAT.md'den)
```
A1 → A2 → B1 → B2  (CEFR omurga, kilitli)
  └── her seviye birkaç ETAPPE
       └── her Etappe = 5 LES
            ├── Les 1-3: hikayeli (mevcut 5 fazlı verhalen akışı)
            └── Les 4-5: gramatika + konuşma ağırlıklı
Serbest pratik (kilitsiz): oyunlar · kaarten · grammatica · uitdrukkingen
Hazırlık modları (ayrı): Ehliyet · KNM
```

---

## Adımlar

### 1. Müfredat manifesti — `public/data/etappes.json` (yeni)
Tüm Etappe/Les yapısını veriyle tanımla (koda gömme). Şema:
```json
[
  {
    "id": "etappe-a1-01",
    "niveau": "A1",
    "titel": "Eerste Stappen",         // tema adı
    "volgorde": 1,                      // sıra
    "lessen": [
      { "nr": 1, "type": "verhaal",  "titel": "Een nieuwe buur", "verhaalId": "les_1" },
      { "nr": 2, "type": "verhaal",  "verhaalId": "les_2" },
      { "nr": 3, "type": "verhaal",  "verhaalId": "les_3" },
      { "nr": 4, "type": "grammatica_spreken", "grammarTopic": "tegenwoordige-tijd", "niveau": "A1" },
      { "nr": 5, "type": "grammatica_spreken", "grammarTopic": "...", "niveau": "A1" }
    ]
  }
]
```
- `type: "verhaal"` → mevcut hikâye akışına bağlanır (`lessen-verhalen.json`'daki `verhaalId`).
- `type: "grammatica_spreken"` → gramer konusu (Grammatica modülünden) + konuşma pratiği; cümle kaynağı `cefr/zinnen-{niveau}.json` (tema/konu filtresiyle).
- **Pilot için yeterli:** sadece **1 adet A1 Etappe** tanımla (mevcut hikâyelerden 3 + 2 gramer/konuşma Les). Diğer Etappe'ler sonra eklenir.

### 2. Veri yükleme katmanı (`lib/gameData.ts` veya yeni `lib/curriculum.ts`)
- `loadEtappes()`, `loadEtappe(id)`, bir Les'in içeriğini çözen yardımcılar.
- Cümle/kelime artık `cefr/` havuzlarından seviyeye göre çekilir (id-tabanlı).

### 3. Sayfalar / navigasyon
- **Leerpad (öğrenme yolu) sayfası** — `app/leerpad/page.tsx` (veya mevcut `lessen`'i dönüştür): A1→B2 omurgası, Etappe listesi, kilit durumları.
- **Etappe detay** — 5 Les listesi, ilerleme.
- **Les akışı:**
  - `verhaal` Les → mevcut `app/lessen/[lesId]` 5 fazlı akışı yeniden kullan.
  - `grammatica_spreken` Les → gramer konusu (Grammatica panelinden) + konuşma pratiği (TTS dinle-tekrarla, Zinsbouwer, hız turu). Cümleler `cefr/zinnen`'den.
- Navigasyon (`components/Navigation.tsx`): "Leerpad" ana giriş olsun; oyunlar/kaarten/grammatica "serbest pratik" altında erişilebilir kalsın.

### 4. Kilit & ilerleme mantığı
- `localStorage`'a Etappe/Les ilerlemesi (`progress`'e yeni alan: `curriculum: { [etappeId]: { lessenDone: [...], quizPassed: bool } }`).
- Les quizi geçilince sonraki Les; Etappe quizi geçilince sonraki Etappe açılır. Serbest pratik + hazırlık modları kilitsiz.

### 5. Dashboard bağlama (`app/page.tsx`)
- "Sıradaki Les/Etappe" müfredattan gelsin (şu an `zinnenbank`'tan ham ders çekiyor). Leerpad'deki ilk tamamlanmamış Les'e yönlendir.

### 6. Serbest pratik + hazırlık modları
- Oyunlar, kaarten, grammatica, uitdrukkingen → "Serbest pratik" başlığı altında, kilitsiz, her zaman açık (mevcut hâlleri korunur, sadece cefr/ verisine bağlanır).
- Ehliyet (`words-rijbewijs`) ve KNM → "Hazırlık modu" olarak ayrı giriş (KNM verisi henüz yok → placeholder/yakında).

---

## Kabul kriterleri (PİLOT)
- `etappes.json`'da en az 1 A1 Etappe tanımlı; Leerpad sayfasında görünüyor.
- O Etappe'nin 5 Les'i açılıyor: 3 hikâye Les'i mevcut 5 fazlı akışla, 2 gramer/konuşma Les'i çalışıyor.
- Les quizi → sonraki Les kilidi açılıyor; ilerleme localStorage'da kalıcı.
- Dashboard "sıradaki Les"i doğru gösteriyor.
- Serbest pratik (oyunlar/kaarten/grammatica/deyimler) ve mevcut işlevler bozulmadı.
- `npx tsc --noEmit` + `npm run build` temiz; mobil + dark mode uyumlu (mevcut tasarım tokenları).

## Kurallar
- Tasarım tokenları kullan (`--bg, --surface, --text, --accent, --primary, --border` …); sabit renk yok; light+dark uyumlu.
- Mevcut çalışan oyun/ders mantığını bozma — yeniden kullan, sarmala.
- Büyük iş: önce pilot, sonra rapor. Tamamlanınca `PART1-RAPOR.md` yaz (ne kuruldu, hangi dosyalar, pilot Etappe nasıl test edildi, sonraki seviyeler için ne gerekiyor).
- İçerik üretme; örnek/karakter gerekirse `HIKAYE-ICERIK-KURALLARI.md`'ye uy.
