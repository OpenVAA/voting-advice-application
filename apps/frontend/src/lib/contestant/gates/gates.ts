import type { BasicUserData } from '$lib/api/base/dataWriter.type';

/**
 * # The Contestant App's gates
 *
 * A gate is something a signed-in user must do before any protected page of the Contestant App is shown to them. The protected layout's server load asks `firstNeededGate` which gate applies and, when one does, returns its id in place of the page data; the layout then renders that gate's view (see `gateViews.ts`) in place of the page.
 *
 * ## The contract
 *
 * 1. **The order of `CONTESTANT_GATES` is the order the gates are asked in, and the first needed one is the one shown.** The order lives in this array and nowhere else, so a gate is inserted ahead of another by adding one entry here and one view to `GATE_VIEWS`.
 * 2. **Each gate is decided on the user-level data and on two facts of the request, never on an entity.** A predicate receives `ContestantGateFacts`: the signed-in user's `BasicUserData`, the arrival marker the identity provider's callback left and whether answers are locked. Nothing about the entity the user edits is among them, which is what lets the load decide the gates before it reads any entity. The user-level data says whether the account has a password as a boolean, and what state its address is in, on every read, so a user whose facts were not read cannot be given to the list.
 * 3. **The arrival marker only ever adds a gate.** It is a cookie the browser's owner can set or delete, so no predicate reads it in a way that lets it remove a gate the user-level data asks for.
 * 4. **The array and its entries are frozen.** The server load imports this module, so it is state shared by every concurrent request in the SSR module graph. There is no mutable binding in this file and no Svelte import: the views live in `gateViews.ts`, which only the layout imports.
 */

/**
 * The id of a gate. Every member has a view in `GATE_VIEWS`.
 */
export type ContestantGateId = 'setPassword' | 'identityProvider' | 'termsOfUse';

/**
 * Whether the identity provider's callback made the account (`created`) or found one (`existing`), as its httpOnly marker says; `null` when no marker is present.
 */
export type IdentityProviderArrival = 'created' | 'existing' | null;

/**
 * What every gate is decided on: the signed-in user's user-level data and two facts of the request.
 */
export type ContestantGateFacts = {
  /** The signed-in user's user-level data. */
  readonly user: BasicUserData;
  /** The arrival marker the identity provider's callback left, read from its cookie. */
  readonly arrival: IdentityProviderArrival;
  /** Whether the project's answers are locked. */
  readonly answersLocked: boolean;
};

/**
 * One entry of the gate list.
 */
export type ContestantGate = {
  /** The gate's id, which the server load returns and the layout maps to a view. */
  readonly id: ContestantGateId;
  /**
   * Whether this user must pass the gate before a protected page is shown.
   *
   * @param facts - The user-level data and the two facts of the request.
   * @returns `true` when the gate's view must be shown.
   */
  readonly isNeeded: (facts: ContestantGateFacts) => boolean;
};

/**
 * Every gate of the Contestant App, in the order they are asked.
 */
export const CONTESTANT_GATES: ReadonlyArray<ContestantGate> = Object.freeze([
  Object.freeze({
    id: 'setPassword',
    // Exactly `false`: the gate is for an account the user-level data says has no password, and for no other answer.
    // And only on a proved address: an account an identity provider made has no password, and until its holder proves an address of their own it is asked for that address first.
    isNeeded: ({ user }: ContestantGateFacts) => user.passwordSet === false && user.addressState === 'proved'
  }),
  Object.freeze({
    id: 'identityProvider',
    // Three reasons, any one of which asks: no address to sign in with; the identity's own party has no name and answers are not locked, so the name can still be typed; and, once after the provider found the account, a notice for an account that has given an address.
    isNeeded: ({ user, arrival, answersLocked }: ContestantGateFacts) =>
      user.addressState === 'none' ||
      (user.ownOrganizationUnnamed === true && answersLocked !== true) ||
      (arrival === 'existing' && (user.addressState === 'pending' || user.addressState === 'proved'))
  }),
  Object.freeze({
    id: 'termsOfUse',
    // Any stored acceptance counts: the value is the time the database stamped, and its presence is the acceptance.
    isNeeded: ({ user }: ContestantGateFacts) => user.termsOfUseAccepted == null
  })
]);

/**
 * The id of the first gate the user must pass, or `null` when none applies.
 *
 * Performs no I/O and holds no state between calls.
 *
 * @param facts - The user-level data and the two facts of the request.
 * @param gates - The gates to evaluate, in order. Defaults to `CONTESTANT_GATES`.
 * @returns The id of the first entry whose `isNeeded` is true for the facts, or `null`.
 */
export function firstNeededGate(
  facts: ContestantGateFacts,
  gates: ReadonlyArray<ContestantGate> = CONTESTANT_GATES
): ContestantGateId | null {
  return gates.find((gate) => gate.isNeeded(facts))?.id ?? null;
}
