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
