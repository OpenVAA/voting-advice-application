---
phase: 158-routing-auth-surface-harmonisation
plan: 03
subsystem: auth
tags: [cookies, oidc, pkce, guards, lint, vitest, sveltekit]

requires:
  - phase: 158-01
    provides: the `$lib/routes` relocation, so this plan's neighbouring-convention reads resolve
  - phase: 158-02
    provides: the negative-control ledger, opened with section B empty for this plan to fill
  - phase: 158-07
    provides: the OIDC callback redirect sweep, which edits a file in this plan's set
provides:
  - A single declaration site for every cookie name this application chooses
  - A collision-and-freeze unit spec that fails when two keys claim one wire name
  - `scripts/assert-cookie-names.mjs`, chained into `lint:check`, flagging any literal at any cookie operation site
  - Six filled cookie-name control rows in the phase negative-control ledger
affects: [bank authentication, OIDC/PKCE exchange, candidate preregistration, future cookie additions]

actuals:
  tokens: 8387
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Cookie names declared once in a frozen const map, read at every operation site"
    - "Guard exemption by SYNTACTIC shape (identifier-first-argument), never by allowlisted path"

key-files:
  created:
    - apps/frontend/src/lib/cookies/index.ts
    - apps/frontend/src/lib/cookies/cookies.test.ts
    - scripts/assert-cookie-names.mjs
  modified:
    - package.json
    - apps/frontend/src/routes/api/oidc/authorize/+server.ts
    - apps/frontend/src/routes/api/oidc/callback/+server.ts
    - apps/frontend/src/routes/api/oidc/token/+server.ts
    - apps/frontend/src/routes/candidate/preregister/+layout.server.ts
    - apps/frontend/src/routes/candidate/preregister/+page.svelte
    - apps/frontend/src/routes/api/candidate/preregister/+server.ts
    - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
    - .planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "The guard is chained into `lint:check` only, not into `test:e2e` — it is a source-shape guard with no runtime dependency, which is the plan's stated default"
  - "The Supabase SSR bridge is exempt by the SHAPE of its first argument, with no path comparison anywhere in the guard's executable body"
  - "`as const` plus the in-tree `deepFreeze` helper, so `Object.isFrozen` is assertable rather than aspirational"

patterns-established:
  - "Declaration-site guards flag only the name position, so library-supplied names stay silent without a file exclusion"
  - "Every guard ships with planted controls observed red and observed green before it is claimed to guard"

requirements-completed: [REVIEW-RT-02]

coverage:
  - id: D1
    description: "Every cookie name this application chooses is declared exactly once, in apps/frontend/src/lib/cookies/index.ts"
    requirement: REVIEW-RT-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/cookies/cookies.test.ts#declares exactly the four names the application writes"
        status: pass
      - kind: other
        ref: "git grep -nE \"cookies\\.(get|set|delete)\\(\" -- apps/frontend/src — 17 API sites, all reading COOKIE members"
        status: pass
    human_judgment: false
  - id: D2
    description: "Two keys sharing one wire name fail test:unit, and the failure names both colliding keys"
    requirement: REVIEW-RT-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/cookies/cookies.test.ts#gives every cookie a name no other cookie has"
        status: pass
      - kind: other
        ref: "planted fifth colliding key observed red during close-out; message named 'idToken and legacyIdToken'"
        status: pass
    human_judgment: false
  - id: D3
    description: "The map is frozen, asserted rather than assumed"
    requirement: REVIEW-RT-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/cookies/cookies.test.ts#is frozen, so a name cannot be added or changed at runtime"
        status: pass
    human_judgment: false
  - id: D4
    description: "A cookie-name literal at any operation site fails lint:check, in both the server and client write forms"
    requirement: REVIEW-RT-02
    verification:
      - kind: other
        ref: "yarn lint:check with a planted literal — exit 1, guard named the file, line and literal (observed during close-out)"
        status: pass
      - kind: other
        ref: "node scripts/assert-cookie-names.mjs on the clean tree — 770 files, 0 violations, exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The Supabase SSR bridge is exempt by shape, provably, and not by an allowlisted path"
    requirement: REVIEW-RT-02
    verification:
      - kind: other
        ref: "literal planted INSIDE apps/frontend/src/lib/supabase/server.ts — reported, exit 1, while the bridge's own identifier-first-argument call on the next line stayed silent (observed during close-out)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The OIDC/PKCE cookie round trip still works end to end after the eighteen-site substitution"
    requirement: REVIEW-RT-02
    verification:
      - kind: other
        ref: "static byte-identity proof over the rewrite diff (a07dcd0c8): every literal maps to a member carrying the identical wire string; the client-side attribute tail is unchanged"
        status: pass
    human_judgment: true
    rationale: "The plan's verification item 4 named the bank-auth E2E project as the behavioural proof, and it was NOT run — see Issues Encountered. The static proof is strong but is not a round trip."

duration: ~12 min execution + ~25 min close-out verification
completed: 2026-09-02
status: complete
---

# Phase 158 Plan 03: Cookie-Name Declaration Site Summary

**Four cookie names moved from eighteen scattered literals into one frozen `$lib/cookies` map, with a collision spec under `test:unit` and a shape-keyed source guard under `lint:check`, both observed failing on planted controls.**

> **This plan was interrupted by an API session rate limit after its final task commit
> (`c83c02024`), before it could write this SUMMARY or update tracking. It was closed out by a
> separate agent. What follows is therefore a VERIFICATION of what landed, re-derived against the
> tree, not a first-hand account of the work.** Every claim below was re-checked rather than
> taken from the commit messages; the guard's plant-and-restore was performed again from scratch
> by the close-out agent. Where a plan acceptance criterion does not hold as literally written, it
> is stated as such rather than reported as a pass.

## Performance

- **Duration:** ~12 min of committed execution (`01:07:59` → `01:19:33`, 2026-09-02), plus ~25 min of close-out verification
- **Tasks:** 3 of 3
- **Files modified:** 12 (3 created, 9 modified) — exactly the plan's `files_modified` list

## Accomplishments

- `apps/frontend/src/lib/cookies/index.ts` declares the four names the app chooses — `id_token`, `oidc_state`, `oidc_nonce`, `oidc_code_verifier` — as a `deepFreeze`d `as const` map, with a `CookieName` type derived from its values.
- All eighteen read/write sites across six files now read from that map. No literal survives at any cookie operation site anywhere in the frontend.
- `scripts/assert-cookie-names.mjs` (258 lines) scans 770 files and flags a literal in the name position of any `cookies.get/set/delete` call or any `document.cookie` assignment. It is the last member of the `yarn lint:check` chain.
- The ledger's section B carries six filled control rows plus a seventh for the collision mode, each with the five required evidence fields.

## Task Commits

1. **Task 1 (RED): failing spec for the declaration module** — `2167bb8b2` (test)
2. **Task 1 (GREEN): the const module** — `b313ab580` (feat)
3. **Task 2: rewrite all eighteen sites** — `a07dcd0c8` (refactor)
4. **Task 3: the guard and its lint wiring** — `d07857a26` (feat)
5. **Task 3: six observed controls in the ledger** — `c83c02024` (docs)

The RED/GREEN gate sequence is present and correctly ordered for the `tdd="true"` Task 1.

## Verification Performed During Close-Out

### The re-measured census — 18 sites across 6 files, matching the plan

Re-derived operation-keyed (never name-keyed, per the plan's explicit instruction), using `git grep` to avoid the stale-`tsbuildinfo` trap:

| File | Sites | Operation |
|---|---:|---|
| `routes/api/oidc/callback/+server.ts` | 9 | get/set/delete |
| `routes/api/oidc/authorize/+server.ts` | 2 | set |
| `routes/api/oidc/token/+server.ts` | 2 | set/delete |
| `routes/candidate/preregister/+layout.server.ts` | 2 | get/delete |
| `routes/api/candidate/preregister/+server.ts` | 2 | get/delete |
| `routes/candidate/preregister/+page.svelte` | 1 | `document.cookie` write |
| **Total** | **18** | **6 files** |

**This confirms the plan's census (18 across 6) and contradicts both conflicting prior counts** —
the context file's 17-across-5 and the requirement text's 18-across-5. Both omit the sixth file,
the `.svelte` client-side write, which is the app's only producer of the code-verifier cookie.

Two further sites exist and are correctly out of scope: the Supabase SSR bridge's
`event.cookies.set(name, …)` (identifier first argument, a name this app does not choose), and two
prose mentions of `cookies.set` inside comments, which the guard masks before scanning.

### The guard, planted against first-hand

The close-out agent planted and restored each control independently rather than trusting the
ledger. Baseline on the clean tree: `scanned 770 file(s) under apps/frontend/src; 0 violation(s).`
exit 0 — identical to the ledger's recorded baseline.

| Plant | Result | Restored |
|---|---|---|
| Multi-line `cookies.set` with the literal on its own line | **exit 1**, named `token/+server.ts:34`, the literal and the operation. The naive single-line regex returned **0** on the same file — the guard's tolerance of the multi-line form is measured, not assumed. | green, 0 violations |
| A real literal planted INSIDE `apps/frontend/src/lib/supabase/server.ts` | **exit 1**, exactly one violation — the plant. The bridge's own call **on the very next line stayed silent.** | green, 0 violations |
| A literal-opening `document.cookie` write beside the shipped interpolated one | **exit 1**, named `+page.svelte:110`. The shipped write at `:109` was **not** reported — one file, two browser writes, exactly one flagged. | green, 0 violations |
| A literal planted, then the FULL `yarn lint:check` chain run | **exit 1** — the chain propagates the guard's failure. This is the wiring proof: the guard is not merely present in `package.json`, it actually gates. | green, `lint:check` exit 0 |

The Supabase-bridge plant is the load-bearing one. Under a path-based exemption it would have
printed 0 and exited 0. It printed 1. Confirmed independently: `grep -c "supabase/server"` on the
guard is 1, and that single occurrence is in the docblock prose, not in the executable body.

The collision mode was also planted: a fifth key `legacyIdToken` duplicating `id_token` reddened
`cookies.test.ts` with `idToken and legacyIdToken both name the cookie 'id_token'`, naming both
keys as the requirement asks. The positive-control test stayed green in the same run, proving the
detector answered rather than merely failed.

**All plants removed. `git status --porcelain apps scripts package.json` is empty and
`git grep "vc-plant"` returns nothing.** No blanket reset was used; each plant was restored from a
copy taken before it, and `git clean` was never run.

### Guard determinism and safety

- Entries are sorted before recursion (`scripts/assert-cookie-names.mjs:155`); two consecutive runs produced byte-identical output.
- The guard imports only `readFileSync` and `readdirSync` from `node:fs` — there is no write API in the file at all, so the concurrency truth holds by construction.
- `grep -c 'process.exit('` is 0; the guard sets `process.exitCode`.
- `grep -cE "'(id_token|oidc_state|oidc_nonce|oidc_code_verifier)'"` on the guard is 0 — the detector is operation-keyed, never name-keyed.

### Gates — actual numbers

| Gate | Result |
|---|---|
| `yarn build` | 14/14 tasks successful |
| `yarn test:unit` | 25/25 tasks successful; frontend **76 files, 1396 tests, all passed** |
| `yarn typecheck --force` | 22/22 tasks, **0 cached** (forced fresh, to defeat the stale-cache trap); svelte-check **0 errors, 0 warnings** |
| `yarn lint:check` | **exit 0**; all eleven guards green, the cookie-name guard reporting `770 file(s); 0 violation(s)` as the chain's last member |

### Wire-name preservation

Every substitution in `a07dcd0c8` maps a literal to a member carrying the **identical** wire
string (`'id_token'` → `COOKIE.idToken` = `'id_token'`, and so on for all four). The client-side
write's attribute tail — `; path=/; max-age=600; secure; samesite=lax` — is byte-identical across
the diff, satisfying threat T-158-16. No cookie-name literal survives anywhere outside
`apps/frontend/src` either, so the guard's scan root is sufficient coverage.

## Decisions Made

- **The guard is wired into `lint:check` only, not `test:e2e`.** This is the plan's stated default for a source-shape guard with no runtime dependency, and it is what landed — `test:e2e` chains only the i18n and a11y-wiring guards. Recorded here because the plan explicitly asked for the decision to be recorded.
- The authorize-endpoint spec's two assertions were rewritten to `COOKIE.oidcState` / `COOKIE.oidcNonce` (the plan marked this a bonus). Done, at one line each.

## Deviations from Plan

None introduced during close-out. No implementation was redone and no duplicate commits were
created. The two items below are corrections to the plan's own text, not changes to the code.

### 1. Task 2's third acceptance criterion is wrong as literally written

The criterion reads: `grep -c "from '$lib/cookies'"` is 1 for each of the six site-bearing files.
Run verbatim on macOS, it returns **0 for all six** — on a correct tree. BSD `grep` treats a
mid-pattern `$` as an anchor in a basic regular expression, so `from '$lib/cookies'` cannot match
anything. Measured:

```
$ grep -c "from '$lib/cookies'" /tmp/ctl.txt     # the criterion verbatim
0
$ grep -cF "from '$lib/cookies'" /tmp/ctl.txt    # fixed-string
1
```

**The criterion's INTENT holds.** All six files import from `$lib/cookies` exactly once, confirmed
with `git grep -F`, and the seventh importer is the authorize-endpoint spec. This is a **fourth
instrument trap** for this phase's record, alongside the three already documented (`git grep`
ignoring `\b`; `grep -rn` matching the gitignored `tsbuildinfo`; `grep -c` on a prefix being a
substring match). **Future criteria in this phase should use `grep -F` for any pattern containing
a `$`.**

### 2. `must_haves` truth about the module's import graph is imprecise

The truth states the module's "import graph is empty apart from the test runner". It is not empty:
`index.ts` imports `deepFreeze` from `$lib/utils/freeze`. That import is required by the plan's own
`<action>`, and `freeze.ts` is a leaf with no imports of its own, so the truth's actual intent —
that the spec loads with no framework stubs — is satisfied. The wording overstates it.

## Issues Encountered

### The bank-auth E2E round trip was NOT run — outstanding

The plan's `<verification>` item 4 names `yarn test:e2e` bank-authentication as the behavioural
proof that the substitution preserved the wire names. **It was not run, neither by the original
executor (no record exists) nor during close-out.**

Why: both `bank-auth` and `bank-auth-journey` are opt-in behind `PLAYWRIGHT_BANK_AUTH` and are not
registered as projects without it. `bank-auth-journey` additionally joins the tail of the perm
serial chain by explicit operator decision, so running it in isolation pulls the whole chain, takes
full-suite time, and performs an authoritative `app_settings` REPLACE against the local database. A
dev server and Supabase were both live on this machine at close-out time; running a
DB-mutating full-chain suite against a working environment the close-out agent did not own was
judged the wrong trade.

**What stands in its place** is the static byte-identity proof above: every one of the eighteen
substitutions demonstrably maps to the same wire string, and the client-side attribute tail is
unchanged. That is strong evidence but it is not a round trip, and it is recorded here as a gap
rather than papered over. Note also that 158-07's E2E numbers (150/150 default, 130/130 with
bank-auth-journey) predate these five commits and therefore do not cover this rewrite.

### The code-review checklist walk is not evidenced

The plan's `<verification>` item 6 asks for `.agents/code-review-checklist.md` to be walked over
the diff. No record of that walk exists in the commits or the ledger, and the close-out agent did
not perform it. Recorded as unevidenced rather than assumed done.

## User Setup Required

None — no external service configuration required. The plan installed no packages; the guard uses
Node built-ins only.

## Next Phase Readiness

- REVIEW-RT-02 is satisfied for both failure modes the requirement names, each observed failing.
- The phase ledger's sign-off baseline of nine plants is met: section A carries 3, section B carries 6.
- **Two items should be carried forward:** the unrun bank-auth E2E round trip, and the unevidenced
  code-review-checklist walk. Neither blocks a later plan in this phase, but the E2E gap is the one
  that should close before the phase is signed off, since it is the only behavioural proof the OIDC
  cookie exchange still works.

---
*Phase: 158-routing-auth-surface-harmonisation*
*Completed: 2026-09-02 (closed out by a separate agent after an API session rate limit)*

## Self-Check: PASSED

All three created artifacts exist on disk and all five task commits are present in git history.
