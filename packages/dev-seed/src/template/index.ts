/**
 * Barrel re-export for the template module.
 *
 * Downstream consumers import `validateTemplate` + `Template` + `TemplateSchema`
 * from `./template` instead of reaching into `./schema` vs `./types`.
 */
export { TemplateSchema, validateTemplate } from './schema';
export type { Template } from './types';
