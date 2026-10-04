# Phase 167 — Proposed requirement IDs (for the orchestrator to register)

The roadmap entry says "Requirements: TBD — registered at planning". These nine IDs are taken from
`167-RESEARCH.md` § Phase Requirements (one per roadmap success criterion, as amended by the locked decisions) and
are already listed in the plans' `requirements` frontmatter. The planner did not edit `.planning/REQUIREMENTS.md` or
`.planning/ROADMAP.md` (concurrent planners share this worktree).

**Registration note (from research):** add a `### Origin/main Vestige Cleanup (Phase 167)` section, nine Traceability
rows, and a rollup row `167 — Origin/main Vestige Cleanup | VEST-01..09 | 9`. Recount the counters from the table rows
rather than incrementing them — the command of record is
`awk '/^## Traceability$/{f=1;next} /^### Phase → requirement rollup$/{f=0} f && /^\| / && !/^\| Requirement \|/ && !/^\|[-: |]*\|$/' .planning/REQUIREMENTS.md | wc -l`
(research measured 110 before registration; Phase 166's IDs, if registered first, change that number). Update the
rollup `Total`, the coverage line and ROADMAP § Phase 167 `**Requirements**:` in the same commit.

| ID | Description | Decisions | Plans |
|----|-------------|-----------|-------|
| VEST-01 | `safeGetSession.test.ts` pins the exact `getUser` **and** `getSession` count in every case and fails, with a named error, on any other client member access. The strengthened assertions were observed failing against the V1 (no memo) and V2 (extra read) working-copy variants — V2 against both the old and the new assertions — and the Proxy guard against V3; the shipped source is unchanged. | D-06, D-07, D-08 | 167-01 |
| VEST-02 | `BACKEND_API_TOKEN` is gone from `apps/frontend/src/lib/server/constants.ts` and all 7 auth test mocks. | D-09 | 167-02 |
| VEST-03 | The `/api/cache` proxy, `PUBLIC_BROWSER_BACKEND_URL` / `PUBLIC_SERVER_BACKEND_URL`, `PUBLIC_CACHE_ENABLED`, the four `CACHE_*` constants, `disableCache`, `cachifyUrl`, `hasAuthHeaders`, `cacheProxy`, `flat-cache` and the env/deployment-template and in-code cache mentions are removed in one commit. Test sample paths no longer name `/api/cache`. Both adapter todos carry the dated note and stay open. | D-09, D-10, D-11 | 167-02, 167-06 |
| VEST-04 | No workspace declares a dependency it does not use, and `@openvaa/llm` declares the `js-yaml` it imports. `eslint-plugin-svelte` is kept and imported explicitly, with lint output proven unchanged before and after. Lint rules are proven to still fire after the ESLint-dependency removals. The `security/audit-baseline.json` lodash row and note count are hand-edited in the same commit as the `@testing-library/jest-dom` removal. | D-05, D-12–D-20 | 167-03, 167-04 |
| VEST-05 | `apps/docs` `OpenVAALogo.svelte` and `PeerNavigation.svelte` use runes, the logo renders unchanged for both call sites, and all ten sweep-#14 patterns plus `$$Props` and `$app/stores`, run with `git grep -P`, return 0. | D-03, D-04, D-21 | 167-05, 167-06 |
| VEST-06 | The env-dir todo is closed to `done/` with its three-point resolution note, and the `vite.config.ts` comment describes today's loading. | D-22 | 167-05, 167-06 |
| VEST-07 | `gate-evidence/` was inspected (categories only, no values), deleted and confirmed absent; VESTIGES and the 261001-n8y SUMMARY each record the deletion; the two tracked `260930-kxi` files are untouched. | D-23 | 167-06 |
| VEST-08 | Reconciliation: the D-02 and residue todos are filed, the VESTIGES deferred rows this phase fixed are marked `fixed` with hashes, and every touched comment is read against Comment Hygiene with no new hygiene-report hits relative to the phase-base baseline. | D-02, D-10, D-27, D-28 | 167-06 |
| VEST-09 | Gates: typecheck, `lint:check`, `format:check`, `test:unit`, `yarn build` (frontend + docs), docs `svelte-check`, the same-moment audit "no new advisory" set comparison, and one clean full E2E run under the cardinal rule. | D-25, D-26 | 167-06 |
