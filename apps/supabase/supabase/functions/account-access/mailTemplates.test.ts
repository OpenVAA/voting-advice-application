/**
 * The sign-in mail, the recovery mail and the address-confirmation mail: one template per message directory of the frontend, the link marker once per part, a closed locale set.
 *
 * Every completeness case runs over all three mails. The locale set and the label of the forgot-password control are read from disk rather than restated, so a locale added to the application without a mail, and a control renamed without its mail, fail here.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ADDRESS_CONFIRMATION_MAIL_TEMPLATES,
  DEFAULT_MAIL_LOCALE,
  LINK_MARKER,
  RECOVERY_MAIL_TEMPLATES,
  renderAddressConfirmationMail,
  renderRecoveryMail,
  renderSignInMail,
  resolveMailLocale,
  SIGN_IN_MAIL_LOCALES,
  SIGN_IN_MAIL_TEMPLATES
} from './mailTemplates.ts';
import type { SignInMailLocale } from './mailTemplates.ts';

/** The subjects the auth service uses for its own mails. A mail of this function must be told apart from each. */
const AUTH_SERVICE_SUBJECTS = [
  'Your sign-in link',
  'Reset your password',
  'You have been invited',
  'Confirm your signup',
  'Confirm your email change'
];

const MESSAGES = new URL('../../../../frontend/messages/', import.meta.url);

const MESSAGE_DIRECTORIES = readdirSync(MESSAGES, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

/** The three mails of the function, each with its record of templates and its renderer. */
const MAILS = [
  ['the sign-in mail', SIGN_IN_MAIL_TEMPLATES, renderSignInMail],
  ['the recovery mail', RECOVERY_MAIL_TEMPLATES, renderRecoveryMail],
  ['the address-confirmation mail', ADDRESS_CONFIRMATION_MAIL_TEMPLATES, renderAddressConfirmationMail]
] as const;

/** Every template of every mail, named by its mail and its locale. */
const TEMPLATES = MAILS.flatMap(([mail, templates]) =>
  SIGN_IN_MAIL_LOCALES.map((locale) => [mail, locale, templates[locale]] as const)
);

/** How many times a string holds another. */
function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

/**
 * The label a locale's catalogue gives the control that asks for a recovery mail.
 *
 * @param locale - The message directory to read
 */
function forgotPasswordLabel(locale: SignInMailLocale): string {
  const catalogue = JSON.parse(readFileSync(new URL(`${locale}/contestantApp.login.json`, MESSAGES), 'utf8'));
  return catalogue['contestantApp.login'].forgotPassword;
}

describe('the locale set', () => {
  it('equals the message directories of the frontend', () => {
    expect(MESSAGE_DIRECTORIES.length).toBeGreaterThan(0);
    expect([...SIGN_IN_MAIL_LOCALES].sort()).toEqual(MESSAGE_DIRECTORIES);
  });

  it.each(MAILS)('%s has one template per locale and no other', (_mail, templates) => {
    expect(Object.keys(templates).sort()).toEqual([...SIGN_IN_MAIL_LOCALES].sort());
  });

  it('defaults to a locale of the set', () => {
    expect(SIGN_IN_MAIL_LOCALES).toContain(DEFAULT_MAIL_LOCALE);
    expect(DEFAULT_MAIL_LOCALE).toBe('en');
  });
});

describe.each(TEMPLATES)('the template of %s for %s', (_mail, _locale, { subject, text, html }) => {
  it('holds the link marker exactly once in its text and once in its html, and no other marker', () => {
    expect(count(text, LINK_MARKER)).toBe(1);
    expect(count(html, LINK_MARKER)).toBe(1);
    expect(count(text, '{{')).toBe(1);
    expect(count(html, '{{')).toBe(1);
    expect(count(subject, '{{')).toBe(0);
  });

  it('puts the link in an anchor of the html part', () => {
    expect(html).toContain(`<a href="${LINK_MARKER}">`);
  });

  it('has a subject of its own that is none of the auth service’s', () => {
    expect(subject.trim()).not.toBe('');
    for (const theirs of AUTH_SERVICE_SUBJECTS) {
      expect(subject.toLowerCase()).not.toBe(theirs.toLowerCase());
    }
  });

  it('states no duration and no address', () => {
    for (const part of [subject, text, html.replace(/<[^>]+>/g, ' ')]) {
      expect(part).not.toMatch(/\d/);
      expect(part).not.toContain('@');
    }
  });

  it('holds no markup character in its sentences', () => {
    const withoutTags = html.replace(/<\/?p>|<a href="\{\{link\}\}">|<\/a>/g, '');
    expect(withoutTags).not.toMatch(/[<>&]/);
    expect(text).not.toMatch(/[<>]/);
  });

  it('has five parts, none of them blank', () => {
    const lines = text.split('\n').filter((line) => line.trim() !== '');
    expect(lines).toHaveLength(4);
    expect(lines[1]).toBe(LINK_MARKER);
    expect(html).not.toContain(`<a href="${LINK_MARKER}"></a>`);
    expect(html).not.toContain('<p></p>');
  });
});

describe('the English mails', () => {
  it('the sign-in mail reads as written', () => {
    expect(SIGN_IN_MAIL_TEMPLATES.en.subject).toBe('Sign-in link for the voting advice application');
    expect(SIGN_IN_MAIL_TEMPLATES.en.text).toBe(
      'Open this link to sign in:\n' +
        '{{link}}\n\n' +
        'The link works once and expires soon, and only the newest link you asked for works. If it no longer works, ask for a new one in the application.\n\n' +
        'If you did not ask for this link, you can ignore this message.\n'
    );
    expect(SIGN_IN_MAIL_TEMPLATES.en.html).toContain(`<a href="${LINK_MARKER}">Sign in</a>`);
  });

  it('the recovery mail reads as written', () => {
    expect(RECOVERY_MAIL_TEMPLATES.en.subject).toBe('Reset your password for the voting advice application');
    expect(RECOVERY_MAIL_TEMPLATES.en.text).toBe(
      'Open this link to sign in and choose a new password:\n' +
        '{{link}}\n\n' +
        'The link works once and expires soon, and only the newest link you asked for works. If it no longer works, ask for a new one with “Forgot Password?” in the application.\n\n' +
        'If you did not ask for this link, you can ignore this message. Your password has not been changed.\n'
    );
    expect(RECOVERY_MAIL_TEMPLATES.en.html).toContain(`<a href="${LINK_MARKER}">Choose a new password</a>`);
  });

  it('the address-confirmation mail reads as written', () => {
    expect(ADDRESS_CONFIRMATION_MAIL_TEMPLATES.en.subject).toBe(
      'Confirm your email address for the voting advice application'
    );
    expect(ADDRESS_CONFIRMATION_MAIL_TEMPLATES.en.text).toBe(
      'Someone who registered with Bank ID gave this address as the one they will sign in with. Open this link to confirm it and attach it to that account:\n' +
        '{{link}}\n\n' +
        'The link works once and expires soon, and only the newest link you asked for works. Until you open it, sign in to the application with Bank ID.\n\n' +
        'If you did not register, do not open the link. You can ignore this message, and the address will not be attached to any account.\n'
    );
    expect(ADDRESS_CONFIRMATION_MAIL_TEMPLATES.en.html).toContain(
      `<a href="${LINK_MARKER}">Confirm my email address</a>`
    );
  });

  it('the address-confirmation mail does not address its reader as the one who registered', () => {
    const { text } = ADDRESS_CONFIRMATION_MAIL_TEMPLATES.en;
    expect(text.startsWith('Someone who registered')).toBe(true);
    expect(text).not.toMatch(/\byou registered\b|\byour account\b/i);
  });

  it.each(MAILS)('%s names no sign-in page', (_mail, templates) => {
    expect(templates.en.text.toLowerCase()).not.toContain('sign-in page');
  });
});

describe('the subjects', () => {
  it.each(MAILS)('%s has a subject no other locale shares', (_mail, templates) => {
    const subjects = SIGN_IN_MAIL_LOCALES.map((locale) => templates[locale].subject);
    expect(new Set(subjects).size).toBe(subjects.length);
  });

  it('tell the three mails apart in every locale', () => {
    const subjects = MAILS.flatMap(([, templates]) => SIGN_IN_MAIL_LOCALES.map((locale) => templates[locale].subject));
    expect(new Set(subjects).size).toBe(subjects.length);
  });
});

describe('the address-confirmation mail in every locale', () => {
  /** The first sentence of the sign-in mail's paragraph after the link: the link works once, and only the newest one works. */
  function onceSentence(locale: SignInMailLocale): string {
    const paragraph = SIGN_IN_MAIL_TEMPLATES[locale].text.split('\n\n')[1];
    return paragraph.split(/(?<=\.)\s/)[0];
  }

  it.each(SIGN_IN_MAIL_LOCALES.map((locale) => [locale]))(
    'says in %s, in the sign-in mail’s own words, that the link works once and only the newest one works',
    (locale) => {
      const sentence = onceSentence(locale);
      expect(sentence.length).toBeGreaterThan(20);
      expect(sentence.endsWith('.')).toBe(true);
      expect(count(ADDRESS_CONFIRMATION_MAIL_TEMPLATES[locale].text, sentence)).toBe(1);
      expect(count(ADDRESS_CONFIRMATION_MAIL_TEMPLATES[locale].html, sentence)).toBe(1);
    }
  );

  it.each(SIGN_IN_MAIL_LOCALES.map((locale) => [locale]))(
    'differs in %s from the sign-in and the recovery mail in every part but that sentence',
    (locale) => {
      const parts = (text: string) => text.split('\n').filter((line) => line.trim() !== '');
      const mine = parts(ADDRESS_CONFIRMATION_MAIL_TEMPLATES[locale].text);
      for (const other of [SIGN_IN_MAIL_TEMPLATES[locale], RECOVERY_MAIL_TEMPLATES[locale]]) {
        const theirs = parts(other.text);
        expect(mine[0]).not.toBe(theirs[0]);
        expect(mine[2]).not.toBe(theirs[2]);
        expect(mine[3]).not.toBe(theirs[3]);
        expect(ADDRESS_CONFIRMATION_MAIL_TEMPLATES[locale].subject).not.toBe(other.subject);
      }
    }
  );
});

describe('the forgot-password control', () => {
  it.each(SIGN_IN_MAIL_LOCALES.map((locale) => [locale]))(
    'is named in the recovery mail for %s by the label the catalogue gives it',
    (locale) => {
      const label = forgotPasswordLabel(locale);
      expect(label.trim()).not.toBe('');
      expect(count(RECOVERY_MAIL_TEMPLATES[locale].text, label)).toBe(1);
      expect(count(RECOVERY_MAIL_TEMPLATES[locale].html, label)).toBe(1);
    }
  );
});

describe('resolveMailLocale', () => {
  it.each(SIGN_IN_MAIL_LOCALES.map((locale) => [locale]))('returns %s for itself', (locale) => {
    expect(resolveMailLocale(locale)).toBe(locale);
  });

  it.each([
    ['an unknown code', 'de'],
    ['a known code in upper case', 'FI'],
    ['a known code with a region', 'en-GB'],
    ['a known code with a space', ' fi'],
    ['an empty string', ''],
    ['the prototype key', '__proto__'],
    ['the constructor key', 'constructor'],
    ['an inherited method name', 'toString'],
    ['a number', 3],
    ['null', null],
    ['undefined', undefined],
    ['an array holding a known code', ['fi']],
    ['an object', { locale: 'fi' }]
  ])('returns the default for %s', (_label, input) => {
    expect(resolveMailLocale(input)).toBe(DEFAULT_MAIL_LOCALE);
  });
});

describe.each(MAILS)('rendering %s', (_mail, templates, render) => {
  const link = 'http://localhost:5173/fi/auth/confirm?token_hash=abc123&type=magiclink';
  const escaped = 'http://localhost:5173/fi/auth/confirm?token_hash=abc123&amp;type=magiclink';

  it.each(SIGN_IN_MAIL_LOCALES.map((locale) => [locale]))(
    'renders %s with the raw link once in the text and the escaped link once in the html',
    (locale) => {
      const mail = render(locale, link);
      expect(mail.subject).toBe(templates[locale].subject);
      expect(count(mail.text, link)).toBe(1);
      expect(count(mail.html, escaped)).toBe(1);
      expect(mail.html).not.toContain(link);
      expect(mail.html).toContain(`<a href="${escaped}">`);
      expect(mail.text).not.toContain('{{');
      expect(mail.html).not.toContain('{{');
    }
  );

  it('escapes every character HTML gives meaning to', () => {
    const hostile = "http://x.example/?a=\"><script>alert('1')</script>&b=1";
    const mail = render('en', hostile);
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&quot;&gt;&lt;script&gt;alert(&#39;1&#39;)&lt;/script&gt;&amp;b=1');
    expect(count(mail.text, hostile)).toBe(1);
  });

  it('inserts a link holding replacement patterns as written', () => {
    const patterned = "http://x.example/?a=$&b=$1&c=$$&d=$'";
    expect(count(render('en', patterned).text, patterned)).toBe(1);
  });

  it('renders the default locale for a value outside the set', () => {
    for (const hostile of ['__proto__', 'constructor', 'de']) {
      expect(render(hostile as SignInMailLocale, link).subject).toBe(templates[DEFAULT_MAIL_LOCALE].subject);
    }
  });
});
