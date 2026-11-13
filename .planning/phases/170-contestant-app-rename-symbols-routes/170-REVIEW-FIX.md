---
phase: 170-contestant-app-rename-symbols-routes
step: review-fix
batch: review-fix-A
findings_fixed: [WR-01, IN-02]
findings_out_of_scope: [IN-01, IN-03, IN-04, IN-05]
base: dd5dd97a7
gates: tests/e2e-runs/179-gates/review-fix-A-r2
e2e_close: tests/e2e-runs/179-e2e/review-fix-A
status: complete
---

# Phase 170 review fix: WR-01, IN-02

Fixed in review-fix batch A, with phases 172, 173, 174, 178 and 179. Each finding got a failing test first, with the exit of its red run recorded, then the fix, then the green run. The gate set and the E2E close below are the batch's, run on the batch's final tree. IN-01, IN-03, IN-04 and IN-05 were not in this batch.

## WR-01: a failed sign-out is reported, and the browser is not signed out alone

**Disposition:** fixed.

**Verified:** `/api/auth/logout` discarded the `{ error }` of `signOut({ scope: 'local' })` and always answered 200 `{ ok: true, type: 'success' }`, and `SupabaseDataWriter._logout` never read the response before its browser-side `signOut`.

**Red** (7a01f6718): vitest over `routes/api/auth/logout/server.test.ts` and `supabaseDataWriter.test.ts` (with the IN-02 file): **exit 1**.
- "answers a failure, never success, when the sign-out failed and the session cookies may still be set": 200 success.
- "rejects without signing the browser out when the server could not clear the session cookies": the writer went on to the browser sign-out after a 502.

**Fix** (eeea064cf):
- The endpoint answers **502** `{ ok: false, type: 'failure' }` and logs the error's name when `signOut` returns an error.
- `_logout` throws when the endpoint answers non-ok, before the browser-side sign-out, so the browser does not read as signed out while the cookies still hold a session. The contexts' `logout` already catches and logs a writer error.

**Green:** the same vitest run, **exit 0** (366 passed across the five files of that run).

## IN-02: the admin login page's reason is the admin `LoginError`, looked up as an own member

**Disposition:** fixed.

**Verified:** the page's doc named `ContestantLoginError`, and the admin `getErrorTranslationKey` tested `error in LOGIN_ERROR`, so `constructor`, `toString`, `__proto__` and `hasOwnProperty` answered a "key".

**Red** (7a01f6718): the new `lib/admin/utils/loginError.test.ts`: four cases failed (**exit 1** for the run above).

**Fix** (eeea064cf): `Object.hasOwn(LOGIN_ERROR, error)`, as the contestant twin does; the doc line names `LoginError` (`$lib/admin/utils/loginError`) and the type's doc names the Admin App.

**Green:** the same run, **exit 0**.

## Commits

| Commit | Kind | What |
| --- | --- | --- |
| 7a01f6718 | test | WR-01 and IN-02 red |
| eeea064cf | fix | WR-01 endpoint and writer; IN-02 own-member lookup and doc |

## Gates and E2E close of batch A

- **Gate set `review-fix-A`**, on 07e21ef7a: 20 of 22 rows exit 0. Two were red, both fixed in commits of their own: `unit` (dev-seed `hostedSettingsParityGate.test.ts`: the hosted-settings fixture for `max_rows` still carried `mailer_otp_length: 6`; 2aeccb2d9) and `format` (two docs tables needed the docs workspace's Prettier; 5e1a0b851).
- **Gate set `review-fix-A-r2`**, on 5e1a0b851: all 22 rows exit **0**. `179-verdict gates review-fix-A`: **PASS**, not stale, no Sleep entry in the window.
- The stack was restarted (`yarn db:stop && yarn db:start` through the key filter, exit 0) after the auth-config and function changes, before the first gate set (the auth container then served `GOTRUE_MAILER_OTP_LENGTH=10`), and again before the E2E run.
- **E2E close `review-fix-A`**, on 5e1a0b851, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 14.9 min. Wrapper exit 0, `restore: ok`. Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-A --same-projects-as 179-review-fix-final`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0.
- After the run the throttle table held 27 `link-address:` keys, the largest count 1, so a full run uses little of an address's twenty a day.
- `yarn db:seed:default` exit 0 afterwards. `179-verdict hygiene`: PASS.


---

# Review-fix batch C: IN-01, IN-03, IN-04, IN-05, and the bulk-key quoting

Fixed in review-fix batch C (base e93f172bb), with phases 171, 172, 174.1, 175 and 179. The batch's gate set and E2E close are given at the end of this section. The bulk-key quoting fix has no review id; it is recorded here, in this phase's record, because the file it guards, `schema/501-bulk-operations.sql`, is in no phase of the batch, and 170's record is the one the dispatch named first.

| Finding | Disposition | Commits |
| --- | --- | --- |
| IN-01 | fixed, documentation | 049a7f5d7, 0836d228e |
| IN-03 | fixed: the spec asserts page-wide absence | 21f7eeb36 |
| IN-04 | fixed | cb528fd8a (red), 0a9ac0b04 (fix) |
| IN-05 | fixed, documentation | 5c6dc4258 |
| bulk-key quoting | fixed | 24d998f45 (red), 9a1d2d121 (fix) |

## IN-01: the codemod's and the spike's records name things that exist

**Verified.** The rename codemod's exclusion comment named the key `'ContestantContext-contestantUserDataStore-…'`, and the spike-005 source and four spike references cited `contexts/contestant/contestantUserDataStore.svelte.ts`; neither ever existed.

**Fix** (049a7f5d7, 0836d228e). The review's first fix, restoring the `Candidate…` spellings, is not possible without weakening the app-name guard: `CandidateUserData` and `contexts/candidate` are its findings, and its one exemption is the app's own shown name. The review's alternative was taken:
- The codemod's exclusion comment names a key that exists (`'VoterContext-answerStore'`), and one line above the rename table says the `ContestantUserDataStore*` rows match only the Contestant App's spelling. The second commit moved that line above the table, because between a heading comment and its rows the comment-hygiene guard reads it as one broken comment.
- The spike-005 source and the spike skill's references cite the module by its current path and name (`contestantUserDataState`), and the source says in one line that it is a record citing current names, with line numbers of the earlier file.

App-name guard and comment-hygiene guard: **exit 0**.

## IN-03: the per-app notification spec asserts page-wide absence

Each case keeps its filtered-dialog assertions and adds that no dialog on the page carries the other app's marker (`toHaveCount(0)`), which is what the header claims. A test-only change, so its evidence is the E2E close (`perm-per-app-notifications` green).

## IN-04: the app-name guard fails on a tracked file it cannot read

**Red** (cb528fd8a): a new dev-seed test copies the guard into a throwaway git repository and runs it there: **exit 1**, 1 of 3 failed; a tracked file of mode 000 was skipped with no output and the guard exited 0.

**Fix** (0a9ac0b04): a read failure other than `EISDIR` is named on stderr with its code and counted; the summary line counts the unreadable files, and gate mode exits 1 when there is one. A tracked symbolic link to a directory (`EISDIR`) is passed over without a report. The test file was renamed `appNameGuardUnreadable.test.ts` in the fix commit, because its first name and its own text were findings of the guard it tests.

**Green:** the test **exit 0**, 3 passed; the guard on the tree **exit 0**, 0 unreadable; `--self-test` **exit 0**.

## IN-05: the access templates' comment names no consumer that does not exist

The comment now says the two single-mode templates are kept only as `yarn db:seed --template` conveniences and that no setup, spec or script resolves them. Removing them is not done: it would remove two CLI names someone may use, which is the operator's to decide.

## Bulk-key quoting: an imported item's key is a column name and nothing else

**Verified.** `_bulk_upsert_record` appended `item_key` unquoted to `col_names` and to every `update_parts` entry of the dynamic `INSERT ... ON CONFLICT DO UPDATE`. The function is `SECURITY INVOKER`, so a hostile key runs as its caller, but it rewrites the statement.

**Red** (24d998f45): the new pgTAP `51-bulk-import-key-quoting.test.sql` with `00-helpers`: **exit 1**, 2 of 6 failed. The key `subtype) VALUES (<project>::uuid, 'quoting-injected', 'injected') RETURNING true AS inserted --` closed the column list, supplied its own VALUES and commented out the rest; the import raised nothing and stored the row the key described. Log `tests/e2e-runs/179-unit/review-fix-C-bulk-key-db-red.log`.

**Fix** (9a1d2d121): `quote_ident(item_key)` in the column list and in all four `update_parts` forms; the relationship columns come from the function's own map and are unchanged. The function header says a key is quoted as an identifier and a value as a literal. Migration `00008_bulk_import_key_quoting.sql` holds the function and its header byte-for-byte from `schema/501-bulk-operations.sql`, with its manifest line. The function's signature did not change and no function was added.

**Green:** after `yarn db:reset`, pgTAP 51 with `00-helpers`: **exit 0**, 6/6: the hostile key fails with SQLSTATE 42703 and writes nothing, and an ordinary import creates its row and a second import of the same external id updates the text and the number column its keys name.

## Gates and E2E close of batch C

- **Gate set `review-fix-C`**, on a756755c0: all 22 rows exit **0** on the first run (unit: frontend 6544 passed and 33 skipped, dev-seed 1210 passed; pgTAP 51 files and 2699 tests, PASS; integration 208 passed; schema equivalence equal). `179-verdict gates review-fix-C`: **PASS**, not stale (a756755c0 is tree-equal to HEAD outside `.planning/`), no Sleep entry in the window. This is the gate verdict of record for batch C, on the tree the E2E close ran on.
- The stack was restarted before the E2E run (`yarn db:stop && yarn db:start` through the key filter, exit 0; `supabase_edge_runtime_openvaa-local` Up).
- **E2E close `review-fix-C`**, on a756755c0, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 15.6 min. Wrapper exit 0, `restore: ok`. Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-C --same-projects-as review-fix-B-r2`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0 (the batch adds assertions to existing tests, not tests).
- A control run for 174.1 WR-01, on a756755c0 with the protected layout's focus call removed: `tests/e2e-runs/179-controls/review-fix-C-174.1-wr01-unfixed`, `--project contestant-journey`, exit 1, the new focus step failed; see `174.1-REVIEW-FIX.md`.
- `yarn db:seed:default` exit 0 afterwards. `179-verdict hygiene`: PASS.
