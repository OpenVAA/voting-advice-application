# Candidate /candidate home: savedCandidateData.answers empty → logout opens confirm-modal

**Found:** 2026-06-01, during candidate-mega-journey e2e step 22 (final logout).

## Symptom
`candidate-mega-journey.spec.ts` step 22 fails: clicking the home "Log Out"
button does not log out (URL stays `/en/candidate`, no `/candidate/auth/logout`
POST fires). All other 21 steps pass.

## Root cause (diagnosed via console instrumentation of LogoutButton.triggerLogout)
At the logout click on the `/en/candidate` home page:

```
savedData = true   locked = false   unansOpin = 8   unansReq = 1   → MODAL branch
```

`userData.savedCandidateData` IS loaded (truthy) but its `.answers` map is
EMPTY — all 8 opinion questions and the 1 required info question (`test-qu-info-text`)
read as unanswered, even though they were persisted (the preview at step 21
round-trips them, and the overview at step 20 reports full completion).

Because `unansweredOpinionQuestions.length` (8) / `unansweredRequiredInfoQuestions.length`
(1) are non-zero, `LogoutButton.triggerLogout` takes the confirm-modal branch
(`timedModalRef?.openModal()`) instead of the direct `logout()` branch — so no
logout happens. (The TimedModal renders a native `<dialog>` that isn't open/visible
here, so the fixture's `expect(getByRole('dialog')).toHaveCount(0)` still passes.)

## Deeper trace (2026-06-01)
- `userData.savedCandidateData` is populated by `(protected)/+layout.svelte:144`
  `userData.init(snapshot.userData)`, where `snapshot.userData` comes from
  `(protected)/+layout.server.ts` → `dataWriter.getCandidateUserData()`.
- `getCandidateUserData` (supabaseDataWriter) calls RPC `get_candidate_user_data`
  and reads `entityRow.answers`. The RPC (00001_initial_schema.sql:3187) returns
  `c.answers FROM candidates c WHERE c.auth_user_id = auth.uid()`.
- The PREVIEW page reads answers from the ENTITY GRAPH instead
  (`provideEntityData(getEntityData/getNominationData)`), which has NO auth.uid()
  filter — and it shows the answers correctly (step 21 passes).
- So: the entity-graph read has the answers, but `get_candidate_user_data`
  (auth.uid()-scoped) returns them EMPTY — including the profile-saved required
  info (`unansReq=1`). The RPC DID return a row (no throw, savedData=true), just
  with empty `answers`.

**Most likely:** the answers were persisted to a different `candidates` row than
the one `auth.uid()` resolves to on the home reload — i.e. a registration /
auth-linkage mismatch for the freshly-registered unregistered candidate. Verify
with a DB query during a live session: compare `candidates.answers` for the row
matched by `auth_user_id = auth.uid()` vs. the row shown in the entity graph /
preview. (Needs the candidate's session — couldn't be done from outside.)

## Update 2026-06-01 (instrumented run) — primary hypothesis DISPROVEN

Added temporary fire-and-forget logging to `(protected)/+layout.server.ts`
that, on every full-navigation protected-layout load, logged the RPC's
auth.uid()-scoped candidate row AND a direct `select id, auth_user_id,
external_id, answers from candidates where auth_user_id = session.user.id`.
Ran `candidate-mega-journey` twice against a freshly-restarted dev server.

**Result across every load (two independent fresh registrations):**

```
path=/en/candidate     rpcCandidateId=<X> rpcAnswerKeys=0 rowsForAuthUid=[{id:<X>, ext:test-ca-aa-unregistered, answerKeys:0}]
path=/candidate/profile rpcCandidateId=<X> rpcAnswerKeys=0 rowsForAuthUid=[{id:<X>, ...                       answerKeys:0}]
path=/candidate        rpcCandidateId=<X> rpcAnswerKeys=4 rowsForAuthUid=[{id:<X>, ...                       answerKeys:4}]   ← after profile fill
```

Findings (hard evidence, reproduced twice):
1. There is **exactly ONE** `candidates` row for the auth uid (ext
   `test-ca-aa-unregistered`), and `rpcCandidateId` is **stable** across
   every load. The RPC's `.single()` + the function's `LIMIT 1` both confirm
   a single matched row.
2. Answers **persist to that single row** — the profile fill (4 info
   answers) round-trips as `answerKeys:4` read back by the auth.uid()-scoped
   RPC on the very next full reload.
3. The auth.uid()-scoped RPC reads the **same** row the writes target
   (`upsert_answers` writes to `savedData.candidate.id`, which == the RPC
   row id).

**Therefore the "answers in a different candidates row than auth.uid()
resolves to / auth-linkage mismatch" root cause (above) is DISPROVEN.** No
trigger on `auth.users` creates a second candidate row (only the OIDC
`identity-callback` inserts candidates, and the mega-journey is email/
password). The data layer is sound.

### Revised hypothesis (most likely)
The step-22 `unansOpin=8 / unansReq=1` observation was a **client-side /
stale in-memory `userData.savedCandidateData` artifact**, NOT a backend data
bug — consistent with the in-session HMR-staleness note that prompted the
mid-session dev-server restart. On a true full `page.goto` reload (which
step 22 is), `+layout.server.ts` re-fetches from the RPC, which (per the
evidence) returns the populated single row. Candidate client-state suspects
worth checking next: preview's `userData.reloadCandidateData()` →
`updateCandidateData(...)` clobbering `savedData.candidate` in memory, and
whether step 22's `goto` is being served from a warm SPA cache rather than a
fresh document in the failing session.

### Reproduction blocker (separate, environmental)
In a clean restarted env the mega-journey now fails at **step 13**, not 22:
`userData.save()` hangs on the **portrait storage upload**
(`updateEntityProperties` → `storage.upload`) — the submit button is stuck
`"Saving…" [disabled]`, the 4 answers DO persist (`answerKeys:4`) but the
image-upload leg never resolves, so `goto(home)` never fires. Storage +
imgproxy containers report healthy; `supabase_edge_runtime` +
`supabase_pooler` were stopped. This is the imgproxy/storage-decoupling
flakiness already tracked — it blocks reaching step 22 in a cold env but is
unrelated to the answers data model.

## The actual bug to fix
On a full-navigation reload of `/candidate` (home), the protected layout's
`getCandidateUserData` (apps/frontend/src/routes/candidate/(protected)/+layout.server.ts)
returns the candidate WITHOUT its answers (or `userData.savedCandidateData.answers`
ends up empty), even though the same data path on `/candidate/questions` and
`/candidate/preview` reloads has the answers. Investigate why the home reload's
candidate answers are empty (data-provider caching? a different load path? answers
keyed differently?). The opinion answers are saved via the per-question editor
(`questions/[questionId]/+page.svelte`), NOT the profile `userData.save()` — verify
that flow persists answers in a shape `getCandidateUserData` re-reads.

## NOT the cause (ruled out)
- The `unansweredOpinionQuestions`/`unansweredRequiredInfoQuestions` `!savedData`
  branch (returns `[]` vs all) — savedData is truthy here, so irrelevant.
- The upsert_answers id-drop (fixed) — saves succeed; preview shows answers.
- Locale routing of `/candidate/auth/logout` — the endpoint works (POSTs fire
  earlier in the auth flow).

## Test state
`candidate-mega-journey` is 21/22 steps green. The fixture
`candidateLogoutButton.fixture.ts:clickWithoutDialog` currently asserts
`toHaveURL(/candidate/login)` (fails fast at 5s). Once the data-loading bug is
fixed, logout will dispatch directly and the assertion passes. A more robust
assertion (verify logged-out via a protected-route → login redirect, awaiting the
logout POST) is in git history (this session) if the SPA goto(login) proves racy.
