import { listAllCorpusEntries } from '../src/server/modules/rag/corpus.js';
import { embedText } from '../src/server/modules/rag/embeddings.js';
import { loadIndex, saveIndex } from '../src/server/modules/rag/vector-store.js';

const gapMs = Number(process.env.EMBEDDING_MIN_INTERVAL_MS) || 1500;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const index = loadIndex();
  index.entries = [];

  for (const entry of listAllCorpusEntries()) {
    const embedding = await embedText(entry.text, { forceVertex: true });
    if (gapMs > 0) await sleep(gapMs);
    index.entries.push({
      id: entry.id,
      documentType: entry.documentType,
      category: entry.category,
      text: entry.text,
      embedding,
    });
    console.log(`Embedded ${entry.id}`);
  }

  saveIndex(index);
  console.log(`Done. ${index.entries.length} entries in local index.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
