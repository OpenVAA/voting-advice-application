# Phase 165: Review-Stack Comment Remediation - Context

**Gathered:** 2026-09-27
**Status:** Ready for planning
**Source:** The maintainer's direct instruction (`/gsd-progress --do`, 2026-09-27) plus the review threads themselves. No discuss-phase was run. The maintainer asked for the work to go straight to planning.

<domain>
## Phase Boundary

The v2.15 review stack is twelve stacked PRs: #876 (`ship/v2.15-01-shared-packages`) through #887 (`ship/v2.15-12-planning`). It has 78 inline review comments: 59 from GitHub Copilot and 19 from the maintainer (`kaljarv`). All 78 are recorded verbatim, with ids, URLs and commit ids, in `165-REVIEW-COMMENTS.md` in this directory. That file is the complete input population. Do not re-derive it from memory.

This phase:
1. dispositions **every** one of the 78 comments, and
2. fixes every actionable one **at the stack tip**,

on a single new branch, `ship/v2.15-13-review-fixes`. The branch is cut from `ship/v2.15-12-planning` at `8efd20606`, whose tree was verified byte-identical to `integration/ship-12-squash` at cut time. The branch sits on top of the stack. The twelve slices themselves are **not** rewritten.

Out of scope: rewriting or re-slicing PRs #876-#887, and posting replies to GitHub threads. Replies are an outward-facing action, so draft them in the ledger and let the maintainer post them or explicitly authorise posting.
</domain>

<decisions>
## Implementation Decisions (maintainer-directed)

### D-01 — Triage: many Copilot comments are split artifacts
The maintainer's words: "many of these, tho, are artifacts resulting from the 12-way split PR". Copilot reviewed each slice **in isolation against its base**, so a large share of its findings will look like one of these:
- "caller X still uses the old API"
- "module Y does not exist"
- "alias not registered"

In those cases the other half of the change is in a **later** slice. Examples of this shape: #879's `lib/routes/route` imports, #881's `$layouts` alias, #877's `get_nominations`/`p_project_id` and `merge_question_custom_data` callers, and the `grants` vs `user_roles` claim consumers.

Every comment gets exactly one disposition:
- `fix` — the defect is real at the stack tip.
- `split-artifact` — the defect exists only in an intermediate slice, and the tip is correct. This **must be proven at the tip** with a grep, file read, test or run, never assumed from the comment's shape.
- `already-fixed` — a later commit in the stack or a quick task already resolved it. Cite the commit or the tip evidence. Partial fixes count as `fix`: for example, QuestionChoices is only half done at the tip, since the consts are `UNPICKED_DOT*`, not the requested `UNPICKED_RADIO`/`UNPICKED_CHECKBOX`, and the "is no longer here" narrative survives near the style block.
- `deferred` — **only** where the maintainer said so (D-03).
- `wont-fix` — only with a concrete technical reason. For a maintainer comment, this is a `checkpoint:decision`, never unilateral.

Copilot findings that are real at the tip are fixed like any other defect. Copilot comments about **comment/prose regressions** from the codemod reflow are real defects wherever they persist at the tip. Examples: #878 FeedbackGenerator grammar and the QuestionCategoriesGenerator header; #885 collapsed JSDoc examples in argument-condensation, llm and promptRegistry; #886 `keygen.ts` usage backslashes.

### D-02 — Every maintainer comment is addressed as written
The 19 `kaljarv` inline comments are instructions, not suggestions. Several are broad and must be implemented at their stated breadth, not just at the anchored line:
- **#877 `102-entities.sql`**: same column order as `organizations` for **all related tables**.
- **#877 `101-elections.sql:13`**: check whether the column is used for anything that can't be recovered from `external_id`. If not, remove it from **all tables and seed data with no historical traces**.
- **#877 `100-tenancy.sql`**: add a concise comment (or other docs) on **every** table column that isn't completely self-evident, **especially the JSONB shape** (e.g. localised strings).
- **#877 `503-entity-rpcs.sql:105`**: examine requiring the entity type as a parameter for **all** such id-taking functions.
- **#880 `supabaseDataProvider.ts:60`**: move helpers (and possibly consts) out into `supabase/utils` or sibling files so the provider file stays focused on the DataProvider implementation.
- **#880 `idura.ts`**: rename provider keywords `idura`→`idura-ftn` and `signicat`→`signicat-ftn` in configs, and mark every Finnish-specific config as such (e.g. `IDURA_AUTH_CONFIG`→`IDURA_FTN_AUTH_CONFIG`). The provider implementations stay generic.
- **#880 `PasswordValidator.svelte`**: if password validation is used only in the frontend, move it from `app-shared` to `apps/frontend/src/lib/utils/password-validation/`.
- **#880 `ImagePart.svelte`**: inline these classes.
- **#880 `roles.ts`**: keep the frontend adapter-agnostic. **Audit the whole repo** for `supabase-types` imports outside the Supabase adapter. Define the frontend types in place, and assert they match the Supabase types in a test colocated with the Supabase adapter.
- **#880 `QuestionChoices.svelte`**: never include historical narrative; no link to the line above; use `cn` rather than interpolation; rename to `UNPICKED_RADIO` / `UNPICKED_CHECKBOX`.
- **#880 `prepareDataWriter.ts`**: check whether caching the data writer (here or in `createDataWriter`) has any use; remove it if not.
- **#880 `voterContext.svelte.ts:545`**: move to `contexts/utils` and remove the historical narrative.
- **#880 `Header.svelte`**: inline styles as Tailwind classes as much as possible, **for all `<style>` blocks in components**. This is repo-wide across component libraries, not just Header.
- **#880 `utils/components.ts:22`**: check whether the duplication can go by using different theme variables in `app.css` while keeping the `p-xs` semantics.
- **#880 `focusNavigationTarget.ts:61`**: can auto-focus be cancelled by listening to any pointer event without disturbing other interactions? If not, lower the timeout to 5000 ms.
- **#880 `logLevel.ts`**: far too much prose. State the point and stop.

Investigation-shaped comments ("check whether", "examine whether", "is it possible") end in a recorded verdict **and** the resulting change. If the verdict is "no change", the ledger carries the evidence.

### D-03 — Deferred by the maintainer: adapter-selection entrypoints
#880 `apps/frontend/src/lib/api/dataProvider.ts:1` (comment 4105438045) asks for:
- static-settings adapter selection with lazy-loaded Supabase modules,
- build-time/env adapter registration,
- self-registered capabilities,
- adapter hooks replacing adapter-specific imports like `SUPABASE_COOKIE_PREFIX` in route loaders.

The maintainer explicitly said: "let's do this on a follow up phase after the initial ship". Disposition: `deferred`. Record it as a pending todo (or backlog item) carrying the comment's full requirements list. **Do not implement it in this phase.**

### D-04 — Comment hygiene applies to EVERY changed file (maintainer, 2026-09-27)
"Make sure the comment hygiene rules for the repo are applied to all changes files." Every file this branch changes must satisfy the repo's comment-hygiene rules, including files touched only incidentally (renames, moved helpers, inlined styles). The rule sources:
- The `ship-review-stack` skill's hygiene mechanism: `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` (deterministic rules, dry-run by default) and `hygiene-grep-report.sh --assert-clean`. Together they strip planning references: phase numbers, `D-NN` decision ids, task ids, milestone tags, and `.planning/` paths in shipped source. The one allowed survivor form is `see phase N`. Scope is `apps/ packages/ tests/`. `CLAUDE.md`, `.agents/`, `.claude/` and `.planning/` are exempt.
- The maintainer's rules stated in these threads: **no historical narrative in comments, ever** ("is no longer here", "was moved from", "previously…"); **no excess prose**; comments state the point; no linking to the adjacent line.
- The codemod-reflow regressions Copilot flagged (collapsed multiline JSDoc examples, `//` comments swallowing code on one line, shell-continuation backslashes followed by text, broken sentences). Hygiene edits must never produce these.
- `.agents/code-review-checklist.md` for everything else.

Enforcement must be **per changed file**: derive the set from `git diff --name-only ship/v2.15-12-planning...HEAD` at run time, then run the codemod plus a residue pass (agent read) over exactly that set. `hygiene-grep-report.sh --assert-clean` is a floor, not the whole check.

### D-05 — Branch and commit discipline
- All work lands on `ship/v2.15-13-review-fixes`. Do not rewrite the twelve ship branches. Do not push without the maintainer's go-ahead: pushing and opening PR 13/13 is outward-facing.
- One atomic commit per logical fix (or a tight cluster) so each GitHub thread can be answered with a single commit link.
- An uncommitted, unrelated working-tree edit to `apps/frontend/src/lib/layouts/main/MainContent.svelte` (`flex-grow`→`grow`) predates this phase. It is not ours: never stage it with a phase commit. If the Header/style-inlining work touches that file, stop and ask.

### D-06 — Gates (cardinal)
`yarn build`, `yarn lint:check`, `yarn format:check`, `yarn test:unit`, pgTAP, `yarn db:lint:sql` and the **full** E2E suite (`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`) must all pass: 0 failed, 0 flaky, 0 did-not-run. Schema changes (column reorder, column removal, entity-type parameters) need `yarn db:types` regeneration and a dev-seed/template update in the same change. Read gate exit status directly, never through a pipe.

### Post-research rulings (maintainer, 2026-09-27)
- **D-07 — Signicat identity key (C-4080520062): `wont-fix`.** Assumption A1 is confirmed: no hosted Supabase project holds real Signicat/Idura users, so the birthdate→sub change needs no rekey migration. Reply on the thread with that rationale. For the same reason, the `*-ftn` rename needs no runtime-state migration.
- **D-08 — supabase-types audit scope (#880 roles.ts): domain types now, client alias.** Every domain and role type imported from `@openvaa/supabase-types` outside the Supabase adapter and backend becomes a frontend-local type, with a colocated parity test next to the Supabase adapter that fails on drift. The ~8 sites that type the Supabase *clients* import a type alias re-exported from the adapter instead of `@openvaa/supabase-types` directly. The full client move rides with the deferred adapter-selection work (D-03).
- **D-09 — components.ts duplication (#880 utils/components.ts:22): keep the explicit list and add a drift test.** tailwind-merge only recognises `['px', isNumber]` for spacing, so theme variables can't replace the list without breaking `p-xs` merging. Add a unit test that fails when the list drifts from the `app.css` theme variables, and reply on the thread with the reason.
- **D-10 — style blocks that genuinely need CSS (#880 Header.svelte): keep them as CSS.** Inline everything Tailwind can express, across every component `<style>` block. Keep only the rules that really need CSS (Video, the ScoreGauge core, the root layout's view-transition rules, keyframes, pseudo-elements, `:global`), each with a one-line reason comment that complies with the hygiene rules.
- **D-12 — push and PR authorised (maintainer, 2026-09-27).** This supersedes the "do not push" clause of D-05. Once every gate is green, push `ship/v2.15-13-review-fixes` and open PR 13/13 with base `ship/v2.15-12-planning`. Replying on the existing review threads is still not authorised: the drafted replies stay in the ledger. Execution proceeds automatically once the plans pass the checker.
- **D-11 — ledger appendix.** The ledger also lists the 12 PR review bodies as a short appendix marked no-action (ROADMAP criterion 1).

### Claude's Discretion
- Plan decomposition and wave order. Schema changes likely go first because types, seed and frontend follow from them; the repo-wide style-block inlining and supabase-types audit are large enough to be their own plans.
- Exact mechanism for the supabase-types parity test, provided it lives next to the Supabase adapter and fails on drift.
- Ledger file format, provided every one of the 78 comment ids appears exactly once with a disposition and evidence.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/phases/165-review-stack-comment-remediation/165-REVIEW-COMMENTS.md` — the 78 comments, verbatim, with ids/urls
- `.claude/skills/ship-review-stack/SKILL.md` — the stack mechanism and hygiene gate semantics
- `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs`, `hygiene-grep-report.sh` — hygiene tooling
- `.agents/code-review-checklist.md` — review checklist
- `CLAUDE.md` — E2E hard rule, context-destructuring rule, Svelte warning format
- `.planning/quick/260922-dd8-refactor-condition-classes-in-questionchoic/260922-dd8-SUMMARY.md` — the `cn` helper and the QuestionChoices partial fix
- Skills by area: `database` (schema/RLS/RPC comments), `components` (style inlining, QuestionChoices, contexts), `data`
</canonical_refs>

<specifics>
## Specific Ideas

- Draft a one-line GitHub reply per comment in the ledger (commit link or tip evidence). Posting them is left to the maintainer.
- For split-artifact proofs, a tip-state grep with exit status is sufficient evidence. Example: `git grep -n "lib/routes/route" tests/` returns the imports, and the module exists.
</specifics>

<deferred>
## Deferred Ideas

- Adapter-selection entrypoints, lazy-loaded Supabase modules, adapter self-registration and hooks (#880 comment 4105438045) — follow-up phase after the initial ship, per the maintainer.
</deferred>

---

*Phase: 165-review-stack-comment-remediation*
*Context gathered: 2026-09-27 from the maintainer's instruction and the PR review threads*
