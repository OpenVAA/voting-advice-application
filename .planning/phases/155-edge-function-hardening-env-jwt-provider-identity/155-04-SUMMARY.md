---
phase: 155-edge-function-hardening-env-jwt-provider-identity
plan: 04
subsystem: supabase-edge-functions
tags: [security, jwt, base64url, env-defaults, template-rendering, non-disclosure, edge-functions, smtp]
status: complete

requires:
  - decodeJwtSegment and requireEnv, the canonical modules 155-02 published in invite-candidate
  - the URL-import-free sibling-module pattern established by 155-01
  - apps/supabase/vitest.config.ts collecting supabase/functions/**/*.test.ts
provides:
  - the second jwtSegment.ts copy with its own test, so neither copy can rot silently
  - renderTemplate — whitespace-tolerant placeholder substitution with the flat-key contract stated where the pattern lives
  - the third envConfig.ts copy, byte-identical to the canonical one Plan 05 will guard
  - send-email's outer catch brought to the identity-callback non-disclosure convention
  - the last three of criterion 2's seven environment-default sites, closing the class across all three functions
affects:
  - apps/supabase/supabase/functions/send-email (admin decode, template rendering, SMTP_HOST/SMTP_PORT/SMTP_FROM now mandatory, error body now opaque)

tech-stack:
  added: []
  patterns:
    - env read at the boundary, validation in a pure sibling module (inherited from 155-01/155-02)
    - a negative control guarded by its own fixture premise AND by a control-on-the-control
    - test fixtures enumerated from the producing SQL rather than from the plan's examples
    - characterisation tests labelled in-file as pinning behaviour rather than deciding it

key-files:
  created:
    - apps/supabase/supabase/functions/send-email/jwtSegment.ts
    - apps/supabase/supabase/functions/send-email/jwtSegment.test.ts
    - apps/supabase/supabase/functions/send-email/templateVars.ts
    - apps/supabase/supabase/functions/send-email/templateVars.test.ts
    - apps/supabase/supabase/functions/send-email/envConfig.ts
  modified:
    - apps/supabase/supabase/functions/send-email/index.ts

key-decisions:
  - send-email's outer catch was changed to log and return a fixed opaque response, because the plan's premise and threat row T-155-23 were false for this file and the new throws would otherwise have published environment-variable names to callers.
  - The placeholder test fixture was enumerated from 502-email-helpers.sql rather than from the plan's examples, which surfaced two THREE-segment production keys that no example in the plan or the research covers.
  - The D-D4 flat-lookup claim is proven by a negative control that resolves a dotted key from a map with no nested object, flip-tested against a traversal implementation under which all five real keys fail.
  - The present-but-empty variable case (the plan's flagged assumption) was pinned by a characterisation test that says in-file it documents rather than decides, so the design question stays open.
  - Task 3 AC1 was reported unsatisfiable and proven by the comment-excluding route A rather than satisfied by editing the canonical docstring that AC6 requires be byte-identical.
  - Task 1 AC2 (grep -c atob is 0) was treated as satisfiable and met by rewording the call-site comment, applying 155-02's distinction between a forbidden token that is load-bearing and one that is not.

requirements-completed: []

coverage:
  - deliverable: "send-email decodes its admin-authorisation JWT segment as base64url, with a negative control on a fixture that genuinely carries a base64url-only character"
    human_judgment: false
    verification:
      - kind: test
        ref: "apps/supabase/supabase/functions/send-email/jwtSegment.test.ts#decodes a segment that the previous base64 expression rejects"
        status: pass
      - kind: command
        ref: "fixture premise measured before use: the ~~~ marker payload's segment contains '-' and atob() on it THREW DOMException InvalidCharacterError; the SAME payload without the marker contains neither '-' nor '_' and atob parses it. Log /private/tmp/gsd-155-04/fixture-premise.log"
        status: pass
      - kind: test
        ref: "apps/supabase/supabase/functions/send-email/jwtSegment.test.ts#would have been a tautology without the marker, which is why the premise is asserted"
        status: pass
  - deliverable: "The decode still authorises: send-email's three-role isAdmin predicate is satisfied by the decoded claim"
    human_judgment: false
    verification:
      - kind: test
        ref: "apps/supabase/supabase/functions/send-email/jwtSegment.test.ts#preserves the three-role authorisation claim the decode feeds"
        status: pass
  - deliverable: "A placeholder written with surrounding spaces renders, and the pattern still resolves every key the product actually produces"
    human_judgment: false
    verification:
      - kind: test
        ref: "apps/supabase/supabase/functions/send-email/templateVars.test.ts#resolves every key resolve_email_variables can actually emit, including the three-segment ones"
        status: pass
      - kind: command
        ref: "measured before/after over all five real keys: the OLD pattern leaves every spaced form unrendered ({{ nomination.constituency.name }} passes through); the NEW one renders all five. Log /private/tmp/gsd-155-04/pattern-before-after-and-fliptest.log"
        status: pass
      - kind: test
        ref: "apps/supabase/supabase/functions/send-email/templateVars.test.ts#substitutes a placeholder padded with tab characters"
        status: pass
  - deliverable: "The dotted key resolves through a flat lookup, and the claim is proven rather than asserted"
    human_judgment: false
    verification:
      - kind: test
        ref: "apps/supabase/supabase/functions/send-email/templateVars.test.ts#proves the flat lookup is flat, by resolving a dotted key from a map with no nested object at all"
        status: pass
      - kind: command
        ref: "flip-tested against the rejected option (b): under a traversal implementation all five real keys fail to resolve, so the control can fail. Same log."
        status: pass
  - deliverable: "The misleading placeholder comment is gone and the flat-key contract is written where the pattern lives"
    human_judgment: false
    verification:
      - kind: command
        ref: "grep -c 'variable.path' index.ts is 0; grep -c 'replace(/' index.ts is 0; grep -c '502-email-helpers.sql' templateVars.ts is 1"
        status: pass
  - deliverable: "An unset SMTP_HOST, SMTP_PORT or SMTP_FROM each throws naming the variable, while the caller-supplied sender still short-circuits and the optional credentials stay optional"
    human_judgment: false
    verification:
      - kind: command
        ref: "offline before/after with each genuinely unset: OLD -> 'inbucket' / 2500 / 'noreply@openvaa.org' with no error; NEW -> ERR_ENV_UNCONFIGURED naming SMTP_HOST / SMTP_PORT / SMTP_FROM. Empty string throws too. A caller-supplied 'from' returns 'caller@example.org' with SMTP_FROM still unset. Log /private/tmp/gsd-155-04/smtp-before-after.log"
        status: pass
      - kind: command
        ref: "grep -c \"Deno.env.get('SMTP_USER')\" and the same for SMTP_PASS are each still 1, unwrapped; grep -c rejectUnauthorized is still 1"
        status: pass
  - deliverable: "No unconfigured-environment message can reach an HTTP caller from any of the three new throws"
    human_judgment: false
    verification:
      - kind: command
        ref: "try/catch nesting mapped by grep -nE '^\\s*(try \\{|\\} catch)': outer 40 -> 286, inner 45 -> 47 (req.json) and 233 -> 248 (sendMail). All three requireEnv sites (206, 207, 227) sit between the inner arms, so they surface only at the outer arm. That arm was MEASURED echoing err.message with no logging, and was repaired to console.error the real error and return a fixed literal with nothing interpolated."
        status: pass
  - deliverable: "All seven of criterion 2's environment-default sites are closed across the three functions"
    human_judgment: false
    verification:
      - kind: command
        ref: "route A (the env-default grep over non-comment lines) scores 0 on all seven index.ts/envConfig.ts files across identity-callback, invite-candidate and send-email; flip-tested 0 -> 1 -> 0 by injecting a real code-line default and reverting"
        status: pass
  - deliverable: "The two duplicated module families are byte-identical across their directories"
    human_judgment: false
    verification:
      - kind: command
        ref: "cmp send-email/jwtSegment.ts invite-candidate/jwtSegment.ts, cmp send-email/envConfig.ts invite-candidate/envConfig.ts, cmp identity-callback/envConfig.ts invite-candidate/envConfig.ts -- all exit 0"
        status: pass
  - deliverable: "The deployed Deno function behaves as the Node tests show"
    human_judgment: true
    rationale: "All three new modules are pure and free of any Deno global, so their vitest results transfer by construction, and the three call-site expressions were reproduced verbatim offline. What is NOT proven is a served run: deno is not installed in this tree, and nothing in the product or the suite invokes this function (measured four ways). A local `supabase functions serve send-email` with the three variables supplied, exercising an admin bulk send, would close it. Registered as window 167."

metrics:
  duration: 12 min
  completed: 2026-08-29
  tasks: 3
  files: 6
  commits: 4

actuals:
  tokens: 7943
  tasks: 3
  commits: 4
---

# Phase 155 Plan 04: send-email base64url Decode, Whitespace-Tolerant Rendering and Three Mandatory SMTP Variables Summary

`send-email` now decodes its admin-authorisation segment as base64url, renders `{{ key }}` with
surrounding spaces without inventing path resolution, and refuses to run with an unset `SMTP_HOST`,
`SMTP_PORT` or `SMTP_FROM` — and, as in `invite-candidate` before it, the plan's non-disclosure
premise turned out to be false for this file, so the change the plan asked for would have published
environment-variable names to callers until the catch arm was repaired alongside it.

## Accomplishments

- **`jwtSegment.ts`** — copied byte-for-byte from `invite-candidate` with `cp`, `cmp`-verified, no
  import reaching into the sibling directory.
- **`jwtSegment.test.ts`** — 6 tests, this directory's own, anchored on **`project_admin`**: the one
  role `send-email`'s three-role predicate honours and `invite-candidate`'s two-role predicate does
  not, so the fixture exercises this function's authorisation shape rather than the sibling's.
- **A control on the control.** Beyond the premise guard 155-02 established, this file adds
  `UNMARKED_SEGMENT` — the same roles array with the tilde marker removed — and asserts it contains
  **no** `-` or `_` and that the old expression parses it happily. That turns "the marker is what
  makes this test load-bearing" from a comment into an assertion.
- **`templateVars.ts`** — `renderTemplate(text, vars)`; the only pattern change is `\s*` on each side
  of the capture, which is byte-identical to the previous one. The contract note sits with the
  pattern and names `502-email-helpers.sql` as the producer.
- **`templateVars.test.ts`** — 12 tests, fixture **enumerated from the tree** (see below).
- **`envConfig.ts`** — the third copy, `cmp`-verified against the canonical one.
- **`index.ts`** — five hunks: three imports, the decode, the render loop (local helper and the
  misleading `{{variable.path}}` comment both deleted), the three SMTP sites, and the catch arm.

## Task / Commit Ledger

| Task | Gate | Commit | Files |
|---|---|---|---|
| 1 | — | `a6fe54d7d` | `jwtSegment.ts`, `jwtSegment.test.ts`, `index.ts` |
| 2 | RED | `f0fdde5fb` | `templateVars.test.ts` |
| 2 | GREEN | `d0740772d` | `templateVars.ts`, `index.ts` |
| 3 | — | `bcae09a05` | `envConfig.ts`, `index.ts` |

TDD gate compliance for Task 2 (`tdd="true"`): the `test(...)` commit precedes the `feat(...)`
commit, and RED was **observed** — `Cannot find module './templateVars'`, `1 failed | 5 passed`,
logged at `/private/tmp/gsd-155-04/red-task2.log`. No REFACTOR gate was needed.

## The placeholder pattern, tested against real values enumerated from the tree

This was the instruction most likely to be discharged badly, because the plan supplies examples and
the examples are not the contract. The keys were read off `resolve_email_variables` in
`apps/supabase/supabase/schema/502-email-helpers.sql` — **the complete set it can emit, all five**:

| Real key | Segments | In the plan's examples? |
|---|---|---|
| `candidate.first_name` | 2 | yes |
| `candidate.last_name` | 2 | no |
| `organization.name` | 2 | no |
| `nomination.constituency.name` | **3** | **no** |
| `nomination.election.name` | **3** | **no** |

**Two of the five real keys are three segments deep, and no example anywhere in the plan or the
research is.** A pattern written against the two-segment examples alone could have stopped rendering
the nomination keys with nothing in this phase to catch it. Both whitespace forms of all five are
asserted, and the before/after was measured rather than reasoned about:

```
candidate.first_name           OLD= "{{ candidate.first_name }}"          NEW= "Ada"
candidate.last_name            OLD= "{{ candidate.last_name }}"           NEW= "Lovelace"
organization.name              OLD= "{{ organization.name }}"             NEW= "Analytical Engine Party"
nomination.constituency.name   OLD= "{{ nomination.constituency.name }}"  NEW= "Helsinki"
nomination.election.name       OLD= "{{ nomination.election.name }}"      NEW= "Parliamentary Election 2027"
```

Also measured, in the same run: no template file exists anywhere in the tree. `templates` is
**entirely caller-supplied** through the request body (`SendEmailRequest.templates`), so the SQL
producer is the only contract there is to respect — which is exactly why D-D4 turns on it.

**The D-D4 control can fail.** `REAL_VARS` has no `nomination` property at all, so the assertion that
`{{nomination.election.name}}` renders `Parliamentary Election 2027` is impossible under a traversal
implementation. Flip-tested against the rejected option (b): **all five real keys fail to resolve**
under traversal, confirming D-D4's warning that option (b) would have broken every placeholder in
the product.

## The catch arm — read, not assumed, and it failed the premise

The check 155-02 forced and 155-03 confirmed was worth doing a third time. Every `try`/`catch` in
`send-email/index.ts`:

| Line | Construct | Body |
|---|---|---|
| 40 → **286** | outer `try` / `catch (err)` | the whole request |
| 45 → 47 | inner | `body = await req.json()` |
| 233 → 248 | inner | `transport.sendMail`, per recipient |

The three `requireEnv` calls sit at **206**, **207** and **227** — after the first inner arm closes
and before the second opens — so all three surface at the outer arm and nowhere else. That arm, at
the pre-fix HEAD, verbatim:

```ts
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
```

It did **neither** half of what the plan's Task 3 premise and threat row **T-155-23** assert ("the
existing catch returns a fixed opaque response"): it did not log, and it returned `err.message`.
Left alone, `Missing required environment variable: SMTP_HOST.` would have gone to the caller —
the plan's own invariant broken by the change the plan requested. Fixed under Rule 2.

**The pattern across the phase is worth stating plainly:** three functions checked, and the premise
held in only one. `invite-candidate` failed it (155-02), `identity-callback` passed it (155-03),
`send-email` failed it. It is a property of each file, not of the codebase, and must be measured
every time.

## The observed before/after, all three SMTP sites

Reproduced offline with the variables genuinely unset (`/private/tmp/gsd-155-04/smtp-before-after.log`):

```
OLD smtpHost    -> "inbucket"                 NEW -> THREW ERR_ENV_UNCONFIGURED : ... SMTP_HOST.
OLD smtpPort    -> 2500                       NEW -> THREW ERR_ENV_UNCONFIGURED : ... SMTP_PORT.
OLD senderAddr  -> "noreply@openvaa.org"      NEW -> THREW ERR_ENV_UNCONFIGURED : ... SMTP_FROM.
```

Three further cases were exercised in the same run rather than reasoned about: the **empty string**
throws as well; a **caller-supplied `from`** returns `"caller@example.org"` with `SMTP_FROM` still
unset, proving the request-body override still short-circuits ahead of the environment; and all
three configured correctly return their values.

**One honest deflation.** The plan asks for `parseInt`'s explicit radix "which the current call
omits". It was added, but measured rather than claimed: `parseInt('0587')` and `parseInt('0587', 10)`
both yield `587`, because ES5 removed the octal interpretation. The radix is correct hygiene and
removes a real ambiguity for a reader; it fixes **no** observable defect here, and the comment above
it says only what is true.

## Corrections to inherited claims (measured, not assumed)

1. **Every `index.ts` line citation in the plan is stale, as warned.** Measured: the decode is at
   `:111` (plan `:111` — correct, and the only one); the render loop at `:164-181` (plan `:167-186`);
   the SMTP sites at `:206`, `:207`, `:227` (plan `:210`, `:211`, `:234` — off by 3, 3 and **6**);
   the request-body shape at `:9-14` (plan `:9-14` — correct). Navigation was by symbol throughout.
2. **The execution brief's framing was right and worth acting on.** 155-03's comment-excluding grep
   printed exactly three code lines and all three were here — confirmed at baseline before any edit.
   Unlike 155-03, this function's "defaults" were genuinely live code, not prose.
3. **`.env.example` DOES document all three variables** at `:116-118`, added by 155-01, with the
   removed defaults now written down explicitly (`SMTP_HOST=inbucket`, `SMTP_PORT=2500`,
   `SMTP_FROM=noreply@openvaa.org`). My own first grep missed this — it used a `--include` pattern
   that skipped the dotfile — and the claim was corrected by re-measuring with `git show` rather
   than shipped. Recorded because the correction is the point.
4. **The comment-hygiene gate is live and this plan's comments pass it**: 1576 files scanned, up
   from 1571, so all five new files are covered; 0 violations.
5. **`send-email` still has no live caller** — re-measured, not inherited. See the E2E section.

## Unsatisfiable criterion — reported, flip-tested, registered

**Task 3 AC1** requires the comment-**inclusive** grep for `Deno.env.get(...) || fallback` to print
nothing across `functions/`. It scores 1 on four files — and **my own copy added the fourth**:

| File | Line | What the hit is |
|---|---|---|
| `invite-candidate/envConfig.ts` | 8 | the docstring declaring the defect class |
| `invite-candidate/envConfig.test.ts` | 4 | same |
| `identity-callback/envConfig.ts` | 8 | same |
| `send-email/envConfig.ts` | 8 | same, added by this plan's required byte-identical copy |

Applying 155-02's sharpened test: is what it forbids what the task requires? **Yes, here.** Task 3
AC6 and Plan 05's guard both require this copy to be byte-identical to the canonical file, so the
only route to a passing grep is editing 155-02's canonical docstring purely to satisfy a grep —
engineering around, and a loss of the sentence that explains the whole phase. Genuinely
unsatisfiable.

**Not engineered around.** Proven by route A, the same grep over non-comment lines only, which
scores **0 on all seven** `index.ts`/`envConfig.ts` files across all three functions — the real
claim of criterion 2. Flip-tested so it cannot be a tautology: injecting
`const injected = Deno.env.get('INJECTED_FLIPTEST') || 'fallback';` on a **code** line took
`send-email/index.ts` from **0 → 1**, and `git checkout --` (after the work was committed) returned
it to **0**, with `git diff --stat HEAD` confirming clean.

**Action for Plan 05:** `scripts/assert-edge-env-defaults.mjs` must exclude comment lines, or it
will fail on the four docstrings this phase itself wrote. Registered as window 164.

**And the contrast worth keeping.** Task 1 AC2 (`grep -c 'atob' index.ts` is 0) looked identical and
is **not** the same thing. My first draft of the decode comment named `atob` while explaining the
change, scoring 1 — but the word is not load-bearing there, so the comment was reworded to "the
platform decoder" and the criterion now genuinely passes at 0. Same for Task 2 AC7
(`grep -cE 'Deno\.'` on `templateVars.ts` is 0): the plan's own wording for the module docstring —
"no Deno imports, no URL imports and no reference to the Deno global" — states the contract in full
**without** the forbidden token, so it was written that way and passes at 0. Two criteria that
looked like the wall were revised into compliance; one genuinely was the wall.

## Deviations from Plan

**1. [Rule 2 — Missing critical functionality] `send-email`'s outer catch echoed raw error text to the caller**
- **Found during:** Task 3, while verifying the plan's stated non-disclosure premise rather than assuming it
- **Issue:** the catch built `const message = err instanceof Error ? err.message : 'Internal server error'`
  and returned it in the response body, with no logging. Threat row T-155-23 rates the new throw
  messages `low` on the explicit basis that the catch is opaque. It was not.
- **Fix:** `console.error` the real error; return a fixed literal `'Internal server error'` with
  nothing interpolated, matching `identity-callback`. The comment says the property that matters is
  the absence of a template, so the guarantee holds for throws added later too.
- **Files modified:** `apps/supabase/supabase/functions/send-email/index.ts`
- **Verification:** the arm contains no interpolation; the frontend caller is unaffected
  (`supabaseAdminWriter.ts:88` wraps a supabase-js `FunctionsHttpError`, whose `.message` is the
  generic non-2xx string, not the body, and its test mocks `error: { message: 'Function error' }`);
  `yarn test:unit` 25/25.
- **Commit:** `bcae09a05`

**2. [Rule 2 — Missing critical functionality] Two comment lines the plan did not ask for**
- **Found during:** Task 3
- **Issue:** the plan specifies a comment for the host and the sender but none for the credentials,
  leaving the two unwrapped `Deno.env.get` reads immediately below the new throws looking like
  oversights rather than deliberate exemptions — the exact "make any exemption legible" failure.
- **Fix:** one line above `smtpUser`/`smtpPass` saying they are genuinely optional, carry no default
  and are deliberately not converted.
- **Commit:** `bcae09a05`

**3. [Reported, not fixed] Task 3 AC1 unsatisfiable** — see above, with flip-tested route A.

**4. [Addition beyond the plan] The control-on-the-control and the real-key fixture** — the plan
specifies a four-case matrix for `jwtSegment.test.ts` and a nine-case matrix for
`templateVars.test.ts`. Both were extended (to 6 and 12) with the `UNMARKED_SEGMENT` assertion and
the five-real-key sweep, because the brief's instruction to enumerate real cases from the tree
cannot be discharged by the plan's examples alone.

**Total deviations:** 2 auto-fixed (both Rule 2), 1 criterion reported with flip-tested alternate
proof, 1 deliberate test-coverage addition.
**Impact:** no scope change. Deviation 1 was a prerequisite for an invariant the plan already stated.

## Out of scope, deliberately, and recorded

- **The non-null `Deno.env.get(...)!` reads** at the two `createClient` calls: assigned to Plan 06.
  Untouched, still 2.
- **`payload.user_roles || []`**: a legitimate absent-claim default, not an environment default.
  Untouched, per plan instruction.
- **Two pre-existing disclosures left in this file** — `details: rpcError.message` on the RPC-failure
  branch, and the nodemailer error string pushed into `results[].error` and returned in both the 200
  and the 500 body. Same class as the catch arm I repaired, but caused by nothing in this diff and
  admin-gated. **Not fixed**, filed as window 166 so the repair beside them is not mistaken for
  closing the class.
- **The dead call path**: `send-email` has no live caller. Noted as the plan instructs, not acted on;
  the function was **not** deleted. Window 169.

## Verification

| Gate | Baseline | After |
|---|---|---|
| `yarn workspace @openvaa/supabase test:unit` | 37/37 (4 files) | **55/55 (6 files)** |
| `yarn test:unit` | 25/25 tasks | 25/25 tasks |
| `yarn build` | 14/14 | 14/14 |
| `yarn lint:check` | 22/22 | 22/22, exit 0 |
| `yarn format:check` | clean | clean |
| `yarn assert:comment-hygiene` | 0 / 1571 files | 0 / **1576** files |

Plan-level `<verification>`, item by item: all four new test files collected (`jwtSegment.test.ts`
and `templateVars.test.ts` both listed in the run); `yarn test:unit` green; `format:check` green over
the new and changed files; the repository-wide environment-default grep returns nothing on
non-comment lines across all three functions; and both duplicated module families compare equal
(three `cmp` invocations, all exit 0).

`yarn db:lint:sql` was not run: it is pre-existing red by construction (its failing half lints the
live database), and this plan touches no SQL.

## E2E decision — declined, on this diff's own measurement

The execution brief warned specifically that `send-email` might sit on a default-suite path, unlike
`identity-callback`. It was checked rather than assumed, and the warning was well aimed: **`sendEmail`
appears 20+ times under `tests/`.** That is RESEARCH Pitfall 6's name-match shape, and resolving it
is what decides the question.

1. **`tests/tests/utils/supabaseAdminClient.ts:474` defines the HARNESS's OWN `sendEmail`**, which
   calls `this.client.auth.admin.generateLink` and `this.client.auth.admin.inviteUserByEmail`
   **directly from the Node test process**. Supabase Auth's own mailer delivers to Mailpit. The Edge
   Function is never entered; the specs' Mailpit assertions are about the auth service, not this code.
2. **`functions.invoke` appears ZERO times under `tests/`** — re-measured this session.
3. **The string `send-email` appears ZERO times under `tests/`.** Nothing even names the function.
4. **Zero importers** of `send-email/*` modules across `apps/frontend/src`, `packages` and `tests`.
5. **The sole frontend caller, `supabaseAdminWriter.sendEmail`, is referenced by nothing but its own
   mocked unit test** — no route and no `.svelte` component reaches it.

The frontend-side contract **is** covered by `yarn test:unit` (`supabaseAdminWriter.test.ts` mocks
`functions.invoke`), green, and `yarn build` is 14/14. **Still owed before ship**, registered as
window 167: no run has ever exercised the *deployed* function, so all three fixes rest on Node-side
vitest plus the offline before/after reproductions rather than on a served Deno run.

**Operator note.** `.env.example:116-118` documents all three variables. Whether the operator's root
`.env` sets them could **not** be checked — reading `.env` is blocked by the sandbox permission
policy this session — so it is recorded as unverified rather than asserted. If it does not set them,
a local `supabase functions serve send-email` will now throw `ERR_ENV_UNCONFIGURED`; that is the
intended loud failure under D-D2 and the `reversibility rating="costly"` the plan flagged, not a
regression. Check with `grep -c SMTP_HOST .env`.

## Flagged assumption — status

The plan's `<flagged_assumptions>` block records REVIEW-EDGE-03's unclassified edge: a placeholder
key **present** in the map whose value is the **empty string**, which substitutes rather than passing
through, and which no source artefact decided. `templateVars.test.ts` now **pins** that behaviour
with a test whose own comment says, in the file, that it is characterisation and **not a ruling** —
`??` falls back only on `null` and `undefined`, so an empty string is a value. The behaviour is
therefore protected from silent drift while the design question (render nothing, or fall back to the
placeholder text so a reader can see something was meant to be there?) stays open for the phase
checker. Registered as window 168.

## Known Stubs

None. No placeholder values, no skipped tests, no unwired data paths, no `TODO`/`FIXME` introduced.

## Broken-windows entries filed (`.planning/WINDOWS.md`, 6)

| ID | Kind | Subject |
|---|---|---|
| 164 | `deviation` | Task 3 AC1 unsatisfiable; four docstring hits; flip-tested route A; action for Plan 05's guard |
| 165 | `deviation` | plan Task 3 premise + T-155-23 falsified — the catch echoed `err.message`; fixed under Rule 2 |
| 166 | `todo` | two pre-existing disclosures left in `send-email`, handed to the non-disclosure owner with windows 157 and 162 |
| 167 | `unrun-verify` | no Playwright run; Pitfall 6 name-match resolved four ways; served-Deno run still owed |
| 168 | `todo` | the present-but-empty variable case pinned as characterisation, explicitly not adjudicated |
| 169 | `todo` | `send-email` has no live caller; observation recorded, function not deleted; `.env` state unverified |

## Threat Flags

None. Every surface this diff touches is covered by the plan's `<threat_model>`; no new network
endpoint, auth path, file access pattern or schema change is added. T-155-18 through T-155-22 and
T-155-24 are mitigated as specified. **T-155-23 required correction rather than mitigation** — its
premise was false, and the disclosure it rated `low` was real until this plan closed it. T-155-SC
holds: this plan installs nothing, and no lockfile was touched.

## Requirements

`requirements-completed` is deliberately **empty**. `requirements.ready-ids` reports **0/3 ready**:
all of `REVIEW-EDGE-01`, `REVIEW-EDGE-02` and `REVIEW-EDGE-03` are also declared by sibling plans in
this phase, so none may read `Complete` until every declaring plan has produced a SUMMARY. This plan
discharges `REVIEW-EDGE-01`'s **second and final** site, the **whole** of `REVIEW-EDGE-03`, and
sites **4, 5 and 6** of `REVIEW-EDGE-02`'s seven — which, with 155-02's site 7 and 155-03's sites
1 to 3, closes all seven.

## Next

Phase 155 Plan 05, which builds `scripts/assert-edge-env-defaults.mjs`. Two things it must inherit
from here: the guard **must exclude comment lines** (window 164) or it will fail on four docstrings
this phase wrote, and its byte-identity assertion now has **three** `envConfig.ts` copies and **two**
`jwtSegment.ts` copies to hold, all verified equal at this commit.

## Self-Check: PASSED

All 5 created files exist on disk (`[ -f ]`); all 4 commit hashes resolve in `git log`; every task's
acceptance criteria re-run (Task 1 six of six pass, Task 2 seven of seven pass, Task 3 five of six
pass with AC1 reported unsatisfiable and proven by a flip-tested alternate route); all plan-level
`<verification>` commands re-run and pass; `git diff --diff-filter=D` across the four commits
confirms **no** files were deleted.
