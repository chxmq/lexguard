# Testing Strategy

LexGuard uses automated tests at three levels so judges and CI can verify behavior without manual uploads.

## Test pyramid

| Layer | Command | Vertex required? | What it proves |
|-------|---------|----------------|----------------|
| **Unit** | `npm run test:unit` | No | Risk math, heuristics, clause utils, PDF quality |
| **Benchmark** | `npm run eval:extract` | No | 100% expected findings on 3 demo contracts |
| **Integration** | `npm run test:integration` | No (demo mode) | Full HTTP API: health → analyze → session report |

Run everything:

```bash
npm run test:all
```

## Unit tests (`tests/*.test.js`)

- `risk-score.test.js` — weighted overall risk calculation
- `cross-clause-heuristics.test.js` — notice-period contradictions, ambiguous phrases
- `clause-utils.test.js` — report normalization
- `extraction.test.js` — heuristic clause extraction on employment sample
- `retriever.test.js` — category-first RAG (zero embedding API calls)
- `demo-mode.test.js` — deterministic demo stubs
- `llm-extract.test.js` — LLM extraction gating
- `pdf-quality.test.js` — scanned PDF detection
- `accessibility.test.js` — `role="note"`, `role="alert"`, `lang` on HTML
- `app-health.test.js` — `/api/health` shape (demo + RAG flags)
- `constants.test.js` — shared severity limits and upload caps

## Benchmark evaluation (`eval/expected-findings.json`)

Measures **repeatable accuracy** on bundled demos:

- Required clause categories extracted
- Key risk phrases present
- Cross-clause contradictions (employment)

```bash
npm run eval:extract   # fast
npm run eval           # full Vertex pipeline (optional)
```

## Integration tests (`tests/integration/`)

Uses `createApp()` from `src/server/app.js` with:

- `LEXGUARD_DEMO_MODE=true` — deterministic classify + analyze stubs
- `LEXGUARD_MEMORY_STORE=true` — in-memory sessions (no Firestore/GCS in CI)
- Real Express routes, job store, and pipeline orchestration

Covers:

1. `GET /api/health`
2. `POST /api/analyze` → poll status → `GET /api/session/:id`
3. Error paths (empty text, unknown session)

## CI (GitHub Actions)

On every push to `main`:

1. `npm ci`
2. `npm run test:unit`
3. `npm run eval:extract`
4. `npm run test:integration`
5. `npm run build`
6. Production server smoke (`npm run smoke:ci` → `scripts/ci-smoke.js`)

## Manual / Vertex tests

```bash
npm run check-vertex    # Gemini + embeddings connectivity
npm run e2e             # live analysis against running server
```

## Coverage goals

| Area | Target |
|------|--------|
| Shared heuristics | 100% critical paths |
| API routes | Integration suite |
| Demo contracts | Benchmark JSON |
| Accessibility | Static convention checks |

Not in scope: lawyer-certified legal accuracy (see limitations in METHODOLOGY.md).
