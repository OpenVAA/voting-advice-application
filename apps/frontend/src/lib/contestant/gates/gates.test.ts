/**
 * The Contestant App's gate list: its content, its predicates, its order and its frozenness.
 *
 * What the list could get wrong, and where each is asserted:
 *
 * 1. **A gate added without a case here.** The ids are compared as a whole array, so a further entry fails until its own cases are written.
 * 2. **The set-password predicate.** Needed only when the user-level data says the account has no password: `passwordSet` is exactly `false`. It reads nothing else of the user.
 * 3. **The terms-of-use predicate.** Needed when the user-level data carries no acceptance, whether that is `null` or an absent member; not needed for any stored time.
 * 4. **The order.** `firstNeededGate` returns the FIRST needed entry. The shipped list asks for a password before the terms; the rule itself is asserted with a two-entry list passed in.
 * 5. **The freeze.** The list is module state the server load shares between concurrent requests. The freeze is asserted, including that a write throws, rather than assumed from the `Object.freeze` call being visible in the source.
 * 6. **The parameter's type.** A user object without the password fact is not what the list takes, so a caller cannot ask it about a user whose fact was never read.
 */

import { describe, expect, expectTypeOf, it } from 'vitest';
import { CONTESTANT_GATES, firstNeededGate } from './gates';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';
import type { ContestantGate, ContestantGateId } from './gates';

/**
 * User-level data with the given acceptance.
 * @param termsOfUseAccepted - The stored acceptance time, or `null` for none.
 * @param passwordSet - Whether the account has a password. It has one by default.
 * @returns The user.
 */
function userWith(termsOfUseAccepted: string | null, passwordSet = true): BasicUserData {
  return {
    id: 'user-1',
    email: 'user@example.test',
    username: 'user@example.test',
    role: 'contestant',
    settings: {},
    termsOfUseAccepted,
    passwordSet
  } as BasicUserData;
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
  it('holds exactly the set-password gate and then the terms-of-use gate', () => {
    expect(
      CONTESTANT_GATES.map((gate) => gate.id),
      'The gate list changed. A gate added without its own cases in this file would ship a gate nothing here measures; add the cases with the entry.'
    ).toEqual(['setPassword', 'termsOfUse']);
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
    ).toEqual(['setPassword', 'termsOfUse']);
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
    expect(CONTESTANT_GATES[0].isNeeded(userWith(null, false))).toBe(true);
    expect(CONTESTANT_GATES[1].isNeeded(userWith(null))).toBe(true);
  });
});

describe('the set-password gate — needed while the account has no password', () => {
  const setPassword = CONTESTANT_GATES.find((gate) => gate.id === 'setPassword')!;

  it('is needed when the account has no password', () => {
    expect(setPassword.isNeeded(userWith(ACCEPTED_AT, false))).toBe(true);
    expect(setPassword.isNeeded(userWith(null, false))).toBe(true);
  });

  it('is not needed when the account has a password, with or without an acceptance', () => {
    expect(setPassword.isNeeded(userWith(ACCEPTED_AT, true))).toBe(false);
    expect(setPassword.isNeeded(userWith(null, true))).toBe(false);
  });

  it('asks only for exactly false: a user object whose fact is absent or not a boolean does not need it', () => {
    for (const value of [undefined, null, 0, '', 'false']) {
      const user = { ...userWith(ACCEPTED_AT), passwordSet: value } as unknown as BasicUserData;
      expect(setPassword.isNeeded(user), `passwordSet ${JSON.stringify(value)}`).toBe(false);
    }
  });

  it('reads nothing of the user but the password fact', () => {
    const read: Array<string | symbol> = [];
    const user = new Proxy(userWith(null, false), {
      get(target, key, receiver) {
        read.push(key);
        return Reflect.get(target, key, receiver);
      }
    });

    expect(setPassword.isNeeded(user)).toBe(true);
    expect(read).toEqual(['passwordSet']);
  });
});

describe('the terms-of-use gate — needed until an acceptance is stored', () => {
  const termsOfUse = CONTESTANT_GATES.find((gate) => gate.id === 'termsOfUse')!;

  it('is needed when the acceptance is null', () => {
    expect(termsOfUse.isNeeded(userWith(null))).toBe(true);
  });

  it('is needed when the acceptance is undefined', () => {
    const user = userWith(null);
    delete (user as Partial<BasicUserData>).termsOfUseAccepted;

    expect(user.termsOfUseAccepted).toBeUndefined();
    expect(termsOfUse.isNeeded(user)).toBe(true);
  });

  it('is not needed for a stored acceptance time', () => {
    expect(termsOfUse.isNeeded(userWith(ACCEPTED_AT))).toBe(false);
  });
});

describe('firstNeededGate — the first needed entry wins', () => {
  it('returns the terms-of-use gate for a user with a password and no acceptance, from the shipped list', () => {
    expect(firstNeededGate(userWith(null))).toBe('termsOfUse');
  });

  it('returns the set-password gate for a user with neither a password nor an acceptance, from the shipped list', () => {
    expect(firstNeededGate(userWith(null, false))).toBe('setPassword');
  });

  it('returns the set-password gate for a user with an acceptance and no password, from the shipped list', () => {
    expect(firstNeededGate(userWith(ACCEPTED_AT, false))).toBe('setPassword');
  });

  it('returns null for a user with a password and an acceptance, from the shipped list', () => {
    expect(firstNeededGate(userWith(ACCEPTED_AT))).toBeNull();
  });

  it('returns the first entry when both of two are needed', () => {
    expect(firstNeededGate(userWith(null), [entry('first', true), entry('second', true)])).toBe('first');
  });

  it('returns the second entry when only the second is needed', () => {
    expect(firstNeededGate(userWith(null), [entry('first', false), entry('second', true)])).toBe('second');
  });

  it('returns null when no entry is needed', () => {
    expect(firstNeededGate(userWith(null), [entry('first', false), entry('second', false)])).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(firstNeededGate(userWith(null), [])).toBeNull();
  });

  it('hands each predicate the user it was given', () => {
    const user = userWith(ACCEPTED_AT);
    const seen: Array<BasicUserData> = [];
    const recording: ContestantGate = {
      id: 'termsOfUse',
      isNeeded: (given) => {
        seen.push(given);
        return false;
      }
    };

    firstNeededGate(user, [recording]);

    expect(seen).toEqual([user]);
    expect(seen[0]).toBe(user);
  });
});

describe('the user the gate list takes — the user-level data with the password fact', () => {
  it('takes the user-level data as every read returns it', () => {
    expectTypeOf(firstNeededGate).parameter(0).toEqualTypeOf<BasicUserData>();
    expectTypeOf<Parameters<ContestantGate['isNeeded']>[0]>().toEqualTypeOf<BasicUserData>();
  });

  it('does not take a user object without the password fact', () => {
    expectTypeOf<Omit<BasicUserData, 'passwordSet'>>().not.toMatchTypeOf<Parameters<typeof firstNeededGate>[0]>();
    expectTypeOf<Omit<BasicUserData, 'passwordSet'> & { passwordSet?: boolean }>().not.toMatchTypeOf<
      Parameters<typeof firstNeededGate>[0]
    >();
  });
});
