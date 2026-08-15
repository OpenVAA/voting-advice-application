# 140-MEASUREMENT — F3 teardown row-count measurement (ASSERT-02)

One instrumented, preflight-confirmed full-suite run producing a per-site
`{prefix, before, rowsDeleted, after}` observation for every teardown project that
executed. Taken under binding decision **D-02**: F3 measures before it chooses a matcher.

**This document chooses no matcher.** The adjudication belongs to plan 06 and must consume
the table below. Nothing here is a recommendation.

---

## 1. Environment

| Field | Value |
|---|---|
| Date (UTC) | 2026-08-15 |
| Date (local) | 2026-08-15 17:37 EEST |
| Repo root | `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd` |
| Branch | `feat-gsd-roadmap` |
| Git HEAD at run | `9c2a1535a20628152d34d9b60d6b7aa4220c3a39` (`refactor(140-05): route all 27 teardown assertion sites through the shared helper`) |
| Node | v24.14.1 |
| Yarn | 4.13.0 |
| Playwright | 1.58.2 |
| Supabase CLI | v2.109.1 (local stack; `yarn db:reset` run by the wrapper) |
| Frontend port | 5273 (wrapper default; it spawns and owns its own dev server) |

**Scoped git status at run start** (`tests/e2e-runs/140-f3-measure/worktree-status.txt`):

```
 M .vscode/settings.json
 M supabase/.temp/cli-latest
 M tests/tests/setup/shared/assertTeardown.ts
```

The first two are pre-existing, unrelated, and out of scope for this phase. The third IS the
transient instrumentation described in §2 — it is the only in-scope dirty file, and it was
reverted immediately after the run (§6).

**Environment posture** (`env-posture.txt`, written before the run, observed values appended
from `results.json` after it):

```
ci_env=unset
eperm07_knobs=unset
frontend_port=5273
expected_retries=0
expected_workers=6
observed_workers=6
observed_retries=0
observed_expected=135
observed_unexpected=0
observed_flaky=0
observed_skipped=0
observed_duration_ms=634917
```

---

## 2. Instrumentation (verbatim diff)

Applied to the committed helper, exercised for exactly one run, then reverted. Every injected
line carries the `INJECTED (140)` marker. The instrumentation OBSERVES only — the existing
assertion was left untouched, so it cannot have influenced the very outcome it was taken to
inform.

```diff
diff --git a/tests/tests/setup/shared/assertTeardown.ts b/tests/tests/setup/shared/assertTeardown.ts
index b408dc3a7..d037a87c3 100644
--- a/tests/tests/setup/shared/assertTeardown.ts
+++ b/tests/tests/setup/shared/assertTeardown.ts
@@ -42,6 +42,9 @@ import type { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
  * @param client - admin client constructed by the caller (reused for its other steps).
  */
 export async function runTeardownAsserted(prefix: string, client: SupabaseAdminClient): Promise<void> {
+  const before = await client.countRowsByPrefix(prefix); // INJECTED (140)
   const { rowsDeleted } = await runTeardown(prefix, client);
+  const after = await client.countRowsByPrefix(prefix); // INJECTED (140)
+  console.log(`[140-MEASURE] ${JSON.stringify({ prefix, before, rowsDeleted, after })}`); // INJECTED (140)
   expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
 }
```

`countRowsByPrefix` (landed in this plan's task 1) issues a HEAD count query
(`{ count: 'exact', head: true }`) per table across the ten tables exported as
`ALLOWED_TEARDOWN_TABLES` from `@openvaa/dev-seed` — the SAME list `bulk_delete` clears — so
`before`/`after` are measured over exactly the row set `rowsDeleted` reports on, and are not
truncated by PostgREST's default page limit.

---

## 3. Invocation (verbatim)

```bash
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/140-f3-measure
```

No `--project` — the FULL gate suite, because the ordering hazard under measurement is
invisible in a single-project run.

**Outcome:**

| Field | Value |
|---|---|
| Wrapper started (UTC) | 2026-08-15T14:25:04Z |
| Wrapper ended (UTC) | 2026-08-15T14:36:17Z |
| Playwright exit | `0` |
| Preflight SUCCESS lines | 1 |
| Preflight FAILURE lines | 0 |
| Result | **135 passed**, 0 unexpected, 0 flaky, 0 skipped |

The 27-site codemod committed at `9c2a1535a` reddened nothing: the suite is cardinal-clean,
which is the guarantee this plan's behaviour-preserving design depends on.

Records were extracted from `tests/e2e-runs/140-f3-measure/stdout.log`
(`tests/e2e-runs/` is gitignored at `.gitignore:44`) with:

```bash
grep -o '\[140-MEASURE\] {.*}' tests/e2e-runs/140-f3-measure/stdout.log
```

26 records were emitted; 26 records are tabulated. No row below is inferred.

---

## 4. The table

Ordered by observation, i.e. by actual teardown-project execution order in the run.

| prefix | before | rowsDeleted | after | teardown file | obs # |
|---|---|---|---|---|---|
| `e2e-perm-analytics-` | 13 | 13 | 0 | `perm-analytics-tracking.teardown.ts` | 1 |
| `e2e-perm-orgmatch-` | 0 | 0 | 0 | `perm-org-matching.teardown.ts` | 2 |
| `e2e-perm-iinfo-` | 0 | 0 | 0 | `perm-interactive-info.teardown.ts` | 3 |
| `e2e-perm-qvid-` | 0 | 0 | 0 | `perm-question-video.teardown.ts` | 4 |
| `e2e-perm-no-allowopen-` | 0 | 0 | 0 | `perm-disable-allow-open.teardown.ts` | 5 |
| `e2e-perm-hide-cattags-` | 0 | 0 | 0 | `perm-hide-category-tags.teardown.ts` | 6 |
| `e2e-perm-hide-eltags-` | 0 | 0 | 0 | `perm-hide-election-tags.teardown.ts` | 7 |
| `e2e-perm-hide-missing-` | 0 | 0 | 0 | `perm-hide-if-missing-answers.teardown.ts` | 8 |
| `e2e-perm-hide-all-noms-` | 0 | 0 | 0 | `perm-hide-all-nominations.teardown.ts` | 9 |
| `e2e-perm-header-help-` | 0 | 0 | 0 | `perm-header-show-help.teardown.ts` | 10 |
| `e2e-perm-feedback-survey-` | 0 | 0 | 0 | `perm-show-feedback-survey.teardown.ts` | 11 |
| `e2e-perm-hide-hero-` | 0 | 0 | 0 | `perm-hide-hero.teardown.ts` | 12 |
| `e2e-perm-answers-locked-` | 0 | 0 | 0 | `perm-answers-locked.teardown.ts` | 13 |
| `e2e-perm-l10n-pos-` | 0 | 0 | 0 | `perm-localisation-positive.teardown.ts` | 14 |
| `e2e-perm-missnoms-` | 0 | 0 | 0 | `perm-missing-nominations.teardown.ts` | 15 |
| `e2e-perm-notif-` | 0 | 0 | 0 | `perm-per-app-notifications.teardown.ts` | 16 |
| `e2e-perm-access-disable-` | 0 | 0 | 0 | `perm-access-disable.teardown.ts` | 17 |
| `e2e-perm-notloc-` | 0 | 0 | 0 | `perm-not-located-2e2cg.teardown.ts` | 18 |
| `e2e-perm-disable-elec-2co-` | 0 | 0 | 0 | `perm-disable-election-2co.teardown.ts` | 19 |
| `e2e-perm-disable-elec-1co-` | 0 | 0 | 0 | `perm-disable-election-1co.teardown.ts` | 20 |
| `e2e-perm-disjoint-1co-` | 0 | 0 | 0 | `perm-disjoint-1co.teardown.ts` | 21 |
| `e2e-perm-startfromcg-` | 0 | 0 | 0 | `perm-startfromcg.teardown.ts` | 22 |
| `e2e-perm-2e-asymmetric-` | 0 | 0 | 0 | `perm-2e-asymmetric.teardown.ts` | 23 |
| `e2e-perm-2e-shared-` | 0 | 0 | 0 | `perm-2e-shared.teardown.ts` | 24 |
| `e2e-perm-1e1cg1co-` | 0 | 0 | 0 | `perm-1e1cg1co.teardown.ts` | 25 |
| `test-e2e-base-` | 0 | 0 | 0 | `base.teardown.ts` | 26 |

### 4.1 Named gap — 1 of 27 sites did not execute

| teardown file | prefix | cause |
|---|---|---|
| `tests/tests/setup/candidate/bank-auth-journey.teardown.ts` | `e2e-perm-notloc-` | Its Playwright project is opt-in behind `PLAYWRIGHT_BANK_AUTH` (`tests/playwright.config.ts:288`, `:316`, `:1231`). The default gate suite does not register it, so it emitted no observation. |

Confirmed positively, not assumed: enumerating distinct `projectName` values from
`results.json` yields 27 `data-teardown-*` projects, and no bank-auth teardown project among
them. The 27 that ran are the 26 assertion-bearing sites in the table plus
`data-teardown-candidate-journey`, the 28th teardown file, which calls only
`unregisterCandidate`, carries no delete-count assertion, and is therefore correctly absent
from the table.

Row 18's observation belongs to `perm-not-located-2e2cg.teardown.ts`. `e2e-perm-notloc-` is
owned by TWO teardown files; only one of them ran.

---

## 5. Reading of the table

### 5.1 What was observed

25 of 26 observations are `before=0, rowsDeleted=0, after=0`. Exactly one —
`e2e-perm-analytics-`, the FIRST teardown to execute — is `before=13, rowsDeleted=13,
after=0`.

### 5.2 Which mechanism each pattern is consistent with

The run's project timeline (extracted from `results.json` start times) settles the question
empirically rather than by reading the config:

```
14:25:44  data-setup-base
14:25:46  data-setup-candidate-journey
14:27:16  data-setup-perm-1e1cg1co
   ...        (25 further perm setups, serially)
14:35:55  data-setup-perm-analytics-tracking     <- LAST setup
14:35:58  data-teardown-perm-analytics-tracking  <- FIRST teardown
14:35:59  data-teardown-perm-org-matching
   ...
14:36:16  data-teardown-base                     <- LAST teardown
```

**EVERY setup in the suite runs before ANY teardown does.** Teardowns then execute in reverse
setup order, back to back, in the final ~22 seconds of an 11-minute run.

Both research mechanisms are present, and the observed pattern requires BOTH:

- **Mechanism 2 (`teardown:` deferral) — confirmed.** Playwright's `teardown:` key defers each
  teardown project past its transitive dependents, which in this suite's serial perm chain
  means past every LATER perm setup too. No teardown runs adjacent to the specs it cleans up
  after.
- **Mechanism 1 (`extraTeardownPrefix` pre-clear) — confirmed and broader than assumed.**
  Each perm setup calls `setupFromTemplate(..., { extraTeardownPrefix: ['test-', 'e2e-perm-'] })`,
  and `setupFromTemplate.ts:184-196` wipes each of those families before seeding. It covers
  `test-` as well as `e2e-perm-`, so a perm setup wipes the BASE dataset's rows too
  (`test-e2e-base-` is prefixed by `test-`). Composed with mechanism 2, the last setup to run
  (`perm-analytics-tracking`) wipes all 25 prior perm datasets AND the base dataset before
  seeding its own 13 rows — after which the teardowns finally start.
- **Neither mechanism:** none. Every row is accounted for.

That is why exactly one site has rows to delete, and why it is specifically the site whose
setup ran last.

### 5.3 Load-bearing consequences for plan 06

Stated as observations, not as a recommendation:

1. A positivity floor on `rowsDeleted` applied uniformly would have failed **25 of the 26**
   sites that executed in this run — a worse outcome than the ~26-of-27 research predicted,
   and a direct cardinal-rule violation had it been committed unmeasured. D-02 was correct.
2. `rowsDeleted === before` holds at **26 of 26** observations.
3. `after === 0` holds at **26 of 26** observations.
4. Which site is the non-zero one is a property of chain ORDER, not of the site. It is
   whichever setup happens to run last. Any matcher keyed to a specific prefix being non-zero
   would be pinned to the current chain ordering and would break the first time a perm is
   inserted at the end of the chain.
5. The `e2e-perm-notloc-` prefix is owned by two teardown files, only one of which runs by
   default. A site-level invariant must tolerate a site whose prefix another site may already
   have cleared.

---

## 6. Hygiene — the instrumentation left nothing behind

Reverted with `git checkout -- tests/tests/setup/shared/assertTeardown.ts`, then the three-check
POST-GATE:

| Check | Command | Result |
|---|---|---|
| per-path | `git status --porcelain -- tests/tests/setup/shared/assertTeardown.ts` | empty |
| scoped | `git status --porcelain -- apps tests packages` | empty |
| marker grep | `grep -rn 'INJECTED (140)' apps packages tests` | no match |

No env-gated control mode, no commented-out probe, and no `test.skip` remains. The committed
helper is byte-identical to its state at `9c2a1535a`.

---

## 7. What this measurement does NOT discharge

Recording only the confirmations would make this advocacy rather than evidence. Explicit
limits:

- **It is ONE run on ONE machine.** It does not establish that the pattern is stable across
  runs, machines, worker counts, or a `--project`-restricted invocation. The 25-zeros result
  is a consequence of chain ordering, and chain ordering is exactly the thing that could
  differ under a different invocation.
- **It does not cover `bank-auth-journey.teardown.ts`** (§4.1). That site is unmeasured, full
  stop, and a matcher adopted in plan 06 will apply to it without observational support.
- **It does not prove the current assertion is unfailable.** That claim rests on reading
  `countDeletedRows` (`packages/dev-seed/src/cli/teardown.ts`), which initialises to 0 and
  only accumulates finite numbers; this run merely fails to contradict it. No negative control
  was executed here — plan 06 owns that.
- **It does not validate any candidate matcher.** Consistency of `rowsDeleted === before` and
  `after === 0` across 26 observations is not the same as those invariants having been
  asserted and observed to redden when violated. Only an injected negative control would show
  that, and none was run in this task.
- **It says nothing about storage cleanup.** `storageRemoved` was not instrumented; the probe
  counts database rows only.
- **`before` and `after` bracket the delete but not the whole teardown body.** At the five
  perm sites that call `unregisterCandidate` before the delete, and at `base.teardown.ts`,
  work outside the bracketed region is unobserved.

---

## 8. Adjudication — the matcher, chosen against § 4

Written by plan `140-06` task 1, consuming the table above. Decision rule pre-specified in
`140-06-PLAN.md` task 1, evaluated here against the real rows rather than against research's
prediction.

### 8.1 Branch classification — **branch A**

The rule offers exactly three branches. Evaluated:

| Branch | Its condition | Holds against § 4? |
|---|---|---|
| **A** | `rowsDeleted === before` at every observed row **and** `after === 0` at every observed row | **YES — 26/26 and 26/26** |
| B | `after === 0` everywhere but `rowsDeleted` and `before` disagree at ≥1 row (assumption A2 false) | No — zero rows disagree; A2 holds |
| C | `before > 0` at essentially every site (assumption A1 false, ordering hazard absent) | No — `before > 0` at **1 of 26** sites; A1 holds and is stronger than assumed (§ 5.2) |

**Branch A is taken.** Assumption **A2 is CONFIRMED**: `bulk_delete`'s summed per-collection
`deleted` counts and the ten-table `countRowsByPrefix` HEAD-count probe are directly comparable —
they agreed exactly at all 26 observations, including the only row where either was non-zero.

### 8.2 The rows that support it

- **Row 1** (`e2e-perm-analytics-`, `before=13, rowsDeleted=13, after=0`) is the only observation that
  exercises the non-trivial path of either clause. It is what shows `rowsDeleted === before` is
  satisfiable when rows are actually present, and that `after === 0` is reached by a real delete rather
  than by there having been nothing to delete.
- **Rows 2–26** (all `0/0/0`) are the boundary path: `before === 0`, a legitimate no-op, which the
  chosen matcher passes. They are the reason no positivity floor may be adopted — see § 8.3.
- **Row 18** (`e2e-perm-notloc-`) additionally shows the duplicated-prefix case passing on the
  `before === 0` path, which is the shape the second owner of that prefix
  (`bank-auth-journey.teardown.ts`, unmeasured — § 4.1) will present in whichever order the two run.

### 8.3 What each rejected shape would have cost, against these 26 rows

The load-bearing part. Counts are against the measured data, not against a prediction.

| Rejected shape | Rows it would have REDDENED | Why |
|---|---|---|
| **C** — positivity floor, `expect(rowsDeleted).toBeGreaterThan(0)` | **25 of 26** | Every row except row 1. `rowsDeleted === 0` is the legitimate outcome at 25 sites because two confirmed mechanisms (§ 5.2) empty the prefix before the teardown reaches it. Committing this unmeasured would have been a 25-project cardinal-rule violation. |
| **D** — per-site expected constant, `expect(rowsDeleted).toBe(N)` with N the template's seeded row count | **25 of 26** | Same 25 sites, for the same reason, plus it pins row 1 to `13` — a number that changes with any template edit, and which § 5.3(4) shows is a property of chain ORDER, not of the site. |
| **B** — residue-only, `expect(await listCandidateIdsByPrefix(prefix)).toHaveLength(0)` | **0 of 26** | Reddens nothing, which is precisely its problem: it is candidates-table-only, so it asserts over 1 of the 10 tables `bulk_delete` clears, and at 25 of 26 sites it asserts over an empty set. It carries no accounting clause at all. |
| **E** — delete the `expect` entirely | **0 of 26** | Fails ASSERT-02 by construction; recorded only because research enumerated it. |
| **A** — the adopted before/after invariant | **0 of 26** | Both clauses hold at every observation. The post-change full-suite gate (plan 06 task 3) is what confirms this prospectively rather than retrospectively. |

Branch C's premise is not merely unmet — it is **inverted**: research predicted the positivity floor
would redden ~26 of 27; the measurement says 25 of the 26 that executed. D-02 is vindicated by a
margin, not by a technicality.

### 8.4 The adopted assertion, and an honest statement of its reach

Landed at `tests/tests/setup/shared/assertTeardown.ts`:

```ts
const rowsBefore = await client.countRowsByPrefix(prefix);
const { rowsDeleted } = await runTeardown(prefix, client);
const rowsAfter = await client.countRowsByPrefix(prefix);

expect(rowsDeleted, `teardown of prefix '${prefix}' deleted ${rowsDeleted} row(s) but ${rowsBefore} row(s) were present …`).toBe(rowsBefore);
expect(rowsAfter,  `teardown of prefix '${prefix}' left ${rowsAfter} row(s) behind (${rowsBefore} present before the delete, ${rowsDeleted} reported deleted)`).toBe(0);
```

**It catches:** a delete that accounts for none or only some of the rows present — a silently
no-opping `bulk_delete`, a table dropped from `ALLOWED_TEARDOWN_TABLES`, a scoping bug that sends the
RPC a prefix different from the one counted. That is exactly the defect class F3 named.

**It does NOT catch a call-site `PREFIX` typo.** `140-06-PLAN.md`'s branch-C paragraph asserts the
before/after invariant "also catches a prefix typo (which a positivity floor cannot)". **Corrected
here against the code:** the helper takes ONE `prefix` argument, so a typo'd constant propagates
identically to the count and to the delete, yielding `before=0, rowsDeleted=0, after=0` — a passing,
legitimate-looking no-op. Neither shape A nor shape B nor shape C detects that; only a per-site
expected-count (shape D, rejected above) would, at a cost the measurement shows is unpayable. The
claim is corrected rather than repeated, per this phase's own standard: a document that restates a
plan's optimistic wording it can see is false is the drift class Phase 140 exists to close.

**Residual race window, stated not hidden.** The accounting clause compares a count taken *before*
`runTeardown` against what `runTeardown` reports. If another actor removes rows in the interval
between the `before` count and the RPC, the assertion reds for a reason that is not this site's
defect (`before > 0`, `rowsDeleted === 0`, `after === 0`). § 5.2's timeline shows the default suite
never opens that window — every setup completes before any teardown starts — so it is not reachable
under the measured ordering, and it is not reachable under a `--project` invocation either, where a
single chain's teardown follows its own setup. It IS reachable in principle under a future
parallelised perm chain. Recorded as a known property of the chosen shape, unobserved in this run,
and not traded away: relaxing the clause to tolerate it is exactly the "weaken the assertion to keep
the suite green" move this phase prohibits.
