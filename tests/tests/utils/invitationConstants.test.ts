/**
 * Unit tests for the address prefixes of the invitation tests and for the addresses built on them.
 *
 * Run: yarn vitest run --config tests/vitest.config.ts invitationConstants
 */
import { describe, expect, it } from 'vitest';
import { freshInvitationAddress, INVITATION_ADDRESS_PREFIXES } from './invitationConstants';

describe('INVITATION_ADDRESS_PREFIXES', () => {
  it('is a frozen list in which no prefix is the beginning of another, so a cleanup by prefix removes one spec’s addresses only', () => {
    expect(Array.isArray(INVITATION_ADDRESS_PREFIXES) && Object.isFrozen(INVITATION_ADDRESS_PREFIXES)).toBe(true);
    expect(INVITATION_ADDRESS_PREFIXES.length).toBeGreaterThan(1);
    const clashes = INVITATION_ADDRESS_PREFIXES.flatMap((prefix, index) =>
      INVITATION_ADDRESS_PREFIXES.filter((other, otherIndex) => otherIndex !== index && other.startsWith(prefix)).map(
        (other) => `"${prefix}" begins "${other}"`
      )
    );
    expect(clashes).toEqual([]);
  });
});

describe('freshInvitationAddress', () => {
  it('builds, for every prefix, a lower-case address that begins with it', () => {
    const built = INVITATION_ADDRESS_PREFIXES.map((prefix) => ({ prefix, address: freshInvitationAddress(prefix) }));
    expect(built.length).toBeGreaterThan(1);
    for (const { prefix, address } of built) {
      expect(address.startsWith(prefix)).toBe(true);
      expect(address).toBe(address.toLowerCase());
    }
  });
});
