---
status: complete
phase: 14-service-and-auth-bug-fixes
source: [14-01-SUMMARY.md, 14-VERIFICATION.md]
started: 2026-03-15T18:30:00Z
updated: 2026-03-15T18:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running Supabase instance. Run `cd apps/supabase && npx supabase db reset`. Schema applies cleanly, seed data loads, no errors. Run `npx supabase test db` — all tests pass.
result: pass

### 2. bulk_import Upsert with Partial Index
expected: With local Supabase running, call `bulk_import` RPC via Supabase Studio SQL Editor or curl. First insert entities with `external_id` set, then call again with same external IDs. Second call should update existing rows — no duplicate key errors, no "there is no unique or exclusion constraint matching the ON CONFLICT specification" errors.
result: pass

### 3. Password Reset Email Redirect
expected: Submit the forgot-password form with a valid candidate email. Check Mailpit (localhost:54324). The email link should point to `http://localhost:5173/en/candidate/password-reset` (not `update-password`). Clicking the link opens the password-reset page, not a 404.
result: pass

### 4. Entity DELETE Storage Cleanup
expected: Upload a photo for a candidate entity (via Storage API or Studio). Then DELETE the candidate record. No trigger error ("function delete_storage_object does not exist"). The storage file should be cleaned up (check Storage bucket in Studio).
result: pass

### 5. Supabase Env Vars in Docker
expected: Check `.env.example` contains `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` with local dev defaults. Check `docker-compose.dev.yml` passes both to the frontend service environment.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
