# Phase 155 — Negative-Control Ledger: three criteria, one row each, every half measured by this phase

**Three rows, one apparatus, one machine.** Phase 155 has three criteria whose wording demands a
demonstration rather than an assertion — REVIEW-EDGE-01 (base64url decode), REVIEW-EDGE-03
(`{{ varname }}` substitution) and REVIEW-EDGE-05 (`aud`/`iss` fail closed). This file is the phase's
single evidence record for all three, replacing the inline-prose alternative that `155-CONTEXT.md`
`<open>` item 6 left undecided.

**The rule that governs this ledger, stated as a rule rather than left as an implication: a half may
be entered only when THIS PHASE ran it.** `155-RESEARCH.md` measured the pre-fix acceptance for
REVIEW-EDGE-05 and the `atob` `InvalidCharacterError` for REVIEW-EDGE-01 during its own research
session. **Those measurements are NOT admissible as an OLD half.** They appear only as corroboration
in the footnote below, outside the row table. Row 3's OLD half is the run `155-01` performed itself,
recorded with its own HEAD and its own log path.

**Rows 1 and 2 were opened carrying `pending` in every measured cell and no verdict**, because a run
that did not happen counts as a failure, not a pass (`CLAUDE.md` § E2E Hard Rule, generalised).
**They are now complete**, filled by `155-06` from the runs `155-02` and `155-04` performed
themselves. The word `pending` no longer appears anywhere in the row table — see § Completeness.

- **Phase:** 155 (edge-function-hardening-env-jwt-provider-identity)
- **Requirements:** REVIEW-EDGE-01, REVIEW-EDGE-03, REVIEW-EDGE-05 (`.planning/REQUIREMENTS.md:113,115,117`)
- **Opened by:** `155-01-PLAN.md` (wave 1), Task 3. Row 3 is created **and completed** here. Rows 1
  and 2 are created here with their fixture and owner columns filled and every measured cell reserved;
  `155-06` completes them.
- **Corpus:** exactly **3 rows**, one per exercised criterion, each owned by a named plan:
  | Row | Requirement | Owning plan(s) |
  |---|---|---|
  | 1 | REVIEW-EDGE-01 — base64url JWT segment decode | **Plans 02 and 04** (`invite-candidate`, `send-email` — one site per function) |
  | 2 | REVIEW-EDGE-03 — `send-email` placeholder regex accepts surrounding spaces | **Plan 04** |
  | 3 | REVIEW-EDGE-05 — `aud`/`iss` fail closed | **Plan 01 (this plan)** |
- **Protocol source:** `142.1-NEGATIVE-CONTROL-LEDGER.md`, whose preamble keys and nine-column row
  header this file reuses; the per-cell conventions are restated in `155-PATTERNS.md` § 7.
- **Baseline for OLD halves:** none inherited. Every filled cell carries a log path and the HEAD its
  own half was taken at. See § Measurement, never § Research.
- **HEAD at ledger creation:** `636b4e7a2` — branch `integration/ship-12-squash`. **OLD and NEW rows
  legitimately carry different HEADs**, because the fix lands between the two halves. Each row records
  the HEAD its own half was measured at.
- **Machine:** developer Mac, host Node + host vitest via `yarn workspace @openvaa/supabase test:unit`,
  runs issued from the repository root. Darwin 25.5.0 arm64 / Node v24.14.1. No container: this ledger
  records vitest exit codes and assertion messages only, never a visual baseline.
- **Resolved temp directory:** `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-155-01`
  — recorded as the resolved literal, not as `$TMPDIR`, because a log path that cannot be resolved
  later is not evidence.
- **Decisions discharged:** `155-CONTEXT.md` `<open>` item 6 (recording format — a ledger, not inline
  prose) and `155-RESEARCH.md` Open Questions item 3 (one row per criterion, recording
  fixture · pre-fix observation · post-fix observation · the test file that now holds it).
- **Precedent followed:** `.planning/phases/142.1-provider-getidtokenclaims-duplication-make-a-07-reach-produc/142.1-NEGATIVE-CONTROL-LEDGER.md`
  is this ledger's template; `137-NEGATIVE-CONTROL.md` is the prose-narrative ancestor of the chain.

---

## Row table

| # | Finding | Site | Fixture / injection source | OLD half (measured) | NEW-assertion outcome | File outcome | Collateral | Verdict |
|---|---------|------|----------------------------|---------------------|-----------------------|--------------|------------|---------|
| 1 | **REVIEW-EDGE-01 — JWT segment decoded as base64, not base64url.** `atob` rejects the `-`/`_` alphabet, and the decoded payload feeds an admin-authorisation predicate, so a decode failure is an authorisation failure | **PRE:** the `atob(token.split('.')[1])` expression in `invite-candidate/index.ts` and the byte-identical expression in `send-email/index.ts` — one site per function, located by CONTENT, never by line number · **POST:** `decodeJwtSegment(segment)` in `invite-candidate/jwtSegment.ts` (canonical, Plan 02) and its byte-identical copy in `send-email/jwtSegment.ts` (Plan 04, `cmp`-verified), each called from its own `index.ts` | A JWT payload segment whose base64url encoding genuinely contains `-` or `_`. **Not** a realistic Supabase access token: `155-RESEARCH.md` measured 0 hits in 2205 trials, so a realistic fixture makes this row a tautology. The test must carry a premise guard asserting the constructed segment really contains one of the two characters. Padding is **not** a usable axis: WHATWG forgiving-base64 accepts `len % 4 ∈ {0,2,3}`. **Realised fixture:** an admin `user_roles` payload plus a `"marker":"~~~"` field — the tildes encode to the 6-bit group base64url spells `-`. `invite-candidate` anchors on `super_admin`, `send-email` on `project_admin`, the one role only that function's three-role predicate honours | **FAIL (red) ✅ — and the red IS the evidence.** Measured **2026-08-29 at HEAD `4129694c2`** (pre-plan), tree carrying `jwtSegment.test.ts` and NOT `jwtSegment.ts`. `Test Files 1 failed \| 2 passed (3)`, `Tests 26 passed (26)` — the new suite failed to collect: `Failed to load url ./jwtSegment … Does the file exist?`. Log: `/private/tmp/gsd-155-02/red-before-module.log`. **The substantive half is the permanent in-test assertion** `expect(() => previousExpression(ADMIN_SEGMENT)).toThrow()` — the pre-fix expression observed FAILING on the same segment the fixed one parses. Independently confirmed outside vitest at HEAD `f448f680c` for the `send-email` fixture: `has -/_ : true chars=-` then `atob THREW: InvalidCharacterError Invalid character`, against the same payload without the marker giving `has -/_ : false` / `atob OK`. Log: `/private/tmp/gsd-155-04/fixture-premise.log` | **GREEN ✅.** Measured **2026-08-29 at HEAD `6b2a6ec21`** (`invite-candidate` half): `Test Files 4 passed (4)`, `Tests 37 passed (37)`; `jwtSegment.test.ts` contributes 6. Log: `/private/tmp/gsd-155-02/green-task2.log`. Measured **2026-08-29 at HEAD `d0740772d`** (`send-email` half): `Test Files 6 passed (6)`, `Tests 55 passed (55)`; `send-email/jwtSegment.test.ts` contributes 6. Log: `/private/tmp/gsd-155-04/green-task2.log`. The marked segment round-trips to the original payload with `user_roles` intact, and the non-ASCII claim `Ääkkönen` survives as UTF-8 rather than latin1 mojibake | **Two test files, one per function directory, as the duplication requires:** `apps/supabase/supabase/functions/invite-candidate/jwtSegment.test.ts` (6 tests, fixture `super_admin`) and `apps/supabase/supabase/functions/send-email/jwtSegment.test.ts` (6 tests, fixture `project_admin`). Neither imports across directory boundaries. Both `index.ts` files now call `decodeJwtSegment`; `grep -c 'atob' index.ts` → 0 in each. `send-email/jwtSegment.test.ts` additionally carries `UNMARKED_SEGMENT`, the control on the control | **Pre-registered:** the pre-existing suite must stay green and its count must not fall; `yarn test:unit` must stay at 25/25 turbo tasks; the non-disclosure bar must hold. **Observed:** 26 → 37 → 55 tests, monotonic, no pre-existing test lost; 25/25 unchanged at both halves. **One collateral finding, not zero:** verifying the plan's non-disclosure premise rather than assuming it revealed that `invite-candidate`'s outer catch returned `err.message` with no logging, so the new throw's variable name would have reached the caller. Repaired in the same plan (`6b2a6ec21`); the same defect was found in `send-email` by Plan 04 (`bcae09a05`) | **CONFIRMED — observed-to-fail then observed-to-pass, both halves and both function directories run by this phase** |
| 2 | **REVIEW-EDGE-03 — `send-email` placeholder regex rejects `{{ varname }}` with surrounding spaces** | **PRE:** the `replaceVars` arrow and its `/\{\{(\w+(?:\.\w+)*)\}\}/g` literal in `send-email/index.ts`, located by CONTENT · **POST:** `renderTemplate(text, vars)` in `send-email/templateVars.ts`, whose only pattern change is `\s*` on each side of an otherwise byte-identical capture; the local helper and its misleading `{{variable.path}}` comment are deleted from `index.ts` | A template string containing `{{ varname }}` with at least one surrounding space, rendered against a `vars` map that holds `varname`. The dotted-key axis is **not** part of this row: `502-email-helpers.sql` emits keys that literally contain dots and the flat lookup is the live contract (D-D4a), so a dotted fixture would test a behaviour the phase deliberately does not change. **Realised fixture, enumerated from the producing SQL rather than from the plan's examples:** all five keys `resolve_email_variables` can emit — `candidate.first_name`, `candidate.last_name`, `organization.name`, `nomination.constituency.name`, `nomination.election.name` — **two of which are three segments deep, and no example anywhere in the plan or the research is** | **FAIL (red) ✅ — and the red IS the evidence.** Measured **2026-08-29 at HEAD `f0fdde5fb`** (the TDD RED commit: test written, module absent). `Test Files 1 failed \| 5 passed (6)`, `Tests 43 passed (43)`, `Error: Cannot find module './templateVars'`. Log: `/private/tmp/gsd-155-04/red-task2.log`. **The substantive half is the observed non-match under the previous pattern**, measured at the same session against the real keys: `"Hei {{ name }}!"` → OLD `"Hei {{ name }}!"` (placeholder left in the output verbatim), and every one of the five real keys in spaced form → OLD `"{{ candidate.first_name }}"`, `"{{ nomination.election.name }}"` and so on, unsubstituted. Log: `/private/tmp/gsd-155-04/pattern-before-after-and-fliptest.log` | **GREEN ✅.** Measured **2026-08-29 at HEAD `d0740772d`**: `Test Files 6 passed (6)`, `Tests 55 passed (55)`; `templateVars.test.ts` contributes 12. Log: `/private/tmp/gsd-155-04/green-task2.log`. In the same before/after run, all four whitespace forms (`{{name}}`, `{{ name }}`, `{{  name  }}`, `{{\tname\t}}`) → NEW `"Hei Ada!"`, and all five real keys substitute in spaced form. **The dotted-key case proves the lookup stayed flat**: `{{ nomination.election.name }}` → `Parliamentary Election 2027` from a `vars` map with **no `nomination` property at all**, which is impossible under a traversal implementation | `apps/supabase/supabase/functions/send-email/templateVars.test.ts` — 12 tests, extended from the plan's nine-case matrix by the five-real-key sweep. `send-email/index.ts` imports `renderTemplate`; the local helper is gone. `templateVars.ts` scores 0 on `grep -cE 'Deno\.'`, so it is vitest-reachable and check 3 of the guard covers it | **Pre-registered:** the no-space form must not change meaning; an unknown key must still pass through; the dotted-key flat lookup must not become traversal. **Observed:** `{{name}}` → `"Hei Ada!"` under OLD and NEW alike, byte-identical capture; `it('leaves an unknown key in the output exactly as written, braces and all')` passes in both whitespace forms; the D-D4 flip-test against the rejected traversal option shows **all five real keys failing to resolve**, confirming traversal would have broken every placeholder in the product. **Zero unplanned collateral in this row** | **CONFIRMED — non-match then substitution, both halves run by this phase, on the real key set rather than the plan's examples** |
| 3 | **REVIEW-EDGE-05 — `aud` and `iss` fail OPEN when the env vars are unset.** `verifyJwt` built `verifyOptions` conditionally, so with both variables unset it passed `{}`. jose pushes a presence check when an option is `!== undefined` but compares the VALUE only under a truthiness test, so an omitted option buys no binding at all and the verifier accepts any token signed by a key in the configured JWK set | **PRE:** the `verifyOptions` object and its two `if` branches in `apps/supabase/supabase/functions/identity-callback/index.ts`, inside `verifyJwt`, located by CONTENT · **POST:** the single `requireVerifyClaimBinding(...)` call on the path to `jose.jwtVerify` in the same function, plus the new sibling module `identity-callback/verifyConfig.ts`. **Line drift note:** `155-CONTEXT.md` fact 27 places `DEFAULT_SEED_PROJECT_ID` at `:31`; measured this session it is at `:30`. Every pre-Phase-152 line number in this phase's documents is treated as stale | An RS256 token minted locally with `iss: 'https://evil-idp.example'` and `aud: 'some-other-clients-id'`, signed by a generated key pair and verified against that pair's public half — no network. Premise guard in the test decodes the minted token and asserts `iss`/`aud` genuinely differ from the expected values before asserting rejection. Held permanently in `identity-callback/verifyConfig.test.ts` | **FAIL (red) ✅ — and the red IS the evidence.** Measured **2026-08-29 at HEAD `8ebc3ebe4`**, working tree carrying `verifyConfig.test.ts` and NOT `verifyConfig.ts`. `Test Files 1 failed \| 1 passed (2)`, `Tests 20 passed (20)` — the new suite failed to collect at all: `Error: Cannot find module './verifyConfig'`. Log: `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-155-01/red-before-module.log`. The substantive half of the OLD observation is the permanent assertion `await expect(jose.jwtVerify(jwt, publicKey, {})).resolves.toBeDefined()` — the wrong-party token **ACCEPTED** under the exact options object the pre-fix code built. That assertion runs on every subsequent green run, so the acceptance is a standing record rather than a one-off | **GREEN ✅.** Measured **2026-08-29 at HEAD `636b4e7a2`** with a clean tree for every file this plan touches. `Test Files 2 passed (2)`, `Tests 26 passed (26)`; `verifyConfig.test.ts` contributes 6. The wrong-party token is REJECTED under the guard output with `code: 'ERR_JWT_CLAIM_VALIDATION_FAILED'`. Log: `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-155-01/new-half-at-committed-head.log` | `identity-callback/index.ts` binds both claims unconditionally; `verifyOptions` and both `if` branches are gone (`grep -c 'verifyOptions'` → 0); the comment that argued FOR the fail-open is deleted (`grep -c 'keeps its current behaviour'` → 0); the file-head env docstring no longer reads `checked when set` (→ 0). New sibling `verifyConfig.ts` holds `VerifyClaimBinding` + `requireVerifyClaimBinding` and keeps the no-Deno-imports contract (0 `Deno.`/`deno.land`/`esm.sh` references on any code line) | **Pre-registered before the run:** the 20 pre-existing `claimConfig.test.ts` tests must stay green and their count must not change; `yarn test:unit` must stay at 25/25 turbo tasks; the non-disclosure bar must hold (no configured value or variable name in any HTTP response body). **Observed after:** 20/20 unchanged, 25/25 unchanged, catch arms still return the fixed strings `Token verification failed` / `Token decryption failed`. **Zero collateral.** | **CONFIRMED — accept-then-reject demonstrated, both halves run by this phase** |

---

## Flip-tests (the controls on the controls)

A negative control that cannot fail is not a control. Both directions of row 3 were flipped and both
went red. Log: `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-155-01/flip-tests.log`.

| Flip | What was changed | Expected | Observed |
|---|---|---|---|
| A | `requireVerifyClaimBinding` reverted to the pre-fix shape (returns no bindings) | the layer-2 rejection assertion must FAIL | `Tests 2 failed \| 24 passed (26)` — the rejection assertion failed, and so did the empty-string case. The NEW half is load-bearing |
| B | fixture re-minted with the CORRECT `aud`/`iss` | the in-test premise guard must FIRE | `Tests 1 failed \| 25 passed (26)` — `expected 'https://good-idp.example' not to be 'https://good-idp.example'`. The demonstration cannot silently degrade into a tautology |

---

## Reported unsatisfiable criterion (155-01 Task 1, acceptance criterion 7)

The plan required `grep -cE "https://deno.land|https://esm.sh|Deno\." verifyConfig.ts` to be **0**.
**That criterion is unsatisfiable in conjunction with the plan's own action**, which mandates
reproducing `claimConfig.ts`'s docstring — a docstring that *names* `Deno.env`, `Deno.serve` and
`deno.land` in order to declare their absence. Measured: the analog the plan names, `claimConfig.ts`, scores **1**
on the identical grep. The criterion examines the sentence that states the contract, not a violation
of it.

Not engineered around. The property was proven by **two named alternate routes**, and both were
flip-tested by injecting a real `Deno.env.get('FLIP_TEST_CANARY')` into the module body.
Log: `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-155-01/ac7-alternate-route-fliptest.log`.

| Route | Definition | Baseline | After the injection |
|---|---|---|---|
| **A — static, code lines only** | `grep -vE '^[[:space:]]*(\*\|//\|/\*)' verifyConfig.ts \| grep -cE 'https://deno.land\|https://esm.sh\|Deno\.'` | **0** | **1** ✅ |
| **B — dynamic, the property itself** | the module is imported by vitest under plain Node, where no `Deno` global exists | 26/26 pass | `ReferenceError: Deno is not defined`, 2 failures ✅ |

Route B is the stronger of the two: it tests the actual property the contract protects (vitest
reachability) rather than a spelling. **Recommended correction for Plans 02, 03 and 04**, whose
`envConfig.ts` / `jwtSegment.ts` / `templateVars.ts` modules will all carry the same docstring and hit
the same wall: adopt route A's comment-excluding form, or drop the static criterion and rely on
route B.

---

## Footnote — research-session corroboration, deliberately outside the table

`155-RESEARCH.md` § Criterion 5 records a research-session reproduction of the same defect
(`A (env unset, current code — verifyOptions = {}): ACCEPTED` / `B (fail-closed): REJECTED`,
`ERR_JWT_CLAIM_VALIDATION_FAILED | unexpected "iss" claim value`). It agrees with row 3's halves in
every particular. It is recorded **here, in a footnote, and not in the table**, because this ledger
admits only halves the phase itself ran. It corroborates; it does not substitute.

A second corroboration, also outside the table because it is an execution proof rather than a
negative-control pair: Task 2's `/tmp/eflow10.env` recipe was run verbatim and the resulting env
exercised against a real `buildTestIdToken` token through the full JWE-decrypt → JWT-verify path.
The corrected 7-line recipe gives **ACCEPTED**; the previous 4-line recipe gives **REJECTED
[ERR_ISSUER_UNCONFIGURED]**. Log:
`/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-155-01/eflow10-recipe-proof.log`.

---

## Completeness — the ledger's assertion about itself

Written by `155-06` Task 2 on **2026-08-29** at HEAD `17ef44ce4`, branch `integration/ship-12-squash`.

**Three rows, no cell reading `pending`.**

```bash
$ awk '/^## Row table/,/^---$/' 155-NEGATIVE-CONTROL-LEDGER.md | grep -c 'pending'
0
```

| Row | Requirement | OLD half at | NEW half at | Verdict |
|---|---|---|---|---|
| 1 | REVIEW-EDGE-01 | `4129694c2` (`invite-candidate`), `f448f680c` (`send-email` fixture premise) | `6b2a6ec21` (`invite-candidate`), `d0740772d` (`send-email`) | **CONFIRMED** |
| 2 | REVIEW-EDGE-03 | `f0fdde5fb` | `d0740772d` | **CONFIRMED** |
| 3 | REVIEW-EDGE-05 | `8ebc3ebe4` | `636b4e7a2` | **CONFIRMED** |

**Every absolute log path named in this file resolves on this machine**, verified by testing each
path's existence on 2026-08-29 rather than by trusting the citing summary:

| Path | Exists |
|---|---|
| `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-155-01/red-before-module.log` | yes |
| `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-155-01/new-half-at-committed-head.log` | yes |
| `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-155-01/flip-tests.log` | yes |
| `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-155-01/ac7-alternate-route-fliptest.log` | yes |
| `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-155-01/eflow10-recipe-proof.log` | yes |
| `/private/tmp/gsd-155-02/red-before-module.log` | yes |
| `/private/tmp/gsd-155-02/green-task2.log` | yes |
| `/private/tmp/gsd-155-04/fixture-premise.log` | yes |
| `/private/tmp/gsd-155-04/red-task2.log` | yes |
| `/private/tmp/gsd-155-04/green-task2.log` | yes |
| `/private/tmp/gsd-155-04/pattern-before-after-and-fliptest.log` | yes |

No path needed re-producing. **These directories are ephemeral** — `/private/tmp` and `$TMPDIR` are
cleared by the operating system — so the resolution above is a statement about **2026-08-29**, not a
permanent guarantee. What survives the directories is the **permanent in-suite assertion** each row
names: every OLD half here is held as a live `expect(...)` in a committed test file, so the
demonstration re-runs on every `yarn test:unit` rather than living only in a log. That is the
property the logs are evidence *of*, and it is the reason a swept temp directory does not invalidate
the ledger.

### What each row would have looked like had the fix not worked

Stated in one line per row, because a verdict that could only ever have read CONFIRMED is not a
verdict:

- **Row 1** — the OLD half would have shown `previousExpression(ADMIN_SEGMENT)` **not throwing**, and
  the row would have collapsed into a tautology: `atob` handling the fixture means the fixture never
  exercised the base64url alphabet. The in-test premise guard
  `expect(/[-_]/.test(ADMIN_SEGMENT)).toBe(true)` is what makes that collapse *loud* rather than
  silent, and `UNMARKED_SEGMENT` is the control proving the marker is what carries the character.
  Verdict would have read **INADMISSIBLE — fixture does not distinguish the implementations**.
- **Row 2** — the OLD half would have shown `"Hei {{ name }}!"` already substituting under the
  previous pattern, meaning the reported defect did not exist. Verdict would have read
  **WITHDRAWN — the finding is false on this tree**, which is a real outcome this phase reached
  twice elsewhere (REVIEW-EDGE-04 retired on evidence; CR-02's error oracle found already fixed).
- **Row 3** — the NEW half would have shown the wrong-party token still **resolving** under the
  guard's output, meaning `requireVerifyClaimBinding` returned something jose does not bind on.
  Verdict would have read **FAILED — the fix does not close the finding**. Flip A drove exactly that
  state deliberately and observed `Tests 2 failed | 24 passed (26)`.

---

*Phase: 155-edge-function-hardening-env-jwt-provider-identity*
*Opened 2026-08-29 by `155-01-PLAN.md` Task 3 at HEAD `636b4e7a2`. Completed 2026-08-29 by `155-06-PLAN.md` Task 2 at HEAD `17ef44ce4`.*
