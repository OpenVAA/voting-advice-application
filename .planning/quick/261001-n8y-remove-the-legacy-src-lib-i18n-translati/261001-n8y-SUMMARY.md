---
phase: quick-261001-n8y
plan: 01
quick_id: 261001-n8y
subsystem: frontend-i18n
status: complete
tags: [i18n, paraglide, translations, tooling, vestiges, cleanup]
requires: []
provides:
  - "TranslationKey generated from apps/frontend/messages/ (project.inlang/settings.json baseLocale + pathPattern)"
  - "Staleness unit test that keeps the committed TranslationKey union equal to the base-locale messages key set"
  - "editTranslations TSV export/import/replaceKeys over the messages/ format"
  - "TranslationsPayload in $lib/i18n/types"
  - "261001-n8y-VESTIGES.md origin/main-era vestige inventory"
affects: [apps/frontend, apps/docs, tests, scripts, CLAUDE.md, ROADMAP.md]
tech-stack:
  added: []
  removed: [svelte-visibility-change (frontend devDependency), tslib (frontend devDependency)]
  patterns:
    - "Generators read the inlang settings (baseLocale, pathPattern) rather than listing directories"
    - "Inlang variant arrays and bare variant objects are leaves in every key flattener"
key-files:
  created:
    - apps/frontend/src/lib/i18n/types.ts
  modified:
    - apps/frontend/tools/translationKey/generateTranslationKeyType.ts
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - apps/frontend/tools/editTranslations/editTranslations.ts
    - apps/frontend/src/lib/i18n/tests/translations.test.ts
    - apps/frontend/src/lib/components/input/Input.svelte
    - tests/tests/utils/rawKeyScan.ts
    - tests/tests/specs/perm/perm-missing-nominations.spec.ts
    - scripts/assert-comment-hygiene.mjs
    - apps/frontend/src/lib/i18n/README.md
    - "apps/docs/src/routes/(content)/developers-guide/localization/local-translations/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/localization/supported-locales/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/troubleshooting/+page.md"
    - apps/frontend/svelte.config.js
    - apps/frontend/vitest.config.ts
    - apps/frontend/README.md
    - CLAUDE.md
    - apps/frontend/package.json
    - yarn.lock
    - ROADMAP.md
    - apps/frontend/src/routes/+layout.svelte
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityCard/EntityCardAction/+page.md"
  deleted:
    - apps/frontend/src/lib/i18n/translations/ (7 locales x 46 JSON files, index.ts, translations.type.ts)
decisions:
  - "TranslationKey is generated from the base-locale messages/ files listed in project.inlang/settings.json pathPattern; lang.* keys come from lang.json instead of being synthesised from directory names"
  - "editTranslations was ported to messages/ rather than deleted; TSV cells are JSON-decoded, so variant messages round-trip as single cells"
  - "rawKeyScan unions the runtime catalog with the committed TranslationKey union; the staleness test forces regeneration"
  - "Only clearly dead items with an empty consumer grep were removed in the vestige sweep; docs-app, experimental-package and audit-baseline-named dependencies are deferred"
metrics:
  duration: "~19 min wall-clock between the first and last measurement (gate runs included)"
  completed: 2026-10-01
  tasks: 3
  files_changed_excluding_deleted_catalog: 22
commits: 6
plan_head_before: 72b3367292c074b467b17ee1caab630b25e7b19f
plan_head_after: 985f26a6cd0eb531f626506c7bc3112735eb243a
actuals:
  tokens: 16400    # chars/4 over the realized diff, excluding the deleted catalog's 6.6k removed lines
  tasks: 3
  commits: 6
---

# Quick 261001-n8y: Single Paraglide translation catalog + vestige sweep Summary

`apps/frontend/messages/` is now the frontend's only translation catalog. The `TranslationKey` generator reads it through `project.inlang/settings.json`, and the regenerated key set is identical to the base revision's. A unit test fails whenever the committed union is stale. `editTranslations` and the E2E raw-key scanner were repointed, and the legacy `src/lib/i18n/translations/` directory was deleted. A live grep sweep then removed four verified-dead vestiges and inventoried everything else in VESTIGES.md.

## Commits (`git log --oneline 72b336729..HEAD`)

| # | Hash | Message |
|---|------|---------|
| 1 | `f12c4a951` | refactor[i18n]: generate TranslationKey and edit translations from the Paraglide messages catalog |
| 2 | `bb6a528a6` | style[i18n]: join the generator's wrapped comment lines |
| 3 | `2ef324cf6` | refactor[i18n]: remove the legacy translations catalog; messages/ is the single source |
| 4 | `dad6569be` | refactor[frontend]: drop the $voter path alias, whose target directory does not exist |
| 5 | `ec30a1500` | chore[deps]: remove dependencies nothing imports |
| 6 | `985f26a6c` | docs: point root-relative frontend/ paths at apps/frontend |

None of these commits contains a `.planning/` file. The docs artifacts (this SUMMARY, VESTIGES.md, `gate-evidence/`) are left uncommitted for the orchestrator.

## Task 1: generator, staleness guard, editTranslations (tracer)

**Key-set equivalence (the before/after diff):**

- `gate-evidence/keys-before.txt`: the single-quoted literals of `translationKey.ts` at base `72b336729`, sorted. 595 keys.
- `gate-evidence/keys-after.txt`: the same extraction after `yarn workspace @openvaa/frontend generate:translation-key-type`. 595 keys.
- `diff keys-before.txt keys-after.txt` → **exit 0, empty diff**. No key was gained or lost, so no call site needed attention.
- `git diff -U0 72b336729 -- apps/frontend/src/lib/types/generated/translationKey.ts` (`gate-evidence/translationKey.diff`) shows **one changed line, the header only**:
  - `-/** Auto-generated by \`/frontend/tools/translationKey/generateTranslationKeyType.ts\` */`
  - `+/** Auto-generated from the base-locale messages by \`apps/frontend/tools/translationKey/generateTranslationKeyType.ts\` */`
- A second regeneration after all commits (`gate-evidence/gen2.log`) left the file unchanged, so the generator is idempotent.

**Staleness guard, negative control:**

1. Removed the `'about.returnButton'` line from a working copy of `translationKey.ts`, after backing it up to `gate-evidence/translationKey.ts.bak`.
2. Ran `yarn workspace @openvaa/frontend test:unit src/lib/i18n/tests/translations.test.ts`: **exit 1**, `1 failed | 324 passed`. The failure message says `translationKey.ts is stale: run \`yarn workspace @openvaa/frontend generate:translation-key-type\`` and lists `"about.returnButton"` in `missingFromUnion` (`gate-evidence/staleness-red.log`).
3. Restored the copy: `cmp` exit 0 (byte-identical).
4. Re-ran the file: **exit 0**, 325 passed (`gate-evidence/staleness-green.log`).

**editTranslations round trip** (`gate-evidence/roundtrip.log`):

- `--export gate-evidence/roundtrip.tsv` exited 0, writing 595 data rows.
- `--import` exited 0 and wrote 329 files (7 locales × 47). No missing-`pathPattern` lines were logged.
- `node gate-evidence/roundtrip-compare.mjs ./output/import ../../messages`: **exit 0**, "files compared: 329; differing: 0". The file sets match and every file is deep-equal, including namespace wrappers and variant arrays.
- Comparator self-check: after perturbing one output value (`lang.en`), the comparator exited 1 with "differing: 1".
- The tool's `output/` directory was deleted afterwards, and `git status` showed no stray files.

Task 1 verify chain (plan `<automated>`): **exit 0**. That chain is generate → diff → header-only check → translations test → `yarn workspace @openvaa/frontend check` (0 errors, 0 warnings).

## Task 2: catalog removal

- `git grep -n TranslationsPayload` before the move: `Input.svelte` was the only consumer outside `.planning/`. The type body moved unchanged to `apps/frontend/src/lib/i18n/types.ts` (`diff` of the bodies exit 0).
- `rawKeyScan.ts` reads two sources: `messages/en` and the generated union. The legacy constant and the filename-prefix path are gone.
- `translations.test.ts` went from 325 to 311 tests. The 14 cross-catalog parity tests and the 7 type-gen argument-label tests were removed, and 7 namespace-wrapper tests were added.
- `git rm -r apps/frontend/src/lib/i18n/translations`, then `test ! -e` → gone.
- The negative grep `git grep -n -E 'i18n/translations|translations\.type|staticTranslations|TYPEGEN_CATALOG_DIR|type-gen' -- ':!.planning'` returns nothing (exit 1).
- Checked before editing docs:
  - `.husky/pre-commit` runs only `yarn turbo run build --filter=@openvaa/app-shared...` and `yarn lint-staged`, and `.lintstagedrc.json` runs only prettier and eslint. The generator is not part of the hook.
  - `git ls-files apps/supabase | grep -i translat` → 0, so there is no per-locale backend translation file. The backend copy step and the supabase-locales Strapi banner were therefore removed.
- The hygiene docblock's count of non-comment `\uXXXX` occurrences was recounted at **six** in the scan roots `apps/ packages/ tests/`: five lines in `packages/shared-config/eslint.config.mjs` plus `Select.svelte:87`.
- Task 2 verify:

| Command | Exit |
|---|---|
| frontend `test:unit` (128 files / 2041 tests) | 0 |
| frontend `check` (0 errors, 0 warnings) | 0 |
| `yarn typecheck:tests` | 0 |
| frontend `build` | 0 |
| `yarn assert:comment-hygiene` | 0 |
| `yarn assert:i18n-catalog-namespaces` (595 keys) | 0 |
| `yarn assert:a11y-scan-wiring` | 0 |

## Task 3: vestige sweep

See **`261001-n8y-VESTIGES.md`** for every sweep command, its hit count and the classified findings.

**Fixed:** four vestiges, each with an empty consumer grep recorded:

- the `$voter` alias;
- `svelte-visibility-change`;
- `tslib`;
- root-relative `frontend/` paths in ROADMAP.md, a layout comment and one stale generated docs page.

**Deferred / intentional:**

- 30 `apps/docs` Strapi-era pages;
- the `BACKEND_API_TOKEN` and `PUBLIC_*_BACKEND_URL` env plumbing;
- docs-app, LLM-package and audit-baseline-named dependencies;
- `OpenVAALogo.svelte`, which still uses Svelte 4 props;
- root planning docs and assets.

Each is cross-referenced to an existing todo where one exists. No new todo files were created.

Dependency removal checks for `ec30a1500`:

- `yarn install` exit 0.
- The `yarn.lock` diff touches only the frontend workspace's two lines and the `svelte-visibility-change` resolution block.
- Neither package is named in `security/audit-baseline.json`.
- `yarn audit:deps` exit **1** after the change (`gate-evidence/t3-audit-deps.log`). It also exits **1** with an identical GHSA set against the base lockfile (`gate-evidence/t3-audit-deps-base.log`; the files were restored byte-identical afterwards). This is pre-existing and not caused by this task. The likely cause is advisories published since the baseline review, but that is **UNCONFIRMED**.

## Full verification gate (Task 3 step 5)

Local Supabase was already running (`yarn db:status` exit 0, "supabase local development setup is running"; the log is trimmed to the status lines). Each gate ran as its own command, and each status was read directly from `$?`, never through a pipe (`gate-evidence/g-status.txt`).

| Gate | Command | Exit | Log |
|------|---------|------|-----|
| Lint | `yarn lint:check` | **0** | `g-lint.log` |
| Format | `yarn format:check` | **0** | `g-format.log` |
| Typecheck | `yarn typecheck` | **0** | `g-typecheck.log` |
| Unit | `yarn test:unit` | **0** | `g-unit.log` |
| Frontend check | `yarn workspace @openvaa/frontend check` | **0** | `g-check.log` |
| Full build | `yarn build --force` | **0** (14/14 tasks, 0 cached) | `g-build-all.log` |
| Frontend build | `yarn workspace @openvaa/frontend build` | **0** | `g-build-frontend.log` |

`yarn typecheck` and `yarn test:unit` partly replayed turbo cache entries with identical input hashes. To rule out a stale cache, both were re-run with the cache bypassed:

| Command | Exit | Result |
|---|---|---|
| `yarn turbo run test:unit --force` | **0** | 25/25 tasks, 0 cached (`g-unit-force.log`) |
| `yarn turbo run typecheck --force` | **0** | 23/23 tasks, 0 cached (`g-typecheck-force.log`) |

E2E was not required by the plan and was not run.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Comment-hygiene violations in the new generator docblock**
- **Found during:** Task 2 verification (`node scripts/assert-comment-hygiene.mjs`, rule 2, forced line breaks).
- **Issue:** The Task 1 generator docblocks were hard-wrapped mid-sentence.
- **Fix:** Joined the lines.
- **Commit:** `bb6a528a6`.
- **Process note:** My first attempt at this commit accidentally included the `git rm`-staged catalog deletions, because they were already in the index. I undid that one unpushed commit with `git reset --soft HEAD~1` and unstaged the deletions. I then recommitted the hygiene fix alone and the deletions with Task 2, so every commit builds atomically.

**2. [Rule 1 - Bug] ESLint `quotes` error in a new test title**
- **Found during:** Task 2.
- **Issue:** A template literal had no interpolation.
- **Fix:** Changed it to a single-quoted string. Included in `2ef324cf6`.

**3. [Rule 2 - Consistency] rawKeyScan flatten treats bare variant objects as leaves**
- Its docblock says it mirrors the generator, and the generator now treats `declarations`/`selectors`/`match` objects as leaves, so the scanner does too. In `2ef324cf6`.

**4. [Rule 1 - Bug] editTranslations multi-part prefix match**
- **Issue:** `findFilePrefix` matched `adminApp.common` against any key starting with that string, including `adminApp.commonX`.
- **Fix:** It now requires the trailing `.` and tries the longest prefix first. In `f12c4a951`.

**5. Scope additions within the plan's spirit**
- **Namespace-wrapper test:** `translations.test.ts` gained a test asserting that every message file is wrapped in its namespace key. Without it, a missing wrapper would only show up as a key-parity diff.
- **Frontend README alias list:** the list gained `$layouts` while `$voter` was dropped, so it matches `svelte.config.js`.

**6. Orchestrator overrides of plan text**
- The plan's `docs[planning]: the 261001-n8y vestige sweep report` commit was **not** made, and ROADMAP.md under `.planning/` was not touched. The orchestrator's constraints reserve docs commits for itself.
- The root `ROADMAP.md` stale-path fix (commit 6) is a tracked code-tree doc and was planned.

## Known Stubs

None.

## Threat Flags

None. No new network endpoint, auth path or trust-boundary schema. The threat register's mitigations are all in place:

- **T-n8y-01:** the generator throws on a missing file, a wrong wrapper, an empty key set or a duplicate key. The equivalence diff and the staleness negative control both passed.
- **T-n8y-02:** TSV cells are JSON-decoded, output goes only to `output/`, and the round trip is deep-equal.
- **T-n8y-03:** the scanner was repointed in the same commit that deleted the directory, the floor was kept, and `typecheck:tests` passed.
- **T-n8y-04:** the lockfile diff is confined, baseline-named packages were deferred, and `audit:deps` was run and compared against the base.

## Self-Check: PASSED

- FOUND: `apps/frontend/src/lib/i18n/types.ts`, `261001-n8y-VESTIGES.md`, `gate-evidence/{keys-before,keys-after}.txt`, `translationKey.diff`, `staleness-red.log`, `roundtrip.log`, `g-status.txt`.
- MISSING (intended): `apps/frontend/src/lib/i18n/translations/`.
- FOUND commits: `f12c4a951`, `bb6a528a6`, `2ef324cf6`, `dad6569be`, `ec30a1500`, `985f26a6c`.
