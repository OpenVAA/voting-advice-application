---
phase: 169-dependency-bump-to-latest-safe-versions
plan: 03
subsystem: infra
tags: [eslint, eslint-plugin-import-x, unrs-resolver, eslint-plugin-svelte, flat-config, prettier, prettier-plugin-svelte, prettier-plugin-tailwindcss, simple-import-sort, supply-chain]

requires:
  - phase: 169-02
    provides: "group-1 tree (Yarn 4.18.1 with the dependenciesMeta build allow-list, Node 24, TypeScript 6), 12/12 gates and CI 12/12"
provides:
  - "eslint-plugin-import-x 4.17.1 replaces eslint-plugin-import; the four import rules are proven firing on planted violations before (import/*) and after (import-x/*) the swap, and again on ESLint 10 (169-planted-import-rules.sh)"
  - "unrs-resolver on the root dependenciesMeta build allow-list (box A); its postinstall source printed into the evidence"
  - "eslint-plugin-svelte 3.23.0 through the catalog for both apps (docs `catalog:`); frontend spreads svelte.configs.prettier; frontend findings unchanged"
  - "shared ESLint config built from native flat exports (no FlatCompat); --print-config identical for 5 representative files; @eslint/eslintrc out of the catalog and every manifest"
  - "15 real findings ESLint 10's recommended set raises are fixed at source (14b62f26c), and hold on ESLint 9"
  - "prettier-plugin-svelte 4.1.1, prettier-plugin-tailwindcss 0.8.1, eslint-plugin-simple-import-sort 14.0.0, each a bump commit followed by its reformat commit or a recorded no-diff"
  - "group-2 gate run 169-03-group2: 12/12 green"
  - "ESLint 10 HELD on 9.39.5 (D-06): three no-useless-assignment false positives on write-only $bindable props (eslint-plugin-svelte#1478) and one real no-unassigned-vars defect need an operator decision; the config-lookup flag therefore stays"
affects: [169-04, 169-05, 169-10, 169-13]

actuals:
  tokens: 13755   # chars/4 over the realized diff 81687aa55..2e3a79846 excluding yarn.lock (18093 source + 30927 .planning = 49020 chars); 32783 with the lockfile diff (76111 chars)
  tasks: 3
  commits: 10     # git rev-list --count 81687aa55..2e3a79846 (the SUMMARY and state commits follow)
plan_head_before: 81687aa55f7e4e33839d0aaa3982f6c30d5ca7c8
plan_head_after: 2e3a79846a12d8f55586d26a1b3b089f4dd523f7

tech-stack:
  added: [eslint-plugin-import-x 4.17.1, unrs-resolver 1.12.2 (transitive, build allowed)]
  patterns:
    - "A lint-config migration step is proven by a rule-level instrument before it lands: planted violations per rule, --print-config rule-set equality, or a normalised findings list compared with diff"
    - "A new recommended rule's findings are triaged one by one: real ones are fixed at source, and a false positive with an open upstream issue holds the upgrade (D-06) rather than disabling the rule"

key-files:
  created:
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-planted-import-rules.sh
    - .planning/todos/pending/2026-10-03-eslint-10-held-on-bindable-no-useless-assignment.md
  modified:
    - .yarnrc.yml
    - package.json
    - yarn.lock
    - packages/shared-config/eslint.config.mjs
    - packages/shared-config/package.json
    - apps/frontend/eslint.config.mjs
    - apps/docs/package.json
    - packages/dev-seed/tests/cli/teardown.test.ts
    - apps/frontend/src/lib/_guards/eslint-store-guard.test.ts
    - packages/dev-seed/src/cli/resolve-template.ts
    - packages/dev-seed/src/writer.ts
    - packages/question-info/src/core/infoGeneration.ts
    - packages/argument-condensation/src/core/condensation/condenser.ts
    - packages/argument-condensation/src/core/utils/condensation/calculateLLMCallCounts.ts
    - apps/frontend/src/lib/server/admin/requireAdminIdentity.ts
    - apps/frontend/src/lib/utils/color/PreviewColorContrast.svelte
    - apps/frontend/src/lib/contexts/tests/noDataRootDerivedAlias.test.ts
    - apps/frontend/src/lib/layouts/tests/noRelativeLayoutImports.test.ts
    - tests/tests/support/preflight.ts
    - apps/frontend/src/lib/components/select/Select.svelte
    - apps/frontend/src/routes/candidate/help/+page.svelte
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-EVIDENCE.md

key-decisions:
  - "ESLint 10 held on 9.39.5 under D-06. no-useless-assignment reports every write-only $bindable prop (3 sites). This is an open upstream false positive (eslint-plugin-svelte#1478), and svelte-eslint-parser's virtual prop reference sits at the declaration's own range, so the rule ignores it. PROH-169-07 forbids disabling the rule, and a dummy read would bend the code. The operator chooses between waiting for upstream (A) and a scoped '**/*.svelte' rule configuration (B)."
  - "Layout.svelte's drawerOpenElement focus return has never been wired: Header binds its own non-bindable copy. ESLint 10's no-unassigned-vars found it. It was left unchanged here, because wiring it changes keyboard focus behaviour; it is filed with the hold."
  - "The 15 real ESLint 10 findings were fixed at source anyway, as a version-independent fix(lint) commit: { cause } on rethrown errors, and dead initial values removed. Re-applying ESLint 10 later then only has to deal with the four hold sites."
  - "The import-x plugin is registered under the `import-x` key. The three existing `eslint-disable-next-line import/first` directives in the dev-seed teardown test follow the rename (research had recorded that none existed)."
  - "The plan's 'zero-finding starting state' was in fact 0 errors and 17 pre-existing warnings. D-17's 'zero new findings' is held by diffing the normalised file/severity/rule/message lists, and stays equal through the group-2 gate run."

patterns-established:
  - "169-planted-import-rules.sh <namespace>: rerunnable rule-level proof, with fixtures under packages/core/src removed by an EXIT trap and a clean-tree assertion"

requirements-completed: []

coverage:
  - id: D1
    description: "eslint-plugin-import-x replaces eslint-plugin-import, with the four rules proven firing before and after the swap and again under ESLint 10"
    requirement: DEPS-04
    verification:
      - kind: other
        ref: "bash 169-planted-import-rules.sh import (before, exit 0) / import-x (after, exit 0; ESLint 9.39.5 and 10.11.0), with each wrong-namespace negative control exit 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "eslint-plugin-svelte 3 through the catalog; frontend findings unchanged"
    requirement: DEPS-04
    verification:
      - kind: other
        ref: "eslint --format json src/ (apps/frontend) before/after, normalised diff exit 0; yarn why eslint-plugin-svelte -> only 3.23.0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Shared config without FlatCompat; --print-config rule sets equal; @eslint/eslintrc gone from catalog and manifests"
    requirement: DEPS-04
    verification:
      - kind: other
        ref: "169-EVIDENCE.md § 6 (169-03 Task 2): 5 files, 0 rule differences, other keys identical"
        status: pass
    human_judgment: false
  - id: D4
    description: "ESLint 10 with the config-lookup flag removed everywhere"
    requirement: DEPS-04
    verification:
      - kind: other
        ref: "attempted: 19 findings, 15 fixed (14b62f26c), 4 hold sites; held per D-06 (169-EVIDENCE.md § 3)"
        status: fail
    human_judgment: true
    rationale: "Landing ESLint 10 now needs either the upstream fix (eslint-plugin-svelte#1478) or an operator overrule of PROH-169-07 for a scoped rule configuration, plus a behaviour decision on the Layout focus return."
  - id: D5
    description: "The three formatter/sorter majors, each with its own reformat commit or a recorded no-diff; no ResearchQuote span changed"
    requirement: DEPS-04
    verification:
      - kind: other
        ref: "cb266766b (no diff), 59f6acf8a + 4fa365e41, 2e3a79846 (no sorter diff); check:research-quotes two-base form exit 0 after each"
        status: pass
    human_judgment: false
  - id: D6
    description: "Group 2 ends with all twelve D-26 gates green"
    verification:
      - kind: other
        ref: "bash 169-gates.sh 169-03-group2 -> 12 rows of 0 at 2e3a79846"
        status: pass
    human_judgment: false

duration: 32min
completed: 2026-10-03
status: complete
---

# Phase 169 Plan 03: Group 2 — Lint and Format Summary

**`eslint-plugin-import` is replaced by `eslint-plugin-import-x` 4.17.1, and its four rules were observed firing on planted violations under both namespaces. `eslint-plugin-svelte` is on 3.23.0 through the catalog, the shared config no longer uses FlatCompat (its `--print-config` output is identical), and the three formatter/sorter majors landed, each with its reformat. Group 2 ended 12/12 green. ESLint 10 is held on 9.39.5: its new `no-useless-assignment` rule reports every write-only `$bindable` prop, an open upstream false positive (eslint-plugin-svelte#1478) that the plan's no-disable rule does not allow absorbing. The 15 real findings ESLint 10 raised are fixed at source.**

## Performance

- **Duration:** about 32 min (2026-10-03T10:30Z → 11:02Z)
- **Started:** 2026-10-03T10:30Z
- **Completed:** 2026-10-03T11:02Z
- **Tasks:** 3 (Task 2's ESLint-10 commit held)
- **Files modified:** 24 (`git diff --name-only 81687aa55..2e3a79846`), 21 of them outside `.planning/`

## Accomplishments

- **import-x swap (D-17, D-06), `d3383c7e4`.**
  - Catalog `eslint-plugin-import` → `eslint-plugin-import-x ^4.17.1`. It is declared by `@openvaa/shared-config` and removed from the root manifest.
  - The shared config registers it as `import-x`; the four rules keep their options.
  - The swap removed 91 transitive versions (the `es-abstract` shim family) and added `unrs-resolver` with 22 platform bindings.
  - `unrs-resolver` is on the `dependenciesMeta` build allow-list. Its `postinstall.js` (`napi-postinstall` `checkAndPreparePackage`) is printed in EVIDENCE § 2.
  - Planted proof:
    - before, `import/*`: 4/4 fired;
    - after, `import-x/*`: 4/4 fired, on ESLint 9 and on ESLint 10;
    - each wrong-namespace control: all MISSING, exit 1.
- **`eslint-plugin-svelte` 3.23.0 (D-13), `51e22ea78`.** Both apps use one version through the catalog, and the frontend spreads `svelte.configs.prettier`. The frontend lint findings are identical: 849 files, 1 warning.
- **No FlatCompat, `087697975`.** The extends were replaced by `js.configs.recommended`, the `@typescript-eslint` `flat/recommended` array and `eslint-config-prettier`. `--print-config` is identical for a core `.ts`, a frontend `.ts`, a frontend `.svelte`, a tests `.ts` and a docs `.svelte` file. `@eslint/eslintrc` is gone from the catalog and from every manifest.
- **ESLint 10, measured and held.**
  - Every peer admits `eslint ^10`.
  - On 10.11.0 the planted proof and the four guard specs passed (390 tests).
  - The new recommended rules raised 19 errors. 15 are fixed in `14b62f26c`: `{ cause }` on rethrows, and dead initial values removed.
  - The other 4 are 3 false positives (write-only `$bindable`) and 1 real latent defect (the drawer focus return is never wired).
  - The ESLint move was reverted file by file and is recorded as a hold (§ 3) with a todo.
- **Formatter/sorter majors (D-23):**
  - `prettier-plugin-svelte` 4.1.1 (`cb266766b`): no reformat diff.
  - `prettier-plugin-tailwindcss` 0.8.1 (`59f6acf8a`): two class lists re-sorted in `4fa365e41`.
  - `eslint-plugin-simple-import-sort` 14.0.0 (`2e3a79846`): no re-sort diff.
  - `check:research-quotes` (two-base form) exited 0 after each.
- **Gates:** `169-03-group2` returned 12/12 zero at `2e3a79846`, with lint findings equal to the pre-plan baseline.

## Task Commits

1. **Task 1: import-x swap (tracer).** `d3383c7e4` refactor(lint); `340cce3ed` docs(169-03) proof script + age/legitimacy evidence. Tracer gate: the `<verify>` was re-run on the committed tree (proof 4/4, `lint:check` 0) before expanding.
2. **Task 2: svelte 3, no FlatCompat, ESLint 10.** `51e22ea78` chore(lint); `087697975` refactor(lint); `14b62f26c` fix(lint) (the 15 ESLint-10 source fixes); `db01339e9` docs(169-03) evidence + hold + todo. ESLint 10 itself is held, so it has no commit.
3. **Task 3: formatter/sorter majors + gates.** `cb266766b` chore(deps); `59f6acf8a` chore(deps); `4fa365e41` style; `2e3a79846` chore(deps). The gate run and Task 3 evidence go in with this SUMMARY.

## Files Created/Modified

- `.yarnrc.yml`: catalog `eslint-plugin-import-x`, `eslint-plugin-svelte ^3.23.0`, `prettier-plugin-svelte ^4.1.1`, `prettier-plugin-tailwindcss ^0.8.1`, `eslint-plugin-simple-import-sort ^14.0.0`. `eslint-plugin-import` and `@eslint/eslintrc` were removed. `eslint` / `@eslint/js` are unchanged (held).
- `package.json`: `eslint-plugin-import` removed; `dependenciesMeta.unrs-resolver.built: true`.
- `packages/shared-config/{package.json,eslint.config.mjs}`: import-x; native flat exports.
- `apps/frontend/eslint.config.mjs`: `svelte.configs.prettier`. `apps/docs/package.json`: `eslint-plugin-svelte: catalog:`.
- The ESLint-10 source fixes: 10 files (see `key-files`).
- Reformat: `Select.svelte`, `routes/candidate/help/+page.svelte`.
- Phase directory: `169-planted-import-rules.sh`, `169-EVIDENCE.md` (§ 1, § 2, § 3, § 4, § 5, § 6, § 7). New todo `2026-10-03-eslint-10-held-on-bindable-no-useless-assignment.md`.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `yarn workspace @openvaa/core exec eslint` is "command not found"**
- **Found during:** Task 1 step 1, the first run of the proof script.
- **Issue:** `@openvaa/core` does not declare `eslint`, so Yarn 4.18 does not expose the binary to `exec` in that workspace. `yarn workspace @openvaa/core lint` fails the same way outside turbo.
- **Fix:** the script runs `node_modules/.bin/eslint` from `packages/core`. The configuration it resolves is the same: the root `eslint.config.mjs`, i.e. the shared config. This was proven by the negative control.
- **Committed in:** `340cce3ed`.

**2. [Rule 1 - Bug] Three `eslint-disable-next-line import/first` directives would have pointed at a removed rule**
- **Found during:** Task 1, while deriving the rename population. Research recorded "no `eslint-disable … import/…` comment exists"; three do, in `packages/dev-seed/tests/cli/teardown.test.ts`.
- **Fix:** renamed to `import-x/first`. Linting the file on the new config returns 0 problems and no "unused directive".
- **Committed in:** `d3383c7e4`.

**3. [Rule 1/2 - Bugs found by a new rule] 15 ESLint-10 findings fixed at source**
- **Found during:** Task 2 commit C.
- **Fix:** `{ cause }` attached to 9 rethrown errors; 6 dead initial values removed. No behaviour change.
- **Verification:** `lint:check` 0 on ESLint 9, with the same 17 findings as before; `test:unit` for dev-seed (901), question-info (22) and argument-condensation (30) green; the frontend specs for the touched files and the guards green (420).
- **Committed in:** `14b62f26c`.

**4. [Plan hold, D-06] ESLint 10 not landed**
- **Issue:** the plan's commit C requires every ESLint-10 finding fixed in code, with no disables (PROH-169-07). Three findings are an upstream false positive that has no code fix short of a dummy read. A fourth is a real defect whose fix changes keyboard focus behaviour.
- **Action:** the ESLint bump, the flag removal (19 sites) and the guard-docblock rewrite were reverted file by file (`git checkout -- <files>`). The hold is recorded in EVIDENCE § 3 / § 7 and in the todo. The local patch `tests/e2e-runs/169-gates/03/t2c-eslint10-config.patch` is kept for re-application.
- **Effect on the acceptance list:**
  - `v10_config_lookup_from_file` is still present at all 19 sites (correct on ESLint 9);
  - `yarn why eslint` resolves `9.39.5`;
  - the guard docblocks keep "MANDATORY".

**5. [Scope note] `@eslint/eslintrc` text in `security/audit-baseline.json`**
- The plan's grep `git grep -n '@eslint/eslintrc\|FlatCompat' -- ':!.planning' ':!yarn.lock'` still finds two `via` / `rationale` strings in the audit baseline. They describe the js-yaml path through ESLint 9's own `@eslint/eslintrc`.
- Baseline edits belong to 169-13's reviewed rewrite (no `--update-baseline`, PROH-169-02), so they were left as they are. No config, manifest or source file mentions either name.

**6. [Reverted, unrelated] `yarn lint:fix` autofixed a pre-existing unused-directive warning**
- `yarn lint:fix` on `mockOidcIssuerEntry.ts` left a whitespace-only line. The change is not the sorter's, so it was reverted. The warning stays one of the 17 baseline findings.

---

**Total deviations:** 3 auto-fixed (1 blocking tool issue, 1 rename-population miss, 15 source fixes under one item), 1 plan hold, 1 scope note, 1 unrelated autofix reverted.
**Impact on plan:** every truth except the ESLint-10 one holds. The ESLint-10 truth is held under D-06 with a re-check trigger, and no rule was disabled or weakened.

## Issues Encountered

- zsh does not word-split an unquoted `$VAR`. The first legitimacy call received all 30 names as one argument and returned a bogus `SLOP does-not-exist`. It was re-run through `xargs`, and all 30 names are listed in EVIDENCE § 2.

## User Setup Required

None.

## Known Stubs

None.

## Next Phase Readiness

- **169-04 (group 4, the test stack, run before group 3):** starts from the `2e3a79846` tree; lint is on ESLint 9.39.5 with import-x and svelte plugin 3. Every lint script keeps `--flag v10_config_lookup_from_file`.
- **Operator decision (EVIDENCE § 7, todo `2026-10-03-eslint-10-held-on-bindable-no-useless-assignment.md`):**
  - ESLint 10: option A (wait for eslint-plugin-svelte#1478) or option B (a scoped `**/*.svelte` rule configuration, which overrules PROH-169-07);
  - and whether to wire or delete the never-wired drawer focus return in `Layout.svelte`.
  - Once decided, re-applying ESLint 10 is the saved patch plus the four hold sites.
- **169-10:** the docs app's `eslint-config-prettier` devDependency is still unused by its own config (168 IN-01).
- **169-13:** the `@eslint/eslintrc` `via` text in `security/audit-baseline.json` goes stale once ESLint 10 lands.
- `@typescript-eslint/*` stays at 8.70.1: 8.71.0 was inside the 7-day window on 2026-10-03, and 8.70.1 caps TypeScript at `<6.1.0`.

## Self-Check: PASSED

- Files exist: `169-03-SUMMARY.md`, `169-planted-import-rules.sh`, the todo, `tests/e2e-runs/169-gates/169-03-group2/summary.tsv` (12 rows, all 0).
- Commits in `git log`: `d3383c7e4`, `340cce3ed`, `51e22ea78`, `087697975`, `14b62f26c`, `db01339e9`, `cb266766b`, `59f6acf8a`, `4fa365e41`, `2e3a79846`.
- Re-run at `2e3a79846`: `169-planted-import-rules.sh import-x` → 0; `git grep -n -E "eslint-plugin-import['\":]" -- '*.json' '*.mjs' '*.js' .yarnrc.yml ':!.planning'` → nothing.

---
*Phase: 169-dependency-bump-to-latest-safe-versions*
*Completed: 2026-10-03*
