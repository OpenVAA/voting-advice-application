/**
 * The Admin App's gate list: its content, its frozenness and what the shared runner answers over it.
 *
 * The list holds the set-password gate alone. An identity provider's account holds no admin grant, and the terms of use cover the content an entity publishes, so neither of the Contestant App's other two gates is asked here: a user whose terms of use are unaccepted, or whose address state is `none`, is asked for nothing.
 */

import { describe, expect, it } from 'vitest';
import { firstNeededGate, SET_PASSWORD_GATE } from '$lib/auth/gates';
import { ADMIN_GATES } from './adminGates';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';
import type { AddressStateName } from '$lib/contestant/utils/identityProviderAccount';

/**
 * User-level data of an admin.
 * @param passwordSet - Whether the account has a password.
 * @param addressState - The state of the account's address. Proved by default.
 * @param termsOfUseAccepted - The stored acceptance time, or `null` for none. None by default.
 * @returns The user.
 */
function adminWith(
  passwordSet: boolean,
  addressState: AddressStateName = 'proved',
  termsOfUseAccepted: string | null = null
): BasicUserData {
  return {
    id: 'admin-1',
    email: addressState === 'proved' ? 'admin@example.test' : '',
    username: addressState === 'proved' ? 'admin@example.test' : '',
    role: 'admin',
    settings: {},
    termsOfUseAccepted,
    passwordSet,
    address:
      addressState === 'pending'
        ? { state: 'pending', email: 'pending@example.test' }
        : addressState === 'none'
          ? { state: 'none', pendingTaken: false }
          : { state: 'proved' },
    ownOrganizationUnnamed: false
  };
}

describe('ADMIN_GATES — the gates of the Admin App, in the order they are asked', () => {
  it('holds exactly the set-password gate', () => {
    expect(
      ADMIN_GATES.map((gate) => gate.id),
      'The gate list changed. A gate added without its own cases in this file would ship a gate nothing here measures; add the cases with the entry.'
    ).toEqual(['setPassword']);
    expect(ADMIN_GATES[0]).toBe(SET_PASSWORD_GATE);
  });

  it('is frozen, and a write to it throws', () => {
    expect(Object.isFrozen(ADMIN_GATES), 'The gate list is not frozen.').toBe(true);
    expect(() => {
      (ADMIN_GATES as Array<unknown>).push({ id: 'other', isNeeded: () => true });
    }, 'Appending to the gate list did not throw.').toThrow();
    expect(ADMIN_GATES.map((gate) => gate.id)).toEqual(['setPassword']);
  });
});

describe('firstNeededGate over ADMIN_GATES', () => {
  it('asks a passwordless admin on a proved address for a password', () => {
    expect(firstNeededGate({ user: adminWith(false) }, ADMIN_GATES)).toBe('setPassword');
  });

  it('asks an admin with a password for nothing', () => {
    expect(firstNeededGate({ user: adminWith(true) }, ADMIN_GATES)).toBeNull();
  });

  it('asks an admin with a password whose terms of use are unaccepted for nothing', () => {
    expect(firstNeededGate({ user: adminWith(true, 'proved', null) }, ADMIN_GATES)).toBeNull();
  });

  it('asks an account whose address state is none for nothing, with or without a password', () => {
    expect(firstNeededGate({ user: adminWith(false, 'none') }, ADMIN_GATES)).toBeNull();
    expect(firstNeededGate({ user: adminWith(true, 'none') }, ADMIN_GATES)).toBeNull();
  });

  it('asks an account whose address is pending for nothing', () => {
    expect(firstNeededGate({ user: adminWith(false, 'pending') }, ADMIN_GATES)).toBeNull();
  });
});
