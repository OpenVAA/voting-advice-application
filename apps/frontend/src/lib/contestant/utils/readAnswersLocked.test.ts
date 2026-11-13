import { configureLogger, log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readAnswersLocked } from './readAnswersLocked';

/**
 * The lock is read from the stored settings through one provider made on the tab's own client, and a read that fails answers that nothing is known.
 */
const { createDataProvider, getAppSettings } = vi.hoisted(() => ({
  createDataProvider: vi.fn(),
  getAppSettings: vi.fn()
}));
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider }));

beforeEach(() => {
  configureLogger({ level: 'silent' });
  createDataProvider.mockReturnValue({ getAppSettings });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('readAnswersLocked', () => {
  it.each([
    ['locked', { access: { answersLocked: true } }, true],
    ['open', { access: { answersLocked: false } }, false],
    ['silent on the lock', { access: {} }, false],
    ['empty', {}, false]
  ])('answers whether answers are locked for settings that are %s', async (_kind, settings, locked) => {
    getAppSettings.mockResolvedValue(settings);

    await expect(readAnswersLocked({ locale: 'fi' })).resolves.toBe(locked);

    expect(createDataProvider).toHaveBeenCalledTimes(1);
    expect(createDataProvider.mock.calls[0][0]).toMatchObject({ browser: true, locale: 'fi' });
    expect(getAppSettings).toHaveBeenCalledWith({ locale: 'fi' });
  });

  it('answers undefined, and logs the failure by its name alone, when the settings cannot be read', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    getAppSettings.mockRejectedValue(new TypeError('getAppSettings: the backend text'));

    await expect(readAnswersLocked()).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain('TypeError');
    expect(String(error.mock.calls[0][0])).not.toContain('the backend text');
  });
});
