/**
 * A line reader for `apps/supabase/supabase/config.toml`, shared by the guards that read its keys.
 *
 * A table starts at its `[name]` header and ends at the next header; a key is a `name = value` line with an optional
 * trailing comment. A value is read only when its form can be read exactly: a bare boolean, an integer, a
 * double-quoted string without `#` or `\`, or a one-line array that `JSON.parse` accepts. Any other form, a line in a
 * read table that is neither a key nor a header, and a key written twice in one table are each reported as a problem
 * and give no value. The configuration file holds no multi-line value, which is what makes the line read exact.
 *
 * Node built-ins only, no build step: the guards that import it run before anything is built.
 */

/** A table header, `[name]` or `[[name]]`, with an optional trailing comment. The name is group 1. */
export const TABLE_HEADER = /^\s*\[\[?\s*([^\]]*?)\s*\]\]?\s*(?:#.*)?$/;

/** A table name the reader accepts: bare dotted words, no quoted part. */
export const TABLE_NAME = /^[A-Za-z0-9_.-]+$/;

/**
 * The name of a table header in its plain form: each dotted part trimmed, and a part that is a quoted bare key written
 * without its quotes, so `[auth . external . "github"]` is `auth.external.github`.
 *
 * @param header - The name inside the brackets, as group 1 of `TABLE_HEADER` gives it.
 * @returns The plain name, or null when a part is still not a bare key, such as a quoted part holding a dot or a space.
 */
export function plainTableName(header) {
  const name = header
    .split('.')
    .map((part) => part.trim().replace(/^"([A-Za-z0-9_-]+)"$|^'([A-Za-z0-9_-]+)'$/, '$1$2'))
    .join('.');
  return TABLE_NAME.test(name) ? name : null;
}

/** The name a table header that cannot be read is written as by `plainHeaders`, so the keys under it belong to that one table. */
export const UNREADABLE_TABLE = 'unreadable-table-header';

/**
 * The configuration text with every table header written as `[<plain name>]`, and a header whose name `plainTableName`
 * cannot read written as `[unreadable-table-header]`.
 *
 * @param text - The configuration text.
 * @returns `text`, the rewritten text, and `unreadable`, `{ line, index }` per header that cannot be read: the header
 *   line as written and its zero-based line index.
 */
export function plainHeaders(text) {
  const unreadable = [];
  const lines = text.split('\n').map((line, index) => {
    const header = TABLE_HEADER.exec(line);
    if (!header) return line;
    const name = plainTableName(header[1]);
    if (name !== null) return `[${name}]`;
    unreadable.push({ line, index });
    return `[${UNREADABLE_TABLE}]`;
  });
  return { text: lines.join('\n'), unreadable };
}

/** A `name = value` line. The key is group 1 and the text after `=` group 2. */
export const KEY_LINE = /^\s*([A-Za-z0-9_-]+)\s*=\s*(.*)$/;

/** A commented-out assignment: `#`, then a `name = ...` line. The key is group 1. */
const COMMENTED_KEY_LINE = /^\s*#+\s*([A-Za-z0-9_-]+)\s*=/;

/**
 * The value text of an assignment with its trailing comment removed, and whether a `#` sits inside a quoted string.
 *
 * @param rest - The text after `=`.
 * @returns `raw`, the trimmed value text, and `hashInQuote`.
 */
export function splitValue(rest) {
  let inQuote = false;
  let hashInQuote = false;
  let end = rest.length;
  for (let i = 0; i < rest.length; i += 1) {
    const c = rest[i];
    if (c === '"') inQuote = !inQuote;
    else if (c === '#') {
      if (inQuote) hashInQuote = true;
      else {
        end = i;
        break;
      }
    }
  }
  return { raw: rest.slice(0, end).trim(), hashInQuote };
}

/**
 * One value, when its form can be read exactly.
 *
 * @param raw - The value text, as `splitValue` returns it.
 * @returns `{ ok: true, value }`, or `{ ok: false, what }` naming why it cannot be read.
 */
export function parseValue(raw) {
  if (raw === 'true') return { ok: true, value: true };
  if (raw === 'false') return { ok: true, value: false };
  if (/^-?\d+$/.test(raw)) return { ok: true, value: Number(raw) };
  if (raw.includes('\\'))
    return { ok: false, what: 'the value holds a backslash, which the line read does not unescape' };
  if (raw.startsWith('"')) {
    try {
      const value = JSON.parse(raw);
      if (typeof value === 'string') return { ok: true, value };
    } catch {
      // fall through
    }
    return { ok: false, what: `the string ${raw} cannot be read exactly` };
  }
  if (raw.startsWith('[')) {
    try {
      const value = JSON.parse(raw);
      if (Array.isArray(value) && value.every((v) => ['string', 'number', 'boolean'].includes(typeof v)))
        return { ok: true, value };
    } catch {
      // fall through
    }
    return { ok: false, what: `the array ${raw} is not a one-line array that JSON.parse accepts` };
  }
  return { ok: false, what: `the value form ${raw === '' ? '(empty)' : raw} cannot be read exactly by a line read` };
}

/**
 * Every live key of the tables the predicate selects.
 *
 * @param text - The configuration text.
 * @param options - `inTables`, which tables to read by name; every table when omitted.
 * @returns `keys`, a map from `<table>/<key>` to the parsed value; `problems`, `{ id, what }` per key or line that
 *   cannot be read; `live`, the id of every key assigned on a live line, readable or not; and `commentedOut`, the id of
 *   every key that occurs only in a commented-out assignment.
 */
export function readConfig(text, { inTables = () => true } = {}) {
  const keys = new Map();
  const problems = [];
  const seen = new Set();
  const commented = new Set();
  let table = null;
  text.split('\n').forEach((line, index) => {
    const header = TABLE_HEADER.exec(line);
    if (header) {
      if (TABLE_NAME.test(header[1])) {
        table = header[1];
        return;
      }
      if (table !== null && inTables(table))
        problems.push({
          id: `${table}/(line ${index + 1})`,
          what: `the line '${line.trim()}' is neither a key nor a table header the line read can read`
        });
      return;
    }
    if (table === null || !inTables(table)) return;
    if (/^\s*(?:#.*)?$/.test(line)) {
      const commentedKey = COMMENTED_KEY_LINE.exec(line);
      if (commentedKey) commented.add(`${table}/${commentedKey[1]}`);
      return;
    }
    const assignment = KEY_LINE.exec(line);
    if (!assignment) {
      problems.push({
        id: `${table}/(line ${index + 1})`,
        what: `the line '${line.trim()}' is not a key the line read can read`
      });
      return;
    }
    const id = `${table}/${assignment[1]}`;
    if (seen.has(id)) {
      problems.push({ id, what: 'the key is written twice in one table, so which value applies cannot be read' });
      keys.delete(id);
      return;
    }
    seen.add(id);
    const { raw, hashInQuote } = splitValue(assignment[2]);
    if (hashInQuote) {
      problems.push({ id, what: 'a quoted value holds a #, which a line read would take for the start of a comment' });
      return;
    }
    const parsed = parseValue(raw);
    if (!parsed.ok) {
      problems.push({ id, what: parsed.what });
      return;
    }
    keys.set(id, parsed.value);
  });
  // A key that was readable once but written again counts as not readable.
  for (const p of problems) if (keys.has(p.id)) keys.delete(p.id);
  const commentedOut = new Set([...commented].filter((id) => !seen.has(id)));
  return { keys, problems, live: seen, commentedOut };
}
