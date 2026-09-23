---
created: '2026-09-14T00:00:00.000Z'
title: Four of seven skill descriptions open with the same five words, so the layer where selection happens does not discriminate
area: docs
files:
  - .claude/skills/data/SKILL.md
  - .claude/skills/database/SKILL.md
  - .claude/skills/filters/SKILL.md
  - .claude/skills/matching/SKILL.md
  - CLAUDE.md
  - .claude/skills/README.md
resolves_phase: null
related_phase: null
---

## Problem

`.claude/skills/README.md` states the discriminativeness clause of its routing rule: "a
`description` earns its place by saying when to use this skill *rather than its neighbours*. A stem
shared across most of the corpus carries no routing signal, because selection happens once at the
description layer."

Phase 160 plan 09's Check B scores that clause. Reproduce with:

```bash
bash .claude/scripts/audit-skill-routing.sh 2>&1 | sed -n '/^Check B/,/^---/p'
```

Measured at commit `b90266ee7`, 2026-09-14: **four of the seven** live skills open their
frontmatter `description` with the identical five-word stem `domain expert for the openvaa`.

| Skill | Anchor | Opening |
| --- | --- | --- |
| `data` | `.claude/skills/data/SKILL.md:3` | `Domain expert for the @openvaa/data package -- the universal data model …` |
| `database` | `.claude/skills/database/SKILL.md:3` | `Domain expert for the OpenVAA Supabase backend: 17-table PostgreSQL schema …` |
| `filters` | `.claude/skills/filters/SKILL.md:3` | `Domain expert for the @openvaa/filters package -- entity filtering …` |
| `matching` | `.claude/skills/matching/SKILL.md:3` | `Domain expert for the @openvaa/matching package -- generic matching algorithms …` |

The three that do not share it — `components`, `ship-review-stack` and the generated spike-findings
skill — open on what distinguishes them, which is the shape the rule asks for. Two of those three
were rewritten by this phase; the four above were not, and are the residue.

## Why phase 160 did not fix it

Sharpening a description is cheap, and plan 09's task 2 says to prefer it. Two of that task's own
rules nevertheless route this to a filing rather than a fix, and both are load-bearing:

1. **The four files are outside the phase's blast radius.** Task 2 fixes in place only "when the fix
   is a flattening this phase already owns the surrounding file for", and files as a todo when it
   "touches a file outside this phase's `files_modified` across all nine plans". Re-derived at
   execution time — `git show --name-only` over every plan commit of phase 160 — the phase touched
   `.claude/skills/components/SKILL.md` and
   `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` and **no other
   `SKILL.md`**. These four are outside it.
2. **The phase boundary excludes them by name.**
   `.planning/phases/160-agent-docs-skills-refresh/160-CONTEXT.md` § _Phase Boundary_ reads: "Not in
   scope: rewriting the four `.claude/skills/*/SKILL.md` domain skills (`data`, `database`,
   `filters`, `matching`) … D-I1 explicitly restructures nothing."

## What fixing it costs, and what else moves with it

A description is not prose: it is the trigger the harness matches on, so rewriting four of them is a
behavioural change to skill selection and should be made deliberately, with the four new openings
read side by side. The edit is small; the fan-out is what makes it a task rather than a drive-by.
Each of the following names or counts the current descriptions and moves in the same commit:

- `CLAUDE.md` § _Skill Routing_ carries a one-line summary per skill that should stay consistent
  with the description it routes to.
- `.claude/skills/README.md` § _The routing rule_ records "four of the seven … open with the
  identical stem", and § _Adding a skill_ says "the corpus already has four of those out of seven
  live skills". Both figures become zero.
- `.claude/skills/README.md` § _Conformance record_ carries a per-skill Check B verdict that flips
  from VIOLATION to OK for all four.
- `.claude/scripts/audit-skill-drift.sh` baselines each skill on the last commit touching its
  directory, so the edit resets the drift baseline for all four — recorded here so a later green run
  is not mistaken for evidence that their listings were re-checked.

A good opening says what the skill decides that its neighbours do not — for example, which package
the file you are editing lives in for `data`/`filters`/`matching`, and that `database` owns
`apps/supabase` and the generated types rather than any package model. Re-run the Check B command
above after the edit; the stem should disappear from the "Shared opening stems" list entirely.

## What this check cannot tell you

Check B is a floor, not a proof (flagged assumption A9-2 of plan 09). It detects a shared literal
opening stem. Four descriptions that are superficially varied but still fail to say *when to use
this one rather than its neighbour* would score OK. Read the four openings side by side after
rewriting them; a green Check B is a necessary condition, not a sufficient one.
