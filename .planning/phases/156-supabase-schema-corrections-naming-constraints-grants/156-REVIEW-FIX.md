---
phase: 156-supabase-schema-corrections-naming-constraints-grants
fixed_at: 2026-08-30T17:20:00Z
review_path: .planning/phases/156-supabase-schema-corrections-naming-constraints-grants/156-REVIEW.md
iteration: 1
fix_scope: all
findings_in_scope: 18
fixed: 18
skipped: 0
withdrawn: 0
status: all_fixed
---

# Phase 156: Code Review Fix Report

**Fixed at:** 2026-08-30
**Source review:** `156-REVIEW.md` (0 critical, 10 warning, 8 info)
**Iteration:** 1

**Summary:**

- Findings in scope: 18 (all, `fix_scope: all`)
- Fixed: 18
- Skipped: 0
- Premises withdrawn as false: 0 — every finding's premise was checked against the file and held

Three findings had a **sub-part deliberately declined** with the reason recorded in the commit and
below (WR-04's signature change, IN-04's runtime guard, IN-07's revert). One finding (WR-05) was
resolved by amending the record rather than changing code, which is one of the two dispositions the
finding itself offered — and the code change it suggested was measured to be **wrong**.

---

## Gates run

`workflow.use_worktrees` is `false` in `.planning/config.json`, so all work was done and committed
directly in the main checkout at
`/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd`. No worktree was created.
**Every verification below ran in the main checkout**, not in an isolated worktree, so the numbers
are reproducible from the tree you are reading.

| Gate | Command | Result |
|---|---|---|
| pgTAP baseline (pre-fix) | `npx supabase test db` | `Files=11, Tests=317, Result: PASS` |
| pgTAP final | `npx supabase test db` | `Files=11, Tests=324, Result: PASS`, zero `not ok` |
| Schema/migration parity | `yarn assert:schema-migration-parity` | green — `24 schema file(s) -> 3350 lines; 00001 -> 3342 lines; 4 hunks, 11 signature lines; matches` |
| Migration replay | `yarn db:reset` | clean; `00001`/`00002`/`00003` all applied |
| Unit (all workspaces) | `yarn test:unit` | **25/25 tasks successful**, exit 0 |
| Frontend typecheck | `yarn typecheck` | `svelte-check found 0 errors and 0 warnings`, 22/22 |
| Tests typecheck | `yarn typecheck:tests` | exit 0 |
| Full build | `yarn build` | exit 0, 14/14 |
| **Full E2E** | `yarn test:e2e` | **150 passed, exit 0** — cardinal-clean |
| Prettier (review-fix diff) | `prettier --check` | clean after the `style(156)` commit |

`+7` on the pgTAP count is the seven assertions this pass added (WR-01 ×1, WR-03 ×1, WR-04 ×2,
IN-02 ×2, IN-03 ×1). `plan()` was bumped in lockstep in every file that gained one.

### Two false alarms, both mine, both resolved — recorded so they are not mistaken for defects

1. **A first full E2E run reported `7 failed, 79 did not run`.** That run was against a dirty
   database: for the IN-07 verification I had hand-seeded `--template e2e/base`, and the a11y
   spec's teardown removed only part of it. The failures were all data-shape
   (`"Economy & Taxation"` where `/Base Opinion Questions/` was expected, `16 > 13` matches,
   missing alliance elements) — none reachable from any file this pass touched. After
   `yarn db:reset` + a fresh dev server, the **full suite passed 150/150 (10.3m, exit 0)**. The
   clean run is the one that counts; the dirty one is recorded because "did not run" counts as a
   failure in this project and a silent re-run would have hidden it.
2. **A `yarn build` failure — `'@openvaa/app-shared' does not provide an export named 'getLocalized'`.**
   Self-inflicted: I killed the `tsup` watcher mid-write, leaving a truncated
   `packages/app-shared/dist`. `getLocalized` is exported from source
   (`packages/app-shared/src/index.ts:5`). `rm -rf packages/app-shared/dist && yarn build` → exit 0.

### Two conditions in the tree that are NOT from this pass

- **A concurrent session is working phase 157 in this same checkout.** Three commits
  (`abfc9feec`, `dba2215d8`, `ffc835436`, all `157-01`, timestamped 16:58–16:59) landed on top of
  my last fix commit while my E2E suite was running, and `packages/app-shared/src/index.ts` +
  `src/logging/logger.test.ts` are currently **modified but uncommitted** in the working tree. I
  left them untouched and uncommitted.
- **`yarn lint:check` exits 1**, on
  `packages/app-shared/src/logging/logger.test.ts:8:46 — 'import()' type annotations are forbidden`.
  This is **phase 157's file, not mine**: `git show 8105a43b8:packages/app-shared/src/logging/logger.test.ts`
  → `fatal: path ... exists on disk, but not in '8105a43b8'`. Every workspace this pass touched
  lints clean: `@openvaa/frontend` 0 errors, `@openvaa/dev-seed` 0 errors,
  `eslint tests` 0 errors (2 pre-existing warnings in untouched files).
- `yarn db:lint:sql` still exits 1 on the four pre-existing plpgsql advisories from phase 151. Not
  run against, not touched, per the brief.

### Database state left behind — action for you

I ran `yarn db:reset` twice and then a full E2E suite, whose teardowns emptied the fixture data. The
local database is therefore at **migrations + `seed.sql` only**, with no dev data. Run
`yarn db:reset-with-data` when convenient. I deliberately did **not** reseed, because the concurrent
157 session may be mid-run against this database. **I did not regenerate types** at any point, per
the brief.

---

## Fixed Issues

### WR-01: The `updated_at` trigger assertion is vacuous
**Commit:** `9ac8b6e56` · **File:** `apps/supabase/supabase/tests/database/09-column-restrictions.test.sql`

The backdate fired the very trigger it was preparing to observe, so `updated_at` was `now()` and the
closing assertion compared `now() > 'epoch'`. Disabled `set_updated_at` across the backdate and
added an assertion that the pre-state actually landed.

**Verified in both directions, against the running database** — this is the finding's own stated
acceptance test ("the assertion must fail if the candidate's UPDATE is deleted"):

| State | Result |
|---|---|
| pre-fix, candidate UPDATE neutralised | `Files=11, Tests=317, Result: PASS` ← vacuous, confirmed |
| post-fix, candidate UPDATE neutralised | `Tests: 26 Failed: 1`, `Result: FAIL` |
| post-fix, unmodified | `Files=11, Tests=318, Result: PASS` |

### WR-02: The workspace README said the parity gate does not exist
**Commit:** `bafedea15` · **File:** `apps/supabase/README.md`

Replaced the bold **"Nothing verifies that they agree."** with the gate, both command names, and
both of its limits. Link position confirmed as the twelfth against `package.json:43`.

### WR-03: No assertion that the retired `has_role(text, text, uuid)` is absent
**Commit:** `61f37079b` · **File:** `10-schema-migrations.test.sql`

Added the `hasnt_function`. **Falsified before accepting**: with a real `has_role(text, text, uuid)`
created in the live database the suite reports `Tests: 85 Failed: 1, Result: FAIL`; dropped again,
`Tests=319, Result: PASS`.

### WR-04: `upsert_answers`'s fall-through safety asserted in a comment
**Commit:** `328b8e635` · **Files:** `schema/503-entity-rpcs.sql`, `migrations/00001`, `10-schema-migrations.test.sql`

Comment now separates what the control flow enforces from what the function merely relies on, and
names the route by which the id-disjointness assumption could be violated. Added the missing
negative for the widened branch (`organization_a` cannot write `org_b`) plus a read-back proving
nothing landed. `Tests=321, PASS`; parity green.

> **DECLINED — the `p_entity_type` parameter.** It changes the signature, which this phase's own
> `156-DISPOSITIONS.md` Entry 6 records as unchanged and source-compatible, and it needs a
> `yarn db:types` regeneration the brief scoped out. Recorded rather than done silently.

### WR-05: The widened organization branch is unreachable from the application
**Commit:** `2892e56ca` · **File:** `156-DISPOSITIONS.md` (planning artifact; no code changed)

Premise verified true: `_setAnswers` hard-rejects every type but `Candidate`, and no roadmap phase
plans the consumer. Amended Entry 6 to say the consumer is **prospective, not existing**, and
restated the decision on its true, narrower ground.

> **The review's suggested code fix is wrong, and the amendment says so.** Everything after that
> guard in `_setAnswers` is candidates-specific — the project-id lookup is `.from('candidates')` and
> the upload path is `${projectId}/candidates/${id}/…`. Widening the type check alone would send an
> organization write to a candidates lookup that cannot find the row, or to a candidate-shaped
> storage path. The guard is load-bearing until those move with it; the record now tells whoever
> adds the consumer exactly that.

### WR-06: The repo's own backend reference still teaches the retired vocabulary
**Commit:** `baecab937` · **Files:** `.claude/skills/database/{SKILL.md, rls-policy-map.md, schema-reference.md, extension-patterns.md}`

Vocabulary swept (`party` → `organization` in both enums, `scope_type` retyped, policy renamed,
fixture user `party_a` → `organization_a`). The security-relevant half — the grant lists — was
restated **from the catalogue, not from the old prose**:

```
authenticated UPDATE columns: candidates 10, organizations 8
candidates has a 'name' column: 0 rows in information_schema.columns
```

matching `303-column-grants.sql` exactly. `sort_order`, `created_at`, `updated_at` moved into the
protected lists. Beyond the finding's line list: SKILL.md carried a second copy of the WR-02
falsehood and an obsolete note about stale headers, and **15 distinct non-existent schema filenames**
were cited across the four files — all remapped, with a check that every cited `NNN-name.sql`
resolves on disk now coming back clean.

### WR-07: A pgTAP header still listed the revoked columns as allowed
**Commit:** `d3a67cb06` · **File:** `05-organization-admin.test.sql`

List transcribed from the `GRANT` itself. `Tests=323, PASS`.

### WR-08: The `Depends on:` renumbering sweep stopped short
**Commit:** `0afaed022` · **Files:** 6 schema files + `migrations/00001`

Ten retired filenames remapped, **identically in both copies** (20 references each side — the equal
counts are what keep parity green). Beyond the four files named: `200-indexes.sql:36` and
`302-rls.sql:4` carried the same retired names in prose and would have been the next sweep's gap.

Verified: all ten target filenames exist on disk; a grep for all ten retired names across `schema/`
and `00001` returns nothing; parity green; `Tests=323, PASS`.

### WR-09: `is_image` swallows every error class
**Commit:** `4c683085e` · **Files:** `schema/011-validation-functions.sql`, `migrations/00001`

`WHEN others` → `WHEN raise_exception`. Correct because `validate_image` signals every rule with a
bare `RAISE EXCEPTION` (SQLSTATE P0001). **Measured against the applied database, both directions:**

```
new handler, validate_image renamed away -> ERROR: function public.validate_image(jsonb) does not exist   (propagates)
old WHEN others handler, same break      -> f                                                             (silently lies)
normal verdicts: is_image('{"path":"a.png"}') = t,  is_image('{"alt":"x"}') = f
```

Also recorded why the function has no caller (predicate half of the image-shape rule; intended
consumers are a CHECK constraint and a bulk_import pre-flight) rather than leaving that unexplained.
`yarn db:reset` replays it; the applied catalogue carries `WHEN raise_exception`.

### WR-10: The parity guard's stated limits omit its largest blind spot
**Commit:** `739346113` · **File:** `scripts/assert-schema-migration-parity.mjs`

Header now states both limits, with `get_nominations` named as the concrete three-copy case. The
schema concatenation got a guaranteed newline separator. `node --check` passes; census unchanged.

### IN-01: pgTAP assertion numbering renumbered only where the diff touched it
**Commit:** `73450d94a` · **File:** `10-schema-migrations.test.sql`

Took the finding's **second** option — drop the numbers — rather than its first. Measured
justification: this is the **only file of the eleven** in the suite carrying a hand-maintained index
(63 numbered comments here, **0** in every other file). Renumbering would have preserved the defect
class; dropping converges it on the suite's own convention. A header note records why. 62 comment
lines changed and no SQL, verified by diffing with every `-- ` line excluded (yields nothing).

### IN-02: The cascade's behavioural assertion does not observe the cascade
**Commit:** `9ba7f7148` · **File:** `10-schema-migrations.test.sql`

Added the post-delete count **and** a pre-delete count — 0 after proves nothing unless it was not 0
before, which is the same vacuity trap as WR-01 and is closed here rather than reintroduced.
`Tests=323, PASS`.

### IN-03: The new CHECK constraint is unnamed
**Commit:** `707136912` · **Files:** `schema/104-nominations.sql`, `migrations/00001`, `10-schema-migrations.test.sql`

Confirmed against the live catalogue **before** editing that the generated name was already exactly
`nominations_election_round_check`, so this declares the existing name rather than changing it. Added
an assertion so the name is load-bearing rather than decorative. `db:reset` replays it under the same
name. `Tests=324, PASS`.

### IN-04: The JWT retype is half-applied
**Commit:** `430f961f3` · **Files:** `admin/login/+page.server.ts`, `candidate/login/+page.server.ts`

Third site retyped to match the other two. Also recorded at both annotated sites that the annotation
is an assertion and not a check. Type-only. `yarn typecheck` 0 errors/0 warnings; frontend
`test:unit` 54 files / 816 passed.

> **DECLINED — the `Constants.public.Enums.user_role_type.includes()` runtime guard and the
> pre-existing `atob`-on-base64url brittleness.** Both change runtime behaviour in an auth path,
> which pulls in the E2E gate; the brief scoped this pass to docs and test assertions. Flagged here
> rather than half-done. Neither is a live vulnerability (RLS re-checks server-side, and the decision
> is already deny-by-default).

### IN-05: The rename is half-applied inside dev-seed's own tests
**Commit:** `9a81b39e0` · **Files:** `default.test.ts`, `nominations-override.test.ts`

`eightParties()` → `eightOrganizations()` (12 call sites), `seed_party_N` → `seed_org_N`, titles and
ALLIANCE_MEMBERSHIP prose. **Deliberately left carrying the word:** Test 30 and its comment, which
assert the *absence* of the retired idiom (`expect(id).not.toMatch(/party_/)`) — renaming those would
delete the assertion's subject. `53 files / 603 tests passed`, unchanged from the review's baseline.

### IN-06: Component doc comments renamed in `.svelte` but not `.type.ts`
**Commit:** `836d11738` · **File:** `EntityTag.type.ts`

Comment only. The wider `entityDetails`/`entityCard` mentions are the political-party domain concept
and were left, as the finding directs.

### IN-07: The a11y assertion change loosens the assertion
**Commit:** `8105a43b8` · **File:** `tests/tests/specs/a11y/a11y-smoke.spec.ts`

> **DECLINED — the revert.** The brief raised reverting as possibly correct. It is not: the
> `expect.poll` is the right web-first fix for a real rAF/`afterNavigate` ordering race, and
> reverting would reintroduce a flake. CLAUDE.md's cardinal rule is that a flaky test is a defect to
> iron out, never something to revert into.

Took the reviewer's **second** option, which is the part that was genuinely weaker: `expect.poll`
stops at the first true sample, so focus that lands and then moves away still passed. Added a single
immediate re-read, which can only fail if focus left the heading after the poll saw it there.

Verified by running it: `yarn typecheck:tests` exit 0; the whole a11y spec **18 passed (58.3s)**; the
focus test `--repeat-each=5` **7 passed**; and after the later prettier reflow, `--repeat-each=3`
**5 passed**. Additionally green inside the full 150/150 suite.

The finding's other note — that this landed in a Supabase-schema phase with no plan entry claiming
it — is a record-keeping observation with no code fix, carried here rather than dropped.

### IN-08: `--update` is not reachable through a package script
**Commit:** `cf60f8c5a` · **Files:** `package.json`, `assert-schema-migration-parity.mjs`

Added `assert:schema-migration-parity:update` and named it in the header and all three failure
messages. Verified the new script rewrites the fixture **byte-identically** (git diff on the fixture
is empty) and the check stays green.

### Follow-up: formatting
**Commit:** `2e9a207ec` — `prettier --check` over the review-fix diff caught line-wrapping in the two
files touched by IN-05 and IN-07. Whitespace only; both re-verified after.

## Skipped Issues

None. All 18 in-scope findings were addressed.

---

_Fixed: 2026-08-30_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
