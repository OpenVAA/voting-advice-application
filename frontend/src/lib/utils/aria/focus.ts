// Utilities for focusing elements accessible by keyboard navigation
// Partly derived from example code at https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/ which is licensed according to the W3C Software License at https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document

/**
 * @description Set focus on descendant elements until the first focusable element is found.
 * @param el The element for which to find the first focusable descendant.
 * @returns true if a focusable element is found and focus is set.
 */
export function focusFirstDescendant(el: Element): boolean {
  for (const child of el.children) {
    if (attemptFocus(child) || focusFirstDescendant(child)) return true;
  }
  return false;
}

/**
 * @description Attempt to set focus on the current element.
 * @param el The element to attempt to focus on.
 * @returns true if element is focused
 */
export function attemptFocus(el: Element): boolean {
  if (!isFocusable(el)) return false;
  try {
    el.focus();
  } catch {
    return false;
  }
  return document.activeElement === el;
}

/**
 * Check whether the given element is focusable by keyboard navigation.
 * @param el Any HTML element
 * @returns true if the element is focusable
 */
export function isFocusable(el: Element): el is Element & { focus: () => void } {
  if ('tabIndex' in el) return (el.tabIndex as number) >= 0;
  if ('ariaHidden' in el && el.ariaHidden) return false;
  if ('disabled' in el && el.disabled) return false;
  switch (el.nodeName) {
    case 'A':
      return 'href' in el && el.href != null && (!('rel' in el) || el.rel !== 'ignore');
    case 'INPUT':
      return 'type' in el && el.type !== 'hidden';
    case 'BUTTON':
    case 'SELECT':
    case 'TEXTAREA':
      return true;
    default:
      return false;
  }
}
