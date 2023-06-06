import {browser} from '$app/environment';
import {error} from '@sveltejs/kit';
import '$lib/i18n';
import {locale, waitLocale} from 'svelte-i18n';
import type {LayoutLoad} from './$types';
import {getSingleTypeData} from '../api/getData';

export const load: LayoutLoad = (async ({fetch, params, route, url}) => {
  if (browser) {
    locale.set(window.navigator.language);
  }

  await waitLocale();
  const layoutSingleType = await getSingleTypeData({url, fetch, endpoint: 'api/layout?populate=*'})
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.error('Error in getting layout data from Strapi: ', ' - - - ', error);
    });

  if (layoutSingleType.error) {
    console.error('layoutSingleType error', layoutSingleType.error);
    throw error(layoutSingleType.error.status, {message: layoutSingleType.error.message});
  }

  return layoutSingleType.data;
}) satisfies LayoutLoad;
