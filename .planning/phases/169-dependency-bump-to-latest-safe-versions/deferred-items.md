## Deferred Items

- `apps/docs/scripts/tsconfig.json` does not type-check, under TypeScript 5.9.3 or 6.0.3, and no gate runs it
  status: open
  **Found during:** 169-02 Task 3, the TypeScript 6 review of every tsconfig the plan's `read_first` names.
  **What:** `tsc -p apps/docs/scripts/tsconfig.json --noEmit` exits 2 on both TypeScript lines.
  - Under 5.9.3 (the pre-plan version, run from the Yarn cache copy `typescript-npm-5.9.3` on 2026-10-03), it reports one error: `node_modules/mdsvex/dist/main.d.ts(2,34): error TS2307: Cannot find module 'unified' or its corresponding type declarations.`
  - Under 6.0.3 (the repository's TypeScript after `ebeaafa5c`), it reports that error plus `apps/docs/scripts/utils/links.ts(9,31): error TS7016` for the untyped `../../mdsvex.config.js` import. TypeScript 6 turns `strict` on by default, and this config sets no `strict`.

  The config does not extend `@openvaa/shared-config/ts`, and nothing runs it. On 2026-10-03, `git grep -n "scripts/tsconfig"` outside `.planning/` found no match. The docs app's `typecheck` and `check` scripts run `svelte-check --tsconfig ./tsconfig.json`, which includes `src/`, `test/` and `tests/` but not `scripts/`. `169-gates.sh` and the workflows under `.github/workflows/` do not reference it either. The scripts themselves (`validate:links`, `check:research-quotes`) run through `tsx`, which does no type-checking, and both are green in every 169 gate run.
  **Why deferred:** The 5.9.3 error is already there before the TS 6 move. The only error TS 6 adds is in a file that no gate checks. Typing the scripts is outside 169-02's scope, which is limited to the toolchain pins.
  **Fix:** Pick one of two options:
  - Bring `apps/docs/scripts/` under a gated type-check: extend the shared base, add the missing `unified` types and a declaration for `mdsvex.config.js`, and add `tsc -p scripts/tsconfig.json --noEmit` to the docs `typecheck` script.
  - Delete `apps/docs/scripts/tsconfig.json` if nothing is meant to type-check the scripts.

- `voter-journey` › "full voter journey end-to-end" failed once at Base-6 (number scale); root cause UNCONFIRMED
  status: open
  **Found during:** 169-07 Task 3, full E2E `169-07-group5` (at `cce9b5b16`).
  **What:** `question-delete` stayed disabled on Base-6, and the test timed out at 240 s; 88 serial dependants did not run. The trace (`tests/playwright-results/voter-journey-voter-journey-full-voter-journey-end-to-end-voter-journey/trace.zip`) shows `expectNumberQuestionAndAdvance` focusing the slider, pressing `End` and clicking Next 14 ms later. On the revisit the slider read 5 and no answer was stored.
  **Why deferred:** Nothing in 169-07 touches the client-side voter answer path. The project passed 3/3 in isolation (`169-07-voter-journey-iso-{1,2,3}`), inside all three `bank-auth-journey` chains, and in the full re-run `169-07-group5-r2` (171/171). It also passed in every earlier 169 run. The spec is not 169-07's to change.
  **Fix (suggested):** in `tests/tests/specs/voter/voter-journey.spec.ts` `expectNumberQuestionAndAdvance`, wait for the answer to be stored before clicking Next, for example `await expect(page.getByTestId(testIds.shared.questionDelete)).toBeEnabled()`. Confirm the race first with a planted delay.
  **Re-examined 2026-10-03 (operator-rulings pass between 169-07 and 169-08) and left deferred: cause still UNCONFIRMED.** `NumberScaleInput.svelte` persists only in its `onchange` handler, and a native range fires `input` and `change` synchronously on `End`. So, unless the answer write behind `onChange` is itself asynchronous (not checked), a 14 ms gap before Next would not lose a change that a hydrated handler received. The trace fits the press landing before the slider's handlers were attached (an SSR-to-hydration or `{#key}`-remount gap, the same class `navMenu.fixture.ts` retries for the menu toggle), but that is a hypothesis. If it is right, a bare wait for `question-delete` to be enabled would turn the 240 s timeout into an earlier, clearer failure without fixing the race. The assertion-preserving fix would then be a retrying block: press `End`, then expect `question-delete` enabled, inside `expect(async () => …).toPass({ timeout: TIMEOUTS.element })`. That needs the race confirmed first (for example by planting a hydration delay), so the spec was not changed.
