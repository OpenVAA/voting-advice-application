#!/usr/bin/env node

/**
 * UK/US SYMBOL-NAME AUDIT (phase 152, requirement REVIEW-HYG-04 / D-A6).
 *
 * The incident this file exists for: a pre-ship review asked for one audit of UK-vs-US
 * spellings in SYMBOL NAMES, and criterion 4's stated purpose is that the audit be committed
 * "so the next reader does not repeat it". An audit that lives only in a research document is
 * an audit the next reader re-derives — and re-deriving it is exactly where it goes wrong. The
 * first derivation, a broad stem match over all lines, produced **874 hits of which roughly
 * 98% were false**: `disc` matches `discover`/`disconnect`/`discourse`, `axe` matches the a11y
 * tool, `analys*` matches `FactorAnalysis` (analysis is US spelling too), and `labelled`
 * matches **`aria-labelledby`**, a W3C attribute name that must never be renamed. The curated
 * whole-word pass in this file produced 16 in-scope hits over 3 identifiers in 3 files — NOT the
 * 14 `152-RESEARCH.md` § 9.2's hand-written table implies, which omits the two lines carrying both
 * `offences` and `describeOffence`; § 9.1's own tool output (`8x offences`) already said 16. Plan
 * `152-04` renamed all 16, so this now reports 0. So the derivation is committed here, list and
 * all, and the next audit is `node …/uk-identifier-audit.mjs`; the full result, its out-of-scope
 * register and the deliberate identifier-vs-key mismatch live in `…/152-SPELLING-AUDIT.md`.
 *
 * ── WHAT IS AN IDENTIFIER, AND WHAT IS NOT — the `--scope-note` ─────────────
 * D-A6 scopes this to SYMBOL NAMES. Everything below is deliberately OUT of scope, and each
 * exclusion is enforced mechanically rather than left to the reader's judgement:
 *
 *   - COMMENTS. Blanked by the shared classifier before tokenizing. 27 `organisation(s)` sites
 *     in `packages/dev-seed/src/templates/e2e/perm/*.ts` topology docblocks, `behaviour` /
 *     `colour` / `grey` / `cancelled` in component `<!--@component-->` docstrings, and
 *     `offences` in `packages/dev-seed/src/template/permittedKeys.ts` prose are all comment
 *     text. They are recorded in `152-SPELLING-AUDIT.md` as the out-of-scope register; they
 *     are not renames.
 *   - STRING LITERALS. Blanked before tokenizing, including template literals (whose `${…}`
 *     interpolations ARE re-scanned, because those are code). This is what keeps the
 *     `'perm-localisation-positive'` template KEY out of the result while its binding
 *     identifier `permLocalisationPositiveTemplate` stays in — the distinction D-A6 turns on.
 *     The key is the `--template` CLI argument, the module filename, and the stem of 10+
 *     Playwright project names, `testMatch` regexes and setup/teardown names. Renaming it is
 *     an E2E-suite-wide change, and CLAUDE.md's cardinal E2E rule makes that an unacceptable
 *     rider on a comment-hygiene phase.
 *   - SVELTE MARKUP. For `.svelte` only the `<script>` regions are scanned. Markup text and
 *     attribute names are not symbols: `apps/docs/src/routes/+page.svelte` renders
 *     "🌍 Fully localisable" as user-facing copy, and changing that is a copy decision, not a
 *     hygiene one. It is also what keeps `aria-labelledby` out of the result by construction
 *     rather than by a special case in the word list.
 *   - FILENAMES and PLAYWRIGHT PROJECT NAMES. Not tokens in any scanned file's code; out of
 *     scope by the same string/path argument.
 *
 * ── THE WORD LIST ───────────────────────────────────────────────────────────
 * 62 stems, whole-word, matched against identifiers split on camelCase boundaries and on `_`
 * and `$`. Copied verbatim from `152-RESEARCH.md` § "Code Examples" together with its own
 * exclusion rationale, so that the list and the reason for each omission travel together. A
 * later reader who adds `analys*` or a bare `disc` to it will reproduce the 874-hit result.
 *
 * ⚠ NO DASH RULE, and no rule of any other kind. This file matches words in identifiers. It
 * does not normalise punctuation, does not touch comments, and writes nothing at all.
 *
 * Usage:
 *   node .planning/phases/152-comment-naming-hygiene-sweep/scripts/uk-identifier-audit.mjs
 *
 * Exit codes — the caller must be able to branch on the status alone:
 *   0  no in-scope UK-spelled identifier found
 *   1  at least one in-scope hit, or a named precondition failure (a file or the tracked-file
 *      set this audit could not read). An input it cannot read is spelling it cannot check,
 *      and is never read as clean — this fails closed.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { commentSpans, enumerateTrackedFiles, ExemptPathError, REPO_ROOT, SCAN_ROOTS } from './hygiene-codemod.mjs';

const SELF = '.planning/phases/152-comment-naming-hygiene-sweep/scripts/uk-identifier-audit.mjs';

// RESEARCH § 9.1's extension set. `.sql` is in because identifiers live in function and column
// names; `.yaml`/`.sh` are out because they carry configuration keys, not symbols.
const AUDIT_EXTS = ['ts', 'tsx', 'js', 'mjs', 'cjs', 'svelte', 'sql'];
const GLOBS = SCAN_ROOTS.map((root) => `${root}/**/*.{${AUDIT_EXTS.join(',')}}`);

// ── The curated UK word list (copied verbatim from 152-RESEARCH.md § Code Examples) ──
// Deliberately EXCLUDES: analys* as a noun (analysis is US too — the verb forms below ARE
// UK-only), disc (discover/disconnect/discourse), axe (the a11y tool), and any pattern that
// would reach `aria-labelledby` (a W3C attribute name, and markup besides).
const UK = [
  /^organis(e|ed|es|ing|ation|ations|ational)?$/,
  /^recognis(e|ed|es|ing|able)?$/,
  /^normalis(e|ed|es|ing|ation)?$/,
  /^initialis(e|ed|es|ing|ation)?$/,
  /^serialis(e|ed|es|ing|ation)?$/,
  /^authoris(e|ed|es|ing|ation)?$/,
  /^customis(e|ed|es|ing|ation)?$/,
  /^optimis(e|ed|es|ing|ation)?$/,
  /^minimis(e|ed|es|ing)?$/,
  /^maximis(e|ed|es|ing)?$/,
  /^categoris(e|ed|es|ing|ation)?$/,
  /^localis(e|ed|es|ing|ation|able)?$/,
  /^visualis(e|ed|es|ing|ation)?$/,
  /^synchronis(e|ed|es|ing|ation)?$/,
  /^prioritis(e|ed|es|ing|ation)?$/,
  /^summaris(e|ed|es|ing)?$/,
  /^standardis(e|ed|es|ing|ation)?$/,
  /^utilis(e|ed|es|ing|ation)?$/,
  /^randomis(e|ed|es|ing|ation)?$/,
  /^sanitis(e|ed|es|ing|ation)?$/,
  /^finalis(e|ed|es|ing)?$/,
  /^analys(e|ed|es|ing|er)$/,
  /^colour(s|ed|ing|ful)?$/,
  /^behaviour(s|al|ally)?$/,
  /^favourite(s)?$/,
  /^flavour(s|ed)?$/,
  /^honour(s|ed)?$/,
  /^labour(s|ed)?$/,
  /^neighbour(s|ing|hood)?$/,
  /^centre(s|d)?$/,
  /^metre(s)?$/,
  /^fibre(s)?$/,
  /^licence(s|d)?$/,
  /^defence(s)?$/,
  /^offence(s)?$/,
  /^practis(e|ed|es|ing)$/,
  /^programme(s|d)?$/,
  /^catalogue(s|d)?$/,
  /^dialogue(s)?$/,
  /^analogue(s)?$/,
  /^grey(s|ed|ish)?$/,
  /^cancell(ed|ing)$/,
  /^modell(ed|ing)$/,
  /^labell(ed|ing)$/,
  /^travell(ed|ing|er)$/,
  /^fulfil(s|ment)?$/,
  /^enrol(s|ment)?$/,
  /^skilful(ly)?$/,
  /^judgement(s)?$/,
  /^acknowledgement(s)?$/,
  /^whilst$/,
  /^amongst$/,
  /^artefact(s)?$/,
  /^storey(s)?$/,
  /^tyre(s)?$/,
  /^sceptic(al|ism)?$/,
  /^mould(s|ed|ing)?$/,
  /^cheque(s)?$/,
  /^manoeuvre(s|d)?$/,
  /^aeroplane(s)?$/
];

/** Copied verbatim from RESEARCH § Code Examples. camelCase, then `_` and `$`. */
const splitIdent = (id) =>
  id
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_$]/g, ' ')
    .split(/\s+/);

const IDENT_RE = /[A-Za-z_$][A-Za-z0-9_$]*/g;

function extensionOf(rel) {
  return (rel.split('.').pop() || '').toLowerCase();
}

/** Replace every character of `[from, to)` with a space, preserving offsets and newlines. */
function blank(chars, from, to) {
  for (let i = from; i < to; i++) if (chars[i] !== '\n') chars[i] = ' ';
}

/**
 * `.svelte` markup is not code. Keep only the bodies of `<script …>` elements; blank the rest.
 * This is what puts `aria-labelledby` and the rendered "Fully localisable" copy out of reach
 * structurally, rather than by a word-list special case that a later edit could drop.
 */
function blankNonScriptRegions(chars) {
  const text = chars.join('');
  const keep = [];
  const openRe = /<script\b[^>]*>/gi;
  let m;
  while ((m = openRe.exec(text)) !== null) {
    const bodyStart = m.index + m[0].length;
    const close = text.toLowerCase().indexOf('</script>', bodyStart);
    keep.push([bodyStart, close < 0 ? text.length : close]);
    openRe.lastIndex = close < 0 ? text.length : close;
  }
  let cursor = 0;
  for (const [s, e] of keep) {
    blank(chars, cursor, s);
    cursor = e;
  }
  blank(chars, cursor, chars.length);
}

/**
 * A `/` starts a REGEX LITERAL, rather than a division, when the last significant token before
 * it cannot end an expression. Measured need: `tests/playwright.config.ts` binds its Playwright
 * projects with `testMatch: /perm-localisation-positive\.setup\.ts/`, and a regex matching a
 * FILENAME is no more a symbol than the filename is. Without this, three such literals surface
 * as `localisation` identifier hits — the exact false-positive class RESEARCH § 9.1 put out of
 * scope when it resolved `localisation` to Playwright project naming.
 */
const REGEX_PRECEDING = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '~', '^', '<', '>']);
const REGEX_PRECEDING_WORDS = new Set([
  'return',
  'typeof',
  'instanceof',
  'case',
  'in',
  'of',
  'do',
  'else',
  'yield',
  'await',
  'new',
  'delete',
  'void'
]);

function startsRegex(chars, i) {
  let k = i - 1;
  while (k >= 0 && (chars[k] === ' ' || chars[k] === '\t' || chars[k] === '\n' || chars[k] === '\r')) k--;
  if (k < 0) return true;
  if (REGEX_PRECEDING.has(chars[k])) return true;
  if (!/[A-Za-z0-9_$]/.test(chars[k])) return false;
  let start = k;
  while (start >= 0 && /[A-Za-z0-9_$]/.test(chars[start])) start--;
  return REGEX_PRECEDING_WORDS.has(chars.slice(start + 1, k + 1).join(''));
}

/** Blank a regex literal's body. Returns the index just past it, or `-1` if it is a division. */
function blankRegexLiteral(chars, i) {
  const n = chars.length;
  let j = i + 1;
  let inClass = false;
  while (j < n) {
    const c = chars[j];
    if (c === '\\') {
      j += 2;
      continue;
    }
    if (c === '\n') return -1; // a regex literal cannot span a line: it was a division
    if (c === '[') inClass = true;
    else if (c === ']') inClass = false;
    else if (c === '/' && !inClass) break;
    j++;
  }
  if (j >= n) return -1;
  blank(chars, i + 1, j);
  return j + 1;
}

/**
 * Blank every string literal, every regex literal, and every template literal EXCEPT its
 * `${…}` interpolations, which are code and are left intact. Runs after the comment blanking,
 * so a quote character inside a comment cannot open a string.
 */
function blankStringLiterals(chars) {
  const n = chars.length;
  let i = 0;
  while (i < n) {
    const ch = chars[i];
    if (ch === '/' && startsRegex(chars, i)) {
      const past = blankRegexLiteral(chars, i);
      i = past < 0 ? i + 1 : past;
      continue;
    }
    if (ch !== "'" && ch !== '"' && ch !== '`') {
      i++;
      continue;
    }
    const quote = ch;
    let j = i + 1;
    while (j < n) {
      if (chars[j] === '\\') {
        j += 2;
        continue;
      }
      if (quote === '`' && chars[j] === '$' && chars[j + 1] === '{') {
        // Blank the literal text up to the interpolation, then skip the interpolation whole
        // (tracking nesting) so the identifiers inside it survive to be tokenized.
        blank(chars, i + 1, j);
        let depth = 1;
        let k = j + 2;
        while (k < n && depth > 0) {
          if (chars[k] === '{') depth++;
          else if (chars[k] === '}') depth--;
          k++;
        }
        i = k - 1;
        j = k;
        // Re-enter the literal after the interpolation.
        while (j < n) {
          if (chars[j] === '\\') {
            j += 2;
            continue;
          }
          if (chars[j] === '`' || (chars[j] === '$' && chars[j + 1] === '{')) break;
          j++;
        }
        blank(chars, i + 1, j);
        i = j;
        if (chars[j] === '`') {
          i = j + 1;
          j = n + 1;
          break;
        }
        continue;
      }
      if (chars[j] === quote) break;
      // A single-quoted or double-quoted literal cannot span a newline; if one does, it was
      // an apostrophe in text the classifier could not reach. Stop at the newline rather than
      // swallowing the rest of the file.
      if (quote !== '`' && chars[j] === '\n') break;
      j++;
    }
    if (j > n) continue;
    blank(chars, i + 1, Math.min(j, n));
    i = Math.min(j, n) + 1;
  }
}

/** Blank comments, markup and strings, then return the code-only text at original offsets. */
function codeOnlyText(rel, text) {
  const fam = extensionOf(rel) === 'sql' ? { c: true, sql: true } : { c: true, html: extensionOf(rel) === 'svelte' };
  const chars = [...text];
  const lines = text.split('\n');
  const state = { inBlockC: false, inBlockHtml: false, inTemplate: false };
  let offset = 0;
  for (const line of lines) {
    for (const [s, e] of commentSpans(line, fam, state)) blank(chars, offset + s, offset + e);
    offset += line.length + 1;
  }
  if (extensionOf(rel) === 'svelte') blankNonScriptRegions(chars);
  blankStringLiterals(chars);
  return chars.join('');
}

function main() {
  let violations = 0;
  const violate = (message) => {
    violations++;
    console.error(`[ERROR] ${SELF}: ${message}`);
  };

  let files;
  try {
    ({ files } = enumerateTrackedFiles(GLOBS, REPO_ROOT));
  } catch (error) {
    if (error instanceof ExemptPathError) violate(`${error.message} — this audit never reads an exempt tree.`);
    else violate(`could not enumerate ${GLOBS.join(' ')} (${error.message}). This fails closed.`);
    process.exitCode = 1;
    return;
  }

  const hits = [];
  let scanned = 0;
  for (const rel of files.sort()) {
    let text;
    try {
      text = readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
    } catch (error) {
      violate(`could not read '${rel}' (${error.message}). This fails closed.`);
      continue;
    }
    scanned++;

    const code = codeOnlyText(rel, text);
    const lineStarts = [0];
    for (let i = 0; i < code.length; i++) if (code[i] === '\n') lineStarts.push(i + 1);

    IDENT_RE.lastIndex = 0;
    let match;
    while ((match = IDENT_RE.exec(code)) !== null) {
      const ident = match[0];
      for (const word of splitIdent(ident)) {
        const w = word.toLowerCase();
        if (!w || !UK.some((re) => re.test(w))) continue;
        let lo = 0;
        let hi = lineStarts.length - 1;
        while (lo < hi) {
          const mid = (lo + hi + 1) >> 1;
          if (lineStarts[mid] <= match.index) lo = mid;
          else hi = mid - 1;
        }
        hits.push({ file: rel, line: lo + 1, ident, word });
      }
    }
  }

  for (const h of hits) console.log(`${h.file}:${h.line} ${h.ident} ${h.word}`);

  const distinctIdents = new Set(hits.map((h) => h.ident));
  const distinctFiles = new Set(hits.map((h) => h.file));
  console.log(
    `\nUK/US identifier audit (phase 152: REVIEW-HYG-04) — files scanned: ${scanned}; ` +
      `in-scope hits: ${hits.length} occurrence(s) over ${distinctIdents.size} distinct identifier(s) ` +
      `in ${distinctFiles.size} file(s).`
  );
  if (hits.length === 0) console.log('No UK-spelled identifier found. Recorded as such — "none found" is a result.');

  for (const h of hits) violations++;
  process.exitCode = violations > 0 ? 1 : 0;
}

main();
