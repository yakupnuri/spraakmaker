# GÖREV: zin-motor oyununu "Zinsbouwer" (öge-yuva cümle kurma) olarak yeniden yaz

## Bağlam

Spraakmaker, Hollandaca öğrenme uygulaması (Next.js 16 App Router + Tailwind 4 + framer-motion, TypeScript). Kullanıcılar mobil. `app/spel/zin-motor/page.tsx` şu an **dönen çark / kelime makinesi** mantığıyla yazılmış; bu yanlış bir yorum ve bozuk çalışıyor (rastgele kelime havuzu, anlamsız kelimeler, bağlamsız içerik). **Tamamen sökülüp aşağıdaki öge-yuva mantığıyla yeniden yazılacak.**

Oyunun amacı bir **cümle dizimi (zinsbouw) çalışması**: öğrenci bir Türkçe cümleyi, Hollandaca cümlenin ögelerini (özne, fiil, zaman, zarf, nesne/yer, ayrılabilir ek) doğru kelimelerle ve doğru yere koyarak kurar. Böylece hem **kelimenin gramer işlevini/türünü** hem **cümledeki yerini (woordvolgorde)** öğrenir.

## Kesin kurallar

1. Dönen çark, spin animasyonu, blur, tık sesi — `SlotWheel`, `handleSpinAll`, `playClickSound` vb. hepsi **silinecek**. Bu bir kumar/çark oyunu değil, bir gramer yerleştirme oyunudur.
2. Mevcut tasarım tokenlarıyla (`--bg, --surface, --surface-2, --text, --text-muted, --border, --primary, --accent, --accent-soft, --success, --danger`) ve mevcut `components/game/` bileşenleriyle (GameShell, ScoreBar, FeedbackToast) yazılır. `!important` yok.
3. Mobil öncelikli (375px). Etkileşim **tıkla-seç → tıkla-yerleştir** olacak (sürükle-bırak mobilde güvenilmez; masaüstünde ek olarak kalabilir ama tıklama esas).
4. Oyun **yalnızca** `public/data/zin-motor.json` verisini kullanır. Seviyeye göre `sentences-tc1/tc2` gibi düz cümle dosyalarını çekmek **kaldırılır** (bağlamsız "Allah en büyüktür" tipi içerik buradan geliyordu; bir daha olmayacak).
5. `npx tsc --noEmit` ve `npm run build` temiz geçmeli.

## Veri yapısı (HAZIR — değiştirme)

`public/data/zin-motor.json`:
```json
{
  "sentences": [
    {
      "tr": "O (erkek) dün bana telefon etti.",
      "nl": "Hij belde gisteren mij op.",
      "tr_parts": [
        { "text": "O (erkek)", "type": "onderwerp" },
        { "text": "dün", "type": "tijd" },
        { "text": "bana", "type": "object" },
        { "text": "telefon etti", "type": "werkwoord" }
      ],
      "components": [
        { "type": "onderwerp", "correct": "Hij" },
        { "type": "werkwoord", "correct": "belde" },
        { "type": "tijd", "correct": "gisteren" },
        { "type": "object", "correct": "mij" },
        { "type": "scheidbaar", "correct": "op" }
      ]
    }
  ],
  "pools": { "onderwerp": [...], "werkwoord": [...], "tijd": [...], "bijwoord": [...], "object": [...], "scheidbaar": [...] }
}
```

- `components` = Hollandaca cümlenin **doğru sıradaki** ögeleri. Her yuva bir component'tir; `correct` o yuvaya gelmesi gereken NL kelime.
- `tr_parts` = üstte gösterilecek **Türkçe hedef cümle**, doğal Türkçe sırada renkli parçalar. (Ayrılabilir ekler — scheidbaar — Türkçe'de fiile gömülüdür, bu yüzden tr_parts'ta yer almaz; werkwoord parçası tam Türkçe fiili içerir.)
- `pools` = her tür için çeldirici havuzu (NL kelimeler).

## Renk-öge haritası (SABİT — `lib/zinsbouwTypes.ts` olarak oluştur)

Bu harita üç yerde de aynı kullanılır: Türkçe hedef cümle parçaları, boş yuva etiketleri, kelime havuzundaki çeldiriciler.

```ts
export const OGE_RENKLERI: Record<string, { nl: string; tr: string; bg: string; soft: string; text: string; border: string }> = {
  onderwerp:  { nl: "Onderwerp",  tr: "özne",    bg: "#f59e0b", soft: "#fef3e2", text: "#92560a", border: "#f59e0b" },
  werkwoord:  { nl: "Werkwoord",  tr: "fiil",    bg: "#d93a3a", soft: "#fce8e8", text: "#991b1b", border: "#d93a3a" },
  tijd:       { nl: "Tijd",       tr: "zaman",   bg: "#7f77dd", soft: "#efedfe", text: "#3c3489", border: "#7f77dd" },
  bijwoord:   { nl: "Bijwoord",   tr: "zarf",    bg: "#378add", soft: "#e6f1fb", text: "#0c447c", border: "#378add" },
  object:     { nl: "Object",     tr: "nesne/yer", bg: "#1d9e75", soft: "#e1f5ee", text: "#085041", border: "#1d9e75" },
  scheidbaar: { nl: "Scheidbaar", tr: "fiil eki", bg: "#0f766e", soft: "#ccfbf1", text: "#134e4a", border: "#0f766e" },
};
```
(Renkler sabit hex; dark mode'da da okunur tonlar. İleride yeni tür eklenirse — ontkenning, voegwoord, bijvoeglijk — bu haritaya satır eklenir.)

## Ekran düzeni (yukarıdan aşağıya)

1. **GameShell** başlığı: "Zinsbouwer" + puan chip'i.
2. **Türkçe hedef cümle kartı** (surface): üstte küçük "BU CÜMLEYİ KUR" etiketi; altında `tr_parts` dizisi sırayla, her parça kendi öge renginde rozet (`soft` arka plan + `text` renk, `rounded-md px-2`).
3. **Yuva şeridi** (yatay, soldan sağa, `components` sırasında): her yuva = üstte renkli etiket bandı (`bg` + iki dilli: "Onderwerp / özne"), altında boş gövde (kesik çerçeve `border-dashed` + soft zemin + "＿" placeholder). Yuvalar mobilde sığmazsa yatay scroll; 3-5 yuva tipik. Bir yuva "seçili" olabilir (vurgulu çerçeve + glow) ama zorunlu değil — kullanıcı kelimeyi seçip yuvaya basacak.
4. **Karışık kelime havuzu kartı** (surface): "KELİMELER — doğru yuvaya yerleştir". İçinde TÜM yuvaların doğru kelimeleri + her türden birkaç çeldirici, **tek havuzda karışık** (shuffle), her kelime ait olduğu türün renginde chip. Seçili kelime vurgulu (kalın çerçeve + glow).
5. **Controleer** butonu (primary).

## Oyun mantığı

### Kurulum (her cümle)
- `zin-motor.json`'dan rastgele cümle seç (oturumda ~10-15 cümlelik tur; bitince sonuç ekranı).
- Yuvalar = `components` (boş başlar).
- Havuz = her component'in `correct` kelimesi **+ çeldiriciler**: her türden, o türün `pools`'undan, cümlede olmayan 1-2 kelime (toplam havuz ~8-12 kelime). Hepsi birlikte `shuffle`'lanır.

### Etkileşim (tıkla-seç → tıkla-yerleştir)
- Havuzdaki kelimeye dokun → "seçili" olur.
- Bir yuvaya dokun → seçili kelime oraya yerleşir, havuzdan kalkar.
- Dolu yuvaya tekrar dokun → kelime havuza geri döner (düzeltme).

### Geri bildirim — İKİ KATMANLI (önemli)
- **Tür hatası anında engellenir:** Seçili kelimenin türü, dokunulan yuvanın türünden farklıysa **yerleşmez** (kısa shake + yuva kırmızı flaş). Çünkü renk zaten ipucu; yanlış renk kutuya koymak öğrenme değil dikkatsizliktir. (Kelimenin türü: havuzdaki her kelime hangi `pools` listesinden geldiğini taşımalı — kurulum sırasında `{ word, type }` olarak sakla.)
  - İstisna: aynı kelime birden çok türde olabilir mi? Pratikte hayır; `pools` türleri ayrık. Bir kelime birden çok pool'da varsa, o kelimenin bu cümledeki component type'ı esas alınır.
- **Kelime hatası Controleer'de:** Doğru türe ama yanlış kelime konursa (örn. werkwoord yuvasına `eet` ama doğrusu `belde`), bu **ancak Controleer'de** anlaşılır. Her yuva yeşil (doğru) / kırmızı (yanlış) olur; yanlışlarda doğru kelime gösterilir + FeedbackToast.

### Puanlama
- Tüm yuvalar doğru → puan (mevcut +10 mantığı korunabilir), `progress.games.highScores.zinMotor` ve stats güncellenir (mevcut updateProgress yapısını koru, sadece oyun mekaniği değişiyor).
- `feedback_phrases`'ten rastgele tebrik gösterilebilir.

### Zorluk (opsiyonel, varsa basit tut)
- Çeldirici sayısı zorlukla artar: kolay = her türden +1, zor = +2-3. Header'da segmented control olarak eklenebilir; eklenmezse sabit orta seviye.

## Kabul kriterleri (mobil 375×812'de doğrula)

1. `tsc` + `build` temiz; dönen çark / SlotWheel / spin koduna ait hiçbir kalıntı yok (`grep -rn "SlotWheel\|handleSpinAll\|isSpinning\|playClickSound" app` → 0).
2. Oyun açılır; Türkçe hedef cümle `tr_parts` ile renkli gösterilir; her öge kendi renginde.
3. Yuvalar boş başlar, renkli + çift dilli etiketli; havuz karışık ve renkli.
4. Kelime seç → doğru türdeki yuvaya konur; **yanlış türdeki yuvaya konmaz** (shake + flaş).
5. Tüm yuvalar dolunca Controleer → her yuva yeşil/kırmızı; doğru kelime ama yanlış seçim Controleer'de yakalanır.
6. Renk tutarlılığı: Türkçe cümledeki "özne" rengi = o yuvanın rengi = havuzdaki özne kelimelerinin rengi (turuncu); fiil hep kırmızı; zaman hep mor; vb.
7. `sentences-tc1/tc2` gibi düz cümle dosyaları bu oyunda HİÇ yüklenmiyor; içerik yalnızca `zin-motor.json`'dan.
8. Oyun mantığı regresyonsuz: bir turu baştan sona oyna, puan/highscore güncellensin.

## Notlar
- Mevcut `zin-motor.json` 20 cümle içeriyor (öge türleri: onderwerp, werkwoord, tijd, bijwoord, object, scheidbaar). İçerik genişletme (daha çok cümle, yeni öge türleri) bu görevin DIŞINDA; ayrıca yapılacak.
- Türkçe hedef cümleyi `tr_parts`'tan kur; düz `tr` alanı yedek/erişilebilirlik için kalsın.
- Bu oyun mevcut "zin-bouwen" (kelime sıralama) oyunundan farklıdır; onu değiştirme.
