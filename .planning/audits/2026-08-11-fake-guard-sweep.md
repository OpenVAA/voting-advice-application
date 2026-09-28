# Fake-guard sweep — 2026-08-11

Read-only audit. Nothing was modified. Hunting the Phase-135 anti-pattern: assertions that
(a) cannot detect the failure they nominally guard against, and/or (b) fire on conditions
unrelated to correctness.

**Scope swept:** `tests/tests/**` (89 spec/fixture/helper/setup files, 142 collected Playwright
tests), `packages/*/tests/**` + `packages/*/src/**/*.test.ts`, `apps/frontend/src/**/*.test.ts`,
`apps/frontend/tests/**`, `apps/supabase/supabase/tests/database/*.sql` (11 pgTAP files),
`tests/playwright.config.ts`, root/workspace test scripts, `.github/workflows/main.yaml`.
211 TS test files + 11 pgTAP files enumerated.

---

## Summary

**20 findings across ~85 individual assertion sites.** By severity:

| Severity | Count | Which |
|---|---|---|
| **Blind** — silently misses real regressions | **11** | F1, F2, F3, F12, F13, F14, F15, F16, F17, F18, F19 |
| **Both** — misses regressions *and* would fire spuriously | 1 | F6 |
| **Partially blind** — catches its named case, misses the complement | 2 | F9, F20 |
| **Advisory-in-costume** — never runs; nothing consumes the result | 2 | F4, F5 |
| **Noise / waste** — no correctness signal, real cost | 1 | F7 |
| **Benign** — cannot fail, but nothing is lost | 3 | F8, F10, F11 |

Nothing found in this sweep currently causes false *failures* — the load-sensitive assertion that
did (the Phase-135 NF-01 wall-clock gate) is already fixed. The residue is almost entirely
**blindness**: guards that pass regardless.

| # | Finding | Severity | Confidence |
|---|---|---|---|
| F1 | `tests/tests/specs/perf/performance-budget.spec.ts` — 8s/15s budgets vs **1055ms/1056ms measured**, and the metric excludes everything the results page actually does | **Blind** (total) | High |
| F2 | 21 E2E text assertions/locators whose regex is **satisfied by the raw i18n key** the broken state renders (`t()` returns the key on miss) | **Blind** (systemic class) | High |
| F3 | 27 `*.teardown.ts` files — `expect(rowsDeleted).toBeGreaterThanOrEqual(0)` is unfailable by construction | **Blind** (decoration) | High |
| F4 | 4 `_probes/*.probe.spec.ts` files match **no Playwright project** — 6 tests never run from any command | Advisory-in-costume | High |
| F5 | `packages/dev-seed/tests/integration/default-template.integration.test.ts` — the Phase-135 replacement op-budget **does not run in CI** (`SUPABASE_URL` unset in the unit-test job) | Advisory-in-costume | High |
| F6 | `tests/tests/specs/visual/` — baselines last regenerated at **v1.2**; job is `continue-on-error` (known) | Both | High |
| F7 | `voter-journey.fixture.ts:384-387` — a **measured 10.0s dead wait** on every `answeredVoterPage` invocation (38% of the fixture's 26.4s) | Noisy/waste | High |
| F8 | `expectUrlChange()` in `voter-journey.spec.ts:186` — named as an assertion, swallows its only check | Benign (mitigated) | High |
| F9 | `perm-hide-category-tags` / `perm-hide-election-tags` — absence-only, no positive control anywhere in the suite | Partially blind | Medium |
| F10 | `voter-journey.spec.ts` header claims a "3-slot `expect.soft` budget"; the file has **137** | Doc drift | High |
| F11 | `a11y-smoke.spec.ts:364-365` + `00-helpers.test.sql:421` — tautological shape checks | Benign | High |
| **F12** | **`expect.arrayContaining` used to assert *filtering* — 9 sites in `@openvaa/data` + `@openvaa/filters`. A filter that becomes a no-op and returns everything passes.** | **Blind** (systemic) | High |
| F13 | `TemplateSchema` is not `.strict()` → **4 blind** "accepts field X" tests cannot fail (**count amended in place 2026-08-23 from this sweep's original "6"** — re-derived by measurement as **4 blind + 3 already-failable + 3 unfailable-by-construction = 10** sites in this shape; see the F13 section) | Blind — **REMEDIATED, Phase 144** | High |
| F14 | `supabaseDataWriter.test.ts:303` — the File→path substitution the test is named for is never asserted (the matcher is built, then unused) | Blind | High |
| F15 | `questionTypes.test.ts` (9 sites) + `condenserStandalone.test.ts` — AI-package tests assert wiring, never output | Blind | High |
| F16 | `handleQuestion.test.ts:56` — bare `rejects.toThrow()` against a mock that throws from every method | Blind | High |
| F17 | `EntityListWithControls.test.ts:94` — "bounded apply() invocations" measures the test's own `for` loop, not reactivity | Blind | High |
| F18 | `default.test.ts:121-135` — "faker locale cycling" asserts only that names are truthy | Blind | High |
| F19 | `toBeDefined()` on `URLSearchParams.get()`/`FormData.get()` (3 sites) — those return `string \| null`, never `undefined` | Blind (mitigated) | High |
| F20 | 6 assorted assertions weaker than their test titles (400-status, ICU-fallback, JWKS error-paths, `toContain('id')`, nomination-tree propagation, bare `rejects.toThrow`) | Partially blind | Medium |

**Worst offender: F1** — the performance budget spec. It is the closest match in the repo to the
Phase-135 pattern and is arguably worse: the Phase-135 guard at least sat at 1.7× actual, whereas
this one sits at **7.6× actual on a metric that structurally cannot move** when the page it names
gets slower. It runs by default in `yarn test:e2e` and in the blocking CI `e2e-tests` job, so it
consumes a full `answeredVoterPage` walk (~27s) plus a reload every CI run to assert nothing.

**Runner-up, and the best return on effort: F12.** Nine assertions across `@openvaa/data` and
`@openvaa/filters` use a subset matcher to prove a filter *excludes* things. One mechanical
substitution (`arrayContaining(ids)` → `ids`) turns all nine into real guards. F1 is the more
striking single defect; F12 is the larger blind spot by surface area, and it sits on the matching
pipeline's input path.

**Two systemic classes worth naming**, because both recur across otherwise-careful files and both
would benefit from a lint rule rather than site-by-site fixes:
- **Subset matchers standing in for equality** (F12) — `expect.arrayContaining` and
  `expect.objectContaining` used where the *absence* of something is the invariant (F12, F14, and
  the locator half of F2).
- **Matchers satisfiable by the broken state** (F2, F19, F20) — a regex that matches the raw i18n
  key; `toBeDefined()` on an API that returns `null`; `rejects.toThrow()` where three unrelated
  things throw first.

---

## Remediation status — ASSERT-07 corpus (F15, F16, F17, F18, F20), closed by Phase 142

Phase 139 (ASSERT-01) confirmed these findings by injection; **Phase 142 remediated them and proved
each remediation with an executed negative-control pair.** Per-finding annotations, each naming its
commit and its row in the ledger, are inline in the F15 / F16 / F17 / F18 / F20 sections below.

**Ledger:** `.planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-NEGATIVE-CONTROL-LEDGER.md`

| Count | Value | Meaning |
|---|---|---|
| Findings in the corpus | **12** | F15-A, F15-B, F15-C, F16, F17, F18, F20-1 … F20-6 |
| **Remediated** | **12** | every one; verdict recorded on every ledger row |
| **Withdrawn** | **0** | **stated explicitly, not implied.** D-13 permitted withdrawal only on a ground 139 could not have seen — the strengthened assertion *provably unwritable*, not merely awkward. No finding met that bar, so ASSERT-07's scope did **not** shrink and nothing here is struck |
| **Negative-control pairs executed** | **13** | **11** driven by 139's own pre-specified regression (one per finding, all except F17) + **2 supplementary pairs**: ledger row **5s**, standing in for F17, and ledger row **1s**, a second pair for **F15-A** added on 2026-08-21 to close verification finding **W-1** (Configuration 2 of `questionTypes.test.ts` carried no assertion on the prompt, so three of F15-A's eleven blind sites were still blind after the first remediation). Of the 13, **8** OLD halves are cited from 139 § 5.N.4 and **5** were re-run in this phase (rows 1, 7, 9, 5s and 1s) |
| **Scoped exceptions to criterion 1** | **1** | **F17 only** (ledger row 5, `N/A — by construction`) — pre-predicted by 139 § 5.5.6 and independently forbidden by § 8.3 R-10. **Remediated, not withdrawn**; see the F17 section for the full four-part reasoning |

**Not in this corpus:** **F19** belongs to ASSERT-03 and was closed by Phase 140; **F3** to
ASSERT-02, **F9** to ASSERT-05 and **F10** to ASSERT-06, likewise Phase 140. **F13** is ASSERT-04 —
**closed by Phase 144 on 2026-08-23**, with its corpus figure amended in place from this sweep's "6"
to the re-derived **4 blind + 3 already-failable + 3 unfailable-by-construction = 10**; ledger
`.planning/phases/144-seed-template-strict-typing-unknown-prop-guard/144-NEGATIVE-CONTROL-LEDGER.md`. The remaining findings are unrelated to ASSERT-07.

**Gates:** root `yarn test:unit` (turbo, parallel, all 11 wired workspaces) exited 0 on **three
consecutive** runs, plus the full `yarn test:e2e` suite and the opt-in bank-auth projects under
CLAUDE.md's cardinal rule. Commands, exit codes, counts and log paths are in the ledger's gate
section — a stated result is not a measured one, so none is recorded without its evidence.

---

## Post-sweep addendum — a guard class this sweep never saw (Phase 142.1, ASSERT-11)

**Added 2026-08-22.** This section records a finding the 2026-08-11 sweep did **not** produce, and the
reason it did not — which is a property of the sweep, not of the code.

### The guard class

```ts
it('implements getIdTokenClaims as a function', () => {
  expect(typeof provider.getIdTokenClaims).toBe('function');
});
```

Under a title claiming the method is **implemented**, the assertion checks only that a property of the
object graph is callable. It is wiring-only in exactly the sense F15/F16/F20 are: it cannot fail for
any behavioural regression of the thing its title names. Six such guards existed —
`apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts` and `…/signicat.test.ts`, three each,
covering `getIdTokenClaims`, `getAuthorizeUrl` and `exchangeCodeForToken`.

**They are almost certainly why the duplication drifted.** Phase 142's **P-2** found that
`/api/oidc/token/+server.ts:26` called `provider.getIdTokenClaims` — a **duplicated** copy of the
decrypt→verify→claims logic in each provider — and not the shared helper A-07 had just fixed. So
A-07's discriminating failure codes and its lazy env parse did not reach the production path at all.
The only tests pinning that path asserted that a function was a function, so nothing went red while the
copies diverged from the helper for as long as they did.

### Remediation — Phase 142.1 (ASSERT-11). All six guards; none withdrawn.

Ledger:
`.planning/phases/142.1-provider-getidtokenclaims-duplication-make-a-07-reach-produc/142.1-NEGATIVE-CONTROL-LEDGER.md`
— **8 pairs, both halves measured in that phase, 0 cited, 0 withdrawn.** Commit range
`950c97aa2 … fa5fc5ec7`.

- **Product — the collapse.** `950c97aa2` extracts a shared core
  `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts` and reduces both provider bodies to
  *core → authConfig claim mapping*, catch arms byte-unchanged; `8889be52b` repoints the third caller
  (`candidate/preregister/+layout.server.ts`) and **deletes** `getIdTokenClaims.ts`, so exactly one
  entry point to decrypt→verify→claim mapping remains in `apps/frontend/src`; `387c0b653` makes the
  failure-class code visible at both `/api/oidc/*` call sites with the HTTP surface unchanged.
- **Tests — the six guards replaced.** `f8b48347a` (signicat) and `0e0ddcca9` (idura) delete all six
  `typeof … === 'function'` guards and put claims deep-equality, per-branch coded-error assertions and
  real `exchangeCodeForToken` request-body assertions in their place.
  `grep -rn "toBe('function')" providers/*.test.ts` now returns nothing.
- **Evidence — 8 freshly measured pairs.** `c1177f4b1` (pairs 1–6) and `fa5fc5ec7` (pairs 7–8).
  **Ledger rows 1–8**: claims-mapping × 2 providers, error-discrimination × 2, lazy-parse × 2, and
  D-04's two `exchangeCodeForToken` axes. **8 of 8 OLD halves observed GREEN (blind)** on the
  pre-collapse tree — not one of the six guards saw the regression its own title promises to catch —
  and **8 of 8 NEW halves observed RED**, each naming its own strengthened assertion. Eleven collateral
  reds were observed across six injection instances and **none** was credited.
- **Gates.** Five static gates (`yarn test:unit`, `yarn lint:check`, `yarn format:check`, `yarn build`,
  and `yarn workspace @openvaa/frontend check` — the last being the frontend typecheck CI runs and
  neither lint nor build provides), plus three E2E runs 1× each under CLAUDE.md's cardinal rule.
  Commands, exit codes, counts and log paths are in the ledger's gate section.

### The finding about this sweep's reach

**Neither `providers/idura.test.ts` nor `providers/signicat.test.ts` was ever enumerated by the
2026-08-11 sweep.** They appear in no finding, in no *Cleared* entry, and in no *Not assessed* bullet —
they were simply never opened. The § Not assessed section is honest about the files it knows it
skipped; these two were not among the things it knew it had skipped.

That matters for three reasons, and the third is the one worth carrying forward:

1. **It is why ASSERT-11's criterion 4 is categorical.** *"Nothing is citable from Phase 139"* is not a
   methodological preference — there is no recorded OLD half to cite and no pre-specified injection to
   reuse, because the sweep never produced one for these files. Phase 142.1 therefore measured **both**
   halves of all eight pairs itself, where Phase 142 could legitimately cite 8 of its 13 OLD halves
   from 139.
2. **The missed class is one this sweep already had a name for.** F15's mock-in/mock-out shape, F16's
   throw-from-every-method mock and F20's title-vs-matcher gap are all "the assertion cannot fail for
   the regression the title promises". `typeof x === 'function'` is the same defect in its purest form.
   The sweep did not lack the concept; it lacked the files.
3. **The consequence was not hypothetical.** The unenumerated guards sat on an **authentication** path,
   and the drift they hid meant a live security-relevant fix (A-07's failure-class split) never reached
   production. A file-selection gap in an assertion-quality audit propagates as an unfixed defect in the
   thing the audit exists to protect.

**Two sibling observations from the same phase, recorded because together they are a pattern rather
than an anecdote.** (a) `yarn format:check` — one of the four static gates every recent phase names —
had been **red on this branch since within a week of the 2026-08-10 repo-wide formatting pass**, on two
files no phase had touched. It was not invisible: Phase 151 filed both in `.planning/WINDOWS.md` (#7,
#8) on 2026-08-16 as *"format:check red at 151-03 baseline, DEFERRED per PD-03"*. It stayed red for six
more days across several phases that each named that gate as their own — **a deferred entry in a defect
register is not the same as a gate that runs**. (b) The E2E
preflight's identity clause (b) was **unsatisfiable against a correct checkout** under Vite 6.4.1 and
blocked every E2E run in the repo until `b8de9ff06` repaired it — split into a 200-check plus an
absolute-module-root equality that fails closed, rather than relaxed to accept the relative id, which
would have converted an identity gate into a willingness-to-serve gate.

Three independent instances, found in one phase, of a single property: **a guard that cannot run, or
that was never pointed at the code, is indistinguishable from an absent guard — and it is worse,
because it reads as coverage.** A sweep that misses a class of guard *in files it never opened* has a
coverage property worth writing down, and this is it.

---

## Findings

### F1 — Performance budget: 7.6× headroom on a metric that excludes the page under test

**File:** `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/perf/performance-budget.spec.ts:65-66`

```ts
expect(timing.domContentLoaded).toBeLessThan(8000); // 8s DOMContentLoaded
expect(timing.loadComplete).toBeLessThan(15000); // 15s full load
```

**What it claims to guard.** From its own header: *"Detect performance regressions. If the results
page suddenly takes 30 seconds to load when it used to take 5, something broke."*

**Measured reality.** Extracted from the trace of the most recent full-suite run on this machine
(`tests/playwright-results/performance-budget-…/trace.zip`, run 2026-08-11 14:45):

```
domContentLoaded: 1055   loadComplete: 1056   domInteractive: 1055
duration:         1056   ttfb:         1045
```

A second, older recorded run (`.planning/milestones/v2.10-phases/86.2-…/post-fix/
86.2-02-task2-performance-budget-smoke.txt`) logged `domContentLoaded: 36, loadComplete: 38`.
Both are **measured**, not estimated. Headroom against the current thresholds is 7.6× and 14.2×.

**Two independent reasons it cannot catch what it names:**

1. **Headroom.** The spec's own documented calibration procedure is "P90 × 1.5". P90 of the
   observed data is ~1.1s, so the procedure yields ~1.6s. The thresholds are 8s/15s. The
   procedure has never been applied since the numbers were first written.

2. **The metric is structurally blind.** `ttfb` is **1045 of the 1055 ms** of `domContentLoaded`,
   and `loadEventEnd` lands 1 ms after `domContentLoadedEventEnd`. That means the Navigation
   Timing window closes essentially at the SSR response, before hydration, before the Supabase
   round-trips, before match computation, before the results list renders. The spec then calls
   `settleNetworkIdle(page)` — i.e. it explicitly waits for work it has already stopped measuring.
   A regression that made the matching algorithm 10× slower, or turned the results fetch into an
   N+1, would leave `domContentLoaded`/`loadEventEnd` unchanged.

**What it would catch:** a regression in raw SSR/dev-server response latency for
`/results` of >7.5× — i.e. a Vite/SvelteKit `load()` or `hooks.server.ts` catastrophe.
**What it would miss:** every client-side regression on the page it is named after.

**Severity: blind.** Not currently noisy (the margin is too wide to fire on load), which is
precisely why it is dead weight rather than a nuisance.

**Suggested fix.** Replace the Navigation Timing assertion with a measurement that spans the
thing under test, and prefer a load-independent unit where possible:
- Load-independent (preferred, mirrors the Phase-135 fix): spy/count the network requests the
  results route issues after hydration (`page.on('request')` filtered to the Supabase origin) and
  assert an **operation budget** — an N+1 in the results fetch fails as `expected 40 to be 3`.
- If a wall-clock number is genuinely wanted, measure `reload → results-list visible` (the trace
  shows `reload` at 1083 ms and the list settling after it), log it as observability only, and do
  not assert on it — the same treatment `default-template.integration.test.ts` now gives elapsed.

**Confidence: high** for the headroom and the ttfb≈DCL structure (both directly measured from the
trace). Medium on the claim that no realistic client-side regression could ever move
`loadEventEnd` — a regression that added a blocking synchronous `<script>` would, but that is not
the failure mode the spec names.

---

### F2 — 21 assertions satisfiable by the untranslated i18n key (systemic class)

**Root cause is confirmed, not inferred.** `apps/frontend/src/lib/i18n/wrapper.ts:22-40`:

```ts
  // 3. Key not found -- return key as fallback
  return key;
```

`t()` returns the **raw dotted key path** on a catalog miss (and also on an interpolation throw,
line 33). So any assertion whose matcher is a substring of the key path is satisfied by the exact
failure it exists to detect. This is the general form of the `/select/i` vs
`questions.multiChoice.selectExact` case that Phase 135 GUARD-01 fixed for one key.

**Method.** I flattened `apps/frontend/messages/en/*.json` (598 keys), extracted every regex
literal appearing in a text-assertion or accessible-name position across `tests/tests/**` (89
sites), and tested each regex against every key. 21 sites match. The full cross-match is
reproducible; the high-value subset, with the key that actually renders at that site:

| Site | Assertion | Key rendered there | Verified how |
|---|---|---|---|
| `tests/tests/specs/voter/voter-journey.spec.ts:1338` | `expect.soft(infoItems.nth(9)).toContainText(/Yes/i)` | `common.answer.yes` | `dataContext.svelte.ts:113` — `setFormatter('booleanAnswer', … t(value ? 'common.answer.yes' : 'common.answer.no'))` |
| `tests/tests/specs/voter/voter-journey.spec.ts:1351` | `expect.soft(infoItems.last()).toContainText(/Links/i)` | `entityDetails.links` | key-name match |
| `tests/tests/specs/voter/voter-journey.spec.ts:1311` | `expect.soft(infoItems.nth(0)).toContainText(/Election/i)` | `common.election` | key-name match |
| `tests/tests/specs/voter/voter-journey.spec.ts:1314` | `expect.soft(infoItems.nth(1)).toContainText(/Constituency/i)` | `common.constituency` | key-name match |
| `tests/tests/specs/voter/voter-journey.spec.ts:1317` | `expect.soft(infoItems.nth(2)).toContainText(/List/i)` | `common.electionList` | key-name match |
| `tests/tests/specs/candidate/candidate-journey.spec.ts:921` | `expect(…cardAction).toHaveText(/edit/i)` | `candidateApp.questions.*.editAnswer` | `messages/en/candidateApp.questions.json:6` |
| `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:174` | `expect.soft(q).toContainText(/required/i)` | `common.required` | key-name match |

The remaining 14 are locators rather than assertions (`getByRole('dialog', { name: /Filters/i })`,
`hasText: /feedback/i`, `name: /continue/i`, `name: /log ?out/i`, `name: /Home/i`,
`name: /close|cancel|dismiss/i`, `/Opinions/i` ×4). Those are **lower severity**: a locator that
still resolves against the raw key does not make a test pass falsely, it just means the locator
is not proving the string is translated. They are listed for completeness, not as defects.

**The single worst of the set is `/Yes/i` at voter-journey:1338.** It is the *only* standing check
on the boolean-answer render path in the E2E suite, it sits in exactly the area
Phase 134 was chartered to close (`134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure`),
and `common.answer.yes` contains the substring `yes` — so a catalog break there ships green.

**What these catch:** the value being wrong/absent entirely (empty info-item, "No" instead of
"Yes"). **What they miss:** the whole class of catalog/Paraglide-compilation regressions, which is
the class the repo has already been bitten by twice.

**Suggested fix.** Adopt the Phase-135 GUARD-01 shape wholesale: assert the **resolved English
string as an exact literal** wherever the string is the thing under test —
`toContainText('Yes')` is not enough (it matches `common.answer.yes` too); use
`toHaveText('Yes')` on the value node, or a key-excluding regex such as
`/(?<![\w.])Yes(?![\w.])/`. Cheaper and broader: add one suite-wide guard that scans the rendered
`document.body.innerText` on each a11y-scan route for `/\b[a-z][a-zA-Z]*(\.[a-zA-Z][a-zA-Z0-9]*){2,}\b/`
(dotted-key shape) and fails if any known catalog key appears verbatim. One assertion covers all
598 keys and every future one. That would have caught `selectExact` without needing a seeded
question with an equal min/max window.

**Confidence: high** on the mechanism and on the 7 tabulated sites. **Medium** on whether the
per-site fix is worth it individually — the suite-wide raw-key scanner is the better trade.

---

### F3 — 27 teardown assertions that cannot fail

**Files:** every `tests/tests/setup/**/*.teardown.ts` (27 of them), e.g.
`/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/setup/perm/perm-hide-category-tags.teardown.ts:16`

```ts
const { rowsDeleted } = await runTeardown(PREFIX, client);
expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
```

**Why it cannot fail.** `packages/dev-seed/src/cli/teardown.ts:146` — `countDeletedRows()` is
documented as *"Robust to missing entries (returns 0 …) and non-numeric `deleted` fields
(returns 0 for that entry)"* and initialises `total = 0`. It therefore **always** returns a
non-negative number. The assertion's own failure message names a state the implementation
provably cannot produce. If `runTeardown` throws, the teardown project fails on the throw — the
`expect` contributes nothing to that either.

**What it would catch:** nothing. **What it would miss:** the failure mode the teardown exists
for — a prefix typo or an RPC that silently deleted 0 rows, leaking `e2e-perm-*` rows into the
next chain in the serial perm DAG (the class of bug that cost Phase 124).

**Mitigation, stated honestly:** this is *decoration, not a coverage hole*. The real contamination
guard lives on the setup side and is genuinely strong —
`tests/tests/setup/shared/setupFromTemplate.ts:256-260` does a REPLACE of the `app_settings`
singleton followed by `expect(persisted).toEqual(…)` **exact** equality. Row leakage in the other
10 tables is also re-cleared by the next setup's own `runTeardown`. So severity is low in
practice; the finding is that 27 files carry an assertion that reads like a gate and is not one.

**Suggested fix.** Either delete the `expect` (the throw is the guard), or make it real:
`expect(rowsDeleted, 'teardown deleted nothing — prefix mismatch?').toBeGreaterThan(0)` for the
prefixes whose setup is known to have written rows, or re-query
`listCandidateIdsByPrefix(PREFIX)` post-delete and assert `toHaveLength(0)`.

**Confidence: high.**

---

### F4 — 4 probe spec files match no Playwright project (6 tests never run)

**Files:**
- `tests/tests/specs/_probes/entityFilters.probe.spec.ts` (1 test)
- `tests/tests/specs/_probes/navMenu.probe.spec.ts` (2 tests)
- `tests/tests/specs/_probes/theme.probe.spec.ts` (1 test)
- `tests/tests/specs/_probes/trackingIntercept.probe.spec.ts` (2 tests)

The `_probes` project's `testMatch` is
`/(video|questionInfo|popupNotice|orgMatching|numberScale)\.probe\.spec\.ts$/`
(`tests/playwright.config.ts:371`), which excludes these four. No other project's `testDir`
covers `specs/_probes`. Verified by enumeration, not by reading:

```
npx playwright test -c ./tests/playwright.config.ts ./tests --list            → 142 tests / 93 files
npx playwright test -c ./tests/playwright.config.ts --project=_probes --list  →   8 tests /  5 files
grep -n entityFilters|navMenu|theme.probe|trackingIntercept on the full list  →   0 matches
```

The config comment explains the *intent* — "the 4 already-green probes … are excluded here so a
project run never serially clobbers the singleton across all 8" — so this is deliberate. But the
consequence is that 6 tests are unreachable from **any** command, including
`yarn test:e2e:probes`, and nothing consumes their result. They are frozen at whatever state the
app was in when they last ran.

**Severity: advisory-in-costume.** Not a false pass — a non-run.

**Suggested fix.** Either give them their own project (they are documented as *not* needing
out-of-band perm seeding, so they can safely depend on `data-setup-base` like the other leaves),
or move them under `.planning/` as archived investigation artefacts so the `specs/` tree only
contains things that run.

**Confidence: high** (enumerated).

---

### F5 — The Phase-135 replacement op-budget does not run in CI

**File:** `packages/dev-seed/tests/integration/default-template.integration.test.ts:75,145`

```ts
const hasSupabase = Boolean(process.env.SUPABASE_URL);
describe.skipIf(!hasSupabase)('default template integration (DX-03)', () => {
```

The gate is deliberate and documented (D-58-21). The problem is what it implies for CI. In
`.github/workflows/main.yaml`, the `frontend-and-shared-module-validation` job runs
`yarn test:unit` **before** it copies `.env.example` anywhere, never starts Supabase, and sets no
`SUPABASE_URL`. `packages/dev-seed/vitest.config.ts` is an empty stub with no dotenv loading and
the package script is `vitest run --passWithNoTests`. So on every CI run this describe block —
including the brand-new NF-01 operation budget that Phase 135 built to replace the wall-clock
gate, and all the D-58-20 row-count/relational assertions — **silently skips**, and the job is
green.

This does not make the new op budget wrong; it makes it a **local-only** guard. The N+1 it was
designed to catch would reach `main` unchallenged.

**What runs in CI today:** nothing from this file.
**What it would catch locally:** exactly what Phase 135 claims (an injected 327-query N+1 → `expected 328 to be 1`).

**Suggested fix.** Add a Supabase-backed unit-test job (mirror the existing `supabase-tests` job's
`supabase/setup-cli` + `supabase start`, export `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, run
`yarn workspace @openvaa/dev-seed test:unit`). If that is too expensive, at minimum make the skip
*loud*: fail the file when `CI === 'true'` and `SUPABASE_URL` is unset, so a skipped integration
guard is a red build rather than a silent one.

**Confidence: high** on the CI wiring (read directly from the workflow + configs). **Medium** on
whether a dedicated CI job is the right remedy vs. accepting it as a local-only gate — that's a
cost call, not a correctness one.

---

### F6 — Visual baselines cannot match; job is advisory (partly known)

**Files:** `tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/*.png` (4),
`tests/tests/specs/visual/visual-regression.spec.ts`, `.github/workflows/main.yaml` (`e2e-visual`,
`continue-on-error: true`).

You already know `e2e-visual` is advisory. Two facts worth adding:

1. **The baselines are from v1.2.** `git log -- tests/tests/specs/visual/__screenshots__/` returns
   exactly two commits: `9df5ece27 feat(v1.0): E2E Testing Framework` and
   `05b033266 feat(v1.2): Svelte 5 Migration — Infrastructure`. The app has since shipped v2.6
   through v2.14, including a full Svelte-5 context rewrite, a results-page restructure, dark
   mode, and the a11y contrast work. These PNGs cannot match current output on any machine, CI
   runner or not — the "canonical CI runner font rendering" caveat in the spec header understates
   it by several orders of magnitude.
2. **`candidate-preview-desktop.png` is exactly 1280×720** — the viewport size — despite
   `fullPage: true`. Either the page had no content below the fold when it was captured, or the
   capture predates the `fullPage` option. Both suggest the baseline is not a faithful artefact.

**Severity: both** (it will always fail → noise if ever promoted; it asserts nothing today →
blind).

**Suggested fix.** The project is opt-in and blocked on the documented `auth-setup`/base-dataset
gap, so re-baselining now buys nothing. Delete the four stale PNGs so nobody mistakes them for a
reference, and leave a note in the spec header that baselines must be generated as the *first*
step of promoting the project to default-on.

**Confidence: high.**

---

### F7 — A measured 10.0-second dead wait in the shared voter fixture

**File:** `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/fixtures/voter/voter-journey.fixture.ts:384-387`

```ts
await currentChoices
  .first()
  .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage })
  .catch(() => null);
const choiceCount = await currentChoices.count();
if (choiceCount === 0) { /* slider branch */ }
```

Not a fake *guard* — it is a probe, correctly `.catch()`-ed, and the branch below it is right.
But it is the inverse pathology and it showed up while measuring F1, so it belongs here.

**Measured** from the same trace: one `waitForSelector` on
`[data-testid="question-choice"][name="questionChoices-44f5a302-…"]` took **10002 ms** and then
resolved to the slider branch. `TIMEOUTS.slowPage` is 10 000 ms. That is the number-scale opinion
question (`qu-opin-base-6-number`), which by design renders **no** `question-choice` nodes — so
this wait times out on every single traversal, deterministically. The `answeredVoterPage` fixture
total was 26 358 ms; this one wait is **38% of it**.

The loop-entry probe two blocks up (line 298-309) was already widened to include
`question-number-slider` for exactly this reason; this second wait was not.

**Cost.** The wait lives in `answerAndAdvanceToResults` (line 287), which is both exported for
direct use by `voter-journey.spec.ts` and the body of the `answeredVoterPage` fixture. Consumers
of that fixture, by grep: `a11y-smoke.spec.ts` (most of its 14 scans), `performance-budget.spec.ts`,
`visual-regression.spec.ts`, `voter-alliance.spec.ts`, `voter-journey-mobile.spec.ts`,
`perm-disable-allow-open.spec.ts`, `perm-hide-if-missing-answers.spec.ts`, plus
`minimalVoterResultsPage.fixture.ts`. At a deterministic ~10s per traversal this is on the order
of a minute-plus of pure dead wait per full-suite run.

**Suggested fix.** Race the two surfaces instead of serialising them:

```ts
await Promise.race([
  currentChoices.first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage }),
  numberSlider.first().waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage })
]).catch(() => null);
```

**Confidence: high** (measured directly from the trace of the 2026-08-11 run).

---

### F8 — `expectUrlChange()` asserts nothing

**File:** `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-journey.spec.ts:186-190`

```ts
async function expectUrlChange(page: Page, action: () => Promise<void>): Promise<void> {
  const urlBefore = page.url();
  await action();
  await page.waitForURL((u) => u.toString() !== urlBefore, { timeout: TIMEOUTS.page }).catch(() => null);
}
```

The `expect` prefix promises an assertion; the `.catch(() => null)` guarantees there isn't one.
Used at lines 204, 247, 293, 321, 380, 412.

**Mitigation:** each caller's *next* step hard-asserts the incoming question's heading
(`expect(questionHeading).toHaveText(TEXT_RE.baseOpinionN)`), so a navigation that genuinely
failed still surfaces — one step later, with a confusing message. So this is a **naming** defect
with a real but indirect backstop, not a coverage hole.

**Suggested fix.** Rename to `settleUrlChange` (matching the `settleNetworkIdle` /
`waitForVisible` probe-naming convention the suite already uses), or drop the `.catch` and let it
assert for real — the callers' subsequent heading assertion suggests it would pass.

**Confidence: high.**

---

### F9 — Absence-only perm tests with no positive control

**Files:**
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/perm/perm-hide-category-tags.spec.ts:22` — `await expect(page.getByTestId(testIds.shared.categoryTag)).toHaveCount(0);`
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/perm/perm-hide-election-tags.spec.ts:23` — `await expect(page.getByTestId(testIds.shared.electionTag)).toHaveCount(0);`

Each is the **only** assertion in its test.

I initially suspected these were dead — they are not. `data-testid="category-tag"` exists at
`apps/frontend/src/lib/components/categoryTag/CategoryTag.svelte:42` and `"election-tag"` at
`electionTag/ElectionTag.svelte:43`. The templates are also correctly designed: the election-tags
template seeds `elections: 2` so the tag would have a reason to render. And
`navigateToFirstQuestion()` (`tests/tests/utils/voterNavigation.ts:303-327`) hard-asserts the walk
landed on a real `/questions/<id>` page with a visible answer option, so the assertion is not
running against a blank page.

**So they do catch the regression they name** (flag ignored → tag renders → count > 0 → fail).
The gap is the complement: `testIds.shared.categoryTag` and `.electionTag` appear **nowhere else
in `tests/`** (verified by grep). There is no test anywhere that asserts either tag *does* render.
If `CategoryTag`/`ElectionTag` were dropped from the question heading, or their testid renamed,
both perm tests pass forever and no other test notices.

**Contrast the model in-repo:** `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` pairs a
positive control ("fires on a `svelte/store` import") with a negative control ("stays silent on
clean rune code"). That is the right shape.

**Suggested fix.** Add the positive half to the base dataset — a one-line
`await expect(page.getByTestId(testIds.shared.categoryTag)).not.toHaveCount(0)` in the
`voter-journey` question step (where both flags default true). Two lines total closes both.

**Confidence: medium** — I have verified the testids exist and that no positive assertion exists,
but I have not confirmed the tags actually render under the base dataset's flag values.

---

### F10 — `expect.soft` budget documentation drift

**File:** `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-journey.spec.ts:14`

> `Genuinely soft assertions use expect.soft (3-slot budget honored).`

`grep -c "expect.soft(" tests/tests/specs/voter/voter-journey.spec.ts` → **137**.

**Not a fake guard.** Playwright soft assertions *do* fail the test at its conclusion, so no
coverage is lost. But every other spec in the suite carries a "Rigidity contract: every assertion
is HARD — no `expect.soft`" header (17 files), the journey's own header claims a 3-slot budget,
and the actual state is 137. The practical cost is failure legibility: one broken step in a
serial 90s walk now reports a cascade of downstream soft failures, obscuring the first cause.

**Suggested fix.** Either update the header to state the real posture and why (long serial walk,
soft assertions preferred so one broken card doesn't hide the other 130 checks), or do the
conversion the header claims. The former is honest and free; the latter is a real project.

**Confidence: high** on the count; no opinion on which resolution is right.

---

### F11 — Tautological shape checks (benign, listed for completeness)

- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/a11y/a11y-smoke.spec.ts:364-365`
  ```ts
  expect(results).toHaveProperty('violations');
  expect(Array.isArray(results.violations)).toBe(true);
  ```
  Both are implied by line 361's `expect(results.violations).toHaveLength(0)`, which cannot pass
  unless `violations` exists and is array-like. The inline `// reason:` claims they defend against
  "AxeBuilder API breakage on future axe-core upgrades" — a shape change would already break
  line 361. Harmless; zero cost; could be deleted.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/00-helpers.test.sql:421` — `SELECT ok(true, 'pgTAP loaded successfully');`
  Trivially true, but it is a genuine extension-load smoke check under `no_plan()`. Fine.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/lib/i18n/tests/translations.test.ts:226` — `expect(true).toBe(true);`
  Explicitly documented: the real assertion is the `@ts-expect-error` directive above it, enforced
  by `yarn workspace @openvaa/frontend check` — **which does run in CI** (blocking, `--fail-on-warnings`).
  The runtime `expect` only satisfies vitest's one-assertion convention. Legitimate.
- `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/tests/sample.spec.ts` — `expect(1 + 3).equal(4)`. A scaffold placeholder that still runs. Delete-able.

---

### F12 — `expect.arrayContaining` asserting a *filter*: 9 sites, all blind to over-inclusion

**The single largest blind spot found.** Every one of these tests exists to prove a filter
**excludes** something — their own inline comments say so — but `arrayContaining` is a **subset**
matcher. A filter that stops filtering and returns the full set passes all nine.

| File (all under repo root) | Line | Assertion |
|---|---|---|
| `packages/data/src/objects/questions/category/questionCategory.test.ts` | 34 | `expect(questions?.map((q) => q.id)).toEqual(expect.arrayContaining(ids));` |
| `packages/data/src/root/dataRoot.test.ts` | 85, 93, 101, 109 | same shape, ×4 |
| `packages/data/src/objects/election/election.test.ts` | 121 | same shape |
| `packages/data/src/objects/nominations/base/nomination.test.ts` | 73 | `expect(nom.applicableQuestions.map((q) => q.id)).toEqual(expect.arrayContaining(questionIds));` |
| `packages/filters/tests/filter.test.ts` | 255, 260 | `expect(filter.apply(targets)).toEqual(expect.arrayContaining([people['Bart'], people['Homer']]));` |

**The tests say what they are for, in their own words** (all verified verbatim):
- `questionCategory.test.ts:32` — *"Questions 1-5 belong to category 1 but 3-5 are only for candidates"*
- `dataRoot.test.ts:83` — *"Filter out those with entityType: 'candidate'"*; `:87` the test is
  **titled** `'Should exclude those where filter is different'`; `:90` — *"question-10 has
  constituency filter 'constituency-1-1'"*
- `election.test.ts:118-119` — *"8 and 10 are for election-2 only. Question-10 has a constituency
  filter … but it should not be included because of the election filter"*
- `filter.test.ts:254-261` — `Bart`=`['Pizza','Hamburger']`, `Homer`=`['Pasta','Hamburger']`,
  `Marge`=`['Broccoli','Suet']`; `include = 'Hamburger'` must drop Marge.

In every case the excluded ID is the whole point, and in every case it is never asserted absent.

**What they would catch:** the filter dropping a question it should keep (under-inclusion).
**What they would miss:** the filter being deleted, short-circuited, or inverted — the entire
class of over-inclusion, which for a *filter* is the primary failure mode. `getApplicableQuestions`
and `findQuestions` feed the matching pipeline's question set, so an over-inclusive regression
silently changes every voter's match scores.

**Note the inconsistency, which shows the codebase already knows the right shape:**
`packages/data/src/root/dataRoot.test.ts:308,315` and
`packages/data/src/objects/constituency/constituencyGroup.test.ts:54` **do** pair `arrayContaining`
with a length/size check and are correct. `packages/filters/tests/filter.test.ts:265`
(`'Should not return those excluded'`) uses exact `toEqual([people['Bart']])` — three lines below
the two that don't.

**Suggested fix.** Replace `toEqual(expect.arrayContaining(ids))` with `toEqual(ids)` where order
is deterministic, or `toHaveLength(ids.length)` alongside the existing matcher where it is not.
Nine one-line edits. Worth considering an ESLint rule banning `toEqual(expect.arrayContaining(x))`
outright — it is almost always either `toEqual(x)` or a missing length assertion.

**Confidence: high.** I verified all six `@openvaa/data` sites and both `@openvaa/filters` sites
by reading the surrounding comments and matchers directly.

---

### F13 — `TemplateSchema` is not `.strict()`, so **4** "accepts X" tests cannot fail

**Files:** `packages/dev-seed/tests/template.test.ts:46,56,74`;
`packages/dev-seed/tests/template/latent.schema.test.ts:31,35,39` — all of the form:

> ⚠ **AMENDED IN PLACE 2026-08-23 by Phase 144 — this section originally said the corpus was six
> sites, and that figure is wrong twice over.** It is corrected here rather than appended to, because
> an addendum alone lets a stale figure propagate false premises into later phases. The corpus was
> **re-derived by measurement** in `144-05`, by enumerating every "accepts field X"-shape site in these
> two files at execution HEAD and classifying each by *running* it rather than by reading it:
>
> | Class | Count | Sites |
> |---|---|---|
> | **Blind → now failable** | **4** | `template.test.ts:39`, `:49`, `:59` · `latent.schema.test.ts:42` |
> | Already-failable (never blind — **not** repaired by Phase 144) | **3** | `template.test.ts:79`, `:84` · `latent.schema.test.ts:46` |
> | Unfailable by construction (assert `validateTemplate({})`; no declaration to remove) | **3** | `template.test.ts:22`, `:95` · `latent.schema.test.ts:30` |
> | **Total sites in this shape** | **10** | |
>
> **"Six" is wrong as a count of blind sites — it is 4** — **and wrong as a count of sites in this
> shape — it is 10.** Of the six this sweep named, four are genuinely blind; the other two were never
> blind and are re-measured as such (`latent.schema.test.ts:46` is failable because `latentBlock` has
> carried its own `.strict()` since Phase 57, proven non-circularly on the **pre-phase** blob). And
> there are **four further sites in the same shape that this sweep did not count at all.** The line
> numbers in the **Files:** list above are this sweep's own and have since moved; the table cites the
> re-measured ones.
>
> **Remediation — Phase 144 (ASSERT-04), closed.** `TemplateSchema` **and** `perEntityFragment` are
> both `.strict()`; tightening only the top level would have left the nested blindness intact, which
> is measured rather than asserted (`Z2-OLD`: deleting `fixed` from `perEntityFragment` cost **zero**
> failures). Each of the four blind sites carries a **two-directional** negative control at its own
> HEAD. This sweep's own "suggested fix" — the round-trip assertion — was also applied where it is the
> right repair, at `latent.schema.test.ts`, **complementing** rather than replacing the `.not.toThrow()`.
> Phase 144 additionally found and closed a reach gap this sweep could not see: `resolveTemplate`'s
> built-in branch ended in a bare `return builtIn;` and **never reached the validator at any HEAD**, so
> `default`, `e2e/base` and every `perm-*` template bypassed the zod layer at seed time entirely —
> which means F13's blindness was, for the built-in path, not merely a test-quality problem.
>
> **Evidence:** `.planning/phases/144-seed-template-strict-typing-unknown-prop-guard/144-NEGATIVE-CONTROL-LEDGER.md`
> (**37 rows · 28 measured halves · 0 borrowed observations · 0 cache replays · fallout 0 · seven gates
> green at one HEAD with the full E2E suite last at 135 passed / 0 failed / 0 flaky / 0 skipped /
> 0 did-not-run**). Rows `Z1-NEW` … `Z4-NEW` (the four), `AF` (already-failable), `NA`
> (unfailable-by-construction), `V-OLD` / `V-NEW` (the built-in bypass).
>
> **Not claimed as done:** `template.test.ts:95` is unfailable by construction and is still on the bare
> `.not.toThrow()` form. Phase 144 left it exactly as found and says so rather than absorbing it into
> the count.

```ts
expect(() => validateTemplate(allEntities)).not.toThrow();
```

**Verified root cause.** `packages/dev-seed/src/template/schema.ts:99-132` —
`TemplateSchema` is `z.object({ … }).extend({ latent: latentBlock.optional() })` with **no
`.strict()`** anywhere at the top level (only the nested `latentBlock` is strict). Zod's default
behaviour is to strip unknown keys silently rather than throw.

The test at `template.test.ts:74` is titled *"accepts per-entity fragment for every expected key
(12 non-system public tables)"* — i.e. it exists to prove every public table has a schema slot.
Delete `feedback:`, `alliances:`, or `externalIdPrefix:` from `TemplateSchema` and
`validateTemplate` still does not throw, because the now-unknown key is simply dropped.

**What it would catch:** a schema slot given a *wrong type* (the fragment would fail its own
validator). **What it would miss:** a slot being removed or renamed — precisely what the test name
promises.

**Suggested fix.** Assert the round-trip instead of the absence of a throw:
`expect(validateTemplate(allEntities)).toEqual(allEntities)`. The sibling test at
`template.test.ts:24` already does exactly this for `{}`, so the pattern is in the file. (Making
`TemplateSchema` `.strict()` would be a stronger fix and would make these tests real for free, but
that is a production-behaviour change, not a test change — worth a separate decision.)

**Confidence: high** (schema read directly).

---

### F14 — The dataWriter test builds its key matcher, then never uses it

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:303-310`

```ts
// Verify RPC was called with path object instead of File
expect(mockSupabase.rpc).toHaveBeenCalledWith(
  'upsert_answers',
  expect.objectContaining({
    p_entity_id: 'entity-1',
    p_overwrite: false
  })
);
```

Test title: `'uploads File objects to Storage and replaces with path in answers'`.

**Why it's blind.** `p_answers` — the only argument that carries the File→path substitution — is
absent from the `objectContaining` shape. What makes this unambiguous rather than an oversight is
lines 279-287: the test *constructs* the correct matcher…

```ts
const expectedAnswers = {
  'q-text': { value: 'hello' },
  'q-image': {
    value: { path: expect.stringMatching(/^proj-1\/candidates\/entity-1\/.*\.png$/) },
    info: 'My photo'
  }
};
mockSupabase.rpc.mockResolvedValue({ data: expectedAnswers, error: null });
```

…and then feeds it to `mockResolvedValue` — i.e. uses it as the mock's *return value*, never as an
assertion argument. The `expect.stringMatching` inside it is inert.

**What it would catch:** the RPC not being called, or being called for the wrong entity.
**What it would miss:** the raw `File` reaching the RPC unchanged, the answer being dropped, or the
path being malformed. The upload assertion at :297 proves the upload happened — not that its
result was substituted into the answer.

**Suggested fix.** Add `p_answers: expectedAnswers` to the `objectContaining` shape. The matcher
already exists; it just needs to be passed to the right function.

**Confidence: high** (read directly).

---

### F15 — The AI packages' tests verify wiring, not output

Two clusters, same shape: a fully-mocked LLM provider, then assertions that the mocked response
came back.

**`packages/question-info/tests/questionTypes.test.ts`** — lines 84, 139, 199, 263, 323, 387,
532, 535-537, all variations of `expect(results[0].data.infoSections).toBeDefined()`.
The file is organised as `Configuration 1: Boolean Questions` / `Configuration 2: Ordinal
Questions` / `Configuration 3: Categorical…`, but **no assertion is question-type-specific**:
nothing inspects the prompt built for a Boolean vs. a 7-point Likert vs. a categorical question,
nothing checks that choice labels were passed through. A `generateQuestionInfo` that ignored
question type entirely, or that passed the LLM response through untouched, keeps all 540 lines
green.
Its sibling `packages/question-info/tests/api.test.ts` covers much the same mocked path but is
genuinely stronger — negative assertions (`toBeUndefined()` for non-requested operations) and
`success: false` paths — so it is **not** part of this finding.

**`packages/argument-condensation/tests/condensation/condenserStandalone.test.ts:130-141`** —
the test titled *"It should run the complete condensation pipeline with mock data"* asserts
`result.condensationType` (which merely echoes the `outputType` the test passed in),
`llmMetrics.nLlmCalls > 0`, `llmMetrics.processingTimeMs > 0`, and that the provider was called.
**`result.arguments` — the product of condensation — is never touched.** A `Condenser.run()` that
discards every argument and returns `{ arguments: [], llmMetrics }` passes. Same at `:181-183`,
and at `condenseQuestions.test.ts:139-145, 215-219, 268-274` (which assert only `toHaveLength(n)`
plus the echoed type).

Incidental: `processingTimeMs).toBeGreaterThan(0)` on a fully-mocked run is a wall-clock assertion
guarding nothing — the only line in this cluster that could ever flake.

**Suggested fix.** Assert on `result.arguments`: their count, that each carries a non-empty
`text`, and that the source-comment IDs map back to the input. For `questionTypes.test.ts`, assert
on the *prompt* the provider received (`mockLLMProvider.generateObjectParallel.mock.calls[0]`) so
the three "Configurations" actually differ from one another.

**Confidence: high.**

> **REMEDIATED — Phase 142 (ASSERT-07).** Three findings, three ledger rows, each with an executed
> negative-control pair recorded in
> `.planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-NEGATIVE-CONTROL-LEDGER.md`.
>
> - **F15-A** — **ledger row 1**. Test remediation in `0d3700e58` (prompt-capture helper guarded by
>   `toHaveBeenCalledTimes`, the A-04 same-name/varying-type fixture T2/T3, D-03's repoint onto
>   `responseTransformer.ts`'s three renames, D-05's sibling at `:388`), with the A-09 guard rationale
>   reworded in `80acc432c`. The finding could not be closed by test edits alone: the shipped code
>   genuinely did not put question type or choice labels into the prompt, so **D-01's product fix**
>   landed first in `0bc21e3b3` (+ `0b15c5e86`, which hoists the guard above the `try` so its message
>   is not re-wrapped). OLD half **re-run** in this phase against the pre-fix tree (green blind,
>   package-wide 20/20 — the *whole package*, not merely the eleven assertions, was blind); NEW half
>   red at `questionTypes.test.ts:113:36` under 139 § 5.1.2's substitute injection. **139 § 5.1.6's
>   own headline target was deliberately NOT written (A-04)** — it passes today for the wrong reason.
> - **F15-A, second pass — ledger row 1s (2026-08-21, verification finding W-1).** Row 1's remediation
>   covered Configuration 1 (T1) and Configuration 3 (D-05), and A-04's substitute fixture used
>   **Boolean + Categorical only** — so **Configuration 2 (Ordinal) was left with no assertion on the
>   prompt at all**, and three of the eleven sites row 1 lists as *"passed blind"* (`:199`, `:263`,
>   `:264`) were still passing blind. Closed in `d1fc0f745`: the 5-point test asserts the type reaching
>   the prompt (read from `QUESTION_TYPE.SingleChoiceOrdinal`) plus its five choice labels as the
>   product's own joined string; the 7-point test asserts its seven, which is the only thing that can
>   separate the two — both are `singleChoiceOrdinal` (D-01-iii). **Both halves measured**, under two
>   new post-D-01 injections: type-emptied (`infoGeneration.ts:104`) and choices-emptied (`:105`). OLD
>   half green blind under both; NEW half red at `:239:22`, `:246:22` and `:318:36`. **No product
>   change** — D-01 already carried the data; only the observation was missing. A-04's rejection of
>   139 § 5.1.6's target 2 is **untouched**: nothing added here compares differently-named fixtures.
> - **F15-B** — **ledger row 2**. `fbb103c10`. `result.data.arguments` now carries an exact length plus
>   canned-text equality; red at `:155:35` under 139 § 5.2.2.
> - **F15-C** — **ledger row 3**. `fbb103c10` (the same injection instance as row 2, two vehicle runs,
>   one revert). All three clusters assert content and all three go red.
> - **The incidental wall-clock line is DELETED, not weakened** — `fbb103c10`, under D-12's bounded
>   sweep of `question-info` + `argument-condensation`: one site found, one removed, **zero** others.
>
> **Withdrawn: 0 of 3.**

---

### F16 — `rejects.toThrow()` against a mock that throws from every method

**File:** `packages/argument-condensation/tests/unit/handleQuestion.test.ts:56-68`

```ts
await expect(handleQuestion({ question, entities, options: { language: 'lol', … } })).rejects.toThrow();
```

Test intent: language validation rejects `'lol'`.

**Why it's blind.** `entities` is `[]` (line 53) **and** the mock `LLMProvider` (lines 19-26)
throws `'Method not implemented.'` from every method. There are at least three independent paths
to a throw before language validation is reached — and `defineCondensationPlan` is separately
proven to throw `'There must be at least one comment to process.'` on empty input
(`defineCondensationPlan.test.ts:71`). Delete the language check entirely and this test still
passes.

**Suggested fix.** `.rejects.toThrow(/language/i)` plus a non-empty `entities` array.

**Confidence: high.**

> **REMEDIATED — Phase 142 (ASSERT-07), ledger row 4.** `73eda4ff7`. The test now supplies a
> **non-empty `entities`** fixture and asserts the exact rejection prefix `Unsupported language: lol`
> rather than a bare `rejects.toThrow()`. Negative-control pair executed: OLD half **cited** from
> 139 § 5.4.4 row B (assertion PASS, file green); NEW half **red** under 139 § 5.4.2 **injection B**
> at `api.ts:119-121` — `expected [Function] to throw error including 'Unsupported language: lol'`.
> Injection **A** (the audit's own sentence) was **not** used: it reds before *and* after, which
> would have made the remediation unverifiable. Collateral **measured** package-wide rather than
> cited (`1 failed | 29 passed (30)`), because `api.ts` is imported by three sibling test files.
> **Not withdrawn.**

---

### F17 — "Bounded apply() invocations" measures the test's own loop

**File:** `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts:84-95`

```ts
it('Contract 4: bounded apply() invocations under a flurry of filter mutations', () => {
  const entities = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
  const group = new FakeGroup([new FakeFilter('f1')]);
  for (let i = 0; i < 10; i++) {
    group.filters[0].setActive(i % 2 === 0);
    computeFiltered(entities, group, undefined);
  }
  // Each computeFiltered call invokes apply once. 10 cycles → 10 invocations.
  // Bounded: the assertion proves no recursive/extra calls occur.
  expect(group.applySpy).toHaveBeenCalledTimes(10);
});
```

The file header describes this as a *"bounded-re-run smoke"* for the
`$derived.by(() => computeFiltered(...))` pattern. **There is no reactivity in the test.** The
component is never mounted, `$derived.by` is never exercised, and `FakeGroup.apply` calls
`applySpy` exactly once per invocation. The assertion is `10 === 10` — arithmetic on the test's own
`for` loop.

**What it would miss:** the thing it is named after — a `$derived` that re-runs on every keystroke,
or an effect loop in `EntityListWithControls.svelte`.

**Suggested fix.** Either mount the component and drive a real state mutation (the repo has the
`.svelte.test.ts` harness pattern for this — see the `lib/contexts/**` cluster), or rename the test
to what it actually verifies (`computeFiltered calls apply exactly once per invocation`), which is
a legitimate if much smaller contract.

**Confidence: high** (read directly).

> **REMEDIATED, NOT WITHDRAWN — Phase 142 (ASSERT-07), ledger rows 5 and 5s.** `a25355369`.
> The **second** of the two suggested fixes above was taken (D-04): the file is renamed
> `EntityListWithControls.helpers.test.ts` and `Contract 4` now compares an observed per-cycle
> result list against an independently-derived expectation, instead of asserting `10 === 10` on its
> own `for` loop.
>
> **⚠ This finding carries the phase's one scoped exception to ROADMAP Phase 142 criterion 1 — the
> requirement that every confirmed finding be closed by a pair driven by 139's own pre-specified
> regression.** Row 5's `NEW-assertion outcome` reads **`N/A — by construction`**, and the reasoning
> is four-part, all of it predicted in advance rather than discovered at remediation time:
>
> 1. D-04 selected the **rename** branch, not the **mount** branch.
> 2. **139 § 5.5.6 predicted this in advance**, before D-04 was taken: *"only remedy 1 makes the
>    pre-specified regression above red"* — and remedy 1 is mounting.
> 3. **139 § 8.3 R-10 independently forbids** the `EntityListWithControls.svelte:120` control on the
>    same mechanism: the component module is not in the renamed test's import graph, so that
>    injection reds **neither** before nor after and proves nothing.
> 4. Inventing a substitute would mean either designing an injection 139 never validated, or
>    crediting a red on an unrelated axis — the two failure modes the ledger exists to prevent.
>
> **Compensating evidence — measured, not asserted.** Ledger **row 5s** supplies a real, complete
> pair for the contract the renamed file now claims: a **new** injection at
> `EntityListWithControls.helpers.ts:19` (discard the filter group's result while still invoking it)
> with **both** halves run in this phase — OLD **green/blind** (isolated, exit 0,
> `1 passed | 7 skipped (8)`), NEW **red on the value axis** (`helpers.test.ts:129:24`, exit 1). It is
> labelled *"supplementary — not 139 § 5.5.2"* so it can never be misread as a citation of 139.
> Recorded honestly alongside it: the **file** was never wholly blind to that supplementary
> regression — the pre-existing `Contract 3` sibling catches it too (collateral `C-142-1`, red in
> **both** halves and never credited as either). What was blind is the assertion F17 names.
>
> So criterion 1's **intent** is satisfied for F17; what is unsatisfiable is its **letter**. This is
> **remediated, not withdrawn** — D-13's withdrawal bar is not engaged and the phase's withdrawal
> count stays **0**.

---

### F18 — "Faker locale cycling" asserts only that names are non-empty

**File:** `packages/dev-seed/tests/templates/default.test.ts:121-135`

```ts
// Shape-only assertion: non-empty strings.
for (const idx of [0, 109, 218]) {
  const r = rows[idx] as { first_name?: string; last_name?: string };
  expect(r.first_name).toBeTruthy();
  expect(r.last_name).toBeTruthy();
}
```

Test title: `'Test 10: faker locale cycling — 109 candidates per locale block (en/fi/sv)'`. The
indices 0/109/218 are chosen precisely because they are the first row of each locale block — and
then nothing locale-specific is asserted. Generating all 327 candidates with `en`, or changing
`LOCALE_BLOCK_SIZE` from 109, leaves every name truthy.

The comment is at least honest about it ("Shape-only assertion"), which puts this in the
"documented weakness" category rather than the misleading one.

**Suggested fix.** Assert the block boundary instead: that `rows[108]` and `rows[109]` come from
different locales — e.g. snapshot the three first-names against the seeded expectation (the run is
deterministic at `seed: 42`), or assert character-class differences (Finnish/Swedish names carry
`ä/ö/å`).

**Confidence: high.**

> **REMEDIATED — Phase 142 (ASSERT-07), ledger row 6.** `c456a381f`. Test 10 now asserts the
> **locale block boundary** itself, on two independent axes: the derived block size, and that a row
> at an `fi` index carries an `fi` name rather than an `en` one. Negative-control pair executed:
> OLD half **cited** from 139 § 5.6.4; NEW half **red** under 139 § 5.6.2 (`LOCALE_BLOCK_SIZE`
> 109 → 327) at **both** `:151:36` (`327` vs `109`) and `:167:43`/`:168:42`. One deliberate,
> recorded departure from the suggested fix: the boundary indices are derived from `rows.length / 3`,
> **never** from the constant the injection mutates — deriving them from `LOCALE_BLOCK_SIZE` would
> have made the assertion move with the regression and stay green. `expect.soft` was introduced to
> this repository here (zero prior uses) so both axes are observable in a single run.
> **Not withdrawn.**

---

### F19 — `toBeDefined()` on APIs that return `null`, never `undefined` (3 sites)

- `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:144` —
  `const requestParam = url.searchParams.get('request'); expect(requestParam).toBeDefined();`
- `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts:148` — identical
- `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:167` —
  `const assertion = capturedFetchBody!.get('client_assertion')!; expect(assertion).toBeDefined();`

`URLSearchParams.get()` and `FormData.get()` return `string | null`. `expect(null).toBeDefined()`
**passes**. So the assertion nominally guarding "the JAR request parameter / client assertion is
present" is structurally incapable of detecting its absence.

**Mitigated:** the following line in each case (`requestParam!.split('.')`, `jose.decodeJwt(...)`)
throws on `null`, so the test still red-lights — just with a `TypeError` instead of the intended
message. Cost is diagnosis time, not coverage.

**Suggested fix.** `.not.toBeNull()`. Three one-word edits.

**Confidence: high** on the matcher semantics; the mitigation is why this is not ranked higher.

---

### F20 — Six assertions weaker than their test titles

Grouped because each is a single site and the fix is the same shape (tighten the matcher to what
the title already promises). All verified by the delegated sweep; I spot-checked two.

| File:line | Assertion | Title promises | Missed regression |
|---|---|---|---|
| `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:233` | `await expect(POST(event)).rejects.toThrow();` | `'returns 400 when redirectUri is missing'` | a 500, or a `TypeError` on a malformed event stub. Use `.rejects.toMatchObject({ status: 400 })` |
| `apps/frontend/src/lib/i18n/tests/overrides.test.ts:32-36` | `expect(typeof result).toBe('string');` | `'getOverride returns raw template on ICU parse error'` | returning `''`, the key name, or a half-formatted string. Use `toBe('{broken, plural, }')` |
| `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts:236,259` | `expect(result.success).toBe(false);` | `'…when kid not in JWKS'` / `'…when kid does not match'` | failing for a *different* reason, or `getIdTokenClaims` returning `{success:false}` unconditionally. No error code asserted |
| `packages/dev-seed/tests/supabaseAdminClient.test.ts:151` | `expect(mockState.selectCalls[0]).toContain('id');` | select includes the `id` column | substring-matches `external_id`/`project_id`; the `id` column being dropped (breaks portrait UUID mapping) |
| `packages/data/src/objects/nominations/variants/variants.test.ts:5-12` | `expect(d.electionId).toBeDefined();` in a `forEach` | `'ParseNominationTree should insert election and constituencyId to all items'` | vacuous if the parse returns `[]` (no length guard in the file); also blind to the *wrong* ID being propagated |
| `packages/argument-condensation/tests/unit/planValidation.test.ts:104` | bare `rejects.toThrow()` | `'should throw if a final map step would produce multiple batches'` | the other 7 tests in this file all use message matchers; this one cannot distinguish its invariant from theirs |

Adjacent coverage gap surfaced while checking `getIdTokenClaims.test.ts`: it has **no** negative
test for a bad signature, a wrong `issuer`, or a wrong `audience` — the three rejections a token
validator most needs. That is a missing test, not a fake one, but it belongs in the same
conversation.

**Confidence: medium** on impact for each; high that the matcher is weaker than the title.

> **REMEDIATED — Phase 142 (ASSERT-07). All six rows; none withdrawn.** Each row below names its
> commit and its row in
> `.planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-NEGATIVE-CONTROL-LEDGER.md`.
>
> - **F20-1** (`authorize-endpoint.test.ts`, now `:234` — **+1 line drift** from Phase 151's
>   comment-hygiene codemod) — **ledger row 7**. Test in `ea5d34109`
>   (`.rejects.toMatchObject({ status: 400 })`), product fix in `0f8e99a68`. The suggested matcher
>   alone would **not** have worked: `error()` throws, so the endpoint's own in-`try` `error(400, …)`
>   was caught by its own catch and re-reported as a 500. The fix is an `isHttpError` re-throw at the
>   head of the catch arm (**A-02** applied the same 2-line fix to the sibling token route). The
>   negative control therefore **inverts** post-fix (**A-03**): OLD half **re-run** here under 139's
>   injection **B** on the pre-fix tree (green blind, 9/9 — post-fix, B is off-path and the OLD half
>   is measurable *only* pre-fix); NEW half red under injection **A**, `- "status": 400` /
>   `+ HttpError { "status": 500 }`. Injection B post-fix passes 9/9 and is labelled
>   **`not the negative control`** — it is evidence the swallow is gone, not a second pair.
> - **F20-2** (`overrides.test.ts`) — **ledger row 8**. `cba97b2a1`. Exactly the suggested fix:
>   `toBe('{broken, plural, }')`. OLD half **cited** (139 § 5.11.4); NEW half red at `:39:20`, zero
>   collateral.
> - **F20-3** (`getIdTokenClaims.test.ts:236,259`) — **ledger row 9**. Test in `ea5d34109`, product
>   in `0f8e99a68` (**A-07**: the two incidents now carry distinct opaque codes, so "no error code
>   asserted" became assertable). Two **measured divergences** from 139's record, both recorded
>   rather than smoothed over: (i) 139's **injection A is zero-delta** on both sites post-fix — both
>   fixtures throw before the injected success return is reachable — so its green proves nothing and
>   it is **not** this row's control; (ii) the controls are instead the relocated **B** plus a new
>   **symmetric B′**, and each site reds **alone** under its own branch while staying green under the
>   other's, which proves the two branches are genuinely discriminated rather than that one of them
>   is. Control **C** stays forbidden (139 § 8.3 R-9).
> - **F20-4** (`supabaseAdminClient.test.ts`, now `:160`/`:169`, **+9 line drift**) — **ledger row 10**.
>   `2372935bf`. The substring-matching `toContain('id')` is replaced by an exact `toBe` on
>   the recorded `.select(...)` string. OLD half **cited** (139 § 5.13.4); NEW half red at `:169:40`.
>   The three sibling `toContain` matchers were kept and moved **ahead** of the exact match, which
>   converts the zero-collateral claim from a citation into a measurement.
> - **F20-5** (`variants.test.ts`) — **ledger row 11**. `a02b92e51`. Both halves of the finding are
>   closed: a fixture-derived **length** guard (killing the vacuous-`forEach` hole) *and* **id
>   membership** (killing the wrong-ID hole). OLD half **cited** (139 § 5.14.4); **two** NEW-half reds
>   on **different** axes — injection **A** reds the length assertion at `:21:26`, injection **B** the
>   membership assertion at `:33:25`. Collateral measured package-wide per injection (7 and 11 further
>   tests) rather than cited from 139's `file green 1/1`, which for a one-test file says nothing about
>   blast radius.
> - **F20-6** (`planValidation.test.ts:104`) — **ledger row 12**. `8e71038c1`. The bare
>   `rejects.toThrow()` now pins the traced exact invariant message. OLD half **cited**
>   (139 § 5.15.4); NEW half red at `:111:62` in an **isolated** verdict run
>   (`1 failed | 9 skipped (10)` — exactly one title matched). The whole-file run is red **twice**;
>   the second red is the pre-existing `:94` sibling pinning the *old* message (collateral `C-1`) and
>   is **never** credited as the control. `:94-96` is byte-unchanged (D-05) — it is the contrast, not
>   a defect.
>
> **On the adjacent coverage gap above** (`getIdTokenClaims` has no bad-signature / wrong-issuer /
> wrong-audience test): **still open, deliberately.** It is a missing test rather than a fake one, so
> it was scoped out (D-05 / D-19 ii) and captured as a standing todo —
> `.planning/todos/pending/getidtokenclaims-negative-tests.md`.
>
> **⚠ NEW FINDING of this sweep's own class, discovered while closing F20-3 — not part of the
> original twelve, and NOT remediated.** `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts:90-91`
> and `providers/signicat.test.ts:54-55` each read, under a title claiming the method is
> *implemented*:
>
> ```ts
> it('implements getIdTokenClaims as a function', () => {
>   expect(typeof provider.getIdTokenClaims).toBe('function');
> });
> ```
>
> That is a **wiring-only assertion of exactly the class ASSERT-07 exists to remove** — it asserts a
> property of the object graph, never an output. It is almost certainly *why* the duplicated provider
> copies drifted from the shared helper undetected, because it is the only thing pinning
> `getIdTokenClaims` on either provider. This matters for A-07's reach: the production
> `/api/oidc/token/+server.ts:26` calls **`provider.getIdTokenClaims(idToken)`** — the providers' own
> implementations at `providers/idura.ts:114` and `providers/signicat.ts:77`, each carrying a
> duplicated copy of the logic **including an identical uncoded kid-lookup `throw`** — **not** the
> `getIdTokenClaims.ts` helper A-07 split. So: **the phase criterion is met** (D-11 E6 asks that
> F20-3's two *tests* differ observably against the helper they exercise, and they now do), **but the
> production path is untouched** — the operational benefit of the two-code split does not yet reach
> `/api/oidc/token`. Recorded as **P-2**, the phase's highest-value follow-up; see the ledger's
> *"New findings from `142-04`"* section and `.planning/todos/pending/provider-getidtokenclaims-duplication.md`.

---

## Cleared

Things I checked that are genuinely fine. Listed so you can see the sweep was real.

**Timing assertions that are not fake guards (all `toBeLessThan` sites enumerated).**
Of 30 `toBeLessThan`/`toBeLessThanOrEqual` sites repo-wide, only the two in F1 are wall-clock
budgets. The rest are:
- **Ordering assertions** — `summary.test.ts:32-34` (`out.indexOf('candidates') < out.indexOf('constituencies')`),
  `ConstituenciesGenerator.test.ts:56` (topological parent-before-child), `voter-journey.spec.ts:1817`
  (`minScoreAfter < minScoreBefore`). Comparisons between two values, not against a clock.
- **Domain range assertions** — `dateQuestion.test.ts:39`, `numberQuestion.test.ts:38`,
  `singleChoiceOrdinalQuestion.test.ts:33` (`normalizeValue(x) < COORDINATE.Max`),
  `project.test.ts:189-190` (0 ≤ value ≤ 100), `nominations-override.test.ts:66` (monotone column sums).
- **`token-endpoint.test.ts:234-236`** — `expect(payload.exp).toBeGreaterThan(now)` /
  `toBeLessThanOrEqual(now + 300 + 5)`. This *is* wall-clock, but `exp` is set to issue-time + 300
  by the code under test and `now` is sampled after the call, so breaching it would require a
  >295-second stall inside a mocked handler. Not load-sensitive at any realistic contention.

**The dev-seed statistical tolerance tests are deterministic, not flaky.**
`gaussian.test.ts`, `positions.test.ts`, `loadings.test.ts`, `spread.test.ts`,
`clustering.integration.test.ts` all draw from a Faker instance constructed fresh and seeded to 42
per call (`packages/dev-seed/tests/utils.ts:makeCtx`, `gaussian.test.ts:seededFaker`) — the file
header explicitly calls out "Pattern A: fresh `new Faker()` + `.seed()` per call — never
module-level `faker.seed()` (shared-state trap)". So `expect(meanX).toBeLessThan(5.01)` produces
the identical value on every machine and every run; the tolerances are not sampling risk. The
`clustering.integration.test.ts:188` `ratio < 0.5` threshold additionally carries an explicit
"MUST NOT be lowered to ship green" lock with an ordered remediation list. Model behaviour.

**`packages/dev-seed/tests/integration/default-template.integration.test.ts` NF-01 op budget
(the Phase-135 replacement) is sound** — `ops.bulkImport === 1`, `ops.importAnswers === 1`,
`ops.linkJoinTables === 1`, `ops.uploadPortrait === rows.candidates.length` (with
`rows.candidates.length` independently pinned to 327 in §2, so it cannot pass by both sides
collapsing to zero), plus the `unbudgeted` catch-all at §1d that surfaces any newly-introduced
admin-client call by name. The 300 s timeout is correctly documented as a hang guard, re-derived
from measurement, with a "do NOT retighten this into a performance signal" warning. My only
finding against this file is F5 (it doesn't run in CI).

**The a11y-smoke suite's content-settle contract holds.** Every entry in `AXE_ROUTES` requires a
`contentTestId` — the field is non-optional in the type (`a11y-smoke.spec.ts:185`) — and the
runner waits on it as the **last** gate (line 450), explicitly not a network-idle settle. The
header documents the exact prior defect (a `getByRole('heading')` settle that resolved on a static
i18n title before data mounted, and a `constituencies-selector` entry that had silently been
re-scanning `/elections` through a 307). This is fixed, and fixed at the type level so a new route
cannot be added without declaring what "loaded" means. The `assertRouteDerivedAnnouncer` helper is
also stronger than it first looks: it does not rely on `length > 0` alone — it asserts the
announcer text excludes the URL slug and is contained in the visible heading (lines 610-624).

**`expect.soft` is not the vitest "never-checked" trap.** All 137 uses are Playwright's
`expect.soft`, which marks the test failed at conclusion. No soft failure goes unreported. (See
F10 for the separate documentation issue.)

**`try/catch` blocks do not swallow assertions.** All 15 sites checked. The 10 in
`apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts` wrap only
`await POST(event)` (which is *expected* to throw on the mock token) and place every assertion
**outside** the catch, gated on `expect(capturedFetchBody).not.toBeNull()`. The 5 in
`packages/dev-seed/tests/writer.test.ts` and `cli/resolve-template.test.ts` are error-path tests
that assert on the caught error.

**`.catch(() => …)` sites are probes, not weakened assertions.** All 19 checked. Each is either an
explicitly tolerant action helper (`clickAllTolerantly`, `ensureAllChecked` — documented as such),
a boolean presence probe feeding a branch (`waitForVisible`, `advancePastCategoryIntro`), or a
post-click settle. The suite's `settle.ts` helper carries a documented **no-swallow contract**
("caller adds `.catch(() => null)` post-call so the suppression is visible at the read site and
not buried inside the helper") and honours it. `tests/tests/utils/multiChoice.ts` makes the same
argument explicitly for its `pollEnabled` probe and ends on a hard
`expect(...).toBeEnabled()`. F8 is the one case where the naming misleads.

**No `test.skip` / `test.fixme` / `.only` / `xit` anywhere** in the 211 TS test files. The single
`skipIf` is the documented `SUPABASE_URL` gate (F5).

**pgTAP plan counts are declared, not `no_plan()`** — 10 of 11 files declare an explicit
`SELECT plan(N)` (26/15/59/30/14/15/9/16/15/65 = 264 assertions) and end with `finish()`, so a
missing or extra assertion is caught by pgTAP itself. Only `00-helpers.test.sql` uses `no_plan()`,
which is appropriate for a helper-smoke file.

**The pgTAP RLS negative tests carry a positive control** (this was the F9-shaped risk I expected
to find and did not). `01-tenant-isolation.test.sql` asserts ten `count(*) = 0` cross-project
denials (lines 61-115), which in isolation would pass if Project B had simply never been seeded —
but the same file closes at line 297 with `admin_b CAN see own Project B elections` → `1`, and
line 243 with `candidate_a can see own record` → `1`. The rows provably exist; the zeroes are
therefore real denials. The UPDATE-isolation section is even better shaped: it asserts the write
does *not* error (line 199, RLS silently affects 0 rows) **and then** re-reads the row under
`reset_role()` to prove the value is unchanged (line 203-207) — a positive-and-negative pair.
Per-table positive controls exist only for `elections` and `candidates`, not for the other eight,
so coverage is partial rather than complete — but the anchoring pattern is present and correct.

**`.claude/scripts/audit-skill-drift.sh` is a real CI gate.** `set -euo pipefail`, exits 1 on
drift. I ran it: `Checked: 4  Drifted: 0  Skipped: 3`, exit 0. Minor note — 3 of 7 skills
(`architect`, `components`, `spike-findings-…`) declare no `targets` and SKIP silently, so 43% of
the skill surface is unguarded; that is a gap in the skill definitions, not in the script.

**`supabase-tests` CI job's `dorny/paths-filter` gate is legitimate.** Every step is `if:
steps.changes.outputs.supabase == 'true'`, so the pgTAP suite is skipped when nothing under
`apps/supabase/**` or `packages/supabase-types/**` changed. That is correct conditional-CI
practice, not an advisory gate — the tests do run when the code they cover changes.

**`apps/frontend/tests/*.spec.ts` do run.** `apps/frontend/vitest.config.ts` sets `globals: true`
and vitest's default `include` picks up `**/*.spec.ts`, so `password-validation.spec.ts` (which
uses bare `describe`/`it`/`expect`) collects and executes under `yarn test:unit`. Not orphaned.

**`setupFromTemplate.ts` post-seed verification is strong** —
`expect(persisted).toEqual(JSON.parse(JSON.stringify(expected)))` is *exact* equality after a
REPLACE, deliberately chosen over `toMatchObject` with the reasoning documented inline ("an exact
match is the anti-flake guard — it makes any future contamination fail LOUDLY at setup time").
This is what makes F3 low-severity rather than a real hole.

**`eslint-store-guard.test.ts`** — positive control + negative control, correct ESLint flag to
load the real config, correct `filePath` so the `src/**` guard scope applies, and filters by
`ruleId` rather than `errorCount`. The best-shaped guard in the repo; cited as the model for F9.

### Unit-test packages cleared

The unit-test sweep (delegated, then spot-verified — see *Method note* below) read every test file
in `packages/*` and `apps/frontend/src/**` outside the E2E tree. Clean, with no findings:

- **`@openvaa/core`** — `matching/missingValue.test.ts`, `matching/distance.test.ts`,
  `entity/getEntity.test.ts`.
- **`@openvaa/matching`** — all 5 files. Sole nit: `algorithms.test.ts:34` uses `toMatchObject` on
  a numeric array where `toEqual` reads clearer; behaviourally equivalent.
- **`@openvaa/app-shared`** — `mergeSettings.test.ts`, `passwordValidation.test.ts`,
  `data/isEmoji.test.ts`.
- **`@openvaa/llm`** — `setPromptVars.test.ts` and the bulk of `llmProvider.test.ts` (exact
  `toEqual` on full result shapes, real retry/attempt counts, real error-message matchers).
- **`@openvaa/filters`** — everything outside F12's two lines; the other ~30 assertions use exact
  `toEqual`.
- **`@openvaa/data`** — `utils/*` (11 files), `i18n/{localized,translate}`, `core/{dataObject,updatable}`,
  all `objects/questions/variants/*`, all `objects/entities/**`, `objects/questions/base/*`,
  `objects/nominations/variants/*`, and `objects/constituency/constituencyGroup.test.ts` (which
  correctly pairs `arrayContaining` with a `found.size` check — the shape F12 is missing).
- **`@openvaa/dev-seed`** (excl. `latent/`, `integration/`) — `determinism`, `pipeline`, `writer`,
  `assets`, `resolveAppSettingsExternalIds`, `cli/*` (4), `templates/{base,base-app-settings,nominations-override}`,
  and all 14 `generators/*`. Worth noting explicitly: `ConstituenciesGenerator.test.ts:55` and
  `writer.test.ts:305` both use `toBeGreaterThanOrEqual(0)` **correctly** — as `indexOf`/`findIndex`
  "was it found" checks, not as vacuous length assertions. They look like F3 and are not.
- **`apps/frontend`** — `lib/utils/matching/*` (4), `lib/utils/{image,hashIds,settings,multiChoiceValidity}`,
  `lib/utils/route/parseParams`, `params/{etSg,etPl}`, `lib/api/utils/*` (6),
  `lib/api/adapters/supabase/utils/*` (5), and `adminWriter/supabaseAdminWriter.test.ts` (every
  `rejects.toThrow` carries a message matcher — the shape F16/F20 are missing).
- **`apps/frontend/src/lib/contexts/**`** — all 14 `.svelte.test.ts` files. Called out as
  unusually well-written: own-enumerability checks via `Object.keys` rather than `in`, explicit
  negative controls, version-counter assertions.
- **`packages/argument-condensation/tests/unit/planValidation.test.ts`** — 7 of 8 tests use exact
  message matchers (the 8th is in F20).

**Method note.** The unit-test sweep was delegated to a subagent. Per the project's standing
"flag unverified root cause" practice I did not accept its diagnoses on trust: I independently
re-read and confirmed 5 of its highest-value claims before writing them up —
F12 (all 6 `@openvaa/data` sites + both `@openvaa/filters` sites, including the surrounding
comments that establish intent), F13 (`schema.ts:99-132`, confirming no `.strict()`),
F14 (confirming `expectedAnswers` is passed to `mockResolvedValue`, never to a matcher),
and F17 (confirming the loop is non-reactive). All 5 checked out exactly as reported. F15, F16,
F18, F19 and the F20 table are reported at the subagent's confidence, not independently re-read;
they are internally consistent with what I did verify, but treat them as one-source.

---

## Not assessed

- **`apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts` and `…/signicat.test.ts` — never
  enumerated at all.** Added 2026-08-22, retrospectively. These two files appear in no finding, in no
  *Cleared* entry, and in no bullet of this section — they were not assessed and were not known to be
  unassessed, which is the harder failure mode. Between them they carried **six**
  `typeof … === 'function'` guards, a wiring-only class this sweep already had three names for
  (F15's mock-in/mock-out, F16's throw-from-every-method mock, F20's title-vs-matcher gap). Phase 142
  found the consequence as **P-2** — the guards had let two duplicated copies of an ID-token
  decrypt→verify path drift from the shared helper on an **authentication** route, so A-07's
  discriminating failure codes never reached production — and Phase 142.1 remediated all six with
  **8 freshly measured negative-control pairs, 0 cited, 0 withdrawn**. See § Post-sweep addendum above
  for the full record. Stated here rather than only there because *this* is the section a later reader
  checks to learn what the sweep did not cover.

- **F15, F16, F18, F19 and the F20 table are single-source** (the delegated sweep). I verified the
  four highest-value unit findings myself but not these; see the *Method note* in Cleared. My
  prediction — stated so it can be checked — is that they hold, because the four I did verify were
  accurate to the line and because F15's shape (mock-in, mock-out) was visible in the
  `condenserIntegration.test.ts` header I read independently.
  **Tested — Phase 139, 2026-08-14: the prediction held.** All fifteen sites (F15 as three
  sub-findings, F16, F18, F19's three sites and all six F20 rows) were re-read against the live tree
  and each was verdicted by *executing* an injection: **15 confirmed, 0 withdrawn**, so no entry above
  is struck. Two descriptions were corrected without changing a verdict — three of the ten F15-A sites
  are exact string equalities rather than `toBeDefined()` variants, and an eleventh site at
  `questionTypes.test.ts:388` was missed — and both corrections strengthen the mock-in/mock-out ground
  this bullet gives. See `.planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md`
  § 6.3 for the full answer and § 5 for the per-finding runs.
- **Whether the F2 loose regexes would *actually* fail today.** I proved the mechanism (`t()`
  returns the key) and the regex/key overlap, but I did not run the suite against a deliberately
  broken catalog to observe a green pass. That experiment is the definitive confirmation and is
  cheap: delete `common.answer.yes` from `messages/en/common.json`, run
  `--project=voter-journey`, and check whether step ~1338 stays green. I did not do it because it
  requires a dev-server + seeded-DB run and the brief said not to run the full suite.
- **The 8s/15s perf thresholds under CI conditions.** My measurements are from this machine
  (14-core, host Vite, local Supabase). GitHub's `ubuntu-latest` runners are 2-core and the
  workflow runs Playwright with `workers: 1`, so absolute latencies there will be higher than
  1055 ms — possibly several×. That does **not** change the F1 conclusion (the ttfb≈DCL structural
  argument is environment-independent), but it does mean I cannot state the CI headroom multiple.
  If you want that number it is one `console.log` read away from the next CI run's artifact.
- **`apps/supabase/supabase/functions/**` beyond `claimConfig.test.ts`**, and 9 of the 11 pgTAP
  files' assertion *contents*. I verified plan-count discipline across all 11, read
  `01-tenant-isolation.test.sql` in full (see Cleared — it has positive controls), and sampled the
  rest. I did not read all 264 assertions to judge whether every RLS denial is anchored the way
  the tenant-isolation ones are. Given that the one file I read closely was well-shaped, my prior
  is that the others are too, but that is an inference, not a check.
- **`tests/tests/specs/perm/*` beyond the 6 flagged by the existence-only scan.** I scanned all 26
  perm specs programmatically for existence-only assertion patterns and read the 2 worst; I did
  not read all 26 in full.
