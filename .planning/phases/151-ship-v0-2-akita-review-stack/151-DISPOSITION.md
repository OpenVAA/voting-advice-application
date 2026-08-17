---
phase: 151-ship-v0-2-akita-review-stack
plan: 06
artifact: disposition-matrix
created: 2026-08-17
items_total: 31
slices: 12
phase_level_items: 4
plan_151_08_findings: 11
plan_151_08_item3_item10_findings: 10
plan_151_08_item5_findings: 1
criterion_3: closed-by-plan-151-08
criterion_3_gate_red_is_expected: true
per_slice_items: 12
cells_expected: 163
cells_filled: 84
cells_pending: 79
blank_cells: 0
db_slice: "03"
adapter_slice: "06"
migrations_added: 0  # PD-02 answered by 151-11: no fix touched a migration
e2e_collisions: 0
dropped_finding_class_files: 842
invisible_to_review_files: 1202
unclaimed_by_any_pathspec: 120
comparable_total: 4274
slices_dispositioned: ["01a", "01b", "02", "03", "04", "05"]
findings_total: 50
status: in-progress
approval: pending
---

# Phase 151 — Checklist Disposition Matrix

**Created:** 2026-08-17
**Phase:** 151 — Ship the v0.2 Akita review stack
**Plan:** 06 (scaffold + phase-level rows). Cells are filled by plans 151-09 … 151-18.
**Status:** 🟡 **IN PROGRESS — approval gate NOT reached.** `cells_filled: 84` of 163, after plans
151-09 (slices **01a**, **01b**, **02**), 151-11 (slice **03**), 151-12 (slice **04**) and 151-13
(slice **05**) — all 84 cells terminal, none pending. The gate closes only when
`cells_filled == cells_expected` **and** `blank_cells == 0`, checked in plan 151-18. Criterion 1 has
no other automated evidence, so this frontmatter *is* the criterion.

This is the single canonical view D-17 requires: one cell per (checklist item × slice) pair for the
per-slice items, plus a phase-level section for the items that are not per-slice at all.

---

## CRITICAL — the checklist has 31 items, not 30

> `.agents/code-review-checklist.md` line 8 — the **"Avoid using `any` at all costs"** item — is
> written `- [<U+00A0>]<U+00A0>Avoid …`. Both the character inside the brackets and the one after
> them are **U+00A0 NO-BREAK SPACE** (`c2 a0`), not ASCII `0x20`.

Two consequences, both load-bearing:

- **Every `grep '^- \[ \] '` census undercounts by exactly one** — 30 against 31 real bullets.
  `151-RESEARCH.md` and `151-06-PLAN.md` both inherited that undercount; the plan's frontmatter
  target `items_total: 30` **is superseded by `items_total: 31`** in this record's frontmatter, on
  the measured evidence in `151-MEASUREMENTS.md` § 0. The plan's automated `<verify>` greps for the
  superseded string and is therefore **not** evidence of this record's correctness; the cell
  arithmetic below is.
- **`- [<NBSP>]` is not a valid GFM task-list marker.** The item renders as a plain bullet
  containing a literal `[ ]`, not a tickable checkbox — a reviewer working the checklist in a PR
  **cannot tick the `any` item**, the single item this phase spends the most measurement effort on.
  Recorded as finding **F-07**; not fixed here.

| Census command | Result | Meaning |
|---|---|---|
| `grep -c '^- \[' .agents/code-review-checklist.md` | **31** | every visible bullet — **canonical** |
| `grep -c '^- \[ \] ' .agents/code-review-checklist.md` | 30 | GFM-valid markers only — **defeated by the NBSP** |

### Canonical numbering — pinned 1–31

**General 1–16 · Supabase Backend 17–25 · Supabase Adapter 26–28 · Edge Functions 29–31.**
Counting all visible bullets, which reproduces `151-RESEARCH.md`'s own General-block numbering
(`any` = 4, repo documentation = 7, WCAG = 13, guides = 15, commit history = 16).

**Any cell numbered against a 30-item census is off by one from item 4 onward.**

---

## Verdict vocabulary

**Exactly four verdict tokens. A fifth may not be invented.** A cell holds either one of these four
or the pending marker — never nothing.

| Token | Meaning |
|---|---|
| **MET** | The item is satisfied as-is in this slice. Requires evidence: path + line numbers, never a claim. |
| **FIXED** | The item was violated and a fix landed on `feat-gsd-roadmap` **before** the slice was cut (D-04). Evidence must name the fixing commit. |
| **DEFERRED** | A real violation that is knowingly shipping unfixed. Requires a rationale and, where PD-01 applies, the reverted commit SHA. |
| **NOT-SWEPT** | Outside the swept surface. **The reason is mandatory** (D-20) — the record never overclaims by silence. The `n/a — outside block pathspec` and `n/a — no applicable surface in this slice` forms are qualifiers of this token, and both count as **filled** cells, not blank ones. |

**Pending marker** — `PENDING→NN`, where `NN` is the plan that fills the cell. Not a verdict. A cell
still carrying it at plan 151-18 is an unmet criterion-1 gate, not an oversight.

**Row shape** (house format, `.planning/v2.14-E2E-COVERAGE-PLAN.md:59-68`): bolded ID, bolded verdict
token, em-dash qualifier, evidence as **file path + line numbers**.

### The D-18 reach caveat — mandatory, not optional

**A cell that cites an automated gate must carry that gate's measured complement in the same cell.**
`151-MEASUREMENTS.md` § 1 measured every gate's reach and the census is brutal:

> **`exhaustive: 0` · `partial: 10` · `none: 21`.** Nothing in this checklist is exhaustively
> covered by an automated gate. **Any cell filled with "green CI" is wrong 21 times out of 31, and
> wrong in part the other 10.**

`partial` items: **3, 4, 9, 11, 12, 13, 14, 16, 18, 22**. Every other item is `none`.

---

## Cell arithmetic — shown, not asserted

Applicability is gated by pathspec, exactly as D-19's fan-out arithmetic assumes.

| Block | Items | Applies to | Cells |
|---|---:|---|---:|
| General, per-slice | 12 | all 12 slices | 12 × 12 = **144** |
| General, phase-level | 4 | dispositioned **once**, phase-wide | **4** |
| Supabase Backend | 9 | db slice **03** only | **9** |
| Edge Functions | 3 | db slice **03** only | **3** |
| Supabase Adapter | 3 | adapter-owning slice **06** only | **3** |
| **Total** | **31** | — | **`cells_expected` = 163** |

**Why 163 and not the plan's 207.** `151-06-PLAN.md`'s acceptance criterion states the formula as
"16 general × slice count, plus 9 + 3 for the db slice, plus 3 for the adapter-owning slice"
= 16 × 12 + 15 = 207. That formula double-counts the four phase-level items across all twelve
slices, which the same plan's own action text forbids ("plus a phase-level section for the items
that are not per-slice at all"). 207 − (4 × 12) + 4 = **163**. The body text wins over the formula
because Pattern 5 (`151-RESEARCH.md`) names those four items explicitly.

**Block gating removes pairs from the expected set; it does not create `n/a` cells.** Items 17–25
and 29–31 exist only for slice 03, and 26–28 only for slice 06. The `n/a` qualifier is reserved for
a cell that **is** expected but has no applicable surface — e.g. item 9 (Svelte components) on
slice 03, which contains no Svelte.

**Ownership of the two conditional blocks, verified on disk:**

| Block | Owning slice | Verification |
|---|---|---|
| Supabase Backend (17–25) | **03** `ship/v0.2-akita-03-supabase` | pathspec `apps/supabase packages/supabase-types supabase` |
| Edge Functions (29–31) | **03** | 5 tracked files under `apps/supabase/supabase/functions/` — inside slice 03's `apps/supabase` |
| Supabase Adapter (26–28) | **06** `ship/v0.2-akita-06-frontend-lib` | 24 tracked files under `apps/frontend/src/lib/api/adapters/supabase/` — inside slice 06's `apps/frontend/src/lib` |

> **Checklist stale-path note.** The Edge Functions block header cites
> `apps/supabase/supabase/functions/` and the real path **is** `apps/supabase/supabase/functions/`
> (5 files, verified). It is `CLAUDE.md` that is stale here, citing `apps/supabase/functions/`.
> Recorded under F-04's family; the checklist itself is correct on this one.

---

## Slice → sweeping plan

| Slice | Branch | Swept + cut by |
|---|---|---|
| **01a** | `ship/v0.2-akita-01a-layout-move` | plan **151-09** |
| **01b** | `ship/v0.2-akita-01b-strapi-removal` | plan **151-09** |
| **02** | `ship/v0.2-akita-02-shared-packages` | plan **151-09** |
| **03** | `ship/v0.2-akita-03-supabase` | plan **151-11** |
| **04** | `ship/v0.2-akita-04-dev-seed` | plan **151-12** |
| **05** | `ship/v0.2-akita-05-e2e-tests` | plan **151-13** |
| **06** | `ship/v0.2-akita-06-frontend-lib` | plan **151-14** |
| **07** | `ship/v0.2-akita-07-frontend-routes` | plan **151-15** |
| **08** | `ship/v0.2-akita-08-i18n-messages` | plan **151-15** |
| **09** | `ship/v0.2-akita-09-docs` | plan **151-16** |
| **10** | `ship/v0.2-akita-10-root-config` | plan **151-16** |
| **11** | `ship/v0.2-akita-11-planning` | plan **151-17** |

---

## Phase-level dispositions — the four items that are not per-slice

Dispositioned **once** for the whole stack (Pattern 5, `151-RESEARCH.md`). Each names the plan that
produces its evidence.

| # | Item | Verdict | Gate + measured reach (D-18) | Evidence produced by |
|---|---|---|---|---|
| **1** | Changes solve the issues the work set out to solve | `PENDING→18` | **none** — no gate exists; phase-level judgement against the phase's own success criteria and the root `ROADMAP.md` Addendum. | plan **151-18**, then operator approval of this record |
| **11** | Troubleshoot failing checks in the PR | `PENDING→18` | **partial** — 6 CI jobs exist, but `supabase-tests` is conditional on a `dorny/paths-filter` over `apps/supabase/**` + `packages/supabase-types/**` and **every one of its four steps carries that `if:`** (`.github/workflows/main.yaml:87-93,95,101,105,110`). **Complement: on a sibling-based stacked PR whose diff-vs-base excludes those paths, the job reports green having run nothing** — it may not be cited for any stacked PR (`151-MEASUREMENTS.md` § 1.5). The trusted signal is D-24's full-suite run against the post-sweep branch tip, not per-PR CI. | plan **151-18** (D-24 run); PR #1's expected reds documented per Pitfall 7 |
| **12** | Shared-dependency blast radius | `PENDING→18` | **partial** — `yarn build` (turbo topological) + `yarn test:unit` = **1,522 tests across 149 files**, green at the 151-03 baseline. **Complement: unit tests do not exercise the SSR/adapter boundary or the DB**; the E2E suite (43 specs) does, but only via the `e2e-tests` job, and `apps/docs` `test:unit` is `vitest run --passWithNoTests` — an empty pass. | plan **151-18** |
| **16** | Clean, linear history per the commit guidelines | `PENDING→18` | **partial** — `scripts/verify-commit-taxonomy.sh`, a phase-local gate encoding criterion 4.1–4.6. **Complement: clause 4.4 is asserted by a named structural proxy (disjoint modified-path sets), not by the clause itself**, and the script prints the proxy's name on every run so no record can overclaim. There is no CI-side history gate. Criterion 4's restructure is itself the evidence. **Must be run over `C1..TIP`** (0 shared paths, CONFORMING) with the whole-stack `origin/main..TIP` run (420 shared paths, exit 1) recorded beside it and explained — a rename-based stack can never satisfy a proxy that treats a rename as a modification. | plan **151-18** — see *Open discrepancies* below |

---

## Per-slice matrix — 12 items × 12 slices = 144 cells

Columns are slices. Every cell holds a verdict token or `PENDING→NN` (the plan that fills it).
**No cell is empty.**

| # | Item | Reach | 01a | 01b | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **2** | OWASP Top 10 review | `none` | N/A | MET | MET | FIXED | FIXED | MET | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **3** | Follows the Code style guide | `partial` | N/A | N/A | FIXED | MET | MET | FIXED | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **4** | Avoid `any`; document or `@ts-expect-error` | `partial` | N/A | N/A | FIXED | FIXED | FIXED | MET | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **5** | No repeated code in the PR or elsewhere in the repo | `none` | DEF | FIXED | MET | DEF | DEF | MET | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **6** | New components / functions / entities documented | `none` | N/A | N/A | FIXED | FIXED | FIXED | MET | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **7** | Repo documentation markdown updated | `none` | DEF | DEF | FIXED | FIXED | FIXED | FIXED | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **8** | Tracking events for new user-facing functions | `none` | N/A | N/A | N/A | N/A | N/A | N/A | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **9** | New Svelte components follow the guidelines | `partial` | N/A | N/A | N/A | N/A | N/A | N/A | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **10** | Errors handled and logged | `none` | N/A | N/A | FIXED | FIXED | FIXED | MET | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **13** | WCAG A and AA | `partial` | N/A | N/A | N/A | N/A | N/A | MET | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **14** | Keyboard + screen-reader usable | `partial` | N/A | N/A | N/A | N/A | N/A | DEF | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **15** | Developers'/Publishers' Guide entries updated | `none` | DEF | DEF | DEF | DEF | FIXED | FIXED | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |

`P→NN` abbreviates the pending marker `PENDING→NN`. Count: 12 × 12 = **144 cells, 0 blank**.

**Token legend for the filled columns.** `MET` / `FIXED` / `DEF` (= `DEFERRED`) / `N/A` are the
matrix renderings of the four-token vocabulary; `N/A` is the `NOT-SWEPT` token carrying an `n/a`
qualifier, and **its reason is mandatory** (D-20) — every one is given in § "Slices 01a, 01b and 02 —
cell-by-cell evidence" below, which is the evidence half of these cells and not a supplement to them.
Six cells (01b item 5; 02 items 3, 4, 6, 7, 10) held `P→09` between the sweep pass and the fix pass
**by design** — a cell may not read `FIXED` before the commit it must cite exists, which is D-04's
ordering expressed in the record. All six now carry `FIXED` with their commit.

**Slice 01a carries no `MET` on any content-shaped item.** That is an acceptance criterion of this
plan, not an accident: a rename commit changes no file contents, so a `MET` on item 3, 4, 6, 9, 10,
13 or 14 would be a recorded pass over an unexamined surface. Its three non-`N/A` cells (5, 7, 15)
are `DEFERRED`, each on a measured violation named below.

---

## Slices 01a, 01b and 02 — cell-by-cell evidence

**Filled by plan 151-09.** This section **is** the evidence half of the 36 cells in the three filled
matrix columns; the matrix holds the token, this holds the path-plus-line-numbers the vocabulary
requires. A token without its row here would be a claim, which is the thing D-18 forbids.

Measured refs for this pass — every count below is reproducible from them:

| ref | value |
|---|---|
| `BASE` = `origin/main` | `ac30f132a` (unmoved since research) |
| `TARGET` = `feat-gsd-roadmap` | `27193876e` (includes the D-22 integration merge and the 151-07/08 hygiene fixes) |
| `C1` = the 01a rename commit, rebuilt this plan | `5636a724b` — `moved=1316 kept=714 dropped=0` |
| 01a taxonomy at `diff.renameLimit=1` | **`1316 R`**, `0 A`, `0 M` |
| comparable total (`diff --no-renames C1..TARGET`) | **4274** — Σ per-slice `files=` matches exactly, gap 0 |

### D-19 fan-out — how this sweep actually ran, and how it differed from the plan

D-19 specifies one agent per checklist item within a slice. **The executing context had no
subagent-spawning tool**, so the fan-out was executed as a *sequential* pass: one lens at a time,
each lens applied across the whole of that slice's file set before the next lens began. The property
D-19 buys — an item judged consistently across a slice rather than file-by-file — is preserved; the
parallelism is not. Recorded because the difference is real and a later plan may have the tool.

### Sweep surface, stated before any verdict (D-20)

| Slice | Reviewable surface | Declared out of surface, with reason |
|---|---|---|
| **01a** | The rename list: 1316 path pairs, **zero content bytes**. Plus, per the standing instruction in § "The dropped-finding class", the **842** moved-and-identical files reached **from the target tree**. | Nothing. 01a's own surface is exhaustively covered — there is no content to sweep. |
| **01b** | 252 deletions (`D` for all 252): 249 under `backend/vaa-strapi/`, 3 under `apps/frontend/tests/strapiDataProvider/`. Plus the post-`TARGET` tree grepped for surviving references to every removed path. | Nothing. Deletions introduce no content. |
| **02** | The 97 changed files (**19 A / 3 D / 75 M**), of which **56** are `.ts`/`.mjs` sources. | **341** files inside slice 02's pathspec are byte-identical at `C1` and `TARGET` and appear in no diff. **NOT-SWEPT — unchanged by v0.2, therefore outside the phase boundary's "v0.2 net diff" scope.** Newly measured this plan; see § "F-17" below. |

### Slice 01a — `ship/v0.2-akita-01a-layout-move`

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **2** | OWASP Top 10 | **NOT-SWEPT** — `n/a — pure rename, no content change` | Taxonomy `1316 R / 0 A / 0 M` at `diff.renameLimit=1`; every output blob OID is copied from `BASE` by `scripts/build-rename-commit.sh:120-141`, so no byte of any security-relevant path changes. The one *path-semantics* consequence — configuration and CI files that name the pre-move locations — is a real finding and is dispositioned under item 7, not laundered into this cell. Gate: **none**. |
| **3** | Code style guide | **NOT-SWEPT** — `n/a — pure rename, no content change` | Same taxonomy. Gate `eslint … src/` is **partial** and irrelevant here: it re-lints the same bytes at new paths. |
| **4** | Avoid `any` | **NOT-SWEPT** — `n/a — pure rename, no content change` | Same taxonomy. `any` occurrence count is invariant across the move by construction. |
| **5** | No repeated / dead code | **DEFERRED** — dead code is *relocated* rather than removed, and the relocation hides it | `apps/frontend/jest.config.json` (F-01, whole file, 96 B) and `apps/frontend/{android,ios}/` (F-10, **89** tracked files) are moved by this commit and appear in **no later slice's diff**. Both are dead: `yarn.lock` at `TARGET` carries **0** `capacitor` and **0** `jest@npm` entries (`git show TARGET:yarn.lock \| grep -ci capacitor` → 0). **Rationale for deferring: structurally blocked by F-15** — no slice pathspec claims these paths, so a deletion cannot land without amending the operator-approved partition. Routed to plan **151-16**. Gate: **none**. |
| **6** | Entities documented | **NOT-SWEPT** — `n/a — pure rename, introduces no entity` | `0 A` in the taxonomy: the commit adds no file and therefore no component, function or type. |
| **7** | Repo documentation updated | **DEFERRED** — the move invalidates path references at scale and they were not updated | **269 occurrences across ~140 files** at `TARGET` still name the pre-move locations. Reproduce: `git grep -I -n -P '(?<!apps/)(?<![A-Za-z0-9_.-])frontend/(src\|tools\|tests\|static\|package\.json\|Dockerfile\|README)' TARGET -- ':(exclude).planning' ':(exclude).claude' ':(exclude).agents' ':(exclude).yarn' ':(exclude)yarn.lock'`. Concrete instances, each verified: **`README.md:12`** — the repo's front-page mascot `<img src="./docs/static/images/shiba-inu-facing-front.png">` is **broken**; that blob exists at `origin/main:docs/static/images/…` and at `TARGET:apps/docs/static/images/…`, and **not** at the path the README names. `.github/workflows/claude.yml`, `.github/workflows/claude-code-review.yml`, `.github/PULL_REQUEST_TEMPLATE` — all three name `frontend/`, all three are byte-identical at both ends and so appear in **no slice's diff**. `apps/docs/**` accounts for ~132 of the ~140 files. **This widens F-04 from 13 files / 20 occurrences to ~140 / 269** — the research measurement caught only the `docs/src/routes/…` spelling. One instance **was** fixed this plan (`.prettierignore:19-24`, F-16). Rationale for deferring the rest: `README.md` is blocked by F-15; the `apps/docs/**` bulk is owned by slice **09** and the `.github/` set by slice **10**, both cut later, and D-07 sweeps bottom-up. Routed to plan **151-16**. Gate: **none**. |
| **8** | Tracking events | **NOT-SWEPT** — `n/a — pure rename, adds no user-available function` | `0 A`; the item's antecedent ("if the change adds functions available to the user") is false. |
| **9** | Svelte component guidelines | **NOT-SWEPT** — `n/a — pure rename, no `.svelte` content change` | The commit moves `.svelte` files with their blob OIDs unchanged; markup, props and slots are byte-identical. |
| **10** | Errors handled and logged | **NOT-SWEPT** — `n/a — pure rename, no content change` | Same taxonomy; no `throw`, `catch` or log site is added, removed or altered. |
| **13** | WCAG A and AA | **NOT-SWEPT** — `n/a — pure rename, no markup change` | `0 M` on every `.svelte` and `.html` path. Gate `assertAxeScan` is **partial** (7 voter routes × 2 themes, per `151-MEASUREMENTS.md` § 1) and is **not cited**, because citing a gate over unchanged markup would be the exact laundering D-18 forbids. |
| **14** | Keyboard + screen-reader | **NOT-SWEPT** — `n/a — pure rename, no markup change` | As item 13. |
| **15** | Developers'/Publishers' Guides | **DEFERRED** — the guides' repo links are invalidated by the move | `apps/docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.md:14-16` links `@openvaa/strapi` → `blob/main/apps/strapi/`, `@openvaa/strapi-admin-tools` → `blob/main/apps/strapi/src/plugins/…` and `@openvaa/frontend` → `blob/main/frontend/`. All three 404 after this stack merges. Owned by slice **09**; routed to plan **151-16**. Gate: **none**. |

### Slice 01b — `ship/v0.2-akita-01b-strapi-removal`

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **2** | OWASP Top 10 | **MET** — the slice only *removes* attack surface, and the removal is complete at the dependency layer | Exhaustive over 01b's surface per D-20: all 252 paths are `D`. Removed: an entire Strapi server (`backend/vaa-strapi/src/`, 213 files), its LocalStack/S3 bootstrap (`backend/vaa-strapi/localstack-init-aws.sh`, `localstack-s3-cors-policy.json`) and its `.env.example`. Verified no residue reaches the shipped tree: `git show TARGET:yarn.lock \| grep -ci strapi` → **0**; `… \| grep -ci localstack` → **0**; `git grep -I -i localstack TARGET -- ':(exclude).planning' ':(exclude).claude' ':(exclude).agents' ':(exclude)apps/docs'` → **0 hits**. Root `package.json` `workspaces` at `TARGET` is `['packages/*', 'apps/*']`, no longer naming `backend/vaa-strapi` or its plugin glob. Gate: **none**. |
| **3** | Code style guide | **NOT-SWEPT** — `n/a — deletions only, no code introduced` | All 252 paths are `D`; the slice introduces no line for a style rule to apply to. |
| **4** | Avoid `any` | **NOT-SWEPT** — `n/a — deletions only` | As item 3. (The deletions strictly *reduce* the repo's `any` count; that is not a claim about anything this slice introduces.) |
| **5** | No repeated / dead code | **FIXED** — commit `70c3ad770` | **F-16**. `.prettierignore:19-24` carried a six-line ignore block for `apps/strapi/**` — a path that has **never existed in this repository**: at `origin/main` the same block reads `backend/vaa-strapi/**` (`git show origin/main:.prettierignore` lines 19-24), so v0.2 *rewrote* the dead block instead of deleting it alongside the tree. Dead configuration naming a nonexistent tree, introduced by the branch. Fixed on `feat-gsd-roadmap`; the file is in slice **10**'s pathspec and slice 10 is uncut, so no re-cut is needed. |
| **6** | Entities documented | **NOT-SWEPT** — `n/a — deletions only, introduces no entity` | All 252 paths are `D`. |
| **7** | Repo documentation updated | **DEFERRED** — the docs site still ships four Strapi guide pages, knowingly | `apps/docs/src/lib/navigation.config.ts:155` (`'Backend (Legacy Strapi docs)'`), `:167-168`, `:259-260` (`'Localization in Strapi (Legacy)'`), `:293-294` (`'Registration Process in Strapi (Legacy)'`) — each **explicitly labelled Legacy**, and `apps/docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.md:1` carries an in-page deferral note (*"Parts of this page reference the legacy Strapi backend which has been replaced by Supabase. Content will be updated in a future release."*). Rationale for deferring: retention is **deliberate and labelled**, not an oversight; the residual defect is the three dead repo links at `:14-16` (see 01a item 15) rather than the pages' existence. Owned by slice **09**; routed to plan **151-16**. Gate: **none**. |
| **8** | Tracking events | **NOT-SWEPT** — `n/a — deletions only, adds no user-available function` | All 252 paths are `D`. |
| **9** | Svelte component guidelines | **NOT-SWEPT** — `n/a — no `.svelte` file in the slice` | The three non-`backend/` deletions are `apps/frontend/tests/strapiDataProvider/strapiDataProvider.test.ts` and two JSON fixtures (`allParties.response.json`, `allParties.result.json`). Zero `.svelte` paths in the slice. |
| **10** | Errors handled and logged | **NOT-SWEPT** — `n/a — deletions only` | All 252 paths are `D`; no error path is introduced or altered. |
| **13** | WCAG A and AA | **NOT-SWEPT** — `n/a — no markup introduced` | As item 9: the slice's non-server files are a test and two JSON fixtures. |
| **14** | Keyboard + screen-reader | **NOT-SWEPT** — `n/a — no markup introduced` | As item 13. |
| **15** | Developers'/Publishers' Guides | **DEFERRED** — same surface as item 7 | The four Legacy-labelled pages plus the three dead links at `app-and-repo-structure/+page.md:14-16`. Owned by slice **09**; routed to plan **151-16**. Gate: **none**. |

### Slice 02 — `ship/v0.2-akita-02-shared-packages`

97 files: **19 A / 3 D / 75 M**, across `app-shared` (19), `data` (31), `filters` (8), `matching` (7),
`core` (7), `llm` (6), `argument-condensation` (6), `question-info` (5), `dev-tools` (4),
`shared-config` (3) and `packages/README.md` (1).

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **2** | OWASP Top 10 | **MET** — exhaustive over the slice's whole security surface, which is two files | D-20 exhaustiveness is affordable here because the slice contains **no** auth, RLS, Edge Function, adapter or request-handling path — it is library code plus one maintainer CLI. The security-relevant surface is `packages/dev-tools/src/keygen.ts` and `pem-to-jwk.ts`, both read line by line: **A02** — `keygen.ts:63-66` rejects `--size < 2048` citing Traficom 213/2023, `:68-71` generates in memory via `jose.generateKeyPair`, and **nothing is written to disk** (`:83-86` writes only to stdout, which `:1-20` documents as the intended handoff to an env var). **A03** — every CLI input is validated before use: `keygen.ts:49-52` (required args), `:54-57` (`--type` enum), `:63-66` (`--size` numeric floor); `pem-to-jwk.ts:53-56`, `:58-61`, `:67-72` (PEM header must match). `packages/data/src/utils/createDeterministicId.ts:55-65` uses `cyrb53`, a **non-cryptographic** 53-bit hash — correct here and documented as such at `:55` and `:59-63`, because the value is an object *identity*, never an authorization token (data-leak prevention is RLS's job, per the note at `apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts:7`). **A05** — a secret-shaped-literal scan over all 97 files (`(api[_-]?key\|secret\|password\|token\|private[_-]?key\|BEGIN … PRIVATE KEY)\s*[:=]\s*"…{8,}"`, case-insensitive) returns **0 hits**; `packages/app-shared/src/settings/staticSettings.ts:5` holds `first.last@openvaa.org`, a documented per-instance placeholder, not a credential. Gate: **none** — complement is the entire item. |
| **3** | Code style guide | **FIXED** — commit `63c1a180e` | Measured over the 56 changed sources: **0** `Foo[]` array-suffix declarations (guide requires `Array<Foo>`, `code-style-guide/+page.md:79`) and **0** single-letter type parameters (`:80`). Every `unknown` is one of the guide's two sanctioned cases (`:86`) — a type-guard predicate (`packages/data/src/utils/typeGuards.ts:19,26,33,41,54,61,69,81,94,101`; `packages/app-shared/src/data/isEmoji.ts:9`, `isImage.ts:7`, `isLocalized.ts:8,15`) or a callback return whose value has no effect on the caller (`packages/core/src/controller/controller.ts:30,35`). Two violations found and fixed — see **F-12** (`packages/app-shared/src/utils/mergeSettings.ts:29,51`) and **F-13** (`:1`). Gate: `eslint --flag v10_config_lookup_from_file src/`, **partial** — measured complement: the script is **`src/`-only**, so `packages/filters/tests/filter.test.ts` and `packages/data/examples/` (both in this pathspec) are unlinted; and the guide's own named-parameter rule is prefixed *"This requirement is not flagged by automatic checks"* (`code-style-guide/+page.md:90`), as is TSDoc completeness. `lint:check` is **0 errors / 20 warnings** at the `151-BASELINE.md` verdict. |
| **4** | Avoid `any` | **FIXED** — commit `63c1a180e` | Within the 97 changed files there are exactly **6** `any` occurrences in code: `packages/app-shared/src/utils/mergeSettings.ts:38,41` (×2), `:43`, `:46` — a **new** file — and `packages/llm/src/llm-providers/provider.types.ts:69`. The latter is **compliant as written**: `StopCondition<any>` carries its reason inline (*"Vercel doesn't support typing this, so we won't either"*). The former was **not**: a bare `/* eslint-disable @typescript-eslint/no-explicit-any */` at `:29` with no documented reason, which is precisely what the checklist and `code-style-guide/+page.md:86` forbid. Fixed — see **F-12**. Gate: `@typescript-eslint/no-explicit-any`, **partial** — measured complement: the rule is *silenced* by the very `eslint-disable` that constitutes the violation, and it cannot express the checklist's "document the reason carefully" clause at all. Repo-wide corrected surface is 14 files / 77 occurrences (`151-BASELINE.md` `any_files_corrected`). |
| **5** | No repeated / dead code | **MET** — the duplication in this slice is *mandated*, and it is documented as such | `packages/{app-shared,argument-condensation,core,data,filters,llm,matching,question-info}/tsup.config.ts` are **byte-identical** — one blob, `60feaafffff1dab48ed50fab6c726bb424b6f51c`, at eight paths — and `packages/{core,data,filters,matching}/LICENSE` likewise (blob `616bdd0e898dd5376a2d2f562ffc8ac24efe8136`). Both are the shape `packages/README.md:23` and `:14` *require* (*"See `@openvaa/core`'s `tsup.config.ts`"*), so this is sanctioned per-workspace configuration, not a DRY violation — a shared config module would break the per-package build isolation the paradigm exists to give. The one genuine near-duplicate is called out **in the code**: `packages/app-shared/src/utils/mergeSettings.ts:9-11` names `mergeAppSettings` in `apps/frontend/src/lib/utils/settings.ts` as *"a separate, SHALLOW merge with different semantics — do not confuse the two"*. No `TODO`/`FIXME`/`HACK`/`XXX` occurrence in the 97 files. Gate: **none**. |
| **6** | Entities documented | **FIXED** — commits `63c1a180e`, `572b5dd20` | All 19 added files carry a module header or TSDoc: `packages/dev-tools/src/keygen.ts:1-20` (purpose, usage, both output blocks), `pem-to-jwk.ts:1-23` (purpose, usage, a worked example), `packages/app-shared/src/utils/mergeSettings.ts:5-20` (full TSDoc with `@param`/`@returns` plus two `NB.` caveats), `packages/README.md` (the paradigm reference itself). One exported entity was undocumented — `export type DeepPartial<TObject>` at `mergeSettings.ts:1-3`, against `code-style-guide/+page.md:48` (*"Add comments to all exported variables…"*) — and was fixed; see **F-13**. Gate: **none**. |
| **7** | Repo documentation updated | **FIXED** — commits `572b5dd20`, `995696502` | The slice **adds** `packages/README.md`, the canonical-paradigm reference, which is the correct repo-doc response to reworking the shared packages. But that same new file closed its divergence list with **"No other packages currently diverge."** (`:31`) while the same slice adds `@openvaa/dev-tools` — and four further `packages/*` workspaces already diverged. Measured: only `core`, `data`, `matching`, `filters` are published (`publishConfig` + `license: MIT` + `LICENSE`); `llm`, `argument-condensation`, `question-info`, `dev-tools` and `shared-config` are all `private: true` with no `LICENSE`, and `dev-tools`, `shared-config` do not build with `tsup` at all (`dev-tools/package.json:8` is `"build": "echo 'Nothing to build.'"`). Fixed — see **F-11**. A second instance in the same slice was found later, by plan 151-10, and fixed by plan **151-11** before this PR opened: **F-18**, `packages/app-shared/README.md:25`, which attributed the historic dual ESM+CommonJS build to `apps/strapi/` — a path that has never existed at either end of the diff (`git ls-tree` returns 0 entries at `ac30f132a` and at the branch tip; the retired backend was at `backend/vaa-strapi/`). Commit `995696502`, landed on `feat-gsd-roadmap` and the slice re-cut from the fixed tip per D-04, so this PR shows the corrected line and never a fix of itself. **F-33** widens the class to 16 files / 46 occurrences repo-wide, 15 of them under `apps/docs/**` and routed to plan 151-16. Deferred sub-findings, both outside this pathspec: `CLAUDE.md` § "Core Logic Packages"/"Experimental" omits `@openvaa/dev-tools` (slice **11**, plan 151-17), and `apps/docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.md:7-21` omits it too (slice **09**, plan 151-16). Gate: **none**. |
| **8** | Tracking events | **NOT-SWEPT** — `n/a — the item's condition is not met: the slice adds no user-available function` | The slice touches the analytics **configuration schema** (`packages/app-shared/src/settings/staticSettings.type.ts:97-118`, `dynamicSettings.type.ts:254`) but contains **no event-firing call site**: a scan of all 97 files for `trackEvent`/`track(`/`umami`/`gtag` returns only type declarations and doc comments, never a call. Event sites live in the frontend (slices 06/07) and are dispositioned there. |
| **9** | Svelte component guidelines | **NOT-SWEPT** — `n/a — no `.svelte` file in the pathspec` | `git diff --name-only <empty-tree> TARGET -- packages ':(exclude)packages/dev-seed' ':(exclude)packages/supabase-types' \| grep -c '\.svelte$'` → **0**. Gate `svelte-check` is **partial** and is **not cited**, because there is nothing in scope for it. |
| **10** | Errors handled and logged | **FIXED** — commit `36dde5287` | The slice's error handling is typed and message-bearing throughout: `DataProvisionError` (`packages/data/src/objects/nominations/base/nomination.ts:43`, `variants/allianceNomination.ts:33`, `objects/questions/base/choiceQuestion.ts:26`), `DataNotFoundError` (`nomination.ts:115`, `allianceNomination.ts:88`), `DataTypeError` (`objects/questions/base/question.ts:138`), and an exhaustive-switch guard at `packages/data/src/utils/createDeterministicId.ts:41`. Logging is package-tagged rather than bare: `packages/argument-condensation/src/prompts.ts:19` and `packages/question-info/src/prompts.ts:19` both emit `console.error('[<package>] Failed to register prompts:', err)`, and `packages/core/src/controller/controller.ts:43-55` routes by `LogLevel`. One gap was found and fixed — `packages/dev-tools/src/pem-to-jwk.ts:64,78`, see **F-14**. Gate: **none**. |
| **13** | WCAG A and AA | **NOT-SWEPT** — `n/a — no markup or route in the pathspec` | 0 `.svelte`, 0 `.html`, 0 route files (item 9's measurement). D-20 makes a11y exhaustive over *routes and components whose markup changed*; this slice contains neither, so the correct record is a declared blind spot rather than a pass. Gate `assertAxeScan` **not cited** — 0 routes in scope. |
| **14** | Keyboard + screen-reader | **NOT-SWEPT** — `n/a — no markup or route in the pathspec` | As item 13. |
| **15** | Developers'/Publishers' Guides | **DEFERRED** — the Developers' Guide's package inventory is now wrong, and it is not this slice's file | `apps/docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.md:7-21` enumerates every workspace; after this slice it is missing `@openvaa/dev-tools`, still lists `@openvaa/strapi` and `@openvaa/strapi-admin-tools` (removed by slice 01b), and links `@openvaa/frontend` to `blob/main/frontend/` (moved by slice 01a). Publishers' Guide: no entry describes the shared packages, so nothing there is invalidated. Rationale for deferring: the file is owned by slice **09**, which D-07 sweeps and cuts later; fixing it from here would put a slice-09 edit in a slice-02 sweep's commit and blur exactly the ownership criterion 6 is built on. Routed to plan **151-16**. Gate: **none**. |

---

## Findings queued for fix

Produced by the sweep above. **F-11 … F-14 and F-16 were at or above D-05's fix bar** and all five
landed on `feat-gsd-roadmap` before any slice was cut, per D-04; **F-15 and F-17** are structural
records rather than code fixes. Numbering continues the pre-seeded series (F-01 … F-10).
**No finding remains queued.**

| ID | Items | Slice (file owner) | Finding | Evidence | Disposition |
|---|---|---|---|---|---|
| **F-11** | 6, 7 | **02** | `packages/README.md` asserts **"No other packages currently diverge."** in the same slice that adds a diverging package. Five `packages/*` workspaces diverge from the canonical shape it defines: `llm`, `argument-condensation`, `question-info` (private, no `LICENSE`), `dev-tools` and `shared-config` (private, no `LICENSE`, no `tsup` build). | `packages/README.md:25-31`; `packages/dev-tools/package.json:2,8`; `packages/shared-config/package.json` | **FIXED** — `572b5dd20` |
| **F-12** | 3, 4 | **02** | A **new** file opens a blanket `eslint-disable @typescript-eslint/no-explicit-any` block with **no documented reason**, over four `as any` casts. Both the checklist item and the style guide require the reason be documented. | `packages/app-shared/src/utils/mergeSettings.ts:29,38,41,43,46,51` | **FIXED** — `63c1a180e` |
| **F-13** | 3, 6 | **02** | Exported type `DeepPartial<TObject>` carries no TSDoc, against *"Add comments to all exported variables…"*. It is the first declaration in a file added by this slice. | `packages/app-shared/src/utils/mergeSettings.ts:1-3`; rule at `apps/docs/src/routes/(content)/developers-guide/contributing/code-style-guide/+page.md:48` | **FIXED** — `63c1a180e` |
| **F-14** | 1, 10 | **02** | The PEM detector accepts `-----BEGIN ENCRYPTED PRIVATE KEY-----` and then hands the blob to `jose.importPKCS8`, which takes **no passphrase** — so an encrypted key surfaces an unhandled library exception, while *every other* invalid input in the same file is explicitly handled with a message and a non-zero exit. The file advertises support it does not have. | `packages/dev-tools/src/pem-to-jwk.ts:64` (the regex), `:77-79` (the import), against the handled paths at `:53-56`, `:58-61`, `:67-72` | **FIXED** — `36dde5287` |
| **F-15** | 5, 12 | **structural** | **A fix to any of the 120 files no slice pathspec claims cannot land without amending the partition.** `build-slice.sh` derives each slice from `PARENT..TARGET` restricted to a pathspec; a `TARGET`-side change to an unclaimed path therefore enters **no** slice, lands in the catch-all, and breaks both `files=0` and criterion 7's byte-identity. This is what blocks **F-01** (`jest.config.json`), **F-10** (the 89 Capacitor orphans) and the broken `README.md:12` image. **Remedy, stated precisely so 151-16 need not re-derive it:** claim the paths by extending an existing pathspec — `README.md` into slice **09** (which already owns the other root markdown, `ROADMAP.md`), and `apps/frontend/{android,ios,jest.config.json}` into slice **10** (which already deletes `capacitor.config.ts`, so F-10's orphans land in the one PR whose reviewer is asking the question). Extending a pathspec to claim a path *nobody* claims cannot create an overlap cell and removes no file from any other slice, so it is a hole-closing correction rather than a re-partition — **but it edits an operator-approved `slices.tsv`, so it is the operator's call, not an agent's.** | `scripts/build-slice.sh:96-119`; the 120-path list reproduced by the command in § "F-17" | **RECORDED → plan 151-16 (operator decision)** |
| **F-16** | 5, 7 | **10** (surfaced by 01b's sweep) | `.prettierignore` ships a six-line ignore block for `apps/strapi/**`, **a path that has never existed in this repository**. At `origin/main` the same block reads `backend/vaa-strapi/**`; v0.2 *rewrote* it to a nonexistent path instead of deleting it with the tree. | `.prettierignore:19-24` at `TARGET`; `git show origin/main:.prettierignore` lines 19-24 for the pre-image | **FIXED** — `70c3ad770` (file is in slice 10's pathspec **and** in its diff; slice 10 was uncut, so no re-cut was needed) |
| **F-17** | 5, 12 | **structural** | **F-09's 842 undercounts the invisible-to-review class by 360.** The enumerated 842 is the *moved-and-identical* subset. The full set of files that ship in the stack and appear in **no** slice's diff is **1,202** = 5,052 tracked at `TARGET` − 4,274 in the comparable diff. The extra **360** were never moved and are byte-identical at both ends: **341 under `packages/`** (inside slice 02's own pathspec), plus `.github/` ×4, `tests/` ×3, `images/` ×2, and `README.md`, `LICENSE`, `eslint.config.mjs`, `prettier.config.mjs`, `vitest.workspace.ts`, `.editorconfig`, `.dockerignore`, `.husky/post-commit`, `design/icons/custom-icons.ai`, `.claude/settings.json`. Relatedly, **the unclaimed-by-any-pathspec count is 120, not 110** — the record's 110 is the subset inside the 842; the other **10** are `README.md`, `LICENSE`, `eslint.config.mjs`, `prettier.config.mjs`, `vitest.workspace.ts`, `.editorconfig`, `.dockerignore`, `images/` ×2, `design/icons/custom-icons.ai`. **Why this is not a partition defect:** the 360 are unchanged by v0.2, so they are outside the phase boundary's "v0.2 net diff" scope and are correctly **NOT-SWEPT — unchanged by v0.2**. Why it still matters: F-09 as written claims 842 files "ship inside the stack with their content reviewed by nobody", and the honest number for that claim is 1,202. The 842 is the narrower and more useful statement — *the files a reviewer of PR #1 sees as a rename line*. | `comm -23 <(git ls-tree -r --name-only TARGET \| sort -u) <(git -c diff.renameLimit=20000 diff --name-only --no-renames C1 TARGET \| sort -u)` → 1202; unclaimed set via the same `comm` against the union of every `slices.tsv` pathspec resolved with `git diff <empty-tree> TARGET -- <specs>` | **RECORDED — widens F-09; the 360 dispositioned NOT-SWEPT here, the 110 + 10 routed to plan 151-16 via F-15** |

### Gate verdicts after the fixes — measured, not assumed

Every fix landed on `feat-gsd-roadmap` before any slice was cut (D-04). All three gates were re-run
with **`TURBO_FORCE=1`**, because a bare re-run can be a cache replay rather than a measurement:

| Gate | `151-BASELINE.md` verdict | After the five fixes | Verdict |
|---|---|---|---|
| `yarn build` | 14/14 | **14 successful / 14 total, 0 cached** | unchanged |
| `yarn test:unit` | **1522** passed / **149** files | **1522** passed / **149** files (16 + 244 + 21 + 22 + 446 + 773 across 1 + 47 + 3 + 1 + 43 + 54), 21/21 tasks, 0 cached | unchanged |
| `yarn lint:check` | 0 errors / **20** warnings | **0 errors / 20 warnings** (core 2, dev-seed 15, frontend 1, tests 2), 11/11 tasks, 0 cached | unchanged |
| `yarn format:check` | RED on exactly **2** PD-03-fenced files | RED on exactly **2** — `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts`, `tests/README.md` | unchanged |

**`e2e_collisions` stays `0`.** PD-01's trigger is a fix *landed* on the branch taking a gate from
green to red; no landed fix did. One transient is recorded for completeness rather than counted: the
first draft of F-14's guard used a template literal for a non-interpolating string and tripped
`quotes` (`packages/dev-tools/src/pem-to-jwk.ts:80`, 1 error). It was corrected before the commit
existed, so nothing ever landed red and PD-01 was never reached. Recording it because a suppressed
transient is how a real collision gets normalised.

**`packages/README.md` was reformatted by `npx prettier --write` on that single file** after the F-11
edit made it newly `format:check`-dirty — a third dirty file would have worsened the baseline. Only
that path was passed; `yarn format` was **not** run, so the two PD-03-fenced files are untouched.

**Commit classifiability (Task 2's acceptance criterion).**
`scripts/verify-commit-taxonomy.sh ad914dc1e..feat-gsd-roadmap` over the four fix commits reports
**unplaced commits: 0**, **[db] gaps: 0**, **shared paths: 0** — which is the criterion as written
("classifiable … without an unknown-class error"). It also reports `planning 0 == 1 FAIL` and
`test 0 == 1 FAIL` and exits 1. **Those two are expected and are not evidence about criterion 4:**
the cardinality clauses 4.1/4.3 are assertions about the *restructured stack* (`C1..TIP`), where the
planning and test slices exist; a four-commit sub-range of the branch's own history contains neither
by construction. Read alongside `151-HYGIENE-REPORT.md`'s rule for the deliberately-red hygiene gate:
a red exit code is only meaningful once you know which rows produced it.

### Recorded discrepancy — the plan's own item numbering

`151-09-PLAN.md` Task 1 directs slice 01a to disposition **item 16** (commit history) and slice 01b to
disposition **item 12** (blast radius). Both are **phase-level** items in this record's arithmetic
(items 1, 11, 12, 16; § "Cell arithmetic"), dispositioned **once** for the whole stack by plan 151-18,
and neither has a per-slice cell to fill. **This record's arithmetic governs** — filling per-slice
cells for them would take `cells_expected` from 163 back toward the superseded 207. The evidence the
plan wanted is not discarded: it is recorded below as input to those phase-level cells, which stay
`PENDING→18`.

**Evidence contributed to phase-level item 12 (shared-dependency blast radius).** Newly measured, and
material to how the stack's intermediate states will be read: `origin/main`'s root `package.json`
declares `workspaces: ['packages/*', 'backend/vaa-strapi', 'backend/vaa-strapi/src/plugins/*',
'frontend', 'docs']`. Slice 01a moves `frontend/` and `docs/` but — being a pure rename by rule —
**does not touch `package.json`**, and slice 01b deletes `backend/vaa-strapi`. The fix lands in slice
**10** (`package.json`). **Therefore every stack state from 01a through 09 declares workspaces that do
not exist, and `yarn install` cannot resolve them.** This is a designed consequence of D-11, not a
defect, and it is the concrete mechanism behind Pitfall 7's "PR #1 will likely be red in isolation"
and D-24's "the trusted green signal is the full suite against the post-sweep branch tip". **Standing
instruction for plan 151-10, which writes `pr-bodies/01.md` and opens PR #1:** state this in the PR
body in these terms — name `package.json`'s five workspace globs, say that three of them are stale
until PR #11, and say that the stack is expected to install and pass only as a whole. A reviewer who
meets a red CI run with no explanation will reasonably read it as a broken PR.

**Evidence contributed to phase-level item 16 (clean, linear history).** Slice 01a's taxonomy is
`1316 R / 0 A / 0 M` at `diff.renameLimit=1` — the strongest available statement that the base commit
is renames only, because exact renames are found by blob-OID hash lookup and are not subject to the
rename limit. This is also the measured cause of the whole-stack `4.4` proxy failure the manifest
predicts: paths change in 01a and contents change later, so a proxy treating a rename as a
modification can never pass over `origin/main..TIP`. Run the gate over `C1..TIP`.

---

## Supabase Backend block — slice 03 only (items 17–25, 9 cells)

| # | Item | Reach | Slice 03 | Gate + complement |
|---|---|---|---|---|
| **17** | New content tables include all common columns | `none` | **MET** | Neither `supabase db lint` nor `lint-schema.mjs` inspects column sets. **Complement: the entire item.** |
| **18** | RLS enabled + standard 5-policy pattern | `partial` | **MET** | `lint-schema.mjs` check **0013** (`apps/supabase/scripts/lint-schema.mjs:38-51`, ERROR) covers the **"RLS enabled" half only**. **Complement: the 5-policy pattern is not checked at all — a table with RLS on and one policy passes.** |
| **19** | RLS policies use `(SELECT auth.uid())` / `(SELECT auth.jwt())` scalar subqueries | `none` | **MET** | No check reads policy bodies. Greppable over 27 SQL files; **no gate exists**. |
| **20** | RLS policies specify `TO anon` / `TO authenticated` | `none` | **MET** | No check reads policy role targets. Same 27-file surface; no gate. |
| **21** | `SECURITY DEFINER` functions set `search_path = ''` | `none` | **MET** | `plpgsql_check` validates PL/pgSQL **bodies**, not function *attributes*. **Complement: `search_path = ''` and schema-qualification are entirely unchecked.** |
| **22** | B-tree indexes on `project_id` and FK columns | `partial` | **DEFERRED** | `lint-schema.mjs` check **0001** (`:53-76`, WARNING, and `lint:sql` runs `--fail-on warning`) covers **FK columns**. **Complement: a `project_id` that is not a declared FK is invisible to it, and index *type* is unchecked.** |
| **23** | Trigger naming conventions | `none` | **DEFERRED** | Neither check reads trigger names. No gate. |
| **24** | pgTAP transaction-boundary pattern + `create_test_data()` | `none` | **FIXED** | Execution is not conformance — a pgTAP file that never `ROLLBACK`s passes if its assertions pass. **Complement: the pattern is unchecked, and the executing job is the conditional one from item 11.** 11 files. |
| **25** | pgTAP assertion patterns | `none` | **MET** | Same as 24 — execution is not conformance. Agent review over the same 11 files. |

> **`yarn db:lint:sql` is not sqlfluff.** It is `supabase db lint --schema public --fail-on warning`
> plus a 174-line local `scripts/lint-schema.mjs` implementing 2 Splinter advisors. `CLAUDE.md`
> overstates it. Correction recorded in `151-MEASUREMENTS.md` § 1.4.

---

## Supabase Adapter block — slice 06 only (items 26–28, 3 cells)

| # | Item | Reach | Slice 06 | Gate + complement |
|---|---|---|---|---|
| **26** | Adapter classes use `supabaseAdapterMixin` with `init({ fetch })` | `none` | `PENDING→14` | No gate. Exhaustively provable by agent over the **24** files under `apps/frontend/src/lib/api/adapters/supabase/` — but nothing enforces it. |
| **27** | Row mapping via `COLUMN_MAP`/`PROPERTY_MAP` | `none` | `PENDING→14` | No gate. Type-checking catches a *wrong* map, not a *missing* one — hand-rolled snake→camel conversion type-checks fine. Same 24-file surface. |
| **28** | `safeGetSession()` (not `getSession()`) for route guards | `none` | `PENDING→14` | No gate. **The highest-value greppable item in the block, and nothing enforces it** — `getSession()` is a valid call that compiles. Agent review. |

---

## Edge Functions block — slice 03 only (items 29–31, 3 cells)

Surface: 3 functions (`identity-callback`, `invite-candidate`, `send-email`), **5 tracked files**
under `apps/supabase/supabase/functions/`. Small enough that exhaustive agent review is affordable.

| # | Item | Reach | Slice 03 | Gate + complement |
|---|---|---|---|---|
| **29** | Verify caller is admin via JWT claims | `none` | **MET** | No gate exists. Same 3-function / 5-file surface. |
| **30** | `createClient()` with `service_role` for privileged operations | `none` | **MET** | No gate exists. Same 3-function / 5-file surface. |
| **31** | HTTP status codes + descriptive error messages | `none` | **MET** | No gate exists. Same 3-function / 5-file surface. |

---

## Cell census

| Group | Cells | Filled | Pending | Blank |
|---|---:|---:|---:|---:|
| Per-slice general (12 × 12) | 144 | 60 | 84 | **0** |
| Phase-level (4 × 1) | 4 | 0 | 4 | **0** |
| Supabase Backend (9, slice 03) | 9 | 9 | 0 | **0** |
| Supabase Adapter (3, slice 06) | 3 | 0 | 3 | **0** |
| Edge Functions (3, slice 03) | 3 | 3 | 0 | **0** |
| **Total** | **163** | **72** | **91** | **0** |

**Slice 04** (plan 151-12) — 6 `FIXED` + 4 `NOT-SWEPT` + 1 `MET` + 1 `DEFERRED`. It is the first
slice in the stack whose `FIXED` count is half its cells, which is what sweeping a large new
package with a real public surface produces: four of the six are documentation defects in prose
that describes the package's own API, and none was reachable by any automated gate.

**The 36 filled cells, by slice** (plan 151-09): **01a** — 9 `NOT-SWEPT` + 3 `DEFERRED`, **0 `MET`**;
**01b** — 8 `NOT-SWEPT` + 1 `MET` + 1 `FIXED` + 2 `DEFERRED`; **02** — 4 `NOT-SWEPT` + 2 `MET` +
5 `FIXED` + 1 `DEFERRED`. Token totals across the three columns: `NOT-SWEPT` 21, `FIXED` 6,
`DEFERRED` 6, `MET` 3 — **`MET` is the rarest verdict in the three cheapest slices in the stack**,
which is the shape an honest sweep of a rename slice and a deletion slice should produce.

---

## Pre-seeded findings

Seeded from `151-MEASUREMENTS.md` § Pre-seeded findings (re-confirmed) — six research findings
re-run against `df81f5e65`, all `holds`, plus two that surfaced during that plan's own measurement.
**A finding that is later fixed stays a row; the `Status` column is what changes.** Item numbers use
the canonical 1–31 index.

| ID | Status | Items | Finding | Evidence (path : lines) | Owning slice | Disposition |
|---|---|---|---|---|---|---|
| **F-01** | holds | 4, 6 | `apps/frontend/jest.config.json` is dead — jest is a dependency of nothing and the file is referenced by nothing. A leftover from `backend/vaa-strapi/jest.config.json`. | `apps/frontend/jest.config.json` (96 bytes, whole file) | **10** | `PENDING→16` — **and see the dropped-finding class below: no slice diff shows this file.** |
| **F-02** | holds | 6, 15 | `apps/frontend/src/lib/server/api/README.md 21-40-30-014.md` — the sole README of `server/api/`, with a GSD artifact ID baked into the filename **and** a stale `/docs/src/routes/…` link. Also the space-containing path behind Pitfall 2. | `…/README.md 21-40-30-014.md:3` | **06** | `PENDING→14` |
| **F-03** | holds | 4, 5 | `apps/frontend/scripts/flatten-current-codemod.mjs` + `store-to-state-codemod.mjs` — one-shot v2.13/v2.14 migration scripts shipped in the product tree, referenced by nothing outside themselves, each printing `PHASE 113` / `PHASE 114` at runtime. | both files, whole | **10** | `PENDING→16` |
| **F-04** | holds — widened | 7, 15 | Stale documentation route path `docs/src/routes/…`. Research: 12 files / 18 occurrences. **Re-measured: 13 files / 20 occurrences across 19 lines.** | `151-MEASUREMENTS.md` § 3.1 (full table — not duplicated here, so it cannot drift) | **spans 6 slices** — 02, 06, 07, 09, 10, 11 | `PENDING→16` (discharged in slice 09 per plan 151-16) |
| **F-05** | holds | 3, 10 | Two `console.warn` strings embedding a planning decision ID in **user-visible runtime output** — not comments, so no codemod reaches them. | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:131,136` | **06** | `PENDING→14`; routed to plan 151-08's judgement residue pass, **not** the D-14/D-16 codemod (T-151-04-03) |
| **F-06** | holds | 5, 6 | The `TODO`/`FIXME`/`HACK`/`XXX` class. **66 occurrences / 50 files** on the union pathspec, **65 / 49** on the baseline pathspec. **All 66 are `TODO`; `FIXME`, `HACK`, `XXX` are each 0.** `git grep -I` is load-bearing — without it the count is inflated by binary matches. | per-token census in `151-MEASUREMENTS.md` § 3.2 | **spans all code slices** | `PENDING→` per owning slice |
| **F-07** | holds | 6, 15 | `.agents/code-review-checklist.md:8` writes the `any` item as `- [<U+00A0>]<U+00A0>Avoid…`. **Not a valid GFM task-list marker — the item cannot be ticked**, and every `^- \[ \] ` census undercounts by one. | `.agents/code-review-checklist.md:8` (bytes `2d 20 5b c2 a0 5d c2 a0`) | **11** | `PENDING→17` |
| **F-08** | holds | 4, 5 | `apps/frontend/tsconfig.tsbuildinfo` is a **tracked build artifact** — machine-generated incremental-compile state, committed to git. | `git ls-files --error-unmatch apps/frontend/tsconfig.tsbuildinfo` → exit 0 | **10** | `PENDING→16` |

---

## The dropped-finding class — 842 files that no slice diff shows

**This section discharges the standing instruction in `151-STACK-MANIFEST.md` § "Four partition
corrections … 4".** The catch-all tripwire catches a dropped **path**; it cannot catch a dropped
**finding**. A file whose content is byte-identical across the layout move is moved by slice 01a and
appears in **no later slice's diff** — a reviewer of 01a sees a rename list, and a reviewer of every
later slice never sees the file at all.

**The disposition surface for these files is the target tree, not any slice's diff.**

Enumerated with the manifest's own command, run this plan against the landed integration commit:

```bash
comm -13 <(git -c diff.renameLimit=20000 diff --name-only --no-renames "$C1" "$TARGET" | sort -u) \
         <(git show --name-only --format= -M "$C1" | sort -u)
```

**Result: 842 files** — `C1 = dd88de20c`, `TARGET = d55587fb1`.

| Area | Files | Claimed by a slice pathspec? |
|---|---:|---|
| `apps/frontend/**` | 603 | 493 fall inside slice **06**'s pathspec; **110 are claimed by no slice at all** |
| `apps/docs/**` | 239 | all inside slice **09**'s pathspec |
| **Total** | **842** | **110 unclaimed** |

The class is entirely inside the two renamed trees, which is definitional: only a file slice 01a
*moves* can be in it.

### The 110 unclaimed — no slice pathspec even nominally owns them

| Group | Files |
|---|---:|
| `apps/frontend/android/` | 55 |
| `apps/frontend/ios/` | 34 |
| `apps/frontend/static/` | 10 |
| `apps/frontend/tools/` | 3 |
| `apps/frontend/tests/` | 2 (`sample.spec.ts`, `password-validation.spec.ts`) |
| `apps/frontend/{jest.config.json, prettier.config.mjs, .dockerignore, .env.example, .npmrc, .prettierignore}` | 6 |

**This does not break the partition or byte-identity.** These files are identical at `C1` and
`TARGET`, so no slice needs to touch them and the catch-all correctly reports `files=0`. It is a
**review** gap, not a construction gap.

### Findings raised by working the class

| ID | Status | Items | Finding | Evidence | Owning slice | Disposition |
|---|---|---|---|---|---|---|
| **F-09** | holds — *new, this plan* | 1, 5, 12 | **The class itself.** 842 files ship inside the stack with their content reviewed by nobody: moved in PR #1 (rendered as a rename list), absent from every later slice's diff. F-01 is one known instance; it is not the only one. | the `comm -13` command above → 842 paths | **structural — spans 01a** | `PENDING→18` — the completeness check must state which of the 842 were reached and which are declared **NOT-SWEPT** with reason (D-20) |
| **F-10** | holds — *new, this plan* | 5, 12 | **Orphaned Capacitor native scaffolding.** `apps/frontend/{android,ios}/` — **89 tracked files** — remain in the tree while `capacitor.config.ts` is **deleted by v0.2** (present at `C1`, absent at `TARGET`). `@capacitor/*` appears in **no `package.json`**, `yarn.lock` has **0** capacitor entries, and no source file imports `@capacitor`. The removal was incomplete. **A reviewer of slice 10 sees `capacitor.config.ts` deleted and would reasonably conclude the removal is complete — the 89 orphaned files are invisible to them.** | `git ls-files 'apps/frontend/android' 'apps/frontend/ios' \| wc -l` → 89; `grep -c -i capacitor yarn.lock` → 0 | **10** (config deletion) / unclaimed (the 89) | `PENDING→16` |

### Standing instruction for the sweeping plans (151-09 … 151-17)

1. **Slice 01a's sweep (plan 151-09) owns the class as a whole.** It is the only slice whose diff
   contains these paths at all, even if only as renames.
2. A per-slice sweep whose pathspec *contains* class members (**06**: 493, **09**: 239) must reach
   them **from the target tree**, not from the slice diff — the diff will not deliver them.
3. The **110 unclaimed** files have no owning sweep by pathspec. Plan **151-09** must disposition
   them explicitly, or declare them **NOT-SWEPT** with a reason. Silence is a record defect.

---

## The D-22 integration commit — its own row

D-22 requires this content to carry its own disposition line, because **no v0.2 commit produced
it**. Landed by this plan as commit **`d55587fb1`**, a two-parent merge of `feat-gsd-roadmap` with
`origin/main` (`ac30f132a`).

| File | Verdict | Evidence |
|---|---|---|
| `apps/docs/src/routes/+page.svelte` (+11 lines) | `PENDING→16` | Auto-merged, **0 conflict markers**. Both main's YouthVotes block and the branch's own a11y attributes (`role="group"`, showcase `aria-label`, `sr-only` prev/next labels) present in the merged blob. **In slice 09's diff — this file IS reviewed.** |
| `apps/docs/static/images/youthvotes-logo.png` | **MET** — plan 151-09, reached from the target tree | Blob `f109566c5`, byte-identical at `C1` and `TARGET`, absent from the pre-move `docs/` path. **In the dropped-finding class — reviewed by NO slice diff**, which is precisely why it is dispositioned here rather than left to slice 09. Placed by merge-ort's directory-rename detection; no hand resolution. **Swept from the tree, not from a diff, and the one thing worth checking about a relocated static asset is whether its reference still resolves — it does:** the only reference is `apps/docs/src/routes/+page.svelte:171` `src="/images/youthvotes-logo.png"`, and SvelteKit serves `static/` at the site root, so `apps/docs/static/images/youthvotes-logo.png` is exactly the file that URL resolves to. Had merge-ort placed it under the pre-move `docs/static/` instead, the reference would have 404'd silently in a slice whose diff does not contain the asset. Contrast `README.md:12` (01a item 7), where the same class of relocation **did** break its reference and no slice diff shows it. |

**Open item for the sweep of slice 09 (plan 151-16), items 2 and 13.** The merged block contains
`<a href="https://nuorisoala.fi/…" target="_blank" class="link">` with **no `rel="noopener noreferrer"`**.
Modern browsers imply `noopener` for `target=_blank`, so severity is low — but it arrived from
`origin/main`, is produced by no v0.2 commit, and would otherwise be dispositioned by nobody. It is
recorded here so the sweep cannot miss it. The same block's opening `<div>` is indented one space
where its siblings use two, which may make `format:check` newly dirty on this file (baseline is
already RED on two cosmetic prettier files — PD-03 fences those out of D-05's fix bar).

---

## Open discrepancies — recorded, not silently resolved

| # | Discrepancy | Resolution taken here |
|---|---|---|
| 1 | `151-06-PLAN.md` frontmatter and `<verify>` say `items_total: 30`; the file has 31 items. | `items_total: 31` is authoritative (`151-MEASUREMENTS.md` § 0). The plan's grep is superseded and is not evidence for this record. |
| 2 | The plan's `cells_expected` formula yields 207; its own action text yields 163. | **163.** Arithmetic shown above; the formula double-counts the 4 phase-level items. |
| 3 | `151-STACK-MANIFEST.md` says **151-17** must run the taxonomy gate over `C1..TIP`; `151-18`'s objective explicitly names "commit taxonomy" among the phase's closing proofs. | Item 16 cites **151-18**. Flagged so whichever plan runs it does so knowingly rather than both assuming the other did. |
| 4 | **`CLAUDE.md` is stale on all three `apps/supabase/` paths** — it cites `apps/supabase/migrations/`, `apps/supabase/functions/` and `apps/supabase/tests/`; every one of them is really nested one level deeper (`apps/supabase/supabase/…`). Measured: `git ls-files 'apps/supabase/migrations/*'` → **0 files**, `apps/supabase/supabase/migrations/*` → **3**. The code-review checklist has the Edge Functions path right; `CLAUDE.md` has it wrong. | Recorded under F-04's family for slice 11's sweep (`CLAUDE.md` rides slice 11 per D-15). **Load-bearing for PD-02**: the migration gate as written in `151-06-PLAN.md` matches a directory that does not exist, so an unqualified reading of it would never fire — see the path note under PD-02. |
| 5 | The standing sum-check `Σ files == 4255` now reads **4257**. | **Benign and fully attributed.** Reconstructing plan 151-05's own target at its measurement tip `faf55161b` reproduces tree `e424d633e` and total **4255** exactly; the delta is exactly two files — `151-05-SUMMARY.md` and `151-STACK-MANIFEST.md` — written by 151-05's own doc commits. **Zero files left the set.** The assertion is re-baselined to **4257** and will keep growing as each plan writes its own `.planning/` artifacts (which ride slice 11). **Re-measured by plan 151-09 at `TARGET` `27193876e`: 4274**, and Σ per-slice `files=` equals it exactly (gap 0). The whole +19 delta is slice 11's `.planning/` growth — every other slice's count is unchanged from the manifest's table, file for file — so the drift remains fully attributed and the assertion is re-baselined again to **4274**. |

---

## Procedural decisions

**Reproduced verbatim from `151-06-PLAN.md` so an executing agent in plan 151-11 or 151-14 reads the
rule from the record it is already writing into, not from a plan file it may not have loaded.**

Both decisions are governed by frontmatter counters: `e2e_collisions` and `migrations_added`, both
`0` at scaffold time and incremented by the plan that triggers them. **A collision that occurs and
is not reflected in `e2e_collisions` is a record defect**, and the same is true of a migration that
lands without moving `migrations_added`.

### The escalation trigger, stated once and unambiguously

**Option B is the default for any collision. Option C is reachable only when the colliding finding
is a security or correctness defect, and reaching it requires a blocking operator decision, never an
agent's judgement. No agent may create a waiver unilaterally, under any circumstances.**

---

### Decision PD-01 — the E2E escape hatch (Q2, answered here, not at 2am)

`CLAUDE.md`'s cardinal rule is absolute; D-05's fix bar says fix anything a reviewer would block on.
D-13 already shrinks the collision surface by excluding code restructuring. This is the written rule
for what happens when they still collide.

**Trigger.** A fix landed on `feat-gsd-roadmap` under D-05's fix bar causes `yarn test:unit`,
`yarn lint:check`, or the D-24 full-suite `yarn test:e2e` to go from green to red, **and** the
accompanying test repair is not tractable within the owning slice's work.

**Action — option B, the default.** Revert the fix. Record the finding in `151-DISPOSITION.md` with
verdict `**DEFERRED** — E2E collision`, evidence = the failing spec name and line, the reverted
commit SHA, and a one-line statement of what the fix would have been. D-05 already provides for
deferral with rationale; this is that mechanism, used deliberately. The cost is that a
known-blockable finding ships unfixed — and it ships **visible in the disposition matrix**, which is
exactly where a reviewer will look.

**Escalation — option C, security or correctness only.** If the colliding finding sits at the top of
D-05's bar (a security or correctness defect), do **not** silently defer. Halt and raise a
`checkpoint:decision` proposing a `151-CARDINAL-RULE-WAIVER.md` in the shape of
`.planning/v2.14-CARDINAL-RULE-WAIVER.md`: named, operator-signed, single-defect,
explicitly non-precedent-setting, with attached conditions and a required discharge.

**State this to the operator when raising it, in plain words:** v2.14's waiver was taken once, for
an undiagnosed intermittent, and was discharged at v2.15 Phase 138 with its original text retained
as history. Its own **condition 4 reads: "No other intermittent inherits this reasoning. A second
waiver would mean the rule has stopped functioning."** Invoking option C is therefore itself a
signal about the health of the rule, and the operator is being asked to pay that cost knowingly
rather than have it slipped past them as paperwork.

**Never.** Skip a test, retry until green, or annotate as flaky. `CLAUDE.md` forbids all three and
this phase does not create an exception to that.

#### v2.14 waiver condition 4 — quoted in full, from the source

Source: [`.planning/v2.14-CARDINAL-RULE-WAIVER.md`](../../v2.14-CARDINAL-RULE-WAIVER.md) § "Conditions attached", lines 58–60.
**PD-01's inline quotation above is abridged; this is the complete sentence, verbatim:**

> 4. No other intermittent inherits this reasoning. A second waiver would mean the rule has stopped
>    functioning, and should be treated as evidence that the rule needs rewriting rather than
>    re-waiving.

**Three facts from that same file that raise the cost of option C, and which must be stated to the
operator alongside it:**

1. **The waiver was DISCHARGED on 2026-08-14** (v2.15 Phase 138, INTEG-03), unrenewed, and closed by
   a named root cause rather than by absence of reproduction. Its closing line reads:
   *"The cardinal E2E rule is back in force, unwaived, with no standing exception anywhere in the
   project."* (`v2.14-CARDINAL-RULE-WAIVER.md:220`)
2. **Condition 4 was answered "Honoured"** at discharge, on the specific evidence that
   *"exactly one file matching `.planning/*WAIVER*.md` is present in the project after this
   discharge, and it is this one."* (`:126-127`) **Creating `151-CARDINAL-RULE-WAIVER.md` would
   falsify that recorded audit fact** — which is not an argument that it may never be done, but is
   an argument that it cannot be done quietly.
3. A waiver taken now would therefore be the **first since the rule was restored to full force** —
   precisely the "second waiver" condition 4 identifies as evidence that *the rule needs rewriting
   rather than re-waiving*. Option C is consequently a decision about the rule, not only about the
   defect in front of it.

---

### Decision PD-02 — the migration gate (schema-scan resolution)

The deterministic schema scan is inconclusive for this phase: the scope *references*
`apps/supabase/` and migrations (criterion 4.6's db tag) but the phase modifies no schema by design.
**We do not conclude that no migration can arise.** The checklist's Supabase Backend block asks for
RLS-pattern conformance — the 5-policy set, scalar-subquery auth calls, explicit role targets,
`SECURITY DEFINER` with a pinned empty `search_path` — and the fix for a non-conforming policy **is
a new migration**.

**Rule.** If any sweep fix in the slice-03 plan (151-11) adds or edits a file under
`apps/supabase/migrations/`, that fix is `[BLOCKING]`:

1. Apply it locally with `yarn db:reset` before the slice is cut — build and type checks pass
   without it, so nothing else catches an unapplied migration.
2. Run `yarn db:lint:sql` and the pgTAP suite against the reset database.
3. The D-24 full-suite gate in plan 151-18 must run against a database reset from migrations, not
   an incrementally-mutated one.
4. Record `migrations_added: <n>` in `151-DISPOSITION.md` frontmatter. If no migration is added,
   record `migrations_added: 0` and the gate is a recorded no-op rather than an unasked question.

#### Two path notes for whoever applies this rule

- **The rule names `apps/supabase/migrations/`. The migrations actually live under
  `apps/supabase/supabase/migrations/`** — the same doubled-directory shape as
  `apps/supabase/supabase/functions/`. Watch a fix land one level up and evade the gate; match on
  the real path, and treat the rule as covering both spellings.
- **`yarn db:lint:sql` is not sqlfluff.** It is `supabase db lint --schema public --fail-on warning`
  plus a 174-line local `scripts/lint-schema.mjs` implementing 2 Splinter advisors. `CLAUDE.md`
  overstates it (`151-MEASUREMENTS.md` § 1.4). Step 2 buys less than its name suggests: **neither
  check reads policy bodies, policy role targets, function attributes, trigger names, or column
  sets** — items 17, 19, 20, 21 and 23 are `none`-reach and remain agent review.

---

---

## FOR PLAN 151-18 — criterion 3 is CLOSED, and its gate is red on purpose

`hygiene-grep-report.sh --assert-clean` exits **1**, and that is the **closed, approved**
state of criterion 3 — not an unfinished sweep and not a blocker for the phase close.

> **Read rule:** a red `--assert-clean` carrying **exactly** the two rows `task-id` (84) and
> `phase-ref` bare (11) is a **PASS** for criterion 3. Any *other* red row is a real failure.

Both rows are recorded KEEP verdicts, operator-approved 2026-08-17 on measured evidence:
`task-id` because `determinism-batch.sh:96` → `:493` matches a Playwright step title as a
functional string (stripping it breaks the determinism gate silently), and `phase-ref`
because the 11 remaining occurrences are benchmark / pgTAP / condenser **step labels**, not
planning references. Full argument in `151-HYGIENE-REPORT.md` § "Criterion 3 is CLOSED".

The proposal to re-scope those two rows to REPORT-only (the `milestone-ver` precedent) was
**deliberately not applied** and is **deferred to plan 151-19**, where gate design is the
subject. A red gate with two named, measured exceptions is stronger evidence than a green
gate re-scoped until it passed.

## Plan 151-08 findings — planning references reaching a user, plus one shipped-bug record

Added by plan 151-08 (comment-hygiene Stage 2). These are **phase-level** rows: they were found by
the hygiene pass across the whole tree, before any slice was cut, and each was fixed on
`feat-gsd-roadmap` per D-04.

### Checklist items 3 + 10 — internal vocabulary crossing into user/operator-visible output

A planning reference that reaches a user is a **defect**, not untidiness. The plan anticipated two
such sites; the file-by-file pass found **ten**. All ten were rewritten so the message still reads
as a complete sentence — the reference was not merely excised.

| # | File:line | Surface a reader/operator sees | Reference removed | Disposition |
|---|---|---|---|---|
| 1 | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:130` | `console.warn` in the running voter app | `Phase 62`, `D-06` | FIXED — message rewritten |
| 2 | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:137` | `console.warn` in the running voter app | `Phase 62`, `D-06` | FIXED — message rewritten |
| 3 | `apps/frontend/eslint.config.mjs:95` | ESLint error text shown to every contributor | `v2.11 K1`, `.planning/v2.11-DECISIONS.md` | FIXED — message rewritten |
| 4 | `packages/dev-seed/src/cli/teardown-help.ts:34` | `seed:teardown --help` output | `D-58-17` | FIXED |
| 5 | `packages/dev-seed/src/generators/AccountsGenerator.ts:48` | `ctx.logger` warning during a seed run | `D-11` | FIXED |
| 6 | `packages/dev-seed/src/generators/ProjectsGenerator.ts:48` | `ctx.logger` warning during a seed run | `D-11` | FIXED |
| 7 | `packages/dev-seed/src/generators/NominationsGenerator.ts:174` | thrown `Error` message | `D-06` | FIXED — "topo order" → "topological order" |
| 8 | `packages/dev-seed/src/generators/FeedbackGenerator.ts:65` + `src/writer.ts:196-197` | `ctx.logger` warnings during a seed run | `Phase 56`, `Phase 58` | FIXED — asserted substrings preserved (see below) |
| 9 | `tests/scripts/e2e-run.sh:251,445,456` | operator stdout from the E2E runner | `Phase 138`, `D-12`, `D-17` ×2 | FIXED |
| 10 | `tests/scripts/determinism-batch.sh:530,533` | operator stdout, `REASON=` lines | `D-17` ×2 | FIXED |

**Re-decision recorded (PD-01 trigger).** Row 8's first rewrite changed more wording than the
reference required and reddened two unit tests that assert on the message substrings
(`synthetic feedback disabled`, `feedback writes skipped`). Per PD-01 the item was re-decided rather
than the tests edited: the messages were re-cut to remove only the reference and preserve the
asserted wording. Both tests pass untouched. Editing the assertions would also have gone green and
would have been worse — it would have moved a test to fit a comment sweep.

### Checklist item 5 — known-incomplete code shipped, recorded not fixed

| File:line | Finding | Disposition |
|---|---|---|
| `apps/frontend/src/lib/admin/components/jobs/FeatureJobs.svelte:103` | Admitted shipped bug in the admin Past Jobs section: *"Past Jobs Section. Currently has a bug. TODO: fix bug of not showing past jobs. If we even want to keep this section. Do we?"* | **RECORDED, NOT FIXED** |

This sits at D-05's fix bar as a genuine correctness finding, and it is the one TODO in the tree
that does. It was deliberately left unfixed under the operator's `leave-and-record` answer.

> **Open product question for the operator, deliberately unanswered:** the comment asks *"If we even
> want to keep this section. Do we?"* Fixing the bug and deleting the section are both defensible,
> and the choice is a product decision an agent has no standing to make. A reviewer meeting this
> section in the PR stack should be pointed at this row.

### Checklist item 3 — TODO inventory disposition

The remaining 64 TODO occurrences across 48 files are **left in place by operator decision**
(`leave-and-record`), recorded here as an inventory rather than removed. Locality was the deciding
argument: `TODO[Node 24]` beside the polyfill it will replace carries more information in place than
in a tracker, and triaging them would have touched ~46 source files for a non-blocking concern —
inflating the exact diff this PR stack exists to make reviewable. Full breakdown, including the two
non-actionable prose mentions and the three generated-file mirrors, is in `151-HYGIENE-REPORT.md`
§ "The TODO class".

One relabel was applied: `apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts:7` carried a
`TODO:` marker on what is actually a correct rationale note about RLS owning data-leak prevention.
The marker became `Note:`; the sentence is unchanged.


## Plan 151-10 finding — F-18, raised while verifying PR 01b's body

**F-18 — `packages/app-shared/README.md:25` cites `apps/strapi/`, a path that has never existed.**

| | |
|---|---|
| **Items** | 5 (dead/incorrect content), 7 (repo documentation) |
| **Found during** | verifying PR 01b's "is anything still referencing Strapi?" claim against the shipped tree, rather than copying 151-09's verdict |
| **Slice** | **02** — the file is in slice 02's diff (`git show --name-only ship/v0.2-akita-02-shared-packages` contains it) |
| **Status** | **DEFERRED — routed to plan 151-11** |

The line reads: *"The historic dual ESM+CommonJS build was added to support `apps/strapi/`, which has
been retired."* Measured: `git ls-tree ac30f132a apps/strapi` -> **0 entries**, and
`git ls-tree HEAD apps/strapi` -> **0 entries**. The retired backend lived at `backend/vaa-strapi/`.

**This is the same class as F-16** — the `.prettierignore` block that ignored `apps/strapi/**`, a path
that never existed, which v0.2 had *rewritten* rather than deleted along with the tree. F-16 was at the
fix bar and was fixed. F-18 is the same defect in prose, and the class now has two members, which makes
it a pattern rather than a one-off: **v0.2 rewrote references to the dead backend using a path it never
had.** A later plan should grep for `apps/strapi` across the whole target tree rather than assume these
two are all of them.

**Why it is not fixed here.** It is not this plan's file and not this plan's slice; this plan's scope is
publishing. Fixing it means landing the fix on `feat-gsd-roadmap` per D-04 and **re-cutting slice 02**.
That is cheap **now**, while slice 02 is cut but its PR is unopened, and expensive once **151-11** opens
PR 3 — at which point a fix requires force-pushing a PR already under review, which is exactly what
D-07's one-slice lag exists to avoid. **151-11 should fix it before opening PR 3.**

**Recorded so nobody re-raises it: the two other `strapi` matches in the shipped tree are not findings.**
`git grep -i strapi` over the tree, excluding `.planning`, `.claude`, `.agents` and `apps/docs`, returns
exactly two files:

- `packages/dev-seed/src/generators/AccountsGenerator.ts:46,50` — a **false positive**. The match is
  inside the identifier `bootstrapId` (`boot`+`strapI`+`d`). There is no Strapi reference in this file.
  A case-insensitive `strapi` grep will always hit `bootstrap*` identifiers; use a word-boundary or
  path-shaped pattern instead.
- `packages/app-shared/README.md:25` — F-18 above.

Neither is a live reference, so **slice 01b's item-2 `MET` verdict stands**: the removal is complete at
the dependency layer (`yarn.lock` at the shipped tree carries **0** `strapi` and **0** `localstack`
entries, and the root `package.json` `workspaces` no longer names `backend/vaa-strapi`).

## Slice 03 — `ship/v0.2-akita-03-supabase` — cell-by-cell evidence

**Filled by plan 151-11.** This is the only slice where the Supabase Backend (17–25) and
Edge Functions (29–31) blocks apply at all, so 28 item sets are dispositioned here: the 12
per-slice general items plus those 12 conditional ones, plus the four phase-level items,
which are **not** re-run here and whose cells reference the phase-level row above.

Measured refs for this pass:

| ref | value |
|---|---|
| `BASE` = `origin/main` | `ac30f132a` — still unmoved |
| `TARGET` = `feat-gsd-roadmap` at sweep time | `0adaec37b`; at cut time, after this plan's six fixes, `6ded54a39` |
| slice-03 file set | `diff --no-renames ship/v0.2-akita-02-shared-packages..TARGET -- apps/supabase packages/supabase-types supabase` → **118 files, all `A`** |
| local Supabase | running; `[db] port = 54322` per `supabase/config.toml:29`; database reset from migrations before every measurement below |

### Sweep surface, stated before any verdict (D-20)

| In surface | Count |
|---|---|
| SQL schema definition files (`supabase/schema/*.sql`) | 21 files / 3,409 lines |
| applied migrations (`supabase/migrations/*.sql`) | **3** files / 3,526 lines |
| pgTAP tests (`supabase/tests/database/*.sql`) | **11** files / 272 assertions |
| Edge Functions (`supabase/functions/**`) | 3 functions / **5** tracked files / 1,097 lines |
| TypeScript + tooling | `packages/supabase-types/src/*.ts` ×3, `scripts/lint-schema.mjs`, `vitest.config.ts`, 2 `package.json`, 2 `tsconfig` |
| benchmarks (`apps/supabase/benchmarks/**`) | 62 files — k6 / pgbench harnesses and their recorded results |

**Declared out of surface, with reason (D-20 makes the reason mandatory):** none. Every
one of the 118 files is inside at least one lens below. The 62 benchmark files are swept
under items 2, 5 and 7 only — they are a measurement harness with no runtime path into the
application and no production credential — and that narrower treatment is stated here
rather than left implicit.

### The eight enumerable security checks — counts, not samples

Each row gives the command whose output produced it. **Counts are of the `schema/` copy**,
which is the readable authority; the same constructs in `migrations/00001` were counted
separately and agree.

| Check | Command | Checked | Conforming |
|---|---|---:|---:|
| RLS policies use `(SELECT auth.uid())` / `(SELECT auth.jwt())` scalar subqueries, never a bare call | `grep -ohE 'auth\.(uid\|jwt)\(\)' schema/*.sql migrations/*.sql \| wc -l` for the denominator; the same after `sed -E 's/\(\s*SELECT[[:space:]]+auth\.(uid\|jwt)\(\)/(SELECT XX/g'` for bare survivors | **56 occurrences** | **56** — bare survivors: **0** |
| every policy names an explicit role target | awk join of each multi-line `CREATE POLICY` up to its terminating `;`, then extract the `TO <role>` token | **97 policies** | **97** — `authenticated` 80, `anon` 15, `supabase_auth_admin` 1, `service_role` 1 |
| RLS enabled on tables | `ALTER TABLE … ENABLE ROW LEVEL SECURITY` vs `CREATE TABLE` census | **20 tables** | **19** — the 20th is `private.feedback_rate_limits`, see below |
| standard five-policy set on content tables | per-table policy census from the same awk join | **13 content tables** | **13** |
| `SECURITY DEFINER` functions pin `SET search_path = ''` | awk over each `CREATE … FUNCTION` header up to its `AS $$` | **9 functions** (18 counting the migration copy) | **9** (18) |
| B-tree indexes on `project_id` and every FK column | `scripts/lint-schema.mjs` check 0001, **after this plan repaired it**, cross-checked against a static read of `200-indexes.sql` | **32 FK columns**, 13 of them `project_id` | **30** — 2 gaps, see F-29 |
| pgTAP transaction-boundary pattern + `create_test_data()` | per-file census of `BEGIN;` / `ROLLBACK;` / `plan(` / `finish()` / `create_test_data()` | **11 files** | **11** |
| Edge Functions verify admin via JWT claims before any privileged operation | full read of all 5 files | **2 admin-gated functions** | **2**; the third is the public identity callback, whose control is the JWKS signature check |

Two of those rows need their qualifier stated rather than buried:

- **`private.feedback_rate_limits` has no RLS, and that is correct.** It lives in the
  `private` schema, which `config.toml:13` does not expose (`schemas = ["public",
  "graphql_public"]`), and `CREATE SCHEMA private` grants `USAGE` to nobody. The asymmetry
  with `public.storage_config` — which *does* carry `ENABLE ROW LEVEL SECURITY` plus
  `REVOKE ALL … FROM anon, authenticated, public` at `400-storage.sql:37-39` — is explained
  by exposure, not by inconsistency: `storage_config` is in the exposed schema and needs
  both. `storage_config` carries **zero policies**, which with RLS enabled is deny-all and
  is the intended shape.
- **The five-policy denominator is 13, not 18.** Five tables carry a deliberately different
  set and are not content tables: `accounts` and `projects` (4 — no `anon_select`, they are
  never voter-facing), `admin_jobs` (3 — admin-only, no UPDATE), `feedback` (4 — insert-only
  by design, `-- No UPDATE policy -- feedback is immutable after insert`), `user_roles` (2 —
  `supabase_auth_admin` read for the token hook, `service_role` manage). Two join tables
  carry 4 (no `admin_update`: a row is its own key). `candidates` and `organizations` carry
  6 — the standard five plus `candidate_update_own` / `party_update_own_organizations`.

### Slice 03 — general items (12 cells)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **2** | OWASP Top 10 | **FIXED** — commits `fb05eca78`, `cd96d1ff4` | Exhaustive over the slice per D-20: all 97 RLS policies, all 9 `SECURITY DEFINER` functions, all 5 Edge Function files and all 3 migrations read. **A01** — 97/97 policies name an explicit role and 56/56 auth-identity calls use the scalar-subquery form; cross-tenant reads are covered by `01-tenant-isolation.test.sql` (green). **A02** — `send-email` disabled TLS certificate verification on the credentialed production path (**F-26**, fixed, `index.ts:214-231`); `storage_config` holds a service-role key in a plaintext column (**F-32**, deferred). **A03** — `invite-candidate:39-47` and `send-email:54-79` validate every field before use; the bulk RPCs build dynamic SQL through `quote_literal`/`quote_ident` (`501-bulk-operations.sql`). **A07** — `identity-callback` verified the JWT signature and audience but never the issuer (**F-23**, fixed, `index.ts:69-93`). **A10 (SSRF)** — the only outbound URLs are `IDENTITY_PROVIDER_JWKS_URI` and `SITE_URL`, both from the environment and neither reachable from request input; `redirectTo` at `identity-callback:318` is likewise environment-derived, so there is **no open redirect and no SSRF**. This closes T-151-11-05 by measurement. Gate: **none**. |
| **3** | Code style guide | **MET** | The 9 TypeScript/JS files in the slice pass `yarn lint:check` with 0 errors and contribute 0 of the 20 warnings; `yarn format:check` is clean on every file in the slice (the two red files are PD-03-fenced and in other slices). SQL follows one house shape across all 21 `schema/` files: a banner comment naming the file's functions, `public.`-qualified identifiers, lower-case keywords for types and upper-case for statements. Gate: `eslint` + `prettier`, **partial** — **complement: neither reads SQL, which is 32 of the 118 files and 96% of the slice's lines.** |
| **4** | Avoid `any` | **FIXED** — commit `fb05eca78` | Exhaustive: `grep -c '\bany\b'` over every `.ts`/`.mjs` in the slice returns non-zero for exactly one file. `packages/supabase-types/src/database.ts` — 5,000+ generated lines — contains **0**. The two occurrences are `identity-callback/index.ts:107` (`supabaseAdmin: any`) and `:133` (`(u: any)`), each already carrying a `deno-lint-ignore no-explicit-any` but **no documented reason**, which both this item and the style guide require. **F-25**, fixed by adding the reason. Gate: `@typescript-eslint/no-explicit-any`, **partial** — **complement: Deno files under `supabase/functions/` are outside the eslint project and are linted by `deno lint`, which no repository script runs.** |
| **5** | No repeated / dead code | **DEFERRED** — the schema ships twice and two build artifacts are tracked | `supabase/schema/` (21 files, 3,409 lines) is a second copy of `supabase/migrations/00001` with 00002 and 00003 folded in. Verified: concatenating `schema/*.sql` in filename order and diffing against `migrations/00001_initial_schema.sql` yields exactly the three hunks that migrations 00002 and 00003 apply, and nothing else. It is deliberate — each migration header names the schema files it mirrors — but **nothing verifies the two agree**, and `config.toml:58` leaves `schema_paths = []`, so the CLI never reads `schema/`. The duplication is not removed here (that is a workflow decision, not a cleanup); it is now **documented** in the new `apps/supabase/README.md`, commit `6ded54a39`. Separately **F-31**: `packages/supabase-types/tsconfig.tsbuildinfo` and `supabase/.branches/_current_branch` are tracked build/CLI artifacts — same class as **F-08**, and routed with it to plan **151-16** so the whole class is decided once. Gate: **none**. |
| **6** | Entities documented | **FIXED** — commit `6ded54a39` | Every `schema/*.sql` opens with a banner naming its functions; every `SECURITY DEFINER` function carries a comment stating why it is definer-rights; all three Edge Functions have header docblocks; `claimConfig.ts` documents each field of `ProviderClaimConfig`. The gap was at the **workspace** level: `apps/supabase/` shipped no README while holding 6,900 lines of SQL in two directories with no statement of which is authoritative (**F-28**). Fixed. `identity-callback`'s docblock also omitted `IDENTITY_PROVIDER_ISSUER` from its environment list; added in `fb05eca78`. Gate: **none**. |
| **7** | Repo documentation updated | **FIXED** — commits `6ded54a39`, `995696502` | `CLAUDE.md` is stale on all three Supabase paths — it cites `apps/supabase/{migrations,functions,tests}` where the real paths are `apps/supabase/supabase/{…}` — but `CLAUDE.md` rides slice **11** under D-15 and is not edited here. What was in this slice's reach is the missing workspace README, now added with the authoritative-directory statement, the real reach of `yarn db:lint:sql`, and the two traps this sweep found. Also fixed in this plan, though owned by slice 02: **F-18**, `packages/app-shared/README.md:25`, which cited `apps/strapi/`. **F-33** widens that: `git grep -c 'apps/strapi'` over the shipped tree returns **16 files / 46 occurrences** of a path that has never existed, 15 of the files under `apps/docs/**` (slice 09) — routed to plan **151-16** with F-04. Gate: **none**. |
| **8** | Tracking events | **NOT-SWEPT** — `n/a — no user-available function in this slice` | The slice's user-reachable surface is a database and three server-side functions. No analytics call site exists anywhere in the 118 files (`grep -ri 'umami\|plausible\|gtag\|trackEvent'` → 0 hits); event tracking is a frontend concern and lives in slices 06 and 07. |
| **9** | Svelte component guidelines | **NOT-SWEPT** — `n/a — no `.svelte` file in the slice` | Extension census over the 118 files: 56 `.sql`, 39 `.json`, 9 `.ts`, 4 `.sh`, 2 `.js`, and one each of `.mjs`, `.toml`, `.py`, `.md`, `.tsbuildinfo`, `.gitignore`. Zero `.svelte`. |
| **10** | Errors handled and logged | **FIXED** — commit `fb05eca78` | Exhaustive over the three Edge Functions, which are the slice's only request-handling code. Each wraps its whole body in `try`/`catch`, returns a typed JSON error, and distinguishes 400 / 401 / 403 / 405 / 500. `invite-candidate:150-176` logs and continues on the two non-fatal post-invite steps and rolls the candidate row back when the invite itself fails. The defect was **F-22**: `send-email` called `resolve_email_variables` with `user_ids` / `template_body` / `template_subject` against a function declaring `p_`-prefixed parameters, so **every invocation returned `PGRST202` and the handler turned it into HTTP 500** — the error path was well-built and permanently taken. Proven live, not argued: the un-prefixed POST returns `{"code":"PGRST202", … "hint":"Perhaps you meant to call the function public.resolve_email_variables(p_template_body, p_template_subject, p_user_ids)"}` and the `p_`-prefixed POST returns `[]`. Gate: **none**. |
| **13** | WCAG A and AA | **NOT-SWEPT** — `n/a — no rendered markup in this slice` | No `.svelte`, `.html` or component file; the slice renders nothing to a browser. The one text surface reaching a person is the email body assembled in `send-email:154-184`, which is out of WCAG's scope. `assertAxeScan` is **not** cited: citing a gate over a slice with no markup is the laundering D-18 forbids. |
| **14** | Keyboard + screen-reader | **NOT-SWEPT** — `n/a — no rendered markup in this slice` | As item 13. |
| **15** | Developers'/Publishers' Guides | **DEFERRED** — the guides still describe the Strapi backend this slice replaces | `apps/docs/src/routes/(content)/developers-guide/backend/**` documents Strapi authentication, plugins, default data loading and mock data generation — the backend this slice's 118 files exist to replace — and there is no Supabase equivalent page. Fifteen of those files also carry the never-existed `apps/strapi/` link path (F-33). Rationale for deferring: every affected file is under `apps/docs/**`, owned by slice **09**, which D-07 sweeps bottom-up at plan **151-16**; editing them here would put slice 09's content in slice 03's diff. Routed to plan **151-16**. Gate: **none**. |

### Slice 03 — Supabase Backend block (items 17–25, 9 cells)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **17** | New content tables include all common columns | **MET** | All 13 content tables carry `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`, `project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE`, `external_id text`, `created_at`/`updated_at timestamptz NOT NULL DEFAULT now()`, and `published boolean` where voter-facing. `500-external-id.sql` adds the `(project_id, external_id)` uniqueness and the immutability trigger uniformly — 11 `enforce_external_id_immutability` triggers, one per external-id-bearing table. Gate: **none** — **complement: neither `supabase db lint` nor `lint-schema.mjs` inspects column sets, so this cell is entirely agent review.** |
| **18** | RLS enabled + standard five-policy pattern | **MET** | 19 of 20 tables carry `ENABLE ROW LEVEL SECURITY`; the 20th, `private.feedback_rate_limits`, is in an unexposed schema with no grants (rationale above). 13 of 13 content tables carry the standard five; the seven deviations are enumerated above and each is a deliberate, non-content shape. Gate: `lint-schema.mjs` check **0013**, **partial** — **complement: 0013 covers the "RLS enabled" half only and scopes itself to schema `public`, so a table with RLS on and one policy passes, and the `private` schema is invisible to it. And until this plan's F-19 fix the whole script ran against the wrong database, so 0013 had never evaluated this schema at all.** |
| **19** | Scalar-subquery auth calls | **MET** | **56 of 56** occurrences of `auth.uid()` / `auth.jwt()` across `schema/` and `migrations/` appear as `(SELECT auth.…())`; stripping that form from the text leaves **0** bare calls. Gate: **none** — no check reads policy bodies; the count above is the entire evidence. |
| **20** | Explicit `TO` role target | **MET** | **97 of 97** policies name a role: `authenticated` 80, `anon` 15, `supabase_auth_admin` 1 (`auth_admin_read_user_roles`, required by the Custom Access Token Hook), `service_role` 1. Gate: **none**. |
| **21** | `SECURITY DEFINER` pins an empty `search_path` | **MET** | **9 of 9** definer-rights functions carry `SET search_path = ''` in the header: `107-feedback.sql:39`, `301-auth-functions.sql:58,103,144`, `400-storage.sql:49,336,382,454`, `502-email-helpers.sql:22`. (A naive `grep -c 'SECURITY DEFINER'` returns 12 in `schema/`; three of those are comment lines. The count above parses each `CREATE … FUNCTION` header to its `AS $$`.) Schema-qualification follows from the pin rather than being asserted separately: with an empty `search_path` any unqualified object reference is a runtime error, and the 272-assertion pgTAP suite exercises these functions green — a stronger check than a grep. Gate: **none** — **complement: `plpgsql_check` validates PL/pgSQL bodies, never function attributes.** |
| **22** | B-tree indexes on `project_id` and FK columns | **DEFERRED** — 2 of 32 FK columns are unindexed | All **13** `project_id` FK columns are indexed, as are 17 of the remaining 19. The two gaps are the **trailing** columns of the two join tables' composite primary keys: `constituency_group_constituencies.constituency_id` and `election_constituency_groups.constituency_group_id`. A composite PK indexes its leading column only, so the reverse lookup and the `ON DELETE CASCADE` from the referenced side are sequential scans. **F-29.** Rationale for deferring rather than fixing: the fix is a new migration, which PD-02 makes `[BLOCKING]` on `yarn db:lint:sql` exiting 0 — and that gate is red for an unrelated, undecided reason (**F-21**). Landing a migration whose blocking gate cannot be shown green would be worse than recording the gap. Routed to whoever discharges F-21. Gate: `lint-schema.mjs` check **0001** — **and this cell is why it is only now usable: the check was broken twice over (F-19, F-20) and the corrected run reports exactly these two rows, matching an independent static read of `200-indexes.sql` against the declared foreign keys.** |
| **23** | Trigger naming conventions | **DEFERRED** — 22 of 52 triggers use a prefix the checklist does not list | Census: `set_updated_at` ×14, `enforce_external_id_immutability` ×11, `validate_*` ×5 — **30 conforming**. Outside the checklist's `set_updated_at` / `validate_{thing}` / `enforce_{constraint}` set: `cleanup_storage_on_delete` ×10, `cleanup_image_on_update` ×10, `cascade_question_delete_to_answers` ×1, `check_feedback_rate_limit` ×1 — **22**. Rationale for deferring: the 22 are not ad hoc, they are three further conventions applied consistently, and the two candidate remedies are both wrong for an executor to take unilaterally — renaming 22 triggers needs a migration (see F-29's reasoning), and widening the checklist edits `.agents/`, the very artifact this phase's 31-item census is measured against. Recorded for the operator. Gate: **none**. |
| **24** | pgTAP transaction boundary + `create_test_data()` | **FIXED** — commit `3646180a8` | **11 of 11** files open `BEGIN;`, close `ROLLBACK;`, end with `SELECT * FROM finish();` and build fixtures with `create_test_data()`; 10 declare `SELECT plan(n)` and `00-helpers.test.sql` declares `no_plan()`, both valid. The pattern was fully conformant — and was itself the cause of the suite being **red**. Because each file runs in one transaction, `now()` is `transaction_timestamp()` and frozen, so the fixture's `terms_of_use_accepted = now()` failed migration 00002's `ToU < now()` guard: measured, `BEGIN; SELECT now() < now();` → `f`. Two assertions failed deterministically (**F-27**). Fixed in the fixture, no schema change. Gate: `supabase test db` — **complement: execution is not conformance, and the `supabase-tests` CI job is conditional on a `dorny/paths-filter` and will not fire on this sibling-based PR. The evidence here is the locally-run suite against a database reset from migrations: before, `Files=11, Tests=272, Failed 2/272, Result: FAIL`; after, `Files=11, Tests=272, All tests successful, Result: PASS`.** |
| **25** | pgTAP assertion patterns | **MET** | All three required forms are present and used for their correct cases across the 11 files: `ok()` ×62 for positive assertions, `is()` ×70 and `lives_ok()` ×53 for the silent-RLS-denial pattern (a blocked read returns zero rows rather than raising, so it is asserted as `lives_ok` + a zero count, e.g. `03-anon-read.test.sql:85-89`), and `throws_ok()` ×58 where an error is the expected outcome. Plus `has_column()` ×22, `has_table()` ×2, `has_function()` ×2, `col_type_is()` ×2 for the schema-shape assertions in `10-schema-migrations.test.sql`. Gate: **none** — same complement as item 24; the locally-run suite is cited, never the CI job. |

### Slice 03 — Edge Functions block (items 29–31, 3 cells)

Surface: 3 functions, 5 tracked files, 1,097 lines — small enough that every cell below is
a full read rather than a sample.

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **29** | Verify caller is admin via JWT claims before privileged operations | **MET** | **2 of 2** admin-gated functions do, and both do it in the right order — the caller check completes *before* the `service_role` client is constructed, so there is no window in which a privileged client exists for an unverified caller. `invite-candidate:52-95` and `send-email:81-123`: reject a missing `Authorization` header with 401; validate the token server-side with `auth.getUser()` against an **anon**-key client (so an invalid or expired token cannot pass); only then decode that same validated token and test `user_roles` for `super_admin` / `account_admin` / `project_admin`, 403 otherwise. `invite-candidate` additionally scopes `project_admin` to the requested project (`:84-89`). The `service_role` client is created at `invite-candidate:100` and `send-email:128`, after the gate. The third function, `identity-callback`, is **`n/a — public identity callback, not an admin-gated function`**: it is the unauthenticated leg of bank login, and its substitute control is the provider-JWKS signature check at `:69-93` plus the audience and issuer checks — the issuer half of which this plan added (**F-23**). Gate: **none**. |
| **30** | `createClient()` with `service_role` for privileged operations | **MET** | **3 of 3** functions construct exactly one privileged client, each with `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` and each used only for operations that must bypass RLS — `invite-candidate:100` (candidate insert, `auth.admin.inviteUserByEmail`, `user_roles` insert), `send-email:128` (the `resolve_email_variables` RPC, which is `SECURITY DEFINER` over `auth.users`), `identity-callback:236` (`auth.admin.createUser`/`listUsers`, candidate and role insert). The caller-scoped clients in the two admin functions correctly use the **anon** key, so the caller's own token is what `getUser()` validates. No service-role key is logged or returned in any response body. Gate: **none**. |
| **31** | HTTP status codes + descriptive error messages | **MET** | Full census over the three handlers: 405 for a non-POST; 400 for unparseable JSON and for each named missing or malformed field, with the field named in the message; 401 for a missing header, an invalid token, a failed JWE decryption or a failed signature check; 403 for a valid caller lacking the role, with the reason stated; 500 for downstream failures, carrying the upstream `details`; 201 on `invite-candidate` create and 200 elsewhere. Every function ends in a `catch` that narrows `unknown` to a message rather than serialising the raw error. One residual, recorded not fixed: those 500 bodies return the internal `details` string to the caller, which is more than an unauthenticated caller of `identity-callback` needs (OWASP A09). It is deliberate — the messages are how the bank-auth flow is debugged — and is not at the fix bar on its own. Gate: **none**. |

### Findings queued by this sweep

Numbering continues the series; **F-18 was carried in from plan 151-10** and is discharged
here. Six landed as fixes on `feat-gsd-roadmap` before the slice was cut, per D-04.

| ID | Items | Slice | Finding | Disposition |
|---|---|---|---|---|
| **F-18** | 5, 7 | **02** | `packages/app-shared/README.md:25` cited `apps/strapi/`, a path that has never existed at either end (`git ls-tree` → 0 entries at `ac30f132a` and at `HEAD`). Routed here by 151-10 to be fixed **before** PR 3 opens. | **FIXED** — `995696502`; slice 02 re-cut from the fixed tip before its PR was opened |
| **F-19** | 11, 18, 22 | **03** | `scripts/lint-schema.mjs:27` hardcoded the fallback database as port **54332**; `config.toml:29` declares `54322`. A digit transposition, and the gate had therefore **never run against this project's schema**. On the sweeping machine another Supabase instance answered on 54332 and the script silently linted it, reporting 149 warnings about `anonymise_*`, `mcp_oauth_*` and `mission_*` tables that do not exist in this repository. | **FIXED** — `cd96d1ff4` |
| **F-20** | 22 | **03** | Check 0001 compared `pg_constraint.conkey[1:n]` — a **1-based** `smallint[]` — with `pg_index.indkey[1:n]`, an **`int2vector`, which is 0-based**. Proven on the live database: for a single-column index `indkey[1:1]` is `{}` while `conkey[1:1]` is `{2}`, so **every** single-column foreign key was reported unindexed — 51 warnings against the correct database, including `nominations.project_id`, whose index `idx_nominations_project_id` exists. A second defect in the same query: no schema filter, while 0013 scopes itself to `public`, so the report was dominated by Supabase-managed `auth.*` and `storage.*` rows. | **FIXED** — `cd96d1ff4`; the corrected gate reports 0 errors and exactly 2 warnings, matching an independent static read |
| **F-21** | 11 | **03** | **`yarn db:lint:sql` exits non-zero on the branch** — `supabase db lint --fail-on warning` reports 4 `plpgsql_check` findings: `is_localized_string` "never read variable p_key", `_bulk_upsert_record` "unused variable rel_key", and `resolve_email_variables` "unused parameter p_template_body" and "p_template_subject". Neither this gate nor the pgTAP suite appears in `151-BASELINE.md`, so the phase has carried **two unmeasured gates** since 151-03 — and F-27 shows that mattered. | **DEFERRED** — the only change that turns the gate green is dropping two parameters from a granted, type-generated, pgTAP-referenced public RPC. That is a breaking signature change and a product decision about whether per-template variable resolution is still intended, not a cleanup: D-13 excludes code restructuring from the collision surface and Rule 4 reserves it for the operator. Fixing 2 of the 4 would cost a migration and leave the gate red anyway. **Operator decision required.** |
| **F-22** | 1, 10 | **03** | **The `send-email` Edge Function was dead on arrival.** It called `resolve_email_variables` with the argument names `user_ids` / `template_body` / `template_subject`; the function declares `p_user_ids` / `p_template_body` / `p_template_subject` (`502-email-helpers.sql:22-25`, `database.ts:1270-1275`). PostgREST resolves overloads by argument name, so every invocation returned `PGRST202` and the handler converted it to HTTP 500 "Failed to resolve template variables". Verified against the running instance in both directions. | **FIXED** — `fb05eca78` |
| **F-23** | 2 | **03** | `identity-callback`'s `verifyJwt` passed only `audience` to `jose.jwtVerify` and never checked `iss`. `IDENTITY_PROVIDER_ISSUER` is documented in `.env.example:59` and in the deployment guide, and the frontend's equivalent verifier already applies it (`lib/api/utils/auth/getIdTokenClaims.ts:9`, `providers/idura.ts:131`, `providers/signicat.ts:94`) — so the directly-callable Edge Function was the weaker of two paths to the same trust decision. | **FIXED** — `fb05eca78`, applied only when configured so no deployment fails closed on upgrade |
| **F-24** | 2 | **06** (surfaced by 03's sweep) | **The Signicat identity path keys account identity on `birthdate`.** `claimConfig.ts:34-39` sets `identityMatchProp: 'birthdate'`, and `identity-callback` uses that value both to find an existing user (`findUserByIdentityMatch`) and to derive the account's `placeholderEmail`. A birth date is not an identifier: two candidates sharing one resolve to the **same auth user and the same candidate record**. `IDENTITY_PROVIDER_TYPE` **defaults to `'signicat'`** (`index.ts:167`) and `.env.example:38` ships that default. | **DEFERRED — ESCALATED.** Checked before recording, and the check changed the framing: this is **not** local to slice 03. The frontend states the same design independently — `providers/authConfig.ts:18-26` ("Signicat Finnish bank authentication returns `birthdate` as the primary identifier"), `getIdTokenClaims.ts:44`, `dataWriter.type.ts:64`. Changing the Edge Function alone would desynchronise the two halves and make matters worse, and the correct claim is external knowledge — what this tenant's Signicat is configured to return — which the repository does not contain. Routed to plan **151-14**, where the frontend half is swept, so one decision covers both. Idura, the newer provider, correctly uses `sub`. |
| **F-25** | 4 | **03** | Two `deno-lint-ignore no-explicit-any` suppressions with no documented reason (`identity-callback/index.ts:107,133`) — the exact class of F-12, fixed in slice 02. | **FIXED** — `fb05eca78` |
| **F-26** | 2 | **03** | `send-email` set `tls: { rejectUnauthorized: false }` unconditionally, including on the branch that supplies `SMTP_USER`/`SMTP_PASS` — sending SMTP credentials over a channel whose peer certificate is never verified. The surrounding comment (`// Add auth if credentials are provided (production SMTP)`) shows the production path was explicitly contemplated. | **FIXED** — `fb05eca78`; verification is relaxed only on the uncredentialed local path |
| **F-27** | 24 | **03** | **The pgTAP suite was red on the branch**, 2 of 272, both in `03-anon-read.test.sql`, and neither `151-BASELINE.md` nor any CI job on this stack would have shown it. Migration 00002 tightened `anon_select_candidates` to require `terms_of_use_accepted < now()`; `create_test_data()` inserted the two published fixture candidates with `ToU = now()` and its own comment says this was meant to keep the assertions passing. But pgTAP's mandated single-transaction pattern freezes `now()` at `transaction_timestamp()`, so the guard evaluated `now() < now()` = FALSE. Measured: `BEGIN; SELECT now() < now(), now() = now(), clock_timestamp() > now();` → `f, t, t`. | **FIXED** — `3646180a8`, in the fixture only; **no schema change, so `migrations_added` stays 0** |
| **F-28** | 6, 7 | **03** | `apps/supabase/` shipped no README while holding the schema **twice** — 3,409 lines under `schema/`, the same schema again under `migrations/` — with nothing stating which the database reads. | **FIXED** — `6ded54a39` |
| **F-29** | 22 | **03** | Two foreign keys have no covering index: `constituency_group_constituencies.constituency_id` and `election_constituency_groups.constituency_group_id`, the trailing columns of the two join tables' composite primary keys. | **DEFERRED** — the fix is a migration, which PD-02 makes blocking on `db:lint:sql` exiting 0; that gate is red for the undecided F-21. Routed with F-21. |
| **F-30** | 23 | **03** | 22 of 52 triggers use `cleanup_*` / `cascade_*` / `check_*` prefixes, outside the three the checklist names. Consistent, but undocumented as conventions. | **DEFERRED** — both remedies are the operator's: a migration renaming 22 triggers, or widening `.agents/code-review-checklist.md`, which is the artifact this phase's 31-item census is measured against |
| **F-31** | 5 | **03** | `packages/supabase-types/tsconfig.tsbuildinfo` and `supabase/.branches/_current_branch` are tracked build/CLI-state artifacts. | **DEFERRED** — same class as **F-08** (`apps/frontend/tsconfig.tsbuildinfo`); routed to plan **151-16** so the class is decided once. Unlike F-08 these paths *are* claimed by a slice pathspec, so they are **not** F-15-blocked. |
| **F-32** | 2 | **03** | `public.storage_config` stores `service_role_key` as a plaintext `text` column, read by the pg_net storage-cleanup triggers. `seed.sql:20` seeds the published Supabase local-development demo key — not a secret — but `400-storage.sql:529-531` instructs operators to "update the `storage_config` table with actual values" in production, putting a live service-role key in a queryable column. | **DEFERRED** — the remedy is Supabase Vault (`vault.create_secret`), an architectural change (Rule 4). The table is fail-closed today: RLS on, zero policies, `REVOKE ALL … FROM anon, authenticated, public`, `GRANT SELECT … TO service_role` only. |
| **F-33** | 5, 7 | **09** (surfaced by 03's sweep) | **F-18 is a class, not two instances.** `git grep -c 'apps/strapi'` over the shipped tree, excluding `.planning`/`.claude`/`.agents`, returns **16 files / 46 occurrences** — 15 files under `apps/docs/**` linking `blob/main/apps/strapi/…`, all of which 404. 151-10 predicted the class and asked a later plan to grep for it; done. | **RECORDED → plan 151-16**, with F-04 and item 15's deferral. The `packages/app-shared` instance is F-18 and is fixed. |

### Gate verdicts after this plan's fixes — measured, not assumed

All four re-run with **`TURBO_FORCE=1`**, so none is a cache replay:

| Gate | `151-BASELINE.md` | After the six fixes | Verdict |
|---|---|---|---|
| `yarn build` | 14/14 | **14 successful / 14 total** | unchanged |
| `yarn test:unit` | 1522 passed / 149 files | **1522 passed / 149 files** (16 + 21 + 244 + 22 + 446 + 773 across 1 + 3 + 47 + 1 + 43 + 54), 21/21 tasks | unchanged |
| `yarn lint:check` | 0 errors / 20 warnings | **0 errors / 20 warnings** (core 2, dev-seed 15, frontend 1, tests 2), 11/11 tasks | unchanged |
| `yarn format:check` | RED on exactly 2 PD-03-fenced files | **RED on exactly 2** — `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts`, `tests/README.md` | unchanged |

Two gates outside that baseline, both measured here for the first time in this phase:

| Gate | Before this plan | After |
|---|---|---|
| pgTAP, `supabase test db` against a database reset from migrations | `Files=11, Tests=272, Failed 2/272, Result: FAIL` | **`Files=11, Tests=272, All tests successful, Result: PASS`** |
| `yarn db:lint:sql` | exit 1 — and its second half, `lint-schema.mjs`, had never run against this schema at all | exit 1, **unchanged and deliberate**: the 4 `plpgsql_check` warnings are F-21, deferred. `lint-schema.mjs` now runs against the right database and reports `0 error(s), 2 warning(s)` — the F-29 pair |

> **The plan's own `<verify>` blocks cannot pass, and the reason is not this plan's changes.**
> `151-11-PLAN.md` sets Task 1's automated check to `yarn db:lint:sql` and Task 2's to
> `yarn test:unit && yarn lint:check && yarn db:lint:sql`. That gate exited 1 **before this
> plan made any change**, on four `plpgsql_check` warnings the phase had never measured
> because `151-BASELINE.md` records only `build`, `test:unit`, `lint:check` and
> `format:check`. The plan's own Task 2 acceptance criterion is the correct standard and is
> the one applied: `test:unit` and `lint:check` "no worse than the baseline", which they are,
> exactly. This is the **seventh** plan-encoded claim in this phase to be wrong as written,
> and it is the same shape as the other six — the reasoning is sound and the *observable
> signature* is not.

### PD-02 — the migration gate, recorded as a no-op

**`migrations_added: 0`.** None of this plan's six fixes adds or edits a file under
`apps/supabase/supabase/migrations/` (or the `apps/supabase/migrations/` spelling PD-02's
text uses, which matches no tracked file). The two findings whose fix *would* be a
migration — **F-29** (two unindexed join-table FKs) and **F-30** (trigger naming) — are
recorded as deferred precisely so the gate is not half-satisfied: PD-02 requires
`yarn db:lint:sql` green before a migration may be cut, and F-21 leaves it red pending an
operator decision. The gate is therefore an answered question, not an unasked one.

A database reset **was** run regardless, because item 24's evidence had to come from a
database built from migrations rather than an incrementally mutated one: `yarn db:reset`
applied 00001, 00002 and 00003 and seeded `seed.sql` successfully, and the pgTAP result
above is measured against it.

## Slice 04 — `ship/v0.2-akita-04-dev-seed` — cell-by-cell evidence

**Filled by plan 151-12.** The 12 per-slice general items. The two conditional Supabase blocks
and the Adapter block read `n/a — outside block pathspec`: this slice touches neither
`apps/supabase/` nor `apps/frontend/src/lib/api/adapters/supabase/`, so under § "Cell arithmetic"
those pairs are not in the expected set at all and create no cells. The four phase-level items
(1, 11, 12, 16) are **not** re-run here; their evidence is contributed below and their cells stay
`PENDING→18`.

Measured refs for this pass:

| ref | value |
|---|---|
| `BASE` = `origin/main` | `ac30f132a` — **still unmoved**; C-12's re-measurement trigger has not fired at any point in this phase |
| `PARENT` = slice 03 | `11f877913` |
| `TARGET` = `feat-gsd-roadmap` at sweep time | `122e3e0cf` |
| slice-04 file set | `diff --no-renames ship/v0.2-akita-03-supabase..TARGET -- packages/dev-seed apps/frontend/static/images/e2e-test-image-1.jpg` → **162 files, all `A`**, +19,549 / −0 |
| local Supabase | running — the integration test in § item 12 below wrote against it |

### Sweep surface, stated before any verdict (D-20)

| In surface | Count |
|---|---|
| `src/` TypeScript | **72** files — CLI ×6, generators ×14, latent emitter ×11, templates ×33 (2 built-in + 30 perm/registry + helpers), plus `writer.ts`, `supabaseAdminClient.ts`, `pipeline.ts`, `ctx.ts`, `locales.ts`, `types.ts`, template schema ×3 |
| `tests/` TypeScript | **43** files / **446** assertions (`yarn workspace @openvaa/dev-seed test:unit` → `43 passed (43)`, `446 passed (446)`) |
| maintainer script | `scripts/download-portraits.ts` ×1 |
| documentation | `README.md` (303 lines), `src/assets/portraits/LICENSE.md` |
| package config | `package.json`, `tsconfig.json`, `vitest.config.ts` |
| binary assets | **31** `.jpg` — 30 portraits + `apps/frontend/static/images/e2e-test-image-1.jpg` |

**Declared out of surface, with reason (D-20 makes the reason mandatory):** the **31 binary
`.jpg` files** are swept under items 2, 5 and 7 only — provenance, licensing and reference
resolution — and not read as content, because they are images. Their licensing posture is
`src/assets/portraits/LICENSE.md`, which states plainly that the source publishes no explicit
licence, calls the legal posture ambiguous, and scopes the pool to local dev / CI. Every one of
the other 131 files is inside at least one lens below.

### The five enumerable checks — counts, not samples

Each row gives the command whose output produced it. **Two of the five were cross-checked against
an independent source, and one of those cross-checks corrected the first number** — recorded
because that is the discipline this phase keeps failing to apply.

| Check | Command | Checked | Conforming |
|---|---|---:|---:|
| public-API names in `src/index.ts` enumerated by the docblock that calls itself "Public API (stable)" | parse `export {…}` / `export type {…}` bodies for the actual set; parse `` * - `name` `` bullets above `*/` for the documented set | **38 exported names** | **18** before the fix — see **F-34** |
| built-in template registry keys vs the names the README documents | `Object.keys(BUILT_IN_TEMPLATES)` **at runtime under `tsx`** | **30 built-ins** | README named **2**, one of which (`e2e`) does not exist — see **F-35** |
| `any` in type position across the slice | `git grep -n -I -P '(:\s*any\b\|<any>\|\bas any\b\|Array<any>\|any\[\])'` | **13 occurrences**, **0 of them in `src/`** | 9 documented, **4 not** — the F-12 / F-25 class, third occurrence |
| `TODO` / `FIXME` / `HACK` / `XXX` | `git grep -n -I -E '\b(TODO\|FIXME\|HACK\|XXX)\b' -- packages/dev-seed` | 162 files | **0 occurrences** — the only slice so far with none |
| perm-family duplication factored through a helper rather than copied | `git grep -l buildMinimal -- src/templates/e2e/perm \| wc -l` against the file count | **30 perm templates** | **17** compose `buildMinimal`; the other 13 are documented at `templates/index.ts:104-124` as layouts `buildMinimal` cannot express |

> **The registry count is where an internal identity nearly went into a public PR body wrong.**
> A static parse of `BUILT_IN_TEMPLATES`'s object literal returned **31** keys — self-consistent,
> and wrong, because the regex also matched the marker line `BUILT_IN_TEMPLATES:` that opens the
> block. Importing the module under `tsx` and reading `Object.keys` returns **30**. The static
> parse and the runtime read disagreed by exactly the artefact of the measurement. **30 is the
> number**, and it is the runtime one.

### Criterion 3 on the densest reference concentration in the repository — confirmed on real slice content

`151-12-PLAN.md`'s `key_links` records that dev-seed carries **88 of the 183 files** holding the
bare decision-ID form, and asks this sweep to confirm the hygiene passes cleared them. Confirmed,
on the slice's own file set rather than on the gate's aggregate:

| Form | Rule | In slice 04 |
|---|---|---:|
| bare decision ID | `\bD-\d{2}\b(?!-\d{2})` | **0** |
| long decision ID | `\bD-\d{2,3}-\d{2}\b` | **0** |
| any `D-<digit>` at all | `D-[0-9]` | **0** |
| artifact path | `\.planning/` | **0** |
| section anchor | `§` | **0** |
| plan number, gate form | `(?i)\bplans?\s+\d+[-.]\d+` | **0** |
| **bare `phase-ref`** — the operator-approved KEEP row | `(?i)(?<!see\s)\bphases?\s+\d+` | **0** |

**Slice 04 contributes nothing to the `phase-ref` half of the deliberately-red gate.** All 11 of
those occurrences live in three files — `apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh`,
`apps/supabase/supabase/tests/database/00-helpers.test.sql`,
`packages/argument-condensation/src/core/condensation/condenser.ts` — enumerated here rather than
asserted, and none is in this slice.

**It does contribute to the other half, and the number is stated rather than left to inference:
45 of the gate's 84 `task-id` occurrences, across 21 of its 46 files.** They are requirement IDs
used as inline traceability anchors — `GEN-04` ×20, `TMPL-0x` ×16, `GEN-08/09/10` ×6, `CLI-03/04` ×3
— e.g. `README.md:230` *"`externalIdPrefix: string` — teardown filter + row prefix (GEN-04)"*. The
`task-id` row carries a **row-level** operator KEEP verdict, so these are approved as they stand;
the count is recorded so a reader of the red gate can attribute it rather than re-derive it.

**One planning-reference class in this slice is outside criterion 3's rule set entirely, and is
recorded rather than acted on.** The bare `Plan NN` form — `Plan 06`, `Plan 07` — appears **96
times across 39 files** here, of **144 across 67 files** repo-wide: this slice carries **67%** of
it. The gate's `plan-number` rule is `(?i)\bplans?\s+\d+[-.]\d+`, which matches the `Plan 88-02`
spelling D-14 names and **not** the bare one, so the row reads `0` and is green. That is the rule
working as written, not a miss; whether the rule should be widened is gate design, which
`151-DISPOSITION.md` § "FOR PLAN 151-18" already defers to **plan 151-19**. The subset of these
comments that is a genuine defect — the ones describing a development state that no longer exists —
is **F-38** below, and it is a dead-comment finding rather than a hygiene one.

**The `milestone-ver` REPORT-only row has 2 occurrences in this slice, both reviewed and kept:**
`src/generators/AccountsGenerator.ts:26` (*"v2.5 — Supabase Auth owns account creation in production
deployments"*) and `tests/integration/default-template.integration.test.ts:377` (*"v2.6 P64
supabase-adapter reverse-fill"*). Both read as historical context for a design decision, not as
planning references, which is the judgement 151-08's Stage-2 pass was for. The row is never
auto-stripped by design.

### Slice 04 — general items (12 cells)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **2** | OWASP Top 10 | **FIXED** — commit `0691123d8` | Exhaustive over the slice's input-handling paths per D-20, which here means the two CLI entry points, the template loader, the writer and the admin client — every file that takes a value from outside the process. **A03** — `--seed` is validated against `/^-?\d+$/` on the FULL token before `parseInt`, with the reason stated in place (`cli/seed.ts:84-88`: `Number.parseInt('12abc', 10)` returns 12, so a typo'd seed would silently become a different-but-valid dataset); `parseArgs` runs `strict: true, allowPositionals: false` in both CLIs, so an unknown flag is rejected rather than ignored; every template — built-in, `.ts`/`.js` or `.json` — passes `validateTemplate()` before use (`cli/resolve-template.ts:47,89,105`). **A08** — `resolve-template.ts:93` executes developer-authored code via dynamic `import()`. Intentional, documented at `:19-24` and in `README.md` § Security Notes, and the `.json` path parses as pure data and cannot execute. Accepted, not laundered. **A05** — the secret-shaped-literal scan over all 162 files returns **0** credentials; the two `eyJ…`-shaped literals (`src/supabaseAdminClient.ts:42`, `tests/integration/default-template.integration.test.ts:126`) decode to `{"iss":"supabase-demo","role":"service_role"}` — the published Supabase CLI local demo key, the same value `apps/supabase/seed.sql:20` seeds, and not a secret. **A10** — no outbound URL is derived from any input: the only ones are `SUPABASE_URL` (environment) and the one-off maintainer script's fixed `thispersondoesnotexist.com`. **No `writeFile`/`unlink`/`rm` exists anywhere in `src/`**, so a template-supplied string cannot reach the filesystem — the only writer is `scripts/download-portraits.ts`, to a fixed directory. **T-151-12-01 is closed by that measurement.** **T-151-12-02 is closed the other way, and is the finding**: the package has **no locality guard at all**, and the README claimed one it does not have — **F-36**, fixed in the documentation; the guard itself is **DEFERRED to the operator** because adding one changes the behaviour of a destructive command. Gate: **none**. |
| **3** | Code style guide | **MET** | Measured over the 116 TypeScript files: **0** `Foo[]` array-suffix type declarations (the guide requires `Array<Foo>`, `code-style-guide/+page.md:79`) and **0** single-letter type parameters (`:80`) — the two greps' only hits are inside comments naming `Fragment<T>`. Named-parameter discipline is applied and stated as a convention in place (`src/templates/e2e/perm/shared.ts:25-31`: *"every builder that takes more than one parameter where positional order can be confused accepts a single named-options object"*). `yarn format:check` is clean on every file in this slice **except** `src/templates/e2e/perm/perm-bankauth-notloc.ts`, which is one of the two PD-03-fenced files and is fenced out of D-05's fix bar by that decision, not by this cell. Gate: `eslint --flag v10_config_lookup_from_file src/`, **partial** — **complement, and it is large here: the lint script is `src/`-only, so all 43 `tests/` files and `scripts/download-portraits.ts` — 44 of the slice's 116 TypeScript files, 38% — are never linted at all.** That is exactly where the four undocumented `any` suppressions of item 4 live. Within `src/` the gate reports **0 errors and 15 warnings**, which is **15 of the repository's 20** — one deliberate class, recorded as **F-39** and deferred with its reason. |
| **4** | Avoid `any` | **FIXED** — commit `ad52b8baf` | Exhaustive, and the headline is a clean one: **`src/` contains zero `any` in type position.** All 13 occurrences are in `tests/`, in three files, and every one is a mock-shape surface: `tests/writer.test.ts:45,95-107` (9), `tests/supabaseAdminClient.test.ts:56,59` (2), `tests/cli/teardown.test.ts:48` (1), plus the `__getLastInstance` accessor cast at `writer.test.ts:112`. Each carries an `eslint-disable-next-line @typescript-eslint/no-explicit-any`. **Nine carry a documented reason** — `writer.test.ts:89-92`'s docblock states it (*"The cast isolates the only `any`-ish surface in this file (mock internals)"*) and covers the eight-field block beneath it. **Four did not**: `writer.test.ts:44`, `supabaseAdminClient.test.ts:55` and `:58`, `teardown.test.ts:47`. That is **F-41**, and it is the **third** appearance of the same class in this stack — **F-12** in slice 02, **F-25** in slice 03 — fixed the same way, by stating the reason rather than removing the suppression. Gate: `@typescript-eslint/no-explicit-any`, **partial** — **complement: none of these four sites is reachable by the gate at all, because `tests/` is outside the package's `src/`-only lint script. The rule could not have flagged them, and the suppression comments above them are decorative.** |
| **5** | No repeated / dead code | **DEFERRED** — live forward-compatibility scaffolding for a future that has already arrived | The duplication question comes out well and is worth stating first: the perm family's shared shapes are factored into `src/templates/e2e/perm/shared.ts` (12 exported builders) and `src/templates/_helpers/buildMinimal.ts`, which **17 of the 30** built-in templates compose; the 13 that do not are individually justified at `templates/index.ts:104-124` as layouts the helper cannot express. `ALLOWED_TEARDOWN_TABLES` (`cli/teardown.ts:73-85`) and `assertTeardownPrefix` (`:117`) are **exported specifically so `tests/` imports the one implementation instead of keeping a second copy**, and both say so in place. **0** `TODO`/`FIXME`/`HACK`/`XXX` occurrences — the only slice in the stack with none. What is deferred is **F-38**: `cli/seed.ts` still carries the scaffolding it was given to ship *before* the plans it depends on landed, and those plans have landed. `:123-126` casts `writer.write` to `(...args: Array<unknown>) => Promise<unknown>` — **defeating type-checking on a real call** — so the CLI can tolerate a `void` return the writer no longer has; `extractPortraitCount` (`:186-199`) exists to inspect the result shape at runtime; `loadBuiltIns` (`:151-179`) builds its import path in a local variable expressly *"to keep TypeScript from statically resolving it"*. Deleting the scaffolding is **code restructuring, which D-13 excludes from this phase's sweep scope**, and pruning the comments alone would leave the casts unexplained — strictly worse. Recorded with the remedy so a later phase does not re-derive it. Gate: **none**. |
| **6** | Entities documented | **FIXED** — commits `e5f55c111`, `9621f2393` | **The ratio, measured rather than asserted, which is what this cell exists for.** `src/index.ts` opens with a docblock headed *"Public API (stable)"* that enumerates the package's exports one by one. It named **18** of the **38** names the file actually exports — and **0** it does not export, so the inventory was incomplete rather than wrong. The 20 absent names are not marginal: they are the **entire teardown surface** (`runTeardown`, `assertTeardownPrefix`, `ALLOWED_TEARDOWN_TABLES`, `TEARDOWN_USAGE`, `TeardownResult`), the **entire built-in-template surface** (`BUILT_IN_TEMPLATES`, `BUILT_IN_OVERRIDES`, `defaultTemplate`, `defaultOverrides`, `baseTemplate`, `BASE_APP_SETTINGS`), the **locale surface** (`LOCALES`, `LocaleCode`, `fanOutLocales`), and `resolveTemplate`, `formatSummary`, `SEED_CLI_USAGE`, `SummaryInput`, `resolveAppSettingsExternalIds`, `settingsContainsExternalIdRefs`. **F-34**, fixed. Below the barrel, definition-site documentation is strong: of **134** exported entity declarations in `src/`, **65** carry an adjacent doc comment and the great majority of the remainder are the single primary export of a file whose header docblock describes it (every generator class, every perm template). **The CLI surface is fully documented and was checked flag by flag**: `parseArgs` accepts 4 options on `seed` (`--template/-t`, `--seed`, `--external-id-prefix`, `--help/-h`) and 2 on `seed:teardown` (`--prefix`, `--help/-h`); `cli/help.ts` and `cli/teardown-help.ts` document **6 of 6**, with the environment variables and the permissive-prefix contract besides. **The README is where the second defect was** — **F-35**: it documented **2** of the **30** built-in templates and one of the two, `e2e`, has not existed since the name was retired, so `--template e2e` errors. Fixed. Gate: **none**. |
| **7** | Repo documentation updated | **FIXED** — commits `9621f2393`, `0691123d8`, `645bee548` | Three defects, all in prose describing this package, all fixed. **F-35** — the README named the retired `e2e` built-in at three sites (`:45` flag table, `:97` section heading, `:277` a worked troubleshooting message). **The cross-check that settles it: root `CLAUDE.md:308` is *correct*** — it writes `--template e2e/base` and states the retirement explicitly — so the repo-level document was updated when the name changed and the package's own README was not. **F-36** — README § Security Notes asserted *"the writer refuses to run without `SUPABASE_URL` set"* as the package's guard, which is true of `Writer` (`writer.ts:92-105`) and **false of the destructive command**: `seed:teardown` never constructs a `Writer`, it constructs `SupabaseAdminClient` directly (`cli/teardown.ts:216`), whose module-level fallbacks (`supabaseAdminClient.ts:34,40-42`) supply a URL and the demo key with no enforcement — a decision recorded in place at `cli/teardown.ts:24-27`. **F-40** — the Developers' Guide's testing page, three false claims, fixed **in slice 09** and recorded as a cross-slice landing below. Gate: **none**. |
| **8** | Tracking events | **NOT-SWEPT** — `n/a — the item's condition is not met: the slice adds no user-available function` | The slice is a developer CLI and a data generator; nothing in it is reachable by a voter or a candidate. The distinction worth recording is that it **does** touch analytics — `src/templates/e2e/perm/perm-analytics-tracking.ts:185-193` seeds an `app_settings.analytics` object with `trackEvents: true` — but that is seeded **configuration data**, not an event call site: `git grep -iE 'trackEvent\|umami\|gtag\|plausible\|track\('` over the 162 files returns only that template's data literals, its docblock, and `shared.ts:128`'s `analytics: { trackEvents: false }` default. The umami code it seeds is the literal `'e2e-dummy-code'`, stated at `:18-19` to be deliberately not a real key. Event call sites live in the frontend and are dispositioned in slices 06 and 07. |
| **9** | Svelte component guidelines | **NOT-SWEPT** — `n/a — no `.svelte` file in the slice` | Extension census over all 162 files: **127** `.ts`, **31** `.jpg`, **2** `.md`, **2** `.json`. Zero `.svelte`. Gate `svelte-check` **not cited** — nothing is in scope for it. |
| **10** | Errors handled and logged | **FIXED** — commit `3242d9dfd` | Exhaustive over the slice's failure paths. The shape is good and deliberate throughout: `Writer`'s constructor fails loudly on either missing env var with a message naming the variable and the command that supplies it (`writer.ts:92-105`); `resolve-template.ts` wraps both loaders so a JSON parse error, a module load error and a module with no usable export each surface as a named, actionable message (`:83,95,101`); `cli/seed.ts:203-211` and `cli/teardown.ts:228-233` both rephrase `fetch failed`/`ECONNREFUSED`/`ENOTFOUND` into *"Cannot reach Supabase at … Is 'supabase start' running?"*; portrait upload failure is deliberately seed-blocking rather than a warning; `countDeletedRows` (`cli/teardown.ts:160-171`) tolerates a missing or non-numeric `deleted` field instead of producing `NaN`. **One catch discarded its cause, and it was the one that mattered** — **F-37**: `cli/seed.ts:151-179`'s `loadBuiltIns()` caught **every** error from the dynamic import of the built-in-template registry and returned empty maps, so any runtime failure inside `src/templates/index.ts` reached the user as `Unknown template: 'default'. Built-in templates: (none registered yet).` — a message that names the wrong cause and sends the reader to check their spelling. Fixed by reporting the swallowed cause on stderr before falling back; the fallback itself is unchanged. Gate: **none**. |
| **13** | WCAG A and AA | **NOT-SWEPT** — `n/a — no rendered markup in this slice` | Zero `.svelte`, `.html` or route file; the slice renders nothing to a browser. Its only human-facing output is CLI stdout. `assertAxeScan` is **not** cited — citing an a11y gate over a slice with no markup is the laundering D-18 forbids. |
| **14** | Keyboard + screen-reader | **NOT-SWEPT** — `n/a — no rendered markup in this slice` | As item 13. |
| **15** | Developers'/Publishers' Guides | **FIXED** — commit `645bee548`, landing in **slice 09** | **F-40.** `apps/docs/src/routes/(content)/developers-guide/development/testing/+page.md:21` is the Developers' Guide's only mention of this package, and all three of its factual claims were false against the shipped tree. (1) It names the built-in template **`e2e`** — the registry has 30 keys and no `e2e` (runtime-verified), the name is `e2e/base`. (2) It says variant specs compose on the base *"(see `tests/tests/setup/templates/variant-*.ts`)"* — **`git ls-files 'tests/tests/setup/templates'` returns 0 files**, and no `variant-*` path exists anywhere in the tree outside `.planning/`. (3) It says the data is *"seeded into Supabase via the Admin Tools API"* — dev-seed writes through the `bulk_import` RPC with a service-role client (`supabaseAdminClient.ts:202`), and "Admin Tools" was `@openvaa/strapi-admin-tools`, deleted by slice 01b. **Cross-slice landing, recorded rather than silently split:** the file is under `apps/docs/**`, which is **slice 09**'s pathspec, so the fix lands on `feat-gsd-roadmap` and enters slice 09's diff when plan **151-16** cuts it. It is deliberately **not** forced into this slice's pathspec — doing so would break the partition and trip the catch-all. The Publishers' Guide describes no seeding surface, so nothing there is invalidated. **Recorded, not fixed:** `GENERATE_MOCK_DATA_ON_RESTART`, the Strapi-era env var, is referenced by **3** docs pages (`backend/mock-data-generation`, `deployment`, `development/testing`) and by **no code in the repository** — same class as F-04 and F-33, routed to plan **151-16** with them. Gate: **none**. |

### Findings queued by this sweep

Numbering continues the series. Six landed as fixes on `feat-gsd-roadmap` before the slice was cut,
per D-04; one of the six lands in a **different slice** and says so.

| ID | Items | Slice | Finding | Disposition |
|---|---|---|---|---|
| **F-34** | 6 | **04** | `src/index.ts`'s *"Public API (stable)"* docblock enumerated **18 of the 38** names the file exports. The 20 omissions include the whole teardown surface, the whole built-in-template surface and the locale surface. Zero phantom entries — the inventory was incomplete, not wrong. | **FIXED** — `e5f55c111` |
| **F-35** | 6, 7 | **04** | `README.md` named a **retired** built-in template, `e2e`, at three sites (`:45`, `:97`, `:277`). The registry has **30** built-ins and no `e2e` key (verified by `Object.keys` at runtime, after a static parse returned a wrong 31); `--template e2e` errors out. Root `CLAUDE.md:308` has it right and records the retirement, so the package's own README is the stale one. | **FIXED** — `9621f2393` |
| **F-36** | 2, 7 | **04** | `README.md` § Security Notes asserted the package's guard as *"the writer refuses to run without `SUPABASE_URL` set"*. True of `Writer`; **false of `seed:teardown`**, which constructs `SupabaseAdminClient` directly (`cli/teardown.ts:216`) and has **no env enforcement** — module-level fallbacks supply a URL and the published demo key (`supabaseAdminClient.ts:34,40-42`), a decision recorded at `cli/teardown.ts:24-27`. Both CLIs additionally fall back `SUPABASE_URL ??= PUBLIC_SUPABASE_URL` (`cli/seed.ts:56-58`, `cli/teardown.ts:60-62`), and `PUBLIC_SUPABASE_URL` is the *deployed frontend's* variable — so a repo-root `.env` configured for a non-local Supabase silently retargets both commands, including the mass-delete. | **FIXED in the documentation** — `0691123d8`. **The guard itself is DEFERRED — operator decision.** Adding a locality check changes the behaviour of a destructive command and could break any consumer that legitimately points these CLIs at a non-`localhost` test instance (CI does exactly that). D-13 excludes restructuring and Rule 4 reserves behaviour changes for the operator. |
| **F-37** | 10 | **04** | `cli/seed.ts:151-179` `loadBuiltIns()` caught every error from the dynamic import of `src/templates/index.ts` and returned empty maps, discarding the cause — so a runtime failure in the registry reached the user as `Unknown template: 'default'. Built-in templates: (none registered yet).` | **FIXED** — `3242d9dfd`; the cause is now reported on stderr and the fallback is unchanged |
| **F-38** | 3, 5 | **04** | **Live forward-compatibility scaffolding for plans that have already shipped.** `cli/seed.ts:123-126` casts `writer.write` to `(...args: Array<unknown>) => Promise<unknown>`, defeating type-checking on a real call, so the CLI can tolerate a `void` return the writer has not had since portrait upload landed; `extractPortraitCount` (`:186-199`) inspects the result shape at runtime for the same reason; `loadBuiltIns` (`:151-179`) builds its import path in a local variable expressly to stop TypeScript resolving a module that now exists. 96 bare `Plan NN` comments across 39 files narrate this state. | **DEFERRED** — removing the scaffolding is code restructuring, which **D-13 explicitly excludes**, and pruning the comments without the code would leave three casts unexplained. **Remedy, stated so a later phase need not re-derive it:** import `../templates/index.js` statically, type `writer.write`'s return as `{ portraits: number }`, delete `extractPortraitCount`, and drop the narrating comments in the same commit. |
| **F-39** | 3 | **04** | The slice contributes **15 of the repository's 20 `lint:check` warnings**: 14 × `'ctx' is defined but never used` on the uniform `generate(fragment, ctx)` generator signature, plus `FeedbackGenerator.ts:56`'s deliberately discarded `external_id`. All are `warn`-level by project configuration and all are consistent. | **DEFERRED — operator.** The rule's own remedy is the `/^_/` prefix, but applying it would take `lint:check` from the baseline's `0 errors / 20 warnings` to `0 / 5` — **moving a phase-wide number that eight later plans compare "unchanged" against**. Re-baselining a gate mid-stack to make a slice look tidier is worse than recording the gap. |
| **F-40** | 7, 15 | **09** (surfaced by 04's sweep) | The Developers' Guide's testing page makes three claims about this package, and all three are false against the shipped tree: the built-in template is named `e2e` (it is `e2e/base`); variant specs live at `tests/tests/setup/templates/variant-*.ts` (**0 tracked files**, and no `variant-*` path exists outside `.planning/`); the data is seeded *"via the Admin Tools API"* (it is written through the `bulk_import` RPC — "Admin Tools" was the Strapi plugin slice 01b deleted). | **FIXED** — `645bee548`, **landing in slice 09** (`apps/docs/**`), which plan **151-16** cuts. Recorded here so the reviewer of PR 5 knows where the corresponding documentation change went. Sub-finding **recorded, not fixed**: `GENERATE_MOCK_DATA_ON_RESTART` appears in 3 docs pages and no code — routed to **151-16** with F-04 and F-33. |
| **F-41** | 3, 4 | **04** | Four `eslint-disable @typescript-eslint/no-explicit-any` suppressions with **no documented reason** (`tests/writer.test.ts:44`, `tests/supabaseAdminClient.test.ts:55` and `:58`, `tests/cli/teardown.test.ts:47`) — the exact class of **F-12** (slice 02) and **F-25** (slice 03), now with three members and therefore a pattern. Each reason now names *why* the type cannot be written: an unexported deep supabase-js generic, a self-referential thenable assembled by assigning its own methods onto itself, and an array of ad-hoc literals that are not instances of the class they stand in for. | **FIXED** — `ad52b8baf`. Recorded alongside it: **the rule could not have flagged any of the four**, because the package's lint script is `src/`-only and all 43 `tests/` files are unlinted. |

### Evidence contributed to the phase-level cells (which stay `PENDING→18`)

- **Item 11 (troubleshoot failing checks) and item 12 (blast radius).** `main.yaml` at this slice's
  head is blob **`c2fdcedb2`** — byte-identical to `origin/main`'s — and defines exactly three jobs
  (`frontend-and-shared-module-validation`, `backend-validation`, `e2e-tests`), all on
  `Setup Yarn 4.6`. **The `dev-seed-integration` job does not exist at this PR's head at all**: it is
  defined only in the branch-tip `main.yaml` (blob `4dcd9bdde`, `Setup Yarn 4.13`) and arrives with
  slice **10**. **`151-12-PLAN.md` states that the dev-seed integration job "exists in CI but is
  conditional and will not fire on a sibling-based PR". Both halves are wrong**, and the workflow
  says so itself: `main.yaml:130-136` records that there is **deliberately NO `paths-filter`** on
  that job, naming the incident that made it unconditional (*"a conditional guard is how F5 happened
  in the first place"*). The real reason no check fires on PR 5 is the one that applies to PRs 2, 3
  and 4 as well — `main.yaml`'s `pull_request` trigger is `branches: [main]`, and this PR's base is a
  sibling. **This is the eighth plan-encoded claim in this phase to be wrong as written, and again
  the reasoning is sound while the observable signature is not.** The evidence that does exist is the
  local run: `yarn workspace @openvaa/dev-seed test:unit` → **43 files / 446 tests, all passing**,
  including `tests/integration/default-template.integration.test.ts`, which wrote the full `default`
  template against the running local Supabase in 11.8 s and carries the NF-01 operation budget.

### Gate verdicts after this plan's fixes — measured, not assumed

All four re-run with **`TURBO_FORCE=1`**, so none is a cache replay:

| Gate | `151-BASELINE.md` | After the six fixes | Verdict |
|---|---|---|---|
| `yarn build` | 14/14 | **14 successful / 14 total, 0 cached** | unchanged |
| `yarn test:unit` | 1522 passed / 149 files | **1522 passed / 149 files** (16 + 244 + 21 + 22 + 446 + 773 across 1 + 47 + 3 + 1 + 43 + 54), 21/21 tasks, 0 cached | unchanged |
| `yarn lint:check` | 0 errors / 20 warnings | **0 errors / 20 warnings** (core 2, dev-seed 15, frontend 1, tests 2), 11/11 tasks, 0 cached | unchanged |
| `yarn format:check` | RED on exactly 2 PD-03-fenced files | **RED on exactly 2** — `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts`, `tests/README.md` | unchanged |

**`e2e_collisions` stays `0`.** PD-01's trigger is a fix *landed* on the branch taking a gate from
green to red; no landed fix did. Two of the six edits made a file newly `format:check`-dirty and
each was run through `npx prettier --write` **on that single path** before its commit, so the
red set stayed at exactly the two PD-03-fenced files and never gained a third. `yarn format` was
**not** run.

**`migrations_added` stays `0`.** No fix in this plan touches
`apps/supabase/supabase/migrations/` or the `apps/supabase/migrations/` spelling PD-02's text
uses. PD-02 is a recorded no-op for this slice, not an unasked question.

**`yarn db:lint:sql` was deliberately not run as a gate.** It exits 1 on a correct tree pending
**F-21**, which is an open operator decision from plan 151-11, and nothing in this slice touches
SQL. Naming it here would have manufactured a red signal that says nothing about this slice.

### Ordering note — fixes were committed before this record, deliberately

`151-12-PLAN.md` orders the sweep (Task 1) before the fixes (Task 2). The *sweep* ran first, as
written; the *commits* did not, and that was a choice. This record's own rule is that **a cell may
not read `FIXED` before the commit it must cite exists** (§ "Per-slice matrix", the six `P→09`
cells 151-09 held between its two passes). Committing the six fixes first means every `FIXED` cell
above cites a reachable object from the moment it is written, instead of carrying a placeholder
through an intermediate commit and being corrected afterwards — which is the shape that produced
151-11's own deviation 4, five cells citing an amended hash. D-04's actual requirement, that fixes
land on `feat-gsd-roadmap` before the slice is cut, is unaffected and met.

---

## Slice 05 — `ship/v0.2-akita-05-e2e-tests` — cell-by-cell evidence

**Filled by plan 151-13.** The 12 per-slice general items. The two Supabase blocks and the Adapter
block read `n/a — outside block pathspec`: the slice touches neither `apps/supabase/` nor
`apps/frontend/src/lib/api/adapters/supabase/`, so under § "Cell arithmetic" those pairs are not in
the expected set and create no cells. The four phase-level items (1, 11, 12, 16) are **not** re-run
here; evidence is contributed below and their cells stay `PENDING→18`.

**This slice is the phase's own gate.** The cardinal E2E rule makes these 43 specs the signal every
other slice's "it works" claim rests on, so a blind assertion here silently converts every such claim
into an unproven one. That is why the sweep below spends most of its effort on whether the suite
asserts what it says it asserts, and on whether the suite's own self-description is true.

Measured refs for this pass:

| ref | value |
|---|---|
| `BASE` = `origin/main` | `ac30f132a` — **still unmoved**; C-12's re-measurement trigger has not fired at any point in this phase |
| `PARENT` = slice 04 | `7640f7bcb` |
| `TARGET` = `feat-gsd-roadmap` at sweep start | `dd87c1c57` |
| slice-05 file set | `diff --no-renames ship/v0.2-akita-04-dev-seed..TARGET -- tests` → **195 files** (`184 A`, `7 D`, `4 M`), +23,292 / −778 at sweep start |
| local Supabase / dev server | **not running.** No spec was executed. See § "What this sweep did NOT do" below — this is stated, not omitted |

### Sweep surface, stated before any verdict (D-20)

| In surface | Count |
|---|---|
| spec files | **43** added (`.spec.ts`), plus **3** deleted — `candidateApp-advanced`, `candidateApp-basics`, `translations`. Discovery-level confirmation: `npx playwright test --list` → **143 tests in 94 files** |
| TypeScript, all | **171** `.ts` in the diff; **167** tracked `.ts` in `tests/` at `TARGET` |
| Playwright config + runner | `playwright.config.ts` (1,595 lines, 3 config-load guards), `global-setup.ts`, `tests/scripts/{e2e-run,determinism-batch}.sh` |
| fixtures / setup / utils / helpers | `fixtures/` 36 · `setup/` 61 · `utils/` 17 · `helpers/` 6 · `support/` 5 |
| documentation | `tests/README.md` (269 lines), `tests/IDURA-TEST-RUNBOOK.md`, `tests/tests/helpers/README.md` |
| committed key material | `support/mock-oidc-{cert,key}.pem` + the inline JWKs in `utils/testKeys.ts` |
| binary fixtures | 5 `.png` (2 visual baselines + 3 assets), 1 `.jpg`, 1 `.webm`, 1 `.mp4`, 1 `.vtt`, 1 `.csv` |

| Declared out of surface, with reason |
|---|
| **The suite was not executed.** The full-suite run is D-24's job at plan **151-18**, and it needs a dev server on `:5173` plus a seeded local Supabase, neither of which was up. Every verdict below is a *static* verdict — reading source, counting call sites, loading the Playwright config. **No cell below claims a passing run.** |
| **3 files in `tests/` are invisible to this slice's diff** and were therefore swept **from the target tree**, per the manifest's standing instruction on the dropped-finding class: `tests/.gitignore`, `tests/.prettierignore`, `tests/tests/utils/testsDir.ts`. All three are byte-identical at `origin/main` and `HEAD` (blobs `1f83983be`, `df8914f52`, `106d54a85`). Swept, not skipped — verdict under item 2 below. |
| **Visual-regression baseline images** (`specs/visual/__screenshots__/*.png`, 2 files) are declared out of surface for *content* review: they regenerate only inside the pinned Playwright container on `linux/amd64`, so a local read tells a reviewer nothing a diff would not. They are in surface for the *no-local-regeneration* check, which is a negative grep and passes: `git diff --name-only` over this plan's commits matches `-snapshots` **0** times and `__screenshots__` **0** times. |

**The file-count arithmetic closes exactly, in both directions.** `origin/main` carries **14** files
under `tests/`; `14 = 7 D + 4 M + 3 unchanged`. `HEAD` carries **191**; `191 = 184 A + 4 M + 3
unchanged`. No file is unaccounted for at either end.

### The line delta, attributed commit by commit rather than netted

The manifest's dry run predicted **+23,297** for this slice. Measured at the tip immediately before
the hygiene commits it is **exactly 23,297** — the prediction was right, and the number then moved
twice for reasons that are each measurable:

| tip | slice-05 `+lines` | delta | cause |
|---|---:|---:|---|
| `0c538024c~1` (pre-hygiene) | **23,297** | — | the dry run's figure, reproduced |
| `0c538024c` (the codemod) | 23,293 | **−4** | reference deletions collapsing comment lines |
| `5862397ad` (hygiene stage 2) | 23,292 | **−1** | one further residue rewrite |
| `3cad264bd` (this plan) | **23,325** | **+33** | this plan's 25 in-slice fixes, `+98 / −65` |

**The file count never moved from 195, and `−lines` never moved from 778.** Every one of this plan's
25 `tests/` edits touched a file already inside the slice's diff, and its 26th edit is in
`apps/docs/**` — slice **09**. **No file entered or left any partition cell.**

At 23,325 + 778 = **24,103 changed lines** the slice is over GitHub's 20,000-line render cap. That
was known and accepted at partition approval (D-12 class) and is stated in the PR body rather than
fixed by re-partitioning.

### Slice 05 — general items (12 cells)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **2** | OWASP Top 10 | **MET** | Exhaustive over the slice's trust boundaries, which here are: committed key material, the env surface, the one subprocess call, and the TLS posture. **A02 / A05 — the committed key material is the headline, and it is correctly handled.** `support/mock-oidc-cert.pem` is a self-signed cert, `CN=127.0.0.1`, valid 2026-06-17 → 2036-06-14, paired with a committed **2048-bit RSA private key**. Committing a private key is normally a finding; here it is a documented, threat-IDed acceptance: `.gitignore:10-17` carries a `*.pem`-class ignore with an explicit two-line un-ignore and a four-line rationale naming the threat (*"TEST-ONLY … never installed into a trust store, never used by production (threat T-122-09, accepted). Intentionally tracked so the SAME cert is shared across machines/CI"*), and `support/mockOidcIssuer.ts:31-38` repeats it and adds that the issuer **binds `127.0.0.1` only, never a public interface**. `utils/testKeys.ts:1-22` does the same for the inline RSA JWKs under threat **T-122-01**, and states the failure mode outright (*"Reusing these in prod would enable id_token spoofing"*). **A05 — secret-shaped-literal scan over all 195 files returns 0**: `git grep -oE 'eyJ[A-Za-z0-9_-]{10,}' -- tests/` → **0** matches, and a `(password\|secret\|api_key\|service_role)\s*[:=]\s*'…'` scan → **0**. This slice is *cleaner* than slice 04 on that axis, which carries two demo-key literals. The one credential constant, `testCredentials.ts:44` `'Password1!'`, is on the `test.openvaa.local` domain and documents its posture plus the verification grep at `:29-32`. **A02 — the TLS bypass is correctly scoped.** `ignoreHTTPSErrors: true` appears once, on the `bank-auth-journey` project only (`playwright.config.ts:515-519`), behind `PLAYWRIGHT_BANK_AUTH`, with 11 lines stating why the browser context needs it. It is **not** set on `use` at the top level, so no default-suite project has certificate verification disabled. **A03 — the one subprocess call is injection-free by construction**: `preflight.ts:238` uses `execFileSync('lsof', [argv…])` with a 5 s timeout, and `:229-235` states the reason (*"never its shell-interpolating sibling … a shell-free call has no injection surface even if `baseURL` were attacker-influenced"*). **A01 — no session state leaks into git**: `git ls-files tests/` matches `playwright/`, `.auth` and `blob-report` **0** times, and `tests/.gitignore` (one of the three diff-invisible files, swept from the target tree) is what prevents it — `playwright*/` covers both `playwright-results/` and the `playwright/.auth/user.json` `storageState` the visual chain writes. Gate: **none**. |
| **3** | Code style guide | **FIXED** — commits `822108b0f`, `54ec7fed9` | The guide's two mechanically checkable rules are clean over all 171 `.ts` files: **0** `Foo[]` array-suffix type declarations (the guide requires `Array<Foo>`, `code-style-guide/+page.md:79`) and **0** single-letter type parameters (`:80`). What was **not** clean is the comment prose, and it was broken by this phase's own tooling: **F-42**, **38 sites** where the hygiene codemod deleted a reference and left the sentence unrepaired — 12 empty code spans (`` * the bug. Negative control: ` `. ``), 2 corrupted code identifiers (`submitElection()` → `submitElection `, `not.toBeVisible()` → `not.toBeVisible`), and 24 broken sentences (`video→, questionInfo→`, `see phase 130 04 riders`, `is 's "persists across reload"`, `the ONLY available mechanism for.`). Plus **F-43**, 14 comments citing a plan by a bare number that names nothing to a reader. Both fixed. **The method matters and is the reason the count is trustworthy:** the sites were derived by diffing the codemod commit's own old/new line pairs and flagging where a damage signature appears in the new line and not the old — not by grepping the tree for suspicious-looking prose, which returned 672 candidates of which the great majority were legitimate `...` spread syntax and ordinary possessives. Gate: `eslint --flag v10_config_lookup_from_file tests`, **partial** — **complement: the gate lints `tests/` but has `ignores: ['playwright*', 'debug-*', 'e2e-runs']` (`tests/eslint.config.mjs:11`), and no lint rule can see comment prose at all, which is where 100% of this slice's item-3 findings were.** Within its reach it reports **0 errors and 2 warnings** — see item 3's sibling finding **F-49**. |
| **4** | Avoid `any` | **MET** | **The cleanest result of any slice in this stack, and it is a count over the whole set rather than a sample: `any` appears in type position 0 times across all 195 files.** `git grep -nP '\bas\s+any\b\|:\s*any\b\|<any>\|Array<any>\|any\[\]' -- tests/` returns exactly two hits, both the English word *any* inside a comment (`utils/voterIntro.ts:74`, `utils/voterNavigation.ts:149`). There is therefore **no** `eslint-disable @typescript-eslint/no-explicit-any` anywhere in the slice — `git grep -n 'no-explicit-any' -- tests/` returns one line, `tests/eslint.config.mjs:78`, the rule's own configuration. This breaks the F-12 / F-25 / F-41 pattern (undocumented `any` suppressions in slices 02, 03 and 04) rather than continuing it: there is nothing to document because there is nothing suppressed. Gate: `@typescript-eslint/no-explicit-any`, set to **`warn`** for `tests/` at `eslint.config.mjs:78` — **complement: at `warn` it could not have failed a build even had there been violations, so the zero is evidence from the count, not from the gate.** |
| **5** | No repeated / dead code | **MET** | **0** `TODO`/`FIXME`/`HACK`/`XXX` occurrences across all 195 files. *(Correction to the record: slice 04's cell claims it is "the only slice in the stack with none". It is not — this slice also has none, and slice 04's claim was true only of the slices swept before this one.)* The deletion of the 3 superseded specs is complete rather than partial: `git grep` for `candidateApp-basics`, `candidateApp-advanced`, `translations.spec`, `utils/translations`, `candidate-import.csv` and `test_image_black` across `tests/ apps/ packages/ .github/ package.json` returns **0** hits, so no config, workflow or import still names a removed file. Duplication is factored rather than copied: `helpers/{navigation,select,settle,timeouts}.ts` hold the shared walk primitives, and `helpers/navigation.ts:18-23` records *why* the `eperm07-term-trigger` instrument delegates to the shared `settleAfterClientNavigation` instead of keeping a private copy (*"the instrument would otherwise keep its own copy of the defect and stop witnessing this file"*) — the strongest anti-duplication argument in the slice, because a duplicate there would have been a duplicate of a bug. Dead specs are structurally impossible: `playwright.config.ts:35-50` throws at **config load** if any `*.probe.spec.ts` matches no project, with the message *"they match NO Playwright project and run from NO command"*, and `--list` (which skips `globalSetup`) still executes config-load code, so the guard cannot be bypassed by the one invocation shape that skips the preflight. The near-duplicate pair `perm-hide-category-tags.spec.ts` / `perm-hide-election-tags.spec.ts` is deliberate and each states its own positive control in place (`:50` in both). Gate: **none**. |
| **6** | Entities documented | **MET** | Measured, not asserted. **159 of 167** tracked `.ts` files open with a `/**` file-level docblock; the remaining **8** place theirs after the import block, and all 8 were checked individually — `global-setup.ts` (a 23-line docblock), `playwright.config.ts`, `preflight.ts`, `seed-test-data.ts`, `auth.setup.ts`, `buildRoute.ts`, `preflight.test.ts`, `testsDir.ts` — so **0 files carry no file-level documentation**. At declaration level, **87 of 152** exported declarations carry an adjacent doc comment (57%); the 65 that do not are dominated by one shape, the page-object pair `createXxxPage()` plus its `ReturnType` type alias, in files whose header enumerates the surface **method by method** — e.g. `candidateLoginPage.fixture.ts:1-20` lists all six methods with their behaviour, including which assertion is deliberately left at the spec site. That is the same argument slice 04's cell made for its generator classes, and it holds more strongly here because the enumeration is exhaustive rather than a description. `tests/tests/helpers/README.md` exists and is linked from `tests/README.md`. Gate: **none**. |
| **7** | Repo documentation updated | **FIXED** — commits `76b0735a7`, `4e0cf5580` | Four defects, all in prose describing this slice, all found by reading the prose against the tree. **F-45** — `tests/README.md`'s "Project inventory" presents itself as complete and **omits the `_probes` project entirely**, while `package.json:27`'s `test:e2e` appends `--grep-invert @probe`: **5 of the suite's 43 specs — 12% — never ran in what the README called the "full suite"**, and the command that does run them (`test:e2e:probes`, `package.json:28`) was undocumented. **F-46** — the shared-fixture list named **4 of the 10** files in `fixtures/shared/`, with no ellipsis to signal the omission, while the sibling voter list has one; same incomplete-inventory-presented-as-complete class as **F-34**. Both fixed. **F-47** — the Developers' Guide's testing page carried **six** false claims about this slice, each verified false rather than argued: *"Imports the default test dataset via Admin Tools API"* (the seeder writes through `bulk_import` with a service-role client; "Admin Tools" was the Strapi plugin slice 01b deletes); `auth-setup` listed as step 2 of the default chain (it is declared **only** under `PLAYWRIGHT_VISUAL`, `playwright.config.ts:355-360`); *"Test projects — Run with the pre-authenticated browser state"* (the default run is unauthenticated — `voter-journey` starts anonymous, `candidate-journey` starts logged out and registers mid-walk); *"created automatically on Strapi bootstrap (via `ensureDevData`)"* (`git grep ensureDevData` → **0** code hits, 2 docs hits); `DEV_CANDIDATE_EMAIL` / `DEV_CANDIDATE_PASSWORD` (likewise **0** code hits — the real credentials are `testCredentials.ts` literals registered at runtime by `forceRegister`); and `yarn dev:down` (**no such script in `package.json`** — a documented command that cannot be run). The same edit added the two operational facts the page omitted and a reader could not discover: the served-application preflight, and the `@probe` exclusion. **Cross-slice landing, recorded rather than silently split:** the file is under `apps/docs/**`, so the fix lands in slice **09** when plan **151-16** cuts it — the same shape as F-40, and deliberately not forced into this slice's pathspec, which would break the partition. **Recorded, not fixed:** `ensureDevData` and the `DEV_CANDIDATE_*` pair also appear in `developers-guide/backend/mock-data-generation/+page.md:32,37-38`, a Strapi-era page whose fate is a whole-page decision — routed to **151-16** with F-04, F-33 and the `GENERATE_MOCK_DATA_ON_RESTART` class. Gate: **none**. |
| **8** | Tracking events | **NOT-SWEPT** — `n/a — the item's condition is not met: the slice adds no user-available function` | The slice adds test infrastructure; nothing in it is reachable by a voter or a candidate. The distinction worth recording is that this slice is where tracking is **asserted**, which is the item's mirror image rather than the item: `fixtures/shared/trackingIntercept.fixture.ts` intercepts at the umami boundary and `specs/voter/voter-prefs-tracking.spec.ts:151,175,212` asserts suppression without consent, emission (`track` + `startEvent`) with consent, and a preferences round-trip across reload. The event call sites themselves live in the frontend and are dispositioned in slices 06 and 07. |
| **9** | Svelte component guidelines | **NOT-SWEPT** — `n/a — no .svelte file in the slice` | Extension census over all 195 files: **171** `.ts`, **5** `.png`, **4** `.gitkeep`, **3** `.md`, **2** `.sh`, **2** `.pem`, and one each of `.webm`, `.vtt`, `.txt`, `.mp4`, `.mjs`, `.json`, `.jpg`, `.csv`. Zero `.svelte`. Gate `svelte-check` **not cited** — nothing is in scope for it. |
| **10** | Errors handled and logged | **MET** | Exhaustive over the slice's failure paths, and the shape is unusually deliberate. **The preflight's failure output is the best example in the repository of an error message built for a reader**: `preflight.ts` emits `reason` (naming the exact URL probed and the status returned), `expected port`, `expected checkout`, `observed` (status, final URL *after redirects*, `<title>`, and the served module root) and a best-effort `listening process`, then the two remedies verbatim — and `tests/README.md` documents how to read it field by field. Three separate failure modes are distinguished rather than collapsed: a broken preflight (`:348`, the probe file missing from this tree — *"say that, do not blame the server"*), a dead server (`:353-361`), and a foreign server (`:381`, `:387`). The `probe.status !== 200` comparison is **strictly** equal-to-200 with the reason stated in place (*"a not-equal-to-404 comparison would be wrong: a foreign server whose serving root lies elsewhere answers 403, measured"*). Diagnostics that could hang are bounded: `findListeningProcess` carries a 5 s timeout because *"a hung diagnostic must never outlive the failure it decorates"*. The one swallowed catch in the slice is the right one to swallow — `:243`, around `lsof`, whose absence must not mask the real failure — and it says so. On the runner side, `e2e-run.sh` distinguishes exit codes and refuses to produce evidence it cannot stand behind: `:171-178` exits **7** if the preflight's headline literals are no longer present in `preflight.ts` (a guard against the *guard* drifting), `:444-452` fails if any preflight failure line appears, and `:453-457` fails if **no** preflight success line appears — so "the gate never ran" and "the gate passed" cannot produce the same evidence. `determinism-batch.sh:543-548` refuses a green when `flaky != 0`, quoting the project rule as its reason. Gate: **none**. |
| **13** | WCAG A and AA | **MET** — with its complement, which is the whole point of the cell | **This cell is `MET` where slice 04's was `n/a`, and the difference is not an inconsistency: slice 04 contained no a11y gate, and this slice *is* the a11y gate.** What is `MET` is that the gate exists, is on by default, and asserts against the right rule set: `specs/a11y/a11y-smoke.spec.ts:163` sets `WCAG_TAGS = ['wcag2a','wcag2aa','wcag21a','wcag21aa']` — all four tags the item names — and `playwright.config.ts:401-402` declares `a11y-smoke` **default-on**, opt-**out** via `PLAYWRIGHT_NO_A11Y`, so a11y is not something a run has to remember to enable. **Measured reach, re-measured in plan 151-04 and re-confirmed here: 7 route entries → 5 distinct URLs → 14 emitted tests, across 2 themes.** The 7 entries are `home`, `elections-selector`, `constituencies-selector-located`, `questions`, `results`, `voter-detail-drawer`, `results-filter-drawer` (`a11y-smoke.spec.ts:215-330`); entries 5, 6 and 7 are three DOM states of `/results`, which is why 7 entries resolve to **5** URLs and why "7 routes" overstates route coverage by 2 if read literally. The 2 themes are structural rather than a loop variable — three fixture families × light/dark = 6 declaration sites at `:497, :508, :527, :541, :550, :561`, partitioned `raw` 3 / `located` 1 / `answered` 3, giving `(3+1+3) × 2 = 14`. **Named complement — the surfaces this gate does not reach, and it is the larger half: 31 of the 36 `+page.svelte` route surfaces are never scanned.** All **18** candidate-app routes (the whole `(protected)` set, the auth surfaces, the 5 preregistration routes, `help`, `privacy`); all **5** admin routes; **8** voter routes, including `questions/[questionId]` — the per-question surface a voter spends most of the journey on — plus `questions/category/[categoryId]`, `results/…/statistics`, `about`, `info`, `intro`, `nominations`, `privacy`; and the bank-auth / OIDC flows, which no scan entry references. Phase 147 ("Candidate-App Scan Reach") is the scheduled remedy and has **not executed** (`ROADMAP.md:720`, `0/TBD — Not started`; no phase directory exists for 141–150), so this complement is current rather than inherited. Gate: `assertAxeScan`, **partial** — **and the complement above is the measured reason it is only partial. A `MET` on this cell citing "the a11y gate is green" without those 31 routes would be exactly the laundering D-18 forbids.** |
| **14** | Keyboard + screen-reader | **DEFERRED** — the screen-reader half is gated on 5 of 36 route surfaces and the keyboard half is gated **nowhere** | Two layers, and they fail differently. **Screen-reader:** `assertNoRawI18nKeys` (`utils/rawKeyScan.ts:309`) is wired into `assertAxeScan` at `a11y-smoke.spec.ts:471` — **one call site, inside the axe helper**, so by construction it has exactly the axe gate's reach and no more: the identical 7 × 2, the identical 31-route complement, plus the two blind sites already on record (`candidate-journey.spec.ts:921`, `candidateProfilePage.fixture.ts:174`). **Keyboard: there is no gate at all.** axe is a static-DOM auditor; it does not tab through a UI. So the keyboard half of this item is `none` **even on the 5 routes that are scanned** — not partially covered, uncovered. The specs do exercise keyboard input where a control requires it (`voter-journey.fixture.ts:545` drives the number-scale slider with `ArrowRight` rather than `fill()`, because `fill()` bypasses the persist-on-release logic), but that is input mechanics in service of a value assertion, not a tab-order or focus-management assertion. **Why DEFERRED and not FIXED:** building a keyboard-navigation gate is net-new test authorship, which D-13 excludes from this phase's sweep scope, and widening the axe route table is Phase 147's declared scope. **Remedy stated so a later phase need not re-derive it:** the missing gate is a focus-order walk — `page.keyboard.press('Tab')` through each route asserting the visited `:focus` sequence against an expected order and that no interactive element is unreachable — and the natural place for it is beside `assertAxeScan`, whose route table already enumerates the surfaces. Gate: **`none` for the keyboard half, `partial` for the screen-reader half.** |
| **15** | Developers'/Publishers' Guides | **FIXED** — commit `4e0cf5580`, landing in **slice 09** | The Developers' Guide is the only guide that documents this slice, at `developers-guide/development/testing/+page.md`, and its two E2E sections were false in six specific ways — enumerated with their verification under item 7 above rather than repeated here. The Publishers' Guide describes no testing surface, so nothing there is invalidated: `git grep -il 'playwright\|test:e2e' -- 'apps/docs/src/routes/(content)/publishers-guide'` → **0** files. The fix is a cross-slice landing into slice **09**, cut by plan **151-16**. **One thing the page still carries and this cell does not launder:** its top-line note *"Parts of this page reference the legacy Strapi backend which has been replaced by Supabase. Content will be updated in a future release."* That note is now narrower than it was — the E2E half no longer references Strapi — but the unit-test and troubleshooting halves still do, and deciding the fate of the Strapi-era pages wholesale is **151-16**'s call, not this sweep's. Gate: **none**. |

### What this sweep did NOT do — stated, because the alternative is a claim it cannot support

**No spec was executed.** The suite needs a dev server on `:5173` and a seeded local Supabase; neither
was running, and standing them up to run a 10.5-minute suite per fix is exactly the cost D-24 exists
to pay once, at plan **151-18**, against the post-sweep tip. So:

- Every verdict above is **static** — source read, call sites counted, config loaded.
- The strongest *executable* evidence obtained is `npx playwright test --list`, which loads
  `playwright.config.ts` with all three config-load guards active and reports **143 tests in 94
  files**. That is a real check with a real failure mode (a dropped spec, an orphaned probe, a drifted
  soft-assertion budget) and it passed. It is not a pass of the suite.
- **Per `CLAUDE.md`, a "did not run" E2E test counts as a failure, not a pass.** This sweep therefore
  records **43 specs not run**, deferred to 151-18's D-24 run. It does not record them as green.

**No test title was rewritten**, which is plan 151-08's KEEP verdict and an acceptance criterion of
this plan. Confirmed on real slice content: all **34** `task-id`-shaped tokens in `tests/` sit in a
`test.describe(…)` title, a `test(…)` title, a `test.step(…)` title, a positive-control assertion
message, a functional string (`determinism-batch.sh:96`'s `EPERM07_STEP_PREFIX`, which the gate
matches against a Playwright step title) or a runbook heading. **Zero are in comments**, so there was
nothing in this class to fix and nothing to undo.

**No assertion was changed**, so the two-sided negative control this plan's Task 2 requires has **no
subject**. All 25 `tests/` edits are comment-only or documentation-only; `git diff` over this plan's
commits shows no change to any `expect`, `test`, `describe`, `use` or `dependencies` expression. The
requirement is recorded as **not triggered**, not as satisfied — a negative control with nothing to
control for would be theatre.

**Nothing was skipped and no baseline was regenerated.** `git grep -nE '\b(test|it|describe)\.(skip|fixme|only)\b'`
over `tests/` returns **0**, as does a bare `skip(`/`fixme(` scan — the whole 43-spec suite contains
no skip, no `fixme` and no `only`, before or after this plan. `git diff --name-only` over this plan's
commits matches `-snapshots` **0** times and `__screenshots__` **0** times.

### The hygiene gate is byte-identical before and after this plan's 25 edits

Criterion 3's gate is **closed and red on purpose**, and its read rule is that exactly two rows —
`task-id` (84) and `phase-ref` bare (11) — is a PASS. This plan rewrote 52 comments, so the gate was
re-run after every batch and the full row set compared, not just the two named rows:

| row | before | after |
|---|---|---|
| `phase-ref` | 660 occ / 235 files / **bare 11** | 660 / 235 / **11** |
| `spike-ref` | 40 / 30 / bare 0 | 40 / 30 / 0 |
| `decision-id-long` · `decision-id-bare` · `section-anchor` · `planning-path` · `plan-number` | 0 each | 0 each |
| `milestone-ver` (report-only) | 43 / 30 | 43 / 30 |
| `task-id` | 84 / 46 | 84 / 46 |
| union files touched by any row | 270 | 270 |

**Every cell is unchanged.** That was not free, and the way it was nearly lost is worth recording:
an intermediate version of the `eperm07-term-trigger.spec.ts` fix rewrote a line-broken `(Phase / 138
review WR-01)` into the D-14-authorised `see phase 138` form — but across the same line break, so
the continuation line read `* phase 138). The mechanism …`, which the gate's
`(?<!see\s)\bphases?\s+\d+` pattern correctly counts as **bare**. `phase-ref bare` went 11 → 12, the
gate's approved state moved, and the fix was reworked to drop the citation entirely rather than
reflow it. **The authorised collapsed form is only authorised when it survives on one line**, and
that is a real trap for any later plan editing a wrapped comment.

The `occ` column was held too, not just the gated `bare` column: adding a `see phase 138` would have
taken `phase-ref occ` from 660 to 661. An operator approved a report with 660 in it, so 660 is what
this plan returns. Same discipline as **F-39**, applied in the other direction.

### Findings queued by this sweep

Numbering continues the series. Five landed as fixes on `feat-gsd-roadmap` before the slice was cut,
per D-04; one of the five lands in a **different slice** and says so.

| ID | Items | Slice | Finding | Disposition |
|---|---|---|---|---|
| **F-42** | 3 | **05** | **The hygiene codemod broke 38 comments in `tests/` and the Stage-2 pass resolved only 13 of the 43 it created.** Three classes: **12 empty code spans** where a deleted reference sat inside a backtick pair, leaving lines like `` * the bug. Negative control: ` `. `` and `` * lives in ` ` § Adjudication ``; **2 corrupted code identifiers**, because the codemod's empty-enclosure cleanup (`hygiene-codemod.mjs:524`, `s.replace(/[ \t]*\(\s*\)[ \t]*/g, dropEnclosure)`) fires on **any** `()` on a line that carried a reference edit — so `submitElection()` became `submitElection ` and `not.toBeVisible()` became `not.toBeVisible`; and **24 broken sentences** — arrows pointing at nothing (`video→, questionInfo→, popupNotice→, orgMatching→`, which destroyed a four-way probe→perm mapping), orphan numbers (`see phase 130 04 riders`, `Assert the 129 number-scale`), orphan possessives (`is 's "persists across reload"`), prepositions with no object (`the ONLY available mechanism for.`, `trace-confirmed in.`), and doubled periods. **One of the 38 was load-bearing**: `playwright.config.ts:56` is the sentence recording a knowingly-deferred guard-scope decision, and the codemod had rendered it `* Scoped deliberately to a single file: 's scope is …` — the record of a deliberate deferral, made unreadable. | **FIXED** — `822108b0f`. Every rewrite states the fact without reintroducing a reference; the gate's full row set is byte-identical. **The class exists in other slices and is routed, not fixed**: the same detector over `apps/frontend` finds it there (e.g. `dataContext.svelte.ts:24` `` `Updatable.subscribe ` ``, `persistedState.svelte.ts:83` `` `initXxxContext ` ``, `voterContext.svelte.ts:622` `` `getFilterContext ` ``) → plans **151-14** / **151-15**. Reproduce with the old/new pair method, not a tree grep: the tree grep returns 672 candidates, mostly `...` spread syntax and ordinary possessives. |
| **F-43** | 3 | **05** | **14 comments cite a plan by a bare number that resolves to nothing for any reader outside the planning directory** — `122-04`, `122-05`, `119-08` ×2, `129-06`, `120-01`, `120-05`, `128-02`, `122-02` ×2 and `(129)`, in 6 files; plus 2 numbered references split across a line break (`(Phase` / `120-01 …`), which no line-based grep can see. | **FIXED** — `54ec7fed9`. Each rewritten to state the fact without the citation. Gate counts unchanged in both directions. |
| **F-44** | 3 | — (phase-level, gate design) | **`hygiene-grep-report.sh` reports `plan-number occ = 0 OK` over a tree containing 35 plan references in `tests/` alone.** Three blind spots, each a property of the pattern rather than of the tree: (a) its `plan-number` pattern is `/\bplans?\s+\d+[-.]\d+\b/i`, so it requires the literal word *plan* **and** a two-part number — it matches `plan 122-05` and misses both bare `122-05` (12 occurrences, F-43) and `plan 06` (**23** occurrences, mostly in the partially-collapsed form `see phase 136 plan 05`); (b) its `phase-ref` pattern needs the keyword and the digits on the **same line**, so a reference wrapped across a line break is invisible (2 instances found); (c) `\b[A-Z]{3,}-\d{2}\b` misses `EFLOW-10b` and `DEF-135-04` on the trailing-character boundary. **This is the "never trust an internal identity as proof of coverage" class**: the row is self-consistently green and the tree is not clean. It is **not** a red row, so it does not disturb criterion 3's operator-approved state under the read rule — but it means the green rows are weaker evidence than they read as. | **DEFERRED — routed to plan 151-19**, where gate design is the subject. Deliberately **not** patched here: widening a pattern mid-stack would move the operator-approved counts and re-baseline a gate to make a slice look tidier, which is the F-39 failure mode. The 23 `plan NN` occurrences are also left in place — that form at least parses as a reference, and rewriting 23 more comments buys a reader nothing. **Flagged to 151-14 / 151-15 / 151-16:** run the three patterns above over your own slices; the gate will not do it for you. |
| **F-45** | 7 | **05** | **`tests/README.md`'s "Project inventory" omits the `_probes` project, and its "full suite" line omits what the suite excludes.** `package.json:27` appends `--grep-invert @probe` to `test:e2e`, so **5 of the suite's 43 specs never run in it**, and `test:e2e:probes` (`package.json:28`) was undocumented. A reader following the README would believe the probes were covered. | **FIXED** — `76b0735a7`. The inventory now carries a `_probes` row, the exclusion is named on the `test:e2e` line, and the config-load orphan-probe guard is documented as the reason a probe cannot exist while running from nowhere. |
| **F-46** | 6, 7 | **05** | **`tests/README.md` named 4 of the 10 files in `fixtures/shared/`, with no ellipsis** — while the adjacent voter-fixture list carries one, so the omission read as an exhaustive list. Missing: `forensicCapture`, `navMenu`, `popupNotice`, `theme`, `trackingIntercept`, `video`. Same class as **F-34** (dev-seed's *"Public API (stable)"* docblock naming 18 of 38): incomplete rather than wrong, and presented as complete. | **FIXED** — `76b0735a7`, all ten listed. |
| **F-47** | 7, 15 | **09** (surfaced by 05's sweep) | **The Developers' Guide's testing page makes six claims about this slice and all six are false**, each verified rather than argued: the dataset is imported *"via Admin Tools API"* (it is the `bulk_import` RPC with a service-role client; Admin Tools was the Strapi plugin slice 01b deletes); `auth-setup` is step 2 of the default chain (declared **only** under `PLAYWRIGHT_VISUAL`, `playwright.config.ts:355-360`); test projects *"Run with the pre-authenticated browser state"* (the default run is unauthenticated); the test user is *"created automatically on Strapi bootstrap (via `ensureDevData`)"* (**0** code references to `ensureDevData`); credentials come from `DEV_CANDIDATE_EMAIL` / `DEV_CANDIDATE_PASSWORD` (**0** code references; the real ones are `testCredentials.ts` literals via `forceRegister`); and `yarn dev:down` (**no such script**). The page also omitted the preflight and the `@probe` exclusion — the two facts an operator most needs. | **FIXED** — `4e0cf5580`, **landing in slice 09** (`apps/docs/**`), which plan **151-16** cuts. Same cross-slice shape as F-40, recorded here so the reviewer of PR 6 knows where the documentation change went. Sub-finding **recorded, not fixed**: `ensureDevData` and `DEV_CANDIDATE_*` also appear in `backend/mock-data-generation/+page.md:32,37-38` — routed to **151-16** with F-04, F-33 and the `GENERATE_MOCK_DATA_ON_RESTART` class, because that page's fate is a whole-page decision. |
| **F-48** | 1, 3 | **05** | **Three files declare a rigidity contract they violate.** `candidate-journey.spec.ts:47-50` states *"- 0 expect.soft"* and carries **3**; `candidateHomePage.fixture.ts:23` and `candidateProfilePage.fixture.ts:43` state *"NO `expect.soft`"* and carry **4** and **6**. Counted by call site (`grep -cE '(^\|[^a-zA-Z.])expect\.soft\('`), not by trusting the prose: **149 call sites in `tests/` total**, 136 of them in `voter-journey.spec.ts` and **13 in these three files**. This is item 1's real shape in this slice — not a spec asserting less than its title claims, but a file describing its own rigour falsely, in the one slice whose credibility every other slice borrows. | **FIXED** — `3cad264bd`, by making each header **true**: the count, where the calls are, why soft is right there, and that the file sits outside `SOFT_ASSERTION_BUDGETS`. **The guard table was deliberately not widened**, because `playwright.config.ts:56-58` reserves that: *"Scoped deliberately to a single file … The three sibling `Rigidity contract` drift files found alongside it are a recorded follow-up, not a licence to widen this table quietly."* Those three siblings are exactly these three. **The drift was already known** — this finding is that its record had been made unreadable by F-42 and that the false claims themselves were never corrected. |
| **F-49** | 3, 4 | **05** | **`tests/` contributes 2 of the repository's 20 `lint:check` warnings, and one of them is a decorative suppression.** `support/mockOidcIssuerEntry.ts:33` carries an `eslint-disable` for `no-console` that the rule reports **no problems for** — the same family as F-12 / F-25 / F-41 (suppressions with nothing behind them), now with a fourth member. The other is `candidate-bank-auth-journey.spec.ts:223`, `playwright/prefer-to-have-length`. Both are `warn`-level and both are `--fix`-able. | **DEFERRED — F-39's baseline invariant.** Fixing either takes `tests/` from 2 warnings to 1 or 0 and the repository from `0 errors / 20 warnings` to 19 or 18 — **moving the phase-wide number that this plan and every later one compares "unchanged" against**. Recording the gap is better than re-baselining a gate mid-stack to tidy a slice. Remedy, so a later phase need not re-derive it: delete the unused directive at `mockOidcIssuerEntry.ts:33` and convert the length assertion, **in the same commit that re-baselines `151-BASELINE.md`**. |
| **F-50** | 1, 11 | **05** | **CI sets `retries: 3`, which can report a flaky test as green** — `playwright.config.ts:307`, `retries: process.env.CI ? 3 : 0`. `CLAUDE.md`'s cardinal rule forbids retrying-until-green and allows no known-flaky exemption, and three retries is structurally a retry-until-green for anything failing at up to a ~1-in-8 rate. | **DEFERRED — accepted, because the project already built the remedy and it is in this slice.** `determinism-batch.sh` **refuses to start** with `CI` set, for exactly this reason, stated in place at `:46` and `:195-201` (*"With CI present the config buys retries: 3 per test and collapses to a single…"*), and it fails a batch outright when `flaky != 0` (`:543-548`, *"there is no acceptable flaky test in this project"*). Four projects additionally pin `retries: 0` where a retry would mask a state-mutating assertion. So the posture is coherent: CI retries buy tolerance for infrastructure noise, and the determinism gate — not CI — is the flake signal. **Recorded rather than changed** because lowering CI retries is an operator decision about CI cost, and because 151-18's D-24 run is a local, non-CI run at `retries: 0` and is the trusted signal regardless. |

### Evidence contributed to the phase-level cells (which stay `PENDING→18`)

- **Item 1 (do the changes solve the problem).** The suite's coverage claims were sampled against
  `.planning/v2.14-E2E-COVERAGE-PLAN.md` rather than taken from it, and the specs it names do assert
  what it credits them with — checked in four cases spanning its verdict vocabulary:
  `perm-access-disable.spec.ts` covers all three EPERM-11 slices including the previously-missing
  global `underMaintenance` flag (`:59, :81, :101`); `perm-org-matching.spec.ts` asserts the org match
  **score** differs across `none` / `answersOnly` / `impute` and adds an explicit
  `not.toBe(SCORE_ANSWERS_ONLY)` cross-check (`:76, :94, :116-117`), which is the primary assertion
  the coverage plan's operator note demanded rather than the About-page secondary;
  `voter-prefs-tracking.spec.ts` asserts suppression, emission and round-trip (`:151, :175, :212`);
  and `voter-dark-mode.spec.ts` asserts all three claims in its title. **That last one is a recorded
  measurement artefact and the reason this row is a read rather than a grep:** the spec contains
  exactly **one** `expect(` token, which looks like a spec asserting a third of its title — until you
  read it and find all three assertions inside `theme.expectTheme`, a web-first `expect.poll` in
  `theme.fixture.ts`, with the docblock explaining that `expect` is deliberately not imported at the
  spec site. A count-based verdict here would have produced a false finding.
- **Item 11 (troubleshoot failing checks) and item 12 (blast radius).** `main.yaml` at this slice's
  head is blob **`c2fdcedb2`** — byte-identical to `origin/main`'s — and defines exactly three jobs
  (`frontend-and-shared-module-validation`, `backend-validation`, `e2e-tests`), all failing at
  **`Setup Yarn 4.6`**. **The `e2e-tests` job that exists at this head cannot exercise this slice**:
  it fails before Playwright is installed, for the stack-wide `YN0028` lockfile reason. No check fires
  on PR 6 at all, because `main.yaml`'s `pull_request` trigger is `branches: [main]` and this PR's
  base is a sibling. `skill-drift-check`, `supabase-tests` and `dev-seed-integration` **do not exist
  at any published head** — they arrive with slice 10. The evidence that does exist for this slice is
  static plus one config-load check: `npx playwright test --list` → **143 tests in 94 files**, with
  the orphan-probe, soft-assertion-budget and teardown-prefix-uniqueness guards all active.
  `yarn typecheck:tests` (`tsc -p tests/tsconfig.json --noEmit`) is clean. **43 specs did not run**,
  and per `CLAUDE.md` that counts as a failure rather than a pass until D-24 discharges it at 151-18.
- **Item 16 (clean, linear history).** This plan added **6** commits, each one type-conforming
  (`fix` ×1, `docs` ×5) and each scoped to one finding class. No commit touches a file outside
  `tests/` and `apps/docs/`, and no commit is a fix of another commit in this plan.

### Gate verdicts after this plan's fixes — measured, not assumed

Re-run with **`TURBO_FORCE=1`** where turbo mediates, so none is a cache replay:

| Gate | `151-BASELINE.md` | After the six fixes | Verdict |
|---|---|---|---|
| `yarn build` | 14/14 | **14 successful / 14 total** | unchanged |
| `yarn test:unit` | 1522 passed / 149 files | **1522 passed / 149 files** (16 + 244 + 21 + 22 + 446 + 773 across 1 + 47 + 3 + 1 + 43 + 54), 21/21 tasks, 0 cached | unchanged |
| `yarn lint:check` | 0 errors / 20 warnings | **0 errors / 20 warnings** (core 2, dev-seed 15, frontend 1, tests 2), 11/11 tasks, 0 cached | unchanged |
| `yarn format:check` | RED on exactly 2 PD-03-fenced files | **RED on exactly 2** — `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts`, `tests/README.md` | unchanged |
| `yarn typecheck:tests` | not in the baseline | **clean** — recorded here as a new datum, not as a comparison |
| `npx playwright test --list` | not in the baseline | **143 tests in 94 files**, all config-load guards active | recorded as a new datum |
| `hygiene-grep-report.sh --assert-clean` | exit 1 with exactly `task-id` 84 and `phase-ref` bare 11 | **exit 1, same two rows, every column identical** | unchanged |

**`tests/README.md` was edited and stays in the `format:check` red set — it was already in it.** The
red set's *cardinality* is what PD-03 fences, and it is still 2. **`yarn format` was not run**, and
neither PD-03-fenced file was reformatted; running it would have taken the red set to 0 and destroyed
the comparison eight later plans make.

**`e2e_collisions` stays `0`.** PD-01's trigger is a landed fix taking a gate from green to red. No
landed fix did — all 6 commits are comment- or documentation-only.

**`migrations_added` stays `0`.** Nothing in this plan touches SQL. PD-02 is a recorded no-op for this
slice, not an unasked question.

**`yarn db:lint:sql` was deliberately not run.** It exits 1 on a correct tree pending **F-21**, an
open operator decision from plan 151-11, and nothing in this slice touches SQL. Naming it would have
manufactured a red signal that says nothing about this slice.

### Ordering note — fixes were committed before this record, deliberately

`151-13-PLAN.md` orders the sweep (Task 1) before the fixes (Task 2). The *sweep* ran first, as
written; the *commits* did not, for the reason 151-12 recorded: a cell may not read `FIXED` before the
commit it must cite exists. Every `FIXED` cell above cites a reachable object from the moment it was
written. D-04's actual requirement — that fixes land on `feat-gsd-roadmap` before the slice is cut —
is unaffected and met.

---


---

---

*Phase 151 · Plan 06 · scaffold created 2026-08-17 · cells filled by plans 151-09 … 151-18*
