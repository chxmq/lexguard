import { loadSchema } from './schemas/index.js';
import {
  extractClausesWithLlm,
  shouldUseLlmExtraction,
} from './extract-clauses-llm.js';
import { logger } from '../../lib/logger.js';

function normalizeText(text) {
  return text.replace(/\r\n/g, '\n');
}

function scoreMatch(text, keywords) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) score += 1;
  }
  return score;
}

function splitIntoSections(rawText) {
  const text = normalizeText(rawText);
  const lines = text.split('\n');
  const sections = [];
  let current = { heading: '', lines: [], startIndex: 0 };
  let charIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const lineStart = charIndex;
    charIndex += line.length + 1;

    const isHeading =
      trimmed.length > 0 &&
      trimmed.length < 100 &&
      (trimmed === trimmed.toUpperCase() ||
        /^(ARTICLE|SECTION|\d+(\.\d+)*\.?)\s/i.test(trimmed) ||
        /^[A-Z][A-Za-z\s]{2,50}$/.test(trimmed));

    if (isHeading && current.lines.length > 0) {
      const sectionText = current.lines.join('\n');
      sections.push({
        heading: current.heading,
        text: sectionText,
        startIndex: current.startIndex,
        endIndex: lineStart - 1,
      });
      current = { heading: trimmed, lines: [line], startIndex: lineStart };
    } else {
      if (current.lines.length === 0 && trimmed) {
        current.heading = isHeading ? trimmed : '';
        current.startIndex = lineStart;
      }
      current.lines.push(line);
      if (isHeading && !current.heading) current.heading = trimmed;
    }
  }

  if (current.lines.length > 0) {
    const sectionText = current.lines.join('\n');
    sections.push({
      heading: current.heading,
      text: sectionText,
      startIndex: current.startIndex,
      endIndex: charIndex,
    });
  }

  return sections;
}

function findClause(rawText, signals) {
  const sections = splitIntoSections(rawText);
  const fullLower = rawText.toLowerCase();

  let best = null;
  let bestScore = 0;

  for (const section of sections) {
    const combined = `${section.heading}\n${section.text}`;
    const headingScore = scoreMatch(section.heading, signals.headingKeywords || []);
    const bodyScore = scoreMatch(section.text, signals.bodyKeywords || []);
    const hintScore = scoreMatch(section.text, signals.structuralHints || []);
    const total = headingScore * 3 + bodyScore + hintScore * 2;

    if (total > bestScore && (headingScore > 0 || bodyScore >= 2)) {
      bestScore = total;
      best = {
        text: combined.trim(),
        startIndex: section.startIndex,
        endIndex: section.endIndex,
        confidence: Math.min(1, total / 8),
      };
    }
  }

  if (!best) {
    const bodyOnlyScore = scoreMatch(fullLower, [
      ...(signals.bodyKeywords || []),
      ...(signals.structuralHints || []),
    ]);
    if (bodyOnlyScore >= 3) {
      const idx = findBestKeywordIndex(rawText, signals.bodyKeywords);
      if (idx >= 0) {
        const excerpt = extractWindow(rawText, idx, 1200);
        best = {
          text: excerpt,
          startIndex: idx,
          endIndex: idx + excerpt.length,
          confidence: 0.5,
        };
      }
    }
  }

  return best;
}

function findBestKeywordIndex(text, keywords = []) {
  const lower = text.toLowerCase();
  let bestIdx = -1;
  for (const kw of keywords) {
    const idx = lower.indexOf(kw.toLowerCase());
    if (idx >= 0 && (bestIdx < 0 || idx < bestIdx)) bestIdx = idx;
  }
  return bestIdx;
}

function extractWindow(text, centerIndex, windowSize) {
  const start = Math.max(0, centerIndex - 200);
  const end = Math.min(text.length, centerIndex + windowSize);
  return text.slice(start, end).trim();
}

function mergeExtractions(heuristic, llm) {
  const byCategory = new Map();
  for (const c of heuristic) {
    byCategory.set(c.category, { ...c, extractionMethod: 'heuristic' });
  }
  for (const c of llm) {
    const existing = byCategory.get(c.category);
    if (!existing || (c.text?.length || 0) > (existing.text?.length || 0)) {
      byCategory.set(c.category, c);
    }
  }
  return [...byCategory.values()];
}

function buildMissing(schema, extracted) {
  const found = new Set(extracted.map((c) => c.category));
  const missing = [];
  for (const category of schema.requiredCategories) {
    if (found.has(category)) continue;
    const signals = schema.extractionSignals[category];
    if (schema.riskCategories.includes(category) && signals) {
      missing.push({
        category,
        riskMessage: signals.missingRisk,
        severity: 'High',
      });
    }
  }
  return missing;
}

export async function extractClauses(rawText, documentType, options = {}) {
  const schema = loadSchema(documentType);
  const heuristic = [];

  for (const category of schema.requiredCategories) {
    const signals = schema.extractionSignals[category];
    if (!signals) continue;

    const clause = findClause(rawText, signals);
    if (clause) {
      heuristic.push({
        text: clause.text,
        category,
        startIndex: clause.startIndex,
        endIndex: clause.endIndex,
        confidence: clause.confidence,
        extractionMethod: 'heuristic',
      });
    }
  }

  let missing = buildMissing(schema, heuristic);
  let extracted = heuristic;

  if (shouldUseLlmExtraction(heuristic, missing, documentType)) {
    try {
      options.onProgress?.({
        stage: 'extracting',
        message: 'Semantic clause extraction (Vertex AI)...',
      });
      const llmClauses = await extractClausesWithLlm(rawText, documentType, options);
      extracted = mergeExtractions(heuristic, llmClauses);
      missing = buildMissing(schema, extracted);
    } catch (err) {
      logger.warn('Extract', 'LLM supplement failed', err.message);
    }
  }

  return { extracted, missing, extractionMeta: { heuristic: heuristic.length, final: extracted.length } };
}
