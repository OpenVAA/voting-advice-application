/**
 * The harness's reading of the project id a served application publishes.
 *
 * The attribute and the placeholder are the harness's half of a two-sided contract whose other half is `apps/frontend/src/app.html` plus the `transformPageChunk` in `apps/frontend/src/hooks.server.ts`. An UNSUBSTITUTED placeholder is therefore not an edge case to tolerate: it is the exact signature of a substitution that stopped happening, and every caller treats it, like an absent attribute, as a mismatch.
 */

/** The attribute the served application publishes its configured project id on. */
export const SERVED_PROJECT_ATTRIBUTE = 'data-project-id';

/** The placeholder `app.html` declares the attribute with. */
export const SERVED_PROJECT_PLACEHOLDER = '%projectId%';

/** What a served document says about its project: the id it serves, no attribute at all, or the unsubstituted placeholder. */
export type ServedProjectReading = { kind: 'served'; projectId: string } | { kind: 'absent' } | { kind: 'placeholder' };

/**
 * Reads the project a served document publishes.
 *
 * @param html - The served document.
 * @returns The served id, trimmed and lower-cased, or the absent or placeholder reading.
 */
export function describeServedProject(html: string): ServedProjectReading {
  const served = extractServedProjectId(html);
  if (served === null) return { kind: 'absent' };
  if (served === SERVED_PROJECT_PLACEHOLDER.toLowerCase()) return { kind: 'placeholder' };
  return { kind: 'served', projectId: served };
}

/**
 * Extracts the served project id from the {@link SERVED_PROJECT_ATTRIBUTE} attribute.
 *
 * @param html - The served document.
 * @returns The attribute value, trimmed and lower-cased, or `null` when the document carries no such attribute.
 */
export function extractServedProjectId(html: string): string | null {
  const match = new RegExp(`${SERVED_PROJECT_ATTRIBUTE}="([^"]*)"`).exec(html);
  return match ? match[1].trim().toLowerCase() : null;
}
