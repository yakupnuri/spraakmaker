# verhaal-zinnen.json — Kontrol Raporu

**Tarih:** 12 Haziran 2026
**Üretim:** Sonnet ajanı (19 ders + tüm çeviriler) + Claude (les_21 tamamlama + doğrulama)
**Durum:** ✅ Gözden geçirmeye hazır — 20 ders × 25 = **500 cümle, tamamı çevrili**

## Ders başına durum

20 dersin tamamında tam 25 cümle var (`les_1` … `les_21`, lessen-verhalen sırasıyla; `les_5` kaynak veride de yok). Boş çeviri: **0**. Satır sonu (\r\n) artığı: **0**. Soru işareti uyumsuzluğu (nl soru ↔ tr düz cümle): **0**. Şüpheli derecede kısa çeviri: **0**.

## Bilinmesi gereken iki nokta

### 1. ~89 cümle kaynaktan birebir değil, SADELEŞTİRİLMİŞ

Ajan, hikâyedeki bazı uzun/bileşik cümleleri kısaltarak almış. Örnek:

> Kaynak: "Ze heeft een vergadering om negen uur **en daarna heeft ze twee patiënten**."
> Dosyada: "Ze heeft een vergadering om negen uur."

Bazılarında özne netleştirilmiş ("Hij heeft een rustige stem" → "Sven heeft een rustige stem"). Dil öğrenimi için pedagojik olarak savunulabilir (3–12 kelime hedefine uydurma), cümleler dilbilgisel olarak doğru ve hikâye bağlamına sadık. **Karar Hamit'in:** kabul edilebilir bulursan dosya bu haliyle kullanılır; birebir kaynak cümle istersen scriptin yeniden koşulması ve ~89 cümlenin yeniden çevrilmesi gerekir. (Önerim: kabul et — kalite iyi.)

### 2. Otomatik tarama 27 "şüpheli" işaretledi, manuel inceleme: yanlış pozitif

Sezgisel tarama ("çeviride Hollandaca kalmış olabilir") işaretlerinin tamamı Türkçe "de/da" bağlacı ("Ben **de** buradan değilim") veya özel isimler ("De Vries", "Den Haag/Lahey") — gerçek hata bulunamadı.

## Örnek çeviriler (les_1)

| NL | TR |
|---|---|
| Bahar woont in Amsterdam. | Bahar Amsterdam'da yaşıyor. |
| Elke ochtend staat ze vroeg op. | Her sabah erken kalkıyor. |
| Ze drinkt koffie en eet een boterham. | Kahve içiyor ve ekmek yiyor. |

## Önerilen gözden geçirme yöntemi

500 cümleyi tek tek okumak yerine: her dersten rastgele 3-4 cümleye göz at (~70 cümle). Hata oranı düşükse onayla; oyunlara entegrasyon sonrası kullanıcı "çeviri hatası bildir" akışıyla kalanı zamanla yakalanır.

## Üretim notları

- Script: `scripts/extract-verhaal-zinnen.mjs` (deterministik; 3–12 kelime filtresi, kısa/orta/uzun kova karışımı).
- **DİKKAT:** Script çalıştırılırsa dosyayı `tr` alanları BOŞ olarak yeniden üretir — mevcut çeviriler silinir. Yeniden üretim gerekmedikçe çalıştırma.
- les_21 ("De toekomst begint vandaag") ajan oturum limiti nedeniyle eksik kalmıştı; aynı seçim mantığıyla (9 kısa / 8 orta / 8 uzun, hikâye sırasında) elle tamamlandı.
