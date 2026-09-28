---
phase: 165-review-stack-comment-remediation
plan: 30
subsystem: auth
tags: [oidc, idura, signicat, ftn, identity-callback, env, comment-hygiene]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-01 instruments (hygiene gate, code-identity, assert-absent, e2e-verdict, ledger)
provides:
  - Provider keywords `idura-ftn` / `signicat-ftn` on both runtimes, both env templates, the runbook and the bank-auth specs
  - FTN-marked claim configs `IDURA_FTN_AUTH_CONFIG` / `SIGNICAT_FTN_AUTH_CONFIG`; generic provider implementations
  - `resolveProviderConfig()` own-key lookup in identity-callback; fail-closed unit cases on both runtimes
  - Hygiene gate notes a `vN.M` version string in code instead of failing layer 1
affects: [165-35, 165-36, identity-callback, bank-auth E2E, local env files]

actuals:
  tokens: 40132
  tasks: 4
  commits: 7
plan_head_before: ae336d45cc8802f00772817c8e63f109624a5dee
plan_head_after: 97a784ab776d60297f5721ba0532bd15505f3bdb

tech-stack:
  added: []
  patterns:
    - "Provider keyword = provider + claim-mapping region (`<provider>-ftn`); the provider implementation stays generic"
    - "Env-keyed config maps are read through an own-key lookup (`Object.hasOwn`), never a plain index"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-30.tsv
  modified:
    - apps/frontend/src/lib/api/utils/auth/providers/types.ts
    - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
    - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
    - apps/frontend/src/lib/api/utils/auth/providers/index.ts
    - apps/frontend/src/lib/utils/constants.ts
    - apps/frontend/src/routes/candidate/preregister/+page.svelte
    - apps/frontend/svelte.config.js
    - apps/supabase/supabase/functions/identity-callback/claimConfig.ts
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/supabase/functions/.env.example
    - .env.example
    - tests/IDURA-TEST-RUNBOOK.md
    - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
    - tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh

key-decisions:
  - "Both env templates carry `signicat-ftn` (the constants.ts default) and the `<provider-client-id>` placeholder, so the example twins agree"
  - "identity-callback resolves its claim config through resolveProviderConfig(), an own-key lookup, so inherited names such as constructor or __proto__ are rejected"
  - "The hygiene gate reports a `vN.M` match outside a comment (codemod milestone-version rule on code, e.g. jose@v5.9.6) as a note; layer 2 still catches real milestone tags"

patterns-established:
  - "An unsuffixed provider keyword is a misconfiguration that throws, on both runtimes"

requirements-completed: [165-SC2, 165-SC3, 165-SC4, C-4105374348]

coverage:
  - id: D1
    description: "Keywords renamed to idura-ftn / signicat-ftn and FTN configs renamed across both runtimes, env templates, runbook and specs; providers stay generic"
    requirement: "C-4105374348"
    verification:
      - kind: other
        ref: "assert-absent.sh \"'idura'|'signicat'|IDURA_AUTH_CONFIG|SIGNICAT_AUTH_CONFIG|=idura(?![\\w-])|=signicat(?![\\w-])\" -- apps tests .env.example (exit 0)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit auth (192/192); yarn workspace @openvaa/supabase test:unit (182/182)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Old keywords fail closed: getActiveProvider() throws and resolveProviderConfig() rejects them"
    requirement: "C-4105374348"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/utils/auth/providers/authorize-fail-closed.test.ts#getActiveProvider — fail-closed on the provider keyword"
        status: pass
      - kind: unit
        ref: "apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts#resolveProviderConfig"
        status: pass
    human_judgment: false
  - id: D3
    description: "Example env twins agree; local env files use the new keyword"
    requirement: "165-SC2"
    verification:
      - kind: other
        ref: "yarn check:env-pairs-agree .env.example --deno-file apps/supabase/supabase/functions/.env.example && yarn assert:env-pair-registry (exit 0)"
        status: pass
      - kind: other
        ref: "yarn check:env-local (exit 1: IDENTITY_PROVIDER_TYPE pair OK; unrelated SUPABASE_URL pair half-configured in the maintainer's root .env)"
        status: fail
    human_judgment: true
    rationale: "The maintainer's untracked root .env lacks SUPABASE_URL; only the maintainer can add it, and the agent may not read or edit .env"
  - id: D4
    description: "Every changed file hygiene-clean; full lint and full E2E green"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "hygiene-changed-files.sh --check-reads --files <201 committed non-.planning branch files> (CLEAN, 0 unread)"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true yarn lint:check (exit 0)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/165-30 — e2e-verdict.mjs GREEN 165 passed, 0 failed, 0 flaky, 0 did-not-run"
        status: pass
    human_judgment: false

duration: 3h 45m (includes the checkpoint wait)
completed: 2026-09-28
status: complete
---

# Phase 165 Plan 30: FTN Provider Keywords Summary

**The identity-provider keywords are now `idura-ftn` / `signicat-ftn` on both runtimes, and the Finnish Trust Network claim configs are named `IDURA_FTN_AUTH_CONFIG` / `SIGNICAT_FTN_AUTH_CONFIG`. The provider implementations stay generic, and the unsuffixed keywords fail closed in both `getActiveProvider()` and a new own-key `resolveProviderConfig()` in identity-callback.**

## Performance

- **Duration:** 3h 45m wall clock, including the wait at the Task 3 checkpoint
- **Started:** 2026-09-28T02:00:10Z
- **Completed:** 2026-09-28T05:45:33Z
- **Tasks:** 4 of 4 (Task 3 was the maintainer checkpoint, answered "done")
- **Files modified:** 24 outside `.planning/`, plus the gate script, the read log and the ledger

## Accomplishments

- **Keyword rename (C-4105374348).** The FTN keywords replace the old ones in every place a keyword is set or compared:
  - frontend: `ProviderType`, each provider's `type`, the `getActiveProvider()` switch and its error text, the `constants.ts` default (`'signicat-ftn'`) and the preregister comparison;
  - Edge Function: the `PROVIDER_CONFIGS` keys and the documented values of `IDENTITY_PROVIDER_TYPE`;
  - both `.env.example` files (values and section headers), the runbook, every auth unit test, `claimConfig.test.ts` and both bank-auth specs.
- **FTN configs are marked, and the providers stay generic.** `IDURA_AUTH_CONFIG` became `IDURA_FTN_AUTH_CONFIG` and `SIGNICAT_AUTH_CONFIG` became `SIGNICAT_FTN_AUTH_CONFIG`. `iduraProvider`, `signicatProvider`, the provider files and the `IDURA_*` broker settings are unchanged. The `iduraProvider` counts are 5/17/1/2, the same as at the phase base.
- **Old keywords fail closed on both runtimes.**
  - `getActiveProvider()` throws for each valid keyword with its `-ftn` suffix dropped, and for `''`, `unknown` and `SIGNICAT-FTN`.
  - `resolveProviderConfig()` rejects the same keywords and inherited names (`constructor`, `toString`, `__proto__`), and `index.ts` is pinned to call it.
  - Both sets of cases go red under mutation: an added `case 'signicat':`, and a return to a plain index.
- **Comment hygiene on all 24 changed files.** Planning paths, phase, review, threat and research ids, "EFLOW-10" section names and historical narrative are removed. The comment-only commit is proven by `code-identity.mjs`: 17 files compared, 0 with changed code. The env templates and the runbook are prose files, so they were read instead.
- **Full gates.** Lint is green and the full E2E suite passed: 165/165, 0 flaky, 0 did-not-run.

## FTN audit

| Config | Runtime | Finnish-specific content | Now named / keyed |
|---|---|---|---|
| Idura claim mapping | frontend | `hetu`, `birthdate`, `country` | `IDURA_FTN_AUTH_CONFIG` |
| Signicat claim mapping | frontend | `birthdate` | `SIGNICAT_FTN_AUTH_CONFIG` |
| Idura claim mapping | Edge | `hetu`, `birthdate` | `PROVIDER_CONFIGS['idura-ftn']` |
| Signicat claim mapping | Edge | `birthdate` | `PROVIDER_CONFIGS['signicat-ftn']` |

The search for other candidates, `hetu|ftn|finnish|birthdate` over `apps`, `packages` and `packages/app-shared/src`, found no other FTN-specific constant. Hits outside the auth config are dev-seed flavour text and LLM prompts, and none of them is identity configuration.

## Task Commits

1. **Task 1: keyword rename and FTN config names (tracer)** - `ba8cf2e1c` (feat)
2. **Task 2: fail-closed cases on both runtimes** - `328692763` (fix)
3. **Task 2: hygiene gate treats a version string in code as a note** - `ed4eb463a` (fix)
4. **Task 2: comment-only hygiene pass** - `ba23c6b70` (style, `Hygiene: D-04`)
5. **Task 2: string-literal hygiene (a test title and a spec failure message)** - `ea9b52a94` (test)
6. **Task 2: hygiene read log** - `de7d75d0b` (chore)
7. **Task 3: checkpoint.** The maintainer updated the local env files and answered "done". No commit.
8. **Task 4: ledger row** - `97a784ab7` (docs)

**Plan metadata:** the commit that contains this SUMMARY (docs).

## Verification (each exit status read directly)

| Command | Result |
|---|---|
| `assert-absent.sh "'idura'\|'signicat'\|\"idura\"\|\"signicat\"\|IDENTITY_PROVIDER_TYPE=(idura\|signicat)(?![\w-])\|IDURA_AUTH_CONFIG\|SIGNICAT_AUTH_CONFIG" -- apps .env.example` | 0 `absent` |
| `assert-absent.sh "'idura'\|'signicat'\|IDURA_AUTH_CONFIG\|SIGNICAT_AUTH_CONFIG\|=idura(?![\w-])\|=signicat(?![\w-])" -- apps tests .env.example` | 0 `absent` (positive control `X=idura` matches) |
| `yarn check:env-pairs-agree .env.example --deno-file apps/supabase/supabase/functions/.env.example` | 0 (4 compared, 0 disagreements; at the plan base it exited 1 with 2 disagreements) |
| `yarn assert:env-pair-registry` / `yarn assert:edge-function-env` | 0 / 0 |
| `yarn workspace @openvaa/frontend test:unit auth` | 0, 13 files, 192 tests |
| `yarn workspace @openvaa/supabase test:unit` | 0, 15 files, 182 tests |
| `yarn workspace @openvaa/dev-seed test:unit e2eDocPreconditionGate` | 0, 7 tests |
| `yarn typecheck:tests` / `yarn workspace @openvaa/frontend check` | 0 / 0 (0 errors, 0 warnings) |
| `bash scripts/tip-proofs.sh` | 0 |
| `hygiene-changed-files.sh --self-test` (after the gate change) | 0, `SELF-TEST: PASSED` |
| `hygiene-changed-files.sh --check-reads --files <24 plan files>` | 0, CLEAN, 0 unread |
| `hygiene-changed-files.sh --check-reads --files <git diff --name-only --diff-filter=d ship/v2.15-12-planning...HEAD, minus .planning/>` (201 files in scope) | 0, CLEAN, 0 unread |
| `TURBO_FORCE=true yarn lint:check` | 0 |
| `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-30 --no-db-reset` | 0, 165 passed (11.0m), preflight OK, served project `...0e2` |
| `node .../e2e-verdict.mjs tests/e2e-runs/165-30` | 0: `VERDICT: GREEN (expected 165 >= 165, 0 failed, 0 flaky, 0 did-not-run)` |
| `yarn check:env-local` | **1**. See Issues Encountered. |
| `ledger-check.sh` | 0 |

The branch-wide hygiene run scopes to committed changes (`ship/v2.15-12-planning...HEAD`). That excludes the maintainer's uncommitted `apps/frontend/src/lib/layouts/main/MainContent.svelte` and `.planning/milestone.lock`. Neither file is in the committed set, and no read was recorded for either.

**Bank-auth E2E projects.** `bank-auth` and `bank-auth-journey` are gated by `PLAYWRIGHT_BANK_AUTH=1` and the runbook's environment, so they did not run in the default suite. The unit cases cover the rename instead:
- `authorize-fail-closed.test.ts` covers keyword selection and rejection;
- `claimConfig.test.ts` covers the `PROVIDER_CONFIGS` keys, `resolveProviderConfig` and identity-key uniqueness per keyword;
- `idura.test.ts` / `signicat.test.ts` cover each provider's `type` and claim mapping.

The specs' own `identity_provider` expectation now reads `'idura-ftn'`.

## Review-comment dispositions

| Comment | Disposition | Commits | Draft reply |
|---|---|---|---|
| C-4105374348 (#880 `idura.ts:1`, kaljarv) | fix | `ba8cf2e1c`, `328692763` | Renamed the keywords to `idura-ftn` / `signicat-ftn` on both runtimes and in both env templates (ba8cf2e1c). `IDURA_AUTH_CONFIG` → `IDURA_FTN_AUTH_CONFIG` and `SIGNICAT_AUTH_CONFIG` → `SIGNICAT_FTN_AUTH_CONFIG`; the providers stay generic. The old keywords fail closed on both runtimes (328692763). |

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's negative-grep patterns could never pass**
- **Found during:** Task 1 verify
- **Issue:** `=idura\b`, `=signicat\b` and `IDENTITY_PROVIDER_TYPE=(idura|signicat)\b` also match the new values, because `\b` treats `-` as a word boundary: `=idura-ftn` matches `=idura\b`.
- **Fix:** Ran the same patterns with `(?![\w-])` in place of `\b`. A positive control (`X=idura`) still matches.
- **Commit:** none (verification only)

**2. [Rule 3 - Blocking] The example env twins already disagreed at the plan base**
- **Found during:** Task 1 read_first
- **Issue:** At the base, `check:env-pairs-agree .env.example --deno-file ...` exited 1 on two pairs:
  - root `PUBLIC_IDENTITY_PROVIDER_TYPE=signicat` vs functions `IDENTITY_PROVIDER_TYPE=idura`;
  - root `client_id` vs functions `<provider-client-id>`.
- **Fix:** Both templates now carry `signicat-ftn`, which is the `constants.ts` default. The root client id is now the `<provider-client-id>` placeholder, the convention `assert-edge-function-env.mjs` detects.
- **Files:** `.env.example`, `apps/supabase/supabase/functions/.env.example`
- **Commit:** `ba8cf2e1c`

**3. [Scope] Task 1 includes the test, spec and runbook renames**
- **Issue:** Task 1's verify greps all of `apps` (test files included) and the plan asks for "one commit". Splitting the test updates into Task 2 would have left Task 1's commit red.
- **Fix:** `ba8cf2e1c` renames every keyword and config name, including tests, specs and the runbook. Task 2 then added the fail-closed cases and did the hygiene work.

**4. [Rule 2 - Missing critical] Own-key provider-config lookup in identity-callback**
- **Found during:** Task 2, while making "the Edge Function rejects `idura`" unit-provable (T-165-49)
- **Issue:** `index.ts` indexed `PROVIDER_CONFIGS[providerType]` directly. `index.ts` cannot be imported by vitest. A plain index also resolves inherited names such as `constructor` or `__proto__` to a truthy value that is not a config.
- **Fix:** Added `resolveProviderConfig()` to `claimConfig.ts`, using `Object.hasOwn`, and `index.ts` now calls it. New unit cases cover it, plus a source assertion that pins the call site. Both go red under mutation.
- **Files:** `claimConfig.ts`, `claimConfig.test.ts`, `identity-callback/index.ts`
- **Commit:** `328692763`

**5. [Rule 3 - Blocking] The hygiene gate failed layer 1 on an import URL**
- **Found during:** Task 2 hygiene gate
- **Issue:** The codemod checks the comment span before the rule. Its milestone-version rule matched `jose@v5.9.6` in the Edge `index.ts`, and the match arrived as `not-a-comment-span`, which fails layer 1. That contradicts the gate's own contract: 165-01 says milestone-version residue is reported without failing. Layer 1 cannot be allowlisted.
- **Fix:** A `"vN.M"` match outside a comment is now printed as a note, and the codemod-summary reconciliation counts it out. Layer 2's `milestone-tag` pattern still catches real milestone tags anywhere. `--self-test` still passes, and a real `not-a-comment-span` (`EFLOW-10` in a string) still failed until it was fixed.
- **File:** `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh`
- **Commit:** `ed4eb463a`

**6. [Rule 1 - Bug] Factual errors fixed during the hygiene pass**
- **Runbook, journey section:**
  - the chain ended in "registration-key → set password"; it now ends in a magic-link session and the success status page;
  - the selectors read `[EL1]` / `[CO1`; they now match the spec's `[BA-EL1]` / `[BA-CO1`;
  - the 3× gate asked for a "clean DB", which contradicts the section's own "a cleared database is not a prereq"; that phrase is gone;
  - the env table's `authorize|token` cell was split into a spurious extra column; it is one cell again.
- **Journey spec:** the run block's `yarn db:reset` is replaced by `export PUBLIC_PROJECT_ID=...0e2`, matching the runbook. The comments say "grant" where they said "role".
- **Bank-auth spec:** the run comment named `tests/.eflow10.env`; it now names `/tmp/eflow10.env`, the file the runbook writes.
- **Commit:** `ba23c6b70`

**7. [Scope] String-literal hygiene in a separate commit**
- A spec failure message opened with `EFLOW-10`, and a test title said "no longer keys on". These are code, not comments, so they went into their own commit to keep `ba23c6b70` provably comment-only.
- **Commit:** `ea9b52a94`

**8. [Scope] `hygiene-allow/165-30.tsv` was not created.** No allowlist row was needed.

---

**Total deviations:** 8 (1 missing-critical, 3 blocking, 1 bug, 3 scope).
**Impact on plan:** Deviations 2, 4 and 5 make the plan's gates able to pass, or pass for the right reason. Deviation 4 adds a small fail-closed hardening. There was no architectural change.

## Issues Encountered

**`yarn check:env-local` exits 1, on a pair this plan did not touch.** Output, verbatim (it prints no values):

```
  OK   IDENTITY_PROVIDER_CLIENT_ID: PUBLIC_IDENTITY_PROVIDER_CLIENT_ID and IDENTITY_PROVIDER_CLIENT_ID agree.
  OK   IDENTITY_PROVIDER_TYPE: PUBLIC_IDENTITY_PROVIDER_TYPE and IDENTITY_PROVIDER_TYPE agree.
  OK   SUPABASE_ANON_KEY: PUBLIC_SUPABASE_ANON_KEY and SUPABASE_ANON_KEY agree.
[ERROR] scripts/assert-env-pairs-agree.mjs: the cross-runtime pair 'SUPABASE_URL' is HALF-CONFIGURED in '.env': 'PUBLIC_SUPABASE_URL' (.env line 5) is set, but SUPABASE_URL (unset in .env). ...
Cross-runtime env-pair value-agreement checker ... pairs derived from source: 4; compared: 3; skipped as unconfigured: 0; half-configured: 1; disagreements: 0; ...
```

- **The rename itself is confirmed locally:** the `IDENTITY_PROVIDER_TYPE` pair agrees across the root `.env` and `apps/supabase/supabase/functions/.env`.
- **The remaining failure:** the maintainer's root `.env` sets `PUBLIC_SUPABASE_URL` but not `SUPABASE_URL`. The committed `.env.example` has both, since the opt-in bank-auth specs read the un-prefixed name.
- **The fix, which only the maintainer can make:** add `SUPABASE_URL=` with the same value as `PUBLIC_SUPABASE_URL` (for a local stack, `http://127.0.0.1:54321`) to the root `.env`, then re-run `yarn check:env-local`.
- **Why the agent did not do it:** it neither read nor edited `.env`, per the secret-file guard and the coordinator's instruction not to work around it.
- **Consequence:** the plan's truth "`yarn check:env-local` then exits 0" is open until then, and D3 above is marked `human_judgment: true`.

## Known Stubs

None.

## User Setup Required

Add `SUPABASE_URL` (same value as `PUBLIC_SUPABASE_URL`) to the root `.env` and re-run `yarn check:env-local`. See Issues Encountered.

## Next Phase Readiness

- The rename is committed and proven: unit tests, lint and the full E2E suite (165/0/0/0) all pass. The ledger row is filled.
- The gate plans (165-35/36) inherit the hygiene-gate change in `ed4eb463a`. A version string in code is now a note, not a failure.
- The open local-env item (`SUPABASE_URL`) belongs to the maintainer's `.env`, not the repository.

## Self-Check: PASSED

- Files: `hygiene-reads/165-30.tsv`, `types.ts` containing `'idura-ftn'`, and `claimConfig.ts` containing `'signicat-ftn'` all exist.
- Commits: `ba8cf2e1c`, `328692763`, `ed4eb463a`, `ba23c6b70`, `ea9b52a94`, `de7d75d0b` and `97a784ab7` are all in `git log`.
- `git rev-list --count ae336d45c..97a784ab7` = 7.

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-28*
