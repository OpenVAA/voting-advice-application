/**
 * Placeholder-safety check script.
 *
 * Verifies that every Arabic (ar) translation value preserves all of the following tokens present in the corresponding English (en) value:
 *   1. ICU placeholder token names ({token})
 *   2. ICU construct keywords (plural, select, date, selectordinal)
 *   3. HTML tag names (<a>, <p>, <ul>, <li>, <h3>, …)
 *   4. href attribute values (href="…")
 *   5. Latin-kept brand names ("Bank ID", "OpenVAA")
 *   6. Literal \n newline characters
 *
 * Exits 0 if all checks pass. Exits 1 if any check fails.
 *
 * Usage (from frontend/ directory):
 *   tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts
 *
 * Test mode:
 *   tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.ts --test-file=/path/to/cases.json
 *
 * Standalone dev tool — not wired into vitest or CI.
 *
 * Reuses the flattenKeys [key, value] pattern from editTranslations/editTranslations.ts.
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TranslationObject = { [key: string]: string | TranslationObject };
type FlatMap = Map<string, string>;

interface TestCase {
  key: string;
  en: string;
  ar: string;
}

interface TestFile {
  testMode: boolean;
  cases: Array<TestCase>;
}

interface CheckResult {
  failCount: number;
  passCount: number;
}

// ---------------------------------------------------------------------------
// Flatten helpers (pattern from editTranslations.ts)
// ---------------------------------------------------------------------------

/**
 * Recursively flattens a nested translation object into a flat map of dotted keys to string values.
 * Reuses the [key, value] approach from editTranslations.ts flattenKeys.
 */
function flattenKeys(obj: TranslationObject | string, prefix?: string): Array<[string, string]> {
  const res: Array<[string, string]> = [];
  const p = prefix ? `${prefix}.` : '';
  for (const [key, value] of Object.entries(obj)) {
    const newKey = `${p}${key}`;
    if (typeof value === 'object' && value !== null) {
      res.push(...flattenKeys(value, newKey));
    } else {
      res.push([newKey, value as string]);
    }
  }
  return res;
}

function buildFlatMap(obj: TranslationObject): FlatMap {
  const map: FlatMap = new Map();
  for (const [key, value] of flattenKeys(obj)) {
    map.set(key, value);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Check helpers
// ---------------------------------------------------------------------------

/**
 * ICU keywords that appear as identifier-like names inside {…} constructs but are not placeholder token names — exclude them from the ICU token check.
 */
const ICU_KEYWORDS = new Set(['plural', 'select', 'selectordinal', 'number', 'date', 'time']);

/**
 * Extract the UNION of all {identifier} token names from a value (across all plural/select arms). Excludes ICU keywords so that constructs like `{count, plural, …}` do not produce a false "count" token unless {count} also appears as a simple interpolation.
 *
 * Only recognises identifiers starting with a lowercase letter or underscore — ICU placeholder names in this codebase always use lowerCamelCase (e.g. {numShown}, {candidatePlural}). This avoids false positives from capitalised English words (e.g. "However") that appear as plain prose inside ICU plural arms but happen to be followed by a comma.
 */
function extractTokens(value: string): Set<string> {
  const tokens = new Set<string>();
  // Match {identifier} or {identifier, …} — capture the identifier name. Require the identifier to start with a lowercase letter or underscore (not an uppercase letter) to avoid matching capitalised English words inside plural arm text (e.g. {However, select…}).
  const re = /\{([a-z_][a-zA-Z0-9_]*)[,}]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    const name = m[1];
    if (!ICU_KEYWORDS.has(name)) {
      tokens.add(name);
    }
  }
  return tokens;
}

/**
 * Extract ICU construct keywords that appear in a value (e.g. "plural", "select"). Kept in sync with the construct keywords in ICU_KEYWORDS so a construct can never be silently dropped by a translation: `number` and `time` are included even though no current string uses them, so a future `{x, number, …}` / `{x, time, …}` is guarded too.
 */
const ICU_CONSTRUCTS = ['plural', 'select', 'date', 'time', 'number', 'selectordinal'] as const;

function extractConstructs(value: string): Set<string> {
  const found = new Set<string>();
  for (const kw of ICU_CONSTRUCTS) {
    // Match "{identifier, keyword," — construct keyword presence. Require the variable name to start with a lowercase letter or underscore (lowerCamelCase convention used in this codebase) to avoid false positives from capitalised English words appearing as prose inside ICU arm text (e.g. "…other {However, select enough…}").
    if (new RegExp(`\\{[a-z_][a-zA-Z0-9_]*,\\s*${kw}[,\\s]`).test(value)) {
      found.add(kw);
    }
  }
  return found;
}

/**
 * Extract HTML tag names from a value (both opening and closing).
 */
function extractHtmlTags(value: string): Set<string> {
  const tags = new Set<string>();
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    tags.add(m[1].toLowerCase());
  }
  return tags;
}

/**
 * Extract href attribute values from a string (e.g. href="{registrationUrl}" → ["{registrationUrl}"]).
 */
function extractHrefs(value: string): Array<string> {
  const hrefs: Array<string> = [];
  const re = /href="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    hrefs.push(m[1]);
  }
  return hrefs;
}

const BRAND_NAMES = ['Bank ID', 'OpenVAA'] as const;

function truncate(s: string, maxLen = 80): string {
  return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
}

// ---------------------------------------------------------------------------
// Six per-key checks
// ---------------------------------------------------------------------------

function checkKey(key: string, enVal: string, arVal: string, failures: Array<string>): number {
  let checks = 0;

  // 1. ICU placeholder token set
  const enTokens = extractTokens(enVal);
  const arTokens = extractTokens(arVal);
  for (const token of enTokens) {
    checks++;
    if (!arTokens.has(token)) {
      failures.push(
        `FAIL [${key}]: missing ICU token {${token}} — en: "${truncate(enVal)}" | ar: "${truncate(arVal)}"`
      );
    }
  }

  // 2. ICU construct presence
  const enConstructs = extractConstructs(enVal);
  const arConstructs = extractConstructs(arVal);
  for (const construct of enConstructs) {
    checks++;
    if (!arConstructs.has(construct)) {
      failures.push(
        `FAIL [${key}]: missing ICU construct "${construct}" — en: "${truncate(enVal)}" | ar: "${truncate(arVal)}"`
      );
    }
  }

  // 3. HTML tag set — en tag set must be a subset of ar
  const enTags = extractHtmlTags(enVal);
  const arTags = extractHtmlTags(arVal);
  for (const tag of enTags) {
    checks++;
    if (!arTags.has(tag)) {
      failures.push(`FAIL [${key}]: missing HTML tag <${tag}> — en: "${truncate(enVal)}" | ar: "${truncate(arVal)}"`);
    }
  }

  // 4. href targets — each en href must appear verbatim in ar
  const enHrefs = extractHrefs(enVal);
  for (const href of enHrefs) {
    checks++;
    if (!arVal.includes(`href="${href}"`)) {
      failures.push(`FAIL [${key}]: missing href="${href}" — en: "${truncate(enVal)}" | ar: "${truncate(arVal)}"`);
    }
  }

  // 5. Latin brand names — each brand present in en must appear literally in ar
  for (const brand of BRAND_NAMES) {
    if (enVal.includes(brand)) {
      checks++;
      if (!arVal.includes(brand)) {
        failures.push(`FAIL [${key}]: missing brand "${brand}" — en: "${truncate(enVal)}" | ar: "${truncate(arVal)}"`);
      }
    }
  }

  // 6. Literal \n newline preservation
  // JSON-parsed strings have actual newline char (\n); we check for it directly.
  if (enVal.includes('\n')) {
    checks++;
    if (!arVal.includes('\n')) {
      failures.push(`FAIL [${key}]: missing literal \\n newline — en: "${truncate(enVal)}" | ar: "${truncate(arVal)}"`);
    }
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Load translation files from disk
// ---------------------------------------------------------------------------

// Reads both translations/en and translations/ar locale trees.
const TRANSL_DIR = path.resolve(import.meta.dirname, '../../src/lib/i18n/translations');

function loadLocaleMap(locale: string): FlatMap {
  const localeDir = path.join(TRANSL_DIR, locale);
  const combined: FlatMap = new Map();
  const files = fs.readdirSync(localeDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(localeDir, file), 'utf8');
    const obj = JSON.parse(raw) as TranslationObject;
    const flat = buildFlatMap(obj);
    const prefix = file.replace(/\.json$/, '');
    for (const [k, v] of flat) {
      combined.set(`${prefix}.${k}`, v);
    }
  }
  return combined;
}

// ---------------------------------------------------------------------------
// Run checks
// ---------------------------------------------------------------------------

function runChecks(enMap: FlatMap, arMap: FlatMap): CheckResult {
  const failures: Array<string> = [];
  let totalChecks = 0;

  for (const [key, enVal] of enMap) {
    if (typeof enVal !== 'string') continue;
    const arVal = arMap.get(key);
    if (typeof arVal !== 'string') continue; // key missing in ar — handled by parity test
    totalChecks += checkKey(key, enVal, arVal, failures);
  }

  for (const failure of failures) {
    process.stdout.write(`${failure}\n`);
  }

  const failCount = failures.length;
  const passCount = totalChecks - failCount;
  process.stdout.write(`Summary: ${failCount} checks failed, ${passCount} passed.\n`);

  return { failCount, passCount };
}

// ---------------------------------------------------------------------------
// Test mode: accept synthetic cases via --test-file flag
// ---------------------------------------------------------------------------

function runTestMode(testFilePath: string): CheckResult {
  const raw = fs.readFileSync(testFilePath, 'utf8');
  const data = JSON.parse(raw) as TestFile;
  const enMap: FlatMap = new Map();
  const arMap: FlatMap = new Map();
  for (const c of data.cases) {
    enMap.set(c.key, c.en);
    arMap.set(c.key, c.ar);
  }
  return runChecks(enMap, arMap);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const testFileArg = args.find((a) => a.startsWith('--test-file='));

let result: CheckResult;
if (testFileArg) {
  const testFilePath = testFileArg.slice('--test-file='.length);
  result = runTestMode(testFilePath);
} else {
  const enMap = loadLocaleMap('en');
  const arMap = loadLocaleMap('ar');
  result = runChecks(enMap, arMap);
}

process.exit(result.failCount > 0 ? 1 : 0);
