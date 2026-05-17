import { employmentSchema } from './employment.js';
import { freelanceSchema } from './freelance.js';
import { ndaSchema } from './nda.js';
import { saasTosSchema } from './saas_tos.js';
import { privacyPolicySchema } from './privacy_policy.js';
import { vendorSchema } from './vendor.js';
import { rentalSchema } from './rental.js';
import { insuranceSchema } from './insurance.js';
import { loanSchema } from './loan.js';
import { genericSchema } from './generic.js';

const schemas = {
  employment: employmentSchema,
  freelance: freelanceSchema,
  nda: ndaSchema,
  saas_tos: saasTosSchema,
  privacy_policy: privacyPolicySchema,
  vendor: vendorSchema,
  rental: rentalSchema,
  insurance: insuranceSchema,
  loan: loanSchema,
  generic: genericSchema,
};

export function loadSchema(documentType) {
  return schemas[documentType] ?? genericSchema;
}

export { schemas };
