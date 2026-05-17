# Avoiding Vertex AI 429 Rate Limits

## Root cause

A single employment contract can trigger **20+ Vertex calls** if misconfigured (per-clause embeddings + retries + cross-clause + two-step fallbacks).

## Production defaults (recommended)

```env
VERTEX_MAX_CONCURRENT=1
VERTEX_MIN_INTERVAL_MS=3000
GEMINI_CLAUSE_GAP_MS=2000
LEXGUARD_RAG_MODE=category-first
LEXGUARD_RUNTIME_EMBEDDINGS=local
LEXGUARD_CROSS_CLAUSE_AI=false
LEXGUARD_LLM_EXTRACT=auto
```

**Typical usage:** ~9–11 Gemini calls per contract, **0 embedding calls** during analysis.

## GCP quota increase

1. [Vertex AI Quotas](https://console.cloud.google.com/iam-admin/quotas?service=aiplatform.googleapis.com) for project `lexguard-dev`
2. Request higher **Generate content requests per minute** for `gemini-2.5-flash`
3. Ensure **billing** is enabled

## If 429 persists

- Increase `GEMINI_CLAUSE_GAP_MS` to `4000`
- Do not run `npm run embed-corpus` during demos
- Wait 60s for per-minute quota reset
