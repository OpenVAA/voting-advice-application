#!/usr/bin/env node

/**
 * THE $effect CENSUS CLASSIFIER (phase 159, plan 03, requirement REVIEW-CMP-01).
 *
 * Criterion 1 asks that every `$effect` in the frontend be "audited against the same test with
 * its disposition recorded per site - a census, not a spot fix". A census of ~90 sites written
 * by hand is ~90 judgement calls, which is exactly what 159-CONTEXT.md open item O5 bullet 1
 * warns against. So the predicate is written ONCE, here, as executable code, and the table is
 * generated from it. A reviewer re-runs this file instead of re-deriving the claim.
 *
 * THE PREDICATE, quoted verbatim from 159-RESEARCH.md section "Census Mechanics":
 *
 *   "A site is CONVERTIBLE iff, on every execution path through its body, it performs exactly
 *   one assignment, to exactly one target, where that target is a plain local `$state` binding
 *   declared in the same module (not a prop, not a member expression on another object), and
 *   the body contains no `untrack`, no returned cleanup function, no `await`/`async`/`.then`,
 *   no navigation call, and no DOM access."
 *
 * BUCKET PRECEDENCE ORDER. A body can satisfy several bucket tests at once. Buckets are made
 * mutually exclusive by evaluating them in this declared order and taking the FIRST match, so
 * no site is ever double counted and the bucket counts always sum to the row count. The script
 * asserts that sum itself.
 *
 *    1. DOC COMMENT (not a runtime site)
 *    2. NO ASSIGNMENT (call-only side effect)
 *    3. TEARDOWN (returns cleanup fn)
 *    4. ASYNC
 *    5. UNTRACK (read/write same state)
 *    6. NAV
 *    7. DOM
 *    8. WRITES $bindable PROP
 *    9. WRITES MEMBER / EXTERNAL OBJECT
 *   10. MULTI-TARGET (N targets)
 *   11. CONDITIONAL SINGLE-TARGET (not total)
 *   12. NON-LOCAL / NON-$STATE TARGET
 *   13. SECOND WRITER IN MODULE (operational)
 *   14. CHILD TWO-WAY BINDING (operational)
 *   15. CONVERTIBLE
 *
 * Buckets 13 and 14 are OPERATIONAL: they are facts about reactive safety that the mechanical
 * predicate cannot compute from the effect body alone, and they were learned from 159-02's
 * re-measured demotion evidence. A site in either bucket PASSES the predicate but is still
 * recorded rather than converted. The script marks them by a stated heuristic and flags them
 * for hand review; it never silently decides them.
 *
 * ROW KEY AND ORDERING. Occurrences are keyed by path, line AND column, so two `$effect(`
 * openings on one source line, and an effect nested inside another effect's body, are distinct
 * rows. Rows sort by path, then line, then column, which makes a re-run over an unchanged tree
 * byte identical.
 *
 * WHAT THROWS AND WHAT DOES NOT. The script throws when it cannot find its scan root, and when
 * it cannot balance a site's parentheses or braces. A body containing zero assignments is a
 * first-class classification (bucket 2), never a parse failure - an effect whose body is a call
 * is the single largest bucket in this census and the most ordinary thing an effect does.
 *
 * KNOWN AND ACCEPTED IMPRECISIONS, stated so the census is honest about its own resolution:
 *   - The comment and string masker does not model regular-expression literals. A `/` opening a
 *     regex whose body contains `//` or an unbalanced quote would confuse it. No such construct
 *     exists in the scanned tree at generation time.
 *   - Totality is approximated conservatively: an assignment counts as total only when it sits at
 *     brace depth 0 AND paren depth 0 of the effect body AND is not the single statement of a
 *     brace-less `if`/`else`/`for`/`while`. A value assigned in every branch of an if/else is
 *     therefore recorded as CONDITIONAL rather than convertible. The error direction is safe:
 *     the classifier under-converts, never over-converts.
 *   - "No assignment" means no assignment ANYWHERE in the body, nested callbacks included, so an
 *     effect whose only write sits inside `untrack(() => { … })` is filed under UNTRACK rather
 *     than under call-only. Depth decides totality; it does not decide existence.
 *
 * USAGE
 *   node classify-effects.mjs                       print the census (markdown rows + summary)
 *   node classify-effects.mjs --assert-total N      exit non-zero unless the row count equals N
 *   node classify-effects.mjs --format json         machine-readable output
 *   node classify-effects.mjs --self-test           run the embedded behaviour suite
 *   node classify-effects.mjs --root <dir>          override the scan root (used by the suite)
 */

import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..');
const DEFAULT_SCAN_ROOT = join(REPO_ROOT, 'apps', 'frontend', 'src');

const NEEDLE = '$effect(';

export const BUCKET_PRECEDENCE = [
  'DOC COMMENT (not a runtime site)',
  'NO ASSIGNMENT (call-only side effect)',
  'TEARDOWN (returns cleanup fn)',
  'ASYNC',
  'UNTRACK (read/write same state)',
  'NAV',
  'DOM',
  'WRITES $bindable PROP',
  'WRITES MEMBER / EXTERNAL OBJECT',
  'MULTI-TARGET',
  'CONDITIONAL SINGLE-TARGET (not total)',
  'NON-LOCAL / NON-$STATE TARGET',
  'SECOND WRITER IN MODULE (operational)',
  'CHILD TWO-WAY BINDING (operational)',
  'CONVERTIBLE'
];

// ---------------------------------------------------------------------------
// Filesystem walk
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set(['node_modules', '.svelte-kit', '.turbo', '.git', 'dist', 'build']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Comment and string masking
//
// Produces a same-length copy of the source with the interior of every comment and every
// string or template literal replaced by spaces, plus a per-character flag saying whether the
// character sits inside a comment. Newlines are preserved so indices, lines and columns stay
// aligned with the original text.
//
// A `.svelte` file is NOT tokenized as one JavaScript document: its markup carries apostrophes
// in ordinary prose, and a naive JS tokenizer reads the first of those as a string opener and
// swallows the rest of the file. So script and style blocks are tokenized as code and the
// surrounding markup is scanned only for HTML comments.
// ---------------------------------------------------------------------------

function maskJs(text, masked, isComment, from, to) {
  let i = from;
  const blank = (start, end, keepNewlines = true) => {
    for (let k = start; k < end; k++) masked[k] = keepNewlines && text[k] === '\n' ? '\n' : ' ';
  };
  while (i < to) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '/' && next === '/') {
      let end = text.indexOf('\n', i);
      if (end === -1 || end > to) end = to;
      blank(i, end);
      for (let k = i; k < end; k++) isComment[k] = true;
      i = end;
      continue;
    }
    if (c === '/' && next === '*') {
      let end = text.indexOf('*/', i + 2);
      end = end === -1 || end + 2 > to ? to : end + 2;
      blank(i, end);
      for (let k = i; k < end; k++) isComment[k] = true;
      i = end;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      let k = i + 1;
      while (k < to) {
        if (text[k] === '\\') {
          k += 2;
          continue;
        }
        if (text[k] === quote) break;
        if (quote !== '`' && text[k] === '\n') break;
        k++;
      }
      const end = Math.min(k + 1, to);
      blank(i, end);
      i = end;
      continue;
    }
    i++;
  }
}

function maskSource(text, ext) {
  const masked = text.split('');
  const isComment = new Array(text.length).fill(false);

  if (ext !== '.svelte' && ext !== '.html') {
    maskJs(text, masked, isComment, 0, text.length);
    return { masked: masked.join(''), isComment };
  }

  // Markup: only HTML comments hide anything.
  let cursor = 0;
  const blockRe = /<(script|style)\b[^>]*>/gi;
  let match;
  const codeRanges = [];
  while ((match = blockRe.exec(text)) !== null) {
    const openEnd = match.index + match[0].length;
    const closeRe = new RegExp(`</${match[1]}\\s*>`, 'i');
    const rest = text.slice(openEnd);
    const closeAt = rest.search(closeRe);
    const end = closeAt === -1 ? text.length : openEnd + closeAt;
    codeRanges.push([openEnd, end]);
    blockRe.lastIndex = end;
  }

  const markMarkup = (from, to) => {
    let i = from;
    while (i < to) {
      const at = text.indexOf('<!--', i);
      if (at === -1 || at >= to) break;
      let end = text.indexOf('-->', at + 4);
      end = end === -1 || end + 3 > to ? to : end + 3;
      for (let k = at; k < end; k++) {
        isComment[k] = true;
        masked[k] = text[k] === '\n' ? '\n' : ' ';
      }
      i = end;
    }
  };

  for (const [start, end] of codeRanges) {
    markMarkup(cursor, start);
    maskJs(text, masked, isComment, start, end);
    cursor = end;
  }
  markMarkup(cursor, text.length);

  return { masked: masked.join(''), isComment };
}

// ---------------------------------------------------------------------------
// Balanced scanners
// ---------------------------------------------------------------------------

function matchDelimiter(masked, openIndex, open, close, site) {
  let depth = 0;
  for (let i = openIndex; i < masked.length; i++) {
    if (masked[i] === open) depth++;
    else if (masked[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error(`could not balance ${open}${close} for the site at ${site}`);
}

function lineAndColumn(text, index) {
  let line = 1;
  let lastBreak = -1;
  for (let i = 0; i < index; i++) {
    if (text[i] === '\n') {
      line++;
      lastBreak = i;
    }
  }
  return { line, column: index - lastBreak };
}

// ---------------------------------------------------------------------------
// Assignment scanning
// ---------------------------------------------------------------------------

const COMPOUND_LEADS = new Set(['+', '-', '*', '/', '%', '&', '|', '^', '?']);
const DECLARATION_KEYWORDS = new Set(['const', 'let', 'var']);

function scanTargetBackwards(s, opStart) {
  let i = opStart - 1;
  while (i >= 0 && /\s/.test(s[i])) i--;
  if (i < 0) return null;
  const end = i + 1;
  while (i >= 0) {
    if (s[i] === ']') {
      let depth = 1;
      i--;
      while (i >= 0 && depth > 0) {
        if (s[i] === ']') depth++;
        else if (s[i] === '[') depth--;
        i--;
      }
      continue;
    }
    if (/[\w$#.]/.test(s[i])) {
      i--;
      continue;
    }
    break;
  }
  const start = i + 1;
  const raw = s.slice(start, end).trim();
  if (!raw || !/^[A-Za-z_$#]/.test(raw)) return null;
  return { target: raw, start };
}

function precedingWord(s, start) {
  let i = start - 1;
  while (i >= 0 && /\s/.test(s[i])) i--;
  const end = i + 1;
  while (i >= 0 && /[\w$]/.test(s[i])) i--;
  return s.slice(i + 1, end);
}

const GUARD_KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch']);

/**
 * True when the assignment starting at `start` is the single statement of a BRACE-LESS control
 * structure (`if (cond) target = x;` or a bare `else`). Brace depth alone cannot see this: with no
 * braces the assignment sits at depth 0 and would read as unconditional, which would let a value
 * that survives its own false path be called a pure function of its inputs.
 */
function isGuarded(s, start) {
  let i = start - 1;
  while (i >= 0 && /\s/.test(s[i])) i--;
  if (i < 0) return false;
  if (s[i] === ')') {
    let depth = 1;
    i--;
    while (i >= 0 && depth > 0) {
      if (s[i] === ')') depth++;
      else if (s[i] === '(') depth--;
      i--;
    }
    return GUARD_KEYWORDS.has(precedingWord(s, i + 1));
  }
  const word = precedingWord(s, i + 1);
  return word === 'else' || word === 'do';
}

/**
 * Finds assignments in a masked code region. Returns one record per assignment with the target
 * text and the brace and paren depth at which it sits, both measured relative to the region.
 * Depth is what implements the predicate's "on every execution path" clause: only a depth-0
 * assignment runs unconditionally.
 */
function findAssignments(masked) {
  const found = [];
  let braceDepth = 0;
  let parenDepth = 0;
  for (let i = 0; i < masked.length; i++) {
    const c = masked[i];
    if (c === '{') braceDepth++;
    else if (c === '}') braceDepth--;
    else if (c === '(') parenDepth++;
    else if (c === ')') parenDepth--;
    if (c !== '=') continue;
    if (masked[i + 1] === '=' || masked[i + 1] === '>') continue;
    const prev = masked[i - 1];
    if (prev === '=' || prev === '!' || prev === '<' || prev === '>') continue;
    let opStart = i;
    if (COMPOUND_LEADS.has(prev)) {
      opStart = i - 1;
      if (masked[i - 2] === prev) opStart = i - 2; // &&=, ||=, ??=, **=
    }
    const hit = scanTargetBackwards(masked, opStart);
    if (!hit) continue;
    if (DECLARATION_KEYWORDS.has(precedingWord(masked, hit.start))) continue;
    found.push({ target: hit.target, index: hit.start, braceDepth, parenDepth, guarded: isGuarded(masked, hit.start) });
  }
  return found;
}

// ---------------------------------------------------------------------------
// Per-file facts
// ---------------------------------------------------------------------------

function declaredProps(masked) {
  const names = new Set();
  let from = 0;
  for (;;) {
    const at = masked.indexOf('$props(', from);
    if (at === -1) break;
    from = at + 7;
    const close = masked.lastIndexOf('}', at);
    if (close === -1) continue;
    let depth = 0;
    let open = -1;
    for (let i = close; i >= 0; i--) {
      if (masked[i] === '}') depth++;
      else if (masked[i] === '{') {
        depth--;
        if (depth === 0) {
          open = i;
          break;
        }
      }
    }
    if (open === -1) continue;
    const pattern = masked.slice(open + 1, close);
    let d = 0;
    let current = '';
    const parts = [];
    for (const ch of pattern) {
      if (ch === '{' || ch === '[' || ch === '(') d++;
      if (ch === '}' || ch === ']' || ch === ')') d--;
      if (ch === ',' && d === 0) {
        parts.push(current);
        current = '';
      } else current += ch;
    }
    parts.push(current);
    for (const part of parts) {
      const name = part.trim().replace(/^\.\.\./, '').split(/[=:]/)[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
    }
  }
  return names;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A declaration may carry a TypeScript type annotation between the name and the initialiser
// (`let selected: Array<Id> = $state([])`), so the annotation is matched lazily rather than
// assumed absent. A lazy `[^;\n]*?` also survives an arrow type such as `: (x: T) => void`.
const ANNOTATION = '(?::[^;\\n]*?)?';

function isBindableProp(masked, target) {
  return new RegExp(`(?:^|[^\\w$.])${escapeRe(target)}${ANNOTATION}\\s*=\\s*\\$bindable\\b`).test(masked);
}

function isLocalStateBinding(masked, target) {
  return new RegExp(`(?:^|[^\\w$.])#?${escapeRe(target)}${ANNOTATION}\\s*=\\s*\\$state\\b`).test(masked);
}

function hasChildTwoWayBinding(masked, target) {
  const t = escapeRe(target);
  return (
    new RegExp(`bind:[A-Za-z_$][\\w$]*\\s*=\\s*\\{\\s*${t}\\s*\\}`).test(masked) ||
    new RegExp(`bind:${t}(?![\\w$:])`).test(masked)
  );
}

// ---------------------------------------------------------------------------
// Site discovery and classification
// ---------------------------------------------------------------------------

function extractBody(masked, text, argStart, argEnd, siteLabel, inComment) {
  const argMasked = masked.slice(argStart, argEnd);
  const arrow = /^\s*(async\s+)?(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*/.exec(argMasked);
  const fn = /^\s*(async\s+)?function\s*[A-Za-z_$\w]*\s*\([^)]*\)\s*/.exec(argMasked);
  const header = arrow ?? fn;
  if (!header) {
    if (inComment) return { body: '', raw: '', isAsyncHeader: false, absStart: argStart, absEnd: argEnd };
    throw new Error(`could not identify the callback shape for the site at ${siteLabel}`);
  }
  const isAsyncHeader = Boolean(header[1]);
  const afterHeader = argStart + header[0].length;
  if (masked[afterHeader] === '{') {
    const close = matchDelimiter(masked, afterHeader, '{', '}', siteLabel);
    return {
      body: masked.slice(afterHeader + 1, close),
      raw: text.slice(afterHeader + 1, close),
      isAsyncHeader,
      absStart: afterHeader + 1,
      absEnd: close
    };
  }
  return {
    body: masked.slice(afterHeader, argEnd),
    raw: text.slice(afterHeader, argEnd),
    isAsyncHeader,
    absStart: afterHeader,
    absEnd: argEnd
  };
}

function maskNestedEffects(bodyMasked) {
  // A nested `$effect(...)` is its own census row. Blanking its argument span keeps the parent's
  // assignment scan honest: the parent does not perform the child's write.
  const chars = bodyMasked.split('');
  let from = 0;
  for (;;) {
    const at = bodyMasked.indexOf(NEEDLE, from);
    if (at === -1) break;
    const open = at + NEEDLE.length - 1;
    let depth = 0;
    let close = -1;
    for (let i = open; i < bodyMasked.length; i++) {
      if (bodyMasked[i] === '(') depth++;
      else if (bodyMasked[i] === ')') {
        depth--;
        if (depth === 0) {
          close = i;
          break;
        }
      }
    }
    if (close === -1) break;
    for (let i = open + 1; i < close; i++) if (chars[i] !== '\n') chars[i] = ' ';
    from = close;
  }
  return chars.join('');
}

const NAV_RE = /\b(goto|invalidate|invalidateAll|pushState|replaceState)\s*\(/;
const DOM_RE = /\b(document|window)\s*\.|\.querySelector|getElementById|\.scrollIntoView\s*\(|\.getBoundingClientRect\s*\(/;
const UNTRACK_RE = /\buntrack\s*\(/;
const ASYNC_RE = /\bawait\b|\.then\s*\(/;

function hasTeardownReturn(body) {
  let braceDepth = 0;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '{') braceDepth++;
    else if (body[i] === '}') braceDepth--;
    if (braceDepth !== 0) continue;
    if (!/^return\b/.test(body.slice(i))) continue;
    if (i > 0 && /[\w$.]/.test(body[i - 1])) continue;
    const after = body.slice(i + 6).trimStart();
    if (after.startsWith(';') || after === '') continue;
    if (/^(\(|function\b|async\b|[A-Za-z_$])/.test(after)) return true;
  }
  return false;
}

function classify(site) {
  const { inComment, body, isAsyncHeader, assignments, fileMasked, bodyAbs } = site;

  if (inComment) return { bucket: 'DOC COMMENT (not a runtime site)', reason: 'the occurrence sits inside a comment span, so it is documentation rather than a runtime effect' };

  // "No assignment" means no assignment ANYWHERE in the body, including inside a nested callback.
  // Counting only the top-level writes here would file an effect whose sole write sits inside an
  // `untrack(() => { … })` as call-only, which is the least informative label available for it.
  // Depth still decides TOTALITY below; it does not decide existence.
  const kept = assignments;
  const targets = [...new Set(kept.map((a) => a.target))];

  if (targets.length === 0)
    return { bucket: 'NO ASSIGNMENT (call-only side effect)', reason: 'the body performs a call and produces no value, and a derived produces a value' };
  if (hasTeardownReturn(body))
    return { bucket: 'TEARDOWN (returns cleanup fn)', reason: 'the body returns a cleanup function and a derived has no cleanup phase' };
  if (isAsyncHeader || ASYNC_RE.test(body))
    return { bucket: 'ASYNC', reason: 'the body awaits, so its value is not a synchronous function of its inputs' };
  if (UNTRACK_RE.test(body))
    return { bucket: 'UNTRACK (read/write same state)', reason: 'untrack is a deliberate dependency-graph carve-out that conversion would erase' };
  if (NAV_RE.test(body)) return { bucket: 'NAV', reason: 'the body navigates or invalidates, which is an action rather than a value' };
  if (DOM_RE.test(body)) return { bucket: 'DOM', reason: 'the body touches the DOM, which a derived cannot do' };

  const bindable = targets.filter((t) => !/[.[]/.test(t) && isBindableProp(fileMasked, t));
  if (bindable.length)
    return {
      bucket: 'WRITES $bindable PROP',
      reason: `the target ${bindable[0]} is a bindable prop, and Svelte 5 does not permit a derived value to hold a bindable`,
      contract: '$bindable'
    };

  const members = targets.filter((t) => /[.[]/.test(t));
  if (members.length)
    return {
      bucket: 'WRITES MEMBER / EXTERNAL OBJECT',
      reason: `the write to ${members[0]} mutates a foreign object, which is a side effect by definition`
    };

  if (targets.length > 1)
    return {
      bucket: 'MULTI-TARGET',
      reason: `${targets.length} independent targets (${targets.join(', ')}) would need one derived each plus a restructure`,
      variant: targets.length
    };

  const target = targets[0];
  const total = kept.some((a) => a.braceDepth === 0 && a.parenDepth === 0 && !a.guarded && a.target === target);
  if (!total)
    return {
      bucket: 'CONDITIONAL SINGLE-TARGET (not total)',
      reason: `${target} is not assigned on every path through the body, so the previous value survives the false path`
    };

  if (!isLocalStateBinding(fileMasked, target))
    return {
      bucket: 'NON-LOCAL / NON-$STATE TARGET',
      reason: `${target} is not declared as a plain local $state binding in this module`
    };

  const elsewhere = findAssignments(fileMasked).filter(
    (a) => a.target === target && (a.index < bodyAbs.start || a.index >= bodyAbs.end)
  );
  if (elsewhere.length)
    return {
      bucket: 'SECOND WRITER IN MODULE (operational)',
      reason: `${target} is also written outside this effect, so its value is a function of its history rather than of its inputs`,
      handReview: true
    };

  if (hasChildTwoWayBinding(fileMasked, target))
    return {
      bucket: 'CHILD TWO-WAY BINDING (operational)',
      reason: `${target} is bound two-way to a child, which writes it back, so the effect only seeds a value the child then owns`,
      handReview: true
    };

  return {
    bucket: 'CONVERTIBLE',
    reason: `one total write to the local $state binding ${target}`,
    handReview: true
  };
}

// ---------------------------------------------------------------------------
// Census construction
// ---------------------------------------------------------------------------

export function buildCensus(scanRoot = DEFAULT_SCAN_ROOT) {
  if (!existsSync(scanRoot)) throw new Error(`scan root not found: ${scanRoot}`);

  const rows = [];
  for (const file of walk(scanRoot)) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (text.includes('\u0000')) continue;
    if (!text.includes(NEEDLE)) continue;

    const ext = file.slice(file.lastIndexOf('.'));
    const { masked, isComment } = maskSource(text, ext);
    const props = declaredProps(masked);
    const displayPath = (
      file.startsWith(REPO_ROOT + sep) ? relative(REPO_ROOT, file) : relative(scanRoot, file)
    ).split(sep).join('/');

    let from = 0;
    for (;;) {
      const at = text.indexOf(NEEDLE, from);
      if (at === -1) break;
      from = at + NEEDLE.length;

      const { line, column } = lineAndColumn(text, at);
      const siteLabel = `${displayPath}:${line}:${column}`;
      const openParen = at + NEEDLE.length - 1;
      const closeParen = matchDelimiter(masked, openParen, '(', ')', siteLabel);
      const inComment = isComment[at];
      const extracted = extractBody(masked, text, openParen + 1, closeParen, siteLabel, inComment);
      const bodyForScan = maskNestedEffects(extracted.body);
      const assignments = findAssignments(bodyForScan);

      const verdict = classify({
        inComment,
        body: bodyForScan,
        isAsyncHeader: extracted.isAsyncHeader,
        assignments,
        fileMasked: masked,
        bodyAbs: { start: extracted.absStart, end: extracted.absEnd }
      });

      const bucket = verdict.variant ? `${verdict.bucket} (${verdict.variant} targets)` : verdict.bucket;
      let contract = verdict.contract ?? 'none';
      if (contract === 'none') {
        // A DIRECT invocation only: `prop(` or `prop?.(`, with nothing between the name and the
        // parenthesis. Allowing whitespace here made a ternary (`ordered\n ? (value ...)`) read as
        // a call to the prop `ordered`, which is how a loose heuristic invents a contract change.
        for (const prop of props) {
          if (new RegExp(`(?:^|[^\\w$.])${escapeRe(prop)}(?:\\?\\.)?\\(`).test(bodyForScan)) {
            contract = 'public API';
            break;
          }
        }
      }

      rows.push({
        path: displayPath,
        line,
        column,
        site: `${displayPath}:${line}`,
        pure: ['CONVERTIBLE', 'SECOND WRITER IN MODULE (operational)', 'CHILD TWO-WAY BINDING (operational)'].includes(
          verdict.bucket
        )
          ? 'yes'
          : 'no',
        bucket,
        disposition: `RECORDED - ${verdict.reason}`,
        contract,
        handReview: Boolean(verdict.handReview)
      });
    }
  }

  rows.sort((a, b) => a.path.localeCompare(b.path, 'en') || a.line - b.line || a.column - b.column);

  const bucketCounts = {};
  for (const row of rows) bucketCounts[row.bucket] = (bucketCounts[row.bucket] ?? 0) + 1;

  const sum = Object.values(bucketCounts).reduce((acc, n) => acc + n, 0);
  if (sum !== rows.length) throw new Error(`bucket counts sum to ${sum} but there are ${rows.length} rows`);

  return { scanRoot, rows, bucketCounts, files: [...new Set(rows.map((r) => r.path))].length };
}

export function renderMarkdown(census) {
  const lines = [];
  lines.push('| # | Site | Pure fn of inputs? | Bucket | Disposition | Contract change? |');
  lines.push('|---|---|---|---|---|---|');
  census.rows.forEach((row, index) => {
    lines.push(
      `| ${index + 1} | \`${row.site}\` | ${row.pure} | ${row.bucket} | ${row.disposition} | ${row.contract} |`
    );
  });
  lines.push('');
  lines.push('| Bucket | Count |');
  lines.push('|---|---:|');
  const ordered = Object.keys(census.bucketCounts).sort((a, b) => {
    const rank = (name) => BUCKET_PRECEDENCE.findIndex((b) => name.startsWith(b));
    return rank(a) - rank(b) || a.localeCompare(b, 'en');
  });
  for (const bucket of ordered) lines.push(`| ${bucket} | ${census.bucketCounts[bucket]} |`);
  lines.push(`| **TOTAL** | **${census.rows.length}** |`);
  lines.push('');
  return `${lines.join('\n')}`;
}

export function assertTotal(census, expected) {
  if (!Number.isInteger(expected)) throw new Error(`--assert-total needs an integer, got ${expected}`);
  if (census.rows.length !== expected) {
    throw new Error(
      `total assertion failed: the classifier found ${census.rows.length} sites but was asserted against ${expected}. ` +
        'The census population moves as effects are converted or deleted, so re-run the criterion grep and pass its value.'
    );
  }
}

// ---------------------------------------------------------------------------
// Embedded behaviour suite - the five behaviours plan 159-03 task 1 specifies
// ---------------------------------------------------------------------------

function makeFixtureTree() {
  const root = mkdtempSync(join(tmpdir(), 'effect-census-'));
  mkdirSync(join(root, 'nested'), { recursive: true });

  // Two openings on ONE source line, plus an effect nested inside another effect's body.
  writeFileSync(
    join(root, 'Adjacency.svelte'),
    [
      '<script lang="ts">',
      '  let a = $state(0);',
      '  let b = $state(0);',
      '  const twoOnOneLine = () => { $effect(() => { a = 1; }); $effect(() => { b = 2; }); };',
      '  $effect(() => {',
      '    $effect(() => {',
      '      a = 3;',
      '    });',
      '  });',
      '</script>'
    ].join('\n')
  );

  // A body with no assignment at all - the call-only case.
  writeFileSync(
    join(root, 'nested', 'CallOnly.svelte'),
    ['<script lang="ts">', '  $effect(() => {', '    doSomething();', '  });', '</script>'].join('\n')
  );

  return root;
}

function selfTest() {
  const failures = [];
  const check = (name, fn) => {
    try {
      fn();
      process.stdout.write(`  ok   ${name}\n`);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
      process.stdout.write(`  FAIL ${name}: ${error.message}\n`);
    }
  };

  const root = makeFixtureTree();
  const census = buildCensus(root);
  const trueTotal = census.rows.length;

  check('an assertion equal to the true total passes', () => {
    assertTotal(census, trueTotal);
  });

  check('an assertion one below the true total fails and names the mismatch', () => {
    let message = '';
    try {
      assertTotal(census, trueTotal - 1);
    } catch (error) {
      message = error.message;
    }
    if (!message) throw new Error('expected a throw, got none');
    if (!message.includes(String(trueTotal)) || !message.includes(String(trueTotal - 1))) {
      throw new Error(`message did not name both numbers: ${message}`);
    }
  });

  check('an assertion one above the true total fails and names the mismatch', () => {
    let message = '';
    try {
      assertTotal(census, trueTotal + 1);
    } catch (error) {
      message = error.message;
    }
    if (!message) throw new Error('expected a throw, got none');
    if (!message.includes(String(trueTotal)) || !message.includes(String(trueTotal + 1))) {
      throw new Error(`message did not name both numbers: ${message}`);
    }
  });

  check('two runs over an unchanged tree emit byte-identical output', () => {
    const first = renderMarkdown(buildCensus(root));
    const second = renderMarkdown(buildCensus(root));
    if (first !== second) throw new Error('output differed between runs');
  });

  check('a body with no assignment lands in the call-only bucket, not skipped', () => {
    const row = census.rows.find((r) => r.path.endsWith('CallOnly.svelte'));
    if (!row) throw new Error('the call-only site was skipped entirely');
    if (row.bucket !== 'NO ASSIGNMENT (call-only side effect)') {
      throw new Error(`expected the call-only bucket, got ${row.bucket}`);
    }
    if (row.disposition.slice(0, 8) !== 'RECORDED') {
      throw new Error(`expected a RECORDED disposition, got ${row.disposition}`);
    }
  });

  check('two openings on one line and a nested effect are distinct rows', () => {
    const onLine4 = census.rows.filter((r) => r.path.endsWith('Adjacency.svelte') && r.line === 4);
    if (onLine4.length !== 2) throw new Error(`expected 2 rows on line 4, got ${onLine4.length}`);
    if (onLine4[0].column === onLine4[1].column) throw new Error('the two rows share a column key');
    const nested = census.rows.filter((r) => r.path.endsWith('Adjacency.svelte') && (r.line === 5 || r.line === 6));
    if (nested.length !== 2) throw new Error(`expected the outer and inner effect as 2 rows, got ${nested.length}`);
  });

  check('bucket counts sum to the row count', () => {
    const sum = Object.values(census.bucketCounts).reduce((acc, n) => acc + n, 0);
    if (sum !== census.rows.length) throw new Error(`buckets sum to ${sum}, rows are ${census.rows.length}`);
  });

  if (failures.length) {
    process.stdout.write(`\n${failures.length} failing behaviour(s)\n`);
    process.exit(1);
  }
  process.stdout.write('\nall behaviours pass\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main(argv) {
  const args = argv.slice(2);
  const flag = (name) => {
    const i = args.indexOf(name);
    return i === -1 ? undefined : args[i + 1];
  };

  if (args.includes('--self-test')) {
    selfTest();
    return;
  }

  const scanRoot = flag('--root') ? resolve(flag('--root')) : DEFAULT_SCAN_ROOT;
  const census = buildCensus(scanRoot);

  const expected = flag('--assert-total');
  if (expected !== undefined) assertTotal(census, Number(expected));

  const format = flag('--format') ?? 'md';
  process.stdout.write(format === 'json' ? `${JSON.stringify(census, null, 2)}\n` : renderMarkdown(census));
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    main(process.argv);
  } catch (error) {
    process.stderr.write(`classify-effects: ${error.message}\n`);
    process.exit(1);
  }
}

export { DEFAULT_SCAN_ROOT, NEEDLE };
