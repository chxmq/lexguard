import dotenv from 'dotenv';
import { embedText } from '../src/server/modules/rag/embeddings.js';
import { generateText, isDemoMode } from '../src/server/lib/gemini.js';
import {
  getVectorSearchStatus,
  isVectorSearchConfigured,
  queryVertexVectorSearch,
} from '../src/server/modules/rag/vertex-vector-search.js';

dotenv.config();

async function main() {
  console.log('Project:', process.env.GOOGLE_CLOUD_PROJECT);
  console.log('Vertex location:', process.env.VERTEX_AI_LOCATION);
  console.log('Demo mode:', isDemoMode());
  console.log('Vector Search:', getVectorSearchStatus());

  const embedding = await embedText('employment non-compete clause benchmark');
  console.log(`Embedding OK (${embedding.length} dimensions)`);

  if (isVectorSearchConfigured()) {
    const hits = await queryVertexVectorSearch(embedding, { topK: 2, documentType: 'employment' });
    console.log('Vector Search hits:', hits?.length ? hits.map((h) => h.id) : '(none — run sync-vector-search)');
  }

  const reply = await generateText('Reply with exactly: LexGuard quota check OK', {
    modelTier: 'fast',
    maxOutputTokens: 32,
  });
  console.log('Gemini:', reply?.slice(0, 80));
  console.log('All checks passed.');
}

main().catch((err) => {
  console.error('Check failed:', err.message);
  process.exit(1);
});
