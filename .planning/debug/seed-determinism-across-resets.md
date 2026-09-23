---
status: diagnosed
trigger: "Does a full `db:reset` + seed cycle, repeated at a FIXED HEAD, produce byte-identical visual captures? Bounded falsification test of D-146-DEF-1."
created: 2026-08-26T00:00:00Z
updated: 2026-08-26T00:00:00Z
---

## Current Focus

bug_class: Bohrbug-if-real (a determinism defect would reproduce deterministically per reset). SBFL not applicable — no failing/passing test spectrum; this is a cross-run equality question, not a localisation one.

hypothesis: H-NULL — the `e2e/base` seed is deterministic across full `db:reset` cycles at a fixed HEAD, therefore repeated cycles produce byte-identical capture PNGs. The three filed numbers (16,883 / 16,887+16,878 / 11,615+11,601) are explained by HEAD DRIFT across the three sessions (dbb704bd4 -> 26060159a -> 073fefc72), not by seed variation.
test: 3+ full cycles at FIXED HEAD cbda81d69: `yarn db:reset` -> in-container seed + 4 captures at maxDiffPixels:0 -> content-addressed DB dump -> harvest `-actual.png`. Then sha256-compare PNGs across cycles and diff DB dumps.
expecting: If H-NULL holds — identical sha256 for all four PNGs across all cycles AND zero diff in the DB dumps. If the filed mechanism is real — the ordered candidate/portrait-eTag pairing in `portrait-cycling.txt` shifts between cycles, and the PNG hashes diverge.
next_action: NONE — investigation complete, reported to operator. No fix applied by instruction.

## VERDICT (read this first)

**Captures are NOT byte-identical across `db:reset` cycles. The seed IS deterministic.**
Those are both true at once, and the second is what `146-07` actually depends on.

| Question | Answer |
|---|---|
| Do repeated `db:reset` + seed cycles produce byte-identical PNGs? | **NO** — 2 of 4 baselines flip between exactly two variants |
| Is the seeded DATA identical across resets? | **YES** — byte-identical once re-minted surrogate UUIDs are normalised away |
| Is `db:reset` the variable? | **NO** — both variants reproduce with no reset at all (9-run isolation arm) |
| Is D-146-DEF-1's filed mechanism (portrait/candidate ordering) correct? | **NO** — refuted by direct measurement on a 30-into-30 bijection |
| Does this threaten the visual gate? | **NO** — the delta scores **0 px** at the shipped `threshold: 0.2` |
| Does HEAD drift explain the three filed numbers? | **PARTLY** — see the correction in `deferred-items.md`; it explains session 1 -> 2, NOT 2 -> 3 |

**Run tally at fixed HEAD cbda81d69:** 12 captures, exactly 2 distinct hashes, 8 blue / 4 black.
Split occurs with reset (2/1) and without (6/3).

## Symptoms

expected: A full `db:reset` + `e2e/base` seed at a FIXED HEAD produces byte-identical seeded data, hence byte-identical visual capture PNGs, across repeated cycles.
actual: `146-06` filed D-146-DEF-1 claiming the same baselines produced different pixel counts in three sessions — 16,883 -> 16,887 / 16,878 -> 11,615 / 11,601 — attributed to seeded portrait/candidate ordering varying across sessions.
errors: none (no crash; this is a determinism/reproducibility question)
reproduction: Run `db:reset` + seed + visual capture N times at fixed HEAD; compare actual PNGs across cycles.
started: Observed across 2026-08-26 sessions during phase 146 execution.

## Confound under test

The three filed sessions were at DIFFERENT HEADs: dbb704bd4 -> 26060159a -> 073fefc72, spanning
the tie-break fix and the self-hosted-font change, both of which move pixels independently.
The test must discriminate "seed varies across sessions" from "numbers differed because HEAD differed".

## Eliminated

## Evidence

- timestamp: T0
  checked: `git rev-parse HEAD`, `git status --porcelain`, `git diff --stat 073fefc72..HEAD -- apps packages`
  found: HEAD = cbda81d69, tree clean, product diff between the dev-server build commit (073fefc72) and HEAD is EMPTY.
  implication: The running dev server (PID 94791, built at 073fefc72) serves bytes identical to HEAD. No rebuild needed; HEAD is genuinely fixed for the duration of the test.

- timestamp: T0
  checked: `tests/tests/setup/shared/base.setup.ts`
  found: The `data-setup-base` project calls `setupFromTemplate('e2e/base', { extraTeardownPrefix: ['e2e-perm-', 'e2e-bankauth-'] })`.
  implication: The suite's real seeding path is the `e2e/base` template via setupFromTemplate — NOT `db:seed --template default`. Cycles must use this path.

- timestamp: T1
  checked: `packages/dev-seed/src/writer.ts:260-303` (portrait assignment) and `packages/dev-seed/src/supabaseAdminClient.ts:660-681` (`selectCandidatesForPortraitUpload`)
  found: The portrait FILE list is `readdirSync(...).filter(...).sort()` — explicitly sorted. The CANDIDATE list comes from `selectCandidatesForPortraitUpload`, whose query carries `.order('external_id', { ascending: true })`, with a docblock stating "Deterministic order: sorted by `external_id` ascending so the portrait cycling (portraits[i % 30]) is stable across runs at a fixed seed." The upload loop is deliberately sequential ("Promise.all would interleave logs and reshuffle cycling").
  implication: The filed mechanism in D-146-DEF-1 — "candidates **in insertion order**" — is FACTUALLY WRONG at the source. Both inputs to `portraitFiles[i % portraitFiles.length]` are deterministically sorted. Operator's reading CONFIRMED.

- timestamp: T2
  checked: `packages/dev-seed/src/templates/e2e/base.ts` — `seed`, `count:`, `fixed:`, `answersByExternalId` occurrences
  found: `seed: 42`, `externalIdPrefix: ''`, and EVERY entity block declares `count: 0` with a hand-authored `fixed: [...]` array (10 blocks, 10 `count: 0`). Candidate answers are hand-authored per-entity via `answersByExternalId: withInfoAnswers(...)`, not generated. 64 `test-e2e-base-ca-` and 108 `test-e2e-base-nom-` external_id literals.
  implication: The `e2e/base` template generates NO synthetic rows and NO synthetic answers — the RNG is essentially unexercised. Every external_id is a literal in source at a FIXED HEAD. This makes the sorted-external_id ordering a pure function of committed source bytes, so portrait assignment is deterministic BY CONSTRUCTION, independent of any RNG behaviour.

- timestamp: T2
  checked: `tests/playwright.config.ts:569-571`
  found: `data-setup-base` declares `teardown: 'data-teardown-base'` — the seeded rows are wiped after the visual captures' chain finishes.
  implication: A DB dump taken after a stock container run would see 0 rows. The measurement overlay must strip the `teardown` key so the seeded state survives for inspection. This CANNOT affect capture content: teardown runs strictly AFTER the dependents' captures.

- timestamp: T2
  checked: `ps -p 94791`, `lsof :5173`, `lsof :54321/54322`, `psql` probe
  found: Dev server PID 94791 alive since 2026-08-26 16:49:35, `vite dev --host 0.0.0.0`, wildcard `*:5173`. Supabase up on 54321/54322. Base candidate count currently 0 (prior teardown ran).
  implication: Environment is ready; no dev-server restart needed (product diff 073fefc72..HEAD is empty).

- timestamp: T3
  checked: cycle0-probe — one `db:reset` + in-container seed + capture at `maxDiffPixels: 0` against the COMMITTED baselines
  found: `E2E PREFLIGHT OK` present. `observed_expected=4 observed_unexpected=2`. Only TWO `-actual.png` were emitted (`voter-results-desktop`, `voter-results-mobile`); the two `candidate-preview` captures PASSED at zero tolerance and therefore emitted nothing.
  implication: Failure-driven `-actual.png` harvesting can only ever yield the subset of baselines that are stale (2 of 4) — it cannot produce a four-way byte comparison. Methodology switched to redirecting `snapshotPathTemplate` into a throwaway sink with `--update-snapshots=all`, so all four captures write their bytes unconditionally. Secondary finding: `candidate-preview-{desktop,mobile}` are pixel-exact against their committed baselines at this HEAD.

- timestamp: T3
  checked: `portrait-cycling.txt` from cycle0-probe + the portrait asset pool
  found: The base dataset seeds exactly 30 candidates; the portrait pool holds exactly 30 `portrait-NN.jpg`; the 30 uploaded objects carry 30 DISTINCT eTags.
  implication: `portraitFiles[i % 30]` over 30 candidates is a BIJECTION. Any reordering of the candidate array — the exact mechanism D-146-DEF-1 alleges — would permute portraits across candidates and show up as a changed (external_id -> eTag) pairing. This makes `portrait-cycling.txt` a maximally sensitive detector for the filed mechanism: it cannot absorb a reorder silently.

- timestamp: T4
  checked: `yarn db:reset` behaviour under repeated invocation
  found: The first reset ended `Error status 502 ... Restarting containers`; storage answered 502 through kong and `storage.buckets` was EMPTY (no `public-assets`). Recovered with `docker restart supabase_storage_openvaa-local supabase_kong_openvaa-local` + a re-run of `db:reset`, after which storage answered 400 (auth-required, i.e. alive) and both buckets were present.
  implication: A KNOWN local-environment flake (documented in operator project memory: rapid repeated resets race storage/kong), NOT the phenomenon under test. Cycles are gated behind `reset-db.sh`, which refuses to hand a cycle a database unless storage is non-502, `public-assets` exists, and the base namespace is empty. Without this gate a cycle could seed with a failed portrait upload and manufacture a false positive.

- timestamp: T5
  checked: sha256 of the four written PNGs from cycles 1/2/3 (each preceded by a full `db:reset`, all gates green: 1x `E2E PREFLIGHT OK`, post-reset base count 0, `--update-snapshots=all` present, 6 expected / 0 unexpected)
  found: `candidate-preview-{desktop,mobile}` byte-IDENTICAL in all three cycles. `voter-results-{desktop,mobile}` identical in cycles 1 and 2 but DIFFERENT in cycle 3.
  implication: The answer to the asked question is NO — repeated `db:reset` + seed cycles at a fixed HEAD do NOT produce byte-identical captures.

- timestamp: T5
  checked: content-addressed DB dumps across the three cycles
  found: `portrait-cycling.txt` (the ordered candidate -> portrait-eTag pairing) BYTE-IDENTICAL in all three. `nominations.txt` and `nominations-by-sortorder.txt` BYTE-IDENTICAL. `elections/organizations/alliances/factions/constituency_groups` identical. `candidates.txt` identical on fields 1-12; only field 13 (`answers_md5`) differed, and once the re-minted question UUIDs are normalised away the answer multisets are IDENTICAL across all three cycles. `questions/question_categories/constituencies` identical on external_id + sort_order; their `row_md5` differed only because it embeds re-minted FK UUIDs.
  implication: THE SEEDED DATA IS IDENTICAL ACROSS RESETS. D-146-DEF-1's filed mechanism — portrait/candidate ordering varying — is REFUTED by direct measurement on the most sensitive possible detector (a 30-into-30 bijection). Since the DB content is identical and the PNGs differ, the PNG variance CANNOT be seed-caused.

- timestamp: T6
  checked: exact RGBA comparison + pixelmatch at several settings, cycle1 vs cycle3
  found: `candidate-preview` pair = 0 differing pixels exactly. `voter-results-desktop` = 1727 exact-differing pixels confined to ONE band, y 435-451, x 493-783 (a 291x17 region); mobile = 1558 in the same component. At the SHIPPED comparator settings (`threshold: 0.2`) the difference scores **0 px** — and 0 px with `includeAA: true` as well. It registers only at `threshold: 0` (1055 px / 1727 px with AA included).
  implication: The difference is INVISIBLE to the shipped visual gate. It is a low-chroma foreground-colour change, not a content change. Note this is also why `146-06`'s own 10-run noise matrix could not see it: at `maxDiffPixels: 0` the comparator still scores this delta as 0.

- timestamp: T6
  checked: visual crop of the differing band in both cycles
  found: The region is the `/results` election-selector chip. Cycle 1 renders "[EL-reg] Regional Election" plus its check and chevron glyphs in PRIMARY BLUE; cycle 3 renders the same text and glyphs in near-BLACK. Chip background, and every other pixel on the page (all candidate rows, names, scores, avatars), identical.
  implication: A pure focus-state difference on one button — not different seeded content. If any seeded value differed, the candidate list would differ; it does not.

- timestamp: T7
  checked: `apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte:89`
  found: The option button's class list is `join-item h-touch bg-base-200 hover:bg-base-300 **focus:text-primary** relative ...`, plus `class:pointer-events-none={options.length === 1}`.
  implication: The blue rendering is the `:focus` state. `pointer-events-none` on the collapsed single-option state rules OUT `:hover` as the cause. So the variable is whether the option button still holds DOM focus at screenshot time.

- timestamp: T7
  checked: URL sequences reconstructed from the two runs' Playwright traces
  found: Cycle 1's walk ends at `/results/<electionId[0]>` — ONE navigation. Cycle 3's walk goes `/results/<electionId[0]>` and then to `/results/<electionId[1]>` — an EXTRA navigation, because the walk landed on the other election and `selectElectionByName` had to switch. In both runs the displayed election is Regional, which is why page CONTENT matches. In both runs the `electionId[...]` params are ordered ascending by their (re-minted) UUID string, so which election the walk lands on flips with the UUIDs.
  implication: The extra navigation fires `afterNavigate` in `apps/frontend/src/routes/+layout.svelte:172-182`, which schedules `requestAnimationFrame(() => target?.focus({preventScroll:true}))` onto `[data-focus-on-nav]` / `h1` — stealing focus from the just-clicked option button. No extra navigation, no focus steal, button stays focused, chip renders blue. `tests/tests/utils/selectElection.ts` documents this landing election as non-deterministic in its own docblock ("that is NOT deterministic between EL-Reg and EL-Mun"). The helper pins the election CONTENT but not the interaction PATH, and the residual focus state leaks into the capture.

- timestamp: T8
  checked: ISOLATION EXPERIMENT N — 9 repeat captures with NO `db:reset` at any point (`noreset1`..`noreset9`)
  found: Exactly TWO distinct `voter-results-desktop` hashes across all 12 runs. With reset (cycles 1-3): 2 blue / 1 black. Without reset (noreset1-9): 6 blue / 3 black. **Both variants occur with no `db:reset` anywhere in the loop.**
  implication: DECISIVE. `db:reset` is NOT the variable. This is a per-RUN intermittency present in every repeat run regardless of how the database got into place. Note the same intermittency is present WITHIN a single session, which contradicts D-146-DEF-1's "stable within a session" framing.

- timestamp: T9
  checked: CORRELATION TEST — for all 12 runs, the number of distinct `/results/<electionId>` URLs the walk visited (from each run's own trace) against the capture's sha256
  found: PERFECT 12/12 correlation. 1 distinct results URL -> BLUE (8 runs). 2 distinct results URLs -> BLACK (4 runs). No exceptions, with and without reset.
  implication: ROOT CAUSE CONFIRMED. When the walk happens to land on the election the spec wants, `selectElectionByName`'s click changes nothing and no SvelteKit navigation occurs, so the clicked option button keeps DOM focus and `focus:text-primary` paints it blue. When the walk lands on the OTHER election, the click is a real navigation, `afterNavigate` fires, and its `requestAnimationFrame(() => target?.focus(...))` moves focus to `[data-focus-on-nav]`/`h1` — the button loses focus and paints near-black.

- timestamp: T10
  checked: EXPERIMENT R — insert ONE foreign candidate (`aaa-residue-probe-1`, sorts before `test-`) into the project, then re-run `data-setup-base` only, and compare `portrait-cycling.txt` against the clean control
  found: Every base candidate's portrait shifted by exactly one position — the whole 30-into-30 bijection ROTATED BY ONE (`ca-aa-1` took `ca-aa-2`'s photo, `ca-aa-2` took `ca-aa-3`'s, and so on). The foreign row survived the sweep, and `setupFromTemplate`'s freshness probe printed its warning: "Database is NOT fresh — found 1 non-test candidate(s)".
  implication: A REAL, SEPARATE latent fragility, confirmed by experiment but NOT the cause of anything measured here. `e2e/base` declares `externalIdPrefix: ''`, so `writer.write(rows, '')` -> `uploadPortraits('')` -> `selectCandidatesForPortraitUpload('')` -> `.like('external_id', '%')`, which matches EVERY non-NULL external_id in the project rather than just the base dataset's. `base.setup.ts` sweeps only three prefixes (`test-e2e-base-`, `e2e-perm-`, `e2e-bankauth-`), so a candidate under any other prefix (e.g. the dev demo template's `seed_` rows) shifts the cycling index for all 30. It cannot fire on a clean database — which is exactly the condition all 12 measured runs and CI satisfy — and it announces itself with the freshness warning when it does. Filed as an observation, NOT fixed.

## Resolution

reasoning_checkpoint:
  hypothesis: "The captures are not byte-reproducible, but the seed is. The `/results` election-selector option button carries `focus:text-primary`; whether it still holds focus at screenshot time depends on whether `selectElectionByName` had to perform a real election-switch navigation, which fires `afterNavigate`'s rAF-deferred focus reset onto `[data-focus-on-nav]`/`h1`. Which path is taken depends on the walk's landing election, which `tests/tests/utils/selectElection.ts` documents as non-deterministic."
  confirming_evidence:
    - "12/12 perfect correlation between distinct `/results/<id>` URLs visited (1 vs 2) and the capture hash (blue vs black) — directly observed in each run's own trace."
    - "The differing pixels are confined to ONE 291x17 band that is exactly the chip's glyph row; every other pixel is identical."
    - "`AccordionSelect.svelte:89` carries `focus:text-primary`, and `pointer-events-none` when collapsed rules out `:hover`."
    - "All DB content is byte-identical across the three reset cycles once re-minted surrogate UUIDs are normalised away — including `portrait-cycling.txt` on a 30-into-30 bijection."
    - "Both variants reproduce with NO `db:reset` at all (noreset4/5/9)."
  falsification_test: "A run with 2 distinct `/results/<id>` visits that nonetheless produced the BLUE hash, or vice versa. None occurred in 12 runs."
  fix_rationale: "NOT APPLIED — reporting first per the operator's instruction. Any fix belongs in the test walk (pin the interaction path / blur before capture), not in @openvaa/dev-seed."
  blind_spots:
    - "12 runs cannot exclude a THIRD, rarer variant. Only two distinct hashes were seen."
    - "The historical phase-146 sessions' database and working-tree baseline states no longer exist, so the specific filed numbers cannot be re-derived — only explained as a class."
    - "Experiment R's residue mechanism is confirmed as a mechanism but was NOT shown to have fired in any historical session."
  candidate_causes:
    - "code (frontend): `afterNavigate` rAF focus reset in `+layout.svelte:172-182` racing/stealing focus — CONFIRMED"
    - "code (test): `selectElectionByName` pins election CONTENT but not the interaction PATH — CONFIRMED"
    - "data (seed): portrait/candidate ordering varying per reset — REFUTED by direct measurement"
    - "environment: HEAD drift across the three filed sessions — PARTIALLY explanatory only (see below)"
  and_gate: "YES — this failure requires TWO conditions simultaneously: (1) the walk lands on the non-target election, forcing a real navigation, AND (2) the frontend's `afterNavigate` focus reset moves focus off the just-clicked button. Neither alone produces the variant, which is why `root_cause` is recorded as a pair."

root_cause: >
  TWO contributing causes, both required (AND-gate).
  (1) TEST: `tests/tests/utils/selectElection.ts` pins WHICH election is displayed but not the
  interaction PATH taken to get there; the walk's landing election is non-deterministic (documented
  in that helper's own docblock), so roughly 1 run in 3 must perform an extra election-switch
  navigation.
  (2) PRODUCT: `apps/frontend/src/routes/+layout.svelte:172-182`'s `afterNavigate` schedules
  `requestAnimationFrame(() => target?.focus({preventScroll:true}))` onto `[data-focus-on-nav]`/`h1`.
  On the extra-navigation path this steals focus from the just-clicked `AccordionSelect` option
  button, whose `focus:text-primary` class (`AccordionSelect.svelte:89`) then stops applying — so the
  chip's text and icons render near-black instead of primary blue.
  The seeded data is NOT a cause: it is byte-identical across resets.

fix: NOT APPLIED — reported for operator decision per the bounded-test mandate.

verification: >
  N/A — no fix applied. The finding itself is verified by 12 runs at a fixed HEAD (cbda81d69) with a
  12/12 correlation, a controlled no-reset isolation arm, and a content-addressed DB comparison.

files_changed: []

## Recommended fix — NOT APPLIED (operator decision)

Reported unapplied per the bounded-test mandate. Nothing in `@openvaa/dev-seed` needs to change:
the seed is not at fault. Options, cheapest first:

1. **Pin the interaction path in the test (preferred, test-only).** After
   `selectElectionByName` commits, blur the option button (or focus a neutral, stable element)
   before `settleFonts`/the screenshot, so the captured focus state is the same on both paths.
   Fixes the capture without touching product behaviour, and is the smallest change that makes the
   committed PNG bytes reproducible.
2. **Make the walk's landing election deterministic.** The non-determinism is documented in
   `tests/tests/utils/selectElection.ts`'s own docblock and originates upstream in
   `answerAndAdvanceToResults` step 7 (`options.first()`). Removing it would collapse the two paths
   into one. Larger blast radius: other specs depend on that walk.
3. **Do nothing to the product.** The `afterNavigate` focus reset is NAVA11Y-02 and is correct
   a11y behaviour — moving focus to the page heading after navigation is the desired outcome. It
   should not be changed to make a screenshot stable.

**Separately, and independently (Experiment R, confirmed):** `e2e/base`'s `externalIdPrefix: ''`
makes `selectCandidatesForPortraitUpload('')` issue `.like('external_id', '%')`, which matches every
non-NULL `external_id` in the project rather than the base dataset's. One un-swept foreign candidate
rotates all 30 portrait assignments. It cannot fire on a clean database, and `setupFromTemplate`'s
freshness probe warns loudly when it would. Worth a narrower filter or promoting that probe from
warn to fail for the base chain — but it is NOT implicated in anything measured here.

## What this means for 146-07

- **The re-baseline can proceed.** The delta between the two variants scores **0 px** at the shipped
  `threshold: 0.2` (and 0 px even with `includeAA: true`); it registers only at `threshold: 0`.
  Whichever variant gets committed, the other passes the gate. A fresh `db:reset` on CI or another
  machine will NOT redden the gate for this reason.
- **But the committed PNG bytes are not reproducible byte-for-byte**, so any future procedure that
  asserts byte- or digest-identity of these baselines (rather than gate-passing) will be flaky on
  the two voter baselines. `candidate-preview-{desktop,mobile}` are fully byte-stable — 0 exact
  differing pixels across all 12 runs.
- **`146-08`'s determinism runs are not blind to this after all** — the variance is per-run, not
  per-session, so repeated runs within one session DO sample it. They will still report 0 px,
  because the gate cannot see it.

## Reproduction assets

All under `tests/e2e-runs/146-DEF1/` (gitignored; the shipped config and the committed baselines
were never touched — verified with `git status` after every run):

- `playwright.def1capture.config.ts` — measurement overlay: absolutised `globalSetup` + project
  `testDir`s (F-146-P1), `snapshotPathTemplate` redirected to a throwaway sink, `teardown` stripped
  from `data-setup-base` so the seeded rows survive for inspection.
- `cycle.sh` / `reset-db.sh` — one full reset+seed+capture cycle, gated on a healthy reset.
- `dump-db.sh` — content-addressed DB dump (no raw UUIDs; portraits identified by storage eTag).
- `correlate.sh` — the 12/12 navigation-count vs capture-hash correlation table.
- `residue-probe.sh` — Experiment R.
- `cycle{1,2,3}/`, `noreset{1..9}/` — per-run evidence (`run/stdout.log` carries `E2E PREFLIGHT OK`
  in every one; `run/observed.txt`; `db/`; `png/`).
