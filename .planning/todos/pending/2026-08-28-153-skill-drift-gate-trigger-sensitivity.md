---
title: Should the skill-drift gate be permanently blocking, given its baseline is "the last commit touching the skill's own directory"?
created: 2026-08-29
updated: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 08
priority: medium
suggested_phase: 160-agent-docs-skills-refresh
keywords: [skill-drift, audit-skill-drift, gate-design, advisory-vs-blocking, OQ-1, D9, D-B1, targets, ci-gate, phase-160, phase-163, phase-164]
---

# Is a permanently-blocking skill-drift gate the intent?

## The question, verbatim from `153-RESEARCH.md` § OQ-1

> the audit's baseline is "the last commit touching the skill's own directory", so **any** commit
> under a target directory reddens it until a human re-reviews the skill. Phases 152, 163 and 164 all
> touch such directories, and **Phase 153 itself** would re-red `ship-review-stack` … and `database`
> …. Is a permanently-blocking gate with that trigger sensitivity the intent, or should the check be
> advisory (`exit 0` + annotation) with a separate periodic review?

Plan `153-08` surfaced this rather than answering it unilaterally, because the answer changes whether
REVIEW-CFG-05 is even *stably* satisfiable. It is filed, not resolved.

## Why it is a real question and not a complaint about strictness

**This is not hypothetical: it fired inside the very plan that resolved the drift.** `153-08` Task 2
edited `.claude/scripts/audit-skill-drift.sh` — a declared target of the `ship-review-stack` skill —
and the audit immediately reported `ship-review-stack DRIFT 1 commits, 1 files`. The plan had to
order its own commits so the freshness record landed *after* the script edit. **A gate that its own
repair reddens is at minimum worth a design decision.**

## The evidence, measured 2026-08-29 (do not re-derive it)

**Five of eight skills are actively checked.** `architect` and `components` declare `targets: []`;
`spike-findings-voting-advice-application-gsd` omits the key. The other five declare real, existing
directories:

| Skill | `targets:` |
|---|---|
| `data` | `packages/data/src/` |
| `database` | `apps/supabase/`, `packages/supabase-types/` |
| `filters` | `packages/filters/src/` |
| `matching` | `packages/matching/src/` |
| `ship-review-stack` | `.agents`, `.claude/scripts`, `.planning/phases/151-ship-v0-2-akita-review-stack/scripts` |

**The trigger fires on comment-only commits.** Of the four skills drifting at `d7edc3da2`, three were
reddened wholly or partly by Phase 152's comment/formatting sweeps, and for two of them the sweeps are
the *entire* cause with **zero** non-comment changed lines:

| Skill | Drifting commits | Non-comment changed lines |
|---|---|---|
| `filters` | `dce80642f` (unwrap forced line breaks), `87e02f40b` (comment sweep) | **0** |
| `matching` | `dce80642f` | **0** |
| `data` | 5 commits | 28, **every one inside a `*.test.ts`** |
| `database` | 21 commits | Phase 152's four sweeps: **0** across `schema/`, `migrations/`, `tests/`. Phase 155's Edge Function work: substantial, and it **did** leave the skill stale. |

Method, so it can be repeated:
`git diff -w <skill-baseline>..HEAD -- <target>`, with `+++`/`---` headers, comment lines and blank
lines filtered.

**But the gate is not merely noisy — it earned its keep once in this same review.** `database`'s
Service Patterns § 6 asserted that `identity-callback` binds audience and issuer *"each only when
configured"*. Commit `869a01d60` had made both **unconditional** and deleted the in-source comment
arguing for the fail-open. Without the audit nobody would have looked, and every agent loading that
skill would have been told the opposite of the truth about an authentication path. **Any proposal to
soften this gate has to keep that catch.**

**Named phases that will redden it again.** Phase 152 (fixture rename under `packages/data/src/`,
comment sweeps across `apps/**`), Phase 163 and Phase 164 (both in `apps/supabase/`). The green
recorded in `153-NC-ROW-5-CFG-05.md` is explicitly a **snapshot at HEAD `c1f43b30d`**, not a standing
property.

## The options, as they stand

- **(i) Keep it blocking, unchanged.** What ruling D-B1 currently implies. Cost: any commit under a
  target directory — including a comment sweep — blocks CI until a human writes a freshness record.
- **(ii) Advisory: `exit 0` plus an annotation**, with a separate periodic skill review.
  ⚠ **Careful:** removing the tail's `exit 1` is *the exact prohibition* `153-01` set and D9 restated
  as absolute — the audit must not be silenced to make a criterion green. Doing it as a **deliberate,
  recorded design decision** is a different act from doing it to pass a gate, but the two are
  indistinguishable in a diff, so the decision must be written down where the script's reader will
  find it.
- **(iii) Narrow the trigger** — e.g. ignore commits whose diff under the target is comment-only, or
  compare against a content hash rather than a commit pointer. Keeps the gate blocking while removing
  the class of noise measured above. Costs real work in the script and needs its own negative control
  (a gate that examines nothing also reports green).
- **(iv) Per-skill severity** — blocking for skills whose targets are behavioural source
  (`database`, `data`), advisory for documentation-shaped ones.

No recommendation is recorded here on purpose; this is an operator decision.

## Constraints any answer must respect

1. **The prohibition stands until explicitly lifted.** The audit must not be silenced — not by
   emptying or narrowing a `targets:` list, not by forcing a zero exit, not by deleting a skill — *in
   order to make a criterion green*. (`153-01`; restated as absolute by **D9**.)
2. **A gate that examines nothing also reports green.** Any change must be flip-tested on both halves,
   with both results recorded verbatim.
3. **Whatever is decided, `filters` and `matching` still need a freshness review** — see the cross-link
   below. Making the gate advisory would remove the *blocking*, not the *staleness*.

## Cross-links

- `.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § **D9** — hands `filters` and `matching` to
  **Phase 160 (`agent-docs-skills-refresh`, wave H)** and restates the anti-silencing prohibition.
- `.planning/phases/153-build-tooling-config-correctness/153-NC-ROW-5-CFG-05.md` — Part 4b (the
  attribution for `filters` and `matching`) and Part 6 (the snapshot caveat).
- `.planning/todos/pending/2026-08-28-153-cfg-05-ci-observation-blocked-on-pr-to-main.md` — the CI
  observation. **If this gate is made advisory, that filing's premise changes**, so read the two
  together.
- `.claude/skills/ship-review-stack/SKILL.md` § "The seven scripts" — now carries the two
  shell-portability conventions this episode earned.

## Tags

`skill-drift` `gate-design` `advisory-vs-blocking` `OQ-1` `phase-160` `operator-decision-needed`
