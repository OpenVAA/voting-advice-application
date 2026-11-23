/**
 * `AppLogo`, mounted against a fake app context, for which logo it shows: the backend's publisher logo, otherwise the static `staticSettings.logo`, otherwise the OpenVAA logo; and for the `alt` text each tier gives.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as AppShared from '@openvaa/app-shared';

type Logo = { url?: string; urlDark?: string };

const { box, context } = vi.hoisted(() => {
  const box = {
    publisherLogo: undefined as Logo | undefined,
    publisherName: undefined as string | undefined,
    staticLogo: undefined as Logo | undefined,
    dark: false
  };
  const context = {
    t: (key: string) => key,
    appCustomization: {
      get current() {
        return { publisherLogo: box.publisherLogo, publisherName: box.publisherName };
      }
    },
    darkMode: {
      get current() {
        return box.dark;
      }
    }
  };
  return { box, context };
});

vi.mock('$lib/contexts/app', () => ({ getAppContext: () => context }));
vi.mock('@openvaa/app-shared', async (importActual) => {
  const actual = await importActual<typeof AppShared>();
  return {
    ...actual,
    staticSettings: {
      ...actual.staticSettings,
      get logo() {
        return box.staticLogo;
      }
    }
  };
});

const AppLogo = (await import('./AppLogo.svelte')).default;

describe('AppLogo — the logo tier and its alt text', () => {
  let target: HTMLElement;
  let component: ReturnType<typeof mount> | undefined;

  beforeEach(() => {
    target = document.createElement('div');
    document.body.appendChild(target);
    box.publisherLogo = undefined;
    box.publisherName = undefined;
    box.staticLogo = undefined;
    box.dark = false;
  });

  afterEach(() => {
    if (component) unmount(component);
    component = undefined;
    target.remove();
  });

  function render(props: Record<string, unknown> = {}): HTMLImageElement | null {
    component = mount(AppLogo, { target, props });
    flushSync();
    return target.querySelector('img');
  }

  it('shows the publisher logo over the static logo', () => {
    box.publisherLogo = { url: '/db.png' };
    box.staticLogo = { url: '/static.png' };
    expect(render()?.getAttribute('src')).toBe('/db.png');
  });

  it('shows the static logo in light mode when there is no publisher logo', () => {
    box.staticLogo = { url: '/static.png', urlDark: '/static-dark.png' };
    expect(render()?.getAttribute('src')).toBe('/static.png');
  });

  it('shows the static dark logo in dark mode', () => {
    box.staticLogo = { url: '/static.png', urlDark: '/static-dark.png' };
    box.dark = true;
    expect(render()?.getAttribute('src')).toBe('/static-dark.png');
  });

  it('shows the static dark logo for an inverse logo in light mode', () => {
    box.staticLogo = { url: '/static.png', urlDark: '/static-dark.png' };
    expect(render({ inverse: true })?.getAttribute('src')).toBe('/static-dark.png');
  });

  it('falls through to the static logo when the publisher logo has no url', () => {
    box.publisherLogo = {};
    box.staticLogo = { url: '/static.png' };
    expect(render()?.getAttribute('src')).toBe('/static.png');
  });

  it('shows the OpenVAA logo when neither logo is set', async () => {
    expect(render()).toBeNull();
    await vi.waitFor(() => expect(target.querySelector('svg')).not.toBeNull());
  });

  it('names a static logo with the application name when nothing else names it', () => {
    box.staticLogo = { url: '/static.png' };
    expect(render()?.getAttribute('alt')).toBe('dynamic.appName');
  });

  it('names a static logo with the publisher name when there is one', () => {
    box.staticLogo = { url: '/static.png' };
    box.publisherName = 'Pub';
    expect(render()?.getAttribute('alt')).toBe('Pub');
  });

  it('names a static logo with the alt prop when it is given', () => {
    box.staticLogo = { url: '/static.png' };
    box.publisherName = 'Pub';
    expect(render({ alt: 'Given' })?.getAttribute('alt')).toBe('Given');
  });

  it('keeps the empty alt of a publisher logo with no publisher name', () => {
    box.publisherLogo = { url: '/db.png' };
    box.staticLogo = { url: '/static.png' };
    expect(render()?.getAttribute('alt')).toBe('');
  });
});
