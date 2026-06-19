# Spraakmaker — Müfredat (Etappe Modeli)

Bu belge, uygulamanın tek öğretim hiyerarşisini tanımlar. Kararlar Hamit tarafından onaylanmıştır (15 Haziran 2026). Yeni içerik/modül eklerken bu belge esas alınır.

---

## 1. Onaylanan kararlar (özet)

| Konu | Karar |
|---|---|
| **Omurga** | `zinnenbank` (eski lessen.json) — zaten konu konu ayrılmış 108 ders; yeniden bölünmez. Hikayeler bu konuları **destekler**. |
| **Üst birim adı** | **Etappe** (tema/ünite/hoofdstuk yerine) |
| **Etappe yapısı** | Her Etappe = **5 Les** |
| **Les dağılımı** | 3 Les hikayeli · 2 Les gramatika + konuşma ağırlıklı |
| **Hedef** | NT2 sınavı — **ama asıl amaç konuşturmak** (sınav + konuşma odağı birlikte) |
| **Ehliyet & KNM** | Omurga dışında, **ayrı hazırlık modu** |
| **Seviye ekseni** | CEFR: A1 → A2 → B1 → B2 (veri `cefr/` ile seviyeli) |

---

## 2. Felsefe — konuşturmak esas

NT2 sınavına hazırlık var, ama uygulamanın kalbi **üretim/konuşma**. Bu yüzden:
- Her Les'te pasif değil **aktif** bileşen olur (yüksek sesle tekrar, cümle kurma, çeviri-üretim).
- 2 "gramatika + konuşma" Les'i, öğrenilen yapıyı konuşmaya döker (TTS ile dinle-tekrarla, flitsen-vari hız pratiği, cümle üretimi).
- Hikayeler bağlam verir; oyunlar o bağlamı aktif kullandırır.

---

## 3. Mimari

```
SPRAAKMAKER
│
├── OMURGA (zorunlu, kilitli, CEFR sıralı)
│   A1 → A2 → B1 → B2
│   └── her seviye birkaç ETAPPE
│        └── her Etappe = 5 LES
│             ├── Les 1  (hikayeli)   ┐
│             ├── Les 2  (hikayeli)   ├─ 3 hikaye-bazlı les
│             ├── Les 3  (hikayeli)   ┘
│             ├── Les 4  (gramatika + konuşma)  ┐
│             └── Les 5  (gramatika + konuşma)  ┘ 2 üretim-bazlı les
│
├── SERBEST PRATİK (her zaman açık, kilitsiz)
│   oyunlar · kelime kartları · gramer referansı · deyimler (uitdrukkingen)
│
└── HAZIRLIK MODLARI (omurga dışı, bağımsız)
    ├── Ehliyet (rijbewijs) — soru bankası + kelime
    └── KNM — Hollanda toplum bilgisi (Kennis Nederlandse Maatschappij)
```

### Les tipleri

**Hikayeli Les (Les 1-3):** 5 fazlı akış (mevcut `lessen-verhalen` yapısı):
1. Oku (hikaye) → 2. Kelimeler (SM-2 flashcard) → 3. Gramer → 4. Oyun (hikayenin cümleleriyle) → 5. Quiz.

**Gramatika + Konuşma Les (Les 4-5):** Etappe'nin gramer konusu + konuşma pratiği:
- Gramer modülünün ilgili konusu (Grammatica'dan)
- Konuşma: TTS dinle-tekrarla, cümle kurma (Zinsbouwer), çeviri-üretim, hız turu (Snelronde/Flitsen)
- O konunun `zinnenbank` + `cefr/zinnen` cümleleri kaynak.

---

## 4. Veri kaynakları → ne neyi besliyor

| Müfredat parçası | Veri kaynağı | Durum |
|---|---|---|
| Etappe konu sırası / omurga | `zinnenbank.json` (108 konu-dersi) | ✅ var |
| Hikayeler (Les 1-3) | `lessen-verhalen.json` (20 hikaye) | ⚠️ yetersiz (aşağı bak) |
| Hikaye oyun cümleleri | `verhaal-zinnen.json` (500) | ✅ var |
| Kelimeler (seviyeli) | `cefr/woordenschat-*.json` (10.414) | ✅ hazır |
| Cümleler (seviyeli) | `cefr/zinnen-*.json` (8.533) | ✅ hazır |
| Gramer (Les 3 + Les 4-5) | `grammarData.ts` (6 konu) + Grammatica modülü | ✅ var |
| Deyimler (serbest) | `uitdrukkingen.json` (466) | ✅ hazır |
| Ehliyet modu | `words-rijbewijs.json` (1414) + soru bankası | ⚠️ soru bankası kontrol edilmeli |
| KNM modu | — | ❌ veri yok, üretilecek |

---

## 5. Açık kararlar & üretilecek içerik (dürüst)

1. **Etappe sayısı netleştirilmeli.** Öneri: ~20 Etappe, CEFR'e yayılı (örn. A1:6, A2:6, B1:5, B2:3) × 5 Les ≈ 100 Les — `zinnenbank`'ın 108 dersiyle kabaca örtüşür.
2. **Hikaye açığı (en büyük üretim işi).** Model her Etappe'de 3 hikaye istiyor → ~20 Etappe × 3 = **~60 hikaye gerekir**. Elimizde **20** var (ve hepsi başlangıç temasında). → **~40 yeni hikaye yazılacak**, CEFR seviyelerine yayılı. Hikaye üretiminde [içerik kuralı](../HIKAYE-ICERIK-KURALLARI.md): göçmen karakterler nitelikli mesleklerde.
3. **KNM içeriği yok** — Ehliyet'in `words-rijbewijs` verisi var ama KNM için sıfırdan içerik (7 tema) gerekir.
4. **Konuşma pratiği mekaniği** tanımlanmalı: TTS + tekrar yeterli mi, yoksa ses kaydı/tanıma da olacak mı? (Faz 2.)
5. **B2 cümle hacmi ince** (849) — B2 Etappe'leri için ek cümle gerekebilir.

---

## 6. Önerilen uygulama sırası (dikey dilim)

Hepsini birden değil, **A1'i pilot Etappe olarak kur**, çalışırsa yukarı yay:
1. **A1 için 1 örnek Etappe** kur (5 Les: 3 mevcut hikaye + 2 gramer/konuşma), uçtan uca çalışsın.
2. Uygulamayı `cefr/` verisine bağla (oyunlar/kartlar seviyeden çeksin).
3. A1'in tüm Etappe'lerini tamamla → A2 → B1 → B2.
4. Hazırlık modları (Ehliyet, KNM) paralel, bağımsız.
5. Eksik hikayeler kademeli üretilir (Etappe açıldıkça).

---

## 7. İlerleme mantığı
- Omurga **kilitli:** Les quizi geçilmeden sonraki Les açılmaz; Etappe bitmeden sonraki Etappe açılmaz.
- Her Etappe sonunda **kapı** (Etappe quizi).
- Serbest pratik + hazırlık modları **kilitsiz**.
- Tüm ilerleme `localStorage`'da (sunucu/hesap yok).
