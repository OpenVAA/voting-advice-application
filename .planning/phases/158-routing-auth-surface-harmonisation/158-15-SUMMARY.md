---
phase: 158-routing-auth-surface-harmonisation
plan: 15
subsystem: api
tags: [adapter, error-handling, fail-loudly, admin, form-actions, vitest, svelte-kit]

requires:
  - phase: 158-12
    provides: "the live measurement of the non-admin admin-action POST (ARM: THROWN), the operator ruling that selects `thrown-pin` + the asymmetry, the shared admin gate both actions open with, and the `requireAdminIdentity.test.ts` apparatus that drives both form actions end to end"
  - phase: 158-05
    provides: "`lib/auth/roles.ts`, the single role-set declaration the driving spec's fixtures are built from"
  - phase: 158-02
    provides: "the negative-control ledger this plan appends Section F to"
provides:
  - "`isRefusedResponse` — the ONE predicate the adapter stack uses to decide whether a response is a refusal, shared by `UniversalAdapter.fetch` and `parseResponse`"
  - "`parseResponse`'s own refusal contract: a refused response is thrown ahead of the parser switch, for all four parser arms, so the class is closed by the helper rather than by the arrangement of its callers"
  - "a standing seam regression asserting, per verb, that the parser is never INVOKED for a refused response, with a positive control and a timer-free interleaved-call case"
  - "`assertValidJobId` — one declaration refusing an absent, empty or whitespace-only job identifier, called first by both admin job features, ahead of the pipeline controller, the writer and the job recorder"
  - "one failure shape for both admin form actions, with the adapter-internal message naming an internal API route confined to the server log"
  - "ledger Section F — four round trips, plus the reconciliation of the trial census against the landed one"
affects: [158-16, 158-17, admin job credential lifetime, any future adapter consumer]

actuals:
  tokens: 54000
  tasks: 4
  commits: 7

tech-stack:
  added: []
  patterns:
    - "One exported predicate shared by two layers, so a security-relevant notion cannot be spelled twice and drift"
    - "Pin a negative property AT the collaborator (assert it was not invoked) rather than at the symptom (assert an error was produced)"
    - "Spy-wrapping the real module via `vi.mock(..., importOriginal)` so every other case in the file still runs the real implementation"

key-files:
  created:
    - apps/frontend/src/lib/api/utils/isRefusedResponse.ts
    - apps/frontend/src/lib/server/admin/jobs/assertValidJobId.ts
  modified:
    - apps/frontend/src/lib/api/utils/parseResponse.ts
    - apps/frontend/src/lib/api/base/universalAdapter.ts
    - apps/frontend/src/lib/api/utils/parseResponse.test.ts
    - apps/frontend/src/lib/api/base/universalAdapter.test.ts
    - apps/frontend/src/lib/server/admin/features/condenseArguments.ts
    - apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts
    - apps/frontend/src/lib/server/admin/features/adminJobLifetime.test.ts
    - apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts
    - apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts
    - apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts
    - .planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md
    - .planning/phases/158-routing-auth-surface-harmonisation/158-SWALLOWED-ERROR-MEASUREMENT.md

key-decisions:
  - "Applied the recorded arm as written — `thrown-pin` — and did NOT resurrect OB-5's retracted mechanism; `parseResponse` throws rather than returning a discriminated result, which is why the landed census is 0 sites where the trial's was 11"
  - "Made the two refusals structurally the same predicate (`isRefusedResponse`) rather than two inline `!response.ok` spellings, because the ruling's governing principle was maximum consistency"
  - "Placed the refusal AHEAD of the parser-validity switch, so no refused response can reach the switch at all; the one pre-existing behaviour this changes is `parseResponse(refused, 'invalid')`, which now reports the refusal rather than the bad parser"
  - "Executed BOTH the plan's Task 2 (the job-identifier guard) and the ruling's deliverable 3 (the form-action failure shape); the ⚠ CORRECTION block states that OB-5's deliverable 3 stands on its own merits, and the ruling adds the asymmetry rather than replacing it"
  - "Did NOT write the plan's required sentence claiming this is ruling D8's class, because the phase's own correction withdraws that claim; named the degrader class prospectively instead and recorded the disagreement"

patterns-established:
  - "Shared-predicate consistency: when two layers both decide 'is this a refusal?', export the decision once and have both call it, then pin the agreement with a table-driven case in both specs"
  - "Defence in depth at a transport seam, proven by removal: deleting the outer check leaves the inner contract still refusing, and the ledger row records that as the observation rather than as an argument"
  - "Guard-ordering asserted by observation: record every construction of the machinery the guard precedes, then assert the record is empty, with a positive control proving the record can fill"

requirements-completed: [D10-C09, D10-C12]

coverage:
  - id: D1
    description: "`parseResponse` refuses a refused response itself, for every parser arm, using the same predicate `UniversalAdapter.fetch` uses"
    requirement: D10-C09
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/utils/parseResponse.test.ts#refusing a response the server refused"
        status: pass
    human_judgment: false
  - id: D2
    description: "A refused response never reaches a parser — asserted at the parser, per verb, and observed failing when the adapter's check is deleted"
    requirement: D10-C09
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/base/universalAdapter.test.ts#the refusal seam"
        status: pass
      - kind: other
        ref: "158-NEGATIVE-CONTROL-LEDGER.md § Section F row F1 (planted control, observed red and green)"
        status: pass
    human_judgment: false
  - id: D3
    description: "An absent, empty or whitespace-only job identifier is refused in both admin job features, ahead of the pipeline controller, the writer and the job recorder"
    requirement: D10-C12
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/server/admin/features/adminJobLifetime.test.ts#an invalid job identifier is refused before any job machinery exists"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both admin form actions answer an upstream failure with one shape, and no adapter-internal route name reaches the client"
    requirement: D10-C12
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts#the two admin form actions answer an upstream failure with ONE shape, carrying no internal detail"
        status: pass
    human_judgment: false
  - id: D5
    description: "The census re-run against the landed change and reconciled against the trial census taken before it"
    verification:
      - kind: other
        ref: "yarn typecheck --force (exit 0, 22/22 tasks, 0 errors) + 158-NEGATIVE-CONTROL-LEDGER.md § The census reconciliation"
        status: pass
    human_judgment: false

duration: 80min
completed: 2026-09-02
status: complete
---

# Phase 158 Plan 15: The Response Seam and the Admin Job Surface Summary

**A refused response can no longer become a value at any layer of the adapter stack — the parsing helper now refuses one itself, on the same predicate its caller uses — and both admin job features refuse an invalid job identifier before any machinery exists while both admin form actions stopped leaking an internal API route to the client.**

## The recorded arm, quoted first, because it is the input this work was driven by

From `158-SWALLOWED-ERROR-MEASUREMENT.md` § 5, verbatim:

> **`thrown-pin` + the asymmetry, with MAXIMUM CONSISTENCY as the governing principle.**
>
> The operator's instruction was, verbatim: *"Strive for maximum consistency."* Applied to this decision it selects the `thrown-pin` arm AND folds in the newly measured asymmetry, because leaving two sibling admin form actions with divergent failure handling is exactly the inconsistency to remove.
>
> 1. **`parseResponse` gets its OWN refusal of a non-2xx**, plus a standing regression that pins the seam, plus the census run so the pin is proven not to break a consumer. […] Record honestly that this is NARROWER than OB-5's text, so a reader comparing plan to ruling sees why.
> 2. **The refusal `parseResponse` performs must be CONSISTENT with the refusal `universalAdapter` already performs** — same predicate, same notion of what counts as a refusal.
> 3. **Harmonise the two admin form actions' failure shape, and stop the internal leak.**

And the finding that arm rests on, also verbatim: **"Did OB-5's stated mechanism reproduce? NO."**

This executor did not re-decide any of that. It confirmed the non-reproduction independently — by running the pre-change `parseResponse` directly and watching `UniversalAdapter.fetch`, not the helper, do the stopping — and then applied the arm.

## Performance

- **Duration:** ~80 min
- **Tasks:** 4 (the plan's 3, plus the ruling's deliverable 3 as its own task)
- **Commits:** 7
- **Files touched:** 14 (2 created)

## What changed at the seam, and at the parsing helper

**The predicate is now one thing.** `apps/frontend/src/lib/api/utils/isRefusedResponse.ts` exports the single test — `!response.ok` — and both layers call it. `UniversalAdapter.fetch` no longer spells `!response.ok` inline; `parseResponse` does not spell a second version of it. Two notions of "refusal" inside one adapter would reopen the hole at whichever is the laxer, and that possibility is now structural rather than conventional.

**The helper carries the contract itself.** `parseResponse` throws before its parser switch:

```ts
if (isRefusedResponse(response))
  throw new Error(`Refusing to parse a response the server refused: ${response.status}.`);
```

Ahead of the switch rather than inside one of its cases, so all four parser arms — `json`, `text`, `blob`, `none` — are covered, not just the `'json' | undefined` arm the trial census measured.

**This is narrower than OB-5's text, and that is stated on the record.** OB-5 asked for the shared writer stack to be rewritten. The measured justification for the narrower scope: the helper had exactly two production callers (`universalAdapter.ts:90` in `get`, `:132` in `post`), both already behind the throw. What was genuinely open was the *third caller added tomorrow*, and a contract on the helper is what closes that.

**The class statement written into the seam's docstring**, in one sentence, naming no planning path:

> a helper that hands back the body of a refused response is a degrader: it turns a failure into a value the caller cannot tell apart from success, and every caller that does not know to check first inherits the hole.

## The guard's ordering, quoted from both features

`condenseArguments.ts`:

```
43:  assertValidJobId(jobId);
46:  const controller = new PipelineController(jobId);
54:  const adminWriter = createAdminWriter(source);
72:  const jobRecord = createJobRecorder({
```

`generateQuestionInfo.ts`:

```
54:  assertValidJobId(jobId);
57:  const controller = new PipelineController(jobId);
65:  const adminWriter = createAdminWriter(source);
82:  const jobRecord = createJobRecorder({
```

Guard, then controller, then writer, then recorder — in both. An invalid start therefore does no credential work and makes no outbound call. A comment at each guard states the ordering seam with the writer construction beneath it, naming the ordering rather than a plan number.

## The failure-shape harmonisation

Measured by `158-12`: `argument-condensation` returned `fail(500)` carrying the adapter's own message, `question-info` returned `'Internal server error'`, for the identical upstream failure. Both catch blocks are now byte-identical apart from the log prefix:

```ts
} catch (err) {
  log.error(`[PREFIX] ${err instanceof Error ? err.message : String(err)}`);
  return fail(500, { type: 'error', error: 'Internal server error' });
}
```

Verified by `md5` over both blocks with the prefix normalised — identical. `158-12`'s two-line gate opening is untouched and still byte-identical across the two files (verified the same way).

## The four round trips

Recorded in full in `158-NEGATIVE-CONTROL-LEDGER.md` § Section F. Summarised, each with its observed halves:

| Row | Red half | Observed red, verbatim | Green |
|---|---|---|---|
| F1 — the seam | The adapter's refusal check deleted | `expected "parseResponse" to not be called at all, but actually been called 1 times` (all four verbs) | restored: 48/48 |
| F2 — the helper's contract | The pre-change helper, called directly | returned value `{"error":"Forbidden"}` — a 403's body, handed back as a parsed value | after `6788813a2`: 20/20 |
| F3 — the job-identifier guard | The guard removed from `condenseArguments` only | `expected [ undefined ] to deeply equal []`, `[ '' ]`, `[ '   ' ]` — the pipeline controller constructed with each | restored: 11/11 |
| F4 — the failure shape | The pre-change actions, driven as an admin against a 409/500 | `+ "error": "Error with UniversalAdapter.fetch when parsing response from '/api/admin/jobs/start': 409 • …"` vs `- "error": "Internal server error"` | after `fcc21f55f`: 22/22 |

Two of the four red halves (F2, F4) are the **real pre-change code**, not a plant. F3's plant left the sibling feature intact, so the run also demonstrates that the two features are asserted independently rather than through one shared shortcut.

**A second reading from F1, worth keeping.** With the adapter's check deleted, the caller still received an error — raised by `parseResponse`'s new contract. The class is now closed at two independent layers, and F1 is the observation that the inner one holds when the outer is removed.

## The two censuses, reconciled

| | Trial (`158-12` § 3, before the change) | Landed (`158-15`, after it) |
|---|---|---|
| Shape measured | discriminated result callers must narrow | a **throw** |
| Command | `yarn typecheck --force` | `yarn typecheck --force` |
| Result | **exit 1**, `svelte-check found 11 errors and 0 warnings in 2 files` | **exit 0**, `svelte-check found 0 errors and 0 warnings`, 22/22 tasks |
| Call sites requiring an edit | **11** | **0** |

**They differ because they measure two different changes.** A throw does not alter `ParsedResponse<TParser>`, so no `as SomeDomainType` cast at any call site is invalidated and the compiler has nothing to reject. The trial's 11 remains the correct answer to the question it was asked and stands as the recorded cost of the arm not taken.

**The inherited caveats, carried and re-stated rather than dropped:**

- The trial's **11 was a FLOOR**: every rejected site was an `as` cast acting as a firewall, so changing the writers' declared return types too would have grown it. That caveat belongs to the arm not taken.
- The landed **0 is not "nothing is affected"**. It is the compiler's answer to "which call site fails to type-check", and a throw is invisible to the type system. What establishes that no consumer broke is the *runtime* evidence run alongside it: **80 files / 1540 tests passing**, up from 1502 at the wave-5 baseline, with no pre-existing case removed or reassertioned.
- The trial covered only the `'json' | undefined` arm. The landed change covers **all four parser arms**, because the refusal sits ahead of the switch. On that axis the landed change is *wider* than the trial's even though its census is smaller.

## Collected case counts, before and after

| Spec | Before | After |
|---|---:|---:|
| `parseResponse.test.ts` | 9 | 20 |
| `universalAdapter.test.ts` | 34 | 48 |
| `adminJobLifetime.test.ts` | 3 | 11 |
| `requireAdminIdentity.test.ts` | 18 | 22 |
| frontend unit suite | 1502 | 1540 |

No case was removed and no pre-existing assertion was changed.

## Deviations from Plan

### 1. [Rule 2 — missing critical functionality] The ruling's deliverable 3 was executed although the plan does not contain it

- **Found during:** reading the operator ruling before Task 1.
- **Issue:** the plan's Task 2 implements OB-5's *original* deliverable 3 (the job-identifier guard) and its `files_modified` does not list either `+page.server.ts`. The operator ruling's third item — harmonise the two actions' failure shape and stop the internal leak — has no task at all, yet is an explicit success criterion of this execution and the stated remainder of threat `T-158-65`.
- **Resolution:** both were executed. The ⚠ CORRECTION block in `158-CARRIED-OBLIGATIONS.md` states that "OB-5 deliverables 1, 3 and 4 stand on their own merits regardless", including "the `jobId` guard before `PipelineController`", so the ruling's item is an **addition**, not a replacement. Dropping either would have left a stated obligation unmet.
- **Files modified:** `apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts`, `.../question-info/+page.server.ts`, `apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts` (none in `files_modified`).
- **Commits:** `60081e5a0`, `fcc21f55f`.

### 2. [Rule 3 — blocking] The plan's required class sentence would have re-recorded a retracted claim

- **Found during:** Task 1, writing the seam docstring.
- **Issue:** the plan requires the docstring to say this is *"the same fail-loudly class an earlier ruling named on the write path"* (ruling D8). The phase's own ⚠ CORRECTION block **withdraws exactly that**: "The claim that this is 'ruling D8's fail-loudly class on the read path' is **withdrawn**. The read path already fails loudly. D8's class is not present here."
- **Resolution:** the docstring names the degrader class **prospectively** — the property the helper must not acquire, which is why the contract exists — and does not assert that the defect was present. The disagreement is written up in `158-SWALLOWED-ERROR-MEASUREMENT.md` § 6 so a later reader sees it rather than inferring a contradiction. **This is a weak acceptance criterion reported rather than leaned on**, per the phase's standing instruction.

### 3. [Rule 3 — blocking] Two files were created that the plan's `files_modified` does not list

- `apps/frontend/src/lib/api/utils/isRefusedResponse.ts` — the plan's own acceptance criterion demands the two refusals use the *same predicate*. Two inline copies of `!response.ok` cannot satisfy "same predicate" other than by coincidence, so the predicate was exported once. Follows the `lib/api/utils/` one-util-per-file convention.
- `apps/frontend/src/lib/server/admin/jobs/assertValidJobId.ts` — the plan requires both features to "reject identically"; one declaration makes a divergence inexpressible, matching `158-05`'s single-role-declaration precedent and this phase's stated aversion to "two spellings of one decision".

### 4. [Rule 1 — fixture defect] Eight `parseResponse.test.ts` fixtures gained `ok: true`

- **Issue:** the pre-existing success fixtures were partial `Response` mocks that omitted `ok`, a field every real `Response` carries. Once the helper reads `ok`, `!undefined` reads as a refusal and those fixtures would have described a refusal they did not intend.
- **Resolution:** `ok: true` added to eight fixtures. **Every assertion above them is byte-identical**; no expectation was weakened. The alternative — testing `response.ok === false` instead of `!response.ok` — was rejected because it is a *different predicate* from the adapter's, which is precisely what the ruling's item 2 forbids.

### 5. [Rule 1 — comment hygiene] Comments were re-flowed to single lines

- The project's `assert-comment-hygiene.mjs` guard (chained into `lint:check`) forbids a hard-wrapped comment line that ends without terminal punctuation. 24 violations from the first draft; all joined into single-line paragraphs. Also, `import()` type annotations are banned by `@typescript-eslint/consistent-type-imports`, so the `vi.mock` `importOriginal` generic reads off a top-level `import type * as ParseResponseModule`.

## Instrument traps encountered

- **A `tail`ed pipeline reports the pipeline's exit code, not the command's.** A first `yarn lint:check | tail` printed `EXIT: 0` while the run had actually failed with two eslint errors. Every gate result quoted above was re-taken by redirecting to a file and reading `$?` directly.
- **A vacuous RED was avoided deliberately, and the vacuity is stated rather than hidden.** The seam pin (`the parser was never invoked`) is **green on arrival**, because it pins a property the pre-change tree already had. Its red half is F1's planted weakening — which is exactly what the plan asks for, and is why the plan says to observe it "failing against a deliberately weakened check". Presenting it as a TDD RED would have been false.
- **Every "zero" in this plan has a positive control.** The `parser not invoked` cases are paired with `a successful response DOES reach the parser` (asserting the spy CAN observe an invocation); the guard's three empty-array assertions are paired with a valid-identifier case asserting each record fills; the internal-detail pattern is asserted against the message the adapter actually produces before it is asserted absent.

## Verification

| Gate | Result |
|---|---|
| `yarn typecheck --force` | **exit 0** — 22/22 tasks, `svelte-check found 0 errors and 0 warnings` |
| `yarn workspace @openvaa/frontend test:unit` | **exit 0** — 80 files, **1540 tests passed** |
| `yarn lint:check` | **exit 0** — all 15 chained guards clean |
| `git status --porcelain apps packages tests scripts` | *(empty)* — no plant left in the tree |
| `grep -cE 'setTimeout\|setInterval\|vi\.useFakeTimers\|Promise\.race' adminJobLifetime.test.ts` | **0** |
| Ledger `^\|` line count | 164 → **190** (+26; the verify requires ≥+3) |
| `158-12`'s byte-identical gate opening | preserved — both files' two gate lines hash identically |

No E2E run was required or performed by this plan: every deliverable is a unit-observable property, and the phase's E2E surface belongs to `158-16`. No E2E test was skipped, retried until green, or annotated as flaky.

## Known Stubs

None. No stub, placeholder, TODO or unwired data source was introduced.

## Threat Flags

None. The two files created are a pure predicate and a pure validity assertion; neither opens a network endpoint, an auth path, a file access pattern or a schema surface. `T-158-84` (a refusal's message body reaching a caller that renders it) was dispositioned `accept` by the plan; this plan's deliverable 3 in fact **narrows** it, since the adapter-internal detail no longer reaches the client from either admin form action.

## Notes for the next plan

- `assertValidJobId` sits immediately above the `createAdminWriter(source)` call in both features, with a comment naming that ordering. The credential-lifetime work that rewrites where those writers get their credentials lands *at* the writer construction, one line below, and the two edits compose.
- The trial census's floor caveat still applies to anyone who later tightens the writers' **declared return types**: that change is not covered by this plan's census and would grow the count.

## Self-Check: PASSED

All created files verified present on disk; all seven commit hashes verified present in `git log --all`.
