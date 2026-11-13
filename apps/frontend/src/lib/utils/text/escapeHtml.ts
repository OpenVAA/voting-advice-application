/**
 * Escape text for the content or a quoted attribute of HTML, so that it reads as the text it is once the HTML is parsed. Use it on a value a user typed, such as an address, before it is interpolated into a translation that holds markup and is rendered with `{@html}` through `sanitizeHtml`.
 * @param text - The text to write into HTML.
 * @returns The text with `&`, `<`, `>`, `"` and `'` each written as its entity.
 */
export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
