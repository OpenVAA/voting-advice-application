---
phase: 156-supabase-schema-corrections-naming-constraints-grants
plan: 09
subsystem: database
tags: [supabase, documentation, benchmarks, config, ports, archival]

requires:
  - phase: 156-08
    provides: A clean tree at the head of the strict linear chain, with lint:check twelve-link green
provides:
  - The JSONB-vs-relational answer-storage conclusion distilled into apps/supabase/README.md with p95 numbers read from the suite's own result files
  - A demonstrated (not asserted) archival reference for the removed apps/supabase/benchmarks/ tree, quoted in two documents
  - All TEN hard-coded local ports documented with what each serves and the simultaneous-checkouts consequence
  - A verified answer to whether the pinned Supabase CLI supports env() interpolation on port fields — it DOES
affects: [156-10, 157, 161, 162, 163]

actuals:
  tokens: 2356
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Archival-by-removal: the removal is its own commit whose message names it as the archive point, the PRE-removal SHA is quoted in full alongside a copy-pasteable git show, and the recovery command is EXECUTED after the deletion before the plan closes"

key-files:
  created: []
  modified:
    - apps/supabase/README.md
    - apps/supabase/supabase/config.toml
    - .planning/phases/156-supabase-schema-corrections-naming-constraints-grants/156-DISPOSITIONS.md
  deleted:
    - apps/supabase/benchmarks/ (62 files, 288 KB, 2323 lines)

key-decisions:
  - "The archival SHA quoted for recovery is the PRE-removal commit 714d1e1885b091af95b86d2b497b3e2bff76f031 (where the tree still exists), not the removal commit with a trailing caret — both are given, but the one a reader git-shows needs no caret to be correct"
  - "config.toml pins TEN ports, not the nine every planning document in this phase claims; all ten are documented and the discrepancy is recorded rather than the work being trimmed to fit the criterion"
  - "The port caveat states that env() interpolation IS available and deliberately unused, because that was measured against the pinned CLI rather than inferred from the docs (which are silent on the question)"
  - "The two style-precedent comments in tests/scripts/ that cite the removed run-benchmarks.sh were left untouched — they are outside this plan's declared file set — and recorded instead"

patterns-established:
  - "Prove-the-archive: an archival reference is not complete until the recovery command has been run against the deleted content and its output observed"
  - "Check-the-CLI-not-the-docs: a claim about a tool's capability is established by a three-way control against the pinned binary (garbage rejected / set var accepted / unset var rejected identically), which distinguishes 'expanded' from 'coincidentally parseable'"

# Copied verbatim from this plan's `requirements` frontmatter. NOTE: REVIEW-DB-08 is NOT marked
# Complete in REQUIREMENTS.md and must not be until 156-10 closes — plan 10 also declares it and
# owns three of the requirement's five record items. See "Deviations" item 5.
requirements-completed: [REVIEW-DB-08]

coverage:
  - id: D1
    description: "The benchmark suite's conclusion survives in apps/supabase/README.md — which answer-storage design was chosen, on what numeric evidence, and where it lives in the schema"
    requirement: "REVIEW-DB-08"
    verification:
      - kind: other
        ref: "grep -c '^## ' apps/supabase/README.md == 7 (was 6); grep -cE '[0-9]+(\\.[0-9]+)?\\s*(ms|tps|req|s)\\b' == 7 (>= 2); grep -c '105-answers.sql' == 2"
        status: pass
      - kind: other
        ref: "grep -niE 'phase [0-9]+|\\.planning/|D-E[0-9]' apps/supabase/README.md == 0 (D-N1 citation ban)"
        status: pass
    human_judgment: true
    rationale: "Whether the distilled conclusion is USABLE to a reader who never saw the removed tree is a judgement no grep makes. The plan's own verification block reserves this as the end-of-phase human check."
  - id: D2
    description: "The removed benchmark tree is provably recoverable — archival SHA quoted in two documents, recovery command executed and observed to work"
    requirement: "REVIEW-DB-08"
    verification:
      - kind: other
        ref: "git show 714d1e1885b091af95b86d2b497b3e2bff76f031:apps/supabase/benchmarks/README.md | head -1 -> '# Benchmark Suite: JSONB vs Relational Answer Storage' (run AFTER deletion)"
        status: pass
      - kind: other
        ref: "git show 714d1e1885b091af95b86d2b497b3e2bff76f031:apps/supabase/benchmarks/results/jsonb-10000-voter-bulk-read.json -> full non-empty JSON body (run AFTER deletion)"
        status: pass
      - kind: other
        ref: "git log --diff-filter=D --oneline -- apps/supabase/benchmarks -> 0c1b876f6, message names the tree as archived"
        status: pass
      - kind: other
        ref: "git cat-file -t 714d1e1885b091af95b86d2b497b3e2bff76f031 -> commit; grep -c 'git show' apps/supabase/README.md == 1; SHA present in 156-DISPOSITIONS.md (3 occurrences)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Nothing in the build, tests or CI referenced the removed tree"
    verification:
      - kind: integration
        ref: "yarn lint:check (twelve-link chain) exit 0"
        status: pass
      - kind: unit
        ref: "yarn test:unit -> 25/25 tasks, 603 tests passed, exit 0"
        status: pass
      - kind: other
        ref: "yarn format:check exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "All hard-coded local ports documented with what they serve and the simultaneous-checkouts caveat; no port value moved; config.toml carries a pointer"
    requirement: "REVIEW-DB-08"
    verification:
      - kind: other
        ref: "every one of the 10 port literals extracted from config.toml appears in apps/supabase/README.md (per-value check, 10/10 PRESENT)"
        status: pass
      - kind: other
        ref: "git diff apps/supabase/supabase/config.toml | grep -cE '^[-+]\\s*(port|shadow_port|smtp_port|pop3_port|inspector_port)\\s*=' == 0 — no port value changed"
        status: pass
      - kind: other
        ref: "yarn db:status exit 0 — config.toml still parses and the stack resolves"
        status: pass
      - kind: other
        ref: "grep -c 'README' config.toml == 1; grep -niE 'phase [0-9]+|\\.planning/|D-E[0-9]' config.toml == 0; grep -ciE 'simultaneous|at the same time|two checkouts' README.md == 2"
        status: pass
    human_judgment: false
  - id: D5
    description: "The env()-interpolation claim in the port caveat was checked against the pinned CLI before being written"
    verification:
      - kind: other
        ref: "three-way control against supabase CLI v2.83.0: port=\"notaport\" REJECTED (uint16 parse error) / port=\"env(TEST_API_PORT)\" with var set ACCEPTED / port=\"env(NOPE_UNSET)\" with var unset REJECTED with the identical uint16 error"
        status: pass
      - kind: other
        ref: "value-is-used proof: db.port=\"env(TEST_DB_PORT)\" with 55999 -> 'dial tcp 127.0.0.1:55999: connect: connection refused'; with 54322 -> real connection, lint output"
        status: pass
    human_judgment: false

duration: 25 min
completed: 2026-08-30
status: complete
---

# Phase 156 Plan 09: Criterion-8 Record Items — Benchmark Archival and the Port Caveat Summary

**The answer-storage benchmark suite's conclusion now lives in the Supabase README with p95 figures read from its own result files, its 62-file apparatus is removed behind a demonstrated archival SHA, and all TEN hard-coded local ports (not the nine every planning document claims) are documented with a caveat whose CLI capability claim was measured rather than assumed.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-30T09:41:00Z (approx; first task commit 12:41:07+03:00)
- **Completed:** 2026-08-30T09:52:00Z (last task commit 12:46:02+03:00, plus verification)
- **Tasks:** 3
- **Files modified:** 3 modified, 62 deleted

## Accomplishments

- **The benchmark RESULT outlived its apparatus.** A new `## Why answers are a JSONB column` section states what was compared, what the numbers were, and which design won — with p95 latencies read out of the 36 result JSON files rather than paraphrased from the runbook (which carries no conclusion at all; it is a pure runbook).
- **The archive is demonstrated, not asserted.** The recovery command was executed *after* the deletion against two removed files and observed to return their original content.
- **The port list was corrected upward.** Every planning document in this phase says nine ports; `config.toml` pins ten. All ten are documented.
- **The CLI capability claim is measured.** A three-way control against the pinned binary established that `env()` interpolation *does* work on port fields — so the caveat says the option exists and is deliberately unused, rather than sending a future reader down a "the CLI can't do this" dead end.

## Task Commits

1. **Task 1: Distil the benchmark conclusion into the Supabase README** — `714d1e188` (docs)
2. **Task 2a: Remove the benchmark apparatus (THE ARCHIVE POINT)** — `0c1b876f6` (chore)
3. **Task 2b: Quote the archival SHAs in README and DISPOSITIONS** — `4da70f522` (docs)
4. **Task 3: Document all ten local ports and the checked caveat** — `a834878d4` (docs)

## The archival record

### Pre-removal file list and size (the SUMMARY as a second index)

**62 files, 288 KB, 2323 lines**, in six subtrees:

| Subtree | Files | Size | Contents |
|---|---:|---:|---|
| `README.md` | 1 | 8 KB | the 144-line runbook |
| `data/` | 3 | 28 KB | `generate-shared-data.sql`, `generate-candidates-jsonb.sql`, `generate-candidates-relational.sql` |
| `pgbench/` | 12 | 48 KB | `voter-bulk-read-{jsonb,relational,relational-cte,relational-lateral,relational-rpc,relational-two-query}.sql`, `candidate-write-{jsonb,relational}.sql`, `candidate-full-save-{jsonb,relational}.sql`, `aggregation-{jsonb,relational}.sql` |
| `k6/` | 2 | 8 KB | `config.js`, `voter-bulk-read.js` |
| `scripts/` | 7 | 48 KB | `run-benchmarks.sh`, `run-concurrency-scaling.sh`, `run-optimization-benchmarks.sh`, `swap-schema.sh`, `parse-pgbench-log.py`, `install-smart-jsonb-trigger.sql`, `restore-original-jsonb-trigger.sql` |
| `results/` | 37 | 148 KB | **36** parsed result JSON (`{jsonb,relational}-{1000,5000,10000}-{aggregation,candidate-full-save,candidate-write,candidate-write-c50,voter-bulk-read,voter-bulk-read-c50}.json`) plus `.gitignore` |

**Correction to the plan:** the plan states "38 result JSON files" in three places. Measured: **36** JSON files, or 37 files in `results/` counting the `.gitignore`. Neither reading gives 38.

### The two SHAs, and which is which

| SHA | What it is |
|---|---|
| `714d1e1885b091af95b86d2b497b3e2bff76f031` | **The tree still EXISTS here.** This is the SHA to `git show` — no caret needed. Quoted in full in both documents. |
| `0c1b876f6721d18457dccdff44941284b7c51e5e` | **The removal commit** — the findable archive point. Its message names the tree as archived and repeats the recovery commands. Recovery from *this* SHA requires the caret: `git show 0c1b876f6...^:<path>`. |

The plan asked for `git show <sha>^:<path>`. The `deletion_discipline` in the execution brief asked that "the SHA you quote must be the commit where the tree still EXISTS". Both are satisfied by quoting both SHAs with their roles labelled; the caret-free form is given first because a caret is exactly the kind of character that gets lost in a copy-paste.

### Recovery commands EXECUTED after the deletion, with observed output

```
$ git show 714d1e1885b091af95b86d2b497b3e2bff76f031:apps/supabase/benchmarks/README.md | head -1
# Benchmark Suite: JSONB vs Relational Answer Storage

$ git show 0c1b876f6721d18457dccdff44941284b7c51e5e^:apps/supabase/benchmarks/README.md | head -1
# Benchmark Suite: JSONB vs Relational Answer Storage

$ git show 714d1e1885b091af95b86d2b497b3e2bff76f031:apps/supabase/benchmarks/results/jsonb-10000-voter-bulk-read.json
{
  "transactions": 1256,
  "p50_ms": 25.06,
  "p95_ms": 28.3,
  "p99_ms": 32.08,
  "avg_ms": 23.87,
  "min_ms": 13.04,
  "max_ms": 50.04
}

$ git log --diff-filter=D --oneline -- apps/supabase/benchmarks
0c1b876f6 chore(156-09): archive the answer-storage benchmark suite by removing it

$ git ls-tree -r --name-only 714d1e1885b091af95b86d2b497b3e2bff76f031 -- apps/supabase/benchmarks | wc -l
62
```

Both `git show` forms return the original content. The whole-tree restore path (`git checkout <sha> -- apps/supabase/benchmarks`) is listed in the README and backed by the 62-file listing above; it was not executed, because doing so would have re-created the tree this plan removes.

### The conclusion that was distilled, and where the numbers came from

The runbook contains **no conclusion** — it is a runbook (prerequisites, options, directory map, how-it-works, thresholds). The conclusion therefore had to be derived from the 36 result files, which is what the plan asked for. p95, single connection:

| Pattern | 1K JSONB | 1K rel. | 5K JSONB | 5K rel. | 10K JSONB | 10K rel. |
|---|---:|---:|---:|---:|---:|---:|
| Voter bulk-read | 2.88 ms | 8.26 ms | 11.66 ms | 35.57 ms | 28.30 ms | 120.08 ms |
| Candidate full-save | 1.64 ms | 2.52 ms | 1.55 ms | 2.87 ms | 1.61 ms | 2.76 ms |
| Candidate single-write | 1.39 ms | 0.56 ms | 1.38 ms | 0.70 ms | 1.37 ms | 3.90 ms |
| Aggregation | 14.06 ms | 7.51 ms | 36.30 ms | 22.32 ms | 48.67 ms | 39.03 ms |

JSONB wins the read path by 2.9× at 1K and 4.2× at 10K, and the full-form save by ~1.7× at every scale. Relational wins single-answer writes and aggregation, but its single-write advantage **inverts** at 10K. Two limits are stated in the README rather than buried: at 50 concurrent connections the bulk-read gap closes entirely, and at 10K **neither** design meets the suite's own 1000 ms p95 target for that pattern (JSONB 1538.71 ms, relational 1549.43 ms) — so at that scale the binding constraint is concurrency, not storage shape. The suite's stated tie-break also favoured relational (it won anything inside 20%), which makes the JSONB margins the more meaningful for having survived it.

## The environment-interpolation finding (T-156-39)

**Question:** does the pinned Supabase CLI support `env()` interpolation for port fields in `config.toml`?

**Pinned version checked: `supabase` v2.83.0** (`apps/supabase/package.json` declares `"supabase": "catalog:"`; the catalog range is `^2.78.1` and `yarn.lock` resolves it to `2.83.0`; `node_modules/.bin/supabase --version` confirms `2.83.0`).

**References consulted, in order:**

1. **The reference the config file's own opening comment links to** — `https://supabase.com/docs/guides/local-development/cli/config`, fetched this session. **It is SILENT on the question.** Every `env(...)` mention on that page is the *default value* of a string-typed secret field (`auth.sms.twilio.auth_token`, `studio.openai_api_key`, `experimental.s3_*`, the OAuth provider secrets). Every port field's entry (`api.port`, `db.port`, `db.pooler.port`, `studio.port`, `inbucket.port`, `analytics.port`, …) shows a bare integer default and says nothing about substitution. That is an **absence of documentation, not a documented prohibition** — so the docs alone could not settle it, and writing the caveat from them would have been the assumption this task exists to prevent.
2. **The pinned binary itself**, which is what actually enforces the behaviour. Tested in a scratch project directory, never against the repository's own config.

**The three-way control (this is what makes it a proof rather than a coincidence):**

| `[api] port = …` | Environment | Result |
|---|---|---|
| `"notaport"` | — | **REJECTED**: `failed to parse config: 'api.port' cannot parse value as 'uint16': strconv.ParseUint: invalid syntax` |
| `"env(TEST_API_PORT)"` | `TEST_API_PORT=54399` | **ACCEPTED** — parsing succeeds; execution proceeds past config decode to the Docker health check |
| `"env(NOPE_UNSET)"` | variable unset | **REJECTED** with the *identical* uint16 parse error |
| `"54399"` | — | ACCEPTED (a quoted decimal is coerced) |
| `54399` | — | ACCEPTED (the bare literal, as today) |

Row 1 proves the decoder is strict, so acceptance in row 2 is meaningful. Row 3 proves the expansion **actually happened**: `env(NOPE_UNSET)` resolved to the empty string and *then* failed uint16 parsing. Had `env()` not been expanded on this field, the literal string in row 2 would have failed exactly as row 1 did — it did not.

**And the resolved value is USED, not merely parsed:**

```
$ TEST_DB_PORT=55999 supabase db lint --local
Connecting to local database...
failed to connect to postgres: ... dial error (dial tcp 127.0.0.1:55999: connect: connection refused)

$ TEST_DB_PORT=54322 supabase db lint --local
Connecting to local database...
Linting schema: extensions / private / public
[ { ... }
```

**Finding: the CLI DOES support environment interpolation for port fields; these fields are literals by choice, not by limitation.** The caveat in the README is worded accordingly — it tells a future reader the option exists and that non-use is a wiring gap, not a dead end. Had the other fact been true, the correct follow-on work would have been an upstream request; as it stands it is a local change anyone can make.

## Files Created/Modified

- `apps/supabase/README.md` — new `## Why answers are a JSONB column` section (conclusion, numbers, chosen design, archival SHAs and recovery commands); the four-port sentence inside `## Commands` replaced by a new `## Local ports` section covering all ten with the caveat.
- `apps/supabase/supabase/config.toml` — a two-line pointer comment after the existing docs link, noting the ports below are literals and naming `../README.md`. No port value touched.
- `.planning/phases/.../156-DISPOSITIONS.md` — both archival SHAs, the executed recovery commands and the removed-tree scope recorded under the benchmark entry, so plan 10 writes entry 1 from a record rather than reconstructing it.
- `apps/supabase/benchmarks/` — **deleted** (62 files).

## Decisions Made

1. **Quote the pre-removal SHA as the primary recovery handle.** The plan specified `git show <removal-sha>^:<path>`; the execution brief required the quoted SHA be one where the tree exists. Both forms are given, both were executed, and the caret-free form leads — a dropped caret silently returns the *post*-removal tree state and would make recovery appear to fail.
2. **Document ten ports, not nine.** See "Deviations".
3. **Give the ports their own `## Local ports` heading** rather than growing `## Commands`. Task 1's acceptance criterion pinned the heading count at exactly +1 for that task; task 3 carries no heading-count criterion, and a ten-row table plus four paragraphs inside a command listing would have buried both.
4. **Leave the two out-of-scope dangling references alone.** See "Deviations".

## Deviations from Plan

### Measurement corrections (the plan's numbers were wrong; the work was not trimmed to fit)

**1. [Rule 1 — Wrong figure in the plan] `config.toml` pins TEN ports, not nine**
- **Found during:** Task 3 (and visible from Task 3's `read_first`, which instructed locating every port literal directly rather than trusting a list — which is what surfaced it).
- **Issue:** The plan's `must_haves`, its objective, its Task 3 `read_first` and its acceptance criterion (`… | wc -l` returns `9`) all say nine. `156-CONTEXT.md` § D-E5 item 3 lists nine specific lines. The measured count is **10**. The omitted one is `[analytics] port = 54327` (line 383). The CONTEXT list is also line-stale: it cites the inspector port at `:375`; it is at `:374`.
- **Resolution:** All ten documented. **The acceptance criterion `wc -l == 9` is FALSIFIED and always was** — the file contained ten before this plan touched it, and no port value was changed. Every one of the ten values was independently checked to appear in the README (10/10 present).
- **Files modified:** `apps/supabase/README.md`
- **Committed in:** `a834878d4`

**2. [Rule 1 — Wrong figure in the plan] The result-file count is 36, not 38**
- **Found during:** Task 2.
- **Issue:** The plan says "38 result JSON files" (objective, Task 2 action, artifacts section). Measured: 36 `.json` files; `results/` holds 37 entries counting `.gitignore`.
- **Resolution:** The true counts are recorded above and in the archival commit message. No behavioural impact.

**3. [Rule 1 — Stale claim in the removed file] The runbook says `results/` is gitignored; the JSON is tracked**
- **Found during:** Task 1.
- **Issue:** `benchmarks/README.md:77` annotates `results/` as "(gitignored)". In fact `results/.gitignore` ignores everything *except* `*.json`, and all 36 JSON files were tracked (`git ls-files` returned all 62 tree files). Had the runbook's claim been true, the result files would not have been recoverable from history at all and the whole archival design would have silently lost the evidence base.
- **Resolution:** No fix needed — the tracked-ness is what makes the archive work. Recorded because the discrepancy was load-bearing for this plan's central risk, and because the conclusion in the README depends on those files being readable at the archival SHA (verified, above).

### Out-of-scope findings recorded rather than fixed

**4. [Scope boundary] Two style-precedent comments now cite a removed path**
- **Found during:** Task 2, pre-removal reference sweep.
- **What:** `tests/scripts/e2e-run.sh:29` and `tests/scripts/determinism-batch.sh:35` each contain a comment reading "Style follows `apps/supabase/benchmarks/scripts/run-benchmarks.sh` (shebang form, header block, `set -euo pipefail`, …)". Both paths are now dangling.
- **Why not fixed:** `tests/scripts/` is outside this plan's declared `files_modified`. The `deletion_discipline` in the execution brief is explicit that nothing outside the declared tree may be removed or edited, and that such findings are recorded instead.
- **Severity:** Low. Both are comments; neither is executed; the cited file is recoverable at the archival SHA, which `apps/supabase/README.md` publishes. A reader who greps the path and finds nothing has one hop to the SHA.
- **Filed** to the cross-phase defect register.

**5. [Rule 1 — Corrected mid-flight] REVIEW-DB-08 was marked Complete and then reverted**
- **Found during:** close-out.
- **Issue:** `requirements.ready-ids` reported **0/1 ready** — plan **156-10** also declares `REVIEW-DB-08` and has no SUMMARY yet. `requirements.mark-complete` was nonetheless run and flipped both the checkbox (`REQUIREMENTS.md:128`) and the traceability row (`:288`) to Complete. That is precisely the false completion the shared-ID gate exists to prevent: the requirement's own text covers **five** record items, and this plan implemented **two** of them — `lint-schema.mjs`, the id-JSONB linkage question and the feedback-IP question are all plan 10's.
- **Fix:** Both lines reverted to `- [ ]` / `Pending`. **`git diff .planning/REQUIREMENTS.md` is now empty** — the file is byte-identical to HEAD, so nothing was left half-changed.
- **Correct behaviour:** REVIEW-DB-08 becomes ready the next time a declaring plan closes, i.e. when **156-10** produces its SUMMARY. It must not be marked before then.

**5b. [Record correction] `156-CONTEXT.md` § O-2 is now FALSE**
- O-2 states that "`.planning/REQUIREMENTS.md` contains **no `REVIEW-*` and no `PRESHIP-*` identifier at all** (grep returns nothing)" and flags the ids as dangling. Measured this session: **`REVIEW-DB-08` is present twice** — as a requirement at `REQUIREMENTS.md:128` and as a traceability row at `:288`. The ids were added at some point after CONTEXT was written. The verifier should not carry O-2's premise forward.

**6. [Scope boundary] No other reference exists
- A repository-wide sweep across `*.json`, `*.ts`, `*.js`, `*.mjs`, `*.cjs`, `*.yml`, `*.yaml`, `*.md`, `*.sh`, `*.toml` (excluding `node_modules/`, `.turbo/`, `.planning/` and the tree itself) found **only** those two. No `package.json` script, no `turbo.json` pipeline entry, no CI workflow and no test referenced the benchmark tree. Confirmed empirically by `yarn lint:check`, `yarn test:unit` and `yarn format:check` all passing with the tree absent.

---

**Total deviations:** 3 measurement corrections recorded (0 required a code fix), 1 mid-flight error made and fully reverted (REVIEW-DB-08), 1 stale CONTEXT claim corrected, 2 out-of-scope findings recorded and not fixed.
**Impact on plan:** No scope creep. One acceptance criterion (`wc -l == 9`) is reported FALSIFIED rather than satisfied; the underlying intent — document every hard-coded port — is over-satisfied at ten. Everything else passed as written.

## Verification

| Check | Result |
|---|---|
| `yarn lint:check` (twelve-link chain) | **exit 0** — comment-hygiene 1584 files / 0 violations; schema-migration parity matches its fixture |
| `yarn test:unit` | **exit 0** — 25/25 turbo tasks; dev-seed 53 files / 603 tests passed |
| `yarn format:check` | **exit 0** |
| `yarn db:status` | **exit 0** — `config.toml` still parses, stack resolves |
| pgTAP (`npx supabase test db`, run **from `apps/supabase`**) | **exit 0** · `Files=11, Tests=317` · `Result: PASS` · **`not ok` = 0** · "All tests successful." |

**pgTAP conjunction asserted, per WINDOWS 186** (`Tests=` reads identically on pass and fail, so the count alone proves nothing): `Result: PASS` **and** `Files=` non-zero (11) **and** `Tests=` at the 317 floor **and** `not ok` count = 0 **and** exit 0. Unchanged from the plan-08 baseline, which is the expected outcome for a documentation-only plan — the suite was re-run to confirm the *absence* of movement, not to claim progress.

`yarn db:lint:sql` was **not** run: this plan changed no SQL. Its pre-existing exit-1 baseline (four PL/pgSQL advisories, WINDOWS 17 / 115 / 125) is therefore neither confirmed nor disturbed here.

## Known Stubs

None. No placeholder survives: the `ARCHIVAL_SHA_PLACEHOLDER` marker introduced by task 1 was consumed by task 2 (`grep -c 'ARCHIVAL_SHA_PLACEHOLDER' apps/supabase/README.md` now returns 0) and replaced by two full SHAs and three executable commands.

## Threat Flags

None. This plan added no network endpoint, no auth path, no file-access pattern and no schema change. Its removals were inert data and scripts that nothing executes; its edits were prose and one comment.

Threat register dispositions discharged: **T-156-36** (repudiation of the removal) — removal is its own commit, message names it as the archive point, SHAs quoted in two documents, recovery **executed** against two files. **T-156-37** (conclusion lost with apparatus) — conclusion distilled with numbers read from the result files and committed *before* anything was removed. **T-156-38** (accidental port change) — zero-diff assertion on every port assignment line, plus `yarn db:status`. **T-156-39** (unchecked CLI claim) — three-way control against the pinned binary, recorded above with the reference consulted.

## Issues Encountered

**The reference that should have settled the CLI question could not.** The plan directed consulting the pinned CLI's own configuration reference, on the reasonable assumption it would state the answer. It does not address port fields at all. Rather than infer from silence — the exact failure mode the plan's prohibition names — the question was settled empirically against the pinned binary with a control design that distinguishes "expanded" from "coincidentally parseable". Both the docs outcome and the empirical outcome are recorded above so a future reader can see why the second was needed.

## User Setup Required

None.

## Next Phase Readiness

- **Ready for 156-10**, the last plan of the phase. Plan 10 writes `156-DISPOSITIONS.md` entries 1–5; **entry 1's archival SHAs, executed recovery commands and removed-tree scope are already recorded** in that document under the header block, so plan 10 transcribes a record rather than reconstructing one. Entry 3 (the ports item) should carry the corrected count of **ten** and the checked env-interpolation finding, both stated above.
- **Two of criterion 8's five record items are now closed by doing the work**, which is what D-E5 selected. The remaining three are plan 10's answer-plus-todo.
- **Carry forward for plan 10 and for the phase verifier:** the nine-ports figure is wrong wherever it appears in this phase's planning documents (`156-CONTEXT.md` § D-E5 item 3, `156-09-PLAN.md` throughout). The file says ten.
- **REVIEW-DB-08 is deliberately still `Pending`.** Plan 10 shares the id and owns three of its five items; marking it at 156-10's close is the correct point. `156-CONTEXT.md` § O-2's claim that no `REVIEW-*` id exists in REQUIREMENTS.md is stale — the id is there, at `:128` and `:288`.
- No blockers.

## Self-Check: PASSED

- All four modified/created paths exist on disk; `apps/supabase/benchmarks` confirmed absent.
- All five commits found in `git log --oneline --all`: `714d1e188`, `0c1b876f6`, `4da70f522`, `a834878d4`, `559f31573`.
- `ARCHIVAL_SHA_PLACEHOLDER` occurrences in `apps/supabase/README.md`: **0** — the marker was consumed, not orphaned.
- All task `<acceptance_criteria>` re-run and passing, with the single exception reported FALSIFIED above (`wc -l == 9`, measured 10).
- Plan-level `<verification>` re-run: lint:check / test:unit / format:check / db:status all exit 0; pgTAP `Files=11, Tests=317, Result: PASS`, `not ok` = 0.
- `.planning/REQUIREMENTS.md` diff against HEAD is empty after the revert described in deviation 5.

---
_Phase: 156-supabase-schema-corrections-naming-constraints-grants_
_Completed: 2026-08-30_
