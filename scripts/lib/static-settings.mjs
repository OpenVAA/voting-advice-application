/**
 * A line reader for `packages/app-shared/src/settings/staticSettings.ts`, shared by the guards and the probe that read
 * a value of it without building the package.
 *
 * Node built-ins only, no build step: the guards that import it run before anything is built.
 */

/**
 * `dataAdapter.pageSize`, by a line read directly inside the `dataAdapter` block. A `//` comment is ignored.
 *
 * @param text - The static settings text.
 * @returns `{ ok: true, value }`, or `{ ok: false, what }` when the block or the value is missing, unreadable or
 *   written twice.
 */
export function readPageSize(text) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^\s*dataAdapter\s*:\s*\{/.test(l));
  if (start === -1) return { ok: false, what: 'no `dataAdapter: {` block was found' };
  let depth = 0;
  const values = [];
  let unreadable = null;
  for (let i = start; i < lines.length; i += 1) {
    const code = lines[i].replace(/\/\/.*$/, '');
    if (i > start && depth === 1 && /^\s*pageSize\s*:/.test(code)) {
      const m = /^\s*pageSize\s*:\s*(\d+)\s*,?\s*$/.exec(code);
      if (m) values.push(Number(m[1]));
      else unreadable = lines[i].trim();
    }
    depth += (code.match(/\{/g) ?? []).length - (code.match(/\}/g) ?? []).length;
    if (depth <= 0) break;
  }
  if (unreadable !== null)
    return { ok: false, what: `the line '${unreadable}' is not a pageSize the line read can read` };
  if (values.length === 0) return { ok: false, what: 'the `dataAdapter` block holds no pageSize' };
  if (values.length > 1) return { ok: false, what: `the \`dataAdapter\` block holds pageSize ${values.length} times` };
  return { ok: true, value: values[0] };
}
