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
