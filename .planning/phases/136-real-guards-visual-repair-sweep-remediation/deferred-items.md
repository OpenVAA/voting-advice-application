# Deferred items — Phase 136

Out-of-scope discoveries logged during execution. Not fixed here (scope boundary).

## From 136-02 (F12 / F14 remediation)

### D-136-02-1 — Pre-existing locale-dependent failure in `formatAnswer.test.ts`

**File:** `packages/data/src/utils/formatAnswer.test.ts:25`

```
FAIL |@openvaa/data| formatDateAnswer > Should return the formatted date string
                    using the default format when question.format is undefined
AssertionError: expected '5.10.2023' to be '10/5/2023'
```

Present on the baseline run **before** any 136-02 edit and unchanged after. The test hardcodes an
`en-US` rendering (`'10/5/2023'`) while `formatDateAnswer` falls back to the **ambient machine
locale** when `question.format` is undefined; this machine is `fi`, so it renders `'5.10.2023'`.

Same defect family as the phase's theme — a test whose outcome depends on ambient environment
rather than on the code under test — but it is a *false failure*, not a fake guard, and it is
outside the F12/F14 site list. Fix belongs in a separate change (pin the locale explicitly in the
test, or make the fallback locale deterministic in `formatDateAnswer`).

### D-136-02-2 — `arrayContaining` in `packages/dev-seed/tests/templates/base.test.ts:254`

```ts
expect(cat?._constituencies?.external_id).toEqual(
  expect.arrayContaining(['test-e2e-base-co-mun-se', 'test-e2e-base-co-mun-sw'])
);
```

Same subset-matcher class as F12, but the audit deliberately did not list it and it sits outside
this plan's grep scope (`packages/data`, `packages/filters`). Unlike the F12 sites, it is not
obvious that the SE/SW pair is the *complete* intended sentinel set rather than a required subset —
converting it without confirming the template's intent risks turning a correct assertion into a
brittle one. Needs a decision from whoever owns the base template's scoping sentinels.

## From 136-01 (F7 dead-wait removal)

**Give `NumberScaleInput.svelte` a question-id-scoped `name` attribute.**
`apps/frontend/src/lib/components/questions/NumberScaleInput.svelte` renders the
native range with `data-testid="question-number-slider"` and no question-id
scoping (its only label handle is a per-mount `getUUID()`). `QuestionChoices.svelte`
already carries `name="questionChoices-{question.id}"` precisely so the voter walk
can disambiguate the incoming question from the outgoing one during the page-reuse
DOM lag. Extending the same contract to the slider would let
`voter-journey.fixture.ts` drop the `sliderJustAnswered` guard, would close the same
latent stale-slider hazard in the loop-entry probe (~line 329), and would remove the
last case (two adjacent NUMBER questions) that still pays the 10s wait.

Not done in 136-01: it is product code, and 136 is a test-guard remediation phase.
One line, render-invisible (`name` on an `<input type="range">` is standard form
semantics and the app does not use native form posts for answers).

## From 136-04 (F2 raw-i18n-key scanner)

### D-136-04-1 — The scanner covers voter surfaces only; candidate-app surfaces are unscanned

`assertNoRawI18nKeys` is wired into `assertAxeScan`, so it runs on exactly the surfaces the
`AXE_ROUTES` table declares: 7 voter routes x 2 themes. That is where 5 of the 7 tabulated F2 sites
live, and the scanner covers **every** catalog key on them, current and future.

It does NOT reach the candidate app. The two F2 sites outside its blast radius are
`candidate-journey.spec.ts:921` (`toHaveText(/edit/i)` vs `candidateApp.questions.*.editAnswer`) and
`candidateProfilePage.fixture.ts:174` (`toContainText(/required/i)` vs `common.required`). Both are
still blind to a catalog break on the candidate profile/questions surfaces.

The fix is not more site patches — it is extending the axe route table (or an equivalent
authenticated scan family) to the candidate app, which would bring the raw-key gate along for free
and close an a11y coverage gap at the same time. That is a phase-sized piece of work with its own
auth-fixture and dataset questions, so it is recorded rather than smuggled into a test-guard plan.

## From 136-05 (F6 visual-regression repair)

### D-136-05-1 — Three copies of the /results election-pin helper remain in tree

Pinning the election before asserting on `/results` is required for determinism (the walk lands on
EL-Reg or EL-Mun by coin flip). Three implementations now exist:

- `tests/tests/utils/selectElection.ts` — created by this plan, consumed by the visual spec.
- `numberScale.probe.spec.ts` — a private copy, functionally identical to the shared one.
- `voter-journey.spec.ts` — `expectElectionOptionAndSelect`, a stricter variant that additionally
  locks the listbox accessible name (FIX-02); that one is a *different* contract, not duplication.

Only the probe copy is redundant. It was left alone to keep this plan's blast radius on the visual
chain: switching it means re-running the probe family to prove nothing moved, which is verification
budget this plan spent on the 3x baseline-stability gate instead. Collapse the probe onto the shared
helper next time the probe family is touched for another reason.

### D-136-05-2 — Baselines depend on reaching fonts.googleapis.com at run time

`staticSettings.font.url` loads Inter from Google Fonts with `display=swap`, so every visual run
needs public network access to render the font the baselines were captured with. `settleFonts` now
turns a missing font into an explicit "Inter did not load" failure instead of an inscrutable
whole-page pixel diff, but the underlying dependency stands: an offline or egress-restricted runner
cannot pass the visual job. Self-hosting the font (or vendoring a woff2 into the app) would remove
the network from the gate and is the real fix.

## From 136-06 (verification gate)

### D-136-06-1 — `@openvaa/data` / `@openvaa/filters` unit tests are not reached by any CI command

Discovered while corroborating REAL-02 at the gate. `yarn test:unit` is `turbo run test:unit`, so it
runs only workspaces that declare a `test:unit` script. Measured (`yarn test:unit --force`, 19/19
tasks, 0 cached): the task graph resolves to `app-shared`, `dev-seed`, `docs`, `frontend`, `supabase`
— and to nothing else. `@openvaa/core`, `data`, `filters`, `matching`, `llm`, `question-info` and
`argument-condensation` each ship a working `vitest.config.ts` and **no** `test:unit` script, so no
CI command reaches them. They run only under a bare root `vitest` (wired by the root
`vitest.config.ts` workspace array), which nothing in `.github/workflows/main.yaml` invokes.

Consequence for this phase: the **eleven** F12 assertions plan 02 converted to exact equality — the
ones a two-run negative control proved catch 8 over-inclusion regressions the old matchers could not
see — are real guards that nothing on `main` executes. Same pathology as sweep finding F5, different
mechanism (a missing script rather than a skip condition).

Not fixed at the gate because it has a prerequisite: wiring these packages in makes `yarn test:unit`
red on D-136-02-1 (`formatAnswer.test.ts:25` hard-codes an `en-US` rendering while
`formatDateAnswer` falls back to the ambient machine locale; this machine is `fi`). Choosing between
"pin the locale in the test" and "make the fallback deterministic in the implementation" is a product
decision. Filed at `.planning/todos/pending/2026-08-12-data-filters-unit-tests-not-in-ci.md` and
carried as a named boundary in REAL-02.

### D-136-06-2 — The visual gate needs the Vite dev server bound beyond loopback

Running the visual project in the CI-matching container requires the host's dev server to be
reachable from the Docker VM gateway. Vite binds `127.0.0.1` by default, so the containerised run
fails at the served-app check with `socat ... connect(... 192.168.65.254:5174): Connection refused`
until the server is started with `--host 0.0.0.0`. This is a **local re-baselining/verification
concern only** — in CI the visual job runs Playwright directly on the runner, against localhost, so
nothing needs to change in the workflow. Worth recording because the container recipe quoted in
`visual-regression.spec.ts`'s docblock does not mention it, and the failure mode (connection refused
from inside the container while `curl localhost` works fine on the host) reads like a networking
problem rather than a bind-address one.
