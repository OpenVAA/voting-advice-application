---
phase: 174-invitations-grants-defined-in-advance
plan: 05
subsystem: edge-functions
tags: [supabase, edge-function, deno, invitations, magiclink, smtp, nodemailer, vitest, security]

requires:
  - phase: 174-invitations-grants-defined-in-advance
    provides: "plan 03: a local auth service that refuses public sign-up, the edge runtime under per_worker with SITE_URL and SMTP equal to the tracked template; plan 04: claim_invitations and the six service-role helpers (invitation_code_status, invitation_link_request, invitation_link_release, invitation_code_claimant_email, invitation_link_witness_open, invitation_link_witness)"
provides:
  - "the Edge Function account-access: POST /functions/v1/account-access with the operations check-code, request-link and code-sign-in"
  - "six pure modules beside it (contract, mailTemplates, signInLink, deploymentChecks, linkIssue, envConfig) and six test files, 293 tests"
  - "the sign-in mail in seven locales, mailed by the function over SMTP with a token_hash link to <SITE_URL>/<locale>/api/auth/callback"
  - "the request field witness: a service-role completion record, so a test asserts a negative after the work is known to be over"
  - "the entry 'account-access': 'requires a project term' in PROJECT_SCOPED_EDGE_FUNCTIONS and in the gate's test"
  - "174-edge-facts.mjs and 174-fn-probe.mjs; rows E1 to E11 and the section 'The server contract for Phase 178' in 174-NAME-MAP.md"
affects: [174-06, 174-07, 174-08, 174-09, 174-10, 178]

actuals:
  tokens: 46700
  tasks: 7
  commits: 9
plan_head_before: 46571050daa37894e411a5234c177e3e61e0270b
plan_head_after: edc36ec29810bebeea5d4deae46892eba260071c

tech-stack:
  added: []
  patterns:
    - "Answer first, work after: the response of a link request is built before any work and the whole issue runs inside EdgeRuntime.waitUntil"
    - "The order of an effectful sequence as one pure function with every effect injected, so each path, each failure included, is a unit test"
    - "A positive answer of a deployment check remembered for a bounded time; a negative one never remembered"
    - "Create passwordless, then mint: generateLink invite (token discarded) before generateLink magiclink"
    - "A handler vitest cannot import is held by a test of its own source text, and that test is shown red against mutations"
    - "A completion witness carried in the request, so a negative assertion waits for the request's own end and not for a clock"

key-files:
  created:
    - "apps/supabase/supabase/functions/account-access/index.ts"
    - "apps/supabase/supabase/functions/account-access/contract.ts"
    - "apps/supabase/supabase/functions/account-access/mailTemplates.ts"
    - "apps/supabase/supabase/functions/account-access/signInLink.ts"
    - "apps/supabase/supabase/functions/account-access/deploymentChecks.ts"
    - "apps/supabase/supabase/functions/account-access/linkIssue.ts"
    - "apps/supabase/supabase/functions/account-access/envConfig.ts"
    - "apps/supabase/supabase/functions/account-access/contract.test.ts"
    - "apps/supabase/supabase/functions/account-access/mailTemplates.test.ts"
    - "apps/supabase/supabase/functions/account-access/signInLink.test.ts"
    - "apps/supabase/supabase/functions/account-access/deploymentChecks.test.ts"
    - "apps/supabase/supabase/functions/account-access/linkIssue.test.ts"
    - "apps/supabase/supabase/functions/account-access/flowConformance.test.ts"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-edge-facts.mjs"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-fn-probe.mjs"
  modified:
    - ".env.example"
    - "apps/supabase/supabase/functions/.env.example"
    - "scripts/assert-project-scoped-queries.mjs"
    - "packages/dev-seed/tests/projectScopingGate.test.ts"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-NAME-MAP.md"

key-decisions:
  - "The handler hands a wrapper, issueInBackground(request), to EdgeRuntime.waitUntil instead of issueSignInLink(request, deps) directly: the dependencies are built inside the background work, so an unset SITE_URL is a log line and no link, never a 500 on an endpoint that must always answer the same"
  - "config.toml is not touched: a call carrying only the anon key reaches the function with no [functions.account-access] table (measured)"
  - "The html part of the mail puts the link in an anchor with a localized label, because the E2E mail fixture reads links from anchors and the marker may appear once per part"
  - "The 405 answer has a body of its own, { error: 'method-not-allowed' }, held in contract.ts with the other fixed bodies"
  - "A log line carries a fixed message and at most a failure's name and code, each only when it is a short token; a failure's message is never logged"
  - "The gate entries stay in this plan: the project-scoping gate accepts a disposition no guarded source invokes yet"

patterns-established:
  - "A negative control after a source-level test: mutate the source, read which assertions fail, restore"

requirements-completed: [INV-03, INV-04]

coverage:
  - id: D1
    description: "check-code answers exactly one of valid, used and unknown; a fourth word cannot leave the function"
    requirement: "INV-04"
    verification:
      - kind: unit
        ref: "apps/supabase/supabase/functions/account-access/contract.test.ts, 'builds three code-status bodies and no fourth'"
        status: pass
      - kind: integration
        ref: "174-fn-probe.mjs steps 3 and 8, tests/e2e-runs/174-gates/174-05-fn-probe.txt"
        status: pass
    human_judgment: false
  - id: D2
    description: "request-link answers every well-formed request with the same status and body and returns before any work that depends on who asked"
    requirement: "INV-04"
    verification:
      - kind: unit
        ref: "flowConformance.test.ts, 'the uniform answer of a link request' (four tests), red against an await placed before the return"
        status: pass
      - kind: integration
        ref: "174-fn-probe.mjs steps 4 to 6: deep-equal answers for an invited, a repeated and an uninvited address; 4 ms and 5 ms"
        status: pass
    human_judgment: false
  - id: D3
    description: "A link is issued only for the address the database returns, by creating a passwordless user first and minting a magiclink token second, and is mailed in the request's locale with fixed text"
    requirement: "INV-03"
    verification:
      - kind: unit
        ref: "linkIssue.test.ts (65 tests), mailTemplates.test.ts (70), flowConformance.test.ts 'the order of issue'"
        status: pass
      - kind: integration
        ref: "174-fn-probe.mjs step 7: the link verifies to a session that claims exactly the promised grant with password_set false"
        status: pass
    human_judgment: false
  - id: D4
    description: "The mailed link's origin is SITE_URL and nothing from the request; no link is issued unless the auth service admits the callback URL"
    verification:
      - kind: unit
        ref: "signInLink.test.ts (46 tests); flowConformance.test.ts 'the origin of the link' (four tests), red against a read of the origin header"
        status: pass
      - kind: integration
        ref: "174-fn-probe.mjs step 10: hostile Origin and X-Forwarded-Host headers, the link's origin unchanged"
        status: pass
    human_judgment: false
  - id: D5
    description: "No link is issued unless the served auth settings say sign-up is disabled and auto-confirmation is off, and a positive answer is believed for at most 60 seconds"
    verification:
      - kind: unit
        ref: "deploymentChecks.test.ts (27 tests); linkIssue.test.ts 'a deployment that must not issue links takes no slot'; flowConformance.test.ts 'the memory of the deployment checks', red against a remembered negative and a swapped lifetime"
        status: pass
    human_judgment: true
    rationale: "Held by unit and source-level tests only. The refusing branch was not observed live: the local auth service is closed, and opening it to watch the function refuse would undo 174-03's configuration"
  - id: D6
    description: "Both deployment checks precede the eligibility question, and a slot taken with no mail handed to SMTP is given back"
    verification:
      - kind: unit
        ref: "linkIssue.test.ts 'a slot that was taken and mailed nothing is given back' (seven tests), red against a removed release"
        status: pass
    human_judgment: true
    rationale: "No live step makes user creation, token issue or the transport fail, so the release is shown by unit tests over fakes and by 174-04's pgTAP of invitation_link_release, not by one run through both"
  - id: D7
    description: "A witness the service role opened is completed at the end of the background work; one nobody opened is ignored"
    verification:
      - kind: unit
        ref: "linkIssue.test.ts 'the completion witness' (seven paths, three assertions each)"
        status: pass
      - kind: integration
        ref: "174-fn-probe.mjs steps 4, 5, 6, 8, 10 (sent and not-sent read back) and step 11 (an unopened id reads nothing)"
        status: pass
    human_judgment: false
  - id: D8
    description: "code-sign-in answers a session or the one invalid-credentials answer; an unknown code and a wrong password are indistinguishable; the claimant's address is never returned"
    requirement: "INV-04"
    verification:
      - kind: unit
        ref: "flowConformance.test.ts 'answers every failure of a code sign-in with the one body and never returns the claimant'"
        status: pass
      - kind: integration
        ref: "174-fn-probe.mjs step 9"
        status: pass
    human_judgment: false
  - id: D9
    description: "No log line holds an address, a code, a password or a token, and every line begins with account-access:"
    verification:
      - kind: unit
        ref: "flowConformance.test.ts 'the log' (five tests), red against the claimant in a log call; linkIssue.test.ts 'the log' (16 tests), red against the address in a message"
        status: pass
      - kind: other
        ref: "the function's log read through the filter for its prefix after both live runs: no line"
        status: pass
    human_judgment: false
  - id: D10
    description: "Whether a later link for one address invalidates the unopened one before it is measured and recorded for Phase 178"
    verification:
      - kind: other
        ref: "174-edge-facts.mjs, tests/e2e-runs/174-gates/174-05-edge-facts.txt, the three re-issue lines; row E6 of 174-NAME-MAP.md"
        status: pass
    human_judgment: false
  - id: D11
    description: "The plan closes on seven green gate rows and one live run, with no E2E run"
    verification:
      - kind: other
        ref: "node 174-verdict.mjs gates 174-05-close --rows typecheck,lint,unit,format,name-gate-self-test,auth-config,stack — exit 0"
        status: pass
      - kind: e2e
        ref: "the full default suite at the close of 174-06"
        status: unknown
    human_judgment: true
    rationale: "No spec of the suite calls an Edge Function yet. The gate rows show the tree builds and its unit tests pass; that nothing else moved is shown only by a run"

duration: 36min
completed: 2026-10-07
status: complete
---

# Phase 174 Plan 05: The account-access Edge Function Summary

**One anon-callable Edge Function, `account-access`, answers a code check with one of three words, takes a link request with one unvarying answer returned before any work, and signs in with a used code and a password; an eligible address gets a fixed-text mail in one of seven locales whose `token_hash` link verifies to a session that claims exactly the promised grant. Twelve live steps on the real runtime, auth service and mail catcher passed, and each "nothing was sent" was read after the request's own completion witness.**

## Performance

- **Duration:** 36 min
- **Started:** 2026-10-07T09:31:02Z
- **Completed:** 2026-10-07T10:07:09Z
- **Tasks:** 7 of 7
- **Files:** 15 created, 5 modified
- **Restarts of the stack:** three, as planned, each `yarn db:stop` (exit 0) then `yarn db:start` (exit 0) followed by both probes at exit 0

## Accomplishments

- The runtime facts the function rests on were measured before a line of it was written, through a probe function that never entered the tree: a background task completes after the response under `per_worker`, the anon key alone is enough, the `email_exists` code is on `error.code`, and a later sign-in token invalidates the earlier unopened one.
- Everything the function decides without I/O is a pure module with a test beside it, and the one sequence that can send a mail is a pure function whose seven paths are unit tests.
- The handler vitest cannot import is held by 31 assertions over its own source, each class of which was shown red against a mutation.
- One live run showed the whole contract: an invited address got one mail whose link claimed exactly `(project, editor)` with `password_set` false; an uninvited address got the identical answer and, after its witness read `not-sent`, no mail and no account; a code went `valid`, was bound, claimed and answered `used`; code sign-in accepted the right password only; hostile `Origin` and `X-Forwarded-Host` headers moved nothing.

## Task Commits

| Task | Name | Commits |
| --- | --- | --- |
| 1 | An uncommitted probe function is served: the first restart | `ba0ba08b0` (chore: `174-edge-facts.mjs`) |
| 2 | Measure the edge runtime's facts, remove the probe function: the second restart | `e5207b63b` (docs: name map E1 to E8) |
| 3 | The pure modules | `f3b13af5c` (feat), `918c7ddbf` (docs: name map E9) |
| 4 | The order of a link issue as one pure module | `c0e10605d` (feat) |
| 5 | The handler | `512d4363b` (feat) |
| 6 | The conformance test, the gate entries; the function is served: the third restart | `2016c2871` (test) |
| 7 | One live run of the whole contract; the close on gate rows | `5c952583a` (chore: `174-fn-probe.mjs`), `edc36ec29` (docs: name map E10, E11, the gate rows, the contract section) |

**Plan metadata:** the commit that adds this file. `commits: 9` is `git rev-list --count 46571050d..HEAD` when this file was written; all nine are this plan's.

## The measured facts of Task 2 and what each decided

Asked through the probe function `r174-probe` by `174-edge-facts.mjs` (exit 0, `tests/e2e-runs/174-gates/174-05-edge-facts.txt`). Local stack only: CLI `v2.118.0`, `policy = "per_worker"`, `supabase-js` `2.117.2`.

| Fact | Observed | What it decided |
| --- | --- | --- |
| A3: is the anon key alone accepted? | anon key as `apikey` and bearer: 200. `apikey` header only: 200. No key: **401, never reached the function** | **`config.toml` is not changed.** No `[functions.account-access]` table |
| A4: does a background task complete after the response? | **yes.** The answer came after 5 ms; the task waits 3000 ms, then mails; the mail reached the catcher 3559 ms after the answer | `request-link` answers first and does everything in `EdgeRuntime.waitUntil`. The checkpoint reserved for "the mail did not arrive" was not needed |
| A7: where is `email_exists`? | on **`code`**. Own enumerable keys of the error: `__isAuthError=true`, `name="AuthApiError"`, `status=422`, `code="email_exists"` | `createPasswordlessUser` swallows an error only when `error.code === 'email_exists'`; the conformance test pins it as the only code compared |
| The redirect question | both 303. For `<SITE_URL>/en/api/auth/callback`: `Location` names that URL. For `https://not-allowed.example/en/api/auth/callback`: `Location` is `http://127.0.0.1:5173`, the auth service's own `site_url` | `isRedirectAdmitted`: true exactly when the `Location` has the requested URL's origin and path |
| The served settings | status 200; `disable_signup` the boolean `true`, `mailer_autoconfirm` the boolean `false` | `isSignUpClosed` accepts those two booleans and nothing else |
| **Re-issue** | two `magiclink` tokens issued in a row for one address; verifying the **first** afterwards: **403 `otp_expired`**; the second: 200 with a session | recorded for 174-10's todo and Phase 178 (below) |
| The caller, as the function sees it | `x-forwarded-for` and `x-real-ip` are `192.168.65.1` in both calls that reached it (the container network's gateway); `cf-connecting-ip` and `sb-forwarded-for` absent | nothing reads them; no limit is keyed on a header. Local topology only (residual R-d); for 174-10's todo |
| A code change without a restart | **not served** on the first call after the edit nor ten seconds later | every change to the function is restarted before it is observed |

**The re-issue consequence, in the words the plan fixes:** a later link for the same address makes the earlier unopened one stop working, so a third party who knows the address can invalidate the user's unclicked link once a minute (residual R-c of 174-01). The per-address interval of 174-04 is what bounds it to once a minute. Phase 178's "email sent" screen should say that only the newest mail's link works.

**A9 (Task 3):** holds. The pure modules and their tests moved no gate; no list or count in any gate was edited for them.

## The live run

`node 174-fn-probe.mjs`, exit 0, 12:58:21 to 12:58:25 local, its first run (`tests/e2e-runs/174-gates/174-05-fn-probe.txt`). Addresses shortened to their letter; each is `r174-probe-fn-<letter>-1791367102-966652@test.openvaa.local`.

```
PASS 1 keys — both captured
PASS 2 seed — four (project, editor) invitations in 00000000-0000-0000-0000-000000000001: by email for A, D and E, and one with a code
PASS 3 check-code — the code answers valid; a string that names nothing answers unknown
PASS 4 request-link, an invited address — answered 200 { accepted: true } in 4 ms; the witness read sent; one mail for A with the English subject; its only link is http://localhost:5173/en/api/auth/callback with token_hash and type=magiclink
PASS 5 request-link, the same address again — the same answer in 9 ms; the witness read not-sent; then still one mail for A
PASS 6 request-link, an address nobody invited — the same answer in 5 ms; the witness read not-sent; then no mail and no account for B (3 users read)
TIME request-link answered in 4 ms for the invited address and in 5 ms for the uninvited one
PASS 7 the link, the claim and the refresh — the token verified to a session with an empty grants claim; the claim returned one (project, editor) and password_set false; the refreshed token carries exactly that grant
PASS 8 request-link with a code, then the claim — the witness read sent; one mail for C; its token verified; the claim returned the code’s (project, editor); check-code now answers used
PASS 9 code sign-in — the right password answers signed-in with two tokens and nothing else; a wrong password and an unknown code answer the same invalid-credentials body
PASS 10 the origin of the link — with Origin and X-Forwarded-Host naming evil.example, the mail for D links to http://localhost:5173, as A’s does
PASS 11 a witness nobody opened — answered like any other; after its mail and a later request’s finished witness, the service role reads no record for that id
PASS 12 cleanup — 4 seeded invitation(s) and 4 user(s) deleted; none remains
174-fn-probe: PASS
```

- **The two answer times: 4 ms for the invited address, 5 ms for the uninvited one.** One sample each, local, measured by the caller around the whole HTTP exchange.
- **A second run** was made by Task 7's own verify command (13:02 local, same tree, no restart): exit 0, the same twelve steps PASS with fresh addresses, 6 ms and 8 ms.
- The function's log, read through the filter for its prefix after each run, held no line.
- The plan's list seeds A and the code row; the script also seeds D (the plan's "fresh invited address") and E (step 11).

## Gate rows

`tests/e2e-runs/174-gates/174-05-close`, exit 0, first attempt, head `5c952583a` (tree-equal outside `.planning/` to `2016c2871`), 2026-10-07 12:58:58 to 13:00:52 local, AC power, under `caffeinate -dimsu`. `power.txt`: `sleep_entries_in_window: 0`. No void marker exists in the directory.

| Row | Status | Seconds |
| --- | --- | --- |
| typecheck | 0 | 19 |
| lint | 0 | 44 |
| unit | 0 | 31 |
| format | 0 | 18 |
| name-gate-self-test | 0 | 0 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

`node 174-verdict.mjs gates 174-05-close --rows typecheck,lint,unit,format,name-gate-self-test,auth-config,stack` exits 0: "rows: 7 expected (the named subset), 7 recorded", "not stale: head 5c952583a is tree-equal to HEAD outside .planning/", "power: no Sleep entry inside the run window", "PASS". `node 174-verdict.mjs hygiene` exits 0: 9 scripts and 10 plan files, 0 hits, the same two advisory lines as at the baseline. After the gate set, `170-allowlist-probe.sh after` and `174-stack-probe.sh after` each exit 0 once more (probe users `0 found, 0 left`).

Unit totals from the row's log: supabase functions **21 files, 499 tests** (15 and 206 at `174-04-close`; the six new files hold 293: contract 54, mailTemplates 70, signInLink 46, deploymentChecks 27, linkIssue 65, flowConformance 31); frontend 159 files passed and 1 skipped, 2546 tests passed and 7 skipped; dev-seed 67 and 1015; app-shared 10 and 141; data 47 and 244.

**pgTAP was not run and no E2E run was made, as the plan directs.** The plan changes no schema file, migration, generated type, pgTAP file or `config.toml`, nothing under `apps/frontend` and nothing under `tests` (`git diff --stat 46571050d..HEAD` over those paths prints nothing). pgTAP last ran at `174-04-close`: 39 files, 1706 tests. The database was not reset by this plan.

**What the `typecheck` row does not cover.** `apps/supabase` has no `tsconfig.json` and no `typecheck` script, and this host has no Deno, so no compiler has checked `account-access/*.ts`. Vitest transpiles the modules without checking types. The handler is known to load and run because it was served and exercised, not because it was type-checked.

## The mail as shipped

English, verbatim. Subject: `Sign-in link for the voting advice application`. Text part:

```
Open this link to sign in:
<the link>

The link works once and expires soon. If it has expired, ask for a new one on the sign-in page.

If you did not ask for this link, you can ignore this message.
```

The html part holds the same three sentences as paragraphs, with the link as the `href` of one anchor whose visible text is `Sign in`.

## Constructed non-English strings, for native-speaker review

All six non-English mails are constructed here, not taken from a catalogue (174-10 files the review). Per locale: the subject, the intro line, the anchor label, the "works once" sentence and the "did not ask" sentence. The application's name follows each catalogue's own word for it; the anchor label follows the catalogue's `login` string except in Swedish, where the catalogue's `login` reads "Registrera dig".

| Locale | Subject | Intro | Label | Works once | Did not ask |
| --- | --- | --- | --- | --- | --- |
| `fi` | Kirjautumislinkki vaalikoneeseen | Avaa tämä linkki kirjautuaksesi sisään: | Kirjaudu | Linkki toimii yhden kerran ja vanhenee pian. Jos se on vanhentunut, pyydä uusi linkki kirjautumissivulla. | Jos et pyytänyt tätä linkkiä, voit jättää tämän viestin huomiotta. |
| `sv` | Inloggningslänk till valkompassen | Öppna den här länken för att logga in: | Logga in | Länken fungerar en gång och upphör snart att gälla. Om den har upphört att gälla kan du be om en ny på inloggningssidan. | Om du inte har bett om den här länken kan du bortse från det här meddelandet. |
| `da` | Loginlink til valgtesten | Åbn dette link for at logge ind: | Log ind | Linket virker én gang og udløber snart. Hvis det er udløbet, kan du bede om et nyt på loginsiden. | Hvis du ikke har bedt om dette link, kan du se bort fra denne besked. |
| `et` | Sisselogimislink valimiskompassi | Sisselogimiseks ava see link: | Logi sisse | Link toimib ühe korra ja aegub peagi. Kui see on aegunud, küsi sisselogimislehel uus link. | Kui sa seda linki ei küsinud, võid seda kirja eirata. |
| `fr` | Lien de connexion à la boussole électorale | Ouvrez ce lien pour vous connecter : | Se connecter | Le lien ne fonctionne qu'une seule fois et expire bientôt. S'il a expiré, demandez-en un nouveau sur la page de connexion. | Si vous n'avez pas demandé ce lien, vous pouvez ignorer ce message. |
| `lb` | Umelllink fir de Wal-Kompass | Maacht dëse Link op, fir Iech unzemellen: | Umellen | De Link funktionéiert eemol a leeft geschwënn of. Wann en ofgelaf ass, frot op der Umeldesäit en neien un. | Wann Dir dëse Link net ugefrot hutt, kënnt Dir dëse Message ignoréieren. |

The English anchor label `Sign in` is also a string the plan does not list. `staticSettings.supportedLocales` holds `en`, `fi` and `sv`; the mail covers the seven message directories.

## Decisions Made

- **The work is handed over through a wrapper.** `EdgeRuntime.waitUntil(issueInBackground(request))`, where `issueInBackground` builds the dependencies and awaits `issueSignInLink`. See Deviations 1.
- **`config.toml` did not change** (A3).
- **The gate entries stayed here.** `yarn assert:project-scoped-queries` exits 0 with `'account-access': 'requires a project term'` although no guarded source invokes the function yet; nothing moved to 174-08.
- **The link sits in an anchor.** `getLinksInEmail` of the E2E mail fixture reads `href` values, and the marker may appear once per part, so the html has `<a href="{{link}}">` with a label and the text part has the bare link.
- **`requirements-completed` lists INV-03 and INV-04 for their Edge Function half**, as 174-04 listed them for the database half. The entry points that call the claim and refresh the session are 174-08's.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] An unset `SITE_URL` cannot turn the uniform answer into a 500**
- **Found during:** Task 5
- **Issue:** As written, the handler builds the dependency object, `siteUrl: requireEnv('SITE_URL', …)` among it, between the parse and the return. `requireEnv` throws synchronously, so a deployment with no `SITE_URL` would answer `request-link` with an error instead of the one accepted body.
- **Fix:** `issueInBackground(request)` is an async function that builds the dependencies and awaits `issueSignInLink`; a throw while building them is one log line and no link. The handler's branch still holds no `await` and returns after `EdgeRuntime.waitUntil(`. The conformance test asserts the wrapper is the only caller of `issueSignInLink` and catches whatever it meets.
- **Consequence:** in that one case a witness the request names is never completed, because the work never started. By the code, not by a measurement.
- **Files modified:** `apps/supabase/supabase/functions/account-access/index.ts`
- **Commit:** `512d4363b`

**2. [Rule 2 - Missing critical] A logger that throws, and a failure whose name quotes an address**
- **Found during:** Task 4
- **Issue:** "Never rejects" and "the log never receives the address" each had a hole: a `log` dependency that throws inside a `catch`, and an error whose `name` or `code` is not a fixed token.
- **Fix:** every log call of `linkIssue.ts` goes through a wrapper that swallows a logger's own failure; `describeFailure` keeps a name and a code only when each is a run of at most 64 letters, digits and `_ . : -`. Both are unit tests.
- **Files modified:** `linkIssue.ts`, `linkIssue.test.ts`
- **Commit:** `c0e10605d`

### Additions and differences

- **Two edits outside Task 5's file list, in its commit:** `contract.ts` gains `METHOD_NOT_ALLOWED_BODY` (`{ error: 'method-not-allowed' }`, with its test), since the plan fixes the 405 status and no body; `linkIssue.ts` exports `describeFailure`, which the handler's own three log calls use.
- **`callbackUrl` refuses more than the plan lists:** a site URL carrying credentials, and a locale outside the seven. `mintToken` answering an empty hash is a failure that gives the slot back.
- **Timeouts the plan does not ask for:** 10 seconds on each request to the auth service and on each phase of the SMTP conversation, so a hung dependency ends as `not-sent` with the slot released instead of holding a background task open.
- **A non-string `locale` is a bad request**, and a `null` optional field counts as absent. The plan says "any string or absent" and does not name the other cases.
- **Step 11 of the live run has no witness of its own**, by construction: its request names an id nobody opened. Its read follows that request's own mail and the finished witness of a later request for the same address. That order is observed, not enforced. The database half (a witness is completed by `UPDATE` only) is 174-04's pgTAP.
- **The comment above the loop in `projectScopingGate.test.ts` was reworded.** It said "The three functions this repository invokes"; with the fourth name it now says each served function keeps its entry.
- **Both environment templates gained one clause** beyond the function's name: that `account-access` asks the auth service the redirect question and mails no link when the answer is no. In the functions' template the names stand in the two section headers and, for `SITE_URL`, in the comment itself.
- **Negative controls the plan does not ask for** were run on `linkIssue.test.ts` (six mutations: 8, 16, 6, 5, 4 and 5 of 65 tests failed) and on `flowConformance.test.ts` (twelve mutations, each failing at least one of 31). Both sources were restored and compared byte for byte afterwards.
- **A first look at the served function by hand** before the probe script existed (six requests; row E10).

### One hygiene slip, corrected

After the first restart I redirected the whole output of `yarn db:start` into `tests/e2e-runs/174-gates/174-05-restart1-start.log`. That output includes the status object the CLI prints at start, which holds the local keys. Nothing was printed to the transcript: a count of key-shaped lines showed it, and the line was replaced in place within the same minute by a note saying what was removed. The second and third restarts filter that line out before anything is written under `tests/e2e-runs/`. The file is gitignored.

For the operator, inferred from the driver's code and not from opening any file: `174-bankauth.sh` writes `yarn db:start`'s output to `tests/e2e-runs/174-e2e/_drivers/<stem>.bankauth.db-start.log` the same way, so those evidence files of 174-03 probably hold the same object.

### Not observed

- **The live run was never shown red.** It passed on its first attempt; I did not serve a deliberately broken function to watch it fail, which would have cost two more restarts.
- **The two refusing branches of the deployment checks, and the release after a failed send, were not exercised live** (coverage D5 and D6).
- **A hosted project.** Whether its gateway accepts the anon key alone, what forwarded headers it sets, and how long a background task may run there are unmeasured.

## Driver statuses against the plan's text

Nothing disagreed. This plan used `174-gates.sh` and `174-verdict.mjs gates` and `hygiene` only; each behaved as the plan's `<long_gates>` block and Task 7's `fails_when` describe, and the verdict prints the `power:` line. No E2E driver was run, so the wrapper's void status (8), `174-verdict.mjs e2e` exiting 3 and `174-bankauth.sh` exiting 3 were not exercised here.

**Total deviations:** 2 auto-fixed (both missing critical), the differences listed above, one corrected hygiene slip. No scope creep outside the function directory, the two gates and the two templates.

## Issues Encountered

None. No gate, unit run or probe was red on a tree meant to be green, no run was void, and nothing was repeated after a red. Two assertions of the conformance test were wrong when first written (a regular expression that stopped at a semicolon inside a log message, and a count of the word `nodemailer` that forgot the import line names it twice) and were corrected before the test was committed.

## Review against the checklist

Read against `.agents/code-review-checklist.md` § _Edge Functions_ and the general items.

- **Authority through `user_can`:** does not apply. The function is anonymous and decides no authority in TypeScript; it asks six service-role database functions and the auth service.
- **Service-role client for privileged operations:** holds, one per request, with `persistSession` and `autoRefreshToken` off.
- **"Descriptive error messages":** deliberately not met. Every failure answer is a fixed literal, because a descriptive one is the oracle the function exists to deny.
- **No repeated code:** two repetitions, both forced by one deployment unit per function directory: `envConfig.ts` (held byte-identical by its gate) and the five-character `escapeHtml`, which `send-email/templateVars.ts` also holds.
- **`any`:** none in the sources. The tests cast hostile inputs with `as never` in three places.
- **Documentation:** every exported symbol carries TSDoc. The docs site and the database skill are not updated here: 174-07 and 174-10 own them.
- **Comments:** present tense, no decision, requirement or phase id in any file under `apps/`, `packages/` or `scripts/` this plan touched (`git grep -P` for those forms prints nothing; `yarn assert:comment-hygiene` exits 0).

## Threat Flags

None. Every surface this plan adds is in the plan's threat model (T-174-36 to T-174-47, T-174-86 to T-174-91).

One observation that is not a new surface: the redirect question is a `GET /auth/v1/verify` with an invalid token, made by the function at most once per callback URL per ten minutes per worker. On a deployment whose auth service limits verifications per forwarded address, those calls draw on whatever bucket the function's own address falls in. Not measurable locally, where no such limit applies (research RQ-5).

## Known Stubs

None.

## User Setup Required

None on this host. On any other host the stack is restarted once after pulling this plan (`yarn db:stop`, `yarn db:start`), or `account-access` is not served.

## `CLAUDE.md` and the skill docs read against the change

`CLAUDE.md` was not edited. **One sentence of it is now incomplete:**

> - **Edge Functions**: `apps/supabase/supabase/functions/` — `identity-callback`, `invite-candidate`, `send-email`

There are four; `account-access` is the fourth. § _Development Environment_ on `PUBLIC_PROJECT_ID` stays true: it speaks of `identity-callback` only, and `account-access` reads no project from its environment.

Sentences outside `CLAUDE.md` that are now false and were not edited, because 174-07 rewrites them when `invite-candidate` goes:

- `.claude/skills/database/SKILL.md`, front matter and body: "3 Edge Functions", "3 Edge Functions: `invite-candidate`, `identity-callback`, `send-email`", "**Edge Function pattern**: 3 Edge Functions in `apps/supabase/supabase/functions/`", and "`envConfig.ts` is a **byte-identical triplicate**" (four copies until the deletion).
- `apps/supabase/README.md`: "three Edge Functions" and "Three functions under `supabase/functions/`:".
- `scripts/assert-edge-env-defaults.mjs`, docblock: "`envConfig.ts` exists in triplicate".
- The docblock of `envConfig.ts`, in all four copies: "Byte-identical copies of this file live in … `identity-callback/`, … `invite-candidate/` and … `send-email/` -- this file is one of the three". The new copy is byte-identical as the plan requires, so it says so too.

## What 174-06 must know

- **The subject a spec waits for:** `Sign-in link for the voting advice application` in `en`. The others are in the name map's contract section. Neither `REGISTRATION_EMAIL_SUBJECT_REGEX` nor `RESET_EMAIL_SUBJECT_REGEX` matches the English subject (both evaluated against it: false), so a spec needs a matcher of its own.
- **The exact answers:**
  - `check-code` → 200 `{ "status": "valid" | "used" | "unknown" }`
  - `request-link` → 200 `{ "accepted": true }`, always
  - `code-sign-in` → 200 `{ "result": "signed-in", "access_token": "…", "refresh_token": "…" }` or 200 `{ "result": "invalid-credentials" }`
  - malformed → 400 `{ "error": "bad-request" }`; another method → 405 `{ "error": "method-not-allowed" }`; a failed code check → 500 `{ "error": "internal" }`
- **How a test opens and reads a witness**, each call with the service-role key: `rpc('invitation_link_witness_open')` returns an id; the test sends `request-link` with `"witness": "<id>"`; it polls `rpc('invitation_link_witness', { p_id })` until it reads `sent` or `not-sent` (null means still open); only then does it read the catcher or the accounts. `174-fn-probe.mjs` is a working example, with a 250 ms poll and a 30 second ceiling.
- **The request body** carries `project_id`, and a spec must send the project it seeded in: the E2E project, not the default one. The function serves any project.
- **The function is called with the anon key as `apikey`**; with no key the gateway answers 401.
- **The link's origin is `http://localhost:5173`**, the function's `SITE_URL`, whatever port the wrapper serves the frontend on. A spec that opens the mailed link in a browser on another port rewrites the origin or the run sets `SITE_URL` to match; a spec that verifies the `token_hash` directly is unaffected.
- **One mail per address per 60 seconds, and a later mail invalidates the earlier link.** A spec uses a fresh address per request it expects a mail from, or releases the slot first.
- **The mail's html holds exactly one anchor**, so `getLinksInEmail` returns one `href`, already the callback URL: `toCallbackUrl` is not needed for it.
- **Cleanup:** the service role can delete invitation rows, claimed ones included, through REST; deleting the users removes their grants.

## What 174-07 and 174-08 must know

- `account-access/envConfig.ts` is the fourth byte-identical copy; `DUPLICATED_MODULES` needed no edit for it.
- `flowConformance.test.ts` reads `../send-email/index.ts` for the two `npm:` import lines. A change to either version in `send-email` reddens it until `account-access/index.ts` follows.
- `PROJECT_SCOPED_EDGE_FUNCTIONS` and the loop in `projectScopingGate.test.ts` already name `account-access`; the first `functions.invoke('account-access', …)` must carry `project_id` or `projectId` in its argument text.
- The callback needs a `magiclink` arm: every mailed link has that type, for a first-time and a returning user alike.

## Next Phase Readiness

- The function is served on the local stack and its contract is in the name map; nothing in the frontend or the suite calls it yet.
- The stack is up and serves four functions; the default dataset is as 174-04 left it; no probe user or invitation remains; the mail catcher holds the eight mails of the two live runs until the next restart; no dev server is running.
- Open for 174-10's todo: the caller observation (R-d), the re-issue residual (R-c), and that the function directory has no type-check.

## Self-Check: PASSED

- Files: the fifteen created files and the five modified ones exist on the tree; `apps/supabase/supabase/functions/r174-probe` does not.
- Commits: `ba0ba08b0`, `e5207b63b`, `f3b13af5c`, `918c7ddbf`, `c0e10605d`, `512d4363b`, `2016c2871`, `5c952583a` and `edc36ec29` are ancestors of HEAD; `git rev-list --count 46571050d..HEAD` printed 9 when this file was written.
- Evidence: `tests/e2e-runs/174-gates/174-05-close` exists, holds no void marker, and its verdict exits 0 on HEAD; `174-05-edge-facts.txt`, `174-05-fn-probe.txt` and `174-05-fn-probe-verify.txt` exist.
- Working tree: `git status --short` shows only the operator's untracked `CAND-APP-PLAN.md`.
