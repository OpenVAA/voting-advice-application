---
phase: 168-docs-site-rewrite-strapi-to-supabase
verified: 2026-10-02T00:00:00Z
status: passed
score: 7/7 must-haves verified
covered_files:
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-01-PLAN.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-01-SUMMARY.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-01.1-PLAN.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-01.1-SUMMARY.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-02-PLAN.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-02-SUMMARY.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-03-PLAN.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-03-SUMMARY.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-04-PLAN.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-04-SUMMARY.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-05-PLAN.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-05-SUMMARY.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-06-PLAN.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-06-SUMMARY.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-07-PLAN.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-07-SUMMARY.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-08-PLAN.md
  - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-08-SUMMARY.md
  - apps/docs/README.md
  - apps/docs/eslint.config.js
  - apps/docs/mdsvex.config.js
  - apps/docs/package.json
  - apps/docs/scripts/check-research-quotes.ts
  - apps/docs/scripts/docs-scripts.config.ts
  - apps/docs/scripts/generate-all-docs-and-validate.ts
  - apps/docs/scripts/generate-component-docs.ts
  - apps/docs/scripts/generate-navigation-config.ts
  - apps/docs/scripts/generate-route-map.ts
  - apps/docs/scripts/move-generated.ts
  - apps/docs/scripts/utils/links.ts
  - apps/docs/scripts/validate-links.ts
  - apps/docs/src/lib/components/Footer.svelte
  - apps/docs/src/lib/components/Header.svelte
  - apps/docs/src/lib/components/Navigation.svelte
  - apps/docs/src/lib/components/NavigationItem.svelte
  - apps/docs/src/lib/components/ReferenceList.svelte
  - apps/docs/src/lib/components/ResearchQuote.svelte
  - apps/docs/src/lib/components/TableOfContents.svelte
  - apps/docs/src/lib/layouts/MdLayout.svelte
  - apps/docs/src/lib/navigation.config.ts
  - apps/docs/svelte.config.js
  - package.json
covered_digest: "v2:sha256:a3ba2d75331519b8190cdc9f29aa3d4a6c3dda12e6922f7ea2a6cb2f0c83683a"
behavior_unverified: 0
overrides_applied: 0
---

# Phase 168: Docs-Site Rewrite (Strapi to Supabase) Verification Report

**Phase Goal:** Every page of the docs site describes the system that exists (Supabase backend, Edge Functions, current i18n, dev-seed and env model, current features and settings), with no Strapi-era page, banner or nav entry left, and its information architecture reorganised where the old structure no longer fits.
**Verified:** 2026-10-02
**Status:** passed
**Re-verification:** No, initial verification
**Worktree:** `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd` (HEAD `35f835b14`, tree clean before and after every check below; every injection was reverted and `git status --short` re-read empty)

## Gates re-run by this verifier (exit status read directly, not through a pipe)

| Gate | Command | Exit | Evidence |
| --- | --- | --- | --- |
| Link check | `yarn workspace @openvaa/docs validate:links --check` | 0 | 186 md files, 304 internal links, 82 nav leaves, 26 redirect stubs, 51 anchors, 386 GitHub links, 42 inbound refs. Every class (md-link, svelte-href, nav-route, anchor, stub, github-path, inbound) is 0. `Total findings: 0`. `git status` empty afterwards, so `--check` wrote nothing. |
| ResearchQuote gate | `yarn workspace @openvaa/docs check:research-quotes --base "$(cat $GE/base-rev.txt)" --component-base "$(cat $GE/component-base-rev.txt)"` | 0 | Base `0ec229dfe`, component base `6090476cc`. 22 spans at base, 22 now. Frozen components `ResearchQuote.svelte`, `ReferenceList.svelte`, `Author.svelte` reported identical to the component base. |
| Docs check | `yarn workspace @openvaa/docs check` | 0 | `652 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |

First attempt note: my first link-check invocation redirected to `/tmp/x`, which is a directory on this host, so that shell wrote nothing and reported exit 1. That is a harness mistake, not a docs result. I re-ran with output to the scratchpad and got exit 0 as shown above.

Additional independent checks (beyond the three requested):

| Check | Result |
| --- | --- |
| `yarn workspace @openvaa/docs lint:full` (prettier + eslint) | exit 0 |
| Claim ledgers: `node scripts/check-claims.mjs ledger 168-03..07-CLAIMS.md` | exit 0, 2176 rows, all pass |
| One-character injection into a ResearchQuote span (`publishers-guide/preparing/matching`) | gate went red (exit 1, `block 1 differs at character 19`); reverted with `git checkout`, tree clean |
| `yarn workspace @openvaa/docs generate:navigation` then docs-dir `prettier --write`, `git diff` | empty: `navigation.config.ts` has no diff and no `// New` / `// Removed` marker |
| Debt-marker scan (`TBD`/`FIXME`/`XXX`) over 105 non-generated changed files under `apps/docs` | no hit |

## Goal Achievement

### Observable Truths (ROADMAP success criteria, the contract)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| SC1 | Every VESTIGES page is rewritten, merged or deleted; `navigation.config.ts` drops the four Strapi entries and links the new structure | VERIFIED | `grep -i -E "strapi\|admin tools plugin\|Registration Process" apps/docs/src/lib/navigation.config.ts` finds nothing. The nav carries `Backend (Supabase)` (line 112). The audit ledger shows all 26 removed or moved URLs as redirect stubs, and the link checker's `stub` and `nav-route` classes are 0. Regenerating the navigation yields no diff. The only remaining Strapi mention under `apps/docs` is `about/roadmap`, line 6, which the roadmap explicitly allows. |
| SC2 | Every other page is audited as current/updated/deleted; ResearchQuote blocks byte-identical to the base | VERIFIED | `168-DOCS-AUDIT.md` § Pages has 94 rows. I derived the base page set myself (`git ls-tree -r 0ec229dfe`, 93 hand-written pages) and compared routes: 0 pages missing from the ledger and 0 extra. Verdicts: 26 current, 41 updated, 26 redirect stub, 1 generated-set row (`regenerated; EntityCardAction removed`), 0 pending. The span gate exits 0 and went red on my own injection. The component re-anchor is covered under DOCS-02 below. |
| SC3 | VESTIGES sweeps #1, #2, #5-#7, #9, #10 (+ D-21 patterns) return no hit under `apps/docs` other than recorded exceptions | VERIFIED | I re-ran each with `git grep` and read the rc. #1 returns rc 0 with a single line, the roadmap history line (a recorded exception). #2, #5, #6, #7, #9, #10, the Svelte 4 pattern and `[[lang` all return rc 1, no hit. The "legacy Strapi backend" banner returns rc 1. Controls at base all hit (168-08-sweeps.md), so the patterns can fail. `docker` still has 8 hits, all recorded in the ledger; they describe real files (`apps/frontend/Dockerfile`, `docker-compose.dev.yml`, the `docker-image-build` workflow). |
| SC4 | Every factual claim verified against the codebase | VERIFIED | `check-claims.mjs ledger` passes 2176 content-anchored rows when I re-ran it. The independent `gsd-doc-verifier` pass covered 58 changed pages (1022 claims, 0 failures, 168-08-verifier-reconciliation.md). Its caveats are recorded honestly: tallies are by hand and runtime flows were not run. Independent spot check by me: all 32 env-var-shaped names on the environmental-variables page exist in code outside `apps/docs` and `.planning`, and the `yarn db:*` scripts named on the seed-data page exist. |
| SC5 | Candidate-flow pages match the current flows; related todos cross-checked and updated or closed | VERIFIED | `register-page-registrationkey-method.md` and `configurable-mock-data.md` are in `.planning/todos/done/` with resolutions. `password-reset-code-method.md` stays in `pending/` with a dated 2026-10-02 reading: the `?code=` branch is unreachable from in-repo paths and the todo is left open with a reason (D-18). That satisfies "updated or closed". |
| SC6 | Broken docs scripts dealt with, or the todo left open with a reason | VERIFIED | `2026-08-28-broken-docs-script-references.md` is in `todos/done/`. `typedoc` is gone from `apps/docs`, root `package.json` and `yarn.lock` (`git grep` rc 1 each). `@playwright/test` is gone from `apps/docs/package.json` and `playwright.config.ts` is deleted. `glob` is declared (`^11.0.0`). No `EntityCardAction` file is tracked under `apps/docs`. |
| SC7 | Gates: docs build, docs lint/check, link check | VERIFIED | Link check, check and `lint:full` re-run by me, all exit 0. Build is recorded at exit 0 in `gate-evidence/168-08-gates.md` (gate 6), and the generator was shown idempotent. I did not re-run the docs build or root `lint:check`; those are relied on from the recorded evidence. |

**Score:** 7/7 truths verified (0 present, behavior-unverified)

### Requirements Coverage

Cross-reference: PLAN frontmatter `requirements:` unions to DOCS-01..DOCS-08 (01: 02/04/07; 01.1: 06/08; 02: 01/02/07; 03-05: 01/03/04; 06: 01/03/04/05; 07: 01/02/03/04/06; 08: all). Each ID is a ticked row in `.planning/REQUIREMENTS.md` § Docs Site and `Complete` in the traceability table (lines 438-445), with the rollup `168 | DOCS-01..08 | 8`. No orphaned requirement: REQUIREMENTS.md maps no other ID to Phase 168.

| Requirement | Source plans | Status | Evidence |
| --- | --- | --- | --- |
| DOCS-01 | 02,03,04,05,06,07,08 | SATISFIED | Nav has no Strapi title; nav regeneration idempotent with no marker; 26 stubs resolve. |
| DOCS-02 | 01,02,07,08 | SATISFIED | See the DOCS-02 note below. |
| DOCS-03 | 03-08 | SATISFIED | Sweeps re-run by me as in SC3. |
| DOCS-04 | 01,03-08 | SATISFIED | Ledger script 2176 rows pass; verifier pass 0 failures; `check-claims.mjs commands` reported 201 `yarn` commands in 83 pages, all resolving (recorded, not re-run). Safe-command runs are in `168-08-d11-runs.md`. |
| DOCS-05 | 06,08 | SATISFIED | Todo dispositions as in SC5. |
| DOCS-06 | 01.1,07,08 | SATISFIED | As in SC6. |
| DOCS-07 | 01,02,08 | SATISFIED | `--check` covers all seven classes, wrote nothing, and each class has an injected-fault control recorded in `gate-evidence/168-01-link-checker-nc.md`. |
| DOCS-08 | 01.1,08 | SATISFIED | `apps/docs` has `"lint": "eslint ."` and root `lint:check` runs `turbo run lint`. The ESLint crash cause is recorded CONFIRMED (shared config's `compat.extends(..., 'prettier')`, order-dependent) in `168-01.1-lint.md`, with the other mechanism marked UNCONFIRMED honestly. `lint:full` exit 0 by me. |

#### DOCS-02 against the requirement as now worded (operator ruling, Option B, 2026-10-02)

The requirement now says the spans are byte-identical to the phase base and the three frozen components are unchanged since the component base `6090476cc`. Checked:

- `6090476cc` exists and is an ancestor of HEAD.
- `git diff 6090476cc HEAD` over `ResearchQuote.svelte`, `ReferenceList.svelte` and `Author.svelte` is empty. The unchanged-since-component-base clause holds.
- The base-to-component-base diff is exactly lint-only: `ReferenceList.svelte` changes `string[]` to `Array<string>`; `ResearchQuote.svelte` reorders imports (`Snippet` becomes a separate `import type`) and changes `references?: string[]` to `Array<string>`. These are type-level and import-order edits with no markup or logic change, consistent with "render proven identical". `Author.svelte` is untouched.
- The 22 spans are identical to base `0ec229dfe` per the gate and per the gate's observed-red behaviour on my own one-character injection.
- Every base page has an audit-ledger row with a verdict.

Note for the record: the DOCS-02 wording also says "proven by a script observed red on a one-character injection". That is documented in `gate-evidence/168-01-rq-nc.md` (one character in a block; a space appended to `ReferenceList.svelte`) and I reproduced the span-injection case myself.

### Key Links

| From | To | Status | Details |
| --- | --- | --- | --- |
| `navigation.config.ts` | page routes | WIRED | 82 nav leaves all resolve (`nav-route: 0`). |
| Old URLs | new pages | WIRED | 26 redirect stubs, `stub: 0`. |
| In-repo inbound references | final pages | WIRED | 42 inbound references, `inbound: 0`. |
| `docs` workspace | root `lint:check` | WIRED | `lint` script exists; `turbo run lint` runs it; root gate recorded exit 0. |

### Anti-Patterns Found

None. No `TBD` / `FIXME` / `XXX` in the 105 non-generated changed files. No stub pages: the Backend section pages have per-page claim counts of 14-55 in the verifier pass.

### Gaps Summary

None. All seven success criteria and all eight requirement IDs are backed by code and gate evidence that I re-ran or independently re-derived.

### Limits of this verification (not gaps)

- I did not re-run the docs `build`, root `lint:check`, `format:check` or the `check-claims.mjs commands` check. They are taken from `gate-evidence/168-08-gates.md` and the reconciliation file, which are consistent with the gates I did re-run on the same tree.
- Factual accuracy of narrative prose beyond what the 2176 anchored claim rows and the 1022-claim verifier pass cover was spot-checked, not exhaustively re-read. The verifiers themselves report that runtime flows (`db:reset-with-e2e-data`, the feedback rate-limit semantics) were checked by source anchor rather than executed. The `q-info` / `arg-cond` commit-prefix abbreviation is recorded as an unverifiable team convention supported by commit history.
- Pre-existing, not introduced here: the working branch name is `fix/888-review-findings`, which is unrelated to Phase 168 but does not affect the results.

---

_Verified: 2026-10-02_
_Verifier: Claude (gsd-verifier)_
