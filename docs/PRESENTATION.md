# Presentation Outline (10 slides)

1. **Title** — LexGuard · AI contract intelligence · Cloud Run live demo
2. **Problem** — People sign contracts they don't understand
3. **Solution** — Upload → classify → hybrid extract → grounded analysis → report
4. **Architecture** — React + Express + Vertex Gemini + Firestore/GCS
5. **Differentiation** — Category-first RAG, hybrid extraction, cross-clause heuristics, adversarial JSON per clause
6. **Demo** — Employment contract contradiction + non-compete
7. **Evaluation** — `npm run eval:extract` → 100% on demo benchmarks
8. **GCP** — Cloud Run URL, ~10 API calls/contract, rate-limit controls
9. **Limitations** — Not legal advice; English-first; demo benchmarks not lawyer-certified
10. **Impact** — Employees, freelancers, consumers reviewing ToS

**Live URL:** https://lexguard-api-319474876307.asia-northeast1.run.app
