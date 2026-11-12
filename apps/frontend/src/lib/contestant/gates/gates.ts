import type { BasicUserData } from '$lib/api/base/dataWriter.type';

/**
 * # The Contestant App's gates
 *
 * A gate is something a signed-in user must do before any protected page of the Contestant App is shown to them. The protected layout's server load asks `firstNeededGate` which gate applies and, when one does, returns its id in place of the page data; the layout then renders that gate's view (see `gateViews.ts`) in place of the page.
 *
 * ## The contract
 *
 * 1. **The order of `CONTESTANT_GATES` is the order the gates are asked in, and the first needed one is the one shown.** The order lives in this array and nowhere else, so a gate is inserted ahead of another by adding one entry here and one view to `GATE_VIEWS`.
 * 2. **Each gate is decided on user-level data only.** A predicate receives the signed-in user's `BasicUserData` and nothing about the entity they edit, which is what lets the load decide the gates before it reads any entity. That data says whether the account has a password as a boolean on every read, so a user whose fact was not read cannot be given to the list.
 * 3. **The array and its entries are frozen.** The server load imports this module, so it is state shared by every concurrent request in the SSR module graph. There is no mutable binding in this file and no Svelte import: the views live in `gateViews.ts`, which only the layout imports.
 */

/**
 * The id of a gate. Every member has a view in `GATE_VIEWS`.
 */
export type ContestantGateId = 'setPassword' | 'termsOfUse';

/**
 * One entry of the gate list.
 */
export type ContestantGate = {
  /** The gate's id, which the server load returns and the layout maps to a view. */
  readonly id: ContestantGateId;
  /**
   * Whether this user must pass the gate before a protected page is shown.
   *
   * @param user - The signed-in user's user-level data.
   * @returns `true` when the gate's view must be shown.
   */
  readonly isNeeded: (user: BasicUserData) => boolean;
};

/**
 * Every gate of the Contestant App, in the order they are asked.
 */
export const CONTESTANT_GATES: ReadonlyArray<ContestantGate> = Object.freeze([
  Object.freeze({
    id: 'setPassword',
    // Exactly `false`: the gate is for an account the user-level data says has no password, and for no other answer.
    isNeeded: (user: BasicUserData) => user.passwordSet === false
  }),
  Object.freeze({
    id: 'termsOfUse',
    // Any stored acceptance counts: the value is the time the database stamped, and its presence is the acceptance.
    isNeeded: (user: BasicUserData) => user.termsOfUseAccepted == null
  })
]);

/**
 * The id of the first gate the user must pass, or `null` when none applies.
 *
 * Performs no I/O and holds no state between calls.
 *
 * @param user - The signed-in user's user-level data.
 * @param gates - The gates to evaluate, in order. Defaults to `CONTESTANT_GATES`.
 * @returns The id of the first entry whose `isNeeded` is true for the user, or `null`.
 */
export function firstNeededGate(
  user: BasicUserData,
  gates: ReadonlyArray<ContestantGate> = CONTESTANT_GATES
): ContestantGateId | null {
  return gates.find((gate) => gate.isNeeded(user))?.id ?? null;
}
