---
phase: 162-permissions-auth-model-refactor
reviewed: 2026-09-20T08:21:40Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
  - apps/supabase/supabase/functions/send-email/flowConformance.test.ts
  - apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql
findings:
  critical: 3
  warning: 7
  info: 7
  total: 17
status: issues_found
---

# Phase 162: Code Review Report

**Reviewed:** 2026-09-20T08:21:40Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

**Scope.** This review is scoped to the **three flow-conformance artifacts only** — the two vitest gates
produced by plan 162-19/162-18 beside the `invite-candidate` and `send-email` Edge Functions, and the new
pgTAP file `32-level1-confirmation-flow.test.sql`. A prior review of the full phase surface is archived
alongside this file as `162-REVIEW-full-scope.md`; nothing in that document is restated or superseded here.

**What was checked.** Each file was read in full against the production code it claims to pin
(`invite-candidate/index.ts`, `send-email/index.ts`, `callerAuthority.ts`, `entityGrant.ts`,
`schema/000-enums.sql`, `schema/301-auth-functions.sql`, `schema/011-validation-functions.sql`) and against
`162-FLOW-CONFORMANCE.md`, which names these three files as the executable half of ROADMAP criterion 7. The
vitest halves were executed as-is (33/33 green: 17 + 16, matching the document's counts) and then subjected
to **four planted mutations** in an out-of-tree copy of `apps/supabase` (scratchpad; no source file in this
worktree was modified). The pgTAP file was read statically and its declared `plan(13)` reconciled by hand
against its 13 assertion calls; it could not be executed because the running local Postgres has no `pgtap`
extension installed, and installing one into the shared dev database was out of scope for a read-only review.

**Assessment.** The pgTAP file is the strongest of the three: its plan count is correct, every refusal has a
paired allowance, every deciding read is made as `postgres`, the ProjectEditor is built as a real grant row
and its cardinality is asserted at both ends, and `try_edit_nomination` is correctly *not* `SECURITY DEFINER`.
Its defects are documentation-level and stylistic.

The two vitest gates are where the problems are, and they are not cosmetic. **Both files are pure source-text
scrapers over `index.ts` and assert lexical ordering of substrings, never behaviour.** Three separate
authorization-shaped mutations — a 403 response constructed but never returned, a caller-controlled boolean
OR'd into the gate, and the invited candidate's grant rewritten to point at an `organization` whose target is
the *project* id — each leave **all 33 tests green**. `162-FLOW-CONFORMANCE.md` rows 7, 3 and 13 of the
`invite-candidate` table and rows 4 and 3 of the `send-email` table cite exactly these tests as what pins
those steps, so the document currently over-claims what its executable half enforces. That is the finding the
document's own epigraph asks for ("a conformance check that reports no findings at all is the outcome to
distrust") turned back on the check itself.

A further six of the 33 tests (`reads no retired claim key: %s`, three per file) cannot fail for any realistic
edit: they assert `not.toContain('payload.<key>')`, and the token `payload` does not occur anywhere in either
`index.ts`.

None of this says the production code is wrong — `invite-candidate/index.ts` and `send-email/index.ts` read
correctly today. It says the gate that is supposed to keep them correct on every build does not bind the
properties it is documented as binding.

---

## Critical Issues

### CR-01: The 403 refusal is pinned lexically, not as a refusal — dropping its `return` is an authorization bypass that stays green

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:118-131`
**File:** `apps/supabase/supabase/functions/send-email/flowConformance.test.ts:79-92`

**Issue:** Both tests are titled *"refuses on the answer of the gate, with a 403, before the service-role
client exists"*, and `162-FLOW-CONFORMANCE.md` cites them as what pins invite row 7 and send-email row 4
("is the answer obeyed before the service role acts?"). What they actually assert is that five substrings
occur in `index.ts` in a particular *order*. Nothing asserts that the refusal branch **returns**.

Planted mutation **M1** (verified, out-of-tree copy), deleting one word from
`invite-candidate/index.ts:88`:

```ts
    if (!mayInvite) {
      // `return` removed -- the Response is constructed, discarded, and execution falls through
      new Response(JSON.stringify({ error: 'Forbidden: caller may not create candidates in this project' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
```

Result: **17/17 pass.** A caller holding no grant at all now creates a candidate row, is issued an auth user,
receives an invite e-mail and is written an entity grant. Mutation **M2**, the identical edit to
`send-email/index.ts:122`, leaves **16/16** green — an unauthorised caller reaches the service-role client and
bulk-sends. The `162-18` control G1/G1s (refusal condition replaced with a constant `false`) is caught only
because the test searches for the literal `if (!mayInvite)`; the missing-`return` class is not, and it is by
far the more plausible regression.

**Fix:** Assert the refusal *returns*, and assert it as one contiguous block rather than as five independent
`indexOf` hits:

```ts
it('refuses on the answer of the gate, with a 403 it RETURNS, before the service-role client exists', () => {
  const refusal = INDEX_SOURCE.match(
    /if \(!mayInvite\) \{\s*return new Response\(([\s\S]*?)\);\s*\}/
  );
  expect(refusal).not.toBeNull();
  expect(refusal![1]).toContain('status: 403');
  expect(refusal![1]).toContain('Forbidden: caller may not create candidates in this project');
  const adminAt = INDEX_SOURCE.indexOf('SUPABASE_SERVICE_ROLE_KEY');
  expect(adminAt).toBeGreaterThan(refusal!.index!);
});
```

and add the missing-`return` variant to `evidence/162-18/flow-controls.txt` as control G1b so the gap is
recorded as measured rather than assumed. Apply the same shape to `send-email` with `mayBulkSend` /
`'Forbidden: caller may not send bulk email for this project'`.

---

### CR-02: The gate's answer is never pinned as the *sole* input to the refusal — a caller-controlled escape hatch stays green

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:103-109, 118-131`
**File:** `apps/supabase/supabase/functions/send-email/flowConformance.test.ts:64-70, 79-92`

**Issue:** `asks the database for the authority decision rather than re-deriving it` asserts the exact call
text is present and that three retired-shape patterns (`payload.grants`, `/g\.scope\s*===/`,
`/g\.role\s*===/`) are absent. `refuses on the answer of the gate` locates `const mayInvite = await
callerMayOnProject(callerClient` by prefix. Neither constrains what else contributes to `mayInvite`.

Planted mutation **M3** (verified), at `invite-candidate/index.ts:85`:

```ts
const mayInvite =
  (await callerMayOnProject(callerClient, projectId, 'project.edit_entities')) || body.debugBypass === true;
```

Result: **33/33 pass across both files.** The pinned call text is still present, the `const mayInvite = await
callerMayOnProject(callerClient` prefix still matches (`await X || Y` parses as `(await X) || Y`), no retired
pattern appears — and any anonymous caller with a valid session can now post `{"debugBypass": true}` and
create candidates in any project. This is exactly the defect class 162-REVIEW CR-05/WR-09 closed, reopened
through a channel the replacement gate does not watch.

**Fix:** Bind the whole assignment statement, not a prefix of it:

```ts
expect(INDEX_SOURCE).toMatch(
  /const mayInvite = await callerMayOnProject\(callerClient, projectId, 'project\.edit_entities'\);\n/
);
```

Then assert there is exactly one assignment to `mayInvite`
(`expect(INDEX_SOURCE.split(/\bmayInvite\s*=/).length - 1).toBe(1)`). Same for `mayBulkSend` in `send-email`.

---

### CR-03: `writes a grant shape that is one of § 3.1's eight rows` asserts on arguments the test itself supplied — the flow's real call site is never checked

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:150-170`
**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:172-193`

**Issue:** Both tests import `writeEntityGrant` and drive it with arguments **the test body constructs**
(`entityType: 'organization'`, `entityType: 'candidate' | 'faction' | 'alliance'`, literal dummy UUIDs). They
therefore measure `entityGrant.ts` in isolation — which `entityGrant.test.ts` already does, more completely
(it also pins the `grants` table name and the full row, lines 59-76 of that file). **No assertion anywhere in
this file reaches the invite flow's actual call site**: `INDEX_SOURCE` is never searched for
`writeEntityGrant`, for `entityType: 'candidate'`, or for `entityId: candidate.id`.

`162-FLOW-CONFORMANCE.md` invite row 13 ("the invited identity's grant — `writeEntityGrant(supabaseAdmin,
{ …, entityType: 'candidate', … })` … § 3.1 row 5 `(entity, candidate, id, editor)`: the Candidate column
only") cites precisely these two tests as what pins it. They do not.

Planted mutation **M7** (verified), at `invite-candidate/index.ts:154-155`:

```ts
      await writeEntityGrant(supabaseAdmin, {
        userId: inviteData.user.id,
        entityType: 'organization',   // was 'candidate'
        entityId: projectId           // was candidate.id
      });
```

Result: **17/17 pass.** Every invited candidate is now granted `(entity, organization, <projectId>, editor)`
— a grant row pointing at a target that is not an organization at all, and the invited principal is left
unable to edit their own record while holding an entity grant nobody in § 3.1 row 5 describes. Note that the
sibling gate `identity-callback/flowConformance.test.ts` *does* carry the call-site assertion this file is
missing (`writes its grant through the extracted module rather than inline`), so the pattern exists in the
corpus and was simply not applied here.

**Fix:** Add the call-site assertion, in the shape `identity-callback` already uses:

```ts
it('names the invited identity as a CANDIDATE entity at the one write site (D-20, D-21)', () => {
  expect(INDEX_SOURCE).toMatch(
    /await writeEntityGrant\(supabaseAdmin, \{\s*userId: inviteData\.user\.id,\s*entityType: 'candidate',\s*entityId: candidate\.id\s*\}\)/
  );
  // exactly one entity-type literal on the whole path
  expect(INDEX_SOURCE.split(/entityType:/).length - 1).toBe(1);
});
```

and either delete the two imported-module tests as duplicates of `entityGrant.test.ts`, or retitle them so
they no longer read as flow-conformance evidence (`162-FLOW-CONFORMANCE.md` row 13 must be re-derived either
way).

---

## Warnings

### WR-01: `reads no retired claim key: %s` cannot fail — six tests bound to a variable name that does not exist in either module

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:98-101`
**File:** `apps/supabase/supabase/functions/send-email/flowConformance.test.ts:59-62`

**Issue:** The assertions are `expect(INDEX_SOURCE).not.toContain('payload.' + key)` and
`not.toContain("['" + key + "']")`. Measured: the substring `payload` does not occur **anywhere** in either
`invite-candidate/index.ts` or `send-email/index.ts` (both read no claim at all since CR-05/WR-09). The tests
can only redden if a future edit reintroduces that exact variable name *and* that exact access form — a
`const claims = decode(...); claims.user_roles` or `p?.user_roles` slips through untouched. Three tests per
file, six of the 33 total, currently assert nothing.

**Fix:** The stronger form is free and costs nothing, because neither module contains the tokens at all:

```ts
it.each(RETIRED_CLAIM_KEYS)('reads no retired claim key: %s', (key) => {
  expect(INDEX_SOURCE).not.toContain(key);
});
```

### WR-02: the permission-literal assertions match comments as well as code, so the "not vacuous" guard is satisfiable by prose

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:59, 86-96`
**File:** `apps/supabase/supabase/functions/send-email/flowConformance.test.ts:29, 43-57`

**Issue:** `PERMISSION_SHAPED` is applied to the raw file text. Measured occurrences:

| file | line | kind | match |
|---|---|---|---|
| `invite-candidate/index.ts` | 82 | comment | `project.edit_entities` |
| `invite-candidate/index.ts` | 84 | comment | `project.edit_entities` |
| `invite-candidate/index.ts` | 85 | **code** | `project.edit_entities` |
| `send-email/index.ts` | 114 | comment | `project.edit_entities` |
| `send-email/index.ts` | 119 | **code** | `project.edit_entities` |

Two of the three matches in `invite-candidate` and one of the two in `send-email` are prose. The guard
`names at least one permission literal, so the membership assertion below is not vacuous` would therefore stay
green against a module that named no permission in executable code at all; and
`names the permission bulk send asks for` (`send-email:54-57`) is satisfied by the comment on line 114 alone.

**Fix:** Strip comments before matching, so the scraper measures code:

```ts
const CODE_ONLY = INDEX_SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
```

and run `PERMISSION_SHAPED` over `CODE_ONLY`. Keep the raw-text form only for the negative
`names no permission literal outside the derived enum` check, where matching prose is a feature.

### WR-03: `GRANT_SCOPES` / `GRANT_ROLES` are transcribed literals in the file whose headline invariant is "DERIVED, NEVER TRANSCRIBED"

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:66-68, 166-167`

**Issue:** Line 8 of this file states the phase's governing principle: *"THE PERMISSION VOCABULARY IS DERIVED,
NEVER TRANSCRIBED … Deriving it also keeps this file from becoming a second copy of § 3.2, which is the thing
phase 162 exists to end."* Lines 67-68 then hand-transcribe the scope and role vocabularies:

```ts
const GRANT_SCOPES = ['global', 'account', 'project', 'entity'] as const;
const GRANT_ROLES = ['admin', 'editor'] as const;
```

`deriveScopeVocabulary` (line 38) already derives the first of those from `000-enums.sql` — and is used only
once, in an unrelated test at line 215. The grant-shape assertion at line 166 checks against the transcribed
copy, so a change to `public.grant_scope_type` or `public.grant_role_type` will not redden it.

**Fix:** Use the derived vocabularies at the assertion site and derive the roles the same way
(`deriveRoleVocabulary(ENUM_SOURCE)` over `CREATE TYPE public.grant_role_type AS ENUM( … )`), pinning each
length before use exactly as `PERMISSIONS` is pinned at 23.

### WR-04: `binds the gate RPC to the parameter names user_can declares` asserts the scope is *any* of four, and asserts neither the target nor the permission value

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:211-229`

**Issue:** The test records the RPC call and asserts `Object.keys(args).sort()` equals the declared parameter
names, then `expect(scopes).toContain(calls[0].args.p_scope)` — satisfied by `'global'`, `'account'`,
`'entity'` or `'project'` alike. `calls[0].args.p_target_id` and `calls[0].args.p_permission` are never
asserted at all. A helper that asked `user_can('global', <projectId>, …)` — which denies for every caller,
turning every invite into a silent outage — passes this test, which is the exact failure mode its own comment
says it exists to catch ("Guards an OUTAGE rather than a widening").

**Fix:**

```ts
expect(calls[0].args).toEqual({
  p_scope: 'project',
  p_target_id: '00000000-0000-0000-0000-0000000000cc',
  p_permission: 'project.edit_entities'
});
expect(Object.keys(calls[0].args).sort()).toEqual([...declared].sort());
```

### WR-05: the stated rationale for pinning the vocabulary at 23 is the opposite of what the assertions do

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:8, 25-27, 71-74`
**File:** `apps/supabase/supabase/functions/send-email/flowConformance.test.ts:8, 34-36`

**Issue:** Both docblocks assert: *"its size is pinned at 23 BEFORE any membership assertion uses it, because
a vocabulary that came back empty would make every `toContain`-style membership check below pass for
everything."* That is false for every membership assertion in either file. With `PERMISSIONS === []`:

- `expect(outside).toEqual([])` (line 95 / 51) **fails** — every named literal becomes "outside".
- `expect(PERMISSIONS).toContain('project.edit_entities')` (line 73) **fails**.
- `expect(PERMISSIONS).toContain('project.edit_entities')` (`send-email:56`) **fails**.

The real vacuity hazard is an empty `named` list (guarded separately, and imperfectly — see WR-02), not an
empty vocabulary. "BEFORE any membership assertion uses it" is also not enforced: vitest runs the guard as a
peer `it`, not as a precondition, so a failing derivation does not prevent the later tests from executing.

**Fix:** Correct both docblocks to state what the 23-pin actually guards (a *partial* derivation, which would
make legitimate literals read as non-members and produce a confusing red rather than a silent green), or move
the derivation guard into a `beforeAll` that throws, which would make the "BEFORE" claim true.

### WR-06: `never as a caller-chosen sender` pins one stale spelling and never asserts the sender actually used

**File:** `apps/supabase/supabase/functions/send-email/flowConformance.test.ts:123-129`

**Issue:** The negative half is `expect(INDEX_SOURCE).not.toMatch(/from\s*\|\|\s*requireEnv/)` — a single
historical spelling. `from ?? senderAddress`, `from || senderAddress`, or `from: body.from` at the
`transport.sendMail` call all pass it. The test never asserts the positive property that actually holds today
(`from: senderAddress` at `send-email/index.ts:271`), so the one line that decides the envelope sender is
unpinned.

**Fix:** Replace the stale negative with the positive binding and a general negative:

```ts
expect(INDEX_SOURCE).toMatch(/await transport\.sendMail\(\{\s*from: senderAddress,/);
expect(INDEX_SOURCE).not.toMatch(/from:\s*(?:from|body\.from|req)/);
```

### WR-07: the pgTAP header cites a precedent that does not exist in the tree

**File:** `apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql:31`

**Issue:** The header states `try_edit_nomination` is *"the same instrument `23-nominations-write.test.sql`
uses, for the same reason."* Measured: `23-nominations-write.test.sql` contains **no** `pg_temp.try_edit_nomination`
and no `GET DIAGNOSTICS` at all — only a stale header comment of its own (line 25) describing an instrument
it does not define. 23's equivalent step (lines 141-160) is a bare `UPDATE` followed by an `is()` on the
`confirmed` flag; it never measures rows affected. This file's instrument is genuinely *stronger* than 23's,
which makes the false provenance claim worth correcting rather than deleting: a reader following the citation
finds nothing and is left unsure whether 23 regressed.

Because `162-FLOW-CONFORMANCE.md` is a conformance artifact whose whole value is that its citations can be
followed, an uncheckable citation in the file it cites is a defect of the same kind the document exists to
prevent.

**Fix:** Change the sentence to record what is true — that 23 asserts the flag alone and this file adds the
row-count measurement 23's own header describes but does not implement — and open a follow-up to either
delete or implement 23's line-25 comment.

---

## Info

### IN-01: seven `set_test_grants` calls are no-ops

**File:** `apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql:109-110, 169-170, 195-196, 246-247, 282-283`
**Issue:** `set_test_user(role, uid, '[]')` already sets the claim's `grants` key to `test_grants_claim(uid)`
(`00-helpers.test.sql`, the `claims := json_build_object(... 'grants', v_claims_grants)` branch).
`set_test_grants(uid)` then performs `jsonb_set(claims, '{grants}', test_grants_claim(uid))` — byte-identical
to what is already there. The sibling file this one models itself on, `23-nominations-write.test.sql`, calls
it zero times. (`12-user-can.test.sql` carries the same redundancy 27 times, so this is an inherited pattern
rather than a new one.)
**Fix:** Drop the five `set_test_grants` call pairs, or add a one-line comment recording that they are
defensive against a future `set_test_user` that stops projecting.

### IN-02: an assertion subsumed by the line below it

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:166-169`
**Issue:** `expect(GRANT_SCOPES).toContain(written[0].scope)` followed by `expect(written[0].scope).toBe('entity')`
— the second strictly implies the first; likewise for role. Dead assertions that make the test read as
stronger than it is.
**Fix:** Keep only the exact-value assertions (and see WR-03 for what the vocabulary check should become).

### IN-03: the recording fake client is duplicated verbatim, and is weaker than the one it copies

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:151-159, 174-182, 196-200`
**Issue:** Three near-identical hand-built clients. All three declare `from: () => ({ insert })`, discarding
the table name — so nothing in this file pins that the grant is written to `grants`. `entityGrant.test.ts`
already has a shared `makeClient()` that records `recorded.tables` and asserts `toEqual(['grants'])`.
**Fix:** Import or re-use that helper rather than re-declaring a lossy copy.

### IN-04: a negative assertion over a historical comment string

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:146`
**Issue:** `expect(INDEX_SOURCE).not.toContain("Log but don't fail")` pins the absence of a comment that used
to sit in `index.ts`. Reintroducing the non-fatal behaviour with any other wording passes. The behavioural
half of that test (the exact count of two `rollbackInvite` calls, line 145) is what carries the property.
**Fix:** Delete the comment assertion; it adds noise and a false sense of coverage.

### IN-05: L2's `throws_like` pattern is unanchored where an anchored one was available

**File:** `apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql:176`
**Issue:** `'%nomination.confirm%'` matches anywhere in any error message. `enforce_nomination_confirmation`'s
rule-2 refusal begins with the stable prefix `Setting nomination ` (D-23's discipline), and L5 in this same
file (line 291) *does* anchor: `'Entity confirmation requires the entity.confirm permission:%'`. The looser
form is inherited from `23-nominations-write.test.sql:167`, so this is a consistency note rather than a live
hazard.
**Fix:** `'Setting nomination % confirmed requires the nomination.confirm permission%'`.

### IN-06: `derivePermissionVocabulary` is copy-pasted across the flow files

**File:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:29-33`
**File:** `apps/supabase/supabase/functions/send-email/flowConformance.test.ts:20-24`
**Issue:** Byte-identical function bodies in (at least) three flow-conformance files, plus `PERMISSION_SHAPED`
and `RETIRED_CLAIM_KEYS`. Unlike the Edge Function modules, **test files are not subject to the Supabase
per-directory deployment constraint** that justifies `DUPLICATED_MODULES`, so the duplication has no
counterpart reason. A fix to WR-02's comment-stripping will have to be applied three times.
**Fix:** A single `supabase/functions/_testing/permissionVocabulary.ts` imported by all three test files
(vitest resolves it; no Edge Function imports it, so no deployment unit changes).

### IN-07: the L3 paired control is a bare `UPDATE` outside any assertion

**File:** `apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql:198-203`
**Issue:** The ProjectAdmin's edit-and-confirm runs as a naked statement. If it raised — e.g. a future policy
change refusing the admin — the transaction aborts and the whole file dies with
`current transaction is aborted` on every subsequent line, rather than reporting one named failing assertion.
The row-count is also unmeasured (only the resulting flag is checked at line 209).
**Fix:** Route it through `lives_ok(format($$UPDATE nominations SET custom_data = …, confirmed = true WHERE id = '%s'$$, test_id('nomination_cand_a')), 'L3: …')`
and raise `plan()` to 14, keeping the flag assertion at line 209 as the landing check.

---

## Verification notes

- Both vitest files were executed unmodified at review time: `17 passed` / `16 passed`, 33 total — matching
  `162-FLOW-CONFORMANCE.md`'s stated counts.
- All four planted mutations (M1, M2, M3, M7) were applied to an **out-of-tree rsync copy** of `apps/supabase`
  in the session scratchpad. No file in this worktree was modified by this review.
- `prettier --check` passes on all three files.
- `32-level1-confirmation-flow.test.sql` was **not executed**: the running local Postgres (127.0.0.1:54322)
  has no `pgtap` extension installed, and installing one into the shared dev database was out of scope for a
  read-only review. Its `plan(13)` was reconciled by hand against its 13 assertion calls (lines 67, 86, 113,
  122, 136, 149, 173, 209, 227, 250, 263, 286, 302) and matches. The doc's control mapping ("N1 reddens 6-7,
  N2 reddens 12") is consistent with that numbering.

---

_Reviewed: 2026-09-20T08:21:40Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
