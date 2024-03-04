import {getOpinionQuestions, getInfoQuestions, getNominatedCandidates} from '$lib/api/getData';
import type {LayoutServerLoad} from '../../../$types';

export const load = (async () => {
  // TODO: Get candidate data on the client side using the id in AuthContext
  return {
    opinionQuestions: await getOpinionQuestions(),
    infoQuestions: await getInfoQuestions(),
    candidates: await getNominatedCandidates({loadAnswers: true})
  };
}) satisfies LayoutServerLoad;
