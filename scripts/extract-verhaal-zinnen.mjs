// extract-verhaal-zinnen.mjs
// Extracts 25 sentences per lesson from lessen-verhalen.json
// Zero dependencies — only fs and path.

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const INPUT  = join(ROOT, 'public', 'data', 'lessen-verhalen.json');
const OUTPUT = join(ROOT, 'public', 'data', 'verhaal-zinnen.json');

const TARGET = 25;

// ── helpers ──────────────────────────────────────────────────────────────────

function normalize(text) {
  return text
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function splitToSentences(text) {
  // Split on . ! ? followed by whitespace (or end of string)
  const raw = text.split(/(?<=[.!?])\s+/);
  const sentences = [];
  for (const s of raw) {
    // Further split if a sentence still contains ?/!/. in the middle
    // (handles "— Hallo! Ik ben Ali." style)
    const sub = s.split(/(?<=[.!?])(?=\s*[A-Z—«"])/);
    for (let part of sub) {
      part = part.trim();
      // Strip surrounding quotation marks (all variants)
      part = part.replace(/^[""“”‘’«»']+/, '').replace(/[""“”‘’«»']+$/, '').trim();
      if (part) sentences.push(part);
    }
  }
  return sentences;
}

function wordCount(s) {
  return s.trim().split(/\s+/).length;
}

function isAllCaps(s) {
  const letters = s.replace(/[^a-zA-Z]/g, '');
  return letters.length > 0 && letters === letters.toUpperCase();
}

function isEligible(s) {
  const wc = wordCount(s);
  if (wc < 3 || wc > 12) return false;
  if (isAllCaps(s)) return false;
  return true;
}

// Deterministic evenly-spaced sampling from an array
function evenSample(arr, n) {
  if (n >= arr.length) return arr.slice();
  const result = [];
  // Pick indices: 0, step, 2*step, ... where step = (len-1)/(n-1)
  // For n=1, just pick index 0.
  if (n === 1) return [arr[0]];
  const step = (arr.length - 1) / (n - 1);
  for (let i = 0; i < n; i++) {
    const idx = Math.round(i * step);
    result.push(arr[idx]);
  }
  return result;
}

// ── main ─────────────────────────────────────────────────────────────────────

const lessen = JSON.parse(readFileSync(INPUT, 'utf8'));

const output = [];

for (const les of lessen) {
  const { lesId, verhaalTitel, verhaal } = les;

  const normalized = normalize(verhaal);
  const allSentences = splitToSentences(normalized);

  // Filter eligible sentences, deduplicate (case-insensitive)
  const seen = new Set();
  const eligible = [];
  for (const s of allSentences) {
    const key = s.toLowerCase();
    if (!seen.has(key) && isEligible(s)) {
      seen.add(key);
      eligible.push(s);
    }
  }

  // Bucket by word count
  const short  = eligible.filter(s => wordCount(s) <= 5);
  const medium = eligible.filter(s => wordCount(s) >= 6 && wordCount(s) <= 8);
  const long   = eligible.filter(s => wordCount(s) >= 9);

  // Target counts per bucket (9/8/8 = 25); adjust if a bucket is undersized
  const targets = [9, 8, 8]; // short, medium, long
  const buckets = [short, medium, long];

  // Compute available counts
  const available = buckets.map(b => b.length);
  let assigned = targets.map((t, i) => Math.min(t, available[i]));
  let total = assigned.reduce((a, b) => a + b, 0);

  // Redistribute shortage from smaller buckets to others
  // We iterate twice to fill gaps
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < 3; i++) {
      if (total >= TARGET) break;
      const canAdd = available[i] - assigned[i];
      if (canAdd > 0) {
        const need = Math.min(canAdd, TARGET - total);
        assigned[i] += need;
        total += need;
      }
    }
    if (total >= TARGET) break;
  }

  // Sample from each bucket deterministically
  const shortSelected  = evenSample(short,  assigned[0]);
  const mediumSelected = evenSample(medium, assigned[1]);
  const longSelected   = evenSample(long,   assigned[2]);

  // Build a set for quick lookup, preserving story order
  const selectedSet = new Set([...shortSelected, ...mediumSelected, ...longSelected]);

  // Restore original story order
  const zinnen = eligible
    .filter(s => selectedSet.has(s))
    .map(nl => ({ nl, tr: '' }));

  output.push({ lesId, titel: verhaalTitel, zinnen });

  console.log(`${lesId}: ${zinnen.length} sentences (short=${shortSelected.length} medium=${mediumSelected.length} long=${longSelected.length})`);
}

writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');
console.log(`\nWritten to ${OUTPUT}`);
