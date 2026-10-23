---
phase: arabic-translations
reviewed: 2026-06-15T00:00:00Z
depth: deep
files_reviewed: 49
files_reviewed_list:
  - frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts
  - frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.verify.ts
  - frontend/src/lib/i18n/translations/ar/about.json
  - frontend/src/lib/i18n/translations/ar/adminApp.argumentCondensation.json
  - frontend/src/lib/i18n/translations/ar/adminApp.common.json
  - frontend/src/lib/i18n/translations/ar/adminApp.error.json
  - frontend/src/lib/i18n/translations/ar/adminApp.factorAnalysis.json
  - frontend/src/lib/i18n/translations/ar/adminApp.jobs.json
  - frontend/src/lib/i18n/translations/ar/adminApp.languageFeatures.json
  - frontend/src/lib/i18n/translations/ar/adminApp.login.json
  - frontend/src/lib/i18n/translations/ar/adminApp.notSupported.json
  - frontend/src/lib/i18n/translations/ar/adminApp.questionInfo.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.basicInfo.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.common.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.error.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.help.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.home.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.info.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.login.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.logoutModal.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.notSupported.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.preregister.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.preview.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.privacy.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.questions.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.register.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.resetPassword.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.setPassword.json
  - frontend/src/lib/i18n/translations/ar/candidateApp.settings.json
  - frontend/src/lib/i18n/translations/ar/common.json
  - frontend/src/lib/i18n/translations/ar/components.json
  - frontend/src/lib/i18n/translations/ar/constituencies.json
  - frontend/src/lib/i18n/translations/ar/dynamic.json
  - frontend/src/lib/i18n/translations/ar/elections.json
  - frontend/src/lib/i18n/translations/ar/entityCard.json
  - frontend/src/lib/i18n/translations/ar/entityDetails.json
  - frontend/src/lib/i18n/translations/ar/entityFilters.json
  - frontend/src/lib/i18n/translations/ar/entityList.json
  - frontend/src/lib/i18n/translations/ar/error.json
  - frontend/src/lib/i18n/translations/ar/feedback.json
  - frontend/src/lib/i18n/translations/ar/help.json
  - frontend/src/lib/i18n/translations/ar/info.json
  - frontend/src/lib/i18n/translations/ar/maintenance.json
  - frontend/src/lib/i18n/translations/ar/privacy.json
  - frontend/src/lib/i18n/translations/ar/questions.json
  - frontend/src/lib/i18n/translations/ar/results.json
  - frontend/src/lib/i18n/translations/ar/statistics.json
  - frontend/src/lib/i18n/translations/ar/yourList.json
  - backend/vaa-strapi/src/util/translations/ar/dynamic.json
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase arabic-translations: Code Review Report

**Reviewed:** 2026-06-15
**Depth:** deep
**Files Reviewed:** 49 (2 primary, 47 translation content)
**Status:** issues_found (2 warnings in check script; translations are clean)

## Summary

Reviewed the D-06 placeholder-safety check script (`checkArabicPlaceholders.ts` and its
verify harness) plus all 46 frontend `ar/` translation files and the backend
`backend/vaa-strapi/src/util/translations/ar/dynamic.json`.

**Check script** — the core logic is sound. The union-scan approach (full-string regex over the
entire ICU string rather than per-arm parsing) correctly produces the token union without needing
recursive arm parsing. The lowercase-identifier narrowing (`[a-z_][a-zA-Z0-9_]*`) correctly
suppresses the `{However, select ...}` false positive (prose inside a plural arm) that was the
motivation for the filter. Two latent false-negative gaps exist at the boundary of the current
token and construct inspection sets; they affect future translations only, not the current corpus.

**Translation content** — all automated integrity checks pass against the full 575-key corpus:
zero ICU token drops, zero HTML tag drops, zero href mismatches, zero brand name (`OpenVAA`,
`Bank ID`) drops, zero literal `\n` newline drops, zero emoji drops, zero JSON parse errors,
and perfect key parity (575 en keys = 575 ar keys, 0 missing, 0 extra). The backend
`ar/dynamic.json` is byte-identical to the synced frontend copy. The =0/=1 numeric plural
selectors in Arabic are correctly reduced to CLDR word-based categories (`zero/one/two/few/many/other`)
where those categories replace the numeric selector semantics — this is correct ICU behaviour
for Arabic, not a defect.

The findings below are confined to the check script. Linguistic quality of the MSA Arabic
content is out of scope per D-08 (deferred to native-speaker review).

---

## Warnings

### WR-01: `number` construct absent from `ICU_CONSTRUCTS` check list but present in `ICU_KEYWORDS`

**File:** `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts:90,121`

**Issue:** `ICU_KEYWORDS` (line 90) includes `'number'` so it is excluded from the token-name
check. However `ICU_CONSTRUCTS` (line 121) omits `'number'`, so if a future translation string
uses `{count, number, ...}` and the Arabic version drops the `number` format construct entirely,
the construct-presence check will not catch it. The lists are asymmetric without comment.
The current corpus has no `{x, number, ...}` strings, so this is not an active defect, but the
gap is invisible to the next translator.

```
// line 90
const ICU_KEYWORDS = new Set(['plural', 'select', 'selectordinal', 'number', 'date', 'time']);

// line 121
const ICU_CONSTRUCTS = ['plural', 'select', 'date', 'selectordinal'] as const;
// 'number' and 'time' are missing here
```

**Fix:** Either add `'number'` and `'time'` to `ICU_CONSTRUCTS`, or add a comment explaining
why they are intentionally excluded:

```typescript
// ICU_CONSTRUCTS: construct keywords whose presence must be verified in ar values.
// 'number' and 'time' are intentionally omitted — they are not used in this codebase
// (verified 2026-06-15). If either is added in future translations, add them here.
const ICU_CONSTRUCTS = ['plural', 'select', 'date', 'selectordinal'] as const;
```

---

### WR-02: Lowercase-identifier narrowing creates a silent false-negative for any future UpperCamelCase token

**File:** `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts:107`

**Issue:** `extractTokens` requires token names to start with `[a-z_]` (line 107) to avoid
matching capitalised prose words inside plural arms (e.g. `{However, select …}`). This is
correct for the current corpus where every real token is lowerCamelCase. However, the script
has no assertion or documentation making this assumption explicit. If a future token is ever
introduced with an UpperCamelCase name (e.g. `{FirstName}` instead of `{firstName}`), it would
be silently excluded from checking in both `extractTokens` (EN side) and `extractConstructs`
(EN side), producing a zero-check result rather than a failure, regardless of what the Arabic
value contains.

```typescript
// line 107 — current regex
const re = /\{([a-z_][a-zA-Z0-9_]*)[,}]/g;
```

**Fix:** Add an explicit comment documenting the codebase-wide convention assumption:

```typescript
// Require identifier to start with [a-z_] to exclude capitalised English prose words
// (e.g. {However, select …}) that appear inside ICU arm text.
// ASSUMPTION: all placeholder tokens in this codebase use lowerCamelCase (e.g. {numShown}).
// If an UpperCamelCase token is ever added, this filter must be updated.
const re = /\{([a-z_][a-zA-Z0-9_]*)[,}]/g;
```

---

## Info

### IN-01: No error handling around JSON.parse / fs calls in CLI entry point

**File:** `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.ts:310-323`

**Issue:** The main entry point and `runTestMode` call `fs.readFileSync` and `JSON.parse`
without try/catch. A missing file, a missing locale directory, or malformed JSON produces an
unhandled exception with a Node.js stack trace rather than a clean error message, and still
exits non-zero — so it will not produce a false-negative. The only consequence is a worse
developer experience when debugging.

**Fix:** Wrap the entry point in a try/catch that prints a clean message:

```typescript
try {
  result = testFileArg ? runTestMode(testFilePath) : runChecks(loadLocaleMap('en'), loadLocaleMap('ar'));
} catch (e) {
  process.stderr.write(`ERROR: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(2); // distinct exit code from check failures (1)
}
```

---

### IN-02: `verify.ts` merges stdout and stderr on failure, potentially polluting assertion strings

**File:** `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.verify.ts:39`

**Issue:** The `catch` block returns `(e.stdout ?? '') + (e.stderr ?? '')` as a combined
`stdout` string. If `tsx` emits loader warnings or deprecation notices to stderr, those could
in theory cause `stdout.includes('FAIL')` to match a stderr message rather than the intended
FAIL line from the check script. Not a current defect (tsx is quiet on exit 1) but fragile.

```typescript
// line 39 — current
return { stdout: (e.stdout ?? '') + (e.stderr ?? ''), exitCode: e.status ?? 1 };
```

**Fix:** Keep stdout and stderr separate and only assert against stdout:

```typescript
return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', exitCode: e.status ?? 1 };
```

---

### IN-03: `verify.ts` `execSync` calls have no timeout

**File:** `frontend/tools/checkArabicPlaceholders/checkArabicPlaceholders.verify.ts:32-40`

**Issue:** `execSync` is invoked without a `timeout` option. If `tsx` or the check script
hangs (rare but possible in CI under resource contention), the verify harness blocks
indefinitely. As a developer-only tool not wired into CI this has low impact, but a
defensive timeout would make the harness self-terminating.

**Fix:**

```typescript
const result = execSync(`tsx ${SCRIPT} ${args.join(' ')}`, {
  encoding: 'utf8',
  cwd: path.resolve(import.meta.dirname, '../..'),
  timeout: 30_000  // 30 s — ample for a translation scan
});
```

---

_Reviewed: 2026-06-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
