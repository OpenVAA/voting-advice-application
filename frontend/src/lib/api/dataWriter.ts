import { staticSettings } from '@openvaa/app-shared';
import { logDebugError } from '$lib/utils/logger';
import type { UniversalDataWriter } from './base/universalDataWriter';

let module: Promise<{ dataWriter: UniversalDataWriter }>;

const { type } = staticSettings.dataAdapter;

switch (type) {
  case 'strapi':
    module = import('./adapters/strapi/dataWriter');
    break;
  default:
    module = new Promise(() => {
      logDebugError(
        `[dataWriter] DataWriter imported when using an unsupported data adapter (${type}). Any attempts to use the dataWriter will fail. This will only be a problem if the Admin or Candidate Apps are used with this adapter. If only the Voter App is to be used, you may disregard this warning.`
      );
      return { dataWriter: undefined };
    });
}

export const dataWriter = module.then((m) => m.dataWriter);
