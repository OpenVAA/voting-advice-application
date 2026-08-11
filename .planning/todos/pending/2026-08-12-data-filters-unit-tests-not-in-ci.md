---
created: 2026-08-12
source: Phase 136 plan 06 (verification gate) — discovered while corroborating REAL-02
resolves_phase: null
severity: high
area: ci / unit tests
---

# `@openvaa/data` and `@openvaa/filters` unit tests do not run in CI

## The finding

`yarn test:unit` is `turbo run test:unit`, so it executes exactly those workspaces that **declare a
`test:unit` script**. Measured on 2026-08-12 (`yarn test:unit --force`, 19/19 tasks, 0 cached):

| Workspace | `test:unit` script | `vitest.config.ts` | Runs in CI |
|-----------|--------------------|--------------------|------------|
| `@openvaa/app-shared` | yes | yes | **yes** |
| `@openvaa/dev-seed` | yes | yes | **yes** |
| `@openvaa/frontend` | yes | — | **yes** |
| `@openvaa/supabase` | yes | — | **yes** |
| `@openvaa/docs` | yes | — | **yes** |
| `@openvaa/core` | **no** | yes | **NO** |
| `@openvaa/data` | **no** | yes | **NO** |
| `@openvaa/filters` | **no** | yes | **NO** |
| `@openvaa/matching` | **no** | yes | **NO** |
| `@openvaa/llm` | **no** | yes | **NO** |
| `@openvaa/question-info` | **no** | yes | **NO** |
| `@openvaa/argument-condensation` | **no** | yes | **NO** |

Seven packages ship a working vitest project that **no CI command reaches**. The root
`vitest.config.ts` (`export default ['packages/**/vitest.config.ts']`) wires them into a bare `vitest`
invocation at the repo root — which is what `yarn test:unit:watch` uses, and which nothing in
`.github/workflows/main.yaml` runs.

They pass. Run directly:

```
npx vitest run --project @openvaa/data --project @openvaa/filters
→ Test Files  1 failed | 47 passed (48)
→      Tests  1 failed | 265 passed (266)
```

## Why this matters right now

Phase 136 plan 02 converted **eleven** `expect.arrayContaining` subset matchers on the matching
pipeline's input path to exact equality (sweep finding F12) — six in `@openvaa/data`, two in
`@openvaa/filters`, plus the sites the audit's enumeration missed. A two-run negative control proved
they now catch **8 over-inclusion regressions** the old assertions could not see.

All eleven live in packages that CI never runs. The guards are real; nothing executes them on `main`.

This is the **same pathology as sweep finding F5** — the finding REAL-03 exists to close, where the
Phase-135 operation budget self-skipped green in CI and only ran on developer machines by accident of
a `.env` side effect. Here the mechanism is different (a missing script rather than a skip condition)
but the consequence is identical: a guard that looks like coverage and produces no signal.

## Why it was not fixed at the gate

Adding `"test:unit": "vitest run"` to these packages makes `yarn test:unit` **red immediately**,
because of a pre-existing defect already logged as **D-136-02-1**:

```
FAIL |@openvaa/data| src/utils/formatAnswer.test.ts:25
     formatDateAnswer > Should return the formatted date string using the default format
     when question.format is undefined
AssertionError: expected '5.10.2023' to be '10/5/2023'
```

The test hard-codes an `en-US` rendering while `formatDateAnswer` falls back to the **ambient machine
locale** when `question.format` is undefined. This machine is `fi`. A CI runner is typically `C` /
`en-US`, so it would likely pass there — which is worse, not better: the test's outcome depends on
where it runs, exactly the environment-dependence family this milestone has been eliminating.

So the fix has a prerequisite and a decision in it, which is why it is a todo and not a gate action.

## Suggested resolution

1. **Decide D-136-02-1 first.** Either pin the locale explicitly in the test, or make
   `formatDateAnswer`'s fallback locale deterministic in the implementation. The second is the real
   fix — a formatter whose output depends on the host machine is a product defect, not a test defect —
   but it changes runtime behaviour and needs an owner.
2. **Then add `test:unit` to the seven packages** (or, better, to `@openvaa/core`, `data`, `filters`
   and `matching` at minimum — those are on the dependency path of everything). Follow the
   `@openvaa/app-shared` shape so `turbo.json`'s `test:unit` task (`dependsOn: ["build"]`,
   `cache: false`) picks them up unchanged.
3. **Verify it FIRES, do not just verify it lints clean.** Re-run one of the F12 negative controls
   (stub `appliesTo` + `Filter.apply` to no-ops) through `yarn test:unit` and confirm the job goes
   red. A wiring change that is not proven to fail is the same class of non-guard this todo is about.
4. Consider whether `packages/llm`, `question-info` and `argument-condensation` (experimental) should
   be in the blocking job or a separate advisory one — but decide it explicitly rather than by
   omission, which is how this happened.

## Related

- `.planning/audits/2026-08-11-fake-guard-sweep.md` — F5 (same pathology, different mechanism), F12
- `.planning/phases/136-real-guards-visual-repair-sweep-remediation/deferred-items.md` — D-136-02-1
- `.planning/REQUIREMENTS.md` — REAL-02 (carries this as a named boundary), REAL-03 (F5)
