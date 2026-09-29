import { describe, expect, it } from 'vitest';
import { COOKIE } from './index';

/**
 * Unit spec for the cookie-name declaration module.
 *
 * The module exists to make two mistakes impossible rather than merely unlikely: two files disagreeing about how a cookie is spelled, and two different cookies quietly ending up with the same name. The first is caught at the call sites, because every site imports the name from here; the second cannot be caught there at all, because a collision is a property of the map as a whole and no single call site can see it. That is what this file checks.
 *
 * The collision check is paired with a positive control on a deliberately colliding map, so a passing run on the real map means the detector answered the question rather than that it is incapable of answering it.
 */

/**
 * Group the map's keys by the wire name they claim, and describe every name claimed more than once.
 *
 * Returns one sentence per collision, naming EVERY key involved in it, because the useful thing to know when this fires is which two declarations to reconcile, not merely that a duplicate exists.
 */
function describeCollisions(map: Readonly<Record<string, string>>): Array<string> {
  const keysByName = new Map<string, Array<string>>();
  for (const [key, name] of Object.entries(map)) {
    const keys = keysByName.get(name) ?? [];
    keys.push(key);
    keysByName.set(name, keys);
  }
  return [...keysByName.entries()]
    .filter(([, keys]) => keys.length > 1)
    .map(([name, keys]) => `${keys.join(' and ')} both name the cookie '${name}'`);
}

describe('COOKIE — the cookie names this application chooses', () => {
  it('gives every cookie a name no other cookie has', () => {
    // The message carries the collision itself, so a failing run says which two keys to reconcile instead of only that a count was wrong.
    expect(
      describeCollisions(COOKIE),
      'Two keys in the cookie map claim the same wire name. Two cookies sharing a name are one cookie: whichever is written second overwrites the first, and the reader of the first silently gets the second value.'
    ).toEqual([]);
    expect(new Set(Object.values(COOKIE)).size).toBe(Object.keys(COOKIE).length);
  });

  it('names every colliding key when two entries share a name', () => {
    // The positive control. Without it, the assertion above could pass because the detector never detects anything.
    const collided = describeCollisions({
      idToken: 'id_token',
      oidcState: 'oidc_state',
      legacyIdToken: 'id_token'
    });
    expect(collided).toHaveLength(1);
    expect(collided[0]).toContain('idToken');
    expect(collided[0]).toContain('legacyIdToken');
    expect(collided[0]).toContain('id_token');
  });

  it('is frozen, so a name cannot be added or changed at runtime', () => {
    expect(Object.isFrozen(COOKIE)).toBe(true);
    const mutable = COOKIE as unknown as Record<string, string>;
    try {
      mutable.plantedName = 'planted_value';
    } catch {
      // A strict-mode write to a frozen object throws; a sloppy-mode one is silently dropped. Both outcomes satisfy the invariant, and the assertion below is what actually decides it.
    }
    expect(Object.keys(COOKIE)).not.toContain('plantedName');
  });

  it('declares exactly the four names the application writes', () => {
    expect(Object.values(COOKIE).sort()).toEqual(['id_token', 'oidc_code_verifier', 'oidc_nonce', 'oidc_state']);
  });
});
