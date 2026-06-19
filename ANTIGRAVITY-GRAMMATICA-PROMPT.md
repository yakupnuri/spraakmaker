# GÖREV: /grammatica sayfasını modern UI'a uyumla + gramer içeriğini denetle

## Bağlam

Spraakmaker (Hollandaca öğrenme, Next.js 16 + Tailwind 4 + framer-motion, TypeScript). `/grammatica` sayfası: `app/grammatica/page.tsx` → `components/grammatica/GrammarSequence.tsx` → 6 konu akordeonu, her biri kendi panel bileşenini açıyor:
`TegenwoordigeTijdPanel`, `PerfectumPanel`, `ImperfectumPanel`, `ModaleWerkwoordenPanel`, `ScheidbareWerkwoordenPanel`, `BijzinnenPanel`. Quiz/oefen için `PracticeQuiz`. Veri: `lib/grammarData.ts` (referans gramer kuralları) + her panel kendi içeriğini de barındırır.

Uygulamanın geri kalanı modern tasarım tokenlarına geçti: `--bg, --surface, --surface-2, --text, --text-muted, --border, --primary, --accent, --accent-soft, --success, --success-soft, --danger, --danger-soft, --warning`. Hepsi light/dark uyumlu. `/grammatica` paneller bu geçişin DIŞINDA kalmış.

## ÇALIŞMA SIRASI (önemli — bu sırayla ilerle)

1. **Önce İŞ 1'i (UI) tamamla, DUR ve doğrulat.** İŞ 1 ölçülebilir ve düşük risklidir. Bitince `npx tsc --noEmit` + `npm run build` temiz olmalı; ardından mobil (375×812) **ve dark mode**'da 6 paneli de açıp kontrol et (kendi preview'ında veya kullanıcının onayıyla). Bu noktada dur ve kullanıcıya haber ver — kullanıcı sunucuyu açıp birkaç paneli dark mode'da görsel olarak teyit etmek isteyebilir. Onay gelmeden İŞ 2'ye geçme.
2. **Sonra İŞ 2'yi (gramer içeriği denetimi) yap.** İçerik doğruluğu daha hassas ve insan gözden geçirmesi gerektirir; UI sağlam oturduktan sonra ayrı bir adım olarak ele al.

Not: Tek bir port kullanımda olabilir (kullanıcı/başka süreç localhost:3000'i açık tutuyor olabilir). Kendi preview sunucunu başlatırken port çakışmasına dikkat et; gerekiyorsa kullanıcıdan teyit iste, çalışan sunucuyu körü körüne kapatma.

## İŞ 1 — UI tema uyumluluğu (ana iş)

### Sorun
`components/grammatica/` altındaki panellerde ~140+ sabit Tailwind/hex renk kullanımı var: `text-white`, `text-slate-900/700/500`, `text-gray-500`, `bg-red-50`, `bg-blue-50`, `bg-green-50`, `bg-emerald-50`, `border-slate-200`, `border-emerald-500`, `bg-amber-100`, `text-amber-800` vb. Ayrıca `GrammarSequence.tsx`'te sabit hex'ler (`TOPIC_SOFT_BG = ["#e8edf5", ...]`) ve `border-[var(--text)]` (kenarlık olarak metin rengi — sert görünür). Bunlar **dark mode'da kırılır** (örn. `text-slate-900` koyu zeminde okunmaz, `bg-blue-50` açık kalır) ve modern temayla görsel tutarsızdır.

### Yapılacak
Tüm `components/grammatica/*.tsx` + `app/grammatica/page.tsx` içindeki sabit renkleri tokenlara çevir. Eşleme rehberi:

| Sabit renk | Token |
|---|---|
| `text-slate-900/800/700`, `text-gray-900/800` (ana metin) | `text-[var(--text)]` |
| `text-slate-500/400`, `text-gray-500` (soluk) | `text-[var(--text-muted)]` |
| `bg-white`, `bg-slate-50` (yüzey) | `bg-[var(--surface)]` |
| `bg-slate-100`, `bg-slate-200` (ikincil yüzey/chip) | `bg-[var(--surface-2)]` |
| `border-slate-200/300`, `border-gray-*` | `border-[var(--border)]` |
| `bg-green-50`/`bg-emerald-50` + `text-emerald-*`/`border-emerald-*` (doğru/onay) | `bg-[var(--success-soft)]` / `text-[var(--success)]` / `border-[var(--success)]` |
| `bg-red-50` + `text-red-*`/`border-red-*` (hata/olumsuz) | `bg-[var(--danger-soft)]` / `text-[var(--danger)]` / `border-[var(--danger)]` |
| `bg-blue-50/500/600` + `text-blue-*` (vurgu/CTA) | `bg-[var(--accent-soft)]`+`text-[var(--accent)]` veya dolgu için `bg-[var(--primary)] text-white` |
| `bg-amber-100/50`, `text-amber-800/900`, `border-amber-300` (ipucu/uyarı) | `bg-[var(--warning)]/10` + `text-[var(--warning)]` (okunur ton) |
| `text-white` **renkli dolgu üstündeyse** (primary/accent/danger buton) | olduğu gibi kalır |
| `text-white` **açık zemin üstündeyse** | `text-[var(--text)]` |

`GrammarSequence.tsx` özel:
- `TOPIC_SOFT_BG` sabit hex dizisini kaldır; akordeon başlığı kapalıyken `bg-[var(--surface-2)]`, açıkken `bg-[var(--primary)] text-white` kullan (konuya göre accent rengini sol numara rozetinde tut, zemini token yap).
- `border-[var(--text)]` → `border-[var(--border)]` (tüm geçişlerde; sert siyah kenarlık modern dilde yok).
- Konuya özel accent (`TOPIC_ACCENT_COLORS`) rozet/vurgu için kalabilir ama metin/zemin kontrastı dark modda test edilmeli.

### Gramer-anlamlı renkleri KORU
Bazı paneller grameri renkle kodluyor olabilir (örn. 't kofschip harfleri, stam vurgusu, hebben/zijn ayrımı). Bu **anlam taşıyan** renkleri kaldırma — sadece dark-mode-safe token/ton karşılıklarına çevir (success=yeşil ailesi, danger=kırmızı ailesi, accent=mavi/turkuaz, warning=amber). Renk-anlam eşlemesi panel içinde tutarlı kalsın.

### Kabul kriteri (UI)
- `grep -rnE "slate-|gray-[0-9]|emerald-|bg-(red|blue|green|amber|orange|purple)-[0-9]" components/grammatica app/grammatica` → 0 (gramer-anlamlı, bilinçli bırakılanlar hariç; onları da token'a çevir).
- 375×812 mobil + **dark mode** (preview_resize colorScheme:dark) ile her 6 panel açılıp kontrol edilir: hiçbir yerde zeminle aynı renk metin yok, tüm açıklama/örnek/quiz okunur.
- `npx tsc --noEmit` ve `npm run build` temiz.

## İŞ 2 — Gramer içeriği denetimi

`lib/grammarData.ts` referans alındığında içerik **doğru ve kaliteli** (kontrol edildi: 't kofschip/soft ketchup, hebben↔zijn seçimi, modal çekimler kan/kon, mag/mocht, woordvolgorde, scheidbaar ge- yerleşimi, want=nevenschikkend istisnası). Ancak **6 panel kendi içeriğini ayrıca barındırıyor** (quiz soruları, çekim tabloları, örnek cümleler) ve bunlar tek tek doğrulanmalı.

Her paneli `grammarData.ts`'teki ilgili kurala karşı denetle. Özellikle kontrol et:

1. **Çekim doğruluğu:** Şimdiki zaman (ik=stam, jij/hij=stam+t, wij/jullie/zij=infinitief; inversie'de jij/je -t düşer, hij düşmez). Düzensizler: zijn(ben/bent/is/zijn), hebben(heb/hebt/heeft/hebben), gaan, doen, zien, staan, weten.
2. **Stam kuralları:** uzun sesli çiftlenir (maken→maak, lopen→loop), çift ünsüz tekleşir (zetten→zet), v→f (leven→leef), z→s (reizen→reis). `TegenwoordigeTijdPanel`'deki `getStem` algoritması ve `KNOWN_STEMS` sözlüğünü örnekle test et (örn. `geven→geef`, `rijden→rijd`, `praten→praat` doğru mu).
3. **Kofschip:** voltooid deelwoord ve imperfectum'da +t/+d ve -te/-de seçimi. Kritik: orijinal mastara bakılır (leven→geleefd çünkü v∉kofschip; reizen→gereisd çünkü z∉kofschip). Panellerde bu istisna doğru anlatılıyor mu.
4. **hebben/zijn:** perfectum yardımcı fiili — hareket A→B / durum değişikliği / sabit liste (gaan, komen, blijven, worden...) → zijn; gerisi hebben.
5. **Modale werkwoorden:** çekim (ik kan/wil/mag/moet/zal — -t yok), imperfectum (kon, mocht, moest, wilde/wou, zou, hoefde), zinsbouw (infinitief sona), hoeven+te+niet.
6. **Scheidbaar:** ayrılabilir önekler (op/af/mee/aan/uit/in/neer/terug/samen) vs ayrılamaz (be/ver/her/ont/ge); perfectum'da ge- önek-stam arasına (opgestaan, afgesproken); bijzin'de önek geri yapışır.
7. **Bijzinnen:** onderschikkend voegwoord (omdat/dat/als/toen/terwijl/hoewel/zodat) → fiil sona; want → normale volgorde; perfectum bijzinde deelwoord+hulpww sırası.
8. **Örnek cümleler:** her paneldeki NL örnek cümlelerin dilbilgisel doğruluğu ve TR çevirilerinin tutarlılığı.

Bulduğun her hatayı düzelt; emin olmadığın (tartışmalı/bölgesel) noktaları rapora yaz, kendiliğinden değiştirme.

### Kabul kriteri (gramer)
- 6 panelin her biri için yukarıdaki maddeler doğrulandı; bulunan hatalar düzeltildi.
- `grammarData.ts` ile paneller arasında çelişki yok (örn. bir panel "wij werkt" gibi yanlış çekim göstermiyor).
- Düzeltmeler + emin olunamayan noktalar `GRAMMATICA-DENETIM-RAPORU.md` dosyasına yazıldı.

## Notlar
- `PracticeQuiz.tsx`, `QuizUnlocked.tsx`, `StarBurst.tsx`, `LangToggle.tsx`, `GrammarPanel.tsx` (fallback) de İŞ 1 kapsamında — sabit renkleri token'a çevir.
- Mevcut işlevsellik (akordeon, quiz akışı, dil toggle, çekim üreticisi) korunacak; bu görev görsel uyum + içerik doğruluğu, mimari değişikliği değil.
- İçerik kuralı: gramer örneklerinde yeni cümle/karakter üretirsen `HIKAYE-ICERIK-KURALLARI.md`'ye uy (göçmen karakterler nitelikli mesleklerde).
