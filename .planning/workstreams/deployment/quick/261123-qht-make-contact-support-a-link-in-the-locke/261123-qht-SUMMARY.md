---
phase: quick-261123-qht
plan: 01
quick_id: 261123-qht
subsystem: frontend / contestant app profile
tags: [i18n, contact-support, a11y, profile]
status: complete
requires: []
provides:
  - "The profile page's locked-name sentence links to the support email (candidate and organization, seven locales)"
affects:
  - apps/frontend profile route
  - contestant-a11y-scan cand-profile reach
tech-stack:
  added: []
  patterns:
    - "ContactSupport sentence mode with action=\"email\" for a sentence holding {contactSupportLink}"
key-files:
  created: []
  modified:
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/dynamic.json
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/page.svelte.test.ts
    - tests/tests/specs/a11y/contestant-a11y.spec.ts
decisions:
  - "The locked-name sentence is rendered through ContactSupport's existing sentence mode with action=\"email\"; no new component, helper or {@html} on the page"
metrics:
  duration: "about 21 min"
  completed: 2026-11-23
actuals:
  tokens: 5536
  tasks: 2
  commits: 1
plan_head_before: 46554181e467aafe5b5a2928356b3c616f80c418
plan_head_after: 86022676a2d0f8ce915758b612141051c5704fad
---

# Quick 261123-qht: Make "contact support" a link in the locked-name sentence Summary

On the profile page, the words "contact support" in the locked-name sentence (candidate and organization, all seven locales) are now a `mailto:` link to `appSettings.admin.email` with the `contestantApp.help.supportEmailSubject` subject. The page renders that sentence through `ContactSupport`'s existing sentence mode with `action="email"`, and each catalogue's two locked sentences now hold the `{contactSupportLink}` placeholder.

## Commits

| Task | Commit | Files |
| ---- | ------ | ----- |
| 1 | `86022676a` feat: link to support from the locked-name sentence | the seven `dynamic.json`, PROFILE/+page.svelte, PROFILE/page.svelte.test.ts, contestant-a11y.spec.ts |
| 2 | none (every gate green, nothing amended) | — |

Base commit: `46554181e467aafe5b5a2928356b3c616f80c418` (recorded in `261123-qht-BASE`). Code commit: `86022676a2d0f8ce915758b612141051c5704fad`.

## What changed

- **Catalogues:** only `dynamic.contestantAppBasicInfo.identity.name.locked.{candidate,organization}` changed, in da, en, et, fi, fr, lb and sv. The second sentence of each now ends `, {contactSupportLink}.` (en: ` please {contactSupportLink}.`). en, fi and sv render exactly as before. da, et, fr and lb now use their locale's link words (`kontakt support`, `võta ühendust toega`, `contactez l’assistance`, `kontaktéiert de Support`). Message gate: 14/14 placeholders, and the en/fi/sv rendered text is unchanged.
- **Page:** `nameSentence` is now `{ member, key: TranslationKey } | undefined`. For `locked` the page renders `<ContactSupport sentence={key} action="email" id={NAME_NOTE_ID} class="mx-md text-start" data-testid="contestant-profile-name-note" />`. For `editable` it keeps the plain `<p class="mx-md">`. Both `aria-describedby` props still point at `profile-name-note`. No context accessor is destructured, and the top docblock's identity bullet now mentions the link.
- **Component test:** a `SUPPORT_EMAIL` constant and a `SENTENCES` table, plus `admin.email` and a placeholder-filling `t` in the fake context. A helper `expectLockedSentence` pins five things: the `P` tag; the text (key + link words); `mx-md` and `text-start` without `text-center`; exactly one `a` with the link words; and an `href` starting `mailto:support@example.org?subject=`. The two editable cases now assert that the note holds no `a`. No test title changed. The docblock is updated.
- **Scan spec:** the `cand-profile` entry has a `reach`. It expects `data-name-state="locked-confirmed"`, then exactly one link named exactly `contact support` inside the name note, with an `href` matching `/^mailto:/`. It has one `State:` comment line.

## Verification

Delta baseline (`--list` at base 46554181e, `FRONTEND_PORT=5273`): `--project contestant-a11y-scan` gives "Total: 44 tests in 8 files" (34 in contestant-a11y-scan). `--project perm-unnominated-entities` gives "Total: 450 tests in 100 files", broken down below. These match the planning numbers.

| Project | qht-profile-final | `--list` at base | delta | 189.1-final-20261122T094916Z |
| ------- | ----------------- | ---------------- | ----- | ---------------------------- |
| contestant-a11y-scan | 34/34 | 34 | 0 | 34/34 |
| contestant-entity-selection | 48/48 | 48 | 0 | 51/51 |
| contestant-journey | 3/3 | 3 | 0 | 3/3 |
| perm-localisation-positive | 2/2 | 2 | 0 | 2/2 |
| perm-organization-editing | 47/47 | 47 | 0 | 47/47 |
| perm-unnominated-entities | 70/70 | 70 | 0 | (named perm-no-nomination there: 68/68) |

The last full run, `189.1-final-20261122T094916Z` (729/729), was made on the history before the 2026-11-22 pull, which is no ancestor of HEAD. Its counts are listed for the phase-end judgement only. **No test title changed:** a sorted `--list` of `--project perm-unnominated-entities` at HEAD is identical to the one at base (450 tests), apart from a dotenv banner line, and the cand-profile reach adds no test. Summed delta across these projects: 0. **The phase-end full-suite run is still owed by phase 189.1** and is to be judged against these summed deltas.

E2E runs (all `FRONTEND_PORT=5273`, `--project contestant-a11y-scan` unless noted):

| Run dir | Tree | Wrapper exit | Result | Status |
| ------- | ---- | ------------ | ------ | ------ |
| `tests/e2e-runs/qht-a11y-red` | base source + spec | 3 | none: witness install failed (`private.identity_registrations` missing) | not evidence; see deviation 1 |
| `tests/e2e-runs/qht-a11y-red-2` | base source + spec, DB reset | 1 | 37 passed, 7 failed | not evidence; my catalogue edit forced a reload mid-run (deviation 2) |
| `tests/e2e-runs/qht-a11y-red-3` | base source + spec | 1 | 42 passed, 2 failed | **red control.** Only the two cand-profile scans failed, at the `getByRole('link', { name: 'contact support' })` locator ("locator resolved to 0 elements"). `e2e-spec-verdict --failed-test cand-profile --failure-contains 'contact support'` exits 0 |
| `tests/e2e-runs/qht-a11y-green` | changed source | 0 | 44/44 passed, 0 failed/flaky/did-not-run | **green.** `--passed-test cand-profile` exits 0 |
| `tests/e2e-runs/qht-profile-final` (`--project perm-unnominated-entities`, HEAD 86022676a) | code commit | 0 | **450/450 passed**, 0 failed/flaky/skipped/did-not-run | **targeted final run, green.** Not void; restore ok |

Gates (each judged by its own exit status, all at HEAD 86022676a):

- Profile page test + ContactSupport test + translations test: 3 files, 689/689 passed (exit 0)
- `paraglide:compile`: exit 0. `compiledMessages.test.ts`: 773/773 passed (exit 0)
- Frontend unit suite: 337 files passed, 1 skipped; 8872 tests passed, 33 skipped (exit 0)
- `yarn workspace @openvaa/frontend check` (svelte-check `--fail-on-warnings`): 3224 files, 0 errors, 0 warnings (exit 0)
- `yarn lint:check`: exit 0
- `yarn prettier --check` on the ten files: exit 0

## Deviations from Plan

**1. [Rule 3 - Blocking] The shared stack's database held another history's schema**
- **Found during:** Task 1 step 2 (the first red run)
- **Issue:** `qht-a11y-red` exited 3 because the witness fixture could not find `private.identity_registrations`. The database had 24 applied migrations (another checkout's history), while this tree has 4 squashed ones.
- **Fix:** The next red run, `qht-a11y-red-2`, was made without `--no-db-reset`, so the wrapper reset the database to this tree's migrations. Every later run used `--no-db-reset` as planned. This was done under the standing stack authorisation.
- **Commit:** none (environment)

**2. [Rule 1 - My own interference] I invalidated red-2 by editing the catalogues while it ran**
- **Issue:** I edited the seven `dynamic.json` files while `qht-a11y-red-2` was running. Paraglide recompiled them, and Vite issued a page reload at 19:24:11, two seconds after the edit (see `devserver.log`). Five scans outside cand-profile then failed with "Execution context was destroyed". This says nothing about the tree.
- **Fix:** I copied the edits to the scratchpad, restored the seven catalogues to base with a per-file `git checkout --`, and made `qht-a11y-red-3` on the base source. That run is the clean red control. I then put the edits back. I staged the page edit on a scratch copy and touched no served file during any later run.

**3. [Rule 1 - Plan verify bug] `--passed contestant-a11y.spec.ts` matches no file in the report**
- **Issue:** Playwright reports the contestant-a11y scans under `utils/themedAxeScans.ts`, where `declareScans` defines the tests. So `e2e-spec-verdict --passed contestant-a11y.spec.ts`, as written in both Task 1's and Task 2's verify blocks, fails with "no test of contestant-a11y.spec.ts is in the report", even on the 44/44 and 450/450 green runs.
- **Fix:** I used `--passed themedAxeScans.ts --passed-test cand-profile` instead. Both exit 0, on `qht-a11y-green` and on `qht-profile-final`, and the other five `--passed <spec>` conditions and the counts check pass as written. The verify run directory for the red control is `qht-a11y-red-3`, not `qht-a11y-red`.

## Known Stubs

None.

## Threat Flags

None. T-qht-01 is mitigated as planned: the page adds no `{@html}` and reuses ContactSupport's `escapeHtml` + `sanitizeHtml` path. Its hostile-translation case passed in the frontend unit suite.

## Self-Check: PASSED

- FOUND: apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/dynamic.json, PROFILE/+page.svelte, PROFILE/page.svelte.test.ts, tests/tests/specs/a11y/contestant-a11y.spec.ts (all in commit 86022676a)
- FOUND: commit 86022676a is HEAD, `git log -1 --format=%s` = `feat: link to support from the locked-name sentence`
- FOUND: run dirs qht-a11y-red-3, qht-a11y-green, qht-profile-final with summary.json
