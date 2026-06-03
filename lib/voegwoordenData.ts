export interface VoegwoordItem {
  nl: string;
  tr: string;
  example_nl: string;
  example_tr: string;
  note?: string;
}

export interface VoegwoordSection {
  id: string;
  title: string;
  subtitle: string;
  color: "blue" | "red" | "yellow" | "black";
  explanation: string;
  structureNote?: string;
  items: VoegwoordItem[];
}

export const VOEGWOORDEN_SECTIONS: VoegwoordSection[] = [
  {
    id: "nevenschikkend",
    title: "Nevenschikkende voegwoorden",
    subtitle: "en, maar, of, want, dus, toch, nog",
    color: "blue",
    explanation:
      "Deze voegwoorden verbinden twee gelijkwaardige zinnen. Na het voegwoord staat de NORMALE woordvolgorde: subject + werkwoord.",
    structureNote: "Zin 1, VOEGWOORD zin 2 (normale volgorde)",
    items: [
      { nl: "en", tr: "ve", example_nl: "Ik werk hard en ik ben moe.", example_tr: "Çok çalışıyorum ve yorgunum." },
      { nl: "maar", tr: "ama / maar", example_nl: "Ik wil gaan, maar ik heb geen tijd.", example_tr: "Gitmek istiyorum ama zamanım yok." },
      { nl: "of", tr: "veya / ya da", example_nl: "Kom je morgen of overmorgen?", example_tr: "Yarın mı geliyorsun yoksa öbür gün mü?" },
      { nl: "want", tr: "çünkü (neden=hoofdzin)", example_nl: "Ik blijf thuis, want ik ben ziek.", example_tr: "Evde kalıyorum, çünkü hastayım.", note: "want → hoofdzin, normale volgorde!" },
      { nl: "dus", tr: "bu yüzden / yani", example_nl: "Het regent, dus ik neem een paraplu.", example_tr: "Yağmur yağıyor, bu yüzden şemsiye alıyorum." },
      { nl: "toch", tr: "yine de / toch", example_nl: "Het is koud, toch gaan we wandelen.", example_tr: "Soğuk, yine de yürüyüşe gidiyoruz." },
      { nl: "noch", tr: "ne...ne", example_nl: "Hij eet noch drinkt iets.", example_tr: "Ne yiyor ne içiyor." },
    ],
  },
  {
    id: "onderschikkend",
    title: "Onderschikkende voegwoorden",
    subtitle: "omdat, dat, als, toen, terwijl, hoewel, zodat…",
    color: "red",
    explanation:
      "Deze voegwoorden leiden een bijzin in. In de bijzin staat het werkwoord ACHTERAAN. Dit is het grootste verschil met nevenschikkende voegwoorden!",
    structureNote: "Hoofdzin + VOEGWOORD + ... + werkwoord(en) aan het einde",
    items: [
      { nl: "omdat", tr: "çünkü (neden=bijzin)", example_nl: "Ik blijf thuis omdat ik ziek ben.", example_tr: "Hastayım diye evde kalıyorum.", note: "omdat → bijzin, werkwoord achteraan!" },
      { nl: "dat", tr: "ki / -dığını", example_nl: "Ik denk dat hij morgen komt.", example_tr: "Yarın geleceğini düşünüyorum." },
      { nl: "als", tr: "eğer / -se/-sa", example_nl: "Als het regent, blijf ik thuis.", example_tr: "Yağmur yağarsa evde kalırım." },
      { nl: "toen", tr: "o zaman / -ığında (geçmiş)", example_nl: "Toen ik klein was, woonde ik in Amsterdam.", example_tr: "Küçükken Amsterdam'da yaşıyordum." },
      { nl: "terwijl", tr: "iken / -rken", example_nl: "Ze kookt terwijl hij de tafel dekt.", example_tr: "O yemek yaparken, o masayı hazırlıyor." },
      { nl: "hoewel", tr: "her ne kadar / -se de", example_nl: "Hoewel het koud is, gaan we zwemmen.", example_tr: "Soğuk olsa da yüzmeye gidiyoruz." },
      { nl: "zodat", tr: "böylece / -sın diye", example_nl: "Hij werkt hard zodat hij snel klaar is.", example_tr: "Hızla bitirmek için çok çalışıyor." },
      { nl: "nadat", tr: "-dikten sonra", example_nl: "Nadat hij had gegeten, ging hij slapen.", example_tr: "Yedikten sonra uyudu." },
      { nl: "voordat", tr: "-meden önce", example_nl: "Bel me voordat je komt.", example_tr: "Gelmeden önce beni ara." },
      { nl: "totdat", tr: "-ana kadar", example_nl: "Wacht hier totdat ik terug ben.", example_tr: "Ben dönene kadar burada bekle." },
      { nl: "of", tr: "… -ip -mediğini (indirect)", example_nl: "Ik weet niet of hij komt.", example_tr: "Gelip gelmeyeceğini bilmiyorum.", note: "Indirect vraag: of = whether" },
    ],
  },
  {
    id: "voorzetsels",
    title: "Vaste voorzetsels (preposities)",
    subtitle: "op, aan, in, met, voor, van, bij, naar, uit, over",
    color: "yellow",
    explanation:
      "Hollandaca'da fiiller ve bijvoeglijke naamwoorden belirli voorzetsels (ön ekler) ile kullanılır. Bunları çiftler halinde öğrenmek gerekir: houden VAN, wachten OP, praten OVER...",
    structureNote: "werkwoord/bijvoeglijk + VOORZETSEL + object",
    items: [
      { nl: "wachten op", tr: "beklemek", example_nl: "Ik wacht op de bus.", example_tr: "Otobüsü bekliyorum." },
      { nl: "houden van", tr: "sevmek", example_nl: "Ik houd van muziek.", example_tr: "Müziği seviyorum." },
      { nl: "zorgen voor", tr: "ilgilenmek / bakmak", example_nl: "Ze zorgt voor haar moeder.", example_tr: "Annesine bakıyor." },
      { nl: "denken aan", tr: "düşünmek (birisini)", example_nl: "Ik denk aan jou.", example_tr: "Seni düşünüyorum." },
      { nl: "denken over", tr: "düşünmek (bir konuyu)", example_nl: "Wat denk je over dit plan?", example_tr: "Bu plan hakkında ne düşünüyorsun?" },
      { nl: "praten over", tr: "hakkında konuşmak", example_nl: "We praten over het probleem.", example_tr: "Problem hakkında konuşuyoruz." },
      { nl: "luisteren naar", tr: "dinlemek", example_nl: "Ik luister naar muziek.", example_tr: "Müzik dinliyorum." },
      { nl: "kijken naar", tr: "bakmak / izlemek", example_nl: "Ze kijkt naar de tv.", example_tr: "Televizyon izliyor." },
      { nl: "helpen met", tr: "yardım etmek", example_nl: "Kun jij me helpen met dit?", example_tr: "Bana bunun için yardım edebilir misin?" },
      { nl: "beginnen met", tr: "başlamak", example_nl: "Wanneer begin je met werken?", example_tr: "Çalışmaya ne zaman başlıyorsun?" },
      { nl: "stoppen met", tr: "bırakmak / durmak", example_nl: "Hij stopt met roken.", example_tr: "Sigarayı bırakıyor." },
      { nl: "blij zijn met", tr: "mutlu olmak", example_nl: "Ik ben blij met het resultaat.", example_tr: "Sonuçtan memnunum." },
      { nl: "bang zijn voor", tr: "korkmak", example_nl: "Ze is bang voor honden.", example_tr: "Köpeklerden korkuyor." },
      { nl: "goed zijn in", tr: "iyi olmak (bir şeyde)", example_nl: "Hij is goed in wiskunde.", example_tr: "Matematikte iyidir." },
      { nl: "geïnteresseerd in", tr: "ilgili olmak", example_nl: "Ik ben geïnteresseerd in kunst.", example_tr: "Sanata ilgi duyuyorum." },
      { nl: "op zoek naar", tr: "aramak / arayışında olmak", example_nl: "Ik ben op zoek naar een baan.", example_tr: "İş arıyorum." },
      { nl: "aan het + infinitief", tr: "şu an yapıyor olmak", example_nl: "Ik ben aan het werken.", example_tr: "Çalışıyorum (şu an).", note: "Aanstaande actie: zijn + aan het + INF" },
    ],
  },
  {
    id: "woordvolgorde",
    title: "Woordvolgorde in de bijzin",
    subtitle: "want vs. omdat — het grote verschil",
    color: "black",
    explanation:
      "Dit is het meest gemaakte fout! 'want' en 'omdat' betekenen allebei 'çünkü', maar hebben een verschillende woordvolgorde.",
    structureNote: "want → HOOFDZIN | omdat → BIJZIN (werkwoord achteraan)",
    items: [
      {
        nl: "want (hoofdzin)",
        tr: "çünkü → normale volgorde",
        example_nl: "Ik blijf thuis, want ik ben ziek.",
        example_tr: "Evde kalıyorum, çünkü [ben ziek ben değil!] ik ben ziek.",
        note: "want: subject + werkwoord (normale volgorde)",
      },
      {
        nl: "omdat (bijzin)",
        tr: "çünkü → werkwoord achteraan",
        example_nl: "Ik blijf thuis omdat ik ziek ben.",
        example_tr: "Hastayım diye evde kalıyorum. (ben ziek BEN)",
        note: "omdat: ... ziek BEN (werkwoord aan het einde!)",
      },
      {
        nl: "dus (gevolg, hoofdzin)",
        tr: "bu yüzden → normale volgorde",
        example_nl: "Ik ben ziek, dus ik blijf thuis.",
        example_tr: "Hastayım, bu yüzden evde kalıyorum.",
      },
      {
        nl: "hoewel vs. maar",
        tr: "her ne kadar vs. ama",
        example_nl: "Hoewel het regent, gaan we. / Het regent, maar we gaan.",
        example_tr: "Yağmur yağsa da gidiyoruz. / Yağmur yağıyor ama gidiyoruz.",
        note: "hoewel → bijzin (achteraan). maar → hoofdzin (normaal)",
      },
      {
        nl: "als (conditie) vs. toen (verleden)",
        tr: "eğer (genel) vs. o zaman (geçmiş)",
        example_nl: "Als ik tijd heb, bel ik. / Toen ik jong was, speelde ik piano.",
        example_tr: "Zamanım olursa ararım. / Genç iken piyano çalardım.",
        note: "als = genel/toekomst. toen = eenmalig verleden moment",
      },
    ],
  },
];
