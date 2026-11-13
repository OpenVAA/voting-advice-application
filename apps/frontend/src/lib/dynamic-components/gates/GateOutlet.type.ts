import type { Component, Snippet } from 'svelte';

export type GateOutletProps = {
  /**
   * The id of the gate the protected layout's server load reported, or `null` or `undefined` when no gate applies.
   */
  gate: string | null | undefined;
  /**
   * The view of each gate of the app, keyed by its id.
   */
  views: Readonly<Record<string, Component>>;
  /**
   * The page, rendered when no gate applies.
   */
  children?: Snippet;
};
