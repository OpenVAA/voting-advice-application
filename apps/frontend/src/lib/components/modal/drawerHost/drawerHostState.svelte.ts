/**
 * The drawer of the mounted app, opened by handing it a payload.
 *
 * `DrawerHost.svelte` owns the only `<dialog>`. Each app that offers drawers mounts ONE host in its own root layout, below that app's context init — the voter app does so in `routes/(voters)/+layout.svelte`. Any component inside that app opens it with `drawerHost.open(payload)` and closes it with `drawerHost.close(key)`. Because the host sits below the app's contexts, the payload's component resolves every context it reads (e.g. the voter and filter contexts `EntityDetails` needs) without the opener capturing or re-providing any of them.
 *
 * Enabling drawers in another app (e.g. the candidate app) is a single `<DrawerHost />` in that app's root layout. One module-level state serves every app because only one app's layout is mounted at a time; `register` reports a second concurrent host, and `open` reports a call made where no host is mounted instead of doing nothing silently.
 *
 * Client-only by construction: `open` is only ever called from `$effect`s / event handlers, so this module-level singleton is never written during SSR (where it would leak across requests). The `browser` guard in `open` below turns that from a call-site convention into an enforced invariant.
 */

import { log } from '@openvaa/app-shared';
import { browser } from '$app/environment';
import type { Component } from 'svelte';

export interface DrawerPayload<TProps extends object = Record<string, unknown>> {
  /** Identifies the opener; `close(key)` only closes the drawer if it still shows this payload. */
  key: string;
  /** Accessible name of the dialog. A getter, so it can track reactive state of the opener. */
  title: () => string;
  /** The drawer's content. Rendered by the host, inside the app whose layout mounts it, so it resolves that app's contexts itself. */
  component: Component<TProps>;
  /** The component's props. A getter the host re-reads while rendering, so reactive state it reads (a latched entity, say) updates the open drawer in place without reopening it. */
  props: () => TProps;
  /** Called when the USER dismisses the drawer (close button, backdrop, Escape). Routed openers navigate here. */
  onDismiss?: () => void;
  /** The `data-testid` carried onto the host's dialog. */
  testId?: string;
}

/** The erased form of a payload the host stores and renders. Only `open` produces it. */
export type HostedDrawerPayload = DrawerPayload<Record<string, unknown>>;

let nextKey = 0;

class DrawerHostState {
  current = $state<HostedDrawerPayload | null>(null);

  /** The number of mounted `DrawerHost`s. Exactly one while an app with drawers is mounted, zero otherwise. */
  #hosts = 0;

  newKey = (prefix: string): string => `${prefix}-${++nextKey}`;

  open = <TProps extends object>(payload: DrawerPayload<TProps>): void => {
    // The doc-comment above states the client-only invariant; this guard ENFORCES it, so a future server-side caller cannot leak one request's payload into another request that shares this module scope (threat T-165-04).
    if (!browser) return;
    if (this.#hosts === 0)
      log.warn(
        `drawerHost.open('${payload.key}') was called, but no <DrawerHost /> is mounted: mount one in this app's root layout.`
      );
    // Sound: this signature has already checked that `props` returns what `component` accepts, and `Component` is contravariant in its props, so no cast-free widening exists.
    this.current = payload as unknown as HostedDrawerPayload;
  };

  close = (key?: string): void => {
    if (!key || this.current?.key === key) this.current = null;
  };

  /**
   * Called by `DrawerHost` at component init — before any opener's `$effect` can call `open` — and returns the unregister function for its teardown.
   *
   * A second concurrent host is reported rather than thrown on: two hosts would both show every payload, but an app's layout can briefly outlive a navigation into another app while its outro runs, and a throw there would break that navigation.
   */
  register = (): (() => void) => {
    if (this.#hosts > 0)
      log.warn(
        'A second <DrawerHost /> was mounted: mount exactly one, in the root layout of the app that offers drawers.'
      );
    this.#hosts++;
    return () => {
      this.#hosts--;
      if (this.#hosts === 0) this.current = null;
    };
  };
}

export const drawerHost = new DrawerHostState();
