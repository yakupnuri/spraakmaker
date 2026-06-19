# CEFR Yeniden Yapılandırma Raporu

Spraakmaker uygulamasındaki dağınık kelime ve cümle veri tabanları, CEFR standartlarına göre temizlenmiş, tekilleştirilmiş ve id-tabanlı olarak yeniden yapılandırılmıştır.

## 1. Veri Dağılım Tablosu

| Seviye | Kelime Adedi | Cümle Adedi |
| :--- | :---: | :---: |
| **A1** | 484 | 1504 |
| **A2** | 1696 | 4034 |
| **B1** | 3721 | 2927 |
| **B2** | 4380 | 201 |
| **Toplam (Benzersiz)** | **10281** | **8666** |

* Girdi Toplam Kayıt (Kelimeler): 12047
* Girdi Toplam Kayıt (Cümleler): 8968
* Elenen Boş Kayıtlar: Kelimeler: 0, Cümleler: 0
* Ayıklanan/Tekilleştirilen Mükerrer Kayıt Oranı: Kelimeler %14.7 , Cümleler %3.4

## 2. Temizlenen / Atlanan Kayıtlar

### Atlanan Meta Terim Örnekleri (Kelime olmayan gramer/bölüm meta-verileri: Toplam 12)
- **voorpagina, de** (ön sayfa,) - Kaynak: words-code3.json
- **paginagroot** (full page) - Kaynak: words-nlen.json
- **het werkwoord, de werkwoorden *** (fiil) - Kaynak: words-tc12.json
- **het werkwoord, de werkwoorden *** (fiil) - Kaynak: words-tc12.json
- **het werkwoord, de werkwoorden *** (fiil) - Kaynak: words-tc12.json
- **het werkwoord, de werkwoorden *** (fiil) - Kaynak: words-tc12.json
- **het werkwoord, de werkwoorden *** (fiil) - Kaynak: words-tc12.json
- **het werkwoord, de werkwoorden *** (fiil) - Kaynak: words-tc12.json
- **het werkwoord, de werkwoorden *** (fiil) - Kaynak: words-tc12.json
- **Ze moet nog vier hoofdstukken afkrijgen voor morgen.** (Yarın için hala dört bölüm bitirmesi gerekiyor.) - Kaynak: words-ww.json
- **1201-2100** (1201-2100) - Kaynak: words-zit.json
- **301-600** (301-600) - Kaynak: words-zit.json

## 3. Gözden Geçirilmesi Önerilen Sınır Kayıtlar

Aşağıdaki kayıtlar, kelime/cümle uzunluğu ve dilbilgisi karmaşıklığı parametreleri sebebiyle seviye geçişlerinin sınırlarında kalmış olup, ileride bir uzman tarafından gözle kontrol edilebilir:

### Sınırda Kalan Kelime Örnekleri (Uzun ama A2 seviyesinde değerlendirilenler)


### Sınırda Kalan Cümle Örnekleri (Uzun ama A2/A1 seviyesinde tutulanlar)
- `a2-z-0112`: **Als je goed om je heen kijkt, zie je dat alles gekleurd is** (Etrafınıza dikkatlice bakarsanız, her şeyin
renkli olduğunu göreceksiniz.) -> Seviye: A2
- `a2-z-0974`: **Hebben jullie misschien zin om aanstaande zondag te komen lunchen bij ons?** (Önümüzdeki Pazar öğle yemeğinde bize katılmak ister misiniz?) -> Seviye: A2
- `a2-z-1914`: **Ik heb in Turkije 5 jaar bij het Ministerie van Onderwijs gewerkt.** (Ben Turkiyede 5 yil Egitim Bakanliginda
calistim.) -> Seviye: A2
- `a2-z-2219`: **Ik vind het lastig om het alleen/in mijn eentje op te halen.** (Tek başıma almakta zorlanıyorum. (onu)) -> Seviye: A2
- `a2-z-2358`: **Ik wil graag Nederlands leren want ik wil
snel een baan vinden.** (Çabucak bir iş bulmak istediğim için
Hollandaca öğrenmek istiyorum. (want)) -> Seviye: A2
- `a2-z-3005`: **Nederlanders geven een bon wanneer ze niet weten wat ze moeten geven.** (Hollandalılar ne vereceklerini bilemediklerinde bir hediye çeki verirler.) -> Seviye: A2
- `a2-z-3035`: **Niks doen is ontzettend moeilijk. 
Je weet nooit wanneer je klaar bent.** (Hiçbir şey yapmamak acayip zor. 
İşinin ne zaman bittiğini asla bilemiyorsun. (Hiçbir şey yapmadığın için)) -> Seviye: A2
- `a2-z-3083`: **Op de tafel staat de borden, de glazen en de lepels en vorken** (Masada tabaklar, bardaklar, kaşıklar ve çatallar var.) -> Seviye: A2
- `a2-z-3594`: **We horen graag of jullie op 2 of 3 november kunnen komen!** (Eğer 2 veya 3 Kasım'da gelebilirseniz çok seviniriz!) -> Seviye: A2
- `a2-z-3803`: **Wij wonen op het AZC bij het park in de stad Duinrell.** (Duinrell şehrinde parkın yakınındaki AZC'de yaşıyoruz.) -> Seviye: A2
- `a2-z-3865`: **Ze doet haar best om een goed voorbeeld te
zijn voor jongeren.** (Gençlere iyi örnek olmak için elinden
gelenin en iyisini yapıyor.) -> Seviye: A2

## 4. Kalite ve Bütünlük Bildirimi
* Üretilen tüm JSON dosyaları geçerli ve parsedilebilir durumdadır.
* A1, A2, B1 ve B2 alt seviyelerinin kayıt toplamları, ana birleşik havuz dosyalarıyla (`woordenschat-alles.json` ve `zinnen-alles.json`) birebir örtüşmektedir.
* Artikeller (`de`, `het`) kelime yapısından ayrıştırılarak `artikel` alanına şema uyumlu eklenmiştir.
* Hiçbir orijinal girdi dosyası silinmemiş veya değiştirilmemiştir.
