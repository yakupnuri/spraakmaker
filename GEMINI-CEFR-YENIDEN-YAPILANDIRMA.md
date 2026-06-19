# GÖREV (Gemini): Kelime ve cümle verisini CEFR seviyesine göre yeniden yapılandır

Spraakmaker, Türkçe konuşanlar için Hollandaca öğrenme uygulaması. Mevcut kelime/cümle verisi **kitap/kaynak adına göre** dağınık (`words-code3`, `words-tc12`, `sentences-delftse`…). Bunu **CEFR seviyesine göre** (A1, A2, B1, B2) yeniden organize edip, gelecekteki müfredat + ses + AI katmanlarına hazır **id-tabanlı** bir yapıya dönüştür.

> Çalışma dizini: `spraakmaker/public/data/`. Tüm girdi dosyaları burada. Çıktıları `spraakmaker/public/data/cefr/` altına yaz. **Mevcut dosyaları SİLME** — yeni yapı paralel oluşturulacak, geçiş sonra yapılacak.

---

## 1. GİRDİ DOSYALARI

**Kelimeler (10 dosya, ~12.047 kayıt → ~10.785 benzersiz):** alanlar `{nl, tr, en?, chapter?}`
`words-aw.json` (1776), `words-code12.json` (1379), `words-code3.json` (1253), `words-code4.json` (1152), `words-inzicht.json` (1243), `words-nlen.json` (941), `words-rijbewijs.json` (1414), `words-tc12.json` (956), `words-ww.json` (1591), `words-zit.json` (342)

**Cümleler (~8.970 toplam, kaynak kaba CEFR veriyor):** alanlar `{nl, tr}`
- `sentences-tc1.json` (548) → başlangıç **A1**
- `sentences-tc2.json` (1168) → **A2**
- `sentences-delftse.json` (1483) → **B1**
- `sentences-az.json` (335) → **B1-B2 ama kirli, tek tek bak**
- **`zinnenbank.json` (108 ders, ~5.434 cümle) → ÇOK ÖNEMLİ ana kaynak, A1→B1 aralığı.** Yapısı farklı: `[{ id, title, sentences: [{nl, tr}] }]`. Cümleler ders içine gömülü — `sentences[]`'i düzleştir (flatten). Ders sırası kaba seviye ipucu verir: erken dersler (Les 1-40 civarı) A1, ortalar A2, geç dersler B1. Ama cümle bazında §5 ile ince ayar yap.

---

## 2. HEDEF ŞEMA (id-tabanlı)

Her kayıt:
```json
{
  "id": "a1-w-0001",            // {level}-w (woord) / {level}-z (zin) + sıra; benzersiz, kalıcı
  "nl": "wonen",
  "tr": "oturmak, ikamet etmek",
  "level": "A1",                // A1 | A2 | B1 | B2  (ZORUNLU)
  "artikel": "de",              // sadece isimlerde (de/het); yoksa alanı koyma
  "pos": "werkwoord",           // woord türü: zelfstandig nw / werkwoord / bijvoeglijk nw / uitdrukking ... (mümkünse)
  "theme": null,                // mümkünse müfredat teması; emin değilsen null
  "grammar_tag": null           // cümlelerde mümkünse (tegenwoordige-tijd, perfectum, bijzin...); değilse null
}
```
`level` dışındaki etiketler **"mümkünse"** — emin olamadığında `null` bırak, uydurma.

## 3. ÇIKTI DOSYALARI — hepsi YENİ adlarla, `public/data/cefr/` altında

**Önemli:** Mevcut dosyaların (`words-*.json`, `sentences-*.json`, `zinnenbank.json`) HİÇBİRİ değiştirilmez/silinmez/üzerine yazılmaz. Tüm çıktı, mevcut isimlerle karışmayacak şekilde **yeni `cefr/` klasöründe ve yeni adlarla** oluşturulur:

**Birleşik id-havuzları (tümü):**
- `woordenschat-alles.json` — tüm benzersiz kelimeler, tek havuz (§2 şeması).
- `zinnen-alles.json` — tüm cümleler, tek havuz.

**Seviyeye göre ayrı dosyalar (havuzdan türetilir):**
- Kelimeler: `woordenschat-a1.json` · `woordenschat-a2.json` · `woordenschat-b1.json` · `woordenschat-b2.json`
- Cümleler: `zinnen-a1.json` · `zinnen-a2.json` · `zinnen-b1.json` · `zinnen-b2.json`

**Rapor:**
- `RAPOR.md` — ne yaptığın + seviye dağılım tablosu + temizlenen/atlanan kayıtlar + emin olamadığın (gözden geçirilmeli) sınır kayıtların listesi.

(Tüm kaynaklar — 10 kelime dosyası + 4 cümle dosyası + zinnenbank.json — bu yeni seviye-temelli dosyalarda birleşir; orijinal kaynak adları çıktıda kullanılmaz.)

## 4. ADIMLAR

### A) Kelimeler
1. **Birleştir:** 10 dosyayı tek listede topla.
2. **Temizle:**
   - `nl` alanından ASIL kelimeyi/öbeği çıkar. Uzun tanımları ayıkla: "antibiotica, medicijnen die bacteriën doden" → `nl: "antibiotica"`, tanımı at (gerekirse örnek olarak tutma).
   - Artikel ekliyse ayır: "achtergrond, de" → `nl: "achtergrond"`, `artikel: "de"`.
   - Numara/yıldız/işaret öneklerini temizle ("het werkwoord *" gibi gramer-meta terimlerini **atla** — bunlar kelime değil; RAPOR'a "atlanan meta" olarak yaz).
3. **Dedup:** Aynı `nl` (küçük harf) → tek kayıt. Çeviriler farklıysa en açık/en doğru `tr`'yi seç (gerekirse birleştir).
4. **CEFR ata** (bkz. §5). Her kelimeye A1/A2/B1/B2.
5. **id ver**, şemaya dök.

### B) Cümleler
1. **`zinnenbank.json`'u düzleştir:** 108 dersin `sentences[]`'ini tek listeye aç. Ders sırasını kaba seviye başlangıcı olarak kullan (erken dersler A1 → geç dersler B1). `id`/`title` alanlarını cümle havuzuna taşıma; sadece nl/tr al (istersen kaynak izini RAPOR'da tut).
2. **Diğer cümle dosyalarını birleştir**, kaynak → başlangıç seviyesi (tc1=A1, tc2=A2, delftse=B1).
3. **`az.json` temizliği:** numara öneklerini ("7. ") sil, deyim/eksik olanları ele; her birine tek tek seviye ver.
4. **İnce ayar:** Başlangıç seviyesini sabit kabul etme — her cümleyi §5 kriterleriyle değerlendir, gerekiyorsa bir seviye yukarı/aşağı kaydır.
5. **Dedup** (aynı nl — özellikle `zinnenbank.json` ile `sentences-tc1/tc2` arasında çakışma olabilir), **id ver**, şemaya dök.

## 5. CEFR SEVİYELEME KRİTERLERİ

**Kelimeler** (CEFR sıklık + somutluk mantığı):
- **A1:** en temel, yüksek sıklık, somut günlük (huis, eten, gaan, water, groot, ik, moeder).
- **A2:** günlük rutin, somut ama daha geniş (afspraak, winkel, betalen, gisteren, gezond).
- **B1:** tanıdık konularda soyutlaşan, orta sıklık (ervaring, mening, regeling, verantwoordelijk, bovendien).
- **B2:** soyut/akademik/düşük sıklık, resmi (desondanks, vooronderstelling, ingrijpend, beleid).

**Cümleler** (yapı + uzunluk + kelime zorluğu birlikte):
- **A1:** kısa (≈3-6 kelime), basit şimdiki zaman, temel kelime, tek cümle.
- **A2:** günlük (≈5-9 kelime), perfectum/basit bağlaç (en, maar, want), somut.
- **B1:** yan cümle/bağlaç içeren (omdat, dat, terwijl), ≈8-14 kelime, soyutlaşan içerik.
- **B2:** karmaşık yapı, soyut/resmi konu, uzun, ileri gramer.

Sınırda kaldığında: kelime için **sıklık** belirleyici, cümle için **gramatik karmaşıklık** belirleyici. Emin olamadıklarını RAPOR'da "gözden geçirilmeli" listesine ekle.

## 6. KALİTE / DOĞRULAMA KURALLARI
- Her kayıtta `level` ∈ {A1, A2, B1, B2}; `id` benzersiz; `nl` ve `tr` boş değil.
- Seviye dosyalarındaki kayıt sayıları toplamı = havuz sayısı (kayıp/çift yok).
- JSON geçerli (parse edilir).
- `RAPOR.md`'de: kelime ve cümle için seviye dağılım tablosu (A1/A2/B1/B2 adetleri), temizlenen/atlanan kayıt sayısı, çift kayıt sayısı, "gözden geçirilmeli" sınır kayıtlar.
- Büyük hacim: dosya dosya / batch işle, ilerlemeyi RAPOR'a yaz.

## 7. SINIRLAR (dürüst not — RAPOR'a da ekle)
- CEFR ataması, özellikle kelimelerde, **%100 kesin değildir**; bir ana dili konuşanın örneklem kontrolü gerekir. Bu yüzden sınır kayıtları işaretle.
- Bu görev **telif durumunu değiştirmez** — veriyi yeniden düzenlemek, kaynak kitaplardan gelen içeriği özgün yapmaz. Yalnızca organizasyon görevidir.
- Türkçe çevirileri **değiştirme/yeniden yazma**, sadece taşı (gerekirse dedup'ta en iyisini seç).
