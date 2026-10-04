---
title: "`send-email` and `invite-candidate` have no E2E caller: their only runtime proof is a boot check and an anon-token probe"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: medium
suggested_phase: the phase that wires the invite / email flows into the product (see 168-03 F2/F3)
keywords: [edge-functions, send-email, invite-candidate, e2e, coverage, nodemailer, 168-03-F2]
re_check_trigger: "before the nodemailer 10 pin lands (it is the next change to send-email), and whenever either function gains a caller"
---

# No E2E coverage of the two email Edge Functions (169-07, confirms 168-03 F2)

DEPS-09 / D-09 named "the email and invite flows in the full E2E suite" as a gate for the Deno pins. Those flows do not
exist as Edge-Function callers: no spec under `tests/tests/specs/` calls `send-email` or `invite-candidate`, and 168-03
F2 found no production caller either (UNCONFIRMED for production). 169-07's runtime proof for both functions was a boot
check (`OPTIONS` → 200, no `worker boot error` in the edge-runtime log) plus an anon-token probe that reaches
`auth.getUser()` through the new supabase-js client. 168-03 F3: `invite-candidate` sends invitees to
`/candidate/complete-registration`, which does not exist (UNCONFIRMED).

**What to do:**
1. Decide whether the two functions are product paths (168-03 F2/F3). If not, delete them; if yes, wire the caller.
2. Add an E2E (or a Deno/vitest integration test against the local stack) that sends through `send-email` to the local
   mail server and drives an `invite-candidate` invite to a working registration page.
3. Use it as the gate for the nodemailer 10 pin (`2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md`).
