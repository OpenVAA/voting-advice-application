#!/usr/bin/env node

/**
 * CROSS-RUNTIME ENV-PAIR REGISTRY GUARD.
 *
 * Some variables are read by both the Deno Edge Functions and the frontend: under a `PUBLIC_`
 * prefix on the frontend (`SUPABASE_URL` / `PUBLIC_SUPABASE_URL`), or under one name by the frontend
 * server from `$env/dynamic/private` (`IDENTITY_CALLBACK_SERVER_SECRET`). Each is two values that
 * must agree, kept in two files, and the two copies have drifted apart unnoticed before. This guard
 * derives the pairs from source (see `scripts/lib/env-pairs.mjs`; there is no hand-kept list) and
 * asserts that the root `.env.example` documents them:
 *
 *   1. both members of every pair are assigned there, outside comments (a same-name pair has one
 *      name and so one assignment; its other member lives in the functions' own `.env`);
 *   2. each member is assigned exactly once;
 *   3. the pair members form one contiguous run, and each prefixed pair's members are adjacent;
 *   4. the comment introducing the block says `same value` and names both scan roots.
 *
 * It reads source and a committed template only, so it runs in `lint:check` with no secrets, and it
 * cannot see values: `scripts/check-env-pairs-agree.mjs` compares the values in an operator's env
 * file. There is no opt-out; excusing a case means editing this file. Node built-ins only.
 *
 * Usage:
 *   node scripts/assert-env-pair-registry.mjs
 *
 * Exit codes:
 *   0 - every derived pair is registered in the `.env.example` block
 *   1 - an unregistered, duplicated, scattered or unexplained pair, or a scan root or template this
 *       guard could not read
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DENO_ROOT, FRONTEND_ROOT, derivePairs, parseEnvAssignments } from './lib/env-pairs.mjs';

const SELF = 'scripts/assert-env-pair-registry.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

const ENV_EXAMPLE = '.env.example';

/**
 * The phrases the `.env.example` block header must contain: that the members must agree, and which
 * runtime reads which spelling. Checked against `.env.example` alone.
 */
const HEADER_PHRASES = ['same value', DENO_ROOT, FRONTEND_ROOT].map((phrase) => phrase.toLowerCase());

let violations = 0;

function fail(message) {
  console.error(`[ERROR] ${SELF}: ${message}`);
}

function violate(message) {
  violations++;
  fail(message);
}

/** Read a file, or fail closed. */
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
  const derived = derivePairs(fail);
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

  // A same-name pair's two members are one name, assigned once in this template.
  const membersOf = (pair) =>
    pair.kind === 'same-name'
      ? [[pair.deno, pair.denoSite]]
      : [
          [pair.frontend, pair.frontendSite],
          [pair.deno, pair.denoSite]
        ];
  const memberNames = [...new Set(pairs.flatMap((pair) => membersOf(pair).map(([member]) => member)))];

  // --- Check 1: both members of every pair are assigned, exactly once ---
  for (const pair of pairs) {
    for (const [member, site] of membersOf(pair)) {
      const positions = positionsByName.get(member) ?? [];
      if (positions.length === 0) {
        violate(
          `the cross-runtime pair '${pair.name}' is read by both runtimes — '${pair.deno}' at ` +
            `${pair.denoSite} and '${pair.frontend}' at ${pair.frontendSite} — but '${member}' is ` +
            `not assigned anywhere in '${ENV_EXAMPLE}'. A twin nobody documented is a twin nobody ` +
            'sets, and the two spellings have drifted apart undetected before. Add it to ' +
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
    if (pair.kind === 'same-name') continue;
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
          'which spelling; without that the block is a run of unrelated-looking variables.'
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
    `Cross-runtime env-pair registry guard — ` +
      `source scanned: ${census.denoFiles} Deno file(s) under ${DENO_ROOT}, ` +
      `${census.frontendFiles} frontend file(s) under ${FRONTEND_ROOT}; ` +
      `env reads found in code: ${census.denoReads} Deno, ${census.frontendReads} PUBLIC_, ` +
      `${census.frontendPrivateReads} $env/dynamic/private; ` +
      `pairs derived: ${pairs.length} (${pairs.map((pair) => `${pair.name} [${pair.kind}]`).join(', ') || 'none'}); ` +
      `${ENV_EXAMPLE} assignments: ${assignments.length}. ${violations} violation(s).`
  );

  process.exitCode = violations > 0 ? 1 : 0;
}

main();
