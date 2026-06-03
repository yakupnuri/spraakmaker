// Grammar rules content for werkwoorden
// Pedagogisch verantwoorde volgorde (inburgering-methodiek):
// 1 → Tegenwoordige tijd  2 → Perfectum  3 → Imperfectum
// 4 → Modale werkwoorden  5 → Scheidbare werkwoorden  6 → Bijzinnen

export interface GrammarStep {
  label: string;
  text: string;
  translations: Record<string, string>;
}

export interface GrammarRule {
  title: string;
  explanation: string;
  explanationTranslations: Record<string, string>;
  steps: GrammarStep[];
  examples: Array<{
    infinitief: string;
    stam: string;
    imperf_s: string;
    imperf_p: string;
    perfectum: string;
    note?: string;
  }>;
  exampleHeaders?: {
    col1?: string;
    col2?: string;
    col3?: string;
    col4?: string;
    col5?: string;
  };
  tip?: string;
  tipTranslations?: Record<string, string>;
}

// ─── 1. Tegenwoordige tijd ────────────────────────────────────────────────────

export const GRAMMAR_TEGENWOORDIGE_TIJD: GrammarRule = {
  title: "Tegenwoordige tijd",
  explanation:
    "De basis van alles. Hier leer je de stam bepalen — die stam gebruik je ook in het perfectum en imperfectum. Zonder de tegenwoordige tijd kun je geen enkele andere tijd bouwen.",
  explanationTranslations: {
    tr: "Her şeyin temeli. Burada gövdeyi belirlemeyi öğreniyorsun — o gövdeyi perfectum ve imperfectum'da da kullanırsın. Tegenwoordige tijd olmadan başka hiçbir zaman kurulamaz.",
  },
  steps: [
    {
      label: "Stap 1 — Stam bepalen",
      text: `Stam = infinitief − en. Let op 3 schrijfregels:

1. Lange klinker (als enkele letter geschreven) → dubbel in de stam
     ma·ken  → maak     (lange 'a')
     lo·pen  → loop     (lange 'o')
     le·zen  → lees     (-z→-s, lange 'e')

2. Dubbele medeklinker → één medeklinker in de stam
     zet·ten → zet
     bid·den → bid

3. -v of -z aan het einde → -f of -s
     le·ven  → leef     (-v→-f)
     rei·zen → reis     (-z→-s)`,
      translations: {
        tr: `Gövde = mastar − en. 3 yazım kuralına dikkat:

1. Tek yazılan uzun sesli harf → gövdede çift sesli harf
     ma·ken  → maak     (uzun 'a')
     lo·pen  → loop     (uzun 'o')
     le·zen  → lees     (-z→-s, uzun 'e')

2. Çift ünsüz → gövdede tek ünsüz
     zet·ten → zet
     bid·den → bid

3. Sondaki -v veya -z → -f veya -s
     le·ven  → leef     (-v→-f)
     rei·zen → reis     (-z→-s)`,
      },
    },
    {
      label: "Stap 2 — Enkelvoud (ik / jij / hij)",
      text: `ik         +  stam          (geen uitgang)
jij / je   +  stam + t
u          +  stam + t
hij/zij/het + stam + t

Voorbeelden:
  werken:  ik werk    · jij werkt   · hij werkt
  maken:   ik maak    · jij maakt   · hij maakt
  leven:   ik leef    · jij leeft   · hij leeft
  reizen:  ik reis    · jij reist   · hij reist
  wachten: ik wacht   · jij wacht   · hij wacht
            ↑ stam eindigt al op -t, geen extra -t nodig`,
      translations: {
        tr: `ik         +  gövde          (ek yok)
jij / je   +  gövde + t
u          +  gövde + t
hij/zij/het + gövde + t

Örnekler:
  werken:  ik werk    · jij werkt   · hij werkt
  maken:   ik maak    · jij maakt   · hij maakt
  leven:   ik leef    · jij leeft   · hij leeft
  reizen:  ik reis    · jij reist   · hij reist
  wachten: ik wacht   · jij wacht   · hij wacht
            ↑ gövde zaten -t ile bitiyor, ekstra -t gerekmez`,
      },
    },
    {
      label: "Stap 3 — Meervoud & inversie",
      text: `wij / we   +  infinitief    (terug naar de infinitief!)
jullie     +  infinitief
zij / ze   +  infinitief

  wij werken  ·  jullie werken  ·  zij werken

Inversie — als het onderwerp NA het werkwoord staat:
  Normale volgorde:  Jij werkt morgen.
  Inversie:          Werk jij morgen?
  → De -t van jij/je valt WEG bij inversie.

  Werkt hij morgen?   ✓  (hij verliest de -t NIET)
  Werk jij morgen?    ✓  (jij/je verliest de -t WEL)`,
      translations: {
        tr: `wij / we   +  mastar    (mastar biçimine dönüş!)
jullie     +  mastar
zij / ze   +  mastar

  wij werken  ·  jullie werken  ·  zij werken

Ters çevrim (inversie) — özne fiilden SONRA geldiğinde:
  Normal sıra:     Jij werkt morgen.
  Ters çevrim:     Werk jij morgen?
  → Ters çevrimde jij/je'nin -t'si DÜŞER.

  Werkt hij morgen?   ✓  (hij'in -t'si DÜŞMEZ)
  Werk jij morgen?    ✓  (jij/je'nin -t'si DÜŞER)`,
      },
    },
    {
      label: "Stap 4 — Onregelmatige basiswerkwoorden",
      text: `Deze vijf werkwoorden moet je uit het hoofd leren:

              ik      jij/u    hij      wij/jullie/zij
  zijn:       ben     bent     is       zijn
  hebben:     heb     hebt     heeft    hebben
  gaan:       ga      gaat     gaat     gaan
  doen:       doe     doet     doet     doen
  zien:       zie     ziet     ziet     zien

Zijn en hebben gebruik je ook als hulpwerkwoord in het perfectum:
  Ik heb gewerkt.   Hij is gegaan.`,
      translations: {
        tr: `Bu beş fiili ezberlemen gerekiyor:

              ik      jij/u    hij      wij/jullie/zij
  zijn:       ben     bent     is       zijn
  hebben:     heb     hebt     heeft    hebben
  gaan:       ga      gaat     gaat     gaan
  doen:       doe     doet     doet     doen
  zien:       zie     ziet     ziet     zien

Zijn ve hebben perfectum'da yardımcı fiil olarak da kullanılır:
  Ik heb gewerkt.   Hij is gegaan.`,
      },
    },
  ],
  exampleHeaders: { col1: "INFINITIEF", col2: "STAM", col3: "IK / HIJ", col4: "WIJ", col5: "DEELWOORD" },
  examples: [
    { infinitief: "werken", stam: "werk", imperf_s: "werk / werkt", imperf_p: "werken", perfectum: "gewerkt" },
    { infinitief: "maken", stam: "maak", imperf_s: "maak / maakt", imperf_p: "maken", perfectum: "gemaakt" },
    { infinitief: "leven", stam: "leef", imperf_s: "leef / leeft", imperf_p: "leven", perfectum: "geleefd" },
    { infinitief: "reizen", stam: "reis", imperf_s: "reis / reist", imperf_p: "reizen", perfectum: "gereisd" },
    { infinitief: "zijn", stam: "—", imperf_s: "ben / is", imperf_p: "zijn", perfectum: "geweest" },
    { infinitief: "hebben", stam: "—", imperf_s: "heb / heeft", imperf_p: "hebben", perfectum: "gehad" },
  ],
  tip: "Onthoud: wij/jullie/zij + infinitief (nooit stam+t). En: jij/je verliest de -t bij inversie, hij nooit.",
  tipTranslations: {
    tr: "Hatırla: wij/jullie/zij + mastar (asla stam+t değil). Ve: jij/je ters çevrimde -t'yi kaybeder, hij hiçbir zaman kaybetmez.",
  },
};

// ─── 2. Perfectum (VTT) ───────────────────────────────────────────────────────

export const GRAMMAR_PERFECTUM: GrammarRule = {
  title: "Perfectum (voltooide tegenwoordige tijd)",
  explanation:
    "Het perfectum is de gewone gesproken verleden tijd. Als Nederlanders over gisteren praten, gebruiken ze bijna altijd het perfectum — niet het imperfectum.",
  explanationTranslations: {
    tr: "Perfectum, günlük konuşmadaki olağan geçmiş zamandır. Hollandalılar dünü anlatırken neredeyse her zaman perfectum kullanır — imperfectum değil.",
  },
  steps: [
    {
      label: "Stap 1 — Hebben of zijn?",
      text: `Zijn: beweging van A naar B, toestandsverandering, of een van deze vaste werkwoorden:
  gaan · komen · rijden · lopen · vliegen · fietsen
  vallen · opstaan · worden · zijn · blijven · lijken · gebeuren

Hebben: al het andere.

Voorbeelden:
  Ik ben naar Amsterdam gegaan.        (beweging A→B: zijn)
  Hij is ziek geworden.                (toestandsverandering: zijn)
  Ze is thuis gebleven.                (blijven: altijd zijn)
  Wij hebben de film gekeken.          (geen beweging: hebben)
  Jij hebt hard gewerkt.               (geen beweging: hebben)`,
      translations: {
        tr: `Zijn: A'dan B'ye hareket, durum değişikliği veya şu sabit fiillerden biri:
  gaan · komen · rijden · lopen · vliegen · fietsen
  vallen · opstaan · worden · zijn · blijven · lijken · gebeuren

Hebben: diğer her şey.

Örnekler:
  Ik ben naar Amsterdam gegaan.        (A→B hareketi: zijn)
  Hij is ziek geworden.                (durum değişikliği: zijn)
  Ze is thuis gebleven.                (blijven: her zaman zijn)
  Wij hebben de film gekeken.          (hareket yok: hebben)
  Jij hebt hard gewerkt.               (hareket yok: hebben)`,
      },
    },
    {
      label: "Stap 2 — Voltooid deelwoord (regelmatig)",
      text: "SoFTKeTCHuP\n\nFormule:  ge- + stam + t  of  ge- + stam + d\n\nDezelfde regel als het imperfectum:\n  stameinde in S · F · T · K · CH · P  →  +t\n  stameinde NIET in soft ketchup        →  +d\n\n  werk  (k)  → gewerkt\n  hoor  (r)  → gehoord\n  leef  (f)  → geleefd     (v→f, maar toch -d: want v ∉ kofschip)\n  reis  (s)  → gereisd     (z→s, maar toch -d: want z ∉ kofschip)\n  maak  (k)  → gemaakt\n  speel (l)  → gespeeld",
      translations: {
        tr: "SoFTKeTCHuP\n\nFormül:  ge- + gövde + t  veya  ge- + gövde + d\n\nImperfectum ile aynı kural:\n  gövde sonu S · F · T · K · CH · P'den biri  →  +t\n  gövde sonu soft ketchup'ta değil             →  +d\n\n  werk  (k)  → gewerkt\n  hoor  (r)  → gehoord\n  leef  (f)  → geleefd     (v→f ama yine -d: çünkü v ∉ kofschip)\n  reis  (s)  → gereisd     (z→s ama yine -d: çünkü z ∉ kofschip)\n  maak  (k)  → gemaakt\n  speel (l)  → gespeeld",
      },
    },
    {
      label: "Stap 3 — Voltooid deelwoord (onregelmatig)",
      text: `Onregelmatige werkwoorden moet je uit het hoofd leren.
Veelgebruikte groepen:

  ij → ij:  rijden/gereden, schrijven/geschreven, blijven/gebleven
  ie → o:   bieden/geboden, schieten/geschoten
  i  → o:   beginnen/begonnen, drinken/gedronken, zingen/gezongen
  Overig:   gaan/gegaan, komen/gekomen, zien/gezien
             zijn/geweest, hebben/gehad, doen/gedaan, staan/gestaan

Tip: leer elk werkwoord als triplet:
  infinitief — imperfectum — voltooid deelwoord
  rijden — reed — gereden`,
      translations: {
        tr: `Düzensiz fiillerin geçmiş ortaçlarını ezberlemen gerekiyor.
Sık kullanılan gruplar:

  ij → ij:  rijden/gereden, schrijven/geschreven, blijven/gebleven
  ie → o:   bieden/geboden, schieten/geschoten
  i  → o:   beginnen/begonnen, drinken/gedronken, zingen/gezongen
  Diğerleri: gaan/gegaan, komen/gekomen, zien/gezien
             zijn/geweest, hebben/gehad, doen/gedaan, staan/gestaan

İpucu: her fiili üçlü olarak öğren:
  mastar — imperfectum — geçmiş ortaç
  rijden — reed — gereden`,
      },
    },
    {
      label: "Stap 4 — Positie in de zin",
      text: `In een gewone zin:
  POSITIE 1      POSITIE 2    ...    EINDE
  Subject        Hulpww.             Deelwoord
  Ik             heb        gisteren  gewerkt.
  Hij            is         snel      gegaan.

Vragen (inversie):
  Heb jij gisteren gewerkt?
  Is hij snel gegaan?

Ontkenning — niet staat vóór het deelwoord:
  Ik heb gisteren NIET gewerkt.
  Hij is snel gegaan → Hij is NIET snel gegaan.`,
      translations: {
        tr: `Normal cümlede:
  KONUM 1        KONUM 2      ...    SONU
  Özne           Yardımcı f.         Ortaç
  Ik             heb        dün      gewerkt.
  Hij            is         hızlı    gegaan.

Soru (ters çevrim):
  Heb jij gisteren gewerkt?
  Is hij snel gegaan?

Olumsuzlama — niet ortaçtan ÖNCE gelir:
  Ik heb gisteren NIET gewerkt.
  Hij is NIET snel gegaan.`,
      },
    },
  ],
  exampleHeaders: { col1: "INFINITIEF", col2: "HULPWW.", col3: "DEELWOORD", col4: "VOLZIN (ENK.)", col5: "TYPE" },
  examples: [
    { infinitief: "werken", stam: "hebben", imperf_s: "gewerkt", imperf_p: "Ik heb gewerkt.", perfectum: "regelmatig" },
    { infinitief: "leven", stam: "hebben", imperf_s: "geleefd", imperf_p: "Ik heb geleefd.", perfectum: "regelmatig" },
    { infinitief: "gaan", stam: "zijn", imperf_s: "gegaan", imperf_p: "Ik ben gegaan.", perfectum: "onregelmatig" },
    { infinitief: "komen", stam: "zijn", imperf_s: "gekomen", imperf_p: "Ik ben gekomen.", perfectum: "onregelmatig" },
    { infinitief: "schrijven", stam: "hebben", imperf_s: "geschreven", imperf_p: "Ik heb geschreven.", perfectum: "onregelmatig" },
    { infinitief: "worden", stam: "zijn", imperf_s: "geworden", imperf_p: "Ik ben geworden.", perfectum: "onregelmatig" },
  ],
  tip: "Zijn of hebben? Denk: verplaatst de persoon zich van A naar B, of verandert zijn toestand? Dan zijn. Bij twijfel: hebben.",
  tipTranslations: {
    tr: "Zijn mi hebben mi? Şunu düşün: kişi A'dan B'ye hareket etti mi, yoksa durumu değişti mi? Öyleyse zijn. Emin değilsen: hebben.",
  },
};

// ─── 3. Imperfectum (OVT) ────────────────────────────────────────────────────

export const GRAMMAR_IMPERFECTUM: GrammarRule = {
  title: "Imperfectum (onvoltooid verleden tijd)",
  explanation:
    "Het imperfectum gebruik je in geschreven tekst, verhalen en kranten. In gesproken taal kom je het bijna alleen tegen bij was, had, kon, moest, wilde en mocht.",
  explanationTranslations: {
    tr: "Imperfectum yazılı metinlerde, hikayelerde ve gazetelerde kullanılır. Konuşma dilinde onu neredeyse yalnızca was, had, kon, moest, wilde ve mocht'ta görürsün.",
  },
  steps: [
    {
      label: "Stap 1 — Regelmatig: stam + te of de",
      text: "SoFTKeTCHuP\n\nDezelfde regel als het voltooid deelwoord:\n  stameinde in S · F · T · K · CH · P  →  -te (enkelvoud)  /  -ten (meervoud)\n  stameinde NIET in soft ketchup        →  -de (enkelvoud)  /  -den (meervoud)\n\n  werk  (k)  → werkte   / werkten\n  maak  (k)  → maakte   / maakten\n  hoor  (r)  → hoorde   / hoorden\n  leef  (f)  → leefde   / leefden   (v→f, maar -d: want v ∉ kofschip)\n  reis  (s)  → reisde   / reisden   (z→s, maar -d: want z ∉ kofschip)\n  praat (t)  → praatte  / praatten",
      translations: {
        tr: "SoFTKeTCHuP\n\nGeçmiş ortaçla aynı kural:\n  gövde sonu S · F · T · K · CH · P'den biri  →  -te (tekil)  /  -ten (çoğul)\n  gövde sonu soft ketchup'ta değil             →  -de (tekil)  /  -den (çoğul)\n\n  werk  (k)  → werkte   / werkten\n  maak  (k)  → maakte   / maakten\n  hoor  (r)  → hoorde   / hoorden\n  leef  (f)  → leefde   / leefden   (v→f ama -d: çünkü v ∉ kofschip)\n  reis  (s)  → reisde   / reisden   (z→s ama -d: çünkü z ∉ kofschip)\n  praat (t)  → praatte  / praatten",
      },
    },
    {
      label: "Stap 2 — Onregelmatig imperfectum",
      text: `Onregelmatige werkwoorden veranderen van klinker:

  zijn:       was / waren
  hebben:     had / hadden
  gaan:       ging / gingen
  komen:      kwam / kwamen
  zien:       zag / zagen
  doen:       deed / deden
  rijden:     reed / reden
  schrijven:  schreef / schreven
  beginnen:   begon / begonnen
  drinken:    dronk / dronken

Meervoud: enkelvoudsvorm + en (soms kleine spelling-aanpassing):
  was → waren   ·   reed → reden   ·   ging → gingen`,
      translations: {
        tr: `Düzensiz fiiller ünlülerini değiştirir:

  zijn:       was / waren
  hebben:     had / hadden
  gaan:       ging / gingen
  komen:      kwam / kwamen
  zien:       zag / zagen
  doen:       deed / deden
  rijden:     reed / reden
  schrijven:  schreef / schreven
  beginnen:   begon / begonnen
  drinken:    dronk / dronken

Çoğul: tekil form + en (bazen küçük yazım düzenlemesi):
  was → waren   ·   reed → reden   ·   ging → gingen`,
      },
    },
    {
      label: "Stap 3 — Perfectum vs. imperfectum",
      text: `In gesproken taal: gebruik bijna altijd perfectum.
  Ik heb gisteren gewerkt.       ✓ (gesprek)
  Ik werkte gisteren.            △ (klinkt formeel/literair)

Gebruik WEL het imperfectum bij:
  1. was / had / kon / moest / wilde / mocht
       Ik was moe.   Hij had honger.   Ze kon niet komen.
  2. Verhalen en beschrijvingen (verleden tijdstrekker)
       Het was een mooie dag. De zon scheen...
  3. Formele schrijftaal en journalistiek
       De minister verklaarde dat...

Stelregel: als je twijfelt, gebruik het perfectum.`,
      translations: {
        tr: `Konuşma dilinde: neredeyse her zaman perfectum kullan.
  Ik heb gisteren gewerkt.       ✓ (günlük konuşma)
  Ik werkte gisteren.            △ (resmi/edebi gelir)

Şu durumlarda imperfectum kullan:
  1. was / had / kon / moest / wilde / mocht
       Ik was moe.   Hij had honger.   Ze kon niet komen.
  2. Hikayeler ve betimlemeler
       Het was een mooie dag. De zon scheen...
  3. Resmi yazı dili ve gazetecilik
       De minister verklaarde dat...

Pratik kural: emin değilsen perfectum kullan.`,
      },
    },
  ],
  examples: [
    { infinitief: "werken", stam: "werk", imperf_s: "werkte", imperf_p: "werkten", perfectum: "heeft gewerkt" },
    { infinitief: "horen", stam: "hoor", imperf_s: "hoorde", imperf_p: "hoorden", perfectum: "heeft gehoord" },
    { infinitief: "leven", stam: "leef", imperf_s: "leefde", imperf_p: "leefden", perfectum: "heeft geleefd" },
    { infinitief: "reizen", stam: "reis", imperf_s: "reisde", imperf_p: "reisden", perfectum: "heeft gereisd" },
    { infinitief: "zijn", stam: "—", imperf_s: "was", imperf_p: "waren", perfectum: "is geweest" },
    { infinitief: "gaan", stam: "—", imperf_s: "ging", imperf_p: "gingen", perfectum: "is gegaan" },
  ],
  tip: "SoFTKeTCHuP geldt voor zowel het imperfectum (-te/-de) als het voltooid deelwoord (+t/+d). Één regel, twee tijden.",
  tipTranslations: {
    tr: `SoFTKeTCHuP hem imperfectum (-te/-de) hem voltooid deelwoord (+t/+d) için geçerlidir. Tek kural, iki zaman.`,
  },
};

// ─── 4. Modale werkwoorden ────────────────────────────────────────────────────

export const GRAMMAR_MODAAL: GrammarRule = {
  title: "Modale werkwoorden",
  explanation:
    "Modale werkwoorden drukken mogelijkheid, verplichting, wens of toestemming uit. Ze sturen het tweede werkwoord altijd naar het einde van de zin.",
  explanationTranslations: {
    tr: "Modal fiiller olasılık, zorunluluk, istek veya izin ifade eder. İkinci fiili her zaman cümlenin sonuna gönderirler.",
  },
  steps: [
    {
      label: "Stap 1 — De 6 modale werkwoorden",
      text: `kunnen   → mogelijkheid / vermogen       (yapabilmek)
mogen    → toestemming / mogelijkheid   (yapabilmek / -ebilmek)
moeten   → verplichting / noodzaak      (zorunda olmak)
willen   → wens / intentie              (istemek)
zullen   → toekomst / belofte           (gelecek / vaat)
hoeven   → ontkenning van moeten        (gerekmek — genellikle niet hoeven)

Hoeven gebruik je bijna altijd met niet of geen:
  Je hoeft dat niet te doen.    (Je moet dat niet doen. ≠ verbod!)
  Je hoeft geen geld mee te nemen.`,
      translations: {
        tr: `kunnen   → olasılık / yetenek             (yapabilmek)
mogen    → izin / olasılık                 (yapabilmek / -ebilmek)
moeten   → zorunluluk / gereklilik         (zorunda olmak)
willen   → istek / niyet                   (istemek)
zullen   → gelecek zaman / söz             (gelecek / vaat)
hoeven   → moeten'in olumsuz karşılığı    (gerekmek — genelde niet hoeven ile)

Hoeven neredeyse her zaman niet veya geen ile kullanılır:
  Je hoeft dat niet te doen.    (Je moet dat niet doen. ≠ yasak!)
  Je hoeft geen geld mee te nemen.`,
      },
    },
    {
      label: "Stap 2 — Vervoeging tegenwoordige tijd",
      text: `              ik       jij/u    hij/zij   wij/jullie/zij
  kunnen:       kan      kunt     kan       kunnen
  mogen:        mag      mag      mag       mogen
  moeten:       moet     moet     moet      moeten
  willen:       wil      wilt     wil       willen
  zullen:       zal      zult     zal       zullen
  hoeven:       hoef     hoeft    hoeft     hoeven

Let op: ik kan, ik wil, ik mag, ik moet, ik zal — geen -t bij 'ik'!
En: jij/je kunt → bij inversie: Kun jij...? (de -t valt weg bij jij/je!)`,
      translations: {
        tr: `              ik       jij/u    hij/zij   wij/jullie/zij
  kunnen:       kan      kunt     kan       kunnen
  mogen:        mag      mag      mag       mogen
  moeten:       moet     moet     moet      moeten
  willen:       wil      wilt     wil       willen
  zullen:       zal      zult     zal       zullen
  hoeven:       hoef     hoeft    hoeft     hoeven

Dikkat: ik kan, ik wil, ik mag, ik moet, ik zal — 'ik'te -t YOK!
Ve: jij/je kunt → ters çevrimde: Kun jij...? (-t düşer!)`,
      },
    },
    {
      label: "Stap 3 — Zinsbouw: infinitief naar het einde",
      text: `Modal werkwoord staat op positie 2, de infinitief gaat naar het EINDE:

  Ik   kan    goed  zwemmen.
  Hij  moet   morgen  werken.
  Ze   wil    dit boek  lezen.
  Wij  mogen  hier niet  roken.
  Jij  hoeft  dat niet   te doen.   ← hoeven: altijd 'te' vóór infinitief!

Bij twee infinitieven (modaal + scheidbaar):
  Ik kan hem morgen opbellen.
  Ze wil vroeg opstaan.

Vraagzin (inversie):
  Kan jij goed zwemmen?
  Moet hij morgen werken?`,
      translations: {
        tr: `Modal fiil 2. konumda durur, mastar cümlenin SONUNA gider:

  Ik   kan    goed  zwemmen.
  Hij  moet   morgen  werken.
  Ze   wil    dit boek  lezen.
  Wij  mogen  hier niet  roken.
  Jij  hoeft  dat niet   te doen.   ← hoeven: her zaman 'te' + mastar!

İki mastar olduğunda (modal + ayrılabilir fiil):
  Ik kan hem morgen opbellen.
  Ze wil vroeg opstaan.

Soru cümlesi (ters çevrim):
  Kan jij goed zwemmen?
  Moet hij morgen werken?`,
      },
    },
    {
      label: "Stap 4 — Imperfectum van modale werkwoorden",
      text: `Deze vormen zijn onregelmatig en komen veel voor in gesproken taal:

              tegenw. tijd    imperfectum (enk.)    imperfectum (mv.)
  kunnen:     kan             kon                   konden
  mogen:      mag             mocht                 mochten
  moeten:     moet            moest                 moesten
  willen:     wil             wilde / wou           wilden
  zullen:     zal             zou                   zouden
  hoeven:     hoef            hoefde                hoefden

Voorbeelden:
  Ik kon gisteren niet komen.    (kon ≠ kan)
  Ze moest heel hard werken.
  Hij wilde naar huis gaan.
  We zouden morgen afspreken.`,
      translations: {
        tr: `Bu biçimler düzensizdir ve konuşma dilinde çok sık kullanılır:

              şimdiki zaman   imperfectum (tekil)   imperfectum (çoğul)
  kunnen:     kan             kon                   konden
  mogen:      mag             mocht                 mochten
  moeten:     moet            moest                 moesten
  willen:     wil             wilde / wou           wilden
  zullen:     zal             zou                   zouden
  hoeven:     hoef            hoefde                hoefden

Örnekler:
  Ik kon gisteren niet komen.    (kon ≠ kan)
  Ze moest heel hard werken.
  Hij wilde naar huis gaan.
  We zouden morgen afspreken.`,
      },
    },
  ],
  exampleHeaders: { col1: "MODAAL", col2: "BETEKENIS", col3: "IK (TGWD.)", col4: "IK (IMPERF.)", col5: "VOORBEELD" },
  examples: [
    { infinitief: "kunnen", stam: "vermogen", imperf_s: "kan", imperf_p: "kon", perfectum: "Ik kan zwemmen." },
    { infinitief: "moeten", stam: "verplichting", imperf_s: "moet", imperf_p: "moest", perfectum: "Ik moet werken." },
    { infinitief: "willen", stam: "wens", imperf_s: "wil", imperf_p: "wilde", perfectum: "Ik wil slapen." },
    { infinitief: "mogen", stam: "toestemming", imperf_s: "mag", imperf_p: "mocht", perfectum: "Ik mag gaan." },
    { infinitief: "zullen", stam: "toekomst", imperf_s: "zal", imperf_p: "zou", perfectum: "Ik zal bellen." },
    { infinitief: "hoeven", stam: "niet nodig", imperf_s: "hoef", imperf_p: "hoefde", perfectum: "Ik hoef niet." },
  ],
  tip: "Hoeven is speciaal: het betekent alleen iets met 'niet' of 'geen'. 'Je hoeft niet' ≠ verbod, maar 'het is niet nodig'.",
  tipTranslations: {
    tr: `Hoeven özeldir: yalnızca 'niet' veya 'geen' ile anlam kazanır. 'Je hoeft niet' yasak değil, 'gerek yok' demektir.`,
  },
};

// ─── 5. Scheidbare werkwoorden ────────────────────────────────────────────────

export const GRAMMAR_SCHEIDBAAR: GrammarRule = {
  title: `Scheidbare werkwoorden`,
  explanation:
    "Scheidbare werkwoorden hebben een prefix (op-, af-, mee-, aan-...) dat loskomt in de zin.",
  explanationTranslations: {
    tr: "Ayrılabilir fiillerin bir öneki vardır (op-, af-, mee-, aan-...) ve bu önek cümlede ayrılır.",
  },
  steps: [
    {
      label: "Stap 1 — Prefix loskomen in de tegenwoordige tijd",
      text: "Het prefix gaat naar het einde van de zin:\n  afspreken: Ik spreek morgen af. (niet: Ik afspraak)\n  opstaan:   Hij staat vroeg op.\n  meenemen:  Neem je dit mee?\n\nHoe herken je een scheidbaar werkwoord?\n  Losse prefixen → scheidbaar:  op·, af·, mee·, aan·, uit·, in·, neer·, terug·, samen·\n  Vaste prefixen → NIET scheidbaar: be·, ver·, her·, ont·, ge·\n\n  oplopen   → scheidbaar   (ik loop op)\n  belopen   → niet scheidbaar (ik belop het pad)",
      translations: {
        tr: "Önek cümlenin sonuna gider:\n  afspreken: Ik spreek morgen af. (Ik afspraak değil!)\n  opstaan:   Hij staat vroeg op.\n  meenemen:  Neem je dit mee?\n\nAyrılabilir fiili nasıl tanırsın?\n  Serbest önekler → ayrılabilir: op·, af·, mee·, aan·, uit·, in·, neer·, terug·, samen·\n  Yapışık önekler → ayrılamaz:   be·, ver·, her·, ont·, ge·\n\n  oplopen   → ayrılabilir   (ik loop op)\n  belopen   → ayrılamaz    (ik belop het pad)",
      },
    },
    {
      label: "Stap 2 — Stam bepalen",
      text: "De stam van een scheidbaar werkwoord = stam van het basiswerkwoord (zonder prefix):\n  afspreken  → basiswerkwoord: spreken → stam: spreek\n  opstaan    → basiswerkwoord: staan   → stam: sta\n  meenemen   → basiswerkwoord: nemen   → stam: neem\n  aankomen   → basiswerkwoord: komen   → stam: kom\n\nTegenwoordige tijd: gebruik de stam + prefix achteraan:\n  (ik) spreek af   (hij) staat op   (zij) neemt mee",
      translations: {
        tr: "Ayrılabilir fiilin gövdesi = temel fiilin gövdesi (önek olmadan):\n  afspreken  → temel fiil: spreken → gövde: spreek\n  opstaan    → temel fiil: staan   → gövde: sta\n  meenemen   → temel fiil: nemen   → gövde: neem\n  aankomen   → temel fiil: komen   → gövde: kom\n\nGeniş zaman: gövde + önek sona:\n  (ik) spreek af   (hij) staat op   (zij) neemt mee",
      },
    },
    {
      label: "Stap 3 — Perfectum: ge- tussen prefix en stam",
      text: "In het perfectum: prefix + ge- + stam + t/d\nHet ge- schuift tussen het prefix en de stam in:\n\n  afspreken  → af·ge·sproken   (hebben)\n  opstaan    → op·ge·staan     (zijn)\n  meenemen   → mee·ge·nomen   (hebben)\n  aankomen   → aan·ge·komen   (zijn)\n  uitleggen  → uit·ge·legd    (hebben)\n  opbellen   → op·ge·beld     (hebben)\n\nLet op: hebben of zijn volgt dezelfde regel als bij gewone werkwoorden\n  (beweging A→B of toestandsverandering → zijn, anders → hebben)",
      translations: {
        tr: "Perfectum'da: önek + ge- + gövde + t/d\nge- önek ile gövde arasına girer:\n\n  afspreken  → af·ge·sproken   (hebben)\n  opstaan    → op·ge·staan     (zijn)\n  meenemen   → mee·ge·nomen   (hebben)\n  aankomen   → aan·ge·komen   (zijn)\n  uitleggen  → uit·ge·legd    (hebben)\n  opbellen   → op·ge·beld     (hebben)\n\nDikkat: hebben mi zijn mi? Aynı kural geçerli:\n  (A'dan B'ye hareket veya durum değişikliği → zijn, diğerleri → hebben)",
      },
    },
    {
      label: "Stap 4 — Imperfectum: prefix blijft los",
      text: "In het imperfectum blijft het prefix los achteraan, net als in de tegenwoordige tijd.\nDe stam vervoegt als een gewoon werkwoord (regelmatig of onregelmatig):\n\n  afspreken  (stam: spreek → regelmatig)\n    Ik sprak gisteren af.      (enkelvoud)\n    Wij spraken gisteren af.   (meervoud)\n\n  opstaan    (stam: sta → onregelmatig: stond)\n    Hij stond vroeg op.        (enkelvoud)\n    Zij stonden vroeg op.      (meervoud)\n\n  meenemen   (stam: neem → onregelmatig: nam)\n    Ze nam alles mee.          (enkelvoud)\n    Ze namen alles mee.        (meervoud)\n\n  aankomen   (stam: kom → onregelmatig: kwam)\n    De trein kwam laat aan.    (enkelvoud)\n    De treinen kwamen laat aan.(meervoud)",
      translations: {
        tr: "Geçmiş zamanda (imperfectum) önek yine ayrı kalır, tıpkı geniş zamandaki gibi.\nGövde normal bir fiil gibi çekimlenir (düzenli veya düzensiz):\n\n  afspreken  (gövde: spreek → düzenli)\n    Ik sprak gisteren af.      (tekil)\n    Wij spraken gisteren af.   (çoğul)\n\n  opstaan    (gövde: sta → düzensiz: stond)\n    Hij stond vroeg op.        (tekil)\n    Zij stonden vroeg op.      (çoğul)\n\n  meenemen   (gövde: neem → düzensiz: nam)\n    Ze nam alles mee.          (tekil)\n    Ze namen alles mee.        (çoğul)\n\n  aankomen   (gövde: kom → düzensiz: kwam)\n    De trein kwam laat aan.    (tekil)\n    De treinen kwamen laat aan.(çoğul)",
      },
    },
    {
      label: "Stap 5 — In bijzin: prefix plakt terug",
      text: "In een bijzin (na omdat, dat, als, terwijl, toen...) staat het werkwoord achteraan\nen plakt het prefix terug aan de stam:\n\n  Hoofdzin:  Hij staat vroeg op.\n  Bijzin:    ...omdat hij vroeg opstaat.  (niet: ...op staat)\n\n  Hoofdzin:  Ze neemt alles mee.\n  Bijzin:    ...dat ze alles meeneemt.   (niet: ...mee neemt)\n\n  Hoofdzin:  We spraken gisteren af.\n  Bijzin:    ...toen we gisteren afspraken.\n\nRegel: bijzin = prefix + stam aan elkaar, aan het einde van de bijzin.",
      translations: {
        tr: "Yan cümlede (omdat, dat, als, terwijl, toen... sonrasında) fiil sona gider\nve önek gövdeye yeniden yapışır:\n\n  Ana cümle: Hij staat vroeg op.\n  Yan cümle: ...omdat hij vroeg opstaat.  (op staat değil!)\n\n  Ana cümle: Ze neemt alles mee.\n  Yan cümle: ...dat ze alles meeneemt.   (mee neemt değil!)\n\n  Ana cümle: We spraken gisteren af.\n  Yan cümle: ...toen we gisteren afspraken.\n\nKural: yan cümlede önek + gövde birleşik, yan cümlenin sonunda.",
      },
    },
  ],
  examples: [
    { infinitief: "afspreken", stam: "spreek", imperf_s: "sprak af", imperf_p: "spraken af", perfectum: "heeft afgesproken" },
    { infinitief: "opstaan", stam: "sta op", imperf_s: "stond op", imperf_p: "stonden op", perfectum: "is opgestaan" },
    { infinitief: "meenemen", stam: "neem mee", imperf_s: "nam mee", imperf_p: "namen mee", perfectum: "heeft meegenomen" },
    { infinitief: "aankomen", stam: "kom aan", imperf_s: "kwam aan", imperf_p: "kwamen aan", perfectum: "is aangekomen" },
  ],
  tip: "Prefix-check: op, af, mee, aan, uit, in, neer, terug, samen → scheidbaar. be-, ver-, her-, ont- → niet scheidbaar.",
  tipTranslations: {
    tr: "Önek kontrolü: op, af, mee, aan, uit, in, neer, terug, samen → ayrılabilir. be-, ver-, her-, ont- → ayrılamaz.",
  },
};

// ─── 6. Bijzinnen ─────────────────────────────────────────────────────────────

export const GRAMMAR_BIJZINNEN: GrammarRule = {
  title: "Bijzinnen (woordvolgorde)",
  explanation:
    "In een bijzin staat het werkwoord aan het einde. Dit is een van de bekendste struikelblokken voor leerders — maar de regel is eigenlijk heel simpel.",
  explanationTranslations: {
    tr: "Bir yan cümlede fiil sona gider. Bu, öğrenenler için en bilinen takılma noktalarından biridir — ama kural aslında çok basittir.",
  },
  steps: [
    {
      label: "Stap 1 — Hoofdzin vs. bijzin",
      text: `Een hoofdzin staat op zichzelf. Een bijzin begint met een voegwoord en kan niet alleen staan.

  Hoofdzin:  Ik werk morgen.           (staat op zichzelf ✓)
  Bijzin:    ...omdat ik morgen werk.  (alleen onvolledig ✗)

Veelgebruikte voegwoorden voor bijzinnen:
  omdat · dat · als · toen · terwijl · hoewel · zodat
  nadat · voordat · totdat · wanneer · of · want*

  *want is een nevenschikkend voegwoord → geen woordvolgorde verandering!
   Ik blijf thuis, want ik ben ziek.   (normale volgorde na want)`,
      translations: {
        tr: `Ana cümle kendi başına durur. Yan cümle bir bağlaçla başlar ve tek başına tamamlanmış değildir.

  Ana cümle:  Ik werk morgen.           (tek başına tam ✓)
  Yan cümle:  ...omdat ik morgen werk.  (tek başına eksik ✗)

Yan cümleler için sık kullanılan bağlaçlar:
  omdat · dat · als · toen · terwijl · hoewel · zodat
  nadat · voordat · totdat · wanneer · of · want*

  *want nevenschikkend (sıralayan) bağlaçtır → kelime sırası değişmez!
   Ik blijf thuis, want ik ben ziek.   (want'tan sonra normal sıra)`,
      },
    },
    {
      label: "Stap 2 — Werkwoord naar het einde",
      text: `In een bijzin gaat het persoonsvorm (en alle werkwoorden) naar het EINDE:

  Hoofdzin:   Hij  werkt   hard.
  Bijzin:     ...dat hij hard  werkt.
                              ↑ persoonsvorm achteraan

  Hoofdzin:   Ze   gaat    morgen naar Amsterdam.
  Bijzin:     ...omdat ze morgen naar Amsterdam gaat.

  Hoofdzin:   Wij  hebben  gisteren gevoetbald.
  Bijzin:     ...dat wij gisteren gevoetbald hebben.
                                    ↑ deelwoord, dan hulpww.

Let op volgorde bij perfectum in bijzin:
  Hoofdzin: HULPWW. + DEELWOORD   →   Ze heeft gewerkt.
  Bijzin:   DEELWOORD + HULPWW.   →   ...dat ze gewerkt heeft.`,
      translations: {
        tr: `Yan cümlede şahıs fiili (ve tüm fiiller) SONA gider:

  Ana cümle:   Hij  werkt   hard.
  Yan cümle:   ...dat hij hard  werkt.
                               ↑ şahıs fiili sonda

  Ana cümle:   Ze   gaat    morgen naar Amsterdam.
  Yan cümle:   ...omdat ze morgen naar Amsterdam gaat.

  Ana cümle:   Wij  hebben  gisteren gevoetbald.
  Yan cümle:   ...dat wij gisteren gevoetbald hebben.
                                     ↑ önce ortaç, sonra yardımcı fiil

Dikkat — perfectum'un yan cümledeki sırası:
  Ana cümle: YARDIMCI F. + ORTAÇ     →   Ze heeft gewerkt.
  Yan cümle: ORTAÇ + YARDIMCI F.     →   ...dat ze gewerkt heeft.`,
      },
    },
    {
      label: "Stap 3 — Bijzin met modaal werkwoord",
      text: `Bij twee werkwoorden (modaal + infinitief) gaan ze samen naar het einde:

  Hoofdzin:   Hij  moet    morgen werken.
  Bijzin:     ...omdat hij morgen moet werken.
                               ↑ modaal + infinitief samen achteraan

  Hoofdzin:   Ze  kan    goed zwemmen.
  Bijzin:     ...dat ze goed kan zwemmen.

  Hoofdzin:   Ik  wil    dit boek lezen.
  Bijzin:     ...hoewel ik dit boek wil lezen.

Bijzin met modaal in imperfectum:
  ...omdat hij gisteren moest werken.
  ...dat ze vroeger goed kon zwemmen.`,
      translations: {
        tr: `İki fiil olduğunda (modal + mastar) ikisi birlikte sona gider:

  Ana cümle:   Hij  moet    morgen werken.
  Yan cümle:   ...omdat hij morgen moet werken.
                               ↑ modal + mastar birlikte sonda

  Ana cümle:   Ze  kan    goed zwemmen.
  Yan cümle:   ...dat ze goed kan zwemmen.

  Ana cümle:   Ik  wil    dit boek lezen.
  Yan cümle:   ...hoewel ik dit boek wil lezen.

Imperfectum'da modal içeren yan cümle:
  ...omdat hij gisteren moest werken.
  ...dat ze vroeger goed kon zwemmen.`,
      },
    },
    {
      label: "Stap 4 — Bijzin voorop (inversie in hoofdzin)",
      text: `Als de bijzin VOORAAN staat, begint de hoofdzin met het werkwoord (inversie):

  Normaal:    Ik blijf thuis, omdat ik ziek ben.
  Bijzin voor: Omdat ik ziek ben, blijf ik thuis.
                                   ↑ werkwoord direct na de komma!

  Normaal:    Hij slaagt, als hij hard werkt.
  Bijzin voor: Als hij hard werkt, slaagt hij.

  Normaal:    Ze was blij, toen ze het hoorde.
  Bijzin voor: Toen ze het hoorde, was ze blij.

Stelregel: bijzin voor komma = dan werkwoord direct na de komma.`,
      translations: {
        tr: `Yan cümle BAŞTA yer alıyorsa, ana cümle fiille başlar (ters çevrim):

  Normal:       Ik blijf thuis, omdat ik ziek ben.
  Yan cümle önde: Omdat ik ziek ben, blijf ik thuis.
                                       ↑ virgülden hemen sonra fiil!

  Normal:       Hij slaagt, als hij hard werkt.
  Yan cümle önde: Als hij hard werkt, slaagt hij.

  Normal:       Ze was blij, toen ze het hoorde.
  Yan cümle önde: Toen ze het hoorde, was ze blij.

Pratik kural: virgülden önce yan cümle = virgülden hemen sonra fiil.`,
      },
    },
  ],
  exampleHeaders: { col1: "VOEGWOORD", col2: "BETEKENIS", col3: "BIJZINVOLGORDE", col4: "VOORBEELD", col5: "TYPE" },
  examples: [
    { infinitief: "omdat", stam: "çünkü", imperf_s: "OW + WW einde", imperf_p: "...omdat hij werkt.", perfectum: "onderschikkend" },
    { infinitief: "dat", stam: "dat", imperf_s: "OW + WW einde", imperf_p: "...dat ze komt.", perfectum: "onderschikkend" },
    { infinitief: "als", stam: "eğer", imperf_s: "OW + WW einde", imperf_p: "...als ik kan.", perfectum: "onderschikkend" },
    { infinitief: "toen", stam: "o zaman", imperf_s: "OW + WW einde", imperf_p: "...toen hij belde.", perfectum: "onderschikkend" },
    { infinitief: "terwijl", stam: "iken", imperf_s: "OW + WW einde", imperf_p: "...terwijl ze werkt.", perfectum: "onderschikkend" },
    { infinitief: "want", stam: "zira", imperf_s: "normale volgorde!", imperf_p: "...want hij is ziek.", perfectum: "nevenschikkend" },
  ],
  tip: "Ezberle: omdat, dat, als, toen, terwijl, hoewel, zodat → bijzinsvolgorde. Want → normale volgorde. Dit is de meest gemaakte fout!",
  tipTranslations: {
    tr: `Ezberle: omdat, dat, als, toen, terwijl, hoewel, zodat → yan cümle sırası. Want → normal sıra. Bu en sık yapılan hatadır!`,
  },
};

// ─── Pedagogische volgorde ────────────────────────────────────────────────────

export const GRAMMAR_STEPS: GrammarRule[] = [
  GRAMMAR_TEGENWOORDIGE_TIJD,
  GRAMMAR_PERFECTUM,
  GRAMMAR_IMPERFECTUM,
  GRAMMAR_MODAAL,
  GRAMMAR_SCHEIDBAAR,
  GRAMMAR_BIJZINNEN,
];

// ─── Frequentielijsten voor oefensessies ──────────────────────────────────────

export const FREQ_ORDER_REGELMATIG = [
  "werken", "wonen", "maken", "leven", "praten", "horen", "zoeken", "kennen",
  "sturen", "vragen", "wachten", "betalen", "helpen", "leren", "spelen",
  "kopen", "reizen", "rijden", "koken", "bellen",
];

export const FREQ_ORDER_ONREGELMATIG = [
  "zijn", "hebben", "gaan", "komen", "zien", "doen", "weten", "kunnen",
  "mogen", "moeten", "willen", "zullen", "staan", "liggen", "zitten",
  "lopen", "rijden", "schrijven", "lezen", "spreken",
];
