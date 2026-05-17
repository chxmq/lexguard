import { genericSchema } from './generic.js';

export const insuranceSchema = {
  ...genericSchema,
  documentType: 'insurance',
  requiredCategories: [
    'coverage',
    'exclusions',
    'deductible',
    'claims',
    'termination',
    'governing_law',
  ],
  riskCategories: ['exclusions', 'coverage', 'claims'],
  extractionSignals: {
    ...genericSchema.extractionSignals,
    coverage: {
      headingKeywords: ['coverage', 'insured', 'benefits', 'policy'],
      bodyKeywords: ['covered', 'coverage limit', 'sum insured', 'benefit'],
      structuralHints: ['shall cover', 'insured against'],
      missingRisk: 'Coverage scope and limits are not clearly defined.',
    },
    exclusions: {
      headingKeywords: ['exclusion', 'not covered', 'limitations'],
      bodyKeywords: ['excluded', 'shall not cover', 'except', 'pre-existing'],
      structuralHints: ['does not apply', 'excluded from'],
      missingRisk: 'Exclusions may leave significant gaps in protection.',
    },
    deductible: {
      headingKeywords: ['deductible', 'co-pay', 'retention'],
      bodyKeywords: ['deductible', 'out of pocket', 'retention amount'],
      structuralHints: ['shall pay', 'before coverage'],
      missingRisk: 'Deductible or out-of-pocket obligations are unclear.',
    },
    claims: {
      headingKeywords: ['claims', 'notification', 'proof of loss'],
      bodyKeywords: ['claim', 'notify', 'proof of loss', 'filing'],
      structuralHints: ['must notify', 'within'],
      missingRisk: 'Claims process and deadlines are not specified.',
    },
  },
};
