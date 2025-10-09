
// TODO: TOPONDER: optimize this type so that it can be used later on for all docs
// E.g. internal ref to original doc? Or does it make more sense to just store the original doc as SourceDocument?

/** @example
 * ```typescript
 * {
 *   id: '1',
 *   content: 'Hello, world!',
 *   source: 'European Parliament',
 *   link: 'https://www.google.com' // optional
 * }
 * ```
 */
export interface SourceDocument {
  id: string;
  source: string;
  content: string;
  link?: string;
}