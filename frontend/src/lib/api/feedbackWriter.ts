import { staticSettings } from '@openvaa/app-shared';
import type { UniversalFeedbackWriter } from './base/universalFeedbackWriter';

let module: Promise<{ feedbackWriter: UniversalFeedbackWriter }>;

const { type } = staticSettings.dataAdapter;

switch (type) {
  case 'strapi':
    module = import('./adapters/strapi/feedbackWriter');
    break;
  case 'local':
    module = import('./adapters/apiRoute/feedbackWriter');
    break;
  default:
    throw new Error(`Unsupported data adapter: ${type}`);
}

export const { feedbackWriter } = await module;
