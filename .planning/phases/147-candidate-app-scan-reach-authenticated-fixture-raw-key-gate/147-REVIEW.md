---
phase: 147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate
reviewed: 2026-08-27T15:12:25Z
depth: deep
files_reviewed: 7
files_reviewed_list:
  - tests/tests/utils/axeScan.ts
  - tests/tests/specs/a11y/candidate-a11y.spec.ts
  - tests/tests/specs/a11y/a11y-smoke.spec.ts
  - tests/playwright.config.ts
  - tests/tests/utils/rawKeyScan.ts
  - tests/tests/fixtures/shared/forensicCapture.fixture.ts
  - tests/README.md
findings:
  critical: 0
  warning: 2
  info: 0
  total: 2
status: issues_found
---

# Phase 147: Code Review Report

**Reviewed:** 2026-08-27T15:12:25Z
**Depth:** deep
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the extraction of the shared a11y scan core (`axeScan.ts`), the new candidate
`(protected)`-route scan (`candidate-a11y.spec.ts`), the re-pointed voter spec, the
`candidate-a11y-scan` project wiring in `playwright.config.ts`, the short-circuit-removal
change in `rawKeyScan.ts`, and the two incidental doc/comment touch-ups
(`forensicCapture.fixture.ts`, `tests/README.md`).

The phase's central claim — that the candidate half cannot be less strict than the voter
half because both import one shared scan core — holds up under adversarial reading:
`assertAxeGates` takes no per-surface parameter, `candidate-a11y.spec.ts` declares no
violation assertion, tag filtering, `.skip()`/`.fixme()` of its own, and the newly-added
`testMatch` on both a11y projects (`playwright.config.ts`) closes the one way this wiring
could previously have been silently wrong (the voter project's bare `testDir` collecting
the candidate spec and running it unauthenticated). The reach proof (`assertCandidateReach`)
is structurally forced onto every entry via `toScanEntry`, runs before the content anchor,
and is well-targeted (verified against the frontend source that the `(protected)` layout
and the per-entry markers used as `postLoginTestId` are genuinely authenticated-only). The
`rawKeyScan.ts` split into `collectRawI18nKeyFindings` (detection, unchanged) +
`assertNoRawI18nKeys` (kept, unused by the new pipeline) is verified byte-for-byte against
the pre-phase version for everything above the split point — the detection logic and
key-set derivation were not touched.

No BLOCKER-class finding was found: I could not construct a case where the candidate scan
is less strict than the voter scan, nor a case where a reach-proof gap or the `expect.soft`
reporting change lets a real defect pass silently. Two WARNING-class findings remain, both
about test-suite honesty/reliability rather than a live false-pass:

1. A stale docblock claim in `a11y-smoke.spec.ts` that survived the phase's own dedicated
   record-correction pass and now misdescribes the exact mechanism (short-circuiting vs.
   soft-reporting) the phase changed.
2. A regex in the reach proof that is unanchored against the full URL (including query
   string), which is a false-**fail** risk rather than a false-pass risk, but is exactly
   the kind of test-reliability smell the review was asked to surface.

## Warnings

### WR-01: Stale docblock claim survives the phase's own "no comment lies" cleanup pass

**File:** `tests/tests/specs/a11y/a11y-smoke.spec.ts:65`
**Issue:** The file's own top-of-file docblock still says:

```
 * Each scan: (navigate) → optional reach-the-target `settle` → REQUIRED
 * `contentTestId` wait (the LAST gate; NEVER a network-idle settle) →
 * `awaitAnimationsSettled` → raw-i18n-key gate (`assertNoRawI18nKeys`, F2) →
 * run AxeBuilder.withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()
 * → assert per-rule 0-violation gate + global 0-violation gate.
```

`assertNoRawI18nKeys` is the OLD, throwing, short-circuiting entry point
(`tests/tests/utils/rawKeyScan.ts:389`). The actual pipeline this file's scans run through
(`assertAxeScan` in `tests/tests/utils/axeScan.ts:298`) calls `collectRawI18nKeyFindings`
and reports the verdict via `expect.soft` (axeScan.ts:325) — deliberately **not**
`assertNoRawI18nKeys` — specifically so a raw-key finding cannot suppress the axe result on
the same surface (`147-ORDERING.md` § Decision (B), which this same review scope's
`rawKeyScan.ts` docblock at lines 50 and 329 describes correctly).

This is not a hypothetical drift: commit `a882f24b5` ("docs(147-03): correct the records
this plan made false…") is a dedicated pass through this exact file, whose own message
claims "the tree does not carry a comment that lies" and enumerates five corrected records
in this file and its siblings — but it did not touch this line, which is the same class of
staleness (a comment describing pre-Decision-(B) throwing semantics) it was written to
eliminate. A reader relying on this docblock — in a suite whose stated purpose is "not to
lie about what it checked" — would conclude a raw-key defect on a voter surface still hides
the axe verdict on that surface, which is false.

**Fix:** Update the phrase to name the actual mechanism, e.g.:

```
 * `awaitAnimationsSettled` → raw-i18n-key verdict (`collectRawI18nKeyFindings`, reported
 * via `expect.soft`, F2 — does not suppress the axe result, see Decision (B)) →
```

### WR-02: Reach-proof login-URL regex is unanchored against the query string

**File:** `tests/tests/specs/a11y/candidate-a11y.spec.ts:170`, used at `:217-222`
**Issue:**

```ts
const CANDIDATE_LOGIN_URL = /\/candidate\/login(\/|$|\?|#)/;
...
expect(
  settledUrl,
  `"${label}" settled on the candidate LOGIN route — the stored session did not survive, so this scan ` +
    `would have reported a verdict about a login form: ${settledUrl}`
).not.toMatch(CANDIDATE_LOGIN_URL);
```

`settledUrl` is the whole `page.url()` string, and the regex has no anchor tying the match
to the *path*. It matches anywhere in the string, including the query string. If any of the
seven candidate routes ever settles on a URL that legitimately carries the substring
`/candidate/login` in a query parameter — e.g. a `redirectedFrom=/candidate/login` or
`returnTo=` param on an authenticated page (a common pattern for post-login redirects and
already present elsewhere in this app's routes) — this assertion fails even though the page
is genuinely the authenticated candidate surface the scan is supposed to be checking. That
is a false failure of the reach proof, not a false pass, but it is exactly the kind of
test-reliability smell the review is asked to catch in "the new spec and config wiring":
a scan that is actually reaching the right page can go red for a reason unrelated to the
property it is asserting.

`CANDIDATE_APP_URL` at line 168 (`/\/candidate(\/|$|\?|#)/`) has the same shape but is lower
risk since a positive match (`toMatch`) failing loudly on an unexpected URL is the safe
direction; `CANDIDATE_LOGIN_URL` is used with `.not.toMatch(...)`, so its false-positive
direction is a spurious CI failure on an otherwise-correct scan.

**Fix:** Match against the pathname only, not the full URL string:

```ts
const settledPath = new URL(settledUrl).pathname;
expect(settledPath, `...`).not.toMatch(CANDIDATE_LOGIN_URL);
```

(same treatment could be applied to `CANDIDATE_APP_URL` for consistency, though its
false-positive direction is currently benign).

---

_Reviewed: 2026-08-27T15:12:25Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
