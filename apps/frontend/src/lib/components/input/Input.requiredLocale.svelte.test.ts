/**
 * The `required` rule of `Input`'s two multilingual text kinds, with and without `requiredLocale`.
 *
 *  - The first group holds what a caller that does not pass the prop gets: the badge judged on the whole value, one field until the translations are revealed, the displayed locale first. Its expectations are literals, not readings of the component.
 *  - The second group holds the rule the prop adds: the badge judged on one locale's entry, that locale's field on screen while the translations are hidden, and the required language named under the field.
 *  - The third group holds the language each locale's field and language label declare, which every multilingual input has.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InputProps } from './Input.type';

/**
 * Hoisted so the context factory below can close over it: `vi.mock` factories are lifted above the module body. Three locales, so that "the required locale" and "the rest" are different fields, and the required one is last in the supported order.
 */
const { i18n } = vi.hoisted(() => ({
  i18n: { locale: 'en', locales: ['en', 'fi', 'sv'] as ReadonlyArray<string> }
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    get locale() {
      return i18n.locale;
    },
    get locales() {
      return i18n.locales;
    },
    // A message with a payload renders as its key followed by the payload, so a case can read which language a sentence names.
    t: (key: string, payload?: Record<string, unknown>) => (payload ? `${key} ${JSON.stringify(payload)}` : key),
    translate: (value: unknown) => (typeof value === 'string' ? value : ''),
    darkMode: false
  })
}));

const Input = (await import('./Input.svelte')).default;

/** The id every subject is mounted with, so that derived ids are literals. */
const ID = 'subject';
/** The show/hide-translations control. */
const TOGGLE = '[data-testid="multilingual-toggle"]';
/** Every locale field of either multilingual kind. */
const FIELD = 'input[type="text"], textarea';
/** The sentence the mocked `t` renders for the required language `locale`. */
function requiredLanguageSentence(locale: string): string {
  return `components.input.requiredLocaleInfo ${JSON.stringify({ language: `lang.${locale}` })}`;
}

type MultilingualKind = 'text-multilingual' | 'textarea-multilingual';

type SubjectProps = {
  type?: MultilingualKind | 'multiple-text-multilingual';
  value?: LocalizedString | Array<LocalizedString> | null;
  required?: boolean;
  locked?: boolean;
  requiredLocale?: string;
  info?: string;
  multilingualInfo?: string;
  onChange?: (value: unknown) => void;
};

let target: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

function mountSubject({ type = 'text-multilingual', ...props }: SubjectProps): void {
  target = document.createElement('div');
  document.body.appendChild(target);
  component = mount(Input, { target, props: { label: 'Name', id: ID, type, ...props } as InputProps });
  flushSync();
}

/** Every locale field in the DOM, in document order. */
function fields(): Array<HTMLInputElement | HTMLTextAreaElement> {
  return [...target.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(FIELD)];
}

/** The ids of the rendered locale fields, in document order. */
function fieldIds(): Array<string> {
  return fields().map((field) => field.id);
}

/** Whether the `required` badge is rendered. Its screen-reader text is the translation key, because the mocked `t` returns keys. */
function hasRequiredBadge(): boolean {
  return [...target.querySelectorAll('.sr-only')].some((element) => element.textContent === 'common.required');
}

/** The locales whose language label is rendered and not held at zero opacity. */
function visibleLanguageLabels(): Array<string> {
  return [...target.querySelectorAll<HTMLElement>(`label[id^="${ID}-label-"]`)]
    .filter((label) => !label.classList.contains('opacity-0'))
    .map((label) => label.id.slice(`${ID}-label-`.length));
}

/** The text of the info line under the field, or an empty string when none is rendered. */
function infoText(): string {
  return target.querySelector('.small-info')?.textContent?.trim() ?? '';
}

function toggleTranslations(): void {
  const toggle = target.querySelector<HTMLElement>(TOGGLE);
  expect(toggle, 'expected the translations toggle to be rendered').not.toBeNull();
  toggle!.click();
  flushSync();
}

/** Commit `text` in the field of `locale`. */
function commit(locale: string, text: string): void {
  const field = target.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${ID}-${locale}`);
  expect(field, `expected the ${locale} field to be rendered`).not.toBeNull();
  field!.value = text;
  field!.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

beforeEach(() => {
  i18n.locale = 'en';
  i18n.locales = ['en', 'fi', 'sv'];
});

afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  target.remove();
});

describe('a required multilingual input without a required locale', () => {
  it('shows no badge when any one locale holds text, and renders the displayed locale alone until the translations are revealed', () => {
    mountSubject({ required: true, value: { sv: 'Namn' } });

    expect(hasRequiredBadge()).toBe(false);
    expect(fieldIds()).toEqual([`${ID}-en`]);
    expect(fields()[0].getAttribute('aria-labelledby')).toBe(`${ID}-label ${ID}-label-en`);
    expect(visibleLanguageLabels()).toEqual([]);

    toggleTranslations();

    expect(fieldIds()).toEqual([`${ID}-en`, `${ID}-fi`, `${ID}-sv`]);
    expect(fields().map((field) => field.getAttribute('aria-labelledby'))).toEqual([
      `${ID}-label ${ID}-label-en`,
      `${ID}-label ${ID}-label-fi`,
      `${ID}-label ${ID}-label-sv`
    ]);
    expect(visibleLanguageLabels()).toEqual(['en', 'fi', 'sv']);
  });

  it.each([
    { state: 'editable', locked: false },
    { state: 'locked', locked: true }
  ])('shows the badge on an empty value while $state', ({ locked }) => {
    mountSubject({ required: true, locked, value: {} });

    expect(hasRequiredBadge()).toBe(true);
  });

  it('appends its multilingual line to the info and names no required language', () => {
    mountSubject({ required: true, info: 'Help.', value: {} });

    expect(infoText()).toBe('Help. components.input.multilingualInfo');
  });

  it('applies the whole-value rule when the required locale is not a supported one', () => {
    mountSubject({ required: true, requiredLocale: 'xx', value: { sv: 'Namn' } });

    expect(hasRequiredBadge()).toBe(false);
    expect(fieldIds()).toEqual([`${ID}-en`]);
    expect(infoText()).toBe('components.input.multilingualInfo');
  });

  it('changes nothing when a required locale is passed to an input that is not required', () => {
    mountSubject({ requiredLocale: 'sv', value: {} });

    expect(hasRequiredBadge()).toBe(false);
    expect(fieldIds()).toEqual([`${ID}-en`]);
    expect(visibleLanguageLabels()).toEqual([]);
    expect(infoText()).toBe('components.input.multilingualInfo');
    expect(target.querySelectorAll('[aria-required]')).toHaveLength(0);
  });
});

describe('a required multilingual input with a required locale', () => {
  it.each<MultilingualKind>(['text-multilingual', 'textarea-multilingual'])(
    'renders the required locale of a %s input after the displayed one while the translations are hidden, each under a visible language label',
    (type) => {
      mountSubject({ type, required: true, requiredLocale: 'sv', value: { en: 'Name' } });

      expect(fieldIds()).toEqual([`${ID}-en`, `${ID}-sv`]);
      expect(visibleLanguageLabels()).toEqual(['en', 'sv']);
      expect(fields().map((field) => field.getAttribute('aria-required'))).toEqual([null, 'true']);
    }
  );

  it('shows the badge while the required entry is blank, whatever the other entries hold', () => {
    mountSubject({ required: true, requiredLocale: 'sv', value: { en: 'Name', fi: 'Nimi', sv: '  ' } });

    expect(hasRequiredBadge()).toBe(true);
  });

  it('shows no badge once the required entry holds text and every other entry is blank', () => {
    mountSubject({ required: true, requiredLocale: 'sv', value: { sv: 'Namn' } });

    expect(hasRequiredBadge()).toBe(false);
  });

  it('takes the badge off when text is committed in the required field', () => {
    const emitted: Array<unknown> = [];
    mountSubject({ required: true, requiredLocale: 'sv', value: { en: 'Name' }, onChange: (v) => emitted.push(v) });
    expect(hasRequiredBadge()).toBe(true);

    commit('sv', 'Namn');

    expect(hasRequiredBadge()).toBe(false);
    expect(emitted.at(-1)).toEqual({ en: 'Name', sv: 'Namn' });
  });

  it('orders the fields displayed, required, the rest, and moves no field when the translations are revealed', () => {
    mountSubject({ required: true, requiredLocale: 'sv', value: {} });
    expect(fieldIds()).toEqual([`${ID}-en`, `${ID}-sv`]);
    const [displayed, required] = fields();

    toggleTranslations();

    expect(fieldIds()).toEqual([`${ID}-en`, `${ID}-sv`, `${ID}-fi`]);
    expect(fields()[0]).toBe(displayed);
    expect(fields()[1]).toBe(required);
    expect(fields().map((field) => field.getAttribute('aria-required'))).toEqual([null, 'true', null]);
  });

  it('renders one field when the required locale is the displayed one, and marks it required', () => {
    mountSubject({ required: true, requiredLocale: 'en', value: {} });

    expect(fieldIds()).toEqual([`${ID}-en`]);
    expect(visibleLanguageLabels()).toEqual([]);
    expect(fields()[0].getAttribute('aria-required')).toBe('true');
    expect(hasRequiredBadge()).toBe(true);
  });

  it('ends the info line with the required language, named by its own name', () => {
    mountSubject({ required: true, requiredLocale: 'sv', info: 'Help.', value: {} });

    expect(infoText()).toBe(`Help. components.input.multilingualInfo ${requiredLanguageSentence('sv')}`);
  });

  it('shows the required language alone when the caller switches the multilingual line off', () => {
    mountSubject({ required: true, requiredLocale: 'sv', multilingualInfo: '', value: {} });

    expect(infoText()).toBe(requiredLanguageSentence('sv'));
  });

  it('renders a single field, no toggle and no required-language line when one locale is supported', () => {
    i18n.locales = ['en'];
    mountSubject({ required: true, requiredLocale: 'en', value: {} });

    expect(fieldIds()).toEqual([`${ID}-en`]);
    expect(target.querySelector(TOGGLE)).toBeNull();
    expect(infoText()).toBe('');
    expect(fields()[0].getAttribute('aria-required')).toBe('true');
  });
});

describe('the language of a locale field', () => {
  it.each<MultilingualKind>(['text-multilingual', 'textarea-multilingual'])(
    'declares the locale on each field of a %s input and on its language label',
    (type) => {
      mountSubject({ type, value: { en: 'Name' } });
      toggleTranslations();

      expect(fields().map((field) => field.getAttribute('lang'))).toEqual(['en', 'fi', 'sv']);
      for (const locale of i18n.locales) {
        const label = target.querySelector(`#${ID}-label-${locale}`);
        expect(label?.getAttribute('lang'), `the ${locale} language label`).toBe(locale);
      }
    }
  );

  it('declares the locale on each field of a multilingual multi-text row and on its language label', () => {
    mountSubject({ type: 'multiple-text-multilingual', value: [{ en: 'First' }] });
    toggleTranslations();

    expect(fields().map((field) => field.getAttribute('lang'))).toEqual(['en', 'fi', 'sv']);
    for (const locale of i18n.locales) {
      const label = target.querySelector(`#${ID}-label-0-${locale}`);
      expect(label?.getAttribute('lang'), `the ${locale} language label`).toBe(locale);
    }
  });
});
