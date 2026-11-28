---
title: A Markdown-only change can break a unit test, but `paths-ignore "**.md"` guarantees CI never runs it
created: 2026-09-14
source_phase: 160-agent-docs-skills-refresh
source_plan: regression-gate
resolves_phase: null
priority: medium
suggested_phase: future-ci-hygiene
keywords: [main.yaml, paths-ignore, ci, dev-seed, e2eDocPreconditionGate, doc-guard, markdown]
---

# `paths-ignore: "**.md"` and doc-reading guards are mutually exclusive, and the repo has both

## What happened, measured

Phase 160 Plan 06 trimmed `CLAUDE.md` from 30,555 B / 437 lines to 28,038 B / 341 lines. Two of
the reworded lines are allowlisted **by verbatim string** in
`packages/dev-seed/tests/e2eDocPreconditionGate.test.ts`:

- `packages/dev-seed/tests/e2eDocPreconditionGate.test.ts:98` — the `db:reset-with-data` command-map comment
- `packages/dev-seed/tests/e2eDocPreconditionGate.test.ts:103` — the `**Database issues**` troubleshooting bullet

The rewording failed the guard in **both directions at once**: the old allowlist entries matched
zero occurrences (`keeps the allowlist exact`), and the new wordings read as unaccounted-for
mentions of the reset command (`leaves no occurrence unaccounted for`). Two failures,
`@openvaa/dev-seed` 2 failed / 776 passed.

Fixed in `1a960b39e` by resyncing the two `text:` fields. Neither `reason:` needed changing —
the lines had not changed meaning.

## Why this is a filing and not just a fix

`.github/workflows/main.yaml` carries `paths-ignore: "**.md"` on **every** trigger form (push,
pull_request, and the `ci-evidence/**` push path — re-measured in Phase 160 Plan 04, which found
the trigger set wider than the roadmap stated while the `paths-ignore` conclusion survived).

So: this repository contains at least one test that **reads Markdown and fails on its content**,
and a CI configuration that **guarantees no Markdown-only change ever runs that test**. A
documentation edit can therefore leave `main` red-on-merge-with-code but green in every check
that ran on the PR that introduced it. Phase 160 caught this only because its own execution ran
`yarn test:unit` as a regression gate; nothing in CI would have.

The same exposure applies to every doc-reading guard, not only this one. `e2eDocPreconditionGate.test.ts`
alone reads `CLAUDE.md`, `tests/README.md` and the dev-seed docs; `audit-skill-links.sh` and
`audit-skill-routing.sh` (both added in Phase 160) read `.claude/skills/**/*.md` plus `CLAUDE.md`
and are not wired into CI at all.

## Options, costed

1. **Narrow the ignore** — drop `**.md` and replace it with an ignore list that excludes only
   documentation no guard reads (e.g. `apps/docs/src/routes/**/*.md`, `.planning/**`). Cheapest
   correct fix; cost is CI minutes on doc-only PRs.
2. **Add a doc-guard job with its own trigger** — a small job that runs only the doc-reading
   guards (`e2eDocPreconditionGate`, `audit-skill-links.sh`, `audit-skill-routing.sh`) and fires
   on `**.md` rather than being excluded by it. Keeps the main job cheap; cost is a second
   workflow surface to maintain, which this repo already has a filing about
   (`2026-09-03-163-main-yaml-shared-surface-for-164.md` — coordinate with it).
3. **Make the allowlist structural rather than verbatim** — key entries on a stable anchor (a
   heading plus a command token) instead of the full sentence, so a rewording that preserves
   meaning does not trip the guard. Narrowest fix; does not address the other doc-reading guards
   or the CI gap at all, and weakens the guard's precision.

Option 1 or 2 addresses the class; option 3 only reduces how often this particular guard fires.

## Verification when fixed

Reword any allowlisted line in `CLAUDE.md`, push a Markdown-only commit, and confirm the guard
runs and fails in CI rather than passing silently. A green run on a doc-only PR that does not
execute `e2eDocPreconditionGate.test.ts` is the bug, not the fix.
