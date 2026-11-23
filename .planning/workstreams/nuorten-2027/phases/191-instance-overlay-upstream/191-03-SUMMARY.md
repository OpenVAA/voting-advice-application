---
phase: 191-instance-overlay-upstream
plan: 03
subsystem: frontend build / static assets
tags: [instance-overlay, sveltekit, kit-files-assets, static-assets, symlink-refusal]
requires:
  - 191-02 (theme transform and static logo tier; an instance logo file is served through this plan's layer)
provides:
  - instanceAssetsDir({ repoRoot, frontendDir }) => 'static' | absolute merged dir (apps/frontend/instanceAssets.js)
  - kit.files.assets set to the merged dir only when instance/static holds a regular file
  - /.instance gitignored (also hosts Plan 04's generated inlang project) and prettier-ignored
affects:
  - every route's static files (dev server, manifest, build/client copy)
tech-stack:
  added: []
  patterns:
    - merged copy of two asset layers, instance over base by relative path
    - input fingerprint (sha256 of path/size/mtime) decides reuse; rebuild into mkdtemp sibling and rename into place
    - lstat-only walk refusing symlinks and special files before any write
key-files:
  created:
    - apps/frontend/instanceAssets.js
    - apps/frontend/instanceAssets.test.ts
  modified:
    - apps/frontend/svelte.config.js
    - apps/frontend/svelte.config.test.ts
    - apps/frontend/tsconfig.json
    - apps/frontend/.gitignore
    - .prettierignore
decisions:
  - "lstatSync is imported under the alias lstat, so the walk never calls statSync and the plan's `statSync(` grep reads 0 while `lstatSync` appears in the import"
  - "The base static/ is walked with the same refusing walker, labelled by its repo-relative path; a symlink there would also fail the config load"
  - "A concurrent loader that finds the dest already placed by another keeps it when the fingerprints are equal, and retries the swap once when they differ"
requirements: [SC-2, SC-3]
metrics:
  duration: ~31 min
  completed: 2026-11-23
  tasks: 2
  files: 7
---

# Phase 191 Plan 03: instance static-asset layer Summary

`svelte.config.js` now calls `instanceAssetsDir`. When `instance/static/` holds at least one regular file, the helper builds `apps/frontend/.instance/static`: the frontend's `static/` with every instance file laid over it by relative path. The config points `kit.files.assets` at that directory. With no instance assets the helper returns `'static'` and the config sets no `kit.files` key at all. Symbolic links and special files under `instance/static/` fail the config load, naming the path, before anything is written.

## Tasks

| Task | Name | Commits | Files |
| ---- | ---- | ------- | ----- |
| 1 | instanceAssetsDir helper with symlink refusal | 0285eccc7 (RED), d46876f67 (GREEN) | instanceAssets.js(+test), tsconfig.json, .gitignore, .prettierignore |
| 2 | Wire kit.files.assets and guard the no-instance config | bc4bf4031 (RED), b94079109 (GREEN), 398ae9e0e (style) | svelte.config.js, svelte.config.test.ts |

## Verification evidence

- **Task 1 RED:** the test file failed to collect because the module did not exist. **GREEN:** 10/10 passed, and 5 repeated runs were all green. The cases are:
  - absent `instance/`, README-only `instance/`, and an empty `instance/static` or one holding only empty directories (each returns `static` and creates nothing);
  - override by path, with base-only files kept;
  - a nested override plus an instance-only `images/logo.svg`;
  - a rebuild on changed inputs that drops stale files;
  - unchanged inputs (same inode, same fingerprint mtime, no temp siblings);
  - two concurrent `node --input-type=module -e` loaders (both exit 0, same path, exact file set, `.instance/` holds only `static`);
  - a symlinked file and a symlinked directory. Each throws `instance/static/<rel> is a symbolic link; symbolic links are not allowed in instance/static`. For the file, nothing is created. For the directory, the earlier merged dir is left intact.
- **Task 2 RED:** 2 of the 4 new cases failed (the merged-dir case and the call-arguments case). **GREEN:** 11/11 in `svelte.config.test.ts`, and 21/21 together with `instanceAssets.test.ts`.
- **Acceptance greps:**
  - `git check-ignore apps/frontend/.instance/static/x` exits 0.
  - `grep -c '^apps/frontend/.instance/' .prettierignore` prints 1.
  - In `instanceAssets.js`, `statSync(` prints 0, `lstatSync` prints 1 and `renameSync` prints 3.
  - The `node -e "import('./apps/frontend/svelte.config.js')…kit.files === undefined"` check exits 0.
- **Build without an instance:** `yarn workspace @openvaa/frontend build` exits 0, `apps/frontend/.instance` is not created, and `cmp build/client/favicon.png static/favicon.png` exits 0.
- **Manual layer check (SC-2):**
  - I created `instance/static/robots-instance.txt` (`x`) and `instance/static/favicon.png` (a copy of `static/images/hero-admin.png`), then built.
  - `cmp apps/frontend/build/client/favicon.png instance/static/favicon.png` exits 0. `build/client/robots-instance.txt` exists, with its `.br` and `.gz` siblings. `build/client/fonts/inter.css` still exists.
  - I then ran `rm -rf instance/static apps/frontend/.instance`, removed the now-empty `instance/` and rebuilt. `cmp build/client/favicon.png static/favicon.png` exits 0, and `robots-instance.txt` is gone.
  - `git status --porcelain instance apps/frontend` is empty.
- **Gates:**
  - frontend `typecheck` and `check` both exit 0 (svelte-check, 2478 files, 0 errors, 0 warnings).
  - `test:unit` exits 0: 340 files and 8909 tests passed, 33 skipped.
  - `lint` has 0 errors. Its 1 warning is pre-existing, in `IdentityProviderGate.svelte.test.ts`.
  - `eslint` and `prettier --check` on the four touched root-level files are both clean.
  - `yarn assert:comment-hygiene` reports 0 violations.

## E2E (targeted runs, per the 2026-11-09 ruling)

| Run dir | Project | Result | Listed | Executed | Delta vs last full run | Title pins |
| ------- | ------- | ------ | ------ | -------- | ---------------------- | ---------- |
| tests/e2e-runs/191-03-voter-dark-mode | voter-dark-mode | GREEN, exit 0, 3 passed, not void | 3 | 3 | 0 | identical to 191-02-voter-dark-mode/titles.txt |
| tests/e2e-runs/191-03-perm-localisation-positive | perm-localisation-positive | GREEN, exit 0, 273 passed, not void | 273 | 273 | 0 | identical to 191-02 |
| tests/e2e-runs/191-03-a11y-smoke | a11y-smoke | GREEN, exit 0, 20 passed, not void | 20 | 20 | 0 | identical to 191-02 |
| tests/e2e-runs/191-03-voter-journey | voter-journey | GREEN, exit 0, 4 passed, not void | 4 | 4 | 0 | identical to 191-02 |
| tests/e2e-runs/191-03-visual-regression-container | visual-regression (pinned CI container, `--ci-literal`) | GREEN, exit 0, 8 passed, 0 unexpected, 0 flaky, 0 skipped | 8 | 8 | 0 | identical to 191-02-visual-regression-container/titles.txt |

- Every run had 0 failed, 0 flaky, 0 skipped and 0 did-not-run, per its `results.json` stats. No run carries a `VOID-*` marker.
- Each run dir holds `list.txt` (the `--list` output) and `titles.txt` (the sorted `›` lines). The visual listing was taken with `PLAYWRIGHT_VISUAL=1`.
- **Last full-run record:** the same one plans 01 and 02 used (tree d5216b03, totals only). Plan 02 established that each of these specs' literal titles at d5216b03 equal HEAD's. This plan changes no spec or fixture, and every `titles.txt` here is byte-identical to 191-02's, so the delta is 0 for every project.
- **visual-regression route:** I followed the 191-02 route. I served this tree with `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2 yarn workspace @openvaa/frontend dev --host 0.0.0.0`, then ran `tests/scripts/visual-container.sh --ci-literal` against the pinned, already-present image. It was green, so no host run or reverted control was needed. I stopped the dev server afterwards.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Lint] svelte.config.js import order**
- **Found during:** Task 2 gates.
- **Issue:** `simple-import-sort/imports` flagged the file. The frontend `lint` script covers only `src/`, so it went unnoticed. The existing `path` import was already out of order before this plan.
- **Fix:** `eslint --fix` (`path` moved below the scoped import).
- **Commit:** 398ae9e0e

**2. [Rule 1 - Lint] `consistent-type-imports` in instanceAssets.test.ts**
- **Fix:** I dropped an inline `import('node:fs').Dirent` cast, because `readdirSync` with `withFileTypes` is already typed.
- **Commit:** d46876f67

**3. `lstatSync` imported as `lstat`**
- **Why:** the acceptance grep `statSync(` must print 0, and every `lstatSync(` call contains that substring. The alias keeps the lstat-only walk and satisfies both greps.

## Known Stubs

None.

## Threat model coverage

| Threat | Mitigation |
| ------ | ---------- |
| T-191-10 | An lstat-only walk refuses every symlink, whether file, directory or the `instance/static` root itself, and every entry that is neither a file nor a directory. It runs before any write, and both symlink cases are tested. |
| T-191-11 | Relative paths come only from `readdirSync` names joined under the fixed temporary dir. The nested-path case is tested. |
| T-191-12 | A sha256 fingerprint of both layers (path, size, mtime) decides reuse. A rebuild goes to an `mkdtemp` sibling that is renamed into place, and an equal concurrent result is kept. The concurrency case is tested. |
| T-191-13 | Accepted (git-archive image context). |

The `.instance-fingerprint` dot-file is copied into `build/client`, as the plan intends. It holds only a hex digest of file paths, sizes and mtimes.

## Self-Check: PASSED

- FOUND: apps/frontend/instanceAssets.js, apps/frontend/instanceAssets.test.ts
- FOUND: commits 0285eccc7, d46876f67, bc4bf4031, b94079109, 398ae9e0e
