---
phase: 169-dependency-bump-to-latest-safe-versions
reviewed: 2026-10-03T19:35:09Z
depth: standard
files_reviewed: 139
files_reviewed_list:
  - .changeset/config.json
  - .github/trufflehog-exclude-paths.txt
  - .github/workflows/claude-code-review.yml
  - .github/workflows/claude-solve-issue.yml
  - .github/workflows/claude.yml
  - .github/workflows/docs.yml
  - .github/workflows/main.yaml
  - .github/workflows/release.yml
  - .lintstagedrc.json
  - .yarnrc.yml
  - apps/docs/package.json
  - apps/docs/src/lib/components/Header.svelte
  - apps/frontend/Dockerfile
  - apps/frontend/README.md
  - apps/frontend/eslint.config.mjs
  - apps/frontend/package.json
  - apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts
  - apps/frontend/src/lib/_guards/eslint-adapter-singleton-guard.test.ts
  - apps/frontend/src/lib/_guards/eslint-parse-posture-guard.test.ts
  - apps/frontend/src/lib/_guards/eslint-store-guard.test.ts
  - apps/frontend/src/lib/api/base/universalAdapter.test.ts
  - apps/frontend/src/lib/api/utils/auth/fetchJwksLeakSafe.test.ts
  - apps/frontend/src/lib/candidate/utils/loginError.ts
  - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte
  - apps/frontend/src/lib/components/questions/QuestionChoices.type.ts
  - apps/frontend/src/lib/components/select/Select.svelte
  - apps/frontend/src/lib/components/video/Video.svelte
  - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
  - apps/frontend/src/lib/contexts/tests/noDataRootDerivedAlias.test.ts
  - apps/frontend/src/lib/dynamic-components/entityList/EntityList.svelte
  - apps/frontend/src/lib/dynamic-components/navigation/NavItem.type.ts
  - apps/frontend/src/lib/layouts/main/Header.svelte
  - apps/frontend/src/lib/layouts/main/Layout.svelte
  - apps/frontend/src/lib/layouts/main/Layout.svelte.test.ts
  - apps/frontend/src/lib/layouts/tests/noRelativeLayoutImports.test.ts
  - apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts
  - apps/frontend/src/lib/server/admin/requireAdminIdentity.ts
  - apps/frontend/src/lib/supabase/server.test.ts
  - apps/frontend/src/lib/supabase/server.ts
  - apps/frontend/src/lib/utils/color/PreviewColorContrast.svelte
  - apps/frontend/src/lib/utils/motion.test.ts
  - apps/frontend/src/lib/utils/sanitize.test.ts
  - apps/frontend/src/lib/utils/settings.ts
  - apps/frontend/src/routes/candidate/help/+page.svelte
  - apps/frontend/tsconfig.json
  - apps/frontend/vite.config.ts
  - apps/frontend/vite.restartOnRootEnv.test.ts
  - apps/frontend/vite.restartOnRootEnv.ts
  - apps/frontend/vitest.config.ts
  - apps/supabase/package.json
  - apps/supabase/supabase/config.toml
  - apps/supabase/supabase/functions/identity-callback/envReadSites.test.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/functions/identity-callback/verifyConfig.test.ts
  - apps/supabase/supabase/functions/invite-candidate/callerAuthority.ts
  - apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
  - apps/supabase/supabase/functions/invite-candidate/index.ts
  - apps/supabase/supabase/functions/send-email/callerAuthority.ts
  - apps/supabase/supabase/functions/send-email/flowConformance.test.ts
  - apps/supabase/supabase/functions/send-email/index.ts
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - apps/supabase/supabase/schema/011-validation-functions.sql
  - package.json
  - packages/README.md
  - packages/app-shared/package.json
  - packages/app-shared/vitest.config.ts
  - packages/argument-condensation/package.json
  - packages/argument-condensation/src/core/condensation/condenser.ts
  - packages/argument-condensation/src/core/types/condensation/condensationResult.ts
  - packages/argument-condensation/src/core/utils/condensation/calculateLLMCallCounts.ts
  - packages/argument-condensation/vitest.config.ts
  - packages/core/package.json
  - packages/core/src/entity/entity.type.ts
  - packages/core/vitest.config.ts
  - packages/data/package.json
  - packages/data/src/core/collection.type.ts
  - packages/data/src/core/dataAccessor.type.ts
  - packages/data/src/root/dataRoot.ts
  - packages/data/src/root/dataRoot.type.ts
  - packages/data/vitest.config.ts
  - packages/dev-seed/README.md
  - packages/dev-seed/package.json
  - packages/dev-seed/src/cli/resolve-template.ts
  - packages/dev-seed/src/ctx.ts
  - packages/dev-seed/src/supabaseAdminClient.ts
  - packages/dev-seed/src/template/linkSentinels.ts
  - packages/dev-seed/src/templates/_helpers/buildMinimal.test.ts
  - packages/dev-seed/src/writer.ts
  - packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts
  - packages/dev-seed/tests/auditBaselineShape.test.ts
  - packages/dev-seed/tests/ciDockerImageBuildGate.test.ts
  - packages/dev-seed/tests/ciSecretScanFlags.test.ts
  - packages/dev-seed/tests/cli/localityGuard.test.ts
  - packages/dev-seed/tests/cli/teardown.test.ts
  - packages/dev-seed/tests/ensureProject.test.ts
  - packages/dev-seed/tests/localSupabaseUrl.test.ts
  - packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts
  - packages/dev-seed/tests/rpcNullabilityGate.test.ts
  - packages/dev-seed/tests/templates/base-app-settings.test.ts
  - packages/dev-seed/tests/templates/base.test.ts
  - packages/dev-seed/tests/writer.test.ts
  - packages/dev-seed/vitest.config.ts
  - packages/dev-tools/package.json
  - packages/filters/package.json
  - packages/filters/src/filter/base/filter.type.ts
  - packages/filters/vitest.config.ts
  - packages/llm/package.json
  - packages/llm/src/llm-providers/llmProvider.ts
  - packages/llm/src/llm-providers/provider.types.ts
  - packages/llm/src/types/llmPipelineResult.ts
  - packages/llm/src/utils/costCalculation.ts
  - packages/llm/tests/llmProvider.test.ts
  - packages/llm/vitest.config.ts
  - packages/matching/package.json
  - packages/matching/tests/space.test.ts
  - packages/matching/vitest.config.ts
  - packages/question-info/package.json
  - packages/question-info/src/core/infoGeneration.ts
  - packages/question-info/vitest.config.ts
  - packages/shared-config/eslint.config.mjs
  - packages/shared-config/package.json
  - packages/shared-config/tsconfig.base.json
  - packages/supabase-types/src/database.ts
  - scripts/assert-dependency-audit.mjs
  - scripts/assert-unit-test-coverage.mjs
  - scripts/lib/audit-run.mjs
  - security/audit-baseline.json
  - tests/README.md
  - tests/playwright.config.ts
  - tests/scripts/tcp-forward.mjs
  - tests/scripts/visual-container.sh
  - tests/tests/specs/visual/visual-regression.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/support/preflight.ts
  - tests/tests/utils/selectElection.ts
  - tests/tests/utils/voterNavigation.ts
  - tests/vitest.config.ts
  - vitest.config.ts
  - vitest.workspace.ts
findings:
  critical: 0
  warning: 4
  info: 9
  total: 13
status: issues_found
---

# Phase 169: Code Review Report

**Reviewed:** 2026-10-03
**Depth:** standard. The non-mechanical changes got deep, cross-file reading; pure version strings and Prettier reflows were skimmed.
**Files Reviewed:** 139. This is `git diff 5ed82f437 HEAD -- . ':!.planning' ':!yarn.lock' ':!.yarn/releases'`. `vitest.workspace.ts` was deleted in the phase.
**Status:** issues_found

## Summary

The phase is mostly version strings, reformatting by Prettier and ESLint 10, comment refreshes and config shape changes. Review effort went to the ten focus areas in the brief. The installed packages were checked against `node_modules`, not against the summaries.

Checks run:

- **AI SDK 7.0.116** (`node_modules/ai/dist/index.{d.ts,js}`):
  - `standardizePrompt` throws on `role: 'system'` in `messages` unless `allowSystemInMessages` is set. It does so for `streamText` too, not only `generateObject`.
  - `Prompt` now carries `instructions`, `system` and `allowSystemInMessages`.
  - `LanguageModelUsage.outputTokens` is "total output tokens", with `outputTokenDetails.{textTokens, reasoningTokens}` as its breakdown.
  - `generateObject` is `@deprecated`.
- **`@ai-sdk/google` 4.0.82:** usage conversion reports `outputTokens.total = candidatesTokenCount + thoughtsTokenCount`.
- **`@supabase/ssr` 0.12.7** (`dist/main/cookies.js`):
  - `applyServerStorage` passes `Cache-Control`/`Expires`/`Pragma` with every cookie write.
  - The wrapped `setAll` already sends headers at most once per client (`hasSentHeaders`).
- **SvelteKit 2.70.3 `setHeaders`** (`respond.js:181-209`) throws on a repeated header name.
- **`setHeaders` and `server.ts`:** `git grep setHeaders apps/frontend/src` finds no route that sets `cache-control` itself. `createSupabaseServerClient` is constructed once per request, in `hooks.server.ts:42`. The universal client has no `setAll`. So the adapter's per-instance dedupe is per-request in practice, and **no duplicate-header path was found**.
- **Edge Function imports.** jose 6.2.12 has no `RSA1_5`, but the old Deno webcrypto build of 5.9.6 could not do it either, so there is no regression. The `importJWK`/`compactDecrypt`/`jwtVerify`/`createRemoteJWKSet` call shapes are unchanged in 6. Bank-auth E2E ran 8/8 and 131/131, three times each (169-07).
- **The jose pin test** compares the `index.ts` literal to the installed `jose/package.json`. It is correct.
- **Disable comments.** `git grep no-useless-assignment` finds exactly three lines (`OpinionQuestionInput.svelte:50`, `Video.svelte:132`, `EntityList.svelte:45`). Each one is `eslint-disable-next-line` and cites `sveltejs/eslint-plugin-svelte/issues/1478`.
- **Drawer focus wiring:**
  - `Header` `$bindable()` → `Layout` `$state` + `bind:drawerOpenElement` is correct.
  - The test mounts the real component.
  - It fails if focus is not returned, because the pre-close `activeElement` is `#drawerCloseButton`.
- **`is_valid_choice_id`** is `STABLE` in both SQL files and parity holds. Its only callers are the `VOLATILE` `validate_answer_value` and triggers. It is not used in an index or generated column, where `STABLE` would be illegal.
- **The restart plugin.** Vite 8's `server.restart()` dedupes concurrent calls (`_restartPromise`). `restartServer` catches and logs its own failures, so `void server.restart()` cannot produce an unhandled rejection.
- **`changesets/action` v2.1.2 `action.yml`** (fetched): `github-token`, `pr-title`, `commit-message`, `publish-script` and `push-with-git-cli` are all valid inputs.
- **`dependenciesMeta`.** Only `esbuild` (both copies) and `unrs-resolver` have install scripts among the installed packages. supabase 2.118.0 has none (see IN-03).
- **`classifyAuditRun` and the gate fail closed:**
  - A non-JSON line, or a JSON line without `children`, goes to `cannotRun`.
  - Empty output with a non-zero or null status goes to `cannotRun`.
- **`isomorphic-dompurify` 4.4.0 on its Node (jsdom 30) export,** smoke-run under Node 24, sanitised `onerror`, `<svg>` and `javascript:` correctly. The jsdom-env unit test resolves the same Node export, because externalised dependencies load through Node's conditions.
- **E2E edits.** None removes or loosens an assertion:
  - `waitForNavigationFocusReset` and the `question-delete` `toBeEnabled` add checks.
  - Two collapse waits move from `TIMEOUTS.element` to `TIMEOUTS.page`, which is a budget change only.
  - `trace: 'off'` applies to the `performance` project only, with the 5000 ms budget unchanged.
- **`space.test.ts`.** The old `describe` nested inside `test` never executed its assertions, and its `delete questionWeights[2]` used the wrong key. Both are fixed, so this test is now stronger.

No crash-class, data-loss or authentication defect was found, so there are no BLOCKERs. The warnings are in the AI SDK 7 migration, which is the one place where behaviour, rather than versions, changed, and in the still-held nodemailer pin.

## Warnings

### WR-01: `allowSystemInMessages: true` is unconditional in the shared provider, overrides the caller, and is justified by an inaccurate comment

**File:** `packages/llm/src/llm-providers/llmProvider.ts:72-80`, `packages/argument-condensation/src/core/condensation/condenser.ts:357-379`
**Issue:** `LLMProvider.generateObject` is the public API of `@openvaa/llm`, and it hard-codes `allowSystemInMessages: true` for every caller. There are three problems:

- **Caller opt-out is ignored.** `LLMObjectGenerationOptions` is `Prompt & …`, and in AI SDK 7 `Prompt` contains `allowSystemInMessages`. A caller can therefore pass `allowSystemInMessages: false`, and it type-checks. The provider then silently forwards `true`.
- **Future callers inherit the opt-out.** A future caller that hands `generateObject` a client-supplied message array, such as a chat-style admin tool, gets no SDK protection against a `role: 'system'` message injected by the user. Nothing in the type or the call site warns about this.
- **The comment overstates the safety.** It says "Callers build these messages server-side from prompt templates", which implies the system message is trusted. It is not. `condenser.ts:358-361` interpolates `comments: JSON.stringify(batch)`, which is candidate-authored free text, into the template, and the whole result is sent as `role: 'system'` (`condenser.ts:379`, `:762`). Candidate text therefore already runs with system-role authority.

That posture is inherited from AI SDK 5, which allowed this by default, so it is not a regression. But this phase re-authorised it explicitly, with a rationale that does not hold. 169-09's "no caller passes a user-authored message array" is true of the array shape, not of the content.

**Fix:** Make the opt-in per call, and let the three known callers declare it:
```ts
// llmProvider.ts
allowSystemInMessages: options.allowSystemInMessages ?? false,
// condenser.ts / infoGeneration.ts request objects
{ messages: [{ role: 'system', content: promptText }], allowSystemInMessages: true, ... }
```
Then correct the comment to say the system message contains untrusted candidate text. The structural fix, worth a todo, is to move the template to `instructions` and the interpolated comments to a `user` message. That also clears the SDK's `messages must not be empty` objection that 169-09 cited.

### WR-02: `generateObject` silently drops `instructions` / `system` / `prompt`, which AI SDK 7 now steers developers towards

**File:** `packages/llm/src/llm-providers/llmProvider.ts:72-80`, `packages/llm/src/llm-providers/provider.types.ts:54-61`
**Issue:** The options type admits every field of the SDK `Prompt` type. `generateObject`, however, forwards only `messages` (`options.messages ?? []`), and `streamText` forwards `instructions ?? system` and `messages` but not `prompt` or `allowSystemInMessages`. The SDK's own rejection message is "System messages are not allowed in the prompt or messages fields. Use the instructions option instead." So a developer who follows it writes `generateObject({ instructions: template, messages: [{ role: 'user', … }] })`. That type-checks, and then the model receives no instructions at all.

The call succeeds and returns schema-valid but unguided output. No error is raised and no test catches it, because every test mocks `generateObject`. The same is true of the `prompt` form, which becomes `messages: []` and then throws an opaque `messages must not be empty`.

Dropping `system` and `prompt` predates this phase. `instructions` is new with AI SDK 7, and this phase added it to the admitted surface.

**Fix:** Forward the prompt fields, or narrow the type so the dropped ones cannot be passed:
```ts
const result = await generateObject({
  model: this.provider.languageModel(model),
  schema: options.schema,
  instructions: options.instructions ?? options.system,
  messages: options.messages ?? [],
  allowSystemInMessages: options.allowSystemInMessages ?? false, // see WR-01
  ...
});
```
Otherwise, change the type to `Omit<Prompt, 'prompt' | 'system' | 'instructions'> & { messages: Array<ModelMessage> }`. Add a test asserting that `instructions` reaches the mocked `generateObject`.

### WR-03: The new cost test pins double-counted reasoning and dropped non-cached input

**File:** `packages/llm/src/utils/costCalculation.ts:47-76`, `packages/llm/src/utils/costCalculation.type.ts:12-16`, `packages/llm/tests/llmProvider.test.ts:772-797`
**Issue:** In AI SDK 7, `outputTokens` is the total output and `outputTokenDetails.reasoningTokens` is a subset of it (`textTokens + reasoningTokens = outputTokens`, which is exactly the fixture the new test builds: 800k + 200k = 1M). `calculateLLMCost` prices all of `outputTokens` at `pricing.output` and then adds `reasoningTokens × pricing.reasoning` on top. `LLMCosts`'s own doc says reasoning is "included in the output costs", yet `total` adds it again.

There is a second problem with `useCachedInput: true`. Input is billed as `cacheReadTokens` only, and the 600k `noCacheTokens` in the fixture are priced at zero.

The new test asserts both wrong totals (`total: 3.6` where the double count is 0.6, and `input: 0.2` where 0.8 is billed). That locks them in, so a future fix will look like a regression.

There is no live impact today: no `MODEL_PRICING` entry sets `reasoning`, and the only production config passes `useCachedInput: false` (`apps/frontend/src/lib/server/llm/llmProvider.ts:17`). The figures feed admin cost reporting and `cumulativeCosts`.

**Fix:** Price reasoning as a split of output rather than an addition, bill uncached input at the full rate in cached mode, and correct the test expectations:
```ts
const reasoningTokens = usage.outputTokenDetails?.reasoningTokens ?? 0;
const textTokens = (outputTokens ?? 0) - reasoningTokens;
const outputCost = (textTokens / 1e6) * pricing.output
  + (reasoningTokens / 1e6) * (pricing.reasoning ?? pricing.output);
// useCachedInput: noCache at pricing.input + cacheRead at (pricing.cachedInput ?? pricing.input)
```
Expected values for the existing fixture: `output = 1.6 + 0.6 = 2.2`, `total = 3.2`, and cached `input = 0.6 + 0.2 = 0.8`.

### WR-04: The `send-email` Edge Function ships nodemailer 6.9.10 with 6 high advisories, which no gate covers

**File:** `apps/supabase/supabase/functions/send-email/index.ts:2`, `security/audit-baseline.json:5-6`
**Issue:** The phase pins supabase-js and jose exactly. `npm:nodemailer@6.9.10` stays on a version that 169-13 counted at 17 advisories (6 high, 10 moderate, 1 low), held by the 7-day age rule until 2026-10-04T07:51Z.

The audit gate reads only `yarn.lock`, so `accepted: []` and "no finding at high or critical" are true of the lockfile but not of what is deployed. The baseline `note` says so, and the todo `2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md` tracks it.

This is recorded here so it is not lost at merge. If the branch merges before the pin moves, the deployed bulk-send function still contains the advisories, and CI stays green.

**Fix:** Apply the held todo, `npm:nodemailer@10.0.11` plus the send-email flow conformance re-run, before merge or before the next deploy, whichever comes first. Separately, add a source-level check to `lint:check` that fails when an `npm:` pin in `apps/supabase/supabase/functions/**/index.ts` matches an advisory. This could be `npm audit --package-lock-only` over a generated manifest of the Deno pins, or a check that the pin equals the catalog version the lockfile audits. That closes the blind spot the baseline note describes.

## Info

### IN-01: Google cost figures change meaning under `@ai-sdk/google` 4

**File:** `packages/llm/src/llm-providers/llmProvider.ts:212-218`, `packages/llm/src/modelPricing.ts:21-23`
**Issue:** `@ai-sdk/google` 4.x reports `outputTokens = candidatesTokenCount + thoughtsTokenCount`. 2.x reported candidates only; this was recalled from 2.x and not re-measured. Costs reported for thinking models (`gemini-2.5-*`) therefore rise. That is closer to Google's actual billing, but condensation or question-info cost logs compared across the upgrade will show a step that is not a usage change. The cause is UNCONFIRMED for 2.x behaviour, because 2.x is no longer installed.
**Fix:** Note it in the llm package changelog or README cost section. If WR-03 is fixed, this becomes a clean output split.

### IN-02: The restart plugin does not handle `unlink` and does not debounce

**File:** `apps/frontend/vite.restartOnRootEnv.ts:18-22`
**Issue:** The plugin listens for `change` and `add` only. If the root `.env` is deleted, the dev server keeps its old environment until a manual restart. Editors that save by rename emit `unlink` + `add`. Vite's `_restartPromise` coalesces concurrent restarts, but two events far enough apart to fall either side of a finished restart cause two full restarts. `vite-plugin-restart` debounced these. Neither case is incorrect behaviour, only a dev-loop nuisance.
**Fix:** Also listen for `unlink`. Optionally wrap the handler in a 100-300 ms trailing debounce. Extend the test with an `unlink` case.

### IN-03: The `dependenciesMeta` allow-list carries an entry with nothing to allow

**File:** `package.json:104-106`
**Issue:** `supabase` 2.118.0 has no `preinstall`, `install` or `postinstall` script; it ships the CLI through `@supabase/cli-*` optional platform packages (RESEARCH line 668). `built: true` therefore allows nothing today. It would, however, silently pre-authorise any install script a future `supabase` release adds, which defeats `enableScripts: false` for that package.
**Fix:** Remove the `supabase` entry. Keep `esbuild` and `unrs-resolver`, which do have postinstalls. Re-add the entry only if a release brings back a script that is actually needed.

### IN-04: `generateObject` is deprecated in AI SDK 7

**File:** `packages/llm/src/llm-providers/llmProvider.ts:3,72`
**Issue:** `ai@7` marks `generateObject` `@deprecated` ("Use `generateText` with an `output` setting instead"). 169-09 knew this and kept it. Recorded so the next SDK major does not remove it unannounced.
**Fix:** File a todo to migrate to `generateText({ output: Output.object({ schema }) })`. That is also the natural point to fix WR-01 and WR-02.

### IN-05: The focus-return change also affects two close paths the new test does not cover

**File:** `apps/frontend/src/lib/layouts/main/Layout.svelte:59-62`, `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte:61`, `apps/frontend/src/routes/(voters)/+layout.svelte:92` (and the candidate/admin layouts)
**Issue:** `closeDrawer()` now really focuses the menu button. It is reached from four paths, and `Layout.svelte.test.ts` covers two of them: the explicit `navigation.close()` and the overlay. The two uncovered paths:

- **A link click with `autoCloseNav`.** Focus moves to the menu button synchronously, then SvelteKit's post-navigation reset moves it again.
- **`onKeyboardFocusOut`.** On Tab or Shift+Tab out of the menu, focus is pulled back to the menu button 50 ms after it landed elsewhere.

Both are reasonable behaviour, and E2E passed 171/171. But they are new behaviours with no unit pin, and the second changes the keyboard tab sequence.
**Fix:** Add one case that simulates a Tab focus-out from the nav, and one where a `NavItem` with `href` is clicked. Assert where focus ends.

### IN-06: `prettier-plugin-tailwindcss` 0.8 sorts the DaisyUI `text-secondary` class as unknown

**File:** `apps/frontend/prettier.config.mjs:3-7`, `apps/frontend/src/lib/components/select/Select.svelte:328`, `apps/frontend/src/routes/candidate/help/+page.svelte:47`
**Issue:** Both frontend reorders move `text-secondary` to the front of the class list. That is where the plugin puts classes it cannot resolve, which suggests the theme (DaisyUI colours) is not loaded. The docs config sets `tailwindStylesheet`, but the frontend config does not. The rendered result is unchanged, because class order in a static attribute does not affect CSS. Only the sort quality and future reformat churn are affected. The cause is UNCONFIRMED.
**Fix:** Add `tailwindStylesheet: './src/app.css'`, or whichever file holds `@import 'tailwindcss'` and the DaisyUI `@plugin`, to `apps/frontend/prettier.config.mjs`. Then run `prettier --check` to see whether the sort stabilises.

### IN-07: The volatility fix was made by editing the applied initial migration

**File:** `apps/supabase/supabase/migrations/00001_initial_schema.sql:194`, `apps/supabase/supabase/schema/011-validation-functions.sql:54`
**Issue:** `IMMUTABLE` → `STABLE` is correct (the body aggregates over its argument), and it follows this repo's single-squashed-migration convention. A hosted database that has already applied `00001`, however, keeps `IMMUTABLE`, and `supabase db diff` against it will report drift. 169-RULINGS records this as harmless on PG15, which is right for query results. It matters only if hosted moves to PG17 with `plpgsql_check`, or if a future reviewer reads the drift as an unknown change.
**Fix:** Put the `CREATE OR REPLACE … STABLE` line in the hosted-Postgres-17 operator todo, or ship it as a one-line forward migration at the first hosted deploy.

### IN-08: The release and docs workflow migrations are verified only statically

**File:** `.github/workflows/release.yml:41-53`, `.github/workflows/docs.yml:28-75`
**Issue:**

- **Inputs check out.** The `changesets/action` v2 inputs were checked against v2.1.2's `action.yml` and are valid. `push-with-git-cli: true` restores v1's default git-CLI commit mode.
- **Untested combination.** Changesets CLI 3, `@changesets/changelog-github` 1, action v2, Node 24's npm and the Pages actions v5/v6 have not run together. Both workflows trigger only on `main`.
- **Publishing auth is unresolved.** `release.yml` sets no `NODE_AUTH_TOKEN`, so publishing relies on npm trusted publishing (`id-token: write`). Per project memory, that is deferred until after the first publish.

All of this is UNCONFIRMED until the first `main` run (169-11 follow-up).
**Fix:** Before merge, run `release.yml` once on `workflow_dispatch` against a fork, or with `publish-script` stubbed to `changeset status`. Dispatch `docs.yml` once right after merge.

### IN-09: The supabase-js Edge pin has no parity test like the jose one

**File:** `apps/supabase/supabase/functions/{identity-callback,invite-candidate,send-email}/index.ts:1`, `.yarnrc.yml` catalog `@supabase/supabase-js: ^2.117.2`
**Issue:** `verifyConfig.test.ts` holds the installed jose to the Edge pin. Nothing holds the three `npm:@supabase/supabase-js@2.117.2` literals to each other or to the catalog. A lockfile refresh that moves the frontend to 2.118 leaves the Edge Functions behind silently, and the audit gate cannot see Edge pins (WR-04).
**Fix:** Add a sibling assertion: all three literals are equal, and equal to the installed `@supabase/supabase-js/package.json` version.

---

_Reviewed: 2026-10-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
