import { configureLogger, log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureLoggerFromEnv } from './configureLoggerFromEnv';
import type { MockInstance } from 'vitest';

const mockConstants = vi.hoisted(() => ({ PUBLIC_LOG_LEVEL: '', PUBLIC_DEBUG: false }));

vi.mock('$lib/utils/constants', () => ({ constants: mockConstants }));

describe('configureLoggerFromEnv', () => {
  let logError: MockInstance<typeof log.error>;
  let logInfo: MockInstance<typeof log.info>;

  beforeEach(() => {
    logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    logInfo = vi.spyOn(log, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    configureLogger({ level: 'silent' });
  });

  it('reports an invalid value at `error`', () => {
    mockConstants.PUBLIC_LOG_LEVEL = 'verbose';
    configureLoggerFromEnv();
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError.mock.calls[0][1]).toMatchObject({ reason: 'invalid', provided: 'verbose' });
    expect(logInfo).not.toHaveBeenCalled();
  });

  it('reports a missing value at `info`', () => {
    mockConstants.PUBLIC_LOG_LEVEL = '';
    configureLoggerFromEnv();
    expect(logInfo).toHaveBeenCalledTimes(1);
    expect(logInfo.mock.calls[0][1]).toMatchObject({ reason: 'missing' });
    expect(logError).not.toHaveBeenCalled();
  });

  it('reports nothing for a valid value', () => {
    mockConstants.PUBLIC_LOG_LEVEL = 'warn';
    configureLoggerFromEnv();
    expect(logError).not.toHaveBeenCalled();
    expect(logInfo).not.toHaveBeenCalled();
  });
});
