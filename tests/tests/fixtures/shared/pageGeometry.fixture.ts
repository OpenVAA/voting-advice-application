/**
 * @file pageGeometry fixture.
 *
 * Function-fixture for what an accessibility scan cannot report: whether a page is wider than its viewport, and where the boxes of its elements lie in relation to each other. It holds no locator of its own. A page fixture that knows its elements hands them over, so a spec speaks of a page that fits and of a row whose controls fit, and never of boxes.
 *
 * Surface:
 *  - expectNoHorizontalOverflow()          — the document is no wider than its viewport.
 *  - expectWithinViewportWidth(target)     — the box of `target` lies between the viewport's left and right edges.
 *  - expectShowsWholeText(target)          — the content of `target` does not reach beyond its own box.
 *  - expectInside(inner, outer)            — the whole box of `inner` lies inside the box of `outer`.
 *  - expectNoOverlap(a, b)                 — the boxes of `a` and `b` do not intersect.
 *  - expectAtLeast(target, width, height)  — the box of `target` is at least that wide and that high, in CSS pixels.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import type { Locator, Page } from '@playwright/test';

/** The box of an element, in CSS pixels of the page. */
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The least width and height of a pointer target, in CSS pixels. */
export const MIN_TARGET_SIZE = 44;

/** How many elements a failed page-width check names. */
const MAX_NAMED_ELEMENTS = 12;

/** How far two edges may differ and still count as the same edge: a box's edges are fractions of a pixel once a layout rounds. */
const EDGE_TOLERANCE = 0.5;

/**
 * Create the geometry steps for one page.
 *
 * @param page - The page the steps measure.
 * @returns The fixture's steps.
 */
export function createPageGeometry(page: Page) {
  /**
   * The box of a visible element.
   * @throws If the element has no box, which is the case for one that is not rendered.
   */
  async function boxOf(element: Locator, what: string): Promise<Box> {
    await expect(element, `${what} is visible`).toBeVisible({ timeout: TIMEOUTS.page });
    const box = await element.boundingBox();
    if (!box) throw new Error(`pageGeometry: ${what} has no box`);
    return box;
  }

  return {
    /**
     * Assert that the document is no wider than its viewport. A failure names the elements that reach furthest beyond the viewport's right edge, widest reach first, so that it says what does not fit and not only by how much.
     *
     * The measure is the root element's own width against the width of what it holds. Under a mobile descriptor the layout viewport grows to the content, so the width of the viewport itself equals the content's width and measures nothing.
     */
    async expectNoHorizontalOverflow(): Promise<void> {
      await expect
        .poll(
          () =>
            page.evaluate((maxNamed) => {
              const root = document.documentElement;
              const overflow = root.scrollWidth - root.clientWidth;
              if (overflow <= 0) return { overflow: 0, beyondViewport: [] as Array<string> };
              const beyondViewport = [...document.body.querySelectorAll('*')]
                .map((element) => ({ element, box: element.getBoundingClientRect() }))
                .filter(({ box }) => box.width > 0 && box.right > root.clientWidth + 0.5)
                .sort((first, second) => second.box.right - first.box.right)
                .slice(0, maxNamed)
                .map(({ element, box }) => {
                  const testId = element.getAttribute('data-testid');
                  const classes = (element.getAttribute('class') ?? '').trim().slice(0, 90);
                  const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
                  return (
                    `<${element.tagName.toLowerCase()}${testId ? ` data-testid="${testId}"` : ''} class="${classes}">` +
                    ` right ${Math.round(box.right)}, width ${Math.round(box.width)}, text "${text}"`
                  );
                });
              return { overflow, beyondViewport };
            }, MAX_NAMED_ELEMENTS),
          { message: 'the document must not be wider than its viewport', timeout: TIMEOUTS.page }
        )
        .toEqual({ overflow: 0, beyondViewport: [] });
    },

    /**
     * Assert that the box of `target` lies between the left and the right edge of the viewport, wherever the page is scrolled to vertically. The page's own width does not show an element that a clipping container holds beyond the viewport's edge; its box does.
     * @param what - What the element is, for the failure message.
     */
    async expectWithinViewportWidth(target: Locator, what: string): Promise<void> {
      const box = await boxOf(target, what);
      const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(box.x, `${what}: the left edge`).toBeGreaterThanOrEqual(-EDGE_TOLERANCE);
      expect(box.x + box.width, `${what}: the right edge`).toBeLessThanOrEqual(viewportWidth + EDGE_TOLERANCE);
    },

    /**
     * Assert that the content of `target` does not reach beyond its own box: a text kept on one line in an element narrower than the line runs out of the element, over whatever is beside it, and its box does not show that.
     * @param what - What the element is, for the failure message.
     */
    async expectShowsWholeText(target: Locator, what: string): Promise<void> {
      await expect(target, `${what} is visible`).toBeVisible({ timeout: TIMEOUTS.page });
      const beyond = await target.evaluate((element) => ({
        width: element.scrollWidth - element.clientWidth,
        height: element.scrollHeight - element.clientHeight
      }));
      expect(beyond.width, `${what}: how far its content reaches beyond its width`).toBeLessThanOrEqual(1);
      expect(beyond.height, `${what}: how far its content reaches beyond its height`).toBeLessThanOrEqual(1);
    },

    /**
     * Assert that the whole box of `inner` lies inside the box of `outer`: an element that a clipping container cuts off, or pushes out of itself, fails.
     * @param inner - The element that must fit.
     * @param outer - The element it must fit into.
     * @param what - What the two are, for the failure message.
     */
    async expectInside(inner: Locator, outer: Locator, what: string): Promise<void> {
      const innerBox = await boxOf(inner, `${what}: the inner element`);
      const outerBox = await boxOf(outer, `${what}: the outer element`);
      expect(innerBox.x, `${what}: the left edge`).toBeGreaterThanOrEqual(outerBox.x - EDGE_TOLERANCE);
      expect(innerBox.y, `${what}: the top edge`).toBeGreaterThanOrEqual(outerBox.y - EDGE_TOLERANCE);
      expect(innerBox.x + innerBox.width, `${what}: the right edge`).toBeLessThanOrEqual(
        outerBox.x + outerBox.width + EDGE_TOLERANCE
      );
      expect(innerBox.y + innerBox.height, `${what}: the bottom edge`).toBeLessThanOrEqual(
        outerBox.y + outerBox.height + EDGE_TOLERANCE
      );
    },

    /**
     * Assert that the boxes of `a` and `b` do not intersect: they lie side by side or one above the other.
     * @param what - What the two are, for the failure message.
     */
    async expectNoOverlap(a: Locator, b: Locator, what: string): Promise<void> {
      const boxA = await boxOf(a, `${what}: the first element`);
      const boxB = await boxOf(b, `${what}: the second element`);
      const apartHorizontally =
        boxA.x + boxA.width <= boxB.x + EDGE_TOLERANCE || boxB.x + boxB.width <= boxA.x + EDGE_TOLERANCE;
      const apartVertically =
        boxA.y + boxA.height <= boxB.y + EDGE_TOLERANCE || boxB.y + boxB.height <= boxA.y + EDGE_TOLERANCE;
      expect(
        apartHorizontally || apartVertically,
        `${what}: the boxes ${JSON.stringify(boxA)} and ${JSON.stringify(boxB)} must not intersect`
      ).toBe(true);
    },

    /**
     * Assert that the box of `target` is at least `width` wide and `height` high, in CSS pixels.
     * @param what - What the element is, for the failure message.
     */
    async expectAtLeast(target: Locator, width: number, height: number, what: string): Promise<void> {
      const box = await boxOf(target, what);
      expect(box.width, `${what}: the width`).toBeGreaterThanOrEqual(width);
      expect(box.height, `${what}: the height`).toBeGreaterThanOrEqual(height);
    }
  };
}

/** The steps of the page-geometry fixture. */
export type PageGeometryFixture = ReturnType<typeof createPageGeometry>;
