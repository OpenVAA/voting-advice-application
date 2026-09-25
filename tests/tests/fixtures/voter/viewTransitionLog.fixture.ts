/**
 * @file viewTransitionLog fixture.
 *
 * Function-fixture that captures every document View Transition the application starts — with ZERO production instrumentation. Sibling in spirit to `../shared/trackingIntercept.fixture.ts`, whose whole shape (docblock naming the emission boundary, a local `declare global` augmentation, an install/read/clear surface, an async factory that installs before returning) this file copies.
 *
 * ## Emission boundary (VERIFIED)
 *
 * The application has exactly one door onto the browser's View-Transitions API: `startViewTransition` in `apps/frontend/src/lib/utils/viewTransition.ts`, which every call site goes through (the root layout's `onNavigate` hook, and `Tabs.svelte`'s `transitionOnChange` wrapper used by the entity-detail drawer). That helper ends in a single `document.startViewTransition(updateCallback)` call, so `document.startViewTransition` is the stable capture seam — the same relationship `window.umami.track` has to the analytics service.
 *
 * ## The one production fact this wrapper rests on — and why capture happens INSIDE it
 *
 * `viewTransition.ts` adds the name-stripping class to the document element BEFORE calling the browser's transition entry point:
 *
 * ```ts
 * const stripNames = !!document.querySelector('dialog[open]');
 * if (stripNames) root.classList.add(VT_NO_NAMES_CLASS);
 * const transition = document.startViewTransition(updateCallback);
 * ```
 *
 * So by the time this wrapper's body runs, `getComputedStyle(el).viewTransitionName` ALREADY reflects the stripped state, and the captured `names` list is the correct observable for "did this transition run with named groups". Capturing anywhere else — before the helper is entered, or after the transition resolves — inverts every assertion built on it: too early and the class is not yet on, too late and it has been removed by the `finished` handler.
 *
 * Note also that the stripping rule (`html.vt-no-names *`) selects DESCENDANTS only, so `<html>`'s own UA-assigned `root` group survives by design. The assertion the log supports is therefore "no NAMED groups", never "no groups".
 *
 * ## Surface
 *  - install()  — idempotent; (re)arm the `document.startViewTransition` wrapper via addInitScript. Called by the async factory; exposed so a caller can re-arm after a fresh context if needed.
 *  - read()     — read the captured `ViewTransitionCall[]` from the page.
 *  - clear()    — reset the captured-calls array in the page.
 *  - isSupported() — whether the page found a native `document.startViewTransition` at all, so a consuming spec can SKIP rather than FAIL on a browser without the API.
 *
 * **Rigidity contract**: no `expect.soft`, no `try/catch` wrapping `expect(...)`, no `.catch(() => null)` on assertion-bearing interactions. This fixture performs no assertions itself (it is a capture seam) — the consuming spec asserts against `read()`.
 */

import type { Page } from '@playwright/test';

/** One captured `document.startViewTransition` call, recorded at call time — i.e. after the application has already decided whether to strip names. */
export interface ViewTransitionCall {
  /** `location.pathname` at the moment the transition started. */
  url: string;
  /** Whether a modal `<dialog>` was open when the transition started. */
  dialogOpen: boolean;
  /** Whether the name-stripping class was on the document element when the transition started. */
  noNames: boolean;
  /** Every non-`none` computed `view-transition-name` found on an element inside `<body>` at call time. */
  names: Array<string>;
}

export interface ViewTransitionLogFixture {
  /** (Re)install the `document.startViewTransition` capture wrapper (idempotent). */
  install(): Promise<void>;
  /** Read the captured transition records from the page. */
  read(): Promise<Array<ViewTransitionCall>>;
  /** Reset the captured-records array in the page. */
  clear(): Promise<void>;
  /** Whether the page had a native `document.startViewTransition` to wrap. False means there is nothing to observe and the consuming spec must skip, not fail. */
  isSupported(): Promise<boolean>;
}

/**
 * Local window augmentation scoped to this fixture file (the captured-records array + the support flag). Kept local rather than in the global `.d.ts` because it is a test-only capture seam, not an app contract — the same reasoning `trackingIntercept.fixture.ts` gives for its own. Declared rather than cast: the tests workspace typechecks under the project's strict-TypeScript rule, so a `as any` on `document` would be a lint/typecheck violation, not a shortcut.
 */
declare global {
  interface Window {
    __vtCalls?: Array<ViewTransitionCall>;
    __vtSupported?: boolean;
  }
}

/**
 * Create the View-Transition log fixture bound to `page`.
 *
 * ASYNC because it calls `page.addInitScript` (which returns a Promise). The init-script runs in EVERY document the context creates, BEFORE any application script — so the wrapper is already in place the first time the root layout's `onNavigate` hook reaches `document.startViewTransition`.
 */
export async function createViewTransitionLog(page: Page): Promise<ViewTransitionLogFixture> {
  const fixture: ViewTransitionLogFixture = {
    async install(): Promise<void> {
      await page.addInitScript(() => {
        window.__vtCalls ||= [];
        // Capture the native entry point BEFORE replacing it, and bind it: `startViewTransition` is a method on `document` and loses its receiver when called off a detached reference.
        const native = document.startViewTransition?.bind(document);
        // Recorded so a consuming spec can distinguish "the app started no transition" from "this browser has no View-Transitions API", and skip rather than fail on the second.
        window.__vtSupported = typeof native === 'function';
        if (!native) return;
        // The replacement mirrors the native signature exactly (`lib.dom.d.ts`: `startViewTransition(callbackOptions?: ViewTransitionUpdateCallback | StartViewTransitionOptions): ViewTransition`) so no cast is needed anywhere in this file — the project's strict-TypeScript rule bans the loose alternative.
        document.startViewTransition = (
          callbackOptions?: ViewTransitionUpdateCallback | StartViewTransitionOptions
        ): ViewTransition => {
          const names: Array<string> = [];
          for (const el of document.body.querySelectorAll('*')) {
            const name = getComputedStyle(el).viewTransitionName;
            if (name && name !== 'none') names.push(name);
          }
          (window.__vtCalls ||= []).push({
            url: location.pathname,
            dialogOpen: !!document.querySelector('dialog[open]'),
            noNames: document.documentElement.classList.contains('vt-no-names'),
            names
          });
          // Delegate unchanged. The wrapper observes and forwards; it must not alter behaviour, or the consuming spec measures its own instrument rather than the application.
          return native(callbackOptions);
        };
      });
    },

    async read(): Promise<Array<ViewTransitionCall>> {
      return page.evaluate(() => window.__vtCalls ?? []);
    },

    async clear(): Promise<void> {
      await page.evaluate(() => {
        window.__vtCalls = [];
      });
    },

    async isSupported(): Promise<boolean> {
      return page.evaluate(() => window.__vtSupported === true);
    }
  };

  await fixture.install();
  return fixture;
}
