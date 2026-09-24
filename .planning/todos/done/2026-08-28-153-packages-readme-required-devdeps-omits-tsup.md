---
title: '`packages/README.md`''s required-devDeps sentence omits `tsup` — the same document that states the canonical build script invokes it'
created: 2026-08-28
updated: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 07
priority: low
suggested_phase: future-build-tooling
keywords:
  [
    packages-readme,
    canonical-paradigm,
    required-devdeps,
    tsup,
    catalog,
    shared-config,
    REVIEW-CFG-07,
    REVIEW-CFG-01,
    OQ-4,
    A5,
    scope-boundary
  ]
---

# `packages/README.md`'s required-devDeps sentence omits `tsup`

## Origin

Phase 153 Plan 07 executed REVIEW-CFG-07 — *"the repo's documentation and import conventions are true
of the repo"* — against the two files the criterion names: `packages/shared-config/README.md` and
`packages/supabase-types/src/index.ts`. Research (`153-RESEARCH.md` § F.1 / OQ-4) surfaced a **third**
document whose statement is also untrue of the repo. It is filed here rather than absorbed, because
widening a criterion's file set during an unattended run is a silent scope change in the same way
narrowing it would be.

This entry carries **both** OQ-4 riders, because they are the same document's problem seen from two
sides. Rider 1 is already answered; only rider 2 is open.

## The defect (rider 2 — OPEN)

`packages/README.md` is the canonical-paradigm reference for new `packages/<name>/` workspaces. Two
adjacent bullets of its "Paradigm summary" disagree with each other:

- **`:20` — "Build pipeline."** states the canonical build script is
  `scripts.build = "tsup && tsc --emitDeclarationOnly --outDir dist"`.
- **`:21` — "`package.json` shape."** ends: *"Required devDeps: `@openvaa/shared-config: workspace:^`,
  `typescript: catalog:`, `vitest: catalog:`."* — **`tsup` is absent.**

So the document that defines what a canonical package must declare omits the one binary its own
canonical build script runs. A contributor who follows `:21` literally produces a workspace whose
`build` script invokes an undeclared binary — which survives only on root hoisting.

**Both citations were re-verified against the file at execute time** (2026-08-29, HEAD `e1f398792`),
not carried from research: `:20` and `:21` are the lines described. Phase 153's standing finding is
that positional citations in its own docs are unreliable file-by-file (153-04 found all eleven of its
plan's citations wrong; 153-03, 153-05 and 153-06 found theirs accurate), so navigate by the bullet's
bolded lead-in — **"Build pipeline."** and **"`package.json` shape."** — rather than by line number.

### Why this matters beyond a doc nit

This omission is plausibly the **origin** of REVIEW-CFG-01. Plan 153-01 measured **eight** workspaces
invoking `tsup` from their `build` script while declaring it nowhere:

```
packages/app-shared  packages/argument-condensation  packages/core  packages/data
packages/filters     packages/llm                    packages/matching  packages/question-info
```

Every one of those eight is a workspace whose manifest matches `:21`'s required list exactly. The
canonical-paradigm document told them what to declare, and `tsup` was not on it. 153-01 fixed the
eight manifests and added a standing guard (`scripts/assert-declared-binaries.mjs`, the 9th blocking
link of `lint:check`); it did **not** fix the document that produced them, so the next new package
authored from `:21` reproduces the defect and the guard catches it after the fact rather than the
document preventing it.

**This causal claim is not proven.** It is a plausible reading of a correlation (eight offenders, all
matching the document's list). It is recorded as a motivation, not as a finding.

### Unverified assumption

`153-RESEARCH.md` Assumption **A5** — *"`packages/README.md:21`'s omission of `tsup` from the required
devDeps is an oversight rather than deliberate"* — is **unverified**, and remains so after Plan 07.
Nothing was measured to distinguish oversight from intent. A deliberate reading is conceivable: not
every package listed under "Justified divergences" builds with `tsup` (`shared-config`, `dev-seed`,
`dev-tools`, `supabase-types` all have no-op or absent builds), so a drafter might have excluded it
as not-universally-required. That reading does not survive contact with `:21`'s own framing, which
describes the *canonical* shape rather than the divergent ones — but it has not been ruled out by
measurement, and the person who wrote the line has not been asked.

## The fix, and why Plan 07 did not take it

**One line.** Amend the "`package.json` shape." bullet's closing sentence to read:

> Required devDeps: `@openvaa/shared-config: workspace:^`, `tsup: catalog:`, `typescript: catalog:`,
> `vitest: catalog:`.

The `tsup: catalog:` form is what actually landed — 153-01 added `tsup: ^8.5.1` to `.yarnrc.yml`'s
catalog and flipped nine manifests to `"tsup": "catalog:"`. It is also now the form
`packages/shared-config/README.md` advertises, as of Plan 07 Task 1 (`e1f398792`), so amending `:21`
would bring the two documents into agreement.

**Not taken because:** `153-CONTEXT.md` scopes criterion 7 to the two files it names. `packages/README.md`
is a third file the criterion does not name, and expanding a criterion's file set unilaterally during
an unattended planning-and-execution run is not that run's decision to make. The reason is scope
discipline, not difficulty.

Plan 07's `<open_decision id="OQ-4">` states the mechanics if the operator rules it in scope: add
`packages/README.md` to `files_modified`, amend the sentence, and delete this todo as superseded.

## Rider 1 — `tsup` catalog entry: ANSWERED, do not re-open

The other OQ-4 rider — *"Does `tsup` get a `catalog:` entry? With 9 workspaces declaring it,
`.yarnrc.yml`'s own stated rule ('deps shared across 2+ workspaces') says yes"* — was **answered by
Plan 153-01, not deferred**. It is recorded here only so a reader of this todo does not re-open a
settled question.

**Disposition: yes, catalog.** Landed in `.yarnrc.yml` under the `# New entries (deps shared across
2+ workspaces)` header as `tsup: ^8.5.1`, with `"tsup": "catalog:"` in nine manifests (root plus the
eight offenders). 153-01 measured the lockfile delta as descriptor-only — 9 insertions, 1 deletion,
**zero** new `resolution:` lines, still exactly one `tsup@npm:8.5.1` resolution — which discharges
research assumption **A2**, previously flagged unmeasured.

- `.planning/phases/153-build-tooling-config-correctness/153-01-SUMMARY.md` — the measurement and the
  guard.
- `.planning/phases/153-build-tooling-config-correctness/153-NC-ROW-1-CFG-01.md` — the guard's
  negative control.

## Scope estimate

One line in one document. The cost is not the edit; it is deciding whether criterion 7's two-file
boundary was drawn deliberately or incidentally, and resolving assumption A5 with the person who
wrote `:21`.

## Cross-links

- `packages/README.md` — "Build pipeline." and "`package.json` shape." bullets of § Paradigm summary.
- `packages/shared-config/README.md` — corrected in Plan 07 Task 1 (`e1f398792`); the snippet a
  contributor pastes.
- `.planning/phases/153-build-tooling-config-correctness/153-07-PLAN.md` `<open_decision id="OQ-4">` —
  both riders and the mechanics of ruling rider 2 in scope.
- `.planning/phases/153-build-tooling-config-correctness/153-RESEARCH.md` § F.1, § OQ-4, Assumptions
  Log row **A5**.
- `.planning/phases/153-build-tooling-config-correctness/153-CONTEXT.md` — the two-file scoping of
  criterion 7, and **D-N2 (a)** (follow-ups land in `.planning/todos/pending/`, filed during the
  owning phase).
- `.planning/REQUIREMENTS.md` — **REVIEW-CFG-01** (the undeclared-binary class this omission plausibly
  produced) and **REVIEW-CFG-07** (this criterion).

## Tags

#documentation #build-tooling #canonical-paradigm #tsup #catalog #scope-boundary #deferred-from-153-07

## Resolved

Landed at `d7edc3da2` under operator ruling D10: `packages/README.md` now reads
`Required devDeps: @openvaa/shared-config: workspace:^, tsup: catalog:, typescript: catalog:,
vitest: catalog:`. Verified before editing — core declares `"tsup": "catalog:"`, 8 manifests declare
it, and shared-config's own README snippet already listed it.
