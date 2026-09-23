# Phase 158 — `/api/auth/login`: the absence measurement

**Measured:** 2026-09-01, at HEAD `3c958cccc`, working tree clean apart from an untracked
`.planning/milestone.lock`.
**Produced by:** `158-08`, Task 1.
**Consumed by:** `158-05` (the login collapse) — as a **verification** input, not a deletion input.
**Obligation:** `158-CARRIED-OBLIGATIONS.md` § **OB-2**.

---

## What this artifact is, and what it is not

`158-08-PLAN.md` was written to **count the callers of a live route**. Between the writing and the
running, the route was **deleted upstream**. So this is no longer a caller count. It is a
verification of an **absence**: that `apps/frontend/src/routes/api/auth/login/+server.ts` is gone,
that no caller has reappeared pointing at it, and that the searches which report that zero are
capable of returning non-zero.

That last clause is the point of the second half of this document. **A zero from a broken search
looks exactly like a zero from a clean tree**, and one of the four searches below WAS broken on
its first run (§ "The instrument failure, recorded"). The controls are not ceremony.

---

## Where the deletion happened

| Fact | Evidence |
|---|---|
| The route file was deleted | `git log --oneline --diff-filter=D -- 'apps/frontend/src/routes/api/auth/login/+server.ts'` → `8ecfc9002 fix(157.2-04): delete the dead /api/auth/login credential oracle` |
| The directory is gone, the sibling is not | `find apps/frontend/src/routes/api/auth -type f` → exactly one file, `apps/frontend/src/routes/api/auth/logout/+server.ts` |
| The route map's `login` key went with it | `8ecfc9002` diffstat: `apps/frontend/src/lib/api/base/universalApiRoutes.ts | 1 -` |
| The two references were comments, and were reworded rather than deleted | same diffstat: `routes/{admin,candidate}/login/+page.server.ts | 2 +-` each |

The commit message records the reason: the route's 400-vs-403 split was ruling **D10**'s credential
oracle. It also records the pre-deletion measurement taken at `d86ae1806`, where the file still
existed: two matches, both comment sentences; `LoginParams` / `LoginResult` occurring only inside
the route file.

**The deletion is upstream work. This phase neither performs it nor takes credit for it.**

---

## The four searches

Every command is reproducible verbatim from the repository root. All four are scoped to `apps`,
`packages` and `tests` — the code workspace — via `git grep`, which searches **tracked files only**
and therefore excludes `node_modules/`, `.svelte-kit/`, `build/`, `dist/`, `.turbo/` and the
end-to-end artifact directories without needing an exclusion list. Planning prose under `.planning/`
is out of scope by construction: this measurement is about callers, and a planning document that
names the path is not a caller. (§ "Why `git grep` and not `grep -r`" records the concrete reason
the plain-`grep` form was abandoned.)

| # | What it looks for | Command | Hits |
|--:|---|---|--:|
| S1 | The endpoint's path fragment | `git grep -nF "api/auth/login" -- apps packages tests` | **0** |
| S2a | The route map's login key, as read | `git grep -nF "UNIVERSAL_API_ROUTES.login" -- apps packages tests` | **0** |
| S2b | The route map's login key, as declared | ``git grep -nF 'login: `${API_ROOT}' -- apps packages tests`` | **0** |
| S3 | The two types the endpoint exported | `git grep -nw -e LoginParams -e LoginResult -- apps packages tests` | **0** |
| S4 | Any fetch of an `/api/auth` path in the frontend | ``git grep -nE "fetch\(.*['\"\`]/api/auth" -- apps/frontend/src`` | **0** |

Counts are **matching lines** (`git grep -n … | wc -l`), not per-file counts.

---

## The positive controls, taken in the same run

Each control points the **same search shape** at the sibling logout route, which still exists under
the same generic `/api` prefix and whose map key IS consumed by the writer.

| Control for | Command | Hits | What it proves |
|---|---|--:|---|
| S1 | `git grep -nF "api/auth/logout" -- apps packages tests` | **1** — `apps/frontend/eslint.config.mjs:54` | A literal-path search over this scope does find a live `/api/auth/*` path |
| S1 (widened) | `git grep -nF "auth/logout" -- apps packages tests` | **10** across 4 files | The same shape, unnarrowed, is not returning a thin accidental hit |
| S2a | `git grep -nF "UNIVERSAL_API_ROUTES.logout" -- apps packages tests` | **1** — `apps/frontend/src/lib/api/base/universalDataWriter.ts:115` | A map-key **read** search finds the surviving key |
| S2b | ``git grep -nF 'logout: `${API_ROOT}' -- apps packages tests`` | **1** — `apps/frontend/src/lib/api/base/universalApiRoutes.ts:12` | A map-key **declaration** search finds the surviving key |
| S3 | `git grep -nw DataApiActionResult -- apps packages tests` | **99** | The word-boundary type search finds a type that IS imported across the workspace |
| S4 | ``git grep -nE "fetch\(.*['\"\`]/api" -- apps/frontend/src tests`` | **2** — `routes/candidate/preregister/+page.svelte:76` and `:94` | The fetch-of-an-API-path regex family does match real inline fetches |

Every control is non-zero. **The instrument works, and the four zeros are facts about the tree.**

---

## The instrument failure, recorded

S3 was **first run as `git grep -nE "\bLoginParams\b|\bLoginResult\b"` and returned 0.** Its control,
`git grep -cE "\bDataApiActionResult\b"`, **also returned 0** — for a type with 99 occurrences in the
workspace. Git's ERE engine does not honour `\b`, so the pattern matched nothing anywhere and the
zero was an artefact of the regex, not of the tree.

Re-run with git's own word-boundary flag:

```
git grep -nw -e LoginParams -e LoginResult -- apps packages tests   →  0   (genuine)
git grep -nw DataApiActionResult -- apps packages tests             →  99  (control fires)
```

Recorded here rather than quietly fixed, because it is the concrete instance of the failure mode
this whole section exists to catch, and because `\b` in a `git grep -E` pattern will silently
return a false zero for **any** future measurement that uses it.

## Why `git grep` and not `grep -r`

The first pass used `grep -rn --exclude-dir=…` over `apps packages tests`. It matched
`apps/frontend/tsconfig.tsbuildinfo` — a 440 KB single-line build artifact that is not excluded by
any directory name — and the output was unreadable. `git grep` searches tracked files only, which
excludes every untracked build product by construction and makes the scope statable in one clause
instead of nine `--exclude-dir` flags.

---

## The asymmetry, stated for the record

`UNIVERSAL_API_ROUTES` at HEAD carries ten keys, and **all ten are read** — the map has no dead
entries left. The `login` key that pointed at the deleted route had zero readers and went with it,
which is what made the map total after the deletion. The **`logout` key IS consumed** —
`universalDataWriter.ts:115`, inside `UniversalDataWriter.logout()`, which posts to it as one half of
a `Promise.all` alongside `backendLogout()`.

This is why **"remove both or neither" was never an available argument.** The two routes sat under
the same prefix and looked symmetrical; they were not. The surviving key and its route
(`apps/frontend/src/routes/api/auth/logout/+server.ts`) **must be left alone** by this phase, and any
later reader tempted by the tidiness of an empty `api/auth/` directory should read this paragraph
first.

For completeness, the ten consumed keys and their call sites:

```
git grep -n "UNIVERSAL_API_ROUTES\.[a-zA-Z]*" -- apps/frontend/src | grep -v universalApiRoutes.ts
```

→ 13 lines: `token` ×2, `preregister`, `logout`, `jobsActive` ×2, `jobsPast` ×2, `jobStart`,
`jobProgress`, `jobAbort`, `jobAbortAll`, `cacheProxy`.

---

## The consequence for `REVIEW-RT-01`

The requirement reads:

> There is **one** login path, not three: the admin, candidate and generic-API login routes are
> collapsed onto shared logic, and the generic `/api` login route is **deleted rather than kept if
> the collapse leaves it unused**.

The conditional clause has an antecedent — *"if the collapse leaves it unused"* — and that antecedent
**was already true before any collapse happened**: the route had zero callers when `157.2-04`
measured it, and has zero now. **The clause fired upstream, at `8ecfc9002`, not in this phase.**

A verifier tracing `REVIEW-RT-01` against Phase 158's commits will find no deletion. That is not a
gap. It is discharged work, and this document is where the discharge is recorded.

**Two things this phase must NOT do**, stated because both are plausible mistakes:

1. Do not treat the absence as this phase's own deliverable. Phase 158 owns the *collapse* half of
   `REVIEW-RT-01` — one shared login helper behind the admin and candidate entry points — and that
   half is `158-05`'s, still open at this HEAD.
2. Do not re-create the route in order to remove it. The measurement above is the proof that there
   is nothing left to remove.

---

## Reproduction

Every command in this document, in order, from the repository root at `3c958cccc`. Expect five zeros
and six non-zero controls. If a control returns zero, the search is broken — fix it before recording
a pass.

---

# RE-VERIFICATION — 2026-09-01, by `158-05` Task 1

**Measured at HEAD `dbb22feba`** — 4 commits after the reading above, which was taken at `3c958cccc`.
Working tree clean apart from the untracked `.planning/milestone.lock`.

This section does not replace the reading above; it sits beneath it so a later verifier sees both.
`158-05` consumes the absence as a **verification input**, per `158-CARRIED-OBLIGATIONS.md` § **OB-2**.
Everything below was re-run from scratch rather than copied forward.

## The four searches, re-run

| # | Command | Hits |
|--:|---|--:|
| S1 | `git grep -nF "api/auth/login" -- apps packages tests` | **0** |
| S2a | `git grep -nF "UNIVERSAL_API_ROUTES.login" -- apps packages tests` | **0** |
| S2b | ``git grep -nF 'login: `${API_ROOT}' -- apps packages tests`` | **0** |
| S3 | `git grep -nw -e LoginParams -e LoginResult -- apps packages tests` | **0** |
| S4 | ``git grep -nE "fetch\(.*['\"\`]/api/auth" -- apps/frontend/src`` | **0** |

All four searches return zero at the later HEAD. Counts are matching lines.

## The positive controls, taken in the same run

| Control for | Command | Hits |
|---|---|--:|
| S1 | `git grep -nF "api/auth/logout" -- apps packages tests` | **1** |
| S1 (widened) | `git grep -nF "auth/logout" -- apps packages tests` | **10** |
| S2a | `git grep -nF "UNIVERSAL_API_ROUTES.logout" -- apps packages tests` | **1** |
| S2b | ``git grep -nF 'logout: `${API_ROOT}' -- apps packages tests`` | **1** |
| S3 | `git grep -nw DataApiActionResult -- apps packages tests` | **99** |
| S4 | ``git grep -nE "fetch\(.*['\"\`]/api" -- apps/frontend/src tests`` | **2** |

Every control fires. **The instrument works, so the five zeros above are facts about the tree and
not artefacts of a broken search.** Every control reproduces the count recorded at `3c958cccc`
exactly, which is the second, independent reason to believe the searches are stable.

Route-directory shape, re-confirmed: `find apps/frontend/src/routes/api/auth -type f` returns exactly
one file, `apps/frontend/src/routes/api/auth/logout/+server.ts`.

## The instrument failure this run caught — a stale build cache, not a caller

`158-05-PLAN.md`'s own `<verify>` block specifies the plain-`grep` form:

```
grep -rn "api/auth/login" apps packages tests \
  --exclude-dir=node_modules --exclude-dir=build --exclude-dir=.svelte-kit | wc -l
```

**Run verbatim it returns 1, not 0** — so the plan's mechanical check FAILS while the fact it is
checking is TRUE. The single hit is:

```
apps/frontend/tsconfig.tsbuildinfo
```

which is **untracked and gitignored** (`git check-ignore -v` → `.gitignore:29:*.tsbuildinfo`). It is a
stale TypeScript incremental build cache written before the deletion, and it still lists the deleted
route among the program's files:

```
…"./.svelte-kit/types/src/routes/api/auth/login/$types.d.ts"…
…"./src/routes/api/auth/login/+server.ts"…
```

A path recorded inside a compiler cache is not a caller. Adding one exclusion clears it:

```
grep -rn "api/auth/login" apps packages tests \
  --exclude-dir=node_modules --exclude-dir=build --exclude-dir=.svelte-kit \
  --exclude='*.tsbuildinfo' | wc -l      →  0
```

with its control, the same command over `api/auth/logout`, returning **1**
(`apps/frontend/eslint.config.mjs`).

This is the SAME failure mode § "Why `git grep` and not `grep -r`" recorded above — that section
noted `tsconfig.tsbuildinfo` made the output *unreadable*; here it makes the output *wrong*, in the
direction of a false positive. **`git grep` is the correct instrument for this measurement** because
it searches tracked files only and therefore cannot see a build product. Recorded rather than quietly
fixed, for the same reason the `\b` failure was.

## Two corrections to the original plan text

1. **"the two doc-comment mentions" is wrong; the measured count is ZERO.** `158-05-PLAN.md` was
   written on 2026-08-28, when the route still existed and its two references were the comment
   sentences at `candidate/login/+page.server.ts:4` and `admin/login/+page.server.ts:4` explaining why
   each form action signs in through `event.locals.supabase` instead. Those comments were **reworded
   upstream, not deleted** — both now say "rather than delegating the sign-in to a nested API route"
   and name no path at all. A search for the path fragment therefore finds nothing, which is why an
   absence check over this corpus is vacuous without the positive control, and why the control is
   mandatory here rather than advisory.

2. **The deletion clause of `REVIEW-RT-01` FIRED UPSTREAM.** The route was removed by
   `8ecfc9002` — `fix(157.2-04): delete the dead /api/auth/login credential oracle` — because its
   400-vs-403 split was ruling **D10**'s credential oracle, and because it already had zero callers.
   **`158-05` therefore performs no deletion of its own, and claims no credit for one.** What `158-05`
   owes `REVIEW-RT-01` is the other half: the *collapse* of the two surviving login entry points onto
   one shared helper. A verifier tracing the requirement against Phase 158's commits will find a
   collapse and no deletion; that is correct, and this paragraph is where the asymmetry is recorded.

---

# THE UPSTREAM ALLOWLIST — 2026-09-02, by `158-05` Task 4

**Read, not changed.** This section is an observation of Phase 157's work, recorded so the coupling
is written down rather than assumed. `apps/frontend/eslint.config.mjs` is **unmodified** by this plan;
`git diff --name-only` across the plan's commits does not list it.

## Does an adapter-leakage allowlist exist, and is the admin login file in it?

**Yes to both.** `ADAPTER_BOUNDARY_ALLOWLIST` is declared at `apps/frontend/eslint.config.mjs:27` and
applied as the `ignores` key of the boundary-guard config block at `:300`. It is split into two
annotated groups.

| Group | Entries | What they are |
|---|--:|---|
| 1 — the boundary's own inside, permanent by construction | 6 (`:30`, `:32`, `:35`–`:38`) | `src/lib/api/adapters/**`, `src/lib/supabase/**` and the four selector modules |
| 2 — grandfathered sites outside the boundary, each annotated with a disposition | 9 (`:42`–`:58`) | seven route files plus `src/hooks.server.ts` and `src/app.d.ts` |

**The two login files are entries 4 and 5 of group 2**, both annotated `158-HARD`:

```
:48  'src/routes/candidate/login/+page.server.ts',
:50  'src/routes/admin/login/+page.server.ts',
```

Counts are recorded as an **observation of what was read**, never as a success criterion of this plan.
This plan did not shrink the list, did not grow it, and wrote no check phrased in terms of its size.

## Are the two entries still LIVE after the collapse? — MEASURED: YES

Worth measuring rather than assuming, because the collapse removed a great deal from both files and it
would be easy to record that it removed the Supabase use as well. It did not.

The rewritten wrapper hands the helper THIS request's own auth surface —
`context: { auth: locals.supabase.auth, getSession: locals.safeGetSession }` — so exactly one
`.supabase` member access survives in each file. Copied verbatim to a non-allowlisted path under
`src/routes/` and linted there, the rewritten admin wrapper still FIRES:

```
src/routes/__allowlist_probe__/probe.ts
  17:24  error  A `.supabase` access reaches through the adapter boundary … no-restricted-syntax
✖ 1 problem (1 error, 0 warnings)
```

and at their real, allowlisted paths both files (and the two new `src/lib/auth/` modules) lint clean.
The probe file was deleted immediately; the working tree is clean of it.

**So striking either entry today would turn `yarn lint:check` red.** The shared helper is deliberately
vendor-neutral in its own contract — it names an `auth` port, not a client, and needs no allowlist
entry of its own — but the leak itself has been concentrated, not removed.

## The consequence for the filed blocking follow-up

`.planning/todos/pending/2026-08-28-admin-login-supabase-independence.md` lists two closing conditions.
Measured against the tree at this plan's HEAD:

| Half | Closing condition | Disposition |
|---|---|---|
| (b) SOURCE TEST | an adapter-specifics source test with an explicit allowed list | **DISCHARGED** upstream by `REVIEW-ADP-06`. Unchanged by this plan and not re-litigated. |
| (a) BACKEND INDEPENDENCE, condition 2 | the role check reads a shared roles module, with the `supabaseDataWriter` duplicate collapsed into it | **DISCHARGED by this plan.** `src/lib/auth/roles.ts` is the one declaration; both login gates and the writer's role derivation consume it. |
| (a) BACKEND INDEPENDENCE, condition 1 | the route no longer contains `locals.supabase.*`, verified by the guard firing after the allowlist entry is struck | **OPEN.** Measured firing above, i.e. the entry is still load-bearing. |

The entry's severity classification is **left untouched**: one of its two closing conditions is met and
the other is not, so the item is not discharged.

## The three upstream assumptions — which were observed on the tree

This plan assumed Phase 157 had shipped three things. All three were **observed present**, so no arm of
this plan ran on a missing dependency:

| Assumption | Observed | Evidence |
|---|---|---|
| The adapter-specifics source test | **present** | `ADAPTER_BOUNDARY_ALLOWLIST` plus the `no-restricted-imports` / `no-restricted-syntax` block in `apps/frontend/eslint.config.mjs`, with `src/lib/_guards/eslint-adapter-boundary-guard.test.ts` exercising it |
| Validated rather than cast adapter reads | **present** | `yarn lint:check` prints `Adapter-boundary cast guard (phase 157: REVIEW-ADP-01) — 26 file(s), 6177 line(s) scanned … 0 violation(s)` |
| The renamed, structured debug logger | **present** | `git grep -nw logDebugError -- apps packages tests` → **0**; the symbol on the tree is `log` from `@openvaa/app-shared` (`git grep -nw log -- apps/frontend/src` → 181, the positive control), with `configureLogger` for level control. The helper imports that name, not the retired one. |

Recorded for completeness: had none of the three landed, this plan's work would have been unaffected —
the login collapse and the single role declaration land either way. The dependency is on the *boundary
narrative*, not on this plan's mechanics.
