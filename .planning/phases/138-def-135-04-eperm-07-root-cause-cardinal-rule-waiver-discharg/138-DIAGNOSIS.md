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
| H1 | **View-Transition snapshot capture stalls the DOM swap while the URL has already advanced.** SvelteKit pushes the new URL at `node_modules/@sveltejs/kit/src/runtime/client/client.js:1760`, awaits the `onNavigate` callbacks at `client.js:1779-1785`, and only swaps the DOM at `client.js:1824`. The app holds that await open: `apps/frontend/src/routes/+layout.svelte:161-172` returns a Promise resolved *inside* `document.startViewTransition`'s update callback, i.e. after Chrome has captured the outgoing snapshot. Base-2 carries no `customData.terms` (`packages/dev-seed/src/templates/e2e/base.ts:828-838`), so a stale Base-2 DOM has zero term triggers — the recorded `element(s) not found`. | **eliminated at this lever** (plan 02 task 3, 2026-08-13) | (A) `page.emulateMedia({ reducedMotion: 'reduce' })` — the app's own gate short-circuits on that query at `apps/frontend/src/lib/utils/viewTransition.ts:28`, so a forced failure that disappears under A and returns without it names the transition layer with zero app change. **RUN.** (B) CDP `Emulation.setCPUThrottlingRate` amplifies snapshot cost — not run; plan 03. (C) tri-state: `headingCount === 1` **and** `headingText` contains `Base opinion 2` **and** `triggerCount === 0`. | **Discriminator A, 10 vs 10 at a frozen forcing configuration — the transition is NOT necessary for the failure.** See `138-FORCED-REPRO.md` § Discriminator A — View Transition on/off. Failure-count pair: **arm A (VT on) 7/10, arm B (VT off) 9/10** — comparable rates (Fisher exact p ≈ 0.58), identical `element(s) not found` error text in both arms. What the arms DID change is the *shape* of the intermediate state, with zero overlap: arm A 10/10 H1-shaped (stale Base-2 DOM live), arm B 10/10 `headingCount: 0, headingText: null`. So the transition governs what the DOM looks like inside the window, not whether the window exists; the window is created upstream by the router's URL-push-before-DOM-swap ordering (`client.js:1760` vs `client.js:1824`). Corollary: the in-repo prior art that motivated H1 — `tests/tests/specs/a11y/a11y-smoke.spec.ts:570-574, 672-678` driving Q→Q with `?notr=1` so assertions "never race the cross-fade" — would NOT have prevented this failure; `?notr=1` is the sibling short-circuit in the same gate (`viewTransition.ts:29`) and lands the run in arm B. Earlier plan-01 near-miss reading retained below under § First instrument readings. |
| H2 | **The render gate at `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:257-258` transiently closes.** If `voterCtx.opinionQuestions` or `selectedQuestionBlocks` is momentarily empty during the hop, the whole question block unmounts, taking the heading and the trigger with it. | **eliminated** (plan 03, 2026-08-13) | (C) tri-state: `headingCount === 0`. Selected on the count, never on a thrown locator error — an absent heading must read as `0`, not as an exception. | **STILL LIVE.** Plan 02 task 3 arm B observed `headingCount: 0, headingText: null` on 10/10 runs — superficially H2's discriminator — but it is deliberately NOT read as confirmation: under a transition-disabled navigation, `headingCount: 0` is also exactly what an ordinary mid-swap instant looks like, so it does not distinguish "the render gate transiently closed" from "the new page component has not mounted yet". Separating those was plan 03's job and it is now done, in two independent ways, both pointing the same direction. **(i) Structurally, neither gate's inputs can change during a Q→Q hop.** The outer gate reads `voterCtx.opinionQuestions`, which is assigned inside an `$effect` whose dependencies are the `DataRoot`, the selected elections and the selected constituencies (`apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:499`, the `$effect` block ending at 500); none of the three changes when only `page.params.questionId` moves, so the effect does not re-run and `#opinionQuestions` cannot transiently empty. The inner gate's `question` is a `$derived.by` performing a synchronous lookup in already-loaded data (`questions/+layout.svelte:99-110`, `voterCtx.dataRoot.getQuestion(questionId)`), and `questionBlock` is a synchronous `$derived` on top of it — neither can be transiently falsy while a valid `questionId` is in `page.params`. **(ii) Empirically, the gate's own failure path never fired.** When `question` resolves but `questionBlock` does not, the layout logs `Question with id … not found in voterCtx.selectedQuestionBlocks. Rerouting to category selection.` (`questions/+layout.svelte:119-121`) and reroutes. Plan 01's D-11 console transcript, read back from a forced failure, contains eight lines: six Vite HMR connect messages and two `answerState.setAnswer` infos. No error, no warning, no `pageerror`, no reroute log — see `138-FORCED-REPRO.md` §B.10. **What the 127 H2-shaped probes of plan 03 actually show** is the DOM swap itself in progress: `headingCount: 0` appears with the View Transition ON (which plan 02 could not observe, since its only route to a zero was to switch the transition off), it appears monotonically more often as the CPU rate rises (0/11 at rate ≤2, 3/10 at 4, 6/10 at 8, 40/40 at ≥12 — `138-FORCED-REPRO.md` §B.3), and it always resolves inside the same bounded window the rest of this phase measures. That is a mount-timing instant between the old subtree's removal and the new one's insertion at `client.js:1824`, not a data-availability gate closing. See `138-FORCED-REPRO.md` § A.5, §B.3, §B.10. |
| H3 | **`customData.terms` arrives after the heading text.** `QuestionHeading.svelte:60-61` computes `customData = $derived(getCustomData(question))` then `titleParts = $derived(addTermsToTitle(customData.terms))`; with `terms === undefined` the plain-text branch renders (`QuestionHeading.svelte:95-100`) — correct heading, no `<button>` child. Additionally requires a `DataRoot.update()` between the two reads, since `getCustomData` is a pure read (`packages/app-shared/src/data/getCustomData.ts:6`) — see U-2. | **eliminated** (plan 03, 2026-08-13) | (C) tri-state: `headingText` contains `Base opinion 3` **and** `triggerCount === 0`. This is the only hypothesis under which D-05's app-side-fix clause fires as written. | **STILL LIVE**, and not yet observed. Across all 70 runs recorded in `138-FORCED-REPRO.md` (50 sweep + 20 A/B), no run's tri-state ever showed `headingText` containing `Base opinion 3` — so H3's signature has not appeared once at this contention level. That is not an elimination: H3's window is by construction narrower than H1's/H2's (it needs the heading already swapped AND the terms not yet parsed), and a single pre-assertion probe per run cannot sample it. **Plan 03 settled it, and the settlement is structural rather than statistical.** H3's own precondition is stated in the Mechanism column: it requires `customData` on the *same* `question` object to change between two reads, which requires a `DataRoot.update()` mid-hop — RESEARCH §Unverified U-2, left open. **U-2 is now closed: `DataRoot.update(` has exactly ONE call site in the entire frontend, `apps/frontend/src/lib/admin/utils/loadElectionData.ts:56`, which is an admin utility and is not on the voter route at all** (repo-wide grep over `apps/frontend/src/lib`, 2026-08-13). No `DataRoot.update()` can fire during a voter Q→Q hop, so `question.customData` is fully materialised before the question object is ever handed to the heading, `titleParts` computes WITH `terms` on its first evaluation, and the heading text and the `<Term>` button are emitted by ONE `$derived` into ONE `{#each}` inside ONE `<h1>` (`QuestionHeading.svelte:61`, `:96-99`). They are the same render commit and cannot be separated in time. **The empirical record agrees and adds the complement.** Across **262 probes** (plan 02's 70 and plan 03's 192) there are **zero** H3-shaped observations; and on the only two occasions any probe ever observed a `Base opinion 3` heading at all, `triggerCount` was **1**, not 0 — the trigger was there with the text (`138-FORCED-REPRO.md` §C.4, §C.5). The heading text and the term trigger have never once been observed apart. **Consequence, and it is the one that answers U-1:** since 862's `element(s) not found` cannot occur while the Base-3 heading text is present, the soft heading assertion two lines above it at `voter-journey.spec.ts:858` **must also have failed** in the DEF-135-04 occurrence. U-1 could not recover that fact from artifacts; it is now derivable from the mechanism. |

**Ledger state after plan 02 (2026-08-13): H1 eliminated at the reduced-motion lever; H2 and H3
remain `live`; the hunt continues in plan 03.** An elimination NARROWS the hunt — it does not close
the phase, and it does not discharge INTEG-01, which requires a **named** root cause. What plan 02
bought is a redirection: the failure is not caused by the View-Transition layer, so plan 03 should
amplify and instrument the **router-ordering window itself** (URL pushed at `client.js:1760`, DOM
swapped at `client.js:1824`) rather than the transition that decorates it, and must observe that
ordering rather than infer it. Plan 02 also recorded that the budget lever alone cannot force the
failure deterministically (11/15 at the 100 ms floor), so plan 03's CDP amplification is now on the
critical path for criterion 2's negative-control pair, not optional.

**Ledger state after plan 03 (2026-08-13): all three hypotheses are terminal — H1, H2 and H3 all
`eliminated`. No row is left `live`.** Each carries its run counts and its evidence pointer in the
table above, and none was retired on a single observation: H1 on a 10-vs-10 A/B plus the
rate-independence measurement (`138-FORCED-REPRO.md` §B.7.3), H2 on the source structure plus 127
probes plus the absent reroute log, H3 on the closure of U-2 plus 262 probes across two plans.

**Three eliminations are not three dead ends — they converge.** Each hypothesis proposed a different
*occupant* of the same window: a stalled transition (H1), a closed render gate (H2), a late parse
(H3). Eliminating all three leaves the window itself, which is the one thing every experiment in this
phase observed and none of them removed. That is what § Named root cause names, and it is why the
section below is a mechanism rather than a fourth hypothesis.

**Heading identity is decided by ASCII substring** on `Base opinion 2` / `Base opinion 3`, never by
whole-string equality against the seeded title — the seeded name is
`'[qu-opin-base-3-likert7] Base opinion 3 — Likert 7.'` with a U+2014 em dash and is expanded across
four locales, and neither may be allowed to change a verdict. The term trigger is matched by **exact
`data-testid` string equality** (`voter-questions-term-trigger`, `tests/tests/utils/testIds.ts:243`),
never by rendered text.

---

## First instrument readings

Recorded by plan 01 task 2 the moment the hunt spec first ran. These are **near-miss** observations
from **passing** runs at **neutral** settings (no budget shrink, no CPU throttle, no reduced-motion
emulation) — logged here because the spec records the tri-state *before* the assertion precisely so a
near-miss counts as data, and because this evidence would otherwise live only in a scratch
`results.json`.

| Run | Date | Configuration | Outcome | `eperm07-state` annotation |
|---|---|---|---|---|
| 1 | 2026-08-13 | neutral (budget 2000 ms, CPU rate 1, transitions ON), dev server `FRONTEND_PORT=5273`, 1 worker | **PASS** | `{"pathname":"/questions/ecc52540-e9a4-4f22-b883-c34013534d4e","headingCount":1,"headingText":"MunicipalRegional [qg-opin-base] Base Opinion Questions 2/8 [qu-opin-base-2-likert4] Base opinion 2 — Likert 4.","triggerCount":0}` |
| 2 | 2026-08-13 | identical | **PASS** | identical tri-state |

**What this shows, stated no more strongly than it supports.** At the instant immediately after the
production URL-only settle, the URL had already advanced to the next question while the rendered
heading still read **`Base opinion 2`** and `triggerCount` was **0**. That is the exact tri-state row
RESEARCH §R2.4-C assigns to H1 (`headingCount === 1`, heading text contains `Base opinion 2`,
`triggerCount === 0`), and it excludes H2 (`headingCount` would be `0`) and H3 (heading text would
contain `Base opinion 3`) **for that instant**. The assertion nonetheless passed, because the DOM
swap landed well inside the 2000 ms budget.

**What it does NOT show.** It is not a reproduction of DEF-135-04 and not a confirmation of H1. It
establishes only that the URL-before-DOM window H1 depends on is **real, reachable and reliably
observable on this machine at production settings** — i.e. the phenomenon is not hypothetical, and
the question that remains is what widens that window past 2000 ms in roughly 1 run in 8. Forcing that
widening, and running the criterion-2 negative-control pair, is plans 02–04's work. H1 stays `live`.

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

Written by plan 03 (2026-08-13) from the evidence in `138-FORCED-REPRO.md` § 3, § Discriminator A,
§ Discriminator B and § Contention. Every quantitative claim below cites the section that produced it.

### The mechanism

**DEF-135-04 is an ordering defect, not an element defect. The destination URL is committed to
browser history before the destination DOM is committed to the page, and the walk's navigation settle
waits on the URL — so the settle can release while the previous question is still rendered, and every
assertion made after it races a DOM swap that has not happened yet.** Named as an ordering, with each
link read from the tree and quoted:

1. **SvelteKit commits the URL.** `@sveltejs/kit` 2.55.0, `node_modules/@sveltejs/kit/src/runtime/client/client.js:1759-1760`, verbatim:

   ```js
   		const fn = replace_state ? history.replaceState : history.pushState;
   		fn.call(history, entry, '', url);
   ```

2. **SvelteKit then awaits the `onNavigate` callbacks** — `client.js:1779-1785`, verbatim:

   ```js
   		const after_navigate = (
   			await Promise.all(
   				// eslint-disable-next-line @typescript-eslint/await-thenable -- we need to await because they can be asynchronous
   				Array.from(on_navigate_callbacks, (fn) =>
   					fn(/** @type {import('@sveltejs/kit').OnNavigate} */ (nav.navigation))
   				)
   			)
   		).filter(/** @returns {value is () => void} */ (value) => typeof value === 'function');
   ```

3. **And only then swaps the DOM** — `client.js:1824`, verbatim:

   ```js
   			root.$set(navigation_result.props);
   ```

4. **The walk's settle releases at step 1.** `tests/tests/specs/voter/voter-journey.spec.ts:186-190`, verbatim:

   ```ts
   async function expectUrlChange(page: Page, action: () => Promise<void>): Promise<void> {
     const urlBefore = page.url();
     await action();
     await page.waitForURL((u) => u.toString() !== urlBefore, { timeout: TIMEOUTS.page }).catch(() => null);
   }
   ```

   It settles on the **URL only** — no DOM assertion, no `waitForLoadState` — and it **swallows its own
   timeout** at line 189, so "the URL changed but the DOM has not" and "the URL never changed at all"
   both flow onward identically. `expectQuestionAndAdvance` wraps its body in this helper and performs
   no post-click DOM settle of its own (`voter-journey.spec.ts:234-281`).

5. **Inside that window the term trigger genuinely does not exist**, because the question still
   rendered is Base-2 and Base-2 carries no terms.
   `packages/dev-seed/src/templates/e2e/base.ts:834` (the Base-2 question row, `base.ts:828-838`), verbatim:

   ```ts
           custom_data: { hero: { url: '/images/e2e-test-image-1.jpg', type: 'image' } },
   ```

   — against Base-3's `custom_data.terms` block at `base.ts:850-858`. The trigger is emitted only when
   `terms` is present: `apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte:61`
   computes `let titleParts: Array<TitlePart> = $derived(addTermsToTitle(customData.terms));` and
   `:96-99` renders a `<Term>` per part that carries an explanation, whose button carries
   `data-testid="voter-questions-term-trigger"` (`apps/frontend/src/lib/components/term/Term.svelte:127`).
   No terms ⇒ the plain-text branch ⇒ **zero** elements with that testid ⇒ `element(s) not found`.

**The window is unconditional, and that is the load-bearing measurement.** It is not a rare event that
sometimes occurs; it is the normal post-settle state whose *width* varies. Across **262 forensic probes
over two plans** — every run, passing and failing alike — the probe taken at the instant the settle
released recorded `triggerCount: 0` in **every single one except two**, and those two are runs where
the probe itself was delayed past the window by load (`138-FORCED-REPRO.md` § 3.2, §C.5). The defect is
not that the window opens. The defect is that an assertion is made inside it.

**Its width, measured four ways** (`138-FORCED-REPRO.md` § 3.3, §B.7.3, §C.4):

| Condition | Post-settle window | Method |
|---|---|---|
| isolated, no throttle | **100 – 125 ms** | budget bisection, § 3.3 |
| under five-worker pressure | **< 200 ms** | budget bisection under load, §C.4 |
| isolated, CPU rate 20 | 200 – 400 ms | §B.7.1 |
| isolated, CPU rate 40 | 400 – 800 ms | §B.7.2 |

Against the production `TIMEOUTS.element` of **2000 ms**, the median window is **~18× smaller** — which
is precisely why the defect is a ~1-in-8 event in the field rather than a constant failure, and why
every run in this phase's 96 production-budget runs passed.

**The contended resource, named and bounded.** Worker contention is part of the mechanism's
environment and is named as such: at an operating point on the edge of the measured band it takes the
failure from **1/10 to 10/10** on a byte-identical prefix, p ≈ 0.0001 (`138-FORCED-REPRO.md` §C.3).
It is bounded in the same breath, because the bound is what keeps this statement honest: contention
widens the window by **less than 2×** on its own (§C.4), and at the production budget the pressured and
isolated arms are **0/10 and 0/10** (§C.2). Six workers make the window wider; they do not make it
2000 ms wide.

### The one thing this does not explain, stated plainly

**What produced the excursion in the wild is NOT established, and this section does not pretend
otherwise.** For the recorded DEF-135-04 occurrence the window must have exceeded not 2000 ms but
roughly **4000 ms** — the soft heading assertion consumed a full 2000 ms budget before the term
assertion started its own — i.e. about **36× the median**. This phase drove the window to at most
**~5.4×** by CPU amplification (§B.7.3) and **<2×** by worker contention (§C.4), and quantified why
neither can go further: the CPU rate needed to reach 2000 ms is ~130-190, and the throttle already
destroys the instrument at 80 (§B.7.3).

So the mechanism is established and the **amplifier is not**. The two are separable claims and only the
first is asserted here. The amplifier is not a fourth hypothesis about *where* the failure lives — it is
a question about what stalls a swap for four seconds on one navigation in eight: a candidate list that
includes a dev-server module-transform stall, a garbage-collection pause, host-level scheduling
starvation, and Chrome's own ~4 s view-transition skip ceiling (RESEARCH Assumptions Log A3, cited but
never verified against this Chromium build — and note that a 4 s ceiling would explain why the
post-failure snapshot shows a *completed* Base-3 page). **The instrument to answer it already exists and
did not exist before this phase:** plan 01's forensic capture (video, console transcript,
failed-request transcript, dev-server log) plus plan 02's hard heading gate mean the next occurrence
arrives as data with a timestamped server log beside it, which is exactly waiver condition 3. This
paragraph is the record that the question is open, so that a later reader cannot mistake a named
mechanism for a fully explained field failure.

### Why the recorded evidence fits

The DEF-135-04 write-up contains two facts that made it look paradoxical. The mechanism explains both,
and it has to, or it is not established.

**Fact 1 — the error was an *existence* failure, not a visibility failure.** `deferred-items.md:181-198`
records `Error: element(s) not found` on `getByTestId('voter-questions-term-trigger').first()`. Under
the mechanism that is the only shape the error can take: during the window the rendered question is
Base-2, Base-2's `custom_data` has no `terms` (`base.ts:834`), so `addTermsToTitle` takes its
plain-text branch and **no element with that testid is ever constructed**. There is nothing to be
invisible. This also disposes of RESEARCH's U-3 speculation (a fourth hypothesis in which the element
exists but is painted into the `::view-transition` pseudo-tree and is therefore not "visible" to
Playwright): that would produce a visibility failure against a found element, not `element(s) not
found`. The forced reproduction returns the identical phrase on the identical locator
(`138-FORCED-REPRO.md` §B.9).

**Fact 2 — the post-failure page snapshot showed the heading rendered WITH the trigger.** This is the
part that misdirected the original diagnosis, and it is a straightforward consequence of *when*
Playwright takes that snapshot: after the assertion's budget has expired. The window closes; the DOM
swaps; the snapshot is taken; it shows a complete Base-3 page. **The forced reproduction reproduces
this paradox exactly, in the same run** — the probe recorded
`{"headingCount":0,"headingText":null,"triggerCount":0}` while that same run's `error-context.md`
contains, verbatim (`138-FORCED-REPRO.md` §B.9):

```yaml
          - heading "[qu-opin-base-3-likert7] Base opinion 3 — Likert 7." [level=1] [ref=e47]:
            - text: "[qu-opin-base-3-likert7] Base opinion 3 —"
            - button "Likert" [ref=e49]:
              - generic [ref=e50]: Likert
```

Nothing was ever missing from the page. The assertion looked before the page was there, and the
evidence was collected after it arrived. That single sentence is the defect.

**Fact 3, which the phase derived rather than recovered — U-1 is answered.** U-1 asked whether the soft
heading assertion at `voter-journey.spec.ts:858` also failed in the original run, and concluded
UNRECOVERABLE from artifacts. It is now answerable from the mechanism: the term trigger and the Base-3
heading text are emitted by one `$derived` into one `<h1>` in one render commit (`QuestionHeading.svelte:61`,
`:96-99`), and `DataRoot.update()` — the only thing that could separate them — has a single call site in
an admin utility that is not on the voter path (`apps/frontend/src/lib/admin/utils/loadElectionData.ts:56`).
The trigger therefore cannot be absent while the Base-3 heading text is present, a prediction the record
confirms with **262 probes and zero counter-examples** (`138-FORCED-REPRO.md` §C.5). It follows that the
term assertion at 862 could only have failed if the heading assertion at 858 had failed first.
**The answer to U-1 is: yes, line 858 also failed.** The deferred-item write-up quoted one error block
out of the run's error list — exactly the excerpt-versus-run distinction U-1's own verdict warned
against reading the other way.

### How it was forced

Deterministic, non-degenerate, and rebuildable — **15/15 across two independently launched blocks**,
recorded at `138-FORCED-REPRO.md` §B.8 (the 5-run bisection block at §B.7.2 and the 10-run confirmation
block that follows it):

```bash
# Prereq: exactly one dev server for THIS checkout on 5273, and a reset DB.
#   yarn db:reset
#   FRONTEND_PORT=5273 yarn dev          # separate shell; leave it running

FRONTEND_PORT=5273 \
EPERM07_FORCE_BUDGET_MS=400 \
EPERM07_FORCE_CPU_RATE=40 \
PLAYWRIGHT_JSON_OUTPUT_FILE="$PWD/eperm07-run.json" \
  npx playwright test -c tests/playwright.config.ts \
    --project=eperm07-term-trigger --reporter=json
```

| Property | Value | Source |
|---|---|---|
| Failure rate | **15/15 (100 %)** | `138-FORCED-REPRO.md` §B.8 |
| Non-degenerate | 15/15, and 15/15 failing on the term-trigger locator rather than on some other assertion | §B.8 |
| Error text | `element(s) not found` on `getByTestId('voter-questions-term-trigger').first()` | §B.9 |
| Oracle weakened? | **YES — 400 ms against the production 2000 ms, a 5× shrink.** Part of the adversary description, not a footnote. | §B.8 |
| Forced at the production budget? | **NO.** 96 runs at the unweakened 2000 ms budget across CPU rates 2-80 and under worker pressure, zero failures. | §B.5, §C.2 |
| Why not | Reaching 2000 ms needs CPU rate ~130-190; the throttle breaks the instrument at 80, because ~105 ms of the ~112 ms window is rate-INDEPENDENT | §B.7.3 |

The strong form of criterion 1 — forcing without weakening the oracle — **was attempted across the
whole ladder and was not achieved**, and the reason is measured rather than assumed. Plan 04 inherits
the configuration above with the instruction to run **both halves isolated** (`138-FORCED-REPRO.md` §C.8).

### What was eliminated on the way

| Hypothesis | Status | Evidence | Where |
|---|---|---|---|
| **Cold-start Vite module compilation** (route-module load at `client.js:1642`) | **eliminated** — before this phase | Three post-restart runs and two full-suite runs all passed the step; three further cold-cache full-suite runs added later | `deferred-items.md:209-215`, § Already eliminated above |
| **H1 — View-Transition snapshot capture stalls the swap** | **eliminated** | (i) 10-vs-10 A/B at a frozen operating point: VT on 7/10, VT off **9/10** — the transition is not *necessary* (p ≈ 0.58, no detectable rate difference), and the two arms had zero tri-state overlap. (ii) Snapshot capture is a rendering-frame cost, and the window is rate-INDEPENDENT: 40× CPU buys only ~5.4×, so it could not have been the *amplifier* either. | § Discriminator A; `138-FORCED-REPRO.md` §B.7.3 |
| **H2 — the render gate at `questions/+layout.svelte:257-258` transiently closes** | **eliminated** | (i) Neither gate's inputs can change on a Q→Q hop: `#opinionQuestions` is assigned in an `$effect` over `DataRoot`/elections/constituencies (`voterContext.svelte.ts:499`), and `question`/`questionBlock` are synchronous `$derived` over already-loaded data. (ii) The gate's own failure path logs a reroute (`questions/+layout.svelte:119-121`) and the console transcript of a forced failure contains no error, no warning and no reroute. (iii) The 127 `headingCount: 0` probes rise monotonically with CPU rate and appear with the transition ON — a mount-timing instant inside the swap, not a data gate. | Ledger row H2; `138-FORCED-REPRO.md` §B.3, §B.10 |
| **H3 — `customData.terms` arrives after the heading text** | **eliminated** | (i) U-2 closed: `DataRoot.update(` has exactly one call site in the frontend, `apps/frontend/src/lib/admin/utils/loadElectionData.ts:56`, an admin utility off the voter path — so `customData` cannot change between the two reads. (ii) Text and trigger are one `$derived` into one `<h1>` (`QuestionHeading.svelte:61`, `:96-99`). (iii) **Zero** H3-shaped observations in **262 probes**, and both probes that ever saw a Base-3 heading saw `triggerCount: 1` with it. | Ledger row H3; `138-FORCED-REPRO.md` §C.5 |
| **H4 — the element exists but is painted into the `::view-transition` pseudo-tree** (RESEARCH U-3, never promoted) | **eliminated — does not fit the evidence** | It predicts a visibility failure against a found element; the recorded and reproduced error is `element(s) not found`, an existence failure. | § Why the recorded evidence fits, Fact 1 |
| **A2 — `workers: 6` contention is *the* amplifier** | **not confirmed; measured and found insufficient** | Contention is real (1/10 → 10/10 at the margin) but worth **< 2×**; the field failure needs ~36× | `138-FORCED-REPRO.md` §C.4, §C.7 |

### Remedy tier

**Tier: BOTH, and the two halves address different things — which is exactly why this section must not
be collapsed into one recommendation.** D-06 forbids the executor from applying a test-side remedy
unilaterally, and D-05 prefers an app-side fix where a user could see the same defect. This section is
the evidence for that decision, and plan 04 owns the decision itself.

**Could a user observe the same defect? Two answers, and they are different.**

- **The ~112 ms baseline window: NO, and it is not a defect.** For roughly a tenth of a second after a
  Q→Q navigation the outgoing question is still painted while the URL has advanced. That is what a
  cross-fade view transition *is*, it is under the ~100 ms threshold at which a UI is perceived as
  instantaneous, and no user-facing behaviour is wrong. Nothing here should be "fixed".
- **The ~4 s excursion: YES, unambiguously.** A four-second interval in which the address bar says
  Base-3 and the page still shows Base-2 — or shows nothing — is a user-visible stall in the middle of
  the question flow. If the excursion is reproducible it is a product defect under D-05's clause, and
  it is the half of this defect that no test change can address.

**Test-side — what it would change, and what it would cost.** The exposure is the settle, not the
assertion. `expectUrlChange` (`voter-journey.spec.ts:186-190`) settles on the URL and then swallows its
own timeout, so a navigation that stalls — or never happens — is indistinguishable downstream from one
that completed. Settling on a destination-specific DOM fact (RESEARCH Pattern 1) would make the walk
wait for the thing it actually depends on, and *not* swallowing the settle's timeout would make a
stalled navigation fail **at the settle**, where it reads as a navigation problem, instead of surfacing
lines later as a missing element. Cost: the helper is used throughout the voter journey, so the blast
radius is the whole walk, and any change must preserve the hops where the very next assertion *is* the
heading gate. **Note what is already done:** plan 02's D-08 promotion made the Base-3 heading gate at
`voter-journey.spec.ts:858` hard, which — given H3's elimination — means the term assertion two lines
below can no longer be reached with the heading absent. The production spec's residual exposure is now
at 858, not at 862. **Note equally what this does not fix:** it converts a misleading failure into an
explainable one. It does not shorten the window, and under a 4 s stall the walk still fails. A bare
timeout bump is separately and explicitly rejected by D-07 and would in any case only widen the
interval in which a stale DOM goes unnoticed.

**App-side — what it would change, and what it would cost.** Two candidates, and only the second is a
real product fix. (a) Narrowing the window by resolving the `onNavigate` promise earlier or scoping the
transition — this is cosmetic given H1's elimination: the window exists with the transition off (arm B
failed 9/10) and is created upstream at `client.js:1760`, so nothing the app does to the transition
removes it. (b) Finding and removing whatever stalls the swap for seconds — the real fix, and the one
that cannot be written yet because § "The one thing this does not explain" has not identified it.
Cost of (b) is unknown by construction; cost of any change to the term-parsing or `<Term>` mount path
is high and is *not* indicated — D-05's clause is written for a "real mount/parse race in `Term.svelte`",
and this phase eliminated exactly that hypothesis (H3). **A change to `Term.svelte` or to
`QuestionHeading.svelte` would be a fix to a mechanism that has been disproved**, and plan 04 should
reject any proposal in that direction on this evidence.

**What plan 04's decision checkpoint therefore has to decide**, stated as the question rather than as a
recommendation, since D-06 reserves it for the operator: given that the mechanism is an ordering rather
than an app bug, that the only user-visible half is an excursion whose cause is not yet identified, and
that the test-side change is a diagnosis improvement rather than a defect fix — is the criterion-2 fix
(i) the settle change, accepted as test-side with the excursion tracked as a separate open item, or
(ii) held until the excursion is localised? The negative-control pair can be run for (i) today against
the configuration in § How it was forced; (ii) cannot be run at all until the amplifier is named.
