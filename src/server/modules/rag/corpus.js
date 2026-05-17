import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CORPUS_ROOT = path.join(__dirname, '../../../../corpus');

export function loadCorpusEntryById(id) {
  const normalized = String(id).replace(/\\/g, '/');
  const parts = normalized.split('/');
  if (parts.length < 2) return null;

  const documentType = parts[0];
  const file = parts.slice(1).join('/');
  const filePath = path.join(CORPUS_ROOT, documentType, file);

  if (!fs.existsSync(filePath)) return null;

  const text = fs.readFileSync(filePath, 'utf-8').trim();
  const category = file.replace(/\.(txt|md)$/, '');

  return {
    id: `${documentType}/${file}`,
    documentType,
    category,
    text,
  };
}

export function listAllCorpusEntries() {
  if (!fs.existsSync(CORPUS_ROOT)) return [];

  const entries = [];
  for (const documentType of fs.readdirSync(CORPUS_ROOT)) {
    const dir = path.join(CORPUS_ROOT, documentType);
    if (!fs.statSync(dir).isDirectory()) continue;

    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.txt') && !file.endsWith('.md')) continue;
      const entry = loadCorpusEntryById(`${documentType}/${file}`);
      if (entry) entries.push(entry);
    }
  }
  return entries;
}

export function loadCorpusByType(documentType, category) {
  const dir = path.join(CORPUS_ROOT, documentType);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.txt') || f.endsWith('.md'));
  const results = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const fileCategory = file.replace(/\.(txt|md)$/, '').replace(/_/g, ' ');
    if (category && !file.includes(category) && !fileCategory.includes(category.replace(/_/g, ''))) {
      continue;
    }
    results.push({
      id: `${documentType}/${file}`,
      documentType,
      category: category || file.replace(/\.(txt|md)$/, ''),
      text: content.trim(),
    });
  }
  return results;
}
