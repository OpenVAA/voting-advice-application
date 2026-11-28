---
created: 2026-10-16T00:00:00.000Z
title: Measure whether 65 seconds counted on the tab's clock from a request's settlement outlast the server's 60-second mail slot
area: apps/frontend / account-access - entry flow timing
severity: minor
source: Phase 178 (plan 178-23; the unresolved assumption of plans 178-10 and 178-17; item N-11 of 178-UI-SPEC.md)
files:
  - apps/frontend/src/lib/contestant/entryFlow/entryFlow.ts
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
---

## Problem

"Send again" on the "email sent" screen waits `RESEND_WAIT_SECONDS` (65) counted on the tab's own clock from the moment the request settled. The server allows one mail per address per project in 60 seconds, and it takes the address's slot after it has answered, in its background work. The five seconds are a margin reasoned from the function's source and never measured: if the slot is taken more than five seconds after the answer (a slow auth service, a cold function), a press at 65 seconds is answered alike and sends nothing, and the screen cannot tell.

The E2E specs never wait out the count: they advance the page's clock and give the slot back with `releaseLinkSlot` before a press that must send. So no run has measured the real interval.

## What to do

On a local stack, and on a deployment if one exists: ask for a link, read the witness's completion time and the throttle row's time (`private.invitation_throttle`, with the service role), and compare both with the answer's time and with the tab's settlement time. Repeat under load (a cold edge runtime, several requests at once).

## What to look for

- The largest gap between the answer and the slot's timestamp. Under 5 s everywhere: the margin holds. Over it: lengthen the wait, or let the server's own answer to a too-early request reach the screen without saying anything about the address.
