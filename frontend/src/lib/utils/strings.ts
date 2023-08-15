/**
 * Capitalize a string
 */
export function ucFirst(text: string) {
  return text != null && text !== '' ? text[0].toLocaleUpperCase() + text.substring(1) : '';
}
