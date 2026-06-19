# GÖREV: Spraakmaker'ı tek ve tutarlı modern UI'a taşı

## Bağlam

Bu proje bir Hollandaca öğrenme uygulaması (Next.js 16.2.3 App Router + Tailwind CSS 4 + framer-motion + dnd-kit, TypeScript). Kullanıcıların tamamı mobil (telefon) kullanıyor.

Uygulamada iki tema var: "modern" (varsayılan) ve "destijl" (Mondrian). Oyun (`app/spel/*`) ve ders (`app/lessen/*`) sayfaları yalnızca De Stijl diliyle yazılmış (`bg-[var(--ds-black)]`, 3px siyah çerçeveler). Modern tema bu sayfaları yeniden tasarlamak yerine `app/globals.css` içindeki `!important`'lı geçersiz kılma katmanıyla (satır ~90–185) "modern göstermeye" çalışıyor. Bu katman ciddi hatalar üretiyor: satır ~175'teki kural `bg-[var(--ds-black)]` div'lerinin arka planını şeffaf yapıyor → oyun başlıkları ve Flitsen oyununun tüm kontrolleri **beyaz üstüne beyaz, görünmez**. Ayrıca modern temada `--ds-red` lacivertе remap'lendiği için hata geri bildirimleri kırmızı değil mavi görünüyor.

**Hedef: destijl temasını ve override katmanını tamamen kaldır; tüm oyun ve ders sayfalarını aşağıdaki tasarım sistemine göre doğrudan modern olarak yeniden yaz.**

## Kesin kurallar

1. **Oyun/ders mantığına dokunma.** State akışı, puanlama, localStorage anahtarları (`spraakmaker-progress`, `spraakmaker-niveau`, `spraakmaker-moedertaal`, `spraakmaker-flitsen-progress`, `spraakmaker-unknown-words`, `spraakmaker-onboarding`), veri yükleme (`lib/gameData.ts`) ve tüm Hollandaca/Türkçe metinler aynen kalacak. Bu görev yalnızca görsel katman.
2. **`!important` ve global eleman-hedefli override yasak.** Stiller bileşenin kendi className'lerinde yaşar.
3. **Mobil öncelikli:** her ekran 375×812'de tasarlanır, masaüstü `md:` ile genişletilir.
4. **Alt navigasyon payı:** mobilde sabit alt nav var (`components/Navigation.tsx`, `fixed bottom-0 z-50`, ~64px). Sayfa içi hiçbir sabit/aksiyon elemanı bunun altında kalamaz.
5. **Dark mode zorunlu:** tüm renkler token üzerinden; `text-white`, `bg-red-50`, `bg-green-100` gibi sabit Tailwind renkleri oyun sayfalarından temizlenecek.
6. Her adımdan sonra `npx tsc --noEmit` ve `npm run build` temiz geçmeli.

## ADIM 1 — Tasarım tokenları (`app/globals.css` yeniden yazımı)

Eski `--ds-*` değişkenlerini, `ui-modern`/`ui-destijl` bloklarını ve satır 90–185 arasındaki tüm override katmanını sil. Yerine:

```css
:root {
  --bg:        #f8fafc;
  --surface:   #ffffff;
  --surface-2: #f1f5f9;
  --text:      #0f172a;
  --text-muted:#64748b;
  --border:    rgba(15,23,42,.08);
  --primary:   #0f2d4a;   /* lacivert — CTA, başlık vurguları */
  --accent:    #00adb5;   /* turkuaz — aktif durum, puan, ilerleme */
  --accent-soft:#e0f7f8;
  --success:   #0d9488;
  --success-soft:#e1f5ee;
  --danger:    #e11d48;   /* yanlış cevap GERÇEK kırmızı */
  --danger-soft:#fce7ec;
  --warning:   #f59e0b;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg:#0f172a; --surface:#1e293b; --surface-2:#334155;
    --text:#f8fafc; --text-muted:#94a3b8; --border:rgba(255,255,255,.1);
    --primary:#38bdf8; --accent:#22d3ee; --accent-soft:rgba(34,211,238,.12);
    --success:#34d399; --success-soft:rgba(52,211,153,.12);
    --danger:#fb7185; --danger-soft:rgba(251,113,133,.12); --warning:#fbbf24;
  }
}
body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
```

Mevcut animasyon keyframe'leri (shake, card-flip vb.) kalsın. Eski `--ds-*` kullanan TÜM dosyalarda sınıflar yeni tokenlara çevrilecek (geçici alias bırakma).

Tipografi/yüzey dili: kartlar `rounded-2xl border border-[var(--border)] bg-[var(--surface)]` + `shadow-[0_4px_12px_rgba(15,23,42,.05)]`; birincil CTA `rounded-xl bg-[var(--primary)] text-white py-4 w-full font-bold`; etiketler `text-[11px] uppercase tracking-wider text-[var(--text-muted)]`.

## ADIM 2 — Tema sisteminin sökülmesi

- `components/ClientLayout.tsx`: `ui-modern/ui-destijl` class ekleme effect'ini ve `isModern` dallanmalarını kaldır (tek görünüm).
- `lib/hooks.ts` + `lib/types.ts`: `settings.uiStyle` alanını kaldır; localStorage'dan eski değer gelirse sessizce yok say (migration).
- `app/spel/page.tsx`: destijl branch'ini (Mondrian grid, `isModern ? : ` ikinci kolu) sil; modern grid kalsın, yeni tokenlara çevir.
- Ayarlar sayfasında uiStyle seçeneği varsa kaldır.

## ADIM 3 — Paylaşılan oyun bileşenleri (`components/game/`)

**`GameShell.tsx`** — props: `title`, `icon?`, `scoreChip?` (ReactNode), `onClose?` (→ `/spel`'e router.push), `actionBar?` (ReactNode), `children`.
Yapı: sticky üst bar (surface, alt border; sol: ikon+başlık, sağ: skor chip'i `bg-[var(--accent-soft)] text-[var(--accent)] rounded-full px-3` + ✕) → içerik (`flex-1 px-4 pb-44`) → aksiyon barı: `fixed left-0 right-0 z-40` ve `bottom: calc(64px + env(safe-area-inset-bottom))` mobilde, `md:bottom-0` masaüstünde; `bg-[var(--surface)] border-t border-[var(--border)] p-3`. **Hiçbir koşulda alt navın altında kalmaz.**

**`GameProgress.tsx`** — props: `current`, `total`, `label?`. Üstte 4px bar (`bg-[var(--surface-2)]` üzerinde `bg-[var(--accent)]` dolgu, width %) + "Soru 3/20" etiketi.

**`ScoreBar.tsx`** — props: `items: {label, value, tone?: "accent"|"success"|"danger"|"muted"}[]`. Tek satır chip dizisi; eski 5-blok Mondrian skor barlarının yerine geçer.

**`FeedbackToast.tsx`** — props: `state: "correct"|"wrong"|null`, `message`, `detail?`. framer-motion ile alttan kayar (aksiyon barının hemen üstüne), doğru: `bg-[var(--success-soft)] border-[var(--success)]` + check ikonu; yanlış: danger tonları + shake (`x: [-8,8,-8,8,0]`). Yanlışta görünürlük süresi ≥2500ms.

**`SourcePicker.tsx`** — vertaal/vul-in/snelronde'deki üç kopya kaynak seçim ekranını tekilleştir. props: `selected`, `onToggle`, `onToggleAll`, `onStart`, `loading`. Kaynak kartları: surface, rounded-xl, sol yuvarlak checkbox, sağ seviye rozeti (`accent-soft`); altta "Tümünü seç" (ikincil) + "START" (birincil, GameShell aksiyon barında).

**`HistoryPanel.tsx`** — props: `correct: …[]`, `wrong: …[]`. Varsayılan kapalı akordeon, başlık "Geçmiş (7 ✓ · 1 ✗)"; açılınca doğrular success-soft, yanlışlar danger-soft satırlar; yanlış satırda kullanıcı cevabı üstü çizili + doğru cevap + açıklama (mevcut explanation alanları).

## ADIM 4 — Sayfa yeniden yazımları (bu sırayla)

Genel: her oyun GameShell + GameProgress + ScoreBar + FeedbackToast + HistoryPanel kullanır; tüm `--ds-*` sınıfları ve 3px çerçeve dili gider.

**4a. `app/spel/flitsen/page.tsx` (en bozuk):**
- Dashboard: öneri kartı (accent-soft zemin, "START" birincil buton); paket kartları `rounded-2xl` grid'de, her kartta SVG dairesel ilerleme halkası (round/7); aktif rotasyon yatay kaydırmalı şerit.
- Oyun ekranı: açık zemin (koyu siyah konteyner gitsin). Üstte "Zin 3/20" + sağda küçük SVG geri sayım halkası (saniye ile senkron, `stroke var(--accent)`); ortada büyük flashcard (surface, rounded-2xl): NL cümle 22–28px bold, ayraç çizgisi, çeviri muted; kontroller GameShell aksiyon barında: ⏮ (ikincil) / ▶‖ (birincil, geniş) / ⟳ (ikincil) / ⏭ (danger ton "Sla over").
- Tamamlama ekranı: tek kart — "+50" büyük, paket/ronde chip'leri, "Dashboard" CTA.

**4b. `app/spel/zin-motor/page.tsx`:**
- Üst bar: seviye seçici **segmented control** (`bg-[var(--surface-2)] rounded-full p-1`, aktif: `bg-[var(--accent)] text-white rounded-full`) — şu an görünmez olan butonların kalıcı çözümü. NL/TR toggle'ı yanına.
- Soru kartı: kırmızı blok yerine surface kart, etiket + Türkçe cümle.
- Çarklar: surface kart içinde; seçili satır `bg-[var(--accent)] text-white rounded-xl`; yanlış çark çerçevesi `var(--danger)` + shake. Ok butonları `surface-2` yuvarlak.
- Aksiyon barına **"DRAAI" butonu ekle** (ikincil stil, `onClick={handleSpinAll}`, `disabled={isSpinning || feedback !== null}`) — fonksiyon kodda hazır ama hiçbir butona bağlı değil. CONTROLEER birincil buton yanında.
- Hata panelleri: `bg-red-50/border-red-200` sabitlerini `danger-soft/danger` tokenlarına çevir.

**4c. `app/spel/zin-bouwen/page.tsx`:**
- Çeviri kartı üstte; hedef alan: kesikli çerçeveli boş kart (`border-2 border-dashed border-[var(--text-muted)] rounded-2xl min-h-[72px]`).
- Kelime taşları: `rounded-full` chip — havuzda `surface-2`, hedef alanda `bg-[var(--primary)] text-white`.
- **Tıkla-yerleştir modunu ekle:** havuzdaki chip'e dokun → hedefe eklenir; hedeftekine dokun → havuza döner. Mevcut dnd-kit sürüklemesi hedef alan içi sıralama için kalabilir. (State: mevcut `wordIds` modeli korunur, sadece etkileşim katmanı.)
- Kalan hak: üst satırda ●●○ nokta göstergesi. Feedback → FeedbackToast. Geçmiş → HistoryPanel.

**4d. `app/spel/vul-in/page.tsx`:** Cümle sahne kartında boşluk **satır içi input** olur (`inline-block border-b-2 border-[var(--accent)] bg-transparent text-center min-w-[80px]`, otomatik odak, Enter=kontrol); alttaki ayrı input kalkar. Çeviri ipucu kartın altında muted. SourcePicker + HistoryPanel + FeedbackToast.

**4e. `app/spel/vertaal/page.tsx`:** Soru kartı + otomatik büyüyen textarea kartı (Enter=kontrol, Shift+Enter satır). Yanlış toast'unda doğru cevabı göster. SourcePicker kullan.

**4f. `app/spel/snelronde/page.tsx`:** Dev kırmızı zamanlayıcı bloğu yerine üstte büyük SVG **geri sayım halkası** (60sn, son 10 sn `var(--danger)`); yanında combo chip'i (`warning` ton, "x2/x3") ve puan chip'i. Doğru cevapta "+10" uçan mikro animasyon (zin-motor'daki mevcut motion kalıbı). Sonuç ekranı tek kart: büyük puan, goed/fout chip'leri, "Opnieuw" CTA.

**4g. `app/lessen/[lesId]/page.tsx` (5 faz):**
- Üst bara 5 adımlı **stepper** (① Bekijk ② Lees ③ Oefen ④ Herhaal ⑤ Klaar; aktif: accent dolgu, geçmiş: success).
- Fase 2'nin `fixed bottom-0 z-40` paneli GameShell aksiyon barı kalıbına taşınır (`bottom: calc(64px + safe-area)`) → "Oefeningen beginnen" düğmesinin alt nav altında kalma hatası (kullanıcı şikayeti) kapanır. İşaretli kelime chip'leri aksiyon barının üstünde açılır panel olarak kalır.
- Kelime çeviri balonu yerine **bottom sheet** (surface, rounded-t-2xl): kelime + çeviri; çeviri bulunamazsa "Sözlükte yok — kelime kaydedildi" metni göster (sessiz kalma).
- Alıştırma ekranları (vulIn/zinBouwen/vertaal/begrip) kart diline ve FeedbackToast'a geçer; `bg-[var(--ds-yellow)]` vb. tümü tokenlara.
- Fase 4/5 kartları surface + accent/success tonlarına.

**4h. Kalan sayfalar (`grammatica`, `kaarten`, `werkwoorden`, `signaalwoorden`, `voegwoorden`, `meer/*`, `onboarding`):** `--ds-*` kullanımlarını aynı token eşlemesiyle çevir (ds-black→primary/text bağlama göre, ds-yellow→accent, ds-red→danger yalnızca hata anlamındaysa yoksa primary, ds-green→success, ds-white→surface/bg, ds-gray→surface-2). Görsel yapıyı koru, yalnızca dil birliği sağla.

## ADIM 5 — Temizlik ve kabul kriterleri

Temizlik: `globals.css`'te `ui-modern`/`ui-destijl` kalıntısı kalmadığını `grep -rn "ds-\|ui-modern\|ui-destijl" app components lib` ile doğrula (0 sonuç hedef).

Kabul kriterleri (hepsi mobil 375×812'de doğrulanacak):
1. `npm run build` ve `npx tsc --noEmit` temiz.
2. 6 oyunda da başlık, skor, tüm butonlar **görünür ve okunaklı**; hiçbir ekranda zemin rengiyle aynı renkte metin yok (dark mode dahil).
3. Flitsen oyun ekranında ⏮/▶‖/⟳/⏭ kontrolleri görünür ve alt navın üstünde.
4. Zin-motor'da 5 seviye butonu görünür; DRAAI butonu çarkları döndürüyor.
5. Doğru cevap geri bildirimi yeşil/teal, yanlış **kırmızı** — tüm oyunlarda tutarlı; yanlış toast'u ≥2.5 sn görünür.
6. Ders Fase 2'de "Oefeningen beginnen" düğmesi alt navın üstünde ve tıklanabilir (`document.elementFromPoint` ile düğme merkezi düğmeyi döndürmeli).
7. Oyun mantığı regresyonu yok: her oyunda bir doğru + bir yanlış cevap akışı elle test edilip puan/geçmiş güncellemesi doğrulanacak.

Not: Mantık/veri hataları (high score, çözülemez ders alıştırmaları, sözlük fallback'i vb.) bu görevin DIŞINDA — onlar `OYUN-HATA-RAPORU.md` ve `UI-VE-COZUM-ONERILERI.md` Bölüm B'de ayrıca ele alınacak. Bu görevde davranış değiştiren tek istisnalar: DRAAI butonunun bağlanması (4b) ve tıkla-yerleştir etkileşimi (4c).
