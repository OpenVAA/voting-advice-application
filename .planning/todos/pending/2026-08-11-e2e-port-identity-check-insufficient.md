---
created: 2026-08-11
source: Phase 136 plan 136-01 (supersedes DEF-135-03)
resolves_phase: null
severity: high
area: tests / E2E runbook
---

# The :5173 listener identity check is insufficient — assert the served APP, not the process

## What DEF-135-03 said (Phase 135)

A sibling checkout's Docker container (`voting-advice-application-frontend-1`) also publishes
`:5173` and answers **200 from a stale build**. Mitigation adopted: assert the listener is a
`node` process, not merely that the port answers 200.

## Why that mitigation is NOT sufficient (measured 2026-08-11, Phase 136)

A **foreign Vite dev server from an unrelated project** (`~/Desktop/Treader/treader/apps/web`)
took `:5173`. It **is** a node process, so it PASSES the "assert node" check — and two full runs
silently scanned a page reading *"An example document"* before it was caught.

So the process-type check is defeated by any other Vite project on the machine, which on a
developer box is common. Phase 135's gate used a stronger variant ("a `node` process whose command
path contains this repo"), but that is also defeatable — a foreign process could be launched from a
path that happens to match, and it does not prove what the server is actually SERVING.

## The correct check

Assert the **served application**, not the listener's identity. Cheapest reliable form:

```
curl -s http://localhost:$PORT/ | grep -q '<title>Election Compass</title>'
```

Any check that inspects the process rather than the response can be defeated. The response is the
thing under test.

## Why this matters beyond one run

Every E2E result in this repo is only as trustworthy as the assertion that the page under test came
from this checkout. A false-green from a foreign server is undetectable after the fact — the
Playwright report looks normal, the counts look normal, the assertions "pass" against someone
else's app. This is a testing-integrity issue, not a convenience one.

**Note:** `FRONTEND_PORT` is honoured (`toCallbackUrl` respects it), so running at an alternate port
is a valid workaround when :5173 is occupied — Phase 136 plan 01 ran the full suite at 5174 and the
candidate email specs were unaffected.

## Suggested resolution

1. Add the served-app assertion to the E2E preflight (a helper the specs or the runbook call), so
   it is enforced rather than remembered.
2. Update `CLAUDE.md` / the E2E runbook: replace "assert the listener is node" with the
   response-content check.
3. Consider defaulting local E2E to a less contended port than 5173.

## Related

- Phase 135 `deferred-items.md` — DEF-135-03 (the weaker, now-superseded mitigation)
- Phase 136 `136-01-SUMMARY.md` — the measurement
