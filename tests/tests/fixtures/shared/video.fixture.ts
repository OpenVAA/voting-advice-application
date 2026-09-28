/**
 * @file video fixture (shared — voter + candidate).
 *
 * Shared function-fixture for the generic `Video` component (apps/frontend/src/lib/components/video/Video.svelte). Authored standalone under tests/tests/fixtures/shared/ (NOT extended into a voter- or candidate-scoped composition root) so BOTH apps can consume the same surface via a direct `createVideoReader(page)` import — mirroring the standalone `feedbackDialog.fixture.ts` / `langSelectorFixture.fixture.ts` shape.
 *
 * Surface:
 *  - video: Locator         — testid-bound `video` anchor (Video.svelte root <div>).
 *  - expectVideo(present)   — assert the Video element is (not) VISIBLE.
 *
 * **Visibility-not-churn caveat (VERIFIED):** the Video root carries `class:hidden={!hasContent}` — it is hidden-not-destroyed (the element stays attached across page loads, toggled by the `hidden` class). So this reader asserts VISIBILITY, never mount/unmount:
 *  - `expectVideo(true)`  → `toBeVisible()`
 *  - `expectVideo(false)` → `toBeHidden()` (the element stays attached —
 *    hidden, not detached; equivalent to `not.toBeVisible()` for a hidden-not-destroyed element, and the lint-preferred form)
 *
 * **Rigidity contract**:
 *  - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 *  - All locators are testid-anchored via `testIds` (locale-resilient).
 *
 * Surface bound to:
 *  - apps/frontend/src/lib/components/video/Video.svelte root <div> (`data-testid="video"`, spread through `restProps` via `concatClass`).
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export interface VideoFixture {
  /** Locator for the generic Video component root (testid-anchored). */
  readonly video: Locator;
  /**
   * Assertion: the Video element is visible (`present=true`) or hidden (`present=false`). Because the element is hidden-not-destroyed, this is a VISIBILITY assertion — NOT a mount/unmount churn check.
   */
  expectVideo(present: boolean): Promise<void>;
}

/**
 * Create a Video reader bound to `page`.
 *
 * The Video Locator is testid-anchored to `video`. The element is rendered
 * (attached) but toggles visibility via `class:hidden={!hasContent}`, so the reader asserts visibility rather than attachment/detachment.
 */
export function createVideoReader(page: Page): VideoFixture {
  const video = page.getByTestId(testIds.shared.video);

  return {
    video,

    async expectVideo(present: boolean): Promise<void> {
      if (present) {
        await expect(video).toBeVisible();
      } else {
        // Hidden-not-destroyed: the element stays attached, toggled by the `hidden` class — `toBeHidden()` is the visible/hidden assertion (NOT a detachment check), equivalent to `not.toBeVisible()` here and the lint-preferred form (playwright/no-useless-not).
        await expect(video).toBeHidden();
      }
    }
  };
}
