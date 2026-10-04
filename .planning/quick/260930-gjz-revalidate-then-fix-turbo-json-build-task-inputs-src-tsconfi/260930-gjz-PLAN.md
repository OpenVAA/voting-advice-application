---
phase: quick-260930-gjz
plan: 01
type: execute
wave: 1
depends_on: []
quick_id: 260930-gjz
files_modified:
  - apps/frontend/turbo.json
  - apps/docs/turbo.json
  - packages/dev-seed/tests/turboBuildInputsGate.test.ts
  - CLAUDE.md
autonomous: true
requirements: [QUICK-260930-gjz]

must_haves:
  truths:
    - "The finding is re-established or dropped at HEAD from `turbo run build --dry=json` output and the latest observable CI log, not from the item text: the SUMMARY records each app's hashed build inputs, whether generated Paraglide files are hashed, and whether CI remote caching is enabled"
    - "Every file git tracks under apps/frontend and apps/docs is a hashed input of that app's `build` task (messages/**, static/**, svelte.config.js, vite.config.ts, project.inlang/settings.json, paraglide.options.ts, vite.projectIdEnv.ts, tailwind.config.mjs among them), so editing any of them is a cache miss instead of a replay of a stale build/"
    - "The frontend build hash does not include the Paraglide output the build itself writes: with apps/frontend/src/lib/paraglide/ deleted, the dry-run hash equals the hash taken after a build, and a rebuild is a cache hit"
    - "A cache hit for @openvaa/frontend#build restores apps/frontend/src/lib/paraglide/** along with build/**, and `yarn workspace @openvaa/frontend check` passes on the restored files"
    - "Both app `build` tasks keep the root's dependsOn [\"^build\"], and the tsup packages keep the root turbo.json build inputs unchanged"
    - "packages/dev-seed/tests/turboBuildInputsGate.test.ts is red at HEAD without the package configs, green with them, and red again when either package turbo.json is moved aside"
  artifacts:
    - path: apps/frontend/turbo.json
      provides: "Package configuration extending the root: build inputs are every git-tracked file plus the local data/ copy source, minus the generated Paraglide dir; build outputs add src/lib/paraglide/**"
      contains: "$TURBO_DEFAULT$"
    - path: apps/docs/turbo.json
      provides: "Package configuration extending the root: build inputs are every git-tracked file of the docs app"
      contains: "$TURBO_DEFAULT$"
    - path: packages/dev-seed/tests/turboBuildInputsGate.test.ts
      provides: "Standing gate: turbo dry run proves both app build hashes cover every tracked file, exclude generated Paraglide, and restore it as an output"
      contains: "--dry=json"
    - path: CLAUDE.md
      provides: "Build System section names the two package configurations and the gate"
      contains: "apps/frontend/turbo.json"
  key_links:
    - from: apps/frontend/turbo.json
      to: turbo.json
      via: "package configuration `extends` the root, inheriting dependsOn and overriding build inputs/outputs"
      pattern: "\"extends\": \\[\"//\"\\]"
    - from: apps/docs/turbo.json
      to: turbo.json
      via: "package configuration `extends` the root, overriding build inputs only"
      pattern: "\"extends\": \\[\"//\"\\]"
    - from: packages/dev-seed/tests/turboBuildInputsGate.test.ts
      to: node_modules/.bin/turbo
      via: "execFileSync of the repo-pinned binary with run build --dry=json for the two apps"
      pattern: "dry=json"
    - from: packages/dev-seed/tests/turboBuildInputsGate.test.ts
      to: .github/workflows/main.yaml
      via: "runs in `yarn test:unit` (frontend-and-shared-module-validation) and `yarn workspace @openvaa/dev-seed test:unit` (dev-seed-integration), both after the step that produces generated Paraglide"
      pattern: "test:unit"
---

<objective>
Revalidate, then fix, the Turborepo build-input gap for the two Vite apps.

The root `turbo.json` `build` task hashes `src/**`, `tsconfig.json`, `tsconfig.*.json`, `tsup.config.ts` and `package.json` — the right set for the tsup packages, the wrong one for `apps/frontend` and `apps/docs`, whose `vite build` also reads messages, static assets, the Svelte/Vite/Tailwind configs and the inlang project settings. On top of that, the explicit `src/**` glob hashes gitignored files, so the frontend hash includes the Paraglide output its own build writes into `src/lib/paraglide/`.

Planning-time evidence (at 79b4faed9; re-derive in Task 1, do not trust these numbers blindly):
- turbo 2.8.17 (`node_modules/turbo/package.json`; root devDependency `^2.8.17`). Package configurations (`"extends": ["//"]`) and `$TURBO_DEFAULT$` are supported; the root already uses `$TURBO_DEFAULT$` for `lint` and `typecheck`.
- Dry run: `@openvaa/frontend#build` hashes 1204 files — zero under `messages/` or `static/`, no `svelte.config.js`, `vite.config.ts`, `project.inlang/settings.json`, but 15 generated `src/lib/paraglide/` files. `@openvaa/docs#build` hashes no `static/`, `svelte.config.js`, `vite.config.ts` or `tailwind.config.mjs`. Both have outputs `build/**`, `dist/**`, so a cache hit never restores generated Paraglide.
- CI run 36535849705 (`ci-evidence/165-review-fixes-tree-7`, 2026-09-29): every turbo invocation prints "Remote caching disabled" (the workflows export `TURBO_TOKEN`/`TURBO_TEAM`, but the secret is not in effect). In `frontend-and-shared-module-validation`, `@openvaa/frontend:build` misses in `yarn build` (hash 4efd410d92c62e76) and misses AGAIN in `yarn test:unit` (hash 78f7b62ae38c174b, about 50 s), while `@openvaa/docs:build` replays. Root cause UNCONFIRMED at planning: the first build's generated Paraglide files entering the second hash. Task 1 confirms it in isolation.
- A trial of the configs prescribed in Task 3 (created, dry-run, deleted — tree left clean) gave: frontend inputs = all 1562 tracked files, zero generated Paraglide, outputs `build/**` + `src/lib/paraglide/**`, dependsOn `["^build"]` inherited; docs inputs = all 281 tracked files.

So the finding holds with a correction: the remote-cache replay is latent (wired, disabled), while a stale local-cache replay (messages/static/config edits do not change the hash) and a per-run double frontend build in CI are live.

Purpose: a replayed build must never be older than the files it was built from, and a build must not invalidate its own cache entry.
Output: `apps/frontend/turbo.json`, `apps/docs/turbo.json`, a standing dry-run gate in `packages/dev-seed/tests/`, one CLAUDE.md sentence. If Task 1 finds the gap closed, the outcome is "dropped — reason" and nothing is written.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@turbo.json
@apps/frontend/package.json
@apps/frontend/paraglide.options.ts
@apps/frontend/vite.config.ts
@apps/frontend/.gitignore
@apps/docs/package.json
@apps/docs/svelte.config.js
@.github/workflows/main.yaml
@packages/dev-seed/tests/ciTypecheckGate.test.ts
@scripts/assert-unit-test-coverage.mjs

Anchors (content, not line numbers):
- `readTurboTasks()` in `scripts/assert-unit-test-coverage.mjs` is the repo's precedent for spawning a turbo dry run: the repo-pinned `node_modules/.bin/turbo` (`turbo.cmd` on win32), `execFileSync` without a shell, `cwd` at the repo root, `maxBuffer` 64 MiB, fail closed by name when the binary is missing or the JSON does not parse.
- The `HERE`/`REPO_ROOT` idiom and the "`yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in" header sentence come from `packages/dev-seed/tests/ciTypecheckGate.test.ts`.
- In `.github/workflows/main.yaml`, job `frontend-and-shared-module-validation` runs `yarn build` before `yarn typecheck`, `yarn lint:check`, `yarn test:unit` and `yarn workspace @openvaa/frontend check` (the steps that need generated Paraglide); job `dev-seed-integration` runs `yarn workspace @openvaa/frontend paraglide:compile` before `yarn workspace @openvaa/dev-seed test:unit`. The E2E jobs set no `TURBO_TOKEN` and serve through the dev server, whose Vite plugin generates Paraglide itself.
- The only deploy path, the `production` stage of `apps/frontend/Dockerfile`, runs `yarn workspace @openvaa/frontend build` directly, not through turbo. Sibling item 260930-gjw edits that Dockerfile; this plan does not touch it.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Revalidate the build-input gap at HEAD (read-only; decide proceed or drop)</name>
  <files>(none — read-only probes; the evidence goes into 260930-gjz-SUMMARY.md)</files>
  <precondition>`node_modules/.bin/turbo` exists in the working tree (yarn install has run).</precondition>
  <action>
Re-derive every claim in the objective's planning-time evidence at the current HEAD and record the results in the SUMMARY under a "Revalidation" heading. Write every probe output to a temp file and check the command's own exit status; do not judge a probe through a pipe.

(a) Version and syntax: record the installed turbo version from `node_modules/turbo/package.json`, and confirm that no `turbo.json` exists yet under `apps/frontend` or `apps/docs` (`git ls-files` plus a filesystem check).

(b) Input coverage: run the repo-pinned turbo with `run build --dry=json --filter=@openvaa/frontend --filter=@openvaa/docs` from the repo root into a temp file. For each of `@openvaa/frontend#build` and `@openvaa/docs#build`, compare the keys of the task's `inputs` map (package-relative paths) with `git ls-files -- apps/<app>` (strip the `apps/<app>/` prefix). Record the hash, the count of tracked files missing from the inputs with the first examples (expect `messages/`, `static/`, `svelte.config.js`, `vite.config.ts`, `project.inlang/settings.json`, `paraglide.options.ts`, `vite.projectIdEnv.ts` for the frontend; `static/`, `svelte.config.js`, `vite.config.ts`, `tailwind.config.mjs` for docs), the count of input keys under `src/lib/paraglide/`, and the task `outputs`.

(c) Self-reference, in isolation: if `apps/frontend/src/lib/paraglide/` is absent, create it with `yarn workspace @openvaa/frontend paraglide:compile` (gitignored output; it may fetch the inlang plugins over the network — if that fails, record the check as not reproducible locally and continue). Take the frontend dry-run hash with the directory present, move the directory to a temp location, take the hash again, then move it back. Different hashes confirm that the build's own output feeds its hash, which is the cause of the CI double build; equal hashes mean that cause is disproven — say so in the SUMMARY.

(d) CI status: with `gh`, take the most recent completed `main.yaml` run (`gh run list --workflow main.yaml`), save `gh run view <id> --log` to a temp file, and record whether it says "Remote caching enabled" or "Remote caching disabled", and the cache status of each `@openvaa/frontend:build` and `@openvaa/docs:build` group in job `frontend-and-shared-module-validation`. Also record which steps of that job need generated Paraglide and whether any runs before the first build step. If `gh` is unavailable or the logs have expired, record "not observable" and rely on (b) and (c).

Decision: DROP only if (b) shows no tracked file missing for either app and no generated Paraglide keys. Then the SUMMARY outcome is "dropped — <reason>", Tasks 2 and 3 are skipped, and nothing is written outside the quick directory. If only one app is affected, keep that app's half of Task 3 and still write the full gate in Task 2 (the healthy app's assertions will simply pass). Otherwise PROCEED.
  </action>
  <verify>
    <automated>F="$(mktemp)"; node_modules/.bin/turbo run build --dry=json --filter=@openvaa/frontend --filter=@openvaa/docs > "$F" 2>/dev/null && node -e 'const cp=require("child_process");const d=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));for(const [id,dir] of [["@openvaa/frontend#build","apps/frontend"],["@openvaa/docs#build","apps/docs"]]){const t=d.tasks.find(t=>t.taskId===id);const k=new Set(Object.keys(t.inputs));const tracked=cp.execFileSync("git",["ls-files","--",dir],{encoding:"utf8"}).split("\n").filter(Boolean).map(f=>f.slice(dir.length+1));const missing=tracked.filter(f=>!k.has(f));console.log(id,t.hash,"tracked",tracked.length,"missing",missing.length,missing.slice(0,6),"generated-paraglide",[...k].filter(f=>f.startsWith("src/lib/paraglide/")).length,"outputs",t.outputs.join(","))}' "$F"; echo "probe_exit=$?"; rm -f "$F"</automated>
  </verify>
  <done>The SUMMARY's Revalidation section records (a)-(d) with the turbo version, per-app hash, missing-input counts and examples, generated-Paraglide key count, outputs, the move-aside hash pair, and the CI remote-cache and cache-status lines, and it states PROCEED, PROCEED (one app only), or DROPPED with the reason.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Standing dry-run gate — write it and observe it red at HEAD</name>
  <files>packages/dev-seed/tests/turboBuildInputsGate.test.ts</files>
  <behavior>
    - The frontend build hashes every file git tracks in apps/frontend (red at HEAD: messages/, static/, svelte.config.js, vite.config.ts, project.inlang/settings.json, … missing)
    - The docs build hashes every file git tracks in apps/docs (red at HEAD: static/, svelte.config.js, vite.config.ts, tailwind.config.mjs, … missing)
    - No frontend build input lies under src/lib/paraglide/ (red at HEAD whenever the generated directory exists)
    - The resolved frontend build inputs contain the negation of the generated Paraglide directory (red at HEAD)
    - The frontend build outputs include both build/** and src/lib/paraglide/** (red at HEAD)
    - Both app build tasks keep the root turbo.json build dependsOn (green at HEAD — guards the extends merge)
    - Anti-vacuity: each app's tracked population is non-empty and contains svelte.config.js, and the frontend's contains at least one messages/ file (green at HEAD)
  </behavior>
  <action>
Skip this task if Task 1 decided DROP.

Create `packages/dev-seed/tests/turboBuildInputsGate.test.ts`, a vitest spec beside the other repo-root gate specs. Use the `HERE`/`REPO_ROOT` idiom from `ciTypecheckGate.test.ts`, whose header sentence explains why a repo-meta spec lives in this package.

Obtain the dry run once, in a `beforeAll` with an explicit timeout of 60 s, the same way `readTurboTasks()` in `scripts/assert-unit-test-coverage.mjs` does it. Spawn the repo-pinned `node_modules/.bin/turbo` (`turbo.cmd` on win32) through `execFileSync`, without a shell. Pass the arguments `run`, `build`, `--dry=json`, `--filter=@openvaa/frontend` and `--filter=@openvaa/docs`. Set `cwd` to `REPO_ROOT`, `encoding` to utf8, `stdio` to ignore/pipe/pipe and `maxBuffer` to 64 MiB. Give the child a copy of `process.env` with `TURBO_TOKEN`, `TURBO_TEAM` and `TURBO_API` removed, so the dry run never contacts a remote cache even in a CI job that exports those variables. Fail closed with a message naming the problem when the binary is missing, the command exits non-zero (include its stderr), or the output is not JSON with a `tasks` array. Never fall back to `npx`.

Find each task by `taskId` (`@openvaa/frontend#build`, `@openvaa/docs#build`) and fail by name when either is absent. Derive each app's tracked population at run time with `git ls-files -z -- apps/<app>` from `REPO_ROOT`. Strip the `apps/<app>/` prefix and keep only paths that exist on disk, so an uncommitted deletion is not reported. Do not hard-code file lists or counts.

Implement the behaviours above. Compare collections with `toEqual([])` on the offending list so a failure names the files. Take the expected dependsOn from the root `turbo.json` `tasks.build.dependsOn`, and compare it with each task's `resolvedTaskDefinition.dependsOn`. The negation check reads `resolvedTaskDefinition.inputs`. It is kept alongside the behavioural check because that check can only bite when the generated directory exists. Both CI jobs that run this spec produce the directory first: the `yarn build` step, and the `paraglide:compile` step.

Write a concise TSDoc header in the present tense. It states what the gate protects: a replayed Vite-app build must not be older than the files it reads, the frontend build must not hash the Paraglide output it writes, and a cache hit must restore that output for the steps that type-check against it. Follow CLAUDE.md "Comment Hygiene": no history, no planning paths or decision ids, nothing addressed to the reviewer.

Before Task 3, observe the red. Make sure `apps/frontend/src/lib/paraglide/` exists (run `yarn workspace @openvaa/frontend paraglide:compile` if needed). Run the spec and confirm that the failing tests are exactly the behaviours marked "red at HEAD", each with a named offending list, and that the dependsOn and anti-vacuity tests pass. Record the red run in the SUMMARY.

Commit the spec together with Task 3 (a red gate alone would break `yarn test:unit`). This is the one sanctioned deviation from per-task commits.
  </action>
  <verify>
    <automated>node_modules/.bin/turbo run typecheck --filter=@openvaa/dev-seed; echo "typecheck_exit=$?"; yarn workspace @openvaa/dev-seed test:unit tests/turboBuildInputsGate.test.ts; echo "gate_exit=$? (expected NON-zero at HEAD: only the tests marked red at HEAD fail)"</automated>
  </verify>
  <done>The spec type-checks (typecheck_exit=0). At HEAD it fails on exactly the "red at HEAD" behaviours, each naming the offending files or globs, and passes the dependsOn and anti-vacuity tests. The red run output is excerpted in the SUMMARY.</done>
</task>

<task type="auto">
  <name>Task 3: Package-level turbo configs for apps/frontend and apps/docs — gate green, cache proof end-to-end</name>
  <files>apps/frontend/turbo.json, apps/docs/turbo.json, CLAUDE.md</files>
  <action>
Skip this task if Task 1 decided DROP, and skip the half of it for an app Task 1 found unaffected.

Create `apps/frontend/turbo.json` as a Turborepo package configuration. Set `$schema` to `https://turbo.build/schema.json`, the root's value. Set `extends` to `["//"]`. Set `tasks.build.inputs` to `$TURBO_DEFAULT$`, then `data/**`, then `!src/lib/paraglide/**`. Set `tasks.build.outputs` to `build/**` and `src/lib/paraglide/**`. Leave `dependsOn` unset so the root's `^build` is inherited.

Why each piece:
- `$TURBO_DEFAULT$` hashes every git-tracked file of the app and leaves out gitignored ones (the Vite plugin's output, `.svelte-kit/`, `build/`, and the machine-local inlang state under `project.inlang/`). The tracked `project.inlang/settings.json` is still covered.
- Do not list `project.inlang/**` explicitly. Its gitignored members are rewritten on compile, which would make the hash machine-dependent and self-referential.
- `data/**` stays explicit although gitignored, because the build script copies `data/` into `build/data`.
- The negation keeps the build's own output out of its hash.
- The outputs entry makes a cache hit restore generated Paraglide for `typecheck`, `lint:check` and the frontend `check` step.
- Do not add further negations, such as test files or docs, to raise the hit rate. The input set must stay a superset of what the build reads.

Create `apps/docs/turbo.json` with the same `$schema` and `extends`, and only `tasks.build.inputs` set to `$TURBO_DEFAULT$`. Its outputs are inherited from the root, because adapter-static writes to `build/`. Nothing under `apps/docs/src` is gitignored, so this is a strict superset of the current `src/**` input.

Leave the root `turbo.json` unchanged: its `src/**` inputs remain correct for the tsup packages.

In CLAUDE.md, under the `### Build System` heading, append two sentences to the existing paragraph:
1. `apps/frontend/turbo.json` and `apps/docs/turbo.json` extend the root configuration so that each Vite app's build hashes every git-tracked file of the app (`$TURBO_DEFAULT$`), and the frontend declares its generated `src/lib/paraglide/**` as a build output while excluding it from the inputs.
2. `packages/dev-seed/tests/turboBuildInputsGate.test.ts` asserts both through a turbo dry run.

Then prove the fix end-to-end, recording every result in the SUMMARY:
- (i) The gate spec passes.
- (ii) Negative controls. Move `apps/frontend/turbo.json` aside: the frontend tests go red. Restore it, move `apps/docs/turbo.json` aside: the docs test goes red. Restore it and confirm `git status --porcelain` shows only the intended files.
- (iii) Cache proof. Run the repo-pinned turbo with `run build --filter=@openvaa/frontend` (exit 0) and take the dry-run hash H1. Delete `apps/frontend/src/lib/paraglide/` and take the dry-run hash H2; H1 must equal H2. Run the same build again: the `@openvaa/frontend:build` log must say it replayed from cache, and `apps/frontend/src/lib/paraglide/messages.js` must exist again.
- (iv) `yarn workspace @openvaa/frontend check` passes on the restored files.
- (v) The gate runs under turbo as CI runs it: repo-pinned turbo with `run test:unit --filter=@openvaa/dev-seed`.

Also record these out-of-scope observations in the SUMMARY without acting on them:
- The frontend `typecheck` task depends on `^build`, not on its own build, so on a fresh clone it relies on generated Paraglide already being present.
- `project.inlang/settings.json` loads its plugins from a CDN with floating major tags, so a build input exists that no hash can cover.
- Remote caching is wired but disabled. If it is ever enabled, `remoteCache.signature` is the integrity control to consider.
  </action>
  <verify>
    <automated>yarn workspace @openvaa/dev-seed test:unit tests/turboBuildInputsGate.test.ts && node_modules/.bin/turbo run test:unit --filter=@openvaa/dev-seed && node_modules/.bin/turbo run typecheck --filter=@openvaa/dev-seed && yarn prettier --check apps/frontend/turbo.json packages/dev-seed/tests/turboBuildInputsGate.test.ts CLAUDE.md && yarn workspace @openvaa/docs format:check && yarn assert:comment-hygiene && yarn assert:declared-binaries && node_modules/.bin/turbo run build --filter=@openvaa/frontend && yarn workspace @openvaa/frontend check</automated>
  </verify>
  <done>
- The gate passes both on its own and under `turbo run test:unit`.
- Moving either package config aside turns the gate red, and restoring it turns the gate green.
- The dry-run hash is unchanged by deleting the generated Paraglide directory, and the rebuild after deletion is a cache hit that restores it.
- The frontend `check` passes.
- Prettier, comment-hygiene and declared-binaries all pass.
- The root `turbo.json` and `.github/workflows/` are unchanged.
- One commit contains the two package configs, the gate spec and the CLAUDE.md sentences.
  </done>
</task>

</tasks>

<source_audit>
| Source item | Covered by |
|---|---|
| Root build inputs omit apps/frontend build inputs (messages/**, static/**, svelte.config.js, vite.config.ts, project.inlang/**) | Task 1 (b) revalidates; Task 3 frontend config; Task 2 gate |
| Remote cache (TURBO_TOKEN in CI) can replay a stale frontend build | Task 1 (d) — disabled in observed CI, so latent; the fix covers local and remote alike |
| Replay skips Paraglide generation | Task 3 outputs add src/lib/paraglide/**; proof (iii)+(iv); Task 2 outputs assertion |
| Fix with a package-level apps/frontend/turbo.json (or equivalent) | Task 3 |
| Also check apps/docs | Task 1 (b); Task 3 docs config; Task 2 docs assertion |
| Note: turbo version and package-config syntax | Task 1 (a); planning trial recorded in objective |
| Note: does CI enable remote cache; does any CI step need src/lib/paraglide before the build | Task 1 (d) |
| Note: verify with `turbo run build --dry=json` | Tasks 1, 2 (gate is a dry run), 3 (iii) |
| Discovered: explicit `src/**` hashes the generated Paraglide dir (CI double frontend build) | Task 1 (c); Task 3 negation; Task 2 assertions |
| Discovered: gitignored `data/` is copied into build/ | Task 3 explicit `data/**` input |
</source_audit>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| turbo cache (local `.turbo/`, remote cache if ever enabled) → working tree | a cache hit writes build artifacts and generated Paraglide that later steps trust as current |
| CI job env → gate's child process | frontend-and-shared-module-validation and dev-seed-integration export TURBO_TOKEN/TURBO_TEAM to every step |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-gjz-01 | Tampering | @openvaa/frontend#build, @openvaa/docs#build cache key | medium | mitigate | `$TURBO_DEFAULT$` inputs in both package configs so any tracked-file edit misses the cache; the gate asserts every tracked file is hashed |
| T-gjz-02 | Tampering | generated `apps/frontend/src/lib/paraglide/` | medium | mitigate | declared as a build output (restored on hit) and negated from inputs (no self-invalidation); gate asserts both; proof (iii)+(iv) |
| T-gjz-03 | Information Disclosure | gate's turbo child process in CI | low | mitigate | child env strips TURBO_TOKEN, TURBO_TEAM, TURBO_API; `--dry=json` executes and uploads nothing |
| T-gjz-04 | Tampering | binary the gate executes | low | mitigate | repo-pinned `node_modules/.bin/turbo` via execFileSync without a shell, fail closed when missing; never `npx` (same contract as `readTurboTasks()`) |
| T-gjz-05 | Denial of Service | CI time / flakiness of the gate | low | accept | the dry run takes about 0.25 s locally and lists files via git, so concurrent writes to gitignored build dirs are not hashed |
| T-gjz-06 | Tampering | remote cache artifact integrity | low | accept | remote caching is disabled in observed CI; `remoteCache.signature` is noted in the SUMMARY for whoever enables it |
| T-gjz-SC | Tampering | npm/pip/cargo installs | low | accept | no package is installed or added; turbo is an existing root devDependency |
</threat_model>

<verification>
- Task 1's Revalidation section exists in the SUMMARY with the PROCEED/DROP decision.
- If PROCEED: `yarn workspace @openvaa/dev-seed test:unit tests/turboBuildInputsGate.test.ts` passes, and it was observed red at HEAD and red under each negative control.
- The dry-run hash of `@openvaa/frontend#build` is unchanged by deleting the generated Paraglide directory, and the rebuild replays from cache and restores that directory.
- `yarn workspace @openvaa/frontend check` passes after the replay.
- `git diff --stat` touches only the four files in `files_modified`.
</verification>

<success_criteria>
- A tracked-file edit anywhere in apps/frontend or apps/docs changes that app's build hash.
- The frontend build hash is stable across its own execution.
- A frontend cache hit restores generated Paraglide.
- A standing gate enforces all three and runs in both CI jobs that run dev-seed tests.
- Or: the item is recorded as dropped, with dry-run evidence.
</success_criteria>

<output>
Create `.planning/quick/260930-gjz-revalidate-then-fix-turbo-json-build-task-inputs-src-tsconfi/260930-gjz-SUMMARY.md` when done.
</output>
