/**
 * Suite-wide raw-i18n-key scanner (sweep finding F2).
 *
 * ## The defect class this closes
 *
 * `apps/frontend/src/lib/i18n/wrapper.ts:40` returns the **raw dotted key path** when a catalog lookup misses (and again at line 33 when an interpolation throws). So a broken catalog does not render an empty string or a crash — it renders `questions.multiChoice.selectExact` as literal, user-visible text.
 *
 * That makes the failure mode *satisfy* a large family of the suite's own matchers: `toContainText(/Yes/i)` passes against `common.answer.yes`, `/select/i` passes against `questions.multiChoice.selectExact`. The 2026-08-11 fake-guard sweep cross-matched every regex in a text-assertion or accessible-name position against all 598 English keys and found **21 sites** where the matcher is satisfied by the exact failure it guards.
 *
 * Patching those 21 sites closes 21 holes. This scanner closes the **class**: it derives its key set from the catalog at runtime, so it covers all 598 keys today and every key added later. It would have caught the `selectExact` defect without needing a seeded equal-min/max question.
 *
 * ## Why it derives the key set instead of pattern-matching
 *
 * A hardcoded shape guess (`/\w+\.\w+\.\w+/`) fails in both directions: it over-matches legitimate content (URLs, filenames, version strings, email addresses all carry dot-separated tokens) and under-matches future keys it was never told about. Here the regex is only a cheap *candidate extractor* run in the page; the decision is an **exact-match against the real catalog**, performed in Node. A token that is not a key the app could have rendered cannot fail this scan, which is what keeps the false-positive rate at zero without an allowlist.
 *
 * ## Where it runs
 *
 * Wired into `assertAxeScan` in `tests/tests/utils/axeScan.ts` — the shared scan core BOTH a11y specs import — so every axe-scanned surface is also raw-key-scanned. That is **14 routes x 2 themes = 28 surfaces**: the 7 voter routes of `specs/a11y/a11y-smoke.spec.ts` and the 7 candidate `(protected)` routes of `specs/a11y/candidate-a11y.spec.ts`. Each is already navigated, settled on its data-driven `contentTestId` anchor, and past `awaitAnimationsSettled`. The pages are loaded and quiescent at that point, so the marginal cost is a single DOM read.
 *
 * It once ran on the voter half alone (7 routes x 2 themes = 14 surfaces).
 * The candidate half was blind, and the negative control's `RK1-OLD` / `RK2-OLD` rows are the measurement of that blindness: two candidate-side matchers passed while the exact keys they guard rendered raw.
 *
 * The core calls `collectRawI18nKeyFindings` rather than `assertNoRawI18nKeys`, so a raw-key finding no longer suppresses the axe result on the same surface.
 * Both verdicts are reported; neither short-circuits the other.
 */

import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { TESTS_DIR } from './testsDir';
import type { Page } from '@playwright/test';

const FRONTEND_DIR = path.join(TESTS_DIR, '..', '..', 'apps', 'frontend');

/**
 * The runtime Paraglide message catalog for the base locale. Each file's top-level object key already carries the namespace (`common.json` opens with `"common"`, `candidateApp.questions.json` with `"candidateApp.questions"`), so the flattened paths are already the exact strings `t()` echoes back on a miss — no filename-derived prefixing required here.
 *
 * The base locale is enough: `project.inlang/settings.json` declares one `pathPattern` set across all 7 locales, so the KEY set is locale-invariant even though the values are not. A raw key rendered in any locale is the same string in every locale.
 */
const RUNTIME_CATALOG_DIR = path.join(FRONTEND_DIR, 'messages', 'en');

/**
 * The type-gen source catalog. Unlike the runtime catalog these files do NOT embed their namespace — the prefix comes from the FILENAME, exactly as `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` does it.
 */
const TYPEGEN_CATALOG_DIR = path.join(FRONTEND_DIR, 'src', 'lib', 'i18n', 'translations', 'en');

/**
 * The generated `TranslationKey` union — the compile-time enumeration of every string a call site is ALLOWED to pass to `t()`, and therefore of every string `t()` can possibly echo back.
 */
const TRANSLATION_KEY_TYPE_FILE = path.join(FRONTEND_DIR, 'src', 'lib', 'types', 'generated', 'translationKey.ts');

/**
 * Non-vacuity floor for the key set.
 *
 * A scanner whose key set silently empties — a moved catalog directory, a renamed locale folder, a JSON parse that yields `{}` — would pass every surface forever while checking nothing. That is the exact failure shape this whole plan exists to eliminate, so an implausibly small key set is a hard error rather than a quiet green. The three sources currently agree on 598 keys; the floor sits far below that so ordinary catalog churn never trips it.
 */
const MIN_EXPECTED_KEYS = 400;

/**
 * Candidate-token shape: a dotted run of at least two segments whose first segment starts with a letter. Verified to match **all 598** catalog keys, including the three numeric-segment outliers (`error.403`, `error.404`, `error.500`) — which is why later segments allow a leading digit while the first does not.
 *
 * Deliberately permissive: it is a pre-filter, not the verdict. Everything it extracts is then required to be an exact catalog key.
 */
const DOTTED_TOKEN_PATTERN = '[A-Za-z][A-Za-z0-9]*(?:\\.[A-Za-z0-9]+)+';

/** A raw-key sighting: which key, and where in the DOM it was rendered. */
interface RawKeyFinding {
  /** The catalog key that rendered verbatim. */
  key: string;
  /** The full dotted token the key was found in (equal to `key` unless glued to neighbouring text). */
  token: string;
  /** `text` for a text node, or the attribute name for an accessible-name hit. */
  source: string;
  /** A short DOM path to the offending element, for diagnosis. */
  element: string;
  /** Up to 120 chars of the surrounding string. */
  excerpt: string;
}

/** What the in-page extractor hands back, before any catalog filtering. */
interface TokenSighting {
  token: string;
  source: string;
  element: string;
  excerpt: string;
}

let cachedKeys: ReadonlySet<string> | undefined;

/**
 * Flatten a message-catalog object into dotted key paths.
 *
 * Arrays are LEAVES, not containers: the inlang message-format plugin encodes pluralised / selector-driven messages as an array of match objects (`questions.multiChoice.selectExact` is one), and recursing into those would mint nonsense paths like `…selectExact.0.declarations.0` that `t()` can never return. Mirrors the flattening in `apps/frontend/tools/translationKey/generateTranslationKeyType.ts`.
 */
function flattenCatalog(node: unknown, prefix: string, into: Set<string>): void {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    if (prefix) into.add(prefix);
    return;
  }
  for (const [segment, value] of Object.entries(node as Record<string, unknown>)) {
    flattenCatalog(value, prefix ? `${prefix}.${segment}` : segment, into);
  }
}

/** Flatten every `*.json` in `dir` into `into`, optionally prefixing by filename. */
function flattenCatalogDir(dir: string, prefixFromFilename: boolean, into: Set<string>): void {
  for (const filename of fs.readdirSync(dir)) {
    if (!filename.endsWith('.json')) continue;
    const parsed: unknown = JSON.parse(fs.readFileSync(path.join(dir, filename), 'utf8'));
    flattenCatalog(parsed, prefixFromFilename ? filename.replace(/\.json$/, '') : '', into);
  }
}

/**
 * The set of dotted key paths the app could echo back on a miss — derived from disk, memoised for the worker's lifetime. Nothing here is hardcoded, so a key added tomorrow is guarded tomorrow.
 *
 * ## Why the UNION of three sources and not just the runtime catalog
 *
 * The three sources agree on 598 keys today (the runtime catalog is a strict superset, holding the 7 synthesized `lang.<locale>` entries the other two derive differently). Taking the union anyway is not belt-and-braces — it is what makes the scanner cover the most likely real regression:
 *
 * A key **deleted from the runtime catalog while call sites still reference it** is precisely how a raw key reaches the screen. If the key set came from the runtime catalog alone, that deletion would remove the key from the scanner's own expectations at the same instant it started rendering raw — the scan would go green on the very defect it exists to catch. Because `t()` is typed against `TranslationKey` (generated from the type-gen catalog, a DIFFERENT directory), such a call site still compiles, so TypeScript does not cover this either.
 *
 * Reading all three closes that: a key has to disappear from every source at once to escape, and at that point no call site can reference it.
 */
export function loadCatalogKeys(): ReadonlySet<string> {
  if (cachedKeys) return cachedKeys;
  const keys = new Set<string>();

  // 1. Runtime Paraglide catalog — namespace embedded in the JSON.
  flattenCatalogDir(RUNTIME_CATALOG_DIR, false, keys);
  // 2. Type-gen source catalog — namespace derived from the filename.
  flattenCatalogDir(TYPEGEN_CATALOG_DIR, true, keys);
  // 3. The generated `TranslationKey` union — every literal in the file is a key.
  for (const [, literal] of fs.readFileSync(TRANSLATION_KEY_TYPE_FILE, 'utf8').matchAll(/'([^']+)'/g)) {
    keys.add(literal);
  }

  expect(
    keys.size,
    `Raw-i18n-key scanner loaded only ${keys.size} catalog keys (floor: ${MIN_EXPECTED_KEYS}). ` +
      'The catalog sources have moved or failed to parse, and the scanner would pass vacuously. ' +
      `Checked:\n  ${RUNTIME_CATALOG_DIR}\n  ${TYPEGEN_CATALOG_DIR}\n  ${TRANSLATION_KEY_TYPE_FILE}`
  ).toBeGreaterThanOrEqual(MIN_EXPECTED_KEYS);

  cachedKeys = keys;
  return keys;
}

/**
 * Every contiguous dot-delimited sub-run of `token` that is two or more segments long, longest first.
 *
 * The exact token is checked first and is the overwhelmingly common case. The sub-runs exist because `innerText`-adjacent inline nodes can glue a rendered key to a neighbouring dotted token (`common.answer.yesfoo.bar`), which would otherwise slip past an equality test. Precision is unaffected: a sub-run still has to BE a real catalog key to count.
 */
function dottedSubruns(token: string): Array<string> {
  const segments = token.split('.');
  const runs: Array<string> = [];
  for (let length = segments.length; length >= 2; length--) {
    for (let start = 0; start + length <= segments.length; start++) {
      runs.push(segments.slice(start, start + length).join('.'));
    }
  }
  return runs;
}

/**
 * Collect every dotted-token sighting from the rendered page: visible text nodes plus the four accessible-name attributes a miss can leak into (`aria-label`, `alt`, `title`, `placeholder`).
 *
 * Text is read PER TEXT NODE rather than from `document.body.innerText`. Node-level reads keep unrelated strings from being concatenated into a single blob (which both manufactures phantom tokens and hides real ones), and they give the failure message a precise element to point at.
 *
 * `display:none` / `visibility:hidden` subtrees are skipped via `checkVisibility()`. Screen-reader-only text is NOT skipped — it is clipped, not hidden, so it stays in scope, which is correct: a raw key spoken to a screen reader is exactly as broken as one painted on screen.
 */
async function collectTokenSightings(page: Page): Promise<Array<TokenSighting>> {
  return page.evaluate((pattern) => {
    const sightings: Array<TokenSighting> = [];
    const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
    const nameAttributes = ['aria-label', 'alt', 'title', 'placeholder'];

    function isVisible(element: Element): boolean {
      return typeof element.checkVisibility === 'function' ? element.checkVisibility() : true;
    }

    function describeElement(element: Element): string {
      const parts: Array<string> = [];
      let node: Element | null = element;
      for (let depth = 0; node && depth < 4; depth++) {
        const testId = node.getAttribute('data-testid');
        const id = node.getAttribute('id');
        parts.unshift(`${node.tagName.toLowerCase()}${testId ? `[data-testid="${testId}"]` : ''}${id ? `#${id}` : ''}`);
        node = node.parentElement;
      }
      return parts.join(' > ');
    }

    function record(value: string, source: string, element: Element): void {
      // A fresh RegExp per call — a shared /g instance carries `lastIndex` between calls and would skip matches.
      const matches = value.match(new RegExp(pattern, 'g'));
      if (!matches) return;
      for (const token of matches) {
        sightings.push({
          token,
          source,
          element: describeElement(element),
          excerpt: value.trim().slice(0, 120)
        });
      }
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || skipTags.has(parent.tagName) || !isVisible(parent)) continue;
      record(node.nodeValue ?? '', 'text', parent);
    }

    for (const element of Array.from(document.body.querySelectorAll('*'))) {
      if (skipTags.has(element.tagName) || !isVisible(element)) continue;
      for (const attribute of nameAttributes) {
        const value = element.getAttribute(attribute);
        if (value) record(value, attribute, element);
      }
    }

    return sightings;
  }, DOTTED_TOKEN_PATTERN);
}

/**
 * The raw-key verdict for one surface: what was found, and the failure message that describes it. `message` is `undefined` when `findings` is empty, so it can be passed straight into `expect(findings, message)` — an `undefined` message leaves Playwright's own default in place on the passing path.
 */
export interface RawI18nKeyVerdict {
  findings: Array<RawKeyFinding>;
  message: string | undefined;
}

/**
 * Compute — and do NOT assert — the raw-key verdict for `page`: every string the catalog can echo back on a miss that is rendered verbatim, as visible text or as an accessible name.
 *
 * ## Why this is separate from the assertion
 *
 * The reporting rule is: compute both verdicts in one body, report both, neither short-circuiting the other. The defect that rule removes is THIS function's caller short-circuiting: `assertNoRawI18nKeys` terminates in a throwing `expect`, so a raw-key failure used to suppress the axe result on that surface entirely — the surface reported one defect when it may have had two. Splitting the DETECTION (here) from the ASSERTION (`assertNoRawI18nKeys`, below) lets the shared scan body take the verdict without taking the throw, and report both.
 *
 * The detection itself — the key-set derivation, the sub-run walk, the sighting collection — is deliberately unchanged by that split: it is the instrument the `RK1-OLD` / `RK2-OLD` negative controls were taken with, and the same injections are re-run against it.
 *
 * `label` names the surface (the a11y scan label) so a failure says WHICH of the
 * **28** scanned surfaces broke — 14 voter (`a11y-smoke.spec.ts`) and 14 candidate (`candidate-a11y.spec.ts`), each route in both themes. It was 14 before the gate was extended across the candidate `(protected)` family.
 */
export async function collectRawI18nKeyFindings(page: Page, label: string): Promise<RawI18nKeyVerdict> {
  const catalogKeys = loadCatalogKeys();
  const sightings = await collectTokenSightings(page);

  const findings: Array<RawKeyFinding> = [];
  for (const sighting of sightings) {
    const key = catalogKeys.has(sighting.token)
      ? sighting.token
      : dottedSubruns(sighting.token).find((run) => catalogKeys.has(run));
    if (key) findings.push({ ...sighting, key });
  }

  const report = findings.map(
    (finding) => `  - "${finding.key}" (as ${finding.source}) in ${finding.element}\n      excerpt: ${finding.excerpt}`
  );

  return {
    findings,
    message:
      findings.length === 0
        ? undefined
        : `Untranslated i18n key(s) rendered on "${label}" — t() echoed the raw key path because the ` +
          `catalog lookup missed (i18n/wrapper.ts:40). ${catalogKeys.size} catalog keys were checked.\n` +
          report.join('\n')
  };
}

/**
 * Fail if any string the catalog can echo back on a miss is rendered verbatim on `page` — as visible text or as an accessible name.
 *
 * The hard, fail-fast entry point. The shared a11y scan body does NOT use it — it uses `collectRawI18nKeyFindings` and reports the verdict without letting it suppress the axe result (Decision (B)). This wrapper is kept because the fail-fast shape is the right one for any caller that is not also computing a second verdict on the same DOM read.
 *
 * There is no allowlist. If this ever fires, the honest reading is that a real catalog/Paraglide-compilation regression shipped and the catalog needs fixing — not that the scanner needs loosening. Should a genuine collision ever appear (legitimate copy that happens to BE a catalog key verbatim), an exclusion must name that exact string and say why it is legitimate; a broad pattern would swallow the failures this exists to catch.
 */
export async function assertNoRawI18nKeys(page: Page, label: string): Promise<void> {
  const { findings, message } = await collectRawI18nKeyFindings(page, label);
  expect(findings, message).toEqual([]);
}
