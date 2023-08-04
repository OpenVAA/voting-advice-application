// hooks.server.ts
import type {Handle} from '@sveltejs/kit';
import type {HandleServerError} from '@sveltejs/kit';
import {locale, _} from 'svelte-i18n';

export const handle: Handle = (async ({event, resolve}) => {
  const lang = event.request.headers.get('accept-language')?.split(',')[0];
  if (lang) {
    locale.set(lang);
  }
  return resolve(event);
}) satisfies Handle;

export const handleError = (async ({error}) => {
  console.error('Handled error: ', error);
  return {
    message: 'Internal Error'
  };
}) satisfies HandleServerError;
