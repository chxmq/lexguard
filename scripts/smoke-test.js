#!/usr/bin/env node
/** One Gemini call — confirms GCP credentials + Vertex work. */
import dotenv from 'dotenv';
import { VertexAI } from '@google-cloud/vertexai';

dotenv.config();

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

if (!project) {
  console.error('Set GOOGLE_CLOUD_PROJECT in .env');
  process.exit(1);
}

const vertex = new VertexAI({ project, location });
const model = vertex.getGenerativeModel({ model: process.env.GEMINI_FAST_MODEL || 'gemini-2.5-flash' });

console.log(`Testing ${project} @ ${location}...`);

const start = Date.now();
const result = await model.generateContent({
  contents: [{ role: 'user', parts: [{ text: 'Reply with JSON only: {"status":"ok"}' }] }],
  generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 32 },
});

const candidate = result.response?.candidates?.[0];
const text = (candidate?.content?.parts || [])
  .map((p) => p.text || '')
  .join('')
  .trim();

if (!text) {
  console.log(`OK in ${Date.now() - start}ms (empty body, finish: ${candidate?.finishReason || 'unknown'})`);
} else {
  console.log(`OK in ${Date.now() - start}ms:`, text);
}
console.log('\nGCP is working. Next: npm run dev → upload demo/sample_employment_contract.txt');
