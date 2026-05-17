# LexGuard — Judge Quick Start

**Live app:** https://lexguard-api-319474876307.asia-northeast1.run.app  
**GitHub:** https://github.com/chxmq/lexguard

## 3-minute demo (recommended)

1. Open the live URL above.
2. Upload **`demo/sample_employment_contract.txt`** (or paste its contents).
3. Wait for analysis (~2–4 min; progress bar shows each clause).
4. Open **Risk overview** → see **30 vs 60 day notice contradiction**.
5. Select **non_compete** → severity, plain-language impact, benchmark comparison, redline.
6. Try **`demo/sample_saas_subscription.txt`** for auto-renewal + INR 1,000 liability cap + Singapore arbitration.

## What makes LexGuard different

| Capability | How |
|------------|-----|
| **Structured legal reasoning** | One Vertex JSON pass per clause: classify → explain → compare to corpus → adversarial verdict + redline |
| **Benchmark-grounded** | 35+ reference clauses in `corpus/` (category-first — no embedding quota during analysis) |
| **Cross-clause intelligence** | Deterministic contradiction/ambiguity detection + optional Vertex merge |
| **Hybrid extraction** | Fast heuristics; **+1 Vertex call** only when coverage is low (semantic segmenter) |
| **Production GCP** | Cloud Run, Vertex Gemini 2.5, Firestore, GCS |

## API budget per contract (typical employment)

| Step | Vertex calls |
|------|----------------|
| Classify | 1 |
| Extract (if heuristics weak) | 0–1 |
| Analyze clauses | ~8 |
| Cross-clause AI | 0 (heuristics on by default in production) |
| **Total** | **~9–10** |

## Measurable accuracy

```bash
npm run eval:extract   # fast — extraction + cross-clause heuristics only
npm run eval           # full pipeline (needs Vertex)
```

See [EVALUATION.md](./EVALUATION.md) for benchmark targets on demo contracts.

## Not legal advice

LexGuard is decision-support for awareness and negotiation prep — not a substitute for licensed counsel.
