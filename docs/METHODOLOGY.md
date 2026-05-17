# LexGuard — AI Methodology & Reasoning Workflow

## Design principles (problem-statement alignment)

1. **Explainability over opaque scores** — Every finding includes severity, reasoning, plain-language implications, and benchmark comparison.
2. **Context-first** — Document type and signing party are classified before analysis so prompts are not generic.
3. **Grounded comparison** — RAG retrieves real benchmark clause text; the model must cite deviations, not invent “market standard” from memory alone.
4. **Not legal advice** — System is decision-support for awareness and negotiation prep; professional review is required for binding decisions.

## Models

| Task | Model | Why |
|------|--------|-----|
| Classification, clause analysis, cross-clause, chat | `gemini-2.5-flash` (default) / `gemini-2.5-pro` (orchestrator tier) | Structured JSON, speed, quota efficiency |
| OCR (images & scanned PDFs) | Gemini multimodal Flash | No Document AI required for demos |
| Embeddings | `text-embedding-004` | Vertex embedding API for RAG |
| Optional OCR | Document AI processor | Enterprise PDF scans |

## Per-clause reasoning workflow

For each extracted clause:

1. **Retrieve** top-K benchmark clauses (same `documentType`, similar category/text).
2. **Single structured Gemini call** (preferred) producing:
   - **Classifier** — severity, risk type (financial, employment, privacy, IP, etc.), flags, reasoning.
   - **Implication** — plain explanation, worst-case scenario, “affects you if…”
   - **Comparator** — deviation vs benchmarks (score + label + differences).
   - **Orchestrator** — adversarial step: acceptable argument → dangerous argument → verdict, negotiation priority, redline suggestion.
3. **Fallback** — If combined JSON fails schema validation, two-step: analysis JSON + `negotiation-synthesizer.js`.

This is **structured adversarial reasoning** in one or two API calls — not a fleet of independent agent processes — to stay within Vertex quotas while preserving interpretability.

## Cross-clause analysis

| Layer | Method |
|-------|--------|
| Heuristic (always on) | Regex + structural rules: ambiguous phrases, notice contradictions, missing definitions, arbitration/auto-renewal patterns |
| Vertex (default on) | Full-document clause set passed to Gemini; results merged and deduplicated with heuristics |

Disable AI-only cross-clause: `LEXGUARD_CROSS_CLAUSE_AI=false` (heuristics still run).

## Risk scoring

Weighted average of per-clause severities × confidence, plus penalty weight for **missing** high-risk schema categories (e.g. no limitation of liability in SaaS ToS).

| Severity | Weight |
|----------|--------|
| Critical | 5 |
| High | 4 |
| Medium | 3 |
| Low | 2 |
| Informational | 1 |

Normalized to 0–100 for the report header and radar chart.

## Clause extraction methodology

Extraction is **schema-driven and deterministic**:

- Contracts split into sections (headings, ARTICLE/SECTION patterns).
- Each schema category has heading/body keyword signals.
- Best-matching section assigned per category; missing required categories flagged.

**Why not LLM extraction for every clause?** Reliability and cost: segmentation errors compound in downstream analysis. LLM reasoning is reserved for interpretation, not boundary detection. Future enhancement: optional LLM assist for `generic` documents.

## Evaluation & limitations

| Strength | Limitation |
|----------|------------|
| Transparent JSON artifacts | Not validated against a gold legal dataset |
| Broad document-type schemas | Benchmark corpus is illustrative, not jurisdictional law |
| Indian law references in prompts | Best effort; not substitute for local counsel |
| English-focused | Non-English contracts may degrade |

## Suggested judge demo path

1. Upload `demo/sample_employment_contract.txt` — non-compete, IP, notice contradiction.
2. Upload `demo/sample_saas_subscription.txt` — auto-renewal, arbitration, liability cap.
3. Open **Risk overview** → cross-clause contradictions and exploitative patterns.
4. Select a clause → read implication + redline + benchmark comparison.
5. Ask chat: *“What if I resign without serving notice?”*
