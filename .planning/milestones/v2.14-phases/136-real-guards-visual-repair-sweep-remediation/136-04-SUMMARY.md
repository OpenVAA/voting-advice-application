---
phase: 136-real-guards-visual-repair-sweep-remediation
plan: 04
subsystem: testing
tags: [playwright, e2e, i18n, paraglide, a11y, negative-control, systemic-guard]

# Dependency graph
requires:
  - phase: 136-01
    provides: "The a11y fixture timing after the 10s dead-wait removal, and the DEF-135-03 stale-listener hazard in its new form (a foreign project's Vite server on :5173)"
  - phase: 135
    provides: "The negative-control discipline (prove the guard fails before claiming it guards), and the AXE_ROUTES table shape the scanner rides on"
  - phase: 134
    provides: "The selectExact catalog defect that motivated F2 — the concrete failure this scanner would have caught without a seeded equal-min/max question"
provides:
  - "A catalog-derived raw-i18n-key scanner that fails the suite if any of the 598 message keys renders verbatim on any a11y-scanned surface, in either theme"
  - "Proof by negative control that the scanner fires, naming the offending key and its DOM path"
  - "A key set unioned from three derived sources, so deleting a key from the runtime catalog cannot silently delete the scanner's own expectation of it"
  - "A non-vacuity floor on the key set — a moved or unparseable catalog is a hard error, not a forever-green scan"
  - "voter-journey.spec.ts:1338 now asserts the resolved boolean answer exactly, closing the suite's only standing check on the boolean-answer render path"
affects: [a11y-smoke, voter-journey, any future a11y route added to AXE_ROUTES, any future i18n catalog change, candidate-app a11y coverage work]

actuals:
  tokens: 5035
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Derive a guard's expectation set from the artifact under test at runtime, so the guard covers items that do not exist yet"
    - "Extract permissively in the page, decide by exact match in Node — the loose regex is a pre-filter, never the verdict"
    - "Union every source that can define the expectation set, so removing an item from one source cannot delete the guard's own knowledge of it"
    - "Put a non-vacuity floor on any derived expectation set: an empty set must fail loudly, not pass silently"
    - "Read text PER TEXT NODE, not from body.innerText — blob reads both manufacture phantom tokens and hide real ones"

key-files:
  created:
    - tests/tests/utils/rawKeyScan.ts
    - .planning/phases/136-real-guards-visual-repair-sweep-remediation/136-04-SUMMARY.md
  modified:
    - tests/tests/specs/a11y/a11y-smoke.spec.ts
    - tests/tests/specs/voter/voter-journey.spec.ts
    - .planning/phases/136-real-guards-visual-repair-sweep-remediation/deferred-items.md

key-decisions:
  - "Built the scanner instead of patching the 21 sites — the scanner covers all 598 keys and every future one; site fixes close 21 holes"
  - "Key set is the UNION of three derived sources (runtime Paraglide catalog + type-gen source catalog + generated TranslationKey union), NOT the runtime catalog alone. The negative control proved the single-source design self-defeating"
  - "Exact-match against the real key set rather than a dotted-shape regex verdict — that is what keeps the false-positive count at zero with no allowlist"
  - "Per-text-node reads rather than document.body.innerText, to avoid inline-node concatenation both inventing and hiding tokens"
  - "Added a MIN_EXPECTED_KEYS floor of 400 — a scanner with an empty key set is exactly the fake guard this phase exists to eliminate"
  - "Scanner runs BEFORE the axe scan: an untranslated catalog makes every accessible-name result on the surface meaningless, so it should be the reported failure"
  - "Fixed ONLY voter-journey.spec.ts:1338; the other 20 F2 sites were left alone per the plan — the scanner covers the class on the voter surfaces and site churn is what this plan exists to avoid"
  - "No allowlist was created, because zero legitimate collisions were found across 14 scanned surfaces"

patterns-established:
  - "A guard derived from a catalog must not lose its expectation when the catalog loses the entry — union every defining source, or the guard goes green on the exact deletion it should catch"
  - "Run the negative control against the REAL failure mode, not a convenient proxy. Here the realistic mode (key deleted from the runtime catalog) exposed a design hole that an artificial mode would have hidden"
  - "Any assertion on a label+value pair must target the value node. /Yes/i over the whole item matched both the raw key AND the label's own '...-yes-no?' text — two independent blindnesses in one matcher"

requirements-completed: [REAL-04]

coverage:
  - id: D1
    description: "A key that resolves to its own raw dotted path fails the suite — for all 598 catalog keys and every future one, on every a11y-scanned surface in both themes"
    requirement: REAL-04
    verification:
      - kind: e2e
        ref: "--project=a11y-smoke --workers=1: 18 passed (1.9m); assertNoRawI18nKeys runs inside assertAxeScan, so all 7 routes x 2 themes are covered"
        status: pass
      - kind: e2e
        ref: "grep shows no hardcoded key list — loadCatalogKeys() reads apps/frontend/messages/en/*.json, src/lib/i18n/translations/en/*.json and the generated translationKey.ts at runtime; failure message reports '598 catalog keys were checked'"
        status: pass
    human_judgment: false
  - id: D2
    description: "The scanner is proven to fire by negative control against a deliberately removed key"
    requirement: REAL-04
    verification:
      - kind: e2e
        ref: "about.title deleted from apps/frontend/messages/*/about.json, dev server restarted (paraglide en.js 598 -> 597 exports) -> both home scans FAIL naming \"about.title\" at a[data-testid=voter-home-about-link]"
        status: pass
      - kind: e2e
        ref: "Restore verified: git status --porcelain apps/frontend/messages/ empty, paraglide en.js back to 598 exports, a11y-smoke 18 passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "The scanner does not false-positive on legitimate content that happens to look key-like"
    requirement: REAL-04
    verification:
      - kind: e2e
        ref: "14 axe-scanned surfaces (7 routes x 2 themes) plus 2 navigation-a11y tests: 0 findings, 0 allowlist entries required"
        status: pass
    human_judgment: false
  - id: D4
    description: "voter-journey.spec.ts:1338 asserts the resolved boolean string, not a regex the raw key satisfies"
    requirement: REAL-04
    verification:
      - kind: e2e
        ref: "Sensitivity probe: toHaveText('common.answer.yes') -> 'Expected: \"common.answer.yes\" / Received: \"Yes\"', locator resolved to exactly one div.overflow-hidden value node; reverted"
        status: pass
      - kind: e2e
        ref: "--project=voter-journey --workers=1: 4 passed (1.0m)"
        status: pass
    human_judgment: false
  - id: D5
    description: "No regression across the rest of the suite"
    requirement: REAL-04
    verification:
      - kind: e2e
        ref: "Canonical yarn test:e2e (--grep-invert @probe) after yarn db:reset: 134 passed (13.0m), 0 failed, 0 flaky, 0 skipped"
        status: pass
    human_judgment: false

# Metrics
duration: 105min
completed: 2026-08-11
status: complete
---

# Phase 136 Plan 04: F2 suite-wide raw-i18n-key scanner Summary

**Every a11y-scanned surface now fails if any of the 598 message-catalog keys renders as its own raw dotted path — proven by deleting `about.title` from the runtime catalog and watching both home scans fail naming it — and the negative control itself exposed a hole in the first design, where deriving the key set from the runtime catalog alone made the scanner go green on the exact deletion it existed to catch.**

## Performance

- **Duration:** ~105 min (dominated by three dev-server restarts and four Playwright runs, including a 13.0m full-suite gate)
- **Tasks:** 2
- **Files modified:** 3 (+1 created)

## Task Commits

1. **Task 1: Build the raw-key scanner** — `4fb4aafd5` (test)
2. **Task 2: Negative control + fix the sharpest site** — `cc9830191` (test)

---

## Task 1 — the scanner

### What it does

`tests/tests/utils/rawKeyScan.ts` exports `assertNoRawI18nKeys(page, label)`, wired into
`assertAxeScan` in `a11y-smoke.spec.ts`. Every axe-scanned surface — 7 routes x 2 themes — is now
also raw-key-scanned, at the point where the page is already navigated, settled on its data-driven
`contentTestId` anchor and past `awaitAnimationsSettled`. The marginal cost is one DOM read
(a11y-smoke total was 1.9m before and 1.9m after).

The mechanism it guards is confirmed, not inferred: `apps/frontend/src/lib/i18n/wrapper.ts:40`
returns the raw dotted key path on a catalog miss (and again at line 33 on an interpolation throw),
so a broken catalog renders `questions.multiChoice.selectExact` as literal user-visible text.

### Why a scanner, not 21 patches

The sweep cross-matched every regex in a text-assertion or accessible-name position against all 598
English keys and found 21 matchers satisfied by the exact failure they guard. Patching them closes
21 holes. The scanner closes the class: it covers all 598 keys today and every key added later, and
it would have caught the Phase-134 `selectExact` defect without needing a seeded equal-min/max
question.

### The key set is derived, and there is no hardcoded list

```
$ grep -c "'about\.\|'common\.\|'questions\." tests/tests/utils/rawKeyScan.ts
0
```

`loadCatalogKeys()` reads three sources at runtime and memoises the union:

| Source | Path | Prefixing |
|---|---|---|
| Runtime Paraglide catalog | `apps/frontend/messages/en/*.json` | namespace embedded in the JSON |
| Type-gen source catalog | `apps/frontend/src/lib/i18n/translations/en/*.json` | namespace from the FILENAME (mirrors `generateTranslationKeyType.ts`) |
| Generated `TranslationKey` union | `apps/frontend/src/lib/types/generated/translationKey.ts` | every `'literal'` in the file |

Measured, they agree on **598** keys (the runtime catalog is a strict superset, holding the 7
`lang.<locale>` entries the generator synthesizes rather than reads). The failure message reports
the live count, which is how the negative-control output below can say `598 catalog keys were
checked` while the runtime catalog held only 597.

Arrays are treated as **leaves**, not containers: the inlang message-format plugin encodes
pluralised/selector-driven messages as an array of match objects (`questions.multiChoice.selectExact`
is one of them), and recursing would mint paths like `…selectExact.0.declarations.0` that `t()` can
never return.

### Precision: extract loosely in the page, decide exactly in Node

The in-page pass extracts candidate tokens with
`[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+` — verified against the catalog to match **all 598** keys
including the three numeric-segment outliers (`error.403`, `error.404`, `error.500`), which is why
later segments allow a leading digit and the first does not. That regex is only a pre-filter. The
verdict is an **exact match against the real key set**, performed in Node.

This is what makes an allowlist unnecessary rather than merely unused: a URL, filename, email
address or version string can be extracted as a candidate, but it cannot be a key the app could have
rendered, so it cannot fail the scan. The plan flagged false positives as a real risk; **zero were
found across 14 scanned surfaces**, so no allowlist entry exists and none was needed.

Two further precision choices:

- **Per text node, not `document.body.innerText`.** A blob read concatenates adjacent inline nodes,
  which both manufactures phantom tokens (`common.answer.yes` + `foo.bar` -> `…yesfoo.bar`) and
  hides real ones. Node-level reads also give the failure a precise element to point at. A
  `dottedSubruns` fallback still catches a glued key, and still requires the sub-run to BE a real
  catalog key.
- **`checkVisibility()` filtering, but sr-only text stays in scope.** Screen-reader-only text is
  clipped, not hidden — a raw key spoken to a screen reader is exactly as broken as one painted on
  screen. `aria-label`, `alt`, `title` and `placeholder` are scanned alongside text nodes.

### Result

```
--project=a11y-smoke --workers=1   ->   18 passed (1.9m)
```

All 7 routes in both themes, plus the 2 navigation-a11y tests. 0 findings.

---

## Task 2 — the negative control, and what it found

### The control exposed a design hole (this is the substantive finding)

The first implementation derived its key set from the runtime Paraglide catalog alone. The plan's
negative control is to *delete a key from the catalog* — and running it revealed that this design
**cannot detect that**: deleting `about.title` removes it from the scanner's own expectations at the
same instant the app starts rendering it raw. The scan would have gone green on the exact defect it
exists to catch.

That is not a contrived edge case; it is the likeliest real regression — a key removed from the
runtime catalog while call sites still reference it. TypeScript does not cover it either, because
`t()` is typed against `TranslationKey`, generated from a **different** directory
(`src/lib/i18n/translations`), so such a call site still compiles.

Fix: the key set became the union of all three sources above. A key must now vanish from every
source at once to escape, and at that point no call site can reference it. This is why the union is
load-bearing rather than defensive redundancy, even though the three sources happen to agree today.

A second guard was added in the same pass: `MIN_EXPECTED_KEYS = 400`. A scanner whose key set
silently empties — moved directory, renamed locale folder, a parse yielding `{}` — would pass every
surface forever while checking nothing. That is precisely the fake-guard shape this phase exists to
eliminate, so it is now a hard error.

### The negative control, run for real

`about.title` (rendered on the `home` surface as the About link) was deleted from
`apps/frontend/messages/*/about.json` in **all 7 locales**, leaving `translations/en/about.json` and
the generated `TranslationKey` union intact — i.e. exactly the "removed from the runtime catalog,
still referenced by call sites" mode.

The dev server was restarted and Paraglide recompiled, which is verifiable independently of the
test:

```
$ grep -c "^export const" apps/frontend/src/lib/paraglide/messages/en.js
597          # was 598
```

Then `--project=a11y-smoke --grep "scan — home"`:

```
  2) [a11y-smoke] › tests/specs/a11y/a11y-smoke.spec.ts:508:3 › axe accessibility scan — home (dark)

    Error: Untranslated i18n key(s) rendered on "home-dark" — t() echoed the raw key path because the catalog lookup missed (i18n/wrapper.ts:40). 598 catalog keys were checked.
      - "about.title" (as text) in div[data-testid="voter-home"] > div > div > a[data-testid="voter-home-about-link"]
          excerpt: about.title

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 9

    - Array []
    + Array [
    +   Object {
    +     "element": "div[data-testid=\"voter-home\"] > div > div > a[data-testid=\"voter-home-about-link\"]",
    +     "excerpt": "about.title",
    +     "key": "about.title",
    +     "source": "text",
    +     "token": "about.title",
    +   },
    + ]

       at utils/rawKeyScan.ts:332

  2 failed
    [a11y-smoke] › tests/specs/a11y/a11y-smoke.spec.ts:497:3 › axe accessibility scan — home ───────
    [a11y-smoke] › tests/specs/a11y/a11y-smoke.spec.ts:508:3 › axe accessibility scan — home (dark)
  2 passed (5.8s)
```

Both themes failed, the key is named, and the DOM path points at the exact anchor. Note
`598 catalog keys were checked` against a 597-key runtime catalog — that number IS the union fix
working; before it, the count would have been 597 and the finding would have been zero.

### Restore verified

```
$ git checkout -- apps/frontend/messages/
$ git status --porcelain apps/frontend/messages/ | wc -l
       0
$ grep -c "^export const" apps/frontend/src/lib/paraglide/messages/en.js
598
$ --project=a11y-smoke --workers=1   ->   18 passed (1.9m)
```

### The sharpest site: `voter-journey.spec.ts:1338`

The old assertion was blind **twice over**, not once as the audit recorded:

```ts
await expect.soft(infoItems.nth(9)).toContainText(/Yes/i);
```

1. `/Yes/i` matches the raw key `common.answer.yes` that a catalog miss renders — the F2 finding.
2. `/Yes/i` also matches the info item's own **label**, `"Info: would-you-run-again-yes-no?"`. So it
   passed even if no value rendered at all. The second blindness has nothing to do with i18n and was
   found only by looking at the actual rendered item.

`InfoItem.svelte` renders label + value as two direct children and gives a hook (`.test-label`) only
to the label, so the value is isolated structurally and asserted exactly:

```ts
const booleanValue = infoItems.nth(9).locator('div:not(.test-label)');
await expect.soft(booleanValue).toHaveText('Yes');
```

**Sensitivity probe** — the assertion was temporarily pointed at the raw key to prove it
discriminates, then reverted:

```
    Error: expect(locator).toHaveText(expected) failed

    Locator:  getByRole('dialog').getByTestId('voter-entity-detail-info').getByTestId('info-item').nth(9).locator('div:not(.test-label)')
    Expected: "common.answer.yes"
    Received: "Yes"

    Call log:
      - 9 × locator resolved to <div class="overflow-hidden align-top s-tUQmrrgyQXQR">…</div>
        - unexpected value "Yes"
```

That output does three things at once: it proves the locator resolves to exactly one element (strict
mode would have failed otherwise), that the element is the value node, and that the assertion
rejects the raw key while accepting the resolved string. `toHaveText` with a string is an exact
match, so `common.answer.yes` can never satisfy it.

Per the plan, the other 20 F2 sites were **not** touched.

---

## Coverage boundary (stated honestly)

The scanner runs wherever `assertAxeScan` runs, which is the `AXE_ROUTES` table: 7 voter surfaces in
both themes. Five of the seven tabulated F2 sites live there and are now covered for **every**
catalog key, present and future.

It does **not** reach the candidate app. `candidate-journey.spec.ts:921` (`/edit/i` vs
`candidateApp.questions.*.editAnswer`) and `candidateProfilePage.fixture.ts:174` (`/required/i` vs
`common.required`) remain blind to a catalog break on those surfaces. The right fix is extending the
axe route table to the candidate app — which brings the raw-key gate along for free and closes an
a11y gap at the same time — not more site patches. Recorded as `D-136-04-1` in `deferred-items.md`.

## E2E gate

Both required projects, run against the exact committed code after `yarn db:reset`:

```
a11y-smoke     18 passed (1.9m)
voter-journey   4 passed (1.0m)
```

And the canonical full suite (`yarn test:e2e` = `--grep-invert @probe`), after a further
`yarn db:reset`:

```
134 passed (13.0m)
```

0 failed, 0 flaky, 0 skipped — the same 134 as the 136-01 gate. No skips, no retries, no weakened
assertions.

`yarn format:check` exit 0. `yarn lint:check` exit 0 (the same 2 pre-existing warnings 136-01
recorded: `candidate-bank-auth-journey.spec.ts:208`, `mockOidcIssuerEntry.ts:33`).

### A note on the `_probes` project

An initial gate run used a bare `npx playwright test` with no project filter, which pulled in the
`_probes` project and reported 4 failures. Those are the sweep's **F4** finding, not a regression:
`_probes` specs are `@probe`-tagged and deliberately excluded from the canonical suite
(`test:e2e` is `playwright test … --grep-invert @probe`), and the project is configured as a LEAF
with no data-setup dependency, so running it outside its intended invocation leaves it without a
dataset. Confirmed unrelated to this plan: `grep "rawKeyScan\|Untranslated i18n"` over that run's
output returns nothing, and the probes do not use `assertAxeScan`. The gate above is the canonical
command.

## Deviations from Plan

### Rule 2 — added functionality not in the plan

**1. [Rule 2] Unioned three key sources instead of reading the runtime catalog alone.** The plan
offered "the runtime Paraglide catalog (or the type-gen source)". Running the negative control
proved either one ALONE is self-defeating for the most likely real regression (see Task 2). Without
this the scanner would have shipped with a hole in exactly the scenario the plan's own acceptance
criterion tests. Committed in `cc9830191`.

**2. [Rule 2] Added `MIN_EXPECTED_KEYS = 400` non-vacuity floor.** A derived expectation set that
silently empties is a fake guard — the precise defect class this phase remediates. Committed in
`cc9830191`.

**3. [Rule 1] Fixed the second, non-i18n blindness at `voter-journey.spec.ts:1338`.** The plan named
only the raw-key blindness. The label text `"…-yes-no?"` also satisfied `/Yes/i`, so the assertion
passed with no value rendered. Targeting the value node closes both. Committed in `cc9830191`.

### Environment (not a code deviation)

DEF-135-03 reproduced exactly as 136-01 recorded it: `:5173` was held by a **foreign** Vite dev
server (`~/Desktop/Treader/treader/apps/web` — a `node` process answering 200, so the
"assert the listener is a node process" check passes). Confirmed via
`curl … | grep '<title>Election Compass</title>'`, which returned nothing on 5173 and matched on
5174. The foreign server was left alone and every run in this plan used `FRONTEND_PORT=5174`, with
the served-app title asserted after each of the three dev-server restarts.

## Known Stubs

None.

## Threat Flags

None. Test-only changes; no new attack surface (ASVS L1, per the plan's threat model).

## Self-Check: PASSED

- `tests/tests/utils/rawKeyScan.ts` — FOUND
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` — FOUND
- `tests/tests/specs/voter/voter-journey.spec.ts` — FOUND
- `.planning/phases/136-real-guards-visual-repair-sweep-remediation/136-04-SUMMARY.md` — FOUND
- `.planning/phases/136-real-guards-visual-repair-sweep-remediation/deferred-items.md` — FOUND
- commit `4fb4aafd5` — FOUND
- commit `cc9830191` — FOUND
- `.planning/STATE.md` / `.planning/ROADMAP.md` — UNTOUCHED (orchestrator-owned)
