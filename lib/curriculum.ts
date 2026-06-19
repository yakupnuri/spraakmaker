import type { Etappe, Sentence, Progress, EtappeProgress } from "./types";
import { 
  GRAMMAR_TEGENWOORDIGE_TIJD,
  GRAMMAR_PERFECTUM,
  GRAMMAR_IMPERFECTUM,
  GRAMMAR_MODAAL,
  GRAMMAR_SCHEIDBAAR,
  GRAMMAR_BIJZINNEN
} from "./grammarData";

let cachedEtappes: Etappe[] | null = null;

export async function loadEtappes(): Promise<Etappe[]> {
  if (cachedEtappes) return cachedEtappes;
  try {
    const res = await fetch("/data/etappes.json?t=" + Date.now(), {
      cache: "no-store"
    });
    if (!res.ok) throw new Error("Failed to fetch etappes");
    cachedEtappes = await res.json();
    return cachedEtappes || [];
  } catch (e) {
    console.error("Error loading etappes.json", e);
    return [];
  }
}

export async function loadEtappe(id: string): Promise<Etappe | null> {
  const etappes = await loadEtappes();
  return etappes.find((e) => e.id === id) || null;
}

export async function loadGrammarLessonData(topic: string, level: string, zinnenbankLesId?: string): Promise<{ rule: any; sentences: Sentence[] }> {
  // 1. Gramer Kuralını Seç
  let rule: any = null;
  switch (topic) {
    case "tegenwoordige-tijd":
      rule = GRAMMAR_TEGENWOORDIGE_TIJD;
      break;
    case "perfectum":
      rule = GRAMMAR_PERFECTUM;
      break;
    case "imperfectum":
      rule = GRAMMAR_IMPERFECTUM;
      break;
    case "modaal":
      rule = GRAMMAR_MODAAL;
      break;
    case "scheidbaar":
      rule = GRAMMAR_SCHEIDBAAR;
      break;
    case "bijzinnen":
      rule = GRAMMAR_BIJZINNEN;
      break;
    default:
      rule = GRAMMAR_TEGENWOORDIGE_TIJD;
  }

  // 2. Seviyedeki cümleleri çek ve filtrele
  let sentences: Sentence[] = [];
  try {
    if (zinnenbankLesId) {
      // Yeni yöntem: Bölünmüş zinnenbank dosyasından ders ID'sine göre çek
      const res = await fetch(`/data/zinnenbank-${level.toLowerCase()}.json`);
      if (res.ok) {
        const levelLessons: any[] = await res.json();
        const matchedLesson = levelLessons.find(l => l.id === zinnenbankLesId);
        if (matchedLesson && matchedLesson.sentences) {
          sentences = matchedLesson.sentences;
        }
      }
    } else {
      // Eski yöntem (Fallback)
      const res = await fetch(`/data/cefr/zinnen-${level.toLowerCase()}.json`);
      if (res.ok) {
        const rawSentences: any[] = await res.json();
        
        // Filtreleme mantığı
        if (topic === "modaal") {
          const modalKeywords = ["kan", "kun", "kunt", "kunnen", "moet", "moeten", "wil", "wilt", "willen", "mag", "mogen", "zal", "zullen", "hoef", "hoeft", "hoeven"];
          sentences = rawSentences.filter(s => {
            if (!s || !s.nl) return false;
            const words = s.nl.toLowerCase().split(/\s+/).map((w: string) => w.replace(/[.,!?;:]/g, ""));
            return words.some((w: string) => modalKeywords.includes(w));
          });
        } else if (topic === "tegenwoordige-tijd") {
          const pastKeywords = ["was", "waren", "had", "hadden", "ging", "gingen", "kwam", "kwamen", "zag", "zagen", "deed", "deden", "stond", "stonden", "nam", "namen", "geweest", "gehad", "gegaan", "gekomen", "gezien", "gedaan"];
          sentences = rawSentences.filter(s => {
            if (!s || !s.nl) return false;
            const words = s.nl.toLowerCase().split(/\s+/).map((w: string) => w.replace(/[.,!?;:]/g, ""));
            const isPast = words.some((w: string) => pastKeywords.includes(w));
            const hasGe = words.some((w: string) => w.startsWith("ge") && w.length > 4 && !w.startsWith("geld") && !w.startsWith("geen") && !w.startsWith("gezond"));
            return !isPast && !hasGe;
          });
        } else {
          sentences = rawSentences;
        }
      }
    }
  } catch (e) {
    console.error("Error loading sentences for grammar topic", e);
  }

  // Karıştırıp ilk 15 cümleyi seçelim.
  sentences = shuffle(sentences).slice(0, 15);

  return { rule, sentences };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function checkLesUnlocked(
  etappeId: string,
  lesNr: number,
  progress: Progress,
  etappes: Etappe[]
): boolean {
  const curr = progress.curriculum;
  if (!curr) {
    return etappeId === "etappe-a1-01" && lesNr === 1;
  }

  const targetEtappe = etappes.find(e => e.id === etappeId);
  const activeEtappeId = curr.activeEtappeId || "etappe-a1-01";
  const activeEtappe = etappes.find(e => e.id === activeEtappeId);
  if (targetEtappe && activeEtappe) {
    if (targetEtappe.volgorde < activeEtappe.volgorde) return true;
    if (targetEtappe.volgorde > activeEtappe.volgorde) return false;
  }

  const etappeProg = curr.etappes[etappeId];
  if (!etappeProg) {
    return activeEtappeId === etappeId && lesNr === 1;
  }

  if (lesNr === 1) return true;

  const thisEtappeObj = etappes.find(e => e.id === etappeId);
  if (!thisEtappeObj) return false;
  
  const prevLes = thisEtappeObj.lessen.find(l => l.nr === lesNr - 1);
  if (!prevLes) return false;

  const prevLesId = prevLes.verhaalId || `${etappeId}-${prevLes.nr}`;
  return etappeProg.lessenDone.includes(prevLesId);
}
