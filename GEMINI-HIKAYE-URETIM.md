# GÖREV (Gemini): Spraakmaker için ~40 yeni hikâye yaz (CEFR seviyeli, mevcut evreni sürdürerek)

Spraakmaker (Türkçe konuşanlara Hollandaca öğreten uygulama) "Etappe" müfredatına geçiyor. Her Etappe'de 3 hikâye-bazlı Les var → ~20 Etappe için ~60 hikâye gerekiyor. Elde **20 hikâye var (A1-A2)**, **~40 yeni hikâye** (A2 takviye + B1 + B2) üretilecek.

> Girdi/örnek: `spraakmaker/public/data/lessen-verhalen.json` (mevcut 20 hikâye). **Bu dosyayı OKU, yapısını birebir kopyala, ama DEĞİŞTİRME.** Çıktıyı yeni dosyaya yaz: `spraakmaker/public/data/lessen-verhalen-nieuw.json`.

---

## 1. MEVCUT EVREN — sürdür

**Ana karakterler (hepsi nitelikli mesleklerde — bu kural, bkz. §5):**
- **Bahar** — ana karakter, hemşire (verpleegkundige), Amsterdam'dan Utrecht'e taşındı, UMC Utrecht'te çalışıyor.
- **Bram** — Bahar'ın eşi, tasarımcı/mimar (çizim masasında çalışır).
- **Ali** — komşu/arkadaş. **Yasmin, Fatima** — aile/arkadaş çevresi. **Sven, Joost** — hastane meslektaşları. **Lena** — stajyer.

**Anlatı yayı şu an:** Amsterdam → hastane hayatı, aile, komşuluk → Utrecht'e taşınma → yeni iş (UMC). Yeni hikâyeler bu yayı **Utrecht'teki yeni hayatla** sürdürebilir VEYA evrene yeni nitelikli karakterler (öğretmen, avukat, mühendis komşu/arkadaş) ekleyebilir. Ton: sıcak, günlük, gerçekçi, göçmen deneyimine saygılı.

## 2. FORMAT — `lessen-verhalen.json` şemasını birebir izle

Her hikâye nesnesi şu alanları içerir (mevcut dosyadaki bir kaydı örnek al):
```
{
  "lesId": "...",            // benzersiz, mevcutlarla çakışmayan (örn. "v_b1_01")
  "niveau": "B1",            // YENİ ALAN: A1 | A2 | B1 | B2 (her hikâyeye ekle)
  "thema": <sayı>,
  "themaTitel": "...",       // tema adı (NT2 teması, §4)
  "hoofdstuk": <sayı>,
  "hoofdstukNummer": "...",
  "verhaalTitel": "...",     // hikâye başlığı (NL)
  "verhaal": "...",          // ~450-600 kelime, paragraflar \n\n ile
  "highlights": { "verbs": [...], "conjunctions": [...], "scheidbaar": [...], "tussenwoorden": [...] },
  "woordenschat": { "nl-kelime": "tr-karşılık", ... },   // ~20-25 kelime
  "oefeningen": {
    "vulIn":       [ { "zin": "cümle ___ ile", "antwoord": "kelime", "hint": "ipucu" } ],
    "zinBouwen":   [ { "woorden": [...], "antwoord": "...", "tr": "..." } ],
    "vertaalNlTr": [ { "nl": "...", "tr": "..." } ],
    "vertaalTrNl": [ { "tr": "...", "nl": "..." } ],
    "begrip":      [ { "vraagTr": "...", "opties": [...], "antwoord": <doğru şıkkın index'i> } ]
  }
}
```

## 3. SEVİYE DAĞILIMI (~40 hikâye)
- **A2 takviye:** ~10 hikâye (mevcut Bahar yayının devamı, perfectum/imperfectum, günlük)
- **B1:** ~18 hikâye (yan cümle/bağlaç, soyutlaşan konular, görüş bildirme)
- **B2:** ~12 hikâye (karmaşık yapı, soyut/resmi konular, daha uzun)

Her hikâye `niveau` alanıyla işaretli olmalı. Seviye yükseldikçe: cümle uzar, yan cümle/bağlaç artar, kelime soyutlaşır (CEFR mantığı).

## 4. TEMALAR (NT2 — konu çeşitliliği)
Hikâyeler şu NT2 temalarına yayılsın (her tema 2-4 hikâye): werk & sollicitatie (iş, mülakat) · gezondheid & zorg (sağlık) · opleiding & studie (eğitim) · gemeente & instanties (belediye, resmi işler) · wonen & verhuizen · geld & financiën · vrije tijd & cultuur · familie & relaties · Nederland & samenleving (toplum). Konuşma odaklı: diyalog ağırlıklı sahneler iyi olur (uygulamanın amacı konuşturmak).

## 5. İÇERİK KURALI (zorunlu) — gerçekçi ama yükselten meslek anlatısı
Tam kural: `HIKAYE-ICERIK-KURALLARI.md`. Özet:
- NT2 kitaplarının "göçmen = hep temizlikçi/kasiyer" kalıbına KARŞI dur. Göçmen karakterler çeşitli ve nitelikli mesleklerde olabilir (doktor, avukat, mühendis, öğretmen, hemşire…).
- Katı "herkes doktor" da değil — **seviye-meslek bağı kur:**
  - **A1-A2 hikâyelerinde:** karakter henüz dil öğreniyor; mütevazı/geçiş işlerinde ya da iş ararken olabilir, ama "yolun başında" tonuyla (çaresiz/aşağılayıcı değil).
  - **B1-B2 hikâyelerinde:** karakter dili geliştikçe daha iyi/nitelikli işlere erişir. **"Dilini geliştirdikçe daha iyi işlerde çalışabilirsin"** mesajını hissettir. Dil = fırsat.
- Yasak: göçmeni sadece-temizlikçi/sabit-düşük-pozisyon kalıbına hapsetmek.

## 6. KALİTE KURALLARI (önemli — hatalardan kaçın)
- **zinBouwen tuzağı:** `woorden` dizisi ile `antwoord` **noktalama açısından uyumlu** olmalı. `antwoord`'daki noktalama `woorden`'da da olmalı VEYA ikisinde de olmamalı. (Geçmişte: woorden noktasız, antwoord noktalı → alıştırma hiç çözülemiyordu. Tekrarlama.)
- **begrip:** `antwoord` doğru şıkkın index'i (0-tabanlı), `opties` ile tutarlı.
- **vulIn:** `antwoord` cümledeki boşluğa (`___`) birebir oturmalı.
- Türkçe çeviriler doğal ve doğru (kelimesi kelimesine değil).
- `woordenschat` kelimeleri hikâyede gerçekten geçmeli ve hikâyenin seviyesine uygun olmalı.
- Hikâye metni akıcı, dilbilgisel doğru, gerçek Hollandaca (yapay/çeviri-kokan değil).
- Tüm `lesId` benzersiz ve mevcut dosyadakilerle çakışmaz.

## 7. ÇIKTI
- `public/data/lessen-verhalen-nieuw.json` — yeni hikâyeler (JSON array, §2 şeması).
- `HIKAYE-URETIM-RAPOR.md` — kaç hikâye, seviye dağılımı, tema dağılımı, kullanılan yeni karakterler.
- Büyük iş: batch'ler hâlinde üret (örn. önce 10 A2, sonra B1, sonra B2), her batch sonrası JSON geçerliliğini kontrol et.
- `lessen-verhalen.json` (mevcut) ve diğer veri dosyalarına DOKUNMA.

## 8. SINIR
- Bu özgün üretim olmalı (kitaplardan kopya değil) — telif-temiz.
- Seviye/kalite %100 kesin değil; üretim sonrası bir ana dili konuşan gözden geçirmeli. Şüpheli hikâyeleri rapora not et.
