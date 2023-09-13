import {getData} from '$lib/api/getData';
import {error} from '@sveltejs/kit';
import type {ServerLoadEvent} from '@sveltejs/kit';
import type {PageServerLoad} from './$types';

export const load = (async ({params}: ServerLoadEvent) => {
  //TODO: Check if we use Svelte object id or some predefined schema for getting candidate from the backend
  const id = Number(params.slug);
  if (!isNaN(id)) {
    const candidate = await getData(
      `api/candidates/${id}`,
      new URLSearchParams({populate: '*'})
    ).then((result) => {
      if (result?.data?.attributes) return result.data;
      if (result?.error?.status === 404) {
        throw error(404, 'Candidate not found');
      }
    });
    const questionCategories = await getData(
      'api/question-categories',
      new URLSearchParams({populate: '*'})
    ).then((result) => {
      if (result?.data) return result.data;
      if (result?.error?.status === 404) {
        throw error(404, 'Question Categories not found');
      }
    });
    return {candidate, questionCategories};
  } else {
    throw error(404, 'There is some error fetching candidate or Question Categories');
  }
}) satisfies PageServerLoad;
