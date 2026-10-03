---
title: "Re-check every release Phase 169 held under the age rule (D-03): 7-day patch holds clear 2026-10-04 … 10-09, new-major holds 2026-10-15 … 10-31"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: medium
suggested_phase: the next dependency pass (any run on or after 2026-10-09 can take every 7-day row at once)
keywords: [age-rule, npmMinimalAgeGate, holds, D-03, D-06, version-table, re-check]
re_check_trigger: "the dates in the table below; the earliest is 2026-10-04T03:28Z"
---

# Releases held by the age rule at the end of Phase 169

Source: `169-VERSION-TABLE.md` regenerated 2026-10-03T19:00:38Z (`169-version-probe.mjs`, Node 24.21.0) and
`169-EVIDENCE.md` § 3. The rule (D-03): a version is taken only at ≥ 7 days old; a new major also needs its x.0.0
≥ 30 days old. `.yarnrc.yml` enforces the 7-day part (`npmMinimalAgeGate: 7d`). Nothing below has an open high+
advisory on the version in the tree (the audit reports none at high+).

## Holds with their own todo (not repeated here)

| Package | In the tree | Clears | Todo |
|---|---|---|---|
| `nodemailer` (Deno pin in `send-email`) | 6.9.10 | 2026-10-04T07:51Z (10.0.11) | `2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md` |
| `intl-messageformat` 12 | 11.2.15 | 2026-10-15T12:27Z | `2026-10-03-dotenv-18-and-intl-messageformat-12-held.md` |
| `dotenv` 18 | 17.4.2 | 2026-10-17T21:18Z | same |
| `@sveltejs/kit` 3, `adapter-node` 6, `adapter-static` 4 | 2.70.3, 5.5.7, 3.0.10 | 2026-10-31T17:24:31Z (latest of the three) | `2026-10-03-sveltekit-3-held-by-the-age-rule.md` |
| `typescript` 7 | 6.0.3 | peer-blocked, not age | `2026-10-03-typescript-7-held.md` |
| ESLint `no-useless-assignment` disables | — | eslint-plugin-svelte#1478 | `2026-10-03-remove-bindable-no-useless-assignment-disables.md` |

## 7-day holds (in-line releases younger than 7 days on 2026-10-03)

| Package | In the tree | Held release(s) | First clears | All clear |
|---|---|---|---|---|
| `ai` | 7.0.116 | 7.0.117 … 7.0.127 | 2026-10-04T03:28Z (7.0.117) | 2026-10-08T19:20Z (7.0.127) |
| `@ai-sdk/google` | 4.0.82 | 4.0.83 … 4.0.87 | 2026-10-05T17:15Z | 2026-10-07T17:48Z |
| `@ai-sdk/openai` | 4.0.78 | 4.0.79 … 4.0.83 | 2026-10-05T17:15Z | 2026-10-07T17:48Z |
| `typescript-eslint` family (`@typescript-eslint/parser`, `/eslint-plugin`) | 8.70.1 | 8.71.0 | 2026-10-05T17:13Z | same |
| `turbo` | 2.11.4 | 2.11.5 … 2.11.7 | 2026-10-05T00:45Z | 2026-10-09T14:58Z |
| `vitest`, `@vitest/browser-playwright` | 5.0.2 | 5.0.3 | 2026-10-07T11:30Z | same |
| `daisyui` | 5.7.46 | 5.7.47 | 2026-10-07T00:29Z | same |
| `supabase` (CLI) + the six `setup-cli` `version:` pins | 2.118.0 | 2.119.0 | 2026-10-07T21:36Z | same |
| `vite` | 8.3.1 | 8.3.2 | 2026-10-08T10:17Z | same |
| `globals` | 17.12.0 | 17.13.0 | 2026-10-08T03:57Z | same |
| `@types/node` | 24.19.0 | 24.19.1 (26.x is a runtime-major move, held while Node is 24) | 2026-10-08T22:38Z | same |
| `eslint` | 10.11.0 | 10.12.0 | 2026-10-09T20:08Z | same |

## What to do

1. On or after the date, re-run `node .planning/phases/169-dependency-bump-to-latest-safe-versions/169-version-probe.mjs
   --node "$(node -v | tr -d v)"` (or its successor) against the live registry; never reuse these verdicts.
2. Bump each cleared package through its catalog/manifest entry, one commit per family, then the gate set.
   Special cases: the Supabase CLI moves with all six `setup-cli` pins and needs `db:types` + pgTAP + E2E (D-10);
   the AI SDK family moves together (`ai` and both providers on the same `@ai-sdk/provider-utils`), and must keep
   `undici` 5 / `@fastify/busboy` out of the tree (169-09); Vitest needs the per-workspace test counts unchanged.
3. `@types/node` stays on 24.x while the runtime is Node 24 (types track the runtime major, D-11).
