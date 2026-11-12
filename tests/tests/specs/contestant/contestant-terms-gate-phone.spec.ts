import { test } from '../../fixtures/contestant/contestant-terms-gate-phone';

/**
 * # The terms-of-use view at phone width
 *
 * A signed-in user who has not accepted the terms of use is shown the terms-of-use view at every protected URL, and cannot enter the Contestant App without ticking its checkbox. This spec opens the view under a phone descriptor at two widths and holds that the view fits: the document does not overflow sideways, the checkbox lies wholly inside the viewport, it can be ticked, and ticking it enables Continue.
 *
 * ## The session
 *
 * The spec runs under the stored session of the user who has not accepted the terms of use (`TERMS_PENDING_STORAGE_STATE`, named by its Playwright project). That session is read-only for the run: the axe scans of the same view load the same file. Ticking the box is page state and is gone with the page; nothing here presses Continue or signs out, and the spec writes nothing.
 *
 * ## The descriptor
 *
 * Each width has its own `describe`, which sets the viewport with the suite's phone descriptor (`isMobile` and `hasTouch`). The overflow is asserted first, so that a view that is too wide fails by saying so.
 *
 * Rigidity contract: hard assertions only, every locator behind a fixture.
 */

const PHONE_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 390, height: 844 }
];

for (const viewport of PHONE_VIEWPORTS) {
  test.describe(`the terms-of-use view at ${viewport.width}px wide`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true });

    test('fits the viewport, and its checkbox is on screen and can be ticked', async ({ termsOfUseGate }) => {
      await termsOfUseGate.open();
      await termsOfUseGate.expectNoHorizontalOverflow();
      await termsOfUseGate.expectCheckboxInsideViewport();
      await termsOfUseGate.tick();
      await termsOfUseGate.expectContinueEnabled();
    });
  });
}
