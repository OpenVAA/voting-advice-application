---
phase: quick-260930-gk2
verified: 2026-09-30T10:20:00Z
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
---

# Quick 260930-gk2 Verification Report

**Goal:** the dev-seed service-role client refuses non-local Supabase hosts unless explicitly opted out; CI/E2E URLs must still pass.
**Commits checked:** 7fec3172d, 77e429e9c (branch fix/888-review-findings)
**Re-verification:** No

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Constructor throws before `createClient` on every path; message names host and both opt-outs, no key or userinfo | VERIFIED | `packages/dev-seed/src/supabaseAdminClient.ts` calls `assertLocalSupabaseUrl(resolvedUrl, options)` before `createClient`, which is the only `createClient` call in `packages/dev-seed/src`. The Writer forwards `allowRemote`. The tests/ subclass is untouched (zero diff under `tests/`). A probe on `https://user:sekret@prod.supabase.co/x?k=1` printed only `'prod.supabase.co'` plus both opt-outs; no userinfo, path or key. |
| 2 | Allowlist is exact and lookalikes are refused | VERIFIED | I ran `isLocalSupabaseUrl` myself. Pass: localhost, LOCALHOST, 127.0.0.1, 127.9.9.9, 127.1, [::1], host.docker.internal, kong, supabase_kong_openvaa-local. Refused: localhost.evil.example, 127.0.0.1.nip.io, `localhost@evil.example`, `localhost.`, 0.0.0.0, `[::ffff:127.0.0.1]`, 192.168.1.5, x.supabase.co, empty string, garbage. |
| 3 | seed and teardown CLIs exit 1 on non-local URLs; `--allow-remote` and `DEV_SEED_ALLOW_REMOTE=1` get past the guard | VERIFIED | `--allow-remote` is parsed in both `cli/seed.ts` and `cli/teardown.ts` and forwarded (`new Writer({ allowRemote })`, and the client's 4th constructor argument). `tests/cli/localityGuard.test.ts` runs subprocesses: 14 of 14 pass, covering refusal, flag opt-out, env opt-out, local pass-through and key non-leakage. |
| 4 | Every local/E2E/CI wiring URL passes, and the drift gate fails closed | VERIFIED | The `repository wiring drift gate` in `tests/localSupabaseUrl.test.ts` derives URLs at run time from .env.example, e2e-run.sh, docker-compose.dev.yml, the config.toml `[api]` port, both client default literals, the visual-container forward and the seed.sql `supabase_url`. It asserts `length > 0` per source and passes every URL through `isLocalSupabaseUrl`; all pass. CI exports `SUPABASE_URL=$API_URL` from `supabase status`, which is 127.0.0.1. |
| 5 | Full dev-seed unit suite (live tiers included), `typecheck:tests`, dev-seed typecheck and lint pass; the harness subclass is unchanged; `projectId ?? TEST_PROJECT_ID` is kept | VERIFIED | `yarn test:unit` in packages/dev-seed: 64 files, 881 tests, exit 0. The default-template integration test ran against the live local Supabase (HTTP 200 on :54321) and did not skip. `yarn typecheck` exit 0, `yarn typecheck:tests` exit 0, `yarn lint` exit 0 (15 pre-existing warnings, 0 errors). `yarn assert:comment-hygiene` exit 0. `git diff 7fec3172d~1 77e429e9c -- tests` is empty, and `projectId ?? TEST_PROJECT_ID` is present verbatim. |
| 6 | README and both `--help` texts describe the guard, allowlist and opt-outs; README no longer says no locality check exists | VERIFIED | `help.ts` and `teardown-help.ts` document `--allow-remote`, the allowlist and `DEV_SEED_ALLOW_REMOTE`. The README documents both in the CLI option tables, Environment and Security Notes (lines ~48, 63, 309, 356-393). The old "no locality check" statement is gone. The help tests pass. |

**Score:** 6/6

## Requirements Coverage

| Requirement | Status |
|-------------|--------|
| QUICK-260930-gk2 | SATISFIED |

## Anti-Patterns

None found in the changed files. No debt markers, and comment hygiene passes.

## Notes (non-blocking)

- The full E2E suite has not been run. The plan defers it to a batch-level gate after merge, so it is not a gap.
- Recorded follow-ups, out of scope: the teardown client reads the SUPABASE_URL default captured at import, before `.env` loads. The service-role `createClient` in `candidate-bank-auth.spec.ts` sits outside dev-seed.
- Only the exact strings `1` and `true` (case-insensitive) opt out through the environment; anything else leaves the guard on. The tests cover this.

## Gaps Summary

No gaps. The goal is achieved and verified by running the code and tests, not by the SUMMARY.

_Verified: 2026-09-30_
_Verifier: Claude (gsd-verifier)_
