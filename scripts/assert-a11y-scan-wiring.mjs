#!/usr/bin/env node

/**
 * A11Y-SCAN WIRING GUARD (phase 147, requirements CSCAN-02 / CSCAN-03).
 *
 * The incident this file exists for: Phase 147 wired the candidate half of the
 * axe/raw-key scan family (`candidate-a11y-scan`, 14 scans) into
 * `tests/playwright.config.ts` and its shared scan core
 * (`tests/tests/utils/axeScan.ts`), but nothing STANDING re-asserts that
 * wiring. Phase 147's own ordering instrument
 * (`tests/e2e-runs/147/phases.mjs`) is gitignored, so it proves nothing about
 * future commits. Removing either the `candidate-a11y-scan` project or its
 * dependency edge into `data-setup-perm-1e1cg1co` drops 14 scans from the
 * suite; the suite then reports FEWER tests and STILL 0 failures — a green
 * that means nothing (CLAUDE.md's "did not run" == failure rule, restated as
 * a static config guard rather than a runtime one, because the tests simply
 * would not exist to fail).
 *
 * FOUR checks, each a distinct way that green-but-blind could reoccur:
 *
 *   Check 1 (CSCAN-02a) — `candidate-a11y-scan` remains a project in
 *     `tests/playwright.config.ts`, gated by the same `PLAYWRIGHT_NO_A11Y`
 *     opt-out as `a11y-smoke`, with an explicit `testMatch` for
 *     `candidate-a11y.spec.ts` and a `storageState`.
 *   Check 2 (CSCAN-02a) — `a11y-smoke` keeps its explicit `testMatch` for
 *     `a11y-smoke.spec.ts`. Without it, both specs sharing `testDir:
 *     './tests/specs/a11y'` means `a11y-smoke` collects the candidate spec
 *     too and runs it WITHOUT the stored session — every candidate route 307s
 *     to login, and the scan reports a confident, silently-wrong zero
 *     (playwright.config.ts's own docblock at this site, restated as a check).
 *   Check 3 (CSCAN-02b) — `candidate-a11y-scan` is named in
 *     `data-setup-perm-1e1cg1co`'s `dependencies` array, so the candidate scan
 *     runs BEFORE the perm family's `app_settings` singleton REPLACE.
 *   Check 4 (CSCAN-02 criterion 6 / CSCAN-03) — strictness parity + ordering.
 *     Neither `a11y-smoke.spec.ts` nor `candidate-a11y.spec.ts` constructs its
 *     own `AxeBuilder` or calls `.withTags(` — both must obtain their gate
 *     from the one shared `assertAxeScan` in `tests/tests/utils/axeScan.ts`.
 *     And in `axeScan.ts` itself, the raw-key verdict
 *     (`collectRawI18nKeyFindings`) is computed and reported via
 *     `expect.soft` BEFORE `new AxeBuilder(...)` runs, and `assertAxeGates`
 *     always runs after — so a raw-key finding can never suppress the axe
 *     result on the same surface (147-ORDERING.md § Decision (B)).
 *
 * This is a plain text/regex read of the three source files, matching the
 * house style of `scripts/assert-unit-test-coverage.mjs` (Node built-ins
 * only, no build step, exit 1 naming the specific problem). It is
 * deliberately NOT an AST parse: these are single-sourced, hand-authored
 * config/source files with one occurrence of each pattern, and a regex read
 * is the cheapest thing that can name the violation precisely.
 *
 * Usage:
 *   node scripts/assert-a11y-scan-wiring.mjs
 *
 * Exit codes:
 *   0 - all four checks clean
 *   1 - at least one violation, or a named precondition failure (a file
 *       missing or unreadable)
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'scripts/assert-a11y-scan-wiring.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

const PLAYWRIGHT_CONFIG = path.resolve(REPO_ROOT, 'tests', 'playwright.config.ts');
const AXE_SCAN_UTIL = path.resolve(REPO_ROOT, 'tests', 'tests', 'utils', 'axeScan.ts');
const A11Y_SMOKE_SPEC = path.resolve(REPO_ROOT, 'tests', 'tests', 'specs', 'a11y', 'a11y-smoke.spec.ts');
const CANDIDATE_A11Y_SPEC = path.resolve(REPO_ROOT, 'tests', 'tests', 'specs', 'a11y', 'candidate-a11y.spec.ts');

function readSource(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(
      `[ERROR] ${SELF}: could not read '${path.relative(REPO_ROOT, filePath)}' (${error.message}). ` +
        'A file this guard cannot read is wiring it cannot verify — this fails closed.'
    );
    return null;
  }
}

function main() {
  const configSrc = readSource(PLAYWRIGHT_CONFIG);
  const axeScanSrc = readSource(AXE_SCAN_UTIL);
  const a11ySmokeSrc = readSource(A11Y_SMOKE_SPEC);
  const candidateA11ySrc = readSource(CANDIDATE_A11Y_SPEC);

  if (configSrc === null || axeScanSrc === null || a11ySmokeSrc === null || candidateA11ySrc === null) {
    process.exitCode = 1;
    return;
  }

  let violations = 0;
  const violate = (message) => {
    violations++;
    console.error(`[ERROR] ${SELF}: ${message}`);
  };

  // --- Check 1: candidate-a11y-scan project, gated + testMatch + storageState ---
  const candidateProjectMatch = configSrc.match(
    /name:\s*'candidate-a11y-scan'[\s\S]{0,400}?dependencies:\s*\[[^\]]*\]/
  );
  if (!candidateProjectMatch) {
    violate(
      "tests/playwright.config.ts no longer declares a 'candidate-a11y-scan' project (or its shape " +
        'changed enough that this guard cannot find it). Losing this project drops 14 candidate a11y ' +
        'scans from the suite silently (CSCAN-02).'
    );
  } else {
    const block = candidateProjectMatch[0];
    if (!/testMatch:\s*\/candidate-a11y\\\.spec\\\.ts\//.test(block)) {
      violate(
        "'candidate-a11y-scan' project no longer has an explicit testMatch for candidate-a11y.spec.ts. " +
          'Without it, project selection over the shared testDir is ambiguous (CSCAN-02).'
      );
    }
    if (!/storageState:\s*STORAGE_STATE/.test(block)) {
      violate(
        "'candidate-a11y-scan' project no longer supplies storageState: STORAGE_STATE. Without it, " +
          'candidate (protected) routes are unreachable and every scan would 307 to login (CSCAN-01/02).'
      );
    }
  }
  // Gated by the same opt-out as a11y-smoke — the project must sit inside the
  // `process.env.PLAYWRIGHT_NO_A11Y ? [] : [ ... ]` conditional array, alongside
  // 'a11y-smoke'.
  const a11yGateBlock = configSrc.match(/process\.env\.PLAYWRIGHT_NO_A11Y[\s\S]{0,900}?\]\),/);
  if (!a11yGateBlock || !a11yGateBlock[0].includes("name: 'candidate-a11y-scan'")) {
    violate(
      "'candidate-a11y-scan' is no longer inside the PLAYWRIGHT_NO_A11Y-gated project array alongside " +
        "'a11y-smoke'. It must default-on and share the same opt-out (CSCAN-02)."
    );
  }

  // --- Check 2: a11y-smoke explicit testMatch ---
  const a11ySmokeProjectMatch = configSrc.match(/name:\s*'a11y-smoke'[\s\S]{0,300}?dependencies:\s*\[[^\]]*\]/);
  if (!a11ySmokeProjectMatch) {
    violate("tests/playwright.config.ts no longer declares an 'a11y-smoke' project.");
  } else if (!/testMatch:\s*\/a11y-smoke\\\.spec\\\.ts\//.test(a11ySmokeProjectMatch[0])) {
    violate(
      "'a11y-smoke' project no longer has an explicit testMatch for a11y-smoke.spec.ts. Both a11y " +
        "specs share testDir: './tests/specs/a11y' — without the testMatch, 'a11y-smoke' would " +
        'collect the candidate spec too and run it UNAUTHENTICATED: every candidate route 307s to ' +
        'login and the scan reports a silently-wrong-and-green zero (CSCAN-02).'
    );
  }

  // --- Check 3: candidate-a11y-scan named in data-setup-perm-1e1cg1co dependencies ---
  const permSetupMatch = configSrc.match(/name:\s*'data-setup-perm-1e1cg1co'[\s\S]{0,900}?\}/);
  if (!permSetupMatch) {
    violate("tests/playwright.config.ts no longer declares a 'data-setup-perm-1e1cg1co' project.");
  } else if (!permSetupMatch[0].includes("'candidate-a11y-scan'")) {
    violate(
      "'data-setup-perm-1e1cg1co' no longer names 'candidate-a11y-scan' in its dependencies array. " +
        'Without the explicit edge, the candidate scan is only INCIDENTALLY ordered before the perm ' +
        "family's app_settings REPLACE (via 'candidate-journey' sharing its phase) — a later edit that " +
        'reorders phases could silently run the scan against a mutated singleton (CSCAN-02).'
    );
  }

  // --- Check 4a: neither spec constructs its own AxeBuilder / withTags ---
  for (const [label, src] of [
    ['a11y-smoke.spec.ts', a11ySmokeSrc],
    ['candidate-a11y.spec.ts', candidateA11ySrc]
  ]) {
    // Strip comments/docblocks before scanning for real usage, so a doc mention
    // of "new AxeBuilder" (as in a11y-smoke.spec.ts's own docblock) is not a
    // false positive.
    const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    if (/new AxeBuilder/.test(codeOnly) || /\.withTags\(/.test(codeOnly)) {
      violate(
        `${label} constructs its own AxeBuilder or calls .withTags(\`), instead of obtaining the gate ` +
          "from the shared 'assertAxeScan' in tests/tests/utils/axeScan.ts. A per-spec AxeBuilder can " +
          'relax the WCAG tag set independently of the other half, breaking strictness parity (CSCAN-02 ' +
          'criterion 6).'
      );
    }
    if (!/from\s+'\.\.\/\.\.\/utils\/axeScan'/.test(src) || !/assertAxeScan/.test(src)) {
      violate(`${label} no longer imports assertAxeScan from '../../utils/axeScan' — the shared scan core.`);
    }
  }

  // --- Check 4b: raw-key verdict computed+reported before AxeBuilder; assertAxeGates unconditional after ---
  const bodyMatch = axeScanSrc.match(/export async function assertAxeScan[\s\S]*?\n\}/);
  if (!bodyMatch) {
    violate("tests/tests/utils/axeScan.ts no longer exports an 'assertAxeScan' function this guard can find.");
  } else {
    const body = bodyMatch[0];
    const rawKeysIdx = body.indexOf('collectRawI18nKeyFindings(page, label)');
    const axeBuilderIdx = body.indexOf('new AxeBuilder(');
    const softIdx = body.indexOf('expect.soft(rawKeys.findings');
    const gatesIdx = body.indexOf('assertAxeGates(results, testInfo, label)');

    if (rawKeysIdx === -1 || axeBuilderIdx === -1 || softIdx === -1 || gatesIdx === -1) {
      violate(
        "assertAxeScan's body no longer contains one of the four expected calls " +
          '(collectRawI18nKeyFindings, new AxeBuilder, expect.soft(rawKeys.findings, assertAxeGates) — ' +
          'this guard cannot verify the ordering invariant (CSCAN-03).'
      );
    } else {
      if (!(rawKeysIdx < axeBuilderIdx)) {
        violate(
          'the raw-key verdict is no longer computed BEFORE the axe scan in assertAxeScan. The raw-key ' +
            'read must happen against the same DOM axe is about to read, before an untranslated catalog ' +
            'changes the accessible names axe sees (CSCAN-03).'
        );
      }
      if (!(axeBuilderIdx < softIdx)) {
        violate(
          'expect.soft(rawKeys.findings, ...) no longer follows the axe scan in assertAxeScan — the ' +
            'ordering that lets both verdicts be computed before either is reported has changed ' +
            '(147-ORDERING.md § Decision (B) / CSCAN-03).'
        );
      }
      if (!(softIdx < gatesIdx)) {
        violate(
          'assertAxeGates no longer runs unconditionally AFTER the soft raw-key assertion in ' +
            'assertAxeScan. If assertAxeGates were skipped or short-circuited by a raw-key failure, a ' +
            'surface with both defects would report only one of them again (CSCAN-03).'
        );
      }
    }
  }

  console.log(`A11y-scan wiring guard (phase 147: CSCAN-02, CSCAN-03) — ${violations} violation(s).`);
  process.exitCode = violations > 0 ? 1 : 0;
}

main();
