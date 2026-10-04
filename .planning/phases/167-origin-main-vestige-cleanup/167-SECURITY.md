---
phase: "167"
slug: "origin-main-vestige-cleanup"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-04"
---

# Phase 167 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| request hook → Supabase Auth | `safeGetSession` decides which user a request runs as; the phase pins its round trips in a test and leaves the code unchanged | access token, verified user identity (credential-grade) |
| working copy → git history | temporary variants of an auth module, lint-red probes and render probes must never cross into a commit | source code (integrity) |
| anonymous client → `/api/cache` | the removed route was reachable without the hook gate (`isApiRoute` resolves API routes before any gate) | caller-chosen absolute URL, server-side fetch result |
| server load → HTML hydration payload | everything a load returns is readable by client JavaScript; the rewritten `+layout.server.ts` docblocks document that rule | session-derived values (must exclude tokens) |
| repository → deployments | `render.example.yaml`, `.env.example` and compose files are copied into real deployments | env-var names, disk mounts (configuration) |
| npm registry → yarn.lock | a manifest edit could pull a new version; registry-latest js-yaml 5.x was flagged `[SUS] too-new` at plan time | third-party package code (supply chain) |
| published @openvaa/llm → its consumers | an undeclared runtime import fails for anyone installing the package without monorepo hoisting | module resolution (availability) |
| manifests → installed tree | removing a declaration can leave a module resolvable only through hoisting, or not at all | module resolution (availability) |
| lint config → CI gate | a config that silently drops rules, or fails to load, can still produce a "clean" result | lint findings (gate integrity) |
| audit baseline → CI audit gate | the baseline is the list of advisories the gate does not report | accepted advisory ids (gate integrity) |
| docs component props → rendered `svg` attributes | `OpenVAALogo` now forwards caller attributes onto its element | component props (docs app only) |
| untracked evidence → planning artefacts | gate-evidence logs may hold local keys or env values; planning files are committed and pushed | possible secrets (confidentiality) |
| E2E harness → served application | a run must prove it tested this checkout and this project | run evidence (non-repudiation) |
| advisory database → audit gate | the advisory database changes within hours, independently of the tree | advisory sets (gate integrity) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-167-01 | Tampering | `safeGetSession.ts` variants V1/V2/V3 (167-01) | high | mitigate | `git diff --exit-code 8c519ac97 HEAD -- apps/frontend/src/lib/supabase/safeGetSession.ts` exits 0 (also at phase end `d089e9019`); `git log 8c519ac97..HEAD` over the source + test lists only `096896f47`, whose `--stat` is the single file `safeGetSession.test.ts`; 167-01-SUMMARY "Negative controls" records `git checkout --` after every variant | closed |
| T-167-02 | Elevation of Privilege | session verification memo (167-01) | medium | mitigate | auth source unchanged (see T-167-01); `apps/frontend/src/lib/supabase/safeGetSession.test.ts` holds 12 `expect(getUser).toHaveBeenCalledTimes(` + 12 `expect(getSession).toHaveBeenCalledTimes(` pins across 10 cases, `class UnexpectedClientAccess`, the `strict(` Proxy wrapper and `afterEach` asserting `expect(unexpectedAccesses).toEqual([])`; V1/V2 controls observed red (167-01-SUMMARY; 167-VERIFICATION truth 1 re-ran the mutations independently) | closed |
| T-167-03 | Repudiation | negative-control evidence (167-01) | low | mitigate | 167-01-SUMMARY section "Negative controls" records, for V3, V2-old, V1 and V2-new, the vitest command, the directly read `exit=1` and every failing test name, plus the restoring `git diff --exit-code` | closed |
| T-167-04 | Information disclosure | `routes/api/cache/+server.ts` server-side fetch of a caller-chosen URL (167-02) | high | mitigate | `test ! -e apps/frontend/src/routes/api/cache` exits 0 on HEAD; `git ls-files apps/frontend/src/routes/api` lists no cache route; `git grep -E "api/cache\|cacheProxy" -- apps/frontend/src packages` and a `get('resource')` grep both exit 1; build-output check (`manifest.js` count 0) recorded in 167-02-SUMMARY coverage D1 | closed |
| T-167-05 | Information disclosure | cache branch in `UniversalAdapter.fetch` (167-02) | medium | mitigate | `git grep -E "cachifyUrl\|hasAuthHeaders\|disableCache\|PUBLIC_CACHE_ENABLED" -- ':!.planning' ':!apps/docs'` exits 1 on HEAD; `apps/frontend/src/lib/api/base/universalAdapter.ts` anchor `async fetch(url: string \| URL, init: RequestInit = {}, { authToken }: FetchOptions = {})` passes the URL straight to `this.#fetch(url, fullInit)`; `universalAdapter.type.ts` `export type FetchOptions` has only `authToken?` | closed |
| T-167-06 | Denial of service | deployments still setting removed env keys or mounting the cache disk (167-02) | low | accept | Accepted Risks Log AR-167-01; removed keys have zero readers outside docs (whole-tree grep for `BACKEND_API_TOKEN`, `CACHE_*`, `PUBLIC_*_BACKEND_URL`, `PUBLIC_CACHE_ENABLED`, `/var/data/cache` hits only the docs page below); operator note recorded in 167-02-SUMMARY and carried into `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md` ("Detach the disk and delete those variables; any left in place have no effect") | closed |
| T-167-07 | Information disclosure | rewritten `+layout.server.ts` docblocks (167-02) | medium | mitigate | `assert-no-session-in-loads` appears once in each of `apps/frontend/src/routes/+layout.server.ts`, `routes/admin/+layout.server.ts`, `routes/candidate/+layout.server.ts`; root `package.json` `"lint:check"` chain contains `yarn assert:no-session-in-loads`, which runs `scripts/assert-no-session-in-loads.mjs` (present) | closed |
| T-167-08 | Tampering | `js-yaml` declaration in `@openvaa/llm` (167-03) | high | mitigate | commit `879d0ccf0` touches only `packages/llm/package.json` + `yarn.lock`; its `yarn.lock` diff adds 0 and removes 0 `version:`/`resolution:` lines; at phase end `d089e9019` the catalog is `js-yaml: ^4.1.0` resolving to the already-locked `js-yaml@npm:4.3.2`; RESEARCH "Package Legitimacy Audit" records the `[SUS] too-new` flag as applying to an uninstalled version. Note: HEAD now resolves 5.4.2 via Phase 169's own commit `d1b3332d5`, outside this phase's register | closed |
| T-167-09 | Denial of service | `@openvaa/llm` consumers (167-03) | medium | mitigate | `packages/llm/package.json` `"dependencies"` contains `"js-yaml": "catalog:"` on HEAD; `packages/llm/src/prompts/promptRegistry.ts` is the importer (`import * as yaml from 'js-yaml'`); built `packages/llm/dist/index.js` imports `js-yaml` externally; 167-03-SUMMARY records `YAMLException` 26 to 0 inlined hits and the `packages/question-info` runtime import exit 0 | closed |
| T-167-10 | Tampering | ESLint rule coverage after the ESLint-dependency removals (167-04) | high | mitigate | `apps/frontend/eslint.config.mjs` has `import svelte from 'eslint-plugin-svelte'` and spreads `svelte.configs.prettier` (key renamed by Phase 169's plugin move), with no `FlatCompat`/`@eslint/eslintrc`; every module it imports is declared in `apps/frontend/package.json`; both guarded rules defined in `packages/shared-config/eslint.config.mjs` (`'@typescript-eslint/no-explicit-any'`, `'simple-import-sort/imports'`); 167-04-SUMMARY "D-16: lint-red records" shows exit 1 naming both rule ids for frontend and docs (before and after), and empty normalised before/after findings diffs | closed |
| T-167-11 | Repudiation | `security/audit-baseline.json` (167-04) | high | mitigate | only phase commit touching the baseline is `ddcd396ef`; diff `8c519ac97..d089e9019` is exactly one removed object (`"id": 1115806`, lodash via `@testing-library/jest-dom`) plus the `note` line ("These 69 findings (63 high, 6 critical)"); row counts 70/64/6 to 69/63/6 match the note; `"recorded": "2026-09-03"` unchanged, so `--update-baseline` was not run; `1115806` absent on HEAD; `packages/dev-seed/tests/auditBaselineShape.test.ts` present | closed |
| T-167-12 | Denial of service | workspaces losing a dependency they still use (167-04) | medium | mitigate | on HEAD, all 23 removed (workspace, package) pairs have 0 importers (import/require grep plus plain-string `git grep -F` excluding manifests and markdown) and are undeclared: frontend `@eslint/eslintrc`, `@eslint/js`, `@typescript-eslint/eslint-plugin`, `@testing-library/jest-dom`, `@vitest/coverage-v8`, `flat-cache`; llm `jsonrepair`; question-info and argument-condensation `js-yaml`/`@types/js-yaml`; argument-condensation `dotenv`; the eleven docs devDependencies; 167-04-SUMMARY gate table records builds and unit tests of every touched workspace plus `TURBO_FORCE=true yarn build` exit 0 | closed |
| T-167-13 | Tampering | lint-red probe files and the docs probe config (167-04) | low | mitigate | `apps/frontend/src/lib/zzLintRedProbe.ts`, `apps/docs/src/lib/utils/zzLintRedProbe.ts`, `apps/docs/.lint-red-probe.eslint.config.js` absent; `git log --all` over the three paths returns 0 commits; `git ls-files` has no `zzLintRedProbe`/`lint-red-probe` path | closed |
| T-167-14 | Tampering | `OpenVAALogo.svelte` rest-props spread (167-05) | low | accept | Accepted Risks Log AR-167-02; confirmed the only callers are `apps/docs/src/lib/components/Header.svelte` (`<OpenVAALogo />`) and `Footer.svelte` (`<OpenVAALogo color="secondary" size="sm" />`), both with literal props | closed |
| T-167-15 | Tampering | render-probe scratch files under `apps/docs/.render-probe/` (167-05) | low | mitigate | `test ! -e apps/docs/.render-probe` exits 0 on HEAD; `git log --all` over the path returns 0 commits; no tracked path matches `render-probe`; 167-05-SUMMARY "Clean-up" records the `git status --porcelain -- apps/docs` check | closed |
| T-167-16 | Information disclosure | `gate-evidence/` contents of quick task 261001-n8y (167-06) | high | mitigate | `.planning/quick/261001-n8y-…/gate-evidence` absent; `git log --all` over it returns 0 commits and `git ls-files` has no such path; value-shaped grep (JWT, `AKIA`, PEM armour, `sk-`) over the whole phase dir prints nothing; 167-06-SUMMARY "D-23" records counts-only scans and categories-only reads; deletion cited in `261001-n8y-VESTIGES.md` and `261001-n8y-SUMMARY.md` | closed |
| T-167-17 | Repudiation | E2E evidence (167-06) | medium | mitigate | `tests/e2e-runs/167-gate/` (gitignored by `.gitignore` `tests/e2e-runs/`): `exit` 0, `preflight-successes` 1, `preflight-failures` 0, `results.json` stats expected 171 / unexpected 0 / flaky 0 / skipped 0, `head` `275250054…`; non-`.planning` diff `275250054..d089e9019` is empty, so the run covers the shipped code | closed |
| T-167-18 | Tampering | tracked `260930-kxi` gate-evidence files (167-06) | medium | mitigate | `git diff --quiet 8c519ac97 -- …/260930-kxi-…/gate-evidence/kxi-g-status.txt` and `…/pgtap-summary.txt` exit 0 at both phase end `d089e9019` and HEAD | closed |
| T-167-19 | Tampering | audit "no new advisory" gate (167-06) | medium | mitigate | 167-06-SUMMARY "D-25: same-moment audit" records the `git archive 8c519ac97` BEFORE vs HEAD AFTER pair measured twice, `[NEW]` header 9 = extracted set 9 on both sides (non-vacuity), `comm -13` empty; baseline `"recorded"` unchanged across the phase (see T-167-11), so `--update-baseline` was not run | closed |
| T-167-SC | Tampering | npm/pip/cargo installs (all plans; de-duplicated) | high | mitigate (167-02/03/04) + accept (167-01/05/06) | phase-wide `git diff -U0 8c519ac97 d089e9019 -- yarn.lock` adds no `version:`/`resolution:` line (only shortened descriptor headers and the two llm `catalog:` lines); per commit: `837b895c4` removes 11 resolutions and adds 0, `879d0ccf0` adds 0 and removes 0, `ddcd396ef` removes 60 and adds 0; the accept portion is in Accepted Risks Log AR-167-03 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-167-01 | T-167-06 | Removed env keys and the cache disk are inert: nothing reads them under `$env/dynamic/*`. The operator clean-up note was recorded for Phase 168 and now appears on the docs deployment page. | plan-time disposition (167-02) | 2026-10-02 |
| AR-167-02 | T-167-14 | The only callers of the docs `OpenVAALogo` are the docs app's own `Header` and `Footer`, which pass literal props. Svelte escapes attribute values, and no user-controlled input reaches the props. | plan-time disposition (167-05) | 2026-10-02 |
| AR-167-03 | T-167-SC (167-01, 167-05, 167-06 portions) | These plans install nothing and change no manifest or lockfile. Their commits (`096896f47`, `dad0754fe`, `a02f3362e`, `275250054`) touch no `package.json`, `yarn.lock` or `.yarnrc.yml`. | plan-time disposition (167-01, 167-05, 167-06) | 2026-10-02 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-04 | 20 | 20 | 0 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-04
