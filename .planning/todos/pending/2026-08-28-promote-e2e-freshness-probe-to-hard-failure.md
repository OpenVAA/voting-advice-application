---
created: 2026-08-28T00:00:00.000Z
title: Promote the E2E unowned-row probe from warn-by-default to fail-by-default, once two consecutive green no-reset runs are on record
area: tests
priority: medium
files:
  - tests/tests/setup/shared/setupFromTemplate.ts
  - tests/tests/setup/shared/base.setup.ts
filed_by: Phase 161 (161-05), as the second half of a deliberate two-step — re-aim now, promote later
---

## What exists today

`probeFreshDatabasePrecondition` in `tests/tests/setup/shared/setupFromTemplate.ts` asks whether the
project this run seeds into contains `candidates` or `organizations` rows whose `external_id` is not
prefixed with this template's prefix. It **warns** and continues. Strictness is opt-IN, via
`E2E_REQUIRE_FRESH_DB=true`:

```
$ grep -c "E2E_REQUIRE_FRESH_DB" tests/tests/setup/shared/setupFromTemplate.ts
1
```

An opt-in strictness knob is off in every run that matters, so in practice the probe is a console
warning inside a passing setup — the exact shape a reader skims past.

## Why it is not promoted yet

Two sources of benign noise fed this probe. One is now gone; the other is not.

- **Gone.** The probe used to also exclude a `seed_` baseline prefix, because the dev-seed `default`
  template's rows sat in the same project the suite read. The suite now owns a project of its own, so
  those rows are outside the probe's scope entirely and the exclusion was deleted rather than kept as
  a guard against something it can no longer see.
- **Remaining.** All test families still share ONE project — the suite's. Cross-family residue from
  an aborted run therefore still lands inside the probe's scope. It is **recoverable**: the base
  setup's `extraTeardownPrefix` pre-wipes exist precisely to clear it, and they run after the probe.
  Promoting the polarity today would convert a recoverable state into a run that refuses to start.

## The proposed change

Invert the polarity: fail by default, with an explicit opt-OUT for the case where a human knowingly
wants to run against residue. Keep the message naming the project scope, so a failure says which
project the unowned rows are in.

## Evidence prerequisite — do not promote without it

Two consecutive green full-suite runs with **no database reset between them**, taken by this phase,
showing **no probe warning in either**. That is the direct measurement of "the remaining noise source
does not fire in the steady state", and it is the only thing that distinguishes a promotion from a
guess. If either run warns, the residue is real and the promotion would have broken it.

## Related

`.planning/todos/pending/2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md` proposes the same
promotion as its option 2, from the other direction (a `yarn test:unit` run leaving the default
template behind). Per-project scoping already resolves the contamination that todo describes — the
seeded default-template rows are in the default project and the suite no longer reads it — so what
survives from that entry is only the promotion proposal, which is this one. Close the two together.

---

## DO NOT PROMOTE AS WRITTEN — measured 2026-09-05 (Phase 161, plan 09)

The evidence prerequisite above is not merely unmet; it is known FALSE at full-suite scope, and
re-attempting the promotion without changing the proposal would deterministically redden the suite
with no defect behind it.

**What was measured.** Across the phase's full-suite no-reset runs the probe emits **25 structural
warnings per run**. Every one of them names a concurrently-seeding `e2e-perm-*` sibling family, and
not one names residue from an aborted run. This is the "Remaining" noise source in the section above,
observed in the steady state rather than in a recovery state: all families share one project, they
seed in parallel, and each family's rows are by definition unowned from every other family's point of
view. The probe is therefore reporting the suite's normal concurrency, which fail-by-default would
convert into a refusal to start.

**What would have to change first**, and this is the real content of the item: either the probe's
scope narrows below the project (per-family ownership, so a sibling's rows are not "unowned"), or the
families stop sharing one project. Inverting the polarity alone is not the change; it is the change
that becomes possible after one of those.

Left OPEN deliberately, with the prerequisite now measured rather than merely stated.

