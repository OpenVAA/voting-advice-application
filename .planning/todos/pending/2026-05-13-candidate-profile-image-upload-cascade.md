# candidate-profile.spec.ts image-upload cascade (v2.11+)

**Filed:** 2026-05-13 at Phase 79 Plan 02 close (DETERM-04 fix landed)
**Source:** Plan 02's D-12 1-run cold-start confirm; `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-02-SUMMARY.md`
**Severity:** MEDIUM (limited to test environment; does not block production candidate flows)
**Routed to:** v2.11+ candidate

## Symptom

After Phase 79 DETERM-04 fix landed, the next cascade source in `tests/tests/specs/candidate/candidate-profile.spec.ts`'s serial describe block became visible:

- **Test:** `should upload a profile image (CAND-03)` at line 164
- **Failure mode:** `waitForEvent('filechooser')` TIMEOUT — the file-chooser dialog never fires when the inner click target is engaged
- **Cascade impact:** 5 downstream tests in the same serial describe block cascade-skip:
  - `should persist profile image after page reload (CAND-12)`
  - `should show editable info fields on profile page (CAND-03)`
  - `A11Y-02 should persist bio after page reload`
  - `A11Y-02 should persist display name after page reload`
  - `A11Y-02 should persist social link after page reload`

This failure was previously masked by the DETERM-04 registration cascade (registration failed, ALL downstream tests cascade-skipped). With DETERM-04 fixed, the image-upload failure becomes the dominant cascade source.

## Root cause hypotheses (not investigated)

1. **imgproxy disabled in apps/supabase/supabase/config.toml:130-131** — `[storage.image_transformation]` is commented out. The image-upload flow may require imgproxy to be enabled for cold-start parity with Phase 73 baseline (Phase 73 had imgproxy in DATA_RACE pool, implying it was at least sometimes running).
2. **Phase 70 page-object drift** — `ProfilePage.uploadImage()` at `tests/tests/pages/candidate/ProfilePage.ts:24-37` navigates `imageArea.locator('label[tabindex="0"]')` but Phase 70 P03 refactored `Input.svelte:514-545` to a `<button>`. Already documented in `.planning/milestones/v2.9-phases/76-profile-a11y/deferred-items.md` §1.
3. **macOS Chromium filechooser race** — `waitForEvent('filechooser')` is a known race-prone API on macOS. Phase 76 P01 mitigated for the validation spec via a 500ms pre-filechooser settle delay; same approach may apply here.

## Recommended approach

1. **Reproduce in isolation** — `yarn test:e2e --project=candidate-app-mutation --workers=1 -g "should upload a profile image" --reporter=line`. Verify whether it fails standalone or only in the full cold-start chain.
2. **Try mitigations in order** (cheapest first):
   a. Fix `ProfilePage.uploadImage()` to use `imageArea.getByRole('button').first()` (per the Phase 76 deferred-items §1 recommendation).
   b. Add a 500ms pre-filechooser settle delay (per Phase 76 P01 mitigation pattern).
   c. Enable `[storage.image_transformation]` in `apps/supabase/supabase/config.toml` to bring back imgproxy.
3. **Verify**: full `candidate-app-mutation` project run shows zero cascade in the describe block. Optional: 1-run cold-start smoke.

## Impact on Phase 79 baseline

The 5 cascade-skipped tests classified into CASCADE pool in Phase 79's regen (per Phase 73 D-09 binding — pool is bound to IMGPROXY_TIED_TITLES, which the cascaded A11Y-02 / CAND-03 / CAND-12 tests are NOT — though the upstream "should upload a profile image (CAND-03)" IS in DATA_RACE per the binding). The image-upload test itself is in DATA_RACE; its downstream cascades land in CASCADE.

When this cascade is resolved, the affected tests should promote to PASS_LOCKED on the next constants regen.

## Cross-references

- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-02-SUMMARY.md` — Plan 02 close-out narrative
- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0.json` — D-12 confirm capture (shows the cascade)
- `.planning/milestones/v2.9-phases/76-profile-a11y/deferred-items.md` §1 — Phase 76 prior observation of the same page-object drift
- `apps/supabase/supabase/config.toml:130-131` — `[storage.image_transformation]` config
