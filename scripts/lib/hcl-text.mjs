/**
 * Text helpers for reading Terraform `.tf` files without an HCL parser: comment removal, brace-counted blocks, a block's
 * top-level arguments and a call's arguments, and whole-word matching.
 *
 * Comments (`#`, `//` and `/* *\/`) are recognised only outside double-quoted strings; heredoc strings are not
 * recognised. Node built-ins only, no build step: the guards that import it run before anything is built.
 */

/**
 * A `.tf` text with its comments removed and its strings kept. Comments are `#` and `//` to the end of the line and
 * `/* *\/` (replaced by blanks, so line numbers hold), each only outside a double-quoted string.
 *
 * @param text - The `.tf` text.
 * @returns The text with every comment removed.
 */
export function hclCode(text) {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inString) {
      out += c;
      if (c === '\\' && i + 1 < text.length) {
        out += text[i + 1];
        i += 1;
      } else if (c === '"' || c === '\n') inString = false;
    } else if (c === '"') {
      inString = true;
      out += c;
    } else if (c === '#' || (c === '/' && text[i + 1] === '/')) {
      while (i + 1 < text.length && text[i + 1] !== '\n') i += 1;
    } else if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop - 1;
    } else out += c;
  }
  return out;
}

/**
 * The text of every block whose header matches, from its opening brace to the matching closing one, braces inside
 * strings not counted. A block whose braces do not close is returned as null.
 *
 * @param code - Code from `hclCode`.
 * @param header - The source of a regular expression that ends with the opening brace.
 * @returns One entry per matching header, in order: the block's text, or null.
 */
export function blocks(code, header) {
  const found = [];
  const re = new RegExp(header, 'g');
  for (let m = re.exec(code); m !== null; m = re.exec(code)) {
    const open = m.index + m[0].length - 1;
    let depth = 0;
    let inString = false;
    let body = null;
    for (let i = open; i < code.length && body === null; i += 1) {
      const c = code[i];
      if (inString) {
        if (c === '\\') i += 1;
        else if (c === '"' || c === '\n') inString = false;
      } else if (c === '"') inString = true;
      else if (c === '{') depth += 1;
      else if (c === '}') {
        depth -= 1;
        if (depth === 0) body = code.slice(open, i + 1);
      }
    }
    found.push(body);
  }
  return found;
}

/**
 * A string with every regular-expression metacharacter escaped.
 *
 * @param s - The literal text.
 * @returns The text as a regular-expression source that matches it literally.
 */
export function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A key or name as a whole word: not part of a longer identifier.
 *
 * @param name - The key or name.
 * @returns A regular expression matching `name` with no identifier character on either side.
 */
export function asWord(name) {
  return new RegExp(`(?<![A-Za-z0-9_])${escapeRe(name)}(?![A-Za-z0-9_])`);
}

/**
 * The 1-based line number of a character offset.
 *
 * @param text - The text.
 * @param index - The offset into `text`.
 * @returns The line that holds the offset.
 */
export function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

/**
 * As `blocks`, with each block's header match and the offset of its opening brace.
 *
 * @param code - Code from `hclCode`.
 * @param header - The source of a regular expression that ends with the opening brace.
 * @returns `[{ match, open, body }]`, one per matching header, in order; `body` is null when its braces do not close.
 */
export function blocksAt(code, header) {
  const re = new RegExp(header, 'g');
  return blocks(code, header).map((body) => {
    const match = re.exec(code);
    return { match, open: match.index + match[0].length - 1, body };
  });
}

/**
 * The arguments written directly in a block, not in a block or a value nested inside it: one per line whose depth at
 * its start is the block's own, as `{ name, value, line }`. A value that spans lines is read up to the end of its first
 * line.
 *
 * @param body - A block from `blocksAt`, starting at its opening brace.
 * @param firstLine - The line number of the opening brace.
 */
export function topLevelArguments(body, firstLine) {
  const found = [];
  let depth = 1;
  let inString = false;
  let line = firstLine;
  let lineDepth = 1;
  let lineStart = 1;
  let text = '';
  function flush() {
    const m = lineDepth === 1 ? /^\s*([A-Za-z0-9_-]+)\s*=\s*(.*?)\s*$/.exec(text) : null;
    if (m)
      found.push({
        name: m[1],
        value: m[2],
        line,
        expression: fullExpression(body, lineStart + text.indexOf('=') + 1)
      });
  }
  for (let i = 1; i < body.length; i += 1) {
    const c = body[i];
    if (c === '\n') {
      flush();
      line += 1;
      lineDepth = depth;
      lineStart = i + 1;
      inString = false;
      text = '';
      continue;
    }
    if (inString) {
      if (c === '\\') {
        text += c + (body[i + 1] ?? '');
        i += 1;
        continue;
      }
      if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if ('{[('.includes(c)) depth += 1;
    else if ('}])'.includes(c)) {
      depth -= 1;
      if (depth === 0) break;
    }
    text += c;
  }
  flush();
  return found;
}

/**
 * The whole expression that starts at `start`, across lines: up to the first line end, or the block's closing brace,
 * at which every bracket opened since `start` is closed again.
 */
export function fullExpression(body, start) {
  let depth = 0;
  let inString = false;
  let i = start;
  for (; i < body.length; i += 1) {
    const c = body[i];
    if (inString) {
      if (c === '\\') i += 1;
      else if (c === '"' || c === '\n') inString = false;
    } else if (c === '"') inString = true;
    else if ('{[('.includes(c)) depth += 1;
    else if ('}])'.includes(c)) {
      if (depth === 0) break;
      depth -= 1;
    } else if (c === '\n' && depth === 0) break;
  }
  return body.slice(start, i).trim();
}

/** The arguments of a call written as its whole text, `name(a, b, ...)`, split at its top-level commas; null otherwise. */
export function callArguments(expression, name) {
  const m = new RegExp(`^${name}\\s*\\(([\\s\\S]*)\\)$`).exec(expression);
  if (!m) return null;
  const args = [];
  let depth = 0;
  let inString = false;
  let from = 0;
  const inner = m[1];
  for (let i = 0; i < inner.length; i += 1) {
    const c = inner[i];
    if (inString) {
      if (c === '\\') i += 1;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if ('{[('.includes(c)) depth += 1;
    else if ('}])'.includes(c)) depth -= 1;
    else if (c === ',' && depth === 0) {
      args.push(inner.slice(from, i).trim());
      from = i + 1;
    }
  }
  args.push(inner.slice(from).trim());
  return args.filter((a) => a !== '');
}
