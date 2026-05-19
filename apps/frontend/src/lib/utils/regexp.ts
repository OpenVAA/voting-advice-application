/**
 * Escape a string to be used in a regular expression (removes special characters that could break the regex)
 * Source: https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
 * TODO[Node 24]: Replace this with a built-it RegExp.escape once on Node 24
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
