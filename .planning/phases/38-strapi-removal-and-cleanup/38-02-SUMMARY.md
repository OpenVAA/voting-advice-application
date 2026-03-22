---
phase: 38
plan: 2
status: complete
started: 2026-03-22
completed: 2026-03-22
---

# Summary: Plan 38-02 — Remove Strapi adapter code and auth token utilities

## What was done

Deleted the entire Strapi adapter directory (23 files), replaced adapter switch with direct Supabase exports in dataProvider.ts/dataWriter.ts/feedbackWriter.ts, deleted authToken.ts and AUTH_TOKEN_KEY, removed token from App.PageData, updated logout route/admin layouts to use Supabase sessions, and removed StrapiDataAdapter type.

## Key files

### Created
- (none)

### Modified
- `apps/frontend/src/lib/api/dataProvider.ts` — Direct Supabase export
- `apps/frontend/src/lib/api/dataWriter.ts` — Direct Supabase export
- `apps/frontend/src/lib/api/feedbackWriter.ts` — Direct Supabase export
- `apps/frontend/src/lib/auth/index.ts` — Removed authToken re-export
- `apps/frontend/src/app.d.ts` — Removed token from PageData
- `apps/frontend/src/routes/api/auth/logout/+server.ts` — Supabase signOut
- `apps/frontend/src/routes/admin/+layout.server.ts` — Supabase session
- `apps/frontend/src/routes/admin/(protected)/+layout.ts` — Removed token reference
- `apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts` — Supabase session
- `apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts` — Supabase session
- `packages/app-shared/src/settings/staticSettings.type.ts` — Removed StrapiDataAdapter

### Deleted
- `apps/frontend/src/lib/api/adapters/strapi/` — 23 Strapi adapter files
- `apps/frontend/src/lib/auth/authToken.ts` — AUTH_TOKEN_KEY constant

## Self-Check: PASSED

- `test ! -d apps/frontend/src/lib/api/adapters/strapi/` — PASS
- `grep -c 'switch' apps/frontend/src/lib/api/dataProvider.ts` returns 0 — PASS
- `test ! -f apps/frontend/src/lib/auth/authToken.ts` — PASS
- `grep -rl 'AUTH_TOKEN_KEY' apps/frontend/src/` returns 0 files — PASS
- `grep -c 'StrapiDataAdapter' packages/app-shared/src/settings/staticSettings.type.ts` returns 0 — PASS

## Deviations

None.
