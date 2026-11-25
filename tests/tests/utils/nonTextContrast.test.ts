/**
 * Unit tests for the WCAG contrast ratio behind the non-text contrast assertions.
 *
 * Run: yarn test:unit:tests nonTextContrast
 */
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './nonTextContrast';

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBe(21);
  });

  it('is 1 for two equal colours', () => {
    expect(contrastRatio([51, 51, 51], [51, 51, 51])).toBe(1);
  });

  it('is about 4.48 for #777777 on white, in either order', () => {
    expect(contrastRatio([119, 119, 119], [255, 255, 255])).toBeCloseTo(4.48, 2);
    expect(contrastRatio([255, 255, 255], [119, 119, 119])).toBeCloseTo(4.48, 2);
  });
});
