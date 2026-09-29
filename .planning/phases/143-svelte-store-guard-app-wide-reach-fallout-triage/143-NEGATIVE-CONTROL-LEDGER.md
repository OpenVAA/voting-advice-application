# Phase 143 — Negative-Control Ledger: the svelte/store guard observed blind, then observed catching

**Nineteen rows, one apparatus, one machine — and not one borrowed observation anywhere in the
register.** Phase 142 could borrow Phase 139's OLD halves because 139 had measured them. This phase
cannot borrow anything at all: the pre-115 guard scope — `src/lib/contexts/**` plus `src/routes/**` —
**has not existed since `7c47b35b7` (2026-06-13, Phase 115)**, so there is no recorded observation of a
`svelte/store` import passing the gate in `lib/components`, `lib/utils`, `lib/dynamic-components` or
`lib/candidate/components` anywhere to point at. The blind half has to be **reconstructed and measured
here**, then proven undone. A row whose run did not execute keeps its `pending` cells and carries **no**
outcome — never a confirmed one — because a measurement that did not run counts as a failure, not a pass
(`CLAUDE.md` § E2E Hard Rule, generalised; `139-VERDICTS.md:5-9`).

- **Phase:** 143 (svelte-store-guard-app-wide-reach-fallout-triage)
- **Requirement:** **ASSERT-08 / ASSERT-09**
- **Opened by:** `143-01-PLAN.md` (wave 1). **Every row is created here, before the phase's first
  injection.** The OLD-half cells are filled by this same plan; the NEW-half cells are filled by
  `143-02` (D-03 serial order, D-13 artifact).
- **Corpus:** exactly **19 rows** — 4 SC-1 injection pairs (**8 measured halves**), 2 gap pairs
  (`.js` extension and dynamic `import()`), 1 SC-9 vitest pair, 1 must-NOT-fire control, 1 clean
  baseline, 1 restore row, 1 fallout measurement, 1 closing revert.
- **Protocol source:** `139-VERDICTS.md` § 3.1 HYGIENE-LOOP, reused via `142.1-01-PLAN.md` (D-02) and
  adapted here for a **lint** instrument rather than a vitest one.
- **Baseline for OLD halves:** none inherited, none inheritable. **The word for a borrowed observation
  is not a legal value in any cell of this register** — see § Measurement, never citation. Every row
  carries its own log path and the HEAD its own half was taken at.
- **HEAD at ledger creation:** `289f80e8c` — branch `feat-gsd-roadmap`. **OLD and NEW rows legitimately
  carry different HEADs**, because the config change (`143-02`) lands *between* the two halves — the
  142.1 D-20 precedent. Each row records the HEAD its own half was measured at.
- **Machine:** developer Mac, host Node, runs issued from the repository root. macOS 26.5.1 arm64 /
  Darwin 25.5.0 / Node v24.14.1. **No container:** this ledger records lint and vitest exit codes only,
  never a visual baseline, so the milestone's container rule for baselines does not apply.
- **Resolved `$TMPDIR`:** `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/` — so every
  `${TMPDIR:-/tmp}/gsd-143/…` log reference below resolves to
  `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-143/…`. Recorded for the same reason 139 and
  142.1 recorded theirs: **a log path that cannot be resolved later is not evidence.**
- **Restoration target (the blob hash):** `git hash-object apps/frontend/eslint.config.mjs` →
  **`f6cea0a65cdd8d7cd77d734a17929b35510fe796`**, measured at ledger creation and identical to the value
  measured at planning HEAD `3111281dc`. Row `C` must return to exactly this value.
- **Post-change restoration target (the blob hash, from `143-02` Task 1 onward):**
  `git hash-object apps/frontend/eslint.config.mjs` → **`982db9af8880089375aecd56060bb778568f49c0`**,
  measured immediately after the D-05 glob widening and the D-06/D-06a two-entry `no-restricted-syntax`
  array landed and the file was run through `npx prettier --write`. It **differs** from the pre-change
  `f6cea0a65cdd8d7cd77d734a17929b35510fe796` by construction — that is the point of the change. **Rows
  `E-OLD`/`E-NEW` (Task 3) and rows `N1`-`N4`, `G1-NEW`, `G2-NEW`, `Z` (Task 4) assert against THIS
  value, never against the pre-change one.** Asserting `f6cea0a6…` after Task 1 would fail for the
  correct reason and prove nothing.
- **Pre-existing-warning baseline:** the frontend lint is **error-free but not warning-free**. A
  `unused-imports/no-unused-vars` warning at
  `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts:39` appears in **every** run.
  Every clean run therefore reads **`0 errors (1 pre-existing warning)`**, and the `Errors` cell counts
  **errors**, never "problems".
- **Decisions discharged by this ledger:** D-02 (narrow → measure → restore), D-02a (cache-busted
  measurement), D-03 (serial plan order making the ordering structural), D-05 / D-06 gap premises,
  D-06a (the `no-restricted-syntax` REPLACE trap and its inverted vitest pair), D-07 / D-08
  (out-of-scope measurements), D-09 / D-09a (the two disposition tables), D-10 (SC-4's one-time
  verification), D-11 / D-11a (the re-measured exclusion list), D-13 (this artifact), D-14 (the gate
  section).
- **Precedent followed:** `142.1-NEGATIVE-CONTROL-LEDGER.md` is this ledger's template for naming,
  header field set, the rows-first ordering rule and the gate section; `141-ASSERT10-LEDGER.md` is its
  template for the row schema and the three-assertion restore proof. See § Precedent chain.

---

## Why this ledger exists — and what it does NOT claim

**This phase did not build the guard, and the roadmap line that opened it described work that had
already landed.** `7c47b35b7` — *`refactor(115-02): widen svelte/store ESLint guard to
src/**/*.{ts,svelte} (SWEEP-03)`*, 2026-06-13, Phase 115 — widened the guard from the old
`lib/contexts/**` + `routes/**` pair to the whole `src/**` tree, **nine days after** the todo asking for
that widening was filed (`.planning/todos/pending/2026-06-04-extend-svelte-store-eslint-guard-app-wide.md`).
The config says so in-tree at `apps/frontend/eslint.config.mjs:74-82`. The construction work Phase 143
was scoped to perform therefore did not exist to be performed.

What was genuinely unsatisfied is **ASSERT-08's proof clause**, under the milestone's standing
acceptance rule (`REQUIREMENTS.md:7-13`):

> **prove the guard fails before claiming it guards** — negative control run twice, once against the old
> assertion to demonstrate blindness, once against the new one to demonstrate the catch.

Phase 115 widened the glob and moved on. Nobody ever made the *old* scope let a `svelte/store` import
through on purpose, and nobody ever made the *new* scope catch one at the four SC-1 directories.
A guard observed only green is indistinguishable from a guard that cannot fail. **This ledger is that
missing evidence, plus the pre-existing-usage inventory ASSERT-09 requires, and nothing more.**

**Provenance of every row below.** Every exit code, every turbo verdict line, every count and every
quoted message in this document was produced by a command executed inside plan `143-01` (OLD halves,
control, baseline, restore) or plan `143-02` (NEW halves), on the dates recorded per row.
`143-RESEARCH.md` carries `[MEASURED]` annotations from the research pass; **those are pre-registered
expectations, not evidence.** They tell a row what it should see. They never fill a cell.

### The three source-amended count corrections

`143-CONTEXT.md`'s own re-measured baseline facts **B-3**, **B-8** and **B-9** were amended **at source**
in commit `f28da99d3`, before planning began:

- **B-8** — the exclusion array spans **18 lines**, of which **two are comments**; the list holds **16
  entries**. An early draft read the line count as the entry count.
- **B-9** — the dead ignore `'**/_spikes-*/**'` sits at **`:40`**, not `:42`.
- **B-3** — the guard block's two inner array ranges (`paths`, `patterns`) were **off by one**.

This is the standing amend-at-source rule, and it is the third instance of the class **D-09a** and
**D-12a** already establish: a stale count left inside a locked baseline propagates into SC-3 itself.
**Every count in the sections below is re-measured at execution HEAD regardless of what the baseline
says. If a count differs again, the measurement wins and the delta is stated explicitly.**

---

## Measurement, never citation — the clause that keeps this ledger honest

`141-ASSERT10-LEDGER.md:47-52` states that its template document *"is never the source of truth for any
outcome here — its rows were re-run, not copied."* 142.1 needed the blunt version of that clause because
its criterion 4 was categorical. **143 needs the blunt version for a different and stronger reason: there
is nothing in existence to borrow from.**

The rule:

1. **The literal word for a borrowed observation — the past participle of "to cite" — is not a legal
   value in any cell of this register.** The pre-115 guard scope has not existed since 2026-06-13. No
   document anywhere records a `svelte/store` import passing `yarn lint:check` at any of the four SC-1
   directories, because by the time anyone thought to look, the widening had already landed. A row that
   borrowed such an observation would be borrowing from a document that does not contain it.
2. Every OLD-half cell therefore states a measurement taken **in `143-01`**, with the log path and the
   HEAD it was taken at — under a scope this plan **reconstructed on purpose and then proved undone**.
3. Every NEW-half cell states a measurement taken **in `143-02`**, after the config change, with its own
   log path and its own (later) HEAD.
4. The word appears in this header, and only in this header, because a register cannot forbid a value it
   refuses to name.

---

## Width delta from the analog

**Nine columns against the analog's five.** `141-ASSERT10-LEDGER.md:77-88` uses
`Row · Branch exercised · Injection site · Exit · Outcome`. This register uses
`Row · Site · Injection file · Command · HEAD · turbo verdict · Exit · Errors · Outcome`.
**The width is deliberate and locked.** The three deltas, each with its reason:

- **`HEAD`** — because **D-03** puts a commit (`143-02`'s config change) *between* the two halves, so
  the two halves of a pair legitimately carry different HEADs and a single ledger-level HEAD would be a
  lie. The 142.1 D-20 precedent.
- **`turbo verdict`** — because **D-02a**. `turbo.json`'s `lint` task declares **no `"cache": false"`**,
  unlike `test:unit`. At a clean tree `@openvaa/frontend#lint` is a cache **HIT**, and a replayed exit 0
  under the narrowed config is **indistinguishable from a measured blind GREEN** — which is exactly what
  rows `B1`-`B4` exist to produce. So the verdict line is a **column**, not a footnote.
- **`Command`** — because two of the nineteen rows (`E-OLD`, `E-NEW`) are measured through **vitest**,
  not the lint gate, and a register that hid its instrument inside prose would let a reader credit an
  enum-case red as a lint-gate red.

**`Errors` is split from `Exit`** for the same reason 142.1 split `NEW-assertion outcome` from
`File outcome`: the frontend lint run is error-free but **not** warning-free, so a row must count
**errors**. Collapsing them into the process exit code is the failure mode 139 § 3.2 was written to
prevent.

**Two standing rules on this width:**

1. **Any extra sub-fact goes *inside* an existing cell, never as an unannounced tenth column.** Where a
   row needs to say more than a cell comfortably holds — row `G1-OLD`'s blast-radius measurement, row
   `C`'s four restore assertions — the extra lives in the `Outcome` cell or in a named section below,
   and the register keeps nine columns.
2. **A row that cannot show `executing` is not a measurement.** If a row's turbo verdict line reports a
   cache replay rather than an execution, the row is **void** and must be re-run. Do not record a
   replayed exit code. And do **not** substitute `yarn lint:check --force`: yarn appends that argument
   to the *end* of the `&&` chain rather than passing it to turbo, so it busts nothing.

### ⚠ Measured verdict string — stronger than the one predicted

`143-01-PLAN.md` predicts the verdict line will read **`cache miss, executing <hash>`**. **Measured at
execution (turbo 2.8.17): it reads `cache bypass, force executing <hash>`.** Both contain `executing`,
so the standing rule and its acceptance grep are satisfied — but the measured string is the **stronger**
of the two, and the difference matters:

- `cache miss, executing` means turbo *looked* in the cache and found nothing. That can happen for
  reasons unrelated to `TURBO_FORCE` (a changed input hash, a cold cache).
- `cache bypass, force executing` means turbo **did not consult the cache at all, because
  `TURBO_FORCE=true` was in effect**. It is direct evidence that the cache-bust took, not an inference
  from the absence of a replay.

Every row below therefore records the **`@openvaa/frontend:lint`** task's own verdict line — the task
that actually runs the guard — plus turbo's aggregate `Cached: 0 cached, 11 total`, which independently
confirms that **none** of the eleven tasks was replayed. The predicted string is recorded here as a
delta rather than silently normalised to it.

### ⚠ Disclosure — the specified `find` pattern does not cover all six fixtures

The restore assertion this phase inherits is written as
`find apps/frontend/src -name '__store_guard_inject__*'`. That glob requires **two** underscores after
`inject`, so it matches the five `__store_guard_inject__.{ts,js}` fixtures but is **blind to
`__store_guard_inject_dyn__.ts`** (row `G2-OLD` / `G2-NEW`), whose name reads `inject_dyn`. A restore
proved only by the specified pattern would not have detected a surviving dynamic-import fixture.

**Both patterns are therefore run and recorded at every post-gate and in the row `C` restore proof:**
the specified `'__store_guard_inject__*'` (kept, because it is what the plan's criteria assert) **and**
the broader `'__store_guard_inject*'`, which covers all six. This is the same reasoning 141 gave for
preferring `find` over `git status` in the first place — the broader instrument is the one that would
miss nothing — applied one level down, to the glob itself.

---

## ⚠ THE INVERSION — read this before reading any row

**In `143-01` every OLD-half observation is expected GREEN (exit 0), and that green *is* the point.** A
guard that has only ever been observed working is indistinguishable from a guard that cannot fail. The
milestone's standing acceptance rule demands the blindness demonstration first.

- Rows **`B1`-`B4`** (the four SC-1 directories, measured under the **pre-115 scope reconstructed** per
  D-02) are expected **exit 0 — GREEN (blind)**. A red here means the narrowing did not take effect and
  the row is worthless.
- Rows **`G1-OLD`** and **`G2-OLD`** (the `.js` extension gap and the dynamic-`import()` gap) are
  expected **exit 0 — GREEN (blind)** against the **unmodified, shipped** config. These two gaps are
  blind at HEAD today; no narrowing is needed to demonstrate them. A red in either removes D-05's or
  D-06's premise outright.
- Row **`NC`** is the **must-NOT-fire control** — 141's row-E analog. Clean rune code injected into
  `lib/components` must leave the gate at **exit 0**. A red here is a **false positive in the guard**, a
  product defect, not evidence.
- Row **`A`** is the clean baseline and **is the restoration target**. Rows **`C`** and **`Z`** must
  reproduce it exactly, or the tree was not restored and some injection fixture survived.

**The polarity inverts at `143-02`**, where the same injection files are expected to exit **1**. Rows
`N1`-`N4`, `G1-NEW` and `G2-NEW` are **RED (catch)** rows: there, a green is a **failure of the
remediation**, not a success. An executor reading this plan's greens as success and `143-02`'s reds as
regression has the phase exactly backwards.

**One row class inverts a second time, inside `143-02` itself.** Rows **`E-OLD`** and **`E-NEW`** measure
the **SC-9** enum regression case through **vitest**, not the lint gate. There:

- **`E-OLD` RED against the naive single-entry `no-restricted-syntax` patch is the success signal** — it
  proves the standing enum case is **not vacuous**, i.e. that the case can actually detect the loss of
  the inherited `TSEnumDeclaration` ban.
- **`E-NEW` GREEN against the shipped two-entry array** proves the inherited ban **survived** the edit.

That pair is the only place in this register where a red and a green are *both* successes, in that
order. Both cells are written with those expectations so `143-02` cannot misread them.

---

## Precedent chain

Appended, not restarted:

**`143-NEGATIVE-CONTROL-LEDGER.md` → `142.1-NEGATIVE-CONTROL-LEDGER.md` → `142-NEGATIVE-CONTROL-LEDGER.md`
→ `141-ASSERT10-LEDGER.md` → `138-NEGATIVE-CONTROL.md` → `137-NEGATIVE-CONTROL.md` →
`136-VISUAL-DISCRIMINATION-EVIDENCE.md`.**

Rows are **not** appended to any earlier ledger. 142.1's corpus is "exactly 8 pairs" and 142's is
"exactly 12 findings"; adding to either would break a count those documents assert about themselves.

---

## Injection register

Nine columns, in this order:
`Row · Site · Injection file · Command · HEAD · turbo verdict · Exit · Errors · Outcome`.

**Ordering guarantee (D-13, inherited from 142.1's D-19, inherited from 142's D-09, inherited from 139):
all nineteen rows below were written and committed before the phase's first injection existed.** Every
measurement cell read `pending` at creation — 19 rows × 5 unfilled cells = **95** occurrences. That
ordering is a property of the commit graph (`143-01` Task 1's commit precedes every injection and
precedes `143-02` entirely), not a claim made in prose about itself.

| Row | Site | Injection file | Command | HEAD | turbo verdict | Exit | Errors | Outcome |
|---|---|---|---|---|---|---|---|---|
| A | none — clean baseline, untouched tree · **restoration target** | — | `TURBO_FORCE=true yarn lint:check` | `b2c5c14b1` | `@openvaa/frontend:lint: cache bypass, force executing 06c4b14151cb0843` · aggregate `Cached: 0 cached, 11 total` | **0** | `0 errors (1 pre-existing warning)` — `candidateContext.svelte.test.ts:39` `unused-imports/no-unused-vars` | **RESTORATION TARGET.** All three `&&` steps ran. `Tasks: 11 successful, 11 total`. Blob `f6cea0a65cdd8d7cd77d734a17929b35510fe796`. Rows `C` and `Z` must reproduce this exactly, or the tree was not restored and some fixture survived. Log `lint-A-1.log` — **amended 2026-08-22 (`143-02` Task 1), at source rather than annexed:** the blob clause holds for row `C` only. Row `Z` runs *after* the D-05/D-06 config change, so its blob is necessarily the **post-change** restoration target `982db9af8880089375aecd56060bb778568f49c0`. What row `Z` must reproduce from row `A` is the **exit code and the error count**, not the blob. |
| NC | `lib/components` · clean rune fixture · shipped config · **must NOT fire** | `src/lib/components/__store_guard_inject__.ts` | `TURBO_FORCE=true yarn lint:check` | `b2c5c14b1` | `@openvaa/frontend:lint: cache bypass, force executing 882b6a9eec15670f` · aggregate `Cached: 0 cached, 11 total` | **0** | `0 errors (1 pre-existing warning)` — identical to row `A`; the fixture contributed **no** message of any kind | **must NOT fire — held.** `export const probe = $state(0);`, no import of any kind, linted live under the shipped guard scope. The guard produces **no false positive on rune code**, so "it fires" is a discriminating signal rather than a constant. 141's row-E analog. Log `lint-NC-1.log` |
| G1-OLD | `.js` extension gap (D-05) · shipped config, **unmodified** | `src/lib/components/__store_guard_inject__.js` | `TURBO_FORCE=true yarn lint:check` | `b2c5c14b1` | `@openvaa/frontend:lint: cache bypass, force executing 2f4dcc063b488b9c` · aggregate `Cached: 0 cached, 11 total` | **0** | `0 errors (1 pre-existing warning)` — the injected import produced **no** message | **GREEN (blind).** A live static `import { writable } from 'svelte/store'` inside `lib/components` passed the entire gate untouched, because the shipped glob is `src/**/*.{ts,svelte}` and simply does not see `.js`. D-05's premise, measured rather than argued. **Blast radius measured separately as zero:** the only `.js` files under `apps/frontend/src` are the **12** generated paraglide ones, gitignored by `src/lib/paraglide/.gitignore` (`*`) and already lint-excluded at `packages/shared-config/eslint.config.mjs:35` (`'**/src/lib/paraglide/**'`); `git ls-files 'apps/frontend/src/**/*.js'` returns **0**. Log `lint-G1-OLD-1.log` |
| G2-OLD | dynamic `import()` gap (D-06) · shipped config, **unmodified** | `src/lib/utils/__store_guard_inject_dyn__.ts` | `TURBO_FORCE=true yarn lint:check` | `b2c5c14b1` | `@openvaa/frontend:lint: cache bypass, force executing a1e8b52d64545435` · aggregate `Cached: 0 cached, 11 total` | **0** | `0 errors (1 pre-existing warning)` — the injected dynamic import produced **no** message | **GREEN (blind).** `await import('svelte/store')` in a `.ts` file inside the shipped guard scope passed untouched: `no-restricted-imports` inspects static `ImportDeclaration` nodes only, so an `ImportExpression` never reaches it. Note the contrast with `G1-OLD` — this file **is** in scope by both extension and directory, and the rule still cannot see the import. D-06's premise, measured. Log `lint-G2-OLD-1.log` |
| B1 | `lib/components` · `.ts` · **pre-115 scope reconstructed** | `src/lib/components/__store_guard_inject__.ts` | `TURBO_FORCE=true yarn lint:check` | `a9a230257` + transient uncommitted narrow | `@openvaa/frontend:lint: cache bypass, force executing deed3d961c919c0a` · aggregate `Cached: 0 cached, 11 total` | **0** | `0 errors (1 pre-existing warning)` — the injected import produced **no** message | **GREEN (blind).** A live `import { writable } from 'svelte/store'` in `lib/components` passed the real gate under the pre-115 scope. **Same site, same import, opposite result from the Task-2 control probe**, which FIRED here under the shipped scope — so the narrow demonstrably took effect. Log `lint-B1-1.log` |
| B2 | `lib/utils` · `.ts` · pre-115 scope reconstructed | `src/lib/utils/__store_guard_inject__.ts` | `TURBO_FORCE=true yarn lint:check` | `a9a230257` + transient uncommitted narrow | `@openvaa/frontend:lint: cache bypass, force executing 98261cd7fd08a0c3` · aggregate `Cached: 0 cached, 11 total` | **0** | `0 errors (1 pre-existing warning)` — the injected import produced **no** message | **GREEN (blind).** Log `lint-B2-1.log` |
| B3 | `lib/dynamic-components` · `.ts` · pre-115 scope reconstructed | `src/lib/dynamic-components/__store_guard_inject__.ts` | `TURBO_FORCE=true yarn lint:check` | `a9a230257` + transient uncommitted narrow | `@openvaa/frontend:lint: cache bypass, force executing 175327ecdaae196f` · aggregate `Cached: 0 cached, 11 total` | **0** | `0 errors (1 pre-existing warning)` — the injected import produced **no** message | **GREEN (blind).** Log `lint-B3-1.log` |
| B4 | `lib/candidate/components` · `.ts` · pre-115 scope reconstructed | `src/lib/candidate/components/__store_guard_inject__.ts` | `TURBO_FORCE=true yarn lint:check` | `a9a230257` + transient uncommitted narrow | `@openvaa/frontend:lint: cache bypass, force executing 049fb8e754c62cfe` · aggregate `Cached: 0 cached, 11 total` | **0** | `0 errors (1 pre-existing warning)` — the injected import produced **no** message | **GREEN (blind).** Log `lint-B4-1.log` |
| C | none — restore proof + clean revert · reproduces row `A` | — | `TURBO_FORCE=true yarn lint:check` | `a9a230257` (narrow reverted; tree byte-identical to this commit) | `@openvaa/frontend:lint: cache bypass, force executing 06c4b14151cb0843` — **hash identical to row `A`'s**, so turbo independently confirms the input set is byte-identical · aggregate `Cached: 0 cached, 11 total` | **0** | `0 errors (1 pre-existing warning)` — **identical to row `A`** | **RESTORED — proven four ways, verbatim:** `git diff --exit-code -- apps/frontend/eslint.config.mjs` → exit **0** <br> `git status --porcelain -- apps/frontend` → (empty) <br> `find apps/frontend/src -name '__store_guard_inject__*'` → (no matches) <br> `git hash-object apps/frontend/eslint.config.mjs` → `f6cea0a65cdd8d7cd77d734a17929b35510fe796` <br> Plus the broader `find apps/frontend/src -name '__store_guard_inject*'` → (no matches), and `git log --oneline -1 -- apps/frontend/eslint.config.mjs` → `c98ec04d2` (a Phase-151 commit) — **the narrowing never reached history**. Reproduces row `A` exactly: `Tasks: 11 successful, 11 total`. Log `lint-C-1.log` |
| N1 | `lib/components` · `.ts` · shipped scope | `src/lib/components/__store_guard_inject__.ts` | `TURBO_FORCE=true yarn lint:check` | `501eba9ce` (shipped two-entry config, blob `982db9af8880089375aecd56060bb778568f49c0`) | `@openvaa/frontend:lint: cache bypass, force executing 35d059f3b27f7a17` · aggregate `Cached: 0 cached, 11 total` | **1** | `1 error (1 pre-existing warning)` — `✖ 2 problems (1 error, 1 warning)`; the single error is the injected import, the single warning is the standing `candidateContext.svelte.test.ts:39` one. **No collateral:** the fixture tripped no other rule. | **RED — the catch.** **Inverts row `B1` against the byte-identical fixture at the byte-identical path.** `B1` exited 0 under the reconstructed pre-115 scope; `N1` exits 1 under the shipped one. The gate names **the file** and **the rule**, quoted verbatim from the log: <br> `apps/frontend/src/lib/components/__store_guard_inject__.ts` <br> `1:1  error  'svelte/store' import is restricted from being used. svelte/store is banned in migrated contexts and routes. Use $state/$derived rune handles exposing `current` instead  no-restricted-imports` <br> ASSERT-08's wording — *"fails `yarn lint:check`, naming the file and the rule"* — is satisfied literally. `Tasks: 10 successful, 11 total` · `Failed: @openvaa/frontend#lint`. **Short-circuit disclosure:** `yarn lint:check` is `turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests` (`package.json:33`). This red came from the **first** step; the `eslint tests` and `yarn typecheck:tests` steps **did not run**. Row `Z` is the row that covers them. Log `lint-N1-1.log` |
| N2 | `lib/utils` · `.ts` · shipped scope | `src/lib/utils/__store_guard_inject__.ts` | `TURBO_FORCE=true yarn lint:check` | `501eba9ce` (shipped two-entry config, blob `982db9af8880089375aecd56060bb778568f49c0`) | `@openvaa/frontend:lint: cache bypass, force executing 2263c69a0c29c804` · aggregate `Cached: 0 cached, 11 total` | **1** | `1 error (1 pre-existing warning)` — `✖ 2 problems (1 error, 1 warning)`; the single error is the injected import, the single warning is the standing `candidateContext.svelte.test.ts:39` one. **No collateral:** the fixture tripped no other rule. | **RED — the catch.** **Inverts row `B2`**, same fixture, same path. The gate names **the file** and **the rule**, quoted verbatim from the log: <br> `apps/frontend/src/lib/utils/__store_guard_inject__.ts` <br> `1:1  error  'svelte/store' import is restricted from being used. svelte/store is banned in migrated contexts and routes. Use $state/$derived rune handles exposing `current` instead  no-restricted-imports` <br> ASSERT-08's wording — *"fails `yarn lint:check`, naming the file and the rule"* — is satisfied literally. `Tasks: 10 successful, 11 total` · `Failed: @openvaa/frontend#lint`. **Short-circuit disclosure:** `yarn lint:check` is `turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests` (`package.json:33`). This red came from the **first** step; the `eslint tests` and `yarn typecheck:tests` steps **did not run**. Row `Z` is the row that covers them. Log `lint-N2-1.log` |
| N3 | `lib/dynamic-components` · `.ts` · shipped scope | `src/lib/dynamic-components/__store_guard_inject__.ts` | `TURBO_FORCE=true yarn lint:check` | `501eba9ce` (shipped two-entry config, blob `982db9af8880089375aecd56060bb778568f49c0`) | `@openvaa/frontend:lint: cache bypass, force executing 313bcbc753d9a111` · aggregate `Cached: 0 cached, 11 total` | **1** | `1 error (1 pre-existing warning)` — `✖ 2 problems (1 error, 1 warning)`; the single error is the injected import, the single warning is the standing `candidateContext.svelte.test.ts:39` one. **No collateral:** the fixture tripped no other rule. | **RED — the catch.** **Inverts row `B3`**, same fixture, same path. The gate names **the file** and **the rule**, quoted verbatim from the log: <br> `apps/frontend/src/lib/dynamic-components/__store_guard_inject__.ts` <br> `1:1  error  'svelte/store' import is restricted from being used. svelte/store is banned in migrated contexts and routes. Use $state/$derived rune handles exposing `current` instead  no-restricted-imports` <br> ASSERT-08's wording — *"fails `yarn lint:check`, naming the file and the rule"* — is satisfied literally. `Tasks: 10 successful, 11 total` · `Failed: @openvaa/frontend#lint`. **Short-circuit disclosure:** `yarn lint:check` is `turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests` (`package.json:33`). This red came from the **first** step; the `eslint tests` and `yarn typecheck:tests` steps **did not run**. Row `Z` is the row that covers them. Log `lint-N3-1.log` |
| N4 | `lib/candidate/components` · `.ts` · shipped scope | `src/lib/candidate/components/__store_guard_inject__.ts` | `TURBO_FORCE=true yarn lint:check` | `501eba9ce` (shipped two-entry config, blob `982db9af8880089375aecd56060bb778568f49c0`) | `@openvaa/frontend:lint: cache bypass, force executing a86899016813a31b` · aggregate `Cached: 0 cached, 11 total` | **1** | `1 error (1 pre-existing warning)` — `✖ 2 problems (1 error, 1 warning)`; the single error is the injected import, the single warning is the standing `candidateContext.svelte.test.ts:39` one. **No collateral:** the fixture tripped no other rule. | **RED — the catch.** **Inverts row `B4`**, same fixture, same path. The gate names **the file** and **the rule**, quoted verbatim from the log: <br> `apps/frontend/src/lib/candidate/components/__store_guard_inject__.ts` <br> `1:1  error  'svelte/store' import is restricted from being used. svelte/store is banned in migrated contexts and routes. Use $state/$derived rune handles exposing `current` instead  no-restricted-imports` <br> ASSERT-08's wording — *"fails `yarn lint:check`, naming the file and the rule"* — is satisfied literally. `Tasks: 10 successful, 11 total` · `Failed: @openvaa/frontend#lint`. **Short-circuit disclosure:** `yarn lint:check` is `turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests` (`package.json:33`). This red came from the **first** step; the `eslint tests` and `yarn typecheck:tests` steps **did not run**. Row `Z` is the row that covers them. Log `lint-N4-1.log` |
| G1-NEW | `.js` extension gap **closed** (D-05) | `src/lib/components/__store_guard_inject__.js` | `TURBO_FORCE=true yarn lint:check` | `501eba9ce` (shipped two-entry config, blob `982db9af8880089375aecd56060bb778568f49c0`) | `@openvaa/frontend:lint: cache bypass, force executing 73c9588cfa5eaefb` · aggregate `Cached: 0 cached, 11 total` | **1** | `1 error (1 pre-existing warning)` — `✖ 2 problems (1 error, 1 warning)`. No collateral. | **RED — the `.js` gap is closed.** The **inverse of row `G1-OLD`**, which exited **0** against this identical file at this identical path on the pre-change config. The pair is SC-5's evidence for D-05: the only thing that changed between the two rows is the glob. Named verbatim: <br> `apps/frontend/src/lib/components/__store_guard_inject__.js` <br> `1:1  error  'svelte/store' import is restricted from being used. svelte/store is banned in migrated contexts and routes. Use $state/$derived rune handles exposing `current` instead  no-restricted-imports` <br> `Tasks: 10 successful, 11 total` · `Failed: @openvaa/frontend#lint`. **Short-circuit disclosure:** `yarn lint:check` is `turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests` (`package.json:33`). This red came from the **first** step; the `eslint tests` and `yarn typecheck:tests` steps **did not run**. Row `Z` is the row that covers them. Log `lint-G1-NEW-1.log` |
| G2-NEW | dynamic `import()` gap **closed** (D-06) | `src/lib/utils/__store_guard_inject_dyn__.ts` | `TURBO_FORCE=true yarn lint:check` | `501eba9ce` (shipped two-entry config, blob `982db9af8880089375aecd56060bb778568f49c0`) | `@openvaa/frontend:lint: cache bypass, force executing a582bf5832784125` · aggregate `Cached: 0 cached, 11 total` | **1** | `1 error (1 pre-existing warning)` — `✖ 2 problems (1 error, 1 warning)`. No collateral: the `function`-declaration + single-quote fixture shape avoids `func-style` and `quotes`. | **RED — the dynamic-`import()` gap is closed.** The **inverse of row `G2-OLD`**, which exited **0** against this identical file at this identical path. The rule is **`no-restricted-syntax`**, not `no-restricted-imports` — `no-restricted-imports` inspects static `ImportDeclaration` nodes only. Since D-06 that `ruleId` is shared with the inherited TS-enum ban, so the **disambiguating message substring** is recorded rather than the bare rule name: **`svelte/store is banned`**. Verbatim: <br> `apps/frontend/src/lib/utils/__store_guard_inject_dyn__.ts` <br> `2:19  error  svelte/store is banned. Use $state/$derived rune handles exposing `current` instead  no-restricted-syntax` <br> `Tasks: 10 successful, 11 total` · `Failed: @openvaa/frontend#lint`. **Short-circuit disclosure:** `yarn lint:check` is `turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests` (`package.json:33`). This red came from the **first** step; the `eslint tests` and `yarn typecheck:tests` steps **did not run**. Row `Z` is the row that covers them. Log `lint-G2-NEW-1.log` |
| E-OLD | **SC-9 · POLARITY INVERTED** · enum case vs. the naive single-entry `no-restricted-syntax` patch · instrument is **vitest**, not the lint gate · expected **RED** = the case is not vacuous | none — transient config patch only | `cd apps/frontend && npx vitest run src/lib/_guards/eslint-store-guard.test.ts` | `5ccc95886` + transient **uncommitted** naive single-entry patch (the `TSEnumDeclaration` entry deleted, `ImportExpression` left alone) — the patch a reader who did not know about flat-config REPLACE would write | `n/a — instrument is vitest, not turbo`. The lint run taken in the same window under the same patch carries a real verdict: `@openvaa/frontend:lint: cache bypass, force executing 908701f2df500330` · aggregate `Cached: 0 cached, 11 total` | **1** (vitest) · **0** (lint, same patch) | vitest: `Tests  1 failed | 29 passed (30)` — exactly one case, and it is the intended one. lint: `TURBO_FORCE=true yarn lint:check` → **exit 0**, `0 errors (1 pre-existing warning)`, `Tasks: 11 successful, 11 total`. **The sentence this row exists to record:** under the naive patch the inherited `TSEnumDeclaration` ban is GONE for every file under `apps/frontend/src/**`, and **no gate in this repository reports a single error** — because the frontend contains zero enums today. The regression is invisible to `yarn lint:check`, to `yarn build` and to `yarn test:unit` alike. That is a measurement, not an argument, and it is the whole reason SC-9 exists. | **RED — the case is not vacuous.** Failing test, named verbatim: `svelte/store ESLint guard — ASSERT-08 app-wide reach > still enforces the inherited TSEnumDeclaration ban (flat-config REPLACE regression)`. A case that has only ever passed is indistinguishable from a case that cannot fail; this one has now been seen failing for the exact cause it guards. The patch was **never committed** — `git log --oneline -- apps/frontend/eslint.config.mjs` shows `b607bec18` (Task 1) as the only commit from this plan. Logs `vitest-E-OLD-1.log`, `lint-E-OLD-1.log` |
| E-NEW | **SC-9 · POLARITY INVERTED** · enum case vs. the shipped two-entry array · instrument is **vitest** · expected **GREEN** = the inherited ban survived | none | `cd apps/frontend && npx vitest run src/lib/_guards/eslint-store-guard.test.ts` | `5ccc95886`, config restored by `git checkout --`; blob `982db9af8880089375aecd56060bb778568f49c0` = the **Post-change restoration target** | `n/a — instrument is vitest, not turbo` | **0** | `Tests  30 passed (30)` · `Test Files  1 passed (1)` — zero failures | **GREEN — the inherited ban survived.** The two-entry array is back on disk and the enum case passes again, so the `no-restricted-syntax` edit added the dynamic-`import()` closure **without** deleting the inherited `TSEnumDeclaration` ban. Restore proven four ways in the same window: `git diff --exit-code -- apps/frontend/eslint.config.mjs` → exit **0** <br> `git status --porcelain -- apps packages tests` → (empty) <br> `TSEnumDeclaration` ×1 and `ImportExpression[source.value='svelte/store']` ×1 <br> `git hash-object` → `982db9af8880089375aecd56060bb778568f49c0`. Plus both fixture globs (`'__store_guard_inject__*'` and the broader `'__store_guard_inject*'`) empty. Log `vitest-E-NEW-1.log` |
| F | D-05 glob-widening fallout · clean tree · no injection · the deep-relative-`lib` `patterns` ban now also applies to `.js` / `.mjs` / `.cjs` | — | `TURBO_FORCE=true yarn lint:check` | `5abbc956d` + the uncommitted D-05/D-06 config edit (blob `982db9af8880089375aecd56060bb778568f49c0`), committed in this same task | `@openvaa/frontend:lint: cache bypass, force executing cdf4275ff3903cd7` — a **new** task hash, differing from row `A`'s `06c4b14151cb0843` because the config is an input to the task · aggregate `Cached: 0 cached, 11 total` | **0** | `0 errors (1 pre-existing warning)` — `candidateContext.svelte.test.ts:39` `unused-imports/no-unused-vars`, **identical to rows `A` and `C`** | **FALLOUT MEASURED AT ZERO — not assumed.** D-05 forbids assuming this. The widened glob now also applies the inherited deep-relative-`lib` `patterns` ban to every `.js` / `.mjs` / `.cjs` file under `apps/frontend/src`, and the measured new-violation count is **0**. Consistent with the `G1-OLD` blast-radius measurement: the only `.js` files under `apps/frontend/src` are the 12 generated paraglide ones, already lint-excluded, and `git ls-files 'apps/frontend/src/**/*.js'` returns 0 — so the widening adds reach without adding a single in-tree file to lint today. All three `&&` steps ran (`Tasks: 11 successful, 11 total`). Log `lint-F-1.log` |
| Z | none — clean revert at `143-02` close · identical to row `A` | — | `TURBO_FORCE=true yarn lint:check` | `501eba9ce` (no injection present; both fixture globs empty before the run) | `@openvaa/frontend:lint: cache bypass, force executing e2579edb7756f7a6` · aggregate `Cached: 0 cached, 11 total`. The task hash legitimately differs from row `A`'s `06c4b14151cb0843` and row `F`'s `cdf4275ff3903cd7`: both the config (Task 1) and the guard spec (Task 2) are inputs to the lint task, and both changed. **Identity of the exit code and the error count is the restoration proof here, not identity of the hash.** | **0** | `0 errors (1 pre-existing warning)` — `candidateContext.svelte.test.ts:39` `unused-imports/no-unused-vars`. **Identical to rows `A` and `F`.** | **CLEAN REVERT — the register closes where it opened.** All three `&&` steps ran (`Tasks: 11 successful, 11 total`), so this row — and only this row among the `143-02` measurements — covers the `eslint tests` and `yarn typecheck:tests` steps that every red row short-circuited past. Post-gate, verbatim: `git status --porcelain -- apps packages tests` → (empty) <br> `find apps/frontend/src -name '__store_guard_inject__*'` → (no matches) <br> `find apps/frontend/src -name '__store_guard_inject*'` → (no matches — the broader glob, which alone can see `__store_guard_inject_dyn__.ts`) <br> `git hash-object apps/frontend/eslint.config.mjs` → `982db9af8880089375aecd56060bb778568f49c0`, the Post-change restoration target. Six injections were created and six were removed. Log `lint-Z-1.log` |

**Which plan fills which half.** `143-01` fills `A`, `NC`, `G1-OLD`, `G2-OLD`, `B1`, `B2`, `B3`, `B4`,
`C` — nine rows. `143-02` fills `N1`-`N4`, `G1-NEW`, `G2-NEW`, `E-OLD`, `E-NEW`, `F`, `Z` — ten rows.

### The short-circuit disclosure — what a red row does and does not prove

`yarn lint:check` is **not** a single command. `package.json:33` defines it as:

```
turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests
```

Three steps joined by `&&`. **A red row means the FIRST failing step failed, and the later steps never
ran.** Every red row's `Outcome` cell must say which step failed and that the remaining steps did not
execute, rather than implying a full-gate result. In this phase every injected red is expected at step 1
(`turbo run lint`), so `eslint … tests` and `yarn typecheck:tests` are expected **not to have run** in
rows `N1`-`N4`, `G1-NEW` and `G2-NEW`. Only the **green** rows (`A`, `NC`, `G1-OLD`, `G2-OLD`, `B1`-`B4`,
`C`, `F`, `Z`) exercise all three steps.

### Row `C` — the restore proof in full, and why one assertion is not enough

**The narrow.** Rows `B1`-`B4` required the pre-115 guard scope, which has not existed since
`7c47b35b7`. It was reconstructed by editing exactly one line of `apps/frontend/eslint.config.mjs` — the
`files` array of the block whose sibling `rules` object holds the `no-restricted-imports` `svelte/store`
`paths` entry, located **by content, never by line number** (the file has more than one `files` key, and
editing the wrong block would produce four rows that measure nothing):

```diff
-    files: ['src/**/*.{ts,svelte}'],
+    files: ['src/lib/contexts/**/*.{ts,svelte}', 'src/routes/**/*.{ts,svelte}'],
```

One line, `1 insertion(+), 1 deletion(-)`. Nothing else changed — not the rule bodies, not the comments,
not the exclusion array. **No commit was taken while the config was narrowed**, and no other work
interleaved with the narrow → measure → restore window.

**The restore, and all four assertions, verbatim:**

```
git checkout -- apps/frontend/eslint.config.mjs

git diff --exit-code -- apps/frontend/eslint.config.mjs   → exit 0
git status --porcelain -- apps/frontend                   → (empty)
find apps/frontend/src -name '__store_guard_inject__*'    → (no matches)
git hash-object apps/frontend/eslint.config.mjs           → f6cea0a65cdd8d7cd77d734a17929b35510fe796
```

and two more, run because the four above are not quite sufficient:

```
find apps/frontend/src -name '__store_guard_inject*'      → (no matches)   # covers the _dyn__ fixture
git log --oneline -1 -- apps/frontend/eslint.config.mjs   → c98ec04d2 fix(151-14): repair the F-42
                                                            comment damage in the frontend eslint config
```

**Why the count is four and not one.** 141's rationale, carried in substance:

> *"The `find` is deliberately broader than the `git status` check: `git status` would miss a scratch
> file that had somehow been staged, and `find` would miss nothing under `tests/`."*

Applied here, the layering is:

- **`git diff --exit-code` alone is blind to untracked files** — and **every injection in this plan is
  an untracked NEW file**. It proves the tracked config came back; it says nothing at all about the six
  fixtures. Necessary, and nowhere near sufficient.
- **`git status --porcelain`** sees untracked files, but would miss a fixture that had somehow been
  staged and committed.
- **`find`** would miss nothing under `apps/frontend/src`, staged or not — which is why it is run in
  **both** the narrow and the broad glob form (see the disclosure in § Width delta).
- **`git hash-object`** is the only one of the four that proves *byte* identity rather than
  git-visible equivalence. It is the assertion that closes the window.
- **`git log -1` on the config** proves the narrowing never reached history: the most recent commit
  touching the file predates this phase entirely.

**Independent corroboration from turbo.** Row `C`'s `@openvaa/frontend:lint` task hash is
`06c4b14151cb0843` — **byte-identical to row `A`'s**. Turbo's hash is computed over the task's input
set, so an unreverted config edit or a surviving fixture would have changed it. The exit code says the
gate passed; the matching hash says it passed *on the same inputs*.

### Counting rule

**Count errors, not problems.** The `Errors` cell counts ESLint **errors**. The pre-existing
`unused-imports/no-unused-vars` warning at
`apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts:39` appears in every run, so a
clean row reads **`0 errors (1 pre-existing warning)`** and not `0 problems`.

---

## ASSERT-09 disposition — strict grep

**All six sections below were measured on the pristine tree at HEAD `04fa5e22c`** (`143-01` Task 2,
2026-08-22), with zero injections live and zero tree modification. Every ESLint probe used the JS API's
`lintText` with a **virtual** `filePath`, so no file was written anywhere — asserted at the end of this
group.

- **Command, with its path argument:** `git grep -n "from 'svelte/store'" -- apps packages`
- **HEAD:** `04fa5e22c`
- **Log:** `${TMPDIR:-/tmp}/gsd-143/inventory-strict-grep.log`
- **Result:** **2 lines · 1 file · 0 real imports** — `143-CONTEXT.md` B-4 confirmed exactly.

| # | `file:line` | Matched text | Disposition |
|---|---|---|---|
| 1 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:14` | `` * actually FIRES on a deliberate `import { writable } from 'svelte/store'` (so a `` | **prose** (doc comment) |
| 2 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:42` | `"import { writable } from 'svelte/store';\nexport const x = writable(0);\n",` | **test fixture** (the positive control's lint-input string literal) |

**This grep's `0 real imports` is what discharges ASSERT-09.** ASSERT-09 is satisfied **as written**:
every pre-existing usage carries a disposition, and the set happens to contain no real imports. A table
whose every row says "not an import" is the point, not an embarrassment — it is falsifiable a year from
now in a way that marking the requirement not-applicable never could be. Anyone who reintroduces a real
import changes row count and disposition together, and this table stops matching the tree.

**Neither hit is migrated or removed.** Row 1 is the doc comment that explains what the spec proves;
row 2 is the string the positive control lints. Deleting either would delete the guard's own evidence.

### ⚠ Re-measured at phase close — the strict grep moved, and the reason is this phase's own change

**Amended at source, in `143-03`, rather than annexed as a footnote.** The table above is a true
measurement **at HEAD `04fa5e22c`**. Re-measured at phase-close HEAD `9c9af397e` it returns a different
line count, and the difference is caused by `143-02`'s own spec rewrite:

| Measurement | At `04fa5e22c` (phase open) | At `9c9af397e` (phase close) | Cause of the movement |
|---|---|---|---|
| `git grep -n "from 'svelte/store'" -- apps packages` | **2 lines · 1 file** | **1 line · 1 file** | Row 1 above (the doc comment at `:14`) was **rewritten by `143-02` Task 2** as part of the two stale header claims D-12a required be fixed; the replacement prose no longer contains the literal `from 'svelte/store'`. Row 2 survives, moved from `:42` to `:73` |
| **Real imports** | **0** | **0** | **Invariant.** This is the number that discharges ASSERT-09, and it did not move |

The surviving hit at phase close is
`apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:73` — the `.ts` lint-input fixture, still a
string literal, still not an import. The `.svelte` fixture two lines below it carries the same import
inside escaped quotes (`\'svelte/store\'`) and therefore does not match the *strict* pattern, which is
why the strict count is 1 rather than 2 despite there now being more fixtures, not fewer.

**Both HEADs are recorded because either number alone would be misleading.** Quoting `2 lines` at phase
close would be stale; quoting `1 line` as though it had always been so would erase the fact that this
phase changed the file the count is taken over. **The discharging measurement — `0 real imports` — is
the same at both, and that is the claim ASSERT-09's evidence clause carries.**

---

## ASSERT-09 disposition — loose grep

Two path arguments, two different numbers. **Both are recorded, because a count without its path
argument is not reproducible** — and that is precisely the class of error this phase exists to stop
repeating.

- **Command A, with its path argument:** `git grep -n "svelte/store" -- apps/frontend/src`
  → **10 lines across 5 files**
- **Command B, with its path argument:** `git grep -n "svelte/store" -- apps packages`
  → **14 lines across 6 files**
- **HEAD:** `04fa5e22c` · **Log:** `${TMPDIR:-/tmp}/gsd-143/inventory-loose-grep.log`

| # | `file:line` | Disposition |
|---|---|---|
| 1 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:6` | **prose** — file doc comment, names the guard |
| 2 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:11` | **prose** — doc comment, quotes the Phase-115 glob |
| 3 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:14` | **prose** — doc comment (also strict-grep row 1) |
| 4 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:39` | **prose** — `describe` title |
| 5 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:40` | **prose** — `it` title |
| 6 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:42` | **test fixture** — the lint-input string literal (also strict-grep row 2) |
| 7 | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts:17` | **prose** — `// Mock parseAnswers to avoid dependency on svelte/store via $lib/i18n` |
| 8 | `apps/frontend/src/lib/components/video/component-stores.svelte.ts:10` | **prose** — `` * Svelte 5 replacement for the old `svelte/store` mutable-store primitive). `` |
| 9 | `apps/frontend/src/lib/contexts/data/dataContext.type.ts:6` | **prose** — `* (tracks the version counter). The legacy svelte/store DataRoot bridge was` |
| 10 | `apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts:27` | **prose** — ``*   3. No `svelte/store` imports, no `Readable<T>` shim, no `subscribe` getter.`` |

**Real imports in the 10: zero.** Six of the ten live in the guard spec itself; the other four are the
historical explanation of *why* the store seam was removed. **The four prose mentions are deliberately
not migrated** — they are the record, and deleting them would delete the record.

**Re-measured at phase close (HEAD `9c9af397e`) — this grep moved too, in the opposite direction, and
for the same reason.** Amended at source:

| Measurement | At `04fa5e22c` | At `9c9af397e` | Cause |
|---|---|---|---|
| `git grep -n "svelte/store" -- apps/frontend/src` | **10 lines · 5 files** | **21 lines · 5 files** | The guard spec went from **6** mentions to **17** — `143-02` rewrote it from 2 cases to 30, adding doc prose, `describe`/`it` titles and **four** lint-input fixture strings (`:73`, `:75`, `:133`, `:144`). **The file set is unchanged at 5** |
| `git grep -n "svelte/store" -- apps packages` | **14 lines · 6 files** | **29 lines · 6 files** | The above, plus `apps/frontend/eslint.config.mjs` going from **4** lines to **8** — the D-05/D-06 edit added the ban's second `no-restricted-syntax` entry with its own `name`/`message`, and the corrected glob comment |
| **Real imports** | **0** | **0** | **Invariant** |
| **The four external prose mentions** | 4 | **4** | Unchanged, and still deliberately not migrated |

All 21 phase-close hits were re-enumerated and every one is prose, a `describe`/`it` title, or a
lint-input string literal; the four non-spec files (`supabaseDataProvider.test.ts:17`,
`component-stores.svelte.ts:10`, `dataContext.type.ts:6`, `SettingsOverlay.svelte.ts:27`) are
byte-unchanged by this phase. **The count going *up* is the guard's evidence growing, not the seam
returning** — which is precisely why a raw line count is a poor requirement gate and `0 real imports` is
a good one.

### ⚠ Scope qualifier — stated as a fact of this section, not a footnote

The **10 lines / 5 files** figure holds **only** under `-- apps/frontend/src`. Widening the same pattern
to `-- apps packages` returns **14 lines across 6 files**. The sixth file is
`apps/frontend/eslint.config.mjs`, contributing **4 lines** — `:77` and `:81` (the guard's own
explanatory comments) and `:95` and `:97` (the ban's `name` and `message`). Those four are the ban
*declaring itself*; counting them as usages would be counting the lock as a door.

### ⚠ Measured delta from `143-RESEARCH.md` § 5.1 — the measurement wins

`143-RESEARCH.md` § 5.1's scope-qualifier note states the wide-scope figure as **13 lines / 6 files**
while its own prose simultaneously enumerates **four** config lines (`:77,81,95,97`) as "the extra 3".
Those two statements cannot both be true: `10 + 4 = 14`.

**Re-measured here at HEAD `04fa5e22c`: 14 lines / 6 files.** `git grep -c` over the wide scope returns
14; the per-file enumeration above accounts for all 14 individually. The research note's *enumeration*
was right and its *total* was off by one. **This is the fourth instance of the source-amended-count
class** that B-3, B-8 and B-9 already established, and it is resolved the same way: the measurement
wins, the delta is stated rather than smoothed over, and no downstream document inherits the 13.

**Nothing downstream depended on the 13.** ASSERT-09 is discharged by the *strict* grep's `0 real
imports`, and the narrow-scope 10/5 — the figure `143-CONTEXT.md` B-5 and D-09a actually lock — is
confirmed **exactly**.

---

## Out of scope, measured (D-07 / D-08)

Numbers, not assertions. Both todos are filed by `143-03`, not here.

### D-07 — `svelte/motion`

- **Command, with its path argument:** `git grep -n "svelte/motion" -- apps packages`
- **HEAD:** `04fa5e22c` · **Log:** `${TMPDIR:-/tmp}/gsd-143/inventory-motion-grep.log`
- **Result:** **4 lines · 4 files** — `143-CONTEXT.md`'s figure confirmed exactly.

| `file:line` | Import | Disposition |
|---|---|---|
| `apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte:44` | `import { tweened } from 'svelte/motion';` | **live legacy call site** |
| `apps/frontend/src/lib/components/modal/timed/TimedModal.svelte:55` | `import { tweened } from 'svelte/motion';` | **live legacy call site** |
| `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:5` | `import { Tween } from 'svelte/motion';` | already Svelte-5 class form |
| `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts:2` | `import type { Tween } from 'svelte/motion';` | already Svelte-5 class form |

**ESLint-API probe** at virtual path `apps/frontend/src/lib/components/__probe_motion__.ts`, body
`import { tweened } from 'svelte/motion';` → **SILENT** (0 messages from `no-restricted-imports` /
`no-restricted-syntax`). Logged to `${TMPDIR:-/tmp}/gsd-143/inventory-probes.log`.

**D-07's premise, with its numbers:** a `svelte/motion` ban **cannot land green** until the **two**
`tweened` sites above migrate to `Tween`. That turns a fallout-free evidence phase into a migration
phase, which is why it is out of scope here rather than folded in. The todo `143-03` files carries this
table, because a todo naming its two blocking call sites is actionable and one saying "file a ban" is
not.

### D-08 — files outside `src/`

`apps/frontend/package.json:10`, quoted verbatim:

```json
    "lint": "eslint --flag v10_config_lookup_from_file src/",
```

The `src/` path argument is what limits the file set. **Five files at `apps/frontend/*` therefore sit
outside the gate entirely:** `vite.config.ts`, `vitest.config.ts`, `svelte.config.js`,
`prettier.config.mjs`, `eslint.config.mjs`.

**ESLint-API probe** at virtual path `apps/frontend/vite.config.probe.ts`, body
`import { writable } from 'svelte/store';` → **SILENT**. Logged to the same probe log.

**This is a lint-script-scope question, not a store-guard question.** Those five files sit outside
**every** lint gate, not just this guard's, so no `files` glob can reach them. **D-05's widening does not
change it** — widening `src/**/*.{ts,svelte}` to `src/**/*.{ts,js,mjs,cjs,svelte}` alters which files
*inside* `src/` the guard block matches; it cannot alter which files ESLint is invoked on. The todo is
filed by `143-03`.

### Probe-apparatus control — so neither SILENT is read as vacuous

A probe harness that is silent on everything proves nothing. A third probe was run in the same
invocation, at virtual path `apps/frontend/src/lib/components/__probe_control__.ts` with body
`import { writable } from 'svelte/store';` → **FIRES**, 1 message:

```
no-restricted-imports: 'svelte/store' import is restricted from being used. svelte/store is banned in
migrated contexts and routes. Use $state/$derived rune handles exposing `current` instead.
```

So the two SILENT results above are properties of the *rule's reach*, not of a misconfigured harness.
All three probes used `new ESLint({ flags: ['v10_config_lookup_from_file'] })` — **mandatory**, or the
probe resolves a different config than the real gate (B-10) and measures nothing.

---

## Exclusion list (SC-3 / D-11 / D-11a)

**Re-measured at HEAD `04fa5e22c`, by counting string entries — not lines.** Log:
`${TMPDIR:-/tmp}/gsd-143/inventory-exclusions.log`.

- **Array literal:** `apps/frontend/eslint.config.mjs:22-41` (`ignores: [` at `:22`, `]` at `:41`).
- **Span of contents:** `:23-40` — **18 lines**, of which **two** (`:38`, `:39`) are the comment
  `// Frozen Svelte-5 migration spike fixtures (v2.13): kept as regression` /
  `// tests but intentionally not held to production lint standards.`
- **Measured entry count: 16.** A line count is **not** an entry count, and reading 18 lines as 18
  entries is the exact error **D-11a** exists to stop. Measured as
  `sed -n '23,40p' apps/frontend/eslint.config.mjs | grep -cE "^\s*'"` → **16**.
  **`143-CONTEXT.md` B-8's amended value of 16 is confirmed; no further delta.**

**All sixteen entries, verbatim and in order:**

| # | Entry | # | Entry |
|---|---|---|---|
| 1 | `'ios/*'` | 9 | `'**/.env.*'` |
| 2 | `'android/*'` | 10 | `'!**/.env.example'` (a **negation**) |
| 3 | `'**/.DS_Store'` | 11 | `'**/pnpm-lock.yaml'` |
| 4 | `'**/node_modules'` | 12 | `'**/package-lock.json'` |
| 5 | `'build'` | 13 | `'**/yarn.lock'` |
| 6 | `'.svelte-kit'` | 14 | `'src/app.html'` |
| 7 | `'package'` | 15 | `'src/error.html'` |
| 8 | `'**/.env'` | 16 | `'**/_spikes-*/**'` |

**16 entries before, 16 after, 0 additions.** **Nothing is added to this list by any decision in this
phase**, and **no site is silenced by broadening it.** That is SC-3's second clause, and it is a
constraint on `143-02` as much as a report on `143-01`: if a `143-02` injection had to be silenced by an
`ignores` entry, the guard would not have been proven — the injection would have been hidden.

**The dead entry, recorded as measured-dead and deliberately kept.** `'**/_spikes-*/**'` sits at `:40`
(not `:42` — B-9's amended value, confirmed) and matches **nothing**:

```
find apps -type d -name "_spikes*"   → (no matches)
```

**It stays.** A gratuitous deletion would silently re-break anyone reintroducing a `_spikes-*` fixture
directory expecting the documented exemption, and the two comment lines above it record exactly why the
exemption exists. Recording an entry as dead and keeping it is a different act from silencing a live
site by adding one — the first is honest bookkeeping, the second is the anti-pattern SC-3 forbids.

---

## SC-4 independent verification (D-10)

**SC-4's first half — `apps/frontend/src/**` contains no unexplained `svelte/store` import, verified by
grep independently of the lint rule.** This matters because the lint rule and the grep are independent
instruments: a config regression that blinded the rule would leave the grep unaffected, and vice versa.

| Field | Value |
|---|---|
| **Command** | `git grep -n "from 'svelte/store'" -- apps packages` |
| **Path argument** | `-- apps packages` (recorded because the count is meaningless without it) |
| **HEAD** | `04fa5e22c` |
| **Log** | `${TMPDIR:-/tmp}/gsd-143/inventory-strict-grep.log` |
| **Output, verbatim** | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:14: * actually FIRES on a deliberate `import { writable } from 'svelte/store'` (so a` <br> `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:42:      "import { writable } from 'svelte/store';\nexport const x = writable(0);\n",` |
| **Result** | 2 lines · 1 file · **0 real imports**; both hits dispositioned above |

**This is a one-time verification, not a standing gate** — recorded once, here, and deliberately not
installed anywhere that runs on every commit.

**Why a standing grep spec is rejected.** A grep that must pass on every run needs an allowlist for the
two legitimate sites above — the doc comment and the fixture string. An allowlist drifts. The first time
a new legitimate mention appears the allowlist gets broadened, and the broadening is indistinguishable
from silencing a real import: both are "add a line so the check goes green". **That is the exact
anti-pattern SC-3 forbids for the exclusion list**, and installing it here would be adopting on one page
what the previous section refuses on another.

**The standing protection is the lint rule plus `143-02`'s four-site matrix**, which fires on the
*syntax* of an import rather than on the *text* of a line, and therefore needs no allowlist for prose.

**SC-4's second half — `yarn lint:check` clean app-wide — is now filled, and is amended here at source
rather than annexed.** `143-03`'s **gate 2** ran `TURBO_FORCE=true yarn lint:check` on the clean
post-change tree at HEAD `a3414c4ed`: **exit 0, 0 errors** (1 pre-existing warning), turbo verdict
`cache bypass, force executing e2579edb7756f7a6` — byte-identical to row `Z`'s, which is an independent
input-set proof that the tree the gate measured is the tree row `Z` measured. The full block, including
the `&&`-chain short-circuit disclosure, is in § Gates (D-14) gate 2. **SC-4 is therefore complete: the
grep half above and the lint half in the gate section, taken through two independent instruments.**

---

## Ban reach — stated honestly, not over-claimed

Four classes, enumerated. **The ban is not total, and this section says so rather than implying
otherwise.**

**1 — Closed by the guard after `143-02`:**

| Form | Closed by |
|---|---|
| `import { writable } from 'svelte/store'` (static) | `no-restricted-imports` `paths` (shipped today) |
| `import type { Writable } from 'svelte/store'` (type-only) | same — type-only imports are **not** exempt (probe 7, measured FIRES) |
| `export { writable } from 'svelte/store'` (re-export) | same (probe 8, measured FIRES) |
| `await import('svelte/store')` (dynamic) | `no-restricted-syntax` `ImportExpression[source.value='svelte/store']` — **D-06**, lands in `143-02` |

**2 — Closed independently, by rules this phase does not touch:**

| Form | Closed by |
|---|---|
| `require('svelte/store')` | `@typescript-eslint/no-require-imports` |
| `` import(`svelte/store`) `` (template-literal specifier) | escapes the `[source.value=…]` selector, but is independently rejected by `quotes` |

**3 — Theoretically open, but unresolvable:** a subpath such as `import 'svelte/store/index.js'`. The
selector matches on the exact specifier and would not see it — but **svelte's `exports` map has no
subpath under `./store`**, so the specifier does not resolve and the module cannot be loaded. Open on
paper, closed by the package.

**4 — Genuinely open, and no static rule can close it:** a **computed specifier**, e.g.

```ts
const n = 'svelte/' + 'store';
await import(n);
```

`ImportExpression[source.value=…]` matches a *literal* source node; a computed one has no static value
to match. No ESLint rule can close this without evaluating the expression, which is undecidable in
general. **This is stated as residue.** The guard is a strong deterrent against reintroducing the store
seam by ordinary means; it is **not** a proof that no code path can reach `svelte/store`.

**Tree state at the close of this measurement group:** `git status --porcelain -- apps packages tests`
printed nothing, and `find apps/frontend -name '__probe_*'` returned no matches — every probe path above
is virtual, passed only as `lintText`'s `filePath`, and no file was written into the repository.

---

## Gates (D-14)

**Owned by:** plan `143-03` (wave 3), Task 1. **Run only after `143-02`'s last revert and last
post-gate**, for the three independently measured reasons carried in `143-03-PLAN.md`
`<gate_preconditions>`: `turbo.json` declares `test:unit` with `dependsOn: ["build"]`, so a root run
taken with an injection live would build the injected tree and hand it to every dependent; a live
`__store_guard_inject__*` fixture would red gate 2 for a manufactured reason and the `&&` chain would
then hide the two steps after it; and an E2E run overlapping an injection window would go red for a
manufactured reason (139 § 3.1's standing prohibition, carried verbatim).

### Entry check — all five passed before the first gate command

| Check | Result |
|---|---|
| `git status --porcelain -- apps packages tests` | prints nothing |
| `find apps/frontend/src -name '__store_guard_inject__*'` (and the broader `'__store_guard_inject*'`) | no matches, both globs |
| `git diff --exit-code HEAD -- apps/frontend/` | exit 0 |
| `grep -c 'TSEnumDeclaration' apps/frontend/eslint.config.mjs` | **1** — the naive single-entry patch is not on disk |
| `git hash-object apps/frontend/eslint.config.mjs` | **`982db9af8880089375aecd56060bb778568f49c0`** — equal to the header's **Post-change restoration target** |

A gate taken on a dirty tree measures nothing, and a green obtained that way is worse than no gate at
all because it looks authoritative. All five held, so no gate below is qualified by a tree-state
caveat.

### Environment stamp (all six gate runs)

- **HEAD:** `a3414c4edb1a31362987cb15ddc6f35defbcaf3c` (`a3414c4ed`), branch `feat-gsd-roadmap`. **All
  six gates were taken at this one HEAD** — unlike 142.1, where a mid-protocol formatting repair split
  the gates across two. Each block below still records its own HEAD rather than inheriting one.
- **Date:** 2026-08-22
- **Machine:** developer Mac, macOS 26.5.1 arm64 / Darwin 25.5.0. **Node v24.14.1**, **Yarn 4.13.0**,
  **turbo 2.8.17**, **Vite 6.4.1**, **Supabase CLI 2.83.0**
- **Resolved `$TMPDIR`:** `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/` — every
  `${TMPDIR:-/tmp}/gsd-143/…` path below resolves under `…/T/gsd-143/`
- **Frontend port: the default `5173`.** No `FRONTEND_PORT` was set, for either the dev server or the
  Playwright run — the invariant is that the two agree, and at the default they do. The port was
  confirmed free (`lsof -nP -iTCP:5173 -sTCP:LISTEN` → nothing) **before** the server was started, so
  the server the suite drove is the one this plan started and no other.
- **Cache handling is not uniform across the six, and the ledger says which is which.** Gate 1 needs no
  flag (`test:unit` is `"cache": false`); gate 2 **requires** `TURBO_FORCE=true` (`lint` is cached by
  default); gate 4's cache replay is the correct answer on an unchanged tree.

### D-14 gate 1 — root `yarn test:unit`

```bash
yarn test:unit
```

Script, re-read at gate time rather than assumed: `yarn assert:unit-coverage && turbo run test:unit`.
The **root, turbo, parallel** invocation over all workspaces. **No cache flag was passed and none is
needed** — `turbo.json` declares `test:unit` `"cache": false`, so every one of the eleven `test:unit`
tasks reports `cache bypass, force executing` and a turbo-cached green is structurally impossible.

| Field | Value |
|---|---|
| **Exit code** | **0** |
| **HEAD** | `a3414c4ed` |
| **Log** | `${TMPDIR:-/tmp}/gsd-143/gate-unit-1.log` |
| **Counts** | Coverage guard: 0 unclassifiable manifests · 0 declared-coverage violations · 0 turbo-execution violations · 11 workspaces executed · 4 unwired (`dev-tools`, `docs`, `shared-config`, `supabase-types`) · 15 scanned · **total 0 violations**. Turbo: **25 tasks successful / 25 total, 13 cached** — every one of the 13 is a `build` task; **all 11 `test:unit` tasks show `cache bypass, force executing`**. Repo-wide: **167 test files passed · 1709 tests passed** across the 11 executing workspaces |
| **Duration** | 23 s wall clock (turbo's own figure: 21.246 s) |
| **Proves** | Nothing in the config edit or the spec rewrite regressed any workspace's unit suite, measured through the invocation CI uses rather than a frontend-scoped one |

**Per workspace:** `supabase` 1/20 · `core` 3/8 · `matching` 5/43 · `app-shared` 3/21 · `llm` 2/39 ·
`question-info` 2/22 · `filters` 1/22 · `argument-condensation` 6/30 · `data` 47/244 · `dev-seed` 43/446
· `frontend` 54/814.

**The delta against 142.1's gate 1 is +39 tests, and every one of them is accounted for** — recorded
because an unexplained count movement between two adjacent phases' gate sections is exactly the kind of
drift this ledger class exists to catch:

| Movement | 142.1 | Here | Δ | Cause |
|---|---|---|---|---|
| `src/lib/_guards/eslint-store-guard.test.ts` | 2 | **30** | **+28** | **this phase** — `143-02`'s matrix rewrite |
| `src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts` | 5 | **11** | +6 | `142.1`'s post-gate aud/iss hardening |
| `src/lib/api/utils/auth/providers/signicat.test.ts` | 15 | **16** | +1 | same |
| `supabase/functions/identity-callback/claimConfig.test.ts` | 16 | **20** | +4 | same |
| **Repo-wide total** | **1670** | **1709** | **+39** | 28 + 6 + 1 + 4 — exact, no residue |

**Test-file count is unchanged at 167.** That is the corroborating fact: this phase added **cases**, not
files, and `142.1`'s follow-ups did the same.

### D-14 gate 2 — `TURBO_FORCE=true yarn lint:check`

```bash
TURBO_FORCE=true yarn lint:check
```

Script: `turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests`.

| Field | Value |
|---|---|
| **Exit code** | **0** |
| **HEAD** | `a3414c4ed` |
| **Log** | `${TMPDIR:-/tmp}/gsd-143/gate-lint-1.log` |
| **Counts** | Turbo lint: **11 tasks successful / 11 total, 0 cached**; turbo verdict for `@openvaa/frontend:lint` = **`cache bypass, force executing e2579edb7756f7a6`**, and **all 11** tasks carry a `cache bypass, force executing` verdict — **0 replays anywhere in the run**. Frontend: **1 problem — 0 errors, 1 warning**. Repo-wide across the three chain steps: **0 errors**, 20 warnings (`core` 2 · `dev-seed` 15 · `frontend` 1 · `tests` 2). `typecheck:tests`: clean, no output |
| **Duration** | 14 s wall clock (turbo's own figure for the lint step: 9.908 s) |
| **Proves** | **SC-4's second half — `yarn lint:check` is clean app-wide on the post-change tree**, measured rather than replayed. **The `&&` chain short-circuits**, so this green additionally proves that all three steps ran: had `turbo run lint` gone red, the `tests` eslint pass and `typecheck:tests` would **not** have run at all and this block would have to say so. A red here would be a one-step measurement wearing a three-step name |

**`yarn lint:check --force` is forbidden phase-wide and was not used.** Yarn appends the argument to
the **end** of the `&&` chain rather than passing it to turbo, so it silently does nothing and leaves
the cache in play. `TURBO_FORCE=true` is an environment variable and reaches turbo.

**The turbo hash is an independent input-set proof, beyond the exit code.**
`@openvaa/frontend:lint` hashed to **`e2579edb7756f7a6`** here — **byte-identical to row `Z`'s**
verdict, measured by `143-02` at its closing revert. The hash covers the task's whole input set, so its
equality is evidence that the tree this gate measured is the same tree row `Z` measured: no fixture
survived, no config edit lingered, and nothing drifted between `143-02`'s close and this gate.

**The one warning is the pre-existing baseline, not residue.** `unused-imports/no-unused-vars` at
`apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts:39` appears in **every** run
in this register — rows `A`, `NC`, `C`, `F` and `Z` all record it. The `Errors` figure counts **errors**,
never "problems".

### D-14 gate 3 — `yarn format:check`

```bash
yarn format:check
```

Script: `turbo run build --filter=@openvaa/app-shared... && prettier --check . && yarn workspace @openvaa/docs format:check`.

| Field | Value |
|---|---|
| **Exit code** | **0** |
| **HEAD** | `a3414c4ed` |
| **Log** | `${TMPDIR:-/tmp}/gsd-143/gate-format-1.log` |
| **Counts** | *All matched files use Prettier code style!* — twice, once for the root `prettier --check .` and once for `@openvaa/docs`. **0 unformatted files.** Turbo prerequisite build: 7 tasks successful / 7 total, 7 cached (`>>> FULL TURBO`) |
| **Duration** | 11 s wall clock |
| **Proves** | The two product files `143-02` wrote — `apps/frontend/eslint.config.mjs` and `src/lib/_guards/eslint-store-guard.test.ts` — are Prettier-clean, so this gate did not need the repair 142.1's did |

**Passed on its first invocation, which is worth stating rather than assuming.** `143-VALIDATION.md`'s
gate table flagged that this gate *"will flag the config edit unless `prettier --write` ran"*, and
`143-02` Task 1 ran it. Separately, the two **pre-existing** unformatted files that made this gate red
when Phase 142.1 opened (`packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts` and
`tests/README.md`, `WINDOWS.md` entries #7 and #8) were repaired by `142.1-03` in `79038ac81` and have
stayed clean since. **Nothing was repaired by this phase to obtain this green** — there was nothing to
repair.

### D-14 gate 4 — `yarn build`

```bash
yarn build
```

| Field | Value |
|---|---|
| **Exit code** | **0** |
| **HEAD** | `a3414c4ed` |
| **Log** | `${TMPDIR:-/tmp}/gsd-143/gate-build-1.log` |
| **Counts** | Turbo: **14 tasks successful / 14 total, 13 cached**. Frontend: `Using @sveltejs/adapter-node` → `✔ done`. Docs: `✔ done` |
| **Duration** | 12 s wall clock (turbo's own figure: 11.085 s) |
| **Proves** | The tree builds. **The 13 cache replays are the correct answer here and were deliberately not forced** — this phase changes no built input: `eslint.config.mjs` is not an input to any build task, and `eslint-store-guard.test.ts` is excluded from the frontend build. A forced rebuild would have measured the toolchain, not the change |

**This is the one gate whose cache replay is legitimate, and the asymmetry with gate 2 is the point.**
Gate 2 is forced because a replayed lint verdict would be a claim about a *previous* tree; gate 4 is not
forced because a cached build of an *unchanged* input set is a true statement about this one.

### D-14 gate 5 — `yarn workspace @openvaa/frontend check`

```bash
yarn workspace @openvaa/frontend check
```

Script: `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings`.

| Field | Value |
|---|---|
| **Exit code** | **0** |
| **HEAD** | `a3414c4ed` |
| **Log** | `${TMPDIR:-/tmp}/gsd-143/gate-check-1.log` |
| **Counts** | `COMPLETED 2684 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` — **2684 files · 0 errors · 0 warnings** |
| **Duration** | 7 s wall clock |
| **Proves** | `apps/frontend/src` typechecks — including `143-02`'s rewritten `eslint-store-guard.test.ts`, whose 189-line diff is the only TypeScript this phase wrote |

**This gate is 142.1's non-optional addition to D-14's set, and omitting it as redundant would have been
the mistake it exists to prevent.** **Neither `yarn lint:check` nor `yarn build` typechecks
`apps/frontend/src`**: `yarn build` runs `svelte-kit sync && vite build`, and esbuild strips types
without checking them; `lint:check`'s `typecheck:tests` targets `tests/tsconfig.json` only. The
frontend's strict typecheck is a **separate CI step** (`.github/workflows/main.yaml:75-76`). A spec
rewrite that introduces a type error reds **exactly here and nowhere else locally** — gates 1-4 would
all pass on this machine and the branch would red in CI. Seven seconds closes that gap.

**The file count is 2684, identical to 142.1's post-collapse measurement**, which is the expected
direction: this phase adds no file to `apps/frontend/src` and deletes none.

**`apps/frontend/tsconfig.tsbuildinfo` was NOT dirtied.** `git status --porcelain -- apps/frontend/tsconfig.tsbuildinfo`
printed nothing immediately after this gate, so no `git checkout HEAD --` restore was needed. The
runbook's preference for `yarn workspace @openvaa/frontend check` over a bare `npx tsc --noEmit` is what
avoided it — the latter rewrites that tracked generated artifact and dirties the tree it is measuring.

### D-14 gate 6 — `yarn test:e2e`, once, under D-15's prereq

```bash
yarn db:reset      # database only — does not touch the vite cache or the frontend
yarn dev           # exactly ONE fresh dev server, started by this plan, strictPort, default :5173
yarn test:e2e      # second shell, repo root
```

| Field | Value |
|---|---|
| **Exit code** | **0** |
| **HEAD** | `a3414c4ed` |
| **Log** | `${TMPDIR:-/tmp}/gsd-143/gate-e2e-1.log` (the `db:reset` transcript is at `gate-e2e-dbreset.log`, the dev server's at `gate-e2e-devserver.log`) |
| **Counts** | **135 passed** (135/135) · **0 failed** · **0 skipped** · **0 flaky** · **0 "did not run"** — five separate numbers, as the cardinal rule requires. `grep -ci 'did not run'` over the log → **0**; `grep -ci 'interrupted'` → **0** |
| **Duration** | **10.5 min** (Playwright's own figure; wall clock 629 s) |
| **Proves** | The whole default suite is green on the post-change tree, under CLAUDE.md's cardinal rule, with **no** "cannot plausibly affect it" exemption claimed |

**D-15's prereq was executed, not assumed, and each step is separately evidenced:**

| Step | Evidence |
|---|---|
| `yarn db:reset` ran first | exit 0 in 29 s; `gate-e2e-dbreset.log` ends *"Finished supabase db reset on branch main"* after applying the migrations and `seed.sql` |
| **Exactly one** dev server, started by this plan | `:5173` confirmed **free** before launch; after launch a single `node` listener on `[::1]:5173`; `VITE v6.4.1 ready in 1922 ms` in `gate-e2e-devserver.log`; the server was killed at gate close and the port re-confirmed free |
| The suite ran against **this** checkout | `E2E PREFLIGHT OK /…/voting-advice-application-gsd/apps/frontend (verified against /…/voting-advice-application-gsd)` — the Phase-137 preflight, which has no bypass by flag or environment variable |
| **One** run, not three | This phase introduces no source of nondeterminism — no new spec, no test-timing surface — so extra runs buy no information. The 3× determinism gate is Phase 122's answer to a flake-prone *new* spec |

**The run was launched once and ran to completion.** It was not killed and relaunched — the 142.1
disclosure about a tool-timeout kill at test 104/135 has no analog here, and the count above is from a
single uninterrupted execution.

**Why this gate is here at all, stated plainly:** this phase changes **zero runtime bytes** — an ESLint
config and a vitest spec, neither of which the application loads. The temptation is to call the E2E
suite irrelevant and skip it. **The cardinal rule admits no such exemption**, and a config-only change
is exactly the class assumed inert that occasionally is not. Ten and a half minutes is the price of not
having to argue the point.

### Gate verdict

**All six gates green — every one on its first attempt at its final configuration, none retried, none
annotated as flaky, none skipped, and all six taken at the single HEAD `a3414c4ed`.** Five static gates
(`yarn test:unit` 167 files / 1709 tests, `TURBO_FORCE=true yarn lint:check` 0 errors,
`yarn format:check` 0 unformatted files, `yarn build` 14/14, `yarn workspace @openvaa/frontend check`
2684 files / 0 errors / 0 warnings) each exit 0, and the full `yarn test:e2e` suite exits 0 at
**135 passed** with **zero** failed, skipped, flaky or "did not run".

**Three disclosures, so "first attempt" is not read as more than it is:**

1. **Two of the six ran partly from turbo's cache, and the ledger says which and why.** Gate 4 replayed
   13 of 14 build tasks and gate 1's turbo run replayed 13 of 25 tasks — **every replayed task in both
   is a `build`**, and no `test:unit` or `lint` task was replayed anywhere (`cache hit, replaying` count
   over `gate-lint-1.log`: **0**). Gate 2, the one gate whose default is a cached green, was forced.
2. **Gate 3 passed without repair, unlike 142.1's**, but only because `142.1-03` repaired the two
   pre-existing unformatted files six days of phases after they went red. This green inherits that
   repair; it does not independently re-prove that the gate has reach.
3. **Gate 6 is a full-suite green on a tree whose runtime bytes are unchanged.** It proves the suite is
   green here; it cannot and does not prove anything about the guard, which is what the 19-row register
   above is for.

**Not one gate was weakened to obtain a green.** No gate was scoped down, no `--force` was substituted
for `TURBO_FORCE=true`, no `.skip` or `.only` was added to any spec, no warning was suppressed — the
single pre-existing `unused-imports/no-unused-vars` warning was left exactly where it was — no
`retries` setting was touched, and gate 5 was run rather than argued away as redundant with lint and
build. The two things that could have made a gate cheaper — dropping gate 5 as covered by gates 2 and 4,
and dropping gate 6 as irrelevant to a zero-runtime-byte change — were both **rejected**, and both
rejections are recorded above at the gate they would have removed.

---

## Final counts

**Three targets that disagree are worse than one that is silent, because each looks authoritative.**
This phase derives each number **once**, here, and propagates it unchanged to `REQUIREMENTS.md` and
`ROADMAP.md`. No downstream document re-derives a count; every one of them points here.

Each row below is derived from this ledger's own filled cells — never from `143-CONTEXT.md`,
`143-RESEARCH.md` or either plan, all of which carry numbers that the measurements have already
corrected in four separate places (§ The three source-amended count corrections, § Measured delta from
`143-RESEARCH.md` § 5.1, and the turbo verdict string in § Measured verdict string).

**Two rows carry two HEADs each, deliberately.** Both ASSERT-09 grep counts were re-measured at phase
close and **moved** — because this phase's own `143-02` rewrote the file the greps are taken over. The
rule that governs this is the same one that produced the four earlier corrections: **re-measure, do not
quote; when the two disagree, the measurement wins and the delta is stated.** Recording only the
phase-open figure would leave a stale number in the record; recording only the phase-close figure would
erase the fact that the phase moved it. **The one figure that did not move is `0 real imports`, which is
the figure the requirement's evidence clause actually rests on.**

| Count | Value | Derivation — what the number actually means |
|---|---|---|
| Strict grep (`from 'svelte/store'`, `-- apps packages`) | **0 real imports** — at **2 lines · 1 file** (HEAD `04fa5e22c`, phase open) and **1 line · 1 file** (HEAD `9c9af397e`, phase close) | § ASSERT-09 strict, including its phase-close re-measurement. **The `0 real imports` is the count that discharges ASSERT-09, and it is invariant across both HEADs** — it is the only one of the three figures a downstream record should quote unqualified. The line count moved because `143-02` rewrote the guard spec's doc header, deleting the prose occurrence; the surviving hit is the `.ts` lint-input fixture. Not a claim that the string is absent — a claim that every occurrence is dispositioned |
| Loose grep (`svelte/store`, `-- apps/frontend/src`) | **0 real imports** — at **10 lines · 5 files** (HEAD `04fa5e22c`) and **21 lines · 5 files** (HEAD `9c9af397e`) | § ASSERT-09 loose, including its phase-close re-measurement. **The path argument is part of the number:** the same pattern over `-- apps packages` returns **14 lines · 6 files** at phase open and **29 lines · 6 files** at close, the extra file being `eslint.config.mjs` (4 lines then, 8 now — the ban declaring itself). Research's wide-scope total of 13 was off by one; re-measured to 14. The +11 in-spec growth is `143-02`'s 2→30 rewrite adding prose, titles and four fixture strings — **the count going up is the evidence growing, not the seam returning**, and the file set never moved off 5. This grep is the **disposition table's input**; it is not the discharging measurement, which is the strict grep's row above |
| Exclusion-list size at phase close | **16 entries before · 16 after · 0 additions** | Re-measured at HEAD `04fa5e22c` by counting **string entries**, not lines — the array spans 18 lines of which 2 are comments, and the whole reason this count sits in the table is that a line count was previously read as an entry count. `'**/_spikes-*/**'` is measured-dead (`find apps -type d -name '_spikes*'` → empty) and deliberately kept. **No site is silenced by broadening the list**, because the list did not move |
| Measured halves (SC-1) | **8 measured halves · 0 cited** | The **8** is SC-1's number and nothing else's: **4 injection pairs** (`lib/components`, `lib/utils`, `lib/dynamic-components`, `lib/candidate/components`) × 2 halves = 4 OLD (rows `B1`-`B4`, GREEN blind under the reconstructed pre-115 scope) + 4 NEW (rows `N1`-`N4`, RED at exit 1 under the shipped scope). **`0 cited`** because the pre-115 scope has not existed since `7c47b35b7` (2026-06-13), so no half was citable from any earlier record — both halves of all four pairs were measured in this phase |
| Register rows | **19 rows · 0 `pending` · 0 borrowed observations · 0 cache replays** | **Deliberately a different number from the 8 above, and the two must not be substituted for each other.** The 19 rows cover the 4 SC-1 pairs (8 halves) **plus** 2 gap pairs (`G1-OLD`/`G1-NEW` for the `.js` extension, `G2-OLD`/`G2-NEW` for dynamic `import()`), 1 SC-9 vitest pair (`E-OLD`/`E-NEW`), the clean baseline `A`, the must-NOT-fire control `NC`, the restore row `C`, the D-05 fallout measurement `F`, and the closing revert `Z`. **Citing 19 where SC-1 asks for 8 would over-state the control by a factor of more than two.** Verified at phase close: 19 rows matched by the row-ID grep, 0 cells reading `pending`, 0 cells carrying a borrowed observation, 0 turbo verdicts recording a cache replay, and 18 rows carrying an `executing` verdict (the nineteenth, `E-NEW`, is vitest-only and reads `n/a — instrument is vitest, not turbo`) |
| Standing guard-spec cases | **30 cases** (from **2**) | Measured by vitest at gate 1: `src/lib/_guards/eslint-store-guard.test.ts (30 tests)`. Breakdown: **24 matrix** (4 directories × 2 extensions × 3 assertions) + **3** extension probes (`.js`, `.mjs`, `.cjs`) + **2** dynamic-`import()` probes (`.ts` and `.svelte`) + **1** inherited-`TSEnumDeclaration`-ban regression case. The file declares 6 `it(` literals; the 30 is what the `.each` tables expand to, which is why the number is taken from the runner rather than from a grep |
| Reach gaps closed | **2** | Both **measured** blind first, on the untouched shipped config (rows `G1-OLD`, `G2-OLD`, each exit 0), then closed and re-measured (rows `G1-NEW`, `G2-NEW`, each exit 1). Each closure carries its own **standing** probe in the 30-case spec, so neither can reopen silently. Counted as gaps *closed*, not gaps *found* — a third form (the computed specifier) was found and is **not** counted here, because it is not closed |
| Gates | **6 gates · 6 at exit 0 · 0 not run** | § Gates (D-14), all six at HEAD `a3414c4ed`, first attempt. `yarn test:unit` **167 files / 1709 tests**; `TURBO_FORCE=true yarn lint:check` **0 errors** (1 pre-existing warning); `yarn format:check` **0 unformatted files**; `yarn build` **14/14 tasks**; `yarn workspace @openvaa/frontend check` **2684 files / 0 errors / 0 warnings**; `yarn test:e2e` **135 passed · 0 failed · 0 skipped · 0 flaky · 0 "did not run"**. A gate that did not run counts as a failure, not a pass — hence the fifth E2E number is recorded explicitly rather than left implied |

### The canonical count run

This is the single line `REQUIREMENTS.md`'s ASSERT-08 and ASSERT-09 evidence clauses paste **verbatim**.
It is composed from the table above, not derived independently — that is the whole point of there being
one derivation site:

> **8 measured halves · 0 cited · 4 SC-1 sites × 2 extensions · 2 gaps closed · 16 exclusion entries
> before, 16 after, 0 additions**

Read it precisely: the **8** is the SC-1 halves count (4 pairs), **not** the 19 register rows; the
**4 sites × 2 extensions** is the standing spec's matrix shape, whose 24 assertions are 4 × 2 × 3.

### Register completeness, asserted rather than assumed

| Property | Value at phase close | How checked |
|---|---|---|
| Rows | **19** | row-ID grep over the register |
| Cells still reading `pending` | **0** | row-scoped grep |
| Cells carrying a borrowed observation | **0** | row-scoped grep for the forbidden word |
| Turbo verdicts recording a cache replay | **0** | row-scoped grep |
| Rows carrying an `executing` verdict | **18** of 19 | row-scoped grep; `E-NEW` is vitest-instrumented and carries no turbo verdict by construction |

### What this table does NOT claim

The ban is **not** total, and § Ban reach — stated honestly, not over-claimed says so at length rather
than by implication. The computed-specifier form —

```ts
const n = 'svelte/' + 'store';
await import(n);
```

— remains **genuinely open and unclosable by any static rule**, because `ImportExpression[source.value=…]`
matches a *literal* source node and a computed one has no static value to match. Nothing added in
`143-02` narrowed that: the two-entry `no-restricted-syntax` array closes the *literal* dynamic form and
nothing else. It is stated here as **residue**, it is filed in `REQUIREMENTS.md`'s residue clause, and
it is deliberately **not** counted in the "Reach gaps closed" row above. Over-claiming here would be the
same failure the phase was created to correct, one level up.

---

*Phase: 143-svelte-store-guard-app-wide-reach-fallout-triage*
*Opened: 2026-08-22 at HEAD `289f80e8c`*
