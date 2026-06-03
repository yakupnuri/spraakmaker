import type { Sentence } from "./types";

export async function loadSentences(lesId?: string | null): Promise<Sentence[]> {
  if (lesId) {
    try {
      const res = await fetch("/data/lessen.json");
      const data = await res.json();
      const les = data.find((l: { id: string; sentences: Sentence[] }) => l.id === lesId);
      if (les) return les.sentences;
    } catch {}
  }

  // Default: mix of tc1 + tc2
  try {
    const [r1, r2] = await Promise.all([
      fetch("/data/sentences-tc1.json").then((r) => r.json()),
      fetch("/data/sentences-tc2.json").then((r) => r.json()),
    ]);
    return [...r1, ...r2];
  } catch {
    return [];
  }
}

export async function loadSentencesFromSources(sources: string[]): Promise<Sentence[]> {
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
      if (src === "lessen") {
        const res = await fetch("/data/lessen.json");
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
  return flattened.filter((s) => s && typeof s.nl === "string" && typeof s.tr === "string");
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
