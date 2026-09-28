---
phase: 138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg
reviewed: 2026-08-14T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - tests/tests/helpers/navigation.ts
  - tests/tests/helpers/index.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/specs/voter/eperm07-term-trigger.spec.ts
  - tests/tests/fixtures/shared/forensicCapture.fixture.ts
  - tests/tests/fixtures/voter/views.ts
  - tests/playwright.config.ts
  - tests/scripts/e2e-run.sh
  - tests/scripts/determinism-batch.sh
  - tests/eslint.config.mjs
  - tests/README.md
  - .gitignore
  - .prettierignore
findings:
  critical: 0
  warning: 10
  info: 9
  total: 19
status: issues_found
---

# Phase 138: Code Review Report

**Reviewed:** 2026-08-14
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

The core claim holds. `git diff --name-status b5ac2f471..HEAD` touches nothing under `apps/` or
`packages/` — the change is entirely test-side, as the diagnosis says. `tests/tests/helpers/timeouts.ts`
is byte-identical (empty diff), `element: 2_000` appears exactly once, and
`grep -rnE 'test\.(skip|fixme|only)\(|describe\.(skip|only)\b' tests/tests` returns nothing. `yarn eslint
--flag v10_config_lookup_from_file tests` is clean (2 pre-existing warnings) and `tsc -p tests/tsconfig.json
--noEmit` exits 0. I also verified the `e2e-runs` eslint ignore empirically by planting a lint-error file in
`tests/e2e-runs/run-01/html/` — it is correctly ignored from both the tests dir and the repo root. The
`tests/README.md` correction (F-1) is factually right: `perm-per-app-notifications.spec.ts:18` is an ordinary
`test.describe` and `playwright.config.ts:777-793` wires the projects live. The 16-run batch HEAD
(`893151635`) differs from tip by exactly one file — `tests/README.md` — so the ledger does cover the shipped
executable tree.

No Critical findings. I could not construct a failure scenario reachable at the production posture on the
current dataset, and I am not going to invent one.

What I did find clusters into three themes:

1. **The shipped settle's guarantee is conditional, and the conditions are unenforced.** Both of its
   stages depend on `landmarkTextBefore` being the text of the page the action navigates *away from*, and
   the helper cannot detect when it is not. In two identified states — a baseline captured one page stale,
   and a `null` baseline — the settle silently degrades to exactly the URL-only / attachment-only behaviour
   the docblock explicitly rejects. Both states are reachable under load, which is the condition the fix
   exists to handle. (WR-01, WR-02)
2. **The named root-cause pattern was fixed at two call sites and left live at two others.** The diagnosis
   names "URL-only settle + swallowed timeout" as link 4 of the mechanism. That exact pattern still ships in
   `tests/tests/utils/voterNavigation.ts:68-71` (`advanceClick`) and in the untouched `clickAndRaceSettle`
   in the very same file as the fix (`navigation.ts:192-197`, live via `utils/voterIntro.ts:71,77`). (WR-04)
3. **The instrument and the evidence harness have neutrality/validity holes of the exact class the phase
   set out to close.** A malformed forcing knob silently becomes the *most permissive* budget available
   (WR-03); the wrapper adopts and then `kill -9`s a dev server it does not own (WR-05); the batch's
   "preflight-confirmed" verdict is an absence check that cannot distinguish "the preflight passed" from
   "the preflight never ran" (WR-09).

## Warnings

### WR-01: The settle's baseline is captured before the caller's entry gate, so a one-page-stale DOM turns it back into the pre-fix no-op

**File:** `tests/tests/helpers/navigation.ts:78-114`, `tests/tests/specs/voter/voter-journey.spec.ts:202-207`, `tests/tests/specs/voter/eperm07-term-trigger.spec.ts:129-134`

**Issue:** `expectUrlChange` reads `landmarkTextBefore` at *wrapper entry* (`voter-journey.spec.ts:204`),
which is several assertions before the navigating click. The inner action then gates on the current
question's heading (`expect(questionHeading).toHaveText(text)`, e.g. `:265`) — and that gate is on the *same
element* the landmark read targets. So if the DOM at wrapper entry is one page stale, the sequence is:

1. baseline := page A's landmark text (stale)
2. inner gate waits for page B's heading — the DOM catches up to B here
3. click on B navigates to C
4. stage 2 asks "landmark text != A?" — the DOM shows **B**, so this is true *immediately*

The settle releases with the DOM on B while the test proceeds to assert against C. That is precisely the
defect the phase named, restored, and the helper has no way to detect it: it cannot distinguish "different
because we arrived" from "different because the baseline was a page behind."

The invariant that makes this safe — every navigation is settled by `settleAfterClientNavigation` — holds
only for chained `expectUrlChange` calls. It is broken at three neighbourhoods, each of which re-establishes
the DOM only through a **non-aborting** `expect.soft`:

- `voter-journey.spec.ts:823` `page.goBack()` → next wrapper at `:839`, bridged only by `expect.soft(lastOption).toBeChecked()` at `:835`
- `:930-:958` the four `previousButton.click()` + `expect.soft(questionHeading).toHaveText(...)` pairs → next wrapper at `:963`
- `:991-:1014` the five back-nav hops → next wrapper at `:1017`

A soft failure at `:1013` does not stop the walk; it hands `:1017` a stale baseline, and from there the
settle guarantees nothing for the rest of the step. The phase's own D-08 reasoning (soft → hard at `:878`,
"a mis-timed arrival must abort HERE") applies verbatim to these gates and was not extended to them.

**Fix:** capture the baseline immediately before the navigating action rather than at wrapper entry, so the
caller's gate cannot invalidate it:

```ts
// voter-journey.spec.ts — pass the read down, or have the action return it.
async function expectUrlChange(page: Page, action: () => Promise<void>): Promise<void> {
  const urlBefore = page.url();
  await action(); // action's own entry gate has now settled the DOM on the page we are leaving
  ...
}
// …and inside each *AndAdvance helper, after its `toHaveText(text)` gate and before the click:
const landmarkTextBefore = await readNavigationLandmarkText(page);
```

Alternatively make the precondition explicit and enforced: have `settleAfterClientNavigation` take the
*expected* origin text and assert it before waiting, so a stale baseline fails loudly at the settle rather
than being silently honoured.

---

### WR-02: Stage 2's predicate is unconditionally true when the baseline is `null`, and an empty landmark always counts as "different text"

**File:** `tests/tests/helpers/navigation.ts:87-91`

**Issue:** two distinct holes in one expression:

```ts
return target !== null && (target.textContent ?? '') !== previous;
```

**(a) `previous === null` makes the comparison a tautology.** `(target.textContent ?? '')` is always a
`string`; `string !== null` is always `true`. So whenever `readNavigationLandmarkText` returned `null`
(`:127` — no `[data-focus-on-nav]` and no `h1` on the origin page), stage 2 collapses to `target !== null`,
i.e. an **attachment-only** wait. The docblock at `:51-58` rejects that check by name: "an attachment-only
wait would pass instantly against Base-2 and settle nothing." The docblock's defence — "a null landmark is
never 'different text' and keeps the wait open" — is about the *destination* being null; it does not cover
the *origin* being null. A `null` origin is reachable in exactly the state the fix targets: the diagnosis
records `headingCount: 0` (no landmark at all) as the observed shape of the defect at high CPU rates, and
`readNavigationLandmarkText` is called without any settle of its own.

**(b) An empty landmark always "differs".** If the destination landmark mounts before its text content
(skeleton, one-frame `{#key}` remount, hydration boundary), `'' !== previous` is `true` and the settle
releases against an empty heading.

Related: `readNavigationLandmarkText` returns raw `textContent` (untrimmed, with template indentation and
newlines), and the predicate compares raw `textContent`. Any whitespace-only difference between a
server-rendered and a client-rendered pass of the *same* heading would satisfy the predicate.

**Fix:** require a non-empty, normalised landmark and treat a null baseline as "any non-empty text is
acceptable, but empty is not":

```ts
await page.waitForFunction(
  (previous) => {
    const target = document.querySelector('[data-focus-on-nav]') ?? document.querySelector('h1');
    if (target === null) return false;
    const text = (target.textContent ?? '').replace(/\s+/g, ' ').trim();
    return text.length > 0 && text !== previous;
  },
  landmarkTextBefore, // normalise identically in readNavigationLandmarkText
  { timeout: TIMEOUTS.page, polling: 50 }
);
```

---

### WR-03: A malformed or empty `EPERM07_FORCE_*` value silently becomes the most permissive setting, not the production default

**File:** `tests/tests/specs/voter/eperm07-term-trigger.spec.ts:81`, `:86`

**Issue:** the file's contract (`:30-33`) is "NEUTRAL BY CONSTRUCTION… neutrality is structural, not
remembered." The parsing does not deliver that for anything other than a strictly-unset variable.

```ts
const FORCED_ELEMENT_BUDGET = Number(process.env.EPERM07_FORCE_BUDGET_MS ?? TIMEOUTS.element);
```

`??` only catches `undefined`. An **exported-but-empty** variable (the standard result of
`env: EPERM07_FORCE_BUDGET_MS: ${{ inputs.budget }}` with no input, or `EPERM07_FORCE_BUDGET_MS= yarn
test:e2e`) yields `Number('') === 0`, and Playwright treats `timeout: 0` as **no timeout** — so the only
assertion in the phase's permanent regression guard (`:256-258`) becomes a wait bounded solely by the 90 s
test timeout. The instrument whose entire purpose is measuring whether the trigger appears inside 2000 ms is
silently converted into an assertion that cannot fail on latency. A non-numeric value (`EPERM07_FORCE_BUDGET_MS=2s`)
yields `NaN`, whose timeout semantics are undefined.

The CPU knob has the mirror-image asymmetry: `Number('') === 0` → `0 <= 1` → `applyCpuThrottleKnob` returns
`null` and the throttle is **silently not applied**, so an operator hunting at "rate 40" reads a
no-reproduction result from a run that had no throttle. `Number('abc')` → `NaN`, and `NaN <= 1` is `false`,
so the code proceeds to `client.send('Emulation.setCPUThrottlingRate', { rate: NaN })` — `NaN` serialises to
`null` over CDP and the test dies with a protocol error rather than a usage error.

`e2e-run.sh:174` and `determinism-batch.sh:179` unset all three, so the *gate* path is protected. The hunt
path and any third-party invocation of the now-permanent spec are not.

**Fix:**

```ts
function forcedNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive finite number (got '${raw}')`);
  }
  return parsed;
}
const FORCED_ELEMENT_BUDGET = forcedNumber('EPERM07_FORCE_BUDGET_MS', TIMEOUTS.element);
const FORCED_CPU_RATE = forcedNumber('EPERM07_FORCE_CPU_RATE', 1);
```

`EPERM07_NO_VT` is correct as written (`=== 'true'`, `:94`).

---

### WR-04: The named root cause is still live in two shared navigation helpers the fix did not touch

**File:** `tests/tests/utils/voterNavigation.ts:49-71`, `tests/tests/helpers/navigation.ts:183-198` (consumed at `tests/tests/utils/voterIntro.ts:71,77`)

**Issue:** `138-DIAGNOSIS.md` § Named root cause defines link 4 as a settle that "settles on the **URL only**
… and it **swallows its own timeout**". Two shared helpers still do exactly that after this phase:

```ts
// utils/voterNavigation.ts:68-71 — advanceClick
await Promise.race([
  page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 }).catch(() => null),
  target.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => null)
]);
```

`Promise.race` means the URL branch — the one the diagnosis proves fires first (`client.js:1759-1760` before
`:1824`) — normally wins, and both branches swallow, so "the navigation never happened" and "the navigation
committed the URL but not the DOM" remain indistinguishable downstream. `advanceClick` drives
`voter-journey.fixture`'s `answerAndAdvanceToResults`/`walkUntilQuestionsIntro` stack, which
`perm-hide-category-tags.spec.ts`, `perm-hide-election-tags.spec.ts`, `minimalVoterResultsPage.fixture.ts`
and `candidate-journey.spec.ts` all sit on.

`clickAndRaceSettle` (`navigation.ts:192-197`) is the same shape — swallowed click plus swallowed URL race —
and it is exported from the barrel alongside the fixed settle. The file now contains a correct settle and a
defective one side by side, with the module docblock (`:1-20`, unchanged) still describing the file as
"thin wrappers around `expect(page).toHaveURL(...)` and the `click + race-against-URL-change` pattern" and
recording that the two "co-exist intentionally". That justification is a layering argument
("domain-specific assembler" vs "generic counterpart"); the defect the phase named is a correctness
property, and it is present in both.

**Fix:** either route `advanceClick`'s post-click settle and `clickAndRaceSettle`'s destination wait through
`settleAfterClientNavigation`, or — if the swallow is genuinely wanted for the best-effort click path —
document the residual exposure explicitly in each docblock and file it as an open item, so a later reader
does not take "the settle was fixed in Phase 138" as covering the whole suite.

---

### WR-05: `e2e-run.sh` adopts a dev server it did not spawn, then `kill -9`s it

**File:** `tests/scripts/e2e-run.sh:276-291`, `:149-156`

**Issue:** the header (`:22-24`) states "NOTHING is already listening on $FRONTEND_PORT" as a prerequisite,
but the script never asserts it. The wait loop tests `lsof … -sTCP:LISTEN` *first* and only then checks
whether our own child is alive:

```bash
while [ "$(date +%s)" -lt "$devserver_deadline" ]; do
  if lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN > /dev/null 2>&1; then listening=true; break; fi
  if ! kill -0 "$DEV_PID" 2>/dev/null; then … exit 5; fi
```

With a pre-existing listener the loop breaks on the very first poll, so the `kill -0` liveness probe never
runs — our `yarn dev` can have already died on Vite's `strictPort` and the wrapper reports "dev server
listening on $FRONTEND_PORT" regardless. The suite then runs against a server the wrapper does not own,
which is the "something answered on the port" ambiguity the file's own comment at `:266` says the design
eliminates. (The Phase-137 preflight catches the *wrong-checkout* case; it does not catch
*right-checkout-wrong-owner*, which is exactly the case a wrapper looping unattended will hit.)

The teardown then compounds it: `cleanup` unconditionally `kill -9`s **every** holder of the port
(`:151-154`), including one it never spawned — an operator's own `yarn dev`, or any unrelated process that
happens to hold 5273.

**Fix:** assert the port is free before spawning, and scope the belt-and-braces kill to our own process
group:

```bash
# before `set -m` / the spawn
pre_holders="$(lsof -nP -tiTCP:"$FRONTEND_PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$pre_holders" ]; then
  echo "e2e-run.sh: FATAL -- port $FRONTEND_PORT already has a listener (pids: $pre_holders)." >&2
  echo "            This wrapper SPAWNS AND OWNS its dev server; adopting a foreign one is not evidence." >&2
  exit 5
fi
# in cleanup, only kill holders whose pgid is our own child's
```

---

### WR-06: A flag given without a value exits 1 — the code documented as "Playwright reported failures"

**File:** `tests/scripts/e2e-run.sh:93-118`, `tests/scripts/determinism-batch.sh:116-148`

**Issue:** every flag branch does `VAR="${2:-}"; shift 2`. When the flag is the last argument, `shift 2`
fails (only one positional remains) and, under `set -euo pipefail`, the script dies **silently with exit 1**
— no message, no usage. For `e2e-run.sh` that collides head-on with its own exit-code table (`:49-59`),
where `1` means "Playwright reported failures" and `2` means "usage error". A caller branching on the status
alone — which the table says it must be able to do — reads a typo as a test failure. `determinism-batch.sh`
has the same shape and would record it as `RUN_STATUS=1` → `INVALID` with a reason naming the wrapper's exit
table.

**Fix:**

```bash
--run-dir)
  if [ $# -lt 2 ]; then echo "e2e-run.sh: --run-dir requires a value" >&2; usage >&2; exit 2; fi
  RUN_DIR="$2"; shift 2 ;;
```

---

### WR-07: `df -k` parsing is not portable; a wrapped device line aborts the batch at run 01 with a nonsense message

**File:** `tests/scripts/determinism-batch.sh:507`

**Issue:**

```bash
AVAIL_KB="$(df -k "$REPO_ROOT" | awk 'NR==2 {print $4}')"
```

Without `-P`, GNU coreutils `df` wraps a long device name onto its own line, making `NR==2` the continuation
row; `$4` is then empty. `AVAIL_KB=""` makes `$(( AVAIL_KB / 4 ))` evaluate to `0`, the guard at `:512`
(`RUN1_KB * RUNS > 0`) is unconditionally true, and the batch aborts at run 01 with
"projected artifact volume (… MB unpruned) exceeds a quarter of free disk (**0** MB)" — a disk failure
that is really a parsing failure, on a script advertised for unattended overnight use.

**Fix:** `AVAIL_KB="$(df -Pk "$REPO_ROOT" | awk 'END {print $4}')"`, and refuse to proceed if it is empty or
non-numeric rather than treating it as zero.

---

### WR-08: The batch has no ERR/EXIT trap, so an unexpected death leaves a ledger that affirmatively states "No run in this batch was aborted"

**File:** `tests/scripts/determinism-batch.sh:347-352`, `:321-325`

**Issue:** `trap on_signal INT TERM` covers interrupts, and each validity failure calls `record_abort`
explicitly. Nothing covers a `set -e` death — `git rev-parse` failing, `du -sk` failing, `mkdir` failing, a
full disk during `emit_ledger`. In that state the last-emitted ledger says, at `:322-324`:

> **None.** No run in this batch was aborted, discarded or restarted.

which is affirmatively false, in the one document whose stated purpose is that "silence about a discarded
attempt is exactly what makes a green arguable" (`:31-32`). The only tell is `Batch end | in progress` in the
header table — not in the section a reader checks for aborts.

**Fix:** add an EXIT trap that stamps an incomplete batch:

```bash
on_exit() {
  local st=$?
  if [ "$st" != "0" ] && [ "$INTERRUPTED" != "1" ] && [ "$BATCH_COMPLETE" != "1" ]; then
    record_abort "${RUN_LABEL:-n/a}" "batch terminated unexpectedly (exit $st) — ledger is INCOMPLETE"
  fi
}
trap on_exit EXIT
```

---

### WR-09: "Preflight-confirmed" is an absence check that cannot distinguish a passing preflight from one that never ran

**File:** `tests/scripts/e2e-run.sh:347-357`, `tests/scripts/determinism-batch.sh:470-472`

**Issue:** the verdict is `grep -c 'E2E PREFLIGHT FAILED' stdout.log == 0`. Three different states produce
`0`: the preflight passed; the preflight never executed; or `FAILURE_HEADLINE` at
`tests/tests/support/preflight.ts:97` was renamed and the two copies of the literal drifted apart (they are
bound only by a comment at `e2e-run.sh:78-79`). All three are recorded as "preflight failures 0" and the
batch's validity rule accepts them identically.

I checked: `tests/tests/support/preflight.ts` emits **no output at all on success** (no `console.*`), so a
positive confirmation is not currently possible — which makes `138-05-SUMMARY.md`'s "each confirmed by the
served-app preflight" stronger than what the harness measures. What was measured is "no preflight failure
was printed". A preflight abort does also fail the Playwright exit status, so the practical risk is low, but
the ledger's evidentiary claim rests on this string.

**Fix:** have `assertServedApp` print a fixed success line (e.g. `E2E PREFLIGHT OK <served-root>`), export
both constants from `preflight.ts`, and require `success_count >= 1 && failure_count == 0` in the wrapper —
or, minimally, assert at wrapper start that the literal still exists in `preflight.ts` and exit 4 if it does
not.

---

### WR-10: The new `eperm07-term-trigger` leaf is outside the perm-chain anchor that the config says guarantees no `app_settings` clobber

**File:** `tests/playwright.config.ts:349-355` (new project), against `:514-517` and `:765-767`

**Issue:** `playwright.config.ts:765-767` states the invariant that every perm setup overwrites the single
global `app_settings` row, "so a perm setup must never run while a journey or another perm spec is reading
it". The mechanism that enforces it is `data-setup-perm-1e1cg1co`'s
`dependencies: ['voter-journey', 'candidate-journey']` (`:517`) — it names exactly two leaves. The new
project depends only on `data-setup-base` and nothing depends on it, so it runs concurrently with
`voter-journey` and is not in the anchor.

This is a pre-existing shape (`cold-entry-dataroot`, `voter-dark-mode`, `voter-journey-mobile`,
`voter-alliance`, `voter-nominations` are outside it too) and in practice the new spec is short enough to
finish long before `voter-journey` releases the anchor. But the new spec **hard-asserts settings-dependent
UI** — the category-intro page at `eperm07-term-trigger.spec.ts:166-169` exists only when
`questions.categoryIntros.show` is true, and `voterQuestionsPage.clickStart()` at `:234` only when
`questionsIntro.show` is. A settings clobber therefore surfaces in the phase's designated permanent
regression guard for the shared settle, where it will read as a settle regression. Given the recorded
history of `app_settings` singleton contamination flakes in this suite, that is a bad place for it to
land.

**Fix:** one line — add the leaf to the anchor:

```ts
{
  name: 'data-setup-perm-1e1cg1co',
  dependencies: ['voter-journey', 'candidate-journey', 'eperm07-term-trigger'],
  …
}
```

## Info

### IN-01: The record-integrity audit missed a third stale claim in the same README block it corrected

**File:** `tests/README.md:118-119`, `:137`

**Issue:** F-1 was corrected and F-2 was honestly filed as open. A third stale claim in the same 20-line
block was not caught: the ASCII DAG and the third bullet both name the projects `perm-disable-voter-app` and
`perm-disable-candidate-app`, which no longer exist — `tests/tests/specs/perm/perm-access-disable.spec.ts:4`
records that they were consolidated into `perm-access-disable` (EPERM-11), and
`grep -rn "perm-disable-voter-app" tests/` returns only these two README lines plus that consolidation note.
The filed F-2 open item cites only `:124` and `:135`.

**Fix:** add `:118-119` and `:137` to the filed F-2 open item so the docs pass fixes the block once.

---

### IN-02: The new exports are absent from the helpers README's contracts section, and `navigation.ts`'s module docblock still describes the pre-fix file

**File:** `tests/tests/helpers/README.md:50-57`, `tests/tests/helpers/navigation.ts:1-20`

**Issue:** the README declares "Two contracts are load-bearing" and lists `settleNetworkIdle` (does NOT
swallow) and `iterateSelectOptions`. The suite's now most load-bearing contract —
`settleAfterClientNavigation` settles on the **DOM**, not the URL, and does NOT swallow — is not there, in
the document `helpers/index.ts:21` points readers at. `navigation.ts`'s own module docblock (`:1-20`) is
unchanged and still describes the file as "thin wrappers around `expect(page).toHaveURL(...)` and the
`click + race-against-URL-change` pattern", which is now an incomplete description of its most important
export. Project checklist items "All new components, functions and other entities are documented" / "repo
documentation markdown files are updated".

**Fix:** add a third bullet to the contracts section and one sentence to the module docblock.

---

### IN-03: `video: 'on'` on a permanent project, justified by a rationale that expired with the hunt

**File:** `tests/playwright.config.ts:339-353`

**Issue:** the comment justifies `video: 'on'` (rather than the sibling project's `retain-on-failure`) as
"exactly the latency evidence the hunt needs" — keeping near-miss recordings of runs that passed. The hunt
concluded, the fix landed, and the spec's stated role is now a permanent regression guard. Every future
green gate run therefore writes a video nobody reads. The batch's own numbers (run 01 at 327 MB unpruned)
show artifacts are not free.

**Fix:** switch to `video: 'retain-on-failure'` to match `voter-journey` at `:332`, or update the comment to
state the post-hunt rationale.

---

### IN-04: `usage()` prints a hardcoded line range that already truncates the exit-code table

**File:** `tests/scripts/e2e-run.sh:87-89`, `tests/scripts/determinism-batch.sh:110-112`

**Issue:** `sed -n '2,50p'` against a header that runs to line 59 cuts the exit-code table mid-list — the
same table the header tells the caller to branch on. `determinism-batch.sh`'s `sed -n '2,66p'` against a
76-line header drops its exit codes entirely.

**Fix:** delimit the block instead of hardcoding: `sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'`.

---

### IN-05: The forensic log is unbounded, and its teardown can fail a test whose body passed

**File:** `tests/tests/fixtures/shared/forensicCapture.fixture.ts:73-91`, `:101-108`

**Issue:** `consoleLines` has no cap. A page emitting warnings in a reactive loop (not hypothetical in a
Svelte 5 migration) accumulates in the worker's heap for the life of the test and produces a multi-MB
attachment. Separately, `flushForensicCapture` runs in fixture teardown; if `testInfo.attach` throws (fs
error, exhausted disk mid-batch — a state the batch explicitly plans for at `determinism-batch.sh:512`), the
teardown fails and the test is reported failed even though its body passed. In a project whose cardinal rule
is that no E2E failure is acceptable, a diagnostic that can redden a green run deserves a guard.

**Fix:** cap the arrays (keep first N + last N with an elided marker), and wrap the two `attach` calls so a
capture-side failure degrades to a console warning rather than a test failure.

---

### IN-06: Service-role key on the `curl` argv, and quote-stripping that is broader than described

**File:** `tests/scripts/e2e-run.sh:242-243`, `:217-225`

**Issue:** the key is passed as `-H "apikey: $SERVICE_ROLE_KEY"`, making it visible in `ps` output to any
local user for the duration of each poll (up to 60 polls per run × 16 runs). It is a local-dev key so impact
is low, but `curl -H @file` or `--config` avoids it. Separately, `read_env_var`'s comment says "strip
surrounding quotes", while `tr -d '\042\047\r'` deletes every `"` and `'` **anywhere** in the value — a
value containing one would be silently corrupted and surface as a confusing readiness timeout (exit 4).

**Fix:** feed headers via `curl --config -` on stdin; strip only leading/trailing quotes with a `sed`
anchored pattern.

---

### IN-07: The `INTERRUPTED` guard in `cleanup` is unreachable

**File:** `tests/scripts/e2e-run.sh:140-142`, `:164-167`

**Issue:** the comment presents `if [ "$INTERRUPTED" = "1" ] && [ "$status" = "0" ]; then status=130` as the
mechanism preventing an interrupted run from reporting success. It cannot fire: `on_signal` sets
`INTERRUPTED=1` and then `exit 130`, so the EXIT trap always observes `status=130`, never `0`. The actual
mechanism is the `exit 130` in `on_signal`. Harmless belt-and-braces, but the comment attributes the
guarantee to code that never executes — worth correcting so a later reader does not remove the real
mechanism believing this one covers it.

**Fix:** reword the comment to say the guard is a redundant backstop, or drop the flag.

---

### IN-08: `EXPECTED_EXECUTED=135` is a magic constant coupled to the whole suite with no automated reconciliation

**File:** `tests/scripts/determinism-batch.sh:86-89`

**Issue:** any spec added or removed anywhere in `tests/` makes every subsequent batch abort at run 01 with
"executed count is N, expected 135 — a test that did not run is a failure", which reads like a product
defect rather than a stale constant. The design is deliberate (the ledger states it as a decision) and
failing loudly is the right posture, but nothing points a future maintainer at the constant.

**Fix:** name the constant in the abort message ("update `EXPECTED_EXECUTED` in
`tests/scripts/determinism-batch.sh:89` if the suite's test count changed intentionally").

---

### IN-09: The `auto: true` fixture forces a browser page for every test in 18 importing files

**File:** `tests/tests/fixtures/voter/views.ts:99-105`

**Issue:** because the fixture is `auto` and depends on `page`, every test importing the voter views root now
instantiates a page whether or not it declares one, and pays the teardown flush. Today all 14 spec files (plus
4 others) that import the root already take `page`, so the practical cost is the three listeners the docblock
states. The deliberate convention break is well argued at `forensicCapture.fixture.ts:32-47`. What is missing
is a removal trigger: the fixture is permanent instrumentation justified by "the next occurrence is data"
(waiver condition 3), with no stated condition under which it comes back out.

**Fix:** note the removal condition in the docblock (e.g. "remove when DEF-135-04's amplifier is localised or
at v2.16 close, whichever is first") and add it to the deferred-items ledger.

---

_Reviewed: 2026-08-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
