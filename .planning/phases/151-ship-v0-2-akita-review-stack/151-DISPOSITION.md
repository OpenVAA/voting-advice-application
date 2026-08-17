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
cells_filled: 147
cells_pending: 16
blank_cells: 0
db_slice: "03"
adapter_slice: "06"
adapter_block_dispositioned: true  # by 151-14; the block's only appearance in the stack
migrations_added: 0  # PD-02 answered by 151-11: no fix touched a migration
e2e_collisions: 0
dropped_finding_class_files: 841  # re-measured at 151-14 (was 842 at 151-06; the branch moved)
dropped_finding_class_slice_06: 492
dropped_finding_class_slice_07: 0  # the first slice whose diff IS its whole surface, proven two ways
dropped_finding_class_slice_08: 0
invisible_to_review_files: 1202
unclaimed_by_any_pathspec: 120  # re-confirmed at 151-16 by a SECOND, independent method: 5070 tracked, 4950 claimed, 120 unclaimed, enumerated file for file
f_15_operator_gate: accepted-options-1-and-2-at-151-16  # option 3 declined; slices.tsv amended on that decision, not by an agent
comparable_total: 4413  # re-measured at 151-16; every rise attributed by set difference, zero files ever leaving
slices_dispositioned: ["01a", "01b", "02", "03", "04", "05", "06", "07", "08", "09", "10"]
findings_total: 83
status: in-progress
approval: pending
---

# Phase 151 — Checklist Disposition Matrix

**Created:** 2026-08-17
**Phase:** 151 — Ship the v0.2 Akita review stack
**Plan:** 06 (scaffold + phase-level rows). Cells are filled by plans 151-09 … 151-18.
**Status:** 🟡 **IN PROGRESS — approval gate NOT reached.** `cells_filled: 123` of 163, after plans
151-09 (slices **01a**, **01b**, **02**), 151-11 (slice **03**), 151-12 (slice **04**), 151-13
(slice **05**), 151-14 (slice **06**, **plus the Supabase Adapter block**) and 151-15 (slices **07**
and **08**) — all 123 cells terminal, none pending. The gate closes only when
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
| **2** | OWASP Top 10 review | `none` | N/A | MET | MET | FIXED | FIXED | MET | MET | FIXED | MET | FIXED | MET | P→17 |
| **3** | Follows the Code style guide | `partial` | N/A | N/A | FIXED | MET | MET | FIXED | FIXED | FIXED | FIXED | FIXED | MET | P→17 |
| **4** | Avoid `any`; document or `@ts-expect-error` | `partial` | N/A | N/A | FIXED | FIXED | FIXED | MET | FIXED | MET | N/A | MET | MET | P→17 |
| **5** | No repeated code in the PR or elsewhere in the repo | `none` | DEF | FIXED | MET | DEF | DEF | MET | DEF | DEF | DEF | DEF | FIXED | P→17 |
| **6** | New components / functions / entities documented | `none` | N/A | N/A | FIXED | FIXED | FIXED | MET | FIXED | FIXED | FIXED | MET | DEF | P→17 |
| **7** | Repo documentation markdown updated | `none` | DEF | DEF | FIXED | FIXED | FIXED | FIXED | FIXED | FIXED | N/A | FIXED | FIXED | P→17 |
| **8** | Tracking events for new user-facing functions | `none` | N/A | N/A | N/A | N/A | N/A | N/A | MET | MET | N/A | N/A | N/A | P→17 |
| **9** | New Svelte components follow the guidelines | `partial` | N/A | N/A | N/A | N/A | N/A | N/A | FIXED | MET | N/A | N/A | N/A | P→17 |
| **10** | Errors handled and logged | `none` | N/A | N/A | FIXED | FIXED | FIXED | MET | FIXED | FIXED | N/A | MET | MET | P→17 |
| **13** | WCAG A and AA | `partial` | N/A | N/A | N/A | N/A | N/A | MET | MET | FIXED | MET | MET | N/A | P→17 |
| **14** | Keyboard + screen-reader usable | `partial` | N/A | N/A | N/A | N/A | N/A | DEF | DEF | DEF | N/A | DEF | N/A | P→17 |
| **15** | Developers'/Publishers' Guide entries updated | `none` | DEF | DEF | DEF | DEF | FIXED | FIXED | DEF | DEF | DEF | FIXED | FIXED | P→17 |

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
| **26** | Adapter classes use `supabaseAdapterMixin` with `init({ fetch })` | `none` | **MET** | No gate. Exhaustively provable by agent over the **24** files under `apps/frontend/src/lib/api/adapters/supabase/` — but nothing enforces it. |
| **27** | Row mapping via `COLUMN_MAP`/`PROPERTY_MAP` | `none` | **MET** | No gate. Type-checking catches a *wrong* map, not a *missing* one — hand-rolled snake→camel conversion type-checks fine. Same 24-file surface. |
| **28** | `safeGetSession()` (not `getSession()`) for route guards | `none` | **MET** | No gate. **The highest-value greppable item in the block, and nothing enforces it** — `getSession()` is a valid call that compiles. Agent review. |

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
| Per-slice general (12 × 12) | 144 | **132** | 12 | **0** |
| Phase-level (4 × 1) | 4 | 0 | 4 | **0** |
| Supabase Backend (9, slice 03) | 9 | 9 | 0 | **0** |
| Supabase Adapter (3, slice 06) | 3 | **3** | 0 | **0** |
| Edge Functions (3, slice 03) | 3 | 3 | 0 | **0** |
| **Total** | **163** | **147** | **16** | **0** |

**Slice 06** (plan 151-14) — 6 `FIXED` + 3 `MET` + 3 `DEFERRED`, and **0 `NOT-SWEPT`: it is the first
slice in the stack where every one of the 12 general items has a real surface.** It also closes the
**Supabase Adapter block**, 3 `MET`, the block's only appearance in the stack — proven by enumeration
over 24 files with the unsafe-session-accessor-in-a-guard count asserted at **0**. Its three
`DEFERRED` cells are the honest ones: real duplication whose fix D-13 excludes (item 5), a keyboard
gate that does not exist (item 14), and a 117-file docs class that belongs to slice 09 (item 15).

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
| 6 | The **cell census table was one plan stale** — it read `84 / 99` after plans 151-14 and 151-15 had filled 24 further cells, while the frontmatter correctly read `cells_filled: 123`. Two views of the same number disagreeing is the shape of every self-consistent-and-wrong artifact this phase has caught, and here the *table* was the wrong one. | Recomputed at 151-16 from the matrix itself: per-slice general **132 / 144**, total **147 / 163**, pending **16** — the twelve slice-11 cells plus the four phase-level ones. Frontmatter and table now agree. |
| 7 | `151-16-PLAN.md` instructs that `pr-bodies/08.md` note that "a markdown-only pull request fires no workflow at all, because the repository's continuous-integration configuration ignores markdown paths". **Both halves are wrong for these slices.** `pr-bodies/08.md` is the **messages** slice — 329 `.json` files and one `.md`, not markdown-only. Slice 09 is not markdown-only either: 7 of its 39 original files are `.svelte`, `.ts`, `.mjs` and `.json`. And `paths-ignore` is irrelevant to both, because `main.yaml`'s `pull_request` trigger is `branches: [main]` and every stacked PR's base is a sibling. | The bodies state the **measured** reason — sibling base — and do not repeat the paths-filter claim. This is the **thirteenth** plan-encoded claim in this phase to be wrong as written. |
| 8 | The plan's acceptance criterion for the stale-path class asserts over `git grep -l -F 'docs/src/routes'`, which **also matches the correct `apps/docs/src/routes`**. | Superseded by the `-P '(?<!apps/)docs/src/routes'` form. See the correction note under the reconciled list (F-85). |
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


## Slice 06 — `ship/v0.2-akita-06-frontend-lib` — cell-by-cell evidence

**Filled by plan 151-14.** The 12 per-slice general items **plus the three Supabase Adapter items
(26–28), which apply to this slice and to no other in the stack**. A miss here has no second chance,
so all three are proven by enumeration with counts rather than by sample. The Supabase Backend
(17–25) and Edge Functions (29–31) blocks read `n/a — outside block pathspec`: the slice touches
neither `apps/supabase/` nor `apps/supabase/supabase/functions/`. The four phase-level items (1, 11,
12, 16) are **not** re-run here; evidence is contributed below and their cells stay `PENDING→18`.

**This is the largest reviewing surface in the stack and the only one carrying the project's two
undetectable correctness traps.** The Svelte 5 context destructuring rule and the identity-stable
version-bridge carve-out are enforced by no lint rule, no type, and no test; the project has a
documented incident where a violation shipped. Every consumer in the slice was therefore enumerated
mechanically and checked individually, and the enumeration was extended to slice 07 because the same
contexts are consumed there.

Measured refs for this pass:

| ref | value |
|---|---|
| `BASE` = `origin/main` | `ac30f132a` — **still unmoved**; C-12's re-measurement trigger has not fired at any point in this phase |
| `PARENT` = slice 05 | `545cc26c8` |
| `TARGET` = `feat-gsd-roadmap` at sweep start | `0eb55ed7d` |
| slice-06 file set at sweep start | `diff --no-renames ship/v0.2-akita-05-e2e-tests..TARGET -- apps/frontend/src/lib` → **526 files** (`211 A`, `59 D`, `256 M`), +22,659 / −8,315 |
| local Supabase / dev server | **not running.** No spec was executed; every verdict below is static. |

### Sweep surface, stated before any verdict (D-20)

**The diff is not the surface.** 526 files are in slice 06's diff; **492 more files under
`apps/frontend/src/lib` are in the dropped-finding class** — byte-identical across the
`frontend/` → `apps/frontend/` move, so slice 01a renders them as rename lines and no later slice's
diff contains them. Enumerated from the target tree with the manifest's standing command, not from
any diff. Both defects in the *Findings* table below marked `dropped-class` came from that half, and
one of them is a tracked file whose **name** is corrupted — a defect no content grep could ever find.

| In surface | Count |
|---|---|
| files in the slice's diff, at sweep start | **526** (`211 A`, `59 D`, `256 M`) |
| files in the dropped-finding class under the same pathspec | **492** (301 `.ts`, 185 `.json`, 6 `.md`) |
| tracked under `apps/frontend/src/lib` at `TARGET` | **960** — and the two sets partition it: 467 in-diff-and-present + 492 dropped + 1 (`apiRouteAdapter.ts`, moved into the diff by this plan's own fix), asserted by `comm`, with **zero** files in neither set and **zero** in both |
| `.svelte` components | **110** |
| `.ts` | 520 · `.json` (i18n catalogues) 322 · `.md` 8 |
| Supabase adapter files (items 26–28's surface) | **24** under `api/adapters/supabase/` |
| context modules | **107** files under `contexts/` |
| context-consumer destructuring sites enumerated | **60** in this slice, **41** more in slice 07 |

### The three enumerable adapter checks — counts, not samples

Each is `none`-reach: no gate, no type and no test enforces any of them. All three are exhaustive
over the bounded 24-file adapter surface, with the producing command recorded so a reader can re-run
rather than trust.

| # | Item | Checked | Conforming | Command |
|---|---|---:|---:|---|
| **26** | adapter classes use `supabaseAdapterMixin` with the fetch-carrying initialiser | **4** concrete classes | **4** | `git grep -n 'class ' -- apps/frontend/src/lib/api/adapters/supabase` → `SupabaseAdminWriter`, `SupabaseDataProvider`, `SupabaseDataWriter`, `SupabaseFeedbackWriter`, each `extends supabaseAdapterMixin(...)` |
| **27** | row mapping goes through the shared column/property maps | **11** read-mapping sites | **11** | `git grep -n 'toDataObject' --` → 11 non-test call sites, every one routed `toDataObject` → `mapRow` → `COLUMN_MAP`; hand-rolled case conversion (`replace(/_./)`, `camelCase`, `toUpperCase`) scan over the 24 files → **0** |
| **28** | route guards use the safe session accessor | **9** safe call sites | **9** | `git grep -n 'safeGetSession' -- apps/frontend` → 9 guard call sites; `git grep -n 'getSession(' \| grep -v safeGetSession` → **2**, and **0 of them are route guards** — see below |

**Item 28's second count is the one that matters, and it is 0.** The two bare `getSession()`
occurrences are `hooks.server.ts:24`, which is the *implementation* of `safeGetSession` and pairs it
with `supabase.auth.getUser()` on the next line so the session is validated against the auth server
before it is returned; and `supabaseDataWriter.ts:169` in `_getBasicUserData`, which is a data-read
method, not a guard. Its result does reach an authorization decision —
`candidate/(protected)/+layout.server.ts:59` rejects `role !== 'candidate'` — but that route calls
`locals.safeGetSession()` at `:36` and redirects on a missing session **before** the role is read, so
the unvalidated read is downstream of a validated gate rather than in place of one. Recorded in full
rather than reduced to the number, because the number alone would hide the one call site a reader
would want to check.

**Item 26's complement, recorded because the count alone overstates it.** The mixin passes
`config.fetch!` into `createBrowserClient` / `createClient` (`supabaseAdapter.ts:37,43`), a non-null
assertion over `AdapterConfig.fetch`, which is typed `Fetch | undefined`
(`universalAdapter.type.ts:8`). Every one of the 19 production `init(...)` call sites supplies
SvelteKit's load-event `fetch`, so the assertion holds today; nothing enforces that it keeps holding,
and the base class's own `fetch()` throws a clear error while the mixin's silently constructs a
client with `fetch: undefined`.

**Item 27's complement is a real gap, recorded rather than closed.** The map is used in the read
direction only. `mapRowToDb` (the `PROPERTY_MAP` direction) and `mapRows` are exported and
unit-tested and have **zero production call sites repo-wide**. The one write that would want
`mapRowToDb` cannot use it: `COLUMN_MAP` carries `DataObject` content columns only, so the
`admin_jobs` insert at `supabaseDataWriter.ts:407-419` — `job_id`, `job_type`, `end_status`,
`start_time`, `end_time` — would pass those keys through unchanged and fail. That writer spells 12
snake_case keys by hand, correctly. **The item is MET as written** (no hand-rolled *conversion*
exists) **while the shared map is half a contract**, and the next person to assume `mapRowToDb` is
the sanctioned write path will be wrong. Both docblocks now say so (`021d37218`); widening
`COLUMN_MAP` is a change to a package in slice 03, which is cut and published.

### The two context reactivity traps — enumerated consumer by consumer

Named sub-check under items 3 and 12, because these are correctness traps rather than style. Both
were checked by a script over every file in the slice, not by reading a sample.

**Rule 1 — reactive accessors must not be destructured.** A destructure invokes the getter once at
component-init and binds the captured value, so later reads of the local are reads of a static
binding and propagate no invalidation.

| Surface | Destructuring sites | Destructuring a reactive accessor |
|---|---:|---:|
| slice 06 (`src/lib`) | **60** | **0** |
| slice 07 (`src/routes`), checked because it consumes the same contexts | **41** | **1** |
| two-step form (`const ctx = getX(); const { … } = ctx;`), both slices | — | **1** (the same site) |

**Rule 2 — the identity-stable carve-out.** `dataRoot`'s only reactive signal is the private
`#version` `$state` counter read inside its accessor
(`contexts/data/dataContext.svelte.ts:81-88`: `get() { void self.#version; return dataRoot; }`). The
object reference never changes, so an intermediate `$derived` alias recomputes and yields the same
reference, and referential equality skips downstream notification. **The dependency is taken only
where `ctx.dataRoot` is read**, which is why the read must happen inside the consuming tracking
scope. Confirmed from the source above, not assumed from the rule.

| Surface | `dataRoot` consumers | Bound to an intermediate alias |
|---|---:|---:|
| slice 06 | 5 component/context read paths | **0** |
| slice 07 | 3 | **2** |

**Slice 06 is clean on both rules, and it is clean deliberately rather than accidentally.** Every
one of its five `dataRoot` consumers reads through the accessor inside the tracking scope and says
so in a comment: `EntityInfo.svelte:47` + `:67` (`{#if ctx.dataRoot.elections.length > 1}`),
`QuestionHeading.svelte:50` + `:57`, `EntityCard.svelte:134` (`dataRoot: ctx.dataRoot`, inside a
`$derived.by`), `nominationAndQuestionState.svelte.ts:25,40` (a **thunk** — `dataRoot: () => DataRoot`
called inside `$derived.by`, which defers the read into the consumer's scope), and the contexts
themselves via the private `get #dataRoot()` re-read
(`voterContext.svelte.ts:163-164`, `candidateContext.svelte.ts:108-109`), consumed inside `$derived`
at `voterContext.svelte.ts:211,214` and `candidateContext.svelte.ts:137,139`.

**The three violations are all in slice 07, are recorded as F-61 and F-63 below, and are NOT fixed
here** — see the findings table for why.

### Slice 06 — general items (12 cells)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **2** | OWASP Top 10 | **MET** | Exhaustive over the slice's four trust boundaries. **A03 (injection/XSS) — `{@html}` appears 19 times and ALL 19 are `{@html sanitizeHtml(…)}`**; `sanitizeHtml` is `DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })` with an empty-input guard (`utils/sanitize.ts:8-11`). Counted both sides: `git grep -o '{@html'` → 19, `git grep -o '{@html sanitizeHtml('` → 19, difference **0**. `eval(` / `new Function(` → **0**. One `innerHTML` write, `Icon.svelte:47`, assigned from `import(\`./svg/${folder}/${filename}.ts\`)` — Vite resolves that template into a build-time glob over the local `svg/` tree, so the value is a repo-committed SVG string and the path cannot escape the directory. **A02/A05 — secret-shaped-literal scan over all 526 files returns 0**: `git grep -oE 'eyJ[A-Za-z0-9_-]{10,}'` → **0** (cleaner than slice 04, which carries two demo-key literals), and a `(password\|secret\|api_key\|service_role\|token)\s*[:=]\s*'…'` scan → **0**. **A01 (broken access control) — the session surface is item 28's, and its unsafe-accessor-in-a-guard count is 0.** Client-side persistence is confined to `contexts/utils/persistedState.svelte.ts`, whose handles are versioned and expirable; the values stored are preferences, a session id, preregistration selections and unsaved answer drafts — no credential. |
| **3** | Follows the Code style guide | **FIXED** | Five comments the hygiene codemod left broken, found with the **old/new diff-pair method** over `0c538024c` and `5862397ad` rather than a tree grep (the 151-13 lesson): `EntityCard.svelte:106` (`see phase 62 see phase 88`, two citations collapsed adjacently), `EntityListWithControls.type.ts:13` (a dangling preposition — "the canonical shape for the results-page integration in."), `voterContext.svelte.ts:311` (`see phase 62 scope tuple becomes implied`, connective eaten), `token-endpoint.test.ts:300` (`see phase 140's remit is …`, the possessive class), `viewTransition.ts:11` (`(decision 99-2)`, a bare identifier naming nothing and invisible to the gate). Commit **`77ab326f9`**. **Named sub-check: the two context reactivity rules — 60 consumers enumerated in this slice, 0 violations**; see the section above. Hygiene gate byte-identical before and after: `phase-ref` 660 occ / 235 files / **bare 11**, `spike-ref` 40/30/0, `task-id` 84/46, `milestone-ver` 43/30. **F-44's three blind-spot patterns run over this slice's 526 files return 0, 0 and 0** — the gate would not have found them, and here there was nothing to find. |
| **4** | Avoid `any`; document or `@ts-expect-error` | **FIXED** | Exhaustive: `git grep -nw 'any'` over the slice, every hit read. **6 occurrences in type position, in 4 files.** Three were already documented with a `// reason:` block — `popupComponent.type.ts:33` (`Component<any>`, Svelte 5 `Component<T>` invariance), `utils/components.ts:38` (`Record<string, any>`, `HTMLAttributes` has no index signature), `route/buildRoute.ts:89` (`as any` ×2, `resolveRoute`'s literal-route-id contract). Three were not: the TypeScript mixin `Constructor` rest parameter at `supabaseAdapter.ts:10` and `apiRouteAdapter.ts:13,39`. Fixed in **`021d37218`**. **Complement, and it is the point of the cell:** those three do not trip `lint:check` because `@typescript-eslint/no-explicit-any` is configured `'error'` with **`ignoreRestArgs: true`** (`packages/shared-config/eslint.config.mjs:98-102`) — they are exempted by configuration, not judged conforming, and the comments now say so. `@ts-expect-error` in the slice: **1**, at `i18n/tests/translations.test.ts:225`, with a 4-line note explaining what would make it "unused". `@ts-ignore`: **0**. |
| **5** | No repeated code in the PR or elsewhere in the repo | **DEFERRED** | A real duplication, recorded because the fix is excluded rather than because it is small. `EntityListControls.svelte:98-112` and `EntityListWithControls.svelte:144-161` carry the same three handlers — `openFilters`, `reset*Filters` (including the identical `startEvent('filters_reset')` guard) and `trackActiveFilters` (identical five-line `.filter(active).map(name).join(',')` chain) — differing only in the filter-group variable name and in return-type annotations, followed by near-identical control markup. The extraction target already exists (`EntityListWithControls.helpers.ts`), which is what makes it duplication rather than coincidence. **Not fixed: extracting a shared handler is code restructuring, which D-13 excludes explicitly, and it is behaviour-adjacent in the filter path with no E2E gate available to this plan (D-24's run is at 151-18).** Remedy recorded so a later phase need not re-derive it. Separately **FIXED** in this class: `mapRowToDb` and `mapRows`, exported and tested with zero production call sites, now document that fact and its precondition (`021d37218`). |
| **6** | New components / functions / entities documented | **FIXED** | Four `@component` docblocks documented a usage that cannot compile — `bind:selected={$selectedConstituencies}`, `bind:selected={$selectedElectionIds}`, `answer={$voterAnswers[question.id]}` ×2, `selectedId={$voterAnswers[question.id]}` ×2 — the `$store` auto-subscription syntax for a `svelte/store` seam this milestone deleted and the frontend's own eslint config now makes an **error** (`no-restricted-imports`, `src/**/*.{ts,svelte}`; real `svelte/store` imports under `src/lib`: **0**). `QuestionChoices`'s example was wrong a second, independent way: `selectedId` is typed `Id \| null` (`QuestionChoices.type.ts:39`) and the example passed an `Answer`. All four rewritten against their real call sites; `SingleGroupConstituencySelector` was already correct and is the in-slice control. Commit **`e32b4031f`**. |
| **7** | Repo documentation markdown updated | **FIXED** | Every "or locally" link in the frontend's READMEs pointed at `/docs/src/routes/developers-guide/…`, wrong twice: `docs/` became `apps/docs/` in slice 01a, and the route carries a `(content)` group segment the links omit. **8 sites fixed, each target asserted to exist on disk** — 6 under `src/lib`, 2 under `src/routes` (slice 07, uncut). Commit **`a75b87e4c`**, which also renames the corrupted `README.md 21-40-30-014.md` (F-56). **A ninth site, `packages/app-shared/src/settings`, is NOT fixed and is deferred: slice 02 is cut, pushed and open as PR #865, so correcting it would require force-pushing a PR under review.** First time in this phase that D-07's lag has been paid rather than collected on. |
| **8** | Tracking events for new user-facing functions | **MET** | Enumerated: **13** `startEvent(` call sites in the slice, and every event name is a member of the `TrackingEventName` union (`contexts/app/tracking/trackingEvent.type.ts:14-43`) — `answer`, `answer_delete`, `answer_resetAll`, `dataConsent_granted`, `entityCard_expandSubcards`, `entityDetails_changeTab`, `feedback_error`, `feedback_sent`, `filters_active`, `filters_reset`, `survey_opened`. **The gate is `yarn build`**: the union makes a typo'd event name a type error, so a mis-named event cannot ship. **Complement: the union is one-directional.** It cannot detect an event that is *declared* and never fired, so a dead event name is invisible; and nothing requires a NEW user-facing function to add an event, which is the half of the item a gate cannot express. |
| **9** | New Svelte components follow the guidelines | **FIXED** | Same four docblocks as item 6, judged against the Svelte-component sections of the code style guide: the "Usage" block is part of the documented component contract, and four of them documented an API the runtime no longer has. Structural conformance checked separately and clean: **0** `svelte/store` imports (the eslint ban is an `error` across `src/**`), the two `_guards/eslint-store-guard.test.ts` matches are the guard's own fixture asserting the rule fires. Commit **`e32b4031f`**. |
| **10** | Errors handled and logged | **FIXED** | The slice's two long-running admin job features drive a `PipelineController` whose `info`/`warning`/`error` write into the job store so an admin sees them (`jobs/pipelineController.ts:382-410`); 22 call sites use it and **5 did not**. `condenseArguments.ts:107-108` shipped `console.error({ election })` and `console.error(dataRoot.candidateNominations.map(…))` — an entire `Election` object and every candidate-nomination id, at **ERROR** level, unguarded, on every run of a job an admin triggers from the UI. Neither is an error and neither reaches the admin. Deleted; the three `console.info('[condense] …' / '[question-info] …')` progress dumps kept but moved onto `controller.info`. The project's DEV-only `logDebugError` (`utils/logger.ts:8-12`) was bypassed by all five. Commit **`873e1a7f8`**; `console.*` under `server/admin` is now **0**. |
| **13** | WCAG A and AA | **MET** | Reviewed exhaustively over the slice's own suppressions, which is where an a11y regression hides in a component library: **26 `svelte-ignore` directives, of which 9 suppress an `a11y_*` rule.** 8 carried a rationale (`Input.svelte:383-388` covers its four `a11y_label_has_associated_control` sites by explaining the `aria-labelledby` association; `MultipleTextInput.svelte:142-143` the same; `QuestionChoices.svelte:373-376`, `Select.svelte:316-321`, `NavItem.svelte:59-63`). One did not — `Button.svelte:181` — and now does (**`021d37218`**): `<svelte:element>` resolves `this` at runtime so the compiler cannot see that the tag is interactive. Positive markers across the slice: 113 `aria-*` attributes, 34 `role=`, 12 `tabindex`. **Complement, measured and large: the axe gate cannot see most of this slice.** `assertAxeScan` reaches **5 distinct URLs × 2 themes** (`151-MEASUREMENTS.md` § 1.1; 31 of the 36 `+page.svelte` route surfaces are never scanned), and it reaches components only *transitively* through what those 5 URLs render — so of the slice's **110** components, any not mounted on `/`, `/elections`, `/constituencies`, `/questions` or `/results` is **not swept by that gate at all**, including every candidate-app and admin-app component in `candidate/components/` and `admin/components/`. |
| **14** | Keyboard + screen-reader usable | **DEFERRED** | Inherits 151-13's verdict on the gate that lives in slice 05, re-stated against this slice's surface. The raw-key scan has exactly the axe gate's reach — one call site, inside `assertAxeScan` — so the screen-reader half is unswept on every component not rendered by those 5 URLs. **The keyboard half has no gate anywhere: axe is a static-DOM auditor and does not tab through the UI**, so it is uncovered on the 5 scanned URLs as much as on the rest. This slice contains the interactive primitives that make the item real — `Select.svelte` (`aria-activedescendant`, `onkeydown` focus-index navigation), `QuestionChoices.svelte` (radio-group focus-out handling), `Tabs.svelte`, `Expander.svelte`, `Modal` — every one hand-rolled, and none exercised by a keyboard test. **DEFERRED rather than MET because authoring that gate is net-new test authorship, which D-13 excludes**, and widening the axe route table is Phase 147's declared scope, which has not executed. |
| **15** | Developers'/Publishers' Guide entries updated | **DEFERRED** | The guide pages that document this slice — `developers-guide/frontend/{contexts,components,data-api,routing,styling}` — were **not** updated for it, and the defect is a whole-tree class rather than a page: **272 `blob/main/frontend/…` permalinks across 117 files under `apps/docs/`** point at a path the layout slice removed, and `frontend/contexts/+page.md:3` still describes the contexts as "shared stores" and locates them at `$lib/api/contexts` (they are `$lib/contexts`). Many of the 117 are auto-generated component pages, so the fix is a generator change plus a prose pass, not a text edit. **The whole class is `apps/docs/**` = slice 09, cut by 151-16**; recorded here as **F-64** and routed there, exactly as 151-13 routed `mock-data-generation` as a whole-page decision. Fixing 117 files inside another uncut slice from this plan would put a change of that size outside the disposition that reviews it. |

### Slice 06 — Supabase Adapter block (items 26–28, 3 cells)

The block's only appearance in the stack. Every verdict is backed by a count in the table above.

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **26** | Adapter classes use `supabaseAdapterMixin` with `init({ fetch })` | **MET** | 4 of 4 concrete classes, enumerated: `supabaseAdminWriter.ts:17`, `supabaseDataProvider.ts:42`, `supabaseDataWriter.ts:31`, `supabaseFeedbackWriter.ts:13`. The mixin's `init` (`supabaseAdapter.ts:26-49`) calls `super.init(config)` — which is `UniversalAdapter.init({ fetch })` (`universalAdapter.ts:22-25`) — and then threads `config.fetch` into `global.fetch` on both the browser (`createBrowserClient`, so the client shares the session cookies `hooks.server.ts` sets) and server (`createClient`) branches, plus a `serverClient` short-circuit for the two call sites that pass the request-scoped client. **Complement: `config.fetch!` is a non-null assertion over a `Fetch \| undefined` field; all 19 production `init` call sites supply SvelteKit's load `fetch`, and nothing enforces that they keep doing so.** |
| **27** | Row mapping via `COLUMN_MAP`/`PROPERTY_MAP` | **MET** | Read direction exhaustive: 11 of 11 mapping sites go through `toDataObject` (`utils/toDataObject.ts:36` → `mapRow` → `COLUMN_MAP`, `utils/mapRow.ts:12`); hand-rolled case-conversion scan over all 24 adapter files → **0**. **Complement, recorded rather than closed: the write direction has no production consumer.** `mapRowToDb`/`PROPERTY_MAP` has 0 call sites repo-wide, and the write that would use it cannot — `COLUMN_MAP` lacks the `admin_jobs` operational columns, so `supabaseDataWriter.ts:407-419` spells them out correctly by hand. Both docblocks now state this and the precondition for future use (`021d37218`). Widening the map is a slice-03 package change and slice 03 is published. |
| **28** | `safeGetSession()` (not `getSession()`) for route guards | **MET** | **Safe-accessor call sites: 9. Unsafe-accessor call sites in a route guard: 0.** The 9: `admin/+layout.server.ts:8`, `admin/login/+page.server.ts:32`, `admin/(protected)/argument-condensation/+page.server.ts:26`, `admin/(protected)/question-info/+page.server.ts:61`, `candidate/+layout.server.ts:10`, `candidate/login/+page.server.ts:30`, `candidate/(protected)/+layout.server.ts:36`, and `hooks.server.ts:70` (the `candidateAuthHandle` redirect gate), against its declaration at `app.d.ts:13`. The 2 bare `getSession()`: `hooks.server.ts:24`, which **is** `safeGetSession`'s implementation and validates via `supabase.auth.getUser()` at `:29`; and `supabaseDataWriter.ts:169` in `_getBasicUserData`, a data-read method. The latter's `role` does reach an authorization decision at `candidate/(protected)/+layout.server.ts:59`, but that route runs `safeGetSession` at `:36` and redirects first, so the unvalidated read sits behind a validated gate rather than replacing one. **This is the highest-value greppable item in the block and nothing enforces it** — `getSession()` compiles. |

### Findings queued by this sweep

| ID | Verdict | Item(s) | Finding | Landing |
|---|---|---|---|---|
| **F-51** | FIXED `e32b4031f` | 6, 9 | Four `@component` usage examples document the deleted `svelte/store` `$name` API; one also passes the wrong type. | slice 06 |
| **F-52** | FIXED `77ab326f9` | 3 | Five hygiene-codemod comment defects (double citation, dangling preposition, eaten connective, surviving possessive, bare `decision 99-2`). | slice 06 |
| **F-53** | FIXED `873e1a7f8` | 10 | Five `console.*` statements bypass the job controller in the two admin features; two are leftover debug at ERROR level. | slice 06 |
| **F-54** | FIXED `021d37218` | 4 | Three `Array<any>` mixin rest parameters undocumented; exempted by `ignoreRestArgs`, not conforming. | slice 06 |
| **F-55** | FIXED `021d37218` | 13 | `Button.svelte:181` suppresses an a11y rule with no rationale; the other 8 a11y suppressions carry one. | slice 06 |
| **F-56** | FIXED `a75b87e4c` | 5, 7 | `README.md 21-40-30-014.md` — a tracked file whose NAME is editor debris. **dropped-class**; no content grep could find it. | slice 06 |
| **F-57** | FIXED `a75b87e4c` | 7 | Eight "or locally" README links point at the pre-move `docs/` path and omit the `(content)` route group. 6 in slice 06 (4 **dropped-class**), 2 in slice 07. | slices 06, 07 |
| **F-58** | FIXED `021d37218` (documented) | 5, 27 | `mapRowToDb`/`mapRows` exported, tested, zero production call sites; the write path that would want them cannot use them. | slice 06 |
| **F-59** | FIXED `c98ec04d2` | 3 | `apps/frontend/eslint.config.mjs:77-84` — three broken sentences of the same codemod class, in the block explaining why a lint ban is duplicated verbatim. | **slice 10** (uncut) |
| **F-60** | DEFERRED | 5 | `EntityListControls` / `EntityListWithControls` duplicate three filter handlers and their markup. Fix is extraction = code restructuring, excluded by D-13, behaviour-adjacent with no E2E gate available. | 151-18 / later phase |
| **F-61** | **DEFERRED → 151-15** | 3, 12 | `results/[[electionTab]]/+layout.svelte:73-77` **destructures `appSettings` and `dataRoot`** and its comment at `:69-72` asserts the destructure is correct — "Stable stores/functions/objects (appSettings, dataRoot, …) remain destructured". That was true before the v2.13 handle flatten and is false now. `appSettings` is value-replacing, so the destructured local goes stale on navigation; `dataRoot` is identity-stable, so the destructure takes the `#version` dependency once at init and `{#if dataRoot.elections.length > 1}` at `:349` never re-evaluates when data arrives — the cold-entry staleness class. **A file in slice 07, which 151-15 sweeps and cuts.** Not fixed here for the reason this plan states itself: a reactivity fix changes when a component updates, must name a covering test, and the test that would catch it is an E2E spec this plan cannot run. |
| **F-62** | **DEFERRED → 151-15** | 3 | Two `const dataRoot = $derived(ctx.dataRoot)` intermediate aliases — `(voters)/(located)/+layout.svelte:38`, `candidate/(protected)/preview/+page.svelte:32`. The forbidden shape **without** the failure mode: both use the alias only to *write* (`dataRoot.update(...)`, `provideEntityData`), deliberately outside a tracking scope (`+layout.svelte:84` says so). Recorded with that analysis so 151-15 does not "fix" a non-bug or dismiss F-61 by association. | slice 07 |
| **F-63** | DEFERRED | 7 | `packages/app-shared/src/settings` carries the same dead `docs/` link as F-57. **Slice 02 is cut, pushed and open as PR #865**; fixing it means force-pushing a PR under review. | 151-18 / post-merge |
| **F-64** | **DEFERRED → 151-16** | 15 | 272 `blob/main/frontend/…` permalinks across 117 `apps/docs/` files point at the pre-move path, plus store-era prose on the contexts page. A generator change plus a prose pass, not a text edit. | slice 09 |
| **F-65** | DEFERRED | 27 | `COLUMN_MAP` (slice 03, published) is documented "only includes columns where the names differ" but carries the identity entry `published: 'published'`, and two keys — `organization_id` and `organization_id_nom` — map to the same property. Neither is a live defect; both are noted because the map is the adapter block's shared contract. | 151-18 |

### F-24 — the Signicat birthdate identity key, resolved as routed

**151-11 routed this here so one decision would cover both halves. The decision is: record and escalate,
not fix.**

The frontend half is exactly where 151-11 said it was, and it states the design in its own words:
`api/utils/auth/providers/authConfig.ts:18-26` — *"Signicat Finnish bank authentication returns
`birthdate` as the primary identifier"* — with `getIdTokenClaims.ts:44` and
`api/base/dataWriter.type.ts:64` carrying it through. The Edge Function half sets
`identityMatchProp: 'birthdate'` and uses that value both to find an existing auth user and to derive
the account's placeholder email, so **two candidates who share a birth date resolve to the same auth
user and the same candidate record**, and `IDENTITY_PROVIDER_TYPE` defaults to `signicat`.

**Three reasons this is not an agent's fix to make, stated so the escalation is not mistaken for a
deferral of convenience:**

1. **It is a design, not a slip.** Both halves state it independently and consistently. Changing one
   desynchronises them; changing both is a change to how accounts are identified.
2. **The decisive fact is external knowledge the repository does not contain** — whether Signicat's
   Finnish bank-authentication response can be relied on to carry a stable subject identifier for
   this deployment, and what the operator's contract with the IdP actually provides. No amount of
   reading this codebase settles it. The newer provider, Idura, correctly uses `sub`
   (`providers/idura.ts`), which is evidence about the intended direction and not about what Signicat
   returns.
3. **The fix is a behaviour change to shipped authentication code** well beyond D-05's bar, and the
   E2E suite that covers the bank-auth journey is not runnable by this plan.

**Routed to the operator at 151-18**, with F-21, F-29, F-30 and F-36's locality half. The question to
put is narrow: *is `birthdate` still the intended identity key for the Signicat path, or is that path
now legacy behind Idura?* If it is legacy, the remedy is a deprecation, not a schema change.

### Evidence contributed to the phase-level cells (which stay `PENDING→18`)

- **Item 12 (shared-dependency blast radius).** This slice is the frontend's dependency hub: 96 files
  consume a context and 101 destructuring sites exist across slices 06 and 07 combined. `yarn build`
  (14/14) and `yarn test:unit` (1,522 / 149 files) both cover it, and the frontend workspace alone
  contributes **773 tests across 54 files**. **Complement: neither exercises the SSR/adapter
  boundary end to end** — the adapter's `init({ fetch })` contract, which item 26 is about, is
  exercised only by unit tests with mocked clients; the real cross-request behaviour is E2E's.
- **Item 11 (failing checks).** Nothing new. No CI job fires on a sibling-based PR, and the workflow
  at every published head does not contain a job that would exercise this slice.
- **Item 16 (history).** Six commits, all conventional, all scoped `(151-14)`.

### Gate verdicts after this plan's fixes — measured, not assumed

| Gate | `151-BASELINE.md` | Measured after | Verdict |
|---|---|---|---|
| `yarn build` (`TURBO_FORCE=1`) | 14/14 | **14/14** | unchanged |
| `yarn test:unit` (`TURBO_FORCE=1`) | 1522 tests / 149 files | **1522 / 149** | unchanged |
| `yarn lint:check` (`TURBO_FORCE=1`) | 0 errors / 20 warnings | **0 / 20** (core 2, dev-seed 15, frontend 1, tests 2) | unchanged |
| `yarn format:check` | RED on exactly 2 PD-03-fenced files | **RED on exactly 2** (`perm-bankauth-notloc.ts`, `tests/README.md`) | unchanged |
| `hygiene-grep-report.sh --assert-clean` | exit 1; `task-id` 84, `phase-ref` bare 11 | **exit 1, every column identical** | unchanged |

**`yarn format` was NOT run.** Two edited files were reformatted individually with
`npx prettier --write` on those paths only, because the replacement `controller.info(...)` calls
exceeded the line width and would otherwise have grown `format:check`'s red set from 2 to 4 — the
*cardinality* of that set is what PD-03 fences. Every other edited file was `prettier --check`ed file
by file and was already clean. **F-39 was honoured: the lint warning count was not reduced.**

**`yarn db:lint:sql` was deliberately not run** — it exits 1 on a correct tree pending F-21, and
nothing in this slice touches SQL. **The E2E suite was not run**; per `CLAUDE.md` this record
therefore claims a statically swept slice, not a green one. D-24's run at 151-18 is where that is paid.

### The file-count delta, attributed by set difference

The slice moved **526 → 533 files**, and all seven are named. Established with `comm` over the two
`diff --name-only --no-renames` sets, **not** by subtraction — and the first attempt got it wrong in a
way worth recording: `awk '{print $2}'` over `--name-status` output **truncates a path containing a
space**, so the corrupted README's old path silently vanished from the delta and the arithmetic read
+6 against a measured +7. The count was right; the attribution was one short. Re-run on
`--name-only`, both close.

| File | Why it entered | Left the set |
|---|---|---|
| `api/adapters/apiRoute/apiRouteAdapter.ts` | was byte-identical across the move (dropped class); F-54's `// reason:` blocks put it in the diff | — |
| `candidate/components/README.md` | dropped class; F-57 | — |
| `components/README.md` | dropped class; F-57 | — |
| `contexts/README.md` | dropped class; F-57 | — |
| `dynamic-components/README.md` | dropped class; F-57 | — |
| `server/api/README.md` | F-56's rename, new path (`A`) | — |
| `server/api/README.md 21-40-30-014.md` | F-56's rename, old path (`D`) | — |

**Zero files left the set.** This is the dropped-finding class working as the manifest intended: six
files that no reviewer would have seen are now in a reviewer's diff, and they are there because they
were defective.

### Ordering note — fixes were committed before this record, deliberately

As in 151-12 and 151-13: the sweep ran first, the commits did not, because a cell may not read
`FIXED` before the commit it cites exists. D-04's actual requirement — fixes on `feat-gsd-roadmap`
before the slice is cut — is met.

---

## Slice 07 — `ship/v0.2-akita-07-frontend-routes` — cell-by-cell evidence

**Filled by plan 151-15.** The 12 per-slice general items. All three conditional blocks read
`n/a — outside block pathspec`: the slice touches neither `apps/supabase/`, nor
`apps/supabase/supabase/functions/`, nor `apps/frontend/src/lib/api/adapters/supabase/`. The four
phase-level items (1, 11, 12, 16) are **not** re-run here; evidence is contributed below and their
cells stay `PENDING→18`.

**This slice is the request path.** Every route, the server hooks that wrap them, the 17 API endpoints
they call, and the app shell that frames them. `hooks.server.ts` is here rather than in the config
slice by a deliberate partition correction at 151-04, precisely so it would be reviewed as an
authorization surface; that framing is honoured below — items 2 and 10 are swept across guards, load
functions and endpoints rather than treated as styling surface.

Measured refs for this pass:

| ref | value |
|---|---|
| `BASE` = `origin/main` | `ac30f132a` — **still unmoved**; C-12's re-measurement trigger has not fired at any point in this phase |
| `PARENT` = slice 06 | `8c613634b` |
| `TARGET` = `feat-gsd-roadmap` at sweep start | `e2ed9d997` |
| slice-07 file set at sweep start | `diff --no-renames ship/v0.2-akita-06-frontend-lib..TARGET -- <slice-07 pathspec>` → **213 files** (`108 A`, `99 D`, `6 M`), +10,291 / −8,268 |
| local Supabase / dev server | **not running.** No spec was executed; every verdict below is static. |

### Sweep surface, stated before any verdict (D-20)

**For the first time in this stack, the diff IS the whole surface — and that is a measured claim, not
a convenience.** Every other slice carries a dropped-finding class: files byte-identical across the
layout move, which slice 01a renders as rename lines and no later slice's diff contains, reviewed by
nobody if review is organised by slice diff. Under this slice's paths there is **no such class**,
established two independent ways:

| Method | Result |
|---|---|
| set difference: files tracked at `HEAD` under the pathspec, minus files present in the diff (`A` ∪ `M`) | **114 − 114 = 0** |
| blob comparison: for each tracked file, `HEAD:<path>` vs `origin/main:frontend/<path>` | **0 identical across the move** |

The two methods answer the question from opposite directions and agree. So the 213-file diff (109 A
after this plan's fix, 99 D, 6 M) covers all 114 files that exist under these paths plus the 99
predecessors they replace. **Nothing here is invisible to a reviewer.**

Route inventory, since the accessibility items turn on it: **36 `+page.svelte`**, 17
`+layout.svelte`, 17 `+server.ts`, 8 `+layout.ts`, 5 `+page.ts`, 4 `+page.server.ts`, 4
`+layout.server.ts`, 1 `+error.svelte`, 6 shell components, 6 `params/`, 7 `src/` shell files, 2
READMEs, and this plan's `loginRedirectTarget.ts`.

### Items 13 and 14 — the accessibility scan's reach, its complement, and the complement swept

**This is the cell D-20 exists for, so it is reported as three numbers and then a named list.**

| | Count |
|---|---:|
| page routes changed in this slice | **36** |
| of those, covered by `assertAxeScan` | **5** |
| of those, **NOT** covered | **31** |

The five covered, with the URL each actually reaches (`151-MEASUREMENTS.md` § 1.1: seven scan entries
resolve to five distinct URLs, because three are DOM states of `/results`):

| Route file | URL |
|---|---|
| `(voters)/+page.svelte` | `/` |
| `(voters)/elections/+page.svelte` | `/elections` |
| `(voters)/constituencies/+page.svelte` | `/constituencies` |
| `(voters)/(located)/questions/+page.svelte` | `/questions` |
| `(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte` | `/results` |

**The 31 uncovered, named path by path, each with a manual verdict.** No cell here reads
not-applicable: every one was swept by hand for the classes the scan would have applied, and the
per-class totals over the whole set are given after the list so the verdicts are checkable rather
than assertable.

| # | Route (under `apps/frontend/src/routes/`) | Manual verdict |
|---|---|---|
| 1 | `(voters)/(located)/questions/[questionId]/+page.svelte` | **MET** — a deliberately empty leaf (1 template line); rendering is owned by `questions/+layout.svelte`. No markup to assess. |
| 2 | `(voters)/(located)/questions/category/[categoryId]/+page.svelte` | **MET** — renders through `MainContent`; 0 hits on all nine classes below. |
| 3 | `(voters)/(located)/results/[[electionTab]]/statistics/+page.svelte` | **FIXED** — the one defect in the set: `<h1>` → `<h4>`, a two-level skip at two sites. Now `<h2 class="text-base">`. Commit **`f7076dbfe`**. |
| 4 | `(voters)/about/+page.svelte` | **MET** — `MainContent`, own `<h1>` + `<h2>` in order; sanitised `{@html}`. |
| 5 | `(voters)/info/+page.svelte` | **MET** — `MainContent`, `<h2>` under it; 0 hits. |
| 6 | `(voters)/intro/+page.svelte` | **MET** — `MainContent`; 0 hits. |
| 7 | `(voters)/nominations/+page.svelte` | **MET** — `MainContent`, `<h3>` under a `<h2>`-bearing layout; 0 hits. |
| 8 | `(voters)/privacy/+page.svelte` | **MET** — `MainContent`, `<h1>`+`<h2>`; sanitised `{@html}`. |
| 9 | `admin/(protected)/+page.svelte` | **MET** — `MainContent`; 0 hits. |
| 10 | `admin/(protected)/argument-condensation/+page.svelte` | **MET** — 4 form controls, **4 labelled** (`for`/`id` pairs); 0 hits. |
| 11 | `admin/(protected)/jobs/+page.svelte` | **MET** — `MainContent`, `<h2>`; 0 hits. |
| 12 | `admin/(protected)/question-info/+page.svelte` | **MET** — the largest form in the slice: 13 raw controls of which 4 are `type="hidden"`; **all 9 visible ones labelled**, by `for`/`id` (`electionId`, the two radio ids, `sectionTopics`, `customInstructions`, `questionContext`) or by a wrapping `<label>` (the checkbox rows). 0 hits. |
| 13 | `admin/login/+page.svelte` | **MET** — `<h1>`+`<h2>`, labelled form; its one `svelte-ignore` is `state_referenced_locally`, a reactivity warning, not an a11y suppression. |
| 14 | `candidate/(protected)/+page.svelte` | **MET** — `MainContent`; 0 hits. |
| 15 | `candidate/(protected)/preview/+page.svelte` | **MET** — 16 template lines, `MainContent`; 0 hits. |
| 16 | `candidate/(protected)/profile/+page.svelte` | **MET** — 193 template lines, `MainContent`, `<h2>`; 0 hits. Its a11y-relevant markup is a wrapped image `Input`, whose rationale comment survives at `:282`. |
| 17 | `candidate/(protected)/questions/+page.svelte` | **MET** — `MainContent`, `<h3>` under the layout's `<h2>`; 0 hits. |
| 18 | `candidate/(protected)/questions/[questionId]/+page.svelte` | **MET** — the slice's only `tabindex`, and it is `{-1}` paired with `data-focus-on-nav`: a programmatic focus target, the correct use. 0 hits. |
| 19 | `candidate/(protected)/settings/+page.svelte` | **MET** — `MainContent`, `<h2>`, 1 labelled control; 0 hits. |
| 20 | `candidate/forgot-password/+page.svelte` | **MET** — `<h1>`, 1 control, `aria-*` present; 0 hits. |
| 21 | `candidate/help/+page.svelte` | **MET** — `MainContent`; 0 hits. |
| 22 | `candidate/login/+page.svelte` | **MET** — `<h1>`, labelled form, hidden `redirectTo` field (no label required, and now validated server-side — see item 2). |
| 23 | `candidate/password-reset/+page.svelte` | **MET** — `<h1>`; 0 hits. |
| 24 | `candidate/preregister/(authenticated)/constituencies/+page.svelte` | **MET** — `MainContent`; 0 hits. |
| 25 | `candidate/preregister/(authenticated)/elections/+page.svelte` | **MET** — `MainContent`; 0 hits. |
| 26 | `candidate/preregister/(authenticated)/email/+page.svelte` | **MET** — 2 controls, 2 `aria-*`; 0 hits. |
| 27 | `candidate/preregister/+page.svelte` | **MET** — `MainContent`, sanitised `{@html}`, 2 `role=`; 0 hits. |
| 28 | `candidate/preregister/status/+page.svelte` | **MET** — `MainContent`, sanitised `{@html}`; 0 hits. |
| 29 | `candidate/privacy/+page.svelte` | **MET** — `MainContent`; its `{@html}` content's `<h3>`s sit under `TermsOfUse.svelte:36`'s `<h2>`, checked rather than assumed (see slice 08 item 13). |
| 30 | `candidate/register/+page.svelte` | **MET** — `<h3>`, 1 control, `aria-*`; its `svelte-ignore` is `state_referenced_locally`, not a11y. |
| 31 | `candidate/register/password/+page.svelte` | **MET** — `<h1>`; 0 hits. |

**The nine classes applied to all 31, with totals — this is what makes the 30 `MET` verdicts
checkable:**

| Class the axe scan would have caught | Occurrences across the 31 |
|---|---:|
| non-semantic element carrying a click/key handler | **0** |
| positive `tabindex` | **0** |
| `<img>` without `alt` | **0** (there is no `<img>` in the route layer at all) |
| `autofocus` | **0** |
| `aria-hidden` on a focusable element | **0** |
| anchor with no discernible text | **0** |
| `title` as an element's only accessible name | **0** |
| inline `display:none` on a focusable element | **0** |
| **heading-level skip** | **2 — found and FIXED** |

**Structural reason the 30 come out clean, stated because it is also the caveat: 30 of the 31 render
through `MainContent` or `SingleCardContent`**, the shell components in this same slice, which supply
the `<h1 tabindex="-1">` and the `[data-focus-on-nav]` focus target (`MainContent.svelte:94`). The
31st is the empty leaf. So the route-level a11y surface is thin *by construction*, and the shell is
where it actually lives — which is in this slice and was swept directly: `Layout.svelte:66-68` (skip
link, with the only `a11y_positive_tabindex` suppression in the slice and a rationale on it),
`Layout.svelte:87` (`<main>` landmark), `Header.svelte:88-90`
(`aria-expanded`/`aria-controls`/`aria-label` on the menu button), `+layout.svelte:237-239`
(always-present `aria-live="polite"` route announcer, deliberately outside the error/loading/
maintenance branches) and `+layout.svelte:175-185` (`afterNavigate` focus reset with
`preventScroll: true`).

**Item 13 = FIXED** on that evidence. **Item 14 = DEFERRED**, and the reason is a gate that does not
exist rather than a defect that was found: **keyboard navigation has no automated gate anywhere in
this project.** axe is a static-DOM auditor and does not tab through the UI, so the keyboard half is
uncovered on the 5 scanned URLs exactly as much as on the other 31, and the raw-i18n-key scan has
identically the axe reach because its only call site is inside `assertAxeScan`. One keyboard path was
traced by hand and is correct — the drawer opens focusing `#drawerCloseButton` (`Layout.svelte:50`)
and closes returning focus to the opener (`:61`), and the `<div onclick>` overlay at `:108` is
`aria-hidden="true"` and duplicates that keyboard-reachable control rather than replacing it — but one
path read carefully is not a gate. **Authoring one is net-new test authorship, which D-13 excludes**,
and widening the axe route table is Phase 147's declared scope, which has not executed
(`151-MEASUREMENTS.md` § 1.2).

### Slice 07 — general items (12 cells)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **2** | OWASP Top 10 | **FIXED** | Swept across the route layer as an authorization surface, per the 151-04 partition correction. **A01 — unvalidated redirect, FIXED.** `candidate/login/+page.server.ts:19` and `admin/login/+page.server.ts:21` read a `redirectTo` form field — sourced from `?redirectTo=` via `page.url.searchParams` at `candidate/login/+page.svelte:58` / `admin/login/+page.svelte:49` and posted back in a hidden input — and interpolated it into `redirect(303, \`/${locals.currentLocale}/${redirectTo}\`)`. **What made it safe was incidental**: the leading `/{locale}/` stops the value from ever starting the string, so it cannot form `//host` or `scheme:`, and `currentLocale` cannot be empty (paraglide's `['url','cookie','baseLocale']` strategy terminates in `baseLocale`). It did not stop steering a just-authenticated user to an arbitrary in-origin path. Decisive: **the voter half of this same slice validates its analogous `?next=` twice** (`(located)/+layout.ts:34`, `constituencies/+page.svelte:130`) with a defence-in-depth comment, and **the app has exactly one producer of `?redirectTo=`** (`hooks.server.ts:76`, candidate `(protected)` bounces only — nothing produces one for admin at all). Fixed in **`271f3f8e4`** via `routes/loginRedirectTarget.ts`, fail-safe (a rejected value takes the existing no-`redirectTo` branch). **A01 — access control, MET by enumeration:** all **6** `api/admin/jobs/**` endpoints open with `(await getUserData({ fetch }))?.role !== 'admin'` → 403 before any work; **9** server guards use `locals.safeGetSession()` and **0** use the raw accessor; `hooks.server.ts:74-77` gates `(protected)` route ids. **A03 — `{@html}` 20 occurrences, 20 wrapped in `sanitizeHtml`, difference 0**; `eval(` / `new Function(` / `innerHTML` = **0/0/0**. **A02/A05 — secret-shaped literals over 214 files = 0.** **Complement:** `hooks.server.ts:24`'s `getSession()` is `safeGetSession`'s own implementation and validates via `getUser()` at `:29`; and the JWT payload decode duplicated at both login actions (`JSON.parse(atob(token.split('.')[1]))`) has no `try`/`catch` — reachable only if a validated Supabase session carries a malformed token, so recorded rather than fixed. |
| **3** | Follows the Code style guide | **FIXED** | **28 comments the hygiene codemod left broken, repaired in `d0c63af0d`.** Found with the old/new diff-pair method over `0c538024c`, `5862397ad` and `54ec7fed9` restricted to this pathspec — **57 files, ~250 comment lines rewritten by the codemod** — not by grepping for damage signatures, which under-report because the damage shape depends on the original wording. Nine were the same fragment (`(see spike 024). see phase 117.` — a dangling `+`, then a lowercase clause with no verb); three had lost the subject a preposition governed (`per (see phase 61).`, `per CONTEXT.`, `per -01 small-fix constraint (CONTEXT).`); one had had the call parens stripped off `popupStore()` one clause before the words "returns an object literal", plus a trailing space inside a quoted rule name; three were in one docblock (`renamed to see phase 88 4-segment shape`, a heading opening in lower case, a dangling `After the **parent`); five were parentheticals naming nothing; four were `(see phase 78 Plan 02):` citations standing where the subject used to be. **`params/etPl.ts:3` had been broken by the stage-2 repair pass itself** while its untouched `etSg.ts` sibling still parsed — recorded because a repair pass introducing a defect is the failure mode this phase keeps finding. **Named sub-check: the two context reactivity rules** — 84 destructure sites enumerated, 2 violations, both fixed; see the next section. Hygiene gate **byte-identical** before and after all commits: `phase-ref` 660 occ / 235 files / **bare 11**, `spike-ref` 40/30/0, `task-id` 84/46, `milestone-ver` 43/30. |
| **4** | Avoid `any`; document or `@ts-expect-error` | **MET** | Exhaustive: `git grep -nw 'any'` over all 214 files, every hit read. **0 occurrences in type position** — all 20 matches are the English word in prose ("any of those change", "Clear any possible selected categories"). **`@ts-expect-error` 0, `@ts-ignore` 0.** The cleanest result in the stack on this axis, and it is a real result rather than an absence of surface: the slice contains 84 typed load functions, endpoints and components. **Complement:** `lint:check` would not have proven this — `no-explicit-any` is configured with `ignoreRestArgs: true` (`packages/shared-config/eslint.config.mjs:98-102`), which is how three `Array<any>` rest parameters passed the gate in slice 06. Here there are none to exempt. |
| **5** | No repeated code in the PR or elsewhere in the repo | **DEFERRED** | A real duplication, deferred because the fix is excluded rather than because it is small. `candidate/login/+page.server.ts` and `admin/login/+page.server.ts` are **substantially the same action**: normalise the app name and they differ only in a role list (`candidate`/`party` vs `project_admin`/`account_admin`/`super_admin`), a route constant, and comment wording — including a **verbatim-duplicated hand-rolled JWT payload decode**, which is the security-relevant half. **Not fixed: extracting it is code restructuring, which D-13 excludes explicitly, and it is a behaviour change on an authentication path with no coverage in either direction** (`grep -rn redirectTo tests/` matches only an unrelated Supabase auth-email parameter). Partially addressed in passing: `loginRedirectTarget.ts` (`271f3f8e4`) is shared by both rather than copied into each, so this plan did not add to the duplication it found. Separately **not** a finding: the voter-route allowlist regex appears at 2 sites and both comments say the second is a deliberate defence-in-depth re-check at the consumption layer — intentional, documented duplication. |
| **6** | New components / functions / entities documented | **FIXED** | `src/routes/README.md` enumerated the route tree as three bullets — voters, candidate, candidate/(protected) — and **omitted the two trees this slice adds**: `admin/` (5 page routes, 4 `(protected)`) and `api/` (17 `+server.ts` endpoints). That is **22 of the slice's 114 present files**: the whole server-side API surface and the whole admin app, missing from the one file whose job is to say where routes live — and this README is the only documentation *inside* the slice, since the fuller treatment is in `apps/docs` (slice 09), which a reviewer of PR 8 never sees. Fixed in **`bc1963610`**, which also documents the seven non-route shell files, because a reader who knows SvelteKit will otherwise read every `.svelte` in the top directory as a route — and because `Layout.svelte`/`MainContent.svelte` carry the app's a11y structure, so naming them is where an accessibility reviewer should start. `loginRedirectTarget.ts`, this plan's own new file, ships with a 30-line docblock stating the threat, the single legitimate producer, and why the fallback is fail-safe. **The README's existing claim that locale handling runs through a reroute hook was checked, not assumed:** `hooks.ts:5-7` exports `reroute` and calls `deLocalizeUrl`. Accurate; left as written. |
| **7** | Repo documentation markdown updated | **FIXED** | Two READMEs in the slice, both touched. `src/routes/README.md` per item 6 (**`bc1963610`**). `src/routes/candidate/README.md` needed no content change — checked rather than waved through: it describes registration, authentication and profile management, which is what `candidate/` still does, and carries no stale `[[lang=locale]]` or pre-move `docs/` path (**both of its dead local links were already repaired by 151-14's F-57, inside this slice's diff, so they are reviewed with it**). `apps/frontend/messages/README.md` created for slice 08 (**`75c10cb8f`**, see that section). |
| **8** | Tracking events for new user-facing functions | **MET** | Enumerated: **17 `startEvent(` call sites**, **12 distinct event names** — `menu_open`, `question_next`, `question_previous`, `question_skip`, `question_startFrom`, `questionExtendedInfo_open`, `questionExtendedInfo_expandSection`, `questionExtendedInfo_collapseSection`, `questionInfo_expand`, `questionInfo_collapse`, `results_changeElection`, `results_changeTab` — every one a member of the `TrackingEventName` union (`$lib/contexts/app/tracking/trackingEvent.type.ts:14-43`). **The gate is `yarn build`**: the union makes a typo'd name a type error, so a mis-named event cannot ship. **Complement, unchanged from slice 06: the union is one-directional.** It cannot detect a declared-and-never-fired name, and nothing requires a new user-facing route to add an event — which is the half a gate cannot express, and this slice adds the whole admin app with **0** tracking events in it. Recorded as a deliberate absence (admin is operator-facing, not user-facing) rather than as coverage. |
| **9** | New Svelte components follow the guidelines | **MET** | 60 `.svelte` files added. Structural conformance checked and clean: **0** `svelte/store` imports (the frontend's own eslint config makes one an `error` across `src/**`), **0** `export let` (Svelte 4 props syntax) — every component uses `$props()`. The six shell components all carry `<!--@component` docblocks documenting their snippets and properties (`Layout.svelte:1-16`, `MainContent.svelte:1-24`, and siblings), and unlike slice 06's four repaired examples **none documents a deleted API**: no `$store` auto-subscription syntax appears in any docblock in this slice. **3 `svelte-ignore` directives total, 1 of them a11y** (`Layout.svelte:67`, `a11y_positive_tabindex`) and it carries its rationale on the line above. The other two are `state_referenced_locally`. |
| **10** | Errors handled and logged | **FIXED** | **19 debug `console.*` statements in the two admin form actions — the route half of the defect 151-14 fixed as F-53 one slice below.** That plan took `console.*` under `src/lib/server/admin` to 0; the actions that *call* those features kept more, and worse: `argument-condensation/+page.server.ts` logged `typeof jobInfo` and `Object.keys(jobInfo || {})`, and carried a block commented `// DEBUG:` that awaited `dataWriter.getJobProgress()` — **an extra network round-trip on every admin job start** whose sole consumer was the next line's log (verified a pure read, `universalDataWriter.ts:211`, with nothing downstream using the result). `question-info/+page.server.ts:25-33` logged `customInstructions` and `questionContext` — **admin-authored free-text LLM prompt content** — at INFO level, unguarded, on every submit. All 19 removed and both catch blocks moved onto the project's DEV-only `logDebugError`, which all 22 other route files here use, and both already return the message to the admin UI via `fail()`. Commit **`a82af4c38`**; `console.*` under `routes/admin/` is now **0**. **Complement, recorded rather than swept:** 12 `console.error` calls remain, in `routes/api/**/+server.ts` catch blocks and `hooks.server.ts:86` (`handleError`). Those are genuine server-side error paths with no admin-visible alternative and no server logger in the project — deliberately left, and named so the count is not mistaken for zero. |
| **13** | WCAG A and AA | **FIXED** | See the reach section above. 36 routes changed, **5** scanned, **31** not — every one of the 31 named with a manual verdict, nine defect classes applied to all of them, and **the one defect found and fixed**: the `<h1>` → `<h4>` two-level skip at `results/[[electionTab]]/statistics/+page.svelte:125,151`, an axe `heading-order` failure on a route the scan never visits. That h2 is the correct level was verified rather than chosen: `Expander.svelte:156-157` renders its title in a plain `<div class="collapse-title">` with no heading role, so the page's real heading tree is the `<h1>` and then these two. Rendered output unchanged — `app.css` styles headings in `@layer base`, so the `text-base` utility overrides size and leaves weight identical — and baseline exposure was checked first: the visual chain covers `/results` and `CandAppPreview` only, and no spec or fixture references the statistics route at all. Commit **`f7076dbfe`**; **0** baselines regenerated. |
| **14** | Keyboard + screen-reader usable | **DEFERRED** | The keyboard half has **no gate anywhere in the project** — axe does not tab through the UI, so it is uncovered on the 5 scanned URLs as much as on the other 31 — and the raw-i18n-key scan has identically the axe reach (one call site, inside `assertAxeScan`). The drawer path was traced by hand and is correct (`Layout.svelte:50`, `:61`, and the `aria-hidden` overlay at `:108` duplicating a keyboard-reachable control), and the app-wide `afterNavigate` focus reset plus the `aria-live` route announcer are in this slice and are real. But one path read carefully is not a gate. **DEFERRED rather than MET because authoring one is net-new test authorship, which D-13 excludes**, and widening the axe route table is Phase 147's scope and it has not executed. |
| **15** | Developers'/Publishers' Guide entries updated | **DEFERRED** | The guide pages documenting this slice — `developers-guide/frontend/routing`, `developers-guide/candidate-user-management` — were **not** updated for it, and the defect is the whole-tree class 151-14 raised as **F-64**: 272 `blob/main/frontend/…` permalinks across 117 files under `apps/docs/`, pointing at a path slice 01a removed. `apps/docs/**` is **slice 09, cut by 151-16**, and that plan owns the class including its generator half. Two specifics this slice adds to it, recorded here so 151-16 need not re-derive them: the routing guide's generated page does not describe the **`admin/` app or the `api/` tree at all** (the same gap this plan fixed in the in-slice README), and the routing prose predates the locale-segment removal that is this slice's defining change. Fixing 117 files inside another uncut slice from this plan would put a change of that size outside the disposition that reviews it. |

### The two context reactivity violations — enumerated, and one of them was previously missed

**151-14 scanned this slice from next door and reported 41 destructure sites with 1 violation. Re-run
here over the same tree it is 84 sites with 2.** The gap is instructive and is exactly the phase's
recurring failure mode — an internal identity that is self-consistent and incomplete: that scan
matched `get*Context()` call sites, and the second violation destructures from **`initAppContext()`**,
which is not one of those.

| Surface | Destructure sites | Destructuring a reactive accessor | `dataRoot` consumers | Bound to an intermediate `$derived` alias |
|---|---:|---:|---:|---:|
| slice 07 (`src/routes`, `src/params`, shell) | **84** | **2 — both FIXED** | **19 files** | 2, both benign |

- **F-61 (was routed here by 151-14) — FIXED in `f91356687`.**
  `(voters)/(located)/results/[[electionTab]]/+layout.svelte:73-82` destructured `appSettings` and
  `dataRoot`, above a comment at `:66-72` asserting *"Stable stores/functions/objects (appSettings,
  dataRoot, getRoute, t, answers, startEvent, *Countdown) remain destructured."* True before the
  v2.13 handle flatten, false after. `appSettings` is value-replacing, so the local went stale;
  `dataRoot` is identity-stable, so the destructure took its `#version` dependency once at init and
  `{#if dataRoot.elections.length > 1}` at `:349` never re-evaluated when data arrived — the
  cold-entry class. `appSettings` now reads through a `$derived` alias (correct for a value-replacing
  accessor); both `dataRoot` reads (`:176` inside a `$derived.by` thunk, `:349` in the template) now
  go through `voterCtx.dataRoot` inside their own tracking scope. **The stale comment was rewritten
  too** — a comment asserting the wrong rule is how this survived four phases.
- **F-73 (new here) — FIXED in `f91356687`.** `routes/+layout.svelte:48-57` destructured
  `appSettings` out of `initAppContext()`, whose own declaration reads *"MUST be read off `ctx`
  (never destructured)"* (`$lib/contexts/app/appContext.type.ts:54-61`). Consumers: the
  `visibilitychange` registration at `:189` and the analytics mount at `:254-257`. Failure mode is a
  settings re-merge after mount (`appContext.svelte.ts:385`) that the frozen local would never see.
- **F-62 (was routed here) — confirmed NOT a defect, and not "fixed".** The two
  `const dataRoot = $derived(ctx.dataRoot)` aliases are the forbidden *shape* without its failure
  mode, verified line by line rather than accepted on 151-14's word:
  `(voters)/(located)/+layout.svelte:38` is used only at `:93-96` inside `updateAsync`, an async
  function whose docblock at `:84` says it exists so `dataRoot` is *not* tracked; and
  `candidate/(protected)/preview/+page.svelte:32` is used at `:66-67` inside `loadCandidate`, after
  an `await`, assigning to `$state`. Both are outside any tracking scope. **Left alone** — "fixing" a
  non-bug here would have made the record less trustworthy, not more.
- **The 17 other `dataRoot` consumers are the control set**, and they are what makes F-61 legible as a
  defect rather than a style preference: every one reads `ctx.dataRoot.<prop>` directly inside its
  tracking scope and carries a comment saying so. The results layout was the single file whose comment
  said the opposite.

**Covering tests, named rather than claimed** (the requirement this plan inherited from 151-14, which
deferred F-61 precisely so it could be met):

- F-61's class: `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` — written as the negative
  control for exactly this staleness class, on the multi-election `e2e/base` seed F-61's guard needs.
  **It has no `/results` case**, so it covers the class and not this site; the warm intro walk that
  does reach `/results` (`voter-journey.spec.ts`) **masks** the bug, by that spec header's own
  account. Extending it with a cold `/results/...` case is net-new test authorship (D-13) and is
  **deferred to 151-18**.
- F-73: `tests/tests/specs/voter/voter-prefs-tracking.spec.ts` asserts the `window.umami.track`
  boundary, which requires the analytics branch this fix touches to render. Its seed sets the platform
  before mount, so it is a **regression guard for the fix, not a detector of the bug** — stated that
  way rather than counted as coverage.
- **Neither was run.** No dev server on `:5173`, no seeded local Supabase. Per `CLAUDE.md` a
  did-not-run E2E test counts as a failure, so **no green suite is claimed**; D-24's run at 151-18
  owns that signal.

### F-44's blind spots, run over this slice because the gate will not

151-13 routed three known gate blind spots to the sweeping plans. Run here:

| Pattern | Hits in slice 07 | Disposition |
|---|---:|---|
| bare `NN-NN` plan identifiers (`\b\d{2,3}-\d{2}\b`) | **18 raw**, of which **10 are genuine** (`88-02` ×9 in `post-88-02` / `pre-88-02` / bare form, `86.3-01` ×1) | **Recorded, not stripped.** Unlike 151-13's pure `122-05` citations, these sit inside load-bearing prose that distinguishes two design generations of the same route ("the post-88-02 loop fix"); removing them costs meaning. The other 8 are false positives — threat ids `T-62-04`/`T-69-01` and line ranges (`75-76`, `166-188`, `43-48`, `60-67`). |
| `plan NN` single-number (`\bplans?\s+\d+\b`) | **5** (`Plan 02` ×4, `Plan 02` in a profile comment ×1) | **4 removed** as part of the item-3 comment repair (`d0c63af0d`), which rewrote those four citations to `Deferred-target handling (see phase 78):`. Gate-neutral: `plan-number` requires a two-part number. |
| task id with a trailing character (`\b[A-Z]{3,}-\d{2}[a-z]\b`) | **0** | nothing to find |
| **a fourth blind spot, found here** | **1** | `params/etSg.ts:3-4` ends a line with `introduced by Phase` and continues `88 to make…`. The gate's `phase-ref` pattern needs keyword and digits on the **same line**, so a wrapped reference is invisible to it — F-44's third blind spot, confirmed live for the first time. **Left in place**: it is grammatical as it stands, and collapsing it onto one line would either add a `phase-ref occ` (if `see`-prefixed) or add a `bare` (if not), both of which move an operator-approved count. Routed to **151-19** with the rest of F-44. |

Strip-row patterns over this slice are all **0** (`D-NN` long and bare, `§`, `.planning/`, two-part
`plan N-N`, `[A-Z]{3,}-\d{2}`), and `phase-ref` **bare = 0** against 90 `occ` — so **this slice
contributes nothing to either of the gate's two operator-approved red rows.**

### The line-break trap, and the drift this plan caught in its own work

**The trap that moved criterion 3's approved state at 151-13 did not fire here, but a sibling of it
did — in this plan's own commits, and it is recorded rather than quietly corrected.** The two
reactivity-fix comments in `f91356687` carried three new `see phase N` citations, one new
`see spike N` and one new `v2.13`, taking the report's **ungated** columns from 660/40/43 to
663/41/44. **The gated `bare` columns never moved** — every citation was correctly `see`-prefixed — so
`--assert-clean` would have gone on reporting exactly the two approved rows and the drift would have
shipped unnoticed. That is precisely why the standing check is on `occ` and not only on `bare`.
Corrected in **`33e616758`** by removing the citations, which were redundant anyway: the rule they
pointed at is in `CLAUDE.md`, which both comments name, and the 17 sibling consumers already carry the
same references. Final state byte-identical to the pre-plan baseline.

### Findings queued by this sweep

| ID | Verdict | Item(s) | Finding | Landing |
|---|---|---|---|---|
| **F-61** | FIXED `f91356687` | 3, 12, 13 | `results/[[electionTab]]/+layout.svelte` destructured `appSettings` and `dataRoot` while its own comment asserted that was correct. Routed here by 151-14. | slice 07 |
| **F-62** | **NOT a defect** | 3 | The two `$derived(ctx.dataRoot)` aliases are write-only and outside any tracking scope, verified line by line. Left alone. | — |
| **F-67** | FIXED `271f3f8e4` | 2 | Unvalidated caller-controlled `redirectTo` interpolated into both login actions' redirect target, while the voter half of the same slice validates its equivalent twice. | slice 07 |
| **F-68** | FIXED `a82af4c38` | 10 | 19 debug `console.*` in the two admin form actions, including an extra network round-trip that existed only to feed a log line and one that logged admin prompt content. The route half of 151-14's F-53. | slice 07 |
| **F-70** | FIXED `bc1963610` | 6, 7 | `src/routes/README.md` omitted the `admin/` and `api/` trees — 22 of the slice's 114 files. | slice 07 |
| **F-71** | FIXED `f7076dbfe` | 13, 14 | `h1` → `h4` heading skip at two sites on an unscanned route. | slice 07 |
| **F-73** | FIXED `f91356687` | 3, 12 | Second reactive-accessor destructure, in the root layout, from `initAppContext()` — invisible to a scan keyed on `get*Context()`. | slice 07 |
| **F-74** | DEFERRED | 5 | The two login form actions are substantially the same action, including a verbatim-duplicated hand-rolled JWT payload decode. Extraction is restructuring (D-13); no coverage either way. | 151-18 / later phase |
| **F-75** | DEFERRED | 13, 14 | `Expander`'s title is a plain `<div>` with no heading role, and its only control is a checkbox whose accessible name is the generic `common.expandOrCollapse` — a screen-reader user is not told which question. **Slice 06, published as PR #869**, so fixing it means force-pushing a PR under review. | 151-18 / post-merge |
| **F-76** | DEFERRED → **151-19** | 3 | A fourth F-44 gate blind spot, confirmed live: a phase reference broken across a line (`params/etSg.ts:3-4`) is invisible to `phase-ref`, and neither repair is count-neutral. | gate design |

### Evidence contributed to the phase-level cells (which stay `PENDING→18`)

- **Item 12 (shared-dependency blast radius).** This slice is the app's entry surface: 84 context
  destructure sites, 19 `dataRoot` consumers, 17 API endpoints, and the three sequenced server hooks
  every request passes through. `yarn build` (14/14) and `yarn test:unit` (1,522 / 149) both cover it,
  and the two `params/` matchers carry their own unit tests. **Complement, and it is the load-bearing
  one for this slice: neither gate exercises a request.** `hooks.server.ts`'s handler sequence, the six
  admin endpoint guards and the login redirect all run only under E2E, which is D-24's at 151-18.
- **Item 11 (failing checks).** Nothing new. Re-verified against the live run rather than copied:
  `gh run view 32017478048 --json jobs` reports step **3 `Setup Yarn 4.6` — failure** and step **5
  `Install all dependencies` — skipped** on `frontend-and-shared-module-validation`; the same on the
  other two jobs. `main.yaml` at 01a's tip is blob **`c2fdcedb2`**, byte-identical to `origin/main`'s,
  and defines exactly three jobs — so `skill-drift-check`, `supabase-tests` and
  `dev-seed-integration` do **not** exist at any published head.
- **Item 16 (history).** Nine commits, all conventional, all scoped `(151-15)`.

### Slice 07 — the file-count delta, attributed by set difference

**213 → 214 files, +10,291 → +10,319, −8,268 unchanged.** Established with `comm` over the two
`diff --name-only --no-renames` sets, not by subtraction.

| File | Why it entered | Left the set |
|---|---|---|
| `apps/frontend/src/routes/loginRedirectTarget.ts` | F-67's shared guard, placed under `routes/` because `$lib` is slice 06 and published | — |

**Zero files left the set.** Line delta `+142 / −114` across 28 files → net +28 insertions and 0 net
deletions, which reproduces 10,291 + 28 = **10,319** and 8,268 unchanged.

**The dry run's prediction is also fully attributed, in both directions.** It predicted
213 / +10,291 / −8,267. At 151-13's tip the slice measured 213 / +10,290 / −8,267 and at 151-14's
213 / +10,291 / −8,268 — the +1/+1 is 151-14's F-57 dead-link repair in `src/routes/README.md`, a
file already inside this slice's diff. **No file has ever entered or left this slice's cell.**

---

## Slice 08 — `ship/v0.2-akita-08-i18n-messages` — cell-by-cell evidence

**Filled by plan 151-15.** The 12 per-slice general items. All three conditional blocks read
`n/a — outside block pathspec`. The four phase-level items are not re-run here.

**330 files, 47 namespaces × 7 locales plus one README, one shape, +8,986 / −0 — and the sweep is
dominated by one question that no per-item fan-out would improve: are the key sets in parity?** It is
answered by measurement below, not by inspection, and D-19's fan-out was collapsed accordingly and is
recorded as collapsed rather than performed.

Measured refs: `PARENT` = slice 07 `342926b93`; `TARGET` = `feat-gsd-roadmap` `75c10cb8f`; file set
`diff --no-renames ship/v0.2-akita-07-frontend-routes..TARGET -- apps/frontend/messages` → **330
files, all `A`**. Status set `A` only — no deletion, no modification. Dropped-finding class: **0**,
by the same two independent methods used for slice 07.

### Key-set parity — measured over every locale, every file, every key

**This is the cell the slice exists to answer, and the answer is exact.**

| Measurement | Value |
|---|---|
| locale directories on disk | **7** — `da`, `en`, `et`, `fi`, `fr`, `lb`, `sv` |
| locales declared in `project.inlang/settings.json` | **7**, identical set; `baseLocale` `en` |
| files per locale | **47**, and the union of file names across all 7 is also **47** — no locale is missing a namespace and none has an extra |
| files listed in `pathPattern` vs files on disk | **47 = 47**, symmetric difference **0 both ways** — no uncompiled file, no pattern entry without a file |
| keys per locale (fully qualified, `file::path`) | **598** in every one of the 7 |
| **union of all locales' key sets** | **598** |
| **intersection of all locales' key sets** | **598** |
| **symmetric difference (union − intersection)** | **0** |

**No key is present in one locale and missing in another.** Reproduce with the script now committed
at `apps/frontend/messages/README.md` § "Checking your work", which was executed as written before
being committed and prints nothing.

**Why parity had to be measured directly rather than delegated to the scan** — and this is the reason
the plan's key link is right: `t()` returns **the key string itself** when it cannot resolve a message
(`$lib/i18n/wrapper.ts:29-38`), so a locale missing a key renders a raw dotted identifier into the
page. That is exactly what `assertNoRawI18nKeys` catches — but only within its measured reach, which
is the axe reach (5 URLs; one call site, inside `assertAxeScan`), i.e. **5 of 36 routes and none of the
candidate or admin apps**. A parity defect in a Finnish candidate-app string is outside the gate by
construction.

### Placeholder-set parity — the second measurement, and it found the slice's one defect

A key can be present in all seven locales and still be broken, because `{name}` refers to a **declared
input** and the declared names are part of the message's callable signature. Compared across all 598
keys × 7 locales, recursing into the plural/selector bodies (147 message bodies are arrays, not
strings — a check that skipped them would have reported a clean result and been wrong):

| | Before | After |
|---|---:|---:|
| placeholder-set divergences vs `en` | **2** | **1** |

- **F-69 — FIXED in `3efe68d30`.** `sv/components.json` → `components.video.timeLeft` declared
  `input minuter` / `input sekunder` and interpolated `{minuter}` / `{sekunder}`, where all six other
  locales declare `minutes` / `seconds`. The Swedish variant therefore had a **different signature**
  from its siblings and could not receive what callers pass. Only the four declarations, two selector
  names and two interpolations were renamed — **the Swedish text is untouched**, so this is not a
  translation decision. **Severity stated rather than inflated: the key has zero call sites
  repo-wide** (`Video.svelte` uses 12 sibling keys and not this one), so nothing renders it today. It
  was fixed because the repair is mechanical and lossless, not because it is live. The defect is also
  **inherited, not introduced**: the pre-Paraglide ICU catalogue at
  `src/lib/i18n/translations/sv/components.json:74` carries the same `{minuter, plural, …}`, so the
  migration copied it faithfully.
- **The remaining divergence is DEFERRED and named:** `questions.intro.start` is
  `Answer {numQuestions} Questions` in `en` and interpolates `numQuestions` in five other locales, but
  `sv` reads `Börja svara på frågor` with no placeholder. That one **is** live — the questions-intro
  CTA at `(voters)/(located)/questions/+page.svelte:161` — but the remedy is Swedish copy, which is a
  publisher decision and not this plan's to make.

Also measured, and neither is a defect: **12 empty-string values**, of which 7 are
`dynamic.candidateAppPrivacy.otherTermsOfUse.content` (empty in all 7 — a deliberate
publisher-overridable default whose own render site is guarded on truthiness,
`TermsOfUse.svelte:42`) and 5 are `common.madeWithSuffix`; and **31 values identical to `en` in all
six other locales**, of which 24 are emoji, 7 are the endonyms in `lang.json` (`Suomi`, `Svenska`, …,
correctly untranslated by design) and one is the empty default above.

### Two corrections this sweep produced

- **The plan's stated authority for the locale count is wrong.** `151-15-PLAN.md`'s `read_first` names
  `packages/app-shared/src/settings/staticSettings.ts` as "the authority for how many locales the
  message sets must cover". It lists **3** (`en`, `fi`, `sv`); this slice ships **7**. The authority
  for what must exist here is `apps/frontend/project.inlang/settings.json` → `locales`;
  `supportedLocales` decides what a *deployment* offers and is meant to be edited per instance. Not a
  repository defect — a plan-encoded claim, the eleventh in this phase to be wrong as written, and now
  documented in the slice's own README so the next reader does not repeat it.
- **The compile-time key gate for this slice reads a different catalogue, and the file it lives in is
  reviewed by nobody.** `t()`'s `key` parameter is typed against the generated `TranslationKey` union,
  which makes a non-existent key a build error — a genuinely strong gate. But
  `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` builds that union from
  `src/lib/i18n/translations/` (the legacy ICU catalogue, **slice 06**), not from `messages/`, and
  from **one** locale's filenames. Today the two agree exactly — union **598**, catalogue **598**,
  symmetric difference **0 in both directions** — but nothing enforces that, and the failure is
  asymmetric: a key added to the legacy tree alone is *typed* while Paraglide cannot resolve it, so
  `t()` falls through and renders the key to a user. Worse, `apps/frontend/tools/` (3 files) is
  **claimed by no slice's pathspec** — asserted by running every row of `slices.tsv` against it, all
  eleven returning 0 — **and** is byte-identical across the layout move, so it is in no slice's diff
  either. It is a named, load-bearing instance of the class F-15 raises abstractly. **F-15's
  structural question is the operator's at 151-16 and is not acted on here**; this is recorded so that
  decision has a concrete example rather than a count of 120.

### Slice 08 — general items (12 cells)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **2** | OWASP Top 10 | **MET** | Message values are user-facing content rendered through `{@html sanitizeHtml(…)}` at the 20 call sites in slice 07 and 19 in slice 06 — **A03 is therefore mitigated at the render site, not here**, and this cell's job is to confirm the content does not require more than the sanitiser gives. Tag census over all 7 × 47 files: only `p` (279), `h3` (70), `li` (21), `a` (21), `ul` (7) — **no `script`, `iframe`, `object`, `embed`, `form`, `style`, or event-handler attribute anywhere**, all of which DOMPurify's html profile would strip regardless. **Secret-shaped literal scan over 330 files: 0.** **Complement: a malformed interpolation is an availability defect, not an injection one** — `t()` catches the throw and returns the key, so the failure mode is a raw identifier on the page rather than executed content. That path is item 3's, and it is where F-69 was found. |
| **3** | Follows the Code style guide | **FIXED** | For a message catalogue the style contract is shape, not TypeScript: file-per-namespace naming matching `pathPattern` exactly (**47 = 47**, both directions), one directory per declared locale (**7 = 7**), valid JSON in all 330 files (`json.load` over every one, **0 failures**), and the inlang `declarations`/`selectors`/`match` form for the 147 plural bodies. **FIXED** on F-69: `sv`'s `components.video.timeLeft` violated the one shape rule that has teeth — that a `{name}` names a declared input rather than a word to translate. Commit **`3efe68d30`**. Hygiene: every gate pattern over this slice returns **0** — `phase-ref` 0, `D-NN` 0, `§` 0, `.planning/` 0, `[A-Z]{3,}-\d{2}` 0, `plan N` 0, bare `NN-NN` 0 — and all three of F-44's blind-spot patterns return 0 as well. **The hygiene codemod never touched this slice**: the diff-pair method over all three of its commits, restricted to `apps/frontend/messages`, returns nothing. |
| **4** | Avoid `any`; document or `@ts-expect-error` | **NOT-SWEPT** | `n/a — no applicable surface in this slice.` 330 files: 329 JSON and one Markdown. No TypeScript, so no type position for `any` to occupy. |
| **5** | No repeated code in the PR or elsewhere in the repo | **DEFERRED** | A real duplication, and a large one: **`src/lib/i18n/translations/` (slice 06) is a second, parallel translation catalogue** — 46 files × 7 locales in ICU syntax, carrying the same 591 keys this slice ships in inlang syntax (confirmed by comparing the generated union, 598, against this catalogue's key set plus the 7 `lang.*` keys the generator appends: they close exactly). It is not dead — the `TranslationKey` generator reads it — but its *content* is duplicated, so a string edited in one and not the other diverges silently in whichever direction the reader is not looking. **Not fixed: the remedy is to repoint the generator at `messages/` and delete the legacy tree, which is a change to a file no slice claims plus a 322-file deletion in a published slice (PR #869)** — restructuring on both counts, excluded by D-13. Recorded with the mechanism so 151-18 can route it. |
| **6** | New components / functions / entities documented | **FIXED** | The entity a translation catalogue exposes is its **contract**, and none of it was written down: no README in `messages/`, and the only nearby prose is `project.inlang/README.md` (slice 10), which describes the inlang folder and says only that translation files live elsewhere. `apps/frontend/messages/README.md` created in **`75c10cb8f`**: which of the two locale lists is authoritative and why, the six rules a translator must keep (parity, `pathPattern` correspondence, placeholders-are-signatures, placeholder-set equality, the HTML/heading-level constraint, the plural form), a **runnable** parity check, and the honest limit of the compile-time one. **The embedded script was executed as written before being committed** — a documented check nobody has run is the same class of defect as the comments item 3 of slice 07 spent a commit repairing. **Deliberately not recorded MET on the strength of the slice being "just translations"**, which this plan was warned against and which the two defects found here would have concealed. |
| **7** | Repo documentation markdown updated | **NOT-SWEPT** | `n/a — no repo documentation markdown existed under this pathspec before this plan created it.` The README added under item 6 **is** this slice's documentation, and the guide-side half is item 15's. |
| **8** | Tracking events for new user-facing functions | **NOT-SWEPT** | `n/a — no applicable surface in this slice.` A catalogue defines no user-facing function; the 17 `startEvent` call sites that consume `t()` are slice 07's and the 13 more are slice 06's. |
| **9** | New Svelte components follow the guidelines | **NOT-SWEPT** | `n/a — no applicable surface in this slice.` **0** `.svelte` files. |
| **10** | Errors handled and logged | **NOT-SWEPT** | `n/a — no applicable surface in this slice.` JSON data declares no error handling. The resolution failure path — catch, `logDebugError`, return the key — is `$lib/i18n/wrapper.ts:29-38`, slice 06, and was dispositioned there. What *is* this slice's responsibility is not creating an input that path has to absorb, which is item 3's F-69. |
| **13** | WCAG A and AA | **MET** | Message content reaches the accessibility tree, so this is a real cell rather than a formality, and it was swept over the content rather than waved. **21 anchors across the 7 locales, 0 with no discernible text** (each has visible link text inside the tag). **0 `<img>`, so 0 missing `alt`.** **70 `<h3>` occurrences, and they are correct — verified by tracing the content into its renderer rather than judged from the value.** All 70 are 10 headings × 7 locales inside the single key `dynamic.candidateAppPrivacy.registryStatement.content`, which renders at `TermsOfUse.svelte:38` **immediately below an `<h2>` that the same component supplies at `:36`**, itself under `MainContent`'s `<h1>` (`candidate/privacy/+page.svelte:22`). Tree: h1 → h2 → h3, **no skip** — the opposite verdict from the superficially identical pattern this plan fixed on the statistics page, and the difference is entirely in the render context. **Complement: the route that renders it, `candidate/privacy`, is one of the 31 the axe scan never visits**, so this content's heading order has no automated coverage in either direction. |
| **14** | Keyboard + screen-reader usable | **NOT-SWEPT** | `n/a — no applicable surface in this slice.` A catalogue has no focus order and no interactive elements. The screen-reader-visible half of its content is item 13's above; the raw-key scan that would catch a resolution failure has the axe reach and is recorded as such there. |
| **15** | Developers'/Publishers' Guide entries updated | **DEFERRED** | Neither guide documents this slice's authoring workflow — how to add a namespace, the parity requirement, or the placeholder-signature rule. Same class as slice 07's cell: `apps/docs/**` is **slice 09, cut by 151-16**, carrying F-64's 117-file permalink repair, and a guide page written from this plan would sit outside the disposition that reviews it. **Partially discharged rather than wholly deferred:** the in-slice README added under item 6 puts the contract where a translator actually looks first, so the deferred half is the guide's narrative, not the rules themselves. |

### Slice 08 — D-19 fan-out, recorded as collapsed rather than performed

D-19 prescribes one agent per checklist item per slice. **For this slice that was deliberately not
done, and saying so is the point:** eight of the twelve items have no applicable surface in 329 JSON
files, and the four that do (2, 3, 6, 13) turn on four *measurements* — key-set parity, placeholder-set
parity, tag census, and the render context of the content that carries headings — each of which is a
single computation over the whole slice rather than a judgement twelve agents could improve. Fanning
out would have produced twelve reports of the same four numbers. The plan anticipated exactly this
("its sweep is dominated by one question that no per-item fan-out would improve") and the record states
the deviation rather than implying twelve passes happened.

### Slice 08 — the file-count delta, attributed by set difference

**329 → 330 files, +8,904 → +8,986.** One file entered, zero left:
`apps/frontend/messages/README.md` (item 6's fix). Established with `comm` over the two
`diff --name-only --no-renames` sets. The F-69 fix moved **no** count — `+14 / −14` inside
`sv/components.json`, a file already in the diff — which is why the totals moved only by the README's
82 lines.

**Slice 08 was therefore re-cut, and nothing published moved.** Its branch was rebuilt on the
unchanged, already-pushed slice-07 commit `342926b93`, and the assertion that slice 07 needed no
re-cut was made before the rebuild, not assumed: `diff --no-renames` between the pushed slice-07 tip
and the new target, restricted to slice 07's pathspec, returns **0 files**. PRs #869 and #870 show the
same objects that were pushed; **no force-push anywhere.** This is D-07's one-slice lag being spent
for the second time in the phase, after 151-11's slice-02 re-cut.

### The per-slice safety check — gap 0, identity MATCH

| check | result |
|---|---|
| chain | `07^ == 06` (`8c613634b` both sides) and `08^ == 07` (`342926b93` both sides), by `rev-parse` |
| commit count per slice | **1** and **1** (`git log --oneline <parent>..<slice>`) |
| status sets | slice 07 `ADM` (`109 A / 99 D / 6 M`); slice 08 `A` (`330 A`) |
| remaining-slices catch-all, `TIP08..TARGET` pathspec `.` | **`files=2394`** |
| partition arithmetic | 252 + 97 + 119 + 162 + 195 + 533 + 214 + 330 + 2,394 = **4,296** = comparable total (`diff --no-renames C1..TARGET`). **Gap: 0.** |
| attribution of the rise from 151-14's 4,292 | **+4, every one named, zero leaving.** By set difference: `151-14-SUMMARY.md` and `pr-bodies/05.md` (two `.planning/` files 151-14 committed after its own measurement, riding slice 11, 2,316 → 2,318), plus this plan's `loginRedirectTarget.ts` (slice 07) and `messages/README.md` (slice 08). |
| predicted remainder | 151-14's catch-all was 2,934 including slice 07's then-213 and slice 08's 329. 2,934 − 213 − 329 + 2 = **2,394**, the measured value. **Deviation 0.000%** against a 1% halt threshold. |
| a second, independent decomposition | per-slice pathspecs measured at this `TARGET`: 39 + 37 + 2,318 = **2,394**. The remainder closes **without reference to the catch-all**, and slices 09 and 10 are unchanged **file for file** from the dry-run table (39 / 37). |
| **partial-stack identity** | the nine cut slices plus the catch-all produce tree **`10ef4af4f`** = `TARGET^{tree}` **`10ef4af4f`**. **MATCH.** (Measured twice: `276d89a94` before the last two commits, `10ef4af4f` after, matching the target both times.) |
| `git status --porcelain` | empty throughout; `HEAD` never left `feat-gsd-roadmap`; the catch-all was applied into a scratch `GIT_INDEX_FILE` through `build-slice.sh` itself, never reimplemented, and never committed to a ref |

### Published

| slice | branch on `origin` | SHA (remote == local, asserted) | PR | base |
|---|---|---|---|---|
| 06 | `ship/v0.2-akita-06-frontend-lib` | `8c613634b` | [#869](https://github.com/OpenVAA/voting-advice-application/pull/869) | `ship/v0.2-akita-05-e2e-tests` |
| 07 | `ship/v0.2-akita-07-frontend-routes` | `342926b93` | [#870](https://github.com/OpenVAA/voting-advice-application/pull/870) | `ship/v0.2-akita-06-frontend-lib` |

Asserted after the fact, not assumed: both PRs return the expected `baseRefName`, `headRefOid` equal
to the local tip, and `OPEN`. `gh pr list --head ship/v0.2-akita-08-i18n-messages` returns **0** and
`git ls-remote --heads origin 'ship/v0.2-akita-08*'` returns **0**, so D-07's one-slice lag held —
**PR 9 stays closed until slice 09 is swept at 151-16.** `git ls-remote --heads origin 'ship/*'`
returns exactly **8** refs; `origin/main` is unmoved at `ac30f132a`; and PR **#860 was not touched**
(`updatedAt` still `2026-05-19T12:08:25Z`). Both pushes were dry-run immediately beforehand and each
reported `[new branch]`, with no force anywhere. Titles follow the format 151-13 stabilised —
`7/12 …` and `8/12 …`, `N/12` plus `slices.tsv` column 3 verbatim. Both PRs fire **no checks**,
asserted not predicted: `gh pr checks` returns *"no checks reported"* on each.

### The published numbers did not match the measured ones, and the reconciliation is in both bodies

**GitHub reported `528 files, +22,550, −8,179` for PR #869 against a measured 533 / +22,715 / −8,344,
and `165 files, +7,593, −5,542` for PR #870 against 214 / +10,319 / −8,268.** Both bodies had already
been written with the measured numbers, so this was caught by comparing the published result against
the measurement rather than by trusting either.

**Cause: rename detection**, and it reproduces exactly locally. `git show -M --shortstat` on the two
slice commits returns `528 / 22550 / 8179` and `165 / 7593 / 5542` — digit for digit what GitHub
reports — with rename-aware status sets `207 A / 55 D / 261 M / 5 R` and `60 A / 50 D / 6 M / 49 R`.
The manifest's convention for the stack table is `--no-renames`; GitHub's Files-changed tab is not.
For slice 07 the gap is large and *favourable*: 49 of the 97 `[[lang=locale]]` route files are matched
to their de-localised counterparts, so a reviewer gets 49 readable rename diffs instead of 98
delete-plus-add halves.

**Both live PR bodies were edited to carry both numbers and the reconciliation** before any review
arrived. Neither number changes a conclusion: #869 is over both render budgets on either measure
(528 > 300, 30,729 > 20,000) and #870 is inside both on either (165 and 13,135).

### Gate verdicts after this plan's fixes — measured, not assumed

| Gate | `151-BASELINE.md` | Measured after | Verdict |
|---|---|---|---|
| `yarn build` (`TURBO_FORCE=1`) | 14/14 | **14/14** | unchanged |
| `yarn test:unit` (`TURBO_FORCE=1`) | 1522 tests / 149 files | **1522 / 149** | unchanged |
| `yarn lint:check` (`TURBO_FORCE=1`) | 0 errors / 20 warnings | **0 / 20** (core 2, dev-seed 15, frontend 1, tests 2) | unchanged |
| `yarn format:check` | RED on exactly 2 PD-03-fenced files | **RED on exactly 2** (`perm-bankauth-notloc.ts`, `tests/README.md`) | unchanged |
| `hygiene-grep-report.sh --assert-clean` | exit 1; `task-id` 84, `phase-ref` bare 11 | **exit 1, every column identical** (660/235/11, 40/30/0, 84/46, 43/30) | unchanged |

**`yarn format` was NOT run.** Two files were reformatted individually by path with
`npx prettier --write` — `routes/+layout.svelte` (the reactivity fix changed a destructuring line's
width) and `messages/README.md` (emphasis markers) — because growing `format:check`'s red set is what
PD-03 fences, and its *cardinality* is the fenced property. Every other edited file was
`prettier --check`ed individually and was already clean. **F-39 honoured: the lint warning count was
not reduced.** `yarn db:lint:sql` deliberately not run — it exits 1 on a correct tree pending F-21
and nothing here touches SQL.

**Snapshot check: `git diff --name-only ship/v0.2-akita-06-frontend-lib..HEAD` matches `-snapshots`
and `__screenshots__` 0 times each.**

### What this plan's sweep did NOT establish

**The 43 E2E specs were not run.** No dev server on `:5173`, no seeded local Supabase. Per `CLAUDE.md`
a did-not-run E2E test counts as a failure, so **this record claims two statically swept slices, not
green ones** — and that matters more here than in most slices, because two of this plan's seven fixes
are reactivity fixes and reactivity is what an E2E test is uniquely able to catch. Both covering specs
are named above with what they do and do not cover, and both are **deferred to 151-18** for execution
under D-24.

**No contrast ratio was measured** and no rendered output was inspected — the accessibility sweep over
the 31 unscanned routes is structural. **No keyboard interaction was exercised.** Both are stated
because the alternative is a claim.

### Ordering note — fixes were committed before this record, deliberately

As in 151-12, 151-13 and 151-14: the sweep ran first, the commits did not, because a cell may not read
`FIXED` before the commit it cites exists. D-04's actual requirement — fixes on `feat-gsd-roadmap`
before the slice is cut — is met for both slices, and for slice 08 twice over, since it was re-cut
after its own fix landed.

---

---

---

*Phase 151 · Plan 06 · scaffold created 2026-08-17 · cells filled by plans 151-09 … 151-18*

## Slices 09 and 10 — `-09-docs` and `-10-root-config` — cell-by-cell evidence

**Filled by plan 151-16.** The 24 per-slice general cells for the stack's last two code slices. All
three conditional blocks read `n/a — outside block pathspec` for both: neither touches
`apps/supabase/`, `apps/supabase/supabase/functions/` or
`apps/frontend/src/lib/api/adapters/supabase/`. The four phase-level items (1, 11, 12, 16) are
**not** re-run here; evidence is contributed below and their cells stay `PENDING→18`.

Measured refs for this pass:

| ref | value |
|---|---|
| `BASE` = `origin/main` | `ac30f132a` — **still unmoved**, at every measurement point in this phase |
| `PARENT` for slice 09 | `6a810df8a` — slice 08, cut by 151-15, **not** pushed |
| `TARGET` = `feat-gsd-roadmap` at sweep start | `d31b2e68b` |
| `TARGET` after this plan's nine fixes | `e2fa2c31c` |
| slice 09 at sweep start | **39** files (`2 A / 37 M`), +519 / −97 |
| slice 09 after the fixes | **151** files (`2 A / 149 M`), **+776 / −346** |
| slice 10 at sweep start | **37** files (`9 A / 4 D / 24 M`), +8,661 / −25,535 |
| slice 10 after the fixes | **39** files (`9 A / 4 D / 26 M`), **+8,664 / −25,538** |
| local Supabase / dev server | **not running.** No spec was executed; every verdict below is static, except the four gates and the docs-site build and link validator, which were run. |

### Slice 10's file count matched its prediction exactly, and that mattered

The plan makes this a halt condition: *"a surprise here means the partition is wrong and slice 11
will not save it."* Measured **before** any fix landed, slice 10 is **37** files against the
manifest's predicted **37** — deviation **0.000%**, against a 1% halt threshold. Slice 09 likewise
measured **39** against a predicted **39**. **Both of the last two code slices were unchanged from
the dry run's table, file for file, after eight intervening plans.** The +112 and +2 that follow are
this plan's own fixes, attributed below by set difference.

### Sweep surface, stated before any verdict (D-20)

| Slice | Reviewable surface | Declared out of surface, with reason |
|---|---|---|
| **09** | The 151 changed files, **plus** the whole `apps/docs/` tree reached from the target tree, per the standing instruction — the slice's pathspec claims **239** members of the dropped-finding class, and the sweep found real defects in them (98 generated component pages, the two build scripts and 12 hand-authored pages were all outside the diff before this plan and are inside it now). | Nothing under the pathspec. The 12 permalink targets that no longer exist (F-80) are *inside* the surface and are dispositioned, not excluded. |
| **10** | The 39 changed files, **plus** `.github/` reached from the target tree: `PULL_REQUEST_TEMPLATE`, `claude.yml`, `claude-code-review.yml` and `claude-solve-issue.yml` are byte-identical across the move and were in **no** slice's diff. Three defects were found there and two of the four files are now in the diff. | **The 120 files claimed by no pathspec** — including `apps/frontend/{android,ios}` (89) and `jest.config.json`, which are slice 10's *subject matter* but not its pathspec. **NOT-SWEPT for fixing, swept for finding**: they are enumerated and dispositioned below, and the remedy is the F-15 operator decision, not an agent's. |

### The 120 unclaimed files, re-derived by a second and independent method

151-06 derived the class from the diff (`comm -13` over `diff --name-only` vs the rename commit's
own file list) and reported **110** unclaimed under the dropped-finding class; 151-09's F-17 widened
the invisible-to-review count to 1,202 and the unclaimed count to **120**. This plan derived the
same number the other way round — from `git ls-files`, running **all eleven** `slices.tsv` pathspecs
over the tracked set and subtracting:

| measurement | value |
|---|---:|
| tracked files at `TARGET` | **5,070** |
| claimed by at least one slice pathspec | **4,950** |
| **claimed by none** | **120** |

**The two methods agree on 120 exactly**, and the census method additionally *enumerates* them,
which the diff method could not: `apps/frontend/android/` 55, `apps/frontend/ios/` 34,
`apps/frontend/static/` 10, `apps/frontend/tools/` 3, `apps/frontend/tests/` 2,
`apps/frontend/{jest.config.json, prettier.config.mjs, .prettierignore, .npmrc, .env.example, .dockerignore}` 6,
and **11 root-level files the earlier enumeration did not reach at all** — `README.md`, `LICENSE`,
`.editorconfig`, `.dockerignore`, `eslint.config.mjs`, `prettier.config.mjs`,
`vitest.workspace.ts`, `images/youthvaa-animation.gif`, `images/ee24-vaa-animation.gif`,
`design/icons/custom-icons.ai`. Per-file probes confirm the claim status one file at a time:
`README.md`, `apps/frontend/jest.config.json`, `apps/frontend/android/build.gradle`,
`apps/frontend/ios/App/Podfile` and `apps/frontend/tools/translationKey/generateTranslationKeyType.ts`
each return **claimed by: none** when every row of `slices.tsv` is run against them individually.

### Slice 09 — general items (12 cells)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **2** | OWASP Top 10 | **FIXED** | The slice's only executable surface is the static docs site plus six build scripts, so the register is short and was worked to the end rather than sampled. **A05 — reverse tabnabbing, FIXED.** `apps/docs/src/routes/+page.svelte:176` carried `<a … target="_blank" class="link">` with **no `rel`**, while the sibling `apps/docs/src/lib/components/GithubIcon.svelte:5` in the same app carries `rel="noopener noreferrer"` — so the codebase's own convention, not a general principle, is the argument. The block arrived from `origin/main` through the **D-22 integration merge** and is produced by no v0.2 commit, which is exactly why this record flagged it for this plan rather than leaving it to a slice diff. Fixed in **`d6f2a8d3e`**. Modern browsers imply `noopener` for `target=_blank`, so severity is low and the cell says so. **A03 — `{@html}` occurrences across the whole docs app: 0** (measured, `git grep -c '{@html'`), so the injection sink the frontend slices had to count does not exist here. **A02/A05 — secret-shaped literals over all 151 files: 0.** The one grep hit is `bind:password={passwordOfContext}` in a *generated component-doc example* (`…/generated/candidate/components/passwordField/PasswordField/+page.md:18`) — a property name in documentation, not a literal. **Complement:** the docs site is statically adapted (`@sveltejs/adapter-static`, confirmed by its own build output), so it has no request path, no auth and no server code to review; that is why this cell is short rather than because the review was. |
| **3** | Follows the Code style guide | **FIXED** | **The docs workspace's own `format:check` was RED at `HEAD` and is now green** — a gate `151-BASELINE.md` does not record, for a measured reason: root `format:check` is `prettier --check . && yarn workspace @openvaa/docs format:check`, so it **short-circuits** on the two PD-03-fenced files and the docs half has never run in this phase (F-82). Two files: `src/routes/+page.svelte`, whose merged D-22 block opens with **one** leading space where its siblings use two — precisely the risk this record predicted in the D-22 row — and `…/frontend/contexts/+page.md`, which **this plan's own permalink rewrite** made non-conforming by widening a markdown table cell. The first was pre-existing and is fixed in **`d6f2a8d3e`**; the second was verified pre-existing-or-not before being blamed, by running prettier over the `HEAD` blob through `--stdin-filepath` (it was **clean** at `HEAD`, so the plan caused it) and re-padded in **`b510aafb4`**. **F-44's three gate blind spots run over this slice, because the gate will not:** bare two-part plan numbers, `plan NN`, and `\b[A-Z]{3,}-\d{1,2}[a-z]?\b` — **0 planning references** in text files; every match is SVG path data (`OpenVAALogo.svelte:74-86`), an academic citation range (`publishers-guide/preparing/matching/+page.md:40,50,54,72`) or a PNG byte sequence, which is why `-I` is load-bearing. Hygiene gate **byte-identical** before and after all nine commits: `phase-ref` 660 occ / 235 files / **bare 11**, `spike-ref` 40/30/0, `task-id` 84/46, `milestone-ver` 43/30 — the `occ` columns checked, not only the gated `bare` ones, per 151-15's standing habit. **Complement, and it is large: `yarn lint:check` does not reach this slice at all.** `apps/docs/package.json` defines `lint:local` and `lint:full` but **no `lint` task**, so `turbo run lint` skips the workspace silently — asserted, not assumed (`'lint' in scripts` → **false**). |
| **4** | Avoid `any`; document or `@ts-expect-error` | **MET** | Exhaustive: `git grep -nw 'any'` over the slice's pathspec returns **0 occurrences in type position**, and `@ts-expect-error` / `@ts-ignore` are **0 / 0**. Real result rather than absent surface: the slice contains six TypeScript build scripts plus `navigation.config.ts` and `docs-scripts.config.ts`. **Complement: `lint:check` could not have proven this either** — see item 3; the workspace has no `lint` task, so `no-explicit-any` never runs over it. The proof is the grep, not the gate. |
| **5** | No repeated code in the PR or elsewhere in the repo | **DEFERRED** | A real, structural duplication, deferred because its remedy is broken rather than because it is small. **98 of the slice's 151 files are generated component pages** under `developers-guide/frontend/components/generated/`, one per component, sharing one template — duplication by construction, and correct as long as the generator is the source of truth. It is not currently reachable: **5 of the 7 root `docs:*` scripts call workspace scripts that do not exist** (F-79) — `yarn docs:generate` → `Couldn't find a script named "generate"`, `yarn docs:routes` → `"generate:routes"`, run and quoted rather than reasoned about. So the 98 pages cannot be regenerated from the documented entry points, which is also the mechanism behind F-64's staleness. Pre-existing at `origin/main` in identical form, therefore outside D-05's fix bar and recorded with its exact remedy instead. |
| **6** | New components / functions / entities documented | **MET** | The slice adds exactly **2** files and both are prose — `ROADMAP.md` (169 lines, new on the branch: absent at `origin/main` **and** at `C1`, asserted by `ls-tree`) and `docs/key-generation.md` (144 lines). No new exported entity, component or function ships in this slice, so the item's trigger is a real negative rather than an omission. The two build-script docblocks that *were* wrong are fixed under item 7. |
| **7** | Repo documentation markdown updated | **FIXED** | **This is the cell where items 7 and 15 are discharged phase-wide; the reconciled list is the section below and is the evidence half of this cell.** 9 fixes landed, 1 cross-slice landing recorded, 3 terminal deferrals. Headline numbers: **273** stale `blob/main/frontend/…` permalinks across **117** files repointed (**`b510aafb4`**), **48** references to `apps/strapi` — a path that has never existed at either end of this stack — restored to `backend/vaa-strapi` across 15 files (**`9c359cd11`**), the workspace inventory corrected against `yarn workspaces list --json` (**`e2fa2c31c`**), and `ROADMAP.md` plus the two `apps/docs/scripts` docblocks corrected (**`6ce42e930`**). **Cross-slice landing:** `.agents/code-review-checklist.md`'s four stale guide links are fixed in **`debdfdec2`** but **ship in slice 11**, because `.agents` is slice 11's pathspec — a slice-09 reviewer will not see them, and this is where that is said. **Verification is a second method, not the fix's own grep:** the docs app's own link validator reports `Files scanned 191, Internal links 166, Broken links 0`. |
| **8** | Tracking events for new user-facing functions | **NOT-SWEPT** | `n/a — no applicable surface in this slice.` The docs site has no tracking layer: `startEvent(` over the whole pathspec → **0**, and the `TrackingEventName` union that gates the frontend's events lives in slice 06. The slice adds no user-facing application function; it adds documentation. |
| **9** | New Svelte components follow the guidelines | **NOT-SWEPT** | `n/a — no new Svelte component in this slice.` The slice's 2 added files are both markdown; the docs app's 16 `.svelte` files are all pre-existing and only 2 are modified (`+page.svelte`, `lib/components/Header.svelte`). Both were checked rather than waved through: **0** `svelte/store` imports anywhere in `apps/docs`, and the app is deliberately on a different Svelte version from the frontend — which is *why* `.prettierignore` excludes it from the root prettier run, comment included — so the Svelte 5 rune rules in `CLAUDE.md` do not apply to it. Claiming `MET` here would be claiming conformance to a guideline that does not govern the file. |
| **10** | Errors handled and logged | **MET** | The slice's error surface is six build scripts, and it is real: **16 `catch` blocks across 8 files** (`generate-all-docs-and-validate.ts` 2, `generate-component-docs.ts` 3, `generate-navigation-config.ts` 2, `generate-route-map.ts` 1, `move-generated.ts` 2, `utils/links.ts` 4, `utils/routes.ts` 1, `validate-links.ts` 1) and **65 `console.*` calls**, which in a CLI are the reporting channel rather than debug residue — the opposite of slice 07's F-68, and the distinction is the surface, not the count. Executable evidence: `yarn workspace @openvaa/docs validate:links` runs to completion and reports its result set explicitly (`Broken links: 0`). **Complement:** none of this is exercised by any gate — `test:unit` for this workspace is `vitest run --passWithNoTests`, an **empty pass**, and `test:e2e` is a bare `playwright test` over **0 spec files** (`git ls-files 'apps/docs/tests' '**/*.spec.ts'` → 0). Three of the workspace's four test-shaped scripts assert nothing. |
| **13** | WCAG A and AA | **MET** | Enumerated over the whole docs app rather than the diff, because the app is one rendering surface: `<img>` **13**, of which **13 carry `alt`** — checked per file (`+page.svelte` 5/5, `publishers-guide/preparing/matching` 2/2, `the-voter-see-when-using` 4/4, `the-specifics-of-the-elections` 1/1, `what-other-information-is-collected` 1/1), so the difference is **0**. Positive `tabindex` **0**; non-semantic interactive elements (`<div>`/`<span>`/`<li>` with a click handler) **0**; `autofocus` **0** in code (both matches are prose inside a generated component page); `svelte-ignore` directives **0**, so nothing is suppressed. ARIA attributes are present in 7 of the app's components. **Complement, and it is total: no automated accessibility gate reaches this slice.** `assertAxeScan`'s route table is the frontend's five URLs; the docs site is in no scan, has no E2E spec, and its `test:unit` is an empty pass. This cell is a static hand sweep over an enumerated class list and says so. |
| **14** | Keyboard + screen-reader usable | **DEFERRED** | The reason is the complement above, stated as a verdict rather than hidden in one: **the docs site has no keyboard or screen-reader coverage of any kind — no axe scan, no E2E spec, no unit test that renders a component.** The static classes that *predict* keyboard trouble are all clean (0 positive tabindex, 0 non-semantic handlers, 0 `autofocus`, 0 suppressions), and the two modified components were read, but no path was traversed. **DEFERRED rather than MET because authoring the first spec for this workspace is net-new test authorship, which D-13 excludes**, and because one measured absence of bad signals is not a pass. |
| **15** | Developers'/Publishers' Guide entries updated | **FIXED** | The item's whole target set is this slice, and it is discharged in the reconciled list below. Four sites where a guide named a **script that no longer exists** are corrected against `CLAUDE.md` § Database & Stack Commands and the root `package.json`'s actual script list — `yarn dev:down` / `yarn dev:stop` (3 sites) → `yarn db:stop` / `yarn db:reset`, `yarn build:app-shared` → `yarn build --filter=@openvaa/app-shared`, `yarn prod` → the command that `docker-compose.dev.yml`'s own header documents — plus the paragraph that described the dev stack as Docker images for "frontend, backend and DB", which stopped being true when v0.2 replaced it with local Supabase (**`7cebe7baa`**). The workspace inventory routed here by 151-09 and 151-14 is corrected (**`e2fa2c31c`**). **Deferred residue, named rather than implied:** the eleven legacy backend pages keep v0.2's own "documents the legacy Strapi backend" banner as their disposition, and **12 permalink targets no longer exist at all** (F-80). |

### Slice 10 — general items (12 cells)

| # | Item | Verdict | Evidence |
|---|---|---|---|
| **2** | OWASP Top 10 | **MET** | Swept as *supply chain and CI*, which is what a plumbing slice's threat surface is. **Workflow injection: 0.** No workflow uses `pull_request_target` (asserted over all six). Every one of the **13** user-controlled `github.event.*` values in `claude.yml` is passed through `env:` (`:36-40`, `:82-90`) rather than interpolated into a `run:` body — the documented anti-injection shape, and it is the pre-existing files that get this right, so the cell credits them rather than the plan. **Secrets: 10 `secrets.*` references** across the six workflows (`ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `TURBO_TOKEN`), none echoed, none written to an artifact. **`release.yml` (new in this slice) publishes to npm with no npm token anywhere in the tree** — `permissions: id-token: write`, `registry-url: https://registry.npmjs.org`, `NPM_CONFIG_PROVENANCE: true` and `changesets/action@v1`. That is **npm trusted publishing (OIDC)**, and it matches the project's own recorded decision to use trusted publishing instead of an `NPM_TOKEN`; it is **deliberate, and must not be "fixed" by adding a token**. `.changeset/config.json` sets `"access": "public"`, consistent with it. **Secret-shaped literals across `.env.example`, `render.example.yaml`, both compose files and all of `.github/`: 0.** |
| **3** | Follows the Code style guide | **MET** | The slice is configuration, YAML and one vendored yarn release; the style surface is the gates, and both are unchanged from `151-BASELINE.md` under forced, uncached runs: `yarn lint:check` **0 errors / 20 warnings** (11/11 tasks, 0 cached; per-package 2 + 15 + 1 + 2, the baseline's exact split) and `yarn format:check` **red on exactly the two PD-03-fenced files**. **The warning count is not reduced** — F-39's rule — and was verified by counting per package rather than by reading a summary line. F-44's three blind-spot patterns over the slice: **0 planning references** (the only matches are `yarn.lock`, excluded, and PNG bytes). |
| **4** | Avoid `any`; document or `@ts-expect-error` | **MET** | `git grep -nw 'any'` over all 39 files, every file type: **0 occurrences**, in type position or otherwise. `@ts-expect-error` / `@ts-ignore`: **0 / 0**. |
| **5** | No repeated code in the PR or elsewhere in the repo | **DEFERRED** | Four dead-code findings sit in this slice and **none can be fixed here**, for two different reasons that must not be collapsed. **Blocked by F-15, the operator gate:** `apps/frontend/jest.config.json` (F-01 — jest is a dependency of nothing, the file is referenced by nothing) and the **89 orphaned Capacitor files** under `apps/frontend/{android,ios}` (F-10 — `capacitor.config.ts` is deleted by this very slice, `@capacitor/*` is in no `package.json`, `yarn.lock` has 0 capacitor entries, and the only `@capacitor` references in the tree are inside the orphaned scaffolding itself: `android/capacitor.settings.gradle`, `ios/App/Podfile`). **No pathspec claims those paths**, so a deletion would land in the catch-all and break criterion 7 — see the F-15 decision package below. **Shipping by the operator-approved framing:** the two dead one-shot codemods (F-03) and the tracked `tsconfig.tsbuildinfo` (F-08) are *in* this slice's diff and could be deleted, but the manifest's approved slice-10 justification names all three explicitly as this slice's contested-but-justified files and instructs the plan that writes its PR body to defend them to a cold reviewer. Deleting them would contradict the approval it is the operator's to change. **Recorded, with the obligation restated for 151-17.** **Updated after the operator accepted F-15 Options 1 and 2:** F-01 and F-10 are **FIXED** in `6c40fb57b` — 89 orphans plus the jest config deleted, and the two now-pointless anonymous-volume exclusions dropped from `apps/frontend/docker-compose.dev.yml`; `git ls-files apps/frontend/android apps/frontend/ios apps/frontend/jest.config.json` → **0**, `capacitor` (word, case-insensitive) over the tree excluding vendored files → **0**. F-03 and F-08 remain **DEFERRED** by the approved framing. The cell therefore reads FIXED with its residue named rather than averaged. |
| **6** | New components / functions / entities documented | **DEFERRED** | Nine files are added and the documentation is uneven in a way worth naming rather than averaging. Well documented: `main.yaml`'s new jobs carry substantial rationale comments — `:115-137` explains why `dev-seed-integration` is a separate job with deliberately **no** `paths-filter` and names the incident that caused it, `:178-180` why the connection details are read off the running instance, `:261-276` why visual regression is opt-in at the Playwright level but blocking in CI. Not documented: **`.github/workflows/release.yml` ships with no comment at all** — a new publish-to-npm workflow whose OIDC trusted-publishing mechanism is the least obvious thing in the slice and the one a reviewer is most likely to misread as a missing token; and **`.bg-shell/manifest.json` is the two-byte literal `[]`, referenced by nothing in the tree** (`git grep -ln 'bg-shell'` outside `.planning`/`.claude` → 0 hits) and not gitignored (F-81). Neither is fixed: a docblock for `release.yml` is worth writing but is the kind of addition a reviewer should see attributed to the author, and deleting a manifest whose owning tool cannot be identified from the repository is not an agent's call. |
| **7** | Repo documentation markdown updated | **FIXED** | Three dead documentation links, all found **from the target tree** because all three files are byte-identical across the layout move and appear in **no** slice's diff — the standing instruction's exact case, and the third slice in a row where it produced real findings. `.github/PULL_REQUEST_TEMPLATE:9,19` pointed at `docs/contributing/self-review.md` and `docs/contributing/CONTRIBUTING.md`, **neither of which exists at either end of this stack** (`ls-tree -r origin/main` → absent), so this is pre-existing drift rather than a v0.2 regression; repointed at the live guide pages, with the target anchors verified to exist (`contributing/pull-request/+page.md:17` `### Self-review`, `contributing/contribute/+page.md:9` `### Commit your update`). `.github/workflows/claude-solve-issue.yml:55` instructed the agent to follow `docs/code-review-checklist.md`; the checklist is at `.agents/code-review-checklist.md`. Commit **`3fa38158b`**. |
| **8** | Tracking events for new user-facing functions | **NOT-SWEPT** | `n/a — no applicable surface in this slice.` The slice adds no function available to a user; it is build, lint, CI, container and release configuration. |
| **9** | New Svelte components follow the guidelines | **NOT-SWEPT** | `n/a — no applicable surface in this slice.` **0** `.svelte` files among the 39. |
| **10** | Errors handled and logged | **MET** | The slice's error handling is CI's, and it is deliberately fail-loud in the two places that matter. `main.yaml:187-188` guards both values it exports with `test -n "$API_URL" \|\| { echo "::error::API_URL missing from supabase status"; exit 1; }` rather than exporting an empty string and failing confusingly later. `:143-147` sets `DEV_SEED_INTEGRATION_REQUIRED: "1"` **so that losing the Supabase wiring turns the job red instead of silently reverting to a green skip** — a guard against the exact fake-green the job was created to fix, and its comment says so. Every `supabase stop` carries `if: always()`. **Complement: none of this is verifiable from here** — these jobs do not exist at any *published* head of this stack (see the phase-level contribution below), so their first real execution is after slice 10 merges. |
| **13** | WCAG A and AA | **NOT-SWEPT** | `n/a — no applicable surface in this slice.` No rendered surface: 0 `.svelte`, 0 `.html`, 0 markdown pages served to a user. |
| **14** | Keyboard + screen-reader usable | **NOT-SWEPT** | `n/a — no applicable surface in this slice.` Same reason. |
| **15** | Developers'/Publishers' Guide entries updated | **FIXED** | The guide entries that document **this** slice's subject matter were corrected — and the fixes land in **slice 09's** files, which is the cross-slice landing this cell exists to record so that neither reviewer thinks the other saw it. `developers-guide/deployment/+page.md` documented `yarn prod` and a backend container for a stack that now has neither; it now names `docker compose -f docker-compose.dev.yml up --build`, the command **this slice's own compose file** documents in its header, and `yarn db:start` as its prerequisite. `development/running-the-development-environment/+page.md` described the dev stack as Docker images for frontend, backend and DB; it now describes what `package.json`'s `dev` script in **this slice** actually does. `troubleshooting/+page.md` named `yarn dev:down` / `yarn dev:stop` / `yarn build:app-shared`, none of which is in this slice's `package.json`. All in **`7cebe7baa`**, inside slice 09's diff. |

### The reconciled item 7 and item 15 list — discharged here, phase-wide

**This is the terminal list.** Items 7 and 15 have accumulated cross-slice landings since 151-09;
every one is collected here with the enumerated stale-path set, and **no entry is left without a
verdict.** This is the last slice in which they can be discharged, and the acceptance criterion is
completeness, not cleanliness.

| # | Target | Occ | Source | Verdict | Where it landed / why not |
|---|---|---:|---|---|---|
| 1 | `blob/main/frontend/…` permalinks in `apps/docs/` | **273** in **117** files | F-64 (151-14), specifics added by 151-15 | **FIXED** | `b510aafb4`. 240 of the 252 distinct targets resolve after the `apps/` prefix. |
| 2 | `apps/strapi/…`, a path that never existed | **48** in **15** files | **F-77, new this plan** | **FIXED** | `9c359cd11`. Restored to `backend/vaa-strapi/…`. Same defect shape as F-16. |
| 3 | Workspace inventory: 2 dead entries, 4 missing workspaces | 6 | 151-09 (F-15 note), 151-14 | **FIXED** | `e2fa2c31c`. Verified by set difference against `yarn workspaces list --json`. |
| 4 | `ROADMAP.md:28,135` — `docs/src/routes` | 2 | F-04 | **FIXED** | `6ce42e930`. |
| 5 | `apps/docs/scripts/{generate-navigation-config,validate-links}.ts:6` | 2 | F-04 rows 3–4 | **FIXED** | `6ce42e930`, in the workspace-relative form § 3.1 recommended. |
| 6 | `.agents/code-review-checklist.md:7,13,19,20` | 5 | F-04 row 1 + § 3.1a | **FIXED — cross-slice** | `debdfdec2`, **ships in slice 11** (`.agents` is slice 11's pathspec). Recorded in slice 09's cell 7. |
| 7 | `.github/PULL_REQUEST_TEMPLATE:9,19` | 2 | new this plan (F-84) | **FIXED** | `3fa38158b`, ships in **slice 10**. Pre-existing at both ends. |
| 8 | `.github/workflows/claude-solve-issue.yml:55` | 1 | new this plan (F-84) | **FIXED** | `3fa38158b`, ships in **slice 10**. |
| 9 | `troubleshooting/+page.md:27` — `docs/docker-setup-guide.md` | 1 | new this plan | **FIXED** | `b510aafb4`; repointed at the in-site `/developers-guide/development/requirements` route, the target the same repo already uses. |
| 10 | `tree/main/{frontend,docs}` references | 2 | new this plan | **FIXED** | `b510aafb4`. The i18n one needed a semantic re-target (`src/lib/i18n/translations` → `messages/`), not a prefix. |
| 11 | Four guides naming removed yarn scripts | 6 sites | new this plan | **FIXED** | `7cebe7baa`. |
| 12 | `packages/app-shared/src/settings/README.md:5,6` | 2 | F-04 row 13 | **DEFERRED** | **Its owning slice 02 is PUBLISHED as PR #865.** A fix would reach no slice — slice 02 is cut, and no later pathspec claims the file — so it would land in the catch-all and break criterion 7, and re-cutting means force-pushing a PR under review, which the phase forbids. Routed to 151-18 / post-merge. |
| 13 | `README.md:12` — the repo's front-page mascot image | 1 | F-15 (151-09) | **FIXED** | `aad244085`, ships in **slice 09**. Unblocked by the operator accepting F-15 Option 1; `README.md` is now claimed by slice 09's pathspec. |
| 14 | 12 permalink targets that no longer exist | 12 distinct, 9 pages | **F-80, new this plan** | **DEFERRED** | Each needs a semantic re-target, not a prefix, and several of the carrying pages are themselves legacy-banner-marked. Enumerated below so no later plan re-derives them. |
| 15 | 11 legacy backend / Strapi pages | 11 pages | v0.2's own choice | **DEFERRED — by v0.2's recorded banner** | Each carries "documents the legacy Strapi backend which has been replaced by Supabase. Content will be updated in a future release." That is a documented deferral with an owner, not silence. Recorded as a verdict so the reader can disagree with it. |
| 16 | 8 `backend/vaa-strapi/…` targets dead at `origin/main` too | 8 distinct | new this plan | **DEFERRED — pre-existing** | e.g. `src/util/acl.ts`, `src/extensions/users-permissions/strapi-server.js` (the real file is `.ts`), `…/adminsrc/components/*.tsx` (real path `admin/src`). Dead **before** v0.2, so outside the phase's net-diff boundary. |
| 17 | 5 broken root `docs:*` scripts | 5 | **F-79, new this plan** | **DEFERRED — pre-existing** | Identical at `origin/main`, and two (`generate:typedoc`, `generate:typedoc-frontend`) have **no** correct target in `apps/docs/package.json`, so the fix is not mechanical. Load-bearing context for entry 1: it is why the generated pages were never regenerated. |

> **A correction to F-04 that a later plan would otherwise re-derive wrongly, and it changes the
> acceptance command.** F-04 is recorded as **13 files / 20 occurrences** of `docs/src/routes`. That
> count is a **substring artefact**: `git grep -F 'docs/src/routes'` also matches the *correct*
> `apps/docs/src/routes`, and **8 of the 13 files were already correct** — 151-14's F-57 repaired
> them. Measured with a negative lookbehind, `git grep -P '(?<!apps/)docs/src/routes'`, the genuinely
> stale set is **5 files / 11 occurrences**, and after this plan it is **1 file / 2 occurrences**
> (entry 12, deferred). **The plan's acceptance criterion as written — that
> `git grep -l -F 'docs/src/routes'` return only deferred paths — is unsatisfiable on a correct tree,
> because the correct path contains the stale one as a substring.** The `-P` form is the assertion;
> the `-F` form is the twelfth self-consistent-and-wrong measurement this phase has caught.

**The 12 dead permalink targets (F-80), enumerated with their carrying pages:** `frontend/data`
(`frontend/data-api`), `src/lib/api/adapters/strapi` + `…/dataProvider/strapiDataProvider.ts` +
`…/strapiData.type.ts` (`configuration/app-customization`, `configuration/app-settings`,
`frontend/data-api`), `src/lib/components/icon/base/IconBase.{svelte,type.ts}`
(`contributing/code-style-guide`), `src/lib/components/passwordValidator/PasswordValidator.svelte`
and `src/routes/candidate/{password-reset/PasswordResetPage,register/PasswordSetPage}.svelte`
(`candidate-user-management/password-validation`), `src/lib/contexts/app/getRoute.ts`
(`frontend/routing`), `src/lib/stores/stores.ts` (`configuration/app-settings`),
`src/lib/utils/authenticationStore.ts` (`candidate-user-management/registration-process-in-strapi`).
**All 12 are in hand-authored pages; the 98 generated pages rewrite cleanly.** They were dead in
both directions — `blob/main/frontend/…` resolves on `main` **today** and stops resolving the moment
v0.2 merges, because v0.2 both moves the tree and deletes these files — so the prefix rewrite makes
nothing worse and the residue is a content question, not a path question.

### Findings queued by this sweep

| ID | Verdict | Item(s) | Finding | Landing |
|---|---|---|---|---|
| **F-77** | FIXED `9c359cd11` | 7, 15 | 48 references across 15 `apps/docs/` pages to `apps/strapi/`, a path that has never existed at either end of this stack. v0.2 rewrote the Strapi source links instead of retiring them with the tree — the same defect as F-16, from the same blanket rewrite. | slice 09 |
| **F-78** | FIXED `d6f2a8d3e` | 2, 3 | The docs landing page's external anchor carried no `rel`, and the D-22-merged block's one-space indentation made the docs workspace's own `format:check` red at `HEAD`. | slice 09 |
| **F-79** | DEFERRED — pre-existing | 5, 7 | 5 of the 7 root `docs:*` scripts call workspace scripts that do not exist; two have no correct target at all. Run, not reasoned: `yarn docs:generate` → `Couldn't find a script named "generate"`. This is why F-64's generated pages were never regenerated. | 151-18 / later phase |
| **F-80** | DEFERRED | 7, 15 | 12 distinct permalink targets across 9 hand-authored docs pages point at files v0.2 deleted; each needs a semantic re-target rather than a path prefix. Enumerated above. | 151-18 / later phase |
| **F-81** | DEFERRED | 5, 6 | `.bg-shell/manifest.json` — the literal `[]`, newly tracked by v0.2, referenced by nothing in the tree, not gitignored. Deleting a manifest whose owning tool cannot be identified from the repository is not an agent's call. | 151-17 / operator |
| **F-82** | FIXED `d6f2a8d3e` (the file); recorded (the gate) | 3, 11 | Root `format:check` is `prettier --check . && yarn workspace @openvaa/docs format:check`, so it **short-circuits** on the two PD-03-fenced files and **the docs workspace's own format check has never run in this phase.** It was red. `151-BASELINE.md`'s "red on exactly 2 files" is true of the first half only. | gate reach |
| **F-83** | DEFERRED → gate design | 3, 4, 12 | `yarn lint:check` does not reach `apps/docs` at all: the workspace defines `lint:local` and `lint:full` but no `lint` task, so `turbo run lint` skips it silently. Its `test:unit` is `vitest run --passWithNoTests` and its `test:e2e` is a bare `playwright test` over 0 spec files. **Three of the workspace's four test-shaped scripts assert nothing.** | 151-19 / later phase |
| **F-84** | FIXED `3fa38158b` | 7 | Three dead documentation links under `.github/` — two in `PULL_REQUEST_TEMPLATE`, one telling an agent to read a checklist at a path it does not occupy. All three files byte-identical across the move, so in no slice's diff. | slice 10 |
| **F-85** | CORRECTION, not a defect | 7 | F-04's "13 files / 20 occurrences" is a substring artefact; 8 of the 13 were already correct. The genuinely stale set was 5 files / 11 occurrences, and the plan's acceptance grep cannot express it. | record |
| **F-86** | DEFERRED — pre-existing | 3, 5 | Root `package.json` declares `"engine"` (singular), not `"engines"`, so its Node/yarn floor is **inert** — no package manager reads that key. Pre-existing at `origin/main`, but **v0.2 edits its values** (`node: 20.18.1 → >=22`, `yarn: 4.6 → 4.13`), so a slice-10 reviewer sees the block and would reasonably assume it is enforced. Not fixed here: activating it changes install behaviour for every contributor and every CI job, which is a decision rather than a typo fix. | 151-17 / operator |

### Evidence contributed to the phase-level cells (which stay `PENDING→18`)

- **Item 11 (failing checks).** **Slice 10 is where the CI story changes, and it was verified rather
  than inherited.** `main.yaml` at the branch tip defines **six** jobs — `skill-drift-check`,
  `frontend-and-shared-module-validation`, `supabase-tests`, `dev-seed-integration`, `e2e-tests`,
  `e2e-visual` — on **Yarn 4.13 / Node 22.22.1**, where `origin/main`'s version (blob `c2fdcedb2`,
  byte-identical at every published head) defines **three** on Yarn 4.6. So `skill-drift-check`,
  `supabase-tests`, `dev-seed-integration` and `e2e-visual` **arrive with this slice**, and research's
  Pitfall 7 stays refuted for every head published so far. **The `Setup Yarn 4.6` signature also stops
  being true at this slice**, because the step is named `Setup Yarn 4.13` here and the root
  `package.json` fix that ends the `YN0028` failure is in this slice's diff. Neither slice 09's nor
  slice 10's PR can demonstrate any of this: their bases are sibling branches, so
  `main.yaml`'s `pull_request: branches: [main]` trigger does not fire.
- **Item 12 (shared-dependency blast radius).** **The workspace globs resolve every workspace, proved
  by set comparison in both directions rather than by a count.** `git ls-files 'apps/*/package.json'
  'packages/*/package.json'` gives **15**; `yarn workspaces list --json` resolves **15** named
  workspaces plus the root; the symmetric difference of the two sets is **empty** — nothing tracked is
  unresolved and nothing resolved is untracked. And **no tracked `package.json` lies outside the two
  globs' depth** (`git ls-files '*/package.json'` minus `(apps|packages)/*/package.json` → 0), so the
  globs cannot be silently missing a nested workspace. This is threat T-151-16-02 discharged: the
  claim must be **false at the base and true at the target**, and both halves are now measured — at
  `origin/main` the same key reads `['packages/*', 'backend/vaa-strapi', 'backend/vaa-strapi/src/plugins/*', 'frontend', 'docs']`,
  three of whose five entries the stack invalidates. `turbo.json` (new in this slice) declares
  `build: dependsOn ['^build']`, `test:unit: dependsOn ['build'], cache: false` and topological
  `lint`/`typecheck`, which is what makes `yarn build` 14/14 ordered correctly.
- **Item 16 (history).** Nine commits, all conventional, all scoped `(151-16)`.

### The per-slice deltas, attributed by set difference

**Slice 09: 39 → 151 files, +519 → +776, −97 → −346. Slice 10: 37 → 39, +8,661 → +8,664,
−25,535 → −25,538.** Established with `comm` over the two `diff --name-only --no-renames` sets, not
by subtraction. **Entered: 112 and 2. Left: 0 and 0.**

| Slice | Entrants | Attribution |
|---|---:|---|
| 09 | **112** | **98** generated component pages + **12** hand-authored pages (the localization set, `frontend/{styling,routing,environmental-variables,contexts,components}`, `contributing/code-style-guide`, `auto-documentation`, the publishers-guide languages page) + **2** build scripts — every one entering because a fix put it in the diff, which is D-04 working. |
| 10 | **2** | `.github/PULL_REQUEST_TEMPLATE` and `.github/workflows/claude-solve-issue.yml`, both members of the dropped-finding class until F-84's fix put them in the diff. |

**Slice 09 is now 151 files rather than 39, and that is a fourfold growth of an operator-approved
row.** Two things bound it: the **pathspec is unchanged**, so the approved partition is untouched and
no other slice's cell moves; and 151 files with 1,122 changed lines is inside both GitHub render
budgets (~300 files, 20,000 lines), so the row's `ok` render flag still holds. It is the same
mechanism as slice 02's +45 lines and slice 03's +1 file, at a larger scale, and the PR body states
it rather than letting a reviewer discover a table that says 39.

**Rename detection changes nothing for either slice, measured rather than assumed.**
`git diff -M --shortstat` returns **151 / +776 / −346** and **39 / +8,664 / −25,538** — identical to
the `--no-renames` figures, because slice 09 is `2 A / 149 M` and slice 10 is `9 A / 4 D / 26 M` with
no add/delete pair that could pair up. 151-15's standing instruction still applies to the *bodies*:
both numbers are stated and reconciled, and here the reconciliation is that they coincide.

### The standing sum-check

| check | result |
|---|---|
| comparable total (`diff --no-renames C1..TARGET`) | **4,413** |
| Σ per-slice `files=` over all eleven pathspec rows | 252 + 97 + 119 + 162 + 195 + 533 + 214 + 330 + **151** + **39** + 2,321 = **4,413** |
| **gap** | **0** |
| rise from 151-15's 4,296, attributed by set difference | **+117, every one named, zero leaving.** +3 into slice 11 before this plan touched anything (`151-15-SUMMARY.md`, `pr-bodies/06.md`, `pr-bodies/07.md`, all `.planning/` files riding slice 11: 2,318 → 2,321), then +112 into slice 09 and +2 into slice 10 from this plan's fixes. |
| slice 08 needs no re-cut | asserted **before** any cut, as 151-15 did: `diff --no-renames ship/v0.2-akita-08-i18n-messages..TARGET -- apps/frontend/messages` → **0 files**. None of this plan's nine fixes touches `apps/frontend/messages`. |
| `git status --porcelain` | empty after every commit; `HEAD` never left `feat-gsd-roadmap` |

### Gate verdicts after this plan's fixes — measured, not assumed

| Gate | Baseline | After | |
|---|---|---|---|
| `yarn lint:check` | 0 errors / 20 warnings | **0 errors / 20 warnings** — counted per package (2 core + 15 dev-seed + 1 frontend + 2 tests), 11/11 tasks, **0 cached** under `TURBO_FORCE=1` | unchanged |
| `yarn format:check` | red on exactly 2 | **red on exactly the same 2** PD-03-fenced files, under `TURBO_FORCE=1` | unchanged |
| `yarn workspace @openvaa/docs format:check` | **not in the baseline** (F-82) | **red at `HEAD` → green** | improved |
| `yarn workspace @openvaa/docs build` | not in the baseline | **succeeds**, adapter-static wrote the site | new evidence |
| `yarn workspace @openvaa/docs validate:links` | not in the baseline | **191 files scanned, 166 internal links, 0 broken, 0 fixed** | new evidence |
| hygiene gate | 2 approved KEEP rows | **identical**: `phase-ref` 660/235/bare 11, `task-id` 84/46, `spike-ref` 40/30/0, `milestone-ver` 43/30 | unchanged |
| `yarn test:unit`, `yarn build` | 1,522 / 149 files; 14/14 | **not re-run.** No fix touches any file under `packages/` or `apps/frontend/src`, and `apps/docs` contributes an empty `--passWithNoTests`. Stated rather than claimed. | — |
| `yarn db:lint:sql` | red (F-21) | **not re-run** — known-F-21, pending an operator decision at 151-17 | — |
| `yarn test:e2e` | **not run all phase** | **not run.** D-24 pays this once at 151-18 against the post-sweep tip. Per `CLAUDE.md` a did-not-run E2E test counts as a failure, so **no green suite is claimed for either slice.** | — |

`e2e_collisions` stays **0** and `migrations_added` stays **0**: no fix touched a spec, a fixture or a
migration.

---

## F-15 — the operator decision, PREPARED AND NOT TAKEN

**Plan 151-16 was told to prepare this decision and stop. `slices.tsv` is unedited; nothing below has
been applied.** The gate exists because the remedy edits an operator-approved partition, and this
record's own rule is that no agent may create a waiver unilaterally.

### The mechanism, in one paragraph

`scripts/build-slice.sh` derives each slice as `PARENT..TARGET` **restricted to a pathspec**. A
`TARGET`-side change to a path that **no** pathspec claims therefore enters **no** slice: it lands in
the remaining-slices catch-all, which must be `files=0`, and the stack stops reproducing the target
tree — criterion 7. So an unclaimed file cannot be *fixed* at all, however trivial the fix, until some
slice claims it. **120 files are in that state** (re-derived above by a second method).

### What is actually at stake — three concrete items, decidable separately

| | Item | Cost of doing nothing |
|---|---|---|
| **A** | **`README.md:12` — the repository's front-page image is broken.** It renders `<img … src="./docs/static/images/shiba-inu-facing-front.png">`. That path **does not exist** at `TARGET` (`git cat-file -e` fails); the blob is at `apps/docs/static/images/shiba-inu-facing-front.png` (exists, asserted). The v1.1 layout move broke it. `README.md` is byte-identical at both ends, so **it is in no slice's diff**, and claimed by no pathspec, so **it cannot be fixed**. | The repo's front page ships with a broken image — the first thing a visitor sees. Contrast the D-22 row above, where the *same* class of relocation did **not** break its reference and this record verified it; this is the case where it did. |
| **B** | **F-10 / F-01 — 89 orphaned Capacitor files plus a dead jest config.** `apps/frontend/{android,ios}` = **89 tracked files** (55 + 34; **48 of them binary**, 1,715 text lines). `capacitor.config.ts` is **deleted by slice 10**. `@capacitor/*` is in **no** `package.json`; `yarn.lock` has **0** capacitor entries; the only `@capacitor` strings in the whole tree are inside the orphaned scaffolding itself (`android/capacitor.settings.gradle`, `ios/App/Podfile`). `apps/frontend/jest.config.json` is 96 bytes and referenced by nothing; jest is a dependency of nothing. | **A slice-10 reviewer sees `capacitor.config.ts` deleted and would reasonably conclude the removal is complete.** The 89 orphans are invisible to them, and to every other reviewer in the stack. The repo ships a dead native-app scaffold and a config for a test runner it does not use. |
| **C** | **The class.** 1,202 files are invisible to review; **120** are claimed by no pathspec at all, now enumerated file for file. | Anything wrong in those 120 is unfixable inside this stack and unseen by every reviewer of it. A, B and entry 12 of the reconciled list are the three instances this phase actually found. |

### Option 1 — claim `README.md` into slice 09 and fix it (item A)

**The `slices.tsv` edit, verbatim.** Row `09`, column 4 only:

```
apps/docs docs ROADMAP.md
```
becomes
```
apps/docs docs ROADMAP.md README.md
```

| Consequence | Value |
|---|---|
| slice 09 file count | 151 → **152** (`2 A / 150 M`) — `README.md` exists identically at both ends, so it enters as `M` once the fix lands: +1 / −1 line |
| render budget | 152 files, ~1,124 changed lines — **inside both** (~300 files, 20,000 lines). No flag changes. |
| any other slice's cell | **none.** `README.md` is claimed by no pathspec today, so no already-cut slice's diff can contain it — asserted per-file, not inferred. |
| already-open PRs #863–#870 | **nothing needed. No force-push.** |
| byte-identity | preserved: the fix lands on `feat-gsd-roadmap` (the new `TARGET`) and slice 09 claims the path, so the change rides slice 09 and the catch-all stays `files=0`. |
| re-proof | the standing per-slice check, unchanged: cut, then catch-all `pathspec .` from the slice-10 commit, `Σ files == comparable total`, and `read-tree TIP` + catch-all → tree **must equal** `TARGET^{tree}`. Plus `scripts/verify-identity.sh` at 151-18. |
| cost | one script invocation; slices 09 and 10 are **uncut and unopened**. |

**Is `README.md` in slice 09's subject?** Its title is *"update the project documentation — the docs
site, the root roadmap and the key-generation guide"*. The root README is project documentation and
the image it points at lives in `apps/docs/static/`, so the file it depends on is already in this
slice. Criterion 6's test — *"does the title describe every file in it, without an 'and also'?"* —
passes if the subject line names the README, which it currently does not. **A subject amendment is
part of this option**, e.g. `…the docs site, the root README and roadmap, and the key-generation guide`.

### Option 2 — claim `apps/frontend/{android,ios,jest.config.json}` into slice 10 and delete them (item B)

**The `slices.tsv` edit, verbatim.** Row `10`, column 4, append three tokens to the existing 29:

```
… apps/frontend/vite.config.ts apps/frontend/vitest.config.ts
```
becomes
```
… apps/frontend/vite.config.ts apps/frontend/vitest.config.ts apps/frontend/android apps/frontend/ios apps/frontend/jest.config.json
```

| Consequence | Value |
|---|---|
| slice 10 file count | 39 → **129** (`9 A / 94 D / 26 M`) — 90 deletions enter |
| slice 10 line count | −25,538 → **≈ −27,253** (1,715 text lines; the 48 binaries contribute 0 lines and render as binary) |
| render budget | 129 files is inside the ~300 cap; the slice is **already over** the 20,000-line cap on `yarn.lock` alone, so the flag does not change — but it moves from 34,199 to ~35,900 changed lines. **No budget crosses that was not already crossed.** |
| any other slice's cell | **none.** `apps/frontend/android`, `apps/frontend/ios` and `apps/frontend/jest.config.json` are claimed by no pathspec today, and fall inside no already-cut slice's pathspec — slice 06 is `apps/frontend/src/lib`, slice 07 enumerates `src/` files, slice 04 claims one static image. Asserted per file. |
| already-open PRs #863–#870 | **nothing needed. No force-push.** |
| byte-identity | preserved, same mechanism as Option 1: the deletions ride slice 10. |
| re-proof | identical to Option 1, plus `git ls-files apps/frontend/android apps/frontend/ios apps/frontend/jest.config.json` → **0** at `TARGET`. |
| risk | **the only real one:** if anything outside the repository depends on the native scaffold (a Capacitor build performed from a developer machine, an app-store pipeline), deleting it is destructive in a way no in-repo measurement can see. Every in-repo signal says it is dead. |
| **claiming without deleting** | **changes nothing measurable.** These files are byte-identical at both ends, so adding them to a pathspec adds **0** files to the diff. Claiming is only worth doing if a fix follows. The same is true of `README.md`. |

### Option 3 — claim all 120 (rejected as prepared, stated for completeness)

Distributing the remaining 118 unclaimed files (`static/` 10, `tools/` 3, `tests/` 2, the six
`apps/frontend` dotfiles, and 11 root files including `LICENSE` and `.editorconfig`) across slices
would make the partition *total* rather than merely disjoint-and-tree-identical. It buys nothing this
phase can spend: their content is unchanged by v0.2, so every one of them would add **0** files to
every diff, and the review gap it closes is hypothetical until someone finds a defect in one. It also
touches slice boundaries a reviewer has already been shown. **Not recommended.** The one named
instance worth keeping visible is `apps/frontend/tools/translationKey/generateTranslationKeyType.ts`
(151-15): it generates slice 08's only automated gate from the *legacy* catalogue in slice 06, the two
agree at 598 = 598 today, and nothing enforces it.

### Option 4 — do nothing

Costs, stated plainly because "defer" reads as free: the repository ships with **a broken front-page
image** and **90 dead files that no reviewer in a twelve-PR review stack will ever see**, and the
phase's own record says so in three places. No further work is required.

### Recommendation

**Take Option 1 and Option 2. Decline Option 3.**

Both are cheap now and get monotonically more expensive: slices 09 and 10 are **uncut and unopened**,
so each is one `build-slice.sh` invocation, and **neither requires a force-push anywhere** — that was
asserted per file rather than assumed, and if any option had required one it would be off the table
without a fresh decision. Option 1 fixes a one-line defect on the repository's front page and costs
one file. Option 2 discharges the two findings this phase has carried since 151-06 as *blocked*, in
the slice whose subject is *"repo plumbing"* and whose diff already deletes the very config those 89
files exist to serve — which is the strongest argument for placing them there: the reviewer who sees
`capacitor.config.ts` deleted is exactly the reviewer who should see the scaffold go with it.

**If the operator declines Option 2 but accepts Option 1**, that is coherent — A is a defect and B is
dead weight, and they need not travel together. **If both are declined**, entries 13 and the F-10/F-01
rows become terminal `DEFERRED` verdicts with "operator declined at 151-16" as the rationale, and this
plan's disposition is complete either way.


### F-15 — the operator's decision, taken 2026-08-17

**Options 1 and 2 ACCEPTED; Option 3 DECLINED.** Recorded here because the whole point of the gate is
that an agent did not take it. `slices.tsv` was amended on that decision and on nothing else:

| row | column | before | after |
|---|---|---|---|
| `09` | 4 (pathspec) | `apps/docs docs ROADMAP.md` | `apps/docs docs ROADMAP.md README.md` |
| `09` | 3 (subject) | `…the docs site, the root roadmap and the key-generation guide` | `…the docs site, the root README and roadmap, and the key-generation guide` |
| `10` | 4 (pathspec) | 29 tokens, ending `apps/frontend/vitest.config.ts` | + `apps/frontend/android apps/frontend/ios apps/frontend/jest.config.json` |

The subject amendment is not cosmetic: criterion 6's test is *"does the title describe every file in
it, without an 'and also'?"*, and a slice whose pathspec claims `README.md` while its subject names
only the docs site and the roadmap would fail it on the file the operator just added.

**The residual risk on Option 2, stated rather than buried.** Every in-repo signal says the Capacitor
scaffold is dead — `@capacitor/*` in **no** `package.json`, **0** entries in `yarn.lock`, no source
import, and the only `@capacitor` strings anywhere were inside the scaffold itself
(`android/capacitor.settings.gradle`, `ios/App/Podfile`). **No in-repo measurement can see an
external Capacitor or app-store pipeline building from it.** The operator accepted the removal
knowing that. `pr-bodies/09.md` states it in those terms, so a cold reviewer who knows of such a
pipeline can object on the strength of the body alone.

| post-fix assertion | result |
|---|---|
| `git ls-files apps/frontend/android apps/frontend/ios apps/frontend/jest.config.json` | **0** |
| `capacitor` (word, case-insensitive) over the tree, excluding `yarn.lock` and `.yarn/` | **0** |
| `apps/frontend/(android\|ios)` referenced anywhere outside `.planning`/`.claude` | **0** — the two anonymous-volume exclusions in `apps/frontend/docker-compose.dev.yml` were the only references and are removed with the directories |
| README image target | `apps/docs/static/images/shiba-inu-facing-front.png` exists at `HEAD` and on disk |
| gates after both fixes, under `TURBO_FORCE=1` | `build` **14/14, 0 cached**; `test:unit` **1,522 tests / 149 files** (16+244+21+22+446+773 across 1+47+3+1+43+54), 21/21 tasks, 0 cached; `lint:check` **0 errors / 20 warnings**, 11/11, 0 cached; `format:check` **red on exactly the two PD-03 files**. Every one identical to `151-BASELINE.md`. |

**F-87, raised while verifying the deletion.** The residual-reference sweep's only surviving `jest`
match was inside **`apps/docs/tsconfig.tsbuildinfo`** — which means **F-08's tracked-build-artifact
finding is a class of three, not one**: `apps/frontend/tsconfig.tsbuildinfo` (slice 10, recorded),
`apps/docs/tsconfig.tsbuildinfo` (**slice 09**, byte-identical across the move so in no slice's diff
until now) and `packages/supabase-types/tsconfig.tsbuildinfo` (**slice 02, published as PR #865**).
Recorded, not fixed: the frontend one ships by the operator-approved slice-10 framing, and deleting
the other two would mean either contradicting that framing for no reason or touching a published
slice. Routed to 151-18 / post-merge.
