/**
 * Test file for checkArabicPlaceholders.ts (placeholder-safety check).
 *
 * These tests verify the six integrity checks the script must perform.
 * Run via: cd frontend && tsx tools/checkArabicPlaceholders/checkArabicPlaceholders.verify.ts
 *
 * Standalone dev tool — not wired into vitest or CI.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const SCRIPT = path.resolve(import.meta.dirname, 'checkArabicPlaceholders.ts');

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.info(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}`);
    failed++;
  }
}

function runScript(args: Array<string> = []): { stdout: string; exitCode: number } {
  try {
    const result = execSync(`tsx ${SCRIPT} ${args.join(' ')}`, {
      encoding: 'utf8',
      cwd: path.resolve(import.meta.dirname, '../..')
    });
    return { stdout: result, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return { stdout: (e.stdout ?? '') + (e.stderr ?? ''), exitCode: e.status ?? 1 };
  }
}

// Test 1: Baseline — current repo (ar == en) exits 0
console.info('\nTest 1: Baseline ar==en exits 0');
{
  const { stdout, exitCode } = runScript();
  assert(exitCode === 0, 'exits 0 on baseline ar==en state');
  assert(stdout.includes('Summary:'), 'stdout contains Summary: line');
  assert(stdout.includes('0 checks failed'), 'Summary shows 0 failures on baseline');
}

// Test 2: Dropped ICU token → exits 1
console.info('\nTest 2: Dropped ICU token exits 1');
{
  const syntheticData = JSON.stringify({
    testMode: true,
    cases: [
      {
        key: 'test.missingToken',
        en: 'You have {count} items',
        ar: 'لديك عناصر'
      }
    ]
  });
  const tmpFile = path.join(os.tmpdir(), 'gsd-test-case.json');
  fs.writeFileSync(tmpFile, syntheticData, 'utf8');

  try {
    const { stdout, exitCode } = runScript([`--test-file=${tmpFile}`]);
    assert(exitCode === 1, 'exits 1 when ar drops {count} ICU token');
    assert(stdout.includes('FAIL'), 'output includes FAIL for dropped token');
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

// Test 3: Dropped ICU plural construct → exits 1
console.info('\nTest 3: Dropped ICU plural construct exits 1');
{
  const syntheticData = JSON.stringify({
    testMode: true,
    cases: [
      {
        key: 'test.missingPlural',
        en: '{count, plural, =0 {No items} other {# items}}',
        ar: 'عناصر'
      }
    ]
  });
  const tmpFile = path.join(os.tmpdir(), 'gsd-test-plural.json');
  fs.writeFileSync(tmpFile, syntheticData, 'utf8');

  try {
    const { stdout, exitCode } = runScript([`--test-file=${tmpFile}`]);
    assert(exitCode === 1, 'exits 1 when ar drops plural construct');
    assert(stdout.includes('FAIL'), 'output includes FAIL for dropped plural');
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

// Test 4: Dropped HTML tag → exits 1
console.info('\nTest 4: Dropped HTML tag exits 1');
{
  const syntheticData = JSON.stringify({
    testMode: true,
    cases: [
      {
        key: 'test.missingHtml',
        en: 'Click <a href="{url}">here</a>',
        ar: 'انقر هنا'
      }
    ]
  });
  const tmpFile = path.join(os.tmpdir(), 'gsd-test-html.json');
  fs.writeFileSync(tmpFile, syntheticData, 'utf8');

  try {
    const { stdout, exitCode } = runScript([`--test-file=${tmpFile}`]);
    assert(exitCode === 1, 'exits 1 when ar drops HTML tag');
    assert(stdout.includes('FAIL'), 'output includes FAIL for dropped tag');
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

// Test 5: Dropped href target → exits 1
console.info('\nTest 5: Dropped href target exits 1');
{
  const syntheticData = JSON.stringify({
    testMode: true,
    cases: [
      {
        key: 'test.missingHref',
        en: '<a href="{registrationUrl}">Register</a>',
        ar: '<a href="{wrongUrl}">سجّل</a>'
      }
    ]
  });
  const tmpFile = path.join(os.tmpdir(), 'gsd-test-href.json');
  fs.writeFileSync(tmpFile, syntheticData, 'utf8');

  try {
    const { stdout, exitCode } = runScript([`--test-file=${tmpFile}`]);
    assert(exitCode === 1, 'exits 1 when ar has wrong href target');
    assert(stdout.includes('FAIL'), 'output includes FAIL for wrong href');
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

// Test 6: Dropped brand name → exits 1
console.info('\nTest 6: Dropped brand name exits 1');
{
  const syntheticData = JSON.stringify({
    testMode: true,
    cases: [
      {
        key: 'test.missingBrand',
        en: 'Sign in with Bank ID',
        ar: 'تسجيل الدخول'
      }
    ]
  });
  const tmpFile = path.join(os.tmpdir(), 'gsd-test-brand.json');
  fs.writeFileSync(tmpFile, syntheticData, 'utf8');

  try {
    const { stdout, exitCode } = runScript([`--test-file=${tmpFile}`]);
    assert(exitCode === 1, 'exits 1 when ar drops brand name');
    assert(stdout.includes('FAIL'), 'output includes FAIL for dropped brand');
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

// Test 7: Dropped \n newline → exits 1
console.info('\nTest 7: Dropped literal \\n exits 1');
{
  const syntheticData = JSON.stringify({
    testMode: true,
    cases: [
      {
        key: 'test.missingNewline',
        en: 'Hello {firstName},\n\nWelcome!',
        ar: 'مرحباً {firstName} أهلاً وسهلاً!'
      }
    ]
  });
  const tmpFile = path.join(os.tmpdir(), 'gsd-test-newline.json');
  fs.writeFileSync(tmpFile, syntheticData, 'utf8');

  try {
    const { stdout, exitCode } = runScript([`--test-file=${tmpFile}`]);
    assert(exitCode === 1, 'exits 1 when ar drops \\n newline');
    assert(stdout.includes('FAIL'), 'output includes FAIL for dropped newline');
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

// Test 8: Plural token union — expansion does NOT fail
console.info('\nTest 8: Plural arm expansion does not fail');
{
  const syntheticData = JSON.stringify({
    testMode: true,
    cases: [
      {
        key: 'test.pluralExpansion',
        en: '{count, plural, =0 {No candidates} =1 {One candidate} other {# candidates}}',
        ar: '{count, plural, zero {لا مرشحون} one {مرشح واحد} two {مرشحان} few {# مرشحون} many {# مرشحاً} other {# مرشح}}'
      }
    ]
  });
  const tmpFile = path.join(os.tmpdir(), 'gsd-test-plural-expand.json');
  fs.writeFileSync(tmpFile, syntheticData, 'utf8');

  try {
    const { stdout, exitCode } = runScript([`--test-file=${tmpFile}`]);
    assert(exitCode === 0, 'exits 0 when ar expands plural arms (all tokens preserved)');
    assert(!stdout.includes('FAIL'), 'no FAIL output for plural arm expansion');
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

// Summary
console.info(`\n${'='.repeat(50)}`);
console.info(`Test Summary: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('TESTS FAILED');
  process.exit(1);
} else {
  console.info('All tests passed');
  process.exit(0);
}
