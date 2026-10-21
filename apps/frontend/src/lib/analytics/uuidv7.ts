/** How many random bytes a UUIDv7 takes: 74 random bits, rounded up to whole bytes. */
const RANDOM_BYTE_COUNT = 10;

/** The largest time a UUIDv7 can hold: its timestamp field is 48 bits of epoch milliseconds. */
const MAX_TIMESTAMP_MS = 2 ** 48 - 1;

/** A UUIDv7 in its canonical lower-case form: version nibble `7`, variant bits `10`, nothing before or after. */
const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Build a UUIDv7 from a time and ten random bytes.
 *
 * The first 48 bits are the time, the version nibble is `7` and the variant bits are `10`; the remaining 74 bits come from `random`. The function is pure, so a fixed time and fixed bytes always give the same value.
 *
 * @param nowMs - Epoch milliseconds, a whole number that fits in 48 bits.
 * @param random - Exactly ten random bytes.
 * @returns The uuid in canonical lower-case form, 36 characters long.
 * @throws RangeError when `random` does not hold exactly ten bytes or `nowMs` is not a whole number in the 48-bit range.
 */
export function uuidv7(nowMs: number, random: Uint8Array): string {
  if (random.length !== RANDOM_BYTE_COUNT)
    throw new RangeError(`A UUIDv7 takes exactly ${RANDOM_BYTE_COUNT} random bytes, got ${random.length}.`);
  if (!Number.isInteger(nowMs) || nowMs < 0 || nowMs > MAX_TIMESTAMP_MS)
    throw new RangeError(`A UUIDv7 time must be whole milliseconds between 0 and ${MAX_TIMESTAMP_MS}, got ${nowMs}.`);

  const bytes = new Uint8Array(16);
  // Division rather than bit shifts: the time is wider than the 32 bits bitwise operators work on.
  let remaining = nowMs;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = remaining % 256;
    remaining = Math.floor(remaining / 256);
  }
  bytes[6] = 0x70 | (random[0] & 0x0f);
  bytes[7] = random[1];
  bytes[8] = 0x80 | (random[2] & 0x3f);
  bytes.set(random.subarray(3), 9);

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Create a UUIDv7 stamped with the current time.
 *
 * The random bytes come from `crypto.getRandomValues` only. There is no fallback to a non-cryptographic source: an environment without it throws rather than issuing a guessable id.
 *
 * @returns A new UUIDv7.
 */
export function createUuidV7(): string {
  const random = new Uint8Array(RANDOM_BYTE_COUNT);
  crypto.getRandomValues(random);
  return uuidv7(Date.now(), random);
}

/**
 * True when `value` is a UUIDv7 in canonical lower-case form.
 *
 * An upper-case uuid, a uuid of another version and a string with anything before or after are all rejected, so an id that arrives from outside is accepted only in the one form this module issues.
 *
 * @param value - Any value.
 * @returns `true` when the value is a string holding a canonical UUIDv7.
 */
export function isUuidV7(value: unknown): value is string {
  return typeof value === 'string' && UUID_V7.test(value);
}

/**
 * Read the time a UUIDv7 was stamped with.
 *
 * @param value - A UUIDv7, as `isUuidV7` accepts it.
 * @returns The epoch milliseconds of its first 48 bits, or `NaN` when the value is not a UUIDv7.
 */
export function uuidV7TimestampMs(value: string): number {
  if (!isUuidV7(value)) return Number.NaN;
  return parseInt(`${value.slice(0, 8)}${value.slice(9, 13)}`, 16);
}
