---
phase: 182-analytics-relay
plan: 22
subsystem: docs-and-gates
tags: [docs, analytics, sweep, static-gates, pgtap]
status: complete

requires:
  - phase: 182-19
    provides: analytics.trackEvents as a dynamic setting, platform removed
  - phase: 182-06
    provides: the ANALYTICS_ block in .env.example and analyticsStartupProblems in STARTUP_RULES
  - phase: 182-27
    provides: the last code commit of the phase before this plan
provides:
  - Five documentation pages that describe the relay model, not the removed integration
  - evidence/22-sweep.txt (STARTUP_CONTACT=already, SHUTDOWN_FORM=registerShutdownFlush)
  - evidence/22-static-gates.txt (build, lint:check, test:unit, format:check and pgTAP green on e4d535df3)
affects: [182-24, 182-28, 182-29, 189]

actuals:
  tokens: 4500      # chars/4 over the diff outside .planning (17840 chars)
  tasks: 3
  commits: 4        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: d35664de6c919f6dcb95ed7efe8079da45559d1b
plan_head_after: dba9a78de7ea4ef0ab9f6fd825fec02a4638a755

tech-stack:
  added: []
  patterns:
    - "Docs pages under apps/docs are formatted by the docs workspace's own Prettier; the root .prettierignore skips them"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/22-sweep.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/22-static-gates.txt
  modified:
    - apps/docs/src/routes/(content)/developers-guide/configuration/static-settings/+page.md
    - apps/docs/src/routes/(content)/developers-guide/configuration/intro/+page.md
    - apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md
    - apps/docs/src/routes/(content)/about/features/+page.md
    - apps/docs/src/routes/(content)/publishers-guide/preparing/what-data-should-be-collected/+page.md
    - .claude/skills/spike-findings-voting-advice-application-gsd/references/reactive-contexts.md
    - .claude/skills/spike-findings-voting-advice-application-gsd/sources/001-appsettings-native-rune/appSettingsRuneContext.svelte.ts
    - .claude/skills/spike-findings-voting-advice-application-gsd/sources/004-matchstore-integration/runes-test-page.svelte
    - .planning/workstreams/deployment/phases/182-analytics-relay/deferred-items.md

key-decisions:
  - "The start-up contact with phase 181 was already wired by 182-06; nothing was changed in requiredEnv.ts"
  - "shutdown.ts is not tracked, so runtime.ts keeps registerShutdownFlush; the onShutdown change waits for plan 181-14"
  - "The two accurate analytics.platform comments in the shared pgTAP file 38 were left, as was the e2eSpecVerdict fixture needle"

requirements-completed: [RELAY-06, RELAY-14, RELAY-20]

duration: 12min
completed: 2026-10-19
---

# Phase 182 Plan 22: Docs corrections, repository sweep and static gates Summary

**Five docs pages now describe the relay model. The provider is the server variable `ANALYTICS_PROVIDER` (`none`, `log` or `posthog`; `none` when unset), so changing it needs a restart and no rebuild. `analytics.trackEvents` is a dynamic setting and is listed in the keys table. Events go through the application's own endpoint, the browser loads no third-party analytics script, and counts are a lower bound. Consent is asked by default, and whether collecting without asking is allowed is left to the deployer. The repository holds no Umami mention outside `.planning/`. On `e4d535df3`, `yarn build`, `yarn lint:check`, `yarn test:unit` and `yarn format:check` passed, and so did the whole pgTAP directory on p182 (47 files, 2605 tests). The tree was clean before and after.**

Start sha: `d35664de6c919f6dcb95ed7efe8079da45559d1b`.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Correct the five documentation sentences | 9187a409e | the five pages under `apps/docs/src/routes/(content)/` |
| 2 | The repository sweep and the contact with phase 181 | 689667865 (sweep), e4d535df3 (record) | three spike-skill files under `.claude/skills/`, `evidence/22-sweep.txt` |
| 3 | The static gates on the final tree | dba9a78de (record) | `evidence/22-static-gates.txt` |

## What changed in the docs

- **static-settings:** the `analytics` bullet is removed. A paragraph after the list says analytics is not a static setting, names `ANALYTICS_PROVIDER` and its values, links `.env.example`, and points to the dynamic setting `analytics.trackEvents`.
- **intro:** "analytics" is removed from the static-settings layer, and the environment-variables layer now names the analytics provider.
- **app-settings:** the false sentence "`StoredSettingsSchema` also accepts `analytics`, which is a static setting" is replaced. The "No row" paragraph no longer names `analytics.platform`. The keys table gains `analytics.trackEvents` (default `false`), and its `survey.linkTemplate` row now says `{sessionId}` becomes the visit id only when events carry it (D-05). The table cells were kept within the column width, so the table did not realign.
- **about/features:** the Umami bullet is replaced with three points: the own endpoint, the provider set by server configuration, an identifier-free page-view count with optional detailed events, and consent asked by default with the determination left to the deployer.
- **publishers-guide/what-data-should-be-collected:** the Umami paragraph is replaced. The page also corrected "only if they grant this will their data be collected", which became false when the page-view count stopped depending on consent (D-02). It now covers the two switches, the banner by default, the deployer's determination, the own address, the consent choice as the only thing stored on the device, and counts as a lower bound.

## Verification

- Task 1: `git grep -n -i umami -- apps/docs` printed nothing (exit 1). `git grep -q ANALYTICS_PROVIDER` over the configuration pages exited 0. The consent-wording grep printed nothing. The docs workspace's `prettier --check` on the five pages exited 0. The plan's commits touch only the five pages under `apps/docs`.
- Task 2: `git grep -n -i umami -- . ':!.planning' ':!yarn.lock'` printed nothing (exit 1). `git grep -n -F -e appContext-sessionId -e vaaSessionId -e sendTrackingEvent -- apps packages` printed nothing (exit 1). The pointer verify of slot `22-sweep` (attempt `20261019T202642Z.689667865`) exited 0.
- Task 3: attempt `20261019T202748Z.e4d535df3` on `e4d535df3`. Results: `BUILD_EXIT=0` (14/14 tasks), `LINT_CHECK_EXIT=0`, `TEST_UNIT_EXIT=0` (25/25 turbo tasks; frontend 5946 passed and 31 skipped), `FORMAT_CHECK_EXIT=0`, `PGTAP_EXIT=0` (47 files, 2605 tests). The tree was clean before and after, and HEAD did not move. The analytics files ran 21 files and 905 tests with none failed. The pointer verify exited 0. The targeted verify `yarn workspace @openvaa/frontend test:unit src/lib/analytics src/lib/server/analytics src/lib/contexts/app/tracking src/routes/api/usage` passed 22 files and 914 tests, exit 0.
- `git diff e4d535df3 HEAD -- . ':!.planning'` is empty, and the SUMMARY and roadmap commits that follow touch only `.planning/`.
- Containers: no container ending `_openvaa-iso-p182` is left. The set ending `_openvaa-local` is empty both before and after (cmp status 0).

## Deviations from Plan

**1. [Orchestrator instruction] The shared stack was started for the whole unit run.** The plan says no command addresses the shared instance. The orchestrator's standing instruction is that a whole `yarn test:unit` needs the shared stack: the dev-seed integration tests fail with `fetch failed` when it is stopped. The stack was started with `yarn db:start` (no reset) just before `yarn test:unit` and stopped with `yarn db:stop` just after. Its container set is the same before and after the task (empty), so the plan's acceptance holds. The stack was not reset, and no E2E was run.

**2. [Rule 3 - Blocking] The p182 container had lost its harness state directory.** `supabase_db_openvaa-iso-p182` was still running from an earlier plan, but `${TMPDIR}/openvaa-isolated/p182` no longer existed. The harness therefore refused both `stop --name p182` ("no state directory") and `start` ("containers exist with no state directory"). The orphan was removed with `supabase stop --project-id openvaa-iso-p182 --no-backup`, run from a scratch directory. A `docker ps` diff showed that only that one container went. p182 was then started fresh with the harness from the tree's migrations, seed and tests. That is the plan's "harness stop and start" route; `diff -r` showed the instance's copies match the tree. pgTAP ran on it, and it was stopped with `stop --name p182`.

**3. [Plan intent] The docs edits go a little past the five sentences.** The publishers' page said that no data is collected unless the visitor grants consent. Since D-02 that is false, so it was corrected along with the Umami sentence. The app-settings `survey.linkTemplate` row described a session id that no longer exists, and it was corrected as well. Both edits are on pages this plan owns.

**4. [Plan intent] One `appContext-sessionId` match under `tests` is outside the allowlist test.** `tests/tests/utils/e2eSpecVerdict.test.ts` (plan 182-30) uses the key as fixture text for a privacy red control's failure message, so it names the key as a violation, as the allowlist test does. It was reported in the sweep record and in deferred-items, not edited.

**5. [Sweep scope] The spike-findings skill files were corrected.** The sweep's second derive command printed three `.claude/skills/spike-findings-…` files whose rune-context examples read `analytics?.platform`. The examples now read `analytics?.trackEvents`, and the pattern each one shows is unchanged.

## Contacts with phase 181

- Start-up: `STARTUP_CONTACT=already`. `STARTUP_RULES` is `[unsetRequiredEnv, analyticsStartupProblems]` (wired in 182-06, `e314be826`), and `requiredEnv.test.ts` has the case where `posthog` with no key yields `ANALYTICS_POSTHOG_KEY`.
- Shutdown: `SHUTDOWN_FORM=registerShutdownFlush`. `apps/frontend/src/lib/server/startup/shutdown.ts` is not tracked. When plan 181-14 lands `onShutdown(task)`, `runtime.ts` must register the queue's flush through it. This is recorded in deferred-items.

## Notes for 182-24 and 182-28

- The static-gates record describes `e4d535df3`. Every commit after it touches only `.planning/`, so `git diff e4d535df3 HEAD -- . ':!.planning'` is empty. That is the comparison your first task makes.
- p182 is stopped and its state directory removed. If a later plan needs it, start it fresh with the 182-01 command.
- The shared stack `openvaa-local` is stopped, as it was before this plan.

## Known Stubs

None.

## Threat Flags

None. T-182-90: no consent claim in the docs; the grep printed nothing. T-182-91: every status was read from its file. T-182-92: only p182 was stopped, and the shared container set is unchanged. T-182-93: the start-up contact is wired.

## Self-Check: PASSED

- FOUND: evidence/22-sweep.txt and evidence/22-static-gates.txt, each `cmp`-equal to its current attempt file, and both pointer verifies exit 0.
- FOUND: commits 9187a409e, 689667865, e4d535df3 and dba9a78de are ancestors of HEAD.
