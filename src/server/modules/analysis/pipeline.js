import pLimit from 'p-limit';
import { classifyDocument } from '../extraction/classify-document.js';
import { extractClauses } from '../extraction/extract-clauses.js';
import { analyzeClause } from './clause-analyzer.js';
import { analyzeCrossClause } from './cross-clause-analyzer.js';
import { saveSession } from '../../lib/storage.js';
import {
  SEVERITY_ORDER,
  SEVERITY_WEIGHTS,
  MAX_CONTRACT_CHARS,
} from '../../../shared/analysis-constants.js';
import { logger } from '../../lib/logger.js';
const CLAUSE_CONCURRENCY = 1;
const CLAUSE_GAP_MS = Math.max(0, Number(process.env.GEMINI_CLAUSE_GAP_MS) || 0);

export function calculateOverallRisk(clauseResults, missingClauses = []) {
  if (!clauseResults.length && missingClauses.length) return 72;

  let weightedSum = 0;
  let count = 0;

  for (const r of clauseResults) {
    const sev = r.classifier?.severity || 'Medium';
    const w = SEVERITY_WEIGHTS[sev] || 3;
    weightedSum += w * (r.classifier?.confidence ?? 0.8);
    count += 1;
  }

  for (const m of missingClauses) {
    weightedSum += SEVERITY_WEIGHTS.High;
    count += 1;
  }

  const avg = count ? weightedSum / count : 3;
  return Math.min(100, Math.round((avg / 5) * 100));
}

export function sortBySeverity(results) {
  return [...results].sort((a, b) => {
    const ai = SEVERITY_ORDER.indexOf(a.classifier?.severity || 'Medium');
    const bi = SEVERITY_ORDER.indexOf(b.classifier?.severity || 'Medium');
    return ai - bi;
  });
}

export async function runAnalysis({ sessionId, rawText, onProgress }) {
  const onThrottle = (info) =>
    onProgress?.({
      stage: 'throttle',
      message: info.message || 'Waiting for Vertex AI quota...',
      retryInMs: info.retryInMs,
      throttle: info,
    });

  onProgress?.({ stage: 'classifying', message: 'Identifying document type...' });

  const classification = await classifyDocument(rawText, { onThrottle });
  const documentType =
    classification.documentType === 'unknown' ? 'generic' : classification.documentType;
  const signingParty = classification.signingParty || 'employee';

  onProgress?.({
    stage: 'extracting',
    message: 'Extracting clauses by schema...',
    classification,
  });

  const { extracted, missing } = await extractClauses(rawText, documentType, { onThrottle });

  onProgress?.({
    stage: 'extracted',
    message: `Found ${extracted.length} clauses, ${missing.length} missing`,
    extracted: extracted.map((c) => ({ category: c.category, confidence: c.confidence })),
    missing,
    classification,
  });

  const limit = pLimit(CLAUSE_CONCURRENCY);
  let completed = 0;

  const clauseResults = await Promise.all(
    extracted.map((clause) =>
      limit(async () => {
        onProgress?.({
          stage: 'analyzing',
          message: `Analyzing ${clause.category}...`,
          category: clause.category,
        });

        const analysis = await analyzeClause(clause, documentType, signingParty, { onThrottle });
        if (CLAUSE_GAP_MS > 0) {
          await new Promise((r) => setTimeout(r, CLAUSE_GAP_MS));
        }
        const result = { clause, ...analysis };
        completed += 1;

        onProgress?.({
          stage: 'clause_complete',
          message: `Completed ${clause.category}`,
          category: clause.category,
          severity: result.classifier?.severity,
          progress: { completed, total: extracted.length },
        });

        return result;
      })
    )
  );

  onProgress?.({
    stage: 'analyzing',
    message: 'Cross-clause checks...',
    category: 'cross_clause',
  });

  let ambiguityAnalysis = null;
  try {
    ambiguityAnalysis = await analyzeCrossClause(extracted, documentType, signingParty);
  } catch (err) {
    logger.warn('Pipeline', 'Ambiguity detection failed', err.message);
  }

  const sorted = sortBySeverity(clauseResults);
  const overallRiskScore = calculateOverallRisk(sorted, missing);

  const report = {
    sessionId,
    classification,
    documentType,
    signingParty,
    extractedCount: extracted.length,
    missingClauses: missing,
    clauses: sorted,
    ambiguityAnalysis,
    overallRiskScore,
    rawText: rawText.slice(0, MAX_CONTRACT_CHARS),
    rawTextPreview: rawText.slice(0, 500),
    completedAt: new Date().toISOString(),
  };

  await saveSession(sessionId, report);

  onProgress?.({ stage: 'complete', report });

  return report;
}
