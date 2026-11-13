import { staticSettings } from '@openvaa/app-shared';
import { describe, expect, it } from 'vitest';
import { calcContrast } from './adjustContrast';
import { ensureColors } from './ensureColors';
import { parseColorString } from './parseColorString';
import type { Colors } from '@openvaa/data';

/** What a returned member is when it holds a colour. */
const HEX_COLOR = /^#[0-9a-f]{6}$/;

/** The contrast a returned colour must reach on its background. The util aims a little higher, so this is the WCAG AA floor itself. */
const MIN_CONTRAST = 4.5;

const LIGHT_BACKGROUND = staticSettings.colors?.light?.['base-300'] ?? 'd1ebee';
const DARK_BACKGROUND = staticSettings.colors?.dark?.['base-300'] ?? '1f2324';

/** Values that are not a colour the parser reads: names, a hex code followed by further CSS, CSS functions, a hex code of the wrong length, and nothing. */
const UNPARSABLE: ReadonlyArray<string> = [
  'red',
  'transparent',
  '#fff; background: url(x)',
  '#2546a8;background-image:url(https://example.test/x)',
  'url(javascript:alert(1))',
  'expression(alert(1))',
  'var(--color-primary)',
  '#12345',
  '#1234567',
  '#ggg',
  '   ',
  ''
];

/**
 * The contrast of a returned colour on a background. A member that holds no colour throws.
 */
function contrastOn(color: string | null | undefined, background: string): number {
  const rgb = color ? parseColorString(color) : undefined;
  const backgroundRgb = parseColorString(background);
  if (!rgb || !backgroundRgb) throw new Error(`Not a colour: ${color} or ${background}`);
  return calcContrast(rgb, backgroundRgb).contrast;
}

describe('ensureColors', () => {
  it('derives the dark colour from a good normal one when none is given, and both are hex colours with enough contrast', () => {
    const { normal, dark } = ensureColors({ normal: '#2546a8' });

    expect(normal).toMatch(HEX_COLOR);
    expect(dark).toMatch(HEX_COLOR);
    expect(contrastOn(normal, LIGHT_BACKGROUND)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    expect(contrastOn(dark, DARK_BACKGROUND)).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  it('returns a normal colour that already has enough contrast as the same colour, in lowercase and six digits', () => {
    expect(ensureColors({ normal: '#000000' }).normal).toBe('#000000');
    expect(ensureColors({ normal: '#000' }).normal).toBe('#000000');
    expect(ensureColors({ normal: '000' }).normal).toBe('#000000');
    expect(ensureColors({ normal: '#1A2B3C' }).normal).toBe('#1a2b3c');
  });

  it('adjusts a normal colour with too little contrast on the light background', () => {
    const { normal } = ensureColors({ normal: '#ffffff' });

    expect(normal).toMatch(HEX_COLOR);
    expect(normal).not.toBe('#ffffff');
    expect(contrastOn(normal, LIGHT_BACKGROUND)).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  it('keeps a good dark colour beside a good normal one, each adjusted for its own background', () => {
    const { normal, dark } = ensureColors({ normal: '#000000', dark: '#ffffff' });

    expect(normal).toBe('#000000');
    expect(dark).toBe('#ffffff');
  });

  it('reads a functional notation and returns it as a hex colour', () => {
    expect(ensureColors({ normal: 'rgb(0, 0, 0)' }).normal).toBe('#000000');
  });

  it.each(UNPARSABLE.map((value) => [JSON.stringify(value), value] as const))(
    'returns nothing for the normal colour %s, and nothing for the dark one when none was given',
    (_label, value) => {
      expect(ensureColors({ normal: value })).toEqual({ normal: '', dark: '' });
    }
  );

  it.each(UNPARSABLE.map((value) => [JSON.stringify(value), value] as const))(
    'derives the dark colour from a good normal one when the dark colour is %s',
    (_label, value) => {
      const derived = ensureColors({ normal: '#2546a8' });

      expect(ensureColors({ normal: '#2546a8', dark: value })).toEqual(derived);
      expect(derived.dark).toMatch(HEX_COLOR);
    }
  );

  it.each(UNPARSABLE.map((value) => [JSON.stringify(value), value] as const))(
    'returns nothing for the normal colour %s beside a good dark one, which it keeps',
    (_label, value) => {
      const { normal, dark } = ensureColors({ normal: value, dark: '#ffffff' });

      expect(normal).toBe('');
      expect(dark).toBe('#ffffff');
    }
  );

  it('returns nothing for a member that is absent, null or not a string', () => {
    expect(ensureColors({})).toEqual({ normal: '', dark: '' });
    expect(ensureColors({ normal: '#000000', dark: null }).dark).toMatch(HEX_COLOR);
    // A stored value reaches the util under a type the database does not enforce for every table.
    const stored = { normal: 0x2546a8, dark: { toString: () => 'red' } } as unknown as Colors;
    expect(ensureColors(stored)).toEqual({ normal: '', dark: '' });
    const storedArray = { normal: ['#000000'], dark: [0, 0, 0] } as unknown as Colors;
    expect(ensureColors(storedArray)).toEqual({ normal: '', dark: '' });
  });

  it('never returns a member that is neither a hex colour nor empty, whatever either member held', () => {
    const hostile = [
      ...UNPARSABLE,
      // Read by the parser, which takes the leading integer of each channel.
      'rgb(1;background:url(x),2,3)',
      'rgb(-20, 0, 0)',
      'rgb(999, 999, 999)',
      'rgb(a, b, c)'
    ];
    for (const normal of hostile) {
      for (const dark of [undefined, ...hostile]) {
        const result = ensureColors({ normal, dark });
        for (const member of [result.normal, result.dark]) {
          expect(member, `normal ${JSON.stringify(normal)}, dark ${JSON.stringify(dark)}`).toMatch(/^(#[0-9a-f]{6})?$/);
        }
        if (parseColorString(normal) === undefined) expect(result.normal).toBe('');
        if (dark !== undefined && parseColorString(dark) === undefined && parseColorString(normal) === undefined)
          expect(result.dark).toBe('');
      }
    }
  });
});
