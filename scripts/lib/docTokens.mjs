/**
 * Readers for the markdown of a docs page that a spec checks against a list in code: the texts the page writes in
 * backticks, and the rows of the tables under one of its headings. Node built-ins only, no build step.
 */

/**
 * Every text the page writes between a pair of single backticks, each whole and on one line, in the page's order.
 *
 * @param {string} text - The markdown text.
 * @returns {Array<string>} The texts between the backticks, a text written twice listed twice.
 */
export function backtickedTokens(text) {
  return Array.from(text.matchAll(/`([^`\n]+)`/g), (match) => match[1]);
}

/**
 * The table rows of the section a heading begins: every line that begins, after optional spaces, with `|`, from the
 * line that is exactly the heading up to the next heading of the same or a higher level. A row is its cells, each
 * trimmed, without the empty texts before the first `|` and after the last; the header and separator rows are rows
 * too.
 *
 * @param {string} text - The markdown text.
 * @param {string} heading - The heading line, such as `## Event catalogue`.
 * @returns {Array<Array<string>> | undefined} The rows in the page's order, or `undefined` when no line is the heading.
 */
export function tableRowsUnder(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.trim() === heading.trim());
  if (start < 0) return undefined;
  const level = heading.trim().length - heading.trim().replace(/^#+/, '').length;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => {
    const hashes = /^(#+)\s/.exec(line);
    return hashes !== null && hashes[1].length <= level;
  });
  return (end < 0 ? rest : rest.slice(0, end))
    .filter((line) => line.trimStart().startsWith('|'))
    .map((line) =>
      line
        .trim()
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim())
    );
}
