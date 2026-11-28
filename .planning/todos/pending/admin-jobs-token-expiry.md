---
title: AI admin jobs hold a fixed admin token that can expire mid-run
priority: medium
created: 2026-11-28
context: Raised by the human review of PR 880 (finding XC-1). Accepted for now by the operator; to be handled in the admin-app refactor milestone.
---

# AI admin jobs: token expiry mid-run

The question-info and argument-condensation jobs capture the admin's access token when the job starts and use it for every later write. A run that outlasts the token's lifetime loses its remaining writes.

**Decision (2026-11-28):** accept for now. The whole admin app is due for a refactor in a later milestone; fix it there.

**Options when it is picked up:**
- Refresh the session (or fetch a fresh token) before each write batch.
- Run job writes through a server-side, project-scoped service-role client.

**Done when:** a job that runs past one token lifetime completes all its writes, covered by a test.
