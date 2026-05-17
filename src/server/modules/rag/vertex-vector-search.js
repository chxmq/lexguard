import { v1 } from '@google-cloud/aiplatform';
import dotenv from 'dotenv';

dotenv.config();

const { MatchServiceClient, IndexServiceClient } = v1;

function vectorLocation() {
  return process.env.VECTOR_SEARCH_LOCATION || process.env.VERTEX_AI_LOCATION || 'us-central1';
}

function projectId() {
  return process.env.GOOGLE_CLOUD_PROJECT;
}

export function isVectorSearchConfigured() {
  return Boolean(
    projectId() &&
      process.env.VECTOR_SEARCH_INDEX_ENDPOINT &&
      process.env.VECTOR_SEARCH_DEPLOYED_INDEX_ID
  );
}

export function getIndexEndpointResource() {
  const raw = process.env.VECTOR_SEARCH_INDEX_ENDPOINT || '';
  if (raw.startsWith('projects/')) return raw;
  return `projects/${projectId()}/locations/${vectorLocation()}/indexEndpoints/${raw}`;
}

export function getIndexResource() {
  const raw = process.env.VECTOR_SEARCH_INDEX_ID || '';
  if (!raw) return null;
  if (raw.startsWith('projects/')) return raw;
  return `projects/${projectId()}/locations/${vectorLocation()}/indexes/${raw}`;
}

function matchClient() {
  const location = vectorLocation();
  const apiEndpoint = process.env.VECTOR_SEARCH_API_ENDPOINT || `${location}-aiplatform.googleapis.com`;
  return new MatchServiceClient({ apiEndpoint });
}

function indexClient() {
  const location = vectorLocation();
  const apiEndpoint = process.env.VECTOR_SEARCH_API_ENDPOINT || `${location}-aiplatform.googleapis.com`;
  return new IndexServiceClient({ apiEndpoint });
}

/**
 * Query Vertex Vector Search; returns [{ id, text, score, documentType, category }] or null.
 */
export async function queryVertexVectorSearch(embedding, { topK = 3, documentType, category } = {}) {
  if (!isVectorSearchConfigured()) return null;
  if (!embedding?.length) return null;

  try {
    const client = matchClient();
    const indexEndpoint = getIndexEndpointResource();
    const deployedIndexId = process.env.VECTOR_SEARCH_DEPLOYED_INDEX_ID;

    const [response] = await client.findNeighbors({
      indexEndpoint,
      deployedIndexId,
      queries: [
        {
          datapoint: { featureVector: embedding },
          neighborCount: Math.min(20, topK * 4),
        },
      ],
      returnFullDatapoint: false,
    });

    const neighbors = response?.nearestNeighbors?.[0]?.neighbors || [];
    const { loadCorpusEntryById } = await import('./corpus.js');

    const results = [];
    for (const neighbor of neighbors) {
      const id = neighbor.datapoint?.datapointId || neighbor.datapoint?.datapoint_id;
      if (!id) continue;
      const entry = loadCorpusEntryById(String(id));
      if (!entry) continue;
      if (documentType && entry.documentType !== documentType) continue;
      if (category && entry.category !== category && !entry.category.includes(category.replace(/_/g, ''))) {
        continue;
      }
      const rawDistance = neighbor.distance ?? neighbor.sparseDistance ?? 0;
      const score =
        process.env.VECTOR_SEARCH_METRIC === 'cosine' ? 1 - rawDistance : rawDistance;
      results.push({
        id: entry.id,
        text: entry.text,
        documentType: entry.documentType,
        category: entry.category,
        score,
      });
    }

    if (results.length < topK) {
      for (const neighbor of neighbors) {
        const id = neighbor.datapoint?.datapointId || neighbor.datapoint?.datapoint_id;
        if (!id) continue;
        const entry = loadCorpusEntryById(String(id));
        if (!entry) continue;
        if (results.some((r) => r.id === entry.id)) continue;
        const rawDistance = neighbor.distance ?? 0;
        const score =
          process.env.VECTOR_SEARCH_METRIC === 'cosine' ? 1 - rawDistance : rawDistance;
        results.push({
          id: entry.id,
          text: entry.text,
          documentType: entry.documentType,
          category: entry.category,
          score,
        });
        if (results.length >= topK) break;
      }
    }

    return results
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, topK);
  } catch (err) {
    console.warn('[VectorSearch] Query failed, using local corpus:', err.message);
    return null;
  }
}

/**
 * Upsert corpus datapoints into the Vertex index (for sync-vector-search script).
 */
export async function upsertDatapoints(datapoints) {
  const index = getIndexResource();
  if (!index) {
    throw new Error('Set VECTOR_SEARCH_INDEX_ID for upserts (index resource id, not endpoint).');
  }

  const client = indexClient();
  const batchSize = Number(process.env.VECTOR_SEARCH_UPSERT_BATCH) || 50;

  for (let i = 0; i < datapoints.length; i += batchSize) {
    const batch = datapoints.slice(i, i + batchSize);
    await client.upsertDatapoints({
      index,
      datapoints: batch.map((d) => ({
        datapointId: d.id,
        featureVector: d.embedding,
      })),
    });
    console.log(`[VectorSearch] Upserted ${Math.min(i + batchSize, datapoints.length)}/${datapoints.length}`);
  }
}

export function getVectorSearchStatus() {
  return {
    configured: isVectorSearchConfigured(),
    indexEndpoint: process.env.VECTOR_SEARCH_INDEX_ENDPOINT || null,
    deployedIndexId: process.env.VECTOR_SEARCH_DEPLOYED_INDEX_ID || null,
    indexId: process.env.VECTOR_SEARCH_INDEX_ID || null,
    location: vectorLocation(),
  };
}
