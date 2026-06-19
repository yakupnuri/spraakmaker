# GÖREV: Tema switch'ini düzelt + Modaal çekim tablosunu mobilde kart yap

Spraakmaker (Next.js 16 App Router + Tailwind 4 + TypeScript, mobil öncelikli). İki ayrı sorun var.

---

## SORUN 1 — Tema switch'i (Licht / Donker / Systeem) çalışmıyor

**Konum:** `app/meer/page.tsx` (Thema bölümü, `handleTheme`), `components/ClientLayout.tsx`, `app/globals.css`.

**Şu ana kadar yapılanlar (yarım kaldı, üzerine inşa et):**
- `app/globals.css`: karanlık tema değerleri artık iki yerde tanımlı — `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { … } }` (sistem) ve `:root[data-theme="dark"] { … }` (manuel). Bu CSS kısmı **doğru çalışıyor** (elle `data-theme="dark"` set edilince sayfa kararıyor).
- `components/ClientLayout.tsx`: `progress.settings.theme`'i izleyip `<html>`'e `data-theme` set eden bir `useEffect` eklendi.

**KÖK NEDEN (tespit edildi):** `lib/hooks.ts` içindeki `useProgress` **paylaşımlı bir store değil** — her bileşende ayrı bir `useState` + localStorage kopyası oluşturuyor. Yani `app/meer/page.tsx`'teki `handleTheme` → `updateProgress` çağrısı yalnızca meer sayfasının kendi progress kopyasını ve localStorage'ı günceller; `ClientLayout`'taki ayrı `useProgress` instance'ı bu değişimi **duymaz**, dolayısıyla effect tetiklenmez ve `data-theme` güncellenmez. (Donker bazen çalışıyor görünüyor çünkü sayfa yenilenince ClientLayout mount'ta localStorage'daki son değeri okuyor — ama anlık tıklama yansımıyor.)

**İSTENEN ÇÖZÜM (en sağlam, en basit):** Tema uygulamasını progress state'ine bağımlı olmaktan çıkar, doğrudan DOM'a yaz:

1. **`app/meer/page.tsx` → `handleTheme`:** `updateProgress` ile localStorage'a yazmaya devam et, AMA aynı fonksiyon içinde anında DOM'u da güncelle:
   ```ts
   function applyTheme(theme: "light" | "dark" | "system") {
     const root = document.documentElement;
     if (theme === "system") root.removeAttribute("data-theme");
     else root.setAttribute("data-theme", theme);
   }
   // handleTheme içinde: updateProgress(...) + applyTheme(theme)
   ```
2. **İlk yükleme + FOUC önleme:** Sayfa açılışında localStorage'daki temayı uygula. En temizi `app/layout.tsx`'in `<head>`'ine, React hydrate olmadan önce çalışan küçük bir blocking inline script:
   ```tsx
   <script dangerouslySetInnerHTML={{ __html: `
     try {
       var p = JSON.parse(localStorage.getItem('spraakmaker-progress')||'{}');
       var t = (p.settings && p.settings.theme) || 'system';
       if (t !== 'system') document.documentElement.setAttribute('data-theme', t);
     } catch(e){}
   ` }} />
   ```
   (Bu, sayfa yenilenince doğru temanın flash olmadan gelmesini sağlar.)
3. `ClientLayout`'taki yarım effect'i bu yeni yaklaşımla uyumlu hale getir veya kaldır (çift uygulama olmasın). Tek doğruluk kaynağı: handleTheme'deki `applyTheme` + layout'taki açılış scripti.

**Doğrulama:**
- Sistem **light** modda iken **Donker** → uygulama anında kararır; **Licht** → anında aydınlanır; **Systeem** → sistem tercihine döner. Sayfa yenilenince seçim korunur (flash yok).
- Sistem **dark** modda iken **Licht** seçilince uygulama aydınlık kalır (sistem dark'ı override eder).
- Üç seçenek arasında ileri-geri geçişlerin hepsi anında ve doğru çalışır (sadece ilk seçim değil).

---

## SORUN 2 — Modaal çekim tablosu mobilde taşıyor

**Konum:** `components/grammatica/ModaleWerkwoordenPanel.tsx`, satır ~166-245 civarı. İki `<table>` var:
1. "Vervoeging" (tegenwoordige tijd): sütunlar Modaal / ik / jij-u / hij / wij — satırlar kunnen, mogen, moeten, willen, zullen, hoeven.
2. İmperfectum tablosu (satır ~258): Modaal / nu / vroeger / voorbeeld.

375px ekranda 4-5 sütun sığmıyor, sağ taraf kesiliyor (kullanıcı şikayeti).

**İSTENEN ÇÖZÜM:** Mobilde `<table>` yerine **kart bazlı liste** kullan. Her modal fiil = bir kart; çekim formları kart içinde etiketli satır/çip olarak. Önerilen yapı (Vervoeging için):
```
┌─────────────────────────────┐
│ kunnen                       │  ← fiil başlık (bold, accent renk)
│ ik kan · jij/u kunt/kan      │  ← formlar, etiket gri + değer bold
│ hij kan · wij/jullie/zij     │
│ kunnen                       │
└─────────────────────────────┘
```
Uygulama detayları:
- `md:` breakpoint'inde tablo kalabilir (`hidden md:block`), mobilde kartlar (`md:hidden`) — ya da tamamen kart yapısına geç (daha sade). Tercih: tek kart yapısı (hem mobil hem masaüstü tutarlı), genişlikte `grid sm:grid-cols-2 lg:grid-cols-3`.
- Her form için küçük etiket (`ik`, `jij/u`, `hij`, `wij/jullie/zij`) `text-[var(--text-muted)]`, değer `font-bold text-[var(--text)]`.
- "ik" formunu vurgula (accent rengi) — modal fiilde -t almaması önemli bilgi.
- İmperfectum tablosu için aynı kalıp: kart başlık = fiil, içinde `nu: kan`, `vroeger: kon` + örnek cümle.
- Mevcut veriyi (satır 181 ve 269'daki diziler) aynen kullan, sadece render'ı tablodan karta çevir.
- Renkler tasarım tokenlarıyla (`--surface, --surface-2, --text, --text-muted, --accent, --border`), hem light hem dark okunur olmalı.

**Doğrulama:** 375px'de hiçbir şey yatay taşmıyor/kesilmiyor; tüm modal fiiller ve çekimleri okunur; dark mode'da da düzgün.

---

## Genel kurallar
- `npx tsc --noEmit` ve `npm run build` temiz geçmeli.
- Tasarım tokenları kullan, sabit renk/hardcoded hex ekleme.
- Mevcut içerik (çekim verileri, gramer doğruluğu) değişmeyecek — sadece tema mekanizması + tablo sunumu.
- İçerik kuralı: yeni örnek/karakter üretme; üretirsen `HIKAYE-ICERIK-KURALLARI.md`'ye uy.
