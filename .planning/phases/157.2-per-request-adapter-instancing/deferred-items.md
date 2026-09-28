# Phase 157.2 — deferred items

Out-of-scope discoveries and deliberately declined questions, logged rather than fixed. Format inherited from
`.planning/phases/157.1-fail-loudly-parse-posture-production-logging/deferred-items.md`: what was found, where,
why it was not fixed here, and who should own it.

---

## PARTIALLY DISCHARGED by Phase 158 (2026-09-02) — a long-running admin job's initiating admin can have their token expire mid-run

> **STATUS SUPERSEDED.** The CRASH MODE this entry describes was removed by `158-17`; the AUTHORITY question decision B4 declined is still open. Read the closing block at the end of this entry before acting on anything above it — the body below is the record as `157.2-06` left it and is deliberately unedited.

**Logged by `157.2-06`, and NOT a discovery made while fixing something else: decision B4 declined this
question by name, and this entry exists so Phase 158 meets it as a known deferral rather than as a surprise.**

- **Files.** `apps/frontend/src/lib/server/admin/features/condenseArguments.ts`,
  `apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts`, and their two callers
  `apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts` and
  `question-info/+page.server.ts`.
- **What happens.** Each job now constructs one writer at job start, from the initiating admin's
  request-scoped client, and holds it for the whole run — which is what `157.2-06` landed and what makes the
  cross-admin write impossible (ledger row 3). But the run lasts **minutes**, sequentially across many
  questions, and the caller `await`s it **inline inside a form action**, so the job's lifetime is the
  request's lifetime. If the initiating admin's access token expires partway through, the Supabase client on
  `event.locals` will attempt a refresh, and `@supabase/ssr`'s cookie handlers will try to write the refreshed
  session onto a response that may already be committed — or the job's remaining reads and writes will simply
  begin failing on an expired token, midway through a partially-applied batch of `updateQuestion` calls.
- **Where it was found.** `157.2-RESEARCH.md` § **P7 — Session refresh inside a minutes-long job**, which
  names the trigger and the mechanism. `157.2-PATTERNS.md` § 7's do-not-copy list repeats it.
- **Why it was NOT solved here.** `157.2-CONTEXT.md` decision **B4** chose the job-owned writer (option a) and
  **explicitly declined to open** what a job should do when the initiating admin's session expires mid-run —
  that was the reason B4's rejected alternative, re-deriving a writer per write, was rejected. `157.2-06`'s
  plan carries it as a prohibition with a stated verification: *"No refresh, retry or re-authentication logic
  is added to either job."* Answering it here would widen the milestone's highest-blast-radius change, and it
  is a question about job durability and response lifetime rather than about adapter instancing, which is what
  ruling **D11** asked for.
- **What this entry does NOT do.** It proposes no implementation. Background execution, a service-role writer
  for job records, a pre-flight token-lifetime check, refusing to start a job whose token expires too soon, and
  making the action return before the job completes are all *shapes an answer could take*, and none of them is
  a recommendation — each carries its own authority question, which is precisely why the question was left
  open rather than answered in passing.
- **Suggested owner:** **Phase 158**, which inherits this area. Failing that, whichever later phase next has
  `src/lib/server/admin/` or the admin form actions in its `files_modified`.
- **Status at `157.2-06` close:** unchanged and unsolved by design. `grep -rn 'refreshSession\|refresh_token'
  apps/frontend/src/lib/server/admin apps/frontend/src/routes/admin` returns nothing, which is the state the
  prohibition asked for.

**CORROBORATED 2026-09-01 by the Phase 157.2 code review, finding WR-05, and PARTIALLY addressed.** The review
reached this same coupling from the other direction — not "the token may expire" but "the job captures the
request's `fetch` and cookie-bound client and holds both past the response" — and classed it a Warning. What
landed (`c89448481`) is the review's own stated MINIMUM and nothing more: both capture sites in
`condenseArguments.ts` and `generateQuestionInfo.ts` now carry a `// reason:` naming the coupling, **both**
failure modes with their concrete triggers (Render's 100s gateway timeout; SvelteKit `respond.js`'s
`cookies.set` thrower firing on an already-committed response), and the remedy. **The mechanism change was
NOT made** and this entry stays OPEN.

- **The remedy the markers now name**, so a later phase inherits a specific proposal rather than the open
  question B4 left: resolve the verified session ONCE at job start and build the job's own client from its
  tokens with `persistSession: false` and `autoRefreshToken: false`, so the job never attempts a cookie write
  at all. This is a *proposal*, not a ruling — it does not answer B4's authority question about what a job
  should do when the initiating admin's session expires; it removes the crash mode while leaving that question
  open.
- **Why the fixer stopped at the marker.** It is a live change to the admin LLM write path (token-scoped
  client, RLS via the `Authorization` header, refresh semantics) and **no gate available in this repo
  exercises it** — the unit suite does not reach it and the E2E suite has no admin-LLM-job coverage. Getting it
  subtly wrong breaks admin writes entirely and silently.
- **What that means for the owner:** this cannot be discharged as a code change alone. **It needs an
  integration gate first** — which is why Phase 158 criterion 11 (the admin app's first E2E coverage) is a
  prerequisite for it, not a parallel task.


### Status at `158-09` (the Phase 158 gate) close — 2026-09-02, HEAD `c074bb04d`

**The remedy this entry named is IMPLEMENTED, and the gate this entry required is GREEN. What the
entry left open by design is still open.** Both halves, separated, because collapsing them is how a
half-solved item gets ticked:

1. **The crash mode — DISCHARGED.** `158-17` implemented the remedy verbatim as this entry states
   it. Measured at the gate, not read from a summary: `apps/frontend/src/lib/supabase/job.ts` builds
   the client with `auth: { persistSession: false, autoRefreshToken: false }`, and both features —
   `condenseArguments.ts` and `generateQuestionInfo.ts` — resolve the verified session **once** via
   `source.locals.safeGetSession()` and then hand
   `createSupabaseJobClient({ accessToken: session?.access_token })` to the writer, with the plain
   global `fetch` rather than the request-scoped one. The job therefore never attempts a cookie
   write on a committed response and no longer depends on the request `fetch` outliving it.
2. **The prerequisite gate — SATISFIED.** This entry says the change *"cannot be discharged as a
   code change alone"* and needs an integration gate first. `158-16` delivered it
   (`tests/tests/specs/admin/admin-access.spec.ts`), and `158-17` ran it on **both sides** of its own
   change — 130 passed before, 130 passed after, same command and prerequisites. The gate then ran it
   inside the full suite: **153 passed, 0 failed / 0 flaky / 0 skipped / 0 did-not-run**, with the
   admin spec at position 125/153.
3. **Decision B4's authority question — STILL OPEN, and deliberately.** What a job *should* do when
   the initiating admin's session expires mid-run is unanswered. `158-17` removed the crash mode and
   left the question standing, exactly as this entry and ROADMAP criterion 12 both require. **This
   entry therefore does not close; it narrows.** Its remaining content is the authority question
   alone.

**One correction to this entry's own stated verification.** It records the
`refreshSession|refresh_token` grep over `lib/server/admin` and `routes/admin` as *"returns nothing,
which is the state the prohibition asked for."* Re-run at this HEAD it returns **4**. All four are
prose and fixtures belonging to Phase 158's criterion-13 work — the `no-session-in-server-loads`
guard's docstring, its spec, and its `FORBIDDEN_MEMBERS` array — and **none is refresh, retry or
re-authentication logic**. The prohibition still holds; the instrument has been substring-fooled by
the very prose written to remove the class it names. Use a code-scoped check, not a bare grep.
---

## OPEN — `yarn test:unit` seeds the LIVE local database, contaminating any E2E run that follows it

**INHERITED FROM PHASE 157.1, carried here deliberately so it does not disappear with the phase that found
it.** `157.1-08` found it, reproduced it, root-caused it and worked around it; the underlying defect is still
unfixed at `157.2-09` close, and this phase's gate ran under the same workaround.

- **File:** `packages/dev-seed/tests/integration/default-template.integration.test.ts`.
- **What happens.** The file is gated on `describe.skipIf(!process.env.SUPABASE_URL)`, so on a developer
  machine with Supabase up — which is exactly the state the phase gate requires for its pgTAP and E2E halves —
  it RUNS, and applies `defaultTemplate` to the **live local Supabase**: 327 candidates, 8 organizations,
  4 question categories, 377 nominations and one election (`seed_election_default`). Its teardown is
  incomplete and leaves that data behind.
- **What that costs.** The voter app then sees TWO elections. `157.1-08` measured the result precisely:
  **4 failed and 79 did-not-run**, deterministic rather than flaky, and none of it caused by the code under
  test.
- **The workaround, and why the gate order in `157.2-VALIDATION.md` is what it is.** Decision **E2(a)** as
  originally written put `db:reset` at the HEAD of the chain, where the unit suite that follows it undoes it.
  The corrected order moves the reset to sit **immediately before** the E2E half. `157.2-09` ran the gate in
  that corrected order and the suite was clean, which is a workaround working — not the defect being fixed.
- **What would have to change.** (a) Make the integration test's teardown complete — it deletes via
  `SupabaseAdminClient.bulkDelete` over ten tables and something in that set is not reaching the default
  template's rows. (b) Move the file out of `yarn test:unit` into its own script, matching how CI already
  isolates it in the dedicated `dev-seed-integration` job. (c) Keep amending gate order documents. **(a) is
  the actual defect; (c) is what two phases have now paid for instead.**
- **Source:** `.planning/phases/157.1-fail-loudly-parse-posture-production-logging/deferred-items.md`
  § "OPEN — `yarn test:unit` seeds the LIVE local database", which carries the full measurement.
- **Suggested owner:** a later v2.15 phase touching `packages/dev-seed` or the gate definition. **Every
  future phase that runs this gate will hit it**, and two have now.

---

## OPEN — `candidate/(protected)/+layout.server.ts:4` documents a client-threading step the phase removed

- **Found during:** `157.2-09` task 2, while verifying the `158-MOSTLY-PERMANENT` allowlist annotation's
  arithmetic against the file it describes.
- **File:** `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts:4` (the module docstring).
- **What is stale.** The sentence reads *"Uses `event.locals.supabase` as the server client for the
  DataWriter, ensuring authenticated RPC calls use the session from cookies."* The load now calls
  `createDataProvider` / `createDataWriter`, and the file's ONLY remaining `locals.supabase` use is a bare
  `auth.signOut({ scope: 'local' })` inside `handleError` (`:81`). The claim's mechanism moved into the
  factories in `157.2-04`; the sentence describes the two-step shape `157.2-08` deleted.
- **Why it was NOT fixed here.** The file is not in `157.2-09-PLAN.md`'s `files_modified`, and the executor's
  scope boundary confines auto-fixes to issues directly caused by the current task's changes. This is a
  prior-plan leftover in a file this plan does not own, and editing it would make the plan's own diff
  unverifiable against its contract.
- **Note.** The **allowlist annotation** describing this file WAS corrected in `157.2-09` task 2, because
  `eslint.config.mjs` IS in this plan's scope. It is the docstring inside the route file that remains stale.
- **Suggested owner:** **Phase 158**, which owns this file (`158-MOSTLY-PERMANENT`), or whichever later plan
  next has `src/routes/candidate/(protected)/` in its `files_modified`.

---

## OPEN — the admin and candidate layout server loads still serialize a refresh token into HTML

**Found by the Phase 157.2 code review (2026-09-01) while fixing CR-02, and OUT OF SCOPE for that fix.**
CR-02 removed the whole `Session` from the ROOT server load (`e019007de`) because nothing read it there. The
same field on the two subtree loads *is* read, so removing it is a behavioural change the review did not
scope and the fixer correctly did not make.

- **Files.** `apps/frontend/src/routes/admin/+layout.server.ts:8-9` and
  `apps/frontend/src/routes/candidate/+layout.server.ts:8-9` — each is a two-line load doing
  `const { session } = await locals.safeGetSession(); return { session };`. (NOT the `(protected)` loads:
  `candidate/(protected)/+layout.server.ts` calls `safeGetSession()` for its own guard and returns no session,
  and there is no `admin/(protected)/+layout.server.ts` at all.)
- **What happens.** Everything a server load returns is serialized into the hydration payload in the HTML
  body. `Session` carries `access_token`, **`refresh_token`**, `expires_at` and the full `user` record, so
  every authenticated admin and candidate page ships a refresh token in its document body. This is the same
  defect class CR-02 flagged at the root, at a narrower blast radius: authenticated routes only, not the
  public voter tree.
- **Why the refresh token is the part that matters.** It is the long-lived credential of the pair, and a
  document body is capturable by HTML/page caches, `view-source` sharing, DOM-snapshot error reporters
  (Sentry session replay et al.) and any HTML-level injection. `render.example.yaml` provisions a cache disk
  for this service, so cached authenticated HTML is a live deployment shape here rather than a hypothetical.
- **Why it was NOT fixed with CR-02.** The consumers are real, and there are two:
  `authContext.svelte.ts:26` (`#isAuthenticated = $derived(!!page.data.session)`) and `auth/getUserData.ts`,
  whose `parent`-based pre-check reads `page.data.session` to short-circuit before any adapter work. Both
  only need existence, not the token — which is what makes a projection viable — but changing the field's
  shape is still a behavioural change outside a review-fix pass and outside the reviewed scope.
- **What would have to change.** Return a projection rather than the token-bearing object — `{ userId,
  expiresAt }` or whatever the two consumers actually need, established by reading them first — and add an
  assertion that no server load returns a field containing `refresh_token`. The assertion is the durable half:
  it is what stops a fourth load from reintroducing this.
- **Suggested owner:** **Phase 158**, filed as criterion 13. It owns the auth surface, it already owns the
  cookie-name single-sourcing (criterion 2) and the session-forwarding mechanism (criterion 8), and
  `authContext` is one of its consumers.
