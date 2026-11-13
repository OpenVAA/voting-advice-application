/**
 * The app-neutral gate runner and the set-password gate both apps ask first.
 *
 * What could go wrong, and where each is asserted:
 *
 * 1. **The order.** `firstNeededGate` returns the FIRST needed entry of the list it is given, and `null` when none is needed or the list is empty. It has no default list: every caller names its own.
 * 2. **Purity.** The runner hands each predicate the facts it was given, unchanged and by reference, stops at the first needed entry and keeps nothing between calls.
 * 3. **The set-password predicate.** Needed only when the user-level data says the account has no password — `passwordSet` is exactly `false` — and that its address is proved. It reads nothing else of the user.
 * 4. **The freeze.** The entry is module state the server loads share between concurrent requests, so its freeze is asserted, including that a write throws.
 */

import { describe, expect, expectTypeOf, it } from 'vitest';
import { firstNeededGate, SET_PASSWORD_GATE } from './gates';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';
import type { AddressState } from '$lib/contestant/utils/identityProviderAccount';
import type { Gate, UserGateFacts } from './gates';

/**
 * User-level data with the given password fact and address state.
 * @param passwordSet - Whether the account has a password. It has one by default.
 * @param addressState - The state of the account's address. Proved by default.
 * @returns The user.
 */
function userWith(passwordSet = true, addressState: AddressState = 'proved'): BasicUserData {
  const proved = addressState === 'proved';
  return {
    id: 'user-1',
    email: proved ? 'user@example.test' : '',
    username: proved ? 'user@example.test' : '',
    role: 'admin',
    settings: {},
    termsOfUseAccepted: null,
    passwordSet,
    addressState,
    pendingEmail: addressState === 'pending' ? 'pending@example.test' : null,
    ownOrganizationUnnamed: false,
    pendingEmailTaken: false
  };
}

/**
 * A list entry for the order cases.
 * @param id - The id the entry reports.
 * @param isNeeded - What its predicate answers.
 * @returns The entry.
 */
function entry(id: string, isNeeded: boolean): Gate<string, UserGateFacts> {
  return { id, isNeeded: () => isNeeded };
}

describe('firstNeededGate — the first needed entry of the given list wins', () => {
  const facts: UserGateFacts = { user: userWith() };

  it('returns the first entry when both of two are needed', () => {
    expect(firstNeededGate(facts, [entry('first', true), entry('second', true)])).toBe('first');
  });

  it('returns the second entry when only the second is needed', () => {
    expect(firstNeededGate(facts, [entry('first', false), entry('second', true)])).toBe('second');
  });

  it('returns null when no entry is needed', () => {
    expect(firstNeededGate(facts, [entry('first', false), entry('second', false)])).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(firstNeededGate(facts, [])).toBeNull();
  });

  it('asks no entry after the first needed one', () => {
    const asked: Array<string> = [];
    function recording(id: string, isNeeded: boolean): Gate<string, UserGateFacts> {
      return {
        id,
        isNeeded: () => {
          asked.push(id);
          return isNeeded;
        }
      };
    }

    expect(firstNeededGate(facts, [recording('a', false), recording('b', true), recording('c', true)])).toBe('b');
    expect(asked).toEqual(['a', 'b']);
  });

  it('hands each predicate the facts it was given, by reference and unchanged', () => {
    const given = { user: userWith(false), extra: 'kept' };
    const seen: Array<unknown> = [];
    const recording: Gate<'only', typeof given> = {
      id: 'only',
      isNeeded: (received) => {
        seen.push(received);
        return false;
      }
    };

    expect(firstNeededGate(given, [recording])).toBeNull();
    expect(seen).toHaveLength(1);
    expect(seen[0]).toBe(given);
    expect(given).toEqual({ user: userWith(false), extra: 'kept' });
  });

  it('answers the same for the same facts and list, call after call', () => {
    const list = [entry('first', false), SET_PASSWORD_GATE];
    const passwordless: UserGateFacts = { user: userWith(false) };

    expect(firstNeededGate(passwordless, list)).toBe('setPassword');
    expect(firstNeededGate(facts, list)).toBeNull();
    expect(firstNeededGate(passwordless, list)).toBe('setPassword');
  });

  it('takes no default list: the list is a required parameter', () => {
    expect(firstNeededGate.length).toBe(2);
    expectTypeOf(firstNeededGate).parameter(1).toEqualTypeOf<ReadonlyArray<Gate<string, UserGateFacts>>>();
  });
});

describe('SET_PASSWORD_GATE — needed while the account has no password, on a proved address', () => {
  it('has the id setPassword', () => {
    expect(SET_PASSWORD_GATE.id).toBe('setPassword');
  });

  it('is needed for an account with no password whose address is proved', () => {
    expect(SET_PASSWORD_GATE.isNeeded({ user: userWith(false, 'proved') })).toBe(true);
  });

  it.each<AddressState>(['none', 'pending'])(
    'is not needed for an account with no password whose address is %s',
    (addressState) => {
      expect(SET_PASSWORD_GATE.isNeeded({ user: userWith(false, addressState) })).toBe(false);
    }
  );

  it.each<AddressState>(['none', 'pending', 'proved'])(
    'is not needed for an account with a password whose address is %s',
    (addressState) => {
      expect(SET_PASSWORD_GATE.isNeeded({ user: userWith(true, addressState) })).toBe(false);
    }
  );

  it('asks only for exactly false: a password fact that is absent or not a boolean does not need it', () => {
    for (const value of [undefined, null, 0, '', 'false']) {
      const user = { ...userWith(), passwordSet: value } as unknown as BasicUserData;
      expect(SET_PASSWORD_GATE.isNeeded({ user }), `passwordSet ${JSON.stringify(value)}`).toBe(false);
    }
  });

  it('asks only for exactly proved: an address state that is absent or another value does not need it', () => {
    for (const value of [undefined, null, '', 'PROVED', 'confirmed']) {
      const user = { ...userWith(false), addressState: value } as unknown as BasicUserData;
      expect(SET_PASSWORD_GATE.isNeeded({ user }), `addressState ${JSON.stringify(value)}`).toBe(false);
    }
  });

  it('reads nothing of the user but the password fact and the address state', () => {
    const read: Array<string | symbol> = [];
    const user = new Proxy(userWith(false), {
      get(target, key, receiver) {
        read.push(key);
        return Reflect.get(target, key, receiver);
      }
    });

    expect(SET_PASSWORD_GATE.isNeeded({ user })).toBe(true);
    expect(read).toEqual(['passwordSet', 'addressState']);
  });

  it('is frozen, and a write to it throws', () => {
    expect(Object.isFrozen(SET_PASSWORD_GATE), 'The set-password gate is not frozen.').toBe(true);
    expect(() => {
      (SET_PASSWORD_GATE as { isNeeded: unknown }).isNeeded = () => false;
    }, 'Replacing the predicate of the set-password gate did not throw.').toThrow();
    expect(() => {
      (SET_PASSWORD_GATE as { id: string }).id = 'other';
    }, 'Renaming the set-password gate did not throw.').toThrow();
    expect(SET_PASSWORD_GATE.isNeeded({ user: userWith(false) })).toBe(true);
  });

  it('is decided on the user-level data alone', () => {
    expectTypeOf(SET_PASSWORD_GATE).toEqualTypeOf<Gate<'setPassword', UserGateFacts>>();
    expectTypeOf<UserGateFacts['user']>().toEqualTypeOf<BasicUserData>();
  });
});
