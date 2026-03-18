import { staticSettings } from '@openvaa/app-shared';
import type { UniversalFeedbackWriter } from './base/universalFeedbackWriter';

let module: Promise<{ feedbackWriter: UniversalFeedbackWriter }>;

const { type } = staticSettings.dataAdapter;

// TODO: The adapter loading logic (switch on type) should be rewritten later.
switch (type) {
  case 'strapi':
    module = import('./adapters/strapi/feedbackWriter');
    break;
  case 'local':
    module = import('./adapters/apiRoute/feedbackWriter');
    break;
  case 'supabase':
    module = import('./adapters/supabase/feedbackWriter');
    break;
  default:
    throw new Error(`Unsupported data adapter: ${type}`);
}

export const feedbackWriter = module.then((m) => m.feedbackWriter);
