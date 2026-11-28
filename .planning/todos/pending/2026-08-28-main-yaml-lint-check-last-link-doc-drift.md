---
title: main.yaml's type-check step comment calls `yarn typecheck` the lint chain's last link — it is the fourth of seven
created: 2026-08-28
source_phase: 152-comment-naming-hygiene-sweep
source_plan: 15
priority: low
suggested_phase: future-ci-hygiene
keywords: [main.yaml, ci, lint:check, typecheck, chain-membership, doc-drift, 144-06, 152-01]
---

# `main.yaml:70` states a chain position that has not been true since the commit that wrote it

## The false statement, verbatim

`.github/workflows/main.yaml:65-88` is the explanatory comment above the
`Type-check all packages (turbo run typecheck)` step. Line 70 reads:

```yaml
      # job. But `yarn lint:check` chains `yarn typecheck` as its last link, and GitHub
      # Actions aborts a job at the first non-zero step: while this step sat BELOW the
```

## Why it is false

The root `package.json` `lint:check` script is a seven-link `&&` chain:

```
turbo run lint
  && eslint --flag v10_config_lookup_from_file tests
  && yarn typecheck:tests
  && yarn typecheck                       <- link 4 of 7, not the last
  && yarn assert:i18n-catalog-namespaces
  && yarn assert:a11y-scan-wiring
  && yarn assert:comment-hygiene          <- the actual last link
```

`yarn typecheck` is the **fourth of seven** links. It has not been the last link at any
point in this branch's history.

## The commits, measured rather than assumed

| Commit | What it did |
|---|---|
| `a16b983fc` "chore: wire the invariant guards into CI and the root scripts" | **Wrote this comment AND falsified it in the same commit.** Its `package.json` diff appends `&& yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring`, so `typecheck` was already link 4 of 6 the moment the sentence was written. |
| `b410d3a90` "fix(144): assert typecheck's chain MEMBERSHIP in lint:check, not its position" | Relaxed `packages/dev-seed/tests/ciTypecheckGate.test.ts` from asserting terminal POSITION to asserting MEMBERSHIP, which is what makes appending further links a legal change rather than a red suite. It changed no script. |
| `07b7baf12` "feat(152-01): comment-hygiene guard, wired live into lint:check" | Appended the **seventh** link, moving `typecheck` one place further from the end. |

**A correction to the premise this item was filed under.** Phase 152's plan for this
item stated that the sentence "stopped being true when the chain-membership fix landed".
It did not: `a16b983fc` is an ancestor of `b410d3a90`, and the sentence was false on
arrival. `b410d3a90` is the commit that made appending links *legitimate*, not the one
that falsified the sentence. Recorded per this phase's own rule that a false claim is
corrected rather than propagated.

## Why it was not fixed in phase 152

`.github/` is outside phase 152's three trees (`apps/`, `packages/`, `tests/`), which are
also the guard's three hard-coded scan roots — so the guard never reads this file and never
will. D-N2 places follow-up work outside the owning phase's scope in this register rather
than in a widening edit. `git diff --stat -- .github/` was asserted empty at the close of
plan 152-15.

## The claim is load-bearing, which is why it is worth correcting

The sentence is not decoration: it is the *justification* for the step's ORDERING (it must
stay above the ESLint step), and `packages/dev-seed/tests/ciTypecheckGate.test.ts` asserts
that ordering so the two steps cannot be swapped back. A reader checking the justification
against `package.json` finds it does not hold, and has no way to tell whether the ordering
requirement survives the correction. **It does** — the argument only needs `yarn typecheck`
to be *somewhere in* a chain that aborts at the first failure, not last in it.

## Suggested correction (one line)

Replace `chains \`yarn typecheck\` as its last link` with
`chains \`yarn typecheck\` as one of its links` — the reachability argument depends on
membership in an aborting chain, not on terminal position, which is exactly the invariant
`b410d3a90` moved the test to assert.

## Related

- `.github/workflows/main.yaml:65-88` — the comment block
- `package.json` — the `lint:check` chain
- `packages/dev-seed/tests/ciTypecheckGate.test.ts` — asserts the step ordering AND the two guards' chain membership
- `.planning/phases/152-comment-naming-hygiene-sweep/152-GUARD-CONTROLS.md` — the HYG2 flip that proves the membership assertion bites
