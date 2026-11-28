# Lens: Tests · ID prefix `TST`

**Applies when** the PR adds or changes test files (unit `*.test.ts`, pgTAP under `apps/supabase/supabase/tests/`, Playwright under `tests/`), E2E fixtures, dev-seed templates the E2E suite uses, visual baselines, or a source guard under `scripts/assert-*.mjs`. Read `tests.diff`. Do **not** list all tests. Open with a 2–3 line characterisation instead: what kinds were added (unit, component, pgTAP, E2E, visual, source guard) and roughly how many of each.

## Evaluate (criterion slugs)

- `tst-merge-only`: tests that helped the author while building but will not protect anything later. Run `python3 .claude/skills/openvaa-pr/scripts/flag_prunable_tests.py --base $MB` first and judge each line; some flags are wrong. Signs: they assert the implementation (mock call order, internal state) instead of behaviour; re-assert a type the compiler enforces; pin a constant to its current value; snapshot large output nobody will read on failure. Recommend deleting or rewriting them. Deleting tests is a legitimate recommendation.
- `tst-invariant-blocks-change`: the repo has many source guards (`yarn assert:*`). A new guard must forbid a hazard — authority, project scoping, a runtime boundary, a reactivity invariant — not pin today's shape or a count, and its failure message must tell a future developer what to do. A guard marked `KEEP-GUARD: <hazard>` names the hazard it forbids; check the hazard is real.
- `tst-invariant-weak`: a source guard satisfied by an import line or a comment, because it matches a name rather than the call.
- `tst-e2e-paradigm`: specs express behaviour through fixtures and semantic steps (`tests/tests/fixtures/{voter,contestant,admin,shared}/`), not raw selectors and waits in spec bodies. The data comes from a dev-seed template (`packages/dev-seed/src/templates/e2e/`); the suite owns its project and never assumes a cleared database.
- `tst-no-flake-tolerance`: no `retries`, `waitForTimeout`, `.skip`, `.fixme`, `test.fail`, or a raised timeout hiding a race. Each one is a finding under CLAUDE.md § E2E Hard Rule. Probe specs carry `@probe`, and coverage tags are present (`yarn assert:e2e-coverage-tags`).
- `tst-red-first`: a new or rewritten E2E test has a recorded red run before its green one. Plan and fix mode only, read from the plan, its summary or the fix run's record.
- `tst-visual-baseline`: a re-baselined screenshot says why the pixels changed, and the image diff matches that reason.
- `tst-pgtap-patterns`: BEGIN/ROLLBACK boundaries, `create_test_data()` fixtures, and the right assertion for each case (`ok()`, `lives_ok()` + `is()` for silent RLS denial, `throws_ok()`).
- `tst-gap`: flag a missing test only where the PR adds branching authority, visibility, matching or filtering logic with **no** test at all, and a regression would be silent. Don't ask for coverage for its own sake.
- `tst-pins-incidentals`: a test asserts the behaviour, not incidental counts or prose. It doesn't pin an exact count that grows with the codebase (number of specs, soft assertions, grants, files: use a ceiling or derive the expected set from its source), an exact dependency version a caret range allows, or the wording of its own or the code's docstrings and comments.

## Where to look

`tests/README.md`, `tests/tests/fixtures/`, `tests/tests/specs/`, `scripts/`, `apps/supabase/supabase/tests/database/`.

## Promote to

`tests/README.md`; `.agents/code-review-checklist.md`.

<!-- skill-link-allow: test.fail -->
<!-- skill-link-allow: tests.diff -->
