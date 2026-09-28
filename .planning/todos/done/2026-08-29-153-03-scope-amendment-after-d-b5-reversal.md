---
title: 153-03 must not run as written — its whole premise (option a, `node-version-file: package.json`) was ruled against and separately measured not to bind
created: 2026-08-29
updated: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 02
priority: high
suggested_phase: 153-build-tooling-config-correctness
keywords: [REVIEW-CFG-02, D-B5, OQ-2, setup-node, node-version-file, engines, preinstall, assert-node-engine, negative-control, main.yaml, A3]
---

# 153-03 needs re-planning before it executes

## Why this is filed rather than fixed

Plan 153-02's Task-2 acceptance criteria say that if the operator rules for option (b),
*"153-03's scope is amended accordingly before it runs"*. The operator did rule for (b). Amending
another plan's `must_haves` is a planning act, not an execution one, and 153-03's Task 2 would have
to be substantially re-derived rather than edited — so the amendment is recorded here instead of
being improvised by 153-02's executor. **153-03 should be re-planned, not executed as written.**

## What changed

Two independent things, both measured:

1. **The operator reversed the earlier decision** and selected option (b), install-time binding via
   a repository-owned script. That decision's own contingency text says: for (b), *"drop 153-03's
   `node-version-file` edit to `main.yaml`"*.

2. **Option (a) was measured not to do what 153-03 assumes it does.** Read at the tag the workflow
   pins, `actions/setup-node`'s resolver returns `null` when `engines.node` is absent, and its
   caller answers `null` with `core.warning('Could not determine node version from …. Falling
   back')` and an empty version — installing no Node at all and continuing on the runner's default.
   A warning annotation is not a failure. The full measurement, with commands, commit SHAs and
   quoted source, is in `153-A3-SETUP-NODE-MEASUREMENT.md`.

## The specific statements in 153-03 that are now false

| Location | Statement | Status |
|---|---|---|
| `must_haves.truths[0]` | "All four `node-version: 22.22.1` inputs … are replaced by `node-version-file: package.json`" | **Dropped.** The ruling removes this edit. |
| `must_haves.truths[1]` | the negative control is "setup-node run against a deliberately corrupted copy of the manifest" | **Re-derive.** Under (b) the thing that rejects is the repository's guard, not setup-node. |
| `must_haves.truths[2]` | "The job records the Node version it actually resolved" | **Re-derive.** Nothing resolves a version from the manifest under (b). |
| `must_haves.truths[5]` and the backstop truth | criterion 2's observation "is **not claimed as made** … CI only" | **Superseded.** The observation was made locally and is no longer CI-blocked; see below. |
| `key_links[0]` | "`node-version-file: package.json` → root `package.json` `engines.node`" | **Dropped.** |

## What 153-03 is still worth doing

The criterion-2 observation is no longer blocked on a PR to `main`. Plan 153-02 observed it directly,
both halves, against real runtimes installed on the developer machine: `yarn install` under Node
v20.18.1 fails with exit 1 and a build log naming the guard, while v22.4.0 / v24.14.1 / v25.2.1 all
pass. So a CI job is no longer the only place the constraint can be seen to bind.

What CI can still add, and what a re-planned 153-03 should probably consist of, is a **standing**
negative control — a job that runs the repository's own guard under a deliberately out-of-range Node
and asserts it exits non-zero, so the guard's rejecting half cannot silently rot. That job is
self-asserting (green when the constraint binds), needs no manifest corruption, and does not require
`node-version-file` at all. 153-03's existing security discipline for the new job — no `set -x`, no
`secrets.`, writes only to `$GITHUB_ENV`, no matrix or dispatch input — carries over unchanged.

## A separate trap, if `node-version-file` is ever revisited

`engines.node` is `">=22"` — a range, not a pin. `setup-node` returns the raw range string and
resolves it to the newest matching release. Swapping `node-version: 22.22.1` for
`node-version-file: package.json` would therefore **unpin every CI job from 22.22.1 to whatever the
latest `>=22` Node is on the day it runs**. That is a behavioural change to all four jobs, and it is
not mentioned anywhere in the research that recommended the swap.

---

## Resolved

**Resolved by plan `153-03`, 2026-08-29**, and moved here rather than left in `pending/`: a todo
reading *"153-03 must not run as written"* becomes an active false record the moment 153-03 has
run — the very class of record the rest of this phase is careful about.

`153-03-PLAN.md` was **re-planned** (commit `d7338722f`), not edited, exactly as this filing asked.
It now ships a standing CI negative control over `scripts/assert-node-engine.mjs` — the guard
`153-02` shipped under option (b) — and carries no `node-version-file` edit at all.

Disposition of each statement this filing marked false, one row per row of the table above:

| Falsified statement | What the re-plan did |
|---|---|
| `truths[0]` — "all four `node-version: 22.22.1` inputs … are replaced by `node-version-file: package.json`" | **Dropped, and inverted into a prohibition.** The four pins are provably untouched (`git diff --numstat` reads `86 0` for `main.yaml` — 86 added lines, zero deleted), and a standing spec now asserts that no version-file input exists anywhere in the file, so the trap cannot be walked into silently later. |
| `truths[1]` — the control is "setup-node run against a deliberately corrupted copy of the manifest" | **Re-derived.** The control now runs the REPOSITORY'S guard, by path, under a deliberately out-of-range `20.x` and the in-range `22.22.1`, asserting both directions. No manifest is corrupted; nothing is reimplemented. |
| `truths[2]` — "the job records the Node version it actually resolved" | **Re-derived.** Nothing resolves a version from the manifest under (b). The job instead asserts the guard's failure MESSAGE — the `assert-node-engine: this Node is ` discriminator — because the guard exits 1 for four reasons unrelated to the running Node's version, so an exit-code-only assertion would report green while the comparator had stopped comparing. |
| `truths[5]` + the backstop truth — criterion 2's observation "is not claimed as made … CI only" | **Superseded, and the correction was made load-bearing.** `153-NC-ROW-6-CFG-02.md` opens with Part 1 stating in an unambiguous sentence that the binding was observed by `153-02` and is NOT re-claimed. What remains CI-blocked is the JOB's first run, not the binding — a distinction the re-derived todo `2026-08-28-153-cfg-02-ci-observation-blocked-on-pr-to-main.md` now states explicitly, because `153-09-PLAN.md` still carries the older framing and would otherwise inherit it. |
| `key_links[0]` — "`node-version-file: package.json` → root `package.json` `engines.node`" | **Dropped.** Replaced by three links: the job → the guard by path; the standing spec → the job's existence, its reject-reason assertion and the version-file input's absence; and `engines.node` → the job's out-of-range major, asserted strictly below the declared bound. |

Two further points this filing raised were carried forward rather than dropped:

- **"153-03's existing security discipline … carries over unchanged."** It was carried over and
  TIGHTENED. The new job writes to no runner environment file at all, because nothing needs to cross
  a step boundary — strictly stronger than the "writes only to `$GITHUB_ENV`" discipline named here.
  It also enables no shell tracing, references no `secrets.`, echoes no environment dump, and takes
  no external input: no matrix, no workflow input, no dispatch trigger, no `pull_request_target`.
- **The `>=22` range-resolution trap.** Quoted verbatim in `153-NC-ROW-6-CFG-02.md` Part 2 and
  converted from a warning in prose into a standing assertion, which is the only form that survives
  the next reader who sees a duplicated literal and tidies it up.

Option (c) of OQ-2 — the third-party `devoto13/yarn-plugin-engines` — remains REJECTED on
supply-chain grounds; it was not adopted, installed or fetched.
