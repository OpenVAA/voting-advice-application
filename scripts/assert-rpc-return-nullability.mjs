#!/usr/bin/env node

/**
 * RPC RETURN-NULLABILITY GUARD (phase 164, requirements CIGATE-04 / CIGATE-05).
 *
 * The incident this file exists for: PostgreSQL carries no nullability metadata on a
 * function's OUT parameters, so the Supabase type generator declares every output column
 * of a `RETURNS TABLE` function non-null. Several of those columns really can be null at
 * runtime — a LEFT JOIN that did not match, a UNION branch selecting a NULL literal, or a
 * nullable base-table column projected straight through. Phase 126 compensated for exactly
 * one of them with an ad-hoc `as string | null | undefined` cast at the consumer, and phase
 * 164 replaced that with a single override locus in `packages/supabase-types`. Both of those
 * are point-in-time fixes. Without a STANDING check, two things reopen silently: a fourth
 * `RETURNS TABLE` RPC (or a new column on an existing one) arrives with no disposition at
 * all, and the next pull request finds the per-site cast quicker than the override.
 *
 * SIX checks, ordered so the vacuity preconditions run before any verdict:
 *
 *   Check 1 (CIGATE-04) — set equality, in two halves. 1a: the RPC/column map harvested
 *     from the schema tree equals the map recorded in the DERIVED region of
 *     `packages/supabase-types/RPC-NULLABILITY.md` (a stale artifact is a red gate, never an
 *     auto-fixed one). 1b: every harvested column also has a hand-written disposition row in
 *     that artifact's per-RPC tables. 1b is the half that actually delivers criterion 4's
 *     "so a future RPC is not missed" clause: `--write` can satisfy 1a on its own, but only a
 *     human can satisfy 1b, so a new column cannot reach a green gate undispositioned.
 *   Check 2 (the adjacency case) — duplicate function name. If the same function name is
 *     declared in two different scanned files, fail naming BOTH file:line pairs rather than
 *     merging them into one row or emitting two rows silently. That is the failure mode a
 *     scan of the wrong tree would produce invisibly: the migrations tree redefines
 *     `get_nominations` twice and restates all three declarations in the initial-schema file,
 *     so scanning `apps/supabase/supabase/migrations/**` yields five occurrences for three
 *     functions. This guard therefore reads the schema tree and only the schema tree.
 *   Check 3 (the empty case) — fail-closed harvest. A `.sql` file declaring no `RETURNS
 *     TABLE` function contributes zero rows and is NOT an error; most files in the tree are
 *     like that. But a TOTAL harvest of zero RPCs, or a scan root that does not exist or
 *     cannot be read, exits 1 naming the scanned root. A green "0 RPCs found" would be a gate
 *     that cannot fail, and zero-from-an-inert-guard is indistinguishable from
 *     zero-from-a-clean-tree unless the guard proves its corpus first.
 *   Check 4 (CIGATE-05) — the cast grep. No `.<rpc_column> as <string|number|boolean> | null`
 *     compensation anywhere under `apps`, `packages` or `tests`. The column alternation is
 *     the HARVESTED snake_case column set, never a hand-written list: that is what makes the
 *     gate self-maintaining when a fourth RPC arrives. Measured baseline: exactly 1 hit before
 *     phase 164 plan 01 removed the phase-126 cast, 0 after.
 *   Check 5 — override cross-check. Every column key declared in
 *     `packages/supabase-types/src/database.overrides.ts` names a column the schema actually
 *     declares for that RPC. This is belt-and-braces behind the type-level `K extends keyof
 *     ReturnsRow<F>` constraint, which is the primary instrument; it catches the case where
 *     the package somehow stops being typechecked.
 *   Check 6 — the delivery chain. Checks 1 to 5 all prove the override is CORRECT; none of
 *     them proves it is CONNECTED. Two links carry the widened type from the override locus
 *     to every consumer, and both are one-token edits away from being bypassed with the whole
 *     repository still green: `packages/supabase-types/src/index.ts` must export the public
 *     `Database` from `./database.merged` rather than straight from the generated
 *     `./database`, and `packages/supabase-types/src/database.merged.ts` must declare that
 *     `Database` by applying `FunctionReturnOverrides` imported from `./database.overrides`.
 *     This check is not hypothetical: phase 164 plan 04's negative control ran the barrel
 *     mutation and measured the entire tree staying green, EVEN WITH THE CONSUMER'S
 *     NULL-GUARD ALSO DELETED (`164-NEGATIVE-CONTROL.md` § 6, rows NC-3 and NC-3b). The other
 *     two gates of the phase are aimed elsewhere by construction — the drift job diffs only
 *     the generated `src/database.ts`, which a barrel edit does not touch, and the package
 *     typecheck compiles `database.merged.ts` happily when nothing imports it.
 *
 *     It reads the EXPORT STATEMENT, never the specifier as a bare string. A grep for
 *     `'./database.merged'` passes a barrel that keeps the import and stops exporting
 *     `Database` from it, which is the same bypass wearing a disguise. Zero `Database`
 *     exports, or more than one, is a violation for the same fail-closed reason check 3
 *     exists: a resolver that reads nothing reports clean forever.
 *
 * SCOPE IS HARD-CODED, NOT CONFIGURABLE. `SCHEMA_SCAN_ROOT` is a single named constant so
 * widening it is a deliberate, reviewable edit. The reader's copy of the schema under
 * `apps/supabase/supabase/schema/` is the sole authority for what the RPCs return; the
 * migration files are a historical record that restates and then redefines those same
 * functions, and counting both double-counts.
 *
 * WHY THE CAST GREP EXCLUDES `scripts/`. This file contains the column alternation as a
 * literal, so a scan that included its own directory would match itself and the gate would be
 * permanently red for a reason unrelated to any consumer. The roots are therefore `apps`,
 * `packages` and `tests` — which is also the whole of the product surface that imports the
 * generated types.
 *
 * A COMMENT QUOTING THE PATTERN COUNTS AS A HIT. The scan is a text read and makes no attempt
 * to skip comments. That is deliberate: a commented-out cast is a cast waiting to be
 * uncommented. Reword the comment; do not narrow the pattern to excuse it.
 *
 * WHY A REGEX READ RATHER THAN A SQL PARSE. No SQL parser is a repository dependency, and
 * adding one to read three uniformly-authored function signatures would be a worse trade —
 * the same reasoning `packages/dev-seed/tests/ciTypecheckGate.test.ts` records for not adding
 * a YAML parser, and the house style stated at length in
 * `scripts/assert-a11y-scan-wiring.mjs`: Node built-ins only, no build step, exit 1 naming the
 * specific problem.
 *
 * DETERMINISM. RPC records are emitted sorted by (file path, declaration line) and columns are
 * kept in RETURNS TABLE declaration order, because that order is the function's positional
 * contract and sorting it would destroy information. The same tree therefore produces
 * byte-identical output on every run, so `--write` followed by `git diff --exit-code` can only
 * ever be reporting a real change.
 *
 * `--write` MERGES, IT DOES NOT CLOBBER. The artifact has a machine-owned half and a
 * human-owned half. `--write` rewrites only the region between the DERIVED sentinels and
 * copies every other byte of the existing file through unchanged, so the hand-written
 * evidence and disposition cells survive a regeneration. If the artifact does not exist yet,
 * `--write` scaffolds one. The `--update` mode of `scripts/assert-schema-migration-parity.mjs`
 * is the in-repo precedent for an assert-script that can regenerate its own committed fixture;
 * the flag-membership read follows `scripts/assert-node-engine.mjs`.
 *
 * `--write` MUST NEVER RUN IN CI. The gate's value is that a stale artifact is a red build,
 * not an auto-fixed one.
 *
 * Usage:
 *   node scripts/assert-rpc-return-nullability.mjs            (derive + all six checks)
 *   node scripts/assert-rpc-return-nullability.mjs --write     (regenerate the derived region)
 *
 * Exit codes:
 *   0 - all six checks clean, or `--write` completed
 *   1 - at least one violation, or a named precondition failure (an unreadable or empty scan
 *       root, an unreadable artifact, an unreadable override file, an unreadable barrel or
 *       merge module)
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'scripts/assert-rpc-return-nullability.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

const WRITE = process.argv.includes('--write');

/** The sole authority for what the `RETURNS TABLE` RPCs return. Hard-coded on purpose. */
const SCHEMA_SCAN_ROOT = 'apps/supabase/supabase/schema';
/** The committed enumeration: machine-derived index plus hand-written per-column dispositions. */
const ARTIFACT = 'packages/supabase-types/RPC-NULLABILITY.md';
/** The single locus that widens RPC return columns. Its keys are cross-checked by check 5. */
const OVERRIDES = 'packages/supabase-types/src/database.overrides.ts';
/** The package entry point every consumer imports `Database` through. Link 1 of check 6. */
const BARREL = 'packages/supabase-types/src/index.ts';
/** The mechanical merge that applies the overrides to the generated schema. Link 2 of check 6. */
const MERGED = 'packages/supabase-types/src/database.merged.ts';
/** The module the barrel must export `Database` from, written as the barrel writes it. */
const MERGED_SPECIFIER = './database.merged';
/** The override module the merge must apply, written as the merge writes it. */
const OVERRIDES_SPECIFIER = './database.overrides';
/** Roots for the cast grep. `scripts` is absent so this file cannot match its own alternation. */
const CAST_SCAN_ROOTS = ['apps', 'packages', 'tests'];
const CAST_SCAN_EXTS = ['.ts', '.svelte'];
/** Trees whose contents are installed, generated or built rather than authored. */
const CAST_SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.svelte-kit', '.turbo', 'coverage']);

const DERIVED_BEGIN = '<!-- BEGIN DERIVED: node scripts/assert-rpc-return-nullability.mjs --write -->';
const DERIVED_END = '<!-- END DERIVED -->';

// ── Reading ───────────────────────────────────────────────────────────────

function readOrNull(relPath) {
  try {
    return readFileSync(path.resolve(REPO_ROOT, relPath), 'utf8');
  } catch (error) {
    console.error(
      `[ERROR] ${SELF}: could not read '${relPath}' (${error.message}). A file this guard cannot read is a ` +
        'disposition it cannot verify — this fails closed.'
    );
    return null;
  }
}

/** Recursive walk yielding repo-relative paths of every `*.sql` file under `relRoot`, sorted. */
function collectSqlFiles(relRoot) {
  const absRoot = path.resolve(REPO_ROOT, relRoot);
  const found = [];
  const walk = (absDir) => {
    for (const entry of readdirSync(absDir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const abs = path.join(absDir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile() && entry.name.endsWith('.sql')) found.push(path.relative(REPO_ROOT, abs));
    }
  };
  walk(absRoot);
  return found.sort();
}

// ── Harvest ───────────────────────────────────────────────────────────────

const FUNCTION_DECL_RE = /^CREATE OR REPLACE FUNCTION\s+public\.([a-z0-9_]+)\s*\(/i;
const RETURNS_TABLE_RE = /^RETURNS TABLE\s*\(\s*$/i;
const COLUMN_RE = /^([a-z_][a-z0-9_]*)\s+(.+?),?$/;

/**
 * Harvest every `RETURNS TABLE` declaration in `relFile`.
 *
 * For each `RETURNS TABLE (` line: scan backwards to the nearest
 * `CREATE OR REPLACE FUNCTION public.<name>(` to capture the function name and its declaration
 * line, then scan forwards to the matching `)` at column 0, splitting each intervening line on
 * its first whitespace run into `[column, sqlType]`.
 */
function harvestFile(relFile, source) {
  const lines = source.split('\n');
  const records = [];
  for (let i = 0; i < lines.length; i++) {
    if (!RETURNS_TABLE_RE.test(lines[i].trim())) continue;

    let rpc = null;
    let defLine = null;
    for (let back = i - 1; back >= 0; back--) {
      const declMatch = lines[back].match(FUNCTION_DECL_RE);
      if (declMatch) {
        rpc = declMatch[1];
        defLine = back + 1;
        break;
      }
    }
    if (rpc === null) {
      return {
        error:
          `a 'RETURNS TABLE (' at ${relFile}:${i + 1} has no 'CREATE OR REPLACE FUNCTION public.<name>(' above ` +
          'it. The guard cannot attribute those output columns to a function, so it withholds its verdict ' +
          'rather than dropping them.'
      };
    }

    const columns = [];
    let closed = false;
    for (let fwd = i + 1; fwd < lines.length; fwd++) {
      const raw = lines[fwd];
      if (/^\)/.test(raw)) {
        closed = true;
        break;
      }
      const trimmed = raw.trim();
      if (trimmed === '' || trimmed.startsWith('--')) continue;
      const colMatch = trimmed.match(COLUMN_RE);
      if (!colMatch) {
        return {
          error:
            `could not parse '${trimmed}' at ${relFile}:${fwd + 1} as a '<column> <sql type>' pair inside the ` +
            `RETURNS TABLE list of ${rpc}. An output column this guard cannot name is a column it cannot ` +
            'disposition — this fails closed.'
        };
      }
      columns.push({ name: colMatch[1], sqlType: colMatch[2].trim() });
    }
    if (!closed) {
      return {
        error:
          `the RETURNS TABLE list opened at ${relFile}:${i + 1} is never closed by a ')' at column 0. ` +
          'The guard cannot tell where the output columns end.'
      };
    }

    records.push({ rpc, file: relFile, defLine, returnsTableLine: i + 1, columns });
  }
  return { records };
}

// ── Rendering the derived region ──────────────────────────────────────────

function renderDerived(records) {
  const out = [];
  out.push('```text');
  for (const rec of records) {
    out.push(
      `${rec.file}:${rec.defLine}  ${rec.rpc}  (RETURNS TABLE at :${rec.returnsTableLine}, ${rec.columns.length} columns)`
    );
    const width = Math.max(...rec.columns.map((c) => c.name.length));
    rec.columns.forEach((col, idx) => {
      out.push(`  ${String(idx + 1).padStart(2, ' ')}. ${col.name.padEnd(width, ' ')}  ${col.sqlType}`);
    });
    out.push('');
  }
  while (out.length > 0 && out[out.length - 1] === '') out.pop();
  out.push('```');
  return out.join('\n');
}

function scaffold(derivedBlock) {
  return [
    '# `RETURNS TABLE` RPC output-column nullability',
    '',
    `The block below is derived from \`${SCHEMA_SCAN_ROOT}/**\` by \`node ${SELF} --write\`. Everything`,
    'outside it is hand-written and is copied through unchanged by that command.',
    '',
    DERIVED_BEGIN,
    '',
    derivedBlock,
    '',
    DERIVED_END,
    '',
    '<!-- Add one section per RPC below, with a per-column disposition row for every column listed above. -->',
    ''
  ].join('\n');
}

function spliceDerived(existing, derivedBlock) {
  const beginIdx = existing.indexOf(DERIVED_BEGIN);
  const endIdx = existing.indexOf(DERIVED_END);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) return null;
  const head = existing.slice(0, beginIdx + DERIVED_BEGIN.length);
  const tail = existing.slice(endIdx);
  return `${head}\n\n${derivedBlock}\n\n${tail}`;
}

// ── Parsing the artifact back ─────────────────────────────────────────────

/** The RPC/column map as recorded in the artifact's derived region. */
function parseDerivedRegion(artifactSrc) {
  const beginIdx = artifactSrc.indexOf(DERIVED_BEGIN);
  const endIdx = artifactSrc.indexOf(DERIVED_END);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) return null;
  const region = artifactSrc.slice(beginIdx + DERIVED_BEGIN.length, endIdx);
  const map = new Map();
  let current = null;
  for (const line of region.split('\n')) {
    const header = line.match(/^\S+\.sql:\d+\s+([a-z0-9_]+)\s+\(RETURNS TABLE at :\d+, \d+ columns\)$/);
    if (header) {
      current = header[1];
      map.set(current, []);
      continue;
    }
    const col = line.match(/^\s+\d+\.\s+([a-z_][a-z0-9_]*)\s+/);
    if (col && current !== null) map.get(current).push(col[1]);
  }
  return map;
}

/**
 * The `rpc -> [column]` map as recorded in the artifact's hand-written per-RPC tables.
 *
 * A section opens with a level-2 or level-3 heading naming the RPC in backticks; each column row
 * is a pipe table row whose second cell is the backticked column name.
 */
function parseDispositionTables(artifactSrc) {
  const map = new Map();
  let current = null;
  for (const line of artifactSrc.split('\n')) {
    const heading = line.match(/^#{2,3} .*`([a-z0-9_]+)`/);
    if (heading) {
      current = heading[1];
      if (!map.has(current)) map.set(current, []);
      continue;
    }
    const row = line.match(/^\|\s*\d+\s*\|\s*`([a-z_][a-z0-9_]*)`\s*\|/);
    if (row && current !== null) map.get(current).push(row[1]);
  }
  return map;
}

/**
 * Column keys declared per RPC in the override locus.
 *
 * The quoted-string pattern accepts any identifier shape, not just lowercase snake_case. A
 * narrower pattern would silently DROP a mistyped key such as `parent_nomination_id_TYPO` and the
 * cross-check would then report clean over a set it never read — measured, and the reason this
 * pattern is deliberately permissive.
 */
function parseOverrideKeys(overridesSrc) {
  const map = new Map();
  for (const match of overridesSrc.matchAll(/Nullable<([^>]*)>/g)) {
    const quoted = [...match[1].matchAll(/'([A-Za-z0-9_$]+)'/g)].map((m) => m[1]);
    if (quoted.length === 0) continue;
    const [rpc, ...keys] = quoted;
    map.set(rpc, (map.get(rpc) ?? []).concat(keys));
  }
  return map;
}

// ── The delivery chain ────────────────────────────────────────────────────

/**
 * Every re-exported name in a module, mapped to the specifier(s) it is re-exported FROM.
 *
 * Matches `export { … } from '…'` and `export type { … } from '…'` across newlines, because a
 * prettier reformat may wrap a long clause and a single-line-only read would then see nothing —
 * silently, which is the failure mode check 6 exists to rule out rather than to reproduce.
 *
 * The key is the EXPORTED name: for `export type { X as Database }` the entry is `Database`, since
 * that is the name consumers import. The inline `type` modifier inside the braces is stripped so
 * `export { type Database }` reads the same as `export type { Database }`.
 *
 * A local `export type Database = …` declaration is deliberately NOT collected here — this helper
 * answers "which module does this name come from", and a locally declared name comes from none.
 * Check 6 handles the two modules separately for exactly that reason.
 */
function namedReExports(source) {
  const map = new Map();
  for (const match of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const specifier = match[2].replace(/\.js$/, '');
    for (const raw of match[1].split(',')) {
      const entry = raw.trim().replace(/^type\s+/, '');
      if (entry === '') continue;
      const exported = entry.includes(' as ') ? entry.split(' as ').pop().trim() : entry;
      map.set(exported, (map.get(exported) ?? []).concat(specifier));
    }
  }
  return map;
}

// ── The cast grep ─────────────────────────────────────────────────────────

function collectScanFiles(relRoot) {
  const absRoot = path.resolve(REPO_ROOT, relRoot);
  const found = [];
  const walk = (absDir) => {
    let entries;
    try {
      entries = readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (CAST_SKIP_DIRS.has(entry.name)) continue;
      const abs = path.join(absDir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile() && CAST_SCAN_EXTS.includes(path.extname(entry.name)))
        found.push(path.relative(REPO_ROOT, abs));
    }
  };
  try {
    if (!statSync(absRoot).isDirectory()) return found;
  } catch {
    return found;
  }
  walk(absRoot);
  return found.sort();
}

/**
 * Build the cast pattern from the HARVESTED snake_case column names.
 *
 * Only names carrying an underscore are used: a camelCase property is a mapped domain field,
 * never a raw RPC output column, and including the single-word names would make the gate fire on
 * unrelated reads of `name`, `id` or `info`.
 */
function buildCastPattern(records) {
  const names = new Set();
  for (const rec of records) for (const col of rec.columns) if (col.name.includes('_')) names.add(col.name);
  const alternation = [...names].sort().join('|');
  return {
    alternation,
    regex: new RegExp(`\\.(${alternation}) +as +(string|number|boolean)( *\\| *(null|undefined))+`)
  };
}

// ── Main ──────────────────────────────────────────────────────────────────

function main() {
  let sqlFiles;
  try {
    sqlFiles = collectSqlFiles(SCHEMA_SCAN_ROOT);
  } catch (error) {
    console.error(
      `[ERROR] ${SELF}: could not read the scan root '${SCHEMA_SCAN_ROOT}' (${error.message}). A tree this ` +
        'guard cannot read is an enumeration it cannot derive — this fails closed.'
    );
    process.exitCode = 1;
    return;
  }

  const records = [];
  for (const relFile of sqlFiles) {
    const source = readOrNull(relFile);
    if (source === null) {
      process.exitCode = 1;
      return;
    }
    const harvested = harvestFile(relFile, source);
    if (harvested.error) {
      console.error(`[ERROR] ${SELF}: ${harvested.error}`);
      process.exitCode = 1;
      return;
    }
    records.push(...harvested.records);
  }
  records.sort((a, b) => (a.file === b.file ? a.defLine - b.defLine : a.file < b.file ? -1 : 1));

  // --- Check 3 (first, because every other verdict is vacuous without it) ---
  if (records.length === 0) {
    console.error(
      `[ERROR] ${SELF}: harvested ZERO 'RETURNS TABLE' functions from '${SCHEMA_SCAN_ROOT}' (${sqlFiles.length} ` +
        '.sql file(s) read). A file declaring no such function contributes nothing and is fine, but a total ' +
        'harvest of zero means this guard is inert: it would report a clean cast grep over an empty column ' +
        'alternation and a satisfied enumeration over an empty set. Zero-from-an-inert-guard is ' +
        'indistinguishable from zero-from-a-clean-tree, so this fails closed.'
    );
    process.exitCode = 1;
    return;
  }

  // --- Check 2 (before any map is built, so a duplicate can never be merged away) ---
  const byName = new Map();
  for (const rec of records) byName.set(rec.rpc, (byName.get(rec.rpc) ?? []).concat(rec));
  const duplicates = [...byName.entries()].filter(([, recs]) => recs.length > 1);

  if (WRITE) {
    if (duplicates.length > 0) {
      for (const [rpc, recs] of duplicates) {
        console.error(
          `[ERROR] ${SELF}: '${rpc}' is declared ${recs.length} times — ` +
            `${recs.map((r) => `${r.file}:${r.defLine}`).join(' and ')}. Refusing to regenerate an artifact ` +
            'whose derived region would silently pick one declaration over the other.'
        );
      }
      process.exitCode = 1;
      return;
    }
    const derivedBlock = renderDerived(records);
    const existing = (() => {
      try {
        return readFileSync(path.resolve(REPO_ROOT, ARTIFACT), 'utf8');
      } catch {
        return null;
      }
    })();
    const next = existing === null ? scaffold(derivedBlock) : spliceDerived(existing, derivedBlock);
    if (next === null) {
      console.error(
        `[ERROR] ${SELF}: '${ARTIFACT}' exists but carries no '${DERIVED_BEGIN}' / '${DERIVED_END}' pair. ` +
          'Without those sentinels this command cannot tell the machine-owned half from the hand-written ' +
          'half, and rewriting the whole file would destroy the evidence and disposition cells.'
      );
      process.exitCode = 1;
      return;
    }
    writeFileSync(path.resolve(REPO_ROOT, ARTIFACT), next);
    console.log(`${SELF} --write: regenerated the derived region of ${ARTIFACT}.`);
    process.exitCode = 0;
    return;
  }

  let violations = 0;
  const violate = (message) => {
    violations++;
    console.error(`[ERROR] ${SELF}: ${message}`);
  };

  for (const [rpc, recs] of duplicates) {
    violate(
      `'${rpc}' is declared ${recs.length} times in the scanned tree — ` +
        `${recs.map((r) => `${r.file}:${r.defLine}`).join(' and ')}. Two declarations of one function name ` +
        'cannot be merged into one enumeration row and must not be counted twice. Remove the redundant ' +
        'declaration, or narrow the scan root so only the authoritative copy is read.'
    );
  }

  // --- Check 1: set equality, both halves ---
  const artifactSrc = readOrNull(ARTIFACT);
  if (artifactSrc === null) {
    process.exitCode = 1;
    return;
  }

  const derivedMap = parseDerivedRegion(artifactSrc);
  if (derivedMap === null) {
    violate(
      `'${ARTIFACT}' carries no '${DERIVED_BEGIN}' / '${DERIVED_END}' pair, so the derived enumeration cannot ` +
        `be read back. Run 'node ${SELF} --write' to regenerate it.`
    );
  }
  const dispositionMap = parseDispositionTables(artifactSrc);

  const compare = (label, recorded, hint) => {
    if (recorded === null) return;
    const harvestedNames = new Set(records.map((r) => r.rpc));
    for (const rpc of harvestedNames) {
      if (!recorded.has(rpc)) {
        violate(
          `the RPC '${rpc}' is declared in '${SCHEMA_SCAN_ROOT}' but has no ${label} in '${ARTIFACT}'. ` +
            `Criterion CIGATE-04 requires a remedy recorded per RPC, including "no change needed" and why. ${hint}`
        );
        continue;
      }
      const rec = records.find((r) => r.rpc === rpc);
      const declared = rec.columns.map((c) => c.name);
      const found = recorded.get(rpc);
      for (const name of declared) {
        if (!found.includes(name)) {
          violate(
            `'${rpc}.${name}' (${rec.file}:${rec.returnsTableLine} list) has no ${label} in '${ARTIFACT}'. ` +
              `A new output column with no recorded disposition is exactly the drift this gate exists to catch. ${hint}`
          );
        }
      }
      for (const name of found) {
        if (!declared.includes(name)) {
          violate(
            `'${rpc}.${name}' has a ${label} in '${ARTIFACT}' but is no longer declared by '${rec.file}'. ` +
              `Remove the stale row. ${hint}`
          );
        }
      }
    }
    for (const rpc of recorded.keys()) {
      if (!harvestedNames.has(rpc)) {
        violate(
          `'${ARTIFACT}' records a ${label} for '${rpc}', which is not declared as a RETURNS TABLE function ` +
            `anywhere under '${SCHEMA_SCAN_ROOT}'. ${hint}`
        );
      }
    }
  };

  compare('derived-region entry', derivedMap, `Run 'node ${SELF} --write' to refresh the derived region.`);
  compare(
    'disposition row',
    dispositionMap,
    'This half cannot be satisfied by --write: a disposition is a judgement and must be written by hand.'
  );

  // --- Check 4: the cast grep ---
  const { alternation, regex } = buildCastPattern(records);
  const castHits = [];
  for (const root of CAST_SCAN_ROOTS) {
    for (const relFile of collectScanFiles(root)) {
      const source = readOrNull(relFile);
      if (source === null) {
        process.exitCode = 1;
        return;
      }
      source.split('\n').forEach((line, idx) => {
        if (regex.test(line)) castHits.push(`${relFile}:${idx + 1}: ${line.trim()}`);
      });
    }
  }
  for (const hit of castHits) {
    violate(
      `an ad-hoc nullability cast on an RPC return column — ${hit}\n` +
        `        Widen the column once in '${OVERRIDES}' instead, with its evidence recorded in '${ARTIFACT}'. ` +
        'A per-site cast re-asserts the same lie at every consumer and is invisible to the next reader. ' +
        'A COMMENT quoting the pattern counts as a hit and must be reworded, not tolerated.'
    );
  }

  // --- Check 5: override cross-check ---
  const overridesSrc = readOrNull(OVERRIDES);
  if (overridesSrc === null) {
    process.exitCode = 1;
    return;
  }
  const overrideKeys = parseOverrideKeys(overridesSrc);
  if (overrideKeys.size === 0) {
    violate(
      `no Nullable<'<rpc>', ...> declaration could be read from '${OVERRIDES}'. Either the override locus was ` +
        'emptied, or its shape changed enough that this cross-check reads nothing — and a cross-check with no ' +
        'inputs reports clean forever.'
    );
  }
  for (const [rpc, keys] of overrideKeys) {
    const rec = records.find((r) => r.rpc === rpc);
    if (!rec) {
      violate(
        `'${OVERRIDES}' overrides '${rpc}', which is not declared as a RETURNS TABLE function under ` +
          `'${SCHEMA_SCAN_ROOT}'.`
      );
      continue;
    }
    const declared = rec.columns.map((c) => c.name);
    for (const key of keys) {
      if (!declared.includes(key)) {
        violate(
          `'${OVERRIDES}' widens '${rpc}.${key}', which '${rec.file}' does not declare. A regeneration that ` +
            'renamed or dropped the column leaves the override widening nothing.'
        );
      }
    }
  }

  // --- Check 6: the delivery chain ---
  const barrelSrc = readOrNull(BARREL);
  if (barrelSrc === null) {
    process.exitCode = 1;
    return;
  }
  const barrelSpecifiers = namedReExports(barrelSrc).get('Database') ?? [];
  let barrelVerdict = barrelSpecifiers.join(' + ');
  if (barrelSpecifiers.length === 0) {
    barrelVerdict = 'NONE';
    violate(
      `'${BARREL}' re-exports no 'Database' at all, so this check has nothing to judge and would report ` +
        'clean forever. Either the barrel stopped exporting the type — which breaks every consumer — or its ' +
        'export shape changed enough that the re-export read above sees nothing. Restore ' +
        `\`export type { Database } from '${MERGED_SPECIFIER}';\` or teach this check the new shape.`
    );
  } else if (barrelSpecifiers.length > 1) {
    violate(
      `'${BARREL}' re-exports 'Database' from ${barrelSpecifiers.length} modules (${barrelSpecifiers.join(', ')}). ` +
        'Which one wins is then a question about declaration order rather than about the override, and this ' +
        'check will not answer it for you.'
    );
  } else if (barrelSpecifiers[0] !== MERGED_SPECIFIER) {
    violate(
      `'${BARREL}' re-exports 'Database' from '${barrelSpecifiers[0]}' rather than from '${MERGED_SPECIFIER}'. ` +
        'That single token bypasses the whole override layer for every consumer in the monorepo: the generated ' +
        'type declares each RETURNS TABLE output column non-null, so a legitimate null-guard becomes dead code ' +
        'to the compiler and deleting it compiles clean. Measured in phase 164 plan 04 (NC-3 / NC-3b): with the ' +
        'barrel rewired, the frontend check stays exit 0 even with the guard deleted.'
    );
  }

  const mergedSrc = readOrNull(MERGED);
  if (mergedSrc === null) {
    process.exitCode = 1;
    return;
  }
  const mergedDeclIdx = mergedSrc.search(/export\s+type\s+Database\s*=/);
  if (mergedDeclIdx === -1) {
    violate(
      `'${MERGED}' declares no \`export type Database =\`. The merge is the second link of the chain, and a ` +
        'module that re-exports the generated type instead of intersecting the overrides into it bypasses the ' +
        'override just as completely as a rewired barrel does — while leaving the barrel itself looking correct.'
    );
  } else if (!mergedSrc.slice(mergedDeclIdx).includes('FunctionReturnOverrides')) {
    violate(
      `'${MERGED}' declares \`export type Database\` without mentioning 'FunctionReturnOverrides'. The merge ` +
        'would then hand consumers the generated type under the merged name, which is the bypass with the ' +
        'evidence of it removed.'
    );
  }
  const mergedImportsOverrides = new RegExp(
    `import\\s+type\\s*\\{[^}]*\\bFunctionReturnOverrides\\b[^}]*\\}\\s*from\\s*['"]${OVERRIDES_SPECIFIER.replace(/[.]/g, '\\.')}(?:\\.js)?['"]`
  ).test(mergedSrc);
  if (!mergedImportsOverrides) {
    violate(
      `'${MERGED}' does not import 'FunctionReturnOverrides' from '${OVERRIDES_SPECIFIER}'. Whatever it is ` +
        'applying, it is not the reviewed override locus.'
    );
  }

  const census = records.map((r) => `${r.rpc} ${r.columns.length}`).join(', ');
  console.log(
    `RPC return-nullability guard (phase 164: CIGATE-04, CIGATE-05) — ${records.length} RETURNS TABLE RPC(s) ` +
      `derived from ${SCHEMA_SCAN_ROOT}: ${census}; ${alternation.split('|').length} snake_case column(s) in the ` +
      `cast alternation, ${castHits.length} cast hit(s); barrel exports Database from ${barrelVerdict}; ` +
      `${violations} violation(s).`
  );
  process.exitCode = violations > 0 ? 1 : 0;
}

main();
