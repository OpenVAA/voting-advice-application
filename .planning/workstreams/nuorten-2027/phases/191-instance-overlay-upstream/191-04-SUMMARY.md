---
phase: 191-instance-overlay-upstream
plan: 04
subsystem: frontend i18n / Paraglide compile
tags: [instance-overlay, paraglide, inlang, i18n, build-validation]
requires:
  - 191-03 (/.instance gitignored and prettier-ignored; the generated inlang project lives there)
provides:
  - messageCatalog.ts (flattenMessageKeys, getPlaceholders, getHtmlTags, isVariantMessage, collectVariantTexts, collectStrings, flattenMessageNodes, readLocaleCatalog)
  - instanceMessages.ts (validateInstanceMessages, instanceMessagesProject, assertSupportedLocalesCompiled)
  - PARAGLIDE_OPTIONS.project instance-aware; supported-locale check at module load
affects:
  - every compiled message (vite.config.ts and scripts/compile-paraglide.ts both import PARAGLIDE_OPTIONS, unchanged)
tech-stack:
  added: []
  patterns:
    - generated inlang project with the base pathPattern rebased and instance/messages/{locale}.json appended last (last file wins)
    - build-time validation of overrides against the base-locale catalogue (key exists, placeholder set, HTML tag set)
key-files:
  created:
    - apps/frontend/src/lib/i18n/utils/messageCatalog.ts
    - apps/frontend/src/lib/i18n/utils/messageCatalog.test.ts
    - apps/frontend/src/lib/i18n/utils/instanceMessages.ts
    - apps/frontend/src/lib/i18n/utils/instanceMessages.test.ts
  modified:
    - apps/frontend/src/lib/i18n/tests/translations.test.ts
    - apps/frontend/paraglide.options.ts
    - apps/frontend/messages/README.md
decisions:
  - "readLocaleCatalog's count check is against the generated TranslationKey union (lines `| '<key>'` of translationKey.ts), compared as sorted key lists, not counts only"
  - "The branch test of flattenMessageKeys is extracted to a private isMessageBranch so readLocaleCatalog walks the tree with the same rule; flattenMessageNodes is exported for flattening an instance file whose top-level keys are namespaces"
  - "Placeholder and HTML-tag comparison is set equality over the union of all strings of the override vs the base-locale (en) message, so variant overrides may drop or reorder variants as long as the signature is unchanged"
  - "Key lookup uses Object.hasOwn, so prototype names (constructor, toString) cannot pass as base keys"
requirements: [SC-2, SC-3]
metrics:
  duration: ~35 min
  completed: 2026-11-23
  tasks: 2
  files: 7
---

# Phase 191 Plan 04: instance message overlay Summary

When `instance/messages/<locale>.json` files exist, `paraglide.options.ts` now validates them against the base `en` catalogue and writes `apps/frontend/.instance/project.inlang/settings.json`. That project lists the frontend's 48 catalogue patterns, rebased to `../messages/{locale}/<ns>.json`, and then `../../../instance/messages/{locale}.json` last. The instance file wins key by key in its locale, and every other message and locale keeps its base text. With no instance files the project stays `./project.inlang`, and the compiled `src/lib/paraglide` is byte-identical. The module also fails when `staticSettings.supportedLocales` offers a locale that has no compiled catalogue.

## Tasks

| Task | Name | Commits | Files |
| ---- | ---- | ------- | ----- |
| 1 | Extract the catalogue helpers into messageCatalog.ts | 107e3d5fc (RED), 6ac693125 (GREEN) | messageCatalog.ts(+test), translations.test.ts |
| 2 | instanceMessages module, instance-aware PARAGLIDE_OPTIONS, README | 6349b8b9e (RED), b5b527b9b (GREEN) | instanceMessages.ts(+test), messageCatalog.ts, paraglide.options.ts, messages/README.md |

## Verification evidence

- **Task 1 RED:** `messageCatalog.test.ts` failed to collect because the module did not exist. **GREEN:** 9/9 passed. `translations.test.ts` had 609 passing tests before the move and 609 after it.
- **Task 1 acceptance greps:** the `^function (flattenMessageKeys|…)` grep on `translations.test.ts` prints 0, and the `$lib` grep on `messageCatalog.ts` prints 0.
- **Task 2 RED:** `instanceMessages.test.ts` failed to collect because the module did not exist. **GREEN:** 18/18 passed (the plan asks for at least 10).
  - No instance: covers the absent directory and a README-only directory. Each returns `./project.inlang` and writes nothing.
  - Generated settings: the exact rebased `pathPattern` with the instance entry last, two-space JSON with a trailing newline, and every other field unchanged.
  - Accepted overrides: the returned locale list, and nested and variant overrides that keep the base signature.
  - Rejected overrides: an unknown key, a placeholder change (the error names both sets), an HTML tag change, `fi-FI.json` and `xx.json` (the error lists `en, fi`), invalid JSON, a top level that is an array, a string or null, a symlinked file and a symlinked `instance/messages` directory.
  - `assertSupportedLocalesCompiled`: throws naming `'xx'`, and returns undefined when every locale is compiled.
- **Integration proof (real Paraglide compile, network to the CDN):**
  - Checksum before any change: `find apps/frontend/src/lib/paraglide -type f -print0 | sort -z | xargs -0 sha256sum | sha256sum` gave `b3ca2d2b625d7ce4324e3eb4bad125bccf9e33377593968e635a5052011c1539`.
  - After the change, with no instance files: `paraglide:compile` gives the same checksum, and `apps/frontend/.instance` is not created.
  - Override: I wrote `instance/messages/en.json` = `{ "common": { "closeDialog": "INSTANCE OVERRIDE" } }` and compiled. In `messages/common_closedialog1.js`, `en_common_closedialog1` returns `INSTANCE OVERRIDE`, `fi_common_closedialog1` still returns the base `Sulje valintaikkuna`, and sv, da, et, fr and lb are unchanged.
  - Failing override: I added `instance/messages/fi.json` = `{ "common": { "closeDialog": "Moi {nimi}" } }`. `paraglide:compile` exits 1 with `instance/messages/fi.json: 'common.closeDialog' must use the placeholders of the base message, none, but uses {nimi}.`
  - Cleanup: I ran `rm -rf instance/messages apps/frontend/.instance` and `rmdir instance`, then compiled again. The checksum is `b3ca2d2b…1539`, equal to the one taken before. `git status --porcelain` is empty.
- **Unchanged consumers:** `git diff --quiet <plan start 9d57ed9b5> HEAD -- apps/frontend/vite.config.ts apps/frontend/scripts/compile-paraglide.ts` exits 0.
- **README:** the "a pattern entry with no file is a build error" grep finds nothing. Rule 2 now says the plugin ignores a missing file and that `translations.test.ts` enforces that the listed files exist. A new "Instance overrides" section was added.
- **Gates:**
  - frontend `typecheck` and `check` both exit 0 (3233 files, 0 errors, 0 warnings).
  - `test:unit` exits 0: 342 files and 8936 tests passed, 33 skipped.
  - `lint` has 0 errors. Its 1 warning is pre-existing, in `IdentityProviderGate.svelte.test.ts`.
  - `yarn assert:i18n-catalog-namespaces` reports 0 violations (758 keys), and `yarn assert:comment-hygiene` reports 0 violations.
  - eslint and prettier are clean on `paraglide.options.ts` and every touched file.

## E2E (targeted runs, per the 2026-11-09 ruling)

| Run dir | Project | Result | Listed | Executed | Delta vs last full run | Title pins |
| ------- | ------- | ------ | ------ | -------- | ---------------------- | ---------- |
| tests/e2e-runs/191-04-voter-dark-mode | voter-dark-mode | GREEN, exit 0, 3 passed, not void | 3 | 3 | 0 | identical to 191-03-voter-dark-mode/titles.txt |
| tests/e2e-runs/191-04-perm-localisation-positive | perm-localisation-positive | GREEN, exit 0, 273 passed, not void | 273 | 273 | 0 | identical to 191-03 |
| tests/e2e-runs/191-04-a11y-smoke | a11y-smoke | GREEN, exit 0, 20 passed, not void | 20 | 20 | 0 | identical to 191-03 |
| tests/e2e-runs/191-04-voter-journey | voter-journey | GREEN, exit 0, 4 passed, not void | 4 | 4 | 0 | identical to 191-03 |
| tests/e2e-runs/191-04-visual-regression-container | visual-regression (pinned CI container, `--ci-literal`) | GREEN, exit 0, 8 passed, 0 unexpected, 0 flaky, 0 skipped | 8 | 8 | 0 | identical to 191-03-visual-regression-container/titles.txt |

- Every run had 0 unexpected, 0 flaky and 0 skipped in its `results.json` stats, and 0 did-not-run. No run dir carries a `VOID-*` marker.
- Each run dir holds `list.txt` (the `--list` output) and `titles.txt` (the sorted `›` lines). The visual listing was taken with `PLAYWRIGHT_VISUAL=1`.
- **Last full-run record:** the same one plans 01–03 used (tree d5216b03, totals only). This plan changes no spec or fixture, and every `titles.txt` is byte-identical to 191-03's, so the delta is 0 for every project.
- **visual-regression route:** same as 191-02 and 191-03. I served this tree with `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2 yarn workspace @openvaa/frontend dev --host 0.0.0.0`; the root's `data-project-id` was the E2E id. I ran `tests/scripts/visual-container.sh --ci-literal` against the pinned image, which was already present locally. I stopped the dev server afterwards.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] Prototype keys could pass the base-key check**
- **Found during:** Task 2
- **Issue:** a plain `key in baseCatalog` check accepts `constructor` or `toString` as base keys.
- **Fix:** I used `Object.hasOwn`.
- **Commit:** b5b527b9b

**2. [Rule 1 - Lint] `func-style` and `preserve-caught-error`**
- **Fix:** I made the test helper a function declaration, and the JSON parse error now carries its `cause`.
- **Commit:** b5b527b9b

**3. Small additions to messageCatalog.ts beyond the verbatim move**
- **What:** a private `isMessageBranch` (the existing branch test of `flattenMessageKeys`) and an exported `flattenMessageNodes`.
- **Why:** `readLocaleCatalog` and the instance validation flatten trees with exactly the same rule, with no second copy. The bodies of the six moved helpers are otherwise unchanged.

**4. Commit type for Task 1 GREEN**
- **What:** Task 1's GREEN commit is `refactor(…)`, because it is mostly a move.
- **Gate:** Task 2's GREEN is `feat(…)`, so the plan has the test-then-feat sequence.

## Known Stubs

None. `messages/README.md` links to `instance/README.md`, which Plan 05 creates.

## Threat model coverage

| Threat | Mitigation |
| ------ | ---------- |
| T-191-14 | Each override's HTML tag set must equal the base message's. A `<script>` added to a plain message fails, and that case is tested. The sanitiser path is unchanged. |
| T-191-15 | Each override's `{placeholder}` set must equal the base message's. This is tested, and also shown in the real compile. |
| T-191-16 | Unknown keys and file names outside `locales` (`fi-FI.json`, `xx.json`) fail. Both are tested. |
| T-191-17 | `lstatSync` refuses a symlinked file and a symlinked `instance/messages` directory, and so do non-regular entries. Both symlink cases are tested. |
| T-191-18 | `assertSupportedLocalesCompiled` runs at the load of `paraglide.options.ts`, so both the build and the compile script fail on an uncompiled offered locale. |

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/i18n/utils/messageCatalog.ts, messageCatalog.test.ts, instanceMessages.ts, instanceMessages.test.ts
- FOUND: commits 107e3d5fc, 6ac693125, 6349b8b9e, b5b527b9b
