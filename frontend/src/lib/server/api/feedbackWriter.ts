import { staticSettings } from '@openvaa/app-shared';
import type { FeedbackWriter } from '$lib/api/base/feedbackWriter.type';

let module: Promise<{ feedbackWriter?: FeedbackWriter }>;

const { type } = staticSettings.dataAdapter;

switch (type) {
  case 'local':
    module = import('./adapters/local/feedbackWriter');
    break;
  default:
    module = Promise.resolve({});
}

export const { feedbackWriter } = await module;
