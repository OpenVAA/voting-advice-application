---
phase: 151-ship-v0-2-akita-review-stack
plan: 11
subsystem: database
tags: [supabase, rls, edge-functions, pgtap, security-review, git-stack, pull-requests]
status: complete

requires:
  - phase: 151-05
    provides: "the operator-approved partition, slices.tsv, and the manifest rows this plan fills for slices 02 and 03"
  - phase: 151-09
    provides: "the proven sweep-fix-cut loop, the three cut branches, and slice 02 as an unopened cut ready to be re-cut"
  - phase: 151-10
    provides: "publishing consent (accept-reviews), the corrected CI failure signature, and F-18 routed here to be fixed before PR 3 opened"
provides:
  - "slice 03 cut as ship/v0.2-akita-03-supabase (11f877913), 119 files, the stack's only feat[db]: commit"
  - "slice 02 re-cut from the F-18-fixed tip (4c7d3db5a -> ee270800b) and published as PR #865, base ship/v0.2-akita-01b-strapi-removal"
  - "24 disposition cells for slice 03 - the only slice where the Supabase Backend and Edge Functions blocks apply - with counts rather than samples"
  - "F-19..F-33, fifteen findings; six fixed pre-cut, two escalated to the operator"
  - "F-22 - the send-email Edge Function was dead on arrival on a PostgREST named-argument mismatch, proven live and fixed"
  - "F-27 - the pgTAP suite was red 2/272 because pgTAP's mandated single-transaction pattern freezes now(); fixed, suite now PASS"
  - "F-19/F-20 - scripts/lint-schema.mjs had never run against this project's database (port 54332 vs 54322) and its FK check reported every single-column FK as unindexed (int2vector is 0-based)"
  - "the measured fact that yarn db:lint:sql and the pgTAP suite are both outside 151-BASELINE.md and were both red"
  - "apps/supabase/README.md - which of the two SQL directories the database actually reads, and the real reach of yarn db:lint:sql"
affects:
  - "plan 151-12 (owns PR 4; opens it once slice 04 is swept, per D-07)"
  - "plan 151-14 (must decide F-24 - the Signicat birthdate identity key - across slice 06's frontend half and slice 03's Edge Function half together)"
  - "plan 151-16 (F-31 tracked build artifacts with F-08; F-33 the 16-file apps/strapi class with F-04)"
  - "plans 151-12..151-18 (any <verify> naming yarn db:lint:sql fails on a correct tree until F-21 is discharged)"
  - "plan 151-18 (F-21 and F-29 and F-30 need an operator decision; the pgTAP suite must be in the D-24 gate)"

actuals:
  tokens: 24511
  tasks: 3
  commits: 10

tech-stack:
  added: []
  patterns:
    - "an enumerable security check records the count checked and the count conforming, with the command that produced both, so a reader can re-run it rather than trust it"
    - "prove a suspected API mismatch against the running service in both directions - the wrong call and the right call - before writing it down as a defect"
    - "check whether a finding is local to the slice before recording it there: F-24 looked like an Edge Function defect and is a repo-wide design choice stated identically in the frontend"
    - "never reimplement build-slice.sh's applier: shell command substitution strips NUL bytes and produces a false tree MISMATCH while the file count still looks right"

key-files:
  created:
    - apps/supabase/README.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/pr-bodies/02.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-11-SUMMARY.md
  modified:
    - apps/supabase/scripts/lint-schema.mjs
    - apps/supabase/supabase/functions/send-email/index.ts
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - packages/app-shared/README.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md

key-decisions:
  - "migrations_added stays 0, deliberately. F-29 (two unindexed join-table FKs) and F-30 (trigger naming) would each be fixed by a migration, and PD-02 makes a migration blocking on yarn db:lint:sql exiting 0 - which it cannot, pending F-21. A migration whose blocking gate cannot be shown green is worse than a recorded gap."
  - "F-21 was NOT fixed. The only change that greens yarn db:lint:sql is dropping two parameters from a granted, type-generated, pgTAP-referenced public RPC. That is a breaking signature change and a product decision about whether per-template variable resolution is still intended - D-13 excludes code restructuring and Rule 4 reserves it for the operator."
  - "F-24 was reframed rather than fixed. The birthdate-as-identity-key design is stated identically in the frontend (providers/authConfig.ts, getIdTokenClaims.ts, dataWriter.type.ts), so changing the Edge Function alone would desynchronise the two halves. Routed to 151-14, which sweeps the frontend half."
  - "The plan's <verify> blocks were run and reported honestly rather than worked around. Both name yarn db:lint:sql, which exited 1 before this plan changed anything; the applied standard is the plan's own Task 2 acceptance criterion - test:unit and lint:check no worse than baseline - which holds exactly."
  - "Slice 01b was NOT re-cut when slice 02 was, so PRs #863 and #864 were left undisturbed and no force-push was needed anywhere."

patterns-established:
  - "A mandated test pattern can be the cause of a test failure: pgTAP's required BEGIN/ROLLBACK boundary freezes now(), which is what broke the anon-read fixture"
  - "A gate can be broken in a way that makes it louder rather than silent - 149 warnings about another project's tables - and still never have run against the thing it names"

requirements-completed: [criterion-1, criterion-2, criterion-4, criterion-6]

metrics:
  duration: ~1h40m
  completed: 2026-08-17
---

# Phase 151 Plan 11: Sweep and Cut the Supabase Slice Summary

**The phase's actual security review, run exhaustively over the one slice where the database and Edge Functions checklist blocks apply — and it found that the transactional-email Edge Function had never worked, that the database test suite was red, and that the schema linter had never once run against this project's database.**

## What was built

| Task | Outcome | Commits |
|---|---|---|
| 1 | Slice 03 swept against 28 item sets; 24 cells filled with counts, zero blank | `b64977c9f`, `7208e7725`, `a7a03aca2` |
| 2 | Six fixes landed on `feat-gsd-roadmap` before the cut (D-04); `migrations_added: 0` | `995696502`, `cd96d1ff4`, `fb05eca78`, `3646180a8`, `6ded54a39` |
| 3 | Slice 02 re-cut and published as PR **#865**; slice 03 cut; catch-all and identity verified | `25c8a2359`, `271fa47b6` |

| | |
|---|---|
| **PR #865** | https://github.com/OpenVAA/voting-advice-application/pull/865 — base `ship/v0.2-akita-01b-strapi-removal`, head `ship/v0.2-akita-02-shared-packages` @ `ee270800b` |
| **slice 03** | `ship/v0.2-akita-03-supabase` @ `11f877913` — 119 files, +16,422, −0, local and unopened |

## Three findings that matter more than the paperwork

**1. `send-email` was dead on arrival (F-22).** It called the `resolve_email_variables` RPC with the argument names `user_ids` / `template_body` / `template_subject`; the SQL function declares `p_user_ids` / `p_template_body` / `p_template_subject`. PostgREST resolves overloads by argument name, so **every invocation of the transactional-email function returned HTTP 500**. Proven against the running instance in both directions rather than argued from the source: the un-prefixed POST returns `PGRST202` with PostgREST's own hint naming the correct parameters, and the `p_`-prefixed POST returns `[]`. The error handling around it was well-built and permanently taken.

**2. The pgTAP suite was red, 2 of 272, and the mandated test pattern was the cause (F-27).** Migration 00002 tightened `anon_select_candidates` to require `terms_of_use_accepted < now()`. `create_test_data()` inserted the two published fixture candidates with `ToU = now()`, and its own comment states this was meant to keep the anon-visibility assertions passing. But pgTAP wraps each file in one transaction — the `BEGIN`/`ROLLBACK` boundary **checklist item 24 requires** — and `now()` is `transaction_timestamp()`, frozen for the transaction. Measured: `BEGIN; SELECT now() < now(), now() = now(), clock_timestamp() > now();` → `f, t, t`. So the guard evaluated `now() < now()` and the fixture candidate was invisible to anon. Fixed in the fixture; the suite now reports `Files=11, Tests=272, All tests successful, Result: PASS`.

**3. The schema linter had never run against this project's database (F-19, F-20).** `scripts/lint-schema.mjs:27` hardcoded its fallback DB URL at port **54332**; `config.toml:29` declares **54322**. A digit transposition. On the sweeping machine another Supabase instance answered on 54332 and the script silently linted *that* database, reporting 149 warnings about `anonymise_*`, `mcp_oauth_*` and `mission_*` tables that do not exist in this repository. Pointed at the right database it then reported **51** warnings — because its FK check compared `pg_constraint.conkey[1:n]`, a 1-based `smallint[]`, against `pg_index.indkey[1:n]`, an **`int2vector`, which is 0-based**. Proven on the live database: for a single-column index `indkey[1:1]` is `{}` while `conkey[1:1]` is `{2}`, so **every** single-column foreign key was reported unindexed, including `nominations.project_id`, whose index exists. After both fixes plus a schema filter the gate reports `0 error(s), 2 warning(s)` — and those two rows are exactly the pair an independent static read of `200-indexes.sql` against the declared foreign keys predicts.

That third one is the shape worth carrying: **the record credited this gate with partial coverage of checklist items 18 and 22, and its real coverage was zero.** It was not silent — it was loud, about the wrong database.

## The sweep, in counts

The eight enumerable checks, each with the command that produced it recorded in the disposition:

| Check | Checked | Conforming |
|---|---:|---:|
| auth-identity calls in the `(SELECT auth.…())` scalar-subquery form | 56 occurrences | **56** — zero bare survivors |
| RLS policies naming an explicit `TO` role | 97 policies | **97** |
| tables with RLS enabled | 20 tables | **19** — the 20th is in an unexposed schema, correct by design |
| content tables carrying the standard five-policy set | 13 | **13** |
| `SECURITY DEFINER` functions pinning `SET search_path = ''` | 9 | **9** |
| FK columns with a covering index | 32 (13 of them `project_id`) | **30** — the 2 gaps are F-29 |
| pgTAP files on the transaction-boundary pattern with `create_test_data()` | 11 | **11** |
| admin-gated Edge Functions verifying the caller before constructing a `service_role` client | 2 | **2** |

The order of that last one is what makes it worth stating: in both `invite-candidate` and `send-email` the caller check *completes* before the privileged client is constructed, so there is no window in which a `service_role` client exists for an unverified caller. The third function, `identity-callback`, is the unauthenticated leg of bank login and is dispositioned `n/a` with its substitute control named — and this plan added the missing half of that control (F-23: the issuer was never checked, although `IDENTITY_PROVIDER_ISSUER` is documented and the frontend's equivalent verifier already applies it).

**T-151-11-05 (SSRF / open redirect on the OIDC callback) is closed by measurement.** The only outbound URLs are `IDENTITY_PROVIDER_JWKS_URI` and `SITE_URL`, both environment-derived; `redirectTo` is likewise environment-derived. Nothing reachable from request input becomes an outbound URL or a redirect target.

## Two findings escalated, not deferred silently

**F-21 — `yarn db:lint:sql` is red and only a breaking change greens it.** Four `plpgsql_check` warnings: an unread loop variable in `is_localized_string`, an unused local in `_bulk_upsert_record`, and two unused parameters on `resolve_email_variables`. The last pair is the blocker: dropping them changes the signature of a public RPC that is granted to two roles, present in the generated types, and called by a pgTAP test — and the parameters exist because the function was *meant* to resolve only the variables a template references. Whether that intent is still live is a product decision. Fixing two of the four would cost a migration and leave the gate red anyway.

**F-24 — the Signicat identity path keys account identity on `birthdate`.** `claimConfig.ts` sets `identityMatchProp: 'birthdate'`, and that value is used both to find an existing auth user and to derive the account's placeholder email, so two candidates sharing a birth date resolve to the same auth user and the same candidate record. `IDENTITY_PROVIDER_TYPE` defaults to `signicat`. **The check before recording changed the framing:** the frontend states the same design independently (`providers/authConfig.ts:18-26` — *"Signicat Finnish bank authentication returns `birthdate` as the primary identifier"* — plus `getIdTokenClaims.ts:44` and `dataWriter.type.ts:64`), so this is a repo-wide design choice, not an Edge Function slip, and changing one half would desynchronise the two. The correct claim is external knowledge the repository does not contain. Routed to **151-14**, which sweeps the frontend half, so one decision covers both. Idura, the newer provider, correctly uses `sub`.

## PD-02 — an answered no-op

**`migrations_added: 0`.** None of the six fixes touches a migration. This was a decision, not an accident: the two findings whose fix *is* a migration (F-29's unindexed join-table FKs, F-30's trigger naming) are recorded as deferred precisely because PD-02 requires `yarn db:lint:sql` green before a migration may be cut, and F-21 leaves it red pending the operator. Landing a migration whose blocking gate cannot be shown green would be worse than recording the gap.

A `yarn db:reset` was run regardless — item 24's evidence had to come from a database built from migrations rather than an incrementally mutated one — and migrations 00001, 00002 and 00003 applied cleanly with `seed.sql` seeded.

## The cut

| check | result |
|---|---|
| chain | `02^ == 01b`, `03^ == 02`, both by `rev-parse` |
| catch-all, `TIP03..TARGET` pathspec `.` | `files=3812` |
| arithmetic | 252 + 97 + 119 + 3812 = **4280** = comparable total. **Gap: 0.** |
| attribution of the rise from 151-09's 4274 | **+6, all named** — five `.planning/` files riding slice 11, one `apps/supabase/README.md` riding slice 03 |
| deviation from the predicted remainder | 3925 − 118 + 5 = 3812. **0.000%**, against a 1% halt threshold |
| partial-stack identity | four cut slices + catch-all → tree `27350c243` = `TARGET^{tree}`. **MATCH** |
| taxonomy over `C1..TIP03` | `[db]` gaps **0**, shared paths **0**, unplaced **0**; three cardinality clauses at `0 == 1` because slices 11, 09 and 05 are not cut yet |
| guards | 3 `ship/*` refs on origin; PR 4 not opened (`gh pr list --head … → 0`); `origin/main` unmoved at `ac30f132a`; PR **#860 untouched**; push dry-run reported `[new branch]`, no force anywhere |

**Slice 02's counts did not move** — 97 files, +1273, −289, identical to 151-09's cut — because F-18 replaced one line already inside the slice's diff. That is D-04 working: the reviewer of PR 3 sees the corrected sentence and never a fix of itself. Slice 01b was **not** re-cut, so PRs #863 and #864 were untouched.

## Deviations from Plan

### 1. [Rule 1 — the check was wrong, not the content] Both of the plan's `<verify>` blocks assert a gate that was red before this plan started

**Found during:** Task 1, running the plan's own automated check.
**Issue:** Task 1's `<verify>` is `yarn db:lint:sql` and Task 2's is `yarn test:unit && yarn lint:check && yarn db:lint:sql`. That gate exits 1 on four `plpgsql_check` warnings that predate every change this plan made. `151-BASELINE.md` records only `build`, `test:unit`, `lint:check` and `format:check`, so the phase had never measured it.
**Resolution:** run it, report its true state, and apply the plan's own Task 2 acceptance criterion instead — `test:unit` and `lint:check` "no worse than the baseline" — which holds exactly (1522/149 and 0 errors/20 warnings, both under `TURBO_FORCE=1`). The gate's residual red is recorded as **F-21** with the reason it was not chased. This is the **seventh** plan-encoded claim in this phase to be wrong as written, and the same shape as the other six: the reasoning is sound, the observable signature is not.

### 2. [Rule 2 — missing critical measurement] The plan named two gates the baseline had never measured, and both were red

`yarn db:lint:sql` and the pgTAP suite are both outside `151-BASELINE.md`'s four-gate baseline. Both were red on the branch. One of them (F-27) was a genuine defect in the project's own database test suite, hiding in plain sight for the whole phase. Recorded in the manifest so 151-18's D-24 gate includes the pgTAP suite rather than assuming CI covers it — the `supabase-tests` CI job is conditional on a paths filter and does not fire on any of this stack's sibling-based PRs.

### 3. [Deliberate scope call] `apps/supabase/README.md` was added, raising slice 03 from 118 files to 119

A reviewer of PR 4 meets two directories holding the schema — 3,409 lines under `schema/` and the same schema again under `migrations/` — with nothing saying which the database reads. The answer is only discoverable from a comment inside migration 00002. The README states it, plus the real reach of `yarn db:lint:sql`, the frozen-`now()` trap from F-27 and the RPC argument-name rule from F-22. The file falls inside slice 03's existing pathspec, so no partition change was needed and the count rose for one named reason.

### 4. [Rule 1 — Bug in this plan's own record] Five disposition cells cited an amended commit hash

**Found during:** the self-check.
**Issue:** the README commit was amended to run Prettier over the new file (so `format:check` stayed red on exactly the two PD-03-fenced files and did not gain a third), which changed its hash. Five cells still cited the pre-amend `b6b036fcc`, an unreachable object that appears in no `git log`.
**Fix:** corrected to `6ded54a39`; every hash this plan cites is now verified reachable. **Commit:** `a7a03aca2`.

### 5. [Recorded, and a trap for later plans] A hand-rolled catch-all applier gave a false tree MISMATCH

The catch-all was first applied through a reimplementation of `build-slice.sh`'s `diff --raw -z` → `update-index` pipeline, carrying the NUL-separated stream through a shell command substitution. **Command substitution strips NUL bytes**, so the stream was mangled and `write-tree` produced a non-matching tree — while the *file count* was still right, because it was taken before the corruption. The arithmetic said gap 0 and the identity said MISMATCH, and the arithmetic was the one telling the truth. Re-run through `build-slice.sh` itself, the identity matches. Recorded in the manifest: **do not reimplement the applier; call the script.**

### 6. [Recorded] One unreproduced transient in the unit suite

The first `yarn test:unit` after the Edge Function fixes failed in `@openvaa/frontend`. An isolated re-run of that package passed 54/54 files and 773/773 tests, and a subsequent full `TURBO_FORCE=1` run passed 21/21 tasks at exactly the baseline counts. It did not reproduce and was not diagnosed. Recorded rather than omitted; it is the unit suite, not E2E, so the cardinal rule's letter does not apply, but the honesty standard does.

## Known Stubs

None introduced. No stub, placeholder or skipped test was added. Both of the plan's `<verify>` blocks were run — see Deviation 1 for the one that fails and why the failure is not this plan's.

## Deferred Issues

| ID | Routed to | Why not fixed here |
|---|---|---|
| **F-21** | **operator / 151-18** | The only change that greens `yarn db:lint:sql` is a breaking signature change to a granted, type-generated, pgTAP-referenced public RPC — a product decision, not a cleanup |
| **F-24** | **151-14** | The same design is stated independently in the frontend; fixing one half would desynchronise the two, and the correct claim is external knowledge |
| **F-29** | with **F-21** | The fix is a migration, and PD-02 makes a migration blocking on the gate F-21 leaves red |
| **F-30** | **operator** | Both remedies are the operator's: a migration renaming 22 triggers, or widening the checklist this phase's 31-item census is measured against |
| **F-31** | **151-16** | Same class as **F-08**; the class should be decided once. Unlike F-08 these paths *are* claimed by a slice pathspec, so they are not F-15-blocked |
| **F-32** | **operator** | A live `service_role` key in a plaintext column in production; the remedy is Supabase Vault, an architectural change. The table is fail-closed today |
| **F-33** | **151-16** | 15 of the 16 `apps/strapi` files are under `apps/docs/**`, owned by slice 09 and swept bottom-up |
| slice 03's item 15 | **151-16** | The Developers' Guide still documents the Strapi backend this slice replaces, with no Supabase equivalent; those pages are slice 09's |

## Notes for the next plans

- **151-12 owns PR 4.** Slice 03 is cut and unopened. Sweep slice 04 first, then open it — D-07.
- **Do not put `yarn db:lint:sql` in a `<verify>`** until F-21 is discharged. It exits 1 on a correct tree.
- **Add the pgTAP suite to 151-18's D-24 gate.** The `supabase-tests` CI job is conditional on a paths filter and fires on none of this stack's PRs, so a red database suite is invisible to CI by construction. F-27 is what that costs.
- **151-14 must decide F-24 over both halves at once** — slice 06's `providers/authConfig.ts` and slice 03's `claimConfig.ts` state the same design.
- **Call `build-slice.sh` for the catch-all.** A reimplementation loses NUL bytes and reports a false MISMATCH.
- **Seven plan-encoded claims in this phase have now been wrong as written**, and the seventh (this plan's `<verify>`) is again a case of correct reasoning with an unverified observable signature. The pattern is worth carrying into 151-19.

## Self-Check: PASSED

| Claim | Check | Result |
|---|---|---|
| `apps/supabase/README.md` created | `[ -f … ]` | FOUND |
| `pr-bodies/02.md` created | `[ -f … ]` | FOUND |
| `151-11-SUMMARY.md` created | `[ -f … ]` | FOUND |
| All 10 cited commits reachable | `git log --oneline --all \| grep -c` | each returns 1 |
| No stale hash cited | `grep -rn 'b6b036fcc'` after `a7a03aca2` | 0 hits |
| `03^ == 02` and `02^ == 01b` | `git rev-parse` | both equal |
| Slice 03 subject carries `[db]` | `git log -1 --format=%s … \| grep -c 'db'` | 1; taxonomy `[db]` gaps 0, unplaced 0 |
| Partial-stack identity | catch-all tree vs `TARGET^{tree}` | `27350c243` == `27350c243` |
| Partition arithmetic | 252 + 97 + 119 + 3812 | 4280 == comparable total |
| PR #865 base | `gh pr view 865 --json baseRefName` | `ship/v0.2-akita-01b-strapi-removal` |
| PR #865 head SHA | `gh pr view 865 --json headRefOid` | `ee270800b` == local |
| PR 4 not opened | `gh pr list --head ship/v0.2-akita-03-supabase --jq length` | 0 |
| `ship/*` refs on origin | `git ls-remote --heads origin 'ship/*'` | 3 |
| `origin/main` unmoved | `git ls-remote origin refs/heads/main` | `ac30f132a` |
| PR #860 untouched | `gh pr view 860` | OPEN, base `main`, title unchanged |
| pgTAP green | `npx supabase test db` after `yarn db:reset` | `Files=11, Tests=272, All tests successful, PASS` |
| Four-gate baseline held | `TURBO_FORCE=1` on each | build 14/14; test:unit 1522/149; lint:check 0 errors/20 warnings; format:check red on exactly the 2 PD-03-fenced files |

---

*Phase: 151-ship-v0-2-akita-review-stack · Plan 11 · completed 2026-08-17*
