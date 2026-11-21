import { configureLogger, log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lockedAfterRefusedSave, rereadPageData } from './rereadPageData';

/**
 * The page's loads are run again through `invalidateAll`, and the lock is asked of `readAnswersLocked`; both are replaced here.
 */
const { invalidateAll, readAnswersLocked } = vi.hoisted(() => ({
  invalidateAll: vi.fn(),
  readAnswersLocked: vi.fn()
}));
vi.mock('$app/navigation', () => ({ invalidateAll }));
vi.mock('./readAnswersLocked', () => ({ readAnswersLocked }));

let logError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  configureLogger({ level: 'silent' });
  invalidateAll.mockResolvedValue(undefined);
  logError = vi.spyOn(log, 'error');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('rereadPageData', () => {
  it("runs the page's loads again", async () => {
    await rereadPageData('[Page]');
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(logError).not.toHaveBeenCalled();
  });

  it('logs a failed re-read with its label and does not reject', async () => {
    invalidateAll.mockRejectedValue(new Error('boom'));
    await expect(rereadPageData('[Page]')).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledWith('[Page] Error reading the page data again: boom');
  });
});

describe('lockedAfterRefusedSave', () => {
  const options = { locale: 'en', logLabel: '[Page]' };

  it('trusts a refusal that names the lock without reading the settings, and reads the data again', async () => {
    expect(await lockedAfterRefusedSave({ ...options, refusedByLock: true })).toBe(true);
    expect(readAnswersLocked).not.toHaveBeenCalled();
    expect(invalidateAll).toHaveBeenCalledTimes(1);
  });

  it('asks the stored settings of a refusal that does not name the lock', async () => {
    readAnswersLocked.mockResolvedValue(true);
    expect(await lockedAfterRefusedSave({ ...options, refusedByLock: false })).toBe(true);
    expect(readAnswersLocked).toHaveBeenCalledWith({ locale: 'en' });
    expect(invalidateAll).toHaveBeenCalledTimes(1);
  });

  it.each([false, undefined])('reads nothing again while the settings answer %s', async (answer) => {
    readAnswersLocked.mockResolvedValue(answer);
    expect(await lockedAfterRefusedSave({ ...options, refusedByLock: false })).toBe(false);
    expect(invalidateAll).not.toHaveBeenCalled();
  });
});
