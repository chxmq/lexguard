import { embedText } from './embeddings.js';
import { loadIndex, queryIndex } from './vector-store.js';
import { isVectorSearchConfigured, queryVertexVectorSearch } from './vertex-vector-search.js';
import { loadCorpusByType, loadCorpusEntryById } from './corpus.js';

const DEFAULT_BENCHMARK =
  'Standard market clauses in this category typically use narrower scope, defined geography, and time limits of 6–12 months.';

const RAG_MODE = process.env.LEXGUARD_RAG_MODE || 'category-first';

/**
 * Zero-API benchmark lookup: corpus files named {documentType}/{category}.txt
 */
function retrieveByCategory(documentType, category, topK) {
  const results = [];
  const direct = loadCorpusEntryById(`${documentType}/${category}.txt`);
  if (direct) {
    results.push({ ...direct, score: 1 });
  }

  for (const entry of loadCorpusByType(documentType, category)) {
    if (results.some((r) => r.id === entry.id)) continue;
    results.push({ ...entry, score: 0.95 });
    if (results.length >= topK) return results;
  }

  return results.length ? results.slice(0, topK) : null;
}

export async function retrieveBenchmarks(clauseText, documentType, category) {
  const topK = Number(process.env.RAG_TOP_K) || 3;

  if (RAG_MODE === 'category-first' || RAG_MODE === 'category') {
    const direct = retrieveByCategory(documentType, category, topK);
    if (direct?.length) return direct;
  }

  const embedding = await embedText(clauseText);

  if (isVectorSearchConfigured()) {
    const vertexResults = await queryVertexVectorSearch(embedding, { topK, documentType, category });
    if (vertexResults?.length) return vertexResults;
  }

  const index = loadIndex();
  if (index.entries.length > 0) {
    return queryIndex(embedding, { topK, documentType, category });
  }

  const corpus = loadCorpusByType(documentType, category);
  if (corpus.length === 0) {
    return [{ text: DEFAULT_BENCHMARK, score: 0, documentType, category }];
  }

  return corpus.slice(0, topK).map((entry, i) => ({
    ...entry,
    score: 1 - i * 0.05,
  }));
}
