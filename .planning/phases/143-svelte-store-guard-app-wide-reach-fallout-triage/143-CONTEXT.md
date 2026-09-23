# Phase 143: `svelte/store` Guard — App-Wide Reach + Fallout Triage - Context

**Gathered:** 2026-08-22
**Status:** Ready for planning
**Source:** `143-DISCUSSION-POINTS.md` (15 decisions, 4 ⚠ DECIDE). Returned by the operator 2026-08-22
with **all fifteen ★ RECOMMENDED options ticked, zero overrules, zero free-text edits**. See
`143-DISCUSSION-LOG.md`.

**Grounding:** every file, line number, glob and grep result below was re-measured at HEAD
`374af0bf6` (branch `feat-gsd-roadmap`, 2026-08-22) during context synthesis — not carried over from
the discussion document. Two of that document's § A measurements did **not** survive re-measurement;
both are recorded as ⚠ DERIVED decisions (**D-09a**, **D-12a**) rather than left for an executor.

---

<domain>
## Phase Boundary

**The roadmap line for this phase describes work that already landed.** `7c47b35b7`
(`refactor(115-02): widen svelte/store ESLint guard to src/**/*.{ts,svelte} (SWEEP-03)`, 2026-06-13,
Phase 115) widened the guard from `lib/contexts/**` + `routes/**` to `src/**/*.{ts,svelte}` nine days
after the todo asking for it was filed. ASSERT-09's fallout — "pre-existing usages surfaced by
widening" — is a **measured zero**: not one real `svelte/store` import exists anywhere under
`apps/frontend/src`.

What is genuinely unsatisfied is ASSERT-08's **proof clause** ("proven by injection") under the
milestone's standing acceptance rule (`REQUIREMENTS.md:7-13`): the guard has been observed *working*,
never observed *blind*. Phase 143 is therefore re-scoped (**D-01**) to **prove the reach, close the
measured gaps, and correct the record** — the F-140-01 → Phase 141 shape, which is in-tree precedent
rather than an invention.

**In scope:**

- The **two-run negative control at all four SC-1 sites** (`lib/components`, `lib/utils`,
  `lib/dynamic-components`, `lib/candidate/components`), OLD half produced by temporarily narrowing
  the real config back to the pre-115 scope, measuring, restoring, and proving the restore
  (**D-02**).
- **Closing two measured reach gaps** in `apps/frontend/eslint.config.mjs`: the `.js`/`.mjs`/`.cjs`
  glob hole (**D-05**) and dynamic `import('svelte/store')` (**D-06**).
- **Widening the standing guard test** from one probe path to a table-driven 4 dirs × {`.ts`,
  `.svelte`} matrix plus the dynamic-import probe and the existing negative control (**D-04**).
- **Discharging ASSERT-09 as a measured zero** with a per-file disposition table, the exact grep
  commands, and the HEAD they ran at (**D-09**, **D-09a**).
- **Correcting five record targets** in-phase, naming `7c47b35b7` at each (**D-12**, **D-12a**).
- The evidence artifact `143-NEGATIVE-CONTROL-LEDGER.md` (**D-13**).

**Not in scope** (each measured, each recorded, each filed as a todo where it stays open):

- **`svelte/motion`** (`tweened`, `spring`) — store-shaped contracts, but a different module named by
  neither requirement, and carrying its own migration fallout. Measured and recorded; todo filed
  (**D-07**).
- **Files outside `src/`** — `apps/frontend/package.json:10` runs `eslint src/`, so `vite.config.ts`,
  `svelte.config.js`, `vitest.config.ts`, `prettier.config.mjs` and `eslint.config.mjs` itself are
  outside **every** lint gate, not just this guard's. A lint-coverage question, not a store-guard
  question. Recorded; todo filed (**D-08**).
- The **`tests/` tree** and any non-`apps/frontend/src` workspace. ASSERT-08's boundary is
  `apps/frontend/src/**` and the phase does not widen it.
- **Deleting** the dead `'**/_spikes-*/**'` ignore, or any other exclusion-list edit (**D-11**).
- Migrating the four prose mentions of `svelte/store` — they are the historical record of *why* the
  seam was removed, not residue (**D-09**).

**Zero runtime bytes ship.** The change surface is one ESLint config file, one vitest spec, and
planning documents.

</domain>

---

<baseline>
## Re-measured Factual Baseline (HEAD `374af0bf6`)

No plan re-derives these. Facts **B-5** and **B-6** correct the discussion document.

| # | Fact | Evidence |
|---|---|---|
| B-1 | The guard's scope is **`src/**/*.{ts,svelte}`**, not `contexts` + `routes` | `apps/frontend/eslint.config.mjs:88` |
| B-2 | The widening landed **2026-06-13**, Phase 115 | `7c47b35b7`; the config comment at `:79-82` states it in-tree |
| B-3 | The guard block spans **`eslint.config.mjs:87-110`** — `files` at `:88`, `paths` (the `svelte/store` ban) at `:93-100`, `patterns` (the inherited deep-relative-`lib` ban, re-included verbatim because flat config REPLACES rather than merges) at `:101-108` | measured; **inner array ranges are approximate — re-measure before citing them in any artifact** (Phase 143 research found them off by one) |
| B-4 | **Zero real `svelte/store` imports** exist under `apps/frontend/src`. `git grep -n "from 'svelte/store'" -- apps packages` returns exactly **2 lines, both in `eslint-store-guard.test.ts`** (`:14` a doc comment, `:42` the fixture string the positive control lints) | measured |
| B-5 | ⚠ **The loose grep returns 10 lines across 5 files**, not "five mentions". The prose set is **4 files**: `dataContext.type.ts:6`, `SettingsOverlay.svelte.ts:27`, `component-stores.svelte.ts:10`, **and `supabaseDataProvider.test.ts:17`** — the fourth was missed by the discussion document. The guard test itself contributes 6 of the 10 lines (`:6,11,14,39,40,42`) | measured; → **D-09a** |
| B-6 | ⚠ **`eslint-store-guard.test.ts` is itself a stale record**: `:8` reads `Traceability:.3 (met-via-Phase-115).` — the requirement ID has been stripped — and `:12` cites the guard block as `lines 77-84`, which is now `87-110` | measured; → **D-12a** |
| B-7 | The standing guard test proves the guard at **exactly one path**, `src/lib/_guards/__store_guard_probe__.ts` (virtual — `lintText`'s `filePath`, no file is written) | `eslint-store-guard.test.ts:32-55` |
| B-8 | ⚠ The exclusion list is **16 entries**, `eslint.config.mjs:23-40`, one of them a negation (`'!**/.env.example'`). The block spans 18 *lines* — **two of them are comments**, which is where this document's first draft got 18. | re-measured; → **D-11a** |
| B-9 | ⚠ `'**/_spikes-*/**'` is at **`:40`**, not `:42`, and matches **nothing** — `find apps -type d -name "_spikes*"` returns empty | re-measured; → **D-11a** |
| B-10 | The lint gate is `eslint --flag v10_config_lookup_from_file src/` | `apps/frontend/package.json:10` |
| B-12 | ⚠ **`no-restricted-syntax` is already occupied.** `packages/shared-config/eslint.config.mjs:79-85` sets it to ban `TSEnumDeclaration` ("Use const assertion or a string union type instead."). Because flat config REPLACES rule option arrays, a naive **D-06** edit **deletes that ban for all of `apps/frontend/src/**`** — and there are **zero enums in the frontend today**, so the loss produces zero errors and would ship invisibly | re-measured; → **D-06a** |
| B-13 | ⚠ **`yarn lint:check` is Turborepo-cached.** `turbo.json`'s `lint` task has **no `"cache": false"`**, unlike `test:unit`, which has it | re-measured; → **D-02a** |
| B-11 | The todo `.planning/todos/pending/2026-06-04-extend-svelte-store-eslint-guard-app-wide.md` is **open**, carries `resolves_phase: 143`, and predicts "Expect this to surface existing `svelte/store` usages" — superseded 9 days after filing, and it surfaced nothing | measured |

### Measured reach: where the guard fires and where it is silent

Probed through the ESLint API with `flags: ['v10_config_lookup_from_file']` — the exact flag B-10's
real gate uses, so the probe resolves the same config.

| # | Probe | Result | Disposition |
|---|---|---|---|
| 1-4 | `__p__.ts` under each of the four SC-1 directories | **FIRES** ×4 | SC-1 sites already covered |
| 5 | the same four as `.svelte` (script block, `svelte-eslint-parser` path) | **FIRES** ×4 | component files covered |
| 6 | `src/lib/components/__p__.svelte.ts` | **FIRES** | rune-module naming covered (matches `*.ts`) |
| 7 | `import type { Writable } from 'svelte/store'` | **FIRES** | type-only imports are **not** exempt |
| 8 | `export { writable } from 'svelte/store'` | **FIRES** | re-export covered |
| 9 | `src/routes/__p__.ts` | **FIRES** | old scope still covered — no regression from the widening |
| 10 | `src/lib/components/__p__.js` | **silent** | **GAP — closed by D-05** |
| 11 | `await import('svelte/store')` | **silent** | **GAP — closed by D-06** |
| 12 | `import { tweened } from 'svelte/motion'` | **silent** | out of scope, recorded — **D-07** |
| 13 | `apps/frontend/vite.config.probe.ts` (outside `src/`) | **silent** | out of scope, recorded — **D-08** |
| 14 | `export const x = $state(0)` in `src/lib/components/` | **silent** | negative control holds — no false positive |

**Gap 10's blast radius is measured zero:** the only `.js` files under `apps/frontend/src` are the 12
generated paraglide ones, gitignored (`src/lib/paraglide/.gitignore` = `*`) **and** already lint-excluded
at `packages/shared-config/eslint.config.mjs:35`. Zero is the *prediction*; **D-05** requires it be
re-measured after the change, not assumed.

</baseline>

---

<decisions>
## Implementation Decisions

All 15 discussion items are resolved, every one at its ★ RECOMMENDED option. Every decision below is
**locked** — the planner and executors implement it, they do not re-derive it. The two ⚠ DERIVED
entries (**D-09a**, **D-12a**) are consequences of re-measurement that the checkboxes do not settle;
they are recorded here as decisions rather than left to an executor's improvisation.

### D-01 — The phase is re-scoped to "prove the reach, close the measured gaps, correct the record" (B1 ★)

Phase 143 keeps its number and both requirements. It delivers: (1) the two-run control at all four
SC-1 sites (**D-02**); (2) closure of gaps 10 and 11 (**D-05**, **D-06**); (3) the standing four-site
guard test (**D-04**); (4) ASSERT-09 discharged as a measured zero (**D-09**); (5) the record
correction (**D-12**).

**The title needs rewriting** — the phase does real work, but not the work its current title implies.
That rewrite is part of **D-12**.

### D-02 — The OLD (blind) half is produced by in-place narrow → measure → restore (B2 ★)

SC-1 requires the four injections to PASS under the pre-change guard scope. That scope has not existed
since 2026-06-13, so the blind half must be reconstructed. The milestone rule is explicit that a check
never *observed* failing is not satisfied "however green the suite looks".

Procedure, which is Phase 141's `141-ASSERT10-LEDGER.md` discipline verbatim:

1. Temporarily set `eslint.config.mjs:88` back to
   `['src/lib/contexts/**/*.{ts,svelte}', 'src/routes/**/*.{ts,svelte}']`.
2. Run the four injections through the **real `yarn lint:check`** — not the ESLint API. The
   requirement's wording ("fails `yarn lint:check`") names the real gate, so the real gate is what
   gets measured.
3. Record all four **GREEN (blind)** in the ledger.
4. Restore, and **prove the restore** with `git diff --exit-code` on the config file.

**The ledger must record the HEAD and the restore proof or the evidence is worthless.** The working
tree is deliberately broken for the duration of step 2; no other work may interleave.

### D-03 — 3 plans, fully serial (B3 ★)

Mirrors 142.1. Wave 2 is the only one that writes product bytes.

| Plan | Content |
|---|---|
| **143-01** | Open `143-NEGATIVE-CONTROL-LEDGER.md` with **every row written before the first injection** (the 142.1 D-19 rule). Measure every OLD half on the **untouched tree**. Take the full pre-existing-usage inventory (**D-09**) and the out-of-scope measurements (**D-07**, **D-08**). Satisfies SC-2's "untouched tree first" ordering as a *structural* fact of the plan sequence, not an honour-system claim. |
| **143-02** | Land the config change (**D-05**, **D-06**), the extended guard test (**D-04**), and the record corrections (**D-12**, **D-12a**) together. Measure every NEW half. |
| **143-03** | Gates (**D-14**, **D-15**) + reconciliation: ledger completion, `REQUIREMENTS.md` evidence clauses, phase record. |

SC-2 makes the measure-before-change ordering a **criterion**, not a preference — which is why the
three-commit ceremony is worth it for a small change.

### D-04 — The standing guard test grows to a table-driven 4 × 2 matrix (C1 ★)

`eslint-store-guard.test.ts` proves the guard at one path (B-7). SC-1 names four directories. A guard
proven at one path is not proven at four, and the glob could regress to a narrower one without that
test noticing.

Rewrite as table-driven over **4 dirs × {`.ts`, `.svelte`}** — eight positive cases — plus the
existing negative control, plus one dynamic-import probe from **D-06**. In the **same file**.

The file's stated correctness invariants (`:20-29`) are load-bearing and must survive the rewrite:

- `filePath` MUST resolve under `apps/frontend/src/**` or the scope does not apply and the test gives
  a false PASS.
- `new ESLint({ flags: ['v10_config_lookup_from_file'] })` is MANDATORY — it loads the real config,
  matching B-10's gate exactly.
- Filter on `ruleId === 'no-restricted-imports'`, never a bare `errorCount` — the violating fixture
  also trips `import/newline-after-import`. **D-06**'s probe filters on
  `ruleId === 'no-restricted-syntax'` for the same reason.

The separate-spec approach also side-steps the flat-config REPLACE-not-merge trap the file's header
already documents. Runtime cost is negligible (ESLint API, no file writes).

### D-05 ⚠ — The glob widens to `src/**/*.{ts,js,mjs,cjs,svelte}` (C2 ★)

Gap 10. This is the one place where the phase's stated goal — *"the guard that claims the frontend is
store-free actually covers the frontend"* — is **literally, currently false**, and the fix is one glob
edit at `eslint.config.mjs:88`.

`.mjs` and `.cjs` are included alongside `.js`: leaving them out leaves the next hole identical to
this one.

**Required post-change measurement:** the widened glob also applies the inherited deep-relative-`lib`
`patterns` ban (B-3) to `.js`/`.mjs`/`.cjs` files. Predicted fallout is zero; **re-run
`yarn lint:check` and confirm zero new violations as a measurement**, and record it. Do not assume it.

### D-06 — Dynamic `import('svelte/store')` is closed with `no-restricted-syntax` (C3 ★)

Gap 11. `no-restricted-imports` inspects static `ImportDeclaration` nodes only, so
`await import('svelte/store')` passes the gate.

Add a `no-restricted-syntax` entry **in the same config block**, selector
`ImportExpression[source.value='svelte/store']`, message pointing at the same rune guidance as the
`paths` entry. Add **one probe to the guard test** so the closure is itself proven (**D-04**).

**Mitigation for the split:** two rules now carry parts of one ban, so a future reader must find both.
Tie them together with a comment at the config site.

### D-07 — `svelte/motion` is out of scope; measured, recorded, and filed (C4 ★)

`tweened` and `spring` return store contracts and both have Svelte-5 class replacements (`Tween`,
`Spring`) — but neither is `svelte/store`, and neither ASSERT-08 nor ASSERT-09 mentions them. Banning
them carries its own migration fallout: any live call site must move to `Tween`/`Spring` **before** the
ban can land green, which turns a fallout-free evidence phase into a migration phase.

Record probe 12's measurement in the ledger. **File a todo** for a `svelte/motion` ban as its own small
phase.

### D-08 — Files outside `src/` are out of scope; recorded and filed (C5 ★)

Probe 13. The phase boundary is `apps/frontend/src/**` in both ASSERT-08 and the roadmap goal. That
five config files sit outside **every** lint gate is a real, recorded, adjacent gap — and a
lint-script-scope decision, not a store-guard decision.

Record it here and in the ledger. **File a todo** for the lint-script scope.

### D-09 — ASSERT-09 is discharged as a measured zero with a per-file disposition table (D1 ★)

"Triage every pre-existing usage" is satisfied **as written** when every pre-existing usage has a
disposition and the set happens to contain no real imports. What makes that auditable rather than
hand-waved is: the **exact commands**, the **HEAD** they ran at, and a **per-file row** for every hit.

The table classifies each site as *prose* / *test fixture* / *real import*, with `file:line`. A table
of rows that all say "not an import" is the point — it is falsifiable a year from now in a way that
marking ASSERT-09 "N/A" is not.

The four prose mentions are **not** migrated: they are the historical explanation of why the seam was
removed. Deleting them would delete the record.

### D-09a ⚠ DERIVED — The disposition table covers 5 files / 10 lines, not "five mentions"

The discussion document's D1 lists five sites and three prose files. Re-measurement at the same HEAD
(B-5) shows **four** prose files — `supabaseDataProvider.test.ts:17` was missed — and **10 lines across
5 files** for the loose grep.

Both greps are re-run at the executing HEAD and **both counts recorded**; the table is built from that
measurement, not from this document's number. If the count differs again at execution time, the
measurement wins and the delta is stated. The strict grep's result (**2 hits, 1 file, 0 real imports**)
is the one that discharges ASSERT-09; the loose grep's result is the disposition table's input.

**Recorded per the standing rule that a stale count is amended at its source, not annexed by an
addendum** — a `missing:`-style item left uncorrected propagates false premises into later phases.

### D-10 — SC-4's independent grep is one-time and recorded, not a standing gate (D2 ★)

SC-4 asks for a verification, not a gate. Record the command, HEAD and output in the ledger. The
**standing** protection is the lint rule plus **D-04**'s four-site test.

A standing grep spec is explicitly rejected: it would need its own allowlist for the five prose/fixture
sites, and an allowlist drifts and eventually gets broadened to silence a legitimate mention — the
exact anti-pattern SC-3 forbids for the exclusion list.

### D-11 — The dead `'**/_spikes-*/**'` ignore stays; it is recorded as measured-dead (E1 ★)

SC-3 requires the exclusion list end the phase no larger than it started. **Nothing is added by any
decision in this phase.** State in the ledger: **16 entries before, 16 after, 0 additions**, and note
that `eslint.config.mjs:40` currently matches nothing (B-9).

**The count must be re-measured at execution HEAD and stated from that measurement** — see **D-11a**.
SC-3 asks for the size to be *stated*; stating it wrongly does not satisfy it.

Deleting it is rejected as a gratuitous edit to a config the phase otherwise touches at one line, and
it would re-break anyone reintroducing a `_spikes-*` fixture directory expecting the exemption.
Leaving it *unmentioned* is also rejected — SC-3 asks for the list's size to be **stated**.

### D-12 ⚠ — All record targets are corrected in-phase, naming `7c47b35b7` at each (F1 ★)

The milestone's own rule — *"three targets that disagree are worse than one that is silent, because
each looks authoritative"* — was written for exactly this situation.

| Target | Correction |
|---|---|
| `ROADMAP.md:264` (the phase line) | Rewrite to the **D-01** shape. The widening is stated as landed in `7c47b35b7`, 2026-06-13, Phase 115. |
| `ROADMAP.md` § Phase 143 SC-1 | Restate: the OLD half is produced by **reconstruction** per **D-02**, since the pre-change scope no longer exists. |
| `ROADMAP.md` § Phase 143 SC-2, SC-3 | SC-2's "widening is run against the untouched tree first" **cannot be satisfied literally** — there is no widening to run. Restate as the measure-before-change ordering **D-03** enforces. SC-3's fallout triage becomes **D-09**'s measured zero. |
| `.planning/todos/pending/2026-06-04-extend-svelte-store-eslint-guard-app-wide.md` | Move to `completed/`, citing `7c47b35b7` and stating it was superseded 9 days after filing and surfaced nothing. |
| `REQUIREMENTS.md` ASSERT-08 / ASSERT-09 (`:62-63`) + the status rows at `:153-154` | Add evidence clauses in the 141 / 142.1 house style: ledger path, counts, HEAD. Flip the checkboxes **only after the gates run** — the 142.1 precedent, which deliberately reverted a premature tick. |

**Follow Phase 141's correction convention:** state plainly that the earlier wording was **wrong when
written**, and why. Do not silently overwrite.

**The binding constraint on this decision:** editing a roadmap's own success criteria mid-phase needs
care. **The rewritten SC must be *harder* to satisfy than the original, not softer**, or the correction
reads as scope reduction. A plan that rewrites an SC must show the before/after and argue the direction.

### D-12a ⚠ DERIVED — `eslint-store-guard.test.ts` is a fifth record target

F1 named four targets; B-6 measured a fifth. The file **D-04** is already rewriting carries two stale
claims that must be fixed in the same edit:

- `:8` — `Traceability:.3 (met-via-Phase-115).` The requirement ID has been stripped, leaving a
  dangling `.3`. Restore it to name **ASSERT-08** and the Phase-115 supersession explicitly.
- `:12` — cites the guard block as `apps/frontend/eslint.config.mjs` "lines 77-84". The block is
  **87-110** (B-3), and will move again under **D-05**/**D-06**. Either cite the post-change lines or
  drop the line citation in favour of a stable anchor; do not leave a number that is already wrong.

The header's correctness-invariant block (`:20-29`) is **preserved** — see **D-04**.

### D-06a ⚠ DERIVED — The `no-restricted-syntax` array must re-include the `TSEnumDeclaration` ban verbatim

**This is the phase's one plan-breaking hazard, and it is the second occurrence of a trap this very
config file already documents at `:83-86` for `no-restricted-imports`.**

`packages/shared-config/eslint.config.mjs:79-85` already sets `no-restricted-syntax` to ban
`TSEnumDeclaration` (B-12). Flat config **replaces** a rule's option array rather than merging it, so
adding **D-06**'s `ImportExpression` selector as a fresh array **silently deletes the enum ban for
every file under `apps/frontend/src/**`**.

What makes it dangerous rather than merely wrong: there are **zero enums in the frontend today**, so
the deletion produces **zero new errors**. Every gate stays green. The regression ships invisibly and
surfaces months later as "someone added an enum and nothing stopped them".

**Required:** the frontend block's `no-restricted-syntax` array carries **both** entries — the
`TSEnumDeclaration` ban copied verbatim from shared-config, and the `ImportExpression` selector — with
a comment at the site tying the re-inclusion to the same REPLACE-not-merge reason the `patterns` array
already carries.

**Required evidence:** an **enum regression case in the standing matrix spec** (**D-04**), not a
one-time `--print-config` assertion. A standing case is the only mechanism that would catch a
recurrence, and it lives in the file **D-04** already rewrites. Research measured both directions: an
enum fixture errors under the current config and lints clean under the naive patch.

**Assertion disambiguation:** after **D-06** both bans report `ruleId === 'no-restricted-syntax'`.
Matrix assertions **match on the `message` substring**, never on line/column — the same discipline as
the existing `ruleId` filter, one level down.

### D-02a ⚠ DERIVED — Every ledger measurement runs cache-busted

`yarn lint:check` is Turborepo-cached (B-13). At a clean tree `@openvaa/frontend#lint` is a **cache
HIT**. This is an evidence-integrity hazard aimed precisely at **D-02**: a cached exit 0 replayed
under the narrowed config is indistinguishable from a measured blind GREEN, and **GREEN blind halves
are exactly what D-02 exists to produce**.

Research measured the exposure as one-directional and bounded: an untracked injection file **does**
bust the task hash (`06c4b14…` → `df59799…`), so a first-time injection genuinely executes. The
residual risk is a *repeat* measurement at an unchanged hash.

**Required:** every ledger row's lint invocation runs with **`TURBO_FORCE=true`** (measured to flip
HIT→MISS at an unchanged hash), and the ledger records the variable as part of the command. **`yarn
lint:check --force` does NOT work** — yarn appends the argument to the end of the `&&` chain rather
than passing it to turbo. Do not use it and do not let a plan substitute it.

### D-11a ⚠ DERIVED — The exclusion-list count is 16, and is re-measured before it is stated

This document's first draft said 18 entries at `:22-42` with the dead ignore at `:42`. Re-measurement
(B-8, B-9) gives **16 entries at `:23-40`**, dead ignore at **`:40`** — the block spans 18 *lines*, two
of which are comments.

SC-3 requires the list's size to be **stated**. Stating it wrongly does not satisfy SC-3; it
manufactures a fresh record error inside the phase whose purpose is correcting record errors. The
count is therefore **re-measured at execution HEAD** and stated from that measurement, and the
correction of this document's own number is recorded in the ledger alongside **D-09a**'s and
**D-12a**'s — third of the same class.

### D-13 — Evidence lives in `143-NEGATIVE-CONTROL-LEDGER.md` (F2 ★)

Matching `141-ASSERT10-LEDGER.md` / `142-NEGATIVE-CONTROL-LEDGER.md` /
`142.1-NEGATIVE-CONTROL-LEDGER.md`. Rows written **before** the first injection (the 142.1 D-19 rule),
each carrying **assertion site, command, exit code, and the HEAD it ran at**. `143-GATES.md` is
rejected — it would be a fourth naming convention for one artifact class inside one milestone.

### D-14 — Five static gates + one full E2E run (G1 ★)

| Gate | Command |
|---|---|
| 1 | `yarn test:unit` |
| 2 | `yarn lint:check` |
| 3 | `yarn format:check` |
| 4 | `yarn build` |
| 5 | `yarn workspace @openvaa/frontend check` |
| 6 | `yarn test:e2e` — **once** |

Gate 5 is 142.1's addition and is **not** optional: neither lint nor build typechecks
`apps/frontend/src`, and CI runs that typecheck as its own step.

Gate 6 runs under CLAUDE.md's cardinal rule. The cardinal rule **admits no "cannot plausibly affect it"
exemption**, and a config-only change is exactly the kind assumed inert that occasionally is not. One
run, not three — this phase introduces no source of nondeterminism, so extra runs buy nothing.

### D-15 — The E2E gate follows the standard prereq (G2 ★)

`yarn db:reset` + **one fresh dev server** on `:5173`, then the single suite run. Cheap, and it removes
"stale server / dirty DB" from the list of things a red run could mean. The Phase-137 preflight proves
the server came from this checkout — it does **not** prove the DB is clean.

</decisions>

---

<success_criteria>
## What Must Be TRUE at Phase Close

Restated to the **D-01** shape. Per **D-12**'s binding constraint, each is *harder* than the original
it replaces — the original SC-1 asked for one injection outcome per site, these ask for both halves
plus a standing test; the original SC-2/SC-3 described work that cannot be performed at all.

1. **SC-1 (was SC-1)** — a `svelte/store` import injected into each of `lib/components`, `lib/utils`,
   `lib/dynamic-components` and `lib/candidate/components` **FAILS `yarn lint:check`** naming the file
   and the rule; **and** the same four injections **PASS** under the pre-115 scope reconstructed per
   **D-02**, with the restore proven byte-identical. **8 measured halves, 0 cited.**
2. **SC-2 (was SC-2)** — every OLD half and the complete pre-existing-usage inventory are recorded in
   `143-NEGATIVE-CONTROL-LEDGER.md` on the **untouched tree**, in a commit that precedes the commit
   changing the config. The ordering is structural, not asserted.
3. **SC-3 (was SC-3)** — every hit from both greps carries a per-file disposition (**D-09**,
   **D-09a**); the exclusion list ends the phase at **16 entries, 0 additions** (**D-11**, **D-11a**); no site is
   silenced by broadening it.
4. **SC-4 (was SC-4)** — `yarn lint:check` is clean app-wide and `apps/frontend/src/**` contains no
   unexplained `svelte/store` import, verified by grep independently of the lint rule, with command +
   HEAD + output recorded (**D-10**).
5. **SC-5 (new)** — the two measured reach gaps are closed and each closure is **proven by its own
   probe**: a `.js` file under `src/` importing `svelte/store` fails the gate (**D-05**), and
   `await import('svelte/store')` fails the gate (**D-06**). Both probes are standing tests, not
   one-time measurements.
6. **SC-6 (new)** — the guard is proven at **four directories × two extensions** by a standing spec
   (**D-04**), not at one probe path.
7. **SC-7 (new)** — all five record targets are corrected, each naming `7c47b35b7` (**D-12**,
   **D-12a**), and each rewritten success criterion is shown to be harder than the one it replaces.
8. **SC-8 (new)** — all six gates green (**D-14**), under **D-15**'s prereq, each with command, exit
   code, counts and log path in the ledger's gate section.
9. **SC-9 (new, from D-06a)** — the inherited `TSEnumDeclaration` ban **survives** the
   `no-restricted-syntax` edit, proven by a **standing** matrix case: an enum fixture under
   `apps/frontend/src/**` still errors after the change. The two-run control is run here too — the
   case is observed RED against the naive single-entry patch before it is observed GREEN against the
   shipped two-entry one.

</success_criteria>

---

<constraints>
## Constraints and Hazards

- **The milestone's standing acceptance rule governs** (`REQUIREMENTS.md:7-13`): prove the guard fails
  before claiming it guards — negative control run twice, once against the old assertion to demonstrate
  blindness, once against the new one to demonstrate the catch.
- **Ledger rows are written before the first injection.** The 142.1 D-19 rule. A row invented after the
  measurement is not evidence.
- **`D-02` deliberately breaks the working tree.** No other work may interleave with the narrow →
  measure → restore window, and the restore must be proven by `git diff --exit-code`, not asserted.
- **Flat config REPLACES, it does not merge.** The `patterns` array in the frontend guard block
  re-includes the inherited deep-relative-`lib` ban verbatim for exactly this reason. Any edit to the
  block must preserve it, or that ban silently disappears for every in-scope file. **The same trap
  applies a second time to `no-restricted-syntax` — see D-06a. It is the single most likely way this
  phase ships a silent regression, precisely because the regression produces zero errors.**
- **Every ledger lint measurement runs `TURBO_FORCE=true`** (**D-02a**). A cached exit 0 replayed
  under the narrowed config is indistinguishable from a measured blind GREEN. Never `--force`.
- **The restore proof extends beyond the tracked config.** `git diff --exit-code` on
  `apps/frontend/eslint.config.mjs` is correct but **blind to untracked injection files**. Use Phase
  141's three-assertion form: tracked-diff clean, **untracked-injection set empty**, and the config
  blob hash byte-identical to its pre-narrow value (`git hash-object`).
- **`yarn lint:check` short-circuits on `&&`.** A RED row means the *first* failing step failed; the
  later `eslint tests` / `typecheck:tests` steps **never ran**. The ledger must say so rather than
  implying a full-gate result.
- **Ban reach is stated honestly, not over-claimed.** Closed: static import, type-only import,
  re-export, dynamic `import('svelte/store')`, and `require()` (via
  `@typescript-eslint/no-require-imports`). Template-literal specifier escapes the selector but is
  independently rejected by `quotes`. Subpath `svelte/store/index.js` is uncovered but **unresolvable**
  (svelte's `exports` map has no subpath under `./store`). A **computed specifier `import(n)` is
  genuinely open and no static rule can close it** — state this in the ledger; do not claim the ban is
  total.
- **`v10_config_lookup_from_file` is mandatory** in any ESLint-API probe, or the probe resolves a
  different config than the real gate (B-10) and measures nothing.
- **Never assert on a bare `errorCount`** in the guard test — the violating fixtures trip unrelated
  rules. Filter by `ruleId`.
- **Checkboxes flip after gates, not before.** 142.1's `142.1-02` deliberately reverted a premature
  tick; ASSERT-07's early flip is the pattern being avoided.
- **Zero runtime bytes ship.** If a plan finds itself editing product code outside
  `apps/frontend/eslint.config.mjs` and `apps/frontend/src/lib/_guards/`, that is a scope breach —
  stop and surface it.

</constraints>

---

<open_questions>
None open. All 15 discussion decisions are resolved at their ★ RECOMMENDED option. **Five**
re-measurement deltas are settled as derived decisions — **D-02a**, **D-06a**, **D-09a**, **D-11a**,
**D-12a** — three of them surfaced by Phase 143 research and each independently re-verified before
being written here.

The three questions research left open are resolved as follows, so the planner does not re-open them:

1. *Enum regression case — standing or one-time?* → **Standing matrix case** (**D-06a**). It is the
   only mechanism that catches a recurrence, and it lives in the file **D-04** already rewrites.
2. *How do assertions disambiguate two `no-restricted-syntax` bans?* → **Match on the `message`
   substring**, never line/column (**D-06a**).
3. *Do the count corrections amend CONTEXT.md or only the ledger?* → **Amended at source, here, before
   planning** (**D-11a**), and also recorded in the ledger. A stale count left in a locked baseline
   propagates into SC-3 itself.
</open_questions>
