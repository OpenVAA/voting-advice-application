import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML received from the server for displaying with Svelte `@html`
 * @param html - Dirty HTML
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html?: string): string {
  if (!html) return '';
  // `target` is not part of DOMPurify’s default allow list, but we use it to open external links in
  // a new tab, which is the convention elsewhere in the app. Modern browsers imply `rel="noopener"`
  // for `target="_blank"` links.
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, ADD_ATTR: ['target'] });
}
