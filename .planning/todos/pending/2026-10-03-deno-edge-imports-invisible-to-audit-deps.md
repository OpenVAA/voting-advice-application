---
title: "`yarn audit:deps` cannot see the Edge Functions' Deno `npm:` imports, so a high advisory on them never reddens the build"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: high
suggested_phase: next security/CI-hardening phase (before the nodemailer pin is next allowed to go stale)
keywords: [audit, deno, edge-functions, npm-imports, nodemailer, supabase-js, jose, blind-spot, D-09, cigate-03]
re_check_trigger: "now (structural gap); concretely visible until the send-email nodemailer pin moves (todo 2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md)"
---

# The audit gate reads `yarn.lock`; the Edge Functions resolve their imports at boot under Deno

## What was measured (2026-10-03T19:00Z, Phase 169 plan 13)

`scripts/assert-dependency-audit.mjs` runs `yarn npm audit --all --recursive`, which reads the Yarn lockfile. The three
Supabase Edge Functions import their dependencies with Deno `npm:` specifiers that no `package.json` declares:

| Function | Import (exact pin, set in 169-07) | `gh api "/advisories?ecosystem=npm&affects=<pkg>@<v>"` |
|---|---|---|
| `send-email/index.ts` | `npm:@supabase/supabase-js@2.117.2` | 0 advisories |
| `send-email/index.ts` | `npm:nodemailer@6.9.10` (HELD, see below) | **17 advisories: 6 high (4 distinct), 10 moderate, 1 low** |
| `identity-callback/index.ts` | `npm:@supabase/supabase-js@2.117.2`, `npm:jose@6.2.12` | 0 and 0 |
| `invite-candidate/index.ts` | `npm:@supabase/supabase-js@2.117.2` | 0 advisories |

`yarn audit:deps` exits 0 on this tree ("0 new advisory(ies) at high+, 0 accepted") while `send-email` runs a
nodemailer with open high advisories. That is the blind spot. The full nodemailer list is in
`169-EVIDENCE.md` § 8.

A second, smaller gap: the exact pins fix the top-level version, but each package's own dependencies float. Deno
resolves them from the npm registry at function boot (no lockfile is committed for the functions), so a transitive
of `@supabase/supabase-js` or `jose` can move between two boots without any repository change.

## What to do

1. Add a gate step that audits the Deno imports. The simplest shape: a script that extracts every `npm:<pkg>@<version>`
   specifier from `apps/supabase/supabase/functions/**/index.ts` and runs
   `gh api "/advisories?ecosystem=npm&affects=<pkg>@<version>"` (or the npm bulk advisory endpoint) for each, failing at
   high+ unless the advisory ID is in `security/audit-baseline.json` with a reviewed rationale. Bind it with a planted
   vulnerable pin as the negative control.
2. Consider committing a `deno.lock` for the functions (or `--lock` in the serve command) so transitive resolution is
   reproducible, and audit that lock as well.
3. Until then, every dependency phase checks the Deno pins by hand, as 169-07 and 169-13 did.

## Related

- Held pin: `.planning/todos/pending/2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md`.
- Dependabot reconciliation (also records this blind spot): `2026-09-03-dependabot-alert-list-is-stale-against-main.md`.
- Deno functions do not consume the generated types either: `2026-09-03-deno-edge-functions-do-not-consume-supabase-types.md`.
