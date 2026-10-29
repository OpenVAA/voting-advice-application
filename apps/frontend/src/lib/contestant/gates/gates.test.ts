/**
 * The Contestant App's gate list: its content, its predicates, its order and its frozenness.
 *
 * What the list could get wrong, and where each is asserted:
 *
 * 1. **A gate added without a case here.** The ids are compared as a whole array, so a further entry fails until its own cases are written.
 * 2. **The set-password predicate.** Needed only when the user-level data says the account has no password — `passwordSet` is exactly `false` — and that its address is proved: an account an identity provider made, still without a proved address, is not asked for a password. It reads nothing else of the user.
 * 3. **The identity-provider predicate.** Needed for an account with no address; for an own party with no name while answers are not locked; and, once the provider found the account, for an account that has given an address. The arrival marker only adds the gate: no value of it removes a gate the user-level data asks for.
 * 4. **The terms-of-use predicate.** Needed when the user-level data carries no acceptance, whether that is `null` or an absent member; not needed for any stored time.
 * 5. **The order.** `firstNeededGate` returns the FIRST needed entry. The shipped list asks for a password, then what the identity provider's account lacks, then the terms; the rule itself is asserted with a two-entry list passed in.
 * 6. **The freeze.** The list is module state the server load shares between concurrent requests. The freeze is asserted, including that a write throws, rather than assumed from the `Object.freeze` call being visible in the source.
 * 7. **The parameter's type.** The facts hold the user-level data with the password fact, so a caller cannot ask the list about a user whose fact was never read.
 */

import { describe, expect, expectTypeOf, it } from 'vitest';
import { CONTESTANT_GATES, firstNeededGate } from './gates';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';
import type { AddressState } from '$lib/contestant/utils/identityProviderAccount';
import type { ContestantGate, ContestantGateFacts, ContestantGateId, IdentityProviderArrival } from './gates';

/**
 * User-level data with the given acceptance.
 * @param termsOfUseAccepted - The stored acceptance time, or `null` for none.
 * @param passwordSet - Whether the account has a password. It has one by default.
 * @param addressState - The state of the account's address. Proved by default.
 * @returns The user.
 */
function userWith(
  termsOfUseAccepted: string | null,
  passwordSet = true,
  addressState: AddressState = 'proved'
): BasicUserData {
  const proved = addressState === 'proved';
  return {
    id: 'user-1',
    email: proved ? 'user@example.test' : '',
    username: proved ? 'user@example.test' : '',
    role: 'contestant',
    settings: {},
    termsOfUseAccepted,
    passwordSet,
    addressState,
    pendingEmail: addressState === 'pending' ? 'pending@example.test' : null,
    ownOrganizationUnnamed: false,
    pendingEmailTaken: false
  };
}

/**
 * The facts a gate is decided on, for a user.
 * @param user - The user-level data.
 * @param arrival - The arrival marker; none by default.
 * @param answersLocked - Whether answers are locked; not by default.
 * @returns The facts.
 */
function facts(
  user: BasicUserData,
  arrival: IdentityProviderArrival = null,
  answersLocked = false
): ContestantGateFacts {
  return { user, arrival, answersLocked };
}

/** A time in the form PostgREST returns for a `timestamptz`. */
const ACCEPTED_AT = '2026-10-06T00:54:12.277826+00:00';

/**
 * A list entry for the order cases. The ids are not members of the shipped id type; the cast lets two entries be told apart.
 * @param id - The id the entry reports.
 * @param isNeeded - What its predicate answers.
 * @returns The entry.
 */
function entry(id: string, isNeeded: boolean): ContestantGate {
  return { id: id as ContestantGateId, isNeeded: () => isNeeded };
}

describe('CONTESTANT_GATES — the gates, in the order they are asked', () => {
  it('holds exactly the set-password gate, the identity-provider gate and the terms-of-use gate, in that order', () => {
    expect(
      CONTESTANT_GATES.map((gate) => gate.id),
      'The gate list changed. A gate added without its own cases in this file would ship a gate nothing here measures; add the cases with the entry.'
    ).toEqual(['setPassword', 'identityProvider', 'termsOfUse']);
  });

  it('is frozen, and a write to it throws', () => {
    expect(Object.isFrozen(CONTESTANT_GATES), 'The gate list is not frozen.').toBe(true);
    expect(() => {
      (CONTESTANT_GATES as Array<ContestantGate>)[0] = entry('other', false);
    }, 'Overwriting an entry of the gate list did not throw.').toThrow();
    expect(() => {
      (CONTESTANT_GATES as Array<ContestantGate>).push(entry('other', false));
    }, 'Appending to the gate list did not throw.').toThrow();
    expect(
      CONTESTANT_GATES.map((gate) => gate.id),
      'The gate list changed after a write was attempted against it, so the freeze is nominal.'
    ).toEqual(['setPassword', 'identityProvider', 'termsOfUse']);
  });

  it('freezes every entry, and a write to one throws', () => {
    for (const gate of CONTESTANT_GATES) {
      expect(Object.isFrozen(gate), `The gate entry ${gate.id} is not frozen.`).toBe(true);
      expect(() => {
        (gate as { isNeeded: ContestantGate['isNeeded'] }).isNeeded = () => false;
      }, `Replacing the predicate of the gate entry ${gate.id} did not throw.`).toThrow();
      expect(() => {
        (gate as { id: string }).id = 'other';
      }, `Renaming the gate entry ${gate.id} did not throw.`).toThrow();
    }
    expect(CONTESTANT_GATES[0].isNeeded(facts(userWith(null, false)))).toBe(true);
    expect(CONTESTANT_GATES[1].isNeeded(facts(userWith(null, false, 'none')))).toBe(true);
    expect(CONTESTANT_GATES[2].isNeeded(facts(userWith(null)))).toBe(true);
  });
});

describe('the set-password gate — needed while the account has no password', () => {
  const setPassword = CONTESTANT_GATES.find((gate) => gate.id === 'setPassword')!;

  it('is needed when the account has no password', () => {
    expect(setPassword.isNeeded(facts(userWith(ACCEPTED_AT, false)))).toBe(true);
    expect(setPassword.isNeeded(facts(userWith(null, false)))).toBe(true);
  });

  it('is not needed when the account has a password, with or without an acceptance', () => {
    expect(setPassword.isNeeded(facts(userWith(ACCEPTED_AT, true)))).toBe(false);
    expect(setPassword.isNeeded(facts(userWith(null, true)))).toBe(false);
  });

  it('asks only for exactly false: a user object whose fact is absent or not a boolean does not need it', () => {
    for (const value of [undefined, null, 0, '', 'false']) {
      const user = { ...userWith(ACCEPTED_AT), passwordSet: value } as unknown as BasicUserData;
      expect(setPassword.isNeeded(facts(user)), `passwordSet ${JSON.stringify(value)}`).toBe(false);
    }
  });

  it.each<AddressState>(['none', 'pending'])(
    'is not needed for an account with no password whose address is %s',
    (addressState) => {
      expect(setPassword.isNeeded(facts(userWith(ACCEPTED_AT, false, addressState)))).toBe(false);
      expect(setPassword.isNeeded(facts(userWith(null, false, addressState)))).toBe(false);
    }
  );

  it('is needed for an account with no password whose address is proved', () => {
    expect(setPassword.isNeeded(facts(userWith(ACCEPTED_AT, false, 'proved')))).toBe(true);
  });

  it.each<AddressState>(['none', 'pending', 'proved'])(
    'is not needed for an account with a password whose address is %s',
    (addressState) => {
      expect(setPassword.isNeeded(facts(userWith(ACCEPTED_AT, true, addressState)))).toBe(false);
    }
  );

  it('asks only for exactly proved: an address state that is absent or another value does not need it', () => {
    for (const value of [undefined, null, '', 'PROVED', 'confirmed']) {
      const user = { ...userWith(ACCEPTED_AT, false), addressState: value } as unknown as BasicUserData;
      expect(setPassword.isNeeded(facts(user)), `addressState ${JSON.stringify(value)}`).toBe(false);
    }
  });

  it('reads nothing of the user but the password fact and the address state', () => {
    const read: Array<string | symbol> = [];
    const user = new Proxy(userWith(null, false), {
      get(target, key, receiver) {
        read.push(key);
        return Reflect.get(target, key, receiver);
      }
    });

    expect(setPassword.isNeeded(facts(user))).toBe(true);
    expect(read).toEqual(['passwordSet', 'addressState']);
  });
});

describe('the identity-provider gate — needed while the account lacks what the provider could not give', () => {
  const identityProvider = CONTESTANT_GATES.find((gate) => gate.id === 'identityProvider')!;

  /**
   * User-level data of an identity-provider account.
   * @param addressState - The state of the account's address.
   * @param ownOrganizationUnnamed - Whether the identity's own party has no name.
   * @returns The user.
   */
  function providerUser(addressState: AddressState, ownOrganizationUnnamed = false): BasicUserData {
    return { ...userWith(ACCEPTED_AT, false, addressState), ownOrganizationUnnamed };
  }

  // The rows of the view's variants: the address state, the marker, whether the own party has no name, and whether the gate is needed.
  it.each<[string, AddressState, IdentityProviderArrival, boolean, boolean]>([
    ['V1: no address, no marker', 'none', null, false, true],
    ['V1: no address, the marker created', 'none', 'created', false, true],
    ['V2: no address, a party with no name', 'none', null, true, true],
    ['V2: no address, the marker created and a party with no name', 'none', 'created', true, true],
    ['V3: no address, the marker existing', 'none', 'existing', false, true],
    ['V3: no address, the marker existing and a party with no name', 'none', 'existing', true, true],
    ['V4: a pending address, the marker existing', 'pending', 'existing', false, true],
    ['V5: a proved address, the marker existing', 'proved', 'existing', false, true],
    ['V6: a pending address, a party with no name', 'pending', null, true, true],
    ['V6: a proved address, a party with no name', 'proved', 'created', true, true],
    ['not shown: a pending address, no marker', 'pending', null, false, false],
    ['not shown: a pending address, the marker created', 'pending', 'created', false, false],
    ['not shown: a proved address, no marker', 'proved', null, false, false],
    ['not shown: a proved address, the marker created', 'proved', 'created', false, false]
  ])('%s', (_, addressState, arrival, unnamed, needed) => {
    expect(identityProvider.isNeeded(facts(providerUser(addressState, unnamed), arrival))).toBe(needed);
  });

  it('is not needed for an unnamed party while answers are locked, once an address is given', () => {
    expect(identityProvider.isNeeded(facts(providerUser('pending', true), null, true))).toBe(false);
    expect(identityProvider.isNeeded(facts(providerUser('proved', true), 'created', true))).toBe(false);
  });

  it('is still needed for an account with no address while answers are locked', () => {
    expect(identityProvider.isNeeded(facts(providerUser('none', true), null, true))).toBe(true);
    expect(identityProvider.isNeeded(facts(providerUser('none'), null, true))).toBe(true);
  });

  it('is needed once the provider found an account with an address, while answers are locked too', () => {
    expect(identityProvider.isNeeded(facts(providerUser('pending'), 'existing', true))).toBe(true);
  });

  it.each<IdentityProviderArrival>([null, 'created', 'existing'])(
    'is needed for an account with no address whatever the marker is (%s): the marker never removes the gate',
    (arrival) => {
      expect(identityProvider.isNeeded(facts(providerUser('none'), arrival))).toBe(true);
      expect(identityProvider.isNeeded(facts(providerUser('pending', true), arrival))).toBe(true);
    }
  );

  it('reads only the two marker values it knows, so a forged value adds nothing', () => {
    for (const value of ['', 'EXISTING', 'found', 'created ', 'true']) {
      expect(
        identityProvider.isNeeded(facts(providerUser('proved'), value as unknown as IdentityProviderArrival)),
        `arrival ${JSON.stringify(value)}`
      ).toBe(false);
    }
  });

  it("is not needed for an account that is not the identity provider's and has a proved address", () => {
    expect(identityProvider.isNeeded(facts(userWith(null)))).toBe(false);
  });

  it('reads nothing of the user but the address state and the own party fact', () => {
    const read: Array<string | symbol> = [];
    const user = new Proxy(providerUser('pending', true), {
      get(target, key, receiver) {
        read.push(key);
        return Reflect.get(target, key, receiver);
      }
    });

    expect(identityProvider.isNeeded(facts(user))).toBe(true);
    expect([...new Set(read)].sort()).toEqual(['addressState', 'ownOrganizationUnnamed']);
  });
});

describe('the terms-of-use gate — needed until an acceptance is stored', () => {
  const termsOfUse = CONTESTANT_GATES.find((gate) => gate.id === 'termsOfUse')!;

  it('is needed when the acceptance is null', () => {
    expect(termsOfUse.isNeeded(facts(userWith(null)))).toBe(true);
  });

  it('is needed when the acceptance is undefined', () => {
    const user = userWith(null);
    delete (user as Partial<BasicUserData>).termsOfUseAccepted;

    expect(user.termsOfUseAccepted).toBeUndefined();
    expect(termsOfUse.isNeeded(facts(user))).toBe(true);
  });

  it('is not needed for a stored acceptance time', () => {
    expect(termsOfUse.isNeeded(facts(userWith(ACCEPTED_AT)))).toBe(false);
  });
});

describe('firstNeededGate — the first needed entry wins', () => {
  it('returns the terms-of-use gate for a user with a password and no acceptance, from the shipped list', () => {
    expect(firstNeededGate(facts(userWith(null)))).toBe('termsOfUse');
  });

  it('returns the set-password gate for a user with neither a password nor an acceptance, from the shipped list', () => {
    expect(firstNeededGate(facts(userWith(null, false)))).toBe('setPassword');
  });

  it('returns the set-password gate for a user with an acceptance and no password, from the shipped list', () => {
    expect(firstNeededGate(facts(userWith(ACCEPTED_AT, false)))).toBe('setPassword');
  });

  it('returns the identity-provider gate, not the set-password gate, for an identity-provider account with no password and no address, from the shipped list', () => {
    expect(firstNeededGate(facts(userWith(null, false, 'none')))).toBe('identityProvider');
    expect(firstNeededGate(facts(userWith(ACCEPTED_AT, false, 'none')))).toBe('identityProvider');
  });

  it('returns the terms-of-use gate, and neither the set-password nor the identity-provider gate, for an account whose address is pending, from the shipped list', () => {
    expect(firstNeededGate(facts(userWith(null, false, 'pending')))).toBe('termsOfUse');
    expect(firstNeededGate(facts(userWith(null, false, 'pending'), 'created'))).toBe('termsOfUse');
  });

  it('returns the set-password gate before the identity-provider gate for a proved account the provider found, from the shipped list', () => {
    expect(firstNeededGate(facts(userWith(null, false, 'proved'), 'existing'))).toBe('setPassword');
    expect(firstNeededGate(facts(userWith(null, true, 'proved'), 'existing'))).toBe('identityProvider');
  });

  it('returns the identity-provider gate before the terms-of-use gate, from the shipped list', () => {
    expect(firstNeededGate(facts(userWith(null, false, 'none')))).toBe('identityProvider');
    expect(firstNeededGate(facts(userWith(null, true, 'pending'), 'existing'))).toBe('identityProvider');
  });

  it('returns null for a user with a password and an acceptance, from the shipped list', () => {
    expect(firstNeededGate(facts(userWith(ACCEPTED_AT)))).toBeNull();
  });

  it('returns the first entry when both of two are needed', () => {
    expect(firstNeededGate(facts(userWith(null)), [entry('first', true), entry('second', true)])).toBe('first');
  });

  it('returns the second entry when only the second is needed', () => {
    expect(firstNeededGate(facts(userWith(null)), [entry('first', false), entry('second', true)])).toBe('second');
  });

  it('returns null when no entry is needed', () => {
    expect(firstNeededGate(facts(userWith(null)), [entry('first', false), entry('second', false)])).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(firstNeededGate(facts(userWith(null)), [])).toBeNull();
  });

  it('hands each predicate the facts it was given', () => {
    const given = facts(userWith(ACCEPTED_AT), 'existing', true);
    const seen: Array<ContestantGateFacts> = [];
    const recording: ContestantGate = {
      id: 'termsOfUse',
      isNeeded: (received) => {
        seen.push(received);
        return false;
      }
    };

    firstNeededGate(given, [recording]);

    expect(seen).toEqual([given]);
    expect(seen[0]).toBe(given);
  });
});

describe('the facts the gate list takes — the user-level data with the password fact, and two facts of the request', () => {
  it('takes the facts, whose user is the user-level data as every read returns it', () => {
    expectTypeOf(firstNeededGate).parameter(0).toEqualTypeOf<ContestantGateFacts>();
    expectTypeOf<Parameters<ContestantGate['isNeeded']>[0]>().toEqualTypeOf<ContestantGateFacts>();
    expectTypeOf<ContestantGateFacts['user']>().toEqualTypeOf<BasicUserData>();
    expectTypeOf<ContestantGateFacts['arrival']>().toEqualTypeOf<'created' | 'existing' | null>();
    expectTypeOf<ContestantGateFacts['answersLocked']>().toEqualTypeOf<boolean>();
  });

  it('does not take facts whose user lacks the password fact', () => {
    expectTypeOf<{
      user: Omit<BasicUserData, 'passwordSet'>;
      arrival: IdentityProviderArrival;
      answersLocked: boolean;
    }>().not.toMatchTypeOf<Parameters<typeof firstNeededGate>[0]>();
    expectTypeOf<{
      user: Omit<BasicUserData, 'passwordSet'> & { passwordSet?: boolean };
      arrival: IdentityProviderArrival;
      answersLocked: boolean;
    }>().not.toMatchTypeOf<Parameters<typeof firstNeededGate>[0]>();
  });

  it('does not take the user-level data alone', () => {
    expectTypeOf<BasicUserData>().not.toMatchTypeOf<Parameters<typeof firstNeededGate>[0]>();
  });
});
