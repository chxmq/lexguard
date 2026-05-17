import dotenv from 'dotenv';
import { runVertexTask, extendVertexCooldown } from '../../lib/vertex-queue.js';

dotenv.config();

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-004';
const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS) || 256;
const EMBEDDING_MAX_RETRIES = Number(process.env.EMBEDDING_MAX_RETRIES) || 4;
const USE_LOCAL_AT_RUNTIME = process.env.LEXGUARD_RUNTIME_EMBEDDINGS === 'local';

const embeddingCache = new Map();
const CACHE_MAX = Number(process.env.EMBEDDING_CACHE_SIZE) || 256;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheKey(text) {
  return text.slice(0, 512);
}

function cacheGet(text) {
  return embeddingCache.get(cacheKey(text));
}

function cacheSet(text, vec) {
  const key = cacheKey(text);
  if (embeddingCache.size >= CACHE_MAX) {
    const first = embeddingCache.keys().next().value;
    embeddingCache.delete(first);
  }
  embeddingCache.set(key, vec);
}

/**
 * Generate text embeddings. Runtime analysis defaults to local vectors when
 * LEXGUARD_RUNTIME_EMBEDDINGS=local (zero quota). Corpus build (embed-corpus) still uses Vertex.
 */
export async function embedText(text, { forceVertex = false } = {}) {
  const cached = cacheGet(text);
  if (cached) return cached;

  if (USE_LOCAL_AT_RUNTIME && !forceVertex) {
    const vec = localHashEmbedding(text);
    cacheSet(text, vec);
    return vec;
  }

  if (!PROJECT) {
    const vec = localHashEmbedding(text);
    cacheSet(text, vec);
    return vec;
  }

  for (let attempt = 0; attempt < EMBEDDING_MAX_RETRIES; attempt++) {
    try {
      const values = await runVertexTask(async () => {
        const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;

        const { GoogleAuth } = await import('google-auth-library');
        const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
        const client = await auth.getClient();
        const accessToken = (await client.getAccessToken()).token;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instances: [{ content: text.slice(0, 2048) }],
            parameters: { outputDimensionality: EMBEDDING_DIMENSIONS },
          }),
        });

        if (response.status === 429) {
          const backoff = Math.min(60_000, 3000 * 2 ** attempt);
          extendVertexCooldown(backoff);
          throw new Error(`429 RESOURCE_EXHAUSTED embedding`);
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Embedding HTTP ${response.status}: ${errText.slice(0, 120)}`);
        }

        const data = await response.json();
        return data?.predictions?.[0]?.embeddings?.values;
      });

      if (Array.isArray(values) && values.length > 0) {
        cacheSet(text, values);
        return values;
      }
    } catch (err) {
      const retryable = String(err.message).includes('429') || String(err.message).includes('RESOURCE_EXHAUSTED');
      if (retryable && attempt < EMBEDDING_MAX_RETRIES - 1) {
        const backoff = Math.min(60_000, 3000 * 2 ** attempt);
        console.warn(`[Embeddings] 429 — retry in ${backoff}ms`);
        await sleep(backoff);
        continue;
      }
      console.warn(`[Embeddings] Using local fallback: ${err.message}`);
      break;
    }
  }

  const vec = localHashEmbedding(text);
  cacheSet(text, vec);
  return vec;
}

export function localHashEmbedding(text, dims = EMBEDDING_DIMENSIONS) {
  const vec = new Array(dims).fill(0);
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
  for (const token of tokens) {
    let h = 0;
    for (let i = 0; i < token.length; i++) {
      h = (h * 31 + token.charCodeAt(i)) % dims;
    }
    vec[h] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
