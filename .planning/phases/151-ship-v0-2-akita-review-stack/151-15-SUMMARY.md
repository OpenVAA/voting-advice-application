---
phase: 151-ship-v0-2-akita-review-stack
plan: 15
subsystem: frontend-routing-and-i18n
tags:
  [
    review-stack,
    routing,
    app-shell,
    accessibility,
    i18n-parity,
    context-reactivity,
    open-redirect,
    checklist-disposition,
    criterion-1
  ]
requires:
  - '151-14: slice 06 cut at 8c613634b, PRs #863-#868 open, F-61/F-62 routed here, gate baseline unchanged'
  - '151-13: the line-break trap and F-44''s three gate blind spots, routed to the sweeping plans'
  - '151-06: the disposition scaffold, cells_expected 163'
  - "151-05: the manifest's canonical pathspec reader, the dropped-finding standing instruction, D-07's lag"
  - '151-04: the re-measured axe scan reach (5 URLs, 31 unscanned routes) and the hooks.server.ts boundary move'
provides:
  - 'slice 07 branch ship/v0.2-akita-07-frontend-routes at 342926b93 (214 files, +10319/-8268), pushed'
  - 'slice 08 branch ship/v0.2-akita-08-i18n-messages at 6a810df8a (330 files, +8986/-0), unpushed'
  - 'PR #869 open (slice 06 -> ship/v0.2-akita-05-e2e-tests) and PR #870 open (slice 07 -> ship/v0.2-akita-06-frontend-lib)'
  - '151-DISPOSITION.md slices 07 and 08: 24 cells, cells_filled 99 -> 123 of 163'
  - 'the 31 axe-unscanned routes named path by path with individual manual accessibility verdicts'
  - 'locale key-set parity measured: 7 x 47 x 598, symmetric difference 0'
  - 'pr-bodies/06.md and pr-bodies/07.md'
  - 'F-67..F-76 (10 findings; 6 fixed, 3 deferred with routing, 1 disproved)'
affects:
  - '151-16 (PR 8 opens there; F-64 plus two slice-09 specifics; a named instance for F-15''s operator decision)'
  - '151-17 (the both-numbers PR-body instruction matters most for slice 11)'
  - '151-18 (two reactivity fixes whose covering specs were named but not run; F-74 duplication; F-75 blocked by PR #869)'
  - '151-19 (a fourth F-44 gate blind spot, confirmed live: a line-broken phase reference)'
tech-stack:
  added: []
  patterns:
    - 'measure a gate''s complement and then sweep it by hand, class by class, with per-class totals over the whole complement — the totals are what make 30 MET verdicts checkable instead of assertable'
    - 'when a superficially identical pattern appears twice, trace it into its renderer before judging: the same <h3> is a WCAG defect under one parent and correct under another'
    - 'check the UNGATED columns of a gate report after every edit, not only the gated ones — a correctly-formed citation moves occ while bare holds, so --assert-clean stays silent'
    - 'reconcile a published number against the measured one rather than trusting either: PR files-changed uses rename detection and a --no-renames convention will disagree with it'
key-files:
  created:
    - apps/frontend/src/routes/loginRedirectTarget.ts
    - apps/frontend/messages/README.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/pr-bodies/06.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/pr-bodies/07.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-15-SUMMARY.md
  modified:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md
    - apps/frontend/src/routes/+layout.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/statistics/+page.svelte
    - apps/frontend/src/routes/candidate/login/+page.server.ts
    - apps/frontend/src/routes/admin/login/+page.server.ts
    - apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts
    - apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts
    - apps/frontend/src/routes/README.md
    - apps/frontend/messages/sv/components.json
decisions:
  - 'The 31 routes the axe scan cannot reach were swept by hand class by class rather than recorded not-applicable, and the per-class totals are published so the 30 MET verdicts are checkable. That is what found the one real defect in the set.'
  - 'The h1-to-h4 heading skip was FIXED rather than deferred because the correct level was verifiable (Expander renders no heading) and the rendered output provably unchanged (base-layer heading styles, so a size utility wins) with no visual baseline covering that route.'
  - 'The unvalidated login redirect was FIXED despite having no test coverage in either direction, because the guard is fail-safe by construction: a rejected value takes the pre-existing no-redirectTo branch, so a wrong verdict degrades a deep link rather than breaking a login.'
  - 'F-62 was investigated and DISPROVED rather than fixed. Both $derived(ctx.dataRoot) aliases are write-only and outside any tracking scope; fixing a non-bug would have made the record less trustworthy, not more.'
  - 'The sv questions.intro.start placeholder omission is DEFERRED while the sv timeLeft one is FIXED. The first needs Swedish copy (a publisher decision); the second needed only variable names, leaving the Swedish text untouched.'
  - 'Ten bare 88-02 plan identifiers were RECORDED not stripped, unlike 151-13''s pure 122-05 citations: they sit inside prose distinguishing two design generations of the same route, so removing them costs meaning.'
  - 'D-19''s per-item fan-out was deliberately collapsed for slice 08 and recorded AS collapsed — eight of twelve items have no surface in 329 JSON files and the other four turn on four whole-slice measurements that twelve agents could not improve.'
metrics:
  duration_min: 92
  completed: 2026-08-17
  tasks: 3
  commits: 12
  slice_07_files: 214
  slice_08_files: 330
  cells_filled_delta: 24
  findings_raised: 10
  findings_fixed: 6
  findings_deferred: 3
  findings_disproved: 1
  routes_changed: 36
  routes_axe_covered: 5
  routes_swept_by_hand: 31
  locale_key_symmetric_difference: 0
actuals:
  tokens: 46000
  tasks: 3
  commits: 12
status: complete
---

# Phase 151 Plan 15: Sweep and cut the routes and message slices Summary

Swept the request path and the seven-locale catalogue against 24 checklist cells, named and manually
swept the **31 routes no automated accessibility gate reaches**, measured locale key parity to a
symmetric difference of **0**, fixed 6 defects in 8 commits — including a reactivity violation a prior
scan had missed and an unvalidated redirect on both login actions — cut slices 07 and 08, and opened
PRs #869 and #870.

## What was built

**Slice 07** — `ship/v0.2-akita-07-frontend-routes` at **`342926b93`**, 214 files, +10,319 / −8,268,
parented on slice 06. Pushed. **Slice 08** — `ship/v0.2-akita-08-i18n-messages` at **`6a810df8a`**,
330 files, +8,986 / −0, parented on slice 07. Local and unpushed; PR 8 opens at 151-16 per D-07.

**PR [#869](https://github.com/OpenVAA/voting-advice-application/pull/869)** (slice 06 →
`ship/v0.2-akita-05-e2e-tests`) and **PR [#870](https://github.com/OpenVAA/voting-advice-application/pull/870)**
(slice 07 → `ship/v0.2-akita-06-frontend-lib`). Both conditions D-07 requires were satisfied inside
this plan: PR 6 could open because slice 07 was swept, PR 7 because slice 08 was.

**24 terminal disposition cells** — `cells_filled` 99 → **123** of 163. Slice 07: **6 FIXED / 3 MET /
3 DEFERRED**. Slice 08: **2 FIXED / 2 MET / 2 DEFERRED / 6 NOT-SWEPT**, each of the six carrying its
mandatory reason. Counts read back *out of* the matrix by script rather than tallied by hand.

## The two results only an exhaustive check could produce

### Accessibility over the 31 routes no gate reaches

36 page routes changed. `assertAxeScan` reaches **5** distinct URLs. So **31 routes** — every
candidate-app route (18), every admin route (5), and 8 voter routes including `questions/[questionId]`,
the page a voter spends most of the journey on — are examined by no automated gate at all.

All 31 are named path by path in `151-DISPOSITION.md` with an individual verdict, and nine defect
classes were applied to every one of them. **Publishing the per-class totals is what makes 30 `MET`
verdicts checkable rather than assertable:**

| Class the axe scan would have caught | Occurrences across the 31 |
| --- | ---: |
| non-semantic element carrying a click/key handler | **0** |
| positive `tabindex` | **0** |
| `<img>` without `alt` | **0** (no `<img>` in the route layer at all) |
| `autofocus` · `aria-hidden` on a focusable element · anchor with no text | **0 · 0 · 0** |
| `title` as an element's only accessible name · inline `display:none` on a focusable element | **0 · 0** |
| **heading-level skip** | **2 — found and FIXED** |

**The two skips are the whole argument for doing this by hand.**
`results/[[electionTab]]/statistics/+page.svelte` went `<h1>` → `<h4>` at two sites — an axe
`heading-order` failure and a WCAG 1.3.1 defect — on a route the scan never visits, so nothing would
ever have reported it.

Also recorded, because it is the caveat as much as the explanation: **30 of the 31 render through
`MainContent`/`SingleCardContent`**, the shell components in this same slice, which supply the
`<h1 tabindex="-1">` and the `[data-focus-on-nav]` focus target. The route-level surface is thin *by
construction*, and the app's real a11y structure lives in the shell — which is in this slice and was
swept by line: the skip link and its rationale'd `a11y_positive_tabindex` suppression, the `<main>`
landmark, the menu button's `aria-expanded`/`aria-controls`, the always-present `aria-live` route
announcer, and the `afterNavigate` focus reset.

### Locale key parity, measured twice and in two different senses

| Measurement | Value |
| --- | --- |
| locales on disk vs declared in `project.inlang/settings.json` | **7 = 7** |
| files per locale, and the union of file names across all 7 | **47 = 47** |
| files in `pathPattern` vs files on disk | **47 = 47**, symmetric difference **0 both ways** |
| keys per locale, fully qualified | **598** in every one of the 7 |
| union / intersection / **symmetric difference** | 598 / 598 / **0** |

**No key is present in one locale and missing in another.** But parity of *keys* is not parity of
*signatures*, and the second measurement is what found the defect: placeholder-set parity across all
598 keys, **recursing into the 147 plural/selector bodies** — a check that skipped those arrays would
have reported clean and been wrong. It found 2 divergences, both in `sv`; one is fixed and one is
deferred with its reason.

## The finding a prior scan had missed, and why

151-14 scanned this slice from next door and reported **41 destructure sites, 1 violation**. Re-run
here over the same tree it is **84 sites, 2 violations**. The gap is this phase's recurring failure
mode — an artifact that is self-consistent and incomplete: that scan matched `get*Context()` call
sites, and the second violation destructures from **`initAppContext()`**, which is not one of those.

**F-73** — `routes/+layout.svelte:48-57` destructured `appSettings` out of the app-context
initialiser, whose own declaration reads *"MUST be read off `ctx` (never destructured)"*
(`appContext.type.ts:54-61`). The root layout is the highest-traffic component in the app.

**F-61**, routed here by 151-14, is confirmed and fixed: `results/[[electionTab]]/+layout.svelte`
destructured `appSettings` and `dataRoot` above a comment asserting that was correct — true before the
v2.13 handle flatten, false after. `{#if dataRoot.elections.length > 1}` never re-evaluated when
election data arrived after mount. **The stale comment was rewritten too**; a comment asserting the
wrong rule is how this survived four phases.

**F-62 was disproved rather than fixed.** Both `$derived(ctx.dataRoot)` aliases were read line by line
instead of accepted on 151-14's word: each is used only inside an async function, after an `await`,
outside any tracking scope, with the surrounding docblock saying that is deliberate. Left alone —
"fixing" a non-bug would have made the record less trustworthy, not more. The **17 other `dataRoot`
consumers are the control set**, and they are what makes F-61 legible as a defect rather than a style
preference: every one reads through the context inside its tracking scope and says so.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] F-61 + F-73: two bare reactive accessors destructured** — described above.
Commit **`f91356687`**. Covering tests named rather than claimed:
`cold-entry-dataroot.spec.ts` is the negative control for exactly F-61's staleness class but **has no
`/results` case**, so it covers the class and not the site — and the warm walk that does reach
`/results` **masks** the bug by that spec's own account; `voter-prefs-tracking.spec.ts` is a
**regression guard** for F-73's fix rather than a detector of the bug, because its seed sets the
analytics platform before mount. **Neither was run.** Both deferred to 151-18 under D-24.

**2. [Rule 2 — Missing security control] F-67: unvalidated post-login redirect on both login actions**

- **Issue:** both login form actions read a caller-controlled `redirectTo` (from `?redirectTo=` via
  `page.url.searchParams`, posted back in a hidden field) and interpolated it into
  `redirect(303, \`/${locale}/${redirectTo}\`)`.
- **Measured before deciding, because the interesting part is what made it safe:** the leading
  `/{locale}/` stops the value from ever starting the string, so it cannot form `//host` or `scheme:`,
  and `currentLocale` cannot be empty (paraglide's strategy terminates in `baseLocale`). Real
  containment — but incidental, and no barrier to steering a just-authenticated user to an arbitrary
  in-origin path.
- **Two facts set the bar:** the voter half of the *same slice* validates its analogous `?next=`
  against an allowlist **twice**, with a comment naming defence in depth; and the app has exactly
  **one** producer of `?redirectTo=` (`hooks.server.ts:76`, candidate `(protected)` bounces) — nothing
  produces one for the admin login page at all.
- **Fix:** `routes/loginRedirectTarget.ts`, shared by both actions rather than copied, fail-safe by
  construction (a rejected value takes the existing no-`redirectTo` branch).
- **Verification, recorded because no test covers this path in either direction:** the predicate was
  exercised over 14 accept cases, 20 hostile ones (`//evil.com`, `https://evil.com`, `..`,
  `candidate/../admin`, `\\evil.com`, `javascript:`, percent-encoded and CRLF forms) and the four
  values `hooks.server.ts:75-76` actually produces, reproduced from its own two lines. All 38 as
  expected.
- **Commit:** `271f3f8e4`

**3. [Rule 1 — Bug] F-68: 19 debug `console.*` in the two admin form actions**

The **route half** of the defect 151-14 fixed as F-53 in the library half of the same two features.
Worse than what was fixed: three statements existed only to print `typeof jobInfo` and
`Object.keys(jobInfo)`; a block commented `// DEBUG:` awaited `dataWriter.getJobProgress()` —
**an extra network round-trip on every admin job start** whose sole consumer was the next line's log
(verified a pure read, nothing downstream using the result); and `[question-info] parsed form` logged
`customInstructions` and `questionContext`, **admin-authored free-text LLM prompt content**, at INFO
level on every submit. Both catch blocks moved onto the project's DEV-only `logDebugError`.
`console.*` under `routes/admin/` is now **0**. **Complement named rather than netted:** 12
`console.error` calls remain in `api/**/+server.ts` catches and `hooks.server.ts:86` — genuine server
error paths with no server logger in the project, deliberately left. Commit **`a82af4c38`**.

**4. [Rule 1 — Bug] F-71: `h1` → `h4` heading skip on an unscanned route**

Fixed rather than deferred because both halves were verifiable. **Correct level:**
`Expander.svelte:156-157` renders its title in a plain `<div>` with no heading role, so the page's real
heading tree is the `<h1>` and then these two — h2 is their true level, not a number chosen to satisfy
a linter. **No rendered change:** `app.css` styles headings in `@layer base`, so the `text-base`
utility overrides size and leaves weight identical. **No baseline exposure:** checked first — the
visual chain covers `/results` and `CandAppPreview` only, and no spec or fixture references the
statistics route at all. Commit **`f7076dbfe`**; 0 baselines regenerated.

**5. [Rule 1 — Bug] F-69: the Swedish video countdown had the wrong input names**

`sv/components.json` declared `input minuter` / `input sekunder` where all six other locales declare
`minutes` / `seconds`, so the Swedish variant had a different callable signature and could not receive
what callers pass. `t()` returns the **key string** on a throw or miss, so the user-visible failure is
a raw identifier — the exact defect the E2E raw-key scan exists to catch and one it would never see
(its only call site is inside `assertAxeScan`, and none of those 5 URLs renders a video countdown).
Only the four declarations, two selector names and two interpolations were renamed; **the Swedish text
is untouched**, so this is not a translation decision. **Severity stated rather than inflated: the key
has zero call sites repo-wide**, so nothing renders it today; and the defect is **inherited** — the
pre-Paraglide ICU catalogue carries the same names. Commit **`3efe68d30`**.

**6. [Rule 2 — Missing documentation] F-70 + F-72: two READMEs**

`src/routes/README.md` enumerated the route tree as three bullets and **omitted the two trees this
slice adds** — `admin/` and `api/`, **22 of the slice's 114 files**, i.e. the entire server-side API
surface and the entire admin app, missing from the one file whose job is to say where routes live. It
is also the only documentation *inside* the slice. Fixed in **`bc1963610`**, which also names the seven
non-route shell files, because `Layout.svelte`/`MainContent.svelte` carry the app's a11y structure and
that is where an accessibility reviewer should start. Its existing claim about the reroute hook was
**checked, not assumed** (`hooks.ts:5-7`); accurate, left as written.

`apps/frontend/messages/README.md` created in **`75c10cb8f`** — the 329-file slice had no documentation
of its own anywhere. Item 6 asks whether new entities are documented, and for a catalogue the entity is
the **contract**: key parity, `pathPattern` correspondence, placeholders-are-signatures (which is
F-69), placeholder-set equality, the HTML/heading constraint, the plural form. **The embedded parity
script was executed as written before being committed** — a documented check nobody has run is the
same class of defect as the comments this plan's first commit repaired.

**7. [Rule 1 — Bug] 28 comments the hygiene codemod left broken**

Found with the old/new diff-pair method over all three hygiene commits restricted to this pathspec
(**57 files, ~250 comment lines rewritten by the codemod**), not by grepping for damage signatures,
which under-report because the shape depends on the original wording. Nine were the same fragment with
no verb; three had lost the subject a preposition governed (`per CONTEXT.`, `per -01 small-fix
constraint`); one had had the call parens stripped off `popupStore()` one clause before "returns an
object literal"; three were in one docblock; five were parentheticals naming nothing; four were
citations standing where the subject used to be. **`params/etPl.ts:3` had been broken by the stage-2
repair pass itself** while its untouched sibling still parsed. Commit **`d0c63af0d`**.

### Deferred, each with its reason and its route

- **F-74 → 151-18.** The two login form actions are substantially the same action — normalise the app
  name and they differ only in a role list, a route constant and comment wording, including a
  **verbatim-duplicated hand-rolled JWT payload decode**, which is the security-relevant half.
  Extraction is code restructuring (D-13) and a behaviour change on an auth path with no coverage
  either way. Not a finding, and stated as such: the allowlist regex's two copies are *intentional* and
  both comments say the second is a defence-in-depth re-check.
- **F-75 → 151-18 / post-merge.** `Expander`'s title is a plain `<div>` with no heading role and its
  only control is a checkbox named by the generic `common.expandOrCollapse`, so a screen-reader user is
  not told which question. **Slice 06, published as PR #869** — fixing it means force-pushing a PR
  under review. The F-63 situation again.
- **`questions.intro.start` (sv).** Live (the questions-intro CTA) but the remedy is Swedish copy, a
  publisher decision.
- **F-76 → 151-19.** A **fourth** F-44 gate blind spot, confirmed live for the first time: a phase
  reference broken across a line (`params/etSg.ts:3-4`) is invisible to `phase-ref`, which needs
  keyword and digits on one line. **Left in place deliberately** — it is grammatical as it stands and
  neither repair is count-neutral (collapsing it adds an `occ` if `see`-prefixed, a `bare` if not).
- **Ten bare `88-02` plan identifiers, recorded not stripped.** Unlike 151-13's pure `122-05`
  citations, these sit inside prose distinguishing two design generations of the same route ("the
  post-88-02 loop fix"); removing them costs meaning. Four `Plan 02` citations *were* removed as part
  of the comment repair, gate-neutrally.
- **Item 15 on both slices** inherits F-64 (117 `apps/docs/` files, slice 09, 151-16), with two
  specifics added: the routing guide describes neither the `admin/` app nor the `api/` tree, and its
  prose predates the locale-segment removal that is slice 07's defining change.

## Verification

### Gates — every one matched to the baseline

| Gate | Baseline | Measured | Verdict |
| --- | --- | --- | --- |
| `yarn build` (`TURBO_FORCE=1`) | 14/14 | **14/14** | unchanged |
| `yarn test:unit` (`TURBO_FORCE=1`) | 1522 / 149 files | **1522 / 149** | unchanged |
| `yarn lint:check` (`TURBO_FORCE=1`) | 0 errors / 20 warnings | **0 / 20** (core 2, dev-seed 15, frontend 1, tests 2) | unchanged |
| `yarn format:check` | RED on exactly 2 PD-03-fenced files | **RED on exactly 2** | unchanged |
| `hygiene-grep-report.sh --assert-clean` | exit 1; `task-id` 84, `phase-ref` bare 11 | **exit 1, every column identical** | unchanged |

**`yarn format` was NOT run.** Two files were reformatted individually by path — the root layout (the
reactivity fix changed a line's width) and the new README (emphasis markers) — because the
*cardinality* of `format:check`'s red set is what PD-03 fences. Every other edited file was
`prettier --check`ed individually. **F-39 honoured: the lint warning count was not reduced.**
`yarn db:lint:sql` deliberately not run — it exits 1 on a correct tree pending F-21 and nothing here
touches SQL. **Snapshot check: `-snapshots` and `__screenshots__` each matched 0 times.**

### The drift this plan caught in its own work

**Two comments it wrote added three `see phase N`, one `see spike N` and one `v2.13`, moving the
hygiene report's UNGATED columns from 660/40/43 to 663/41/44 while the gated `bare` columns held at
11/0.** So `--assert-clean` would have gone on reporting exactly the two operator-approved rows and the
drift would have shipped unnoticed — which is precisely why the standing check is on `occ` and not only
on `bare`. Corrected in **`33e616758`**; the citations were redundant anyway. Final state
byte-identical to the pre-plan baseline.

### The partition safety check — gap 0, identity MATCH

252 + 97 + 119 + 162 + 195 + 533 + 214 + 330 + 2,394 = **4,296** = comparable total. **Gap: 0.** The
rise from 151-14's 4,292 is **+4, every one named** by set difference with **zero files leaving**:
`151-14-SUMMARY.md` and `pr-bodies/05.md` (committed after 151-14's own measurement, riding slice 11),
plus this plan's `loginRedirectTarget.ts` and `messages/README.md`. Predicted remainder
2,934 − 213 − 329 + 2 = **2,394**, the measured value; deviation **0.000%**. A second, independent
decomposition closes without the catch-all: 39 + 37 + 2,318 = **2,394**, with slices 09 and 10
unchanged **file for file** from the dry run. Partial-stack identity: the nine cut slices plus the
catch-all produce tree **`10ef4af4f`** = `TARGET^{tree}`. **MATCH**, measured twice.

**Both slices' dropped-finding class is EMPTY, proven two independent ways** — set difference over
tracked-vs-in-diff (114 − 114 = 0; 330 − 330 = 0) and a per-file blob comparison across the layout move
(0 identical). **Slice 07 is the first slice in the stack whose diff is its whole review surface.**

### The published numbers disagreed with the measured ones, and the reconciliation is in both bodies

GitHub reported **528 files** for PR #869 against a measured 533, and **165** for #870 against 214.
Caught by comparing the published result against the measurement rather than trusting either. Cause,
reproduced locally to the digit before either body was edited: **rename detection** — `git show -M`
returns exactly `528 / 22550 / 8179` and `165 / 7593 / 5542`, with 5 and 49 `R` entries. For slice 07
the gap is *favourable*: 49 of the 97 delocalised route files render as readable renames instead of 98
delete-plus-add halves. **Both live bodies were edited to carry both numbers and reconcile them** before
any review arrived, and neither number changes a conclusion (#869 over both budgets on either measure,
#870 inside both on either). A standing instruction for 151-16/151-17 is recorded in the manifest.

### Publishing invariants — asserted, not assumed

`git ls-remote --heads origin 'ship/*'` → exactly **8**. `origin/main` unmoved at `ac30f132a`. PR
**#860 untouched** (`updatedAt` still `2026-05-19T12:08:25Z`).
`gh pr list --head ship/v0.2-akita-08-i18n-messages` → **0** and no remote ref for it, so D-07's lag
held. `gh pr checks` on both new PRs → *"no checks reported"*. Both pushes were dry-run first and each
reported `[new branch]`; **no force-push anywhere**, no `git clean`, no `git stash`, worktree clean
throughout, `HEAD` never left `feat-gsd-roadmap`. **The CI failure signature was re-verified against
run `32017478048` before publishing**: step 3 `Setup Yarn 4.6` — failure, step 5 `Install all
dependencies` — skipped; `main.yaml` at 01a's tip is blob `c2fdcedb2`, defining exactly three jobs, so
Pitfall 7 stays refuted.

**Slice 08 was re-cut** after its own item-6 fix landed, on the unchanged and already-pushed slice-07
commit. **The assertion that slice 07 needed no re-cut was made before the rebuild, not after:**
`diff --no-renames` between the pushed slice-07 tip and the new target, restricted to slice 07's
pathspec, returns **0 files**. Second time in the phase that D-07's lag has been paid rather than
collected on.

### What was NOT verified — stated, because the alternative is a claim

**The 43 E2E specs were not run.** No dev server on `:5173`, no seeded local Supabase. Per `CLAUDE.md`
a did-not-run E2E test counts as a failure, so **this plan claims two statically swept slices, not
green ones** — and that matters more here than in most slices, because two of the six fixes are
reactivity fixes and reactivity is what an E2E test is uniquely able to catch. Both covering specs are
named with what they do and do not cover, and both are deferred to 151-18 under D-24.

**No contrast ratio was measured and no rendered output inspected** — the accessibility sweep over the
31 unscanned routes is structural. **No keyboard interaction was exercised**; one keyboard path (the
drawer) was traced by hand and is correct, but one path read carefully is not a gate, which is why item
14 is DEFERRED on both slices rather than MET.

**No test was skipped and no baseline regenerated.**

## A structural finding for the operator's F-15 decision at 151-16

`apps/frontend/tools/` (3 files) is claimed by **no slice's pathspec** — asserted by running all eleven
rows of `slices.tsv` against it, every one returning 0 — **and** is byte-identical across the layout
move, so it is in no slice's diff either. One of those three files,
`tools/translationKey/generateTranslationKeyType.ts`, generates the compile-time key union that is
**slice 08's only automated gate**, and it reads its key list from the *legacy* ICU catalogue in slice
06 rather than from `messages/`, from one locale's filenames. The two agree exactly today — union
**598**, catalogue **598**, symmetric difference **0 in both directions** — and nothing enforces that;
the failure is asymmetric, because a key added to the legacy tree alone is *typed* while Paraglide
cannot resolve it, so `t()` renders the key to a user. **F-15's structural question stays the
operator's at 151-16 and was not acted on here.** This is recorded so that decision has a concrete,
load-bearing example in front of it rather than a count of 120 files.

## For the next plans

- **151-16** (slices 09 + 10) — **PR 8 opens there.** Slice 09 carries **F-64** (272 permalinks across
  117 files, generator included) plus the two routing-guide specifics named above; slice 10 carries
  F-59's eslint-config fix in its diff and the standing `pr-bodies/11.md` instruction about slice 10's
  three contested files. **Every PR body from here on must state both the rename-aware and the
  `--no-renames` counts and reconcile them.** Run F-44's patterns over your own slices — the gate will
  not, and a fourth blind spot is now confirmed.
- **151-17** — the both-numbers instruction matters most for slice 11, where rename detection will move
  the number substantially.
- **151-18** — two reactivity fixes whose covering specs are **named but unrun**; extending
  `cold-entry-dataroot.spec.ts` with a cold `/results/...` case is the covering case for F-61. F-74
  (login duplication) and F-75 (blocked by PR #869) are yours, alongside F-24, F-21, F-29, F-30, F-36
  and F-60.
- **151-19** — F-76 joins F-44's three blind spots as gate-design work.

## Self-Check: PASSED

Files asserted present: `151-15-SUMMARY.md`, `pr-bodies/06.md`, `pr-bodies/07.md`,
`151-DISPOSITION.md`, `151-STACK-MANIFEST.md`, `apps/frontend/src/routes/loginRedirectTarget.ts`,
`apps/frontend/messages/README.md` — all FOUND. Commits asserted reachable: `d0c63af0d`,
`f91356687`, `271f3f8e4`, `a82af4c38`, `3efe68d30`, `bc1963610`, `33e616758`, `e0b354e84`,
`f7076dbfe`, `75c10cb8f`, `9a7712d26`, `d66defc9a`, and the slice commits `342926b93` and
`6a810df8a` — all FOUND. Branch `ship/v0.2-akita-07-frontend-routes` at `342926b93` with
`^ == 8c613634b`; `ship/v0.2-akita-08-i18n-messages` at `6a810df8a` with `^ == 342926b93`. PRs #869
and #870 OPEN at the expected bases. Both YAML frontmatter blocks in this plan's edited records parse
with `yaml.safe_load`. Worktree clean.
