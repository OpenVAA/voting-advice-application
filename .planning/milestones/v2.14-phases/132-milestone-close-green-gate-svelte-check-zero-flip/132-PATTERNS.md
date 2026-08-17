# Phase 132: Milestone-Close Green Gate + svelte-check Zero Flip - Pattern Map

**Mapped:** 2026-07-23
**Files analyzed:** 6 (1 test spec, 1 package.json, 1 CI workflow, 1 anchor doc, 2 bookkeeping docs) + 2 todo file moves
**Analogs found:** 4 / 4 code-touching files (100%); doc files use direct template precedent

> **Note to planner:** This is a process-and-gate phase, not a feature phase. RESEARCH.md already
> carries fully-verified target excerpts (§"Code Examples", §"CI wiring", §"Step-13.5 harden"). This
> PATTERNS.md pins each modified file to its in-repo analog with confirmed line numbers so plan
> actions can cite "copy from X:NN" directly. No new files are created except the anchor doc.

## File Classification

| Modified/Created File | Role | Data Flow | Closest Analog | Match Quality |
|-----------------------|------|-----------|----------------|---------------|
| `tests/tests/specs/candidate/candidate-journey.spec.ts` (step 13.5, ~L660) | test (E2E harness) | request-response (post-submit nav settle) | `tests/tests/utils/voterNavigation.ts:282-305` | exact (same waitForURL-then-settle idiom, candidate analog of voter) |
| `apps/frontend/package.json` (`check` script, L12) | config | transform (build/type-check script) | `apps/frontend/package.json:11` (`typecheck`) + L13 (`check:watch`) | exact (sibling scripts, same svelte-check invocation) |
| `.github/workflows/main.yaml` (frontend job, insert after L73) | config (CI) | batch (CI pipeline step) | `.github/workflows/main.yaml:66-67` (lint step) + L75-76 (frontend build step) | exact (same job, adjacent steps, identical `yarn workspace` shape) |
| `.planning/phases/132-.../132-MILESTONE-CLOSE-ANCHOR.md` (new) | doc (bookkeeping) | — | `.planning/milestones/v2.13-phases/116-milestone-close-green-gate/116-MILESTONE-CLOSE-ANCHOR.md` | exact template |
| `.planning/REQUIREMENTS.md` (HARDN-02 L86, TYPE-10 L107) | doc (checkbox flip) | — | in-file prior `[x]` requirements | exact |
| `.planning/ROADMAP.md` (§Phase 132 ~L609) | doc (checkbox flip) | — | in-file prior ticked phases | exact |
| todos: `2026-07-22-candidate-journey-link-url-status-load-flake.md`, `2026-06-12-resolve-all-svelte-check-errors.md` | doc (lifecycle move) | file-I/O (pending→completed) | `.planning/todos/completed/*` (Phase 131 D-04 stamp precedent) | role-match |

## Pattern Assignments

### `tests/tests/specs/candidate/candidate-journey.spec.ts` step 13.5 (test, request-response)

**Analog:** `tests/tests/utils/voterNavigation.ts:282-305` (Phase 131 hardened `navigateToFirstQuestion`)

**Current failing code** (`candidate-journey.spec.ts:660-663`, verified):
```ts
// Return to home so step 14's clickTask('profile') re-navigates cleanly.
await page.getByTestId(testIds.candidate.profile.submit).click();   // raw click — NO nav wait
await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
  timeout: TIMEOUTS.slowPage
});
```

**Analog pattern to copy — waitForURL-then-settle** (`voterNavigation.ts:294-304`, verified):
```ts
// Ensure the URL has settled on a real question page ... this
// wait prevents the caller's downstream waitForURL from racing the redirect.
await page.waitForURL(/\/questions\//, { timeout: TIMEOUTS.slowPage });
// reason: terminal answer-option settle ... Waiting for an answer option to be stably visible on the
// SETTLED URL guarantees the caller sees a fully-mounted question page rather than a mid-redirect DOM.
const answerOption = page.getByTestId(testIds.voter.questions.answerOption).first();
await answerOption.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
```

**Candidate-app target shape** (from RESEARCH.md §"Step-13.5 harden", split URL-settle from element visibility):
```ts
await page.getByTestId(testIds.candidate.profile.submit).click();
// Settle the post-submit goto() onto the /candidate home route BEFORE asserting the status element,
// so toBeVisible no longer races the save()+goto()+home-remount chain under concurrent full-DAG load.
await page.waitForURL(/\/candidate(?!\/profile)/, { timeout: TIMEOUTS.slowPage });
await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
  timeout: TIMEOUTS.slowPage
});
```

**Reuse option (Don't Hand-Roll):** the `/\/candidate(?!\/profile)/` predicate already exists in
`tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:254-256`
(`expectSubmitMessage()` asserts `toHaveURL(/\/candidate(?!\/profile)/)`). The harden MAY call that
fixture step before the status assertion instead of inlining `waitForURL` (RESEARCH Open Question 2 —
reuse preferred for consistency).

**Timeout vocabulary:** use `TIMEOUTS.page` / `TIMEOUTS.slowPage` from
`tests/tests/helpers/timeouts.ts` — never a magic number. WR-01 advisory (Phase 131): `TIMEOUTS.page`
is the semantically-correct redirect/re-mount budget; `slowPage` is acceptable and more
cold-start-tolerant. Planner picks per todo Solution + D-03.

**Constraint (D-03):** test-side only. Source review found no product bug — `status` + home render are
correct; the flake is a missing navigation-settle in the test. Product change only if a genuine race is
proven, flagged explicitly.

---

### `apps/frontend/package.json` `check` script (config, transform)

**Analog:** sibling script `typecheck` at L11 (identical svelte-check invocation) + `check:watch` at L13.

**Current** (`apps/frontend/package.json:12`, verified):
```jsonc
"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
```

**Target** (append `--fail-on-warnings` — D-08/D-09; native flag, verified in svelte-check 4.4.5):
```jsonc
"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings",
```

**Why:** `--fail-on-warnings` is REQUIRED for the "0 warnings" half of TYPE-10 (default exits non-zero
on errors only). Do NOT use `--threshold warning` — that is a display filter, not an exit-code gate.
Single-source-of-truth: keeping the flag in the shared `check` script means local `yarn check` and CI
enforce the identical 0/0 gate (no CI-only variant that can silently diverge). Leave `typecheck` (L11)
and `check:watch` (L13) untouched — locked scope is the `check` script only.

---

### `.github/workflows/main.yaml` frontend job (config, batch/CI)

**Analog:** existing steps in the SAME job — lint (`main.yaml:66-67`) and frontend build (`main.yaml:75-76`),
both `yarn workspace`/`yarn <script>` blocking steps.

**Existing adjacent steps** (verified, `main.yaml:66-76`):
```yaml
      - name: "Run ESlint check on frontend"
        run: yarn lint:check

      - name: "Run Frontend and shared module tests"
        run: yarn test:unit

      - name: "Configure frontend environment using the repo root .env.example file"
        run: cp .env.example apps/frontend/.env

      - name: "Build frontend"
        run: yarn workspace @openvaa/frontend build
```

**Target insertion** — new blocking step AFTER the `.env` cp (L73), adjacent to the frontend build
(RESEARCH §"CI wiring"):
```yaml
      - name: "Configure frontend environment using the repo root .env.example file"
        run: cp .env.example apps/frontend/.env

      - name: "Type-check frontend (svelte-check, 0 errors / 0 warnings)"
        run: yarn workspace @openvaa/frontend check

      - name: "Build frontend"
        run: yarn workspace @openvaa/frontend build
```

**Ordering constraints (verified, load-bearing):**
- MUST run AFTER "Build all shared modules" (`yarn build`, L60-61) — else `@openvaa/*` imports fail to
  resolve and `check` reports spurious TS2307 module-not-found "errors" (Pitfall 1).
- MUST run AFTER the `cp .env.example apps/frontend/.env` step (L72-73) — `svelte-kit sync` reads `$env`
  type-gen from that (Assumption A3).
- No new `env:` block needed beyond the job's existing `TURBO_*`.
- Fail-fast (D-09 discretion): before-vs-after "Build frontend" both correct; before fails ~seconds
  sooner on a type regression. Planner's call.

---

### `132-MILESTONE-CLOSE-ANCHOR.md` (doc, new)

**Analog / template:** `.planning/milestones/v2.13-phases/116-milestone-close-green-gate/116-MILESTONE-CLOSE-ANCHOR.md`

**Required sections (D-11/D-12, RESEARCH §"Milestone-close anchor doc"):**
1. Header — milestone v2.14, recorded date, requirements HARDN-02 + TYPE-10.
2. Static-gates table — `yarn build`, `yarn test:unit`, **svelte-check 0 errors / 0 warnings** (the
   CHANGED line vs v2.13's "151 baseline"; include the `--fail-on-warnings` CI-encoding note),
   `yarn lint:check`.
3. Full E2E 3× table — one row per run with `Server / DB` provenance (fresh server + clean DB per run)
   and `Result` (passed / failed / did-not-run + duration).
4. Environmental preconditions — clean DB (no default-template pollution) + fresh server per run.
5. Discarded-run log (D-07) — any env-wedge-invalidated run, why discarded, recovery applied.
6. Anchor commit SHA.

**Evidence-artifact convention (Phase 131 precedent):** save raw run logs under a `gate/` subdir —
`132-full-suite-run{1,2,3}.txt`, `132-candidate-journey-isolated.txt`, plus phase-start/phase-close
svelte-check output. The anchor 3× table cites these files. Mirror
`.planning/phases/131-.../post-fix/` (`131-phase-gate-summary.txt`, per-surface `*-3x.txt`, `.gitkeep`).

---

### Bookkeeping flips + todo moves (doc, lifecycle)

**REQUIREMENTS.md:** flip HARDN-02 (L86) `[ ]`→`[x]` and TYPE-10 (L107) `[ ]`→`[x]` with completion notes.
**ROADMAP.md:** tick §"Phase 132" checkbox (~L609+; grep the heading — line may drift, A1).
**Todo moves (D-13):** move both `resolves_phase: 132` todos `todos/pending/` → `todos/completed/` with
terminal stamps — `2026-07-22-candidate-journey-link-url-status-load-flake.md` → **FIXED** (D-01/D-02);
`2026-06-12-resolve-all-svelte-check-errors.md` → **COMPLETE** (gate flipped, live 0/0). Follow Phase 131
D-04 stamp lifecycle precedent (see `.planning/todos/completed/`).
**Do NOT** run `/gsd-complete-milestone` — that ceremony is deferred to the next step.

## Shared Patterns

### Load-tolerant post-navigation assertion (waitForURL-then-settle)
**Source:** `tests/tests/utils/voterNavigation.ts:294-304`
**Apply to:** the step-13.5 harden (the only E2E code change this phase).
Split a post-`.click()` visibility assertion into (a) `waitForURL` settling the client-side `goto()`
transition, then (b) the element `toBeVisible`/`waitFor` — so the element wait composes additively after
the nav instead of racing the save()+goto()+remount chain. Never substitute a `waitForTimeout(...)` sleep
(sleeps are the flake source, not the fix).

### Single-source-of-truth strict check script
**Source:** target `apps/frontend/package.json:12` (+ CI step invoking `yarn workspace @openvaa/frontend check`)
**Apply to:** the TYPE-10 gate wiring.
Put `--fail-on-warnings` in the shared `check` script so local `yarn check` and CI run the identical
0/0 gate — no CI-only variant that can silently diverge.

### Semantic timeout vocabulary
**Source:** `tests/tests/helpers/timeouts.ts` (`TIMEOUTS.page` / `TIMEOUTS.slowPage` / `TIMEOUTS.element`)
**Apply to:** every wait in the step-13.5 harden. Single-source budgets, MAX-observed semantics — never
magic numbers.

## No Analog Found

None. Every code-touching file has an exact in-repo analog (sibling script, adjacent CI step, or the
Phase-131 voter-navigation harden). The anchor + bookkeeping docs replicate the v2.13 close template.

## Metadata

**Analog search scope:** `tests/tests/utils/`, `tests/tests/specs/candidate/`, `tests/tests/fixtures/candidate/`,
`.github/workflows/`, `apps/frontend/package.json`, `.planning/milestones/v2.13-phases/`, `.planning/todos/`
**Files scanned:** 4 code/config analogs read + line-verified this session (voterNavigation.ts,
candidate-journey.spec.ts, main.yaml, package.json)
**Pattern extraction date:** 2026-07-23
</content>
</invoke>
