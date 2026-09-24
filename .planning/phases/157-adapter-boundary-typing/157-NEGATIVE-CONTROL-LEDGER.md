# Phase 157 — Negative-Control Ledger: the adapter-boundary guard observed blind, then observed catching

**Seven rows, one apparatus, one machine — and not one borrowed observation anywhere in the register.**

> **REGISTER STATUS at `157-08`: EXTENDED BY FIVE ROWS FOR A SECOND, INDEPENDENT GUARD.** `157-08`
> did not reopen, alter or re-measure any of the ten rows below. It appended rows `CAST-OLD`, `CAST-NEW`,
> `CAST-RESTORE`, `CAST-ALLOWED` and `CAST-VACUITY` in § The cast guard — five rows appended by `157-08`,
> all measuring `scripts/assert-adapter-casts.mjs` (requirement **REVIEW-ADP-01**) rather than the ESLint
> boundary rule rows `A`–`H` measure (**REVIEW-ADP-06**). **The two guards share the `lint:check` chain and
> nothing else, so no cell of either set is evidence about the other.** The corpus is therefore **15 rows**.
>
> **REGISTER STATUS at `157-16`: CLOSED, AND EXTENDED BY THREE ROWS.** `157-16` did not reopen, alter or
> re-measure any of the seven rows below; it appended rows `F` (the allowlist shrink, measured by
> `eslint --print-config`), `G` (the RED/GREEN pair proving the nine new self-test assertions non-vacuous)
> and `H` (the gate at `157-16` close), all in § The allowlist as it ships from `157-16`. The corpus is
> therefore **10 rows**, not 7, and the "exactly 7 rows" field below is `157-14`'s framing at ledger
> creation rather than a current count.
>
> **REGISTER STATUS: CLOSED.** All seven rows are measured. `157-14` took the two blind halves while the
> guard did not exist; `157-15` installed the guard and took the two catch halves, the must-NOT-fire
> control, the restoration and the vitest pair. **Zero `pending` cells remain.** The paragraph below is
> `157-14`'s framing, preserved verbatim because it states the condition under which the OLD halves were
> taken — it is **not** a description of the tree today. As of `157-15`, the guard **exists**: see
> § The shape `157-15` picked and rows `A-NEW`, `B-NEW`, `C` and `E`.

Written at ledger creation, and true then: Phase 157's adapter-boundary guard **does not exist yet**.
There is therefore no recorded observation
anywhere in this repository of a Supabase leak passing `yarn lint:check` in a guarded route or
component, because no gate has ever been asked the question. The blind half has to be **measured here**,
while `apps/frontend/eslint.config.mjs` is still untouched, then proven undone. A row whose run did not
execute keeps its `pending` cells and carries **no** outcome — never a confirmed one — because a
measurement that did not run counts as a failure, not a pass (`CLAUDE.md` § E2E Hard Rule, generalised;
`139-VERDICTS.md:5-9`).

- **Phase:** 157 (adapter-boundary-typing)
- **Requirement:** **REVIEW-ADP-06**
- **Opened by:** `157-14-PLAN.md` (wave 1). **Every row was created there, before the phase's first
  injection.** The OLD-half cells (`A-OLD`, `B-OLD`) were filled by that plan. **Closed by
  `157-15-PLAN.md` (wave 2)**, which filled the NEW-half cells (`A-NEW`, `B-NEW`) and rows `C`, `D` and
  `E` after installing the guard — 31 cells, none of them inferred from a neighbour.
- **Corpus:** exactly **7 rows** — 2 injection pairs (`A`, `B`; **4 measured halves**), 1 must-NOT-fire
  control (`C`, the allowed adapter locus), 1 restore row (`D`), 1 vitest pair (`E`).
- **Protocol source:** `139-VERDICTS.md` § 3.1 HYGIENE-LOOP, reused via `142.1-01-PLAN.md` (D-02) and
  `143-01-PLAN.md`, and adapted here for a **lint** instrument rather than a vitest one.
  `157-RESEARCH.md` § F.8 specifies this ledger's five-row control matrix, including row `C`.
- **Baseline for OLD halves:** **none inherited, and none inheritable.** Phase 143's ledger could not
  borrow from 139 either, but it at least had a *prior* guard whose scope had changed. This one has no
  predecessor at all: the adapter-boundary guard is new in 157, so **both** halves of every pair must be
  measured inside this phase. **The word for a borrowed observation is not a legal value in any cell of
  this register.** Every row carries its own command, its own exit code, its own log path and the HEAD
  its own half was taken at.
- **HEAD at ledger creation:** `aa06cbaf5` — branch `integration/ship-12-squash`. **OLD and NEW rows
  legitimately carry different HEADs**, because the config change (`157-15`) lands *between* the two
  halves — the 142.1 D-20 precedent, reused by 143. Each row records the HEAD its own half was measured
  at.
- **Machine:** developer Mac, host Node, runs issued from the repository root
  (`/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd`, a **linked git worktree**).
  macOS 26.5.1 (build 25F80) arm64 / Darwin 25.5.0 / Node v24.14.1 / ESLint 9.39.2. **No container:**
  this ledger records lint and vitest exit codes only, never a visual baseline, so the milestone's
  container rule for baselines does not apply.
- **Resolved `$TMPDIR`:** `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/` — so every
  `${TMPDIR:-/tmp}/gsd-157/…` log reference below resolves to
  `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-157/…`. Recorded for the same reason 139, 142.1
  and 143 recorded theirs: **a log path that cannot be resolved later is not evidence.**
- **Restoration target (the blob hash), pre-change:** `git hash-object apps/frontend/eslint.config.mjs`
  → **`10bcf84c37bb69497ad139c74f1e84747e250bee`**, measured at ledger creation at HEAD `aa06cbaf5`.
  **This plan (`157-14`) does not modify that file at all**, so the value above is both its pre-change
  target and its value at this plan's close. `157-15` changes it; rows measured from `157-15` Task 1
  onward assert against the post-change value below, never against this one.
- **Post-change restoration target (the blob hash, filled by `157-15`):**
  **`4afd03a5af9a86271a1c0477781fcf12aeafccff`**, measured at HEAD `c02448bba` — the `157-15` Task 1
  commit that installs the guard. It **differs** from `10bcf84c…` by construction; that difference is
  the guard. Asserting the pre-change hash after `157-15` installs the guard would fail for the correct
  reason and prove nothing. Every `157-15` row asserts against this value, never against `10bcf84c…`.
- **Pre-existing-warning baseline:** the repository lint is **error-free but not warning-free**, so
  "clean" needs a defined string and the `Errors` column counts **errors**, never "problems". Measured
  at HEAD `aa06cbaf5` with `TURBO_FORCE=true yarn lint:check` (exit `0`,
  `${TMPDIR:-/tmp}/gsd-157/baseline-clean.log`), three lint surfaces carry standing warnings:
  - `@openvaa/frontend:lint` → **`✖ 1 problem (0 errors, 1 warning)`** — `unused-imports/no-unused-vars`
    on `'question'` at `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts:19:9`.
    **This is the surface rows `A` and `B` read.** A clean frontend run therefore reads exactly
    `0 errors (1 pre-existing warning)`.
  - `@openvaa/dev-seed:lint` → `✖ 15 problems (0 errors, 15 warnings)`, all `unused-imports/no-unused-vars`.
  - the root `tests` ESLint pass → `✖ 2 problems (0 errors, 2 warnings)`
    (`playwright/prefer-to-have-length`; one unused `eslint-disable` directive).
  - Note against 143: that ledger recorded the frontend warning at
    `candidateContext.svelte.test.ts:39`. It now sits at `:19`. The file moved between phases; **this
    ledger records the line it measured, not the line 143 measured.**
- **Cache-busting:** `turbo run lint` is cached, and a replayed cache entry is not a measurement. Every
  run in this register is issued as **`TURBO_FORCE=true yarn lint:check`**, and each log is checked for
  the `cache bypass, force executing` marker on the `@openvaa/frontend:lint` task. The D-02a precedent.
- **Decisions discharged by this ledger:** D-F4 decision C (the flat-config REPLACE-vs-MERGE question,
  answered by the probe in § Probe below rather than by reasoning), plus the `157-RESEARCH.md`
  Assumptions Log item **A3**, which this ledger closes. `157-15` additionally discharges decision A (the
  explicit annotated allowlist, recorded in § The allowlist as it ships) and closes threats `T-157-19`
  (row `E`), `T-157-36` (rows `A-NEW` and `B-NEW`), `T-157-37` (row `C`), `T-157-38` (the four standing
  regressions plus the `--print-config` measurement) and `T-157-39` (the three consecutive suite runs).
- **Precedent followed:** `143-NEGATIVE-CONTROL-LEDGER.md` is this ledger's template for naming, the
  header field set, the rows-first ordering rule and the row schema;
  `142.1-NEGATIVE-CONTROL-LEDGER.md` and `141-ASSERT10-LEDGER.md` sit behind it in that chain.

---

## Why this ledger exists — and what it does NOT claim

The standing milestone rule, quoted from `143-NEGATIVE-CONTROL-LEDGER.md` quoting `REQUIREMENTS.md:7-13`:

> **prove the guard fails before claiming it guards** — negative control run twice, once against the old
> assertion to demonstrate blindness, once against the new one to demonstrate the catch.

A blindness measurement taken *after* the guard is installed is not a measurement of blindness. That is
the whole reason `157-14` exists as a separate plan ahead of `157-15`: the OLD halves can only be taken
while `apps/frontend/eslint.config.mjs` still lacks the guard, and once `157-15` lands they can never be
taken again.

**What this ledger does NOT claim.** It does not claim the eight known leaking route files are fixed —
they are not; `157-RESEARCH.md` § F.6 scores them 3 easy / 2 medium / 3 hard-or-permanent and § F.7
recommends shipping them as an annotated allowlist that Phase 158 shrinks. Rows `A` and `B` deliberately
inject a **ninth** site, into files that are **not** on that allowlist, because the question this ledger
answers is whether the gate catches a *new* leak — not whether it retroactively condemns the eight.

---

## Probe — the flat-config REPLACE question, measured

`157-RESEARCH.md` § F.2 flags exactly one claim in the entire research document as reasoned rather than
measured, and marks it `[ASSUMED]`:

> **⚠ This is the one point where I am reasoning rather than measuring.** `[ASSUMED — ESLint flat-config
> merge semantics across two matching config objects for the same rule: the LAST matching config's
> options win entirely for that rule. … I did not probe the two-overlapping-blocks case this session.]`
> **The planner must probe it** — it is a 5-minute `lintText` experiment using the same apparatus as F.4,
> and getting it wrong silently deletes a ban.

That probe was run here. It is **read-only**: it uses an inline `overrideConfig` with
`overrideConfigFile: true`, so the repository's own `eslint.config.mjs` is neither loaded nor modified,
and the script lived in the scratch directory and was deleted afterwards.

- **Apparatus:** ESLint **9.39.2** via `new ESLint({ overrideConfigFile: true, overrideConfig: [...] })`
  + `eslint.lintText(source, { filePath })`, `@typescript-eslint/parser`, virtual
  `filePath: apps/frontend/src/routes/__probe__/probe.ts` (never written to disk).
- **Command:** `node <scratch>/probe-flat-config-merge.mjs` — **exit code `0`**, at HEAD `aa06cbaf5`.

### Experiment 1 — `no-restricted-syntax`

**Config object 1 (BROAD)**

```js
{
  files: ['**/*.ts'],
  rules: {
    'no-restricted-syntax': ['error', { selector: 'TSEnumDeclaration', message: 'BROAD: enum banned' }]
  }
}
```

**Config object 2 (NARROW — a strict subset of BROAD's file set)**

```js
{
  files: ['**/routes/**/*.ts'],
  rules: {
    'no-restricted-syntax': [
      'error',
      { selector: "MemberExpression[property.name='supabase']", message: 'NARROW: supabase member banned' }
    ]
  }
}
```

**Fixture — violates BOTH entries**

```ts
enum Color { Red, Green }
export async function POST({ locals }) {
  const { data } = await locals.supabase.from('elections').select('id');
  return new Response(JSON.stringify({ data, Color }));
}
```

**Full message list, verbatim**

| Run | Configs applied | Messages |
|-----|-----------------|----------|
| control 1 | BROAD only | `no-restricted-syntax@1:1 BROAD: enum banned` (1 message) |
| control 2 | NARROW only | `no-restricted-syntax@3:26 NARROW: supabase member banned` (1 message) |
| **the question** | **BROAD then NARROW** | **`no-restricted-syntax@3:26 NARROW: supabase member banned` (1 message)** |

Both controls fired, so the single message in the third run is a **deletion**, not a non-firing fixture.

### Experiment 2 — `no-restricted-imports`

**Config object 1 (BROAD)** — `files: ['**/*.ts']`, `patterns: [{ regex: '^(\\.\\./){2,}lib(/|$)', message: 'BROAD: deep relative lib banned' }]`
**Config object 2 (NARROW)** — `files: ['**/routes/**/*.ts']`, `patterns: [{ regex: '^@supabase/', message: 'NARROW: @supabase/* banned' }]`

**Fixture — violates BOTH entries**

```ts
import { createBrowserClient } from '@supabase/ssr';
import { thing } from '../../lib/thing';

export const x = [createBrowserClient, thing];
```

**Full message list, verbatim**

| Run | Configs applied | Messages |
|-----|-----------------|----------|
| control 1 | BROAD only | `no-restricted-imports@2:1 '../../lib/thing' import is restricted from being used by a pattern. BROAD: deep relative lib banned` (1 message) |
| control 2 | NARROW only | `no-restricted-imports@1:1 '@supabase/ssr' import is restricted from being used by a pattern. NARROW: @supabase/* banned` (1 message) |
| **the question** | **BROAD then NARROW** | **`no-restricted-imports@1:1 '@supabase/ssr' import is restricted from being used by a pattern. NARROW: @supabase/* banned` (1 message)** |

### Experiment 3 — is the replacement scoped to the overlapping files only?

Same two config objects, same fixture, two different virtual `filePath`s:

| `filePath` | Matched by | Messages |
|------------|-----------|----------|
| `apps/frontend/src/routes/__probe__/probe.ts` | BROAD **and** NARROW | `no-restricted-syntax@3:26 NARROW: supabase member banned` |
| `apps/frontend/src/lib/__probe__/probe.ts` | BROAD only | `no-restricted-syntax@1:1 BROAD: enum banned` |

So the deletion is **per-file**, not global: BROAD's entry survives for files NARROW does not match, and
vanishes for files it does.

### PROBE VERDICT

**PROBE VERDICT [`no-restricted-syntax`]: REPLACE.** When two flat-config objects both match a file and
both set `no-restricted-syntax`, the later object's options array **replaces** the earlier one's
entirely. The earlier entry produces **zero** messages for that file.

**PROBE VERDICT [`no-restricted-imports`]: REPLACE.** Identical behaviour; the later object's `patterns`
array replaces the earlier one's entirely.

**PROBE VERDICT [scope]: the replacement is per-file, not global.** A file matched by only the broad
object keeps the broad object's entries.

**What this means for `157-15`'s guard shape — and the part of the research it disproves.** § F.2's
recommendation was to extend the existing block at `apps/frontend/eslint.config.mjs:89-133` for the
import bans and add **one narrower second block** for the member-expression rules, and it reasoned that
the second block *"need not duplicate #2/#4 if its glob is a strict subset that the first block also
covers — flat-config replacement is per-rule-per-matching-config, and both configs apply."* **That
reasoning is wrong, and experiment 1 is the direct counter-example:** NARROW's glob *was* a strict subset
of BROAD's, both configs *did* apply, and BROAD's entry was still deleted for the overlapping files.

Therefore, if `157-15` adds a second block whose `files` overlap `src/**`, that block **MUST re-include
all four inherited entries** enumerated in § F.2 — the shared-config deep-relative-`lib` `patterns` entry
and `TSEnumDeclaration` selector, **and** the frontend block's `svelte/store` `paths` entry and
`ImportExpression` selector — byte-identically, for both rules it touches. Omitting any of them deletes
that ban for every file the narrower block matches **while producing zero errors**, which is precisely
the silent failure `apps/frontend/eslint.config.mjs:85-88` and `:110-116` already warn about in-file, and
which `eslint-store-guard.test.ts`'s standing regression case at `:180-188` exists to catch. The one-block
shape (extend `:89-133` only) avoids the trap entirely at the cost of scoping the member-expression
selector to all of `src/**`, which would fire inside the adapter itself.

`157-15` must cite this verdict when it picks between the one-block and two-block shapes.

### The shape `157-15` picked, and the measurement proving no inherited entry was dropped

**Shape: TWO blocks, and the new block carries BOTH rules, with all four inherited entries re-included
byte-identically.** The one-block shape was rejected on the measured ground that
`MemberExpression[property.name='supabase']` fires on `this.supabase` inside the adapter — see row `C`.

The plan's literal instruction was to put the *import* half into the existing `src/**` block and only
the *access* half into a narrower second block. **That is not implementable and `157-15` deviated from
it**, for a measured reason: the existing block spans all of `src/**`, which **includes the adapter and
the client factories**, and those files import `@supabase/ssr` and `@supabase/supabase-js` directly
(`grep -rln "from '@supabase/" apps/frontend/src` → 10 files, 8 of them inside the boundary). Adding
`^@supabase/` to the broad block would therefore have turned `yarn lint:check` red on the adapter itself
— exactly the denial-of-service the threat register records as `T-157-37`. **Both** halves consequently
live in the narrower block, which is scoped `files: ['src/**/*.{ts,js,mjs,cjs,svelte}']` minus
`ignores: ADAPTER_BOUNDARY_ALLOWLIST`. Because that block sets both rules, the REPLACE verdict applies to
both, and **all four** inherited entries are re-included there byte-identically.

**The measurement.** Enumerated with `npx eslint --print-config <file>` — ESLint's own resolved
configuration, not a reading of the source — at HEAD `c02448bba`:

| File | Matched by | `no-restricted-imports` `paths` | `no-restricted-imports` `patterns` | `no-restricted-syntax` selectors |
|------|-----------|--------------------------------|-----------------------------------|----------------------------------|
| `src/routes/admin/+layout.server.ts` (**guarded** — matched by BOTH blocks) | broad **and** narrow | `svelte/store` ✔ | `^(\\.\\./){2,}lib(/\|$)` ✔, `^@supabase/`, `^\\$lib/(supabase\|api/adapters)(/\|$)` | `TSEnumDeclaration` ✔, `ImportExpression[source.value='svelte/store']` ✔, `MemberExpression[property.name='supabase']`, `ObjectPattern > Property[key.name='supabase']` |
| `src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (**allowlisted**) | broad only | `svelte/store` ✔ | `^(\\.\\./){2,}lib(/\|$)` ✔ | `TSEnumDeclaration` ✔, `ImportExpression[source.value='svelte/store']` ✔ |

The four ✔ entries are the inherited ones. **All four survive for the file matched by both globs** — the
REPLACE trap is closed, and closed by measurement rather than by reading the config. The allowlisted file
keeps the inherited four and gains none of the guard's four, which is row `C`'s result stated as
configuration rather than as an exit code.

All ten Group-2 allowlist globs were separately confirmed to match their files (2 selectors instead of 4
in the resolved config), including the two whose path text contains glob-adjacent characters —
`routes/candidate/(protected)/+layout.server.ts` and the `+page.server.ts` / `+layout.server.ts` /
`+server.ts` forms. A mistyped allowlist path would have shown 4 selectors and gone unnoticed until the
gate turned red on an untouched file.

---

## The rows

**Rows-first ordering.** Every row below was created — with its expected outcome stated and its measured
cells empty — **before the first injection of this phase**, in `157-14` Task 2, and committed in that
state. The Phase 143 rule: a row cannot be invented after the fact to fit an observation.

### Injection targets, named and hashed before any injection

Named here rather than chosen at measurement time, so `157-14` and `157-15` inject into the **same**
files rather than each picking its own.

| Row | Target file | Why this file | Pre-injection `git hash-object` (at HEAD `aa06cbaf5`) |
|-----|-------------|---------------|------------------------------------------------------|
| `A` | `apps/frontend/src/routes/admin/+layout.server.ts` | A **guarded, non-allowlisted** route server file. It is **not** one of the eight known leaking files (`157-RESEARCH.md` Pitfall 2) and **not** on the recommended five-entry allowlist (§ F.3), so a Supabase call here is a genuine **ninth** site. Measured clean: `grep -n 'supabase'` returns nothing at code level (the word appears only in a doc comment as "Supabase"), and its one `locals` member access is `locals.safeGetSession()` — so the selector under test cannot fire on the untouched file, and the row measures the injected line and nothing else. | `02bf748322c834fe553f58f01aaf019473e7c2ec` |
| `B` | `apps/frontend/src/lib/components/input/shared.ts` | Under `lib/components/`, the **measured zero-hit locus** (§ F.3: `grep -rl 'supabase' apps/frontend/src/lib` returns 0 files under `lib/components` and `lib/dynamic-components`). A plain constants module with no imports at all, so an injected import is unambiguous. | `c1b2d1e99955faa73dd6aaf18d07403fac6ed288` |

**Not a target, and must not become one:** `apps/frontend/eslint.config.mjs`
(`10bcf84c37bb69497ad139c74f1e84747e250bee`). `157-14` must not modify it — that is what makes the OLD
halves evidence of blindness rather than of anything else.

### Row schema

`Row` · `Half` · `Injection` · `Command` · `Exit` · `Errors` · `Output tail` · `HEAD` · `Log` · `Outcome`.
Cells filled by `157-15` read `pending — 157-15` until that plan measures them.

---

### Row A — a ninth leak, `locals.supabase.from(...)`, in a guarded non-allowlisted route file

**Injection (identical in both halves).** The leak line is added verbatim to the body of `load()` in
`apps/frontend/src/routes/admin/+layout.server.ts`, and the existing `return` is widened by one property
so the result is consumed. The file goes from this:

```ts
export async function load({ locals }) {
  const { session } = await locals.safeGetSession();
  return { session };
}
```

to this, with the injected line at `:9`:

```ts
export async function load({ locals }) {
  const { session } = await locals.safeGetSession();
  const { data } = await locals.supabase.from('elections').select('id');
  return { session, elections: data };
}
```

**Why the `return` line changes too, rather than injecting the one line alone.** Leaving `data` unused
raises `unused-imports/no-unused-vars`. That is a *warning*, not an error, so it would not have changed
the `Errors` cell — but it would have made the run's output differ from the pre-existing-warning baseline
string, and a reader comparing the two would have had to reason about which of the two warnings was
which. Consuming `data` keeps the injected run's warning profile **byte-identical to the baseline**, so
`0 errors (1 pre-existing warning)` means exactly the same thing in this row as it does in the header.
The Supabase call itself — the thing under test — is verbatim as `157-RESEARCH.md` § F.8 specifies.

**The injected site typechecks.** `elections` is a real table (`packages/supabase-types/src/database.ts:502`)
and `locals.supabase` is declared `SupabaseClient<Database>` (`apps/frontend/src/app.d.ts:11`), so
`svelte-check` reports `0 errors and 0 warnings` on the injected tree. This matters: the ninth site is a
**valid, shippable** leak that the entire gate accepts, not a broken fixture that some other check would
have stopped anyway.

| Field | `A-OLD` (blind) | `A-NEW` (catch) |
|-------|-----------------|-----------------|
| Half | guard **not** installed | guard **installed** |
| Expected | **0 errors** — proves the tree is currently blind to a ninth site | **≥1 `no-restricted-syntax` error** at the injected line |
| Command | `TURBO_FORCE=true yarn lint:check` | `TURBO_FORCE=true yarn lint:check` |
| Exit | **`0`** | **`1`** |
| Errors | **`0`** (`@openvaa/frontend:lint` → `✖ 1 problem (0 errors, 1 warning)`, the pre-existing warning and nothing else) | **`1`** (`@openvaa/frontend:lint` → `✖ 2 problems (1 error, 1 warning)` — the new error plus the same pre-existing warning) |
| Firing rule and message | n/a — nothing fired | `no-restricted-syntax` at **`9:26`**, the injected line: `A \`.supabase\` access reaches through the adapter boundary. Call through the \`dataProvider\` or \`dataWriter\` interface instead` |
| Output tail | `@openvaa/frontend:lint: cache bypass, force executing 567c9683bc41341b` … `@openvaa/frontend:lint: ✖ 1 problem (0 errors, 1 warning)` … `@openvaa/frontend:typecheck: svelte-check found 0 errors and 0 warnings` … `Tasks: 22 successful, 22 total` | `@openvaa/frontend:lint: cache bypass, force executing f71d40529e20d5f4` … `@openvaa/frontend:lint:   9:26  error  A \`.supabase\` access reaches through the adapter boundary. …  no-restricted-syntax` … `@openvaa/frontend:lint: ✖ 2 problems (1 error, 1 warning)` … `Tasks: 10 successful, 11 total` |
| HEAD | `a38969a17` (source tree byte-identical to `aa06cbaf5`; the only difference between the two commits is this planning document) | `0c1a1a63c` |
| Log | `${TMPDIR:-/tmp}/gsd-157/A-OLD.log` | `${TMPDIR:-/tmp}/gsd-157/A-NEW.log` |
| Cache | genuine run, not a replay — `cache bypass, force executing 567c9683bc41341b`, and the hash differs from the clean baseline's `3192d1d3697595c0` | genuine run, not a replay — `cache bypass, force executing f71d40529e20d5f4`, distinct from every other run in this register |
| Outcome | **BLIND — confirmed.** A ninth `locals.supabase` call in a guarded, non-allowlisted route file passes `yarn lint:check` with zero errors. | **CAUGHT — confirmed.** The identical injection, byte for byte, now fails `yarn lint:check` with one `no-restricted-syntax` error at the injected line. **`Tasks: 10 successful, 11 total`** rather than `22 of 22`: the failing lint task stops the pipeline before typecheck runs, which is the gate doing its job rather than a second defect. |

### Row B — an `@supabase/ssr` import in a component, the measured zero-hit locus

**Injection (identical in both halves).** The import is added at `:1` of
`apps/frontend/src/lib/components/input/shared.ts`, and a consuming export is appended at `:10`:

```ts
import { createBrowserClient } from '@supabase/ssr';

/**
 * Shared constants between `Input` and `InputGroup` components.
 */
export const iconBadgeClass = 'my-auto flex-shrink-0';
export const infoClass = 'm-md small-info';
export const joinGap = 'gap-xs';
export const outsideLabelClass = 'font-bold text-secondary mx-md mb-8 mt-lg';
export const supabaseClientFactory = createBrowserClient;
```

**Why the consuming export is not optional here.** `packages/shared-config/eslint.config.mjs:132` sets
`'unused-imports/no-unused-imports': 'error'`. A bare unused `@supabase/ssr` import would therefore have
turned this run **red — for a reason that has nothing to do with the adapter boundary**, and the row
would have recorded a catch the guard did not make. This is the same class of trap
`eslint-store-guard.test.ts:49-51` records as correctness invariant 3 ("a count assertion would pass for
the wrong reason"), met here in its inverted form. Consuming the import removes the confound, so the
`0 errors` in the row below is attributable to the absent adapter-boundary guard and to nothing else.

`svelte-check` reports `0 errors and 0 warnings` on the injected tree, so this import is likewise a
valid, shippable leak rather than a broken fixture.

| Field | `B-OLD` (blind) | `B-NEW` (catch) |
|-------|-----------------|-----------------|
| Half | guard **not** installed | guard **installed** |
| Expected | **0 errors** — proves the tree is currently blind to a Supabase import in a component | **≥1 `no-restricted-imports` error** at the injected line |
| Command | `TURBO_FORCE=true yarn lint:check` | `TURBO_FORCE=true yarn lint:check` |
| Exit | **`0`** | **`1`** |
| Errors | **`0`** (`@openvaa/frontend:lint` → `✖ 1 problem (0 errors, 1 warning)`, the pre-existing warning and nothing else) | **`1`** (`@openvaa/frontend:lint` → `✖ 2 problems (1 error, 1 warning)`) |
| Firing rule and message | n/a — nothing fired | `no-restricted-imports` at **`1:1`**, the injected line: `'@supabase/ssr' import is restricted from being used by a pattern. Supabase packages are banned outside the adapter. Call through the \`$lib/api/dataProvider\` or \`$lib/api/dataWriter\` interface instead` |
| Output tail | `@openvaa/frontend:lint: cache bypass, force executing 182da41d19ab71ef` … `@openvaa/frontend:lint: ✖ 1 problem (0 errors, 1 warning)` … `@openvaa/frontend:typecheck: svelte-check found 0 errors and 0 warnings` … `Tasks: 22 successful, 22 total` | `@openvaa/frontend:lint: cache bypass, force executing b8f2af0e48046763` … `@openvaa/frontend:lint:   1:1  error  '@supabase/ssr' import is restricted from being used by a pattern. …  no-restricted-imports` … `@openvaa/frontend:lint: ✖ 2 problems (1 error, 1 warning)` … `Tasks: 10 successful, 11 total` |
| HEAD | `a38969a17` (source tree byte-identical to `aa06cbaf5`) | `0c1a1a63c` |
| Log | `${TMPDIR:-/tmp}/gsd-157/B-OLD.log` | `${TMPDIR:-/tmp}/gsd-157/B-NEW.log` |
| Cache | genuine run, not a replay — `cache bypass, force executing 182da41d19ab71ef`, distinct from both the clean baseline's `3192d1d3697595c0` and `A-OLD`'s `567c9683bc41341b` | genuine run, not a replay — `cache bypass, force executing b8f2af0e48046763`, distinct from every other run in this register |
| Outcome | **BLIND — confirmed.** A direct `@supabase/ssr` import in `lib/components/` — the measured zero-hit locus — passes `yarn lint:check` with zero errors. | **CAUGHT — confirmed.** The identical import now fails `yarn lint:check` with one `no-restricted-imports` error at `1:1`. Note it is the **import** half that fires here and the **access** half that fired in row `A`: neither rule alone would have caught both rows, which is the measured reason the ban ships as a pair. |

### Row C — the must-NOT-fire control: the allowed adapter locus, unmodified

The row the store-guard ledger did not need and this one does. **The adapter must keep using Supabase.**
A guard that fires on `this.supabase.from('elections')` inside
`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` is broken, not strict.
"0 errors in the adapter" is a **positive result that must be recorded rather than assumed** — without
this row, a guard that reports zero because it is scoped to nothing would look identical to a guard that
works.

| Field | `C` |
|-------|-----|
| Half | guard **installed**; the adapter file **unmodified** |
| Expected | **0 errors** — the allowlist works and the guard is discriminating, not constant |
| Command | `npx eslint src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts src/lib/api/adapters/supabase/supabaseAdapter.ts src/lib/supabase/server.ts src/lib/supabase/browser.ts`, issued from `apps/frontend` |
| Exit | **`0`** |
| Errors | **`0`** — and **0 warnings**; ESLint printed nothing at all |
| Output tail | empty. ESLint emits no output for a clean run, which is the whole content of this row's observation |
| What makes the `0` non-vacuous | `grep -c 'this\.supabase' supabaseDataProvider.ts` → **9**. The file the guard reports clean contains **nine** `.supabase` member accesses, each of which the selector `MemberExpression[property.name='supabase']` matches. A guard scoped to nothing would produce the same `0`, so the `0` alone is not evidence — see the discrimination check below |
| Discrimination check (the row's real proof) | The **byte-identical** source of `supabaseDataProvider.ts` was passed to `eslint.lintText` twice, changing **only** the virtual `filePath`. At its real, allowlisted path: **0** boundary-rule messages. At a guarded path (`src/lib/components/__probe__/supabaseDataProvider.ts`): **9** boundary-rule messages. Same bytes, same config, opposite verdict — so the `0` above is the allowlist working, not the guard being inert |
| HEAD | `0c1a1a63c` |
| Log | `${TMPDIR:-/tmp}/gsd-157/C.log` |
| Outcome | **SILENT WHERE IT MUST BE — confirmed.** The guard does not fire inside the boundary. `T-157-37` (the guard blocking all work by firing in the adapter) is measured closed, and the discrimination check rules out the "scoped to nothing" false green that a bare `0` would leave open |

### Row D — restoration, proven by blob hash

Every touched file returns to its recorded pre-injection blob. **Functional restoration is not enough;**
this register's convention is a `git hash-object` value, and `git status --porcelain apps` must be empty.

| File | Pre-injection blob | Post-restoration blob (`157-14`) | Match | Post-restoration blob (`157-15`) |
|------|--------------------|----------------------------------|-------|----------------------------------|
| `apps/frontend/src/routes/admin/+layout.server.ts` | `02bf748322c834fe553f58f01aaf019473e7c2ec` | `02bf748322c834fe553f58f01aaf019473e7c2ec` | ✔ | `02bf748322c834fe553f58f01aaf019473e7c2ec` ✔ |
| `apps/frontend/src/lib/components/input/shared.ts` | `c1b2d1e99955faa73dd6aaf18d07403fac6ed288` | `c1b2d1e99955faa73dd6aaf18d07403fac6ed288` | ✔ | `c1b2d1e99955faa73dd6aaf18d07403fac6ed288` ✔ |
| `apps/frontend/eslint.config.mjs` | `10bcf84c37bb69497ad139c74f1e84747e250bee` | `10bcf84c37bb69497ad139c74f1e84747e250bee` — **not touched by `157-14`**, asserted unchanged at that plan's close | ✔ | intentionally **changed** by `157-15` to `4afd03a5af9a86271a1c0477781fcf12aeafccff`, which is the header's post-change target. Row `E-RED` temporarily took it to `741858549d5dad864d3525586c00284336ab9b5b` and it was returned to `4afd03a5…` ✔ |

| Field | `D` (the `157-14` half) |
|-------|-------------------------|
| Expected | every post-restoration blob equals its pre-injection blob; `git status --porcelain apps` empty |
| Command | `git checkout -- <file>` per injected file, then `git hash-object <file>` on each of the three, then `git status --porcelain apps` and `git diff --name-only` |
| Exit | `0` |
| Result | all three blobs match (table above); `git status --porcelain apps` printed **nothing**; `git diff --name-only` printed **nothing**, so it does **not** list `apps/frontend/eslint.config.mjs` |
| Closing check | `TURBO_FORCE=true yarn lint:check` re-run on the fully restored tree → exit **`0`**, `@openvaa/frontend:lint` → `✖ 1 problem (0 errors, 1 warning)`, i.e. back to the header's baseline string. Log: `${TMPDIR:-/tmp}/gsd-157/restored-clean.log` |
| Second, independent restoration proof | The closing run's turbo input hash for `@openvaa/frontend:lint` is **`3192d1d3697595c0`** — **identical to the clean baseline run's**, and distinct from both injected runs (`567c9683bc41341b`, `182da41d19ab71ef`). Turbo hashes task inputs including source file contents, so an identical hash is a restoration proof computed by a different mechanism than `git hash-object`, from a different tool, agreeing with it. |
| HEAD | `a38969a17` |
| Outcome | **RESTORED byte-identically** for the `157-14` half. The `157-15` half is recorded immediately below. |

| Field | `D` (the `157-15` half) |
|-------|-------------------------|
| Expected | every post-restoration blob equals its pre-injection blob; `apps/frontend/eslint.config.mjs` equals the **post-change** target; `git status --porcelain apps` empty |
| Command | `git checkout -- <file>` per injected file, then `git hash-object` on each of the three, then `git status --porcelain apps` |
| Exit | `0` |
| Result | both injected files match their pre-injection blobs (table above); `apps/frontend/eslint.config.mjs` is `4afd03a5af9a86271a1c0477781fcf12aeafccff`, the post-change target, after `E-RED` had temporarily taken it to `741858549d…`; `git status --porcelain apps` printed **nothing** |
| Closing check | `TURBO_FORCE=true yarn lint:check` re-run on the fully restored tree → exit **`0`**, `@openvaa/frontend:lint` → `✖ 1 problem (0 errors, 1 warning)`, i.e. back to the header's baseline string, and `@openvaa/frontend:typecheck: svelte-check found 0 errors and 0 warnings`, `Tasks: 22 successful, 22 total`. Log: `${TMPDIR:-/tmp}/gsd-157/restored-clean.log` |
| Second, independent restoration proof | The closing run's turbo input hash for `@openvaa/frontend:lint` is **`21d900c93b319d8e`**, distinct from both injected runs (`f71d40529e20d5f4`, `b8f2af0e48046763`). It is deliberately **not** compared to `157-14`'s `3192d1d3697595c0`: the tree legitimately changed between the two plans (the guard and its self-test landed), so an equal hash there would have been the anomaly. Turbo hashes task inputs including file contents, so the inequality against both injected runs is a restoration signal computed by a different tool than `git hash-object`, agreeing with it |
| HEAD | `0c1a1a63c` |
| Outcome | **RESTORED byte-identically** for the `157-15` half. The only files this plan leaves changed are the two it declares — `apps/frontend/eslint.config.mjs` and the new `apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts` — plus this ledger |

### Row E — the vitest pair: does the self-test measure the guard, or pass regardless?

An inverted pair. A guard self-test that is green both with and against the guard is measuring nothing.

The pair is also this plan's **TDD RED gate**. `157-15`'s plan orders Task 1 (the config) before Task 2
(the test), so a literal RED-before-GREEN was not available in task order; `E-RED` supplies it instead,
by deleting the implementation under a test that already exists and observing the failure.

**The manipulation, stated exactly.** The entire adapter-boundary config object was removed from
`apps/frontend/eslint.config.mjs` — the block whose `ignores` is `ADAPTER_BOUNDARY_ALLOWLIST`, carrying
both the paired rules and the four re-included inherited entries. Nothing else in the file, and no other
file, was touched. The stripped file hashed to `741858549d5dad864d3525586c00284336ab9b5b`; it was
restored with `git checkout --` and re-hashed to `4afd03a5af9a86271a1c0477781fcf12aeafccff`, the
post-change target in the header.

| Field | `E-RED` (guard removed) | `E-GREEN` (guard installed) |
|-------|-------------------------|-----------------------------|
| Expected | **red** — the self-test fails when the guard is not in the config | **green** — the self-test passes when it is |
| Command | `yarn workspace @openvaa/frontend vitest run src/lib/_guards/eslint-adapter-boundary-guard.test.ts` | `yarn workspace @openvaa/frontend vitest run src/lib/_guards/eslint-adapter-boundary-guard.test.ts` |
| Exit | **`1`** | **`0`** |
| Output tail | `Tests  24 failed \| 58 passed (82)` · `Test Files  1 failed (1)` | `Tests  82 passed (82)` · `Test Files  1 passed (1)` |
| Which assertions failed | **exactly the 24 "fires" assertions** — 3 guarded dirs x 2 extensions x 4 violation fixtures — and no others. The 58 that still passed are the silence probes, the no-fatal probes and the four inherited-ban standing regressions, all of which SHOULD stay green when only the guard's own entries are removed. A RED that had taken down the inherited-ban regressions too would have meant the manipulation removed more than the guard | n/a |
| `eslint.config.mjs` blob during the run | `741858549d5dad864d3525586c00284336ab9b5b` (guard block stripped) | `4afd03a5af9a86271a1c0477781fcf12aeafccff` (the post-change target) |
| HEAD | `c02448bba` — the Task 1 commit; the self-test was present in the working tree and not yet committed, which is the only state in which the RED half could be taken | `0c1a1a63c` — re-measured after the self-test was committed, so this half reads the shipped tree rather than a working-tree state |
| Log | `${TMPDIR:-/tmp}/gsd-157/E-RED.log` | `${TMPDIR:-/tmp}/gsd-157/E-GREEN.log` |
| Outcome | **RED — confirmed.** The self-test fails when the guard is absent | **GREEN — confirmed.** It passes when the guard is present. The pair proves the spec measures the guard rather than passing regardless, closing `T-157-19` |

**Stability, since `E-GREEN` alone would not settle it.** `T-157-39` is the intermittently-red guard
test, and CLAUDE.md forbids treating an intermittent failure as flaky. The full frontend unit suite —
where the concurrency that produced the store guard's measured `Test timed out in 5000ms` actually
occurs — was run **three consecutive times**: `yarn workspace @openvaa/frontend test:unit` → exit `0`,
`Tests 889 passed (889)`, **zero** timeout messages, on all three runs. `889` = the `807` frontend
baseline plus this plan's `82`. Logs: `${TMPDIR:-/tmp}/gsd-157/frontend-unit-{1,2,3}.log`.

---

## The allowlist as it ships from `157-15`

> **ALLOWLIST STATUS: SUPERSEDED — the list ships at NINE, not ten.** `157-16` struck entry #1 and the
> current list is recorded in § The allowlist as it ships from `157-16` below. The table in THIS section
> is `157-15`'s record, preserved verbatim because it states the list at that plan's close and is the
> `before` half of `157-16`'s shrink measurement. **It is not a description of the config today.** No
> measured cell of `157-15`'s has been altered.

Recorded here so `157-16` can strike one entry and update this table rather than re-deriving the list.
The list is declared as `ADAPTER_BOUNDARY_ALLOWLIST` at the top of `apps/frontend/eslint.config.mjs` and
consumed as the guard block's `ignores`. Every entry is named explicitly; there is no wildcard standing
in for a file, which is what criterion 6's "explicit rather than implied" asks for.

**Group 1 — the boundary's own inside. Five entries, permanent by construction.** These are not leaks;
they are what the adapter IS. Row `C` is the measurement that this group is correctly excluded.

| Entry | Why |
|-------|-----|
| `src/lib/api/adapters/**` | the Supabase adapter itself |
| `src/lib/supabase/**` | the browser and server Supabase client factories |
| `src/lib/api/dataProvider.ts` | one-line re-export selector naming the adapter path |
| `src/lib/api/dataWriter.ts` | one-line re-export selector naming the adapter path |
| `src/lib/api/feedbackWriter.ts` | one-line re-export selector naming the adapter path |

**Group 2 — the ten grandfathered sites outside the boundary, each annotated with its Phase-158
disposition.** Eight are the route files scored in `157-RESEARCH.md` § F.6; the last two live under
`src/` but outside criterion 6's stated scope and would otherwise fail the guard.

| # | Entry | Phase-158 disposition |
|---|-------|-----------------------|
| 1 | `src/routes/candidate/preregister/+layout.server.ts` | **158-EASY, and `157-16` removes it** — a plain `app_settings` read `SupabaseDataProvider._getAppSettings` already implements |
| 2 | `src/routes/candidate/auth/callback/+server.ts` | 158-MEDIUM — `auth.verifyOtp` then `auth.getUser`, needing adapter methods that do not exist on `DataWriter` today |
| 3 | `src/routes/candidate/auth/logout/+server.ts` | 158-EASY with a caveat — `SupabaseDataWriter._logout` already does this, but it `fetch`es THIS route, so moving it creates a cycle 158 must break first |
| 4 | `src/routes/candidate/(protected)/+layout.server.ts` | 158-MOSTLY-PERMANENT — two of its three sites hand the cookie-capable client to the adapter, which must happen somewhere outside the adapter; only the third is true leakage |
| 5 | `src/routes/candidate/login/+page.server.ts` | 158-HARD — `signInWithPassword` plus an inline JWT role decode; the heart of 158's three-login-paths-into-one collapse |
| 6 | `src/routes/admin/login/+page.server.ts` | 158-HARD — identical to #5, and the file a recorded cookie-loss incident was fixed in |
| 7 | `src/routes/api/candidate/preregister/+server.ts` | 158-MEDIUM — `functions.invoke('identity-callback')` plus `auth.verifyOtp`; `_preregister` already establishes the Edge-Function pattern |
| 8 | `src/routes/api/auth/logout/+server.ts` | 158-EASY — a bare `auth.signOut()` |
| 9 | `src/hooks.server.ts` | 158-OWNED, outside criterion 6's stated scope — POPULATES `event.locals.supabase`, the structural reason the eight above can reach Supabase without importing it |
| 10 | `src/app.d.ts` | 158-OWNED, and unreachable by this guard on purpose — DECLARES `supabase` on the global `App.Locals` interface, a type declaration rather than an import or an access |

**Ten entries at `157-15` close; `157-16` takes it to nine.** That is what makes the list a shrinking
target rather than a permanent amnesty, and it is the honest form of criterion 6: routes are clean except
for an explicit, annotated, shrinking list.

---

## The allowlist as it ships from `157-16` — nine entries

**Group 1 is unchanged at five entries.** `157-16` did not touch it; it is permanent by construction and
row `C` remains its measurement.

**Group 2 ships at NINE.** Entry #1, `src/routes/candidate/preregister/+layout.server.ts`, was struck.
The numbering below is `157-15`'s, kept so the two tables can be diffed row by row.

| #(was) | Entry | Status at `157-16` close |
|--------|-------|--------------------------|
| 1 | `src/routes/candidate/preregister/+layout.server.ts` | **REMOVED — the path is now guarded** |
| 2 | `src/routes/candidate/auth/callback/+server.ts` | retained, 158-MEDIUM |
| 3 | `src/routes/candidate/auth/logout/+server.ts` | retained, 158-EASY with a route-cycle caveat |
| 4 | `src/routes/candidate/(protected)/+layout.server.ts` | retained, 158-MOSTLY-PERMANENT |
| 5 | `src/routes/candidate/login/+page.server.ts` | retained, 158-HARD |
| 6 | `src/routes/admin/login/+page.server.ts` | retained, 158-HARD |
| 7 | `src/routes/api/candidate/preregister/+server.ts` | retained, 158-MEDIUM |
| 8 | `src/routes/api/auth/logout/+server.ts` | retained, 158-EASY |
| 9 | `src/hooks.server.ts` | retained, 158-OWNED |
| 10 | `src/app.d.ts` | retained, 158-OWNED |

**Why entry #1 was the only removable one.** It was the sole Group-2 site whose Supabase use was a plain
data read the provider already implements (`SupabaseDataProvider._getAppSettings`), needing no new adapter
method, no session, and no route restructuring. #5 and #6 are the heart of Phase 158's login collapse;
#2 and #7 need adapter methods that do not exist on `DataWriter`; #3 would create a route cycle because
`SupabaseDataWriter._logout` `fetch`es it; #4 hands the cookie-capable client to the adapter, which has to
happen somewhere outside the adapter; #9 and #10 populate and declare `event.locals.supabase` respectively.
**The nine retained entries are a worklist, not an oversight** — and each still carries its annotation in
`ADAPTER_BOUNDARY_ALLOWLIST`.

### Row `F` — the shrink, measured by resolved config rather than by reading the array

The direct evidence that deleting a string from `ignores` actually re-scoped the guard. A deleted array
line is a claim; ESLint's own resolved configuration is the measurement.

| Field | Value |
|-------|-------|
| Command | `npx eslint --flag v10_config_lookup_from_file --print-config <file>`, issued from `apps/frontend` |
| HEAD | `b3f636e1e` |
| Exit | `0` for all four files |
| Instrument | count of `no-restricted-syntax` selectors in the resolved config: **4** means guarded, **2** means allowlisted |

| File | Selectors at `157-15` close | Selectors at `157-16` close | Reading |
|------|---------------------------|----------------------------|---------|
| `src/routes/candidate/preregister/+layout.server.ts` | **2** (allowlisted) | **4** (guarded) | **the shrink, measured** |
| `src/routes/admin/+layout.server.ts` (guarded control) | 4 | **4** | unchanged |
| `src/routes/candidate/(protected)/+layout.server.ts` (retained entry) | 2 | **2** | unchanged |
| `src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (Group 1) | 2 | **2** | unchanged |

**No inherited entry was dropped.** Enumerated at HEAD `b3f636e1e` for the doubly-matched guarded file
`src/routes/admin/+layout.server.ts`, all four inherited entries survive, byte-identical to `157-15`'s
recorded table:

- `no-restricted-imports` paths: `["svelte/store"]` ✔
- `no-restricted-imports` patterns: `["^(\\.\\./){2,}lib(/|$)"` ✔`, "^@supabase/", "^\\$lib/(supabase|api/adapters)(/|$)"]`
- `no-restricted-syntax` selectors: `["TSEnumDeclaration"` ✔`, "ImportExpression[source.value='svelte/store']"` ✔`, "MemberExpression[property.name='supabase']", "ObjectPattern > Property[key.name='supabase']"]`

The de-allowlisted file now resolves to that **same** four-and-four set. A dropped inherited entry
produces **zero** errors on the real tree, which is why this is measured rather than read.

### Row `G` — the nine new self-test assertions, proven non-vacuous by a RED/GREEN pair

`157-16` added nine assertions at the de-allowlisted path. Four of them assert the guard **fires** there.
An assertion that fires can still be vacuous if it would fire regardless of the allowlist edit, so the
allowlist entry was **re-injected** and the same spec re-run.

| Field | RED (entry re-injected) | GREEN (entry struck) |
|-------|-------------------------|----------------------|
| Command | `npx vitest run src/lib/_guards/eslint-adapter-boundary-guard.test.ts` from `apps/frontend` | same |
| HEAD | `c92679ac7`, working tree carrying the re-injected line | `b3f636e1e`, clean tree |
| Exit | **1** | **0** |
| Result | **`4 failed \| 87 passed (91)`** | **`91 passed (91)`** |
| Which four | exactly the four `fires on … at the de-allowlisted src/routes/candidate/preregister path` cases | — |

**Exactly the four firing cases failed and no others.** The four discrimination-silence cases (the same
four fixtures at the still-allowlisted `src/hooks.server.ts`) and the real-file `lintFiles` case stayed
green, which is correct: re-adding the entry restores silence at that one path and changes nothing else.
A RED that had also taken down the silence cases would have meant the injection changed more than the
allowlist.

**Restoration, proven byte-identically.**

| File | Pre-injection blob | Post-restoration blob | Match |
|------|--------------------|-----------------------|-------|
| `apps/frontend/eslint.config.mjs` | `49cd131f4fe45ef97ddd1c409c6ea26ae14e725d` | `49cd131f4fe45ef97ddd1c409c6ea26ae14e725d` | ✔ |

`git status --porcelain apps` → **empty** after restoration. Restoration used
`git checkout -- apps/frontend/eslint.config.mjs`, a single named path; no blanket reset, no `git clean`,
no `git stash`. The config blob then moved to `d5a742b590c2b9028e66bf7c7259f75cb4d2ff9f` at `b3f636e1e`
when the stale ten-entry framing in the file's own doc comment was amended.

**Post-`157-16` restoration target (the blob hash):** `d5a742b590c2b9028e66bf7c7259f75cb4d2ff9f`, measured
at HEAD `b3f636e1e`. Rows measured from `157-17` onward assert against this value, never against
`4afd03a5…` (the `157-15` target) or `10bcf84c…` (the pre-guard target).

### Row `H` — the gate at `157-16` close

| Field | Value |
|-------|-------|
| Command | `TURBO_FORCE=true yarn lint:check` |
| HEAD | `b3f636e1e`, clean tree |
| Exit | **0** |
| `@openvaa/frontend:lint` | **`✖ 1 problem (0 errors, 1 warning)`** — the exact pre-existing-warning baseline string |
| Cache | `cache bypass, force executing 3fb5ca72fa938fdc` — a distinct input hash, not a replay of `157-15`'s `21d900c93b319d8e` |
| Tasks | `Tasks: 22 successful, 22 total` |
| Comment-hygiene guard | 1580 files scanned, **0 violations** |

The route file is clean under the now-stricter scope **because its Supabase use is gone**, not because it
is excused. That is the distinction the whole shrink exists to make.

### A correction to `157-16-PLAN.md`'s acceptance grep

The plan's acceptance criterion `grep -c 'candidate/preregister' apps/frontend/eslint.config.mjs` **returns
0** is **not satisfiable**, and its unsatisfiability is not a defect in the work. Retained Group-2 entry #7
is `src/routes/api/candidate/preregister/+server.ts`, whose path text **contains** `candidate/preregister`
as a substring. Driving that grep to zero would require deleting an entry that must stay, turning
`yarn lint:check` red on an untouched file. Measured at HEAD `b3f636e1e`, the grep returns **2**: entry #7,
and the Group-2 header comment that documents the removal.

**The correct machine check** is on parsed entries rather than raw text, and it passes:

| Check | Result |
|-------|--------|
| allowlist entries **equal to** `src/routes/candidate/preregister/+layout.server.ts` | **0** |
| Group-2 entry count | **9** |
| total `ADAPTER_BOUNDARY_ALLOWLIST` entries | **14** (5 + 9) |
| entries merely **containing** `candidate/preregister` | **1** — `src/routes/api/candidate/preregister/+server.ts`, correctly retained |

Row `F` is the stronger form of the same check: it measures the guard's **behaviour** at the path rather
than the config's text.

---

## The cast guard — five rows appended by `157-08`

> **ROWS-FIRST.** Every row in this section was written with its target named, its command written
> out and **every measured cell reading `pending — 157-08 measurement`**, and committed in that state,
> **before this plan's first injection**. That is the Phase 143 rule the whole register runs on: a row
> cannot be invented after the fact to fit an observation. The empty-row commit is **`4605f4db7`**
> ("open five negative-control rows before any injection", 193 insertions / 0 deletions) and it
> precedes the commit that fills them.

The instrument under test here is **not** the ESLint boundary rule rows `A`–`H` measure. It is a new,
independent guard: `scripts/assert-adapter-casts.mjs`, a Node scan script wired as the tenth `assert:*`
link of the root `lint:check` chain. It answers a different question — *has a boundary CAST been
reintroduced into the adapter?* — where rows `A`–`H` answer *has a Supabase CALL leaked outside the
adapter?* The two guards share a chain and nothing else, so **none of rows `A`–`H` is evidence about
this one**, and no cell below is borrowed from any of them.

- **Requirement:** **REVIEW-ADP-01** (rows `A`–`H` are `REVIEW-ADP-06`).
- **Opened and closed by:** `157-08-PLAN.md` (wave 6). Both halves are measured inside this plan,
  because the guard did not exist before it.
- **Corpus:** five rows — 1 injection pair (`CAST-OLD` / `CAST-NEW`), 1 restoration row
  (`CAST-RESTORE`), 1 must-NOT-fire control (`CAST-ALLOWED`), 1 per-pattern non-vacuity matrix
  (`CAST-VACUITY`, added beyond the plan's four; see the note under it).
- **HEAD at row creation:** `4605f4db7`. **HEAD at every measurement below:** `df8e9a111`, branch
  `integration/ship-12-squash`. The two differ by one commit — `df8e9a111`, a message-text-only
  pluralisation of the guard's violation string — and each row records its own.
- **Machine:** the same developer Mac this register's other rows were taken on, host Node, runs issued
  from the repository root (a linked git worktree). Node v24.14.1.
- **Pre-existing-warning baseline, re-measured for this section rather than inherited:** at HEAD
  `df8e9a111` on a clean tree, `TURBO_FORCE=true yarn lint:check` exits `0` with
  `@openvaa/frontend:lint` → **`✖ 1 problem (0 errors, 1 warning)`**, `Tasks: 22 successful, 22 total`,
  the comment-hygiene guard at **1583 files scanned, 0 violations**, and the new guard's summary line
  reading **26 file(s), 5047 line(s) scanned, 0 violation(s)**. Log:
  `${TMPDIR:-/tmp}/gsd-157/08-chained-clean.log`, turbo input hash for `@openvaa/frontend:lint`
  `451ccf218e94105c`.

### The measured cast baseline this guard was calibrated against

Recorded here because **the number moved four times inside this one phase**, and a threshold derived
from a stale number is a guard that never fires.

| Point | Lines matching ` as ` in `supabaseDataProvider.ts` | ` as ` tokens | `as Json as unknown as` in the adapter tree | Source |
|---|---|---|---|---|
| Fact 19 / `157-RESEARCH.md` § A.1, and every plan that cites it | 64 | 87 | 15 | recorded, **stale** |
| Before `157-05` | 64 | 90 | 15 | `157-05` |
| After `157-06` | 61 | 87 | 15 | `157-06-SUMMARY.md` |
| After `157-07` | 39 | 39 | 0 | `157-07-SUMMARY.md` |
| **Measured by `157-08` at HEAD `caa7b6c14`** | **39** | **39** | **0** | this row |

`157-08`'s own measurement **agrees with `157-07`'s and disagrees with the recorded Fact 19 figure by
25 lines and 48 tokens.** No threshold in `scripts/assert-adapter-casts.mjs` is derived from a count:
every check asserts **zero occurrences of an exact spelling**, which is why the drift above could not
silently mis-calibrate it. The pre-`157-07` occurrence counts recorded beside each of check 2's four
literals (2 / 1 / 4 / 14) were re-measured independently at `git show 830cdeeb4`, the commit before
`157-07`'s first, and are not copied from any summary.

### Injection targets, named and hashed before any injection

| Row | Target file | Why this file | Pre-injection `git hash-object` (at HEAD `df8e9a111`) |
|-----|-------------|---------------|-------------------------------------------------------|
| `CAST-OLD` / `CAST-NEW` / `CAST-RESTORE` | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` | The file the guard exists for. The injection is not invented: it is the **verbatim restoration of the elections-image read as it was spelled before `157-07`** (`git show 830cdeeb4:…`, where the identical form appears at 13 sites), so the row measures a real, historical regression rather than a fixture. | `3158f7fd77bf32de1e31839963ed5e9ed59ca528` |
| `CAST-OLD` (chain half only) | `package.json` | The chain link is struck for the `CAST-OLD` half so the blind measurement is taken against the tree **as it was before this plan**, then restored. | `ca03b97d72dd690a5c0635b7879620d0b51c1656` |

**Not a target, and neither became one:** `scripts/assert-adapter-casts.mjs`
(`51bc6d493836f5166bda11fc84551c40bc68fa90`) and `apps/frontend/eslint.config.mjs`
(`d5a742b590c2b9028e66bf7c7259f75cb4d2ff9f`, `157-16`'s value, **re-measured at `df8e9a111` and
unchanged**). Neither is modified by this plan.

**The injection, verbatim.** Two edits to `supabaseDataProvider.ts`, restoring the pre-`157-07` spelling
of the elections-image read. Measured `git diff --stat`: **3 insertions, 2 deletions**, net +1 line,
which is why the guard's scanned-line count reads **5048** in the injected halves and **5047** either
side of them.

```diff
-import type { LocalizedChoice, StoredCustomization } from '@openvaa/app-shared';
+import type { LocalizedChoice, StoredCustomization, StoredImage } from '@openvaa/app-shared';
@@
-        image: parseImageColumn(row.image, supabaseUrl, { column: 'elections.image', id: row.id }),
+        // reason: JSONB → StoredImage shape; runtime-guarded by parseStoredImage downstream.
+        image: parseStoredImage(row.image as Json as unknown as StoredImage | null, supabaseUrl),
```

**Why the import line changes too, rather than injecting the one line alone.** `StoredImage` stopped
being imported into this file when `157-07` removed the last cast that named it. Without the import the
injected line would fail `svelte-check`, and the `CAST-OLD` half would then be green because the
**typecheck** link aborted the chain — measuring the wrong thing entirely. Restoring the import makes
the injected tree a **valid, shippable** regression that the entire pre-existing gate accepts, which is
the only kind of injection a blindness row can be taken on. **Measured:** both injected runs report
`@openvaa/frontend:typecheck: svelte-check found 0 errors and 0 warnings`. `parseImageColumn` remains
imported and used at six other sites, so no import goes unused and the run's warning profile stays
byte-identical to the baseline string.

---

### Row `CAST-OLD` — the guard's blind half: the chain without it

| Field | `CAST-OLD` (blind) |
|-------|--------------------|
| Half | injection present; the `&& yarn assert:adapter-casts` link **struck** from the root `lint:check` chain (`grep -c 'assert:adapter-casts' package.json` → **1**, the script definition alone) |
| Expected | **exit 0** — proves the chain as it stood before this plan is blind to a reintroduced boundary cast |
| Command | `TURBO_FORCE=true yarn lint:check` |
| Exit | **`0`** |
| Errors | **`0`** — `@openvaa/frontend:lint` → `✖ 1 problem (0 errors, 1 warning)`, the pre-existing `candidateContext.svelte.test.ts:19` unused var and nothing else |
| Did the guard run at all | **No.** `grep -c 'Adapter-boundary cast guard' 08-CAST-OLD.log` → **`0`**. The chain never reached it, which is precisely the blindness under test |
| Output tail | `@openvaa/frontend:lint: cache bypass, force executing add10b2d4029a62e` … `@openvaa/frontend:lint: ✖ 1 problem (0 errors, 1 warning)` … `@openvaa/frontend:typecheck: svelte-check found 0 errors and 0 warnings` … `Tasks: 22 successful, 22 total` … last line is the schema-migration parity guard, with no adapter-cast line after it |
| Cache | genuine run, not a replay — `cache bypass, force executing add10b2d4029a62e`, distinct from the clean baseline's `451ccf218e94105c` |
| HEAD | `df8e9a111` |
| Log | `${TMPDIR:-/tmp}/gsd-157/08-CAST-OLD.log` |
| Companion observation (check 3 firing on the real tree) | With the link still struck and the injection still present, `node scripts/assert-adapter-casts.mjs` run directly → exit **`1`**, **3 violations**: check 1 at `:226`, check 2 (`as StoredImage`) at `:226`, and **check 3 reporting its own absence from the chain**. So the guard was not silent — it was **unreachable**, and it says so when reached |
| Outcome | **BLIND — confirmed.** A reintroduced `as Json as unknown as StoredImage \| null` in the adapter's elections read passes `yarn lint:check` with zero errors, a clean `svelte-check`, and `Tasks: 22 successful, 22 total`. Nothing in the pre-`157-08` gate has anything to say about it |

### Row `CAST-NEW` — the catch half: the identical injection, the chain with it

| Field | `CAST-NEW` (catch) |
|-------|--------------------|
| Half | the **same** injection, byte for byte (provider blob `31cd14d68434e071a69277bd775a4b64ed1c983e` in both halves); the chain link restored (`grep -c` → **2**, and `package.json` back to blob `ca03b97d…`) |
| Expected | **exit 1**, with the guard naming the injected file, its line number and the offending line text |
| Command | `TURBO_FORCE=true yarn lint:check` |
| Exit | **`1`** |
| Violations reported | **2**, both at `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:226` |
| Firing checks and messages | **Check 1** — "a triple cast through 'unknown' asserts an unvalidated JSONB value into an application shape (REVIEW-ADP-01). Parse the stored shape with its zod schema and derive the value from the parse result instead; see 'parseJsonbColumn.ts'." **Check 2** — "the cast 'as StoredImage' is back. Phase 157 plan 07 removed its 14 occurrences by validating the column at the boundary (REVIEW-ADP-01). Parse, then derive — do not assert." Each message echoes the offending line text on the following line: `image: parseStoredImage(row.image as Json as unknown as StoredImage \| null, supabaseUrl),` |
| Output tail | every earlier link still green — `@openvaa/frontend:lint: ✖ 1 problem (0 errors, 1 warning)`, `svelte-check found 0 errors and 0 warnings`, `Tasks: 22 successful, 22 total`, then the nine preceding `assert:*` guards at 0 violations each — and the run ends on `Adapter-boundary cast guard (phase 157: REVIEW-ADP-01) — 26 file(s), 5048 line(s) scanned …; 2 violation(s).` The failure is the **last** thing printed and it names the file, the line and the text |
| Cache | `cache bypass, force executing add10b2d4029a62e` — **identical to `CAST-OLD`'s**, which is correct and load-bearing: the source tree is byte-identical between the two halves and only `package.json`'s chain string differs, which is not an input to the lint task. Turbo computing the same hash is an **independent confirmation, by a different tool, that the two halves ran on the same injected bytes** |
| HEAD | `df8e9a111` |
| Log | `${TMPDIR:-/tmp}/gsd-157/08-CAST-NEW.log` |
| Outcome | **CAUGHT — confirmed.** The identical injection, byte for byte, now fails `yarn lint:check` with two violations naming path, line number and offending text. The gate turns red for exactly one reason and says which |

### Row `CAST-RESTORE` — restoration, proven by blob hash

| File | Pre-injection blob | Post-restoration blob | Match |
|------|--------------------|------------------------|-------|
| `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` | `3158f7fd77bf32de1e31839963ed5e9ed59ca528` | `3158f7fd77bf32de1e31839963ed5e9ed59ca528` | ✔ |
| `package.json` | `ca03b97d72dd690a5c0635b7879620d0b51c1656` | `ca03b97d72dd690a5c0635b7879620d0b51c1656` | ✔ |
| `scripts/assert-adapter-casts.mjs` (never touched) | `51bc6d493836f5166bda11fc84551c40bc68fa90` | `51bc6d493836f5166bda11fc84551c40bc68fa90` | ✔ |
| `apps/frontend/eslint.config.mjs` (never touched) | `d5a742b590c2b9028e66bf7c7259f75cb4d2ff9f` | `d5a742b590c2b9028e66bf7c7259f75cb4d2ff9f` | ✔ |

| Field | `CAST-RESTORE` |
|-------|----------------|
| Expected | every post-restoration blob equals its pre-injection blob; `git status --porcelain apps` empty |
| Command | `git checkout -- <file>` per injected file, then `git hash-object` on each of the four, then `git status --porcelain apps` and `git diff --name-only` |
| Exit | `0` |
| Result | all four blobs match (table above); `git status --porcelain apps` printed **nothing**; `git diff --name-only` printed **nothing**; `git status --short` shows only the pre-existing untracked `.planning/state.json` |
| Closing check | `TURBO_FORCE=true yarn lint:check` on the fully restored tree → exit **`0`**, `@openvaa/frontend:lint` → `✖ 1 problem (0 errors, 1 warning)`, `svelte-check found 0 errors and 0 warnings`, `Tasks: 22 successful, 22 total`, comment hygiene **1583 files scanned, 0 violations**, and the guard back to **26 file(s), 5047 line(s) scanned, 0 violation(s)** — the 5048 of the injected halves gone with the injected line. Log: `${TMPDIR:-/tmp}/gsd-157/08-restored-clean.log` |
| Second, independent restoration proof | The closing run's turbo input hash for `@openvaa/frontend:lint` is **`451ccf218e94105c`** — **identical to the pre-injection chained-clean run's**, and distinct from both injected runs (`add10b2d4029a62e`). Turbo hashes task inputs including source file contents, so an identical hash is a restoration proof computed by a different mechanism than `git hash-object`, from a different tool, agreeing with it |
| Third gate, run separately | `yarn format:check` from the repository root → exit **`0`**, "All matched files use Prettier code style!". It does **not** run inside `lint:check`, so it is measured on its own |
| HEAD | `df8e9a111` |
| Outcome | **RESTORED byte-identically.** The only files this plan leaves changed are the three it declares: `scripts/assert-adapter-casts.mjs`, `package.json` and this ledger |

### Row `CAST-ALLOWED` — the must-NOT-fire control: the surviving casts `157-07` could not remove

`157-07` closed with **34 real casts still in `supabaseDataProvider.ts`** (39 lines match ` as `, of
which 5 are prose comments), every one of them classified and accepted: the respelled
`as DPDataType['appSettings']`, the `GetQuestionsPayload` narrowing, the `keywords` and `choices`
class-1 residuals, seven `} as ElectionData`-shaped output casts that compensate for `toDataObject`'s
`Record<string, unknown>` return, the `as const` literal narrowings, and the phase-164 nullability
compensations. **A guard that fires on any of them is broken, not strict** — it would redden the build
on work Phase 164 owns and would be disabled rather than obeyed (`T-157-21`).

"0 violations there" is a **positive result that must be recorded rather than assumed.**

| Field | `CAST-ALLOWED` |
|-------|----------------|
| Half | guard installed and chained; the adapter tree **unmodified** |
| Expected | **0 violations**, on a corpus that demonstrably contains the accepted casts |
| Command | `node scripts/assert-adapter-casts.mjs` |
| Exit | **`0`** |
| Violations | **`0`** — `26 file(s), 5047 line(s) scanned under apps/frontend/src/lib/api/adapters/supabase` |
| What makes the `0` non-vacuous | The guard **reports the size of what it read**, and that number is not zero: 26 files, 5047 lines. Independently measured, those 26 files contain **108 lines matching ` as `** — every one of them read by the guard, every one of them left unflagged |
| Accepted casts confirmed present and unflagged | Fixed-string counts in `supabaseDataProvider.ts` at `df8e9a111`: `as DPDataType['appSettings']` **1**, `as GetQuestionsPayload` **1**, `as Array<LocalizedChoice>` **1**, `as Record<string, string>` **1**, `} as ElectionData` **1**, `] as const` **1**, `as boolean \| null` **1**, `as Record<string, unknown>` **5**, `as Array<InternalFlatNomination>` **2**. Nine distinct accepted shapes, 14 lines, **0 flagged** |
| HEAD | `df8e9a111` |
| Log | `${TMPDIR:-/tmp}/gsd-157/08-CAST-ALLOWED.log` |
| Outcome | **SILENT WHERE IT MUST BE — confirmed.** The guard is discriminating, not constant: it reads 108 ` as ` lines including all nine accepted shapes and flags none of them, while `CAST-NEW` shows it flagging the one spelling it is for. `T-157-21` (a guard so noisy it gets disabled) is measured closed |

### Row `CAST-VACUITY` — every pattern proven to fire, one at a time

**Added by `157-08` beyond the four rows `157-08-PLAN.md` specifies.** The reason is a defect class this
phase hit twice: `157-12` found an acceptance criterion grepping for `rpc('merge_custom_data'`, **a
string that occurs nowhere in the repository** (the real RPC is `merge_question_custom_data`); run as
written it measured nothing and reported a pass. `157-16` found a second instance. This guard carries
**eight** distinct failure paths across its four checks, and `CAST-NEW`'s single injection exercises
only two of them. A pattern that can never match is a guard line that is green forever, and it is
indistinguishable from a working one unless it is fired on purpose.

Each path is fired **in isolation**, against a synthetic corpus, by running a copy of the guard that
differs from the shipped file **on exactly one line** — `ADAPTER_DIR_REL`, repointed — verified by a
line-by-line comparison printed into the log. That is the same "same bytes, different path, opposite
verdict" technique row `C` used. The real tree is never touched by this row.

**The clean synthetic corpus is the control**, and it is not trivially clean: each of its three files
carries an accepted cast (`as Record<string, string> | null`), a class-2 output cast
(`} as ElectionData`), a literal narrowing (`as const`) and a phase-164 nullability compensation
(`as boolean | null`). The guard reads all 18 lines and reports **0 violations, exit 0**.

| # | Failure path | Check | Injected alone | Exit | Reported |
|---|--------------|-------|----------------|------|----------|
| 0 | *(control — clean corpus)* | — | nothing | **0** | `3 file(s), 18 line(s) scanned; 0 violation(s)` |
| 1 | corpus empty | 0 | all `.ts` files removed | **1** | `0 file(s), 0 line(s) scanned; 4 violation(s)` — the vacuous-zero message plus all three anchors |
| 2 | one anchor missing | 0 | `dataWriter/supabaseDataWriter.ts` removed | **1** | `2 file(s), 12 line(s); 1 violation(s)` — names the missing anchor only |
| 3 | `as\s+Json\s+as\s+unknown\s+as` | 1 | one line appended | **1** | `…supabaseDataProvider.ts:6 — a triple cast through 'unknown' …`, offending text echoed |
| 4 | `as Partial<DynamicSettings>` | 2 | one line appended | **1** | `…:6 — the cast 'as Partial<DynamicSettings>' is back. … its 2 occurrences …` |
| 5 | `as AppCustomization` | 2 | one line appended | **1** | `…:6 — the cast 'as AppCustomization' is back. … its 1 occurrence …` |
| 6 | `as LocalizedAnswers` | 2 | one line appended | **1** | `…supabaseDataWriter.ts:6 — the cast 'as LocalizedAnswers' is back. … its 4 occurrences …` |
| 7 | `as StoredImage` | 2 | one line appended | **1** | `…supabaseAdminWriter.ts:6 — the cast 'as StoredImage' is back. … its 14 occurrences …` |
| 8a | chain link absent from `lint:check` | 3 | link struck from the probe manifest | **1** | "`yarn assert:adapter-casts` is no longer one of the `&&` links …" |
| 8b | script entry absent as well | 3 | `scripts["assert:adapter-casts"]` deleted too | **1** | **2** violations — the missing definition *and* the missing chain link, reported separately |
| 8c | both restored | 3 | manifest copied back | **0** | `0 violation(s)` |
| 8d | **link moved to the FIRST slot** | 3 | link relocated to the head of the chain | **0** | `0 violation(s)` — **the membership-not-position proof.** The guard is indifferent to where in the chain it sits, per `b410d3a90` |

| Field | `CAST-VACUITY` |
|-------|----------------|
| Command | `PROBE_DIR=corpus node ${TMPDIR}/gsd-157/vacuity/repo/scripts/guard-probe.mjs`, twelve times, against a corpus rebuilt from scratch between every case |
| Probe fidelity | the probe differs from `scripts/assert-adapter-casts.mjs` on **exactly 1 line** (line 79, `ADAPTER_DIR_REL`), asserted programmatically and printed into the log before the matrix runs |
| HEAD | `df8e9a111` |
| Log | `${TMPDIR:-/tmp}/gsd-157/08-CAST-VACUITY.log` |
| Real tree touched | **no** — the synthetic corpus and the probe both live under `${TMPDIR}`; `git status --porcelain` was clean throughout |
| A harness failure worth recording | The **first** run of this matrix was itself vacuous: case 1 removed the corpus directory and the rebuild helper did not recreate it, so cases 2–7 all ran against an empty tree. **Every one of them exited 1**, which is the expected value — so the matrix would have read as twelve passes while measuring nothing after case 1. It was caught by reading the messages rather than the exit codes, and the rebuild helper now asserts the corpus has exactly 3 files before each case. This is the `157-12` defect class reproducing itself *inside the instrument built to detect it*, and it is recorded because an exit code is not a measurement |
| Outcome | **NON-VACUOUS — confirmed, path by path.** All eight failure paths fire in isolation with the correct message; the control corpus, carrying four accepted cast shapes, stays silent; and moving the chain link proves check 3 tests membership rather than position |

---

## The gate at phase close — three rows appended by `157-18`

`157-18` did not reopen, alter or re-measure any of the fifteen rows above. It appends rows
`CLOSE-STATIC`, `CLOSE-DB` and `CLOSE-E2E`, each measured at the phase-close HEAD, each carrying its
own command and its own output. The corpus is therefore **18 rows**.

The three rows differ from every row above them in kind. Rows `A`–`H` and `CAST-*` measure whether an
instrument can see; these three measure the tree the instruments were pointed at, at one HEAD, at the
end of the phase. They are not negative controls and they do not claim to be — they are the phase's
verification record, kept in this register because it is the register that forbids borrowed
observations, and a phase gate is exactly where borrowing is most tempting.

### Row `CLOSE-STATIC` — the static and unit gate, and every close-condition grep

| Field | Value |
|-------|-------|
| HEAD | `12252309bb25d63d84d2f3379dcc5d85c8585c12` (`12252309b`) |
| Working tree | clean; `git status --porcelain` showed only `?? .planning/state.json`, which is untracked runtime state and was not touched |
| Phase base for every "down from" figure | `8105a43b8976f2190471d01975ec8057e2cf2673` (`8105a43b8`), the parent of the first `157` commit `abfc9feec` |
| Free disk before the gate | 141 GiB available — recorded because full-suite runs in this worktree have been voided by ENOSPC |

**The static gate, each command run at the HEAD above.**

| Command | Exit | Measured output |
|---------|------|-----------------|
| `yarn build --force` | **0** | `Tasks: 14 successful, 14 total` · `Cached: 0 cached, 14 total` · 19.182s. Forced deliberately: a `FULL TURBO` cache hit also exits 0, and a phase gate that accepts a replayed log is measuring the cache rather than the tree. Four pre-existing `no output files found for task` warnings (`dev-seed`, `dev-tools`, `shared-config`, `supabase-types`) — a `turbo.json` `outputs` gap, not this phase's |
| `yarn lint:check` | **0** | `Tasks: 22 successful, 22 total`. Warnings, all `0 errors`: `@openvaa/dev-seed` `✖ 15 problems (0 errors, 15 warnings)`; `@openvaa/frontend` `✖ 1 problem (0 errors, 1 warning)`; root `tests` `✖ 2 problems (0 errors, 2 warnings)`. All `unused-imports/no-unused-vars` or `playwright/prefer-to-have-length`, all pre-existing |
| `yarn format:check` | **0** | `All matched files use Prettier code style!`, both halves (root Prettier and `@openvaa/docs`) |
| `yarn test:unit` | **0** | `Tasks: 25 successful, 25 total`. frontend **932 passed** (56 files) · app-shared **79 passed** (10 files) · data 244 · dev-seed 603 · matching 43 · llm 39 · argument-condensation 30 · filters 22 · question-info 22 |
| `yarn typecheck` (a member of the `lint:check` chain) | **0** | `svelte-check found 0 errors and 0 warnings`, frontend and docs both |

**A correction to the inherited baseline.** `.continue-here.md` records the `lint:check` signature as
`✖ 1 problem (0 errors, 1 warning)`. That is the **frontend workspace's** line, not the run's. The full
run emits three such lines across three workspaces, totalling 18 warnings and 0 errors. The exit code
and the "0 errors" reading are unchanged; the single-line signature is an under-count and is corrected
here rather than repeated.

**The close-condition greps.** Required value beside measured value, every one at HEAD `12252309b`.

| # | Criterion | Check | Required | Measured | Verdict |
|---|-----------|-------|----------|----------|---------|
| 1 | REVIEW-ADP-01 | `grep -rn 'as Json as unknown as' apps/frontend/src/lib/api/` | 0 | **0** (grep exit 1, no match) | ✅ |
| 1 | REVIEW-ADP-01 | the same grep at phase base `8105a43b8`, re-measured rather than cited | 15 | **15** | ✅ inherited figure **confirmed** |
| 1 | REVIEW-ADP-01 | `node scripts/assert-adapter-casts.mjs` | exit 0 | **exit 0** — `26 file(s), 5047 line(s) scanned under apps/frontend/src/lib/api/adapters/supabase; 0 violation(s)` | ✅ |
| 1 | REVIEW-ADP-01 | `assert:adapter-casts` is a MEMBER of the `lint:check` chain | member | **member** — the final `&&` link in root `package.json`'s `lint:check`, read from the script itself | ✅ |
| 2 | REVIEW-ADP-02 | `grep -c 'convertFilterValue' …/supabaseDataProvider.ts` | ≥ 2 | **5** | ✅ |
| 2 | REVIEW-ADP-02 | `p_election_round` forwarded | forwarded | **2 sites** — `:313` (`get_nominations`) and `:536` (`get_questions`) | ✅ |
| 3 | REVIEW-ADP-03 | `grep -c "rpc('get_questions'" …/supabaseDataProvider.ts` | 1 | **1** | ✅ |
| 3 | REVIEW-ADP-03 | `grep -c "from('question_categories')" …/supabaseDataProvider.ts` | 0 | **0** | ✅ |
| 4 | REVIEW-ADP-04 | `grep -rin 'withauth' apps packages tests` | 0 | **0** | ✅ |
| 4 | REVIEW-ADP-04 | `grep -rn 'WithOptionalAuth' apps packages tests` | 0 | **0** | ✅ |
| 4 | REVIEW-ADP-04 | `grep -rln 'authToken' apps/frontend/src` | the `157-11` survivor list | **exactly 3 files, 7 lines** — `base/universalAdapter.ts`, `.test.ts`, `.type.ts` | ✅ |
| 5 | REVIEW-ADP-05 | `ls …/lib/api/utils/auth/providers/authConfig.ts` | non-zero | **exit 1**, `No such file or directory` | ✅ |
| 5 | REVIEW-ADP-05 | `getLocalized` resolves from `@openvaa/app-shared` | resolves | **`packages/app-shared/src/data/getLocalized.ts`**, barrelled at `packages/app-shared/src/index.ts:5`, imported as `from '@openvaa/app-shared'` at both consumer sites; `getLocalized.test.ts` colocated beside it | ✅ |
| 6 | REVIEW-ADP-06 | `grep -rn 'logDebugError' apps packages` | 0 | **0** | ✅ |
| 6 | REVIEW-ADP-06 | `grep -rn 'configureLogger' apps/frontend/src \| wc -l` | 2 | **13** | ⚠️ **the required value is stale — see below** |
| 6 | REVIEW-ADP-06 | the ESLint guard self-test | green | **green** — `eslint-adapter-boundary-guard.test.ts` **91 tests** passed, `eslint-store-guard.test.ts` **30 tests** passed | ✅ |
| 6 | REVIEW-ADP-06 | the allowlist has nine annotated entries | 9 | **9** Group-2 entries, each carrying its own `158-*` disposition comment (Group 1 is a separate 5, permanent by construction) | ✅ |

**Two greps for criterion 4, and why.** `WithOptionalAuth` does not contain the substring `withauth`
(the `Optional` sits between `With` and `Auth`), so a case-insensitive search for the first string
cannot see the second. Both were run, separately, tracked-files (`git grep`) and literal
(`grep -rin … --exclude-dir=node_modules`), and all four counts are 0.

**The `configureLogger` count is a stale expectation, not a failure.** The criterion asks for
`wc -l` = 2. Measured: 13. The decomposition:

| Locus | Lines | What they are |
|-------|-------|---------------|
| `src/hooks.client.ts` | 2 | one `import`, one module-scope call |
| `src/hooks.server.ts` | 2 | one `import`, one module-scope call |
| `…/parseJsonbColumn.test.ts` | 3 | a capture sink installed and torn down by a unit test |
| `…/supabaseDataProvider.test.ts` | 3 | same |
| `…/supabaseAdminWriter.test.ts` | 3 | same |

The criterion's **intent** is "the logger is configured once per SvelteKit module graph, and there are
two module graphs". That is measured by
`grep -rn 'configureLogger(' apps/frontend/src --exclude='*.test.ts'`, which returns **exactly 2**:
`hooks.client.ts:7` and `hooks.server.ts:15`. The literal `wc -l` form was written before `157-07`
landed nine `configureLogger` lines in three adapter test files, and `157-17-SUMMARY.md` had already
recorded it as **unmeetable** for that reason. This row confirms that finding by independent
measurement rather than repeating it: intent **met**, literal form **superseded**.

**The two guards that protect the guards.**

| Guard-of-the-guard | Measurement | Result |
|--------------------|-------------|--------|
| `assert:adapter-casts` chain membership | read from root `package.json` `lint:check`, where it is the terminal `&&` link | **member** |
| inherited-ban regression cases (the flat-config REPLACE trap) | `eslint-adapter-boundary-guard.test.ts` § *inherited bans survive the flat-config REPLACE (standing regressions)* — four cases, one per inherited ban: `TSEnumDeclaration`, deep-relative-lib patterns, `svelte/store` paths, dynamic `svelte/store` `ImportExpression` | **all four green** |
| the allowlist scoping, re-measured by resolved config rather than by reading the array | `npx eslint --flag v10_config_lookup_from_file --print-config <file>`, from `apps/frontend`, counting `no-restricted-syntax` selectors (4 = guarded, 2 = allowlisted) | `routes/admin/+layout.server.ts` **4** · `routes/candidate/preregister/+layout.server.ts` **4** · `routes/candidate/(protected)/+layout.server.ts` **2** · `…/supabaseDataProvider.ts` **2** — identical to row `F`'s table, re-taken at `12252309b` rather than cited from `b3f636e1e` |

**D-0.1, measured across the whole phase.**
`git diff --name-only 8105a43b8..HEAD` lists **165 files** and matches
`^\.planning/(ROADMAP|REQUIREMENTS|STATE)\.md$` **zero times** (grep exit 1). The `.planning/` files it
does touch are `.continue-here.md`, `WINDOWS.md`, one Phase-156 review doc, two `todos/pending/` entries
and the `phases/157-…/` directory. `git status --porcelain tests` is empty and
`git diff --name-status 8105a43b8..HEAD -- tests/e2e-runs` yields no `D` lines: **nothing under
`tests/e2e-runs/` was deleted.**

**The code-review checklist pass** (`.agents/code-review-checklist.md`, named twice by `CLAUDE.md`),
over the phase diff:

| Item | Result |
|------|--------|
| Avoid `any` | **0** added `any` type annotations across `apps/**` and `packages/**`. Every `\bany\b` hit in the added lines is the English word inside a comment |
| `@ts-expect-error` | **0** added |
| SECURITY DEFINER sets `search_path` | not applicable in the strict sense: **both** new RPCs are `SECURITY INVOKER`, and the one `SET search_path = public, extensions` present is on the invoker function. A pgTAP assertion (`get_questions is SECURITY INVOKER (not DEFINER)`) pins it |
| pgTAP transaction boundary | `11-question-rpcs.test.sql` — `BEGIN;` `:16`, `SELECT plan(55);` `:23`, `SELECT * FROM finish();` `:429`, `ROLLBACK;` `:430` |
| `safeGetSession()` over `getSession()` | **0** added `getSession(` call sites |
| Errors handled and logged | the phase's central change: `logDebugError` → **0**, replaced by the structured `log` with a configured level per module graph |
| Clean, linear history following commit guidelines | **0 merge commits**. 86 commits: 33 `docs`, 18 `feat`, 12 `test`, 12 `refactor`, 5 `style`, 3 `fix`, 3 `chore` |
| Documentation updated where touched | `lib/api/README.md` corrected in `157-13`; `packages/README.md`, `tests/README.md` and the guard annotations carried in-tree |

**Nothing on the checklist needed attention.** No item was found open and no item was waived.

### Row `CLOSE-DB` — the database gate, from a reset built out of the migrations this phase wrote

| Field | Value |
|-------|-------|
| HEAD | `7028d32fd` — row `CLOSE-STATIC`'s commit, whose entire diff against `12252309b` is **this file**. `git diff --stat 12252309b..7028d32fd` touches no source, no SQL and no generated type, so the two rows measure the same tree |
| Database | local Supabase, CLI **v2.83.0** (pinned; the CLI offers v2.116.0 and was not taken) |
| Order, chosen deliberately | `db:reset` → pgTAP → `pg_proc` → `db:lint:sql` → **`db:reset-with-data`** → `db:types`. The middle reset is not optional: `00-helpers.test.sql` calls `no_plan()` and defines its fixtures OUTSIDE any `BEGIN`/`ROLLBACK`, so they persist in `public` after a pgTAP run, and `db:types` taken on that tree would report drift that is the test harness's, not the schema's |

| # | Command | Exit | Measured |
|---|---------|------|----------|
| 1 | `yarn db:reset` | **0** | The phase's migration is applied **by name**: `Applying migration 00004_question_rpcs_and_nomination_election_round.sql...`, fourth of four after `00001_initial_schema`, `00002_anon_select_terms_of_use_and_get_nominations_rls_guard`, `00003_authenticated_insert_feedback`. `Finished supabase db reset on branch main.` |
| 2 | `cd apps/supabase && npx supabase test db` | **0** | `Files=12, Tests=379`, `Result: PASS`, `All tests successful.`, and **0** lines matching `^not ok`. All 12 files individually report `ok` |
| 3 | `pg_proc` overload assertion | — | `get_questions` → **1**, `get_nominations` → **1**. Both `prosecdef = false`. Signatures: `get_questions(p_election_id uuid, p_constituency_id uuid, p_election_round integer)`, `get_nominations(p_election_id uuid, p_constituency_id uuid, p_include_unconfirmed boolean, p_election_round integer)` |
| 4 | `yarn db:lint:sql` | **1** | **PRE-EXISTING, and measured rather than assumed — see below** |
| 5 | `yarn db:reset-with-data` | **0** | 752 rows: 327 candidates, 377 nominations, 26 questions, 4 question_categories, 8 organizations, 5 constituencies, 2 alliances, 1 election, 1 app_settings. 327 portraits uploaded |
| 6 | `yarn db:types` then `git diff --stat packages/supabase-types` | **0** | **EMPTY.** `git status --porcelain` afterwards shows only `?? .planning/state.json`. The committed generated contract matches the applied schema |

**The assertion count is composite, not `Tests=` alone.** `Tests=` is the *planned* total and prints
identically whether the run passed or failed, so it cannot carry the verdict by itself. Four independent
signals were read: exit **0**, `Result: PASS`, `Files=12` (non-zero, and one above the pre-phase 11), and
`Tests=379` (above the 324 floor `157-04-SUMMARY.md` records). The declared plans reconcile exactly —
eleven files declare a literal `plan(N)` summing to **371**, and `00-helpers.test.sql` declares
`no_plan()` and contributes its 8 dynamically: 371 + 8 = **379**. `157-04-SUMMARY.md` recorded
`Files=11, Tests=324 → Files=12, Tests=379` with `plan(55)` in the new file; re-measured here at a
different HEAD on a freshly reset database, it holds.

**`yarn db:lint:sql` exits 1, and this is the one acceptance criterion the gate does NOT meet.**
It is recorded as measured rather than waived by citation. The run reaches the live database
(`Connecting to local database... Linting schema: public`) and reports **four advisories across three
functions**:

| Function | Level | Message |
|----------|-------|---------|
| `public.is_localized_string` | `warning extra` | never read variable `"p_key"` |
| `public._bulk_upsert_record` | `warning` | unused variable `"rel_key"` |
| `public.resolve_email_variables` | `warning extra` | unused parameter `"p_template_body"` |
| `public.resolve_email_variables` | `warning extra` | unused parameter `"p_template_subject"` |

`fail-on is set to warning, non-zero exit`. **Not one advisory names a function this phase wrote:**
grepping the output for `get_questions` and `get_nominations` returns nothing, and
`git diff 8105a43b8..HEAD -- apps/supabase` adds no definition of any of the three named functions.
So the phase introduced **zero** new advisories, and the exit code is the same one the repository has
carried since Phase 151. The criterion is **unmet for a pre-existing reason, with the reason measured**
— which is a different claim from "unmet by exclusion", and is the honest one.

### Row `CLOSE-E2E` — the cardinal gate, and the two defects it caught

| Field | Value |
|-------|-------|
| **HEAD at phase close** | **`6fb69b8a64c68ed85025c09e84bbb3223b289596`** (`6fb69b8a6`) |
| Command | **`yarn test:e2e`** — no grep, no `--project`, no `--shard`, no retry-until-green. The script itself expands to `assert:i18n-catalog-namespaces && assert:a11y-scan-wiring && playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe`; the `@probe` inversion is part of the script's own definition, not a filter added at the gate |
| Free disk before each run | **141 GiB** — checked before all three runs, never below |
| `tests/e2e-runs/` | **128 entries, none deleted.** `git status --porcelain tests` empty throughout |

**The counts, verbatim, from the run at the closing HEAD.** The suite's summary emitted exactly one
result line:

```
  150 passed (10.3m)
```

| Outcome | Count |
|---------|-------|
| passed | **150** |
| failed | **0** |
| did not run | **0** |
| skipped | **0** |
| flaky | **0** |
| interrupted | **0** |
| exit code | **0** |

There is no `failed`, `skipped`, `flaky`, `did not run` or `interrupted` line in the output at all —
Playwright emits those lines only when the corresponding count is non-zero, so their absence is the
measurement rather than an inference from the passed count.

**Three runs, and why the second and third were justified.** The project rule is that a failing spec is
diagnosed rather than re-run. Each re-run below is paired with the committed fix that earned it.

| Run | HEAD | Result | What it established |
|-----|------|--------|---------------------|
| 1 | `cb0efd10a` | `1 failed`, `77 did not run`, `72 passed` (2.1m), exit 1 | `perm-1e1cg1co` landed on the category-selection page instead of the first question. **Not re-run.** The dev-server log carried five `getAppSettings: the stored settings did not match their schema; falling back to empty settings.` records naming four paths |
| 2 | `f01448806` | `1 failed`, `77 did not run`, `72 passed` (2.1m), exit 1 | Justified by commit `f01448806`. The fix was **necessary but not sufficient**: the four `notifications.*` paths were gone and a single root-level `''` remained — zod's report for an unrecognized key at the top level. **The re-run is what proved the first fix incomplete**, which is the argument for pairing a re-run with a fix rather than with a hope |
| 3 | `6fb69b8a6` | **`150 passed` (10.3m), exit 0** | Justified by commit `6fb69b8a6`. **Zero** schema warnings in the dev-server log for the whole run, down from five |

**Two defects, one shape.** Both were introduced by this phase's own `StoredSettingsSchema`
(`157-02`), and both had the same catastrophic amplification: the schema is a `z.strictObject`, and
`SupabaseDataProvider._getAppSettings` degrades a failed parse to `{}` rather than throwing — so **one
unacceptable field silently discarded every other setting in the column**, leaving the app on shipped
defaults with no user-visible signal.

| Defect | Key | Why the stored value was legitimate | Fix |
|--------|-----|-------------------------------------|-----|
| 1 | `notifications.*.title` / `.content` required | A notification switched OFF is stored as `{ "show": false }` and carries no copy | `f01448806` |
| 2 | `analytics` absent from a strict schema | Declared on `StaticSettings` rather than `DynamicSettings`, but a real stored override: `trackingService` reads `analytics.trackEvents`, `DataConsent` reads `analytics.platform` | `6fb69b8a6` |

The behavioural consequence was `questions.questionsIntro.show: false` being discarded along with the
rest, so the voter met the category-selection page the setting exists to bypass.

**Reach beyond the test fixture.** These are not fixture defects. Defect 1 reaches any deployment with a
disabled notification; defect 2 reaches any deployment that has ever turned tracking on. In both, the
observable symptom is "some settings appear not to apply", with a `warn`-level log as the only trace.

**Non-vacuity, for defect 1.** Reverting the two `.optional()` calls fails **exactly** the new test and
no other, so the schema's three strictness levels and its wrong-typed-leaf rejection are provably
untouched by the loosening. Defect 2's fix carries its own level-3 rejection case for the same reason.

**Method note, recorded because it is the transferable part.** Defect 2 was found by **re-reading the
log paths after the first fix** rather than by assuming the first fix was the whole story. The
`log.warn` that `157-17` wired — which logs issue PATHS and never the offending value — is what made
both diagnoses readable instead of guessed. A phase that had only `build` and `test:unit` as its
backstop would have shipped both: the frontend's 932 unit tests and every build passed at run 1.

**A correction to this plan's own Task-3 step 1.** The plan and the pause handoff both prescribe
`yarn db:reset-with-data` before the suite. That is **wrong for this suite**, and the gate was run on
`yarn db:reset` instead. `db:reset-with-data` seeds the `default` template, whose `externalIdPrefix` is
`seed_` — 327 candidates, 26 questions and its own election. The suite asserts against `e2e/base`,
which the `data-setup-base` Playwright project seeds itself, and `base.setup.ts` sweeps only the
`e2e-perm-` and `e2e-bankauth-` namespaces, never `seed_`. `.github/workflows/main.yaml` isolates the
dev-seed integration job from `e2e-tests` for exactly this reason, in a comment that names the ~327
`seed_` candidates as contamination of "the `e2e/base` dataset the E2E suite asserts against"; the CI
`e2e-tests` job itself runs `supabase start` and no seed at all. `yarn db:reset` reproduces that state
exactly. (`setupFromTemplate.ts` does whitelist `seed_` in its freshness probe, so the contamination
would not have been *announced* — which makes the wrong prerequisite worse, not better.)

---

## Measurement, never citation

Restating the binding sentence this register inherits from `143-NEGATIVE-CONTROL-LEDGER.md`:

> **The word for a borrowed observation is not a legal value in any cell of this register.** Every row
> carries its own log path and the HEAD its own half was taken at.

Concretely, for this phase:

1. **No half may be inherited from another phase.** 157's guard has no predecessor; there is nothing to
   inherit even in principle.
2. **`157-15` may not claim the OLD halves retroactively.** They are measured in `157-14` at HEAD
   `aa06cbaf5` with `apps/frontend/eslint.config.mjs` at blob `10bcf84c…`, and committed before the guard
   exists. A blindness reading taken after the guard is installed measures something else.
3. **No cell may be inferred from a neighbouring cell.** An `Errors` value is read from the run's own
   output, not deduced from its exit code, and an exit code is the run's own, not another row's.
4. **A run that did not execute leaves its cells `pending`** and yields no outcome — not a pass.
