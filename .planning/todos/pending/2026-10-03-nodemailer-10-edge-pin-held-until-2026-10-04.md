---
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 07
priority: high
suggested_phase: the first run on or after 2026-10-04T07:51Z (a quick task is enough)
keywords: [nodemailer, deno, edge-functions, send-email, age-rule, DEPS-09, D-09, D-03]
title: "send-email still imports npm:nodemailer@6.9.10 (four open high advisories): the 10.x pin waits for the 30-day new-major rule, which clears 2026-10-04T07:45Z"
area: apps/supabase (Edge Functions)
severity: high (production path; open high advisories on the running version), time-boxed; blocks DEPS-09 completion
source: Phase 169 plan 169-07 Task 3 (D-09, D-03, PROH-169-16); evidence 169-EVIDENCE.md § 1, § 2 and § 3 (169-07)
re_check_trigger: "on or after 2026-10-04T07:51Z (10.0.0 is then 30 days old and 10.0.11 is 7 days old)"
files:
  - apps/supabase/supabase/functions/send-email/index.ts (`import nodemailer from 'npm:nodemailer@6.9.10';`)
---

## Problem

`send-email` runs `npm:nodemailer@6.9.10`. The GitHub advisory database lists 17 advisories that affect it, four of
them high: GHSA-p6gq-j5cr-w38f, GHSA-2x7j-588g-ccc2, GHSA-v53p-9fqp-m79j and GHSA-rcmh-qjqh-p98v (plus the
duplicates GHSA-h3hj-cmcx-xc66 and GHSA-jj37-3377-m6vv). `yarn audit:deps` cannot see it, because Deno resolves
`npm:` imports at function boot, outside `yarn.lock`.

Every older line still carries an open high advisory. On 2026-10-03, 6.10.1 and 9.1.1 both match
GHSA-v53p-9fqp-m79j (`<= 10.0.5`, fixed in 10.0.6). PROH-169-16 rules out taking an older major as "safe", so the
only fix is 10.0.x at 10.0.6 or later.

The 10.x line is a new major for this repository. D-03 needs its `10.0.0` (published 2026-09-04T07:45:32Z) to be at
least 30 days old, and on 2026-10-03 it was 29.3 days old. The plan says the task waits, so 169-07 pinned
supabase-js and jose and left nodemailer where it was.

## Measured on 2026-10-03T14:27Z

| Version | Published | Age | Note |
|---|---|---|---|
| 10.0.0 | 2026-09-04T07:45:32Z | 29.28 d | line start; clears the 30-day rule 2026-10-04T07:45:32Z |
| 10.0.10 | 2026-09-14T12:57:22Z | 19.06 d | |
| 10.0.11 | 2026-09-27T07:50:47Z | 6.27 d | clears the 7-day rule 2026-10-04T07:50:47Z |
| 10.0.12 | 2026-09-28T09:50:50Z | 5.19 d | |
| 10.0.13 | 2026-09-30T04:40:23Z | 3.41 d | |
| 10.0.14 | 2026-10-03T13:45:29Z | 0.03 d | `latest` |

`gh api "/advisories?ecosystem=npm&affects=nodemailer@10.0.11"` returned no advisories on 2026-10-03.

The breaking changes from 7.0.0 to 10.0.0 do not touch the calls `send-email` makes (`nodemailer.createTransport`
with an SMTP config and `transport.sendMail`). They are:

- 7: the SES transport moves to SESv2;
- 8: the error code `NoAuth` is renamed `ENOAUTH`;
- 9: TLS is verified when fetching remote content (attachments by URL, OAuth2, proxies);
- 10: Node 20 or newer, and the package is TypeScript with an ESM build that keeps `export default nodemailer`.

## Resume steps (once the trigger date has passed)

1. Re-measure: `npm view nodemailer time --json`. Take the newest 10.0.x that is at least 7 days old and at least
   10.0.6. Confirm 10.0.0 is at least 30 days old.
2. Run `gh api "/advisories?ecosystem=npm&affects=nodemailer@<v>"` and confirm no high or critical entry. Record it in
   `169-EVIDENCE.md` § 2.
3. In `send-email/index.ts`, change the import to `import nodemailer from 'npm:nodemailer@<v>';`. The test docblocks
   no longer quote the version, so nothing else changes.
4. Run `yarn workspace @openvaa/supabase test:unit`.
5. Boot check: restart this project's stack (`yarn db:stop && yarn db:start`). Then
   `curl -s -o /dev/null -w '%{http_code}' -X OPTIONS http://127.0.0.1:54321/functions/v1/send-email` must give 200,
   and `docker logs supabase_edge_runtime_openvaa-local` must show no `worker boot error`.
6. Run the full E2E suite. Note: no spec calls `send-email` (todo `2026-10-03-edge-email-functions-have-no-e2e-coverage.md`),
   so the boot check and an anon-token probe (as in 169-07) are the function's runtime proof; the full suite proves
   nothing else regressed.
7. Commit as `fix(supabase): pin send-email's nodemailer to <v>`. Remove the § 3 hold row, and mark DEPS-09 complete
   if nothing else is open on it (the audit-blind-spot todo it also needs was filed by 169-13:
   `2026-10-03-deno-edge-imports-invisible-to-audit-deps.md`).

## Still held at the end of Phase 169 (169-13, 2026-10-03T19:00Z)

Phase 169's last plan ran about 13 hours before the trigger, so the pin was **not** applied and Phase 169 closes with
this hold open. **DEPS-09 stays Pending for this one reason only**: every other part of it is done (supabase-js and
jose pinned exactly in 169-07, the function vitest suites and bank-auth 3× green, the audit-blind-spot todo filed).
Re-measured at 19:00Z: `gh api "/advisories?ecosystem=npm&affects=nodemailer@6.9.10"` still lists 17 advisories
(6 high — GHSA-v53p-9fqp-m79j, GHSA-2x7j-588g-ccc2, GHSA-p6gq-j5cr-w38f, GHSA-rcmh-qjqh-p98v and the duplicates
GHSA-h3hj-cmcx-xc66, GHSA-jj37-3377-m6vv — 10 moderate, 1 low; `169-EVIDENCE.md` § 8), and `nodemailer@10.0.11` still
lists none. The resume steps above are unchanged; run them on or after **2026-10-04T07:51Z**.

