# Phase 153 — Churn measurement for the REVIEW-CFG-08 glob fix

**Plan:** `153-05-PLAN.md`, Task 3
**Date:** 2026-08-29
**Measured at:** `d8f988704` on `integration/ship-12-squash`, i.e. **after** the glob fix
(`9973a2f69`) landed, so every number below describes the file set the pre-commit hook now
actually reaches.
**Environment:** macOS / Darwin 25.5.0 · Node v24.14.1 · Yarn 4.13.0 · prettier 3.7.4 ·
eslint 9.39.2 · lint-staged 16.4.0

D-B3 anticipated "a one-off formatting churn commit on `.svelte` files … so the gate starts
from clean". `153-RESEARCH.md § D.6` measured that at **zero**. This document re-measures it
at execute time, as Task 3 requires, and the re-measurement **does not reproduce the research
figure**. The research measurement covered only the *prettier* half of the first glob's task
array. On that half it is exactly right. On the *eslint* half it is falsified.

---

## Verdict

**Files needing reformatting by `prettier`: 0.** Confirmed over all 281 tracked `.svelte` and
`.mjs` files, and flip-tested in both directions.

**Files needing rewriting by `eslint --fix`: 27, with 366 problems surviving the fix.**
`eslint --fix --flag v10_config_lookup_from_file` — the *other* task on the same glob — is not
clean over the newly-matched `.mjs` population, and two directories make eslint abort
outright.

**No churn commit was created.** Not because the number is zero — it is not — but because no
commit permitted by this plan's own constraints could close the gap, and a partial one would
be a large diff on a shared integration branch that buys nothing. The reasoning is set out
under *Why no commit* below, and the residue is filed as a todo rather than smuggled in.

---

## Command set

```
git ls-files -- '*.svelte'                       # 237
git ls-files -- '*.mjs'                          #  44
npx prettier --check       <all 281>
npx prettier --list-different <all 281>
npx eslint --flag v10_config_lookup_from_file --fix-dry-run -f json <per set>
```

Per-file ignore classification was taken from prettier's own API
(`prettier.getFileInfo(f, { ignorePath: '.prettierignore' })`) rather than from the exit code
of a `--check`, because **`prettier --check` over an ignored path prints
`All matched files use Prettier code style!` and exits 0** — indistinguishable from a genuine
pass. That distinction is the reason the research table records `apps/docs` as prettier-✅
when in fact prettier never looked at it (see the note below).

---

## Per-set counts

| Set | Tracked files | prettier: ignored / covered | `prettier --check` | `eslint --fix` would rewrite | eslint problems REMAINING after `--fix` |
|---|---|---|---|---|---|
| `.svelte` `apps/frontend/**` | 170 | 0 / 170 | ✅ 0 different | 0 | **0** |
| `.svelte` `apps/docs/**` | 16 | **16 / 0** (excluded) | n/a — ignored | — | **eslint aborts, exit 2** |
| `.svelte` `.claude/skills/**` | 45 | **45 / 0** (excluded) | n/a — ignored | 0 | 0 (eslint reports `File ignored`, exit 0) |
| `.svelte` `.planning/**` | 5 | **5 / 0** (excluded) | n/a — ignored | 0 | 0 (`File ignored`, exit 0) |
| `.svelte` `scripts/fixtures/**` | 1 | **1 / 0** (excluded) | n/a — ignored | 0 | 0 (`File ignored`, exit 0) |
| `.mjs` `scripts/**` | 9 | 1 / 8 | ✅ 0 different | **5** | **28** — `no-console` 23, `func-style` 5 |
| `.mjs` `apps/frontend/**` | 4 | 0 / 4 | ✅ 0 different | **2** | **21** — `no-console` 21 |
| `.mjs` `apps/docs/**` | 2 | **2 / 0** (excluded) | n/a — ignored | — | **eslint aborts, exit 2** |
| `.mjs` `packages/**` | 2 | 0 / 2 | ✅ 0 different | 0 | **0** |
| `.mjs` `tests/**` | 2 | 0 / 2 | ✅ 0 different | 0 | **0** |
| `.mjs` other (`eslint.config.mjs`, `prettier.config.mjs`, `apps/supabase/scripts/lint-schema.mjs`) | 3 | 0 / 3 | ✅ 0 different | 0 | **0** |
| `.mjs` `.planning/**` | 20 | **20 / 0** (excluded) | n/a — ignored | **18** | **263** — `no-console` 206, `func-style` 30, `no-control-regex` 20, `unused-imports/no-unused-vars` 7 |
| `.mjs` `.claude/**` | 2 | **2 / 0** (excluded) | n/a — ignored | **2** | **54** — `no-console` 47, `no-control-regex` 6, `func-style` 1 |
| **Total** | **281** (237 `.svelte` + 44 `.mjs`) | 92 / 189 | **0 different** | **27** | **366** |

Inherited-vs-measured, since three of the research figures moved:

| Figure | `153-RESEARCH.md § D.6` | Measured 2026-08-29 |
|---|---|---|
| `.svelte` under `apps/frontend/**` | 170 | **170** ✔ |
| `.svelte` under `apps/docs/**` | 16 | **16** ✔ |
| `.svelte` under `.claude/skills/**` | 45 | **45** ✔ |
| `.svelte` under `.planning/**` | 3 | **5** ✘ |
| Total tracked `.svelte` | 234 | **237** ✘ (the missing set is `scripts/fixtures/`, 1 file, which the table does not enumerate) |
| All tracked `.mjs` | 34 | **44** ✘ |
| Files needing reformatting | 0 | **0 by prettier; 27 by `eslint --fix`, 366 problems surviving** |

---

## The prettier axis: zero, and flip-tested

```
$ npx prettier --list-different <all 237 .svelte + 44 .mjs>
EXIT=0
files needing reformatting: 0
```

**A scan that examines nothing also reports zero**, so the zero was proven able to be
non-zero before it was believed. Two blank lines were appended to
`apps/frontend/src/lib/components/button/Button.svelte` and a mis-spaced statement to
`scripts/assert-a11y-scan-wiring.mjs`, and the identical command re-run:

```
EXIT=1
files named: 2
apps/frontend/src/lib/components/button/Button.svelte
scripts/assert-a11y-scan-wiring.mjs
```

Both victims were reverted with a targeted `git checkout -- <path>` (safe: both were tracked,
unmodified, and this plan's own work was already committed — no `git stash`, no `git clean`,
no blanket reset), and the command re-run a third time:

```
post-revert EXIT=0  files named: 0
```

`0 → 2 → 0`, with the worktree at 0 dirty entries before and after. The zero is a measurement,
not an absence.

**Why it is genuinely zero:** `yarn format` / `yarn format:check` (`prettier --write .` /
`--check .` from the root) already covers every non-ignored one of these files, and prettier
resolves its config **per file**, so `apps/frontend/prettier.config.mjs`'s
`prettier-plugin-svelte` and its `{ files: '*.svelte', options: { parser: 'svelte' } }`
override apply even when prettier is invoked from the repo root. The newly-matched files were
already being formatted by a different entry point; the glob fix does not find them dirty.

**Correction to the research table, `apps/docs` row.** Research records `apps/docs` `.svelte`
as prettier-✅. Prettier never looked at those 16 files: `.prettierignore:35` is a bare `docs`
entry, which gitignore semantics match at any depth, so `apps/docs/**` is ignored wholesale.
`prettier --file-info` on one of them returns `{ "ignored": true, "inferredParser": null }`.
The ✅ was a `--check` over an empty match set. (Bypassing the ignore with an empty
`--ignore-path` shows the file *would* be clean anyway, so the conclusion survives — but it
survives by luck, not by the evidence that was offered for it.)

---

## The eslint axis: NOT zero — the falsified premise

The first glob's task array is **two** commands, not one:

```json
  "*.{html,js,jsx,cjs,mjs,svelte,ts,tsx,cts,mts,xml,yaml,yml}": [
    "prettier --write",
    "eslint --fix --flag v10_config_lookup_from_file"
  ],
```

`153-RESEARCH.md § D.6` measured the eslint column for exactly one row (`.claude/skills`
`.svelte`, recorded as a harmless warning) and left it `—` for every other row, including all
34 `.mjs` it counted. Measured now over all 44:

- `.svelte` is clean. All 170 `apps/frontend` files: `--fix` rewrites **0**, **0** problems
  remain. The 51 ignored-by-eslint `.svelte` files (`.claude`, `.planning`,
  `scripts/fixtures`) emit `File ignored because no matching configuration was supplied` and
  exit 0.
- `.mjs` is not. 27 of 44 would be rewritten by `--fix`, and **366 problems survive the fix**:
  `no-console` 297, `func-style` 36, `no-control-regex` 26,
  `unused-imports/no-unused-vars` 7.
- `apps/docs/**` makes eslint **abort**, not fail: exit 2 with
  `Error [ERR_INTERNAL_ASSERTION]` from Node's ESM loader
  (`loadCJSModuleWithModuleLoad`) while `dynamicImportConfig` imports
  `apps/docs/eslint.config.js` under `--flag v10_config_lookup_from_file`. Without the flag
  the same file lints fine (root config, `File ignored`, exit 0).

None of these are formatting. `no-console` and `func-style` cannot be auto-fixed and closing
them is a semantic change to code.

### Attribution — this class is PRE-EXISTING, and the glob fix widens it

The honest question is whether the glob fix *creates* a broken pre-commit hook or *enlarges*
an already-broken one. Measured, over exactly the extensions the **old** glob already matched
(`html,js,jsx,cjs,ts,tsx,cts,mts,xml,yaml,yml`) in the same directories:

| Directory | Files the OLD glob already matched | `--fix` would rewrite | problems remaining after `--fix` |
|---|---|---|---|
| `scripts/` | 2 | 0 | **1** |
| `.planning/` | 16 | 6 | **10** |
| `.claude/` | 17 | 1 | **5** |
| `tests/` | 166 | 2 | **1** |
| `apps/docs/` | 22 | — | **eslint aborts, exit 2 — under the OLD glob too** |

So the pre-commit hook was **already** red for a population of files before this plan touched
anything, and the `apps/docs` eslint abort in particular is fully pre-existing — it fires on
`apps/docs/**/*.ts`, which the fused glob has always matched. The glob fix does not introduce
the defect. It enlarges the affected population by the 44 `.mjs` files (37 of them red) and
by `apps/docs`'s 16 `.svelte` files (which were already unreachable-but-doomed by the same
config-load abort).

---

## Why no commit

The plan permits exactly one additional commit, "containing **only** prettier/eslint
formatting changes", explicitly forbids a semantic change inside it, and explicitly forbids
reformatting anything under `.claude/` or `.planning/`. Under those constraints:

1. The prettier half needs **nothing** — 0 files differ. An empty commit would be a fabricated
   artefact, which the plan forbids by name.
2. The eslint half cannot be closed by a formatting commit. Of the 27 files `--fix` would
   rewrite, 20 are under `.planning/` and `.claude/` and are out of bounds by the plan's own
   words. The 7 in-bounds files (5 in `scripts/`, 2 in `apps/frontend/`) would be rewritten
   and the hook would **still** be red on them — 49 in-bounds problems survive the fix, all
   `no-console` and `func-style`, all semantic.
3. Landing that partial rewrite would therefore change 7 files, close nothing, and collide
   with live sibling work: `153-01` creates `scripts/assert-declared-binaries.mjs` and
   `153-10` creates `scripts/assert-env-pair-registry.mjs` and
   `scripts/assert-env-pairs-agree.mjs` in the same directory this wave.
4. Weakening the eslint configuration to make the hook green is prohibited outright by this
   plan's prohibition list, and would be the wrong answer regardless.

The residue is therefore **reported, not engineered around**, and filed as
`.planning/todos/pending/2026-08-29-153-pre-commit-eslint-red-on-mjs-and-apps-docs.md`.

---

## Nothing under `.claude/` or `.planning/` was reformatted

`git status --porcelain -- .claude .planning` is clean of any formatting change from this
task; the only `.planning/` paths this plan writes are its own two evidence documents and its
SUMMARY. The `.claude/` skill fixtures are excluded from prettier by the `.prettierignore`
entry added in `9973a2f69` and remain byte-identical.

## Gates after this task

```
yarn format:check   → exit 0  ("All matched files use Prettier code style!")
yarn lint:check     → exit 0  (22/22 turbo tasks; comment-hygiene 1579 files / 0 violations;
                               edge-env-defaults 17 files / 0; declared-binaries 16 workspaces / 0;
                               assert-node-engine OK)
```
