import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML received from the server for displaying with Svelte `@html`
 * @param html Dirty HTML
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html?: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
