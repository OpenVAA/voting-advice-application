import type { BasicUserData } from '$lib/api/base/dataWriter.type';

/**
 * # Gates
 *
 * A gate is something a signed-in user must do before any protected page of an app is shown to them. Each app keeps its own ordered list of gates; its protected layout's server load asks `firstNeededGate` which gate of that list applies and, when one does, returns its id in place of the page data, and the layout renders that gate's view in place of the page.
 *
 * ## The contract
 *
 * 1. **The order of a list is the order its gates are asked in, and the first needed one is the one shown.** `firstNeededGate` has no default list: every caller names its own.
 * 2. **Each predicate reads user-level data, and facts of the request the list's own facts type adds, never an entity.** Every facts type extends `UserGateFacts`, so a load decides the gates before it reads any entity, and a caller cannot ask a list about a user whose password fact was never read.
 * 3. **The entries are frozen.** The server loads import this module, so it is state shared by every concurrent request in the SSR module graph. There is no mutable binding in this file and no Svelte import: the views live with each app's own record of them, which only its layout imports.
 */

/**
 * What every gate is decided on: the signed-in user's user-level data. An app's list may extend it with facts of the request.
 */
export type UserGateFacts = {
  /** The signed-in user's user-level data. */
  readonly user: BasicUserData;
};

/**
 * One entry of a gate list.
 */
export type Gate<TId extends string, TFacts extends UserGateFacts> = {
  /** The gate's id, which the server load returns and the layout maps to a view. */
  readonly id: TId;
  /**
   * Whether this user must pass the gate before a protected page is shown.
   *
   * @param facts - The user-level data and any facts of the request the list's facts type adds.
   * @returns `true` when the gate's view must be shown.
   */
  readonly isNeeded: (facts: TFacts) => boolean;
};

/**
 * The id of the first gate of a list the user must pass, or `null` when none applies.
 *
 * Performs no I/O and holds no state between calls.
 *
 * @param facts - The facts the gates are decided on.
 * @param gates - The gates to evaluate, in the order they are asked.
 * @returns The id of the first entry whose `isNeeded` is true for the facts, or `null`.
 */
export function firstNeededGate<TId extends string, TFacts extends UserGateFacts>(
  facts: TFacts,
  gates: ReadonlyArray<Gate<TId, TFacts>>
): TId | null {
  return gates.find((gate) => gate.isNeeded(facts))?.id ?? null;
}

/**
 * The gate that asks a user whose account has no password to choose one. Both apps ask it first.
 */
export const SET_PASSWORD_GATE: Gate<'setPassword', UserGateFacts> = Object.freeze({
  id: 'setPassword',
  // Exactly `false`: the gate is for an account the user-level data says has no password, and for no other answer.
  // And only on a proved address: an account an identity provider made has no password, and until its holder proves an address of their own it is asked for that address first.
  isNeeded: ({ user }: UserGateFacts) => user.passwordSet === false && user.addressState === 'proved'
});
