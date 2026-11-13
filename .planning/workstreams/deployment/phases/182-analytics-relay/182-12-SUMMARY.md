---
phase: 182-analytics-relay
plan: 12
subsystem: frontend-i18n
tags: [analytics, privacy, i18n, paraglide, consent, gpc, terms-of-use]
status: complete

requires:
  - phase: 182-03
    provides: the analytics foundation (modes, app names); this plan reads none of it, only follows its vocabulary
provides:
  - "privacy.analytics.content.gated / .free, privacy.analytics.pageviews, privacy.analytics.gpc, privacy.dataCollection.info, privacy.usageData.title / .content, privacy.trackingOptOut.label in all seven catalogues"
  - "privacy.cookies.content corrected in all seven catalogues"
  - "apps/frontend/src/lib/types/generated/translationKey.ts regenerated with the eight keys"
affects: [182-17 (moves readers off the provider-keyed keys and deletes them), 182-18 (renders usageData and the opt-out label), 182-29 (closing record lists each locale as unreviewed)]

actuals:
  tokens: 7600      # chars/4 over the two code commits' diff (30479 chars)
  tasks: 2
  commits: 2        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the docs commits follow
plan_head_before: 336c1957c0cb9c7614de5727fd09f3c48292daa9
plan_head_after: e6ca031e792d1c219a406258f8d3fcfc45df45f3

tech-stack:
  added: []
  patterns:
    - "New catalogue keys inserted by a script that sets dotted paths and re-sorts object keys alphabetically (variant arrays untouched), then prettier"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/12-gates.txt
  modified:
    - apps/frontend/messages/en/privacy.json
    - apps/frontend/messages/fi/privacy.json
    - apps/frontend/messages/sv/privacy.json
    - apps/frontend/messages/da/privacy.json
    - apps/frontend/messages/et/privacy.json
    - apps/frontend/messages/fr/privacy.json
    - apps/frontend/messages/lb/privacy.json
    - apps/frontend/src/lib/types/generated/translationKey.ts

key-decisions:
  - "The three apps are named as the catalogues show them: the voter app, the candidate and party app (dynamic.contestantAppName.candidateAndOrganization, because the static paragraph cannot vary by contestant type) and the admin app (adminApp.common wording); each locale uses its own catalogue's names"
  - "The gated text says the events of one visit are joined 'at most' by a memory-only identifier, so it stays true under visit-id mode none"
  - "The corrected cookies sentence says answers are sent 'when usage data is collected', not 'when you allow it', so it stays true in consent-free mode"
  - "The usage-data paragraph says page views are counted without an identifier 'as described on the privacy page' rather than 'in any case', because a Global Privacy Control browser sends nothing"
  - "All new strings are plain text with no placeholder, so the renderers of plans 182-17 and 182-18 pass no input"

requirements-completed: [RELAY-13, RELAY-19]

duration: 15min
completed: 2026-10-19
---

# Phase 182 Plan 12: Provider-neutral privacy and terms-of-use strings Summary

**Eight new provider-neutral keys (one analytics text per consent mode, the identifier-free page-view count, the Global Privacy Control rule, the consent-control note, the terms-of-use paragraph naming the three apps, and the opt-out label) and a corrected `privacy.cookies.content` are in all seven catalogues; the key type is regenerated. Nothing was removed.**

Start sha: `336c1957c0cb9c7614de5727fd09f3c48292daa9`.

## Performance

- Duration: about 15 min
- Tasks: 2 of 2
- Files modified: 8 (+1 evidence file)

## The eight keys and the corrected text (English source)

| Key | English text |
|-----|--------------|
| `privacy.analytics.content.gated` | Usage data is collected only if you agree to it. It includes your answers to the questions, the time spent in the application and the results you view. At most, the events of one visit are joined by an identifier that is kept only in the page’s memory and is gone when the page is reloaded or closed. The data is sent through this site’s own server, which passes on neither your network address nor your browser’s identification. Nothing about this is stored on your device except your choice. A choice made in this browser applies to every part of the application opened in it, and you can change it on the privacy page. |
| `privacy.analytics.content.free` | This application collects usage data without asking you. It includes your answers to the questions, the time spent in the application and the results you view. Each event that reveals an answer or a preference is sent on its own, with no identifier shared with any other event, so your answers cannot be joined to each other or to the pages you view. The data is sent through this site’s own server, which passes on neither your network address nor your browser’s identification. Nothing about this is stored on your device. |
| `privacy.analytics.pageviews` | Whatever you choose, the application counts page views: which kind of page was opened, in which language and for how long. The count has no identifier. |
| `privacy.analytics.gpc` | If your browser sends the Global Privacy Control signal, nothing is collected, not even the page-view count, and you are not asked. Nothing is stored to remember the signal. |
| `privacy.dataCollection.info` | Usage data is sent through this site’s own server to the analytics service the publisher uses. No cookies are used for it. |
| `privacy.usageData.title` | Usage data |
| `privacy.usageData.content` | Use of the application is measured in the same way in the voter app, the candidate and party app and the admin app. By accepting the terms of use, you allow usage data about your use of the candidate and party app to be collected, unless you tick the box below the terms. Page views are counted without an identifier, as described on the privacy page. Your choice applies to every part of the application opened in this browser, and you can change it later on the privacy page. |
| `privacy.trackingOptOut.label` | Do not collect usage data about my use of the application |
| `privacy.cookies.content` (corrected) | The application does not use cookies to store your data. Your answers and preferences are stored in your browser’s local storage for a better user experience, and this stored copy stays on your device. When usage data is collected, your answers are also sent as part of it, as described under Analytics. |

Kept unchanged: `common.privacy.dataCollection.content` and `dynamic.privacy.dataConsentIntro.popup` (D-04, "the data cannot be connected to you"); `privacy.analytics.content.umami` and `privacy.dataCollection.platform.umami` stay for plan 182-17.

## Translations: not read by a speaker

The six translations (fi, sv, da, et, fr, lb) were written by the executor and have not been read by a speaker of each language. The wording check for a claim about consent (`/not (required|needed|necessary)/i`) runs on the English text only, so the six other locales are not machine-checked for it. Plan 182-29 carries these lines into the closing record, one per locale, until a locale has been read:

- fi: unreviewed by a speaker
- sv: unreviewed by a speaker
- da: unreviewed by a speaker
- et: unreviewed by a speaker
- fr: unreviewed by a speaker
- lb: unreviewed by a speaker

## Task Commits

1. **Task 1: en, fi, sv, da** - `8f7eaeb56` (feat)
2. **Task 2: et, fr, lb and the regenerated key type** - `e6ca031e7` (feat)

## Gates

All exit 0; see `evidence/12-gates.txt`. `yarn assert:i18n-catalog-namespaces` (746 keys, 0 violations); seven-locale key parity; `prettier --check` on the eight files; `test:unit src/lib/i18n` (3 files, 432 tests, including "analyticsLink preserved in privacy.json as simple variable"); `paraglide:compile`; the commit-scope check (2 commits, 7 `privacy.json`, no other catalogue path). No whole-workspace gate, per the plan.

## Decisions Made

See `key-decisions` in the frontmatter. In short: app names come from the catalogues; three sentences are phrased to stay true in every mode (visit-id `none`, consent-free, Global Privacy Control) rather than only in the default one.

## Deviations from Plan

### Wording adjusted to stay true across modes (within the plan's intent, Claude's discretion on wording)

1. **gated text:** the plan's "the events of one visit are joined by an identifier" would be false under visit-id mode `none` (D-07); written as "At most, … are joined by an identifier".
2. **cookies text:** the plan's "when the visitor allows usage data to be collected" would omit consent-free mode, where answers are sent without a grant; written as "When usage data is collected".
3. **usageData paragraph:** added one sentence that page views are counted without an identifier, so the opt-out is not read as stopping the count; phrased "as described on the privacy page" because a Global Privacy Control browser sends nothing. Also added that the choice applies to the whole application in this browser (D-12 reading 4, origin-wide store).
4. **App names:** the plan said "the voter application, the Contestant application and the Admin application … with the names the catalogues already use". The catalogues have no static voter-app name and name the Contestant app per contestant type (`dynamic.contestantAppName.*`); the static paragraph uses the combined name ("candidate and party app") and the admin wording of `adminApp.common`, in each locale.

None changed scope, files or keys.

## Issues Encountered

None.

## Notes for later plans

- 182-17: removing `privacy.analytics.content.umami` and `privacy.dataCollection.platform.umami` breaks the test "analyticsLink preserved in privacy.json as simple variable" and leaves `analyticsLink` in `lib/i18n/types.ts` (RESEARCH section 12). The English and Swedish umami texts also lack "not"; they go with the keys.
- 182-18: `privacy.usageData.*` and `privacy.trackingOptOut.label` are plain strings with no input. The label reads as "do not collect" (A-03: ticked means opt out).
- `translationKey.ts` is also regenerated by v2.16 plans 178-08 and 178-23; regenerate at merge, never hand-merge.
- The first sentence of `privacy.cookies.content` ("does not use cookies to store your data") was kept as the plan asked; RESEARCH notes the app sets a locale cookie and contestant session cookies, which is outside this phase.

## Self-Check: PASSED

- FOUND: all seven `apps/frontend/messages/*/privacy.json`, `apps/frontend/src/lib/types/generated/translationKey.ts`, `evidence/12-gates.txt`
- FOUND: `8f7eaeb56`, `e6ca031e7` are ancestors of HEAD
