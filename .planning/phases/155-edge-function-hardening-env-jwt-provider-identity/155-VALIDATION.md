---
phase: 155
slug: edge-function-hardening-env-jwt-provider-identity
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-28
---

# Phase 155 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `155-RESEARCH.md` § Validation Architecture (measured, not assumed).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 (already declared; nothing to install) |
| **Config file** | `apps/supabase/vitest.config.ts` — `include: ['supabase/functions/**/*.test.ts']` |
| **Quick run command** | `yarn workspace @openvaa/supabase test:unit` |
| **Full suite command** | `yarn test:unit` (→ `yarn assert:unit-coverage && turbo run test:unit`) |
| **Estimated runtime** | ~0.25 s for the supabase workspace (measured 237 ms wall) |

**Key measured fact:** the Edge-Function test harness *already exists*. Any new
`*.test.ts` placed beside any Edge Function under `apps/supabase/supabase/functions/`
is picked up with **zero config change**. `deno` is not installed and there is no
`deno.json`/`deno.lock` anywhere in the tree, so a `deno test` task is not a runnable
option here.

---

## Sampling Rate

- **After every task commit:** `yarn workspace @openvaa/supabase test:unit`
- **After every plan wave:** `yarn test:unit && yarn lint:check`
- **Before `/gsd-verify-work`:** `yarn test:unit` green, `yarn lint:check` green
  (including the new env-default guard), `yarn test:e2e` green per the project's
  cardinal rule; plus **one** `PLAYWRIGHT_BANK_AUTH=1` run to confirm the
  runbook/env update on the criterion-5 path.
- **Max feedback latency:** < 5 s for the unit loop.

---

## Per-Task Verification Map

| Requirement | Behavior | Test Type | Automated Command | File Exists |
|---|---|---|---|---|
| REVIEW-EDGE-01 | base64url segment decodes; plain `atob` throws on the same input; UTF-8 preserved | unit | `yarn workspace @openvaa/supabase test:unit` (`invite-candidate/*.test.ts`) | ❌ W0 |
| REVIEW-EDGE-01 | same, `send-email` copy | unit | `yarn workspace @openvaa/supabase test:unit` (`send-email/*.test.ts`) | ❌ W0 |
| REVIEW-EDGE-01 | negative control asserts its own premise (`/[-_]/` present in the segment) | unit | same | ❌ W0 |
| REVIEW-EDGE-02 | each of the 7 sites throws naming its variable | unit over the extracted env accessor | `yarn workspace @openvaa/supabase test:unit` | ❌ W0 |
| REVIEW-EDGE-02 | the class stays closed | static guard | `node scripts/assert-edge-env-defaults.mjs`, chained into `yarn lint:check` | ❌ W0 |
| REVIEW-EDGE-02 | the guard cannot be silently unwired | unit (chain-membership assertion) | existing membership-gate precedent at `packages/dev-seed/tests/ciTypecheckGate.test.ts:83-86` | ⚠ extend |
| REVIEW-EDGE-02 | repo-wide port/localhost sweep dispositioned | documentation | phase record table + filed todos | n/a |
| REVIEW-EDGE-03 | `{{x}}`, `{{ x }}`, `{{  x  }}`, dotted flat keys, unknown-key passthrough, `{{}}` non-match | unit | `yarn workspace @openvaa/supabase test:unit` | ❌ W0 |
| REVIEW-EDGE-04 | `identityMatchProp === 'sub'`; `birthdate` stays metadata | unit | `yarn workspace @openvaa/supabase test:unit` | ✅ exists, passes |
| REVIEW-EDGE-04 | Signicat `sub` stability finding recorded with citation | documentation | phase record + `claimConfig.ts` docstring | n/a |
| REVIEW-EDGE-05 | unset `aud`/`iss` config **throws** rather than skipping the check | unit | `yarn workspace @openvaa/supabase test:unit` | ❌ W0 |
| REVIEW-EDGE-05 | wrong-`aud` + wrong-`iss` token accepted under `{}`, **rejected** under the binding | unit (jose, locally-minted keys, no network) | same | ❌ W0 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] URL-import-free sibling module + `.test.ts` for the base64url JWT segment decode (one per function, or one shared) — REVIEW-EDGE-01
- [ ] URL-import-free sibling module + `.test.ts` for `send-email`'s placeholder substitution — REVIEW-EDGE-03
- [ ] URL-import-free sibling module + `.test.ts` for the env accessor that throws — REVIEW-EDGE-02
- [ ] URL-import-free sibling module + `.test.ts` for the `aud`/`iss` verify-option construction — REVIEW-EDGE-05
- [ ] `scripts/assert-edge-env-defaults.mjs` + its `lint:check` link + a chain-membership assertion — REVIEW-EDGE-02 guard half
- [ ] `jose` declared as a devDependency of `@openvaa/supabase` so the criterion-5 test's dependency is honest (it currently resolves only through the root hoist)
- [ ] Framework install: **none needed** — vitest is already declared and already running

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|---|---|---|---|
| Signicat `sub` stability | REVIEW-EDGE-04 | External provider documentation, not code | Fetch the cited Signicat Subject page, quote the transient/persistent rule verbatim, record the URL and retrieval date on the phase record |
| Sweep disposition | REVIEW-EDGE-02 (second half) | Judgement call per finding; `config.toml` belongs to Phase 156 criterion 8 | Record each bucket with counts; file the deferred items under `.planning/todos/pending/` per D-N2 |
| Bank-auth E2E recipe still works after the throws land | REVIEW-EDGE-05 | Opt-in Playwright project | One `PLAYWRIGHT_BANK_AUTH=1` run after `tests/IDURA-TEST-RUNBOOK.md` and the env recipe are updated |

---

## Validation Sign-Off

- [ ] All tasks have an automated verify or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5 s on the unit loop
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
