# Spraakmaker — Oyun Bölümü Hata Raporu

**Tarih:** 12 Haziran 2026
**Kapsam:** `app/spel/` altındaki 6 oyun (zin-bouwen, vul-in, vertaal, snelronde, zin-motor, flitsen)
**Test ortamı:** Canlı dev sunucusu (Next.js 16.2.3, localhost:3000), tarayıcıda her oyun tek tek oynatılarak test edildi. `npx tsc --noEmit` ve `npm run build` temiz geçiyor — yani sorunlar derleme değil, **çalışma zamanı/görsel katman** sorunları.

---

## ÖZET (TL;DR)

Oyunların çekirdek mantığı (cevap kontrolü, puanlama, geçmiş listeleri, zamanlayıcılar) testlerde **çalışıyor**. Asıl sorun: **oyun sayfaları yalnızca "De Stijl" teması için tasarlanmış, ama uygulamanın varsayılan teması "modern"**. `globals.css` içindeki modern tema geçersiz kılmaları oyun ekranlarını görsel olarak parçalıyor: başlıklar, düğmeler ve kontroller **beyaz zemin üstünde beyaz yazı olarak görünmez** hale geliyor. Flitsen oyunu modern temada fiilen oynanamaz durumda. Buna ek olarak puanlama mantığında, ölü kodda ve veri dosyalarında ikincil hatalar var.

---

## 1. KRİTİK — Modern tema, oyun ekranlarını görünmez yapıyor

**Dosya:** `app/globals.css` satır 175–177

```css
html.ui-modern .bg-\[var\(--ds-black\)\]:not(button):not(a):not(nav):not(.sticky):not(.bg-header):not(.bottom-nav) {
  background-color: transparent !important;
}
```

Bu kural aslında ana sayfadaki Mondrian grid çizgilerini (`p-[3px] bg-[var(--ds-black)]` sarmalayıcıları) modern temada kaldırmak için yazılmış. Ancak **tüm oyun sayfalarındaki siyah başlık barlarını ve siyah zeminli oyun konteynerlerini de şeffaf yapıyor**. Üzerlerindeki yazılar `text-[var(--ds-white)]` (modern temada `#f8fafc` ≈ beyaz) olduğu için sonuç: **beyaz sayfa üstünde beyaz yazı = görünmez UI**.

Tarayıcıda doğrulanan somut sonuçlar (computed style ile teyit edildi — başlık `backgroundColor: rgba(0,0,0,0)`, yazı `rgb(248,250,252)`):

| Oyun | Modern temadaki görünür hasar |
|---|---|
| **Flitsen** | Oyun ekranı tamamen `bg-[var(--ds-black)]` div içinde. Üst başlık ("Pakket X — Ronde Y/7"), "Zin X van 20", kalan süre yazısı ve **alttaki tüm kontroller (← Vorige / Pauze / ⟳ / Sla over →) görünmez**. Sadece beyaz flashcard görünüyor. Oyun fiilen kullanılamaz. |
| **Zin Motor** | Üst bardaki **seviye seçici düğmeler (Basis/A1/A2/B1/B2) görünmez** — yalnızca aktif olan (sarı→turkuaz zemin) seçili görünüyor. Oyun başlığı ve NL/TR toggle çevresi de soluk. Kullanıcı seviye değiştiremiyor (düğmeler aslında orada ama görünmüyor). |
| **Zin Bouwen, Vul In, Vertaal, Snelronde** | Sayfa üstündeki siyah başlık barı ("zin bouwen", "vul in", … + puan) görünmez; sadece sarı/turkuaz puan yazısı havada asılı duruyor. Oyunlar oynanabiliyor ama bozuk görünüyor. |

**Neden böyle:** Oyun sayfalarının yalnızca De Stijl yerleşimi var (sadece `/spel` menü sayfasının modern varyantı yazılmış). Varsayılan tema ise `lib/hooks.ts` satır 26'da (`DEFAULT_PROGRESS.settings.uiStyle: "modern"`) ve `components/ClientLayout.tsx` satır 13'te `"modern"`. Yani **her yeni kullanıcı oyunları bozuk halde görüyor**. De Stijl temasına geçilince (test ettim) tüm oyunlar düzgün görünüyor.

**Çözüm seçenekleri (Antigravity için):**
- **Hızlı çözüm:** Satır 175'teki kuralı, oyun sayfalarını dışlayacak şekilde daraltın. Örn. kuralın `:not()` listesine bir sınıf ekleyip (örn. `.keep-bg`), oyun sayfalarındaki başlık/konteyner div'lerine bu sınıfı verin. Veya kuralı sadece ana sayfadaki grid sarmalayıcılarına özel bir sınıfla (`.mondrian-grid`) hedefleyin.
- Ayrıca modern temada `--ds-gray: #ffffff` ve `--ds-white: #f8fafc` neredeyse aynı renk (satır 59–60); `bg-[var(--ds-white)]` kelime kutuları `bg-[var(--ds-gray)]` zemin üstünde neredeyse ayırt edilemiyor (zin-bouwen sürükleme kutuları çok soluk).
- **Kalıcı çözüm:** Oyun sayfalarına da modern yerleşim varyantı yazmak ya da oyun sayfalarını her zaman destijl paletiyle render etmek (oyun route'larında `html.ui-destijl` zorlamak).

---

## 2. YÜKSEK — High score mantığı yanlış (3 oyunda)

High score'a oyun oturumu puanı değil, **tüm zamanların toplam puanı (`totalPoints`) yazılıyor**. Sonuç: high score her oyunda sürekli büyüyen anlamsız bir sayı oluyor ve `meer/voortgang` istatistiklerini bozuyor.

- `app/spel/zin-bouwen/page.tsx` satır 284: `zinBouwen: Math.max(p.games.highScores.zinBouwen, p.games.totalPoints + points)`
- `app/spel/vul-in/page.tsx` satır 268: `vulIn: Math.max(p.games.highScores.vulIn, p.games.totalPoints + 15)`
- `app/spel/vertaal/page.tsx` satır 101: `vertaal: Math.max(p.games.highScores.vertaal, p.games.totalPoints + 20)`

Doğru örnekler zaten projede var: snelronde (`Math.max(..., scores.points)`) ve zin-motor (oturum puanı). Üç dosyada `p.games.totalPoints + X` yerine **oturum skoru** (`scores.score + points`) kullanılmalı.

---

## 3. ORTA — Zin Motor: "çarkları döndür" özelliği ölü kod

`app/spel/zin-motor/page.tsx` satır 641'de `handleSpinAll` fonksiyonu tanımlı, `SlotWheel` bileşeninde tam bir slot makinesi dönüş animasyonu (ses efektli) yazılmış — **ama bu fonksiyonu çağıran hiçbir düğme yok**. `isSpinning` hiçbir zaman `true` olmuyor, `spinTargets` hep boş. Oyunun adındaki "motor/makine" hissini veren ana özellik kullanıcıya hiç sunulmuyor. Ya bir "DRAAI / SPIN" düğmesi eklenmeli (örn. CONTROLEER'in yanına) ya da ölü kod temizlenmeli.

## 4. ORTA — Vertaal/Snelronde: cevap kontrolü kelime sırasını hiç denetlemiyor

`vertaal/page.tsx` satır 76–83 ve `snelronde/page.tsx` satır 126–129: kullanıcının her kelimesi, hedef cümlenin **herhangi bir** kelimesiyle (levenshtein ≤ 1) eşleşirse sayılıyor; eşleşme oranı ≥ %70 ise "Goed!". Yani:
- Kelime sırası tamamen yanlış cümleler doğru kabul ediliyor (dil öğrenme uygulaması için ciddi pedagojik hata — Hollandaca'da kelime sırası temel konu).
- Aynı kelimeyi tekrar yazmak ("ik ik ik ik") birden çok eşleşme sayabiliyor.

Öneri: sıra duyarlı bir karşılaştırma (örn. normalize edilmiş tam eşitlik + levenshtein toleransı, ya da kelime bazlı hizalama).

## 5. ORTA — Vul In / Snelronde: boşluk hep aynı kelimede açılıyor

`vul-in/page.tsx` satır 10–21 ve `snelronde/page.tsx` satır 12–17 (`buildGap`): aday kelimelerden **her zaman ortadaki** seçiliyor (`Math.floor(candidates.length / 2)`). Aynı cümle her geldiğinde aynı kelime soruluyor; tekrar oynanabilirliği düşürüyor. `Math.floor(Math.random() * candidates.length)` yeterli.

## 6. ORTA — Flitsen: "Luister" deniyor ama ses yok

Oyun menüsü ve oyun içi metinler "Luister, lees en spreek hardop na" diyor, ekranda 🔊 ikonu animasyonla duruyor — ama **hiçbir TTS/ses çalınmıyor**; tek ses süre dolunca çalan bip (`playBeepTone`). Web Speech API (`speechSynthesis`, `nl-NL`) ile cümle seslendirme eklenmeli ya da metinlerden "luister" ifadesi kaldırılmalı.

---

## 7. VERİ KALİTESİ SORUNLARI (`public/data/`)

Komut dosyasıyla tarandı, somut sayılar:

1. **`sentences-az.json`: 335 cümlenin 270'inde numara öneki var** ("`7. Ik zal ervoor zorgen!`"). Yalnızca zin-motor bunları temizliyor (`cleanSentenceText`, zin-motor/page.tsx:145). Vertaal, vul-in ve snelronde "az" kaynağını seçince numaralar soruda görünüyor ve eşleşme oranını bozuyor. Temizlik `lib/gameData.ts`'e (yükleme katmanına) taşınmalı.
2. **`sentences-tc1.json`: ~5 kayıtta nl/tr alanları ters ve kaydırılmış** (örn. `nl: "Üzümün fiyatı ne kadar?"`, `tr: "Anders nog iets?"` — bir blok satır hizasız). Bu yüzden zin-motor A1 çarklarında **Türkçe kelimeler** ("Benimle" vb.) Hollandaca seçenek olarak çıkıyor (testte bizzat görüldü).
3. **`sentences-tc2.json`: 31 kayıtta "Ik" yerine Türkçe büyük İ ile "İk"** yazılmış (`İk heb gelijk`). Görselde yanlış, harf bazlı kontrollerde toleransı yiyor.
4. `lessen.json`'da 4 kayıt sadece "Tuğba" özel ismi içeriyor — sorun değil, yanlış pozitif.

---

## 8. KÜÇÜK / RİSK NOTLARI

- **Dark mode çifte risk:** `globals.css`'te hem `:root` hem `html.ui-modern`/`html.ui-destijl` için `prefers-color-scheme: dark` blokları `--ds-white`/`--ds-black`'i takas ediyor. Oyun sayfalarında ise `text-white`, `bg-red-50`, `bg-green-100`, `border-white` gibi **sabit** Tailwind renkleri var (özellikle zin-motor hata panelleri, flitsen kontrolleri). Koyu modda bu kombinasyonlar yer yer okunmaz kontrast üretir. Madde 1 çözülürken birlikte ele alınmalı.
- **Zin Bouwen geri bildirimi sessizce kayboluyor:** yanlış denemede (1-2. hak) "Fout!" bandı yalnızca 1.2 sn görünüp siliniyor; testte düğmeye basıldığında kullanıcının hiçbir şey olmadı sanması çok kolay (özellikle banner görünmezken — madde 1 ile birleşince). Süre uzatılabilir veya kalıcı bir deneme sayacı gösterilebilir.
- **Çift lockfile uyarısı:** hem proje kökünde hem `spraakmaker/` içinde `package-lock.json` + `node_modules` var; Next.js workspace kökünü yanlış çıkarsayabiliyor (build sırasında uyarı veriyor). Üst dizindeki gereksizse kaldırılmalı ya da `next.config.ts`'e `turbopack.root` eklenmeli.
- `app/spel/page.tsx` De Stijl menüsünde "6 spellen" yazıyor ve 6 oyun da mevcut — buradaki rotalar sağlam (`/spel/vertaal` dahil hepsi build çıktısında var).

---

## KULLANICI BİLDİRİMLERİ (WhatsApp) — TEŞHİS EDİLDİ

Kullanıcıların WhatsApp'tan bildirdiği 4 sorun incelendi; üçü **doğrulanmış hata**, biri özellik isteği.

### K1. "Metni okuyunca altta 'Oefeningen beginnen' çıkmıyor, devam edemiyorsun" — DOĞRULANDI, KRİTİK

**Kök neden:** `app/lessen/[lesId]/page.tsx` satır 553 — Fase 2 (okuma) ekranındaki "Oefeningen beginnen →" düğmesi `fixed bottom-0 ... z-40` panelde. Mobil alt navigasyon ise (`components/Navigation.tsx` satır 27–28) `fixed bottom-0 ... z-50`. **Navigasyon çubuğu (z-50), ders düğmesini (z-40) tamamen örtüyor.**

Canlı testte doğrulandı (375×812 mobil viewport): düğme y=754–812 aralığında, ekranda ama `document.elementFromPoint` ile düğmenin merkezine dokununca tıklamayı **alt navigasyonun ikonu yakalıyor** — düğmeye basmak imkânsız. Masaüstünde alt nav gizli (`md:hidden`) olduğu için sorun görünmüyor; **sadece mobil/telefon kullanıcılarını vuruyor** (kullanıcıların tamamı telefonda).

**Çözüm:** Fase 2'deki panele mobilde alt nav yüksekliği kadar boşluk ver (`bottom-16 md:bottom-0`) **veya** ders akışı sırasında alt navigasyonu gizle **veya** panelin z-index'ini `z-[60]` yap (bu durumda nav erişilemez olur — ilk iki seçenek daha doğru).

### K2. "Cümle yazıp kontrol edince aynı olmasına rağmen yanlış diyor" + ekran görüntülerindeki "olmadığı için mi yanlış diyor" — DOĞRULANDI, KRİTİK

**Kök neden:** Derslerdeki zin-bouwen alıştırmalarının **80/80'i (TAMAMI) çözülemez durumda.** `public/data/lessen-verhalen.json` içinde `woorden` dizileri noktalama içermiyor, `antwoord` alanları içeriyor:

```
woorden:  ["in", "Amsterdam", "Bahar", "woont"]
antwoord: "Bahar woont in Amsterdam."   ← sondaki nokta!
```

Kontrol ise birebir eşitlik (`app/lessen/[lesId]/page.tsx` satır 773–779): `builtWords.join(" ") === antwoord` (trim+lowercase). Kullanıcı kelimeleri **doğru sırayla dizse bile** "Bahar woont in Amsterdam" ≠ "bahar woont in amsterdam**.**" → her zaman "✗ Fout. Juiste volgorde: …" (satır 1034 — kullanıcının gönderdiği ekran görüntüsündeki metinle birebir aynı). Ayrıca bazı alıştırmalarda noktalama ayrı taş olarak verilmiş (`["Bram", …, "?"]`) → join boşluk ekliyor ("momentje ?") → yine asla eşleşmiyor.

**Çözüm:** Karşılaştırmadan önce her iki tarafı normalize et (noktalama ve fazla boşlukları sil, lowercase) — tek satırlık değişiklik alıştırmaların tamamını kurtarır. Alternatif: veri dosyasında `woorden` dizilerine noktalamayı dahil etmek (80 kayıt düzeltmesi).

Not: Aynı şikayet **vertaal oyununda** da yaşanabilir — "az" kaynağındaki numara önekleri ("7. Ik zal…") hedef kelime sayılıyor, kullanıcı doğru yazsa da kısa cümlelerde %70 eşiğinin altına düşürebiliyor (bkz. madde 7.1).

### K3. "Mark yapılan kelimenin çevirisi çıkmıyor" — DOĞRULANDI, YÜKSEK

**Kök neden:** Fase 2'de bir kelimeye dokununca çeviri balonu yalnızca kelime o dersin `woordenschat` sözlüğünde varsa gösteriliyor (`app/lessen/[lesId]/page.tsx` satır 389–390: `if (meaning)`). Ölçüm sonucu: **20 dersteki 4.496 benzersiz hikâye kelimesinin 4.159'u (%93) sözlükte yok.** Ders başına sözlük ~25 kelime, hikâyeler 200+ kelime. Yani işaretlenen kelimelerin büyük çoğunluğu için hiçbir çeviri çıkmıyor; Fase 4 (tekrar) ekranında da bu kelimeler "—" olarak görünüyor (satır 1260).

Ek kusur: 3 sözlük anahtarı "doos/dozen" formatında — `lookupTranslation` birebir anahtar eşleşmesi yaptığı için "doos" kelimesi sözlükte olduğu halde bulunamıyor.

**Çözüm önerileri:** (a) işaretlenen kelime ders sözlüğünde yoksa `public/data/words-*.json` havuzlarında yedek arama yap; (b) yine bulunamazsa balonda "çeviri bulunamadı" göster (sessizce hiçbir şey göstermemek kullanıcıda "bozuk" hissi yaratıyor); (c) "doos/dozen" tipi anahtarları `/` üzerinden bölerek eşleştir; (d) uzun vadede sözlük kapsamını veri tarafında genişlet.

### K4. (Sevde, B2) "Conjuncties kısmının yanına adverbia da ekleyebilirsiniz" — ÖZELLİK İSTEĞİ

Hata değil. Uygulamada `voegwoorden` (bağlaçlar) bölümü var; **bijwoorden/adverbia (zarflar)** bölümü yok. B2 kullanıcısından gelen geliştirme önerisi — backlog'a alınabilir (mevcut `voegwoordenData.ts` yapısı şablon olarak kullanılabilir).

---

## TEST SONUÇLARI (çalışan kısımlar — referans)

Masaüstü tarayıcıda canlı doğrulandı:

- **Vul In:** doğru cevap → "Goed!", +15 puan, geçmiş kartı güncelleniyor. ✅
- **Vertaal:** doğru çeviri → "Goed!", +20 puan. ✅
- **Snelronde:** kaynak seçimi → başlangıç ekranı → 60 sn sayaç işliyor, soru geliyor. ✅
- **Zin Motor:** çark okları ve CONTROLEER çalışıyor; yanlışta "Poging 1/3" + yanlış çark listesi geliyor. ✅
- **Zin Bouwen:** state mantığı çalışıyor (3 yanlış denemede çözüm gösterip yeni cümleye geçiyor, geçmiş kartları doluyor); sürükle-bırak dnd-kit ile kurulmuş (otomatik test edilemedi, elle doğrulanmalı). ✅
- **Flitsen:** zamanlayıcı, otomatik ilerleme ve paket rotasyonu çalışıyor; **ama modern temada UI görünmez** (madde 1). ⚠️

## ÖNCELİK SIRASI ÖNERİSİ

1. **K2** (ders zin-bouwen çözülemez — 80/80 alıştırma) — kullanıcılar aktif şikayetçi, tek satırlık normalize düzeltmesi.
2. **K1** ("Oefeningen beginnen" alt nav altında — mobilde ders akışı kilitleniyor) — kullanıcılar aktif şikayetçi.
3. Madde 1 (modern tema CSS'i) — "oyunlar çalışmıyor" algısının ana kaynağı.
4. **K3** (işaretli kelime çevirisi çıkmıyor — sözlük kapsaması %7).
5. Madde 2 (high score) — küçük, üç satırlık düzeltme.
6. Madde 7.1 + 7.2 (az numaraları, tc1 swap) — veri düzeltmesi.
7. Madde 4 (vertaal sıra kontrolü) ve 3 (spin düğmesi) — pedagoji/özellik.
8. **K4** (adverbia bölümü) — özellik isteği, backlog.
