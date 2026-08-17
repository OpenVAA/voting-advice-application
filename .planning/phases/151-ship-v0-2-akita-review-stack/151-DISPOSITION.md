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
cells_filled: 30
cells_pending: 133
blank_cells: 0
db_slice: "03"
adapter_slice: "06"
migrations_added: 0
e2e_collisions: 0
dropped_finding_class_files: 842
invisible_to_review_files: 1202
unclaimed_by_any_pathspec: 120
comparable_total: 4274
slices_dispositioned: ["01a", "01b", "02"]
findings_total: 17
status: in-progress
approval: pending
---

# Phase 151 — Checklist Disposition Matrix

**Created:** 2026-08-17
**Phase:** 151 — Ship the v0.2 Akita review stack
**Plan:** 06 (scaffold + phase-level rows). Cells are filled by plans 151-09 … 151-18.
**Status:** 🟡 **IN PROGRESS — approval gate NOT reached.** `cells_filled: 30` of 163, after plan
151-09 dispositioned slices **01a**, **01b** and **02** (36 cells; 6 of them hold `PENDING→09` until
their fixing commit lands in the same plan). The gate closes only when
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
| **2** | OWASP Top 10 review | `none` | N/A | MET | MET | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **3** | Follows the Code style guide | `partial` | N/A | N/A | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **4** | Avoid `any`; document or `@ts-expect-error` | `partial` | N/A | N/A | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **5** | No repeated code in the PR or elsewhere in the repo | `none` | DEF | P→09 | MET | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **6** | New components / functions / entities documented | `none` | N/A | N/A | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **7** | Repo documentation markdown updated | `none` | DEF | DEF | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **8** | Tracking events for new user-facing functions | `none` | N/A | N/A | N/A | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **9** | New Svelte components follow the guidelines | `partial` | N/A | N/A | N/A | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **10** | Errors handled and logged | `none` | N/A | N/A | P→09 | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **13** | WCAG A and AA | `partial` | N/A | N/A | N/A | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **14** | Keyboard + screen-reader usable | `partial` | N/A | N/A | N/A | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |
| **15** | Developers'/Publishers' Guide entries updated | `none` | DEF | DEF | DEF | P→11 | P→12 | P→13 | P→14 | P→15 | P→15 | P→16 | P→16 | P→17 |

`P→NN` abbreviates the pending marker `PENDING→NN`. Count: 12 × 12 = **144 cells, 0 blank**.

**Token legend for the filled columns.** `MET` / `FIXED` / `DEF` (= `DEFERRED`) / `N/A` are the
matrix renderings of the four-token vocabulary; `N/A` is the `NOT-SWEPT` token carrying an `n/a`
qualifier, and **its reason is mandatory** (D-20) — every one is given in § "Slices 01a, 01b and 02 —
cell-by-cell evidence" below, which is the evidence half of these cells and not a supplement to them.
Six cells (01b item 5; 02 items 3, 4, 6, 7, 10) hold `P→09` after the sweep pass **by design**: their
verdict is `FIXED` and the token flips once the fixing commit exists, per D-04's ordering.

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
| **5** | No repeated / dead code | `PENDING→09` → **FIXED** | See § "Findings queued for fix", **F-16**. `.prettierignore:19-24` carried a six-line ignore block for `apps/strapi/**` — a path that has **never existed in this repository**: at `origin/main` the same block reads `backend/vaa-strapi/**` (`git show origin/main:.prettierignore` lines 19-24), so v0.2 *rewrote* the dead block instead of deleting it alongside the tree. Dead configuration naming a nonexistent tree, introduced by the branch. Fixed on `feat-gsd-roadmap`; the file is in slice **10**'s pathspec and slice 10 is uncut, so no re-cut is needed. |
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
| **3** | Code style guide | `PENDING→09` → **FIXED** | Measured over the 56 changed sources: **0** `Foo[]` array-suffix declarations (guide requires `Array<Foo>`, `code-style-guide/+page.md:79`) and **0** single-letter type parameters (`:80`). Every `unknown` is one of the guide's two sanctioned cases (`:86`) — a type-guard predicate (`packages/data/src/utils/typeGuards.ts:19,26,33,41,54,61,69,81,94,101`; `packages/app-shared/src/data/isEmoji.ts:9`, `isImage.ts:7`, `isLocalized.ts:8,15`) or a callback return whose value has no effect on the caller (`packages/core/src/controller/controller.ts:30,35`). Two violations found and fixed — see **F-12** (`packages/app-shared/src/utils/mergeSettings.ts:29,51`) and **F-13** (`:1`). Gate: `eslint --flag v10_config_lookup_from_file src/`, **partial** — measured complement: the script is **`src/`-only**, so `packages/filters/tests/filter.test.ts` and `packages/data/examples/` (both in this pathspec) are unlinted; and the guide's own named-parameter rule is prefixed *"This requirement is not flagged by automatic checks"* (`code-style-guide/+page.md:90`), as is TSDoc completeness. `lint:check` is **0 errors / 20 warnings** at the `151-BASELINE.md` verdict. |
| **4** | Avoid `any` | `PENDING→09` → **FIXED** | Within the 97 changed files there are exactly **6** `any` occurrences in code: `packages/app-shared/src/utils/mergeSettings.ts:38,41` (×2), `:43`, `:46` — a **new** file — and `packages/llm/src/llm-providers/provider.types.ts:69`. The latter is **compliant as written**: `StopCondition<any>` carries its reason inline (*"Vercel doesn't support typing this, so we won't either"*). The former was **not**: a bare `/* eslint-disable @typescript-eslint/no-explicit-any */` at `:29` with no documented reason, which is precisely what the checklist and `code-style-guide/+page.md:86` forbid. Fixed — see **F-12**. Gate: `@typescript-eslint/no-explicit-any`, **partial** — measured complement: the rule is *silenced* by the very `eslint-disable` that constitutes the violation, and it cannot express the checklist's "document the reason carefully" clause at all. Repo-wide corrected surface is 14 files / 77 occurrences (`151-BASELINE.md` `any_files_corrected`). |
| **5** | No repeated / dead code | **MET** — the duplication in this slice is *mandated*, and it is documented as such | `packages/{app-shared,argument-condensation,core,data,filters,llm,matching,question-info}/tsup.config.ts` are **byte-identical** — one blob, `60feaafffff1dab48ed50fab6c726bb424b6f51c`, at eight paths — and `packages/{core,data,filters,matching}/LICENSE` likewise (blob `616bdd0e898dd5376a2d2f562ffc8ac24efe8136`). Both are the shape `packages/README.md:23` and `:14` *require* (*"See `@openvaa/core`'s `tsup.config.ts`"*), so this is sanctioned per-workspace configuration, not a DRY violation — a shared config module would break the per-package build isolation the paradigm exists to give. The one genuine near-duplicate is called out **in the code**: `packages/app-shared/src/utils/mergeSettings.ts:9-11` names `mergeAppSettings` in `apps/frontend/src/lib/utils/settings.ts` as *"a separate, SHALLOW merge with different semantics — do not confuse the two"*. No `TODO`/`FIXME`/`HACK`/`XXX` occurrence in the 97 files. Gate: **none**. |
| **6** | Entities documented | `PENDING→09` → **FIXED** | All 19 added files carry a module header or TSDoc: `packages/dev-tools/src/keygen.ts:1-20` (purpose, usage, both output blocks), `pem-to-jwk.ts:1-23` (purpose, usage, a worked example), `packages/app-shared/src/utils/mergeSettings.ts:5-20` (full TSDoc with `@param`/`@returns` plus two `NB.` caveats), `packages/README.md` (the paradigm reference itself). One exported entity was undocumented — `export type DeepPartial<TObject>` at `mergeSettings.ts:1-3`, against `code-style-guide/+page.md:48` (*"Add comments to all exported variables…"*) — and was fixed; see **F-13**. Gate: **none**. |
| **7** | Repo documentation updated | `PENDING→09` → **FIXED** | The slice **adds** `packages/README.md`, the canonical-paradigm reference, which is the correct repo-doc response to reworking the shared packages. But that same new file closed its divergence list with **"No other packages currently diverge."** (`:31`) while the same slice adds `@openvaa/dev-tools` — and four further `packages/*` workspaces already diverged. Measured: only `core`, `data`, `matching`, `filters` are published (`publishConfig` + `license: MIT` + `LICENSE`); `llm`, `argument-condensation`, `question-info`, `dev-tools` and `shared-config` are all `private: true` with no `LICENSE`, and `dev-tools`, `shared-config` do not build with `tsup` at all (`dev-tools/package.json:8` is `"build": "echo 'Nothing to build.'"`). Fixed — see **F-11**. Deferred sub-findings, both outside this pathspec: `CLAUDE.md` § "Core Logic Packages"/"Experimental" omits `@openvaa/dev-tools` (slice **11**, plan 151-17), and `apps/docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.md:7-21` omits it too (slice **09**, plan 151-16). Gate: **none**. |
| **8** | Tracking events | **NOT-SWEPT** — `n/a — the item's condition is not met: the slice adds no user-available function` | The slice touches the analytics **configuration schema** (`packages/app-shared/src/settings/staticSettings.type.ts:97-118`, `dynamicSettings.type.ts:254`) but contains **no event-firing call site**: a scan of all 97 files for `trackEvent`/`track(`/`umami`/`gtag` returns only type declarations and doc comments, never a call. Event sites live in the frontend (slices 06/07) and are dispositioned there. |
| **9** | Svelte component guidelines | **NOT-SWEPT** — `n/a — no `.svelte` file in the pathspec` | `git diff --name-only <empty-tree> TARGET -- packages ':(exclude)packages/dev-seed' ':(exclude)packages/supabase-types' \| grep -c '\.svelte$'` → **0**. Gate `svelte-check` is **partial** and is **not cited**, because there is nothing in scope for it. |
| **10** | Errors handled and logged | `PENDING→09` → **FIXED** | The slice's error handling is typed and message-bearing throughout: `DataProvisionError` (`packages/data/src/objects/nominations/base/nomination.ts:43`, `variants/allianceNomination.ts:33`, `objects/questions/base/choiceQuestion.ts:26`), `DataNotFoundError` (`nomination.ts:115`, `allianceNomination.ts:88`), `DataTypeError` (`objects/questions/base/question.ts:138`), and an exhaustive-switch guard at `packages/data/src/utils/createDeterministicId.ts:41`. Logging is package-tagged rather than bare: `packages/argument-condensation/src/prompts.ts:19` and `packages/question-info/src/prompts.ts:19` both emit `console.error('[<package>] Failed to register prompts:', err)`, and `packages/core/src/controller/controller.ts:43-55` routes by `LogLevel`. One gap was found and fixed — `packages/dev-tools/src/pem-to-jwk.ts:64,78`, see **F-14**. Gate: **none**. |
| **13** | WCAG A and AA | **NOT-SWEPT** — `n/a — no markup or route in the pathspec` | 0 `.svelte`, 0 `.html`, 0 route files (item 9's measurement). D-20 makes a11y exhaustive over *routes and components whose markup changed*; this slice contains neither, so the correct record is a declared blind spot rather than a pass. Gate `assertAxeScan` **not cited** — 0 routes in scope. |
| **14** | Keyboard + screen-reader | **NOT-SWEPT** — `n/a — no markup or route in the pathspec` | As item 13. |
| **15** | Developers'/Publishers' Guides | **DEFERRED** — the Developers' Guide's package inventory is now wrong, and it is not this slice's file | `apps/docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.md:7-21` enumerates every workspace; after this slice it is missing `@openvaa/dev-tools`, still lists `@openvaa/strapi` and `@openvaa/strapi-admin-tools` (removed by slice 01b), and links `@openvaa/frontend` to `blob/main/frontend/` (moved by slice 01a). Publishers' Guide: no entry describes the shared packages, so nothing there is invalidated. Rationale for deferring: the file is owned by slice **09**, which D-07 sweeps and cuts later; fixing it from here would put a slice-09 edit in a slice-02 sweep's commit and blur exactly the ownership criterion 6 is built on. Routed to plan **151-16**. Gate: **none**. |

---

## Findings queued for fix

Produced by the sweep above. **F-11 … F-14 and F-16 are at or above D-05's fix bar** and are handed
to this plan's Task 2; **F-15 and F-17** are structural records rather than code fixes.
Numbering continues the pre-seeded series (F-01 … F-10).

| ID | Items | Slice (file owner) | Finding | Evidence | Disposition |
|---|---|---|---|---|---|
| **F-11** | 6, 7 | **02** | `packages/README.md` asserts **"No other packages currently diverge."** in the same slice that adds a diverging package. Five `packages/*` workspaces diverge from the canonical shape it defines: `llm`, `argument-condensation`, `question-info` (private, no `LICENSE`), `dev-tools` and `shared-config` (private, no `LICENSE`, no `tsup` build). | `packages/README.md:25-31`; `packages/dev-tools/package.json:2,8`; `packages/shared-config/package.json` | **QUEUED → Task 2** |
| **F-12** | 3, 4 | **02** | A **new** file opens a blanket `eslint-disable @typescript-eslint/no-explicit-any` block with **no documented reason**, over four `as any` casts. Both the checklist item and the style guide require the reason be documented. | `packages/app-shared/src/utils/mergeSettings.ts:29,38,41,43,46,51` | **QUEUED → Task 2** |
| **F-13** | 3, 6 | **02** | Exported type `DeepPartial<TObject>` carries no TSDoc, against *"Add comments to all exported variables…"*. It is the first declaration in a file added by this slice. | `packages/app-shared/src/utils/mergeSettings.ts:1-3`; rule at `apps/docs/src/routes/(content)/developers-guide/contributing/code-style-guide/+page.md:48` | **QUEUED → Task 2** |
| **F-14** | 1, 10 | **02** | The PEM detector accepts `-----BEGIN ENCRYPTED PRIVATE KEY-----` and then hands the blob to `jose.importPKCS8`, which takes **no passphrase** — so an encrypted key surfaces an unhandled library exception, while *every other* invalid input in the same file is explicitly handled with a message and a non-zero exit. The file advertises support it does not have. | `packages/dev-tools/src/pem-to-jwk.ts:64` (the regex), `:77-79` (the import), against the handled paths at `:53-56`, `:58-61`, `:67-72` | **QUEUED → Task 2** |
| **F-15** | 5, 12 | **structural** | **A fix to any of the 120 files no slice pathspec claims cannot land without amending the partition.** `build-slice.sh` derives each slice from `PARENT..TARGET` restricted to a pathspec; a `TARGET`-side change to an unclaimed path therefore enters **no** slice, lands in the catch-all, and breaks both `files=0` and criterion 7's byte-identity. This is what blocks **F-01** (`jest.config.json`), **F-10** (the 89 Capacitor orphans) and the broken `README.md:12` image. **Remedy, stated precisely so 151-16 need not re-derive it:** claim the paths by extending an existing pathspec — `README.md` into slice **09** (which already owns the other root markdown, `ROADMAP.md`), and `apps/frontend/{android,ios,jest.config.json}` into slice **10** (which already deletes `capacitor.config.ts`, so F-10's orphans land in the one PR whose reviewer is asking the question). Extending a pathspec to claim a path *nobody* claims cannot create an overlap cell and removes no file from any other slice, so it is a hole-closing correction rather than a re-partition — **but it edits an operator-approved `slices.tsv`, so it is the operator's call, not an agent's.** | `scripts/build-slice.sh:96-119`; the 120-path list reproduced by the command in § "F-17" | **RECORDED → plan 151-16 (operator decision)** |
| **F-16** | 5, 7 | **10** (surfaced by 01b's sweep) | `.prettierignore` ships a six-line ignore block for `apps/strapi/**`, **a path that has never existed in this repository**. At `origin/main` the same block reads `backend/vaa-strapi/**`; v0.2 *rewrote* it to a nonexistent path instead of deleting it with the tree. | `.prettierignore:19-24` at `TARGET`; `git show origin/main:.prettierignore` lines 19-24 for the pre-image | **QUEUED → Task 2** (file is in slice 10's pathspec **and** in its diff; slice 10 is uncut, so no re-cut) |
| **F-17** | 5, 12 | **structural** | **F-09's 842 undercounts the invisible-to-review class by 360.** The enumerated 842 is the *moved-and-identical* subset. The full set of files that ship in the stack and appear in **no** slice's diff is **1,202** = 5,052 tracked at `TARGET` − 4,274 in the comparable diff. The extra **360** were never moved and are byte-identical at both ends: **341 under `packages/`** (inside slice 02's own pathspec), plus `.github/` ×4, `tests/` ×3, `images/` ×2, and `README.md`, `LICENSE`, `eslint.config.mjs`, `prettier.config.mjs`, `vitest.workspace.ts`, `.editorconfig`, `.dockerignore`, `.husky/post-commit`, `design/icons/custom-icons.ai`, `.claude/settings.json`. Relatedly, **the unclaimed-by-any-pathspec count is 120, not 110** — the record's 110 is the subset inside the 842; the other **10** are `README.md`, `LICENSE`, `eslint.config.mjs`, `prettier.config.mjs`, `vitest.workspace.ts`, `.editorconfig`, `.dockerignore`, `images/` ×2, `design/icons/custom-icons.ai`. **Why this is not a partition defect:** the 360 are unchanged by v0.2, so they are outside the phase boundary's "v0.2 net diff" scope and are correctly **NOT-SWEPT — unchanged by v0.2**. Why it still matters: F-09 as written claims 842 files "ship inside the stack with their content reviewed by nobody", and the honest number for that claim is 1,202. The 842 is the narrower and more useful statement — *the files a reviewer of PR #1 sees as a rename line*. | `comm -23 <(git ls-tree -r --name-only TARGET \| sort -u) <(git -c diff.renameLimit=20000 diff --name-only --no-renames C1 TARGET \| sort -u)` → 1202; unclaimed set via the same `comm` against the union of every `slices.tsv` pathspec resolved with `git diff <empty-tree> TARGET -- <specs>` | **RECORDED — widens F-09; the 360 dispositioned NOT-SWEPT here, the 110 + 10 routed to plan 151-16 via F-15** |

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
| **17** | New content tables include all common columns | `none` | `PENDING→11` | Neither `supabase db lint` nor `lint-schema.mjs` inspects column sets. **Complement: the entire item.** |
| **18** | RLS enabled + standard 5-policy pattern | `partial` | `PENDING→11` | `lint-schema.mjs` check **0013** (`apps/supabase/scripts/lint-schema.mjs:38-51`, ERROR) covers the **"RLS enabled" half only**. **Complement: the 5-policy pattern is not checked at all — a table with RLS on and one policy passes.** |
| **19** | RLS policies use `(SELECT auth.uid())` / `(SELECT auth.jwt())` scalar subqueries | `none` | `PENDING→11` | No check reads policy bodies. Greppable over 27 SQL files; **no gate exists**. |
| **20** | RLS policies specify `TO anon` / `TO authenticated` | `none` | `PENDING→11` | No check reads policy role targets. Same 27-file surface; no gate. |
| **21** | `SECURITY DEFINER` functions set `search_path = ''` | `none` | `PENDING→11` | `plpgsql_check` validates PL/pgSQL **bodies**, not function *attributes*. **Complement: `search_path = ''` and schema-qualification are entirely unchecked.** |
| **22** | B-tree indexes on `project_id` and FK columns | `partial` | `PENDING→11` | `lint-schema.mjs` check **0001** (`:53-76`, WARNING, and `lint:sql` runs `--fail-on warning`) covers **FK columns**. **Complement: a `project_id` that is not a declared FK is invisible to it, and index *type* is unchecked.** |
| **23** | Trigger naming conventions | `none` | `PENDING→11` | Neither check reads trigger names. No gate. |
| **24** | pgTAP transaction-boundary pattern + `create_test_data()` | `none` | `PENDING→11` | Execution is not conformance — a pgTAP file that never `ROLLBACK`s passes if its assertions pass. **Complement: the pattern is unchecked, and the executing job is the conditional one from item 11.** 11 files. |
| **25** | pgTAP assertion patterns | `none` | `PENDING→11` | Same as 24 — execution is not conformance. Agent review over the same 11 files. |

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
| **29** | Verify caller is admin via JWT claims | `none` | `PENDING→11` | No gate exists. Same 3-function / 5-file surface. |
| **30** | `createClient()` with `service_role` for privileged operations | `none` | `PENDING→11` | No gate exists. Same 3-function / 5-file surface. |
| **31** | HTTP status codes + descriptive error messages | `none` | `PENDING→11` | No gate exists. Same 3-function / 5-file surface. |

---

## Cell census

| Group | Cells | Filled | Pending | Blank |
|---|---:|---:|---:|---:|
| Per-slice general (12 × 12) | 144 | 30 | 114 | **0** |
| Phase-level (4 × 1) | 4 | 0 | 4 | **0** |
| Supabase Backend (9, slice 03) | 9 | 0 | 9 | **0** |
| Supabase Adapter (3, slice 06) | 3 | 0 | 3 | **0** |
| Edge Functions (3, slice 03) | 3 | 0 | 3 | **0** |
| **Total** | **163** | **30** | **133** | **0** |

**The 30 filled cells, by slice** (plan 151-09): **01a** 12 of 12 — 9 `NOT-SWEPT` + 3 `DEFERRED`;
**01b** 11 of 12 — 9 `NOT-SWEPT` + 2 `DEFERRED`, item 5 pending its fix; **02** 7 of 12 — 2 `MET`
+ 4 `NOT-SWEPT` + 1 `DEFERRED`, items 3, 4, 6, 7 and 10 pending their fixes. The 6 `PENDING→09`
cells become `FIXED` when the fixing commits land, which is why 36 cells were dispositioned but 30
are counted filled.

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
| `apps/docs/static/images/youthvotes-logo.png` | `PENDING→09` | Blob `f109566c5`, byte-identical at `C1` and `TARGET`, absent from the pre-move `docs/` path. **In the dropped-finding class — reviewed by NO slice diff.** Placed by merge-ort's directory-rename detection; no hand resolution. |

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


---

*Phase 151 · Plan 06 · scaffold created 2026-08-17 · cells filled by plans 151-09 … 151-18*
