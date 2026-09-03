#!/usr/bin/env node

/**
 * CROSS-RUNTIME ENV-PAIR REGISTRY GUARD (phase 153, plan 10 — operator-requested).
 *
 * WHICH OF THE TWO SCRIPTS THIS IS, STATED FIRST BECAUSE CONFUSING THEM WOULD BE THE WHOLE
 * FAILURE. This file is the STATIC one. It proves the PAIRING CONTRACT: that every cross-runtime
 * twin discoverable in source is documented as a pair in the co-located block of `.env.example`.
 * It reads SOURCE and a checked-in template, never an operator's environment, so it runs inside
 * `lint:check` where there are no secrets and no values to compare. IT CANNOT SEE VALUES AND
 * THEREFORE CANNOT DETECT DRIFT. Its sibling `scripts/assert-env-pairs-agree.mjs` is the RUNTIME
 * one: handed an env file, it compares the two members' VALUES. Shipping only this file while
 * calling it a drift guard would be a gate that examines nothing and reports green — the exact
 * shape this milestone kept finding. See `153-ENV-PAIRS.md` for what NEITHER can see.
 *
 * The incident this file exists for: four variables exist twice, once per runtime.
 *
 *   Deno Edge Function          Frontend
 *   SUPABASE_URL                PUBLIC_SUPABASE_URL
 *   SUPABASE_ANON_KEY           PUBLIC_SUPABASE_ANON_KEY
 *   IDENTITY_PROVIDER_CLIENT_ID PUBLIC_IDENTITY_PROVIDER_CLIENT_ID
 *   IDENTITY_PROVIDER_TYPE      PUBLIC_IDENTITY_PROVIDER_TYPE
 *
 * The frontend and Deno copies of the identity-provider configuration have drifted apart TWICE,
 * both times undetected, caught once by a code review and once by a plan that happened to
 * re-measure. Phase 155's verifier recorded the missing drift guard as the residual risk that
 * survived that phase. A class that has reopened twice gets a standing check, not a third fix.
 *
 * THE PAIRS ARE DERIVED, NEVER ENUMERATED. There is deliberately no list of the four names in
 * this file — the table above is prose in a comment and is not read by anything. A hand-kept list
 * would rot in exactly the way the two configurations it guards already drifted twice, and the
 * fifth pair would be discovered the way the first four were. A PAIR is any `NAME` such that the
 * Deno side contains a `Deno.env.get('NAME')` read in CODE under `apps/supabase/supabase/functions`
 * and the frontend side contains the identifier `PUBLIC_NAME` in CODE under `apps/frontend/src`.
 *
 * WHY THE FRONTEND PREDICATE IS THE BARE IDENTIFIER RATHER THAN A READ SHAPE. Today every public
 * variable enters the frontend through one line of `apps/frontend/src/lib/utils/constants.ts`
 * (`env.PUBLIC_X` off `$env/dynamic/public`) and reaches its consumers as `constants.PUBLIC_X`.
 * Matching only `env.PUBLIC_X` would make the guard evadable by anyone who reads the variable a
 * different way — `import.meta.env`, `process.env`, a `$env/static/public` named import, a
 * `vi.mock` fixture — and an evadable guard is the failure mode, not the false positive. The
 * over-breadth is bounded by the CONJUNCTION: an identifier only becomes a pair when the Deno side
 * independently reads the same name from its own environment. Three identity variables
 * (`IDENTITY_PROVIDER_ISSUER`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`)
 * are single-source — the same spelling in both runtimes — and correctly derive no pair.
 *
 * COMMENTS ARE EXCLUDED STRUCTURALLY, AND THAT IS LOAD-BEARING IN BOTH DIRECTIONS. Phase 155 wrote
 * four docstrings that quote `Deno.env.get('X')` in prose to explain the shape it abolished; a
 * naive scan reads those as four environment reads of a variable named `X`. A guard that reddened
 * on the documentation explaining it would be unkeepable, and one that counted prose as code would
 * report pairs that do not exist. So this file imports the repository's shared, quote-aware and
 * template-literal-aware comment-span classifier (`scripts/lib/comment-spans.mjs`, extracted by
 * phase 155 plan 05 precisely so a fourth hand-rolled copy would not be written) and discards any
 * match whose start index falls inside a comment span. Matching on raw text and excluding by index
 * keeps line numbers exact by construction, with no text mutation to keep in step.
 *
 * WHAT IS ASSERTED ABOUT `.env.example`, in four parts:
 *
 *   1. Both members of every derived pair are ASSIGNED there, outside comments. A comment that
 *      merely names a variable documents nothing a reader can copy.
 *   2. Each member is assigned exactly ONCE. Two assignments of one name make the effective value
 *      depend on file order, which is not a contract anyone can read off the page.
 *   3. The pair members are CONTIGUOUS: taken in file order, the assignments belonging to pairs
 *      form one unbroken run with no unrelated assignment inside it, and each pair's two members
 *      are adjacent to each other. Scattering a pair across three sections is how the twins became
 *      invisible to review in the first place.
 *   4. The block is introduced by a comment that states the agreement contract (`same value`) and
 *      names BOTH scan roots, so the reader learns which runtime reads which spelling from the
 *      file itself rather than from this script.
 *
 * NO OPT-OUT, BY CONSTRUCTION. No flag, no ignore file, no per-path exception roster, no warn-only
 * tier. Excusing a case requires editing this file, which is then reviewed as the decision it is.
 *
 * THIS FILE IS NOT ITSELF SCANNED, AND THAT IS DELIBERATE. The scan roots are two named constants
 * pointing at `apps/`; `scripts/`, `packages/`, `tests/` and `.planning/` are outside them. The
 * guard, its test, and the phase record all NAME these variables in prose, and a guard whose own
 * artefacts trip it is a guard nobody can commit — a failure this phase has now seen three times.
 *
 * Report order is pair name ascending, then check, so two runs over an unchanged tree emit
 * byte-identical stderr and a diff of two captures is evidence rather than noise.
 *
 * Node built-ins only, no build step, no dependency: this runs before anything is built.
 *
 * Usage:
 *   node scripts/assert-env-pair-registry.mjs
 *
 * Exit codes:
 *   0 - every derived pair is registered in the co-located `.env.example` block
 *   1 - at least one unregistered, duplicated, scattered or unexplained pair, or a named
 *       precondition failure (a scan root or template this guard could not read). An input this
 *       guard cannot read is a property it cannot verify — this fails closed.
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { commentSpans, familyFor, inSpans } from './lib/comment-spans.mjs';

const SELF = 'scripts/assert-env-pair-registry.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/** Hard-coded. Not configurable, not overridable — see NO OPT-OUT in the docblock. */
const DENO_ROOT = path.join('apps', 'supabase', 'supabase', 'functions');
const FRONTEND_ROOT = path.join('apps', 'frontend', 'src');
const ENV_EXAMPLE = '.env.example';

const DENO_EXTENSIONS = ['.ts'];
const FRONTEND_EXTENSIONS = ['.ts', '.js', '.svelte'];

/** The prefix Vite requires before it will expose a variable to the client bundle. */
const PUBLIC_PREFIX = 'PUBLIC_';

/** `.env.example` has no extension the shared classifier knows; its comments are `#` to EOL. */
const ENV_FAMILY = { hash: true };

/**
 * A Deno environment read. Anchored on `Deno.env.get(` and capturing the quoted name; the
 * surrounding expression is irrelevant here, unlike in `assert-edge-env-defaults.mjs` where the
 * defaulting operator after the read is the whole predicate.
 */
const DENO_READ_RE = /Deno\.env\.get\(\s*['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]\s*\)/g;

/**
 * A whole `PUBLIC_…` identifier. The lookbehind stops `MY_PUBLIC_THING` from being read as a
 * public variable named `THING`; the lookahead stops `PUBLIC_FOOish` from being read as `FOO`.
 *
 * The capture is the FULL identifier including the prefix, not the suffix. Capturing the suffix is
 * the first thing this file got wrong, and the census line is what said so: with `PUBLIC_` stripped
 * from the keys the intersection against the Deno names could never match, and the guard printed
 * `pairs derived: 0 … 0 violation(s)` and exited 0 over a tree with four live pairs. A bare zero
 * would have read as success; the census is why it read as a bug.
 */
const PUBLIC_TOKEN_RE = /(?<![A-Za-z0-9_$])(PUBLIC_[A-Z0-9_]*[A-Z0-9])(?![A-Za-z0-9_$])/g;

/** An assignment line in an env file, applied to the CODE portion of the line only. */
const ASSIGNMENT_RE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;

/**
 * The phrases the `.env.example` block header must contain. Each is the machine-checkable residue
 * of one clause of the contract: that the members must agree, and which runtime reads which. They
 * are checked against `.env.example` ALONE — this file and the phase record contain them too, and
 * a check that scanned itself would be the self-invalidating shape this phase has hit three times.
 */
const HEADER_PHRASES = ['same value', DENO_ROOT.split(path.sep).join('/'), FRONTEND_ROOT.split(path.sep).join('/')].map(
  (phrase) => phrase.toLowerCase()
);

let violations = 0;

function fail(message) {
  console.error(`[ERROR] ${SELF}: ${message}`);
}

function violate(message) {
  violations++;
  fail(message);
}

/**
 * Every file with one of `extensions` under `rootRel`, as repo-relative paths, sorted.
 *
 * Sorted because directory iteration order is a filesystem property this guard may not inherit:
 * unsorted, two runs over an unchanged tree could report the same findings in different orders and
 * a diff of two captures would be noise instead of evidence.
 */
function enumerateFiles(rootRel, extensions) {
  const abs = path.resolve(REPO_ROOT, rootRel);
  let entries;
  try {
    entries = readdirSync(abs, { recursive: true, withFileTypes: true });
  } catch (error) {
    fail(
      `could not read the scan root '${rootRel}' (${error.message}). A tree this guard cannot ` +
        'enumerate is a tree it cannot verify — this fails closed.'
    );
    return null;
  }
  return entries
    .filter((entry) => entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext)))
    .map((entry) => path.relative(REPO_ROOT, path.join(entry.parentPath ?? entry.path, entry.name)))
    .sort();
}

/** Read a file, or fail closed. A file this guard cannot read is a property it cannot verify. */
function readSource(relPath) {
  try {
    return readFileSync(path.resolve(REPO_ROOT, relPath), 'utf8');
  } catch (error) {
    fail(
      `could not read '${relPath}' (${error.message}). A file this guard cannot read is a ` +
        'property it cannot verify — this fails closed.'
    );
    return null;
  }
}

/**
 * The absolute character ranges of `text` that are comment TEXT, plus each line's absolute start
 * offset so a match index can be turned back into a line number. The spans come from the shared
 * classifier, so a `//` inside a string literal and a `#` inside a quoted env value are correctly
 * NOT comments.
 */
function commentMapOf(text, family) {
  const state = { inBlockC: false, inBlockHtml: false, inTemplate: false, lineIndex: 0 };
  const lines = text.split('\n');
  const spans = [];
  const lineStarts = [];
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    lineStarts.push(offset);
    state.lineIndex = i;
    for (const [start, end] of commentSpans(lines[i], family, state)) {
      spans.push([offset + start, offset + end]);
    }
    offset += lines[i].length + 1;
  }

  return { spans, lineStarts, lines };
}

/** The 1-based line number containing absolute character index `idx`. */
function lineNumberOf(lineStarts, idx) {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (lineStarts[mid] <= idx) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

/**
 * Every match of `re` in `text` that is NOT inside a comment, in ascending index order.
 *
 * The whole file is scanned rather than each line separately: Prettier keeps these expressions on
 * one line today, but a longer name would wrap them, and a line-scoped scan would then miss the
 * very thing it exists to find.
 */
function codeMatches(text, re, map) {
  const found = [];
  re.lastIndex = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (inSpans(match.index, map.spans)) continue;
    found.push({ index: match.index, line: lineNumberOf(map.lineStarts, match.index), captured: match[1] });
  }
  return found;
}

/**
 * Collect every name matched by `re` across `files`, outside comments, with the first site each was
 * seen at. Returns `null` if any file could not be read, so the caller fails closed rather than
 * treating an unreadable tree as an empty one.
 */
function collectNames(files, re) {
  const names = new Map();
  let reads = 0;
  for (const rel of files) {
    const text = readSource(rel);
    if (text === null) return null;
    const family = familyFor(rel);
    if (!family) {
      fail(
        `no comment family is registered for '${rel}'. Without one this guard cannot tell code ` +
          'from prose in that file, and would count a docblock as an environment read — this fails closed.'
      );
      return null;
    }
    const map = commentMapOf(text, family);
    for (const hit of codeMatches(text, re, map)) {
      reads++;
      if (!names.has(hit.captured)) names.set(hit.captured, `${rel}:${hit.line}`);
    }
  }
  return { names, reads };
}

/**
 * The assignments in an env file, in file order, outside comments.
 *
 * Exported because `scripts/assert-env-pairs-agree.mjs` must read an env file the same way this
 * guard reads the template: two parsers would eventually disagree about what an assignment is,
 * and the pair of scripts would then disagree about the tree they both describe.
 *
 * The returned `value` is the raw right-hand side with one layer of matching surrounding quotes
 * removed. IT IS A SECRET IN THE CALLER'S HANDS: no caller may print it, and neither script does.
 */
export function parseEnvAssignments(text) {
  const map = commentMapOf(text, ENV_FAMILY);
  const entries = [];

  for (let i = 0; i < map.lines.length; i++) {
    const line = map.lines[i];
    const lineStart = map.lineStarts[i];
    // The code portion of the line is everything before the first comment span that starts on it.
    let codeEnd = line.length;
    for (const [start] of map.spans) {
      if (start >= lineStart && start - lineStart < codeEnd) codeEnd = start - lineStart;
    }
    const code = line.slice(0, codeEnd);
    const match = ASSIGNMENT_RE.exec(code);
    if (!match) continue;

    let value = code.slice(match[0].length).trim();
    if (value.length >= 2 && (value[0] === "'" || value[0] === '"') && value[value.length - 1] === value[0]) {
      value = value.slice(1, -1);
    }
    entries.push({ name: match[1], value, line: i + 1 });
  }

  return entries;
}

/**
 * The cross-runtime pairs, derived from source.
 *
 * Exported so the runtime agreement checker consumes the SAME derivation rather than a second
 * opinion about what a pair is. Returns `null` when a scan root could not be read.
 */
export function derivePairs() {
  const denoFiles = enumerateFiles(DENO_ROOT, DENO_EXTENSIONS);
  const frontendFiles = enumerateFiles(FRONTEND_ROOT, FRONTEND_EXTENSIONS);
  if (denoFiles === null || frontendFiles === null) return null;

  const deno = collectNames(denoFiles, DENO_READ_RE);
  const frontend = collectNames(frontendFiles, PUBLIC_TOKEN_RE);
  if (deno === null || frontend === null) return null;

  const pairs = [...deno.names.keys()]
    .filter((name) => frontend.names.has(PUBLIC_PREFIX + name))
    .sort()
    .map((name) => ({
      name,
      deno: name,
      frontend: PUBLIC_PREFIX + name,
      denoSite: deno.names.get(name),
      frontendSite: frontend.names.get(PUBLIC_PREFIX + name)
    }));

  return {
    pairs,
    census: {
      denoFiles: denoFiles.length,
      frontendFiles: frontendFiles.length,
      denoReads: deno.reads,
      frontendReads: frontend.reads
    }
  };
}

/**
 * The comment lines that introduce the block, read upwards from its first assignment across blank
 * and wholly-comment lines. A header separated from the block by another assignment introduces
 * that assignment, not this block.
 */
function headerAbove(lines, firstAssignmentLine) {
  const collected = [];
  for (let i = firstAssignmentLine - 2; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === '') continue;
    if (!trimmed.startsWith('#')) break;
    collected.push(trimmed.replace(/^#+/, ''));
  }
  // Normalised before matching — comment markers stripped, every run of whitespace including the
  // line breaks collapsed to one space, lowercased. The contract is about what the header SAYS;
  // matching raw text would make it about where Prettier happened to wrap the sentence, and a
  // reflow that changed no meaning would redden the guard.
  return collected.reverse().join(' ').replace(/\s+/g, ' ').toLowerCase();
}

function main() {
  const derived = derivePairs();
  if (derived === null) {
    process.exitCode = 1;
    return;
  }
  const { pairs, census } = derived;

  const templateText = readSource(ENV_EXAMPLE);
  if (templateText === null) {
    process.exitCode = 1;
    return;
  }
  const assignments = parseEnvAssignments(templateText);
  const templateLines = templateText.split('\n');

  // Positions in the assignment SEQUENCE, not line numbers: contiguity is about what sits between
  // two assignments, and blank lines and comments between them are formatting, not separation.
  const positionsByName = new Map();
  for (let i = 0; i < assignments.length; i++) {
    const { name } = assignments[i];
    if (!positionsByName.has(name)) positionsByName.set(name, []);
    positionsByName.get(name).push(i);
  }

  const memberNames = [];
  for (const pair of pairs) memberNames.push(pair.frontend, pair.deno);

  // --- Check 1: both members of every pair are assigned, exactly once ---
  for (const pair of pairs) {
    for (const [member, site] of [
      [pair.frontend, pair.frontendSite],
      [pair.deno, pair.denoSite]
    ]) {
      const positions = positionsByName.get(member) ?? [];
      if (positions.length === 0) {
        violate(
          `the cross-runtime pair '${pair.name}' is read by both runtimes — '${pair.deno}' at ` +
            `${pair.denoSite} and '${pair.frontend}' at ${pair.frontendSite} — but '${member}' is ` +
            `not assigned anywhere in '${ENV_EXAMPLE}'. A twin nobody documented is a twin nobody ` +
            'sets, and the two spellings have already drifted apart twice undetected. Add it to ' +
            `the cross-runtime pair block, adjacent to its partner (site of the unregistered read: ${site}).`
        );
      } else if (positions.length > 1) {
        violate(
          `'${member}' is assigned ${positions.length} times in '${ENV_EXAMPLE}' (lines ` +
            `${positions.map((p) => assignments[p].line).join(', ')}). Which assignment wins then ` +
            'depends on file order rather than on anything a reader can see, so the pair contract ' +
            'for this variable is unreadable. Keep exactly one assignment, in the pair block.'
        );
      }
    }
  }

  // --- Check 2: the pair members form one contiguous run, each pair adjacent ---
  const memberPositions = memberNames.flatMap((name) => positionsByName.get(name) ?? []).sort((a, b) => a - b);

  if (memberPositions.length > 1) {
    const span = memberPositions[memberPositions.length - 1] - memberPositions[0] + 1;
    if (span !== memberPositions.length) {
      const intruders = [];
      for (let i = memberPositions[0]; i <= memberPositions[memberPositions.length - 1]; i++) {
        if (!memberPositions.includes(i)) intruders.push(`${assignments[i].name} (line ${assignments[i].line})`);
      }
      violate(
        `the cross-runtime pair members in '${ENV_EXAMPLE}' are not contiguous: ${intruders.join(', ')} ` +
          'sit between them. The pairs were invisible to review for as long as they were scattered ' +
          'across three sections; one block is what makes the twin relationship legible on the page.'
      );
    }
  }

  for (const pair of pairs) {
    const a = (positionsByName.get(pair.frontend) ?? [])[0];
    const b = (positionsByName.get(pair.deno) ?? [])[0];
    if (a === undefined || b === undefined) continue; // already reported by check 1
    if (Math.abs(a - b) !== 1) {
      violate(
        `'${pair.frontend}' and '${pair.deno}' are two spellings of the same value but are not ` +
          `adjacent in '${ENV_EXAMPLE}' (lines ${assignments[a].line} and ${assignments[b].line}). ` +
          'Adjacency is what lets a reader see, without searching, that editing one means editing ' +
          'the other.'
      );
    }
  }

  // --- Check 3: the block says what the contract is ---
  if (memberPositions.length > 0) {
    const header = headerAbove(templateLines, assignments[memberPositions[0]].line);
    const missing = HEADER_PHRASES.filter((phrase) => !header.includes(phrase));
    if (missing.length > 0) {
      violate(
        `the comment introducing the cross-runtime pair block in '${ENV_EXAMPLE}' does not mention ` +
          `${missing.map((phrase) => `'${phrase}'`).join(' or ')}. The block header is where a ` +
          'reader learns that the two members must hold the same value and which runtime reads ' +
          'which spelling; without that the block is eight variables in a row.'
      );
    }
  } else if (pairs.length > 0) {
    violate(
      `${pairs.length} cross-runtime pair(s) were derived from source but not one member is ` +
        `assigned in '${ENV_EXAMPLE}'. Either the template lost its pair block or this guard is ` +
        'reading the wrong file — both are reasons to fail closed rather than report a clean run.'
    );
  }

  console.log(
    `Cross-runtime env-pair registry guard (phase 153, plan 10) — ` +
      `source scanned: ${census.denoFiles} Deno file(s) under ${DENO_ROOT.split(path.sep).join('/')}, ` +
      `${census.frontendFiles} frontend file(s) under ${FRONTEND_ROOT.split(path.sep).join('/')}; ` +
      `env reads found in code: ${census.denoReads} Deno, ${census.frontendReads} PUBLIC_; ` +
      `pairs derived: ${pairs.length} (${pairs.map((pair) => pair.name).join(', ') || 'none'}); ` +
      `${ENV_EXAMPLE} assignments: ${assignments.length}. ${violations} violation(s).`
  );

  process.exitCode = violations > 0 ? 1 : 0;
}

// Only run when invoked directly. `assert-env-pairs-agree.mjs` imports the derivation from this
// module, and an import that also executed a whole check would make the runtime script's exit code
// depend on the static guard's verdict — two different questions, one answer.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
