import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cosineSimilarity } from './similarity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = path.join(__dirname, '../../../../corpus/.vector-index.json');

let memoryIndex = null;

export function loadIndex() {
  if (memoryIndex) return memoryIndex;
  try {
    if (fs.existsSync(INDEX_PATH)) {
      memoryIndex = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
      return memoryIndex;
    }
  } catch {
    // build on demand
  }
  memoryIndex = { entries: [] };
  return memoryIndex;
}

export function saveIndex(index) {
  memoryIndex = index;
  const dir = path.dirname(INDEX_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
}

export function queryIndex(embedding, { topK = 3, documentType, category } = {}) {
  const index = loadIndex();
  let candidates = index.entries;

  if (documentType) {
    candidates = candidates.filter((e) => e.documentType === documentType);
  }
  if (category) {
    candidates = candidates.filter((e) => e.category === category);
  }

  const scored = candidates.map((entry) => ({
    ...entry,
    score: cosineSimilarity(embedding, entry.embedding),
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
