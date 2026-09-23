# Phase 144 — Negative-Control Ledger: the seed-template guard observed blind, then observed catching

**Thirty-seven rows, four instruments, one machine — and not one borrowed observation anywhere in the
register.** Every OLD (blind) half this phase owes is measured **here, in `144-01`, on the untouched
tree**, before the commit that changes behaviour exists. A row whose run did not execute keeps its
placeholder cells and carries **no** outcome — never a confirmed one — because a measurement that did
not run counts as a failure, not a pass (`CLAUDE.md` § E2E Hard Rule, generalised;
`139-VERDICTS.md:5-9`).

- **Phase:** 144 (seed-template-strict-typing-unknown-prop-guard)
- **Requirements:** **TMPL-01 / TMPL-02 / ASSERT-04 (F13)**
- **Opened by:** `144-01-PLAN.md` (wave 1). **Every row is created here, before the phase's first
  measurement.** The OLD-half cells are filled by this same plan; the NEW-half cells are filled by
  plans `144-02` … `144-07`.
- **Corpus:** exactly **37 rows — 14 OLD/NEW pairs (28 measured halves) plus 9 non-pair rows**
  (`L`, `NC`, `A`, `AF`, `NA`, `F`, `P`, `C`, `Z`). **Schema choice, locked: the half-row schema.**
  `144-RESEARCH.md` R8.3 offers a pair-per-row alternative giving 23 rows; this ledger uses the
  half-row form and asserts **37** in its own § Completeness table, as 143 did at its `:984-992`.
- **Protocol source:** `139-VERDICTS.md` § 3.1 HYGIENE-LOOP, reused via `142.1-01-PLAN.md` (D-02) and
  `143-01-PLAN.md`, adapted here for a **four-instrument** register (`tsc`, `vitest`, the seed CLI,
  turbo) rather than 143's single lint instrument.
- **Baseline for OLD halves:** none inherited, none inheritable. **The word for a borrowed
  observation — the past participle of "to cite" — is not a legal value in any cell of this
  register.** See § Measurement, never citation. Every row carries its own log path and the HEAD its
  own half was taken at.
- **Run date:** 2026-08-23.
- **HEAD at ledger creation:** `d2ffc3904` — branch `feat-gsd-roadmap`. **OLD and NEW rows
  legitimately carry different HEADs**, because the behaviour-changing commits (`144-02` … `144-06`)
  land *between* the two halves of every pair — the 142.1 D-20 precedent, inherited through 143. Each
  row records the HEAD its own half was measured at.
- **Machine:** developer Mac, host Node, runs issued from the repository root. macOS 26.5.1 arm64 /
  Darwin 25.5.0 / Node v24.14.1. **No container:** this ledger records `tsc`, `vitest`, seed-CLI and
  turbo exit codes only, never a visual baseline, so the milestone's container rule for baselines does
  not apply.
- **Resolved `$TMPDIR`:** `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T` — so every
  `${TMPDIR:-/tmp}/gsd-144/…` log reference below resolves to
  `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-144/…`. Recorded for the same reason
  139, 142.1 and 143 recorded theirs: **a log path that cannot be resolved later is not evidence.**

### Restoration blob hashes — the pre-change state of every file this phase edits

Taken with `git hash-object` at ledger creation, at HEAD `d2ffc3904`, before any injection existed.
Any row that restores one of these paths asserts against the value here.

| Path | `git hash-object` at ledger creation |
|---|---|
| `packages/dev-seed/tsconfig.json` | `7fba879dc6f4976b43646d8388401742a8aa7131` |
| `packages/dev-seed/src/supabaseAdminClient.ts` | `0fe5fe45c3b7493429a0d48b814792f8ff724d27` |
| `packages/dev-seed/src/pipeline.ts` | `d650e608ae30c1bf8aa2a58088728c194435697e` |
| `packages/dev-seed/src/writer.ts` | `c89b446f0601c52f3b501ae3a5cfe24c362517e0` |
| `packages/dev-seed/src/template/schema.ts` | `a65a33f7f4049a35bf33ffc7ba5c67955be73ac2` |
| `packages/dev-seed/src/template/types.ts` | `8aab8d5a90287c3b0669786111ea89dc2d7ca5f0` |
| `packages/dev-seed/src/cli/resolve-template.ts` | `34ef63064753e73ec6c832e9377e2c6bf8b35597` |
| `package.json` | `d7e6b67690c9049587f4cf6578538e28274d4fe1` |
| `.github/workflows/main.yaml` | `4dcd9bddef680f8bcf763504c0bfda7b6c2b8d96` |

**Decisions discharged by this ledger:** D-01 and D-01a (the re-scoped criterion 1 and its citation
rule), D-03a (the keying inversion), D-05 (the 4 + 1 + 1 corpus), D-06 and D-06b (the gated claim and
its cache-busting), D-07 and D-07a (built-in validation and the false doc comment), D-08 (the two
negative-control fixture classes), D-09 (the deny-list), D-10 (the fallout survey), and B-4b (the
fourth allow-list source).

**Precedent followed:** `143-NEGATIVE-CONTROL-LEDGER.md` is this ledger's template for naming, header
field set, the rows-first ordering rule, the width-delta declaration, the ⚠ INVERSION section and the
gate section; `141-ASSERT10-LEDGER.md` is its template for the three-assertion restore proof. See
§ Precedent chain.

---

## Why this ledger exists — and what it does NOT claim

**ROADMAP criterion 1's exemplar is stale.** The criterion names `_elections` on a `questions` row as
the illegal key to catch. It is not illegal. It has been a **first-class, resolved feature** of the
dev-seed pipeline since commit `4aeae0ace` (2026-06-01), whose **real** subject line is:

> ``feat(data): promote `required` to first-class Question field + wire consumers``

**That subject does not mention dev-seed at all**, which is exactly why the citation must also state
what the commit did to *this* file: it factored the `_elections` sentinel resolver — `electionResolve`
— out of the `question_categories` block and called it for **both** tables. Today those two dispatch
calls sit at `packages/dev-seed/src/supabaseAdminClient.ts:542-543`:

```ts
await electionResolve(categories, 'question_categories');
await electionResolve(data.questions as Array<Record<string, unknown>> | undefined, 'questions');
```

The commit's own body says so in as many words: *"dev-seed: extend election_ids JSONB scoping to
questions (not just categories) via shared `_elections` sentinel resolver."* The motivating todo was
filed **2026-05-31 — one day before**. So the roadmap line was describing a hole that a commit closed
the following morning.

**Per D-01a, the commit is cited by hash *and* by that real subject line**, because a citation whose
quoted message cannot be found by `git log` is precisely the failure mode Phase 143 spent five record
corrections on. `git log -1 --format=%s 4aeae0ace` returns the subject quoted above, verbatim.

Criterion 1 is therefore **re-scoped** (D-01) rather than abandoned: same proof shape, live exemplars.
The primary exemplar becomes `_constituencies` on an `elections` row; the secondary becomes
`_elections` on a **`candidates`** row. `questions._elections` stays legal and gets a must-NOT-fire row
(`L`).

**What this ledger does not claim.** It does not claim the guard is total, it does not claim the
derivation covers every source (§ Source (4) derivation limit says otherwise, in advance), and it does
not claim any number it did not measure.

---

## Measurement, never citation — the clause that keeps this ledger honest

The rule, inherited from `142.1` and `143` and stated in the same blunt shape:

1. **The literal word for a borrowed observation — the past participle of "to cite" — is not a legal
   value in any cell of this register.** Every OLD half in this phase is measured in `144-01`, on the
   untouched tree, with its own log path and its own HEAD. Nothing is inherited from an earlier phase,
   and nothing is copied from `144-RESEARCH.md`.
2. **`144-RESEARCH.md`'s `[MEASURED]` annotations are pre-registered expectations, not evidence.**
   They tell a row what it should see. They never fill a cell. Four rows in this register — `A`, `P`,
   `F`, and the `Z*` family — have a documented prior in that document. **If a run disagrees with its
   prior, the run wins and the disagreement is reported as a finding**, never reconciled silently.
3. **Turbo's cache-replay verdict string — the one containing the present participle of "to replay" —
   is not a legal value in any cell of this register either.** `turbo.json:17-22` declares the
   `typecheck` task with **no `"cache": false"`**, exactly like `lint` and unlike `test:unit`. On a
   clean tree the task is a cache **HIT**, and a replayed exit code is a claim about a **previous**
   tree. Every turbo-mediated row therefore runs under `TURBO_FORCE=true` and records the verdict line
   as a **column**. **A turbo-mediated row that cannot show `executing` is not a measurement** and is
   re-run.
4. **`yarn lint:check --force` is forbidden** and is not a substitute: yarn appends the argument to the
   end of the `&&` chain rather than passing it to turbo, so it silently does nothing (D-06b).
5. Both forbidden words appear in this header, and only in this header, because a register cannot
   forbid a value it refuses to name.

---

## Width delta from the analog

**Nine columns against the analog's nine.** `143-NEGATIVE-CONTROL-LEDGER.md:249-261` uses
`Row · Site · Injection file · Command · HEAD · turbo verdict · Exit · Errors · Outcome`.
This register uses
`Row · Site · Injection / fixture · Instrument + command · HEAD · Cache verdict · Exit · Assertion outcome · Outcome`.

**The width is identical; three column *meanings* are generalised.** Each generalisation, with its
reason:

- **`Command` → `Instrument + command`.** 143's register had **one** instrument (the lint gate) and
  could fold it into the command string. This phase's instrument set is **four** — `tsc`, `vitest`,
  the seed CLI and turbo — and a register that hid its instrument inside prose would let a reader
  credit a vitest red as a gate red. The cell therefore names the instrument first, then carries the
  **verbatim** command.
- **`turbo verdict` → `Cache verdict`.** Only some rows are turbo-mediated. The legal values are
  exactly two shapes: `cache bypass, force executing <hash>` (or `cache miss, executing <hash>`) for a
  turbo-mediated row, and `n/a — direct tsc` / `n/a — vitest` / `n/a — seed CLI` for the rest. **The
  cell is never blank.** 143's rule is inherited verbatim in substance: **a turbo-mediated row that
  cannot show `executing` is not a measurement.**
- **`Errors` → `Assertion outcome`.** 143's analog counted lint errors specifically. Here the cell
  holds the diagnostic code (`TS2353`, `TS2578`), the vitest pass/fail counts (`1 failed | 29
  passed`), the first 80 characters of a thrown message, or the database query result that proves a
  drop. **An exit code alone is not an assertion outcome**, and a row whose only evidence is an exit
  code is void.

**Carried over verbatim in substance from 143:** any extra sub-fact goes **inside an existing cell,
never as an unannounced tenth column**.

---

## ⚠ THE INVERSION — read this before reading any row

**In `144-01` almost every observation is expected GREEN / exit 0, and that is the point.** A guard
that has only ever been observed working is indistinguishable from a guard that cannot fail. This
plan's job is to produce the "cannot fail" record for all fourteen controls the phase owes, **before
any of them exists**. **The polarity flips from `144-02` onward**, where the same fixtures are expected
to turn red or throw.

**Row `A` is the restoration target.** Rows `C` and `Z` in `144-07` must reproduce it.

**Row `X` is a self-control pair, not an old-tree/new-tree pair.** Its two halves are "`@ts-expect-error`
directive **present**" versus "offending row **deleted**, directive now unused". Both halves are
measured under a widened tsconfig; what differs between them is the fixture, not the tree.

**⚠ Row `K` is the phase's ONE inverted pair (D-03a).** `K-OLD` is the **only** OLD half in this
register expected **RED**. Under an allow-list keyed by the *raw* template collection key with **no**
resolution step, the camelCase-collection case throws `no permitted-key set for collection
'questionCategories'` and the spec goes **RED (catch)**. Its NEW half in `144-04`, under resolved
keying, is expected **GREEN**. **An executor reading `K-OLD`'s red as a defect has that pair exactly
backwards.** Phase 143 carried exactly one such inverted pair (`E-OLD` / `E-NEW`) and gave it its own
⚠ section; this is the same construct.

### Pre-registered expectations, per row — expectations, never evidence

These are what each row *should* see. They fill no cell. Stated as prose rather than as a second table
so that no line here can be mistaken for a register row.

- `A` — 22 successful / 22 total, `0 cached`. **Restoration target.**
- `T1-OLD`, `T2-OLD` — **0 diagnostics**, exit 0, `GREEN (blind)`. A red means today's `Template`
  already rejects the exemplar and D-01 has no premise: **stop and re-derive.**
- `T1-NEW`, `T2-NEW` — `TS2353` naming `ElectionsFixedRow` / `CandidatesFixedRow`, `RED (catch)`.
- `G-OLD` — exit **0**: the narrow `include: ["src/**/*"]` cannot see `tests/`. `GREEN (blind)`.
- `G-NEW` — exit **1** under the widened config through `TURBO_FORCE=true`. `RED (catch)`.
- `X-OLD` — **0 diagnostics** (directive present). `X-NEW` — `TS2578` (directive unused).
- `R1-OLD`, `R2-OLD`, `DENY-OLD` — seed CLI **completes at exit 0** *and* the key is provably absent
  from the database. **Exit 0 alone is not the evidence; the SQL query is.**
- `R1-NEW`, `R2-NEW`, `DENY-NEW` — exit **1** with a message naming the key, the `external_id` and the
  collection.
- `Z1-OLD` … `Z4-OLD` — each blind zod site **still passes** with its declaration removed from the
  schema. A red means the site was never blind.
- `Z1-NEW` … `Z4-NEW` — each site **fails** under `.strict()`.
- `DRV-OLD` — the reconstructed parallel-list derivation spec stays **GREEN** with an unread pair
  added. `DRV-NEW` — the const-driven form goes **RED** on the same addition.
- `K-OLD` — ⚠ **RED, and the red is the success signal.** `K-NEW` — **GREEN**.
- `V-OLD` — `resolveTemplate` returns a built-in carrying an unknown top-level key **without
  throwing**. `V-NEW` — throws `Template validation failed:`.
- `L` — must-NOT-fire: `questions._elections` compiles clean under the NEW types *and* `planLinks`
  emits one entry for it.
- `NC` — must-NOT-fire: **0 throws** across every row every built-in emits.
- `AF` — re-measured as already-failable, **not** claimed as a fix. `NA` — `N/A — by construction`.
- `F` — four rejection counts, one per allow-list composition. `P` — verbatim pre-existing
  diagnostics, before → after.
- `C` — restore proof. `Z` — closing revert reproducing row `A`.

---

## Precedent chain

**`144-NEGATIVE-CONTROL-LEDGER.md` → `143-NEGATIVE-CONTROL-LEDGER.md` →
`142.1-NEGATIVE-CONTROL-LEDGER.md` → `142-NEGATIVE-CONTROL-LEDGER.md` → `141-ASSERT10-LEDGER.md` →
`138-NEGATIVE-CONTROL.md` → `137-NEGATIVE-CONTROL.md` → `136-VISUAL-DISCRIMINATION-EVIDENCE.md`.**

Rows are **not** appended to any earlier ledger. 143's corpus is "exactly 19 rows", 142.1's is "exactly
8 pairs" and 142's is "exactly 12 findings"; adding to any of them would break a count those documents
assert about themselves.

---

## Injection register

Nine columns, in this order:
`Row · Site · Injection / fixture · Instrument + command · HEAD · Cache verdict · Exit · Assertion outcome · Outcome`.

**Ordering guarantee (inherited from 143's D-13, from 142.1's D-19, from 142's D-09, from 139): all
thirty-seven rows below were written and committed before the phase's first measurement existed.**
Every measurement cell read the placeholder at creation — **37 rows × 5 unfilled cells = 185**
occurrences. That ordering is a property of the **commit graph** (`144-01` Task 1's first commit
precedes every measurement in this phase and precedes `144-02` entirely), not a claim made in prose
about itself. **Each plan clears only its own rows**, so the placeholder count is a running assertion:
185 at creation → 180 after row `A` → 155 after Task 2 → 115 after Task 3 → **100** at the close of
`144-01`, leaving exactly the twenty rows the six later plans own.

| Row | Site | Injection / fixture | Instrument + command | HEAD | Cache verdict | Exit | Assertion outcome | Outcome |
|---|---|---|---|---|---|---|---|---|
| A | none — clean baseline, untouched tree · **restoration target** for rows `C` and `Z` | — | turbo · `TURBO_FORCE=true npx turbo run typecheck` | `61209c9ff` — the ledger-opening commit; tree byte-identical to `d2ffc3904` across `packages`, `apps`, `tests` and the repo root | `@openvaa/core:typecheck: cache bypass, force executing f8c40610e621ed2f` — and **22 of 22** verdict lines read `cache bypass, force executing`, not one a cache replay · aggregate `Cached: 0 cached, 22 total` | **0** | `Tasks: 22 successful, 22 total` · `Cached: 0 cached, 22 total` · `Time: 19.56s` · `@openvaa/frontend:typecheck: svelte-check found 0 errors and 0 warnings` | **RESTORATION TARGET.** Rows `C` and `Z` in `144-07` must reproduce this exit code and these two aggregate lines. Two benign turbo WARNINGs accompany every clean run and are part of the target, not noise to explain away: `no output files found for task @openvaa/shared-config#build` and `… for task @openvaa/supabase-types#build`. **Agrees with its prior:** `144-RESEARCH.md` R8.4 pre-registered 22/22 with 0 cached at `ee58a4be7`; this run, measured at `61209c9ff`, produced the same figures (elapsed 19.56 s here against the document's 19.267 s — elapsed time is not an assertion). Log `tc-A-1.log` |
| T1-OLD | D-01 **primary** exemplar · `elections._constituencies` under today's `Template` (`template/types.ts:85`) | `packages/dev-seed/src/__probe144_t1.ts` — untracked probe, literal written **inline** inside the `fixed:` array | tsc · `npx tsc --noEmit -p packages/dev-seed/tsconfig.json` | `829ccf979` — untouched tree; the probe is untracked and `tsconfig.json` is unmodified | `n/a — direct tsc` | **0** | **0 diagnostics** — `grep -c 'error TS' tc-T1-OLD-1.log` → `0`; the log's combined-output section is empty because `tsc` prints nothing on success | **GREEN (blind).** Today's `Template` types `fixed` as `Array<Record<string, unknown>>` (`schema.ts:34-37` via `types.ts:85`), so `_constituencies` on an `elections` row is not merely tolerated — it is **indistinguishable from a real column**. D-01's premise, measured rather than argued. **Not vacuous:** an apparatus control taken in the same window — `packages/dev-seed/src/__probe144_ctrl.ts` with `export const notANumber: number = 'definitely not a number';` — made this exact command exit **2** with `error TS2322: Type 'string' is not assignable to type 'number'`, so the instrument demonstrably sees `src/`. Log `tc-T1-OLD-1.log`, control log `tc-apparatus-ctrl-1.log` |
| T1-NEW | same row under `ElectionsFixedRow` (`template/permittedKeys.ts`) | `packages/dev-seed/src/__probe144_t1.ts` — untracked probe, re-created at the SAME path with the SAME shape as `T1-OLD`: `elections: { fixed: [{ external_id: 'el-1', _constituencies: { externalId: ['co-1'] } }] }` annotated `: Template`, literal written **inline** inside the `fixed:` array | tsc · `npx tsc --noEmit -p packages/dev-seed/tsconfig.json` — **byte-identical to the `T1-OLD` command**, so the pair differs only by the tree | `7ca1a260d` — the committed `144-02` tree; the probe is untracked and was removed inside its own iteration | `n/a — direct tsc` | **2** | **1 diagnostic, verbatim:** `src/__probe144_t1.ts(4,47): error TS2353: Object literal may only specify known properties, and '_constituencies' does not exist in type 'Partial<ElectionsFixedRow> & { external_id: string; }'.` — code **TS2353**, type name contains **`ElectionsFixedRow`**. **Delete-and-recompile clause, measured in the same iteration:** removing `_constituencies` and leaving `{ external_id: 'el-1' }` made the same command exit **0** with **0** diagnostics (log `tc-T1-NEW-deleted-1.log`) — the type rejects the illegal key and nothing else. | **RED (catch).** The inversion of `T1-OLD`. Same probe, same path, same command; the only difference is that `Template`'s `elections` slot is now `Fragment<ElectionsFixedRow>` instead of `z.infer`'s `Record<string, unknown>`. Log `tc-T1-NEW-1.log` |
| T2-OLD | D-01 **secondary** exemplar · `candidates._elections` under today's `Template` | `packages/dev-seed/src/__probe144_t2.ts` — untracked probe, inline literal with `first_name` + `last_name` | tsc · `npx tsc --noEmit -p packages/dev-seed/tsconfig.json` | `829ccf979` — untouched tree; the probe is untracked and `tsconfig.json` is unmodified | `n/a — direct tsc` | **0** | **0 diagnostics** — `grep -c 'error TS' tc-T2-OLD-1.log` → `0` | **GREEN (blind).** The secondary exemplar behaves identically to the primary, for the same structural reason: `Record<string, unknown>` admits every key. Note the asymmetry this pair exists to establish — `_elections` is illegal on a **`candidates`** row but **legal** on a `questions` row (`supabaseAdminClient.ts:543`), and today's types cannot tell the two apart. Log `tc-T2-OLD-1.log` |
| T2-NEW | same row under `CandidatesFixedRow` | `packages/dev-seed/src/__probe144_t2.ts` — untracked probe at the SAME path and shape as `T2-OLD`: an inline `candidates.fixed` literal with `first_name` + `last_name` carrying `_elections` | tsc · `npx tsc --noEmit -p packages/dev-seed/tsconfig.json` — byte-identical to the `T2-OLD` command | `7ca1a260d` — the committed `144-02` tree; probe untracked, removed in-iteration | `n/a — direct tsc` | **2** | **1 diagnostic, verbatim:** `src/__probe144_t2.ts(5,80): error TS2353: Object literal may only specify known properties, and '_elections' does not exist in type 'Partial<CandidatesFixedRow> & { external_id: string; }'.` — code **TS2353**, type name contains **`CandidatesFixedRow`**. **Delete-and-recompile clause:** removing `_elections` made the same command exit **0** (log `tc-T2-NEW-deleted-1.log`). | **RED (catch).** With row `L` below, this is the asymmetry the phase set out to buy: `_elections` is now an error on a `candidates` row and still clean on a `questions` row, which today's types could not tell apart. Log `tc-T2-NEW-1.log` |
| G-OLD | Truth #2 · narrow `packages/dev-seed/tsconfig.json` (`include: ["src/**/*"]`) vs a deliberate type error under `tests/` | `packages/dev-seed/tests/__probe144/g.ts` — untracked probe, `number`-annotated export initialised with a string | tsc · `npx tsc --noEmit -p packages/dev-seed/tsconfig.json` | `829ccf979` — untouched tree; `tsconfig.json` unmodified, `git hash-object` `7fba879dc6f4976b43646d8388401742a8aa7131` | `n/a — direct tsc` | **0** | **0 diagnostics** — `grep -c 'error TS' tc-G-OLD-1.log` → `0`. The probe file is not named anywhere in the output | **GREEN (blind).** `include: ["src/**/*"]` simply does not reach `tests/`. **This row's discriminating power comes from the apparatus control:** the injected error is `export const notANumber: number = 'definitely not a number';` — the *byte-identical* statement that, placed under `src/`, made this exact command exit **2** with `TS2322`. Same error, same compiler, same config; only the directory differs, and the gate goes from red to silent. Truth #2's blind half, measured. Log `tc-G-OLD-1.log`, control log `tc-apparatus-ctrl-1.log` |
| G-NEW | same error under the **widened, committed** tsconfig, through the new gate | `packages/dev-seed/tests/__probe144/g.ts` — untracked probe, re-created **byte-identically** to `G-OLD`'s: a single line, `export const notANumber: number = 'definitely not a number';`. Same path, same statement, same trailing newline. The pair therefore differs only by the tsconfig `include` and by the gate that reads it | **Both forms, and they agree.** Register-pre-registered form: turbo · `TURBO_FORCE=true npx turbo run typecheck`. Plan form, which is the same command reached through the script this plan adds: `TURBO_FORCE=true yarn typecheck`, whose body is exactly `turbo run typecheck`. ⚠ Note `G-OLD` ran a **different** instrument (`npx tsc --noEmit -p packages/dev-seed/tsconfig.json`) — deliberately, and stated here rather than glossed: `G-OLD` measured whether the *compiler* could see `tests/`, and `G-NEW` measures whether the *gate* does, which is a strictly stronger claim and the whole point of Truth #2. The injected error is byte-identical, so the pair is still a pair | `d76bb04f2` — the tree after this plan's Task 1 (fixture + row `X-NEW`) with Task 2's `package.json` and `.github/workflows/main.yaml` edits uncommitted in the working tree, which is what makes `yarn typecheck` resolvable at all. The probe is untracked and was removed inside its own iteration | `@openvaa/dev-seed:typecheck: cache bypass, force executing 1551280ae4997bef` — **identical task hash under both command forms**, and `0 cached` in both aggregates (`0 cached, 21 total` for `yarn typecheck`; `0 cached, 17 total` for the bare turbo form — the totals differ only because turbo stops scheduling dependents once the task fails). Not one line in either log is a cache replay | **2** — under both forms; turbo's own trailer reads `ERROR  run failed: command  exited (2)` and `Failed: @openvaa/dev-seed#typecheck`. ⚠ **Correction against the plan, reported not reconciled:** `144-06-PLAN.md` predicts **exit 1**. The measured value is **2**, matching `144-01`'s `X-OLD` and row `P`, `144-02`'s `T1-NEW`/`T2-NEW`, and this plan's `X-NEW`. The plan text under-predicts by one, consistently, across the whole phase | **1 diagnostic, verbatim:** `@openvaa/dev-seed:typecheck: tests/__probe144/g.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.` — code **TS2322**, and it **names the probe file**. ⚠ **Row `G-OLD`, restated here so the pair reads as a pair:** the byte-identical probe at the byte-identical path, under the narrow `include: ["src/**/*"]`, made its command exit **0** with **0 diagnostics** (`grep -c 'error TS' tc-G-OLD-1.log` → `0`) and the probe file was **not named anywhere** in that output. Exit **0** → exit **2**; silent → named. That delta is Truth #2 | **RED (catch).** A deliberate type error under `packages/dev-seed/tests/` now **fails a blocking gate**, where before this phase it was invisible to every gate in the repository — `packages/dev-seed/tests/` had sat outside its own package's `tsconfig` `include` since the workspace was scaffolded at `4fc1abb2d`. The catch is the deliverable, and it is what converts TMPL-01 from an IDE-only claim into a gated one: the same `turbo run typecheck` now runs from `package.json`'s `lint:check` chain and from its own named step in `.github/workflows/main.yaml`. **Restored, proven three ways:** `find packages/dev-seed -name '__probe144*' -not -path '*/node_modules/*'` → (no matches) <br> `TURBO_FORCE=true yarn typecheck` re-run after removal → exit **0**, `grep -c 'error TS'` → **0**, `22 successful, 22 total` / `0 cached, 22 total` (log `tc-G-restore-1.log`) <br> `git status --porcelain -- packages apps tests` → (empty). **Not vacuous:** the restore run above proves the instrument was still looking and still green on the same tree minus one file. Logs `tc-G-NEW-1.log` (`yarn typecheck`), `tc-G-NEW-turbo-1.log` (bare turbo), `tc-G-restore-1.log` |
| X-OLD | ⚠ **self-control pair** — directive present vs offending row deleted, **not** old tree vs new tree · `@ts-expect-error` directive **present** | `packages/dev-seed/tests/__probe144/x.ts` + a **transient uncommitted** widening of `packages/dev-seed/tsconfig.json` | tsc · `npx tsc --noEmit -p packages/dev-seed/tsconfig.json` | `829ccf979` + a **transient uncommitted** widening — `include: ["src/**/*", "tests/**/*", "scripts/**/*"]` and the `rootDir` entry deleted (legal because this file already overrides `composite: false`) | `n/a — direct tsc` | **2** — whole-run exit; **all three** diagnostics belong to row `P`, and **not one** of them names the fixture | **0 diagnostics** from `packages/dev-seed/tests/__probe144/x.ts` — `grep -c '__probe144' tc-P-before-1.log` → `0`. **The absence of `TS2578` is the load-bearing half of this observation:** an unused `@ts-expect-error` is itself an error, so a silent directive proves the excess-property error really did occur and really was suppressed | **GREEN — self-control present-arm.** ⚠ This pair's two halves are "directive **present**" vs "offending row **deleted**", **not** old tree vs new tree; both are measured under a widened config. `X-NEW` (`144-06`) deletes the row and expects `TS2578: Unused '@ts-expect-error' directive`. **Restored, proven three ways, verbatim:** `git diff --exit-code -- packages/dev-seed/tsconfig.json` → exit **0** <br> `git hash-object packages/dev-seed/tsconfig.json` → `7fba879dc6f4976b43646d8388401742a8aa7131`, **identical to the header value** <br> `find packages/dev-seed -name '__probe144*' -not -path '*/node_modules/*'` → (no matches). Plus `git status --porcelain -- packages apps tests` → (empty) and `git log --oneline -1 -- packages/dev-seed/tsconfig.json` → `4fc1abb2d` (a Phase-56 commit) — **the widening never reached history.** Log `tc-P-before-1.log`. **AFTER (144-02 Task 2): 0 errors.** `TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed` → exit **0**, `grep -c 'error TS' tc-P-after-1.log` → **0**, `7 successful, 0 cached`. All three fixed with real fixes and no cast escapes; the after-half's zero confirms none was cosmetic. Log `tc-P-after-1.log` |
| X-NEW | ⚠ **self-control pair** · offending row **deleted**, directive now unused | the standing fixture `packages/dev-seed/tests/template/strictRowTypes.type-test.ts` (landed by `144-06` at `64819a519`) with **one line removed** as a transient uncommitted edit — the primary exemplar's `_constituencies: { externalId: ['negctl144-co-1'] }` key deleted, its directive left in place, so the directive becomes unused. Nothing else in the file is touched | **Both forms, and they agree.** Pre-registered instrument: tsc · `npx tsc --noEmit -p packages/dev-seed/tsconfig.json`. Gate form the plan required: turbo · `TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed`. ⚠ **Divergence, flagged not reconciled:** this cell was pre-registered in `144-01` naming tsc only, while `144-06`'s action names the turbo gate form. **Both were run, on the same edit, in the same iteration**, rather than choosing one and silently rewriting the pre-registration | `64819a519` — the commit that landed the fixture (`test(144-06)`), tree otherwise clean (`git status --porcelain -- packages apps tests` → empty before the edit). Both halves of this pair are taken at **this same HEAD**: it is a self-control, not an old-tree/new-tree pair | **turbo half:** `@openvaa/dev-seed:typecheck: cache bypass, force executing de41a25eb3c80182` · aggregate `0 cached, 7 total` — the deleted-arm run is a forced execution, never a replay. **Present arm, same aggregate:** `cache bypass, force executing 84a48627f1baa460`, `0 cached, 7 total`. ⚠ The two task hashes **differ** (`de41a25…` vs `84a48627…`), which is itself evidence the compiler saw two different trees. · **tsc half:** `n/a — direct tsc` | **2** — under **both** instruments. ⚠ **Correction against the plan's prediction, reported rather than reconciled:** `144-06-PLAN.md`'s action and acceptance criteria predict **exit 1**; the measured value is **2**, `tsc`'s code for a run that completed and emitted diagnostics. This corroborates `144-02`'s and `144-01`'s independent finding that this phase's plan text under-predicts `tsc`'s exit code by one. The run wins | **1 diagnostic, verbatim, identical under both instruments:** `packages/dev-seed/tests/template/strictRowTypes.type-test.ts(50,3): error TS2578: Unused '@ts-expect-error' directive.` — code **TS2578**, and the diagnostic **names this file**. (The turbo log prefixes the same line with `@openvaa/dev-seed:typecheck: ` and reports the path workspace-relative as `tests/template/strictRowTypes.type-test.ts`.) **The pair's green half, recorded here so the row reads in one place:** with the offending row present and nothing else changed, the same two commands exit **0** with **0 diagnostics** — `grep -c 'error TS' tc-X-present-1.log` → **0** and `grep -c 'error TS' tc-X-present-tsc-1.log` → **0** (⚠ that log carries a provenance header — command, HEAD, fixture blob hash `9085fb0b1cc171e42102a9397cc72a8ad6871b31`, exit code — because `tsc` prints **nothing** on success and a 0-byte file is not evidence; the same header convention `144-01` used for its own silent `tsc` successes). That green half **reproduces row `X-OLD`**, which measured the same fixture shape at 0 diagnostics under a transiently widened config; `X-OLD` is this row's cross-reference and the two agree | **RED (catch).** ⚠ **self-control** pair — the two halves are *directive present, offending row in place* (**green**, 0 diagnostics) versus *offending row deleted, directive now unused* (**red**, `TS2578`), **both on the same tree at `64819a519`**, not an old-tree/new-tree pair. What the pair proves is that the fixture **cannot silently rot**: an unused suppression directive is itself a diagnostic, so an executor who deletes the offending key to "clean up" turns the gate **red** rather than quietly converting a standing control into a decoration. **Restored, proven three ways, verbatim:** `git diff --exit-code -- packages/dev-seed/tests/template/strictRowTypes.type-test.ts` → exit **0** <br> `git hash-object packages/dev-seed/tests/template/strictRowTypes.type-test.ts` → `9085fb0b1cc171e42102a9397cc72a8ad6871b31`, **identical to `git rev-parse HEAD:…`** <br> `git status --porcelain -- packages apps tests` → (empty). Plus a fourth: the post-restore re-run is green **at task hash `84a48627f1baa460`, byte-identical to the present arm's**, so the restore returned the compiler to exactly the tree it started from. **Not vacuous:** the same command on the same tree with the key present emits **0** diagnostics, so the red is the deleted line and nothing else. Logs `tc-X-NEW-1.log` (turbo), `tc-X-NEW-tsc-1.log` (tsc), `tc-X-present-1.log`, `tc-X-present-tsc-1.log`, `tc-X-restore-1.log` |
| R1-OLD | D-08 class 1 · `elections._constituencies` through the seed CLI on the untouched tree | `packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts` — committed in `144-01` Task 4 | seed-cli · `yarn db:seed --template /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed/tests/fixtures/<fixture>.ts` (absolute; see each row's Outcome cell for the verbatim invocation) | `865178479` — untouched tree; this plan's only committed bytes are the ledger and the three inert fixtures | `n/a — seed CLI` | **0** | **exit 0 AND the SQL proof of the drop.** Run summary: `elections 1` · `constituencies 1` · `constituency_groups 0` · `Total 2`. Then, from `sql-R1-OLD-1.log`: the election exists (`external_id=negctl144-el-1 published=true custom_data=NULL`); **the join rows for that election number 0** (`select count(*) from election_constituency_groups ecg join elections e on e.id=ecg.election_id where e.external_id='negctl144-el-1'` → **0**); whole-DB `election_constituency_groups=0 constituency_group_constituencies=0`; and the referenced constituency `negctl144-co-1` exists, so the sentinel pointed at a real row and was still dropped | **GREEN (blind).** `_constituencies` on an `elections` row was accepted, stripped by the generic `_`-prefix rule, and **nothing whatsoever was written from it** — not a join row, not a JSONB column (`custom_data` is NULL). **Exit 0 is not the evidence; Q2 is.** ⚠ Research assumption **A5 verified before the row was recorded**: the summary reports `constituency_groups 0`, so `allGroupExtIds.length === 0`, `attachSentinels` did not fan out a `_constituencyGroups` onto the election, and the empty join table is attributable to the drop rather than to an absent fanout. Invocation, verbatim: `yarn db:seed --template /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts`. Logs `seed-R1-OLD-1.log`, `sql-R1-OLD-1.log` |
| R1-NEW | same fixture, byte-identical, after the Pass-0 guard lands | same file, same absolute path, unchanged — `git diff --exit-code -- packages/dev-seed/tests/fixtures` → exit **0** at the time of this run | seed-cli · `yarn db:seed --template /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts` — **byte-identical to the `R1-OLD` invocation**, so the two halves differ only by the tree | `58a6d3a48` — the committed `feat(144-04)` writer-wiring tree; `git status --porcelain -- packages apps tests` empty, `yarn db:reset` run once before this half and `yarn db:seed:teardown --prefix negctl144-` after it | `n/a — seed CLI` | **1** | **exit 1, and the message names all three things TMPL-02 requires.** First 80 characters of the thrown message: `assertKnownRowProps: unknown property '_constituencies' on collection 'elections` — the CLI wraps it as `Error: <message>`, and it reads correctly after that prefix. In full it names the offending key `_constituencies`, the collection `elections`, the row `external_id` `negctl144-el-1`, the resolved table, the fact that the pipeline never reads the key **so it would be silently dropped**, the 39 permitted keys for `elections`, and the remediation naming `LINK_SENTINELS` / `COLLECTION_NON_COLUMNS` in `packages/dev-seed/src/template/permittedKeys.ts`. **⬅ `R1-OLD` (blind half), restated so the pair reads in one place:** the same fixture, at the same absolute path, under the same command, exited **0** with the summary `elections 1 · constituencies 1 · constituency_groups 0 · Total 2`, and the SQL proof of the drop was `select count(*) from election_constituency_groups ecg join elections e on e.id=ecg.election_id where e.external_id='negctl144-el-1'` → **0**, with whole-DB `election_constituency_groups=0` and the election's `custom_data` NULL — nothing whatsoever written from the key. Log `seed-R1-NEW-1.log` | **RED (catch).** D-08 class (1), criterion 2 observed **both ways** on the real `--template ./custom.ts` entry path. On the untouched tree the key was accepted, stripped by the generic `_`-prefix rule, and the author got exit 0 and a row silently lacking what they asked for; here the run stops before Pass 1 with a message that names the key, the row and the collection. ⚠ Note the guard fired **before** any write: teardown after this half reported `0 rows deleted`, because `assertKnownRowProps` runs above `bulkImport` rather than beside it — which is the property `writer.test.ts`'s new "REJECTS … WITHOUT ever calling bulkImport" case asserts in the unit layer |
| R2-OLD | D-08 class 2 · `questions.answersByExternalId` through the seed CLI on the untouched tree | `packages/dev-seed/tests/fixtures/negctl-questions-answers.ts` — committed in `144-01` Task 4 | seed-cli · `yarn db:seed --template /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed/tests/fixtures/<fixture>.ts` (absolute; see each row's Outcome cell for the verbatim invocation) | `865178479` — untouched tree; this plan's only committed bytes are the ledger and the three inert fixtures | `n/a — seed CLI` | **0** | **exit 0 AND the SQL proof of the drop.** Run summary: `question_categories 1` · `questions 1` · `Total 2` — **the question row is reported created**, which is the first half of the observation. From `sql-R2-OLD-1.log`: the row exists and resolved its FK (`external_id=negctl144-qu-1 type=text category_id=c23d0681-…`); `custom_data=NULL` and `settings=NULL`; the row's complete non-null column list is `id, name, type, required, published, allow_open, created_at, project_id, updated_at, category_id, external_id, is_generated` — **no trace of the key**; rows carrying a non-empty `answers` object: **candidates 0, organizations 0**; and **0** rows anywhere mention `negctl144-cand-does-not-exist`, the external_id the dropped key referenced | **GREEN (blind).** `answersByExternalId` on a `questions` row is stripped globally by `NON_COLUMN_FIELDS` (`supabaseAdminClient.ts:140`) because `importAnswers` (`:246-257`) reads only `candidates` and `organizations`. Both halves of the observation hold: **the run completed and reported the row created**, and **nothing was written from the key**. ⚠ Disambiguation, recorded rather than glossed: the database holds **one** candidate row throughout, with `external_id=NULL` and `answers={}`, created at the `db:reset` timestamp — a `seed.sql` bootstrap row, matched by no `negctl144-` prefix and untouched by this fixture. A naive `answers is not null` count would have read **1** and been misread as a leak; the non-empty test reads **0**. Invocation, verbatim: `yarn db:seed --template /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed/tests/fixtures/negctl-questions-answers.ts`. Logs `seed-R2-OLD-1.log`, `sql-R2-OLD-1.log` |
| R2-NEW | same fixture, byte-identical, after the Pass-0 guard lands | same file, same absolute path, unchanged — `git diff --exit-code -- packages/dev-seed/tests/fixtures` → exit **0** at the time of this run | seed-cli · `yarn db:seed --template /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed/tests/fixtures/negctl-questions-answers.ts` — **byte-identical to the `R2-OLD` invocation** | `58a6d3a48` — the committed `feat(144-04)` writer-wiring tree; clean tree, `yarn db:seed:teardown --prefix negctl144-` run before and after this half | `n/a — seed CLI` | **1** | **exit 1, three-part message.** First 80 characters: `assertKnownRowProps: unknown property 'answersByExternalId' on collection 'quest` — in full naming the key `answersByExternalId`, the collection `questions`, the row `external_id` `negctl144-qu-1`, the 42 permitted keys for `questions`, and the remediation. **⬅ `R2-OLD` (blind half), restated:** the same fixture under the same command exited **0** with `question_categories 1 · questions 1 · Total 2` — **the question row reported created** — and the SQL proof was that the row's complete non-null column list (`id, name, type, required, published, allow_open, created_at, project_id, updated_at, category_id, external_id, is_generated`) carried **no trace** of the key, rows with a non-empty `answers` object numbered **candidates 0, organizations 0**, and **0** rows anywhere mentioned `negctl144-cand-does-not-exist`. ⚠ **This row required a fix to the permitted-key composition to be able to fire at all, and that is stated rather than glossed:** `144-02` moved `answersByExternalId` into `NON_COLUMN_FIELDS`, which `bulkImport` strips **globally**, and the four-source union therefore admitted it on **every** collection — including `questions`. Under that composition this NEW half would have exited 0 and the control would have been structurally unable to fire. `144-04` scoped PERMISSION for that key to the two collections `importAnswers` actually READS (`candidates`, `organizations`) while leaving the global STRIP untouched; measured cost across all 30 built-ins: **zero** (the key occurs only on `candidates`, 438 rows, and `organizations`, 1 row). Log `seed-R2-NEW-1.log` | **RED (catch).** D-08 class (2). This is the fixture whose whole point is that the key is *not* a typo a spell-checker would catch — `answersByExternalId` is real and supported, just on the wrong table. On the untouched tree it was stripped globally and nothing was written from it while the run reported success; here it is refused by name, on the collection, with the row identified |
| Z1-OLD | D-05 site `tests/template.test.ts:46` — the `accepts valid top-level fields` case at `:39` | transient deletion of the `seed` / `externalIdPrefix` / `projectId` declarations from `TemplateSchema` | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/template.test.ts` | `f2cb118b4` — untouched tree apart from the row's own transient, uncommitted injection | `n/a — vitest` | **1** | `Tests  2 failed | 9 passed (11)` — and **the target site is among the 9 that passed**: `✓ accepts valid top-level fields (seed, externalIdPrefix, projectId)`. The 2 reds are *different* cases (`TMPL-09: top-level field-path error — seed: "forty-two"` and `TMPL-09: invalid UUID projectId …`) | **GREEN (blind).** The site that claims to accept `seed` / `externalIdPrefix` / `projectId` passes with **all three declarations deleted from the schema**, because a non-strict zod object silently strips unknown keys — so `.not.toThrow()` can never observe their absence. **The 2 reds are the apparatus control:** they prove the deletion really landed, which is exactly what makes the target site's green a blindness rather than a no-op. `git checkout --` restored the file; `git hash-object packages/dev-seed/src/template/schema.ts` → `a65a33f7f4049a35bf33ffc7ba5c67955be73ac2`, identical to the header value. Log `vt-Z1-OLD-1.log` |
| Z1-NEW | same site under `TemplateSchema.strict()` — now at `tests/template.test.ts:46`, `it(` at `:39`, unmoved | same transient deletion, post-change tree — the `seed` / `externalIdPrefix` / `projectId` declarations deleted from `TemplateSchema`, byte-for-byte the removal `Z1-OLD` used | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/template.test.ts` | `5490b9b4b` — the committed `.strict()` tree (`feat(144-05)`); `git hash-object schema.ts` `6e575e6712766ef83d121c786add73324394ff9c` before the injection and byte-identical again after `git checkout --` closed the iteration | n/a — vitest | **1** | **RED direction** — `Tests  3 failed | 12 passed (15)`, and **the target site is among the 3 that failed**: `× accepts valid top-level fields (seed, externalIdPrefix, projectId)`. The other 2 reds are the *same* apparatus control `Z1-OLD` recorded (`TMPL-09: top-level field-path error — seed: "forty-two"` and `TMPL-09: invalid UUID projectId …`), which is what proves the deletion landed. **GREEN direction** — declarations restored, no injection: exit `0`, `Tests  15 passed (15)`, target site green. | **RED (catch).** The pair with `Z1-OLD` is exact and the tree is the only difference between the halves: same three declarations removed, same command, same file. Blind half: the target **passed** with all three gone, because a non-strict zod object strips unknown keys and `.not.toThrow()` therefore cannot observe a declaration’s absence. This half: the target **fails**, and the failure names the case. Log `vt-Z1-NEW-1.log`. |
| Z2-OLD | D-05 site `tests/template.test.ts:56` — the `accepts nested fixed[] with arbitrary partial row shapes` case at `:49` | transient deletion of the `fixed` declaration from `perEntityFragment` | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/template.test.ts` | `f2cb118b4` — untouched tree apart from the row's own transient, uncommitted injection | `n/a — vitest` | **0** | `Tests  11 passed (11)` — **the entire spec file passed**, target site `✓ accepts nested fixed[] with arbitrary partial row shapes (z.unknown values)` included. **Not one of the 11 cases noticed** that `fixed` no longer exists in the schema | **GREEN (blind).** The strongest blindness in the `Z` family: deleting `fixed` from `perEntityFragment` outright cost **zero** test failures across the whole file. `fixed` is where every hand-authored row lives, and no assertion in the suite can tell whether the schema declares it. Restored; blob back to `a65a33f7f4049a35bf33ffc7ba5c67955be73ac2`. Log `vt-Z2-OLD-1.log` |
| Z2-NEW | same site under `perEntityFragment.strict()` — now at `tests/template.test.ts:56`, `it(` at `:49`, unmoved | same transient deletion, post-change tree — the `fixed` declaration deleted from `perEntityFragment`, byte-for-byte the removal `Z2-OLD` used | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/template.test.ts` | `5490b9b4b` — the committed `.strict()` tree (`feat(144-05)`); `git hash-object schema.ts` `6e575e6712766ef83d121c786add73324394ff9c` before the injection and byte-identical again after `git checkout --` closed the iteration | n/a — vitest | **1** | **RED direction** — `Tests  2 failed | 13 passed (15)`, target site `× accepts nested fixed[] with arbitrary partial row shapes (z.unknown values)` among them. The second red is this plan’s own D-04 companion case (`still ACCEPTS an arbitrary key inside a fixed[] row`) — a second, independent witness to the same deletion rather than unrelated apparatus noise. **GREEN direction** — `fixed` restored: exit `0`, `Tests  15 passed (15)`. | **RED (catch).** The largest reversal in the `Z` family. `Z2-OLD` deleted `fixed` outright — the declaration every hand-authored row lives under — and cost **zero** failures across the whole file (`11 passed (11)`); the same deletion now costs two. ⚠ The catch comes from **`perEntityFragment.strict()`, not from `TemplateSchema.strict()`**: re-measured at this tree’s zod 4.3.6, a top-level-only strict schema parses `{candidates:{fixed:[…],bogus:3}}` with `success: true` and **silently strips** `bogus` (probe C, `vt-…/zodprobe.log`). This row is the standing evidence for T-144-34. Log `vt-Z2-NEW-1.log`. |
| Z3-OLD | D-05 site `tests/template.test.ts:74` — the `accepts per-entity fragment for every expected key` case at `:59` | transient deletion of exactly one of the twelve per-entity slots from `TemplateSchema` | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/template.test.ts` | `f2cb118b4` — untouched tree apart from the row's own transient, uncommitted injection | `n/a — vitest` | **0** | `Tests  11 passed (11)` — target site `✓ accepts per-entity fragment for every expected key (12 non-system public tables)` passed with only **11** slots declared | **GREEN (blind).** The deleted slot was **`nominations`** — named here because the row is worthless without it. A case whose own title asserts *"every expected key (12 non-system public tables)"* passes when the schema declares eleven, since the twelfth is silently stripped rather than rejected. Restored; blob back to `a65a33f7f4049a35bf33ffc7ba5c67955be73ac2`. Log `vt-Z3-OLD-1.log` |
| Z3-NEW | same site under `.strict()` — now at `tests/template.test.ts:74`, `it(` at `:59`, unmoved | same transient deletion, post-change tree — exactly one per-entity slot deleted from `TemplateSchema`, and the same slot `Z3-OLD` named: **`nominations`** | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/template.test.ts` | `5490b9b4b` — the committed `.strict()` tree (`feat(144-05)`); `git hash-object schema.ts` `6e575e6712766ef83d121c786add73324394ff9c` before the injection and byte-identical again after `git checkout --` closed the iteration | n/a — vitest | **1** | **RED direction** — `Tests  1 failed | 14 passed (15)`, and the **sole** failure is the target site `× accepts per-entity fragment for every expected key (12 non-system public tables)`. No apparatus control was needed here: under `.strict()` the site itself is the detector, so the deletion has exactly one consequence and it is the intended one. **GREEN direction** — the `nominations` slot restored: exit `0`, `Tests  15 passed (15)`. | **RED (catch).** Blind half: a case whose own title asserts *“every expected key (12 non-system public tables)”* passed while the schema declared **eleven**, because the twelfth was stripped rather than rejected. This half: eleven declared produces one red and the red names the case. Log `vt-Z3-NEW-1.log`. |
| Z4-OLD | D-05 site `tests/template/latent.schema.test.ts:35` — the `accepts empty latent block` case at `:34` | transient deletion of the `.extend({ latent: latentBlock.optional() })` chain link | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/template/latent.schema.test.ts` | `f2cb118b4` — untouched tree apart from the row's own transient, uncommitted injection | `n/a — vitest` | **1** | `Tests  3 failed | 4 passed (7)` — target site `✓ accepts empty latent block` is among the 4 passes. The 3 reds are the `rejects …` cases (`rejects mismatched dimensions/eigenvalues length`, `rejects negative noise`, `rejects unknown keys via .strict()`) | **GREEN (blind).** With the whole `.extend({ latent: … })` chain link gone, `validateTemplate({ latent: {} })` still does not throw — the key is stripped. **The 3 reds are the apparatus control** proving the deletion landed. ⚠ Note for `144-05`: the sibling case at `latent.schema.test.ts:38` (`accepts matching dimensions + eigenvalues`) also passed here, but that does **not** make it blind — it is **already failable** via `latentBlock`'s own `.strict()` at `schema.ts:64`, which this injection did not touch. That site is row `AF`, owned by `144-05`, and is re-measured there with its own injection rather than claimed as a fix. Restored; blob back to `a65a33f7f4049a35bf33ffc7ba5c67955be73ac2`. Log `vt-Z4-OLD-1.log` |
| Z4-NEW | same site under `.strict()` — `accepts empty latent block`, `it(` now at `tests/template/latent.schema.test.ts:42` (was `:34`; the file shifted by +8 when row `NA`’s site was converted to the round-trip form in the same plan) | same transient deletion, post-change tree — the whole `.extend({ latent: latentBlock.optional() })` chain link deleted, byte-for-byte the removal `Z4-OLD` used | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/template/latent.schema.test.ts` | `5490b9b4b` — the committed `.strict()` tree (`feat(144-05)`); `git hash-object schema.ts` `6e575e6712766ef83d121c786add73324394ff9c` before the injection and byte-identical again after `git checkout --` closed the iteration | n/a — vitest | **1** | **RED direction** — `Tests  5 failed | 2 passed (7)`, target site `× accepts empty latent block` among them. Three of the reds are the same apparatus control `Z4-OLD` recorded (`rejects mismatched dimensions/eigenvalues length`, `rejects negative noise`, `rejects unknown keys via .strict()`); the fourth extra red is row `AF`’s site, which a whole-chain-link deletion necessarily reddens too. **GREEN direction** — the chain link restored: exit `0`, `Tests  7 passed (7)`. | **RED (catch).** Blind half: `validateTemplate({ latent: {} })` still did not throw with the entire `.extend({ latent })` link gone, because the key was stripped. This half: it throws and the target site fails. ⚠ **Iteration 0 was discarded and is preserved, not dropped.** The first `sed` used a line number computed before an earlier iteration’s edit and removed a *comment* line instead of the chain link; that run was a no-op (`7 passed (7)`) and is kept at `vt-Z4-NEW-0-DISCARDED-misinjection.log`. Iteration 1 verified the apparatus before running — `grep -c '.extend({ latent: latentBlock' → 0`. Log `vt-Z4-NEW-1.log`. |
| DRV-OLD | criterion 4 · the **parallel-list** shape the const-driven design exists to rule out | `packages/dev-seed/tests/__probe144/drv-old.test.ts` — untracked spec with a hand-written `PERMITTED_SENTINELS` list plus an unread `elections/_constituencies` pair | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/__probe144/drv-old.test.ts` | `f2cb118b4` — untouched tree; the probe spec is untracked and no tracked file is modified | `n/a — vitest` | **0** | `Tests  3 passed (3)` — the hand list equals the hand expectation with `elections/_constituencies` added to **both** | **GREEN (blind).** The pair added is one the resolver **provably never reads**, and the proof is structural rather than rhetorical: `_constituencies` is read only on `constituency_groups` (`supabaseAdminClient.ts:446`) and, via `constResolve`, on `question_categories` / `questions` (`:556`); `constResolve`'s own parameter is typed `table: 'question_categories' | 'questions'` at **`:552`** and is dispatched at `:590-591` only — the sibling `electionResolve` carries the identical signature at **`:508`**. The `elections` block at `:393-398` reads `_constituencyGroups` / `_constituency_groups` and the bare forms, never `_constituencies`. A parallel list therefore accepts an entry no code path can consume, and the spec cannot notice. Log `vt-DRV-OLD-1.log` |
| DRV-NEW | criterion 4 · const-driven · the same pair added to `LINK_SENTINELS` | `packages/dev-seed/tests/template/linkSentinels.test.ts` with the same pair added — `elections` / `_constituencies`, byte-identical to the pair row `DRV-OLD` used, appended to `LINK_SENTINELS` as a fifth rule (`collections: ['elections'], keys: ['_constituencies'], refTable: 'constituencies', target: { kind: 'jsonb', column: 'constituency_ids' }`) as a transient uncommitted edit | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/template/linkSentinels.test.ts` — the same invocation form `DRV-OLD` used, so the two halves differ only by the code shape | `69b1ff1e6` — the committed `144-03` tree after Task 3's spec landed; the injection is uncommitted and was reverted inside its own iteration | `n/a — vitest` | **1** | `Tests  3 failed | 14 passed (17)` · `Test Files  1 failed (1)`. **The three reds, named:** (1) `flattens to exactly the hand-enumerated ten (collection, key) pairs — asserted against the CONST (RES-1)` → `AssertionError: expected [ …(11) ] to deeply equal [ …(10) ]`; (2) `planLinks dispatches exactly the hand-enumerated pairs — no more, no fewer` → the same 11-vs-10 assertion, so the pair was not merely declared but **dispatched**; (3) `a pair the resolver does NOT read produces no plan entry — the must-NOT-fire control` → `AssertionError: expected [ { collection: 'elections', …(5) } ] to deeply equal []`. **Red (3) is the load-bearing one:** it shows the resolver HANDLING the newly-declared pair with no other edit — criterion 4's structural guarantee in the same run that catches the silent growth | **RED (catch).** The inversion of `DRV-OLD`, and the whole point of D-03's shape. `DRV-OLD` added this same pair to a hand-written `PERMITTED_SENTINELS` list beside an untouched `linkJoinTables` and the derivation spec stayed **GREEN (blind)** — a parallel list is connected to nothing, so it accepted an entry no code path could consume. Here the list IS the control flow: adding the pair to `LINK_SENTINELS` made `planLinks` resolve it immediately (red 3), and the **hand-enumerated** expectation refused it (reds 1 and 2). ⚠ The expectation is hand-written precisely so this is possible — derived from the const it would have moved with the const and passed. **Restored, proven three ways, verbatim:** `git diff --exit-code -- packages/dev-seed/src/template/linkSentinels.ts` → exit **0** <br> `git hash-object packages/dev-seed/src/template/linkSentinels.ts` → `012ebdaa758779a512ce678a28a2258840d3dd04`, **identical to** `git rev-parse HEAD:packages/dev-seed/src/template/linkSentinels.ts` <br> `git status --porcelain -- packages apps tests` → (empty). Re-run after the revert: `Tests  17 passed (17)`, exit **0** (log `vt-DRV-NEW-restored-1.log`) — the injection never reached history. Logs `vt-DRV-NEW-1.log`, `vt-DRV-NEW-restored-1.log` |
| K-OLD | ⚠ **INVERTED** · D-03a · allow-list keyed by the **raw** template collection key, **no** resolution step | `packages/dev-seed/tests/__probe144/k-old.test.ts` — untracked spec, local scratch implementation, five D-03a cases | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/__probe144/k-old.test.ts` | `f2cb118b4` — untouched tree; the probe spec is untracked and no tracked file is modified | `n/a — vitest` | **1** | `Tests  3 failed | 2 passed (5)`. Thrown message, first 80 characters: `no permitted-key set for collection 'questionCategories'`. Cases 3 and 5 fail for the same root cause, case 5 on `no permitted-key set for collection 'constituencyGroups'` | **RED (catch) — ⚠ INVERTED: this red is the success signal, not a defect.** See `## ⚠ THE INVERSION` above: `K` is the phase's **one** inverted pair. Case 1 supplies a `question_categories` row under the camelCase collection key `questionCategories` — the key the pipeline really emits — and an allow-list keyed **pre-resolution** misses the map entirely, so the unknown-collection throw fires. `K-NEW` (`144-04`) runs the identical five cases against a **resolved** keying and expects case 1 **GREEN**. An executor reading this red as a defect has the pair exactly backwards. Log `vt-K-OLD-1.log` |
| K-NEW | ⚠ **INVERTED** · D-03a · allow-list keyed by the **resolved** table name | `packages/dev-seed/tests/assertKnownRowProps.test.ts` — the same five R3.3 cases against the shipped `resolveCollectionName`, in a `describe` block naming D-03a, plus a sixth zero-row variant (`4b`) of the unrecognised-collection case. ⚠ **Spec file corrected from the register's original `tests/template/permittedKeys.test.ts`:** the five cases call `assertKnownRowProps`, which did not exist when the register was written, and R3.3 states them against that function by name. The *cases* are byte-faithful to R3.3; only their address moved | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/assertKnownRowProps.test.ts -t 'D-03a'` | `69595dc5b` — the committed `feat(144-04)` tree; the red-when-injected observation below used a transient uncommitted edit reverted inside its own iteration | `n/a — vitest` | **0** | **GREEN direction — `Tests 6 passed \| 20 skipped (26)`, exit 0.** Case 1 (`assertKnownRowProps({ questionCategories: [row with _elections] })`) does **not** throw: the camelCase collection key resolves to the same entry as the snake_case one, and case 2 confirms it is the same entry rather than a second one. Case 3 throws naming the **resolved** table (`/bogus[\s\S]*qc-1[\s\S]*question_categories/`). Case 5's `COLLECTION_NON_COLUMNS` twin passes under both `candidates.email` and the bare `constituencyGroups.constituencies` array. **RED-WHEN-INJECTED observation, same row, measured in the same window:** `permittedKeys`' miss behaviour was temporarily changed from throwing to `return new Set<string>()`, and the D-03a block went **red — exit 1, `Tests 2 failed \| 4 passed \| 20 skipped (26)`**: (a) case `4b. an unrecognised collection is loud even when it carries ZERO rows` → `expected [Function] to throw an error`; (b) case `4. an unrecognised collection is LOUD, never silently permissive` → `expected 'assertKnownRowProps: unknown property…' not to match /unknown property/` — i.e. under an empty-set miss the failure is **misattributed to a perfectly well-formed row's first key** instead of to the collection. Log `vt-K-NEW-injected-1.log` | **GREEN — ⚠ INVERTED: this green is the success signal, and its OLD half's RED was too.** `K-OLD` ran the identical five cases against an allow-list keyed by the **raw** template collection key with no resolution step and went **RED (catch)** on `no permitted-key set for collection 'questionCategories'`. Under the shipped **resolved** keying the same case is green. **An executor reading this green as "the control did not fire" has the pair exactly backwards** — see `## ⚠ THE INVERSION` above; `K` is this register's one inverted pair. **The green is not carried alone:** the red-when-injected observation in the previous cell proves the loud-on-unknown-collection rule is not vacuous, which is what a green case 1 by itself could not establish. **Restored, proven four ways, verbatim:** `git diff --exit-code -- packages/dev-seed/src/template/permittedKeys.ts` → exit **0** <br> `git hash-object …/permittedKeys.ts` → `f6dad34757bfe2d350213f6ce39a25af8cf4f9de`, **identical to** `git rev-parse HEAD:packages/dev-seed/src/template/permittedKeys.ts` <br> `grep -c 'TRANSIENT INJECTION' …/permittedKeys.ts` → **0** <br> `git status --porcelain -- packages apps tests` → (empty). Re-run after the revert: `Tests 26 passed (26)`, exit **0** (`vt-K-NEW-restored-1.log`). Logs `vt-K-NEW-1.log`, `vt-K-NEW-injected-1.log`, `vt-K-NEW-restored-1.log` |
| DENY-OLD | D-09 control · `entity_type` on a `questions` row — a real column the RPC's `skip_columns` silently discards | `packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts` — committed in `144-01` Task 4 | seed-cli · `yarn db:seed --template /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed/tests/fixtures/<fixture>.ts` (absolute; see each row's Outcome cell for the verbatim invocation) | `865178479` — untouched tree; this plan's only committed bytes are the ledger and the three inert fixtures | `n/a — seed CLI` | **0** | **exit 0 AND the SQL proof of the drop.** Run summary: `question_categories 1` · `questions 1` · `Total 2`. From `sql-DENY-OLD-1.log`: the row exists (`external_id=negctl144-qu-1 type=text`); **`entity_type=NULL`** although the fixture supplied `entity_type: 'candidate'`; the column is real and nullable (`column=entity_type type=jsonb is_nullable=YES`), so NULL is a genuine discard and not a missing column; and **0** questions rows anywhere carry a non-null `entity_type` | **GREEN (blind).** This is the case an allow-list is **structurally incapable** of catching, which is the whole argument for D-09's deny-list: `entity_type` **is** a real `questions` column, so it survives any `TablesInsert<'questions'>`-derived permitted set — and the RPC discards it anyway, because it sits in `skip_columns` beside `id` / `created_at` / `updated_at` / `project_id` (`501-bulk-operations.sql:109-111`). The author gets exit 0 and a row that silently lacks what they asked for. Invocation, verbatim: `yarn db:seed --template /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts`. Logs `seed-DENY-OLD-1.log`, `sql-DENY-OLD-1.log` |
| DENY-NEW | same fixture, byte-identical, after the deny-list lands. ⚠ **This row carries TWO observations** — a unit half taken in Task 2 against the pure guard, and a CLI half taken in Task 3 through the real seed CLI on the live database | same file, same absolute path, unchanged; the unit half additionally exercises `entity_type` on all three declaring tables and all four exclusions | seed-cli · `yarn db:seed --template /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts` · **unit half:** vitest · `yarn workspace @openvaa/dev-seed test:unit tests/assertKnownRowProps.test.ts -t 'D-09'` | **unit half:** `69595dc5b` — the committed `feat(144-04)` tree · **CLI half:** `58a6d3a48` — the committed `feat(144-04)` writer-wiring tree, clean, teardown run before and after | `n/a — vitest` / `n/a — seed CLI` | **unit half: 0** (the spec asserts the throws, so a green run IS the caught rejection) · **CLI half: 1** | **UNIT HALF (Task 2)** — `Tests 6 passed \| 20 skipped (26)`, exit 0. `entity_type` throws on **all three** declaring tables (`questions`/`qu-1`, `question_categories`/`qc-1`, `nominations`/`nom-1`), each message carrying the key, the collection and the `external_id`, matching `/skip_columns/`, `/501-bulk-operations\.sql/` and `/[Rr]emove it/`, and **not** matching `/unknown property/` — the deny message is a different message, not the allow-list's with a different noun. On `elections`, which does not declare the column, `entity_type` is caught by the **allow-list** instead, with `unknown property`. All four exclusions (`project_id`, `id`, `created_at`, `updated_at`) pass on a `questions` row without throwing. **`skip_columns` parity: PASS in both directions** — the array is parsed from `apps/supabase/supabase/schema/501-bulk-operations.sql` at run time (`['id','created_at','updated_at','project_id','entity_type']`), and `DENIED ∪ EXCLUDED` is asserted equal to it as sorted sets AND member-by-member, with `[...denied]` asserted to be exactly `['entity_type']`, so neither an added `skip_columns` entry nor a widened deny set can pass unnoticed. Log `vt-DENY-NEW-unit-1.log`. **CLI HALF (Task 3)** — exit **1** through the real seed CLI against the live local database. First 80 characters of the thrown message: `assertKnownRowProps: property 'entity_type' on collection 'questions' (row exter` — in full naming `entity_type`, the collection `questions`, the row `external_id` `negctl144-qu-1`, and `the bulk_import RPC discards it via skip_columns (apps/supabase/supabase/schema/501-bulk-operations.sql), so setting it has no effect. Remove it.` **⬅ `DENY-OLD` (blind half), restated so the pair reads in one place:** the byte-identical fixture at the byte-identical absolute path exited **0** with `question_categories 1 · questions 1 · Total 2`, and `select entity_type from questions where external_id='negctl144-qu-1'` returned **NULL** although the fixture supplied `'candidate'` — the column being real and nullable (`type=jsonb is_nullable=YES`), so the NULL was a genuine discard rather than an absent column. **Fixture byte-identity asserted at run time:** `git diff --exit-code -- packages/dev-seed/tests/fixtures` → exit **0**. Log `seed-DENY-NEW-1.log` | **RED (catch), both halves.** This is the case an allow-list is **structurally incapable** of catching, which is the whole argument for D-09: `entity_type` IS a real `questions` column and survives any `TablesInsert<'questions'>`-derived permitted set. The deny-list is what catches it — and it is deliberately **not** the RPC's `skip_columns` array, which seeded literally would reject `project_id` on all 1,481 in-tree rows. One honest deny entry, four documented non-throwing exclusions, and a parity spec holding their union to the SQL. The pair with `DENY-OLD` is exact: same fixture, same absolute path, same invocation; only the tree differs. Logs `vt-DENY-NEW-unit-1.log`, `seed-DENY-NEW-1.log` |
| V-OLD | D-07 · `resolveTemplate` returns a built-in **unvalidated** (`cli/resolve-template.ts:59`) — the fact the file's own doc comment at `:16` denies, which is why `:16` is record target R-6 | `packages/dev-seed/tests/__probe144/v-old.test.ts` — untracked spec calling `resolveTemplate('x', fakeBuiltIns)` with an unknown **top-level** key | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/__probe144/v-old.test.ts` | `f2cb118b4` — untouched tree; the probe spec is untracked and no tracked file is modified | `n/a — vitest` | **0** | `Tests  3 passed (3)` — `resolveTemplate('negctl-builtin', builtIns)` resolved without throwing, and `totallyUnknownTopLevelKey` was still present on the returned object | **GREEN (blind).** `cli/resolve-template.ts:59` is a bare `return builtIn;` — the built-in branch never reaches `validateTemplate`. **This is the fact the file's own doc comment at `:16` denies** (*"Every resolved template runs through `validateTemplate()` before return"*), which is why `:16` is record target **R-6**. A third case in the same spec sharpens the finding: pushing the *same* object through `validateTemplate` today **strips** the unknown key rather than rejecting it, so the built-in branch is blind in two independent ways — no validation at all, and a validator that would not have thrown anyway until `144-05` makes it `.strict()`. Log `vt-V-OLD-1.log` |
| V-NEW | D-07 · same call after `return validateTemplate(builtIn);` replaces `return builtIn;` | `packages/dev-seed/tests/cli/resolve-template.test.ts` — same built-ins map, now a **committed** case rather than a transient probe (`DRIFTED_BUILT_INS`, one entry `negctl-builtin` carrying `totallyUnknownTopLevelKey`), because it is a standing regression as well as this control. The fixture is built through an **intermediate variable**, not a cast: excess-property checking is a fresh-object-literal rule, so that is how the drift actually reaches the registry | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/cli/resolve-template.test.ts` | `f0228e55e` — the committed D-07 tree (`feat(144-05)`); `grep -cE '^\s*return builtIn;'` → **0** and `grep -c 'validateTemplate(builtIn)'` → **1**, so the branch has exactly one validating exit | n/a — vitest | **0** — the spec asserts the throw, so a green run IS the caught rejection; the throw itself is recorded below | **RED (catch), stated as the pair.** ⬅ **`V-OLD` (blind half), restated:** `Tests  3 passed (3)` — `resolveTemplate('negctl-builtin', builtIns)` resolved **without throwing**, and `totallyUnknownTopLevelKey` was still **present on the returned object**; a third case showed that pushing the same object through `validateTemplate` would have *stripped* the key rather than rejecting it, so the branch was blind in two independent ways. ➡ **`V-NEW` (this half):** the same call now **throws**. Thrown message, verbatim, first 80 characters: `"Template validation failed:\n  template.: Unrecognized key: \"totallyUnknownTopLev"`. Spec run: exit `0`, `Tests  15 passed (15)`. **Registry-wide fallout, measured here at this HEAD and not carried over from `144-RESEARCH` R8.7: `strict validation: 30 pass / 0 fail of 30`.** | **RED (catch).** Both of `V-OLD`'s blindnesses are closed by one change, and the second one is why D-04 and D-07 had to land together: validating the built-in would have caught nothing until the schema was `.strict()`, and making the schema strict would have reached no built-in until the branch validated. The registry measurement is the de-risking observation for T-144-33 — every `default`, `e2e/base` and `perm-*` passes on the first seed after the change, so the criterion-5 fallout table for this half of the phase is **empty, and empty because it was measured**. Standing spec behind it iterates `BUILT_IN_TEMPLATES` with a ≥30 floor, so a template registered later is covered without editing the spec. `resolve-template.ts`'s doc comment — record target **R-6** — is annotated in place with what changed and when, rather than quietly made true. Logs `vt-V-NEW-1.log`, `vt-strictall-1.log`. |
| L | must-NOT-fire · D-01 legality · `questions._elections` stays a first-class feature | type half — `packages/dev-seed/src/__probe144_l.ts`, carrying BOTH forms: (1) a `QuestionsFixedRow`-annotated inline literal with `external_id`, `type`, `category` and `_elections`, and (2) the same pair reached through `Template`'s `questions.fixed` slot, so the row is exercised by the same route as `T1-NEW` / `T2-NEW`; plan half — the same row through `planLinks` | tsc · `npx tsc --noEmit -p packages/dev-seed/tsconfig.json` and vitest · `yarn workspace @openvaa/dev-seed test:unit tests/template/linkSentinels.test.ts` | **type half:** `7ca1a260d` — the committed `144-02` tree, probe untracked and removed in-iteration · **plan half:** owed by `144-03` | **type half:** `n/a — direct tsc` · **plan half:** owed by `144-03` | **type half: 0** · **plan half:** owed by `144-03` | **type half: GREEN — 0 diagnostics.** `grep -c 'error TS' tc-L-type-1.log` → **0**, for BOTH probe forms. The pair `linkJoinTables` genuinely resolves (`supabaseAdminClient.ts:542-543`, shipped in `4aeae0ace`, 2026-06-01) still compiles clean under the strict row types, while the byte-adjacent `candidates._elections` of row `T2-NEW` does not. **Not vacuous:** rows `T1-NEW` and `T2-NEW` show this exact command and this exact tree emitting `TS2353` for an illegal key in the same run window, so the green here is discriminating rather than an instrument that stopped looking. · **plan half:** owed by `144-03`. Log `tc-L-type-1.log` | **plan half: GREEN — 1 entry, exactly.** `planLinks({ questions: [{ external_id: 'qu-1', _elections: { externalId: ['el-1'] } }] })` returns a plan of length **1**, matching `{ collection: 'questions', key: '_elections', parentExternalId: 'qu-1', refExternalIds: ['el-1'], refTable: 'elections', target: { kind: 'jsonb', column: 'election_ids' } }` — the `election_ids` JSONB column, named in the assertion rather than implied. Case `D-01 legality: questions._elections IS still read, and targets the election_ids jsonb column`, `Tests  17 passed (17)`, exit **0**, at HEAD `69b1ff1e6`. **Both halves, stated together:** the probe **compiled clean** under the new per-collection row types (`144-02`, 0 diagnostics, log `tc-L-type-1.log`) **and** the pair is **resolved** by the const-driven planner to exactly one `election_ids` entry (`144-03`, log `vt-L-plan-1.log`). The type layer permits it and the runtime reads it — the feature is legal on both sides, not merely un-rejected on one. **Provenance per D-01a:** `questions._elections` was shipped in `4aeae0ace` — ``feat(data): promote `required` to first-class Question field + wire consumers`` (2026-06-01) — which is where `linkJoinTables` gained its second `electionResolve` dispatch, extending the `_elections` JSONB scoping path from `question_categories` alone to `questions` as well. It is a first-class feature, not an accident this phase re-scoped away from. **Not vacuous:** row `DRV-NEW` above, measured in the same window with this exact command and this exact spec file, produced **3 failures** including the sibling must-NOT-fire case — the instrument was demonstrably still looking. Log `vt-L-plan-1.log` |
| NC | must-NOT-fire · every row every built-in emits passes `assertKnownRowProps` | `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts` — no injection, the shipped built-in registry | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/assertKnownRowProps.builtins.test.ts` | `28b1663aa` — the committed `144-05` tree, i.e. this plan's own starting HEAD; the classification was run **before one byte of guard code existed**, per `<cardinal_risk>` | `n/a — vitest` | **0** | **30 templates · 1,481 emitted rows · 11,125 key occurrences · 0 offending keys.** Per-collection emission: `elections 42 · constituency_groups 36 · constituencies 57 · organizations 67 · alliances 4 · question_categories 66 · questions 104 · candidates 439 · nominations 636 · app_settings 30` (`factions`, `accounts`, `projects`, `feedback` emit 0 rows in every built-in). **`writer.test.ts` fixture surface, classified SEPARATELY because it is not pipeline output: 19 `write(` call sites · 35 fixture rows · 63 key occurrences · initially 2 offences, both `unmodelled-collection`** — `writer.test.ts:191` `accounts: [{ id: 'x' }]` and `:203` `projects: [{ id: 'y' }]`, each hitting `permittedKeys: unknown collection "accounts"/"projects"`. **Resolved in Task 2 by MODELLING both against `TablesInsert<'accounts'>` / `<'projects'>` — widening the allow-list with a stated reason, exactly as `<cardinal_risk>` directs, never by narrowing the survey (R5.2 pre-registered this: "Guard them against `TablesInsert<'accounts'>` / `<'projects'>` and they cost nothing"). Re-measured after the widening landed: `write() call sites 19 · fixture rows 35 · key occurrences 63 · offending key occurrences 0`.** | **GREEN.** The false-positive budget is **zero and measured at this HEAD**, not inherited: the run reproduced `144-01` row `F`'s three corpus figures exactly (30 / 1,481 / 11,125) and its composition-(1) count of **0**, and none of the three failing numbers from `<cardinal_risk>` (2,955 / every row / 76) appeared, so the composition is the right one. **Not vacuous — apparatus control taken in the same window:** injecting `negctl144InjectedBogusKey: 'apparatus control'` onto `e2e/base`'s `test-e2e-base-el-reg` elections row made this exact spec exit **1** with `Tests 1 failed | 2 passed (3)` and the single failure line `[unknown] template='e2e/base' collection='elections' external_id='test-e2e-base-el-reg' key='negctl144InjectedBogusKey'` — all four diagnostic facts, and exactly one offence, so the classifier neither over- nor under-reports. **Restored, proven three ways:** `git diff --exit-code -- packages/dev-seed/src/templates/e2e/base.ts` → exit **0** <br> `git hash-object …/e2e/base.ts` → `db8afea8d3b2c7a47f6b7afcad13663cf1c575f2`, identical to its pre-injection value <br> `git status --porcelain -- packages apps tests` → (empty). Re-run after the revert: `Tests 3 passed (3)`, exit **0**. The spec iterates `BUILT_IN_TEMPLATES` with a `>= 30` floor and contains no literal `perm-` name, so a template registered later is covered without editing it. Logs `classify-04-1.log`, `vt-NC-1.log`, `vt-NC-apparatus-1.log`, `vt-NC-apparatus-restored-1.log` |
| AF | already-failable · `tests/template/latent.schema.test.ts:39` — the `accepts matching dimensions + eigenvalues` case at `:38`, green today because `latentBlock` already carries `.strict()` at `schema.ts:64` | transient deletion of a `latentBlock` declaration; **re-measured, not claimed as a repair** — the `eigenvalues` declaration deleted, on the **pre-phase** `schema.ts` | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/template/latent.schema.test.ts` | `5490b9b4b` **working tree with `schema.ts` replaced by its PRE-PHASE blob** `e8c9babb0b1d8ff5bd1d9f4e8f8548882157d61b` (`git show 8331eaed2:packages/dev-seed/src/template/schema.ts`) — i.e. the `144-02` tree, **without** either `.strict()` call this plan adds, so the observation cannot be credited to this phase. Restored to `6e575e6712766ef83d121c786add73324394ff9c` after the iteration | n/a — vitest | **1** | **RED direction, taken on the PRE-PHASE tree** — `eigenvalues` deleted from `latentBlock`: `Tests  2 failed | 5 passed (7)`, target site `× accepts matching dimensions + eigenvalues` among them (the second red, `rejects mismatched dimensions/eigenvalues length`, is the apparatus control). That file contained exactly **one** `.strict()` call — `latentBlock`’s own at `:65` — so that call, and nothing this plan adds, is what caught it. **GREEN direction** — `eigenvalues` restored, re-run on the current post-`.strict()` tree: exit `0`, `Tests  7 passed (7)`. The site now sits at `:47` (`it(` at `:46`) after row `NA`’s conversion shifted the file by +8. | **already-failable.** The site was failable before `144-05` existed and is failable after; this plan neither broke it nor repaired it, and it is **excluded** from the four sites ASSERT-04 turns from blind to failable. `144-CONTEXT.md`’s six-site table already called this out, and `Z4-OLD` flagged it for this row; the re-measurement confirms it at this HEAD **against the pre-phase blob** rather than by inspection. Claiming it as a repair would inflate the phase’s own numbers — precisely the class of error this milestone exists to eliminate (T-144-36). Log `vt-AF-1.log`. |
| NA | scoped exception · `tests/template/latent.schema.test.ts:31` — `accepts an empty template (regression)` at `:30`, unfailable by construction because it asserts `validateTemplate({})` | no injection possible; converted to the round-trip form already in-tree at `tests/template.test.ts:24` | vitest · `yarn workspace @openvaa/dev-seed test:unit tests/template/latent.schema.test.ts` | `5490b9b4b` — the committed `.strict()` tree; **no injection and no transient edit**, because none exists that could apply | n/a — vitest | **0** | **No injection is possible, and that is the finding.** The site asserts `validateTemplate({})`; it declares no field, so there is no declaration whose removal could redden it. Observed rather than argued: in `vt-Z4-NEW-1.log` an injection that reddened **5 of the 7** cases in this very file left this one **green**. After conversion the file runs `Tests  7 passed (7)`, exit `0`; the added round-trip assertion sits at `:39`, inside the `it(` block at `:30`. | **N/A — by construction.** Not a red and not a green — the disposition word *is* the record. Repaired differently: converted to the round-trip form already in-tree at `tests/template.test.ts:24`, so the site now asserts `expect(validateTemplate({})).toEqual({})` — what comes **back** — **complementing**, not replacing, the `.not.toThrow()` above it. Round-tripping does not make the site failable and is not claimed to; it makes the assertion say something about the return value instead of only about the absence of a throw. Precedent for the disposition: Phase 142, F17. Log `vt-NA-1.log`. |
| F | criterion 5 fallout survey · all 30 built-ins × every pipeline-emitted row × **four** allow-list compositions | no injection — a scratch ESM script written **outside** the repository under `${TMPDIR:-/tmp}/gsd-144/` | node · scratch ESM survey script, invocation recorded per composition in § Fallout survey | `f2cb118b4` — untouched tree; the probe spec is untracked and no tracked file is modified | `n/a — node (scratch ESM script, not turbo-mediated)` | **0** | **30** built-ins · **1,481** emitted rows · **11,125** key occurrences. Rejected key occurrences per composition: **(1) 0** · **(2) 2,955** · **(3) 1,481** · **(4) 76**. Full per-pair breakdown and the exact command in § Fallout survey (row F) | **FALLOUT MEASURED AT ZERO under the recommended composition — not assumed.** Composition (1), the four-source allow-list with the bare sentinel forms and a deny set of `entity_type` alone, rejects **not one key** on any of the 1,481 rows any of the 30 built-ins emits. Criterion 5's *"any field they lose to the tightening is listed with the reason"* is discharged by an empty table **plus** the measurement that makes the emptiness meaningful. **Agrees with its prior on all four numbers** (R7.3 predicted 0 / 2,955 / 1,481 / 76). **One finding beyond the prior:** a naive reading of composition (4) — dropping the 3 bare forms from `LINK_SENTINELS` only — measures **0**, not 76, because `COLLECTION_NON_COLUMNS` independently supplies the same two pairs. The 76 figure prices the counterfactual only when the bare forms are removed from **every** source. Log `survey-F-1.log` |
| P | pre-existing `tsc` errors surfaced by widening `packages/dev-seed/tsconfig.json`, before → after | before half — the transient uncommitted widening from row `X-OLD`; after half — the committed widening from `144-02` | **before:** tsc · `npx tsc --noEmit -p packages/dev-seed/tsconfig.json` · **after:** turbo · `TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed` (the after-half runs through the gate `144-06` will make blocking, forced so the verdict cannot be a replay) | **before:** `829ccf979` + the transient uncommitted widening (same run as `X-OLD`) · **after:** `64b728c97` — the COMMITTED widening, measured on a clean tree (`git status --porcelain -- packages apps tests` empty) | **before:** `n/a — direct tsc` · **after:** `cache bypass, force executing` ×7 of 7, `0 cached, 7 total` (`TURBO_FORCE=true`) | **before: 2** · **after: 0** | **before: exactly 3 errors** — `TS2559` at `tests/determinism.test.ts(99,25)`, `TS2493` at `tests/latent/latentEmitter.test.ts(122,35)`, `TS2352` at `tests/templates/nominations-override.test.ts(83,13)`. Quoted verbatim with a named fix each in § Pre-existing tsconfig errors (row P) | **PRE-EXISTING, not regressions.** These are errors **no gate in this repository has ever seen**, because `packages/dev-seed/tests/` has sat outside its own package's `tsconfig` `include` since the workspace was scaffolded at `4fc1abb2d`. This phase surfaces them; it does not cause them. **Agrees with its prior:** `144-CONTEXT.md` B-21 and `144-RESEARCH.md` R4.3 both pre-registered exactly three errors at exactly these three lines and columns, and this run reproduced all three — same count, same files, same line:column, same TS codes. Log `tc-P-before-1.log` |
| C | restore proof at phase close — tracked diffs clean, probe `find` empty, `git status` clean, blob hashes back to the header values | — | git · `git diff --exit-code`, `git status --porcelain`, `git hash-object`, `find … -name '__probe144*'` | `47ee50054` — the closing HEAD; **unchanged across all seven gates and row `Z`** | `n/a — git` | **0** — `git diff --exit-code HEAD` exited **0** on both takings, one before gate 1 and one after gate 7 | **Five assertions, all clean, each taken TWICE — once before gate 1, once after gate 7.** **(1) Working tree.** `git status --porcelain` prints exactly **one** line on both takings: `?? .planning/milestone.lock`, an untracked `gsd-tools` session lock belonging to the run that executed this plan. It is not a phase artefact, is not tracked, and is named here rather than filtered away silently; excluding that single path the count is **0**. **(2) Tracked diff.** `git diff --exit-code HEAD` → exit **0**. **(3) Probe `find`, in BOTH glob forms.** `find . -path ./node_modules -prune -o -name '__probe144*' -print` → **0** hits, and `find . -path ./node_modules -prune -o -type d -name '__probe144' -print` → **0** hits. Both forms are run because a single glob can be blind to one of the two shapes this phase used — the exact gap Phase 143 found in its inherited pattern. **(4) Restoration blob hashes.** Every one of the header's nine paths has **moved**, and every move is a committed phase change rather than a surviving injection, each traced by `git log d2ffc3904..HEAD -- <path>`: `packages/dev-seed/tsconfig.json` `7fba879dc`→`523cd5d47` (`7a6c34f35`) · `src/supabaseAdminClient.ts` `0fe5fe45c`→`e00292b6b` (`edf06ea8a`, `3ab2ecc93`) · `src/pipeline.ts` `d650e608a`→`bd34d00e8` (`4bd038701`) · `src/writer.ts` `c89b446f0`→`8fb24dfd6` (`58a6d3a48`) · `src/template/schema.ts` `a65a33f7f`→`6e575e671` (`7ca1a260d`, `5490b9b4b`) · `src/template/types.ts` `8aab8d5a9`→`b490d3489` (`7ca1a260d`) · `src/cli/resolve-template.ts` `34ef63064`→`b8f5e3b59` (`f0228e55e`) · `package.json` `d7e6b6769`→`30a9c3774` (`9beaac244`) · `.github/workflows/main.yaml` `4dcd9bdde`→`175104e3c` (`9beaac244`). ⚠ **Stated plainly rather than glossed:** the header table lists exactly the files this phase INTENDED to edit, so it contains **no** did-not-intend-to-change path whose hash could be asserted equal. Nine moved, nine accounted for, **zero unexplained** — that is the checkable form of the assertion here, and it is weaker than an equality would have been. **One equality IS available and is the sharper witness:** `src/template/schema.ts`'s closing blob `6e575e6712766ef83d121c786add73324394ff9c` is byte-identical to the value `144-05` restored to after **each** of its four injection iterations, so none of those four survived. **(5) Committed negative-control fixtures byte-unchanged.** `git diff --exit-code -- packages/dev-seed/tests/fixtures` → exit **0**, so the three `negctl-*.ts` files that make each pair a pair were not edited between halves. Log `row-C-1.log` | **GREEN — the tree is proven restored.** Nothing this phase injected survives into the closing HEAD in either probe shape, and every blob that moved moved by a commit that can be named. |
| Z | closing revert at phase close — **reproduces row `A`** | — | turbo · `TURBO_FORCE=true npx turbo run typecheck` | `47ee50054` — the closing HEAD, the same HEAD all seven gates ran at; row `A` was taken at `61209c9ff` | `@openvaa/core:typecheck: cache bypass, force executing` — and **22 of 22** verdict lines read `cache bypass, force executing`, not one of them a cache replay · aggregate `Cached: 0 cached, 22 total` | **0** | **Reproduces row `A` exactly, on all four of the numbers row `A` declared:** `Tasks: 22 successful, 22 total` · `Cached: 0 cached, 22 total` · **22** forced verdict lines · `grep -c 'error TS'` → **0**. Both benign turbo WARNINGs that row `A` declared part of the restoration target are present, one occurrence each: `no output files found for task @openvaa/shared-config#build` and `… for task @openvaa/supabase-types#build`. **The task count did NOT differ from row `A`'s 22.** No package manifest gained or lost a `typecheck` script during the phase — `144-06` chained the repo typecheck into the ROOT `lint:check` script and added a CI step, neither of which adds a turbo task — so the row's "state which and why" clause has nothing to record and says so rather than leaving the reader to infer it. Taken **after** gate 7, at the same HEAD as all seven gates. Log `tc-Z-1.log` | **GREEN — the restoration target is discharged.** Row `A` was declared the restoration target when this ledger was opened, before any measurement existed; this row is where that declaration is paid. The register opens and closes on the same four numbers. |

**The arithmetic, stated so it can be checked rather than trusted:** 37 rows × 5 measurement cells =
**185** placeholder occurrences at creation. Each plan clears only its own rows. `144-01` fills 17 rows
(`A`, `T1-OLD`, `T2-OLD`, `G-OLD`, `X-OLD`, `P`, `Z1-OLD`, `Z2-OLD`, `Z3-OLD`, `Z4-OLD`, `DRV-OLD`,
`K-OLD`, `V-OLD`, `F`, `R1-OLD`, `R2-OLD`, `DENY-OLD`) = 85 cells, leaving **100** for the six later
plans. `144-02` fills `T1-NEW`, `T2-NEW` and **amends row `P` in place** with its `after` half (row `P`'s five
cells are cleared here, in Task 2, by its `before` half — amending a filled cell is not clearing a
placeholder); `144-03`
fills `DRV-NEW` and `L`'s plan half; `144-04` fills `R1-NEW`, `R2-NEW`, `K-NEW`, `DENY-NEW`, `NC`;
`144-05` fills `Z1-NEW` … `Z4-NEW`, `V-NEW`, `AF`, `NA`; `144-06` fills `G-NEW`, `X-NEW`; `144-07`
fills `C` and `Z`.

---

## D-06b — which form of the type-check command belongs where (rows `G-NEW`, `X-NEW`)

**Written in `144-06`, beside the two rows it governs, rather than left in a plan file no later reader
will open.** Three facts, one sentence each.

1. **The gate as SHIPPED does not force the turbo cache.** `package.json`'s new `typecheck` script is
   exactly `turbo run typecheck`, with no `TURBO_FORCE`, and the new `.github/workflows/main.yaml` step
   invokes that script unchanged — because caching there is a *feature* (a re-run on an unchanged
   package should be instant) and CI cold-starts on every job anyway, so there is no stale-verdict risk
   to buy off.
2. **Every EVIDENCE run in this phase DOES force**, `TURBO_FORCE=true` without exception — because
   `turbo.json:18-22` gives `typecheck` no `"cache": false` (unlike `test:unit` at `:9-12`), so an
   unforced re-run can replay a verdict that is a claim about a **previous** tree. Rows `G-NEW` and
   `X-NEW` are exactly the case where that would bite: their two halves differ by **one line in one
   file**, which is the shape most likely to manufacture a false green. Both rows record a
   `cache bypass, force executing` verdict and a `0 cached` aggregate for every half.
3. **`yarn lint:check --force` is FORBIDDEN and is not a substitute for anything.** Yarn appends the
   argument to the END of the `&&` chain rather than passing it through to turbo, so it silently does
   nothing — no error, no warning, and a cached verdict recorded as a measured one. The substitute is
   `TURBO_FORCE=true yarn lint:check`, which is what this plan's close run used
   (`lint-06-close.log`, exit **0**, `22 successful, 22 total` / `0 cached, 22 total` on the newly
   chained final link).

⚠ **`lint:check` short-circuits on `&&`.** A red from `TURBO_FORCE=true yarn lint:check` means the
**first** failing link failed and every later link never ran; it is never a whole-gate result. The
chain is, in order: `turbo run lint` → `eslint … tests` → `yarn typecheck:tests` → `yarn typecheck`.
`typecheck:tests` is deliberately kept and unchanged — it points at `tests/tsconfig.json` and covers
the Playwright tree, which has its own config and no turbo task, so dropping it would have silently
narrowed the gate this phase is widening.

---

## What the type layer does NOT reach — the excess-property-checking hole (rows `T1-NEW`, `T2-NEW`)

**Written at the moment rows `T1-NEW` and `T2-NEW` went red, so criterion 1's success is not read as
more than it delivers.**

Excess property checking is a **fresh-object-literal rule**. A row assigned through an intermediate
variable is not checked at all:

```ts
const rowVar = { external_id: 'el-1', _constituencies: { externalId: ['co-1'] } };
export const bad: Template = { elections: { fixed: [rowVar] } };   // no error
```

Measured in `144-RESEARCH.md` § R1.4 and unchanged by this plan. **Where that bites in-tree:**
`packages/dev-seed/src/templates/_helpers/buildMinimal.ts` **constructs** the 28 `perm-*` templates'
rows programmatically instead of writing them as inline literals at the `fixed:` site. All 39 template
files assign `fixed:` arrays as inline literals (128 sites), so `buildMinimal.ts` and the leaf builders
in `templates/e2e/perm/shared.ts` are the structural exception.

**`144-02` narrowed that hole rather than only declaring it, and the narrowing is partial.** The
builders' return types and `buildMinimal.ts`'s local row arrays now carry the `FixedRow` aliases
instead of `Record<string, unknown>` — see `7ca1a260d`. Because each row inside those functions IS a
fresh literal checked against the declared return type, an illegal key written *inside* a builder is
now an error. What is still NOT covered is a row that reaches a `fixed:` array through a variable
whose type is already loose — nothing in-tree does this today, but the type layer cannot prevent it.

**The runtime guard from `144-04` is the only cover for that residue.** Stated here, on the ledger's
face, rather than left for a reader to discover.

---

## Instrument and exit-code corrections to `144-02-PLAN.md` (rows `T1-NEW`, `T2-NEW`, `L`)

Three places where the plan's prose and the measured reality disagree. Recorded rather than
reconciled silently, per the discipline `144-01` set.

**1. Instrument — the register wins over the action text, on pair integrity.** `144-02-PLAN.md`'s
Task-3 action text says to run `TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed`
for these rows. The register's own `Instrument + command` cell for `T1-NEW` and `T2-NEW` says
`npx tsc --noEmit -p packages/dev-seed/tsconfig.json`, which is **byte-identical to what the OLD
halves ran**. A NEW half measured with a different instrument is not a control — the pair would then
differ by instrument as well as by tree. The register's instrument was therefore used. The turbo form
was also run and is on record twice: once as the first `T1-NEW` attempt (exit **2**, same single
`TS2353`) and once green on the clean tree at task close (`tc-02-close.log`, `22 successful,
0 cached`).

**2. Exit code — `2`, not the `1` the plan predicts.** `tsc --noEmit` exits **2** when diagnostics are
present. This is not new information in this ledger: `144-01` recorded exit **2** for row `X-OLD` and
for row `P`'s before-half, both `tsc` runs with errors. `T1-NEW` and `T2-NEW` therefore record **2**.
Writing the predicted `1` would have put a number in the register that no command produced.

**3. Diagnostic type name — the alias is named, inside a one-line intersection.** `144-RESEARCH.md`
§ R1.4 predicted the message would read `does not exist in type 'ElectionsFixedRow'`. Measured, it
reads `does not exist in type 'Partial<ElectionsFixedRow> & { external_id: string; }'`. The reason is
structural and expected: the plan requires `Template`'s slots to be `Fragment<…>` instantiated
against the aliases, and `Fragment<TRow>` is `{ fixed?: Array<Partial<TRow> & { external_id: string }> }`
— so the row element TypeScript prints is the fragment's intersection, not the bare alias.
**Criterion 1 still holds**: the diagnostic NAMES the row type, on one line, and the alias is what
makes it legible — R1.4's contrast was with a twenty-line structural expansion, which is not what this
is. The verbatim strings are in the two rows' `Assertion outcome` cells.

---

## Source (4) derivation limit

**Written before any code exists, because it is this phase's one honest limitation and it must not be
discovered late.**

Criterion 4's derivation guarantee — *the allow-list is derived, not hand-maintained in parallel* —
covers **three** of the four sources:

1. **DB columns**, from the generated `TablesInsert<…>` types.
2. **`LINK_SENTINELS`**, the const `linkJoinTables` drives its own loops from (D-03).
3. **The non-column consts** — `NON_COLUMN_FIELDS` and `COLLECTION_NON_COLUMNS`
   (`supabaseAdminClient.ts:140` and `:141-146`).

All three are TypeScript, so the resolver can iterate them and a test can prove that adding a pair
without handling it fails.

It does **not** cover source (4): the `_bulk_upsert_record` RPC's **per-table relationship reference
map** (B-4b). That map is **PL/pgSQL**, and Postgres cannot iterate a TypeScript const. Source (4) is
therefore **parity-tested** against `apps/supabase/supabase/schema/501-bulk-operations.sql`, **not
derived**. Omitting it entirely is not an option: research measured **2,955 key occurrences** that
depend on it — every `nominations` row, plus `candidates.organization`, `questions.category` and
`constituencies.parent` — so a three-source guard fails **every E2E setup project**, which is a
cardinal failure under `CLAUDE.md`.

Saying so here, in advance and on the ledger's own face, is the point. The register must not be
allowed to imply a derivation guarantee it does not have.

---

## Fallout survey (row F)

**Measured in `144-01` Task 3, at HEAD `f2cb118b4`, on the untouched tree.** The survey script is a
scratch ESM module written **outside the repository** at
`/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-144/survey-F.mts`, so it cannot be
committed by accident. It imports the dev-seed barrel by absolute `file://` URL and reproduces
`cli/seed.ts:114-115` exactly — `runPipeline(tpl, BUILT_IN_OVERRIDES[name] ?? {})` then
`fanOutLocales(rows, tpl, tpl.seed ?? 42)` — for every registered built-in, then classifies **every key
on every emitted row**.

**The exact command that produced every number below:**

```
GSD144_ROOT="$(pwd -P)" npx tsx "${TMPDIR:-/tmp}/gsd-144/survey-F.mts"     # exit 0, log survey-F-1.log
```

⚠ The script had to be `.mts`, not `.ts`: living outside any `package.json` with `"type": "module"`,
tsx transformed a `.ts` file as CJS and rejected the top-level `await` with
`Top-level await is currently not supported with the "cjs" output format`. Recorded because the first
invocation exited **1** for that reason and the second, after the rename, exited **0** — the log holds
only the successful run and the failure is stated here rather than hidden.

### Corpus

| Property | Measured |
|---|---|
| Built-in templates surveyed | **30** |
| Total emitted rows | **1,481** |
| Total key occurrences classified | **11,125** |

Per-collection emitted rows: `alliances` 4 · `app_settings` 30 · `candidates` 439 ·
`constituencies` 57 · `constituency_groups` 36 · `elections` 42 · `factions` 0 · `feedback` 0 ·
`nominations` 636 · `organizations` 67 · `question_categories` 66 · `questions` 104 · `accounts` 0 ·
`projects` 0. **Total 1,481.**

### The four compositions, each with its rejected-occurrence count

| # | Composition | Rejected key occurrences | Distinct (collection, key) pairs |
|---|---|---|---|
| **(1)** | four sources, bare sentinel forms included, deny = `{entity_type}` | **0** | 0 |
| **(2)** | **three** sources (columns + sentinels + non-columns), **no** RPC relationship refs, deny = `{entity_type}` | **2,955** | 9 |
| **(3)** | four sources, deny seeded literally from the RPC's full `skip_columns` array | **1,481** | 10 |
| **(4)** | four sources with sentinels but **without** the 3 bare non-underscore forms, removed from **every** source | **76** | 2 |

All four counts come from the single run logged at `survey-F-1.log`; the table above is a transcription
of that log, not of any document.

**Composition (2) — the 2,955, itemised.** `nominations/election` 636 · `nominations/constituency` 636
· `nominations/parent_nomination` 497 · `nominations/candidate` 453 · `candidates/organization` 438 ·
`nominations/organization` 164 · `questions/category` 104 · `nominations/alliance` 19 ·
`constituencies/parent` 8. **This is source (4) priced.** Omitting the RPC's relationship map breaks
every foreign key in every seeded dataset — including every E2E setup project — which is a cardinal
failure under `CLAUDE.md`, not a tunable tradeoff.

**Composition (3) — the 1,481, itemised.** `project_id` on every row of all ten emitting collections
(`nominations` 636 · `candidates` 439 · `questions` 104 · `organizations` 67 ·
`question_categories` 66 · `constituencies` 57 · `elections` 42 · `constituency_groups` 36 ·
`app_settings` 30 · `alliances` 4). The RPC re-supplies `project_id` from `p_project_id`
(`501-bulk-operations.sql:95-96`), so the generators are **correct** to emit it. Seeding the deny-list
from the whole `skip_columns` array would reject a key that is right to be there.

**Composition (4) — the 76, itemised.** `elections/constituency_groups` 41 ·
`constituency_groups/constituencies` 35. Both are read by `linkJoinTables` at `:398` and `:451`
respectively. B-4's corrected count of **10** sentinel pairs (7 underscore-prefixed + 3 bare) is what
keeps these two alive.

### ⚠ A finding the prior did not contain — the source (3) / source (2) overlap

A **fifth** composition was measured as a control on composition (4): drop the 3 bare forms from the
**sentinel source only**, leaving `COLLECTION_NON_COLUMNS` untouched. It rejects **0** occurrences, not
76 — because `COLLECTION_NON_COLUMNS` (`supabaseAdminClient.ts:141-146`) independently lists
`elections: {constituencyGroups, constituency_groups}` and `constituency_groups: {constituencies}`.

**Why this matters:** the 76 figure prices the counterfactual only when the bare forms are removed from
**every** source. As a consequence, a future regression that silently drops the bare forms from
`LINK_SENTINELS` alone would be **invisible** to this survey and to Pass 0 alike. `144-03`'s derivation
test must therefore assert the bare pairs against `LINK_SENTINELS` **specifically**, not merely against
the union of the four sources. Filed to § Residue.

### Discharge

**Candidate fallout under the recommended composition (1): zero fields, zero files, zero
`external_id`s.** D-10's DELETE-default and its E2E-red exception never fire. The table is empty, and
the measurement above is what makes the emptiness a **discharge** rather than an unrun survey —
a blank section cannot be distinguished from a survey nobody ran.

**Agreement with the prior, stated rather than assumed.** `144-RESEARCH.md` R7.3 pre-registered
0 / 2,955 / 1,481 / 76 across 30 templates and 1,481 rows. This run reproduced **all four counts, the
template count, the row count and every per-collection subtotal exactly**. There is no disagreement to
report for row `F`. The numbers are nonetheless measured here, with their own command and their own
log, not copied.

---

## Pre-existing tsconfig errors (row P)

**Before half — measured in `144-01` Task 2, at HEAD `829ccf979`, under a transient uncommitted
widening of `packages/dev-seed/tsconfig.json`.** Command:

```
npx tsc --noEmit -p packages/dev-seed/tsconfig.json     # include: ["src/**/*", "tests/**/*", "scripts/**/*"], rootDir dropped
```

Exit **2**. **Exactly three** `error TS` lines, none of them from the `X-OLD` fixture. Quoted verbatim
from `tc-P-before-1.log`:

```
packages/dev-seed/tests/determinism.test.ts(99,25): error TS2559: Type '{ seed: number; elections: { count: number; fixed: { external_id: string; name: { en: string; }; }[]; }; }' has no properties in common with type '{ generateTranslationsForAllLocales?: boolean | undefined; }'.

packages/dev-seed/tests/latent/latentEmitter.test.ts(122,35): error TS2493: Tuple type '[]' of length '0' has no element at index '0'.

packages/dev-seed/tests/templates/nominations-override.test.ts(83,13): error TS2352: Conversion of type '{ candidates: { external_id: string; }[]; constituencies: { external_id: string; }[]; elections: { external_id: string; }[]; organizations: { external_id: string; }[]; alliances: never[]; factions: never[]; question_categories: never[]; questions: never[]; }' to type '{ accounts: { id: string; external_id?: string | undefined; }[]; projects: { id: string; external_id?: string | undefined; }[]; elections: { external_id: string; }[]; constituency_groups: { external_id: string; }[]; ... 9 more ...; feedback: { ...; }[]; }' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```

**`scripts/**/*` added zero diagnostics.** Widening the config to cover `scripts/` as well as `tests/`
produced no additional error, so `scripts/download-portraits.ts` typechecks clean under
`allowJs`/`checkJs` — consistent with R4.2.

### The concrete fix `144-02` applies to each — named here, applied there

**Do not fix them in `144-01`.** This plan writes zero product bytes; naming the fix is its whole
obligation.

| # | Diagnostic | Fix `144-02` applies (from R4.3) |
|---|---|---|
| 1 | `tests/determinism.test.ts(99,25)` `TS2559` | **Annotate the fixture literal as a `Template`** — `const template: Template = { … }`. `fanOutLocales`'s second parameter (`src/locales.ts:140-144`) is the all-optional `{ generateTranslationsForAllLocales?: boolean }`, so TypeScript's weak-type rule demands at least one property in common and this literal has none. The annotation is the *right* fix, not a workaround: it turns the fixture into a live conformance check against the new strict row types, and `{ external_id: 'e1', name: { en: 'Demo' } }` is legal under `ElectionsFixedRow`. |
| 2 | `tests/latent/latentEmitter.test.ts(122,35)` `TS2493` | **Declare the parameter the assertion reads on the `vi.fn` callback** — `const dimsHook = vi.fn((_template: Template) => ({ dims: 2, eigenvalues: [1, 1 / 3] }));`. `vi.fn(() => …)` infers a zero-parameter signature, so `mock.calls[0]` is the empty tuple `[]`. The assertion at `:122` is *about* the first argument; typing it makes the test say what it checks. Cross-check `LatentHooks['dimensions']` in `src/emitters/latent/latentTypes.ts` and use its real parameter list if it takes more than one. |
| 3 | `tests/templates/nominations-override.test.ts(83,13)` `TS2352` | **Add the six missing `Ctx['refs']` keys as empty arrays** — `accounts: []`, `projects: []`, `constituency_groups: []`, `nominations: []`, `app_settings: []`, `feedback: []` — **and then delete the now-redundant `as Ctx['refs']` cast outright.** `Ctx['refs']` (`src/ctx.ts:34-49`) declares fourteen keys; the fixture supplies eight. The honest fix beats `as unknown as`: the fixture becomes structurally complete and stays valid when `Ctx['refs']` grows. |

**Framing, stated so no later reader mistakes it.** All three are **pre-existing** type errors that no
gate has ever seen, because `packages/dev-seed/tests/` has sat outside its own package's `tsconfig`
`include` since `4fc1abb2d`. **None is caused by this phase.** Row `P` records them as owned fallout
with a measured before → after, not as regressions.

**Agreement with the prior, stated rather than assumed.** `144-CONTEXT.md` B-21 and `144-RESEARCH.md`
R4.3 pre-registered exactly three errors at exactly these files, lines and columns. This run
reproduced all three exactly — count, paths, `line:column` and TS codes all identical. **There is no
disagreement to report for row `P`.** The count is nonetheless a measurement taken here, not a number
copied from either document.

### After half — measured in `144-02` Task 2, at HEAD `64b728c97`

The widening is now **committed** (`packages/dev-seed/tsconfig.json`:
`include: ["src/**/*", "tests/**/*", "scripts/**/*"]`, `rootDir` removed), and all three errors are
fixed. Command, verbatim:

```
TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed    # exit 0, log tc-P-after-1.log
```

Exit **0**. `grep -c 'error TS' tc-P-after-1.log` → **0**. Cache verdict
`cache bypass, force executing` on **7 of 7** tasks, `0 cached, 7 total`, 6.545 s — a fresh
measurement, not a replay. Taken on a clean tree: `git status --porcelain -- packages apps tests`
printed nothing immediately before the run.

**The set as fixed here is the set `144-01` measured** — three errors, same three files, same
`line:column`, same TS codes. Nothing extra surfaced, in particular nothing from the new
`tests/template/permittedKeys.test.ts` this plan adds, and `scripts/**/*` again contributed zero.
Each fix is the one named in the table above:

| # | File | Fix applied | Cast escapes |
|---|---|---|---|
| 1 | `tests/determinism.test.ts` | **Both** fixture literals annotated `: Template` (only the second errored; annotating both makes each a live conformance check against the strict row types rather than leaving a matched pair half-typed) | none |
| 2 | `tests/latent/latentEmitter.test.ts` | `vi.fn((_template: Template) => …)` — the parameter list cross-checked against `LatentHooks['dimensions']` (`latentTypes.ts:90`), which takes exactly one argument | none, **and three PRE-EXISTING ones removed** (see below) |
| 3 | `tests/templates/nominations-override.test.ts` | Six missing `Ctx['refs']` keys added as empty arrays (`accounts`, `projects`, `constituency_groups`, `nominations`, `app_settings`, `feedback`); the `as Ctx['refs']` cast deleted outright | none — the cast is **gone**, not replaced |

⚠ **One thing this task did that the plan did not anticipate, recorded rather than absorbed.**
`tests/latent/latentEmitter.test.ts` already carried **three** `as unknown as` casts before this
phase touched it — `questions as unknown as Array<{ external_id: string }>` at `:52`, and two
`as unknown as Template` at `:106` and `:122`. Task 2's acceptance criterion asks for **zero** in
each of the three files, which the pre-existing three made unsatisfiable as written. They were
removed rather than exempted: the two `as unknown as Template` escapes are exactly what the type
layer this plan lands exists to make unnecessary, and leaving them inside the package that owns
TMPL-01 would have been a working counter-example to it. The third became a `.map` projection —
`Ctx['refs'].questions` declares only `external_id`, so projecting is what the type already says.
Committed separately as `64b728c97`.

`grep -c 'as unknown as'` and `grep -c '@ts-ignore'` are **0** on all three files, and
`grep -c "as Ctx\['refs'\]"` is **0**. The three committed `negctl-*.ts` fixtures are byte-unchanged
(`git diff --exit-code -- packages/dev-seed/tests/fixtures` → exit 0): they are unannotated by
construction, so excess property checking has no contextual type to fire against and the widening
left them alone — which is what keeps the phase's own controls outside the gate they control for.

---

## Residue

Findings this plan produced that belong to no register row. `144-07` folds these into the phase's
closing residue section; they are recorded here, at the moment of measurement, so none is lost.

**RES-1 — the source (3) / source (2) overlap hides a `LINK_SENTINELS` regression.** Measured in row
`F`: dropping the 3 bare non-underscore sentinel forms from `LINK_SENTINELS` **alone** rejects **0**
key occurrences, not 76, because `COLLECTION_NON_COLUMNS` (`supabaseAdminClient.ts:141-146`)
independently supplies `elections: {constituencyGroups, constituency_groups}` and
`constituency_groups: {constituencies}`. **Consequence for `144-03`:** the derivation test must assert
the 3 bare pairs against `LINK_SENTINELS` **specifically**, not against the union of the four sources,
or a regression that empties them from the const is invisible to both the survey and Pass 0.

**RES-2 — `template/types.ts:23` is imprecise about `externalIdPrefix`, and it cost a run.** The
comment reads *"prefix prepended to every generator-emitted `external_id`"*. The prefix is in fact
applied to **hand-authored `fixed[]` rows too** — every generator does
``external_id: `${externalIdPrefix}${fx.external_id}` `` (e.g. `ElectionsGenerator.ts:43-45`). A first
`R1-OLD` attempt wrote the election as `negctl144-negctl144-el-1`. `templates/e2e/base.ts:15`
documents the same trap from the other direction by setting the prefix to `''` and pre-writing the
ids. **Candidate record target for `144-07`** (sibling of R-6): amend `types.ts:23` to say
*"prepended to every emitted `external_id`, including hand-authored `fixed[]` rows"*.

**RES-3 — `yarn db:seed:teardown` defaults to `seed_` and is a silent no-op for any other prefix.**
`cli/teardown.ts:211` is `const prefix = values.prefix ?? 'seed_';`. The plan's instruction to run
`yarn db:seed:teardown` between halves would have cleared **nothing** for a fixture whose
`externalIdPrefix` is `negctl144-`, leaving each half to run against the previous half's rows — the
exact contamination research open risk #6 warns about. Every teardown in this plan therefore ran as
`yarn db:seed:teardown --prefix negctl144-`, recorded verbatim. **`144-04` must use the same form.**

**RES-4 — the three choice question types are rejected without a `choices` array.**
`103-questions.sql:77-84` raises `Choice-type question must have a choices array (type: %)` for
`singleChoiceOrdinal` / `singleChoiceCategorical` / `multipleChoiceCategorical`. Both question
fixtures use `type: 'text'` for this reason, stated inline so `144-04` does not re-introduce it.

**RES-5 — a clean `tsc` run produces an empty log, which is not evidence.** Every `tsc` and `vitest`
row in this plan is written through a wrapper (`${TMPDIR:-/tmp}/gsd-144/runrow.sh`) that brackets the
command's combined output with a provenance envelope — row id, cwd, HEAD, ISO timestamps, the verbatim
command, and the exit code. Without it, `tc-T1-OLD-1.log` would have been a zero-byte file and the
plan's own `test -s` acceptance check would have been unsatisfiable for a passing run.

**RES-7 — `FIELD_MAP.organizationId` resolves to `organization_id_nom`, a column on no table.**
`COLUMN_MAP` (`packages/supabase-types/src/column-map.ts`) maps BOTH `organization_id` and
`organization_id_nom` to `organizationId`; `PROPERTY_MAP` is that map reversed, and reversal is
last-wins, so `FIELD_MAP.organizationId` is `organization_id_nom`. `grep -c 'organization_id_nom'
packages/supabase-types/src/database.ts` → **0**: no table has such a column. Derived mechanically,
`permittedKeys` therefore admits `organizationId` on **no** collection, which is exactly what the
pipeline does — `resolveFieldName('organizationId')` would send `organization_id_nom` to the RPC and
be rejected. `tests/template/permittedKeys.test.ts` asserts this so the behaviour cannot drift
silently. **Fixing the collision itself is a cross-package change** (`@openvaa/supabase-types`) and is
outside this phase's fence; filed for `144-07`. Registered as **T-144-11** in `144-02-PLAN.md`'s
threat model.

**RES-8 — `packages/dev-seed/tests/` was carrying three `as unknown as` casts nothing had ever
looked at.** All three were in `tests/latent/latentEmitter.test.ts`; two were `as unknown as Template`,
i.e. working counter-examples to TMPL-01 inside the package that owns it. They survived because the
directory sat outside its own tsconfig `include` (`4fc1abb2d`) and outside the root lint's reach.
Removed in `64b728c97`. **RES-6's 11 unaudited packages are likely to hold the same class of thing**,
which raises that standing todo's value.

**RES-9 — `validateTemplate` now checks `external_id` on every `fixed[]` row.** Making `Template`
strict left one structural gap at the schema-to-type seam: `TemplateSchema` keeps rows at
`z.record(z.string(), z.unknown())` by design (D-04), so its output is not assignable to `Template`,
whose rows require `external_id: string`. Rather than cast across that seam, `144-02` EARNED the
narrowing — `validateTemplate` verifies the one structural property and throws with a field path
(`template.<slot>.fixed[<i>].external_id`) otherwise. The RPC raises on the same condition three
passes later (`external_id is required for bulk import`), so this only moves the failure earlier.
**It affects the filesystem/JSON template path only** — built-ins bypass `validateTemplate` entirely
(B-12), which is the path every E2E setup project uses. Noted for `144-05`, which owns B-12/D-07a.

**RES-6 — the 11 packages beyond dev-seed whose `tests/` sit outside their own tsconfig `include`**
are still unaudited (`144-CONTEXT.md` § Deferred Ideas). Row `G-OLD` measured the dev-seed instance of
this class; the other 11 are out of scope for this phase and remain a standing todo.

### From `144-03` — the two R7.4 defects, closed

**RES-10 — the `_constituency_groups` override hole, CLOSED in `144-03`.** Sites:
`packages/dev-seed/src/pipeline.ts` (`attachSentinels` / `hasDeclaredScope`) versus
`packages/dev-seed/src/supabaseAdminClient.ts` (`linkJoinTables`). **Mechanism:** `linkJoinTables` read
`_constituency_groups` on an `elections` row, but `hasDeclaredScope`'s hand-written argument list
checked only `_constituencyGroups`, `constituencyGroups` and `constituency_groups`. An author scoping an
election with `_constituency_groups` was therefore **not** recognised as having declared scope,
`attachSentinels` overwrote the row with a full-fanout `_constituencyGroups`, and the resolver's `??`
chain then preferred the fanout because `_constituencyGroups` is checked first — **the author's explicit
scoping silently replaced by everything-wired-to-everything**, the exact defect class this phase exists
to eliminate, hiding one file away from the one it was chartered against. **Measured in-tree
exploitation, re-taken in `144-03` Task 2 rather than cited: 0** — zero `elections` `fixed[]` rows carry
`_constituency_groups` across all **30** built-in templates (`${TMPDIR:-/tmp}/gsd-144/defects.mts`,
which walks `BUILT_IN_TEMPLATES` directly rather than the pipeline output, so `attachSentinels` cannot
mask an author's own declaration). **Closing it changes no built-in's output**, and that is not an
argument: the golden link plan for `e2e/base` and `default` is byte-identical across the change
(`diff golden-before-1.log golden-after-attach-1.log` → exit **0**).

**RES-11 — the bare-`elections` phantom, CLOSED in `144-03`.** Same two sites. **Mechanism:**
`hasDeclaredScope(qc, '_elections', 'elections')` treated a bare `elections` array on a
`question_categories` row as declared scope and **suppressed the fanout**, but `linkJoinTables` reads
that key on no collection at all, so the row ended with `election_ids = null = "all"` anyway. The two
outcomes agreed only because the fanout would have listed *every* election; change the election set and
they diverge. **Measured in-tree exploitation, re-taken here: 0** — zero `question_categories` `fixed[]`
rows carry a bare `elections` key across all **30** built-ins, by the same script. **Closing it changes
no built-in's output**, proven by the same empty golden diff.

Both were closed **for free**, by the single edit CONTEXT.md's scope fence permits: `hasDeclaredScope`
now consumes the key list `LINK_SENTINELS` declares for the collection (`sentinelKeysFor`), so the set of
keys that **suppresses** the fanout is byte-identical to the set the resolver **reads**, for all time,
because both read one declaration.

**What the derivation does NOT guarantee.** `attachSentinels`' fanout **policy** — which collections get
a default at all — stays hand-written and is untouched here. Only **three** of the collection/key
combinations declared by `LINK_SENTINELS` receive a default (`elections._constituencyGroups`,
`constituency_groups._constituencies`, `question_categories._elections`); the other seven, including
every `questions` pair and both `_constituencies` jsonb pairs, get none. That asymmetry is deliberate and
belongs to the open **2026-05-23** "remove the fan-out" todo, which this plan leaves open. `144-03`
derived the key **set** only, never the policy.

### From `144-07` — the phase-close residue, named rather than closed

Each entry carries the **measurement** that makes it concrete, not a description, and each is filed as
a standing todo in `.planning/todos/pending/`. Naming a deliberate omission is what keeps it from
being mistaken for an oversight.

**RES-12 — the packages whose specs sit outside the repo typecheck gate. RE-MEASURED, and the source
documents are imprecise rather than wrong.** `144-CONTEXT.md:75` and `:471` both say *"the 11 packages
beyond dev-seed whose `tests/` sit outside their own tsconfig `include`"*, and `144-RESEARCH.md:1376`
derives that 11 from B-15's measured 12. **Re-measured at the closing HEAD:** 12 packages declare a
`typecheck` script — `apps/docs`, `apps/frontend`, `packages/{app-shared, argument-condensation, core,
data, dev-seed, dev-tools, filters, llm, matching, question-info}` — which **agrees** with B-15
exactly, and 11 of them are beyond dev-seed, which agrees with the arithmetic. **The imprecision is in
the description, not the number:** only **5** of the 11 actually have a `tests/` directory, and all
five do not merely omit it from `include` — they **explicitly `exclude`** it
(`argument-condensation`, `filters`, `llm`, `matching`, `question-info`; **16** spec files). The other
6 have no `tests/` directory at all; three of them instead exclude their **co-located** specs with
`"exclude": ["**/*.test.ts"]` (`app-shared` 3 · `core` 3 · `data` 47 = **53** spec files). **Total
outside the gate: 69 spec files across 8 packages, by two different exclusion mechanisms** — a wider
surface than "11 packages" suggested and a narrower one than it named. `dev-seed` is the only
workspace whose `include` is `["src/**/*", "tests/**/*", "scripts/**/*"]`, which `144-02` made so and
row `G-OLD`/`G-NEW` is the pair that proves it matters. Sibling of Phase 143's D-08 lint-script-scope
todo. **Deferred deliberately:** D-06 adopted the repo-wide gate; the per-package `include` audit was
explicitly out of scope.

**RES-13 — `packages/dev-seed`'s lint script covers only `src/`, so every spec this phase added is
unlinted.** Measured: `packages/dev-seed/package.json:14` is
`eslint --flag v10_config_lookup_from_file src/`. This phase added **8** tracked files under
`packages/dev-seed/tests/` — `assertKnownRowProps.test.ts`, `assertKnownRowProps.builtins.test.ts`,
`template/permittedKeys.test.ts`, `template/linkSentinels.test.ts`,
`template/strictRowTypes.type-test.ts` and the three `fixtures/negctl-*.ts` — and **each of the 8
appears zero times** in the gate-2 lint log (`grep -c "$(basename …)" gate-lint-1.log` → 0 for all
eight). The directory holds **51** tracked files, **46** of them spec files, all unlinted. Same class
as Phase 143's D-08. **Not widened here, deliberately** — widening it would move a phase-wide warning
baseline that six later plans compare against.

**RES-7 (carried from `144-01`, now measured to the column) — the `COLUMN_MAP` `organizationId`
collision.** `packages/supabase-types/src/column-map.ts:17` maps `organization_id → 'organizationId'`
and **`:32` maps `organization_id_nom → 'organizationId'` as well**. `PROPERTY_MAP` at `:82` is
`Object.fromEntries(Object.entries(COLUMN_MAP).map(([k, v]) => [v, k]))` — a reversal, and reversal is
**last-wins** — so `FIELD_MAP.organizationId` resolves to `organization_id_nom`. That column exists on
**no table**: `grep -c 'organization_id_nom' packages/supabase-types/src/database.ts` → **0**, and the
same grep over `apps/supabase/supabase/schema/*.sql` → **0**. Derived mechanically, `permittedKeys`
therefore admits `organizationId` on **no** collection, which is exactly what the pipeline does, and
`tests/template/permittedKeys.test.ts` asserts it so the behaviour cannot drift silently. **Fixing the
collision is a cross-package change** touching `@openvaa/supabase-types` and the frontend adapter, and
is outside this phase's fence. Registered as **T-144-11**.

**RES-14 — the RPC builds column identifiers by interpolation, and Pass 0 substantially narrows that
surface.** Measured: `apps/supabase/supabase/schema/501-bulk-operations.sql:170` is
`col_names := array_append(col_names, item_key);` — the key is appended **raw**, with no
`quote_ident`. Values are quoted throughout (`quote_literal` at `:164`, `:177`, `:181`); **keys are
not**. The final `format(...)` at `:195-201` uses `%I` for the **table name only** and `%s` for
`col_names`, `col_values` and `update_parts`. **State the narrowing as a security benefit of TMPL-02:**
nothing not on the derived allow-list now reaches `bulk_import` at all, so the set of strings that can
become an interpolated identifier is now a **derived, closed set** rather than whatever a template
happened to declare. The residual path is service-role-only with developer-authored input — the same
trust model as `tsx` itself. **RPC-side hardening (`quote_ident` on `item_key`) is filed, not done:**
expanding scope to change a shipped RPC signature's SQL is outside this phase's fence.

**RES-15 (NEW, found by this plan's own gate 7) — `yarn test:unit` leaves a full seeded dataset in the
live local database, and the next E2E run inherits it.** This is not a phase-144 defect; it is a
standing apparatus hazard that cost this plan one void gate-7 attempt and would cost the next person
the same. Measured:
`packages/dev-seed/tests/integration/default-template.integration.test.ts` calls `runTeardown` at
**line 191 only, inside `beforeAll`** — a PRE-test cleanup with **no** post-test counterpart. After a
`yarn test:unit` the database holds `elections=1 · question_categories=4 · questions=26 ·
candidates=328 · nominations=377`, all carrying the `seed_` prefix that is
`packages/dev-seed/src/templates/default.ts:39`'s `externalIdPrefix`. `grep -c 'seed_cand_'
apps/supabase/supabase/seed.sql` → **0**, so `seed.sql` is not the source. The E2E symptom is a
data-shaped confusion rather than an error: a category heading reading `Economy & Taxation` where the
spec expects the Base opinion category, and **2** constituency comboboxes where it expects **1**. Full
diagnosis in `gate-e2e-rootcause-1.log` and in § Gates. **Sibling of `144-01`'s RES-3** (`seed:teardown`
defaults to the `seed_` prefix and is a silent no-op for any other), which is the same class seen from
the other direction. **Filed, not fixed** — adding an `afterAll` to that test is a change to a
different package's test contract and belongs to whoever owns the CI `dev-seed-integration` job.

**RES-16 (NEW, found by this plan's own gate 4) — a `build` gate taken without `TURBO_FORCE` is not a
measurement.** `turbo.json` gives `build` no `"cache": false`, exactly like `lint` and `typecheck`.
The verbatim `yarn build` returned exit 0 at `Cached: 14 cached, 14 total` — every task a cache
replay, i.e. a claim about a **previous** tree. D-06b anticipated this hazard for `lint` and
`typecheck` and named the `--force` trap; **it did not anticipate it for `build`**, and no plan in
this phase forced the build gate. Re-taken forced here (`0 cached, 14 total`) with the cached run
preserved. **Filed so the next phase's gate protocol lists `build` beside `lint` and `typecheck`.**

**RES-17 — the 2026-05-23 sentinel fan-out todo stays OPEN, and is annotated rather than retired.**
`144-03` derived the sentinel key **set** only, never the fan-out **policy**. Measured: only **3** of
the **10** `(collection, key)` combinations `LINK_SENTINELS` declares receive a default at all —
`elections._constituencyGroups`, `constituency_groups._constituencies`,
`question_categories._elections` — and the other **7**, including every `questions` pair and both
`_constituencies` jsonb pairs, get none. That asymmetry is deliberate and is the todo's territory. The
todo is timed against a separate `jsonb`→`uuid[]` column migration and is verified still present in
`.planning/todos/pending/` at the closing HEAD, now carrying a note recording exactly what `144-03`
did change (the key set that suppresses the fanout, now derived from one declaration) and what it did
**not** (the fanout policy itself). A later reader must not mistake the key-set change for the
fan-out removal.

**RES-18 — `NON_COLUMN_FIELD_READERS` is a second hand-written source, small and asserted both ways,
and it belongs on this ledger's face beside the source-(4) limit.** `144-04` asked for exactly this.
It is hand-written from the two tables `importAnswers` iterates, because that loop cannot be
introspected from a const. It is asserted in `permittedKeys.test.ts` in **both** directions — admitted
on `candidates` and `organizations`, refused on `questions` and `elections` — and the reason is
written into the const's own doc comment. **Stated here so no reader infers a four-source derivation
guarantee the phase does not have:** the allow-list has **4** sources, of which **3** are derived, one
(the RPC map) is parity-tested, and this **fifth, smaller** input is hand-written and asserted.

### Findings the six plan summaries surfaced, collected here with their dispositions

Each plan was required to **report** a disagreement rather than reconcile it. This is where those
reports are collected; there is no plan whose findings were dropped.

| # | Finding | Plan | Disposition |
|---|---|---|---|
| RES-1 | The source (3)/(2) overlap hides a `LINK_SENTINELS` regression — dropping the 3 bare forms from the const **alone** rejects 0, not 76 | `144-01` | **CLOSED.** `144-02` asserted the bare pairs against `LINK_SENTINELS` **specifically**; `144-03` re-closed it inside the derivation spec, where a reader looking for criterion 4 will find it. Row `DRV-NEW` proves the assertion is live |
| RES-2 | `template/types.ts` was imprecise about `externalIdPrefix` — it applies to hand-authored `fixed[]` rows too, and the imprecision cost a run | `144-01` | **CLOSED in-tree.** Verified at the closing HEAD: `types.ts:58-62` now reads *"prefix prepended to every emitted `external_id`, **including hand-authored `fixed[]` rows**"* with the generator call site cited. No record correction owed |
| RES-3 | `yarn db:seed:teardown` defaults to the `seed_` prefix and is a silent no-op for any other | `144-01` | **CONSUMED** — `144-04` ran `--prefix negctl144-` as required. The default is unchanged (`cli/teardown.ts:211`) and is deliberate. **Sharper sibling filed as RES-15** |
| RES-4 | The three choice question types are rejected without a `choices` array | `144-01` | **CONSUMED.** Both question fixtures use `type: 'text'`, stated inline so it was not re-introduced |
| RES-5 | A clean `tsc` run produces an empty log, which is not evidence | `144-01` | **CLOSED** by the `runrow.sh` provenance envelope. `144-06` hit the same thing independently and re-took a 0-byte log with a header |
| RES-6 | 11 packages beyond dev-seed unaudited for tsconfig `include` | `144-01` | **RE-MEASURED and superseded by RES-12** — the count is right, the description is not |
| RES-7 | `FIELD_MAP.organizationId` resolves to a column on no table | `144-01` | **FILED** as residue above, measured to the line. Cross-package; outside the fence |
| RES-8 | Three `as unknown as` casts in `dev-seed/tests/` nothing had ever looked at, two of them counter-examples to TMPL-01 | `144-01` | **CLOSED** — removed in `64b728c97`, which is exactly what widening the `include` was for |
| RES-9 | `validateTemplate` now throws for a `fixed[]` row without a string `external_id` | `144-02` | **ACCEPTED as designed.** Filesystem/JSON path only; built-ins bypass it. The RPC raises on the same condition three passes later, so this only moves the failure earlier |
| — | **`tsc` exits 2, not 1**, when a run completes with diagnostics — the plan text under-predicts by one across the whole phase | `144-01`, `144-02`, `144-06` | **CORRECTED IN THE RECORD.** Corroborated independently by rows `X-OLD`, `P`, `T1-NEW`, `T2-NEW`, `X-NEW`, `G-NEW`. Recorded as 2 everywhere rather than writing a number no command produced |
| — | `144-RESEARCH.md:692`'s headline says **twelve** sentinel pairs while its own table beneath it enumerates **ten** | `144-02`, `144-03`, `144-04` | **REPORTED, still open as a document defect.** Ten is re-derived independently at two HEADs and is the figure this ledger states. A RESEARCH document is a snapshot of its own moment; the correction lives here and in `## Final counts`, which every downstream artifact cites |
| — | The `answersByExternalId` permission defect — it sat in `bulkImport`'s **global** strip set, so the union admitted it on every collection and row `R2-NEW`'s control would have been **structurally unable to fire** | `144-04` | **FIXED, and the fix is a behaviour change worth stating.** Split into "stripped everywhere" (`NON_COLUMN_FIELDS`, unchanged) versus "legal only where read" (`NON_COLUMN_FIELD_READERS`, new). **Measured cost across all 30 built-ins: zero.** ⚠ **Consequence: a previously-silent field drop is now a hard seed failure.** That is the phase's intent, but it changes how a malformed template behaves at seed time and is recorded as such rather than as a footnote |
| — | `accounts` and `projects` are modelled by the runtime guard but excluded from `CollectionKey` — twelve authorable collections, fourteen guarded ones | `144-04` | **ACCEPTED, and the split is stated.** The guard models what the RPC can receive; `CollectionKey` models what a template may author. Widening the guard was the directed response to a false positive, never narrowing the survey |
| — | **The EPC boundary moved** — `144-02` retyped `buildMinimal.ts` and `perm/shared.ts`, so a row written inside those builders is now a `TS2353`. Pass 0's unique cover is **narrower** on the builder count and **wider** on `--template ./custom.ts` and the never-ran-`tsc` case than the plans assumed | `144-04` | **ADOPTED as the phase's statement of what TMPL-01 does not reach.** The residue above and every claim this phase makes about the type layer's reach are written from `144-04`'s five-row table, not from any plan's original premise |
| — | The ASSERT-04 corpus is **4 + 3 + 3 = 10**, not six; the blind count is **4** | `144-05` | **CORRECTED IN PLACE** at both record targets (R-2, R-4), citing the census so the discarded figure cannot re-enter through a later reader's arithmetic |
| — | `template.test.ts:95` (`TMPL-07: {} still passes`) is unfailable by construction and still on the bare `.not.toThrow()` form | `144-05` | **NOT claimed as done.** Out of `144-05`'s row set; the same round-trip repair row `NA` received would fix it. Standing in the broken-windows ledger |
| — | `Z4-NEW` iteration 0 was a **mis-injection** (stale line number deleted a comment, not the chain link) and read as "the deletion changed nothing" | `144-05` | **DISCLOSED, log preserved** at `vt-Z4-NEW-0-DISCARDED-misinjection.log`. The precedent this plan followed for its own two void gate-7 attempts |
| — | `144-05-SUMMARY.md` says *"144-06 owns the E2E gate."* **That is wrong** | `144-06` | **CORRECTED.** `144-06` owns the TYPECHECK gate and explicitly claimed nothing about Playwright. **`144-07` owns the full E2E gate**, and § Gates is where it is discharged |
| — | Row `G-NEW`'s instrument legitimately differs from `G-OLD`'s (bare `tsc` versus the turbo gate) | `144-06` | **STATED in the row rather than glossed.** `G-OLD` measured whether the **compiler** could see `tests/`; `G-NEW` measures whether the **gate** does — a strictly stronger claim, and the injection is byte-identical, so the pair is still a pair |
| — | The new named type-check CI step is asserted present, ordered and locally green, but **no GitHub Actions run has executed it** | `144-06` | **OPEN and honest.** Only a real CI run proves the gate blocks a merge. Standing in the broken-windows ledger |
| — | Two unrelated Playwright files carry pre-existing formatting/lint drift and were touched by repo-wide autofixes | `144-02`, `144-04` | **REVERTED both times, left exactly as found.** Out of every plan's scope; already standing in the broken-windows ledger from Phase 151 |

---

## Gates

**All seven gates ran at ONE HEAD — `47ee50054` — recorded once before gate 1 and asserted unchanged
after gate 7 and after row `Z`.** No source file was edited and no commit was made between gate 1 and
row `Z`, so the set is a set rather than a sequence of claims about different trees (T-144-49).
Resolved `$TMPDIR` is `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T`, so every log path
below resolves under `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-144/`.

Machine: developer Mac, host Node, no container — macOS 26.5.1 arm64 / Darwin 25.5.0 / Node v24.14.1,
runs issued from the repository root.

### Gate 1 — unit

- **Command, verbatim:** `yarn test:unit`
- **Exit:** **0**
- **Counts:** `Tasks: 25 successful, 25 total`. **11 workspaces reported tests: 171 test files, 1,788
  tests, 0 failed.** Per workspace — `dev-seed` 47 files / **525** tests · `frontend` 54 / 814 ·
  `data` 47 / 244 · `matching` 5 / 43 · `argument-condensation` 6 / 30 · `llm` 2 / 39 ·
  `app-shared` 3 / 21 · `core` 3 / 8 · `filters` 1 / 22 · `question-info` 2 / 22 · `supabase` 1 / 20.
- **Cache verdict:** `Cached: 10 cached, 25 total` — **all ten cached tasks are `build` tasks**; every
  one of the **11** `test:unit` tasks reads `cache bypass, force executing`, because `turbo.json`
  gives `test:unit` `"cache": false` (unlike `lint` and `typecheck`). No test result is a cache replay.
- **Log:** `gate-unit-1.log`

### Gate 2 — lint

- **Command, verbatim:** `TURBO_FORCE=true yarn lint:check`
- **Exit:** **0**
- **Counts:** **0 errors, 20 warnings**, every warning pre-existing and none in a file this phase
  wrote — `@openvaa/core` 2 · `@openvaa/dev-seed` 15 (the uniform unused-`ctx` generator signature)
  · `@openvaa/frontend` 1 · the `tests` eslint link 2.
- **Cache verdict:** **33** verdict lines read `cache bypass, force executing`; **zero** cache
  replays anywhere in the log. Two aggregates: `Tasks: 11 successful, 11 total` / `0 cached, 11 total`
  for `turbo run lint`, and `Tasks: 22 successful, 22 total` / `0 cached, 22 total` for the
  `yarn typecheck` link `144-06` chained on. Forced deliberately: `turbo.json` gives `lint` no
  `"cache": false`, so on a clean tree the task is a cache HIT and a replayed exit code is a claim
  about a **previous** tree. **`yarn lint:check --force` is forbidden** — yarn appends the argument
  past the `&&` chain and it silently does nothing (D-06b).
- **Full-chain statement, not a short-circuit:** `lint:check` short-circuits on `&&`, so a red would
  mean the **first** failing link failed and the later links never ran. This run was **green**, and
  all four links are visible in the log — `turbo run lint` (`Running lint in 15 packages`, line 8),
  the `eslint … tests` link, `yarn typecheck:tests`, and `yarn typecheck` (`Running typecheck in 15
  packages`, line 97). The result below is therefore a whole-gate observation.
- **Log:** `gate-lint-1.log`

### Gate 3 — format

- **Command, verbatim:** `yarn format:check`
- **Exit:** **0**
- **Counts:** `All matched files use Prettier code style!` on both prettier invocations; **0**
  unformatted files, no repair needed.
- **Cache verdict:** `n/a — direct prettier`
- **Log:** `gate-format-1.log`

### Gate 4 — build

- **Command, verbatim:** `TURBO_FORCE=true yarn build`
- **Exit:** **0**
- **Counts:** `Tasks: 14 successful, 14 total`
- **Cache verdict:** `Cached: 0 cached, 14 total`, with **14 of 14** verdict lines reading
  `cache bypass, force executing` and **zero** cache replays.
- ⚠ **Disclosed rather than quietly upgraded.** The plan's verbatim command is `yarn build`. That
  form was run **first** and exited **0** — but at `Cached: 14 cached, 14 total`, i.e. every task a
  cache replay. Under this register's own rule 3 a replayed exit code is a claim about a *previous*
  tree and is not a measurement, so the gate was **re-taken forced** and the forced run is what is
  recorded above. The cached first run is preserved at `gate-build-1-cached.log` rather than deleted.
  `turbo.json` gives `build` no `"cache": false`, exactly like `lint` and `typecheck`, so this is the
  same hazard D-06b names — it simply was not anticipated for gate 4.
- **Log:** `gate-build-1.log` (forced, the recorded measurement) · `gate-build-1-cached.log` (the
  cached first run, kept as disclosure)

### Gate 5 — frontend typecheck

- **Command, verbatim:** `yarn workspace @openvaa/frontend check`
- **Exit:** **0**
- **Counts:** `COMPLETED 2684 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- **Cache verdict:** `n/a — direct svelte-check`
- **Not optional:** neither lint nor build type-checks `apps/frontend/src`, and CI runs this
  type-check as its own step — the Phase-142.1 and Phase-143 precedent.
- **Log:** `gate-svelte-check-1.log`

### Gate 6 — repo typecheck

- **Command, verbatim:** `TURBO_FORCE=true npx turbo run typecheck`
- **Exit:** **0**
- **Counts:** `Tasks: 22 successful, 22 total`; `grep -c 'error TS'` over the log → **0**
- **Cache verdict:** `Cached: 0 cached, 22 total`, **22 of 22** verdict lines
  `cache bypass, force executing`, **zero** cache replays.
- **Log:** `gate-typecheck-1.log`

### Gate 7 — E2E, last

- **Command, verbatim:** `yarn test:e2e`
- **Exit:** **0**
- **The four numbers, separately:** **135 passed · 0 failed · 0 flaky · 0 skipped.** Duration 10.4 m.
- **And the fifth, which CLAUDE.md counts as a failure rather than a skip:** **0 did not run.** The
  progress counter reached `[135/135]`, the summary line reads `135 passed (10.4m)`, and the log
  contains **zero** occurrences of `did not run` and **zero** of `interrupted`. Every test in the
  suite executed.
- **Cache verdict:** `n/a — playwright`
- **Preconditions, both discharged.** `yarn db:reset` exited **0** immediately before this run,
  leaving `elections=0 · questions=0 · nominations=0 · candidates=1 · projects=1` and **2** storage
  buckets — the single candidate is `apps/supabase/supabase/seed.sql:96`'s bootstrap row, i.e. the
  known baseline dataset, not residue. **Exactly one** dev server, started by this plan and stopped by
  it: one listener on `[::1]:5173`, pid 19340, confirmed by `lsof` before the run and confirmed gone
  after. The suite's own preflight passed and its verdict is read from the run's output rather than
  assumed: `E2E PREFLIGHT OK …/apps/frontend (verified against …/voting-advice-application-gsd)`.
- **Run rather than argued away.** Pass 0 executes inside **every** E2E setup project — every
  `perm-*` project goes `setupFromTemplate` → `Writer.write` → `assertKnownRowProps` — so this
  phase's reach into the suite is real, not theoretical. CLAUDE.md's cardinal rule admits no
  known-flaky exemption and no "cannot plausibly affect it" waiver, and none was taken.
- **Log:** `gate-e2e-1.log`

### ⚠ Two VOID gate-7 attempts, disclosed rather than deleted

Deleting a failed attempt would be the easy option and the wrong one — `144-05` set the precedent by
preserving its mis-injected `Z4-NEW` iteration 0. **Neither void attempt is a phase-144 code defect
and neither is a Pass 0 false positive.** Both logs are kept.

**Attempt 1 — VOID: contaminated database.** Result was `8 failed · 79 did not run · 48 passed`, exit
1. Root cause, measured rather than guessed: this executor ran `yarn db:reset` **before gate 1**, and
**gate 1 itself repopulates the live local database.**
`packages/dev-seed/tests/integration/default-template.integration.test.ts` calls its `runTeardown` at
**line 191 only, inside `beforeAll`** — it is a PRE-test cleanup with **no** post-test counterpart, so
`yarn test:unit` always leaves the whole `default` template behind. It ran in gate 1
(`gate-unit-1.log`, 7,808 ms) and left `elections=1 · question_categories=4 · questions=26 ·
candidates=328 · nominations=377`, all carrying the `seed_` prefix that is
`packages/dev-seed/src/templates/default.ts:39`'s `externalIdPrefix`. `grep -c 'seed_cand_'
apps/supabase/supabase/seed.sql` → **0**, so `seed.sql` did not produce them. The failures are exactly
what that predicts: `eperm07-term-trigger` read the category heading as `Economy & Taxation  7
questions` — a `default` category — instead of the Base opinion category, and `voter-journey` found
**2** constituency comboboxes where it expected **1**. `git log d2ffc3904..HEAD` on that test shows
only `3ab2ecc93`, a `+24`-line operation-budget addition; the pre-test-only teardown shape is
**pre-existing and untouched by this phase**. Verdict: an apparatus defect in the gate ORDER —
`yarn db:reset` belongs immediately before gate 7, after gate 1, not before it. Fixed by re-ordering;
**no source change, no commit, HEAD unchanged**. Logs `gate-e2e-1-VOID-contaminated-db.log` and
`gate-e2e-rootcause-1.log`. **Filed as standing residue**, because a `yarn test:unit` that silently
leaves a seeded dataset behind will do this to the next person too.

**Attempt 2 — VOID: this executor's own 10-minute harness timeout.** The runner was killed at
`[104/135]` with **0** failure blocks recorded. Nothing about the tree; the suite simply takes longer
than the timeout used. Re-launched detached and it completed in 10.4 m. Log
`gate-e2e-1-VOID-harness-timeout.log`.

**What did NOT happen, stated so it cannot be inferred:** no test was retried to green, no test was
annotated as flaky, no gate was re-run after a fix (there was no fix), and the recorded gate 7 is a
single clean run of the whole suite, not a best-of.

---

## Fallout table (criterion 5 / D-10)

Criterion 5 requires **every field an existing template loses to the tightening** to be listed with
the reason, carrying its file, collection, `external_id`, key and why it was never read.

| Carrying file | Collection | `external_id` | Key | Why it was never read |
|---|---|---|---|---|
| — | — | — | — | **(empty — see the discharge below)** |

### ⚠ The table is EMPTY, and an empty table ships as a discharge, never as a blank section

A blank table cannot be distinguished from a survey nobody ran — which is precisely the failure mode
this milestone exists to eliminate (T-144-51). The emptiness is therefore stated **with the
measurement that produced it, the command that produced the measurement, and the HEAD it ran at**,
from **both** source rows: row `F` on the untouched tree, and row `NC` at the post-change HEAD.

| | Row `F` (`144-01`, pre-change) | Row `NC` (`144-04`, post-change) |
|---|---|---|
| HEAD | `f2cb118b4` — untouched tree | `28b1663aa` — before one byte of guard code existed |
| Built-in templates surveyed | **30** | **30** |
| Total emitted rows | **1,481** | **1,481** |
| Total key occurrences classified | **11,125** | **11,125** |
| **Unknown keys found** | **0** | **0** |
| Command, verbatim | `GSD144_ROOT="$(pwd -P)" npx tsx "${TMPDIR:-/tmp}/gsd-144/survey-F.mts"` | `yarn workspace @openvaa/dev-seed test:unit tests/assertKnownRowProps.builtins.test.ts` |
| Log | `survey-F-1.log` | the `144-04` Task-1 classification log |

**The two rows AGREE, exactly, on all four figures** — 30 / 1,481 / 11,125 / 0 — and on every
per-collection subtotal. There is no disagreement to report, and that agreement is itself the
statement: the corpus did not move under the change, so the zero is a property of the allow-list
composition rather than of a shrinking survey. The registry size is re-confirmed at the closing HEAD
by parsing `BUILT_IN_TEMPLATES` out of `packages/dev-seed/src/templates/index.ts` — **30** entries,
`default` + `e2e/base` + 28 `perm-*`/`show-feedback-survey` templates.

**Neither zero is vacuous.** Row `F` carried an apparatus control (`__probe144_ctrl.ts`); row `NC`
carried one in the same window — injecting `negctl144InjectedBogusKey` onto `e2e/base`'s
`test-e2e-base-el-reg` elections row made the classifier exit **1** naming all four diagnostic facts
and **exactly one** offence, so it neither over- nor under-reports. And row `NC`'s spec iterates
`BUILT_IN_TEMPLATES` under a `>= 30` floor, so a registry that silently emptied could not pass it.

**D-10's DELETE default and its E2E-red exception therefore never fired.** No field was deleted from
any template, because no template declared a field the tightened allow-list refuses.

### What WOULD have been fallout — the three classes, each with its disposition

The section has content because the counterfactuals were priced. Each class is **NOT deleted**, and
each entry says why.

| # | Class | Would-be fallout | Disposition — and why it is not deleted |
|---|---|---|---|
| **(2)** | The RPC's per-table **relationship references**, under a three-source composition that omits source (4) | **2,955** key occurrences across **9** distinct (collection, key) pairs — `nominations/election` 636 · `nominations/constituency` 636 · `nominations/parent_nomination` 497 · `nominations/candidate` 453 · `candidates/organization` 438 · `nominations/organization` 164 · `questions/category` 104 · `nominations/alliance` 19 · `constituencies/parent` 8 | **KEPT.** Deleting them would break **every foreign key in every seeded dataset**, including every E2E setup project — a cardinal failure under `CLAUDE.md`, not a tunable tradeoff. This is source (4) **priced**: it is the reason the fourth source exists despite being parity-tested rather than derived (§ Source (4) derivation limit) |
| **(4)** | The **3 bare non-underscore sentinel forms**, under a sentinel set that omitted them from **every** source | **76** occurrences across 2 pairs — `elections/constituency_groups` 41 · `constituency_groups/constituencies` 35 | **KEPT.** Both are read by `linkJoinTables` at `:398` and `:451`. B-4's corrected count of **10** sentinel pairs (7 underscore-prefixed + 3 bare) is exactly what keeps them alive. ⚠ The 76 prices the counterfactual **only** when the forms are removed from every source: removing them from `LINK_SENTINELS` **alone** rejects **0**, because `COLLECTION_NON_COLUMNS` supplies the same pairs independently — which is why `144-03`'s derivation spec asserts the bare pairs against the CONST specifically (RES-1) |
| **(3)** | **`project_id`**, under a deny-list seeded literally from the RPC's full `skip_columns` array | **1,481** occurrences — one on every row of all ten emitting collections | **KEPT.** The RPC **re-supplies** `project_id` from its own `p_project_id` parameter (`501-bulk-operations.sql:95-96`), so the generators are **correct** to emit it. Seeding the deny-list from the whole array would reject a key that is right to be there. The shipped deny-list has exactly **one** entry, `entity_type` (D-09) |

---

## Final counts

**Every number this phase states anywhere is derived ONCE, here, from the register at the closing
HEAD `47ee50054`.** `REQUIREMENTS.md`, `ROADMAP.md`, the fake-guard sweep audit, the retired todo and
the plan summaries **cite this section and do not re-derive**. Phase 143 lost a plan cycle to counts
that moved between measurement and statement; that is the failure this rule exists to prevent.

### The register

| Count | Value |
|---|---|
| **Total register rows** | **37** |
| OLD/NEW pairs | **14** |
| **Measured halves** (14 × 2) | **28** |
| Non-pair rows (`L`, `NC`, `A`, `AF`, `NA`, `F`, `P`, `C`, `Z`) | **9** |
| **Measured in THIS phase** | **37 of 37 — every row** |
| **Borrowed from another phase** | **0.** No cell in this register carries a borrowed observation, and none carries a cache replay |

**Rows per plan** — each plan cleared only its own, so the running placeholder count is an assertion
about the commit graph rather than a claim made in prose: `144-01` **17** (`A`, `T1-OLD`, `T2-OLD`,
`G-OLD`, `X-OLD`, `P`, `Z1-OLD`…`Z4-OLD`, `DRV-OLD`, `K-OLD`, `V-OLD`, `F`, `R1-OLD`, `R2-OLD`,
`DENY-OLD`) · `144-02` **2** (`T1-NEW`, `T2-NEW`; also amends `P`'s after-half and `L`'s type half) ·
`144-03` **2** (`DRV-NEW`, `L`) · `144-04` **5** (`R1-NEW`, `R2-NEW`, `K-NEW`, `DENY-NEW`, `NC`) ·
`144-05` **7** (`Z1-NEW`…`Z4-NEW`, `V-NEW`, `AF`, `NA`) · `144-06` **2** (`G-NEW`, `X-NEW`) ·
`144-07` **2** (`C`, `Z`). 17 + 2 + 2 + 5 + 7 + 2 + 2 = **37**.

### Pairs by outcome class

| Class | Count | Pairs |
|---|---|---|
| Standard **blind → catch** (OLD `GREEN (blind)`, NEW `RED (catch)`) | **12** | `T1`, `T2`, `G`, `R1`, `R2`, `Z1`, `Z2`, `Z3`, `Z4`, `DRV`, `DENY`, `V` |
| **Self-control** pair — both halves under the same tree, what differs is the fixture | **1** | **`X`** — `@ts-expect-error` directive present (exit 0 on the directive's own arm) versus offending row deleted, directive now unused (`TS2578`) |
| ⚠ **Inverted** pair — the phase's ONE red OLD half, and the red is the success signal (D-03a) | **1** | **`K`** — `K-OLD` **RED**, throwing `no permitted-key set for collection 'questionCategories'` under raw-key keying; `K-NEW` **GREEN** under resolved keying. An executor reading `K-OLD`'s red as a defect has the pair exactly backwards |
| **Total** | **14** | |

### Non-pair rows

| Row | What it is | Result |
|---|---|---|
| `A` | Baseline / **restoration target** | 22 of 22 forced, 0 cached, exit 0 |
| `Z` | Closing revert | **Reproduces `A` exactly** — same four numbers |
| `C` | Restore proof | Five assertions clean, both probe glob forms empty |
| `L` | **must-NOT-fire** — `questions._elections` stays legal | type half exit 0 · plan half exactly **1** `planLinks` entry |
| `NC` | **must-NOT-fire** — every row every built-in emits | **0** offences across 30 / 1,481 / 11,125 |
| `AF` | **Already-failable**, re-measured on the pre-phase blob — **not** claimed as a repair by this phase | red under injection before `144-05` existed, and after |
| `NA` | `N/A — by construction` — asserts `validateTemplate({})`, so no removal can redden it | unfailability **observed**, not argued: an injection that reddened 5 of 7 cases in its own file left it green |
| `F` | Fallout survey, pre-change | **0** under the recommended composition |
| `P` | Pre-existing `tsc` diagnostics, before → after | **3** before, all three fixed, nothing new |

**must-NOT-fire rows: 2** (`L`, `NC`).

### The derived sets

| Count | Value | How it is held |
|---|---|---|
| **Sentinel `(collection, key)` pairs** | **10** — 7 underscore-prefixed + 3 bare | Derived from `LINK_SENTINELS`; asserted mechanically against a hand-enumerated list **plus a length assertion**, so the count is checked and not merely stated. Re-derived independently at their own HEADs by `144-02` **and** `144-03`, agreeing with `144-CONTEXT.md` B-4 as corrected in `a264a972e` and with `144-RESEARCH.md` R2.2's own table. ⚠ **R2.2's headline sentence at `144-RESEARCH.md:692` still says "twelve" and still contradicts the table immediately beneath it** — reported for the fourth time here rather than reconciled |
| **Source (4) relationship-reference pairs** | **10** | `candidates→organization` (1) · `nominations→candidate, organization, faction, alliance, election, constituency, parent_nomination` (7) · `questions→category` (1) · `constituencies→parent` (1). Transcribed from the RPC's `CASE p_table_name` block **read at execution time** and parity-tested in **both** directions, with the parsed total asserted to be exactly 10 |
| **Allow-list sources** | **4** — 3 derived, 1 parity-tested | DB columns · `LINK_SENTINELS` · the non-column consts · the RPC relationship map (**not** derivable: Postgres cannot iterate a TypeScript const) |
| **Deny-list entries** | **1** — `entity_type` | Four further exclusions are documented and non-throwing (D-09) |
| **Fallout** | **0** fields, **0** files, **0** `external_id`s | § Fallout table above |

### The ASSERT-04 corpus — re-derived, and it is not six

Re-derived by `144-05` at execution HEAD by enumerating every "accepts field X"-shape site in the two
D-05 spec files and classifying each **by measurement** rather than by reading:

| Class | Count | Sites |
|---|---|---|
| **Blind → now failable** | **4** | `template.test.ts:39`, `:49`, `:59` · `latent.schema.test.ts:42` |
| Already-failable (**not** repaired by this phase) | **3** | `template.test.ts:79`, `:84` · `latent.schema.test.ts:46` |
| Unfailable by construction | **3** | `template.test.ts:22`, `:95` · `latent.schema.test.ts:30` |
| **Total sites in this shape** | **10** | |

**4 + 3 + 3 = 10. The number ASSERT-04 turns on is the blind count: 4.** Each of the four carries a
two-directional measurement (rows `Z1-NEW` … `Z4-NEW`). **"Six" is wrong twice over** — wrong as a
count of blind sites (it is 4) and wrong as a count of sites in this shape (it is 10). The audit
counted six as blind; four are, the two others it named (`AF`, `NA`) were never blind, and there are
four **more** sites in the same shape it did not count at all.

### The seven gates

| # | Gate | Command | Exit | Numbers |
|---|---|---|---|---|
| 1 | unit | `yarn test:unit` | **0** | 25/25 tasks · 11 workspaces · 171 files · **1,788** tests · 0 failed |
| 2 | lint | `TURBO_FORCE=true yarn lint:check` | **0** | 0 errors · 20 pre-existing warnings · 33 forced verdicts · 0 replays |
| 3 | format | `yarn format:check` | **0** | 0 unformatted files |
| 4 | build | `TURBO_FORCE=true yarn build` | **0** | 14/14 · `0 cached, 14 total` (the verbatim `yarn build` form returned 14/14 **cached** and was re-taken forced — disclosed in § Gates) |
| 5 | frontend typecheck | `yarn workspace @openvaa/frontend check` | **0** | 2,684 files · 0 errors · 0 warnings |
| 6 | repo typecheck | `TURBO_FORCE=true npx turbo run typecheck` | **0** | 22/22 · `0 cached, 22 total` · `grep -c 'error TS'` → 0 |
| 7 | **E2E, last** | `yarn test:e2e` | **0** | **135 passed · 0 failed · 0 flaky · 0 skipped · 0 did-not-run** |

All seven at **one HEAD, `47ee50054`**, asserted unchanged after gate 7 and after row `Z`.

---

## Completeness

**The register asserts 37 rows about itself, and here is the arithmetic that checks it rather than
asks to be trusted** — the same shape 143 used at its `:984-992`.

| Term | Value |
|---|---|
| OLD/NEW pairs | 14 |
| × halves per pair | × 2 |
| = measured halves | **28** |
| + non-pair rows (`L`, `NC`, `A`, `AF`, `NA`, `F`, `P`, `C`, `Z`) | + **9** |
| **= total register rows** | **37** |

**Schema choice, locked and restated:** the **half-row** schema. `144-RESEARCH.md` R8.3 offers a
pair-per-row alternative giving 23 rows; this ledger chose the half-row form at creation and asserts
**37** here, against the register's **actual** row count measured at the closing HEAD by the same
anchored pattern the plans' `<verify>` blocks use:

```
grep -cE '^\| (A|T1-OLD|T1-NEW|T2-OLD|T2-NEW|G-OLD|G-NEW|X-OLD|X-NEW|R1-OLD|R1-NEW|R2-OLD|R2-NEW|Z1-OLD|Z1-NEW|Z2-OLD|Z2-NEW|Z3-OLD|Z3-NEW|Z4-OLD|Z4-NEW|DRV-OLD|DRV-NEW|K-OLD|K-NEW|DENY-OLD|DENY-NEW|V-OLD|V-NEW|L|NC|AF|NA|F|P|C|Z) \|' 144-NEGATIVE-CONTROL-LEDGER.md
```

→ **37**. Asserted, not assumed.

**Every row is filled.** 37 rows × 5 measurement cells = **185** placeholder occurrences at creation;
the running assertion was 185 → 100 at the close of `144-01` → **0** at the close of `144-07`. The
row-scoped placeholder count over all 37 rows is **0**.

**And the two words this register forbids are absent from every cell:**

| Assertion | Measured |
|---|---|
| Register rows containing the borrowed-observation word (the past participle of "to cite") | **0** |
| Register rows containing turbo's cache-replay verdict string (the present participle of "to replay") | **0** |
| Gate blocks recording a cache replay as a measurement | **0** — gate 4's cached first run is disclosed as VOID and its forced re-take is what is recorded |

Both forbidden words appear in this document only in the header clause that names them in order to
forbid them, and in the § Gates disclosure that explains why gate 4 was re-taken.

## Record targets

Six records were wrong or stale when this phase opened. Each is corrected **in place**, never by
addendum — an addendum alone lets a stale figure propagate false premises into later phases. Per
target: the file, the location **re-measured at the closing HEAD `47ee50054`** (every line number in
the source documents had moved, and two documents in this phase disagreed with each other about
`supabaseAdminClient.ts`), what was wrong, what it now says, and **the commit or measurement that
makes the correction true**. Truth #8 requires that last column: a correction that cannot say why it
is true is a second unverifiable record replacing a first.

### R-1 — `.planning/ROADMAP.md` § Phase 144

| | |
|---|---|
| **Measured location** | criterion 1 at `:667` · criterion 3 at `:669` · criterion 5 at `:671` · the Plans line at `:673` · the seven plan entries at `:677-683` |
| **What was wrong** | (a) Criterion 1's exemplar — `_elections` on a `questions` row — is **not illegal** and has not been since 2026-06-01. (b) Criterion 3 said the corpus was six. (c) Criterion 5 named a template file that has not existed since Phase 93. (d) The Plans line read `6/7 plans executed` and plan 07's entry was unticked |
| **What it now says** | (a) Re-scoped per D-01 to the live exemplars — `_constituencies` on an `elections` row (primary) and `_elections` on a **`candidates`** row (secondary) — keeping the proof shape in full, and stating explicitly that `questions._elections` **stays legal and that a test asserts it stays legal**. (b) `4 blind + 3 already-failable + 3 unfailable-by-construction = 10`, with the blind four named as the number the criterion turns on. (c) `default`, `e2e/base` and every `e2e/perm/*`, plus the fallout stated as an **empty table shipped as a discharge** with its four numbers. (d) `7 plans, all 7 executed`; all seven entries ticked |
| **What makes it true** | **(a)** `4aeae0ace`, cited by hash **and** by its real subject per D-01a — ``feat(data): promote `required` to first-class Question field + wire consumers`` — which `git log -1 --format=%s 4aeae0ace` returns verbatim. ⚠ **That subject does not mention dev-seed at all**, which is why the citation also states what the commit did to *this* file: it factored the `_elections` sentinel resolver `electionResolve` out of the `question_categories` block and called it for **both** tables, and its own body says so — *"dev-seed: extend election_ids JSONB scoping to questions (not just categories) via shared `_elections` sentinel resolver."* The motivating todo was filed 2026-05-31, **one day before**. Legality is not merely asserted: ledger row `L` measures it. **(b)** `144-05`'s census, recorded in § Final counts. **(c)** `d783e81fc` — *`refactor(93-02): move baseV1→e2e/base, retire e2e template, relocate perms to e2e/perm`*, 2026-06-03. **This is the one place the retired identifier is written out**; the ROADMAP names the commit by hash instead, so the stale name survives exactly once, in the record that explains why it is stale. **(d)** The seven `*-SUMMARY.md` files on disk |

### R-2 — `.planning/REQUIREMENTS.md`, ASSERT-04's wording

| | |
|---|---|
| **Measured location** | `:57` |
| **What was wrong** | *"so the six \"accepts field X\" tests fail…"* |
| **What it now says** | *"the **four structurally-blind** \"accepts field X\" tests"*, with the correction stated **in place** as a correction — the bullet says the requirement previously read six and that six is wrong twice over: wrong as a count of blind sites (**4**) and wrong as a count of sites in this shape (**10**) — and the full `4 + 3 + 3` composition given |
| **What makes it true** | `144-05`'s re-derivation at execution HEAD, by enumerating every site in the two D-05 spec files and classifying each **by measurement** rather than by reading, with a ledger row behind each of the four (`Z1-NEW` … `Z4-NEW`), one behind the already-failable class (`AF`, measured on the **pre-phase** blob so the claim is non-circular) and one behind the unfailable class (`NA`, whose unfailability was *observed* — an injection that reddened 5 of 7 cases in its own file left it green) |

### R-3 — `.planning/REQUIREMENTS.md`, the status rows and the rollup row

| | |
|---|---|
| **Measured location** | status rows at `:149` (ASSERT-04), `:157` (TMPL-01), `:158` (TMPL-02) · the Phase 144 rollup row at `:179` · the rollup table header at `:169` |
| **What was wrong** | All three status rows read `Pending` |
| **What it now says** | All three read `Complete`, and each requirement bullet carries an evidence clause in the ASSERT-08/ASSERT-09 house shape — counts first, then what was measured and how (naming row `K` as the inverted pair and row `X` as the self-control pair), then the seven gates with commands, exit codes and numbers, then the residue named rather than closed |
| **What makes it true** | The seven gates in § Gates, all at HEAD `47ee50054`, E2E last at 135/0/0/0/0. **The checkboxes were flipped after the gates ran and after the clauses existed**, per `142.1-02`'s deliberate revert of a premature tick |
| ⚠ **A finding, reported rather than obeyed** | `144-07-PLAN.md`'s acceptance criteria require *"the Phase 144 rollup row's plan count is 7"*. **That rests on a misreading of the table.** The header at `:169` is `\| Phase \| Requirements \| Count \|` — the third column counts the **requirements listed in column 2**, not plans. Every neighbouring row confirms it: Phase 141 lists 5 requirements and reads 5; Phase 143 lists 2 and reads 2 while having had 3 plans. Phase 144 lists **TMPL-01, TMPL-02, ASSERT-04 — three requirements — so `3` is CORRECT and was left alone.** Writing 7 there would have corrupted a column to satisfy a criterion. Reported here, per the phase-wide discipline that a disagreement is a finding rather than something to reconcile silently |

### R-4 — `.planning/audits/2026-08-11-fake-guard-sweep.md`, the F13 row and section

| | |
|---|---|
| **Measured location** | summary-table row at `:46` · F13 section heading at `:665` · the remediation-status pointer at `:95-97` |
| **What was wrong** | Both the summary row and the section heading said the corpus was 6; the remediation pointer said *"F13 is ASSERT-04 (Phase 144, open)"* |
| **What it now says** | Both amended **in place** to **4** blind, with the `4 + 3 + 3 = 10` census table inserted directly beneath the section's own file list as a marked amendment, stating that six is wrong twice over and that the sweep's own line numbers have since moved. The summary row's status now reads `Blind — REMEDIATED, Phase 144`; the pointer reads *closed by Phase 144 on 2026-08-23* with the ledger path. The amendment also records a reach gap the sweep could not see: `resolveTemplate`'s built-in branch never reached the validator at any HEAD, so F13's blindness was, for the built-in path, not merely a test-quality problem |
| **What makes it true** | `144-05`'s census and rows `Z1-NEW` … `Z4-NEW`, `AF`, `NA`, `V-OLD` / `V-NEW`. **Amended in place rather than appended to**, because that is standing feedback on this project and the reason this correction is a rewrite: an addendum leaves the stale figure readable as current |

### R-5 — `.planning/todos/…/2026-05-31-edit-the-seed-utility-to-use-strict-typing-for-the-templates.md`

| | |
|---|---|
| **Measured location** | moved from `pending/` to **`completed/`**; corrections in its frontmatter `files:` list and in its `## Problem` and `Touch points` sections |
| **What was wrong** | Three stale elements: it named `templates/baseV1.ts`; it cited `supabaseAdminClient.ts:126` and `:365`; and its motivating premise — that `questions._elections` is unresolved — had been false since the day after it was filed |
| **What it now says** | All three corrected **in place**, each with the correction annotated rather than silently rewritten, plus a `## Corrections applied on retirement` header section and a `## How Phase 144 satisfied the substance` section showing both prongs shipped with two-run controls |
| **What makes it true** | The template move: `d783e81fc`. **The line citations: re-measured at the closing HEAD, not copied** — in a 746-line file `bulkImport` is at **:122** (filed as `:126`) and `linkJoinTables` at **:380** (filed as `:365`). The premise: `4aeae0ace`, cited by hash and real subject per D-01a, with ledger row `L` proving the pair is legal today |

### R-6 — `packages/dev-seed/src/cli/resolve-template.ts`'s doc comment

| | |
|---|---|
| **Measured location** | the annotation at `:19-29`; the validating return at `:75`; the D-07 call-site comment at `:71` |
| **What was wrong** | The comment asserted that every resolved template runs through validation before return — **false at every HEAD from the day the built-in branch was added until this phase** |
| **What it now says** | The sentence is retained and immediately annotated with a ⚠ block saying it *became* true in Phase 144 (D-07), that it was FALSE before, that the built-in lookup ended in a bare `return builtIn;` so `default`, `e2e/base` and every `perm-*` bypassed the zod layer at seed time, and that ledger rows `V-OLD` / `V-NEW` hold the before and after |
| **What makes it true** | **Landed by `144-05` in `f0228e55e`, not by this plan — this plan VERIFIES it and does not re-do it.** Verified at the closing HEAD: `grep -cE '^\s*return builtIn;'` → **0** and `grep -c 'validateTemplate(builtIn)'` → **1**. The annotation's own point is the general one: *a record made true without saying so is how records come to disagree* |

---

## Post-review fix pass — a SECOND gate set at a SECOND HEAD

**Nothing above this line is amended.** § Gates records seven gates green at HEAD `47ee50054`,
and that record was true when it was taken. This section exists because the phase did not end
there: a code review ran after `144-07` closed, found **1 blocker + 8 warnings**, all nine were
fixed on the user's explicit instruction, and those nine commits moved HEAD past `47ee50054`.
Truth #9's "seven gates green at one HEAD" is therefore re-discharged here, at the new HEAD,
rather than left resting on a HEAD the tree no longer sits at.

**Review:** `144-REVIEW.md` (commit `44a14819a`), status `issues_found`, 34 files at standard depth.

**The blocker, in one line.** `derivePermittedKeys` admits every camel form of every column and
`COLUMN_MAP` carries `entity_type: 'entityType'`, so `entityType` sat in the PERMITTED set while
`DENIED_BY_TABLE` listed only the snake literal — `bulkImport` resolved it straight back to
`entity_type` and the RPC's `skip_columns` discarded it. Exit 0, column unset: verbatim the failure
mode the deny-list's own docblock says the deny-list exists to eliminate. The negative-control
fixture used only the snake spelling, so **the control was structurally unable to fire on it** —
the same shape `144-04` caught one layer up, and the reason this pass was run rather than deferred.

| ID | Fix commit | Regression test (each verified RED before its fix) |
|----|-----------|-----------------------------------------------------|
| CR-01 | `6fe28f9c3` | camel `entityType` throws the DENY message on all 3 declaring tables; 4th fixture `negctl-questions-entity-type-camel.ts` drives **both** spellings through the shipped guard |
| WR-01 | `3c8a6b60e` | `@ts-expect-error` on `answersByExternalId` in `QuestionsFixedRow`; reverting the type arm → `TS2578` |
| WR-02 | `fe04431ca` | two-case control — camel writes the answers JSONB, snake yields zero queries and zero updates |
| WR-03 | `df4bec7e6` | new `ciTypecheckGate.test.ts` — step order, unforced `run:`, chain link intact; 2/4 red pre-fix |
| WR-04 | `21e544597` | new `linkSentinelRules.type-test.ts` (2 `@ts-expect-error` + 2 legality) + 5 runtime cases |
| WR-05 | `82e3b8b13` | resolver always returns a string; an inherited key reaches the loud throw |
| WR-06 | `82e3b8b13` | 4 inherited names against the **real** registry |
| WR-07 | `04d6ca456` | smuggle performed on the memoized instance; `has`/`size`/spread asserted unmoved |
| WR-08 | `e06404a0f` | refused on all 12 guarded collections; withholding shown targeted |

**No finding was a false positive** — each was reproduced against the shipped code before being touched.

**Two of the review's own proposed fixes were insufficient, and were corrected rather than followed.**
(1) WR-08's suggested `AUTHORING_KEYS = ['external_id']` does **not** close the hole: `COLUMN_MAP`
maps `external_id → externalId`, so source (1)'s `camelFormsFor` re-admits the spelling on every
table carrying the column — measured, `permittedKeys('elections').has('externalId')` stayed `true`
under the suggested narrowing alone. The narrowing had to land in `camelFormsFor` via a documented
`CAMEL_FORMS_NOT_ADMITTED`. (2) WR-04's suggested per-target `parentTable` is not implementable:
each `jsonb` rule covers **two** collections, which one parent table cannot express. The guarantee
was obtained instead by pairing at the *rule* level and adding a top-level `kind` to `LinkPlanEntry`
— required because TypeScript does not narrow a union from a nested discriminant (measured:
`switch (u.target.kind)` leaves `u.collection` at full width, `TS2345`). Both `as` casts are gone.

**No guard was weakened; every change is a narrowing.** WR-02 was closed by deleting a dead read,
not by widening Pass 0 to admit `answers_by_external_id` — a spelling that would have passed the
guard and then been rejected by `bulk_import` as a nonexistent column.

**False-positive budget re-measured, not assumed:** 30 templates / 1,481 rows / 11,125 key
occurrences / **0** offences, reproducing `144-04`'s figures exactly. `externalId` and `entityType`
occur as top-level row keys **0** times across the corpus. The ESM cycle stayed broken —
`collectionNames.ts` still imports nothing local.

### The second gate set — all seven at HEAD `df4bec7e6`

| # | Gate | Command | Exit | Result |
|---|------|---------|------|--------|
| 1 | unit | `TURBO_FORCE=true yarn test:unit` | **0** | 25/25 tasks · **0 cached, 25 total** |
| 2 | lint | `TURBO_FORCE=true yarn lint:check` | **0** | 11/11 lint · 22/22 chained typecheck · **0 cached** |
| 3 | format | `yarn format:check` | **0** | all matched files use Prettier style |
| 4 | build | `TURBO_FORCE=true yarn build` | **0** | 14/14 · **0 cached, 14 total** |
| 5 | frontend | `yarn workspace @openvaa/frontend check` | **0** | 2,684 files · 0 errors · 0 warnings |
| 6 | typecheck | `TURBO_FORCE=true npx turbo run typecheck` | **0** | 22/22 · 0 cached · `grep -c 'error TS'` → **0** |
| 7 | E2E | `yarn test:e2e` | **0** | **135 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run** (10.6m) |

Every gate forced; not one is a cache replay. Gate 1's unforced form returned `14 cached, 25 total`
and was re-taken — the same partial-replay trap `144-07` disclosed for gate 4, hit again here on a
different gate, which is why every entry above is forced.

⚠ **One ordering difference from § Gates, stated rather than glossed.** `144-07`'s set ran E2E
**last**; this set ran E2E **before** the gate-1/2/3/6 re-takes. The hazard that "E2E last" exists to
avoid is `yarn test:unit` repopulating the live local DB behind a `db:reset` (RES — see § Gates).
It did not apply: gate 7 ran on a freshly `db:reset` database and completed before any unit run.
The consequence is real but forward-facing — **the local DB is left repopulated by the integration
test**, so the next E2E run needs its own `yarn db:reset` first. All seven gates are green at one
HEAD; the *ordering* property of Truth #9 is discharged in the weaker form just described, and this
sentence is here so no later reader mistakes it for the stronger one.

**One thing deliberately left open.** `importAnswers` and `planLinks` still read
`row.externalId ?? row.external_id` for the entity/parent id. After WR-08 the left-hand branches are
unreachable through `Writer.write` — the same shape as WR-02 — but unlike `answers_by_external_id`,
`externalId` **is** handled correctly downstream (`bulkImport` renames it), the reads predate this
phase, and they were not what the review flagged. Left as a follow-up decision rather than a silent
edit.

---
*Phase: 144-seed-template-strict-typing-unknown-prop-guard*
*Opened: 2026-08-23 at HEAD `d2ffc3904`*
