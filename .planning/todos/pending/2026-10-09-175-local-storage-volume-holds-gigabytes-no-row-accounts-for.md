---
created: 2026-10-09T00:00:00.000Z
title: The local stack's storage volume holds about 9.5 GB while storage.objects names 174 MB — the disk sink behind the E2E driver's space guard
area: Local stack / E2E infrastructure
severity: minor
source: the overflow fix between plans 175-12 and 175-13 (175-12-OVERFLOW-FIX.md § Read this first, point 3); the orchestrator's instruction to plan 175-13; filed by 175-13
owner: the operator: it is the storage volume, the stack or Docker itself, and this host runs a second, unrelated Supabase stack
files:
  - tests/scripts/e2e-run.sh
  - tests/tests/specs/storage/storage-cleanup.spec.ts
  - apps/supabase/supabase/schema/400-storage.sql
  - packages/dev-seed/src/writer.ts
---

## Finding

The phase's E2E driver refuses to start a run when the Docker VM has less than 13.8 GiB free. On 2026-10-09 it refused: 13.76 GiB. Looking for where the space is, the executor of the overflow fix read (and changed nothing):

- **The local storage volume `supabase_storage_openvaa-local` holds 9477 MB.**
- **`storage.objects` names 327 objects of 174 MB in all.**

So about 9.3 GB of the volume is files that no row of `storage.objects` accounts for.

### What is measured and what is not

- Measured, once, by read-only commands against the database and the storage container: the two sizes above; the database's WAL at 480 MB, held by the realtime replication slot (464 MB behind).
- Measured over a session: each run of an 88-project slice of the suite cost 60 to 70 MB of the VM that no prune gives back (14.12 GiB free at the first run of that session, 13.85 at the last). Phase 175's closing runs record the free space before each of theirs.
- **Not established: what the unaccounted files are.** Not listed, not sampled, not dated.
- Inferred, as the likeliest reading: objects whose rows a database reset or a teardown removed. `supabase db reset` recreates the database and with it `storage.objects`; whether it empties the volume was not checked. A teardown deletes rows, and the cleanup triggers of `400-storage.sql` delete objects through `pg_net` after the transaction commits; a reset that follows at once may leave the files. Every dev-seed run uploads a portrait for every candidate (`writer.ts`), and the dev-seed unit suite seeds the `default` template on each run.
- Not checked: how much of the Docker VM's disk the second Supabase stack on this host holds.

### What was done about space instead

The orchestrator removed eight unused, superseded Docker images (seven Supabase service images and one Postgres image), which took the VM from 13.76 to 19.4 GiB free. No container was stopped, no volume was pruned, no reset was run. The storage volume is untouched.

## Options

Nothing here is to be cleaned by an agent in passing: `tests/e2e-runs/` is never deleted, Docker is never restarted, and a volume prune would hit the other stack.

1. **Establish what the files are first.** List the volume's object directory by project id and age, and compare with `storage.objects`. One read-only session.
2. **If they are orphans of resets:** empty the bucket directories as part of `yarn db:reset` (a script step, for this stack's volume alone), or have the reset call the storage API to empty the two buckets before the database is recreated.
3. **If they are orphans of teardowns:** the suite's `storage-cleanup` project observes that deleted objects disappear; extend it, or the teardown, to assert that a torn-down project leaves no file.
4. **Lower the cost per run** if the 60 to 70 MB is this volume growing: find which step writes it.

Related memory of the project: `docker builder prune -af` is the first remedy for ENOSPC on this host, and it reclaims nothing once the build cache is empty, which is the state these readings were taken in.
