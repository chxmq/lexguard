import { embedText } from './embeddings.js';
import { loadIndex, queryIndex } from './vector-store.js';
import { isVectorSearchConfigured, queryVertexVectorSearch } from './vertex-vector-search.js';
import { loadCorpusByType } from './corpus.js';
import { cosineSimilarity } from './similarity.js';

const DEFAULT_BENCHMARK =
  'Standard market clauses in this category typically use narrower scope, defined geography, and time limits of 6–12 months.';

export async function retrieveBenchmarks(clauseText, documentType, category) {
  const embedding = await embedText(clauseText);
  const topK = Number(process.env.RAG_TOP_K) || 3;

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

  const scored = await Promise.all(
    corpus.map(async (entry) => {
      const emb = await embedText(entry.text);
      return { ...entry, score: cosineSimilarity(embedding, emb) };
    })
  );

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
