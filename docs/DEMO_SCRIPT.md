# 5-Minute Demo Script

**Live:** https://lexguard-api-319474876307.asia-northeast1.run.app

## 1. Employment contract (2 min)

1. Upload `demo/sample_employment_contract.txt`
2. Show SSE progress (classify → extract → per-clause analysis)
3. Open **Risk overview** → **30 vs 60 day notice** contradiction
4. Open **non_compete** → severity, benchmark, redline

**Say:** *"We reason per clause from the employee's perspective, grounded on corpus benchmarks."*

## 2. SaaS ToS (1.5 min)

Upload `demo/sample_saas_subscription.txt` — highlight INR 1,000 liability cap, Singapore arbitration, auto-renewal.

## 3. Measurable quality (30 sec)

```bash
npm run eval:extract
# → 100% on bundled demo contracts
```

## 4. API budget (15 sec)

~10 Vertex calls per contract with production env (see `docs/JUDGING.md`).
