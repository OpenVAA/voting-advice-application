# Phase 138 — DEF-135-04 / EPERM-07 Diagnosis Record

The phase's single diagnostic record: the U-1 evidence-recovery verdict, the live hypothesis ledger
that plans 02 and 03 update as discriminators land, and (from plan 03) the named root cause.

**Opened:** 2026-08-13 (plan 01, task 1)
**Requirement:** INTEG-01 — the intermittent EPERM-07 term-trigger failure is diagnosed to a **named
root cause**, not merely stopped from reproducing.
**Defect of record:** `.planning/milestones/v2.14-phases/135-close-phase-134-coverage-carry-overs/deferred-items.md:164-223`
(DEF-135-04, `**Status:** OPEN`).

---

## U-1 — did the soft heading assertion at voter-journey.spec.ts:858 also fail?

**The question.** The single recorded DEF-135-04 occurrence quotes a hard failure at
`voter-journey.spec.ts:862` (`expect(termTrigger.first()).toBeVisible()`). Immediately above it, at
line 858, sits a **soft** assertion on the same hop:

```ts
      // Settle on Base-3 by its heading.
      const questionHeading = page.getByTestId(testIds.voter.questions.heading);
      await expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion3Likert7, { timeout: TIMEOUTS.element });
```
`[VERIFIED: tests/tests/specs/voter/voter-journey.spec.ts:856-858, read 2026-08-13]`

Whether that soft assertion **also** reported a failure in the same run is the cheapest available
discriminator between the three hypotheses (RESEARCH §R1.8, §Unverified U-1): a stale or absent
Base-2 DOM predicts a concurrent failure at 858, whereas a correctly-arrived Base-3 heading with a
missing trigger predicts a pass at 858. One quoted fact would eliminate either two hypotheses or one.

### Search set and per-location result

Every location enumerated by the plan was searched, and every result is recorded — including the
absences.

| # | Location | Searched at (UTC) | Result |
|---|---|---|---|
| 1 | `tests/playwright-report/` (on disk) | 2026-08-13T14:44Z | **ABSENT — overwritten.** Directory mtime `2026-08-13T15:13:27Z` (local clock), i.e. **two days after** the 2026-08-11 occurrence. Contents are the last invocation, an 8-test bank-auth run: `grep -c "voter-journey" tests/playwright-report/index.html` → `0`, `grep -c "Base opinion 3" …/index.html` → `0`. The original run's report is not in it. |
| 2 | `tests/playwright-results/` (on disk) | 2026-08-13T14:44Z | **ABSENT — overwritten.** Same mtime. `.last-run.json` is `{"status":"passed","failedTests":[]}`; the ten per-test result dirs present are six `candidate-bank-auth-*` plus `data-setup-base` / `data-teardown-base`. No `voter-journey` result dir, no trace from the failing run. |
| 3 | Every file under `.planning/milestones/v2.14-phases/135-close-phase-134-coverage-carry-overs/` (10 files: `135-01..04-PLAN/SUMMARY`, `135-VERIFICATION.md`, `deferred-items.md`) | 2026-08-13T14:44Z | **PARTIAL — the occurrence is recorded; the line-858 outcome is not.** `deferred-items.md:181-198` quotes the `toBeVisible` error block and the post-failure page snapshot, and nothing else from that run's error list. Grepping the whole directory for `baseOpinion3Likert7` / `Base opinion 3 — Likert 7` returns exactly one hit — the page-snapshot YAML at `deferred-items.md:194` — which is DOM evidence, not assertion-outcome evidence. The `toHaveText` hits in `135-02-SUMMARY.md:128-151` are the unrelated `SELECT_EXACT_ONE_EN` negative control. |
| 4 | `.planning/debug/` (7 entries incl. `voter-journey-vt-regression.md`, `residual-e2e-flakes-postperm.md`) | 2026-08-13T14:44Z | **ABSENT.** `grep -rln "voter-questions-term-trigger\|EPERM-07" .planning/debug/` → no matches. No pasted report from that run. |
| 5 | `.planning/spikes/` (24 spike dirs + 4 top-level docs) | 2026-08-13T14:44Z | **ABSENT.** Same grep → no matches. |
| 6 | `git log --all -S 'voter-questions-term-trigger' -- '*deferred-items.md'` | 2026-08-13T14:45Z | **PARTIAL — one commit, no extra evidence.** `ea9af6b52 docs(135-02): complete selectExact standing-guard plan` — the commit that first wrote the DEF-135-04 entry. Its added text is the same text present today; no superseded, fuller version of the observation exists in history. |
| 7 | `git log --all --diff-filter=A --name-only` for any transient artifact added and later removed (`playwright-report*`, `playwright-results*`, `*trace*.zip`, `results.json`, `test-results`) | 2026-08-13T14:45Z | **ABSENT for this occurrence.** The repo *does* have the precedent of committing a run's JSON report into a phase directory (`.planning/phases/59-…/baseline/playwright-report.json`, `…/64-…/post-fix/playwright-report.attempt-3.json`, `…/79-…/post-fix/rca-traces/trace-run-*.zip`), so the search was worthwhile — but no such artifact was ever added for Phase 135. Every file ever added under a 135 phase directory is the ten planning documents listed in row 3, and `git log --all --diff-filter=A --name-only \| grep -iE 'v2\.14.*(report\|results\|trace)'` returns nothing. |
| 8 | Shell history on this host (`~/.zsh_history` 1111 lines, `~/.bash_history` 500 lines) | 2026-08-13T14:45Z | **ABSENT, and structurally incapable of carrying the answer.** History records **commands only, never stdout**. The recorded E2E invocations from that period are bare (`yarn test:e2e`, `yarn db:reset && yarn test:e2e`, `yarn test:e2e --project=candidate-journey --reporter=list`) — none redirects reporter output to a file, and no machine-readable reporter was configured at the time (`tests/playwright.config.ts:120` was html-only until this phase). There is no artifact for history to point at. |

### Verdict — UNRECOVERABLE

**The line-858 outcome for the DEF-135-04 occurrence cannot be recovered from the record.** All eight
locations were searched and none holds the original run's error list. The two on-disk Playwright
artifact directories were overwritten on 2026-08-13, two days after the 2026-08-11 occurrence; no
report, trace, or JSON was ever committed for that run; and shell history cannot carry stdout.

**Consequence: all three hypotheses (H1, H2, H3) remain live.** U-1 eliminates none of them, and the
discrimination it would have provided for free must now be bought by the forced reproduction in plans
02 and 03 — the tri-state probe (RESEARCH §R2.4-C) recovers exactly the same information from a
*reproduced* failure.

**Inference from the surviving error text is forbidden, and this document does not perform it.** The
temptation is to read `deferred-items.md:181-198` — which quotes one error block and no other — as
showing that line 858 reported nothing. That reading is invalid for a stated reason: the quoted block
is an **excerpt selected by a human writer** while filing a deferred item, not a verbatim reproduction
of Playwright's complete error list for the test. Playwright reports soft-assertion failures alongside
the hard failure at test end, so a soft failure at 858 could have existed in the run output and simply
not been carried into the deferred-item write-up. Absence from an excerpt is not absence from the run.
No sentence in this section asserts the line-858 outcome without a quoted source, because no source
for it exists.

**Standing note for the rest of the phase.** D-08 promotes line 858 from `expect.soft` to `expect`
(plan 03's scope, per RESEARCH §R6). After that promotion this question is answerable for free on any
future occurrence: a mis-arrival at Base-3 fails at 858 with the heading text in the message, instead
of surfacing two lines later at the term check. The forensic capture landed by this plan (video,
console transcript, failed-request transcript, dev-server log) closes the same gap for artifacts —
the next occurrence is data, which is exactly waiver condition 3.

---

## Hypothesis ledger

Seeded from RESEARCH §R1.8 as of 2026-08-13. Plans 02 and 03 update `Status` and `Evidence` in place
as discriminators are run. A hypothesis leaves `live` only with quoted evidence in the `Evidence`
column.

| ID | Mechanism (file:line) | Status | Discriminator | Evidence |
|---|---|---|---|---|
| H1 | **View-Transition snapshot capture stalls the DOM swap while the URL has already advanced.** SvelteKit pushes the new URL at `node_modules/@sveltejs/kit/src/runtime/client/client.js:1760`, awaits the `onNavigate` callbacks at `client.js:1779-1785`, and only swaps the DOM at `client.js:1824`. The app holds that await open: `apps/frontend/src/routes/+layout.svelte:161-172` returns a Promise resolved *inside* `document.startViewTransition`'s update callback, i.e. after Chrome has captured the outgoing snapshot. Base-2 carries no `customData.terms` (`packages/dev-seed/src/templates/e2e/base.ts:828-838`), so a stale Base-2 DOM has zero term triggers — the recorded `element(s) not found`. | live | (A) `page.emulateMedia({ reducedMotion: 'reduce' })` — the app's own gate short-circuits on that query at `apps/frontend/src/lib/utils/viewTransition.ts:28`, so a forced failure that disappears under A and returns without it names the transition layer with zero app change. (B) CDP `Emulation.setCPUThrottlingRate` amplifies snapshot cost. (C) tri-state: `headingCount === 1` **and** `headingText` contains `Base opinion 2` **and** `triggerCount === 0`. | Pending — plan 02. U-1 unrecoverable, so H1 is neither supported nor eliminated by the original occurrence. Corroborated only indirectly, by in-repo prior art: `tests/tests/specs/a11y/a11y-smoke.spec.ts:570-574, 672-678` already drives Q→Q with `?notr=1` so assertions "never race the cross-fade" — a mitigation `voter-journey.spec.ts` never received. |
| H2 | **The render gate at `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:257-258` transiently closes.** If `voterCtx.opinionQuestions` or `selectedQuestionBlocks` is momentarily empty during the hop, the whole question block unmounts, taking the heading and the trigger with it. | live | (C) tri-state: `headingCount === 0`. Selected on the count, never on a thrown locator error — an absent heading must read as `0`, not as an exception. | Pending — plan 02. |
| H3 | **`customData.terms` arrives after the heading text.** `QuestionHeading.svelte:60-61` computes `customData = $derived(getCustomData(question))` then `titleParts = $derived(addTermsToTitle(customData.terms))`; with `terms === undefined` the plain-text branch renders (`QuestionHeading.svelte:95-100`) — correct heading, no `<button>` child. Additionally requires a `DataRoot.update()` between the two reads, since `getCustomData` is a pure read (`packages/app-shared/src/data/getCustomData.ts:6`) — see U-2. | live | (C) tri-state: `headingText` contains `Base opinion 3` **and** `triggerCount === 0`. This is the only hypothesis under which D-05's app-side-fix clause fires as written. | Pending — plan 02. |

**Heading identity is decided by ASCII substring** on `Base opinion 2` / `Base opinion 3`, never by
whole-string equality against the seeded title — the seeded name is
`'[qu-opin-base-3-likert7] Base opinion 3 — Likert 7.'` with a U+2014 em dash and is expanded across
four locales, and neither may be allowed to change a verdict. The term trigger is matched by **exact
`data-testid` string equality** (`voter-questions-term-trigger`, `tests/tests/utils/testIds.ts:243`),
never by rendered text.

---

## Already eliminated — do not re-test

| Hypothesis | Status | Grounds |
|---|---|---|
| Cold-start Vite module compilation (the route module transform at `client.js:1642` being slow on the first navigation after a dev-server restart) | **ELIMINATED** — do not re-test | `deferred-items.md:209-215`, verbatim: *"The initial hypothesis was cold-start Vite module compilation (the run was the first after a dev-server restart). That hypothesis was TESTED and NOT confirmed: three subsequent runs, each also the first after a dev-server restart (the two negative-control runs and the post-restore run), all passed this step. Two full-suite runs also passed it."* Reinforced by `deferred-items.md:170-177` (the Plan 04 gate update: three further full-suite runs, each on a cold Vite cache, each passing). **Citation note:** RESEARCH §R1.8 and `138-01-PLAN.md` cite this passage as `deferred-items.md:203-210`; in the archived copy at `.planning/milestones/v2.14-phases/135-close-phase-134-coverage-carry-overs/deferred-items.md` it sits at **209-215**. Same text, six lines lower — the archive path is the one to quote. |

Note the scope of the elimination precisely: it retires **B3** (route-module load, `client.js:1642`)
as the mechanism. It does **not** transfer to **B5** (the awaited `onNavigate` / snapshot-capture
window, `client.js:1779-1785`), which is a different boundary on the same path and is H1's mechanism.

---

## Named root cause

PENDING — plan 03 writes this section.
