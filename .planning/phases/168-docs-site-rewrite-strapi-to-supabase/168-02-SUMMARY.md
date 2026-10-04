---
phase: 168-docs-site-rewrite-strapi-to-supabase
plan: 02
subsystem: docs-content
status: complete
tags: [docs, sveltekit, information-architecture, redirect-stubs, navigation, link-checker, playwright-probe]

requires:
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-01: validate-links --check (seven classes incl. stub and inbound), 168-DOCS-AUDIT.md, base-rev.txt"
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-01.1: docs lint inside yarn lint:check, generator prune, re-anchored span gate"
provides:
  - "The D-02 Developers' Guide tree in navigation.config.ts (13 top-level items, no Strapi titles, generator-consistent)"
  - "Every final page at its final URL with its final H1: 11 moved, 5 new (H1 + one scope paragraph), 22 kept pages re-titled where needed"
  - "26 redirect stubs (+page.ts, redirect(308, '<literal final route>')) at every moved or removed URL"
  - "In-repo inbound references repointed to final pages (5 README files); inbound class 8 -> 0"
  - "Ledger: New-route column for all 55 Developers' Guide rows, 26 redirect-stub verdicts, ## Redirect stubs table and the inbound list"
  - "gate-evidence/168-02-redirect-probe.txt (Chromium redirect + no-stub control), gate-evidence/168-02-inbound.txt (before/after)"
affects: [168-03, 168-04, 168-05, 168-06, 168-07, 168-08, 169]

estimate:
  tokens: 60000
actuals:
  tokens: 39588
  tasks: 3
  commits: 3
plan_head_before: 4db0dc5e788dc573f802f81254356dab85db9da8
plan_head_after: d0ce67962b648f6693eba8d29b8945f887a2ae90

tech-stack:
  added: []
  patterns:
    - "Redirect stub = a +page.ts-only route directory with exactly `import { redirect } from '@sveltejs/kit'` and `export function load() { redirect(308, '<literal>'); }`; never in navigation.config.ts"
    - "Navigation title equals page H1; only Overview leaves and page-less sections whose label differs from the route carry fixedTitle: true"
    - "Runtime redirect proof: static build served the GitHub-Pages way (404 + 404.html) and driven by Chromium, with a no-stub control"

key-files:
  created:
    - "apps/docs/src/routes/(content)/developers-guide/**/+page.ts (26 stubs)"
    - "apps/docs/src/routes/(content)/developers-guide/development/seed-data/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/backend/email/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/backend/data-import-and-deletion/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/candidate-app/bank-authentication/+page.md"
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/gate-evidence/168-02-redirect-probe.txt
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/gate-evidence/168-02-inbound.txt
  modified:
    - apps/docs/src/lib/navigation.config.ts
    - "apps/docs/src/routes/(content)/developers-guide/** (11 moves, 15 removals, H1 lines, 6 internal links)"
    - README.md
    - apps/frontend/src/lib/api/README.md
    - apps/frontend/src/lib/server/api/README.md
    - apps/frontend/src/routes/candidate/README.md
    - packages/app-shared/src/settings/README.md
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-DOCS-AUDIT.md

key-decisions:
  - "frontend/data-api is stubbed per D-04's literal list (orchestrator ruling 4, Q2); both API READMEs now link frontend/data-api-and-adapters"
  - "Never-paged section routes (/developers-guide/contributing, /developers-guide/candidate-user-management) get no stub; their inbound README links point at leaf pages instead"
  - "New pages carry only their final H1 and one name-only scope paragraph; owner plans 168-03 and 168-06 write the bodies"
  - "Nav title == H1 everywhere except the four Overview leaves (H1 '<Section> overview') and the page-less sections Backend (Supabase) and Candidate app, which carry fixedTitle: true"
  - "The mechanical link repoint leaves one self-link in frontend/data-api-and-adapters (to the merged accessing-data page); 168-05 resolves it when merging"
  - "168-07 must keep the Contributing headings 'Self-review' and 'Commit your update' (PR-template anchors) and the contributing URLs"

patterns-established:
  - "Commit subjects keep the repo's bracketed scope (docs[docs]:), as in 168-01, not the plan's docs(docs):"

requirements-completed: []

coverage:
  - id: D1
    description: "Navigation follows the D-02 tree with no Strapi titles, and the navigation generator reproduces it with no diff and no // New or // Removed marker (a drifted H1 turns the check red)"
    requirement: "DOCS-01"
    verification:
      - kind: other
        ref: "generate:navigation && prettier --write src/lib/navigation.config.ts && git diff --exit-code && nohit '// (New|Removed)' (exit 0 at HEAD d0ce67962)"
        status: pass
      - kind: other
        ref: "nohit -E \"title: '(Strapi|OpenVAA admin tools plugin for Strapi|Localization in Strapi|Registration Process in Strapi)'\" (exit 1 = no hit; same grep hits 4 at the pre-plan HEAD)"
        status: pass
      - kind: manual_procedural
        ref: "negative control: backend/email H1 changed to 'Email delivery' -> consistency check exit 1 with a one-line title diff; reverted -> exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "26 redirect stubs, each a literal internal 308 to a real page, none chained or in the navigation; no internal link lands on a stub"
    requirement: "DOCS-07"
    verification:
      - kind: other
        ref: "Task 2 <verify> stub loop (26 dirs with +page.ts and no page; tracked +page.ts count under developers-guide == 26) exit 0"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/docs validate:links --check --only md-link,svelte-href,nav-route,stub,inbound (exit 0; Redirect stubs: 26)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A browser on an old URL reaches the final page on the static build served the GitHub-Pages way; the probe reports no redirect for a URL without a stub"
    requirement: "DOCS-07"
    verification:
      - kind: automated_ui
        ref: "gate-evidence/168-02-redirect-probe.txt: REDIRECT OK /developers-guide/app-and-repo-structure -> /developers-guide/architecture h1 Architecture; NO REDIRECT /developers-guide/no-such-route"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every in-repo inbound reference resolves to a final page, including the binding review-checklist and PR-template links and anchors"
    requirement: "DOCS-07"
    verification:
      - kind: other
        ref: "validate:links --check --only inbound: exit=1 (8 findings) before, exit=0 after (gate-evidence/168-02-inbound.txt)"
        status: pass
      - kind: other
        ref: "nohit -E 'developers-guide/(frontend/data-api[)\"#>/ ]|candidate-user-management)' -- ':!apps/docs' ':!.planning' (exit 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Ledger: New route for all 55 Developers' Guide rows, 26 redirect-stub verdicts, the ## Redirect stubs table (26 rows) and the inbound list"
    requirement: "DOCS-02"
    verification:
      - kind: other
        ref: "awk count of numbered rows under ## Redirect stubs == 26; Developers' Guide rows with New route 'pending' == 0"
        status: pass
    human_judgment: true
    rationale: "The content-fate wording copied into the ledger and the five new pages' scope paragraphs are a reading of D-02/D-03; 168-08 (or a human) should confirm them against the owner plans' outcomes"
  - id: D6
    description: "The docs build, svelte-check, docs lint, root lint:check and format:check stay green with the stubs and moved pages"
    requirement: "DOCS-01"
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/docs build (exit 0); yarn workspace @openvaa/docs check (653 files, 0/0); yarn lint:check (exit 0, @openvaa/docs:lint executed); yarn format:check (exit 0); yarn assert:comment-hygiene (exit 0)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-10-02
---

# Phase 168 Plan 02: Developers' Guide IA Skeleton Summary

**The Developers' Guide now has the D-02 shape on disk and in the navigation. Eleven pages moved to their final URLs and five new pages were created, each with its final H1. Fifteen Strapi-era or merged pages were removed. All 26 old URLs are `+page.ts` stubs that redirect with a 308. A real Chromium redirect was proven on a GitHub-Pages-style server. Five README references were repointed, and every structural link class passes.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-10-02T09:35:00Z
- **Completed:** 2026-10-02T09:47Z
- **Tasks:** 3 of 3
- **Files modified:** 78 in the plan diff (`4db0dc5e7..d0ce67962`)

## Accomplishments

- **Tracer (Task 1).** `app-and-repo-structure` moved to `architecture` with the H1 "Architecture", a stub was added at the old URL, and the navigation item was updated.
  - The navigation generator reproduces the hand-set config with no diff.
  - On the built site, served the GitHub-Pages way (HTTP 404 plus `404.html`), Chromium opened the old URL and landed on `/developers-guide/architecture` with h1 "Architecture".
  - The control URL `/developers-guide/no-such-route` printed `NO REDIRECT`. That shows the probe can report a missing redirect.
  - Tracer feedback gate: the run was interactive with `end-of-phase` mode and the tracer's `<verify>` is automated only. `<verify>` was re-run green, then expansion followed.
- **URL map (Task 2).**
  - Ten more moves.
  - Fifteen removals. Their old text stays readable with `git show <base-rev>:<path>`.
  - Five new pages, each with an H1 and a scope paragraph that names things only.
  - 22 kept pages whose H1 now equals their navigation title.
  - Six internal links repointed.
- **Navigation.** The Developers' Guide is in D-02 order: Quick start, Architecture, Development, Configuration, Backend (Supabase), Frontend, Localization, Candidate app, Admin app, Deployment, Contributing, Troubleshooting and About these docs.
  - None of the four Strapi titles remains.
  - `fixedTitle: true` is set only on "Backend (Supabase)", "Candidate app" and the four "Overview" leaves.
- **Inbound (Task 3).**
  - Before the repoint, `--only inbound` reported 8 findings and exited 1. After it, the check exits 0.
  - The edits were the root README's Contributing link, the two API READMEs (repointed to Data API and adapters), the candidate README (repointed to Candidate app) and the app-shared settings README's two local paths, which had the wrong prefix.
  - The checklist and PR-template links and their anchors already resolved and still do.
- **Ledger (D-20).**
  - Every Developers' Guide row has a New route.
  - The 26 old URLs have the verdict `redirect stub`, with their content fate and owner.
  - A 26-row `## Redirect stubs` table and an "Inbound references repointed" list were added.
  - Six execution decisions were recorded.

## Task Commits

1. **Task 1: Move one URL end to end (tracer)**: `6439ee799` docs[docs]: move App and repo structure to Architecture with a redirect stub
2. **Task 2: Apply the rest of the URL map**: `38684046d` docs[docs]: reorganise the Developers' Guide into the Supabase-era tree with redirect stubs
3. **Task 3: Repoint in-repo inbound references**: `d0ce67962` docs: repoint in-repo references to the reorganised docs routes

**Plan metadata:** this SUMMARY's commit and the following state/roadmap commit.

## Files Created/Modified

- `apps/docs/src/lib/navigation.config.ts`: the D-02 Developers' Guide subtree.
- `apps/docs/src/routes/(content)/developers-guide/**`:
  - 26 stub `+page.ts` files
  - 11 moved pages: architecture, about-these-docs, admin-app, backend/generated-types, frontend/data-api-and-adapters, localization/locale-resolution, localization/translations-and-overrides, and candidate-app/{pre-registration-and-invitation, registration, login-and-password-reset, password-validation}
  - 5 new pages: development/seed-data, backend/{edge-functions, email, data-import-and-deletion}, candidate-app/bank-authentication
  - 15 removed pages
  - H1 line edits on kept pages
- 5 README files outside `apps/docs`, where only link targets and link text changed.
- `168-DOCS-AUDIT.md`, `gate-evidence/168-02-redirect-probe.txt` and `gate-evidence/168-02-inbound.txt`.

## Decisions Made

See `key-decisions`; each is also in the ledger under `## Decisions recorded at execution`. The two that matter for the writers:

- **Headings are navigation.** A writer in 168-03..07 who renames an H1 renames the navigation item too. The D-02 consistency check then shows a diff. Change the navigation config in the same commit, or keep the H1.
- **168-07 must keep `Self-review` and `Commit your update`.** The PR template's anchors depend on them, and `--only inbound` checks them.

## Deviations from Plan

### Auto-fixed Issues

None. No bug, missing-critical or blocking fix was needed.

### Other deviations

**1. [Convention] Commit subjects use the repo's bracketed scope (`docs[docs]:`) instead of the plan's `docs(docs):`**
- **Why:** The contributing guide sets the bracketed package form, and CLAUDE.md makes the review checklist binding. 168-01 made the same change.
- **Commits:** `6439ee799`, `38684046d`. Task 3's `docs:` subject is the plan's own wording, because no package scope applies to the root README edits.

**2. [Scope, minor] Link text in the two API READMEs changed from "Data API" to "Data API and adapters"**
- **Why:** The link now targets a page with that title. PROH-05 allows link-text edits in README files.
- **Commit:** `d0ce67962`

**3. [Addition] Negative control on the D-02 consistency check**
- **What:** The plan did not ask for it. I added it so the green result means something. An H1 change on `backend/email` made the check exit 1, and it returned to exit 0 after the revert. It is recorded in the ledger.

**4. [Addition] Span gate run with the documented post-168-01.1 form**
- **What:** This plan does not invoke `check:research-quotes`, so there was no old-form command to replace. I ran the new form once as an extra check: `--base "$(cat $GE/base-rev.txt)" --component-base "$(cat $GE/component-base-rev.txt)"`. It exited 0, and all spans and frozen components are unchanged.

---

**Total deviations:** 0 auto-fixed; 1 convention change, 1 minor scope change, 2 added checks. **Impact:** None on scope or outcomes.

## Issues Encountered

- **Remaining link findings belong to the writer plans, as expected.**
  - `--only anchor` reports 3 findings (exit 1). At base there were 4; the `mock-data` one left with its page.
  - `--only github-path` reports 28 findings (exit 1). At base there were 54; the removed pages took the rest with them.
  - Both lists are in `gate-evidence/168-02-inbound.txt`. 168-03..07 clear them on the pages they own, and none was introduced here: the new `docs/key-generation.md` link resolves.
- **Self-link.** `frontend/data-api-and-adapters` links to itself in place of the merged accessing-data page. This is recorded for 168-05.
- **`patterns skipped: 1` in the inbound class** comes from a pre-existing shell comment in `.claude/scripts/audit-skill-routing.sh` that contains `.../generated/+page.md`. It is not a link.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 168-03, 168-04, 168-05 and 168-06 can run in parallel. Every page they own exists at its final URL with its final H1, so none of them needs to touch `navigation.config.ts`.
- **Requirements:** DOCS-01, DOCS-02 and DOCS-07 are only partly delivered here:
  - DOCS-01's navigation half is done.
  - DOCS-07's stub and inbound half is done.
  - DOCS-02's ledger columns are filled.

  All three are shared with sibling plans, so none is marked complete, the same as 168-01 and 168-01.1.

## Known Stubs

Five intentional content stubs are left for the owner plans. Each new page holds an H1 and one scope paragraph by design (plan `<mapping>`, "the owner plan writes the body in wave 3"):

- `development/seed-data` and `backend/{edge-functions,email,data-import-and-deletion}`: 168-03.
- `candidate-app/bank-authentication`: 168-06.

The 26 redirect stubs are the deliverable, not placeholders.

## Self-Check: PASSED

- FOUND: `navigation.config.ts` (contains "Backend (Supabase)"), `backend/security/+page.ts` (contains `redirect(308, '/developers-guide/backend/authentication')`), `candidate-app/registration/+page.md` (`# Registration`), `architecture/+page.md`, `gate-evidence/168-02-redirect-probe.txt`, `gate-evidence/168-02-inbound.txt`.
- FOUND commits: `6439ee799`, `38684046d`, `d0ce67962`.
- Plan-level verification at HEAD `d0ce67962`, each exit status read from the command itself:
  - `validate:links --check --only md-link,svelte-href,nav-route,stub,inbound` exits 0.
  - The D-02 consistency check exits 0.
  - The probe file holds `REDIRECT OK` and `NO REDIRECT`.
  - Docs `build` exits 0.
  - `yarn lint:check` exits 0.
  - `git status --porcelain` is empty.
  - No throwaway server or probe file is left in the repo.

---
*Phase: 168-docs-site-rewrite-strapi-to-supabase*
*Completed: 2026-10-02*
