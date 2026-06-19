# Gramer İçeriği Denetim Raporu (Grammatica Audit Report)

Spraakmaker uygulamasının `/grammatica` rotasında yer alan 6 panelin tüm gramer içerikleri, çekim tabloları, kuralları ve alıştırma soruları incelenmiştir. `lib/grammarData.ts` referans alınarak yapılan denetim sonuçları aşağıda özetlenmiştir.

## 1. Tespit Edilen ve Düzeltilen Hatalar

### A. Tegenwoordige Tijd (Şimdiki Zaman) Çekim Hatası
- **Dosya:** [TegenwoordigeTijdPanel.tsx](file:///Volumes/Current%20Projects/yazilim/dil%20%C3%B6%C4%9Frenme%20b%C3%BCy%C3%BCk%20proje/spraakmaker/components/grammatica/TegenwoordigeTijdPanel.tsx)
- **Hata:** Düzensiz fiiller veri yapısında `hebben` fiilinin `wij` çekimi `"wij hebben"` şeklinde yazılmıştı (fazladan zamir içeriyordu).
- **Düzeltme:** Diğer düzensiz fiillerin çekimleriyle uyumlu olması için sadece `"hebben"` olarak güncellendi.

### B. Perfectum Çekiminde Yazım Hatası
- **Dosya:** [PerfectumPanel.tsx](file:///Volumes/Current%20Projects/yazilim/dil%20%C3%B6%C4%9Frenme%20b%C3%BCy%C3%BCk%20proje/spraakmaker/components/grammatica/PerfectumPanel.tsx)
- **Hata:** Düzensiz perfectum listesinde `vliegen` fiilinin ortaç hali (deelwoord) `"gevogen"` şeklinde hatalı yazılmıştı.
- **Düzeltme:** Doğru Hollandaca yazımı olan `"gevlogen"` kelimesiyle değiştirildi.

### C. Perfectum A1 Sorusunda Çeviri Uyuşmazlığı
- **Dosya:** [PerfectumPanel.tsx](file:///Volumes/Current%20Projects/yazilim/dil%20%C3%B6%C4%9Frenme%20b%C3%BCy%C3%BCk%20proje/spraakmaker/components/grammatica/PerfectumPanel.tsx)
- **Hata:** `"Zij ___ een boek gelezen."` sorusunun Türkçe çevirisi `"Onlar bir kitap ___ ."` şeklindeydi, ancak sorunun doğru cevabı (`a: 2`) tekil şahıs olan `heeft` olarak ayarlanmıştı. Bu durum çoğul `Zij` ile tekil `Zij` arasında çelişki yaratıyordu.
- **Düzeltme:** Sorunun doğru cevabı olan `heeft` (tekil dişil) şahıs çekimini korumak adına Türkçe çeviri `"O (kadın) bir kitap ___ ."` olarak netleştirildi.

### D. Imperfectum Seçeneklerinde Yinelenen Şık
- **Dosya:** [ImperfectumPanel.tsx](file:///Volumes/Current%20Projects/yazilim/dil%20%C3%B6%C4%9Frenme%20b%C3%BCy%C3%BCk%20proje/spraakmaker/components/grammatica/ImperfectumPanel.tsx)
- **Hata:** A2 seviyesi `praten` fiili imperfectum sorusunda, seçenekler arasında iki adet `"praatte"` şıkkı bulunuyordu (yinelenen seçenek).
- **Düzeltme:** Üçüncü sıradaki yinelenen seçenek `"prate"` olarak değiştirilerek şıklar benzersiz hale getirildi.

---

## 2. Onaylanan Doğruluk Alanları

Aşağıdaki konuların kuralları, formülleri ve alıştırma sorularının doğruluğu ve `lib/grammarData.ts` ile tutarlılığı teyit edilmiştir:

1. **'t kofschip / SoFT KeTCHuP:** `leven → geleefd / leefde` (orijinal `v`) ve `reizen → gereisd / reisde` (orijinal `z`) gibi istisnaların panellerde doğru anlatıldığı ve alıştırmalarda doğru test edildiği doğrulanmıştır.
2. **Modale Werkwoorden:** Şimdiki zaman çekimlerinde `ik/jij/hij` için -t eki gelmeme durumu, inversie kuralı ve imperfectum çekimleri (kon, mocht, moest vb.) eksiksizdir.
3. **Scheidbare Werkwoorden:** Ayrılabilir ön eklerin present tense, perfectum (`ge-` araya girer), bijzin (tekrar yapışır) ve `te + infinitief` (`te` araya girer) durumlarındaki kuralları tamamen doğrudur.
4. **Bijzinnen:** Yan cümle bağlaçlarının (omdat, dat, als, toen, hoewel vb.) fiilleri en sona atma kuralları ve `want` (nevenschikkend) istisnasının "çünkü" anlamındaki kullanım farkı doğru bir şekilde yansıtılmıştır.

Bu rapor İŞ 2 (Gramer İçeriği Denetimi) kapsamında hazırlanmıştır.
