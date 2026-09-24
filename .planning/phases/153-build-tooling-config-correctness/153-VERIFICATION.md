---
phase: 153-build-tooling-config-correctness
verified: 2026-08-29T20:17:58Z
verified_at_head: d356b7dfb0eadf80cea93c2c64d468144afefaa3
status: human_needed
score: 14/16 must-haves verified (12 VERIFIED + 2 PASSED-override; 2 findings)
behavior_unverified: 0
overrides_applied: 2
overrides:
  - must_have: "REVIEW-CFG-05 — the skill-drift audit CI step is observed running green against its script on a real workflow run"
    reason: "Unobservable from `integration/ship-12-squash`: `main.yaml` triggers only on push/PR to `main`. Independently re-measured: `audit-skill-drift.sh` exits 1 at HEAD with exactly `filters` and `matching`, both attributable to Phase 152 commits `dce80642f` and `87e02f40b` (verified by `git log --since=2026-08-17 -- packages/filters/src packages/matching/src`), filed for Phase 160 under operator ruling D9. Requirement correctly left `Pending` with the reason stated in REQUIREMENTS.md."
    accepted_by: "operator (verification brief, 2026-08-29)"
    accepted_at: "2026-08-29T20:00:00Z"
  - must_have: "REVIEW-CFG-08 — .svelte and .mjs files are linted and formatted on commit, and the gate starts from clean"
    reason: "Clause one is discharged and reproduced (`.lintstagedrc.json` glob reads `mjs,svelte`; zero `bash` wrappers). Clause two is not met and cannot be met inside the plan's scope: independently re-measured, 36 of 46 tracked `.mjs` files are eslint-red at HEAD, and `apps/docs` aborts eslint with `ERR_INTERNAL_ASSERTION` — both pre-existing, widened rather than created by this phase. Requirement correctly left `Pending`, deliberately unmarked."
    accepted_by: "operator (verification brief, 2026-08-29)"
    accepted_at: "2026-08-29T20:00:00Z"
findings:
  - id: F-1
    severity: warning
    title: "A build-tooling assertion the repo makes about itself is still false, and this phase is what falsified it"
    artifacts:
      - path: "scripts/assert-unit-test-coverage.mjs"
        issue: "Header comment (line 42) asserts \"`.lintstagedrc.json`'s first glob carries an unseparated `mjssvelte` token so `.mjs` matches no lint-staged pattern\" and concludes the file is \"linted by nothing\". Both halves were made false by 153-05 (`9973a2f69`). Re-measured: `npx eslint scripts/assert-unit-test-coverage.mjs` reports 58 errors, exit 1 — the file is linted, and it is red."
    missing:
      - "Rewrite the parenthetical to state the post-fix reality, or discharge `.planning/todos/pending/2026-08-29-153-stale-mjssvelte-comment-in-unit-test-coverage-guard.md`."
    note: "Filed, not hidden. But the phase goal is 'every build- and tooling-level assertion the repo makes about itself is true, and the ones that were never true are fixed rather than documented' — this one was documented."
  - id: F-2
    severity: warning
    title: "The phase record's 'all eleven lint:check links asserted present by name' claim is falsified by measurement"
    artifacts:
      - path: ".planning/phases/153-build-tooling-config-correctness/153-HYGIENE-CLASS-CLOSURE.md"
        issue: "Lines 269 and 363 state that every one of the eleven `lint:check` links is asserted present by name. Measured: 8 of 11 are. Repeated in `153-11-SUMMARY.md` at lines 203, 230, 251."
      - path: "package.json"
        issue: "Three links carry no standing membership assertion anywhere in the tree: `eslint --flag v10_config_lookup_from_file tests`, `yarn assert:i18n-catalog-namespaces`, `yarn assert:a11y-scan-wiring`. Demonstrated: deleting `yarn assert:a11y-scan-wiring` from the chain (11 links to 10) leaves all 28 gate specs passing; deleting `yarn assert:comment-hygiene` reddens `ciTypecheckGate.test.ts` immediately."
    missing:
      - "Either correct the claim to '8 of 11' in both documents, or add membership specs for the three unprotected links."
    note: "Not introduced by Phase 153 — the three unprotected links are Phase 147's and pre-date it. The defect is in the record, not the work. Phase 153's own three links are all asserted."
deferred:
  - truth: "REVIEW-CFG-05's real-workflow-run observation, and the first CI run of the `node-engine-range-negative-control` job 153-03 added (WINDOWS 179)"
    addressed_in: "Phase 163 (163-01) or the v2.15 merge to main"
    evidence: "`main.yaml` `on:` block restricts push and pull_request to `main`; ruling D3 assigns the `integration/**` + `workflow_dispatch` trigger change to 163-01. Filed: `.planning/todos/pending/2026-08-28-153-cfg-0{2,5}-ci-observation-blocked-on-pr-to-main.md`"
  - truth: "`audit-skill-drift.sh` returning to exit 0 (skills `filters` and `matching` refreshed)"
    addressed_in: "Phase 160"
    evidence: "Operator ruling D9; both drifts attributed to Phase 152 commits `dce80642f` (152-14) and `87e02f40b` (152-09), re-measured at this HEAD"
  - truth: "REVIEW-HYG-01's forced-line-break clause (64 survivors: 5 vendored `.css`, 59 in `apps/supabase/supabase/config.toml`)"
    addressed_in: "a future ruling on the `toml` family (WINDOWS 181, `open` by design)"
    evidence: "`153-HYGIENE-CLASS-CLOSURE.md` § REVIEW-HYG-01; the `.toml` family is covered by no ruling and adding it before a sweep is the D-N1(c) shape this milestone rejected"
  - truth: "REVIEW-HYG-02 (34 planning references survive across 15 files)"
    addressed_in: "a future sweep plus an enforcement decision"
    evidence: "Independently reproduced at this HEAD by `hygiene-grep-report.sh`: phase-ref 15, decision-id-bare 1, planning-path 2, task-id 16 = 34. `hygiene-grep-report.sh` is wired into no `package.json` script and no CI workflow."
human_verification:
  - test: "Decide the disposition of finding F-1 — the stale `mjssvelte` assertion in `scripts/assert-unit-test-coverage.mjs`."
    expected: "Either fix the comment in this phase's follow-through, or accept the filed todo as the discharge and record that the phase goal tolerates one documented-not-fixed assertion."
    why_human: "It is a scope decision, not a measurement. The todo argues it was out of 153-05's declared `files_modified` and that `scripts/` was a live collision surface; both are true."
  - test: "Decide the disposition of finding F-2 — correct the '11 of 11 asserted' claim, or close the gap by adding the three missing membership specs."
    expected: "Either `153-HYGIENE-CLASS-CLOSURE.md:269,363` and `153-11-SUMMARY.md:203,230,251` are corrected to 8 of 11, or specs are added for `eslint … tests`, `assert:i18n-catalog-namespaces` and `assert:a11y-scan-wiring`."
    why_human: "The unprotected links are Phase 147's, so closing the gap is a scope decision for a later phase; correcting the record is not."
  - test: "Confirm the two override acceptances above (REVIEW-CFG-05, REVIEW-CFG-08) match your intent, and that both requirements stay `Pending`."
    expected: "Both stay `Pending`. Nothing in this report marks a requirement."
    why_human: "Only the operator marks requirements. This verifier marked none."
  - test: "Add the missing `Pending` reason to REVIEW-CFG-08's row in `.planning/REQUIREMENTS.md:271`."
    expected: "The row reads like CFG-05's and SEED-03/04's — a bare `Pending` with the unmet clause named, e.g. `Pending — glob half proven both directions; the 'gate starts from clean' clause unmet (36/46 tracked .mjs eslint-red, apps/docs aborts)`."
    why_human: "The reason IS truthfully stated in `153-05-SUMMARY.md:184` and `153-NEGATIVE-CONTROL.md`, but the requirements table — the surface a later phase reads — carries a bare `Pending` with no note. A later planner reading only the table cannot tell why."
state_md_needs:
  - "`state_head: f4021931b` is stale — HEAD is `d356b7dfb`."
  - "`stopped_at: Completed 153-09-PLAN.md` is stale — 153-10 and 153-11 also completed."
  - "`status: executing` should become `verifying` / `complete`; `Plan: 11 of 11 executed — Phase 153 COMPLETE (verification still owed)` — verification is now owed no longer."
  - "The `**153-03 is HELD — it must be RE-PLANNED, not executed as written.**` paragraph is stale: 153-03 was re-planned at `d7338722f` and executed. Its scope-amendment todo is already in `.planning/todos/done/`."
  - "ROADMAP.md:282 checkbox is still `- [ ]` and the status table at :1318 still reads `In Progress` for Phase 153."
  - "`.planning/todos/pending/2026-08-28-153-packages-readme-required-devdeps-omits-tsup.md` is stale — the work landed at `d7edc3da2` under ruling D10; move it to `done/`."
---

# Phase 153: Build & Tooling Config Correctness — Verification Report

**Phase Goal:** Every build- and tooling-level assertion the repo makes about itself is true, and the ones that were never true are fixed rather than documented.
**Verified:** 2026-08-29T20:17:58Z, at HEAD `d356b7dfb`, tree clean before and after.
**Status:** human_needed — 2 findings for operator decision; 4 declared boundaries independently confirmed truthful.
**Re-verification:** No — initial verification.

Every number below is my own measurement, taken at this HEAD. Where a summary's figure disagrees
with the tree, the tree is what is recorded. Four guard flip-tests were run by making the tree red
and restoring it; **nothing was committed during those tests and `git status --porcelain` was empty
before and after each one.** No requirement was marked. `.planning/STATE.md` was not edited.

---

## Goal Achievement

### Observable Truths — the eight ROADMAP Success Criteria

| # | Truth | Status | Evidence (measured by this verifier) |
|---|---|---|---|
| SC1 | All eight `tsup`-invoking workspaces declare it, proven by a guard that fails **by name** | VERIFIED | `node scripts/assert-declared-binaries.mjs` → exit 0, `16 workspace(s) scanned, 20 build-script binary invocation(s). 0 violation(s).` **Flip test run live:** deleting `devDependencies.tsup` from `packages/core/package.json` → exit 1 with `[ERROR] … 'packages/core' invokes \`tsup\` … but no dependency that workspace declares provides a \`bin\` named \`tsup\``; restored → exit 0. |
| SC2 | `engine` corrected to `engines` in root + frontend, and the constraint **observed** to bind | VERIFIED (with a named boundary) | `git grep -n '"engine"' -- '*package.json'` → exit 1 (no hits). Both manifests carry `engines: {node: ">=22", yarn: "4.13", npm: "please-use-yarn"}`. **Flip test run live:** setting root `engines.node` to `">=99"` → `assert-node-engine` exit 1, `this Node is v24.14.1, and the root manifest declares "engines.node": ">=99"`; restored → exit 0. **Boundary I measured:** `yarn install --immutable` with `engines.node: ">=99"` exited **0** on this warm tree — the `preinstall` link did not fire. That is exactly the Yarn root-lifecycle-script caching `153-02-SUMMARY.md:44` measured and named as the reason the guard is wired **twice**. The uncached `lint:check` link (link 10) is what actually binds, and it does. |
| SC3 | `apps/frontend/vitest.config.ts` free of `__dirname` at its 11 sites; config loading exercised | VERIFIED | One textual occurrence remains, at `:6`, inside a `//` comment explaining the change — zero in code. 11 × `path.resolve(here, …)` replace the 11 measured sites. `npx vitest list --run` in `apps/frontend` → **exit 0**, 822 tests collected (every `$lib`/`$types`/`$voter`/`$candidate`/`$app/*`/`$env/*` alias resolved). `yarn test:unit` → frontend **54 files / 816 tests passed**, exactly the declared baseline. |
| SC4 | `.lintstagedrc.json` invokes its commands directly | VERIFIED | `grep -c bash .lintstagedrc.json` → **0**. `.husky/pre-commit` runs the turbo build on its own line, so the removed wrapper entries were redundant, not lost coverage. |
| SC5 | The `main.yaml` skill-drift step **observed running green on a real workflow run** | PASSED (override) | Not met, and correctly not claimed. `bash .claude/scripts/audit-skill-drift.sh` → **exit 1** (captured directly, not through `tail`), DRIFT for exactly `filters` and `matching`. I attributed both: `git log --since=2026-08-17 -- packages/filters/src packages/matching/src` returns `dce80642f` (152-14) and `87e02f40b` (152-09) — Phase 152, as the record claims. The script now runs to completion under `set -e` (all four `((VAR++))` sites are `((++VAR))` at `:53,:58,:66,:100`; zero post-increments remain). `main.yaml` `on:` restricts to `main`. REVIEW-CFG-05 is `Pending` with the reason stated. |
| SC6 | All three `tsbuildinfo` files + `supabase/.branches/_current_branch` untracked; `*.tsbuildinfo` ignored globally | VERIFIED | `git ls-tree -r --name-only HEAD \| grep -P '\.tsbuildinfo$\|(^\|/)\.branches/'` → **empty**. `git check-ignore -v` names **exactly one** rule per path (`.gitignore:29` `*.tsbuildinfo` ×3, `.gitignore:56` `supabase/.branches/`). All four files still on disk. The rules sit above the auto-generated section header. |
| SC7 | `shared-config/README.md` stops advertising `^1.0.0`; `supabase-types/src/index.ts` drops `.js` specifiers | VERIFIED | `grep -c '1\.0\.0' packages/shared-config/README.md` → **0**; the snippet is valid pasteable JSON declaring `@openvaa/shared-config: workspace:^` + `tsup/typescript/vitest: catalog:`. The barrel's four export lines are extensionless. Repo-wide `grep -rEn "from ['\"]\.\.?/[^'\"]*\.js['\"]" --include='*.ts' packages apps tests` → **0**. |
| SC8 | The fused `mjssvelte` glob split, so `.svelte`/`.mjs` are covered on commit, gate starting from clean | PASSED (override) | Clause one VERIFIED: `.lintstagedrc.json:2` reads `*.{html,js,jsx,cjs,mjs,svelte,ts,tsx,cts,mts,xml,yaml,yml}`; `.prettierignore:1` carries `.claude/`. Clause two NOT MET and correctly not claimed: I re-measured **36 of 46** tracked `.mjs` files eslint-red (`npx eslint` per file), and `scripts/assert-unit-test-coverage.mjs` alone reports 58 errors. The summary said "37 of 44" — the tree now says 36/46 (153-10 added two clean `.mjs` guards; one other was fixed). Direction identical, figures superseded by measurement. |

**Score: 6 VERIFIED + 2 PASSED (override) = 8/8 roadmap Success Criteria.**

### Observable Truths — cross-cutting, the ones the phase actually turns on

| # | Truth | Status | Evidence |
|---|---|---|---|
| X1 | `lint:check` is an **eleven**-link `&&` chain; the three added this phase are present and no pre-existing link was lost | VERIFIED | Split on `&&` gives exactly 11, in order: `turbo run lint`, `eslint … tests`, `yarn typecheck:tests`, `yarn typecheck`, `assert:i18n-catalog-namespaces`, `assert:a11y-scan-wiring`, `assert:comment-hygiene`, `assert:edge-env-defaults`, **`assert:declared-binaries`** (153-01), **`assert:node-engine`** (153-02), **`assert:env-pair-registry`** (153-10). `TURBO_FORCE=true yarn lint:check` → **exit 0**, all 11 links executed. |
| X2 | Every new guard is **provably falsifiable** — both halves | VERIFIED | Four flip tests run live, tree restored each time (see § Falsifiability Spot-Checks). Not one guard failed to go red. |
| X3 | Every guard emits a **non-zero census**, so a green cannot mean "examined nothing" | VERIFIED | declared-binaries `16 workspaces / 20 invocations`; env-pair-registry `17 Deno files, 1342 frontend files, 24 Deno reads, 118 PUBLIC_ reads, pairs derived: 4, .env.example assignments: 33`; comment-hygiene `files scanned: 1584, vendored excluded: 2, rules live: 2 of 2`; edge-env-defaults `files scanned: 17, checks live: 3 of 3`; node-engine names the version and the range. **153-10's original `pairs derived: 0` defect is gone — it derives 4 live pairs.** |
| X4 | The E2E cardinal rule is discharged by a **real run**, recorded as RAN with counts | VERIFIED | `153-NEGATIVE-CONTROL.md:2037-2085` records `E2E: RAN`, exit 0, 621 s, `report.stats` decoded from the HTML report's base64 payload: `total 150 / expected 150 / unexpected 0 / flaky 0 / skipped 0 / ok true`, per-test tally 150 seen all `expected`, 0 tests with >1 result, `retries: 0` locally, preflight `E2E PREFLIGHT OK …/apps/frontend`. **No text anywhere in the ledger implies the rule was satisfied by anything other than that run.** The one deferral discussed (ruling D1) pre-authorised the *branch*, not the result, and the branch taken was RAN. |
| X5 | No **self-invalidating scan** survived into the committed tree as an undetected false green | VERIFIED, with one documented catch | The CFG-06 predicate `git ls-files \| grep -P 'tsbuildinfo\|\.branches'` **does** still match — on `.planning/todos/pending/2026-08-28-153-tsbuildinfo-prevention-via-tsbuildinfofile.md`, its own filing. That was caught in-phase and is written up verbatim at `153-NC-ROW-4-CFG-06.md:150-165` with the anchored replacement, which I ran: empty. Both live gates are green over the current tree and neither excludes anything it should scan (`assert-comment-hygiene` errors out if a `VENDORED_EXCLUSIONS` entry excuses nothing). Phase 153's own three new spec files contribute **zero** of the 34 hygiene-report survivors. |
| X6 | The cacheable gates are green **on real work, not replays** | VERIFIED | `yarn build --force` → `0 cached, 14 total`, 14 successful. `yarn typecheck --force` → `0 cached, 22 total`, svelte-check 0 errors / 0 warnings. `TURBO_FORCE=true yarn lint:check` → `0 cached` at both turbo stages, exit 0. `TURBO_FORCE=true yarn test:unit` → `0 cached, 25 total`, 25/25. `yarn format:check` → prettier clean. The 153-07 `packages/matching/dist` torn-emit hazard is **not present**: every package's `dist` holds 1 `.d.ts` per 1 `.d.ts.map`. |
| X7 | 153-10's two scripts are honestly distinct, and the agreement checker never leaks a value | VERIFIED | Flip test: an env file with `PUBLIC_SUPABASE_URL=SECRETLEFT111` / `SUPABASE_URL=SECRETRIGHT222` → exit 1 naming the pair and both variable names, `The values are deliberately not printed here`; `grep -c SECRETLEFT111\|SECRETRIGHT222` over combined stdout+stderr → **0**. An absent member is reported `SKIP … unconfigured — IDENTITY_PROVIDER_TYPE (unset). This is NOT drift`. `check:env-pairs-agree` is deliberately **not** a `lint:check` link, and a spec asserts that absence. |
| X8 | 153-03 was re-planned and the **current** plan is what landed | VERIFIED | Current `153-03-PLAN.md` describes a standing CI negative control, not a `node-version-file` edit. Tree matches: `main.yaml:417` job `node-engine-range-negative-control` invokes `scripts/assert-node-engine.mjs` **by path**, asserts the discriminating message prefix `assert-node-engine: this Node is ` rather than a bare exit code, uses no `continue-on-error`, and `grep -n node-version-file .github/workflows/main.yaml` → **exit 1**. All four `node-version: 22.22.1` pins intact. |

**Combined score: 14/16 (12 VERIFIED + 2 PASSED-override).** The two not counted are findings F-1 and F-2 below.

---

## Falsifiability Spot-Checks — four guards made red and restored

The brief asked for at least two. I ran four. **Nothing was committed; `git status --porcelain` was
empty before and after each, and HEAD is unchanged at `d356b7dfb`.**

| Guard | Red half (injected) | Green half (restored) | Verdict |
|---|---|---|---|
| `assert-declared-binaries` | delete `devDependencies.tsup` from `packages/core/package.json` → exit **1**, `[ERROR] … 'packages/core' invokes \`tsup\` … no dependency … provides a \`bin\` named \`tsup\`` | exit **0**, `0 violation(s).` | FALSIFIABLE |
| `assert-comment-hygiene` (the `css` family 153-11 added) | split one `app.css` comment across two wrapped lines → exit **1**, `apps/frontend/src/app.css:10: rule 2 (D-A4) — this comment line ends without terminal punctuation and the line under it continues the same comment at the same indent.` | exit **0**, `files scanned: 1584 … 0 violation(s).` | FALSIFIABLE — the `.css`/`.scss` family is genuinely live, not decorative |
| `assert-env-pair-registry` | add `Deno.env.get('ZZTEST')` under `functions/` + `PUBLIC_ZZTEST` under `apps/frontend/src` → exit **1**, two `[ERROR]` lines naming `ZZTEST`, census rises to `pairs derived: 5` | exit **0**, back to `pairs derived: 4` | FALSIFIABLE, and the census moves with the tree |
| `assert-node-engine` | set root `engines.node` to `">=99"` → exit **1**, `this Node is v24.14.1, and the root manifest declares "engines.node": ">=99"` | exit **0**, `v24.14.1 satisfies ">=22" — OK` | FALSIFIABLE |

**Bonus flip test — which `lint:check` links are actually protected.** Removing
`yarn assert:a11y-scan-wiring` from the chain (11 links → 10) left **all 28 gate specs passing**.
Removing `yarn assert:comment-hygiene` reddened `ciTypecheckGate.test.ts` immediately with
`keeps \`yarn assert:comment-hygiene\` a blocking link of lint:check`. Both restored. This is the
measurement behind finding F-2.

---

## Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| root `package.json` `lint:check` | `scripts/assert-declared-binaries.mjs` | `yarn assert:declared-binaries`, link 9 of 11 | WIRED — asserted by `assertDeclaredBinariesGate.test.ts` (membership by `split('&&')`, never position) |
| root `package.json` `lint:check` | `scripts/assert-node-engine.mjs` | `yarn assert:node-engine`, link 10 of 11 | WIRED — asserted by `nodeEngineGate.test.ts`; also wired to `preinstall` (cache-dependent, see SC2) |
| root `package.json` `lint:check` | `scripts/assert-env-pair-registry.mjs` | `yarn assert:env-pair-registry`, link 11 of 11 | WIRED — asserted by `assertEnvPairRegistryGate.test.ts` |
| `main.yaml` job `node-engine-range-negative-control` | `scripts/assert-node-engine.mjs` | by path, so deleting the guard reddens the job | WIRED — but the job has never run (branch cannot trigger; WINDOWS 179 `open`) |
| `Deno.env.get('X')` + `PUBLIC_X` | `.env.example` cross-runtime block | derived pairing, never a hand list | WIRED — one contiguous block at `.env.example:2-47`, all four pairs adjacent |
| 8 workspace manifests `devDependencies.tsup` | `.yarnrc.yml` catalog `tsup` | `catalog:` specifier | WIRED — `yarn install --immutable` resolves clean |
| `.gitignore` `*.tsbuildinfo` / `supabase/.branches/` | the four untracked artefacts | `git check-ignore` | WIRED — exactly one rule each, no double-report |

**Gap:** three of the eleven `lint:check` links have **no** standing membership assertion —
`eslint --flag v10_config_lookup_from_file tests`, `yarn assert:i18n-catalog-namespaces`,
`yarn assert:a11y-scan-wiring`. See finding F-2.

---

## Requirements Coverage

| Requirement | Status in REQUIREMENTS.md | Verifier's independent measurement | Verdict |
|---|---|---|---|
| REVIEW-CFG-01 | Complete | Guard green, census 16/20, flip-tested both halves | SATISFIED |
| REVIEW-CFG-02 | Complete | Both manifests `engines`; guard flip-tested; `lint:check` link binds; `preinstall` half cache-dependent (documented) | SATISFIED |
| REVIEW-CFG-03 | Complete | 0 code sites, 11 `here` sites, `vitest list --run` exit 0, 816/816 | SATISFIED |
| REVIEW-CFG-04 | Complete | Zero `bash` in `.lintstagedrc.json` | SATISFIED |
| REVIEW-CFG-05 | **Pending** — reason stated inline in the table | Reason confirmed truthful: exit 1 with exactly `filters`+`matching`, both traced to Phase 152 commits; workflow untriggerable from this branch | PENDING, correctly |
| REVIEW-CFG-06 | Complete | Anchored `git ls-tree` predicate empty; one ignore rule each; files on disk | SATISFIED |
| REVIEW-CFG-07 | Complete | `1.0.0` count 0; 4 extensionless exports; repo-wide `.js`-specifier scan returns 0 | SATISFIED |
| REVIEW-CFG-08 | **Pending** — bare, **no reason in the table** | Reason IS truthfully stated in `153-05-SUMMARY.md:184` and the ledger; re-measured 36/46 `.mjs` eslint-red. But `REQUIREMENTS.md:271` carries a bare `Pending` unlike CFG-05/SEED-03/SEED-04 | PENDING, correctly — but see human-verification item 4 |
| REVIEW-HYG-01 | Pending | Reason confirmed: 64 forced line breaks survive (5 vendored `.css` excluded by ruling D7b, 59 in `apps/supabase/supabase/config.toml`, a family no ruling covers → WINDOWS 181) | PENDING, correctly |
| REVIEW-HYG-02 | Pending | Reason confirmed by re-running `hygiene-grep-report.sh` myself: **34** survivors (phase-ref 15, decision-id-bare 1, planning-path 2, task-id 16), exactly the figure the closure doc states | PENDING, correctly |

**No requirement was marked by this verifier.** Nothing appears force-marked: the only phase commits
touching `REQUIREMENTS.md` are the six per-plan completions for CFG-01..04, 06, 07; 153-11's
`files_modified` listed `REQUIREMENTS.md` but it correctly wrote nothing, and
`153-HYGIENE-CLASS-CLOSURE.md:260` states so explicitly and records that `requirements ready-ids`
reporting both HYG ids `ready` is a statement about frontmatter, not about the tree.

---

## Behavioural Spot-Checks

| Behaviour | Command | Result | Status |
|---|---|---|---|
| Binary-declaration guard runs and reports a census | `node scripts/assert-declared-binaries.mjs` | exit 0, `16 workspace(s) scanned, 20 … invocation(s). 0 violation(s).` | PASS |
| Node-engine guard compares the running Node | `node scripts/assert-node-engine.mjs` | exit 0, `v24.14.1 satisfies ">=22" — OK` | PASS |
| Env-pair registry derives pairs from source | `node scripts/assert-env-pair-registry.mjs` | exit 0, `pairs derived: 4 (…)` | PASS |
| Comment-hygiene guard scans a non-trivial census | `node scripts/assert-comment-hygiene.mjs` | exit 0, `files scanned: 1584 … rules live: 2 of 2` | PASS |
| Skill-drift audit runs to completion under `set -e` | `bash .claude/scripts/audit-skill-drift.sh` (exit captured directly) | **exit 1**, all 8 per-skill lines + `Checked: 5 Drifted: 2 Skipped: 3` | PASS (runs to completion); exit 1 is the accepted D9 state |
| Vitest config loads and collects | `npx vitest list --run` in `apps/frontend` | exit 0, 822 tests | PASS |
| Gate membership specs | `npx vitest run` on the 4 gate specs in `packages/dev-seed` | 4 files / 23 tests passed | PASS |
| Full chain | `TURBO_FORCE=true yarn lint:check` | exit 0, `0 cached` | PASS |
| Full build | `yarn build --force` | exit 0, `0 cached, 14 total` | PASS |
| Full typecheck | `yarn typecheck --force` | exit 0, `0 cached, 22 total` | PASS |
| Full unit suite | `TURBO_FORCE=true yarn test:unit` | exit 0, `0 cached, 25 total` | PASS |
| Formatting | `yarn format:check` | exit 0 | PASS |
| Value-agreement checker leaks no value | `node scripts/assert-env-pairs-agree.mjs <file with two distinct secrets>` | exit 1, pair and variable names printed, **0** occurrences of either secret | PASS |
| Install-time binding on a warm tree | `yarn install --immutable` with `engines.node: ">=99"` | **exit 0** — `preinstall` did not fire | SEE SC2 — the documented Yarn lifecycle-cache behaviour, and the reason the guard is wired twice |

**Not run, by instruction and on evidence:** `yarn db:lint:sql` (pre-existing red; its failing half
lints the live database and reads no working-tree file — **not scored**). The pre-commit hook
(pre-existing red via `apps/docs` `ERR_INTERNAL_ASSERTION` — **not scored**). `gsd-tools windows
fixed <id>` (mutates the ledger with no dry run — **not probed**; WINDOWS state read from the file
instead).

---

## Anti-Patterns Found

Scanned every non-`.planning` file the phase touched (39 paths, excluding `yarn.lock` and the
regenerated `.tsbuildinfo` blobs).

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| — | — | `TBD` / `FIXME` / `XXX` | — | **None.** Zero debt markers in any file this phase modified. |
| — | — | `TODO` / `HACK` / `PLACEHOLDER` | — | **None.** |
| `scripts/assert-unit-test-coverage.mjs` | 42 | stale self-assertion falsified by this phase | WARNING | Finding F-1 |

---

## Findings

### F-1 (WARNING) — a build-tooling assertion the repo makes about itself is still false, and this phase is what falsified it

`scripts/assert-unit-test-coverage.mjs:42`, verbatim:

> It is also linted by nothing (there is no root `lint` script, and `.lintstagedrc.json`'s first
> glob carries an unseparated `mjssvelte` token so `.mjs` matches no lint-staged pattern) —
> `prettier --write .` via `yarn format` is its only automated formatter.

Both halves of the parenthetical are now false. 153-05 split the token at `9973a2f69`. Re-measured:
`npx eslint --flag v10_config_lookup_from_file scripts/assert-unit-test-coverage.mjs` → **58 errors,
exit 1**. The file is linted, and it is red.

This is filed — `.planning/todos/pending/2026-08-29-153-stale-mjssvelte-comment-in-unit-test-coverage-guard.md`
diagnoses it precisely, quotes it, measures the eslint output, and explains that `scripts/` was
outside 153-05's declared `files_modified` and a live collision surface for 153-01 and 153-10 that
wave. That reasoning is sound. But the phase goal is *"…and the ones that were never true are
**fixed rather than documented**"*, and this one was documented. It is the only surviving instance
of the class the phase exists to close, and it is one the phase created. Operator's call.

### F-2 (WARNING) — the record's "all eleven links asserted present by name" is falsified by measurement

`153-HYGIENE-CLASS-CLOSURE.md:269` offers *"`yarn assert:comment-hygiene` is link **7 of 11**; all
eleven links asserted present by name"* as the evidence that REVIEW-HYG-01's *"wired into
`yarn lint:check` so the class cannot silently reopen"* clause is MET. The same claim recurs at
`:363` and at `153-11-SUMMARY.md:203,230,251`.

Measured: **8 of 11**. These three carry no standing membership assertion anywhere in the tree —

- `eslint --flag v10_config_lookup_from_file tests`
- `yarn assert:i18n-catalog-namespaces`
- `yarn assert:a11y-scan-wiring`

Demonstrated, not inferred: deleting `yarn assert:a11y-scan-wiring` from the chain (11 → 10) left
**all 28 gate specs passing**; deleting `yarn assert:comment-hygiene` reddened `ciTypecheckGate.test.ts`
on the spot. The only in-tree mention of the two unprotected `assert:*` links is prose inside a
comment at `edgeEnvDefaultsGate.test.ts:12`, which a deletion would not disturb.

**Scope note, in fairness:** all three unprotected links are Phase 147's and pre-date Phase 153.
Phase 153's own three links are each asserted, by its own three specs. The defect is in the
**record**, not the work — but the record is what a later phase reads, and the sub-claim it supports
("the class cannot silently reopen") is weaker than stated for three of the eleven links.

---

## Measurements that differ from the summaries

Reported because the standing rule is that the tree wins.

| Summary figure | Measured at this HEAD | Reading |
|---|---|---|
| "37 of 44 `.mjs` eslint-red" (153-05) | **36 of 46** | Superseded, not falsified: 153-10 added two clean `.mjs` guards after the measurement, and one other file was fixed. Direction and conclusion unchanged. |
| "all eleven links asserted present by name" (153-11, closure doc) | **8 of 11** | Falsified. Finding F-2. |
| env-pair census `1342 frontend file(s)` (ledger row 11) | **751** pre-build, **1342** post-`yarn build` | Reproduced once the generated paraglide message modules exist. Worth knowing: unlike `assert-comment-hygiene`, this guard enumerates the raw working tree with no `git ls-files` intersection, so its census figure — though not its pair derivation — is build-state dependent. |
| `.gitignore` "lines 1-54, header at `:55`" (153-06 truth) | rules at `:29` and `:56`, header now at `:62` | The edit added lines above the header, which moved it. Intent (hand-maintained region only) holds. |
| "…written after phase 152 closed … by phases 153 and 155" (closure doc) | all 24 are in `apps/supabase/supabase/functions/**` and `packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts` | Those are **Phase 155's** files. Phase 153's own three new spec files contribute **zero** hygiene-report survivors. The attribution is one phase too generous to itself in the wrong direction. |

---

## Human Verification Required

Four items, all decisions rather than tests. See the `human_verification` block in the frontmatter
for the structured form.

1. **Disposition of F-1** — fix the stale `mjssvelte` assertion in `scripts/assert-unit-test-coverage.mjs`, or accept the filed todo as its discharge.
2. **Disposition of F-2** — correct the "11 of 11" claim in two documents to 8 of 11, or add the three missing membership specs.
3. **Confirm the two overrides** (CFG-05, CFG-08) match your intent, and that both requirements stay `Pending`. Nothing here marks a requirement.
4. **Add the missing `Pending` reason** to `REQUIREMENTS.md:271` for REVIEW-CFG-08 — it is the only one of the four Pending ids whose table row is bare, and the table is what a later planner reads.

---

## Gaps Summary

**The phase goal is achieved, with two documented residues and four correctly-declared boundaries.**

Every mechanical defect the phase set out to fix is fixed, and — the part that actually matters —
**every fix that could be guarded is guarded by a gate I made go red and then green again**. Four
flip tests, four guards, eight halves, tree clean throughout. The three links this phase added to
`lint:check` are all present, all asserted by name, all examining a non-zero census. 153-10's
"gate that examined nothing" defect is gone: it derives four live pairs and rises to five when I
plant a fifth. The E2E cardinal rule is discharged by a real run whose payload the ledger decoded
rather than trusting a console tail, and no text in the phase record implies otherwise.

The four Pending requirements are Pending for reasons I reproduced independently, not for
convenience: the skill-drift exit 1 traces to two Phase 152 commits, the 34 hygiene survivors
reproduce exactly, the 64 forced line breaks are 59-in-one-`.toml` plus 5 vendored, and the
"gate starts from clean" clause fails on 36 of 46 `.mjs` files. Nothing was force-marked; the one
plan that listed `REQUIREMENTS.md` in `files_modified` correctly wrote nothing to it and said so.

What keeps this short of a clean pass is small but real, and both items are of the same species the
phase exists to eliminate — **an assertion the repo makes about itself that is no longer true.**
F-1 is one the phase created and then documented instead of fixing. F-2 is one the phase's own
closing record states, and it is measurably false for three of eleven links. Neither blocks the next
phase. Both should be dispositioned rather than inherited.

---

_Verified: 2026-08-29T20:17:58Z at `d356b7dfb`_
_Verifier: Claude (gsd-verifier) — all figures independently measured; no requirement marked; STATE.md not edited_
