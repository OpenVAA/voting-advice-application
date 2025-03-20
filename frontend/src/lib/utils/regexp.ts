/**
 * Escape a string to be used in a regular expression (removes special characters that could break the regex)
 * Source: https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
 */
export function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }