# GÖREV: Dashboard + Gelişim (Voortgang) istatistiklerini eksiksiz ve çalışır hale getir

Spraakmaker (Next.js 16 App Router + Tailwind 4 + TypeScript, mobil öncelikli). Tüm veri `localStorage`'da: `spraakmaker-progress` (puan/ders/oyun istatistikleri/ayarlar) ve `spraakmaker-moedertaal`. Sunucu/hesap yok.

## Mevcut durum (tespit edildi)
- **Streak** (`progress.games.streak`) hiçbir yerde artırılmıyor → her zaman 0.
- **Günlük hedef** (`progress.settings.dailyGoal`) kaydediliyor ama hiçbir yerde kullanılmıyor → dekoratif.
- **Oyun istatistikleri eksik:** 6 oyundan yalnızca `vul-in`, `zin-bouwen`, `zin-motor` `games.stats`'a `correctCount/wrongCount/history` yazıyor. `flitsen`, `snelronde`, `vertaal` **hiç yazmıyor**.
- **Voortgang sayfası** (`app/meer/voortgang/page.tsx`) genel başarıyı yalnızca `zinBouwen + zinMotor`'dan hesaplıyor; hata analizi de yalnızca o ikisinden. Dersler (lessen) ve diğer oyunlar dahil değil.
- **WOORDEN sayacı** (dashboard) yalnızca `flashcard`'ı sayıyor; gramerde çalışılan fiiller dahil değil.

**Hedef:** Gelişim/istatistikler TÜM modülleri kapsasın — 6 oyun + grammatica + **lessen (dersler)** + kaarten. Streak ve günlük hedef gerçekten çalışsın.

> Not: `useProgress` paylaşımlı store değil (her bileşende ayrı kopya), ama hepsi aynı `localStorage` anahtarına yazıp okuyor. Dashboard/Voortgang sayfa geçişinde mount olup güncel veriyi okur — bu yeterli. Yeni global store kurmaya gerek yok.

---

## MADDE 1 — Veri modelini tamamla (`lib/types.ts` + `lib/hooks.ts`)

`Progress.games`'e günlük takip alanı ekle ve tüm oyunların stats'ını garanti et:
```ts
games: {
  highScores: { zinBouwen, vulIn, vertaal, snelronde, zinMotor, flitsen };  // flitsen ekle
  totalPoints: number;
  streak: number;
  lastPlayDate: string;            // ISO
  daily?: { date: string; count: number };   // YENİ: bugünkü aktivite sayısı
  stats?: Record<string, GameStats>;  // 6 oyun + grammatica için
}
```
`DEFAULT_PROGRESS` (lib/hooks.ts) `stats`'ında 6 oyunun hepsi + `grammatica` anahtarı boş GameStats ile başlasın. `highScores`'a `flitsen: 0` ekle.

## MADDE 2 — Merkezi aktivite kaydı: streak + günlük sayaç (`lib/hooks.ts`)

`useProgress`'e `recordActivity()` adında bir fonksiyon ekle (return objesine dahil et). Her çağrıldığında:
```
const todayKey = new Date().toISOString().slice(0,10);  // YYYY-MM-DD
const last = (lastPlayDate || "").slice(0,10);
// streak:
if (!last) streak = 1;
else if (last === todayKey) streak = streak;            // bugün zaten sayıldı
else if (last === dün(todayKey)) streak = streak + 1;   // ardışık gün
else streak = 1;                                         // seri koptu, bugün yeniden başla
lastPlayDate = new Date().toISOString();
// günlük sayaç:
daily = (daily?.date === todayKey) ? {date: todayKey, count: daily.count + 1}
                                   : {date: todayKey, count: 1};
```
`dün()` = todayKey'in bir önceki günü (tarih aritmetiğiyle, string karşılaştırma değil).

**Bu fonksiyon, puan kazanılan / soru tamamlanan her yerde bir kez çağrılacak:**
- 6 oyunun `checkAnswer`/cevap-değerlendirme noktası (doğru VE yanlış — aktivite sayılır),
- ders `handleOefeningenDone` (ders tamamlama),
- `kaarten` kelime değerlendirme,
- grammatica `PracticeQuiz.check`.

(Mevcut `updateProgress` ile `lastPlayDate: new Date()` yazan satırlar artık `recordActivity` ile birleşebilir veya recordActivity ayrı çağrılır — çift streak artışı olmamasına dikkat: streak günde 1 kez artar, mantık bunu zaten garanti ediyor.)

## MADDE 3 — Eksik oyunlara istatistik yaz (`flitsen`, `snelronde`, `vertaal`)

`vul-in`/`zin-bouwen`'deki kalıbı örnek alarak bu üç oyunda da `games.stats[oyunAdı]`'na yaz:
- `playCount++` (her cevap), `correctCount++`/`wrongCount++`, `history`'ye `{sentence, translation, correct, timestamp, userAnswer?, explanation?}` (son 50).
- `flitsen` için: her kart "spreek hardop" sonrası ileri geçişte bir aktivite say (doğru/yanlış yoksa "tamamlandı" olarak correct say), ya da en azından playCount + recordActivity.
- `snelronde` ve `vertaal`: her cevapta doğru/yanlış stats + recordActivity.
- `highScores.flitsen` de güncellensin (madde 1'de eklendi).

## MADDE 4 — Voortgang sayfasını TÜM modülleri kapsayacak şekilde yeniden düzenle (`app/meer/voortgang/page.tsx`)

1. **Genel başarı oranı:** 6 oyunun (`zinBouwen, zinMotor, vulIn, vertaal, snelronde, flitsen`) + `grammatica`'nın `correctCount`/`wrongCount` toplamından hesapla. (Şu an sadece 2 oyun.)
2. **Oyun başarı kartları:** 6 oyunun her biri için küçük kart (başarı %, oynama, doğru). 2'li/3'lü responsive grid.
3. **Hata analizi (son 5):** TÜM oyunların + grammatica'nın `history`'sinden birleşik, tarihe göre sıralı, yanlış olanlar.
4. **LESSEN (Dersler) bölümü EKLE:** `progress.lessons`'tan → tamamlanan ders sayısı, toplam yıldız / ortalama yıldız (`stars`), son çalışılan ders. Bir "Dersler" kartı olarak göster.
5. **Modül ilerlemesi:** max değerleri gerçek toplamlara bağla:
   - Lessen → `lessen.json` uzunluğu (fetch ile),
   - Grammatica → fiil dosyalarının gerçek toplamı (ya da makul sabit, yorumla belirt),
   - Kaarten/Spel → makul gerçek üst sınır.
6. **Streak** ve **günlük hedef** (madde 6) bu sayfada da doğru gösterilsin.

## MADDE 5 — WOORDEN sayacını netleştir (`app/page.tsx`)

Dashboard'daki WOORDEN = `flashcard` (kaarten) **+** `verbs` (gramerde çalışılan fiiller) benzersiz toplamı. Etiket "WOORDEN" kalsın ama gramer fiillerini de kapsasın. (İki ayrı sayaç da olabilir: "Woorden" + "Werkwoorden" — tercih sana, ama mevcut tek sayaç yanıltıcı.)

## MADDE 6 — Günlük hedefi işlevsel yap (`app/meer/page.tsx` + `app/page.tsx`)

`dailyGoal`'u **"günlük tamamlanan alıştırma sayısı"** olarak yorumla (dakika ölçmek güvenilmez; aktivite sayısı `daily.count`'tan net gelir).
- Meer'deki "Dagelijks doel" etiketini buna göre güncelle (örn. "Günlük X alıştırma").
- Dashboard'a (ve Voortgang'a) **bugünkü ilerleme** göster: `daily.count / dailyGoal` → dairesel halka veya bar + "8/15" metni. Hedefe ulaşınca küçük kutlama/✓.
- `daily.date` bugünden farklıysa sayaç sıfırdan başlar (madde 2 bunu sağlıyor).

## MADDE 7 — Streak'i dashboard'da doğrula (`app/page.tsx`)

Madde 2 sonrası streak gerçek değer alır; dashboard'daki 🔥 STREAK kartı ek değişiklik gerektirmez ama test edilmeli (bugün oyna → 1, yarın oyna → 2, bir gün atla → 1).

---

## Kabul kriterleri
- Bir oyun/ders/alıştırma tamamlandığında streak gün bazlı doğru artar (aynı gün tekrar oynamak artırmaz; ardışık gün +1; gün atlanırsa 1'e döner). Dashboard ve Voortgang'da aynı değer.
- Günlük hedef: bugün yapılan alıştırma sayısı dashboard'da hedefe karşı gösterilir; ertesi gün sıfırlanır.
- Voortgang genel başarı oranı 6 oyun + grammatica'yı kapsar; hata analizi hepsinden gelir; **Lessen bölümü** (tamamlanan + yıldız) görünür.
- 6 oyunun hepsi `games.stats`'a yazıyor (flitsen/snelronde/vertaal dahil).
- WOORDEN sayacı flashcard + fiilleri kapsar.
- `npx tsc --noEmit` ve `npm run build` temiz; tüm yeni UI tasarım tokenlarıyla, light+dark uyumlu.
- Mevcut oyun mekaniği (puanlama, cevap kontrolü) bozulmaz — yalnızca istatistik yazımı + gösterim eklenir.

## Sıralama önerisi (Antigravity bu sırayla ilerlesin)
1. Madde 1 (veri modeli) + Madde 2 (recordActivity) — temel.
2. Madde 3 (eksik oyun stats) + tüm çağrı noktalarına recordActivity.
3. Madde 4 (Voortgang yeniden düzen) + Madde 5 + Madde 6 + Madde 7.
4. Build + her iki temada doğrulama.
