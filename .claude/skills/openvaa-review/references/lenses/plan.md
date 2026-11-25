# Lens: Plan soundness · ID prefix `PLN`

**Applies when** the review runs in `--plan` mode, and only then. It asks whether the plans can be executed as written and would deliver what was agreed. The other lenses judge the design the plans propose; this one judges the plans as instructions.

List the plans in the order they would run: plan, wave or dependency, the goal or requirement it claims, and the files it says it will touch.

## Evaluate (criterion slugs)

- `pln-false-premise`: the plan states something about the tree that is not true at the reviewed head. A symbol, file, column, prop, script or message key it names is absent, lives elsewhere, or has a different shape. Search before claiming, and quote what is actually there. An executor that meets a false premise improvises, which is how a plan ships a defect nobody reviewed.
- `pln-verify-vacuous`: a verify or acceptance command that would pass on the tree as it is now, before any task runs; that cannot run at all (wrong path, a filter matching zero tests, a missing project name); or that covers less than the change's blast radius. Say which, and give the command that would go red then green.
- `pln-goal-gap`: every task completing would still leave the phase goal, a success criterion or a claimed requirement undelivered. Work backwards from the goal, not forwards from the task list.
- `pln-decision-drift`: the plan contradicts a decision recorded in the context or discussion files, reopens one that was declined, or settles silently a question those files leave open.
- `pln-unaddressed-review`: a concern raised in an earlier review of these plans is neither reflected in the plan nor recorded as declined.
- `pln-order`: a task depends on something a later task or wave creates; two plans in one wave edit the same file; a migration, `yarn db:types` regeneration or generated-content step is missing between the tasks that need it.
- `pln-scope`: work the goal does not ask for, or an item the context files deferred.
- `pln-underspecified`: a task the executor can only carry out by making a design decision the plan should have made: which component to extend, where a rule lives, what a state is called.
- `pln-e2e-ruling`: E2E work follows CLAUDE.md § E2E Hard Rule as amended for phases — inside a phase, a plan makes targeted runs only (one `tests/scripts/e2e-run.sh … --project <p>` per affected project), each new or rewritten test is run red first and then green, and the plan records its project test-count deltas against the last full run; only the phase's final plan (or its verification) runs the full suite. A plan that schedules a full run mid-phase, skips red-first, or omits the deltas is the finding.
- `pln-content-anchor`: every anchor, grep or acceptance criterion cites content (a symbol, a heading, a string), never a line number, and derives counted populations at run time rather than hard-coding a count the plan's own tasks will move.
- `pln-gate-not-piped`: no verify command reads a gate's exit status through a pipe (`yarn lint:check | grep …` reports `grep`'s status). The status is captured directly or through `${PIPESTATUS[0]}`.
- `pln-stack-authorisation`: a step needing the shared local Supabase stack (`yarn db:reset`, `db:stop`, an E2E run) proceeds under the standing authorisation rather than stopping at a checkpoint to ask whether the stack is free. A checkpoint is still right for a genuine decision.

## Where to look

The plans themselves; the context files listed in `plans.json` (context, discussion, research, earlier reviews, the roadmap entry and requirements); the tree at the reviewed head for every premise; `tests/README.md` § Run for the E2E commands.

## Not a finding

A plan's prose style, its length, or a task split you would have cut differently. A premise that is false today because an earlier task in the same plan set creates it.

## Promote to

The GSD planner and plan-checker guidance; `.agents/code-review-checklist.md` only when the same design mistake also reaches code review.

<!-- skill-link-allow: plans.json -->
