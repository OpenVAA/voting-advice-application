/**
 * Capitalize the first letter of a string.
 */
export function ucFirst(text: string) {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}
