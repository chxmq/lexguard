/**
 * Single global queue + throttle for ALL Vertex traffic (Gemini + embeddings).
 * Prevents Gemini and embeddings from bursting the same quota in parallel.
 */
import pLimit from 'p-limit';
import dotenv from 'dotenv';

dotenv.config();

const MAX_CONCURRENT = Math.max(1, Number(process.env.VERTEX_MAX_CONCURRENT) || 1);
const MIN_INTERVAL_MS = Math.max(
  500,
  Number(process.env.VERTEX_MIN_INTERVAL_MS) ||
    Number(process.env.GEMINI_MIN_INTERVAL_MS_FLASH) ||
    2000
);

const limit = pLimit(MAX_CONCURRENT);
let lastCallAt = 0;
let cooldownUntil = 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function extendVertexCooldown(ms) {
  cooldownUntil = Math.max(cooldownUntil, Date.now() + ms);
}

export async function runVertexTask(fn) {
  return limit(async () => {
    const now = Date.now();
    const waitUntil = Math.max(cooldownUntil, lastCallAt + MIN_INTERVAL_MS);
    if (now < waitUntil) {
      await sleep(waitUntil - now);
    }
    lastCallAt = Date.now();
    return fn();
  });
}

export function getVertexQueueStatus() {
  return {
    maxConcurrent: MAX_CONCURRENT,
    minIntervalMs: MIN_INTERVAL_MS,
    cooldownUntil: cooldownUntil > Date.now() ? cooldownUntil : 0,
  };
}
