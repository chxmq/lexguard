import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';

dotenv.config();

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-004';
const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS) || 256;

let vertexAI = null;

function getVertexAI() {
  if (!PROJECT) return null;
  if (!vertexAI) {
    vertexAI = new VertexAI({ project: PROJECT, location: LOCATION });
  }
  return vertexAI;
}

/**
 * Generate text embeddings using Vertex AI's text-embedding-004 model.
 * Falls back to a local hash-based embedding when Vertex AI is unavailable.
 */
export async function embedText(text) {
  const vertex = getVertexAI();
  if (!vertex) {
    return localHashEmbedding(text);
  }

  try {
    // Use the Vertex AI prediction endpoint for embedding models.
    // text-embedding-004 is NOT a generative model — it requires the
    // PredictionServiceClient or the REST predict endpoint, not generateContent.
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;

    // Use Application Default Credentials via google-auth-library
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

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Embeddings] Vertex AI returned ${response.status}: ${errText.slice(0, 200)}`);
      return localHashEmbedding(text);
    }

    const data = await response.json();
    const values = data?.predictions?.[0]?.embeddings?.values;
    if (Array.isArray(values) && values.length > 0) {
      return values;
    }
  } catch (err) {
    console.warn(`[Embeddings] Vertex AI embedding failed, using local fallback: ${err.message}`);
  }

  return localHashEmbedding(text);
}

/**
 * Local fallback: deterministic hash-based embedding for when Vertex AI is unavailable.
 * Uses a simple bag-of-words approach with hash bucketing.
 */
function localHashEmbedding(text, dims = EMBEDDING_DIMENSIONS) {
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
