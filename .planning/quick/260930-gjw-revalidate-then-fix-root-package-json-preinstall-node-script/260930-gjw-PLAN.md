---
phase: quick-260930-gjw
plan: 01
type: execute
wave: 1
depends_on: []
quick_id: 260930-gjw
files_modified:
  - apps/frontend/Dockerfile
autonomous: true
requirements: [QUICK-260930-gjw]

must_haves:
  truths:
    - "From the repository root, `docker build -f apps/frontend/Dockerfile --target base .` completes with exit 0; at the plan's base commit the same build fails inside the base stage's `yarn install --immutable` on the root workspace's lifecycle build"
    - "Every repository path referenced by the root manifest's preinstall / install / postinstall scripts is COPYed into the image before the base stage's `RUN yarn install --immutable` line (the derived COPY-coverage check exits 0, and it exits 1 at the base commit)"
    - "The Node engine guard still runs and still binds inside the Docker install: the fixed base image runs `node scripts/assert-node-engine.mjs` to OK under Node 22, and a scratch node:20-alpine variant of the same Dockerfile fails its install with the guard's own rejection message"
    - "The engine guard is not weakened anywhere: root `package.json` (preinstall and lint:check wiring), `scripts/`, `.yarnrc.yml` and `.dockerignore` are byte-identical to the base commit, `yarn assert:node-engine` and `node scripts/assert-node-engine.mjs --self-test` pass, and the Dockerfile contains no mechanism that turns off Yarn lifecycle scripts"
    - "Every consumer of the Dockerfile (docker-compose.dev.yml production target, apps/frontend/docker-compose.dev.yml development target, render.example.yaml) builds through the fixed base stage and needs no edit of its own"
  artifacts:
    - path: apps/frontend/Dockerfile
      provides: "Base stage copies the root lifecycle scripts' directory into /opt before `yarn install --immutable`, with a present-tense comment saying why"
      contains: "COPY scripts scripts"
  key_links:
    - from: apps/frontend/Dockerfile
      to: package.json
      via: "base-stage `COPY scripts scripts` places /opt/scripts/assert-node-engine.mjs where the root `preinstall` (`node scripts/assert-node-engine.mjs`, run by Yarn as the root workspace's build) resolves it"
      pattern: "^COPY scripts scripts$"
    - from: render.example.yaml
      to: apps/frontend/Dockerfile
      via: "dockerfilePath ./apps/frontend/Dockerfile with dockerContext . (Render builds the production stage, which inherits base)"
      pattern: "dockerfilePath: ./apps/frontend/Dockerfile"
---

<objective>
Revalidate, and if it still holds fix, the Docker install break: the root manifest's `preinstall` runs `node scripts/assert-node-engine.mjs`, but the base stage of `apps/frontend/Dockerfile` copies only `package.json yarn.lock .yarnrc.yml turbo.json`, `.yarn`, `apps` and `packages` before `RUN yarn install --immutable` — never `scripts/` — so the root workspace's lifecycle build cannot find the guard and the install fails.

Purpose: every image build (Render deploys via `render.example.yaml`, the root `docker-compose.dev.yml` production-build check, `apps/frontend/docker-compose.dev.yml` dev container) goes through the base stage, so none of them can build. No CI workflow builds the image, which is why nothing caught it. The fix must restore the build WITHOUT weakening the install-time Node engine guard: the guard must still run, and still reject an out-of-range Node, inside the Docker install.

Output: a one-line (plus comment) Dockerfile change, proven by a before/after `docker build --target base`, a derived COPY-coverage check, and a node:20 negative control. If Task 1 finds the finding no longer holds, the outcome is "dropped — reason" with no code change.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@apps/frontend/Dockerfile
@package.json
@scripts/assert-node-engine.mjs
@.dockerignore
@docker-compose.dev.yml
@apps/frontend/docker-compose.dev.yml
@render.example.yaml

<interfaces>
Facts measured at planning time (2026-09-30, branch fix/888-review-findings @ 79b4faed9). Treat every anchor below as a HINT to the right file and symbol, never as a fact — re-measure before acting; line numbers are deliberately not cited.

- Root `package.json` `scripts.preinstall` is `node scripts/assert-node-engine.mjs`. The same script is also wired into `lint:check` as `yarn assert:node-engine` (the every-run half). Root `prepare` is `husky`; Yarn 4 does not run `prepare` on install and the Dockerfile sets `HUSKY=0`, so it is not an install-time path reference.
- `scripts/assert-node-engine.mjs` imports Node built-ins only (no local imports, no packages) by design, because `preinstall` runs before `node_modules` exists. Root `engines.node` is `>=22`; the base image is `node:22-alpine`, which satisfies it.
- Base stage of `apps/frontend/Dockerfile` (content anchors): `FROM node:22-alpine AS base`, corepack enables Yarn 4.13.0, `ENV HUSKY=0`, then the manifest COPY line, `COPY .yarn ./.yarn`, `COPY apps apps`, `COPY packages packages`, then `RUN yarn install --immutable`. Later stages (`shared`, `frontend`, `development`, `production`) all derive from `base`.
- `apps/frontend/Dockerfile` is the only tracked Dockerfile. Root `.dockerignore` excludes only `**/node_modules` and `**/build` (does not exclude `scripts/`). `apps/frontend/.dockerignore` does not apply when the build context is the repository root. No `.github/workflows/*` job builds the image.
- Workspace lifecycle scripts: only `prepare` (`svelte-kit sync`) in apps/frontend and apps/docs — not run by Yarn 4 on install, and they live inside `apps/` which is already COPYed.
- Planning-time dry run of the COPY-coverage check (the command in Task 1's verify) printed refs `["scripts/assert-node-engine.mjs"]`, COPY sources `package.json, yarn.lock, .yarnrc.yml, turbo.json, .yarn, apps, packages`, missing `["scripts/assert-node-engine.mjs"]`, exit 1.
- Docker 29.7.2 is available locally; `docker system df` showed Build Cache 0B and no `node:*` images present.

Host constraints (from standing project notes, binding on this plan):
- Measure free space INSIDE the Docker VM (`docker run --rm node:22-alpine df -h /`), not on the Mac.
- This host runs TWO Supabase stacks (this project's and an unrelated one). NEVER restart Docker Desktop, and NEVER prune images or volumes. The only permitted reclaim is `docker builder prune -af` (build cache only).
- Never read a gate's status through a pipe: capture each command's exit status directly, then filter its saved log.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Revalidate the finding at the base commit (no code change)</name>
  <files>(none — read-only revalidation; logs go to the executor's session scratchpad, never into the worktree)</files>
  <action>
Set GJW_SCRATCH to a directory inside your session scratchpad (outside the repository) and create it; re-export it in every Bash call, since shell state does not persist. Run every command from the repository root by absolute path.

Step A — static revalidation. Re-read the root manifest's install-time lifecycle scripts (preinstall, install, postinstall) and the base stage of apps/frontend/Dockerfile, then run the derived COPY-coverage check in this task's verify block. It derives the referenced paths from package.json at run time (never a frozen list) and the COPY sources from the Dockerfile lines that precede the first `RUN yarn install`, ignoring `COPY --from=` lines, and fails closed (exit 2) if it finds no install RUN or no path reference. Record its JSON output. Also confirm: `git ls-files` lists no other Dockerfile/Containerfile; neither .dockerignore excludes scripts/; docker-compose.dev.yml (target production), apps/frontend/docker-compose.dev.yml (target development) and render.example.yaml (dockerfilePath ./apps/frontend/Dockerfile, dockerContext .) all build through the base stage; no `.github/workflows` job builds the image. Record each as a one-line finding.

Step B — dynamic revalidation. Record `docker system df` and `docker image ls node` (to know what to clean up in Task 3). Pull node:22-alpine and measure VM free space with `docker run --rm node:22-alpine df -h /`. If under 10 GiB free, run `docker builder prune -af` once and re-measure; if still under 10 GiB, STOP and report a blocker (do not restart Docker Desktop, do not prune images or volumes). Then run the pre-fix build exactly as in this task's verify block, saving the full `--progress=plain` log to "$GJW_SCRATCH/build-pre.log" and capturing the exit status directly. This is a full-monorepo install; allow up to 10 minutes (Bash timeout 600000 or run in background).

Decision branches (record which one fired):
1. HOLDS — the static check exits 1 naming scripts/assert-node-engine.mjs AND the pre-fix build exits non-zero inside the `RUN yarn install --immutable` step with Yarn reporting that the ROOT workspace could not be built (expected: a YN0009 line naming the root workspace; record the exact wording you observe rather than assuming it). Proceed to Task 2.
2. DROPPED — the static check exits 0 (scripts/ is already COPYed, or the preinstall stopped referencing a repo path) OR the pre-fix build exits 0. Stop: the plan outcome is "dropped — <reason>", make no code change, skip Tasks 2 and 3 except Task 3's cleanup step, and write the SUMMARY with the evidence.
3. BLOCKED ELSEWHERE — the pre-fix build fails before the install step, or the install fails for a reason other than the root workspace build (for example an immutable-lockfile error or a dependency's own postinstall). Do NOT widen scope to fix that. Stop and report it as a blocker with the log excerpt; the static finding still stands and is recorded.

The causal confirmation of the root cause is the intervention in Task 2 (adding only the scripts COPY turns the same build green); until then record the diagnosis as UNCONFIRMED.
  </action>
  <verify>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && node -e 'const fs=require("fs");const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));const refs=["preinstall","install","postinstall"].flatMap(k=>((pkg.scripts||{})[k]||"").match(/[\w.-]+(?:\/[\w.-]+)+/g)||[]);const lines=fs.readFileSync("apps/frontend/Dockerfile","utf8").split("\n");const stop=lines.findIndex(l=>/^RUN\s+yarn install/.test(l));const srcs=lines.slice(0,stop<0?0:stop).filter(l=>/^COPY\s/.test(l)&&!/--from=/.test(l)).flatMap(l=>{const t=l.trim().split(/\s+/).slice(1).filter(x=>!x.startsWith("--"));return t.slice(0,-1).map(s=>s.replace(/^\.\//,"").replace(/\/$/,""));});const missing=refs.filter(r=>!srcs.some(s=>r===s||r.startsWith(s+"/")));console.log(JSON.stringify({refs,srcs,installLine:stop+1,missing}));if(stop<0||refs.length===0){console.error("fail-closed: no install RUN or no lifecycle path refs");process.exit(2)}process.exit(missing.length?1:0)'; echo "coverage-check exit=$? (HOLDS expects 1)"</automated>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && docker build --progress=plain -f apps/frontend/Dockerfile --target base -t openvaa-frontend-base:gjw-pre . > "$GJW_SCRATCH/build-pre.log" 2>&1; status=$?; echo "pre-fix build exit=$status (HOLDS expects non-zero)"; grep -nE 'YN0009|YN0007|ERROR|did not complete' "$GJW_SCRATCH/build-pre.log" | tail -20 || true</automated>
  </verify>
  <done>One decision branch (HOLDS / DROPPED / BLOCKED ELSEWHERE) is recorded with evidence: the coverage check's JSON and exit status, the pre-fix build's exit status and the Yarn failure lines from build-pre.log, the VM free-space reading, the pre-run `docker system df` / `docker image ls node` snapshot, and one-line findings for each Dockerfile consumer and .dockerignore. No repository file changed (`git status --porcelain` shows nothing new outside .planning/).</done>
</task>

<task type="auto">
  <name>Task 2: Copy scripts/ into the base stage before install, and prove the Docker install succeeds</name>
  <files>apps/frontend/Dockerfile</files>
  <action>
Only if Task 1 recorded HOLDS.

In the base stage of apps/frontend/Dockerfile, add `COPY scripts scripts` immediately after `COPY packages packages` and before `RUN yarn install --immutable`, preceded by one short comment line in present tense, for example: "Root lifecycle scripts (the preinstall Node engine guard) run from scripts/ during install". Choice of the whole directory rather than the single file (planner's discretion): it matches the existing `COPY apps apps` / `COPY packages packages` form, keeps working if a root lifecycle script ever references another file under scripts/, and costs nothing in layer caching because the `COPY apps apps` layer above already invalidates the install layer on any source change. The directory is checked-in tooling with no secret material.

Constraints (the fix must not weaken the guard anywhere):
- Do not edit package.json (neither `preinstall` nor the `lint:check` chain), anything under scripts/, .yarnrc.yml, or either .dockerignore.
- Do not turn off Yarn's lifecycle-script execution by any environment variable, rc setting or install-mode flag, and do not make the guard conditional on the file existing — either would silence the guard and also skip dependencies' own install scripts.
- Do not change the base image, the Yarn version, or any later stage.
- Comment hygiene (CLAUDE.md, applies to apps/): the comment describes the Dockerfile as it is now — no history of how the break was found, no planning references, nothing addressed to a reviewer.

Then prove it: re-run the COPY-coverage check (now expect exit 0) and the base-stage build tagged openvaa-frontend-base:gjw-post, saving the log to "$GJW_SCRATCH/build-post.log" and capturing the exit status directly (allow up to 10 minutes). Expect exit 0 and a Yarn line showing the root workspace was built (expected: a YN0007 "must be built" line naming the root workspace — record the actual wording). Then run the guard inside the built image: `docker run --rm --entrypoint node openvaa-frontend-base:gjw-post scripts/assert-node-engine.mjs` must exit 0 and print the OK line for Node v22. If the post-fix build fails for a reason unrelated to the scripts COPY, stop and report it as a blocker (BLOCKED ELSEWHERE) instead of widening scope. Commit only apps/frontend/Dockerfile with a conventional message (for example `fix(docker): copy root lifecycle scripts before yarn install`), then immediately record that commit's sha as FIX_SHA (git rev-parse HEAD right after the commit, written into the SUMMARY) and export it for the last verify command — never use a relative HEAD~N anchor, because parallel batch sessions can land commits in between.
  </action>
  <verify>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && node -e 'const fs=require("fs");const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));const refs=["preinstall","install","postinstall"].flatMap(k=>((pkg.scripts||{})[k]||"").match(/[\w.-]+(?:\/[\w.-]+)+/g)||[]);const lines=fs.readFileSync("apps/frontend/Dockerfile","utf8").split("\n");const stop=lines.findIndex(l=>/^RUN\s+yarn install/.test(l));const srcs=lines.slice(0,stop<0?0:stop).filter(l=>/^COPY\s/.test(l)&&!/--from=/.test(l)).flatMap(l=>{const t=l.trim().split(/\s+/).slice(1).filter(x=>!x.startsWith("--"));return t.slice(0,-1).map(s=>s.replace(/^\.\//,"").replace(/\/$/,""));});const missing=refs.filter(r=>!srcs.some(s=>r===s||r.startsWith(s+"/")));console.log(JSON.stringify({refs,srcs,installLine:stop+1,missing}));if(stop<0||refs.length===0){console.error("fail-closed: no install RUN or no lifecycle path refs");process.exit(2)}process.exit(missing.length?1:0)'</automated>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && docker build --progress=plain -f apps/frontend/Dockerfile --target base -t openvaa-frontend-base:gjw-post . > "$GJW_SCRATCH/build-post.log" 2>&1; status=$?; grep -nE 'YN0007|YN0009|YN0000: . Done' "$GJW_SCRATCH/build-post.log" | tail -10 || true; [ "$status" -eq 0 ] || { echo "POST-FIX BUILD FAILED ($status)"; exit "$status"; }</automated>
    <automated>docker run --rm --entrypoint node openvaa-frontend-base:gjw-post scripts/assert-node-engine.mjs</automated>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && [ -n "$FIX_SHA" ] && ! grep -Eiq 'enable-?scripts|skip-build|ignore-scripts' apps/frontend/Dockerfile && git diff --quiet "$FIX_SHA^" "$FIX_SHA" -- package.json scripts .yarnrc.yml .dockerignore apps/frontend/.dockerignore && [ "$(git diff --name-only "$FIX_SHA^" "$FIX_SHA")" = "apps/frontend/Dockerfile" ] && git diff -U0 "$FIX_SHA^" "$FIX_SHA" -- apps/frontend/Dockerfile > "$GJW_SCRATCH/fix.diff" && grep -E '^\+[^+]' "$GJW_SCRATCH/fix.diff" > "$GJW_SCRATCH/fix-added.txt"; [ -s "$GJW_SCRATCH/fix-added.txt" ] && ! grep -Eiq '\.planning|phase [0-9]|spike|\bD-[0-9]{2}|\bT-[0-9]{3}|previously|used to|no longer|\[PR review\]' "$GJW_SCRATCH/fix-added.txt"</automated>
  </verify>
  <done>apps/frontend/Dockerfile's base stage has `COPY scripts scripts` (with a present-tense comment) before `RUN yarn install --immutable`; the coverage check exits 0; `docker build --target base` exits 0 with the root workspace built; the guard runs to OK inside the image; the fix commit touches only apps/frontend/Dockerfile, and package.json, scripts/, .yarnrc.yml and both .dockerignore files are unchanged.</done>
</task>

<task type="auto">
  <name>Task 3: Negative control — the guard still rejects an out-of-range Node inside the Docker install; repo-side guard intact; clean up</name>
  <files>(none in the repository — the node:20 variant Dockerfile and logs live in "$GJW_SCRATCH")</files>
  <action>
Only the cleanup step runs if Task 1 recorded DROPPED or BLOCKED ELSEWHERE; otherwise run all steps.

Step A — Docker negative control. Derive a scratch copy of the FIXED apps/frontend/Dockerfile at "$GJW_SCRATCH/Dockerfile.node20" by editing exactly two lines via sed (never edit the repository file): the `FROM node:22-alpine AS base` line becomes `FROM node:20-alpine AS base`, and the `RUN yarn install --immutable` line gains a failure branch that prints Yarn's build logs and then exits 1, so the guard's own message is visible in the build output (Yarn writes build logs under /tmp/xfs-* inside the build container; if the YN0009 line names a different path, use that path). Assert both substitutions happened (each pattern appears exactly once in the variant) before building. Build it with the repository root as context and `--target base`, saving the log to "$GJW_SCRATCH/build-node20.log" and capturing the exit status directly. Expect: non-zero exit, and the log contains the guard's rejection, whose text begins `assert-node-engine: this Node is v20`. If the variant fails for any other reason (corepack, network, a dependency's install script), the control is INCONCLUSIVE — record it as such and do not claim it as proof.

Step B — repo-side guard intact. Run `yarn assert:node-engine` and `node scripts/assert-node-engine.mjs --self-test`, each with its exit status read directly; both must exit 0.

Step C — cleanup (always). Remove the images this plan created (the gjw-post tag, plus the gjw-pre tag if it exists). Remove node:22-alpine and node:20-alpine ONLY if Task 1's `docker image ls node` snapshot showed them absent before the run. If Task 1's `docker system df` snapshot showed Build Cache at 0B, run `docker builder prune -af`; otherwise leave the build cache and report its size. Never prune images or volumes wholesale and never restart Docker Desktop. Record the final `docker system df`.

Write the SUMMARY with: the decision branch, the before/after build exit statuses and the observed Yarn lines, the negative-control result (PASS / INCONCLUSIVE), the Dockerfile-consumer findings, and this observation for follow-up (not fixed here): no CI job builds the image, so a future root lifecycle reference outside the COPYed directories would go unnoticed again; and the deployment docs page under apps/docs still cites pre-monorepo Dockerfile paths.
  </action>
  <verify>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && sed -e 's|^FROM node:22-alpine AS base$|FROM node:20-alpine AS base|' -e 's|^RUN yarn install --immutable$|RUN yarn install --immutable \|\| (cat /tmp/xfs-*/build.log; exit 1)|' apps/frontend/Dockerfile > "$GJW_SCRATCH/Dockerfile.node20" && [ "$(grep -c '^FROM node:20-alpine AS base$' "$GJW_SCRATCH/Dockerfile.node20")" -eq 1 ] && [ "$(grep -c 'xfs-\*/build.log' "$GJW_SCRATCH/Dockerfile.node20")" -eq 1 ] && { docker build --progress=plain -f "$GJW_SCRATCH/Dockerfile.node20" --target base . > "$GJW_SCRATCH/build-node20.log" 2>&1; status=$?; echo "node20 build exit=$status (expects non-zero)"; [ "$status" -ne 0 ] && grep -q 'assert-node-engine: this Node is v20' "$GJW_SCRATCH/build-node20.log"; }</automated>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && yarn assert:node-engine && node scripts/assert-node-engine.mjs --self-test</automated>
    <automated>! docker image ls --format '{{.Repository}}:{{.Tag}}' | grep -q '^openvaa-frontend-base:gjw-'</automated>
  </verify>
  <done>The node:20-alpine variant's install fails with the guard's own "this Node is v20" rejection (PASS) or is explicitly recorded INCONCLUSIVE with the reason; `yarn assert:node-engine` and the self-test pass; no openvaa-frontend-base:gjw-* image remains; node base images and build cache are cleaned up only per the recorded pre-run snapshot; the SUMMARY records the branch, evidence and follow-up observations.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| repository build context -> Docker image | Files COPYed from the checkout into /opt become part of every image stage, including the production image Render deploys |
| yarn install inside the image build | Runs the root workspace's lifecycle scripts and every dependency's install scripts against the committed lockfile (`--immutable`) |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-gjw-01 | Tampering | apps/frontend/Dockerfile install step | high | mitigate | The fix supplies the guard's file instead of silencing it: Task 2 forbids turning off Yarn lifecycle scripts or making the guard conditional, and its verify negative-greps the Dockerfile for script-disabling mechanisms; Task 3's node:20 variant proves the guard still rejects an out-of-range Node inside the Docker install |
| T-gjw-02 | Tampering | package.json preinstall / lint:check, scripts/assert-node-engine.mjs | high | mitigate | Task 2's verify asserts the fix commit changes only apps/frontend/Dockerfile and that package.json, scripts/, .yarnrc.yml and both .dockerignore files are byte-identical; Task 3 runs `yarn assert:node-engine` and the guard's self-test |
| T-gjw-03 | Information Disclosure | scripts/ copied into the production image | low | accept | scripts/ is checked-in repository tooling (guards and their test fixtures) with no credentials or environment material; the repository is public, so the image exposes nothing new |
| T-gjw-04 | Denial of Service | image builds for Render / compose | medium | mitigate | Before/after `docker build --target base` plus the derived COPY-coverage check prove the install-time failure is gone; the missing CI image build is recorded as a follow-up observation |
| T-gjw-05 | Denial of Service | local Docker host during verification | medium | mitigate | VM free-space pre-flight (10 GiB), build-cache-only reclaim, no image/volume prune and no Docker Desktop restart (a second, unrelated Supabase stack runs on this host), and cleanup limited to images this plan created or pulled |
| T-gjw-SC | Tampering | npm/pip/cargo installs | high | accept | No package is added or upgraded; `yarn install --immutable` runs against the existing committed lockfile, so no new supply-chain surface is introduced and the package-legitimacy gate does not fire |
</threat_model>

<verification>
- Task 1 recorded the decision branch with evidence (coverage-check JSON + exit status; pre-fix build exit status and Yarn failure lines).
- If HOLDS: the coverage check flips from exit 1 to exit 0; `docker build -f apps/frontend/Dockerfile --target base .` flips from non-zero to 0 with only the scripts COPY added (the intervention that confirms the root cause); the guard runs to OK in the built image; the node:20 variant fails with the guard's rejection.
- The fix commit changes only apps/frontend/Dockerfile; the engine guard, its wiring and the ignore files are unchanged; `yarn assert:node-engine` and `--self-test` pass.
- The Dockerfile's added comment obeys CLAUDE.md Comment Hygiene.
- Docker resources created by the plan are removed per the pre-run snapshot.
</verification>

<success_criteria>
- Either: outcome "dropped — <reason>" with evidence and no code change; or: the Docker base-stage install succeeds, the Node engine guard demonstrably still runs and binds inside that install, and nothing outside apps/frontend/Dockerfile changed.
</success_criteria>

<output>
Create `.planning/quick/260930-gjw-revalidate-then-fix-root-package-json-preinstall-node-script/260930-gjw-SUMMARY.md` when done
</output>
