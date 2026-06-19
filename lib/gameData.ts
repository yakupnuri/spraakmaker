import type { Sentence } from "./types";

export interface VerhaalLes {
  lesId: string;
  titel: string;
  zinnen: Sentence[];
}

let cachedVerhaalLessen: VerhaalLes[] | null = null;

export async function loadVerhaalLessen(): Promise<VerhaalLes[]> {
  if (cachedVerhaalLessen) return cachedVerhaalLessen;
  try {
    const res = await fetch("/data/verhaal-zinnen.json");
    if (!res.ok) throw new Error("Failed to fetch verhaal-zinnen");
    cachedVerhaalLessen = await res.json();
    return cachedVerhaalLessen || [];
  } catch (e) {
    console.error("Error loading verhaal-zinnen.json", e);
    return [];
  }
}

export async function loadVerhaalZinnen(lesIds: string[]): Promise<Sentence[]> {
  const lessen = await loadVerhaalLessen();
  const filtered = lessen.filter((l) => lesIds.includes(l.lesId));
  const zinnen = filtered.flatMap((l) => l.zinnen || []);
  return zinnen.map(cleanSentence);
}

function cleanSentence(s: Sentence): Sentence {
  if (!s) return s;
  let nl = typeof s.nl === "string" ? s.nl : "";
  let tr = typeof s.tr === "string" ? s.tr : "";

  // Clean prefix like "7. " or "* " or "- "
  nl = nl.replace(/^\s*(?:\d+\.|\*|-)\s*/, "");
  tr = tr.replace(/^\s*(?:\d+\.|\*|-)\s*/, "");

  // Replace Turkish "İk" -> "Ik"
  nl = nl.replace(/İk/g, "Ik");

  return {
    ...s,
    nl: nl.trim(),
    tr: tr.trim(),
  };
}

export async function loadSentences(lesId?: string | null): Promise<Sentence[]> {
  let sentences: Sentence[] = [];
  if (lesId) {
    try {
      const res = await fetch("/data/zinnenbank.json");
      const data = await res.json();
      const les = data.find((l: { id: string; sentences: Sentence[] }) => l.id === lesId);
      if (les) sentences = les.sentences;
    } catch {}
  } else {
    // Default: mix of tc1 + tc2
    try {
      const [r1, r2] = await Promise.all([
        fetch("/data/sentences-tc1.json").then((r) => r.json()),
        fetch("/data/sentences-tc2.json").then((r) => r.json()),
      ]);
      sentences = [...r1, ...r2];
    } catch {
      sentences = [];
    }
  }
  return sentences.map(cleanSentence);
}

export async function loadSentencesFromSources(sources: string[], unlockedVerhaalLesIds?: string[]): Promise<Sentence[]> {
  if (!sources || sources.length === 0) {
    return loadSentences();
  }

  const promises = sources.map(async (src) => {
    try {
      if (src === "tc1") {
        const res = await fetch("/data/sentences-tc1.json");
        return await res.json();
      }
      if (src === "tc2") {
        const res = await fetch("/data/sentences-tc2.json");
        return await res.json();
      }
      if (src === "az") {
        const res = await fetch("/data/sentences-az.json");
        return await res.json();
      }
      if (src === "delftse") {
        const res = await fetch("/data/sentences-delftse.json");
        return await res.json();
      }
      if (src === "verhalen") {
        if (!unlockedVerhaalLesIds || unlockedVerhaalLesIds.length === 0) {
          return [];
        }
        return await loadVerhaalZinnen(unlockedVerhaalLesIds);
      }
      if (src === "lessen") {
        const res = await fetch("/data/zinnenbank.json");
        const data = await res.json();
        return data.flatMap((l: { sentences: Sentence[] }) => l.sentences || []);
      }
    } catch (e) {
      console.error("Error loading source:", src, e);
    }
    return [];
  });

  const results = await Promise.all(promises);
  const flattened = results.flat();
  
  // Clean empty or malformed sentences
  return flattened
    .filter((s) => s && typeof s.nl === "string" && typeof s.tr === "string")
    .map(cleanSentence);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
