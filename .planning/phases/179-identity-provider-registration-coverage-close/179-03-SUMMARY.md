---
phase: 179-identity-provider-registration-coverage-close
plan: 03
subsystem: database
tags: [supabase, postgres, pgtap, migrations, invitations, throttle, identity-provider, schema-freeze]

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-01: the drivers (179-gates.sh, 179-e2e.sh, 179-bankauth.sh, 179-verdict.mjs), 179-BASE and 179-BASELINE; 179-02: the probe findings (P4 422 email_exists at issue)"
provides:
  - "claim_invitations reads no address for an account whose raw_app_meta_data names an identity_provider (J3, X2 (a) by mechanism)"
  - "public.address_confirmation_request (uuid, uuid, text) -> boolean: the caller's slot confirm:<project>:<user> (10 per 15 min) and then the address's link: slot (1 per 60 s, shared with the sign-in and recovery mails); SECURITY DEFINER, search_path '', service role only"
  - "private.caller_pending_email_taken () -> boolean (authenticated only) and the key pending_email_taken on get_user_entities"
  - "migrations 00002, 00003, 00004 with their manifest lines; 00001 untouched"
  - "pgTAP: 39-invitations § 24 (IDP:), new file 48-address-confirmation-request (ACR:), 36-entity-identity pending-address section (PET:), the 07-rpc-security service-role census"
affects: [179-10, 179-11, 179-13, 179-14, 179-19]

actuals:
  tokens: 14200
  tasks: 3
  commits: 6
plan_head_before: 3819fb786692947e1c2eadadf22036b32922f942
plan_head_after: 628890d3edebaff81415d5eb2c4abcf9995b2f57

tech-stack:
  added: []
  patterns:
    - "A new pgTAP assertion is tried green first against the schema change applied by hand with psql, the database is then reset, the test committed alone and the official red run made at that commit"
    - "An appended migration is cut from the schema file's text by position (header, body, revoke and grant), so the body text is identical by construction"

key-files:
  created:
    - apps/supabase/supabase/migrations/00002_claim_excludes_identity_provider_accounts.sql
    - apps/supabase/supabase/migrations/00003_address_confirmation_request.sql
    - apps/supabase/supabase/migrations/00004_user_entities_pending_email_taken.sql
    - apps/supabase/supabase/tests/database/48-address-confirmation-request.test.sql
  modified:
    - apps/supabase/supabase/schema/506-invitation-rpcs.sql
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations.manifest.json
    - apps/supabase/supabase/tests/database/39-invitations.test.sql
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - apps/supabase/supabase/tests/database/36-entity-identity.test.sql
    - packages/supabase-types/src/database.ts
    - .claude/skills/database/SKILL.md

key-decisions:
  - "Three migrations, three [db] commits (PL-02), each preceded by its own red test commit: 00002, 00003, 00004"
  - "The caller's slot is taken before the address's, and a refused take is counted, so a caller at its limit takes no address slot and learns nothing more"
  - "caller_pending_email_taken answers false (not null) with no caller, as the execution rules name it; caller_password_set keeps its null"
  - "The PWD key-set and whole-object assertions of 36-entity-identity were changed to expect the third key, inside the red commit, because the additive key would otherwise turn them red"
  - "The new pgTAP file took number 48, the planning day's number, still the next free one"

patterns-established:
  - "The throttle table holds a third key form, confirm:<project>:<user id>, the one key on a caller"

requirements-completed: []

coverage:
  - id: D1
    description: "An identity-provider account claims no invitation, by email or by a code bound to its address; a control without the key claims"
    requirement: "REG-04"
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/39-invitations.test.sql#IDP: (6 assertions)"
        status: pass
      - kind: other
        ref: "tests/e2e-runs/179-gates/179-03-db pgtap row"
        status: pass
    human_judgment: false
  - id: D2
    description: "The address-confirmation slot: one per address shared with the link mails, ten per caller per project per fifteen minutes, service role only"
    requirement: "REG-05"
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/48-address-confirmation-request.test.sql#ACR: (17 assertions)"
        status: pass
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/07-rpc-security.test.sql#census: ... exactly the ten listed"
        status: pass
    human_judgment: false
  - id: D3
    description: "get_user_entities carries pending_email_taken, a caller-only fact"
    requirement: "REG-05"
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/36-entity-identity.test.sql#PET: (10 assertions)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Three appended migrations equivalent to schema/, the frozen baseline unchanged, the suite and both bank-auth projects green"
    verification:
      - kind: other
        ref: "yarn check:schema-equivalence (EQUAL, three runs)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/179-e2e/179-03-close (548/548)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/179-e2e/179-03-close-bank-auth (8/8), 179-03-close-bank-auth-journey (475/475)"
        status: pass
    human_judgment: false

duration: about 42 min (19:59Z to 20:42Z)
completed: 2026-10-21
status: complete
---

# Phase 179 Plan 03: The schema block Summary

**Three appended migrations: `claim_invitations` reads no address for an account whose app metadata names an identity provider (00002). `address_confirmation_request` takes a per-caller `confirm:` slot (ten per fifteen minutes) and then the address's shared `link:` slot (00003). `get_user_entities` gains `pending_email_taken`, a caller-only fact (00004). Each was seen red first and found EQUAL by the equivalence check. The six database rows, the full suite (548/548) and both bank-auth projects are green on the committed tree.**

## Performance

- **Duration:** about 42 min (started 2026-10-21T19:59:18Z, ended 2026-10-21T20:42Z)
- **Tasks:** 3 of 3
- **Commits:** 6 (three red test commits, three `[db]` commits)
- **Files:** 4 created, 9 modified
- **Power:** on AC at 80 % throughout. The operator's battery override was not used.

## Migrations

| Version | File | sha256 | Equivalence |
|---|---|---|---|
| 00002 | `00002_claim_excludes_identity_provider_accounts.sql` | `c37a05b2c35400fdd3eb525ee28daa6ab2d47ffd05529c08b873a34644feac31` | EQUAL (36 s), `179-unit/179-03-equivalence-1.log` |
| 00003 | `00003_address_confirmation_request.sql` | `da106d4c982380fe6cd5df152acfd37c939d1fc2abe126dfafd8f46521fe4a50` | EQUAL, `179-03-equivalence-2.log` |
| 00004 | `00004_user_entities_pending_email_taken.sql` | `1d1fb4e0098d712d60bed198d731b9f1dacee4f421a71f4a445a2be8d795b681` | EQUAL, `179-03-equivalence-3.log` |

The manifest lists the four files in order. `yarn assert:schema-migration-parity` exits 0. `00001_initial_schema.sql` has no diff against `179-BASE`. Each migration was cut from its schema file's text (the header comment, the function, and for the new functions the revoke and grant), so the bodies are byte-identical to `schema/`.

## Red runs

All three are kept under `tests/e2e-runs/179-unit/` as `.log`, `.exit` and `.head`. Each was made on a freshly reset database at the test commit, with the schema change not yet applied.

| Run | Head | Exit | Red in | Failing |
|---|---|---|---|---|
| `179-03-pgtap-red-1` | 24406c469 | 1 | `39-invitations` only | 331–333: the identity-provider account claimed, its invitations were taken, it held a grant. The control and the binding step passed, as designed. |
| `179-03-pgtap-red-2` | b2a152288 | 1 | `07-rpc-security` (test 21, the census) and `48-address-confirmation-request` | The file stopped at its first call with `function public.address_confirmation_request(uuid, uuid, unknown) does not exist`. It ran 2 of 17, both failed, "Bad plan". |
| `179-03-pgtap-red-3` | 7e12bcf6e | 1 | `36-entity-identity` only | 13 failed: the ten new PET cases and the three PWD assertions changed to expect the third key |

Before each official red run, the test was first run green against the schema change applied by hand with `psql` (`179-03-pgtap-pre2`, `-pre3`, both PASS). The database was then reset. `179-03-pgtap-pre1` was an uncommitted-tree red run identical to red-1.

## Green runs per task (reset, types, pgTAP; on the uncommitted three-part change)

- Task 1: reset 0, types 0 (`database.ts` unchanged), pgTAP PASS `Files=47, Tests=2611`.
- Task 2: reset 0, types 0 (`database.ts` gains `address_confirmation_request`), pgTAP PASS `Files=48, Tests=2628`.
- Task 3: reset 0, types 0 (`database.ts` unchanged: the function is in `private` and the RPC returns `Json`), pgTAP PASS `Files=48, Tests=2638`.

## The close, on the committed tree (head 628890d3e)

- **Database rows `179-03-db`:** db-reset 0, types-regen 0, types-clean 0, pgtap 0, sql-lint 0, integration 0. The verdict printed `179-verdict gates 179-03-db: PASS` (6 of 6 rows, not stale, no Sleep entry).
- **Full run `179-03-close`:**
  - 548 total, 548 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 124 projects.
  - Not void, no Sleep entry.
  - `179-verdict e2e 179-03-close --same-projects-as tests/e2e-runs/179-e2e/179-01-baseline-r5`: PASS, 124 projects compared, 0 not as expected. The plan adds no E2E test, so no `--except` was used.
- **Bank-auth pair `179-03-close`:**
  - `179-03-close-bank-auth`: 8/8, exit 0.
  - `179-03-close-bank-auth-journey`: 475/475, exit 0.
  - "restore and probe: OK", and every stack container was Up afterwards.
- **Re-seed:** `yarn db:seed:default` exit 0, after the last run.

## Verify blocks

- Each `<automated>` block was taken byte for byte into `tests/e2e-runs/179-unit/179-03-t{1,2,3}-verify.sh`. Each exits **1** at the `yarn -s` stage, which Yarn 4.18.1 refuses (`Unsupported option name ("-s")`), the recurring deviation.
- The same chains with `yarn -s assert:` restated as `yarn assert:` (`-verify-restated.sh`):
  - Task 1 exited **0** at its own head b6776abe1.
  - Task 2 exited **0** at its own head 56fa6e3de.
  - Task 3 exits **0** at 628890d3e.
- The kept logs of the Task 1 and Task 2 at-head restated runs were overwritten by a re-run at the final head, so the two exit-0 results above are observed in this session but not kept. The final-head re-runs are kept as `*-verify-restated-finalhead.*`, exit 1. By construction, "the manifest's last entry is this migration" can only hold at that task's own head, and 00004 is now last.
- The same two chains without that one stage (`*-verify-restated-nolast.*`) exit **0** at 628890d3e.

## Task Commits

1. **24406c469** `test(179-03)`: an identity-provider account claims no invitation, as failing assertions (Task 1, red)
2. **b6776abe1** `feat[db](179-03)`: an identity-provider account claims no invitation (Task 1)
3. **b2a152288** `test(179-03)`: the slot of the address-confirmation mail, as failing assertions (Task 2, red)
4. **56fa6e3de** `feat[db](179-03)`: one slot per address and per caller for the address-confirmation mail (Task 2)
5. **7e12bcf6e** `test(179-03)`: whether the caller's pending address is another account's, as failing assertions (Task 3, red)
6. **628890d3e** `feat[db](179-03)`: the user-level read says whether the caller's pending address is another account's (Task 3)

## What was built

- **J3.** `claim_invitations`' address read gains `AND u.raw_app_meta_data ->> 'identity_provider' IS NULL`.
  - The header's WHAT IT TRUSTS paragraph gains the sentence.
  - Section 24 of `39-invitations` (`IDP: `, 6 assertions):
    - the code row is bound to the identity-provider address
    - the identity-provider account claims and skips nothing, with an email invitation and a bound code row for its address
    - both rows stay open
    - it holds no grant
    - the control without the key claims its invitation
    - the control's row is claimed and its grant written
  - `plan` 329 → 335.
- **The slot.** `public.address_confirmation_request` sits after `recovery_link_request` in `506-invitation-rpcs.sql`.
  - It is added to the service-role REVOKE and GRANT lists; the comment now counts eight.
  - The throttle table's header names the third key form.
  - The file header lists the function.
  - `48-address-confirmation-request.test.sql` (`ACR: `, 17 assertions) covers:
    - the catalogue and the privileges
    - the address's slot, shared with `invitation_link_request` and given back by `invitation_link_release`, with a control that the address is eligible
    - ten per caller, refused on the eleventh: the count reads 11 and no address slot was taken
    - per project
    - the window
    - null and blank arguments write nothing
    - the address trimmed and lower-cased
  - The `07-rpc-security` census now names ten functions.
- **The fact.** `private.caller_pending_email_taken` comes after `private.caller_password_set` in `301-auth-functions.sql`, which is after the schema-wide grant. It is STABLE SECURITY DEFINER with `search_path = ''`, EXECUTE for `authenticated` alone.
  - `get_user_entities` adds `'pending_email_taken', private.caller_pending_email_taken()`. Its header describes the key and the three definer calls.
  - `36-entity-identity` adds the pending-address section (`PET: `, 10 assertions) and two catalogue cases.
  - `plan` 75 → 85.
  - `07-rpc-security` has no census of `private` functions by role, so none was extended ("where that census exists").
- **The database skill** names, in its census and its § 9, § 10 and § 4 text:
  - the identity-provider term
  - `address_confirmation_request` and the `confirm:` key
  - `pending_email_taken` and `private.caller_pending_email_taken`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `yarn -s` is rejected by Yarn 4.18.1**
- **Found during:** every verify block.
- **Fix:** stages run as `yarn <script> > /dev/null`. The as-written and restated results are both recorded above.

**2. [Rule 3 - Blocking] Existing PWD assertions would turn red under the additive key**
- **Found during:** Task 3.
- **Issue:** `36-entity-identity` asserted exactly the two keys `entities, password_set` twice, and the whole object `{"entities": [], "password_set": false}` once.
- **Fix:** the three now expect the third key. The change is inside the red commit 7e12bcf6e, and all three were red in red-3 and green after 628890d3e.

**3. Prettier formatting of the new 39-invitations section folded into the `[db]` commit**
- **Found during:** Task 1.
- **Issue:** the red commit 24406c469 was not Prettier-clean (two long expressions).
- **What was done:** the formatting-only reflow went into b6776abe1 with the schema change. The checklist's "formatting in its own commit" item is therefore not met for those 4 lines.

**4. The skill's § 10 claim paragraph was updated in the Task 2 commit, not Task 1's**
- **Issue:** the J3 sentence of `.claude/skills/database/SKILL.md` did not land in the Task 1 commit.
- **What was done:** it was added in 56fa6e3de, together with the census change.

**5. A first check of each new assertion against a hand-applied function**
- **What was done:** the Task 2 and Task 3 functions were applied to the local database with `psql` to run the new assertions green before the red commit. `yarn db:reset` then removed them before the official red run.
- **Why recorded:** the plan does not name this step. It changes nothing committed.

**Total deviations:** 2 auto-fixed (Rule 3), 3 procedural.
**Impact on plan:** none on the schema. Every gate named by the plan is green.

## Files touched outside the plan's list

None. Every file is in `files_modified`. `tests/e2e-runs/` evidence is gitignored.

## Code review checklist (`.agents/code-review-checklist.md`)

- **OWASP and security:**
  - The new definer functions take no address or user id from an API caller.
  - `address_confirmation_request` is executable by the service role alone, `caller_pending_email_taken` by `authenticated` alone, and both are pinned by pgTAP.
  - No function writes into `auth` (PROH-179-06).
- **SECURITY DEFINER with `search_path = ''` and qualified calls:** yes, for both.
- **pgTAP conventions:**
  - Every file uses BEGIN/ROLLBACK and `create_test_data()`.
  - The suite uses `is()` throughout.
  - There are no throws cases, because privileges are asserted with `has_function_privilege`.
- **Documented:** every new function has a header in the file's style, and the skill is updated.
- **Comment hygiene:** `yarn assert:comment-hygiene` passed before each commit. No comment holds a plan, decision or phase id.
- **`[db]` tag:** on all three schema commits.
- **Formatting in its own commit:** not met for the 4-line reflow (deviation 3).
- **Commit history clean and linear:** yes.
- **Not applicable:** `any`, Svelte, WCAG, keyboard and tracking. No application TypeScript or markup was added.

## Observed vs inferred

- **Observed:** every exit status, count, verdict, sha256 and failing test above, and the hand-applied green runs.
- **Inferred:**
  - That red-2's 48 file failed only for the missing function: its first call raised `does not exist` and nothing else ran.
  - That `pending_email_taken` is no bulk oracle. The function reads only the caller's own `email_change`. Whether the auth service lets a signed-in user set `email_change` directly (`updateUser({ email })`) without going through `address_confirmation_request` was not probed, so the schema header claims only what the application does. See the item below.

## Items to report rather than edit

- **The oracle argument behind U-16 rests on an unprobed assumption.**
  - The plan's header text for `caller_pending_email_taken` says the pending address is "set through the throttled operation".
  - A signed-in user may be able to set `email_change` directly through the auth service's user update. That path is not throttled by `address_confirmation_request`, and the auth service itself may answer `email_exists` there.
  - The header written states only that the application sets the pending address through the limited request.
  - A probe row (or plan 179-10's review) should establish whether the direct path is open under `double_confirm_changes = true` and the no-op mail hook.
- **`.claude/skills/database/schema-reference.md` and `rls-policy-map.md` carry function rows and were not edited.** The plan names only `SKILL.md`, so the two new functions are absent from them.
- **`179-EXECUTION-RULES.md` § *Names this phase introduces*** says the `link:` slot is "the key and limit `invitation_link_request` uses". That holds. The skill text "keyed on what a request is about, never on the caller" was made false by the `confirm:` key and was corrected in the skill, which the plan allows.

## Next Phase Readiness

- 179-10 can call `address_confirmation_request` through the service role and release the address's slot with `invitation_link_release`.
- 179-11 can read `pending_email_taken` from `get_user_entities`.
- Every later mailed-link sign-in already runs the J3 claim.
- The next migration takes `00005`, and the next pgTAP file `49`.
- The stack is up with the edge runtime restored, and the default dataset is seeded.

## Self-Check: PASSED

- The files exist: the three migrations, `48-address-confirmation-request.test.sql` and the modified schema and test files.
- All six commits are ancestors of HEAD: 24406c469, b6776abe1, b2a152288, 56fa6e3de, 7e12bcf6e, 628890d3e.
- `git rev-list --count 3819fb786..HEAD` = 6.

---
*Phase: 179-identity-provider-registration-coverage-close*
*Completed: 2026-10-21*
