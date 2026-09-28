---
phase: 160
slug: agent-docs-skills-refresh
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-28
---

# Phase 160 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded by `/gsd-plan-phase 160` from `160-RESEARCH.md` § *Validation Architecture*.

**Nyquist inversion for this phase.** Phase 160 changes no runtime behaviour — its
deliverables are Markdown, YAML frontmatter, one deletion, and (optionally) one shell
script. **The sampling target is documentation truth, not code behaviour.** Every
per-task check below is therefore a *doc assertion* (a `grep`/`test` over the written
artifact) rather than a unit test. The repo's existing suites serve only as regression
guards.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + Playwright (E2E) — both pre-existing; **neither is extended by this phase** |
| **Config file** | `vitest.config.ts` per workspace; `playwright.config.ts` at root |
| **Quick run command** | the per-task doc assertion (`grep`/`test`) named in the map below — sub-second |
| **Full suite command** | `yarn lint:check` **+** `bash .claude/scripts/audit-skill-drift.sh` **+** `yarn test:e2e` |
| **Estimated runtime** | doc assertions <1s · `lint:check` ~1–2 min · `test:e2e` full suite |

**Docs-specific gate available:** `yarn workspace @openvaa/docs validate:links`
(`apps/docs/package.json:25` → `scripts/validate-links.ts`, confirmed to exist).

---

## Sampling Rate

- **After every task commit:** run that task's doc assertion from the map below.
- **After every plan wave:** `bash .claude/scripts/audit-skill-drift.sh` — **read its
  output text, not its exit code** (see *Pitfall* below).
- **Before `/gsd-verify-work`:** `yarn lint:check` green **+** the link-integrity check
  **+** a full `yarn test:e2e` run per the repo's cardinal E2E rule. Waves that touch
  files Phase 159 also touches must not be the ones that ship a red suite.
- **Max feedback latency:** <1s per task; ~2 min per wave; full-suite at the phase gate.

### Pitfall — the drift guard cannot self-certify this phase

`.claude/scripts/audit-skill-drift.sh` baselines each skill on
`git log -1 -- "$skill_dir/"`. Phase 160's own commits into `.claude/skills/data/` and
`.claude/skills/database/` reset both currently-DRIFTing skills to green **mechanically**,
whether or not any listing was actually re-checked. Compounding this,
`.github/workflows/main.yaml` carries `paths-ignore: "**.md"`, so this all-Markdown phase
does not trigger the workflow at all.

**Therefore:** a green `audit-skill-drift.sh` is NOT evidence that criterion 2's reflexive
self-check passed. Treat the script's *output text* (which skills it checked, which it
skipped) as the signal; treat criterion 2 as verified only by the explicit doc assertions.

---

## Per-Task Verification Map

Task IDs are assigned by the planner; this table is seeded at the requirement level and
is expanded to per-task rows by `/gsd-validate-phase`.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | REVIEW-DOC-01 | — | N/A | doc assertion | `grep -n 'constituency per election' .claude/skills/data/object-model.md && grep -n 'OrganizationNomination' .claude/skills/data/object-model.md` | ✅ | ⬜ pending |
| TBD | TBD | TBD | REVIEW-DOC-02 | — | N/A | doc assertion | `for f in data database filters matching; do grep -q 're-check' .claude/skills/$f/extension-patterns.md \|\| echo "MISSING: $f"; done` | ✅ | ⬜ pending |
| TBD | TBD | TBD | REVIEW-DOC-02 | — | N/A | doc assertion | `grep -n 'dev-seed' .claude/skills/database/extension-patterns.md` · `grep -n 'e2e\|E2E' .claude/skills/filters/extension-patterns.md` | ✅ | ⬜ pending |
| TBD | TBD | TBD | REVIEW-DOC-03 | T-160-01 | Recorded measurement is reproducible | doc assertion | `grep -E '464,?728' <recorded-measurement-file>` + re-run the byte-count command and compare | ✅ | ⬜ pending |
| TBD | TBD | TBD | REVIEW-DOC-03 | T-160-02 | No dangling `Skill()` pointer survives a skill deletion | source assertion | `grep -rn 'spike-findings-voting-advice-application-gsd' CLAUDE.md .claude/ .agents/ .planning/ \| grep -v '^\.planning/phases/160'` returns only intentional historical mentions | ✅ | ⬜ pending |
| TBD | TBD | TBD | REVIEW-DOC-04 | — | N/A | doc assertion | grep the load-bearing phrases of the Context Destructuring Rule + Spike-024 carve-out in the relocation destination; assert `CLAUDE.md` routing pointer resolves | ✅ | ⬜ pending |
| TBD | TBD | TBD | REVIEW-DOC-04 | T-160-03 | Corrected factual claims match source | source assertion | `grep -n 'db:lint:sql' package.json` and `grep -n 'format' packages/app-shared/tsup.config.ts` agree with the new `CLAUDE.md` text | ✅ | ⬜ pending |
| TBD | TBD | TBD | REVIEW-DOC-01..04 | T-160-04 | `targets:` entries are directories, not files | config assertion | for each new `targets:` entry `T`: `[ -d "$T" ]` | ✅ | ⬜ pending |
| TBD | TBD | TBD | REVIEW-DOC-01..04 | — | N/A | link integrity | the Wave 0 checker below over `.claude/skills/**` + `CLAUDE.md` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | REVIEW-DOC-01..04 | — | N/A | regression | `yarn lint:check` | ✅ | ⬜ pending |
| TBD | TBD | TBD | REVIEW-DOC-01..04 | — | N/A | regression | `yarn test:e2e` (full suite, cardinal rule) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] **A path/link-integrity check over `.claude/skills/**` and `CLAUDE.md`.** Research
      supplies the evidence that it is needed: 15 dangling schema names in 51 places,
      one dangling `.svelte` path inside the very essay this phase relocates, one drifted
      line range, 5 dangling directory rows in `BOUNDARIES.md`, 6 broken `docs:*` script
      references. A ~40-line script that extracts backticked `path.ext` tokens and
      `NNN-*.sql` names and asserts existence would have caught every one of them.
      - **Scope fence:** making it a *blocking CI gate* is Phase 163's work. Landing it
        as a script this phase runs manually — which 163 later wires — respects the
        boundary. **The choice must be recorded in the plan.**
- [ ] No test-framework install needed. No new dependency needed.

*If the planner declines the checker: file it as a pending todo carrying the six anchors
above, and record the declination.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The relocated Context Destructuring Rule and Spike-024 carve-out are *not weakened* — meaning intact, discoverable, and normatively as strong as before | REVIEW-DOC-04 | "Not weakened" is a semantic property; a grep proves the words moved, not that the invariant still binds a reader | Read the destination end to end against `CLAUDE.md:327-378` at the pre-phase commit. Confirm: (1) every normative MUST/MUST NOT survives; (2) the canonical-pattern code block survives; (3) the `dataRoot` `#version` hole and its "read `ctx.dataRoot.<prop>` directly" remedy survive; (4) an agent following only the `CLAUDE.md` routing pointer reaches it in one hop. |
| The recorded keep/delete judgement for `spike-findings-*` reads as an argument a future maintainer can re-evaluate, not as a verdict | REVIEW-DOC-03 | Reasoning quality is not machine-checkable | Read the recorded rationale. It must state the in-tree preservation basis (`.planning/spikes/`, 24 spikes, superset) and must NOT rest on "available from git history" — the repo squash-merges and the skill's add commit is not an ancestor of `main`. |
| The `CLAUDE.md` decision under criterion 4 records *its argument*, including if the decision is "keep as is" | REVIEW-DOC-04 | Same | Read it. It must quote `PRE-SHIP-REVIEW-TRIAGE.md:346`/`:362` rather than the unread papers (Assumption A1). |
| Criterion 1's constituency rules are sourced to the reviewer and not asserted as model-enforced invariants | REVIEW-DOC-01 | Assumption A2: no enforcing code was found in `@openvaa/data`; asserting enforcement would put a false claim in the skill | Read the new `object-model.md` prose: it must describe *selection semantics*, attributed, not class invariants. |

---

## Validation Sign-Off

- [ ] All tasks have an `<automated>` doc assertion or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without an automated verify
- [ ] Wave 0 covers the link-integrity MISSING reference (or its declination is recorded)
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s per task
- [ ] The drift-guard self-certification pitfall is honoured — no criterion is marked
      verified on a green `audit-skill-drift.sh` alone
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
