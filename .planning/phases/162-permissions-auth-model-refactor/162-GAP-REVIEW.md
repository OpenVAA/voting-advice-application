---
phase: 162-permissions-auth-model-refactor
scope: gap-closure plans 162-18, 162-19 (diff 400366a27..HEAD)
reviewed: 2026-09-19T16:00:06Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
  - apps/supabase/supabase/functions/send-email/flowConformance.test.ts
  - apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql
  - .claude/skills/database/SKILL.md
  - .claude/skills/database/rls-policy-map.md
  - .agents/code-review-checklist.md
findings:
  critical: 1
  warning: 2
  info: 5
  total: 8
status: issues_found
---

# Phase 162 (gap closure 162-18 / 162-19): Code Review Report

**Reviewed:** 2026-09-19T16:00:06Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

I reviewed the tightened `flowConformance.test.ts` files for `invite-candidate` and `send-email`, and the new pgTAP file `32-level1-confirmation-flow.test.sql`. For the three agent-guidance documents I checked only that their new statements are true of the code.

**How this was checked.** For the vitest files I copied `functions/` and `schema/` into the session scratchpad, changed each `index.ts` in ways the plan's G1–G5 controls do not cover, and ran the real test files against each change. For the pgTAP file I ran it against the local database (13/13 ok). I then re-ran it with each trigger function replaced by a changed version inside the same transaction. Everything ran in the scratchpad or inside a rolled-back transaction; no source file was touched.

**What holds:**
- The pgTAP file is sound on state. It runs in one `BEGIN … ROLLBACK`. The helper `set_config` calls are transaction-local (`true`). The `pg_temp` function and the inserted `grants` row roll back with the transaction. It leaves no grants and no role behind.
- The entity trigger is direction-independent (`IS DISTINCT FROM`). So the L4 (false) / L5 (true) pair is a fair pair.
- The `user_can` parameter-binding test in `invite-candidate` is a real, non-vacuous check.
- The document statements are true of the code, with the two small precision notes below.

**What does not hold:** the new "the gate's answer reaches the refusal" and "bound to the configured project" assertions only check the **order in which substrings first appear**. They do not check control flow. I found three changes that remove or weaken a security check and leave every test green. One of them is simply deleting a check.

## Critical Issues

### CR-01: The "binds bulk send to the configured project" test stays green when the configured-project check is deleted

**File:** `apps/supabase/supabase/functions/send-email/flowConformance.test.ts:94-106` (guards `apps/supabase/supabase/functions/send-email/index.ts:138-146`)

**Issue:** The test asserts four things:
- the order of `requireEnv('PUBLIC_PROJECT_ID'`, then the literal `JSON.stringify({ error: 'Invalid project_id' })`, then `rpc('resolve_email_variables'`;
- that `p_project_id: configuredProjectId` is present.

It never asserts the comparison that makes the refusal happen. Two changes run in the scratch copy both kept all **16/16** tests green:
- **M1:** replace `project_id.trim().toLowerCase() !== configuredProjectId.toLowerCase()` with `false`.
- **M2:** replace the whole condition with `if (false)`.

This comparison is the only thing that ties the project the gate was asked about (the request's `project_id`, line 119) to the project whose recipients are resolved and mailed (`configuredProjectId`, line 162). Without it, a ProjectEditor of *any* project X can:
1. send `project_id = X`;
2. pass `callerMayOnProject(…, X, 'project.edit_entities')`;
3. have the service-role client resolve and email the recipients of the deployment's configured project.

That is exactly the cross-tenant hole the test's own comment says it guards (162-REVIEW WR-02). The 162-18 control G5 only changed the `p_project_id:` argument, so the ledger in `evidence/162-18/flow-controls.txt` did not catch this.

**Fix:** Pin the refusal condition itself, and add a control that neutralises it. The minimum is a comment-stripped text check on the condition's operands:

```ts
const code = INDEX_SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const cond = code.slice(code.indexOf("requireEnv('PUBLIC_PROJECT_ID'"), code.indexOf("error: 'Invalid project_id'"));
expect(cond).toMatch(/project_id\.trim\(\)\.toLowerCase\(\)\s*!==\s*configuredProjectId\.toLowerCase\(\)/);
expect(cond).toMatch(/if\s*\(\s*typeof project_id !== 'string'/);
```

Better: extract the check into a pure, importable helper (in the pattern of `callerAuthority.ts`), for example `requestProjectMatches(requested: unknown, configured: string): boolean`. Test it behaviourally: another project's id is refused, blank is refused, a different-case copy of the configured id is allowed. Then assert by text only that `index.ts` refuses on its result. Record the M1/M2 changes as controls in `evidence/162-18/flow-controls.txt`.

## Warnings

### WR-01: "Refuses on the answer of the gate" checks substring order, not that the refusal depends on the gate's answer

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:118-131`; `apps/supabase/supabase/functions/send-email/flowConformance.test.ts:79-92`

**Issue:** The test looks for the first `status: 403` and the first `Forbidden: …` anywhere after `if (!mayInvite)`. It does not check that they are inside that `if`'s body. Change **M3** (and **M4**, the same for send-email) rewrites the refusal as:

```ts
if (!mayInvite) console.debug(mayInvite);
if (false) {
  return new Response(JSON.stringify({ error: 'Forbidden: caller may not create candidates in this project' }), { status: 403, … });
}
```

That ignores the gate's answer completely, yet it kept **17/17** tests green (invite-candidate) and **16/16** (send-email). The test title and the file header ("the refusal is conditioned on the gate's answer") say more than the test measures. It only catches the exact `if (!mayInvite)` → `if (false)` substitution used as control G1.

**Fix:** Slice the body of the refusal branch and assert on it. For example, find the `{` after `if (!mayInvite)`, walk to the matching `}` with a brace counter, and assert that the slice contains `return new Response(`, the Forbidden message and `status: 403`. Also assert that the text between the gate's `;` and `if (!mayInvite)` holds nothing but whitespace or comments, and that the `if` is directly followed by `{`. The durable fix is to move the gate-and-refuse step into an importable function that takes an `RpcClient`, then test it by calling it: `false` / error / throw each give a 403 Response.

### WR-02: Assertions on raw source text can be satisfied by comments, and the gate's arguments can be swapped without any test failing

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:103-108, 86-90, 118-131` (the same pattern is in `send-email/flowConformance.test.ts:43-46, 64-70`)

**Issue:** Every `toContain` / `indexOf` runs on `INDEX_SOURCE` with comments left in, and `index.ts` carries long comments that repeat code shapes. Change **M6** in the invite-candidate scratch copy:

```ts
// was: callerMayOnProject(callerClient, projectId, 'project.edit_entities')
const mayInvite = await callerMayOnProject(callerClient, body.projectHint, 'project.read_structure');
```

This asks the gate about a project the attacker chooses, with a permission that entity editors hold. Every candidate holds `project.read_structure` on its own project through the entity-grant reach in `user_can`. All **17/17** tests stayed green:
- the call-shape `toContain` matched the comment;
- the gate prefix `const mayInvite = await callerMayOnProject(callerClient` was unchanged;
- `project.read_structure` is a member of the 23, so the membership test passed.

The "non-vacuous" guard at line 86 is also met by the permission literals the comments already contain. It stays green if the code names no permission at all.

**Fix:** Strip comments once (`CODE_SOURCE`) and run every call-shape, ordering and literal assertion against that stripped text. Pin the complete gate statement, `const mayInvite = await callerMayOnProject(callerClient, projectId, 'project.edit_entities');`, as a single match on the stripped text, rather than a prefix plus a separate `toContain`.

## Info

### IN-01: The pgTAP file cannot tell which permission each trigger reads; `entity.confirm` is stated but never checked in L0

**File:** `apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql:96-126, 229-290`

**Issue:** Measured with changes inside the transaction:
- `enforce_entity_immutability` changed to check `user_can('project', NEW.project_id, 'project.edit_entities')` instead of `entity.confirm`: 13/13 still ok.
- `enforce_nomination_confirmation` changed to check `project.manage_editors` instead of `nomination.confirm`: 13/13 still ok.

The error messages are fixed strings, so the `throws_like` patterns that "name" the permission prove nothing about which permission was read. For the nomination half this is a structural limit: at project scope no role holds `nomination.confirm` without the other two admin-only verbs. For the entity half, though, the premise itself is not checked. L0 checks the editor's `nomination.*` answers but never `entity.confirm`.

**Fix:** Add L0-style premise checks: `ok(user_can('entity', test_id('candidate_a'), 'entity.confirm'))` as the ProjectEditor, and `ok(NOT user_can(…, 'entity.confirm'))` as `candidate_a`. Soften the L2/L4/L5 descriptions so they claim "the confirm gate" rather than naming a specific permission verb. Remember to update `plan (13)`.

### IN-02: The L3 control UPDATE is not wrapped in an assertion

**File:** `apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql:198-203`

**Issue:** If the ProjectAdmin's edit-and-confirm ever raises, the transaction aborts. The file then reports a plan mismatch with 5 unrun tests instead of a named failure. **Fix:** Wrap it in `lives_ok(format($$UPDATE … $$, …), 'L3: …')` and increase the plan.

### IN-03: The `set_test_grants` calls are redundant

**File:** `apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql:110,170,196,247,283`

**Issue:** `set_test_user` already builds the `grants` claim from `test_grants_claim(p_user_id)` (`00-helpers.test.sql:310`). The following `set_test_grants` writes the same value again. This is harmless, but the header presents it as a needed step. **Fix:** Drop the calls, or note that they are belt-and-braces.

### IN-04: The checklist item reads as universal, but `identity-callback` has no caller gate

**File:** `.agents/code-review-checklist.md:48`

**Issue:** The item says "Edge Functions decide authority by asking `user_can` … and refuse before any service-role client exists". It applies to every change under `functions/`. `identity-callback` creates its service-role client (`index.ts:254`) with no `user_can` call, and that is correct: it authenticates and authorises nothing, as SKILL.md now says. A reviewer applying the checklist literally would flag it. **Fix:** Scope the item: "Edge Functions that act on a caller's behalf (`invite-candidate`, `send-email`) …".

### IN-05: SKILL.md shows the gate's second argument as `projectId` for both functions

**File:** `.claude/skills/database/SKILL.md:238-240`

**Issue:** `send-email` passes `project_id` (`send-email/index.ts:119`), which is not bound to the configured project until after the gate (lines 135-146). The note is right in substance but hides that send-email adds a second check tying the request's project to the configured one. That check is the one CR-01 shows is unprotected. **Fix:** Add a clause: "send-email additionally refuses (400) a `project_id` other than the configured `PUBLIC_PROJECT_ID`, after the gate".

## Verified document statements (no finding)

- `callerMayOnProject` asks `user_can` through the caller's own anon-key client carrying the caller's Authorization header, in both functions. It fails closed on anything but `data === true`, including errors and throws. The two copies are byte-identical, checked by `diff`.
- Both gated functions return 403 before `createClient(…SUPABASE_SERVICE_ROLE_KEY)`.
- No Edge Function `index.ts` reads a `grants` claim.
- invite-candidate writes `(entity, candidate, id, editor)` through `writeEntityGrant`. A failed grant write or a failed link calls `rollbackInvite`, which deletes both the auth user and the candidate.
- identity-callback calls `writeEntityGrant` and contains no `callerMayOnProject`.
- The `rls-policy-map.md` row matches what file 32 asserts.
- The file-32 header claims check out: ordinal 32 is free (the tree holds 00–12 and 14–31); file 23 has no ProjectEditor; an empty array skips fixture seeding.

---

_Reviewed: 2026-09-19T16:00:06Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
