---
phase: 147
kind: scout-measurement
created: 2026-08-26
head: 4adf451ed
tool: "@axe-core/playwright + axe-core 4.11.4"
host: "macOS (darwin 25.5.0), local Chromium via Playwright, dev server :5173, local Supabase"
dataset: "e2e/base, seeded by tests/tests/setup/shared/base.setup.ts"
identity: "CA-AA-1 (test-e2e-base-ca-aa-1), force-registered + UI-logged-in by tests/tests/setup/shared/auth.setup.ts"
status: measured
---

# Phase 147 scout — the candidate `(protected)` axe inventory

Reconnaissance only. **No product byte was written and no suite file was changed.** The scan ran
from a throwaway config + spec under the wholesale-gitignored `tests/e2e-runs/`, deleted at close;
its full text is reproduced in § *Re-derivation* so every number below can be re-obtained.

---

## 1. The headline

**Zero.** Across **7 candidate surfaces × 2 themes × 2 runs = 28 scans**, the same axe configuration
the voter gate uses (`withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa'])`) reports

| | |
|---|---|
| violation **rules** | **0** |
| violation **nodes** | **0** |
| run-to-run variance | **0** (run1 ≡ run2, per surface, per theme) |
| re-confirmed on a freshly `db:reset` DB | **0** (a third run per theme, 14 further scans) |
| raw-i18n-key findings | **0** (`assertNoRawI18nKeys` green on every surface) |

The per-rule regression trio the voter gate names — `aria-required-parent`, `list`, `button-name` —
is also 0 on every candidate surface, so the candidate routes would satisfy the voter gate's
`assertAxeGates` unchanged.

Counting the post-`db:reset` confirmation run, that is **42 scans at zero**.

**Phase 148 is sized at zero violations.** That is a measurement, not an extrapolation.

## 2. The negative control — why the zero is believed

A 0 on a never-before-scanned surface is exactly the shape of a vacuous scan, so both scanners were
proven live **on a candidate protected route** before the 0 was accepted. All five controls pass
(`tests/e2e-runs/147-scout/controls.spec.ts`):

| # | Control | Result |
|---|---|---|
| C1 | Inject `<img>` with no alt + `<button>` with no name + `#bbb`-on-white text into the live `/candidate/questions` DOM | axe reports `image-alt` 1, `button-name` 1, `color-contrast` 1 — **including one of the voter gate's per-rule trio** |
| C2 | Render the literal string `candidateApp.questions.editAnswer` on `/candidate/questions` | `assertNoRawI18nKeys` **FAILS**, message names the key, "598 catalog keys were checked" |
| C3 | Render the literal string `common.required` on `/candidate/profile` | `assertNoRawI18nKeys` **FAILS**, message names the key |
| C4 | Same surface, nothing injected | both scanners green (`violations 0`, `passes 23`) — so C1–C3 measured the injection, not the surface |
| C5 | `/edit/i` vs `candidateApp.questions.editAnswer`; `/required/i` vs `common.required` | both **match** — and both also match the real strings `Edit Your Answer` / `Required`, which is exactly why the matchers cannot tell the working state from the broken one |

## 3. Theme proof

Every dark scan runs in a **born-dark browser context** (`use: { colorScheme: 'dark' }` on the
project), never a flip-after-walk — the mechanism `assertDarkThemeApplied` exists to enforce. The
guard is inlined into the scan's own output: a `.text-neutral` node created at scan time (the live
token) is compared against the persistent header chrome.

| theme | `prefers-color-scheme: dark` | live token | persistent chrome | verdict | `body` background |
|---|---|---|---|---|---|
| light | `false` | `rgb(51, 51, 51)` | `rgb(51, 51, 51)` | MATCH ×7 | `rgb(255,255,255)` |
| dark | `true` | `rgb(204, 204, 204)` | `rgb(204, 204, 204)` | MATCH ×7 | `rgb(0,0,0)` |

Those are the same two token values `a11y-smoke.spec.ts`'s docblock records for the light/dark
`--color-neutral`, so the documents are genuinely and wholly in the theme claimed.

## 4. The inventory, by route × theme

Both runs agree cell for cell. `passes` = axe rule-checks that ran and passed on that surface;
`incomplete` = axe "needs review" (see § 5).

| # | surface | route | theme | authenticated-content proof (in the scan's own output) | axe passes | **violations (rules / nodes)** | incomplete nodes | raw-key |
|---|---|---|---|---|---|---|---|---|
| 1 | `cand-home` | `/en/candidate` | light | `h1` = "You're Ready to Roll!" | 21 | **0 / 0** | 4 | pass |
| 1d | `cand-home` | `/en/candidate` | dark | same | 21 | **0 / 0** | 4 | pass |
| 2 | `cand-profile` | `/en/candidate/profile` | light | `h1` = "Basic Information"; 11 `candidate-profile-info-item`s; visible "Required" marker | 25 | **0 / 0** | 7 | pass |
| 2d | `cand-profile` | `/en/candidate/profile` | dark | same | 25 | **0 / 0** | 7 | pass |
| 3 | `cand-questions` | `/en/candidate/questions` | light | `h1` = "Your Opinions"; all category Expanders opened; "Edit Your Answer" visible | 23 | **0 / 0** | 12 | pass |
| 3d | `cand-questions` | `/en/candidate/questions` | dark | same | 23 | **0 / 0** | 12 | pass |
| 4 | `cand-question` | `/candidate/questions/{uuid}` | light | `h1` = "[qu-opin-base-1-likert5] Base opinion 1 — Likert 5."; 5 Likert choices | 23 | **0 / 0** | 3 | pass |
| 4d | `cand-question` | `/candidate/questions/{uuid}` | dark | same | 23 | **0 / 0** | 3 | pass |
| 5 | `cand-preview` | `/en/candidate/preview` | light | rendered `EntityDetails` for "Generic AA One" with Basic Info / Opinions tabs | 24 | **0 / 0** | 2 | pass |
| 5d | `cand-preview` | `/en/candidate/preview` | dark | same | 24 | **0 / 0** | 2 | pass |
| 6 | `cand-settings` | `/en/candidate/settings` | light | `h1` = "Settings"; "Current Password" field | 25 | **0 / 0** | 2 | pass |
| 6d | `cand-settings` | `/en/candidate/settings` | dark | same | 25 | **0 / 0** | 2 | pass |
| 7 | `cand-nav-menu` | nav drawer over `/en/candidate` | light | drawer opened; 7 `nav-menu-item`s; "Log Out" present | 23 | **0 / 0** | 6 | pass |
| 7d | `cand-nav-menu` | nav drawer over `/en/candidate` | dark | same | 23 | **0 / 0** | 6 | pass |
| | | | | | | **TOTAL 0 / 0** | 72 | 14 × pass |

Every URL in the scan output is inside `/candidate/...` and none is `/candidate/login`, so no scan
was silently re-scanning a redirect target — the `+layout.server.ts:37` `redirect(307, CandAppLogin)`
never fired.

### The fake settle this scan had to fix

The first pass anchored `cand-preview` on `candidate-preview-container` — the testid the visual
baselines use. **Measured, that anchor resolves while `<Loading>` is still inside the container**
(`anchorText` = "Loading…", `h1` = `null`): the container is the shell, not the content
(`preview/+page.svelte:96-104`). A candidate route table that reuses it inherits a scan of a
spinner. The entry now anchors on the rendered `EntityDetails` image, mirroring
`candidatePreviewPage.expectPortraitVisible()`. **This is a route-table hazard Phase 147's plan must
inherit, not a scout artefact.**

## 5. `incomplete` — 72 nodes, all `color-contrast`, and NOT a candidate-specific finding

axe returns 72 `incomplete` ("needs review") nodes across the 14 scans, 31 distinct
(rule, selector) pairs, **every one of them `color-contrast`** and every one on a
`<span class="uc-first">` inside a `vaa-button-label`, or on a `<select>` with `!bg-transparent`.
Grouped by rendered label:

| nodes | label | surfaces |
|---|---|---|
| 22 | "Edit Your Answer" | `cand-questions` (both themes) |
| 8 | "Preview your profile" | `cand-home`, `cand-nav-menu` |
| 8 | "Translations" | `cand-profile`, `cand-question` |
| 8 | "Return" | `cand-profile`, `cand-question`, `cand-settings` |
| 4 | "Edit your basic information" | `cand-home`, `cand-nav-menu` |
| 4 | "Edit your opinions" | `cand-home`, `cand-nav-menu` |
| 4 | `<select … !bg-transparent>` | `cand-profile` |
| 2 each | "Log Out", "Close menu", "Basic Info", "Opinions", "Add item", "home", "Contact support" | as listed |

**Parity control:** the existing, green voter surfaces produce the same class of result —
`voter-home` 3 `color-contrast` incompletes, `voter-elections` 1, both at 0 violations
(`tests/e2e-runs/147-scout/voter-parity.spec.ts`). The voter gate asserts only on `violations` and
ignores `incomplete`. So the candidate incompletes are **the suite's standing posture on both halves
of the app**, not a candidate-specific gap, and Phase 148 criterion 3's "identical in strictness to
the voter app's" is satisfied by leaving them out of the gate. Recorded here so the decision is
visible rather than absent.

## 6. The `(protected)` route family — complete enumeration

Derived from `apps/frontend/src/routes/candidate/(protected)/` (`find`, not memory). Six leaf
routes; **all six were scanned**, plus the drawer overlay.

| # | module | URL | principal? | state beyond login | scanned |
|---|---|---|---|---|---|
| 1 | `(protected)/+page.svelte` | `/candidate` | yes | none | ✅ |
| 2 | `(protected)/profile/+page.svelte` | `/candidate/profile` | yes | a nomination (enforced by the layout loader) | ✅ |
| 3 | `(protected)/questions/+page.svelte` | `/candidate/questions` | yes | answers present ⇒ list state; **all Expanders must be opened or the cards are absent from the DOM** | ✅ |
| 4 | `(protected)/questions/[questionId]/+page.svelte` | `/candidate/questions/{uuid}` | yes | a question id — reachable only by walking the overview (ids are DB UUIDs, not fixtures) | ✅ |
| 5 | `(protected)/preview/+page.svelte` | `/candidate/preview` | yes | answers, and a settle on `EntityDetails` not the container | ✅ |
| 6 | `(protected)/settings/+page.svelte` | `/candidate/settings` | yes | none | ✅ |
| — | `(protected)/+layout.svelte` | chrome on all six | — | carries the ToU gate modal | partially (chrome scanned; modal not — see below) |
| — | `(protected)/questions/+layout.svelte` | chrome on 3+4 | — | — | scanned as part of 3 and 4 |
| 7 | nav drawer (`Navigation.svelte`, shared) | overlay | yes (the candidate analogue of the voter gate's two drawer entries) | must be opened via the fixture, see § 7 | ✅ |

**Proposed principal-route list for criterion 1:** routes 1–6 (the whole leaf set) **plus** the nav
drawer. That is 7 surfaces × 2 themes = **14 new scans**, matching the voter family's 14 exactly.

### Reachable-but-not-scanned states — unknowns, not zeros

Each of these is a distinct *state* of an already-scanned route. None was scanned; none is claimed
to be 0.

| state | why not reached with this identity | lever |
|---|---|---|
| ToU gate modal (`terms-of-use-submit`, `(protected)/+layout.svelte:169-180`) | CA-AA-1 carries `terms_of_use_accepted` | **`e2e/base` already ships `test-e2e-base-ca-aa-hidden` with `terms_of_use_accepted` DELIBERATELY absent** (`base.ts:1073-1081`) — no new dataset needed |
| `/candidate/questions` empty-state intro (`candidate-questions-intro`) | every `e2e/base` candidate carries answers (`grep 'answersByExternalId: {}'` → 0 hits across 31 declarations) | needs a template change or a runtime answer wipe |
| logout confirmation modal | `candidateLogoutButton.fixture.ts:52-59`: the modal appears only when answers are INCOMPLETE; CA-AA-1 is complete | same as above |
| `answersLocked` warning (`candidate-answers-locked-warning`, 3 routes) | an `app_settings` scenario owned by the `perm-answers-locked` chain | reuse that perm setup, or accept the gap |
| `PreventNavigation` unsaved-changes modal (profile, question) | requires a dirty form + navigation attempt | an extra `settle` step |
| portrait-upload error (`profile-image-error`), preview `notFound` error | failure paths | out of scope for a route-family scan |

### Out of family (candidate app, but not `(protected)`) — also unscanned

`login`, `help`, `privacy`, `forgot-password`, `password-reset`, `register`, `register/password`,
`preregister` (+ `elections` / `constituencies` / `email` / `status`). **11 further unscanned
candidate surfaces**, none of which needs authentication. They are outside CSCAN-01's wording
("candidate `(protected)` routes") but they are the same coverage hole, and their a11y state is
unknown for the same reason. Flagged for the discussion to decide, not assumed.

## 7. Route-table hazard: the drawer needs the fixture, not a click

A hand-rolled `page.getByTestId('nav-menu-toggle').click()` **does not open the drawer** — measured
on the candidate app at 1280×720 AND 390×844, and identically on the voter app:
`aria-expanded` stays `"false"`, `input.drawer-toggle` stays unchecked, `nav[data-testid=nav-menu]`
keeps `display: none`, sampled at 0/30/80/150/400/1200 ms after the click.

This is **not** a product defect. It is the documented SSR→hydration race in
`navMenu.fixture.ts:66-79`: the toggle renders via SSR before its `onclick={openDrawer}`
(`Layout.svelte:48`) is hydrated, so a click in that gap is a no-op. The fixture wraps
click + open-assert in `expect(...).toPass({ timeout: 15_000 })`. Going through
`createNavMenu(page).openMobileNav()` opens it first try. **Any candidate route entry that opens the
drawer must go through the fixture.**

## 8. Re-derivation

Files (all under the wholesale-gitignored `tests/e2e-runs/`, removed at scout close):

- `tests/e2e-runs/147-scout/scan.config.ts` — standalone Playwright config: `testDir` = `<repo>/tests`,
  projects `data-setup-base` (`testMatch: /setup\/shared\/base\.setup\.ts/`) →
  `auth-setup` (`/setup\/shared\/auth\.setup\.ts/`) → `scan` / `controls` / `voter-parity` /
  `navprobe`, each `use: { ...devices['Desktop Chrome'], storageState: tests/playwright/.auth/user.json }`,
  `colorScheme` taken from `SCAN_THEME`. `workers: 1`, `retries: 0`.
- `tests/e2e-runs/147-scout/candidate-axe-scan.spec.ts` — the 7-entry route table above; per entry:
  `reach` → `contentTestId` visible → `awaitAnimationsSettled` (copied verbatim from
  `a11y-smoke.spec.ts:115-129`) → post-login proof + theme probe → `assertNoRawI18nKeys` (caught,
  recorded) → `new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()` → one JSON per route+theme.
- `tests/e2e-runs/147-scout/controls.spec.ts` — C1–C5.
- `tests/e2e-runs/147-scout/voter-parity.spec.ts` — the voter-side `incomplete` parity probe.
- `tests/e2e-runs/147-scout/navprobe.spec.ts` — the drawer timing samples.

Invocation:

```
SCAN_OUT_DIR=<dir> SCAN_THEME=light npx playwright test -c tests/e2e-runs/147-scout/scan.config.ts --project=scan
SCAN_OUT_DIR=<dir> SCAN_THEME=dark  npx playwright test -c tests/e2e-runs/147-scout/scan.config.ts --project=scan
npx playwright test -c tests/e2e-runs/147-scout/scan.config.ts --project=controls
npx playwright test -c tests/e2e-runs/147-scout/scan.config.ts --project=voter-parity
```

## 9. What this measurement does NOT cover

Stated so the zero is not read wider than it was taken.

1. **Environment.** Measured on macOS against local Chromium. CI runs `yarn test:e2e` on a GitHub
   `ubuntu` runner (`.github/workflows/main.yaml:289`). Colour values are computed, not rendered, so
   contrast results should transfer; **layout-dependent rules were not re-observed on Linux.**
2. **Contention.** Measured at `--workers=1` in a standalone config with nothing else running. The
   real `a11y-smoke` project runs alongside the rest of the suite. `a11y-smoke.spec.ts:88-114`
   records that scan-timing pressure produced *phantom* `color-contrast` failures on the voter side;
   the same pressure has **not** been applied to these surfaces.
3. **One identity, one dataset.** CA-AA-1 on `e2e/base`. The states in § 6 are unmeasured.
4. **One viewport.** 1280×720 (`devices['Desktop Chrome']`), matching the voter family. Mobile
   candidate layouts were not scanned (nor are voter ones).

---

# Roadmap assumptions the measurements contradict

Recorded here, not only in the scout's reply, because each one changes the phase's shape.

## A. Criterion 5 / split rationale — "would very likely land the suite red". **MEASURED FALSE.**

> *Split rationale:* "the candidate `(protected)` surfaces have never been axe-scanned, so that
> single commit would very likely land the suite red, which the cardinal rule forbids."

Measured: **0 violations, 28 scans, both themes, twice.** Extending `AXE_ROUTES` to the candidate
family lands **green**, with the per-rule trio at 0 as well. The premise the split exists to serve
does not hold. The split may still be wanted for other reasons (reporting granularity), but it can
no longer be justified as *"otherwise the suite goes red."*

## B. Criterion 4 — "the voter-only 598". **FACTUALLY WRONG.**

598 is **not** a voter-only figure. `loadCatalogKeys()` (`rawKeyScan.ts:179-201`) flattens **every**
`*.json` in each source directory, and those directories contain `candidateApp.*.json` (17 files)
and `adminApp.*.json` (10 files). Recomputed from disk at HEAD `4adf451ed`:

| source | total keys | of which `candidateApp.*` |
|---|---|---|
| runtime Paraglide catalog (`apps/frontend/messages/en`) | 598 | **161** |
| type-gen source catalog (`src/lib/i18n/translations/en`) | 591 | **161** |
| generated `TranslationKey` union | 598 | **161** |
| **UNION (what the scanner uses)** | **598** | **161** |

Namespace split of the 598: `candidateApp` **161**, `adminApp` **121**, voter/shared **316**.

So there is **nothing to recompute**. The union is already application-wide and already mechanically
derived; the scanner's own failure message even prints *"598 catalog keys were checked"* when fired
from a candidate route (control C2/C3 above). The REAL-04 overstatement is about **surface reach**
(which routes get scanned), never about **key coverage** — and the v2.14 record actually says so
correctly in its D-136-04-1 boundary; it is criterion 4's *restatement* of it that introduces the
error. **The retirement is a wording correction, not an arithmetic one.**

## C. Criterion 2 — "runs independently of whether the axe assertion passes". **ALREADY TRUE in execution order.**

`assertAxeScan` (`a11y-smoke.spec.ts:449-475`) calls `assertNoRawI18nKeys` at **:471**, *before* the
axe scan at **:473-474**. The raw-key gate therefore already runs, and already reaches its verdict,
regardless of what axe later says. What the two share is a single `test()` body and hence a single
reported verdict. So the accurate statement of criterion 2 is *"the raw-key result is reported as its
own test rather than being subsumed by an axe failure"* — a **reporting** property, not an
**execution** one.

## D. Criterion 3 — the key name is wrong, and both line numbers have drifted.

| roadmap says | actual |
|---|---|
| key `candidateApp.questions.*.editAnswer` | **`candidateApp.questions.editAnswer`** — no wildcard segment; it is the only `editAnswer` key in the union (`candidateApp.questions.json:6` runtime, `:5` type-gen) |
| `candidate-journey.spec.ts:921` | **`candidate-journey.spec.ts:924`** |
| `candidateProfilePage.fixture.ts:174` | **`candidateProfilePage.fixture.ts:179`** |

Both matchers still exist and both still have the claimed property:

- `candidate-journey.spec.ts:924` — `await expect(boolCard.first().getByTestId(testIds.candidate.questions.cardAction)).toHaveText(/edit/i);`
- `candidateProfilePage.fixture.ts:179` — `await expect.soft(q).toContainText(/required/i);` — note **`expect.soft`**, so even a real failure here does not fail fast.

`/edit/i` matches `candidateApp.questions.editAnswer` **and** `Edit Your Answer`; `/required/i`
matches `common.required` **and** `Required` (control C5). Both sites are blind exactly as recorded.

**But the "route-family extension is the fix" claim is now provable in a stronger form than the
roadmap states:** both keys are *rendered and visible* on surfaces the new scan reaches —
`candidateApp.questions.editAnswer` on `cand-questions` (measured `editAnswerVisible: true`, 22 card
actions with the label), `common.required` on `cand-profile` (measured `requiredMarkerVisible:
true`). So the extension does not merely cover the routes; it covers the exact rendered strings.

## E. Criterion 1 — the "authenticated scan fixture" is already built. The work is **wiring**, not fixture-building.

Everything the criterion asks for exists and works:

| piece | where | state |
|---|---|---|
| force-register + real UI login as CA-AA-1 | `tests/tests/setup/shared/auth.setup.ts` | works; ran 8× in this scout with 0 failures |
| candidate storageState | `tests/playwright/.auth/user.json`, via `STORAGE_STATE` (`playwright.config.ts:10`) | works |
| the `auth-setup` project | `playwright.config.ts:388-397` | **declared ONLY under `process.env.PLAYWRIGHT_VISUAL`** |
| candidate page fixtures | `tests/tests/fixtures/candidate/*` (12 files) | work; the scout reused `navMenu.fixture.ts` directly |

**The real structural work is a dependency-graph change, and it is the one thing worth planning
carefully.** `a11y-smoke` today declares `dependencies: ['data-setup-base']`. Reaching `(protected)`
requires `auth-setup` to be ungated from `PLAYWRIGHT_VISUAL` **and** added to `a11y-smoke`'s
dependencies — which **moves `a11y-smoke` into a later Playwright phase** (projects sharing an
identical dependency set share a phase; `a11y-smoke` currently shares one with `voter-journey`,
`performance`, `voter-*`, `eperm07-term-trigger`, `bank-auth` and `auth-setup` itself). The perm
chain head (`data-setup-perm-1e1cg1co`) depends on `['voter-journey','candidate-journey',
'eperm07-term-trigger']`, and every perm setup does an authoritative `app_settings` singleton
REPLACE. `playwright.config.ts:496-518` records in detail how an earlier project got this wrong
twice. **This is the phase's genuine risk, and it is an ordering risk, not a fixture risk.**

Cost of the extension itself: **+14 tests** (7 surfaces × 2 themes), ≈ **+22 s** wall clock
(measured: 7 light scans in 22.0 s including setup; 7 dark in 21.5 s). If the raw-key gate is also
split into its own test per surface, +14 more.

## F. Split cost — one line, one importer, no other dependents.

`assertNoRawI18nKeys` is imported at exactly **one** place in the repo
(`a11y-smoke.spec.ts:69`, called at `:471`); `grep` over `tests/`, `apps/`, `packages/`, `.github/`
finds no other consumer. Its signature is `(page: Page, label: string)` — no axe types, no shared
state. **As code it is already decoupled; the coupling is a single call line inside `assertAxeScan`.**

Nothing else rides on it:

- **Lint.** `tests/eslint.config.mjs:64` sets `playwright/expect-expect` `assertFunctionPatterns:
  ['^expect[A-Z]', '^assert[A-Z]']`. Both `assertAxeScan` and `assertNoRawI18nKeys` already match
  `^assert[A-Z]`, so a split into two helpers/tests needs **no lint-config change**.
- **CI.** `.github/workflows/main.yaml:289` invokes `yarn test:e2e`; nothing names either helper.
- **Config guards.** The orphan-probe guard and the soft-assertion budget guard
  (`playwright.config.ts:57-105, 156-...`) touch neither file. **Note:** the budget guard is scoped
  to `specs/voter/voter-journey.spec.ts` only, so adding `expect.soft` anywhere in a new candidate
  scan file is ungoverned.

**Records that would go stale on a split or an extension** (each states the current 7-routes /
14-surfaces / voter-only shape as fact):

| file | lines | stale claim |
|---|---|---|
| `tests/tests/utils/rawKeyScan.ts` | 34-40 | "Wired into `assertAxeScan` … 7 routes x 2 themes" |
| `tests/tests/utils/rawKeyScan.ts` | 300-301 | "WHICH of the 14 scanned surfaces broke" |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | 3-6, 33-46, 47-51 | "7 voter-app surfaces", the 7-entry route list |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | 156-158 | "Run unauthenticated — all routes are voter-app (public)" — **would become false** |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | 359, 457-465 | "0 violations across all 7 surfaces"; "covers all 598 keys" |
| `tests/playwright.config.ts` | 362-397 | "`auth-setup` is retained ONLY to back the visual opt-in project; it is dormant in the default run" |
| `.planning/milestones/v2.14-REQUIREMENTS.md` | 126 | REAL-04 body — the `:921` / `:174` line numbers and the `candidateApp.questions.*.editAnswer` key spelling |
| `.planning/todos/pending/2026-08-12-candidate-app-axe-and-rawkey-blind.md` | 21-24 | same two wrong line numbers, same wrong key spelling |
| `.planning/REQUIREMENTS.md` | 40-41 | CSCAN-03 carries the same two wrong line numbers |
| `.planning/ROADMAP.md` | 788-797 | criteria 2, 3, 4 and the split rationale, per A–D above |

---

# Environment finding (not a phase finding)

The full E2E suite was **red before this scout started**, and the cause is the DB, not the tree.

- First full-suite run of this session: **7 failed / 79 did not run / 49 passed**, with failures of
  the shape *expected "[qg-opin-base] Base Opinion Questions", received "Economy & Taxation 7
  questions"* and *constituency comboboxes expected 1, received 2*.
- Measured against the live DB: it held **only** the dev-seed **`default`** template —
  `seed_`-prefixed: 1 election, 5 constituencies, 4 question categories, **327 candidates**,
  26 questions — i.e. the `db:reset-with-data` state, not the `db:reset` state the suite's
  prerequisite calls for (`apps/supabase/supabase/seed.sql` creates **zero** `seed_` rows, so those
  rows came from a `--template default` seed run before this session).
- The tree was not the cause: `git status --porcelain` and `git diff HEAD` are both empty for
  tracked files throughout; every scout artefact lives under the wholesale-gitignored
  `tests/e2e-runs/`, which is outside the suite's `testDir` (`tests/tests`) and so is not collected
  by `tests/playwright.config.ts`.
- Remediation applied: `yarn db:reset`, then a full re-run — **135 passed / 0 failed / 0 skipped /
  0 flaky / 0 did-not-run, exit 0, 10.7 min**. The clean-DB run reddening nothing is also the proof
  that the earlier 7 failures were the `default` template and not the tree.
- The candidate scan and all five controls were then re-run against that clean DB and reproduce the
  same result (14 scans, 0 violations, 0 raw-key findings; controls 7/7).
- The scout's own dataset was torn down afterwards (`base.teardown.ts`); the DB is left in the
  post-`db:reset` state — only `seed.sql`'s baseline rows (`Test Candidate`, `admin@openvaa.test`,
  `candidate@openvaa.test`) and no orphaned auth user. That is exactly the state the 135/0 run
  started from.
- **Side effect for the operator: the Finnish demo data is gone. `yarn db:seed:default` restores it
  — and re-reddens the suite, which is the standing trade, not a regression.**
