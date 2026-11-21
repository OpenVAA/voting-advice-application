/**
 * Unit tests for the removal of a fixed identity whose address carries the run tag: the unregistered candidate of the candidate journey and the candidate of the positive localisation walk. Their setups and teardowns remove by the address's stable beginning, so a user an interrupted earlier run left under its own tag is removed too.
 *
 * The admin client is replaced by an in-memory stand-in that holds auth users and invitations by address and removes them as the client's two removals do.
 *
 * Run: yarn test:unit:tests runScopedIdentity
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { removeRunScopedIdentity } from './runScopedIdentity';
import type { RunScopedIdentityRemover } from './runScopedIdentity';

/** The environment variable the run tag is read from and written to. */
const TAG_VARIABLE = 'E2E_RUN_ADDRESS_TAG';

const DOMAIN = '@test.openvaa.local';
const PREFIX = 'unregistered-aa-';
const THIS_RUN_ADDRESS = `${PREFIX}0123456789abcdef${DOMAIN}`;
const EARLIER_RUN_ADDRESS = `${PREFIX}fedcba9876543210${DOMAIN}`;
const OTHER_IDENTITY_ADDRESS = `candidate-l10n-pos-aa-fedcba9876543210${DOMAIN}`;

/** An admin client held in memory: the addresses of its auth users and of its invitations. */
function memoryClient(state: { users: Array<string>; invitations: Array<string> }): RunScopedIdentityRemover {
  return {
    async removeUsersByEmailPrefix(prefix: string): Promise<number> {
      const removed = state.users.filter((address) => address.startsWith(prefix));
      state.users = state.users.filter((address) => !address.startsWith(prefix));
      state.invitations = state.invitations.filter((address) => !removed.includes(address));
      return removed.length;
    },
    async unregisterUser(email: string): Promise<void> {
      state.users = state.users.filter((address) => address !== email);
      state.invitations = state.invitations.filter((address) => address !== email);
    }
  };
}

describe('removeRunScopedIdentity', () => {
  it('removes the user an interrupted earlier run left under its own tag, with that user’s invitations', async () => {
    const state = { users: [EARLIER_RUN_ADDRESS, THIS_RUN_ADDRESS], invitations: [EARLIER_RUN_ADDRESS] };
    await removeRunScopedIdentity(memoryClient(state), { addressPrefix: PREFIX, address: THIS_RUN_ADDRESS });
    expect(state.users).toEqual([]);
    expect(state.invitations).toEqual([]);
  });

  it('removes the invitations addressed to this run’s address when no user holds it', async () => {
    const state = { users: [], invitations: [THIS_RUN_ADDRESS] };
    await removeRunScopedIdentity(memoryClient(state), { addressPrefix: PREFIX, address: THIS_RUN_ADDRESS });
    expect(state.invitations).toEqual([]);
  });

  it('leaves the users and invitations of an address outside the prefix', async () => {
    const state = { users: [OTHER_IDENTITY_ADDRESS], invitations: [OTHER_IDENTITY_ADDRESS] };
    await removeRunScopedIdentity(memoryClient(state), { addressPrefix: PREFIX, address: THIS_RUN_ADDRESS });
    expect(state.users).toEqual([OTHER_IDENTITY_ADDRESS]);
    expect(state.invitations).toEqual([OTHER_IDENTITY_ADDRESS]);
  });

  it('refuses an address that does not begin with the prefix it removes by', async () => {
    const state = { users: [OTHER_IDENTITY_ADDRESS], invitations: [] };
    await expect(
      removeRunScopedIdentity(memoryClient(state), { addressPrefix: PREFIX, address: OTHER_IDENTITY_ADDRESS })
    ).rejects.toThrow('does not begin with');
    expect(state.users).toEqual([OTHER_IDENTITY_ADDRESS]);
  });
});

describe('the prefixes the setups and teardowns remove by', () => {
  beforeEach(() => {
    const tagBefore = process.env[TAG_VARIABLE];
    return () => {
      if (tagBefore === undefined) delete process.env[TAG_VARIABLE];
      else process.env[TAG_VARIABLE] = tagBefore;
    };
  });

  it('begin each run-scoped address, and the run tag follows them directly', async () => {
    process.env[TAG_VARIABLE] = '0123456789abcdef';
    vi.resetModules();
    const journey: Record<string, unknown> = await import('./contestantJourneyConstants');
    const credentials: Record<string, unknown> = await import('./testCredentials');
    const pairs = [
      [journey.UNREGISTERED_CANDIDATE_ADDRESS_PREFIX, journey.UNREGISTERED_CANDIDATE_EMAIL],
      [credentials.L10N_POSITIVE_CANDIDATE_ADDRESS_PREFIX, credentials.L10N_POSITIVE_CANDIDATE_EMAIL]
    ];
    for (const [prefix, address] of pairs) {
      expect(typeof prefix, 'the prefix is exported as a string').toBe('string');
      expect(
        String(address).startsWith(`${String(prefix)}0123456789abcdef`),
        'the address is the prefix and the tag'
      ).toBe(true);
    }
  });
});
