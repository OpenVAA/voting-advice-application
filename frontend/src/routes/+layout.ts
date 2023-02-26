import {browser} from '$app/environment';
import '../utils/i18n.ts';
import {locale, waitLocale} from 'svelte-i18n';
import type {LayoutLoad} from './$types';

export const load: LayoutLoad = async () => {
  if (browser) {
    locale.set(window.navigator.language);
  }
  await waitLocale();
};
