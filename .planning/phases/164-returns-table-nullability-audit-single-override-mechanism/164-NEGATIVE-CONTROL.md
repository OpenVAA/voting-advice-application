# Phase 164 — Negative Control: the `RETURNS TABLE` nullability override and its three gates

**Seven mutation runs across six rows, all observed on one machine in one session.** Every guard and
every gate this phase claims is mutated and the instrument's verdict recorded — including the two
runs that honestly come back **green**, because a control that only reports the reds it hoped for is
not a control.

- **Date:** 2026-09-03
- **Plan:** `164-04-PLAN.md` (wave 4)
- **Decisions discharged:** O-1 (criterion 2 has no owning decision — the planner chose the `137-NEGATIVE-CONTROL.md` mutation-run form over a committed-test-only form), PROH-01 (no gate reported satisfied by an instrument nobody proved can fail)
- **Requirements:** CIGATE-04, CIGATE-05
- **Precedent followed:** `.planning/phases/137-e2e-preflight-integrity-assert-the-served-application/137-NEGATIVE-CONTROL.md`

---

## 1. Why this run existed

ROADMAP Phase 164 criterion 2, **verbatim**:

> 2. `parent_nomination_id` reads as `string | null` at the consumer, and a root nomination (where
>    the value IS null) is exercised by a test that **fails if the null-guard is removed** — the
>    guard is proven live, not merely un-flagged by the compiler.

`164-CONTEXT.md` § O-1 records that this criterion is the one success criterion in the phase with
**no owning decision**: "M1–M3 cover criteria 1, 3 and 4. Criterion 2 … is uncovered by any filled
decision. The fixture exists (F7); the *mutation proof* does not." O-1 hands the planner the choice
of form and names this document's precedent. The milestone's standing rule is that **a guard is not
claimed until it has been shown to fail**, and an observation of a failure does not survive the
session that produced it. That is why it is recorded here.

**The trap this document exists to avoid.** The obvious reading of criterion 2 — "add a unit test
that goes red when the guard is deleted" — is *wrong on this code*, and the phase would have
reported a false green had it been followed without measurement. For a root nomination
(`parent_nomination_id: null`), deleting the `parentNominationId != null ?` ternary leaves
`nominationTypeById.get(null)`. `Map.prototype.get` on an absent key returns `undefined`, and
`undefined ?? null` is `null`. **The guarded and the unguarded expression produce the identical
value**, so the unit suite cannot tell them apart. Row `NC-2` measures exactly that, and it comes
back green.

The guard's live effect is **type-level**, which is what CIGATE-05 is about. Row `NC-1` is therefore
the criterion-2 failure proof, and the committed unit test from `164-01` Task 3 is a behavioural pin
rather than that proof. Recording `NC-2`'s green is what makes `NC-1`'s red mean anything.

---

## 2. Environment

Every value below was captured in the same session as the runs. A future re-run that behaves
differently should be diagnosed against this stamp before it is called a regression.

```
date:               2026-09-03T09:04:38Z (UTC)  /  2026-09-03 12:04 EEST
repo root:          /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:           0e8ed2720  branch integration/ship-12-squash
OS:                 macOS 26.5.1 arm64
Node:               v24.14.1
Yarn:               4.13.0
TypeScript (root):          5.9.3
TypeScript (supabase-types): 5.9.3
Supabase CLI:       v2.83.0 (unchanged from 164-03; see § 2a)
Migrations applied: 00001, 00002, 00003, 00004
```

### 2a. Which database state, and why it is stated

`164-03` discharged ROADMAP criterion 4 by an actual `yarn db:types` regeneration, and a regeneration
proof taken against an unexpected schema proves the wrong thing. The state above is the state that
proof was taken against, restated here so this ledger's rows are unambiguously about the same tree.
The Supabase CLI was **not** upgraded (it advertises v2.116.0 on every invocation); an unannounced CLI
bump changing generator output is threat `T-164-05`, the very thing the `supabase-types-drift` job
exists to catch, and upgrading mid-phase would conflate the observation with the thing observed.

### 2b. Anchor drift measured before anything was cited

Every anchor this plan handed me was re-measured. **The plan's principal anchor is wrong**, which is
recorded here rather than worked around, because the two rows that mutate that line would otherwise
carry a citation that does not resolve.

| Anchor as the plan gives it | Measured at HEAD `0e8ed2720` | Handling |
|---|---|---|
| The null-guard ternary is at `supabaseDataProvider.ts:301-302` | It is at **`:360-362`** (`:360` the `parent_nomination_id` read, `:361-362` the ternary) | Anchored by content. The `:301-302` form appears in the plan's `must_haves.truths`, its Task 1 `read_first`, its Task 1 action and its Task 2 `read_first`. This is the same family of drift `164-CONTEXT.md`'s banner already corrects for `:300` → `:360`. |
| `packages/shared-config/eslint.config.mjs:39` extends `plugin:@typescript-eslint/recommended` | **Exact.** `:39` is `...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'),` | Cited as given |
| `packages/shared-config/tsconfig.base.json:15` is `"strict": true` | **Exact** | Cited as given |
| NC-3 reverts the barrel's `Database` export to `./database.js` | The barrel uses **no** `.js` extension — `164-01` measured that zero barrel lines did, and CLAUDE.md's canonical package paradigm forbids `.js` on TS-internal relative imports | Mutation applied to `'./database'`, the form that actually exists |
| NC-5: the naive cast grep over the adapter directory "returns 32 hits post-`164-01` (it returned 33 before)" | **16.** `164-02` already measured this and recorded why: Phase 157 plan 07 replaced fifteen `as Json as unknown as X` casts with a zod `safeParse` *after* the 164 research pass | Re-measured independently in § 6; the plan's 32/33 pair is stale in both halves |

---

## 3. The discipline every row followed

Identical for all six rows, and stated once so each row can be read for its verdict:

1. `git hash-object <file>` captured **before** the file is touched.
2. The mutation applied.
3. The instrument run, **its exit code read directly from `$?` on the command itself — never through
   a pipe**, since a pipeline reports the last stage's status and would silently report the exit
   code of `tail` or `grep` instead of the gate's.
4. Exit code and **verbatim output** recorded in a fenced block. Never a description of the output.
5. The mutation reverted with `git checkout -- <specific file>` — never `git clean`, never a blanket
   `git checkout -- .`.
6. The revert proven **three ways**: `git diff --exit-code` returns 0, `git hash-object` equals the
   pre-captured value, and `git status --porcelain apps packages scripts` is empty.

**No mutation reached a commit.** § 8 restates that as a checked claim rather than an assurance.

---

## 4. NC-1 — the guard is live at the type level (the criterion-2 failure proof)

**Mutation.** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`, the
ternary at `:361-362` deleted so the expression becomes the bare `.get()` call:

```diff
@@ -358,8 +358,7 @@ export class SupabaseDataProvider extends supabaseAdapterMixin(UniversalDataProv
       seenNominationIds.add(row.id);
       // Build nomination object from nomination-level columns
       const parentNominationId = row.parent_nomination_id;
-      const parentNominationType =
-        parentNominationId != null ? (nominationTypeById.get(parentNominationId) ?? null) : null;
+      const parentNominationType = nominationTypeById.get(parentNominationId) ?? null;
       const nomRow = {
         id: row.id,
         name: row.name,
```

**Pre-mutation hash:** `2f9dc1225ee3a627ef882efd2f9cd0f6bd6bcfec`

**Instrument:** `yarn workspace @openvaa/frontend check`
(= `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings`)

**Verdict: RED. Exit code 1.** Verbatim:

```
1788426311374 START "/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend"
1788426311379 ERROR "src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts" 361:59 "Argument of type 'string | null' is not assignable to parameter of type 'string'.\n  Type 'null' is not assignable to type 'string'."
1788426311382 COMPLETED 2750 FILES 1 ERRORS 0 WARNINGS 1 FILES_WITH_PROBLEMS
```

The baseline for that number: on the un-mutated tree the identical command reports
`COMPLETED 2750 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, **exit 0**. One error appears, and
it is the mutated line.

### 4a. Where the error *code* comes from, stated rather than assumed

`svelte-check` prints the diagnostic **text** but not TypeScript's numeric code, so the string
`TS2345` does not appear in the output above. Rather than assert a code the instrument never printed,
it was obtained from a **second** instrument run on the same mutated tree —
`npx tsc --noEmit -p ./tsconfig.json` from `apps/frontend` — which reports, verbatim:

```
src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts(361,59): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
```

`(361,59)` is the identical position `svelte-check` reported as `361:59`, so the two instruments are
describing the same diagnostic.

**That second instrument is noisy, and the noise is accounted for rather than hidden.** Bare `tsc`
runs outside the `svelte-kit sync` context, so SvelteKit's generated `./$types` modules are not on
its path and 85 unrelated implicit-`any` errors appear. The code histogram under mutation:

```
   1 error TS2345
   9 error TS7006
  76 error TS7031
```

To prove none of that noise is mutation-caused, the same command was re-run on the **reverted** tree
and the two outputs diffed. The complete difference:

```
1a2,3
> src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts(361,59): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
>   Type 'null' is not assignable to type 'string'.
```

The mutation adds exactly the TS2345 pair and nothing else; the 85 TS7006/TS7031 lines are present in
both runs. (`tsc` exits **1** on the mutated tree and **2** on the reverted one — recorded as observed;
the gate that governs this repo is `yarn … check`, whose exit codes are the 1/0 pair above.)

**Why this is red at all:** `"strict": true` at `packages/shared-config/tsconfig.base.json:15`. Under
`strict`, `string | null` is not assignable to a `string` parameter — which is only true here because
`164-01`'s override widened `parent_nomination_id`. § 6 is the row that tests that dependency.

**Revert, proven three ways:**

| Proof | Result |
|---|---|
| `git diff --exit-code -- …/supabaseDataProvider.ts` | **exit 0** |
| `git hash-object` after | `2f9dc1225ee3a627ef882efd2f9cd0f6bd6bcfec` — **identical to the pre-capture** |
| `git status --porcelain apps packages scripts` | **0 lines** |

---

## 5. NC-2 — the disclosed limitation: the same mutation leaves the unit suite green

**Mutation:** the **same** applied mutation as NC-1 — NC-1 and NC-2 were run back-to-back against one
tree, so the two verdicts are unambiguously about the same bytes.

**Instrument:** `yarn workspace @openvaa/frontend test:unit supabaseDataProvider`

**Verdict: GREEN. Exit code 0.** Verbatim:

```
 RUN  v3.2.4 /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend

 ✓ src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts (68 tests) 16ms

 Test Files  1 passed (1)
      Tests  68 passed (68)
```

All 68 tests pass **with the null-guard deleted**, including `164-01` Task 3's committed root-nomination
test — the very test whose assertion `164-01` proved live by inversion (inverted: exit 1,
`AssertionError: expected null not to be null`; reverted: exit 0).

**Why, mechanically.** For the root nomination the guarded and unguarded expressions are the same
value:

| Expression | Root nomination (`parent_nomination_id` is `null`) |
|---|---|
| guarded: `parentNominationId != null ? (map.get(parentNominationId) ?? null) : null` | the ternary takes its `else` → `null` |
| unguarded: `map.get(parentNominationId) ?? null` | `Map.get(null)` → `undefined`; `undefined ?? null` → `null` |

Both yield `null`. The downstream `if (parentNominationId != null && parentNominationType != null)`
at `:389` then takes its `else` either way, and `parent_nomination_id: parentNominationId ?? null` at
`:377` yields `null` either way. **The runtime path is invariant under the mutation**, so no runtime
assertion — however well written — can detect the deletion.

**This is a disclosed limitation of the instrument, not a criterion failure and not a defect in the
test suite.** The criterion asks that the guard be "proven live, not merely un-flagged by the
compiler"; NC-1 proves exactly that, at the level where the guard actually bites. Recording NC-2 is
what stops NC-1's red from being read as a lucky result — and what stops a future reader from
"fixing" the unit suite to chase a red that cannot exist.

**Revert:** shared with NC-1 (same mutation, one revert) — the three proofs are in § 4.

---

## 6. NC-3 — is the override mechanism the thing keeping the guard honest?

This row reverts the **mechanism**, not the guard: the guard stays exactly as committed and
`packages/supabase-types/src/index.ts` goes back to exporting the generated `Database`.

**Mutation.** Pre-mutation hash `d29905c7bd71839a9bd64f3e15bab7db5c337972`:

```diff
@@ -1,4 +1,4 @@
-export type { Database } from './database.merged';
+export type { Database } from './database';
```

(The plan says `./database.js`. The barrel carries no `.js` extension — see § 2b — so the mutation
targets the form that exists.)

### 6a. The ESLint reading, taken before the run rather than after it

Planning predicted this row goes **green** on the grounds that `@typescript-eslint/no-unnecessary-condition`
needs type information and is not in the non-type-checked `recommended` preset. That prediction was
**not** allowed to stand in for the verdict (`T-164-12`), but the config reading it rests on was
itself measured. The commands and what they printed:

```
$ grep -rn "no-unnecessary-condition" packages/shared-config/eslint.config.mjs apps/frontend/eslint.config.mjs
grep exit=1                       # no output — the rule is configured nowhere

$ grep -rn "recommended-type-checked\|strict-type-checked\|requiring-type-checking" \
      packages/shared-config/eslint.config.mjs apps/frontend/eslint.config.mjs
grep exit=1                       # no output — no type-checked preset is extended

$ grep -n "compat.extends" packages/shared-config/eslint.config.mjs
39:  ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'),
```

So the rule that would flag a provably-unnecessary `!= null` is **off**, and nothing else in the
config turns it on. The prediction: a dead-but-legal guard, unflagged.

### 6b. The observed verdict

**Instrument:** `yarn workspace @openvaa/frontend check`

**Verdict: GREEN. Exit code 0.** Verbatim:

```
1788426416641 START "/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend"
1788426416649 COMPLETED 2749 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```

Note **2749** files, against 2750 in every other run in this document. That one-file delta is
`database.merged.ts` dropping out of the program graph, and it is the corroboration that the mutation
actually took effect rather than the barrel edit being a no-op — a green from a mutation that did not
apply would prove nothing at all.

### 6c. NC-3b — the pairing that makes NC-3 mean something

A green here says "nothing **flags** the guard". It does not by itself say "nothing **forces** it".
So a seventh run was added: **both** mutations at once — the barrel reverted *and* the guard deleted.

**Instrument:** `yarn workspace @openvaa/frontend check`

**Verdict: GREEN. Exit code 0.** Verbatim:

```
1788426440791 START "/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend"
1788426440801 COMPLETED 2749 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```

Put beside NC-1, this is the decisive pair:

| Override mechanism | Null-guard | `yarn workspace @openvaa/frontend check` |
|---|---|---|
| **on** (as committed) | present | exit **0** — 2750 files, 0 errors |
| **on** (as committed) | **deleted** | exit **1** — TS2345 (NC-1) |
| **reverted** | present | exit **0** — 2749 files, 0 errors (NC-3) |
| **reverted** | **deleted** | exit **0** — 2749 files, 0 errors (NC-3b) |

**The override is the sole reason removing the guard is detectable at all.** Without it the guard is
both unflagged and unforced: a future contributor deleting it as "obviously dead" gets a green build,
and `Nomination`'s constructor invariant
(`packages/data/src/objects/nominations/base/nomination.ts`) is the next thing to find out.

### 6d. That green is the original defect, in words

**The green in § 6b is not a passing test. It is a faithful reproduction of the defect this phase
exists to end.** With the generated `Database` in place, `parent_nomination_id` is typed `string`, so
the `!= null` guard is comparing a non-nullable value against null: dead code by the type system's
reckoning, live code by the database's. No instrument in this repository flags that contradiction,
and — per NC-3b — none forces the guard's existence either. That is precisely the "next consumer must
not have to know a folk rule" problem in `164-CONTEXT.md`'s phase boundary, and precisely what
CIGATE-05 asks be ended.

**Revert, proven three ways** (both files, one `git checkout --`):

| Proof | Result |
|---|---|
| `git diff --exit-code -- packages/supabase-types/src/index.ts …/supabaseDataProvider.ts` | **exit 0** |
| `git hash-object packages/supabase-types/src/index.ts` | `d29905c7bd71839a9bd64f3e15bab7db5c337972` — **identical to the pre-capture** |
| `git hash-object …/supabaseDataProvider.ts` | `2f9dc1225ee3a627ef882efd2f9cd0f6bd6bcfec` — **identical to the pre-capture** |
| `git status --porcelain apps packages scripts` | **0 lines** |

---

## 7. NC-4 — the enumeration gate catches a fourth RPC

Criterion 1 ends with "the enumeration is derived from the schema files, **so a future RPC is not
missed by having been overlooked in prose**". This row is the only thing that proves that clause is
real rather than aspirational.

**Mutation.** A throwaway fourth `RETURNS TABLE` function appended to
`apps/supabase/supabase/schema/900-test-helpers.sql`, written in the **real** declaration style
(`CREATE OR REPLACE FUNCTION public.<name>(` … `RETURNS TABLE (` … one `<col> <type>,` per line) so
the parser is genuinely exercised rather than side-stepped by a shape it would skip:

```sql
CREATE OR REPLACE FUNCTION public.gsd_probe_164_fourth_rpc(
  p_probe_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  probe_label text,
  probe_payload jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT NULL::uuid, NULL::text, NULL::jsonb;
$$;
```

**Pre-mutation hash:** `ffc36d22ce0bc76c90ae2dada145fe739555c016`

**Instrument:** `node scripts/assert-rpc-return-nullability.mjs`

**Verdict: exit 1.** Verbatim:

```
[ERROR] scripts/assert-rpc-return-nullability.mjs: the RPC 'gsd_probe_164_fourth_rpc' is declared in 'apps/supabase/supabase/schema' but has no derived-region entry in 'packages/supabase-types/RPC-NULLABILITY.md'. Criterion CIGATE-04 requires a remedy recorded per RPC, including "no change needed" and why. Run 'node scripts/assert-rpc-return-nullability.mjs --write' to refresh the derived region.
[ERROR] scripts/assert-rpc-return-nullability.mjs: the RPC 'gsd_probe_164_fourth_rpc' is declared in 'apps/supabase/supabase/schema' but has no disposition row in 'packages/supabase-types/RPC-NULLABILITY.md'. Criterion CIGATE-04 requires a remedy recorded per RPC, including "no change needed" and why. This half cannot be satisfied by --write: a disposition is a judgement and must be written by hand.
RPC return-nullability guard (phase 164: CIGATE-04, CIGATE-05) — 4 RETURNS TABLE RPC(s) derived from apps/supabase/supabase/schema: resolve_email_variables 4, get_nominations 32, get_candidate_user_data 15, gsd_probe_164_fourth_rpc 3; 34 snake_case column(s) in the cast alternation, 0 cast hit(s); 2 violation(s).
```

**The message names the item.** A generic "enumeration mismatch" would not have been good enough and
the script's message would have been fixed before proceeding; it names
`'gsd_probe_164_fourth_rpc'` twice and points at `packages/supabase-types/RPC-NULLABILITY.md` both
times.

**Three details in that output are worth reading, because each rules out a way this row could have
been hollow:**

1. **The parser genuinely parsed the declaration**, it did not merely count a function name: the
   summary went `3 RETURNS TABLE RPC(s)` → `4`, the new RPC is reported with its **3** columns, and
   the cast alternation went **32 → 34** names (`probe_label`, `probe_payload`; `id` was already in
   the set). A regex that matched the `CREATE` line but not the column block could not have produced
   those numbers.
2. **Both halves of the set-equality check fired**, and the second one is the one that matters. Half
   1a (the machine-owned derived region) is auto-satisfiable by `--write`. Half 1b (the hand-written
   disposition rows) says in its own message that it "cannot be satisfied by `--write`: a disposition
   is a judgement and must be written by hand". Without 1b, "a future RPC is not missed" would
   collapse into "a future RPC is auto-appended to a list nobody read".
3. **The gate reported `0 cast hit(s)` throughout.** The probe added an RPC without adding a cast, and
   only the enumeration checks fired — the checks are independently addressed, not one alarm wired to
   everything.

**Revert, proven three ways:**

| Proof | Result |
|---|---|
| `git diff --exit-code -- apps/supabase/supabase/schema/900-test-helpers.sql` | **exit 0** |
| `git hash-object` after | `ffc36d22ce0bc76c90ae2dada145fe739555c016` — **identical to the pre-capture** |
| `git status --porcelain apps packages scripts` | **0 lines** |

Gate re-run on the restored tree: **exit 0**, `3 RETURNS TABLE RPC(s) … 32 snake_case column(s) … 0
cast hit(s); 0 violation(s)`.

---

## 8. NC-5 — the criterion-3 cast gate is not vacuous

Criterion 3 ends "a grep for ad-hoc nullability casts on RPC returns comes back empty". An empty
result is indistinguishable from a grep narrowed until it cannot match — `PROH-01`, and threat
`T-164-07`, and the single most likely way this criterion gets falsely reported. This row converts
the empty result from an assurance into a measurement.

**Mutation.** The Phase-126 cast `164-01` removed, put back verbatim at the same read
(`supabaseDataProvider.ts:360`):

```diff
-      const parentNominationId = row.parent_nomination_id;
+      const parentNominationId = row.parent_nomination_id as string | null | undefined;
```

**Pre-mutation hash:** `2f9dc1225ee3a627ef882efd2f9cd0f6bd6bcfec`

**Instrument:** `node scripts/assert-rpc-return-nullability.mjs`

**Verdict: exit 1.** Verbatim:

```
[ERROR] scripts/assert-rpc-return-nullability.mjs: an ad-hoc nullability cast on an RPC return column — apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:360: const parentNominationId = row.parent_nomination_id as string | null | undefined;
        Widen the column once in 'packages/supabase-types/src/database.overrides.ts' instead, with its evidence recorded in 'packages/supabase-types/RPC-NULLABILITY.md'. A per-site cast re-asserts the same lie at every consumer and is invisible to the next reader. A COMMENT quoting the pattern counts as a hit and must be reworded, not tolerated.
RPC return-nullability guard (phase 164: CIGATE-04, CIGATE-05) — 3 RETURNS TABLE RPC(s) derived from apps/supabase/supabase/schema: resolve_email_variables 4, get_nominations 32, get_candidate_user_data 15; 32 snake_case column(s) in the cast alternation, 1 cast hit(s); 1 violation(s).
```

File, line and matched text, all three reported.

### 8a. The attribution facts — the gate is aimed correctly, measured rather than asserted

**The plan's stated attribution numbers are stale in both halves, and are corrected here rather than
copied forward.** The plan asks this row to record that "the naive grep over the adapter directory
returns 32 hits post-`164-01` (it returned 33 before)". Measured on this tree:

```
$ grep -rn " as .*| null" apps/frontend/src/lib/api/adapters/supabase/ | wc -l
      16          # on the clean tree
      17          # with the NC-5 cast applied
```

**16, not 32.** `164-02` already measured this and recorded the cause: Phase 157 plan 07 replaced
fifteen `as Json as unknown as X` casts with a zod `safeParse` *after* the 164 research pass, so the
naive population shrank. This is the third independent measurement of that number and they agree.

**The important fact is the ratio, and it survives the correction.** Under the NC-5 mutation the
naive grep returns **17** hits and the gate reports **1**. The gate therefore does not swallow the
other **16** — which are exactly the Phase-157-owned and mapper-output casts that criterion 3 puts
out of scope. Enumerated, with the one the gate reports marked:

| Naive hit | Class | Reported by the gate? |
|---|---|---|
| `utils/localizeRow.ts:25`, `:58` | localization helper, not an RPC read | no |
| `dataProvider/supabaseDataProvider.ts:299` | `constituencies.keywords`, a **table** read | no |
| `:331`, `:560` | **comment prose** quoting the pattern | no |
| **`:360`** | **the injected RPC-return nullability cast** | **YES — the only hit** |
| `:417`–`:423` (7 casts) | `entityObj.*`, the local `toDataObject()` **output** | no |
| `:576`, `:599`, `:613` | the `get_questions` **JSONB** payload (`RETURNS jsonb`, not `RETURNS TABLE`) | no |
| `:631` | `obj.name`, mapper output | no |

**The plan's Phase-157 anchors do not resolve, and were not cited as though they did.** It asks that
"none of Phase 157's anchors (`:56`, `:92`, `:368-378`, `:511`) nor the `allow_open` table-read cast
at `:573`" appear among the gate's hits. Measured, **none of those six line numbers is a cast at
all**:

```
  56: ): number {
  92: function parseStoredCustomization(raw: Json | undefined): StoredCustomization {
 368:         color: row.color,
 370:         sort_order: row.sort_order,
 374:         constituency_id: row.constituency_id,
 378:       };
 511:     }
 573:     const questionRows = new Map<string, QuestionRow>();
```

The `allow_open` cast is at **`:613`** (`164-02` measured the same). The claim's *substance* is true
and is proven above by enumeration — the gate reports 1 of 17 and that 1 is the injected cast — but
it is proven against the **measured** hit list, not against six anchors that point at a closing
brace, a function signature and a `Map` constructor.

**Revert, proven three ways:**

| Proof | Result |
|---|---|
| `git diff --exit-code -- …/supabaseDataProvider.ts` | **exit 0** |
| `git hash-object` after | `2f9dc1225ee3a627ef882efd2f9cd0f6bd6bcfec` — **identical to the pre-capture** |
| `git status --porcelain apps packages scripts` | **0 lines** |

Naive count back to **16**; gate re-run on the restored tree **exit 0**.

---

## 9. NC-6 — the Phase-156 bite: a stale override key is a loud compile error

Phase 156 rewrites the schema and renames `party` → `organization`, regenerating
`packages/supabase-types`. The property that makes an override layer survivable across that event is
that a key naming a column which **no longer exists** must be a compile error, never a silent no-op —
a silently-inert override is strictly worse than no override, because it reads as a guarantee.

**Mutation.** Exactly one key literal renamed inside the `Nullable` union, simulating a column renamed
upstream. One line changed, verified by the mutating script asserting the search string occurs exactly
once before substituting:

```diff
@@ -49,7 +49,7 @@ export type FunctionReturnOverrides = {
     'get_nominations',
     Nullable<
       'get_nominations',
-      | 'parent_nomination_id'
+      | 'parent_nomination_idX'
       | 'candidate_id'
```

**Pre-mutation hash:** `82dd060ff750a7857022e78ca039072513c93877`

**Instrument:** `yarn workspace @openvaa/supabase-types typecheck`

**Verdict: exit 2.** Verbatim:

```
src/database.overrides.ts(52,7): error TS2344: Type '"parent_nomination_idX" | "candidate_id" | "organization_id" | "faction_id" | "alliance_id" | "election_round" | "election_symbol" | "sort_order" | "subtype" | "entity_sort_order" | "entity_subtype" | "entity_first_name" | "entity_last_name" | "entity_organization_id"' does not satisfy the constraint '"candidate_id" | "organization_id" | "faction_id" | "alliance_id" | "election_round" | "election_symbol" | "sort_order" | "subtype" | "entity_sort_order" | "entity_subtype" | ... 21 more ... | "short_name"'.
  Type '"parent_nomination_idX"' is not assignable to type '"candidate_id" | "organization_id" | "faction_id" | "alliance_id" | "election_round" | "election_symbol" | "sort_order" | "subtype" | "entity_sort_order" | "entity_subtype" | ... 21 more ... | "short_name"'. Did you mean '"parent_nomination_id"'?
```

The offending literal is named twice, the constraint it violates is printed, and the compiler even
offers the correct key. This is `K extends keyof ReturnsRow<F>` — `164-01`'s `Omit`-before-redeclare
shape — doing the job it was chosen for.

**Agreement with `164-03` probe R2, and why both were run.** `164-03` performed the same class of
mutation (`parent_nomination_id` → `parent_nomination_id_dropped`) and recorded TS2344 at
`(52,7)`, exit 2. This row was run independently rather than cited, and the two agree on position,
code and exit status. Two different renames, same bite.

### 9a. A first attempt that measured the wrong thing, reported rather than quietly re-run

The first NC-6 attempt used a `perl -pi -e "s|…|…|"` substitution whose own delimiter was `|` — the
same character as the union separator being matched. The regex misfired and **prepended** the
replacement to fifteen lines instead of renaming one. The typecheck went red with **exit 2** and a
wall of `TS1005 '>' expected` / `TS1131 Property or signature expected` **syntax** errors.

**That red proved nothing about the constraint**, and it would have been easy to bank: the exit code
was non-zero, the file was `database.overrides.ts`, and a summary reading "the typecheck fails when a
key is renamed" would have been literally defensible and substantively false. A corrupted file fails
to *parse*; it never reaches the `K extends keyof ReturnsRow<F>` check at all. The mutation was
reverted (hash back to `82dd060ff…`), re-applied with a script that asserts the target string occurs
exactly once, and the row re-run — producing the TS2344 above.

Recorded for the same reason `164-03` recorded its non-firing P3 probe: the difference between "the
guard fired" and "my mutation was wrong" is only visible if the first attempt is reported. § 11
collects both episodes.

**Revert, proven three ways:**

| Proof | Result |
|---|---|
| `git diff --exit-code -- packages/supabase-types/src/database.overrides.ts` | **exit 0** |
| `git hash-object` after | `82dd060ff750a7857022e78ca039072513c93877` — **identical to the pre-capture** |
| `git status --porcelain apps packages scripts` | **0 lines** |

`yarn workspace @openvaa/supabase-types typecheck` on the restored tree: **exit 0**.

### 9b. The `tsconfig.tsbuildinfo` restore the plan prescribes does not apply

The plan requires `packages/supabase-types/tsconfig.tsbuildinfo` be restored with `git checkout --`
after this row, "because it is tracked and any `tsc` run rewrites it, which would otherwise
contaminate the revert proof". `164-03` measured that premise false; it is re-measured here and it is
still false:

```
$ git ls-files packages/supabase-types/tsconfig.tsbuildinfo
                                        # empty — the path is NOT tracked

$ git check-ignore -v packages/supabase-types/tsconfig.tsbuildinfo
.gitignore:29:*.tsbuildinfo	packages/supabase-types/tsconfig.tsbuildinfo

$ git checkout -- packages/supabase-types/tsconfig.tsbuildinfo
error: pathspec 'packages/supabase-types/tsconfig.tsbuildinfo' did not match any file(s) known to git
                                        # exit 1
```

The file exists on disk (36,761 bytes, mtime 12:11 today, so `tsc` **did** rewrite it) but it is
untracked and gitignored, so `git status --porcelain` never lists it and it cannot contaminate any
revert proof. The prescribed restore is not merely a no-op: it **errors with exit 1**, which makes
this plan's Task 2 `<verify>` chain unsatisfiable as written, since that step sits mid-`&&`-chain and
would break the chain even with every other clause green. The chain's substance was run clause by
clause instead — see § 10.

---

## 10. The six rows, side by side

| Row | Mutation | Instrument | Exit | Verdict |
|---|---|---|---|---|
| **NC-1** | null-guard ternary deleted (`supabaseDataProvider.ts:361-362`) | `yarn workspace @openvaa/frontend check` | **1** | **RED** — TS2345, `string \| null` not assignable to `string`. **The criterion-2 failure proof.** |
| **NC-2** | *the same mutation* | `yarn workspace @openvaa/frontend test:unit supabaseDataProvider` | **0** | **GREEN** — 68/68. Disclosed limitation: the runtime path is invariant. |
| **NC-3** | barrel `Database` export reverted to `./database` | `yarn workspace @openvaa/frontend check` | **0** | **GREEN** — and that green **is the original defect**, faithfully reproduced. |
| **NC-3b** | *both* — barrel reverted **and** guard deleted | `yarn workspace @openvaa/frontend check` | **0** | **GREEN** — so without the override the guard is unflagged *and* unforced. |
| **NC-4** | a fourth `RETURNS TABLE` RPC injected into the schema tree | `node scripts/assert-rpc-return-nullability.mjs` | **1** | **RED** — names `gsd_probe_164_fourth_rpc`; both set-equality halves fire. |
| **NC-5** | the Phase-126 RPC-return cast re-introduced | `node scripts/assert-rpc-return-nullability.mjs` | **1** | **RED** — file, line `:360`, matched text; 1 hit out of 17 naive. |
| **NC-6** | one override key renamed to `parent_nomination_idX` | `yarn workspace @openvaa/supabase-types typecheck` | **2** | **RED** — TS2344 naming the literal. The Phase-156 bite. |

**Restored-tree state after all seven runs**, every exit code read directly from `$?` on the command
itself:

| Check | Exit |
|---|---|
| `node scripts/assert-rpc-return-nullability.mjs` | **0** |
| `yarn workspace @openvaa/supabase-types typecheck` | **0** |
| `yarn workspace @openvaa/frontend check` | **0** (`2750 FILES 0 ERRORS 0 WARNINGS`) |
| `git status --porcelain apps packages scripts` | — (**0 lines**) |
| `git status --porcelain` (whole tree) | — (**0 lines**) |

---

## 11. Two probes that did not measure what they were aimed at

Both are recorded because a control document that reports only the mutations that behaved is not a
control document. This phase has now produced three such episodes across three plans, which is
itself the finding: **the probe is wrong more often than the guard is.**

| Episode | Plan | What happened | What it would have certified if unreported |
|---|---|---|---|
| Override-key parser | `164-02`, probe D | The first probe **did not fire**. The cause was a real hole in the guard: the key parser matched `'[a-z0-9_]+'`, so an uppercase typo key was silently dropped and check 5 reported clean over a set it had never read. Parser broadened; probe then fired. | A cross-check with no inputs, reporting clean forever. **The guard was wrong.** |
| Paths-filter reason | `164-03`, probe P3 | The first probe **did not fire**. On inspection the assertion was behaving correctly — it claims "the reason is written down somewhere in this block", and the probe removed only one of two mentions, so the reason *was* still written down. The corrected probe removed both and it fired. | Nothing false, but a chance to learn the assertion was sound would have been lost. **The probe was too weak.** |
| Union-delimiter misfire | `164-04`, NC-6 (§ 9a) | The mutation was malformed and produced a **syntax**-error red rather than the constraint red the row is about. Re-applied precisely; TS2344 obtained. | "The typecheck fails when a key is renamed" — literally true, substantively false, and it would have left the `K extends keyof ReturnsRow<F>` constraint **unproven** while appearing to prove it. **The mutation was wrong.** |

The `164-02` case is the only one of the three where the guard itself was at fault. That asymmetry is
the argument for reporting non-firing and mis-firing probes rather than re-running until green: two
of these three would have been invisible in a summary that only recorded final verdicts.

---

## 12. Verdict — evidence mapped to ROADMAP Phase 164 criteria

| ROADMAP criterion | Discharged by | Status |
|---|---|---|
| **1** — every `RETURNS TABLE` RPC enumerated, a remedy recorded per RPC including the no-changes, **derived from the schema files so a future RPC is not missed** | `packages/supabase-types/RPC-NULLABILITY.md` (3 RPCs, 51 columns, 20 override / 31 no-change, every column with an evidence cell) + `scripts/assert-rpc-return-nullability.mjs`, committed by `164-02`. The "not missed" clause is discharged by **§ 7 (NC-4)** — the only row that proves it. | **DISCHARGED** |
| **2** — `parent_nomination_id` reads `string \| null` at the consumer, and a root nomination is exercised by a test that **fails if the null-guard is removed** | **§ 4 (NC-1) alone.** With `§ 5 (NC-2)` recording the disclosed limitation and `§ 6 (NC-3/NC-3b)` proving the override is what makes NC-1 possible. | **DISCHARGED** |
| **3** — one documented mechanism not per-site casts; the Phase-126 cast removed and a grep for ad-hoc nullability casts on RPC returns comes back **empty** | `164-01` (cast removed, 1 → 0) + `164-02` (the grep made a standing `lint:check` link with a schema-derived alternation). The **empty** result is made a measurement rather than an artefact by **§ 8 (NC-5)**. | **DISCHARGED** |
| **4** — re-running `yarn db:types` does not silently revert the guarantee, **proven by regenerating and observing the outcome** | `164-03`: `yarn db:types` run against a live local Supabase (migrations `00001`–`00004`), `git diff --exit-code -- packages/supabase-types/src/database.ts` **exit 0**, sha256 unchanged; instrument proven able to report 1 by probe R1. The "or a check fails loudly" half is re-proven independently here by **§ 9 (NC-6)**. | **DISCHARGED locally** — see below |

### Which single row is criterion 2's failure proof

**`NC-1`, and only `NC-1`.**

The committed unit test at
`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts`
(`164-01` Task 3, "a ROOT nomination (`parent_nomination_id IS null`) yields `parentNominationId`
null and no `parentNominationType`") is a **behavioural pin**, not the failure proof. `164-01` proved
its assertion is live by inversion — inverted it exits 1 with `expected null not to be null` — so it
is a real test of a real value and it is worth having. But **§ 5** shows it passes with the guard
deleted, so it cannot be the test that "fails if the null-guard is removed". Reading it as that proof
is the specific error this document exists to prevent, and the phase's SUMMARY files must not be read
as claiming otherwise.

### What is explicitly NOT discharged by this document

- **The `supabase-types-drift` CI job is unobserved in CI, and nothing here changes that.**
  `.github/workflows/main.yaml` triggers only on `push`/`pull_request` against `main`; this work is on
  `integration/ship-12-squash`, which has never run CI. **No GitHub Actions run of that job exists or
  can exist on this branch** — this is a structural property of the trigger configuration, not a step
  that was skipped. Everything provable locally about the job is proven (`164-03`: YAML validity, 9
  steps, no `paths-filter`, path-scoped diff, no credential acquisition, plus a 7-assertion repo-meta
  vitest whose every assertion was made to fail). It is carried as `164-03` coverage `D6` with
  `human_judgment: true`, as a STATE blocker, and as a `WINDOWS.md` `unrun-verify` entry. **It must be
  discharged on the branch's first PR to `main`, alongside the identical standing item from Phase
  137, and must never be recorded anywhere as "verified in CI".**
- **The full E2E suite.** Not run for this plan, and not called for by it: the deliverables here are an
  evidence document and two pending-todo entries, and every source mutation was reverted to a
  byte-identical file. `164-01` ran the production frontend build and `164-02`/`164-03` ran
  `TURBO_FORCE=true yarn lint:check` (23/23 typecheck, 0 cached) on the same tree. The phase E2E gate
  is `164-05`'s, and it must run `yarn db:reset` first — `164-03` records why.
- **Anything about the deployed database.** Every row here is static: no migration was applied, no
  RPC was created in the live database (`NC-4`'s function was injected into a **schema file** and
  never executed), and no seed data was touched.
- **Non-macOS platforms.** Every measurement is macOS 26.5.1 / arm64, Node v24.14.1, Yarn 4.13.0.

### Reproducibility and non-contamination

- **No mutation reached a commit.** Checked, not asserted: after every row,
  `git status --porcelain apps packages scripts` returned **0 lines**, and at plan close
  `git status --porcelain` over the **whole tree** returned 0 lines. Every mutated file's
  `git hash-object` was captured before the mutation and re-checked after the revert; all four
  matched exactly.

  | File | Pre-mutation hash | Post-revert hash | Rows |
  |---|---|---|---|
  | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` | `2f9dc1225ee3a627ef882efd2f9cd0f6bd6bcfec` | **identical** | NC-1, NC-2, NC-3b, NC-5 |
  | `packages/supabase-types/src/index.ts` | `d29905c7bd71839a9bd64f3e15bab7db5c337972` | **identical** | NC-3, NC-3b |
  | `apps/supabase/supabase/schema/900-test-helpers.sql` | `ffc36d22ce0bc76c90ae2dada145fe739555c016` | **identical** | NC-4 |
  | `packages/supabase-types/src/database.overrides.ts` | `82dd060ff750a7857022e78ca039072513c93877` | **identical** | NC-6 |

- **Every revert used `git checkout -- <specific file>`.** No `git clean`, no `git stash`, no blanket
  `git checkout -- .`, no `git reset`. The commits this plan produced touch only
  `.planning/` — the ledger itself and the two pending-todo entries.
- **Every mutation is embedded above as a diff or a source block**, which is the reproducibility
  mechanism rather than a courtesy: a later reader can re-apply any row from this document alone.
- **Every exit code was read directly from `$?` on the command itself.** Where output needed
  filtering for readability, the command was run once to a file or to `/dev/null` for the status and
  separately for display — never `cmd | tail; status=$?`, which reports `tail`'s status.

---

## 13. NC-7 — the gap NC-3 opened, closed and probed (plan 05)

**Added by `164-05`. Operator-authorised scope addition**, cited verbatim in `164-05-SUMMARY.md`.
§ 6 above did not merely report a green: it identified a live hole in the phase's own mechanism, and
that hole was filed as `WINDOWS.md` entry **247** and
`.planning/todos/pending/2026-09-03-nothing-guards-the-supabase-types-barrel-wiring.md`. This section
records the guard written to close it and the four mutation runs that prove the guard can fail.

The operator's specification, quoted:

> new guard asserts:
>   packages/supabase-types/src/index.ts
>   re-exports from database.merged
>   (not database.ts directly)
>
> vacuity probe:
>   rewire barrel -> expect RED
>   restore        -> expect GREEN
>
> closes the last silent-revert path criterion 4 exists to prevent

### 13a. The anchor, re-measured before anything was written

The `index.ts:1` anchor arrives from `164-04`'s report, and anchors in this milestone have drifted on
eleven consecutive plans — including `164-04`'s own (`:301-302` was really `:360-362`). So the barrel
was read before the guard was written rather than after:

```
$ cat -n packages/supabase-types/src/index.ts
     1	export type { Database } from './database.merged';
     2	// `Database` expands to a structure that mentions `FunctionReturnOverrides`, …
     3	export type { FunctionReturnOverrides } from './database.overrides';
     4	// Tables/TablesInsert/TablesUpdate/Enums/CompositeTypes are NOT generic over `Database` …
     5	export type { CompositeTypes, Enums, Json, Tables, TablesInsert, TablesUpdate } from './database';
     6	export { Constants } from './database';
     7	export { COLUMN_MAP, PROPERTY_MAP, TABLE_MAP, COLLECTION_NAME_MAP } from './column-map';
     8	export type { ColumnName, PropertyName, CollectionName, TableName } from './column-map';
```

**The `:1` anchor is EXACT** — the twelfth plan is the first whose inherited anchor needed no
correction. Note lines 5 and 6 for why a bare-string check would be wrong in the other direction: the
barrel legitimately exports five other symbols straight from `./database`, so "the barrel must not
mention `./database`" would be false, and only the `Database` **export statement** distinguishes the
correct wiring from the bypass.

### 13b. What was added, and where

**Check 6 of `scripts/assert-rpc-return-nullability.mjs`**, not a new script. Measured reason for
following that precedent rather than adding a sibling: `164-02` wired `assert:rpc-nullability` as a
link of the root `lint:check` chain, and `packages/dev-seed/tests/rpcNullabilityGate.test.ts` already
pins three things about it — that the link is a member of the chain, that the script file exists, and
that it contains the `RPC RETURN-NULLABILITY GUARD` banner. A new script would have needed all three
pins rebuilt; a sixth check inherits them on the day it lands.

It asserts **both** links of the delivery chain, because the operator's named link is not the only
one of its shape:

| Link | Assertion |
|---|---|
| 1 | `packages/supabase-types/src/index.ts` re-exports `Database` from `./database.merged`, exactly once |
| 2 | `packages/supabase-types/src/database.merged.ts` declares `export type Database =` and applies `FunctionReturnOverrides` imported from `./database.overrides` |

It reads the **export statement**, never the specifier as a bare string — the risk the filed todo
named explicitly. Zero `Database` re-exports, or more than one, are violations in their own right,
for the same fail-closed reason check 3 exists.

### 13c. The four mutation runs

Pre-mutation hashes, captured before any edit: `index.ts`
`d29905c7bd71839a9bd64f3e15bab7db5c337972`, `database.merged.ts`
`81845f5b30b5f8c0f1675d32ce8305a8cf52c665`.

**NC-7a — the operator's probe: rewire the barrel.** Mutation asserted to have hit exactly the
intended line before the verdict was taken (`git diff --numstat` → `1	1`), per the § 11 lesson that
the probe is wrong more often than the guard:

```diff
-export type { Database } from './database.merged';
+export type { Database } from './database';
```

**Verdict: RED. Exit code 1.** Verbatim:

```
[ERROR] scripts/assert-rpc-return-nullability.mjs: 'packages/supabase-types/src/index.ts' re-exports 'Database' from './database' rather than from './database.merged'. That single token bypasses the whole override layer for every consumer in the monorepo: the generated type declares each RETURNS TABLE output column non-null, so a legitimate null-guard becomes dead code to the compiler and deleting it compiles clean. Measured in phase 164 plan 04 (NC-3 / NC-3b): with the barrel rewired, the frontend check stays exit 0 even with the guard deleted.
RPC return-nullability guard (phase 164: CIGATE-04, CIGATE-05) — 3 RETURNS TABLE RPC(s) derived from apps/supabase/supabase/schema: resolve_email_variables 4, get_nominations 32, get_candidate_user_data 15; 32 snake_case column(s) in the cast alternation, 0 cast hit(s); barrel exports Database from ./database; 1 violation(s).
```

The **wired** form was run on the same mutated tree, so the claim is about the gate a developer
actually runs and not only about the file: `yarn assert:rpc-nullability` → **exit 1**.

**NC-7b — the disguise a bare-string grep would pass.** The filed todo warned that greping for the
string `'./database.merged'` passes a barrel that keeps the import and stops exporting `Database`
from it. Mutation:

```diff
-export type { Database } from './database.merged';
+export type { Database } from './database';
+export type { Database as MergedDatabase } from './database.merged';
```

```
$ grep -c "\./database\.merged" packages/supabase-types/src/index.ts
1                                 # a bare-string check PASSES this bypass
$ node scripts/assert-rpc-return-nullability.mjs
[ERROR] … re-exports 'Database' from './database' rather than from './database.merged'. …
exit=1                            # check 6 catches it
```

**Verdict: RED. Exit code 1.** The naive form and the shipped form disagree, which is the whole
argument for reading the statement.

**NC-7c — the fail-closed branch.** Line 1 deleted outright, so no `Database` re-export exists:

**Verdict: RED. Exit code 1.** Verbatim:

```
[ERROR] scripts/assert-rpc-return-nullability.mjs: 'packages/supabase-types/src/index.ts' re-exports no 'Database' at all, so this check has nothing to judge and would report clean forever. Either the barrel stopped exporting the type — which breaks every consumer — or its export shape changed enough that the re-export read above sees nothing. Restore `export type { Database } from './database.merged';` or teach this check the new shape.
… barrel exports Database from NONE; 1 violation(s).
```

**NC-7d — the ambiguity branch.** A second `Database` re-export added alongside the correct one:

**Verdict: RED. Exit code 1.** Verbatim:

```
[ERROR] scripts/assert-rpc-return-nullability.mjs: 'packages/supabase-types/src/index.ts' re-exports 'Database' from 2 modules (./database.merged, ./database). Which one wins is then a question about declaration order rather than about the override, and this check will not answer it for you.
… barrel exports Database from ./database.merged + ./database; 1 violation(s).
```

**NC-7e — link 2, and the measurement that proves it is a real gap and not a manufactured one.** The
merge module rewired to re-export the generated type, leaving the **barrel itself looking correct**:

```diff
-import type { FunctionReturnOverrides } from './database.overrides';
-import type { Database as GeneratedDatabase } from './database';
-
-export type Database = Omit<GeneratedDatabase, 'public'> & {
-  public: Omit<GeneratedDatabase['public'], 'Functions'> & {
-    Functions: Omit<GeneratedDatabase['public']['Functions'], keyof FunctionReturnOverrides> & FunctionReturnOverrides;
-  };
-};
+export type { Database } from './database';
```

| Instrument | Exit | Verdict |
|---|---|---|
| `yarn workspace @openvaa/frontend check` | **0** | **GREEN** — `COMPLETED 2750 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`. The same blindness § 6 measured for link 1, measured again for link 2. |
| `node scripts/assert-rpc-return-nullability.mjs` | **1** | **RED**, two violations, verbatim below |

```
[ERROR] scripts/assert-rpc-return-nullability.mjs: 'packages/supabase-types/src/database.merged.ts' declares no `export type Database =`. The merge is the second link of the chain, and a module that re-exports the generated type instead of intersecting the overrides into it bypasses the override just as completely as a rewired barrel does — while leaving the barrel itself looking correct.
[ERROR] scripts/assert-rpc-return-nullability.mjs: 'packages/supabase-types/src/database.merged.ts' does not import 'FunctionReturnOverrides' from './database.overrides'. Whatever it is applying, it is not the reviewed override locus.
```

A **first, weaker version of this probe is reported rather than discarded**, per § 11's standing
practice: it replaced only the type body (`export type Database = GeneratedDatabase;`) and left the
now-orphaned `FunctionReturnOverrides` import in place. Check 6 fired correctly, but that mutation is
not the honest bypass — an unused import is exactly the kind of thing lint notices, so the run would
have been silent about whether anything **else** catches the bypass. The mutation above removes the
orphan, and the frontend-check row is the answer: **nothing else catches it.**

### 13d. Restored, proven

| Proof | Result |
|---|---|
| `git diff --exit-code -- packages/supabase-types/src/index.ts packages/supabase-types/src/database.merged.ts` | **exit 0** |
| `git hash-object packages/supabase-types/src/index.ts` | `d29905c7bd71839a9bd64f3e15bab7db5c337972` — **identical to the pre-capture** |
| `git hash-object packages/supabase-types/src/database.merged.ts` | `81845f5b30b5f8c0f1675d32ce8305a8cf52c665` — **identical to the pre-capture** |
| `node scripts/assert-rpc-return-nullability.mjs` on the restored tree | **exit 0**, `barrel exports Database from ./database.merged; 0 violation(s).` |
| `git status --porcelain apps packages tests .github` | — (**0 lines**) |

### 13e. What NC-7 does and does not close

- **Closes:** the silent-revert path § 6 exposed. Both bypasses now redden `yarn lint:check`, which
  every developer runs and which `164-03`'s repo-meta spec pins the link of.
- **Does not close:** the deeper question of whether the override's *contents* are right — that is
  checks 1 and 5 and the `RPC-NULLABILITY.md` dispositions, and NC-4/NC-5/NC-6 already speak to it.
- **Does not make criterion 2's proof a committed test.** NC-1 remains the only failure proof, and
  § 5's disclosed limitation is unchanged by anything here. Check 6 protects the *mechanism* that
  makes NC-1's red possible; it does not itself detect a deleted null-guard.
- **The check is a text read, deliberately.** No TypeScript parser is a dependency of this
  repository, and the house style for these assert scripts is Node built-ins only. The cost is that
  an export shape check 6 cannot parse reads as zero `Database` exports — which is why zero is a
  violation naming that possibility rather than a pass.

---

## Gates

**Seven gates, one HEAD, every cached gate forced rather than replayed.** Recorded by `164-05`.

- **HEAD:** `57204c21bc767e626ca639239c6f91e84126a218` (`57204c21b`)
- **Tree:** `git status --porcelain` **0 lines** before gate 1 and after gate 7
- **Machine:** macOS 26.5.1 / arm64, Node v24.14.1, Yarn 4.13.0, Supabase CLI v2.83.0, 85 GiB free
- **Logs:** `tests/e2e-runs/164-05-cardinal-gate/` — `gate1-unit.log`, `gate2-lint.log`,
  `gate3-format.log`, `gate4-build.log`, `gate5-check.log`, `gate6-typecheck.log`, `db-reset.log`,
  `run.log` (the E2E suite), `dev-server.log`. The directory is gitignored (`.gitignore:50`), which
  is why the tree stays clean with the logs on disk.

### Why the ladder ran at a commit later than `164-04`'s HEAD

Plan `164-05` says that if any gate forces a code change, the whole ladder is re-run from gate 1 at
the new HEAD rather than resumed. The operator-authorised addition in § 13 **is** a code change, so
it was written, probed and committed **first**, and the ladder then ran once at the resulting HEAD.
That is the same rule applied in advance instead of after a red. No gate below was run at any other
commit.

### The seven

| # | Command | Exit | Cache verdict | Evidence |
|---|---|---|---|---|
| 1 | `DEV_SEED_INTEGRATION_REQUIRED=1 TURBO_FORCE=true yarn test:unit` | **0** | `Cached: 0 cached, 25 total` | `Tasks: 25 successful, 25 total`, `Time: 29.599s` |
| 2 | `TURBO_FORCE=true yarn lint:check` | **0** | `0 cached, 11 total` (lint) + `0 cached, 23 total` (typecheck) | 0 errors; 18 warnings, all pre-existing |
| 3 | `yarn format:check` | **0** | n/a | `All matched files use Prettier code style!` ×2 |
| 4 | `TURBO_FORCE=true yarn build` | **0** | `Cached: 0 cached, 14 total` | `Tasks: 14 successful, 14 total`, `Time: 21.753s` |
| 5 | `yarn workspace @openvaa/frontend check` | **0** | n/a | `COMPLETED 2750 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 6 | `TURBO_FORCE=true npx turbo run typecheck` | **0** | `Cached: 0 cached, 23 total` | `grep -c 'error TS'` → **0**; `@openvaa/supabase-types:typecheck: cache bypass, force executing c79a92849e77e406` |
| 7 | `yarn test:e2e` | **0** | n/a | 155 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run, 10.9m |

Every exit code was read directly from `$?` on the command itself, never through a pipe.

### Gate 1 — the unit suite, and the "did not run" that would have voided it

224 test files, **2759 tests, every one passed**, across 11 workspaces:

| Workspace | Files | Tests | Workspace | Files | Tests |
|---|---|---|---|---|---|
| `@openvaa/supabase` | 6 | 55 | `@openvaa/llm` | 2 | 39 |
| `@openvaa/core` | 3 | 8 | `@openvaa/question-info` | 2 | 22 |
| `@openvaa/matching` | 5 | 43 | `@openvaa/argument-condensation` | 6 | 30 |
| `@openvaa/data` | 47 | 244 | `@openvaa/dev-seed` | 54 | 610 |
| `@openvaa/filters` | 1 | 22 | `@openvaa/frontend` | 88 | 1591 |
| `@openvaa/app-shared` | 10 | 95 | | | |

**Zero skips, counted rather than read.** `grep -cE 'Tests .*(skipped|todo)'` over the log returns
**0**; the single `skipped` string in the whole 1573-line log is the coverage guard's own prose about
a non-workspace directory (`1 non-workspace entr(ies) skipped: apps/node_modules`), not a test.

**The live-Supabase dev-seed integration tests EXECUTED**, which is the specific did-not-run the plan
names. Verbatim, with the wall-clock time that only a real database write produces:

```
@openvaa/dev-seed:test:unit:  ✓ tests/integration/default-template.integration.test.ts (3 tests) 10927ms
@openvaa/dev-seed:test:unit:    ✓ default template integration (DX-03) > applies default template and meets the NF-01 operation budget + assertions  8246ms
```

### Gate 2 — the new link, observed running

Check 6 shipped in § 13 rides the `assert:rpc-nullability` link `164-02` added to `lint:check`. That
it **runs there** is not inferred from the `package.json` chain; it is the last line of gate 2's own
output:

```
RPC return-nullability guard (phase 164: CIGATE-04, CIGATE-05) — 3 RETURNS TABLE RPC(s) derived from apps/supabase/supabase/schema: resolve_email_variables 4, get_nominations 32, get_candidate_user_data 15; 32 snake_case column(s) in the cast alternation, 0 cast hit(s); barrel exports Database from ./database.merged; 0 violation(s).
```

The `barrel exports Database from ./database.merged` clause is check 6 reporting the value it
resolved, so a future reader can tell a check that ran from a check that was skipped.

### After gate 6 — the prescribed `tsbuildinfo` restore, for the third time

The plan prescribes `git checkout -- packages/supabase-types/tsconfig.tsbuildinfo` after gate 6, on
the stated premise that the file is tracked. **It is not.** Measured at this HEAD, agreeing with
`164-03` (its deviation 2) and `164-04` (§ 9b, `WINDOWS.md` 245):

```
$ git ls-files packages/supabase-types/tsconfig.tsbuildinfo
                                   # empty — untracked
$ git check-ignore -v packages/supabase-types/tsconfig.tsbuildinfo
.gitignore:29:*.tsbuildinfo	packages/supabase-types/tsconfig.tsbuildinfo
$ git checkout -- packages/supabase-types/tsconfig.tsbuildinfo
error: pathspec 'packages/supabase-types/tsconfig.tsbuildinfo' did not match any file(s) known to git
exit=1
```

The acceptance criterion's **substance** — a clean tree after gate 6 — holds regardless and was
checked directly: `git status --porcelain` returned 0 lines. The `tsc` runs did rewrite the file; git
never sees it. Third independent confirmation; the premise is stale in the plan, not in the tree.

### The phase's own instruments, re-run at this HEAD

| Instrument | Result |
|---|---|
| `node scripts/assert-rpc-return-nullability.mjs` | **exit 0**, 0 violations, 3 RPCs, 51 columns |
| Criterion 3 — check 4's schema-derived cast grep over `apps`, `packages`, `tests` | **0 hits** |
| Criterion 3 — `grep -rn "parent_nomination_id as string"` (the Phase-126 cast by content) | **0 hits** |

**One discrepancy, measured and explained rather than smoothed over.** A deliberately wider
hand-written grep — one that adds the non-underscore column `subtype` to the alternation the script
derives — returns **1** hit:

```
apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:422:          subtype: entityObj.subtype as string | null | undefined,
```

It is **not** a criterion-3 violation and the gate is right to exclude it: the receiver is
`entityObj`, the return of `toDataObject(entityRow, …)` constructed at `:411`, not an RPC row. It is
one of the 16 mapper-output casts `164-02` enumerated and `164-04` § 8a re-measured. The script's
alternation is restricted to columns containing an underscore, which is what keeps a cast on a bare
property such as `subtype` out of a gate aimed at RPC return columns.

### Gate 7 — the cardinal gate

**Ordering, recorded because it is the mechanism that voided a prior phase's attempt.** `yarn
db:reset` ran **after** gate 1 and **before** gate 7 — gate 1's dev-seed integration test writes the
`default` template into the live database with no teardown, while the suite asserts against
`e2e/base`. Exit 0, `Finished supabase db reset on branch main.`

**One dev server, freshly started, and no second process on the port:**

```
$ lsof -nP -iTCP:5173 -sTCP:LISTEN
COMMAND   PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    64742 kallejarvenpaa   67u  IPv6 0xbead45cf6e56cb73      0t0  TCP [::1]:5173 (LISTEN)
```

**The preflight passed** — the served application proved it came from this checkout, not merely that
something answered on the port:

```
E2E PREFLIGHT OK /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend (verified against /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd)
```

Two static gates ran ahead of the suite, as `package.json:30` chains them: the i18n catalog-namespace
guard (596 keys, 0 violations) and the a11y-scan wiring guard (0 violations).

**The tallies, each obtained by searching the log — not by reading the summary line:**

| Tally | How it was counted | Result |
|---|---|---|
| announced | `grep -oE 'Running [0-9]+ tests using [0-9]+ workers'` | `Running 155 tests using 6 workers` |
| **did-not-run** | distinct `[N/155]` progress markers in the log, `sort -u \| wc -l` | **155** — every announced test emitted its own marker, so none was announced and then not executed |
| **passed** | `grep -oE '[0-9]+ passed'` | **155** |
| **failed** | `grep -cE '(^\|[^a-z])[0-9]+ failed\|✘\|✗\|Error: '` | **0** |
| **flaky** | `grep -cE 'flaky'` | **0** |
| **skipped** | `grep -cE 'skipped'` | **0** |
| interrupted | `grep -cE 'did not run\|interrupted\|Interrupted'` | **0** |

Wall clock **10.9m**. The highest marker reached is `155/155` and the count of distinct markers is
also 155, which is the pair that rules out a gap: a spec announced but never executed would leave the
distinct count below the announced count while a summary line could still read green.

**Nothing was skipped, retried to green, or annotated flaky.** Checked, not asserted:

```
$ git diff 4423b3429 HEAD -- tests/ | grep -cE '^\+.*(test\.skip|test\.fixme|retries)'
0
```

No `test.skip`, no `test.fixme`, no added retry configuration — over this plan's committed work and
over the working tree alike. No failure was diagnosed as "pre-existing", because there was no
failure to diagnose.

### The code-review checklist, run rather than asserted

`CLAUDE.md` requires every change be checked against `.agents/code-review-checklist.md`. Checked over
the phase's whole source diff — `git diff edd8265c1 HEAD -- apps packages scripts tests .github`, ten
files, +1290 / −5 — with each item's disposition recorded:

| Item | Disposition |
|---|---|
| Changes solve the stated problem | **Met.** Criteria 1–4 map to shipped artefacts in § 12; criterion 4's last silent-revert path is closed by § 13. |
| OWASP top 10 | **Met, narrowly applicable.** The diff adds no request handling, no authn/authz path and no user input surface. The one runtime-reachable change is a type widening plus two `?? ''` fallbacks. The new CI job acquires no credential: `grep -cE '^\+.*echo .*(ANON_KEY\|SERVICE_ROLE\|SECRET\|TOKEN)'` over the `.github` diff → **0**, and `164-03`'s repo-meta spec asserts the absence of `set -x` too. |
| Code style guide | **Met.** `yarn format:check` exit 0 (gate 3); `yarn lint:check` 0 errors (gate 2). |
| Avoid `any` | **Met.** Every `\bany\b` on an added line is prose in a comment or a markdown artefact; **0** occurrences in code. No `@ts-ignore`, no `@ts-expect-error`, no `eslint-disable`, and **0** non-null assertions added. |
| No repetition | **Met, and it is the point of the phase.** The change replaces a per-site cast with one override locus; check 4 is the standing guard against the repetition returning. |
| New entities documented | **Met.** Every new module and type carries a docblock stating the incident it exists for — `database.overrides.ts`, `database.merged.ts`, the guard script's six-check header, the repo-meta spec's three-section preamble. |
| Repo docs updated | **Met.** `packages/supabase-types/RPC-NULLABILITY.md` is new and is the enumeration artefact; no other doc's claims are touched by the diff. |
| Tracking events | **N/A.** No user-facing function added. |
| Svelte component guidelines | **N/A.** No `.svelte` file in the diff. |
| Errors handled and logged | **Met.** The adapter change makes a previously invisible null a smart default (`?? ''`) with the SQL-side invariant chain written down at the site; the guard script exits 1 naming the specific problem rather than throwing. |
| Troubleshoot failing checks | **Met.** Seven gates, all green, recorded above. |
| Shared dependencies not unduly affected | **Met and measured.** The widened `Database` is what every Supabase consumer compiles against; gate 5 (2750 files, 0 errors, 0 warnings) and gate 4's `@openvaa/frontend:build` are the reach check, and gate 7 is the behavioural one. |
| WCAG A/AA · keyboard · screen reader | **N/A to the diff**, and covered anyway by gate 7's `a11y-smoke` project and the a11y-scan wiring guard, both green. |
| Developers'/Publishers' guide entries | **N/A.** No documented user-facing or publisher-facing behaviour changes. |
| Clean, linear commit history | **Met.** Conventional-commit subjects scoped `164-0N`, one concern each, no merge commits. |
| Supabase Backend section | **N/A.** No migration, no table, no RLS policy, no trigger, no `SECURITY DEFINER` function in the diff. `900-test-helpers.sql` was mutated for NC-4 and restored byte-identically. |
| Supabase Adapter section | **Met.** The one adapter change is inside the existing `supabaseAdapterMixin` class and does not touch `init({ fetch })`, `COLUMN_MAP`/`PROPERTY_MAP` usage, or `safeGetSession()`. |
| Edge Functions section | **N/A.** No file under `apps/supabase/supabase/functions/` in the diff. |

### The one thing this section does NOT claim

**The `supabase-types-drift` CI job remains unobserved, and gate 7 does not change that.** All seven
gates above are local. `.github/workflows/main.yaml` triggers only on `main`, this branch has never
been pushed, and **no GitHub Actions run of that job exists or can exist on this branch**. It stays
carried as `164-03` coverage `D6` (`human_judgment: true`), as a STATE blocker, and as `WINDOWS.md`
entry 242. It must never be recorded anywhere as verified in CI.

_Phase: 164-returns-table-nullability-audit-single-override-mechanism · Plans 04 and 05 · Recorded 2026-09-03_
