---
created: 2026-11-20T00:00:00.000Z
title: The feedback limit keeps each sender's address with no expiry
area: database / privacy
severity: minor
source: Phase 189 (D-03, research open question 5)
owner: a later phase, and the operator of any deployment until it is decided
files:
  - apps/supabase/supabase/schema/107-feedback.sql
---

## Problem

The feedback rate limit stores the client address of every feedback sender and never deletes it.

`private.feedback_rate_limits` (`apps/supabase/supabase/schema/107-feedback.sql`, the `CREATE TABLE` under "Private schema for rate limiting") keys each row on `ip_address`, the key `private.feedback_client_ip` derives from the request headers: `cf-connecting-ip` when `private.deployment_settings.behind_cloudflare` is true, otherwise the last `x-forwarded-for` hop. The row holds the address in clear, a `count` and a `window_start`.

The trigger function `check_feedback_rate_limit` only upserts: `INSERT INTO private.feedback_rate_limits (ip_address, count, window_start) ... ON CONFLICT (ip_address) DO UPDATE`, resetting `count` and `window_start` when the five-minute window has ended. Measured on 2026-11-20 with `git grep -n 'feedback_rate_limits' -- apps/supabase infra packages`: outside the pgTAP tests, whose `DELETE`s clear the table between their own cases (`tests/database/10-schema-migrations.test.sql`, `35-feedback-rate-limit-key.test.sql`), the only statements over the table are its `CREATE TABLE`, that upsert and the `SELECT count` after it, in `107-feedback.sql` and their copy in `migrations/00001_initial_schema.sql`. No `DELETE`, scheduled job or `TRUNCATE` of the schema or the migrations touches it. So the address of everyone who ever sent feedback stays stored, with the start of their last window, for as long as the database lives.

Contrast: the `account-access` per-caller limit stores the caller's address in `private.invitation_throttle` only for its 10-minute window, and each later take deletes the keys whose window has ended.

The analytics page's deployer's checklist (`apps/docs/src/routes/(content)/developers-guide/configuration/analytics/+page.md`, § The deployer's checklist) states this for the deployer; nothing in the repository purges the rows.

## Solution

To decide, then build with a pgTAP test:

- **Expire rows after the window**, as `invitation_caller_take` does: in `check_feedback_rate_limit`, after the upsert, delete the other rows whose `window_start` is older than the five-minute window, skipping rows locked by a concurrent request. No address then outlives its window by more than the time to the next feedback from anyone.
- **Purge on a schedule**: a `pg_cron` job that deletes rows whose window has ended, every few minutes. Keeps the trigger as it is, but adds a scheduled job the deployment must have enabled.

Either way, the deployer's checklist item on the feedback limit is updated to the new retention.
