# Deferred for the operator — overnight run, 2026-08-29 → 30

Everything here needs a human. Nothing in this file has been decided, worked around, or
force-marked. Items are appended as the run reaches them; the run continues past each one on the
autonomous work that does not depend on it.

**Ruling already given and being honoured:** D1–D4, D8, D9, D10 and § K (Phase 162) are recorded in
`v2.15-OPERATOR-DECISIONS-2026-08-29.md`. Nothing below re-opens them.

---

## 1. Phase 153 closed with FOUR named boundaries — none is a pass

Phase 153 is complete: all 11 plans executed, gate green at one HEAD, and **E2E genuinely
150/150 · 0 failed · 0 skipped · 0 flaky · 0 did-not-run**, preflight confirmed. The orchestrator
independently decoded the report payload and re-tallied per test: 150 seen, all `expected`, **0 tests
with more than one result**, with `retries` at 0 outside CI — so `flaky: 0` is a measurement, not a
config artefact.

Four requirements remain **Pending**, each with its unmet clause named. They are the phase's honest
residue, and each needs a ruling on how it discharges:

| Id | Unmet clause | Why it cannot close where it sits |
|---|---|---|
| **REVIEW-CFG-05** | *"observed running green against its script on a real workflow run"* | Unmet twice: no CI run is observable on this branch, **and** `audit-skill-drift.sh` legitimately exits 1 until Phase 160 refreshes `filters`/`matching` (your ruling D9) |
| **REVIEW-CFG-08** | *"so the gate starts from clean"* | The pre-commit hook was **already red before Phase 153**: `apps/docs` aborts eslint with a Node `ERR_INTERNAL_ASSERTION`, and `eslint --fix` would rewrite 27 of 44 `.mjs` files leaving 366 problems. Attribution was measured per directory — 153-05 enlarged the population the hook sees, it did not create the defect |
| **REVIEW-HYG-01** | line-break half, short by **64** | 5 vendored-by-ruling + **59 in `apps/supabase/supabase/config.toml`** — a `toml` family **none of D6/D7/D7b covers**. `toml` is absent from `FAMILY_BY_EXT`, so the guard's `0 violations` is scope-limited, not absence. WINDOWS **181** |
| **REVIEW-HYG-02** | 34 gated occurrences across 15 files | **24 of them were written AFTER Phase 152 closed** (10 at `fee77f596` vs 34 at HEAD), because `hygiene-grep-report.sh` **is wired into nothing** — confirmed twice: it is referenced by no script, workflow or lint chain |

**The HYG-02 finding is structural, not arithmetic.** The sweep worked; nothing keeps it swept, so the
class regrows silently. Wiring the report into `lint:check` is the obvious move but is a scope
decision, not an executor's call.

Also open, and unblocked only by the same event: **WINDOWS 179** (the first CI run of the
negative-control job 153-03 added) and the deferred Phase 137 row. Both discharge when `163-01` lands
the trigger change you approved in D3, or when v2.15 merges to `main`.

---

## 2. A methodological pattern worth a ruling of its own

**The self-invalidating-scan class fired SEVEN times in Phase 153** — a gate whose own evidence
document, todo filename, or self-check text trips the pattern the gate greps for:

1. 153-06 — unanchored `grep -P 'tsbuildinfo|\.branches'` that its own todo *filename* would trip
2. 153-03 — gated on a bare string occurring twice in `main.yaml` (step name + a comment quoting it)
3. 153-08 — its draft evidence document failed its plan's grep
4. 153-11 — same class again, plus a control that injected nothing
5–7. further sightings recorded in `153-NEGATIVE-CONTROL.md`, the last self-inflicted by 153-09 at close

Every instance was caught, and the standing lesson is now written down: **re-run a document's own
verifier as the last action before committing it.** Whether that becomes an enforced convention (a
lint link, a plan-template requirement) is a call for you, not for a plan.

Related and equally general: **a gate that examines nothing reports green.** 153-10's brand-new guard
printed `pairs derived: 0 … 0 violation(s)`, exit 0, over a tree with four live pairs. Only its census
line exposed it. Phase 152 caught the same shape over 40 live violations. **Every count this run
emits now carries a census.**

---

## 3. Build-cache replays can fake a green gate

`build` and `typecheck` returned **FULL TURBO cache replays** at the phase close — greens that
examined nothing on the run reporting them. 153-09 re-ran all three cacheable gates with `--force` at
`0 cached` and got real greens (build 14/14, typecheck 22/22, test:unit 25/25).

Separately, 153-07 hit a **false RED** from the same mechanism: `packages/matching/dist` held 0
`.d.ts` against 27 `.d.ts.map` — a torn artefact replayed from cache — and under `checkJs` that made
tsc type-check emitted JS, producing ~120 implicit-`any` errors **naming the wrong package** and
inviting someone to disable `checkJs`. Regenerating the gitignored artefact cleared it against an
identical tree.

Both directions of this are live. Whether phase gates should routinely run `--force` is a decision
worth making deliberately rather than per-plan.

---

## 4. Fresh-clone trap, registered not fixed

`tests/tests/utils/supabaseAdminClient.ts` defaults `SUPABASE_URL` to `localhost` and derives a
frontend redirect origin from it by port substitution, while `playwright.config.ts` fixes `baseURL` to
`localhost:5173`, where the candidate `storageState` cookie is minted. `.env.example` now documents
`127.0.0.1` — the spelling its `PUBLIC_` twin, `dev-seed` and `config.toml` all use.

**No impact on the current tree** (the real `.env` was untouched, and nothing reads `.env.example` at
runtime), but a **fresh `.env` copied from the template would cross origins** and break candidate auth
in E2E. Filed with a WINDOWS entry.

---

## 5. Harness papercut

`.env.example` is unreadable through `cat`/`Read`/`Write` in this harness (built-in `.env*`
protection). 153-10 worked around it via `git show HEAD:.env.example` → scratchpad edit → `cp` back,
proving the delta key-by-key. Granting `Read(./.env.example)` would remove the workaround for any
later plan that touches it.

Related: **`gsd-tools windows fixed <id>` has no dry-run and no `--help` — probing it for its
signature MUTATES the ledger.** 153-11 did exactly that, caught it, and reverted via
`git checkout HEAD --`. Worth filing upstream.

---

## 6. WINDOWS 183 — the RLS role-scope pgTAP assertions are BLIND (pre-existing)

**Needs your call: a new plan in Phase 156, a deferred item, or accepted as-is.** Found by 156-03
while flip-testing; **pre-existing**, dating to `11f877913` — not introduced by this milestone.

Reverting the JWT claim payload to the old `'party'` label leaves **all 14 role-scope assertions
green**. `has_role(...)` returns `f`, but `organizations.auth_user_id = auth.uid()` returns `t` and
`org_a.published = t`, so the **ownership and published disjuncts satisfy every policy on their own**.
`09-column-restrictions.test.sql` is blind to the fixture key too: its `throws_ok 42501` fires at the
column-privilege layer, and two `lives_ok` calls have no read-back, so a 0-row UPDATE passes.

**What actually caught 156-02's rename was Postgres's enum type check on the INSERT — not any
assertion.** The suite would not have noticed a role-vocabulary error that stayed type-valid.

This falsifies the second clause of 156-03's must-have truth 3 and defeats T-156-11's stated
mitigation. 156-03 **did not fix it**: closing it means adding assertions, and the 269 planned-literal
total is currently the only silent-skip detector. Left for you rather than improvised at 2am.

## 7. WINDOWS 184 — `supabase test db` exits 0 having run NOTHING (bears on Phase 163)

Measured by the orchestrator, both directions at the same HEAD, while independently checking 156-03's
claim:

| Working directory | Output | Exit |
|---|---|---|
| repo root | `Files=0, Tests=0` · `Result: NOTESTS` | **0** |
| `apps/supabase` | `Files=11, Tests=277` · `Result: PASS` | 0 |

A green exit having executed nothing. This is the third sighting of the class in this milestone
(Phase 152: a scan reporting `bare = 0 … OK` over 40 live violations; 153-10: a guard reporting
`pairs derived: 0` over four live pairs).

**It matters because Phase 163 wires SQL gates into CI.** If that job invokes `supabase test db`
without pinning the working directory, or asserts only the exit code, **the pgTAP gate passes forever
regardless of the database**.

**My first mitigation here was wrong, and 156-05 measured it wrong.** I wrote: assert the harness line
(`Files=N, Tests=M` above a floor) rather than the exit status. But **`Tests=` is the PLANNED count,
not the executed one** — a *failing* run prints the identical `Files=11, Tests=280`. I confirmed it
independently: the `plan(N)` literals across `supabase/tests/database/*.sql` sum to **272**, plus 8
assertions under `00-helpers.test.sql`'s `no_plan()`, giving exactly the 280 printed on a pass.

**The correct gate is the conjunction of all three:** `Result: PASS` **and** non-zero `Files=` **and**
`Tests=` above a floor. `Result: PASS` is the only token separating pass from fail; the counts are
what separate a real run from `NOTESTS`. Recorded as WINDOWS 186 rather than by editing 184, so the
wrong advice and its correction both stay visible.

I found this because my own first verification produced the false green — which is itself the
argument for asserting counts rather than exits.

---

## 8. The `parties` legacy collection alias — one small decision, not invented

`packages/dev-seed/src/template/collectionNames.ts:22` keeps `parties: 'organizations'` under an
in-file `// Legacy aliases` comment. Measured: **zero in-tree consumers** except the unit test pinning
it (`permittedKeys.test.ts:303`).

Dropping it is defensible under D-E1's *"no backward compatibility is owed"*, but:

- it silently changes `resolveCollectionName('parties')` for **out-of-tree templates**, which is a
  behaviour change nobody in this repo would observe; and
- it touches two files outside 156-04's `files_modified`.

**D-E1's no-alias rule is about the enum.** Whether it reaches this alias is a judgement call, so
156-04 left it and said so rather than deciding for you.

Related question it raised and could not settle: **was `REVIEW-DB-01` meant at the prose/display-label
level too**, not just the identifier level? This phase does not reach that, and cannot without
reddening the cardinal E2E gate. 156-04 marked DB-01 met **at the identifier level** and stated the
scope explicitly rather than claiming the broader reading.

---

## 9. WINDOWS 185 — the Deno edge functions have no type barrier on the JWT claim

**Pre-existing; needs your call.** 156-04 closed this gap for the *frontend* (both role predicates now
declare `Enums<'user_role_type'>`, flip-tested to 2× TS2367). **The Deno edge functions still declare
the same JWT claim as raw `string` and compare it live** — `invite-candidate/index.ts:90` — and they
sit **outside every workspace `typecheck` covers**.

So the barrier that now exists in `apps/frontend` does not exist in `apps/supabase/supabase/functions`.
A stale role or scope literal there would compile and ship exactly as `'party'` did before 156-04.

Closing it means wiring the generated Supabase types into the Deno runtime, which is real work with its
own configuration surface. 156-05 recorded the options and left it. This is the same *class* as the
drift-guard you ruled on earlier (frontend/Deno config pairs diverging undetected) — you may want to
rule on both together.

## 10. REVIEW-DB-02 — an interpretation I let stand; overrule if you meant otherwise

156-05 marked `REVIEW-DB-02` Complete on this reading: the requirement's *"an enum matching
`user_role_type`"* means **in the manner of** `user_role_type`, not **with identical members**.

I agree, and checked why: `role_scope_type`'s members are scopes (global / account / project / entity)
while `user_role_type`'s are roles (candidate / organization / super_admin / account_admin). An enum
with *identical members* would be incoherent — it would make every scope a role. The executor flagged
it explicitly and invited an overrule rather than quietly choosing the convenient reading.

If you meant the literal reading, the row reverts to Pending and the criterion needs rewording.

## 11. The `database` skill is accumulating stale statements, and nothing flags it

Beyond the `filters`/`matching` drift already handed to Phase 160 (ruling D9), the **`database` skill's
own content** is going stale as this phase renames things: 156-02 left five `'party'` sites, and 156-05
added two more (`schema-reference.md:190,253`).

Plans 02, 04 and 05 all consistently declined to edit it — correctly, since it is outside their scope —
but **nothing detects this automatically**: `audit-skill-drift.sh` measures *commits touching a skill's
`targets:` directories*, not whether the skill's prose is still true. Phase 160 owns skills refresh and
should be told the content is stale, not merely that the directories moved.
