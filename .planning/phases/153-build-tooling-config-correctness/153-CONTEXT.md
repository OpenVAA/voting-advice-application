# Phase 153: Build & Tooling Config Correctness - Context

**Gathered:** 2026-08-28
**Status:** Ready for planning
**Source of decisions:** `.planning/v2.15-DISCUSSION-POINTS.md` § B (B1–B6), § 0 facts 1–6, § N (N1–N3)
**Generated per:** § N3 option (a) — one `<padded>-CONTEXT.md` per phase, derived from that phase's
decisions; the consolidated document itself is the shared discussion log.

<domain>
## Phase Boundary

Every build- and tooling-level assertion this repo makes about itself is true, and the ones that were
never true are fixed rather than documented. The phase touches configuration plumbing only —
`package.json` manifests, `.lintstagedrc.json`, `.gitignore`, `apps/frontend/vitest.config.ts`,
`.yarnrc.yml`, CI job definitions, and two documentation/barrel-file corrections — plus the guards
that make each fix non-reopenable.

**Ships:**

1. `tsup` declared in `devDependencies` in all **8** workspaces whose `build` script invokes it
   (fact 1 — 8/8 measured missing), behind a **generalised binary-declaration guard** wired into
   `yarn lint:check` (D-B4).
2. `engine` → `engines` in both roots (fact 2), plus the Yarn configuration and a CI job that make
   the constraint actually **bind** — an out-of-range Node observed rejected (D-B5).
3. `apps/frontend/vitest.config.ts` freed of `__dirname` at all **9** measured sites (fact 3), with
   config loading exercised to prove it.
4. `.lintstagedrc.json` invoking its commands **directly** rather than through `bash -c`, and — in
   the same commit — the fused-glob defect fixed (`mjssvelte` → `mjs,svelte`), so `.svelte` and
   `.mjs` files are linted and formatted on commit for the first time (fact 6, D-B3). The one-off
   formatting churn this uncovers is expected and lands immediately after.
5. **All three** tracked `tsbuildinfo` files untracked plus `supabase/.branches/_current_branch`,
   with `*.tsbuildinfo` gitignored globally so the class cannot reopen in a fourth workspace
   (fact 5, D-B2).
6. `.github/workflows/main.yaml:34`'s skill-drift step **observed running green** against the
   already-existing script (fact 4, D-B1) — the "add or remove the script" half of the roadmap's
   criterion 5 is already discharged on evidence.
7. `packages/shared-config/README.md:15` stops advertising a `^1.0.0` that does not exist, and
   `packages/supabase-types/src/index.ts` drops its `.js` specifiers per `packages/README.md`'s
   TS-internal import convention.
8. `packages/core/src/controller/controller.ts:73` unused params prefixed with `_` (D-B6).

**Explicitly NOT in scope:**

- **Writing the `audit-skill-drift.sh` script.** It exists. Any plan task that creates, replaces, or
  "restores" it is working from the roadmap's false premise (fact 4).
- **Deleting the stray top-level `supabase/` directory** — B2 option (c) was not chosen; only
  `supabase/.branches/_current_branch` is untracked. The directory itself stays.
- **CI gates generally** — `db:lint:sql`, secret scanning, dependency audit and the SQL prettier
  parser are Phase 163 (fact 33), not this phase. The only CI work here is the two jobs that D-B1
  (observe skill-drift green) and D-B5 (engines binding) require.
- **The 817-line comment/planning-reference sweep** — Phase 152 (fact 7).
- **Any behavioural change to the frontend, packages, or database.**

</domain>

<decisions>
## Implementation Decisions

**Checkbox semantics of the source document, applied literally:** exactly one option per decision
carries `★ RECOMMENDED`; leaving every box unchecked *is* choosing the ★ option — identical to
ticking it, not "undecided". A ticked non-★ box overrules. Free text (`**EDIT:**` / `**NOTE:**` /
`**NOTES**:`) beats every box.

**Measured state of § B in the operator's filled document:** **zero boxes ticked across B1–B6 and
zero free-text annotations.** Every decision below therefore resolves to its `★ RECOMMENDED` option
**by default, not by tick** — which the document's own preamble states is a complete answer, not an
omission. No operator free text exists for this phase to carry over.

### D-B1 — Criterion 5's premise is false: the script already exists

**Question:** the roadmap says `.claude/scripts/audit-skill-drift.sh` does not exist; it does. What
becomes of criterion 5?

**Won:** option **(a) — restate criterion 5 as "the workflow is observed running green"**.
**★ RECOMMENDED, won by default (no tick).**

**Rationale (verbatim from the source):** "the 'add or remove the script' half is already discharged;
the observation half is the real, unmet deliverable and is worth keeping."

Option (b) (strike criterion 5 entirely) was rejected as dropping the only check that the workflow
actually runs, which no other criterion covers.

**Consequence for planning:** the deliverable is a **real workflow run** in which the
`.github/workflows/main.yaml:34` step (`run: .claude/scripts/audit-skill-drift.sh`) is observed
passing — evidence of the run, not a code change. Do **not** plan an "add the script" task.

### D-B2 ⚠ DECIDE — Three tracked `tsbuildinfo` files, roadmap names one

**Question:** untrack the one file the roadmap names, or the measured set?

**Won:** option **(a) — untrack all three plus `supabase/.branches/`, and gitignore `*.tsbuildinfo`
globally**. **★ RECOMMENDED, won by default (no tick).**

**Rationale (verbatim):** "the criterion's intent is that build artifacts are not versioned; fixing
one of three leaves the same noisy-diff problem in the two busiest workspaces."

Option (b) (literal scope — only `packages/supabase-types/tsconfig.tsbuildinfo` +
`supabase/.branches/`) rejected: "the other two keep producing the diffs the reviewer objected to."
Option (c) (**also delete the stray top-level `supabase/` directory**) **not chosen** — the reviewer
floated it, but it "needs a check that nothing (Supabase CLI cwd resolution, scripts) depends on it
existing." The directory is therefore out of scope; only the tracked file under it is removed.

**Concrete target set** (`git ls-files`, verified this session): `apps/docs/tsconfig.tsbuildinfo`,
`apps/frontend/tsconfig.tsbuildinfo`, `packages/supabase-types/tsconfig.tsbuildinfo`,
`supabase/.branches/_current_branch`. `.gitignore` currently contains **no** `tsbuildinfo` or
`.branches` entry (verified), so both ignore rules are additions.

### D-B3 — `.lintstagedrc.json` never matches `.svelte` or `.mjs`

**Question:** the glob fuses `mjssvelte` into one alternative — fix it here, or file it?

**Won:** option **(a) — fix the glob to `mjs,svelte` in the same commit that removes `bash -c`**.
**★ RECOMMENDED, won by default (no tick).**

**Rationale (verbatim):** "same file, same two lines, and it is a strictly larger correctness win
than the item that led us here. Expect a one-off formatting churn commit on `.svelte` files
immediately after."

Option (b) (remove `bash -c` only, file the glob as a todo) rejected: "leaves the repo's largest file
type unlinted for another phase." Option (c) (fix the glob but gate the churn behind a separate
normalisation commit) rejected as producing "two commits and a brief window where `lint:check` and
pre-commit disagree" — note that the ★ option still expects the churn as **its own** follow-on
commit; what (c) added was a deliberate ordering gap, and that gap is what was declined.

**This is a live defect, not cleanup.** Every Svelte component in the repo skips pre-commit prettier
and eslint today. It is **not** one of the 131 review comments — it was found while verifying the
`bash -c` item on the same two lines.

**Proof obligation carried from the roadmap's criterion 8:** stage a deliberately mis-formatted
`.svelte` file, observe the hook **pass** on the current glob and **reject** it after.

### D-B4 — How the tsup guard is proven

**Question:** criterion 1 demands "a guard that fails when a workspace invokes a binary it does not
declare — not by inspection." Which guard?

**Won:** option **(a) — a repo script that parses every workspace `package.json`, extracts binaries
invoked in `scripts`, and asserts each is declared, wired into `lint:check`**. **★ RECOMMENDED, won
by default (no tick).**

**Rationale (verbatim):** "generalises past `tsup` to the whole class, and `lint:check` membership is
the assertion pattern Phase 144 already established here."

Option (b) (a vitest test asserting the eight names) rejected: "hardcodes today's answer and passes
trivially once a ninth workspace appears with the same defect." Option (c) (add the deps and rely on
a Yarn PnP install failing) rejected: "the repo is not on PnP, so nothing fails and the guarantee is
imaginary" — confirmed, `.yarnrc.yml` sets `nodeLinker: node-modules`.

**Wiring target:** `package.json:35` `"lint:check"`, which already chains
`assert:i18n-catalog-namespaces` and `assert:a11y-scan-wiring` in the same style. Phase 144's
precedent asserts **chain membership**, not position (`b410d3a90`).

### D-B5 — Making the `engines` constraint actually bind

**Question:** criterion 2 says the constraint must be "observed to actually bind"; renaming alone
rejects nothing, because Yarn only enforces it under configuration.

**Won:** option **(a) — rename, set `.yarnrc.yml` to error on engine mismatch, and add a CI job on an
out-of-range Node observed failing**. **★ RECOMMENDED, won by default (no tick).**

**Rationale (verbatim):** "this is the only option under which the criterion's word 'binds' is true."

Option (b) (rename only) rejected: "the constraint stays advisory and the criterion stays unmet."
Option (c) (rename + a preinstall version check script) rejected: "adds a hand-rolled check where the
package manager already has one."

**Three artefacts, not one:** (i) the field rename at both sites, (ii) a `.yarnrc.yml` setting that
makes a mismatch an **error** (the file today carries only `nodeLinker`, `yarnPath` and the
`catalog:` block — no engine-related key exists), (iii) a CI job running an out-of-range Node and
**observed failing**. The declared range is `node: ">=22"`, `yarn: "4.13"`,
`npm: "please-use-yarn"`.

### D-B6 — `controller.ts:73` unused params (triage item, no roadmap criterion)

**Question:** how to silence the shared ESLint config's unused-parameter warning on a base
implementation that legitimately ignores its arguments?

**Won:** option **(a) — prefix with `_` to match the shared config's `argsIgnorePattern`**.
**★ RECOMMENDED, won by default (no tick).**

**Rationale (verbatim):** "one-line fix, matches the config the reviewer cited, no suppression
comment needed."

Option (b) (`eslint-disable` with a `// reason:` block) rejected: "adds a suppression where a rename
costs nothing." Option (c) (leave it — it warns, not errors) rejected: "leaves a permanent warning in
a package that Phase 141 made a coverage-guard subject."

**Site:** `packages/core/src/controller/controller.ts:73` —
`defineSubOperations(operationId: string, subOperations: Array<{ id: string; weight?: number }>): void`
with a `// No-op by default` body. Both parameters are unused; the shared config's
`unused-imports/no-unused-vars` uses `argsIgnorePattern: '^_'`.

### Applicable cross-cutting decisions (§ N)

All three § N decisions are likewise **unticked → ★ RECOMMENDED, won by default.**

- **D-N1 (a)** — Phase 152 stays first as roadmapped and lands its scan in `yarn lint:check`.
  *Bearing on 153:* 153 does not depend on 152, but any comment this phase writes is authored under
  152's post-sweep convention (no phase numbers, no planning-artifact paths, no historical narrative
  in code comments) — the guard 152 installs in `lint:check` will police this phase's diff.
  Whichever of the two lands first, this phase's `lint:check` additions (D-B4) and 152's scan share
  the same script chain and must not collide on ordering assumptions.
- **D-N2 (a)** — follow-up items land in `.planning/todos/pending/`, filed during the owning phase.
  *Bearing on 153:* the deferred items under `<open>` below are filed there, not as ROADMAP backlog
  entries and not as GitHub issues.
- **D-N3 (a)** — one CONTEXT.md per phase generated from that phase's decisions, plus a pointer back
  to the consolidated document. *This file is that artefact.*

### Baseline decision (§ 0.1) — the one ticked box relevant to this phase

§ 0.1 is the **only** decision anywhere in the document with a tick: **(c) — accept all 33 facts AND
correct `.planning/ROADMAP.md:1003-1217` in place**, overruling ★ (a). Consequence:
**another agent is concurrently rewriting the Phase 153 roadmap entry.** This phase's planners must
not edit `ROADMAP.md`, and must treat the § 0 facts as authoritative wherever the two disagree
(see `<facts>`).

### Claude's Discretion

- Language and location of the binary-declaration guard (D-B4) — a Node script under the repo's
  existing script conventions; its exact path and the shape of its output.
- The exact `.yarnrc.yml` key/value that makes an engine mismatch an error (D-B5) — verify against
  the pinned Yarn 4.13.0 release at `.yarn/releases/yarn-4.13.0.cjs` rather than from memory.
- The ESM replacement for `__dirname` in `apps/frontend/vitest.config.ts`
  (`import.meta.url` + `fileURLToPath`, or Vite's own path helpers) and whether the 9 sites collapse
  to one derived constant.
- Commit granularity within D-B3, provided the `bash -c` removal and the glob fix land **together**
  and the formatting churn lands as its own commit.


### Decision index (machine-readable)

One bullet per decision above, in the grammar `plan-phase`'s decision-coverage gate parses.
The sections carry the reasoning and evidence; **this is an index, not a summary — plan from
the sections.** It lives inside `<decisions>` because the parser reads only this block when
one is present, and ignores `###` headings entirely.

- **D-B1:** Criterion 5's premise is false: the script already exists
- **D-B2:** Three tracked `tsbuildinfo` files, roadmap names one
- **D-B3:** `.lintstagedrc.json` never matches `.svelte` or `.mjs`
- **D-B4:** How the tsup guard is proven
- **D-B5:** Making the `engines` constraint actually bind
- **D-B6:** `controller.ts:73` unused params (triage item, no roadmap criterion)

</decisions>

<facts>
## Measured Baseline (§ 0, re-verified at HEAD `bff94f382`, 2026-08-28)

**Precedence rule, stated explicitly:** where `.planning/ROADMAP.md`'s Phase 153 entry and a § 0 fact
disagree, **the fact wins.** The roadmap entry is being corrected concurrently by another agent per
§ 0.1(c); until that lands, plan against this table. Facts marked ⚑ contradict the roadmap as
originally written and each one changes the work.

| # | Fact | Evidence (cited, not paraphrased) |
|---|---|---|
| 1 | All **8** workspaces invoking `tsup` in `build` omit it from `devDependencies` — **8/8 measured, not a sample** | `packages/{app-shared,argument-condensation,core,data,filters,llm,matching,question-info}/package.json`. Reviewer's per-file anchors: `app-shared:11`, `argument-condensation:12`, `core:26`, `data:27`, `filters:27`, `llm:11`, `matching:26`, `question-info:11` |
| 2 | `engine` (not `engines`) in **both** roots | `package.json:74` · `apps/frontend/package.json:54` |
| 3 | `__dirname` used at **9** sites in an ESM-typed package | `apps/frontend/vitest.config.ts:18,22,25,26,27,28,32,36,40,44` · `apps/frontend/package.json:59` `"type": "module"` |
| 4 | ⚑ **`.claude/scripts/audit-skill-drift.sh` EXISTS.** Roadmap criterion 153-5 says it does not | `ls .claude/scripts/` → `audit-skill-drift.sh` · referenced at `.github/workflows/main.yaml:34` (`- name: "Check skill drift"` / `run: .claude/scripts/audit-skill-drift.sh`) |
| 5 | ⚑ **THREE** `tsbuildinfo` files are tracked, not one | `git ls-files` → `apps/docs/tsconfig.tsbuildinfo`, `apps/frontend/tsconfig.tsbuildinfo`, `packages/supabase-types/tsconfig.tsbuildinfo` (+ `supabase/.branches/_current_branch`) |
| 6 | ⚑ **NEW — `.lintstagedrc.json` glob is broken.** `mjssvelte` is one fused alternative, so **`.svelte` and `.mjs` files are never linted or formatted on commit** | `.lintstagedrc.json:2` — `*.{html,js,jsx,cjs,mjssvelte,ts,tsx,cts,mts,xml,yaml,yml}` |

### The three ⚑ facts spelled out, because each retires or resizes planned work

**⚑ Fact 4 — the script exists; criterion 153-5's premise is false.**
The reviewer's comment on `.github/workflows/main.yaml:34` reads *"that script does not exist in this
PR's tree"* — that was true of the PR under review and is **not** true of this tree. `ls` returns
`audit-skill-drift.sh` and the workflow step calls it. **D-B1 disposes:** the "add or remove the
script" half is already discharged on evidence; the *only* remaining work is to **observe the
workflow step running green** on a real run. Any plan task that writes, restores, or removes that
script is planning against a false premise.

**⚑ Fact 5 — three files, not one; criterion 153-6 names one.**
The reviewer's comment targets `packages/supabase-types/tsconfig.tsbuildinfo:1` only, and the
roadmap inherited that scope. `git ls-files` returns **three** `tsconfig.tsbuildinfo` files, in
`apps/docs/`, `apps/frontend/` and `packages/supabase-types/`, plus
`supabase/.branches/_current_branch`. **D-B2 (⚠ DECIDE) disposes:** untrack **all four paths** and
add a global `*.tsbuildinfo` ignore. `.gitignore` contains no such rule today (verified) — both the
untracking and the ignore rule are new.

**⚑ Fact 6 — a live defect with no roadmap criterion of its own until the concurrent correction
lands.**
`.lintstagedrc.json:2` reads
`"*.{html,js,jsx,cjs,mjssvelte,ts,tsx,cts,mts,xml,yaml,yml}"`. Brace expansion treats `mjssvelte` as
a **single** alternative matching a literal `.mjssvelte` extension. Neither `.svelte` nor `.mjs`
appears anywhere in the glob. Consequence: **the repo's largest file type has never been covered by
pre-commit** — no prettier, no eslint, on any `.svelte` file, ever. This is a **live defect, not a
cleanup item**, and it is **not one of the 131 review comments**; it was found this session while
verifying the `bash -c` item on the same two lines. **D-B3 disposes:** fix it in the same commit as
the `bash -c` removal.

### Supporting measurements taken this session (grounding, not new decisions)

- `.lintstagedrc.json` uses `bash -c 'turbo run build --filter=@openvaa/app-shared...'` on **both**
  glob entries (lines 3 and 7) — the reviewer's `:3` comment notes the duplicate at line 7.
- `package.json:35` — `"lint:check": "turbo run lint && eslint … tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring"`. The D-B4 guard joins this chain.
- `.yarnrc.yml` — `nodeLinker: node-modules`, `yarnPath: .yarn/releases/yarn-4.13.0.cjs`, plus the
  `catalog:` block. **No engine-related key exists**, which is why D-B5's rename alone would bind
  nothing, and why option (c)'s "PnP install would fail" reasoning under D-B4 is inapplicable.
- `packages/supabase-types/src/index.ts` — all four export lines use `.js` specifiers
  (`from './database.js'`, `from './column-map.js'`), against `packages/README.md`'s TS-internal
  convention.
- `packages/shared-config/README.md:11` — `"@openvaa/shared-config": "^1.0.0"` (the reviewer cited
  `:15`; the string is at `:11` on this tree). The package is private and versioned `0.1.0`.
- `packages/core/src/controller/controller.ts:73` — `defineSubOperations(operationId, subOperations)`
  with a `// No-op by default` body; both params unused.

</facts>

<open>
## Open Items

Requirements the roadmap places on this phase that **no § B decision covers**, plus gaps found while
grounding. None of these are decided here; they are surfaced so planning does not silently invent an
answer.

1. **`REVIEW-CFG-01..07` are undefined.** The roadmap's Phase 153 entry declares
   `**Requirements**: REVIEW-CFG-01..07` (`ROADMAP.md:1027`), but a repo-wide search finds that
   string **only** in that line — `.planning/REQUIREMENTS.md` defines no `REVIEW-CFG-*` requirement.
   The seven ids cannot be traced to text. Planning must either have them added to `REQUIREMENTS.md`
   or record that the roadmap's success criteria are the operative contract. **Not a § B decision.**

2. **Roadmap criterion 7 has no covering decision.**
   `packages/shared-config/README.md`'s `^1.0.0` and `packages/supabase-types/src/index.ts`'s `.js`
   specifiers are in the roadmap and in the triage (2 of the 17 comments), but § B contains no
   decision about them — they were judged uncontroversial. Both are in scope (see `<domain>`); the
   *shape* of the README fix is unresolved: the reviewer suggested "use the workspace protocol (and
   align the TypeScript versioning with the repo's catalog usage)", which is a larger edit than
   deleting a version string. Also note the line drift: the string is at `:11`, not the cited `:15`.

3. **What "observed running green" means as committed evidence (D-B1).** The decision fixes the
   deliverable but not its artefact — a workflow run URL, a pasted job log, or a phase evidence doc
   on the `137-NEGATIVE-CONTROL.md` model. Precedent in this project favours a phase-dir evidence
   file; not decided.

4. **Whether the D-B5 CI job is a permanent gate or a one-off observation.** Option (a) says "add a
   CI job on an out-of-range Node **observed failing**". A permanent job that must fail is unusual
   CI shape; a one-off observation satisfies "binds" but leaves no standing guard. Unresolved.

5. **Ordering against Phase 152's `lint:check` scan (D-N1).** Both phases add an assertion to the
   same `lint:check` chain and both are `**Depends on**: Nothing`. If they execute in parallel the
   chain edit is a merge conflict surface. Phase 144's precedent (`b410d3a90`) asserts chain
   **membership**, not position, which mitigates but does not eliminate this.

6. **The expected `.svelte` formatting churn (D-B3) is unbounded.** The decision anticipates "a
   one-off formatting churn commit on `.svelte` files immediately after", but no one has measured
   how many files prettier will rewrite once the glob matches. Worth measuring during research
   (`prettier --check '**/*.svelte'`) before planning commits to a single churn commit.

7. **The stray top-level `supabase/` directory survives.** B2(c) was not chosen, so
   `supabase/.branches/_current_branch` is untracked while the directory itself remains on disk and
   unexamined. If it turns out to be pure residue, that is a `.planning/todos/pending/` item per
   D-N2 — not work for this phase.

</open>

---

*Phase: 153-build-tooling-config-correctness*
*Decisions source: `.planning/v2.15-DISCUSSION-POINTS.md` § B, § 0, § N — all § B boxes unchecked, i.e. all six ★ RECOMMENDED options chosen by default*
*Context gathered: 2026-08-28*

---

## Operator decisions O4 and O5 — taken after planning (2026-08-28)

Both answer questions this phase's own planning run raised. See `.planning/v2.15-DISCUSSION-POINTS.md`
§ O4 and § O5.

### O4 — criterion 5 (`audit-skill-drift.sh`)

**Fix the script and the drift; file the observed-CI-run half.** This confirms the disposition `153-08`
already planned provisionally, so no replanning is needed.

Note the correction it rests on: the script is **not inert**. Only 2 of 8 skills declare `targets: []`;
five declare real directories and the script exits 1 today. The "inert" claim was an orchestrator error
repeated into this phase's briefing, and this phase's planner refuted it by measuring.

### O5 — decision B5 (`engines` enforcement) is REVERSED

**Use a preinstall check.** D-B5 asked for a `.yarnrc.yml` setting that does not exist in Yarn 4.13.0, and
rejected the preinstall alternative on the false ground that the package manager already provided one.
Reversing restores the intent — the constraint must *bind* — rather than overriding the decision.

**This pre-answers `153-02`'s `gate="blocking-human"` checkpoint.** When that plan executes, the checkpoint
does not stop: implement the preinstall enforcement and record O5 as its resolution.

### Decision index addendum

- **D-B5-R:** REVERSED by operator decision O5 — enforce `engines` via a preinstall script, because Yarn 4.13.0 has no `.yarnrc.yml` setting that makes an engine mismatch an error and D-B5's rejection of the preinstall option rested on a false premise.
