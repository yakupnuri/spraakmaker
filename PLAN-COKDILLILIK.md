# Plan: 9 Dile Açılma + Veri Mimarisi Kararı

**Tarih:** 12 Haziran 2026
**Karar sahibi:** Hamit · **Durum:** istişare/öneri

## Mevcut durum (ölçülmüş)

- 24 veri dosyası, ~17.000 içerik kaydı; tamamı yalnızca `nl + tr`. İngilizce 5 dosyada kısmen var, diğer 7 dil hiçbir yerde yok.
- Onboarding 9 dil sunuyor; `translate()` hook'u eksik dilde sessizce Türkçe'ye düşüyor → Arapça seçen kullanıcı Türkçe görüyor.
- UI metinleri JSX içine gömülü NL/TR karışımı; i18n altyapısı yok.
- Uygulama tamamen statik (Next.js + public/data JSON), backend yok, ilerleme localStorage'da.

---

# BÖLÜM 1 — Kısa vade: "Türkçe aktif, diğerleri pasif"

`lib/types.ts` → MOEDERTALEN'e `available` alanı:

```ts
{ code: "tr", label: "Türkçe", flag: "🇹🇷", available: true },
{ code: "ar", label: "العربية", flag: "🇸🇦", available: false },  // ... diğerleri de false
```

Onboarding'de pasif diller soluk + "Binnenkort" (yakında) rozetiyle gösterilir, tıklanamaz. Ayarlarda da aynı. Böylece: dürüst beklenti + "bu uygulama çok dilli olacak" sinyali korunur. (~1 saatlik iş, Antigravity'ye tek paragraf.)

---

# BÖLÜM 2 — Veri mimarisi kararı: JSON mu, veritabanı mı?

## Önerim: **Şimdilik veritabanı YOK — ama JSON'u "veritabanı disipliniyle" yeniden yapılandır.**

Gerekçe: Veritabanının çözdüğü problemler (çok kullanıcılı yazma, sorgu, eşzamanlılık, hesap/senkron) bugün sende yok. İçerik salt-okunur, kullanıcı verisi localStorage'da, hosting statik ve bedava. Bugün DB'ye geçmek maliyet+karmaşıklık ekler, hiçbir kullanıcı problemini çözmez. **Ama mevcut JSON'un asıl sorunu format değil, disiplinsizlik:** kayıtların kimliği (ID) yok, şema doğrulaması yok, çeviri dili içeriğe gömülü. 9 dile bu yapıyla çıkılmaz.

## Hedef yapı: içerik ↔ çeviri ayrımı (dil başına dosya)

```
public/data/
  content/
    sentences-tc1.json      → [{ "id": "tc1-0001", "nl": "Kom je zondag koffie drinken?" }, ...]
    lessen-verhalen.json    → hikâyeler (yalnız NL + yapı)
  i18n/
    tr/sentences-tc1.json   → { "tc1-0001": "Pazar günü kahveye geliyor musun?", ... }
    ar/sentences-tc1.json   → { "tc1-0001": "...", ... }   (dil eklemek = klasör eklemek)
    en/...
```

- **Her kayda kalıcı ID** (dosya-kısaltma + sıra no). Bu, hem çeviri boru hattının hem de ileride olası DB göçünün ön koşulu — ID'siz veri hiçbir yere taşınamaz.
- İstemci yalnız `content/X.json` + `i18n/{moedertaal}/X.json` indirir → 9 dil eklenince indirme boyutu BÜYÜMEZ.
- `lib/gameData.ts` tek noktadan birleştirir: `{...content, tr: i18n[id]}` — oyun kodu değişmez.
- **Şema doğrulama scripti** (`scripts/validate-data.mjs`): her content kaydının her aktif dilde karşılığı var mı, boş/çift kayıt var mı → CI'da/commit öncesi çalışır. (tc1'deki kaymış kayıtlar gibi hatalar bir daha sessizce yaşanmaz.)
- Geçiş scripti mevcut dosyaları otomatik dönüştürür; oyunlarda tek değişiklik yükleme katmanında.

## Veritabanına NE ZAMAN geçilir? (tetikleyiciler)

Şunlardan biri gündeme gelirse Supabase (Postgres + Auth) öneririm:
1. **Kullanıcı hesabı / cihazlar arası ilerleme senkronu** (localStorage'ın sınırı),
2. İçeriği koddan bağımsız düzenleyecek bir **editör arayüzü** ihtiyacı (sen + çevirmen gözden geçiriciler),
3. Topluluk içeriği / öğretmen panosu gibi çok kullanıcılı yazma.

Yukarıdaki ID'li yapı sayesinde o günkü göç mekanik bir iştir (JSON → tablo dökümü). Yani bugünkü öneri seni hiçbir kapıdan mahrum bırakmıyor.

---

# BÖLÜM 3 — 9 dile açılma planı

## Katman 1: UI metinleri (küçük hacim, önce bu)

- ~300-500 sabit metin (düğmeler, etiketler, yönergeler). `next-intl` veya basit `lib/i18n/{lang}.json` sözlükleri + `t()` fonksiyonu.
- Mevcut `ZIN_BOUWEN_EXPLANATIONS` gibi dağınık 9-dil blokları bu sisteme taşınır (içerikleri zaten hazır!).
- **RTL desteği:** Arapça ve Farsça için `dir="rtl"` + layout denetimi (flex yönleri, hizalamalar). Bunu Katman 1'de çözmek şart — sonradan eklemek her ekranı yeniden test ettirir.

## Katman 2: İçerik çevirisi (büyük hacim, aşamalı)

Hacim: ~17.000 kayıt × 8 yeni dil = **~136.000 çeviri**. Elle imkânsız, yapay zekâ + örneklemeli insan kontrolü tek gerçekçi yol:

1. **Boru hattı:** `scripts/translate-batch.mjs` → Claude API (Batch, ucuz model) ile NL→hedef dil; kaynak NL + mevcut TR çeviri bağlam olarak verilir (kalite artar). Çıktı doğrudan `i18n/{lang}/` dosyalarına. Kaba maliyet: tüm korpus × 8 dil ≈ 30-60 $ mertebesi (API batch fiyatlarıyla) — asıl maliyet insan gözden geçirmesi.
2. **Gözden geçirme:** dil başına ana dili konuşan 1 kişi (kullanıcıların içinden gönüllü — Sevde gibi aktif kullanıcılar!), rastgele %10 örneklem + oyunlarda "çeviri hatası bildir" düğmesi (var olan feedback sayfasına bağlanır).
3. **Yayın sırası (öneri):** İçerikte dosya önceliği: ders cümleleri (verhaal-zinnen + lessen) → sentences-tc1/tc2 → words-tc12 → kalanlar. Dil önceliği: **EN** (kısmen hazır, gözden geçirmesi en kolay) → **AR + UK** (NT2 hedef kitlesinin en büyük grupları) → FA, PL, ES, FR, SO.
4. Bir dilin "çekirdek paketi" (ders + tc1/tc2 + temel kelimeler ≈ 8k kayıt) tamamlanınca o dil onboarding'de `available: true` yapılır — kalan dosyalar o dilde tamamlanana dek `translate()` İngilizce'ye, o da yoksa "çeviri yok" işaretine düşer (sessiz Türkçe fallback kaldırılır).

## Uygulama sırası (özet yol haritası)

| Faz | İş | Efor |
|---|---|---|
| 0 | Türkçe aktif / 8 dil pasif (Bölüm 1) | ~1 saat |
| 1 | ID'leme + content/i18n ayrımı + geçiş ve doğrulama scriptleri | ~1-2 gün |
| 2 | UI i18n altyapısı + RTL temeli | ~2 gün |
| 3 | Çeviri boru hattı + EN çekirdek paketi + gözden geçirme döngüsü | ~2 gün + inceleme |
| 4 | Dil dil yayın (AR, UK, …) — faz 3 boru hattı tekrar koşulur | dil başına günler |
| — | DB kararı: hesap/senkron/editör gündeme gelince Supabase | ertelendi |

## Açık sorular (Hamit'e)

1. Cihazlar arası ilerleme senkronu yakın planda var mı? (Varsa Faz 1'le birlikte Supabase'i öne çekmek mantıklı olabilir.)
2. Dil önceliği önerisi (EN → AR+UK → diğerleri) hedef kitlene uyuyor mu?
3. Gözden geçirme için kullanıcılar arasından gönüllü bulma fikri uygulanabilir mi?
