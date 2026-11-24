---
title: Make the tcpForward BOUNDED-time test independent of the host's routing
priority: low
source: Phase 191 plan 06 deferred items (2026-11-24), nuorten-2027 workstream
---

`tests/tests/utils/tcpForward.test.ts` "gives up on an unreachable upstream in BOUNDED time" assumes `198.51.100.1` drops SYNs. On the cloud host the address is refused after 2 ms, so the test fails (and `yarn test:unit` stops before `test:unit:infra`). Replace the routed address with a local listener that never accepts (e.g. a full backlog), or probe the precondition and fail with a message that names it. Details: `deferred-items.md` § 1 in the phase 191 directory.
