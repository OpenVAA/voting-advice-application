---
created: 2026-09-03
source: Phase 163 O-5 (SQL became prettier-covered in 163-07)
resolves_phase: 153
severity: low
area: tooling / pre-commit
---

# `.sql` now belongs in `.lintstagedrc.json`'s prettier-only glob — but only the SECOND one

## What changed

Phase 163 gave prettier a SQL parser (`prettier-plugin-sql@0.20.0`, declared once in
`packages/shared-config` with `language: 'postgresql'`) and normalised all 42 in-scope `.sql` files
in commit `83e07d0ba`. `yarn format:check` now genuinely checks SQL — proven by a red/green pair in
CI (runs 33802004947 / 33803179148) and by a pre-plugin negative control locally.

`.lintstagedrc.json` has not caught up. A developer editing a `.sql` file gets no pre-commit
formatting, so `format:check` can only tell them about it in CI, one round-trip later.

## The hazard, stated first because it is the reason this is filed rather than done

`.lintstagedrc.json` currently reads:

```json
{
  "*.{html,js,jsx,cjs,mjs,svelte,ts,tsx,cts,mts,xml,yaml,yml}": [
    "prettier --write",
    "eslint --fix --flag v10_config_lookup_from_file"
  ],
  "*.{css,json,md}": ["prettier --write"]
}
```

**`sql` must go in the SECOND glob — the prettier-only one — and MUST NOT go in the first.** The
first glob also runs `eslint --fix`, and **ESLint has no SQL parser**. Adding `sql` there would make
every commit touching a `.sql` file fail on a parse error, in a hook, at the moment of committing,
which is about the worst place to discover it.

Target shape:

```json
  "*.{css,json,md,sql}": ["prettier --write"]
```

## Why Phase 163 did not make this change itself

Three independent reasons, any one of which is sufficient:

1. **It is not a criterion of this phase.** 163's four criteria are about CI jobs. The pre-commit
   hook is neither named nor implied by any of them.
2. **`.lintstagedrc.json` is Phase 153's file, and 153 lands in an earlier wave.** 153 is repairing
   the fused `mjssvelte` alternative in the first glob. Editing the same file from 163 would put a
   later phase's edit under an earlier phase's, for no gain.
3. **It could not have been verified where it was made.** This worktree runs with a worktree-local
   `core.hooksPath=/dev/null` override, so lint-staged does not execute here at all. The change
   would have been shipped untested, which is exactly what this repository keeps paying for.

## Suggested check when it is made

Stage a deliberately mis-formatted `.sql` file, commit, and confirm the hook rewrote it — and, in
the same run, confirm no `eslint` invocation appeared in the hook output for that path. The absence
of the ESLint call is the half that the hazard above is about, and it is not implied by the file
being formatted.
