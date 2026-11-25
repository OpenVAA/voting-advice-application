/**
 * Line-level helpers for the Markdown the docs scripts read and write.
 */

/**
 * Apply `transform` to every line of `markdown` outside fenced code blocks, leaving fence lines and the lines between them as they are.
 * @param markdown - The Markdown to transform.
 * @param transform - The transform applied to each line outside a fence.
 */
export function mapOutsideFences(markdown: string, transform: (line: string) => string): string {
  let inFence = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      return inFence ? line : transform(line);
    })
    .join('\n');
}
