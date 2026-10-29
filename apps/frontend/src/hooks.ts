/* eslint-disable func-style -- SvelteKit hooks use typed const exports by convention */
import { deLocalizeUrl } from '$lib/paraglide/runtime';
import type { Reroute } from '@sveltejs/kit';

export const reroute: Reroute = (request) => {
  return deLocalizeUrl(request.url).pathname;
};
