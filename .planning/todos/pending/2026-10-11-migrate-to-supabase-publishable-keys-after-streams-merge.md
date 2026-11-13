---
created: 2026-10-11T00:00:00.000Z
title: Migrate to Supabase publishable keys, right after v2.16 and v2.17 are merged
area: supabase / keys
severity: major
source: operator, 2026-10-11 (note under C5 of v2.17-DISCUSSION-POINTS.md, workstream deployment)
---

## Problem

Supabase's legacy `anon` and `service_role` keys are reported as retired by the end of 2026
(research/STACK.md, a docs reading, not observed). v2.17 measures what a new project issues and
stays on legacy keys if they work (SUPA-13), because the migration touches the frontend, the Edge
Functions and the storage cleanup trigger, in code the v2.16 stream is working near.

## Solution

Queue this as the first work after both streams are merged, per the operator. Start from the key
model v2.17 records for the hosted project. Cover the frontend's client construction, the three
Edge Functions, the storage cleanup trigger and its `storage_config` row, the Terraform outputs
and secrets, and the environment-variable reference.
