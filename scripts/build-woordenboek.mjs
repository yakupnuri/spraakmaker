// Tüm kelime kaynaklarını tek bir nl→tr sözlüğünde birleştirir.
// Kaynaklar: ders woordenschat'ları (lessen-verhalen.json) + public/data/words-*.json
// Çıktı: public/data/woordenboek.json
// Çalıştırma: node scripts/build-woordenboek.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "public", "data");

const dict = {};
let added = 0;

function addEntry(rawKey, tr) {
  if (!rawKey || !tr) return;
  // "wonen (ik woon, jij woont)" → "wonen"; "(ver)zuipen" → "zuipen"
  const cleaned = String(rawKey).replace(/\([^)]*\)/g, " ");
  for (let part of cleaned.split(/[,/]/)) {
    part = part
      .trim()
      .toLowerCase()
      .replace(/^(de|het|een)\s+/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!part) continue;
    if (!(part in dict)) {
      dict[part] = String(tr).trim();
      added++;
    }
  }
}

// 1) Ders sözlükleri (en bağlamsal kaynak — önce gelir, öncelik kazanır)
const verhalen = JSON.parse(fs.readFileSync(path.join(dataDir, "lessen-verhalen.json"), "utf8"));
for (const les of verhalen) {
  for (const [k, v] of Object.entries(les.woordenschat ?? {})) addEntry(k, v);
}

// 2) Kelime havuzları — temel listeler önce (çevirileri daha sade)
const priority = ["words-tc12.json", "words-code12.json", "words-nlen.json"];
const allWordFiles = fs
  .readdirSync(dataDir)
  .filter((f) => f.startsWith("words-") && f.endsWith(".json"));
const ordered = [...priority.filter((f) => allWordFiles.includes(f)), ...allWordFiles.filter((f) => !priority.includes(f)).sort()];

for (const f of ordered) {
  let list;
  try {
    list = JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8"));
  } catch {
    continue;
  }
  if (!Array.isArray(list)) continue;
  for (const item of list) {
    if (item && item.nl && item.tr) addEntry(item.nl, item.tr);
  }
}

// 3) Fiil çekim dosyaları: infinitief + imperfectum + perfectum biçimleri de aransın
const verbFiles = fs.readdirSync(dataDir).filter((f) => f.startsWith("verbs-") && f.endsWith(".json"));
for (const f of verbFiles) {
  let list;
  try {
    list = JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8"));
  } catch {
    continue;
  }
  if (!Array.isArray(list)) continue;
  for (const v of list) {
    if (!v || !v.tr) continue;
    addEntry(v.infinitief, v.tr);
    addEntry(v.imperfectum_s, v.tr);
    addEntry(v.imperfectum_p, v.tr);
    if (v.perfectum) {
      // "heeft/is gewoond" → "gewoond"
      const last = String(v.perfectum).trim().split(/\s+/).pop();
      addEntry(last, v.tr);
    }
  }
}

const outPath = path.join(dataDir, "woordenboek.json");
fs.writeFileSync(outPath, JSON.stringify(dict), "utf8");
console.log(`woordenboek.json yazıldı: ${Object.keys(dict).length} girdi (${Math.round(fs.statSync(outPath).size / 1024)} KB), kaynak dosya: ${ordered.length + 1}`);
