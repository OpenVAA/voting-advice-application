import { expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

/** The size in pixels at or below which a label is drawn for assistive technology alone: the `sr-only` utility makes a box of one pixel. */
const SR_ONLY_SIZE_PX = 1;

/**
 * Assert that a form control's label is shown in the control's own row: its first label is drawn at a size a reader can see, and the two overlap vertically.
 *
 * @param control - The form control, which has at least one label.
 */
export async function expectLabelInRow(control: Locator): Promise<void> {
  await expect(control).toBeVisible();
  const boxes = await control.evaluate((element) => {
    const label = (element as HTMLInputElement).labels?.[0];
    const boxOf = (box: Element) => {
      const { top, bottom, width, height } = box.getBoundingClientRect();
      return { top, bottom, width, height };
    };
    return { control: boxOf(element), label: label ? boxOf(label) : null };
  });

  expect(boxes.label, 'the control has a label').not.toBeNull();
  const label = boxes.label!;
  expect(label.width, 'the label is drawn wider than a label for assistive technology alone').toBeGreaterThan(
    SR_ONLY_SIZE_PX
  );
  expect(label.height, 'the label is drawn taller than a label for assistive technology alone').toBeGreaterThan(
    SR_ONLY_SIZE_PX
  );
  const overlap = Math.min(label.bottom, boxes.control.bottom) - Math.max(label.top, boxes.control.top);
  expect(overlap, 'the label and its control overlap vertically, so they are in one row').toBeGreaterThan(0);
}

/** How many times its computed line height a label's box may be before it holds a second line: one line is a box one line height tall, two are twice that. */
const ONE_LINE_LIMIT = 1.5;

/**
 * Assert that a form control's first label is drawn on one line: the label's box is less than one and a half times its computed line height.
 *
 * @param control - The form control, which has at least one label.
 */
export async function expectLabelOnOneLine(control: Locator): Promise<void> {
  await expect(control).toBeVisible();
  const label = await control.evaluate((element) => {
    const first = (element as HTMLInputElement).labels?.[0];
    if (!first) return null;
    return {
      text: (first.textContent ?? '').trim(),
      height: first.getBoundingClientRect().height,
      lineHeight: parseFloat(getComputedStyle(first).lineHeight)
    };
  });

  expect(label, 'the control has a label').not.toBeNull();
  expect(label!.lineHeight, 'the label has a computed line height in pixels').toBeGreaterThan(0);
  expect(
    label!.height,
    `the label "${label!.text}" is one line tall: under ${ONE_LINE_LIMIT} times its line height of ${label!.lineHeight}px`
  ).toBeLessThan(ONE_LINE_LIMIT * label!.lineHeight);
}
