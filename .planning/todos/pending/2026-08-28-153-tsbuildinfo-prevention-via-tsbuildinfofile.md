---
title: "Belt-and-braces for REVIEW-CFG-06: set `tsBuildInfoFile` into an ignored output dir in the three workspaces that omit it"
created: 2026-08-28
updated: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 06
priority: low
suggested_phase: future-build-tooling
keywords: [tsbuildinfo, tsBuildInfoFile, composite, typescript, incremental-build, canonical-paradigm, gitignore, REVIEW-CFG-06, D-B2, prevention]
---

# Ignoring the artefact is the fix; pointing it into `dist/` is the prevention

## Origin

Plan `153-06` discharged REVIEW-CFG-06 by untracking four build artefacts and adding a global
`*.tsbuildinfo` rule to the root `.gitignore`. That closes the class — no workspace can ever commit
one again — but it treats the symptom. The repository's own documented paradigm prevents the
artefact from landing in an unignored location in the first place, and three workspaces do not
follow it.

## The root cause

`packages/shared-config/tsconfig.base.json:6` is `"composite": true`, so **every** workspace
extending the shared config emits a `.tsbuildinfo`. Where it lands is decided by `tsBuildInfoFile`;
absent that setting, TypeScript writes it beside the tsconfig — at the workspace root, outside any
ignored output directory.

`packages/README.md:20` states the canonical rule verbatim:

> The `tsBuildInfoFile` is set to `./dist/tsconfig.tsbuildinfo` in `tsconfig.json` so the
> incremental-build artifact is also gitignored.

Eight `packages/*` workspaces follow it — `app-shared`, `argument-condensation`, `core`, `data`,
`filters`, `llm`, `matching`, `question-info`, each with
`"tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo"` (`git grep -n tsBuildInfoFile --
'*tsconfig*.json'`). `packages/core` is the live reference: its `tsconfig.json` sets the field and
its `.gitignore` is `dist/`.

## The three that do not

| Workspace | tsconfig shape | Suggested target |
|---|---|---|
| `apps/frontend` | `extends: ["@openvaa/shared-config/ts", "./.svelte-kit/tsconfig.json"]`, no `tsBuildInfoFile` | `./build/tsconfig.tsbuildinfo` or `./.svelte-kit/tsconfig.tsbuildinfo` — pick whichever the workspace's own `.gitignore` already covers |
| `apps/docs` | same shape, no `tsBuildInfoFile` | same |
| `packages/supabase-types` | `"outDir": "./build"`, `"noEmit": true`, inherits `composite: true`, no `tsBuildInfoFile` | `./build/tsconfig.tsbuildinfo` (`build/` is ignored at root `.gitignore`) |

Verify the chosen directory is genuinely ignored for that workspace before landing — do not assume
the root `dist/` / `build/` rules reach it.

## Extra context worth carrying

`153-06` measured, and recorded in `153-NC-ROW-4-CFG-06.md`, that **no repo script regenerates these
three artefacts**: `apps/docs` and `apps/frontend` typecheck via `svelte-check` (compiler API, no
`.tsbuildinfo`) and build via `vite build`; `packages/supabase-types`'s build is an `echo` and it has
no `typecheck` script at all. A full `yarn build` (14/14) + `yarn typecheck` (22/22) with all three
deleted stays green and rewrites none of them.

Two consequences for whoever picks this up:

1. The files exist only because someone ran `tsc` by hand or an IDE did. Setting `tsBuildInfoFile`
   changes where *those* ad-hoc runs write, which is still worth doing — but it will not be
   exercised by CI, so it cannot be verified by "run the build and look".
2. Verification has to be explicit: `node_modules/.bin/tsc -p <workspace>/tsconfig.json --noEmit`,
   then confirm the artefact appears at the new path and **not** at the workspace root. (Note that
   raw `tsc` against `apps/frontend` exits 2 with ~61 `TS7031` errors because it cannot resolve
   `.svelte` imports — that is expected and unrelated; `tsc` writes the `.tsbuildinfo` regardless of
   exit status.)

Consider also whether `packages/README.md`'s "Justified divergences" section should gain an entry
for `supabase-types`, or whether the field is simply missing there.

## Why filed rather than done

Beyond REVIEW-CFG-06's wording, which is about removing tracked build artefacts from version
control. `153-06`'s `files_modified` names four paths, none of them a tsconfig, and editing three
`tsconfig.json` files mid-wave would collide with sibling plans. `153-06`'s
`<open_decision id="OQ-none-here">` records this as an explicit point of discretion:
**"Filed as a todo, not done here."**

## Cross-links

- `.planning/phases/153-build-tooling-config-correctness/153-NC-ROW-4-CFG-06.md` — Row-4 evidence, incl. the falsified "`yarn build && yarn typecheck` regenerates them" premise
- `.planning/phases/153-build-tooling-config-correctness/153-RESEARCH.md` § E.2 / § E.3 — the prevention option as originally scoped
- `packages/README.md:20` — the canonical rule
- `packages/core/tsconfig.json` + `packages/core/.gitignore` — the workspace that follows it
- `packages/shared-config/tsconfig.base.json:6` — `"composite": true`, the root cause
- `.gitignore:25-29` — the `*.tsbuildinfo` rule that makes this belt-and-braces rather than load-bearing

## Tags

#typescript #tsbuildinfo #canonical-paradigm #deferred-from-153-06 #REVIEW-CFG-06 #build-tooling
