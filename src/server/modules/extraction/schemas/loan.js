import { genericSchema } from './generic.js';

export const loanSchema = {
  ...genericSchema,
  documentType: 'loan',
  requiredCategories: [
    'principal',
    'interest',
    'repayment',
    'default',
    'collateral',
    'governing_law',
  ],
  riskCategories: ['default', 'interest', 'collateral'],
  extractionSignals: {
    ...genericSchema.extractionSignals,
    principal: {
      headingKeywords: ['principal', 'loan amount', 'facility'],
      bodyKeywords: ['principal amount', 'loan of', 'borrow'],
      structuralHints: ['shall lend', 'principal sum'],
      missingRisk: 'Principal amount and disbursement terms are unclear.',
    },
    interest: {
      headingKeywords: ['interest', 'rate', 'apr'],
      bodyKeywords: ['interest rate', 'per annum', 'compound', 'default interest'],
      structuralHints: ['shall bear interest', '% per'],
      missingRisk: 'Interest rate and calculation method are not defined.',
    },
    repayment: {
      headingKeywords: ['repayment', 'installment', 'amortization'],
      bodyKeywords: ['repay', 'installment', 'maturity', 'payment schedule'],
      structuralHints: ['shall pay', 'due on'],
      missingRisk: 'Repayment schedule and prepayment rules are unclear.',
    },
    default: {
      headingKeywords: ['default', 'event of default', 'remedies'],
      bodyKeywords: ['default', 'accelerate', 'breach', 'remedies'],
      structuralHints: ['upon default', 'immediately due'],
      missingRisk: 'Default triggers and lender remedies are not clear.',
    },
    collateral: {
      headingKeywords: ['collateral', 'security', 'guarantee', 'hypothecation'],
      bodyKeywords: ['security interest', 'pledge', 'guarantee', 'collateral'],
      structuralHints: ['secured by', 'charge over'],
      missingRisk: 'Security or collateral requirements are unclear.',
    },
  },
};
