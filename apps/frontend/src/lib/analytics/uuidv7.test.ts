import { describe, expect, it } from 'vitest';
import { createUuidV7, isUuidV7, uuidv7, uuidV7TimestampMs } from './uuidv7';

/** A timestamp whose six bytes all differ, so a byte written to the wrong place shows in the output. */
const FIXED_MS = 0x0123456789ab;

/** Ten bytes counting up from zero. */
const COUNTING_BYTES = Uint8Array.from({ length: 10 }, (_, i) => i);

/** Ten bytes with every bit set, so the version and variant masks show in the output. */
const FULL_BYTES = new Uint8Array(10).fill(0xff);

/** A version 4 uuid, which has the right shape but the wrong version. */
const UUID_V4 = '3b241101-e2bb-4255-8caf-4136c566a962';

describe('uuidv7', () => {
  it('returns one fixed string for a fixed time and fixed bytes', () => {
    expect(uuidv7(FIXED_MS, COUNTING_BYTES)).toBe('01234567-89ab-7001-8203-040506070809');
    expect(uuidv7(FIXED_MS, COUNTING_BYTES)).toBe(uuidv7(FIXED_MS, COUNTING_BYTES));
  });

  it('sets the version nibble to 7 and the variant bits to 10 whatever the random bytes hold', () => {
    const value = uuidv7(FIXED_MS, FULL_BYTES);
    expect(value).toBe('01234567-89ab-7fff-bfff-ffffffffffff');
    expect(value).toHaveLength(36);
    expect(value).toBe(value.toLowerCase());
    expect(value[14]).toBe('7');
    // The variant is the top two bits of the 17th hex digit: 10 gives 8, 9, a or b.
    expect(['8', '9', 'a', 'b']).toContain(value[19]);
  });

  it('puts the time in the first 48 bits', () => {
    expect(uuidV7TimestampMs(uuidv7(FIXED_MS, COUNTING_BYTES))).toBe(FIXED_MS);
    expect(uuidV7TimestampMs(uuidv7(0, FULL_BYTES))).toBe(0);
    const now = 1_760_000_000_000;
    expect(uuidV7TimestampMs(uuidv7(now, FULL_BYTES))).toBe(now);
  });

  it('throws a RangeError for any byte count other than ten', () => {
    expect(() => uuidv7(FIXED_MS, new Uint8Array(9))).toThrow(RangeError);
    expect(() => uuidv7(FIXED_MS, new Uint8Array(11))).toThrow(RangeError);
    expect(() => uuidv7(FIXED_MS, new Uint8Array(0))).toThrow(RangeError);
  });

  it('throws a RangeError for a time that does not fit in 48 bits as whole milliseconds', () => {
    expect(() => uuidv7(-1, COUNTING_BYTES)).toThrow(RangeError);
    expect(() => uuidv7(2 ** 48, COUNTING_BYTES)).toThrow(RangeError);
    expect(() => uuidv7(1.5, COUNTING_BYTES)).toThrow(RangeError);
    expect(() => uuidv7(Number.NaN, COUNTING_BYTES)).toThrow(RangeError);
  });
});

describe('createUuidV7', () => {
  it('returns a UUIDv7 stamped with the current time', () => {
    const before = Date.now();
    const value = createUuidV7();
    const after = Date.now();
    expect(isUuidV7(value)).toBe(true);
    const stamped = uuidV7TimestampMs(value);
    expect(stamped).toBeGreaterThanOrEqual(before);
    expect(stamped).toBeLessThanOrEqual(after);
  });

  it('returns a different value on each call', () => {
    expect(createUuidV7()).not.toBe(createUuidV7());
  });
});

describe('isUuidV7', () => {
  it('is true for a value createUuidV7 returns and for a fixed one', () => {
    expect(isUuidV7(createUuidV7())).toBe(true);
    expect(isUuidV7(uuidv7(FIXED_MS, COUNTING_BYTES))).toBe(true);
  });

  it('is false for a UUIDv4', () => {
    expect(isUuidV7(UUID_V4)).toBe(false);
  });

  it('is false for an upper-case or an over-long string', () => {
    const value = uuidv7(FIXED_MS, FULL_BYTES);
    expect(isUuidV7(value.toUpperCase())).toBe(false);
    expect(isUuidV7(`${value}0`)).toBe(false);
    expect(isUuidV7(` ${value}`)).toBe(false);
  });

  it('is false for a wrong variant', () => {
    expect(isUuidV7('01234567-89ab-7001-c203-040506070809')).toBe(false);
  });

  it('is false for a value that is not a string', () => {
    expect(isUuidV7(42)).toBe(false);
    expect(isUuidV7(undefined)).toBe(false);
    expect(isUuidV7(null)).toBe(false);
  });
});

describe('uuidV7TimestampMs', () => {
  it('returns NaN for a value that is not a UUIDv7', () => {
    expect(uuidV7TimestampMs(UUID_V4)).toBeNaN();
    expect(uuidV7TimestampMs('not a uuid')).toBeNaN();
  });
});
