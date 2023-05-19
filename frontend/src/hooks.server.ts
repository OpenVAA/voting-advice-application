// hooks.server.ts
import {browser} from '$app/environment';
import {constants} from './utils/constants';
import type {Handle, HandleFetch} from '@sveltejs/kit';
import {locale} from 'svelte-i18n';

export const handle: Handle = (async ({event, resolve}) => {
  const lang = event.request.headers.get('accept-language')?.split(',')[0];
  if (lang) {
    locale.set(lang);
  }
  return resolve(event);
}) satisfies Handle;

export const handleFetch: HandleFetch = (async ({request, fetch}) => {
  if (!browser) {
    request = new Request(
      request.url.replace(constants.BACKEND_URL, constants.BACKEND_URL_DOCKER),
      request
    );
  }
  return fetch(request);
}) satisfies HandleFetch;
