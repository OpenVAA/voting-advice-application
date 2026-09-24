---
phase: 157-adapter-boundary-typing
plan: 08
subsystem: tooling
tags: [guard, lint, assert-script, negative-control, adapter, casts, ledger]

requires:
  - phase: 157-adapter-boundary-typing
    plan: 07
    provides: "the zero baseline this guard asserts — 15 triple casts to 0 — and the classified inventory of the 34 surviving casts the guard must NOT fire on"
  - phase: 157-adapter-boundary-typing
    plan: 14
    provides: "157-NEGATIVE-CONTROL-LEDGER.md, its row schema and the rows-first protocol this plan appends under"
provides:
  - "scripts/assert-adapter-casts.mjs — a standing, chained, self-asserting guard against the reintroduction of adapter boundary casts"
  - "the `assert:adapter-casts` root package.json script and its `lint:check` chain link"
  - "five measured negative-control rows (CAST-OLD, CAST-NEW, CAST-RESTORE, CAST-ALLOWED, CAST-VACUITY) proving the guard blind before, catching after, discriminating, and non-vacuous path by path"
  - "an independently re-measured cast baseline at HEAD caa7b6c14: 39 lines / 39 tokens / 0 triple casts, disagreeing with the recorded Fact 19 figure by 25 lines and 48 tokens"
affects: [164-nullability-audit]

actuals:
  tokens: 9785
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "A guard reports the SIZE of what it read (files, lines), so a zero can be told apart from a zero over an empty corpus."
    - "A corpus precondition (check 0) runs before every content check: named anchor files must be present, or the guard fails closed rather than reporting a vacuous zero."
    - "Chain wiring is asserted as MEMBERSHIP of the `&&` token set, never as an index or terminal position."
    - "Each pattern in a multi-pattern guard is fired in isolation against a synthetic corpus, using a copy that differs from the shipped file on exactly one line."

key-files:
  created:
    - scripts/assert-adapter-casts.mjs
  modified:
    - package.json
    - .planning/phases/157-adapter-boundary-typing/157-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "Added check 0 (corpus precondition) beyond the plan's three checks. The phase has twice shipped a criterion whose pattern matched nothing and reported a pass; a guard is the one artifact where that failure is fatal, so the guard proves its corpus before any zero it produces is allowed to mean anything."
  - "Added a fifth ledger row (CAST-VACUITY) beyond the plan's four. CAST-NEW's single injection exercises 2 of the guard's 8 failure paths; the other 6 would have shipped unfired."
  - "Check 2's zero for `as Partial<DynamicSettings>` is a RESPELLING, not a removal. The cast survives at supabaseDataProvider.ts:143 as `as DPDataType['appSettings']`. The guard enforces the literal spelling only, and this is stated rather than reported as a clean sweep."
  - "The injection is the verbatim pre-157-07 spelling recovered from `git show 830cdeeb4`, not an invented fixture, so the rows measure a real historical regression."

requirements-completed: [REVIEW-ADP-01]

coverage:
  - id: G1
    description: "`yarn assert:adapter-casts` exits 0 on the current tree and exits 1 with a line number when a triple cast is reintroduced"
    requirement: REVIEW-ADP-01
    verification:
      - kind: negative-control
        ref: "ledger rows CAST-OLD (exit 0, guard unreached) and CAST-NEW (exit 1, two violations at supabaseDataProvider.ts:226 with the offending text echoed)"
        status: pass
  - id: G2
    description: "The script is a MEMBER of the `lint:check` chain and asserts its own membership rather than its position"
    requirement: REVIEW-ADP-01
    verification:
      - kind: negative-control
        ref: "ledger row CAST-VACUITY cases 8a/8b (fires when absent), 8c (silent when present), 8d (silent when relocated to the FIRST slot)"
        status: pass
  - id: G3
    description: "The guard's blindness before installation and its catch after are both measured and recorded"
    requirement: REVIEW-ADP-01
    verification:
      - kind: negative-control
        ref: "ledger rows CAST-OLD and CAST-NEW, each with its own command, exit code, turbo cache hash, log path and HEAD"
        status: pass
  - id: G4
    description: "The guard is discriminating: silent on the 34 accepted casts Phase 164 and 157-07 own"
    requirement: REVIEW-ADP-01
    verification:
      - kind: negative-control
        ref: "ledger row CAST-ALLOWED — 108 ` as ` lines read across 26 files, nine accepted cast shapes present, zero flagged"
        status: pass
  - id: G5
    description: "`yarn lint:check` exits 0 with the new assert present in the chain"
    requirement: REVIEW-ADP-01
    verification:
      - kind: build
        ref: "TURBO_FORCE=true yarn lint:check at HEAD df8e9a111 -> exit 0, `✖ 1 problem (0 errors, 1 warning)`, Tasks 22/22, guard summary is the last line"
        status: pass

status: complete
---

# Phase 157 Plan 08: The Adapter-Cast Assertion Script Summary

`scripts/assert-adapter-casts.mjs` turns REVIEW-ADP-01 criterion 1's "a grep for casts on adapter reads
returns empty" from a one-time observation into the tenth `assert:*` link of `yarn lint:check` — four
checks, proven blind before and catching after, and proven non-vacuous one failure path at a time
against a synthetic corpus.

## The cast baseline — measured vs recorded

The dispatch was right that the plan's numbers are stale, and my own measurement is recorded here rather
than inherited from `157-07`.

| Point | Lines matching ` as ` in `supabaseDataProvider.ts` | ` as ` tokens | `as Json as unknown as` in the adapter tree | Source |
|---|---|---|---|---|
| Fact 19 / `157-RESEARCH.md` § A.1, cited by this plan | 64 | 87 | 15 | recorded, **stale** |
| After `157-06` | 61 | 87 | 15 | `157-06-SUMMARY.md` |
| After `157-07` | 39 | 39 | 0 | `157-07-SUMMARY.md` |
| **Measured by me at HEAD `caa7b6c14`** | **39** | **39** | **0** | this session |

**The recorded figure is wrong by 25 lines and 48 token occurrences.** My measurement agrees with
`157-07`'s exactly, including its explanation of the shape: the token count collapsing to equal the line
count is what it looks like when the only lines carrying three ` as ` tokens each are the ones removed.

**No threshold in the guard is derived from a count.** Every check asserts *zero occurrences of an exact
spelling*, which is the only reason a baseline that moved four times inside one phase could not
mis-calibrate it. The pre-`157-07` occurrence counts recorded beside check 2's four literals were
re-measured independently at `git show 830cdeeb4` (the commit before `157-07`'s first) rather than copied:

| Literal | Occurrences before `157-07` | Now |
|---|---|---|
| `as Partial<DynamicSettings>` | 2 | 0 |
| `as AppCustomization` | 1 | 0 |
| `as LocalizedAnswers` | 4 | 0 |
| `as StoredImage` | 14 | 0 |
| `as Json as unknown as` | 15 | 0 |

All five are regression guards over real history. **None of them is a pattern that never matched
anything** — which is the specific thing I was asked to prove and did not want to assume.

## What shipped

**`scripts/assert-adapter-casts.mjs`** — Node built-ins only, no build step, fails closed, in the house
style of the nine existing assert scripts. Four checks:

| Check | Assertion | Reports |
|---|---|---|
| **0** | The corpus is real: the scan directory walks, yields ≥1 `.ts` file, and contains three named anchor files. | The scanned file and line counts on **every** run, clean or not. |
| **1** | No line under `apps/frontend/src/lib/api/adapters/supabase/**/*.ts` matches `/as\s+Json\s+as\s+unknown\s+as/`. | repo-relative path, line number, offending line text. |
| **2** | None of the four literal cast strings `157-07` removed reappears, each carrying its measured pre-`157-07` baseline in the message. | same three fields. |
| **3** | `yarn assert:adapter-casts` is one of the `&&` links of the root `lint:check` chain, and `assert:adapter-casts` is defined in `scripts`. | which of the two is missing. |

**Check 0 is a Rule 2 addition, not in the plan.** The reason is the defect class named in the dispatch
and hit twice by this phase: `157-12` found an acceptance criterion grepping for `rpc('merge_custom_data'`,
a string that occurs nowhere in the repo, which measured nothing and reported a pass. A guard is the one
artifact where that failure is permanent rather than momentary. Check 0, plus printing the size of what
was read on every run, is what lets a reader tell `0 violations over 26 files / 5047 lines` from
`0 violations over nothing`.

**The `lint:check` chain as it reads after the edit:**

```
turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring && yarn assert:comment-hygiene && yarn assert:edge-env-defaults && yarn assert:declared-binaries && yarn assert:node-engine && yarn assert:env-pair-registry && yarn assert:schema-migration-parity && yarn assert:adapter-casts
```

## The non-vacuity proof

Asked for explicitly, and it is the part of this plan I would not have shipped without.

**End to end, on the real tree** (rows `CAST-OLD` / `CAST-NEW`): the *same injected bytes* — provider
blob `31cd14d68434e071a69277bd775a4b64ed1c983e` in both halves — pass `lint:check` with the chain link
struck and fail it with the link restored.

| | `CAST-OLD` (link struck) | `CAST-NEW` (link restored) |
|---|---|---|
| `TURBO_FORCE=true yarn lint:check` | **exit 0** | **exit 1** |
| `@openvaa/frontend:lint` | `✖ 1 problem (0 errors, 1 warning)` | `✖ 1 problem (0 errors, 1 warning)` |
| `svelte-check` | `0 errors and 0 warnings` | `0 errors and 0 warnings` |
| `Tasks` | `22 successful, 22 total` | `22 successful, 22 total` |
| turbo lint input hash | `add10b2d4029a62e` | `add10b2d4029a62e` — **identical**, independently confirming the two halves ran on the same bytes |
| guard mentioned in the log | **0 times** — it never ran | 2 violations at `supabaseDataProvider.ts:226`, offending text echoed |

The injection is not a fixture: it is the verbatim pre-`157-07` spelling of the elections-image read,
recovered from `git show 830cdeeb4`, where the identical form appears at 13 sites. It typechecks
(`svelte-check` 0/0 in both halves), so the ninth-life regression this measures is a **shippable** one
that the whole pre-existing gate accepts.

**Path by path, in isolation** (row `CAST-VACUITY`): the guard has **8** failure paths and `CAST-NEW`
exercises 2. The other 6 were fired individually against a synthetic corpus, using a probe that differs
from the shipped file **on exactly one line** (`ADAPTER_DIR_REL`), asserted programmatically:

| Path | Check | Exit | Result |
|---|---|---|---|
| *(control: clean corpus carrying four accepted cast shapes)* | — | **0** | `3 file(s), 18 line(s); 0 violation(s)` |
| corpus empty | 0 | 1 | 4 violations — vacuous-zero message + all three anchors |
| one anchor missing | 0 | 1 | 1 violation, names the missing anchor only |
| `as Json as unknown as` | 1 | 1 | path:line + text |
| `as Partial<DynamicSettings>` | 2 | 1 | "…its 2 occurrences…" |
| `as AppCustomization` | 2 | 1 | "…its 1 occurrence…" |
| `as LocalizedAnswers` | 2 | 1 | "…its 4 occurrences…" |
| `as StoredImage` | 2 | 1 | "…its 14 occurrences…" |
| chain link absent | 3 | 1 | names the missing link |
| script entry absent too | 3 | 1 | **2** violations, reported separately |
| both restored | 3 | 0 | silent |
| **link moved to the FIRST chain slot** | 3 | **0** | silent — the membership-not-position proof |

**Recorded against interest: the vacuity matrix's own first run was vacuous.** Case 1 removed the corpus
directory, the rebuild helper did not recreate it, and cases 2–7 all ran against an empty tree —
**every one of them exiting 1, the expected value.** Read by exit code alone it was twelve passes
measuring nothing after case 1. It was caught by reading the messages instead, and the helper now
asserts the corpus holds exactly 3 files before each case. The `157-12` defect class reproduced itself
*inside the instrument built to detect it*; an exit code is not a measurement.

## Ledger rows — each with its own command, exit code and HEAD

Five rows appended to `157-NEGATIVE-CONTROL-LEDGER.md`, **created empty and committed in that state
(`4605f4db7`, 193 insertions / 0 deletions) before this plan's first injection**, then filled
(`1bfd3f744`).

| Row | Command | Exit | HEAD | Outcome |
|---|---|---|---|---|
| `CAST-OLD` | `TURBO_FORCE=true yarn lint:check` | **0** | `df8e9a111` | **BLIND — confirmed** |
| `CAST-OLD` companion | `node scripts/assert-adapter-casts.mjs` | **1** | `df8e9a111` | 3 violations, incl. check 3 reporting its own absence — the guard was unreachable, not silent |
| `CAST-NEW` | `TURBO_FORCE=true yarn lint:check` | **1** | `df8e9a111` | **CAUGHT — confirmed** |
| `CAST-RESTORE` | `git checkout --` ×2, `git hash-object` ×4, `git status --porcelain apps` | **0** | `df8e9a111` | **RESTORED byte-identically** |
| `CAST-ALLOWED` | `node scripts/assert-adapter-casts.mjs` | **0** | `df8e9a111` | **SILENT WHERE IT MUST BE — confirmed** |
| `CAST-VACUITY` | `PROBE_DIR=corpus node …/guard-probe.mjs` ×12 | mixed, per row | `df8e9a111` | **NON-VACUOUS — confirmed, path by path** |

`TURBO_FORCE=true` on every lint measurement, and each run's `cache bypass, force executing <hash>` was
read back to confirm a genuine run rather than a replay: clean `451ccf218e94105c`, both injected halves
`add10b2d4029a62e`, restored `451ccf218e94105c`.

**Ledger discipline.** No cell is borrowed. Rows `A`–`H` measure a *different guard* answering a
*different question* (`REVIEW-ADP-06`, a Supabase call leaking out) and are named in the section as
**not** evidence about this one. The register-status update is a **new block above** `157-16`'s, per the
`157-15` precedent — no earlier framing edited. The fill diff touches only lines ≥693, entirely inside
this plan's own section, verified by hunk ranges.

### Restoration hash pairs

| File | Pre-injection | Post-restoration | Match |
|---|---|---|---|
| `…/dataProvider/supabaseDataProvider.ts` | `3158f7fd77bf32de1e31839963ed5e9ed59ca528` | `3158f7fd77bf32de1e31839963ed5e9ed59ca528` | ✔ |
| `package.json` | `ca03b97d72dd690a5c0635b7879620d0b51c1656` | `ca03b97d72dd690a5c0635b7879620d0b51c1656` | ✔ |
| `scripts/assert-adapter-casts.mjs` (never injected) | `51bc6d493836f5166bda11fc84551c40bc68fa90` | `51bc6d493836f5166bda11fc84551c40bc68fa90` | ✔ |
| `apps/frontend/eslint.config.mjs` (never touched) | `d5a742b590c2b9028e66bf7c7259f75cb4d2ff9f` | `d5a742b590c2b9028e66bf7c7259f75cb4d2ff9f` | ✔ |

`git status --porcelain apps` printed **nothing**. `git diff --name-only` printed **nothing**.
`git diff --quiet apps/frontend/src/lib/api/` exits **0**. Three independent restoration proofs agree:
`git hash-object`, turbo's input hash returning to the pre-injection `451ccf218e94105c`, and the frontend
unit suite back at exactly **932 passed (932)**.

## Verification — commands run and real output

| Command | Result |
|---|---|
| `node scripts/assert-adapter-casts.mjs` | **exit 0** — `26 file(s), 5047 line(s) scanned …; 0 violation(s)` |
| `TURBO_FORCE=true yarn lint:check` (restored tree, HEAD `df8e9a111`) | **exit 0**; `@openvaa/frontend:lint: ✖ 1 problem (0 errors, 1 warning)`; guard summary is the last line of the run |
| `@openvaa/frontend:typecheck` | `svelte-check found 0 errors and 0 warnings` |
| `Tasks` | `22 successful, 22 total` |
| Comment-hygiene guard | **1583 files scanned, 0 violations** — unchanged, and see the note below |
| `yarn format:check` (repo root, separate gate) | **exit 0**, "All matched files use Prettier code style!" |
| `yarn workspace @openvaa/frontend test:unit` | **932 passed (932)**, 56 files — exactly the `157-07` baseline |
| `grep -c 'assert:adapter-casts' package.json` | **2** |
| `grep -c 'TSAsExpression' apps/frontend/eslint.config.mjs` | **0** — the no-ESLint-rule prohibition holds |
| `git diff --quiet apps/frontend/src/lib/api/` | **exit 0** |

**On the comment-hygiene count staying at 1583.** The dispatch warned that a new *untracked* file gives a
false green and the tell is the scanned-file count. It does not move here for a different, verified
reason: the guard's `SCAN_ROOTS` are `['apps', 'packages', 'tests']` (`assert-comment-hygiene.mjs:196`),
and `scripts/` is outside all three — as are the nine existing assert scripts. So this file is **not
scanned by that guard at all**, and 1583 is the correct expected value rather than a false green. Stated
because "the count did not move" would otherwise be exactly the symptom the warning describes.

## Criteria I could not meet as worded

**1. Task 1's "`node scripts/assert-adapter-casts.mjs` exits 0 on the current tree" is unsatisfiable at
task 1.** Check 3 — specified in task 1 — asserts the guard's own membership in a chain that task 2
creates. At task 1 the script therefore exits **1** with two violations, both of which are the guard
correctly reporting its own absence; checks 0, 1 and 2 pass. The criterion is met from task 2 onward, and
task 2's own criterion ("check 3 passes, proving the membership assertion sees itself") is the plan
acknowledging the same ordering. The two resolutions — implement check 3 in task 1 as specified, or defer
it to task 2 — ship the identical artifact, so this is an ordering artifact rather than a fork, and I
proceeded rather than stopping.

**2. Task 1's `grep -c 'indexOf\|\[0\]\|position'` returns 4, not 0.** The criterion's words are "shows no
positional assertion", and it does: all four hits are prose explaining why position must *not* be
asserted, including the verbatim `b410d3a90` commit subject. The substantive check is
`lintCheck.split('&&').map(trim).includes('yarn assert:adapter-casts')` — a token-set test with no index
anywhere. I did not delete the explanatory comments to drive the grep to zero; that would have removed
the reasoning and left the guard.

**3. Check 2's zero for `as Partial<DynamicSettings>` is a respelling, not a removal — and the guard
cannot see the surviving instance.** `157-07` recorded this plainly and it matters for what this guard
actually enforces. The cast lives at `supabaseDataProvider.ts:143` spelled `as DPDataType['appSettings']`.
`Partial<DynamicSettings>` is a *shallow* partial while the column holds a deep partial, so the honest fix
ripples into `mergeInitialAppSettings`, `NotificationProps` and app-shared's published `NotificationData`
— a Rule 4 call `157-07` deliberately left. **This guard therefore enforces the literal spelling only.**
Re-spelling a boundary cast under a different type name evades check 2 by construction. That is a real
limit of a text guard and it is recorded in `.planning/WINDOWS.md` rather than presented as a clean sweep.

**4. The plan's task-2 action text describes a stale chain.** It says `lint:check` "currently runs
`turbo run lint`, an eslint pass over `tests`, `typecheck:tests`, `typecheck`,
`assert:i18n-catalog-namespaces` and `assert:a11y-scan-wiring`" and calls the addition "a fourth assert".
Measured: the chain already carried **nine** `assert:*` links, so this is the **tenth**. The one-line
change and the four-instance precedent are unaffected; only the count in the prose was wrong.

**5. The dispatch's premise about class-2 casts is confirmed and load-bearing here.** `157-07` measured
that the seven `} as ElectionData`-shaped casts compensate for `toDataObject`'s `Record<string, unknown>`
return, not for unvalidated input, so no zod parse removes them. This guard's rationale does **not**
assume casts are removable by validation: checks 1 and 2 name five exact spellings with measured zero
baselines, and row `CAST-ALLOWED` records the guard reading `} as ElectionData` and leaving it alone.

## Deviations from Plan

### Auto-fixed / added

**1. [Rule 2 - Missing critical functionality] Check 0, the corpus precondition, is not in the plan**

- **Found during:** Task 1 design, reading the dispatch's warning about the `157-12` defect class.
- **Issue:** the plan's three checks all report "0 violations" over whatever corpus the walk happens to
  produce. If the adapter directory were renamed, the walk yields an empty set, every check reports zero,
  and the guard is green forever while measuring nothing.
- **Fix:** check 0 asserts the corpus is non-empty and contains three named anchor files, and the summary
  line reports the scanned file and line counts on every run so a zero can be sized.
- **Files:** `scripts/assert-adapter-casts.mjs`
- **Commit:** `25bbf9614`

**2. [Rule 2] A fifth ledger row, `CAST-VACUITY`, beyond the plan's four**

- **Found during:** Task 3 planning.
- **Issue:** the plan's `CAST-NEW` injection (`as Json as unknown as StoredImage | null`) matches check 1
  and one of check 2's four literals. The guard has 8 failure paths; 6 would have shipped never having
  been fired, which is the same class as a pattern that matches nothing.
- **Fix:** each path fired in isolation against a synthetic corpus with a one-line-different probe, plus a
  non-trivial silent control and a link-relocation case proving membership-not-position.
- **Files:** `157-NEGATIVE-CONTROL-LEDGER.md`
- **Commit:** `1bfd3f744`

**3. [Rule 1 - Bug] The violation message read "removed all 1 of its occurrences"**

- **Found during:** the first vacuity matrix run, case 5.
- **Issue:** a guard's message is read at the moment the build goes red; a grammar wart there reads as a
  typo in the tooling and costs trust.
- **Fix:** pluralised — "its 1 occurrence" / "its 4 occurrences". Message text only; no check, pattern or
  exit code changed. The guard blob recorded in the ledger's "not a target" line is the post-fix value,
  and every measurement was taken after it.
- **Files:** `scripts/assert-adapter-casts.mjs`
- **Commit:** `df8e9a111`

### Plan premises checked before acting

- **The plan's cited 64/87 baseline is stale** — re-measured as 39/39/0 before anything was written. No
  guard threshold depends on a count, so the drift could not mis-calibrate it.
- **The four check-2 literals were verified to have had real pre-`157-07` baselines** (2, 1, 4, 14) at
  `git show 830cdeeb4`. Had any been zero there, it would have been a pattern that never matched anything
  and I would have said so instead of shipping it.
- **`grep -c 'TSAsExpression' apps/frontend/eslint.config.mjs` → 0**, and no ESLint rule was added; the
  guard is a standalone scan, per the plan's prohibition.
- **`apps/frontend/eslint.config.mjs` is at `d5a742b590c2b9028e66bf7c7259f75cb4d2ff9f`**, `157-16`'s value,
  re-measured at the start and again at the end. Untouched.

## Known Stubs

None. One **acknowledged limitation**, recorded in `.planning/WINDOWS.md` rather than left implicit: check
2 is a literal-spelling guard, so the surviving `as DPDataType['appSettings']` respelling of
`as Partial<DynamicSettings>` is invisible to it (see "Criteria I could not meet as worded" item 3). No
placeholder, TODO, skipped test or unrun `<verify>` was left behind.

## Threat Flags

None. No network, auth or file-access surface added; no packages installed (`T-157-SC`: zero lockfile
change, Node built-ins only). Register dispositions:

- **T-157-19** (a guard that lints clean by accident) — **mitigated and measured.** `CAST-OLD` takes the
  blind half with the chain link struck; `CAST-NEW` takes the catch half on byte-identical source;
  `CAST-RESTORE` proves restoration by `git hash-object`, by turbo's input hash and by the unit baseline.
- **T-157-20** (the guard silently leaving the chain) — **mitigated.** Check 3 makes the guard's own
  absence a failure, fired in isolation (`CAST-VACUITY` 8a/8b) and proven position-independent (8d).
- **T-157-21** (a guard so noisy it gets disabled) — **mitigated and measured.** `CAST-ALLOWED`: 108 ` as `
  lines read, nine accepted cast shapes present, zero flagged.
- **T-157-SC** — **closed.** No install of any kind.

## Concurrency hygiene

Every commit used explicit per-file `git add`. No `git add -A`, no `git add .`, no `git commit -a`, no
`git stash`, no `git clean`, no `git reset`. The untracked `.planning/state.json` was left alone
throughout, including across the two injection windows. The database was not touched: no `db:reset*`, no
`db:types`, no pgTAP, and `db:lint:sql` was not run.

**On the pre-commit HEAD assertion:** this checkout is a linked git worktree (`.git` is a file), but it is
the user's persistent working tree rather than a GSD-spawned agent worktree — the dispatch set
`isolation: none`. The protected-branch deny-list was checked and satisfied
(`integration/ship-12-squash` is not `main`/`master`/`develop`/`trunk`/`release/*`); the `agent-*`
allow-list, which presumes per-agent worktree isolation, does not apply and was not enforced. Same
disposition as `157-02`, `157-06` and `157-07` on this branch.

## Commits

| Task | Commit | Message |
|---|---|---|
| 1 | `25bbf9614` | `feat(157-08): add the adapter-boundary cast guard` |
| 2 | `caa7b6c14` | `chore(157-08): chain the adapter-cast guard into lint:check` |
| 3 (rows-first) | `4605f4db7` | `docs(157-08): open five negative-control rows before any injection` |
| — | `df8e9a111` | `style(157-08): pluralise the cast-guard violation message` |
| 3 (fill) | `1bfd3f744` | `docs(157-08): fill the five cast-guard negative-control rows` |

## Self-Check: PASSED

All four declared files exist on disk; all five commit hashes resolve in `git log`; the ledger carries
exactly five `### Row \`CAST-*\`` headings. The working tree is clean apart from this SUMMARY, the
`.planning/WINDOWS.md` entry recorded above, and the pre-existing untracked `.planning/state.json`.
