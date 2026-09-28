---
phase: 155-edge-function-hardening-env-jwt-provider-identity
plan: 06
subsystem: phase-closure
tags: [sweep, disposition, negative-control, e2e, bank-auth, edge-functions, evidence]
status: complete

requires:
  - 155-01 through 155-05 SUMMARYs on disk (the shared-ID gate needs every declaring sibling finished)
  - a running local Supabase and Docker, for the served-function half of the gate
provides:
  - 155-PORT-LOCALHOST-SWEEP.md — REVIEW-EDGE-02's disposition half, 273 hits, four labels, exhaustiveness tripwire
  - five filed todos under .planning/todos/pending/, each with re-measured file:line anchors
  - a complete 155-NEGATIVE-CONTROL-LEDGER.md — three rows, no cell reading pending, every log path resolution-tested
  - the phase's first SERVED-Deno run of identity-callback, flip-tested against the pre-155 recipe
  - the reword that closes window 172 across all five byte-identical copies in one commit
affects:
  - apps/supabase/supabase/functions/{invite-candidate,identity-callback,send-email} (docstrings only, byte-identity preserved)
  - .planning/REQUIREMENTS.md (REVIEW-EDGE-01/02/03/05 → Complete; 04 rejected by the tool, see below)

tech-stack:
  added: []
  patterns:
    - a partitioned scan evaluated as a residue chain with a catch-all tripwire, so the partition cannot silently drop a hit
    - a scan's clean zero published together with the flip-test that makes it non-zero and an explicit statement of what it cannot see
    - a byte-identical copy set reworded in one commit, because the guard that holds them identical forbids a per-file correction

key-files:
  created:
    - .planning/phases/155-edge-function-hardening-env-jwt-provider-identity/155-PORT-LOCALHOST-SWEEP.md
    - .planning/todos/pending/2026-08-29-edge-function-non-null-env-assertions.md
    - .planning/todos/pending/2026-08-29-dev-seed-silent-supabase-url-defaults.md
    - .planning/todos/pending/2026-08-29-config-toml-hard-coded-ports-phase-156.md
    - .planning/todos/pending/2026-08-29-identity-callback-unreferenced-seed-project-constant.md
    - .planning/todos/pending/2026-08-29-supabase-tooling-silent-database-url-defaults.md
  modified:
    - .planning/phases/155-edge-function-hardening-env-jwt-provider-identity/155-NEGATIVE-CONTROL-LEDGER.md
    - apps/supabase/supabase/functions/invite-candidate/jwtSegment.ts
    - apps/supabase/supabase/functions/send-email/jwtSegment.ts
    - apps/supabase/supabase/functions/invite-candidate/envConfig.ts
    - apps/supabase/supabase/functions/identity-callback/envConfig.ts
    - apps/supabase/supabase/functions/send-email/envConfig.ts

key-decisions:
  - The sweep is partitioned as a residue chain with an exhaustiveness tripwire, because a partitioned scan whose buckets do not sum to the whole silently drops whatever falls between the selectors.
  - Five todos were filed where the plan specified four, because the re-run found two silent env-defaults outside every shape RESEARCH enumerated and the adopted rule requires a filed anchor for that class.
  - Window 172 was FIXED rather than deferred, because it is comment-only, closes a defect this phase created, and is fixable in exactly one commit that keeps byte-identity.
  - Window 161 and the three details: leaks were DECLINED, explicitly and with re-measured anchors, because all three of this plan's tasks declare no source change and the bindings have zero runtime effect.
  - The owed PLAYWRIGHT_BANK_AUTH run was EXECUTED rather than re-deferred, and then flip-tested against the pre-155 recipe so the green is not vacuous.
  - REVIEW-EDGE-04 was NOT force-marked. requirements.ready-ids reported it ready and mark-complete declined it; the row was left exactly as the tool left it.

requirements-completed: [REVIEW-EDGE-01, REVIEW-EDGE-02, REVIEW-EDGE-03, REVIEW-EDGE-05]

coverage:
  - deliverable: "REVIEW-EDGE-02's disposition half: the repo-wide search is run and every hit carries exactly one of four labels"
    human_judgment: false
    verification:
      - kind: command
        ref: "partition tripwire: SUM=273 == TOTAL=273, 'partition exhaustive -- every hit lands in exactly one bucket'"
        status: pass
      - kind: command
        ref: "git status --porcelain apps/supabase/supabase/config.toml -> empty (the hand-off did not become an edit)"
        status: pass
      - kind: command
        ref: "git status --porcelain -- apps packages tests scripts -> empty (nothing unstaged, so the git-grep count is not vacuous)"
        status: pass
  - deliverable: "The sweep's zero in the Edge Functions bucket is load-bearing, not the artefact of a scan that examines nothing"
    human_judgment: false
    verification:
      - kind: command
        ref: "flip loopback half: injected 127.0.0.1 at send-email/index.ts:28 -> RED at the exact line; reverted -> 0, tree clean"
        status: pass
      - kind: command
        ref: "flip port half: injected bare '54321' at invite-candidate/index.ts:10 -> loopback half MISSES (0), port half RED (1); reverted -> 0, tree clean"
        status: pass
  - deliverable: "Everything this phase surfaced and did not fix is a filed todo with a file:line anchor, per D-N2"
    human_judgment: false
    verification:
      - kind: command
        ref: "5 files under .planning/todos/pending/2026-08-29-*, each 6/6 frontmatter keys; 8 anchors in the non-null-assertion todo; every anchor re-measured this session"
        status: pass
  - deliverable: "The negative-control ledger is complete: three rows, no pending cell, every cited log path resolves"
    human_judgment: false
    verification:
      - kind: command
        ref: "awk row-table slice | grep -c pending -> 0; all 11 absolute log paths tested with [ -f ] -> 11 OK"
        status: pass
  - deliverable: "Window 172 closed across all five byte-identical copies without breaking the guard that holds them identical"
    human_judgment: false
    verification:
      - kind: command
        ref: "cmp x3 identical after the reword; guard exit 0, 0 violations / 17 files; flip (per-file phrasing in one copy) -> check 2 exits 1 naming both paths"
        status: pass
  - deliverable: "The tree passes unit, lint, format and the cardinal E2E gate"
    human_judgment: false
    verification:
      - kind: command
        ref: "yarn test:unit 25/25 exit 0; yarn lint:check exit 0 (22/22, guard link 8 of 8); yarn format:check exit 0"
        status: pass
      - kind: command
        ref: "yarn test:e2e exit 0 — report payload total=150 expected=150 unexpected=0 flaky=0 skipped=0 ok=true, after db:reset and one fresh dev server whose preflight passed"
        status: pass
  - deliverable: "The bank-auth recipe still works after aud/iss became mandatory — the phase's owed opt-in run"
    human_judgment: false
    verification:
      - kind: command
        ref: "PLAYWRIGHT_BANK_AUTH=1 --project=bank-auth: total=8 expected=8 unexpected=0 flaky=0 skipped=0 ok=true, twice; served function log shows 12 real requests handled"
        status: pass
      - kind: command
        ref: "flip: same suite against the pre-155 4-line recipe -> 1 failed, 5 did not run, exit 1; restored -> 8 passed"
        status: pass
  - deliverable: "A local start reaches the candidate pre-registration page without a missing-variable error"
    human_judgment: false
    verification:
      - kind: command
        ref: "against the operator's ACTUAL .env (which sets none of SITE_URL/SMTP_*): /candidate/preregister -> HTTP 200, 0 missing-variable strings in the body; frontend reads none of the seven un-prefixed vars"
        status: pass
  - deliverable: "The deployed Deno function behaves as the Node tests show — 155-01's and 155-02's open human_judgment item"
    human_judgment: true
    rationale: "CLOSED for identity-callback by this plan's served run under supabase-edge-runtime 1.71.0 / jose@v5.9.6. STILL OPEN for invite-candidate and send-email: neither has a live caller anywhere in the product or the suite, so no run reaches them, and both plans' fixes still rest on Node-side vitest plus offline before/after reproductions. Windows 158 and 167."

metrics:
  duration: 41 min
  completed: 2026-08-29
  tasks: 3
  files: 12
  commits: 4

actuals:
  tokens: 20871
  tasks: 3
  commits: 4
---

# Phase 155 Plan 06: Sweep Disposition, Evidence Completion and the Owed Bank-Auth Run Summary

The phase's evidence and disposition obligations are closed: 273 port and loopback hits labelled
under a stated rule with an exhaustiveness tripwire and both halves of the scan flip-tested, five
follow-ups filed with re-measured anchors, the negative-control ledger completed and every cited log
path resolution-tested, and — the item this phase had deferred twice — **the opt-in
`PLAYWRIGHT_BANK_AUTH` suite actually run against a served Edge Function, green, and flip-tested
against the pre-155 recipe so the green means something.**

## Accomplishments

- **`155-PORT-LOCALHOST-SWEEP.md`** — the four-label rule stated **before** any table, the exact
  commands, six buckets, and the invariant that no hit may be unlabelled asserted with a tripwire
  rather than promised. **The Edge Functions bucket measures zero on both halves**, so both
  criterion-2 loopback sites are demonstrably gone.
- **Five todos** under `.planning/todos/pending/`, each with `created`/`title`/`area`/`severity`/
  `source`/`files` and file:line anchors measured this session, not transcribed.
- **The negative-control ledger completed** — rows 1 and 2 filled from the runs Plans 02 and 04 made
  themselves, plus a closing section that asserts the ledger about itself and says, one line per row,
  what each would have read had the fix failed.
- **Window 172 fixed** in one commit across all five byte-identical copies.
- **The owed bank-auth run executed** — full multi-terminal rig, 8/8, twice, with a red flip in
  between.
- **Gates green**: `test:unit` 25/25, `lint:check` exit 0 (22/22, guard link 8 of 8),
  `format:check` exit 0, `test:e2e` **150/150 with zero skipped**.

## Task / Commit Ledger

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | sweep + five filed todos | `99eebb4eb` | `155-PORT-LOCALHOST-SWEEP.md`, 5 todos |
| — | window 172, out-of-band | `17ef44ce4` | 2 × `jwtSegment.ts`, 3 × `envConfig.ts` |
| 2 | ledger rows 1 and 2 + completeness | `0433b66e3` | `155-NEGATIVE-CONTROL-LEDGER.md` |
| 3 | gates (verification only, no source change) | — | — |

## The scan lied twice before it told the truth

Phase 152's lesson was that a clean zero is worth nothing until you show the scan can go red. This
run produced **two silent zeros of its own**, both of which looked like clean results:

| Hazard | Wrong answer it gave | Right answer |
|---|---|---|
| `git grep -E` has no `\b` on this git (2.51.0, Apple git-154) | `ports = 0` **across the whole repository** | `-P`: 178 port hits, and `config.toml:10` is literally `port = 54321` |
| pathspec glob `packages/*/src` — `*` does not cross `/` | bucket A = **1 hit** | literal directories: bucket A = **51 hits** |

Neither produced an error or a warning. The first draft of this sweep shipped both. They are
documented with reproductions in § 5 of the sweep record and filed as window 175, because the next
repo-wide scan in this project will reach for `-E` and for a `*/src` glob by reflex.

A third, inherited from 155-05 and confirmed rather than assumed: **an unstaged file is invisible to
`git grep`** — measured going 5 → 6 files after `git add -N`. The tree was checked clean under all
four scan roots before the count was taken, so the count is not vacuous.

**Both halves of the pattern were then flipped in the bucket that reported zero**, and the fourth row
is the one that earns its place: a bare port literal with no loopback host is invisible to the
loopback half and caught only by the port half, so the two are independently load-bearing rather than
one being a superset of the other.

**What the sweep cannot see is stated rather than left implicit**: computed or split host spellings,
ports outside the nine enumerated literals, gitignored trees, percent-encoded hosts. For the Edge
Functions zero to be false, one of those would have to be true — and the sweep says so, in the
document, next to the zero.

## The owed run, executed — and then made to fail

`155-01` filed it, `155-03` re-filed it as window 163, and the phase had proven the repaired recipe
only *offline*. It is now run for real.

**Rig** (runbook Steps E-1 to E-4, verbatim): env file and JWKS regenerated from `testKeys.ts` so no
key is hand-copied; `python3 -m http.server 8777` serving the test JWKS, reachability confirmed **from
inside a Supabase container** via `host.docker.internal` rather than assumed; `npx supabase functions
serve identity-callback --no-verify-jwt --env-file /tmp/eflow10.env`; one dev server on `:5173`.

**Step 1 of the human-check, confirmed:** the generated file is **7 lines** and contains
`IDENTITY_PROVIDER_ISSUER`, `DEFAULT_PROJECT_ID` and `SITE_URL` alongside the four it always had.

**Result:** preflight OK, `8 passed (5.3s)`, report payload `total=8 expected=8 unexpected=0 flaky=0
skipped=0 ok=true`. The served function log shows **12 real
`serving the request with supabase/functions/identity-callback` entries**, so this is a genuine
served-Deno run of the deployed function under `supabase-edge-runtime 1.71.0` / `jose@v5.9.6` — not a
Node-side proxy for it. That closes 155-01's `human_judgment: true` deliverable for
`identity-callback`.

**Then it was made to fail, because 8/8 from a rig that is not actually exercising the change looks
identical to 8/8 from one that is:**

| Recipe served | Result |
|---|---|
| pre-155, 4 lines | **1 failed, 5 did not run, exit 1** |
| restored 7 lines | **8 passed** |
| restored 7 lines, again | **8 passed** |

### A correction the served run produced, which no offline proof could have

`155-01-SUMMARY.md` and the ledger footnote both record the old recipe as
**`REJECTED [ERR_ISSUER_UNCONFIGURED]`**. The rejection half is right. **The named variable is wrong
for the real request path**, and the plan's own human-check guidance inherits the error — it tells
the operator that *"a rejection naming the issuer claim means a recipe mismatch"*.

Observed in the served log:

```
[Error] identity-callback error: Error: Missing required environment variable: DEFAULT_PROJECT_ID.
    at requireEnv (…/identity-callback/envConfig.ts:23:25)
    at Object.handler (…/identity-callback/index.ts:165:37)
  code: "ERR_ENV_UNCONFIGURED", variable: "DEFAULT_PROJECT_ID"
```

155-01 drove only the token path (decrypt → verify), which reaches `requireVerifyClaimBinding`. A
**real request enters `Object.handler` first**, and the handler reads `DEFAULT_PROJECT_ID` at
`:165` before any token work. So the operator on the old recipe is told about `DEFAULT_PROJECT_ID`,
not the issuer. Not a product defect — both throws are correct and both name their variable — but the
phase's description of what the operator will see was wrong, and only a served run could show it.
**Window 174.**

**A second thing that observation established, never previously checked on a served run:** the
non-disclosure bar holds end to end. The variable name is in the container log and **not** in the
HTTP response body — the failing spec carried no variable name. Every prior confirmation of that bar
was a code read.

### The second half of the human-check, answered more strongly than it was asked

The check asks for a fresh `.env` copied from `.env.example` reaching the pre-registration page. The
project note forbids editing `.env`, so it was answered against the operator's **actual** `.env` —
which sets **none** of `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`:

```
/candidate/preregister -> HTTP 200      missing-variable strings in body: 0
/candidate/register    -> HTTP 200
```

and the frontend reads none of the seven un-prefixed variables (`git grep` over `apps/frontend/src`
excluding `PUBLIC_` returns nothing). So the page works even in the D-D2 failure state, which is a
stronger result than the check's `.env.example` copy would have given.

## The default suite, against the last recorded green

| | Last recorded green (phase 154 close) | This run |
|---|---|---|
| passed | 150 | **150** |
| failed / flaky / skipped / did-not-run | 0 / 0 / 0 / 0 | **0 / 0 / 0 / 0** |

**Delta: zero**, which is what RESEARCH predicted and what Plan 04 re-measured the basis for —
neither `send-email` nor `invite-candidate` has a live caller, and the suite's own `sendEmail` helper
calls the auth service directly rather than the Edge Function. Counts decoded from the report payload
(`playwrightReportBase64` → `report.json`), not the console tail; `total == expected` with
`skipped: 0` is what establishes zero did-not-run. Run began with `yarn db:reset` and one fresh dev
server (exactly one listener on `:5173`, verified) whose preflight printed `E2E PREFLIGHT OK`.

## Dispositions the phase close owed

| Item | Disposition |
|---|---|
| **Window 172** — self-referential byte-identity docstrings | **FIXED**, `17ef44ce4`, all five copies in one commit. Flip-tested: a per-file phrasing in one copy makes check 2 exit 1 naming both paths — the window's own claim, verified rather than repeated |
| **Window 161** — `identity-callback`'s dead `siteUrl` binding | **DECLINED**, explicitly. All three tasks declare no source change; the binding has zero runtime effect. **Anchor re-measured: `:318`, not the `:315` the window records** — moved by 155-01's and 155-03's own edits. The correct anchor now lives in the non-null-assertion todo, which notes it is best *removed* rather than converted, since converting a binding nobody reads preserves dead code with a better message. **Window 177** |
| **The `details:` leaks** — window 157 (`invite-candidate:125,146`), window 166 (`send-email:142`) | **DECLINED**, same reason, anchors re-measured. All three stay open with the non-disclosure owner; none is closed by the catch-arm repairs landed beside them |
| **`config.toml`** | **HANDED to Phase 156** by naming, not editing. `git status --porcelain` on the file prints nothing |

## Requirements — what the tool did, recorded rather than worked around

`requirements.ready-ids` reported **5/5 ready**, `blocked: []` — correct, since every declaring
sibling now has a SUMMARY. Nothing was force-marked.

`requirements.mark-complete` then applied **4 of 5**:

| ID | checkbox | traceability |
|---|---|---|
| REVIEW-EDGE-01 / 02 / 03 / 05 | applied | applied → `Complete` |
| **REVIEW-EDGE-04** | **not applied** | **not applied** |

`write_set_complete: false`. This is the known tooling condition, now observed on a real row:
REVIEW-EDGE-04's Status cell reads `Retired on evidence (Phase 142.1 rekeyed Signicat onto `sub`) —
doc-verification residue only`, and the matcher tests `/^(pending|gaps found)$/i` against the trimmed
**whole cell**, so an otherwise-correct row carrying a trailing annotation is rejected on both
surfaces. **`REQUIREMENTS.md` was not hand-edited.** The row is exactly as the tool left it, and the
substance is not in doubt — 155-03 discharged the requirement's doc-verification half with
`155-SIGNICAT-SUBJECT-CITATION.md` and commit `1ecb51c54`. It is an outstanding **operator decision**
whether the matcher should tolerate an annotated status or whether annotations belong in a separate
column.

## Deviations from Plan

**1. [Rule 2 — Missing critical functionality] Five todos filed where the plan specified four**
- **Found during:** Task 1, by re-running the sweep instead of transcribing RESEARCH's bucket A
- **Issue:** two silent env-defaults outside every shape RESEARCH searched —
  `apps/supabase/scripts/lint-schema.mjs:25` and `apps/supabase/benchmarks/k6/config.js:12`. Under the
  four-label rule the phase adopted, both are FILED, not NO ACTION.
- **Fix:** a fifth todo. Folding them into todo 2 was rejected because that todo is titled for
  `packages/dev-seed`, and two `apps/supabase` anchors buried inside it would not be found by the
  search a future reader runs.
- **Commit:** `99eebb4eb`. **Window 176.**

**2. [Beyond the plan's declared scope, deliberately] Window 172 fixed rather than deferred**
- The plan declares Task 1 as "documentation and filed follow-ups; no source change". This commit
  touches five source files. Taken because the change is comment-only, closes a defect the phase
  itself created, keeps the guard green, and — per window 172's own analysis — is fixable *only* as a
  single commit across every copy, so deferring it to a later phase preserves nothing.
- **Commit:** `17ef44ce4`.

**3. [Reported] `requirements.mark-complete` declined REVIEW-EDGE-04** — see above. Not worked
around.

**4. [Correction to an inherited claim] The old recipe's rejection names `DEFAULT_PROJECT_ID`, not
the issuer** — see above. **Window 174.**

**Total deviations:** 1 auto-fixed (Rule 2), 1 deliberate scope extension, 1 tool condition reported,
1 inherited claim corrected by measurement.
**Impact:** no scope loss. The scope extension closes a phase-created defect; the todo count change
follows from the rule the plan adopted.

## The phase's transferable findings, recorded here because this is the phase record

These are the results worth carrying past Phase 155. Each was measured by a plan of this phase.

1. **The catch-arm premise is a property of each FILE, not of the codebase.** Three functions were
   checked and the premise held in exactly one. `invite-candidate` and `send-email` both returned
   `err.message` with **no logging**, while their plans' threat rows (T-155-10, T-155-23) asserted the
   opposite and rated the disclosure `low` on that basis. Only `identity-callback` matched. Both were
   fixed. **Measure it every time; do not generalise from a sibling.**
2. **An empty-string option is not a disabled check — it is a check that passes everything.** jose
   pushes a presence check when an option is `!== undefined` but compares the value only under a
   truthiness test, so `''` and omission both buy no binding at all. Treat absent and empty alike.
3. **A wrong base64 decoder works most of the time**, which is why a negative control needs a fixture
   whose segment *genuinely* contains `-` or `_` (0 of 2205 realistic payloads do), and why the test
   must assert that premise before the control fires — otherwise it degrades silently into a
   tautology.
4. **Enumerate real values from the tree, not from the plan's examples.** The placeholder pattern had
   five real keys in `502-email-helpers.sql`, **two of them three segments deep, and no example
   anywhere was**. A pattern written against the examples alone would have stopped rendering the
   nomination keys with nothing in the phase to catch it.
5. **Choose on failure mode, not on diff size.** 155-05 rejected a three-line fix for an extraction
   because the cheap route's failure mode was *phase 152's guard silently ceasing to run, latently* —
   the examines-nothing-reports-green catastrophe — while the extraction's failure mode was an
   ordinary refactor bug with a detector already committed.
6. **And this plan's own addition: a scan's clean zero is a claim about the scan before it is a claim
   about the tree.** Two silent zeros here, neither of which produced an error.

## Verification

| Gate | Baseline | This plan |
|---|---|---|
| `yarn test:unit` | 25/25 tasks | **25/25, exit 0** — `@openvaa/supabase` 55/55 (6 files, 5 of them new this phase), `@openvaa/dev-seed` 584/50 including `edgeEnvDefaultsGate.test.ts` 4/4 |
| `yarn lint:check` | 22/22, guard link 8 of 8 | **exit 0**, 22/22, all four guards green |
| `yarn assert:edge-env-defaults` | 0 / 17 files | **0 violations / 17 files**, 3 of 3 checks |
| `yarn assert:comment-hygiene` | 0 / 1,577 | **0 / 1,577** |
| `yarn format:check` | clean | **exit 0** |
| `yarn test:e2e` | 150/150 (phase 154 close) | **150/150, 0 skipped, exit 0** (10.3m) |
| `PLAYWRIGHT_BANK_AUTH=1 --project=bank-auth` | never run | **8/8, 0 skipped, exit 0**, twice, flip-tested red in between |

`yarn db:lint:sql` was not run: it is **pre-existing red by construction** (its failing half lints the
live database on three named PL/pgSQL warnings, window 17), and this plan touches no SQL.

Plan-level `<verification>`, item by item: gates green with counts ✅ · **five** new todos with
frontmatter and anchors ✅ (four specified, see deviation 1) · sweep record present with every hit
labelled ✅ · ledger complete, no unfilled row, all 11 log paths resolving ✅ ·
`git status --porcelain apps/supabase/supabase/config.toml` empty ✅.

## Known Stubs

None. No placeholder values, no skipped tests, no `TODO`/`FIXME` introduced, no unrun `<verify>`.
Every `<verify>` in this plan was executed, including the one the plan marked `human-check`.

## Broken-windows ledger

| ID | Kind | Subject |
|---|---|---|
| 172 | `todo` | **marked FIXED** — the self-referential docstrings, reworded across all five copies |
| 173 | `unrun-verify` | the owed bank-auth run WAS performed and is green; supersedes window 150's "disk headroom this session lacks" premise; names precisely what remains (the `bank-auth-journey` project, and served runs of `invite-candidate` / `send-email`) |
| 174 | `deviation` | the old recipe's rejection names `DEFAULT_PROJECT_ID`, not the issuer — 155-01's claim corrected by a served run; plus the non-disclosure bar confirmed on the wire for the first time |
| 175 | `deviation` | two silent-zero scan hazards (`git grep -E` has no `\b`; `packages/*/src` matches nothing), both of which the first draft shipped |
| 176 | `deviation` | five todos where the plan said four, and every RESEARCH bucket-A line number stale by 6 to 32 lines |
| 177 | `todo` | window 161 and the three `details:` leaks explicitly declined, with re-measured anchors (`:318` not `:315`) |

Windows 150, 158, 163 and 167 **stay open**: 150 because `bank-auth-journey` (EFLOW-10b) was not run,
158 and 167 because no run has ever exercised the *deployed* `invite-candidate` or `send-email` — and
none can, since neither has a live caller.

## Threat Flags

None. This plan adds no network endpoint, auth path, file access pattern or schema change; its only
source change is comment text. `T-155-31` through `T-155-35` are mitigated as specified —
`T-155-34` and `T-155-35` by execution rather than by argument, which is the point of them.
`T-155-SC` holds: nothing installed, `yarn.lock` untouched.

**Scratch-file hygiene, recorded because it is a real handling rule:** `/tmp/eflow10.env` carries the
committed *test* private decryption JWK and must never reach the root `.env` or `functions/.env`
(threats T-122-01 / T-122-04). It was written to `/tmp` per the runbook and **deleted** after the run,
along with `/tmp/eflow10-jwks`; both regenerate from Step E-1. The three servers this plan started
(dev server, static JWKS server, `functions serve`) were shut down and both ports confirmed free, so
no stale listener is left to steal `:5173` from the next run.

## Next

**Phase 155 is complete.** Six plans, `REVIEW-EDGE-01/02/03/05` marked `Complete`, `REVIEW-EDGE-04`
substantively discharged but blocked from the checkbox by the annotated-status matcher (operator
decision, above).

Two things the next phase inherits. **Phase 156** owns the 15 `config.toml` port and host literals
under `REVIEW-DB-08`, handed over by name in a filed todo that also flags the new coupling between
`SITE_URL` and `config.toml`'s `site_url` — a deployment where those two disagree sends the auth
redirect and the invite link to different origins, and nothing would notice. **Phase 161** owns
`DEFAULT_SEED_PROJECT_ID`, now declared and referenced nowhere, which no lint or type check in this
repository reaches.

## Self-Check: PASSED

- All 6 created files exist on disk (`[ -f ]`)
- All 4 commit hashes resolve in `git log`
- Every task's acceptance criteria re-run: Task 1 eight of eight pass, Task 2 five of five pass,
  Task 3 six of six pass
- All plan-level `<verification>` commands re-run and pass
- `git diff --diff-filter=D` across this plan's commits confirms **no** files were deleted
