import { dynamicSettings, log } from '@openvaa/app-shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveOrganizationMatching } from './organizationMatching';

const SHIPPED_DEFAULT = dynamicSettings.matching.organizationMatching;

describe('resolveOrganizationMatching', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps every value in the vocabulary, including an explicit none', () => {
    expect(resolveOrganizationMatching('none')).toBe('none');
    expect(resolveOrganizationMatching('answersOnly')).toBe('answersOnly');
    expect(resolveOrganizationMatching('impute')).toBe('impute');
  });

  it('falls back to the shipped default, not to none, when the key is missing or empty', () => {
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);

    expect(SHIPPED_DEFAULT).not.toBe('none');
    expect(resolveOrganizationMatching(undefined)).toBe(SHIPPED_DEFAULT);
    expect(resolveOrganizationMatching(null)).toBe(SHIPPED_DEFAULT);
    expect(resolveOrganizationMatching('')).toBe(SHIPPED_DEFAULT);
    expect(warn).not.toHaveBeenCalled();
  });

  it('falls back to the shipped default for a value outside the vocabulary, and logs it once', () => {
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);

    expect(resolveOrganizationMatching('imputed')).toBe(SHIPPED_DEFAULT);
    expect(resolveOrganizationMatching('imputed')).toBe(SHIPPED_DEFAULT);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('imputed');
  });
});
