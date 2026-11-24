/**
 * Non-text contrast (WCAG 2.1 SC 1.4.11): the border of a control against what surrounds it.
 *
 * axe-core has no rule for SC 1.4.11, so an axe scan passes a control whose boundary cannot be seen. These helpers measure that boundary in the browser instead: the computed colour of the control's top border against the background its ancestors paint behind it.
 *
 * Every colour is resolved to sRGB by painting it onto a 1x1 canvas in the page and reading the pixel back, never by parsing the computed string, because Chromium may serialise a computed colour as `oklch()`, `oklab()` or `color()` rather than `rgb()`. Painting also composites a translucent colour over what lies under it, which is the colour the eye sees.
 */

import type { Locator, Page } from '@playwright/test';

/** An sRGB colour as three bytes, each 0-255. */
export type Rgb = readonly [number, number, number];

/** The colour schemes a contrast is measured in, in the order they are measured. */
export const COLOR_SCHEMES = ['light', 'dark'] as const;

/** One of {@link COLOR_SCHEMES}. */
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

/** The least contrast WCAG 2.1 SC 1.4.11 allows between a control's boundary and its surroundings. */
export const NON_TEXT_CONTRAST_MINIMUM = 3;

/**
 * The relative luminance of an sRGB colour, as WCAG 2.1 defines it.
 * @param rgb - The colour as three bytes.
 * @returns A value from 0 (black) to 1 (white).
 */
export function relativeLuminance([r, g, b]: Rgb): number {
  const linear = (byte: number): number => {
    const channel = byte / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * The WCAG 2.1 contrast ratio of two sRGB colours, in either order.
 * @param a - One colour.
 * @param b - The other colour.
 * @returns A value from 1 (equal luminance) to 21 (black on white).
 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Measure the contrast of an element's top border against the nearest opaque background behind it.
 *
 * The background is that of the nearest ancestor whose background is opaque, with the translucent backgrounds of any nearer ancestors composited over it; white when no ancestor paints one. The border's colour is composited over that background. The element's own background is not used: the border is what separates the control from its surroundings.
 * @param locator - The element, which must be attached.
 * @returns The contrast ratio, or 1 when the border has no width or no style, since such a border draws nothing.
 */
export async function measureBorderContrast(locator: Locator): Promise<number> {
  const colours = await locator.evaluate((element): { border: Rgb; background: Rgb } | null => {
    const style = getComputedStyle(element);
    if (!(parseFloat(style.borderTopWidth) > 0) || ['none', 'hidden'].includes(style.borderTopStyle)) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('measureBorderContrast: the page gave no 2D canvas context');

    const read = (): [number, number, number, number] => {
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a];
    };
    const paint = (colour: string): void => {
      // A string the canvas cannot parse leaves the previous fill style, so it is reset to transparent first.
      context.fillStyle = 'rgba(0, 0, 0, 0)';
      context.fillStyle = colour;
      context.fillRect(0, 0, 1, 1);
    };
    const alphaOf = (colour: string): number => {
      context.clearRect(0, 0, 1, 1);
      paint(colour);
      return read()[3];
    };

    // The backgrounds from the nearest ancestor outwards, up to and including the first opaque one.
    const layers: Array<string> = [];
    for (let node = element.parentElement; node; node = node.parentElement) {
      const colour = getComputedStyle(node).backgroundColor;
      const alpha = alphaOf(colour);
      if (alpha === 0) continue;
      layers.push(colour);
      if (alpha === 255) break;
    }

    context.clearRect(0, 0, 1, 1);
    paint('#ffffff');
    for (const colour of layers.reverse()) paint(colour);
    const [br, bg, bb] = read();
    paint(style.borderTopColor);
    const [r, g, b] = read();
    return { border: [r, g, b], background: [br, bg, bb] };
  });
  return colours ? contrastRatio(colours.border, colours.background) : 1;
}

/**
 * Measure an element's border contrast in each of {@link COLOR_SCHEMES}: emulate the scheme, open the view afresh and measure the element `open` returns.
 * @param page - The page, whose colour scheme is left at the last one measured.
 * @param open - Opens the view under the current scheme and returns the element to measure.
 * @returns The contrast ratio in each scheme.
 */
export async function measureBorderContrastInSchemes(
  page: Page,
  open: () => Promise<Locator>
): Promise<Record<ColorScheme, number>> {
  const ratios = {} as Record<ColorScheme, number>;
  for (const colorScheme of COLOR_SCHEMES) {
    await page.emulateMedia({ colorScheme });
    ratios[colorScheme] = await measureBorderContrast(await open());
  }
  return ratios;
}
