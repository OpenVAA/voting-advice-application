/**
 * The phone sizes the phone-width specs check, and the emulation every one of them runs under.
 *
 * The emulation is a phone-sized viewport with `isMobile` and `hasTouch`, set over the project's own `Desktop Chrome` device. It is not a phone device descriptor: the user agent and the device scale factor stay those of desktop Chrome, and an action such as `check()` or `click()` is still a mouse action, not a tap. What it shows is layout at a phone's width and the touch-capable media queries.
 */

/** A viewport, in CSS pixels. */
export type PhoneViewport = { readonly width: number; readonly height: number };

/** The narrowest width the application supports, with the height of a phone of that width. */
export const NARROW_PHONE: PhoneViewport = { width: 320, height: 568 };

/** A common phone width, with the height of a phone of that width. */
export const COMMON_PHONE: PhoneViewport = { width: 390, height: 844 };

/** The two phone sizes a page must fit: the narrowest supported width and a common one. */
export const PHONE_VIEWPORTS: ReadonlyArray<PhoneViewport> = [NARROW_PHONE, COMMON_PHONE];

/**
 * The options a phone-width `describe` hands to `test.use`.
 * @param viewport - The phone size.
 * @returns The viewport, with `isMobile` and `hasTouch` set.
 */
export function phoneUse(viewport: PhoneViewport): {
  viewport: { width: number; height: number };
  isMobile: true;
  hasTouch: true;
} {
  return { viewport: { width: viewport.width, height: viewport.height }, isMobile: true, hasTouch: true };
}
