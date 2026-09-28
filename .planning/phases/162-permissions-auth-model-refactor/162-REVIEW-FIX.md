---
phase: 162-permissions-auth-model-refactor
fixed_at: 2026-09-20T11:58:00Z
review_path: .planning/phases/162-permissions-auth-model-refactor/162-REVIEW.md
iteration: 1
findings_in_scope: 10
fixed: 9
skipped: 1
status: partial
---

# Phase 162: Code Review Fix Report

**Fixed at:** 2026-09-20T11:58:00Z
**Source review:** `.planning/phases/162-permissions-auth-model-refactor/162-REVIEW.md`
**Iteration:** 1

**Summary:**

- Findings in scope: 10 (CR-01..CR-03, WR-01..WR-07; Info out of scope)
- Fixed: 9
- Skipped: 1 (WR-07 — the finding's premise is false; see below)

**Files modified — three, and no production source:**

- `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts`
- `apps/supabase/supabase/functions/send-email/flowConformance.test.ts`
- `.planning/phases/162-permissions-auth-model-refactor/162-FLOW-CONFORMANCE.md`

`git diff --stat bad8fa857..HEAD` is exactly those three files (+180 / −66). No `index.ts`, no migration, no
schema file and no other non-test file was touched, in this worktree or anywhere else.
`apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql` was **not modified** — its only
in-scope finding (WR-07) was skipped.

**Where verification ran.** `workflow.use_worktrees` is `false` in `.planning/config.json`, so edits and
commits were made in the primary checkout (`/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd`,
branch `integration/ship-12-squash`). The gates below therefore ran in the same checkout the reviewer read,
with the project's own `vitest@3.2.4` and `prettier`, and are reproducible from it.

Mutation controls ran on an **out-of-tree `rsync` copy** of `apps/supabase` under the session scratchpad
(`…/scratchpad/mut/supabase-app`, `node_modules` symlinked to the repo root so the workspace `vitest` binary
resolves). **No file in this worktree was mutated at any point.**

## Gates

| Gate | Command | Exit | Result |
|---|---|---|---|
| Unit, edited files | `yarn vitest run …/invite-candidate/flowConformance.test.ts …/send-email/flowConformance.test.ts` | 0 | 35 passed (19 + 16) |
| Unit, four-file conformance set | the two above + `identity-callback/flowConformance.test.ts` + `invite-candidate/callerAuthority.test.ts` | 0 | **58 passed** (19 + 16 + 13 + 10) — reconciles the count now stated in `162-FLOW-CONFORMANCE.md` |
| Unit, whole workspace | `yarn test:unit` in `apps/supabase` | 0 | 14 files, 166 passed |
| Format | `yarn prettier --check` on all four candidate files | 0 | clean |
| Lint | `npx eslint` on both edited test files | 0 | clean |

Every exit status above was read directly from the command, never through a pipe.

**pgTAP was not executed, and nothing here claims it was.** The local Postgres on `127.0.0.1:54322` has no
`pgtap` extension and installing one was out of scope. `32-level1-confirmation-flow.test.sql` is unmodified,
so its declared `plan(13)` and the reviewer's hand reconciliation of it still stand unchanged.

## Mutation resistance — the four mutations the review names, re-measured against the FINAL test files

Out of tree, each planted alone from a freshly synced copy. T0 (unmutated) = 35 passed.

| Control | Plant | Before this fix run | After |
|---|---|---|---|
| **M1** | `invite-candidate/index.ts`: `return` deleted in front of `new Response` in the `if (!mayInvite)` arm | 17/17 green | **1 reddened** |
| **M2** | `send-email/index.ts`: same edit in the `if (!mayBulkSend)` arm | 16/16 green | **1 reddened** |
| **M3** | `invite-candidate/index.ts`: `(await callerMayOnProject(…)) \|\| body.debugBypass === true` | 33/33 green | **2 reddened** |
| **M7** | `invite-candidate/index.ts`: grant rewritten to `entityType: 'organization', entityId: projectId` | 17/17 green | **1 reddened** |

Six further controls were measured for the warnings and are recorded in each finding below and in
`162-FLOW-CONFORMANCE.md`'s control table.

## Fixed Issues

### CR-01: the 403 refusal is pinned lexically, not as a refusal

**Files modified:** `invite-candidate/flowConformance.test.ts`, `send-email/flowConformance.test.ts`, `162-FLOW-CONFORMANCE.md`
**Commit:** `0784e5f2d`
**Applied fix:** the refusal is matched as ONE contiguous `if (!mayInvite) { return new Response(…); }` block
whose captured body must carry `status: 403` and the refusal message, replacing five independent ordered
`indexOf` hits. The first `SUPABASE_SERVICE_ROLE_KEY` is required to follow the block's **end**
(`refusal.index + refusal[0].length`), not its start — a strengthening beyond the review's own snippet. Same
shape applied to `send-email` with `mayBulkSend`. Test renamed to `… with a 403 it RETURNS, …`; all five
citations of the old title in `162-FLOW-CONFORMANCE.md` updated, and the missing-`return` control recorded as
**G1b / G1bs**.
**Verified:** M1 and M2 each redden 1 (2 failed / 31 passed across the two files), where both left 33/33 green.

### CR-02: the gate's answer is never pinned as the sole input to the refusal

**Files modified:** `invite-candidate/flowConformance.test.ts`, `send-email/flowConformance.test.ts`, `162-FLOW-CONFORMANCE.md`
**Commit:** `1f11a78bd`
**Applied fix:** the whole assignment statement is bound — `/\n\s*const mayInvite = await callerMayOnProject\(callerClient, projectId, 'project\.edit_entities'\);\n/`, terminator and surrounding newlines included — and assignments to the gate variable are counted at exactly one. Same for `mayBulkSend`. Control recorded as **G6 / G6s** (the review suggested "G5", which 162-18 already uses for the configured-project plant; renamed to avoid the collision).
**Verified:** M3 reddens 2 in each file (4 failed / 29 passed), where it left 33/33 green.

### CR-03: the grant-shape tests assert on arguments the test itself supplied

**Files modified:** `invite-candidate/flowConformance.test.ts`, `162-FLOW-CONFORMANCE.md`
**Commit:** `e668245c2`
**Applied fix:** added `names the invited identity as a CANDIDATE entity at the one write site in the flow
(D-20, D-21)`, in the shape `identity-callback` already used: the flow's own call matched whole
(`userId: inviteData.user.id`, `entityType: 'candidate'`, `entityId: candidate.id`), with
`await writeEntityGrant(` and `entityType:` each counted at exactly one — D-20's "named HERE and nowhere
else", now asserted rather than asserted-about.

The review offered "either delete the two imported-module tests or retitle them". **Retitled**, not deleted:
they are prefixed `MODULE-LEVEL, not flow-level: …`, because they still carry the `(entity, …, editor)` half
of § 3.1 row 5 that the call site does not. `162-FLOW-CONFORMANCE.md` row 13 is re-derived to cite the
call-site test for the flow and the module-level test for the scope/role half, and says which is which.
**Verified:** M7 reddens the new test; it left 17/17 green.

### WR-01: `reads no retired claim key` cannot fail

**Files modified:** both test files, `162-FLOW-CONFORMANCE.md`
**Commit:** `ec0e94b61`
**Applied fix:** `expect(INDEX_SOURCE).not.toContain(key)` — the bare key, which is what the test's title
says. Measured first: neither module contains `user_roles`, `user_role_type` or `role_scope_type` in any
form, so the stronger assertion is free.
**Verified:** appending `const claims = decodeTokenPayload(jwt); const roles = claims.user_roles ?? []` to
`invite-candidate/index.ts` passed the old two assertions and reddens the new one.

### WR-02: the permission-literal assertions match comments as well as code

**Files modified:** both test files, `162-FLOW-CONFORMANCE.md`
**Commit:** `7a57f5024`
**Applied fix:** each file derives a `CODE_ONLY` view (block and line comments stripped) and runs the
**positive** guards over it, including `send-email`'s `names the permission bulk send asks for`. The negative
`names no permission literal outside the derived enum` keeps reading the raw text on purpose — a permission
named only in prose, and not one of the 23, is a defect this gate should still catch. Each positive guard also
now names `project.edit_entities` explicitly rather than only counting matches.
**Verified:** control **F3 / F3s** — the gate's permission rewritten to `'project' + '.' + 'edit_entities'`
with the comments untouched. Green under the raw form; reddens 2 in `invite-candidate` and 3 in `send-email`.

### WR-03: `GRANT_SCOPES` / `GRANT_ROLES` are transcribed literals

**Files modified:** `invite-candidate/flowConformance.test.ts`, `162-FLOW-CONFORMANCE.md`
**Commit:** `26dcdc6e1`
**Applied fix:** both vocabularies are now derived from `schema/000-enums.sql` at run time — the existing
`deriveScopeVocabulary` plus a new `deriveRoleVocabulary` of the same shape.

**Deliberate deviation from the review's snippet, per "never bend a test to a count":** the guard pins
**size only** (`toHaveLength(4)`, `toHaveLength(2)`), not the member names — asserting the members would be
exactly the second transcription this file exists to end. The size pins are the thing that proves the parse
reached both `CREATE TYPE` declarations rather than falling into `if (!block) return []`, and the **values**
are bound where they are used: `toContain('entity')` / `toContain('editor')` against the derived lists,
paired with the exact-value assertions on the written row. That pairing also resolves IN-02 — the two halves
are now independent (one binds the schema, one binds the module) instead of one strictly implying the other.
**Verified:** renaming the enum members in `000-enums.sql` to `'thing'` / `'writer'` reddens the grant-shape
assertion. It was green against the transcribed copy.

### WR-04: the RPC binding asserts the scope is *any* of four, and neither the target nor the permission

**Files modified:** `invite-candidate/flowConformance.test.ts`, `162-FLOW-CONFORMANCE.md`
**Commit:** `896d43f8a`
**Applied fix:** `expect(calls[0].args).toEqual({ p_scope: 'project', p_target_id: '…cc', p_permission: 'project.edit_entities' })`, with the schema-derived key-set assertion retained and `p_scope` additionally required to be a member of the derived scope vocabulary.
**Verified:** control **G7** — `callerAuthority.ts`'s `p_scope` changed from `'project'` to `'global'`, the
silent outage the test's own comment claims to guard. Green before; reddens 1 now.

### WR-05: the stated rationale for the 23-pin is the opposite of what the assertions do

**Files modified:** both test files, `162-FLOW-CONFORMANCE.md`
**Commit:** `e2298f58d`
**Applied fix:** both remedies the review offered, not one. The docblocks now state what the pin actually
guards — a **partial** derivation, which makes a legitimate literal read as a non-member and reports a
confusing "permission outside the enum" instead of the parse failure behind it — and record that an *empty*
derivation reddens the membership checks outright, the opposite of the old claim. And "BEFORE" is now true: a
`beforeAll` that throws aborts the describe, so no membership assertion can run against a vocabulary that
failed to parse. The named `it` guards are kept for readability.
**Verified:** with `'project.edit_entities'` removed from the enum body, the run reports one named
`derivePermissionVocabulary parsed 22 members … expected 23` error per file and **35 skipped**, where the same
plant previously produced scattered membership reds with no line naming the cause.

### WR-06: `never as a caller-chosen sender` pins one stale spelling

**Files modified:** `send-email/flowConformance.test.ts`, `162-FLOW-CONFORMANCE.md`
**Commit:** `d34f7826b`
**Applied fix:** the positive binding `await transport.sendMail({ from: senderAddress,` over `CODE_ONLY`, an
exact count of one `from:` in executable code so a second send site cannot hide behind it, and a general
negative over the caller-derived forms. The stale `/from\s*\|\|\s*requireEnv/` negative is gone.
**Verified:** controls **G8a / G8b / G8c** — `from: from ?? senderAddress`, `from: body.from` and
`from: from || senderAddress` planted at the send site. All three passed the old negative; each reddens 1 now.

## Skipped Issues

### WR-07: the pgTAP header cites a precedent that does not exist in the tree

**File:** `apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql:31`
**Reason:** **skipped — the finding's premise is false, and applying its fix would replace a true sentence
with a false one.** The SQL file was not modified.

The review states: *"Measured: `23-nominations-write.test.sql` contains **no** `pg_temp.try_edit_nomination`
and no `GET DIAGNOSTICS` at all — only a stale header comment of its own (line 25) describing an instrument it
does not define."* Re-measured in this worktree at `bad8fa857`:

```
$ grep -n "try_edit_nomination\|GET DIAGNOSTICS" apps/supabase/supabase/tests/database/23-nominations-write.test.sql
25:-- `try_edit_nomination` reports how many rows an edit of one nomination actually affected …
28:CREATE FUNCTION pg_temp.try_edit_nomination (p_id uuid, p_note text) RETURNS integer LANGUAGE plpgsql AS $fn$
35:  GET DIAGNOSTICS v_rows = ROW_COUNT;
242:    pg_temp.try_edit_nomination (
268:    pg_temp.try_edit_nomination (
294:    pg_temp.try_edit_nomination (
```

`23-nominations-write.test.sql` **does** define the instrument — line 28, with `GET DIAGNOSTICS v_rows =
ROW_COUNT` at line 35 — and **does** use it to measure rows affected, inside three `is()` assertions at lines
242, 268 and 294 (expecting `0`, `0` and `1`; the lock is asserted in both directions). Its line-25 comment
sits immediately above the definition at line 28 and is not stale. `32`'s line 31 — *"the same instrument
`23-nominations-write.test.sql` uses, for the same reason"* — is therefore **true and checkable**, and the
review's proposed replacement sentence ("23 asserts the flag alone and this file adds the row-count
measurement 23's own header describes but does not implement") would be the false citation.

What the review appears to have measured is 23's *entity-user-edit* step at lines 141-160, which is indeed a
bare `UPDATE` followed by an `is()` on the `confirmed` flag. That step measures the unconfirmation side
effect, not row count, which is the right instrument for what it asserts; 23 measures row count at its three
other steps. There is nothing to correct in `32`'s header, and the follow-up the review proposes ("either
delete or implement 23's line-25 comment") has no subject.

**Original issue as filed:** the header states `try_edit_nomination` is "the same instrument
`23-nominations-write.test.sql` uses, for the same reason", which the review reports as an uncheckable
citation.

## Residues and follow-ups — outside this fix run's file scope

1. **`identity-callback/flowConformance.test.ts` carries two of the defects just fixed.** It has WR-01's weak
   `payload.<key>` / `['<key>']` form (lines 56-59) and WR-05's peer-`it` vocabulary guard with no
   `beforeAll`. It was not in the review's `files_reviewed_list` and not in this run's editable set. Both are
   recorded as **RESIDUE, follow-up** in `162-FLOW-CONFORMANCE.md`'s control table. WR-02's comment-stripping
   would be a third (see the review's IN-06 on the copy-pasted derivation helpers).
2. **`evidence/162-18/flow-controls.txt` was not appended.** CR-01's fix asks for control G1b to be recorded
   there; the evidence directory was outside the editable set. The eight new controls measured by this run
   (G1b, G1bs, G6, G6s, G7, G8a/b/c, F3, F3s) are instead described — plant, before-state and after-state — in
   `162-FLOW-CONFORMANCE.md`'s control table, and the header now says so explicitly. Appending them to the
   evidence file in the format that file uses is a follow-up.
3. **The evidence file records the pre-rename test title.** `evidence/162-18/flow-controls.txt` lines 8, 10,
   24 and 26 cite `refuses on the answer of the gate, with a 403, before the service-role client exists`,
   which no longer exists. That is a historical record of a measurement at a past commit, and the document's
   own convention (§ *Controls cited*, "cited as history and not rewritten") covers it — noted here so nobody
   reads it as drift.
4. **Counts in `162-FLOW-CONFORMANCE.md` moved and were re-derived, not edited by hand:** the invite gate
   goes 17 → 19 (CR-03's call-site test, WR-03's grant-vocabulary guard), the four-file total 56 → **58**, and
   the three-flow-file T0 46 → 48. The 58 was reconciled by a run of exactly those four files.
5. **A prior fix report already occupied this path and has been preserved, not lost.** `162-REVIEW-FIX.md` at
   `HEAD` (`a3a2d3343`, 2026-09-19) was the companion to the archived full-scope review — 19 findings in
   scope under `fix_scope: all`, 18 fixed, WR-04 skipped pending a product decision, verified against a live
   `supabase test db` run of 1191 assertions. It documents a different review of a different surface and this
   run neither supersedes nor restates it, so its content was written out verbatim as
   **`162-REVIEW-FIX-full-scope.md`**, mirroring the naming the reviewer used for `162-REVIEW-full-scope.md`.
   Both files are currently untracked / uncommitted; the orchestrator should commit the companion alongside
   this report. This report's `iteration: 1` is iteration 1 **of the scoped review** — the third review of
   this phase's surface, not the first fix run on it.
6. **`.planning/milestone.lock` and `162-REVIEW-full-scope.md` remain untracked**, as they were at the start
   of the run. This report is not committed — the orchestrator handles it.

---

_Fixed: 2026-09-20T11:58:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
