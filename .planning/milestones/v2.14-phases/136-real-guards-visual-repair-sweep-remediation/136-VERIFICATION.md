---
phase: 136-real-guards-visual-repair-sweep-remediation
verified: 2026-08-12T06:54:28Z
status: human_needed
score: 13/15 must-haves verified
behavior_unverified: 2
overrides_applied: 0
verdict: PASS-WITH-CONCERNS
gaps: []
deferred:
  - truth: "Sweep findings F3, F9, F10, F13, F15–F20 remediated"
    addressed_in: "todo .planning/todos/pending/2026-08-12-fake-guard-sweep-deferred-findings.md"
    evidence: "ROADMAP Phase 136 'Out of scope' line; audit's own F3 assessment ('decoration, not a coverage hole'; the real contamination guard is setupFromTemplate.ts:256-260 exact-equality on the app_settings singleton)"
  - truth: "@openvaa/data / @openvaa/filters unit tests reachable by a CI command"
    addressed_in: "operator decision D-136-06-1 Option B (explicit locale for formatDateAnswer) — DECIDED, IMPLEMENTATION PENDING"
    evidence: "deferred-items.md D-136-06-1 'RESOLVED (operator decision, 2026-08-12): Option B … Implementation pending'"
behavior_unverified_items:
  - truth: "REAL-01 — the visual-regression gate discriminates (a screenshot regression reddens the build)"
    test: "CLOSED 2026-08-12 — see 136-VISUAL-DISCRIMINATION-EVIDENCE.md"
    expected: "PROVEN. Injected MatchScore.svelte:30 text-lg -> text-2xl; container run at the shipped config returned EXIT 1, naming voter-results-mobile.png (18,926 px, ratio 0.02). Reverted -> 7/7 green on three consecutive runs (5, 6, 7)."
    why_human: "RESOLVED — no longer requires human action. BUT the same control opened a new, measured concern: at maxDiffPixelRatio 0.01 the voter-results-desktop baseline (1280x3684) PASSED the identical regression at 19,484 px = 0.41%, under its 47,155 px tolerance, while voter-results-mobile (390x4152) FAILED the same damage at 1.21%. The ratio budget dilutes with page height, so the gate blinds itself as pages grow. Filed: todos/pending/2026-08-12-visual-gate-ratio-blind-to-tall-pages.md. Also unexplained: 1 failure in 5 clean runs (run 4), failing test not captured, HMR-staleness hypothesis UNCONFIRMED."
  - truth: "REAL-03 — the dev-seed-integration job actually executes the NF-01 operation budget on a GitHub runner"
    test: "Observe the first real CI run of the `dev-seed-integration` job on a PR and confirm the dev-seed test count includes the integration test as EXECUTED (not skipped)"
    expected: "Job green, `default-template.integration.test.ts` runs, 0 skipped"
    why_human: "GitHub Actions cannot be executed from this environment. The wiring is verified by construction (job present, no `if:` gate, env exported with hard `test -n` checks, module-scope throw guard) and by local simulation — but runner-side `supabase/setup-cli@latest` drift is only settled by an observed run. REAL-03's own text names this boundary."
human_verification:
  - test: "RESOLVED 2026-08-12 (Option B implemented) — Decide whether the milestone may close while eleven F12 guards are executed by no CI command (D-136-06-1)"
    expected: "Either the D-136-06-1 Option B fix lands (formatDateAnswer takes an explicit locale → test:unit scripts for data/filters → green `yarn test:unit`), or the milestone close explicitly records that F12 remediation is local-only"
    why_human: "Independently confirmed by this verifier, not merely read from the SUMMARY: `npx turbo run test:unit --dry=json` reports `@openvaa/data |cmd: <NONEXISTENT>` and `@openvaa/filters |cmd: <NONEXISTENT>`. This is finding F5's exact pathology, and F5 was treated as blocker-grade in the same phase. The asymmetry is documented and justified, but it is a judgment call about what 'remediated' means."
  - test: "RESOLVED 2026-08-12 (explicit waiver recorded) — Decide whether DEF-135-04 (undiagnosed ~1-in-5 EPERM-07 term-trigger failure) is compatible with closing the milestone under CLAUDE.md's cardinal E2E rule"
    expected: "Either a root-cause diagnosis, or an explicit, recorded operator waiver at milestone close"
    why_human: "CLAUDE.md states there is no such thing as an acceptable flaky test and that a flake 'MUST be ironed out — not skipped, retried-until-green, or annotated as flaky'. The project has correctly refused to close it by absence (now 1 failure in 8 full-suite runs), but 'left open and tracked' is not the same as 'ironed out'. This is a milestone-close decision, not a Phase-136 defect."
  - test: "QUEUED 2026-08-12 to next milestone — Accept or remove the fonts.googleapis.com egress dependency inside the now-blocking e2e-visual gate (D-136-05-2)"
    expected: "Either Inter is self-hosted/vendored, or the risk is accepted with the failure mode (settleFonts → 'webfont Inter did not load') noted as the mitigation"
    why_human: "A third-party network dependency inside a build-reddening gate is an availability risk the project does not control. Disclosed in REAL-01, not resolved."
  - test: "QUEUED 2026-08-12 to next milestone — Confirm the two named candidate-app blind sites are acceptable to leave blind until the candidate-app axe route family lands (D-136-04-1)"
    expected: "Recorded acceptance, or a follow-up phase scheduled"
    why_human: "Verified still blind at candidate-journey.spec.ts:921 (`toHaveText(/edit/i)`) and candidateProfilePage.fixture.ts:174 (`toContainText(/required/i)`). Whether 'the F2 class is closed' is an honest headline given voter-only reach is a wording/scope judgment."
resolution_log_2026_08_12:
  - item: "C1 / D-136-06-1 — eleven F12 guards executed by no CI command"
    outcome: "CLOSED. Operator chose Option B: formatDateAnswer/formatNumberAnswer take an explicit DEFAULT_LOCALE instead of Intl ambient fallback (896fbf0bf). Negative control: pre-fix source FAILS under ambient fi-FI, PASSES under LC_ALL=en_US — it would have gone green on a US CI runner while the product bug shipped. test:unit added to data+filters; turbo resolves both (were NONEXISTENT); yarn test:unit --force exit 0, 21/21 tasks, data 244 + filters 22; all five F12 files execute."
  - item: "DEF-135-04 — undiagnosed EPERM-07 intermittent"
    outcome: "WAIVED explicitly, not closed. .planning/v2.14-CARDINAL-RULE-WAIVER.md — rule quoted, 1-in-8 count stated, four conditions attached."
  - item: "REAL-01 visual-gate discrimination"
    outcome: "PROVEN (7 container runs, same image digest as 136-05). Injected regression reddened the blocking job naming voter-results-mobile.png; reverted -> 7/7 green x3. Same control MEASURED a new defect: voter-results-desktop PASSED the identical regression at 19484 px (0.41% vs its 47155 px tolerance) while mobile FAILED at 1.21% — the ratio budget dilutes with page height. See 136-VISUAL-DISCRIMINATION-EVIDENCE.md."
  - item: "REAL-03 first observed CI run"
    outcome: "STILL OPEN — requires an actual GitHub Actions run; cannot be executed locally."
  - item: "post-change regression gate"
    outcome: "Full E2E 134 passed / 0 failed / 0 did-not-run (11.6m, exit 0) after the product change; format:check clean."
---

# Phase 136: Real Guards — Visual Regression Repair + Fake-Guard Remediation — Verification Report

**Phase Goal:** Turn the suite's remaining guards-in-costume into guards that discriminate, and repair the visual-regression project so it actually runs and actually blocks.
**Verified:** 2026-08-12T06:54:28Z
**Status:** human_needed — **PASS-WITH-CONCERNS**
**Re-verification:** No — initial verification
**Method:** Static/read-only. The 3× E2E gate and the in-container visual runs were NOT re-executed (per instruction and cost); their recorded evidence was assessed. Two independent live checks were run because they need no server: `playwright --list` (suite size) and a negative control against the orphan-probe guard.

---

## What this verifier independently established (not read from SUMMARY.md)

These four are the load-bearing ones, because each tests the phase's own organising claim — *does the guard discriminate?* — rather than whether code was written.

1. **The orphan-probe guard is PROVEN to discriminate.** I copied an existing probe to `zzVerifierTemp.probe.spec.ts` and ran `--list`. Config load threw, by name:
   `Error: Orphaned probe spec(s) in tests/specs/_probes — they match NO Playwright project and run from NO command: zzVerifierTemp.probe.spec.ts` at `tests/playwright.config.ts:41`. File removed; `git status --short tests/` empty afterwards. This is a real fail-closed invariant, not a comment.
2. **The raw-key scanner's expectation set is genuinely a union of three independent sources.** I recomputed it from disk with the same flattening rules: runtime Paraglide catalog **598**, type-gen source catalog **591**, generated `TranslationKey` union **598** → **UNION 598** (≥ `MIN_EXPECTED_KEYS = 400`). Critically, `about.title` — the key the recorded negative control deleted from `messages/en/about.json` — is still present in *both* other sources (`src/lib/i18n/translations/en/about.json` has `title`; `translationKey.ts` contains `'about.title'`). So the self-defeating failure mode the first design had (expectation vanishing at the exact moment the key starts rendering raw) is genuinely closed by construction, not merely asserted.
3. **The F12 guards are reached by no CI command — confirmed independently.** `npx turbo run test:unit --dry=json` → 15 `test:unit` tasks, of which `@openvaa/data |cmd: <NONEXISTENT>` and `@openvaa/filters |cmd: <NONEXISTENT>` (also `core`, `matching`, `llm`, `question-info`, `argument-condensation`, `shared-config`, `dev-tools`, `supabase-types`). Only `app-shared`, `dev-seed`, `docs`, `frontend`, `supabase` carry a command. `.github/workflows/main.yaml` invokes no bare `vitest`.
4. **Suite size is 134.** `npx playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe --list` → `Total: 134 tests in 88 files`, matching the Phase-135 baseline and the gate's claim.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `auth-setup` authenticates against `e2e/base` — the visual chain runs instead of failing at login | ✓ VERIFIED | `tests/tests/setup/shared/auth.setup.ts:82-84` — `new SupabaseAdminClient()` → `unregisterCandidate(TEST_CANDIDATE_EMAIL)` → `forceRegister(TEST_CANDIDATE_EXTERNAL_ID, …)`, then a real UI login at `:97-98`. Idempotent by the unregister-first ordering. Commit `83d2c4f32`. |
| 2 | The four baselines are container-generated, not developer-Mac captures | ✓ VERIFIED | `file` on the committed PNGs: `voter-results-desktop` 1280x**3684**, `voter-results-mobile` 390x**4152**, `candidate-preview-desktop` 1280x**821**, `candidate-preview-mobile` 390x**924** — exactly the dimensions REAL-01 claims, and materially different from the recorded v1.2 Mac set (1624/1617/720/844). Commit `b1542119d` names `mcr.microsoft.com/playwright:v1.58.2-noble --platform linux/amd64`. |
| 3 | The `e2e-visual` job no longer carries `continue-on-error: true` — a visual regression blocks | ✓ VERIFIED | `grep -n 'continue-on-error\|expected to fail' .github/workflows/main.yaml` → **no matches** (exit 1). `main.yaml:332-333` step is named "Run visual regression tests (blocking)". Commit `38418f9d6`. |
| 4 | The visual gate discriminates — a screenshot regression reddens the build | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Job is blocking, baselines are real, 4/4 in-container passes recorded, `settleFonts` failure mode explicit (`visual-regression.spec.ts:71-75`, `expect(interLoaded, 'webfont Inter did not load — baselines were captured with it')`). But **only stability was measured, never sensitivity** — no injected-UI-change negative control exists, unlike every other guard in this phase. `maxDiffPixelRatio: 0.01` (`playwright.config.ts:112`) on a 4.7 Mpx baseline tolerates ~47k differing pixels. Not re-runnable here (Docker out of bounds). |
| 5 | The perf budget asserts on a metric that actually moves — proven by an injected regression | ✓ VERIFIED | `performance-budget.spec.ts` now measures `timeToMatches` (reload `waitUntil:'commit'` → first `match-score` visible) AND `resultsFetches ≤ 13`, a **load-independent operation count** of `/rest/v1/` requests. `grep domContentLoaded` → present only inside the observability-only `navigationTiming` log, never asserted (explicit comment: "Observability only — NEVER asserted"). Non-vacuity guards `cardCount > 0` / `scoreCount > 0` present. Recorded side-by-side: 441 → **6993 ms** FAIL while the old `domContentLoaded` **stayed at 55 ms**; sensitivity probe 13 → 10 failed as `Expected: <= 10 / Received: 11`. |
| 6 | A filter that no-ops and returns everything FAILS the assertions that exist to prove it excludes things | ✓ VERIFIED | Commit `2f1cc3b9f` converts eleven sites to plain `toEqual(ids)` (verified in current source, e.g. `filter.test.ts:255/260/271`, `election.test.ts:29/121`, `dataRoot.test.ts:85/93/101/109`, `nomination.test.ts:73`). **The three surviving `arrayContaining` uses each carry an explicit cardinality partner** — `constituencyGroup.test.ts:54` + `expect(found.size).toBe(...)` at `:55`; `dataRoot.test.ts:308` + `toHaveLength(2)` at `:309`; `dataRoot.test.ts:315` + `toHaveLength(3)` at `:316` — so over-inclusion still fails at all three. Two-run negative control recorded: old assertions **17** failures, new **25**. |
| 7 | The 10 s dead wait is gone from the shared voter fixture, replaced by a condition-based wait | ✓ VERIFIED | `grep waitForTimeout tests/tests/fixtures/voter/voter-journey.fixture.ts` → **0 hits**. Replacement at `:420-423` is `currentChoices.first().or(numberSlider.first()).first()` with a `sliderJustAnswered` fallback to the pre-136 scoped wait — condition-based, with the guard's rationale (stale-surface hazard on adjacent NUMBER questions) documented in place. |
| 8 | The dataWriter test asserts the File→path substitution it is named for | ✓ VERIFIED | Commit `2fe94f933`: `p_answers: expectedAnswers` added to the call assertion and `objectContaining` tightened to exact args; the matcher's `info` corrected to `{ en: 'My photo' }` — i.e. the previously-unused matcher was *wrong*, which is itself proof it had never been exercised. Recorded control: stubbed substitution → old assertion 34/34 blind, new one fails on `"value": File {}`. This package IS in CI. |
| 9 | The Phase-135 operation budget actually executes in CI | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Structurally complete and fail-closed: `main.yaml:139-202` `dev-seed-integration` job, **no `if:` gate on any substantive step**, `DEV_SEED_INTEGRATION_REQUIRED: "1"` at job env, `supabase status -o env` export with hard `test -n … || exit 1` on both keys, then `yarn workspace @openvaa/dev-seed test:unit`. Meta-guard verified at `default-template.integration.test.ts:107` — throws at module scope if the flag is set while `SUPABASE_URL` is not. **Never observed on a real runner** (GitHub Actions not executable here); REAL-03 names this boundary itself. |
| 10 | No test file sits in the tree matching no runner | ✓ VERIFIED + PROVEN TO DISCRIMINATE | 4 orphans deleted (`6c9ddfb55`, with per-method supersession rationale). The 5 remaining `_probes/*.probe.spec.ts` all match `PROBE_TEST_MATCH` (`playwright.config.ts:16`). The enumeration invariant is CHECKED at config load (`:34-48`) — **and I observed it fail** against a planted orphan (see above). |
| 11 | The raw-key scanner derives its key set from the artifact under test, covers every current and future key, and fails loudly if the derivation empties | ✓ VERIFIED | `tests/tests/utils/rawKeyScan.ts` — three sources unioned in `loadCatalogKeys()`; `MIN_EXPECTED_KEYS = 400` enforced by `expect(keys.size, …).toBeGreaterThanOrEqual(MIN_EXPECTED_KEYS)`; no hardcoded key list (`DOTTED_TOKEN_PATTERN` is a pre-filter, the verdict is exact-membership); per-text-node reads, not `body.innerText`; no allowlist. **Independently recomputed: 598/591/598 → union 598.** Wired at `a11y-smoke.spec.ts:471`, inside `assertAxeScan`, BEFORE the axe scan. |
| 12 | The scanner is proven to fire by negative control | ✓ VERIFIED | Recorded control (deleting `about.title`, paraglide `en.js` 598→597, both home scans FAIL naming `"about.title"` at `a[data-testid=voter-home-about-link]`). Structurally corroborated here: `about.title` survives in the type-gen catalog and `translationKey.ts`, so the union genuinely retains the expectation the runtime deletion removes — the rescue path is real, not narrative. |
| 13 | `voter-journey.spec.ts` asserts the resolved boolean answer, not a regex the raw key satisfies | ✓ VERIFIED | `voter-journey.spec.ts:1350-1351` — `const booleanValue = infoItems.nth(9).locator('div:not(.test-label)')` then `toHaveText('Yes')`, exact, on the value node. `common.answer.yes` cannot satisfy an exact `'Yes'`; the label's `…-yes-no?` text is excluded by the locator. |
| 14 | The gate ran clean, suite size unchanged, static gates clean | ✓ VERIFIED (recorded) + independently corroborated on size | `--list` → **Total: 134 tests in 88 files** (my own run). 3× `yarn test:e2e` at 134/0/0, 625/621/621 s, per-run `db:reset` + cold Vite + served-app assertion — recorded in `136-06-SUMMARY.md`; not re-executed per instruction. `yarn test:unit --force` exit 0 quiet AND under 14 CPU burners (load peak 40.86), dev-seed 444/444, seed step 16627 ms = 1.66× the deleted 10 s budget — the load-independence claim re-measured, not restated. |
| 15 | REAL-01..04 are flipped only against recorded evidence, with every coverage boundary in the requirement TEXT | ✓ VERIFIED | `.planning/REQUIREMENTS.md:112-115` + mapping rows `:228-231`. All six boundaries present in the requirement prose (not only in SUMMARYs): candidate-app not covered (REAL-04), fonts.googleapis.com egress (REAL-01), F5 wiring unobserved (REAL-03), deferred sweep findings (section note + REAL-02), DEF-135-04 open (section note + REAL-02), F12-not-in-CI (REAL-02). |

**Score:** 13/15 truths verified (2 present, behavior-unverified)

---

### The E2E port-identity check

✓ VERIFIED as a real assertion, not a warning. `.planning/REQUIREMENTS.md:108` records the gate's per-run check as `curl -s http://localhost:$PORT/ | grep -q '<title>Election Compass</title>'`, and `136-06-SUMMARY.md` states the script **refuses to start the suite** if it fails. This is the response-content assertion the superseding todo (`.planning/todos/pending/2026-08-11-e2e-port-identity-check-insufficient.md`) prescribes, and it correctly replaces DEF-135-03's process-type check that a foreign Vite server defeated. The check lives in the gate harness rather than in the repo, so it protects gate runs but is not itself a committed artifact — worth promoting to a script if future gates are to inherit it.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/tests/utils/rawKeyScan.ts` | Union-derived scanner with non-vacuity floor | ✓ VERIFIED | 3 sources, `MIN_EXPECTED_KEYS = 400`, exact-membership verdict, per-node reads, no allowlist |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | Scanner wired into every scanned surface | ✓ VERIFIED | `:471` inside `assertAxeScan`, before axe; `AXE_ROUTES` = 7 voter routes × 2 themes |
| `tests/tests/specs/perf/performance-budget.spec.ts` | Work-done metric, not a bumped wall clock | ✓ VERIFIED | `resultsFetches ≤ 13` operation budget + `timeToMatches < 5000`; Navigation Timing logged only |
| `tests/tests/fixtures/voter/voter-journey.fixture.ts` | No 10 s dead wait | ✓ VERIFIED | 0 `waitForTimeout` hits; `.or()` race with documented guard |
| `packages/data/**`, `packages/filters/**` tests | 11 subset matchers → equality | ✓ VERIFIED | Plus 3 justified survivors, each cardinality-paired |
| `.github/workflows/main.yaml` | `dev-seed-integration` job; `e2e-visual` blocking | ✓ VERIFIED | Job present and ungated; 0 `continue-on-error` in file |
| `tests/playwright.config.ts` | Orphan-probe invariant checked, stale KNOWN GAP removed | ✓ VERIFIED | `:34-48` throws by name; observed firing |
| `tests/tests/setup/shared/auth.setup.ts` | forceRegister base CA-AA-1 | ✓ VERIFIED | `:82-84` |
| `tests/.../__screenshots__/*.png` (4) | Container-generated, current dataset | ✓ VERIFIED | Dimensions match REAL-01's claims exactly |
| `.planning/REQUIREMENTS.md` | 4 flips + 4 mapping rows + 6 boundaries in prose | ✓ VERIFIED | `:112-115`, `:228-231` |
| `.planning/todos/pending/2026-08-12-*` (2) | Deferred findings + data/filters CI hole | ✓ VERIFIED | Both present |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `rawKeyScan.ts` | 14 a11y surfaces | `assertNoRawI18nKeys` in `assertAxeScan:471`; a11y-smoke runs by default in `yarn test:e2e` (opt-out `PLAYWRIGHT_NO_A11Y` not set in CI) | ✓ WIRED |
| `dev-seed-integration` job | `default-template.integration.test.ts` | `supabase status -o env` → `SUPABASE_URL` → `skipIf` false; fail-closed via `DEV_SEED_INTEGRATION_REQUIRED` | ✓ WIRED (unobserved on a runner) |
| `e2e-visual` job | 4 baselines | `PLAYWRIGHT_VISUAL=1 … --grep "@visual"`, no `continue-on-error` | ✓ WIRED |
| `PROBE_TEST_MATCH` | `specs/_probes/` contents | config-load throw | ✓ WIRED (observed firing) |
| **11 converted F12 assertions** | **any CI command** | — | **✗ NOT WIRED** — `turbo run test:unit` resolves both packages to `<NONEXISTENT>`; no bare `vitest` in the workflow. See concern C1. |

---

## Per-criterion verdict

### REAL-01 — visual regression works and blocks: **PASS-WITH-CONCERNS**

Every structural element is real and verified at file:line: registration mechanism, container-generated baselines with dimensions matching the claim, blocking job, explicit `settleFonts` failure mode, and two genuine determinism fixes (election pin, font settle) without which no baseline of any provenance could hold. The 4/4 in-container evidence is credible and includes the CI-exact invocation plus a byte-untouched baseline check.

**Concern:** the gate is proven *stable*, not proven to *discriminate*. In a phase whose thesis is "an assertion that cannot fail is worse than no assertion", REAL-01 is the one deliverable with no injected-regression control. The material old→new baseline delta is indirect evidence the comparison bites, and 0.01 diff-ratio on full-page captures will catch layout-scale regressions — but the sensitivity floor is unmeasured. Additionally, the blocking gate's reliability now depends on `fonts.googleapis.com` egress (D-136-05-2) — honestly disclosed, and `settleFonts` converts an unreadable red into a readable one, but the dependency is real and self-hosting Inter remains the correct fix.

### REAL-02 — the worst blind guards are fixed: **PASS-WITH-CONCERNS**

**F1 passes the "work-done not bumped-clock" test.** The assertion is not a rethresholded wall clock: `resultsFetches ≤ 13` counts operations and is load-independent by construction, and the docblock states plainly *why* the wall-clock half alone is insufficient ("a wall-clock gate with 3.3× headroom cannot catch an N+1 on a fast machine"). The old metric is retained as logging only, explicitly never asserted. The 441→6993 vs unmoved-55 ms side-by-side is the right evidence shape, and the 13→10 sensitivity probe demonstrates the operation budget's floor. Note honestly: the 5000 ms wall-clock half, standing alone, would not catch a 3× regression — it is the fetch budget that carries the discrimination, and the spec says so.

**F12 conversions are real.** Plain `toEqual` on complete sets at eleven sites (two beyond the audit's enumeration), and — the detail that matters most, since it is where a sloppy job would hide — the three surviving `arrayContaining` uses are each paired with an explicit cardinality assertion on the adjacent line, so over-inclusion fails at those too. The two-run negative control (17 vs 25) is the correct design: one failing run would only have proved the stub worked.

**Concern C1 (the substantive finding of this verification):** those eleven guards are executed by no CI command. This verifier confirmed it independently rather than accepting the SUMMARY. REAL-02's *literal* wording ("fixed and demonstrated to fail against an injected regression") is met — but the phase *goal* is guards that discriminate, and a guard nothing runs delivers zero signal to `main`. The same defect shape, found on F5, was treated in this very phase as blocker-grade and got a dedicated CI job; found on F12, it was deferred. The deferral has a genuine prerequisite (D-136-02-1 turns `yarn test:unit` red on a `fi` machine) and is disclosed at length inside REAL-02 — this is disclosure, not a boundary quietly doing an exemption's work. But **REAL-02 must not be read as "F12 is guarded on main."** It is guarded in the tree only. The operator has now decided the fix (Option B: explicit locale on `formatDateAnswer`); until it lands, this stays open.

### REAL-03 — guards that never run, run: **PASS**

The strongest criterion in the phase. F5's resolution is wired rather than narrowed, and the wiring is itself fail-closed twice over: no conditional gate on the job, hard `test -n … || exit 1` on both exported keys (which actually *understates* itself in REQUIREMENTS — key-name drift on `supabase status -o env` produces a named red step, not a silent skip), and a module-scope throw if `DEV_SEED_INTEGRATION_REQUIRED` is set without `SUPABASE_URL`. The separate-job rationale (327 `seed_` rows would contaminate `e2e/base`; appending to `e2e-tests` would let a red E2E mask a seed regression) is correct reasoning, not post-hoc justification.

F4 is the cleanest work in the phase: deleted on a per-method supersession argument rather than a pass/fail run, *and* the defect class guarded by an enumeration invariant that I observed failing against a planted orphan. That is the only guard in Phase 136 whose discrimination I proved myself, in this session.

**Residual:** the first real CI run is still the only confirmation of runner-side behaviour. Named in the requirement.

### REAL-04 — the raw-i18n-key class is closed systemically: **PASS-WITH-CONCERNS**

The union derivation is genuine (recomputed independently: 598/591/598 → 598), the `MIN_EXPECTED_KEYS = 400` floor exists and is enforced by a hard `expect`, and every other failure path (missing directory, missing type file) throws rather than degrading to an empty set. The design rationale is exactly right: the first scanner would have gone green on the very defect it existed to catch, and the union closes that because a key must vanish from all three sources at once — at which point no call site can reference it. Exact-membership verdict + per-text-node reads keep it allowlist-free. `voter-journey.spec.ts:1350` now asserts `'Yes'` exactly on the value node, closing the sharpest of the 21 sites.

**Concern:** the requirement headline says "suite-wide … across all 598 English keys". The *key* coverage is complete; the *surface* coverage is not — `AXE_ROUTES` declares 7 voter routes and no candidate route, verified by reading the table. D-136-04-1 states this in bold inside REAL-04 and names both remaining blind sites, which I confirmed are still blind at `candidate-journey.spec.ts:921` and `candidateProfilePage.fixture.ts:174`. So the boundary is disclosed, not smuggled — but "suite-wide" overstates reach by a word, and the honest reading is "every key, on the voter half of the app."

### SC5 — gate: **PASS (on recorded evidence)**

Suite size independently confirmed at 134. The gate's own quality is above the bar in three respects worth naming: the discarded concurrent run was quarantined and reported rather than silently re-run; the visual project was run 4× (3 stability + CI-exact) rather than the single run the plan required, on the reasoning that one green run is the weakest evidence that would still let a blocking job be called verified; and the served-app check refuses to start the suite rather than warning. The load-run datum (16627 ms = 1.66× the deleted 10 s budget, with the operation budget passing) is a re-measurement, not a restatement.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| — | No `TBD`/`FIXME`/`XXX` in any file modified by this phase | — | Debt-marker gate clean |
| `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:96` | `page.waitForTimeout(500)` | ℹ️ Info | Pre-existing, outside this phase's files; not introduced here |
| `tests/tests/utils/missingNominations.ts:163,177` | `waitForTimeout(STABILITY_WINDOW_MS)` | ℹ️ Info | Named stability window, pre-existing |
| ROADMAP "Out of scope" line | Deferral range reads "F13–F20", which textually includes **F14** — but F14 was in fact remediated (`2fe94f933`) | ℹ️ Info | Over-delivery vs the written range; REQUIREMENTS' enumeration (`F3, F9, F10, F13, F15–F20`) is the accurate one |

### Deferred-scope assessment

The scope call is **sound**. Checked against the audit's own text rather than the roadmap's summary of it:

- **F3** (27 unfailable teardown assertions) is the only deferred finding rated High that touches the E2E chain, and the audit itself concludes it is *"decoration, not a coverage hole"* — the real contamination guard is `setupFromTemplate.ts:256-260`'s exact-equality REPLACE of the `app_settings` singleton, and row leakage is re-cleared by the next setup's own `runTeardown`. Deferring it leaves no claimed guarantee unsupported. (It is mildly mischaracterised as a "unit-test quality issue" in the ROADMAP; substance unaffected.)
- **F9, F10, F13, F15–F20** are unit-test / doc-drift items in packages whose tests, per C1, no CI command runs anyway — so remediating them without first fixing the CI reach would have produced more unexecuted guards.
- The deferral todo carries the audit's own caveat that F15, F16, F18, F19 and F20 are **single-source** (delegated sweep, not independently re-read), which is the right disclosure.

### DEF-135-04 assessment

Leaving it OPEN after six clean gate runs is the correct epistemic call, and the record states the reasoning precisely ("a single unexplained observation does not become a non-issue by failing to recur — it becomes a lower-frequency unexplained observation"). Phase 136 neither introduced nor is blocked by it: `perm-interactive-info (EPERM-07)` executed and passed in all three gate runs.

**But** CLAUDE.md's cardinal rule says an intermittent failure "MUST be ironed out — not skipped, retried-until-green, or annotated as flaky." Tracking is not ironing out. Compatible with closing **this phase**; **not** cleanly compatible with closing the **milestone** without either a diagnosis or an explicit, recorded operator waiver. Routed to human decision above.

---

## Gaps Summary

No blockers. Every must-have artifact exists, is substantive, is wired, and — where a negative control was recorded — discriminates. Two guards I verified myself in this session (the orphan-probe invariant; the scanner's union + floor) hold up under adversarial reading, and the one place a sloppy job would have hidden (the surviving `arrayContaining` sites) is clean.

The phase's honesty standard is genuinely high: the gate *found a new hole in the phase's own work* and named it inside the requirement it qualifies rather than absorbing it into a green result. That is the behaviour a fake-guard sweep should produce.

Three things prevent an unqualified PASS:

1. **C1 — eleven F12 guards reach no CI command.** Independently confirmed. Disclosed, prerequisite-blocked, operator-decided, implementation pending. REAL-02 is met as written; the phase goal is half-delivered for F12.
2. **C2 — the visual gate's sensitivity was never negative-controlled.** Stability ≠ discrimination, by this phase's own argument.
3. **C3 — REAL-03's F5 wiring and the blocking `e2e-visual` job have never executed on a real GitHub runner.** Correct by construction and by local simulation; unobserved.

None is a defect in what was built. All three are the difference between *implemented* and *proven to discriminate*, which is the distinction this phase exists to enforce — so they are recorded in those terms rather than waved through.

---

_Verified: 2026-08-12T06:54:28Z_
_Verifier: Claude (gsd-verifier) — static/read-only; E2E and container gates not re-executed per instruction_
