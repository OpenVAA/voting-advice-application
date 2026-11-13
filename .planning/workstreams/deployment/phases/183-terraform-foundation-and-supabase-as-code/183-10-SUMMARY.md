---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 10
subsystem: infra
tags: [supabase, terraform, auth, lint-guard, lint-check, vitest, settings-parity]
status: complete

requires:
  - phase: 183-05
    provides: "infra/modules/supabase/{hosted-settings.json, settings.tf, variables.tf}, infra/scripts/check-settings-types.sh, the scratch root"
  - phase: 183-07
    provides: "infra/envs/{staging,example}/supabase roots and their tracked terraform.tfvars"
  - phase: 183-09
    provides: "the lint:check link yarn assert:no-inline-iam-policies and the sibling gate spec shape"
provides:
  - "scripts/assert-hosted-settings-parity.mjs: HOSTED-SETTINGS PARITY GUARD, four classes, max_rows three ways, origin rule, hook-switch rule over two switches; flags --config, --settings, --static-settings, --envs-dir, --self-test; exit 0/1/2; 40 embedded cases"
  - "scripts/fixtures/hosted-settings-parity/hosted-settings.max-rows-49999.json: the hosted JSON with api.max_rows 49999 and nothing else changed"
  - "package.json: script key assert:hosted-settings-parity and the lint:check link yarn assert:hosted-settings-parity (appended last)"
  - "packages/dev-seed/tests/hostedSettingsParityGate.test.ts: 9 tests on wiring and teeth"
  - "infra/modules/supabase: JSON group auth_send_email_hook and module variable enable_send_email_hook (default true), sent outside the access-token hook filter; hosted password_min_length 8"
  - "infra/envs/{example,scratch,staging}/supabase: variable enable_send_email_hook, passed to the module, assigned true in each terraform.tfvars"
  - "infra/scripts/check-settings-types.sh: four cases (new: send-email-hook-off), the new group encoded and typed"
affects: [183-13, 183-21, 183-23, 183-24, 183-25, 183-26, 184]

estimate:
  tokens: 68000
  tasks: 2
actuals:
  tokens: 18655    # chars/4 over the added lines of this plan's four commits (74620 chars)
  tasks: 2
  commits: 8       # MEASURED: git rev-list --count plan_head_before..plan_head_after; 4 are this plan's, 4 are plan 183-11's made in between on the shared tree

plan_head_before: 4ad596d1b85ba93f0ea339b63db05169b7418485
plan_head_after: 6135893780e0386cf394184dc833739975669d70

tech-stack:
  added: []
  patterns:
    - "Hook switches as a list (HOOK_SWITCHES): each switch is held to the same rule (default true, false only with a '# hook off until <reason>' comment) and gets its own census line"
    - "Gate spec asserts the fixture differs from the real JSON in exactly one leaf, so the fixture cannot drift into testing nothing"

key-files:
  created:
    - scripts/assert-hosted-settings-parity.mjs
    - scripts/fixtures/hosted-settings-parity/hosted-settings.max-rows-49999.json
    - packages/dev-seed/tests/hostedSettingsParityGate.test.ts
  modified:
    - package.json
    - infra/modules/supabase/hosted-settings.json
    - infra/modules/supabase/settings.tf
    - infra/modules/supabase/variables.tf
    - infra/scripts/check-settings-types.sh
    - infra/envs/example/supabase/main.tf
    - infra/envs/example/supabase/variables.tf
    - infra/envs/example/supabase/terraform.tfvars
    - infra/envs/scratch/supabase/main.tf
    - infra/envs/scratch/supabase/variables.tf
    - infra/envs/scratch/supabase/terraform.tfvars
    - infra/envs/staging/supabase/main.tf
    - infra/envs/staging/supabase/variables.tf
    - infra/envs/staging/supabase/terraform.tfvars

key-decisions:
  - "Operator ruling 1A: the hosted minimum password length is 8, equal to the local config.toml (was 6, from research that read an older config.toml)"
  - "Operator ruling 2A: the send-email hook is a must-agree key; hosted sends hook_send_email_enabled true and hook_send_email_uri pg-functions://postgres/public/send_email_hook (verified against config.toml), under its own switch enable_send_email_hook, outside the access-token hook filter"
  - "The send-email hook got a switch of its own (not an unconditional group) for the same reason the access-token hook has one: the hook can only be turned on once the database function exists on the project; the guard's hook-switch rule now covers both switches"
  - "The three OAuth-server keys stay 'not compared' until the throwaway project shows whether the hosted API accepts them"

requirements-completed: []  # SUPA-11 stays open until the hosted settings are imported and applied and the chain runs on the final tree (183-21 to 183-27)

duration: ~10h wall-clock including the operator decision; ~25 min of execution in this continuation
completed: 2026-10-19
---

# Phase 183 Plan 10: Hosted-settings parity guard Summary

**A Node-built-ins guard that puts every live key of `[api]`, `[api.tls]`, `[auth]` and `[auth.*]` in one of four classes, compares `config.toml` with the hosted JSON (and `max_rows` with `pageSize` too), won't pass when it finds no origin, holds both hook switches to a reasoned-comment rule, and runs as a link of `yarn lint:check`. Two hosted-settings gaps it found on its first run were fixed by operator ruling: password length 8, and the send-email hook sent to hosted projects.**

## Performance

- **Started:** 2026-10-18T21:06:05Z (Task 1); continued 2026-10-19 after the operator ruling
- **Completed:** 2026-10-19T05:55Z
- **Tasks:** 2/2, plus the authorised deviation
- **Files:** 3 created, 14 modified

## Accomplishments

- **Census on the final tree** (`yarn assert:hosted-settings-parity`, exit 0): `66 live key(s) of [api], [api.tls], [auth] and [auth.*]: must agree 24, hosted may be stricter 5, differs by design 2, not compared 35; 3 origin(s) checked across 3 Supabase root(s); access-token hook not applied in: none; send-email hook not applied in: none.` 24 + 5 + 2 + 35 = 66. `max_rows compared three ways: config.toml 50000.`
- `--self-test`: 40 cases, all pass (Task 1 had 34; the deviation added 6 send-email cases and moved the "unclassified table" case to `[auth.hook.mfa_verification_attempt]`, because `[auth.hook.send_email]` is classified now).
- The three `auth.oauth_server` keys are classed **not compared** until the throwaway project shows whether the hosted API accepts them.
- Acceptance probes: `--bogus` exit 2; `--settings /nonexistent.json` exit 1 with the verdict withheld; `--settings <fixture>` exit 1 naming `api/max_rows`; an empty `--envs-dir` exit 1 (`auth/site_url`, no origin).
- Gate spec `packages/dev-seed/tests/hostedSettingsParityGate.test.ts`: 9/9 pass.
- `yarn assert:hosted-settings-parity && yarn assert:no-inline-iam-policies`: exit 0.
- **Full `yarn lint:check`** on a clean tree (only the orchestrator's untracked `.planning/workstreams/deployment/{config,state}.json` present), private `TURBO_CACHE_DIR`, exit read straight from the command and not through a pipe: **0**. The new link runs last and prints the census above.

## Task Commits

1. **Task 1: reading, classification, comparisons, embedded cases**: `b3dbeacd8` (feat), from the previous executor
2. **Deviation 1A: hosted password length 8**: `be843c6dc` (fix)
3. **Deviation 2A: send-email hook sent and compared**: `efd31c24f` (feat)
4. **Task 2: lint:check link, fixture, gate spec**: `613589378` (feat)

Plan 183-11's commits (`ac5a5c4bb`, `8b948a948`, `f5e5ba328`, `5282a1bf3`) sit between Task 1 and the deviation commits. They belong to that plan, not this one.

## Deviations from Plan

### Authorised deviation (operator ruling, recorded as given)

The previous executor stopped at a Rule-4 checkpoint because the guard exited 1 on the real tree with three findings: `auth.hook.send_email/enabled` and `/uri` were live keys in no class, and the hosted `password_min_length` of 6 was weaker than the local 8. The cause: the phase research had read an older `config.toml`, from before `1803d5abe` raised the length to 8 and `fbcb80685` added the no-op send-email hook. Plan 183-05 then wrote 6 and left the hook out. **The operator ruled 1A and 2A and authorised edits, inside 183-10, to files the plan otherwise forbids.**

**1. [Operator 1A] Hosted minimum password length raised to 8**
- **Files:** `infra/modules/supabase/hosted-settings.json`
- **Verification:** `bash infra/scripts/check-settings-types.sh` exit 0; the guard's password finding cleared.
- **Commit:** `be843c6dc`

**2. [Operator 2A, must agree] Send-email hook sent to hosted projects and compared**
- **Hosted JSON:** a new group `auth_send_email_hook` with `hook_send_email_enabled: true` and `hook_send_email_uri: "pg-functions://postgres/public/send_email_hook"`. The URI was checked against `apps/supabase/supabase/config.toml` (`[auth.hook.send_email]`) and against the function `public.send_email_hook` in the initial migration.
- **Module:** `settings.tf` sends the group through `local.auth_send_email_hook`, filtered by a new switch `var.enable_send_email_hook` (in `variables.tf`, bool, default true, nullable false) and merged on its own, outside the `enable_access_token_hook` filter. The three Supabase roots declare the variable, pass it to the module and assign `enable_send_email_hook = true` in their tracked `terraform.tfvars`.
- **Type check:** `check-settings-types.sh` now runs four cases. Defaults: the new group is encoded with the JSON's values, and `hook_send_email_enabled` is a bare boolean. Hook off: the access-token keys are absent and the send-email keys present. New case send-email-hook-off: the send-email keys are absent and the access-token keys present. Two red controls on scratch copies exited 1: with the group dropped from the `merge` (5 findings), and with the group put under the access-token filter (4 findings).
- **Guard:** two must-agree rows (`auth.hook.send_email/enabled`, `/uri` ↔ `auth_send_email_hook.*`). The hook-switch rule is now a list, `HOOK_SWITCHES`, so both switches are held to the same rule: default `true`, and `false` only with `# hook off until <reason>`. Each switch gets its own census line. Six self-test cases were added: hosted hook off, hosted URI wrong, root switch off without the comment, root switch off with the comment (named in the census), module default false, module variable missing.
- **Re-validation:** `terraform init -backend=false -lockfile=readonly` and `validate` in each of `infra/envs/{example,scratch,staging}/supabase` ("Success! The configuration is valid." ×3; lock files unchanged); `terraform fmt -check -recursive infra` exit 0; `check-settings-types.sh` exit 0; guard `--self-test` exit 0 (40 cases); Prettier and comment hygiene clean.
- **Commit:** `efd31c24f`

### Auto-fixed Issues

None.

## Hand-on for phase 184 and the throwaway-project checks (183-21..25), not resolved here

- **While the send-email hook is on, the hosted auth service sends no mail of its own.** The hook's function takes every mail and sends none, and the application's own function sends the mails. On hosted, the module's SMTP settings (`smtp_*`, `smtp_pass`) and `rate_limit_email_sent` therefore govern no mail the auth service sends. The module still sends them while `var.smtp` is set. This is noted in the comments of `settings.tf` and `variables.tf` and in the guard's docblock. Phase 184 and the throwaway-project checks must decide whether the hosted SMTP settings and the mail rate limit are still needed, and what they are for.
- **The project must have the function before the hook is turned on.** If an apply runs before the migrations are on the project, the hosted API may refuse a hook whose function does not exist. In that case set `enable_send_email_hook = false # hook off until <reason>` in that root, which the guard accepts and names in its census.
- **Plans written before this ruling list the hosted JSON groups as `api`, `auth`, `auth_hook` and `redirect_callback_paths`:** 183-21 (key names), 183-24 (the read-back of managed keys and the hook-only-if-applied rule), and 183-26 (it reads `local.hosted.*` per group, and its known-keys list). Each must also cover `auth_send_email_hook`, its two keys and the `enable_send_email_hook` switch. 183-23 lists the variables the staging `terraform.tfvars` assigns, and that file now also assigns `enable_send_email_hook`. 183-26's hook-switch red runs (step 9) can run on either switch.

## Threat Flags

None. No new endpoint, auth path or trust boundary. The send-email hook setting already exists locally; sending it to hosted projects closes a local/hosted gap (T-183-21).

## Next Phase Readiness

- The guard is a blocking link of `lint:check`. Plan 183-13 can see it fail through the chain, and plan 183-26 can add its structural assertions to the same findings loop.
- SUPA-11 remains open (see `requirements-completed`).

## Self-Check: PASSED

- FOUND: scripts/assert-hosted-settings-parity.mjs, scripts/fixtures/hosted-settings-parity/hosted-settings.max-rows-49999.json, packages/dev-seed/tests/hostedSettingsParityGate.test.ts
- FOUND commits on HEAD: b3dbeacd8, be843c6dc, efd31c24f, 613589378
