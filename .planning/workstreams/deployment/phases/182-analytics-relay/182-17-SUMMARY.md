---
phase: 182-analytics-relay
plan: 17
subsystem: frontend-consent
tags: [analytics, consent, privacy, gpc, i18n, svelte, voter-app]
status: complete

requires:
  - phase: 182-13
    provides: relayUsable, shouldShowVoterPrompt (gates.ts)
  - phase: 182-15
    provides: AppContext.analyticsGate (ReactiveHandle<GateInput>)
  - phase: 182-26
    provides: analyticsGate declared on the voter, contestant and admin contexts
  - phase: 182-12
    provides: the provider-neutral keys privacy.analytics.content.gated / .free, .pageviews, .gpc, privacy.dataCollection.info
provides:
  - the voter consent popup decided by shouldShowVoterPrompt over ctx.analyticsGate.current
  - the voter privacy page's analytics section keyed by projection.active and consentMode, the consent control only when there is a choice to make
  - DataConsent and DataConsentInfoButton with the neutral note privacy.dataCollection.info and no provider reads
  - privacy.analytics.content.umami and privacy.dataCollection.platform removed from all seven catalogues; analyticsLink removed from TranslationsPayload and from the translation test; translationKey.ts regenerated
affects: [182-18, 182-19, 182-22, 182-23, 182-29]

estimate:
  tokens: 85000
  tasks: 3
actuals:
  tokens: 9950      # chars/4 over the three code commits' diff (39788 chars)
  tasks: 3
  commits: 3        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: 7ffbd710a9f5bbf703da85597509ca779ebfb4a6
plan_head_after: 551c2c677b4971edc3993fcbe5a20ea574d1e14b

tech-stack:
  added: []
  patterns:
    - "A page reads the gate input once as `const gate = $derived(ctx.analyticsGate.current)` and evaluates the pure gate functions on it, never a destructured copy"
    - "Catalogue members deleted by a parse / delete / stringify script that refuses to run unless the member exists and `platform` holds only `umami`, then prettier"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/17-gates.txt
  modified:
    - apps/frontend/src/routes/(voters)/+layout.svelte
    - apps/frontend/src/routes/(voters)/privacy/+page.svelte
    - apps/frontend/src/routes/(voters)/(located)/+layout.svelte
    - apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte
    - apps/frontend/src/lib/dynamic-components/dataConsent/DataConsentInfoButton.svelte
    - apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/privacy.json
    - apps/frontend/src/lib/i18n/types.ts
    - apps/frontend/src/lib/i18n/tests/translations.test.ts
    - apps/frontend/src/lib/types/generated/translationKey.ts

key-decisions:
  - "The voter popup keeps the layout's existing `if (!appSettings.access.voterApp) return;` guard and passes `voterAppAccessible: appSettings.access.voterApp` to shouldShowVoterPrompt, the same expression the layout already uses; the consent comes from the gate input (the same userPreferences value the old condition read)"
  - "The privacy page's consent control and its heading are shown together under `trackEvents && consentMode === 'gated' && relayUsable(gate)`; the analytics section under `projection.active`"
  - "The new texts are rendered as plain text (`{t(...)}`), not through `{@html sanitizeHtml(...)}`: all seven catalogues hold them without markup, and the old link HTML is gone"
  - "DataConsentInfoButton always shows the two notes; its old branch that logged 'No analytics platform configured!' is gone with the platform"

requirements-completed: [RELAY-11, RELAY-13, RELAY-14]

duration: 12min
completed: 2026-10-19
---

# Phase 182 Plan 17: Voter consent surfaces on the gate, provider-keyed strings deleted Summary

**The voter app's consent popup is decided by `shouldShowVoterPrompt` over `ctx.analyticsGate.current`; the privacy page describes analytics by consent mode with the page-view and Global Privacy Control sentences and offers the consent control only when there is a choice; the two consent components show the neutral `privacy.dataCollection.info`; and the two Umami-keyed texts and the `analyticsLink` parameter are gone from seven catalogues, the i18n type, the translation test and the regenerated key type.**

Start sha: `7ffbd710a9f5bbf703da85597509ca779ebfb4a6`.

## Performance

- Duration: about 12 min
- Tasks: 3 of 3
- Files modified: 15 (+1 evidence file)

## Accomplishments

- **Voter layout** (`(voters)/+layout.svelte`). The `onMount` block that queues the popup now reads `if (shouldShowVoterPrompt({ ...ctx.analyticsGate.current, voterAppAccessible: appSettings.access.voterApp })) popupQueue.push({ component: DataConsentPopup });`. The early return on `access.voterApp`, the notification popup and the mount-once rule are unchanged. `userPreferences` is no longer destructured, because nothing else in the file read it. The header's Settings line for `analytics.trackEvents` says it acts through `shouldShowVoterPrompt` with the projection, the Global Privacy Control signal and the stored choice.
- **Voter privacy page.** The info-link construction, the `staticSettings` and `assertTranslationKey` imports and the provider-keyed lookup are gone. `gate = $derived(ctx.analyticsGate.current)`. The analytics section shows when `gate.projection.active`. It holds `privacy.analytics.content.gated` or `.free`, by `consentMode`, then `privacy.analytics.pageviews` and `privacy.analytics.gpc`. The data-collection heading and `<DataConsent description="inline" class="bg-base-300 p-lg rounded-lg" />` show when `trackEvents`, the consent mode is `gated` and `relayUsable(gate)`. The header lists what is read.
- **`DataConsent.svelte`.** The inline description is `common.privacy.dataCollection.content` plus `t('privacy.dataCollection.info')`, shown for `description === 'inline'` with no platform condition. The dynamic consent-status line (`privacy.dataConsentIntro.${consent}`) and both buttons are unchanged, so the granted button is still named "Yes, I agree to share my data". The `staticSettings` import and the `appSettings` alias are removed.
- **`DataConsentInfoButton.svelte`.** The modal shows the same two notes. The `log`, `staticSettings` and `assertTranslationKey` imports and the `appSettings` alias are removed. The doc block says what it reads.
- **`(voters)/(located)/+layout.svelte`.** The two header lines naming `analytics.platform` and `analytics.trackEvents` are deleted. The layout reads neither setting, so there was nothing to rename them to.
- **Catalogues.** `privacy.analytics.content.umami` and the whole `privacy.dataCollection.platform` member were deleted in en, fi, sv and da (Task 2), then in et, fr and lb (Task 3). The locale list came from `project.inlang/settings.json` `locales`. All seven have the same key paths, contain no `umami` or `analyticsLink`, and keep the eight keys of 182-12.
- **i18n code.** `analyticsLink: string` was removed from `TranslationsPayload`. The test "analyticsLink preserved in privacy.json as simple variable" was deleted with no replacement. `translationKey.ts` was regenerated by `yarn workspace @openvaa/frontend generate:translation-key-type`, which dropped exactly the two keys.

## Translations: not read by a speaker

This plan only deleted texts in the six non-English catalogues. The provider-neutral translations it now renders, written in 182-12, have still not been read by a native speaker:

- fi: unreviewed by a speaker
- sv: unreviewed by a speaker
- da: unreviewed by a speaker
- et: unreviewed by a speaker
- fr: unreviewed by a speaker
- lb: unreviewed by a speaker

## Task Commits

1. **Task 1: the prompt condition, the privacy page and the two consent components:** `860642dd4` (feat)
2. **Task 2: the keys in en, fi, sv and da, and the link parameter type:** `24a5951b7` (refactor)
3. **Task 3: the keys in et, fr and lb, the translation test and the regenerated key type:** `551c2c677` (refactor)

## Verification

- Task 1, second verify (layout calls the gate, page has the page-view sentence, `DataConsent` uses the neutral note): exit 0. The acceptance criteria hold: the layout contains `shouldShowVoterPrompt`, `analyticsGate` and `popupQueue.push({ component: DataConsentPopup });`; the page contains all four analytics keys; both components contain `privacy.dataCollection.info`; no edited file destructures `appSettings` or `analyticsGate`.
- Task 1, first verify (`git grep -F` for the platform reads in `apps/frontend/src`, then `test $? -eq 1`): **exit 1.** It prints one line, a doc comment in `supabaseDataProvider.ts`, which is plan 182-19's file. See Deviations.
- Task 2 verify (the node check over en, fi, sv, da): exit 0.
- Task 3 verifies:
  - `git grep -i` for `umami` and `analyticsLink` over the catalogues, the i18n code, `lib/types`, `dynamic-components` and the routes, then `test $? -eq 1`: exit 0.
  - `yarn assert:i18n-catalog-namespaces`: exit 0 (744 keys, 0 violations; 746 before the two deletions).
  - The gate-record check over slot `17-gates`: exit 0.
- Scoped checks before committing: `prettier --check` and `eslint` on the five Task 1 files, exit 0. `test:unit src/lib/i18n`: 3 files, 431 tests passed. That is one fewer than 182-12's 432, which is the deleted test.
- **Closing gates**, attempt `20261019T180740Z.551c2c677`, tracked copy in `evidence/17-gates.txt`. `GATE_HEAD` and `GATE_HEAD_AFTER` are both `551c2c677b4971edc3993fcbe5a20ea574d1e14b`, and the tree was clean before and after.

  | Gate | Command | Exit | Result |
  |------|---------|------|--------|
  | `TYPECHECK_EXIT` | `yarn workspace @openvaa/frontend typecheck` | 0 | 3055 files, 0 errors, 0 warnings |
  | `UNIT_EXIT` | `yarn workspace @openvaa/frontend test:unit` | 0 | 254 files passed, 1 skipped; 5921 tests passed, 31 skipped |
  | `LINT_EXIT` | `yarn workspace @openvaa/frontend lint` | 0 | |
  | `BUILD_EXIT` | `yarn build` | 0 | 14/14 turbo tasks, 0 cached, private `TURBO_CACHE_DIR=tmp/turbo-182-17` |
- Commit scope: `git log -F --grep='(182-17):'` lists the three task commits. Under `apps/frontend/messages`, `git show --stat` names only the seven `privacy.json` files.

## Deviations from Plan

**1. [Stale verify] Task 1's first verify fails on a comment in a file of plan 182-19.**
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` has a doc comment in `_getAppSettings`, in the paragraph that starts "Limitation: nothing else that is stored is honoured". It names `analytics.platform` among the stored settings a closed project does not honour.
- The comment is not a read. So the truth this verify stands for holds: no frontend source file reads `analytics.platform` or a platform info URL.
- The file is in 182-19's `files_modified`, and 182-19 removes the setting. The rule against committing a file this plan does not own applies, so the comment was left alone. It is recorded in `deferred-items.md`, addressed to 182-19.

**2. [Plan intent] The `(located)` header lines were deleted, not reworded.** The plan says to "correct the two doc-comment lines so they name what is read now". The layout reads no analytics setting, so the true correction is to remove them. Its two `header.*` lines are also stale, because the layout reads no header setting either. They are outside the plan's two lines and were left.

**3. [Plan intent] No `DataConsent` component test exists, so no case was added.** The derive command (`git grep -l -E "DataConsent|privacy/\+page" -- 'apps/frontend/src/**/*.test.ts'`) lists:
- `appContext.spread.svelte.test.ts`, which matches on `setDataConsent`;
- `routes/contestant/homeButton.svelte.test.ts`, which tests the contestant privacy page.

Neither covers these components or the voter privacy page, and neither needed a change. The plan asks for the new case only "where a component test exists for `DataConsent`". The behaviour is covered by the E2E specs of 182-16, which 182-23 runs.

Otherwise, the plan was executed as written.

## Notes for later plans

- **182-23 (E2E):**
  - The popup now opens only when all of these hold:
    - `projection.active`;
    - no Global Privacy Control;
    - `trackEvents`;
    - consent mode `gated`;
    - `access.voterApp`;
    - consent absent or `'indetermined'`.
  - The popup is queued once in `onMount`, so it reads the gate input as it is at the first mount of the voter layout. A dev server with provider `none` therefore never shows the popup, even with `trackEvents` on, which differs from the old `platform && trackEvents` rule. The specs' `grantConsentViaPopup` needs `ANALYTICS_PROVIDER=log` (or another active provider) with consent mode `gated`.
  - The granted button's name is unchanged ("Yes, I agree to share my data").
  - On the privacy page, the data-collection heading and `DataConsent` are absent in consent-free mode and under Global Privacy Control. The analytics heading and its three paragraphs are present whenever the projection is active.
- **182-19:**
  - No frontend source reads `analytics.platform`, so the setting can be removed from `staticSettings.type.ts` and the schema without a compile error in these files.
  - The one remaining textual mention is the `supabaseDataProvider.ts` comment above, in 182-19's own file.
  - `git grep -n -i umami -- apps/frontend/messages apps/frontend/src/lib/types` now prints nothing.
- **182-18:** `DataConsent` no longer reads `appSettings` at all. A contestant surface that renders it gets no provider condition from it, and must decide visibility itself (for example with `shouldShowContestantOptOut`).
- **182-29:** the six locale lines above stay open.
- In gated mode with `trackEvents` off, the privacy page still shows the gated text ("collected only if you agree to it…") with no consent control. That is what the plan asked for: the text is chosen by consent mode alone. A later plan may want a third variant for "no events sent". This was not changed here.

## Known Stubs

None.

## Threat Flags

None. The plan adds no endpoint, storage or trust-boundary surface. T-182-69 is mitigated: the text comes from the same projection the producer sends under. T-182-70 is mitigated: one gate function decides. T-182-71 is mitigated: the build gate is green, and so is the seven-locale guard.

## Self-Check: PASSED

- FOUND: the five Task 1 files, the seven `privacy.json`, `lib/i18n/types.ts`, `lib/i18n/tests/translations.test.ts`, `lib/types/generated/translationKey.ts`, `evidence/17-gates.txt`
- FOUND: `860642dd4`, `24a5951b7`, `551c2c677` are ancestors of HEAD
