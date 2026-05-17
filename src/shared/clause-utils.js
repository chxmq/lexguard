/**
 * Normalize clause entries from session storage (handles legacy shapes without nested `clause`).
 */
export function normalizeClauseItems(clauses = []) {
  if (!Array.isArray(clauses)) return [];

  return clauses
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      if (item.clause?.category) {
        return item;
      }

      const category = item.category ?? item.classifier?.category;
      if (!category) return null;

      return {
        clause: {
          category,
          text: item.text ?? item.clauseText ?? '',
          startIndex: item.startIndex,
          endIndex: item.endIndex,
          confidence: item.confidence,
        },
        classifier: item.classifier,
        implication: item.implication,
        comparator: item.comparator,
        orchestrator: item.orchestrator,
      };
    })
    .filter(Boolean);
}

export function getClauseCategory(item) {
  return item?.clause?.category ?? item?.category ?? null;
}
