---
created: 2026-10-11T00:00:00.000Z
title: Investigate differential privacy, or masking of timestamp and insert order, for answer events
area: analytics / privacy
severity: minor
source: operator, 2026-10-11 (note under B2 of v2.17-DISCUSSION-POINTS.md, workstream deployment)
---

## Problem

v2.17 rules that in consent-free mode each answer event carries a fresh random id (RELAY-17), so
answers cannot be linked to each other or to a pageview by id. They can still be linked by other
means: each event has a timestamp and arrives at the provider in order, and the load balancer's
access log holds the address and time of the relay request that carried it. Someone holding both
could match an answer event to a request, and a run of requests to one visitor.

## Solution

Investigate, and record which of these is worth building:

1. A differentially private version of the answer events (randomised response on the value, or
   noise added to per-question aggregates before they leave the relay).
2. Masking at the relay: coarsened or jittered timestamps, and forwarding in shuffled batches so
   that insert order at the provider carries no information.
3. What the access-log retention and fields must be for either to hold.
