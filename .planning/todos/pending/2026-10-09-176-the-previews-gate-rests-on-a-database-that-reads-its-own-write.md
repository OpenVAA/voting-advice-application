---
created: 2026-10-09T00:00:00.000Z
title: The preview's gate reads an answer the browser saved a moment before — it rests on a hosted database reading its own write at once
area: Contestant app / deployment
severity: minor
source: Phase 176 plan 10 (176-10-SUMMARY.md § For the operator; 176-RESEARCH.md assumption A8); filed by 176-19
owner: the deployment milestone (`2026-10-08-next-milestone-full-deployment-aws-terraform-remote-supabase-and-analytics-relay.md`)
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/+page.server.ts
  - apps/frontend/src/lib/server/contestant/previewGate.ts
---

## What is so

The preview opens once the entity has a nomination and no required info question and no opinion question is unanswered. The rule is asked on the server, in the preview page's own load, on every arrival: its `await parent()` reruns the entity-level load, which reads the entity's saved answers again.

A user who answers the last question and goes straight to the preview therefore depends on that read seeing the write the browser made a moment before. On the local stack it does, and the E2E suite shows it (the preview tests of `perm-no-nomination`, and `contestant-journey`).

## What cannot be tested locally

Research assumption A8: a hosted Supabase project reads its own write at once — no read replica, pooler or cache stands between the save and the next load. If one does, the preview is refused once after the last save: the user is redirected to the home, where the browser's own task state says the preview is open, and a second try succeeds.

Nothing is deployed, so nothing is wrong today.

## Solution

When the hosted project is set up, check that the server's reads and the browser's writes reach the same primary, and run `contestant-journey` and `perm-no-nomination` against it. If reads can lag, the preview's load needs a read that is consistent with the session's last write, or the redirect needs a message.
