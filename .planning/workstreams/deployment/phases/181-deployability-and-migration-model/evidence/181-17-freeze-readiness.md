ATTEMPT=20261020T123414Z.2a2a67aa4aa9
TREE_CLEAN=yes
    $ git status --porcelain --untracked-files=no
    (no output, status 0)
HEAD_AT_READINESS=2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2
    $ git rev-parse HEAD
    2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2
V216_PHASE_177_1=landed
    $ git config --get branch.feat/entity-signup-multi-grant.remote
    (no output, status 1: the branch has no remote, so no fetch was made; it is a local branch checked out in another worktree)
    $ git show feat/entity-signup-multi-grant:.planning/STATE.md | grep -nE '^(current_phase|status|stopped_at|last_activity_desc):|^Status:|^Last activity:'
    5:current_phase: 178
    7:status: verifying
    8:stopped_at: Phase 177.1 complete, ready to verify Phase 178
    11:last_activity_desc: Phase 177.1 complete, transitioned to Phase 178
    35:Status: Phase complete — ready for verification
    36:Last activity: 2026-10-18 — Phase 177.1 complete, transitioned to Phase 178
    $ git show feat/entity-signup-multi-grant:.planning/ROADMAP.md | grep -n "177\.1"   (the lines that state its completion)
    2157:| 177.1. Invitations — Entity Confirmation & Nominations Defined in Advance (INSERTED) | 8/8 | In Progress | - |
    2221:- [x] **Phase 177.1: Invitations — Entity Confirmation & Nominations Defined in Advance (INSERTED)** - ... (extends INV-01, INV-05; E2E-03) (completed 2026-10-18)
    2635..2656: all eight plans 177.1-01-PLAN.md .. 177.1-08-PLAN.md marked [x]
    $ git show feat/entity-signup-multi-grant:.planning/phases/177.1-invitations-entity-confirmation-nominations-in-advance/177.1-VERIFICATION.md | head -5
    phase: 177.1-invitations-entity-confirmation-nominations-in-advance
    verified: 2026-10-18T17:30:00Z
    status: passed
    score: 5/5 must-haves verified
    Basis: STATE.md says "Phase 177.1 complete", the roadmap checklist marks it [x] "completed 2026-10-18" with all eight plans [x], and its VERIFICATION.md reads status: passed. The progress-table row (line 2157) still reads "In Progress" with 8/8 plans; that table is stale and the three sources above agree.
V216_TIP=2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2
    $ git rev-parse feat/entity-signup-multi-grant   (no fetch: the branch has no remote)
    2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2
SCHEMA_IDENTICAL_BOTH_BRANCHES=yes
    $ git diff --quiet HEAD..2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2 -- apps/supabase/supabase/schema apps/supabase/supabase/migrations
    status 0
    $ git diff --stat HEAD..2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2 -- apps/supabase/supabase/schema apps/supabase/supabase/migrations
    (no output, status 0)
    $ git merge-base HEAD 2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2
    2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2
    $ git merge-base --is-ancestor HEAD 2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2   -> status 0 (HEAD is in the v2.16 branch)
    $ git merge-base --is-ancestor 2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2 HEAD   -> status 0 (the v2.16 tip is in this branch)
    Reading: the v2.16 branch was fast-forwarded to this branch's HEAD, so both name the same commit and hold the same schema/ and migration bytes (A-01). Read-only look at the v2.16 worktree (/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd): `git -C <it> rev-parse HEAD` prints 2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2 and `git -C <it> status --porcelain --untracked-files=no` prints nothing (status 0).
PHASE_182_SCHEMA_CHANGE=in
    $ grep -l 'D-13' .planning/workstreams/deployment/phases/182-analytics-relay/*-SUMMARY.md
    .planning/workstreams/deployment/phases/182-analytics-relay/182-02-SUMMARY.md
    .planning/workstreams/deployment/phases/182-analytics-relay/182-03-SUMMARY.md
    .planning/workstreams/deployment/phases/182-analytics-relay/182-29-SUMMARY.md
    $ sed -n 71p .planning/workstreams/deployment/phases/182-analytics-relay/182-02-SUMMARY.md   (the summary that records the change as done)
    **D-13 is commit `87ae648f6f8808240ca939a79e19885332cc72ad` (`feat[db]: contestant_app_public_config also answers analytics.trackEvents`). The change is in `schema/106-app-settings.sql` and the regenerated baseline `00001_initial_schema.sql`. A signed-out reader of a project not open for voters now gets `analytics.trackEvents` as stored, `null` where unset, and no other member of `analytics`. The data provider turns that into an `analytics` root, `false` when nothing valid is stored. pgTAP failed 8 of 20 on the unchanged function and passed 47 files and 2605 tests on the rebuilt isolated instance.**
    $ git merge-base --is-ancestor 87ae648f6 HEAD   -> status 0 (the D-13 commit is in this HEAD)
    From apps/supabase/supabase/schema/106-app-settings.sql, function contestant_app_public_config: the select it returns, which reads one settings row per project id and applies no condition on whether the project is open for voters or on the caller, so a signed-out reader of a closed project gets the analytics member:
    CREATE OR REPLACE FUNCTION public.contestant_app_public_config (p_project_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
    SET
      search_path = '' AS $$
      SELECT jsonb_build_object(
        'access', jsonb_build_object(
          'contestantApp', v.settings #> '{access,contestantApp}',
          'answersLocked', v.settings #> '{access,answersLocked}'
        ),
        'analytics', jsonb_build_object('trackEvents', v.settings #> '{analytics,trackEvents}'),
        'contestantApp', jsonb_build_object(
          'entityTypes', v.settings #> '{contestantApp,entityTypes}',
          'registrationModes', v.settings #> '{contestantApp,registrationModes}'
        )
      )
      FROM (SELECT (SELECT s.settings FROM public.app_settings s WHERE s.project_id = p_project_id) AS settings) v;
    $ grep -n 'contestant_app_public_config (uuid) TO anon' -A1 apps/supabase/supabase/schema/106-app-settings.sql
    50:EXECUTE ON FUNCTION public.contestant_app_public_config (uuid) TO anon,
    51-authenticated;
PARITY_GUARD_EXIT=0
    $ node scripts/assert-schema-migration-parity.mjs   (Node v24.21.0; status 0)
    Schema-migration parity guard (phase 156: REVIEW-DB-07) — census: 29 schema file(s) -> 9556 line(s); 00001_initial_schema.sql -> 9556 line(s); apps/supabase/supabase/migrations holds 1 .sql file(s); generated copy is current.
    Schema-migration parity guard — frozen-mode self-test: 16 fixture(s) checked, each produced its committed findings; 15 rule(s), each with its fixture.
EQUIVALENCE_EXIT=0
    $ bash apps/supabase/scripts/check-schema-equivalence.sh   (in the background; status file tmp/181-evidence/181-17-freeze-readiness.20261020T123414Z.2a2a67aa4aa9.equivalence.status, output tmp/181-evidence/181-17-freeze-readiness.20261020T123414Z.2a2a67aa4aa9.equivalence.out)
    isolated-instance.sh: starting openvaa-iso-eq-m in db mode on ports 55400 55401 55402 55403 55404 55405 55406 55407 55408 55409; this can take several minutes
    isolated-instance.sh: started eq-m (db). CLI output: /var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/openvaa-isolated/eq-m/start.log
    isolated-instance.sh: stopped eq-m
    check-schema-equivalence.sh: census of the migrations in /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/apps/supabase/supabase/migrations: CREATE TABLE 71 (in public: 21), CREATE POLICY 108, CREATE FUNCTION 141, GRANT 707, CREATE TRIGGER 87
    isolated-instance.sh: starting openvaa-iso-eq-s in db mode on ports 55500 55501 55502 55503 55504 55505 55506 55507 55508 55509; this can take several minutes
    isolated-instance.sh: started eq-s (db). CLI output: /var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/openvaa-isolated/eq-s/start.log
    isolated-instance.sh: stopped eq-s
    check-schema-equivalence.sh: census of the schema files in /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/apps/supabase/supabase/schema: CREATE TABLE 71 (in public: 21), CREATE POLICY 108, CREATE FUNCTION 141, GRANT 707, CREATE TRIGGER 87
    check-schema-equivalence.sh: EQUAL -- the database built from the schema files in /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/apps/supabase/supabase/schema is the database built from the migrations in /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra/apps/supabase/supabase/migrations (34 s)
    $ docker ps -a --format "{{.Names}}" | grep -i iso   -> no match (status 1): no isolated instance remains
    $ docker ps --format "{{.Names}}" (before the task vs after the equivalence check)   -> identical lists; no _openvaa-local container was running before, and none after (the shared stack was not touched)
BASELINE_SHA256=79bed444da347985daf22d44bccb451c00db2d67236ccd11fa9c2c7fae354ed8
    $ shasum -a 256 apps/supabase/supabase/migrations/00001_initial_schema.sql
    79bed444da347985daf22d44bccb451c00db2d67236ccd11fa9c2c7fae354ed8  apps/supabase/supabase/migrations/00001_initial_schema.sql
TREE_CLEAN_AFTER_CHECKS=yes
    $ git status --porcelain --untracked-files=no   (after the equivalence check finished)
    (no output, status 0)
HEAD_AFTER_CHECKS=2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2
    $ git rev-parse HEAD
    2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2   (equals HEAD_AT_READINESS)
COMMENT_SEARCH_HITS=0
    $ grep -n 'SQL editor' apps/supabase/supabase/schema/*.sql
    (no output, status 1: no line matched)
READY_TO_FREEZE=yes
    Every condition holds: (a) landed, (b) yes for the v2.16 tip 2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2, (c) in, the tree clean before and after the checks on one unchanged HEAD 2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2, parity status 0, equivalence status 0, comment search 0.
CHECKPOINT_PRESENTED attempt=20261020T123414Z.2a2a67aa4aa9 head=81e6a3f225061563939b935e898b9a4965807d22
    operator reply (verbatim): freeze 20261020T123414Z.2a2a67aa4aa9
OPERATOR_DECISION=freeze attempt=20261020T123414Z.2a2a67aa4aa9 head=81e6a3f225061563939b935e898b9a4965807d22
TASK3_STARTED=2026-10-20T12:49:55Z
    the answer check of the attempt protocol was run first, status read directly: 0
TREE_CLEAN_AT_FREEZE=yes
    $ git status --porcelain --untracked-files=no
    (no output, status 0)
    $ shasum -a 256 apps/supabase/supabase/migrations/00001_initial_schema.sql
    79bed444da347985daf22d44bccb451c00db2d67236ccd11fa9c2c7fae354ed8  (equals the BASELINE_SHA256 line: yes)
FREEZE_PARENT=81e6a3f225061563939b935e898b9a4965807d22
    $ git rev-parse HEAD, compared with the head= value of the last OPERATOR_DECISION line: equal (status 0)
    before the commit: the guard in frozen mode on the real tree, the spec, yarn schema:regenerate
    $ node scripts/assert-schema-migration-parity.mjs   (status 0)
    Schema-migration parity guard — census: 1 migration(s) in the manifest; baseline 00001_initial_schema.sql -> 9556 line(s); 16 fixture(s) checked; the frozen migrations match the manifest.
    Schema-migration parity guard — frozen-mode self-test: 16 fixture(s) checked, each produced its committed findings; 15 rule(s), each with its fixture.
    $ yarn workspace @openvaa/dev-seed test:unit tests/schemaMigrationFreezeGate.test.ts   (28 passed)
    $ yarn schema:regenerate   (status 1; git status --porcelain identical before and after; baseline sha256 unchanged)
    Schema-migration parity guard: the baseline is frozen. `--write` (`yarn schema:regenerate`) no longer
    rewrites a migration, and a listed migration is never edited.
    
    A schema change is one commit, in three steps:
      1. Edit the file under apps/supabase/supabase/schema/ that holds the object.
      2. Write the same change as a new migration, apps/supabase/supabase/migrations/00002_<name>.sql,
         where <name> is yours to choose (lower-case letters, digits and underscores).
         00002 is the next version after the highest in the manifest.
      3. Add its line, with its sha256 (`shasum -a 256 <file>`), to the end of apps/supabase/supabase/migrations.manifest.json.
    
    Then run `yarn check:schema-equivalence`: it builds one database from apps/supabase/supabase/schema/ and one from
    apps/supabase/supabase/migrations/ and fails when they differ.
    $ yarn workspace @openvaa/dev-seed typecheck   (status 0)
    $ yarn workspace @openvaa/dev-seed test:unit   (status 1: 76 of 77 files passed; the one failure is tests/integration/default-template.integration.test.ts, 'bulkDelete failed: TypeError: fetch failed', because the shared local stack is not running and this plan does not start it)
    $ git rev-parse HEAD   (directly before the commit)
    81e6a3f225061563939b935e898b9a4965807d22   (equals FREEZE_PARENT)
V216_TIP_AT_FREEZE=2a2a67aa4aa97e2b8ac06264028ce4ddc8ef8ca2
    $ git config --get branch.feat/entity-signup-multi-grant.remote   (no output, status 1: no remote, so no fetch)
    $ git rev-parse feat/entity-signup-multi-grant   (equals V216_TIP)
FREEZE_COMMIT=12c98aa5c3acc221a87b625d47a0547dde1c369e
    $ git rev-parse 12c98aa5c3acc221a87b625d47a0547dde1c369e^
    81e6a3f225061563939b935e898b9a4965807d22   (equals FREEZE_PARENT)
    $ git show --stat --format= 12c98aa5c3acc221a87b625d47a0547dde1c369e
     apps/supabase/supabase/migrations.manifest.json    |  13 +
     .../tests/schemaMigrationFreezeGate.test.ts        |  38 ++
     scripts/assert-schema-migration-parity.mjs         | 447 +++++++++------------
     3 files changed, 235 insertions(+), 263 deletions(-)
    $ git diff --quiet 12c98aa5c3acc221a87b625d47a0547dde1c369e^..12c98aa5c3acc221a87b625d47a0547dde1c369e -- apps/supabase/supabase/migrations/00001_initial_schema.sql apps/supabase/supabase/schema   (status 0: no baseline or schema byte changed)
    $ git log --diff-filter=A --format=%H -- apps/supabase/supabase/migrations.manifest.json
    12c98aa5c3acc221a87b625d47a0547dde1c369e   (one freeze commit)
MANIFEST_BASELINE_SHA256=79bed444da347985daf22d44bccb451c00db2d67236ccd11fa9c2c7fae354ed8
    the sha256 of migrations[0] in apps/supabase/supabase/migrations.manifest.json, whose baseline.commit is 81e6a3f225061563939b935e898b9a4965807d22
BLOB_AT_PARENT_SHA256=79bed444da347985daf22d44bccb451c00db2d67236ccd11fa9c2c7fae354ed8
    $ git show 81e6a3f225061563939b935e898b9a4965807d22:apps/supabase/supabase/migrations/00001_initial_schema.sql | shasum -a 256   (equals MANIFEST_BASELINE_SHA256 and the file on disk)
GUARD_FROZEN_MODE_EXIT=0
    $ node scripts/assert-schema-migration-parity.mjs   (after the freeze commit, status 0)
    with the manifest moved aside in a scratch checkout of 12c98aa5c3acc221a87b625d47a0547dde1c369e (git worktree add --detach), the guard there: status 1
    Schema-migration parity guard — census: no readable manifest; baseline unread; 16 fixture(s) checked.
    
    MALFORMED MANIFEST: migrations.manifest.json cannot be read (ENOENT).
      Restore apps/supabase/supabase/migrations.manifest.json from git. The guard checks the frozen migrations whether or not the manifest is there, and without it every run fails.
    the scratch checkout was removed afterwards (git worktree remove)
SCHEMA_REGENERATE_EXIT=1
    $ yarn schema:regenerate   (after the freeze commit, status 1; git status --porcelain --untracked-files=no prints nothing afterwards)
    Note for the operator, to carry to the v2.16 session (follow-up X-1): merge feat/deployment-terraform-supabase into feat/entity-signup-multi-grant through the freeze commit 12c98aa5c3acc221a87b625d47a0547dde1c369e before the next schema change there. Until that merge, yarn schema:regenerate on the v2.16 branch still rewrites 00001. After it, plan 178-04 is written as an appended migration, 00002_<name>.sql with its manifest line, on top of phase 182's change; nothing edits 00001.
