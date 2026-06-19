# Spraakmaker — Ana Yol Haritası

Tüm işi toparlar ve **3 part'a** böler. Her part için ajan prompt'u hazırdır. Detay belgeler aşağıdaki dizinde.

> **AJANA NOT:** Bu belge üst düzey plandır. Bir part'ı uygulamadan önce MUTLAKA şu ikisini oku: (1) müfredatın tam detayı için **`docs/MUFREDAT.md`**, (2) yapacağın part'ın prompt dosyası (`PART1-MUFREDAT-REVIZYON.md` / `GEMINI-HIKAYE-URETIM.md` / `PART3-VIDEOLAR.md`). Müfredat kuralları (Etappe yapısı, Les tipleri, içerik kuralı) bağlayıcıdır.

---

## Durum özeti

**✅ Tamamlanan temel (içerik + veri katmanı hazır):**
- CEFR veri yeniden yapılandırması: `public/data/cefr/` — kelimeler (10.414) + cümleler (8.533) seviyeli, temiz, id-tabanlı.
- Deyimler ayrıldı: `uitdrukkingen.json` (466, örnek cümleli).
- `lessen.json → zinnenbank.json` (omurga).
- Müfredat kararı: **Etappe modeli** → `docs/MUFREDAT.md`.
- İçerik kuralı (meslek-seviye anlatısı) → `HIKAYE-ICERIK-KURALLARI.md`.
- Oyunlar/Grammatica UI modernizasyonu, Zinsbouwer yeniden tasarımı.

**⏳ Bekleyen küçük düzeltmeler (müfredattan bağımsız, paralel):**
- Tema switch + Modaal tablo → `ANTIGRAVITY-TEMA-VE-TABLO-PROMPT.md`
- Dashboard/istatistik → `ANTIGRAVITY-ISTATISTIK-PLANI.md`

---

## 🎯 ÜÇ ANA PART (hepsi prompt'lu, paralel verilebilir)

| Part | İş | Prompt | Ajan | Durum |
|---|---|---|---|---|
| **PART 1** | Projeyi Etappe müfredatına göre revize et (kod/yapı) | `PART1-MUFREDAT-REVIZYON.md` | Gemini/kod ajanı | ✅ prompt hazır |
| **PART 2** | Eksik ~40 hikâyeyi üret (içerik) | `GEMINI-HIKAYE-URETIM.md` | Gemini (ayrı ajan) | ✅ prompt hazır |
| **PART 3** | "Videolar" menü bölümü (videolu dersler + shadowing) | `PART3-VIDEOLAR.md` | Gemini/kod ajanı | ✅ prompt hazır |

**Paralellik:** Üçü de birbirini beklemeden ilerleyebilir.
- Part 1 pilotu mevcut 20 hikâyeyle kurulur; Part 2 yeni hikâyeleri üretir; sonra Etappe'lere yerleşir.
- Part 3 ("Videolar" menü bölümü) bağımsız modül; seviyeli/konulu videolar Part 1 hazır olunca ilgili Etappe'lere "önerilen video" olarak bağlanır.

### Part özetleri
- **PART 1:** `etappes.json` manifesti + Leerpad sayfası + Les akışı (hikayeli + gramer/konuşma) + kilit/ilerleme + dashboard bağlama. **A1 pilot Etappe ile başla (dikey dilim)**, sonra yukarı yay. Serbest pratik + oyunlar korunur; Ehliyet/KNM ayrı hazırlık modu.
- **PART 2:** ~10 A2 + ~18 B1 + ~12 B2 hikâye, Bahar evrenini sürdürerek, `niveau` etiketli, `lessen-verhalen-nieuw.json`'a. İçerik kuralı: meslek-seviye anlatısı.
- **PART 3:** Menüye "Videolar" sekmesi + `/videos` sayfası, iki kategori — **Videolu Dersler** (Oranje: Taal & Tech 3 playlist + Learn Dutch with Frederika ~756 video) ve **Shadowing** (Dutch Shadowing 33 video). Shadowing'de gelişmiş oynatıcı (yavaşlatma + A-B loop + tekrar). Hepsi YouTube embed (telif-temiz), `videos.json` ile yönetilir, omurgaya gömülmez.

---

## Belge dizini

| Belge | Konu | Durum |
|---|---|---|
| `docs/MUFREDAT.md` | Müfredat (Etappe modeli) — ana referans | ✅ |
| `docs/YOL-HARITASI.md` | Bu belge — ana plan | — |
| `HIKAYE-ICERIK-KURALLARI.md` | Meslek-seviye anlatı kuralı | ✅ |
| `PART1-MUFREDAT-REVIZYON.md` | PART 1 prompt | ✅ hazır |
| `GEMINI-HIKAYE-URETIM.md` | PART 2 prompt | ✅ hazır |
| `PART3-VIDEOLAR.md` | PART 3 prompt | ✅ hazır |
| `GEMINI-CEFR-YENIDEN-YAPILANDIRMA.md` + `-DUZETME-TUR2.md` | CEFR veri işi | ✅ tamamlandı |
| `ANTIGRAVITY-TEMA-VE-TABLO-PROMPT.md` | Tema switch + Modaal tablo | ⏳ beklemede |
| `ANTIGRAVITY-ISTATISTIK-PLANI.md` | Dashboard/istatistik | ⏳ beklemede |
| `OYUN-HATA-RAPORU.md`, `UI-VE-COZUM-ONERILERI.md`, `ANTIGRAVITY-*-PROMPT.md`, `GRAMMATICA-DENETIM-RAPORU.md` | Geçmiş raporlar/prompt'lar | ✅ uygulandı (arşiv) |
| `PLAN-COKDILLILIK.md` | 9 dile açılma | 💤 ertelendi |
| `public/data/cefr/RAPOR*.md` | CEFR raporları | ✅ |

---

## Önerilen ilerleme sırası
1. **PART 2'yi başlat** — `GEMINI-HIKAYE-URETIM.md` ayrı bir Gemini ajanına ver (içerik arka planda üretilsin).
2. **PART 1'i başlat** — `PART1-MUFREDAT-REVIZYON.md` kod ajanına ver (A1 pilot Etappe).
3. **PART 3'ü başlat** — `PART3-VIDEOLAR.md` (bağımsız modül).
4. Part 1 pilotu çalışınca: A2/B1/B2'ye yay; Part 2 hikâyeleri Etappe'lere yerleştir; Part 3 kısayollarını konuşma Les'lerine bağla.
5. (İstenirse) bekleyen küçük düzeltmeleri (tema switch, istatistik) araya al.
