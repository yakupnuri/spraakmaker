# Spraakmaker — Hikâye Üretim Raporu (Part 2)

Bu rapor, Spraakmaker uygulamasının içerik katmanını zenginleştirmek amacıyla gerçekleştirilen **PART 2: Hikâye Üretimi** aşamasının detaylarını ve sonuçlarını içerir.

## 📊 Genel İstatistikler
- **Üretilen Toplam Yeni Hikâye:** 40 Adet
- **Ders ID Yelpazesi:** `les_21` ile `les_60` arası
- **Hedef Veri Dosyası:** [lessen-verhalen-nieuw.json](file:///Volumes/Current%20Projects/yazilim/dil%20%C3%B6%C4%9Frenme%20b%C3%BCy%C3%BCk%20proje/spraakmaker/public/data/lessen-verhalen-nieuw.json)
- **Doğrulama Durumu:** 40 hikâyenin tamamı [validate-stories.js](file:///Volumes/Current%20Projects/yazilim/dil%20%C3%B6%C4%9Frenme%20b%C3%BCy%C3%BCk%20proje/spraakmaker/scripts/validate-stories.js) betiği ile sıfır hata ve sıfır uyarı alarak doğrulanmıştır.

---

## 📈 Seviye Bazlı Dağılım

### 1. A2 Seviyesi (Takviye - 10 Hikâye)
- **Dersler:** `les_21` - `les_30`
- **Dil Seviyesi:** Giriş ve temel düzey günlük konuşmalar, Perfectum ve Imperfectum kullanımı.
- **Odak Noktası:** Utrecht'e taşınma, eve yerleşme, UMC Utrecht hastanesinde ilk iş günü, lise/ilkokul deneyimleri, belediye kayıt işlemleri, pazar alışverişi ve entegrasyon planları.

### 2. B1 Seviyesi (Orta Seviye - 18 Hikâye)
- **Dersler:** `les_31` - `les_48`
- **Dil Seviyesi:** Karmaşık yan cümleler (`hoewel`, `omdat`, `zodat`, `nadat`, `voordat`, `mits`), fikir belirtme, daha soyut kelime haznesi.
- **Odak Noktası:** Dil kursundaki B1 hedefleri, kıdemli mimarlık sorumlulukları, aile bütçesi planlaması, Utrecht müzesi ziyareti, acil servis (SEH) deneyimleri, veli toplantıları, iş mülakatları, serbest girişimcilik (KvK kayıtları), sigorta/vergi düzenlemeleri, vedalar, film festivalleri, Kral Günü (Koningsdag) kutlamaları ve sürdürülebilir yaşam projeleri (VvE toplantısı).

### 3. B2 Seviyesi (İleri Orta Seviye - 12 Hikâye)
- **Dersler:** `les_49` - `les_60`
- **Dil Seviyesi:** İleri düzey dilbilgisel yapılar, resmi ve teknik terimler, soyut argümantasyon, akademik ve profesyonel düzeyde kendini ifade etme.
- **Odak Noktası:** İmar estetik komisyonuna (welstandscommissie) sunum yapılması, kardiyoloji yoğun bakımında (IC) uzmanlık eğitimi, kurumsal müşterilerle sözleşme müzakereleri, enerji politikaları tartışmaları, bankadan ipotek (hypotheek) alımı, lise (VWO/Gymnasium) geçiş süreçleri, Stadsschouwburg'da felsefi tiyatro oyunları analizi, tıbbi seminerlerde konuşmacı olma, şirkette ortaklık (partnerschap) teklifleri, IT yöneticiliğine terfi ve nihayet kendi evlerini satın alıp noterde (notaris) tapu imzalama.

---

## 🏛️ Utrecht Evreninin Genişlemesi ve Karakterler

Spraakmaker hikâyeleri, göçmenlerin Hollanda toplumunda nitelikli meslekler ve gelişim yollarıyla yer alabileceğini gösteren **"yükselten anlatı" (empowerment)** ilkesine sadık kalmıştır:
- **Bahar (Hemşire):** A2 seviyesinde UMC Utrecht'e başlar, B1'de acil serviste (SEH) sorumluluk alır ve nihayet B2'de Intensive Care (Yoğun Bakım) uzmanlık eğitimine (specialisatieopleiding) başlayıp ulusal bir kongrede sunum yapacak düzeye gelir.
- **Bram (Mimar/Tasarımcı):** A2'de yeni ofisine yerleşir, B1'de senior tasarımlar yapar, B2'de ise belediyenin welstandscommissie komisyonuna başarılı teknik sunumlar yaparak ofiste ortaklık (partnerschap) teklifi alır.
- **Ali (IT Uzmanı):** B1'de yeni işindeki doğrudan Hollanda iş kültürüne alışır, B2'de ise 8 kişilik bir mühendis ekibini yöneten IT Manager pozisyonuna yükselir. Kızı **Yasmin** basisschool'u başarıyla (VWO tavsiyesiyle) tamamlayıp liseye geçiş yapar.
- **Leyla (Yazılım Mühendisi - Yeni Karakter):** B1 kursunda Bahar'la tanışır, mülakat simülasyonları yaparak uluslararası bir teknoloji şirketinde senior rolüne kabul edilir. B2'de ise kendi şahıs şirketini (eenmanszaak) kurarak Rotterdam Limanı'ndaki büyük bir lojistik şirketiyle kurumsal sözleşme imzalar.
- **Resmi Yetkililer ve Komşular:** Belediye danışmanı **Pieter**, İpotek danışmanı **Sanders**, Noter, Spor salonu görevlisi **Kim**, komşular **Mark & Ellen**, hastane iş arkadaşları **Joost** ve **Dr. Sarah** ile Utrecht ekosistemi zenginleştirilmiştir.

---

## 🛠️ Teknik Kalite ve Doğrulama
Bütün hikayeler ve alıştırmalar teknik şemaya tam uyum sağlamaktadır:
1. **zinBouwen Tutarlılığı:** `woorden` dizisindeki kelimelerin imlası ve çekimleri ile `antwoord` metni birebir eşleşmektedir. İngilizce kelime sızıntıları (the, for, year gibi) temizlenmiş, Hollandaca karşılıkları (`de`, `voor`, `jaar`) yerleştirilmiştir.
2. **vulIn Doğruluğu:** Boşluk doldurma sorularındaki `___` işaretleri ve cevap eşleşmeleri hatasızdır.
3. **begrip İndeksleri:** Çoktan seçmeli anlama sorularındaki doğru cevap indeksleri 0-tabanlı olarak dizi boyutuyla uyumludur.
4. **Çeviriler:** NL->TR ve TR->NL çeviriler bağlamsal olarak en doğal Türkçe ve Hollandaca karşılıklarıyla yazılmıştır.

PART 2 kapsamında tüm hikaye içerikleri başarıyla tamamlanmış ve kullanıma hazır hale getirilmiştir.
