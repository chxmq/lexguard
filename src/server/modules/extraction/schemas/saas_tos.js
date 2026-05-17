export const saasTosSchema = {
  documentType: 'saas_tos',

  requiredCategories: [
    'acceptance',
    'auto_renewal',
    'data_ownership',
    'limitation_liability',
    'warranty_disclaimer',
    'termination',
    'arbitration',
    'modification',
    'acceptable_use',
  ],

  riskCategories: ['auto_renewal', 'limitation_liability', 'arbitration', 'data_ownership'],

  extractionSignals: {
    acceptance: {
      headingKeywords: ['acceptance', 'agreement to terms', 'binding'],
      bodyKeywords: ['by using', 'you agree', 'accept these terms', 'click to accept'],
      structuralHints: ['constitutes acceptance', 'legally binding'],
      missingRisk: 'No clear acceptance mechanism described.',
    },
    auto_renewal: {
      headingKeywords: ['renewal', 'auto-renew', 'subscription', 'billing cycle'],
      bodyKeywords: ['automatically renew', 'unless you cancel', 'recurring', 'subscription period'],
      structuralHints: ['will renew', 'auto-renewal'],
      missingRisk: 'No auto-renewal terms found. Billing continuity may be unclear.',
    },
    data_ownership: {
      headingKeywords: ['data', 'ownership', 'your content', 'customer data'],
      bodyKeywords: ['you retain', 'license to', 'customer data', 'process your data'],
      structuralHints: ['you own', 'grant us a license'],
      missingRisk: 'No data ownership clause found. Who owns your uploaded data is ambiguous.',
    },
    limitation_liability: {
      headingKeywords: ['limitation of liability', 'liability cap', 'damages'],
      bodyKeywords: ['not liable', 'maximum liability', 'consequential damages', 'indirect damages'],
      structuralHints: ['in no event', 'limited to', 'aggregate liability'],
      missingRisk: 'No liability cap found. Exposure to uncapped damages may exist.',
    },
    warranty_disclaimer: {
      headingKeywords: ['warranty', 'disclaimer', 'as-is'],
      bodyKeywords: ['as is', 'without warranty', 'merchantability', 'fitness for purpose'],
      structuralHints: ['disclaims all warranties', 'provided as-is'],
      missingRisk: 'No warranty disclaimer found.',
    },
    termination: {
      headingKeywords: ['termination', 'suspension', 'cancellation'],
      bodyKeywords: ['terminate', 'suspend access', 'cancel subscription'],
      structuralHints: ['may terminate', 'upon notice'],
      missingRisk: 'No termination rights specified.',
    },
    arbitration: {
      headingKeywords: ['arbitration', 'dispute', 'class action'],
      bodyKeywords: ['binding arbitration', 'class action waiver', 'dispute resolution'],
      structuralHints: ['agree to arbitrate', 'waive jury trial'],
      missingRisk: 'No arbitration/dispute clause found.',
    },
    modification: {
      headingKeywords: ['modification', 'changes to terms', 'updates'],
      bodyKeywords: ['modify these terms', 'post updated', 'continued use constitutes'],
      structuralHints: ['reserve the right to change', 'effective upon posting'],
      missingRisk: 'No modification clause found. Provider may change terms without clear notice.',
    },
    acceptable_use: {
      headingKeywords: ['acceptable use', 'prohibited', 'restrictions'],
      bodyKeywords: ['prohibited conduct', 'may not use', 'unlawful', 'reverse engineer'],
      structuralHints: ['you agree not to', 'prohibited uses'],
      missingRisk: 'No acceptable use policy found.',
    },
  },
};
