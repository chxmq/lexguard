# LexGuard — Evaluation Benchmarks

We publish **repeatable checks** on bundled demo contracts so judges can verify behavior without a private legal dataset.

## Run benchmarks

```bash
# Fast (no Vertex quota): extraction + cross-clause heuristics
npm run eval:extract

# Full: runs complete analysis pipeline per demo contract
npm run eval
```

Expected: **≥85%** average on `eval/expected-findings.json` (extraction + phrase detection + contradictions).

## What we measure

| Check | Example (employment demo) |
|-------|---------------------------|
| Clause extracted | `non_compete`, `ip_assignment`, `notice_period` |
| Risk phrase present | "irrevocably assigns", "24 months", "binding arbitration" |
| Cross-clause | Notice period (60d) vs termination (30d) contradiction |

## Demo contract intent

| File | Top risks judges should see |
|------|----------------------------|
| `demo/sample_employment_contract.txt` | Broad non-compete, irrevocable IP, arbitration waiver, notice mismatch |
| `demo/sample_saas_subscription.txt` | Auto-renewal, INR 1k liability cap, Singapore arbitration, perpetual data license |
| `demo/sample_privacy_policy.txt` | Excessive collection, data brokers, weak user rights |

## Limitations (transparent)

- Benchmarks cover **bundled demos**, not all real-world PDF layouts.
- Severity labels are **AI-assisted**, not lawyer-certified.
- English-first; Indian law referenced in prompts where relevant.

Improvements welcome via PRs to `eval/expected-findings.json`.
