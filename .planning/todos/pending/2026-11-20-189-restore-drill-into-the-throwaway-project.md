---
created: 2026-11-20T00:00:00.000Z
title: Restore drill into the throwaway project
area: operations / database
severity: minor
source: Phase 189 (E-02)
owner: a later phase, before a production project relies on the restore procedure
files:
  - apps/docs/src/routes/(content)/developers-guide/deployment/operations/+page.md
  - infra/envs/staging/supabase/README.md
  - infra/envs/scratch/supabase/terraform.tfvars
  - infra/scripts/bootstrap.sql
---

## Problem

No restore has been run on any of the project's Supabase projects. The operations page's `## Restore` (plan 189-14) is written from Supabase's documentation, read on 2026-11-21 (backups, restore to a new project, the two Management API endpoints), and from the repository's apply order; staging's side of it is one read, Step 24 of the Supabase runbook on 2026-11-20 (PITR off, eight backups, all `COMPLETED`, no physical-backup range in the answer). What a restore does to an OpenVAA project, how long it takes and what has to be re-applied afterwards rests on no run.

Points the page states from mechanism and that a drill would settle:

- in place: the project's downtime, the migrations pushed after the backup listed as pending again, the `bootstrap.sql` rows back at their old values, and a Supabase root plan of `No changes` afterwards;
- to a new project: the Supabase root's plan after `terraform state rm module.supabase.supabase_project.this` and the new ref (an import, and which settings resources are replaced), whether the two buckets exist in the copy, and whether the copied `storage_config` rows make the storage cleanup triggers call the source project before `bootstrap.sql` runs;
- what Storage loses: objects deleted after the backup, objects uploaded after it left without a row, and the time to copy both buckets with `supabase storage cp`.

## Solution

A drill on the throwaway project (`R=scratch`), never on the persistent one, as its own sitting with the operator's approval:

1. Deploy the repository to the throwaway project as Steps 14 to 23 do, with the smoke dataset and a few Storage objects, and take note of the latest daily backup's time (Step 24's read, with `inserted_at`).
2. Change data after that backup: delete a row that owns an object, upload an object, push nothing else.
3. Restore in place from the dashboard, timing from the confirmation to the project answering again; then read the migration history against `push-migrations.sh`, the `storage_config` rows, a Supabase root plan and the conformance probe.
4. Restore to a new project, then apply the page's order (Supabase root, functions, `bootstrap.sql`, Storage objects) and point a frontend at it; measure the time to a serving project, record each plan, and list what Storage lost.
5. Record each result as a dated row in the Supabase runbook's Observations and correct the operations page where the drill disagrees with it. Delete the new project afterwards (it is outside Terraform's state once the drill is done).
