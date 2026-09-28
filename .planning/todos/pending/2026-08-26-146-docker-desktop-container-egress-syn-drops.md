---
created: 2026-08-26T19:30:00.000Z
title: Docker Desktop drops container-egress TCP SYNs — unfixed, not ours to fix, and other paths are exposed
area: tooling / test infrastructure
severity: major
source: Phase 146 (.planning/debug/answer-surface-wait-timeout.md; D-16 re-scope)
files:
  - tests/scripts/tcp-forward.mjs
---

## Problem

Docker Desktop intermittently **drops** a container's outbound TCP SYN to
`host.docker.internal`. The connection then waits out Linux's exponential SYN-retransmission
backoff — measured at **35,634 to 68,369 ms** on the connect leg while DNS stayed under 1.4 ms and
first byte under 5.2 ms. This is the root cause of the *run-4 anomaly* carried from v2.14, and it is
what falsified the Vite-HMR-staleness hypothesis D-16 was chartered around.

`tests/scripts/tcp-forward.mjs` now absorbs it with a bounded re-dial ladder (`4066c2f41`), and the
voter fixture fails at the stalled navigation instead of swallowing the timeout (`351981b4f`). In
its own post-fix window the relay logged 121 drops and absorbed every one; stalls of 30 s or more
went from 34 in 4,328 connections to 0 in 6,240.

**The relay absorbs the drops. It does not stop them.**

Two consequences worth keeping visible:

1. **Other non-relayed container paths remain exposed.** Only traffic routed through
   `tcp-forward.mjs` gets the ladder. Any future container step that dials the host directly
   inherits the original multi-minute stall with no bound and no `gave-up` signal.
2. **The drop rate moves.** The same host measured **0.786 %** per connection in the pre-fix corpus
   and **1.47 %** during `146-07`. A burst deeper than the ladder's eight consecutive drops on one
   connection would still exhaust it — failing loudly, with `gave-up=N` in `forwarder.log`, which is
   the signal to re-open the record.

**CI is a different environment and does not use this relay at all**, so none of this evidence
transfers to it.

## Solution

Nothing to fix in this repository — the defect is in Docker Desktop's networking stack. What is
actionable:

- Route any new container-to-host traffic through the relay rather than dialling directly.
- Treat `gave-up=N` in `forwarder.log` as a hard signal, not a warning.
- Re-measure the drop rate if in-container runs start stalling again; it is not a fixed constant.
