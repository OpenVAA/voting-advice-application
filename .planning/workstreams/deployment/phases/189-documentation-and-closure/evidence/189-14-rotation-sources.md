# 189-14 — the sources of the restore and secret-rotation sections (E-02, E-03)

Measured 2026-11-21 on `feat/deployment-terraform-supabase`, HEAD `fa8d8376c` before this plan.

## E-02 — Supabase's documentation, read

Each page was fetched with one `GET` (`curl -sSL`, status 200 for every page) and read from its
article text; nothing was sent to Supabase but the page request. The WebFetch tool was not
available to this executor, so `curl` made the same page request. Each page's `<link
rel="canonical">` is the URL recorded.

E02_DOCS_READ_AT=2026-11-21T07:27Z
E02_DOC=https://supabase.com/docs/guides/platform/backups
E02_DOC=https://supabase.com/docs/guides/platform/clone-project
E02_DOC=https://supabase.com/docs/reference/api/v1-list-all-backups
E02_DOC=https://supabase.com/docs/reference/api/v1-restore-pitr-backup

What each page said on that date, as the operations page cites it:

- `guides/platform/backups`: Pro, Team and Enterprise projects are backed up daily; a Pro project can
  reach the last 7 days of daily backups (Team 14, Enterprise up to 30); projects on Postgres
  `15.8.1.079` and newer use physical backups; daily backups store no password of a custom role;
  database backups do not include Storage objects, only their metadata, and restoring an old backup
  does not restore objects deleted after it; a restore is started in Database > Backups, the
  dashboard asks for confirmation, and the project is inaccessible during the restore, for longer the
  larger the database; subscriptions and replication slots are dropped before and re-created after
  (Realtime's slot excepted); PITR is an add-on of Pro, Team and Enterprise projects, with a worst-case
  RPO of two minutes, priced by retention (7 days about 100 USD a month, 14 about 200, 28 about 400);
  enabling PITR stops the daily backups; restoring to an earlier point replaces the current database,
  and "to preserve your current data, restore to a new project first"; physical backups are not
  downloadable, and a logical copy is made with `supabase db dump` or `pg_dump`. The page's
  Management API examples are the list `GET` and the PITR restore `POST` only.
- `guides/platform/clone-project` ("Restore to a new project", marked Beta): paid plans with
  physical backups; Database > Backups > "Restore to a New Project"; transferred: schema, data and
  indexes, roles, permissions and users, auth user data, the encryption root key; needing manual
  reconfiguration: Storage objects and settings (files and bucket configurations not copied), Edge
  Functions, auth settings and API keys, Realtime settings, database extensions and settings, read
  replicas; the new project is in the source's region; extensions that carry out external operations
  (`pg_net`, `pg_cron`, wrappers) start running as soon as the restore completes, with no way to
  pause them; a project created this way cannot itself be cloned.
- `reference/api/v1-list-all-backups`: `GET /v1/projects/{ref}/database/backups`, OAuth scope
  `database:read`, fine-grained permission `backups_read`; the 200 body holds `region`,
  `walg_enabled`, `pitr_enabled`, `backups[]` (`id`, `is_physical_backup`, `status` of
  `COMPLETED|FAILED|PENDING|REMOVED|ARCHIVED|CANCELLED`, `inserted_at`) and `physical_backup_data`.
- `reference/api/v1-restore-pitr-backup`: `POST /v1/projects/{ref}/database/backups/restore-pitr`,
  OAuth scope `database:write`, permission `backups_write`, required body
  `recovery_time_target_unix` (integer), answer 201.

The staging values the page uses are plan 189-06's read (`evidence/189-06-backups.md`,
`E2_READ_AT=2026-11-20T13:55Z`): `E2_PITR_ENABLED=false`, `E2_WALG_ENABLED=true`, `E2_BACKUPS=8`,
`E2_COMPLETED=8`, `E2_EARLIEST_UTC=null`, `E2_LATEST_UTC=null`, region `eu-north-1`.

<!-- 189-14 task 2 -->
