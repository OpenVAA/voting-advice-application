/**
 * `RegistrationModeSelector`, mounted for real against a fake component context whose `t` returns its key.
 *
 * `selected` and `error` are handed over as accessor pairs, which is what a `bind:` at a call site compiles to, so that a write the selector makes reaches the parent. The panel is a raw snippet that renders a marker holding the mode it was given. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **No mode and one mode** — nothing, and the one panel with no group around it.
 * 2. **Several modes** — the group, its name, its radios, drawn by the input library's `Radio`, and their order, and no panel on arrival.
 * 3. **Choosing** — the chosen mode's panel is the only panel in the document, and focus stays where it was.
 * 4. **The group's error** — an alert under the options that describes the group, cleared by a choice.
 * 5. **What the group does not add** — no role, no `tabindex`, no form.
 * 6. **The export and the ids** — `focusFirst()`, and ids that two instances never share.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RegistrationMode } from '@openvaa/app-shared';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

/** The props each `Radio` of the input library was rendered with, read when it was rendered. */
const { radiosRendered } = vi.hoisted(() => ({
  radiosRendered: new Array<{ name: unknown; value: unknown }>()
}));

// The library's `Radio` is wrapped so that a case can tell which component rendered the radios. The wrapper renders the real one.
vi.mock('$lib/components/input', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const render = actual.Radio as unknown as (anchor: unknown, props: Record<string, unknown>) => unknown;
  return {
    ...actual,
    Radio: (anchor: unknown, props: Record<string, unknown>) => {
      radiosRendered.push({ name: props.name, value: props.value });
      return render(anchor, props);
    }
  };
});

const { RegistrationModeSelector } = await import('.');

const ALL: ReadonlyArray<RegistrationMode> = ['identity_provider', 'email', 'code'];
const ERROR = 'contestantApp.register.modes.required';

const OPTION = '[data-testid="register-mode-option"]';
const RADIO = '[data-testid="register-mode-input"]';
const PANEL = '[data-testid="register-mode-panel"]';
const GROUP_ERROR = '[data-testid="register-modes-error"]';
/** The marker the test's panel snippet renders. */
const MARKER = '[data-panel-of]';

/** A panel that says which mode it was rendered for. */
const panel = createRawSnippet<[RegistrationMode]>((mode) => ({
  render: () => `<p data-panel-of="${mode()}">panel of ${mode()}</p>`
}));

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  radiosRendered.length = 0;
});

type Harness = {
  /** The element the selector was mounted into. */
  target: HTMLElement;
  /** The two values a parent binds, as the parent sees them. */
  parent: { selected: RegistrationMode | undefined; error: string | undefined };
  /** The mounted selector's exports. */
  exports: { focusFirst: () => void };
};

/** Mount the selector with `selected` and `error` bound to a parent and return what a parent can reach. */
function render(props: Record<string, unknown> = {}): Harness {
  const parent = $state({
    selected: props.selected as RegistrationMode | undefined,
    error: props.error as string | undefined
  });
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(RegistrationModeSelector, {
    target,
    props: {
      modes: ALL,
      panel,
      ...props,
      get selected() {
        return parent.selected;
      },
      set selected(next: RegistrationMode | undefined) {
        parent.selected = next;
      },
      get error() {
        return parent.error;
      },
      set error(next: string | undefined) {
        parent.error = next;
      }
    } as never
  });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return { target, parent, exports: component as unknown as Harness['exports'] };
}

/** The group's radios, in document order. */
function radiosOf(target: HTMLElement): Array<HTMLInputElement> {
  return [...target.querySelectorAll<HTMLInputElement>(RADIO)];
}

/** The radio of one mode. */
function radioOf(target: HTMLElement, mode: RegistrationMode): HTMLInputElement {
  const found = radiosOf(target).filter((radio) => radio.value === mode);
  expect(found).toHaveLength(1);
  return found[0];
}

/** Choose a mode the way a browser reports a press on its radio. */
function choose(target: HTMLElement, mode: RegistrationMode): void {
  radioOf(target, mode).click();
  flushSync();
}

/** The modes whose panel is in the document, read from the markers the panel snippet renders. */
function panelsShown(target: HTMLElement): Array<string | null> {
  return [...target.querySelectorAll(MARKER)].map((marker) => marker.getAttribute('data-panel-of'));
}

describe('RegistrationModeSelector — no mode and one mode', () => {
  it('renders nothing when no mode is listed', () => {
    const { target } = render({ modes: [] });

    expect(target.querySelectorAll('*')).toHaveLength(0);
    expect(target.textContent?.trim()).toBe('');
  });

  it('renders the one mode’s panel directly: no fieldset, no legend, no radio and no option block', () => {
    const { target } = render({ modes: ['code'] });

    expect(panelsShown(target)).toEqual(['code']);
    expect(target.querySelector('fieldset')).toBeNull();
    expect(target.querySelector('legend')).toBeNull();
    expect(target.querySelector('input')).toBeNull();
    expect(target.querySelector(OPTION)).toBeNull();
    expect(target.querySelector(PANEL)).toBeNull();
  });

  it('renders the one panel for whichever mode is the one listed', () => {
    const { target } = render({ modes: ['identity_provider'] });

    expect(panelsShown(target)).toEqual(['identity_provider']);
  });
});

describe('RegistrationModeSelector — several modes', () => {
  it('renders one fieldset named by its legend', () => {
    const { target } = render();

    const fieldsets = target.querySelectorAll('fieldset');
    expect(fieldsets).toHaveLength(1);
    const legend = fieldsets[0].firstElementChild;
    expect(legend?.tagName).toBe('LEGEND');
    expect(legend?.textContent?.trim()).toBe('contestantApp.register.modes.legend');
    expect(fieldsets[0].hasAttribute('aria-label')).toBe(false);
    expect(fieldsets[0].hasAttribute('aria-labelledby')).toBe(false);
  });

  it('renders one native radio per mode, in the order given, all under the name `registrationMode`', () => {
    const { target } = render();

    const radios = radiosOf(target);
    expect(radios.map((radio) => radio.value)).toEqual(['identity_provider', 'email', 'code']);
    for (const radio of radios) {
      expect(radio.type).toBe('radio');
      expect(radio.name).toBe('registrationMode');
    }
  });

  it('renders each radio with the input library’s `Radio`, one per mode in the order given, under the group’s name', () => {
    const { target } = render();

    expect(radiosRendered.map((radio) => radio.value)).toEqual(['identity_provider', 'email', 'code']);
    expect(radiosRendered.map((radio) => radio.name)).toEqual([
      'registrationMode',
      'registrationMode',
      'registrationMode'
    ]);
    for (const radio of radiosOf(target)) {
      for (const name of ['radio', 'radio-primary', 'border']) expect(radio.classList.contains(name)).toBe(true);
    }
  });

  it('renders no `Radio` for one mode', () => {
    render({ modes: ['email'] });

    expect(radiosRendered).toEqual([]);
  });

  it('keeps the order it is given, whatever that order is', () => {
    const { target } = render({ modes: ['code', 'email'] });

    expect(radiosOf(target).map((radio) => radio.value)).toEqual(['code', 'email']);
  });

  it('has no mode chosen and no panel in the document on arrival', () => {
    const { target, parent } = render();

    expect(radiosOf(target).filter((radio) => radio.checked)).toHaveLength(0);
    expect(target.querySelector(PANEL)).toBeNull();
    expect(panelsShown(target)).toEqual([]);
    expect(parent.selected).toBeUndefined();
  });

  it('puts each radio in an option block that carries its mode, inside a label holding the option’s text', () => {
    const { target } = render();

    const options = [...target.querySelectorAll<HTMLElement>(OPTION)];
    expect(options.map((option) => option.getAttribute('data-mode'))).toEqual(['identity_provider', 'email', 'code']);
    const texts = options.map((option) => {
      const label = option.querySelector('label');
      expect(label?.querySelector(RADIO)).not.toBeNull();
      return label?.textContent?.trim();
    });
    expect(texts).toEqual([
      'contestantApp.register.modes.identityProvider',
      'contestantApp.register.modes.email',
      'contestantApp.register.modes.code'
    ]);
  });

  it('merges the caller’s class into the fieldset', () => {
    const { target } = render({ class: 'mt-lg' });

    const fieldset = target.querySelector('fieldset');
    expect(fieldset?.classList.contains('mt-lg')).toBe(true);
    expect(fieldset?.classList.contains('flex-col')).toBe(true);
  });
});

describe('RegistrationModeSelector — choosing', () => {
  it('renders the chosen mode’s panel inside its option block and hands the parent the mode', () => {
    const { target, parent } = render();

    choose(target, 'email');

    expect(parent.selected).toBe('email');
    const panels = [...target.querySelectorAll<HTMLElement>(PANEL)];
    expect(panels).toHaveLength(1);
    expect(panels[0].getAttribute('data-mode')).toBe('email');
    expect(panels[0].closest(OPTION)?.getAttribute('data-mode')).toBe('email');
    expect(panelsShown(target)).toEqual(['email']);
  });

  it('puts the panel after its radio’s label in the document', () => {
    const { target } = render();

    choose(target, 'code');

    const option = target.querySelector<HTMLElement>(`${OPTION}[data-mode="code"]`);
    expect([...(option?.children ?? [])].map((child) => child.tagName)).toEqual(['LABEL', 'DIV']);
    expect(option?.children[1].matches(PANEL)).toBe(true);
  });

  it('removes the first panel and renders the second when another mode is chosen', () => {
    const { target, parent } = render();

    choose(target, 'email');
    choose(target, 'code');

    expect(parent.selected).toBe('code');
    expect(panelsShown(target)).toEqual(['code']);
    expect(target.querySelectorAll(PANEL)).toHaveLength(1);
    expect(
      radiosOf(target)
        .filter((radio) => radio.checked)
        .map((radio) => radio.value)
    ).toEqual(['code']);
  });

  it('shows the panel of a mode the parent selected', () => {
    const { target, parent } = render({ selected: 'identity_provider' });

    expect(radioOf(target, 'identity_provider').checked).toBe(true);
    expect(panelsShown(target)).toEqual(['identity_provider']);

    parent.selected = 'code';
    flushSync();

    expect(radioOf(target, 'code').checked).toBe(true);
    expect(panelsShown(target)).toEqual(['code']);
  });

  it('leaves focus on the radio when a mode is chosen', () => {
    const { target } = render();
    const radio = radioOf(target, 'email');
    radio.focus();

    choose(target, 'email');

    expect(document.activeElement).toBe(radio);
  });
});

describe('RegistrationModeSelector — the group’s error', () => {
  it('renders no alert and describes the group by nothing without an error', () => {
    const { target } = render();

    expect(target.querySelector('[role="alert"]')).toBeNull();
    expect(target.querySelector('fieldset')?.hasAttribute('aria-describedby')).toBe(false);
  });

  it('renders the error as an alert under the options and names it as the fieldset’s description', () => {
    const { target } = render({ error: ERROR });

    const alert = target.querySelector<HTMLElement>(GROUP_ERROR);
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(alert?.textContent).toContain(ERROR);
    const fieldset = target.querySelector('fieldset');
    expect(alert?.id).toBeTruthy();
    expect(fieldset?.getAttribute('aria-describedby')).toBe(alert?.id);
    expect(fieldset?.lastElementChild).toBe(alert);
  });

  it('clears a bound error when a mode is chosen', () => {
    const { target, parent } = render({ error: ERROR });

    choose(target, 'code');

    expect(parent.error).toBeUndefined();
    expect(target.querySelector(GROUP_ERROR)).toBeNull();
    expect(target.querySelector('fieldset')?.hasAttribute('aria-describedby')).toBe(false);
  });
});

describe('RegistrationModeSelector — what the group does not add', () => {
  it('gives no element a role but the alert’s', () => {
    const { target } = render({ error: ERROR, selected: 'email' });

    const roles = [...target.querySelectorAll('[role]')].map((element) => element.getAttribute('role'));
    expect(roles).toEqual(['alert']);
  });

  it('sets no `tabindex` on a radio, so the group is one tab stop', () => {
    const { target } = render({ selected: 'email' });

    const radios = radiosOf(target);
    expect(radios).toHaveLength(3);
    for (const radio of radios) expect(radio.hasAttribute('tabindex')).toBe(false);
  });

  it('puts the radios in no form of its own', () => {
    const { target } = render({ selected: 'email' });

    expect(target.querySelector('form')).toBeNull();
    for (const radio of radiosOf(target)) expect(radio.form).toBeNull();
  });
});

describe('RegistrationModeSelector — the export and the ids', () => {
  it('focuses the first radio on `focusFirst()`', () => {
    const { target, exports } = render();

    exports.focusFirst();

    expect(document.activeElement).toBe(radiosOf(target)[0]);
  });

  it('gives two instances different ids for their errors', () => {
    const first = render({ error: ERROR });
    const second = render({ error: ERROR });

    const firstId = first.target.querySelector(GROUP_ERROR)?.id;
    const secondId = second.target.querySelector(GROUP_ERROR)?.id;
    expect(firstId).toBeTruthy();
    expect(secondId).toBeTruthy();
    expect(firstId).not.toBe(secondId);
  });

  it('uses an id it was given for the fieldset, and builds the error’s id from it', () => {
    const { target } = render({ id: 'modes', error: ERROR });

    expect(target.querySelector('fieldset')?.id).toBe('modes');
    expect(target.querySelector(GROUP_ERROR)?.id).toBe('modes-error');
  });
});
