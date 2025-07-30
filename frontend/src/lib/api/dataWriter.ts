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
        `DataWriter imported when using an unsupported data adapter (${type}). Any attempts to use the dataWriter will fail.`
      );
      return { dataWriter: undefined };
    });
}

export const dataWriter = module.then((m) => m.dataWriter);
