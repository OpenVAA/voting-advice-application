---
title: The extension-bearing relative-specifier class is wider than `.js` — 9 `.ts`-bearing specifiers survive Plan 07's fix, 7 of them mandatorily
created: 2026-08-29
updated: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 07
priority: low
suggested_phase: future-build-tooling
keywords:
  [
    import-path-policy,
    relative-specifier,
    extension,
    moduleResolution,
    bundler,
    deno,
    edge-functions,
    argument-condensation,
    allowImportingTsExtensions,
    REVIEW-CFG-07,
    criterion-wording,
    scan-scope
  ]
---

# The extension-bearing specifier class is wider than `.js`

## Origin

Phase 153 Plan 07 Task 2 removed the four `.js`-bearing relative specifiers from
`packages/supabase-types/src/index.ts`. Its must-have criterion is worded:

> *"a repo-wide scan for TS-internal **extension-bearing** relative specifiers in `packages`, `apps`
> and `tests` returns **0** where it returned 4."*

Read against the policy the same criterion cites — `packages/README.md`'s **"Import-path policy."**
bullet, which is about `.js` specifically and whose own stated verification grep is
`grep -rEn "from ['\"]\.+/.*\.js['\"]"` restricted to `packages/{core,data,matching,filters}/src/` —
the criterion is `.js`-scoped, and Plan 07 met it exactly: **4 → 0**, measured, both halves.

Read by its literal words — *any* extension — the repo does **not** return 0. This entry records what
the wider scan actually finds, so that a later reader (in particular Phase 153's close-out) does not
mistake a wording gap for an unmet criterion, and does not "fix" files that must not be fixed.

## Measurement

Taken 2026-08-29, after Plan 07 Task 2 landed (`d5327830b`), over `packages apps tests`,
`--include='*.ts'`, matching `from`, `import(` and `require(`:

| Extension | Count | Location |
|---|---|---|
| `.js` | **0** | — (was 4, all in `packages/supabase-types/src/index.ts`) |
| `.ts` | **9** | 7 in `apps/supabase/supabase/functions/**`, 2 in `packages/argument-condensation/tests/` |

The nine, in full:

```
apps/supabase/supabase/functions/invite-candidate/index.ts:2   './jwtSegment.ts'
apps/supabase/supabase/functions/invite-candidate/index.ts:3   './envConfig.ts'
apps/supabase/supabase/functions/identity-callback/index.ts:29 './claimConfig.ts'
apps/supabase/supabase/functions/identity-callback/index.ts:30 './envConfig.ts'
apps/supabase/supabase/functions/identity-callback/index.ts:31 './verifyConfig.ts'
apps/supabase/supabase/functions/send-email/index.ts:3         './jwtSegment.ts'
apps/supabase/supabase/functions/send-email/index.ts:4         './templateVars.ts'
apps/supabase/supabase/functions/send-email/index.ts:5         './envConfig.ts'
packages/argument-condensation/tests/condensation/condenseQuestions.test.ts:10 '../../src/api.ts'
packages/argument-condensation/tests/condensation/condenseQuestions.test.ts:11 '../../src/core/types/index.ts'
```

## Dispositions

**The seven Supabase Edge Function specifiers: CORRECT AS-IS. Do not touch them.** These run under
**Deno**, which requires fully-specified module specifiers; the extension is mandatory, not stylistic.
`packages/README.md`'s import-path policy is a statement about the TypeScript packages built with
`tsup` under `moduleResolution: Bundler` — it does not reach Deno sources and should not be applied to
them. Anyone widening a scan to "any extension" **must** exclude
`apps/supabase/supabase/functions/**` or they will produce a guard that demands a change which breaks
the edge functions.

**The two `argument-condensation` test specifiers: genuinely unclassified.** They are `.ts`-bearing
relative imports from a test file into the package's own `src/`. They are neither the `.js` form the
policy names nor a Deno requirement. Open questions, none answered here:

- Is this deliberate (e.g. relying on `allowImportingTsExtensions`, or on the test file living outside
  `tsconfig.json`'s `include` — see `2026-08-23-package-tests-outside-tsconfig-include`) or incidental?
- Does the policy intend to cover `.ts` specifiers at all? The bullet's wording and its own verify grep
  both say `.js`, so on the document's face the answer is no — but that may be an omission rather than
  a decision, in the same way `packages/README.md`'s required-devDeps sentence omits `tsup`
  (`2026-08-28-153-packages-readme-required-devdeps-omits-tsup`).

Plan 07 did not touch either file. Its criterion names one file, its scope is criterion 7's two named
files, and `packages/argument-condensation` is neither.

## Why this is filed rather than fixed

Two distinct hazards, both of the kind this milestone exists to remove:

1. **A criterion whose words are wider than its check.** Plan 07's automated verify greps `.js` and is
   correct to; the must-have's prose says "extension-bearing" and would read as unmet against a literal
   scan. A close-out reader comparing the prose to a naive `grep` gets a false negative on a criterion
   that is genuinely met.
2. **A scan that would be wrong if widened naively.** Widening to "any extension" without excluding
   Deno sources yields 9 violations, 7 of which must never be fixed. That is the shape of a guard that
   pressures a contributor into breaking production code to turn a check green.

## Suggested approach

If the policy is to be stated precisely, the two moves are independent:

- Amend `packages/README.md`'s "Import-path policy." bullet to say what it covers and what it excludes:
  `.js` specifiers in `tsup`/`vitest`-built TypeScript, explicitly **not** the Deno edge functions.
- Classify the two `argument-condensation` test specifiers — deliberate or incidental — and either
  normalise them or record them under "Justified divergences".

Neither is urgent. Nothing is broken; the ambiguity is in the prose.

## Cross-links

- `packages/README.md` — "Import-path policy." bullet of § Paradigm summary (the `.js`-scoped policy
  and its `.js`-scoped verify grep, restricted to the four canonical packages — which never covered
  `packages/supabase-types` in the first place).
- `packages/supabase-types/src/index.ts` — the four specifiers Plan 07 fixed (`d5327830b`).
- `apps/supabase/supabase/functions/**` — the Deno sources that must keep their extensions.
- `packages/argument-condensation/tests/condensation/condenseQuestions.test.ts` — the two unclassified
  specifiers.
- `.planning/todos/pending/2026-08-23-package-tests-outside-tsconfig-include.md` — plausibly why the
  `argument-condensation` test's specifiers are unchecked.
- `.planning/phases/153-build-tooling-config-correctness/153-07-PLAN.md` — must-have criterion 4, and
  Task 2's `.js`-scoped automated verify.
- `.planning/phases/153-build-tooling-config-correctness/153-07-SUMMARY.md` — the run this was found in.

## Tags

#import-path-policy #documentation #deno #edge-functions #scan-scope #criterion-wording #found-in-153-07
