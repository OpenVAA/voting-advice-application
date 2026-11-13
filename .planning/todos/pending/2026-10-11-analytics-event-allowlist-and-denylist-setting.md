---
created: 2026-10-11T00:00:00.000Z
title: Add a setting for an analytics event allowlist and denylist
area: analytics / settings
severity: minor
source: operator, 2026-10-11 (note under B3 of v2.17-DISCUSSION-POINTS.md, workstream deployment)
---

## Problem

v2.17's relay accepts a closed vocabulary of events (RELAY-08) and a deployer can only turn
collection on or off (`trackEvents`). A deployer who wants pageviews but not answer events, or
only a handful of events, has no setting for it.

## Solution

A setting that takes an allowlist and a denylist of event names, applied at the relay before
forwarding. Decide which wins when a name is in both, whether patterns are allowed for the two
templated event names, and whether the browser also reads the lists so that excluded events are
never sent.
