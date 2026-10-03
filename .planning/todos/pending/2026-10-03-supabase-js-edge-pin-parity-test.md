---
title: "Hold the three Edge Functions' `npm:@supabase/supabase-js@<v>` pins to each other and to the installed version, like the jose pin test"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source: 169-REVIEW.md IN-09; disposition 169-REVIEW-DISPOSITION.md
priority: low
suggested_phase: the nodemailer quick task, or the next dependency or Edge Function phase (a quick task is enough)
keywords: [supabase-js, deno, edge-functions, npm-imports, pin-parity, unit-test, audit-blind-spot]
re_check_trigger: "the next lockfile refresh that moves @supabase/supabase-js; or any edit to an Edge Function's import line"
---

# Nothing keeps the supabase-js Edge pins in step

`identity-callback/verifyConfig.test.ts` ("is the exact version the Edge Function pins") holds the installed `jose`
to the `npm:jose@<v>` literal in `identity-callback/index.ts`. Nothing does the same for supabase-js:

- `apps/supabase/supabase/functions/identity-callback/index.ts`: `npm:@supabase/supabase-js@2.117.2`
- `apps/supabase/supabase/functions/invite-candidate/index.ts`: `npm:@supabase/supabase-js@2.117.2`
- `apps/supabase/supabase/functions/send-email/index.ts`: `npm:@supabase/supabase-js@2.117.2`
- `.yarnrc.yml` catalog: `'@supabase/supabase-js': ^2.117.2`. Installed on 2026-10-03: 2.117.2.

A lockfile refresh that moves the frontend to 2.118 would leave the three functions behind with no failing check, and
`yarn audit:deps` cannot see the Deno pins at all (`2026-10-03-deno-edge-imports-invisible-to-audit-deps.md`).

## What to do

1. Add a sibling assertion in the `@openvaa/supabase` vitest suite, for example
   `apps/supabase/supabase/functions/_shared/edgePins.test.ts`. It extracts `npm:@supabase/supabase-js@<v>` from every
   `functions/*/index.ts` and asserts that there are exactly three, that they are equal, and that they equal
   `createRequire(import.meta.url)('@supabase/supabase-js/package.json').version`.
2. Bind it with a negative control: change one literal by a patch level locally and confirm the test fails, then
   revert.
3. Consider generalising it to every `npm:` pin that also exists in `node_modules` (jose, supabase-js). nodemailer is
   not a workspace dependency, so it stays covered only by the audit-blind-spot todo.
