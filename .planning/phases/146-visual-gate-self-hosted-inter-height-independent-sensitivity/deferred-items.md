# Phase 146 — deferred items

Out-of-scope discoveries made while executing this phase. Logged, **not** fixed here.

## D-146-DEF-1 — seed ordering is stable *within* a session and not *across* sessions

> **⚠ CORRECTED 2026-08-26 — the diagnosis below is WRONG; the observation is real.** A bounded
> falsification test at a FIXED HEAD (`cbda81d69`) ran 12 captures and refuted the mechanism this
> entry names. Nothing below is deleted; read the **§ Correction** block at the end of this entry
> before acting on any of it. Full evidence: [`.planning/debug/seed-determinism-across-resets.md`](/.planning/debug/seed-determinism-across-resets.md).

**Found during:** `146-06` Task 1 (the font-delta measurement).

**What was measured.** Against the same committed baselines, on the same machine, same pinned container
image and same product HEAD family, the four visual captures produce numbers that are perfectly stable
within a session and different between sessions:

| Session | `voter-results-desktop` | `voter-results-mobile` | `candidate-preview` pair |
|---|---|---|---|
| 2026-08-26 10:45-10:58 (5 runs, `146-verify-tiebreak-1…5`) | 16,883 px | 16,883 px | passed under the then-ratio budget |
| 2026-08-26 15:43-15:49 (`146-fontdelta-cap`, `146-05-guardfail-control`) | 16,887 px | 16,878 px | 856 px |
| 2026-08-26 16:28-16:45 (4 runs, `146-fontdelta-zero*`, `146-fontdelta-cap-146-06`) | 11,615 px | 11,601 px | 0 px |

Within each session the numbers repeat exactly (four identical runs in the last session; ten identical
runs in `146-VISUAL-NOISE-LEDGER.md` § *Noise matrix*). **Run-to-run noise is 0. Session-to-session it
is not.**

**What it looks like.** The 856 px in the middle session decodes to exactly one 48 × 48 avatar tile —
the same candidate rendered with a different seeded photograph. `packages/dev-seed/src/writer.ts:293`
assigns `portraits[i % portraits.length]` over candidates **in insertion order**, so the photo a
candidate receives is a function of the candidate array's order at upload time. The voter deltas move
in the same family (different candidate occupying the same results slot). The tie-break fixes
`53002b6a9` + `dbb704bd4` made the *rendering* order deterministic given the seeded data; what varies
here is upstream of that, in what gets seeded.

**Why it is not fixed here.** `146-06` is a measurement plan with zero product bytes, and this is a
`@openvaa/dev-seed` question, not a visual-gate one.

**Who needs to know.**

- **`146-07`** will bake whatever ordering is live at re-baseline time into the committed PNGs. If the
  ordering shifts in a later session, the gate goes red for a reason that has nothing to do with a
  visual regression.
- **`146-08`**'s determinism runs (`D17-R01` … `D17-R05`, `D17-CI`) measure repeat runs **within one
  session** and therefore cannot see this. A green determinism result must not be read as ruling it out.

### § Correction (2026-08-26) — what the falsification test found

Method: 3 full `db:reset` + seed + capture cycles at fixed HEAD `cbda81d69` (tree clean, dev-server
build current — `git diff 073fefc72..HEAD -- apps packages` is empty), plus a 9-run isolation arm
with **no** `db:reset` at all. Every run's `stdout.log` carries `E2E PREFLIGHT OK`. Captures were
written unconditionally via a redirected `snapshotPathTemplate` + `--update-snapshots=all`, because
at zero tolerance the two `candidate-preview` baselines PASS and emit no `-actual.png`. The committed
baselines and `tests/playwright.config.ts` were never touched.

**1. The named mechanism is REFUTED.** `packages/dev-seed/src/writer.ts:293` does not iterate
candidates "in insertion order". Its list comes from `selectCandidatesForPortraitUpload`, whose query
carries `.order('external_id', { ascending: true })`
(`packages/dev-seed/src/supabaseAdminClient.ts:679`), and the portrait file list is `readdirSync(...)
.sort()`. Measured directly: the ordered (candidate external_id -> portrait storage eTag) pairing is
**byte-identical across all three reset cycles**. The dataset seeds exactly 30 candidates against a
30-file portrait pool with 30 distinct eTags, so the cycling is a *bijection* — any reorder would
permute every photograph and could not hide. It did not move.

**2. The seed is deterministic across resets.** All seeded content — candidates, nominations
(including `sort_order`), elections, organizations, alliances, constituencies, questions, categories,
and every candidate's answers — is byte-identical across the three cycles once Postgres's re-minted
surrogate UUIDs are normalised away. `e2e/base` also declares `count: 0` on every block and supplies
hand-authored `fixed[]` rows and explicit `answersByExternalId`, so the RNG is barely exercised.

**3. The captures are nevertheless NOT byte-reproducible — for a reason unrelated to the seed.**
Two of four baselines flip between exactly two variants (8 blue / 4 black over 12 runs). The
differing pixels are confined to one 291x17 band that is the `/results` election-selector chip:
its text and icons render primary-blue in one variant and near-black in the other. Root cause is an
AND of two conditions:
  - `tests/tests/utils/selectElection.ts` pins WHICH election is displayed but not the interaction
    PATH; the walk's landing election is non-deterministic (its own docblock says so), so ~1 run in 3
    performs an extra election-switch navigation; **and**
  - that navigation fires `afterNavigate` in `apps/frontend/src/routes/+layout.svelte:172-182`, whose
    `requestAnimationFrame(() => target?.focus(...))` steals focus from the just-clicked option
    button, so `focus:text-primary` (`AccordionSelect.svelte:89`) stops applying.

Confirmed by a **12/12 perfect correlation** between the number of distinct `/results/<electionId>`
URLs a run visited (1 vs 2, read from its own trace) and which hash it produced.

**4. `db:reset` is not the variable.** Both variants reproduce with no reset anywhere (runs
`noreset4`, `noreset5`, `noreset9`).

**5. This entry's "stable within a session" premise is also wrong.** The variance is per-RUN, so
`146-08`'s determinism runs are NOT structurally blind to it after all — they simply report 0 px,
because the delta scores **0 px at the shipped `threshold: 0.2`** (and 0 px even with
`includeAA: true`); it registers only at `threshold: 0`. That is likewise why `146-03`'s ten-run
noise matrix recorded zeros.

**6. On the three filed numbers and the HEAD-drift confound.** HEAD drift explains session 1 -> 2:
`dbb704bd4..26060159a` is exactly the self-hosted-Inter swap. It does **not** explain session 2 -> 3
— `26060159a..073fefc72` touches no product bytes at all. The likelier explanation for that pair is
that they were measured against **different reference images** (session 2 against working-tree
baselines refreshed during the D-04 loop, session 3 against the committed 2026-08-11 ones), compounded
by the per-run chip variant documented above. The historical databases and working-tree baselines no
longer exist, so those specific numbers cannot be re-derived — only explained as a class.

**Consequence for `146-07`: the re-baseline can proceed.** Whichever variant is committed, the other
passes the gate at 0 px, so a fresh `db:reset` on CI or another machine will not redden it. ~~What is
*not* safe is any future procedure that asserts byte- or digest-identity of the two voter
baselines.~~ **AMENDED — see below; that restriction no longer holds.**
`candidate-preview-{desktop,mobile}` are fully byte-stable (0 exact differing pixels over 12 runs).

### ⚠ AMENDMENT (`146-07`, 2026-08-26) — the variance is FIXED, so the struck sentence above is stale

The struck restriction is amended rather than merely annotated, because leaving it standing would
propagate a false premise into every later plan that reads this entry (the standing lesson from
Phase 140 → 141).

`tests/tests/utils/selectElection.ts` now converges the post-selection focus state before returning
(commit `2df2d0b28`, **test-only**): after the selection commits it focuses the app's own
post-navigation target — the element `afterNavigate` would focus — rather than blurring the button,
because a blur races a pending `afterNavigate` rAF while re-focusing the same element is idempotent
under it. The product's focus reset is deliberately untouched: it is **NAVA11Y-02**, correct
accessibility behaviour, and not a thing to trade away for a stable screenshot.

Measured after the fix, 12 runs at a fixed HEAD, with **both** interaction paths sampled (3 runs took
the 2-navigation path, 9 the 1-navigation path): **all four captures byte-identical in 12/12 runs**,
one sha256 each, and identical again in the `--update-snapshots=all` baking run and in `G0-CLEAN`.
The committed capture is byte-identical to the pre-fix *unfocused* variant (0 exact differing pixels)
and differs from the *focused* one by the same 291×17 px band. So **all four** baselines are now
byte-stable, not just the `candidate-preview` pair, and a digest-identity procedure over them is
admissible. Evidence: `tests/e2e-runs/146-t0-focus/run1…12`,
`146-NEGATIVE-CONTROL.md` § *Baseline re-capture* → *Byte-stability of what was committed*.

What 12 runs still cannot exclude is a **third, rarer variant** — the same blind spot this entry names
for its own 12 — and this is one host and one image digest.

**Separately (confirmed by experiment, not implicated here):** `e2e/base` declares
`externalIdPrefix: ''`, so `selectCandidatesForPortraitUpload('')` issues `.like('external_id', '%')`
— matching *every* non-NULL `external_id` in the project, not just the base dataset's. Inserting one
foreign candidate that sorts before `test-` rotated all 30 portrait assignments by one. It cannot
fire on a clean database, and `setupFromTemplate`'s freshness probe warns when it would. Filed as an
observation; no fix applied.

## Found during `146-08` Task 4 — out of scope, not fixed

- **`146-NEGATIVE-CONTROL.md`'s `F3-BOGUS-GREEN` row splits into 11 fields, not 9, under a naive
  `awk -F'|'` cell count.** Cause: the row's `Assertion outcome` cell contains an escaped pipe
  (`never requested\|`) inside a code span. Markdown renders it correctly as one cell; only a naive
  splitter miscounts. **Pre-existing** — the row already read 11 fields at `146-07`'s HEAD
  (`git show b92a53305:… | awk -F'|'` → 11), so it was not introduced by `146-08` and is outside this
  plan's scope boundary. Consequence: any future cell-count check over the register must either escape
  the split or exempt this row. Not fixed here; recorded so a later reader does not mistake it for
  corruption.

## D-146-DEF-4 — STATE.md plan/summary counter drift (out of scope, logged by `146-09`)

`.planning/phases/` holds **85** `*-PLAN.md` files and **86** `*-SUMMARY.md` files: one summary has no
matching plan. `.planning/STATE.md`'s `progress` block records `total_plans: 85` /
`completed_plans: 85`, which cannot be reconciled with 86 summaries on disk.

`gsd-tools query state.advance-plan` and `state.update-progress` both fail against this STATE.md
(`Cannot parse Current Plan or Total Plans in Phase`, `Progress field not found`), so the counters
have been hand-maintained for some time.

**Not caused by Phase 146 and not repaired by it** — the executor's scope boundary is to fix only what
its own changes caused. Guessing a total corrupts every later percentage, which is exactly the failure
a metric block exists to avoid. Whoever repairs it should derive both numbers from disk and record the
derivation, not adjust them until they agree.

## D-146-DEF-5 — Phase-146 decisions in STATE.md are tagged `[Phase 151]` (out of scope, logged by `146-09`)

`gsd-tools query state.add-decision` tags each entry from `STATE.md`'s frontmatter `current_phase`,
which had drifted to `151` (see the retained STATE correction of 2026-08-24). Every decision recorded
during Phases 145 and 146 therefore carries `[Phase 151]` — including entries whose own text begins
`146-05:`.

`146-09` corrected `current_phase` to `147` when closing Phase 146, and retagged its **own** five
entries to `[Phase 146]`. The earlier mistagged entries were **left alone**: they were written by other
plans, and silently rewriting another plan's decision record is not this plan's call. Whoever repairs
them should retag by the entry's own text prefix, which is unambiguous.
