import {sessionStorageWritable} from '$lib/utils/storage';

export const firstQuestionId = sessionStorageWritable<string | undefined>(
  'firstQuestionId',
  undefined
);
