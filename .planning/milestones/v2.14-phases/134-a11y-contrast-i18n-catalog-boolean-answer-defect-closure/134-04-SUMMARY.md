---
phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure
plan: 04
subsystem: i18n
tags: [i18n-catalog, paraglide, vitest, regression-guard, translation-key, mf2]

# Dependency graph
requires:
  - phase: 134-03
    provides: "the 7 missing runtime keys in all 7 locales — without them this test fails by construction"
provides:
  - "A per-locale `catalog key-set parity` vitest block (14 tests) asserting both drift directions between src/lib/i18n/translations/ and apps/frontend/messages/"
  - "`getTranslationKeys(locale)` / `getRuntimeCatalogKeys(locale)` helpers encoding the UNWRAPPED-vs-WRAPPED namespace asymmetry between the two catalogs"
  - "`EXPECTED_MESSAGES_ONLY` — an exact-key allowlist for the 7 synthesised `lang.{locale}` keys, replacing any need for a blanket lang.json file exclusion"
  - "Recorded two-direction negative-control evidence that the guard FIRES, not merely lints clean"
affects: [i18n catalog authoring, any future phase adding a translation key, CI unit gate]

actuals:
  tokens: 2300
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Filesystem-level catalog assertion in the unit suite (never a `t()` call — vitest aliases `$lib/paraglide/*` to mocks)"
    - "Set-difference assertion with a named-direction message, so the failure output is the drift itself rather than a diff of two 591-element arrays"
    - "Guard proven by transient two-direction negative control in the working tree, reverted before commit (no `test.skip` residue) — extends the `_guards/eslint-store-guard.test.ts` positive/negative-control precedent"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/i18n/tests/translations.test.ts

key-decisions:
  - "The parity check could NOT reuse the existing `getMessageKeys` — that helper re-prefixes the filename, which is harmless for its cross-LOCALE comparison but produces doubled `components.components.*` keys against the wrapped runtime files. A second reader (`getRuntimeCatalogKeys`, empty prefix) was required; the FLATTENER itself is still the single existing one."
  - "`EXPECTED_MESSAGES_ONLY` built as 7 exact `lang.{locale}` keys, and separately proven to suppress exactly those 7 and nothing more"
  - "Root `yarn test:unit` failure in @openvaa/dev-seed logged as DEF-134-04-01 and NOT fixed — out of scope per the executor scope boundary"

patterns-established:
  - "A key-set guard is only worth its lines if it has been observed failing; the negative control is run in the working tree and its verbatim output recorded in the SUMMARY, never asserted as hypothetical"

requirements-completed: [FIX-02]

coverage:
  - id: D1
    description: "A key authored only in src/lib/i18n/translations/ (missing from the runtime catalog) fails `yarn test:unit`, naming the key and the locale"
    requirement: FIX-02
    verification:
      - kind: other
        ref: "negative control — deleted `components.multipleTextInput.remove` from messages/fi/components.json; observed FAIL naming that key for `fi` only (verbatim output in this SUMMARY)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A key present only in apps/frontend/messages/ (absent from the type-gen source) fails `yarn test:unit`, naming the key and the locale"
    requirement: FIX-02
    verification:
      - kind: other
        ref: "mirror control — injected `components.orphanRuntimeOnlyProbe` into messages/fi/components.json; observed FAIL naming that key for `fi` only (verbatim output in this SUMMARY)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The `lang.{locale}` asymmetry is excluded by an explicit documented key allowlist, not by ignoring messages/{locale}/lang.json"
    requirement: FIX-02
    verification:
      - kind: other
        ref: "read-only node diff — the set suppressed by EXPECTED_MESSAGES_ONLY is exactly ['lang.da','lang.en','lang.et','lang.fi','lang.fr','lang.lb','lang.sv'] in each of the 7 locales; neither failure message above listed any `lang.*` key"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both controls fully reverted; the guard is green on a clean tree and adds exactly 14 tests"
    verification:
      - kind: other
        ref: "`git status --porcelain apps/frontend/messages/` empty after each restore; frontend suite 759 -> 773 passed"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-08-10
status: complete
---

# Phase 134 Plan 04: Cross-Catalog i18n Key-Set Parity Check Summary

**The FIX-02 defect class is now structurally unreinventable: adding a translation key to only one of the two independent i18n catalogs fails `yarn test:unit` with a message naming the key and the drift direction — and the guard was observed failing in BOTH directions before being reverted to green.**

## Performance

- **Duration:** ~12 min
- **Tasks:** 2/2
- **Files modified:** 1 source file (+1 new planning doc)

## Task Commits

1. **Task 1: Add the cross-catalog key-set parity assertions** — `95f773ec8` (`test`)
2. **Task 2: Negative control — prove the guard actually fires** — no source commit *by design*: both
   controls were transient working-tree edits, fully reverted, and the plan forbids leaving a skipped
   or commented-out test behind. The task's output is the evidence recorded below. Its one durable
   artifact — the out-of-scope discovery it surfaced — is committed as `e13632f2d` (`docs`).

## What landed

All in `apps/frontend/src/lib/i18n/tests/translations.test.ts` (+95 lines, one file):

- **`translationsDir`** — sibling constant to the existing `messagesDir`, resolved the same way via
  `fileURLToPath(import.meta.url)`.
- **`getTranslationKeys(locale)`** — reads `src/lib/i18n/translations/{locale}`, filters to `.json`
  (the directory also holds `index.ts` and `translations.type.ts`), and flattens each file with the
  **filename as the namespace prefix**, exactly as `generateTranslationKeyType.ts` does.
- **`getRuntimeCatalogKeys(locale)`** — reads `messages/{locale}` and flattens from an **empty
  prefix**, because those files are wrapped.
- **`EXPECTED_MESSAGES_ONLY`** — the documented `lang.{locale}` allowlist.
- **`describe.each(translationLocales)('catalog key-set parity — %s')`** — two named-direction
  set-difference tests per locale (14 total).

Both readers reuse the **existing** `flattenKeys` (`grep -c 'function flattenKeys'` = 1). Its
`Array.isArray`-as-leaf branch is what makes Plan 03's MF2-shaped `selectExact`
(`"selectExact": [{ declarations, selectors, match }]`) compare as **one** key against the
string-shaped type-gen entry — a naive recursive flattener would emit phantom
`selectExact.match.countPlural=one` keys and both break this test and mask real drift.

### The one non-obvious finding: `getMessageKeys` could not be reused

The plan anticipated reusing the file's existing message reader. It could not be, and the reason is
worth recording. The two catalogs differ in *shape*, not just in content:

| | `src/lib/i18n/translations/en/components.json` | `apps/frontend/messages/en/components.json` |
|---|---|---|
| shape | **UNWRAPPED** — starts at `"accordionSelect"` | **WRAPPED** — `{ "components": { "accordionSelect": … } }` |
| namespace source | the **filename** | the file's own **top-level key** |

The existing `getMessageKeys(locale, filename)` flattens the runtime file with
`filename.replace('.json','')` as prefix, so it actually yields
`components.components.accordionSelect.…` and `adminApp.common.adminApp.common.home`. That doubling
is harmless for its purpose (cross-**locale** comparison, where the offset is constant on both
sides) but is fatal for a cross-**catalog** comparison. Hence a second *reader* with an empty
prefix — while the *flattener* stays the single existing one, which is what the plan's
"do not write a second flattener" constraint was protecting.

A useful side effect: because `getRuntimeCatalogKeys` reads the wrapper key as authored rather than
assuming it matches the filename, a runtime file whose wrapper key drifts from its filename now
also surfaces as parity drift.

## The `messages/en/lang.json` exclusion — how it was handled

`messages/{locale}/lang.json` is the language-selector display-name catalog. It exists runtime-side
only: there is no `translations/{locale}/lang.json` (46 JSON files there vs 47 in `messages/`),
because `tools/translationKey/generateTranslationKeyType.ts:24` **synthesises** the keys —

```ts
const langKeys = locales.map((locale) => `lang.${locale}`);
```

— from the locale directory listing instead of reading a file. That is a legitimate asymmetry, not
drift, and it accounts for the entire numeric gap: **591 type-gen keys vs 598 runtime keys per
locale, in all 7 locales.**

It is handled as an allowlist of **exact keys**, never as a file skip:

```ts
const EXPECTED_MESSAGES_ONLY = new Set(translationLocales.map((locale) => `lang.${locale}`));
```

A blanket "ignore `lang.json`" would also have hidden a genuine regression *inside* that file — a
typo'd `lang.se`, a dropped `lang.et`. With the key allowlist, such a key is not in
`EXPECTED_MESSAGES_ONLY` and still fails.

I did not take that on trust. A read-only node diff printed, per locale, exactly which runtime keys
the exclusion is suppressing:

```
da suppressed-by-EXPECTED_MESSAGES_ONLY: ["lang.da","lang.en","lang.et","lang.fi","lang.fr","lang.lb","lang.sv"]
en suppressed-by-EXPECTED_MESSAGES_ONLY: ["lang.da","lang.en","lang.et","lang.fi","lang.fr","lang.lb","lang.sv"]
et suppressed-by-EXPECTED_MESSAGES_ONLY: ["lang.da","lang.en","lang.et","lang.fi","lang.fr","lang.lb","lang.sv"]
fi suppressed-by-EXPECTED_MESSAGES_ONLY: ["lang.da","lang.en","lang.et","lang.fi","lang.fr","lang.lb","lang.sv"]
fr suppressed-by-EXPECTED_MESSAGES_ONLY: ["lang.da","lang.en","lang.et","lang.fi","lang.fr","lang.lb","lang.sv"]
lb suppressed-by-EXPECTED_MESSAGES_ONLY: ["lang.da","lang.en","lang.et","lang.fi","lang.fr","lang.lb","lang.sv"]
sv suppressed-by-EXPECTED_MESSAGES_ONLY: ["lang.da","lang.en","lang.et","lang.fi","lang.fr","lang.lb","lang.sv"]
```

Exactly the 7 synthesised keys, in every locale — the exclusion is neither vacuous nor over-broad.
It suppresses nothing it was not written to suppress.

## Negative control — the guard was observed FIRING (both directions)

**This was actually run**, twice, as transient edits to the working tree. Both failure messages below
are copied verbatim from the terminal, not reconstructed.

### Precondition (before any control)

A read-only key-set diff confirmed Plan 03's handoff claim on a clean tree:

```
da tkeys=591 mkeys=598 missing=0 orphan=0
en tkeys=591 mkeys=598 missing=0 orphan=0
et tkeys=591 mkeys=598 missing=0 orphan=0
fi tkeys=591 mkeys=598 missing=0 orphan=0
fr tkeys=591 mkeys=598 missing=0 orphan=0
lb tkeys=591 mkeys=598 missing=0 orphan=0
sv tkeys=591 mkeys=598 missing=0 orphan=0
```

### Control 1 — forward direction (`translations \ messages`)

Deleted `components.multipleTextInput.remove` (a plain string, so restoration is byte-exact) from
`apps/frontend/messages/fi/components.json`, then ran
`yarn workspace @openvaa/frontend test:unit -t "parity"`:

```
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/lib/i18n/tests/translations.test.ts > catalog key-set parity — fi > every type-gen key exists in the runtime catalog
AssertionError: [fi] authored in src/lib/i18n/translations/ but MISSING from messages/fi/ — t() will render these raw dotted key paths to users: expected [ Array(1) ] to deeply equal []

- Expected
+ Received

- []
+ [
+   "components.multipleTextInput.remove",
+ ]

 ❯ src/lib/i18n/tests/translations.test.ts:163:7
    161|       missingFromRuntime,
    162|       `[${locale}] authored in src/lib/i18n/translations/ but MISSING …
    163|     ).toEqual([]);
       |       ^
    164|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed | 53 skipped (54)
```

Exactly one failure, on the **forward** direction, for **`fi` only** (the other 6 locales' parity
tests stayed green), naming the deleted key and stating the user-visible consequence. No `lang.*`
key appears.

### Control 2 — reverse direction (`messages \ translations`)

Restored the file (`git status --porcelain apps/frontend/messages/` → empty), then injected a
runtime-only orphan `"orphanRuntimeOnlyProbe": "drift probe"` under `components` in the same file:

```
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/lib/i18n/tests/translations.test.ts > catalog key-set parity — fi > every runtime key exists in the type-gen catalog
AssertionError: [fi] present in messages/fi/ but MISSING from src/lib/i18n/translations/ — TranslationKey will not include these, so t() cannot be called with them: expected [ 'components.orphanRuntimeOnlyProbe' ] to deeply equal []

- Expected
+ Received

- []
+ [
+   "components.orphanRuntimeOnlyProbe",
+ ]

 ❯ src/lib/i18n/tests/translations.test.ts:174:7
    172|       missingFromTypeGen,
    173|       `[${locale}] present in messages/${locale}/ but MISSING from src…
    174|     ).toEqual([]);
       |       ^
    175|   });
    176| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed | 53 skipped (54)
```

Exactly one failure, on the **reverse** direction, for `fi` only, naming the injected key. Again **no
`lang.*` key is listed** — had `EXPECTED_MESSAGES_ONLY` been broken or absent, all 7 `lang.*` keys
would have appeared alongside the probe in this list. That is the direct evidence the reverse
assertion is not vacuous.

### Restoration and return to green

Both controls were restored from a pristine copy taken before the first edit:

```
$ git status --porcelain apps/frontend/messages/
(empty)
```

Full working tree after restoration holds only the six briefed pre-existing dirt entries — nothing
from the controls survived:

```
 M .planning/REQUIREMENTS.md
 M .planning/phases/133-fix-phase-132-code-review-gaps/deferred-items.md
 M supabase/.temp/cli-latest
 M tests/tests/utils/voterIntro.ts
?? .planning/todos/pending/2026-08-09-intro-step-list-renders-before-data-ready.md
?? .planning/v2.14-MILESTONE-AUDIT.md
```

Frontend suite re-run to green afterwards: **54 files / 773 tests passed.** The committed diff
contains no `test.skip`, no `describe.skip`, and no commented-out assertion (grep-verified = 0).

## Verification Results

| Check | Command | Result |
|---|---|---|
| Frontend unit baseline (pre-task) | `yarn workspace @openvaa/frontend test:unit` | **54 files / 759 passed** — matches the plan's stated 759 baseline |
| Frontend unit after Task 1 | same | **54 files / 773 passed**, exit 0 — **+14**, exactly 2 × 7 locales |
| Parity tests in isolation | `yarn workspace @openvaa/frontend test:unit -t "parity"` | `Tests 14 passed \| 759 skipped (773)`, exit 0 |
| Flattener not duplicated | `grep -c 'function flattenKeys'` | **1** |
| Non-JSON siblings filtered | `grep -c "endsWith('.json')"` | **2** (≥1 required) |
| Exclusion declared + used | `grep -c 'EXPECTED_MESSAGES_ONLY'` | **2** (≥2 required) |
| No mocked-runtime import | `grep -c "from '\$lib/paraglide"` | **0** |
| svelte-check | `yarn workspace @openvaa/frontend check` | `COMPLETED 2690 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Lint | `yarn lint:check` | **exit 0** (3 pre-existing warnings, none in this file) |
| Prettier, target file | `npx prettier --check <file>` | "All matched files use Prettier code style!" |
| Prettier, repo-wide | `yarn format:check` | **exit 0 — GREEN** |
| Frontend suite after controls reverted | `yarn workspace @openvaa/frontend test:unit` | 54 files / 773 passed, exit 0 |
| Root aggregate | `yarn test:unit` | **exit 1** — see below |

### `yarn format:check` — now green (correcting Plan 03's record)

Plan 03's SUMMARY recorded `yarn format:check` as exiting 1 with 188 pre-existing repo-wide
failures. As of commit `4c5b64116` (repo-wide prettier pass, 187 files) that backlog is cleared:
`yarn format:check` now **exits 0** repo-wide, and it still does with this plan's change applied.
The host test file was reformatted by that pass, which is why it was re-read from disk rather than
edited against the plan's quoted line numbers.

### Root `yarn test:unit` — the one red, and exactly how I observed it

Root aggregate **exits 1**. The frontend is green; the sole failure is in `@openvaa/dev-seed`.

**Provenance, stated precisely: I saw this ONLY via the root turbo aggregate (`yarn test:unit` at
the repo root). I did NOT run the `@openvaa/dev-seed` suite in isolation, and I did not re-run it to
check reproducibility.** Everything below is scraped from that single root run's log.

Turbo summary:

```
 Tasks:    17 successful, 19 total
Cached:    7 cached, 19 total
  Time:    30.9s
Failed:    @openvaa/dev-seed#test:unit
```

The failing assertion, verbatim:

```
 ❯ tests/integration/default-template.integration.test.ts (1 test | 1 failed) 24291ms
   × default template integration (DX-03) > applies default template and meets NF-01 (<10s) + D-58-20 assertions 23639ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/integration/default-template.integration.test.ts > default template integration (DX-03) > applies default template and meets NF-01 (<10s) + D-58-20 assertions
AssertionError: expected 23630 to be less than 10000

 Test Files  1 failed | 41 passed (42)
      Tests  1 failed | 443 passed (444)
```

It is a **wall-clock performance budget** (NF-01, seed step ≤ 10 000 ms), not a correctness
assertion — the other 443 dev-seed tests pass, including every row-count, relational-wiring,
portrait and locale-fan-out assertion in that same file's suite.

**Not caused here, and not fixed here.** This plan's entire diff is one file under
`apps/frontend/`. `packages/dev-seed/package.json` declares no dependency on `@openvaa/frontend`
(deps: `app-shared`, `core`, `matching`, `supabase-types`, `supabase-js`, `faker`, `zod`), and
`grep -rn 'openvaa/frontend' packages/dev-seed/` returns nothing — there is no path by which a
frontend unit test can affect that timing. Logged as **DEF-134-04-01** in the phase's
`deferred-items.md` (commit `e13632f2d`) per the executor scope boundary. The orchestrator has since
confirmed it owns this item; I made no attempt to fix or re-run it.

One note for whoever picks it up: the test is gated on `SUPABASE_URL` and seeds the **live** local
Supabase, which currently also has a dev server attached — so the 10 s budget was measured under
contention. That is a plausible (but **unverified**) explanation, not a diagnosis. The test does
self-teardown (`seed_` prefix + `TEST_PROJECT_ID` storage cleanup), so its one run left no residue.

## Deviations from Plan

### 1. [Rule 3 — blocking] `getMessageKeys` could not be reused; a second *reader* was required

- **Found during:** Task 1
- **Issue:** The plan and PATTERNS §4 imply the runtime side can be read with the existing
  `getMessageKeys`. It cannot: that helper re-prefixes the filename onto files that are already
  wrapped in their namespace, yielding `components.components.*` / `adminApp.common.adminApp.common.*`.
  Every key would have mismatched.
- **Fix:** Added `getRuntimeCatalogKeys(locale)`, which flattens from an empty prefix. The
  **flattener** is still the single existing `flattenKeys` — the constraint the plan actually cared
  about ("do not write a second flattener") is honoured; `grep -c` confirms 1.
- **Impact:** None on the plan's intent; the WRAPPED-vs-UNWRAPPED asymmetry the plan called
  "load-bearing" simply cuts both ways, and both sides are now documented in the code.
- **Committed in:** `95f773ec8`

### 2. [Reporting] Task 2's `yarn test:unit` criterion could not be met as written

- **Found during:** Task 2
- **Issue:** The plan's verification requires root `yarn test:unit` to exit 0. It exits 1 on the
  dev-seed NF-01 budget assertion.
- **Action taken:** None on the failure itself (out of scope, unreachable from this diff). Recorded
  as failing-as-stated with its real output rather than restated as passing, and filed as
  DEF-134-04-01. The frontend workspace criterion — the one this plan can actually speak to — passes
  at 773/773.

### 3. [Additive] A third, unplanned check on the exclusion set

- **Found during:** Task 2
- **Rationale:** Controls 1 and 2 prove `EXPECTED_MESSAGES_ONLY` is not *over-suppressing* (the
  probe keys still surfaced) but do not prove it suppresses *only* the intended 7. A read-only node
  diff was added to close that gap; output above.
- **Impact:** No source change — a throwaway read-only script, nothing written to the tree.

**Total deviations:** 1 substantive (Rule 3, mechanical), 1 reporting note, 1 additive verification.
No Rule 4 (architectural) questions arose. No packages installed; `yarn.lock` untouched.

## Issues Encountered

None blocking. The parity check passed on the first run against the post-Plan-03 catalogs, which
independently corroborates Plan 03's D5 claim of 0 missing keys.

## Known Stubs

None.

## Threat Flags

None. T-134-09 (catalog drift reintroducing an untranslated user-facing string) is **mitigated** —
this plan is that mitigation, and Task 2 discharges the "prove it fires" obligation rather than
assuming it. T-134-10 accepted as planned: the added reads are 46–47 small JSON files × 7 locales,
and the frontend suite still completes in ~4.6 s (759 → 773 tests added no measurable time). No new
attack surface: a filesystem-reading unit test in an existing file, with every path resolved from
`import.meta.url` and no path component derived from input.

## Outstanding for later plans

- **DEF-134-04-01** — `@openvaa/dev-seed` NF-01 budget failure. Orchestrator-owned. Root
  `yarn test:unit` will keep exiting 1 until it is resolved or re-baselined; anyone treating "root
  unit suite green" as a phase gate needs to account for it.
- **The guard is key-set only, by design.** It cannot catch a key that exists in both catalogs with
  a *wrong or untranslated value* (e.g. an English string sitting in `fi`). Plan 03 deliberately gave
  up byte-diff drift detection for `selectExact` when it made the runtime side MF2-shaped (D-09), and
  this check does not replace that. Value-level parity remains uncovered.
- **Nothing here needs the dev server or the database.** The E2E suite was deliberately not run —
  that is Plan 06/08's gate. The dev server on `:5173` and local Supabase were left untouched.

## Self-Check: PASSED

- `apps/frontend/src/lib/i18n/tests/translations.test.ts` — FOUND, contains the parity describe block
- `.planning/phases/134-.../deferred-items.md` — FOUND
- Commit `95f773ec8` — FOUND in `git log`
- Commit `e13632f2d` — FOUND in `git log`
- `git diff --diff-filter=D HEAD~1 HEAD` — empty for both commits (no file deletions)
- `git status --porcelain` — only the six briefed pre-existing dirt entries; `.planning/STATE.md` and
  `.planning/ROADMAP.md` untouched, as instructed

---
_Phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure_
_Completed: 2026-08-10_
