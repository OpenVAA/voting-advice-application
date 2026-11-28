---
created: 2026-11-19T18:20:00.000Z
title: Check whether candidate and party images can be cached or served via a CDN
area: infra
severity: minor
source: Phase 188, plan 188-18 (evidence/188-18-load-check.md, evidence/188-18-load-summary.json); captured by the operator
owner: the end of milestone v2.17, before it ships
files:
  - infra/modules/frontend-service/
  - infra/scripts/load-check/staging-journey.json
  - apps/frontend/src/lib/api/adapters/supabase/
---

## Problem

In 188-18's load run on staging (2026-11-19, build a7003b490), each recorded voter journey made 50 public-storage reads of candidate and party portraits straight from Supabase storage (`cofbsatfrdysyphajsky`), about 30 MB a journey. 387 journeys received 11.72 GB, roughly ten times the 1 GB the step plan estimated. The figure (40 journeys a minute, a lower bound) was not limited by it, but the storage egress grows with every voter and is the bulk of the load on the hosted project.

## Solution

TBD. To check before the milestone ships:

- What the browser fetches: original uploads or resized renditions, and whether Supabase image transformations (Pro) or a thumbnail size would cut the bytes.
- The `Cache-Control` the storage objects are served with, and whether browsers and Supabase's own CDN cache them between journeys.
- Whether to front the public bucket with the existing CloudFront distribution (a second origin with long TTLs) or another CDN, and what that means for cache invalidation when a portrait changes, for the CSP, and for cost.
- Re-measure with the load check (`infra/scripts/load-check.sh`) after any change.
