---
status: awaiting_human_verify
trigger: |
  DATA_START
  Idura bank auth: clicking "Identify yourself" on /candidate/preregister immediately redirects back
  to the preregister route instead of the IdP, with no error. Observed URL:
  http://localhost:5173/candidate/preregister?client_id=&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fapi%2Foidc%2Fcallback&scope=openid%20profile&prompt=login&code_challenge=ui2DQRvHX9rGyIVvu2fHMDT7kPu5OPCYdRf6hClbRws&code_challenge_method=S256
  — note client_id is EMPTY while code_challenge/redirect_uri/scope are all populated, and the
  redirect target is same-origin (the current route) rather than an Idura domain, which is why
  nothing throws. Operator states bank auth is enabled and all env vars should be properly defined.
  Also observed: a 403 on /auth/v1/user against Supabase at the same moment — likely just the
  signed-out getUser() check, but confirm rather than assume, since a preregister route is where a
  real auth fault would surface too.
  DATA_END
created: 2026-09-21
updated: 2026-09-21
---

# Debug: Idura bank auth — empty client_id, same-origin redirect

## Symptoms

**Expected behavior**
Clicking "Identify yourself" on `/candidate/preregister` navigates the browser to Idura's
authorization endpoint (an Idura-hosted origin) with a complete authorization request, beginning the
OIDC code flow that `/api/oidc/callback` and the `identity-callback` Edge Function complete.

**Actual behavior**
The browser navigates to `http://localhost:5173/candidate/preregister` — the *same route* — carrying
the authorization request as its query string. The page renders normally; no error is shown and
nothing throws.

**Error messages**
None from the app. One network observation: `403` on `/auth/v1/user` against Supabase at the same
moment. Operator's own read: "perhaps it's just the logged-in check." **Confirm, do not assume** — a
signed-out `getUser()` legitimately returns 403 and the frontend treats that as "not logged in", but
`/candidate/preregister` is also exactly where a genuine auth fault would surface, so this must be
positively identified as benign (or not) rather than waved past.

**Timeline**
No baseline. The operator has not tried Idura bank auth in this checkout before today, so
"never worked here" and "worked and regressed" are BOTH live. Establish a baseline before assuming
either.

**Reproduction**
1. Local stack running (`yarn dev`), bank auth enabled.
2. Visit `/candidate/preregister`.
3. Click "Identify yourself".
4. Observe the same-origin redirect with `client_id=` empty.

**Operator-supplied facts (treat as reported, verify where cheap)**
- Bank auth is enabled and "all env vars should be properly defined".
- **The dev server WAS restarted after editing `.env`.** This is important: it weakens, but does not
  eliminate, the Vite-staleness path — a restart only helps if the value is present under the
  spelling the client bundle actually reads, and if the restart picked up the intended env file.

## Evidence

- timestamp: 2026-09-21 (from the operator's own observation, not yet independently reproduced)
  observation: The authorization request is *well-formed except for `client_id`*.
  `code_challenge` (`ui2DQRvHX9rGyIVvu2fHMDT7kPu5OPCYdRf6hClbRws`), `code_challenge_method=S256`,
  `redirect_uri=http://localhost:5173/api/oidc/callback`, `scope=openid profile`,
  `response_type=code` and `prompt=login` are all populated.
  inference: the URL-building code RAN and mostly succeeded. This is not "the click handler never
  fired" and not "the flow is disabled". One input resolved to an empty string.
- timestamp: 2026-09-21
  observation: The navigation target is same-origin and equals the current route.
  inference: consistent with a base/authorize URL that resolved to an empty or relative string — the
  browser resolves a relative URL against the current document, which lands back on
  `/candidate/preregister` and throws nothing. This is the mechanism behind "redirected with no
  errors", and it means the *authorize endpoint* may be as empty as `client_id` is.

- timestamp: 2026-09-21 (investigation session 2)
  checked: `apps/frontend/src/lib/api/utils/auth/providers/signicat.ts:52-60` vs `idura.ts:86-89`, compared
    against the observed query string.
  found: The observed URL is a BYTE-EXACT match for the SIGNICAT builder's parameter list and order
    (`client_id`, `response_type=code`, `redirect_uri`, `scope=openid%20profile`, `prompt=login`,
    `code_challenge`, `code_challenge_method=S256`). The Idura builder emits a completely different
    shape — only `?client_id=…&request=<signed JAR>` — and no `code_challenge` at all.
  implication: The Idura branch NEVER RAN. `getActiveProvider()` returned `signicatProvider`. This
    reframes the whole bug: it is not an Idura defect, it is that Idura was never selected.

- timestamp: 2026-09-21
  checked: LIVE probe of the running dev server (pid 27479, the one holding `[::1]:5173`):
    `POST http://localhost:5173/api/oidc/authorize` with a probe `codeChallenge`.
  found: `http_status=200`. Returned `authorizeUrl` has `base_before_query = ""` (empty string before
    the `?`), `client_id` length 0, and the Signicat parameter order. Reported as shape/length only.
  implication: Symptom reproduced directly against the operator's running process, not inferred from
    disk. The endpoint returns 200 with a RELATIVE url — this is the fail-open path, confirmed live.

- timestamp: 2026-09-21
  checked: Which public env keys the running server actually injects, read out of the served
    `/candidate/preregister` HTML bootstrap (`env:` block) rather than from any file on disk.
  found: EXACTLY THREE keys are exposed to the client: `PUBLIC_SUPABASE_URL` (len 22),
    `PUBLIC_SUPABASE_ANON_KEY` (len 153), `PUBLIC_PROJECT_ID` (len 36). There is NO
    `PUBLIC_IDENTITY_PROVIDER_*` key of any spelling.
  implication: `PUBLIC_IDENTITY_PROVIDER_TYPE` is `undefined` in the running process, so
    `$lib/utils/constants.ts:11`'s `?? 'signicat'` default selects Signicat; and
    `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` / `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT` both
    become `''` via `?? ''`. One missing env source explains all three.

- timestamp: 2026-09-21
  checked: `apps/frontend/svelte.config.js` (full read) and `apps/frontend/vite.config.ts`, plus
    `apps/frontend/vite.projectIdEnv.ts`.
  found: `svelte.config.js` declares NO `kit.env` block, so `kit.env.dir` falls back to its default
    of `process.cwd()`. `yarn workspace @openvaa/frontend dev` runs vite with cwd
    `…/apps/frontend` (confirmed via `lsof -a -p 27479 -d cwd`). `vite.projectIdEnv.ts`'s own
    docstring states the consequence outright: *"The repo-root `.env` is not the file SvelteKit reads.
    SvelteKit calls `loadEnv(mode, kit.env.dir, '')` with `kit.env.dir` defaulting to `process.cwd()`,
    and the frontend workspace's cwd is `apps/frontend` — so a value written only in the repo-root
    file never reaches `$env/dynamic/public` on its own."*
  implication: ROOT CAUSE LOCATED. The bridge in `vite.projectIdEnv.ts` was built to carry exactly
    two keys (`PUBLIC_PROJECT_ID`, `E2E_PROJECT_ID`) across this gap. Every other variable written
    only in the root `.env` — the entire identity-provider block — is invisible to the frontend.

- timestamp: 2026-09-21
  checked: `apps/frontend/.env.example` (the frontend's own committed template).
  found: Its entire body is: *"Disclaimer: You most likely don't need this file unless you're running
    the front separately outside of Docker. Use the .env.example file in project root for a template."*
  implication: The committed documentation and the runtime behaviour are in direct contradiction. The
    project tells you to configure the root `.env`; the runtime reads only `apps/frontend/.env`.
    `CLAUDE.md` § Development Environment says the same ("Edit the root `.env` file"), as does the
    root `.env.example`, whose comments explicitly describe `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` as
    the name "the SvelteKit frontend reads".

- timestamp: 2026-09-21
  checked: Env NAME/LENGTH probe (values never read into the session) simulating SvelteKit's
    `loadEnv(mode, dir, '')` for both candidate directories.
  found: With `dir=apps/frontend`: all 16 identity/Idura names ABSENT; only the two Supabase keys set.
    With `dir=<repo root>`: ALL of them set and non-empty — `PUBLIC_IDENTITY_PROVIDER_TYPE` (len 5),
    `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` (len 36), `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT`
    (len 64), `IDURA_DOMAIN` (len 27), `IDURA_SIGNING_JWKS` (len 1669), `IDURA_SIGNING_KEY_KID`
    (len 17), plus the private Signicat/shared set.
  implication: The operator's report "bank auth is enabled and all env vars should be properly
    defined" is TRUE. The configuration is correct; the runtime simply never reads it. Also a
    FIX-SAFETY result: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` are IDENTICAL in both
    files, so redirecting the env dir to the repo root cannot move the Supabase target.

- timestamp: 2026-09-21
  checked: `apps/frontend/src/routes/candidate/preregister/+page.svelte:70-113` — the "Identify
    yourself" click handler.
  found: Line 75 branches CLIENT-SIDE on the same constant:
    `if (constants.PUBLIC_IDENTITY_PROVIDER_TYPE === 'idura')`. With the constant absent it takes the
    `else` branch, calls `generateChallenge(window.crypto)`, POSTs `{redirectUri, codeChallenge}`,
    then does `window.location.href = authorizeUrl` on line 111.
  implication: This closes the mechanism completely and accounts for EVERY observed detail — the
    populated `code_challenge` (the client generated it in the Signicat branch), the empty
    `client_id`, the relative target, and the absence of any error (the endpoint answered 200, so
    `response.ok` was true and the `console.error` on line 102 never fired). `window.location.href`
    with a string beginning `?` is resolved by the browser against the current document, landing back
    on `/candidate/preregister`.

- timestamp: 2026-09-21
  checked: The 403 on `/auth/v1/user`, tested directly against local GoTrue at `127.0.0.1:54321`
    in three authorization shapes.
  found: No bearer at all -> `401 no_authorization`. Anon key sent as the bearer ->
    **`403 bad_jwt "invalid claim: missing sub claim"`**. Malformed bearer -> `403 bad_jwt` with a
    parse error. The middle case reproduces the reported 403 exactly.
  implication: BENIGN, and positively identified rather than assumed. `supabase-js` sends the anon
    key as the `Authorization` bearer when no user session exists; the anon key is a valid JWT
    carrying a `role` but no `sub`, so GoTrue rejects it with 403 `bad_jwt` and the client surfaces
    that as "not logged in". It is route-independent (a property of the bearer, not of
    `/candidate/preregister`) and entirely unrelated to the identity-provider fault. NOT an auth
    defect; no action.

- timestamp: 2026-09-21
  checked: Baseline — `git log` on `apps/frontend/svelte.config.js` and `vite.config.ts`;
    `git ls-files` for tracked dotfiles; `git check-ignore`.
  found: `kit.env` has never been configured in any revision of `svelte.config.js`.
    `apps/frontend/.env` is UNTRACKED and gitignored (`.gitignore:3-4,81`), is dated 5 June, and is
    222 bytes — about the size of exactly the two Supabase keys. The `PUBLIC_PROJECT_ID` bridge was
    added later, in `247b8d7bd` (161-01).
  implication: BASELINE RESOLVED — "never worked in this checkout", NOT a regression. Bank auth has
    never been reachable here. Commit `247b8d7bd` patched one single instance of this defect
    (`PUBLIC_PROJECT_ID`) with a purpose-built bridge instead of fixing the general cause, which is
    why the gap survived. The stale local `apps/frontend/.env` is what kept the app mostly working
    and so masked the defect down to just this one feature.

## Hypotheses to test (ordered; none confirmed)

Each is stated so it can be FALSIFIED, and each names what would disprove it.

1. **Two-spelling mismatch.** `.env.example` documents a deliberate contract: the SvelteKit frontend
   reads `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`, the Deno Edge Functions read the un-prefixed
   `IDENTITY_PROVIDER_CLIENT_ID`, and the two MUST hold the same value. If only the un-prefixed
   spelling is set, the client bundle sees an empty string while the file looks complete to a human.
   *Disproved if* both spellings are present and non-empty in the env file the running server loaded.
2. **Idura-branch endpoint resolution.** `PUBLIC_IDENTITY_PROVIDER_TYPE=idura` selects an
   Idura-specific configuration (`IDURA_DOMAIN`, and the Idura authorization endpoint), whereas the
   Signicat branch reads `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT`. If the Idura branch
   derives its authorize URL from a variable that is unset — or derives it from `IDURA_DOMAIN` under
   a name the frontend cannot see — the base URL is empty and BOTH symptoms (empty `client_id` and
   the same-origin target) can share one cause. *Disproved if* the Idura branch is shown to read a
   populated, client-visible authorize URL.
3. **Wrong env file / scope.** The server may have restarted against a different `.env` than the one
   edited (root vs `apps/frontend`, or a shell-exported value shadowing the file). *Disproved if* the
   running process's resolved value is read directly rather than inferred from the file on disk.
4. **Fail-open construction.** The URL builder concatenates without asserting its inputs, so an unset
   variable becomes `""` instead of a thrown error. Even if 1–3 explain *this* instance, this is a
   defect in its own right: the same class produced the Phase-142.1 finding that `aud`/`iss`
   verification failed open on unset env. *Confirmed or disproved by reading the builder.*

## Eliminated

- hypothesis: H1 — Two-spelling mismatch. Only the un-prefixed `IDENTITY_PROVIDER_CLIENT_ID` is set,
    so the client bundle sees an empty string while the file looks complete.
  evidence: The name/length probe shows BOTH spellings present and non-empty in the root `.env`
    (`PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` len 36, `IDENTITY_PROVIDER_CLIENT_ID` len 9). The client
    bundle sees NEITHER spelling, because it does not read that file at all. The two-spelling
    contract is real and documented, but it is not this bug's cause.
  timestamp: 2026-09-21
  note: The probe did surface a SEPARATE latent problem while disproving this hypothesis — the two
    spellings hold values of different length (36 vs 9), so they cannot be equal, violating the
    documented "MUST hold the same value" contract. Recorded under Follow-ups; not this bug.

- hypothesis: H2 — Idura-branch endpoint resolution. The Idura branch derives its authorize URL from
    a variable that is unset or invisible to the frontend.
  evidence: Falsified twice over. (a) The observed and live-probed URL is the Signicat parameter
    shape, so the Idura branch never executed — `getActiveProvider()` returned `signicatProvider`
    because `PUBLIC_IDENTITY_PROVIDER_TYPE` was undefined and defaulted. (b) `IDURA_DOMAIN` IS set
    and non-empty (len 27) in the root `.env`, so once the env is read the Idura branch has the
    input it needs. The Idura code is not implicated.
  timestamp: 2026-09-21

- hypothesis: Vite/HMR staleness — the restart did not pick up the edited values.
  evidence: Not a staleness effect. The values are absent from the running process because the file
    holding them is outside SvelteKit's configured env directory; no number of restarts would import
    them. The operator's restart was effective and correct — it simply reloaded the same
    `apps/frontend/.env`. Confirmed by reading the live process's injected env, not the disk.
  timestamp: 2026-09-21

- hypothesis: The 403 on `/auth/v1/user` is a genuine auth fault contributing to the failure.
  evidence: Reproduced the exact status and error code (`403 bad_jwt`, "invalid claim: missing sub
    claim") by sending the anon key as the bearer to local GoTrue with no user session — the shape
    `supabase-js` uses when signed out. Route-independent and unrelated to the identity provider.
  timestamp: 2026-09-21

## Finding 1 — Reasoning Checkpoint (authorize leg; SETTLED, shipped as `e1f1944cf`)

<!-- This was the live `## Current Focus` for finding 1. It is retained verbatim as history; the
     single live `## Current Focus` block now sits under `## Finding 2` at the end of this file. -->

hypothesis: CONFIRMED (H3, architectural form, + H4 as an independent contributing defect).
`apps/frontend/svelte.config.js` declares no `kit.env.dir`, so SvelteKit resolves its env directory to
`process.cwd()` = `apps/frontend` and reads the stale, gitignored `apps/frontend/.env` instead of the
canonical root `.env`. Every identity-provider variable is therefore `undefined`, which the `??`
defaults in `$lib/utils/constants.ts` silently convert into `'signicat'` and `''`.
test: applying the fix and re-probing the live endpoint for an absolute `https://` Idura base and a
non-empty `client_id`, plus unit tests that red before the fix.
expecting: `/api/oidc/authorize` returns an absolute Idura URL with a signed JAR; an unset endpoint
now throws instead of emitting a relative URL.
next_action: AWAITING HUMAN VERIFICATION. Fix applied and verified against the live server; all
gates green. The operator must confirm in their own browser that clicking "Identify yourself" now
lands on Idura. NOT YET COMMITTED — nothing is staged, by design. Next blocker already identified
and reported: the `IDENTITY_PROVIDER_CLIENT_ID` cross-runtime pair has DRIFTED in their `.env`
(see follow_ups), which will fail the round trip at `identity-callback` even though authorize works.

reasoning_checkpoint:
  hypothesis: "SvelteKit's env dir defaults to process.cwd() (= apps/frontend) because svelte.config.js
    sets no kit.env.dir, so the root .env — where the identity provider is configured, and which
    CLAUDE.md, the root .env.example and apps/frontend/.env.example all name as the canonical file —
    is never read. PUBLIC_IDENTITY_PROVIDER_TYPE is therefore undefined and defaults to 'signicat',
    selecting the wrong provider; CLIENT_ID and AUTHORIZATION_ENDPOINT default to '', producing an
    empty client_id and a relative URL that the browser resolves back to the current route."
  confirming_evidence:
    - "Live server injects exactly 3 public env keys; no PUBLIC_IDENTITY_PROVIDER_* of any spelling."
    - "Live POST /api/oidc/authorize returns 200 with base_before_query = '' and client_id len 0."
    - "Observed query string is a byte-exact match for the Signicat builder, not the Idura JAR shape."
    - "lsof confirms the :5173 vite's cwd is apps/frontend; svelte.config.js has no kit.env block."
    - "Name/length probe: all 16 identity vars ABSENT under apps/frontend, all set under repo root."
    - "vite.projectIdEnv.ts's docstring states this exact mechanism as the reason it exists."
  falsification_test: "If PUBLIC_IDENTITY_PROVIDER_* had appeared in the live server's injected env,
    or if the observed URL had carried the Idura `request=` JAR parameter, this would be wrong. Both
    were checked against the running process and both came back the other way."
  fix_rationale: "Setting kit.env.dir to the repo root addresses the cause — the runtime reading the
    wrong file — rather than the symptom. It is not a per-variable bridge like the PUBLIC_PROJECT_ID
    workaround, which is precisely the patch-one-instance approach that let this survive. Asserting
    the builder's inputs addresses the second, independent cause: that a misconfiguration degraded
    silently into a same-origin navigation instead of an error."
  blind_spots: "Verified only the dev server path; the adapter-node production build and the Docker
    image resolve cwd differently and are NOT verified here (production sets real env vars rather
    than using .env, so this is likely moot, but it is untested). Also untested end-to-end: the
    actual round trip to Idura's servers, which needs the operator's browser and live IdP."
  candidate_causes:
    - "config: svelte.config.js omits kit.env.dir (CONFIRMED — the primary cause)"
    - "code: signicat/idura getAuthorizeUrl concatenate without asserting inputs (CONFIRMED — the
      independent cause of the SILENCE, i.e. of 'redirects with no error')"
    - "code: the `?? ''` / `?? 'signicat'` defaults in constants.ts convert absent config into
      plausible-looking values (CONFIRMED — the amplifier that turns cause 1 into wrong-provider
      selection rather than a loud failure)"
    - "environment/data: a stale gitignored apps/frontend/.env holding exactly the two Supabase keys
      (CONFIRMED as a masking condition — without it the app would have failed loudly at Supabase
      adapter construction long ago and this gap would have been found years earlier)"
  and_gate: "YES — more than one contributing condition. The EMPTY client_id needs only cause 1. But
    the reported symptom as a whole — 'redirects back with no error at all' — requires cause 1 AND
    cause 2 together: had the builder asserted its inputs, cause 1 would have surfaced as an
    immediate 500 naming the missing variable. Cause 4 is a third, independent condition explaining
    why the defect stayed hidden for so long rather than why it fires. All are recorded, and causes
    1 and 2 are both fixed."

## Resolution

root_cause: |
  PRIMARY (config). `apps/frontend/svelte.config.js` declared no `kit.env.dir`, so SvelteKit fell
  back to its default of `process.cwd()`. `yarn workspace @openvaa/frontend dev` runs vite with cwd
  `apps/frontend`, so the ONLY env file SvelteKit ever read was `apps/frontend/.env` — a stale,
  untracked, gitignored 222-byte leftover holding just the two Supabase keys. The repo-root `.env`,
  which `.env.example`, `CLAUDE.md` § Development Environment and even `apps/frontend/.env.example`
  all name as the canonical file, and in which the operator had correctly configured every Idura
  variable, was never read at all. All sixteen identity-provider variables therefore arrived as
  `undefined`, and the `??` defaults in `$lib/utils/constants.ts` converted that absence into
  plausible-looking values rather than an error:
    - `PUBLIC_IDENTITY_PROVIDER_TYPE` -> `'signicat'` (the `?? 'signicat'` default), so BOTH
      `getActiveProvider()` and the client-side branch at `preregister/+page.svelte:75` selected
      Signicat. The Idura code never executed. This is why the observed query string was the
      Signicat PKCE shape and carried a populated `code_challenge` the client had just generated.
    - `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` -> `''`, giving `client_id=`.
    - `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT` -> `''`, so the built string began `?`.

  SECOND CONTRIBUTING CAUSE (code) — why it was SILENT rather than loud. `signicatProvider.
  getAuthorizeUrl` concatenated those two constants with no assertion. A string beginning `?` is a
  valid RELATIVE url, so `window.location.href = authorizeUrl` navigated back to the current
  document, the endpoint answered 200, `response.ok` was true, and the `console.error` on line 102
  never fired. Nothing anywhere threw. Had the builder asserted its inputs, the primary cause would
  have surfaced immediately as a 500 naming the missing variable. Same fail-open class as the
  Phase-142.1 `aud`/`iss` finding.

  THIRD CONTRIBUTING CAUSE (environment, masking only). The stale `apps/frontend/.env` happened to
  contain exactly `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` — byte-identical to the root
  file's. That kept the app working in every other respect and so narrowed a repo-wide env defect
  down to one feature. Without it, Supabase adapter construction would have thrown on day one and
  this would have been found years ago. It explains the defect's longevity, not its firing.

  NOT the cause: the 403 on `/auth/v1/user` (benign; reproduced exactly by sending the anon key as
  the bearer to signed-out GoTrue -> `403 bad_jwt`, "invalid claim: missing sub claim"), the
  two-spelling contract (both spellings ARE set), Vite/HMR staleness, and anything in the Idura
  implementation. Baseline: never worked in this checkout; not a regression.

fix: |
  1. `apps/frontend/svelte.config.js` — added `kit.env.dir = <repo root>`, derived from
     `import.meta.url` (the idiom `vite.config.ts` already uses, since `type: module` means no
     `__dirname`). This is the general fix for the whole class. `vite.projectIdEnv.ts` — the narrow
     per-variable bridge built for `PUBLIC_PROJECT_ID`/`E2E_PROJECT_ID`, i.e. one earlier instance
     of this same defect — is deliberately LEFT IN PLACE: it runs earlier, in the Vite config, and
     still carries the two ids into `process.env` so a one-off shell override keeps winning. A
     comment there now explains it is not a precedent for adding more bridges.
  2. New `providers/requireConfigured.ts` — a point-of-use assertion that throws naming every blank
     variable. Point-of-use because the constants modules are eager object literals imported by
     modules with no interest in the identity provider, so they cannot throw on their own lines;
     this is the same placement rule `PUBLIC_PROJECT_ID`/`supabaseAdapterMixin` already follow.
     Treats whitespace as unset. Reports NAMES ONLY, never values, so it stays safe to log.
  3. Both `getAuthorizeUrl` implementations now assert before concatenating — Signicat on endpoint +
     client id (plus a mandatory `codeChallenge`, optional on the shared type only because Idura
     uses JAR), Idura on client id + `IDURA_DOMAIN`, ordered deliberately BEFORE `getSigningKey()`
     so a wholly-unconfigured environment reports the plain missing variables instead of a
     misleading "Idura signing key not found for kid: ".
  4. `apps/frontend/.env.example` — rewritten. It previously said "you most likely don't need this
     file unless you're running the front separately", which was precisely backwards: that file was
     the only one being read. It now states that `apps/frontend/.env` is not read and that the root
     file is canonical, and tells the reader to delete any leftover copy.
  5. Regression tests (29, all red before the fix): `svelte.config.test.ts` pins `kit.env.dir` to an
     existing repo root, and `providers/authorize-fail-closed.test.ts` covers both providers across
     the boundary neighbours of "unset" (empty, single space, tabs, `undefined`), asserts the error
     NAMES the variable, asserts both names appear when both are blank, asserts the Idura guard
     ordering by requiring the message NOT mention the signing key, and pins the precise regression
     as a property — that no relative url is ever returned.

verification:
  oracle_type: specified — the assertion contract and the resolved-env contract are both stated by
    the fix; not an implicit crash oracle.
  signal_1_regression_test_reds_without_fix: PASS (measured, not reasoned). Reverting only the two
    builders to HEAD -> 23 of 25 fail. The 2 that still passed are informative: the all-configured
    control (correct), and one Idura case that threw for the WRONG reason (signing key) — which is
    exactly what the `.not.toContain('signing key')` ordering assertion catches, and that assertion
    did red. The config guard, run against a throwaway copy of the pre-fix `svelte.config.js` so
    the live file was never disturbed, fails 3 of 3 ("expected undefined to be defined").
  signal_2_full_suite: PASS — `yarn test:unit` 95 files / 1705 tests, 0 failures, exit 0. The four
    adjacent auth suites (`signicat.test.ts` 16, `idura.test.ts` 16, `authorize-endpoint.test.ts` 9,
    `decryptAndVerifyIdToken.test.ts`) all still green, so the assertions broke no existing contract.
  signal_3_not_deletion_only: PASS — adds a config directive, a guard module and 29 tests.
  signal_4_bug_returns_on_revert: PASS, and stronger than a revert — measured before/after on the
    operator's own running server. BEFORE: `POST /api/oidc/authorize` -> 200, `base_before_query`
    empty, `client_id` length 0, Signicat param shape. AFTER (vite restarted itself on the config
    edit; same pid, still `[::1]:5173`): 200, absolute `https://<idura-domain>/oauth2/authorize`,
    `client_id` populated, and a real 3-segment RS256 JAR carrying all nine claims (`aud`,
    `client_id`, `iss`, `nonce`, `redirect_uri`, `response_mode`, `response_type`, `scope`, `state`)
    with a `kid` header, plus `oidc_state`/`oidc_nonce` httpOnly+Secure+SameSite=Lax cookies.
  signal_5_adjacent_gates:
    - lint:check exit 0 (zero errors; it also chains `typecheck`, `typecheck:tests` and 16 assert
      scripts, so typecheck is covered). Two `simple-import-sort` errors my edits introduced were
      autofixed. Exit status read directly, never through a pipe.
    - production build exit 0 (`yarn build`, 14/14 tasks) — run because green typecheck+unit does
      not prove a config change is sound.
    - format:check exit 1 — PRE-EXISTING and unrelated: 10 files, all unmodified vs HEAD, none of
      them mine; `prettier --check` on my six files passes. Documented technical-debt escape.
  security_check_on_the_fix_itself: PASS. Pointing the env loader at a secrets-bearing file could
    have widened client exposure, so this was verified rather than assumed: no source imports
    `$env/static/*` (nothing is baked at build time), and scanning all 212 files of the built client
    bundle finds zero occurrences of `IDURA_SIGNING_JWKS`, `IDURA_SIGNING_KEY_KID`,
    `IDENTITY_PROVIDER_CLIENT_SECRET`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`,
    `SUPABASE_SERVICE_ROLE_KEY`, `BACKEND_API_TOKEN` or `LLM_OPENAI_API_KEY`, and no private-key JWK
    material. Safe by SvelteKit's design: `$env/*/public` exposes only `PUBLIC_`-prefixed keys.
  no_behaviour_change_to_supabase: PASS — `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` are
    byte-identical in both env files (verified by name/length comparison before applying the fix),
    and the live server still injects the same lengths, so the data target did not move.
  guardrail_verdict: accepted
  not_verified_here: the actual round trip to Idura's live servers, which needs the operator's
    browser and the real IdP; and the Docker/adapter-node cwd path (production supplies real
    environment variables, which Vite's `loadEnv` overlays over the file, so this is very likely
    moot — but it is untested).

follow_ups:
  - BLOCKER THE OPERATOR WILL HIT NEXT, and it is a config issue in their gitignored `.env` that I
    cannot fix for them. `yarn check:env-pairs-agree <env-file>` reports:
    "the cross-runtime pair 'IDENTITY_PROVIDER_CLIENT_ID' has DRIFTED:
    'PUBLIC_IDENTITY_PROVIDER_CLIENT_ID' (line 50) and 'IDENTITY_PROVIDER_CLIENT_ID' (line 109) hold
    different values". The frontend now mints the JAR with the PUBLIC_ value as `client_id`/`iss`,
    while the `identity-callback` Edge Function verifies the UN-PREFIXED value as the expected `aud`
    — so the round trip will fail at the Edge Function even though authorization now works. The
    checker prints names only, never values. `IDENTITY_PROVIDER_TYPE` and `SUPABASE_ANON_KEY` agree;
    `SUPABASE_URL` is unset (skipped, not drift). Note this drift is PRE-EXISTING — the fix merely
    makes the flow reach far enough to expose it.
  - `check:env-pairs-agree` is NOT part of `lint:check`, so this drift can recur undetected. Its own
    message says "This has happened twice before, both times undetected." Worth wiring into a gate
    that runs against deployment configuration.
  - The remaining fail-open siblings, deliberately left out of scope to keep this fix minimal:
    `signicatProvider.exchangeCodeForToken` does not assert `IDENTITY_PROVIDER_TOKEN_ENDPOINT` (an
    empty value makes `fetch('')` throw a URL-parse error server-side, so it fails loudly-ish but
    illegibly), and `iduraProvider.exchangeCodeForToken` does not assert `IDURA_DOMAIN`/client id.
    Both now have `requireConfigured` available one line away.
  - `apps/frontend/.env` is now inert. Verified byte-identical on both Supabase keys, so nothing
    changes by leaving it — but it is the condition that hid this defect for the life of the repo,
    and the operator should delete it. It is their untracked file, so I did not.
  - The stale second dev server on `[::1]:5174` (pid 9399, same cwd) is unrelated to this bug but is
    an orphan worth reaping; `strictPort` guards 5173 but this one drifted before that landed.

files_changed:
  - apps/frontend/svelte.config.js (kit.env.dir -> repo root; the root-cause fix)
  - apps/frontend/src/lib/api/utils/auth/providers/requireConfigured.ts (NEW; point-of-use guard)
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts (assert before concatenating)
  - apps/frontend/src/lib/api/utils/auth/providers/idura.ts (assert before getSigningKey)
  - apps/frontend/svelte.config.test.ts (NEW; 4 tests pinning kit.env.dir)
  - apps/frontend/src/lib/api/utils/auth/providers/authorize-fail-closed.test.ts (NEW; 25 tests)
  - apps/frontend/.env.example (corrected the disclaimer that pointed the wrong way)

---

# Finding 2 — CALLBACK LEG (`ERR_JOSE_GENERIC`)

A SECOND, DISTINCT FAULT in the same session. Finding 1 (above) is settled, shipped and confirmed
by the operator; the authorize leg now reaches Idura. Exercising that leg exposed this one. Nothing
above is superseded — read the two as sequential findings.

## Symptoms (Finding 2)

**Expected behavior**
After authenticating at Idura, the browser is redirected to `/api/oidc/callback?code=…&state=…`,
the code is exchanged for an id_token, the token's claims verify, and the visitor lands on
`/candidate/preregister` with an `id_token` cookie set and no `error` query parameter.

**Actual behavior**
The visitor lands on `http://localhost:5173/candidate/preregister?error=invalid_token`.

**Error messages**
One server log line, captured by the operator:
`[frontend] [oidc/callback] ID token claims rejected; code= ERR_JOSE_GENERIC`

**Timeline**
First exposure. This leg was unreachable before `e1f1944cf`, so there is no baseline and this is
NOT a regression — it is the next unexercised step of a flow that had never run in this checkout.

**Reproduction**
1. Local stack running, `PUBLIC_IDENTITY_PROVIDER_TYPE=idura`, post-`e1f1944cf` tree.
2. Visit `/candidate/preregister`, click "Identify yourself".
3. Complete authentication at Idura.
4. Observe the return to `/candidate/preregister?error=invalid_token` and the log line above.

**Operator's explicit additional ask**
"Perhaps you can wire up debug logging" — improved, leak-safe diagnostics on this leg are part of
the deliverable, not a side quest.

## Evidence (Finding 2)

- timestamp: 2026-09-21 (finding 2, investigation session 3)
  checked: Where `ERR_JOSE_GENERIC` can originate. Read `node_modules/jose/dist/webapi/util/errors.js`
    in full, then `grep -rn "JOSEError(" node_modules/jose/dist/` across the whole dist tree
    (excluding the `class JOSEError` declaration itself), and `find` for any second copy of the
    package.
  found: jose is **6.2.1** and there is **exactly one copy** in the tree (`./node_modules/jose`, no
    nested duplicates). `ERR_JOSE_GENERIC` is the code of the BASE `JOSEError` class only — all
    fourteen subclasses override it (`ERR_JWT_CLAIM_VALIDATION_FAILED`, `ERR_JWE_DECRYPTION_FAILED`,
    `ERR_JWE_INVALID`, `ERR_JWS_INVALID`, `ERR_JWT_INVALID`, `ERR_JWK_INVALID`, `ERR_JWKS_INVALID`,
    `ERR_JWKS_NO_MATCHING_KEY`, `ERR_JWKS_MULTIPLE_MATCHING_KEYS`, `ERR_JWKS_TIMEOUT`,
    `ERR_JWS_SIGNATURE_VERIFICATION_FAILED`, `ERR_JOSE_ALG_NOT_ALLOWED`, `ERR_JOSE_NOT_SUPPORTED`,
    `ERR_JWT_EXPIRED`). A bare `JOSEError` is constructed at **exactly two sites in the entire
    library**, both inside `fetchJwks` in `dist/webapi/jwks/remote.js`:
      - line 29: `if (response.status !== 200) throw new JOSEError('Expected 200 OK from the JSON Web Key Set HTTP response')`
      - line 35: `catch { throw new JOSEError('Failed to parse the JSON Web Key Set HTTP response as JSON') }`
  implication: **THE FAILING OPERATION IS LOCALISED, and not by inference from a symptom but from a
    closed reading of the library's source.** The only way this application can observe
    `ERR_JOSE_GENERIC` is a failed fetch of the REMOTE SIGNATURE JWK SET — i.e.
    `jose.createRemoteJWKSet(new URL(options.publicSignatureJWKSetUri))` at
    `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts:133-137`, whose `getKey` →
    `reload()` → `fetchJwks` runs lazily inside `jose.jwtVerify`. The variable behind that URI is
    `IDENTITY_PROVIDER_JWKS_URI`. Narrowed to two sub-cases: the endpoint answered with a NON-200
    status, or it answered 200 with a body that is not JSON.

- timestamp: 2026-09-21
  checked: What the localisation implies about every step that runs BEFORE the JWKS fetch, by
    reading the statement order in `decryptAndVerifyIdToken.ts:92-137`.
  found: `jose.compactDecrypt` (line 132) is `await`ed on its own statement, strictly BEFORE the
    `jwtVerify` call (lines 133-137) that triggers the lazy JWKS fetch. So reaching the fetch proves
    every preceding step SUCCEEDED: `decodeProtectedHeader` parsed the token; the
    `IDENTITY_PROVIDER_DECRYPTION_JWKS` env value parsed as JSON (else `ERR_JWKS_MALFORMED`); the set
    was non-empty (else `ERR_JWKS_EMPTY`); a JWK MATCHED the token's `kid` (else
    `ERR_JWK_KID_MISMATCH`); the audience and issuer presence guards both passed (else
    `ERR_AUDIENCE_UNCONFIGURED` / `ERR_ISSUER_UNCONFIGURED`); `importJWK` accepted the key (else
    `ERR_JWK_INVALID` / `ERR_JOSE_NOT_SUPPORTED`); and **the JWE actually decrypted** (else
    `ERR_JWE_DECRYPTION_FAILED` or `ERR_JWE_INVALID`).
  implication: This is a strongly POSITIVE result and it reframes the remaining work. The token
    exchange with Idura succeeded, Idura returned a real JWE id_token, and the operator's decryption
    key pair is correctly registered with Idura and correctly configured locally. Only the
    SIGNATURE-verification key source is broken. The blast radius is one env variable.

- timestamp: 2026-09-21
  checked: What each NON-JWKS-fetch failure mode of this code path would have logged instead,
    derived from `$lib/server/constants` (`IDENTITY_PROVIDER_JWKS_URI: env.… ?? ''`) and Node's and
    jose's error codes.
  found: (a) If `IDENTITY_PROVIDER_JWKS_URI` were UNSET it would be `''` — note
    `decryptAndVerifyIdToken.ts:44` reads it as `constants.IDENTITY_PROVIDER_JWKS_URI!`, and that
    non-null assertion is FALSE for a `?? ''`-defaulted value — so `new URL('')` would throw Node's
    `TypeError` carrying `code: 'ERR_INVALID_URL'`, which satisfies the provider catch arm's
    `'code' in e` and would have been logged as `ERR_INVALID_URL`. (b) If the host failed to resolve,
    or TLS failed, jose re-throws the raw fetch error: Node's `TypeError: fetch failed` carries no own
    `code` (the code is on `.cause`), so the catch arm's `'code' in e` is FALSE, `error: {}` is
    returned, and the callback would have logged the `'none'` placeholder. (c) A slow endpoint would
    be `ERR_JWKS_TIMEOUT` (jose wraps `TimeoutError` in `JWKSTimeout`). (d) A reachable, 200-JSON
    JWKS that simply lacks the token's signing `kid` would be `ERR_JWKS_NO_MATCHING_KEY`.
  implication: Three more derived facts about the operator's configuration, obtained WITHOUT reading
    their `.env`: `IDENTITY_PROVIDER_JWKS_URI` is **set** and is a **parseable absolute URL**; its
    host **resolved** and the transport **completed**; and the failure is **not** a timeout and
    **not** a kid miss. An HTTP response came back and was rejected on status or on content. Also a
    latent defect recorded in its own right: the `!` on line 44 asserts non-null over a value that is
    `''` when unset, so an unset JWKS URI fails as an illegible `ERR_INVALID_URL` rather than as a
    named `*_UNCONFIGURED` failure like its `audience`/`issuer` siblings two getters below.

- timestamp: 2026-09-21
  checked: `fetchJwks`'s request semantics in `dist/webapi/jwks/remote.js:16-36`, since the non-200
    sub-case is now the leading candidate.
  found: jose issues the request with **`redirect: 'manual'`** and `accept: application/json,
    application/jwk-set+json`. With manual redirect handling, a `301`/`302`/`307`/`308` is delivered
    to the caller AS a response whose `status !== 200` — so any redirect at the JWKS URI (http→https,
    a trailing-slash normalisation, a moved well-known path, a tenant-level host redirect) throws
    `ERR_JOSE_GENERIC` and jose does NOT follow it.
  implication: The single most likely concrete cause is that the configured JWKS URI does not serve
    the JWK set DIRECTLY at that exact URL — it redirects, or 404s, or returns an HTML/JSON error
    page. The `.env.example` template documents the Idura form as
    `https://{domain}/.well-known/openid-configuration/jwks`; whether that path is right for this
    tenant is exactly what the diagnostics must report, because no amount of code reading can settle
    it. CONFIRMING THIS SUB-CASE REQUIRES EITHER THE OPERATOR'S `.env` (harness-blocked, correctly)
    OR A LIVE REQUEST TO THEIR IdP — so the instrument, not further static analysis, is the next step.

- timestamp: 2026-09-21
  checked: Attempted a direct probe of the configured JWKS endpoint — a script reading the repo-root
    `.env` in-process and printing ONLY derived non-secret facts (set/empty booleans, value lengths,
    a host-equality boolean, HTTP status, content-type, JSON-parse boolean, key count).
  found: BLOCKED by the harness secret-file guard, as the constraints anticipated. Not worked around.
  implication: The remaining sub-case discrimination is not reachable from this context by design.
    This is the direct justification for building the diagnostic instrument rather than probing: the
    operator's own next run must produce a log line that names the sub-case.

- timestamp: 2026-09-21
  checked: The closed-set claim at `apps/frontend/src/routes/api/oidc/callback/+server.ts:78`
    against the contract its own dependency publishes at
    `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts:85-86`.
  found: They CONTRADICT each other, in the same tree, about the same value. The callback asserts
    "the set is exactly ERR_JWKS_MALFORMED, ERR_JWKS_EMPTY, ERR_JWK_KID_MISMATCH,
    ERR_AUDIENCE_UNCONFIGURED and ERR_ISSUER_UNCONFIGURED", with `'none'` as the placeholder for an
    uncoded failure. The helper's own `@throws` tag lists those five and then adds: "**jose's own
    coded errors flow through unchanged**". The provider catch arms
    (`idura.ts:154-167`, and the same shape in `signicat.ts`) forward `e.code` verbatim for ANY
    `Error` carrying a `code`, which is what makes the helper's sentence the true one.
  implication: MAPPING-HOLE DEFECT CONFIRMED, and it is a documentation/contract defect rather than a
    lost-information defect — the code did not discard the failure class, jose simply never had a more
    specific one to give. Two consequences worth separating: (1) the callback's comment is false and
    unpinned by any test, so a reader debugging this leg is actively misled about which codes are
    possible; (2) the one jose code that IS uninformative is precisely the one that fires here, so
    the honest closed set is not merely wider — it is wide enough to include a code that names no
    failure at all. Both are in scope for the diagnostics fix.

## Eliminated (Finding 2)

- hypothesis: H3 — the `IDENTITY_PROVIDER_CLIENT_ID` two-spelling drift (recorded in finding 1's
    follow_ups) causes an `aud` rejection on this leg.
  evidence: Falsified by the code path, not by reading the operator's `.env`. An `aud` mismatch is
    raised by jose's `jwt_claims_set.js` as `JWTClaimValidationFailed` →
    `ERR_JWT_CLAIM_VALIDATION_FAILED`, and claim validation runs only AFTER the signature key has
    been resolved. The JWKS fetch that resolves that key is what failed, so claim validation was
    never reached. Independently: the frontend mints the JAR with `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`
    as `client_id`/`iss` and `decryptAndVerifyIdToken`'s `audience` getter expects that SAME
    `PUBLIC_` value, so the frontend's own `aud` check is self-consistent regardless of the drift.
  timestamp: 2026-09-21
  note: The drift is still REAL and still a blocker — it bites one leg LATER, at the
    `identity-callback` Edge Function, which verifies the UN-PREFIXED `IDENTITY_PROVIDER_CLIENT_ID`
    as the expected `aud`. It remains in finding 1's follow_ups, unchanged and still operator-actionable.

- hypothesis: H4 — nonce verification rejects the token.
  evidence: There is no nonce verification to reject it. `callback/+server.ts:84-89` deletes the
    `oidc_nonce` cookie and its comment states "Nonce verification against the id_token nonce claim
    is a future enhancement". `decryptAndVerifyIdToken` passes only `{ audience, issuer }` to
    `jwtVerify`; jose validates no `nonce` claim on its own.
  timestamp: 2026-09-21

- hypothesis: H2 (first half) — JWE DECRYPTION fails before claim validation is reached.
  evidence: Falsified by statement order plus the closed code reading. `compactDecrypt` is awaited on
    line 132, before the `jwtVerify` on 133 that triggers the JWKS fetch; a decryption failure raises
    `ERR_JWE_DECRYPTION_FAILED` or `ERR_JWE_INVALID`, and a kid miss against the DECRYPTION set
    raises the project's own `ERR_JWK_KID_MISMATCH`. None of those is `ERR_JOSE_GENERIC`. Decryption
    demonstrably succeeded.
  timestamp: 2026-09-21

- hypothesis: H2 (second half, refined and RETAINED) — SIGNATURE verification fails before claim
    validation is reached.
  evidence: CONFIRMED, not eliminated, and now localised more precisely than the hypothesis stated:
    it is not the signature comparison that fails but the RETRIEVAL OF THE KEY SET used to check it.
  timestamp: 2026-09-21

- hypothesis: H1 — the decrypt/verify helper catches a jose error and forwards `err.code` unmapped,
    DISCARDING the real failure class at the boundary.
  evidence: Half right, and the wrong half matters. Pass-through is real and is by design (the
    helper's `@throws` tag says so explicitly), but nothing was discarded: jose itself had no more
    specific code for a failed JWKS fetch than its base `ERR_JOSE_GENERIC`. The defect is therefore
    NOT lost information in our mapping layer — it is (a) a false closed-set claim in the callback's
    comment, unpinned by any test, and (b) the absence of any project-level failure class for the
    JWKS-fetch stage, which is the one stage jose leaves uncoded.
  timestamp: 2026-09-21

## Current Focus

hypothesis: The callback leg fails at the REMOTE SIGNATURE JWKS FETCH, not at decryption, not at
claim validation and not at the client-id drift. `ERR_JOSE_GENERIC` is constructed at exactly two
sites in all of jose 6.2.1, both in `fetchJwks`, so the endpoint named by
`IDENTITY_PROVIDER_JWKS_URI` answered with either a non-200 status (note jose uses
`redirect: 'manual'`, so any 3xx counts) or a 200 whose body is not JSON. Everything upstream of that
fetch is proven to have succeeded, including the JWE decrypt.
test: build the instrument that discriminates the two sub-cases on the operator's next run —
interpose a leak-safe custom fetch on the remote JWK set so the HTTP status / content-type is
observed and reported as a NAMED project failure class; then have the operator re-run the flow.
expecting: a server log line that names the stage (`jwks-fetch`), the variable
(`IDENTITY_PROVIDER_JWKS_URI`) and the observable (HTTP status, or content-type) — with no URI, no
host, no `kid`, no token and no key material — so the configuration fault is self-diagnosing.
next_action: AWAITING HUMAN VERIFICATION. The diagnostics fix is applied, committed, and every gate
is green with exit codes read directly (never through a pipe). The underlying claims rejection is
NOT yet settled and cannot be settled from here: the two remaining sub-cases are discriminated only
by a live request to the operator's IdP, and reading their `.env` is harness-blocked by design. The
operator must re-run the flow and report the new `[oidc/jwks]` / `[oidc/callback]` log lines, which
now name the stage, the variable and the observed HTTP facts. See `Resolution (Finding 2)` below.

superseded_next_action: implement the four-part diagnostics fix in
`apps/frontend/src/lib/api/utils/auth/` — (1) a coded, leak-safe custom fetch for the remote JWK set
emitting `ERR_JWKS_URI_HTTP_STATUS` / `ERR_JWKS_URI_NOT_JSON` / `ERR_JWKS_URI_UNREACHABLE`;
(2) a fail-closed guard for `IDENTITY_PROVIDER_JWKS_URI` replacing the false `!` assertion on
`decryptAndVerifyIdToken.ts:44`, emitting `ERR_JWKS_URI_UNCONFIGURED`; (3) a shared
code→{stage, hint} describer so the console line is actionable while the redirect keeps carrying only
the opaque `invalid_token`; (4) correct the false closed-set comment at
`callback/+server.ts:78` and pin the real set in a test. Then red-without-fix regression tests,
`lint:check` and `test:unit` with exit codes read directly, and a human-verify checkpoint for the
live round trip.

reasoning_checkpoint:
  hypothesis: "The callback leg fails while FETCHING the remote signature JWK set. `ERR_JOSE_GENERIC`
    is the code of jose's base `JOSEError`, and in jose 6.2.1 a bare `JOSEError` is constructed at
    exactly two sites in the entire library, both inside `fetchJwks` in `jwks/remote.js` — one for a
    non-200 status, one for a body that will not parse as JSON. So the endpoint named by
    `IDENTITY_PROVIDER_JWKS_URI` answered and was rejected on status or on content. Separately and
    independently, the callback's comment asserted a CLOSED set of five codes that its own dependency's
    `@throws` tag explicitly denied, so the one uncoded stage in the pipeline was also the one stage
    the documentation said could not occur."
  confirming_evidence:
    - "grep of the whole jose dist: `new JOSEError(` appears at exactly 2 sites, both in fetchJwks."
    - "All 14 JOSEError subclasses override `code`, so no subclass can surface ERR_JOSE_GENERIC."
    - "Exactly one copy of jose in the tree (6.2.1), so no duplicate-package ambiguity."
    - "Statement order: compactDecrypt is awaited on its own line BEFORE the jwtVerify that triggers
      the lazy fetch — so decrypt provably succeeded and the decryption key pair is correct."
    - "`IDENTITY_PROVIDER_JWKS_URI` is `?? ''`-defaulted, so unset would give `new URL('')` →
      ERR_INVALID_URL, not ERR_JOSE_GENERIC. MEASURED by mutation: reverting the guard produced
      `TypeError: Invalid URL` exactly as predicted. Therefore the variable IS set and parseable."
    - "A DNS/TLS failure re-throws Node's `TypeError: fetch failed`, which has no own `code`, so the
      provider catch arm would have returned `error: {}` and the log would have read 'none'. It read
      ERR_JOSE_GENERIC, so the host resolved and the transport completed."
    - "callback/+server.ts:78 and decryptAndVerifyIdToken.ts:86 contradict each other verbatim about
      the same value, in the same tree."
  falsification_test: "If a bare `JOSEError` were constructible anywhere outside fetchJwks, the
    localisation would collapse — grepped the entire dist to check, and it is not. If the observed
    code had been ERR_JWE_DECRYPTION_FAILED / ERR_JWE_INVALID the decrypt-succeeded inference would
    be wrong; if it had been ERR_JWT_CLAIM_VALIDATION_FAILED the client-id drift would have been the
    cause; if it had been ERR_INVALID_URL the variable would have been unset. All four were checked
    against jose's source and all four came back the other way."
  fix_rationale: "The fix addresses the DIAGNOSTIC cause, which is the cause that is in code.
    Interposing `fetchJwksLeakSafe` as jose's `[customFetch]` moves classification in FRONT of jose's
    two uncoded throw sites, so the one stage jose leaves unnamed becomes three named classes that
    each name `IDENTITY_PROVIDER_JWKS_URI` and report the observed HTTP facts. That is a root-cause
    fix for 'the log said nothing', not a symptom patch: it closes the stage permanently rather than
    decoding this one incident. The underlying configuration fault, if that is what it turns out to
    be, lives in the operator's gitignored `.env` and CANNOT be fixed from here — so the fix makes it
    self-diagnosing and routes the action to the operator, which is the most a code change can do."
  blind_spots: "HONEST AND MATERIAL: which of the two sub-cases actually fires is NOT established.
    Both require a live request to the operator's IdP, and the `.env` probe that would have settled it
    was blocked by the harness guard (correctly — I did not work around it). So this deliverable makes
    the failure legible rather than proving it fixed; the operator's next run is the experiment. Also
    untested: the real round trip end to end, and whether the documented Idura path
    `/.well-known/openid-configuration/jwks` is right for this tenant."
  candidate_causes:
    - "code: no project failure class exists for the JWKS-fetch stage, so jose's uncoded base error is
      the best the log could do (CONFIRMED — the cause of the illegibility, and fixed)"
    - "code/documentation: the callback and token routes asserted a closed 5-code set their own
      dependency denied, unpinned by any test (CONFIRMED — fixed, and now pinned by tests that red
      when a code loses its mapping)"
    - "code: `constants.IDENTITY_PROVIDER_JWKS_URI!` asserts non-null over a `?? ''`-defaulted value,
      so an unset variable fails as ERR_INVALID_URL instead of a named class (CONFIRMED by mutation —
      fixed; latent rather than this incident's trigger, since the variable is set)"
    - "environment/data: the JWKS endpoint answers non-200 (a 404, or a 3xx that jose's
      `redirect: 'manual'` refuses to follow) or answers 200 with a non-JSON body (NOT YET
      DISCRIMINATED — operator-side, and the instrument now reports which)"
    - "environment/data: the `IDENTITY_PROVIDER_CLIENT_ID` cross-runtime drift (ELIMINATED for this
      leg — an aud mismatch is ERR_JWT_CLAIM_VALIDATION_FAILED and claim validation runs only after
      the key is resolved; still a real blocker one leg later, at the Edge Function)"
  and_gate: "YES — two independent conditions, and separating them is what makes the deliverable
    coherent. The CONFIGURATION condition (cause 4) is what makes the callback fail. The
    DIAGNOSTIC condition (causes 1 and 2) is what made it unfixable from a log line — and it would
    have applied to any JWKS-URI fault, in any deployment, not just this one. Fixing only the
    configuration would leave the next occurrence equally opaque; fixing only the diagnostics leaves
    the operator's flow still failing. I can fix the second from here and only instrument the first,
    which is why this ends on a checkpoint rather than on a verified round trip."

## Resolution (Finding 2)

root_cause: |
  TWO INDEPENDENT CAUSES. One is in code and is fixed; the other is in the operator's gitignored
  `.env` or at their IdP, and is now self-diagnosing rather than silent.

  CAUSE A (code) — WHY THE LOG SAID NOTHING, and the reason this leg could not be diagnosed from the
  evidence the operator had. jose 6.2.1 defines fifteen error codes. Fourteen name a real failure.
  The fifteenth, `ERR_JOSE_GENERIC`, is the code of the BASE `JOSEError` class, and a bare
  `JOSEError` is constructed at exactly TWO sites in the entire library — both inside `fetchJwks` in
  `jose/dist/webapi/jwks/remote.js`, one for a non-200 status (line 29) and one for a body that will
  not parse as JSON (line 35). So the ONE stage jose leaves uncoded is retrieving the remote
  signature JWK set, and this application had no failure class of its own for that stage. A
  deployment with a wrong `IDENTITY_PROVIDER_JWKS_URI` therefore got a log line naming no stage, no
  variable and no remedy.

  Compounding it: `callback/+server.ts:78` and `token/+server.ts:28` both asserted in a comment that
  "the set is exactly ERR_JWKS_MALFORMED, ERR_JWKS_EMPTY, ERR_JWK_KID_MISMATCH,
  ERR_AUDIENCE_UNCONFIGURED and ERR_ISSUER_UNCONFIGURED" — while their own dependency's `@throws` tag
  said "jose's own coded errors flow through unchanged", and the provider catch arms, which forward
  `e.code` for any `Error` carrying one, made the dependency the truthful one. The set was open, the
  claim was false, and no test pinned it. A reader debugging this leg was actively misled about which
  codes were possible, and the code that actually fired was a member of neither the list nor the
  `'none'` placeholder.

  A third, latent instance of the same class: `decryptAndVerifyIdToken.ts:44` read
  `constants.IDENTITY_PROVIDER_JWKS_URI!`, and that non-null assertion was simply FALSE —
  `$lib/server/constants` flattens the value with `?? ''`, so an unset variable is an empty string,
  and the `!` suppressed the one check that would have caught it. MEASURED, not reasoned: reverting
  the guard makes the blank-URI tests fail with `TypeError: Invalid URL`, i.e. an unset variable
  reported as Node's `ERR_INVALID_URL` — a code naming neither the variable nor the fact that it is a
  configuration fault.

  CAUSE B (environment/data) — WHY THE CALLBACK FAILS. The endpoint named by
  `IDENTITY_PROVIDER_JWKS_URI` answered, and was rejected either on STATUS (non-200) or on CONTENT
  (200 but not JSON). Which of the two is NOT established and cannot be established from this
  context: it needs a live request to the operator's IdP, and the `.env` probe that would have
  settled it is blocked by the harness secret-file guard (correctly; not worked around). What IS
  established, all of it derived from jose's source rather than from the operator's `.env`:
    - the variable is SET and is a parseable absolute URL (an unset value gives `ERR_INVALID_URL`,
      a measured fact, not a guess);
    - its host RESOLVED and the transport COMPLETED (a DNS/TLS failure re-throws Node's
      `TypeError: fetch failed`, which carries no own `code`, so the log would have read `'none'`);
    - it is NOT a timeout (`ERR_JWKS_TIMEOUT`) and NOT a signing-kid miss
      (`ERR_JWKS_NO_MATCHING_KEY`) — jose has specific codes for both;
    - a 3xx is a live candidate and an easy one to miss: jose requests the key set with
      `redirect: 'manual'`, so a redirect is delivered as a non-200 and is NOT followed. A JWKS URI
      that redirects — http→https, a trailing-slash normalisation, a moved `.well-known` path —
      fails identically to a 404.

  STRONGLY POSITIVE COROLLARY, and it narrows the operator's remaining work to one variable.
  `compactDecrypt` is awaited on its own statement BEFORE the `jwtVerify` that triggers the lazy JWKS
  fetch, so reaching the fetch proves everything upstream succeeded: the token exchange with Idura,
  the `IDENTITY_PROVIDER_DECRYPTION_JWKS` parse, a `kid` match against it, the audience and issuer
  presence guards, `importJWK`, and the JWE decryption itself. The operator's decryption key pair is
  correctly registered with Idura. Only the SIGNATURE-verification key source is broken.

  NOT the cause: the `IDENTITY_PROVIDER_CLIENT_ID` cross-runtime drift from finding 1's follow_ups —
  an `aud` mismatch is jose's `ERR_JWT_CLAIM_VALIDATION_FAILED`, and claim validation runs only after
  the signature key has been resolved, which is the step that failed. The drift is still real and
  still a blocker; it bites one leg LATER, at the `identity-callback` Edge Function. Also not the
  cause: nonce verification, which does not exist on this path at all.

fix: |
  Diagnostics, built so this stage can never be uncoded again. Four parts.

  1. NEW `apps/frontend/src/lib/api/utils/auth/oidcFailure.ts` — the single declaration site for the
     failure classes, plus `describeOidcFailure` / `formatOidcFailure`. Declares the five existing
     codes (spellings preserved verbatim: they are a logged, operator-facing contract) and four new
     `ERR_JWKS_URI_*` members, then maps EVERY code — ours and all fifteen of jose's — to the STAGE
     it failed at (`config` / `jwks-fetch` / `decrypt` / `verify` / `claims`) and a FIXED operator
     hint naming the environment variable behind it. Total by construction: an unrecognised code is
     admitted as `unknown` rather than mis-attributed to a plausible stage. `ERR_JOSE_GENERIC` is
     mapped to `jwks-fetch`, which is the only thing it can mean in jose 6.x — so even the code that
     started this investigation is now self-explaining. Every hint is a static string; the module
     imports nothing and reads no environment, so it is leak-safe by construction rather than by
     discipline at its call sites.

  2. NEW `apps/frontend/src/lib/api/utils/auth/fetchJwksLeakSafe.ts` — installed as
     `createRemoteJWKSet`'s `[jose.customFetch]` (public, typed jose API; verified against
     `dist/types/jwks/remote.d.ts`). It observes the response BEFORE jose's two uncoded throw sites
     can and raises `ERR_JWKS_URI_HTTP_STATUS` (reporting the status, and whether a `location` header
     was present — which separates "the URL moved" from "the URL is wrong"), `ERR_JWKS_URI_NOT_JSON`
     (content-type, byte length, and a leading-`<` boolean) or `ERR_JWKS_URI_UNREACHABLE` (the
     transport `cause.code` only). Each message names `IDENTITY_PROVIDER_JWKS_URI`. A `TimeoutError`
     is re-thrown UNCHANGED so jose still maps it to its own well-named `ERR_JWKS_TIMEOUT` — a
     wrapper that relabelled it would replace a specific class with a vaguer one. The happy path is
     unchanged: on a 200 with parseable JSON it hands jose back an equivalent `Response`.

     LEAK SAFETY IS THE SHAPE OF THE MODULE, not a comment on it. What may enter a message is a
     closed whitelist of non-identifying facts (status, content-type, byte length, a markup boolean,
     a `location`-presence boolean, and a `cause.code` filtered through `/^[A-Z][A-Z0-9_]*$/`). Never
     the url, the host, the body, the `location` value, or the transport error's message — Node
     writes `getaddrinfo ENOTFOUND <host>` there, which is exactly the leak the code-only extraction
     prevents. Each of those absences is a test, not a promise.

  3. `decryptAndVerifyIdToken.ts` — installs the custom fetch; replaces the false
     `IDENTITY_PROVIDER_JWKS_URI!` non-null assertion with a fail-closed getter AND a call-path guard
     emitting `ERR_JWKS_URI_UNCONFIGURED` (the getter alone would be positional, protecting only
     callers who take `defaultOptions` — the same structural argument the existing `audience`/`issuer`
     guards already make); routes the five inline code literals through `OIDC_FAILURE.*` so thrower
     and loggers cannot drift; and corrects the module docblock and `@throws` tag to state that the
     set is OPEN.

  4. `callback/+server.ts` and `token/+server.ts` — the false closed-set comments are replaced with
     the truth and with the account of what the false version cost, and both log lines now carry
     `code=… stage=… provider=… — <hint>` via `formatOidcFailure`. `provider=` is included because
     selecting the WRONG provider was the whole content of finding 1, and a log line that names it
     makes that class of fault self-evident. The REDIRECT IS UNCHANGED and still carries only the
     opaque `invalid_token`: server console and browser URL are different audiences, and nothing from
     the new log line reaches the second.

  NOT fixed, deliberately: cause B, which is in the operator's gitignored `.env` or at their IdP and
  is not mine to change. The fix makes it name itself instead.

verification:
  oracle_type: specified — the failure-class contract, the stage mapping and the leak whitelist are
    all stated by the fix; not an implicit crash oracle.
  signal_1_regression_test_reds_without_fix: PASS — MEASURED by four independent mutations, each
    applied to the real tree, run, and reverted (backups diffed byte-identical afterwards):
      - remove the `[jose.customFetch]` option -> 1 failure, exactly the wiring test. Re-measured
        AFTER the later func-style refactor and it still reds, so the guardrail survived the refactor.
      - revert the JWKS-URI guards to their pre-fix form (getter back to `!`, call-path guard removed)
        -> 3 failures, exactly the blank-URI tests, and the observed pre-fix behaviour is
        `TypeError: Invalid URL` — which independently CONFIRMS the derived claim that an unset
        variable surfaces as `ERR_INVALID_URL` rather than as `ERR_JOSE_GENERIC`.
      - interpolate the url into the non-200 message -> 15 failures, including the dedicated
        "never echoes the url" leak test. The leak guardrail bites.
      - delete the `ERR_JOSE_GENERIC` mapping -> 2 failures: the attribution test and the
        jose-coverage test. The anti-rot mechanism bites.
  signal_2_full_suite: PASS — `yarn test:unit` exit 0, read directly. 97 frontend files / 1761 tests
    (up from finding 1's 95 / 1705), plus data 244, dev-seed 795, supabase 166, argument-condensation
    30. The four adjacent auth suites (`signicat` 16, `idura` 16, `authorize-endpoint` 9,
    `token-endpoint` 10) all still green, so the new classes broke no existing contract.
  signal_3_not_deletion_only: PASS — adds two modules, two test files, a guard, a wiring option and
    56 tests; the only deletions are three false comments and one false non-null assertion.
  signal_4_bug_returns_on_revert: PARTIAL, and stated honestly. The DIAGNOSTIC defect is proven to
    return on revert by mutation 1 and mutation 2 above. The UNDERLYING claims rejection cannot be
    re-measured from here at all: it needs the operator's IdP. This is the gap the checkpoint exists
    to close, and it is why the session is not being archived.
  signal_5_adjacent_gates:
    - lint:check exit 0, read directly and never through a pipe (a standing project rule from a prior
      incident where a pipe hid 74 violations). It also chains `typecheck`, `typecheck:tests` and 16
      assert scripts, so typecheck is covered: `svelte-check found 0 errors and 0 warnings`. Two
      errors my edits introduced were fixed at the source rather than suppressed — a `func-style`
      error (the typed `const` arrow became a function declaration, with a compile-time
      `jose.FetchImplementation` conformance assertion added so the type binding is still PROVEN
      rather than lost) and a `Property 'href' does not exist on type 'never'` error (an inline
      `= null` reset narrowed the property for the rest of the block; routed through a function,
      which TypeScript does not narrow through — an annotated local does NOT work, because a `const`
      inherits the narrowing from its initialiser).
    - production build exit 0 (`yarn build`, 14/14) — run because green typecheck + unit does not
      prove a change touching an env-reading module is sound.
    - prettier --check exit 0 on all 8 changed files. Repo-wide `format:check` still fails on the
      same 10 pre-existing unrelated files documented in finding 1; none of them is mine.
  security_check_on_the_fix_itself: PASS, verified rather than assumed, because the change adds a
    module under a client-reachable path (`$lib/api/utils/auth/`). Scanning all 212 files of the
    built client bundle finds ZERO occurrences of `IDURA_SIGNING_JWKS`, `IDURA_SIGNING_KEY_KID`,
    `IDENTITY_PROVIDER_CLIENT_SECRET`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`,
    `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_ISSUER`, `SUPABASE_SERVICE_ROLE_KEY` or
    `BACKEND_API_TOKEN`, zero private-JWK markers, and zero occurrences of `fetchJwksLeakSafe`,
    `describeOidcFailure`, `ERR_JWKS_URI_HTTP_STATUS` or `oidc/jwks` — so none of the new code is
    client-reachable in practice either. `oidcFailure.ts` imports nothing and reads no environment,
    which is what makes that safe by construction. The standing HARD RULE was re-checked:
    `providers/index.ts` still re-exports neither `decryptAndVerifyIdToken` nor the new modules nor
    `$lib/server/constants`.
  no_secret_entered_any_transcript: PASS. `.env` was never read — the one probe that would have was
    blocked by the harness guard and was NOT worked around. Every configuration fact in this finding
    is derived from jose's source, from `$lib/server/constants`' `?? ''` shape, or from the tracked
    `.env.example` template. No value, host, kid, token, claim or key material appears in this file,
    in the code, in the new log lines or in the return summary.
  guardrail_verdict: accepted
  not_verified_here: which of the two JWKS sub-cases actually fires; the live round trip to Idura;
    and whether `/.well-known/openid-configuration/jwks` is the right path for this tenant. All
    three need the operator's browser and IdP.

follow_ups:
  - OPERATOR ACTION, and the one that unblocks the leg. Re-run the flow and read the new log lines.
    `[oidc/jwks] …` now reports the observed HTTP facts and `[oidc/callback] … code=… stage=…
    provider=… — <hint>` reports the stage and the remedy. Expect `stage=jwks-fetch`. The likely
    edits, in order of probability: point `IDENTITY_PROVIDER_JWKS_URI` at the URL that serves the JWK
    set DIRECTLY (a 3xx is NOT followed, so a redirecting URL fails like a 404); confirm the path
    against Idura's live `.well-known/openid-configuration` `jwks_uri` value rather than against the
    template's documented guess.
  - STILL OPEN from finding 1, and now the NEXT blocker once the JWKS URI is right: the
    `IDENTITY_PROVIDER_CLIENT_ID` cross-runtime pair has drifted. `yarn check:env-pairs-agree`
    reports it (names only, never values). It will fail at the `identity-callback` Edge Function, not
    here. The new `ERR_JWT_CLAIM_VALIDATION_FAILED` hint points at it explicitly, so if the drift
    ever does bite the frontend's own `aud` check the log will name the checker.
  - The remaining fail-open siblings, still deliberately out of scope: neither provider's
    `exchangeCodeForToken` asserts that the token response actually CONTAINS an `id_token`, so a 200
    carrying an error body yields `idToken === undefined` and a downstream throw far from the cause.
    `requireConfigured` is one line away in both. Now partly mitigated rather than fixed: whatever
    code that path throws, `describeOidcFailure` either maps it or admits it is unmapped, and the
    `'none'` hint points the reader at the token-exchange leg.
  - `signicatProvider.exchangeCodeForToken` still does not assert `IDENTITY_PROVIDER_TOKEN_ENDPOINT`,
    and `iduraProvider.exchangeCodeForToken` still does not assert `IDURA_DOMAIN` / client id.
    Unchanged from finding 1.
  - `check:env-pairs-agree` is still not part of `lint:check`, so the drift class can still recur
    undetected. Unchanged from finding 1 and still worth wiring into a gate.
  - `apps/frontend/.env` is still the operator's inert untracked leftover and should still be deleted.
  - The stale second dev server on `[::1]:5174` (pid 9399) is still an unreaped orphan.

files_changed:
  - apps/frontend/src/lib/api/utils/auth/oidcFailure.ts (NEW; the closed-set declaration + describer)
  - apps/frontend/src/lib/api/utils/auth/oidcFailure.test.ts (NEW; 19 tests, incl. the anti-rot
    jose-coverage test enumerated off jose's own error classes)
  - apps/frontend/src/lib/api/utils/auth/fetchJwksLeakSafe.ts (NEW; the leak-safe custom fetch)
  - apps/frontend/src/lib/api/utils/auth/fetchJwksLeakSafe.test.ts (NEW; 34 tests, incl. the
    redirect regression and the leak-absence assertions)
  - apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts (installs the custom fetch;
    fail-closed JWKS URI; codes routed through the declaration site; honest @throws)
  - apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts (+3 blank-URI tests,
    +2 wiring tests; the jose mock now records what production passed to createRemoteJWKSet)
  - apps/frontend/src/routes/api/oidc/callback/+server.ts (false closed-set comment corrected;
    actionable log line)
  - apps/frontend/src/routes/api/oidc/token/+server.ts (same, twin call site)

