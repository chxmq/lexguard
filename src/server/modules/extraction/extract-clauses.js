import { loadSchema } from './schemas/index.js';

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

export async function extractClauses(rawText, documentType) {
  const schema = loadSchema(documentType);
  const extracted = [];
  const missing = [];

  for (const category of schema.requiredCategories) {
    const signals = schema.extractionSignals[category];
    if (!signals) continue;

    const clause = findClause(rawText, signals);

    if (clause) {
      extracted.push({
        text: clause.text,
        category,
        startIndex: clause.startIndex,
        endIndex: clause.endIndex,
        confidence: clause.confidence,
      });
    } else if (schema.riskCategories.includes(category)) {
      missing.push({
        category,
        riskMessage: signals.missingRisk,
        severity: 'High',
      });
    }
  }

  return { extracted, missing };
}
