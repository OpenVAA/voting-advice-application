/**
 * @file screenShape fixture.
 *
 * Reads what a screen shows as plain data, so that two visits to one screen can be compared with each other: the screen's own state attributes, the lines of text it shows, and its controls in document order.
 *
 * For screens that must look the same whatever the server knows about what a visitor typed. A page fixture that knows its screen's root hands it over together with the values the visitor typed, which are replaced in everything read: two visits that differ only in what was typed then read alike, and nothing typed ends up in a report.
 *
 * The reading holds no id of an element, because ids are generated per render, and no value of a control: a control is read as filled or empty.
 *
 * Surface:
 *  - readScreenShape(root, masked) — the shape of the screen under `root`.
 */

import type { Locator } from '@playwright/test';

/** What stands in a reading where a masked value was. */
const MASK = '‹typed›';

/** One control of a screen as a comparison reads it. */
export interface ControlShape {
  /** The control's test id, or the empty string. */
  testId: string;
  /** The element's name, lower-case. */
  tag: string;
  /** The `type`, `name`, `autocomplete` and `href` attributes, each the empty string where absent. */
  type: string;
  name: string;
  autocomplete: string;
  href: string;
  /** The text the control shows. */
  text: string;
  /** Whether the control is disabled, natively or by `aria-disabled`. */
  unavailable: boolean;
  /** Whether the control is marked invalid. */
  invalid: boolean;
  /** Whether the control names a description. */
  described: boolean;
  /** Whether the control holds a value. */
  filled: boolean;
}

/** A screen as a comparison reads it. */
export interface ScreenShape {
  /** Every `data-` attribute of the screen's root except its test id, by name. */
  state: Record<string, string>;
  /** The lines of text the screen shows, in order, without empty lines. */
  text: Array<string>;
  /** The links, buttons and form controls of the screen, in document order. */
  controls: Array<ControlShape>;
}

/**
 * Read the shape of a screen.
 *
 * The screen is read as it is at the moment of the call: the caller first asserts the state it means to compare, so that a screen still settling is not read.
 *
 * @param root - The screen's root element.
 * @param masked - The values the visitor typed. Each is replaced wherever it is read, as it is and percent-escaped, in text and in attributes alike: a link may carry a typed value in its address.
 * @returns The screen's state attributes, text lines and controls.
 */
export function readScreenShape(root: Locator, masked: ReadonlyArray<string>): Promise<ScreenShape> {
  return root.evaluate(
    (element, { values, mask }) => {
      const hide = (text: string): string => values.reduce((hidden, value) => hidden.split(value).join(mask), text);
      const attribute = (control: Element, name: string): string => hide(control.getAttribute(name) ?? '');

      const state: Record<string, string> = {};
      for (const { name, value } of Array.from(element.attributes)) {
        if (name.startsWith('data-') && name !== 'data-testid') state[name] = hide(value);
      }

      const text = hide((element as HTMLElement).innerText)
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');

      const controls = Array.from(
        element.querySelectorAll('a[href], button, input, select, textarea, [role="button"]')
      ).map((control) => ({
        testId: attribute(control, 'data-testid'),
        tag: control.tagName.toLowerCase(),
        type: attribute(control, 'type'),
        name: attribute(control, 'name'),
        autocomplete: attribute(control, 'autocomplete'),
        href: attribute(control, 'href'),
        text: hide((control as HTMLElement).innerText ?? '').trim(),
        unavailable:
          (control as HTMLButtonElement).disabled === true || control.getAttribute('aria-disabled') === 'true',
        invalid: control.getAttribute('aria-invalid') === 'true',
        described: control.hasAttribute('aria-describedby'),
        filled: 'value' in control && typeof control.value === 'string' && control.value !== ''
      }));

      return { state, text, controls };
    },
    { values: masked.flatMap((value) => [value, encodeURIComponent(value)]), mask: MASK }
  );
}
