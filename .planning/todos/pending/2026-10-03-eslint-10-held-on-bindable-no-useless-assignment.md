---
created: 2026-10-03
title: "ESLint 10 held on 9.39.x: no-useless-assignment false positives on write-only $bindable props (eslint-plugin-svelte#1478), plus a never-wired drawer focus return"
area: lint / apps/frontend
severity: follow-up (operator decision)
source: Phase 169 plan 169-03 Task 2 commit C, held per D-06; evidence 169-EVIDENCE.md § 3 and § 6
re_check_trigger: "sveltejs/eslint-plugin-svelte#1478 (or a svelte-eslint-parser fix) released and at least 7 days old; or the operator rules on option B below"
files:
  - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte (`valid = $bindable(true)`)
  - apps/frontend/src/lib/components/video/Video.svelte (`mode = $bindable(undefined)`)
  - apps/frontend/src/lib/dynamic-components/entityList/EntityList.svelte (`itemsShown = $bindable(0)`)
  - apps/frontend/src/lib/layouts/main/Layout.svelte (`let drawerOpenElement`)
  - apps/frontend/src/lib/layouts/main/Header.svelte (`drawerOpenElement` prop, `bind:this={drawerOpenElement}`)
---

## Problem

ESLint 10.11.0 with `@eslint/js` 10.0.1 was installed and linted across every workspace on 2026-10-03. Its
recommended set raised 19 errors. 15 were real and were fixed at source in commit `14b62f26c` (they hold on
ESLint 9 too). The other 4 block the move:

1. **Three false positives from `no-useless-assignment`, all on write-only `$bindable` props.**
   - `OpinionQuestionInput.svelte` `valid`, `Video.svelte` `mode` and `EntityList.svelte` `itemsShown` are
     output props. The component writes them and the parent reads them through `bind:`.
   - ESLint's rule cannot see the parent's read, so it reports the `$props()` destructuring as a useless
     assignment.
   - `svelte-eslint-parser` 1.8.1 does add a virtual read reference for `$bindable` props
     (`analyzePropsScope` / `addPropReference`). That reference sits at the declaring identifier's own range,
     and `no-useless-assignment` only counts reads that come after the assignment, so it does not help.
   - Upstream issue: https://github.com/sveltejs/eslint-plugin-svelte/issues/1478 ("no-useless-assignment
     false positive on write-only $bindable"). Opened 2026-02-23 against ESLint 10.0.1, still open on
     2026-10-03. eslint-plugin-svelte 3.23.0 is the newest release.
2. **One real defect from `no-unassigned-vars`.** `Layout.svelte` declares `let drawerOpenElement` and passes
   it to `Header` as a plain prop (`{drawerOpenElement}`).
   - `Header` binds its menu button to its own copy (`bind:this={drawerOpenElement}`). That prop is not
     `$bindable`, so the element never reaches `Layout`.
   - As a result, `closeDrawer()`'s `drawerOpenElement?.focus()` is a no-op. The focus return the comment
     describes ("to make it easy to toggle it back when using keyboard navigation") has never happened.
   - This was not changed in a dependency phase, because wiring it changes keyboard focus behaviour.

## Why held and not fixed

PROH-169-07 forbids disabling or downgrading a new ESLint rule to absorb a finding. Turning
`no-useless-assignment` off for `**/*.svelte`, as eslint-plugin-svelte's own base config already does for
`no-self-assign` and `no-inner-declarations`, would be exactly that. The other way out is to add a dummy read
of each prop, which would bend the code to a linter defect. Per D-06, ESLint 10 is held on 9.39.5 until one of
the options below is taken.

## Options (operator)

- **A (default): wait for the upstream fix.** Re-check eslint-plugin-svelte / svelte-eslint-parser releases.
  Once #1478 is fixed in a release at least 7 days old, re-apply the ESLint 10 move.
- **B: accept a scoped rule configuration.** In `apps/frontend/eslint.config.mjs`, set
  `'no-useless-assignment': 'off'` for `**/*.svelte` only, with a comment citing #1478. This needs an explicit
  operator overrule of PROH-169-07. `.ts` / `.svelte.ts` files keep the rule.
- **The Layout focus return, either way:** decide between wiring it and deleting it.
  - Wire: make `Header`'s `drawerOpenElement` `$bindable()` and use `bind:drawerOpenElement` in `Layout`.
    This is a keyboard-focus change and should be checked against the a11y E2E specs.
  - Delete: remove the dead variable and the `focus()` call, and correct the comment.

## Re-applying ESLint 10 (once unblocked)

Everything else was proven on ESLint 10 on 2026-10-03:

- the planted import-rule proof (`169-planted-import-rules.sh import-x`) fired 4/4;
- the four frontend guard specs passed (5 files, 390 tests);
- every peer admits `eslint ^10` (169-EVIDENCE.md § 6).

The move itself has three parts:

- Catalog `eslint` and `@eslint/js` go to the newest 10.x that is at least 7 days old.
- Remove `--flag v10_config_lookup_from_file` / `flags: ['v10_config_lookup_from_file']` from every site.
  Derive the population with `git grep -n -e v10_config_lookup -- ':!.planning'`; it was 19 sites on
  2026-10-03.
- Rewrite the guard docblocks' invariant 2, which calls the flag mandatory.
