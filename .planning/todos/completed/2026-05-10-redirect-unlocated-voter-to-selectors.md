---
title: Voter-not-located → access located route → redirect via const/election selector then to desired page
priority: medium
created: 2026-05-10
resolves_phase: 78
context: Captured at v2.8 milestone close. Located routes (e.g. `/results/...`, `/questions/...`) currently fail or render empty when the voter has not yet selected an election + constituency. The expected UX is: bounce to the selector, complete selection, then resume the originally-requested route.
---

# Voter-not-located redirect through selectors

Located routes in the voter app depend on `selectedElection` +
`selectedConstituency` being set in the voter context. When a voter
arrives at a located route URL without that state set (e.g. via a
shared link, browser-back, or refresh after `localStorage` was
cleared), the current behavior is unclear / inconsistent.

## Goal

Implement a "deferred-target" redirect:

1. If the voter is not located AND tries to access a located route:
   - Capture the target URL (path + query + fragment).
   - Redirect to the appropriate selector — `/elections` if no
     election picked yet, then `/constituencies` after — preserving
     the deferred target via search param or cookie.
2. After the selector flow completes, redirect to the originally-
   requested URL (not back to home).

## Approach

1. **Identify the gate.** Likely lives in
   `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/+layout.ts`
   or similar — wherever the located layout's `load` fn currently
   resolves selectedElection / selectedConstituency. Currently it
   probably either errors, returns nulls, or relies on individual
   pages to redirect.
2. **Capture deferred target.** SvelteKit `redirect(303, ...)` can
   take a query-encoded `?next=` param. Reading it on the selector
   side requires a small bit of plumbing in the selector page's
   submit handler.
3. **Round-trip the URL.** Encode the full `url.pathname + url.search`
   so parameters (e.g. selected entityType, drawer state) survive.
4. **Test cases:**
   - Direct link to `/results/candidates/abc` with no election picked
     → bounce to `/elections?next=/results/candidates/abc` →
     bounce to `/constituencies?next=/results/candidates/abc` →
     finally land on `/results/candidates/abc`.
   - Direct link with multi-election + multi-const setup.
   - Direct link with single-election (auto-select) + multi-const.
   - Refresh on the located route after localStorage cleared
     mid-session.
5. **Add E2E coverage** — this should land alongside the v2.9
   determinism phase. Currently no E2E exercises this redirect path.

## Why this matters

Two real-world scenarios that hit this:

- A voter shares a result drawer URL on Twitter; the recipient hasn't
  located yet and lands on a broken page.
- A voter completes the flow, comes back the next day after browser
  cleared its session storage, and refreshing the URL bar shows them
  a half-broken page instead of the natural selector flow.

## Cross-references

- `.planning/milestones/v2.8-MILESTONE-AUDIT.md` — origin of this todo.
- `.planning/todos/pending/results-url-refactor-followups.md` —
  related; sharable URLs are a v2.9 candidate, and this redirect
  enables them.
- `.planning/todos/pending/frontend-project-id-scoping.md` — related;
  when project scoping lands, the bounce-target needs to know which
  project's selectors to invoke.

---

## Resolution (2026-05-12)

**Resolved by:** Phase 78 Plan 02 (CLEAN-02) — see
`.planning/phases/78-cleanup-hygiene-phase/78-02-SUMMARY.md`.

### What landed

1. `apps/frontend/src/routes/(voters)/(located)/+layout.ts` — augmented
   both `redirect(307, ...)` calls with a `?next=` query parameter
   carrying `encodeURIComponent(url.pathname + url.search)`. The value
   is guarded by a URL whitelist regex
   (`/^\/[a-z]{2}\/.*|^\/(results|questions|nominations)\b/`) that
   accepts locale-prefixed paths or bare voter-app route roots.
   Open-redirect targets (cross-origin, protocol-relative) yield an
   empty string and the redirect proceeds without a deferred target.
2. `apps/frontend/src/routes/(voters)/elections/+page.{ts,svelte}` —
   forward `next` past auto-redirects and the submit-handler `goto`.
3. `apps/frontend/src/routes/(voters)/constituencies/+page.{ts,svelte}` —
   forward `next` past auto-redirects; on successful submit, decode +
   re-validate against the whitelist regex (defense in depth), then
   `goto(decoded)`. On whitelist rejection, fall through to the default
   post-selection navigation.
4. NEW spec `tests/tests/specs/voter/voter-not-located-redirect.spec.ts`
   with 5 `CLEAN-02 — ` prefixed tests:
   - Direct link to `/results` → bounce twice → resume.
   - Direct link with extra query param → bounce twice → resume with
     param preserved.
   - Election pre-selected via URL → bounce ONLY to /constituencies →
     resume.
   - Refresh on located route after `localStorage.clear()` → reload
     resumes the URL-carried route params.
   - Open-redirect attempt (`?next=https://evil.example/phish`) →
     constituencies-side whitelist rejects → fallback to internal route.

### Scope deltas

- Path correction: the gate lives at `(voters)/(located)/+layout.ts` —
  no `[[lang=locale]]` URL prefix (locale via Paraglide `getLocale()`
  runtime). The original todo's path with `[[lang=locale]]` was a
  reasonable guess but did not match the actual route tree.
- Test 3 was implemented as "election pre-selected via URL" rather
  than "single-election auto-implied" because the default `voter-app`
  Playwright dataset has 2 elections (`test-election-1`,
  `test-election-2`). The chosen variant exercises the same
  `if (!constituencyId) redirect(307, ...)` branch that auto-implied
  elections would hit — equivalent code-path coverage without a
  variant project switch.
