import dotenv from 'dotenv';
import { embedText } from '../src/server/modules/rag/embeddings.js';
import { listAllCorpusEntries } from '../src/server/modules/rag/corpus.js';
import {
  isVectorSearchConfigured,
  upsertDatapoints,
  getVectorSearchStatus,
} from '../src/server/modules/rag/vertex-vector-search.js';

dotenv.config();

async function main() {
  console.log('Vector Search status:', getVectorSearchStatus());

  if (!process.env.VECTOR_SEARCH_INDEX_ID) {
    console.error('Set VECTOR_SEARCH_INDEX_ID (index resource id, not endpoint).');
    process.exit(1);
  }

  if (!isVectorSearchConfigured()) {
    console.warn('VECTOR_SEARCH_INDEX_ENDPOINT / DEPLOYED_INDEX_ID not set — upsert only.');
  }

  const entries = listAllCorpusEntries();
  if (!entries.length) {
    console.error('No corpus files under corpus/');
    process.exit(1);
  }

  const datapoints = [];
  for (const entry of entries) {
    const embedding = await embedText(entry.text);
    datapoints.push({ id: entry.id, embedding });
    console.log(`Embedded ${entry.id} (${embedding.length} dims)`);
  }

  await upsertDatapoints(datapoints);
  console.log(`Upserted ${datapoints.length} datapoints.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
