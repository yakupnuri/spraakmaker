# GÖREV (Gemini, 2. TUR): CEFR çıktısında seviye dengesi + kalan kelime/cümle ayrımı

İlk turda `public/data/cefr/` altındaki dosyalar üretildi. Ardından **mekanik temizlik elle yapıldı** (satır sonları temizlendi, net tek-kelime↔cümle taşımaları yapıldı, id'ler yenilendi). Şimdi iki **yargısal** sorun kaldı — bunları sen düzelt.

> Girdi = `spraakmaker/public/data/cefr/` içindeki mevcut dosyalar (güncel hâlleri). Çıktı = aynı dosyaların üzerine düzeltilmiş hâli. Dosya adlarını ve §şemayı KORU.

## Mevcut durum (güncel sayılar)
- **Cümleler:** A1=1453, **A2=3882 (aşırı şişkin)**, B1=2928, **B2=525 (az)** — toplam 8788
- **Kelimeler:** A1=535, A2=1848, B1=3720, **B2=4056 (şişkin)** — toplam 10159

Bu dağılım dengesiz: cümleler A2'ye, kelimeler B2'ye yığılmış. Bu büyük olasılıkla "emin değilim → ortaya/üste at" eğiliminden. Senin işin bunu gerçekçi seviyeye çekmek.

---

## İŞ A — Seviye atamasını gözden geçir (ASIL İŞ)

Her kaydın `level` alanını aşağıdaki kriterlere göre **yeniden değerlendir**. Özellikle:
- **A2'ye yığılmış cümleleri** tek tek bak: gerçekten A2 mi, yoksa B1 mi (yan cümle/bağlaç/soyut içerik varsa B1)? Çoğu yanlış A2 olabilir.
- **B2'ye atılmış kelimeleri** bak: gerçekten ileri/soyut/düşük sıklık mı, yoksa "emin olunamadığı için B2" mi? Yaygın kelimeyse A2/B1'e indir.

**Cümle kriterleri:**
- A1: kısa (≈3-6 kelime), basit şimdiki zaman, temel kelime.
- A2: günlük (≈5-9 kelime), perfectum/basit bağlaç (en, maar, want), somut.
- B1: yan cümle/bağlaç (omdat, dat, terwijl, als), ≈8-14 kelime, soyutlaşan içerik.
- B2: karmaşık yapı, soyut/resmi konu, uzun, ileri gramer.

**Kelime kriterleri (sıklık belirleyici):**
- A1: en temel/yüksek sıklık (huis, eten, water).
- A2: günlük rutin (afspraak, betalen, gezond).
- B1: orta sıklık, soyutlaşan (ervaring, mening, regeling).
- B2: gerçekten düşük sıklık/akademik/resmi (beleid, desondanks).

Hedef: dağılım daha dengeli ve gerçekçi olsun (cümlede A2 azalır, B1 artar; kelimede B2 azalır, A2/B1 artar). Mükemmel olması gerekmez ama belirgin yığılmalar düzelmeli.

## İŞ B — Kalan kelime/cümle karışmasını temizle

Konservatif elle temizlik net olanları taşıdı ama belirsizler kaldı:
- **`woordenschat-*` (kelime havuzu) içinde hâlâ CÜMLE/DİYALOG olanlar** → `zinnen-*`'e taşı. Örnek: `"Wil je nog wat cake?" - "Nee, dank je..."` (tırnakla başlayıp biten diyaloglar). Kural: tam cümle / diyalog / 5+ kelimeli ifade → zinnen.
- **`zinnen-*` (cümle havuzu) içinde hâlâ tek kelime/kolokasyon olanlar** → `woordenschat-*`'e taşı. Örnek: `(bij) passen`, `25 procent!`. Kural: gerçek cümle değil, kelime/öbek/kolokasyon → woordenschat.
- Sınırda olanlar (kısa öbek mi cümle mi belirsiz) için: bir özne+fiil içeren tam ifade = cümle; sadece sözlük girdisi/kolokasyon = kelime.

## KURALLAR (ikisi için de geçerli)
- **id-şemayı koru:** `{id, nl, tr, level, artikel?, pos?, theme?, grammar_tag?}`. Taşınan kayıtların id'sini yeni havuza göre yeniden ver (`{level}-w-NNNN` / `{level}-z-NNNN`).
- **Çeviri (`tr`) ve Hollandaca (`nl`) metnini DEĞİŞTİRME** — sadece `level` güncelle ve gerekirse havuz arası taşı.
- **Kayıt silme/ekleme YOK** — sadece seviye güncelleme + havuz arası taşıma. Toplam kayıt (10159 + 8788 = 18947) korunmalı.
- Her iki havuz için: `*-alles.json` = `*-a1/a2/b1/b2.json` toplamı (birebir). Önce alles'i düzelt, sonra seviye dosyalarını yeniden türet.
- JSON geçerli olmalı.
- **`RAPOR-TUR2.md`** yaz: önce/sonra seviye dağılım tablosu, taşınan kayıt sayısı (woord↔zin), seviyesi değişen kayıt sayısı, emin olamadığın sınır kayıtlar.

## SINIR
- Seviye %100 kesin değildir; bir ana dili konuşanın örneklem kontrolü yine gerekir. Şüphelileri RAPOR-TUR2'de işaretle.
